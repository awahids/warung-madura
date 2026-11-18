/* ============================================================
   WARGA LAMA & PAK HAJI DI FASE WALI KOTA (data murni; mesin di logic/kota.js)
   Orang-orang dari warung kini merasakan langsung keputusanmu. Suasana hati (0–100) tiap warga
   naik bila proyek yang mereka butuhkan selesai, turun bila kamu mengambil fee, proyek rusak, atau janji diingkari.
   Pak Haji adalah kompas: teleponnya berubah nada mengikuti integritasmu.
   Efek tambahan (fx): warga { id: ±n }, haji ±n, janji { who, proj }.
   Syarat tambahan (when): wargaMin { id: n }, wargaMax { id: n }, feesMin, feesMax.
   ============================================================ */
export const WARGA = [
  { id: 'sri', name: 'Bu Sri', role: 'Ibu di gang belakang', wants: ['jalan', 'drainase'] },
  { id: 'jaka', name: 'Bang Jaka', role: 'Pengemudi ojek', wants: ['jalan'], fears: ['angkot'] },
  { id: 'rani', name: 'Rani', role: 'Mahasiswi, relawan antikorupsi', wants: ['sekolah'], watchdog: true },
  { id: 'darto', name: 'Pak Darto', role: 'Mandor bangunan', wants: ['industri', 'pasar'] },
  { id: 'wati', name: 'Bu Wati', role: 'Kader posyandu', wants: ['puskesmas', 'tpa'] },
];
export const HAJI_DAYS = [5, 15, 25];
export const BEASISWA = 5e6, JALAN_M = 1.5e6;     // pembanding "korban": satu beasiswa, satu meter jalan gang

/** Kalimat warga lama saat belanja di warung (mereka tidak tahu kamu wali kotanya... atau pura-pura tidak tahu). */
export const TALK = {
  sri: { need: 'Jalan gang masih bolong, Dek. Kapan ya?', got: 'Jalan gang sudah mulus, alhamdulillah!', sad: 'Wali kota sekarang lupa sama gang kecil...' },
  jaka: { need: 'Jalan rusak, ban motor bocor terus, Nak.', got: 'Narik sekarang enak, jalannya mulus.', sad: 'Rezeki ojek makin seret, Nak.' },
  rani: { need: 'Kak, sekolah gratis jadi dibangun nggak?', got: 'Kak, sekolah gratisnya keren banget!', sad: 'Kak, aku lagi nyelidikin kontrak kota...' },
  darto: { need: 'Anak buah saya masih nganggur, Dek.', got: 'Proyek kota bikin anak buah saya kerja.', sad: 'Proyek kota cuma buat kontraktor dekat.' },
  wati: { need: 'Puskesmas jauh, Nak, balita pada batuk.', got: 'Puskesmas baru dekat, ibu-ibu lega.', sad: 'Ibu-ibu kecewa sama wali kota, Nak.' },
};
/** Obrolan pembeli biasa tentang kota (disusun dari keadaan kota). */
export const CITY_TALK = {
  jejak: ['Dengar-dengar proyek kota di-mark-up, ya?', 'Katanya kontraktornya kenalan wali kota.'],
  rusak: ['Bangunan baru kok sudah rusak, ya?'],
  harga: ['Harga beras naik lagi, pusing.', 'Minyak goreng mahal sekarang.'],
  kotor: ['Sampah numpuk di mana-mana.'],
  bagus: ['Kota sekarang makin enak, ya.', 'Wali kota yang sekarang kerjanya kelihatan.'],
  taman: ['Taman kota baru enak buat sore-sore.'],
};

const j = n => n * 1e6;
export const WARGA_POOL = [
  { id: 'ww_sri_gang', minLevel: 1, forceOnly: true, warga: 'sri', when: { phase: 'wali', notDone: 'jalan' }, who: 'Bu Sri', text: 'Bu Sri datang ke balai kota dengan sandal jepit dan map lusuh. "Dek, eh... Pak Wali. Jalan gang kami bolong. Rani jatuh dari motor minggu lalu. Kapan diperbaiki?"', choices: [
    { t: 'Janji: jalan jadi prioritas', fx: { warga: { sri: 8 }, janji: { who: 'sri', proj: 'jalan' } }, res: 'Bu Sri menggenggam tanganmu. "Ibu percaya, Dek. Seperti dulu di warung."' },
    { t: 'Tambal darurat (Rp 15 jt kas kota)', fx: { apbd: -j(15), warga: { sri: 5 }, kota: { puas: 1 } }, res: 'Lubang terbesar ditambal sore itu juga.', req: { apbd: j(15) } },
    { t: 'Anggaran terbatas, mohon sabar', fx: { warga: { sri: -6 } }, res: 'Bu Sri mengangguk pelan dan pulang naik angkot.' },
  ] },
  { id: 'ww_sri_terima', minLevel: 1, forceOnly: true, warga: 'sri', when: { phase: 'wali', done: 'jalan', wargaMin: { sri: 50 } }, who: 'Bu Sri', text: 'Bu Sri mampir ke balai kota membawa rantang. "Jalan gang sudah mulus, Dek. Rani bisa ke kampus tanpa takut jatuh. Ini ibu masakin, jangan lupa makan."', choices: [
    { t: 'Terima rantangnya dengan haru', fx: { warga: { sri: 5 }, energy: 15, trust: 2 }, res: 'Rasanya persis masakan yang dulu sering dibawa ke warung.' },
  ] },
  { id: 'ww_jaka_angkot', minLevel: 1, forceOnly: true, warga: 'jaka', when: { phase: 'wali', notDone: 'angkot' }, who: 'Bang Jaka', text: 'Bang Jaka memimpin puluhan pengemudi ojek ke balai kota. "Nak, katanya mau ada angkot listrik. Kami makan dari jalanan. Jangan matikan rezeki kami."', choices: [
    { t: 'Libatkan ojek sebagai pengumpan halte', fx: { flag: 'ojek_dilibatkan', warga: { jaka: 10 }, kota: { kerja: 2 } }, res: 'Bang Jaka tertawa lega. "Itu baru Nak yang Abang kenal!"' },
    { t: 'Janji: angkot tidak dibangun', fx: { flag: 'angkot_ditunda', warga: { jaka: 8 } }, res: 'Para ojek bersorak. Janji itu akan diingat.' },
    { t: 'Kota harus maju, Bang', fx: { warga: { jaka: -10 } }, res: 'Bang Jaka menatapmu lama, lalu pergi tanpa pamit.' },
  ] },
  { id: 'ww_rani_data', minLevel: 1, forceOnly: true, warga: 'rani', when: { phase: 'wali', feesMin: 1 }, who: 'Rani', text: 'Rani, kini mahasiswi dan relawan antikorupsi, datang membawa tabel kontrak. "Kak... maaf, Pak Wali. Selisih harga tender ini besar sekali. Aku tidak mau percaya Kakak terlibat."', choices: [
    { t: 'Akui dan kembalikan semua fee', fx: { returnFees: 1, integ: 6, warga: { rani: 15 }, sorotan: 6 }, res: 'Rani menangis. "Terima kasih sudah jujur, Kak." Ia menutup map itu.' },
    { t: 'Tawari beasiswa S2 agar diam (Rp 30 jt)', fx: { money: -j(30), jejak: 8, integ: -10, warga: { rani: -30 } }, res: 'Rani berdiri. "Dulu Kakak yang ajari aku jujur." Ia pergi membawa mapnya.', req: { money: j(30) } },
    { t: 'Bilang itu fitnah', fx: { warga: { rani: -20 }, sorotan: 8, jejak: 3 }, res: 'Rani mengangguk pelan. Minggu depan datanya muncul di media.' },
  ] },
  { id: 'ww_rani_bangga', minLevel: 1, forceOnly: true, warga: 'rani', when: { phase: 'wali', done: 'sekolah', feesMax: 0 }, who: 'Rani', text: 'Rani mengajak teman-teman kampusnya ke balai kota. "Ini wali kota yang dulu kasih jajan gratis waktu ibuku sakit. Sekolah gratisnya beneran jalan, dan kontraknya bersih!"', choices: [
    { t: 'Tersenyum dan beri semangat', fx: { warga: { rani: 6 }, duk: 2, kota: { puas: 2 } }, res: 'Foto bersama itu dibagikan ribuan kali.' },
  ] },
  { id: 'ww_darto_kerja', minLevel: 1, forceOnly: true, warga: 'darto', when: { phase: 'wali', kerjaMax: 55 }, who: 'Pak Darto', text: 'Pak Darto berdiri di depan meja dengan helm proyek di tangan. "Pak Wali, anak buah saya nganggur sejak proyek mal selesai. Ada pekerjaan kota yang bisa kami pegang?"', choices: [
    { t: 'Silakan ikut lelang terbuka', fx: { warga: { darto: 4 }, integ: 1 }, res: '"Siap, Pak. Kami ikut aturan."' },
    { t: 'Titipkan ke kontraktor dekat', fx: { warga: { darto: 10 }, jejak: 4, integ: -4 }, res: 'Anak buahnya dapat kerja besok. Kontraktor itu kini merasa berutang budi.' },
    { t: 'Belum ada, Pak', fx: { warga: { darto: -8 } }, res: 'Pak Darto memakai helmnya lagi dan pamit.' },
  ] },
  { id: 'ww_wati_sehat', minLevel: 1, forceOnly: true, warga: 'wati', when: { phase: 'wali', notDone: 'puskesmas' }, who: 'Bu Wati', text: 'Bu Wati, kader posyandu, membawa daftar balita yang sakit. "Nak, banyak yang batuk dan diare. Puskesmas terdekat dua jam naik angkot."', choices: [
    { t: 'Janji: puskesmas segera dibangun', fx: { warga: { wati: 8 }, janji: { who: 'wati', proj: 'puskesmas' } }, res: 'Bu Wati mencatat janjimu di buku posyandu.' },
    { t: 'Kirim mobil klinik (Rp 20 jt)', fx: { apbd: -j(20), warga: { wati: 6 }, kota: { sej: 1 } }, res: 'Mobil klinik datang tiap minggu ke kampung.', req: { apbd: j(20) } },
    { t: 'Belum bisa, Bu', fx: { warga: { wati: -8 } }, res: 'Bu Wati menutup bukunya pelan-pelan.' },
  ] },
  /* Pak Haji: nada telepon mengikuti integritas & jejak */
  { id: 'h_baik', minLevel: 1, forceOnly: true, who: 'Pak Haji (telepon)', when: { phase: 'wali' }, text: 'Telepon dari Pak Haji. Suaranya makin lemah tapi hangat. "Nak, Bu Sri cerita kamu masih menyapa orang di pasar. Itu yang paling Bapak syukuri."', choices: [
    { t: 'Terima kasih, Pak. Doakan saya', fx: { haji: 8, energy: 15 }, res: '"Selalu, Nak. Selalu."' },
    { t: '"Pak, godaannya berat sekali."', fx: { haji: 6, integ: 3 }, res: '"Berat itu tanda kamu masih punya hati. Pegang itu."' },
  ] },
  { id: 'h_ragu', minLevel: 1, forceOnly: true, who: 'Pak Haji (telepon)', when: { phase: 'wali' }, text: 'Pak Haji menelepon, lama diam sebelum bicara. "Nak, Bapak dengar ada kontraktor yang dekat sekali denganmu. Benar?"', choices: [
    { t: 'Jujur: iya, Pak. Akan saya perbaiki', fx: { haji: 5, integ: 4 }, res: '"Mengaku itu separuh perbaikan. Separuhnya lagi, kerjakan."' },
    { t: '"Itu cuma gosip, Pak."', fx: { haji: -10 }, res: '"Semoga, Nak. Semoga." Suaranya tidak percaya.' },
    { t: '"Bapak tidak paham politik."', fx: { haji: -18, integ: -3 }, res: 'Sambungan hening lama. "Mungkin kamu benar." Lalu ditutup.' },
  ] },
  { id: 'h_kecewa', minLevel: 1, forceOnly: true, who: 'Pak Haji (telepon)', when: { phase: 'wali' }, text: 'Telepon Pak Haji kali ini pendek. "Nak, warung itu Bapak titipkan untuk melayani. Kalau kamu sudah lupa, jangan pulang dulu." Lalu sambungan terputus.', choices: [
    { t: 'Telepon balik dan minta maaf', fx: { haji: 6, integ: 3 }, res: 'Ia mengangkat di dering ketujuh. "Bapak dengar. Buktikan."' },
    { t: 'Diamkan saja', fx: { haji: -12 }, res: 'Nomor Pak Haji tidak menelepon lagi minggu itu.' },
  ] },
  { id: 'h_fee', minLevel: 1, forceOnly: true, who: 'Malam itu', when: { phase: 'wali' }, text: 'Notifikasi di ponsel: transfer fee dari kontraktor sudah masuk. Lalu ada pesan lain, dari Pak Haji: "Nak, sudah makan? Bapak kangen kopi warung."', choices: [
    { t: 'Balas: "Sudah, Pak."', fx: {}, res: 'Kamu menatap dua notifikasi itu lama sekali.' },
    { t: 'Kembalikan fee itu besok pagi', fx: { returnFees: 1, integ: 5, haji: 5 }, res: 'Pagi-pagi kamu menyetor kembali uang itu ke kas kota. Rasanya ringan.' },
  ] },
];

/** Penutup per tokoh di akhir masa jabatan. */
export const EPI = {
  haji: { hi: 'Pak Haji duduk di bangku teras warung lama, menunggumu pulang membawa kopi.', mid: 'Pak Haji menyalamimu tanpa banyak bicara.', lo: 'Pak Haji tidak datang. Kursinya di teras warung lama kosong.' },
  sri: { hi: 'Bu Sri lewat jalan gang yang mulus setiap pagi dan selalu mampir menyapa.', lo: 'Bu Sri tidak lagi mampir ke warungmu.' },
  jaka: { hi: 'Bang Jaka dan teman-teman ojeknya menggelar syukuran kecil untukmu.', lo: 'Bang Jaka memalingkan muka bila berpapasan denganmu.' },
  rani: { hi: 'Rani menulis skripsi tentang kota yang bersih, dan menyebut namamu di ucapan terima kasih.', lo: 'Rani bersaksi di sidang tentang kontrak-kontrak kota.' },
  darto: { hi: 'Anak buah Pak Darto kini punya pekerjaan tetap.', lo: 'Pak Darto pindah kerja ke kota lain.' },
  wati: { hi: 'Bu Wati mencatat: tak ada lagi balita yang harus dibawa dua jam ke puskesmas.', lo: 'Buku posyandu Bu Wati masih penuh janji yang belum ditepati.' },
};
