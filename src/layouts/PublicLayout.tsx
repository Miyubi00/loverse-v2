import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import PublicFooter from "../components/shared/PublicFooter";

export default function PublicLayout() {
  const location = useLocation();

  return (
    <div className="app-shell flex min-h-screen w-full max-w-full flex-col bg-cream-100">
      <Navbar />
      <main id="main-content" className="w-full max-w-full flex-1 overflow-x-hidden">
        <div key={location.pathname} className="page-enter">
          <Outlet />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
