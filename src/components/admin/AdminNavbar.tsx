// ============================================================
// src/components/admin/AdminNavbar.tsx
// ------------------------------------------------------------
// Navbar atas Admin Panel (desktop): brand panel + judul konten aktif.
// Dipakai di  : pages/AdminPanelPage.tsx
// Keterikatan : lucide-react
// ============================================================

import { ShieldCheck } from "lucide-react";
import { useTranslation } from "../../i18n";
import LanguageSwitcher from "../shared/LanguageSwitcher";
import { Wordmark } from "../ui/Brand";

interface AdminNavbarProps {
  userEmail?: string;
}

export default function AdminNavbar({ userEmail }: AdminNavbarProps) {
  const { t } = useTranslation();

  return (
    <header className="hidden shrink-0 items-center justify-between border-b border-cream-100/12 bg-ink-950 px-6 py-3 lg:flex">
      <div className="flex items-center gap-5">
        <Wordmark imageClassName="h-7" />
        <span className="h-5 w-px bg-cream-100/15" aria-hidden="true" />
        <div className="flex items-center gap-2">
          <ShieldCheck size={13} className="text-peach-300/75" strokeWidth={1.6} />
          <span className="font-data text-[8px] uppercase tracking-[0.2em] text-peach-300/75">
            Admin / {t("admin.title")}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <LanguageSwitcher variant="header" />
        {userEmail && (
          <span
            className="max-w-[220px] truncate border border-cream-100/12 px-2.5 py-1 font-data text-[9px] text-cream-100/45"
            title={userEmail}
          >
            {userEmail}
          </span>
        )}
      </div>
    </header>
  );
}
