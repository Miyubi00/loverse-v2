// ============================================================
// src/components/shared/form/SectionCards.tsx
// ------------------------------------------------------------
// Kartu-kartu section form bersama: Lokasi, Keluarga, Foto, Galeri, Musik & Kutipan, Rekening - data generik EventDetails.
// Dipakai di  : EditOrderModal (admin), EditTab (customer)
// Keterikatan : ./FormKit, ./ui, types/database, hooks/useEditActions (PhotoField)
// ============================================================

import { useRef, type ChangeEvent } from "react";
import {
  Camera,
  CreditCard,
  Eye,
  ImagePlus,
  Loader2,
  MapPin,
  Music,
  Trash2,
  Users,
} from "lucide-react";
import { CARD, FIELD_LABEL, INPUT } from "./ui";
import {
  BankInput,
  CardHeader,
  DateField,
  PhotoPicker,
  TextField,
} from "./FormKit";
import type { BankAccount, EventDetails } from "../../../types/database";
import type { PhotoField } from "../../../hooks/useEditActions";
import { useTranslation } from "../../../i18n";

export type FieldChangeEvent = ChangeEvent<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
>;

type UploadHandler = (
  e: ChangeEvent<HTMLInputElement>,
  fieldName: keyof EventDetails,
  isGallery?: boolean,
) => void;

interface DataCardProps {
  data: Partial<EventDetails>;
  handleChange: (e: FieldChangeEvent) => void;
}

/* ------------------------------ Lokasi & Waktu ----------------------------- */

export function LocationCard({ data, handleChange }: DataCardProps) {
  const { t } = useTranslation();

  return (
    <section className={CARD}>
      <CardHeader icon={<MapPin size={16} />} title={t('customer.edit.cardLocation')} />
      <input
        name="venue_name"
        value={data.venue_name || ""}
        onChange={handleChange}
        className={INPUT}
        placeholder={t('customer.edit.venueName')}
      />
      <textarea
        name="venue_address"
        value={data.venue_address || ""}
        onChange={handleChange}
        className={`${INPUT} h-24 resize-none`}
        placeholder={t('customer.edit.venueAddress')}
      />
      <input
        name="maps_link"
        value={data.maps_link || ""}
        onChange={handleChange}
        className={INPUT}
        placeholder={t('customer.edit.mapsLink')}
      />
      <div className="grid grid-cols-2 gap-3">
        <DateField
          label={t('customer.edit.akadDate')}
          name="akad_date"
          value={data.akad_date}
          handleChange={handleChange}
        />
        <DateField
          label={t('customer.edit.resepsiDate')}
          name="resepsi_date"
          value={data.resepsi_date}
          handleChange={handleChange}
        />
      </div>
      <p className="-mt-2 text-[14px] italic text-ink-400">
        {t('customer.edit.dateHint')}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label={t('customer.edit.akadTime')}
          name="akad_time"
          value={data.akad_time}
          handleChange={handleChange}
          placeholder="08:00 WIB"
          centered
        />
        <TextField
          label={t('customer.edit.resepsiTime')}
          name="resepsi_time"
          value={data.resepsi_time}
          handleChange={handleChange}
          placeholder="11:00 WIB"
          centered
        />
      </div>
    </section>
  );
}

/* ------------------------------- Keluarga ---------------------------------- */

export function FamilyCard({ data, handleChange }: DataCardProps) {
  const { t } = useTranslation();

  return (
    <section className={CARD}>
      <CardHeader icon={<Users size={16} />} title={t('customer.edit.cardFamily')} />
      <TextField
        label={t('customer.edit.groomParents')}
        name="groom_parents"
        value={data.groom_parents}
        handleChange={handleChange}
        placeholder={t('customer.edit.parentsPlaceholder')}
      />
      <TextField
        label={t('customer.edit.brideParents')}
        name="bride_parents"
        value={data.bride_parents}
        handleChange={handleChange}
        placeholder={t('customer.edit.parentsPlaceholder')}
      />
    </section>
  );
}

/* --------------------------- Foto Mempelai & Cover -------------------------- */

export function PhotosCard({
  data,
  activeUploadField,
  isUploading,
  handleFileUpload,
  onPreview,
  onRemovePhoto,
}: {
  data: Partial<EventDetails>;
  activeUploadField: string | null;
  isUploading: boolean;
  handleFileUpload: UploadHandler;
  onPreview: (url: string, title: string) => void;
  onRemovePhoto: (field: PhotoField, label: string) => void;
}) {
  const { t } = useTranslation();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const isGroomUploading = isUploading && activeUploadField === "groom_photo";
  const isBrideUploading = isUploading && activeUploadField === "bride_photo";
  const isCoverUploading = isUploading && activeUploadField === "cover_photo";

  return (
    <section className={CARD}>
      <CardHeader icon={<Camera size={16} />} title={t('customer.edit.cardPhotos')} />

      <div className="grid grid-cols-2 gap-4">
        <PhotoPicker
          label={t('customer.edit.groomPhoto')}
          src={data.groom_photo}
          alt={t('customer.edit.groomPhoto')}
          uploading={isGroomUploading}
          onPick={(e) => handleFileUpload(e, "groom_photo")}
        />
        <PhotoPicker
          label={t('customer.edit.bridePhoto')}
          src={data.bride_photo}
          alt={t('customer.edit.bridePhoto')}
          uploading={isBrideUploading}
          onPick={(e) => handleFileUpload(e, "bride_photo")}
        />
      </div>

      <div className="mt-2 space-y-2">
        <div className="flex items-center justify-between">
          <span className={FIELD_LABEL}>{t('customer.edit.coverBanner')}</span>
          {data.cover_photo && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  if (data.cover_photo) {
                    onPreview(data.cover_photo, t('customer.edit.coverBanner'));
                  }
                }}
                className="flex items-center gap-1 font-data text-[14px] uppercase tracking-[0.06em] text-ink-600 transition hover:text-ember-600"
              >
                <Eye size={13} className="hidden lg:block" aria-hidden="true" /> {t('common.view')}
              </button>
              <span className="text-ink-300" aria-hidden="true">·</span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemovePhoto("cover_photo", t('customer.edit.coverBanner'));
                }}
                className="flex items-center gap-1 font-data text-[14px] uppercase tracking-[0.06em] text-danger-600 transition hover:text-danger-700"
              >
                <Trash2 size={13} className="hidden lg:block" aria-hidden="true" /> {t('common.delete')}
              </button>
            </div>
          )}
        </div>

        <div className="group relative">
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, "cover_photo")}
            className="hidden"
            disabled={isCoverUploading}
          />
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={isCoverUploading}
            aria-label={
              data.cover_photo ? t('customer.edit.changePhoto') : t('customer.edit.uploadPhoto')
            }
            aria-busy={isCoverUploading}
            className="flex h-40 w-full flex-col items-center justify-center gap-1.5 overflow-hidden border border-dashed border-ink-900/20 bg-cream-100/60 text-ink-400 transition-colors hover:border-ember-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-500 disabled:cursor-wait disabled:opacity-80"
          >
            {data.cover_photo ? (
              <>
                <img
                  src={data.cover_photo}
                  className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  alt="Cover"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-ink-950/30 opacity-0 transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                  <Camera
                    size={24}
                    strokeWidth={1.5}
                    className="text-cream-50"
                    aria-hidden="true"
                  />
                </span>
              </>
            ) : (
              <>
                <Camera size={26} strokeWidth={1.4} aria-hidden="true" />
                <span className="text-[14px] font-medium">{t('customer.edit.noCover')}</span>
              </>
            )}

            {isCoverUploading && (
              <span className="absolute inset-0 z-20 grid place-items-center bg-ink-950/50 backdrop-blur-sm">
                <Loader2 size={26} className="animate-spin text-white" aria-hidden="true" />
              </span>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- Galeri ----------------------------------- */

export function GalleryCard({
  gallery,
  isUploading,
  handleFileUpload,
  onRequestRemove,
  onPreview,
}: {
  gallery: string[];
  isUploading: boolean;
  handleFileUpload: UploadHandler;
  onRequestRemove: (index: number) => void;
  onPreview: (url: string, title: string) => void;
}) {
  const { t } = useTranslation();
  const galleryInputRef = useRef<HTMLInputElement>(null);

  return (
    <section className={CARD}>
      <CardHeader
        icon={<ImagePlus size={16} />}
        title={t('customer.edit.cardGallery')}
        action={
          <span className="font-data text-[14px] text-ink-400">
            {t('customer.edit.galleryCount', { count: gallery.length })}
          </span>
        }
      />

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFileUpload(e, "gallery", true)}
        className="hidden"
        disabled={isUploading}
      />
      <button
        type="button"
        onClick={() => galleryInputRef.current?.click()}
        disabled={isUploading}
        aria-label={
          isUploading ? t('customer.edit.btnUploadingGallery') : t('customer.edit.btnUploadGallery')
        }
        aria-busy={isUploading}
        className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 border border-dashed border-ink-900/20 bg-cream-100/50 px-4 py-4 text-[14px] font-semibold text-ink-600 transition-colors hover:border-ember-500 hover:bg-cream-100 hover:text-ember-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-500 active:scale-[0.99] disabled:cursor-wait disabled:opacity-80"
      >
        {isUploading ? (
          <Loader2 size={18} className="hidden animate-spin text-ember-500 lg:block" aria-hidden="true" />
        ) : (
          <ImagePlus size={18} className="hidden lg:block" aria-hidden="true" />
        )}
        <span>
          {isUploading ? t('customer.edit.btnUploadingGallery') : t('customer.edit.btnUploadGallery')}
        </span>
      </button>

      {gallery.length === 0 ? (
        <div className="border border-dashed border-ink-900/15 py-10 text-center text-[14px] italic text-ink-400">
          {t('customer.edit.galleryEmpty')}
        </div>
      ) : (
        <div className="grid max-h-[380px] grid-cols-3 gap-3 overflow-y-auto pr-1">
          {gallery.map((url, idx) => (
            <div
              key={url || idx}
              className="group relative aspect-square overflow-hidden border border-ink-900/10 bg-cream-200"
            >
              <img
                src={url}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                alt={`Gallery ${idx + 1}`}
              />

              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-ink-950/55 opacity-0 transition duration-200 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => onPreview(url, `Foto Galeri #${idx + 1}`)}
                  title={t('common.view')}
                  className="grid h-8 w-8 place-items-center bg-cream-50/25 text-cream-50 backdrop-blur-sm transition hover:bg-cream-50/40 active:scale-95"
                >
                  <Eye size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => onRequestRemove(idx)}
                  title={t('common.delete')}
                  className="grid h-8 w-8 place-items-center bg-danger-600/80 text-white backdrop-blur-sm transition hover:bg-danger-700 active:scale-95"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ------------------------------ Musik & Kutipan ----------------------------- */

export function MusicQuoteCard({
  data,
  handleChange,
  handleFileUpload,
  uploading = false,
  activeUploadField = null,
  converting = false,
  convertPercent = null,
  removing = false,
  onRemoveMusic,
}: {
  data: Partial<EventDetails>;
  handleChange: (e: FieldChangeEvent) => void;
  handleFileUpload: UploadHandler;
  uploading?: boolean;
  activeUploadField?: string | null;
  converting?: boolean;
  convertPercent?: number | null;
  removing?: boolean;
  onRemoveMusic?: () => Promise<void> | void;
}) {
  const { t } = useTranslation();
  const hasMusic = Boolean(data.audio_url);
  const isAudioUploading = Boolean(uploading && activeUploadField === 'audio_url');
  const busy = isAudioUploading || converting || removing;

  const statusText = isAudioUploading
    ? t('common.processing')
    : converting
      ? t('customer.edit.musicConverting', { percent: convertPercent ?? 0 })
      : removing
        ? t('customer.edit.musicRemoving')
        : hasMusic
          ? t('customer.edit.musicInstalled')
          : t('customer.edit.musicNone');

  return (
    <section className={CARD}>
      <CardHeader icon={<Music size={16} />} title={t('customer.edit.cardMusicQuote')} />
      <div className="flex items-center gap-3 border border-ink-900/12 bg-cream-100/60 p-3">
        <div className="min-w-0 flex-1">
          <p className={`font-data text-[14px] uppercase tracking-[0.06em] ${isAudioUploading || converting || removing ? 'italic text-ink-400' : 'text-ink-600'}`}>
            {statusText}
          </p>
          {hasMusic && !removing && (
            <audio controls src={data.audio_url} className="mt-1 h-8 w-full" />
          )}
        </div>

        {hasMusic ? (
          onRemoveMusic && (
            <button
              type="button"
              onClick={() => void onRemoveMusic()}
              disabled={busy}
              title={t('common.delete')}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 border border-danger-600/25 bg-danger-600/[0.06] px-3 py-1.5 text-[14px] font-semibold text-danger-600 transition-colors hover:bg-danger-600/10 disabled:cursor-wait disabled:opacity-60"
            >
              {removing ? (
                <>
                  <Loader2 size={13} className="hidden animate-spin lg:block" aria-hidden="true" /> {t('customer.edit.btnRemovingMusic') || t('common.loading')}
                </>
              ) : (
                <>
                  <Trash2 size={13} className="hidden lg:block" aria-hidden="true" /> {t('common.delete')}
                </>
              )}
            </button>
          )
        ) : (
          <label
            className={`flex shrink-0 cursor-pointer items-center gap-1.5 border border-ink-950 bg-ink-950 px-3 py-1.5 text-[14px] font-semibold text-cream-50 transition-colors hover:bg-ember-600 ${
              isAudioUploading || converting ? 'pointer-events-none cursor-wait opacity-70' : ''
            }`}
          >
            {isAudioUploading ? (
              <>
                <Loader2 size={13} className="hidden animate-spin lg:block" aria-hidden="true" /> {t('common.processing')}
              </>
            ) : converting ? (
              <>
                <Loader2 size={13} className="hidden animate-spin lg:block" aria-hidden="true" /> {t('customer.edit.btnConvertingMusic')}
              </>
            ) : (
              t('customer.edit.btnUploadMusic')
            )}
            <input
              type="file"
              accept="audio/*,audio/mpeg,audio/mp3,audio/wav,audio/m4a,audio/aac,audio/ogg"
              onChange={(e) => handleFileUpload(e, "audio_url")}
              className="hidden"
              disabled={busy}
            />
          </label>
        )}
      </div>
      <div className="space-y-1">
        <label className={FIELD_LABEL}>{t('customer.edit.quoteLabel')}</label>
        <textarea
          name="quote"
          value={data.quote || ""}
          onChange={handleChange}
          className={`${INPUT} h-20 resize-none`}
          placeholder={t('customer.edit.quotePlaceholder')}
        />
        <input
          name="quote_src"
          value={data.quote_src || ""}
          onChange={handleChange}
          className={`${INPUT} mt-2`}
          placeholder={t('customer.edit.quoteSrcPlaceholder')}
        />
      </div>
    </section>
  );
}

/* -------------------------------- Rekening --------------------------------- */

export function BanksCard({
  banks,
  onAdd,
  onUpdate,
  onRequestRemove,
}: {
  banks: BankAccount[];
  onAdd: () => void;
  onUpdate: (index: number, field: keyof BankAccount, value: string) => void;
  onRequestRemove: (index: number) => void;
}) {
  const { t } = useTranslation();

  return (
    <section className={CARD}>
      <CardHeader
        icon={<CreditCard size={16} />}
        title={t('customer.edit.cardBanks')}
        action={
          <button
            type="button"
            onClick={onAdd}
            className="border border-ink-900/15 bg-ink-950 px-3 py-1.5 font-data text-[14px] uppercase tracking-[0.06em] text-cream-50 transition-colors hover:bg-ember-600"
          >
            {t('customer.edit.btnAddBank')}
          </button>
        }
      />
      {banks.length === 0 && (
        <p className="py-2 text-[14px] italic text-ink-400">
          {t('customer.edit.banksEmpty')}
        </p>
      )}
      {banks.map((bank, idx) => (
        <div
          key={idx}
          className="relative border border-ink-900/12 bg-cream-100/50 p-3 pr-9"
        >
          <button
            type="button"
            onClick={() => onRequestRemove(idx)}
            className="absolute right-2.5 top-2.5 text-ink-300 transition-colors hover:text-danger-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <div className="grid grid-cols-3 gap-2">
            <BankInput
              value={bank.bank}
              onChange={(v) => onUpdate(idx, "bank", v)}
              placeholder={t('customer.edit.bankNamePlaceholder')}
            />
            <BankInput
              value={bank.number}
              onChange={(v) => onUpdate(idx, "number", v)}
              placeholder={t('customer.edit.bankNumberPlaceholder')}
              mono
            />
            <BankInput
              value={bank.name}
              onChange={(v) => onUpdate(idx, "name", v)}
              placeholder={t('customer.edit.bankOwnerPlaceholder')}
            />
          </div>
        </div>
      ))}
    </section>
  );
}
