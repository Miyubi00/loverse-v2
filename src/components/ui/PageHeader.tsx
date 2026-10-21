import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface PageHeaderProps {
  eyebrow?: string;
  index?: string;
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  className?: string;
  align?: "left" | "center";
}

export default function PageHeader({
  eyebrow,
  index,
  title,
  description,
  aside,
  className,
  align = "left",
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "relative border-b border-ink-900/12 pb-10 pt-10 sm:pb-14 sm:pt-16",
        align === "center" && "text-center",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {eyebrow && <span className="eyebrow text-ember-600">{eyebrow}</span>}
        {index && (
          <span className="font-data text-[14px] text-ink-400" aria-hidden="true">
            /{index}
          </span>
        )}
      </div>
      <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="display-xl max-w-[16ch] text-[clamp(3.1rem,8.2vw,7.6rem)] text-ink-950">
          {title}
        </h1>
        {(description || aside) && (
          <div
            className={cn(
              "flex max-w-md flex-col gap-6 lg:pb-2",
              align === "center" && "mx-auto items-center",
            )}
          >
            {description && (
              <p className="text-pretty text-[15px] leading-relaxed text-ink-600">{description}</p>
            )}
            {aside}
          </div>
        )}
      </div>
    </header>
  );
}
