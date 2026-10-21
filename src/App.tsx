// ============================================================
// src/App.tsx
// ------------------------------------------------------------
// Root komponen aplikasi & router: definisi seluruh route (publik, demo, undangan, dashboard, admin) dengan lazy loading per halaman.
// Dipakai di  : main.tsx
// Keterikatan : react-router-dom; layouts/PublicLayout, layouts/InvitationLayout; seluruh pages/*
// ============================================================

import { lazy, Suspense } from 'react';
import type { ComponentType, ReactElement } from 'react';
import { Routes, Route } from 'react-router-dom';

/* --- IMPORT APP-WIDE PROVIDERS --- */
import { ToastProvider } from './components/GlobalToast';
import { LanguageProvider } from './i18n';
import ErrorBoundary from './components/ErrorBoundary';
import {
  PageSkeleton,
  HomeSkeleton,
  OrderSkeleton,
  OrderSuccessSkeleton,
  LoginSkeleton,
  ForgotPinSkeleton,
  ForgotPinConfirmSkeleton,
  PaymentStatusSkeleton,
  ContactSkeleton,
  PortfolioSkeleton,
  TutorialSkeleton,
  LegalSkeleton,
  NotFoundSkeleton,
  AdminSkeleton,
  DashboardSkeleton,
  InvitationSkeleton,
  DemoSkeleton,
} from './components/ui/SkeletonLoaders';
import ScrollToTop from './components/ScrollToTop';
import { ADMIN_PATH } from './lib/adminPath';

/* --- IMPORT LAYOUTS --- */
import PublicLayout from './layouts/PublicLayout';
import InvitationLayout from './layouts/InvitationLayout';
import DevInvoicePreviewRoute from './pages/DevInvoicePreviewRoute';
import DevEmailPreviewRoute from './pages/DevEmailPreviewRoute';

/* --- PAGES (lazy loaded — code splitting per route) --- */
const HomePage = lazy(() => import('./pages/HomePage'));
const OrderPage = lazy(() => import('./pages/OrderPage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));
const CustomerLoginPage = lazy(() => import('./pages/CustomerLoginPage'));
const ForgotPinPage = lazy(() => import('./pages/ForgotPinPage'));
const ForgotPinConfirmPage = lazy(() => import('./pages/ForgotPinConfirmPage'));
const CustomerDashboardPage = lazy(() => import('./pages/CustomerDashboardPage'));
const InvitationPage = lazy(() => import('./pages/InvitationPage'));
const TemplateDemoPage = lazy(() => import('./pages/TemplateDemoPage'));
const AdminPanelPage = lazy(() => import('./pages/AdminPanelPage'));
const PaymentStatusPage = lazy(() => import('./pages/PaymentStatusPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const TutorialPage = lazy(() => import('./pages/TutorialPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));

/* Fallback chunks per-route terlihat persis seperti halaman tujuannya.
   Dev preview (invoice/email) tetap generic PageSkeleton. */
function SkeletonRoute({ Skeleton: Fallback, children }: { Skeleton: ComponentType; children: ReactElement }) {
  return <Suspense fallback={<Fallback />}>{children}</Suspense>;
}

function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <ErrorBoundary>
          <ScrollToTop />
          <Routes>
            {/* GROUP 1: PUBLIC PAGES (Pakai Navbar Coklat) */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<SkeletonRoute Skeleton={HomeSkeleton}><HomePage /></SkeletonRoute>} />
              <Route path="/order" element={<SkeletonRoute Skeleton={OrderSkeleton}><OrderPage /></SkeletonRoute>} />
              <Route path="/order/success" element={<SkeletonRoute Skeleton={OrderSuccessSkeleton}><OrderSuccessPage /></SkeletonRoute>} />
              <Route path="/login" element={<SkeletonRoute Skeleton={LoginSkeleton}><CustomerLoginPage /></SkeletonRoute>} />
              <Route path="/forgot-pin" element={<SkeletonRoute Skeleton={ForgotPinSkeleton}><ForgotPinPage /></SkeletonRoute>} />
              <Route path="/forgot-pin/confirm" element={<SkeletonRoute Skeleton={ForgotPinConfirmSkeleton}><ForgotPinConfirmPage /></SkeletonRoute>} />

              <Route path="/payment-status" element={<SkeletonRoute Skeleton={PaymentStatusSkeleton}><PaymentStatusPage /></SkeletonRoute>} />
              <Route path="/contact" element={<SkeletonRoute Skeleton={ContactSkeleton}><ContactPage /></SkeletonRoute>} />
              <Route path="/portfolio" element={<SkeletonRoute Skeleton={PortfolioSkeleton}><PortfolioPage /></SkeletonRoute>} />
              <Route path="/tutorial" element={<SkeletonRoute Skeleton={TutorialSkeleton}><TutorialPage /></SkeletonRoute>} />
              <Route path="/privacy" element={<SkeletonRoute Skeleton={LegalSkeleton}><PrivacyPolicyPage /></SkeletonRoute>} />
              <Route path="/terms" element={<SkeletonRoute Skeleton={LegalSkeleton}><TermsPage /></SkeletonRoute>} />
              <Route path="*" element={<SkeletonRoute Skeleton={NotFoundSkeleton}><NotFoundPage /></SkeletonRoute>} />
            </Route>

            {/* GROUP 2: TEMPLATE DEMO */}
            <Route path="/demo/:slug" element={<SkeletonRoute Skeleton={DemoSkeleton}><TemplateDemoPage /></SkeletonRoute>} />

              {/* GROUP DEV: preview invoice — DevInvoicePreviewRoute me-render
                  NotFoundPage bila bukan `npm run dev`, jadi aman di production. */}
              <Route path="/dev/invoice" element={<SkeletonRoute Skeleton={PageSkeleton}><DevInvoicePreviewRoute /></SkeletonRoute>} />
              <Route path="/dev/email" element={<SkeletonRoute Skeleton={PageSkeleton}><DevEmailPreviewRoute /></SkeletonRoute>} />

            {/* GROUP 3: UNDANGAN TAMU (Fullscreen) */}
            <Route element={<InvitationLayout />}>
              <Route path="/wedding/:slug" element={<SkeletonRoute Skeleton={InvitationSkeleton}><InvitationPage /></SkeletonRoute>} />
            </Route>

            {/* GROUP 4: DASHBOARD (Fullscreen app shell, tanpa Navbar —
                sidebar punya tombol Keluar sendiri) */}
            <Route path="/dashboard/:orderId" element={<SkeletonRoute Skeleton={DashboardSkeleton}><CustomerDashboardPage /></SkeletonRoute>} />
            <Route path={ADMIN_PATH} element={<SkeletonRoute Skeleton={AdminSkeleton}><AdminPanelPage /></SkeletonRoute>} />
          </Routes>
        </ErrorBoundary>
      </ToastProvider>
    </LanguageProvider>
  );
}

export default App;