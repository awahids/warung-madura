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

## Main versi 3D
Buka `#/3d` (tautan **Main 3D** di bawah game). Logika game **sama persis** dengan versi 2D (`src/game/logic`, `update.js`);
hanya tampilannya yang diganti adegan 3D, dengan HUD/balon pesanan/nampan/modal sebagai lapisan transparan di atasnya.
- Pelanggan 3D berjalan mengikuti posisi dari logika game (masuk → antre → dilayani → pergi), tipe-nya (ojol, ibu, juragan, dst.) punya penampilan sendiri.
- Klik barang 3D: renteng (kopi, keripik), etalase (rokok), rak bensin, minuman & mie & toples di meja, galon/gas/beras di meja teras; kalkulator = HITUNG, HP, gelas kopi, buku catatan, spanduk promo, kardus kurir.
- Pintu besi 3D mengikuti `G.door` (tarik/klik); langit, lampu neon, lampu jalan, jendela gedung, dan hujan mengikuti jam game & cuaca.
- Animasi pelanggan: melangkah ke meja → mengulurkan uang saat membayar → mengambil belanjaan → pergi menenteng kantong (atau membawa galon/gas/karung yang dibeli). Barang yang dipilih pemain terbang dari rak ke nampan di meja.
- Lengan dua ruas dengan siku (bahu→siku→tangan); lengan penjaga memakai IK sehingga tangan tepat sampai ke sasaran. Mesin kasir dengan laci uang di meja: laci terbuka saat penjaga menerima uang/mengambil kembalian dan menutup saat menyerahkan belanjaan. Pembayaran pas juga membuka laci (fase "terima uang" ~1,7 dtk khusus tampilan 3D; mode 2D tidak berubah).
- Animasi penjaga (terlihat dari kamera Luar/Pembeli): tangan menjangkau barang yang diklik, menerima uang saat pelanggan membayar, menyerahkan kantong saat transaksi selesai, mengangkat gelas saat minum kopi, memegang HP; badan menoleh dan maju ke meja.
- Semua 12 barang dagangan terlihat & bisa diklik dari sudut Penjaga: galon, gas, beras, dan rak bensin berada di meja display teras setinggi dada (di atas barang di meja kasir). Diagnostik dev: `scene.reachability()` menembakkan sinar dari kamera ke tiap barang; `scene.heavy()` mencantumkan mesh terberat.
- LOD menyembunyikan detail terkecil orang yang jauh dari kamera.
- Kamera: Luar / Pembeli / Penjaga (tombol atau tombol keyboard `1` `2` `3`); di layar sentuh tekan-tahan barang menampilkan info.
- Kode: `src/game/engine3d.js` (jembatan), `src/game/render/overlay3d.js` (UI), `src/scene3d/warung.js` (adegan).

## Karakter 3D
Buka `#/orang` (tautan **Karakter 3D**) untuk galeri semua tokoh: Pak Haji (koko putih, sarung, peci), Bu Sri (daster bunga, sanggul), Bang Ojol (helm hijau, jaket hijau berpita reflektif, celana hitam, sneakers, tas boks pengantar makanan di punggung; ada sudut kamera khusus depan/belakang),
Mas Dimas (kaos, ransel, celana pendek), Bang Rizky (hoodie, topi), tamu misterius (hoodie hitam, masker), dan penjaga (batik kawung, sarung, peci).
Dibuat prosedural (`src/scene3d/people.js`) dengan gaya **chibi 3D**: proporsi dua kepala seperti karakter kantor noskill (kepala ≈ setengah tinggi badan, tinggi total ≈1,8 m), mata besar berkilau yang berkedip, pipi merona, mulut tersenyum, badan dan kaki pendek-gempal, tangan bulat.
Ciri tiap tokoh tetap: kain bertekstur (batik, bunga, kotak-kotak sarung, jaket berpita reflektif), peci, helm, topi, tudung + masker, kacamata, kumis, sanggul, ransel, tas boks.
Rangka animasi tidak berubah: pinggul/bahu/siku/leher berporos, tangan mengepal saat menggenggam kantong/uang.
Karena badannya pendek, pelanggan mengangkat tangan ke samping kepala saat membayar/mengambil belanjaan, dan penjaga berdiri di atas dingklik di balik meja kasir.
- **Ekspresi wajah** mengikuti kesabaran pelanggan: senyum → datar → cemberut dengan alis marah; girang (mulut terbuka, mata `^ ^`) saat pulang membawa belanjaan, marah saat pergi kecewa (`moodOf` di `src/game/engine3d.js`).
- **Variasi penampilan** (dipilih per pelanggan, logika game tetap enam tipe): Bu berhijab, bapak sarungan dengan rokok di telinga, mas berkacamata, bang berambut keriting. Semuanya ada di galeri; tombol **Baru** menyorotnya, dan ekspresi diperagakan bergiliran.
- **Kurir** berjalan masuk saat kiriman tiba, menunggu di samping kardus, lalu pergi setelah barang diterima.
- **Serah-terima**: uang terbang dari tangan pelanggan ke penjaga, kantong/barang terbang balik ke pelanggan. Slot antrean berjarak ≈1 m supaya kepala tidak saling menutupi.

## Warung 3D (prosedural)
Buka `#/warung` (tautan **Warung 3D** di bawah game): bangunan warung Madura lengkap dibuat lewat kode Three.js, tanpa model eksternal.
Isi: rolling door yang bisa dibuka/tutup (klik pintu atau tombol), spanduk, meja kasir + etalase kaca, rak dinding, renteng gantung,
kulkas minuman, karung beras/galon/gas, rak bensin, bangku, jalan & lampu jalan, tiga orang sederhana, mode siang/malam (neon),
dan tiga sudut kamera (dari luar, pembeli, penjaga/sudut pandang orang pertama). Sumber: `src/scene3d/`.

## Uji coba prop 3D
Buka `#/props` (mis. https://awahids.github.io/warung-madura/#/props, atau tautan **Uji coba 3D** di bawah game).
7 prop dibuat prosedural dengan Three.js (galon, gas melon, toples kerupuk, botol & rak bensin, kardus, karung beras), dibandingkan dengan sprite 2D-nya.
Untuk mengganti dengan model sendiri/dari pustaka gratis, taruh GLB di `public/models/<id>.glb` lalu jalankan `npm run models:check` (lihat `public/models/README.md`).

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
