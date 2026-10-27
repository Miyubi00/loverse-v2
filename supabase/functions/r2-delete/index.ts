// supabase/functions/r2-delete/index.ts
// Menghapus objek media di Cloudflare R2 (pembersihan otomatis).
//
// Payload: { orderId, urls?: string[], keys?: string[], purgeFolder?: boolean }
//   - urls         : URL publik lengkap → dikonversi ke key via R2_PUBLIC_URL
//   - keys         : key objek langsung
//   - purgeFolder  : hapus SELURUH isi folder {orderId}/ (ListObjectsV2 + DELETE)
//
// Guard: pesanan harus ada; setiap key WAJIB berawalan "{orderId}/" sehingga
// mustahil menghapus objek milik pesanan lain atau path arbitrer.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { AwsClient } from 'https://esm.sh/aws4fetch@1.0.20'
import { verifyMediaAccess } from '../_shared/auth.ts'

import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'

function keyFromUrl(url: string, publicBase: string): string | null {
  const base = publicBase.replace(/\/+$/, '')
  if (!url.startsWith(`${base}/`)) return null;
  return url.slice(base.length + 1)
}

/** Ambil semua <Key> dari XML ListObjectsV2 (key hasil generate kita aman). */
function parseListKeys(xml: string): string[] {
  const out: string[] = []
  const re = /<Key>([^<]+)<\/Key>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) out.push(m[1])
  return out
}

serve(async (req) => {
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight

  try {
    const { orderId, urls = [], keys = [], purgeFolder = false } = await req.json()

    if (!orderId || typeof orderId !== 'string') throw new Error('orderId wajib dikirim.')

    // --- OTORISASI: pemilik pesanan (JWT claim) atau admin ---
    const caller = await verifyMediaAccess(req, orderId)
    if (!caller) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized untuk pesanan ini.' }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 403 },
      )
    }

    // --- Konfigurasi R2 ---
    const endpoint = Deno.env.get('R2_ENDPOINT')
    const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID')
    const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY')
    const bucket = Deno.env.get('R2_BUCKET_NAME')
    const publicBase = Deno.env.get('R2_PUBLIC_URL')

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket || !publicBase) {
      throw new Error('Konfigurasi R2 belum lengkap (cek supabase secrets).')
    }

    // --- Pesanan harus ada ---
    const service = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const { data: order } = await service
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .maybeSingle()
    if (!order) throw new Error('Pesanan tidak ditemukan.')

    // --- Kumpulkan key dengan guard prefix ---
    const prefix = `${orderId}/`
    const allKeys = new Set<string>()

    for (const k of keys as unknown[]) {
      if (typeof k !== 'string') continue
      if (!k.startsWith(prefix)) {
        console.warn(`[r2-delete] Skip key di luar folder pesanan: ${k}`)
        continue
      }
      allKeys.add(k)
    }

    for (const u of urls as unknown[]) {
      const k = keyFromUrl(String(u), publicBase)
      if (!k || !k.startsWith(prefix)) {
        console.warn(`[r2-delete] Skip URL di luar folder pesanan: ${u}`)
        continue
      }
      allKeys.add(k)
    }

    if (purgeFolder) {
      const r2 = new AwsClient({ accessKeyId, secretAccessKey, service: 's3', region: 'auto' })
      let continuationToken = ''
      do {
        const listUrl = new URL(`${endpoint.replace(/\/+$/, '')}/${bucket}`)
        listUrl.searchParams.set('list-type', '2')
        listUrl.searchParams.set('prefix', prefix)
        if (continuationToken) listUrl.searchParams.set('continuation-token', continuationToken)

        const res = await r2.fetch(listUrl, { method: 'GET' })
        if (!res.ok) throw new Error(`Gagal me-listing objek (${res.status}).`)

        const xml = await res.text()
        for (const k of parseListKeys(xml)) allKeys.add(k)

        const match = xml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/)
        continuationToken = match ? match[1] : ''
      } while (continuationToken)
    }

    if (allKeys.size === 0) {
      return new Response(
        JSON.stringify({ deleted: [], failed: [] }),
        { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 200 },
      )
    }

    // --- DELETE paralel ---
    const r2 = new AwsClient({ accessKeyId, secretAccessKey, service: 's3', region: 'auto' })
    const results = await Promise.allSettled(
      [...allKeys].map(async (key) => {
        const del = await r2.fetch(
          `${endpoint.replace(/\/+$/, '')}/${bucket}/${key}`,
          { method: 'DELETE' },
        )
        // 404 = sudah tidak ada — anggap sukses.
        if (!del.ok && del.status !== 404) {
          throw new Error(`${key} -> HTTP ${del.status}`)
        }
        return key
      }),
    )

    const deleted = results.filter(r => r.status === 'fulfilled').map(r => (r as PromiseFulfilledResult<string>).value)
    const failed = results
      .filter(r => r.status === 'rejected')
      .map(r => String((r as PromiseRejectedResult).reason?.message ?? r.reason))

    if (failed.length > 0) console.error('[r2-delete] Sebagian gagal:', failed)

    return new Response(
      JSON.stringify({ deleted, failed }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error) {
    console.error('[r2-delete] Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 400 },
    )
  }
})
