import { useRef, type ChangeEvent, type ReactNode } from "react";
import { Camera, Eye, Loader2, Trash2, X } from "lucide-react";
import { CARD_TITLE, FIELD_LABEL, ICON_CHIP, INPUT } from "./ui";
import { useTranslation } from "../../../i18n";
import Modal from "../../ui/Modal";

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
  mobileEven = false,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  mobileEven?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-11 items-center justify-center gap-2 py-2 text-center text-[13px] font-semibold tracking-[-0.01em] transition-colors lg:min-h-10 lg:text-[14px] ${
        mobileEven
          ? "min-w-0 flex-1 basis-0 px-1.5 lg:flex-none lg:basis-auto lg:px-3.5"
          : "px-3.5"
      } ${
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
      className={`w-full border-b border-dashed border-ink-900/20 bg-transparent p-1 text-[14px] font-semibold text-ink-900 outline-none transition placeholder:font-normal placeholder:text-ink-300 focus:border-ember-500 ${
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
}: {
  label: string;
  src: string | undefined;
  alt: string;
  uploading: boolean;
  onPick: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="group relative">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onPick}
        className="hidden"
        disabled={uploading}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label={src ? t("customer.edit.changePhoto") : t("customer.edit.uploadPhoto")}
        aria-busy={uploading}
        className="flex w-full flex-col items-center gap-3 border border-ink-900/12 bg-cream-100/50 p-3.5 text-center transition-colors hover:bg-cream-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-500 disabled:cursor-wait disabled:opacity-80"
      >
        <span className="relative block aspect-square w-full max-w-[150px] overflow-hidden border border-ink-900/10 bg-cream-50">
          {src ? (
            <>
              <img
                src={src}
                alt={alt}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-ink-950/30 opacity-0 transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                <Camera size={24} strokeWidth={1.5} className="text-cream-50" aria-hidden="true" />
              </span>
            </>
          ) : (
            <span className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-ink-400">
              <Camera size={26} strokeWidth={1.4} aria-hidden="true" />
              <span className="font-data text-[14px] uppercase tracking-[0.06em]">
                {t("customer.edit.pickPhoto")}
              </span>
            </span>
          )}

          {uploading && (
            <span className="absolute inset-0 z-10 grid place-items-center bg-ink-950/55 backdrop-blur-sm">
              <Loader2 size={22} className="animate-spin text-cream-50" aria-hidden="true" />
            </span>
          )}
        </span>

        <span className="text-[14px] font-semibold text-ink-900">{label}</span>
      </button>
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
  const { t } = useTranslation();
  if (!image) return null;
  return (
    <Modal
      onClose={onClose}
      ariaLabel={image.title}
      closeOnEsc={false}
      overlayClassName="items-center justify-center bg-ink-950/85 p-4 backdrop-blur-[3px]"
      panelClassName="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden border border-cream-100/15 bg-ink-900 p-3"
    >
      <div className="flex w-full items-center justify-between border-b border-cream-100/10 px-1 pb-2.5">
        <span className="font-data text-[14px] uppercase tracking-[0.06em] text-cream-100/70">
          {image.title}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.close")}
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
    </Modal>
  );
}
