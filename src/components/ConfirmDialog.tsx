import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslation } from '../i18n';
import Modal from './ui/Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  /** Aksi async saat "Ya, Lanjutkan". Dialog otomatis menutup setelah selesai. */
  onConfirm?: () => void;
  /** Wajib: fungsi penutup dialog (dipanggil saat Batal & setelah konfirmasi). */
  onCancel: () => void;
  isDanger?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isDanger = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    if (busy) return;
    if (!onConfirm) {
      onCancel();
      return;
    }
    setBusy(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('[ConfirmDialog] onConfirm error:', error);
    } finally {
      setBusy(false);
      onCancel();
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onCancel}
      ariaLabel={title}
      closeOnEsc={false}
      closeOnBackdrop={false}
      overlayClassName="items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm"
      panelClassName="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
    >
      <div className="flex flex-col items-center text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4
          ${isDanger ? 'bg-danger-600/10 text-danger-600' : 'bg-peach-200 text-ember-700'}`}>
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-ink-800 mb-2">{title}</h3>
        <p className="text-ink-500 mb-8 leading-relaxed">{message}</p>

        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 py-3 px-6 rounded-xl border border-cream-300 font-bold text-ink-600 hover:bg-cream-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            className={`flex-1 py-3 px-6 rounded-xl font-bold text-white shadow-lg transition transform hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait disabled:hover:translate-y-0
            ${isDanger ? 'bg-danger-600 hover:bg-danger-700' : 'bg-ember-700 hover:bg-ember-600'}`}
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> {t('common.loading')}
              </>
            ) : (
              t('common.confirm')
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
