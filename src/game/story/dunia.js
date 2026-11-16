/* ============================================================
   DUNIA NYATA: pengadaan proyek (tender), uang pelicin & suap, audit & KPK, DPRD, demo warga,
   inflasi, perizinan usaha, saingan, dan karyawan nakal. Data murni; mesin ada di logic/kota.js.
   Efek tambahan (fx): jejak (bukti korupsi), sorotan (perhatian media), dprd (dukungan dewan), harga (indeks harga),
     audit ('kooperatif' | 'pengacara' | 'sogok'), izin ('cepat' | 'tunggu'), saingan (hari), returnFees, inspect ('perbaiki' | 'laporkan').
   Syarat tambahan (when): jejakMin, jejakMax, dprdMax, puasMax, kerjaMax, hargaMin, bizMin, done / notDone (id proyek), proyekJalan.
   ============================================================ */
export const AUDIT_DAYS = [10, 20];
export const DPRD_MIN_COST = 300e6;     // proyek di atas ini perlu persetujuan DPRD (≥ DPRD_MIN)
export const DPRD_MIN = 45;
export const EPROC_COST = 60e6;
export const PERMIT_DAYS = 3, PERMIT_FEE = 3e6;
export const RUSH_PCT = .06, RUSH_DAYS = 2;     // uang pelicin percepatan izin: 6% harga, −2 hari
export const NAMES = {
  jujur: ['PT Karya Bersih', 'PT Bangun Adil', 'PT Tata Nusa'],
  kroni: ['PT Sahabat Pejabat', 'CV Keluarga Jaya', 'PT Mitra Dewan'],
  murah: ['CV Hemat Jaya', 'CV Cepat Untung', 'PT Asal Jadi'],
};
export const ENDING_ARREST = { title: 'DITANGKAP KPK', text: 'Pagi-pagi, penyidik KPK mendatangi rumah dinas. Bukti aliran dana dari proyek-proyek kota sudah lengkap. Kamu keluar dengan tangan terborgol di depan kamera wartawan, melewati warga yang dulu memilihmu. Di warung lama, Pak Haji hanya menunduk. "Warung ini diwariskan untuk melayani, Nak. Bukan untuk ini."' };

const j = n => n * 1e6;
export const DUNIA_POOL = [
  { id: 'd_jatah', minLevel: 1, when: { phase: 'wali' }, who: 'Ketua Komisi DPRD', text: 'Ketua Komisi DPRD datang ke ruang kerja. "Pak Wali, proyek tahun ini mohon melibatkan kawan-kawan dewan. Ada jatah paket pekerjaan untuk konstituen kami."', choices: [
    { t: 'Beri jatah satu paket proyek', fx: { dprd: 15, jejak: 6, integ: -6, flag: 'jatah_dprd' }, res: 'Dewan puas dan anggaran lancar. Tapi seseorang mencatat siapa yang mendapat jatah.' },
    { t: 'Jelaskan: semua lewat lelang terbuka', fx: { dprd: 3, energy: -8, integ: 2 }, res: 'Ia mengangguk setengah hati. "Baik, Pak, kami awasi."' },
    { t: 'Tolak tegas', fx: { dprd: -12, integ: 3, trust: 1 }, res: 'Ruangan hening. Ketua komisi pergi tanpa menyalami.' },
  ] },
  { id: 'd_audit', minLevel: 1, forceOnly: true, when: { phase: 'wali' }, who: 'Auditor BPK', text: 'Tim auditor BPK memeriksa laporan proyek dan aliran dana kota. Mereka menanyakan beberapa angka yang janggal pada dokumen tender.', choices: [
    { t: 'Kooperatif: buka semua dokumen', fx: { audit: 'kooperatif' }, res: 'Berkas dibuka. Auditor bekerja sampai larut malam.' },
    { t: 'Sewa pengacara kondang (Rp 50 jt)', fx: { money: -j(50), audit: 'pengacara' }, res: 'Pengacara mendampingi dan merapikan jawabanmu.', req: { money: j(50) } },
    { t: 'Beri uang tutup mulut ke auditor', fx: { audit: 'sogok', integ: -10 }, res: 'Amplop berpindah tangan di ruang rapat sepi...' },
  ] },
  { id: 'd_whistle', minLevel: 1, forceOnly: true, when: { phase: 'wali' }, who: 'Aktivis antikorupsi', text: 'Seorang aktivis membawa dokumen dugaan mark-up proyek kota dan mengumpulkan wartawan di depan balai kota. Kamera menyorot pintu ruanganmu.', choices: [
    { t: 'Buka data dan siap diperiksa', fx: { sorotan: 8, integ: 3, kota: { puas: 2 } }, res: 'Keterbukaanmu meredakan sebagian kemarahan. Wartawan mencatat semuanya.' },
    { t: 'Bantah, sebut tuduhan hoaks', fx: { sorotan: 12, kota: { puas: -3 }, jejak: 3 }, res: 'Bantahan itu dipotong dan disebar. Warga membandingkan dengan dokumen.' },
    { t: 'Beri "uang saku" Rp 20 jt agar diam', fx: { money: -j(20), jejak: 10, integ: -8, sorotan: -6 }, res: 'Ia pergi, tapi rekaman penerimaan uang itu tersimpan di ponselnya.', req: { money: j(20) } },
  ] },
  { id: 'd_kpk', minLevel: 1, when: { phase: 'wali', jejakMin: 40 }, who: 'Penyidik KPK', text: 'Penyidik KPK mengundangmu memberi keterangan terkait beberapa proyek. Pengacara menyarankan kamu segera menentukan sikap sebelum ada penetapan.', choices: [
    { t: 'Penuhi panggilan dan kembalikan fee', fx: { returnFees: 1, sorotan: 8, integ: 6, jejak: -10 }, res: 'Kamu menyerahkan catatan dan mengembalikan uang. Penyidik mencatatnya sebagai itikad baik.' },
    { t: 'Ulur waktu lewat praperadilan (Rp 100 jt)', fx: { money: -j(100), jejak: 4, integ: -5, sorotan: 5 }, res: 'Sidang praperadilan menunda segalanya, tapi pemberitaan tak berhenti.', req: { money: j(100) } },
    { t: 'Musnahkan dokumen yang memberatkan', fx: { jejak: 18, integ: -12, sorotan: 6 }, res: 'Dokumen dibakar... tapi salinan digital sudah ada di tangan penyidik.' },
  ] },
  { id: 'd_demo', minLevel: 1, when: { phase: 'wali', puasMax: 40 }, who: 'Massa aksi', text: 'Ribuan warga turun ke jalan di depan balai kota. Spanduk menuntut perbaikan layanan dan kota yang bersih dari korupsi. Truk pengeras suara memenuhi jalan.', choices: [
    { t: 'Temui massa dan beri komitmen tertulis', fx: { kota: { puas: 6 }, energy: -12, sorotan: 2, dprd: 2 }, res: 'Kamu naik ke atas mobil komando dan berbicara. Massa mulai tenang.' },
    { t: 'Janji manis lalu ulur waktu', fx: { kota: { puas: 2 }, integ: -3 }, res: 'Massa bubar, tapi mereka mencatat tenggat yang kamu janjikan.' },
    { t: 'Bubarkan paksa', fx: { kota: { puas: -9 }, sorotan: 15, integ: -5, dprd: -4 }, res: 'Gas air mata. Video itu viral dalam hitungan menit.' },
  ] },
  { id: 'd_bbm', minLevel: 1, when: { phase: ['usaha', 'wali'] }, who: 'Kabar ekonomi', text: 'Harga BBM naik. Ongkos angkut membengkak, harga beras, minyak, dan telur ikut merangkak. Pedagang pasar mengeluh, pembeli mengurangi belanja.', choices: [
    { t: 'Gelar pasar murah (Rp 40 jt kas kota)', fx: { apbd: -j(40), harga: .03, kota: { puas: 3 } }, res: 'Pasar murah dipadati warga. Kenaikan harga bisa ditahan sebagian.', req: { apbd: j(40) } },
    { t: 'Biarkan mekanisme pasar', fx: { harga: .08, kota: { puas: -3 } }, res: 'Harga naik penuh. Margin warung dan usaha menipis.' },
  ] },
  { id: 'd_izin', minLevel: 1, forceOnly: true, when: { phase: ['usaha', 'kampanye', 'wali'] }, who: 'Petugas perizinan', text: 'Berkas izin usaha barumu tertahan di meja petugas. "Bisa cepat, Pak, kalau ada uang administrasi Rp 3 juta. Kalau lewat antrean resmi ya sekitar tiga hari."', choices: [
    { t: 'Bayar uang pelicin Rp 3 jt', fx: { money: -j(3), izin: 'cepat', jejak: 2, integ: -4 }, res: 'Izin keluar sore itu juga. Praktik yang tidak tercatat di mana pun.', req: { money: j(3) } },
    { t: 'Ikut antrean resmi', fx: { izin: 'tunggu' }, res: 'Kamu menunggu tiga hari. Usaha belum boleh buka dulu.' },
    { t: 'Laporkan ke inspektorat', fx: { izin: 'tunggu', integ: 3, rep: 2 }, res: 'Petugas itu ditegur. Izinmu tetap lewat jalur resmi.' },
  ] },
  { id: 'd_manajer', minLevel: 1, when: { phase: ['usaha', 'kampanye', 'wali'], bizMin: 2 }, who: 'Audit internal', text: 'Audit internal menemukan manajer cabang menggelapkan sebagian setoran harian. Ia memohon ampun: ibunya sakit dan utangnya menumpuk.', choices: [
    { t: 'Pecat dan laporkan ke polisi', fx: { money: -j(8), rep: 2, integ: 2 }, res: 'Kerugian Rp 8 juta tak kembali, tapi karyawan lain jadi lebih hati-hati.' },
    { t: 'Maafkan, beri peringatan keras', fx: { money: -j(8), trust: 2 },
      res: 'Ia menangis dan berjanji bekerja jujur.', later: [{ days: 6, chance: .4, text: 'Manajer yang dimaafkan kembali menggelapkan setoran Rp 15 juta.', fx: { money: -j(15) }, elseText: 'Manajer itu bekerja jujur dan berterima kasih.', elseFx: { trust: 2 } }] },
  ] },
  { id: 'd_pesaing', minLevel: 1, when: { phase: ['usaha', 'kampanye', 'wali'], bizMin: 1 }, who: 'Pesaing', text: 'Jaringan minimarket nasional membuka gerai dua ratus meter dari warungmu. Promo "beli dua gratis satu" membuat pelanggan lama mulai ragu.', choices: [
    { t: 'Adakan promo dan diskon pelanggan', fx: { money: -j(5), saingan: 5 }, res: 'Pelanggan tetap bertahan. Marginmu menipis beberapa hari.', req: { money: j(5) } },
    { t: 'Unggulkan kasbon dan layanan antar', fx: { saingan: 8, energy: -10, trust: 2 }, res: 'Warga ingat siapa yang selalu membantu mereka di saat sulit.' },
    { t: 'Abaikan', fx: { saingan: 14 }, res: 'Warung sepi dua minggu. Beberapa pelanggan lama jarang terlihat.' },
  ] },
  { id: 'd_kroni', minLevel: 1, when: { phase: 'wali', noFlag: 'nepotisme' }, who: 'Adik ipar', text: 'Adik iparmu menawarkan "perusahaan keluarga" untuk mengerjakan proyek kota. "Daripada jatuh ke orang lain, Pak. Kan lebih tenang kalau orang sendiri."', choices: [
    { t: 'Beri paketnya', fx: { jejak: 8, integ: -8, flag: 'nepotisme', money: j(25) }, res: 'Ia pulang dengan wajah cerah. Rp 25 juta "ucapan terima kasih" dikirim ke rekeningmu.' },
    { t: 'Suruh ikut lelang seperti peserta lain', fx: { integ: 2 }, res: 'Ia agak kecewa, tapi mengerti.' },
    { t: 'Tolak dan jaga jarak', fx: { trust: 1, integ: 3 }, res: 'Pesta keluarga akhir pekan itu terasa dingin.' },
  ] },
  { id: 'd_banjir_besar', minLevel: 1, when: { phase: 'wali', notDone: 'drainase' }, who: 'Banjir kota', text: 'Hujan seharian meluapkan selokan. Genangan setinggi lutut merendam pasar dan perumahan. Warga bertanya: ke mana anggaran drainase?', choices: [
    { t: 'Kerahkan pompa dan posko (Rp 70 jt)', fx: { apbd: -j(70), kota: { puas: 3, sej: -2 } }, res: 'Air surut dalam dua hari. Kritik tetap datang.', req: { apbd: j(70) } },
    { t: 'Salahkan cuaca ekstrem', fx: { kota: { puas: -7, sej: -4 }, sorotan: 5 }, res: 'Warga tidak puas dengan alasan itu.' },
  ] },
  { id: 'd_hujan_aman', minLevel: 1, when: { phase: 'wali', done: 'drainase' }, who: 'Warga kota', text: 'Hujan deras seharian, tapi kali ini tak ada genangan. Warga memuji drainase baru dan mengunggah foto jalanan yang kering di media sosial.', choices: [
    { t: 'Terima kasih, kerja bersama', fx: { kota: { puas: 3 }, duk: 2 }, res: 'Unggahan itu dibagikan ribuan kali.' },
  ] },
  { id: 'd_kriminal', minLevel: 1, when: { phase: 'wali', kerjaMax: 38 }, who: 'Kapolres', text: 'Pencurian dan begal meningkat di kota. Kapolres mengaitkan hal ini dengan tingginya pengangguran dan lampu jalan yang mati di banyak titik.', choices: [
    { t: 'Tambah patroli (Rp 25 jt)', fx: { apbd: -j(25), kota: { puas: 3 } }, res: 'Patroli malam menenangkan warga untuk sementara.', req: { apbd: j(25) } },
    { t: 'Program padat karya (Rp 60 jt)', fx: { apbd: -j(60), kota: { kerja: 5, puas: 2 } }, res: 'Ratusan penganggur mendapat pekerjaan. Angka kriminalitas turun pelan-pelan.', req: { apbd: j(60) } },
    { t: 'Tidak ada tindakan', fx: { kota: { puas: -5 } }, res: 'Warga mulai menutup toko lebih awal.' },
  ] },
  { id: 'd_inspeksi', minLevel: 1, when: { phase: 'wali', proyekJalan: true }, who: 'Sidak proyek', text: 'Kamu sidak ke proyek yang sedang berjalan. Seorang mandor berbisik bahwa semen dikurangi dan besi tidak sesuai spesifikasi. "Sudah biasa, Pak."', choices: [
    { t: 'Hentikan dan minta perbaikan', fx: { inspect: 'perbaiki', sorotan: 2 }, res: 'Pekerjaan dihentikan dan material diganti. Proyek mundur, tapi lebih kuat.' },
    { t: 'Tutup mata, minta "jatah"', fx: { money: j(30), jejak: 6, integ: -7 }, res: 'Kontraktor lega dan mengirim amplop. Mandor itu menatapmu lama.' },
    { t: 'Laporkan ke inspektorat', fx: { inspect: 'laporkan', integ: 4, sorotan: 3 }, res: 'Inspektorat turun tangan. Kontraktor kena sanksi.' },
  ] },
];
