# Copy changelog — K1-K5

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

## K2 — katalog, FAQ, checkout, dan pembayaran

| Kunci | ID lama → baru | EN lama → baru | Alasan |
|---|---|---|---|
| `home.catalogNote` | `Empat puluh tema. Satu yang paling kamu.` → `Pilih tema untuk undangan pernikahan Anda.` | `Forty themes. One that feels most like you.` → `Choose a theme for your wedding invitation.` | Mengganti frasa kiasan dengan arahan yang jelas dan menyamakan sapaan dengan deskripsi brand. |
| `home.faq3Q` | `Bagaimana cara membagikan undangan dengan nama tamu?` → `Bagaimana cara membuat tautan undangan untuk setiap tamu?` | `How do I share invitations with personalized guest names?` → `How do I create an invitation link for each guest?` | Menyebut hasil yang dicari, yaitu tautan undangan per tamu. |
| `home.faq3A` | `Di dashboard terdapat fitur Sebar Undangan. Anda bisa membuat link personal dengan memasukkan nama tamu atau mengimpor daftar tamu dari file CSV.` → `Buka menu Sebar Undangan di dashboard. Masukkan nama tamu atau unggah daftar tamu dalam format CSV untuk membuat tautan personal yang bisa dibagikan lewat WhatsApp.` | `Use the built-in Share Invitation tool in your dashboard. Type guest names or upload a CSV file to share directly via WhatsApp.` → `Open Share Invitation in your dashboard. Enter a guest's name or upload a CSV guest list to create links you can share on WhatsApp.` | Menjelaskan menu dan hasilnya dengan istilah yang konsisten; langkah dan metode berbagi tetap sama. |
| `home.catalogTitle` | `Koleksi Desain Undangan` → `Tema Undangan Pernikahan` | `Invitation Theme Catalog` → `Wedding Invitation Themes` | Judul menyebut dengan jelas jenis tema yang ditampilkan. |
| `home.catalogDesc` | `Pilih desain yang paling cocok dengan konsep pernikahanmu, coba pratinjau langsung, dan mulai buat.` → `Lihat pratinjau desain, lalu pilih tema untuk pesanan Anda.` | `Find the design that best matches your wedding aesthetic, test live previews, and start creating.` → `Preview each design, then choose a theme for your order.` | Menyebut dua tindakan yang tersedia dan tujuan pemilihan tema. |
| `home.catalogSearchPlaceholder` | `Cari nama desain atau tema...` → `Cari tema...` | `Search design name or style...` → `Search themes...` | Menghapus istilah yang tumpang tindih dan menyesuaikan placeholder dengan pencarian nama tema. |
| `home.catalogEmpty` | `Tidak ada tema yang cocok.` → `Tidak ada tema yang sesuai dengan pencarian atau kategori ini.` | `No themes matched your criteria.` → `No themes match this search or category.` | Menjelaskan penyebab hasil kosong secara spesifik. |
| `home.catalogEmptySub` | `Coba gunakan kata kunci atau kategori lain.` → `Coba ubah kata kunci atau pilih kategori lain.` | `Try using different keywords or categories.` → `Try a different search term or category.` | Memberi langkah berikutnya dengan kata kerja yang langsung. |
| `home.catalogCreate` | `Pilih Tema` → `Pilih` | `Select Theme` → `Choose` | Label tombol dibuat singkat; kartu menampilkan nama tema yang dipilih untuk pesanan. |
| `order.desc` | `Lengkapi data pesananmu, lalu pilih metode pembayaran.` → `Isi data acara dan kontak, lalu pilih metode pembayaran.` | `Fill in your order details, then choose your preferred payment method.` → `Enter your event and contact details, then choose a payment method.` | Menyebut data yang perlu diisi, dengan sapaan dan nada yang konsisten. |
| `order.tutorialLink` | `Bingung? Lihat tutorial` → `Lihat panduan pemesanan` | `Confused? View tutorial` → `View the ordering guide` | Label tautan menyebut isi halaman tujuan tanpa mengasumsikan pembaca bingung. |
| `order.resetForm` | `Reset` → `Kosongkan formulir` | `Reset` → `Clear form` | Menjelaskan apa yang akan dihapus. |
| `order.resetDialogTitle` | `Reset Formulir?` → `Kosongkan formulir?` | `Reset Form?` → `Clear the form?` | Menyebut tindakan yang diminta konfirmasinya. |
| `order.resetDialogMsg` | `Semua data yang kamu isi akan dihapus dan kamu kembali ke langkah pertama. Yakin?` → `Semua data yang sudah diisi akan dihapus, lalu formulir kembali ke langkah pertama. Lanjutkan?` | `All filled data will be cleared and you will be taken back to the first step. Are you sure?` → `This will clear all entered details and return the form to the first step. Continue?` | Menjelaskan akibat konfirmasi dalam kalimat langsung. |
| `order.toastResetSuccess` | `Formulir dikosongkan. Kembali ke langkah isi data.` → `Formulir dikosongkan. Anda kembali ke langkah data acara.` | `Form has been cleared. Back to the details step.` → `Form cleared. You are back at the event details step.` | Menjelaskan status formulir setelah dikosongkan. |
| `order.step1Title` | `Pilih Desain` → `Pilih tema` | `Choose Design` → `Choose a theme` | Menyamakan istilah dengan katalog. |
| `order.step1LockedDesc` | `Template dipilih dari katalog. Mau ganti? Kembali dulu ya.` → `Tema ini dipilih dari katalog. Untuk memilih tema lain, gunakan tombol Ganti Tema.` | `Template is picked from the catalog. Want another one? Go back first.` → `This theme was selected from the catalog. To choose another, use the Change Theme button.` | Mengganti istilah yang berbeda dan menjelaskan kontrol yang tersedia. |
| `order.changeTemplate` | `Ganti Template` → `Ganti Tema` | `Change Template` → `Change theme` | Memakai istilah “tema” secara konsisten dengan katalog. |
| `order.wizStep1` | `Data` → `Data` | `Details` → `Details` | Mempertahankan label singkat agar nama langkah muat pada layar sempit. |
| `order.wizStep2` | `Metode Bayar` → `Bayar` | `Payment` → `Payment` | Memendekkan label langkah tanpa mengubah fungsi pemilihan metode pembayaran. |
| `order.wizStep3` | `Konfirmasi` → `Periksa` | `Confirm` → `Review` | Menjelaskan bahwa langkah ini berisi pemeriksaan pesanan sebelum membayar. |
| `order.methodQrisTitle` | `Other QRIS` → `QRIS` | `Other QRIS` → `QRIS` | Menghapus kata “Other” yang tidak menjelaskan metode lain. |
| `order.methodQrisSubtitle` | `BCA, Mandiri, BRI, BNI, GoPay, Dana, OVO, ShopeePay, dsb.` → `BCA, Mandiri, BRI, BNI, GoPay, Dana, OVO, ShopeePay, dan lainnya.` | `BCA, Mandiri, BRI, BNI, GoPay, Dana, OVO, ShopeePay, etc.` → `BCA, Mandiri, BRI, BNI, GoPay, Dana, OVO, ShopeePay, and more.` | Mengganti singkatan dengan frasa yang lebih mudah dipahami; daftar tetap sama. |
| `order.methodEwalletTitle` | `E-Wallet / Dompet Digital` → `Dompet digital` | `E-Wallet / Digital Wallet` → `E-wallet` | Menghapus padanan ganda dan memakai satu istilah per bahasa. |
| `order.methodVaTitle` | `Virtual Accounts / Bank Transfer` → `Virtual Account / Transfer Bank` | `Virtual Accounts / Bank Transfer` → `Virtual Account / Bank transfer` | Merapikan istilah metode pembayaran dalam kedua bahasa. |
| `order.methodWaTitle` | `Transfer Manual via WhatsApp` → `Pembayaran manual via WhatsApp` | `Manual via WhatsApp` → `Manual payment via WhatsApp` | Menyebut bahwa WhatsApp dipakai untuk mengatur pembayaran manual. |
| `order.methodWaSubtitle` | `Chat dan konfirmasi langsung dengan Admin CS LoVerse` → `Hubungi admin LoVerse lewat WhatsApp untuk mengatur pembayaran manual.` | `Chat and confirm directly with LoVerse Admin CS` → `Contact LoVerse on WhatsApp to arrange manual payment.` | Menghilangkan singkatan ganda dan menjelaskan tindakan berikutnya. |
| `order.templatePrice` | `Harga Tema` → `Harga tema` | `Template Price` → `Theme price` | Menyamakan istilah harga dengan tema undangan. |
| `order.adminFee` | `Biaya Layanan` → `Biaya pembayaran` | `Service Fee` → `Payment fee` | Menjelaskan bahwa biaya ini terkait metode pembayaran yang dipilih. |
| `order.feeNotePpn` | `Biaya Admin + PPN 11%.` → `Biaya pembayaran mencakup PPN 11%.` | `Admin fee + 11%.` → `The payment fee includes 11% VAT.` | Menyebut apa yang dikenai PPN dan memberi konteks pada angka yang sama. |
| `order.btnPayWa` | `Pesan via WhatsApp` → `Lanjutkan via WhatsApp` | `Order via WhatsApp` → `Continue on WhatsApp` | Tombol membuka percakapan WhatsApp untuk melanjutkan pesanan. |
| `order.btnPayAuto` | `Bayar Otomatis` → `Lanjut ke pembayaran` | `Pay Now` → `Continue to payment` | Label menyebut langkah yang dimulai tombol. |
| `order.confirmEdit` | `Edit` → `Ubah` | `Edit` → `Edit` | Mengganti kata Inggris pada tombol ID dengan kata Indonesia yang umum. |
| `order.autoDesc` | `Bayar via QRIS, Virtual Account, E-Wallet (diproses oleh Midtrans).` → `Pilih QRIS, Virtual Account, atau dompet digital. Pembayaran diproses melalui Midtrans.` | `Pay via QRIS, Virtual Account, E-Wallet (processed by Midtrans).` → `Choose QRIS, a Virtual Account, or an e-wallet. Midtrans processes the payment.` | Memisahkan pilihan metode dan pemroses pembayaran agar lebih mudah dibaca. |
| `order.dataContactTitle` | `Data Pesanan & Kontak` → `Data acara & kontak` | `Order & Contact Details` → `Event and contact details` | Menyebut isi bagian berdasarkan data yang ditampilkan. |
| `order.templateSubtitle` | `Template undangan digital` → `Tema undangan digital` | `Digital invitation template` → `Digital invitation theme` | Menyamakan istilah dengan katalog. |
| `order.packageLabel` | `Paket` → `Kategori` | `Package` → `Category` | Nilai yang ditampilkan adalah kategori tema, bukan paket terpisah. |
| `order.methodSectionTitle` | `Metode Pembayaran` → `Metode pembayaran` | `Payment Method` → `Payment method` | Menyamakan kapitalisasi dan istilah dengan bagian pemilihan pembayaran. |
| `order.autoMethodDesc` | `Pembayaran diproses otomatis melalui Midtrans.` → `Pembayaran otomatis diproses melalui Midtrans; biaya kanal dan PPN ditampilkan pada rincian pembayaran.` | `Payment processed automatically via Midtrans.` → `Midtrans processes automated payments; channel fees and VAT appear in the payment breakdown.` | Menjelaskan bagaimana pembayaran otomatis diproses dan di mana rincian biayanya terlihat. |
| `order.changeMethod` | `Ubah Metode` → `Ubah metode pembayaran` | `Change Method` → `Change payment method` | Menjelaskan metode apa yang dapat diubah. |
| `order.feeFreeBadge` | `Gratis Rp 0` → `Biaya Rp 0` | `Free Rp 0` → `Rp 0 fee` | Memastikan label nol biaya merujuk pada biaya metode, bukan harga tema. |
| `order.selectPaymentMethod` | `Pilih Metode Pembayaran` → `Pilih metode pembayaran` | `Select a Payment Method` → `Select a payment method` | Menyamakan gaya kapitalisasi pada tombol dan judul bagian. |
| `order.orderSummaryAutomatic` | `Otomatis — QRIS / VA / E-Wallet` → `Otomatis — QRIS / VA / dompet digital` | `Automatic — QRIS / VA / E-Wallet` → `Automatic — QRIS / VA / e-wallets` | Memakai istilah dompet digital yang konsisten. |
| `order.orderSummaryWa` | `WhatsApp CS (Gratis Rp 0)` → `WhatsApp (biaya Rp 0)` | `WhatsApp CS (Free Rp 0)` → `WhatsApp (Rp 0 fee)` | Memperjelas bahwa Rp 0 adalah biaya metode WhatsApp. |

## K3 — dashboard mempelai

| Kunci | ID lama → baru | EN lama → baru | Alasan |
|---|---|---|---|
| `customer.workspace` | `Studio Undangan` → `Dashboard Undangan` | `Invitation Studio` → `Invitation Dashboard` | Menyamakan nama ruang kerja dengan judul dashboard. |
| `customer.workspaceEyebrow` | `Ruang kerja mempelai` → `Kelola undangan` | `Couple workspace` → `Manage invitation` | Menyebut tindakan yang tersedia, bukan nama ruang yang abstrak. |
| `customer.weddingDay` | `Hari bahagia` → `Tanggal acara` | `The big day` → `Event date` | Label tanggal kini menyebut data yang ditampilkan. |
| `customer.basicPackage` | `Paket Basic` → `Kategori Basic - tanpa RSVP` | `Basic Package` → `Basic category - no RSVP` | Menjelaskan arti kategori Basic dan menghapus label campuran “RSVP off” di sidebar. |
| `customer.menuRsvp` | `Buku Tamu` → `RSVP & Buku Tamu` | `Guestbook & RSVP` → `RSVP & Guestbook` | Menu mencakup konfirmasi kehadiran dan buku tamu. |
| `customer.rsvp.title` | `Buku Tamu` → `RSVP & Buku Tamu` | `Guestbook & RSVP` → `RSVP & Guestbook` | Menyamakan judul tab dengan label menu. |
| `customer.share.tabExcel` | `Unggah Excel` → `Unggah CSV` | `Upload Excel / CSV` → `Upload CSV` | Unggahan hanya menerima berkas CSV. |
| `customer.share.manualHeading` | `Buat Link Satu Per Satu` → `Buat tautan satu per satu` | `Generate Links One by One` → `Create links one at a time` | Memakai “tautan” dan kata kerja yang konsisten. |
| `customer.share.manualSub` | `Ketik nama tamu untuk membuat link undangan personal.` → `Ketik nama tamu untuk membuat tautan undangan personal.` | `Enter a guest name to generate a personalized invitation link.` → `Enter a guest name to create a personalized invitation link.` | Menyamakan istilah tautan dan tindakan pembuatan. |
| `customer.share.btnCreateLink` | `Buat Link` → `Buat tautan` | `Generate Link` → `Create link` | Label tombol menyebut hasil yang dibuat. |
| `customer.share.successTitle` | `Link Berhasil Dibuat!` → `Tautan berhasil dibuat!` | `Link Created Successfully!` → `Link created successfully!` | Memakai istilah tautan dan kapitalisasi kalimat. |
| `customer.share.btnCopy` | `Salin Link` → `Salin tautan` | `Copy Link` → `Copy link` | Memakai istilah tautan secara konsisten. |
| `customer.share.previewLabel` | `Pratinjau Link:` → `Pratinjau tautan:` | `Link Preview:` → `Link preview:` | Memakai istilah tautan secara konsisten. |
| `customer.share.excelHeading` | `Upload Daftar Tamu` → `Unggah daftar tamu` | `Upload Guest List` → `Upload guest list` | Menghapus kata Inggris “Upload” pada antarmuka ID. |
| `customer.share.csvExampleSub` | `Baris pertama adalah judul kolom, kolom pertama berisi nama tamu.` → `Baris pertama berisi judul kolom. Nama tamu dibaca dari kolom pertama.` | `First row is header, first column contains guest names.` → `The first row contains column headers. Guest names are read from the first column.` | Menjelaskan struktur CSV dan kolom yang dibaca. |
| `customer.share.csvTip2` | `Kolom lain selain 'Nama' akan diabaikan secara otomatis.` → `Hanya kolom pertama yang dibaca; kolom lainnya diabaikan.` | `Other columns beside 'Name' will be automatically ignored.` → `Only the first column is read; other columns are ignored.` | Menyebut aturan kolom secara langsung tanpa menyiratkan judul kolom harus “Nama”. |
| `customer.share.copiedToast` | `Link berhasil disalin!` → `Tautan berhasil disalin!` | `Link copied to clipboard!` → `Link copied!` | Menyamakan istilah tautan dan memendekkan notifikasi. |
| `customer.edit.desc` | `Perbarui informasi dan media undangan pernikahan Anda.` → `Perbarui detail acara, foto, dan musik undangan Anda.` | `Update your wedding information and media assets.` → `Update your invitation's event details, photos, and music.` | Menyebut isi yang dapat diubah. |
| `customer.edit.noCover` | `Belum ada foto banner sampul` → `Belum ada foto sampul` | `No cover banner photo uploaded` → `No cover photo yet` | Menghapus istilah ganda “banner sampul”. |
| `customer.edit.btnUploadCover` | `Upload Banner Sampul` → `Unggah Banner Sampul` | `Upload Banner` → `Upload Banner` | Menghapus kata Inggris “Upload” pada antarmuka ID. |
| `customer.edit.uploadPhoto` | `Upload Foto` → `Unggah Foto` | `Upload Photo` → `Upload Photo` | Menghapus kata Inggris “Upload” pada antarmuka ID. |
| `customer.edit.btnUploadGallery` | `Upload Foto ke Galeri` → `Unggah Foto ke Galeri` | `Upload Gallery Photos` → `Upload Gallery Photos` | Menghapus kata Inggris “Upload” pada antarmuka ID. |
| `customer.edit.galleryEmpty` | `Belum ada koleksi foto galeri yang diunggah.` → `Belum ada foto di galeri.` | `No gallery photos uploaded yet.` → `No photos in the gallery yet.` | Memendekkan status kosong agar langsung terbaca. |
| `customer.edit.btnAddBank` | `+ Tambah` → `+ Tambah Rekening` | `+ Add Account` → `+ Add Account` | Tombol kini menyebut objek yang ditambahkan. |
| `customer.rsvp.btnExport` | `Export Excel` → `Ekspor Excel` | `Export Excel` → `Export Excel` | Memakai kata kerja Indonesia pada antarmuka ID. |
| `customer.rsvp.emptyFilter` | `Tidak ada data ditemukan.` → `Tidak ada tamu yang cocok dengan filter.` | `No data matching your filter.` → `No guests match this filter.` | Menjelaskan penyebab hasil kosong. |
| `customer.rsvp.emptyList` | `Belum ada data ucapan.` → `Belum ada ucapan dari tamu.` | `No guest messages yet.` → `No guest messages yet.` | Menyebut sumber data yang kosong. |
| `customer.rsvp.emptyFiltered` | `Tidak ada data ditemukan.` → `Tidak ada tamu yang cocok dengan filter.` | `No data matching your filter.` → `No guests match this filter.` | Menjelaskan penyebab hasil kosong. |
| `customer.rsvp.emptyDefault` | `Belum ada data ucapan.` → `Belum ada ucapan dari tamu.` | `No guest messages yet.` → `No guest messages yet.` | Menyebut sumber data yang kosong. |

## K4 — kejelasan panel admin

| Kunci | ID lama → baru | EN lama → baru | Alasan |
|---|---|---|---|
| `admin.menuWhatsapp` | `Data Masuk (WhatsApp)` → `Pesanan dari WhatsApp` | `Incoming Orders (WhatsApp)` → `WhatsApp Orders` | Menu menyebut sumber dan isi data. |
| `admin.inboxSubtitle` | `Pesan masuk ke mail@loverse.id — klik untuk membaca & membalas.` → `Pesan yang masuk ke mail@loverse.id. Klik pesan untuk membaca dan membalas.` | `Messages to mail@loverse.id — click to read & reply.` → `Messages sent to mail@loverse.id. Click a message to read and reply.` | Memisahkan keterangan kotak masuk dan tindakan membaca. |
| `admin.loginTitle` | `Admin Login` → `Masuk Admin` | `Admin Login` → `Admin Sign In` | Memakai kata kerja Indonesia pada judul halaman masuk. |
| `admin.loginSubtitle` | `Masuk dengan akun terdaftar untuk mengelola undangan.` → `Masuk dengan akun admin untuk mengelola undangan.` | `Log in with authorized account to manage invitations.` → `Sign in with an admin account to manage invitations.` | Menyebut jenis akun yang diperlukan. |
| `admin.toastLogout` | `Berhasil Logout` → `Berhasil keluar.` | `Logged out successfully` → `Logged out successfully` | Menghapus kata Inggris dan menambahkan tanda baca akhir. |
| `admin.noticeCap` | `Menampilkan {shown} pesanan masuk terbaru dari total {total}.` → `Menampilkan {shown} pesanan terbaru dari total {total}. Pesanan lain tidak dimuat di daftar ini.` | `Showing {shown} latest incoming orders out of {total} total.` → `Showing the latest {shown} orders out of {total}. Other orders are not loaded in this list.` | Menjelaskan batas daftar dan pesanan yang tidak dimuat. |
| `admin.ordersSubtitle` | `Kelola dan pantau semua data undangan yang sudah aktif di sistem.` → `Kelola dan pantau undangan yang sudah aktif.` | `Manage and monitor all active wedding invitations in the system.` → `Manage and monitor active invitations.` | Menghapus pengulangan “semua data” dan “di sistem”. |
| `admin.ordersDesc` | `Kelola dan pantau semua data undangan yang sudah aktif di sistem.` → `Kelola dan pantau undangan yang sudah aktif.` | `Manage and monitor all active wedding invitations in the system.` → `Manage and monitor active invitations.` | Menyamakan deskripsi dengan judul tab. |
| `admin.whatsappTitle` | `Data Masuk WhatsApp` → `Pesanan dari WhatsApp` | `WhatsApp Incoming Orders` → `WhatsApp Orders` | Menyebut pesanan, bukan data masuk yang ambigu. |
| `admin.whatsappSubtitle` | `Daftar pesanan yang masuk melalui WhatsApp dan menunggu persetujuan admin.` → `Pesanan dari WhatsApp yang menunggu persetujuan admin.` | `List of orders submitted via WhatsApp waiting for admin approval.` → `Orders received on WhatsApp that are waiting for admin approval.` | Memendekkan kalimat tanpa mengubah arti. |
| `admin.whatsappDesc` | `Daftar pesanan yang masuk melalui WhatsApp dan menunggu persetujuan admin.` → `Pesanan dari WhatsApp yang menunggu persetujuan admin.` | `List of orders submitted via WhatsApp waiting for admin approval.` → `Orders received on WhatsApp that are waiting for admin approval.` | Menyamakan deskripsi dengan subjudul. |
| `admin.pendingWaTitle` | `Data Masuk (WhatsApp)` → `Pesanan dari WhatsApp` | `Incoming Orders (WhatsApp)` → `WhatsApp Orders` | Menyamakan istilah pada semua tampilan pesanan WhatsApp. |
| `admin.paymentPending` | `Pending` → `Menunggu` | `Pending` → `Pending` | Memakai kata Indonesia yang umum. |
| `admin.statusPending` | `Pending` → `Menunggu` | `Pending` → `Pending` | Menyamakan status pembayaran pada tabel ID. |
| `admin.thContact` | `Kontak Info` → `Kontak pembeli` | `Contact Info` → `Buyer contact` | Menjelaskan pemilik kontak. |
| `admin.thAction` | `Tindakan` → `Aksi` | `Action` → `Action` | Memakai label kolom yang konsisten dan singkat. |
| `admin.thControl` | `Kontrol` → `Aksi` | `Control` → `Actions` | Menyebut tindakan yang tersedia, bukan istilah teknis. |
| `admin.daysAgo` | `Hari Yg Lalu` → `Hari lalu` | `Days Ago` → `Days ago` | Memperbaiki singkatan dan kapitalisasi. |
| `admin.cardSlugWarning` | `*Hati-hati! Mengubah slug akan membuat link lama tidak bisa diakses.` → `Mengubah slug membuat tautan lama tidak bisa dibuka.` | `*Warning! Changing the slug will break previously shared links.` → `Changing the slug makes previously shared links stop working.` | Menjelaskan akibat perubahan slug tanpa peringatan berlebihan. |
| `admin.templatesSubtitle` | `Atur katalog template undangan, kelola harga, dan status aktif atau nonaktif.` → `Atur harga dan status aktif template undangan.` | `Configure invitation templates catalog, pricing, and active status.` → `Set invitation template prices and active status.` | Menyebut dua tindakan yang tersedia di tab. |
| `admin.templatesDesc` | `Atur katalog template undangan, kelola harga, dan status aktif atau nonaktif.` → `Atur harga dan status aktif template undangan.` | `Configure invitation templates catalog, pricing, and active status.` → `Set invitation template prices and active status.` | Menyamakan deskripsi dengan subjudul. |
| `admin.noticesSubtitle` | `Buat pengumuman (promo, maintenance, info) yang tampil otomatis di halaman beranda.` → `Buat pengumuman promo, info, atau pemeliharaan yang tampil otomatis di beranda.` | `Create announcements (promo, maintenance, info) that appear automatically on the homepage.` → `Create promo, info, or maintenance announcements that appear automatically on the homepage.` | Menghapus tanda kurung dan memakai istilah Indonesia untuk jenis pengumuman. |

## K5 — galat, status kosong, konfirmasi, dan toast

| Kunci | ID lama → baru | EN lama → baru | Alasan |
|---|---|---|---|
| `toast.galleryAddedSaved` | `Foto ditambahkan & tersimpan.` → `Foto ditambahkan dan tersimpan.` | `Photo added & saved.` → `Photo added and saved.` | Mengganti ampersand dengan kata sambung agar kalimat status mudah dibaca. |
| `toast.uploadSuccessSaved` | `Berhasil diunggah & tersimpan.` → `Berhasil diunggah dan tersimpan.` | `Uploaded & saved successfully.` → `Uploaded and saved.` | Menyatukan dua status dalam satu kalimat pendek. |
| `toast.uploadSuccess` | `Upload berhasil!` → `Berhasil diunggah!` | `Upload successful!` → `Upload successful!` | Menghapus kata Inggris pada notifikasi ID. |
| `toast.uploadFailed` | `Gagal upload: {error}` → `Gagal mengunggah: {error}` | `Upload failed: {error}` → `Upload failed: {error}` | Menghapus kata Inggris pada pesan galat ID. |
| `toast.musicDeletedSaved` | `Musik berhasil dihapus & tersimpan.` → `Musik dihapus dan tersimpan.` | `Music removed & saved successfully.` → `Music removed and saved.` | Memendekkan status dan menghapus ampersand. |
| `toast.deleteFailed` | `Gagal hapus: {error}` → `Gagal menghapus: {error}` | `Failed to delete: {error}` → `Failed to delete: {error}` | Memakai bentuk kata kerja yang lengkap. |
| `toast.deleteFailedSimple` | `Gagal hapus komentar.` → `Gagal menghapus komentar.` | `Failed to delete comment.` → `Failed to delete comment.` | Memakai bentuk kata kerja yang lengkap. |
| `toast.savedSuccess` | `Berhasil disimpan!` → `Perubahan berhasil disimpan.` | `Saved successfully!` → `Changes saved.` | Menyebut objek yang tersimpan, yaitu perubahan. |
| `toast.priceUpdateNoChange` | `Gagal update harga: tidak ada data yang berubah.` → `Gagal memperbarui harga: tidak ada data yang berubah.` | `Failed to update price: no data changed.` → `Failed to update price: no data changed.` | Menghapus kata Inggris pada pesan galat ID. |
| `toast.priceUpdateFailed` | `Gagal update harga.` → `Gagal memperbarui harga.` | `Failed to update price.` → `Failed to update price.` | Menghapus kata Inggris pada pesan galat ID. |
| `toast.bulkPriceNoChange` | `Harga massal gagal: tidak ada data yang berubah.` → `Gagal memperbarui harga massal: tidak ada data yang berubah.` | `Bulk price update failed: no data changed.` → `Bulk price update failed: no data changed.` | Menyebut tindakan yang gagal sebelum penyebabnya. |
| `toast.bulkPriceFailed` | `Gagal update massal.` → `Gagal memperbarui harga massal.` | `Failed to apply bulk update.` → `Failed to apply bulk update.` | Menyebut objek pembaruan secara lengkap. |
| `toast.orderRejectedDeleted` | `Pesanan ditolak & dihapus.` → `Pesanan ditolak dan dihapus.` | `Order rejected & deleted.` → `Order rejected and deleted.` | Mengganti ampersand dengan kata sambung. |
| `toast.loginFailed` | `Login Gagal: {error}` → `Gagal masuk: {error}` | `Login Failed: {error}` → `Sign-in failed: {error}` | Memakai kata kerja yang konsisten dan kapitalisasi kalimat. |
| `toast.openingWhatsapp` | `Berhasil! Membuka WhatsApp...` → `Membuka WhatsApp...` | `Success! Opening WhatsApp...` → `Opening WhatsApp...` | Menyatakan tindakan yang sedang berjalan tanpa klaim tambahan. |
