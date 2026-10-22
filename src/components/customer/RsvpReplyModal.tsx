import { useRef, type Dispatch, type SetStateAction } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import type { RsvpRow } from "../../types/database";
import { useTranslation } from "../../i18n";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const title = rsvp.reply ? t("customer.rsvp.modalEditTitle") : t("customer.rsvp.modalTitle");

  return (
    <Modal
      onClose={onClose}
      ariaLabel={title}
      closeOnEsc={false}
      initialFocusRef={textareaRef}
      overlayClassName="items-center justify-center bg-ink-950/80 p-4 backdrop-blur-[3px]"
      panelClassName="max-h-dvh w-full max-w-md overflow-y-auto border border-ink-900/10 bg-cream-50 p-5 shadow-deep sm:p-6"
    >
      <div className="flex items-center justify-between gap-3 border-b border-ink-900/12 pb-3">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="h-4 w-4 text-ember-600" strokeWidth={1.5} />
          <h3 className="font-display text-lg tracking-[-0.02em] text-ink-950">
            {title}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.close")}
          className="p-1 text-ink-400 transition-colors hover:text-ink-900"
        >
          <X size={17} />
        </button>
      </div>

      <div className="mt-4 border-l-2 border-ink-900/15 bg-cream-100/70 px-3 py-2.5">
        <span className="font-data text-[14px] uppercase tracking-[0.06em] text-ink-500">
          {rsvp.guest_name}
        </span>
        <p className="mt-1 text-[14px] leading-relaxed text-ink-600">&ldquo;{rsvp.message}&rdquo;</p>
      </div>

      <div className="mt-4">
        <label
          htmlFor="rsvp-reply-text"
          className="font-data text-[14px] uppercase tracking-[0.06em] text-ink-400"
        >
          {t("customer.rsvp.modalLabel")}
        </label>
        <textarea
          ref={textareaRef}
          id="rsvp-reply-text"
          rows={4}
          value={replyText[rsvp.id] || ""}
          onChange={(e) =>
            setReplyText((prev) => ({ ...prev, [rsvp.id]: e.target.value }))
          }
          placeholder={t("customer.rsvp.modalPlaceholder")}
          className="mt-1.5 w-full resize-none border border-ink-900/15 bg-cream-50 p-3 text-[14px] text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-ember-500 focus:ring-2 focus:ring-ember-500/15"
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
    </Modal>
  );
}
