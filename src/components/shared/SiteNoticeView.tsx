// ============================================================
// src/components/shared/SiteNoticeView.tsx
// ------------------------------------------------------------
// Render notice situs aktif (dari useSiteNotices) di halaman beranda:
// - Banner: polos di atas konten, tampil selama jadwalnya berjalan.
// - Modal popup: satu per kunjungan (prioritas maintenance > warning >
//   promo > info), bisa ditutup & ditandai sudah dilihat per session.
// Keterikatan : react-router-dom (Link), lucide-react, i18n,
// types/database (SiteNoticeRow).
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AlertTriangle, Gift, Info, Wrench, X } from 'lucide-react';
import type { SiteNoticeRow, SiteNoticeType } from '../../types/database';
import { useTranslation } from '../../i18n';

const TYPE_PRIORITY: Record<SiteNoticeType, number> = {
  maintenance: 3,
  warning: 2,
  promo: 1,
  info: 0,
};

const BANNER_STYLE: Record<SiteNoticeType, { wrap: string; icon: string; Icon: typeof Info }> = {
  info: {
    wrap: 'border-ink-900/15 bg-cream-50 text-ink-900',
    icon: 'bg-cream-200 text-ink-600',
    Icon: Info,
  },
  warning: {
    wrap: 'border-gold-600/30 bg-gold-500/10 text-ink-900',
    icon: 'bg-gold-500/15 text-gold-600',
    Icon: AlertTriangle,
  },
  maintenance: {
    wrap: 'border-danger-600/20 bg-danger-600/10 text-ink-900',
    icon: 'bg-danger-600/10 text-danger-700',
    Icon: Wrench,
  },
  promo: {
    wrap: 'border-ink-900/10 bg-ink-950 text-cream-100',
    icon: 'bg-peach-300/15 text-peach-300',
    Icon: Gift,
  },
};

const MODAL_BADGE_STYLE: Record<SiteNoticeType, string> = {
  info: 'bg-cream-200 text-ink-700',
  warning: 'bg-gold-500/15 text-gold-600',
  maintenance: 'bg-danger-600/10 text-danger-700',
  promo: 'bg-peach-300 text-ink-900',
};

const dismissedKey = (n: SiteNoticeRow) => `loverse_notice_dismissed:${n.id}`;

function isDismissed(n: SiteNoticeRow): boolean {
  try {
    return sessionStorage.getItem(dismissedKey(n)) === '1';
  } catch {
    return false;
  }
}

function NoticeModal({ notice, onClose }: { notice: SiteNoticeRow; onClose: () => void }) {
  const { t } = useTranslation();
  const style = MODAL_BADGE_STYLE[notice.type] ?? MODAL_BADGE_STYLE.info;
  const Icon = BANNER_STYLE[notice.type]?.Icon ?? Info;
  const href = notice.cta_href?.trim() ?? '';
  const isInternal = href.startsWith('/');
  const actionLabel = notice.cta_label?.trim() || t('siteNotice.ack');
  const ctaClass =
    'mt-6 flex min-h-11 w-full items-center justify-center rounded-[3px] bg-ink-950 px-4 text-sm font-semibold text-cream-50 no-underline transition hover:bg-ember-600 active:translate-y-px';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const dismiss = () => {
    try {
      sessionStorage.setItem(dismissedKey(notice), '1');
    } catch {
      /* sessionStorage tidak tersedia — tutup saja tanpa menyimpan */
    }
    onClose();
  };

  const renderCta = () => {
    if (!href) {
      return (
        <button type="button" onClick={dismiss} className={ctaClass}>
          {actionLabel}
        </button>
      );
    }
    if (isInternal) {
      return (
        <Link to={href} onClick={dismiss} className={ctaClass}>
          {actionLabel}
        </Link>
      );
    }
    return (
      <a href={href} target="_blank" rel="noreferrer" onClick={dismiss} className={ctaClass}>
        {actionLabel}
      </a>
    );
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={notice.title}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/72 p-4 backdrop-blur-[3px]"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-md border border-ink-900/15 bg-cream-50 p-6 text-ink-900 shadow-deep sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] ${style}`}>
            <Icon size={18} />
          </span>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t('siteNotice.close')}
            className="flex h-8 w-8 shrink-0 items-center justify-center text-ink-400 transition hover:text-ink-900"
          >
            <X size={16} />
          </button>
        </div>

        <p className="eyebrow mt-6 text-ember-600">Pemberitahuan</p>
        <h2 className="mt-3 font-display text-2xl leading-tight tracking-[-0.03em] text-ink-950">{notice.title}</h2>
        {notice.body && (
          <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-ink-500">{notice.body}</p>
        )}

        {renderCta()}
      </div>
    </div>,
    document.body,
  );
}

// Banner utk satu notice: body dibatasi 2 baris di mobile (hemat layar)
// dengan tombol expand agar tetap terbaca penuh bila dipilih pengguna.
function NoticeBanner({ notice }: { notice: SiteNoticeRow }) {
  const { t } = useTranslation();
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const style = BANNER_STYLE[notice.type] ?? BANNER_STYLE.info;
  const Icon = style.Icon;
  const href = notice.cta_href?.trim() ?? '';
  const isInternal = href.startsWith('/');
  const actionLabel = notice.cta_label?.trim();

  // Deteksi apakah body terpotong clamp (tergantung lebar viewport saat itu).
  useEffect(() => {
    if (!notice.body) return;
    const check = () => {
      const el = bodyRef.current;
      if (el) setIsTruncated(el.scrollHeight > el.clientHeight + 1);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [notice.body]);

  return (
    <div className={`mx-auto flex max-w-6xl items-start gap-3 border px-4 py-3 ${style.wrap}`}>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] ${style.icon}`}>
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <span className="font-bold">{notice.title}</span>
        {notice.body && (
          <p
            ref={bodyRef}
            className={`mt-0.5 whitespace-pre-line opacity-90 ${expanded ? '' : 'line-clamp-2'}`}
          >
            {notice.body}
          </p>
        )}
        {(notice.body && (isTruncated || expanded)) || href ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {notice.body && (isTruncated || expanded) && (
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                aria-expanded={expanded}
                className="text-xs font-bold underline underline-offset-2 hover:opacity-80"
              >
                {expanded ? t('siteNotice.readLess') : t('siteNotice.readMore')}
              </button>
            )}
            {href && actionLabel && (
              isInternal ? (
                <Link
                  to={href}
                  className="text-xs font-bold underline underline-offset-2 hover:opacity-80"
                >
                  {actionLabel}
                </Link>
              ) : (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold underline underline-offset-2 hover:opacity-80"
                >
                  {actionLabel}
                </a>
              )
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function SiteNoticeView({ notices }: { notices: SiteNoticeRow[] }) {
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(() => new Set());

  // Banner: semua notice mode banner/both yang sedang berjalan.
  const banners = notices.filter((n) => n.mode === 'banner' || n.mode === 'both');

  // Modal: satu notice dengan prioritas tertinggi yang belum ditutup session ini.
  const modal = useMemo(() => {
    const candidates = notices
      .filter((n) => (n.mode === 'modal' || n.mode === 'both') && !dismissed.has(n.id) && !isDismissed(n))
      .sort((a, b) => (TYPE_PRIORITY[b.type] ?? 0) - (TYPE_PRIORITY[a.type] ?? 0));
    return candidates[0] ?? null;
  }, [notices, dismissed]);

  const dismissModal = () => {
    if (!modal) return;
    setDismissed((prev) => new Set(prev).add(modal.id));
  };

  return (
    <>
      {banners.length > 0 && (
        <div className="w-full space-y-2 bg-cream-100 px-4 pb-1 pt-3 sm:px-6 lg:px-8">
          {banners.map((n) => (
            <NoticeBanner key={n.id} notice={n} />
          ))}
        </div>
      )}

      {modal && <NoticeModal notice={modal} onClose={dismissModal} />}
    </>
  );
}
