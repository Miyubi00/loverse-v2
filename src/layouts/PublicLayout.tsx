// ============================================================
// src/layouts/PublicLayout.tsx
// ------------------------------------------------------------
// Layout halaman publik (navbar coklat + konten) untuk Home, Order, Login, Payment Status, Contact.
// Dipakai di  : App.tsx
// Keterikatan : react-router-dom (Outlet), components/Navbar
// ============================================================

import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

// PUBLIC LAYOUT (Navbar + Konten)
// Dipakai untuk: Home, Order, Login, Admin.
// Halaman Dashboard TIDAK memakai layout ini (full screen + sidebar sendiri),
// jadi halaman app-like tidak membuat dokumen ikut scroll.
export default function PublicLayout() {
  return (
    <div className="min-h-screen w-full max-w-full flex flex-col bg-[#F1E8DC]">
      <Navbar />
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
