import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useTranslation } from "../i18n";
import { buttonClass } from "../components/ui/buttonStyles";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="relative flex min-h-[calc(100svh-68px)] items-center overflow-hidden bg-ink-950 text-cream-100">
      <div className="grain grain-light absolute inset-0" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cream-100/10" />
        <div className="absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-peach-300/15" />
        <div className="absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full glow-peach blur-2xl" />
      </div>

      <div className="relative z-[2] mx-auto w-full max-w-[1180px] px-4 py-16 sm:px-7 lg:px-10">
        <p className="eyebrow text-peach-300/70">{t("notFound.title")} / {t("notFound.code")}</p>
        <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="display-xl text-[clamp(6rem,22vw,17rem)] leading-[0.72] text-cream-50/95">404</p>
            <h1 className="mt-5 max-w-[14ch] font-display text-[clamp(1.8rem,4vw,3.2rem)] leading-[1.02] tracking-[-0.04em] text-peach-300">
              {t("notFound.title")}
            </h1>
          </div>
          <div className="max-w-sm lg:pb-3">
            <p className="text-[14px] leading-relaxed text-cream-100/58">{t("notFound.desc")}</p>
            <div className="mt-6 flex flex-col gap-2.5 xs:flex-row">
              <Link to="/" className={buttonClass("peach", "md")}>
                {t("notFound.btnHome")} <ArrowUpRight className="h-4 w-4" />
              </Link>
              <button type="button" onClick={() => window.history.back()} className={buttonClass("outlineLight", "md")}>
                <ArrowLeft className="h-4 w-4" /> {t("common.back")}
              </button>
            </div>
            <p className="mt-8 font-data text-[14px] uppercase tracking-[0.06em] text-cream-100/75">
              {t("notFound.footer", { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
