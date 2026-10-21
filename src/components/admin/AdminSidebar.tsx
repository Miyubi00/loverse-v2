import { LogOut, X, type LucideIcon } from "lucide-react";
import { useTranslation } from "../../i18n";
import { cn } from "../../lib/cn";
import LanguageSwitcher from "../shared/LanguageSwitcher";
import { Wordmark } from "../ui/Brand";

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge: number | null;
}

interface AdminSidebarProps {
  menuItems: MenuItem[];
  activeTab: string;
  isOpen: boolean;
  onClose: () => void;
  onMenuClick: (id: string) => void;
  onLogout: () => void;
  userEmail?: string;
}

export default function AdminSidebar({
  menuItems,
  activeTab,
  isOpen,
  onClose,
  onMenuClick,
  onLogout,
  userEmail,
}: AdminSidebarProps) {
  const { t } = useTranslation();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full w-[280px] shrink-0 flex-col border-r border-cream-100/10 bg-ink-950 text-cream-100 transition-transform duration-300 ease-out lg:relative",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
    >
      <div className="shrink-0 border-b border-cream-100/10 px-6 pb-6 pt-6">
        <div className="flex items-center justify-between gap-3">
          <Wordmark imageClassName="h-7" />
          <button
            type="button"
            onClick={onClose}
            aria-label={t("nav.close")}
            className="-mr-2 -mt-1 p-2 text-cream-100/60 transition-colors hover:text-cream-50 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-4 font-data text-[8px] uppercase tracking-[0.22em] text-peach-300/65">
          {t("admin.title")}
        </p>

        <h1 className="mt-2 font-display text-[27px] leading-[1.02] tracking-[-0.045em] text-cream-50">
          {t("admin.subtitle")}
        </h1>

        <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-cream-100/10 pt-4">
          <div>
            <dt className="font-data text-[8px] uppercase tracking-[0.14em] text-cream-100/30">Mode</dt>
            <dd className="mt-1 flex items-center gap-1.5 font-data text-[9px] uppercase tracking-[0.1em] text-peach-300">
              <span className="h-1 w-1 bg-peach-300" aria-hidden="true" />
              Superuser
            </dd>
          </div>
          <div>
            <dt className="font-data text-[8px] uppercase tracking-[0.14em] text-cream-100/30">Access</dt>
            <dd className="mt-1 font-data text-[9px] uppercase tracking-[0.1em] text-cream-100/60">
              Secure
            </dd>
          </div>
        </dl>
      </div>

      <nav className="flex-1 overflow-y-auto py-5" aria-label={t("admin.title")}>
        <p className="mb-2 px-6 font-data text-[8px] uppercase tracking-[0.22em] text-cream-100/30">
          Control
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
        <div className="mb-3 flex justify-center lg:hidden">
          <LanguageSwitcher variant="header" />
        </div>
        {userEmail && (
          <p
            className="mb-2 truncate border border-cream-100/10 px-3 py-2 font-data text-[9px] text-cream-100/45"
            title={userEmail}
          >
            {userEmail}
          </p>
        )}
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
