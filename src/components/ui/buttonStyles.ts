import { cn } from "../../lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "peach" | "outlineLight";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-ink-950 text-cream-50 border border-ink-950 hover:bg-ember-600 hover:border-ember-600 shadow-button",
  secondary:
    "bg-transparent text-ink-900 border border-ink-900/25 hover:border-ink-900 hover:bg-cream-50",
  ghost:
    "bg-transparent text-ink-700 border border-transparent hover:bg-ink-900/[0.06] hover:text-ink-950",
  danger:
    "bg-danger-600 text-white border border-danger-600 hover:bg-danger-700 hover:border-danger-700",
  peach:
    "bg-peach-300 text-ink-950 border border-peach-300 hover:bg-peach-400 hover:border-peach-400 shadow-accent",
  outlineLight:
    "bg-transparent text-cream-50 border border-cream-100/25 hover:border-cream-100 hover:bg-cream-50 hover:text-ink-950",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3.5 text-[12px] gap-1.5",
  md: "min-h-11 px-5 text-[13px] gap-2",
  lg: "min-h-13 px-6 text-[14px] gap-2.5",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(
    "inline-flex items-center justify-center rounded-[3px] font-sans font-semibold tracking-[-0.01em]",
    "transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-out",
    "active:translate-y-px disabled:pointer-events-none disabled:opacity-45",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-500",
    variants[variant],
    sizes[size],
    className,
  );
}
