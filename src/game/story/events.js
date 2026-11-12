/* ============================================================
   DATA CERITA (data murni — mesinnya ada di logic/story.js)
   Efek (fx): money, trust, rep, energy, xp, stock {id: ±n}, flag, debt (±), dueShift (hari), kasbon {who, amount}
   later: [{ days, text, fx, chance?, elseText?, elseFx? }] — kabar lanjutan di pagi hari berikutnya
   req: { money, stock } — pilihan dinonaktifkan bila tidak terpenuhi
   Kejadian: when { lunas, flag, noFlag, trustMin, trustMax } = syarat tampil; night = muncul tengah malam;
             group + final = hanya satu dari grup yang tampil; final menutup cerita (epilog).
   ============================================================ */

export const CHAPTERS = ['Warisan', 'Kasbon', 'Musim Hujan', 'Tamu Bertudung', 'Pusat Kampung'];
/** Catatan Pak Haji di rekap malam, per bab. */
export const CATATAN = [
  '"Warung itu amanah, Nak. Bukan cuma tempat jualan."',
  '"Utang dicatat di buku, kebaikan dicatat di hati orang."',
  '"Hujan datang, hujan pergi. Warga yang ingat siapa yang menolong."',
  '"Tidak semua yang datang malam itu jahat. Dengarkan dulu."',
  '"Warung yang besar itu yang dicari orang, bukan yang paling untung."',
];

/** Kejadian bab: dimainkan berurutan, satu per hari, mulai dari bab yang sedang berjalan. */
export const SCRIPT = [
  { id: 'jaka_kopi', ch: 1, who: 'Bang Jaka', text: 'Bang Jaka mampir sebelum narik. "Kopi satu ya, Nak. Dompet saya ketinggalan di rumah, besok saya ganti."', choices: [
    { t: 'Kasih saja, gratis', fx: { trust: 3, stock: { kopi: -1 }, xp: 5 }, res: 'Bang Jaka tersenyum lebar. "Kamu mirip Pak Haji."' },
    { t: 'Catat kasbon Rp 2.000', fx: { kasbon: { who: 'Bang Jaka', amount: 2000 }, trust: 1, stock: { kopi: -1 } }, res: '"Siap, besok saya bayar." Dicatat di buku.' },
    { t: '"Bayar dulu ya, Bang."', fx: { trust: -2 }, res: 'Bang Jaka menghela napas dan pergi tanpa kopi.' },
  ] },
  { id: 'kembalian', ch: 1, who: 'Hati nurani', text: 'Kamu baru sadar: pembeli tadi menerima kembalian kurang Rp 5.000 dan tidak protes. Orangnya sudah berjalan ke ujung gang.', choices: [
    { t: 'Kejar dan beri kekurangannya', fx: { money: -5000, trust: 4 }, res: 'Ia kaget, lalu tertawa. "Jujur banget, Nak!" Cerita ini cepat menyebar di gang.', req: { money: 5000 } },
    { t: 'Biarkan, dia tidak sadar', fx: { trust: -2 }, res: 'Uangnya aman... tapi rasanya tidak enak.' },
    { t: 'Catat, ganti kalau dia datang lagi', fx: { trust: 1 }, res: 'Kamu mencatatnya di buku. Janji harus ditepati.',
      later: [{ days: 2, text: 'Orang itu mampir lagi. Kekurangan Rp 5.000 kamu ganti, dan ia ikut beli kopi.', fx: { money: -5000, trust: 2, xp: 10 } }] },
  ] },
  { id: 'koh_awi', ch: 1, who: 'Koh Awi (telepon)', text: '"Halo, ini Awi, grosir. Cicilan pertamamu jatuh tempo hari ke-4: Rp 90.000. Saya percaya sama Pak Haji, tapi uang tetap uang."', choices: [
    { t: '"Siap, Koh. Saya pasti bayar."', fx: { trust: 1 }, res: '"Bagus. Saya suka orang yang tidak banyak janji."' },
    { t: '"Boleh minta tempo sehari?"', fx: { dueShift: 1, debt: 24000 }, res: '"Boleh. Tapi ada tambahan Rp 24.000, ya."' },
  ] },
  { id: 'haji_telp', ch: 1, who: 'Pak Haji (telepon)', text: 'Suara Pak Haji lemah tapi hangat. "Nak, jangan hitung untung rugi saja. Hitung juga siapa yang tersenyum waktu pulang dari warungmu."', choices: [
    { t: '"Saya janji, Pak."', fx: { trust: 2, xp: 20 }, res: '"Cukup. Teruskan."' },
    { t: '"Pak, saya capek..."', fx: { energy: 20 }, res: '"Istirahatlah. Capek itu tanda kau bersungguh-sungguh."' },
  ] },
  { id: 'busri_kasbon', ch: 2, who: 'Bu Sri', text: 'Bu Sri datang dengan wajah pucat. "Dek, Rani demam dari semalam. Ibu belum pegang uang. Boleh kasbon obat dan beras Rp 60.000?"', choices: [
    { t: 'Beri penuh, Bu', fx: { kasbon: { who: 'Bu Sri', amount: 60000 }, trust: 4 }, res: 'Bu Sri menggenggam tanganmu. "Semoga warungmu laris, Dek."',
      later: [{ days: 2, text: 'Rani sudah sembuh. Bu Sri datang membawa kue dan membayar sebagian kasbon.', fx: { money: 20000, trust: 2 } }] },
    { t: 'Beri separuh (Rp 30.000)', fx: { kasbon: { who: 'Bu Sri', amount: 30000 }, trust: 2 }, res: '"Terima kasih, Dek. Sebagian ini sudah sangat membantu."' },
    { t: '"Maaf, Bu, belum bisa."', fx: { trust: -3 }, res: 'Bu Sri mengangguk pelan, lalu pulang. Gang terasa sunyi sebentar.' },
  ] },
  { id: 'rani_kurang', ch: 2, who: 'Adik Rani', text: 'Rani membeli jajan Rp 6.000, tapi uangnya cuma Rp 5.000. "Kak, besok saya tambahin ya..."', choices: [
    { t: 'Relakan kekurangannya', fx: { trust: 3 }, res: 'Rani berseri-seri. "Makasih, Kak!"' },
    { t: 'Minta dilunasi besok', fx: {}, res: 'Rani mengangguk serius. "Pasti, Kak!"', later: [{ days: 1, text: 'Rani datang dengan bangga membawa Rp 1.000.', fx: { money: 1000, trust: 1 } }] },
  ] },
  { id: 'darto_pesan', ch: 2, who: 'Pak Darto', text: 'Pak Darto memesan 12 air mineral dan 8 mie cup untuk pekerja proyek (Rp 88.000). "Bayarnya akhir minggu ya, Dek. Proyek lagi seret."', choices: [
    { t: 'Terima, bayar akhir minggu', fx: { stock: { aqua: -12, mie: -8 }, trust: 1, flag: 'darto_utang' }, res: 'Pak Darto menepuk pundakmu. "Nanti saya ingat, Dek."', req: { stock: { aqua: 12, mie: 8 } },
      later: [{ days: 3, chance: .7, text: 'Pak Darto melunasi tepat waktu dan menambah pesanan.', fx: { money: 88000, trust: 2 }, elseText: 'Pak Darto minta tunggu seminggu lagi. Kamu menahan napas.', elseFx: { trust: -1 } }] },
    { t: 'Minta uang muka separuh', fx: { stock: { aqua: -12, mie: -8 }, money: 44000 }, res: 'Pak Darto setuju. "Adil, Dek."', req: { stock: { aqua: 12, mie: 8 } },
      later: [{ days: 3, text: 'Pak Darto melunasi sisanya.', fx: { money: 44000, trust: 1 } }] },
    { t: 'Tolak, hanya tunai', fx: { trust: -1 }, res: 'Pak Darto mengangkat bahu dan membeli di warung seberang.' },
  ] },
  { id: 'rizky_kasbon', ch: 2, who: 'Bang Rizky', text: 'Bang Rizky minta kasbon rokok, matanya menghindar. "Cuma sampai gajian, Bang."', choices: [
    { t: 'Beri 5 batang (kasbon Rp 10.000)', fx: { kasbon: { who: 'Bang Rizky', amount: 10000 }, stock: { rokok: -5 } }, res: '"Makasih, Bang." Ia cepat-cepat pergi.' },
    { t: 'Ajak ngobrol dulu', fx: { energy: -5, trust: 3 }, res: 'Ternyata ia baru kehilangan pekerjaan. Kamu menyarankan melamar di proyek Pak Darto.',
      later: [{ days: 4, text: 'Rizky kini bekerja di proyek Pak Darto dan mampir membayar utang rokoknya.', fx: { money: 10000, trust: 2 } }] },
    { t: 'Tolak halus', fx: { trust: -1 }, res: '"Oh... iya, Bang." Ia pergi tanpa menoleh.' },
  ] },

  /* ---------------- Bab 3 — Musim Hujan ---------------- */
  { id: 'hujan_harga', ch: 3, who: 'Koh Awi (telepon)', text: '"Hujan dua hari, kurir telat, harga gas dan galon di grosir naik. Saya tidak bisa bantu banyak. Warung-warung lain mulai menaikkan harga jual, kau mau ikut?"', choices: [
    { t: 'Tahan harga, kasihan warga', fx: { money: -30000, trust: 3 }, res: 'Keuntunganmu menipis, tapi warga mengingat siapa yang tidak mencekik mereka.' },
    { t: 'Naikkan sedikit', fx: { money: 20000, trust: -2 }, res: 'Cukup untuk menutup selisih. Ada yang mengeluh, ada yang maklum.' },
    { t: 'Timbun stok, jual saat langka', fx: { money: 40000, trust: -5, flag: 'menimbun' }, res: 'Rak di belakang penuh. Kamu menutupinya dengan kain.',
      later: [{ days: 2, chance: .5, text: 'Warga tahu kamu menimbun. Orang-orang mulai membeli di warung seberang.', fx: { trust: -5, rep: -5 } }] },
  ] },
  { id: 'banjir_titip', ch: 3, who: 'Pak RT', text: 'Air masuk ke rumah-rumah di gang bawah. Pak RT datang, basah kuyup. "Dek, boleh warga menitip barang di warungmu sampai air surut? Lantai warungmu lebih tinggi."', choices: [
    { t: 'Boleh, silakan', fx: { energy: -10, trust: 4, xp: 20 }, res: 'Sebagian rak berubah jadi gudang darurat. Repot, tapi gang jadi saling bantu.',
      later: [{ days: 2, text: 'Warga menitipkan kue-kue sebagai ucapan terima kasih.', fx: { energy: 10, trust: 2 } }] },
    { t: 'Maaf, warung juga kebanjiran', fx: { trust: -2 }, res: 'Pak RT mengangguk. "Tidak apa-apa, Dek."' },
  ] },
  { id: 'darto_macet', ch: 3, when: { flag: 'darto_utang' }, who: 'Pak Darto', text: 'Pak Darto datang dengan topi di tangan. "Dek, proyek dibatalkan karena hujan. Utang Rp 88.000 itu belum bisa saya bayar... maaf sekali."', choices: [
    { t: 'Ikhlaskan, semoga dapat proyek lagi', fx: { trust: 4 }, res: 'Matanya berkaca-kaca. "Saya tidak akan lupa, Dek."', later: [{ days: 5, text: 'Pak Darto dapat proyek baru dan membayar utangnya penuh, plus uang kopi.', fx: { money: 95000, trust: 2 } }] },
    { t: 'Beri tempo dua minggu', fx: {}, res: '"Terima kasih, Dek. Dua minggu, saya janji."', later: [{ days: 6, chance: .6, text: 'Pak Darto melunasi tepat waktu.', fx: { money: 88000, trust: 1 }, elseText: 'Pak Darto minta waktu lagi. Kamu menghela napas.', elseFx: {} }] },
    { t: 'Tagih sekarang', fx: { trust: -4 }, res: 'Ia membayar separuh dari tabungan terakhir. Suasana jadi dingin.', req: {}, later: [{ days: 0, text: 'Pak Darto membayar Rp 44.000 dengan wajah murung.', fx: { money: 44000 } }] },
  ] },
  { id: 'turis_hujan', ch: 3, who: 'Mister Tom', text: 'Hujan deras. Mister Tom dan teman-temannya berteduh di teras dan ingin membeli banyak minuman. Di dalam, Bu Sri dan pelanggan tetap sudah menunggu cukup lama.', choices: [
    { t: 'Layani turis dulu (uang besar)', fx: { money: 60000, trust: -2 }, res: 'Mereka senang dan memberi tip. Pelanggan tetap mengerutkan kening.' },
    { t: 'Pelanggan tetap dulu', fx: { money: 10000, trust: 3 }, res: 'Bu Sri tersenyum. Mister Tom menunggu sambil memotret hujan.' },
    { t: 'Bagi dua, layani cepat', fx: { money: 35000, energy: -10, trust: 1 }, res: 'Kamu kewalahan, tapi semua puas. Mister Tom memuji: "Very fast!"' },
  ] },
  { id: 'haji_hujan_lunas', ch: 3, group: 'haji3', when: { lunas: true }, who: 'Pak Haji (telepon)', text: 'Suara Pak Haji lebih kuat dari biasanya. "Koh Awi cerita utangmu lunas. Aku bangga, Nak. Sekarang uangmu milikmu, dan tanggung jawabmu untuk warga."', choices: [
    { t: '"Terima kasih, Pak. Saya masih belajar."', fx: { trust: 3, xp: 40 }, res: '"Belajar itu tidak ada habisnya. Teruskan."' },
  ] },
  { id: 'haji_hujan_belum', ch: 3, group: 'haji3', when: { lunas: false }, who: 'Pak Haji (telepon)', text: 'Pak Haji menelepon di tengah hujan. "Cicilan jalan terus, Nak? Tidak apa-apa pelan-pelan. Yang penting kau tidak kabur dari janji."', choices: [
    { t: '"Saya janji, Pak. Pelan tapi pasti."', fx: { trust: 2, xp: 30 }, res: '"Itu cukup untukku."' },
    { t: '"Rasanya berat, Pak..."', fx: { energy: 15 }, res: '"Berat itu wajar. Tidurlah dulu."' },
  ] },

  /* ---------------- Bab 4 — Tamu Bertudung (tengah malam) ---------------- */
  { id: 'tamu_1', ch: 4, night: true, who: 'Tamu bertudung', text: 'Tengah malam. Sosok bertudung berdiri lama di depan warung sebelum masuk. Suaranya pelan. "Saya cuma butuh air dan tempat duduk sebentar. Tidak akan lama."', choices: [
    { t: 'Persilakan duduk, beri air', fx: { stock: { aqua: -1 }, trust: 2, flag: 'tamu_ramah' }, res: 'Tangannya gemetar saat menerima gelas. "Terima kasih. Sudah lama tidak ada yang bersikap begini."' },
    { t: 'Layani seperti pembeli biasa', fx: {}, res: 'Ia membayar pas, lalu duduk di sudut tanpa bicara.' },
    { t: 'Curiga, tanya macam-macam', fx: { trust: -1, flag: 'tamu_curiga' }, res: 'Ia menunduk makin dalam. "Maaf mengganggu," lalu pergi.' },
  ] },
  { id: 'tamu_2', ch: 4, night: true, who: 'Tamu bertudung', text: 'Sosok itu kembali. Kali ini tudungnya dibuka. "Dulu saya bekerja di warung ini untuk Pak Haji. Saya pernah salah besar. Saya hanya ingin melihat tempat ini lagi."', choices: [
    { t: 'Dengarkan ceritanya', fx: { energy: -10, trust: 2, flag: 'tamu_cerita' }, res: 'Ia pernah mengambil uang kas saat ibunya sakit, lalu dipecat. Bertahun-tahun ia menyesal.' },
    { t: 'Telepon Pak Haji', fx: { xp: 10, flag: 'tamu_telpon' }, res: 'Pak Haji menjawab pelan: "Biarkan dia bicara. Aku sudah lama memaafkannya."' },
    { t: 'Minta ia pergi', fx: { trust: -2, flag: 'tamu_usir' }, res: 'Ia mengangguk tanpa membela diri, lalu hilang di ujung gang.' },
  ] },
  { id: 'tamu_3', ch: 4, night: true, who: 'Tamu bertudung', text: 'Ia berbisik. "Saya punya relasi: rokok murah tanpa cukai dan barang sisa ekspor. Untungmu dua kali lipat, kau tidak perlu tahu asalnya. Anggap ini cara saya membalas budi."', choices: [
    { t: 'Tolak tegas, tawarkan kerja jujur', fx: { trust: 4, xp: 30, flag: 'tamu_jujur' }, res: '"Kau mirip Pak Haji," katanya lirih, hampir tersenyum.',
      later: [{ days: 2, text: 'Tamu itu kembali dan membantu menyapu teras serta menata rak tanpa diminta.', fx: { energy: 15, trust: 2 } }] },
    { t: 'Ambil tawarannya', fx: { money: 150000, trust: -8, flag: 'tamu_gelap' }, res: 'Dus-dus tanpa merek menumpuk di belakang. Kamu berusaha tidak memikirkannya.',
      later: [{ days: 2, chance: .6, text: 'Petugas datang menanyakan asal barang. Kamu terpaksa membuang sebagian dan membayar denda.', fx: { money: -60000, trust: -5, rep: -10 } }] },
    { t: 'Laporkan ke RT', fx: { trust: -1, xp: 10, flag: 'tamu_lapor' }, res: 'Pak RT berterima kasih. Tamu itu tidak pernah kembali, dan kamu tidak yakin itu langkah yang benar.' },
  ] },

  /* ---------------- Bab 5 — Pusat Kampung ---------------- */
  { id: 'rt_titik', ch: 5, who: 'Pak RT', text: 'Pak RT datang membawa tumpukan paket warga. "Dek, kurir sering salah alamat. Bolehkah warungmu jadi titik ambil paket kampung?"', choices: [
    { t: 'Boleh, saya jagakan', fx: { energy: -10, trust: 4, flag: 'titik_paket' }, res: 'Rak belakang berubah jadi gudang kecil.', later: [{ days: 1, text: 'Paket mulai menumpuk. Banyak warga yang mampir sambil membeli minum.', fx: { money: 20000, rep: 3 } }] },
    { t: 'Maaf, ruangan sempit', fx: { trust: -1 }, res: 'Pak RT mencari tempat lain.' },
  ] },
  { id: 'pilihan_besar', ch: 5, who: 'Mas Dimas', text: 'Mas Dimas datang membawa catatan. "Warungmu sudah dikenal. Ada tiga jalan: buka cabang di jalan besar, jadikan warung ini pusat layanan kampung, atau serahkan ke koperasi supaya semua warga ikut memiliki. Semuanya ada harganya."', choices: [
    { t: 'Buka cabang di jalan besar (Rp 250.000)', fx: { money: -250000, xp: 50, flag: 'cabang' }, res: 'Cabang berdiri. Papan nama baru, wajah-wajah asing, dan kamu mulai jarang di warung lama.', req: { money: 250000 },
      later: [{ days: 3, text: 'Cabang ramai. Uang masuk, tapi pelanggan lama bertanya mengapa kamu jarang terlihat.', fx: { money: 200000, trust: -3 } }] },
    { t: 'Jadi pusat layanan kampung', fx: { trust: 6, xp: 60, flag: 'layanan' }, res: 'Pulsa, token listrik, dan titip paket resmi dilayani. Warga datang walau tidak belanja.',
      later: [{ days: 2, text: 'Antrean pelayanan tiap pagi membuat warung jadi tempat bertemu.', fx: { money: 15000, trust: 2, rep: 5 } }] },
    { t: 'Serahkan ke koperasi warga (Rp 100.000)', fx: { money: -100000, trust: 10, xp: 40, flag: 'koperasi' }, res: 'Warga mendirikan koperasi. Kamu tetap penjaga, tapi warung kini milik bersama.', req: { money: 100000 } },
  ] },
  { id: 'haji_akhir_tinggi', ch: 5, group: 'akhir', final: true, when: { trustMin: 60 }, who: 'Pak Haji', text: 'Pak Haji datang langsung, berjalan pelan dengan tongkat. Warga di gang menyapanya satu per satu. Ia duduk di bangku teras. "Nak, aku tidak perlu bertanya apa-apa. Aku sudah dengar dari mereka."', choices: [
    { t: 'Menyambutnya di teras', fx: { xp: 100 }, res: 'Kalian duduk berdampingan sambil melihat gang yang ramai.' },
  ] },
  { id: 'haji_akhir_biasa', ch: 5, group: 'akhir', final: true, when: { trustMin: 40, trustMax: 59.99 }, who: 'Pak Haji', text: 'Pak Haji datang, melihat-lihat rak, mengangguk-angguk. "Tidak buruk, Nak. Ada yang bagus, ada yang bisa lebih baik. Warung ini masih punya jalan panjang."', choices: [
    { t: 'Menerima nasihatnya', fx: { xp: 80 }, res: 'Ia menepuk pundakmu seperti dulu.' },
  ] },
  { id: 'haji_akhir_rendah', ch: 5, group: 'akhir', final: true, when: { trustMax: 39.99 }, who: 'Pak Haji', text: 'Pak Haji datang. Tidak ada yang menyapanya di gang. Ia menatap pembukuanmu lama sekali. "Angkanya bagus, Nak. Aku hanya tidak yakin siapa yang tersenyum di dalamnya."', choices: [
    { t: 'Menunduk dan mendengarkan', fx: { xp: 60 }, res: 'Kamu tidak bisa membantah. Ia benar.' },
  ] },
];

/** Kolam kejadian acak untuk hari tanpa kejadian bab. minLevel = level minimal. */
export const POOL = [
  { id: 'anak_rokok', minLevel: 1, who: 'Anak kecil', text: 'Seorang anak sekitar sepuluh tahun meminta sebungkus rokok. "Buat bapak, Kak."', choices: [
    { t: 'Layani saja', fx: { money: 2000, stock: { rokok: -1 }, trust: -3 }, res: 'Rokok pergi bersama si anak. Rasanya ganjil.' },
    { t: 'Tolak sopan, tawarkan permen', fx: { trust: 3 }, res: 'Ia pulang membawa permen. Besok bapaknya datang sendiri.' },
  ] },
  { id: 'kedaluwarsa', minLevel: 1, who: 'Stok warung', text: 'Kamu menemukan 5 mie cup yang kedaluwarsa tiga hari lalu.', choices: [
    { t: 'Buang semuanya', fx: { stock: { mie: -5 }, trust: 2 }, res: 'Rugi, tapi hati tenang.' },
    { t: 'Jual murah, bilang jujur', fx: { stock: { mie: -5 }, money: 10000, trust: 1 }, res: 'Beberapa orang menolak, beberapa mengambilnya untuk pakan ternak.' },
    { t: 'Jual seperti biasa', fx: { stock: { mie: -5 }, money: 25000, trust: -2 }, res: 'Uang masuk. Semoga tidak ada yang sakit.',
      later: [{ days: 1, chance: .5, text: 'Seorang pembeli sakit perut dan bercerita ke tetangga. Warga mulai bergunjing.', fx: { trust: -5, rep: -5 } }] },
  ] },
  { id: 'lupa_dompet', minLevel: 1, who: 'Pembeli', text: 'Seorang pembeli memilih belanjaan Rp 15.000, lalu panik: dompetnya tertinggal.', choices: [
    { t: 'Catat kasbon', fx: { kasbon: { who: 'Pembeli lupa dompet', amount: 15000 }, trust: 2 }, res: '"Terima kasih, besok saya bayar!"' },
    { t: '"Ambil dulu, Pak."', fx: { trust: -1 }, res: 'Ia pergi dan tidak kembali hari itu.' },
  ] },
  { id: 'tawar_keras', minLevel: 1, who: 'Pembeli', text: 'Seorang pembeli menawar: "Kopi 10 sachet Rp 15.000 ya?" (harga normal Rp 20.000)', choices: [
    { t: 'Boleh, Rp 15.000', fx: { stock: { kopi: -10 }, money: 15000, trust: 1 }, res: 'Ia senang dan berjanji kembali.', req: { stock: { kopi: 10 } } },
    { t: 'Rp 17.000 saja', fx: { stock: { kopi: -10 }, money: 17000 }, res: 'Setelah tawar-menawar, deal.', req: { stock: { kopi: 10 } } },
    { t: 'Harga pas, tidak bisa', fx: {}, res: 'Ia mengangguk dan pergi.' },
  ] },
  { id: 'titip_listrik', minLevel: 2, who: 'Tetangga', text: 'Seorang tetangga menitipkan uang Rp 100.000 untuk dibelikan token listrik. "Jasanya Rp 3.000 ya."', choices: [
    { t: 'Terima, antar ke agen', fx: { money: 3000, energy: -5, trust: 2 }, res: 'Repot sedikit, tapi ia lega.' },
    { t: 'Tolak, bukan urusan warung', fx: {}, res: 'Ia mencari agen lain.' },
  ] },
  { id: 'kucing_sakit', minLevel: 2, who: 'Kucing warung', text: 'Kucing warung lemas dan tidak mau makan. Obat dari klinik hewan Rp 25.000.', choices: [
    { t: 'Beli obat', fx: { money: -25000, trust: 2 }, res: 'Kucing diminumi obat dan tertidur.', req: { money: 25000 },
      later: [{ days: 2, text: 'Kucing sembuh dan kembali menjaga teras. Pembeli senang melihatnya.', fx: { trust: 1, rep: 3 } }] },
    { t: 'Biarkan, nanti juga sembuh', fx: { trust: -1 }, res: 'Kamu berharap yang terbaik.' },
  ] },

  { id: 'promo_dimas', minLevel: 2, who: 'Mas Dimas', text: '"Bang, saya bikinkan poster promo di HP, gratis. Kirim ke grup RT. Tapi Abang harus siap kalau jadi ramai."', choices: [
    { t: 'Coba, pasang di grup RT', fx: { energy: -10, rep: 5, xp: 15 }, res: 'Poster beredar di grup RT. Besok mungkin lebih ramai.',
      later: [{ days: 1, text: 'Poster Mas Dimas dibagikan banyak orang. Warung ramai sejak pagi.', fx: { rep: 5, money: 20000 } }] },
    { t: 'Terima kasih, nanti saja', fx: {}, res: 'Mas Dimas mengangkat bahu. "Siap, Bang."' },
  ] },
  { id: 'uang_palsu', minLevel: 2, who: 'Pembeli', text: 'Seorang pembeli membayar dengan uang Rp 50.000 yang terasa aneh: kertasnya terlalu licin dan warnanya pudar.', choices: [
    { t: 'Terima saja, tidak enak menolak', fx: { money: -30000 }, res: 'Keesokan harinya terbukti palsu. Kamu menelan rugi.' },
    { t: 'Periksa teliti, minta diganti', fx: { energy: -5, trust: 1 }, res: 'Ia kaget lalu menggantinya dengan uang asli. Mungkin ia memang tidak tahu.' },
    { t: 'Tolak dan peringatkan warga', fx: { trust: -1, rep: 2 }, res: 'Kabar uang palsu menyebar dan warga lebih waspada, walau ia tersinggung.' },
  ] },
  { id: 'jaka_bensin', minLevel: 3, who: 'Bang Jaka', text: 'Bang Jaka mendorong motornya yang mogok. "Dompet saya kosong, Nak. Bensin satu botol Rp 12.000, boleh kasbon?"', choices: [
    { t: 'Beri kasbon bensin', fx: { kasbon: { who: 'Bang Jaka', amount: 12000 }, stock: { bensin: -1 }, trust: 3 }, res: 'Bang Jaka menyalami tanganmu erat. "Utang budi, Nak."', req: { stock: { bensin: 1 } } },
    { t: '"Maaf, Bang, bayar dulu."', fx: { trust: -2 }, res: 'Bang Jaka mendorong motornya ke bengkel dengan wajah lelah.' },
  ] },
  { id: 'mati_lampu', minLevel: 1, who: 'Warung', text: 'Listrik padam tiba-tiba. Warung gelap gulita. Dari luar, suara anak-anak ribut senang karena gelap.', choices: [
    { t: 'Nyalakan lilin, lanjut jualan', fx: { energy: -5, trust: 1, rep: 2 }, res: 'Cahaya lilin membuat warung hangat. Beberapa warga malah ikut nongkrong.' },
    { t: 'Tutup dulu, istirahat', fx: { energy: 10, rep: -2 }, res: 'Kamu duduk di teras sambil menunggu listrik menyala.' },
  ] },
  { id: 'tetangga_ribut', minLevel: 1, who: 'Tetangga', text: 'Dua tetangga bertengkar soal parkir di depan warung. Suara makin keras dan beberapa pembeli menjauh.', choices: [
    { t: 'Tengahi mereka', fx: { energy: -10, trust: 3 }, res: 'Setelah bicara baik-baik, mereka bersalaman. Ternyata cuma salah paham.' },
    { t: 'Abaikan saja', fx: {}, res: 'Akhirnya mereka pergi sendiri-sendiri.' },
    { t: 'Tawarkan minuman dingin ke keduanya', fx: { money: 8000, trust: -1 }, res: 'Kamu untung, tapi ada rasa kurang pantas.' },
  ] },
  { id: 'ganti_rugi', minLevel: 2, who: 'Pelanggan', text: 'Seorang pelanggan menggerutu: "Kemarin saya hampir telat kerja gara-gara antreanmu lama!"', choices: [
    { t: 'Minta maaf, beri kopi gratis', fx: { stock: { kopi: -1 }, trust: 2 }, res: 'Ia luluh. "Ya sudah, lain kali dipercepat ya."', req: { stock: { kopi: 1 } } },
    { t: 'Minta maaf saja', fx: { trust: 1 }, res: 'Ia mengangguk, masih sedikit kesal.' },
    { t: '"Itu bukan salah warung."', fx: { trust: -2, rep: -2 }, res: 'Ia pergi sambil menggeleng. Beberapa orang melihat.' },
  ] },
  { id: 'pengajian', minLevel: 2, who: 'Panitia pengajian', text: 'Panitia pengajian memesan konsumsi untuk besok malam: 12 air mineral dan 10 kerupuk, total Rp 58.000.', choices: [
    { t: 'Terima, harga biasa', fx: { stock: { aqua: -12, kerupuk: -10 }, money: 58000, trust: 2, xp: 20 }, res: 'Pesanan dikemas rapi dan diantar. Panitia berterima kasih.', req: { stock: { aqua: 12, kerupuk: 10 } } },
    { t: 'Beri harga khusus (Rp 45.000)', fx: { stock: { aqua: -12, kerupuk: -10 }, money: 45000, trust: 4 }, res: '"Semoga berkah warungnya," kata ketua panitia.', req: { stock: { aqua: 12, kerupuk: 10 } } },
    { t: 'Tolak, stok terbatas', fx: {}, res: 'Panitia mencari warung lain.' },
  ] },
  { id: 'uang_keamanan', minLevel: 3, who: 'Orang tak dikenal', text: 'Seseorang yang mengaku petugas meminta "uang keamanan" Rp 30.000 sebulan. Tidak ada surat tugas, hanya nada yang tidak enak.', choices: [
    { t: 'Bayar supaya aman', fx: { money: -30000 }, res: 'Ia pergi puas. Kamu tidak yakin ini yang terakhir.',
      later: [{ days: 5, chance: .7, text: 'Orang yang sama kembali dan meminta lagi.', fx: { money: -30000 } }] },
    { t: 'Tolak, minta surat tugas', fx: { trust: 2 }, res: 'Ia menggerutu lalu pergi. Warga yang melihat mengangguk setuju.' },
    { t: 'Tanya Pak RT dulu', fx: { energy: -5, trust: 1, xp: 10 }, res: 'Pak RT: "Itu bukan petugas resmi." Ia langsung melapor.' },
  ] },
  { id: 'tukar_rusak', minLevel: 1, who: 'Pembeli', text: 'Seorang pembeli mengembalikan 3 mie cup yang kemasannya sobek. "Ini sudah rusak waktu saya beli kemarin."', choices: [
    { t: 'Tukar dengan yang baru', fx: { stock: { mie: -3 }, trust: 2 }, res: 'Ia puas. Kamu rugi sedikit, tapi ia janji kembali.', req: { stock: { mie: 3 } } },
    { t: 'Ganti uang Rp 15.000', fx: { money: -15000, trust: 2 }, res: 'Ia menerima dengan senang hati.', req: { money: 15000 } },
    { t: 'Tolak, bukan salah warung', fx: { trust: -2 }, res: 'Ia pergi sambil bergumam.' },
  ] },
  { id: 'anak_tersesat', minLevel: 1, who: 'Anak kecil', text: 'Seorang anak kecil menangis di depan warung. Ia tersesat dan tidak tahu jalan pulang.', choices: [
    { t: 'Temani dan cari orang tuanya', fx: { energy: -10, trust: 4, xp: 20 }, res: 'Setelah bertanya ke beberapa warga, ibunya ketemu. Ia memeluk anaknya sambil menangis lega.' },
    { t: 'Panggil Pak RT', fx: { trust: 2 }, res: 'Pak RT datang cepat dan mengurus semuanya.' },
  ] },
  { id: 'lomba_17', minLevel: 4, who: 'Panitia lomba', text: 'Panitia lomba kampung meminta sumbangan hadiah. "Dek, boleh sumbang 5 mie cup?"', choices: [
    { t: 'Sumbang 5 mie cup', fx: { stock: { mie: -5 }, trust: 4, rep: 5 }, res: 'Namamu disebut di panggung. Warga bertepuk tangan.', req: { stock: { mie: 5 } } },
    { t: 'Sumbang uang Rp 10.000', fx: { money: -10000, trust: 2 }, res: '"Terima kasih, Dek."', req: { money: 10000 } },
    { t: 'Maaf, belum bisa', fx: { trust: -1 }, res: 'Panitia mengangguk dan pergi ke warung lain.' },
  ] },
  /* kejadian yang bergantung pada kepercayaan / utang */
  { id: 'warga_bantu', minLevel: 2, when: { trustMin: 70 }, who: 'Warga gang', text: 'Warga datang bergotong royong membersihkan teras dan mengecat ulang papan nama warung. "Warungmu sudah seperti milik kita."', choices: [
    { t: 'Terima dengan terima kasih', fx: { trust: 1, rep: 5, energy: 10 }, res: 'Teras bersih, papan nama tampak baru. Kamu terharu.' },
    { t: 'Traktir mereka kopi', fx: { stock: { kopi: -5 }, trust: 3, xp: 20 }, res: 'Kopi habis tapi suasana hangat sampai malam.', req: { stock: { kopi: 5 } } },
  ] },
  { id: 'gosip', minLevel: 2, when: { trustMax: 35 }, who: 'Pelanggan lama', text: 'Kabar beredar di warung seberang bahwa warungmu kurang jujur. Seorang pelanggan lama bertanya langsung padamu.', choices: [
    { t: 'Jawab jujur dan minta maaf atas kekeliruan', fx: { trust: 4 }, res: 'Ia mengangguk pelan. "Terima kasih sudah jujur."' },
    { t: 'Traktir kopi sebagai tanda baik', fx: { stock: { kopi: -1 }, trust: 2 }, res: 'Ia tersenyum tipis. "Kita lihat saja nanti."', req: { stock: { kopi: 1 } } },
    { t: 'Marah dan menyangkal', fx: { trust: -3, rep: -3 }, res: 'Ia pergi. Kamu menyesal setelah bicara sekeras itu.' },
  ] },
  { id: 'awi_keringanan', minLevel: 3, when: { trustMin: 65, lunas: false }, who: 'Koh Awi (telepon)', text: '"Saya dengar warungmu dipercaya warga. Orang yang dipercaya itu modal terbaik. Saya beri keringanan: cicilan berikut mundur sehari."', choices: [
    { t: 'Terima, terima kasih Koh', fx: { dueShift: 1, trust: 1 }, res: '"Jangan kecewakan saya, ya."' },
    { t: 'Minta potongan utang', fx: { debt: -30000, trust: -1 }, res: '"Hm. Baik, Rp 30.000. Tapi jangan serakah."' },
  ] },
];

/** Epilog: ditentukan oleh kepercayaan, utang, dan uang. */
export const EPILOG = {
  dipercaya: { title: 'WARUNG KITA', text: 'Utang ke Koh Awi lunas. Lebih penting lagi, tidak ada satu pun kasbon yang membuatmu malu bertemu orangnya. Warga menyebut tempatmu "warung kita". Pak Haji duduk di bangku teras sambil tersenyum: "Nah. Begini maksud amanahku."' },
  untung:    { title: 'JURAGAN UNTUNG', text: 'Uangmu banyak dan terus bertambah. Tapi gang terasa lebih sepi dari dulu; warga berpikir dua kali sebelum mampir. Kamu kaya, dan belajar bahwa itu belum tentu sama dengan dipercaya.' },
  bertahan:  { title: 'BERTAHAN', text: 'Warung tetap buka tiap pagi. Tidak mewah, tidak sepi. Ada hari yang berat, ada hari yang hangat. Pak Haji berkata: "Warung yang bertahan itu sudah separuh jalan. Sisanya, kamu yang tentukan."' },
};
export const EPILOG_FLAG = { cabang: 'Cabang di jalan besar sudah berdiri.', layanan: 'Warungmu kini melayani pulsa, token listrik, dan titip paket.', koperasi: 'Warung berjalan sebagai koperasi warga; keuntungan dibagi bersama.' };
