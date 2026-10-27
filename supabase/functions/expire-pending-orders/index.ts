// supabase/functions/expire-pending-orders/index.ts
// Housekeeping HARIAN (dijadwalkan, bukan dipanggil user):
//  1) Pending kedaluwarsa: pending_orders berstatus 'menunggu_pembayaran'
//     yang berumur > 24 jam -> status 'kedaluwarsa' + baris audit
//     (kind='system', action='pending_expired') per baris.
//  2) Retensi log: hapus admin_audit_log berumur > 1 tahun.
// Otorisasi: header `x-cron-secret` HARUS sama dengan secret CRON_SECRET.
// Penjadwalan via pg_cron Supabase LANGSUNG (lihat
// supabase/scheduled-jobs.example.sql — dijalankan manual di SQL editor,
// bukan migration agar secret tidak ke-commit). Header apikey +
// Authorization (anon key) WAJIB ikut, tanpa itu gateway menolak 401.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';
const PENDING_TTL_HOURS = 24;
const AUDIT_RETENTION_DAYS = 365;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status,
  })
}

serve(async (req) => {
  if (req.method === 'GET') return new Response('ok', { status: 200 });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  if (!CRON_SECRET) {
    console.error('[expire] CRON_SECRET belum diset.');
    return json({ error: 'Not configured' }, 500);
  }
  if ((req.headers.get('x-cron-secret') ?? '') !== CRON_SECRET) {
    return json({ error: 'Forbidden' }, 403);
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // --- 1. Tandai pending kedaluwarsa ---
  const cutoff = new Date(Date.now() - PENDING_TTL_HOURS * 3600_000).toISOString();
  const { data: expired, error: expireError } = await admin
    .from('pending_orders')
    .update({ status: 'kedaluwarsa' })
    .eq('status', 'menunggu_pembayaran')
    .lt('created_at', cutoff)
    .select('id, groom_name, bride_name, template_slug, created_at');

  if (expireError) {
    console.error('[expire] Gagal menandai kedaluwarsa:', expireError.message);
    return json({ error: 'Gagal memproses pending kedaluwarsa.' }, 500);
  }

  const rows = expired ?? [];
  if (rows.length > 0) {
    const { error: auditError } = await admin.from('admin_audit_log').insert(
      rows.map((r) => ({
        actor_email: null,
        actor_kind: 'system',
        action: 'pending_expired',
        table_name: 'pending_orders',
        row_id: r.id,
        details: {
          groom_name: r.groom_name,
          bride_name: r.bride_name,
          template_slug: r.template_slug,
          created_at: r.created_at,
          ttl_hours: PENDING_TTL_HOURS,
        },
      })),
    );
    if (auditError) console.error('[expire] Gagal menulis audit:', auditError.message);
  }

  // --- 2. Retensi: hapus log audit > 1 tahun ---
  const auditCutoff = new Date(Date.now() - AUDIT_RETENTION_DAYS * 86400_000).toISOString();
  const { count: auditDeleted, error: retentionError } = await admin
    .from('admin_audit_log')
    .delete({ count: 'exact' })
    .lt('created_at', auditCutoff);

  if (retentionError) console.error('[expire] Gagal retensi log:', retentionError.message);

  return json({ ok: true, expired: rows.length, audit_deleted: auditDeleted ?? 0 });
});
