import { useState, type ChangeEvent, type Dispatch, type SetStateAction, type SyntheticEvent } from "react";
import { ArrowLeft, Calendar, Camera, CheckCircle2, CreditCard, Loader2, MapPin, MessageSquare, Save, Search, Trash2, Users } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import ConfirmDialog from "../ConfirmDialog";
import { CARD, CARD_TITLE, FIELD_LABEL, INPUT } from "../shared/form/ui";
import { CardHeader, SubTabButton, LightboxPreview, TextField, DateField, type PreviewImage } from "../shared/form/FormKit";
import {
  LocationCard,
  PhotosCard,
  GalleryCard,
  MusicQuoteCard,
  BanksCard,
  type FieldChangeEvent,
} from "../shared/form/SectionCards";
import { useEditActions } from "../../hooks/useEditActions";
import { useFileUpload } from "../../hooks/useFileUpload";
import Pagination from "../shared/Pagination";
import Button from "../ui/Button";
import { useRsvpServer, type RsvpStatusFilter } from "../../hooks/useRsvpServer";
import type { EventDetails, OrderRow, RsvpRow, TemplateRow, OrderEditForm } from "../../types/database";
import { useTranslation } from "../../i18n";

/* ────────────────────────────────────────────────────────────────────────────
   Props
   ──────────────────────────────────────────────────────────────────────────── */

interface EditOrderModalProps {
  editingOrder: OrderRow;
  setEditingOrder: Dispatch<SetStateAction<OrderRow | null>>;
  editFormData: OrderEditForm;
  setEditFormData: Dispatch<SetStateAction<OrderEditForm>>;
  templates: TemplateRow[];
  fetchData: () => Promise<void>;
  toast: { success: (msg: string) => void; error: (msg: string) => void; warning: (msg: string) => void };
  onBack?: () => void;
  onSaved?: () => void;
}

type SubSection = "info" | "media" | "extra" | "admin" | "guests";

/* ────────────────────────────────────────────────────────────────────────────
   Main Component
   ──────────────────────────────────────────────────────────────────────────── */

export default function EditOrderModal({
  editingOrder,
  setEditingOrder,
  editFormData,
  setEditFormData,
  templates,
  fetchData,
  toast,
  onBack,
  onSaved,
}: EditOrderModalProps) {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<SubSection>("admin");
  const [previewImage, setPreviewImage] = useState<PreviewImage | null>(null);

  const rsvpList = useRsvpServer(editingOrder.id);

  const {
    uploading,
    converting,
    convertPercent,
    removing,
    activeUploadField,
    handleFileUpload,
    removeAudio,
    cropModal,
  } = useFileUpload(
    editingOrder.id,
    setEditFormData,
    "ADMIN_IMG_",
    true,
    () => editFormData,
  );

  const {
    confirmData,
    ask,
    closeConfirm,
    requestRemovePhoto,
    requestRemoveGallery,
    requestRemoveBank,
    addBank,
    updateBank,
  } = useEditActions(setEditFormData, {
    orderId: editingOrder.id,
    getData: () => editFormData,
  });

  /* ── Save ──────────────────────────────────────────────────────────────── */

  const handleSaveUpdate = async (e: SyntheticEvent) => {
    e.preventDefault();

    const { groom_name, bride_name, wedding_date, slug, template_slug, ...eventDetailsJSON } = editFormData;
    const { payment_status: _ignoredPayment, ...cleanEventDetails } = eventDetailsJSON as Record<string, unknown>;

    const { count, error } = await supabase
      .from("orders")
      .update(
        {
          groom_name,
          bride_name,
          wedding_date,
          slug,
          template_slug,
          event_details: cleanEventDetails as EventDetails,
        },
        { count: "exact" },
      )
      .eq("id", editingOrder.id);

    if (!error && (count ?? 0) > 0) {
      toast.success(t('toast.savedSuccess'));
      onSaved?.();
      fetchData();
    } else if (!error) {
      toast.error(t('toast.noChangesSaved'));
    } else {
      toast.error(t('toast.saveFailed', { error: error.message }));
    }
  };

  /* ── Generic input change ──────────────────────────────────────────────── */

  const handleChange = (e: FieldChangeEvent | ChangeEvent<HTMLSelectElement>) =>
    setEditFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }) as OrderEditForm);

  /* ── Delete RSVP ───────────────────────────────────────────────────────── */

  const handleDeleteRsvp = (rsvpId: string) =>
    ask("Hapus komentar dari tamu ini?", async () => {
      const { count, error } = await supabase
        .from("rsvps")
        .delete({ count: "exact" })
        .eq("id", rsvpId);
      if (!error && (count ?? 0) > 0) {
        toast.success(t('toast.commentDeleted'));
        await rsvpList.refresh();
      } else if (!error) {
        toast.error(t('toast.commentDeleteNoChange'));
      } else {
        toast.error(t('toast.deleteFailedSimple'));
      }
      closeConfirm();
    });

  /* ── Render ────────────────────────────────────────────────────────────── */

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <form onSubmit={handleSaveUpdate} className="w-full pb-10">
        {/* Header Tab */}
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onBack ?? (() => setEditingOrder(null))}
            className="grid h-9 w-9 shrink-0 place-items-center border border-ink-900/12 text-ink-500 transition-colors hover:border-ink-900/30 hover:text-ink-900"
            title={t('common.back')}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="eyebrow text-ember-600">Control / Edit</p>
            <h2 className="mt-1 font-display text-[clamp(1.8rem,3vw,2.6rem)] leading-none tracking-[-0.05em] text-ink-950">
              {t('admin.editInvitationTitle')}
            </h2>
            <p className="mt-2 font-data text-[14px] text-ink-400">ID: {editingOrder.id.slice(0, 12)}…</p>
          </div>
        </div>

        <div className="mt-6 flex w-fit max-w-full flex-wrap gap-1 border border-ink-900/12 bg-cream-100 p-1">
          <SubTabButton active={activeSection === "admin"} onClick={() => setActiveSection("admin")}>
            <Users size={15} className="hidden shrink-0 lg:block" aria-hidden="true" />
            <span>{t('admin.editTabOrderInfo')}</span>
          </SubTabButton>

          <SubTabButton active={activeSection === "guests"} onClick={() => setActiveSection("guests")}>
            <MessageSquare size={15} className="hidden shrink-0 lg:block" aria-hidden="true" />
            <span>{t('customer.rsvp.title')}</span>
          </SubTabButton>

          <SubTabButton active={activeSection === "media"} onClick={() => setActiveSection("media")}>
            <Camera size={15} className="hidden shrink-0 lg:block" aria-hidden="true" />
            <span>{t('customer.edit.tabMedia')}</span>
          </SubTabButton>

          <SubTabButton active={activeSection === "extra"} onClick={() => setActiveSection("extra")}>
            <CreditCard size={15} className="hidden shrink-0 lg:block" aria-hidden="true" />
            <span>{t('customer.edit.tabExtra')}</span>
          </SubTabButton>
        </div>

        {/* ─── Tab Contents ──────────────────────────────────────────────── */}
        <div className="mt-6">
          {activeSection === "admin" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <AdminOrderCard editFormData={editFormData} handleChange={handleChange} templates={templates} />
              <LocationCard data={editFormData} handleChange={handleChange} />
            </div>
          )}

          {activeSection === "guests" && (
            <GuestbookSection rsvp={rsvpList} onDelete={handleDeleteRsvp} />
          )}

          {activeSection === "media" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <PhotosCard
                data={editFormData}
                activeUploadField={activeUploadField}
                isUploading={uploading}
                handleFileUpload={handleFileUpload}
                onPreview={(url, title) => setPreviewImage({ url, title })}
                onRemovePhoto={requestRemovePhoto}
              />
              <GalleryCard
                gallery={editFormData.gallery || []}
                isUploading={uploading && activeUploadField === "gallery"}
                handleFileUpload={handleFileUpload}
                onRequestRemove={requestRemoveGallery}
                onPreview={(url, title) => setPreviewImage({ url, title })}
              />
            </div>
          )}

          {activeSection === "extra" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <MusicQuoteCard
                data={editFormData}
                handleChange={handleChange}
                handleFileUpload={handleFileUpload}
                uploading={uploading}
                activeUploadField={activeUploadField}
                converting={converting}
                convertPercent={convertPercent}
                removing={removing}
                onRemoveMusic={removeAudio}
              />
              <BanksCard
                banks={editFormData.banks || []}
                onAdd={addBank}
                onUpdate={updateBank}
                onRequestRemove={requestRemoveBank}
              />
            </div>
          )}

          {/* Tombol Simpan Lebar di Bagian Bawah */}
          <div className="mt-8 border-t border-ink-900/12 pt-5">
            <Button
              type="submit"
              size="lg"
              disabled={uploading}
              icon={uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} className="hidden lg:block" aria-hidden="true" />}
              className="w-full"
            >
              {uploading ? t('customer.edit.btnSaving') : t('customer.edit.btnSave')}
            </Button>
          </div>
        </div>
      </form>

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={confirmData.show}
        title={t('customer.edit.confirmDeleteTitle')}
        message={confirmData.message}
        isDanger={true}
        onCancel={closeConfirm}
        onConfirm={confirmData.action ?? undefined}
      />

      {/* Modal Preview Gambar (Lightbox) */}
      <LightboxPreview image={previewImage} onClose={() => setPreviewImage(null)} />

      {/* Modal Crop */}
      {cropModal}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Admin Order Card
   ════════════════════════════════════════════════════════════════════════════ */

function AdminOrderCard({
  editFormData,
  handleChange,
  templates,
}: {
  editFormData: OrderEditForm;
  handleChange: (e: FieldChangeEvent | ChangeEvent<HTMLSelectElement>) => void;
  templates: TemplateRow[];
}) {
  const { t } = useTranslation();

  return (
    <section className={CARD}>
      <CardHeader icon={<Users size={16} />} title={t('admin.cardOrderInfo')} />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-3">
          <TextField label={t('order.groomName')} name="groom_name" value={editFormData.groom_name} handleChange={handleChange} />
          <TextField
            label={t('customer.edit.groomParents')}
            name="groom_parents"
            value={editFormData.groom_parents}
            handleChange={handleChange}
            placeholder={t('customer.edit.parentsPlaceholder')}
          />
        </div>
        <div className="space-y-3">
          <TextField label={t('order.brideName')} name="bride_name" value={editFormData.bride_name} handleChange={handleChange} />
          <TextField
            label={t('customer.edit.brideParents')}
            name="bride_parents"
            value={editFormData.bride_parents}
            handleChange={handleChange}
            placeholder={t('customer.edit.parentsPlaceholder')}
          />
        </div>
      </div>

      <DateField label={t('order.weddingDate')} name="wedding_date" value={editFormData.wedding_date} handleChange={handleChange} />

      <div>
        <label className={FIELD_LABEL}>{t('admin.cardTemplateTheme')}</label>
        <select
          name="template_slug"
          value={editFormData.template_slug || ""}
          onChange={handleChange}
          className={`${INPUT} mt-1`}
        >
          {templates.map((tpl) => (
            <option key={tpl.slug} value={tpl.slug}>
              {tpl.name} ({tpl.category})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={FIELD_LABEL}>
          {t('admin.cardCustomSlug')}
        </label>
        <input
          name="slug"
          value={editFormData.slug || ""}
          onChange={handleChange}
          className={`${INPUT} mt-1`}
          placeholder="misal: romeo-juliet"
        />
        <p className="-mt-1 text-[14px] italic text-gold-600">
          {t('admin.cardSlugWarning')}
        </p>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Buku Tamu (Admin-only, sub-tab full-width)
   ════════════════════════════════════════════════════════════════════════════ */

type RsvpServerState = ReturnType<typeof useRsvpServer>;

function GuestbookSection({
  rsvp,
  onDelete,
}: {
  rsvp: RsvpServerState;
  onDelete: (id: string) => void;
}) {
  const { t, language } = useTranslation();
  const {
    searchInput, setSearchInput,
    dateInput, setDateInput,
    statusInput, setStatusInput,
    applyFilters, resetFilters, hasActiveFilter,
    rows, total, loading, stats,
    page, setPage, pageSize, setPageSize, totalPages,
  } = rsvp;
  const { hadir, tidakHadir, ragu } = stats;

  const labelCls = "mb-1.5 flex items-center gap-1.5 font-data text-[14px] uppercase tracking-[0.06em] text-ink-500";
  const inputCls =
    "h-10 w-full border border-ink-900/15 bg-cream-50 px-3 text-[14px] font-medium text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-ember-500 focus:bg-white focus:ring-2 focus:ring-ember-500/15";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border border-ink-900/12 bg-cream-100/60 p-4 md:flex-row md:items-end">
        <div className="min-w-[220px] flex-1">
          <label className={labelCls}>
            <Search size={12} className="text-ember-600" />
            <span>{t('customer.rsvp.filterSearchLabel')}</span>
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-300" />
            <input
              type="text"
              placeholder={t('customer.rsvp.filterSearchPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFilters();
              }}
              className={`${inputCls} pl-9`}
            />
          </div>
        </div>

        <div className="min-w-[160px]">
          <label className={labelCls}>
            <Calendar size={12} className="text-ember-600" />
            <span>{t('customer.rsvp.filterDateLabel')}</span>
          </label>
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="min-w-[160px]">
          <label className={labelCls}>
            <Users size={12} className="text-ember-600" />
            <span>{t('customer.rsvp.filterStatusLabel')}</span>
          </label>
          <select
            value={statusInput}
            onChange={(e) => setStatusInput(e.target.value as RsvpStatusFilter)}
            className={inputCls}
          >
            <option value="all">{t('customer.rsvp.statusAll')}</option>
            <option value="hadir">{t('customer.rsvp.statusAttending')}</option>
            <option value="tidak_hadir">{t('customer.rsvp.statusNotAttending')}</option>
            <option value="ragu">{t('customer.rsvp.statusUncertain')}</option>
          </select>
        </div>

        <div className="flex shrink-0 gap-1.5">
          {hasActiveFilter && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              icon={<Trash2 size={12} />}
              className="h-10 text-danger-600 hover:bg-danger-600/5 hover:text-danger-700"
            >
              {t('customer.rsvp.btnResetFilter')}
            </Button>
          )}
          <Button type="button" size="sm" onClick={applyFilters} icon={<Search size={12} />} className="h-10 whitespace-nowrap">
            {t('customer.rsvp.btnSearch')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t('customer.rsvp.statTotal')} value={total} labelClass="text-ink-400" valueClass="text-ink-950" />
        <StatCard label={t('customer.rsvp.statAttending')} value={hadir} labelClass="text-success-700" valueClass="text-success-700" />
        <StatCard label={t('customer.rsvp.statNotAttending')} value={tidakHadir} labelClass="text-danger-600" valueClass="text-danger-600" />
        <StatCard label={t('customer.rsvp.statUncertain')} value={ragu} labelClass="text-gold-600" valueClass="text-gold-600" />
      </div>

      <div className="overflow-hidden border border-ink-900/12 bg-cream-50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px] text-ink-600">
            <thead className="border-b border-ink-900/12 bg-cream-100">
              <tr>
                <th className="px-4 py-3.5 font-data text-[14px] font-medium uppercase tracking-[0.06em] text-ink-500">{t('customer.rsvp.thGuest')}</th>
                <th className="px-4 py-3.5 font-data text-[14px] font-medium uppercase tracking-[0.06em] text-ink-500">{t('customer.rsvp.thStatus')}</th>
                <th className="px-4 py-3.5 font-data text-[14px] font-medium uppercase tracking-[0.06em] text-ink-500">{t('customer.rsvp.thMessage')}</th>
                <th className="px-4 py-3.5 text-center font-data text-[14px] font-medium uppercase tracking-[0.06em] text-ink-500">{t('customer.rsvp.thAction')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/10">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center font-data text-[14px] uppercase tracking-[0.06em] text-ink-400">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-[14px] italic text-ink-400">
                    {hasActiveFilter ? t('customer.rsvp.emptyFiltered') : t('customer.rsvp.emptyDefault')}
                  </td>
                </tr>
              ) : (
                rows.map((rsvp) => (
                  <tr key={rsvp.id} className="transition-colors hover:bg-cream-100/50">
                    <td className="whitespace-nowrap px-4 py-4 align-top">
                      <span className="text-[14px] font-semibold text-ink-900">{rsvp.guest_name}</span>
                      <br />
                      <span className="font-data text-[14px] text-ink-400">
                        {rsvp.created_at ? new Date(rsvp.created_at).toLocaleDateString(language === 'en' ? "en-US" : "id-ID") : "-"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 align-top">
                      <StatusBadge status={rsvp.status} pax={rsvp.pax} />
                    </td>
                    <td className="max-w-xs break-words px-4 py-4 align-top">
                      <p className="text-[14px] italic text-ink-700">&ldquo;{rsvp.message}&rdquo;</p>
                      {rsvp.reply && (
                        <div className="mt-2 border-l-2 border-ember-500 bg-cream-100/70 p-2.5">
                          <p className="mb-1 font-data text-[14px] uppercase tracking-[0.06em] text-ember-600">
                            {t('customer.rsvp.yourReply')}
                          </p>
                          <p className="text-[14px] text-ink-600">{rsvp.reply}</p>
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-center align-top">
                      <button
                        type="button"
                        onClick={() => onDelete(rsvp.id)}
                        title={t('customer.rsvp.btnDelete')}
                        className="mx-auto grid h-8 w-8 place-items-center border border-danger-600/20 text-danger-600 transition-colors hover:bg-danger-600/[0.06]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && rows.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  labelClass = "text-ink-400",
  valueClass,
}: {
  label: string;
  value: number;
  labelClass?: string;
  valueClass: string;
}) {
  return (
    <div className="border border-ink-900/12 bg-cream-50 p-4">
      <p className={`font-data text-[14px] uppercase tracking-[0.06em] ${labelClass}`}>
        {label}
      </p>
      <p className={`mt-1.5 font-display text-3xl leading-none tracking-[-0.04em] ${valueClass}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status, pax }: { status: RsvpRow["status"]; pax: number }) {
  const { t } = useTranslation();

  if (status === "hadir") {
    return (
      <span className="flex w-fit items-center gap-1 border border-success-600/25 bg-success-600/[0.06] px-2 py-1 font-data text-[14px] uppercase tracking-[0.06em] text-success-700">
        <CheckCircle2 size={10} /> {t('customer.rsvp.statusAttending')} ({pax})
      </span>
    );
  }
  if (status === "tidak_hadir") {
    return (
      <span className="w-fit border border-danger-600/25 bg-danger-600/[0.06] px-2 py-1 font-data text-[14px] uppercase tracking-[0.06em] text-danger-600">
        {t('customer.rsvp.statusNotAttending')}
      </span>
    );
  }
  return (
    <span className="w-fit border border-gold-500/35 bg-gold-500/10 px-2 py-1 font-data text-[14px] uppercase tracking-[0.06em] text-gold-600">
      {t('customer.rsvp.statusUncertain')}
    </span>
  );
}
