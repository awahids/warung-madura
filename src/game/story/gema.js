/* ============================================================
   GEMA MASA LALU, KORAN KOTA, dan BAB 11 · PULANG
   - Gema: pilihan lama (warung, usaha, kampanye) kembali menyapa saat kamu menjabat.
   - Koran Kota: judul berita tiap pagi, disusun dari peristiwa kemarin.
   - Pulang: beberapa hari terakhir di warung lama setelah semua jabatan selesai.
   Data murni; jadwal di logic/kota.js. Syarat tambahan (when): final ('selesai' | 'pensiun' | 'kalah' | 'tangkap', bisa array).
   ============================================================ */
const j = n => n * 1e6;
export const ECHO_DAYS = [3, 11, 14, 17, 21, 24, 26, 29];

export const ECHO_POOL = [
  { id: 'g_kembalian', minLevel: 1, forceOnly: true, echo: true, when: { phase: 'wali', flag: 'jujur_kembalian' }, who: 'Ketua RW', text: 'Seorang bapak tua menghampirimu di pasar. "Pak Wali ingat saya? Dulu Bapak mengejar saya ke ujung gang hanya untuk mengembalikan kembalian lima ribu." Kini ia ketua RW dan pendukung paling setia.', choices: [
    { t: 'Peluk dan tanyakan kabarnya', fx: { trust: 2, duk: 2, kota: { puas: 2 } }, res: '"Orang jujur itu jarang, Pak. Makanya saya ingat terus."' },
  ] },
  { id: 'g_tamu', minLevel: 1, forceOnly: true, echo: true, when: { phase: 'wali', flag: 'tamu_jujur' }, who: 'Mantan tamu bertudung', text: 'Pria yang dulu datang malam-malam bertudung kini mandor di dinas kebersihan. "Bapak dulu menolak barang gelap saya dan menawari kerja jujur. Sekarang saya yang menolak amplop dari kontraktor."', choices: [
    { t: 'Jadikan ia pengawas lapangan', fx: { inspect: 'laporkan', integ: 2, kota: { bers: 2 } }, res: 'Kontraktor nakal mulai takut dengan mandor yang tidak bisa dibeli.' },
    { t: 'Ucapkan terima kasih', fx: { trust: 2 }, res: 'Ia memakai helmnya dan kembali ke truk sampah sambil bersiul.' },
  ] },
  { id: 'g_tamu_gelap', minLevel: 1, forceOnly: true, echo: true, when: { phase: 'wali', flag: 'tamu_gelap' }, who: 'Wartawan investigasi', text: 'Seorang wartawan membawa foto lama: dus-dus rokok tanpa cukai di belakang warungmu, bertahun-tahun lalu. "Pak Wali, apa komentar Bapak? Berita ini terbit besok pagi."', choices: [
    { t: 'Akui kesalahan masa muda', fx: { sorotan: 6, integ: 4, kota: { puas: -1 } }, res: 'Beritanya terbit dengan judul "Wali Kota Mengakui Masa Lalunya". Banyak yang menghargai.' },
    { t: 'Minta beritanya tidak dimuat (Rp 50 jt)', fx: { money: -j(50), jejak: 7, integ: -6 }, res: 'Berita itu tidak terbit. Tapi wartawan itu menyimpan semuanya.', req: { money: j(50) } },
  ] },
  { id: 'g_menimbun', minLevel: 1, forceOnly: true, echo: true, when: { phase: 'wali', flag: 'menimbun' }, who: 'Pedagang pasar', text: 'Saat sidak harga beras, seorang pedagang berbisik keras: "Dulu waktu hujan berhari-hari, warung Bapak juga menimbun, kan? Sekarang Bapak menyuruh kami jangan menimbun."', choices: [
    { t: 'Akui, lalu tegakkan aturan untuk semua', fx: { harga: -.03, trust: 2, sorotan: 3 }, res: 'Pasar terdiam, lalu satu per satu pedagang membuka gudangnya.' },
    { t: 'Abaikan dan lanjut sidak', fx: { kota: { puas: -2 }, harga: -.01 }, res: 'Video bisikan itu beredar di grup WhatsApp pedagang.' },
  ] },
  { id: 'g_banjir', minLevel: 1, forceOnly: true, echo: true, when: { phase: 'wali', flag: 'banjir_bantu' }, who: 'Relawan kampung', text: 'Warga kampung belakang yang dulu kamu bantu saat banjir kini membentuk relawan siaga bencana. "Dulu Bapak menolong kami. Sekarang biar kami ikut menjaga kota."', choices: [
    { t: 'Resmikan sebagai mitra BPBD', fx: { kota: { sej: 2, puas: 2 }, duk: 2 }, res: 'Seragam oranye mereka kini terlihat di setiap posko.' },
  ] },
  { id: 'g_beasiswa', minLevel: 1, forceOnly: true, echo: true, when: { phase: 'wali', flag: 'beasiswa' }, who: 'Mantan penerima beasiswa', text: 'Salah satu anak penerima beasiswamu dulu kini insinyur sipil. Ia melamar menjadi pengawas proyek kota: "Saya ingin membalas budi dengan memastikan bangunan kota tidak asal jadi."', choices: [
    { t: 'Rekrut jadi pengawas proyek', fx: { inspect: 'laporkan', integ: 2 }, res: 'Setiap tiang yang dicor kini ia ukur sendiri.' },
    { t: 'Arahkan ikut seleksi resmi', fx: { integ: 1 }, res: 'Ia lulus seleksi dengan nilai tertinggi tiga minggu kemudian.' },
  ] },
  { id: 'g_pajak', minLevel: 1, forceOnly: true, echo: true, when: { phase: 'wali', flag: 'suap_pajak' }, who: 'Kepala Bapenda', text: 'Petugas pajak yang dulu menerima "uang damai" darimu kini Kepala Badan Pendapatan Daerah. Ia tersenyum lebar: "Kita kan sudah saling kenal, Pak. Urusan kota pasti lancar."', choices: [
    { t: 'Mutasi ke bagian lain', fx: { integ: 3, dprd: -3 }, res: 'Ia pindah tanpa protes. Tatapannya mengatakan ia belum lupa.' },
    { t: 'Biarkan, dia orang "kita"', fx: { jejak: 6, apbd: -j(20), integ: -3 }, res: 'Pendapatan pajak bulan ini anehnya turun Rp 20 juta.' },
    { t: 'Laporkan, termasuk suapmu dulu', fx: { integ: 8, sorotan: 10, haji: 5 }, res: 'Kamu mengaku di depan inspektorat. Pak Haji meneleponmu malam itu: "Bapak bangga."' },
  ] },
  { id: 'g_awi', minLevel: 1, forceOnly: true, echo: true, when: { phase: 'wali', flag: 'awi_mitra' }, who: 'Media', text: 'Perusahaan Koh Awi, mitra cabang pertamamu dulu, memenangi tender pengadaan beras kota secara sah. Tapi media mempertanyakan: "Wali kota dan pemenang tender pernah patungan usaha."', choices: [
    { t: 'Umumkan hubunganmu, minta audit', fx: { sorotan: 4, integ: 3 }, res: 'Audit independen menyatakan tender itu bersih. Koh Awi mengirim pesan: "Terima kasih sudah terbuka."' },
    { t: 'Diam saja', fx: { sorotan: 8, jejak: 3 }, res: 'Diammu justru dibaca sebagai pengakuan.' },
  ] },
  { id: 'g_koperasi', minLevel: 1, forceOnly: true, echo: true, when: { phase: 'wali', flag: 'koperasi' }, who: 'Koperasi warga', text: 'Koperasi warga yang dulu lahir dari warungmu kini punya tiga ratus anggota. Mereka meminta tempat di pasar rakyat agar bisa menjual hasil kebun dan kerajinan warga.', choices: [
    { t: 'Beri lapak gratis di pasar', fx: { kota: { sej: 3, kerja: 1 }, trust: 2 }, res: 'Lapak koperasi menjadi yang paling ramai di pasar.' },
    { t: 'Ikut aturan sewa biasa', fx: { trust: 1 }, res: 'Mereka membayar sewa dan tetap bertumbuh, pelan-pelan.' },
  ] },
  { id: 'g_kerabat', minLevel: 1, forceOnly: true, echo: true, when: { phase: 'wali', flag: 'burhan_kerabat' }, who: 'Inspektorat', text: 'Keponakan Pak Burhan yang dulu kamu angkat sebagai kepala bagian ketahuan mengatur pengadaan seragam sekolah. Harganya dua kali lipat harga pasar.', choices: [
    { t: 'Copot dan laporkan', fx: { dprd: -10, integ: 4, sorotan: 4 }, res: 'Pak Burhan marah besar di sidang DPRD. Orang tua murid berterima kasih.' },
    { t: 'Lindungi demi dukungan DPRD', fx: { jejak: 8, dprd: 5, integ: -5 }, res: 'Kasus itu "diselesaikan secara internal". Rani mencatatnya.' },
  ] },
  { id: 'g_ipar', minLevel: 1, forceOnly: true, echo: true, when: { phase: 'wali', flag: 'nepotisme' }, who: 'Wartawan', text: 'Perusahaan adik iparmu memenangi tiga proyek berturut-turut. Wartawan menemukan alamat kantornya sama dengan rumah mertuamu, dan memotret papan namanya.', choices: [
    { t: 'Putus kontrak dan minta maaf', fx: { sorotan: 8, integ: 4, apbd: -j(30) }, res: 'Pesta keluarga tahun ini sepi. Tapi warga melihat kamu bertindak.' },
    { t: 'Bantah semua tuduhan', fx: { sorotan: 12, jejak: 6 }, res: 'Bantahanmu bertahan dua hari, sampai foto papan nama itu tersebar.' },
  ] },
  { id: 'g_usaha', minLevel: 1, forceOnly: true, echo: true, when: { phase: 'wali', flag: 'konflik_usaha' }, who: 'Sekretaris daerah', text: 'Sekda melapor: minimarket milikmu ternyata menjadi satu-satunya pemasok konsumsi rapat semua dinas sejak kamu menjabat. "Apa perlu kami ganti, Pak?"', choices: [
    { t: 'Hentikan pasokan dari usahaku', fx: { integ: 3, money: -j(10) }, res: 'Pemasok baru dipilih lewat lelang terbuka.' },
    { t: 'Teruskan, harganya wajar kok', fx: { jejak: 5, money: j(15) }, res: 'Pesanan terus mengalir. Begitu pula pertanyaan.' },
  ] },
];

/* ---------- Bab 11 · Pulang ---------- */
export const PULANG_CHAPTER = 'Pulang';
export const PULANG_INTRO = { text: 'Semua jabatan sudah selesai. Yang tersisa adalah warung lama, gang sempit di belakangnya, dan orang-orang yang dulu menunggumu pulang.', goal: 'Buka warung lagi. Dengarkan warga. Tutup ceritamu di bangku teras.' };
export const PULANG_CATATAN = '"Warung itu tempat pulang, Nak. Bukan cuma tempat jualan."';

export const PULANG_POOL = [
  { id: 'p_pagi', minLevel: 1, forceOnly: true, pulang: 1, when: { final: ['selesai', 'pensiun', 'kalah'] }, who: 'Pagi pertama', text: 'Pagi pertama tanpa ajudan dan mobil dinas. Kamu membuka rolling door warung sendiri. Engselnya masih berderit seperti dulu, dan bau kopi sachet langsung tercium.', choices: [
    { t: 'Menata rak seperti dulu', fx: { energy: 10, trust: 1 }, res: 'Tanganmu masih ingat urutannya: kopi, rokok, mie, kerupuk.' },
  ] },
  { id: 'p_bebas', minLevel: 1, forceOnly: true, pulang: 1, when: { final: 'tangkap' }, who: 'Bertahun-tahun kemudian', text: 'Bertahun-tahun kemudian kamu keluar dari lapas dengan satu tas kecil. Warung lama masih berdiri, catnya mengelupas. Di teras, seseorang sudah menunggumu.', choices: [
    { t: 'Mendekat pelan-pelan', fx: { energy: -10 }, res: 'Itu Bu Sri. "Ibu sudah sapu terasnya, Dek. Ayo buka lagi."' },
  ] },
  { id: 'p_sri', minLevel: 1, forceOnly: true, pulang: 2, who: 'Bu Sri', when: {}, text: 'Bu Sri datang membeli beras sekilo dan telur seperempat, persis seperti dulu. Ia menatapmu lama di balik etalase lalu tertawa kecil.', choices: [
    { t: '"Biasa, Bu?"', fx: { trust: 2, bond: { who: 'Bu Sri', n: 5 } }, res: '"Biasa, Dek. Kamu masih ingat ternyata." Ia membayar pas, tanpa kasbon.' },
  ] },
  { id: 'p_rani', minLevel: 1, forceOnly: true, pulang: 3, when: { flag: 'penerus_rani' }, who: 'Wali Kota Rani', text: 'Mobil dinas berhenti di depan warung. Rani, kini wali kota, turun tanpa ajudan dan membeli jajan seribuan. "Kak, aku dapat tender pertama. Ada kontraktor yang menawari fee..."', choices: [
    { t: '"Ingat Bu Sri dan jalan gang."', fx: { trust: 3 }, res: 'Rani tersenyum. "Itu yang selalu Kakak bilang." Ia pergi dengan langkah lebih ringan.' },
    { t: '"Ceritakan semua ke publik."', fx: { trust: 2, rep: 3 }, res: 'Seminggu kemudian Rani mengumumkan lelang terbuka untuk semua proyek kota.' },
  ] },
  { id: 'p_burhan', minLevel: 1, forceOnly: true, pulang: 3, when: { flag: 'penerus_burhan' }, who: 'Warga gang', text: 'Warga berkumpul di warung. Wali kota baru, Pak Burhan, menghentikan pembangunan sekolah dan mengganti nama taman kota. "Bapak dulu yang dukung dia, kan?"', choices: [
    { t: 'Akui dan bantu warga bersuara', fx: { trust: 2, energy: -10 }, res: 'Kamu membantu warga menulis petisi. Ternyata menjadi warga biasa pun bisa melawan.' },
    { t: '"Saya sudah pensiun."', fx: { trust: -3 }, res: 'Warga pulang satu per satu. Kopi di gelas mereka tidak dihabiskan.' },
  ] },
  { id: 'p_netral', minLevel: 1, forceOnly: true, pulang: 3, when: { noFlag: 'penerus_rani' }, who: 'Bang Jaka', text: 'Bang Jaka mampir, memesan kopi, lalu duduk lama. "Nak, kota sudah ganti pemimpin. Tapi gang ini tetap butuh warung yang buka jam lima subuh."', choices: [
    { t: 'Traktir kopinya', fx: { trust: 2, stock: { kopi: -1 } }, res: 'Ia tertawa. "Kopimu masih paling pas."', req: { stock: { kopi: 1 } } },
    { t: 'Ajak ngobrol soal kota', fx: { energy: -5, trust: 1 }, res: 'Kalian bicara sampai matahari tinggi.' },
  ] },
  { id: 'p_haji', minLevel: 1, forceOnly: true, pulang: 4, when: {}, who: 'Bangku teras', text: 'Sore itu bangku teras warung terasa sangat sunyi. Di laci kasir, kamu menemukan buku catatan lama Pak Haji. Di halaman terakhir tertulis tangan: "Untuk penjaga warung berikutnya."', choices: [
    { t: 'Baca halaman terakhir', fx: { xp: 50 }, res: '"Warung yang besar itu yang dicari orang, bukan yang paling untung. Kalau kamu sudah membaca ini, berarti kamu sudah pulang. Terima kasih, Nak."' },
  ] },
];

/** Koran Kota: judul pagi menurut jenis peristiwa terpenting kemarin. */
export const KORAN = {
  kpk: ['OTT! Wali Kota Dijemput KPK', 'Penyidik Kantongi Bukti Aliran Dana'],
  audit: ['Hasil Audit BPK Diumumkan', 'BPK Periksa Proyek-Proyek Kota'],
  rusak: ['Bangunan Baru Ambruk, Warga Marah', 'Proyek Asal Jadi Makan Korban Anggaran'],
  fee: ['Kontraktor Dekat Penguasa Menang Lagi', 'Aroma Fee di Balik Tender Kota'],
  proyek: ['Proyek Kota Rampung, Warga Menyambut', 'Pembangunan Kota Terus Berjalan'],
  warga: ['Suara dari Gang Belakang', 'Warga Menagih Janji Wali Kota'],
  harga: ['Harga Sembako Merangkak Naik', 'Pedagang Pasar Mengeluh Daya Beli'],
  usaha: ['Ekonomi Kota Bergerak'],
  bagus: ['Kota Kita Makin Nyaman', 'Survei: Warga Puas dengan Layanan Kota'],
  biasa: ['Kota Berjalan Seperti Biasa', 'Hari Tenang di Balai Kota'],
};
export const KORAN_ORDER = ['kpk', 'audit', 'rusak', 'fee', 'proyek', 'warga', 'harga'];
