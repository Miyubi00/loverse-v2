// ============================================================
// src/components/admin/NoticesTab.tsx
// ------------------------------------------------------------
// Tab admin "Banner & Notice": CRUD pengumuman situs (promo /
// maintenance / info) yang tampil otomatis di halaman beranda
// sebagai banner dan/atau modal popup, aktif via rentang waktu.
// Keterikatan : lib/supabaseClient (site_notices), i18n, ConfirmDialog
// via prop confirmAction, GlobalToast via prop toast.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { Calendar, Megaphone, Pencil, Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import type { SiteNoticeMode, SiteNoticeRow, SiteNoticeType } from '../../types/database';
import type { ToastApi } from '../GlobalToast';
import Button from '../ui/Button';
import { useTranslation } from '../../i18n';

interface NoticesTabProps {
  toast: ToastApi;
  confirmAction: (title: string, message: string, isDanger: boolean, onConfirm: () => void) => void;
}

interface NoticeFormState {
  type: SiteNoticeType;
  mode: SiteNoticeMode;
  title: string;
  body: string;
  cta_label: string;
  cta_href: string;
  /** nilai input datetime-local (waktu lokal perangkat) */
  starts_at: string;
  /** nilai input datetime-local; '' = tanpa batas waktu */
  ends_at: string;
}

const INPUT_CLASS =
  'h-10 w-full border border-ink-900/15 bg-cream-50 px-3 text-[14px] font-medium text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-ember-500 focus:bg-white focus:ring-2 focus:ring-ember-500/15';

const TEXTAREA_CLASS =
  'w-full border border-ink-900/15 bg-cream-50 px-3 py-2.5 text-[14px] font-medium leading-relaxed text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-ember-500 focus:bg-white focus:ring-2 focus:ring-ember-500/15';

const LABEL_CLASS =
  'mb-1.5 flex items-center gap-1.5 font-data text-[14px] uppercase tracking-[0.06em] text-ink-500';

const TYPE_STYLE: Record<SiteNoticeType, string> = {
  info: 'border-ink-900/15 bg-cream-100 text-ink-600',
  warning: 'border-gold-500/35 bg-gold-500/10 text-gold-600',
  promo: 'border-ember-500/30 bg-peach-100 text-ember-600',
  maintenance: 'border-danger-600/25 bg-danger-600/[0.06] text-danger-600',
};

type StatusKey = 'live' | 'scheduled' | 'ended' | 'inactive';

const STATUS_STYLE: Record<StatusKey, string> = {
  live: 'border-success-600/25 bg-success-600/[0.06] text-success-700',
  scheduled: 'border-ember-500/30 bg-peach-100 text-ember-600',
  ended: 'border-ink-900/12 bg-cream-100 text-ink-400',
  inactive: 'border-danger-600/25 bg-danger-600/[0.06] text-danger-600',
};

const TYPE_LABEL_KEY: Record<SiteNoticeType, string> = {
  info: 'admin.noticesTypeInfo',
  warning: 'admin.noticesTypeWarning',
  promo: 'admin.noticesTypePromo',
  maintenance: 'admin.noticesTypeMaintenance',
};

/** ISO -> value untuk <input type="datetime-local"> (waktu lokal). */
function toLocalInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** value datetime-local -> ISO untuk dikirim ke database. */
function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function deriveStatus(n: SiteNoticeRow): StatusKey {
  if (!n.is_active) return 'inactive';
  const now = Date.now();
  if (new Date(n.starts_at).getTime() > now) return 'scheduled';
  if (n.ends_at && new Date(n.ends_at).getTime() < now) return 'ended';
  return 'live';
}

function formatSchedule(row: SiteNoticeRow, language: string): { start: string; end: string } {
  const fmt = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(language === 'en' ? 'en-US' : 'id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };
  return { start: fmt(row.starts_at), end: row.ends_at ? fmt(row.ends_at) : '—' };
}

const emptyForm = (): NoticeFormState => ({
  type: 'info',
  mode: 'banner',
  title: '',
  body: '',
  cta_label: '',
  cta_href: '',
  starts_at: toLocalInput(new Date().toISOString()),
  ends_at: '',
});

export default function NoticesTab({ toast, confirmAction }: NoticesTabProps) {
  const { t, language } = useTranslation();
  const [rows, setRows] = useState<SiteNoticeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<NoticeFormState>(emptyForm);

  const fetchRows = useCallback(async () => {
    const { data, error } = await supabase
      .from('site_notices')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error(t('admin.noticesLoadFail'));
      return;
    }
    setRows((data ?? []) as SiteNoticeRow[]);
  }, [toast, t]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      await fetchRows();
      if (mounted) setLoading(false);
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [fetchRows]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (row: SiteNoticeRow) => {
    setEditingId(row.id);
    setForm({
      type: row.type,
      mode: row.mode,
      title: row.title,
      body: row.body ?? '',
      cta_label: row.cta_label ?? '',
      cta_href: row.cta_href ?? '',
      starts_at: toLocalInput(row.starts_at),
      ends_at: toLocalInput(row.ends_at),
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    const title = form.title.trim();
    if (!title) return toast.error(t('admin.noticesTitleRequired'));

    const startsAt = fromLocalInput(form.starts_at) ?? new Date().toISOString();
    const endsAt = fromLocalInput(form.ends_at);
    if (endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      return toast.error(t('admin.noticesEndBeforeStart'));
    }

    const payload = {
      type: form.type,
      mode: form.mode,
      title,
      body: form.body.trim(),
      cta_label: form.cta_label.trim() || null,
      cta_href: form.cta_href.trim() || null,
      starts_at: startsAt,
      ends_at: endsAt,
      updated_at: new Date().toISOString(),
    };

    setSaving(true);
    const { error } = editingId
      ? await supabase.from('site_notices').update(payload).eq('id', editingId)
      : await supabase.from('site_notices').insert(payload);
    setSaving(false);

    if (error) return toast.error(t('admin.noticesSaveFailed', { error: error.message }));
    toast.success(t('admin.noticesSaved'));
    closeForm();
    void fetchRows();
  };

  const handleToggleActive = async (row: SiteNoticeRow) => {
    const { count, error } = await supabase
      .from('site_notices')
      .update({ is_active: !row.is_active, updated_at: new Date().toISOString() }, { count: 'exact' })
      .eq('id', row.id);
    if (!error && (count ?? 0) > 0) {
      toast.success(t('admin.noticesStatusUpdated'));
      void fetchRows();
    } else if (!error) {
      toast.error(t('admin.noticesStatusUpdateFailed'));
    } else {
      toast.error(t('admin.noticesStatusUpdateFailed'));
    }
  };

  const handleDelete = (row: SiteNoticeRow) => {
    confirmAction(
      t('admin.noticesDeleteTitle'),
      t('admin.noticesDeleteConfirm', { title: row.title }),
      true,
      async () => {
        const { count, error } = await supabase
          .from('site_notices')
          .delete({ count: 'exact' })
          .eq('id', row.id);
        if (!error && (count ?? 0) > 0) {
          toast.success(t('admin.noticesDeleted'));
          void fetchRows();
        } else {
          toast.error(t('admin.noticesDeleteFailed'));
        }
      },
    );
  };

  const statusLabel: Record<StatusKey, string> = {
    live: t('admin.noticesStatusLive'),
    scheduled: t('admin.noticesStatusScheduled'),
    ended: t('admin.noticesStatusEnded'),
    inactive: t('admin.noticesStatusInactive'),
  };

  const modeLabel = (mode: SiteNoticeMode) =>
    mode === 'modal'
      ? t('admin.noticesModeModal')
      : mode === 'both'
        ? t('admin.noticesModeBoth')
        : t('admin.noticesModeBanner');

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-ember-600">Control / Broadcast</p>
          <h2 className="mt-2 font-display text-[clamp(2rem,4vw,3.1rem)] leading-none tracking-[-0.05em] text-ink-950">
            {t('admin.noticesTitle')}
          </h2>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-ink-500">{t('admin.noticesSubtitle')}</p>
        </div>
        {!formOpen && (
          <Button type="button" onClick={openCreate} size="sm" icon={<Plus size={14} />}>
            {t('admin.noticesNew')}
          </Button>
        )}
      </div>

      {formOpen && (
        <div className="mb-6 paper-panel p-4 sm:p-5">
          <h3 className="mb-5 flex items-center gap-2 border-b border-ink-900/10 pb-3 font-display text-xl tracking-[-0.03em] text-ink-950">
            <Megaphone size={16} className="text-ember-600" />
            {editingId ? t('admin.noticesBtnEdit') : t('admin.noticesNew')}
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>
                <span>{t('admin.noticesTypeLabel')}</span>
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as SiteNoticeType }))}
                className={INPUT_CLASS}
              >
                <option value="info">{t('admin.noticesTypeInfo')}</option>
                <option value="warning">{t('admin.noticesTypeWarning')}</option>
                <option value="promo">{t('admin.noticesTypePromo')}</option>
                <option value="maintenance">{t('admin.noticesTypeMaintenance')}</option>
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>
                <span>{t('admin.noticesModeLabel')}</span>
              </label>
              <select
                value={form.mode}
                onChange={(e) => setForm((p) => ({ ...p, mode: e.target.value as SiteNoticeMode }))}
                className={INPUT_CLASS}
              >
                <option value="banner">{t('admin.noticesModeBanner')}</option>
                <option value="modal">{t('admin.noticesModeModal')}</option>
                <option value="both">{t('admin.noticesModeBoth')}</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className={LABEL_CLASS}>
                <span>{t('admin.noticesTitleLabel')}</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder={t('admin.noticesTitlePh')}
                className={INPUT_CLASS}
              />
            </div>

            <div className="md:col-span-2">
              <label className={LABEL_CLASS}>
                <span>{t('admin.noticesBodyLabel')}</span>
              </label>
              <textarea
                value={form.body}
                onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                placeholder={t('admin.noticesBodyPh')}
                rows={4}
                className={TEXTAREA_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>
                <span>{t('admin.noticesCtaLabelLabel')}</span>
              </label>
              <input
                type="text"
                value={form.cta_label}
                onChange={(e) => setForm((p) => ({ ...p, cta_label: e.target.value }))}
                placeholder={t('admin.noticesCtaPh')}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>
                <span>{t('admin.noticesCtaHrefLabel')}</span>
              </label>
              <input
                type="text"
                value={form.cta_href}
                onChange={(e) => setForm((p) => ({ ...p, cta_href: e.target.value }))}
                placeholder={t('admin.noticesCtaHrefPh')}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>
                <Calendar size={12} className="text-ember-600" />
                <span>{t('admin.noticesStartLabel')}</span>
              </label>
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm((p) => ({ ...p, starts_at: e.target.value }))}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>
                <Calendar size={12} className="text-ember-600" />
                <span>{t('admin.noticesEndLabel')}</span>
              </label>
              <input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm((p) => ({ ...p, ends_at: e.target.value }))}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-ink-900/10 pt-4">
            <Button type="button" variant="secondary" size="sm" onClick={closeForm}>
              {t('common.cancel')}
            </Button>
            <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="paper-panel px-6 py-12 text-center font-data text-[14px] uppercase tracking-[0.06em] text-ink-400">
          {t('common.loading')}
        </div>
      ) : rows.length === 0 ? (
        <div className="paper-panel px-6 py-12 text-center text-[14px] italic text-ink-400">
          {t('admin.noticesEmpty')}
        </div>
      ) : (
        <div className="paper-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px] text-ink-600">
              <thead className="border-b border-ink-900/12 bg-cream-100">
                <tr>
                  <th className="px-4 py-3.5 font-data text-[14px] font-medium uppercase tracking-[0.06em] text-ink-500">{t('admin.noticesThNotice')}</th>
                  <th className="px-4 py-3.5 font-data text-[14px] font-medium uppercase tracking-[0.06em] text-ink-500">{t('admin.noticesThMode')}</th>
                  <th className="px-4 py-3.5 font-data text-[14px] font-medium uppercase tracking-[0.06em] text-ink-500">{t('admin.noticesThSchedule')}</th>
                  <th className="px-4 py-3.5 text-center font-data text-[14px] font-medium uppercase tracking-[0.06em] text-ink-500">{t('admin.noticesThStatus')}</th>
                  <th className="px-4 py-3.5 text-center font-data text-[14px] font-medium uppercase tracking-[0.06em] text-ink-500">{t('admin.noticesThActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-900/10">
                {rows.map((row) => {
                  const status = deriveStatus(row);
                  const schedule = formatSchedule(row, language);
                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors ${row.is_active ? 'hover:bg-cream-100/50' : 'bg-cream-100/40 opacity-70'}`}
                    >
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex w-fit items-center border px-2 py-0.5 font-data text-[14px] uppercase tracking-[0.06em] ${TYPE_STYLE[row.type] ?? TYPE_STYLE.info}`}
                        >
                          {t(TYPE_LABEL_KEY[row.type])}
                        </span>
                        <div className="mt-1.5 max-w-[320px] font-display text-lg leading-tight tracking-[-0.03em] text-ink-950">{row.title}</div>
                        {row.body && (
                          <div className="mt-1 max-w-[320px] truncate text-[14px] text-ink-400" title={row.body}>
                            {row.body}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="border border-ink-900/12 bg-cream-100 px-2 py-1 font-data text-[14px] uppercase tracking-[0.06em] text-ink-600">
                          {modeLabel(row.mode)}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-data text-[14px] text-ink-500">
                        <div>{schedule.start}</div>
                        <div className="mt-1 text-ink-400">→ {schedule.end}</div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex items-center border px-2.5 py-1 font-data text-[14px] uppercase tracking-[0.06em] ${STATUS_STYLE[status]}`}
                        >
                          {statusLabel[status]}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            title={t('admin.noticesBtnEdit')}
                            className="grid h-8 w-8 place-items-center border border-ink-900/12 text-ink-500 transition-colors hover:border-ember-500/40 hover:bg-ember-500/[0.06] hover:text-ember-600"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(row)}
                            title={row.is_active ? t('admin.statusInactive') : t('admin.statusActive')}
                            className={`grid h-8 w-8 place-items-center border transition-colors ${
                              row.is_active
                                ? 'border-success-600/25 bg-success-600/[0.06] text-success-700 hover:bg-success-600/10'
                                : 'border-ink-900/12 bg-cream-100 text-ink-400 hover:text-ink-700'
                            }`}
                          >
                            {row.is_active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row)}
                            title={t('common.delete')}
                            className="grid h-8 w-8 place-items-center border border-danger-600/20 text-danger-600 transition-colors hover:bg-danger-600/[0.06]"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
