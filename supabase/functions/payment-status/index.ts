// supabase/functions/payment-status/index.ts
// Status pembayaran untuk halaman /payment-status.
//
// Model kapabilitas BERTINGKAT (anti-enumerasi ID mentah):
// - Token terenkripsi valid (dibuat create-order, hanya dipegang pembayar)
//   -> respons PENUH (termasuk email/WhatsApp/PIN/snap sesuai status).
// - ID mentah (redirect bawaan Midtrans / link lama) -> respons TERBATAS:
//   status, nama, slug, template, harga, dan snap_token (agar bisa lanjut
//   bayar). TANPA email/WhatsApp/PIN — ID mentah LV-XXXXXXXX hanya 40 bit
//   sehingga tidak boleh menjadi kunci data sensitif.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { decryptOrderId, resolveOrderId } from '../_shared/orderToken.ts'
import { handleCorsPreflight, jsonCors } from '../_shared/cors.ts'

serve(async (req) => {
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight
  if (req.method !== 'POST') return jsonCors(req, { error: 'Method not allowed' }, 405)

  try {
    const { midtrans_order_id, order_token } = await req.json()

    // Nilai ?order_id=... bisa berupa token terenkripsi (alur utama) atau
    // id mentah (link lama & redirect bawaan Midtrans). Token valid ->
    // respons penuh; id mentah -> respons terbatas (tanpa PII/PIN).
    const linkSecret = (Deno.env.get('PAYMENT_LINK_SECRET') || '').trim() || undefined
    const rawValue = order_token ?? midtrans_order_id
    let resolvedId: string | null = null
    let tokenValid = false
    if (typeof rawValue === 'string' && rawValue) {
      if (linkSecret) {
        const decrypted = await decryptOrderId(rawValue, linkSecret)
        if (decrypted) {
          resolvedId = decrypted
          tokenValid = true
        }
      }
      if (!resolvedId) {
        resolvedId = await resolveOrderId(rawValue, undefined)
      }
    }

    if (!resolvedId) {
      return jsonCors(req, { error: 'order_id wajib dikirim.' }, 400)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: order, error } = await admin
      .from('orders')
      .select(
        'payment_status, groom_name, bride_name, slug, email, whatsapp, wedding_date, template_slug, price, event_details, snap_token, pin_code, created_at, midtrans_order_id',
      )
      .eq('midtrans_order_id', resolvedId)
      .maybeSingle()

    if (error) throw new Error(error.message)

    if (!order) {
      // Belum ketemu — klien boleh polling lagi (order bisa baru dibuat).
      return jsonCors(req, { found: false }, 404)
    }

    const isPending = order.payment_status === 'pending'
    const isSuccess = order.payment_status === 'success'

    // Ambil detail template & method jika ada
    const evt = (order.event_details || {}) as Record<string, unknown>
    let templateName = evt.template_name as string | undefined
    const rawMethod = evt.payment_method as string | undefined
    let finalPrice = typeof order.price === 'number' && order.price > 0 ? order.price : undefined

    if (!templateName || !finalPrice) {
      const { data: tpl } = await admin
        .from('templates')
        .select('name, price')
        .eq('slug', order.template_slug || '')
        .maybeSingle()
      if (tpl) {
        if (!templateName) templateName = tpl.name
        if (!finalPrice) finalPrice = tpl.price
      }
    }

    const methodMap: Record<string, string> = {
      qris: 'QRIS',
      other_qris: 'QRIS',
      gopay: 'GoPay',
      shopeepay: 'ShopeePay',
      dana: 'Dana',
      bca_va: 'BCA Virtual Account',
      echannel: 'Mandiri Virtual Account',
      mandiri_va: 'Mandiri Virtual Account',
      bni_va: 'BNI Virtual Account',
      bri_va: 'BRI Virtual Account',
      cimb_va: 'CIMB Niaga VA',
      seabank_va: 'SeaBank VA',
      bsi_va: 'BSI VA',
      whatsapp: 'Transfer Manual (WhatsApp)',
    }

    const paymentMethodDisplay = rawMethod ? (methodMap[rawMethod] || rawMethod.toUpperCase()) : 'QRIS'

    return jsonCors(req, 
      {
        found: true,
        payment_status: order.payment_status,
        // Id asli (untuk tampilan/invoice). Di URL hanya token buram yang muncul.
        order_id: (order as { midtrans_order_id?: string }).midtrans_order_id ?? null,
        groom_name: order.groom_name,
        bride_name: order.bride_name,
        slug: order.slug,
        // PII + rahasia HANYA untuk pemegang token valid. ID mentah tidak
        // boleh menjadi kunci email/WhatsApp/PIN (mudah ditebak).
        email: tokenValid ? order.email ?? null : null,
        whatsapp: tokenValid ? order.whatsapp ?? null : null,
        wedding_date: order.wedding_date ?? null,
        template_slug: order.template_slug ?? null,
        template_name: templateName || 'Undangan Digital',
        price: finalPrice || 10070,
        payment_method: paymentMethodDisplay,
        // Waktu pembuatan order (ISO) untuk info tampilan.
        created_at: (order as { created_at?: string }).created_at ?? null,
        // Token bayar-ulang hanya relevan (dan hanya diberikan) saat pending.
        // Tetap diberikan untuk id mentah agar redirect Midtrans bisa lanjut bayar;
        // memakai token orang lain hanya merugikan penyerang (dia yang membayar).
        snap_token: isPending ? order.snap_token : null,
        // PIN hanya ditampilkan kepada pemegang token valid saat lunas.
        pin_code: tokenValid && isSuccess ? order.pin_code : null,
      },
      200,
    )
  } catch (err) {
    console.error('[payment-status] Error:', err)
    return jsonCors(req, 
      { error: err instanceof Error ? err.message : String(err) },
      500,
    )
  }
})
