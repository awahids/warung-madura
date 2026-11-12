import { SFX } from '../audio.js';
import { BY, START_STOCK, TYPES } from '../data.js';
import { G } from '../state.js';
import { flt, toast } from '../widgets.js';

/* ============================================================
   LEVEL JURAGAN: XP dari melayani pembeli & menyelesaikan misi.
   Naik level → bonus kas, diskon grosir, dan kurir lebih cepat.
   ============================================================ */
export const MAX_LEVEL = 20;
/** Total XP untuk mencapai level L (L=2 → 200, L=3 → 600, L=4 → 1200 …). Satu bab ≈ beberapa hari. */
export const xpAt = L => 100 * (L - 1) * L;
export const levelOf = xp => { let L = 1; while (L < MAX_LEVEL && xp >= xpAt(L + 1)) L++; return L; };
export const level = () => levelOf(G.xp || 0);
const RANKS = ['Pemula', 'Penjaga Warung', 'Pedagang Kecil', 'Pedagang Handal', 'Juragan Muda', 'Juragan', 'Juragan Besar', 'Raja Warung'];
export const rankOf = L => RANKS[Math.min(RANKS.length - 1, Math.floor((L - 1) / 3))];
/** Diskon harga paket dari grosir: 2% per level, maks 20%. */
export const discountOf = L => Math.min(.2, .02 * (L - 1));
/** Lama kurir mengantar (menit game): 90 → min 45. */
export const etaOf = L => Math.max(45, 90 - 4 * (L - 1));
export const levelBonus = L => 10000 * L;
/** Kemajuan menuju level berikutnya, 0..1 (1 jika sudah maksimal). */
export function progress() {
  const L = level(); if (L >= MAX_LEVEL) return 1;
  return (G.xp - xpAt(L)) / (xpAt(L + 1) - xpAt(L));
}

/* ---------- yang dibuka tiap level ---------- */
export const ITEM_LVL = { kopi: 1, rokok: 1, aqua: 1, mie: 1, snack: 1, kerupuk: 1, cola: 2, bensin: 3, galon: 4, redbull: 5, beras: 6, gas: 8 };
export const TYPE_LVL = { ojol: 1, pemuda: 1, cowok: 1, ibu: 2, pelajar: 3, juragan: 4, tukang: 5, hoodie: 6, turis: 7 };
export const FEATURE_LVL = { promo: 2, kasbon: 3, reorder: 5, auto: 6, express: 8 };
export const FEATURE_NAME = { promo: 'Promo warung', kasbon: 'Kasbon pelanggan', reorder: 'Pesan ulang di HP', auto: 'Kembalian otomatis', express: 'Kurir ekspres (30 mnt)' };
export const itemOn = id => level() >= (ITEM_LVL[id] || 1);
export const typeOn = t => level() >= (TYPE_LVL[t] || 1);
export const featureOn = f => level() >= (FEATURE_LVL[f] || 1);
/** Daftar pembukaan di level L: [{ k: 'Barang'|'Pembeli'|'Fitur', text }]. */
export function unlocksAt(L) {
  const out = [];
  for (const id in ITEM_LVL) if (ITEM_LVL[id] === L) out.push({ k: 'Barang', text: BY[id].name });
  for (const t in TYPE_LVL) if (TYPE_LVL[t] === L) out.push({ k: 'Pembeli', text: TYPES[t].name === '???' ? 'Tamu misterius' : TYPES[t].name });
  for (const f in FEATURE_LVL) if (FEATURE_LVL[f] === L) out.push({ k: 'Fitur', text: FEATURE_NAME[f] });
  return out;
}
export const UNLOCK_LEVELS = [...new Set([...Object.values(ITEM_LVL), ...Object.values(TYPE_LVL), ...Object.values(FEATURE_LVL)])].filter(l => l > 1).sort((a, b) => a - b);

export function addXp(n) {
  if (!n) return;
  const before = level(); G.xp = (G.xp || 0) + n; if (G.stats) G.stats.xp = (G.stats.xp || 0) + n;
  const after = level();
  for (let L = before + 1; L <= after; L++) {
    G.money += levelBonus(L); if (G.stats) G.stats.bonus += levelBonus(L);
    SFX.good(); toast(`NAIK LEVEL ${L} — ${rankOf(L)}! Bonus Rp ${levelBonus(L).toLocaleString('id-ID')}`, '#ffe45c'); flt('LEVEL ' + L + '!', 640, 300, '#ffe45c');
    for (const id in ITEM_LVL) if (ITEM_LVL[id] === L && !(G.stock[id] > 0)) G.stock[id] = START_STOCK[id] || 0;   // stok perkenalan barang baru
    const u = unlocksAt(L); if (u.length) toast('Terbuka: ' + u.map(x => x.text).join(', '), '#cfe8ff');
  }
}
