import { SFX } from '../audio.js';
import { G } from '../state.js';
import { flt, toast } from '../widgets.js';

/* ============================================================
   LEVEL JURAGAN: XP dari melayani pembeli & menyelesaikan misi.
   Naik level → bonus kas, diskon grosir, dan kurir lebih cepat.
   ============================================================ */
export const MAX_LEVEL = 20;
/** Total XP untuk mencapai level L (L=2 → 100, L=3 → 300, L=4 → 600 …). */
export const xpAt = L => 50 * (L - 1) * L;
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

export function addXp(n) {
  if (!n) return;
  const before = level(); G.xp = (G.xp || 0) + n; if (G.stats) G.stats.xp = (G.stats.xp || 0) + n;
  const after = level();
  for (let L = before + 1; L <= after; L++) {
    G.money += levelBonus(L); if (G.stats) G.stats.bonus += levelBonus(L);
    SFX.good(); toast(`NAIK LEVEL ${L} — ${rankOf(L)}! Bonus Rp ${levelBonus(L).toLocaleString('id-ID')}`, '#ffe45c'); flt('LEVEL ' + L + '!', 640, 300, '#ffe45c');
  }
}
