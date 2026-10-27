// supabase/functions/reply-email/index.ts
// Balas email masuk dari dashboard admin.
// POST { id, body } dengan sesi admin (Authorization: Bearer <jwt>).
// Otorisasi: requireAdminMfa() — email sesi harus terdaftar di admin_users.
// Mengirim balasan via Resend (dari EMAIL_FROM) ke from_addr pengirim asli,
// lalu menandai is_read + replied_at. Anti-spam sederhana: 1 balasan per
// 30 detik per pesan (kondisional replied_at).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireAdminMfa } from '../_shared/auth.ts'
import { getCorsHeaders, handleCorsPreflight, jsonCors } from '../_shared/cors.ts'

const RESEND_API_URL = 'https://api.resend.com/emails';

/** Escape HTML untuk kutipan pesan asli di badan balasan. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Ubah URL polos menjadi tautan biru bergaris bawah (setelah di-escape,
 * jadi aman dari injeksi HTML).
 */
export function linkifyEmailText(text: string): string {
  return escapeHtml(text).replace(/https?:\/\/[^\s<>"'`\]]+/g, (m) => {
    let url = m;
    let trail = '';
    while (url.length > 0 && /[.,;:!?)]$/.test(url)) {
      trail = url.slice(-1) + trail;
      url = url.slice(0, -1);
    }
    if (!url) return m;
    return `<a href="${url}" target="_blank" rel="noopener" style="color:#1a56db;text-decoration:underline;">${url}</a>${trail}`;
  });
}

const MAX_ATTACH_FILES = 3;
const MAX_ATTACH_EACH = 5 * 1024 * 1024;
const MAX_ATTACH_TOTAL = 8 * 1024 * 1024;

export interface ReplyAttachmentOut {
  filename: string;
  content: string;
}

/** Validasi lampiran balasan (base64). Maks 3 file, @maks 5MB, total maks 8MB. */
export function validateReplyAttachments(list: unknown): { files: ReplyAttachmentOut[]; error?: string } {
  if (list == null) return { files: [] };
  if (!Array.isArray(list)) return { files: [], error: 'Format lampiran salah.' };
  if (list.length > MAX_ATTACH_FILES) return { files: [], error: 'Maksimal 3 lampiran per balasan.' };
  const files: ReplyAttachmentOut[] = [];
  let total = 0;
  for (const raw of list) {
    const item = (raw ?? {}) as Record<string, unknown>;
    const content = String(item.content ?? '').replace(/\s/g, '');
    if (!content || !/^[A-Za-z0-9+/=]+$/.test(content)) {
      return { files: [], error: 'Isi lampiran tidak valid.' };
    }
    const bytes = Math.floor((content.length * 3) / 4);
    if (bytes === 0 || bytes > MAX_ATTACH_EACH) {
      return { files: [], error: 'Tiap lampiran maksimal 5MB.' };
    }
    total += bytes;
    if (total > MAX_ATTACH_TOTAL) {
      return { files: [], error: 'Total lampiran maksimal 8MB.' };
    }
    const rawName = String(item.filename ?? 'lampiran');
    const filename = (rawName.split(/[\\/]/).pop() || 'lampiran').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 150) || 'lampiran';
    files.push({ filename, content });
  }
  return { files };
}

serve(async (req) => {
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight
  if (req.method === 'GET') return new Response('ok', { status: 200, headers: getCorsHeaders(req) });
  if (req.method !== 'POST') return jsonCors(req, { error: 'Method not allowed' }, 405);

  const caller = await requireAdminMfa(req);
  if (!caller.ok) return jsonCors(req, { error: caller.error ?? 'Forbidden' }, 403);

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return jsonCors(req, { error: 'Bad request' }, 400);
  }
  const id = String(payload.id ?? '');
  const bodyText = String(payload.body ?? '').trim();
  if (!id || !bodyText) return jsonCors(req, { error: 'id dan body wajib diisi.' }, 400);
  if (bodyText.length > 10000) return jsonCors(req, { error: 'Balasan maksimal 10.000 karakter.' }, 400);
  const attachCheck = validateReplyAttachments(payload.attachments);
  if (attachCheck.error) return jsonCors(req, { error: attachCheck.error }, 400);

  const service = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { data: msg, error: fetchError } = await service
    .from('inbound_emails')
    .select('id, from_addr, subject, replied_at')
    .eq('id', id)
    .maybeSingle();
  if (fetchError || !msg) return jsonCors(req, { error: 'Pesan tidak ditemukan.' }, 404);

  // Anti dobel-kirim: tolak bila baru saja dibalas (<30 detik).
  if (msg.replied_at && Date.now() - new Date(msg.replied_at).getTime() < 30_000) {
    return jsonCors(req, { error: 'Balasan baru saja dikirim. Tunggu sebentar.' }, 429);
  }

  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('EMAIL_FROM') || 'LoVerse <mail@loverse.id>';
  if (!apiKey) return jsonCors(req, { error: 'RESEND_API_KEY belum dikonfigurasi.' }, 500);

  const subject = /^re:\s/i.test(msg.subject) ? msg.subject : `Re: ${msg.subject}`;
  const html =
    `<p style="white-space:pre-wrap;">${linkifyEmailText(bodyText).replace(/\n/g, '<br/>')}</p>` +
    `<hr/><p style="color:#8C8075;font-size:12px;">— Balasan dari tim LoVerse<br/>` +
    `Membalas pesan: &ldquo;${escapeHtml(msg.subject)}&rdquo;</p>`;

  const resendPayload: Record<string, unknown> = { from, to: [msg.from_addr], subject, html };
  if (attachCheck.files.length > 0) resendPayload.attachments = attachCheck.files;

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(resendPayload),
  });
  if (!res.ok) {
    console.error('[reply-email] Resend error:', await res.text());
    return jsonCors(req, { error: 'Gagal mengirim balasan.' }, 502);
  }

  await service
    .from('inbound_emails')
    .update({ is_read: true, replied_at: new Date().toISOString() })
    .eq('id', id);

  return jsonCors(req, { ok: true });
});
