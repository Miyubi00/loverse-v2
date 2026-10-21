// ============================================================
// src/components/customer/RsvpTab.tsx
// ------------------------------------------------------------
// Tab "Buku Tamu" dashboard mempelai: filter RSVP, statistik kehadiran, tabel ucapan, dan aksi balas/hapus.
// Dipakai di  : pages/CustomerDashboardPage.tsx
// Keterikatan : hooks/useRsvpTools, components/customer/RsvpReplyModal, components/shared/Pagination
// ============================================================

import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Download,
  MessageSquareReply,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import Pagination from "../shared/Pagination";
import RsvpReplyModal from "./RsvpReplyModal";
import Button from "../ui/Button";
import { useRsvpServer, type RsvpStatusFilter } from "../../hooks/useRsvpServer";
import { useRsvpTools } from "../../hooks/useRsvpTools";
import type { RsvpRow } from "../../types/database";
import { useTranslation } from "../../i18n";
import { cn } from "../../lib/cn";

interface RsvpTabProps {
  /** Order ID pemilik buku tamu (dari route /dashboard/:orderId). */
  orderId: string;
}

type StatusFilter = RsvpStatusFilter;

const INPUT_CLASS =
  "h-10 w-full border border-ink-900/15 bg-cream-50 px-3 text-[14px] font-medium text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-ember-500 focus:bg-white focus:ring-2 focus:ring-ember-500/15";

const LABEL_CLASS =
  "mb-1.5 flex items-center gap-1.5 font-data text-[14px] uppercase tracking-[0.06em] text-ink-500";

export default function RsvpTab({ orderId }: RsvpTabProps) {
  const { t, language } = useTranslation();
  const rsvp = useRsvpServer(orderId);
  const tools = useRsvpTools(orderId, {
    refresh: rsvp.refresh,
    getAllRows: rsvp.fetchAllForExport,
  });
  const {
    searchInput, setSearchInput,
    dateInput, setDateInput,
    statusInput, setStatusInput,
    applyFilters: handleApplyFilters,
    resetFilters: handleResetFilters,
    hasActiveFilter,
    rows, total, loading, stats,
    page, setPage, pageSize, setPageSize, totalPages,
  } = rsvp;
  const { replyText, setReplyText, handleReply, handleDeleteRsvp, downloadCSV } = tools;

  const { hadir, tidakHadir, ragu } = stats;
  const [activeReplyModal, setActiveReplyModal] = useState<RsvpRow | null>(null);

  const submitReplyAndClose = (rsvpId: string) => {
    void handleReply(rsvpId);
    setActiveReplyModal(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 border border-ink-900/12 bg-cream-50 [&>*]:border-b [&>*]:border-r [&>*:nth-child(2n)]:border-r-0 [&>*:nth-child(n+3)]:border-b-0 lg:grid-cols-4 lg:[&>*]:border-b-0 lg:[&>*:nth-child(2n)]:border-r lg:[&>*:nth-child(4n)]:border-r-0">
        <StatCell label={t("customer.rsvp.statTotal")} value={total} accent="text-ink-950" />
        <StatCell label={t("customer.rsvp.statAttending")} value={hadir} accent="text-success-700" />
        <StatCell label={t("customer.rsvp.statNotAttending")} value={tidakHadir} accent="text-danger-600" />
        <StatCell label={t("customer.rsvp.statUncertain")} value={ragu} accent="text-gold-600" />
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={downloadCSV}
          icon={<Download size={13} />}
        >
          {t("customer.rsvp.btnExport")}
        </Button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleApplyFilters();
        }}
        className="paper-panel flex flex-col gap-3 p-4 md:flex-row md:items-end"
      >
        <div className="min-w-[220px] flex-1">
          <label className={LABEL_CLASS}>
            <Search size={12} className="text-ember-600" />
            <span>{t("customer.rsvp.filterSearchLabel")}</span>
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-300" />
            <input
              type="text"
              placeholder={t("customer.rsvp.filterSearchPlaceholder")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={`${INPUT_CLASS} pl-9`}
            />
          </div>
        </div>

        <div className="min-w-[160px]">
          <label className={LABEL_CLASS}>
            <Calendar size={12} className="text-ember-600" />
            <span>{t("customer.rsvp.filterDateLabel")}</span>
          </label>
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div className="min-w-[160px]">
          <label className={LABEL_CLASS}>
            <Users size={12} className="text-ember-600" />
            <span>{t("customer.rsvp.filterStatusLabel")}</span>
          </label>
          <select
            value={statusInput}
            onChange={(e) => setStatusInput(e.target.value as StatusFilter)}
            className={INPUT_CLASS}
          >
            <option value="all">{t("customer.rsvp.statusAll")}</option>
            <option value="hadir">{t("customer.rsvp.statusAttending")}</option>
            <option value="tidak_hadir">{t("customer.rsvp.statusNotAttending")}</option>
            <option value="ragu">{t("customer.rsvp.statusUncertain")}</option>
          </select>
        </div>

        <div className="flex shrink-0 gap-2">
          {hasActiveFilter && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              icon={<Trash2 size={12} />}
              className="h-10 text-danger-600 hover:bg-danger-600/5 hover:text-danger-700"
            >
              {t("customer.rsvp.btnResetFilter")}
            </Button>
          )}
          <Button type="submit" size="sm" icon={<Search size={12} />} className="h-10 whitespace-nowrap">
            {t("customer.rsvp.btnSearch")}
          </Button>
        </div>
      </form>

      <div className="paper-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px] text-ink-600">
            <thead className="border-b border-ink-900/12 bg-cream-100 font-data text-[14px] uppercase tracking-[0.06em] text-ink-500">
              <tr>
                <th className="px-5 py-3.5 font-medium">{t("customer.rsvp.thGuest")}</th>
                <th className="px-4 py-3.5 font-medium">{t("customer.rsvp.thStatus")}</th>
                <th className="px-4 py-3.5 font-medium">{t("customer.rsvp.thMessage")}</th>
                <th className="px-4 py-3.5 text-center font-medium">{t("customer.rsvp.thAction")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/10">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-14 text-center font-data text-[14px] uppercase tracking-[0.06em] text-ink-400">
                    {t("common.loading")}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-14 text-center text-[14px] italic text-ink-400">
                    {hasActiveFilter ? t("customer.rsvp.emptyFiltered") : t("customer.rsvp.emptyDefault")}
                  </td>
                </tr>
              ) : (
                rows.map((rsvp) => (
                  <tr key={rsvp.id} className="align-top transition-colors hover:bg-cream-100/50">
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="text-[14px] font-semibold text-ink-900">{rsvp.guest_name}</span>
                      <br />
                      <span className="font-data text-[14px] uppercase tracking-[0.06em] text-ink-400">
                        {rsvp.created_at
                          ? new Date(rsvp.created_at).toLocaleDateString(language === "en" ? "en-US" : "id-ID")
                          : "-"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <StatusBadge status={rsvp.status} pax={rsvp.pax} />
                    </td>
                    <td className="max-w-xs px-4 py-4">
                      <p className="text-[14px] leading-relaxed text-ink-600">“{rsvp.message}”</p>
                      {rsvp.reply && (
                        <div className="mt-2 border-l-2 border-ember-500/40 bg-cream-100/70 px-3 py-2 text-[14px] leading-relaxed text-ink-600">
                          <span className="mb-0.5 block font-data text-[14px] uppercase tracking-[0.06em] text-ember-600">
                            {t("customer.rsvp.yourReply")}
                          </span>
                          {rsvp.reply}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyText((prev) => ({
                              ...prev,
                              [rsvp.id]: rsvp.reply || "",
                            }));
                            setActiveReplyModal(rsvp);
                          }}
                          className="inline-flex items-center gap-1.5 border border-ink-900/12 bg-cream-50 px-2.5 py-1.5 font-data text-[14px] uppercase tracking-[0.06em] text-ink-600 transition-colors hover:border-ink-900/30 hover:text-ink-900 active:translate-y-px"
                        >
                          <MessageSquareReply size={12} />
                          <span>{rsvp.reply ? t("customer.rsvp.btnEditReply") : t("customer.rsvp.btnReply")}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRsvp(rsvp.id)}
                          title={t("customer.rsvp.btnDelete")}
                          aria-label={t("customer.rsvp.btnDelete")}
                          className="grid h-8 w-8 place-items-center text-danger-600 transition-colors hover:bg-danger-600/[0.06] hover:text-danger-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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

      {activeReplyModal && (
        <RsvpReplyModal
          rsvp={activeReplyModal}
          replyText={replyText}
          setReplyText={setReplyText}
          onClose={() => setActiveReplyModal(null)}
          onSubmit={submitReplyAndClose}
        />
      )}
    </div>
  );
}

function StatCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="border-ink-900/10 p-4 sm:p-5">
      <p className={cn("font-display text-[clamp(2rem,4vw,3rem)] leading-none tracking-[-0.05em]", accent)}>
        {value}
      </p>
      <p className="mt-2 font-data text-[14px] uppercase tracking-[0.06em] text-ink-400">{label}</p>
    </div>
  );
}

function StatusBadge({
  status,
  pax,
}: {
  status: RsvpRow["status"];
  pax: number;
}) {
  const { t } = useTranslation();

  if (status === "hadir") {
    return (
      <span className="inline-flex w-fit items-center gap-1 border border-success-600/25 bg-success-600/[0.06] px-2 py-1 font-data text-[14px] uppercase tracking-[0.06em] text-success-700">
        <CheckCircle2 size={10} /> {t("customer.rsvp.statusAttending")} ({pax})
      </span>
    );
  }
  if (status === "tidak_hadir") {
    return (
      <span className="inline-flex w-fit border border-danger-600/25 bg-danger-600/[0.06] px-2 py-1 font-data text-[14px] uppercase tracking-[0.06em] text-danger-600">
        {t("customer.rsvp.statusNotAttending")}
      </span>
    );
  }
  return (
    <span className="inline-flex w-fit border border-gold-600/30 bg-gold-600/[0.07] px-2 py-1 font-data text-[14px] uppercase tracking-[0.06em] text-gold-600">
      {t("customer.rsvp.statusUncertain")}
    </span>
  );
}
