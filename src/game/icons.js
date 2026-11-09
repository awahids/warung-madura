import { ATLAS } from './atlas.js';
import { ITEMS } from './data.js';
import { ICON, IMG, ctx } from './gfx.js';
import { rr } from './util.js';

/* ---------- ikon barang (offscreen) ---------- */
export function makeIcons() {
  for (const k of Object.keys(ICON)) delete ICON[k];
  for (const it of ITEMS) {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    if (it.spr) {
      const a = ATLAS[it.spr], sc = Math.min(58 / a[2], 58 / a[3]), w = a[2] * sc, h = a[3] * sc;
      g.drawImage(IMG, a[0], a[1], a[2], a[3], 32 - w / 2, 32 - h / 2, w, h);
    } else vecIcon(g, it.id);
    ICON[it.id] = c;
  }
}
export function vecIcon(g, id) {
  g.lineJoin = 'round';
  if (id === 'kopi') {
    g.fillStyle = '#5a3216'; rr(g, 15, 8, 34, 48, 4); g.fill();
    g.fillStyle = '#3d200c'; for (let i = 0; i < 6; i++) g.fillRect(15 + i * 6, 6, 3, 5);
    g.fillStyle = '#f1dcb0'; rr(g, 19, 22, 26, 24, 4); g.fill();
    g.fillStyle = '#5a3216'; g.beginPath(); g.ellipse(32, 34, 5, 8, .5, 0, 7); g.fill();
    g.strokeStyle = '#f1dcb0'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(29, 28); g.quadraticCurveTo(34, 34, 29, 40); g.stroke();
  } else if (id === 'rokok') {
    g.fillStyle = '#e9e9e9'; rr(g, 12, 18, 40, 36, 3); g.fill();
    g.fillStyle = '#c4302b'; g.fillRect(12, 28, 40, 12);
    g.fillStyle = '#fff'; g.fillRect(24, 30, 16, 8);
    g.fillStyle = '#f3dcae'; for (let i = 0; i < 4; i++) g.fillRect(16 + i * 9, 8, 6, 12);
    g.fillStyle = '#e08a2c'; for (let i = 0; i < 4; i++) g.fillRect(16 + i * 9, 6, 6, 4);
  } else if (id === 'bensin') {
    g.fillStyle = '#c83a2a'; g.fillRect(25, 4, 14, 8);
    g.fillStyle = '#f0c63a'; rr(g, 24, 10, 16, 8, 2); g.fill();
    g.beginPath(); g.moveTo(24, 16); g.quadraticCurveTo(12, 24, 14, 36); g.lineTo(14, 56); g.quadraticCurveTo(14, 60, 18, 60);
    g.lineTo(46, 60); g.quadraticCurveTo(50, 60, 50, 56); g.lineTo(50, 36); g.quadraticCurveTo(52, 24, 40, 16); g.closePath(); g.fill();
    g.fillStyle = '#fff6c4'; g.fillRect(14, 36, 36, 14); g.fillStyle = '#b8431f'; g.font = 'bold 9px sans-serif'; g.textAlign = 'center'; g.fillText('BBM', 32, 47);
    g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(18, 22, 4, 12);
  } else if (id === 'snack') {
    g.fillStyle = '#d63b2f'; rr(g, 12, 8, 40, 48, 4); g.fill();
    g.fillStyle = '#f6c744'; g.beginPath(); g.ellipse(32, 32, 14, 12, 0, 0, 7); g.fill();
    g.fillStyle = '#a82a20'; for (let i = 0; i < 8; i++) { g.fillRect(12 + i * 5, 6, 3, 5); g.fillRect(12 + i * 5, 53, 3, 5); }
    g.fillStyle = '#fff'; g.font = 'bold 9px sans-serif'; g.textAlign = 'center'; g.fillText('CHIPS', 32, 36);
  }
}
export function ico(id, x, y, s) { if (ICON[id]) ctx.drawImage(ICON[id], x, y, s, s); }
