// ============================================================
// src/components/shared/TemplateCatalogCard.tsx
// ------------------------------------------------------------
// Kartu tema katalog dua bagian: cover utuh di atas (bg gelap,
// zoom halus saat hover) + panel solid brand di bawah berisi
// judul, chip kategori, serta harga pill + CTA "Pilih Tema"
// berdampingan. Klik cover/judul = buka demo; CTA = halaman
// pilih tema.
// Dipakai di  : pages/HomePage.tsx (section Katalog Tema)
// Keterikatan : react-router-dom (Link), lucide-react,
//               components/ui/SkeletonImage, i18n
// ============================================================

import { Link } from 'react-router-dom';
import { SkeletonImage } from '../ui/SkeletonImage';
import { useTranslation } from '../../i18n';
import type { TemplateRow } from '../../types/database';

// Kanonisasi nama tema saat tampil (data DB tetap tak tersentuh).
const PRETTY_NAMES: Record<string, string> = {
  iphone: 'iPhone',
};
const prettifyName = (name: string) => PRETTY_NAMES[name.toLowerCase()] ?? name;

interface TemplateCatalogCardProps {
  template: TemplateRow & { image: string };
  /** Harga sudah terformat (formatPriceK) dari pemanggil. */
  priceLabel: string;
}

export default function TemplateCatalogCard({ template, priceLabel }: TemplateCatalogCardProps) {
  const { t } = useTranslation();
  const demoUrl = `/demo/${template.slug}`;
  const orderUrl = `/order?template=${template.slug}`;

  return (
    <article
      data-template-slug={template.slug}
      className="group relative flex flex-col aspect-[347/387] rounded-2xl sm:rounded-3xl overflow-hidden border border-[#EBDFCE] shadow-sm hover:shadow-[0_22px_45px_-16px_rgba(113,46,30,0.25)] hover:-translate-y-1 transition-all duration-300 bg-[#FAF6EE]"
    >

      {/* Cover utuh — mengisi sisa tinggi kartu (klik = demo tema) */}
      <Link
        to={demoUrl}
        title={`Lihat demo ${template.name}`}
        aria-label={`Lihat demo ${template.name}`}
        className="relative block flex-1 min-h-0 overflow-hidden"
      >
        <SkeletonImage
          src={template.image}
          alt={template.name}
          width={800}
          height={1066}
          className="absolute inset-0 w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </Link>

      {/* Panel krem brand — tinggi mengikuti konten */}
      <div className="relative bg-[#FAF6EE] p-2.5 sm:p-4 flex flex-col">
        <Link
          to={demoUrl}
          title={template.name}
          className="min-w-0 truncate text-[#712E1E] font-extrabold text-sm sm:text-lg leading-snug hover:underline decoration-2 underline-offset-2"
        >
          {prettifyName(template.name)}
        </Link>

        {template.category && (
          <span className="mt-1 sm:mt-2 self-start px-2 py-0.5 rounded-full bg-[#F1E8DC] border border-[#EBDFCE] text-[#712E1E] text-[9px] sm:text-[10px] font-bold">
            {template.category}
          </span>
        )}

        {/* Harga + CTA berdampingan */}
        <div className="mt-2.5 sm:mt-3 flex items-center gap-1.5 sm:gap-2">
          <span className="shrink-0 px-2.5 sm:px-3.5 py-2 sm:py-3 rounded-full bg-white border border-[#E59A59]/40 text-[#712E1E] text-[10px] sm:text-sm font-black whitespace-nowrap">
            {priceLabel}
          </span>
          <Link
            to={orderUrl}
            className="flex-1 min-w-0 flex items-center justify-center rounded-full bg-[#E59A59] py-2 sm:py-3 px-1.5 sm:px-2 text-[10px] sm:text-sm font-extrabold whitespace-nowrap text-white shadow-md hover:bg-[#d48b4b] active:scale-[0.98] transition"
          >
            {t('home.catalogCreate')}
          </Link>
        </div>
      </div>
    </article>
  );
}
