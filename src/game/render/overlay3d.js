import { SFX } from '../audio.js';
import { H, HUD_H, W } from '../constants.js';
import { ctx } from '../gfx.js';
import { active } from '../logic/customers.js';
import { hit } from '../sprites.js';
import { G, ui } from '../state.js';
import { T, clamp, rr } from '../util.js';
import { button } from '../widgets.js';
import { drawHUD } from './hud.js';
import { drawFloats, drawTooltip } from './index.js';
import { drawModals } from './modals.js';
import { drawBubble } from './scene.js';
import { drawTray } from './tray.js';
import { drawTitleUI } from './title.js';

/* Lapisan antarmuka transparan di atas adegan 3D: memakai ulang HUD/tray/balon/modal versi 2D. */

function stockBadge(b) {
  const n = G.stock[b.id] || 0;
  ctx.fillStyle = n === 0 ? '#d62f2f' : n <= 2 ? '#e08a1c' : '#3b2412';
  ctx.beginPath(); ctx.arc(b.x, b.y, 15, 0, 7); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#fff'; ctx.stroke();
  T(String(n), b.x, b.y + 6, { s: 16, a: 'center', c: '#fff' });
}

function doorPrompt() {
  if (G.screen !== 'play' || G.doorState !== 'closed') return;
  hit(0, HUD_H, W, H - HUD_H, () => { G.door = Math.min(1, G.door + .08); SFX.door(); }, '');
  const top = HUD_H, bob = Math.sin(ui.frame / 14) * 6;
  T(`HARI ${G.day}`, 640, top + 120, { s: 34, a: 'center', c: '#fff', stroke: 'rgba(0,0,0,.7)', sw: 6 });
  T('Tarik pintu ke atas untuk BUKA WARUNG', 640, top + 165, { s: 26, a: 'center', c: '#fff', stroke: '#2a3138', sw: 6 });
  T('(drag ke atas atau klik berkali-kali)', 640, top + 192, { s: 15, a: 'center', c: '#e8eef2', stroke: '#2a3138', sw: 4 });
  const ay = H - 170 + bob;
  ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = '#2a3138'; ctx.lineWidth = 4; ctx.beginPath();
  ctx.moveTo(640, ay - 40); ctx.lineTo(690, ay + 10); ctx.lineTo(660, ay + 10); ctx.lineTo(660, ay + 40); ctx.lineTo(620, ay + 40); ctx.lineTo(620, ay + 10); ctx.lineTo(590, ay + 10); ctx.closePath(); ctx.fill(); ctx.stroke();
  button(470, top + 230, 340, 50, 'BUKU CATATAN · Cek Stok', () => { ui.modal = 'notebook'; }, { col: 'wood', s: 16 });
  button(470, top + 290, 340, 50, 'HP · Pesan Barang ke Grosir', () => { ui.modal = 'phone'; }, { col: 'green', s: 16 });
  if (G.deliveries.length) T(`${G.deliveries.length} pesanan menunggu kurir`, 640, top + 362, { s: 14, a: 'center', c: '#fff', stroke: '#2a3138', sw: 3 });
  G.morning.forEach((m, i) => T(m, 640, top + 390 + i * 22, { s: 14, a: 'center', c: '#fff6c0', stroke: '#2a3138', sw: 3 }));
}

/**
 * Gambar semua UI di atas 3D. view = { badges: [{id,x,y}], headOf(c) → {x,y}|null, cust: [{c, key}] }.
 * Dipanggil setiap frame setelah ctx dibersihkan.
 */
export function drawOverlay3D(view) {
  if (G.screen === 'title') {
    const g = ctx.createLinearGradient(0, 0, W * .7, 0); g.addColorStop(0, 'rgba(10,6,2,.78)'); g.addColorStop(1, 'rgba(10,6,2,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    drawTitleUI();
    drawFloats();
    if (ui.modal) drawModals();
    return;
  }
  if (G.running && !ui.modal) view.badges.forEach(stockBadge);
  // kesabaran pelanggan yang antre (non-aktif)
  for (const c of G.cust) {
    if (c.idx > 0) {
      const p = view.headOf(c); if (!p) continue; const pr = clamp(c.patience / c.max, 0, 1);
      ctx.fillStyle = 'rgba(0,0,0,.5)'; rr(ctx, p.x - 30, p.y - 26, 60, 9, 4); ctx.fill();
      ctx.fillStyle = pr > .5 ? '#5ac85a' : pr > .25 ? '#f0b429' : '#e0463a'; rr(ctx, p.x - 30, p.y - 26, Math.max(5, 60 * pr), 9, 4); ctx.fill();
    }
  }
  // ucapan perpisahan pelanggan yang pergi
  for (const c of G.leaving) {
    if (c.bye && c.leaveT < 1.6) {
      const p = view.headOf(c); if (!p) continue; const w = Math.max(90, c.bye.length * 8.5);
      ctx.fillStyle = '#fffaf0'; rr(ctx, p.x - w / 2, p.y - 54, w, 30, 12); ctx.fill(); ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 2; ctx.stroke();
      T(c.bye, p.x, p.y - 33, { s: 13, a: 'center', c: '#3a2a1a' });
    }
  }
  doorPrompt();
  drawTray();
  const c = active();
  if (c && !ui.modal) {
    const p = view.headOf(c);
    drawBubble(c, p ? { x: clamp(p.x + 70, 8, W - 304), y: clamp(p.y - 30, HUD_H + 8, 250) } : undefined);
  }
  courierPrompt(view);
  drawFloats(); drawHUD(); drawTooltip();
  drawModals();
}

/** Kiriman tiba: tombol besar (berfungsi dari sudut kamera mana pun) + gelembung di atas kepala kurir bila terlihat. */
function courierPrompt(view) {
  if (!view.courierWaiting || ui.modal) return;
  const pulse = .5 + .5 * Math.sin(ui.frame / 8);
  button(14, HUD_H + 12, 236, 46, 'TERIMA KIRIMAN', () => view.acceptCourier(), { col: 'green', s: 18, tip: 'Terima barang dari kurir (tombol K)' });
  T('Kurir menunggu di depan warung', 14 + 118, HUD_H + 74, { s: 12, a: 'center', c: '#fff', stroke: 'rgba(0,0,0,.7)', sw: 3 });
  const p = view.courierHead;
  if (p && p.x > 40 && p.x < W - 40 && p.y > 90) {
    const w = 190, x = clamp(p.x - w / 2, 8, W - w - 8), y = p.y - 62 - pulse * 5;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; rr(ctx, x + 3, y + 4, w, 40, 12); ctx.fill();
    ctx.fillStyle = '#fff6d8'; rr(ctx, x, y, w, 40, 12); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#c98a1a'; ctx.stroke();
    ctx.fillStyle = '#fff6d8'; ctx.beginPath(); ctx.moveTo(p.x - 9, y + 38); ctx.lineTo(p.x, y + 52); ctx.lineTo(p.x + 9, y + 38); ctx.fill();
    T('Kiriman tiba! Klik kurir', x + w / 2, y + 26, { s: 15, a: 'center', c: '#5a3a1a' });
  }
}
