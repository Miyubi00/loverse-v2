// ============================================================
// src/pages/EmailPreviewPage.tsx
// ------------------------------------------------------------
// Preview EMAIL (dev-only, route /dev/email): 3 tab meniru desain
// referensi yang disetujui — header & footer SAMA di ketiganya:
//  (1) pembayaran berhasil, (2) konfirmasi kirim ulang PIN,
//  (3) PIN baru. Form kiri editable, pratinjau kanan.
// Belum dipakai produksi; template HTML email produksi ditulis
// ulang mengikuti desain ini setelah disetujui.
// Keterikatan : react; lucide-react; ../lib/invoiceData.
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CircleCheck,
  ExternalLink,
  FileText,
  Headset,
  Heart,
  Instagram,
  KeyRound,
  Lock,
  Mail,
  PartyPopper,
  Phone,
  Send,
  ShieldAlert,
} from 'lucide-react';
import { INVOICE_SAMPLE, LOVERSE_CONTACT } from '../lib/invoiceData';

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-stone-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-sm text-stone-800 focus:border-[#712E1E] focus:outline-none"
      />
    </label>
  );
}


/* Header & footer email — SATU komponen agar ketiga pratinjau
   (pembayaran, konfirmasi PIN, PIN baru) selalu konsisten. */
function EmailHeader() {
  return (
    <div className="flex items-center justify-between bg-[#5E2318] px-8 py-6">
      <div>
        <Link to="/" aria-label="Loverse — Beranda" className="inline-flex">
          <img src="/logo.png" alt="Loverse" width={680} height={220} className="h-10 w-auto" />
        </Link>
        <p className="mt-1 text-[12px] text-[#f5e6d5]">Undangan Digital Pernikahan</p>
      </div>
      <div className="border-l border-white/30 pl-4 text-[10px] font-semibold uppercase leading-[1.9] tracking-[0.22em] text-[#f5e6d5]">
        Abadikan<br />Momen Spesial<br />Dalam Satu<br />Cerita Indah
      </div>
    </div>
  );
}

function EmailFooter() {
  return (
    <div className="mt-8 flex items-end justify-between border-t border-[#f0e2d0] pt-5 text-left">
      <div>
        <span className="inline-flex bg-ink-950 px-2.5 py-2">
          <img src="/logo.png" alt="Loverse" width={680} height={220} className="h-6 w-auto" />
        </span>
        <p className="mt-2 text-[12px] text-[#b89a83]">Undangan Digital Pernikahan</p>
      </div>
      <div className="text-right">
        <p className="flex items-center justify-end gap-2 font-serif text-[22px] italic text-[#8a6a55]">
          A Story for Forever <Heart className="h-5 w-5 text-[#d9bfa4]" />
        </p>
        <p className="mt-1 text-[11px] text-[#b89a83]">Terima kasih telah menjadi bagian dari kisah indah ini.</p>
      </div>
    </div>
  );
}

type EmailTab = 'payment' | 'confirm' | 'pin';

const TABS: { id: EmailTab; label: string }[] = [
  { id: 'payment', label: '1 · Pembayaran' },
  { id: 'confirm', label: '2 · Konfirmasi PIN' },
  { id: 'pin', label: '3 · PIN Baru' },
];

export default function EmailPreviewPage() {
  const [tab, setTab] = useState<EmailTab>('payment');
  const [groom, setGroom] = useState(INVOICE_SAMPLE.groomName);
  const [bride, setBride] = useState(INVOICE_SAMPLE.brideName);
  const [pin, setPin] = useState('425260');
  const [loginUrl, setLoginUrl] = useState(`${LOVERSE_CONTACT.siteUrl}/login`);
  const reset = () => {
    setGroom(INVOICE_SAMPLE.groomName);
    setBride(INVOICE_SAMPLE.brideName);
    setPin('425260');
    setLoginUrl(`${LOVERSE_CONTACT.siteUrl}/login`);
  };
  const digits = (pin || '------').slice(0, 6).padEnd(6, '•').split('');

  return (
    <div className="min-h-screen bg-stone-200 py-6 px-3 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-stone-800">Preview Email Baru</h1>
            <p className="text-xs text-stone-500">Hanya ada di dev — tidak ikut ke production. Pilih tab email, ubah form, pratinjau ikut berubah.</p>
            <div className="mt-2 flex gap-1.5">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                    tab === t.id ? 'bg-[#712E1E] text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <Link to="/" className="text-xs font-bold text-[#712E1E] underline">Beranda</Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          <div className="h-fit space-y-3 rounded-xl bg-white p-4 shadow">
            <Field label="Mempelai Pria" value={groom} onChange={setGroom} />
            <Field label="Mempelai Wanita" value={bride} onChange={setBride} />
            <Field label="PIN Dashboard (6 digit)" value={pin} onChange={(v) => setPin(v.replace(/\D/g, '').slice(0, 6))} />
            <Field label="URL Login" value={loginUrl} onChange={setLoginUrl} />
            <button
              type="button"
              onClick={reset}
              className="w-full rounded-lg bg-stone-100 px-3 py-2 text-xs font-bold text-stone-600 hover:bg-stone-200"
            >
              Kembalikan contoh
            </button>
            <p className="text-[11px] leading-relaxed text-stone-400">
              Pratinjau kanan meniru lebar email (±600px). Template produksi menyusul setelah desain ini disetujui.
            </p>
          </div>

          {/* ---------- pratinjau email ---------- */}
          <div className="flex justify-center">
            <div className="w-full max-w-[600px] overflow-hidden rounded-[24px] bg-white shadow">
              <EmailHeader />
              {tab === 'payment' && (
              <div className="px-6 py-8 text-center sm:px-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#faf3e9]">
                  <PartyPopper className="h-8 w-8 text-[#712E1E]" />
                </div>
                <p className="mt-4 font-serif text-[36px] font-black leading-tight text-[#4a1f14]">Terima kasih</p>
                <p className="font-serif text-[25px] leading-snug text-[#4a1f14]">telah menggunakan jasa kami!</p>
                <p className="mx-auto mt-3 max-w-[440px] text-[14px] leading-relaxed text-stone-600">
                  Pembayaran untuk undangan digital pernikahan{' '}
                  <strong className="text-stone-800">{groom} &amp; {bride}</strong> telah kami terima dengan sukses.
                </p>
                <p className="mt-1 text-[14px] text-stone-500">Undangan Anda kini aktif dan siap disebar ke para tamu.</p>

                <div className="mt-4">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#e6f6ec] px-5 py-2 text-sm font-bold text-[#1a7a3c]">
                    <CircleCheck className="h-5 w-5" /> Pembayaran Berhasil
                  </span>
                </div>


                {/* kotak PIN */}
                <div className="mt-6 rounded-2xl border border-dashed border-[#e0b896] bg-[#fffdf8] p-6">
                  <p className="flex items-center justify-center gap-2 text-[13px] font-bold uppercase tracking-[0.18em] text-[#8a6a55]">
                    <Lock className="h-4 w-4" /> Kode PIN Dashboard Anda
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    {digits.map((d, i) => (
                      <span
                        key={i}
                        className="flex h-14 w-12 items-center justify-center rounded-lg bg-[#fdf3e7] text-[32px] font-black text-[#4a1f14] shadow-sm"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                  <p className="mx-auto mt-4 max-w-[380px] text-[13px] leading-relaxed text-stone-500">
                    Gunakan kombinasi <strong className="text-stone-700">No. WhatsApp</strong> dan PIN di atas untuk masuk melalui
                  </p>
                  <p className="mt-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#f7e8d5] px-4 py-1.5 text-[13px] font-bold text-[#5a2318]">
                      {loginUrl} <ExternalLink className="h-4 w-4" />
                    </span>
                  </p>
                </div>

                {/* box invoice */}
                <div className="mt-4 flex items-start gap-4 rounded-xl bg-[#faf6ef] p-5 text-left">
                  <FileText className="h-10 w-10 shrink-0 text-[#a33a2a]" />
                  <div>
                    <p className="text-[15px] font-black text-[#5a2318]">Invoice Resmi Terlampir</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-stone-500">
                      Kami telah melampirkan berkas PDF bukti pembayaran resmi pada email ini untuk arsip Anda.
                    </p>
                  </div>
                </div>

                {/* kartu bantuan */}
                <div className="mt-4 flex items-center gap-5 rounded-xl bg-[#faf8f4] p-5 text-left">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f7e8d5]">
                    <Headset className="h-7 w-7 text-[#5a2318]" />
                  </span>
                  <div>
                    <p className="text-[15px] text-stone-700">
                      <strong className="text-[#4a1f14]">Butuh bantuan?</strong>{' '}
                      <span className="text-stone-500">Kami siap membantu Anda.</span>
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-stone-600">
                      <span className="inline-flex items-center gap-2">
                        <Mail className="h-4 w-4 text-[#712E1E]" /> {LOVERSE_CONTACT.email}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Phone className="h-4 w-4 text-[#712E1E]" /> {LOVERSE_CONTACT.whatsappDisplay}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Instagram className="h-4 w-4 text-[#712E1E]" /> {LOVERSE_CONTACT.instagram}
                      </span>
                    </div>
                  </div>
                </div>

                <EmailFooter />
                </div>
              )}
              {tab === 'confirm' && (
                <div className="px-6 py-8 text-center sm:px-10">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#faf3e9]">
                    <KeyRound className="h-8 w-8 text-[#712E1E]" />
                  </div>
                  <p className="mt-4 font-serif text-[30px] font-black leading-tight text-[#4a1f14]">Permintaan PIN Baru</p>
                  <p className="mx-auto mt-3 max-w-[440px] text-[14px] leading-relaxed text-stone-600">
                    Halo <strong className="text-stone-800">{groom} &amp; {bride}</strong>, kami menerima permintaan kirim ulang
                    PIN dashboard untuk undangan Anda.
                  </p>
                  <div className="mx-auto mt-4 flex max-w-[440px] items-start gap-3 rounded-xl bg-[#fff8ec] p-4 text-left">
                    <ShieldAlert className="h-5 w-5 shrink-0 text-[#b7791f]" />
                    <p className="text-[13px] leading-relaxed text-stone-600">
                      <strong className="text-stone-800">Bukan Anda yang meminta?</strong> Klik “Bukan Saya” atau abaikan
                      email ini — PIN Anda <strong>TIDAK akan berubah</strong>. Link berlaku 30 menit.
                    </p>
                  </div>
                  <div className="mt-5">
                    <span className="inline-flex items-center gap-2 rounded-xl bg-[#712E1E] px-8 py-3 text-[15px] font-bold text-white">
                      <CircleCheck className="h-5 w-5" /> Ya, Kirim PIN Baru
                    </span>
                  </div>
                  <p className="mt-3">
                    <span className="text-[13px] font-bold text-stone-500 underline">Bukan Saya — Batalkan Permintaan</span>
                  </p>
                  <p className="mx-auto mt-4 max-w-[440px] text-[12px] leading-relaxed text-stone-400">
                    Tombol tidak berfungsi? Salin link ini ke browser:<br />
                    <span className="break-all text-[#b7791f]">{loginUrl}/forgot-pin/confirm?token=…</span>
                  </p>
                  <EmailFooter />
                </div>
              )}
              {tab === 'pin' && (
                <div className="px-6 py-8 text-center sm:px-10">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e6f6ec]">
                    <Send className="h-8 w-8 text-[#1a7a3c]" />
                  </div>
                  <p className="mt-4 font-serif text-[30px] font-black leading-tight text-[#4a1f14]">PIN Baru Anda</p>
                  <p className="mx-auto mt-3 max-w-[440px] text-[14px] leading-relaxed text-stone-600">
                    Halo <strong className="text-stone-800">{groom} &amp; {bride}</strong>, berikut PIN dashboard baru Anda.
                    PIN lama sudah tidak berlaku lagi.
                  </p>
                  <div className="mt-6 rounded-2xl border border-dashed border-[#e0b896] bg-[#fffdf8] p-6">
                    <p className="flex items-center justify-center gap-2 text-[13px] font-bold uppercase tracking-[0.18em] text-[#8a6a55]">
                      <Lock className="h-4 w-4" /> Kode PIN Dashboard Anda
                    </p>
                    <div className="mt-4 flex justify-center gap-2">
                      {digits.map((d, i) => (
                        <span
                          key={i}
                          className="flex h-14 w-12 items-center justify-center rounded-lg bg-[#fdf3e7] text-[32px] font-black text-[#4a1f14] shadow-sm"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                    <p className="mx-auto mt-4 max-w-[380px] text-[13px] leading-relaxed text-stone-500">
                      Gunakan kombinasi <strong className="text-stone-700">No. WhatsApp</strong> dan PIN di atas untuk masuk melalui
                    </p>
                    <p className="mt-2">
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#f7e8d5] px-4 py-1.5 text-[13px] font-bold text-[#5a2318]">
                        {loginUrl} <ExternalLink className="h-4 w-4" />
                      </span>
                    </p>
                  </div>
                  <div className="mt-4 flex items-start gap-4 rounded-xl bg-[#faf6ef] p-5 text-left">
                    <FileText className="h-10 w-10 shrink-0 text-[#a33a2a]" />
                    <div>
                      <p className="text-[15px] font-black text-[#5a2318]">Jaga kerahasiaan PIN Anda</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-stone-500">
                        Jangan bagikan PIN ini kepada siapa pun. Jika Anda tidak merasa meminta PIN baru, segera hubungi kami.
                      </p>
                    </div>
                  </div>
                  <EmailFooter />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

