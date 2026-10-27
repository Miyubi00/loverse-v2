// supabase/functions/_shared/orderToken.ts
// ID order estetik + token buram untuk URL (?order_id=<token>).
//
// - ID baru format `LV-XXXXXXXX`: kapital, 8 karakter acak (tanpa huruf
//   yang membingungkan seperti I/O/0/1), dibuat dengan CSPRNG.
// - Token URL = AES-GCM(order_id) dengan kunci SHA-256(PAYMENT_LINK_SECRET),
//   dikodekan base64url. Tanpa perubahan skema DB.
// - Server selalu "coba dekripsi, gagal -> anggap id mentah" sehingga
//   link lama + redirect bawaan Midtrans (?order_id=MENTAH&...) tetap jalan.

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

/** Alfabet tanpa karakter ambigu (I, O, 0, 1). */
const ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** ID order pendek, mis. `LV-7K2P9XQZ`. */
export function generateOrderId(prefix = 'LV'): string {
  const buf = crypto.getRandomValues(new Uint8Array(8))
  let rand = ''
  for (const b of buf) rand += ID_ALPHABET[b % ID_ALPHABET.length]
  return `${prefix}-${rand}`
}

function b64urlEncode(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(s: string): Uint8Array | null {
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
    const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
    const out = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
    return out
  } catch {
    return null
  }
}

async function aesKey(secret: string): Promise<CryptoKey> {
  const hash = await crypto.subtle.digest('SHA-256', textEncoder.encode(secret))
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ])
}

/** Enkripsi order_id menjadi token URL. Gagal -> throw (pemanggil fallback). */
export async function encryptOrderId(orderId: string, secret: string): Promise<string> {
  const key = await aesKey(secret)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, textEncoder.encode(orderId)),
  )
  const out = new Uint8Array(iv.length + ct.length)
  out.set(iv)
  out.set(ct, iv.length)
  return b64urlEncode(out)
}

/** Dekripsi token URL. Gagal (bukan token / secret beda) -> null. */
export async function decryptOrderId(
  token: string,
  secret: string,
): Promise<string | null> {
  try {
    const raw = b64urlDecode(token)
    if (!raw || raw.length <= 12) return null
    const key = await aesKey(secret)
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: raw.slice(0, 12) },
      key,
      raw.slice(12),
    )
    const id = textDecoder.decode(pt)
    return id || null
  } catch {
    return null
  }
}

/**
 * Resolve nilai `?order_id=...`: coba dekripsi dulu, gagal -> anggap id
 * mentah (back-compat link lama & redirect bawaan Midtrans).
 */
export async function resolveOrderId(
  value: unknown,
  secret: string | undefined | null,
): Promise<string | null> {
  if (typeof value !== 'string' || value.length === 0 || value.length > 500) {
    return null
  }
  if (secret) {
    const decrypted = await decryptOrderId(value, secret)
    if (decrypted) return decrypted
  }
  return value
}
