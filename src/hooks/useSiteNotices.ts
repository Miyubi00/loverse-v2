// ============================================================
// src/hooks/useSiteNotices.ts
// ------------------------------------------------------------
// Mengambil notice situs (site_notices) yang sedang aktif untuk
// halaman publik. RLS di database hanya mengembalikan baris yang
// berjalan dalam jadwalnya; filter client ditambahkan sebagai
// lapis pengaman agar notice tidak basi saat tab dibuka lama.
// Keterikatan : react (useState/useEffect), lib/supabaseClient,
// types/database (SiteNoticeRow).
// ============================================================

import { useEffect, useState } from 'react';
import { fetchPublicRows } from '../lib/publicRest';
import type { SiteNoticeRow } from '../types/database';

function isActiveNow(row: SiteNoticeRow): boolean {
  if (!row.is_active) return false;
  const now = Date.now();
  if (new Date(row.starts_at).getTime() > now) return false;
  if (row.ends_at && new Date(row.ends_at).getTime() < now) return false;
  return true;
}

export function useSiteNotices() {
  const [notices, setNotices] = useState<SiteNoticeRow[]>([]);

  useEffect(() => {
    let mounted = true;
    fetchPublicRows<SiteNoticeRow[]>(
      'site_notices',
      new URLSearchParams({ select: '*', order: 'created_at.desc' }),
    )
      .then((data) => {
        if (!mounted) return;
        const rows = data.filter(isActiveNow);
        setNotices(rows);
      })
      .catch((error) => {
        if (mounted) console.error('Gagal mengambil notice situs:', error);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return notices;
}
