// ============================================================
// src/main.tsx
// ------------------------------------------------------------
// Entry point aplikasi: mount <App> ke DOM, pasang BrowserRouter, muat index.css (Tailwind), dan inisialisasi Midtrans Snap.
// Dipakai di  : -(entry point, direferensikan index.html)
// Keterikatan : react-dom, react-router-dom, ./App, lib/midtransConfig
// ============================================================

import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { initMonitoring } from './lib/monitoring'

// Monitoring (Sentry) — no-op bila VITE_SENTRY_DSN tidak diset.
void initMonitoring();

const rootElement = document.getElementById('root');
if (rootElement) {
  const application = (
    <StrictMode>
      {/* BrowserRouter membungkus seluruh aplikasi */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );

  if (rootElement.hasChildNodes()) {
    hydrateRoot(rootElement, application);
  } else {
    createRoot(rootElement).render(application);
  }
}
