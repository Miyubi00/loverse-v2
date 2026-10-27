// supabase/functions/_shared/brandLogo.ts
// Satu sumber kebenaran untuk logo LoVerse di SEMUA email (invoice/pembayaran
// dan kirim ulang PIN) sekaligus banner PDF invoice.
//
// Nama berkas sengaja dipisah karena lokasinya berbeda:
// - Di Cloudflare R2 (bucket media publik) berkasnya bernama `logo.png`.
// - Di website (folder public/) berkasnya bernama `logo.png`.
// Logo = lockup horizontal ikon hati + wordmark serif "Loverse" (peach,
// transparan) sehingga menyatu dengan header/banner cokelat tanpa kartu
// putih tambahan.
//
// PENTING — dimensi di bawah adalah ukuran yang DIGUNAKAN, bukan ukuran asli
// file. File asli 680×220 (lockup ikon hati + wordmark Cormorant), tapi untuk
// email & PDF kita pakai 180×58 agar terlihat rapi di header cokelat tanpa
// mendominasi. Rasio dipertahankan 680:220 ≈ 3.09.

const R2_LOGO_FILE = 'logo.png';
const SITE_LOGO_FILE = 'logo.png';

/** Ukuran logo yang digunakan di email & PDF — lebih kecil dari asli (680×220)
  * agar tidak mendominasi header cokelat. Rasio dipertahankan 680:220 ≈ 3.09. */
const EMAIL_LOGO_SIZE = { width: 180, height: 58 };
const PDF_LOGO_HEIGHT = 40; // tinggi logo di banner PDF (lebar mengikuti rasio)

/**
 * Basis URL publik untuk aset (logo & ikon): prioritas Cloudflare R2,
 * fallback domain situs. String kosong bila keduanya tidak tersedia.
 */
export function resolvePublicBase(appUrl: string): string {
  const r2PublicBase = (Deno.env.get('R2_PUBLIC_URL') || '').replace(/\/+$/, '');
  if (r2PublicBase) return r2PublicBase;
  return (appUrl || '').replace(/\/+$/, '');
}

/**
 * URL logo: prioritas Cloudflare R2 ({R2_PUBLIC_URL}/logo.png), fallback
 * domain situs ({APP_URL}/logo.png). String kosong bila keduanya tidak
 * tersedia — pemanggil memakai teks "Loverse" sebagai cadangan.
 */
export function resolveLogoUrl(appUrl: string): string {
  const base = resolvePublicBase(appUrl);
  return base ? `${base}/${R2_LOGO_FILE}` : '';
}

/**
 * URL ikon email Lucide PNG — pola SAMA seperti logo: prioritas R2
 * ({R2_PUBLIC_URL}/icons/{nama}.png, di-upload via
 * scripts/upload-email-icons.mjs), fallback folder public situs
 * ({APP_URL}/icons/{nama}.png). String kosong bila keduanya tak tersedia.
 */
export function resolveIconUrl(appUrl: string, name: string): string {
  const base = resolvePublicBase(appUrl);
  return base ? `${base}/icons/${name}.png` : '';
}

/**
 * Markup <img> logo untuk EMAIL — ukuran 180×58, proporsional, max-width 100%.
 * Mengembalikan string kosong bila tidak ada URL logo.
 */
export function logoImgTag(logoUrl: string): string {
  if (!logoUrl) return '';
  return (
    `<img src="${logoUrl}" alt="Loverse" width="${EMAIL_LOGO_SIZE.width}" height="${EMAIL_LOGO_SIZE.height}" ` +
    `style="display:block;width:${EMAIL_LOGO_SIZE.width}px;max-width:100%;height:auto;border:0;" />`
  );
}

/**
 * Dimensi logo untuk PDF (tinggi tetap, lebar dihitung dari rasio asli).
 */
export function pdfLogoDimensions(): { height: number; ratio: number } {
  return { height: PDF_LOGO_HEIGHT, ratio: EMAIL_LOGO_SIZE.width / EMAIL_LOGO_SIZE.height };
}