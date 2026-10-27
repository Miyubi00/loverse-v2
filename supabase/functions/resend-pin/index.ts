// supabase/functions/resend-pin/index.ts
// Kirim ulang PIN dashboard — DUA TAHAP DENGAN KONFIRMASI PEMILIK.
//
// Kenapa dua tahap: email + tanggal pernikahan hanyalah PENGETAHUAN (bisa
// diketahui tamu/kenalan). Jika permintaan langsung mengganti PIN, orang
// yang "tahu data" bisa membanjiri inbox pemilik dan mengganti PIN terus-
// menerus. Maka:
//
// TAHAP 1 (minta): POST { email, wedding_date, captcha_token }
//   -> cari pesanan lunas yang cocok -> SIMPAN TOKEN (hash SHA-256, berlaku
//      30 menit, sekali pakai) -> kirim email KONFIRMASI ke email pemilik
//      yang tersimpan di pesanan. TIDAK ADA PIN yang berubah di tahap ini.
// TAHAP 2 (konfirmasi): POST { token, action: 'confirm' | 'cancel' }
//   -> dipanggil dari link di email konfirmasi (halaman web).
//      - confirm: regenerate PIN semua pesanan yang cocok + kirim email PIN.
//      - cancel : tandai token terpakai (revoke), tidak mengubah apa pun.
//   Tanpa captcha (bukti kepemilikan = token dari inbox, 256-bit acak).
// Abaikan email -> token kedaluwarsa sendiri setelah 30 menit.
//
// Keamanan:
// - Token 256-bit CSPRNG; DB hanya menyimpan hash SHA-256.
// - Update "digunakan" bersifat kondisional (used_at IS NULL) -> aman dari
//   dobel-klik/race.
// - Rate limit tahap 1 (fail-closed): min. jeda 60 dtk/email, 3/jam/email,
//   10/jam/IP.
// - Anti-enumerasi: respons SELALU generik, apakah data cocok atau tidak.
// - Hanya order lunas (payment_status = 'success') yang diproses.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateUniquePin } from '../_shared/pin.ts'
import { sendResendPinEmail, sendResendConfirmEmail } from '../_shared/resendPinEmail.ts'
import { reportError } from '../_shared/monitoring.ts'
import { handleCorsPreflight, jsonCors } from '../_shared/cors.ts'

/* --- RATE LIMITING tahap 1 (anti-spam & anti-enumerasi) ---
 * Basis data: tabel public.pin_resend_attempts — lihat migrasi
 * 20260917000000 & 20260918000000. Fail-closed bila tabel belum ada.
 */
const MIN_INTERVAL_MS = 60 * 1000 // jeda minimal antar permintaan per email
const MAX_PER_EMAIL_PER_HOUR = 3
const MAX_PER_IP_PER_HOUR = 10
const WINDOW_MS = 60 * 60 * 1000 // jendela 1 jam
const MAX_ORDERS_PER_REQUEST = 5 // batas pesanan yang diproses sekali kirim
const TOKEN_TTL_MS = 30 * 60 * 1000 // umur token konfirmasi: 30 menit

const GENERIC_OK =
  'Jika email dan tanggal pernikahan cocok dengan pesanan lunas, email konfirmasi telah dikirim ke email pemesanan tersebut. Silakan cek inbox (dan folder spam).'
const RATE_LIMIT_MSG =
  'Terlalu sering meminta PIN. Silakan tunggu beberapa saat lalu coba lagi.'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/ // format kolom date Postgres (YYYY-MM-DD)
const TOKEN_RE = /^[A-Za-z0-9_-]{40,64}$/ // token base64url 32 byte

type SupabaseAdmin = ReturnType<typeof createClient>

function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return req.headers.get('x-real-ip') ?? req.headers.get('cf-connecting-ip') ?? 'unknown'
}

class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
    this.name = 'HttpError'
  }
}

/** Verifikasi captcha Turnstile bila secret dikonfigurasi (pola create-order). */
async function verifyCaptcha(
  captchaToken: unknown,
  ip: string,
): Promise<void> {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY')
  if (!secret) return
  if (!captchaToken || typeof captchaToken !== 'string') {
    throw new HttpError(400, 'Verifikasi keamanan (Captcha) diperlukan.')
  }
  const form = new URLSearchParams()
  form.append('secret', secret)
  form.append('response', captchaToken)
  if (ip && ip !== 'unknown') form.append('remoteip', ip)
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
    const outcome = (await res.json()) as { success?: boolean }
    if (!outcome.success) {
      throw new HttpError(400, 'Verifikasi keamanan (Captcha) tidak valid atau telah kedaluwarsa.')
    }
  } catch (err) {
    if (err instanceof HttpError) throw err
    console.error('[resend-pin] Gagal memverifikasi Turnstile:', err)
    throw new HttpError(400, 'Gagal memverifikasi keamanan Captcha. Silakan coba lagi.')
  }
}

/** Token acak 256-bit, base64url (tanpa padding) — hanya dikirim via email. */
function generateResetToken(): string {
  const buf = new Uint8Array(32)
  crypto.getRandomValues(buf)
  let binary = ''
  for (const b of buf) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Hash SHA-256 (hex) — inilah satu-satunya yang disimpan ke DB. */
async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** URL dasar untuk link konfirmasi di email. */
function appBaseUrl(): string {
  return Deno.env.get('APP_URL')?.replace(/\/+$/, '') || 'https://loverse.id'
}

interface ResendOrder {
  email: string | null
  groom_name: string
  bride_name: string
  wedding_date: string
  whatsapp: string
  template_slug: string
  price: number
  midtrans_order_id: string | null
  id: string
  created_at?: string
  event_details: Record<string, unknown> | null
}

const ORDER_COLS =
  'id, groom_name, bride_name, wedding_date, whatsapp, email, template_slug, price, event_details, midtrans_order_id, created_at'

/** Regenerate PIN semua pesanan yang cocok lalu kirim email PIN baru. */
async function refreshAndEmailAll(orders: ResendOrder[]): Promise<number> {
  // Client dibuat inline (bukan tipe param) agar generic DB-nya permisif —
  // pola yang sama dengan file function lain di repo ini.
  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )
  let sent = 0
  for (const order of orders) {
    // Lewati pesanan tanpa email tersimpan (tidak mungkin dikirimi PIN).
    if (!order.email || !EMAIL_RE.test(order.email)) continue
    const pin = await generateUniquePin(admin, order.whatsapp)

    const { error: updateError } = await admin
      .from('orders')
      .update({ pin_code: pin })
      .eq('id', order.id)
    if (updateError) throw new Error(`Gagal memperbarui PIN: ${updateError.message}`)

    const evt = (order.event_details || {}) as Record<string, unknown>
    const emailResult = await sendResendPinEmail({
      to: order.email,
      groomName: order.groom_name,
      brideName: order.bride_name,
      pin,
      weddingDate: order.wedding_date,
      templateName: (evt.template_name as string) || order.template_slug,
    })
    if (!emailResult.ok) {
      console.error(`[resend-pin] Email PIN gagal untuk order ${order.id}: ${emailResult.error}`)
      void reportError(new Error(`Email PIN gagal: ${emailResult.error}`), {
        fn: 'resend-pin',
        orderId: order.id,
      })
    } else {
      sent += 1
    }
  }
  return sent
}

serve(async (req) => {
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight

  const ip = getClientIp(req)

  try {
    if (req.method !== 'POST') {
      return jsonCors(req, { error: 'Metode tidak diizinkan.' }, 405)
    }

    const body = (await req.json().catch(() => ({}))) as {
      email?: unknown
      wedding_date?: unknown
      captcha_token?: unknown
      token?: unknown
      action?: unknown
    }

    // ---- TAHAP 2: konfirmasi / batal (dari link di email) ----
    if (body.token) {
      return await handleTokenAction(body.token, body.action, ip)
    }

    // ---- TAHAP 1: permintaan kirim ulang ----
    return await handleRequest(body, ip)
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonCors(req, { error: error.message }, error.status)
    }
    console.error('[resend-pin] Error:', error)
    void reportError(error, { fn: 'resend-pin' })
    return jsonCors(req, { error: 'Terjadi kesalahan sistem. Silakan coba lagi.' }, 500)
  }
})

/** TAHAP 1: validasi, rate limit, simpan token, kirim email konfirmasi. */
async function handleRequest(
  body: { email?: unknown; wedding_date?: unknown; captcha_token?: unknown },
  ip: string,
): Promise<Response> {
  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )
  const emailIn = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const dateIn = typeof body.wedding_date === 'string' ? body.wedding_date.trim() : ''

  if (!EMAIL_RE.test(emailIn)) {
    throw new HttpError(400, 'Format email tidak valid.')
  }
  if (!DATE_RE.test(dateIn)) {
    throw new HttpError(400, 'Tanggal pernikahan tidak valid.')
  }
  // Tolak tanggal yang tidak ada di kalender (mis. 2026-02-30).
  const parsedDate = new Date(`${dateIn}T00:00:00Z`)
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== dateIn) {
    throw new HttpError(400, 'Tanggal pernikahan tidak valid.')
  }

  await verifyCaptcha(body.captcha_token, ip)

  // --- RATE LIMIT (fail-closed: cek dulu, catat setelahnya) ---
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString()

  const [lastAttempt, emailHourly, ipHourly] = await Promise.all([
    admin
      .from('pin_resend_attempts')
      .select('attempted_at')
      .eq('email', emailIn)
      .order('attempted_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('pin_resend_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('email', emailIn)
      .gte('attempted_at', windowStart),
    admin
      .from('pin_resend_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('attempted_at', windowStart),
  ])

  if (lastAttempt.error || emailHourly.error || ipHourly.error) {
    console.error(
      '[resend-pin] Rate limit tidak terbaca:',
      lastAttempt.error?.message || emailHourly.error?.message || ipHourly.error?.message,
    )
    throw new HttpError(503, RATE_LIMIT_MSG)
  }

  if (lastAttempt.data) {
    const elapsed = Date.now() - new Date(lastAttempt.data.attempted_at).getTime()
    if (elapsed < MIN_INTERVAL_MS) {
      throw new HttpError(429, RATE_LIMIT_MSG)
    }
  }
  if ((emailHourly.count ?? 0) >= MAX_PER_EMAIL_PER_HOUR) {
    throw new HttpError(429, RATE_LIMIT_MSG)
  }
  if ((ipHourly.count ?? 0) >= MAX_PER_IP_PER_HOUR) {
    throw new HttpError(429, RATE_LIMIT_MSG)
  }

  // --- CARI PESANAN LUNAS DENGAN EMAIL + TANGGAL PERNIKAHAN COCOK ---
  const { data: orders, error: orderError } = await admin
    .from('orders')
    .select(ORDER_COLS)
    .ilike('email', emailIn)
    .eq('wedding_date', dateIn)
    .eq('payment_status', 'success')
    .order('created_at', { ascending: false })
    .limit(MAX_ORDERS_PER_REQUEST)

  if (orderError) throw new Error(`Gagal membaca order: ${orderError.message}`)

  const matches = (orders ?? []) as ResendOrder[]
  const ownerEmail = matches.find((o) => o.email && EMAIL_RE.test(o.email))?.email

  await recordRequestAttempt(emailIn, ip, Boolean(ownerEmail))

  if (!ownerEmail) {
    // Tidak ada yang cocok -> TIDAK mengirim apa pun; balasan tetap generik.
    return jsonCors(req, { ok: true, message: GENERIC_OK }, 200)
  }

  // --- BUAT TOKEN & KIRIM EMAIL KONFIRMASI (PIN belum diubah!) ---
  const token = generateResetToken()
  const tokenHash = await sha256Hex(token)
  const first = matches[0]!
  const evt = (first.event_details || {}) as Record<string, unknown>

  const { error: insertError } = await admin.from('pin_reset_tokens').insert({
    token_hash: tokenHash,
    email: ownerEmail,
    wedding_date: dateIn,
    ip_address: ip,
    expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
  })
  if (insertError) throw new Error(`Gagal menyimpan token: ${insertError.message}`)

  const base = appBaseUrl()
  const emailResult = await sendResendConfirmEmail({
    to: ownerEmail,
    groomName: first.groom_name,
    brideName: first.bride_name,
    weddingDate: first.wedding_date,
    templateName: (evt.template_name as string) || first.template_slug,
    confirmUrl: `${base}/forgot-pin/confirm?token=${encodeURIComponent(token)}&action=confirm`,
    cancelUrl: `${base}/forgot-pin/confirm?token=${encodeURIComponent(token)}&action=cancel`,
  })
  if (!emailResult.ok) {
    console.error(`[resend-pin] Email konfirmasi gagal: ${emailResult.error}`)
    void reportError(new Error(`Email konfirmasi gagal: ${emailResult.error}`), { fn: 'resend-pin' })
  }

  // Balasan SELALU generik — jangan bocorkan pesanan ada/tidak.
  return jsonCors(req, { ok: true, message: GENERIC_OK }, 200)
}

async function recordRequestAttempt(email: string, ip: string, success: boolean): Promise<void> {
  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    await admin.from('pin_resend_attempts').insert({
      email,
      ip_address: ip,
      success,
    })
  } catch (e) {
    console.error('[resend-pin] Gagal mencatat percobaan:', e)
  }
}

/**
 * TAHAP 2: aksi dari link email konfirmasi.
 * - confirm : regenerate PIN + kirim email PIN baru (sekali pakai).
 * - cancel  : revoke token (tandai terpakai) tanpa mengubah PIN.
 * Token tidak valid/kedaluwarsa/terpakai -> status 'invalid' (generik).
 */
async function handleTokenAction(
  token: unknown,
  action: unknown,
  ip: string,
): Promise<Response> {
  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )
  const tokenStr = typeof token === 'string' ? token.trim() : ''
  if (!TOKEN_RE.test(tokenStr)) {
    return jsonCors(req, { ok: true, status: 'invalid' }, 200)
  }

  const actionStr = action === 'cancel' ? 'cancel' : 'confirm'
  const tokenHash = await sha256Hex(tokenStr)

  // Kunci token secara atomis: hanya permintaan PERTAMA yang menang
  // (kondisi used_at IS NULL AND expires_at > now) — aman dari dobel-klik.
  const { data: claimed, error: claimError } = await admin
    .from('pin_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token_hash', tokenHash)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .select('email, wedding_date')
    .maybeSingle()

  if (claimError) {
    console.error('[resend-pin] Gagal mengklaim token:', claimError.message)
    void reportError(new Error(`Gagal mengklaim token: ${claimError.message}`), { fn: 'resend-pin' })
    return jsonCors(req, { ok: true, status: 'invalid' }, 200)
  }
  if (!claimed) {
    // Sudah terpakai / kedaluwarsa / tidak ada.
    return jsonCors(req, { ok: true, status: 'invalid' }, 200)
  }

  const row = claimed as { email: string; wedding_date: string }

  if (actionStr === 'cancel') {
    // Revoke selesai — PIN tidak diubah.
    return jsonCors(req, { ok: true, status: 'canceled' }, 200)
  }

  // --- CONFIRM: cari ulang pesanan lalu regenerate + kirim PIN ---
  const { data: orders, error: orderError } = await admin
    .from('orders')
    .select(ORDER_COLS)
    .ilike('email', row.email)
    .eq('wedding_date', row.wedding_date)
    .eq('payment_status', 'success')
    .order('created_at', { ascending: false })
    .limit(MAX_ORDERS_PER_REQUEST)

  if (orderError) {
    console.error('[resend-pin] Gagal membaca order (confirm):', orderError.message)
    void reportError(new Error(`Gagal membaca order: ${orderError.message}`), { fn: 'resend-pin' })
    return jsonCors(req, { ok: true, status: 'invalid' }, 200)
  }

  await refreshAndEmailAll((orders ?? []) as ResendOrder[])
  return jsonCors(req, { ok: true, status: 'confirmed' }, 200)
}
