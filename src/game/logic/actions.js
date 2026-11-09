import { SFX } from '../audio.js';
import { BY, ITEMS } from '../data.js';
import { active } from './customers.js';
import { save } from '../persist.js';
import { G } from '../state.js';
import { rp } from '../util.js';
import { flt, toast } from '../widgets.js';

/* ---- kegiatan pemain ---- */
export function usePhone() {
  if (G.phoneCd > 0) return; G.phoneCd = .15; SFX.phone();
  G.energy = Math.min(100, G.energy + 2.2);
  flt('+energi', 940, 560, '#8fd0ff');
  const c = active(); if (c) { c.patience -= 1.6; if (Math.random() < .12) toast('Pembeli sebel kamu main HP terus…', '#ffd0d0'); }
}
export function drinkKopi() {
  if (G.drinkCd > 0) return;
  if ((G.stock.kopi || 0) <= 0) { SFX.err(); toast('Kopi sachet habis, nggak bisa ngopi.', '#ffd0d0'); return; }
  if (G.energy > 92) { toast('Masih segar, belum perlu ngopi.', '#fff'); return; }
  G.stock.kopi--; G.energy = Math.min(100, G.energy + 18); G.drinkCd = 6; SFX.gulp(); flt('+18 energi', 1010, 560, '#8fd0ff');
}
export function receiveDelivery() {
  const d = G.deliveries.find(x => G.abs >= x.eta); if (!d) return;
  const parts = [];
  for (const id in d.items) { G.stock[id] = (G.stock[id] || 0) + d.items[id]; parts.push(`${d.items[id]} ${BY[id].name}`); }
  G.deliveries = G.deliveries.filter(x => x !== d); SFX.good(); toast('Barang diterima: ' + parts.join(', '), '#cfe8ff'); save();
}
export function usePromo() {
  if (G.promo) { toast('Promo hari ini sudah aktif.', '#fff'); return; }
  if (G.money < 20000) { SFX.err(); toast('Uang kurang untuk pasang promo (Rp 20.000).', '#ffd0d0'); return; }
  G.money -= 20000; G.stats.spent += 20000; G.promo = true; SFX.good(); toast('Promo dipasang! Pembeli lebih ramai hari ini.', '#9dff8c');
}
export function orderCost() { return ITEMS.reduce((s, i) => s + (G.cart[i.id] || 0) * i.packCost, 0); }
export function placeOrder() {
  const cost = orderCost(); if (!cost) { SFX.err(); return; }
  if (cost > G.money) { SFX.err(); toast('Uang tidak cukup untuk pesanan ini.', '#ffd0d0'); return; }
  const items = {}; for (const i of ITEMS) if (G.cart[i.id]) items[i.id] = G.cart[i.id] * i.pack;
  G.money -= cost; G.stats.spent += cost; G.deliveries.push({ items, eta: G.abs + 90 }); G.cart = {};
  SFX.coin(); toast(`Pesanan ${rp(cost)} dikirim. Kurir tiba ± 1,5 jam.`, '#cfe8ff'); save();
}

