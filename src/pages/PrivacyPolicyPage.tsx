// ============================================================
// src/pages/PrivacyPolicyPage.tsx
// ------------------------------------------------------------
// Kebijakan Privasi (halaman publik statis). Memakai layout
// bersama LegalPage. Dipakai di : App.tsx (route /privacy)
// ============================================================

import LegalPageLayout from '../components/shared/LegalPage';
import { useTranslation } from '../i18n';

export default function PrivacyPolicyPage() {
  const { t, dictionary } = useTranslation();
  const privacy = dictionary.legal.privacy;

  return (
    <LegalPageLayout
      title={privacy.title}
      metaDescription={privacy.metaDescription}
      updated={t('legal.updatedDate')}
      sections={privacy.sections}
    />
  );
}
