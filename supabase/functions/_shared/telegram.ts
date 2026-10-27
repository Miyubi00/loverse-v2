// supabase/functions/_shared/telegram.ts
// Helper Telegram Bot API (single admin).
// Env wajib: TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID
// Env khusus perintah: TELEGRAM_ALLOWED_USER_IDS (comma-separated user_id Telegram yang boleh pakai perintah, mis. "12345,67890").
// Jika tidak diset, hanya chat_id admin yang dianggap allowed.

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
const ADMIN_CHAT_ID = Deno.env.get('TELEGRAM_ADMIN_CHAT_ID') ?? '';

function allowedUserIds(): Set<string> {
  const raw = Deno.env.get('TELEGRAM_ALLOWED_USER_IDS') ?? '';
  const ids = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (ids.length === 0 && ADMIN_CHAT_ID) {
    // Fallback: izinkan chat admin saja (untuk private chat, chat_id == user_id)
    return new Set([ADMIN_CHAT_ID]);
  }
  return new Set(ids);
}

export function isTelegramConfigured(): boolean {
  return Boolean(BOT_TOKEN && ADMIN_CHAT_ID);
}

export function isAllowedTelegramUser(userId: number | string): boolean {
  const set = allowedUserIds();
  // Jika tidak dikonfigurasi, izinkan semua (single-admin)
  if (set.size === 0) return true;
  return set.has(String(userId));
}

export function getAdminChatId(): string {
  return ADMIN_CHAT_ID;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  replyToMessageId?: number,
): Promise<{ ok: boolean; messageId?: number; error?: string }> {
  if (!BOT_TOKEN) return { ok: false, error: 'BOT_TOKEN missing' };
  try {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    };
    if (replyToMessageId) body.reply_to_message_id = replyToMessageId;
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      return { ok: false, error: JSON.stringify(data).slice(0, 500) };
    }
    return { ok: true, messageId: data.result?.message_id as number | undefined };
  } catch (e) {
    return { ok: false, error: String(e).slice(0, 500) };
  }
}

export async function answerTelegramCallback(
  callbackQueryId: string,
  text?: string,
): Promise<void> {
  if (!BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
    });
  } catch {
    /* ignore */
  }
}
