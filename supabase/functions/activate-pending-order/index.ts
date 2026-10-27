// supabase/functions/activate-pending-order/index.ts
// Aktivasi pesanan WhatsApp oleh ADMIN (menggantikan logika client-side
// di OrdersTab). Dipanggil dari Admin Panel dengan sesi Supabase admin.
//
// Alur: verifikasi admin → baca pending_orders → generate slug + PIN unik
// → insert orders (payment_status = 'success') → hapus pending → kirim
// email PIN via Resend → kembalikan order.
//
// Jika email pelanggan kosong (data lama), email dilewati dan PIN
// dikembalikan ke admin agar bisa disampaikan manual.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateUniquePin } from '../_shared/pin.ts'
import { generateOrderId } from '../_shared/orderToken.ts'
import { sendPinEmail } from '../_shared/resendEmail.ts'
import { requireAdminMfa } from '../_shared/auth.ts'
import { reportError } from '../_shared/monitoring.ts'

import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'

function generateSlug(groom: string, bride: string): string {
  const clean = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `${clean(groom)}-${clean(bride)}-${rand}`
}

/* Ganti verifyAdmin lokal → requireAdminMfa (shared, mendukung opsi wajib MFA).
 * Lihat supabase/functions/_shared/auth.ts */

serve(async (req) => {
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight

  try {
    const auth = await requireAdminMfa(req)
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.error }), {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: auth.error === 'Forbidden' ? 403 : 401,
      })
    }

    const { pending_id } = await req.json()
    if (!pending_id) throw new Error('pending_id wajib dikirim.')

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // --- 1. Ambil data pending ---
    const { data: pendingOrder, error: fetchError } = await admin
      .from('pending_orders')
      .select('*')
      .eq('id', pending_id)
      .single()

    if (fetchError || !pendingOrder) throw new Error('Pesanan pending tidak ditemukan.')

    // --- 2. KLAIM atomik: hapus baris pending SEKARANG ---
    // Hanya pemanggil yang berhasil menghapus (count=1) yang boleh
    // lanjut. Dua admin yang menekan tombol bersamaan => tepat satu
    // yang mendapat klaim; yang lain berhenti tanpa membuat duplikat.
    // Guard status: pending yang sudah 'kedaluwarsa' (housekeeping 24 jam)
    // TIDAK bisa diklaim lagi.
    const { count: claimed, error: claimError } = await admin
      .from('pending_orders')
      .delete({ count: 'exact' })
      .eq('id', pending_id)
      .eq('status', 'menunggu_pembayaran')

    if (claimError) throw new Error(`Gagal mengklaim pesanan: ${claimError.message}`)
    if ((claimed ?? 0) === 0) {
      throw new Error('Pesanan sudah diproses / tidak ditemukan.')
    }

    try {
      // --- 3. Generate slug + PIN unik + No. Invoice LV-XXXXXXXX ---
      // Pesanan manual WAJIB punya nomor invoice format SAMA seperti jalur
      // Midtrans (LV- + 8 karakter), dicek unik ke orders.midtrans_order_id.
      const slug = generateSlug(pendingOrder.groom_name, pendingOrder.bride_name)
      const pin = await generateUniquePin(admin, pendingOrder.whatsapp)
      let lvOrderId = ''
      for (let i = 0; i < 5; i++) {
        const candidate = generateOrderId()
        const { count } = await admin
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('midtrans_order_id', candidate)
        if (!count) {
          lvOrderId = candidate
          break
        }
      }
      if (!lvOrderId) throw new Error('Gagal membuat nomor invoice.')

      // Harga mengikuti katalog template (manual = tanpa fee).
      // Fallback 60000 hanya bila template tak ditemukan (aman).
      let manualPrice = 60000
      const { data: tpl } = await admin
        .from('templates')
        .select('price')
        .eq('slug', pendingOrder.template_slug)
        .maybeSingle()
      if (tpl && typeof tpl.price === 'number' && tpl.price > 0) {
        manualPrice = tpl.price
      }

      // --- 4. Aktifkan: pindahkan ke orders ---
      const { data: order, error: insertError } = await admin
        .from('orders')
        .insert({
          groom_name: pendingOrder.groom_name,
          bride_name: pendingOrder.bride_name,
          wedding_date: pendingOrder.wedding_date,
          whatsapp: pendingOrder.whatsapp,
          email: pendingOrder.email ?? null,
          pin_code: pin,
          template_slug: pendingOrder.template_slug,
          slug,
          midtrans_order_id: lvOrderId,
          payment_status: 'success',
          price: manualPrice,
          event_details: {},
        })
        .select()
        .single()

      if (insertError) throw new Error(`Gagal membuat pesanan: ${insertError.message}`)

      // Audit log eksplisit: siapa admin yang mengaktifkan, kapan, dan apa.
      try {
        await admin.from('admin_audit_log').insert({
          actor_email: auth.email ?? null,
          actor_kind: 'admin',
          action: 'activate_order',
          table_name: 'orders',
          row_id: order.id,
          details: { slug: order.slug, source: 'pending_orders', pending_id },
        })
      } catch (auditError) {
        console.error('[activate] Gagal menulis audit log:', auditError)
      }

      // --- 5. Kirim email PIN (lewati + kembalikan PIN jika email kosong) ---
      let emailSent = false
      if (pendingOrder.email) {
        const emailResult = await sendPinEmail({
          to: pendingOrder.email,
          groomName: pendingOrder.groom_name,
          brideName: pendingOrder.bride_name,
          pin,
          orderId: lvOrderId,
          whatsapp: order.whatsapp,
          weddingDate: order.wedding_date,
          templateName: order.template_slug,
          price: order.price || 60000,
          paymentMethod: 'Transfer Manual (WhatsApp CS)',
        })
        emailSent = emailResult.ok
        if (!emailResult.ok) {
          console.error(`[activate] Email PIN gagal untuk ${order.id}: ${emailResult.error}`)
        }
      }

      return new Response(
        JSON.stringify({
          ok: true,
          order,
          email_sent: emailSent,
          ...(emailSent ? {} : { pin }), // tanpa email: PIN diberikan ke admin untuk disampaikan manual
        }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 200 },
      )
    } catch (stepError) {
      // Self-healing: bila aktivasi gagal SETELAH klaim (mis. slug bentrok),
      // kembalikan baris pending agar pesanan tidak hilang dari antrean.
      const { error: restoreError } = await admin.from('pending_orders').insert(pendingOrder)
      if (restoreError) {
        console.error('[activate] GAGAL mengembalikan pesanan ke antrean:', restoreError, pendingOrder)
      }
      throw stepError
    }
  } catch (error) {
    console.error('[activate] Error:', error)
    void reportError(error, { fn: 'activate-pending-order' })
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 400 },
    )
  }
})
