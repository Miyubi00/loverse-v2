// supabase/functions/customer-login/index.ts
// Login dashboard mempelai: verifikasi WhatsApp + PIN, lalu terbitkan
// JWT custom ES256 ber-claim `order_id` yang dipakai RLS untuk membatasi
// seluruh query berikutnya pada satu pesanan milik pemanggil.
//
// ARSITEKTUR PENANDATANGANAN (BYOK Signing Key):
// - Token DITANDATANGANI ES256 memakai key pair milik proyek yang
//   digenerate via `supabase gen signing-key --algorithm ES256`.
// - Private JWK hidup HANYA sebagai Supabase Edge Function secret
//   (CUSTOMER_JWT_PRIVATE_JWK); public key-nya di-import ke dashboard
//   sebagai STANDBY signing key sehingga ter-publish di JWKS dan
//   dipercaya PostgREST/Data API untuk VERIFIKASI (tanpa perlu rotate:
//   rotation hanya mengganti kunci yang dipakai Supabase Auth untuk
//   menandatangani sesi-nya sendiri).
// - Header JWT membawa `kid` yang sama dengan kid saat import.
//
// Claims: role=authenticated, sub & order_id = order UUID, iat, exp.
// PIN TIDAK pernah dikembalikan ke klien oleh fungsi ini.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SignJWT, importJWK } from 'https://esm.sh/jose@5.9.6'
import type { JSONWebKey } from 'https://esm.sh/jose@5.9.6'
import { normalizeWhatsapp } from '../_shared/whatsapp.ts'
import { verifyCustomerJwt } from '../_shared/auth.ts'
import { reportError } from '../_shared/monitoring.ts'

import { handleCorsPreflight, jsonCors } from '../_shared/cors.ts'

const TOKEN_TTL_SECONDS = 60 * 60 * 2 // 2 jam — diperpanjang via mode refresh
const MAX_SESSION_SECONDS = 60 * 60 * 24 // batas total sesi 24 jam sejak login pertama

/* --- RATE LIMITING (anti brute-force PIN) ---
 * Basis data: tabel public.login_attempts (RLS on, tanpa policy -> hanya
 * service_role / Edge Functions yang bisa baca-tulis). Dibuat via migrasi
 * `20260824120000_login_attempts.sql`.
 */
const RATE_WINDOW_MS = 15 * 60 * 1000 // jendela 15 menit
const MAX_FAILS_PER_WHATSAPP = 5 // kunci per nomor setelah 5x gagal
const MAX_FAILS_PER_IP = 20 // batas lebar per IP (cegah serangan terdistribusi)

const RATE_LIMIT_MSG = 'Terlalu banyak percobaan. Silakan coba lagi dalam 15 menit.'

type SupabaseAdmin = ReturnType<typeof createClient>

/** Ambil IP klien dari header proxy (Vercel/Cloudflare). */
function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('cf-connecting-ip') ??
    'unknown'
  )
}

/**
 * Hitung percobaan gagal dalam jendela waktu.
 * FAIL-CLOSED (3.4): bila tabel login_attempts belum ada / query gagal, error
 * dilempar ke pemanggil yang membalas 503 (login ditolak) — bukan lagi membuka
 * brute-force tanpa batas. Wajib migrasi 20260824120000_login_attempts.sql.
 */
async function countRecentFails(
  admin: SupabaseAdmin,
  whatsapp: string,
  ip: string,
): Promise<{ byWhatsapp: number; byIp: number }> {
  const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
  const base = admin
    .from('login_attempts')
    .select('id', { count: 'exact', head: true })
    .gte('attempted_at', since)
  const [{ count: byWhatsapp }, { count: byIp }] = await Promise.all([
    base.eq('whatsapp', whatsapp),
    base.eq('ip_address', ip),
  ])
  return { byWhatsapp: byWhatsapp ?? 0, byIp: byIp ?? 0 }
}

/** Catat percobaan gagal. FAIL-CLOSED (3.4): bila insert gagal, error dilempar
 *  -> pemanggil menolak login (503); percobaan tanpa catatan adalah celah. */
async function recordFailure(admin: SupabaseAdmin, whatsapp: string, ip: string): Promise<void> {
  await admin.from('login_attempts').insert({ whatsapp, ip_address: ip, success: false })
}

async function clearFailures(admin: SupabaseAdmin, whatsapp: string): Promise<void> {
  try {
    await admin.from('login_attempts').delete().eq('whatsapp', whatsapp)
  } catch (e) {
    console.error('[customer-login] Gagal membersihkan percobaan:', e)
  }
}


/** Error dengan status HTTP — dipakai utk memisahkan client vs server error. */
class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
    this.name = 'HttpError'
  }
}

interface CustomerPrivateJwk {
  kty: string;
  crv: string;
  alg: string;
  use: string;
  key_ops: string[];
  kid?: string;
  d: string;
  x?: string;
  y?: string;
}

/**
 * Validasi & rapikan private JWK hasil `supabase gen signing-key` agar
 * aman untuk jose: hanya field penandatanganan yang dipertahankan dan
 * key_ops dipaksa ["sign"] (keberadaan opsi "verify" membuat jose
 * menolak key untuk signing).
 */
export function normalizePrivateJwk(raw: unknown): CustomerPrivateJwk | null {
  if (typeof raw !== 'object' || raw === null) return null
  const jwk = raw as Record<string, unknown>

  if (
    jwk.kty !== 'EC' ||
    jwk.crv !== 'P-256' ||
    typeof jwk.d !== 'string' || jwk.d.length === 0 ||
    typeof jwk.x !== 'string' || jwk.x.length === 0 ||
    typeof jwk.y !== 'string' || jwk.y.length === 0
  ) {
    return null
  }

  return {
    kty: 'EC',
    crv: 'P-256',
    alg: 'ES256',
    use: 'sig',
    key_ops: ['sign'],
    kid: typeof jwk.kid === 'string' && jwk.kid.length > 0 ? jwk.kid : undefined,
    d: jwk.d,
    x: jwk.x,
    y: jwk.y,
  }
}

/** Muat & validasi konfigurasi signing (secret edge). */
function loadSigningConfig(): { jwk: CustomerPrivateJwk; kid: string } | null {
  const rawJwk = Deno.env.get('CUSTOMER_JWT_PRIVATE_JWK')
  const configuredKid = Deno.env.get('CUSTOMER_JWT_KID')?.trim()

  if (!rawJwk || !configuredKid) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(rawJwk)
  } catch {
    console.error('[customer-login] CUSTOMER_JWT_PRIVATE_JWK bukan JSON valid')
    return null
  }

  const jwk = normalizePrivateJwk(parsed)
  if (!jwk) {
    console.error('[customer-login] CUSTOMER_JWT_PRIVATE_JWK bukan private JWK EC P-256')
    return null
  }
  if (!jwk.kid) {
    console.error('[customer-login] Private JWK tidak memiliki kid')
    return null
  }
  if (jwk.kid !== configuredKid) {
    console.error('[customer-login] kid JWK tidak cocok dengan CUSTOMER_JWT_KID')
    return null
  }
  return { jwk, kid: jwk.kid }
}

async function signCustomerJwt(
  jwk: CustomerPrivateJwk,
  orderId: string,
  sessionStartSec?: number,
): Promise<string> {
  const key = await importJWK(jwk as unknown as JSONWebKey, 'ES256')

  const nowSec = Math.floor(Date.now() / 1000)
  const exp = nowSec + TOKEN_TTL_SECONDS
  // siat = awal sesi (login pertama) — dipertahankan saat refresh sehingga
  // total umur sesi tetap terbatas meski token terus diperpanjang.
  const siat = sessionStartSec ?? nowSec

  // jose menangani encoding JWS ECDSA (r||s base64url) dengan benar.
  return await new SignJWT({ role: 'authenticated', sub: orderId, order_id: orderId, siat })
    .setProtectedHeader({ alg: 'ES256', typ: 'JWT', kid: jwk.kid! })
    .setIssuedAt(nowSec)
    .setExpirationTime(exp)
    .sign(key)
}

serve(async (req) => {
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight
  if (req.method !== 'POST') return jsonCors(req, { error: 'Method not allowed' }, 405)

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>

    // --- MODE REFRESH: perpanjang sesi tanpa PIN (Bearer customer JWT) ---
    if (body.refresh === true) {
      const authHeader = req.headers.get('Authorization') ?? ''
      const oldToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
      const payload = oldToken ? await verifyCustomerJwt(oldToken) : null
      const orderId = payload && typeof payload.order_id === 'string' ? payload.order_id : null
      if (!orderId) throw new HttpError(401, 'Sesi berakhir. Silakan login ulang.')

      const nowSec = Math.floor(Date.now() / 1000)
      const siat =
        typeof payload.siat === 'number'
          ? payload.siat
          : typeof payload.iat === 'number'
            ? payload.iat
            : nowSec
      if (nowSec - siat > MAX_SESSION_SECONDS) {
        throw new HttpError(401, 'Sesi sudah melewati batas waktu. Silakan login ulang.')
      }

      const admin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      )
      const { data: orderRow, error: orderErr } = await admin
        .from('orders')
        .select('id, slug, groom_name, bride_name, wedding_date, template_slug, payment_status')
        .eq('id', orderId)
        .maybeSingle()
      if (
        orderErr ||
        !orderRow ||
        (orderRow.payment_status !== 'success' && orderRow.payment_status !== 'paid')
      ) {
        throw new HttpError(401, 'Sesi berakhir. Silakan login ulang.')
      }

      const signing = loadSigningConfig()
      if (!signing) {
        console.error('[customer-login] Konfigurasi signing customer JWT tidak lengkap/salah')
        throw new HttpError(500, 'Terjadi kesalahan sistem. Silakan coba lagi.')
      }

      const access_token = await signCustomerJwt(signing.jwk, orderId, siat)
      return jsonCors(req, 
        { access_token, expires_at: nowSec + TOKEN_TTL_SECONDS, order: orderRow },
        200,
      )
    }

    // --- MODE LOGIN NORMAL (whatsapp + PIN) ---
    const whatsapp = body.whatsapp
    const pin = body.pin

    if (typeof whatsapp !== 'string' || typeof pin !== 'string') {
      throw new HttpError(400, 'Data tidak valid.')
    }
    if (!/^\d{6}$/.test(pin)) {
      throw new HttpError(400, 'PIN harus 6 digit angka.')
    }

    const normalized = normalizeWhatsapp(whatsapp)
    if (!normalized) {
      throw new HttpError(400, 'Nomor WhatsApp tidak valid.')
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // --- RATE LIMITING: blokir brute force PIN (fail-closed 3.4) ---
    const ip = getClientIp(req)
    let byWhatsapp = 0
    let byIp = 0
    try {
      const fails = await countRecentFails(admin, normalized, ip)
      byWhatsapp = fails.byWhatsapp
      byIp = fails.byIp
    } catch (e) {
      console.error('[customer-login] Rate limit tidak tersedia (fail-closed):', e)
      return jsonCors(req, 
        { error: 'Sistem keamanan tidak tersedia. Pastikan migrasi login_attempts sudah dijalankan.' },
        503,
      )
    }
    if (byWhatsapp >= MAX_FAILS_PER_WHATSAPP || byIp >= MAX_FAILS_PER_IP) {
      console.warn(`[customer-login] Rate limit dipicu (wa=${byWhatsapp}, ip=${byIp}) utk ${normalized}`)
      return jsonCors(req, { error: RATE_LIMIT_MSG }, 429)
    }

    // --- Verifikasi PIN via RPC (bcrypt hash — bukan plaintext) ---
    // Fungsi verify_customer_pin hanya dieksekusi oleh service_role dan
    // mencocokkan hash bcrypt (extensions.crypt), sehingga PIN plaintext
    // tidak pernah dibandingkan maupun di-log.
    const { data: rows, error: rpcError } = await admin.rpc('verify_customer_pin', {
      p_whatsapp: normalized,
      p_pin: pin,
    })

    if (rpcError) {
      console.error('[customer-login] RPC verify_customer_pin error:', rpcError)
      throw new Error('Gagal memverifikasi kredensial.')
    }

    const rowsArr = (rows ?? []) as Array<{
      id: string
      slug: string
      groom_name: string
      bride_name: string
      wedding_date: string
      template_slug: string
    }>

    if (!rowsArr.length) {
      try {
        await recordFailure(admin, normalized, ip)
      } catch (e) {
        console.error('[customer-login] Gagal mencatat kegagalan (fail-closed):', e)
        return jsonCors(req, { error: 'Sistem keamanan sedang tidak tersedia. Silakan coba lagi nanti.' }, 503)
      }
      throw new HttpError(401, 'Kombinasi No. WhatsApp atau PIN salah.')
    }

    // Data ambigu: pilih yang pertama (RPC sudah LIMIT 1 per kecocokan),
    // tapi tandai di log untuk pembersihan manual oleh admin.
    const order = rowsArr[0]
    if (rowsArr.length > 1) {
      console.warn(`[customer-login] Ambiguous whatsapp+pin (${rowsArr.length} rows) for ${normalized}`)
    }

    // PIN benar — bersihkan riwayat percobaan agar hitungan mulai dari nol.
    await clearFailures(admin, normalized)

    const signing = loadSigningConfig()
    if (!signing) {
      console.error('[customer-login] Konfigurasi signing customer JWT tidak lengkap/salah')
      return jsonCors(req, { error: 'Server not configured.' }, 500)
    }

    const access_token = await signCustomerJwt(signing.jwk, order.id)

    return jsonCors(req, 
      {
        access_token,
        expires_at: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
        order: {
          id: order.id,
          slug: order.slug,
          groom_name: order.groom_name,
          bride_name: order.bride_name,
          wedding_date: order.wedding_date,
          template_slug: order.template_slug,
        },
      },
      200,
    )
  } catch (error) {
    console.error('[customer-login] Error:', error)
    if (error instanceof HttpError) {
      return jsonCors(req, { error: error.message }, error.status)
    }
    void reportError(error, { fn: 'customer-login' })
    return jsonCors(req, { error: 'Terjadi kesalahan sistem. Silakan coba lagi.' }, 500)
  }
})
