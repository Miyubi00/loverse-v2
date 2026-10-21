// ============================================================
// src/components/order/constants.ts
// ------------------------------------------------------------
// Konstanta, tipe, dan helper halaman /order: metode pembayaran,
// logo Midtrans, konfigurasi e-wallet & bank VA, util harga/form.
// Dipakai di  : pages/OrderPage, hooks/useOrderCheckout, components/order/*
// Keterikatan : -
// ============================================================

export type PaymentMethodType =
  | "automatic"
  | "qris"
  | "gopay"
  | "shopeepay"
  | "dana"
  | "bca_va"
  | "echannel"
  | "bni_va"
  | "bri_va"
  | "permata_va"
  | "cimb_va"
  | "seabank_va"
  | "bsi_va"
  | "whatsapp";

export type ExpandedCategory = "qris" | "ewallet" | "va" | "whatsapp";

export type MidtransMethod = Exclude<PaymentMethodType, "whatsapp" | "automatic">;

export interface OrderFormData {
  groom_name: string;
  bride_name: string;
  wedding_date: string;
  whatsapp: string;
  email: string;
  template_slug: string;
}

// Logo kanal bayar di-host di R2 (anti-beban situs, cache CDN).
const PAY_LOGO_BASE = "https://r2.loverse.id/logos/payment";

export const MIDTRANS_LOGOS = {
  qris: `${PAY_LOGO_BASE}/qris.svg`,
  dana: `${PAY_LOGO_BASE}/dana.svg`,
  shopeepay: `${PAY_LOGO_BASE}/shopeepay.svg`,
  spaylater: `${PAY_LOGO_BASE}/spaylater.svg`,
  gopay: `${PAY_LOGO_BASE}/gopay.svg`,
  gopaylater: `${PAY_LOGO_BASE}/gopaylater.svg`,
  bca: `${PAY_LOGO_BASE}/bca.svg`,
  mandiri: `${PAY_LOGO_BASE}/mandiri.svg`,
  bni: `${PAY_LOGO_BASE}/bni.svg`,
  bri: `${PAY_LOGO_BASE}/bri.svg`,
  cimb: `${PAY_LOGO_BASE}/cimb.svg`,
  permata: `${PAY_LOGO_BASE}/permata.svg`,
  seabank: `${PAY_LOGO_BASE}/seabank.svg`,
  bsi: `${PAY_LOGO_BASE}/bsi.svg`,
};

const EWALLET_METHODS = [
  "gopay",
] as const satisfies readonly MidtransMethod[];

const VA_METHODS = [
  "echannel",
  "bni_va",
  "bri_va",
  "permata_va",
  "cimb_va",
  "bsi_va",
] as const satisfies readonly MidtransMethod[];

export type EwalletMethod = (typeof EWALLET_METHODS)[number];
export type VaMethod = (typeof VA_METHODS)[number];

export const isEwalletMethod = (
  method: PaymentMethodType | null,
): method is EwalletMethod =>
  (EWALLET_METHODS as readonly string[]).includes(method as string);

export const isVaMethod = (
  method: PaymentMethodType | null,
): method is VaMethod =>
  (VA_METHODS as readonly string[]).includes(method as string);

interface EwalletOption {
  id: EwalletMethod;
  name: string;
  descKey: string;
  logoBoxClass: string;
  logos: { src: string; alt: string; className: string }[];
}

export const EWALLET_OPTIONS: readonly EwalletOption[] = [
  {
    id: "gopay",
    name: "GoPay / GoPay Later",
    descKey: "order.gopayDesc",
    logoBoxClass:
      "bg-white border border-cream-300 rounded-lg px-2 py-0.5 sm:px-2.5 sm:py-1 flex items-center gap-1 shadow-xs shrink-0",
    logos: [
      {
        src: MIDTRANS_LOGOS.gopay,
        alt: "GoPay",
        className: "h-3.5 sm:h-4 w-auto object-contain",
      },
      {
        src: MIDTRANS_LOGOS.gopaylater,
        alt: "GoPayLater",
        className: "h-3.5 sm:h-4 w-auto object-contain",
      },
    ],
  },
];

interface VaBank {
  id: VaMethod;
  name: string;
  /** Logo bank; kosong = tampil sebagai teks (mis. Permata belum ada file logo). */
  logo?: string;
  h: string;
}

export const VA_BANKS: readonly VaBank[] = [
  {
    id: "echannel",
    name: "Mandiri Virtual Account",
    logo: MIDTRANS_LOGOS.mandiri,
    h: "h-3",
  },
  {
    id: "bni_va",
    name: "BNI Virtual Account",
    logo: MIDTRANS_LOGOS.bni,
    h: "h-2.5",
  },
  {
    id: "bri_va",
    name: "BRI Virtual Account",
    logo: MIDTRANS_LOGOS.bri,
    h: "h-3",
  },
  {
    id: "permata_va",
    name: "Permata Virtual Account",
    logo: MIDTRANS_LOGOS.permata,
    h: "h-3",
  },
  {
    id: "cimb_va",
    name: "CIMB Niaga Virtual Account",
    logo: MIDTRANS_LOGOS.cimb,
    h: "h-3",
  },
  {
    id: "bsi_va",
    name: "BSI Virtual Account",
    logo: MIDTRANS_LOGOS.bsi,
    h: "h-3",
  },
];

export function getPaymentMethodFee(
  basePrice: number,
  method: PaymentMethodType,
): number {
  // WAJIB SINKRON dengan create-order: fee kanal + PPN 11%, dibebankan ke
  // pelanggan (split Midtrans MATI). QRIS 0,7%; GoPay 1,5%; VA flat Rp 4.000.
  // Manual WA = Rp 0. Parameter dipertahankan agar signature stabil.
  if (method === "whatsapp") {
    return 0;
  }
  const channelFee =
    method === "qris"
      ? Math.ceil(basePrice * 0.007)
      : method === "gopay"
        ? Math.ceil(basePrice * 0.015)
        : 4000;
  return channelFee + Math.ceil(channelFee * 0.11);
}

export const formatIDR = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const INPUT_CLASS =
  "w-full min-w-0 rounded-[2px] border border-ink-900/15 bg-cream-50/60 py-2.5 pl-10 pr-3 text-sm text-ink-950 outline-none transition-colors placeholder:text-ink-300 focus:border-ember-500 focus:bg-white focus:ring-2 focus:ring-ember-500/10 sm:py-3 sm:text-[15px]";

export const PAYMENT_SUMMARY_LABEL_KEYS: Record<PaymentMethodType, string> = {
  automatic: "order.orderSummaryAutomatic",
  qris: "order.orderSummaryQris",
  gopay: "order.orderSummaryGopay",
  shopeepay: "order.orderSummaryShopeepay",
  dana: "order.orderSummaryDana",
  bca_va: "order.orderSummaryBcaVa",
  echannel: "order.orderSummaryMandiriVa",
  bni_va: "order.orderSummaryBniVa",
  bri_va: "order.orderSummaryBriVa",
  permata_va: "order.orderSummaryPermataVa",
  cimb_va: "order.orderSummaryCimbVa",
  seabank_va: "order.orderSummarySeabankVa",
  bsi_va: "order.orderSummaryBsiVa",
  whatsapp: "order.orderSummaryWa",
};

export const PAYMENT_BUTTON_LABEL_KEYS: Record<PaymentMethodType, string> = {
  automatic: "order.btnPayAuto",
  qris: "order.btnPayQris",
  gopay: "order.btnPayGopay",
  shopeepay: "order.btnPayShopeepay",
  dana: "order.btnPayDana",
  bca_va: "order.btnPayBca",
  echannel: "order.btnPayMandiri",
  bni_va: "order.btnPayBni",
  bri_va: "order.btnPayBri",
  permata_va: "order.btnPayPermata",
  cimb_va: "order.btnPayCimb",
  seabank_va: "order.btnPaySeabank",
  bsi_va: "order.btnPayBsi",
  whatsapp: "order.btnPayWa",
};
