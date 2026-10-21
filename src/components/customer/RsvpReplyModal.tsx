import { createPortal } from "react-dom";
import { MessageSquare, Send, X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { RsvpRow } from "../../types/database";
import { useTranslation } from "../../i18n";
import Button from "../ui/Button";

interface RsvpReplyModalProps {
  rsvp: RsvpRow;
  replyText: Record<string, string>;
  setReplyText: Dispatch<SetStateAction<Record<string, string>>>;
  onClose: () => void;
  onSubmit: (rsvpId: string) => void;
}

export default function RsvpReplyModal({
  rsvp,
  replyText,
  setReplyText,
  onClose,
  onSubmit,
}: RsvpReplyModalProps) {
  const { t } = useTranslation();

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={rsvp.reply ? t("customer.rsvp.modalEditTitle") : t("customer.rsvp.modalTitle")}
        className="w-full max-w-md border border-ink-900/10 bg-cream-50 p-5 shadow-deep sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-ink-900/12 pb-3">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="h-4 w-4 text-ember-600" strokeWidth={1.5} />
            <h3 className="font-display text-lg tracking-[-0.02em] text-ink-950">
              {rsvp.reply ? t("customer.rsvp.modalEditTitle") : t("customer.rsvp.modalTitle")}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 text-ink-400 transition-colors hover:text-ink-900"
          >
            <X size={17} />
          </button>
        </div>

        <div className="mt-4 border-l-2 border-ink-900/15 bg-cream-100/70 px-3 py-2.5">
          <span className="font-data text-[8px] uppercase tracking-[0.12em] text-ink-500">
            {rsvp.guest_name}
          </span>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-600">“{rsvp.message}”</p>
        </div>

        <div className="mt-4">
          <label
            htmlFor="rsvp-reply-text"
            className="font-data text-[8px] uppercase tracking-[0.16em] text-ink-400"
          >
            {t("customer.rsvp.modalLabel")}
          </label>
          <textarea
            id="rsvp-reply-text"
            rows={4}
            value={replyText[rsvp.id] || ""}
            onChange={(e) =>
              setReplyText((prev) => ({ ...prev, [rsvp.id]: e.target.value }))
            }
            placeholder={t("customer.rsvp.modalPlaceholder")}
            className="mt-1.5 w-full resize-none border border-ink-900/15 bg-cream-50 p-3 text-[12px] text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-ember-500 focus:ring-2 focus:ring-ember-500/15"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => onSubmit(rsvp.id)}
            icon={<Send size={12} />}
          >
            {t("customer.rsvp.modalBtnSend")}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
