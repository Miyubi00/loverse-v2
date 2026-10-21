import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bot,
  Calendar,
  CreditCard,
  Cpu,
  Eye,
  EyeOff,
  Filter,
  Search,
  ShieldCheck,
  Trash2,
  User,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import type { ToastApi } from '../GlobalToast';
import { useTranslation } from '../../i18n';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../shared/Pagination';
import Button from '../ui/Button';

export interface AuditRow {
  id: number;
  actor_email: string | null;
  actor_kind: string;
  action: string;
  table_name: string;
  row_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

interface AuditTabProps {
  toast: ToastApi;
}

const KIND_STYLE: Record<string, { pill: string; icon: typeof User }> = {
  admin: { pill: 'text-ember-600 bg-peach-100 border-ember-500/30', icon: ShieldCheck },
  customer: { pill: 'text-ink-600 bg-cream-100 border-ink-900/15', icon: User },
  service: { pill: 'text-ink-600 bg-cream-100 border-ink-900/15', icon: Cpu },
  midtrans: { pill: 'text-success-700 bg-success-600/[0.06] border-success-600/25', icon: CreditCard },
  system: { pill: 'text-ink-600 bg-ink-600/[0.06] border-ink-600/20', icon: Bot },
};

/** Daftar aksi yang dikenal — dropdown agar tidak salah ketik. */
const ACTION_OPTIONS = [
  'insert',
  'update',
  'delete',
  'activate_order',
  'webhook_success',
  'webhook_failed',
  'webhook_duplicate',
  'webhook_ignored',
  'pending_expired',
];

function formatDateTime(iso: string, language: string): string {
  try {
    return new Date(iso).toLocaleString(language === 'en' ? 'en-US' : 'id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/** Kelompokkan baris berurutan: row_id sama dalam 10 detik = 1 kejadian
 * (mis. aktivasi manual: baris eksplisit + baris trigger). */
interface AuditGroup {
  key: string;
  rows: AuditRow[];
}

function groupRows(rows: AuditRow[]): AuditGroup[] {
  const groups: AuditGroup[] = [];
  for (const r of rows) {
    const last = groups[groups.length - 1];
    const prev = last?.rows[last.rows.length - 1];
    if (
      prev &&
      prev.row_id === r.row_id &&
      Math.abs(new Date(prev.created_at).getTime() - new Date(r.created_at).getTime()) <= 10_000
    ) {
      last.rows.push(r);
    } else {
      groups.push({ key: `${r.row_id}-${r.created_at}`, rows: [r] });
    }
  }
  return groups;
}

function actorLabel(r: AuditRow): string {
  if (r.actor_email) return r.actor_email;
  if (r.actor_kind === 'customer') {
    const d = (r.details ?? {}) as Record<string, unknown>;
    const slug = d.slug ?? d.slug_new;
    if (typeof slug === 'string' && slug) return slug;
    return r.row_id.slice(0, 8);
  }
  return r.actor_kind;
}

/** Ringkasan isi details per aksi — agar tabel padat berisi. */
function summarize(r: AuditRow, t: (key: string) => string): string[] {
  const d = (r.details ?? {}) as Record<string, unknown>;
  const str = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);
  const out: string[] = [];
  if (r.action === 'webhook_success' || r.action === 'webhook_failed') {
    const ts = str(d.transaction_status);
    if (ts) out.push(ts);
    const pm = str(d.payment_type);
    if (pm) out.push(pm);
    if (typeof d.email_sent === 'boolean') out.push(d.email_sent ? t('admin.auditEmailed') : t('admin.auditEmailFailed'));
  } else if (r.action === 'webhook_duplicate' || r.action === 'webhook_ignored') {
    const ts = str(d.transaction_status);
    if (ts) out.push(ts);
    const note = str(d.note);
    if (note) out.push(note);
  } else if (r.action === 'pending_expired') {
    const g = str(d.groom_name);
    const b = str(d.bride_name);
    if (g || b) out.push(`${g ?? '?'} & ${b ?? '?'}`);
  } else if (r.action === 'activate_order') {
    const s = str(d.slug);
    if (s) out.push(s);
    const src = str(d.source);
    if (src) out.push(src);
  } else if (r.action === 'update' && r.table_name === 'orders') {
    const o = str(d.template_slug_old);
    const n = str(d.template_slug_new);
    if (o || n) out.push(`${o ?? '-'} → ${n ?? '-'}`);
    const po = str(d.payment_status_old);
    const pn = str(d.payment_status_new);
    if (po && pn && po !== pn) out.push(`${po} → ${pn}`);
    if (d.pin_code_changed === true) out.push(t('admin.auditPinChanged'));
    if (Array.isArray(d.event_details_changed) && d.event_details_changed.length > 0) {
      out.push(`${t('admin.auditChangedPrefix')} ${(d.event_details_changed as unknown[]).slice(0, 3).join(', ')}`);
    }
  } else if (r.action === 'insert' && r.table_name === 'orders') {
    const s = str(d.template_slug);
    if (s) out.push(s);
    const ps = str(d.payment_status);
    if (ps) out.push(ps);
  } else if (r.table_name === 'pending_orders') {
    const s = str(d.template_slug) ?? str(d.status_new) ?? str(d.status);
    if (s) out.push(s);
  }
  return out.slice(0, 3);
}

export default function AuditTab({ toast }: AuditTabProps) {
  const { t, language } = useTranslation();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter toolbar (pola sama seperti OrdersTab: ketik -> Terapkan).
  const [kindInput, setKindInput] = useState('all');
  const [actionInput, setActionInput] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [applied, setApplied] = useState({ kind: 'all', action: '', search: '', date: '' });
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const fetchRows = useCallback(async () => {
    const { data, error } = await supabase
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) {
      toast.error(t('admin.auditLoadFail'));
      return;
    }
    setRows((data ?? []) as AuditRow[]);
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

  const hasActiveFilter =
    applied.kind !== 'all' || applied.action !== '' || applied.search !== '' || applied.date !== '';

  const filtered = useMemo(() => {
    const q = applied.search.trim().toLowerCase();
    return rows.filter((r) => {
      if (applied.kind !== 'all' && r.actor_kind !== applied.kind) return false;
      if (applied.action && r.action !== applied.action) return false;
      if (q) {
        const hay = `${r.actor_email ?? ''} ${r.row_id} ${JSON.stringify(r.details ?? {})}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (applied.date) {
        const day = new Date(r.created_at).toISOString().slice(0, 10);
        if (day !== applied.date) return false;
      }
      return true;
    });
  }, [rows, applied]);

  const groups = useMemo(() => groupRows(filtered), [filtered]);
  const pg = usePagination(groups, `${applied.kind}|${applied.action}|${applied.search}|${applied.date}`, 10);

  return (
    <div>
      <div className="mb-6">
        <p className="eyebrow text-ember-600">Control / Audit</p>
        <h2 className="mt-2 font-display text-[clamp(2rem,4vw,3.1rem)] leading-none tracking-[-0.05em] text-ink-950">
          {t('admin.auditTitle')}
        </h2>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-ink-500">{t('admin.auditSubtitle')}</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setApplied({ kind: kindInput, action: actionInput, search: searchInput, date: dateInput });
        }}
        className="mb-6 paper-panel flex flex-col gap-3 p-4 md:flex-row md:items-end"
      >
        <div className="min-w-[160px]">
          <label className="mb-1.5 flex items-center gap-1.5 font-data text-[14px] uppercase tracking-[0.06em] text-ink-500">
            <Filter size={12} className="text-ember-600" />
            <span>{t('admin.auditFilterKind')}</span>
          </label>
          <select
            value={kindInput}
            onChange={(e) => setKindInput(e.target.value)}
            className="h-10 w-full border border-ink-900/15 bg-cream-50 px-3 text-[14px] font-medium text-ink-900 outline-none transition focus:border-ember-500 focus:bg-white focus:ring-2 focus:ring-ember-500/15"
          >
            <option value="all">{t('admin.auditKindAll')}</option>
            <option value="admin">admin</option>
            <option value="customer">customer</option>
            <option value="service">service</option>
            <option value="midtrans">midtrans</option>
            <option value="system">system</option>
          </select>
        </div>

        <div className="min-w-[170px]">
          <label className="mb-1.5 flex items-center gap-1.5 font-data text-[14px] uppercase tracking-[0.06em] text-ink-500">
            <Filter size={12} className="text-ember-600" />
            <span>{t('admin.auditFilterAction')}</span>
          </label>
          <select
            value={actionInput}
            onChange={(e) => setActionInput(e.target.value)}
            className="h-10 w-full border border-ink-900/15 bg-cream-50 px-3 text-[14px] font-medium text-ink-900 outline-none transition focus:border-ember-500 focus:bg-white focus:ring-2 focus:ring-ember-500/15"
          >
            <option value="">{t('admin.auditActionAll')}</option>
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[220px] flex-1">
          <label className="mb-1.5 flex items-center gap-1.5 font-data text-[14px] uppercase tracking-[0.06em] text-ink-500">
            <Search size={12} className="text-ember-600" />
            <span>{t('admin.auditSearchPh')}</span>
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-300" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('admin.auditSearchPh')}
              className="h-10 w-full border border-ink-900/15 bg-cream-50 pl-9 pr-3 text-[14px] font-medium text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-ember-500 focus:bg-white focus:ring-2 focus:ring-ember-500/15"
            />
          </div>
        </div>

        <div className="min-w-[160px]">
          <label className="mb-1.5 flex items-center gap-1.5 font-data text-[14px] uppercase tracking-[0.06em] text-ink-500">
            <Calendar size={12} className="text-ember-600" />
            <span>{t('admin.dateFilterLabel')}</span>
          </label>
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className="h-10 w-full border border-ink-900/15 bg-cream-50 px-3 text-[14px] font-medium text-ink-900 outline-none transition focus:border-ember-500 focus:bg-white focus:ring-2 focus:ring-ember-500/15"
          />
        </div>

        <div className="flex shrink-0 gap-1.5">
          {hasActiveFilter && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setKindInput('all');
                setActionInput('');
                setSearchInput('');
                setDateInput('');
                setApplied({ kind: 'all', action: '', search: '', date: '' });
              }}
              icon={<Trash2 size={12} />}
              className="h-10 text-danger-600 hover:bg-danger-600/5 hover:text-danger-700"
            >
              {t('admin.btnResetFilter')}
            </Button>
          )}
          <Button type="submit" size="sm" icon={<Search size={12} />} className="h-10 whitespace-nowrap">
            {t('admin.btnSearch')}
          </Button>
        </div>
      </form>

      {loading ? (
        <div className="paper-panel px-6 py-12 text-center font-data text-[14px] uppercase tracking-[0.06em] text-ink-400">
          {t('common.loading')}
        </div>
      ) : pg.total === 0 ? (
        <div className="paper-panel px-6 py-12 text-center text-[14px] italic text-ink-400">
          {t('admin.auditEmpty')}
        </div>
      ) : (
        <div className="paper-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px] text-ink-600">
              <thead className="border-b border-ink-900/12 bg-cream-100">
                <tr>
                  <th className="px-4 py-3.5 font-data text-[14px] font-medium uppercase tracking-[0.06em] text-ink-500">{t('admin.auditThTime')}</th>
                  <th className="px-4 py-3.5 font-data text-[14px] font-medium uppercase tracking-[0.06em] text-ink-500">{t('admin.auditThActor')}</th>
                  <th className="px-4 py-3.5 font-data text-[14px] font-medium uppercase tracking-[0.06em] text-ink-500">{t('admin.auditThAction')}</th>
                  <th className="px-4 py-3.5 font-data text-[14px] font-medium uppercase tracking-[0.06em] text-ink-500">{t('admin.auditThSummary')}</th>
                  <th className="px-4 py-3.5 font-data text-[14px] font-medium uppercase tracking-[0.06em] text-ink-500">{t('admin.auditThTarget')}</th>
                  <th className="px-4 py-3.5 text-center font-data text-[14px] font-medium uppercase tracking-[0.06em] text-ink-500">{t('admin.auditThDetail')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-900/10">
                {pg.pageItems.map((g) => {
                  const main = g.rows[0];
                  const style = KIND_STYLE[main.actor_kind] ?? KIND_STYLE.service;
                  const Icon = style.icon;
                  const isOpen = !!open[g.key];
                  return (
                    <Fragment key={g.key}>
                      <tr key={g.key} className="transition-colors hover:bg-cream-100/50">
                        <td className="px-4 py-4 font-data text-[14px] text-ink-500">
                          {formatDateTime(main.created_at, language)}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex w-fit items-center gap-1 border px-2 py-1 font-data text-[14px] uppercase tracking-[0.06em] ${style.pill}`}>
                            <Icon size={11} /> {main.actor_kind}
                          </span>
                          <div className="mt-1 max-w-[220px] truncate text-[14px] text-ink-400">{actorLabel(main)}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="border border-ink-900/12 bg-cream-100 px-2 py-1 font-data text-[14px] text-ink-600">
                            {main.action}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="max-w-[260px] space-y-1">
                            {summarize(main, t).length === 0 ? (
                              <span className="text-ink-300">—</span>
                            ) : (
                              summarize(main, t).map((s, i) => (
                                <p key={i} className="truncate text-[14px] font-medium text-ink-600" title={s}>
                                  {s}
                                </p>
                              ))
                            )}
                            {g.rows.length > 1 && (
                              <p className="font-data text-[14px] text-ink-400">
                                +{g.rows.length - 1} {t('admin.auditGrouped')}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="mb-1 block font-data text-[14px] text-ink-400">#{main.row_id.slice(0, 8)}</span>
                          <span className="border border-ink-900/12 bg-cream-100 px-2 py-1 font-data text-[14px] text-ink-600">
                            {main.table_name}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => setOpen((p) => ({ ...p, [g.key]: !p[g.key] }))}
                            className="grid h-8 w-8 place-items-center border border-ink-900/12 text-ink-500 transition-colors hover:border-ink-900/30 hover:text-ink-900"
                            title={isOpen ? t('admin.auditHideDetail') : t('admin.auditShowDetail')}
                          >
                            {isOpen ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr key={`${g.key}-detail`} className="bg-cream-100/50">
                          <td colSpan={6} className="space-y-2 p-4">
                            {g.rows.map((r) => (
                              <div key={r.id} className="border border-ink-900/10 bg-cream-50 p-3 text-[14px]">
                                <p className="font-semibold text-ink-800">
                                  {r.action}{' '}
                                  <span className="font-normal text-ink-400">
                                    · {r.table_name} · {r.row_id.slice(0, 13)}
                                  </span>
                                </p>
                                <p className="mt-0.5 text-ink-500">
                                  {actorLabel(r)} · {formatDateTime(r.created_at, language)}
                                </p>
                                <pre className="mt-2 overflow-x-auto bg-ink-950 p-2.5 font-data text-[14px] leading-relaxed text-cream-100">
                                  {JSON.stringify(r.details ?? {}, null, 2)}
                                </pre>
                              </div>
                            ))}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={pg.page}
            totalPages={pg.totalPages}
            total={pg.total}
            pageSize={pg.pageSize}
            onPageChange={pg.setPage}
            onPageSizeChange={pg.setPageSize}
          />
        </div>
      )}
    </div>
  );
}
