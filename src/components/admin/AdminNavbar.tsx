// ============================================================
// src/components/admin/AdminNavbar.tsx
// ------------------------------------------------------------
// Navbar atas Admin Panel (desktop): brand panel + pemilih bahasa.
// Dipakai di  : pages/AdminPanelPage.tsx
// ============================================================

import LanguageSwitcher from "../shared/LanguageSwitcher";
import { Wordmark } from "../ui/Brand";

export default function AdminNavbar() {
  return (
    <header className="hidden shrink-0 items-center justify-between border-b border-cream-100/12 bg-ink-950 px-6 py-3 lg:flex">
      <Wordmark imageClassName="h-7" />
      <LanguageSwitcher variant="header" touchTarget />
    </header>
  );
}
