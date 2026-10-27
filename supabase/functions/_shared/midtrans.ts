// supabase/functions/_shared/midtrans.ts
// Pure helpers for Midtrans webhook processing.
//
// Kept free of I/O so they can be unit-tested with `deno test`
// without a database or network.

/** Raw, untrusted notification body as sent by Midtrans. */
export interface MidtransNotification {
  order_id?: unknown;
  status_code?: unknown;
  gross_amount?: unknown;
  signature_key?: unknown;
  transaction_status?: unknown;
  fraud_status?: unknown;
}

export interface NotificationFields {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
}

/**
 * Extract and type-check the fields required for signature verification.
 * Returns null when the payload is malformed (wrong types, missing values,
 * or implausible lengths) instead of throwing, so callers can reject cleanly.
 */
export function extractNotificationFields(
  raw: unknown,
): NotificationFields | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const n = raw as MidtransNotification;

  const orderId = n.order_id;
  const statusCode = n.status_code;
  const grossAmount = n.gross_amount;
  const signatureKey = n.signature_key;

  if (
    typeof orderId !== 'string' || orderId.length === 0 ||
    orderId.length > 255 ||
    typeof statusCode !== 'string' || statusCode.length === 0 ||
    statusCode.length > 10 ||
    typeof grossAmount !== 'string' || grossAmount.length === 0 ||
    grossAmount.length > 20 ||
    !/^\d+(\.\d{1,2})?$/.test(grossAmount) ||
    typeof signatureKey !== 'string' || signatureKey.length === 0 ||
    signatureKey.length > 128
  ) {
    return null;
  }

  return { orderId, statusCode, grossAmount, signatureKey };
}

async function sha512Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Constant-time string comparison for fixed-length hex digests. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Verify the Midtrans SHA-512 signature:
 *   sha512(order_id + status_code + gross_amount + serverKey)
 *
 * STRICT: missing, malformed, or incorrect signatures all return false.
 * There is no code path that skips verification.
 */
export async function verifyMidtransSignature(
  fields: NotificationFields,
  serverKey: string | undefined | null,
): Promise<boolean> {
  if (!serverKey) return false;
  const expected = await sha512Hex(
    `${fields.orderId}${fields.statusCode}${fields.grossAmount}${serverKey}`,
  );
  return safeEqual(fields.signatureKey, expected);
}

export type MappedPaymentStatus = 'success' | 'failed';

/**
 * Map a transaction_status/fraud_status pair to a local payment status.
 *
 * Returns null for every state that must NOT trigger a database write
 * (pending, challenge, refund, authorize, unknown values). Callers treat
 * null as "acknowledge and ignore" — this makes the webhook resilient to
 * unexpected future statuses instead of blindly overwriting state.
 */
export function mapTransactionStatus(
  transactionStatus: unknown,
  fraudStatus: unknown,
): MappedPaymentStatus | null {
  if (typeof transactionStatus !== 'string') return null;
  switch (transactionStatus) {
    case 'capture':
    case 'settlement':
      // A challenged transaction is undecided: keep current status.
      return fraudStatus === 'challenge' ? null : 'success';
    case 'deny':
    case 'cancel':
    case 'expire':
      return 'failed';
    default:
      // pending, refund, partial_refund, authorize, anything new.
      return null;
  }
}

// ---------------------------------------------------------------------------
// Environment (SATU sumber kebenaran per environment runtime)
// ---------------------------------------------------------------------------

export type MidtransEnvironment = 'production' | 'sandbox';

/**
 * Sisi SERVER membaca secret `MIDTRANS_IS_PRODUCTION` ('true'|'false').
 * Default sandbox agar salah konfigurasi tidak pernah menagih uang sungguhan.
 */
export function resolveMidtransEnvironment(
  isProductionRaw: string | undefined | null,
): MidtransEnvironment {
  const v = (isProductionRaw ?? '').trim().toLowerCase();
  return v === 'true' || v === '1' ? 'production' : 'sandbox';
}

/** Base URL Snap API sesuai environment. */
export function snapApiBaseUrl(env: MidtransEnvironment): string {
  return env === 'production'
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
}
