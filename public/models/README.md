# Model GLB (opsional)

Taruh model di sini untuk menggantikan prop prosedural di halaman `#/props`. Nama berkas = id prop:

| Berkas | Prop | Tinggi target |
|---|---|---|
| `galon.glb` | Galon 19 L | 0,43 m |
| `gas.glb` | Gas melon 3 kg | 0,36 m |
| `toples.glb` | Toples kerupuk | 0,27 m |
| `bensin.glb` | Botol bensin | 0,25 m |
| `rakBensin.glb` | Rak bensin | 0,88 m |
| `kardus.glb` | Kardus air mineral | 0,29 m |
| `beras.glb` | Karung beras | 0,51 m |

Ukuran & posisi disesuaikan otomatis (diskalakan ke tinggi target, alas di y=0, dipusatkan). Berkas yang tidak ada → prop prosedural dipakai.

## Cek sebelum commit
```bash
npm run models:check
```
Melaporkan ukuran, jumlah segitiga, dimensi, dan jumlah tekstur tiap berkas terhadap anggaran HP
(≤ 600 KB dan ≤ 12.000 segitiga per prop; rak bensin 2×).

## Cara mendapatkan model
- **Pustaka gratis:** Sketchfab (filter *Downloadable* + lisensi **CC0** atau **CC-BY**), Kenney, Poly Haven, Quaternius.
  Catat sumber & lisensi di `public/models/CREDITS.md` (wajib untuk CC-BY).
- **Buat sendiri:** Blender → *File → Export → glTF 2.0 (.glb)*. Pakai satuan meter, alas di y=0, sumbu Y ke atas.
- **AI (mis. Meshy):** ekspor GLB, lalu kurangi poligon di Blender (*Decimate*) atau lewat `gltf-transform`.

## Menyiapkan agar ringan (opsional)
```bash
npx @gltf-transform/cli optimize in.glb out.glb --compress meshopt --texture-compress webp --texture-resize 512
```
(Model dengan kompresi meshopt/Draco perlu decoder di loader; untuk uji coba awal, hindari kompresi geometri
dan cukup kecilkan tekstur.)

## Catatan
- **Merek dagang:** jangan pakai logo merek asli (Aqua, Coca-Cola, Red Bull, dll.) bila game dipublikasikan — gunakan label generik.
- Satu material/atlas tekstur per prop lebih ringan untuk HP.
