# Color From Logo

Sumber warna: `public/logo.svg` dan `public/logo.png`.

## Sampling

Kedua berkas dirender ke canvas tanpa filter, lalu piksel opak dihitung. Warna dominan
keduanya identik:

| Asset | Dimensions | Dominant opaque color |
| --- | --- | --- |
| `logo.svg` | viewBox `-12 -14 672 520` | `#FFD6B2` |
| `logo.png` | `680 × 220` | `#FFD6B2` |

Variasi `#FFD5B1`/`#FFD5B2`/`#FFD6B3` hanya berasal dari anti-aliasing tepi. Tidak ada
warna logo lain.

Logo peach dalam OKLCH:

```text
oklch(0.9021 0.0660 63.12)
```

Hue **63.12** dipakai tetap untuk seluruh skala netral, krem, peach, dan aksen. Chroma
diturunkan untuk netral dan dinaikkan sedikit untuk aksen. Warna status (success, danger,
WhatsApp) tetap memakai hue fungsional masing-masing agar status tidak mengandalkan warna
saja; nilainya tetap token dan tidak dipakai sebagai aksen dekoratif.

## Scale

| Token | Hex | OKLCH (L C H) | Peran |
| --- | --- | --- | --- |
| `ink-950` | `#190F07` | `0.180 0.022 63.12` | teks utama, panel gelap |
| `ink-900` | `#281B10` | `0.235 0.028 63.12` | teks utama |
| `ink-800` | `#392A1D` | `0.300 0.032 63.12` | teks kuat |
| `ink-700` | `#513E2D` | `0.380 0.038 63.12` | teks sekunder |
| `ink-600` | `#685341` | `0.460 0.040 63.12` | teks sekunder |
| `ink-500` | `#75604E` | `0.505 0.038 63.12` | muted minimum di krem (5.28:1) |
| `ink-400` | `#7D6958` | `0.535 0.036 63.12` | muted minimum di krem (4.64:1) |
| `ink-300` | `#AC9B8C` | `0.700 0.030 63.12` | dekorasi/ikon non-teks |
| `cream-50` | `#FFF9F2` | `0.985 0.012 63.12` | kartu terang |
| `cream-100` | `#FFEFE2` | `0.962 0.024 63.12` | latar utama |
| `cream-200` | `#F8E2CF` | `0.925 0.035 63.12` | panel sekunder |
| `cream-300` | `#ECD0B8` | `0.875 0.045 63.12` | border/dekorasi |
| `cream-400` | `#D8B79A` | `0.800 0.055 63.12` | border kuat |
| `peach-100` | `#FFF0E1` | `0.965 0.028 63.12` | tint |
| `peach-200` | `#FFE3C9` | `0.935 0.048 63.12` | tint kuat |
| `peach-300` | `#FFD6B2` | `0.9021 0.066 63.12` | **warna logo**, bidang gelap saja |
| `peach-400` | `#F7BD89` | `0.840 0.095 63.12` | hover peach |
| `ember-400` | `#EEAF75` | `0.800 0.105 63.12` | aksen terang |
| `ember-500` | `#BF7523` | `0.630 0.130 63.12` | focus ring, garis |
| `ember-600` | `#9D5800` | `0.530 0.125 63.12` | teks aksen/CTA (4.88:1 di krem) |
| `ember-700` | `#7D4600` | `0.450 0.105 63.12` | hover/teks aksen kuat |
| `wine-900` | `#28190A` | `0.230 0.035 63.12` | panel gelap alternatif |
| `wine-800` | `#3E2915` | `0.300 0.045 63.12` | panel gelap alternatif |
| `gold-500` | `#D3965C` | `0.720 0.105 63.12` | status pending |
| `gold-600` | `#875726` | `0.500 0.090 63.12` | teks pending (6.14:1) |
| `success-600` | `#426F4C` | `0.500 0.075 150` | status sukses |
| `success-700` | `#325B3B` | `0.430 0.070 150` | teks sukses |
| `danger-600` | `#A43C33` | `0.500 0.140 28` | status bahaya |
| `danger-700` | `#852F28` | `0.430 0.120 28` | teks bahaya |
| `whatsapp-600` | `#17843F` | `0.540 0.140 150` | tombol WhatsApp (4.76:1 dengan putih) |
| `whatsapp-700` | `#0E6E33` | `0.470 0.135 150` | hover WhatsApp |

## Contrast Rules

- Teks krem di atas `ink-950` memakai `cream-100` atau lebih terang; opasitas teks harus
  tetap ≥4.5:1.
- `peach-300` hanya untuk logo/aksen di permukaan gelap. Jangan jadikan teks di atas krem.
- Teks muted di krem minimal `ink-500`; `ink-400` masih lolos 4.64:1 tetapi jangan
  dikombinasikan dengan opacity tambahan.
- `ember-600` dan `ember-700` lolos untuk teks di krem; `ember-500` hanya non-teks.
- `success-600`, `danger-600`, dan `whatsapp-600` adalah token fungsional. Label/ikon
  pendamping tetap wajib ada agar status tidak bergantung pada warna saja.
- Semua nilai warna aplikasi didefinisikan di `src/index.css`. Komponen tidak boleh
  menulis hex/rgb/hsl. Tema undangan di `src/templates/themes` dikecualikan karena
  merupakan kontrak visual produk.

## Verification

```powershell
Select-String -Path "src/**/*.tsx","src/**/*.ts" -Pattern "#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\("
```

Hasil akhir harus kosong untuk komponen aplikasi (tema undangan tidak termasuk).
