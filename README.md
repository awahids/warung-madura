# Juragan Warung 🏪

Simulasi warung Madura 2D yang berjalan di browser. Dibangun dengan **React + Vite**, render game memakai **HTML5 Canvas**; semua sprite berasal dari satu sprite sheet.

**Main online:** https://awahids.github.io/warung-madura/

## Cara main
1. Tarik pintu besi ke atas untuk membuka warung (drag atau klik berkali-kali).
2. Pembeli menyebut pesanan → klik barangnya di rak/etalase/gantungan → **HITUNG** → beri kembalian dengan klik pecahan uang.
3. Siang: pesan stok di **Buku Catatan**, terima kardus kurir. Malam: kewarasan turun — isi lewat HP atau seduh kopi.
4. Kejadian acak: kasbon dan tamu misterius. Selesaikan 3 misi harian; target saldo Rp 1.500.000.

Pintasan: `Esc` jeda, `Spasi` hitung.

## Pasang sebagai aplikasi (PWA)
Game ini PWA: bisa dipasang ke layar utama dan dimainkan **offline** setelah dibuka sekali.
- **Android/Chrome & desktop:** ketuk tombol **Pasang aplikasi** di bagian bawah, atau menu browser → *Install app*.
- **iPhone/iPad (Safari):** ketuk **Bagikan → Tambah ke Layar Utama**.
Berkas terkait: `public/manifest.webmanifest`, `public/sw.js` (daftar precache & versi disuntik saat build oleh `vite.config.js`), `public/icons/`.

## Uji coba prop 3D
Buka `#/props` (mis. https://awahids.github.io/warung-madura/#/props, atau tautan **Uji coba 3D** di bawah game).
7 prop dibuat prosedural dengan Three.js (galon, gas melon, toples kerupuk, botol & rak bensin, kardus, karung beras), dibandingkan dengan sprite 2D-nya.
Untuk mengganti dengan model hasil Meshy/Blender, taruh GLB di `public/models/<id>.glb` (lihat `public/models/README.md`).

## Pengembangan
```bash
npm install
npm run dev      # http://localhost:5173
npm test         # vitest: unit logika + simulasi bot 3 hari
npm run lint
npm run build    # hasil di dist/
```

## Struktur
```
src/
  main.jsx, App.jsx          shell React (loading, toolbar, layar penuh)
  components/                GameCanvas (siklus hidup mesin), Loading, Toolbar
  game/
    engine.js                loop update/draw, resize, muat atlas
    input.js  ambient.js     pointer/keyboard; hujan & lalu lintas
    state.js                 state bersama (G, ui, fx, mouse)
    data.js  constants.js    barang, tipe pelanggan, konstanta
    logic/                   day (siklus hari, misi), customers (transaksi), actions (HP, kurir, promo)
    update.js                tick waktu, spawn, event, kesabaran
    render/                  background, scene, tray, hud, door, modals, title
    sprites.js widgets.js    helper sprite & UI canvas (immediate-mode)
    assets/atlas.webp        atlas hasil potong sprite sheet (+ atlas.json)
tests/game.test.js
```

## Deploy
Push ke `main` → GitHub Actions (`.github/workflows/deploy.yml`) menjalankan lint, test, build, lalu publish ke GitHub Pages.
Aktifkan sekali di **Settings → Pages → Source: GitHub Actions**. Catatan: GitHub Pages untuk repo *private* hanya tersedia di paket Pro/Team; di paket gratis repo harus *public*.
