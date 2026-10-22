import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Clock,
  Copy,
  Instagram,
  MessageCircle,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useTranslation } from "../i18n";
import { usePageMeta } from "../hooks/usePageMeta";
import AiAssistant from "../components/contact/AiAssistant";
import { useCopyToClipboard } from "../hooks/useCopyToClipboard";
import { ADMIN_WHATSAPP } from "../lib/constants";
import PageHeader from "../components/ui/PageHeader";
import Reveal from "../components/ui/Reveal";
import { buttonClass } from "../components/ui/buttonStyles";

function getWibStatus() {
  try {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
    const currentDecimal = hour + minute / 60;
    return {
      isOpen: currentDecimal >= 9 && currentDecimal < 21,
      timeString: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} WIB`,
    };
  } catch {
    const now = new Date();
    return {
      isOpen: now.getHours() >= 9 && now.getHours() < 21,
      timeString: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} WIB`,
    };
  }
}

const QUICK_LINKS: Array<{ to: string; label: string; desc: string; icon: LucideIcon }> = [
  { to: "/order", label: "contact.quickOrder", desc: "contact.quickOrderDesc", icon: Sparkles },
  { to: "/demo/motion-flow", label: "contact.quickDemo", desc: "contact.quickDemoDesc", icon: MessageCircle },
  { to: "/payment-status", label: "contact.quickStatus", desc: "contact.quickStatusDesc", icon: Clock },
];

export default function Contact() {
  const { t } = useTranslation();
  usePageMeta(t("contact.metaTitle"), t("contact.metaDescription"));
  const copyToClipboard = useCopyToClipboard();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [wibInfo, setWibInfo] = useState(() => getWibStatus());

  useEffect(() => {
    const timer = setInterval(() => setWibInfo(getWibStatus()), 30000);
    return () => clearInterval(timer);
  }, []);

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
          aside={
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 border border-ink-900/15 px-3 py-2 text-[13px] leading-tight text-ink-600">
                <span className="h-1.5 w-1.5 rounded-full bg-success-600" aria-hidden="true" />
                {t("contact.onlineChip")}
              </span>
              <span className="inline-flex items-center gap-2 border border-ink-900/15 px-3 py-2 text-[13px] leading-tight text-ink-600">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {wibInfo.isOpen ? t("contact.openNow") : t("contact.closedNow")} · {wibInfo.timeString}
              </span>
            </div>
          }
        />

        <div className="grid gap-6 py-10 lg:grid-cols-2 lg:items-stretch lg:gap-6 lg:py-14">
          <section className="flex min-w-0 flex-col">
            <AiAssistant waNumber={whatsappNumber} />
          </section>

          <aside className="flex min-w-0 flex-col">
            <div className="grain grain-light relative flex h-full flex-col overflow-hidden rounded-[4px] border border-ink-950/40 bg-ink-950 p-6 text-cream-100 sm:p-8">
              <div className="relative z-[2] flex h-full flex-col">
                <div className="flex items-start justify-between gap-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="font-data text-[12px] leading-tight text-champagne/90">{t("contact.sectionHuman")}</p>
                      <span className="h-0.5 w-0.5 rounded-full bg-cream-100/40" aria-hidden="true" />
                      <p className="font-data text-[12px] leading-tight text-cream-100/55">{t("contact.sectionHumanDesc")}</p>
                    </div>
                    <h2 className="mt-1 font-display text-[22px] leading-tight tracking-[-0.03em] text-cream-50 sm:text-[24px]">
                      {t("contact.whatsappMainTitle")}
                    </h2>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-cream-100/20 text-champagne">
                    <FaWhatsapp className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>

                <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-cream-100/65">
                  {t("contact.whatsappMainDesc")}
                </p>

                <div className="mt-5 border-y border-cream-100/12 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-data text-[13px] text-cream-100/60">WhatsApp</span>
                    <span className="font-data text-[14px] text-cream-100/85">{displayNumber}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <span className="font-data text-[13px] text-cream-100/60">{t("contact.hoursTitle")}</span>
                    <span className="text-[14px] text-cream-100/85">{t("contact.hoursTime")}</span>
                  </div>
                </div>

                <div className="mt-auto pt-6">
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(t("contact.whatsappGreeting"))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClass("peach", "lg", "w-full")}
                  >
                    <FaWhatsapp className="h-4 w-4" aria-hidden="true" />
                    {t("contact.whatsappMainBtn", { name: t("contact.ai.adminName") })}
                  </a>

                  <button
                    type="button"
                    onClick={() => handleCopy(whatsappNumber, t("contact.whatsappNumberLabel"), "wa-main")}
                    className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 border border-cream-100/15 px-3 text-[14px] text-cream-100/70 transition-colors hover:border-cream-100/35 hover:text-cream-50"
                  >
                    {copiedKey === "wa-main" ? (
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {copiedKey === "wa-main" ? t("common.copied") : t("common.copy")}
                  </button>

                  <div className="mt-4 flex items-center justify-between gap-4 border-t border-cream-100/12 pt-4">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-cream-50">{t("contact.instagramTitle")}</p>
                      <p className="mt-0.5 text-[13px] text-cream-100/55">{t("contact.instagramSubtitle")}</p>
                    </div>
                    <a
                      href="https://instagram.com/loverse.id"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t("contact.instagramAria")}
                      className="inline-flex min-h-11 shrink-0 items-center gap-2 border border-cream-100/15 px-3 text-[13px] font-medium text-cream-100/75 transition-colors hover:border-cream-100/35 hover:text-cream-50"
                    >
                      <Instagram className="h-4 w-4" aria-hidden="true" />
                      {t("contact.instagramFollow")}
                    </a>
                  </div>

                  <p className="mt-4 flex items-start gap-2 text-[13px] leading-relaxed text-cream-100/60">
                    <Clock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                    {t("contact.operatingHours")}
                  </p>
                </div>
              </div>

              <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full border border-champagne/15" aria-hidden="true" />
              <div className="pointer-events-none absolute -bottom-12 -right-4 h-36 w-36 rounded-full border border-cream-100/10" aria-hidden="true" />
            </div>
          </aside>
        </div>

        <div className="grid grid-cols-1 gap-4 pb-12 sm:grid-cols-3 lg:pb-16">
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
  );
}
