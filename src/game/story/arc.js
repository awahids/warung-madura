/* ============================================================
   ALUR CERITA MASA JABATAN (Bab 9 & Bab 10 · Periode Kedua)
   Kejadian bertanggal: lawan politik Pak Burhan, Koh Awi & hipermarket, perjalanan Rani
   (dari mahasiswi → pegawai pengadaan → penyidik), dan surat/pamitan Pak Haji.
   Lalu: maju periode kedua atau pulang, memilih penerus, dan menentukan nasib warung lama.
   Data murni; jadwal & pemilihan varian ada di logic/kota.js.
   ============================================================ */
const j = n => n * 1e6;

/** Jadwal kejadian per hari masa jabatan; nilai fungsi memilih varian sesuai keadaan. */
export const ARC = {
  1: { 6: 'b_burhan_oposisi', 9: 'a_awi_hyper', 16: 'b_burhan_jebak', 18: s => (s.rani >= 50 ? 'r_rani_magang' : 'r_rani_demo'), 22: s => (s.haji >= 60 ? 'h_surat_baik' : 'h_surat_ragu'), 27: 'b_burhan_akhir' },
  2: { 2: 'p2_lantik', 8: 'b_burhan_angket', 15: s => (s.jejak >= 30 ? 'r_rani_kpk' : 'r_rani_mitra'), 23: s => (s.haji >= 55 ? 'h_pamit' : 'h_pamit_dingin'), 28: 'p2_pengganti' },
};
export const REELECT_APBD = 150e6;

export const ARC_POOL = [
  /* ---------- Bab 9: periode pertama ---------- */
  { id: 'b_burhan_oposisi', minLevel: 1, forceOnly: true, when: { phase: 'wali' }, who: 'Pak Burhan', text: 'Pak Burhan, yang kalah di pemilihan, kini memimpin fraksi terbesar di DPRD. Ia mampir dengan senyum lebar. "Selamat, Pak Wali. Kota ini besar. Kita bisa saling bantu... atau saling repot."', choices: [
    { t: 'Ajak kerja sama untuk program warga', fx: { dprd: 6, energy: -5 }, res: 'Ia tertawa. "Kita lihat seberapa tulus Bapak."' },
    { t: 'Tawari jabatan untuk kerabatnya', fx: { dprd: 14, jejak: 5, integ: -6, flag: 'burhan_kerabat' }, res: 'Keponakannya dilantik jadi kepala bagian. Fraksinya mendadak ramah.' },
    { t: 'Tidak ada kesepakatan di bawah meja', fx: { dprd: -8, integ: 3 }, res: '"Baik," katanya pelan. "Kita bertemu di sidang paripurna."' },
  ] },
  { id: 'a_awi_hyper', minLevel: 1, forceOnly: true, when: { phase: 'wali' }, who: 'Koh Awi', text: 'Koh Awi kini bermitra dengan jaringan ritel besar. "Saya mau bangun hipermarket dekat pasar rakyat. Kota dapat pajak besar, saya dapat untung. Tapi... warung-warung kecil mungkin sepi."', choices: [
    { t: 'Izinkan, wajib kuota produk UMKM', fx: { apbd: j(80), kota: { kerja: 4, sej: 1 }, saingan: 6, warga: { darto: 4 } }, res: 'Hipermarket berdiri. Warung-warung kecil, termasuk warungmu, merasakan pembeli berkurang.' },
    { t: 'Tolak demi pasar rakyat & warung kecil', fx: { kota: { puas: 3 }, dprd: -4, trust: 3 }, res: 'Koh Awi mengangguk pelan. "Kamu memang masih anak warung, ya."' },
    { t: 'Izinkan asal ada "biaya rekomendasi"', fx: { money: j(60), jejak: 9, integ: -8, saingan: 10, kota: { kerja: 4 } }, res: 'Koh Awi menyerahkan amplop tanpa menatapmu. Dulu ia menyalamimu dengan bangga.' },
  ] },
  { id: 'b_burhan_jebak', minLevel: 1, forceOnly: true, when: { phase: 'wali' }, who: 'Pak Burhan', text: 'Pak Burhan datang sendirian membawa tas kulit. "Saya capek bertengkar, Pak. Ini Rp 200 juta, anggap tanda damai. Fraksi saya berhenti menyerang, Bapak tenang memimpin."', choices: [
    { t: 'Terima tanda damai itu', fx: { money: j(200), integ: -10, flag: 'amplop_burhan' }, res: 'Tas kulit itu kamu simpan di lemari. Pak Burhan pamit sambil merapikan kancing jasnya.',
      later: [{ days: 1, chance: .6, text: 'Video penyerahan tas kulit itu viral. Pak Burhan ternyata merekamnya dari kancing jas.', fx: { jejak: 25, sorotan: 25 }, elseText: 'Pak Burhan menepati janji: fraksinya diam di sidang.', elseFx: { dprd: 15 } }] },
    { t: 'Tolak, dan catat pertemuan ini', fx: { integ: 4, sorotan: 3 }, res: 'Pak Burhan tersenyum kecut. Belakangan kamu tahu ada kamera di kancing jasnya.' },
    { t: 'Laporkan ke KPK sebagai gratifikasi', fx: { integ: 8, sorotan: 10, dprd: -10, kota: { puas: 4 } }, res: 'KPK memanggil Pak Burhan. Kota gempar, dan warga memujimu di media sosial.' },
  ] },
  { id: 'r_rani_magang', minLevel: 1, forceOnly: true, when: { phase: 'wali' }, who: 'Rani', text: 'Rani lulus dengan predikat cum laude. "Kak, aku mau magang di balai kota. Bagian pengadaan. Aku mau lihat sendiri bagaimana tender kota bekerja."', choices: [
    { t: 'Terima Rani di bagian pengadaan', fx: { warga: { rani: 10 }, flag: 'rani_pengadaan', sorotan: 2 }, res: 'Rani mulai bekerja. Mulai hari ini, setiap kontrak kota lewat mejanya.' },
    { t: 'Tempatkan di bagian lain saja', fx: { warga: { rani: -6 } }, res: 'Rani tahu kenapa. Ia tidak protes, tapi ia tahu.' },
  ] },
  { id: 'r_rani_demo', minLevel: 1, forceOnly: true, when: { phase: 'wali' }, who: 'Rani', text: 'Rani memimpin ratusan mahasiswa di depan balai kota. Spanduknya memuat nama-nama kontraktor yang dekat denganmu. Ia memegang pengeras suara dengan tangan gemetar.', choices: [
    { t: 'Temui Rani di tengah massa', fx: { sorotan: 5, warga: { rani: 6 }, kota: { puas: 2 }, energy: -10 }, res: 'Kalian bicara di bawah terik matahari. Untuk pertama kalinya Rani menurunkan pengeras suaranya.' },
    { t: 'Minta polisi mengamankan', fx: { warga: { rani: -15 }, sorotan: 12, kota: { puas: -5 } }, res: 'Rani digiring ke mobil polisi. Fotonya ada di semua berita malam itu.' },
  ] },
  { id: 'h_surat_baik', minLevel: 1, forceOnly: true, when: { phase: 'wali' }, who: 'Surat Pak Haji', text: 'Sepucuk surat tulisan tangan tiba. "Nak, dokter bilang jantung Bapak makin lemah. Bapak tidak takut. Bapak sudah lihat kamu memimpin dengan jujur. Jaga warung itu, dan jaga kota ini."', choices: [
    { t: 'Pulang ke kampung menjenguk', fx: { energy: -15, haji: 6, trust: 2 }, res: 'Pak Haji menyambutmu di teras dengan kopi sachet. Kalian bicara sampai magrib.' },
    { t: 'Balas suratnya malam ini', fx: { haji: 3 }, res: 'Kamu menulis tiga halaman. Yang terakhir hanya berisi: "Terima kasih, Pak."' },
  ] },
  { id: 'h_surat_ragu', minLevel: 1, forceOnly: true, when: { phase: 'wali' }, who: 'Surat Pak Haji', text: 'Surat Pak Haji kali ini singkat. "Nak, Bapak dengar banyak cerita. Bapak tidak mau percaya semuanya. Datanglah ke warung lama. Kita bicara di bangku teras seperti dulu."', choices: [
    { t: 'Datang dan mengaku semuanya', fx: { haji: 12, integ: 5, returnFees: 1 }, res: 'Pak Haji mendengarkan tanpa memotong. "Kembalikan semuanya. Lalu mulai lagi."' },
    { t: 'Kirim ajudan dengan oleh-oleh', fx: { haji: -8 }, res: 'Ajudanmu pulang membawa oleh-oleh itu kembali. Pak Haji tidak mau menerimanya.' },
  ] },
  { id: 'b_burhan_akhir', minLevel: 1, forceOnly: true, when: { phase: 'wali' }, who: 'Pak Burhan', text: 'Pak Burhan mengumumkan akan maju lagi di pemilihan berikutnya. "Kota ini butuh pemimpin berpengalaman, bukan juragan warung yang belajar sambil jalan."', choices: [
    { t: 'Fokus menuntaskan janji', fx: { duk: 3, kota: { puas: 1 } }, res: 'Kamu tidak menjawab di media. Kamu menjawab di lapangan.' },
    { t: 'Serang balik di media', fx: { sorotan: 6, duk: 2, integ: -2 }, res: 'Perang komentar dimulai. Warga menontonnya seperti sinetron.' },
  ] },
  /* ---------- Bab 10: periode kedua ---------- */
  { id: 'p2_lantik', minLevel: 1, forceOnly: true, when: { phase: 'wali' }, who: 'Pelantikan kedua', text: 'Pelantikan periode kedua lebih sederhana. Tidak ada euforia seperti dulu; warga datang membawa daftar janji yang belum tuntas, dan wartawan menanyakan rencana lima tahun ke depan.', choices: [
    { t: 'Janji: tuntaskan yang tertunda', fx: { kota: { puas: 3 }, flag: 'janji_p2' }, res: 'Daftar janji itu kamu tempel di dinding ruang kerja.' },
    { t: 'Umumkan proyek besar baru', fx: { duk: 3, dprd: 4 }, res: 'Rusun, RSUD, dan terminal terpadu masuk rencana kota.' },
  ] },
  { id: 'b_burhan_angket', minLevel: 1, forceOnly: true, when: { phase: 'wali' }, who: 'Pansus DPRD', text: 'DPRD yang dipimpin Pak Burhan menggulirkan hak angket: panitia khusus akan menyelidiki semua proyek periode pertamamu. Sidang pertama disiarkan langsung.', choices: [
    { t: 'Buka semua dokumen ke pansus', fx: { audit: 'kooperatif', sorotan: 6 }, res: 'Pansus memeriksa kontrak satu per satu di depan kamera.' },
    { t: 'Lobi anggota pansus (Rp 150 jt)', fx: { money: -j(150), dprd: 10, jejak: 10, integ: -8 }, res: 'Beberapa anggota pansus mendadak berhalangan hadir.', req: { money: j(150) } },
    { t: 'Tolak hadir ke pansus', fx: { dprd: -12, sorotan: 12, kota: { puas: -4 } }, res: 'Kursimu di ruang sidang kosong. Judul berita: "Wali Kota Menghindar".' },
  ] },
  { id: 'r_rani_kpk', minLevel: 1, forceOnly: true, when: { phase: 'wali' }, who: 'Penyidik Rani', text: 'Rani kini penyidik muda lembaga antikorupsi. Hari ini ia datang bukan sebagai adik kecil dari gang belakang, tapi sebagai penyidik dengan surat tugas dan berkas tebal.', choices: [
    { t: 'Bekerja sama penuh', fx: { returnFees: 1, integ: 8, sorotan: 10, warga: { rani: 10 } }, res: 'Rani menatapmu lama. "Kakak yang mengajariku jujur. Terima kasih masih ingat."' },
    { t: 'Minta Rani mundur karena konflik', fx: { warga: { rani: -20 }, sorotan: 8, jejak: 5 }, res: 'Rani diganti penyidik lain yang tidak mengenalmu sama sekali.' },
  ] },
  { id: 'r_rani_mitra', minLevel: 1, forceOnly: true, when: { phase: 'wali' }, who: 'Rani', text: 'Rani kini bekerja di lembaga antikorupsi dan menawarkan kerja sama: sistem pencegahan korupsi untuk seluruh dinas kota, dimulai dari bagian pengadaan.', choices: [
    { t: 'Pasang sistem pencegahan (Rp 30 jt)', fx: { apbd: -j(30), integ: 5, sorotan: -5, warga: { rani: 8 } }, res: 'Kota-kota lain datang studi banding. Rani tersenyum di barisan belakang.', req: { apbd: j(30) } },
    { t: 'Nanti saja, sedang sibuk', fx: { warga: { rani: -4 } }, res: 'Rani mengangguk. "Pintuku selalu terbuka, Kak."' },
  ] },
  { id: 'h_pamit', minLevel: 1, forceOnly: true, when: { phase: 'wali' }, who: 'Pak Haji', text: 'Pak Haji minta diantar ke warung lama. Ia duduk di bangku teras, menyeruput kopi sachet, menatap gang. "Nak, Bapak mungkin tidak lama lagi. Warung ini... mau kamu apakan?"', choices: [
    { t: 'Serahkan ke Rizky, tetap melayani', fx: { flag: 'warung_rizky', haji: 5 }, res: '"Rizky anak baik. Dulu kamu yang menolongnya." Pak Haji tersenyum.' },
    { t: 'Jadikan koperasi warga', fx: { flag: 'warung_koperasi', haji: 6, trust: 3 }, res: '"Warung kita," gumamnya. "Bapak suka nama itu."' },
    { t: 'Saya sendiri yang jaga lagi nanti', fx: { flag: 'warung_pulang', haji: 8 }, res: 'Pak Haji tertawa sampai terbatuk. "Jangan lupa cara menghitung kembalian."' },
  ] },
  { id: 'h_pamit_dingin', minLevel: 1, forceOnly: true, when: { phase: 'wali' }, who: 'Kabar dari kampung', text: 'Kabar dari kampung: Pak Haji dirawat lagi. Ia tidak meminta kamu datang, dan keluarganya tidak menelepon. Ajudanmu bertanya apakah perlu mengirim karangan bunga.', choices: [
    { t: 'Datang tanpa diundang', fx: { haji: 15, energy: -15 }, res: 'Ia membuka mata dan menatapmu lama. "Kamu datang." Itu saja, dan itu cukup.' },
    { t: 'Kirim karangan bunga saja', fx: { haji: -5 }, res: 'Karangan bunga itu diletakkan di luar kamar. Tidak ada yang membacanya.' },
  ] },
  { id: 'p2_pengganti', minLevel: 1, forceOnly: true, when: { phase: 'wali' }, who: 'Partai', text: 'Masa jabatanmu hampir habis dan kamu tidak bisa dipilih lagi. Partai menanyakan siapa yang akan kamu dukung sebagai wali kota berikutnya.', choices: [
    { t: 'Dukung Rani, generasi baru', fx: { flag: 'penerus_rani', warga: { rani: 5 } }, res: 'Rani terdiam lama, lalu memelukmu. "Aku akan lebih jujur dari Kakak."' },
    { t: 'Dukung Pak Burhan demi stabilitas', fx: { flag: 'penerus_burhan', dprd: 10 }, res: 'Pak Burhan menjabat tanganmu terlalu erat. Ruang rapat bertepuk tangan.' },
    { t: 'Netral, biar warga yang memilih', fx: { flag: 'penerus_netral', trust: 2 }, res: 'Kamu menolak berpihak. Beberapa orang kecewa, banyak yang menghormati.' },
  ] },
];

/** Bab 10 */
export const P2_CHAPTER = 'Periode Kedua';
export const P2_INTRO = { text: 'Warga memberimu kesempatan kedua. Kali ini tidak ada lagi alasan "belajar sambil jalan": janji lama ditagih, Pak Burhan memimpin DPRD, dan Rani sudah bukan anak kecil lagi.', goal: 'Tuntaskan janji, hadapi pansus, bangun proyek besar (rusun, RSUD, terminal), pilih penerus, dan tentukan nasib warung lama.' };
export const P2_CATATAN = '"Yang berat bukan menang, Nak. Yang berat itu tetap sama setelah menang dua kali."';

/** Penutup akhir: warisan dua periode. */
export const WARISAN = {
  title: { selesai: 'WARISAN', pensiun: 'CUKUP SATU PERIODE', kalah: 'KEMBALI KE WARUNG', tangkap: 'AKHIR YANG PAHIT' },
  intro: {
    selesai: 'Sepuluh tahun memimpin selesai. Kamu menyerahkan kunci ruang kerja dan berjalan kaki ke gang belakang.',
    pensiun: 'Kamu memilih cukup satu periode. "Kota butuh pemimpin baru," katamu, lalu pulang ke warung.',
    kalah: 'Warga memilih Pak Burhan. Kamu pulang ke warung lebih cepat dari rencana, membawa pelajaran yang mahal.',
    tangkap: 'Masa jabatanmu berakhir di ruang tahanan. Kota terus berjalan tanpamu.',
  },
  penerus: {
    penerus_rani: 'Dengan dukunganmu, Rani terpilih menjadi wali kota termuda dalam sejarah kota.',
    penerus_burhan: 'Pak Burhan kembali berkuasa. Sebagian proyekmu dihentikan, sebagian lain diberi nama baru.',
    penerus_netral: 'Warga memilih sendiri pemimpin berikutnya. Kamu menonton hitung cepat dari warung.',
  },
  warung: {
    warung_rizky: 'Warung lama kini dijaga Bang Rizky, buka sejak subuh seperti dulu.',
    warung_koperasi: 'Warung lama menjadi koperasi warga; papan namanya kini bertuliskan "Warung Kita".',
    warung_pulang: 'Kamu kembali menjaga warung. Pagi pertama, Bu Sri datang membeli beras dan tertawa melihatmu memegang kalkulator lagi.',
    none: 'Warung lama tetap buka, menunggu pemiliknya pulang.',
  },
  haji: { hi: 'Pak Haji menghabiskan hari-harinya di bangku teras warung, menyapa setiap pembeli dengan bangga.', mid: 'Pak Haji sesekali mampir, minum kopi, dan tidak banyak bertanya.', lo: 'Pak Haji pindah ke rumah anaknya di kampung. Ia tidak pernah lagi menanyakan kabarmu.' },
};
