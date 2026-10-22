import type { ReactNode } from "react";
import { Building2, Check, ChevronDown, QrCode, Smartphone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useTranslation } from "../../i18n";
import {
  EWALLET_OPTIONS,
  formatIDR,
  getPaymentMethodFee,
  isEwalletMethod,
  isVaMethod,
  MIDTRANS_LOGOS,
  VA_BANKS,
  type ExpandedCategory,
  type PaymentMethodType,
} from "./constants";
import { SectionCard, SectionHeading } from "./SectionCard";

interface PaymentMethodPickerProps {
  basePrice: number;
  paymentMethod: PaymentMethodType | null;
  onSelect: (method: PaymentMethodType) => void;
  expandedCategory: ExpandedCategory | null;
  onExpand: (category: ExpandedCategory | null) => void;
}

const LogoPill = ({ src, alt, className = "h-4" }: { src: string; alt: string; className?: string }) => (
  <div className="flex shrink-0 items-center justify-center border border-ink-900/10 bg-white px-1.5 py-0.5">
    <img src={src} alt={alt} className={`${className} w-auto max-w-[58px] object-contain`} />
  </div>
);

const SelectMark = ({ selected, green = false }: { selected: boolean; green?: boolean }) => (
  <span
    className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors ${
      selected
        ? green
          ? "border-whatsapp-600 bg-whatsapp-600 text-white"
          : "border-ink-950 bg-ink-950 text-cream-50"
        : "border-ink-900/25 bg-transparent text-transparent"
    }`}
    aria-hidden="true"
  >
    <Check className="h-3 w-3" strokeWidth={3} />
  </span>
);

interface CategoryRowProps {
  active?: boolean;
  green?: boolean;
  onClick?: () => void;
  icon: ReactNode;
  title: string;
  badge?: ReactNode;
  logos?: ReactNode;
  description?: ReactNode;
  price: ReactNode;
  trailing?: ReactNode;
  mark?: ReactNode;
  expanded?: boolean;
}

function CategoryRow({
  active = false,
  green = false,
  onClick,
  icon,
  title,
  badge,
  logos,
  description,
  price,
  trailing,
  mark,
  expanded,
}: CategoryRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
      aria-expanded={typeof expanded === "boolean" ? expanded : undefined}
      className={`flex w-full cursor-pointer items-start justify-between gap-3 border p-3.5 text-left transition-colors sm:p-4 ${
        active
          ? green
            ? "border-whatsapp-600/45 bg-success-600/5"
            : "border-ink-950 bg-cream-100"
          : "border-ink-900/12 bg-white hover:border-ink-900/30 hover:bg-cream-50"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center border ${
            active
              ? green
                ? "border-whatsapp-600/30 bg-whatsapp-600 text-white"
                : "border-ink-950 bg-ink-950 text-peach-300"
              : "border-ink-900/10 bg-cream-100 text-ink-500"
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[14px] font-semibold text-ink-950 sm:text-sm">{title}</h3>
            {badge}
          </div>
          {logos ? <div className="mt-2 flex flex-wrap items-center gap-1.5">{logos}</div> : null}
          {description ? <p className="mt-1.5 text-[14px] leading-relaxed text-ink-400">{description}</p> : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
        <div className="flex items-center gap-2.5">
          <span className="whitespace-nowrap font-data text-[14px] text-ink-800">{price}</span>
          {trailing}
          {mark}
        </div>
      </div>
    </div>
  );
}

export function PaymentMethodPicker({
  basePrice,
  paymentMethod,
  onSelect,
  expandedCategory,
  onExpand,
}: PaymentMethodPickerProps) {
  const { t } = useTranslation();
  const qrisTotal = formatIDR(basePrice + getPaymentMethodFee(basePrice, "qris"));
  const ewalletTotal = formatIDR(basePrice + getPaymentMethodFee(basePrice, "gopay"));
  const vaTotal = formatIDR(basePrice + getPaymentMethodFee(basePrice, "bni_va"));
  const waTotal = formatIDR(basePrice);
  const isEwalletActive = isEwalletMethod(paymentMethod);
  const isVaActive = isVaMethod(paymentMethod);
  const ewalletOpen = isEwalletActive || expandedCategory === "ewallet";
  const vaOpen = isVaActive || expandedCategory === "va";

  return (
    <SectionCard>
      <div className="flex items-start justify-between gap-4">
        <SectionHeading step="03" title={t("order.step3Title")} />
        <span className="eyebrow shrink-0 pt-1 text-ink-400">{t("order.oncePayment")}</span>
      </div>
      <p className="-mt-2 text-[14px] leading-relaxed text-ink-400">{t("order.step3Desc")}</p>

      <div className="space-y-2.5" role="radiogroup" aria-label={t("order.step3Title")}>
        <CategoryRow
          active={paymentMethod === "qris"}
          onClick={() => {
            onSelect("qris");
            onExpand("qris");
          }}
          icon={<QrCode size={17} />}
          title={t("order.methodQrisTitle")}
          logos={<LogoPill src={MIDTRANS_LOGOS.qris} alt="QRIS" />}
          description={t("order.methodQrisSubtitle")}
          price={qrisTotal}
          mark={<SelectMark selected={paymentMethod === "qris"} />}
        />

        <div className={`border ${ewalletOpen ? "border-ink-950 bg-cream-100" : "border-ink-900/12 bg-white"}`}>
          <CategoryRow
            active={isEwalletActive}
            onClick={() => onExpand(expandedCategory === "ewallet" ? null : "ewallet")}
            icon={<Smartphone size={17} />}
            title={t("order.methodEwalletTitle")}
            logos={<LogoPill src={MIDTRANS_LOGOS.gopay} alt="GoPay" className="h-3" />}
            description={t("order.methodEwalletSubtitle")}
            price={<span className="text-ink-400">{t("order.from")} {ewalletTotal}</span>}
            trailing={
              <ChevronDown
                size={16}
                className={`text-ink-400 transition-transform ${ewalletOpen ? "rotate-180" : ""}`}
              />
            }
            expanded={ewalletOpen}
          />
          {ewalletOpen && (
            <div className="space-y-2 border-t border-ink-900/12 bg-white p-3 sm:p-4">
              {EWALLET_OPTIONS.map((option) => {
                const active = paymentMethod === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      onSelect(option.id);
                      onExpand("ewallet");
                    }}
                    aria-pressed={active}
                    className={`flex w-full items-center justify-between gap-3 border p-2.5 text-left transition-colors ${
                      active ? "border-ink-950 bg-cream-100" : "border-ink-900/10 bg-white hover:border-ink-900/25"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className={option.logoBoxClass}>
                        {option.logos.map((logo) => (
                          <img key={logo.alt} src={logo.src} alt={logo.alt} className={logo.className} />
                        ))}
                      </span>
                      <span className="truncate text-[14px] font-medium text-ink-700">{option.name}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2.5">
                      <span className="font-data text-[14px] text-ink-800">
                        {formatIDR(basePrice + getPaymentMethodFee(basePrice, option.id))}
                      </span>
                      <SelectMark selected={active} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className={`border ${vaOpen ? "border-ink-950 bg-cream-100" : "border-ink-900/12 bg-white"}`}>
          <CategoryRow
            active={isVaActive}
            onClick={() => onExpand(expandedCategory === "va" ? null : "va")}
            icon={<Building2 size={17} />}
            title={t("order.methodVaTitle")}
            logos={
              <>
                <LogoPill src={MIDTRANS_LOGOS.mandiri} alt="Mandiri" className="h-3" />
                <LogoPill src={MIDTRANS_LOGOS.bni} alt="BNI" className="h-2.5" />
                <LogoPill src={MIDTRANS_LOGOS.bri} alt="BRI" className="h-3" />
              </>
            }
            description={t("order.methodVaSubtitle")}
            price={<span className="text-ink-400">{t("order.from")} {vaTotal}</span>}
            trailing={
              <ChevronDown
                size={16}
                className={`text-ink-400 transition-transform ${vaOpen ? "rotate-180" : ""}`}
              />
            }
            expanded={vaOpen}
          />
          {vaOpen && (
            <div className="grid grid-cols-2 gap-2 border-t border-ink-900/12 bg-white p-3 sm:grid-cols-3 sm:p-4">
              {VA_BANKS.map((bank) => {
                const active = paymentMethod === bank.id;
                return (
                  <button
                    key={bank.id}
                    type="button"
                    title={bank.name}
                    aria-pressed={active}
                    onClick={() => {
                      onSelect(bank.id);
                      onExpand("va");
                    }}
                    className={`flex min-h-[58px] items-center justify-center border p-2.5 transition-colors ${
                      active
                        ? "border-ink-950 bg-cream-100"
                        : "border-ink-900/10 bg-white hover:border-ink-900/30 hover:bg-cream-50"
                    }`}
                  >
                    {bank.logo ? (
                      <img src={bank.logo} alt={bank.name} className="h-5 w-auto max-w-full object-contain sm:h-6" />
                    ) : (
                      <span className="text-[14px] font-semibold text-ink-700">{bank.name}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <CategoryRow
          active={paymentMethod === "whatsapp"}
          green
          onClick={() => {
            onSelect("whatsapp");
            onExpand("whatsapp");
          }}
          icon={<FaWhatsapp size={17} />}
          title={t("order.methodWaTitle")}
          badge={
            <span className="border border-whatsapp-600/25 bg-success-600/10 px-1.5 py-0.5 font-data text-[14px] uppercase tracking-[0.06em] text-success-700">
              {t("order.feeFreeBadge")}
            </span>
          }
          description={t("order.methodWaSubtitle")}
          price={waTotal}
          mark={<SelectMark selected={paymentMethod === "whatsapp"} green />}
        />
      </div>

      <p className="text-[14px] leading-relaxed text-ink-400">
        {t("order.autoMethodDesc")}
      </p>
    </SectionCard>
  );
}
