// ============================================================
// src/pages/TemplateDemoPage.tsx
// ------------------------------------------------------------
// Halaman /demo/:slug - preview tema dengan data contoh (tanpa database), fallback ke rustic-floral bila slug tak dikenal.
// Dipakai di  : App.tsx
// Keterikatan : templates/Registry, types/template
// ============================================================

import { Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TEMPLATE_COMPONENTS } from '../templates/Registry';
import type { TemplateData } from '../types/template';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '../i18n';
import { usePageMeta } from '../hooks/usePageMeta';
import { MASTER_TEMPLATES } from '../lib/constants';
import LanguageToggleButton from '../components/shared/LanguageToggleButton';
import { DemoSkeleton } from '../components/ui/SkeletonLoaders';
import { buttonClass } from '../components/ui/buttonStyles';

export default function TemplateDemo() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const themeName = MASTER_TEMPLATES.find((tm) => tm.slug === slug)?.name ?? slug ?? t('demo.defaultTheme');
  usePageMeta(t('demo.metaTitle', { theme: themeName }), t('demo.metaDescription', { theme: themeName }));
  const TemplateRenderer = (slug ? TEMPLATE_COMPONENTS[slug] : undefined) || TEMPLATE_COMPONENTS['rustic-floral'];

  if (!TemplateRenderer) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream-100 px-6 text-center text-ink-600">
        <span className="eyebrow text-ember-600">{t('demo.ariaLabel')}</span>
        <p className="mt-3 max-w-md font-display text-2xl leading-tight tracking-[-0.03em] text-ink-950">
          {t('demo.notFound', { slug: slug || '' })}
        </p>
        <Link to="/" className={buttonClass('secondary', 'md', 'mt-7')}>
          {t('common.backHome')}
        </Link>
      </div>
    );
  }

  const dummyData = {
    groom: 'Romeo',
    bride: 'Juliet',
    date: '2026-12-12T00:00:00.000Z',
    guestName: 'Tamu Spesial',
    event_details: {
      video_url: 'https://video-previews.elements.envatousercontent.com/8a64ff3b-7e94-47b7-8e2e-30dae1f5c957/watermarked_preview/watermarked_preview.mp4',
      cover_photo: 'https://r2.loverse.id/defaults/img/385e020e17.jpg',
      groom_photo: 'https://r2.loverse.id/defaults/img/7251954f12.jpg',
      bride_photo: 'https://r2.loverse.id/defaults/img/066bc138e5.jpg',
      venue_name: 'Grand Ballroom Hotel Indonesia',
      venue_address: 'Jl. Jendral Sudirman No. 1, Jakarta Pusat, DKI Jakarta',
      maps_link: 'https://goo.gl/maps/example',
      akad_time: '08:00 WIB - 10:00 WIB',
      resepsi_time: '11:00 WIB - Selesai',
      groom_parents: 'Bpk. Capulet & Ibu Capulet',
      bride_parents: 'Bpk. Montague & Ibu Montague',
      gallery: [
        'https://r2.loverse.id/defaults/img/0150ee7a32.jpg',
        'https://r2.loverse.id/defaults/img/146c15097b.jpg',
        'https://r2.loverse.id/defaults/img/3c8de55846.jpg',
        'https://r2.loverse.id/defaults/img/1772b3133b.jpg'
      ],
      banks: [
        { bank: 'BCA', number: '1234567890', name: 'Romeo' },
        { bank: 'Mandiri', number: '0987654321', name: 'Juliet' }
      ],
      quote: 'Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu isteri-isteri dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya.',
      quote_src: 'QS. Ar-Rum: 21',
      audio_url: 'https://r2.loverse.id/defaults/audio/ee2e74c72c.mp3',
      rsvps: [
        {
          id: '1',
          guest_name: 'Budi Santoso',
          status: 'hadir',
          message: 'Selamat menempuh hidup baru bro Romeo! Semoga samawa yaaa 🥳',
          created_at: '2025-01-01T10:00:00.000Z',
          reply: 'Aamiin, makasih banyak bro Budi! Ditunggu kehadirannya!'
        },
        {
          id: '2',
          guest_name: 'Siti Aminah',
          status: 'tidak_hadir',
          message: 'Maaf ya Juliet belum bisa hadir karena ada dinas luar kota. Happy Wedding! ❤️',
          created_at: '2025-01-01T08:00:00.000Z',
          reply: null
        },
        {
          id: '3',
          guest_name: 'Dedi Corbuzier',
          status: 'ragu',
          message: 'Wah selamat! Cek jadwal dulu ya, semoga bisa mampir.',
          created_at: '2024-12-31T12:00:00.000Z',
          reply: null
        }
      ]
    }
  };

  return (
    <div className="theme-canvas relative">
      <nav
        aria-label={t('demo.ariaLabel')}
        className="fixed left-4 top-4 z-[100] flex flex-wrap items-center gap-2 sm:left-6 sm:top-6"
      >
        <Link
          to="/"
          className="inline-flex min-h-10 items-center gap-2 rounded-[3px] border border-cream-100/25 bg-ink-950/80 px-3.5 font-data text-[14px] uppercase tracking-[0.06em] text-cream-50 shadow-header backdrop-blur-md transition-colors duration-200 hover:bg-ink-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peach-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> {t('demo.back')}
        </Link>
        <LanguageToggleButton variant="dark" className="bg-ink-950/80 backdrop-blur-md" />
      </nav>

      <Suspense fallback={<DemoSkeleton />}>
        <TemplateRenderer
          groom={dummyData.groom}
          bride={dummyData.bride}
          date={dummyData.date}
          guestName={dummyData.guestName}
          orderId="demo"
          data={dummyData.event_details as unknown as TemplateData}
        />
      </Suspense>
    </div>
  );
}