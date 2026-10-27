// supabase/functions/_shared/emailLayout.ts
// Header & footer email BERSAMA untuk ketiga template produksi — meniru
// SATU komponen EmailHeader/EmailFooter di src/pages/EmailPreviewPage.tsx
// agar (1) pembayaran berhasil, (2) konfirmasi kirim ulang PIN, dan
// (3) PIN baru selalu konsisten. Layout tabel + inline style agar aman
// di klien email (Gmail, Outlook, dsb — tanpa CSS eksternal).
// Ikon = PNG raster dari SVG Lucide ASLI (prioritas R2, fallback public/
// icons/ situs — lihat resolveIconUrl) sehingga sama persis dengan ikon
// preview.

import { logoImgTag, resolveIconUrl } from './brandLogo.ts';

/** Kontak layanan — SAMA dengan LOVERSE_CONTACT di src/lib/invoiceData.ts. */
export const LOVERSE_MAIL = 'mail@loverse.id';
export const LOVERSE_WA_DISPLAY = '+62 851-7988-0092';
export const LOVERSE_INSTAGRAM = '@loverse.id';

/** Tumpukan font serif email — padanan `font-serif` Tailwind di preview. */
const SERIF = `Georgia,'Times New Roman',serif`;

/** Font brand "Loverse" — Cormorant Garamond dulu, fallback serif sistem
 * (klien email umumnya tak memuat webfont eksternal). */
const BRAND = `'Cormorant Garamond',Georgia,'Times New Roman',serif`;

/** Escape entitas HTML — nama mempelai & URL berasal dari input publik. */
export function escapeEmailHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Logo: gambar dari R2/situs, fallback teks bila URL tidak tersedia. */
export function emailLogoBlock(logoUrl: string): string {
  return (
    logoImgTag(logoUrl) ||
    `<span style="font-family:${BRAND};font-size:24px;font-weight:600;color:#f5e6d5;">Loverse</span>`
  );
}

/**
 * Tag <img> ikon Lucide PNG. Bila URL ikon tidak tersedia (APP_URL kosong),
 * pakai emoji cadangan agar email tetap terbaca.
 */
export function iconImg(
  appUrl: string,
  name: string,
  size: number,
  alt: string,
  emojiFallback: string,
): string {
  const url = resolveIconUrl(appUrl, name);
  if (!url) return emojiFallback;
  return `<img src="${url}" alt="${alt}" width="${size}" height="${size}" style="display:inline-block;width:${size}px;height:${size}px;border:0;vertical-align:middle;" />`;
}

/** Baris header cokelat #5E2318: logo + tagline kiri, slogan kanan. */
export function emailHeaderHtml(logoUrl: string): string {
  return `<tr>
    <td style="background-color:#5e2318;padding:24px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td style="vertical-align:middle;">
            ${emailLogoBlock(logoUrl)}
            <p style="margin:4px 0 0;color:#f5e6d5;font-size:12px;">Undangan Digital Pernikahan</p>
          </td>
          <td align="right" style="vertical-align:middle;">
            <p style="margin:0;padding-left:16px;border-left:1px solid rgba(255,255,255,0.3);color:#f5e6d5;font-size:10px;font-weight:bold;letter-spacing:2px;line-height:1.9;">ABADIKAN<br/>MOMEN SPESIAL<br/>DALAM SATU<br/>CERITA INDAH</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

/** Footer: LoVerse kiri, serif italic "A Story for Forever ♥" kanan. */
export function emailFooterHtml(appUrl: string): string {
  return `<div style="margin-top:32px;border-top:1px solid #f0e2d0;padding-top:20px;text-align:left;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td style="vertical-align:bottom;">
          <p style="margin:0;font-family:${BRAND};font-size:20px;font-weight:600;color:#8a6a55;">LoVerse</p>
          <p style="margin:2px 0 0;font-size:12px;color:#b89a83;">Undangan Digital Pernikahan</p>
        </td>
        <td align="right" style="vertical-align:bottom;">
          <p style="margin:0;font-family:${SERIF};font-size:22px;font-style:italic;color:#8a6a55;">A Story for Forever ${iconImg(appUrl, 'heart', 18, 'love', '<span style="color:#d9bfa4;">&hearts;</span>')}</p>
          <p style="margin:4px 0 0;font-size:11px;color:#b89a83;">Terima kasih telah menjadi bagian dari kisah indah ini.</p>
        </td>
      </tr>
    </table>
  </div>`;
}

/** Lingkaran ikon hero 64px — PNG Lucide persis seperti preview. */
export function heroIconHtml(appUrl: string, iconName: string, bg: string, alt: string, emojiFallback: string): string {
  return `<div style="width:64px;height:64px;border-radius:999px;background-color:${bg};margin:0 auto;text-align:center;line-height:64px;">${iconImg(appUrl, iconName, 30, alt, `<span style="font-size:30px;">${emojiFallback}</span>`)}</div>`;
}

/** 6 sel digit PIN — meniru kotak per-digit preview (selalu 6 sel). */
export function pinCellsHtml(pin: string): string {
  const digits = (pin || '').slice(0, 6).padEnd(6, '•').split('');
  const cells = digits
    .map(
      (d) =>
        `<td class="pin-cell" style="background-color:#fdf3e7;border-radius:8px;padding:12px 0;width:48px;text-align:center;color:#4a1f14;font-size:30px;font-weight:bold;">${escapeEmailHtml(d)}</td><td class="pin-gap" style="width:8px;"></td>`,
    )
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 auto;"><tr>${cells}</tr></table>`;
}

/** Kotak PIN dashed + tombol pil URL login — dipakai tab pembayaran & PIN baru. */
export function pinBoxHtml(pin: string, loginUrl: string, appUrl: string): string {
  const loginInner = loginUrl
    ? `<a href="${escapeEmailHtml(loginUrl)}" style="color:#5a2318;font-weight:bold;text-decoration:none;">${escapeEmailHtml(loginUrl)} ${iconImg(appUrl, 'external-link', 14, 'buka', '&#8599;')}</a>`
    : 'halaman <strong>Login Dashboard</strong> di website LoVerse';
  return `<div style="border:1px dashed #e0b896;border-radius:16px;background-color:#fffdf8;padding:24px;margin:24px 0 0;text-align:center;">
    <p style="margin:0;color:#8a6a55;font-size:13px;font-weight:bold;letter-spacing:2px;">${iconImg(appUrl, 'lock', 15, 'kunci', '&#128274;')} KODE PIN DASHBOARD ANDA</p>
    <div style="margin-top:16px;">${pinCellsHtml(pin)}</div>
    <p style="margin:16px auto 0;max-width:380px;color:#8C8075;font-size:13px;line-height:1.6;">Gunakan kombinasi <strong>No. WhatsApp</strong> dan PIN di atas untuk masuk melalui</p>
    <p style="margin:8px 0 0;"><span style="display:inline-block;background-color:#f7e8d5;border-radius:999px;padding:6px 16px;color:#5a2318;font-size:13px;font-weight:bold;">${loginInner}</span></p>
  </div>`;
}

/** Kartu bantuan (headset + email/WA/IG) — tab pembayaran. */
export function helpCardHtml(appUrl: string): string {
  return `<div style="margin-top:16px;background-color:#faf8f4;border-radius:12px;padding:20px;text-align:left;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td width="56" style="vertical-align:middle;">
          <div style="width:56px;height:56px;border-radius:999px;background-color:#f7e8d5;text-align:center;line-height:56px;">${iconImg(appUrl, 'headset', 28, 'bantuan', '&#127911;')}</div>
        </td>
        <td style="padding-left:20px;vertical-align:middle;">
          <p style="margin:0;font-size:15px;color:#4a1f14;"><strong>Butuh bantuan?</strong> <span style="color:#8C8075;">Kami siap membantu Anda.</span></p>
          <p style="margin:10px 0 0;font-size:13px;color:#57493D;line-height:2;">
            ${iconImg(appUrl, 'mail', 15, 'email', '&#9993;')} ${LOVERSE_MAIL}&nbsp;&nbsp;&nbsp;${iconImg(appUrl, 'phone', 15, 'telepon', '&#128222;')} ${LOVERSE_WA_DISPLAY}<br/>${iconImg(appUrl, 'instagram', 15, 'instagram', '&#128247;')} ${LOVERSE_INSTAGRAM}
          </p>
        </td>
      </tr>
    </table>
  </div>`;
}

/** Kerangka luar email 600px di atas latar #F1E8DC. Responsif: padding,
 * heading & sel PIN mengecil di layar <=480px (tanpa mengubah desktop). */
export function emailShellHtml(headerRow: string, bodyInner: string): string {
  return `<!DOCTYPE html>
<html lang="id">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      @media only screen and (max-width: 480px) {
        .email-outer-pad { padding: 20px 10px !important; }
        .email-body-pad { padding: 24px 20px !important; }
        .hero-title { font-size: 28px !important; }
        .hero-sub { font-size: 20px !important; }
        .section-title { font-size: 26px !important; }
        .pin-cell { width: 38px !important; font-size: 24px !important; padding: 10px 0 !important; }
        .pin-gap { width: 5px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:#F1E8DC;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-outer-pad" style="background-color:#F1E8DC;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:24px;border-collapse:separate;border-spacing:0;overflow:hidden;">
            ${headerRow}
            <tr>
              <td class="email-body-pad" style="padding:32px 40px;text-align:center;">
                ${bodyInner}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
