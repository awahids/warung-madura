# Juragan Warung 🏪

Simulasi warung Madura **3D** yang berjalan di browser. Dibangun dengan **React + Vite** dan **Three.js** (adegan prosedural); HUD, balon, nampan, dan modal digambar di kanvas 2D transparan di atas adegan 3D.

**Main online:** https://awahids.github.io/warung-madura/

## Cara main
1. Tarik pintu besi ke atas untuk membuka warung (drag atau klik berkali-kali).
2. Pembeli menyebut pesanan → klik barangnya di rak/etalase/gantungan → **HITUNG** → beri kembalian dengan klik pecahan uang.
3. Siang: pesan stok di **Buku Catatan**, terima kardus kurir. Malam: kewarasan turun — isi lewat HP atau seduh kopi.
4. Kejadian acak: kasbon dan tamu misterius. Selesaikan 3 misi harian; target saldo Rp 1.500.000.

Pintasan: `Esc` jeda, `Spasi` hitung.

## Grafis, sentuhan, dan kinerja (mode 3D)
- **Kualitas grafis** (menu Jeda → *Grafis 3D*): *Otomatis* (default), *Tinggi*, *Rendah*. Otomatis mengukur FPS ±3 detik pertama; bila di bawah ~28 fps, turun ke Rendah sendiri (dengan pemberitahuan) dan diingat per perangkat. Rendah = tanpa bayangan dan pantulan lingkungan, tanpa sheen/clearcoat, resolusi 1×. Disimpan di `localStorage` (bukan di save game); kode di `src/game/quality.js` dan `setQuality` di `src/scene3d/warung.js`.
- **HP GrosirKu** dibagi dua halaman (6 barang per halaman, barang terbuka lebih dulu) dengan tombol −/+ dan navigasi besar; semua tombol punya area sentuh yang diperlebar di layar sentuh.
- **Meja display teras** hanya tampil bila isinya sudah terbuka (bensin Lv 3, galon/gas Lv 4–8, beras Lv 6), jadi tidak ada meja kosong di awal permainan.

## Level & pesan lewat HP
- **Level juragan** (maks. 20): XP dari tiap pembeli yang dilayani (+10, +5 bila cepat, +3 bila dapat tip) dan misi harian (+40). Bar level ada di HUD. Naik level memberi **bonus kas** (Rp 10.000 × level), **diskon grosir** 2% per level (maks. 20%), dan **kurir lebih cepat** (90 menit → min. 45). XP tersimpan di save; rumus di `src/game/logic/level.js`. Klik bar level di HUD untuk melihat isi tiap level.
- **Yang dibuka per level** (tabel `ITEM_LVL` / `TYPE_LVL` / `FEATURE_LVL`): Lv 1 → 6 barang dasar (kopi, rokok, air mineral, mie, kerupuk, keripik) + Bang Ojol, Mas Dimas, Bang Rizky · Lv 2 → Cola, Bu Sri, Promo · Lv 3 → Bensin, Adik Pelajar, Kasbon · Lv 4 → Galon, Pak Haji, Kulkas · Lv 5 → Minuman Energi, Pak Tukang, Pesan Ulang di HP · Lv 6 → Beras, Tamu Misterius, Kembalian Otomatis · Lv 7 → Turis Bule, Karyawan · Lv 8 → Gas Melon, Kurir Ekspres (30 menit, biaya +15%). Barang terkunci **disembunyikan dari adegan 3D** (rak bensin, galon, gas, beras, cola, minuman energi — termasuk stok dekoratif di lantai; tidak bisa diklik dan tanpa lencana stok) dan muncul saat levelnya tercapai (`setLockedItems` di `src/scene3d/warung.js`). Barang terkunci juga tidak dipesan pembeli, tidak bisa dijual/dipesan, dan diberi stok perkenalan saat terbuka.
- **Pesan barang lewat HP**: klik HP di meja (atau tombol *HP · Pesan Barang* sebelum buka) → aplikasi **GrosirKu** untuk memilih paket dan memesan. Tombol *Medsos* di HP mengisi energi (membuat pembeli yang sedang dilayani lebih tidak sabar). Buku Catatan kini hanya untuk cek stok, harga, dan laba.

## Pasang sebagai aplikasi (PWA)
Game ini PWA: bisa dipasang ke layar utama dan dimainkan **offline** setelah dibuka sekali.
- **Android/Chrome & desktop:** ketuk tombol **Pasang aplikasi** di bagian bawah, atau menu browser → *Install app*.
- **iPhone/iPad (Safari):** ketuk **Bagikan → Tambah ke Layar Utama**.
Berkas terkait: `public/manifest.webmanifest`, `public/sw.js` (daftar precache & versi disuntik saat build oleh `vite.config.js`), `public/icons/`.

## Mode 3D (satu-satunya mode)
Game hanya berjalan dalam **3D** (`#/`). Mode 2D lama sudah dihapus; alamat `#/2d` otomatis membuka game 3D, dan progres tersimpan tetap dipakai.
Material 3D memakai PBR: peta lingkungan (IBL), relief (bump) kayu/beton/aspal/logam, kulit bertekstur pori dengan sheen, kain beranyaman, dan rambut berkilau.

Detail mode 3D: Logika game ada di `src/game/logic` dan `update.js`, dengan HUD/balon pesanan/nampan/modal sebagai lapisan transparan di atas adegan 3D.
- Pelanggan 3D berjalan mengikuti posisi dari logika game (masuk → antre → dilayani → pergi), tipe-nya (ojol, ibu, juragan, dst.) punya penampilan sendiri.
- Klik barang 3D: renteng (kopi, keripik), etalase (rokok), rak bensin, minuman & mie & toples di meja, galon/gas/beras di meja teras; kalkulator = HITUNG, HP, gelas kopi, buku catatan, spanduk promo, kardus kurir.
- Pintu besi 3D mengikuti `G.door` (tarik/klik); langit, lampu neon, lampu jalan, jendela gedung, dan hujan mengikuti jam game & cuaca.
- Animasi pelanggan: melangkah ke meja → mengulurkan uang saat membayar → mengambil belanjaan → pergi menenteng kantong (atau membawa galon/gas/karung yang dibeli). Barang yang dipilih pemain terbang dari rak ke nampan di meja.
- Lengan dua ruas dengan siku (bahu→siku→tangan); lengan penjaga memakai IK sehingga tangan tepat sampai ke sasaran. Mesin kasir dengan laci uang di meja: laci terbuka saat penjaga menerima uang/mengambil kembalian dan menutup saat menyerahkan belanjaan. Pembayaran pas juga membuka laci (fase "terima uang" ~1,7 dtk khusus tampilan 3D; mode 2D tidak berubah).
- Animasi penjaga (terlihat dari kamera Luar/Pembeli): tangan menjangkau barang yang diklik, menerima uang saat pelanggan membayar, menyerahkan kantong saat transaksi selesai, mengangkat gelas saat minum kopi, memegang HP; badan menoleh dan maju ke meja.
- Semua 12 barang dagangan terlihat & bisa diklik dari sudut Penjaga: galon, gas, beras, dan rak bensin berada di meja display teras setinggi dada (di atas barang di meja kasir). Diagnostik dev: `scene.reachability()` menembakkan sinar dari kamera ke tiap barang; `scene.heavy()` mencantumkan mesh terberat.
- LOD menyembunyikan detail terkecil orang yang jauh dari kamera.
- Kiriman kurir: kurir berjalan ke depan meja membawa kardus; terima dengan klik kurir, tombol hijau **TERIMA KIRIMAN** (berfungsi dari sudut kamera mana pun) atau tombol `K`.
- **Barang sembako baru** (dibuka bertahap lewat level): telur (Lv 2, bisa basi), minyak goreng (Lv 3), gula (Lv 4), sabun mandi (Lv 5), susu kental manis (Lv 6), teh celup (Lv 7). Di 3D ada rak gantung di tengah warung; di 2D rak sembako di atas; Buku Catatan kini berhalaman.
- **Balon pesanan** ringkas, ditempatkan otomatis di area yang paling sedikit menutupi barang yang bisa diklik (ekor menunjuk pelanggan) dan memudar bila kursor di atasnya.
- **Bersosialisasi dengan warga:** pelanggan tetap kadang mampir dan duduk di bangku depan (maks. 2). Klik warga, tombol biru **NGOBROL**, atau tombol `W`. Tiap kunjungan 2 kesempatan: *Tanya kabar* (+kewarasan, kabar kampung/bocoran hujan), *Traktir kopi*, *Minta saran belanja* (warga ikut mempromosikan satu barang hari itu), *Dengarkan curhat* (+kepercayaan, kadang tip). Kedekatan naik sehingga pelanggan makin sabar dan royal. **Animasi bicara (3D):** saat dialog dibuka, kamera pindah ke depan bangku; teks warga "diketik" bertahap dan mulutnya membuka-menutup selama teks berjalan, kepala mengangguk, satu tangan bergerak; ketuk balon untuk melewati. Pemain bertanya dulu (balon biru "Kamu", mulut penjaga ikut bergerak), jeda singkat, lalu warga menjawab. Ada suara bicara sederhana (blip per huruf; nada rendah untuk kamu, nada khas tiap tokoh). Setelah selesai kamera kembali. Tiap tokoh punya cerita sendiri (`story/chat.js`); cerita yang lebih dalam hanya keluar saat sudah Akrab. Pelanggan di loket juga bicara (mulut, anggukan, blip suara) saat menyampaikan pesanan. Kode: `logic/social.js`, `render/social.js`, `people.js` (`setTalk`).
- **Jalan-jalan & rumah (3D):** tombol kamera **Jalan-jalan** (atau tombol `G` / `4`) membuat penjaga bisa digerakkan: laptop `WASD`/panah (Shift = lari), HP joystick virtual di kiri bawah. Ada tabrakan sederhana dengan meja, dinding, bangku, pohon. Tombol **AKSI** hijau (atau `E`) muncul di dekat sesuatu: kurir (terima kiriman), warga di bangku (ngobrol), **pintu RUMAH** (pulang istirahat), dan meja kasir (kembali). Tombol **Kembali ke meja** selalu ada.
- **Pulang istirahat:** tutup warung sementara (maks. 2×/hari, 1–2 jam game, tidak ada pembeli selama pergi) → kewarasan +22/jam dan **cerita rumah** (13 cerita: telepon ibu, foto ayah, hujan di atap seng, titipan Koh Awi, dll; sebagian bersyarat hujan/malam/utang/kepercayaan). Juga lewat menu Jeda (berlaku di 2D). **Rumah bisa dimasuki** lewat pintu: kasur (istirahat), meja makan, lemari, karpet, lampu bohlam, dan foto lama; dinding depan & atap memudar saat kamu di dalam. Ada 10 cerita rumah khusus per bab (Warisan, Kasbon, Musim Hujan, Tamu Bertudung, Pusat Kampung) yang didahulukan dan hanya sekali dibaca, serta foto lama yang teksnya berubah tiap bab. Kode: `logic/home.js`, `story/home.js`, `render/home.js`.
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

## Cerita & tanggung jawab (tahap A–E)
Rancangan lengkap: `docs/STORY.md`. Yang sudah jalan:
- **Utang ke Koh Awi** Rp 1.200.000, **cicilan tiap 3 hari** (Rp 90 rb di Bab 1, naik tiap bab; dibayar otomatis saat warung tutup bila kas cukup). Menunggak → bunga 5%, kepercayaan turun; 2× berturut-turut → pesanan stok ditahan. Bisa dicicil lebih awal lewat Buku Catatan (*Bayar utang +50rb*). *Mode santai* (menu Jeda) meniadakan cicilan.
- **Kepercayaan warga** (0–100, bar tipis di bawah Reputasi): memengaruhi kesabaran pembeli (±12%) dan peluang kasbon dilunasi (45–85%). Naik dengan jujur & membantu; turun bila menolak, mengecewakan pembeli, atau menunggak.
- **Kejadian harian dengan pilihan**: satu per hari (jam 11–19, saat tidak melayani). Bab 1–2 berurutan (Bang Jaka, kembalian, Koh Awi, Pak Haji; Bu Sri, Rani, Pak Darto, Bang Rizky), sisanya dari kolam acak. Akibat pilihan tampil langsung, dan **kabar lanjutan** datang di pagi hari berikutnya.
- **Rekap malam**: status cicilan, kepercayaan, *Kabar kampung*, dan catatan Pak Haji per bab.
- Bab mengikuti level: 1 (Lv1–2), 2 (Lv3–4), 3 (Lv5–6), 4 (Lv7), 5 (Lv8+). Konten ada di `src/game/story/events.js` (data murni), mesin di `src/game/logic/story.js`.
- **Bab 3 Musim Hujan** (harga naik & menimbun, banjir & titipan warga, utang macet Pak Darto *bila kamu pernah mengutangkan*, turis vs pelanggan tetap, telepon Pak Haji yang berbeda bila utang sudah lunas), **Bab 4 Tamu Bertudung** (tiga kunjungan tengah malam: mantan pegawai Pak Haji menawarkan barang gelap — tolak, ambil, atau laporkan), **Bab 5 Pusat Kampung** (titik paket, lalu pilihan besar: *cabang* / *pusat layanan kampung* / *koperasi warga*, dan kedatangan Pak Haji yang berbeda menurut kepercayaanmu).
- **Epilog** setelah kunjungan akhir Pak Haji: *Warung Kita* (kepercayaan ≥ 60 & utang lunas), *Juragan Untung* (kepercayaan < 45 & kas ≥ Rp 500 rb), atau *Bertahan*; ditambah baris untuk pilihan besar dan sisa utang. Setelah itu permainan lanjut sebagai mode bebas.
- **Kolam kejadian harian**: 20 kejadian acak (pembeli lupa dompet, uang palsu, listrik padam, uang keamanan, anak tersesat, pengajian, lomba kampung, dll.). Tidak berulang dalam 8 kejadian terakhir; ada yang hanya muncul bila kepercayaan tinggi (*warga bergotong royong*) atau rendah (*gosip*), dan keringanan dari Koh Awi bila dipercaya dan utang belum lunas.
- Tes `validasi data cerita` memeriksa semua kejadian (id unik, efek sah, barang sudah terbuka di levelnya, flag nyambung), jadi menambah konten tidak bisa diam-diam salah.
- **Kartu pembuka bab** (premis + tujuan) muncul sekali tiap bab baru, tepat setelah warung dibuka. **Pencapaian** (13, +25 XP; menu Jeda → *Pencapaian*) dicek tiap akhir hari, setelah pilihan cerita, dan saat melunasi utang; kodenya di `src/game/logic/achievements.js`.
- **Suara & animasi**: nada naik/turun saat pilihan menambah/mengurangi kepercayaan, fanfare bab, bunyi pencapaian dan epilog; angka melayang *Percaya +N/−N* di HUD; semua dialog muncul dengan memudar + naik.
- Sintaks data kejadian (`when`, `night`, `group`, `final`, `later`, `req`) dijelaskan di kepala `src/game/story/events.js`.
- XP per level dinaikkan (`xpAt` = 100·(L−1)·L) supaya satu bab bertahan beberapa hari.

## Daftar kasbon & penagihan
Buku Catatan → **Kasbon** (merah bila ada yang jatuh tempo). Kode: `src/game/logic/kasbon.js`.
- **Batas kasbon beredar** = Rp 80.000 + Rp 30.000 × level. Bila kasbon baru melampauinya, tombol *Boleh* ditolak dengan pesan; pembeli tampil dengan keterangan beredar/batas. (Kasbon dari kejadian cerita tidak terkena batas.)
- Tiap catatan bisa ditagih **sekali sehari**: **Tagih** (halus, peluang ±25–55%, membuat pemain sedikit lelah, kepercayaan +0,5 bila berhasil) atau **Keras** (peluang ±60–95%, kepercayaan −1 bila berhasil, −2 dan reputasi −1 bila gagal). Peluang naik menurut umur kasbon dan kepercayaan warga dan ditampilkan di tiap baris.
- **Ikhlaskan** menghapus catatan (kepercayaan +1,5, XP +5). Kasbon yang tidak ditagih tetap bisa dibayar sendiri tiap pagi atau macet setelah 3 hari. Pencapaian baru: *Penagih Santun* (5 tagih halus berhasil).

## Karyawan (Lv 7+)
Buku Catatan → **Karyawan**. Data peran di `src/game/story/regulars.js` (`ROLES`), logika di `src/game/logic/staff.js`.
- **Direkrut dari pelanggan tetap yang sudah Akrab**; kursi: 1 di Level 7, 2 di Level 10. Tokoh yang bekerja tidak lagi datang sebagai pembeli dan tampil sebagai figur di dalam warung 3D.
- **Peran per tokoh**: Bang Jaka → *Kurir* (pesanan 25 menit lebih cepat, kiriman diterima otomatis) · Bu Sri → *Penagih* (tiap pagi menagih kasbon dengan halus, +15%) · Bu Wati → *Penata Gudang* (barang basi tahan 30% lebih lama) · Mas Dimas → *Admin Stok* (tiap pagi memesan stok yang menipis, maks. 30% kas) · Bang Rizky → *Penjaga Warung* (kewarasan turun 35% lebih lambat). Tokoh lain tidak bisa bekerja (sekolah, punya pekerjaan, turis).
- **Gaji harian** Rp 25–40 rb, dibayar saat warung tutup *sebelum* cicilan Koh Awi. Gagal bayar: gaji menumpuk dan kesetiaan −15; kesetiaan ≤ 0 → berhenti (kepercayaan −3). Kesetiaan < 30 → malas (peran tidak aktif). *Bonus* Rp 50 rb menaikkan kesetiaan; *Pecat* menurunkan kedekatan. Pencapaian: *Juragan Beneran*, *Majikan Baik*.

## Umur stok & kulkas
Buku Catatan → **Gudang**. Kode: `src/game/logic/freshness.js`.
- Enam barang **bisa basi** (`shelf` di `src/game/data.js`): kerupuk 8 hari, keripik 10, mie 12→14, cola & minuman energi 12, kopi 18. Barang lain (air mineral, rokok, bensin, gas, galon, beras) tidak basi.
- Stok dicatat per **kelompok** menurut hari tiba; penjualan selalu mengambil yang **tertua dulu**. Tiap pagi, kelompok yang melewati masa simpan **dibuang**: rugi sebesar modalnya, masuk toast pagi dan *Kabar kampung* di rekap. Layar Gudang menampilkan bar kesegaran per barang (merah = ≤ 2 hari), dan Buku Catatan menampilkan "segar N hari".
- **Kulkas** (Lv 4, Rp 300.000, sekali beli) menggandakan masa simpan semua barang yang bisa basi. Pencapaian baru: *Stok Selalu Segar* (7 hari berturut-turut tanpa barang basi). Kelompok stok dan kulkas tersimpan di save.
- Implementasi: stok diubah dari banyak tempat, jadi kelompok diselaraskan ke `G.stock` di titik penting (barang tiba, awal hari, saat dilihat).

## Pelanggan tetap (diingat)
Buku Catatan → **Pelanggan Tetap**. Data tokoh di `src/game/story/regulars.js`, logika di `src/game/logic/regulars.js`.
- **9 tokoh bernama** yang kadang menggantikan pembeli biasa tipenya: Bang Jaka (ojol), Bu Sri & Bu Wati (ibu), Mas Dimas (pemuda), Bang Rizky (cowok), Adik Rani (pelajar), Pak Darto (tukang), Pak Hasan (juragan), Mister Tom (turis). Peluang tampil 34–50% menurut kedekatan, paling banyak sekali sehari, tidak kembar di warung. Pembeli biasa kini bernama generik (*Ibu Warga*, *Pemuda Kampung*, dll.); penampilan 3D tiap tokoh tetap (variasi `look`).
- **Kesukaan**: pesanan condong ke barang favorit tokoh (bobot ×2). **Sapaan** tokoh berubah setelah Akrab.
- **Kedekatan** 0–100 → *Asing / Kenal (25) / Akrab (50) / Sahabat (75)*, tampil sebagai ★ di balon pesanan. Naik +2…+4 tiap layanan sukses (cepat, dapat tip), turun saat pembeli kecewa (−3), barang habis (−1), kasbon ditolak (−2), ditagih keras (−3/−6); naik saat kasbon dikasih (+1) atau diikhlaskan (+3). Beberapa pilihan kejadian cerita juga mengubahnya (mis. Bu Sri, Pak Darto, Bang Rizky).
- **Manfaat per tingkat**: kesabaran +6%, peluang tip +10% dan tip lebih besar; **hadiah sekali** saat pertama jadi Sahabat (stok, uang, reputasi, XP, atau energi, sesuai tokoh). Pencapaian baru: *Sahabat Warung*, *Banyak Teman*.
- Kunjungan, kedekatan, dan status hadiah tersimpan di save (`story.regs`).

## Pembeli baru
Tiga tipe pembeli baru (`TYPES` di `src/game/data.js`, tampilan di `LOOK`/`VARIANTS` pada `src/scene3d/people.js`, semuanya tampil di galeri `#/orang`):
- **Adik Pelajar** (Lv 3, seragam putih-abu + dasi, ransel; variasi berhijab): jajan murah (keripik, air mineral, kerupuk, mie, cola), lebih ramai saat berangkat/pulang sekolah.
- **Pak Tukang** (Lv 5, helm proyek kuning, baju proyek oranye berpita pantul, sarung tangan): rokok, kopi, air mineral, galon; ramai pagi–siang.
- **Turis Bule** (Lv 7, topi lebar, kamera di dada, baju pantai; variasi wanita bergaun kotak): minuman dingin, selalu membayar pecahan Rp 50.000+ dan sering memberi tip besar; ramai siang saat tidak hujan.

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

### Barang baru mudah dikenali
- **Gula** = kantong plastik bening bulat dengan leher terikat dan label biru "GULA"; **sabun** = batang oval merah muda bertumpuk dengan busa.
- Barang yang baru terbuka saat naik level diberi tanda **BARU!** berdenyut sampai pertama kali dimasukkan ke nampan.

## Babak lanjutan: miliarder → wali kota
Setelah epilog Bab 5, menu **JEDA › USAHA & KOTA** terbuka (besok pagi) dan cerita berlanjut ke Bab 6–9:
- **Bab 6 Juragan Usaha:** beli & upgrade Cabang Warung, Toko Grosir, Minimarket, Kontrakan & Ruko (pendapatan masuk tiap pagi). Target kekayaan bersih (kas + 70% nilai aset) Rp 1 miliar (±33 hari dengan strategi bagus, ±37 hari bila santai; diuji di `tests/balance.test.js`). Kejadian: mitra Koh Awi, kredit bank, uang damai pajak.
- **Bab 7 Sang Miliarder:** wawancara majalah, banjir kampung, beasiswa; warga memintamu maju (`diminta_calon`) → tombol **MENCALONKAN DIRI** (butuh kepercayaan ≥ 55).
- **Bab 8 Calon Wali Kota:** kampanye 7 hari lawan Pak Burhan: baliho, safari, sembako, tim sukses, atau *serangan fajar* (kotor, 40% ketahuan, integritas −25); debat & fitnah sebagai kejadian. Hasil: dukungan (kepercayaan, reputasi, kebaikanmu) vs kekuatan lawan. Kalah → simpati +5 dan bisa mencalonkan lagi 5 hari kemudian.
- **Bab 9 Wali Kota:** 30 hari masa jabatan; kas kota (APBD) dari pajak, 9 proyek (jalan, drainase, pasar, sekolah, puskesmas, taman, sampah, kawasan industri, angkot listrik; maks. 2 berjalan), 4 indikator (kesejahteraan, kebersihan, lapangan kerja, kepuasan) + integritas. Opsi **MARK-UP** proyek: +20% ke kantong pribadi, integritas −12, 25% ketahuan. Ending: *Bapak Pembangunan*, *Wali Kota Biasa*, *Terjerat Korupsi*.
- Kode: data di `src/game/story/kota.js`, mesin di `src/game/logic/kota.js`, UI di `src/game/render/kota.js`. Warung tetap bisa dimainkan seperti biasa selama babak ini.
- **Kamera Kota (3D):** tombol **Kota** di bilah kamera (muncul setelah Bab 6) membuka peta kota dari atas, bergaya peta satelit kota baru: danau memanjang di tengah dengan pulau taman, jembatan waduk di utara, jalan melengkung, ribuan rumah beratap merah berbaris di perumahan barat/timur, pusat belanja, dan Balai Kota dengan bundaran di timur. 8 lokasi proyek berubah dari lahan kosong → crane & bangunan naik bertahap → bangunan jadi; jalan berubah dari berlubang menjadi aspal bermarka & berlampu; pohon bertambah bila kota bersih; usaha pribadimu berjajar di sudut barat laut. Kode: `src/scene3d/kota.js`.
- **Kota hidup:** puluhan mobil berwarna-warni berjalan di jalan dua arah (lebih banyak bila jalan diperbaiki dan kesejahteraan naik, termasuk menyeberangi jembatan waduk), dan perahu berlayar di danau serta berbelok menghindari tepi/pulau. Malam hari kota menggelap.
- **Keseimbangan (disimulasikan):** dukungan awal = 12 + 0,3×kepercayaan + 0,12×reputasi + bantuan ke warga; kampanye bersih maksimal +26 (serangan fajar +14 tapi integritas −25). Warga yang biasa-biasa butuh kampanye untuk menang; yang dibenci tetap kalah. Pajak kota 15 jt + 0,45 jt×(kesejahteraan+lapangan kerja)/hari; membangun ±7 proyek terbaik membuat *Bapak Pembangunan* (rata-rata indikator ≥ 58, kepuasan ≥ 60, integritas ≥ 70); tanpa proyek hasilnya *Wali Kota Biasa*; mark-up proyek menurunkan integritas hingga *Terjerat Korupsi*.
- **Rumah lebih detail:** rumah beratap pelana dengan warna dinding/atap bervariasi, pintu, carport, halaman rumput, gang antar baris, apartemen berjendela yang menyala malam hari, dan pusat belanja bergaya modern.

### Perilaku seperti dunia nyata (Bab 9 & usaha)
- **Tender proyek:** tiap proyek dilelang. Penawar: *jujur* (harga pagu, kualitas tinggi), *murah* (kualitas rendah, sering molor), *kroni* dan *usaha milikmu* (mahal, menawarkan fee/komisi ke kantongmu; milik sendiri = konflik kepentingan). Lelang terbuka (e-procurement, Rp 60 jt) menghapus kroni & fee.
- **Uang pelicin & suap:** fee tender, uang percepat izin (−2 hari, 6% harga), "jatah" DPRD, amplop ke auditor, uang tutup mulut ke aktivis. Semuanya menaikkan **Jejak korupsi** dan menurunkan integritas.
- **Pelaksanaan proyek:** molor karena cuaca/material, biaya membengkak (addendum), kualitas menentukan manfaat (50–100%); kualitas <55 bisa **rusak/ambruk** beberapa hari setelah jadi → warga marah, media menyorot, penyelidikan mengendus fee.
- **Pengawasan:** audit BPK hari ke-10 & ke-20 (skor = jejak + sorotan; kooperatif, pengacara, atau sogok): WTP → temuan administrasi → temuan serius (denda 1,5× fee, KPK memanggil) → pidana (**ditangkap KPK** esok pagi). Pelapor/aktivis muncul bila jejak, sorotan, dan ketidakpuasan tinggi. Pilihan KPK: kembalikan fee, praperadilan, atau musnahkan dokumen (makin parah).
- **DPRD:** proyek ≥ Rp 300 jt butuh dukungan dewan ≥ 45; minta jatah proyek, atau jelaskan lelang terbuka, atau tolak. **Demo warga** saat kepuasan < 40, **banjir** bila drainase belum ada, kriminalitas saat lapangan kerja rendah, sidak proyek.
- **Warga & ekonomi:** jumlah pembeli warung & usaha mengikuti kesejahteraan/lapangan kerja kota, saingan baru (minimarket nasional), dan inflasi (indeks harga ikut menaikkan harga grosir & menipiskan margin usaha). Kenaikan BBM bisa ditahan dengan pasar murah.
- **Bisnis:** izin usaha baru tertahan 3 hari (bisa dipercepat dengan uang pelicin atau lewat jalur resmi/lapor inspektorat), manajer bisa menggelapkan setoran. Warung tetap bisa dimainkan; pengaruh kota/harga/saingan langsung terasa di pembeli dan modalnya.
- Tab **AWASI** di menu USAHA & KOTA menampilkan integritas, jejak korupsi, sorotan media, DPRD, indeks harga, program antikorupsi, dan berita.

### Warga lama & Pak Haji (fase wali kota)
- **Warga lama datang ke balai kota:** Bu Sri (jalan gang), Bang Jaka (ojek vs angkot listrik), Rani (kini relawan antikorupsi), Pak Darto (pekerja proyek), Bu Wati (puskesmas). Tiap 3 hari satu dari mereka datang dengan masalah nyata; kamu bisa berjanji (dicatat, ditagih dalam 8 hari), membantu sementara, atau menolak.
- **Suasana hati warga (tab WARGA):** naik bila proyek yang mereka butuhkan selesai, turun bila kamu mengambil fee (Rani −16, yang lain −4), proyek rusak, audit menemukan pelanggaran, atau janji diingkari (−20).
- **Korban fee terlihat:** di tender, penawar kroni menunjukkan "Rp X uang warga = N beasiswa seperti Rani, atau N m jalan gang Bu Sri"; penawar murah menunjukkan siapa yang menanggung bila bangunan rusak.
- **Pak Haji sebagai kompas:** menelepon di hari ke-5, 15, 25 dengan nada sesuai integritas/jejak (bangga, ragu, kecewa), dan mengirim pesan pada malam pertama kamu menerima fee (bisa langsung dikembalikan).
- **Warung sebagai tempat mendengar:** selama jadi wali kota, pembeli di warung (termasuk warga lama) membicarakan kota: jalan bolong, harga naik, gosip mark-up, atau pujian.
- **Penutup per tokoh:** akhir masa jabatan menyebut apakah Pak Haji datang, dan nasib warga yang paling terdampak (Rani menulis skripsi tentang kota bersih… atau bersaksi di sidang).

### Fee yang menggoda (dilema, bukan sekadar pilihan salah)
- **Situasi tender:** bila ada janji ke warga, penawar jujur sedang antre (+3 hari, janji bisa terlewat) sementara kroni menjamin lebih cepat; bila kas kota kurang, hanya kroni yang mau **menalangi** (bayar separuh, sisanya dicicil dari pajak); kadang penawar jujur **mundur** karena harga material naik.
- **Bagi fee ke DPRD:** separuh fee untuk dewan → dukungan DPRD +12, membuka proyek besar.
- **Risiko yang terasa rendah:** tender menampilkan "Risiko ketahuan saat ini: RENDAH · belum ada yang curiga" sebelum fee pertama.
- **Uang jadi berarti:** aturan konflik kepentingan (hari ke-2) — serahkan usaha ke pengelola independen (dividen ditahan sampai akhir jabatan) atau kelola diam-diam lewat saudara; **Pak Haji sakit** (hari ke-12) butuh Rp 120 jt (kantong sendiri, dana taktis kota, atau donasi warga); tombol **BANTU** warga Rp 10 jt dari kantong (suasana hati +8) — uang fee bisa dipakai untuk menolong orang.

### Alur masa jabatan & Bab 10 · Periode Kedua
- **Periode pertama (bertanggal):** hari 6 Pak Burhan (kalah pemilu, kini pemimpin fraksi DPRD) menawarkan "saling bantu"; hari 9 Koh Awi minta izin hipermarket (pajak besar vs warung kecil termasuk warungmu); hari 16 Pak Burhan membawa tas berisi Rp 200 jt (60% ternyata jebakan kamera); hari 18 Rani minta magang di bagian pengadaan (lalu setiap fee langsung terlihat olehnya) — atau, bila ia sudah kecewa, memimpin demo; hari 22 surat Pak Haji (hangat atau meminta kamu datang mengaku); hari 27 Pak Burhan mengumumkan akan maju lagi.
- **Akhir periode pertama:** pilih **MAJU PERIODE KEDUA** (kampanye 7 hari; dukungan dinilai dari indikator kota, suasana hati warga lama, restu Pak Haji, dan jejak korupsi) atau **CUKUP SATU PERIODE**.
- **Periode kedua (Bab 10):** kota yang sama berlanjut (hari 1 lagi, +Rp 150 jt kas), proyek besar baru: **Rusun Warga, RSUD Kota, Terminal Terpadu** (juga muncul di peta 3D). Hari 2 pelantikan sederhana; hari 8 hak angket/pansus DPRD (kooperatif = audit, lobi, atau mangkir); hari 15 Rani datang sebagai penyidik (bila jejak tinggi) atau mitra pencegahan korupsi; hari 23 Pak Haji pamit di bangku teras dan bertanya nasib warung (Rizky, koperasi warga, atau kamu sendiri); hari 28 memilih penerus (Rani, Pak Burhan, atau netral).
- **Penutup WARISAN:** ringkasan dua periode, penerus, nasib warung lama, Pak Haji, dan warga — atau "Kembali ke Warung" bila kalah, "Cukup Satu Periode", dan "Akhir yang Pahit" bila ditangkap.

### Mode "Mulai dari Bab 9"
Tombol **MULAI DARI BAB 9 (WALI KOTA)** di layar judul langsung membawamu ke pelantikan wali kota, tanpa ±70 hari permainan: level 10, utang lunas, kepercayaan 72, kas Rp 1,2 M, Cabang Lv 3 · Grosir Lv 2 · Minimarket Lv 1, menang pemilu 62%, warga lama cukup dekat. Kartu Bab 9 dan kejadian pelantikan muncul seperti biasa; warung tetap bisa dimainkan. Bila ada simpanan, tombol perlu diklik dua kali (simpanan lama tertimpa). Kode: `src/game/logic/shortcut.js`.
