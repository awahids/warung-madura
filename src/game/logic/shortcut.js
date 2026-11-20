import { START_STOCK } from '../data.js';
import { freshState } from '../persist.js';
import { G, setG, ui } from '../state.js';
import { SCRIPT } from '../story/events.js';
import { WARGA } from '../story/warga.js';
import { toast } from '../widgets.js';
import { startDay } from './day.js';
import { dn, initCity, initWarga, kota } from './kota.js';
import { MAX_LEVEL, xpAt } from './level.js';

/* ============================================================
   MULAI DARI BAB 9: langsung menjabat wali kota (untuk mencoba babak akhir tanpa ±70 hari permainan).
   Keadaan awal dibuat seperti pemain yang jujur dan cukup berhasil: utang lunas, warga percaya,
   usaha berjalan, menang pemilu 62%, warga lama cukup dekat. Warung tetap bisa dimainkan.
   ============================================================ */
export const BAB9_LEVEL = Math.min(MAX_LEVEL, 10);
export function startBab9() {
  setG(freshState(G));
  G.xp = xpAt(BAB9_LEVEL); G.stock = { ...START_STOCK }; G.money = 1.2e9; G.rep = 72; G.fridge = true; G.won = true;
  const s = G.story; Object.assign(s, { debt: 0, lunas: true, trust: 72, ending: 'dipercaya', chapterSeen: 8 });
  s.done = SCRIPT.filter(e => e.ch < 9).map(e => e.id);   // cerita bab 1–8 dianggap sudah dilalui
  Object.assign(s.flags, { babak_usaha: true, miliarder: true, diminta_calon: true, wali: true, beasiswa: true, buka_kerja: true });
  s.regs = s.regs || {}; for (const w of WARGA) s.regs[w.id] = { aff: 55, visits: 12, last: 0, gift: false };
  G.kota = null; const k = kota();
  Object.assign(k, { ch: 9, phase: 'wali', term: 1, biz: { cabang: 3, grosir: 2, minimarket: 1 }, ready: { cabang: 0, grosir: 0, minimarket: 0 }, duk: 12, integ: 80, tab: 'politik', result: { win: true, share: 62, score: 64, rival: 52 } });
  k.city = initCity(); initWarga(); dn().dprd = 55;
  k.lastDay = G.day;   // pagi pertama: belum ada pajak/pendapatan, langsung dilantik
  startDay(); ui.modal = null; ui.bab9Confirm = 0;
  toast('Mulai dari Bab 9: kamu baru saja dilantik jadi wali kota.', '#ffe45c');
  toast('Buka menu JEDA › USAHA & KOTA, atau tombol kamera Kota.', '#cfe8ff');
}
/** Tombol judul: minta konfirmasi bila ada simpanan (simpanan lama akan tertimpa). */
export function startBab9Clicked() {
  if (ui.hasSave && !(ui.bab9Confirm && performance.now() - ui.bab9Confirm < 4000)) { ui.bab9Confirm = performance.now(); toast('Simpanan lama akan tertimpa. Klik sekali lagi untuk mulai dari Bab 9.', '#ffd0a0'); return false; }
  startBab9(); return true;
}
