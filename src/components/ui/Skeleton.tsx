// ============================================================
// src/components/ui/Skeleton.tsx
// ------------------------------------------------------------
// Primitif loading skeleton (ganti spinner kuno).
//   variant="pulse"  → fade cross (default)
//   variant="wave"   → shimmer slide (@keyframes di index.css)
// Pakai Tailwind utility saja — tidak butuh dependensi tambahan.
// ============================================================
import type { HTMLAttributes } from 'react';

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'pulse' | 'wave';
};

/** Classname merger lokal (hindar import util ekstra). */
function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function Skeleton({ className, variant = 'pulse', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-[inherit]',
        variant === 'wave'
          ? 'bg-gradient-to-r from-ink-900/[0.05] via-ink-900/[0.13] to-ink-900/[0.05] bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]'
          : 'bg-ink-900/[0.08] animate-pulse',
        className,
      )}
      {...props}
    />
  );
}

export default Skeleton;

