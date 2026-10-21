import { useState, useRef, useEffect, type FormEvent } from "react";
import { supabase } from "../../lib/supabaseClient";
import { captureError } from "../../lib/monitoring";
import type { ToastApi } from "../GlobalToast";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { useTranslation } from "../../i18n";
import LanguageSwitcher from "../shared/LanguageSwitcher";
import Button from "../ui/Button";
import { BrandPlate, Wordmark } from "../ui/Brand";
import TurnstileWidget, { type TurnstileWidgetRef } from "../ui/TurnstileWidget";

interface AdminLoginProps {
  toast: ToastApi;
}

/* Backoff progresif: setelah 3x gagal, tombol terkunci 30s lalu
   bertambah 30s per kegagalan berikutnya (maks 5 menit). */
const LOCK_THRESHOLD = 3;
const LOCK_BASE_SECONDS = 30;
const MAX_LOCK_SECONDS = 300;

const inputClass =
  "h-12 w-full border border-ink-900/15 bg-cream-50 pl-10 pr-10 text-[13px] text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-ember-500 focus:ring-2 focus:ring-ember-500/15 disabled:opacity-60";

export default function AdminLogin({ toast }: AdminLoginProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockSeconds, setLockSeconds] = useState(0);
  const turnstileRef = useRef<TurnstileWidgetRef>(null);

  useEffect(() => {
    if (lockSeconds <= 0) return;
    const timer = window.setInterval(() => setLockSeconds((s) => s - 1), 1000);
    return () => window.clearInterval(timer);
  }, [lockSeconds]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (lockSeconds > 0) return;

    if (!captchaToken) {
      toast.warning(t("common.captchaRequired"));
      return;
    }

    setLoginLoading(true);

    /* captchaToken diverifikasi server-side oleh Supabase Auth.
       WAJIB mengaktifkan Captcha protection di Dashboard Supabase
       (Authentication -> Security -> Captcha -> Cloudflare Turnstile)
       dengan site key yang sama; tanpa itu login akan ditolak. */
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken },
    });

    setLoginLoading(false);

    if (error) {
      setCaptchaToken(null);
      turnstileRef.current?.reset();
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      if (attempts >= LOCK_THRESHOLD) {
        setLockSeconds(
          Math.min(
            LOCK_BASE_SECONDS * (attempts - LOCK_THRESHOLD + 1),
            MAX_LOCK_SECONDS,
          ),
        );
      }
      captureError(new Error(error.message), { attempts });
      toast.error(t("toast.loginFailed", { error: error.message }));
    } else {
      setFailedAttempts(0);
      toast.success(t("toast.adminWelcome"));
    }
  };

  return (
    <div className="min-h-dvh bg-cream-100">
      <div className="mx-auto grid min-h-dvh w-full max-w-[1480px] lg:grid-cols-[1.05fr_.95fr]">
        <aside className="grain grain-light relative hidden overflow-hidden bg-ink-950 p-10 text-cream-100 lg:flex lg:flex-col lg:justify-between lg:p-14">
          <div className="relative z-[2]">
            <Wordmark imageClassName="h-9" />
            <p className="eyebrow mt-16 text-peach-300/75">Control room / LoVerse</p>
            <p className="mt-6 max-w-[10ch] font-display text-[clamp(3rem,5vw,5rem)] leading-[0.92] tracking-[-0.055em] text-cream-50">
              Kawal setiap <span className="italic text-peach-300">undangan.</span>
            </p>
            <p className="mt-7 max-w-sm text-[13px] leading-relaxed text-cream-100/45">
              {t("admin.loginSubtitle")}
            </p>
          </div>

          <div className="relative z-[2] grid grid-cols-3 gap-4 border-t border-cream-100/15 pt-6">
            {[
              { label: "Orders", value: "24/7" },
              { label: "RSVP", value: "Live" },
              { label: "Access", value: "Secure" },
            ].map((item) => (
              <div key={item.label}>
                <p className="font-display text-xl tracking-[-0.04em] text-cream-50">{item.value}</p>
                <p className="mt-1 font-data text-[8px] uppercase tracking-[0.16em] text-cream-100/30">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute -right-24 top-1/4 h-[460px] w-[460px] rounded-full border border-cream-100/10" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-2 top-1/4 h-[280px] w-[280px] rounded-full border border-peach-300/15" aria-hidden="true" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-1/2 w-full glow-ember" aria-hidden="true" />
        </aside>

        <main className="relative flex items-center px-4 py-12 sm:px-8 lg:px-14">
          <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
            <LanguageSwitcher variant="light" />
          </div>

          <div className="mx-auto w-full max-w-[420px]">
            <div className="mb-10 lg:hidden">
              <BrandPlate />
            </div>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center border border-ink-900/12 bg-cream-50 text-ember-600">
                <ShieldCheck className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <span className="font-data text-[9px] uppercase tracking-[0.2em] text-ink-400">
                {t("admin.title")}
              </span>
            </div>

            <h1 className="mt-8 font-display text-[clamp(2.3rem,4.4vw,3.4rem)] leading-[0.96] tracking-[-0.05em] text-ink-950">
              {t("admin.loginTitle")}
            </h1>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-500">{t("admin.loginSubtitle")}</p>

            <form onSubmit={handleLogin} className="mt-8 space-y-4">
              <div>
                <label htmlFor="admin-email" className="font-data text-[8px] uppercase tracking-[0.16em] text-ink-400">
                  {t("admin.loginEmail")}
                </label>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-400">
                    <Mail size={15} />
                  </span>
                  <input
                    id="admin-email"
                    type="email"
                    required
                    disabled={loginLoading}
                    placeholder="admin@loverse.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="admin-password" className="font-data text-[8px] uppercase tracking-[0.16em] text-ink-400">
                  {t("admin.loginPassword")}
                </label>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-400">
                    <Lock size={15} />
                  </span>
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={loginLoading}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-ink-400 transition-colors hover:text-ink-900"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <TurnstileWidget
                ref={turnstileRef}
                onSuccess={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
                onError={() => setCaptchaToken(null)}
              />

              <Button
                type="submit"
                size="lg"
                disabled={loginLoading || !captchaToken || lockSeconds > 0}
                loading={loginLoading}
                className="mt-2 w-full"
              >
                {lockSeconds > 0
                  ? t("admin.loginLocked", { seconds: lockSeconds })
                  : loginLoading
                    ? t("admin.loginBtnLoading")
                    : t("admin.loginBtnSubmit")}
              </Button>
            </form>

            <p className="mt-8 border-t border-ink-900/12 pt-5 text-[10px] leading-relaxed text-ink-400">
              {t("admin.loginFooter")}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
