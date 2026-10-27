// supabase/functions/_shared/auth.ts
// Verifikasi identitas pemanggil untuk operasi media (R2).
//
// Dua jalur yang diakui (sama seperti model RLS):
//   1. CUSTOMER : JWT ES256 custom ber-claim order_id yang diterbitkan
//                 `customer-login` memakai BYOK signing key proyek.
//                 Diverifikasi terhadap JWKS publik proyek (pola resmi
//                 dokumentasi Supabase) — tanpa shared secret.
//   2. ADMIN    : sesi Supabase Auth yang emailnya terdaftar di tabel
//                 admin_users (dicek via service-role).
//
// orderId yang dikirim klien HANYA valid bila cocok dengan claim pada
// token (customer) atau pemanggil adalah admin. Keberadaan orderId
// saja BUKAN otorisasi.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createRemoteJWKSet, jwtVerify } from 'https://esm.sh/jose@5.9.6'

export type MediaCaller = 'customer' | 'admin';

/** JWKS proyek — public keys saja; di-cache oleh jose + Supabase Edge (~10 menit). */
const PROJECT_JWKS = createRemoteJWKSet(
  new URL(`${Deno.env.get('SUPABASE_URL') ?? ''}/auth/v1/.well-known/jwks.json`),
);

interface CustomerTokenPayload {
  role?: unknown;
  order_id?: unknown;
}

/** Verifikasi JWT pelanggan (ES256, BYOK standby key) lewat JWKS proyek. */
export async function verifyCustomerJwt(
  token: string,
): Promise<CustomerTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, PROJECT_JWKS, {
      algorithms: ['ES256'],
    });
    return payload as CustomerTokenPayload;
  } catch {
    // Signature invalid / expired / kid tidak dikenal / bukan JWT.
    return null;
  }
}

/** Cek keanggotaan admin lewat tabel admin_users (service-role). */
export async function isAdminEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const service = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { data, error } = await service
    .from('admin_users')
    .select('email')
    .ilike('email', email)
    .maybeSingle();
  return !error && !!data;
}

/** Decode segmen payload JWT (base64url) tanpa verifikasi — aman dipakai
 *  SETELAH token terbukti valid oleh auth.getUser(). */
function base64UrlToJson(seg: string): Record<string, unknown> | null {
  try {
    let b = seg.replace(/-/g, '+').replace(/_/g, '/');
    while (b.length % 4) b += '=';
    const bin = Uint8Array.from(atob(b), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bin));
  } catch {
    return null;
  }
}

/**
 * Verifikasi sesi ADMIN + wajib MFA (opsional, via env REQUIRE_ADMIN_MFA).
 *
 * - Token divalidasi dulu oleh auth.getUser() (GoTrue) supaya aman
 *   membaca klaim dari payload.
 * - Bila REQUIRE_ADMIN_MFA='true' (setelah admin semua mendaftarkan
 *   TOTP di dashboard Supabase), pemanggil harus memiliki sesi aal2
 *   (login + TOTP terverifikasi).
 */
export async function requireAdminMfa(
  req: Request,
): Promise<{ ok: boolean; email?: string; error?: string }> {
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return { ok: false, error: 'Unauthorized' };
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return { ok: false, error: 'Unauthorized' };

  const anon = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data, error } = await anon.auth.getUser();
  if (error || !data?.user?.email) return { ok: false, error: 'Unauthorized' };

  if (!(await isAdminEmail(data.user.email))) return { ok: false, error: 'Forbidden' };

  const requireMfa = (Deno.env.get('REQUIRE_ADMIN_MFA') ?? 'false') === 'true';
  if (requireMfa) {
    const parts = token.split('.');
    const payload = parts.length === 3 ? base64UrlToJson(parts[1]) : null;
    const aal = payload?.aal;
    if (aal !== 'aal2') {
      return { ok: false, error: 'Sesi admin belum memenuhi MFA (wajib login + TOTP).' };
    }
  }

  return { ok: true, email: data.user.email };
}

/**
 * Otorisasi akses media untuk `orderId` tertentu.
 * Mengembalikan jenis pemanggil, atau null bila TIDAK diizinkan.
 */
export async function verifyMediaAccess(
  req: Request,
  orderId: string,
): Promise<MediaCaller | null> {
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token || token.length > 4096) return null;

  // --- Jalur 1: JWT pelanggan ber-claim order_id (ES256 via JWKS) ---
  const payload = await verifyCustomerJwt(token);
  if (payload && typeof payload.order_id === 'string' && payload.role === 'authenticated') {
    return payload.order_id === orderId ? 'customer' : null;
  }

  // --- Jalur 2: sesi admin Supabase Auth ---
  try {
    const anon = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data } = await anon.auth.getUser();
    const email = data?.user?.email ?? null;
    if (email && (await isAdminEmail(email))) return 'admin';
  } catch {
    /* token bukan sesi Supabase Auth — jatuh ke tolak */
  }

  return null;
}
