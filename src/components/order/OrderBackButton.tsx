import { ArrowLeft } from "lucide-react";

interface OrderBackButtonProps {
  onClick: () => void;
  label: string;
  ariaLabel?: string;
  variant?: "inline" | "block";
  className?: string;
}

export function OrderBackButton({
  onClick,
  label,
  ariaLabel,
  variant = "inline",
  className = "",
}: OrderBackButtonProps) {
  const accessibleName = ariaLabel ?? label;

  return (
    <button
      type="button"
      onClick={onClick}
      title={accessibleName}
      aria-label={accessibleName}
      className={`group inline-flex min-h-11 min-w-0 items-center gap-2 border border-ink-900/20 bg-white px-3 text-[12px] font-semibold text-ink-800 transition-colors hover:border-ink-950 hover:bg-cream-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/30 sm:px-4 sm:text-sm ${
        variant === "block" ? "w-full justify-center" : ""
      } ${className}`}
    >
      <ArrowLeft className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
      <span className="truncate">{label}</span>
    </button>
  );
}
