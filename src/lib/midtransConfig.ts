// ============================================================
// src/lib/midtransConfig.ts
// ------------------------------------------------------------
// Satu sumber kebenaran config Midtrans sisi klien: pilih environment sandbox/production (nilai lain dianggap sandbox), muat script Snap dinamis.
// Dipakai di  : OrderPage, PaymentStatusPage (init hanya pada alur pembayaran)
// Keterikatan : env VITE_MIDTRANS_*
// ============================================================

// Midtrans Payment Gateway Configuration.
//
// SATU sumber kebenaran environment di sisi klien:
//   VITE_MIDTRANS_ENVIRONMENT = 'sandbox' | 'production'
// (nilai lain dianggap sandbox agar salah ketik tidak pernah memakai
//  konfigurasi produksi). Script Snap sesuai environment dimuat dinamis
// bersama data-client-key publik.

const SNAP_SCRIPT_URLS = {
  production: 'https://app.midtrans.com/snap/snap.js',
  sandbox: 'https://app.sandbox.midtrans.com/snap/snap.js',
} as const;

type SnapEnv = keyof typeof SNAP_SCRIPT_URLS;

/** Penanda milik loader ini — mencegah duplikasi & memungkinkan audit env. */
const SNAP_TAG_ATTR = 'data-midtrans-snap';

export type MidtransClientEnvironment = SnapEnv;

export function getMidtransEnvironment(): SnapEnv {
  const raw = import.meta.env.VITE_MIDTRANS_ENVIRONMENT;
  if (raw === 'production') return 'production';
  if (raw && raw !== 'sandbox') {
    console.warn(
      `[Midtrans] VITE_MIDTRANS_ENVIRONMENT="${String(raw)}" tidak dikenal — fallback ke sandbox.`,
    );
  }
  return 'sandbox';
}

export const isMidtransProduction = (): boolean =>
  getMidtransEnvironment() === 'production';

export const isMidtransEnabled = (): boolean => {
  return !!import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
};

/**
 * Muat script Snap sesuai environment (idempoten).
 *
 * Hardening:
 * - Tag script ditandai `data-midtrans-snap="<env>"` → duplikasi mustahil.
 * - Tag lama dengan env BERBEDA dihapus + warning (tidak pernah menerima
 *   instans yang tidak cocok secara diam-diam).
 * - `window.snap` yang ada TANPA tag milik loader dianggap asing → warning,
 *   lalu tetap muat skrip yang benar (snap.js akan menimpa window.snap).
 */
export const initializeMidtrans = (): boolean => {
  const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;

  if (!clientKey) {
    if (!window.snap) {
      window.snap = {
        pay: () => {
          throw new Error(
            'Midtrans payment gateway is not configured. Please set VITE_MIDTRANS_CLIENT_KEY environment variable.'
          );
        },
      };
    }
    return false;
  }

  const env = getMidtransEnvironment();

  // Sudah ada tag utk env ini → jangan injeksi ganda.
  const existing = document.querySelector<HTMLScriptElement>(`script[${SNAP_TAG_ATTR}]`);
  if (existing) {
    const existingEnv = existing.getAttribute(SNAP_TAG_ATTR);
    if (existingEnv === env) {
      return true; // pemuatan ulang modul (mis. HMR): tag sudah benar.
    }
    console.warn(
      `[Midtrans] Snap "${existingEnv}" terdeteksi — mengganti ke "${env}".`,
    );
    existing.remove();
  } else if (window.snap && typeof window.snap.pay === 'function') {
    console.warn(
      `[Midtrans] window.snap sudah ada tanpa loader resmi — memuat ulang Snap (${env}).`,
    );
  }

  const script = document.createElement('script');
  script.src = SNAP_SCRIPT_URLS[env];
  script.setAttribute('data-client-key', clientKey);
  script.setAttribute(SNAP_TAG_ATTR, env);
  script.async = true;
  script.addEventListener('load', () => {
    script.dataset.loaded = 'true';
  }, { once: true });
  document.head.appendChild(script);

  console.info(`[Midtrans] Snap (${env}) dimuat.`);
  return true;
};

/** Load Snap on user intent and wait until its payment API is available. */
export async function loadMidtransSnap(): Promise<boolean> {
  if (!isMidtransEnabled()) return false;

  const env = getMidtransEnvironment();
  const current = document.querySelector<HTMLScriptElement>(`script[${SNAP_TAG_ATTR}]`);
  if (
    current?.getAttribute(SNAP_TAG_ATTR) === env &&
    (current.dataset.loaded === 'true' || typeof window.snap?.pay === 'function')
  ) {
    return typeof window.snap?.pay === 'function';
  }

  initializeMidtrans();
  const script = document.querySelector<HTMLScriptElement>(`script[${SNAP_TAG_ATTR}]`);
  if (!script) return false;

  return new Promise((resolve) => {
    const finish = () => resolve(typeof window.snap?.pay === 'function');
    script.addEventListener('load', finish, { once: true });
    script.addEventListener('error', () => resolve(false), { once: true });
    if (script.dataset.loaded === 'true') finish();
  });
}
