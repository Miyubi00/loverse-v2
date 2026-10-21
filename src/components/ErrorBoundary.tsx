// ============================================================
// src/components/ErrorBoundary.tsx
// ------------------------------------------------------------
// Error boundary React: menangkap crash render subtree agar aplikasi tidak blank total; tampil fallback + tombol reload.
// Dipakai di  : App.tsx
// Keterikatan : react (Component API), lucide-react
// ============================================================

// Menangkap crash di subtree React (mis. salah satu tema error)
// agar seluruh aplikasi tidak ikut blank.

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { captureError } from '../lib/monitoring';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    captureError(error, { componentStack: info.componentStack ?? undefined });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-cream-100 p-6 text-center font-sans">
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-cream-300 max-w-sm w-full">
            <div className="w-16 h-16 rounded-full bg-danger-600/5 text-danger-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} />
            </div>
            <h1 className="text-xl font-bold text-ink-800 mb-2">Terjadi Kesalahan</h1>
            <p className="text-ink-500 text-sm mb-6">
              Maaf, terjadi kesalahan saat menampilkan halaman ini. Coba muat ulang.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={this.handleReset}
                className="w-full bg-ember-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-ember-700 transition"
              >
                Coba Lagi
              </button>
              <button
                onClick={() => window.location.assign('/')}
                className="w-full bg-cream-200 text-ink-700 py-3 rounded-xl font-bold text-sm hover:bg-cream-300 transition"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
