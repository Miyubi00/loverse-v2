import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "../../i18n";
import { cn } from "../../lib/cn";
import Button from "./Button";
import Modal from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  danger = false,
  busy = false,
  onConfirm,
  onClose,
  children,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel={title}
      overlayClassName="items-end justify-center bg-ink-950/55 p-0 backdrop-blur-[3px] sm:items-center sm:p-6"
      panelClassName={cn(
        "max-h-dvh w-full max-w-lg overflow-y-auto border border-ink-900/20 bg-cream-50 p-6 shadow-deep animate-fade-in-up",
        "sm:p-8",
      )}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t("common.close")}
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center text-ink-400 transition-colors hover:text-ink-900"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
      <p className="eyebrow text-ember-600">{t("common.confirm")}</p>
      <h2 className="mt-4 pr-10 font-display text-3xl leading-[1.05] tracking-[-0.03em] text-ink-950">
        {title}
      </h2>
      {description && <div className="mt-3 text-sm leading-relaxed text-ink-600">{description}</div>}
      {children && <div className="mt-5">{children}</div>}
      <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          {cancelLabel ?? t("common.cancel")}
        </Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={busy}>
          {confirmLabel ?? t("common.confirm")}
        </Button>
      </div>
    </Modal>
  );
}
