import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";

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

export default function LegalPageLayout({ title, metaDescription, updated, sections }: LegalPageLayoutProps) {
  usePageMeta(`${title} — LoVerse`, metaDescription);

  return (
    <div className="min-h-screen bg-cream-100 text-ink-900">
      <div className="mx-auto w-full max-w-[1180px] px-4 pb-20 pt-10 sm:px-7 sm:pt-16 lg:px-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-data text-[14px] uppercase tracking-[0.06em] text-ink-500 transition-colors hover:text-ink-950"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke beranda
        </Link>

        <header className="mt-10 border-b border-ink-900/15 pb-10 sm:pb-14">
          <div className="flex items-center gap-3">
            <span className="eyebrow text-ember-600">Dokumen / Legal</span>
            <span className="h-px w-10 bg-ink-900/20" />
          </div>
          <h1 className="display-xl mt-6 max-w-[15ch] text-[clamp(3.2rem,8vw,7rem)] text-ink-950">{title}</h1>
          <p className="mt-5 font-data text-[14px] uppercase tracking-[0.06em] text-ink-400">
            Terakhir diperbarui: {updated}
          </p>
        </header>

        <div className="grid gap-12 py-10 lg:grid-cols-12 lg:gap-16 lg:py-14">
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <p className="eyebrow text-ink-400">Isi dokumen</p>
              <nav className="mt-5 border-t border-ink-900/15" aria-label="Daftar isi">
                {sections.map((section, index) => (
                  <a
                    key={section.title}
                    href={`#bagian-${index + 1}`}
                    className="group flex items-baseline gap-3 border-b border-ink-900/12 py-3 text-[14px] text-ink-500 transition-colors hover:text-ink-950"
                  >
                    <span className="font-data text-[14px] text-ink-400">{String(index + 1).padStart(2, "0")}</span>
                    <span className="transition-transform group-hover:translate-x-0.5">{section.title}</span>
                  </a>
                ))}
              </nav>
              <Link
                to="/contact"
                className="mt-8 inline-flex items-center gap-2 border-b border-ink-900/25 pb-1.5 text-[14px] font-semibold text-ink-800 transition-colors hover:border-ember-600 hover:text-ember-600"
              >
                Ada pertanyaan? Hubungi kami
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </aside>

          <article className="lg:col-span-8">
            {sections.map((section, index) => (
              <section
                key={section.title}
                id={`bagian-${index + 1}`}
                className="scroll-mt-28 border-t border-ink-900/15 py-8 first:border-t-0 first:pt-0 sm:py-10"
              >
                <div className="flex items-baseline gap-4">
                  <span className="font-data text-[14px] text-ink-400">{String(index + 1).padStart(2, "0")}</span>
                  <h2 className="font-display text-[clamp(1.5rem,2.6vw,2rem)] leading-tight tracking-[-0.03em] text-ink-950">
                    {section.title}
                  </h2>
                </div>
                <div className="mt-4 space-y-3 pl-0 sm:pl-8">
                  {section.body.map((paragraph, pIndex) => (
                    <p key={pIndex} className="whitespace-pre-line text-[14px] leading-[1.75] text-ink-600">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </article>
        </div>
      </div>
    </div>
  );
}
