# schema.md — Dokumentasi Alur & Skema (LoVerse / undangandigital)

> Dokumen ini mencatat **alur bisnis, alur teknis, dan skema database** proyek.
> Sengaja **TIDAK** memuat catatan desain/tampilan (warna, layout, komponen UI, animasi).
> Sumber: inspeksi kode pada 20-10-2026 (repo `Miyubi00/invite-you`, branch `main`).

---

## 1. Ringkasan Proyek

**LoVerse (loverse.id)** — platform **undangan pernikahan digital** sekali bayar.
Pelanggan memilih tema undangan, memesan + membayar (otomatis via Midtrans atau manual
transfer WhatsApp), lalu mendapat **PIN 6 digit + invoice PDF lewat email** untuk masuk
**dashboard mempelai**, di mana pelanggan mengedit isi undangan, membagikan link personal
ke tamu, dan memantau RSVP/buku tamu. Ada panel admin, chat AI, dan inbox email.

**Model bisnis**
- Produk: undangan digital per tema, **sekali bayar** (tanpa langganan), aktif sampai
  seluruh rangkaian acara selesai.
- Kategori: **Basic Rp 10.000** (13 tema, tanpa fitur RSVP/buku tamu) dan
  **RSVP Rp 15.000** (27 tema, dengan RSVP + buku tamu + export CSV). Total **40 tema**.
- Sumber kebenaran harga untuk transaksi = tabel `templates.price`;
  katalog di frontend (`src/lib/constants.ts` → `MASTER_TEMPLATES`) dipakai untuk
  katalog, demo, dan knowledge-base AI (kontrak: slug harus sinkron dengan
  `src/templates/Registry.ts`).
- Biaya layanan (fee kanal + PPN 11%) **dibebankan ke pelanggan** pada pembayaran online;
  jalur manual WhatsApp = Rp 0.

**Actor utama**
| Actor | Identitas | Akses |
|---|---|---|
| Tamu (publik) | anonim | katalog, demo tema, undangan `/wedding/:slug`, isi RSVP |
| Pelanggan (mempelai) | WhatsApp + PIN → JWT ES256 custom (claim `order_id`) | 1 baris `orders` miliknya + `rsvps` miliknya |
| Admin | Supabase Auth (email+password), email terdaftar di `admin_users` | seluruh data + tabel master |
| Sistem | `service_role` (Edge Functions, webhook Midtrans, cron) | penuh; satu-satunya pihak yang boleh ubah `payment_status` & `price` |
| AI / Telegram | Edge Functions | proxy Gemini + sesi handover admin |

---

## 2. Tech Stack & Arsitektur

| Lapisan | Teknologi |
|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS 4 + React Router 7 + i18n (ID/EN) |
| Database & Auth | Supabase (Postgres + RLS + Supabase Auth) |
| Backend | Supabase Edge Functions (Deno) |
| Pembayaran | Midtrans Snap (QRIS, GoPay, e-wallet, VA bank) |
| Email keluar | Resend (PIN, invoice PDF, notifikasi, balasan inbox) |
| Email masuk | Cloudflare Email Routing → Worker `workers/inbound-email-worker.mjs` → Edge Function `inbound-email` |
| Storage media | Cloudflare R2 (`https://r2.loverse.id`), presigned URL dari Edge Functions |
| Captcha | Cloudflare Turnstile |
| Cron | `pg_cron` Supabase → `expire-pending-orders` |
| Deploy | Vercel (web + `api/og.js`), Supabase (db + functions), Cloudflare (worker) |
| Observability | Sentry (`@sentry/react`) + `_shared/monitoring.ts#reportError` |

**Prinsip keamanan yang dipakai konsisten di seluruh alur**
1. **Browser tidak pernah menulis data sensitif langsung** — pembuatan order selalu lewat
   Edge Function (validasi + Turnstile + rate limit).
2. **Fail-closed** pada rate limit: tabel pendukung tidak ada / query gagal → request
   ditolak (503), bukan dibuka lebar.
3. **Conditional update** (`count` + `.neq(...)`) untuk aktivasi/klaim agar aman race.
4. **Guard monotonik**: status `success` tidak pernah diturunkan oleh webhook terlambat.
5. **RLS dengan policy minim**; kolom sensitif tidak pernah dibaca publik
   (view aman `public_invitations` + endpoint terpisah).

---

## 3. Peta Route (URL → Fungsi Bisnis)

| Route | Halaman | Peran |
|---|---|---|
| `/` | Katalog tema, harga, testimoni, notice situs | publik |
| `/order` | Checkout 3 langkah: (1) data acara + pilih tema, (2) metode bayar, (3) konfirmasi + captcha + bayar | publik |
| `/order/success` | Konfirmasi pesanan manual WhatsApp (langkah berikutnya) | publik |
| `/payment-status?order_id=<token>` | Status pembayaran (polling) + tampil PIN bila lunas + bayar ulang | pemegang token |
| `/demo/:slug` | Demo tema | publik |
| `/wedding/:slug?to=Nama` | Undangan tamu (hanya bila `payment_status='success'`) | publik |
| `/login` | Login dashboard: WhatsApp + PIN | pelanggan |
| `/forgot-pin`, `/forgot-pin/confirm` | Alur kirim ulang PIN 2 tahap | pemilik email |
| `/dashboard/:orderId` | Dashboard mempelai: tab Sebar / Edit / Buku Tamu | pelanggan (JWT) |
| `VITE_ADMIN_PATH` (default `/admin`) | Panel admin: Pesanan, Data Masuk WA, Template, Banner & Notice, Kotak Masuk, Audit | admin |
| `/contact` | Kontak + chat AI (+ handover Telegram) | publik |
| `/portfolio`, `/tutorial`, `/privacy`, `/terms` | konten statis | publik |
| `/dev/invoice`, `/dev/email` | Preview PDF invoice & template email — hanya saat `npm run dev` (produksi 404) | dev |
| `*` | 404 | — |

---

## 4. Alur Pembelian — JALUR A: Otomatis (Midtrans Snap)

**Entry:** `/order` → `src/hooks/useOrderCheckout.ts#handleMidtransCheckout`
→ Edge Function `create-order`.

Tahapan:

1. **Frontend**: validasi form (mempelai wajib, tanggal wajib, email regex, WA ≥8 wajib)
   + token Turnstile + saklar `PRODUCTION_READY`.
2. **`create-order` (server)**, berurutan:
   - verifikasi Turnstile (`TURNSTILE_SECRET_KEY`); gagal → error, tidak lanjut.
   - validasi server-side: nama ≤80 char; `wedding_date` format `YYYY-MM-DD` dan
     **tidak boleh di masa lalu**; email regex ≤320; WhatsApp dinormalisasi
     (`_shared/whatsapp.ts`, dikirim frontend sebagai `+62…`); `template_slug` wajib.
   - **rate limit** tabel `order_attempts`: maks **10 percobaan/IP/15 menit**
     (429 bila lewat; 503 bila tabel tidak ada = fail-closed).
   - saklar server `ENABLE_ONLINE_PAYMENTS != 'false'` (pasangan `PRODUCTION_READY`).
   - baca `templates` (name, price) → tidak ada = error.
   - buat `order_id` format **`LV-XXXXXXXX`** (CSPRNG, alfabet tanpa I/O/0/1),
     dicek unik ke `orders.midtrans_order_id`, maks 5 percobaan.
   - hitung **fee** (lihat blok fee di bawah).
   - **INSERT `orders` dulu** dengan `payment_status='pending'`,
     `price = template.price + adminFee`, `slug = generateSlug(groom-bride-4digit)`
     (retry bila 23505), `event_details = {payment_method, base_price, admin_fee,
     template_name}` — retry maks 5x untuk bentrok slug.
   - POST Snap API (`_shared/midtrans.ts`, env dari `MIDTRANS_IS_PRODUCTION`) dengan
     `transaction_details`, `customer_details`, `item_details` (produk + baris
     "Biaya Layanan (termasuk PPN 11%)"), `enabled_payments` (1 kanal sesuai pilihan),
     `callbacks.finish/unfinish/error → ${APP_URL}/payment-status`.
     Gagal token → baris ditandai `payment_status='failed'` (jejak audit).
   - simpan `orders.snap_token`; catat `order_attempts` sukses.
   - kembalikan `{ snap_token, order_id, order_token, redirect_url }` —
     `order_token` = **AES-GCM(order_id)** dengan kunci dari `PAYMENT_LINK_SECRET`
     (tanpa secret → id mentah, kompatibilitas mundur).
3. **Frontend**: `window.snap.pay(token)`; `onSuccess`/`onClose`/`onError` →
   navigate `/payment-status?order_id=<order_token>`.

Catatan:
- Urutan penting: **baris `orders` dibuat sebelum token Midtrans** — tidak pernah ada
  transaksi Midtrans tanpa rekaman lokal.
- Tidak ada `expiry` eksplisit: masa berlaku mengikuti default kanal Midtrans; saat
  kedaluwarsa Midtrans kirim notifikasi `transaction_status=expire` → `failed`.
- Draft form disimpan di `localStorage` (`loverse-order-draft`, TTL 7 hari) sehingga
  order gagal/expired tidak perlu diisi ulang.

**Blok fee (identik frontend ↔ backend, wajib sinkron)**
`getPaymentMethodFee()` di `src/components/order/constants.ts` ↔ `create-order`:
`channelFee = ceil(price*0.007)` (QRIS) | `ceil(price*0.015)` (GoPay) | `4000` (VA);
`ppn = ceil(channelFee*0.11)`; `adminFee = channelFee + ppn`; `gross = price + adminFee`.
Jalur `whatsapp` = Rp 0 (return lebih awal, tidak menyentuh Midtrans).

**Metode pembayaran yang ditawarkan** (`PaymentMethodType`):
`automatic, qris, gopay, shopeepay, dana, bca_va, echannel (Mandiri), bni_va, bri_va,
permata_va, cimb_va, seabank_va, bsi_va, whatsapp`.
Pemetaan `enabled_payments` di server: `qris→other_qris`, `gopay→gopay`,
`echannel→echannel`, `bni_va→bni_va`, `bri_va→bri_va`, `permata_va→permata_va`,
`cimb_va→cimb_va`, `bsi_va→bsi_va`, fallback → semua kanal aktif.
ShopeePay/Dana/BCA/SeaBank tampil di katalog metode tetapi mengikuti fallback kanal.

---

## 5. Alur Pembelian — JALUR B: Manual Transfer WhatsApp

1. Pilih metode **whatsapp** di langkah 2 → langkah 3 → captcha → tombol bayar.
2. `handleWhatsappCheckout` memanggil **edge function yang sama** `create-order` dengan
   `payment_method: "manual_whatsapp"`. Browser **dilarang** insert langsung ke DB
   karena akan melewati validasi/captcha/rate limit.
3. `create-order` tetap menjalankan validasi + Turnstile + rate limit, lalu
   **INSERT `pending_orders`** (status default `menunggu_pembayaran`) dan mengembalikan
   `{ success, pending_id }`. Tidak ada Midtrans, tidak ada `snap_token`, fee Rp 0.
4. Frontend membuka `wa.me/6285179880092` dengan pesan berisi data mempelai, email,
   template, total harga, lalu navigate `/order/success` (halaman statis langkah
   berikutnya: chat admin → konfirmasi → dapat PIN via email).
5. Antrean diproses admin → §7.2 `activate-pending-order`.

---

## 6. Alur Pembayaran, Webhook, Status, dan Housekeeping

### 6.1 Webhook Midtrans — `supabase/functions/midtrans-webhook`
```
POST Midtrans
 ├─ parse JSON (gagal → 400)
 ├─ extractNotificationFields: cek tipe & panjang field (malformed → 400)
 ├─ verifyMidtransSignature: sha512(order_id + status_code + gross_amount + serverKey)
 │    signature hilang/salah → 403 (TIDAK menyentuh database)
 ├─ mapTransactionStatus(transaction_status, fraud_status)
 │    null (pending / refund / tak dikenal) → di-ack, tanpa tulis DB
 ├─ cari orders (by midtrans_order_id)
 ├─ [sukses/capture]
 │    ├─ sudah 'success' → {duplicate:true}, tidak kirim email kedua
 │    ├─ generateUniquePin (6 digit CSPRNG, unik per nomor WA)
 │    ├─ UPDATE orders {pin_code, payment_status:'success'}
 │    │    WHERE id=? AND payment_status <> 'success'  ← conditional + count
 │    │    count=0 → race: berhenti, audit webhook_duplicate
 │    │    count=1 → kirim email Resend (PIN + lampiran invoice PDF);
 │    │              gagal email TIDAK membatalkan aktivasi (log + reportError)
 │    └─ audit admin_audit_log actor_kind='midtrans', action='webhook_success'
 └─ [deny/cancel/expire/failed]
      ├─ UPDATE orders {payment_status:'failed'} WHERE payment_status <> 'success'
      │   (guard monotonik: order 'success' tidak pernah diturunkan)
      └─ audit action='webhook_failed'
Error transient → 500 agar Midtrans melakukan retry (bukan 4xx)
```

### 6.2 Cek status — `payment-status` + halaman `/payment-status`
- URL membawa **`order_token` terenkripsi**; server coba dekripsi dulu,
  gagal → dianggap **id mentah** (redirect bawaan Midtrans / link lama).
- **Kapabilitas bertingkat (anti-enumerasi ID):**
  - token valid → respons **penuh**: status, nama, slug, template, harga,
    `email`, `whatsapp`, `wedding_date`, `snap_token` (jika pending),
    `pin_code` (jika success).
  - id mentah `LV-XXXXXXXX` (hanya 40 bit) → respons **terbatas**:
    status, nama, slug, template, harga, `snap_token` — **tanpa PII, tanpa PIN**.
- Fallback data: `event_details.template_name` / `price` diambil dari `templates` bila kosong.
- Frontend polling backoff **4s → 60s**, berhenti saat status terminal
  (`success`/`failed`), hanya poll bila tab terlihat. `found:false` (404) → poll lagi.
- Pending → tombol bayar ulang pakai `snap_token`; tanpa token → kembali `/order`.
- Tanpa `?order_id=` → mode manual WhatsApp (informasi langkah manual).

### 6.3 Aktivasi manual — `activate-pending-order` (dipanggil panel admin)
```
requireAdminMfa (mendukung secret REQUIRE_ADMIN_MFA)
 ─▶ baca pending_orders by pending_id
 ─▶ KLAIM ATOMIK: DELETE pending_orders WHERE id=? AND status='menunggu_pembayaran'
      count=0 → 'sudah diproses' (dua admin klik bersamaan → hanya 1 menang;
                pending berstatus 'kedaluwarsa' tidak bisa diklaim)
 ─▶ generateSlug (groom-bride-4digit) + generateUniquePin
 ─▶ nomor invoice LV-XXXXXXXX unik (dicek ke orders.midtrans_order_id —
      format SAMA dengan jalur Midtrans)
 ─▶ baca templates.price (>0) → INSERT orders {
        payment_status:'success', price, event_details:{}, pin_code, slug,
        midtrans_order_id: LV-…, data dari pending termasuk email }
 ─▶ audit eksplisit actor_kind='admin', action='activate_order', source:'pending_orders'
 ─▶ kirim email PIN + invoice PDF (paymentMethod='Transfer Manual (WhatsApp CS)');
      email kosong → email dilewati, PIN dikembalikan ke admin untuk disampaikan manual
 ─▶ bila gagal SETELAH klaim → baris pending DIKEMBALIKAN (self-healing)
```

### 6.4 Housekeeping cron — `expire-pending-orders` (harian 02:00 UTC)
- `pending_orders` `menunggu_pembayaran` usia **> 24 jam** → status `kedaluwarsa`
  + tulis `admin_audit_log` (`actor_kind='system'`, `action='pending_expired'`).
- Hapus `admin_audit_log` usia **> 365 hari** (retensi log).
- Otorisasi: header `x-cron-secret` == `CRON_SECRET` **plus** `apikey` +
  `Authorization` anon key (wajib; tanpa itu gateway 401).
- Dijadwalkan via `supabase/scheduled-jobs.example.sql` (pg_cron + pg_net),
  dijalankan manual di SQL editor agar secret tidak ke-commit.

---

## 7. Alur Autentikasi Pelanggan (Dashboard Mempelai)

### 7.1 Login — `customer-login` + halaman `/login`
```
POST { whatsapp, pin }
 ├─ normalisasi WhatsApp
 ├─ rate limit tabel login_attempts (fail-closed):
 │    maks 5 gagal / nomor / 15 menit  → 429
 │    maks 20 gagal / IP    / 15 menit → 429 (anti distributed brute force)
 ├─ RPC verify_customer_pin(p_whatsapp, p_pin)   ← SECURITY DEFINER, service_role
 │    SELECT … FROM orders
 │    WHERE whatsapp = p_whatsapp
 │      AND payment_status = 'success'
 │      AND pin_hash = extensions.crypt(p_pin, pin_hash)   ← bcrypt, bukan plaintext
 │    LIMIT 1
 ├─ tidak cocok → catat kegagalan (fail-closed) + 401
 ├─ cocok → bersihkan riwayat kegagalan untuk nomor itu
 └─ terbitkan JWT ES256 custom (BYOK signing key proyek):
      claims: role='authenticated', sub = order UUID, order_id = order UUID, iat, exp
      TTL akses 2 jam; total sesi maks 24 jam (refresh tanpa PIN selama < 24 jam)
      PIN TIDAK PERNAH dikembalikan ke klien oleh fungsi ini.
```
- Penandatanganan: private JWK = Edge Function secret `CUSTOMER_JWT_PRIVATE_JWK`;
  public key diimport ke Supabase Auth sebagai **standby signing key** sehingga terbit di
  JWKS dan diverifikasi PostgREST/Data API (pola BYOK resmi Supabase, tanpa rotate).
- Frontend menyimpan token (`src/lib/customerClient.ts`), refresh periodik tiap 5 menit;
  sesi habis → dipaksa ke `/login`.
- **Efek RLS**: semua query berikutnya `auth.jwt()->>'order_id' = orders.id`,
  sehingga pelanggan hanya melihat/mengubah 1 pesanan miliknya.

### 7.2 Verifikasi media — `_shared/auth.ts`
Dua jalur yang diakui (sama dengan model RLS):
1. **customer** — JWT ES256 claim `order_id` diverifikasi via JWKS proyek;
2. **admin** — sesi Supabase Auth yang emailnya ada di `admin_users` (dicek service-role).
`orderId` yang dikirim klien **hanya valid** bila cocok dengan claim token atau pemanggil
admin — keberadaan `orderId` saja bukan otorisasi.

### 7.3 Lupa / kirim ulang PIN — `resend-pin` (2 tahap dengan konfirmasi pemilik)
```
TAHAP 1 (minta)  POST { email, wedding_date, captcha_token }
 ├─ rate limit pin_resend_attempts (fail-closed):
 │    jeda min 60 dtk/email, 3/jam/email, 10/jam/IP
 ├─ cari orders: email ILIKE + wedding_date + payment_status='success' (maks 5 baris)
 ├─ buat token 256-bit CSPRNG → disimpan SEBAGAI HASH SHA-256 di pin_reset_tokens
 │    expires_at = +30 menit, used_at = NULL
 └─ email KONFIRMASI (link ?token=…&action=confirm|cancel) ke email pemilik.
    TIDAK ada PIN berubah di tahap ini. Respons SELALU generik (anti-enumerasi).

TAHAP 2 (aksi dari link email) POST { token, action: 'confirm' | 'cancel' }  tanpa captcha
 ├─ klaim atomik: UPDATE pin_reset_tokens SET used_at=now
 │    WHERE token_hash=? AND used_at IS NULL AND expires_at > now()  ← sekali pakai
 │    gagal → status 'invalid' (generik)
 ├─ action='cancel'  → revoke selesai, PIN tidak diubah → {status:'canceled'}
 └─ action='confirm' → cari ulang orders (email + tanggal + lunas, maks 5)
      → regenerate PIN tiap order + kirim email PIN baru → {status:'confirmed'}
Diabaikan → token kedaluwarsa sendiri setelah 30 menit.
```
Halaman: `/forgot-pin` (tahap 1) → `/forgot-pin/confirm` (menjalankan aksi token).

---

## 8. Alur Undangan Publik & RSVP

### 8.1 Membuka undangan — `/wedding/:slug`
1. Data diambil lewat **VIEW `public_invitations`** (`select by slug`) — view hanya
   berisi kolom aman: `id, slug, groom_name, bride_name, wedding_date, template_slug,
   payment_status, event_details, created_at` (tanpa PIN / snap_token / email / WA).
2. `payment_status !== 'success'` → halaman **terkunci** (undangan belum aktif);
   tidak ada baris → 404.
3. Komponen tema dirender dari **registry lazy** (`src/templates/Registry.ts`,
   slug → chunk terpisah, wajib `<Suspense>`).
4. `?to=Nama` → nama tamu personal (default "Tamu Undangan").

### 8.2 Daftar RSVP
- Dibaca lewat **Edge Function `rsvp-list`** `{ slug, session_id? }`
  (baca publik global ke `rsvps` sudah **dicabut** — anti-scraping lintas undangan).
- Fungsi: resolve `orders` by slug → ambil maks **500** baris terbaru
  (`id, guest_name, status, pax, message, reply, created_at`); `session_id` tidak
  pernah dikembalikan, hanya dipakai menandai `is_mine`.

### 8.3 Mengisi RSVP (tamu)
1. `session_id` tamu disimpan di `localStorage` (`rsvp_session_id`,
   `crypto.randomUUID()` sekali).
2. **INSERT langsung** `supabase.from('rsvps').insert(...)` **tanpa `.select()`**
   (policy `public_insert_rsvps`; RETURNING butuh izin SELECT yang tidak dimiliki anon).
3. Daftar dimuat ulang via `rsvp-list`.
4. Duplikat (klik ganda / sesi sama) → code `23505` ditangani sebagai "sudah mengisi",
   didukung constraint `UNIQUE (order_id, session_id)`.
5. Klien membatasi satu RSVP per sesi (cek lokal `myRsvp`).

### 8.4 Buku tamu (milik pelanggan)
- List **server-side** (`useRsvpServer`): filter pencarian/tanggal/status,
  pagination `.range` + `count:'exact'`, statistik per-status (head-only query),
  export CSV maks 5000 baris (batch 1000).
- Aksi (`useRsvpTools`): balas (`rsvps.reply` + `.eq('order_id')` defense-in-depth di
  atas RLS), hapus baris, export CSV.
- Kategori **Basic** tidak punya tab RSVP (URL `?tab=rsvp` dipaksa kembali ke `share`).

---

## 9. Alur Dashboard Mempelai — `/dashboard/:orderId`

| Tab | Isi & Alur |
|---|---|
| **Sebar** | generate link personal `${origin}/wedding/{slug}?to=Nama`, share WhatsApp (pesan siap kirim berisi data mempelai + link), copy link, **impor daftar tamu CSV** (hanya `.csv`, maks 2MB, auto-detect delimiter + kolom nama via kata kunci `nama/tamu/undangan/invite/kepada/yth`, template contoh CSV diunduh dengan BOM UTF-8). Library `xlsx` sudah dihapus dari proyek. |
| **Edit** | Sub-bagian Info (lokasi + Google Maps, jadwal akad/resepsi, orang tua) / Media (foto mempelai, sampul, galeri) / Extra (musik + kutipan, rekening bank). Simpan = `UPDATE orders SET event_details = <form>` lewat `enqueuePersist` (satu antrean dengan auto-save upload agar tidak saling menimpa; `count` dipakai untuk tahu ada baris berubah atau tidak). Penambahan/penghapusan galeri lewat RPC `push_gallery_item` / `remove_gallery_item`; field terbatas lewat `update_event_details_field` (whitelist key). |
| **Buku Tamu** | RSVP (lihat §8.4) — hanya tema non-Basic. |

- Upload media: `r2-upload-url` (presigned PUT, TTL 300 detik) → browser → R2 langsung;
  prefix wajib `IMG_ | ADMIN_IMG_ | GALLERY_ | AUDIO_`; **SVG ditolak**
  (stored XSS); guard `verifyMediaAccess` (JWT customer cocok `order_id`, atau admin).
  Tersedia juga `r2-upload` (langsung) dan `r2-delete`.
- Nama file & URL disimpan di `event_details` (kolom jsonb), bukan tabel terpisah.
- Data awal form diambil dari `orders.event_details` + fallback kosong;
  bila query orders gagal/RLS menolak dengan token masih ada → sesi dianggap tidak layak
  (token dibuang, redirect `/login`).

---

## 10. Alur Admin Panel — `VITE_ADMIN_PATH` (default `/admin`)

### 10.1 Login & sesi
- `AdminLogin`: email + password via **Supabase Auth** → cek keanggotaan di
  `admin_users` (function `is_admin()`).
- Proteksi: Turnstile + **lockout backoff progresif** (setelah 3x gagal terkunci 30 dtk,
  +30 dtk per kegagalan, maks 5 menit).
- Secret `REQUIRE_ADMIN_MFA=true` → Edge Functions minta verifikasi TOTP
  (`_shared/auth.ts#requireAdminMfa`) untuk aksi kritis.
- Path panel disamarkan via `VITE_ADMIN_PATH` (security by obscurity, sengaja tidak
  didaftarkan di robots.txt).

### 10.2 Tab & aksi
| Tab (`?tab=`) | Sumber data | Aksi |
|---|---|---|
| `orders` (Data Pesanan) | `orders` (filter + pagination **server-side**, 25/halaman) + `pending_orders` | lihat, chat WA pelanggan, lihat undangan, **Edit full** (`EditOrderModal`), **hapus permanen** (`rpc delete_order_cascade`) |
| `whatsapp` (Data Masuk) | `pending_orders` | **Aktivasi** → `activate-pending-order` (lihat §6.3), chat WA |
| `templates` (Kelola Template) | `templates` | ubah `price`, toggle `is_active`, hapus |
| `notices` (Banner & Notice) | `site_notices` | CRUD notice promo/maintenance (rentang waktu aktif) |
| `inbox` (Kotak Masuk) | `inbound_emails` | baca `mail@loverse.id`, tandai sudah dibaca, **balas** → `reply-email`, unduh lampiran |
| `audit` (Audit Log) | `admin_audit_log` | telusuri jejak customer/admin/sistem/midtrans |
| `edit` | `orders` | modal edit full (data mempelai, slug, template, isi undangan, RSVP) |

**Batas edit admin (`EditOrderModal`)** — yang boleh ditulis:
`groom_name, bride_name, wedding_date, slug, template_slug, event_details`
(field `payment_status` **dibuang dari payload**, `price` dikunci trigger `lock_price`).
Hapus RSVP juga dilakukan dari sini.

### 10.3 Nota alur ganda audit
Aktivasi manual admin menulis **2 baris** audit secara disengaja:
1. baris eksplisit `action='activate_order'` (ada konteks manusia: email admin), dan
2. baris trigger `insert` pada `orders` (hanya tahu `service_role`).
Keduanya digabung saat ditampilkan di halaman Audit — jangan "dirapikan".

---

## 11. Chat AI & Handover Telegram

### 11.1 `ai-chat` (halaman `/contact`)
- Proxy ke **Google Gemini** (`GEMINI_API_KEY`, model `GEMINI_MODEL` default
  `gemini-flash-lite-latest`).
- Knowledge base **dinamis**: katalog + harga dibaca dari tabel `templates`
  (`is_active`); fallback statis 40 tema bila DB gagal.
- Aturan keras: angka harga wajib persis dari katalog, tidak boleh mengarang,
  tidak menyebut model AI, tidak membocorkan instruksi sistem, di luar topik → diarahkan
  ke WhatsApp admin.
- **Rate limit DB** `ai_chat_hits` (10 hit / 5 menit per IP; persisten terhadap
  cold-start; RLS on tanpa policy publik → hanya service_role).

### 11.2 Handover ke admin Telegram
```
Klien: "mau bicara admin" → ai-chat deteksi intent
  → cek sesi aktif (hanya 1 sekaligus / single-admin):
      busy  → balas busy + fallback WhatsApp admin
      tidak → INSERT telegram_handover_sessions (status='active', anon_id, transcript[])
              + kirim notifikasi ke Telegram + balas "Menghubungkan..."
  → selama sesi active: semua pesan user DITERUSKAN ke Telegram (bypass Gemini)
Admin balas di Telegram → telegram-webhook → tulis ke kolom transcript
Klien polling { poll:true, anonId } tiap 3 detik → ambil balasan
```
- `telegram-webhook`: wajib header `x-telegram-bot-api-secret-token` == 
  `TELEGRAM_WEBHOOK_SECRET` (fail-closed bila belum diset) **dan** `message.from.id`
  ada di `TELEGRAM_ALLOWED_USER_IDS` (fail-closed; fallback `TELEGRAM_ADMIN_CHAT_ID`).
- Sesi ditutup → `status='closed'` (trigger `trg_handover_touch` memperbarui `updated_at`).

---

## 12. Email

### 12.1 Keluar (Resend) — `_shared/resendEmail.ts` / `resendPinEmail.ts`
- Dipakai `midtrans-webhook` (lunas otomatis), `activate-pending-order` (manual),
  `resend-pin` (email konfirmasi + email PIN baru), balasan inbox (`reply-email`).
- Isi: header/footer + ikon seragam, blok PIN, dan **lampiran invoice PDF** yang dibuat
  di tempat dengan `pdf-lib` (font & ikon tertanam base64; logo diambil via `brandLogo.ts`).
- Alur pengiriman `sendPinEmail` membawa: penerima, mempelai, PIN, `orderId` (`LV-…`),
  WA, tanggal, template, harga, metode pembayaran.
- Kegagalan kirim email **tidak** membatalkan aktivasi (dicatat + `reportError`).

### 12.2 Masuk (`mail@loverse.id`)
```
Cloudflare Email Routing → workers/inbound-email-worker.mjs (parse MIME)
  → POST Edge Function inbound-email dengan header x-inbound-secret
     == INBOUND_EMAIL_SECRET (tanpa cocok → 403)
  → lampiran (maks 5MB/10MB total) diunggah ke R2 prefix inbox/
  → INSERT inbound_emails (pesan SELALU disimpan walau lampiran gagal)
Admin membaca di tab Inbox → balas via reply-email (Resend) → tandai replied_at
```
Tabel `inbound_emails` menyimpan `from_addr, to_addr, subject, text_body, html_body,
attachments(jsonb), is_read, replied_at, received_at`.

---

## 13. Aset & Integrasi Lain
- **OG image** untuk share WhatsApp: Vercel function `api/og.js` (meta OG per undangan).
- **Ikon email**: PNG Lucide di `public/icons/` → mirror ke R2 `icons/`
  (`node scripts/upload-email-icons.mjs`).
- **Logo bayar**: `public/logos/payment/*` → R2 `logos/payment/*`
  (`PAY_LOGO_BASE = https://r2.loverse.id/logos/payment`).
- **Preview dev**: `/dev/invoice` & `/dev/email` hanya dirender saat `npm run dev`.

---

## 14. Skema Database (Postgres / Supabase)

File acuan: `supabase/migrations/schema.sql` (dump lengkap),
`20260825140744_initial_from_remote.sql` (migrasi awal) + migrasi lanjutan.
Semua tabel `public.*` memiliki **RLS aktif**.

### 14.1 ENUM

| ENUM | Nilai | Dipakai oleh |
|---|---|---|
| `public.payment_status` | `pending`, `success`, `failed`, `expired` | `orders.payment_status` (runtime memakai `pending/success/failed`; `expire` dari Midtrans dipetakan ke `failed`) |
| `public.rsvp_status` | `hadir`, `tidak_hadir`, `ragu` | `rsvps.status` (default `hadir`) |

### 14.2 `public.orders` — inti bisnis (1 baris = 1 undangan terjual)

| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | uuid PK default `gen_random_uuid()` | |
| `groom_name` | text NOT NULL | mempelai pria |
| `bride_name` | text NOT NULL | mempelai wanita |
| `wedding_date` | date NOT NULL | |
| `event_details` | jsonb default `{}` | seluruh isi undangan (lihat §14.7) |
| `payment_status` | `public.payment_status` default `pending` | hanya service_role yang boleh ubah (trigger) |
| `midtrans_order_id` | text UNIQUE | nomor invoice `LV-XXXXXXXX` |
| `slug` | text UNIQUE NOT NULL | URL undangan `/wedding/{slug}` |
| `created_at` | timestamptz default `now()` | |
| `pin_code` | text | PIN 6 digit (dipakai untuk email/tampilan) |
| `pin_hash` | text | bcrypt `extensions.crypt(pin, gen_salt('bf',10))`, diisi trigger |
| `template_slug` | text default `'rustic-floral'` | referensi ke `templates.slug` |
| `whatsapp` | text NOT NULL | ternormalisasi `+62…` |
| `snap_token` | text | token Snap Midtrans |
| `price` | integer | total dibebankan (harga + fee), **dikunci trigger** |
| `email` | text | tujuan kirim PIN otomatis (Resend) |

Constraint/index: PK `id`; UNIQUE `slug` (`orders_slug_unique_idx`) dan
`midtrans_order_id` (`orders_midtrans_order_id_key`).

### 14.3 `public.pending_orders` — antrean pesanan manual WhatsApp

| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | uuid PK default `gen_random_uuid()` | |
| `groom_name`, `bride_name` | text NOT NULL | |
| `wedding_date` | date NOT NULL | |
| `whatsapp` | text NOT NULL | |
| `email` | text | dipindahkan ke `orders` saat aktivasi |
| `template_slug` | text NOT NULL | |
| `status` | text default `'menunggu_pembayaran'` | nilai lain: `'kedaluwarsa'` (cron 24 jam) |
| `created_at` | timestamptz default `utc now()` | |

Tidak ada kolom harga — harga diambil dari `templates` saat aktivasi.

### 14.4 `public.templates` — katalog & harga (sumber kebenaran harga)

| Kolom | Tipe | Catatan |
|---|---|---|
| `slug` | text **PK** | contoh `rustic-floral`, `cinamon` |
| `name` | text | nama tampil |
| `category` | text | `Basic` / `RSVP` |
| `price` | integer NOT NULL | 10000 (Basic) / 15000 (RSVP) |
| `is_active` | boolean default `true` | dipakai katalog + knowledge-base AI |

Dipopulasi dari `MASTER_TEMPLATES` (frontend) +
migrasi `20260829120000_register_new_themes.sql`.

### 14.5 `public.rsvps` — buku tamu / RSVP

| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | uuid PK default `gen_random_uuid()` | |
| `created_at` | timestamptz default `now()` | |
| `order_id` | uuid NOT NULL | → `orders.id` |
| `session_id` | text NOT NULL | UUID tamu dari localStorage; **UNIQUE bersama `order_id`** |
| `guest_name` | text NOT NULL | dari `?to=` |
| `status` | `public.rsvp_status` default `'hadir'` | |
| `pax` | integer default 1 NOT NULL | |
| `message` | text | ucapan tamu |
| `reply` | text | balasan pemilik |

Constraint/index: `UNIQUE (order_id, session_id)` (`rsvps_order_id_session_id_key`);
index `rsvps_order_id_created_at_idx (order_id, created_at DESC)`.

### 14.6 Tabel pendukung (tanpa relasi ke `orders` kecuali disebut)

| Tabel | Kolom penting | Fungsi |
|---|---|---|
| **`admin_users`** | PK `email`, `created_at` | daftar email admin; basis `is_admin()` |
| **`admin_audit_log`** | `id` identity, `actor_email`, `actor_kind` (`admin`/`customer`/`service`/`system`/`midtrans`/`unknown`), `action`, `table_name`, `row_id`, `details jsonb`, `created_at` | jejak audit; ditulis trigger **dan** eksplisit; retensi 1 tahun |
| **`login_attempts`** | `whatsapp`, `ip_address`, `success`, `attempted_at` | rate limit brute-force PIN |
| **`order_attempts`** | `ip_address`, `success`, `attempted_at` | rate limit pembuatan order |
| **`pin_resend_attempts`** | `whatsapp`, `email`, `ip_address`, `success`, `attempted_at` | rate limit tahap 1 lupa PIN |
| **`pin_reset_tokens`** | `id` uuid PK, `token_hash` UNIQUE (SHA-256), `email`, `wedding_date`, `ip_address`, `expires_at`, `used_at`, `created_at` | token konfirmasi lupa PIN (TTL 30 mnt, sekali pakai) |
| **`ai_chat_hits`** | `id` identity, `ip`, `created_at` | rate limit chat AI (10/5 mnt/IP) |
| **`inbound_emails`** | `id` uuid PK, `from_addr`, `to_addr` (default `mail@loverse.id`), `subject`, `text_body`, `html_body`, `attachments jsonb`, `is_read`, `replied_at`, `received_at` | kotak masuk admin |
| **`site_notices`** | `id` uuid PK, `type` CHECK (`info`/`warning`/`promo`/`maintenance`), `mode` CHECK (`banner`/`modal`/`both`), `title`, `body`, `cta_label`, `cta_href`, `starts_at`, `ends_at`, `is_active`, `created_at`, `updated_at` | pengumuman beranda |
| **`telegram_handover_sessions`** | `id` uuid PK, `anon_id`, `status` CHECK (`active`/`closed`), `transcript jsonb`, `telegram_chat_id`, `telegram_message_id`, `created_at`, `updated_at` | sesi handover chat AI → Telegram |

### 14.7 Bentuk `event_details` (jsonb pada `orders`)

```jsonc
{
  "venue_name": "", "venue_address": "", "maps_link": "",
  "akad_date": "", "akad_time": "", "resepsi_date": "", "resepsi_time": "",
  "groom_parents": "", "bride_parents": "",
  "groom_photo": "", "bride_photo": "", "cover_photo": "",
  "gallery": ["https://r2.loverse.id/..."],
  "banks": [{ "bank": "", "number": "", "name": "" }],
  "audio_url": "", "quote": "", "quote_src": "",
  // hanya saat checkout online (ditulis create-order):
  "payment_method": "qris", "base_price": 15000,
  "admin_fee": 1665, "template_name": "Cinnamon Blue"
}
```
Whitelist key `update_event_details_field`:
`venue_name, venue_address, maps_link, akad_date, akad_time, resepsi_date,
resepsi_time, groom_parents, bride_parents, groom_photo, bride_photo, cover_photo,
audio_url, quote, quote_src`.

### 14.8 VIEW `public.public_invitations` (tampilan publik aman)
```sql
SELECT id, slug, groom_name, bride_name, wedding_date, template_slug,
       payment_status, event_details, created_at
FROM public.orders;
```
Tanpa `pin_code`, `pin_hash`, `snap_token`, `midtrans_order_id`, `email`, `whatsapp`.

---

## 15. Fungsi Database (RPC) & Trigger

### 15.1 Fungsi

| Fungsi | Tipe | Peran |
|---|---|---|
| `is_admin()` | STABLE, SECURITY DEFINER | `true` bila `auth.email()` ada di `admin_users` — basis semua policy admin |
| `verify_customer_pin(p_whatsapp, p_pin)` | SQL, SECURITY DEFINER | cek PIN via bcrypt `extensions.crypt`, hanya order `success`, `LIMIT 1`; return `id, slug, groom_name, bride_name, wedding_date, template_slug` — **tidak pernah mengembalikan PIN** |
| `login_client(...)` (3 varian) | SECURITY DEFINER | varian login legacy (membandingkan plaintext) — dipakai tipe `Database` frontend, bukan jalur utama |
| `create_order_secure(...)` | SECURITY DEFINER | legacy: insert order berdasar harga template |
| `update_event_details_field(p_order_id, p_key, p_value)` | SECURITY DEFINER | update 1 key `event_details`; wajib claim `order_id` cocok atau admin; key harus dalam whitelist; selain itu `forbidden` / `field_not_allowed` |
| `push_gallery_item(p_order_id, p_url)` | SECURITY DEFINER | append URL ke `event_details.gallery` (otorisasi sama) |
| `remove_gallery_item(p_order_id, p_url)` | SECURITY DEFINER | hapus URL dari `event_details.gallery` (otorisasi sama) |
| `delete_order_cascade(p_order_id)` | SECURITY DEFINER | **admin only**: hapus semua `rsvps` order lalu `orders`; return `{rsvps_deleted, orders_deleted}` |
| `log_orders_audit()` | trigger fn | tulis `admin_audit_log` untuk INSERT/UPDATE/DELETE `orders` |
| `log_pending_audit()` | trigger fn | idem untuk `pending_orders` |
| `orders_set_pin_hash()` | trigger fn | isi `pin_hash` bcrypt tiap `pin_code` berubah |
| `prevent_sensitive_update()` | trigger fn | **blok klien** mengubah `payment_status` (boleh `service_role`) |
| `lock_price()` | trigger fn | **blok klien** mengubah `price` (boleh `service_role`) |
| `touch_handover_updated()` | trigger fn | perbarui `updated_at` sesi handover Telegram |

### 15.2 Trigger

| Trigger | Tabel | Waktu | Fungsi |
|---|---|---|---|
| `trg_orders_audit` | `orders` | AFTER INSERT/UPDATE/DELETE | `log_orders_audit` |
| `trg_pending_audit` | `pending_orders` | AFTER INSERT/UPDATE/DELETE | `log_pending_audit` |
| `trg_orders_pin_hash` | `orders` | BEFORE INSERT/UPDATE OF `pin_code` | `orders_set_pin_hash` |
| `lock_payment_status` | `orders` | BEFORE UPDATE | `prevent_sensitive_update` |
| `prevent_price_update` | `orders` | BEFORE UPDATE | `lock_price` |
| `trg_handover_touch` | `telegram_handover_sessions` | BEFORE UPDATE | `touch_handover_updated` |

Isi `details` audit UPDATE `orders` (top-level saja, bukan dump penuh):
`payment_status_old/new`, `slug_old/new`, `template_slug_old/new`,
`pin_code_changed` (bool), `event_details_changed` (daftar key yang berubah).
Aktor ditentukan dari `request.jwt.claim.sub/role`: `service_role` → `service`,
email admin → `admin`, selain itu → `customer`.

### 15.3 Index

| Index | Kolom |
|---|---|
| `orders_slug_unique_idx` | `orders (slug)` UNIQUE |
| (constraint) | `orders (midtrans_order_id)` UNIQUE |
| `idx_orders_payment_status` | `orders (payment_status)` |
| `idx_orders_created` | `orders (created_at DESC)` |
| `idx_pending_orders_status_created` | `pending_orders (status, created_at)` |
| `rsvps_order_id_created_at_idx` | `rsvps (order_id, created_at DESC)` |
| `idx_inbound_emails_unread` | `inbound_emails (is_read, received_at DESC)` |
| `idx_ai_chat_hits_ip_created` | `ai_chat_hits (ip, created_at DESC)` |

---

## 16. RLS (Row Level Security)

### 16.1 `orders`
| Policy | Akses | Kondisi |
|---|---|---|
| `customer_or_admin_select_orders` | SELECT `authenticated` | `auth.jwt()->>'order_id' = id` **atau** `is_admin()` |
| `customer_or_admin_update_orders` | UPDATE `authenticated` | sama (USING + WITH CHECK) |

Tidak ada policy INSERT/DELETE → hanya service_role (Edge Functions) yang membuat
& menghapus order (plus RPC `delete_order_cascade` SECURITY DEFINER).

### 16.2 `rsvps`
| Policy | Akses | Kondisi |
|---|---|---|
| `public_insert_rsvps` | INSERT semua role | `WITH CHECK (true)` — tamu anon bisa mengisi |
| `owner_or_admin_select_rsvps` | SELECT `authenticated` | `auth.jwt()->>'order_id' = order_id` atau `is_admin()` |
| `owner_or_admin_update_rsvps` | UPDATE `authenticated` | milik order pemilik atau admin (balasan) |
| `owner_or_admin_delete_rsvps` | DELETE `authenticated` | milik order pemilik atau admin |

**Baca publik global dicabut** (migrasi `20260919000005_security_lockdown.sql`) —
tamu membaca daftar lewat `rsvp-list`, bukan SELECT anon.

### 16.3 `pending_orders`
| Policy | Akses | Kondisi |
|---|---|---|
| `public_insert_pending_orders` | INSERT | `WITH CHECK (true)` (jalur praktis; aplikasi tetap lewat Edge Function) |
| `admin_select_pending_orders` | SELECT `authenticated` | `is_admin()` |
| `admin_delete_pending_orders` | DELETE `authenticated` | `is_admin()` (aktivasi = klaim delete) |

### 16.4 Tabel master & konten
| Policy | Tabel | Akses |
|---|---|---|
| `public_select_templates` | `templates` | SELECT semua (`USING true`) |
| `admin_insert/update/delete_templates` | `templates` | CRUD `authenticated` + `is_admin()` |
| `public_select_site_notices` | `site_notices` | SELECT bila `is_active AND starts_at <= now() AND (ends_at IS NULL OR ends_at >= now())` |
| `admin_select/insert/update/delete_site_notices` | `site_notices` | CRUD admin |
| `admin_select_inbound_emails`, `admin_update_inbound_emails` | `inbound_emails` | SELECT & UPDATE (tandai dibaca/balas) — admin |
| `admin_read_audit_log` | `admin_audit_log` | SELECT admin |

### 16.5 Tabel rate-limit — RLS ON **tanpa policy** (hanya `service_role`/Edge Functions)
`login_attempts`, `order_attempts`, `pin_resend_attempts`, `ai_chat_hits`.

### 16.6 Storage
Bucket `images`: policy `Allow public viewing of images` (SELECT) dipertahankan;
**INSERT/UPDATE publik DICABUT** (migrasi lockdown) — semua unggahan aplikasi lewat
presigned URL Cloudflare R2.

---

## 17. Daftar Edge Functions (`supabase/functions/`)

| Function | Peran | Otorisasi |
|---|---|---|
| `create-order` | buat order Midtrans **atau** `pending_orders` manual | Turnstile + rate limit `order_attempts` (fail-closed) |
| `midtrans-webhook` | terima notifikasi bayar → aktivasi/gagal | signature Midtrans (wajib) |
| `payment-status` | status order untuk `/payment-status` | `order_token` (AES-GCM) / id mentah → respons terbatas |
| `activate-pending-order` | aktivasi manual oleh admin | `requireAdminMfa` + klaim atomik |
| `customer-login` | terbitkan JWT pelanggan | rate limit `login_attempts` + RPC PIN |
| `resend-pin` | kirim ulang PIN 2 tahap | captcha + rate limit + token sekali pakai |
| `expire-pending-orders` | cron housekeeping harian | header `x-cron-secret` |
| `rsvp-list` | daftar RSVP per slug (publik) | slug = kapabilitas; kolom dibatasi |
| `ai-chat` | proxy Gemini + handover Telegram | rate limit `ai_chat_hits` |
| `telegram-webhook` | balasan admin Telegram → transcript | webhook secret + allowlist user id |
| `inbound-email` | simpan email masuk (+lampiran ke R2) | header `x-inbound-secret` |
| `reply-email` | balas email masuk via Resend | sesi admin |
| `r2-upload-url` | presigned PUT upload media | `verifyMediaAccess` (JWT customer/admin) |
| `r2-upload` / `r2-delete` | upload langsung / hapus objek media | guard serupa |

Modul bersama `_shared/`: `midtrans.ts`, `orderToken.ts`, `pin.ts`, `auth.ts`,
`cors.ts`, `emailLayout.ts`, `resendEmail.ts`, `resendPinEmail.ts`, `invoiceAssets.ts`,
`brandLogo.ts`, `brandFont.ts`, `telegram.ts`, `whatsapp.ts`, `monitoring.ts`.
Semua memakai **service-role client** di dalam; CORS dikunci `ALLOWED_ORIGIN` (bukan `*`).

---

## 18. Ringkasan Keamanan & Rate Limit

| Area | Mekanisme |
|---|---|
| Buat order | Turnstile + `order_attempts` 10/IP/15 mnt (429; fail-closed 503) |
| Login PIN | `login_attempts` 5/nomor & 20/IP per 15 mnt; PIN disimpan bcrypt; PIN tidak pernah dikembalikan |
| Lupa PIN | `pin_resend_attempts` (jeda 60 dtk, 3/jam/email, 10/jam/IP) + token 256-bit hash SHA-256, TTL 30 mnt, sekali pakai, respons generik |
| Chat AI | `ai_chat_hits` 10/5 mnt per IP |
| Admin login | Turnstile + lockout backoff (3x → 30 s, +30 s/gagal, maks 5 mnt) + opsi MFA TOTP |
| Webhook | signature sha512 wajib; payload malformed ditolak; status tak dikenal tidak menulis DB |
| Pembayaran | guard monotonik (`<> 'success'`) + conditional update/count (anti aktivasi ganda) |
| URL status | token AES-GCM; id mentah hanya membuka data terbatas |
| Kolom sensitif | trigger `prevent_sensitive_update` (`payment_status`) + `lock_price` (`price`) — hanya service_role |
| Media | presigned URL TTL 300 s, prefix wajib, **SVG ditolak**, guard JWT `order_id` |
| Publik | view aman; SELECT `rsvps` global dicabut; tulis storage publik dicabut |
| Cron/worker | `CRON_SECRET`, `INBOUND_EMAIL_SECRET`, `TELEGRAM_WEBHOOK_SECRET` — semua fail-closed |

**Env / secret**
- Frontend (`VITE_`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
  `VITE_MIDTRANS_CLIENT_KEY`, `VITE_MIDTRANS_ENVIRONMENT`, `VITE_TURNSTILE_SITE_KEY`,
  `VITE_ADMIN_PATH`.
- Supabase Edge Functions Secrets: `APP_URL`, `R2_*`, `RESEND_API_KEY`, `EMAIL_FROM`,
  `MIDTRANS_SERVER_KEY`, `MIDTRANS_IS_PRODUCTION`, `ENABLE_ONLINE_PAYMENTS`,
  `PAYMENT_LINK_SECRET`, `ALLOWED_ORIGIN`, `TURNSTILE_SECRET_KEY`, `CRON_SECRET`,
  `INBOUND_EMAIL_SECRET`, `REQUIRE_ADMIN_MFA`, `GEMINI_API_KEY`, `GEMINI_MODEL`,
  `CUSTOMER_JWT_PRIVATE_JWK`, `TELEGRAM_*`.
- Cloudflare Worker: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `INBOUND_EMAIL_SECRET`.

---

## 19. Diagram Alur End-to-End (ringkas)

```
PUBLIK
  /  → katalog templates → /demo/:slug
        │
        ▼
  /order ──(pilih tema, isi data, metode bayar, captcha)──┐
        │                                                  │
        ├── metode MIDTRANS ────────────────┐              │
        │                                   ▼              │
        │                        create-order (edge)       │
        │                          INSERT orders 'pending' │
        │                          + snap_token            │
        │                                   │              │
        │                        Snap bayar │              │
        │                                   ▼              │
        │                        midtrans-webhook          │
        │                          success → PIN + email   │
        │                          failed  → 'failed'      │
        │                                   │              │
        └── metode WHATSAPP ────┐           ▼              │
                                ▼      /payment-status     │
                     create-order → pending_orders   (polling,
                                │     token → tampil PIN)   │
                                ▼                          │
                     chat WA admin → activate-pending-order│
                                └────────────► orders 'success'
                                               + PIN + invoice PDF (email)

PELANGGAN
  /login (WA + PIN) → customer-login → JWT claim order_id → RLS
       → /dashboard/:orderId  [Sebar | Edit (event_details) | Buku Tamu (rsvps)]

TAMU
  /wedding/:slug?to=Nama → public_invitations (wajib payment_status='success')
       → rsvp-list (baca) + insert rsvps (isi) → tampil di buku tamu

ADMIN
  /admin → Supabase Auth + admin_users (is_admin)
       → orders / pending (aktivasi) / templates / notices / inbox / audit
```

---

## 20. Catatan Migrasi (urut)

| File | Isi |
|---|---|
| `20260825140744_initial_from_remote.sql` | fondasi: enum, `orders`, `pending_orders`, `templates`, `rsvps`, tabel rate-limit/audit, fungsi & trigger awal, grant |
| `20260827000000_telegram_handover.sql` | `telegram_handover_sessions` + trigger `touch_handover_updated` |
| `20260829120000_register_new_themes.sql` | daftarkan tema baru ke `templates` |
| `20260917000000_pin_resend_attempts.sql`, `20260918000000_pin_resend_attempts_email.sql` | tabel rate-limit kirim ulang PIN (+ kolom `email`) |
| `20260919000000_pin_reset_tokens.sql` | token konfirmasi lupa PIN |
| `20260919000001_migrate_domain_loverse_id.sql` | penyesuaian domain |
| `20260919000002_inbound_emails.sql`, `..._inbox_attachments.sql`, `20260930000000_inbound_html_body.sql` | kotak masuk email (+ `html_body`) |
| `20260919000004_audit_triggers.sql` | perluas audit: perubahan `template_slug` & `event_details`, tabel `pending_orders` |
| `20260919000005_security_lockdown.sql` | cabut tulis publik storage + cabut SELECT publik `rsvps` |
| `20260919000006_ratelimit_indexes.sql` | `ai_chat_hits` + index kolom panas |
| `20261016000000_site_notices.sql` | `site_notices` + policy admin/publik |
| `schema.sql` | dump lengkap (acuan membaca skema akhir) |











