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
    } else { vecIcon(g, it.id); vecIcon2(g, it.id); }
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
/** Ikon vektor untuk barang tanpa sprite di atlas (64×64). */
export function vecIcon2(g, id) {
  g.lineJoin = 'round';
  if (id === 'telur') {
    g.fillStyle = '#c9a36a'; rr(g, 8, 34, 48, 22, 4); g.fill(); g.fillStyle = '#b08850'; for (let i = 0; i < 4; i++) g.fillRect(14 + i * 11, 34, 2, 22);
    [[18, 30], [32, 28], [46, 30], [25, 40], [39, 40]].forEach(([x, y]) => { g.fillStyle = '#f6ead2'; g.beginPath(); g.ellipse(x, y, 7, 9, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(120,80,30,.35)'; g.lineWidth = 1.5; g.stroke(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(x - 2, y - 3, 2, 3, 0, 0, 7); g.fill(); });
  } else if (id === 'minyak') {
    g.fillStyle = '#d9a21a'; g.beginPath(); g.moveTo(26, 6); g.lineTo(38, 6); g.lineTo(38, 14); g.quadraticCurveTo(50, 20, 50, 32); g.lineTo(50, 56); g.quadraticCurveTo(50, 60, 46, 60); g.lineTo(18, 60); g.quadraticCurveTo(14, 60, 14, 56); g.lineTo(14, 32); g.quadraticCurveTo(14, 20, 26, 14); g.closePath(); g.fill();
    g.fillStyle = '#c0281a'; g.fillRect(25, 2, 14, 7); g.fillStyle = '#fff6d8'; g.fillRect(14, 30, 36, 20); g.fillStyle = '#b8731a'; g.font = 'bold 10px sans-serif'; g.textAlign = 'center'; g.fillText('MINYAK', 32, 44); g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(18, 20, 4, 12);
  } else if (id === 'gula') {
    g.fillStyle = '#f4f4f4'; rr(g, 12, 8, 40, 50, 4); g.fill(); g.strokeStyle = '#c8c8c8'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#2f80d6'; g.fillRect(12, 26, 40, 16); g.fillStyle = '#fff'; g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.fillText('GULA', 32, 39);
    g.fillStyle = '#c8c8c8'; for (let i = 0; i < 8; i++) { g.fillRect(12 + i * 5, 6, 3, 5); g.fillRect(12 + i * 5, 55, 3, 5); }
  } else if (id === 'sabun') {
    g.fillStyle = '#2f9e60'; rr(g, 8, 20, 48, 30, 5); g.fill(); g.fillStyle = '#e8f6ee'; g.beginPath(); g.ellipse(32, 35, 17, 9, 0, 0, 7); g.fill();
    g.fillStyle = '#1a5f3a'; g.font = 'bold 9px sans-serif'; g.textAlign = 'center'; g.fillText('SABUN', 32, 38);
    g.fillStyle = 'rgba(255,255,255,.7)'; [[46, 14, 4], [52, 8, 3], [40, 8, 3]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
  } else if (id === 'susu') {
    g.fillStyle = '#e8eef5'; rr(g, 14, 16, 36, 40, 4); g.fill(); g.fillStyle = '#2d6db5'; g.fillRect(14, 26, 36, 18); g.fillStyle = '#c9ced3'; g.fillRect(14, 12, 36, 6); g.fillRect(14, 54, 36, 5);
    g.fillStyle = '#fff'; g.font = 'bold 10px sans-serif'; g.textAlign = 'center'; g.fillText('SUSU', 32, 39); g.strokeStyle = '#9aa0a6'; g.lineWidth = 2; g.beginPath(); g.arc(32, 8, 5, 0, 7); g.stroke();
  } else if (id === 'teh') {
    g.fillStyle = '#c0281a'; rr(g, 12, 12, 40, 46, 4); g.fill(); g.fillStyle = '#f4e2a0'; g.beginPath(); g.ellipse(32, 32, 14, 11, 0, 0, 7); g.fill();
    g.fillStyle = '#5a3216'; g.beginPath(); g.moveTo(32, 21); g.quadraticCurveTo(42, 28, 32, 43); g.quadraticCurveTo(22, 28, 32, 21); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(32, 22); g.lineTo(32, 42); g.stroke();
    g.fillStyle = '#fff'; g.font = 'bold 9px sans-serif'; g.textAlign = 'center'; g.fillText('TEH', 32, 54);
  }
}
export function ico(id, x, y, s) { if (ICON[id]) ctx.drawImage(ICON[id], x, y, s, s); }
