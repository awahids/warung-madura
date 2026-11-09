import { H, W } from '../constants.js';
import { ctx } from '../gfx.js';
import { startDay } from '../logic/day.js';
import { freshState, loadSave } from '../persist.js';
import { SP } from '../sprites.js';
import { G, setG, ui } from '../state.js';
import { T } from '../util.js';
import { button } from '../widgets.js';

export function drawTitle() {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5aa8e8'); g.addColorStop(.6, '#cfeaff'); g.addColorStop(1, '#f0d9a0');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 5; i++) { const cx = (i * 300 + ui.frame * .15) % (W + 200) - 100, cy = 60 + (i * 53) % 130; ctx.beginPath(); ctx.ellipse(cx, cy, 70, 22, 0, 0, 7); ctx.ellipse(cx + 40, cy - 10, 50, 22, 0, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#9a9a94'; ctx.fillRect(0, 560, W, 160); ctx.fillStyle = '#b3b2aa'; ctx.fillRect(0, 556, W, 6);
  SP('tree', 1210, 290, 1.4, .5, 0);
  SP('warung', 900, 585, 1.85, .5, 1);
  SP('esteh', 560, 600, .75, .5, 1);
  // judul
  const ty = 150 + Math.sin(ui.frame / 40) * 3;
  T('JURAGAN', 60, ty, { s: 96, c: '#ffd23a', stroke: '#7a1d10', sw: 14, w: '900' });
  T('WARUNG', 60, ty + 92, { s: 96, c: '#fff', stroke: '#7a1d10', sw: 14, w: '900' });
  T('Simulasi Warung Madura 24 Jam', 66, ty + 134, { s: 24, c: '#fff', stroke: '#2a3a5a', sw: 5 });
  button(66, 340, 300, 62, 'MAIN BARU', () => { setG(freshState(G)); startDay(); ui.modal = null; }, { col: 'green', s: 26 });
  button(66, 418, 300, 54, 'LANJUTKAN', () => { const s = loadSave(); if (!s) return; setG(freshState(G)); Object.assign(G, { day: s.day, money: s.money, rep: s.rep, stock: s.stock, debts: s.debts || [], deliveries: [], totalProfit: s.totalProfit || 0, won: !!s.won, sound: s.sound !== false, auto: !!s.auto }); G.deliveries = (s.deliveries || []).map(d => ({ items: d.items, eta: 0 })); G.firstCust = false; startDay(true); G.deliveries.forEach(d => d.eta = G.abs + 30); ui.modal = null; }, { col: 'blue', s: 22, disabled: !ui.hasSave });
  button(66, 486, 300, 50, 'CARA MAIN', () => { ui.modal = 'help'; }, { col: 'wood', s: 20 });
  // karakter
  const cs = ['juragan', 'ibu', 'ojol', 'pemuda', 'cowok', 'hoodie'];
  cs.forEach((n, i) => SP(n, 100 + i * 118 + 560 * 0, 720 + Math.sin(ui.frame / 20 + i) * 2, .52, .5, 1));
  T('Klik MAIN BARU untuk mulai', 66, 600, { s: 15, c: '#4a3a2a', w: '600' });
}

