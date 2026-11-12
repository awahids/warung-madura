# Juragan Warung 🏪

Simulasi warung Madura 2D yang berjalan di browser. Dibangun dengan **React + Vite**, render game memakai **HTML5 Canvas**; semua sprite berasal dari satu sprite sheet.

**Main online:** https://awahids.github.io/warung-madura/

## Cara main
1. Tarik pintu besi ke atas untuk membuka warung (drag atau klik berkali-kali).
2. Pembeli menyebut pesanan → klik barangnya di rak/etalase/gantungan → **HITUNG** → beri kembalian dengan klik pecahan uang.
3. Siang: pesan stok di **Buku Catatan**, terima kardus kurir. Malam: kewarasan turun — isi lewat HP atau seduh kopi.
4. Kejadian acak: kasbon dan tamu misterius. Selesaikan 3 misi harian; target saldo Rp 1.500.000.

Pintasan: `Esc` jeda, `Spasi` hitung.

## Level & pesan lewat HP
- **Level juragan** (maks. 20): XP dari tiap pembeli yang dilayani (+10, +5 bila cepat, +3 bila dapat tip) dan misi harian (+40). Bar level ada di HUD. Naik level memberi **bonus kas** (Rp 10.000 × level), **diskon grosir** 2% per level (maks. 20%), dan **kurir lebih cepat** (90 menit → min. 45). XP tersimpan di save; rumus di `src/game/logic/level.js`. Klik bar level di HUD untuk melihat isi tiap level.
- **Yang dibuka per level** (tabel `ITEM_LVL` / `TYPE_LVL` / `FEATURE_LVL`): Lv 1 → 6 barang dasar (kopi, rokok, air mineral, mie, kerupuk, keripik) + Bang Ojol, Mas Dimas, Bang Rizky · Lv 2 → Cola, Bu Sri, Promo · Lv 3 → Bensin, Adik Pelajar, Kasbon · Lv 4 → Galon, Pak Haji · Lv 5 → Minuman Energi, Pak Tukang, Pesan Ulang di HP · Lv 6 → Beras, Tamu Misterius, Kembalian Otomatis · Lv 7 → Turis Bule · Lv 8 → Gas Melon, Kurir Ekspres (30 menit, biaya +15%). Barang terkunci **disembunyikan dari adegan 3D** (rak bensin, galon, gas, beras, cola, minuman energi — termasuk stok dekoratif di lantai; tidak bisa diklik dan tanpa lencana stok) dan muncul saat levelnya tercapai (`setLockedItems` di `src/scene3d/warung.js`). Barang terkunci juga tidak dipesan pembeli, tidak bisa dijual/dipesan, dan diberi stok perkenalan saat terbuka.
- **Pesan barang lewat HP**: klik HP di meja (atau tombol *HP · Pesan Barang* sebelum buka) → aplikasi **GrosirKu** untuk memilih paket dan memesan. Tombol *Medsos* di HP mengisi energi (membuat pembeli yang sedang dilayani lebih tidak sabar). Buku Catatan kini hanya untuk cek stok, harga, dan laba.

## Pasang sebagai aplikasi (PWA)
Game ini PWA: bisa dipasang ke layar utama dan dimainkan **offline** setelah dibuka sekali.
- **Android/Chrome & desktop:** ketuk tombol **Pasang aplikasi** di bagian bawah, atau menu browser → *Install app*.
- **iPhone/iPad (Safari):** ketuk **Bagikan → Tambah ke Layar Utama**.
Berkas terkait: `public/manifest.webmanifest`, `public/sw.js` (daftar precache & versi disuntik saat build oleh `vite.config.js`), `public/icons/`.

## Mode 3D (utama) & 2D
Game terbuka dalam **mode 3D** secara default. Pindah ke 2D lewat tombol **Mode 2D** di bilah bawah (`#/2d`), dan kembali lewat **Mode 3D** (`#/`). Progres tersimpan sama di kedua mode.
Material 3D memakai PBR: peta lingkungan (IBL), relief (bump) kayu/beton/aspal/logam, kulit bertekstur pori dengan sheen, kain beranyaman, dan rambut berkilau.

Detail mode 3D: Logika game **sama persis** dengan versi 2D (`src/game/logic`, `update.js`);
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

## Cerita & tanggung jawab (tahap A)
Rancangan lengkap: `docs/STORY.md`. Yang sudah jalan:
- **Utang ke Koh Awi** Rp 1.200.000, **cicilan tiap 3 hari** (Rp 90 rb di Bab 1, naik tiap bab; dibayar otomatis saat warung tutup bila kas cukup). Menunggak → bunga 5%, kepercayaan turun; 2× berturut-turut → pesanan stok ditahan. Bisa dicicil lebih awal lewat Buku Catatan (*Bayar utang +50rb*). *Mode santai* (menu Jeda) meniadakan cicilan.
- **Kepercayaan warga** (0–100, bar tipis di bawah Reputasi): memengaruhi kesabaran pembeli (±12%) dan peluang kasbon dilunasi (45–85%). Naik dengan jujur & membantu; turun bila menolak, mengecewakan pembeli, atau menunggak.
- **Kejadian harian dengan pilihan**: satu per hari (jam 11–19, saat tidak melayani). Bab 1–2 berurutan (Bang Jaka, kembalian, Koh Awi, Pak Haji; Bu Sri, Rani, Pak Darto, Bang Rizky), sisanya dari kolam acak. Akibat pilihan tampil langsung, dan **kabar lanjutan** datang di pagi hari berikutnya.
- **Rekap malam**: status cicilan, kepercayaan, *Kabar kampung*, dan catatan Pak Haji per bab.
- Bab mengikuti level: 1 (Lv1–2), 2 (Lv3–4), 3 (Lv5–6), 4 (Lv7), 5 (Lv8+). Konten ada di `src/game/story/events.js` (data murni), mesin di `src/game/logic/story.js`.
- XP per level dinaikkan (`xpAt` = 100·(L−1)·L) supaya satu bab bertahan beberapa hari.

## Pembeli baru
Tiga tipe pembeli baru (`TYPES` di `src/game/data.js`, tampilan di `LOOK`/`VARIANTS` pada `src/scene3d/people.js`, semuanya tampil di galeri `#/orang`):
- **Adik Pelajar** (Lv 3, seragam putih-abu + dasi, ransel; variasi berhijab): jajan murah (keripik, air mineral, kerupuk, mie, cola), lebih ramai saat berangkat/pulang sekolah.
- **Pak Tukang** (Lv 5, helm proyek kuning, baju proyek oranye berpita pantul, sarung tangan): rokok, kopi, air mineral, galon; ramai pagi–siang.
- **Turis Bule** (Lv 7, topi lebar, kamera di dada, baju pantai; variasi wanita bergaun kotak): minuman dingin, selalu membayar pecahan Rp 50.000+ dan sering memberi tip besar; ramai siang saat tidak hujan.
Di mode 2D, tipe baru memakai sprite pembeli yang sudah ada (atlas sprite 2D tidak diubah).

## Suasana jalan
Murni visual, tidak menyentuh logika game (`src/scene3d/ambience.js`):
- Mobil, angkot, dan motor melintas di dua lajur berlawanan arah. Lajurnya di paruh jauh jalan supaya tidak lewat di antara kamera Luar/Pembeli dan warung; lampu depannya menyala saat malam.
- Di seberang jalan: trotoar, gerobak bakso dengan penjualnya, pangkalan ojek dengan pengemudi yang duduk menunggu, dan dua pejalan kaki.
- Warga nongkrong di bangku teras, sesekali menyeruput kopi.
- Kucing warung tidur di teras, lalu sesekali bangun, berjalan menyusuri tepi trotoar, dan pindah tempat tidur.
- Diagnostik dev: `scene.ambience()` (keadaan kucing, jumlah kendaraan), `scene.lookFrom(posisi, sasaran)` (kamera bebas).

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
