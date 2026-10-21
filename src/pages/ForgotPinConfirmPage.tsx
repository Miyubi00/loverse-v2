import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { ArrowUpRight, Home, KeyRound, LogIn } from "lucide-react";
import { useTranslation } from "../i18n";
import { ForgotPinConfirmSkeleton } from "../components/ui/SkeletonLoaders";
import { buttonClass } from "../components/ui/buttonStyles";

type ConfirmStatus = "loading" | "confirmed" | "canceled" | "invalid";

export default function ForgotPinConfirmPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const [status, setStatus] = useState<ConfirmStatus>("loading");
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;
    const run = async () => {
      const token = params.get("token") ?? "";
      const action = params.get("action") === "cancel" ? "cancel" : "confirm";
      if (!token) {
        setStatus("invalid");
        return;
      }
      try {
        const { data, error } = await supabase.functions.invoke("resend-pin", { body: { token, action } });
        if (error) {
          console.error("Confirm PIN Error:", error);
          setStatus("invalid");
          return;
        }
        const result = (data as { status?: string } | null)?.status;
        if (result === "confirmed") setStatus("confirmed");
        else if (result === "canceled") setStatus("canceled");
        else setStatus("invalid");
      } catch (err) {
        console.error("Confirm PIN Exception:", err);
        setStatus("invalid");
      }
    };
    void run();
  }, [params]);

  if (status === "loading") return <ForgotPinConfirmSkeleton />;

  const copy = {
    confirmed: { title: t("forgotPinConfirm.successTitle"), desc: t("forgotPinConfirm.successDesc") },
    canceled: { title: t("forgotPinConfirm.declinedTitle"), desc: t("forgotPinConfirm.declinedDesc") },
    invalid: { title: t("forgotPinConfirm.errorTitle"), desc: t("forgotPinConfirm.errorDesc") },
  }[status];

  return (
    <div className="relative flex min-h-[calc(100svh-68px)] items-center overflow-hidden bg-cream-100 px-4 py-16 sm:px-7">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink-900/10" aria-hidden="true" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink-900/10" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-lg border border-ink-900/15 bg-cream-50 p-7 shadow-lift sm:p-10">
        <span className={`flex h-11 w-11 items-center justify-center rounded-[2px] ${status === "confirmed" ? "bg-success-600/10 text-success-700" : status === "canceled" ? "bg-cream-200 text-ink-500" : "bg-danger-600/10 text-danger-700"}`}>
          <KeyRound className="h-5 w-5" />
        </span>
        <p className="eyebrow mt-6 text-ember-600">
          {status === "confirmed" ? "Berhasil" : status === "canceled" ? "Dibatalkan" : "Tidak valid"}
        </p>
        <h1 className="mt-3 font-display text-[clamp(2rem,4vw,2.8rem)] leading-[1] tracking-[-0.04em] text-ink-950">{copy.title}</h1>
        <p className="mt-3 text-[13px] leading-relaxed text-ink-500">{copy.desc}</p>

        <div className="mt-7 flex flex-col gap-2 sm:flex-row">
          {status === "confirmed" && (
            <Link to="/login" className={buttonClass("primary", "md", "w-full")}>
              <LogIn className="h-4 w-4" /> {t("forgotPinConfirm.btnLogin")}
            </Link>
          )}
          {status === "canceled" && (
            <Link to="/" className={buttonClass("primary", "md", "w-full")}>
              <Home className="h-4 w-4" /> {t("forgotPinConfirm.btnBack")}
            </Link>
          )}
          {status === "invalid" && (
            <>
              <Link to="/forgot-pin" className={buttonClass("primary", "md", "flex-1")}>
                {t("forgotPinConfirm.btnRetry")} <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className={buttonClass("secondary", "md", "flex-1")}>
                <LogIn className="h-4 w-4" /> {t("forgotPinConfirm.btnLogin")}
              </Link>
            </>
          )}
        </div>

        {status !== "confirmed" && (
          <Link to="/contact" className="mt-5 inline-flex items-center gap-1.5 font-data text-[9px] uppercase tracking-[0.12em] text-ink-400 hover:text-ember-600">
            {t("forgotPin.contactAdmin")} <ArrowUpRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
