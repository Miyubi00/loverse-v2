// supabase/functions/telegram-webhook/index.ts
// Webhook Telegram -> teruskan balasan admin ke klien (via DB transcript).
// Hanya user_id yang ada di TELEGRAM_ALLOWED_USER_IDS yang boleh memicu.
// Setup webhook: https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<project>.supabase.co/functions/v1/telegram-webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
const WEBHOOK_SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET') ?? '';

function isAllowedUser(userId: number | string, chatId?: number | string): boolean {
  const raw = Deno.env.get('TELEGRAM_ALLOWED_USER_IDS') ?? '';
  const trimmed = raw.trim();
  // Fail-closed: tanpa daftar ID, TOLAK semua (sebelumnya allow-all).
  // Set TELEGRAM_ALLOWED_USER_IDS di Supabase secrets bila pakai handover.
  if (!trimmed) {
    console.error('[telegram-webhook] TELEGRAM_ALLOWED_USER_IDS belum diset — menolak.');
    return false;
  }
  const ids = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
  if (ids.includes(String(userId))) return true;
  // Fallback: izinkan jika chatId cocok dengan ADMIN_CHAT_ID (untuk group)
  const adminChat = Deno.env.get('TELEGRAM_ADMIN_CHAT_ID') ?? '';
  if (adminChat && String(chatId) === String(adminChat)) return true;
  return false;
}

function getAdmin() {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!url || !key) return null;
  return createClient(url, key);
}

async function sendTelegram(chatId: string | number, text: string) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  }).catch(() => {});
}

serve(async (req) => {
  if (req.method === 'GET') return new Response('ok', { status: 200 });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  // Validasi webhook secret — WAJIB diset (fail-closed). Tanpa secret,
  // siapa pun bisa POST JSON Telegram palsu dan menginjeksi transcript.
  if (!WEBHOOK_SECRET) {
    console.error('[telegram-webhook] TELEGRAM_WEBHOOK_SECRET belum diset — menolak.');
    return new Response('Forbidden', { status: 403 });
  }
  const got = req.headers.get('x-telegram-bot-api-secret-token') ?? '';
  if (got !== WEBHOOK_SECRET) return new Response('Forbidden', { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const message = (body.message ?? body.edited_message) as Record<string, unknown> | undefined;
  if (!message) return new Response('ok', { status: 200 });

  const from = message.from as { id?: number; username?: string } | undefined;
  const chat = message.chat as { id?: number } | undefined;
  const text = ((message.text ?? message.caption) as string | undefined)?.trim() ?? '';
  const replyTo = (message.reply_to_message as Record<string, unknown> | undefined);
  const replyText = ((replyTo?.text ?? replyTo?.caption) as string | undefined) ?? '';

  const userId = from?.id;
  const chatId = chat?.id;
  console.log(`[telegram-webhook] recv from user=${userId} chat=${chatId} text="${text.slice(0, 80)}" replyTo="${replyText.slice(0, 40)}"`);
  if (!userId || !chatId) return new Response('ok', { status: 200 });

  if (!isAllowedUser(userId, chatId)) {
    console.warn(`[telegram-webhook] Blocked user ${userId} in chat ${chatId}`);
    await sendTelegram(chatId, '⛔ Kamu tidak diizinkan. Set TELEGRAM_ALLOWED_USER_IDS di Supabase secrets.');
    return new Response('ok', { status: 200 });
  }

  // Perintah khusus admin
  if (text === '/start' || text === '/help') {
    await sendTelegram(chatId, 'Perintah:\n/close - akhiri sesi aktif\n/list - lihat sesi aktif\nBalas (reply) pesan notif klien untuk menjawab.');
    return new Response('ok', { status: 200 });
  }
  if (text === '/list') {
    const admin = getAdmin();
    if (admin) {
      const { data } = await admin.from('telegram_handover_sessions').select('anon_id, updated_at').eq('status', 'active').order('updated_at', { ascending: false }).limit(5);
      if (!data || data.length === 0) await sendTelegram(chatId, 'Tidak ada sesi aktif.');
      else {
        const list = data.map((r: { anon_id: string; updated_at: string }) => `• ${r.anon_id.slice(0, 8)} — ${r.updated_at}`).join('\n');
        await sendTelegram(chatId, `Sesi aktif:\n${list}`);
      }
    }
    return new Response('ok', { status: 200 });
  }
  if (text === '/close') {
    const admin = getAdmin();
    if (admin) {
      // tutup sesi yang terkait reply, atau yang terbaru
      let target: { id: string; anon_id: string } | null = null;
      if (replyTo) {
        const m = replyText.match(/Anon:\s*([a-z0-9-]{4,8})/i);
        if (m) {
          const prefix = m[1];
          const { data } = await admin.from('telegram_handover_sessions').select('id, anon_id').eq('status', 'active').ilike('anon_id', `${prefix}%`).maybeSingle();
          if (data) target = data as typeof target;
        }
      }
      if (!target) {
        const { data } = await admin.from('telegram_handover_sessions').select('id, anon_id').eq('status', 'active').order('updated_at', { ascending: false }).limit(1).maybeSingle();
        if (data) target = data as typeof target;
      }
      if (target) {
        // Tulis pesan penutup ke transcript agar klien dapat notifikasi
        try {
          const { data: sess } = await admin.from('telegram_handover_sessions').select('transcript').eq('id', target.id).single();
          const transcript = Array.isArray((sess as { transcript: unknown })?.transcript) ? (sess as { transcript: unknown[] }).transcript : [];
          (transcript as unknown[]).push({ role: 'admin', content: 'Sesi diakhiri oleh admin. Kamu kembali terhubung dengan LoVerse AI.', at: new Date().toISOString() });
          await admin.from('telegram_handover_sessions').update({ transcript, status: 'closed' }).eq('id', target.id);
        } catch {
          await admin.from('telegram_handover_sessions').update({ status: 'closed' }).eq('id', target.id);
        }
        await sendTelegram(chatId, `✅ Sesi ${target.anon_id.slice(0, 8)} ditutup. Klien akan melihat notifikasi.`);
      } else {
        await sendTelegram(chatId, 'Tidak ada sesi aktif untuk ditutup.');
      }
    }
    return new Response('ok', { status: 200 });
  }

  // Pesan biasa dari admin -> teruskan ke klien
  // Cari sesi target:优先 dari reply_to_message (prefix anon), lalu sesi aktif terbaru
  const admin = getAdmin();
  if (!admin) return new Response('ok', { status: 200 });

  let targetId: string | null = null;
  let targetAnon: string | null = null;
  if (replyTo && replyText) {
    const m = replyText.match(/Anon:\s*([a-z0-9-]{4,8})|Klien\s+([a-z0-9]{4,8})/i);
    const prefix = m?.[1] ?? m?.[2];
    console.log(`[telegram-webhook] reply prefix="${prefix}"`);
    if (prefix) {
      const { data } = await admin.from('telegram_handover_sessions').select('id,anon_id').eq('status', 'active').ilike('anon_id', `${prefix}%`).maybeSingle();
      if (data) {
        targetId = (data as { id: string }).id;
        targetAnon = (data as { anon_id: string }).anon_id;
      }
    }
  }
  if (!targetId) {
    const { data } = await admin.from('telegram_handover_sessions').select('id, anon_id, updated_at').eq('status', 'active').order('updated_at', { ascending: false }).limit(1).maybeSingle();
    console.log(`[telegram-webhook] fallback latest active:`, data);
    if (data && Date.now() - new Date((data as { updated_at: string }).updated_at).getTime() < 15 * 60 * 1000) {
      targetId = (data as { id: string }).id;
      targetAnon = (data as { anon_id: string }).anon_id;
    }
  }
  console.log(`[telegram-webhook] targetId=${targetId} anon=${targetAnon}`);
  if (!targetId) {
    await sendTelegram(chatId, 'Tidak ada sesi aktif. Balas pesan notif klien (Reply) atau tunggu permintaan baru /list untuk cek.');
    return new Response('ok', { status: 200 });
  }

  // Append balasan admin ke transcript
  const { data: sess } = await admin.from('telegram_handover_sessions').select('transcript').eq('id', targetId).single();
  const transcript = Array.isArray((sess as { transcript: unknown })?.transcript) ? (sess as { transcript: unknown[] }).transcript : [];
  (transcript as unknown[]).push({ role: 'admin', content: text, at: new Date().toISOString() });
  await admin.from('telegram_handover_sessions').update({ transcript }).eq('id', targetId);

  await sendTelegram(chatId, '✅ Terkirim ke klien.');
  return new Response('ok', { status: 200 });
});
