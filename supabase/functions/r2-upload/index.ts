// supabase/functions/r2-upload/index.ts
// Proxy upload media browser → Cloudflare R2.
//
// Latar belakang: endpoint S3 R2 (…r2.cloudflarestorage.com) terkena
// filtering berbasis SNI di sebagian jaringan Indonesia, sehingga upload
// presigned langsung dari browser gagal (fatal TLS alert). Solusinya:
// file dikirim ke Supabase Functions ini, lalu diteruskan ke R2 dari
// infrastruktur server (bebas blokir lokal).
//
// Kredensial R2 tetap HIDUP DI SINI sebagai Supabase secrets.
//
// Payload: multipart/form-data — file, orderId, prefix (opsional).
// Batas: 5MB per file, tipe image/* atau audio/*.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { AwsClient } from 'https://esm.sh/aws4fetch@1.0.20'
import { verifyMediaAccess } from '../_shared/auth.ts'

import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'

const ALLOWED_PREFIXES = ['IMG_', 'ADMIN_IMG_', 'GALLERY_', 'AUDIO_'];
// SVG disengaja DITOLAK: scriptable di domain publik => vektor stored XSS.
const CONTENT_TYPE_RE = /^(image\/(?!svg)|audio)/i;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

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
    // --- Parse multipart ---
    const form = await req.formData();
    const fileEntry = form.get('file');
    if (!(fileEntry instanceof File)) throw new Error('Field "file" wajib dikirim sebagai multipart/form-data.');

    const orderId = String(form.get('orderId') ?? '');
    const prefix = String(form.get('prefix') ?? 'IMG_');

    // --- Validasi ---
    if (!orderId) throw new Error('orderId wajib dikirim.');
    if (fileEntry.size === 0) throw new Error('File kosong.');
    if (fileEntry.size > MAX_FILE_SIZE) throw new Error('Ukuran file maksimal 5MB.');

    const contentType = fileEntry.type || '';
    if (!contentType || !CONTENT_TYPE_RE.test(contentType)) throw new Error('Tipe file harus gambar atau audio.');
    if (!ALLOWED_PREFIXES.includes(prefix)) throw new Error('Prefix unggahan tidak diizinkan.');
    const ext = getSafeExtension(fileEntry.name);
    if (!ext) throw new Error('Nama file tidak memiliki ekstensi yang valid.');
    if (ext === 'svg') throw new Error('Format SVG tidak diizinkan.');

    // --- OTORISASI: pemilik pesanan (JWT claim) atau admin ---
    const caller = await verifyMediaAccess(req, orderId);
    if (!caller) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized untuk pesanan ini.' }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 403 },
      )
    }

    // --- Pesanan harus ada (validasi tambahan) ---
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

    // --- Teruskan byte ke R2 (signed PUT header-mode) ---
    const key = `${orderId}/${prefix}${Date.now()}.${ext}`;
    const targetUrl = `${endpoint.replace(/\/+$/, '')}/${bucket}/${key}`;

    const r2 = new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: 's3',
      region: 'auto',
    });

    const putResponse = await r2.fetch(targetUrl, {
      method: 'PUT',
      body: await fileEntry.arrayBuffer(),
      headers: { 'Content-Type': contentType },
    });

    if (!putResponse.ok) {
      const body = await putResponse.text();
      console.error(`[r2-upload] R2 menolak (${putResponse.status}):`, body);
      throw new Error(`Server storage menolak unggahan (${putResponse.status}).`);
    }

    const publicUrl = `${publicBase.replace(/\/+$/, '')}/${key}`;

    return new Response(
      JSON.stringify({ publicUrl, key, contentType }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error) {
    console.error('[r2-upload] Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 400 },
    )
  }
})
