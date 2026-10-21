import { Building2, QrCode, Smartphone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import type { RefObject } from "react";
import TurnstileWidget, { type TurnstileWidgetRef } from "../ui/TurnstileWidget";
import { useTranslation } from "../../i18n";
import { PAYMENT_BUTTON_LABEL_KEYS, type PaymentMethodType } from "./constants";

const PAY_BUTTON_BASE =
  "w-full min-h-11 px-3 py-3.5 sm:py-4 rounded-2xl font-semibold text-sm sm:text-base transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/40";

interface OrderPaymentCaptchaProps {
  setCaptchaToken: (token: string | null) => void;
  turnstileRef: RefObject<TurnstileWidgetRef | null>;
}

export function OrderPaymentCaptcha({ setCaptchaToken, turnstileRef }: OrderPaymentCaptchaProps) {
  return (
    <TurnstileWidget
      ref={turnstileRef}
      onSuccess={(token) => setCaptchaToken(token)}
      onExpire={() => setCaptchaToken(null)}
      onError={() => setCaptchaToken(null)}
    />
  );
}

interface OrderPayButtonProps {
  paymentMethod: PaymentMethodType | null;
  captchaToken: string | null;
  loadingWA: boolean;
  loadingMidtrans: boolean;
  onMidtransCheckout: () => void;
  onWhatsappCheckout: () => void;
}

export function OrderPayButton({
  paymentMethod,
  captchaToken,
  loadingWA,
  loadingMidtrans,
  onMidtransCheckout,
  onWhatsappCheckout,
}: OrderPayButtonProps) {
  const { t } = useTranslation();

  if (paymentMethod === null) {
    return (
      <button
        type="button"
        disabled
        className={`${PAY_BUTTON_BASE} cursor-not-allowed border border-ink-900/10 bg-cream-100 text-ink-300`}
      >
        <Smartphone className="h-5 w-5 shrink-0" />
        <span className="truncate">{t("order.selectPaymentMethod")}</span>
      </button>
    );
  }

  if (paymentMethod === "whatsapp") {
    const disabled = loadingWA || !captchaToken;
    return (
      <button
        type="button"
        onClick={onWhatsappCheckout}
        disabled={disabled}
        className={`${PAY_BUTTON_BASE} ${
          disabled
            ? "cursor-not-allowed border border-ink-900/10 bg-cream-100 text-ink-300"
            : "bg-whatsapp-600 text-white shadow-whatsapp hover:bg-whatsapp-700 active:translate-y-px"
        }`}
      >
        {loadingWA ? (
          t("order.payWhatsappLoading")
        ) : (
          <>
            <FaWhatsapp className="h-5 w-5 shrink-0" />
            <span className="truncate">{t("order.btnPayWa")}</span>
          </>
        )}
      </button>
    );
  }

  const disabled = loadingMidtrans || !captchaToken;

  return (
    <button
      type="button"
      onClick={onMidtransCheckout}
      disabled={disabled}
      className={`${PAY_BUTTON_BASE} ${
        disabled
          ? "cursor-not-allowed border border-ink-900/10 bg-cream-100 text-ink-300"
          : "bg-ink-950 text-cream-50 shadow-button hover:bg-ember-600 active:translate-y-px"
      }`}
    >
      {loadingMidtrans ? (
        t("order.payMidtransLoading")
      ) : (
        <>
          {paymentMethod.endsWith("_va") || paymentMethod === "echannel" ? (
            <Building2 className="h-5 w-5 shrink-0" />
          ) : paymentMethod === "qris" ? (
            <QrCode className="h-5 w-5 shrink-0" />
          ) : (
            <Smartphone className="h-5 w-5 shrink-0" />
          )}
          <span className="truncate">{t(PAYMENT_BUTTON_LABEL_KEYS[paymentMethod])}</span>
        </>
      )}
    </button>
  );
}
