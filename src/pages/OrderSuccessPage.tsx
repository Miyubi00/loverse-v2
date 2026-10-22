import { useNavigate } from "react-router-dom";
import { Check, Home, Mail, MessageSquare, ShieldCheck } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { ADMIN_WHATSAPP } from "../lib/constants";
import { goBackOrHome } from "../lib/navigation";
import { useTranslation } from "../i18n";
import Button from "../components/ui/Button";

export default function OrderSuccess() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const steps = [
    { icon: MessageSquare, title: t("orderSuccess.steps.s1Title"), desc: t("orderSuccess.steps.s1Desc") },
    { icon: ShieldCheck, title: t("orderSuccess.steps.s2Title"), desc: t("orderSuccess.steps.s2Desc") },
    { icon: Mail, title: t("orderSuccess.steps.s3Title"), desc: t("orderSuccess.steps.s3Desc") },
  ];

  return (
    <div className="min-h-[calc(100svh-68px)] bg-cream-100">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-7 sm:py-16 lg:grid-cols-[1.05fr_.95fr] lg:gap-14 lg:px-10 lg:py-20">
        <section className="relative">
          <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full border border-ink-900/10" aria-hidden="true" />
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-950 text-champagne">
              <Check className="h-5 w-5" strokeWidth={3} />
            </div>
            <p className="eyebrow mt-8 text-ember-600">{t("orderSuccess.eyebrow")}</p>
            <h1 className="mt-4 max-w-[11ch] font-display text-[clamp(3rem,7vw,5.4rem)] leading-[0.92] tracking-[-0.055em] text-ink-950">
              {t("orderSuccess.title")}
            </h1>
            <p className="mt-6 max-w-md text-[14px] leading-relaxed text-ink-500">{t("orderSuccess.desc")}</p>

            <div className="mt-9 flex flex-col gap-2.5 sm:flex-row">
              <a
                href={`https://wa.me/${ADMIN_WHATSAPP}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[2px] bg-whatsapp-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-whatsapp-700"
              >
                <FaWhatsapp className="h-5 w-5" /> {t("orderSuccess.btnWhatsapp")}
              </a>
              <Button variant="secondary" size="lg" onClick={() => goBackOrHome(navigate)}>
                <Home className="h-4 w-4" /> {t("orderSuccess.btnHome")}
              </Button>
            </div>

            <div className="mt-10 flex items-center gap-3 border-t border-ink-900/12 pt-5">
              <span className="flex h-8 w-8 items-center justify-center border border-ink-900/15 text-[14px] font-semibold text-ember-600">01</span>
              <p className="max-w-sm text-[14px] leading-relaxed text-ink-400">{t("orderSuccess.supportNote")}</p>
            </div>
          </div>
        </section>

        <aside className="self-start border border-ink-900/15 bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-ink-900/10 px-5 py-4">
            <p className="eyebrow text-ink-500">{t("orderSuccess.timelineLabel")}</p>
            <span className="font-data text-[14px] text-ink-400">01 — 03</span>
          </div>
          <ol className="divide-y divide-ink-900/10">
            {steps.map((step, index) => (
              <li key={step.title} className="flex items-start gap-4 p-5">
                <span className="font-display text-[26px] leading-none tracking-[-0.04em] text-ember-600">
                  0{index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <step.icon className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                    <p className="text-[14px] font-semibold text-ink-950">{step.title}</p>
                  </div>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-ink-400">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="flex items-center gap-2 border-t border-ink-900/10 bg-cream-50 px-5 py-3.5">
            <span className="h-1.5 w-1.5 rounded-full bg-whatsapp-600" />
            <p className="font-data text-[14px] uppercase tracking-[0.06em] text-ink-400">{t("contact.hoursTitle")} · {t("contact.hoursTime")}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
