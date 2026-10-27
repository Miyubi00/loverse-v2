// supabase/functions/_shared/resendPinEmail.ts
// Email KIRIM ULANG PIN dashboard — format SENGAJA DIBEDAKAN dari email
// invoice (_shared/resendEmail.ts): subject berbeda, TANPA lampiran PDF
// invoice, dan ada peringatan PIN lama hangus.
// Skema warna cokelat khas LoVerse (#712E1E) + logo dari Cloudflare R2
// ({R2_PUBLIC_URL}/logo.png, fallback {APP_URL}/logo.png — lihat
// _shared/brandLogo.ts).
// Dipanggil oleh: supabase/functions/resend-pin.
// Logo memakai _shared/brandLogo.ts agar seragam dengan email invoice.

import { resolveLogoUrl } from './brandLogo.ts';
import {
  emailFooterHtml,
  emailHeaderHtml,
  emailShellHtml,
  escapeEmailHtml,
  heroIconHtml,
  iconImg,
  pinBoxHtml,
} from './emailLayout.ts';

export interface SendResendPinArgs {
  to: string;
  groomName: string;
  brideName: string;
  pin: string;
  weddingDate?: string;
  templateName?: string;
}

export interface SendEmailResult {
  ok: boolean;
  error?: string;
}

const RESEND_API_URL = 'https://api.resend.com/emails';

/** Template HTML PIN BARU — meniru tab 3 EmailPreviewPage. */
export function buildNewPinHtml(
  { groomName, brideName, pin }: Omit<SendResendPinArgs, 'to'>,
): string {
  const couple = `${escapeEmailHtml(groomName)} &amp; ${escapeEmailHtml(brideName)}`;
  const appUrl = (Deno.env.get('APP_URL') || '').replace(/\/+$/, '');
  const loginUrl = appUrl ? `${appUrl}/login` : '';
  const logoUrl = resolveLogoUrl(appUrl);

  const body = `${heroIconHtml(appUrl, 'send', '#e6f6ec', 'pin baru', '&#128228;')}
    <p class="section-title" style="margin:16px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:bold;line-height:1.2;color:#4a1f14;">PIN Baru Anda</p>
    <p style="margin:12px auto 0;max-width:440px;color:#57493D;font-size:14px;line-height:1.6;">
      Halo <strong>${couple}</strong>, berikut PIN dashboard baru Anda.
      PIN lama sudah tidak berlaku lagi.
    </p>
    ${pinBoxHtml(pin, loginUrl, appUrl)}
    <div style="margin-top:16px;background-color:#faf6ef;border-radius:12px;padding:20px;text-align:left;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td width="52" style="vertical-align:top;">${iconImg(appUrl, 'file-text', 36, 'keamanan', '&#128196;')}</td>
          <td style="vertical-align:top;">
            <p style="margin:0;font-size:15px;font-weight:bold;color:#5a2318;">Jaga kerahasiaan PIN Anda</p>
            <p style="margin:4px 0 0;font-size:13px;line-height:1.6;color:#8C8075;">
              Jangan bagikan PIN ini kepada siapa pun. Jika Anda tidak merasa meminta PIN baru, segera hubungi kami.
            </p>
          </td>
        </tr>
      </table>
    </div>
    ${emailFooterHtml(appUrl)}`;

  return emailShellHtml(emailHeaderHtml(logoUrl), body);
}

/**
 * Kirim email KIRIM ULANG PIN — tanpa lampiran invoice, subject berbeda,
 * agar mudah dibedakan dari email pembayaran/invoice.
 */
export async function sendResendPinEmail(args: SendResendPinArgs): Promise<SendEmailResult> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('EMAIL_FROM') || 'LoVerse <onboarding@resend.dev>';

  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY belum dikonfigurasi di Supabase secrets.' };
  if (!args.to) return { ok: false, error: 'Email pelanggan tidak tersedia.' };

  try {
    const payload: Record<string, unknown> = {
      from,
      to: [args.to],
      subject: `PIN Baru Dashboard — Undangan ${args.groomName} & ${args.brideName}`
        .replace(/[<>&"']/g, ''),
      html: buildNewPinHtml(args),
    };

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error('[resendPinEmail] Gagal kirim:', body);
      return { ok: false, error: `Resend API error (${response.status})` };
    }

    return { ok: true };
  } catch (err) {
    console.error('[resendPinEmail] Exception:', err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
export interface SendResendConfirmArgs {
  to: string;
  groomName: string;
  brideName: string;
  weddingDate?: string;
  templateName?: string;
  confirmUrl: string;
  cancelUrl: string;
}

/** Template email KONFIRMASI — meniru tab 2 EmailPreviewPage. */
export function buildConfirmPinHtml(
  { groomName, brideName, confirmUrl, cancelUrl }:
    Omit<SendResendConfirmArgs, 'to'>,
): string {
  const couple = `${escapeEmailHtml(groomName)} &amp; ${escapeEmailHtml(brideName)}`;
  const appUrl = (Deno.env.get('APP_URL') || '').replace(/\/+$/, '');
  const logoUrl = resolveLogoUrl(appUrl);

  const body = `${heroIconHtml(appUrl, 'key-round', '#faf3e9', 'kunci', '&#128273;')}
    <p class="section-title" style="margin:16px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:bold;line-height:1.2;color:#4a1f14;">Permintaan PIN Baru</p>
    <p style="margin:12px auto 0;max-width:440px;color:#57493D;font-size:14px;line-height:1.6;">
      Halo <strong>${couple}</strong>, kami menerima permintaan kirim ulang
      PIN dashboard untuk undangan Anda.
    </p>
    <div style="margin:16px auto 0;max-width:440px;background-color:#fff8ec;border-radius:12px;padding:16px;text-align:left;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td width="28" style="vertical-align:top;">${iconImg(appUrl, 'shield-alert', 20, 'peringatan', '&#9888;')}</td>
          <td style="vertical-align:top;">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#57493D;">
              <strong>Bukan Anda yang meminta?</strong> Klik &ldquo;Bukan Saya&rdquo; atau abaikan
              email ini — PIN Anda <strong>TIDAK akan berubah</strong>. Link berlaku 30 menit.
            </p>
          </td>
        </tr>
      </table>
    </div>
    <p style="margin:20px 0 0;">
      <a href="${escapeEmailHtml(confirmUrl)}" style="display:inline-block;background-color:#712E1E;color:#ffffff;font-weight:bold;font-size:15px;padding:13px 32px;border-radius:12px;text-decoration:none;">${iconImg(appUrl, 'circle-check-white', 17, 'ya', '&#10004;')} Ya, Kirim PIN Baru</a>
    </p>
    <p style="margin:12px 0 0;">
      <a href="${escapeEmailHtml(cancelUrl)}" style="color:#8C8075;font-weight:bold;font-size:13px;text-decoration:underline;">Bukan Saya — Batalkan Permintaan</a>
    </p>
    <p style="margin:16px auto 0;max-width:440px;color:#A08D7B;font-size:12px;line-height:1.6;">
      Tombol tidak berfungsi? Salin link ini ke browser:<br/>
      <span style="color:#b7791f;word-break:break-all;">${escapeEmailHtml(confirmUrl)}</span>
    </p>
    ${emailFooterHtml(appUrl)}`;

  return emailShellHtml(emailHeaderHtml(logoUrl), body);
}

/**
 * Kirim email KONFIRMASI kirim ulang PIN (tanpa mengubah apa pun).
 * Reset baru terjadi setelah pemilik mengeklik link konfirmasi.
 */
export async function sendResendConfirmEmail(args: SendResendConfirmArgs): Promise<SendEmailResult> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('EMAIL_FROM') || 'LoVerse <onboarding@resend.dev>';

  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY belum dikonfigurasi di Supabase secrets.' };
  if (!args.to) return { ok: false, error: 'Email pelanggan tidak tersedia.' };

  try {
    const payload: Record<string, unknown> = {
      from,
      to: [args.to],
      subject: `Konfirmasi: Kirim Ulang PIN Dashboard — Undangan ${args.groomName} & ${args.brideName}`
        .replace(/[<>&"']/g, ''),
      html: buildConfirmPinHtml(args),
    };

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error('[resendPinEmail] Gagal kirim (confirm):', body);
      return { ok: false, error: `Resend API error (${response.status})` };
    }

    return { ok: true };
  } catch (err) {
    console.error('[resendPinEmail] Exception (confirm):', err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
