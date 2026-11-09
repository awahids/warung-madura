import { SFX } from '../audio.js';
import { HUD_H, W } from '../constants.js';
import { ctx } from '../gfx.js';
import { isRain, missionVal } from '../logic/day.js';
import { save } from '../persist.js';
import { SP } from '../sprites.js';
import { G, ui } from '../state.js';
import { T, rp, rr, wrapText } from '../util.js';

export function drawHUD() {
  ctx.fillStyle = 'rgba(48,28,12,.96)'; ctx.fillRect(0, 0, W, HUD_H);
  ctx.fillStyle = '#c98a4b'; ctx.fillRect(0, HUD_H - 4, W, 4);
  // fase hari
  const ph = isRain() ? 'hujan' : G.h < 7 ? 'fajar' : G.h < 16.5 ? 'matahari' : G.h < 18.5 ? 'senja' : 'bulan';
  SP(ph, 12, 8, .9, 0, 0);
  const hh = Math.floor(G.h) % 24, mm = Math.floor((G.h % 1) * 60);
  T(`HARI ${G.day}`, 62, 22, { s: 13, c: '#f3d9a4' });
  T(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, 62, 46, { s: 26, c: '#fff' });
  // uang
  SP('coin', 190, 8, .85, 0, 0);
  T(rp(G.money), 232, 36, { s: 24, c: '#ffe45c', stroke: 'rgba(0,0,0,.4)', sw: 3 });
  // energi
  const bar = (x, label, v, c1, c2, icon) => {
    T(label, x + 30, 20, { s: 11, c: '#f3d9a4' });
    ctx.fillStyle = 'rgba(0,0,0,.5)'; rr(ctx, x + 30, 25, 150, 16, 8); ctx.fill();
    const gg = ctx.createLinearGradient(0, 25, 0, 41); gg.addColorStop(0, c1); gg.addColorStop(1, c2);
    ctx.fillStyle = gg; if (v > 1) { rr(ctx, x + 30, 25, Math.max(10, 150 * v / 100), 16, 8); ctx.fill(); }
    ctx.strokeStyle = '#2a1608'; ctx.lineWidth = 2; rr(ctx, x + 30, 25, 150, 16, 8); ctx.stroke();
    icon(x + 14, 31);
  };
  bar(470, 'KEWARASAN', G.energy, '#ffe45c', '#e0a312', (cx, cy) => {
    ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.moveTo(cx + 4, cy - 14); ctx.lineTo(cx - 8, cy + 2); ctx.lineTo(cx - 1, cy + 2); ctx.lineTo(cx - 5, cy + 14); ctx.lineTo(cx + 9, cy - 3); ctx.lineTo(cx + 2, cy - 3); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#6a4a08'; ctx.lineWidth = 1.5; ctx.stroke();
  });
  bar(700, 'REPUTASI', G.rep, '#6fe06f', '#2e9a36', (cx, cy) => {
    ctx.fillStyle = '#7ddc5a'; ctx.beginPath(); ctx.arc(cx, cy, 12, 0, 7); ctx.fill(); ctx.strokeStyle = '#2a6a1a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#1a3a0a'; ctx.fillRect(cx - 5, cy - 4, 3, 4); ctx.fillRect(cx + 3, cy - 4, 3, 4);
    ctx.beginPath(); ctx.arc(cx, cy + 1, 6, .15 * Math.PI, .85 * Math.PI); ctx.stroke();
  });
  if (G.energy < 25) { ctx.fillStyle = `rgba(255,60,40,${.35 + Math.sin(ui.frame / 8) * .25})`; ctx.fillRect(470 + 30, 25, 150, 16); }
  // tombol
  const hb = (name, x, fn, tip) => SP(name, x, 8, .9, 0, 0, { fn, tip, always: true, pad: ui.touch ? 10 : 0 });
  hb('pause', 1086, () => { ui.modal = ui.modal ? null : 'pause'; SFX.click(); }, 'Jeda');
  hb('gear', 1136, () => { ui.modal = 'pause'; SFX.click(); }, 'Pengaturan');
  hb('tanya', 1186, () => { ui.modal = 'help'; SFX.click(); }, 'Cara main');
  hb(G.sound ? 'lonceng' : 'no', 1236, () => { G.sound = !G.sound; save(); }, G.sound ? 'Suara: nyala' : 'Suara: mati');
  // misi
  if (G.screen === 'play' && !ui.modal) {
    const mx = 1052, my = 126, mw = 216; const lines = G.missions.map(m => wrapText(m.text, mw - 66, 13, '700'));
    const mh = 46 + lines.reduce((s, l) => s + 18 * l.length + 12, 0);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; rr(ctx, mx + 3, my + 5, mw, mh, 12); ctx.fill();
    ctx.fillStyle = '#f3e1ae'; rr(ctx, mx, my, mw, mh, 12); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#b58a46'; ctx.stroke();
    T('Misi Hari Ini:', mx + 12, my + 24, { s: 15, c: '#5a3a1a' });
    let yy = my + 36;
    G.missions.forEach((m, i) => {
      const v = Math.min(missionVal(m), m.target), done = v >= m.target;
      ctx.strokeStyle = '#6b4a22'; ctx.lineWidth = 2; ctx.strokeRect(mx + 12, yy + 3, 16, 16);
      if (done) SP('ok', mx + 20, yy + 11, .4, .5, .5);
      lines[i].forEach((l, j) => T(l, mx + 36, yy + 15 + j * 17, { s: 13, c: done ? '#2a8a2a' : '#3a2a1a' }));
      const lab = m.key === 'revenue' ? `${Math.round(v / 1000)}/${Math.round(m.target / 1000)}rb` : `${v}/${m.target}`;
      T(lab, mx + mw - 12, yy + 15 + (lines[i].length - 1) * 17 + 17, { s: 12, a: 'right', c: '#7a5a3a' });
      yy += 18 * lines[i].length + 12;
    });
  }
}

