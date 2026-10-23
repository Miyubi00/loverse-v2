import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "../i18n";
import { usePageMeta } from "../hooks/usePageMeta";
import { buttonClass } from "../components/ui/buttonStyles";
import { MASTER_TEMPLATES } from "../lib/constants";

const FEATURED_THEMES = [
  MASTER_TEMPLATES.find((theme) => theme.slug === "rustic-floral")!,
  MASTER_TEMPLATES.find((theme) => theme.slug === "art-gallery")!,
  MASTER_TEMPLATES.find((theme) => theme.slug === "motion-flow")!,
];

const STEPS = [
  { title: "about.step1Title", body: "about.step1Body" },
  { title: "about.step2Title", body: "about.step2Body" },
  { title: "about.step3Title", body: "about.step3Body" },
] as const;

const CAPABILITIES = [
  { title: "about.feature1Title", body: "about.feature1Body" },
  { title: "about.feature2Title", body: "about.feature2Body" },
  { title: "about.feature3Title", body: "about.feature3Body" },
] as const;

export default function AboutPage() {
  const { t } = useTranslation();
  usePageMeta(t("about.metaTitle"), t("about.metaDescription"));

  const artGallery = FEATURED_THEMES[1];
  const rusticFloral = FEATURED_THEMES[0];

  return (
    <div className="min-h-screen bg-cream-100 text-ink-900">
      <section className="grain grain-light relative overflow-hidden bg-ink-950 text-cream-50">
        <div className="relative z-[2] mx-auto grid w-full max-w-[1480px] items-center gap-5 px-4 py-10 sm:px-7 sm:py-14 lg:min-h-[690px] lg:grid-cols-[1fr_.95fr] lg:gap-8 lg:px-10 lg:py-12">
          <div className="relative z-10 max-w-[660px]">
            <h1 className="text-pretty font-display text-[clamp(3.4rem,7.7vw,7.2rem)] leading-[0.91] tracking-[-0.035em]">
              <span className="block">{t("about.heroTitleLead")}</span>
              <span className="mt-1 block italic text-champagne">{t("about.heroTitleEmphasis")}</span>
            </h1>
            <p className="mt-7 max-w-[44ch] text-pretty text-[15px] leading-relaxed text-cream-100/72 sm:text-base">
              {t("about.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#tema" className={buttonClass("peach", "md")}>
                {t("about.heroCtaThemes")} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#cara-kerja"
                className="inline-flex min-h-11 items-center gap-2 px-2 text-[14px] font-medium text-cream-100/82 transition-colors hover:text-cream-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-peach-300"
              >
                {t("about.heroCtaSteps")} <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="relative mx-auto h-[390px] w-full max-w-[560px] sm:h-[500px] lg:h-full lg:min-h-[600px]">
            <figure className="absolute left-[8%] top-[15%] z-[1] w-[48%] rotate-[-6deg]">
              <div className="bg-cream-50 p-2.5 shadow-deep sm:p-3">
                <img
                  src={rusticFloral.image}
                  alt={"Pratinjau tema " + rusticFloral.name}
                  width={640}
                  height={800}
                  loading="eager"
                  className="aspect-[4/5] w-full object-cover"
                />
                <figcaption className="flex items-center justify-between gap-2 pt-3 text-ink-900">
                  <span translate="no" className="truncate font-display text-[13px] sm:text-[15px]">{rusticFloral.name}</span>
                  <span className="shrink-0 font-data text-[10px] uppercase tracking-[0.05em] text-ink-500 sm:text-[11px]">LoVerse</span>
                </figcaption>
              </div>
            </figure>
            <figure className="absolute right-[5%] top-[6%] z-[2] w-[52%] rotate-[5deg]">
              <div className="bg-cream-50 p-2.5 shadow-deep sm:p-3">
                <img
                  src={artGallery.image}
                  alt={"Pratinjau tema " + artGallery.name}
                  width={640}
                  height={800}
                  loading="eager"
                  className="aspect-[4/5] w-full object-cover"
                />
                <figcaption className="flex items-center justify-between gap-2 pt-3 text-ink-900">
                  <span translate="no" className="truncate font-display text-[13px] sm:text-[15px]">{artGallery.name}</span>
                  <span className="shrink-0 font-data text-[10px] uppercase tracking-[0.05em] text-ink-500 sm:text-[11px]">LoVerse</span>
                </figcaption>
              </div>
            </figure>
            <div aria-hidden="true" className="absolute bottom-[5%] left-[12%] h-20 w-20 rounded-full border border-champagne/45 sm:h-28 sm:w-28" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1280px] gap-8 px-4 py-14 sm:px-7 sm:py-20 lg:grid-cols-[.85fr_1.15fr] lg:gap-20 lg:px-10 lg:py-24">
        <h2 className="text-pretty font-display text-[clamp(2.25rem,4.2vw,4.3rem)] leading-[1.02] tracking-[-0.035em] text-ink-950">
          {t("about.manifestTitle")}
        </h2>
        <div className="max-w-[66ch]">
          <p className="text-[15px] leading-relaxed text-ink-600 sm:text-base">{t("about.manifestBody")}</p>
          <dl className="mt-8 divide-y divide-ink-900/15 border-y border-ink-900/15">
            {CAPABILITIES.map(({ title, body }) => (
              <div key={title} className="grid gap-1 py-4 sm:grid-cols-[minmax(150px,.65fr)_1fr] sm:gap-6">
                <dt className="font-display text-lg tracking-[-0.02em] text-ink-950">{t(title)}</dt>
                <dd className="text-[14px] leading-relaxed text-ink-600">{t(body)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="tema" className="scroll-mt-20 bg-cream-200/70 py-14 sm:py-20 lg:py-24">
        <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-7 lg:px-10">
          <div className="flex flex-col gap-4 border-b border-ink-900/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="max-w-[16ch] text-pretty font-display text-[clamp(2.5rem,5vw,5rem)] leading-[0.96] tracking-[-0.035em] text-ink-950">
              {t("about.galleryTitle")}
            </h2>
            <p className="max-w-[38ch] pb-1 text-[14px] leading-relaxed text-ink-600">{t("about.galleryBody")}</p>
          </div>

          <div className="grid items-start gap-x-5 gap-y-8 pt-8 sm:grid-cols-2 sm:gap-x-7 lg:grid-cols-12 lg:gap-x-8">
            {FEATURED_THEMES.map((theme, index) => (
              <article
                key={theme.slug}
                className={index === 0 ? "lg:col-span-5" : index === 1 ? "sm:pt-10 lg:col-span-4 lg:pt-14" : "lg:col-span-3 lg:pt-28"}
              >
                <Link
                  to={"/demo/" + theme.slug}
                  className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember-600"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-cream-100">
                    <img
                      src={theme.image}
                      alt={"Pratinjau tema " + theme.name}
                      width={720}
                      height={900}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />
                  </div>
                  <span className="mt-3 flex min-h-11 items-center justify-between gap-3 border-b border-ink-900/20 py-2 text-ink-950">
                    <span translate="no" className="font-display text-lg tracking-[-0.02em]">{theme.name}</span>
                    <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-600">
                      {t("about.themeAction")} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="scroll-mt-20 mx-auto w-full max-w-[1280px] px-4 py-14 sm:px-7 sm:py-20 lg:px-10 lg:py-24">
        <div className="grid gap-5 border-b border-ink-900/15 pb-8 lg:grid-cols-[.85fr_1.15fr] lg:items-end lg:gap-16">
          <h2 className="max-w-[15ch] text-pretty font-display text-[clamp(2.4rem,4.7vw,4.5rem)] leading-[0.97] tracking-[-0.035em] text-ink-950">
            {t("about.processTitle")}
          </h2>
          <p className="max-w-[52ch] text-[15px] leading-relaxed text-ink-600 sm:text-base">{t("about.processBody")}</p>
        </div>

        <ol className="grid gap-0 md:grid-cols-3">
          {STEPS.map(({ title, body }, index) => (
            <li
              key={title}
              className={"border-b border-ink-900/15 py-6 md:border-b-0 md:py-8 " + (index > 0 ? "md:border-l md:pl-6 lg:pl-8 " : "md:pr-6 lg:pr-8 ") + (index === 1 ? "md:px-6 lg:px-8" : "")}
            >
              <span className="font-data text-[13px] tabular-nums text-ember-700">0{index + 1}</span>
              <h3 className="mt-4 font-display text-2xl tracking-[-0.025em] text-ink-950">{t(title)}</h3>
              <p className="mt-3 max-w-[34ch] text-[14px] leading-relaxed text-ink-600">{t(body)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto w-full max-w-[1280px] px-4 pb-14 sm:px-7 sm:pb-20 lg:px-10 lg:pb-24">
        <div className="grain grain-light relative overflow-hidden bg-ink-950 px-6 py-10 text-cream-50 sm:px-10 sm:py-14 lg:px-14">
          <div className="relative z-[2] grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-12">
            <div className="max-w-2xl">
              <h2 className="text-pretty font-display text-[clamp(2.3rem,4.8vw,4.6rem)] leading-[0.97] tracking-[-0.035em]">
                {t("about.ctaTitle")}
              </h2>
              <p className="mt-4 max-w-[52ch] text-[14px] leading-relaxed text-cream-100/72 sm:text-[15px]">{t("about.ctaBody")}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/order" className={buttonClass("peach", "md")}>
                {t("about.ctaButton")} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link to="/contact" className={buttonClass("outlineLight", "md")}>
                {t("about.contactLink")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
