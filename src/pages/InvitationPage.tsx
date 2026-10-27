// ============================================================
// src/pages/InvitationPage.tsx
// ------------------------------------------------------------
// Halaman /wedding/:slug?to=Nama - render undangan untuk tamu: fetch data publik via VIEW, pilih tema dari Registry, state RSVP & amplop.
// Dipakai di  : App.tsx (via InvitationLayout)
// Keterikatan : templates/Registry, lib/supabaseClient, types/database, types/template
// ============================================================

import { createElement, useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import '../styles/invitation-themes.css';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../components/GlobalToast';
import { getTemplateComponent } from '../templates/Registry';
import type { PublicInvitationRow, RsvpRow } from '../types/database';
import type { RsvpPayload } from '../types/template';
import { InvitationSkeleton } from '../components/ui/SkeletonLoaders';
import { Lock, FileX, Clock } from 'lucide-react';
import { useTranslation } from '../i18n';

export default function InvitationRender() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const { t } = useTranslation();
  const guestName = searchParams.get('to') || 'Tamu Undangan';

  const [orderData, setOrderData] = useState<PublicInvitationRow | null>(null);
  const [rsvps, setRsvps] = useState<RsvpRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageStatus, setPageStatus] = useState('loading');
  const [myRsvp, setMyRsvp] = useState<RsvpRow | null>(null);
  const [submittingRsvp, setSubmittingRsvp] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: order, error: orderError } = await supabase
          .from('public_invitations')
          .select('*')
          .eq('slug', slug)
          .single();

        if (orderError || !order) {
          setPageStatus('not_found');
          setLoading(false);
          return;
        }

        if (order.payment_status !== 'success') {
          setPageStatus('unpaid');
          setLoading(false);
          return;
        }

        setOrderData(order);

        // Daftar ucapan lewat edge function (DB menolak SELECT publik agar
        // tak bisa di-scrape lintas undangan). Sertakan session milik
        // sendiri agar server menandai baris `is_mine`.
        const sessionId = localStorage.getItem('rsvp_session_id') ?? '';
        const { data: rsvpRes, error: rsvpError } = await supabase.functions.invoke('rsvp-list', {
          body: { slug, session_id: sessionId },
        });

        const rsvpData = (rsvpRes as { rsvps?: RsvpRow[] } | null)?.rsvps as RsvpRow[] | undefined;
        const rows = Array.isArray(rsvpData) ? rsvpData : [];
        if (!rsvpError) {
          setRsvps(rows);
        }

        if (sessionId && !rsvpError) {
          const found = rows.find((r) => r.is_mine);
          if (found) {
            setMyRsvp(found);
          }
        }

        setPageStatus('success');
      } catch (err) {
        console.error('Error fetching invitation data:', err);
        setPageStatus('not_found');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  const handleRsvpSubmit = async (rsvpPayload: RsvpPayload): Promise<void> => {
    if (!orderData) return;
    if (myRsvp) {
      toast.warning(t('toast.alreadyFilledRsvp'));
      return;
    }
    // Cegah klik ganda: submit pertama yang menang, sisanya diabaikan.
    if (submittingRsvp) return;
    setSubmittingRsvp(true);

    try {
      let sessionId = localStorage.getItem('rsvp_session_id');
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('rsvp_session_id', sessionId);
      }

      // INSERT tanpa .select(): anon tak punya izin SELECT langsung
      // (anti-scraping); daftar dimuat ulang lewat rsvp-list di bawah.
      const { error } = await supabase.from('rsvps').insert({
        order_id: orderData.id,
        session_id: sessionId,
        guest_name: guestName,
        status: rsvpPayload.status,
        pax: rsvpPayload.pax,
        message: rsvpPayload.message,
      });

      if (error) throw error;

      const { data: refreshed } = await supabase.functions.invoke('rsvp-list', {
        body: { slug, session_id: sessionId },
      });
      const rows = (refreshed as { rsvps?: RsvpRow[] } | null)?.rsvps;
      if (Array.isArray(rows)) {
        setRsvps(rows);
        const found = rows.find((r) => r.is_mine);
        if (found) setMyRsvp(found);
      }
    } catch (err) {
      // 409/23505 = baris sesi ini SUDAH ada (klik ganda lolos / submit
      // lama yang UI-nya ketinggalan). Sinkronkan lalu anggap sudah mengisi,
      // bukan error menakutkan.
      const code = (err as { code?: string })?.code;
      const msg = err instanceof Error ? err.message : String(err);
      if (code === '23505' || msg.includes('23505') || msg.includes('duplicate')) {
        try {
          const sessionId = localStorage.getItem('rsvp_session_id') ?? '';
          const { data: refreshed } = await supabase.functions.invoke('rsvp-list', {
            body: { slug, session_id: sessionId },
          });
          const rows = (refreshed as { rsvps?: RsvpRow[] } | null)?.rsvps;
          if (Array.isArray(rows)) {
            setRsvps(rows);
            const found = rows.find((r) => r.is_mine);
            if (found) setMyRsvp(found);
          }
        } catch {
          /* abaikan — cukup beri tahu sudah tercatat */
        }
        toast.warning(t('toast.alreadyFilledRsvp'));
      } else {
        console.error('RSVP Error:', err);
        toast.error(t('toast.rsvpSendFailed'));
      }
    } finally {
      setSubmittingRsvp(false);
    }
  };

  if (loading) {
    return <InvitationSkeleton />;
  }

  if (pageStatus === 'not_found') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-cream-100 p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-cream-300 max-w-sm w-full">
          <FileX className="w-16 h-16 text-ink-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-ink-800 mb-2">{t('invitation.notFoundTitle')}</h2>
          <p className="text-ink-500 text-sm">{t('invitation.notFoundDesc')}</p>
        </div>
      </div>
    );
  }

  if (pageStatus === 'unpaid') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-cream-100 p-6 text-center font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-champagne max-w-md w-full relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-tembaga/15 rounded-full opacity-50 blur-2xl" />

          <div className="relative z-10">
            <div className="w-20 h-20 bg-danger-600/5 text-danger-600 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-danger-600/20">
              <Lock size={32} />
            </div>
            <h1 className="text-2xl font-extrabold text-ink-900 mb-2">{t('invitation.unpaidTitle')}</h1>
            <p className="text-ink-500 text-sm mb-6 leading-relaxed">
              {t('invitation.unpaidDesc')}
            </p>

            <div className="bg-cream-100 p-4 rounded-xl border border-cream-300 text-[14px] text-ink-500 mb-6 flex items-start gap-3 text-left">
              <Clock className="w-5 h-5 text-ember-600 shrink-0" />
              <div>
                <p className="font-bold text-ink-700">{t('invitation.ownerQuestion')}</p>
                <p>{t('invitation.ownerHelp')}</p>
              </div>
            </div>

            <a href="/" className="block w-full bg-ink-950 text-white py-3 rounded-xl font-bold text-sm hover:bg-ink-900 transition">
              {t('invitation.btnHome')}
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!orderData) return null;

  const themeSlug = orderData.template_slug || 'rustic-floral';

  return (
    <Suspense fallback={<InvitationSkeleton />}>
      {/* createElement: komponen tema diambil dari registry dinamis berbasis
          slug — pola lazy-registry yang tidak lolos aturan react-hooks/static-components
          bila ditulis sebagai JSX dengan variabel hasil pemanggilan fungsi. */}
      {createElement(getTemplateComponent(themeSlug), {
        groom: orderData.groom_name,
        bride: orderData.bride_name,
        date: orderData.wedding_date,
        guestName,
        orderId: orderData.id,
        onRsvpSubmit: handleRsvpSubmit,
        submittedData: myRsvp,
        data: {
          ...orderData.event_details,
          gallery: orderData.event_details?.gallery || [],
          banks: orderData.event_details?.banks || [],
          rsvps: rsvps || [],
        },
      })}
    </Suspense>
  );
}
