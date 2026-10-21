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
      <div className="flex items-center gap-5">
        <Wordmark imageClassName="h-7" />
        <span className="h-5 w-px bg-cream-100/15" aria-hidden="true" />
        <div>
          <p className="font-data text-[8px] uppercase tracking-[0.22em] text-peach-300/70">
            {t("customer.workspace")}
          </p>
          <p className="mt-0.5 text-[12px] font-medium text-cream-100/80">
            {t("nav.dashboard")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <LanguageSwitcher variant="header" />
        <a
          href={`/wedding/${order.slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-9 items-center gap-2 border border-cream-100/25 px-3.5 font-data text-[9px] uppercase tracking-[0.16em] text-cream-100 transition-colors hover:border-cream-50 hover:bg-cream-50 hover:text-ink-950"
        >
          <span>{t("customer.viewInvitation")}</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </header>
  );
}
