# Color From Logo

Sumber warna: `public/logo.svg`, `public/logo.png`, dan
`loverse-color-palette.xlsx`.

Warna dominan logo adalah `#FFD6B2` (Peach). Warna `#633221` (Kastanye) dan
`#FFD6B2` diberikan langsung oleh user. Nilai lain di workbook adalah warna
pendukung berbasis peran, bukan brand guideline terpisah.

## Palette

| Peran | Token utama | Hex | Pemakaian |
| --- | --- | --- | --- |
| Espresso | `espresso`, `ink-950` | `#2B1510` | panel gelap, teks utama di krem |
| Kakao | `kakao`, `ink-900` | `#4A2418` | panel gelap sekunder |
| Kastanye | `kastanye`, `ink-800` | `#633221` | brand dan CTA gelap |
| Permukaan | `permukaan`, `ink-700` | `#7A4430` | permukaan gelap |
| Peach | `peach`, `peach-300` | `#FFD6B2` | logo dan CTA utama |
| Krem | `krem`, `cream-50`, `cream-100` | `#FFF6EC` | latar terang utama |
| Champagne | `champagne`, `cream-300`, `gold-500` | `#E4C78E` | garis, ikon, aksen kecil |
| Tembaga | `tembaga`, `cream-400`, `peach-400`, `ember-400` | `#E8A07F` | aksen dan hover sesekali |
| Muted dark | `muted-dark` | `#E2C3A6` | teks sekunder di latar gelap |
| Emas tua | `gold-dark`, `ember-500`, `ember-600`, `gold-600` | `#8A6420` | teks emas di krem |
| Muted cream | `muted-cream`, `ink-600`, `ink-500`, `ink-400`, `ink-300` | `#7A5445` | teks sekunder di krem |
| Sukses gelap | `success-dark` | `#A9C7A0` | status sukses di latar gelap |
| Peringatan gelap | `warning-dark` | `#EBBB5A` | status peringatan di latar gelap |
| Error gelap | `error-dark` | `#F5A092` | status error di latar gelap |
| Sukses krem | `success-cream`, `success-600`, `whatsapp-600` | `#3F6B4A` | status sukses dan WhatsApp |
| Peringatan krem | `warning-cream` | `#8A5A00` | status peringatan di krem |
| Error krem | `error-cream`, `danger-600` | `#B3392F` | status error di krem |
| Anggur | `wine`, `wine-800`, `wine-900`, `danger-700` | `#7A2433` | section CTA dan aksi hapus |
| Hijau hutan | `forest`, `success-700`, `whatsapp-700` | `#2F4A3A` | hijau gelap/WhatsApp |

Token turunan:

- `cream-200` adalah `color-mix` 24% Peach + Krem.
- `peach-100` adalah `color-mix` 18% Peach + Krem.
- `peach-200` adalah `color-mix` 42% Peach + Krem.
- `--color-white` di app diarahkan ke Krem. `.theme-canvas` me-resetnya ke
  `#fff` agar template undangan mempertahankan kontrak visualnya.

## Aturan

- Kontras teks normal minimal `4.5:1`; teks besar dan komponen UI minimal `3:1`.
- Peach dipakai untuk logo dan CTA utama; aksen kecil memakai Champagne atau
  Tembaga. Hindari area luas dan teks panjang; area luas memakai Krem atau tint
  Krem.
- Champagne dipakai datar dan hemat; jangan membuat gradien emas baru.
- Status memakai varian sesuai latar: varian `*-dark` di permukaan gelap,
  varian `*-cream` di permukaan terang. Jangan menaruh teks status langsung di
  atas Permukaan `#7A4430`.
- Krem menggantikan putih murni dan Espresso menggantikan hitam murni di app.
- Komponen aplikasi tidak boleh menulis hex/rgb/hsl. Tema undangan di
  `src/templates/themes` dikecualikan karena merupakan kontrak visual produk.

## Verifikasi

```powershell
node scripts/audit-colors.mjs
node scripts/audit-a11y.mjs
```

`audit-colors` memeriksa token wajib, raw color, palette asing, dan pasangan
kontras. `audit-a11y` menjalankan axe pada route utama dengan dev server aktif.
