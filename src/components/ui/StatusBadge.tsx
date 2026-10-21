import { cn } from "../../lib/cn";

const TONES: Record<string, string> = {
  success:
    "border-success-600/25 bg-success-600/10 text-success-700 before:bg-success-600",
  paid:
    "border-success-600/25 bg-success-600/10 text-success-700 before:bg-success-600",
  lunas: "border-success-600/25 bg-success-600/10 text-success-700 before:bg-success-600",
  active:
    "border-success-600/25 bg-success-600/10 text-success-700 before:bg-success-600",
  pending:
    "border-gold-600/30 bg-gold-500/10 text-gold-600 before:bg-gold-500",
  menunggu:
    "border-gold-600/30 bg-gold-500/10 text-gold-600 before:bg-gold-500",
  unpaid: "border-gold-600/30 bg-gold-500/10 text-gold-600 before:bg-gold-500",
  failed:
    "border-danger-600/25 bg-danger-600/8 text-danger-700 before:bg-danger-600",
  expired:
    "border-danger-600/25 bg-danger-600/8 text-danger-700 before:bg-danger-600",
  canceled:
    "border-ink-400/30 bg-ink-900/[0.04] text-ink-500 before:bg-ink-400",
  processing:
    "border-ember-500/25 bg-ember-500/8 text-ember-700 before:bg-ember-500",
};

const LABELS: Record<string, string> = {
  success: "Berhasil",
  paid: "Lunas",
  lunas: "Lunas",
  active: "Aktif",
  pending: "Menunggu",
  menunggu: "Menunggu",
  unpaid: "Belum dibayar",
  failed: "Gagal",
  expired: "Kedaluwarsa",
  canceled: "Dibatalkan",
  processing: "Diproses",
};

interface StatusBadgeProps {
  status?: string | null;
  label?: string;
  className?: string;
}

export default function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const key = (status ?? "").toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-[2px] border px-2.5 py-1 font-data text-[14px] uppercase tracking-[0.06em]",
        "before:h-1.5 before:w-1.5 before:rounded-full before:content-['']",
        TONES[key] ?? "border-ink-400/30 bg-cream-50 text-ink-500 before:bg-ink-400",
        className,
      )}
    >
      {label ?? LABELS[key] ?? status ?? "—"}
    </span>
  );
}
