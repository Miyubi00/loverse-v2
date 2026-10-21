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
  usePageMeta(
    "Hubungi Kami — LoVerse",
    "Konsultasi undangan pernikahan digital via WhatsApp dan email. Tim LoVerse siap membantu memilih tema dan pemesanan.",
  );
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
              <span className="inline-flex items-center gap-2 border border-ink-900/15 px-3 py-2 font-data text-[14px] uppercase tracking-[0.06em] text-ink-600">
                <span className="h-1.5 w-1.5 rounded-full bg-success-600" />
                {t("contact.onlineChip")}
              </span>
              <span className="inline-flex items-center gap-2 border border-ink-900/15 px-3 py-2 font-data text-[14px] uppercase tracking-[0.06em] text-ink-600">
                <Clock className="h-3 w-3" />
                {t("contact.openNow")} · {wibInfo.timeString}
              </span>
            </div>
          }
        />

        <div className="grid gap-8 py-12 lg:grid-cols-12 lg:gap-10 lg:py-16">
          <section className="min-w-0 lg:col-span-7">
            <div className="mb-4 flex items-end justify-between gap-4 border-b border-ink-900/15 pb-3">
              <div>
                <p className="eyebrow text-ember-600">{t("contact.sectionAi")}</p>
                <p className="mt-1 text-[14px] text-ink-500">{t("contact.sectionAiDesc")}</p>
              </div>
              <Sparkles className="h-4 w-4 text-ember-500" />
            </div>
            <AiAssistant waNumber={whatsappNumber} />
          </section>

          <aside className="lg:col-span-5">
            <div className="grain grain-light relative overflow-hidden bg-ink-950 p-6 text-cream-100 sm:p-8">
              <div className="relative z-[2]">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="eyebrow text-peach-300/80">{t("contact.sectionHuman")}</p>
                    <h2 className="mt-3 font-display text-[clamp(2rem,4vw,2.8rem)] leading-[0.98] tracking-[-0.04em] text-cream-50">
                      {t("contact.whatsappMainTitle")}
                    </h2>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-cream-100/20 text-peach-300">
                    <FaWhatsapp className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-cream-100/55">
                  {t("contact.whatsappMainDesc")}
                </p>

                <div className="mt-7 border-y border-cream-100/12 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-data text-[14px] uppercase tracking-[0.06em] text-cream-100/35">
                      WhatsApp
                    </span>
                    <span className="font-data text-[14px] text-cream-100/80">{displayNumber}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <span className="font-data text-[14px] uppercase tracking-[0.06em] text-cream-100/35">
                      Jam operasional
                    </span>
                    <span className="text-[14px] text-cream-100/80">09.00 — 21.00 WIB</span>
                  </div>
                </div>

                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Halo Admin LoVerse, saya mau konsultasi tentang undangan digital...")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass("peach", "lg", "mt-6 w-full")}
                >
                  <FaWhatsapp className="h-4 w-4" />
                  {t("contact.whatsappMainBtn", { name: "Admin LoVerse" })}
                </a>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(whatsappNumber, "Nomor WhatsApp Utama", "wa-main")}
                    className="inline-flex min-h-10 items-center justify-center gap-2 border border-cream-100/15 px-3 text-[14px] text-cream-100/65 transition-colors hover:border-cream-100/35 hover:text-cream-50"
                  >
                    {copiedKey === "wa-main" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedKey === "wa-main" ? t("common.copied") : t("common.copy")}
                  </button>
                  <a
                    href="https://instagram.com/loverse.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center justify-center gap-2 border border-cream-100/15 px-3 text-[14px] text-cream-100/65 transition-colors hover:border-cream-100/35 hover:text-cream-50"
                  >
                    <Instagram className="h-3.5 w-3.5" />
                    {t("contact.instagramFollow")}
                  </a>
                </div>

                <p className="mt-6 flex items-start gap-2 text-[14px] leading-relaxed text-cream-100/35">
                  <Clock className="mt-0.5 h-3 w-3 shrink-0" />
                  {t("contact.operatingHours")}
                </p>
              </div>
              <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full border border-peach-300/15" aria-hidden="true" />
              <div className="pointer-events-none absolute -bottom-12 -right-4 h-36 w-36 rounded-full border border-cream-100/10" aria-hidden="true" />
            </div>

            <div className="mt-4 border border-ink-900/15 bg-cream-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="eyebrow text-ink-400">{t("contact.instagramTitle")}</p>
                  <p className="mt-2 text-[14px] text-ink-600">{t("contact.instagramSubtitle")}</p>
                </div>
                <a href="https://instagram.com/loverse.id" target="_blank" rel="noopener noreferrer" aria-label="Instagram LoVerse" className="flex h-10 w-10 items-center justify-center border border-ink-900/15 text-ink-700 transition-colors hover:bg-ink-950 hover:text-cream-50">
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </div>
          </aside>
        </div>

        <div className="grid grid-cols-1 border-t border-ink-900/15 sm:grid-cols-3">
          {QUICK_LINKS.map((link, index) => (
            <Reveal key={link.to} delay={index * 60}>
              <Link to={link.to} className="group flex items-start justify-between gap-5 border-b border-ink-900/15 px-1 py-7 transition-colors hover:bg-cream-50 sm:border-b-0 sm:border-r sm:px-5 sm:last:border-r-0">
                <div className="flex items-start gap-4">
                  <link.icon className="mt-0.5 h-4 w-4 text-ember-600" strokeWidth={1.5} />
                  <div>
                    <p className="font-display text-xl leading-tight tracking-[-0.02em] text-ink-900">{t(link.label)}</p>
                    <p className="mt-1 text-[14px] text-ink-400">{t(link.desc)}</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-ink-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ember-600" />
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
