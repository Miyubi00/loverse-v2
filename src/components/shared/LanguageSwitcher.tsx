import { Languages } from "lucide-react";
import { useTranslation, type Language } from "../../i18n";
import { cn } from "../../lib/cn";

interface LanguageSwitcherProps {
  variant?: "header" | "light" | "minimal" | "dark";
  className?: string;
  touchTarget?: boolean;
  mode?: "switch" | "toggle";
}

export default function LanguageSwitcher({
  variant = "header",
  className = "",
  touchTarget = false,
  mode = "switch",
}: LanguageSwitcherProps) {
  const { language, setLanguage, toggleLanguage } = useTranslation();
  const onDark = variant === "header" || variant === "dark";
  const minimal = variant === "minimal";

  const handleSelect = (lang: Language) => setLanguage(lang);

  if (mode === "toggle") {
    const targetLanguage: Language = language === "id" ? "en" : "id";
    const label =
      language === "id" ? "Ganti bahasa ke English" : "Switch language to Bahasa Indonesia";

    return (
      <button
        type="button"
        onClick={toggleLanguage}
        aria-label={label}
        title={label}
        lang={language}
        className={cn(
          "inline-flex min-h-10 min-w-10 items-center justify-center gap-1.5 border px-2.5 transition-colors duration-200",
          onDark
            ? "border-cream-100/25 text-cream-100/80 hover:border-cream-50 hover:text-cream-50"
            : "border-ink-900/15 text-ink-600 hover:border-ink-900/30 hover:text-ink-900",
          className,
        )}
      >
        <Languages size={16} strokeWidth={1.8} aria-hidden="true" />
        <span lang={targetLanguage} className="font-data text-[14px] uppercase tracking-[0.06em]">
          {targetLanguage.toUpperCase()}
        </span>
      </button>
    );
  }

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
