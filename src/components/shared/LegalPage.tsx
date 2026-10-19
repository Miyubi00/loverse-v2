// ============================================================
// src/components/shared/LegalPage.tsx
// ------------------------------------------------------------
// Layout bersama utk halaman legal statis (Kebijakan Privasi &
// Syarat & Ketentuan): konsisten dengan gaya halaman publik
// (krem + kartu putih + heading coklat) dan hemat duplikasi.
// Dipakai di  : pages/PrivacyPolicyPage.tsx, pages/TermsPage.tsx
// Keterikatan : react-router-dom (Link), lucide-react, hooks/usePageMeta
// ============================================================

import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePageMeta } from '../../hooks/usePageMeta';

export interface LegalSection {
  title: string;
  body: string[];
}

interface LegalPageLayoutProps {
  title: string;
  metaDescription: string;
  updated: string;
  sections: LegalSection[];
}

// Layout halaman legal statis: brand coklat-krem + daftar section bernomor.
export default function LegalPageLayout({ title, metaDescription, updated, sections }: LegalPageLayoutProps) {
  usePageMeta(`${title} — LoVerse`, metaDescription);

  return (
    <div className="min-h-screen bg-[#F1E8DC] font-sans text-stone-800">
      <div className="container mx-auto max-w-3xl px-4 sm:px-6 py-10 md:py-16">

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#EBDFCE] text-xs font-bold text-[#712E1E] shadow-sm hover:bg-[#FAF6EE] transition active:scale-95"
        >
          <ArrowLeft size={14} className="text-[#E59A59]" />
          Kembali ke Beranda
        </Link>

        <h1 className="mt-6 text-2xl sm:text-3xl md:text-4xl font-brand font-semibold text-[#712E1E]">
          {title}
        </h1>
        <p className="mt-1.5 text-xs text-stone-500">Terakhir diperbarui: {updated}</p>

        <div className="mt-8 space-y-4">
          {sections.map((section, idx) => (
            <section
              key={section.title}
              className="bg-white rounded-2xl border border-[#EBDFCE] shadow-sm p-6"
            >
              <h2 className="text-base md:text-lg font-bold text-[#712E1E] leading-snug">
                {idx + 1}. {section.title}
              </h2>
              {section.body.map((paragraph, pIdx) => (
                <p
                  key={pIdx}
                  className="mt-2 text-sm text-stone-600 leading-relaxed whitespace-pre-line"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-8 bg-[#FAF6EE] border border-[#EBDFCE] rounded-2xl p-6 text-center">
          <p className="text-sm text-stone-600">
            Ada pertanyaan seputar dokumen ini?{' '}
            <Link
              to="/contact"
              className="font-bold text-[#E59A59] hover:text-[#B4693F] underline underline-offset-4"
            >
              Hubungi kami lewat halaman Kontak
            </Link>
            .
          </p>
        </div>

      </div>
    </div>
  );
}
