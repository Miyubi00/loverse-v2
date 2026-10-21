import type { ChangeEvent } from "react";
import { ArrowLeft, ArrowUpRight, Calendar, Mail, User } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import type { MasterTemplate } from "../../lib/constants";
import { useTranslation } from "../../i18n";
import { INPUT_CLASS, type OrderFormData } from "./constants";
import { SectionCard, SectionHeading } from "./SectionCard";

interface OrderDetailsFormProps {
  formData: OrderFormData;
  selectedTemplate: MasterTemplate;
  selectedImage?: string;
  todayStr: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onWhatsappChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onChangeTemplate: () => void;
}

export function OrderDetailsForm({
  formData,
  selectedTemplate,
  selectedImage,
  todayStr,
  onChange,
  onWhatsappChange,
  onChangeTemplate,
}: OrderDetailsFormProps) {
  const { t } = useTranslation();

  return (
    <SectionCard>
      <div className="flex items-start justify-between gap-4">
        <SectionHeading step="01" title={t("order.step1Title")} />
        <span className="eyebrow shrink-0 pt-1 text-ink-400">Terkunci</span>
      </div>

      <div className="flex gap-4 border-y border-ink-900/10 py-4 sm:gap-5">
        {selectedImage ? (
          <div className="relative aspect-[3/4] w-[76px] shrink-0 overflow-hidden border border-ink-900/10 bg-cream-100 sm:w-[92px]">
            <img src={selectedImage} alt={selectedTemplate.name} className="h-full w-full object-cover" />
          </div>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
          <div>
            <span className="inline-flex border border-ink-900/15 px-1.5 py-0.5 font-data text-[8px] uppercase tracking-[0.12em] text-ink-500">
              {selectedTemplate.category}
            </span>
            <p className="mt-2 truncate font-display text-2xl leading-none tracking-[-0.03em] text-ink-950">
              {selectedTemplate.name}
            </p>
            <p className="mt-2 font-data text-[11px] text-ink-500">
              Rp {selectedTemplate.price.toLocaleString("id-ID")}
              <span className="text-ink-400"> / sekali bayar</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onChangeTemplate}
            className="mt-3 inline-flex w-fit items-center gap-1.5 border-b border-ink-900/25 pb-0.5 text-[11px] font-semibold text-ink-700 transition-colors hover:border-ember-500 hover:text-ember-600"
          >
            <ArrowLeft size={12} /> {t("order.changeTemplate")} <ArrowUpRight size={11} />
          </button>
        </div>
      </div>
      <p className="-mt-2 text-[11px] leading-relaxed text-ink-400">{t("order.step1LockedDesc")}</p>

      <div className="border-t border-ink-900/12 pt-5">
        <div className="flex items-start justify-between gap-4">
          <SectionHeading step="02" title={t("order.step2Title")} className="mb-4" />
          <span className="eyebrow shrink-0 pt-1 text-ink-400">Data inti</span>
        </div>

        <div className="w-full min-w-0 space-y-4">
          <div className="grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
            <div className="w-full min-w-0">
              <label htmlFor="order-groom-name" className="mb-1.5 block font-data text-[9px] uppercase tracking-[0.14em] text-ink-500">
                {t("order.groomName")}
              </label>
              <div className="relative w-full min-w-0">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                <input
                  id="order-groom-name"
                  required
                  name="groom_name"
                  value={formData.groom_name}
                  type="text"
                  autoComplete="given-name"
                  placeholder={t("order.groomPlaceholder")}
                  onChange={onChange}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
            <div className="w-full min-w-0">
              <label htmlFor="order-bride-name" className="mb-1.5 block font-data text-[9px] uppercase tracking-[0.14em] text-ink-500">
                {t("order.brideName")}
              </label>
              <div className="relative w-full min-w-0">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                <input
                  id="order-bride-name"
                  required
                  name="bride_name"
                  value={formData.bride_name}
                  type="text"
                  autoComplete="family-name"
                  placeholder={t("order.bridePlaceholder")}
                  onChange={onChange}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </div>

          <div className="w-full min-w-0">
            <label htmlFor="order-wedding-date" className="mb-1.5 block font-data text-[9px] uppercase tracking-[0.14em] text-ink-500">
              {t("order.weddingDate")}
            </label>
            <div className="relative w-full min-w-0">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
              <input
                id="order-wedding-date"
                required
                name="wedding_date"
                value={formData.wedding_date}
                type="date"
                min={todayStr}
                onChange={onChange}
                className={INPUT_CLASS}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-ink-400">Tanggal ini akan tampil di countdown dan halaman tamu.</p>
          </div>

          <div className="grid w-full min-w-0 grid-cols-1 gap-4 border-t border-ink-900/10 pt-5 md:grid-cols-2">
            <div className="w-full min-w-0">
              <label htmlFor="order-email" className="mb-1.5 block font-data text-[9px] uppercase tracking-[0.14em] text-ink-500">
                {t("order.email")}
              </label>
              <div className="relative w-full min-w-0">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                <input
                  id="order-email"
                  required
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t("order.emailPlaceholder")}
                  value={formData.email}
                  onChange={onChange}
                  className={INPUT_CLASS}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-ink-400">Invoice dan PIN dikirim ke email ini.</p>
            </div>

            <div className="w-full min-w-0">
              <label htmlFor="order-whatsapp" className="mb-1.5 block font-data text-[9px] uppercase tracking-[0.14em] text-ink-500">
                {t("order.whatsapp")}
              </label>
              <div className="relative w-full min-w-0">
                <FaWhatsapp className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                <input
                  id="order-whatsapp"
                  required
                  name="whatsapp"
                  type="tel"
                  autoComplete="tel-national"
                  inputMode="numeric"
                  placeholder={t("order.whatsappPlaceholder")}
                  value={formData.whatsapp}
                  onChange={onWhatsappChange}
                  className={INPUT_CLASS}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-ink-400">Diawali tanpa 0 — contoh 81234567890.</p>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
