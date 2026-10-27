// supabase/functions/_shared/resendEmail.ts
// Layanan email transaksional modular via Resend dengan Lampiran Invoice PDF otomatis.
// Dipanggil oleh midtrans-webhook (pembayaran otomatis) dan
// activate-pending-order (aktivasi manual oleh admin).

import { PDFDocument, rgb, StandardFonts, type PDFImage } from 'npm:pdf-lib';
import { INVOICE_ICON_PNG, INVOICE_SERIF_FONT_B64 } from './invoiceAssets.ts';
import { BRAND_FONT_B64 } from './brandFont.ts';
import { resolveLogoUrl, pdfLogoDimensions } from './brandLogo.ts';
import {
  emailFooterHtml,
  emailHeaderHtml,
  emailShellHtml,
  escapeEmailHtml,
  helpCardHtml,
  heroIconHtml,
  iconImg,
  pinBoxHtml,
} from './emailLayout.ts';

export interface SendPinEmailArgs {
  to: string;
  groomName: string;
  brideName: string;
  pin: string;
  orderId?: string;
  whatsapp?: string;
  weddingDate?: string;
  templateName?: string;
  price?: number;
  paymentMethod?: string;
}

export interface SendEmailResult {
  ok: boolean;
  error?: string;
}

const RESEND_API_URL = 'https://api.resend.com/emails';

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Unduh logo lalu sematkan sebagai gambar PDF. Selalu mengembalikan null
 * (tanpa throw) bila URL kosong, unduhan gagal, atau berkasnya bukan PNG
 * valid — pemanggil memakai teks "LoVerse" sebagai cadangan.
 */
async function embedLogoPng(pdfDoc: PDFDocument, logoUrl: string): Promise<PDFImage | null> {
  if (!logoUrl) return null;
  try {
    const res = await fetch(logoUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await pdfDoc.embedPng(new Uint8Array(await res.arrayBuffer()));
  } catch (err) {
    console.error('[resendEmail] Gagal menyematkan logo ke PDF:', err);
    return null;
  }
}

/**
 * Ikon invoice = PNG raster dari SVG Lucide ASLI (96px, transparan,
 * stroke cokelat #712E1E / hijau badge) — di-embed dari base64 bawaan
 * (invoiceAssets.ts) tanpa fetch, jadi sama persis dengan preview web.
 * Kunci 'badge-check-green' = varian hijau untuk badge LUNAS.
 */
function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function embedInvoiceIcons(pdfDoc: PDFDocument): Promise<Map<string, PDFImage>> {
  const map = new Map<string, PDFImage>();
  for (const [key, b64] of Object.entries(INVOICE_ICON_PNG)) {
    try {
      map.set(key, await pdfDoc.embedPng(base64ToBytes(b64)));
    } catch {
      // Satu ikon gagal tidak boleh menggagalkan seluruh PDF.
    }
  }
  return map;
}

/**
 * Tempel ikon PNG di halaman PDF.
 * @param yTop posisi ATAS ikon (koordinat PDF); size = lebar & tinggi.
 */
function drawInvoiceIcon(page: any, icons: Map<string, PDFImage>, name: string, x: number, yTop: number, size: number): void {
  const img = icons.get(name);
  if (!img) return;
  try {
    page.drawImage(img, { x, y: yTop - size, width: size, height: size });
  } catch {
    // Abaikan ikon yang gagal digambar.
  }
}

/** Path SVG persegi rounded dalam kotak LOKAL (0,0,w,h, sumbu-y ke bawah
 * seperti SVG asli) — dipakai karena pdf-lib tidak punya rounded rect.
 * Sudut digambar dengan kurva Bezier kubik (bukan arc A) agar arah
 * lengkungan pasti cembung keluar walau sumbu-y di-flip pdf-lib. */
function roundRectPath(
  w: number,
  h: number,
  r: number,
  corners?: { tl?: boolean; tr?: boolean; br?: boolean; bl?: boolean },
): string {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  const k = 0.5522847498 * rr;
  const c = { tl: true, tr: true, br: true, bl: true, ...(corners || {}) };
  const t = (v: number) => String(Math.round(v * 100) / 100);
  let p = `M ${t(c.bl ? rr : 0)} ${t(h)}`;
  p += ` L ${t(w - (c.br ? rr : 0))} ${t(h)}`;
  if (c.br) p += ` C ${t(w - rr + k)} ${t(h)} ${t(w)} ${t(h - rr + k)} ${t(w)} ${t(h - rr)}`;
  p += ` L ${t(w)} ${t(c.tr ? rr : 0)}`;
  if (c.tr) p += ` C ${t(w)} ${t(rr - k)} ${t(w - rr + k)} 0 ${t(w - rr)} 0`;
  p += ` L ${t(c.tl ? rr : 0)} 0`;
  if (c.tl) p += ` C ${t(rr - k)} 0 0 ${t(rr - k)} 0 ${t(rr)}`;
  p += ` L 0 ${t(h - (c.bl ? rr : 0))}`;
  if (c.bl) p += ` C 0 ${t(h - rr + k)} ${t(rr - k)} ${t(h)} ${t(rr)} ${t(h)}`;
  return p + ' Z';
}

/** Gambar kartu rounded (fill + border) meniru rounded-xl preview. */
function fillRoundRect(
  page: any,
  opts: {
    x: number; y: number; width: number; height: number; radius: number;
    corners?: { tl?: boolean; tr?: boolean; br?: boolean; bl?: boolean };
    color?: any; borderColor?: any; borderWidth?: number;
  },
): void {
  try {
    // Path lokal (0,0,w,h) dipetakan ke (x, yTop=y+h): drawSvgPath me-flip
    // sumbu-y, jadi titik lokal atas (sy=0) tepat jatuh di atas kartu PDF.
    page.drawSvgPath(roundRectPath(opts.width, opts.height, opts.radius, opts.corners), {
      x: opts.x,
      y: opts.y + opts.height,
      scale: 1,
      color: opts.color,
      borderColor: opts.borderColor,
      borderWidth: opts.borderWidth ?? 0,
    });
  } catch {
    page.drawRectangle({
      x: opts.x, y: opts.y, width: opts.width, height: opts.height,
      color: opts.color, borderColor: opts.borderColor, borderWidth: opts.borderWidth ?? 0,
    });
  }
}

/** Nomor invoice terpusat: LV-XXXXXX apa adanya, UUID -> INV-8hex pertama. */
export function invoiceNumberFor(orderId: string | undefined): string {
  const raw = (orderId || '').trim().toUpperCase();
  if (/^LV-[A-Z0-9]{6,12}$/.test(raw)) return raw;
  return `INV-${raw.replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'LOVERSE'}`;
}

/** Potong teks dengan '...' agar muat dalam lebar maksimum. */
function truncatePdfText(text: string, font: any, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let cut = text.length;
  while (cut > 4 && font.widthOfTextAtSize(text.slice(0, cut) + '...', size) > maxWidth) cut--;
  return text.slice(0, cut) + '...';
}

/** Bungkus teks per kata agar muat dalam lebar maksimum. */
function wrapPdfText(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (font.widthOfTextAtSize(t, size) <= maxWidth || !cur) {
      cur = t;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines.length > 0 ? lines : [text];
}

/**
 * Buat file PDF Invoice secara on-the-fly di memori tanpa memakan storage.
 */
export async function generateInvoicePdf(args: SendPinEmailArgs): Promise<string | null> {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    // Serif italic untuk teks italic preview ("A Story for Forever", tagline):
    // Gelasio Italic (mirip Georgia) bila fontkit tersedia, fallback
    // Times Italic bawaan (tetap serif) bila gagal.
    const fontTimesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    let fontSerif: any = fontTimesItalic;
    // Cormorant Garamond untuk teks brand "LoVerse" (fallback bila logo gagal).
    let fontBrand: any = fontBold;
    try {
      const fk = await import('npm:@pdf-lib/fontkit');
      pdfDoc.registerFontkit(fk.default || fk);
      fontSerif = await pdfDoc.embedFont(base64ToBytes(INVOICE_SERIF_FONT_B64));
      fontBrand = await pdfDoc.embedFont(base64ToBytes(BRAND_FONT_B64));
    } catch {
      fontSerif = fontTimesItalic;
      fontBrand = fontBold;
    }

    // Palet menyamai preview /dev/invoice (InvoicePreviewPage.tsx).
    const brown = rgb(0.443, 0.18, 0.118); // #712E1E
    const creamCard = rgb(0.98, 0.965, 0.937); // #faf6ef
    const creamBorder = rgb(0.92, 0.875, 0.81);
    const goldTitle = rgb(0.725, 0.541, 0.42); // #b98a6b
    const creamText = rgb(1, 0.835, 0.686); // #FFD5AF
    const creamHeading = rgb(0.961, 0.902, 0.827); // #f5e6d3
    const totalRow = rgb(0.953, 0.91, 0.847); // #f3e8d8
    const badgeBg = rgb(0.863, 0.937, 0.886); // #dcefe2
    const badgeGreen = rgb(0.18, 0.49, 0.31); // #2e7d4f
    const badgeBorder = rgb(0.749, 0.91, 0.8);
    const numBg = rgb(0.941, 0.875, 0.784); // #f0dfc8
    const stoneDark = rgb(0.2, 0.2, 0.2);
    const stoneGray = rgb(0.36, 0.33, 0.3);
    const softGray = rgb(0.45, 0.42, 0.38);

    // Nomor invoice: ID pesanan APA ADANYA bila format pendek LV-XXXXXX
    // (jalur Midtrans). Pesanan manual (activate-pending-order) memakai UUID
    // internal -> tampilkan INV- + 8 hex PERTAMA (stabil & enak dibaca),
    // bukan 8 karakter terakhir yang acak.
    const orderIdStr = invoiceNumberFor(args.orderId);
    const issueDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const priceNumber = typeof args.price === 'number' && args.price > 0 ? args.price : 60000;
    const formattedPrice = `Rp ${priceNumber.toLocaleString('id-ID')}`;
    const appUrl = Deno.env.get('APP_URL') || 'https://loverse.id';

    // Logo PNG (sumber sama dengan header email) disematkan ke banner.
    const logoImage = await embedLogoPng(pdfDoc, resolveLogoUrl(appUrl));
    // Ikon PNG bawaan (tanpa fetch) — di-embed sekali per dokumen.
    const iconImgs = await embedInvoiceIcons(pdfDoc);

    // 1. Header Banner — meniru preview: kiri logo stacked + tagline,
    //    kanan INVOICE besar + BUKTI PEMBAYARAN + garis + domain.
    page.drawRectangle({
      x: 0,
      y: 710,
      width: 595.28,
      height: 132,
      color: brown,
    });

    if (logoImage) {
      const { height: logoHeight, ratio } = pdfLogoDimensions();
      const logoWidth = ratio * logoHeight;
      page.drawImage(logoImage, {
        x: 40,
        y: 786,
        width: logoWidth,
        height: logoHeight,
      });
      page.drawText('Undangan Pernikahan Digital', {
        x: 40,
        y: 772,
        size: 10,
        font: fontRegular,
        color: creamText,
      });
      page.drawText('Abadikan Momen Spesial, Dalam Satu Cerita Indah', {
        x: 40,
        y: 758,
        size: 9,
        font: fontSerif,
        color: creamText,
      });
    } else {
      page.drawText('LoVerse', {
        x: 40,
        y: 800,
        size: 20,
        font: fontBrand,
        color: creamText,
      });
      page.drawText('Undangan Pernikahan Digital', {
        x: 40,
        y: 784,
        size: 10,
        font: fontRegular,
        color: creamText,
      });
      page.drawText('Abadikan Momen Spesial, Dalam Satu Cerita Indah', {
        x: 40,
        y: 770,
        size: 9,
        font: fontSerif,
        color: creamText,
      });
    }

    // Kanan: INVOICE (besar) + BUKTI PEMBAYARAN (kecil) + domain
    const pdfRight = 555.28;
    const invW = fontBold.widthOfTextAtSize('INVOICE', 22);
    page.drawText('INVOICE', {
      x: pdfRight - invW,
      y: 800,
      size: 22,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    const buktiW = fontBold.widthOfTextAtSize('BUKTI PEMBAYARAN', 10);
    page.drawText('BUKTI PEMBAYARAN', {
      x: pdfRight - buktiW,
      y: 780,
      size: 10,
      font: fontBold,
      color: creamText,
    });
    // Garis pemisah kecil rata kanan seperti preview (w-12).
    page.drawLine({
      start: { x: pdfRight - 48, y: 772 },
      end: { x: pdfRight, y: 772 },
      thickness: 1.5,
      color: creamText,
    });
    page.drawText('loverse.id', {
      x: pdfRight - fontRegular.widthOfTextAtSize('loverse.id', 10),
      y: 760,
      size: 10,
      font: fontRegular,
      color: creamText,
    });

    // 2. DUA KARTU INFO — meniru preview (bg cream, judul + ikon).
    const kartuY = 680; // atas kartu
    const kartuBottom = 540; // bawah kartu
    const kartuTinggi = kartuY - kartuBottom;
    const kiriX = 40;
    const kiriW = 252;
    const kananX = 303;
    const kananW = 252.28;
    // Label metode dipadatkan agar muat di kartu: transfer manual selalu
    // tampil "TRANSFER MANUAL" (bukan "TRANSFER MANUAL (WHATSAPP CS)...").
    const paymentMethodRaw = (args.paymentMethod || 'Midtrans / Online').trim();
    const paymentMethodLabel = /manual|whatsapp|transfer/i.test(paymentMethodRaw)
      ? 'TRANSFER MANUAL'
      : paymentMethodRaw.toUpperCase();

    // --- KIRI: Ditagihkan Kepada ---
    fillRoundRect(page, {
      x: kiriX,
      y: kartuBottom,
      width: kiriW,
      height: kartuTinggi,
      radius: 10,
      color: creamCard,
      borderColor: creamBorder,
      borderWidth: 1,
    });

    drawInvoiceIcon(page, iconImgs, 'user', kiriX + 12, kartuY - 12, 13);
    page.drawText('DITAGIHKAN KEPADA', {
      x: kiriX + 30,
      y: kartuY - 21,
      size: 9,
      font: fontBold,
      color: goldTitle,
    });

    const coupleText = truncatePdfText(`${args.groomName} & ${args.brideName}`, fontBold, 13, kiriW - 24);
    page.drawText(coupleText, {
      x: kiriX + 12,
      y: kartuY - 45,
      size: 13,
      font: fontBold,
      color: stoneDark,
    });

    const kiriRows: Array<{ icon: string; text: string }> = [
      { icon: 'phone', text: truncatePdfText(`${args.whatsapp || '-'}`, fontRegular, 9.5, kiriW - 48) },
      { icon: 'mail', text: truncatePdfText(`${args.to}`, fontRegular, 9.5, kiriW - 48) },
      { icon: 'calendar-days', text: `Tgl. Acara: ${args.weddingDate || '-'}` },
    ];
    kiriRows.forEach((row, i) => {
      const ry = kartuY - 63 - i * 15;
      drawInvoiceIcon(page, iconImgs, row.icon, kiriX + 12, ry + 8.5, 10);
      page.drawText(row.text, {
        x: kiriX + 27,
        y: ry,
        size: 9.5,
        font: fontRegular,
        color: stoneGray,
      });
    });

    // --- KANAN: Informasi Pembayaran ---
    fillRoundRect(page, {
      x: kananX,
      y: kartuBottom,
      width: kananW,
      height: kartuTinggi,
      radius: 10,
      color: creamCard,
      borderColor: creamBorder,
      borderWidth: 1,
    });

    drawInvoiceIcon(page, iconImgs, 'file-text', kananX + 12, kartuY - 12, 13);
    page.drawText('INFORMASI PEMBAYARAN', {
      x: kananX + 30,
      y: kartuY - 21,
      size: 9,
      font: fontBold,
      color: goldTitle,
    });

    page.drawText('No. Invoice:', {
      x: kananX + 12,
      y: kartuY - 45,
      size: 9.5,
      font: fontRegular,
      color: stoneGray,
    });
    const orderVal = truncatePdfText(orderIdStr, fontBold, 9.5, 130);
    page.drawText(orderVal, {
      x: kananX + kananW - 12 - fontBold.widthOfTextAtSize(orderVal, 9.5),
      y: kartuY - 45,
      size: 9.5,
      font: fontBold,
      color: stoneDark,
    });

    page.drawText('Tanggal:', {
      x: kananX + 12,
      y: kartuY - 61,
      size: 9.5,
      font: fontRegular,
      color: stoneGray,
    });
    const dateVal = truncatePdfText(issueDate, fontRegular, 9.5, 140);
    page.drawText(dateVal, {
      x: kananX + kananW - 12 - fontRegular.widthOfTextAtSize(dateVal, 9.5),
      y: kartuY - 61,
      size: 9.5,
      font: fontRegular,
      color: stoneGray,
    });

    page.drawText('Metode:', {
      x: kananX + 12,
      y: kartuY - 77,
      size: 9.5,
      font: fontRegular,
      color: stoneGray,
    });
    const pmVal = truncatePdfText(paymentMethodLabel, fontBold, 9.5, 140);
    page.drawText(pmVal, {
      x: kananX + kananW - 12 - fontBold.widthOfTextAtSize(pmVal, 9.5),
      y: kartuY - 77,
      size: 9.5,
      font: fontBold,
      color: stoneDark,
    });

    // Badge LUNAS full-width seperti preview (ikon + 2 baris teks).
    const badgeX = kananX + 12;
    const badgeW = kananW - 24;
    const badgeH = 36;
    const badgeY = kartuBottom + 10;
    fillRoundRect(page, {
      x: badgeX,
      y: badgeY,
      width: badgeW,
      height: badgeH,
      radius: 7,
      color: badgeBg,
      borderColor: badgeBorder,
      borderWidth: 1,
    });
    drawInvoiceIcon(page, iconImgs, 'badge-check-green', badgeX + 10, badgeY + badgeH - 7, 22);
    page.drawText('LUNAS / PAID', {
      x: badgeX + 40,
      y: badgeY + 20,
      size: 10,
      font: fontBold,
      color: badgeGreen,
    });
    page.drawText('Terima kasih atas kepercayaannya!', {
      x: badgeX + 40,
      y: badgeY + 8,
      size: 8,
      font: fontRegular,
      color: badgeGreen,
    });

    // 3. Tabel Produk — header cokelat seperti preview + kolom NO.
    fillRoundRect(page, {
      x: 40,
      y: 502,
      width: 515.28,
      height: 28,
      radius: 8,
      corners: { tl: true, tr: true, br: false, bl: false },
      color: brown,
    });

    page.drawText('NO', {
      x: 52,
      y: 512,
      size: 9,
      font: fontBold,
      color: creamHeading,
    });
    page.drawText('DESKRIPSI PRODUK', {
      x: 84,
      y: 512,
      size: 9,
      font: fontBold,
      color: creamHeading,
    });
    page.drawText('KATEGORI', {
      x: 330,
      y: 512,
      size: 9,
      font: fontBold,
      color: creamHeading,
    });
    const jumlahHead = 'JUMLAH (IDR)';
    page.drawText(jumlahHead, {
      x: 543 - fontBold.widthOfTextAtSize(jumlahHead, 9),
      y: 512,
      size: 9,
      font: fontBold,
      color: creamHeading,
    });

    // Baris Produk
    page.drawRectangle({
      x: 40,
      y: 452,
      width: 515.28,
      height: 50,
      color: rgb(1, 1, 1),
      borderColor: creamBorder,
      borderWidth: 1,
    });

    page.drawText('1', {
      x: 52,
      y: 480,
      size: 10,
      font: fontRegular,
      color: softGray,
    });
    page.drawText('Undangan Digital Pernikahan', {
      x: 84,
      y: 483,
      size: 10,
      font: fontBold,
      color: stoneDark,
    });
    const themeLine = truncatePdfText(`Desain Tematik: ${args.templateName || 'Custom Template'}`, fontRegular, 9, 230);
    page.drawText(themeLine, {
      x: 84,
      y: 469,
      size: 9,
      font: fontRegular,
      color: softGray,
    });
    page.drawText('Web Invitation', {
      x: 330,
      y: 477,
      size: 9.5,
      font: fontRegular,
      color: stoneDark,
    });
    page.drawText(formattedPrice, {
      x: 543 - fontBold.widthOfTextAtSize(formattedPrice, 10.5),
      y: 477,
      size: 10.5,
      font: fontBold,
      color: stoneDark,
    });

    // Baris Total (cream gelap seperti preview)
    fillRoundRect(page, {
      x: 40,
      y: 417,
      width: 515.28,
      height: 35,
      radius: 8,
      corners: { tl: false, tr: false, br: true, bl: true },
      color: totalRow,
      borderColor: creamBorder,
      borderWidth: 1,
    });
    const totalLabel = 'TOTAL PEMBAYARAN';
    page.drawText(totalLabel, {
      x: 430 - fontBold.widthOfTextAtSize(totalLabel, 10),
      y: 430,
      size: 10,
      font: fontBold,
      color: brown,
    });
    page.drawText(formattedPrice, {
      x: 543 - fontBold.widthOfTextAtSize(formattedPrice, 12),
      y: 429,
      size: 12,
      font: fontBold,
      color: brown,
    });

    // 4. DUA KARTU BAWAH — ketentuan (kiri) + bantuan (kanan), seperti preview.
    const bTop = 397;
    const bBot = 277;
    const bH = bTop - bBot;
    const bKiriX = 40;
    const bKiriW = 252;
    const bKananX = 303;
    const bKananW = 252.28;

    // --- Kiri: Informasi dan Ketentuan Layanan ---
    fillRoundRect(page, {
      x: bKiriX,
      y: bBot,
      width: bKiriW,
      height: bH,
      radius: 10,
      color: creamCard,
      borderColor: creamBorder,
      borderWidth: 1,
    });
    drawInvoiceIcon(page, iconImgs, 'info', bKiriX + 12, bTop - 12.5, 12);
    page.drawText('Informasi dan Ketentuan Layanan', {
      x: bKiriX + 28,
      y: bTop - 21,
      size: 8.5,
      font: fontBold,
      color: brown,
    });
    const terms = [
      'Undangan digital Anda aktif secara otomatis dan dapat langsung dibagikan kepada para tamu undangan.',
      'Perubahan data acara, jadwal, lokasi, foto, musik, dan fitur lainnya dapat dilakukan melalui dashboard kapan saja 24/7.',
      'Simpan invoice resmi ini sebagai bukti pembayaran Anda yang sah.',
    ];
    let ty = bTop - 34;
    terms.forEach((term, idx) => {
      const lines = wrapPdfText(term, fontRegular, 7.5, bKiriW - 50);
      const cy = ty - 5;
      page.drawCircle({
        x: bKiriX + 19,
        y: cy,
        size: 7,
        color: numBg,
      });
      const num = String(idx + 1);
      page.drawText(num, {
        x: bKiriX + 19 - fontBold.widthOfTextAtSize(num, 7) / 2,
        y: cy - 2.5,
        size: 7,
        font: fontBold,
        color: brown,
      });
      lines.forEach((ln, li) => {
        page.drawText(ln, {
          x: bKiriX + 31,
          y: ty - li * 9.5,
          size: 7.5,
          font: fontRegular,
          color: stoneGray,
        });
      });
      ty -= lines.length * 9.5 + 7;
    });

    // --- Kanan: Butuh bantuan? Hubungi kami ---
    fillRoundRect(page, {
      x: bKananX,
      y: bBot,
      width: bKananW,
      height: bH,
      radius: 10,
      color: creamCard,
      borderColor: creamBorder,
      borderWidth: 1,
    });
    drawInvoiceIcon(page, iconImgs, 'heart', bKananX + 12, bTop - 12.5, 12);
    page.drawText('Butuh bantuan? Hubungi kami:', {
      x: bKananX + 28,
      y: bTop - 21,
      size: 8.5,
      font: fontBold,
      color: brown,
    });
    const helpRows: Array<{ icon: string; text: string }> = [
      { icon: 'mail', text: 'mail@loverse.id' },
      { icon: 'phone', text: '+62 851-7988-0092' },
      { icon: 'instagram', text: '@loverse.id' },
      { icon: 'globe', text: 'loverse.id' },
    ];
    helpRows.forEach((row, i) => {
      const ry = bTop - 40 - i * 16;
      drawInvoiceIcon(page, iconImgs, row.icon, bKananX + 12, ry + 8.5, 10);
      page.drawText(row.text, {
        x: bKananX + 27,
        y: ry,
        size: 8.5,
        font: fontRegular,
        color: stoneGray,
      });
    });

    // 5. Kartu Terima kasih — seperti preview (aksen kiri + italic kanan).
    const thY = 197;
    const thH = 60;
    fillRoundRect(page, {
      x: 40,
      y: thY,
      width: 515.28,
      height: thH,
      radius: 10,
      color: creamCard,
      borderColor: creamBorder,
      borderWidth: 1,
    });
    page.drawLine({
      start: { x: 56, y: thY + 8 },
      end: { x: 56, y: thY + thH - 8 },
      thickness: 2,
      color: rgb(0.898, 0.827, 0.722),
    });
    page.drawText('Terima kasih', {
      x: 68,
      y: thY + 38,
      size: 13,
      font: fontBold,
      color: brown,
    });
    page.drawText('Telah mempercayakan momen spesial Anda kepada LoVerse.', {
      x: 68,
      y: thY + 25,
      size: 8,
      font: fontRegular,
      color: softGray,
    });
    page.drawText('Semoga perjalanan cinta Anda selalu diberkahi.', {
      x: 68,
      y: thY + 15,
      size: 8,
      font: fontRegular,
      color: softGray,
    });
    const story1 = 'A Story';
    const story2 = 'for Forever';
    const storyColor = rgb(0.851, 0.749, 0.643);
    page.drawText(story1, {
      x: 543 - fontSerif.widthOfTextAtSize(story1, 13),
      y: thY + 36,
      size: 13,
      font: fontSerif,
      color: storyColor,
    });
    page.drawText(story2, {
      x: 543 - fontSerif.widthOfTextAtSize(story2, 13),
      y: thY + 20,
      size: 13,
      font: fontSerif,
      color: storyColor,
    });

    // 6. Footer bawah
    page.drawLine({
      start: { x: 40, y: 150 },
      end: { x: 555.28, y: 150 },
      thickness: 1,
      color: rgb(0.9, 0.85, 0.8),
    });

    page.drawText('© 2026 LoVerse. Dokumen Bukti Pembayaran Digital Sah.', {
      x: 40,
      y: 134,
      size: 8,
      font: fontRegular,
      color: rgb(0.65, 0.65, 0.65),
    });

    page.drawText('mail@loverse.id  |  +62 851-7988-0092  |  loverse.id', {
      x: 40,
      y: 122,
      size: 8,
      font: fontRegular,
      color: rgb(0.65, 0.65, 0.65),
    });

    const pdfBytes = await pdfDoc.save();
    return uint8ArrayToBase64(pdfBytes);
  } catch (err) {
    console.error('[resendEmail] Gagal membuat PDF Invoice:', err);
    return null;
  }
}

/** Template email PEMBAYARAN BERHASIL — meniru tab 1 EmailPreviewPage. */
export function buildHtml({ groomName, brideName, pin }: { groomName: string; brideName: string; pin: string }): string {
  const couple = `${escapeEmailHtml(groomName)} &amp; ${escapeEmailHtml(brideName)}`;
  const appUrl = (Deno.env.get('APP_URL') || '').replace(/\/+$/, '');
  const loginUrl = appUrl ? `${appUrl}/login` : '';
  const logoUrl = resolveLogoUrl(appUrl);

  const body = `${heroIconHtml(appUrl, 'party-popper', '#faf3e9', 'selamat', '&#127881;')}
    <p class="hero-title" style="margin:16px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:36px;font-weight:bold;line-height:1.2;color:#4a1f14;">Terima kasih</p>
    <p class="hero-sub" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:1.3;color:#4a1f14;">telah menggunakan jasa kami!</p>
    <p style="margin:12px auto 0;max-width:440px;color:#57493D;font-size:14px;line-height:1.6;">
      Pembayaran untuk undangan digital pernikahan
      <strong>${couple}</strong> telah kami terima dengan sukses.
    </p>
    <p style="margin:4px 0 0;color:#8C8075;font-size:14px;">Undangan Anda kini aktif dan siap disebar ke para tamu.</p>
    <p style="margin:16px 0 0;">
      <span style="display:inline-block;background-color:#e6f6ec;border-radius:999px;padding:8px 20px;color:#1a7a3c;font-size:14px;font-weight:bold;">${iconImg(appUrl, 'circle-check', 16, 'berhasil', '&#10004;')} Pembayaran Berhasil</span>
    </p>
    ${pinBoxHtml(pin, loginUrl, appUrl)}
    <div style="margin-top:16px;background-color:#faf6ef;border-radius:12px;padding:20px;text-align:left;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td width="52" style="vertical-align:top;">${iconImg(appUrl, 'file-text', 36, 'invoice', '&#128196;')}</td>
          <td style="vertical-align:top;">
            <p style="margin:0;font-size:15px;font-weight:bold;color:#5a2318;">Invoice Resmi Terlampir</p>
            <p style="margin:4px 0 0;font-size:13px;line-height:1.6;color:#8C8075;">
              Kami telah melampirkan berkas PDF bukti pembayaran resmi pada email ini untuk arsip Anda.
            </p>
          </td>
        </tr>
      </table>
    </div>
    ${helpCardHtml(appUrl)}
    ${emailFooterHtml(appUrl)}`;

  return emailShellHtml(emailHeaderHtml(logoUrl), body);
}

/**
 * Kirim email berisi ucapan terima kasih, status pembayaran berhasil,
 * PIN 6 digit milik pengguna, dan lampiran file PDF Invoice resmi.
 */
export async function sendPinEmail(args: SendPinEmailArgs): Promise<SendEmailResult> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('EMAIL_FROM') || 'LoVerse <onboarding@resend.dev>';

  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY belum dikonfigurasi di Supabase secrets.' };
  if (!args.to) return { ok: false, error: 'Email pelanggan tidak tersedia.' };

  try {
    const attachments: Array<{ filename: string; content: string }> = [];

    // Generate file Invoice PDF secara on-the-fly di RAM
    const pdfBase64 = await generateInvoicePdf(args);
    if (pdfBase64) {
      // Nama file memakai nomor invoice yang SAMA dengan di dalam PDF.
      const orderIdPart = invoiceNumberFor(args.orderId).replace(/[^A-Z0-9]/g, '');
      attachments.push({
        filename: `Invoice-LoVerse-${orderIdPart}.pdf`,
        content: pdfBase64,
      });
    }

    const payload: Record<string, unknown> = {
      from,
      to: [args.to],
      subject: `Pembayaran Berhasil & Invoice — PIN Undangan ${args.groomName} & ${args.brideName}`
        .replace(/[<>&"']/g, ''),
      html: buildHtml({ groomName: args.groomName, brideName: args.brideName, pin: args.pin }),
    };

    if (attachments.length > 0) {
      payload.attachments = attachments;
    }

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
      console.error('[resendEmail] Gagal kirim:', body);
      return { ok: false, error: `Resend API error (${response.status})` };
    }

    return { ok: true };
  } catch (err) {
    console.error('[resendEmail] Exception:', err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

