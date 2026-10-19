// ============================================================
// src/pages/PrivacyPolicyPage.tsx
// ------------------------------------------------------------
// Kebijakan Privasi (halaman publik statis). Memakai layout
// bersama LegalPage. Dipakai di : App.tsx (route /privacy)
// ============================================================

import LegalPageLayout from '../components/shared/LegalPage';

const UPDATED = '19 Oktober 2026';

const SECTIONS = [
  {
    title: 'Ringkasan',
    body: [
      'LoVerse adalah layanan undangan pernikahan digital. Dokumen ini menjelaskan data apa yang kami kumpulkan, untuk keperluan apa, dan bagaimana kamu dapat mengelolanya.',
    ],
  },
  {
    title: 'Data yang Kami Kumpulkan',
    body: [
      'Saat memesan: nama mempelai, tanggal acara, alamat email, dan nomor WhatsApp, serta foto/musik yang kamu unggah untuk isi undangan.',
      'Saat masuk Dashboard: nomor WhatsApp dan PIN yang menjadi kredensial akunmu.',
      'Data RSVP tamu (nama, kehadiran, ucapan) dikumpulkan lewat halaman undangan dan dapat diakses/diekspor oleh pengantin melalui Dashboard.',
    ],
  },
  {
    title: 'Penggunaan Data',
    body: [
      'Data digunakan untuk membuat dan mengoperasikan undangan, keperluan administrasi pesanan (invoice, konfirmasi pembayaran), serta peningkatan kualitas layanan.',
      'Kami tidak menjual atau membagikan datamu kepada pihak ketiga untuk tujuan iklan.',
    ],
  },
  {
    title: 'Pembayaran',
    body: [
      'Pembayaran diproses oleh mitra pembayaran Midtrans (QRIS, e-wallet, Virtual Account). LoVerse tidak menyimpan data kartu pembayaran atau kredensial keuanganmu.',
    ],
  },
  {
    title: 'Penyimpanan & Keamanan',
    body: [
      'Data undangan disimpan pada infrastruktur basis data Supabase. Akses konten terbatas: pemilik pesanan (login PIN), tamu yang menerima tautan undangan, serta admin yang bertanggung jawab atas layanan.',
    ],
  },
  {
    title: 'Hak Kamu',
    body: [
      'Kamu dapat memperbarui isi undangan mandiri melalui Dashboard 24 jam.',
      'Bila menghapus data pesanan, hubungi kami melalui halaman Kontak dan kami akan memprosesnya.',
    ],
  },
  {
    title: 'Perubahan Kebijakan',
    body: [
      'Kebijakan ini dapat diperbarui dari waktu ke waktu. Tanggal pembaruan terakhir selalu ter cantum di bagian atas halaman ini.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Kebijakan Privasi"
      metaDescription="Kebijakan privasi LoVerse — bagaimana kami mengumpulkan, menggunakan, dan melindungi data pengguna undangan pernikahan digital."
      updated={UPDATED}
      sections={SECTIONS}
    />
  );
}
