// ============================================================
// src/pages/InvoicePreviewPage.tsx
// ------------------------------------------------------------
// Preview invoice BARU (dev-only, route /dev/invoice): form editable +
// pratinjau HTML meniru desain referensi — header cokelat, 2 kartu info,
// tabel produk, 2 kartu ketentuan/kontak, kartu terima kasih, footer.
// Belum dipakai produksi; PDF menyusul setelah desain disetujui.
// Keterikatan : react; ../lib/invoiceData.
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  CalendarDays,
  FileText,
  Globe,
  Heart,
  Info,
  Instagram,
  Mail,
  Phone,
  User,
} from 'lucide-react';
import { INVOICE_SAMPLE, LOVERSE_CONTACT, formatInvoiceRupiah, type InvoiceSampleData } from '../lib/invoiceData';

/* ---------- atom kecil ---------- */

function Field({ label, value, onChange }: { label: string; value: string | number; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-[14px] font-bold uppercase tracking-wider text-ink-500 mb-1">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-cream-300 bg-white px-2.5 py-1.5 text-sm text-ink-800 focus:border-ink-900 focus:outline-none"
      />
    </label>
  );
}

function CardTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="text-[14px] font-bold uppercase tracking-wider text-ink-500 mb-3 flex items-center gap-2">
      <span className="text-ink-900">{icon}</span>
      {children}
    </p>
  );
}

/* Baris kontak berikon — dipakai di kartu pelanggan & kartu bantuan. */
function ContactRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2.5">
      <span className="text-ink-900">{icon}</span>
      <span>{children}</span>
    </p>
  );
}

/* ---------- halaman ---------- */

export default function InvoicePreviewPage() {
  const [form, setForm] = useState<InvoiceSampleData>(INVOICE_SAMPLE);
  const set = (key: keyof InvoiceSampleData) => (v: string) =>
    setForm((f) => ({ ...f, [key]: key === 'price' ? Number(v.replace(/\D/g, '')) || 0 : v }));
  const reset = () => setForm(INVOICE_SAMPLE);
  const priceText = formatInvoiceRupiah(form.price);

  return (
    <div className="min-h-screen bg-cream-200 py-6 px-3 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-ink-800">Preview Invoice Baru</h1>
            <p className="text-[14px] text-ink-500">Hanya ada di dev — tidak ikut ke production. Ubah form, pratinjau ikut berubah.</p>
          </div>
          <Link to="/" className="text-[14px] font-bold text-ink-900 underline">Beranda</Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          <div className="h-fit rounded-xl bg-white p-4 shadow space-y-3">
            <Field label="Mempelai Pria" value={form.groomName} onChange={set('groomName')} />
            <Field label="Mempelai Wanita" value={form.brideName} onChange={set('brideName')} />
            <Field label="WhatsApp" value={form.whatsapp} onChange={set('whatsapp')} />
            <Field label="Email" value={form.email} onChange={set('email')} />
            <Field label="Tgl Acara" value={form.weddingDate} onChange={set('weddingDate')} />
            <Field label="No. Invoice" value={form.orderId} onChange={set('orderId')} />
            <Field label="Tanggal" value={form.issueDate} onChange={set('issueDate')} />
            <Field label="Tema" value={form.templateName} onChange={set('templateName')} />
            <Field label="Harga" value={form.price} onChange={set('price')} />
            <Field label="Metode" value={form.paymentMethod} onChange={set('paymentMethod')} />
            <button onClick={reset} className="w-full rounded-lg bg-cream-200 py-2 text-[14px] font-bold text-ink-600 hover:bg-cream-200">Reset</button>
          </div>
          <div className="overflow-hidden rounded-xl bg-white shadow">
            <div className="bg-ink-900 px-6 py-6 flex items-start justify-between gap-4">
              <div>
                <Link to="/" aria-label="Loverse — Beranda" className="inline-flex">
                  <img src="/logo.png" alt="Loverse" width={680} height={220} className="h-10 w-auto" />
                </Link>
                <p className="mt-1.5 text-[14px] text-peach-300/90">Undangan Pernikahan Digital</p>
                <p className="mt-2 text-[14px] italic text-peach-300/80">Abadikan Momen Spesial, Dalam Satu Cerita Indah</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-black tracking-[0.06em] text-cream-200">INVOICE</p>
                <p className="mt-1 text-[14px] font-bold tracking-[0.06em] text-peach-300/90">BUKTI PEMBAYARAN</p>
                <div className="my-2 ml-auto h-px w-12 bg-peach-300/70" />
                <p className="text-[14px] text-peach-300/80">{LOVERSE_CONTACT.domain}</p>
              </div>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              <div className="rounded-xl bg-cream-100 p-4">
                <CardTitle icon={<User className="h-5 w-5" />}>Ditagihkan Kepada</CardTitle>
                <p className="text-lg font-black text-ink-900">{form.groomName} &amp; {form.brideName}</p>
                <div className="mt-3 space-y-1.5 text-[14px] text-ink-600">
                  <ContactRow icon={<Phone className="h-4 w-4" />}>{form.whatsapp}</ContactRow>
                  <ContactRow icon={<Mail className="h-4 w-4" />}>{form.email}</ContactRow>
                  <ContactRow icon={<CalendarDays className="h-4 w-4" />}>Tgl. Acara: {form.weddingDate}</ContactRow>
                </div>
              </div>
              <div className="rounded-xl bg-cream-100 p-4">
                <CardTitle icon={<FileText className="h-5 w-5" />}>Informasi Pembayaran</CardTitle>
                <p className="text-[14px] text-ink-600">No. Invoice: <b className="text-ink-800">{form.orderId}</b></p>
                <p className="text-[14px] text-ink-600">Tanggal: {form.issueDate}</p>
                <p className="text-[14px] text-ink-600">Metode: <b className="text-ink-800">{form.paymentMethod.toUpperCase()}</b></p>
                <div className="mt-3 flex items-center gap-3 rounded-lg bg-success-600/10 px-3 py-2.5">
                  <BadgeCheck className="h-8 w-8 shrink-0 text-success-700" />
                  <div>
                    <p className="text-[14px] font-black text-success-700">LUNAS / PAID</p>
                    <p className="text-[14px] text-success-700/80">Terima kasih atas kepercayaannya!</p>
                  </div>
                </div>
              </div>
            </div>


            <div className="px-4">
              <table className="w-full overflow-hidden rounded-xl text-left text-[14px]">
                <thead>
                  <tr className="bg-ink-900 text-cream-200">
                    <th className="w-10 px-3 py-3 font-bold">NO</th>
                    <th className="px-3 py-3 font-bold">DESKRIPSI PRODUK</th>
                    <th className="px-3 py-3 font-bold">KATEGORI</th>
                    <th className="px-3 py-3 text-right font-bold">JUMLAH (IDR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-cream-50">
                    <td className="px-3 py-3 align-top text-ink-500">1</td>
                    <td className="px-3 py-3">
                      <p className="font-bold text-ink-900">Undangan Digital Pernikahan</p>
                      <p className="mt-0.5 text-ink-500">Desain Tematik: {form.templateName}</p>
                    </td>
                    <td className="px-3 py-3 align-top text-ink-600">Web Invitation</td>
                    <td className="px-3 py-3 text-right align-top font-bold text-ink-900">{priceText}</td>
                  </tr>
                  <tr className="bg-cream-200">
                    <td colSpan={3} className="px-3 py-3 text-right font-black uppercase text-ink-900">Total Pembayaran</td>
                    <td className="px-3 py-3 text-right text-xl font-black text-ink-900">{priceText}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              <div className="rounded-xl bg-cream-100 p-4">
                <p className="mb-3 flex items-center gap-2 text-[14px] font-black text-ink-900">
                  <Info className="h-5 w-5" /> Informasi dan Ketentuan Layanan
                </p>
                <ol className="space-y-3 text-[14px] leading-relaxed text-ink-600">
                  <li className="flex gap-2.5"><span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cream-300 text-[14px] font-black text-ink-900">1</span><span>Undangan digital Anda aktif secara otomatis dan dapat langsung dibagikan kepada para tamu undangan.</span></li>
                  <li className="flex gap-2.5"><span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cream-300 text-[14px] font-black text-ink-900">2</span><span>Perubahan data acara, jadwal, lokasi, foto, musik, dan fitur lainnya dapat dilakukan melalui dashboard kapan saja 24/7.</span></li>
                  <li className="flex gap-2.5"><span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cream-300 text-[14px] font-black text-ink-900">3</span><span>Simpan invoice resmi ini sebagai bukti pembayaran Anda yang sah.</span></li>
                </ol>
              </div>
              <div className="rounded-xl bg-cream-100 p-4">
                <p className="mb-3 flex items-center gap-2 text-[14px] font-black text-ink-900">
                  <Heart className="h-5 w-5" /> Butuh bantuan? Hubungi kami:
                </p>
                <div className="space-y-2.5 text-[14px] text-ink-600">
                  <ContactRow icon={<Mail className="h-4 w-4" />}>{LOVERSE_CONTACT.email}</ContactRow>
                  <ContactRow icon={<Phone className="h-4 w-4" />}>{LOVERSE_CONTACT.whatsappDisplay}</ContactRow>
                  <ContactRow icon={<Instagram className="h-4 w-4" />}>{LOVERSE_CONTACT.instagram}</ContactRow>
                  <ContactRow icon={<Globe className="h-4 w-4" />}>{LOVERSE_CONTACT.domain}</ContactRow>
                </div>
              </div>
            </div>
            <div className="px-4">
              <div className="flex items-center gap-4 rounded-xl bg-cream-100 p-5">
                <div className="border-l border-cream-300 pl-4">
                  <p className="text-lg font-black text-ink-900">Terima kasih</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-ink-500">Telah mempercayakan momen spesial Anda kepada LoVerse.<br />Semoga perjalanan cinta Anda selalu diberkahi.</p>
                </div>
                <p className="ml-auto hidden text-right font-serif text-2xl italic leading-tight text-cream-400 sm:block">A Story<br />for Forever</p>
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-col gap-1 border-t border-cream-300 pt-3 text-[14px] text-ink-500 sm:flex-row sm:justify-between">
                <p>© 2026 LoVerse. Dokumen Bukti Pembayaran Digital Sah.</p>
                <p>{LOVERSE_CONTACT.email} | {LOVERSE_CONTACT.whatsappDisplay} | {LOVERSE_CONTACT.domain}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

