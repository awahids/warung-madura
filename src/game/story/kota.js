/* ============================================================
   DATA BABAK LANJUTAN: pengusaha → miliarder → calon wali kota → wali kota.
   Data murni; mesinnya ada di logic/kota.js. Format kejadian sama dengan story/events.js.
   Efek tambahan (fx): integ (integritas), duk (dukungan politik), apbd (kas kota), kota { sej, bers, kerja, puas }.
   Syarat tambahan (when): wealthMin (kekayaan bersih), phase ('usaha' | 'kampanye' | 'wali', bisa array).
   ============================================================ */

export const KOTA_CHAPTERS = ['Juragan Usaha', 'Sang Miliarder', 'Calon Wali Kota', 'Wali Kota'];
export const KOTA_INTRO = [
  { text: 'Utang lunas, warga percaya. Pak Haji pulang kampung dengan tenang dan berpesan: "Warung itu pintu. Lewat pintu itu, buka usaha yang lebih besar."', goal: 'Kembangkan usaha lewat menu USAHA & KOTA sampai kekayaan bersihmu menembus Rp 1 miliar.' },
  { text: 'Kekayaanmu menembus Rp 1 miliar. Majalah menulis tentangmu, warga menyapamu di jalan. Tapi uang sebanyak itu juga mengundang tanggung jawab.', goal: 'Bantu warga, jaga kepercayaan, dan dengarkan siapa yang memintamu maju memimpin kota.' },
  { text: 'Kamu resmi mencalonkan diri sebagai wali kota. Lawanmu, Pak Burhan, sudah lama bermain di politik. Tujuh hari menuju pemilihan.', goal: 'Kumpulkan dukungan lewat menu USAHA & KOTA. Jujur atau licik, warga akan menilai.' },
  { text: 'Kamu dilantik. Anggaran kota ada di tanganmu, begitu pula godaannya. Selama 30 hari kamu menentukan wajah kota ini.', goal: 'Bangun kota lewat proyek di menu USAHA & KOTA. Naikkan kesejahteraan tanpa mengorbankan integritasmu.' },
];
export const KOTA_CATATAN = [
  '"Usaha besar berawal dari warung kecil yang jujur."',
  '"Kaya itu titipan. Yang dilihat orang adalah apa yang kamu lakukan dengannya."',
  '"Memimpin itu melayani, Nak. Jangan lupa siapa yang pertama percaya padamu."',
  '"Kota ini warung yang paling besar. Jaga pintunya."',
];

/* ---------- usaha ---------- */
export const WIN_WEALTH = 1e9;
/** cost = biaya naik ke level 1; tiap level berikutnya ×2,2. inc = pendapatan/hari di level 1; tiap level ×2. */
export const BIZ = [
  { id: 'cabang', name: 'Cabang Warung', desc: 'Warung kedua di jalan besar.', cost: 2.5e6, inc: 1.3e6 },
  { id: 'grosir', name: 'Toko Grosir', desc: 'Melayani warung-warung sekampung.', cost: 25e6, inc: 8e6 },
  { id: 'minimarket', name: 'Minimarket', desc: 'Berpendingin, kasir modern, buka 24 jam.', cost: 150e6, inc: 45e6 },
  { id: 'properti', name: 'Kontrakan & Ruko', desc: 'Sewa bulanan yang mengalir tiap hari.', cost: 500e6, inc: 150e6 },
];
export const BIZ_MAX = 5;
export const BIZ_COST_MUL = 2.2, BIZ_INC_MUL = 2, BIZ_RESALE = .7;

/* ---------- kampanye ---------- */
export const CAMP_DAYS = 7;
export const RIVAL = 'Pak Burhan';
export const CAMP_ACTS = [
  { id: 'baliho', name: 'Pasang Baliho', cost: 50e6, pts: 2, max: 3, desc: 'Wajahmu ada di tiap perempatan.' },
  { id: 'safari', name: 'Safari ke Kampung', cost: 20e6, pts: 3, max: 3, desc: 'Datangi warga, dengarkan keluhan.' },
  { id: 'sembako', name: 'Bagi Sembako', cost: 40e6, pts: 3, max: 2, desc: 'Paket sembako dari warungmu sendiri.' },
  { id: 'timses', name: 'Tim Sukses Profesional', cost: 100e6, pts: 5, max: 1, desc: 'Konsultan dan relawan terlatih.' },
  { id: 'uang', name: 'Serangan Fajar (politik uang)', cost: 200e6, pts: 14, max: 1, dirty: true, desc: 'Cepat dan efektif, tapi kotor. 40% ketahuan.' },
];

/* ---------- proyek kota ---------- */
export const CITY_DAYS = 30;
export const PROJECTS = [
  { id: 'jalan', name: 'Perbaikan Jalan', cost: 120e6, days: 3, fx: { kerja: 6, puas: 4 } },
  { id: 'drainase', name: 'Drainase Anti-Banjir', cost: 180e6, days: 4, fx: { bers: 6, puas: 3 } },
  { id: 'pasar', name: 'Pasar Rakyat Baru', cost: 300e6, days: 5, fx: { sej: 8, kerja: 8 } },
  { id: 'sekolah', name: 'Sekolah Gratis', cost: 350e6, days: 5, fx: { sej: 10, puas: 6 } },
  { id: 'puskesmas', name: 'Puskesmas Kota', cost: 250e6, days: 4, fx: { sej: 8, puas: 6 } },
  { id: 'taman', name: 'Taman Kota', cost: 150e6, days: 3, fx: { bers: 5, puas: 6 } },
  { id: 'tpa', name: 'Pengolahan Sampah', cost: 220e6, days: 4, fx: { bers: 10 } },
  { id: 'industri', name: 'Kawasan Industri Kecil', cost: 500e6, days: 7, fx: { kerja: 14, bers: -4 } },
  { id: 'angkot', name: 'Angkot Listrik', cost: 400e6, days: 6, fx: { kerja: 6, bers: 6, puas: 4 } },
  /* periode kedua */
  { id: 'rusun', name: 'Rusun Warga', cost: 450e6, days: 6, fx: { sej: 10, bers: 4, puas: 4 }, term: 2 },
  { id: 'rsud', name: 'RSUD Kota', cost: 600e6, days: 7, fx: { sej: 12, puas: 8 }, term: 2 },
  { id: 'terminal', name: 'Terminal Terpadu', cost: 500e6, days: 6, fx: { kerja: 8, puas: 5, bers: 3 }, term: 2 },
];
export const IND = { sej: 'Kesejahteraan', bers: 'Kebersihan', kerja: 'Lapangan Kerja', puas: 'Kepuasan Warga' };
export const MAX_PROJ = 2;      // proyek yang boleh jalan bersamaan
export const MARKUP = .2, MARKUP_INTEG = 12, MARKUP_CAUGHT = .25;

export const ENDINGS = {
  bapak: { title: 'BAPAK PEMBANGUNAN', text: 'Tiga puluh hari berlalu. Jalan mulus, sungai bersih, sekolah penuh. Kamu pulang ke warung lama, duduk di bangku teras. Pak Haji tersenyum dari ujung gang: "Warung kita sekarang sebesar kota. Dan kamu masih jujur."' },
  biasa: { title: 'WALI KOTA BIASA', text: 'Kota berjalan, sebagian masalah teratasi, sebagian tertunda. Warga tidak marah, tapi juga belum bertepuk tangan. "Periode berikutnya," katamu, "kita kerjakan lebih baik."' },
  korup: { title: 'TERJERAT KORUPSI', text: 'Anggaran bocor di sana-sini, dan akhirnya sampai ke telinga KPK. Gelar miliarder tidak menolongmu. Di warung lama, papan namamu diturunkan pelan-pelan oleh orang-orang yang dulu mempercayaimu.' },
};

/* ---------- kejadian cerita ---------- */
const j = n => n * 1e6;
export const KOTA_SCRIPT = [
  /* Bab 6 · Juragan Usaha */
  { id: 'u_awi', ch: 6, who: 'Koh Awi', text: 'Koh Awi datang ke warung membawa map. "Utangmu sudah beres. Sekarang saya mau jadi mitra, bukan penagih. Kita buka cabang di jalan besar, patungan Rp 3 juta?"', choices: [
    { t: 'Terima, patungan', fx: { money: -j(3), trust: 2, flag: 'awi_mitra', xp: 30 }, res: '"Saya suka orang yang tidak lupa asalnya." Koh Awi menyalami tanganmu.', req: { money: j(3) } },
    { t: 'Terima kasih, saya mandiri dulu', fx: { trust: 1 }, res: '"Baik. Pintu saya selalu terbuka."' },
  ] },
  { id: 'u_kerja', ch: 6, who: 'Bang Jaka', text: 'Bang Jaka membawa sepupunya. "Dek, adik saya nganggur setahun. Kalau cabangmu buka, boleh dia ikut kerja?"', choices: [
    { t: 'Terima, gaji layak', fx: { money: -500000, trust: 3, duk: 2, flag: 'buka_kerja' }, res: 'Sepupunya menunduk berkali-kali. Kabar baiknya cepat menyebar di kampung.', req: { money: 500000 } },
    { t: 'Nanti saja, belum ada lowongan', fx: { trust: -1 }, res: 'Bang Jaka mengangguk. "Tidak apa-apa, Dek."' },
  ] },
  { id: 'u_bank', ch: 6, who: 'Petugas bank', text: 'Petugas bank menawarkan kredit usaha Rp 20 juta, bunga ringan. "Cicilan lunas sepuluh hari lagi, Pak, totalnya Rp 24 juta."', choices: [
    { t: 'Ambil kredit', fx: { money: j(20) }, res: 'Dana masuk rekening. Jangan lupa jatuh temponya.', later: [{ days: 10, text: 'Kredit bank jatuh tempo: Rp 24 juta dipotong dari kas.', fx: { money: -j(24) } }] },
    { t: 'Tolak, pakai modal sendiri', fx: { trust: 1, integ: 1 }, res: 'Pelan tapi tenang. Tidur malam lebih nyenyak.' },
  ] },
  { id: 'u_pajak', ch: 6, who: 'Petugas pajak', text: 'Petugas pajak berbisik di meja kasir. "Pak Juragan, laporan usahanya bisa dirapikan. Dengan sedikit uang damai, urusan beres."', choices: [
    { t: 'Bayar pajak resmi Rp 2 juta', fx: { money: -j(2), integ: 5, trust: 2 }, res: 'Petugas itu terdiam, lalu mengangguk hormat.', req: { money: j(2) } },
    { t: 'Beri uang damai Rp 500 ribu', fx: { money: -500000, integ: -10, flag: 'suap_pajak' }, res: 'Urusan beres... tapi ada yang mencatat dalam hati.', req: { money: 500000 } },
  ] },
  /* Bab 7 · Sang Miliarder */
  { id: 'm_majalah', ch: 7, who: 'Wartawan majalah', text: 'Majalah bisnis menulis: "Dari Warung Madura ke Miliaran." Wartawannya mewawancaraimu di teras warung lamamu.', choices: [
    { t: 'Rendah hati: "Ini berkat warga."', fx: { trust: 3, duk: 4, rep: 5 }, res: 'Judulnya berubah jadi "Juragan yang Tidak Lupa Gang." Warga bangga.' },
    { t: 'Pamer kesuksesan', fx: { rep: 5, trust: -3, duk: 1 }, res: 'Fotomu di sebelah mobil baru. Sebagian warga mengernyit.' },
  ] },
  { id: 'm_banjir', ch: 7, who: 'Pak RT', text: 'Kampung belakang banjir tiga hari. Pak RT datang basah kuyup: "Nak, warga butuh perahu, beras, dan tempat mengungsi."', choices: [
    { t: 'Bantu penuh Rp 50 juta', fx: { money: -j(50), trust: 6, duk: 6, flag: 'banjir_bantu', xp: 40 }, res: 'Relawan dan beras berdatangan. Pak RT menepuk bahumu dengan mata berkaca.', req: { money: j(50) } },
    { t: 'Bantu secukupnya Rp 10 juta', fx: { money: -j(10), trust: 2, duk: 2 }, res: 'Cukup untuk beras dan terpal.', req: { money: j(10) } },
    { t: 'Itu urusan pemerintah', fx: { trust: -5, duk: -2 }, res: 'Pak RT pergi tanpa bicara. Kabar itu sampai ke seluruh gang.' },
  ] },
  { id: 'm_beasiswa', ch: 7, who: 'Kepala sekolah', text: 'Kepala sekolah lamamu bercerita: puluhan anak pintar terancam putus sekolah. "Beasiswa Rp 100 juta bisa mengubah hidup mereka."', choices: [
    { t: 'Donasi beasiswa Rp 100 juta', fx: { money: -j(100), trust: 5, duk: 5, flag: 'beasiswa', xp: 40 }, res: 'Anak-anak bertepuk tangan di halaman sekolah. Rani ikut berdiri di barisan depan.', req: { money: j(100) } },
    { t: 'Donasi Rp 20 juta', fx: { money: -j(20), trust: 2, duk: 1 }, res: 'Sekolah berterima kasih. Masih banyak yang belum tertolong.', req: { money: j(20) } },
    { t: 'Maaf, sudah banyak pengeluaran', fx: { trust: -2 }, res: 'Ia tersenyum kecut dan pamit.' },
  ] },
  { id: 'm_desak', ch: 7, who: 'Pak RT & warga', when: { wealthMin: WIN_WEALTH }, text: 'Warga berkumpul di depan warung membawa spanduk kecil. "Nak, kota butuh orang yang tidak lupa gang. Maju jadi wali kota ya!"', choices: [
    { t: 'Saya pikirkan, Pak. Terima kasih', fx: { duk: 3, trust: 2, flag: 'diminta_calon', xp: 50 }, res: 'Warga bersorak. Tombol MENCALONKAN DIRI kini terbuka di menu USAHA & KOTA.' },
    { t: 'Saya fokus usaha dulu', fx: { flag: 'diminta_calon' }, res: '"Kami tunggu, Nak." Pintu pencalonan tetap terbuka di menu USAHA & KOTA.' },
  ] },
  /* Bab 8 · Calon Wali Kota */
  { id: 'k_debat', ch: 8, who: 'Debat kandidat', when: { phase: 'kampanye' }, text: 'Debat publik disiarkan langsung. Pak Burhan menyerang: "Juragan warung mau mengurus kota? Mengurus kota bukan menghitung kembalian!"', choices: [
    { t: 'Jawab dengan data dan program', fx: { duk: 6, trust: 2 }, res: 'Penonton bertepuk tangan. Moderator mengangguk setuju.' },
    { t: 'Balas dengan serangan pribadi', fx: { duk: 3, integ: -8, trust: -2 }, res: 'Ruangan riuh. Sebagian suka, sebagian kecewa.' },
    { t: 'Diam dan tersenyum', fx: { duk: -2 }, res: 'Kamu tampak ragu. Pak Burhan tersenyum puas.' },
  ] },
  { id: 'k_fitnah', ch: 8, who: 'Kabar burung', when: { phase: 'kampanye' }, text: 'Beredar pesan berantai: "Calon wali kota itu dulu punya utang dan kasbon macet!" Kamu tahu siapa yang menyebarkannya.', choices: [
    { t: 'Klarifikasi jujur, tunjukkan buku catatan', fx: { trust: 3, duk: 3 }, res: 'Buku catatan Pak Haji jadi bintang. "Utangnya lunas, kasbonnya diikhlaskan," kata warga.' },
    { t: 'Balas dengan fitnah serupa', fx: { duk: 2, integ: -10 }, res: 'Perang kabar bohong dimulai. Kamu tidak yakin ini jalan yang benar.' },
  ] },
  { id: 'k_ibu', ch: 8, who: 'Ibu-ibu pengajian', when: { phase: 'kampanye' }, text: 'Ibu-ibu pengajian mengundangmu makan siang. Mereka punya banyak keluhan: harga beras, selokan mampet, lampu jalan mati.', choices: [
    { t: 'Dengarkan sampai selesai, catat semua', fx: { energy: -10, duk: 5, trust: 3, xp: 20 }, res: 'Mereka melepas dengan doa. Catatanmu penuh program yang nyata.' },
    { t: 'Janji muluk-muluk', fx: { duk: 3, integ: -3 }, res: 'Mereka senang... tapi ada yang mencatat janjimu.' },
  ] },
  /* Bab 9 · Wali Kota */
  { id: 'w_lantik', ch: 9, who: 'Pelantikan', when: { phase: 'wali' }, text: 'Sumpah jabatan selesai. Ribuan warga memenuhi alun-alun. Di barisan depan, Pak Haji bersandar pada tongkat sambil tersenyum. Apa janji pertamamu?', choices: [
    { t: '"Pemerintahan bersih dan melayani."', fx: { integ: 5, kota: { puas: 5 }, flag: 'janji_bersih' }, res: 'Tepuk tangan panjang. Janji itu akan ditagih.' },
    { t: '"Bangun cepat, kerja nyata."', fx: { kota: { kerja: 3 }, apbd: j(30) }, res: 'Investor tertarik. Dana tambahan masuk kas kota.' },
  ] },
  { id: 'w_dinas', ch: 9, who: 'Kepala Dinas PU', when: { phase: 'wali' }, text: 'Kepala Dinas menyodorkan amplop. "Fee proyek, Pak. Semua wali kota sebelumnya menerimanya. Aman, tidak ada yang tahu."', choices: [
    { t: 'Tolak dan laporkan', fx: { integ: 5, kota: { puas: 3 }, trust: 2 }, res: 'Ia pucat. Kamu mengganti pejabat itu hari itu juga.' },
    { t: 'Terima Rp 150 juta', fx: { money: j(150), integ: -15, flag: 'korup_awal' }, res: 'Uang masuk laci. Rasanya... berbeda dari uang warung.' },
  ] },
  { id: 'w_haji', ch: 9, who: 'Pak Haji', when: { phase: 'wali' }, text: 'Pak Haji berkunjung ke balai kota dengan sandal jepit. "Nak, balai kota ini besar. Tapi ingat: yang dilayani itu warga di gang, bukan kursi yang kamu duduki."', choices: [
    { t: '"Saya ingat, Pak."', fx: { trust: 3, xp: 50, kota: { puas: 3 } }, res: 'Ia mengangguk. "Cukup. Teruskan."' },
    { t: '"Saya sibuk, Pak, nanti ngobrol lagi."', fx: { trust: -2, integ: -2 }, res: 'Ia tersenyum tipis dan pamit. Kursi terasa lebih dingin.' },
  ] },
];

/** Kejadian acak kota (setelah cerita berurutan habis). */
export const KOTA_POOL = [
  { id: 'c_banjir', minLevel: 1, when: { phase: 'wali' }, who: 'Bencana', text: 'Hujan deras seharian. Sungai meluap, beberapa kampung terendam. Warga menunggu kepemimpinanmu.', choices: [
    { t: 'Kerahkan bantuan penuh (Rp 80 juta)', fx: { apbd: -j(80), kota: { puas: 6, sej: 2 } }, res: 'Posko berdiri dalam hitungan jam. Warga memuji kecepatanmu.', req: { apbd: j(80) } },
    { t: 'Bantuan seadanya (Rp 20 juta)', fx: { apbd: -j(20), kota: { puas: -4, sej: -3 } }, res: 'Bantuan datang terlambat. Kritik bermunculan.', req: { apbd: j(20) } },
  ] },
  { id: 'c_demo', minLevel: 1, when: { phase: 'wali' }, who: 'Unjuk rasa', text: 'Ratusan buruh berdemo di depan balai kota menuntut upah layak dan kepastian kerja.', choices: [
    { t: 'Temui langsung dan dengarkan', fx: { kota: { kerja: 4, puas: 3 }, apbd: -j(30) }, res: 'Demo bubar damai. Kamu berjanji tunjangan baru.', req: { apbd: j(30) } },
    { t: 'Kerahkan aparat membubarkan', fx: { kota: { puas: -8 }, integ: -3 }, res: 'Ricuh. Berita buruk menyebar luas.' },
  ] },
  { id: 'c_investor', minLevel: 1, when: { phase: 'wali' }, who: 'Investor', text: 'Investor menawarkan pabrik besar di tepi kota. Lapangan kerja banyak, tapi limbahnya mengkhawatirkan.', choices: [
    { t: 'Terima dengan syarat ketat', fx: { kota: { kerja: 8, bers: -3 }, apbd: j(60) }, res: 'Pabrik berdiri dengan pengawasan. Kas kota bertambah.' },
    { t: 'Tolak, jaga lingkungan', fx: { kota: { bers: 3, puas: 2 } }, res: 'Investor pergi. Aktivis lingkungan memuji keputusanmu.' },
  ] },
  { id: 'c_pasar', minLevel: 1, when: { phase: 'wali' }, who: 'Pedagang pasar', text: 'Pedagang pasar mengeluh: lapak sempit, atap bocor, retribusi mahal. Kamu juga mantan pedagang kecil.', choices: [
    { t: 'Turunkan retribusi, perbaiki atap (Rp 40 juta)', fx: { apbd: -j(40), kota: { sej: 4, puas: 4 } }, res: 'Pedagang bersorak. "Wali kota ini paham kami!"', req: { apbd: j(40) } },
    { t: 'Biarkan, anggaran terbatas', fx: { kota: { sej: -2, puas: -3 } }, res: 'Keluhan itu menumpuk di meja sekretaris.' },
  ] },
  { id: 'c_festival', minLevel: 1, when: { phase: 'wali' }, who: 'Panitia festival', text: 'Panitia mengajukan festival kota tahunan: musik, kuliner, dan lomba antar kampung.', choices: [
    { t: 'Dukung penuh (Rp 30 juta)', fx: { apbd: -j(30), kota: { puas: 6, sej: 2 } }, res: 'Alun-alun penuh tawa. Warung kuliner laris manis.', req: { apbd: j(30) } },
    { t: 'Dukung kecil-kecilan', fx: { kota: { puas: 1 } }, res: 'Festival tetap jalan, lebih sederhana.' },
  ] },
  { id: 'c_audit', minLevel: 1, when: { phase: 'wali', flag: 'korup_awal' }, who: 'Auditor', text: 'Tim auditor memeriksa laporan proyek. Mereka mencatat ada angka yang tidak cocok.', choices: [
    { t: 'Akui dan kembalikan Rp 100 juta', fx: { money: -j(100), integ: 8, kota: { puas: -3 } }, res: 'Pengakuan itu menyakitkan tapi mereka menutup berkas.', req: { money: j(100) } },
    { t: 'Berkelit dan sembunyikan bukti', fx: { integ: -12, kota: { puas: -8 } }, res: 'Auditor pergi, tapi curiga mereka kembali lagi.' },
  ] },
  { id: 'c_wartawan', minLevel: 1, when: { phase: 'wali' }, who: 'Wartawan', text: 'Wartawan menanyakan perkembangan kota. Beberapa pertanyaannya tajam.', choices: [
    { t: 'Jawab terbuka dengan data', fx: { kota: { puas: 3 }, integ: 2 }, res: 'Beritanya adil. Warga merasa dilibatkan.' },
    { t: 'Menghindar', fx: { kota: { puas: -3 } }, res: 'Judulnya: "Wali Kota Irit Bicara". Warga bertanya-tanya.' },
  ] },
];
