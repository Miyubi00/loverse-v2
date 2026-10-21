import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, ArrowUpRight, CheckCircle, Clock, CreditCard, Home, RefreshCcw, ShieldCheck, XCircle } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import { ADMIN_WHATSAPP } from "../lib/constants";
import { PaymentStatusSkeleton } from "../components/ui/SkeletonLoaders";
import { useTranslation } from "../i18n";
import Button from "../components/ui/Button";

interface PaymentStatusResponse {
  found: boolean;
  payment_status: string;
  order_id: string | null;
  groom_name: string;
  bride_name: string;
  slug: string;
  email: string | null;
  whatsapp?: string | null;
  wedding_date?: string | null;
  template_slug?: string | null;
  template_name?: string | null;
  price?: number | null;
  payment_method?: string | null;
  snap_token: string | null;
  pin_code: string | null;
  created_at: string | null;
}

const formatIDR = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

function OrderSummary({ order }: { order: PaymentStatusResponse }) {
  const { t } = useTranslation();
  const total = typeof order.price === "number" && order.price > 0 ? order.price : 0;
  const rows: Array<[string, string]> = [
    [t("paymentStatus.sumCouple"), `${order.groom_name} & ${order.bride_name}`],
    [t("paymentStatus.sumTemplate"), order.template_name || "Undangan Digital"],
    [t("paymentStatus.sumMethod"), order.payment_method || "QRIS"],
  ];

  return (
    <div className="border border-ink-900/12 bg-cream-50">
      <dl className="divide-y divide-ink-900/10 text-[11px]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 px-4 py-2.5">
            <dt className="shrink-0 text-ink-400">{label}</dt>
            <dd className="truncate text-right font-medium text-ink-850">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex items-end justify-between gap-4 border-t border-ink-900/10 bg-ink-950 px-4 py-4">
        <dt className="text-[10px] font-medium text-cream-100/55">{t("paymentStatus.sumTotal")}</dt>
        <dd className="font-display text-2xl leading-none tracking-[-0.04em] text-peach-200">{formatIDR(total)}</dd>
      </div>
      {order.order_id ? (
        <p className="select-all border-t border-dashed border-ink-900/15 px-4 py-2.5 text-center font-data text-[9px] tracking-[0.08em] text-ink-400">
          {order.order_id}
        </p>
      ) : null}
    </div>
  );
}

type Tone = "success" | "pending" | "failed" | "neutral" | "manual";

const TONE = {
  success: {
    icon: "border-success-600/25 bg-success-600/10 text-success-700",
    ring: "border-success-600/20",
    accent: "text-success-700",
    dot: "bg-success-600",
  },
  pending: {
    icon: "border-gold-600/25 bg-gold-500/12 text-gold-600",
    ring: "border-gold-600/20",
    accent: "text-gold-600",
    dot: "bg-gold-500",
  },
  failed: {
    icon: "border-danger-600/20 bg-danger-600/8 text-danger-700",
    ring: "border-danger-600/15",
    accent: "text-danger-700",
    dot: "bg-danger-600",
  },
  neutral: {
    icon: "border-ink-900/15 bg-cream-200 text-ink-500",
    ring: "border-ink-900/10",
    accent: "text-ink-500",
    dot: "bg-ink-400",
  },
  manual: {
    icon: "border-success-600/25 bg-success-600/10 text-success-700",
    ring: "border-success-600/20",
    accent: "text-success-700",
    dot: "bg-success-600",
  },
} as const;

function StatusShell({
  tone,
  icon,
  eyebrow,
  title,
  description,
  children,
}: {
  tone: Tone;
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const styles = TONE[tone];

  return (
    <div className="relative min-h-[calc(100svh-68px)] w-full max-w-full overflow-hidden bg-cream-100">
      <div
        className={`pointer-events-none absolute left-1/2 top-24 h-[440px] w-[440px] -translate-x-1/2 rounded-full border ${styles.ring}`}
        aria-hidden="true"
      />
      <div
        className={`pointer-events-none absolute left-1/2 top-24 h-[300px] w-[300px] -translate-x-1/2 rounded-full border ${styles.ring}`}
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-1.5 font-data text-[9px] uppercase tracking-[0.14em] text-ink-400 transition-colors hover:text-ink-900">
            <Home className="h-3.5 w-3.5" /> LoVerse
          </Link>
          <Link to="/contact" className="inline-flex items-center gap-1 font-data text-[9px] uppercase tracking-[0.14em] text-ink-400 transition-colors hover:text-ember-600">
            {t("contact.title")} <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-12 text-center">
          <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border ${styles.icon}`}>
            {icon}
          </div>
          <p className={`eyebrow mt-6 ${styles.accent}`}>{eyebrow}</p>
          <h1 className="mx-auto mt-3 max-w-[16ch] font-display text-[clamp(2.2rem,5vw,3.4rem)] leading-[0.98] tracking-[-0.045em] text-ink-950">
            {title}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[12px] leading-relaxed text-ink-500">{description}</p>
        </div>

        <div className="mt-8">{children}</div>

        <div className="mt-7 flex items-center justify-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
          <p className="font-data text-[9px] uppercase tracking-[0.12em] text-ink-400">
            LoVerse · Midtrans · WhatsApp
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentStatus() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<PaymentStatusResponse | null>(null);

  const orderId = searchParams.get("order_id");
  const isManualWhatsApp = !orderId;

  const fetchOrderStatus = useCallback(
    async (showLoader = false) => {
      if (!orderId) {
        if (showLoader) setLoading(false);
        return;
      }
      if (showLoader) setLoading(true);
      const { data, error } = await supabase.functions.invoke("payment-status", { body: { order_token: orderId } });
      if (!error && data?.found) {
        setOrder(data as PaymentStatusResponse);
      } else if (error) {
        console.error("[payment-status] gagal:", error.message);
      }
      if (showLoader) setLoading(false);
    },
    [orderId],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchOrderStatus(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchOrderStatus]);

  const paymentStatus = order?.payment_status;
  const isTerminal = !!paymentStatus && paymentStatus !== "pending";

  useEffect(() => {
    if (isManualWhatsApp || !orderId || isTerminal) return;
    const BASE_MS = 4000;
    const CAP_MS = 60000;
    let delay = BASE_MS;
    let timerId: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    const poll = () => {
      if (cancelled) return;
      if (document.visibilityState === "visible") void fetchOrderStatus();
      delay = Math.min(delay * 2, CAP_MS);
      timerId = setTimeout(poll, delay);
    };
    timerId = setTimeout(poll, delay);
    return () => {
      cancelled = true;
      if (timerId !== undefined) clearTimeout(timerId);
    };
  }, [fetchOrderStatus, isManualWhatsApp, orderId, isTerminal]);

  const handlePayAgain = () => {
    if (!order || !order.snap_token) {
      navigate("/order");
      return;
    }
    window.snap?.pay?.(order.snap_token, {
      onSuccess: function () {
        navigate(`/payment-status?order_id=${orderId}`);
        fetchOrderStatus();
      },
      onPending: function () {
        navigate(`/payment-status?order_id=${orderId}`);
        fetchOrderStatus();
      },
      onError: function () {
        fetchOrderStatus();
      },
      onClose: function () {
        navigate(`/payment-status?order_id=${orderId}`);
      },
    });
  };

  if (loading) return <PaymentStatusSkeleton />;

  if (isManualWhatsApp) {
    return (
      <StatusShell
        tone="manual"
        icon={<FaWhatsapp className="h-6 w-6" />}
        eyebrow="WhatsApp / Manual"
        title={t("paymentStatus.manualTitle")}
        description={t("paymentStatus.manualDesc")}
      >
        <div className="border border-ink-900/12 bg-white p-5 sm:p-6">
          <p className="text-[11px] leading-relaxed text-ink-500">{t("paymentStatus.manualNote")}</p>
          <div className="mt-5 flex flex-col gap-2.5">
            <a
              href={`https://wa.me/${ADMIN_WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[2px] bg-success-700 px-4 text-sm font-semibold text-cream-50 transition-colors hover:bg-success-600"
            >
              <FaWhatsapp className="h-5 w-5" /> {t("paymentStatus.btnWhatsapp")}
            </a>
            <Button variant="secondary" className="w-full" onClick={() => navigate("/")}>
              <Home className="h-4 w-4" /> {t("paymentStatus.btnHome")}
            </Button>
          </div>
        </div>
      </StatusShell>
    );
  }

  if (!order || !order.found) {
    return (
      <StatusShell
        tone="neutral"
        icon={<XCircle className="h-6 w-6" />}
        eyebrow={t("paymentStatus.statusNotFound")}
        title={t("paymentStatus.notFoundTitle")}
        description={t("paymentStatus.notFoundDesc")}
      >
        <div className="border border-ink-900/12 bg-white p-5 text-center sm:p-6">
          <Button variant="primary" className="w-full" onClick={() => navigate("/")}>
            <Home className="h-4 w-4" /> {t("paymentStatus.btnHome")}
          </Button>
        </div>
      </StatusShell>
    );
  }

  const isSuccess = order.payment_status === "success";
  const isPending = order.payment_status === "pending";
  const isFailed = ["failed", "expired", "deny", "cancel"].includes(order.payment_status);
  const showPending = isPending;
  const showFailed = isFailed;

  if (isSuccess) {
    return (
      <StatusShell
        tone="success"
        icon={<CheckCircle className="h-6 w-6" />}
        eyebrow={t("paymentStatus.statusPaid")}
        title={t("paymentStatus.successTitle")}
        description={t("paymentStatus.successDesc", { groom: order.groom_name, bride: order.bride_name })}
      >
        <div className="overflow-hidden border border-ink-900/15 bg-white">
          <div className="p-4 sm:p-5">
            <OrderSummary order={order} />
            <div className="mt-4 flex items-start gap-2.5 border border-dashed border-ember-500/35 bg-cream-50 p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ember-600" />
              <p className="text-[11px] leading-relaxed text-ink-500">
                {t("paymentStatus.pinNote", { email: order.email || "email" })}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-ink-900/10 p-4 sm:flex-row sm:p-5">
            <Button variant="primary" className="flex-1" onClick={() => navigate("/login")}>
              {t("paymentStatus.btnDashboard")} <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => navigate(`/wedding/${order.slug}`)}>
              {t("paymentStatus.btnViewInvitation")}
            </Button>
          </div>
        </div>
      </StatusShell>
    );
  }

  if (showPending) {
    return (
      <StatusShell
        tone="pending"
        icon={<Clock className="h-6 w-6" />}
        eyebrow={t("paymentStatus.statusPending")}
        title={t("paymentStatus.pendingTitle")}
        description={t("paymentStatus.pendingDesc")}
      >
        <div className="overflow-hidden border border-ink-900/15 bg-white">
          <div className="p-4 sm:p-5">
            <OrderSummary order={order} />
            <p className="mt-3 flex items-center gap-2 text-[10px] text-ink-400">
              <Clock className="h-3.5 w-3.5" /> {t("paymentStatus.autoRefreshNote")}
            </p>
          </div>
          <div className="flex flex-col gap-2 border-t border-ink-900/10 p-4 sm:flex-row sm:p-5">
            <Button variant="peach" className="flex-1" onClick={handlePayAgain}>
              <CreditCard className="h-4 w-4" /> {t("paymentStatus.btnPayNow")}
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => fetchOrderStatus()}>
              <RefreshCcw className="h-4 w-4" /> {t("paymentStatus.btnCheckStatus")}
            </Button>
          </div>
        </div>
      </StatusShell>
    );
  }

  if (showFailed) {
    return (
      <StatusShell
        tone="failed"
        icon={<XCircle className="h-6 w-6" />}
        eyebrow={t("paymentStatus.statusFailed")}
        title={t("paymentStatus.failedTitle")}
        description={t("paymentStatus.failedDesc")}
      >
        <div className="overflow-hidden border border-ink-900/15 bg-white">
          <div className="p-4 sm:p-5">
            <OrderSummary order={order} />
          </div>
          <div className="flex flex-col gap-2 border-t border-ink-900/10 p-4 sm:flex-row sm:p-5">
            <Button variant="primary" className="flex-1" onClick={() => navigate("/order")}>
              {t("paymentStatus.btnNewOrder")}
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => navigate("/")}>
              <Home className="h-4 w-4" /> {t("paymentStatus.btnHome")}
            </Button>
          </div>
        </div>
      </StatusShell>
    );
  }

  return null;
}
