// ============================================================
// src/pages/TermsPage.tsx
// ------------------------------------------------------------
// Syarat & Ketentuan layanan (halaman publik statis). Memakai
// layout bersama LegalPage. Dipakai di : App.tsx (route /terms)
// ============================================================

import LegalPageLayout from '../components/shared/LegalPage';

const UPDATED = '19 Oktober 2026';

const SECTIONS = [
  {
    title: 'Deskripsi Layanan',
    body: [
      'LoVerse menyediakan undangan pernikahan digital berisi fitur RSVP, buku tamu, musik pengiring, galeri foto, dan dashboard khusus pengantin. Layanan diakses melalui tautan undangan yang dapat dibagikan.',
    ],
  },
  {
    title: 'Pesanan & Akun',
    body: [
      'Pesanan dibuat melalui halaman Order. Setelah pembayaran terverifikasi, kredensial akun (nomor WhatsApp + PIN 6 digit) dikirimkan via email.',
      'PIN bersifat rahasia; jangan dibagikan kepada pihak yang tidak bertanggung jawab atas akunmu.',
    ],
  },
  {
    title: 'Pembayaran',
    body: [
      'Pembayaran otomatis menggunakan Midtrans (QRIS, GoPay, ShopeePay, Virtual Account) atau transfer manual via WhatsApp dengan konfirmasi admin.',
      'Pemesanan dianggap aktif setelah status pembayaran berubah menjadi lunas pada sistem.',
    ],
  },
  {
    title: 'Masa Aktif Undangan',
    body: [
      'Undangan aktif hingga seluruh rangkaian acara pernikahan selesai, tanpa biaya bulanan.',
      'Perjanjian ini berakhir setelah layanan undangan tamat atau pesanannya ditolak sebelum pembayaran.',
    ],
  },
  {
    title: 'Penggantian Isi Undangan',
    body: [
      'Pengantin dapat mengubah isi undangan (lokasi, jadwal, foto, musik, rekening kado) mandiri melalui Dashboard kapan saja tanpa biaya tambahan.',
    ],
  },
  {
    title: 'Hak Penggunaan Tema',
    body: [
      'Lisensi tema bersifat personal untuk satu acara. Tidak diperbolehkan menjual ulang, mendistribusikan, atau memperbanyak desain untuk kepentingan komersial lain.',
    ],
  },
  {
    title: 'Kelayakan Penggunaan',
    body: [
      'Isi undangan menjadi tanggung jawab pengantin. Dilarang menanyakan konten yang melanggar hukum, hak cipta pihak lain, atau mengandung ujaran kebencian.',
    ],
  },
  {
    title: 'Perubahan Syarat',
    body: [
      'Syarat ini dapat diperbarui saat fitur layanan berubah. Tanggal pembaruan terakhir tercantum di bagian atas halaman ini.',
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Syarat & Ketentuan"
      metaDescription="Syarat & Ketentuan layanan undangan pernikahan digital LoVerse — pesanan, pembayaran, masa aktif, dan lisensi penggunaan tema."
      updated={UPDATED}
      sections={SECTIONS}
    />
  );
}
