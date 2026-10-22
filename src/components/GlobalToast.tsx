// ============================================================
// src/components/GlobalToast.tsx
// ------------------------------------------------------------
// Sistem toast global: ToastProvider (context) + hook useToast() untuk notifikasi sukses/error/info di seluruh aplikasi.
// Dipakai di  : Sangat luas: App, hampir semua pages, hooks, dan komponen admin/customer
// Keterikatan : react (createContext), lucide-react
// ============================================================

/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';
import { useTranslation } from '../i18n';

export type ToastType = 'success' | 'error' | 'warning';

/** Durasi toast tampil (ms). */
const TOAST_DURATION_MS = 3000;
/** Batas toast aktif simultan — mencegah tumpukan tak terbatas. */
const MAX_ACTIVE_TOASTS = 5;

export interface ToastApi {
  success: (msg: string) => void;
  error: (msg: string) => void;
  warning: (msg: string) => void;
}

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<ToastApi | null>(null);

export const useToast = (): ToastApi => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const { t: translate } = useTranslation();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextToastId = useRef(1);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = nextToastId.current;
    nextToastId.current += 1;
    setToasts((prev) => {
      const next = [...prev, { id, message, type }];
      // Cap jumlah toast aktif — buang yang tertua agar spam error
      // tidak menumpuk tanpa batas menutupi layar.
      return next.length > MAX_ACTIVE_TOASTS ? next.slice(next.length - MAX_ACTIVE_TOASTS) : next;
    });

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  // API context dibuat reference-stable: tanpa ini, objek toast baru di
  // SETIAP render provider memicu re-render seluruh konsumen useToast()
  // (25+ file: pages besar, hooks dashboard, semua tema via clipboard).
  const toast = useMemo<ToastApi>(
    () => ({
      success: (msg: string) => addToast(msg, 'success'),
      error: (msg: string) => addToast(msg, 'error'),
      warning: (msg: string) => addToast(msg, 'warning'),
    }),
    [addToast],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Container Alert (Top Center on Mobile, Top Right on Desktop) */}
      <div 
        aria-live="polite"
        className="fixed top-3 inset-x-3 sm:inset-x-auto sm:right-5 sm:top-5 z-[99999] pointer-events-none flex flex-col items-center sm:items-end space-y-2.5 max-w-md sm:w-auto w-full mx-auto"
      >
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto transform transition-all duration-300 ease-out flex items-center justify-between gap-3.5 px-4 py-3.5 sm:px-5 sm:py-4 rounded-2xl shadow-2xl border backdrop-blur-md w-full sm:min-w-[320px] sm:max-w-md animate-in fade-in slide-in-from-top-3 ${
                isSuccess
                  ? 'bg-white/95 border-success-600/20 text-ink-800 shadow-success-700/10'
                  : isError
                  ? 'bg-white/95 border-danger-600/20 text-ink-800 shadow-danger-700/10'
                  : 'bg-white/95 border-gold-500/30 text-ink-800 shadow-gold-600/10'
              }`}
            >
              {/* Left Indicator & Icon */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                    isSuccess
                      ? 'bg-whatsapp-600 text-white shadow-whatsapp-600/25'
                      : isError
                      ? 'bg-danger-600 text-white shadow-danger-600/25'
                      : 'bg-gold-600 text-white shadow-gold-600/25'
                  }`}
                >
                  {isSuccess && <CheckCircle className="w-5 h-5 stroke-[2.5]" />}
                  {isError && <XCircle className="w-5 h-5 stroke-[2.5]" />}
                  {isWarning && <AlertTriangle className="w-5 h-5 stroke-[2.5]" />}
                </div>

                {/* Message Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] sm:text-sm font-semibold text-ink-800 leading-snug break-words">
                    {t.message}
                  </p>
                </div>
              </div>

              {/* Close Button (Touch Friendly) */}
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                aria-label={translate("common.close")}
                className="p-1.5 -mr-1 rounded-lg text-ink-500 hover:text-ink-700 hover:bg-cream-200/80 active:scale-95 transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};