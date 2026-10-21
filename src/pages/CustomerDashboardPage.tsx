// ============================================================
// src/pages/CustomerDashboardPage.tsx
// ------------------------------------------------------------
// Halaman /dashboard/:orderId - dashboard mempelai: shell (navbar + sidebar) dan orkestrasi tab Sebar/Edit/Buku Tamu.
// Dipakai di  : App.tsx
// Keterikatan : components/customer/*, hooks/useDashboardData, useUrlTab, lib/customerClient
// ============================================================

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowUpRight, ExternalLink, Menu, MessageSquare, Save, Share2 } from "lucide-react";
import { BASIC_TEMPLATES_SLUGS } from "../lib/constants";
import { useDashboardData } from "../hooks/useDashboardData";
import { DashboardSkeleton } from "../components/ui/SkeletonLoaders";
import { clearCustomerToken, getCustomerToken, refreshCustomerToken } from "../lib/customerClient";
import { useFileUpload } from "../hooks/useFileUpload";
import { useShareLink } from "../hooks/useShareLink";
import { useUrlTab } from "../hooks/useUrlTab";
import CustomerNavbar from "../components/customer/CustomerNavbar";
import CustomerSidebar, { type MenuItem } from "../components/customer/CustomerSidebar";
import ShareTab from "../components/customer/ShareTab";
import EditTab from "../components/customer/EditTab";
import RsvpTab from "../components/customer/RsvpTab";
import ConfirmDialog from "../components/ConfirmDialog";
import LanguageSwitcher from "../components/shared/LanguageSwitcher";
import { useTranslation } from "../i18n";
import { Wordmark } from "../components/ui/Brand";

export default function Dashboard() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useTranslation();

  const {
    order,
    loading,
    dataLoading,
    formData,
    setFormData,
    rsvpTotal,
    handleChange,
    handleSaveData,
  } = useDashboardData(orderId);

  const { uploading, converting, removing, activeUploadField, handleFileUpload, removeAudio, cropModal } = useFileUpload(
    orderId,
    setFormData,
    "IMG_",
    true,
    () => formData,
  );
  const shareLink = useShareLink(order);

  // Tab aktif disinkronkan dengan URL (?tab=...) agar refresh tidak reset.
  // Template Basic tidak punya tab RSVP — param itu difallback ke share.
  const isBasic = BASIC_TEMPLATES_SLUGS.includes(order?.template_slug ?? "");
  const [urlTab, setUrlTab] = useUrlTab(["share", "edit", "rsvp"], "share");
  const activeTab = isBasic && urlTab === "rsvp" ? "share" : urlTab;
  const setActiveTab = (tab: string) =>
    setUrlTab(isBasic && tab === "rsvp" ? "share" : tab);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Refresh sesi customer secara periodik: JWT ber-TTL pendek diperpanjang
  // tanpa PIN selama sesi < 24 jam; bila benar-benar habis, paksa login.
  useEffect(() => {
    const id = setInterval(async () => {
      const ok = await refreshCustomerToken();
      if (!ok && !getCustomerToken()) {
        navigate("/login");
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [navigate]);

  if (dataLoading) {
    return <DashboardSkeleton />;
  }

  if (!order) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-cream-100 px-6 text-center font-sans text-ink-600">
        Data Order Tidak Ditemukan.
      </div>
    );
  }

  const menuItems: MenuItem[] = [
    { id: "share", label: t("customer.menuShare"), icon: Share2, badge: null },
    { id: "edit", label: t("customer.menuEdit"), icon: Save, badge: null },
    ...(!isBasic
      ? [
          {
            id: "rsvp",
            label: t("customer.menuRsvp"),
            icon: MessageSquare,
            badge: rsvpTotal && rsvpTotal > 0 ? rsvpTotal : null,
          },
        ]
      : []),
  ];

  const activeMenu = menuItems.find((item) => item.id === activeTab) ?? menuItems[0];
  const activeIndex = menuItems.findIndex((item) => item.id === activeMenu.id) + 1;
  const descriptions: Record<string, string> = {
    share: t("customer.share.desc"),
    edit: t("customer.edit.desc"),
    rsvp: t("customer.rsvp.desc"),
  };
  const dateLabel = new Date(order.wedding_date).toLocaleDateString(
    language === "en" ? "en-US" : "id-ID",
    { day: "2-digit", month: "short", year: "numeric" },
  );

  const handleMenuClick = (id: string) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  // Logout sama seperti Navbar publik: hanya hapus key session dashboard,
  // jangan sessionStorage.clear() agar session fitur lain aman.
  const performLogout = () => {
    sessionStorage.removeItem("active_order_id");
    sessionStorage.removeItem("order_pin");
    localStorage.removeItem("active_order_id");
    clearCustomerToken();
    navigate("/");
  };
  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  return (
    <div className="app-shell flex h-dvh w-full flex-col overflow-hidden bg-cream-100 font-sans text-ink-900">
      <CustomerNavbar order={order} />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {sidebarOpen && (
          <button
            type="button"
            aria-label={t("nav.close")}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-ink-950/55 backdrop-blur-[2px] lg:hidden"
          />
        )}

        <CustomerSidebar
          order={order}
          menuItems={menuItems}
          activeTab={activeTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onMenuClick={handleMenuClick}
          onLogout={handleLogout}
          isBasic={isBasic}
        />

        <ConfirmDialog
          isOpen={showLogoutDialog}
          title={t("nav.logoutConfirmTitle")}
          message={t("nav.logoutConfirm")}
          isDanger
          onCancel={() => setShowLogoutDialog(false)}
          onConfirm={performLogout}
        />

        <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex shrink-0 items-center gap-2 border-b border-cream-100/10 bg-ink-950 px-3 py-2 lg:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label={t("nav.menu")}
              className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center text-cream-100/80 transition-colors hover:text-cream-50"
            >
              <Menu size={20} />
            </button>
            <Wordmark imageClassName="h-6" />
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <a
                href={`/wedding/${order.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("customer.viewInvitation")}
                className="flex h-10 w-10 items-center justify-center text-cream-100/70 transition-colors hover:text-cream-50"
              >
                <ExternalLink size={18} />
              </a>
              <LanguageSwitcher variant="header" mode="toggle" />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-7 sm:px-7 lg:px-10 lg:pt-10">
              <header className="border-b border-ink-900/12 pb-7 sm:pb-9">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="eyebrow text-ember-600">{t("customer.workspaceEyebrow")}</span>
                    <span className="font-data text-[14px] text-ink-400" aria-hidden="true">
                      /{String(activeIndex).padStart(2, "0")}
                    </span>
                  </div>
                  <a
                    href={`/wedding/${order.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hidden items-center gap-2 font-data text-[14px] uppercase tracking-[0.06em] text-ink-500 transition-colors hover:text-ember-600 sm:inline-flex"
                  >
                    {t("customer.activeInvitation")}
                    <ArrowUpRight size={12} />
                  </a>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                  <div>
                    <h1 className="font-display text-[clamp(2.5rem,6vw,4.6rem)] leading-[0.94] tracking-[-0.055em] text-ink-950">
                      {activeMenu.label}
                    </h1>
                    <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-ink-500 sm:text-sm">
                      {descriptions[activeMenu.id]}
                    </p>
                  </div>

                  <dl className="flex flex-wrap items-end gap-x-7 gap-y-3 lg:justify-end">
                    <div>
                      <dt className="font-data text-[14px] uppercase tracking-[0.06em] text-ink-400">
                        {t("customer.weddingDay")}
                      </dt>
                      <dd className="mt-1 font-display text-lg tracking-[-0.02em] text-ink-900">
                        {dateLabel}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-data text-[14px] uppercase tracking-[0.06em] text-ink-400">
                        {t("customer.viewInvitation")}
                      </dt>
                      <dd className="mt-1.5 inline-flex items-center gap-1.5 border border-success-600/25 bg-success-600/[0.06] px-2 py-1 font-data text-[14px] uppercase tracking-[0.06em] text-success-700">
                        <span className="h-1 w-1 bg-success-600" aria-hidden="true" />
                        {t("customer.activeInvitation")}
                      </dd>
                    </div>
                  </dl>
                </div>
              </header>

              <div key={activeTab} className="animate-msg-in pt-7 sm:pt-9">
                {activeTab === "share" && <ShareTab {...shareLink} />}

                {activeTab === "edit" && (
                  <EditTab
                    formData={formData}
                    setFormData={setFormData}
                    handleChange={handleChange}
                    handleSaveData={handleSaveData}
                    loading={loading}
                    uploading={uploading}
                    activeUploadField={activeUploadField}
                    handleFileUpload={handleFileUpload}
                    orderId={orderId}
                    converting={converting}
                    removing={removing}
                    onRemoveMusic={removeAudio}
                  />
                )}

                {activeTab === "rsvp" && !isBasic && <RsvpTab orderId={orderId ?? ""} />}
              </div>
            </div>
          </main>
        </div>
      </div>

      {cropModal}
    </div>
  );
}
