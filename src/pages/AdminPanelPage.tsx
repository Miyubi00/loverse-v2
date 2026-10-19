import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import type { OrderRow, OrderEditForm } from "../types/database";
import { useAdminSession, useAdminCatalog, useOrdersPaged } from "../hooks/useAdminData";
import { useToast } from "../components/GlobalToast";
import { useUrlTab } from "../hooks/useUrlTab";
import ConfirmDialog from "../components/ConfirmDialog";
import AdminNavbar from "../components/admin/AdminNavbar";
import AdminSidebar, { type MenuItem } from "../components/admin/AdminSidebar";
import AdminLogin from "../components/admin/AdminLogin";
import OrdersTab from "../components/admin/OrdersTab";
import TemplatesTab from "../components/admin/TemplatesTab";
import InboxTab from "../components/admin/InboxTab";
import AuditTab from "../components/admin/AuditTab";
import NoticesTab from "../components/admin/NoticesTab";
import EditOrderModal from "../components/admin/EditOrderModal";
import { AdminSkeleton } from "../components/ui/SkeletonLoaders";
import { ClipboardList, Clock, Palette, Mail, ScrollText, LogOut, Menu, Megaphone } from "lucide-react";
import { useTranslation } from "../i18n";

interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  isDanger: boolean;
  onConfirm: (() => void) | null;
}

/** Banner peringatan bila daftar terpotong oleh server-side cap. */
function CapNotice({ total, shown, label }: { total: number | null; shown: number; label: string }) {
  if (typeof total !== "number" || total <= shown) return null;
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
      Menampilkan {shown.toLocaleString("id-ID")} {label} terbaru dari total{" "}
      {total.toLocaleString("id-ID")}. Data lebih lama tidak termuat dalam daftar ini.
    </div>
  );
}

export default function AdminPanel() {
  const { t } = useTranslation();
  const toast = useToast();

  const {
    pendingOrders, pendingTotal,
    templates,
    loading,
    searchTerm, setSearchTerm,
    fetchData,
    setPendingOrders, setTemplates,
  } = useAdminCatalog();

  // Ref jembatan: callback sesi butuh refresh() ordersFilter yang belum
  // bisa dideklarasikan di sini (butuh `session`). Callback hanya dipanggil
  // setelah await auth (lebih lambat dari effect pemasangan ref) — aman.
  const refreshOrdersRef = useRef<() => Promise<void>>(async () => {});

  const { session, setSession, sessionLoading } = useAdminSession(() => {
    void fetchData();
    void refreshOrdersRef.current();
  });

  const ordersFilter = useOrdersPaged(25, Boolean(session));

  const { refresh: refreshOrders } = ordersFilter;
  useEffect(() => {
    refreshOrdersRef.current = refreshOrders;
  }, [refreshOrders]);
  const refreshAll = useCallback(async () => {
    await Promise.all([fetchData(), refreshOrders()]);
  }, [fetchData, refreshOrders]);

  const [activeTab, setActiveTab] = useUrlTab(["orders", "whatsapp", "templates", "notices", "inbox", "audit", "edit"], "orders");
  const [searchParams, setSearchParams] = useSearchParams();
  const urlOrderId = searchParams.get("order") ?? "";
  const [dialog, setDialog] = useState<DialogState>({ isOpen: false, title: "", message: "", isDanger: true, onConfirm: null });
  const [inboxUnread, setInboxUnread] = useState(0);

  useEffect(() => {
    if (!session) return;
    supabase
      .from('inbound_emails')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)
      .then(({ count }) => setInboxUnread(count ?? 0));
  }, [session, activeTab]);
  const [editingOrder, setEditingOrder] = useState<OrderRow | null>(null);
  const [editFormData, setEditFormData] = useState<OrderEditForm>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const closeDialog = () => setDialog((prev) => ({ ...prev, isOpen: false }));
  const confirmAction = (title: string, message: string, isDanger: boolean, onConfirmFunc: () => void): void => {
    setDialog({ isOpen: true, title, message, isDanger, onConfirm: onConfirmFunc });
  };

  const performLogout = async () => {
    await supabase.auth.signOut();
    ordersFilter.resetFilters();
    setPendingOrders([]);
    setTemplates([]);
    setSession(null);
    toast.success(t('admin.toastLogout'));
  };

  const handleLogout = () => setShowLogoutDialog(true);

  const handleMenuClick = (id: string) => {
    if (id === activeTab) return;
    setActiveTab(id);
    setSearchTerm("");
    ordersFilter.resetFilters();
    setSidebarOpen(false);
  };

  const handleEditOrder = (order: OrderRow) => {
    setEditingOrder(order);
    setEditFormData({
      ...order.event_details,
      groom_name: order.groom_name,
      bride_name: order.bride_name,
      wedding_date: order.wedding_date,
      payment_status: order.payment_status,
      slug: order.slug,
      template_slug: order.template_slug,
      gallery: order.event_details?.gallery || [],
      banks: order.event_details?.banks || [],
      audio_url: order.event_details?.audio_url || "",
      quote: order.event_details?.quote || "",
      quote_src: order.event_details?.quote_src || "",
    } as OrderEditForm);

    setActiveTab("edit");

    const next = new URLSearchParams(searchParams);
    next.set("tab", "edit");
    next.set("order", order.id);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (!session || loading) return;
    if (activeTab !== "edit" || !urlOrderId || editingOrder) return;

    const timer = setTimeout(async () => {
      const local = ordersFilter.rows.find((o) => o.id === urlOrderId);
      if (local) {
        handleEditOrder(local);
        return;
      }
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", urlOrderId)
        .maybeSingle();
      if (data) {
        handleEditOrder(data);
      } else {
        setActiveTab("orders");
      }
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, loading, activeTab, urlOrderId, editingOrder, ordersFilter.rows]);

  const handleBackToOrders = () => {
    setEditingOrder(null);
    setActiveTab("orders");
  };

  const handleSaved = () => setActiveTab("orders");

  const userEmail = session?.user?.email ?? "";

  const menuItems: MenuItem[] = [
    { id: "orders", label: t('admin.menuOrders'), icon: ClipboardList, badge: ordersFilter.total > 0 ? ordersFilter.total : null },
    { id: "whatsapp", label: t('admin.menuWhatsapp'), icon: Clock, badge: pendingOrders.length },
    { id: "templates", label: t('admin.menuTemplates'), icon: Palette, badge: null },
    { id: "notices", label: t('admin.menuNotices'), icon: Megaphone, badge: null },
    { id: "inbox", label: t('admin.menuInbox'), icon: Mail, badge: inboxUnread > 0 ? inboxUnread : null },
    { id: "audit", label: t('admin.menuAudit'), icon: ScrollText, badge: null },
  ];

  if (sessionLoading) {
    return <AdminSkeleton />;
  }

  if (!session) {
    return <AdminLogin toast={toast} />;
  }

  return (
    <div className="flex flex-col overflow-hidden h-dvh w-full font-sans bg-[#F1E8DC] relative">
      <AdminNavbar userEmail={userEmail} />

      <div className="flex flex-1 overflow-hidden min-h-0 w-full relative">
        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} className="z-40 bg-black/40 fixed inset-0 lg:hidden" />
        )}

        <AdminSidebar
          menuItems={menuItems}
          activeTab={activeTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onMenuClick={handleMenuClick}
          onLogout={handleLogout}
          userEmail={userEmail}
        />

        <ConfirmDialog
          isOpen={dialog.isOpen}
          title={dialog.title}
          message={dialog.message}
          isDanger={dialog.isDanger}
          onCancel={closeDialog}
          onConfirm={dialog.onConfirm ?? undefined}
        />

        <div className="flex flex-1 flex-col overflow-hidden h-full min-h-0 min-w-0 relative">
          <header className="flex px-4 py-3 bg-[#712E1E] border-b border-black/20 shrink-0 items-center gap-2 lg:hidden">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-white/10">
              <Menu size={20} className="text-[#FFD5AF]" />
            </button>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-white">
                {menuItems.find((m) => m.id === activeTab)?.label ?? "Edit Undangan"}
              </h2>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-white/10" title={t('nav.logout')}>
              <LogOut size={18} className="text-red-300" />
            </button>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {activeTab === "edit" && editingOrder ? (
              <EditOrderModal
                editingOrder={editingOrder}
                setEditingOrder={setEditingOrder}
                editFormData={editFormData}
                setEditFormData={setEditFormData}
                templates={templates}
                fetchData={refreshAll}
                toast={toast}
                onBack={handleBackToOrders}
                onSaved={handleSaved}
              />
            ) : (
              <div className="max-w-7xl mx-auto space-y-6">
                {activeTab === "orders" && (
                  <OrdersTab
                    ordersSrv={ordersFilter}
                    pendingOrders={pendingOrders}
                    confirmAction={confirmAction}
                    fetchData={refreshAll}
                    toast={toast}
                    viewMode="orders"
                    onEditOrder={handleEditOrder}
                  />
                )}

                {activeTab === "whatsapp" && (
                  <>
                    <CapNotice total={pendingTotal} shown={pendingOrders.length} label="pesanan masuk" />
                    <OrdersTab
                      ordersSrv={ordersFilter}
                      pendingOrders={pendingOrders}
                      confirmAction={confirmAction}
                      fetchData={refreshAll}
                      toast={toast}
                      viewMode="pending"
                      onEditOrder={handleEditOrder}
                    />
                  </>
                )}

                {activeTab === "templates" && (
                  <TemplatesTab
                    templates={templates}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    confirmAction={confirmAction}
                    fetchData={fetchData}
                    toast={toast}
                    loading={loading}
                  />
                )}

                {activeTab === "notices" && (
                  <NoticesTab toast={toast} confirmAction={confirmAction} />
                )}

                {activeTab === "inbox" && (
                  <InboxTab toast={toast} onCountChange={setInboxUnread} />
                )}

                {activeTab === "audit" && (
                  <AuditTab toast={toast} />
                )}

                {activeTab === "edit" && !editingOrder && (
                  <p className="text-sm text-gray-500 py-10">Pilih pesanan dari menu Data Pesanan, lalu klik tombol Edit untuk mengubah data.</p>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showLogoutDialog}
        title={t('nav.logoutConfirmTitle')}
        message={t('nav.logoutConfirm')}
        isDanger={true}
        onCancel={() => setShowLogoutDialog(false)}
        onConfirm={performLogout}
      />
    </div>
  );
}
