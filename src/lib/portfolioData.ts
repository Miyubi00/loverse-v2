// ============================================================
// src/lib/portfolioData.ts
// ------------------------------------------------------------
// Data DUMMY portofolio (nanti diganti karya klien nyata + izin tampil).
// Setiap item menunjuk ke tema katalog yang ada sehingga tombol
// "Lihat Demo" selalu hidup. Gambar memakai thumbnail katalog R2.
// ============================================================

export interface PortfolioItem {
  id: number;
  groom: string;
  bride: string;
  date: string;
  city: string;
  guests: number;
  rating: number;
  templateSlug: string;
}

export const PORTFOLIO_ITEMS: PortfolioItem[] = [
  { id: 1, groom: 'Mempelai', bride: 'Pasangan', date: '24 Okt 2026', city: 'Jakarta', guests: 320, rating: 5.0, templateSlug: 'botanical-gold' },
  { id: 2, groom: 'Raka', bride: 'Nadia', date: '12 Sep 2026', city: 'Bandung', guests: 210, rating: 4.9, templateSlug: 'rustic-floral' },
  { id: 3, groom: 'Bagas', bride: 'Citra', date: '05 Sep 2026', city: 'Surabaya', guests: 450, rating: 5.0, templateSlug: 'emerald-royale' },
  { id: 4, groom: 'Yoga', bride: 'Putri', date: '29 Agu 2026', city: 'Yogyakarta', guests: 180, rating: 4.8, templateSlug: 'javanese' },
  { id: 5, groom: 'Fajar', bride: 'Intan', date: '15 Agu 2026', city: 'Medan', guests: 260, rating: 4.9, templateSlug: 'modern-dark' },
  { id: 6, groom: 'Rizky', bride: 'Ayu', date: '02 Agu 2026', city: 'Semarang', guests: 150, rating: 5.0, templateSlug: 'hello-kitty' },
  { id: 7, groom: 'Danang', bride: 'Sinta', date: '19 Jul 2026', city: 'Bali', guests: 120, rating: 4.9, templateSlug: 'ocean-vows' },
  { id: 8, groom: 'Ilham', bride: 'Dewi', date: '11 Jul 2026', city: 'Makassar', guests: 380, rating: 5.0, templateSlug: 'lantern-night' },
  { id: 9, groom: 'Teguh', bride: 'Rani', date: '27 Jun 2026', city: 'Palembang', guests: 240, rating: 4.8, templateSlug: 'playful-pop' },
  { id: 10, groom: 'Galih', bride: 'Nisa', date: '14 Jun 2026', city: 'Malang', guests: 170, rating: 4.9, templateSlug: 'sakura-breeze' },
  { id: 11, groom: 'Eko', bride: 'Lestari', date: '30 Mei 2026', city: 'Solo', guests: 290, rating: 5.0, templateSlug: 'chiikawa' },
  { id: 12, groom: 'Andre', bride: 'Bella', date: '17 Mei 2026', city: 'Jakarta', guests: 200, rating: 4.9, templateSlug: 'cinamon' },
];
