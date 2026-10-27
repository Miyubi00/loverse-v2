// supabase/functions/create-order/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  resolveMidtransEnvironment,
  snapApiBaseUrl,
} from '../_shared/midtrans.ts'
import { encryptOrderId, generateOrderId } from '../_shared/orderToken.ts'
import { normalizeWhatsapp } from '../_shared/whatsapp.ts'
import { reportError } from '../_shared/monitoring.ts'

import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/* --- RATE LIMITING (anti-spam pemesanan) ---
 * Basis data: tabel public.order_attempts (lihat migrasi
 * 20260824140000_order_attempts.sql). Fail-open bila tabel belum ada.
 */
const RATE_WINDOW_MS = 15 * 60 * 1000 // 15 menit
const MAX_ORDERS_PER_IP = 10 // batas ketat anti-spam publik (10 percobaan per IP per 15 menit)
const RATE_LIMIT_MSG = 'Terlalu banyak pemesanan dari perangkat ini. Silakan coba lagi dalam beberapa menit.'

type SupabaseAdmin = ReturnType<typeof createClient>

function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return req.headers.get('x-real-ip') ?? req.headers.get('cf-connecting-ip') ?? 'unknown'
}

/**
 * Hitung jumlah pemesanan per IP dalam jendela waktu.
 * FAIL-CLOSED (3.4): bila tabel order_attempts belum ada / query gagal, error
 * dilempar ke pemanggil yang membalas 503 (pemesanan ditolak) — bukan lagi
 * membuka anti-spam tanpa batas. Wajib migrasi 20260824140000_order_attempts.sql.
 */
async function countRecentAttempts(admin: SupabaseAdmin, ip: string): Promise<number> {
  const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
  const { count } = await admin
    .from('order_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .gte('attempted_at', since)
  return count ?? 0
}

async function recordAttempt(admin: SupabaseAdmin, ip: string, success: boolean): Promise<void> {
  try {
    await admin.from('order_attempts').insert({ ip_address: ip, success })
  } catch (e) {
    console.error('[create-order] Gagal mencatat percobaan:', e)
  }
}

function generateSlug(groom: string, bride: string): string {
  const clean = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `${clean(groom)}-${clean(bride)}-${rand}`
}

serve(async (req) => {
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight

  const ip = getClientIp(req)
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const { groom_name, bride_name, wedding_date, whatsapp, email, template_slug, payment_method, captcha_token } = await req.json()

    // --- Validasi Cloudflare Turnstile Captcha ---
    const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY')
    if (turnstileSecret) {
      if (!captcha_token || typeof captcha_token !== 'string') {
        throw new Error('Verifikasi keamanan (Captcha) diperlukan.')
      }

      const form = new URLSearchParams()
      form.append('secret', turnstileSecret)
      form.append('response', captcha_token)
      if (ip && ip !== 'unknown') {
        form.append('remoteip', ip)
      }

      try {
        const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: form.toString(),
        })

        const outcome = await turnstileRes.json()
        if (!outcome.success) {
          console.warn(`[create-order] Turnstile Captcha gagal (ip=${ip}):`, outcome['error-codes'])
          throw new Error('Verifikasi keamanan (Captcha) tidak valid atau telah kedaluwarsa. Silakan coba lagi.')
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('Verifikasi keamanan')) {
          throw err
        }
        console.error('[create-order] Gagal memverifikasi Turnstile:', err)
        throw new Error('Gagal memverifikasi keamanan Captcha. Silakan coba lagi.')
      }
    }

    // --- Validasi server-side (ketat) ---
    if (typeof groom_name !== 'string' || !groom_name.trim() || groom_name.trim().length > 80) {
      throw new Error('Nama mempelai pria wajib diisi (maks. 80 karakter).')
    }
    if (typeof bride_name !== 'string' || !bride_name.trim() || bride_name.trim().length > 80) {
      throw new Error('Nama mempelai wanita wajib diisi (maks. 80 karakter).')
    }
    if (typeof wedding_date !== 'string' || !DATE_RE.test(wedding_date)) {
      throw new Error('Tanggal pernikahan tidak valid (format YYYY-MM-DD).')
    }
    const todayIso = new Date().toISOString().split('T')[0]
    if (wedding_date < todayIso) {
      throw new Error('Tanggal pernikahan tidak boleh di masa lalu.')
    }
    if (typeof email !== 'string' || !EMAIL_RE.test(email) || email.length > 320) {
      throw new Error('Email tidak valid. PIN akan dikirim ke email ini.')
    }
    if (typeof whatsapp !== 'string') {
      throw new Error('Nomor WhatsApp tidak valid.')
    }
    const normalizedWa = normalizeWhatsapp(whatsapp)
    if (!normalizedWa) {
      throw new Error('Nomor WhatsApp tidak valid.')
    }
    if (typeof template_slug !== 'string' || !template_slug.trim()) {
      throw new Error('Template belum dipilih.')
    }

    // --- RATE LIMITING: cek sebelum melakukan kerja (fail-closed 3.4) ---
    let recent = 0
    try {
      recent = await countRecentAttempts(admin, ip)
    } catch (e) {
      console.error('[create-order] Rate limit tidak tersedia (fail-closed):', e)
      return new Response(
        JSON.stringify({ error: 'Sistem keamanan sedang tidak tersedia. Pastikan migrasi order_attempts sudah dijalankan, lalu hubungi admin.' }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 503 },
      )
    }
    if (recent >= MAX_ORDERS_PER_IP) {
      console.warn(`[create-order] Rate limit dipicu (ip=${ip}, hit=${recent} dalam 1 jam)`)
      return new Response(
        JSON.stringify({ error: RATE_LIMIT_MSG }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 429 },
      )
    }

    // --- Ambil harga template dari database ---
    const { data: template, error: tplError } = await admin
      .from('templates')
      .select('name, price')
      .eq('slug', template_slug)
      .single()

    if (tplError || !template) {
      throw new Error('Template tidak ditemukan.')
    }

    // Saklar server: pembayaran online hanya bila secret ENABLE_ONLINE_PAYMENTS
    // tidak 'false'. Pasangan dari PRODUCTION_READY di frontend — request
    // rekayasa langsung tetap ditolak walau UI menyembunyikan. Manual WA
    // selalu diizinkan.
    const onlineEnabled =
      (Deno.env.get('ENABLE_ONLINE_PAYMENTS') ?? 'true').trim().toLowerCase() !== 'false';
    if (!onlineEnabled && payment_method !== 'manual_whatsapp') {
      throw new Error('Pembayaran online belum dibuka. Silakan pilih transfer manual via WhatsApp.')
    }
    if (typeof payment_method !== 'string' || !payment_method) {
      throw new Error('Metode pembayaran wajib dipilih.')
    }

    // --- Jalur MANUAL WhatsApp: tanpa Midtrans, hanya catat pending_orders.
    // Tetap lewat validasi + Turnstile + rate limit di atas (anti-spam),
    // menggantikan insert langsung dari browser yang melewati semuanya.
    if (payment_method === 'manual_whatsapp') {
      const { data: pending, error: pendingError } = await admin
        .from('pending_orders')
        .insert({
          groom_name: groom_name.trim(),
          bride_name: bride_name.trim(),
          wedding_date,
          whatsapp: normalizedWa,
          email,
          template_slug,
        })
        .select('id')
        .single()
      if (pendingError || !pending) {
        console.error('[create-order] Gagal mencatat pending manual:', pendingError)
        throw new Error('Failed to create order')
      }
      await recordAttempt(admin, ip, true)
      return new Response(
        JSON.stringify({ success: true, pending_id: (pending as { id: string }).id }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 200 },
      )
    }

    // --- Ambil & bersihkan Server Key ---
    const rawKey = Deno.env.get('MIDTRANS_SERVER_KEY') || ''
    const midtransServerKey = rawKey.trim().replace(/^["']|["']$/g, '')

    if (!midtransServerKey) {
      throw new Error('MIDTRANS_SERVER_KEY not configured')
    }

    // --- Pilih environment Midtrans (SATU sumber kebenaran) ---
    const midtransEnv = resolveMidtransEnvironment(
      Deno.env.get('MIDTRANS_IS_PRODUCTION'),
    )
    const midtransApiUrl = snapApiBaseUrl(midtransEnv)

    // --- ID order pendek & estetik (mis. LV-7K2P9XQZ), cek unik di DB ---
    let orderId = ''
    for (let i = 0; i < 5; i++) {
      const candidate = generateOrderId()
      const { count } = await admin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('midtrans_order_id', candidate)
      if (!count) {
        orderId = candidate
        break
      }
    }
    if (!orderId) throw new Error('Failed to generate order id')

    // --- Biaya layanan DIBEBANKAN ke pelanggan (split Midtrans MATI).
    // WAJIB SINKRON dengan getPaymentMethodFee() di frontend:
    // fee kanal + PPN 11% di atas fee. QRIS 0,7%; GoPay 1,5%;
    // VA flat Rp 4.000. Manual WA = Rp 0 (jalurnya return lebih awal).
    const channelFee = payment_method === 'qris'
      ? Math.ceil(template.price * 0.007)
      : payment_method === 'gopay'
        ? Math.ceil(template.price * 0.015)
        : 4000
    const ppnFee = Math.ceil(channelFee * 0.11)
    const adminFee = channelFee + ppnFee
    const feeName = 'Biaya Layanan (termasuk PPN 11%)'

    const grossAmount = template.price + adminFee

    // --- Simpan order DULU (status pending, tanpa snap_token) ---
    // Urutan ini mencegah divergensi state: transaksi Midtrans tidak
    // pernah ada tanpa baris lokal. Bila pembuatan token gagal, baris
    // ditandai 'failed' sebagai jejak audit (bukan hilang diam-diam).
    let order: Record<string, unknown> | null = null
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await admin
        .from('orders')
        .insert({
          groom_name: groom_name.trim(),
          bride_name: bride_name.trim(),
          wedding_date,
          whatsapp: normalizedWa,
          email,
          template_slug,
          slug: generateSlug(groom_name, bride_name),
          midtrans_order_id: orderId,
          payment_status: 'pending',
          price: grossAmount,
          event_details: {
            payment_method,
            base_price: template.price,
            admin_fee: adminFee,
            template_name: template.name,
          },
        })
        .select()
        .single()

      if (!error) {
        order = data
        break
      }
      // 23505 = unique violation (slug bentrok) -> coba sufiks acak baru.
      if ((error as { code?: string }).code === '23505') continue
      console.error('[create-order] Database error:', error)
      throw new Error('Failed to create order')
    }
    if (!order) {
      throw new Error('Failed to create order')
    }

    // Redirect setelah pembayaran (Midtrans otomatis menambahkan
    // ?order_id=&status_code=&transaction_status= ke URL finish).
    const appUrl = Deno.env.get('APP_URL') || ''

    // Kanal aktif di akun (lihat dashboard): Other QRIS, GoPay,
    // Mandiri/BNI/BRI/Permata/CIMB/BSI VA. SATU kanal per transaksi ->
    // Snap langsung ke alurnya (tanpa halaman pilih lagi).
    // CATATAN: QRIS wajib 'other_qris' (terbukti jalan di akun ini).
    // Fallback (legacy/tak dikenal): semua kanal aktif.
    let enabledPayments: string[] = ['other_qris', 'gopay', 'echannel', 'bni_va', 'bri_va', 'permata_va', 'cimb_va', 'bsi_va', 'other_va']

    if (payment_method === 'qris') {
      enabledPayments = ['other_qris']
    } else if (payment_method === 'gopay') {
      enabledPayments = ['gopay']
    } else if (payment_method === 'echannel') {
      enabledPayments = ['echannel']
    } else if (payment_method === 'bni_va') {
      enabledPayments = ['bni_va']
    } else if (payment_method === 'bri_va') {
      enabledPayments = ['bri_va']
    } else if (payment_method === 'permata_va') {
      enabledPayments = ['permata_va']
    } else if (payment_method === 'cimb_va') {
      enabledPayments = ['cimb_va']
    } else if (payment_method === 'bsi_va') {
      enabledPayments = ['bsi_va']
    }

    const itemDetails: Array<{ id: string; price: number; quantity: number; name: string }> = [
      {
        id: template_slug,
        price: template.price,
        quantity: 1,
        name: `Undangan Digital - ${template.name}`,
      },
    ]

    if (adminFee > 0) {
      itemDetails.push({
        id: `fee-${payment_method || 'admin'}`,
        price: adminFee,
        quantity: 1,
        name: `Biaya Layanan ${feeName}`,
      })
    }

    const transactionParams: Record<string, unknown> = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: groom_name.trim(),
        last_name: bride_name.trim(),
        phone: normalizedWa,
        email,
      },
      item_details: itemDetails,
      enabled_payments: enabledPayments,
      // SENGAJA tanpa expiry/page_expiry: masa berlaku mengikuti default
      // tiap kanal Midtrans; saat kedaluwarsa Midtrans mengirim webhook
      // transaction_status=expire yang langsung menandai failed di DB.
    }

    if (appUrl) {
      transactionParams.callbacks = {
        finish: `${appUrl}/payment-status`,
        unfinish: `${appUrl}/payment-status`,
        error: `${appUrl}/payment-status`,
      }
    }

    const auth = btoa(`${midtransServerKey}:`)
    const snapResponse = await fetch(midtransApiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionParams),
    })

    if (!snapResponse.ok) {
      const errorBody = await snapResponse.text()
      console.error('[create-order] Midtrans API error:', errorBody)
      // Tandai gagal agar terlihat di admin panel & halaman status.
      await admin.from('orders').update({ payment_status: 'failed' }).eq('id', (order as { id: string }).id)
      throw new Error('Failed to generate payment token')
    }

    const snapData = await snapResponse.json()

    // --- Simpan token ke baris yang sudah ada ---
    const { error: tokenError } = await admin
      .from('orders')
      .update({ snap_token: snapData.token })
      .eq('id', (order as { id: string }).id)
    if (tokenError) {
      // Token tetap dikirim — klien bisa lanjut bayar; webhook mengaktifkan.
      console.error('[create-order] Gagal menyimpan snap_token:', tokenError)
    }

    // Catat percobaan sukses (untuk statistik & konsumsi rate limit).
    await recordAttempt(admin, ip, true)

    // Token buram untuk URL (?order_id=<token>) agar id asli tidak bisa
    // ditebak. Tanpa PAYMENT_LINK_SECRET -> kirim id mentah (kompatibel).
    let orderToken = orderId
    const linkSecret = (Deno.env.get('PAYMENT_LINK_SECRET') || '').trim()
    if (linkSecret) {
      try {
        orderToken = await encryptOrderId(orderId, linkSecret)
      } catch (e) {
        console.error('[create-order] Gagal enkripsi order token:', e)
      }
    }

    return new Response(
      JSON.stringify({
        snap_token: snapData.token,
        order_id: orderId,
        order_token: orderToken,
        redirect_url: snapData.redirect_url,
      }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error) {
    console.error('[create-order] Function error:', error)
    void reportError(error, { fn: 'create-order', ip })
    // Catat percobaan gagal agar rate limit ikut menghitung request invalid.
    try {
      await recordAttempt(admin, ip, false)
    } catch {
      /* abaikan — catatan gagal tidak boleh menggagalkan respons */
    }
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 400 },
    )
  }
})