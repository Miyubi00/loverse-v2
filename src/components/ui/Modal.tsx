import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/cn";

interface ModalProps {
  open?: boolean;
  ariaLabel: string;
  onClose: () => void;
  onBackdropClick?: () => void;
  closeOnEsc?: boolean;
  closeOnBackdrop?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
  overlayClassName?: string;
  panelClassName?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let bodyLockCount = 0;
let previousBodyOverflow = "";
let previousHtmlOverflow = "";

const modalStack: symbol[] = [];

function lockBodyScroll() {
  if (bodyLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
  }
  bodyLockCount += 1;
}

function unlockBodyScroll() {
  bodyLockCount = Math.max(0, bodyLockCount - 1);
  if (bodyLockCount === 0) {
    document.body.style.overflow = previousBodyOverflow;
    document.documentElement.style.overflow = previousHtmlOverflow;
  }
}

export default function Modal({
  open = true,
  ariaLabel,
  onClose,
  onBackdropClick,
  closeOnEsc = true,
  closeOnBackdrop = true,
  initialFocusRef,
  children,
  overlayClassName = "items-center justify-center bg-ink-950/65 p-4 backdrop-blur-[3px]",
  panelClassName,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const onBackdropClickRef = useRef(onBackdropClick);
  const modalIdRef = useRef(Symbol("modal"));

  useEffect(() => {
    onCloseRef.current = onClose;
    onBackdropClickRef.current = onBackdropClick;
  }, [onClose, onBackdropClick]);

  useEffect(() => {
    if (!open) return;

    const modalId = modalIdRef.current;
    modalStack.push(modalId);
    lockBodyScroll();
    const previousFocus = document.activeElement as HTMLElement | null;

    const timer = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const initialFocus =
        initialFocusRef?.current ??
        panel.querySelector<HTMLElement>(FOCUSABLE) ??
        panel;
      initialFocus.focus();
    }, 30);

    const onKeyDown = (event: KeyboardEvent) => {
      if (modalStack[modalStack.length - 1] !== modalId) return;

      if (event.key === "Escape") {
        if (!closeOnEsc) return;
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;

      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((element) => element.getClientRects().length > 0);

      if (focusables.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (!panel.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(timer);
      const stackIndex = modalStack.lastIndexOf(modalId);
      if (stackIndex >= 0) modalStack.splice(stackIndex, 1);
      unlockBodyScroll();
      if (previousFocus?.isConnected && previousFocus !== document.body) {
        previousFocus.focus();
      }
    };
  }, [open, closeOnEsc, initialFocusRef]);

  if (!open) return null;

  return createPortal(
    <div
      data-modal-root=""
      className={cn(
        "fixed inset-0 z-[200] flex h-dvh w-full overflow-y-auto overscroll-contain",
        overlayClassName,
      )}
    >
      {closeOnBackdrop && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Tutup dialog"
          onClick={() => (onBackdropClickRef.current ?? onCloseRef.current)()}
          className="absolute inset-0 cursor-default"
        />
      )}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        className={cn("relative focus-visible:outline-none", panelClassName)}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
