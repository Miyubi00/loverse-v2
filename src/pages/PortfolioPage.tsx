import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, MapPin, Star, Users } from "lucide-react";
import { MASTER_TEMPLATES } from "../lib/constants";
import { PORTFOLIO_ITEMS } from "../lib/portfolioData";
import { useTranslation } from "../i18n";
import { usePageMeta } from "../hooks/usePageMeta";
import PageHeader from "../components/ui/PageHeader";
import { buttonClass } from "../components/ui/buttonStyles";
import { cn } from "../lib/cn";

const templateOf = (slug: string) => MASTER_TEMPLATES.find((t) => t.slug === slug);

export default function PortfolioPage() {
  const { t } = useTranslation();
  usePageMeta(t("portfolio.metaTitle"), t("portfolio.metaDescription"));
  const [category, setCategory] = useState("all");

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const item of PORTFOLIO_ITEMS) {
      const cat = templateOf(item.templateSlug)?.category;
      if (cat) set.add(cat);
    }
    return ["all", ...Array.from(set)];
  }, []);

  const items = useMemo(
    () =>
      PORTFOLIO_ITEMS.filter((item) => {
        if (category === "all") return true;
        return templateOf(item.templateSlug)?.category === category;
      }),
    [category],
  );

  return (
    <div className="min-h-screen bg-cream-100 text-ink-900">
      <div className="mx-auto w-full max-w-[1480px] px-4 sm:px-7 lg:px-10">
        <PageHeader
          eyebrow={t("portfolio.badge")}
          index="02"
          title={<>{t("portfolio.title")}</>}
          description={t("portfolio.subtitle")}
          aside={
            <div className="grid w-full grid-cols-3 border-y border-ink-900/15">
              {[
                ["40+", t("portfolio.statThemes")],
                ["68+", t("portfolio.statCouples")],
                ["4.9", t("portfolio.statRating")],
              ].map(([value, label], index) => (
                <div key={label} className={cn("py-4", index > 0 && "border-l border-ink-900/15 pl-4")}>
                  <p className="font-display text-3xl leading-none tracking-[-0.04em] text-ink-950">{value}</p>
                  <p className="mt-2 text-[14px] uppercase tracking-[0.06em] text-ink-400">{label}</p>
                </div>
              ))}
            </div>
          }
        />

        <div className="flex flex-col gap-4 border-b border-ink-900/15 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar" role="group" aria-label={t("portfolio.filterAria")}>
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
                className={cn(
                  "shrink-0 border px-3.5 py-2 font-data text-[14px] uppercase tracking-[0.06em] transition-colors",
                  category === item
                    ? "border-ink-950 bg-ink-950 text-cream-50"
                    : "border-transparent text-ink-500 hover:border-ink-900/20 hover:text-ink-900",
                )}
              >
                {item === "all" ? t("portfolio.filterAll") : item}
              </button>
            ))}
          </div>
          <p className="font-data text-[14px] uppercase tracking-[0.06em] text-ink-400">
            {t("portfolio.storyCount", { count: items.length })}
          </p>
        </div>

        <div className="columns-1 gap-5 py-12 sm:columns-2 lg:columns-3 lg:gap-6 lg:py-16">
          {items.map((item, index) => {
            const tpl = templateOf(item.templateSlug);
            const featured = index % 7 === 0;
            return (
              <article key={item.id} className="group mb-10 break-inside-avoid">
                <Link
                  to={`/demo/${item.templateSlug}`}
                  className={cn("relative block overflow-hidden bg-ink-900", featured ? "aspect-[4/5]" : "aspect-[3/4]")}
                >
                  {tpl ? (
                    <img
                      src={tpl.image}
                      alt={`${item.groom} & ${item.bride}`}
                      loading="lazy"
                      className="h-full w-full object-cover object-top transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-cream-100/20">LoVerse</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/5 to-ink-950/65" />
                  <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
                    <span className="border border-cream-100/25 bg-ink-950/15 px-2 py-1 font-data text-[14px] uppercase tracking-[0.06em] text-cream-50/85 backdrop-blur-sm">
                      {tpl?.category ?? "Basic"}
                    </span>
                    <span className="font-data text-[14px] text-cream-50">0{index + 1}</span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-6">
                    <div>
                      <p className="font-display text-[clamp(1.5rem,3vw,2.5rem)] leading-none tracking-[-0.04em] text-cream-50">
                        {item.groom} &amp; {item.bride}
                      </p>
                      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-cream-100/55">
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{item.city} · {item.date}</span>
                        <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{item.guests}</span>
                        <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-champagne text-champagne" />{item.rating.toFixed(1)}</span>
                      </p>
                    </div>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cream-100/30 text-cream-50 transition-colors group-hover:bg-cream-50 group-hover:text-ink-950">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
                <div className="flex items-center justify-between gap-3 border-b border-ink-900/15 py-3">
                  <p className="font-data text-[14px] uppercase tracking-[0.06em] text-ink-400">
                    {t("portfolio.themeLabel")}: {tpl?.name ?? item.templateSlug}
                  </p>
                  <span className="font-data text-[14px] uppercase tracking-[0.06em] text-ember-600">{t("portfolio.viewDemo")}</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <section className="grain relative overflow-hidden bg-wine-900 text-cream-100">
        <div className="relative z-[2] mx-auto flex w-full max-w-[1480px] flex-col items-start justify-between gap-8 px-4 py-16 sm:px-7 sm:py-20 lg:flex-row lg:items-end lg:px-10">
          <div>
            <span className="eyebrow text-champagne/80">{t("portfolio.ctaBadge")}</span>
            <h2 className="display-lg mt-4 max-w-[14ch] text-[clamp(2.6rem,5.2vw,4.8rem)] text-cream-50">{t("portfolio.ctaTitle")}</h2>
            <p className="mt-4 max-w-md text-[14px] leading-relaxed text-muted-dark">{t("portfolio.ctaDesc")}</p>
          </div>
          <div className="flex flex-col gap-2.5 xs:flex-row">
            <Link to="/order" className={buttonClass("peach", "lg", "h-13")}>
              {t("portfolio.ctaOrder")} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/contact" className={buttonClass("outlineLight", "lg", "h-13")}>{t("portfolio.ctaContact")}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
