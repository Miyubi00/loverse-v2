// supabase/functions/inbound-email/index.ts
// Penerima email masuk mail@loverse.id — DIPANGGIL OLEH Cloudflare Email
// Worker (bukan oleh browser). Worker mem-parsing MIME lalu POST JSON:
//   { from, to, subject, text, html?, attachments?: [{name, mime, size, content(base64)}],
//     skippedAttachments?: number }
// Otorisasi: header `x-inbound-secret` HARUS sama dengan secret
// INBOUND_EMAIL_SECRET. Tanpa secret yang cocok -> 403.
// Lampiran diunggah ke R2 (prefix inbox/) lalu metadata-nya disimpan di
// kolom attachments. Pesan SELALU disimpan walau lampiran gagal.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { AwsClient } from 'https://esm.sh/aws4fetch@1.0.20'

const INBOUND_SECRET = Deno.env.get('INBOUND_EMAIL_SECRET') ?? '';

const MAX_EACH = 5 * 1024 * 1024;
const MAX_TOTAL = 10 * 1024 * 1024;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** base64 -> Uint8Array (chunked). */
function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Amankan nama file untuk key R2. */
function safeName(name: string): string {
  const base = name.split(/[\\/]/).pop() || 'lampiran';
  return base.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 150) || 'lampiran';
}

serve(async (req) => {
  if (req.method === 'GET') return new Response('ok', { status: 200 });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  if (!INBOUND_SECRET) {
    console.error('[inbound-email] INBOUND_EMAIL_SECRET belum diset.');
    return json({ error: 'Not configured' }, 500);
  }
  const got = req.headers.get('x-inbound-secret') ?? '';
  if (got !== INBOUND_SECRET) return json({ error: 'Forbidden' }, 403);

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Bad request' }, 400);
  }

  const from = String(payload.from ?? '').trim().slice(0, 320);
  const to = String(payload.to ?? 'mail@loverse.id').trim().slice(0, 320);
  const subject = String(payload.subject ?? '(tanpa subjek)').trim().slice(0, 500) || '(tanpa subjek)';
  let text = String(payload.text ?? '').slice(0, 50000);
  if (!from) return json({ error: 'Field from wajib' }, 400);

  // --- Badan HTML (opsional, dari MIME part text/html via Worker) ---
  // Disimpan mentah; render-nya WAJIB iframe tersandbox (tanpa script).
  // Pertahanan berlapis: buang blok <script> saat simpan.
  let html: string | null = null;
  if (typeof payload.html === 'string' && payload.html.length > 0) {
    html = payload.html
      .replace(/<script[\s\S]*?<\/script\s*>/gi, '')
      .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .slice(0, 200000);
    if (!html.trim()) html = null;
  }

  // --- Lampiran -> R2 ---
  const stored: Array<{ name: string; mime: string; size: number; url: string }> = [];
  const incoming = Array.isArray(payload.attachments) ? payload.attachments : [];
  const skippedIncoming = Number(payload.skippedAttachments ?? 0);
  let skippedStore = 0;
  const endpoint = Deno.env.get('R2_ENDPOINT');
  const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
  const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
  const bucket = Deno.env.get('R2_BUCKET_NAME');
  const publicBase = Deno.env.get('R2_PUBLIC_URL');
  const r2ok = !!(endpoint && accessKeyId && secretAccessKey && bucket && publicBase);

  if (incoming.length > 0 && !r2ok) {
    console.error('[inbound-email] R2 belum dikonfigurasi, lampiran dilewati.');
    skippedStore = incoming.length;
  }

  if (incoming.length > 0 && r2ok) {
    const r2 = new AwsClient({ accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey!, service: 's3', region: 'auto' });
    const prefix = `inbox/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let total = 0;
    for (const raw of incoming.slice(0, 5)) {
      try {
        const item = raw as Record<string, unknown>;
        const name = safeName(String(item.name ?? 'lampiran'));
        const mime = String(item.mime ?? 'application/octet-stream').slice(0, 120);
        const bytes = base64ToBytes(String(item.content ?? ''));
        if (bytes.byteLength === 0 || bytes.byteLength > MAX_EACH || total + bytes.byteLength > MAX_TOTAL) {
          skippedStore++;
          continue;
        }
        const key = `${prefix}/${name}`;
        const put = await r2.fetch(`${endpoint!.replace(/\/+$/, '')}/${bucket}/${key}`, {
          method: 'PUT',
          body: bytes,
          headers: { 'Content-Type': mime },
        });
        if (!put.ok) {
          console.error('[inbound-email] R2 menolak:', put.status);
          skippedStore++;
          continue;
        }
        stored.push({ name, mime, size: bytes.byteLength, url: `${publicBase!.replace(/\/+$/, '')}/${key}` });
        total += bytes.byteLength;
      } catch (err) {
        console.error('[inbound-email] Gagal menyimpan lampiran:', err instanceof Error ? err.message : err);
        skippedStore++;
      }
    }
  }

  const skippedAll = skippedIncoming + skippedStore;
  if (skippedAll > 0) {
    text += `\n\n(${skippedAll} lampiran terlalu besar/tidak tersimpan — minta pengirim mengirim ulang dengan ukuran lebih kecil.)`;
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { error } = await admin.from('inbound_emails').insert({
    from_addr: from,
    to_addr: to,
    subject,
    text_body: text,
    html_body: html,
    attachments: stored,
  });
  if (error) {
    console.error('[inbound-email] Insert gagal:', error.message);
    return json({ error: 'Gagal menyimpan' }, 500);
  }
  return json({ ok: true, attachments: stored.length });
});
