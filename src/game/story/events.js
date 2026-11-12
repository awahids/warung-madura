/* ============================================================
   DATA CERITA (data murni — mesinnya ada di logic/story.js)
   Efek (fx): money, trust, rep, energy, xp, stock {id: ±n}, flag, debt (±), dueShift (hari), kasbon {who, amount}
   later: [{ days, text, fx, chance?, elseText?, elseFx? }] — kabar lanjutan di pagi hari berikutnya
   req: { money, stock } — pilihan dinonaktifkan bila tidak terpenuhi
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
    { t: 'Terima, bayar akhir minggu', fx: { stock: { aqua: -12, mie: -8 }, trust: 1 }, res: 'Pak Darto menepuk pundakmu. "Nanti saya ingat, Dek."', req: { stock: { aqua: 12, mie: 8 } },
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
];
