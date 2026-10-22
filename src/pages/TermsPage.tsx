// ============================================================
// src/pages/TermsPage.tsx
// ------------------------------------------------------------
// Syarat & Ketentuan layanan (halaman publik statis). Memakai
// layout bersama LegalPage. Dipakai di : App.tsx (route /terms)
// ============================================================

import LegalPageLayout from '../components/shared/LegalPage';
import { useTranslation } from '../i18n';

export default function TermsPage() {
  const { t, dictionary } = useTranslation();
  const terms = dictionary.legal.terms;

  return (
    <LegalPageLayout
      title={terms.title}
      metaDescription={terms.metaDescription}
      updated={t('legal.updatedDate')}
      sections={terms.sections}
    />
  );
}
