// supabase/functions/_shared/monitoring.ts
// Error reporting ke Sentry via Envelope API — TANPA dependency SDK.
// Aktif hanya bila secret SENTRY_DSN diset; fire-and-forget agar
// monitoring tidak pernah memperlambat / menggagalkan fungsi utama.
//
// Format DSN: https://<publicKey>@<host>/<projectId>

const CLIENT = 'loverse-edge/1.0';

function describeError(error: unknown): { type: string; value: string } {
  if (error instanceof Error) return { type: error.name, value: error.message };
  return { type: 'Unknown', value: String(error) };
}

async function send(dsn: string, error: unknown, context?: Record<string, unknown>): Promise<void> {
  const url = new URL(dsn);
  const projectId = url.pathname.replace(/\//g, '');
  const publicKey = url.username;
  const eventId = crypto.randomUUID();

  const { type, value } = describeError(error);
  const envelopeHeader = JSON.stringify({
    event_id: eventId,
    sent_at: new Date().toISOString(),
  });
  const itemHeader = JSON.stringify({ type: 'event' });
  const event = JSON.stringify({
    event_id: eventId,
    timestamp: Math.floor(Date.now() / 1000),
    platform: 'javascript',
    logger: 'edge-function',
    level: 'error',
    environment: Deno.env.get('SENTRY_ENVIRONMENT') ?? 'production',
    exception: { values: [{ type, value }] },
    ...(context ? { extra: context } : {}),
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    await fetch(`${url.protocol}//${url.host}/api/${projectId}/envelope/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_key=${publicKey}, sentry_version=7, sentry_client=${CLIENT}`,
      },
      body: `${envelopeHeader}\n${itemHeader}\n${event}\n`,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Laporkan error ke Sentry (fire-and-forget). No-op tanpa SENTRY_DSN. */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  const dsn = Deno.env.get('SENTRY_DSN');
  if (!dsn) return;
  const p = send(dsn, error, context).catch((e) =>
    console.error('[monitoring] Gagal kirim error ke Sentry:', e)
  );
  // Tahan promise agar runtime tidak memotong sebelum terkirim.
  const rt = (globalThis as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } })
    .EdgeRuntime;
  if (rt?.waitUntil) rt.waitUntil(p);
}