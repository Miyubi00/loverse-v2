// supabase/functions/_shared/pin.ts
// Generator PIN 6 digit dengan penanganan bentrok (unik per nomor WhatsApp).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type SupabaseAdmin = ReturnType<typeof createClient>;

/** PIN acak 6 digit (100000–999999) — memakai CSPRNG (bukan Math.random). */
export function generatePin(): string {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return String(100000 + (buf[0] % 900000))
}

/**
 * Generate PIN dan pastikan belum terpakai oleh nomor WhatsApp yang sama
 * (login dashboard memakai pasangan whatsapp+pin). Retry maksimal 5x.
 */
export async function generateUniquePin(
  admin: SupabaseAdmin,
  whatsapp: string,
): Promise<string> {
  const MAX_ATTEMPTS = 5;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const pin = generatePin();

    const { count, error } = await admin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('whatsapp', whatsapp)
      .eq('pin_code', pin);

    if (error) throw new Error(`Gagal memeriksa keunikan PIN: ${error.message}`);
    if (!count) return pin;
  }

  throw new Error('Gagal menghasilkan PIN unik setelah beberapa percobaan.');
}
