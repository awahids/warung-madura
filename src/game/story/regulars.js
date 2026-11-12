/* ============================================================
   PELANGGAN TETAP (data murni — logika di logic/regulars.js)
   Tiap tokoh: tipe pembeli di game, penampilan 3D (look = indeks variasi), kesukaan (bobot barang),
   kalimat sapaan (say) dan sapaan akrab (akrab, mulai tingkat Akrab), hadiah saat jadi Sahabat (reward.fx, sintaks sama dengan efek cerita).
   ============================================================ */
export const TIERS = ['Asing', 'Kenal', 'Akrab', 'Sahabat'];
export const TIER_AT = [0, 25, 50, 75];      // kedekatan minimal tiap tingkat
export const START_AFF = 20;

export const REGULARS = [
  { id: 'jaka', name: 'Bang Jaka', type: 'ojol', look: 0, fav: { kopi: 3, bensin: 2.5, rokok: 2 },
    say: ['Kopi satu dong, Nak!', 'Biasa ya, Nak, cepat, ada orderan.'], akrab: ['Nak, warungmu tempat paling betah buat istirahat.', 'Bang Jaka datang! Kopimu paling pas.'],
    reward: { text: 'Bang Jaka mengajak teman-teman ojolnya mampir. Warungmu makin dikenal.', fx: { rep: 8, trust: 2 } } },
  { id: 'sri', name: 'Bu Sri', type: 'ibu', look: 0, fav: { beras: 3, kerupuk: 2, mie: 1.5, kopi: 1 },
    say: ['Dek, ibu mau beli beras...', 'Tolong ambilkan ya, Nak.'], akrab: ['Dek, Rani titip salam. Dia bilang jajan dari warungmu paling enak.', 'Ibu masakin lebih, nanti ibu bawakan, Dek.'],
    reward: { text: 'Bu Sri membawakan sekeranjang kerupuk buatannya untuk stok warung.', fx: { stock: { kerupuk: 10 }, trust: 3 } } },
  { id: 'wati', name: 'Bu Wati', type: 'ibu', look: 1, fav: { galon: 3, gas: 2, beras: 1.5, mie: 1 },
    say: ['Permisi, Nak, galon ada?', 'Gas melon masih ada, Nak?'], akrab: ['Nak, titip salam buat Pak Haji ya, semoga sehat.', 'Ibu sering cerita ke tetangga tentang warungmu, Nak.'],
    reward: { text: 'Bu Wati menitipkan kue buatannya untuk dijual di warung.', fx: { money: 30000, trust: 3 } } },
  { id: 'dimas', name: 'Mas Dimas', type: 'pemuda', look: 0, fav: { mie: 3, aqua: 2, cola: 2, snack: 2 },
    say: ['Mie cup satu, Bang. Mau begadang.', 'Ada yang dingin nggak, Bang?'], akrab: ['Bang, aku bikin desain menu buat warungmu, mau lihat?', 'Skripsiku hampir kelar, Bang. Makasih mienya!'],
    reward: { text: 'Mas Dimas membuatkan papan menu digital dan menyebarkannya di media sosial.', fx: { rep: 6, xp: 40 } } },
  { id: 'rizky', name: 'Bang Rizky', type: 'cowok', look: 0, fav: { rokok: 3, kopi: 2.5, redbull: 2, bensin: 1.5 },
    say: ['Biasa, Bang.', 'Rokok sama kopi ya, Bang.'], akrab: ['Bang, aku sudah kerja lagi. Semua gara-gara kamu dengerin aku dulu.', 'Hari ini aku yang traktir, Bang.'],
    reward: { text: 'Rizky menerima gaji pertamanya dan mentraktirmu makan. Energimu pulih.', fx: { energy: 30, trust: 2 } } },
  { id: 'rani', name: 'Adik Rani', type: 'pelajar', look: 1, fav: { snack: 3, aqua: 2, kerupuk: 2, mie: 1 },
    say: ['Kak, jajan seribuan ada?', 'Kak, ibu titip beli ini.'], akrab: ['Kak! Aku dapat nilai bagus hari ini!', 'Kak, makasih ya dulu waktu ibu sakit.'],
    reward: { text: 'Rani juara kelas dan membagikan hadiahnya ke warung. Warga ikut bangga.', fx: { xp: 50, trust: 3 } } },
  { id: 'darto', name: 'Pak Darto', type: 'tukang', look: 0, fav: { rokok: 3, kopi: 3, aqua: 2, galon: 1.5 },
    say: ['Capek nih, Dek. Kopi sama rokok.', 'Istirahat siang dulu, Dek.'], akrab: ['Dek, proyekku lancar. Pekerja minta kopi tiap pagi dari warungmu.', 'Pak Darto datang bawa kabar baik, Dek!'],
    reward: { text: 'Pak Darto menjadikan warungmu langganan tetap proyeknya. Pesanan mingguan masuk.', fx: { money: 80000, trust: 2 } } },
  { id: 'hasan', name: 'Pak Hasan', type: 'juragan', look: 1, fav: { galon: 2.5, gas: 2, beras: 2, rokok: 2 },
    say: ['Assalamualaikum, Nak. Belanja bulanan.', 'Pak Hasan mau belanja banyak.'], akrab: ['Nak, warungmu sudah seperti warung Pak Haji dulu.', 'Alhamdulillah, rezeki warung ini lancar ya, Nak.'],
    reward: { text: 'Pak Hasan memperkenalkan warungmu ke arisan bapak-bapak sekampung.', fx: { rep: 8, money: 50000 } } },
  { id: 'tom', name: 'Mister Tom', type: 'turis', look: 0, fav: { aqua: 3, cola: 2.5, redbull: 2, snack: 1.5 },
    say: ['Hello! Cold water, please!', 'Hi! One cola, please.'], akrab: ['My friend! Your shop is my favorite in Indonesia!', 'Hello again! I bring my friends!'],
    reward: { text: 'Tom menulis ulasan tentang warungmu di internet. Turis mulai berdatangan.', fx: { rep: 10, xp: 40 } } },
];
