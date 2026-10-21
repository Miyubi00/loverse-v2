import type { ChangeEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Camera, Eye, Loader2, Trash2, X } from "lucide-react";
import { CARD_TITLE, FIELD_LABEL, ICON_CHIP, INPUT } from "./ui";
import { useTranslation } from "../../../i18n";

const INPUT_CLASS = `${INPUT} mt-1.5`;

export interface PreviewImage {
  url: string;
  title: string;
}

export function CardHeader({
  icon,
  title,
  action,
}: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className={`${CARD_TITLE} border-b border-ink-900/10 pb-3`}>
      <span className={ICON_CHIP}>{icon}</span>
      <span className="flex-1">{title}</span>
      {action}
    </div>
  );
}

export function SubTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-10 items-center gap-2 px-3.5 text-[11px] font-semibold tracking-[-0.01em] transition-colors ${
        active
          ? "bg-ink-950 text-cream-50"
          : "text-ink-500 hover:bg-cream-50 hover:text-ink-900"
      }`}
    >
      {children}
    </button>
  );
}

type FieldChange = (e: ChangeEvent<HTMLInputElement>) => void;

export function TextField({
  label,
  name,
  value,
  handleChange,
  placeholder,
  centered = false,
}: {
  label: string;
  name: string;
  value: string | undefined;
  handleChange: FieldChange;
  placeholder?: string;
  centered?: boolean;
}) {
  return (
    <div>
      <label className={FIELD_LABEL}>{label}</label>
      <input
        name={name}
        value={value || ""}
        onChange={handleChange}
        className={`${INPUT_CLASS} ${centered ? "text-center" : ""}`}
        placeholder={placeholder}
      />
    </div>
  );
}

export function DateField({
  label,
  name,
  value,
  handleChange,
}: {
  label: string;
  name: string;
  value: string | undefined;
  handleChange: FieldChange;
}) {
  return (
    <div>
      <label className={FIELD_LABEL}>{label}</label>
      <input
        type="date"
        name={name}
        value={value || ""}
        onChange={handleChange}
        className={INPUT_CLASS}
      />
    </div>
  );
}

export function BankInput({
  value,
  onChange,
  placeholder,
  mono = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  mono?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full border-b border-dashed border-ink-900/20 bg-transparent p-1 text-[12px] font-semibold text-ink-900 outline-none transition placeholder:font-normal placeholder:text-ink-300 focus:border-ember-500 ${
        mono ? "font-data" : ""
      }`}
      placeholder={placeholder}
    />
  );
}

export function PhotoPicker({
  label,
  src,
  alt,
  uploading,
  onPick,
  onPreview,
  onRemove,
}: {
  label: string;
  src: string | undefined;
  alt: string;
  uploading: boolean;
  onPick: (e: ChangeEvent<HTMLInputElement>) => void;
  onPreview: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-3 border border-ink-900/12 bg-cream-100/50 p-3.5 transition-colors hover:bg-cream-100">
      <div className="group relative block aspect-square w-full max-w-[150px] overflow-hidden border border-ink-900/10 bg-cream-50">
        {src ? (
          <>
            <img
              src={src}
              alt={alt}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-ink-950/55 opacity-0 transition duration-200 group-hover:opacity-100">
              <button
                type="button"
                onClick={onPreview}
                title={t("common.view")}
                className="grid h-8 w-8 place-items-center bg-cream-50/25 text-cream-50 backdrop-blur-sm transition hover:bg-cream-50/40 active:scale-95"
              >
                <Eye size={15} />
              </button>
              <button
                type="button"
                onClick={onRemove}
                title={t("common.delete")}
                className="grid h-8 w-8 place-items-center bg-danger-600/80 text-white backdrop-blur-sm transition hover:bg-danger-700 active:scale-95"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </>
        ) : (
          <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1.5 text-ink-400 transition hover:bg-cream-100">
            <Camera size={26} strokeWidth={1.4} />
            <span className="font-data text-[8px] uppercase tracking-[0.12em]">
              {t("customer.edit.pickPhoto")}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={onPick}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}

        {uploading && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-ink-950/55 backdrop-blur-sm">
            <Loader2 size={22} className="animate-spin text-cream-50" />
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-[11px] font-semibold text-ink-900">{label}</p>
        <label className="mt-1 inline-block cursor-pointer font-data text-[8px] uppercase tracking-[0.12em] text-ember-600 transition hover:text-ember-700">
          {src ? t("customer.edit.changePhoto") : t("customer.edit.uploadPhoto")}
          <input
            type="file"
            accept="image/*"
            onChange={onPick}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}

export function LightboxPreview({
  image,
  onClose,
}: {
  image: PreviewImage | null;
  onClose: () => void;
}) {
  if (!image) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/85 p-4 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden border border-cream-100/15 bg-ink-900 p-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex w-full items-center justify-between border-b border-cream-100/10 px-1 pb-2.5">
          <span className="font-data text-[9px] uppercase tracking-[0.14em] text-cream-100/70">
            {image.title}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 text-cream-100/50 transition-colors hover:text-cream-50"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mt-2 flex max-h-[75vh] items-center justify-center overflow-hidden bg-ink-950">
          <img
            src={image.url}
            alt={image.title}
            className="max-h-[70vh] w-auto max-w-full object-contain"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
