import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  Clock,
  Copy,
  MessageCircle,
  Phone,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useTranslation } from "../i18n";
import { usePageMeta } from "../hooks/usePageMeta";
import AiAssistant from "../components/contact/AiAssistant";
import { useCopyToClipboard } from "../hooks/useCopyToClipboard";
import { ADMIN_WHATSAPP } from "../lib/constants";
import PageHeader from "../components/ui/PageHeader";
import Reveal from "../components/ui/Reveal";
import { buttonClass } from "../components/ui/buttonStyles";

const QUICK_LINKS: Array<{ to: string; label: string; desc: string; icon: LucideIcon }> = [
  { to: "/order", label: "contact.quickOrder", desc: "contact.quickOrderDesc", icon: Sparkles },
  { to: "/demo/motion-flow", label: "contact.quickDemo", desc: "contact.quickDemoDesc", icon: MessageCircle },
];

export default function Contact() {
  const { t } = useTranslation();
  usePageMeta(t("contact.metaTitle"), t("contact.metaDescription"));
  const copyToClipboard = useCopyToClipboard();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const whatsappNumber = ADMIN_WHATSAPP;
  const displayNumber = "+62 851-7988-0092";

  const handleCopy = (text: string, label: string, key: string) => {
    copyToClipboard(text, label);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2000);
  };

  return (
    <div className="min-h-screen bg-cream-100 text-ink-900">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-7 lg:px-10">
        <PageHeader
          eyebrow={t("contact.badge")}
          index="01"
          title={<>{t("contact.headline")}</>}
          description={t("contact.subtitle")}
        />

        <div className="grid items-stretch gap-6 py-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-7 lg:py-14">
          <section className="flex min-w-0 flex-col">
            <AiAssistant waNumber={whatsappNumber} />
          </section>

          <aside className="flex min-w-0 flex-col gap-4">
            <div className="grain grain-light relative flex flex-[2] flex-col overflow-hidden rounded-[4px] border border-wine-900 bg-wine-900 p-5 text-cream-100 sm:p-6">
              <div className="relative z-[2] flex h-full flex-col">
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center border border-cream-100/20 text-champagne">
                    <FaWhatsapp className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-data text-[12px] leading-tight text-champagne/90">{t("contact.sectionHuman")}</p>
                    <h2 className="mt-1 font-display text-[22px] leading-tight tracking-[-0.03em] text-cream-50 sm:text-[24px]">
                      {t("contact.whatsappMainTitle")}
                    </h2>
                  </div>
                </div>

                <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-cream-100/70">
                  {t("contact.whatsappMainDesc")}
                </p>

                <div className="mt-5 flex items-center justify-between gap-4 border-t border-cream-100/15 pt-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <Phone className="h-4 w-4 shrink-0 text-champagne/70" aria-hidden="true" />
                    <span className="font-data text-[14px] text-cream-100/85">{displayNumber}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(whatsappNumber, t("contact.whatsappNumberLabel"), "wa-main")}
                    aria-label={`${t("common.copy")} ${t("contact.whatsappNumberLabel")}`}
                    className="flex h-10 shrink-0 items-center justify-center gap-2 border border-cream-100/20 px-3 text-[13px] font-medium text-cream-100/75 transition-colors hover:border-cream-100/40 hover:bg-cream-100/5 hover:text-cream-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peach-300"
                  >
                    {copiedKey === "wa-main" ? (
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {copiedKey === "wa-main" ? t("common.copied") : t("common.copy")}
                  </button>
                </div>

                <div className="mt-4 border-t border-cream-100/15 pt-4">
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-champagne/70" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="font-data text-[13px] leading-tight text-cream-100/85">{t("contact.hoursTime")}</p>
                      <p className="mt-1 text-[12px] leading-snug text-cream-100/60">{t("contact.hoursSubtitle")}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-2 pt-5">
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(t("contact.whatsappGreeting"))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClass("peach", "lg", "w-full")}
                  >
                    {t("contact.whatsappMainBtn", { name: t("contact.ai.adminName") })}
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </div>

              <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full border border-champagne/15" aria-hidden="true" />
              <div className="pointer-events-none absolute -bottom-12 -right-4 h-36 w-36 rounded-full border border-cream-100/10" aria-hidden="true" />
            </div>

            <div className="relative flex flex-1 flex-col overflow-hidden rounded-[4px] border border-ink-900/15 bg-cream-50 p-5 text-ink-900 shadow-lift sm:p-6">
              <div className="my-auto">
                <h2 className="font-display text-[20px] leading-tight tracking-[-0.02em] text-ink-900">
                  {t("contact.socialTitle")}
                </h2>

                <div className="mt-3 divide-y divide-ink-900/12">
                  <a
                    href="https://www.instagram.com/loverse.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 py-3 first:pt-0 last:pb-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-500"
                  >
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center border border-ink-950 bg-ink-950 text-champagne transition-colors group-hover:bg-ink-900">
                      <FaInstagram className="h-7 w-7" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[18px] leading-tight text-ink-900">Instagram</span>
                      <span className="mt-0.5 block font-data text-[13px] text-ink-500">{t("contact.socialHandle")}</span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-400 transition-colors group-hover:text-ember-600" aria-hidden="true" />
                  </a>

                  <a
                    href="https://www.tiktok.com/@loverse.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 py-3 first:pt-0 last:pb-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-500"
                  >
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center border border-ink-950 bg-ink-950 text-champagne transition-colors group-hover:bg-ink-900">
                      <FaTiktok className="h-7 w-7" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[18px] leading-tight text-ink-900">TikTok</span>
                      <span className="mt-0.5 block font-data text-[13px] text-ink-500">{t("contact.socialHandle")}</span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-400 transition-colors group-hover:text-ember-600" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="pb-12 lg:pb-16">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-ink-900/12 pb-4">
            <span className="eyebrow text-ember-600">{t("contact.quickTitle")}</span>
            <span className="h-px w-10 bg-ink-900/20" aria-hidden="true" />
          </div>

          <div className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2">
            {QUICK_LINKS.map((link, index) => (
              <Reveal key={link.to} delay={index * 60} className="h-full">
                <Link
                  to={link.to}
                  className="group flex h-full items-start justify-between gap-5 rounded-[4px] border border-ink-900/15 bg-cream-50 px-5 py-6 transition-[background-color,border-color] hover:border-ink-900/25 hover:bg-cream-100 focus-visible:outline-offset-2"
                >
                  <div className="flex items-start gap-4">
                    <link.icon className="mt-0.5 h-4 w-4 text-ember-600" strokeWidth={1.5} aria-hidden="true" />
                    <div>
                      <p className="font-display text-xl leading-tight tracking-[-0.02em] text-ink-900">{t(link.label)}</p>
                      <p className="mt-1 text-[14px] text-ink-400">{t(link.desc)}</p>
                    </div>
                  </div>
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 text-ink-300 transition-[transform,color] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ember-600 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
