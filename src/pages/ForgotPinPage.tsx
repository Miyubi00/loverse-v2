import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useToast } from "../components/GlobalToast";
import { ArrowLeft, Calendar, HeartHandshake, Mail, Send } from "lucide-react";
import { useTranslation } from "../i18n";
import { EMAIL_RE } from "../components/order/constants";
import TurnstileWidget, { type TurnstileWidgetRef } from "../components/ui/TurnstileWidget";
import AuthShell from "../components/shared/AuthShell";
import Button from "../components/ui/Button";

async function extractInvokeError(err: unknown, fallback: string): Promise<string> {
  try {
    const ctx = (err as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      const body = (await ctx.json()) as { error?: string };
      if (body?.error) return body.error;
    }
  } catch {
    /* fallback */
  }
  return fallback;
}

const inputClass =
  "w-full border-0 border-b border-ink-900/20 bg-transparent py-3 pl-7 pr-3 text-[15px] text-ink-950 outline-none transition-colors placeholder:text-ink-300 focus:border-ink-950";

export default function ForgotPinPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetRef>(null);
  const [email, setEmail] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const coolingDown = cooldown > 0;

  useEffect(() => {
    if (!coolingDown) return;
    const id = setInterval(() => setCooldown((value) => (value > 0 ? value - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [coolingDown]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const emailTrim = email.trim().toLowerCase();
    if (!emailTrim) return toast.warning(t("forgotPin.needEmail"));
    if (!EMAIL_RE.test(emailTrim)) return toast.warning(t("validation.emailInvalid"));
    if (!weddingDate) return toast.warning(t("forgotPin.needDate"));
    if (!captchaToken) return toast.warning(t("common.captchaRequired"));

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("resend-pin", {
        body: { email: emailTrim, wedding_date: weddingDate, captcha_token: captchaToken },
      });
      if (error) {
        console.error("Resend PIN Error:", error);
        throw new Error(await extractInvokeError(error, t("toast.systemError")));
      }
      const msg = (data as { message?: string } | null)?.message;
      toast.success(msg || t("forgotPin.sent"));
      setCooldown(60);
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
      eyebrow="Pemulihan akses"
      title={t("forgotPin.title")}
      description={t("forgotPin.subtitle")}
      footnote={
        <div className="space-y-3">
          <p>{t("forgotPin.note")}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-ink-700 hover:text-ink-950">
              <ArrowLeft className="h-3.5 w-3.5" /> {t("forgotPin.backToLogin")}
            </Link>
            <Link to="/contact" className="inline-flex items-center gap-1.5 font-semibold text-ink-700 hover:text-ink-950">
              <HeartHandshake className="h-3.5 w-3.5" /> {t("forgotPin.contactAdmin")}
            </Link>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="forgot-email" className="eyebrow text-ink-500">{t("forgotPin.emailLabel")}</label>
          <div className="relative mt-2">
            <Mail className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              id="forgot-email"
              required
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("forgotPin.emailPlaceholder")}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="forgot-date" className="eyebrow text-ink-500">{t("forgotPin.dateLabel")}</label>
          <div className="relative mt-2">
            <Calendar className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              id="forgot-date"
              required
              name="wedding_date"
              type="date"
              value={weddingDate}
              onChange={(event) => setWeddingDate(event.target.value)}
              className={inputClass}
            />
          </div>
          <p className="mt-2 text-[14px] text-ink-400">{t("forgotPin.dateHelp")}</p>
        </div>

        <TurnstileWidget
          ref={turnstileRef}
          onSuccess={(token) => setCaptchaToken(token)}
          onExpire={() => setCaptchaToken(null)}
          onError={() => setCaptchaToken(null)}
        />

        <Button type="submit" size="lg" disabled={loading || !captchaToken || coolingDown} loading={loading} className="w-full">
          {!loading && <Send className="h-4 w-4" />}
          {loading ? t("forgotPin.btnSubmitting") : coolingDown ? t("forgotPin.cooldown", { s: cooldown }) : t("forgotPin.btnSubmit")}
        </Button>
      </form>
    </AuthShell>
  );
}
