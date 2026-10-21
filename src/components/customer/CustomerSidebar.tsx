import { CalendarDays, ExternalLink, LogOut, X, type LucideIcon } from "lucide-react";
import type { OrderRow } from "../../types/database";
import { useTranslation } from "../../i18n";
import { cn } from "../../lib/cn";
import LanguageSwitcher from "../shared/LanguageSwitcher";

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge: number | null;
}

interface CustomerSidebarProps {
  order: OrderRow;
  menuItems: MenuItem[];
  activeTab: string;
  isOpen: boolean;
  onClose: () => void;
  onMenuClick: (id: string) => void;
  onLogout: () => void;
  isBasic: boolean;
}

export default function CustomerSidebar({
  order,
  menuItems,
  activeTab,
  isOpen,
  onClose,
  onMenuClick,
  onLogout,
  isBasic,
}: CustomerSidebarProps) {
  const { t, language } = useTranslation();
  const dateLabel = new Date(order.wedding_date).toLocaleDateString(
    language === "en" ? "en-US" : "id-ID",
    { day: "2-digit", month: "short", year: "numeric" },
  );

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full w-[272px] shrink-0 flex-col border-r border-cream-100/10 bg-ink-950 text-cream-100 transition-transform duration-300 ease-out lg:relative",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
    >
      <div className="relative shrink-0 border-b border-cream-100/10 px-6 pb-6 pt-6">
        <div className="flex items-start justify-between gap-3">
          <p className="font-data text-[8px] uppercase tracking-[0.22em] text-peach-300/65">
            {t("customer.workspace")}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("nav.close")}
            className="-mr-2 -mt-1 p-2 text-cream-100/60 transition-colors hover:text-cream-50 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <h1 className="mt-5 font-display text-[28px] leading-[1.02] tracking-[-0.04em] text-cream-50">
          {order.groom_name}
          <span className="mx-1.5 text-peach-300/70">&</span>
          {order.bride_name}
        </h1>

        <div className="mt-4 flex items-center gap-2 font-data text-[9px] uppercase tracking-[0.12em] text-cream-100/45">
          <CalendarDays size={12} className="text-peach-300/70" />
          {dateLabel}
        </div>

        <a
          href={`/wedding/${order.slug}`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 border-b border-cream-100/20 pb-0.5 font-data text-[9px] uppercase tracking-[0.12em] text-cream-100/55 transition-colors hover:border-peach-300 hover:text-peach-200"
        >
          /{order.slug}
          <ExternalLink size={10} />
        </a>
      </div>

      <nav className="flex-1 overflow-y-auto py-5" aria-label={t("customer.workspace")}>
        <p className="mb-2 px-6 font-data text-[8px] uppercase tracking-[0.22em] text-cream-100/30">
          Menu
        </p>
        {menuItems.map((item, index) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onMenuClick(item.id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex w-full items-center gap-3 border-l-2 py-3 pl-5 pr-5 text-left transition-colors",
                active
                  ? "border-peach-300 bg-cream-50/[0.06] text-cream-50"
                  : "border-transparent text-cream-100/55 hover:border-cream-100/25 hover:bg-cream-50/[0.03] hover:text-cream-100",
              )}
            >
              <span
                className={cn(
                  "w-5 font-data text-[9px] tabular-nums",
                  active ? "text-peach-300" : "text-cream-100/25",
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <item.icon size={16} strokeWidth={1.6} className="shrink-0" />
              <span className="flex-1 text-[13px] font-medium tracking-[-0.01em]">{item.label}</span>
              {item.badge !== null && (
                <span className="min-w-5 bg-peach-300 px-1.5 py-0.5 text-center font-data text-[9px] font-bold text-ink-950">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-cream-100/10 px-5 py-4">
        {isBasic && (
          <p className="mb-3 border border-cream-100/12 px-3 py-2 font-data text-[8px] uppercase tracking-[0.16em] text-cream-100/45">
            {t("customer.basicPackage")} — RSVP off
          </p>
        )}
        <div className="mb-3 flex justify-center lg:hidden">
          <LanguageSwitcher variant="header" />
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 px-1 py-2 text-[12px] font-medium text-cream-100/50 transition-colors hover:text-cream-50"
        >
          <LogOut size={15} />
          <span>{t("nav.logout")}</span>
        </button>
      </div>
    </aside>
  );
}
