import { SFX } from '../audio.js';
import { H, HUD_H, W } from '../constants.js';
import { ctx } from '../gfx.js';
import { SP, hit } from '../sprites.js';
import { G, ui } from '../state.js';
import { T, rr } from '../util.js';
import { button } from '../widgets.js';

export function drawDoor() {
  if (G.door >= 1 || G.doorState === 'open') return;
  const top = HUD_H, yb = top + (H - top) * (1 - G.door);
  const g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#8f98a1'); g.addColorStop(.5, '#b7c0c8'); g.addColorStop(1, '#8f98a1');
  ctx.fillStyle = g; ctx.fillRect(0, top, W, yb - top);
  ctx.strokeStyle = 'rgba(40,50,60,.35)'; ctx.lineWidth = 2; for (let y = top + 16; y < yb; y += 18) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,.12)'; for (let y = top + 8; y < yb; y += 36) ctx.fillRect(0, y, W, 4);
  ctx.fillStyle = '#5e6770'; ctx.fillRect(0, yb - 16, W, 16);
  ctx.fillStyle = '#2f353b'; rr(ctx, 590, yb - 28, 100, 22, 8); ctx.fill();
  const act = G.doorState === 'closed'; if (!act) return;
  hit(0, top, W, H - top, () => { G.door = Math.min(1, G.door + .08); SFX.door(); }, '');
  const bob = Math.sin(ui.frame / 14) * 6;
  if (G.screen === 'play') {
    SP('signTutup', 640, top + 20, 1.2, .5, 0);
    T(`HARI ${G.day}`, 640, top + 190, { s: 34, a: 'center', c: '#2a3138', stroke: 'rgba(255,255,255,.5)', sw: 4 });
    T('Tarik pintu ke atas untuk BUKA WARUNG', 640, top + 235, { s: 26, a: 'center', c: '#fff', stroke: '#2a3138', sw: 6 });
    T('(drag ke atas atau klik berkali-kali)', 640, top + 262, { s: 15, a: 'center', c: '#e8eef2', stroke: '#2a3138', sw: 4 });
    ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = '#2a3138'; ctx.lineWidth = 4; ctx.beginPath(); const ay = yb - 70 + bob; ctx.moveTo(640, ay - 40); ctx.lineTo(690, ay + 10); ctx.lineTo(660, ay + 10); ctx.lineTo(660, ay + 40); ctx.lineTo(620, ay + 40); ctx.lineTo(620, ay + 10); ctx.lineTo(590, ay + 10); ctx.closePath(); ctx.fill(); ctx.stroke();
    // info stok singkat + tombol buku
    button(470, top + 300, 340, 50, 'BUKU CATATAN · Cek Stok', () => { ui.modal = 'notebook'; }, { col: 'wood', s: 16 });
    button(470, top + 358, 340, 50, 'HP · Pesan Barang ke Grosir', () => { ui.modal = 'phone'; }, { col: 'green', s: 16 });
    if (G.deliveries.length) T(`${G.deliveries.length} pesanan menunggu kurir`, 640, top + 430, { s: 14, a: 'center', c: '#fff', stroke: '#2a3138', sw: 3 });
    if (G.morning.length) G.morning.forEach((m, i) => T(m, 640, top + 458 + i * 22, { s: 14, a: 'center', c: '#fff6c0', stroke: '#2a3138', sw: 3 }));
  }
}

