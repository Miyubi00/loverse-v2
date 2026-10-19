// ============================================================
// src/pages/ForgotPinConfirmPage.tsx
// ------------------------------------------------------------
// Halaman tujuan link "Ya, Kirim PIN Baru" / "Bukan Saya" dari email
// konfirmasi kirim ulang PIN. Memproses token sekali, lalu menampilkan
// status: loading -> sukses / dibatalkan / tidak valid.
// Dipakai di  : routes ("/forgot-pin/confirm?token=...&action=confirm|cancel")
// Keterikatan : lib/supabaseClient, i18n
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { KeyRound, LogIn, Home } from 'lucide-react';
import { useTranslation } from '../i18n';
import { ForgotPinConfirmSkeleton } from '../components/ui/SkeletonLoaders';

type ConfirmStatus = 'loading' | 'confirmed' | 'canceled' | 'invalid';

function StatusIcon() {
  return (
    <div className="bg-[#E59A59]/10 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
      <KeyRound className="w-7 h-7 sm:w-8 sm:h-8 text-[#E59A59]" />
    </div>
  );
}

export default function ForgotPinConfirmPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const [status, setStatus] = useState<ConfirmStatus>('loading');
  // Guard dobel-eksekusi: React StrictMode (dev) menjalankan efek 2x, dan
  // token konfirmasi hanya boleh dipakai SEKALI.
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const run = async () => {
      const token = params.get('token') ?? '';
      const action = params.get('action') === 'cancel' ? 'cancel' : 'confirm';

      if (!token) {
        setStatus('invalid');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('resend-pin', {
          body: { token, action },
        });
        if (error) {
          console.error('Confirm PIN Error:', error);
          setStatus('invalid');
          return;
        }
        const result = (data as { status?: string } | null)?.status;
        if (result === 'confirmed') setStatus('confirmed');
        else if (result === 'canceled') setStatus('canceled');
        else setStatus('invalid');
      } catch (err) {
        console.error('Confirm PIN Exception:', err);
        setStatus('invalid');
      }
    };

    void run();
  }, [params]);

  if (status === 'loading') {
    return <ForgotPinConfirmSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#F1E8DC] flex items-center justify-center p-3 sm:p-4 font-sans">
      <div className="bg-white p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl shadow-xl w-full max-w-md border border-[#EBDFCE] text-center">
        <StatusIcon />
        {status === 'confirmed' ? (
          <>
            <h1 className="text-xl sm:text-2xl font-black text-[#712E1E]">
              {t('forgotPinConfirm.successTitle')}
            </h1>
            <p className="text-stone-500 mt-2 text-xs sm:text-sm leading-relaxed">
              {t('forgotPinConfirm.successDesc')}
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center justify-center gap-2 w-full bg-[#E59A59] text-white py-3 rounded-xl font-bold text-sm sm:text-base shadow-lg hover:bg-[#d48b4b] transition"
            >
              <LogIn className="w-5 h-5" /> {t('forgotPinConfirm.btnLogin')}
            </Link>
          </>
        ) : status === 'canceled' ? (
          <>
            <h1 className="text-xl sm:text-2xl font-black text-[#712E1E]">
              {t('forgotPinConfirm.declinedTitle')}
            </h1>
            <p className="text-stone-500 mt-2 text-xs sm:text-sm leading-relaxed">
              {t('forgotPinConfirm.declinedDesc')}
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm sm:text-base text-[#712E1E] bg-[#FAF6EE] hover:bg-[#F1E8DC] transition"
            >
              <Home className="w-5 h-5" /> {t('forgotPinConfirm.btnBack')}
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-xl sm:text-2xl font-black text-[#712E1E]">
              {t('forgotPinConfirm.errorTitle')}
            </h1>
            <p className="text-stone-500 mt-2 text-xs sm:text-sm leading-relaxed">
              {t('forgotPinConfirm.errorDesc')}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              <Link
                to="/forgot-pin"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm sm:text-base text-white bg-[#E59A59] hover:bg-[#d48b4b] transition"
              >
                {t('forgotPinConfirm.btnRetry')}
              </Link>
              <Link
                to="/login"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm sm:text-base text-[#712E1E] bg-[#FAF6EE] hover:bg-[#F1E8DC] transition"
              >
                <LogIn className="w-5 h-5" /> {t('forgotPinConfirm.btnLogin')}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
