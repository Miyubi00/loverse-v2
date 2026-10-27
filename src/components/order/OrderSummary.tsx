import type { ReactNode } from "react";
import {
  ArrowLeftRight,
  CalendarDays,
  CreditCard,
  Info,
  Mail,
  Pencil,
  ReceiptText,
  Users,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useTranslation } from "../../i18n";
import type { MasterTemplate } from "../../lib/constants";
import {
  formatIDR,
  getPaymentMethodFee,
  MIDTRANS_LOGOS,
  normalizeWhatsappNumber,
  PAYMENT_SUMMARY_LABEL_KEYS,
  VA_BANKS,
  type PaymentMethodType,
} from "./constants";

interface OrderSummaryProps {
  formData: {
    groom_name: string;
    bride_name: string;
    wedding_date: string;
    whatsapp: string;
    email: string;
  };
  selectedTemplate: MasterTemplate;
  selectedImage?: string;
  paymentMethod: PaymentMethodType | null;
  onEdit: () => void;
  onChangeMethod: () => void;
  actions?: ReactNode;
}

function formatTanggal(iso: string, locale: string): string {
  if (!iso) return "";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
}

function DetailRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="flex shrink-0 items-center gap-2 text-[14px] text-ink-400">
        <span className="text-ink-400">{icon}</span>
        {label}
      </span>
      <span className="min-w-0 truncate text-right text-[14px] font-medium text-ink-800">{value}</span>
    </div>
  );
}

export function OrderSummary({
  formData,
  selectedTemplate,
  selectedImage,
  paymentMethod,
  onEdit,
  onChangeMethod,
  actions,
}: OrderSummaryProps) {
  const { t, language } = useTranslation();
  const fee = paymentMethod ? getPaymentMethodFee(selectedTemplate.price, paymentMethod) : 0;
  const total = selectedTemplate.price + fee;
  const methodLabel = paymentMethod ? t(PAYMENT_SUMMARY_LABEL_KEYS[paymentMethod]) : t("order.selectPaymentMethod");

  const methodLogo = (() => {
    if (paymentMethod === "whatsapp" || !paymentMethod) return null;
    if (paymentMethod === "qris") return MIDTRANS_LOGOS.qris;
    if (paymentMethod === "gopay") return MIDTRANS_LOGOS.gopay;
    return VA_BANKS.find((bank) => bank.id === paymentMethod)?.logo ?? null;
  })();

  return (
    <div className="overflow-hidden border border-ink-900/15 bg-white">
      <div className="relative border-b border-ink-900/12 p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="aspect-[3/4] w-[78px] shrink-0 overflow-hidden border border-ink-900/10 bg-cream-100 sm:w-[96px]">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={selectedTemplate.name}
                width={304}
                height={405}
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <span className="border border-ink-900/15 px-1.5 py-0.5 font-data text-[14px] uppercase tracking-[0.06em] text-ink-500">
                {t("order.packageLabel")} {selectedTemplate.category}
              </span>
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex shrink-0 items-center gap-1.5 border-b border-ink-900/25 pb-0.5 text-[14px] font-semibold text-ink-600 transition-colors hover:border-ember-500 hover:text-ember-600"
              >
                <Pencil size={11} /> {t("order.confirmEdit")}
              </button>
            </div>
            <h2 className="mt-2 truncate font-display text-[26px] leading-none tracking-[-0.04em] text-ink-950 sm:text-3xl">
              {selectedTemplate.name}
            </h2>
            <p className="mt-2 text-[14px] text-ink-400">{t("order.templateSubtitle")}</p>
          </div>
        </div>
        <p className="mt-4 font-data text-[14px] uppercase tracking-[0.06em] text-ink-400">{t("order.confirmEyebrow")}</p>
      </div>

      <div className="divide-y divide-ink-900/10">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <p className="flex items-center gap-2 font-display text-[17px] tracking-[-0.02em] text-ink-950">
              <Users size={15} className="shrink-0 text-ember-600" /> {t("order.dataContactTitle")}
            </p>
            <span className="font-data text-[14px] uppercase tracking-[0.06em] text-ink-400">{t("order.eventData")}</span>
          </div>
          <div className="mt-2">
            <DetailRow icon={<Users size={13} />} label={t("order.coupleNameLabel")} value={`${formData.groom_name} & ${formData.bride_name}`} />
            <DetailRow
              icon={<CalendarDays size={13} />}
              label={t("order.eventDateLabel")}
              value={formatTanggal(formData.wedding_date, language === "en" ? "en-GB" : "id-ID")}
            />
            <DetailRow icon={<Mail size={13} />} label={t("order.email")} value={formData.email} />
            <DetailRow
              icon={<FaWhatsapp size={13} />}
              label={t("order.whatsapp")}
              value={`+62${normalizeWhatsappNumber(formData.whatsapp)}`}
            />
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <p className="flex items-center gap-2 font-display text-[17px] tracking-[-0.02em] text-ink-950">
              <CreditCard size={15} className="shrink-0 text-ember-600" /> {t("order.methodSectionTitle")}
            </p>
            <button
              type="button"
              onClick={onChangeMethod}
              className="inline-flex shrink-0 items-center gap-1.5 border-b border-ink-900/25 pb-0.5 text-[14px] font-semibold text-ink-600 transition-colors hover:border-ember-500 hover:text-ember-600"
            >
              <ArrowLeftRight size={11} /> {t("order.changeMethod")}
            </button>
          </div>
          <div className="mt-3 flex items-center gap-3 border border-ink-900/12 bg-cream-50 p-3">
            {paymentMethod === "whatsapp" ? (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-success-600/10">
                <FaWhatsapp size={20} className="text-whatsapp-600" />
              </span>
            ) : methodLogo ? (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-ink-900/10 bg-white px-1.5">
                <img src={methodLogo} alt={methodLabel} className="max-h-6 w-auto object-contain" />
              </span>
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-ink-900/10 bg-white">
                <CreditCard size={18} className="text-ink-500" />
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-semibold text-ink-950">{methodLabel}</span>
              {paymentMethod === "whatsapp" ? (
                <span className="mt-0.5 block text-[14px] text-ink-400">{t("order.waDesc")}</span>
              ) : null}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <p className="flex items-center gap-2 font-display text-[17px] tracking-[-0.02em] text-ink-950">
            <ReceiptText size={15} className="shrink-0 text-ember-600" /> {t("order.paymentDetails")}
          </p>
          <div className="mt-3 space-y-2.5 text-[14px]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-ink-400">{t("order.templatePrice")}</span>
              <span className="font-data text-ink-800">{formatIDR(selectedTemplate.price)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-ink-400">
                {t("order.adminFee")} <Info size={11} className="text-ink-400" />
              </span>
              <span className="font-data text-ink-800">{fee > 0 ? `+ ${formatIDR(fee)}` : formatIDR(0)}</span>
            </div>
            <p className="text-[14px] leading-relaxed text-ink-400">{t("order.feeNotePpn")}</p>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4 border-t border-ink-900/12 pt-4">
            <span className="text-[14px] font-semibold text-ink-700">{t("order.totalPayment")}</span>
            <span className="font-display text-[26px] leading-none tracking-[-0.04em] text-ink-950 sm:text-3xl">
              {formatIDR(total)}
            </span>
          </div>
        </div>

        {actions ? <div className="space-y-2.5 p-4 sm:p-6">{actions}</div> : null}
      </div>
    </div>
  );
}
