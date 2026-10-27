import { Link } from "react-router-dom";
import { ArrowUpRight, Instagram, Mail, MessageCircle } from "lucide-react";
import { useTranslation } from "../../i18n";
import { ADMIN_WHATSAPP } from "../../lib/constants";
import { Wordmark } from "../ui/Brand";

const ADMIN_PHONE_LABEL =
  "+62 " +
  ADMIN_WHATSAPP.slice(2, 5) +
  "-" +
  ADMIN_WHATSAPP.slice(5, 9) +
  "-" +
  ADMIN_WHATSAPP.slice(9);

const PAYMENT_LOGOS = [
  { src: "/logos/payment/qris.svg", alt: "QRIS", width: 30, height: 12 },
  { src: "/logos/payment/gopay.svg", alt: "GoPay", width: 85, height: 16 },
  { src: "/logos/payment/gopaylater.svg", alt: "GoPay Later", width: 174, height: 32 },
  { src: "/logos/payment/mandiri.svg", alt: "Mandiri Virtual Account", width: 34, height: 10 },
  { src: "/logos/payment/bni.svg", alt: "BNI Virtual Account", width: 34, height: 10 },
  { src: "/logos/payment/bri.svg", alt: "BRI Virtual Account", width: 20, height: 5 },
  { src: "/logos/payment/permata.svg", alt: "Permata Virtual Account", width: 50, height: 13 },
  { src: "/logos/payment/cimb.svg", alt: "CIMB Niaga Virtual Account", width: 20, height: 3 },
  { src: "/logos/payment/bsi.svg", alt: "BSI Virtual Account", width: 76, height: 24 },
];

export default function PublicFooter() {
  const { t } = useTranslation();

  const explore = [
    { label: t("home.footerNavCatalog"), to: "/#katalog" },
    { label: t("home.footerNavOrder"), to: "/order" },
    { label: t("home.footerNavPortfolio"), to: "/portfolio" },
    { label: t("home.footerNavTutorial"), to: "/tutorial" },
    { label: t("home.footerNavAbout"), to: "/about" },
  ];
  const help = [
    { label: t("home.footerNavFaq"), to: "/#faq" },
    { label: t("home.footerContact"), to: "/contact" },
    { label: t("nav.login"), to: "/login" },
  ];
  const legal = [
    { label: t("home.footerNavPrivacy"), to: "/privacy" },
    { label: t("home.footerNavTerms"), to: "/terms" },
  ];

  return (
    <footer className="section-defer grain grain-light relative overflow-hidden bg-ink-950 text-cream-100">
      <div className="relative z-[2] mx-auto w-full max-w-[1480px] px-4 pb-7 pt-12 sm:px-7 sm:pt-16 lg:px-10">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 border-b border-cream-100/12 pb-10 sm:gap-x-12 lg:grid-cols-[1.4fr_.7fr_.7fr_.8fr] lg:gap-10 lg:pb-12">
          <div className="col-span-2 lg:col-span-1">
            <Wordmark />
            <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-cream-100/58">
              {t("home.footerTagline")}
            </p>
            <p className="eyebrow mt-6 text-cream-100/55">{t("home.footerContact")}</p>
            <div className="mt-3 flex flex-col gap-2.5 text-[14px] text-cream-100/65">
              <a
                href={`https://wa.me/${ADMIN_WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-2 transition-colors hover:text-champagne"
              >
                <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                {ADMIN_PHONE_LABEL}
                <ArrowUpRight className="h-3 w-3" />
              </a>
              <a
                href="mailto:mail@loverse.id"
                className="inline-flex w-fit items-center gap-2 transition-colors hover:text-champagne"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" /> mail@loverse.id
              </a>
              <a
                href="https://instagram.com/loverse.id"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-2 transition-colors hover:text-champagne"
              >
                <Instagram className="h-3.5 w-3.5 shrink-0" /> @loverse.id
              </a>
            </div>
          </div>

          <FooterColumn title={t("home.footerExplore")} links={explore} />
          <FooterColumn title={t("home.footerHelp")} links={help} />
          <div>
            <p className="eyebrow text-cream-100/60">{t("home.footerLegal")}</p>
            <ul className="mt-4 space-y-2.5">
              {legal.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-[14px] text-cream-100/65 transition-colors hover:text-champagne"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-b border-cream-100/12 py-7 sm:py-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
              <span className="eyebrow text-cream-100/65">{t("home.footerPayments")}</span>
              <span className="text-[13px] text-cream-100/48">{t("home.footerPaymentsSub")}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {PAYMENT_LOGOS.map((logo) => (
                <span
                  key={logo.alt}
                  className="flex h-8 items-center rounded-sm border border-cream-100/12 bg-cream-50 px-2.5"
                >
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    width={logo.width}
                    height={logo.height}
                    loading="lazy"
                    decoding="async"
                    className="h-4 w-auto max-w-[58px] object-contain"
                  />
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-end sm:justify-between">
          <>
            <p className="text-[13px] text-cream-100/60">
              {t("home.footerText", { year: new Date().getFullYear() })}
            </p>
            <p className="max-w-xl text-[11px] leading-relaxed text-cream-100/45">
              {t("home.footerModelCreditPrefix")}{" "}
              <a
                href="https://sketchfab.com/3d-models/low-poly-phone-for-mockups-bb7058cfb8fd44f2880e03df1235299d"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-cream-100/35 underline-offset-2 hover:text-champagne"
              >
                Low Poly Phone for Mockups
              </a>{" "}
              {t("home.footerModelCreditBy")}{" "}
              <a
                href="https://sketchfab.com/akacodes"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-cream-100/35 underline-offset-2 hover:text-champagne"
              >
                akacodes
              </a>{" "}
              (CC BY); {t("home.footerModelCreditModified")}
            </p>
          </>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; to: string }>;
}) {
  return (
    <div>
      <p className="eyebrow text-cream-100/60">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="inline-flex items-center gap-1.5 text-[14px] text-cream-100/65 transition-colors hover:text-champagne"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

