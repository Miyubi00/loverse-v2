import type { MouseEventHandler } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";

interface BrandMarkProps {
  className?: string;
  title?: string;
}

export function BrandMark({ className, title }: BrandMarkProps) {
  return (
    <img
      src="/logo.svg"
      alt={title ?? ""}
      aria-hidden={title ? undefined : true}
      width={672}
      height={520}
      className={cn("block h-auto w-full", className)}
    />
  );
}

interface WordmarkProps {
  to?: string;
  className?: string;
  imageClassName?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  ariaLabel?: string;
}

export function Wordmark({
  to = "/",
  className,
  imageClassName,
  onClick,
  ariaLabel = "Loverse — Beranda",
}: WordmarkProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex shrink-0 items-center rounded-[3px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember-500",
        className,
      )}
    >
      <img
        src="/logo.png"
        alt="Loverse"
        width={680}
        height={220}
        className={cn("block h-8 w-auto max-w-full", imageClassName)}
      />
    </Link>
  );
}

export function BrandPlate({
  to = "/",
  className,
  imageClassName,
  onClick,
  ariaLabel = "Loverse — Beranda",
}: WordmarkProps) {
  return (
    <Wordmark
      to={to}
      onClick={onClick}
      ariaLabel={ariaLabel}
      className={cn("bg-ink-950 px-3 py-2.5", className)}
      imageClassName={cn("h-7", imageClassName)}
    />
  );
}

export function BrandAsset({ className }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Loverse"
      width={680}
      height={220}
      className={cn("block h-auto w-full", className)}
    />
  );
}
