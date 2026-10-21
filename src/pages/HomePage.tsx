import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Edit3,
  LayoutTemplate,
  MessageSquare,
  Plus,
  Quote,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { ADMIN_WHATSAPP, MASTER_TEMPLATES, TESTIMONIALS } from "../lib/constants";
import { TemplateCardSkeleton } from "../components/ui/SkeletonLoaders";
import SiteNoticeView from "../components/shared/SiteNoticeView";
import TemplateCatalogCard from "../components/shared/TemplateCatalogCard";
import { useSiteNotices } from "../hooks/useSiteNotices";
import { useSectionHash } from "../hooks/useSectionHash";
import type { TemplateRow } from "../types/database";
import { useTranslation } from "../i18n";
import { usePageMeta } from "../hooks/usePageMeta";
import HeroVisual from "../components/three/HeroVisual";
import { buttonClass } from "../components/ui/buttonStyles";
import Reveal from "../components/ui/Reveal";
import { cn } from "../lib/cn";

type CategoryFilter = "All" | "Basic" | "RSVP";

const BASE_DUMMY_SOLD = 60;
const FALLBACK_MIN_PRICE = 50000;
const SECTION_IDS = ["beranda", "fitur", "statistik", "katalog", "alur", "testimoni", "faq", "mulai"] as const;

const formatIDR = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

const formatPriceK = (value: number) => `Rp ${new Intl.NumberFormat("id-ID").format(value / 1000)}K`;

function StatNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      frame = requestAnimationFrame(() => setDisplay(value));
      return () => cancelAnimationFrame(frame);
    }
    const duration = 1300;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span className="font-display text-[clamp(3.8rem,9vw,7.6rem)] font-light leading-[0.8] tracking-[-0.055em]">
      {display}
      {suffix}
    </span>
  );
}

export default function Landing() {
  const { t } = useTranslation();
  const siteNotices = useSiteNotices();
  useSectionHash(SECTION_IDS);
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  const [templates, setTemplates] = useState<Array<TemplateRow & { image: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [soldCount, setSoldCount] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const displayMinPrice = minPrice ?? FALLBACK_MIN_PRICE;
  const minPriceLabel = formatIDR(displayMinPrice);

  usePageMeta(
    "LoVerse — Undangan Pernikahan Digital Elegan & Modern",
    `LoVerse — undangan pernikahan digital elegan & modern. Pilih 40+ tema, RSVP online, musik, galeri foto, dan buku tamu. Buat dalam hitungan menit mulai ${minPriceLabel}.`,
  );

  useEffect(() => {
    if (loading) return;
    const slug = (location.state as { scrollToTemplate?: string } | null)?.scrollToTemplate;
    if (!slug) return;
    let cancelled = false;
    let attempt = 0;
    const scroll = () => {
      if (cancelled) return;
      const el = document.querySelector(`#katalog [data-template-slug="${slug}"]`);
      if (el) {
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, left: 0, behavior: "auto" });
        return;
      }
      if ((attempt += 1) < 8) window.setTimeout(scroll, 400);
    };
    scroll();
    return () => {
      cancelled = true;
    };
  }, [location.state, loading]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data: dbTemplates, error } = await supabase
          .from("templates")
          .select("*")
          .order("name", { ascending: true });
        if (error) throw error;
        if (dbTemplates) {
          const combinedData = dbTemplates.map((dbItem) => {
            const localTemplate = MASTER_TEMPLATES.find((item) => item.slug === dbItem.slug);
            return { ...dbItem, image: localTemplate ? localTemplate.image : "/themes/placeholder.svg" };
          });
          setTemplates(combinedData);
          const active = combinedData.filter((item) => item.is_active && typeof item.price === "number");
          if (active.length > 0) setMinPrice(Math.min(...active.map((item) => item.price as number)));
        }
      } catch (error) {
        console.error("Gagal mengambil data template:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchSoldCount = async () => {
      const { count, error } = await supabase
        .from("public_invitations")
        .select("*", { count: "exact", head: true });
      if (!error && count !== null) setSoldCount(BASE_DUMMY_SOLD + count);
      else setSoldCount(BASE_DUMMY_SOLD + 7);
    };

    fetchTemplates();
    fetchSoldCount();
  }, []);

  const filteredTemplates = useMemo(
    () =>
      templates
        .filter((template) => template.is_active)
        .filter((template) => categoryFilter === "All" || template.category === categoryFilter)
        .filter((template) => template.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [templates, searchTerm, categoryFilter],
  );

  const features = [
    { icon: Sparkles, title: t("home.features.f1Title"), desc: t("home.features.f1Desc") },
    { icon: MessageSquare, title: t("home.features.f2Title"), desc: t("home.features.f2Desc") },
    { icon: Edit3, title: t("home.features.f3Title"), desc: t("home.features.f3Desc") },
    {
      icon: ShieldCheck,
      title: t("home.features.f4Title"),
      desc: t("home.features.f4Desc", { price: minPriceLabel }),
    },
  ];

  const steps = [
    {
      num: t("home.step1Num"),
      title: t("home.step1Title"),
      desc: t("home.step1Desc"),
      icon: LayoutTemplate,
    },
    { num: t("home.step2Num"), title: t("home.step2Title"), desc: t("home.step2Desc"), icon: Edit3 },
    { num: t("home.step3Num"), title: t("home.step3Title"), desc: t("home.step3Desc"), icon: Share2 },
  ];

  const faqs = [
    { q: t("home.faq1Q"), a: t("home.faq1A") },
    { q: t("home.faq2Q"), a: t("home.faq2A") },
    { q: t("home.faq3Q"), a: t("home.faq3A") },
    { q: t("home.faq4Q"), a: t("home.faq4A") },
  ];

  const displaySold = soldCount ?? BASE_DUMMY_SOLD + 7;
  const activeCount = templates.filter((template) => template.is_active).length || 40;
  const tickerItems = [
    t("home.heroTrustRsvp"),
    t("home.tickerMusic"),
    t("home.tickerPhoto"),
    t("home.tickerMap"),
    t("home.tickerGift"),
    t("home.heroTrustInstant"),
  ];

  return (
    <div className="min-h-screen bg-cream-100 font-sans text-ink-900">
      <SiteNoticeView notices={siteNotices} />

      {/* HERO */}
      <section
        id="beranda"
        className="relative scroll-mt-20 overflow-hidden border-b border-cream-100/10 bg-ink-950 text-cream-100"
      >
        <div className="grain grain-light absolute inset-0" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.16]" aria-hidden="true">
          <div className="absolute left-[8%] top-0 h-full w-px bg-cream-100/20" />
          <div className="absolute left-[38%] top-0 h-full w-px bg-cream-100/10" />
          <div className="absolute right-[8%] top-0 h-full w-px bg-cream-100/15" />
          <div className="absolute inset-x-0 top-[24%] h-px bg-cream-100/10" />
        </div>

        <div className="relative z-[2] mx-auto grid w-full max-w-[1480px] lg:grid-cols-[1.04fr_.96fr]">
          <div className="flex flex-col justify-between px-4 pb-10 pt-12 sm:px-7 sm:pt-16 lg:min-h-[calc(100svh-68px)] lg:px-10 lg:pb-12 lg:pt-20">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-peach-300/60" />
                <p className="eyebrow text-peach-300/80">{t("home.heroEyebrow")}</p>
              </div>

              <h1 className="display-xl mt-8 max-w-[10.5ch] text-[clamp(3.9rem,9.4vw,8.8rem)] text-cream-50">
                <span className="block">{t("home.heroLine1")}</span>
                <span className="block">
                  <span className="italic text-peach-300">{t("home.heroLine2").split(" ")[0]}</span>{" "}
                  {t("home.heroLine2").split(" ").slice(1).join(" ")}
                </span>
              </h1>

              <p className="mt-6 max-w-md font-display text-[clamp(1.25rem,2.1vw,1.8rem)] italic leading-[1.2] text-cream-100/62 sm:mt-8">
                {t("home.heroLine3")}
              </p>

              <p className="mt-7 max-w-[46ch] text-pretty text-[14px] leading-relaxed text-cream-100/62 sm:text-[15px]">
                {t("home.heroLede")}
              </p>

              <div className="mt-8 flex flex-col gap-2.5 xs:flex-row sm:mt-10">
                <Link to="/order" className={buttonClass("peach", "lg", "group h-13")}>
                  {t("home.heroCtaOrder")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link to="/#katalog" className={buttonClass("outlineLight", "lg", "h-13")}>
                  {t("home.heroCtaCatalog")}
                </Link>
              </div>

              <p className="mt-5 font-data text-[9px] uppercase leading-relaxed tracking-[0.12em] text-cream-100/60">
                {t("home.heroNote")}
              </p>
            </div>

            <div className="mt-12 flex flex-wrap items-end justify-between gap-6 border-t border-cream-100/12 pt-6">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {["R", "D", "A", "S"].map((initial, index) => (
                    <span
                      key={initial}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-950 bg-cream-200 font-display text-[11px] font-semibold text-ink-800"
                      style={{ backgroundColor: ["var(--color-cream-200)", "var(--color-peach-300)", "var(--color-cream-300)", "var(--color-cream-100)"][index] }}
                    >
                      {initial}
                    </span>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-peach-300">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                  <p className="mt-1 text-[10px] text-cream-100/48">
                    {t("home.heroRating", { count: displaySold })}</p>
                </div>
              </div>
              <p className="hidden font-data text-[9px] uppercase tracking-[0.18em] text-cream-100/55 sm:block">
                {t("home.heroScroll")}
              </p>
            </div>
          </div>

          <div className="relative min-h-[430px] border-t border-cream-100/10 sm:min-h-[560px] lg:min-h-0 lg:border-l lg:border-t-0">
            <div className="absolute left-5 top-6 z-10 flex items-center gap-2 font-data text-[8px] uppercase tracking-[0.2em] text-cream-100/60">
              <span className="h-1 w-1 rounded-full bg-peach-300" />
              Live / 2026
            </div>
            <div className="absolute right-5 top-1/2 z-10 hidden -translate-y-1/2 rotate-90 font-data text-[8px] uppercase tracking-[0.28em] text-cream-100/55 sm:block">
              {t("home.heroStageLabel")}
            </div>
            <HeroVisual />
            <div className="absolute inset-x-5 bottom-6 z-10 flex items-end justify-between gap-4">
              <span className="eyebrow text-cream-100/55">01 — {t("home.heroStageLabel")}</span>
              <span className="font-data text-[8px] text-cream-100/55">06°12′S / 106°49′E</span>
            </div>
          </div>
        </div>

        <div className="marquee relative z-[2] overflow-hidden border-t border-cream-100/12 bg-ink-900/60 py-4">
          <div className="marquee-track flex w-max items-center" aria-hidden="true">
            {[...tickerItems, ...tickerItems].map((item, index) => (
              <span key={`${item}-${index}`} className="flex items-center gap-6 px-6">
                <span className="whitespace-nowrap font-data text-[9px] uppercase tracking-[0.22em] text-cream-100/60">
                  {item}
                </span>
                <Plus className="h-3 w-3 text-peach-300/50" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* MANIFESTO + FEATURES */}
      <section id="fitur" className="scroll-mt-20 border-b border-ink-900/12">
        <div className="mx-auto w-full max-w-[1480px] px-4 py-20 sm:px-7 sm:py-28 lg:px-10">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
              <span className="eyebrow text-ember-600">{t("home.manifestoEyebrow")}</span>
              <h2 className="display-lg mt-5 max-w-[11ch] text-[clamp(2.6rem,5.4vw,4.8rem)] text-ink-950">
                {t("home.manifestoTitle")}
              </h2>
              <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-ink-500">{t("home.manifestoBody")}</p>
              <Link
                to="/portfolio"
                className="mt-8 inline-flex items-center gap-2 border-b border-ink-900/25 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-800 transition-colors hover:border-ember-600 hover:text-ember-600"
              >
                {t("home.heroPortfolioBtn")}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="lg:col-span-7">
              <div className="border-t border-ink-900/15">
                {features.map((feature, index) => (
                  <Reveal key={feature.title} delay={index * 60} as="article">
                    <div className="group grid grid-cols-[auto_1fr_auto] items-start gap-4 border-b border-ink-900/15 py-7 transition-colors duration-300 hover:bg-cream-50 sm:gap-7 sm:py-9">
                      <span className="pt-1 font-data text-[9px] tracking-[0.15em] text-ink-400">
                        0{index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <feature.icon className="h-4 w-4 text-ember-600" strokeWidth={1.5} />
                          <h3 className="font-display text-[clamp(1.5rem,2.6vw,2rem)] leading-tight tracking-[-0.025em] text-ink-900">
                            {feature.title}
                          </h3>
                        </div>
                        <p className="mt-3 max-w-[52ch] text-[13px] leading-relaxed text-ink-500 sm:pl-7">
                          {feature.desc}
                        </p>
                      </div>
                      <ArrowUpRight className="mt-1 hidden h-5 w-5 text-ink-300 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ember-600 sm:block" />
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="statistik" className="scroll-mt-20 border-b border-ink-900/12 bg-peach-300">
        <div className="mx-auto w-full max-w-[1480px] px-4 py-14 sm:px-7 sm:py-20 lg:px-10">
          <div className="flex items-center justify-between gap-4 border-b border-ink-900/18 pb-6">
            <span className="eyebrow text-ink-800">{t("home.statsEyebrow")}</span>
            <span className="font-data text-[9px] uppercase tracking-[0.18em] text-ink-800/75">LoVerse / ID</span>
          </div>
          <div className="grid grid-cols-2 divide-ink-900/15 pt-8 sm:grid-cols-3 sm:divide-x">
            <div className="pb-8 sm:pb-0">
              <StatNumber value={displaySold} suffix="+" />
              <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-700">
                {t("home.stats.sold")}
              </p>
            </div>
            <div className="border-l border-ink-900/15 pb-8 pl-5 sm:border-l-0 sm:pb-0 sm:pl-8">
              <StatNumber value={activeCount} />
              <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-700">
                {t("home.stats.templates")}
              </p>
            </div>
            <div className="col-span-2 mt-4 border-t border-ink-900/15 pt-6 sm:col-span-1 sm:mt-0 sm:border-t-0 sm:pl-8 sm:pt-0">
              <div className="flex items-end gap-1.5">
                <span className="font-display text-[clamp(3.8rem,9vw,7.6rem)] font-light leading-[0.8] tracking-[-0.055em]">
                  4.9
                </span>
                <Star className="mb-2 h-5 w-5 fill-ink-900 text-ink-900" />
              </div>
              <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-700">
                {t("home.stats.rating")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CATALOG */}
      <section id="katalog" className="scroll-mt-20 border-b border-ink-900/12">
        <div className="mx-auto w-full max-w-[1480px] px-4 py-20 sm:px-7 sm:py-28 lg:px-10">
          <div className="flex flex-col gap-6 border-b border-ink-900/15 pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="eyebrow text-ember-600">{t("home.catalogEyebrow")}</span>
              <h2 className="display-lg mt-4 text-[clamp(2.8rem,6.4vw,5.8rem)] text-ink-950">
                {t("home.catalogTitle")}
              </h2>
            </div>
            <div className="max-w-sm lg:text-right">
              <p className="text-[14px] leading-relaxed text-ink-500">{t("home.catalogDesc")}</p>
              <p className="mt-2 font-data text-[9px] uppercase tracking-[0.15em] text-ink-400">
                {t("home.catalogNote")}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-b border-ink-900/12 py-5 lg:flex-row lg:items-center lg:justify-between">
            <label className="group flex min-h-11 flex-1 items-center gap-3 border-b border-ink-900/20 pb-1 transition-colors focus-within:border-ink-900 lg:max-w-sm">
              <Search className="h-4 w-4 text-ink-400" />
              <span className="sr-only">{t("home.catalogSearchPlaceholder")}</span>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t("home.catalogSearchPlaceholder")}
                className="w-full border-0 bg-transparent py-2 text-[13px] text-ink-900 outline-none placeholder:text-ink-400"
              />
            </label>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar" role="group" aria-label="Filter kategori">
              {(
                [
                  ["All", t("home.catalogCategoryAll")],
                  ["Basic", t("home.catalogCategoryBasic")],
                  ["RSVP", t("home.catalogCategoryRsvp")],
                ] as Array<[CategoryFilter, string]>
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategoryFilter(value)}
                  aria-pressed={categoryFilter === value}
                  className={cn(
                    "shrink-0 border px-3.5 py-2 font-data text-[9px] uppercase tracking-[0.12em] transition-colors",
                    categoryFilter === value
                      ? "border-ink-950 bg-ink-950 text-cream-50"
                      : "border-transparent text-ink-500 hover:border-ink-900/20 hover:text-ink-900",
                  )}
                >
                  {label}
                </button>
              ))}
              <span className="ml-2 shrink-0 font-data text-[9px] text-ink-400">
                {t("home.catalogCount", { count: filteredTemplates.length })}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
              <TemplateCardSkeleton count={8} />
            </div>
          ) : filteredTemplates.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
              {filteredTemplates.map((template) => (
                <TemplateCatalogCard
                  key={template.slug}
                  template={template}
                  priceLabel={formatPriceK(template.price ?? FALLBACK_MIN_PRICE)}
                />
              ))}
            </div>
          ) : (
            <div className="mt-8 border border-dashed border-ink-900/20 px-6 py-16 text-center">
              <p className="font-display text-2xl tracking-[-0.02em] text-ink-900">{t("home.catalogEmpty")}</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">{t("home.catalogEmptySub")}</p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("All");
                }}
                className="mt-5 font-data text-[10px] uppercase tracking-[0.14em] text-ember-600 underline-offset-4 hover:underline"
              >
                {t("common.resetFilter")}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* PROCESS */}
      <section id="alur" className="scroll-mt-20 bg-ink-950 text-cream-100">
        <div className="mx-auto grid w-full max-w-[1480px] gap-12 px-4 py-20 sm:px-7 sm:py-28 lg:grid-cols-12 lg:gap-16 lg:px-10">
          <div className="lg:col-span-5">
            <span className="eyebrow text-peach-300/80">{t("home.stepsEyebrow")}</span>
            <h2 className="display-lg mt-5 max-w-[11ch] text-[clamp(2.7rem,5.4vw,5rem)] text-cream-50">
              {t("home.stepsTitle")}
            </h2>
            <p className="mt-6 max-w-sm text-[14px] leading-relaxed text-cream-100/55">{t("home.stepsDesc")}</p>
            <div className="mt-10 inline-flex items-end gap-3 border border-cream-100/15 px-4 py-3">
              <span className="font-display text-4xl leading-none text-peach-300">3</span>
              <span className="max-w-[14ch] font-data text-[8px] uppercase leading-relaxed tracking-[0.12em] text-cream-100/60">
                langkah, tanpa drama
              </span>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="border-t border-cream-100/15">
              {steps.map((step, index) => (
                <Reveal key={step.num} delay={index * 80}>
                  <article className="group grid grid-cols-[auto_1fr] gap-5 border-b border-cream-100/15 py-7 sm:gap-8 sm:py-9">
                    <div className="flex flex-col items-start gap-4">
                      <span className="font-display text-[clamp(2.6rem,5vw,4rem)] font-light leading-none text-peach-300/90">
                        {step.num}
                      </span>
                      <step.icon className="h-4 w-4 text-cream-100/30 transition-colors group-hover:text-peach-300" />
                    </div>
                    <div className="pt-1">
                      <h3 className="font-display text-[clamp(1.5rem,2.6vw,2rem)] leading-tight tracking-[-0.025em] text-cream-50">
                        {step.title}
                      </h3>
                      <p className="mt-3 max-w-[46ch] text-[13px] leading-relaxed text-cream-100/50">{step.desc}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
            <Link
              to="/tutorial"
              className="mt-8 inline-flex items-center gap-2 font-data text-[9px] uppercase tracking-[0.16em] text-peach-300 transition-colors hover:text-cream-50"
            >
              {t("home.faqTutorialBtn")}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimoni" className="scroll-mt-20 border-b border-ink-900/12 bg-cream-50">
        <div className="mx-auto w-full max-w-[1480px] px-4 py-20 sm:px-7 sm:py-28 lg:px-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow text-ember-600">{t("home.testimonialsEyebrow")}</span>
              <h2 className="display-lg mt-4 max-w-[15ch] text-[clamp(2.6rem,5.4vw,4.8rem)] text-ink-950">
                {t("home.testimonialsTitle")}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <Star className="h-4 w-4 fill-ember-500 text-ember-500" />
              <span className="font-display text-2xl leading-none text-ink-900">4.9</span>
              <span className="max-w-[12ch] text-[10px] leading-tight text-ink-400">
                {t("home.heroRating", { count: displaySold })}
              </span>
            </div>
          </div>

          <div className="mt-12 columns-1 gap-6 sm:columns-2 lg:columns-3">
            {TESTIMONIALS.map((testimonial, index) => (
              <Reveal key={testimonial.name} delay={index * 45} className="mb-6 break-inside-avoid">
                <figure className="border-t border-ink-900/20 pt-6">
                  <Quote className="h-5 w-5 text-ember-500/60" />
                  <blockquote className="mt-4 font-display text-[clamp(1.25rem,2vw,1.65rem)] leading-[1.32] tracking-[-0.015em] text-ink-800">
                    “{testimonial.message}”
                  </blockquote>
                  <figcaption className="mt-6 flex items-center justify-between gap-4 border-t border-ink-900/10 pt-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-peach-300 font-display text-xs font-semibold text-ink-900">
                        {testimonial.name.charAt(0)}
                      </span>
                      <div>
                        <p className="text-[11px] font-semibold text-ink-900">{testimonial.name}</p>
                        <p className="font-data text-[8px] uppercase tracking-[0.12em] text-ink-400">
                          {t("home.testimonialsBought", { template: testimonial.template })}
                        </p>
                      </div>
                    </div>
                    <span className="font-data text-[8px] text-ink-300">0{index + 1}</span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 border-b border-ink-900/12">
        <div className="mx-auto grid w-full max-w-[1480px] gap-12 px-4 py-20 sm:px-7 sm:py-28 lg:grid-cols-12 lg:gap-16 lg:px-10">
          <div className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
            <span className="eyebrow text-ember-600">{t("home.faqEyebrow")}</span>
            <h2 className="display-lg mt-5 max-w-[10ch] text-[clamp(2.6rem,5vw,4.4rem)] text-ink-950">
              {t("home.faqTitle")}
            </h2>
            <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-ink-500">{t("home.faqDesc")}</p>
            <a
              href={`https://wa.me/${ADMIN_WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 border border-ink-900/20 px-4 py-3 text-[11px] font-semibold text-ink-800 transition-colors hover:border-ink-900 hover:bg-ink-950 hover:text-cream-50"
            >
              {t("contact.whatsappMainBtn", { name: "Admin" })}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="lg:col-span-8">
            <div className="border-t border-ink-900/15">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={faq.q} className="border-b border-ink-900/15">
                    <h3>
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : index)}
                        aria-expanded={isOpen}
                        aria-controls={`faq-panel-${index}`}
                        className="flex w-full items-start justify-between gap-6 py-5 text-left sm:py-6"
                      >
                        <span className="flex items-start gap-4">
                          <span className="pt-1.5 font-data text-[9px] text-ink-400">0{index + 1}</span>
                          <span className="font-display text-[clamp(1.2rem,2.2vw,1.55rem)] leading-snug tracking-[-0.02em] text-ink-900">
                            {faq.q}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-ink-900/20 transition-transform duration-300",
                            isOpen && "rotate-45 bg-ink-950 text-cream-50",
                          )}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    </h3>
                    <div
                      id={`faq-panel-${index}`}
                      hidden={!isOpen}
                      className="animate-fade-in pb-6 pl-8 pr-12 text-[13px] leading-relaxed text-ink-500 sm:pl-9"
                    >
                      {faq.a}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="mulai" className="scroll-mt-20 overflow-hidden bg-wine-900 text-cream-100">
        <div className="grain relative mx-auto flex w-full max-w-[1480px] flex-col items-start justify-between gap-10 px-4 py-20 sm:px-7 sm:py-28 lg:flex-row lg:items-end lg:px-10">
          <div className="relative z-[2]">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-peach-300/60" />
              <span className="eyebrow text-peach-300/80">{t("home.ctaEyebrow")}</span>
            </div>
            <h2 className="display-xl mt-6 max-w-[13ch] text-[clamp(3rem,7vw,6.8rem)] text-cream-50">
              {t("home.ctaTitleNew")}
            </h2>
            <p className="mt-6 max-w-md text-[14px] leading-relaxed text-cream-100/58">
              {t("home.ctaBannerDesc")}
            </p>
            <div className="mt-8 flex flex-col gap-2.5 xs:flex-row">
              <Link to="/order" className={buttonClass("peach", "lg", "group h-13")}>
                {t("home.ctaBannerBtn")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link to="/contact" className={buttonClass("outlineLight", "lg", "h-13")}>
                {t("home.footerContact")}
              </Link>
            </div>
          </div>

          <div className="relative z-[2] hidden w-[260px] shrink-0 rotate-[-4deg] border border-cream-100/20 bg-cream-50 p-5 text-ink-900 shadow-deep lg:block">
            <div className="flex items-center justify-between border-b border-ink-900/15 pb-3">
              <span className="font-data text-[8px] uppercase tracking-[0.16em] text-ink-500">Save the date</span>
              <span className="h-1.5 w-1.5 rounded-full bg-ember-500" />
            </div>
            <p className="mt-5 font-display text-3xl leading-none tracking-[-0.04em]">Dimas &amp; Sarah</p>
            <p className="mt-2 font-display text-sm italic text-ink-500">24 . 10 . 2026</p>
            <div className="mt-6 flex items-end justify-between border-t border-ink-900/15 pt-3">
              <span className="font-data text-[8px] uppercase tracking-[0.15em] text-ink-400">loverse.id</span>
              <span className="font-data text-[8px] text-ember-600">No. 0142</span>
            </div>
          </div>

          <div className="pointer-events-none absolute -right-20 top-0 h-[420px] w-[420px] rounded-full border border-cream-100/10" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-6 top-24 h-[220px] w-[220px] rounded-full border border-peach-300/15" aria-hidden="true" />
        </div>
      </section>
    </div>
  );
}
