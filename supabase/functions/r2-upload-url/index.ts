// supabase/functions/r2-upload-url/index.ts
// Menerbitkan presigned PUT URL untuk upload langsung browser → Cloudflare R2.
//
// Keamanan: kredensial R2 (endpoint/access/secret/bucket) HIDUP DI SINI
// sebagai Supabase secrets — tidak pernah menyentuh bundle frontend.
//
// Guard: sesi admin (JWT) bila ada; selain itu wajib orderId yang valid.
// Catatan parity: dashboard mempelai login via RPC custom tanpa sesi auth,
// sehingga guard ketat berbasis token belum dimungkinkan tanpa fitur baru.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { AwsClient } from 'https://esm.sh/aws4fetch@1.0.20'
import { verifyMediaAccess } from '../_shared/auth.ts'

import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'

const ALLOWED_PREFIXES = ['IMG_', 'ADMIN_IMG_', 'GALLERY_', 'AUDIO_'];
// SVG disengaja DITOLAK: scriptable di domain publik => vektor stored XSS.
const CONTENT_TYPE_RE = /^(image\/(?!svg)|audio)/i;
const PRESIGN_EXPIRES_SECONDS = 300;

function getSafeExtension(fileName: string): string | null {
  const parts = String(fileName).split('.');
  if (parts.length < 2) return null;
  const ext = parts.pop()!.toLowerCase().trim();
  return /^[a-z0-9]{1,8}$/.test(ext) ? ext : null;
}

serve(async (req) => {
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight

  try {
    // --- Validasi payload ---
    const { orderId, fileName, contentType, prefix = 'IMG_' } = await req.json();

    if (!orderId || typeof orderId !== 'string') throw new Error('orderId wajib dikirim.');
    if (!contentType || !CONTENT_TYPE_RE.test(contentType)) throw new Error('Tipe file harus gambar atau audio.');
    if (!ALLOWED_PREFIXES.includes(prefix)) throw new Error('Prefix unggahan tidak diizinkan.');
    const ext = getSafeExtension(String(fileName));
    if (!ext) throw new Error('Nama file tidak memiliki ekstensi yang valid.');
    if (ext === 'svg') throw new Error('Format SVG tidak diizinkan.');

    // --- OTORISASI: pemilik pesanan (JWT claim) atau admin ---
    // Keberadaan orderId saja bukan bukti kepemilikan.
    const caller = await verifyMediaAccess(req, orderId);
    if (!caller) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized untuk pesanan ini.' }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 403 },
      )
    }

    // --- Pesanan harus ada ---
    const service = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: order } = await service
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .maybeSingle();
    if (!order) throw new Error('Pesanan tidak ditemukan.');

    // --- Konfigurasi R2 dari secrets ---
    const endpoint = Deno.env.get('R2_ENDPOINT');
    const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const bucket = Deno.env.get('R2_BUCKET_NAME');
    const publicBase = Deno.env.get('R2_PUBLIC_URL');

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket || !publicBase) {
      throw new Error('Konfigurasi R2 belum lengkap (cek supabase secrets).');
    }

    // --- Presign PUT URL (SigV4, query-string style) ---
    const key = `${orderId}/${prefix}${Date.now()}.${ext}`;

    const r2 = new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: 's3',
      region: 'auto',
    });

    const target = new URL(`${endpoint.replace(/\/+$/, '')}/${bucket}/${key}`);
    target.searchParams.set('X-Amz-Expires', String(PRESIGN_EXPIRES_SECONDS));
    const signed = await r2.sign(
      new Request(target, { method: 'PUT' }),
      { aws: { signQuery: true } },
    );

    return new Response(
      JSON.stringify({
        uploadUrl: signed.url,
        publicUrl: `${publicBase.replace(/\/+$/, '')}/${key}`,
        key,
        contentType,
        expiresIn: PRESIGN_EXPIRES_SECONDS,
      }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error) {
    console.error('[r2-upload-url] Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 400 },
    )
  }
})
