import { createContext, useContext } from 'react';

export type ToastType = 'success' | 'error' | 'warning';

export interface ToastApi {
  success: (msg: string) => void;
  error: (msg: string) => void;
  warning: (msg: string) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);

export const useToast = (): ToastApi => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};
