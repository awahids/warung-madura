import { SFX } from '../audio.js';
import { ITEM_LVL, addXp, featureOn, itemOn, typeOn } from './level.js';
import { W, WIN_GOAL } from '../constants.js';
import { BY, TYPES } from '../data.js';
import { isRain, missionVal } from './day.js';
import { G, mouse, ui } from '../state.js';
import { clamp, pick, ri, rp, wpick } from '../util.js';
import { flt, toast } from '../widgets.js';

export function spawnCustomer(type, ev) {
  if (G.cust.length >= 3) return false;
  if (!type) {
    const w = { ojol: 3, pemuda: 3, cowok: 2.5, ibu: 3, juragan: .8 };
    Object.assign(w, { pelajar: 2.2, tukang: 1.6, turis: .9 });
    if ((G.h >= 6.5 && G.h < 8) || (G.h >= 13 && G.h < 16)) w.pelajar *= 1.8;   // berangkat / pulang sekolah
    if (G.h >= 7 && G.h < 12) w.tukang *= 1.4;
    if (G.h >= 10 && G.h < 16 && !isRain()) w.turis *= 1.6;
    if (G.h > 20) { w.pelajar *= .15; w.turis *= .3; }
    for (const t in w) if (!typeOn(t)) delete w[t];
    if (isRain()) { w.ojol *= 1.6; w.pemuda *= .6; }
    if (G.h < 9) { w.ojol *= 1.4; w.ibu *= 1.5; }
    if (G.h > 20) { w.pemuda *= 1.5; w.ibu *= .4; }
    type = wpick(w);
  }
  const T0 = TYPES[type];
  const order = []; const map = {};
  const lines = type === 'juragan' ? ri(2, 4) : type === 'hoodie' ? ri(2, 3) : ri(1, 3);
  for (let i = 0; i < lines; i++) {
    const wi = {}; for (const k in T0.w) if (itemOn(k)) wi[k] = T0.w[k];
    const id = Object.keys(wi).length ? wpick(wi) : 'kopi'; const big = ['bensin', 'gas', 'galon', 'beras'].includes(id);
    let q = big ? (Math.random() < .2 ? 2 : 1) : id === 'rokok' ? ri(1, 4) : ri(1, 3);
    if (type === 'hoodie') q = Math.max(q, 2);
    map[id] = (map[id] || 0) + q;
  }
  for (const id in map) order.push({ id, qty: map[id] });
  const c = {
    type, name: T0.name, spr: T0.spr, order, event: ev || null, stage: 'order', given: 0,
    x: Math.random() < .5 ? -120 : W + 120, y: 0, state: 'in', patience: T0.patience, max: T0.patience,
    say: ev === 'kasbon' ? 'Bang, kasbon dulu ya, besok dibayar!' : pick(T0.say), bob: Math.random() * 7, bye: '',
  };
  recalc(c);
  G.cust.push(c); SFX.bell();
  return true;
}
export function recalc(c) {
  c.total = c.order.reduce((s, l) => s + BY[l.id].price * l.qty, 0);
  c.cost = c.order.reduce((s, l) => s + BY[l.id].cost * l.qty, 0);
  if (c.type === 'hoodie') { c.tip = ri(2, 5) * 10000; c.pay = c.total + c.tip; }
  else if ((Math.random() < .3 && c.type !== 'turis') || c.event === 'kasbon') { c.pay = c.total; }
  else {
    const bills = [5000, 10000, 20000, 50000, 100000].filter(b => b >= c.total && (c.type !== 'turis' || b >= 50000));   // turis membayar pecahan besar
    c.pay = bills.length ? bills[Math.min(bills.length - 1, Math.random() < .65 ? 0 : 1)] : Math.ceil(c.total / 50000) * 50000;
  }
  c.change = c.type === 'hoodie' ? 0 : c.pay - c.total;
}
export const active = () => G.cust.find(c => c.state === 'wait' && c.idx === 0) || null;
export function trayCount() { return Object.values(G.tray).reduce((a, b) => a + b, 0); }
export function trayMatches(c) {
  for (const l of c.order) if ((G.tray[l.id] || 0) !== l.qty) return false;
  for (const id in G.tray) if (G.tray[id] > 0 && !c.order.find(l => l.id === id)) return false;
  return true;
}
export function shortfall(c) { return c.order.some(l => (G.stock[l.id] || 0) + (G.tray[l.id] || 0) < l.qty); }
export function returnTray() { for (const id in G.tray) G.stock[id] = (G.stock[id] || 0) + G.tray[id]; G.tray = {}; }

export function addToTray(id) {
  const c = active();
  if (!c || c.stage !== 'order') { SFX.err(); toast(c ? 'Selesaikan transaksi dulu.' : 'Belum ada pembeli di depan.', '#ffd0d0'); return; }
  if (!itemOn(id)) { SFX.err(); toast(`${BY[id].name} belum dijual — terbuka di Level ${ITEM_LVL[id]}.`, '#ffd0d0'); return; }
  if ((G.stock[id] || 0) <= 0) { SFX.err(); toast(`${BY[id].name} habis! Pesan lewat HP.`, '#ffd0d0'); return; }
  G.stock[id]--; G.tray[id] = (G.tray[id] || 0) + 1; SFX.add();
  flt('+1', mouse.x, mouse.y - 10, '#fff');
}
export function removeFromTray(id) {
  if (!G.tray[id]) return; G.tray[id]--; if (!G.tray[id]) delete G.tray[id]; G.stock[id]++; SFX.rem();
}
export function doHitung() {
  const c = active(); if (!c) { SFX.err(); toast('Belum ada pembeli.', '#ffd0d0'); return; }
  if (c.stage !== 'order') return;
  if (!trayMatches(c)) { SFX.err(); toast('Belanjaan belum sesuai pesanan — cek lagi!', '#ffd0d0'); return; }
  SFX.click();
  if (c.event === 'kasbon') { c.stage = 'kasbon'; return; }
  c.stage = 'pay'; c.given = 0;
  if (c.change === 0 || (G.auto && featureOn('auto'))) { c.quick = true; if (c.change > 0) toast('Kembalian otomatis dihitung.', '#cfe8ff'); completeSale(c, c.change); }
}
export function completeSale(c, given) {
  const gain = c.pay - given;
  G.money += gain; G.stats.revenue += c.total; G.stats.profit += c.total - c.cost; G.totalProfit += c.total - c.cost;
  for (const l of c.order) G.stats.sold[l.id] = (G.stats.sold[l.id] || 0) + l.qty;
  G.stats.served++; G.energy = Math.max(0, G.energy - .8);
  const fast = c.patience / c.max > .5;
  G.rep = clamp(G.rep + (fast ? 1 : .4), 0, 100);
  c.took = true; c.carry = carryKind(c.order);
  if (c.quick && ui.mode3d) c.walkAt = 1.1 + QUICK_PAY;   // 3D: sisipkan fase terima uang (laci terbuka) sebelum menyerahkan belanjaan
  G.tray = {}; SFX.coin();
  flt('+' + rp(c.total), 640, 380, '#9dff8c');
  let tip = 0;
  if (c.type === 'hoodie') { tip = c.tip; c.bye = '"Simpan kembaliannya. Terima kasih."'; G.stats.tips += tip; toast(`Pembeli misterius meninggalkan tip ${rp(tip)}!`, '#ffe45c'); }
  else if (given === c.change && c.change > 0 && Math.random() < (c.type === 'turis' ? .65 : .25)) { tip = c.type === 'turis' ? ri(3, 8) * 1000 : ri(1, 3) * 1000; G.money += tip; G.stats.tips += tip; flt('Tip +' + rp(tip), 660, 340, '#ffe45c'); c.bye = c.type === 'turis' ? 'Thank you! Very nice!' : 'Makasih, Bang!'; }
  else c.bye = c.type === 'turis' ? 'Thank you, bye!' : c.type === 'juragan' ? 'Barakallah, Nak.' : pick(['Makasih ya!', 'Mantap, Bang!', 'Sip, makasih!']);
  if (given > c.change) toast(`Kembalian kelebihan ${rp(given - c.change)}!`, '#ffd0d0');
  addXp(10 + (fast ? 5 : 0) + (tip ? 3 : 0));
  sendAway(c);
  checkMissions(); checkWin();
}
/** Lama fase "terima uang" (detik) untuk pembayaran tanpa tahap kembalian manual — hanya animasi 3D. */
export const QUICK_PAY = 1.7;

/** Jenis bawaan pelanggan saat pulang (untuk animasi 3D): barang besar dibawa langsung, selain itu kantong kresek. */
export function carryKind(order) {
  for (const id of ['galon', 'gas', 'beras']) if (order.some(l => l.id === id)) return id;
  return 'bag';
}

export function sendAway(c) {
  c.state = 'leave'; c.leaveT = 0;
  G.cust = G.cust.filter(x => x !== c); G.leaving.push(c);
}
export function angryLeave(c, why) {
  returnTray(); G.rep = clamp(G.rep - 2, 0, 100); G.stats.left++; c.bye = why || 'Lama banget, ah!'; SFX.err();
  toast(`${c.name} pergi kecewa. Reputasi turun.`, '#ffd0d0'); sendAway(c);
}
export function doKasbon(yes) {
  const c = active(); if (!c || c.stage !== 'kasbon') return;
  if (yes) {
    G.debts.push({ who: c.name, amount: c.total, day: G.day }); G.stats.kasbonNew += c.total; G.stats.served++;
    for (const l of c.order) G.stats.sold[l.id] = (G.stats.sold[l.id] || 0) + l.qty;
    c.took = true; c.carry = carryKind(c.order);
    G.tray = {}; G.rep = clamp(G.rep + 2, 0, 100); c.bye = 'Makasih, Bang! Besok pasti dibayar.'; SFX.good();
    toast(`Kasbon ${rp(c.total)} dicatat di buku.`, '#cfe8ff'); sendAway(c); checkMissions();
  } else {
    returnTray(); G.rep = clamp(G.rep - 1, 0, 100); c.bye = 'Yah... oke deh.'; SFX.err(); sendAway(c);
  }
}
export function doHabis() {
  const c = active(); if (!c || c.stage !== 'order') return;
  const newOrder = [];
  for (const l of c.order) { const avail = (G.stock[l.id] || 0) + (G.tray[l.id] || 0); const q = Math.min(l.qty, avail); if (q > 0) newOrder.push({ id: l.id, qty: q }); }
  G.rep = clamp(G.rep - 1, 0, 100);
  if (!newOrder.length) { returnTray(); G.stats.left++; c.bye = 'Yah, habis semua...'; SFX.err(); sendAway(c); toast('Semua pesanan habis. Segera restok!', '#ffd0d0'); return; }
  // buang yang berlebih di tray
  for (const id in G.tray) { const l = newOrder.find(x => x.id === id); const keep = l ? l.qty : 0; if (G.tray[id] > keep) { G.stock[id] += G.tray[id] - keep; G.tray[id] = keep; if (!keep) delete G.tray[id]; } }
  c.order = newOrder; recalc(c); c.say = 'Ya udah, yang ada aja deh.'; SFX.err();
  toast('Pesanan disesuaikan dengan stok. Reputasi sedikit turun.', '#ffd0d0');
}
export function giveBill(v, c) { if (c.stage === 'pay') { c.given += v; SFX.coin(); } }
export function confirmChange() {
  const c = active(); if (!c || c.stage !== 'pay') return;
  if (c.given < c.change) { SFX.err(); toast('Kembalian masih kurang!', '#ffd0d0'); return; }
  completeSale(c, c.given);
}
export function checkMissions() {
  for (const m of G.missions) if (!m.done && missionVal(m) >= m.target) { m.done = true; SFX.good(); toast(`Misi selesai: ${m.text}! +40 XP`, '#9dff8c'); addXp(40); }
}
export function checkWin() { if (!G.won && G.money >= WIN_GOAL) { G.won = true; ui.modal = 'win'; SFX.good(); } }

