import { useState } from "react";
import { Calendar, CheckCircle, Clock, Edit, Eye, Filter, Loader2, Search, Trash2, XCircle } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { supabase } from "../../lib/supabaseClient";
import type { OrderRow, PendingOrderRow } from "../../types/database";
import type { ToastApi } from "../GlobalToast";
import Pagination from "../shared/Pagination";
import Button from "../ui/Button";
import { buttonClass } from "../ui/buttonStyles";
import { usePagination } from "../../hooks/usePagination";
import { useOrdersPaged } from "../../hooks/useAdminData";
import { useTranslation } from "../../i18n";

interface OrdersTabProps {
  /** Daftar pesanan SERVER-SIDE: filter + pagination dieksekusi database. */
  ordersSrv: ReturnType<typeof useOrdersPaged>;
  pendingOrders: PendingOrderRow[];
  confirmAction: (title: string, message: string, isDanger: boolean, onConfirm: () => void) => void;
  /** Refresh gabungan: pending/templates (katalog) + halaman orders aktif. */
  fetchData: () => Promise<void>;
  toast: ToastApi;
  /** Filter tampilan: "all" = orders+pending, "orders" = aktif saja, "pending" = WhatsApp saja */
  viewMode?: "all" | "orders" | "pending";
  /** Dipanggil saat tombol Edit ditekan; parent mengatur halaman edit full */
  onEditOrder?: (order: OrderRow) => void;
}

const INPUT_CLASS =
  "h-10 w-full border border-ink-900/15 bg-cream-50 px-3 text-[12px] font-medium text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-ember-500 focus:bg-white focus:ring-2 focus:ring-ember-500/15";

const LABEL_CLASS =
  "mb-1.5 flex items-center gap-1.5 font-data text-[8px] uppercase tracking-[0.16em] text-ink-500";

const TH_CLASS =
  "px-4 py-3.5 font-data text-[8px] font-medium uppercase tracking-[0.14em] text-ink-500";

export default function OrdersTab({
  ordersSrv,
  pendingOrders,
  confirmAction,
  fetchData,
  toast,
  viewMode = "all",
  onEditOrder,
}: OrdersTabProps) {
  const { t, language } = useTranslation();
  const {
    searchInput, setSearchInput,
    dateInput, setDateInput,
    paymentInput, setPaymentInput,
    applyFilters: handleApplyFilters,
    resetFilters: handleResetFilters,
    hasActiveFilter,
    applied,
    rows: ordersRows, total: ordersTotal, loading: ordersLoading,
    page: ordersPage, setPage: setOrdersPage,
    pageSize: ordersPageSize, setPageSize: setOrdersPageSize,
    totalPages: ordersTotalPages,
  } = ordersSrv;

  const [activatingId, setActivatingId] = useState<string | null>(null);

  const handleApprovePending = (pendingOrder: PendingOrderRow) => {
    confirmAction(
      "Aktifkan Pesanan?",
      `Pesanan atas nama ${pendingOrder.groom_name} & ${pendingOrder.bride_name} akan diaktifkan. PIN 6 digit otomatis dikirim ke ${pendingOrder.email || "email pelanggan"}.`,
      false,
      async () => {
        setActivatingId(pendingOrder.id);
        try {
          const { data, error } = await supabase.functions.invoke("activate-pending-order", {
            body: { pending_id: pendingOrder.id },
          });

          if (error) throw new Error(error.message);
          if (data?.error) throw new Error(data.error);

          if (data?.email_sent) {
            toast.success(t("toast.orderActivePinSent", { email: data.order.email }));
          } else if (data?.pin) {
            toast.warning(`PIN: ${data.pin}`);
          } else {
            toast.success(t("toast.orderActiveSuccess"));
          }
          fetchData();
        } catch (err) {
          console.error("[OrdersTab] Aktivasi gagal:", err);
          toast.error(t("toast.activateFailed", { error: err instanceof Error ? err.message : String(err) }));
        } finally {
          setActivatingId(null);
        }
      },
    );
  };

  const handleRejectPending = (id: string) => {
    confirmAction("Tolak & Hapus Pesanan?", "Pesanan ini akan ditolak dan dihapus secara permanen.", true,
      async () => {
        const { count, error } = await supabase
          .from("pending_orders")
          .delete({ count: "exact" })
          .eq("id", id);
        if (!error && (count ?? 0) > 0) {
          toast.success(t("toast.orderRejectedDeleted"));
          fetchData();
        } else if (!error) {
          toast.error(t("toast.deleteNoChangeReload"));
        } else {
          toast.error(t("toast.deleteFailed", { error: error.message }));
        }
      },
    );
  };

  const openDeleteDialog = (id: string) => {
    confirmAction("Hapus Data Permanen?", "Data undangan ini akan dihapus selamanya. Tindakan ini tidak bisa dibatalkan.", true,
      async () => {
        const { data, error } = await supabase.rpc("delete_order_cascade", { p_order_id: id });

        if (error) {
          toast.error(t("toast.deleteFailed", { error: error.message }));
          return;
        }

        const result = data as { orders_deleted?: number; rsvps_deleted?: number } | null;
        if (!result || (result.orders_deleted ?? 0) === 0) {
          toast.error(t("toast.deleteNoChangeReload"));
          return;
        }

        toast.success(t("toast.bulkDeletedSuccess", { orders: result.orders_deleted ?? 0, rsvps: result.rsvps_deleted ?? 0 }));
        supabase.functions
          .invoke("r2-delete", { body: { orderId: id, purgeFolder: true } })
          .catch((e) => console.warn("[OrdersTab] Cleanup folder gagal:", e));
        fetchData();
      },
    );
  };

  const calculateDuration = (dateString?: string) => {
    // eslint-disable-next-line react-hooks/purity
    const target = dateString ? new Date(dateString).getTime() : Date.now();
    // eslint-disable-next-line react-hooks/purity
    const diff = Math.abs(Date.now() - target);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const filteredPending = pendingOrders.filter((o) => {
    const q = applied.search.toLowerCase();
    const matchSearch = !q || o.groom_name?.toLowerCase().includes(q) || o.bride_name?.toLowerCase().includes(q);
    const matchDate = !applied.date || (o.created_at && new Date(o.created_at).toISOString().slice(0, 10) === applied.date);
    return matchSearch && matchDate;
  });

  const pendingPg = usePagination(filteredPending, `${applied.search}|${applied.date}`);

  const showPending = viewMode === "all" || viewMode === "pending";
  const showOrders = viewMode === "all" || viewMode === "orders";

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-ember-600">
            {viewMode === "pending" ? "Inbox / WhatsApp" : "Control / Orders"}
          </p>
          <h2 className="mt-2 font-display text-[clamp(2rem,4vw,3.1rem)] leading-none tracking-[-0.05em] text-ink-950">
            {viewMode === "pending" ? t("admin.whatsappTitle") : t("admin.ordersTitle")}
          </h2>
          <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-ink-500">
            {viewMode === "pending" ? t("admin.whatsappSubtitle") : t("admin.ordersSubtitle")}
          </p>
        </div>
        {showOrders && (
          <p className="font-data text-[9px] uppercase tracking-[0.14em] text-ink-400">
            {ordersTotal.toLocaleString("id-ID")} {t("admin.thCoupleDate")}
          </p>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); handleApplyFilters(); }}
        className="mb-6 paper-panel flex flex-col gap-3 p-4 md:flex-row md:items-end"
      >
        <div className="min-w-[220px] flex-1">
          <label className={LABEL_CLASS}>
            <Search size={12} className="text-ember-600" />
            <span>{t("admin.searchLabel")}</span>
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder={t("admin.searchPlaceholder")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={`${INPUT_CLASS} pl-9`}
            />
          </div>
        </div>

        <div className="min-w-[160px]">
          <label className={LABEL_CLASS}>
            <Calendar size={12} className="text-ember-600" />
            <span>{t("admin.dateFilterLabel")}</span>
          </label>
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        {showOrders && (
          <div className="min-w-[160px]">
            <label className={LABEL_CLASS}>
              <Filter size={12} className="text-ember-600" />
              <span>{t("admin.paymentFilterLabel")}</span>
            </label>
            <select
              value={paymentInput}
              onChange={(e) => setPaymentInput(e.target.value as typeof paymentInput)}
              className={INPUT_CLASS}
            >
              <option value="all">{t("admin.paymentAll")}</option>
              <option value="success">{t("admin.paymentSuccess")}</option>
              <option value="pending">{t("admin.paymentPending")}</option>
              <option value="failed">{t("admin.paymentFailed")}</option>
            </select>
          </div>
        )}

        <div className="flex shrink-0 gap-1.5">
          {hasActiveFilter && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              icon={<Trash2 size={12} />}
              className="h-10 text-danger-600 hover:bg-danger-600/5 hover:text-danger-700"
            >
              {t("admin.btnResetFilter")}
            </Button>
          )}
          <Button type="submit" size="sm" icon={<Search size={12} />} className="h-10 whitespace-nowrap">
            {t("admin.btnSearch")}
          </Button>
        </div>
      </form>

      {showPending && (
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <p className="eyebrow text-ink-400">WhatsApp / Pending</p>
            <span className="font-data text-[9px] text-ink-400">{filteredPending.length}</span>
          </div>
          {filteredPending.length === 0 ? (
            <div className="paper-panel px-6 py-10 text-center text-[12px] italic text-ink-400">
              {t("admin.noDataFound")}
            </div>
          ) : (
            <div className="paper-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px] text-ink-600">
                  <thead className="border-b border-ink-900/12 bg-cream-100">
                    <tr>
                      <th className={TH_CLASS}>{t("admin.thOrderDate")}</th>
                      <th className={TH_CLASS}>{t("admin.thCouple")}</th>
                      <th className={TH_CLASS}>{t("admin.thTemplate")}</th>
                      <th className={TH_CLASS}>{t("admin.thContact")}</th>
                      <th className={`${TH_CLASS} text-center`}>{t("admin.thAction")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-900/10">
                    {pendingPg.pageItems.map((order) => (
                      <tr key={order.id} className="transition-colors hover:bg-cream-100/50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="font-data text-[9px] text-ink-400">
                            {(order.created_at ? new Date(order.created_at) : new Date()).toLocaleDateString(language === "en" ? "en-US" : "id-ID")}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-display text-lg leading-tight tracking-[-0.03em] text-ink-950">
                            {order.groom_name} & {order.bride_name}
                          </div>
                          <div className="mt-1 text-[10px] text-ink-400">Acara: {order.wedding_date}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="border border-ink-900/12 bg-cream-100 px-2 py-1 font-data text-[9px] text-ink-600">
                            {order.template_slug}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <a
                            href={`https://wa.me/${order.whatsapp.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 border border-success-600/25 bg-success-600/[0.06] px-2.5 py-1.5 font-data text-[8px] uppercase tracking-[0.1em] text-success-700 transition-colors hover:bg-success-600/10"
                          >
                            <FaWhatsapp className="h-3 w-3" /> {t("admin.btnChatCustomer")}
                          </a>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleApprovePending(order)}
                              disabled={activatingId === order.id}
                              className="bg-success-600 border-success-600 hover:bg-success-700 hover:border-success-700"
                            >
                              {activatingId === order.id ? (
                                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("admin.btnProcessing")}</>
                              ) : (
                                <><CheckCircle className="h-3.5 w-3.5" /> {t("admin.btnActivate")}</>
                              )}
                            </Button>
                            <button
                              type="button"
                              onClick={() => handleRejectPending(order.id)}
                              aria-label="Tolak / Hapus"
                              title="Tolak / Hapus"
                              className="grid h-9 w-9 place-items-center border border-ink-900/12 text-ink-400 transition-colors hover:border-danger-600/30 hover:bg-danger-600/[0.06] hover:text-danger-600"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={pendingPg.page}
                totalPages={pendingPg.totalPages}
                total={pendingPg.total}
                pageSize={pendingPg.pageSize}
                onPageChange={pendingPg.setPage}
                onPageSizeChange={pendingPg.setPageSize}
              />
            </div>
          )}
        </section>
      )}

      {showOrders && (
        <section>
          {ordersLoading ? (
            <div className="paper-panel px-6 py-10 text-center font-data text-[9px] uppercase tracking-[0.14em] text-ink-400">
              {t("common.loading")}
            </div>
          ) : ordersRows.length === 0 ? (
            <div className="paper-panel px-6 py-10 text-center text-[12px] italic text-ink-400">
              {hasActiveFilter ? t("admin.noDataFound") : t("admin.noOrdersYet")}
            </div>
          ) : (
            <div className="paper-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px] text-ink-600">
                  <thead className="border-b border-ink-900/12 bg-cream-100">
                    <tr>
                      <th className={TH_CLASS}>{t("admin.thOrderInfo")}</th>
                      <th className={TH_CLASS}>{t("admin.thCoupleDate")}</th>
                      <th className={TH_CLASS}>{t("admin.thTemplate")}</th>
                      <th className={TH_CLASS}>{t("admin.thPayment")}</th>
                      <th className={`${TH_CLASS} text-center`}>{t("admin.thControl")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-900/10">
                    {ordersRows.map((order) => (
                      <tr key={order.id} className="transition-colors hover:bg-cream-100/50">
                        <td className="px-4 py-4">
                          <span className="block font-data text-[9px] text-ink-400">#{order.id.slice(0, 8)}</span>
                          <span className="mt-1.5 inline-flex items-center gap-1 border border-ink-900/10 bg-cream-100 px-2 py-0.5 font-data text-[8px] uppercase tracking-[0.08em] text-ink-500">
                            <Clock className="h-2.5 w-2.5" />
                            {calculateDuration(order.created_at)} {t("admin.daysAgo")}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-display text-lg leading-tight tracking-[-0.03em] text-ink-950">
                            {order.groom_name} & {order.bride_name}
                          </div>
                          <div className="mt-1 flex items-center gap-1 font-data text-[9px] text-ink-400">
                            <Calendar className="h-2.5 w-2.5" /> {order.wedding_date}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="border border-ink-900/12 bg-cream-100 px-2 py-1 font-data text-[9px] text-ink-600">
                            {order.template_slug}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {order.payment_status === "success" ? (
                            <span className="inline-flex items-center gap-1 border border-success-600/25 bg-success-600/[0.06] px-2 py-1 font-data text-[8px] uppercase tracking-[0.1em] text-success-700">
                              <CheckCircle className="h-2.5 w-2.5" /> {t("admin.paymentSuccess")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 border border-danger-600/25 bg-danger-600/[0.06] px-2 py-1 font-data text-[8px] uppercase tracking-[0.1em] text-danger-600">
                              <XCircle className="h-2.5 w-2.5" /> {order.payment_status}
                            </span>
                          )}
                          {typeof (order.event_details as { payment_method?: unknown } | null)?.payment_method === "string" && (order.event_details as { payment_method: string }).payment_method ? (
                            <span className="mt-1.5 block w-fit border border-ink-900/10 bg-cream-100 px-2 py-0.5 font-data text-[8px] text-ink-500">
                              {(order.event_details as { payment_method: string }).payment_method}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <a
                              href={`/wedding/${order.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Lihat Website"
                              className="grid h-8 w-8 place-items-center border border-ink-900/12 text-ink-500 transition-colors hover:border-ink-900/30 hover:text-ink-900"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </a>
                            {order.whatsapp && (
                              <a
                                href={`https://wa.me/${order.whatsapp.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Chat WhatsApp"
                                className="grid h-8 w-8 place-items-center border border-success-600/20 text-success-700 transition-colors hover:border-success-600/40 hover:bg-success-600/[0.06]"
                              >
                                <FaWhatsapp className="h-3.5 w-3.5" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => onEditOrder?.(order)}
                              title="Edit Full Data"
                              className="grid h-8 w-8 place-items-center border border-ink-900/12 text-ink-500 transition-colors hover:border-ember-500/40 hover:bg-ember-500/[0.06] hover:text-ember-600"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteDialog(order.id)}
                              title="Hapus Permanen"
                              className={buttonClass("ghost", "sm", "h-8 w-8 border border-ink-900/12 p-0 text-danger-600 hover:bg-danger-600/[0.06] hover:text-danger-700")}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={ordersPage}
                totalPages={ordersTotalPages}
                total={ordersTotal}
                pageSize={ordersPageSize}
                onPageChange={setOrdersPage}
                onPageSizeChange={setOrdersPageSize}
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
