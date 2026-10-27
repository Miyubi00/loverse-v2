// supabase/functions/_shared/whatsapp.ts
// Normalisasi nomor WhatsApp Indonesia (SATU sumber kebenaran).
// Dipakai bersama oleh create-order (saat order dibuat) dan
// customer-login (saat login) supaya format nomor selalu konsisten
// di database — mencegah order tersimpan tapi login gagal.

/** Normalisasi nomor Indonesia ke format +62…; null bila tak valid. */
export function normalizeWhatsapp(raw: string): string | null {
  let wa = String(raw).replace(/[^0-9+]/g, '')
  if (wa.startsWith('+')) wa = wa.substring(1)
  if (wa.startsWith('0')) wa = '62' + wa.substring(1)
  else if (!wa.startsWith('62')) wa = '62' + wa
  return /^\d{9,16}$/.test(wa) ? '+' + wa : null
}