// ============================================================
// src/hooks/useSectionHash.ts
// ------------------------------------------------------------
// Sinkronisasi hash URL dengan section yang sedang terlihat:
// - Saat scroll: hash di-update (history.replaceState, tanpa
//   lompatan) mengikuti section aktif → URL /#katalog dsb.
// - Saat halaman dibuka/refresh dengan hash: halaman langsung
//   digulir ke section tersebut (retensi posisi setelah refresh).
// - Saat hash berubah via router (klik link anchor): smooth scroll.
// Dipakai di  : pages/HomePage.tsx
// Keterikatan : react-router-dom (useLocation), react (useEffect)
// ============================================================

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useSectionHash(ids: readonly string[]) {
  const { hash } = useLocation();

  // 1) Restore posisi saat hash ada di URL saat efek berjalan.
  useEffect(() => {
    if (!hash || hash.length < 2) return;
    const targetId = decodeURIComponent(hash.replace('#', ''));
    let cancelled = false;
    let lastTop = Number.POSITIVE_INFINITY;
    const scrollNow = () => {
      if (targetId === 'beranda' && window.scrollY === 0) {
        lastTop = 0;
        return true;
      }
      const el = document.getElementById(targetId);
      if (!el) return false;
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, left: 0, behavior: 'auto' });
      lastTop = top;
      return true;
    };
    const retries = [600, 1600, 3200];
    const attempt = () => {
      // Batalkan retensi jika pengguna sudah menggulir sendiri.
      if (Math.abs(window.scrollY - lastTop) > 4) return;
      scrollNow();
    };
    scrollNow();
    const timers = retries.map((ms) => window.setTimeout(() => { if (!cancelled) attempt(); }, ms));
    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [hash]);

  // 2) Scrollspy: update hash mengikuti section terlihat (tanpa lompatan).
  useEffect(() => {
    let lastId = '';
    let lastScrollY = window.scrollY;
    const updateHash = (current: string) => {
      if (!current || current === lastId) return;
      lastId = current;
      const url = window.location.pathname + window.location.search + `#${current}`;
      window.history.replaceState(null, '', url);
    };

    const observer = new IntersectionObserver((entries) => {
      const crossed = entries.filter((entry) => entry.isIntersecting);
      if (crossed.length === 0) return;

      const scrollingDown = window.scrollY >= lastScrollY;
      lastScrollY = window.scrollY;
      crossed.sort((a, b) => ids.indexOf(a.target.id) - ids.indexOf(b.target.id));
      const current = crossed[scrollingDown ? crossed.length - 1 : 0].target.id;
      updateHash(current);
    }, { rootMargin: '-130px 0px -75% 0px', threshold: 0 });

    ids.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [ids]);

  // 3) Hash berubah via router → smooth scroll ke section.
  useEffect(() => {
    const onHashChange = () => {
      const targetId = decodeURIComponent(window.location.hash.replace('#', ''));
      if (!targetId) return;
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
}

export default useSectionHash;
