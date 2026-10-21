import { Languages } from "lucide-react";
import { useTranslation, type Language } from "../../i18n";
import { cn } from "../../lib/cn";

interface LanguageToggleButtonProps {
  variant?: "dark" | "light";
  className?: string;
}

export default function LanguageToggleButton({
  variant = "dark",
  className,
}: LanguageToggleButtonProps) {
  const { language, toggleLanguage } = useTranslation();
  const targetLanguage: Language = language === "id" ? "en" : "id";
  const label =
    language === "id" ? "Ganti bahasa ke English" : "Switch language to Bahasa Indonesia";
  const onDark = variant === "dark";

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={label}
      title={label}
      lang={language}
      className={cn(
        "inline-flex min-h-10 min-w-10 items-center justify-center gap-1.5 border px-2.5 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peach-300",
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
