import { SFX } from '../audio.js';
import { BY, ITEMS } from '../data.js';
import { G } from '../state.js';
import { rp } from '../util.js';
import { toast } from '../widgets.js';
import { featureOn } from './level.js';
import { hasRole } from './regulars.js';

/* ============================================================
   UMUR STOK & KULKAS
   Barang tertentu punya masa simpan (item.shelf, hari). Stok dicatat per kelompok {n, day}; penjualan selalu mengambil
   yang tertua lebih dulu (FIFO). Kelompok yang melewati masa simpan dibuang tiap pagi (rugi sebesar modalnya).
   Kulkas (Lv 4, Rp 300.000) menggandakan masa simpan semua barang yang bisa basi.
   Stok diubah dari banyak tempat, jadi kelompok diselaraskan ke G.stock di titik penting (reconcile).
   ============================================================ */
export const FRIDGE_COST = 300000;
export const perishables = () => ITEMS.filter(i => i.shelf);
export const shelfOf = id => { const s = BY[id] && BY[id].shelf; return s ? Math.round(s * (G.fridge ? 2 : 1) * (hasRole('gudang') ? 1.3 : 1)) : 0; };
const batches = id => { G.batches = G.batches || {}; return G.batches[id] || (G.batches[id] = []); };

/** Samakan jumlah kelompok dengan G.stock: kelebihan → kelompok baru (hari ini); kekurangan → ambil dari yang tertua. */
export function reconcile(id) {
  if (!shelfOf(id)) return;
  const b = batches(id), cur = G.stock[id] || 0; let total = b.reduce((s, x) => s + x.n, 0);
  if (cur > total) { const last = b[b.length - 1]; if (last && last.day === G.day) last.n += cur - total; else b.push({ n: cur - total, day: G.day }); }
  else if (cur < total) { let need = total - cur; while (need > 0 && b.length) { const f = b[0]; const t = Math.min(f.n, need); f.n -= t; need -= t; if (f.n <= 0) b.shift(); } }
}
export const reconcileAll = () => perishables().forEach(it => reconcile(it.id));
/** Tambah stok dari pengiriman: kelompok baru bertanggal hari ini. */
export function stockIn(id, n) { reconcile(id); G.stock[id] = (G.stock[id] || 0) + n; reconcile(id); }
/** Sisa hari kelompok tertua (null bila tidak punya masa simpan / stok kosong). */
export function oldestLeft(id) {
  if (!shelfOf(id)) return null; reconcile(id); const f = batches(id)[0]; return f ? shelfOf(id) - (G.day - f.day) : null;
}
/** Jumlah unit yang kedaluwarsa dalam `days` hari ke depan (default: ≤ 2 hari lagi). */
export function expiringSoon(id, days = 2) { if (!shelfOf(id)) return 0; reconcile(id); return batches(id).filter(x => shelfOf(id) - (G.day - x.day) <= days).reduce((s, x) => s + x.n, 0); }
export const freshUnits = id => { reconcile(id); return batches(id).map(x => ({ n: x.n, left: shelfOf(id) - (G.day - x.day) })); };

/** Pagi hari: buang kelompok yang lewat masa simpan. Hasil: daftar kalimat kabar. */
export function expireStock() {
  const out = []; let loss = 0;
  for (const it of perishables()) {
    reconcile(it.id); const b = batches(it.id), keep = []; let gone = 0;
    for (const x of b) { if (G.day - x.day >= shelfOf(it.id)) gone += x.n; else keep.push(x); }
    if (gone) { G.batches[it.id] = keep; G.stock[it.id] = Math.max(0, (G.stock[it.id] || 0) - gone); loss += Math.round(gone * it.cost); out.push(`${gone} ${it.name} kedaluwarsa dan dibuang`); }
  }
  if (G.stats) G.stats.waste = (G.stats.waste || 0) + loss;
  const s = G.story; if (s) s.freshStreak = loss ? 0 : (s.freshStreak || 0) + 1;
  if (out.length) { out.push(`Kerugian stok basi ${rp(loss)}`); out.forEach(t => G.morning.push(t)); SFX.err(); }
  return out;
}
export function buyFridge() {
  if (G.fridge) { toast('Kulkas sudah ada.', '#fff'); return false; }
  if (!featureOn('kulkas')) { SFX.err(); toast('Kulkas terbuka di Level 4.', '#ffd0d0'); return false; }
  if (G.money < FRIDGE_COST) { SFX.err(); toast(`Uang kurang untuk beli kulkas (${rp(FRIDGE_COST)}).`, '#ffd0d0'); return false; }
  G.money -= FRIDGE_COST; if (G.stats) G.stats.spent += FRIDGE_COST; G.fridge = true; SFX.coin(); toast('Kulkas terpasang! Masa simpan barang jadi dua kali lipat.', '#9dff8c'); return true;
}
