// ============================================================
// src/components/customer/CustomerNavbar.tsx
// ------------------------------------------------------------
// Navbar atas dashboard mempelai (desktop): brand + aksi global (lihat undangan, logout).
// Dipakai di  : pages/CustomerDashboardPage.tsx
// Keterikatan : types/database (OrderRow), lucide-react
// ============================================================

import { ExternalLink } from "lucide-react";
import type { OrderRow } from "../../types/database";
import { useTranslation } from "../../i18n";
import LanguageSwitcher from "../shared/LanguageSwitcher";
import { Wordmark } from "../ui/Brand";

interface CustomerNavbarProps {
  order: OrderRow;
}

export default function CustomerNavbar({ order }: CustomerNavbarProps) {
  const { t } = useTranslation();

  return (
    <header className="hidden shrink-0 items-center justify-between border-b border-cream-100/12 bg-ink-950 px-6 py-3 lg:flex">
      <Wordmark imageClassName="h-7" />

      <div className="flex items-center gap-3">
        <a
          href={`/wedding/${order.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("customer.viewInvitation")}
          className="inline-flex min-h-10 items-center gap-2 border border-cream-100/25 px-3.5 font-data text-[14px] uppercase tracking-[0.06em] text-cream-100 transition-colors hover:border-cream-50 hover:bg-cream-50 hover:text-ink-950"
        >
          <span>{t("customer.viewInvitation")}</span>
          <ExternalLink size={14} />
        </a>
        <LanguageSwitcher variant="header" mode="toggle" />
      </div>
    </header>
  );
}
