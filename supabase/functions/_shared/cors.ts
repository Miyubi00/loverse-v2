// supabase/functions/_shared/cors.ts
// Header CORS terpusat untuk semua edge function yang dipanggil browser.
//
// Secret ALLOWED_ORIGIN mendukung MULTI origin koma-dipisah, mis:
//   ALLOWED_ORIGIN="https://loverse.id,https://www.loverse.id"
// Origin request yang cocok dikembalikan verbatim (wajib untuk credentialed
// CORS); yang tidak cocok mendapat origin pertama (browser tetap memblokir).
// Tanpa secret SAMA SEKALI -> '*' (mode dev; JANGAN di produksi).
// Selalu kirim `Vary: Origin` agar cache tidak tertukar antar origin.

export function getCorsHeaders(req: Request): Record<string, string> {
  const raw = (Deno.env.get('ALLOWED_ORIGIN') ?? '').trim();
  if (!raw) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };
  }
  const allowed = raw
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  const origin = (req.headers.get('Origin') ?? '').trim().replace(/\/+$/, '');
  const match = origin && allowed.includes(origin) ? origin : (allowed.includes('*') ? '*' : allowed[0] ?? '');
  return {
    'Access-Control-Allow-Origin': match,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };
}

/** Respon JSON standar dengan CORS per-request. */
export function jsonCors(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  });
}

/** Jawaban preflight OPTIONS. Kembalikan null bila bukan OPTIONS. */
export function handleCorsPreflight(req: Request): Response | null {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: getCorsHeaders(req) });
  return null;
}
