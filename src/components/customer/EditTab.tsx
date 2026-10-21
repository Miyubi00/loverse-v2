// ============================================================
// src/components/customer/EditTab.tsx
// ------------------------------------------------------------
// Tab "Edit Konten" dashboard mempelai: komposisi sub-tab tematik yang membungkus section cards form.
// Dipakai di  : pages/CustomerDashboardPage.tsx
// Keterikatan : components/shared/form/*, hooks/useEditActions, types/database
// ============================================================

import { useState, type ChangeEvent, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { Camera, CreditCard, MapPin, Save } from "lucide-react";
import ConfirmDialog from "../ConfirmDialog";
import { SubTabButton, LightboxPreview, type PreviewImage } from "../shared/form/FormKit";
import {
  LocationCard,
  FamilyCard,
  PhotosCard,
  GalleryCard,
  MusicQuoteCard,
  BanksCard,
} from "../shared/form/SectionCards";
import { useEditActions } from "../../hooks/useEditActions";
import Button from "../ui/Button";
import type { EventDetails } from "../../types/database";
import type { DashboardForm } from "../../hooks/useDashboardData";
import { useTranslation } from "../../i18n";

interface EditTabProps {
  formData: DashboardForm;
  setFormData: Dispatch<SetStateAction<DashboardForm>>;
  handleChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
  handleSaveData: (e: FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  uploading: boolean;
  activeUploadField: string | null;
  handleFileUpload: (
    e: ChangeEvent<HTMLInputElement>,
    fieldName: keyof EventDetails,
    isGallery?: boolean,
  ) => void;
  /** Dipakai untuk pembersihan objek R2 saat foto galeri dihapus. */
  orderId?: string;
  /** Sedang konversi WebM setelah musik dipilih. */
  converting?: boolean;
  /** Progres konversi dalam persen. */
  convertPercent?: number | null;
  /** Sedang menghapus musik (DB + bucket). */
  removing?: boolean;
  onRemoveMusic?: () => Promise<void> | void;
}

type SubSection = "info" | "media" | "extra";

const SUB_TABS: { id: SubSection; label: string; icon: typeof MapPin }[] = [
  { id: "info", label: "customer.edit.tabDetails", icon: MapPin },
  { id: "media", label: "customer.edit.tabMedia", icon: Camera },
  { id: "extra", label: "customer.edit.tabExtra", icon: CreditCard },
];

export default function EditTab({
  formData,
  setFormData,
  handleChange,
  handleSaveData,
  loading,
  uploading,
  activeUploadField,
  handleFileUpload,
  orderId,
  converting,
  convertPercent,
  removing,
  onRemoveMusic,
}: EditTabProps) {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<SubSection>("info");
  const [previewImage, setPreviewImage] = useState<PreviewImage | null>(null);

  const {
    confirmData,
    closeConfirm,
    requestRemovePhoto,
    requestRemoveGallery,
    requestRemoveBank,
    addBank,
    updateBank,
  } = useEditActions(setFormData, { orderId, getData: () => formData });

  const openPreview = (url: string, title: string) => setPreviewImage({ url, title });
  const activeIndex = SUB_TABS.findIndex((tab) => tab.id === activeSection);

  return (
    <div>
      <form onSubmit={handleSaveData} className="pb-6">
        <div className="sticky top-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-ink-900/10 bg-cream-100/95 px-4 py-3 backdrop-blur-sm sm:-mx-7 sm:px-7 lg:-mx-10 lg:px-10">
          <div className="flex w-full border border-ink-900/12 bg-cream-50 p-1 lg:w-fit">
            {SUB_TABS.map((tab) => (
              <SubTabButton
                key={tab.id}
                active={activeSection === tab.id}
                onClick={() => setActiveSection(tab.id)}
                mobileEven
              >
                <tab.icon
                  size={14}
                  strokeWidth={1.6}
                  className="hidden shrink-0 lg:block"
                  aria-hidden="true"
                />
                <span className="line-clamp-2 min-w-0 text-center">{t(tab.label)}</span>
              </SubTabButton>
            ))}
          </div>
          <span className="hidden font-data text-[14px] uppercase tracking-[0.06em] text-ink-400 sm:inline">
            {String(activeIndex + 1).padStart(2, "0")} / 03
          </span>
        </div>

        <div className="pt-6">
          {activeSection === "info" && (
            <div className="grid gap-5 lg:grid-cols-2">
              <LocationCard data={formData} handleChange={handleChange} />
              <FamilyCard data={formData} handleChange={handleChange} />
            </div>
          )}

          {activeSection === "media" && (
            <div className="grid gap-5 lg:grid-cols-2">
              <PhotosCard
                data={formData}
                activeUploadField={activeUploadField}
                isUploading={uploading}
                handleFileUpload={handleFileUpload}
                onPreview={openPreview}
                onRemovePhoto={requestRemovePhoto}
              />
              <GalleryCard
                gallery={formData.gallery}
                isUploading={uploading && activeUploadField === "gallery"}
                handleFileUpload={handleFileUpload}
                onRequestRemove={requestRemoveGallery}
                onPreview={openPreview}
              />
            </div>
          )}

          {activeSection === "extra" && (
            <div className="grid gap-5 lg:grid-cols-2">
              <MusicQuoteCard
                data={formData}
                handleChange={handleChange}
                handleFileUpload={handleFileUpload}
                uploading={uploading}
                activeUploadField={activeUploadField}
                converting={converting}
                convertPercent={convertPercent}
                removing={removing}
                onRemoveMusic={onRemoveMusic}
              />
              <BanksCard
                banks={formData.banks}
                onAdd={addBank}
                onUpdate={updateBank}
                onRequestRemove={requestRemoveBank}
              />
            </div>
          )}
        </div>

        <div className="sticky bottom-0 z-20 -mx-4 mt-8 flex items-center justify-between gap-4 border-t border-ink-900/12 bg-cream-100/95 px-4 py-3.5 backdrop-blur-sm sm:-mx-7 sm:px-7 lg:-mx-10 lg:px-10">
          <p className="hidden max-w-xs text-[14px] leading-relaxed text-ink-400 sm:block">
            {t("customer.edit.desc")}
          </p>
          <Button
            type="submit"
            size="lg"
            loading={loading}
            disabled={uploading}
            icon={<Save size={15} className="hidden lg:block" aria-hidden="true" />}
            className="ml-auto w-full sm:w-auto"
          >
            {loading ? t("customer.edit.btnSaving") : t("customer.edit.btnSave")}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        isOpen={confirmData.show}
        title={t("customer.edit.confirmDeleteTitle")}
        message={confirmData.message}
        isDanger
        onCancel={closeConfirm}
        onConfirm={confirmData.action ?? undefined}
      />

      <LightboxPreview image={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}
