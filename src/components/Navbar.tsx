import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useTranslation } from "../i18n";
import LanguageSwitcher from "./shared/LanguageSwitcher";
import { Wordmark } from "./ui/Brand";
import { buttonClass } from "./ui/buttonStyles";
import { cn } from "../lib/cn";

const LINKS = [
  { href: "/#katalog", key: "nav.collection" },
  { href: "/#alur", key: "nav.process" },
  { href: "/#testimoni", key: "nav.stories" },
  { href: "/contact", key: "nav.help" },
] as const;

export default function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-[80] -translate-y-20 bg-ink-950 px-4 py-3 text-xs font-semibold text-cream-50 transition-transform focus:translate-y-0"
      >
        {t("nav.skip")}
      </a>
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b transition-[background-color,border-color,box-shadow] duration-300",
          scrolled
            ? "border-cream-100/12 bg-ink-950 shadow-[0_18px_40px_-32px_rgba(0,0,0,0.9)]"
            : "border-transparent bg-ink-950",
        )}
      >
        <div className="mx-auto flex h-[68px] w-full max-w-[1480px] items-center justify-between gap-6 px-4 sm:px-7 lg:px-10">
          <Wordmark />

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Navigasi utama">
            {LINKS.map((link) => {
              const active =
                link.href === "/contact"
                  ? location.pathname === "/contact"
                  : false;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "group relative py-2 text-[12px] font-medium tracking-[0.01em] text-cream-100/65 transition-colors hover:text-cream-50",
                    active && "text-cream-50",
                  )}
                >
                  {t(link.key)}
                  <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-peach-300 transition-transform duration-300 group-hover:scale-x-100" />
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSwitcher variant="header" />
            <Link
              to="/login"
              className="px-3 py-2 text-[12px] font-medium text-cream-100/65 transition-colors hover:text-cream-50"
            >
              {t("nav.login")}
            </Link>
            <Link to="/order" className={buttonClass("peach", "sm", "h-10 px-4")}>
              {t("nav.start")}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? t("nav.close") : t("nav.menu")}
            className="flex h-10 w-10 items-center justify-center border border-cream-100/20 text-cream-100 lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {open && (
        <div
          id="mobile-navigation"
          className="fixed inset-x-0 bottom-0 top-[68px] z-40 flex flex-col overflow-y-auto bg-cream-100 lg:hidden"
        >
          <div className="flex flex-1 flex-col px-5 pb-8 pt-8 sm:px-8">
            <p className="eyebrow text-ink-400">Menu / 2026</p>
            <nav className="mt-8 flex flex-col border-t border-ink-900/12" aria-label="Navigasi seluler">
              {LINKS.map((link, index) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={close}
                  className="group flex items-baseline justify-between border-b border-ink-900/12 py-5"
                >
                  <span className="flex items-baseline gap-4">
                    <span className="font-data text-[9px] text-ink-400">0{index + 1}</span>
                    <span className="display-lg text-[clamp(2.2rem,10vw,3.4rem)] text-ink-950">
                      {t(link.key)}
                    </span>
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-ink-300 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ember-600" />
                </Link>
              ))}
            </nav>

            <div className="mt-8 grid gap-2">
              <Link to="/order" onClick={close} className={buttonClass("primary", "lg", "h-13 w-full")}>
                {t("nav.start")}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link to="/login" onClick={close} className={buttonClass("secondary", "lg", "h-13 w-full")}>
                {t("nav.login")}
              </Link>
            </div>

            <div className="mt-auto flex items-center justify-between gap-4 pt-10">
              <p className="max-w-[22ch] text-[11px] leading-relaxed text-ink-400">
                Undangan digital yang terasa seperti kamu.
              </p>
              <LanguageSwitcher variant="light" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
