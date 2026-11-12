
/* ---------- data barang ---------- */
export const ITEMS = [
  { id: 'kopi',    name: 'Kopi Sachet',    price: 2000,  pack: 10, packCost: 12000, spr: null },
  { id: 'rokok',   name: 'Rokok Ketengan', price: 2000,  pack: 20, packCost: 26000, spr: null },
  { id: 'bensin',  name: 'Bensin Botol',   price: 12000, pack: 5,  packCost: 50000, spr: null },
  { id: 'aqua',    name: 'Air Mineral',    price: 4000,  pack: 12, packCost: 36000, spr: 'aqua' },
  { id: 'cola',    name: 'Cola Kaleng',    price: 7000,  pack: 6,  packCost: 36000, spr: 'cola' },
  { id: 'redbull', name: 'Minuman Energi', price: 10000, pack: 6,  packCost: 54000, spr: 'redbull' },
  { id: 'mie',     name: 'Mie Instan Cup', price: 5000,  pack: 10, packCost: 30000, spr: 'mie' },
  { id: 'galon',   name: 'Galon Isi Ulang',price: 7000,  pack: 3,  packCost: 15000, spr: 'galon' },
  { id: 'gas',     name: 'Gas Melon 3 Kg', price: 25000, pack: 2,  packCost: 44000, spr: 'gas' },
  { id: 'beras',   name: 'Beras 1 Kg',     price: 15000, pack: 4,  packCost: 52000, spr: 'beras2' },
  { id: 'kerupuk', name: 'Kerupuk',        price: 1000,  pack: 20, packCost: 14000, spr: 'toples' },
  { id: 'snack',   name: 'Keripik Renteng',price: 2000,  pack: 10, packCost: 13000, spr: null },
];
export const BY = {}; ITEMS.forEach(i => { i.cost = i.packCost / i.pack; BY[i.id] = i; });
export const START_STOCK = { kopi: 15, rokok: 20, bensin: 6, aqua: 12, cola: 6, redbull: 4, mie: 8, galon: 4, gas: 3, beras: 6, kerupuk: 15, snack: 10 };

export const TYPES = {
  ojol:    { spr: 'ojol',    name: 'Bang Ojol',  patience: 26, say: ['Bang, cepetan ya, ada orderan!', 'Bang, bentar doang kok.', 'Pesenan saya dong, Bang!'],
             w: { kopi: 3, rokok: 3, bensin: 2.5, aqua: 2, snack: 1, redbull: 1.2 } },
  pemuda:  { spr: 'pemuda',  name: 'Pemuda Kampung',  patience: 36, say: ['Mas, beli ini ya.', 'Ada yang dingin nggak, Mas?', 'Buat begadang nih, Mas.'],
             w: { mie: 3, aqua: 2, cola: 2.2, snack: 2, rokok: 1.2, kerupuk: 1 } },
  cowok:   { spr: 'cowok',   name: 'Bapak Muda', patience: 34, say: ['Bang, ada nggak?', 'Biasa ya, Bang.', 'Ngopi dulu, Bang.'],
             w: { rokok: 3, kopi: 2.2, redbull: 2, bensin: 2, aqua: 1 } },
  ibu:     { spr: 'ibu',     name: 'Ibu Warga',     patience: 42, say: ['Dek, ibu mau beli...', 'Lagi ada beras, Dek?', 'Tolong ambilin ya, Nak.'],
             w: { beras: 3, galon: 3, gas: 2, kerupuk: 2, mie: 1, kopi: 1, snack: 1 } },
  juragan: { spr: 'juragan', name: 'Juragan Kampung',   patience: 46, say: ['Assalamualaikum, Nak.', 'Warungnya rame ya, alhamdulillah.', 'Pak Haji mau belanja banyak.'],
             w: { galon: 2, gas: 2, beras: 2, kopi: 2, rokok: 2, bensin: 1 } },
  pelajar: { spr: 'pemuda',  name: 'Adik Pelajar', patience: 30, say: ['Kak, beli jajan ya.', 'Istirahat bentar, Kak!', 'Kak, ada yang murah nggak?'],
             w: { snack: 3, aqua: 2.5, kerupuk: 2, mie: 1.5, cola: 1.5, kopi: .2 } },
  tukang:  { spr: 'cowok',   name: 'Tukang Bangunan', patience: 38, say: ['Capek nih, habis ngaduk semen.', 'Kopi sama rokok, Dek. Cepetan ya.', 'Istirahat siang dulu, Dek.'],
             w: { rokok: 3, kopi: 3, aqua: 2, galon: 1.5, mie: 1, bensin: 1 } },
  turis:   { spr: 'cowok',   name: 'Turis Bule', patience: 44, say: ['Excuse me, water please?', 'Hello! One cold drink, please.', 'How much is this? Cheap!'],
             w: { aqua: 3, cola: 2.5, redbull: 2, snack: 1.5, mie: 1 } },
  hoodie:  { spr: 'hoodie',  name: '???',        patience: 60, say: ['...', '(berbisik) Jam segini masih buka, ya...', '...Ada yang bisa bikin melek?'],
             w: { redbull: 3, mie: 2, rokok: 2 } },
};
export const RATE = [2.5, 3.5, 3.2, 2.2, 1.6, 2.0, 3.0, 2.6, 1.6, 1.5, 2.4, 3.4, 3.0, 2.0, 1.4, 1.2, 1.0, .8, .7, .6]; // jam 6..25
export const BILLS = [
  { v: 1000, l: '1rb', c: '#d8b94a' }, { v: 2000, l: '2rb', c: '#9aa1a8' }, { v: 5000, l: '5rb', c: '#b4783c' },
  { v: 10000, l: '10rb', c: '#8a55b8' }, { v: 20000, l: '20rb', c: '#3f9e58' }, { v: 50000, l: '50rb', c: '#3f78c4' },
];

