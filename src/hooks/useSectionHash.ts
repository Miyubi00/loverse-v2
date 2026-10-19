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
    let raf = 0;
    let lastId = '';
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY + 130;
        let current = '';
        for (const id of ids) {
          const el = document.getElementById(id);
          if (el && el.offsetTop <= y) current = id;
        }
        if (current !== lastId) {
          lastId = current;
          const url = window.location.pathname + window.location.search + (current ? `#${current}` : '');
          window.history.replaceState(null, '', url);
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
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
