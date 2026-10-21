import { Link } from "react-router-dom";
import { ArrowUpRight, Instagram, Mail, MessageCircle, Phone } from "lucide-react";
import { useTranslation } from "../../i18n";
import { ADMIN_WHATSAPP } from "../../lib/constants";
import { MIDTRANS_LOGOS } from "../order/constants";
import { Wordmark } from "../ui/Brand";

const ADMIN_PHONE_LABEL =
  "+62 " +
  ADMIN_WHATSAPP.slice(2, 5) +
  "-" +
  ADMIN_WHATSAPP.slice(5, 9) +
  "-" +
  ADMIN_WHATSAPP.slice(9);

const PAYMENT_LOGOS = [
  { src: MIDTRANS_LOGOS.qris, alt: "QRIS" },
  { src: MIDTRANS_LOGOS.gopay, alt: "GoPay" },
  { src: MIDTRANS_LOGOS.dana, alt: "DANA" },
  { src: MIDTRANS_LOGOS.shopeepay, alt: "ShopeePay" },
  { src: MIDTRANS_LOGOS.bca, alt: "BCA Virtual Account" },
  { src: MIDTRANS_LOGOS.mandiri, alt: "Mandiri Virtual Account" },
  { src: MIDTRANS_LOGOS.bni, alt: "BNI Virtual Account" },
  { src: MIDTRANS_LOGOS.bri, alt: "BRI Virtual Account" },
];

export default function PublicFooter() {
  const { t } = useTranslation();

  const explore = [
    { label: t("home.footerNavCatalog"), to: "/#katalog" },
    { label: t("home.footerNavOrder"), to: "/order" },
    { label: t("home.footerNavPortfolio"), to: "/portfolio" },
    { label: t("home.footerNavTutorial"), to: "/tutorial" },
  ];
  const help = [
    { label: t("home.footerNavFaq"), to: "/#faq" },
    { label: t("home.footerContact"), to: "/contact" },
    { label: t("nav.login"), to: "/login" },
    { label: t("home.footerNavTerms"), to: "/terms" },
  ];
  const legal = [
    { label: t("home.footerNavPrivacy"), to: "/privacy" },
    { label: t("home.footerNavTerms"), to: "/terms" },
  ];

  return (
    <footer className="grain grain-light relative overflow-hidden bg-ink-950 text-cream-100">
      <div className="relative z-[2] mx-auto w-full max-w-[1480px] px-4 pb-8 pt-14 sm:px-7 sm:pt-20 lg:px-10">
        <div className="grid gap-12 border-b border-cream-100/12 pb-14 lg:grid-cols-[1.35fr_.7fr_.7fr_.8fr]">
          <div>
            <Wordmark />
            <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-cream-100/58">
              {t("home.footerTagline")}
            </p>
            <a
              href={`https://wa.me/${ADMIN_WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 border-b border-peach-300/35 pb-1 font-data text-[14px] text-peach-300 transition-colors hover:border-peach-300 hover:text-peach-200"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {ADMIN_PHONE_LABEL}
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>

          <FooterColumn title={t("home.footerExplore")} links={explore} />
          <FooterColumn title={t("home.footerHelp")} links={help} />
          <div>
            <p className="eyebrow text-cream-100/36">{t("home.footerLegal")}</p>
            <ul className="mt-5 space-y-3">
              {legal.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-[14px] text-cream-100/65 transition-colors hover:text-peach-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="eyebrow mt-8 text-cream-100/36">{t("home.footerContact")}</p>
            <div className="mt-4 flex flex-col gap-2.5 text-[14px] text-cream-100/62">
              <a
                href="https://instagram.com/loverse.id"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 transition-colors hover:text-peach-300"
              >
                <Instagram className="h-3.5 w-3.5" /> @loverse.id
              </a>
              <a
                href="mailto:mail@loverse.id"
                className="inline-flex items-center gap-2 transition-colors hover:text-peach-300"
              >
                <Mail className="h-3.5 w-3.5" /> mail@loverse.id
              </a>
              <a
                href={`https://wa.me/${ADMIN_WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 transition-colors hover:text-peach-300"
              >
                <Phone className="h-3.5 w-3.5" /> WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8 border-b border-cream-100/12 py-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="eyebrow shrink-0 text-cream-100/36">{t("home.footerPayments")}</span>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_LOGOS.map((logo) => (
                <span
                  key={logo.alt}
                  className="flex h-6 items-center rounded-[2px] bg-cream-50/92 px-1.5"
                >
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    loading="lazy"
                    className="h-3.5 w-auto max-w-[46px] object-contain"
                  />
                </span>
              ))}
            </div>
          </div>
          <p className="text-[14px] leading-relaxed text-cream-100/35">
            {t("home.footerPaymentsSub")}
          </p>
        </div>

        <div className="relative flex flex-col gap-3 pt-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-[14px] text-cream-100/65">
              {t("home.footerText", { year: new Date().getFullYear() })}
            </p>
            <p className="text-[12px] leading-relaxed text-cream-100/75">
              {t("home.footerModelCreditPrefix")}{" "}
              <a
                href="https://sketchfab.com/3d-models/low-poly-phone-for-mockups-bb7058cfb8fd44f2880e03df1235299d"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-cream-100/45 underline-offset-2 hover:text-peach-300"
              >
                Low Poly Phone for Mockups
              </a>{" "}
              {t("home.footerModelCreditBy")}{" "}
              <a
                href="https://sketchfab.com/akacodes"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-cream-100/45 underline-offset-2 hover:text-peach-300"
              >
                akacodes
              </a>{" "}
              (CC BY); {t("home.footerModelCreditModified")}
            </p>
          </div>
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
      <p className="eyebrow text-cream-100/36">{title}</p>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="inline-flex items-center gap-1.5 text-[14px] text-cream-100/65 transition-colors hover:text-peach-300"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

