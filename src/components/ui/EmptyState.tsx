import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  label?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  label = "Kosong",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-start gap-4 border border-dashed border-ink-900/20 bg-cream-50/60 px-6 py-12 sm:px-10",
        className,
      )}
    >
      <span className="eyebrow text-ink-400">{label}</span>
      {icon && <div className="text-ember-600">{icon}</div>}
      <h3 className="font-display text-2xl leading-tight tracking-[-0.02em] text-ink-900">{title}</h3>
      {description && <p className="max-w-md text-sm leading-relaxed text-ink-500">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
