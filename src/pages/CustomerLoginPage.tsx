import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { supabase } from "../lib/supabaseClient";
import { setCustomerToken } from "../lib/customerClient";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../components/GlobalToast";
import { Eye, EyeOff, Lock, LogIn, Phone } from "lucide-react";
import { useTranslation } from "../i18n";
import { usePageMeta } from "../hooks/usePageMeta";
import TurnstileWidget, { type TurnstileWidgetRef } from "../components/ui/TurnstileWidget";
import AuthShell from "../components/shared/AuthShell";
import Button from "../components/ui/Button";

interface CustomerLoginResponse {
  access_token: string;
  expires_at: number;
  order: { id: string; slug: string; groom_name: string; bride_name: string };
}

async function extractInvokeError(err: unknown): Promise<string> {
  try {
    const ctx = (err as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      const body = (await ctx.json()) as { error?: string };
      if (body?.error) return body.error;
    }
  } catch {
    /* fallback */
  }
  return "Terjadi kesalahan sistem. Pastikan data benar.";
}

const inputClass =
  "w-full border-0 border-b border-ink-900/20 bg-transparent py-3 pl-7 pr-10 text-[15px] text-ink-950 outline-none transition-colors placeholder:text-ink-300 focus:border-ink-950";

export default function DashboardLogin() {
  const { t } = useTranslation();
  usePageMeta(
    "Login Dashboard — LoVerse",
    "Masuk dashboard undangan digital LoVerse dengan No. WhatsApp dan PIN 6 digit untuk mengatur undanganmu.",
  );
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetRef>(null);
  const [showPin, setShowPin] = useState(false);
  const [pinValue, setPinValue] = useState("");

  const handlePinChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (/^\d*$/.test(value) && value.length <= 6) setPinValue(value);
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!captchaToken) {
      toast.warning(t("common.captchaRequired"));
      return;
    }
    setLoading(true);
    const form = event.currentTarget;
    const whatsappInput = form.elements.namedItem("whatsapp") as HTMLInputElement | null;
    let whatsapp = (whatsappInput?.value ?? "").trim();
    whatsapp = whatsapp.replace(/[^0-9+]/g, "");
    if (whatsapp.startsWith("0")) whatsapp = "+62" + whatsapp.substring(1);
    else if (whatsapp.startsWith("62")) whatsapp = "+" + whatsapp;
    else if (!whatsapp.startsWith("+")) whatsapp = "+62" + whatsapp;

    try {
      const { data, error } = await supabase.functions.invoke("customer-login", {
        body: { whatsapp, pin: pinValue, captcha_token: captchaToken },
      });
      if (error) {
        console.error("Login Error:", error);
        throw new Error(await extractInvokeError(error));
      }
      const login = data as CustomerLoginResponse | null;
      if (!login?.access_token || !login.order?.id) throw new Error(t("login.errorNotFound"));
      toast.success(t("login.toastSuccess"));
      setCustomerToken(login.access_token);
      sessionStorage.setItem("active_order_id", login.order.id);
      sessionStorage.removeItem("order_pin");
      setTimeout(() => navigate(`/dashboard/${login.order.id}`), 1000);
    } catch (err) {
      setCaptchaToken(null);
      turnstileRef.current?.reset();
      toast.error(err instanceof Error ? err.message : t("toast.systemError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Dashboard mempelai"
      title={t("login.title")}
      description={t("login.subtitle")}
      footnote={<>{t("login.pinHelp")} <Link to="/forgot-pin" className="ml-1 font-semibold text-ember-600 underline-offset-4 hover:underline">{t("login.resendPinLink")}</Link></>}
    >
      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label htmlFor="customer-whatsapp" className="eyebrow text-ink-500">{t("login.whatsappLabel")}</label>
          <div className="relative mt-2">
            <Phone className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              id="customer-whatsapp"
              type="tel"
              name="whatsapp"
              required
              autoComplete="tel"
              placeholder={t("login.whatsappPlaceholder")}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="customer-pin" className="eyebrow text-ink-500">{t("login.pinLabel")}</label>
          <div className="relative mt-2">
            <Lock className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              id="customer-pin"
              name="pin"
              required
              type={showPin ? "text" : "password"}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder={t("login.pinPlaceholder")}
              value={pinValue}
              onChange={handlePinChange}
              className={`${inputClass} font-data tracking-[0.06em]`}
            />
            <button
              type="button"
              onClick={() => setShowPin((value) => !value)}
              aria-label={showPin ? "Sembunyikan PIN" : "Tampilkan PIN"}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-ink-400 transition-colors hover:text-ink-900"
            >
              {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <TurnstileWidget
          ref={turnstileRef}
          onSuccess={(token) => setCaptchaToken(token)}
          onExpire={() => setCaptchaToken(null)}
          onError={() => setCaptchaToken(null)}
        />

        <Button type="submit" size="lg" disabled={loading || !captchaToken} loading={loading} className="w-full">
          {!loading && <LogIn className="h-4 w-4" />}
          {loading ? t("login.btnSubmitting") : t("login.btnSubmit")}
        </Button>
      </form>
    </AuthShell>
  );
}
