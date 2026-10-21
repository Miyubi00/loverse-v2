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
