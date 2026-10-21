import { useTranslation, type Language } from "../../i18n";
import { cn } from "../../lib/cn";

interface LanguageSwitcherProps {
  variant?: "header" | "light" | "minimal" | "dark";
  className?: string;
  touchTarget?: boolean;
}

export default function LanguageSwitcher({
  variant = "header",
  className = "",
  touchTarget = false,
}: LanguageSwitcherProps) {
  const { language, setLanguage } = useTranslation();
  const onDark = variant === "header" || variant === "dark";
  const minimal = variant === "minimal";

  const handleSelect = (lang: Language) => setLanguage(lang);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5",
        !minimal && "border p-0.5",
        onDark ? "border-cream-100/20" : "border-ink-900/15",
        className,
      )}
      role="group"
      aria-label="Pilih Bahasa / Select Language"
    >
      {(["id", "en"] as Language[]).map((lang) => {
        const active = language === lang;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => handleSelect(lang)}
            aria-label={lang === "id" ? "Bahasa Indonesia" : "English"}
            aria-pressed={active}
            className={cn(
              "px-2 font-data text-[14px] uppercase tracking-[0.06em] transition-colors duration-200",
              touchTarget ? "min-h-10 min-w-10" : "min-h-8 min-w-8",
              onDark
                ? active
                  ? "bg-peach-300 text-ink-950"
                  : "text-cream-100/55 hover:text-cream-50"
                : active
                  ? "bg-ink-950 text-cream-50"
                  : "text-ink-400 hover:text-ink-900",
              minimal && "border-b border-transparent",
              minimal && active && "border-ink-900 text-ink-900",
            )}
            title={lang === "id" ? "Bahasa Indonesia" : "English"}
          >
            {lang.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
