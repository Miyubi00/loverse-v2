import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";

interface AuthShellProps {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
  footnote?: ReactNode;
}

export default function AuthShell({ eyebrow, title, description, children, footnote }: AuthShellProps) {
  return (
    <div className="min-h-[calc(100svh-68px)] bg-cream-100">
      <div className="mx-auto grid w-full max-w-[1480px] lg:grid-cols-2">
        <aside className="grain grain-light relative hidden overflow-hidden bg-ink-950 p-10 text-cream-100 lg:flex lg:flex-col lg:justify-between lg:min-h-[calc(100svh-68px)] lg:p-14">
          <div className="relative z-[2]">
            <p className="eyebrow text-peach-300/75">Ruang mempelai</p>
            <p className="mt-6 max-w-[11ch] font-display text-[clamp(2.8rem,4.6vw,4.4rem)] leading-[0.95] tracking-[-0.045em] text-cream-50">
              Hari bahagiamu, <span className="italic text-peach-300">satu tautan.</span>
            </p>
            <p className="mt-6 max-w-sm text-[14px] leading-relaxed text-cream-100/50">
              Masuk untuk mengatur cerita, foto, musik, dan tamu — semuanya di satu tempat yang tenang.
            </p>
          </div>

          <div className="relative z-[2] mt-16 border-t border-cream-100/15 pt-6">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="font-display text-xl tracking-[-0.03em] text-cream-50">Dimas &amp; Sarah</p>
                <p className="mt-1 font-data text-[14px] uppercase tracking-[0.06em] text-cream-100/35">24 . 10 . 2026 · Jakarta</p>
              </div>
              <Heart className="h-5 w-5 text-peach-300" />
            </div>
          </div>

          <div className="pointer-events-none absolute -right-20 top-1/3 h-[420px] w-[420px] rounded-full border border-cream-100/10" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-4 top-1/3 h-[260px] w-[260px] rounded-full border border-peach-300/15" aria-hidden="true" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-1/2 w-full glow-ember" aria-hidden="true" />
        </aside>

        <div className="flex min-h-[calc(100svh-68px)] items-center px-4 py-12 sm:px-8 lg:px-14 lg:py-16">
          <div className="mx-auto w-full max-w-[440px]">
            <Link to="/" className="inline-flex items-center gap-2 font-data text-[14px] uppercase tracking-[0.06em] text-ink-400 transition-colors hover:text-ink-900">
              <ArrowLeft className="h-3 w-3" /> Kembali
            </Link>
            <p className="eyebrow mt-10 text-ember-600">{eyebrow}</p>
            <h1 className="mt-4 font-display text-[clamp(2.2rem,4.4vw,3.3rem)] leading-[0.98] tracking-[-0.045em] text-ink-950">
              {title}
            </h1>
            <div className="mt-3 text-[14px] leading-relaxed text-ink-500">{description}</div>
            <div className="mt-8">{children}</div>
            {footnote && <div className="mt-6 border-t border-ink-900/12 pt-5 text-[14px] leading-relaxed text-ink-400">{footnote}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
