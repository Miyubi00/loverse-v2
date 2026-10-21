import type { ReactNode } from "react";

export function SectionHeading({
  step,
  title,
  className = "",
}: {
  step?: string;
  title: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {step ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-ink-900/20 bg-cream-100 font-data text-[10px] font-semibold text-ember-600">
          {step}
        </span>
      ) : null}
      <h2 className="font-display text-xl leading-none tracking-[-0.03em] text-ink-950 sm:text-2xl">
        {title}
      </h2>
    </div>
  );
}

export function SectionCard({
  step,
  title,
  children,
}: {
  step?: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-5 rounded-[3px] border border-ink-900/12 bg-white p-4 shadow-lift sm:p-6 md:p-7">
      {title ? <SectionHeading step={step} title={title} /> : null}
      {children}
    </section>
  );
}

export function SummaryRow({
  label,
  value,
  muted = false,
  mono = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="shrink-0 font-medium text-ink-400">{label}</span>
      <span
        className={`truncate ${muted ? "italic text-ink-300" : "text-ink-800"} ${mono ? "font-data" : ""}`}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}
