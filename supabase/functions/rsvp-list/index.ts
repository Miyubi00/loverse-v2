// supabase/functions/rsvp-list/index.ts
// Daftar RSVP/ucapan untuk SATU undangan (halaman tamu publik).
// POST { slug } -> daftar milik order itu saja (maks 500, terbaru dulu).
// Tanpa auth (slug = kapabilitas, sama seperti membuka undangannya),
// sehingga SELECT publik global di DB bisa dicabut (anti-scraping).
// Kolom yang dikembalikan dibatasi (tanpa session_id/internal).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCorsPreflight, jsonCors } from '../_shared/cors.ts'

serve(async (req) => {
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight
  if (req.method !== 'POST') return jsonCors(req, { error: 'Method not allowed' }, 405);

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return jsonCors(req, { error: 'Bad request' }, 400);
  }
  const slug = String(payload.slug ?? '').trim().slice(0, 200);
  if (!slug) return jsonCors(req, { error: 'slug wajib dikirim.' }, 400);
  // session_id opsional milik pengunjung sendiri (dari localStorage) —
  // dipakai HANYA untuk menandai baris miliknya, nilainya tak dikembalikan.
  const sessionId = typeof payload.session_id === 'string' ? payload.session_id.slice(0, 100) : '';

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: order, error: orderError } = await admin
    .from('orders')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (orderError || !order) return jsonCors(req, { error: 'Undangan tidak ditemukan.' }, 404);

  const { data: rsvps, error: rsvpError } = await admin
    .from('rsvps')
    .select('id, guest_name, status, pax, message, reply, created_at, session_id')
    .eq('order_id', order.id)
    .order('created_at', { ascending: false })
    .limit(500);

  if (rsvpError) return jsonCors(req, { error: 'Gagal memuat RSVP.' }, 500);
  // session_id TIDAK PERNAH dikembalikan — hanya penanda milik sendiri.
  const safe = (rsvps ?? []).map((r) => ({
    id: r.id,
    order_id: order.id,
    session_id: '',
    guest_name: r.guest_name,
    status: r.status,
    pax: r.pax,
    message: r.message,
    reply: (r as { reply?: string }).reply ?? undefined,
    created_at: r.created_at,
    is_mine: !!sessionId && (r as { session_id?: string }).session_id === sessionId,
  }));
  return jsonCors(req, { ok: true, rsvps: safe });
});
