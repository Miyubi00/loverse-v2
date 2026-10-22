# Copy facts — K1

Fakta di bawah ini menjadi dasar untuk copy K1 yang diubah. Tidak ada harga, jumlah tema, durasi, kuota, atau metode pembayaran baru yang ditambahkan.

| Fakta yang disebut | Sumber di kode |
|---|---|
| LoVerse menyediakan halaman undangan pernikahan digital. | `src/App.tsx:105` mendaftarkan halaman `/wedding/:slug` yang merender `InvitationPage`; tema undangan berada di `src/templates/themes/`. |
| Pengguna dapat memulai pembuatan pesanan dari beranda. | `src/pages/HomePage.tsx:252-257` mengarahkan tombol ke `/order`; `src/App.tsx:80` mendaftarkan halaman tersebut. |
| Pengguna dapat membuat tautan undangan dan membagikannya melalui WhatsApp atau menyalin tautannya. | `src/components/customer/ShareTab.tsx:125-181` membuat tautan, menyalin, dan membagikannya. |
| Jadwal dan lokasi acara dapat diatur untuk undangan. | `src/components/shared/form/SectionCards.tsx:50-98` menyediakan kolom tanggal, waktu, nama lokasi, alamat, dan tautan peta. |
| Foto dan musik dapat ditambahkan ke undangan. | `src/components/shared/form/SectionCards.tsx:274-340` mengelola galeri foto; `:376-470` mengelola musik. |
| Tema RSVP menyediakan formulir konfirmasi kehadiran. | `src/templates/themes/ArtTheme.tsx:91-166` merender formulir RSVP; `src/pages/CustomerDashboardPage.tsx:266` membatasi panel RSVP untuk pesanan non-Basic. |

Deskripsi brand sengaja dibatasi pada fungsi inti: membuat dan membagikan undangan pernikahan digital. Rincian fitur di pengantar menyebut RSVP hanya untuk tema RSVP.

## K2 — katalog, FAQ, checkout, dan pembayaran

| Fakta yang disebut di teks K2 | Sumber di kode |
|---|---|
| Katalog menampilkan pratinjau tema; memilih kartu membuka pesanan dengan tema tersebut. | `src/components/shared/TemplateCatalogCard.tsx:19-20,25,54-62` mengarahkan kartu ke `/demo/{slug}` dan tombol pemilihan ke `/order?template={slug}`. |
| Nama tema dan harga yang dipakai saat pemesanan berasal dari data template; daftar lokal menjadi fallback. | `src/pages/OrderPage.tsx:198-209` membaca tabel `templates` dan mengambil `price`; `src/lib/constants.ts:41-81` menyediakan daftar serta harga fallback. |
| Pengguna dapat membuat tautan undangan dengan nama tamu, mengunggah daftar dalam CSV, lalu membagikan tautan melalui WhatsApp. | `src/components/customer/ShareTab.tsx:107-125,226-227,318-324` menyediakan input nama, CSV, serta aksi berbagi; `src/hooks/useShareLink.ts:53-65` membuat tautan personal dan membuka WhatsApp. |
| Form pesanan berisi data acara dan kontak, lalu berlanjut ke pemilihan metode pembayaran dan pemeriksaan pesanan. | `src/pages/OrderPage.tsx:297-306,420-438` memvalidasi data sebelum berpindah ke langkah metode bayar dan konfirmasi; `src/components/order/OrderDetailsForm.tsx:69-175` menampilkan kolom acara dan kontak. |
| Pilihan pembayaran yang tampil mencakup QRIS, dompet digital, Virtual Account, dan WhatsApp manual. | `src/components/order/PaymentMethodPicker.tsx:153-300` merender pilihan tersebut; `src/components/order/constants.ts:12-22` mendefinisikan tipe metodenya. |
| Pembayaran otomatis diarahkan ke Midtrans; pesanan manual melalui WhatsApp membuka percakapan WhatsApp. | `src/hooks/useOrderCheckout.ts:70-100,178-244` memproses pembayaran otomatis dan metode `manual_whatsapp`; `src/components/order/OrderPaymentActions.tsx:45-105` memilih aksi berdasarkan metode pembayaran. |
| Ringkasan menghitung biaya berdasarkan metode; biaya WhatsApp manual bernilai Rp 0 dan metode daring juga menghitung PPN 11% atas biaya kanal. | `src/components/order/constants.ts:162-178` menghitung biaya; `src/components/order/OrderSummary.tsx:65-71,169-183` menampilkan harga tema, biaya metode, dan total. |

K2 hanya menyebut fungsi dan nilai yang ditampilkan oleh kode tersebut. Angka harga, biaya, tarif, daftar metode, dan langkah checkout tidak diubah.

## K3-K5 — dashboard, admin, dan status

| Fakta yang disebut di teks K3-K5 | Sumber di kode |
|---|---|
| Kategori Basic tidak menampilkan menu RSVP dan buku tamu. | `src/pages/CustomerDashboardPage.tsx:56-58,92-101` memakai `BASIC_TEMPLATES_SLUGS` dan menyembunyikan tab RSVP untuk kategori tersebut. |
| Impor daftar tamu menerima CSV dan membaca nama dari kolom pertama. | `src/components/customer/ShareTab.tsx:224-229` membatasi input ke `.csv`; parser daftar tamu di `src/hooks/useShareLink.ts` membaca kolom pertama. |
| Tautan tamu dapat dibuat, disalin, dan dikirim melalui WhatsApp. | `src/components/customer/ShareTab.tsx:107-181` menyediakan form, tombol salin, dan tombol WhatsApp; `src/hooks/useShareLink.ts:53-65` membuat tautan personal. |
| Dashboard dapat memperbarui detail acara, foto, galeri, musik, dan rekening. | `src/components/shared/form/SectionCards.tsx` merender kartu lokasi, foto, galeri, musik, dan rekening; `src/components/customer/EditTab.tsx` menyusun tab edit. |
| Pesanan WhatsApp di panel admin menunggu persetujuan sebelum diaktifkan. | `src/components/admin/OrdersTab.tsx:63-94` menampilkan aksi aktivasi untuk pesanan pending dan memanggil `activate-pending-order`. |
| Panel admin dapat mengatur harga dan status aktif template. | `src/components/admin/TemplatesTab.tsx:60-120` menyediakan pembaruan status, harga satuan, dan harga massal. |
| Pengumuman situs memiliki jenis info, peringatan, promo, dan pemeliharaan. | `src/components/admin/NoticesTab.tsx:46-51,286-295` mendefinisikan tipe dan pilihan jenis pengumuman. |

K3-K5 tidak menambahkan angka, durasi, kuota, atau klaim keamanan baru. Teks promosi admin yang belum terverifikasi dicatat di `docs/copy-flags.md`.
