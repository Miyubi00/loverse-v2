// ============================================================
// src/layouts/InvitationLayout.tsx
// ------------------------------------------------------------
// Layout fullscreen tanpa navbar khusus grup route undangan tamu (/wedding/:slug).
// Dipakai di  : App.tsx
// Keterikatan : react-router-dom (Outlet)
// ============================================================

import { Outlet } from 'react-router-dom';

// INVITATION LAYOUT (Fullscreen Tanpa Navbar)
export default function InvitationLayout() {
  return (
    <div className="theme-canvas w-full min-h-screen bg-white">
      <Outlet />
    </div>
  );
}