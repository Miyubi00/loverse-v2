# Copy changelog — K1

Perubahan ini hanya mencakup brand, hero, pengantar fitur, CTA, footer, dan metadata beranda. Struktur dan kunci i18n tetap.

| Kunci | ID lama → baru | EN lama → baru | Alasan |
|---|---|---|---|
| `home.heroCtaCatalog` | `Lihat Koleksi Tema` → `Lihat tema` | `Explore Themes` → `Browse themes` | Menjelaskan tujuan tombol dengan kata yang lebih ringkas. |
| `home.heroCtaOrder` | `Buat Undangan Sekarang` → `Buat undangan` | `Create Invitation Now` → `Create an invitation` | Tautan membuka halaman pembuatan pesanan; label menyebut tindakannya. |
| `home.heroLine1` | `Cinta` → `Undangan` | `Love` → `Digital` | Bagian pertama slogan utama menyebut produk, bukan gagasan abstrak. |
| `home.heroLine2` | `punya cerita.` → `pernikahan` | `has a story.` → `wedding invitations` | Menyambungkan nama produk ke jenis acara dalam dua bahasa. |
| `home.heroLine3` | `Buat yang tak terlupa.` → `digital untuk hari istimewa Anda.` | `Make it unforgettable.` → `for your special day.` | Melengkapi slogan yang sama maknanya dan menghindari janji “tak terlupa”. |
| `home.heroLede` | `Bukan sekadar tautan. Musik, galeri, RSVP, dan setiap detail hari bahagiamu hidup dalam satu halaman yang terasa seperti kamu.` → `LoVerse adalah platform untuk membuat dan membagikan undangan pernikahan digital.` | `More than a link. Music, gallery, RSVP, and every detail of your day live on one page that feels like you.` → `LoVerse is a platform for creating and sharing digital wedding invitations.` | Deskripsi satu kalimat menyatakan fungsi produk dengan jelas. |
| `home.heroScroll` | `Gulir untuk jatuh cinta` → `Gulir untuk melihat fitur` | `Scroll to fall in love` → `Scroll to see the features` | Menjelaskan hasil tindakan menggulir. |
| `home.heroStageLabel` | `Satu hati, ribuan cerita` → `Pratinjau tema undangan` | `One heart, a thousand stories` → `Invitation theme preview` | Mengganti tagline kedua yang abstrak dengan label pratinjau. |
| `home.manifestoTitle` | `Bukan undangan yang biasa.` → `Atur detail acara dalam undangan digital.` | `Not just another invitation.` → `Add event details to your digital invitation.` | Judul baru menyebut hal yang dapat dilakukan. |
| `home.manifestoBody` | `Kami merancang setiap detail supaya tamu merasa diundang secara personal — dan kamu tetap tenang di hari H.` → `Tambahkan jadwal, lokasi, foto, dan musik. Tema RSVP juga menyediakan formulir konfirmasi kehadiran.` | `We design every detail so guests feel personally invited — and you stay calm on the big day.` → `Add the schedule, location, photos, and music. RSVP themes also include an attendance form.` | Mengganti manfaat abstrak dengan isi yang dapat diatur, serta menyebut ketersediaan formulir RSVP secara terbatas pada tema RSVP. |
| `home.ctaTitleNew` | `Mulai cerita yang tinggal dibagikan.` → `Buat undangan pernikahan digital.` | `Start the story worth sharing.` → `Create a digital wedding invitation.` | Judul CTA menyebut tindakan dan hasilnya. |
| `home.ctaBannerBtn` | `Mulai Buat Undangan Sekarang` → `Buat undangan` | `Start Creating Your Invitation` → `Create an invitation` | Label pendek dan sesuai dengan tujuan tombol, yaitu halaman pesanan. |
| `home.footerTagline` | `Platform undangan pernikahan digital: RSVP realtime, musik, galeri HD, dan dashboard khusus mempelai.` → `LoVerse adalah platform untuk membuat dan membagikan undangan pernikahan digital.` | `Digital wedding invitation platform: realtime RSVP, music, HD gallery, and a dedicated couple dashboard.` → `LoVerse is a platform for creating and sharing digital wedding invitations.` | Memakai satu deskripsi brand yang sama dengan hero. |

## Teks metadata beranda

| Lokasi | ID lama → baru | EN lama → baru | Alasan |
|---|---|---|---|
| `index.html` title dan metadata sosial | `LoVerse — Undangan Pernikahan Digital Elegan & Modern` → `LoVerse — Undangan pernikahan digital untuk hari istimewa Anda.` | HTML awal tidak menyediakan nilai EN; nilai ID menjadi fallback → `LoVerse — Digital wedding invitations for your special day.` pada title dan metadata halaman setelah dimuat | Menyamakan judul dengan slogan dan menyediakan versi EN di metadata halaman. Metadata sosial statis memakai versi ID. |
| `index.html` description dan metadata sosial | `LoVerse — undangan pernikahan digital elegan & modern. Pilih 40+ tema, RSVP online, musik, galeri foto, dan buku tamu. Buat dalam hitungan menit mulai Rp 10.000.` → `LoVerse adalah platform untuk membuat dan membagikan undangan pernikahan digital.` | Description halaman sebelumnya berupa teks ID yang sama dan harga dinamis → `LoVerse is a platform for creating and sharing digital wedding invitations.` pada metadata halaman setelah dimuat | Mengganti deskripsi beranda yang berbeda-beda dengan satu kalimat brand. Metadata sosial statis memakai versi ID. |
| `src/pages/HomePage.tsx` `usePageMeta` | Judul tetap dan deskripsi ID dengan jumlah tema serta harga dinamis → slogan dan deskripsi dari nilai locale yang sudah ada | Teks ID yang sama ditampilkan saat bahasa EN → slogan dan deskripsi EN dari nilai locale yang sudah ada | Memakai isi locale agar title dan `meta[name="description"]` mengikuti bahasa aktif; tidak menambah kunci. |

Metadata sosial (`og:*` dan `twitter:*`) tetap statis pada HTML awal dan memakai Bahasa Indonesia. `title` dan `meta[name="description"]` halaman mengikuti locale aktif melalui hook yang sudah ada.
