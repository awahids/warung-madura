import { ctx } from '../gfx.js';
import { ENERGY_PER_HOUR, MAX_RESTS, REST_HOURS, restAtHome, restsLeft, whyNotHome } from '../logic/home.js';
import { G, ui } from '../state.js';
import { T, rr, wrapText } from '../util.js';
import { button, panel } from '../widgets.js';

const clock = h => `${String(Math.floor(h) % 24).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`;

/** Jendela rumah: pilih lama istirahat, lalu kartu cerita rumah. */
export function rumahModal() {
  const x = 300, y = 90, w = 680, h = 540;
  panel(x, y, w, h, { fill: '#f6e3c0' });
  const res = ui.homeResult;
  // gambar rumah sederhana
  ctx.fillStyle = '#b9a58a'; rr(ctx, x + 36, y + 40, 130, 100, 8); ctx.fill(); ctx.fillStyle = '#7a3a28'; ctx.beginPath(); ctx.moveTo(x + 26, y + 46); ctx.lineTo(x + 101, y + 6); ctx.lineTo(x + 176, y + 46); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#6b4a2a'; ctx.fillRect(x + 86, y + 90, 32, 50); ctx.fillStyle = '#ffe9a0'; ctx.fillRect(x + 48, y + 66, 26, 26); ctx.fillRect(x + 130, y + 66, 26, 26);
  T('RUMAH', x + 200, y + 66, { s: 34, c: '#6b3a14' });
  T(res ? `Kamu beristirahat ${res.hours} jam · kini ${clock(res.hour)}` : `Sekarang ${clock(G.h)} · istirahat tersisa ${restsLeft()}/${MAX_RESTS} hari ini`, x + 200, y + 96, { s: 15, w: '600', c: '#7a5a3a' });
  if (res) {
    const st = res.story;
    ctx.fillStyle = '#fffaf0'; rr(ctx, x + 30, y + 160, w - 60, 230, 16); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#5a3a1a'; ctx.stroke();
    T(st.title, x + w / 2, y + 204, { s: 24, a: 'center', c: '#8a5424' });
    wrapText(st.text, w - 120, 18, '600').slice(0, 5).forEach((l, i) => T(l, x + 60, y + 246 + i * 28, { s: 18, w: '600', c: '#3a2a1a' }));
    ctx.fillStyle = '#dff5d2'; rr(ctx, x + 30, y + 404, w - 60, 40, 10); ctx.fill();
    const extra = res.lines.filter(l => !l.startsWith('Energi'));
    T(['Kewarasan +' + res.gain, ...extra].join(' · '), x + w / 2, y + 430, { s: 15, a: 'center', c: '#2a6a1a' });
    button(x + w / 2 - 130, y + h - 70, 260, 52, 'KEMBALI BERJAGA', () => { ui.homeResult = null; ui.modal = null; }, { col: 'green', s: 18 });
    return;
  }
  T('Tutup warung sebentar untuk makan, tidur, dan menenangkan diri.', x + 36, y + 190, { s: 16, w: '600', c: '#5a3a1a' });
  T('Selama kamu pergi tidak ada pembeli yang dilayani. Kiriman kurir dititipkan ke tetangga.', x + 36, y + 216, { s: 14, w: '600', c: '#7a5a3a' });
  REST_HOURS.forEach((hr, i) => {
    const why = whyNotHome(hr), by = y + 250 + i * 86;
    button(x + 36, by, w - 72, 60, `ISTIRAHAT ${hr} JAM  ·  kewarasan +${ENERGY_PER_HOUR * hr}`, () => { restAtHome(hr); }, { col: hr === 1 ? 'blue' : 'green', s: 19, disabled: !!why });
    if (why) T(why, x + w / 2, by + 78, { s: 13, a: 'center', w: '700', c: '#b3281e' });
  });
  T('Ada cerita rumah yang berbeda tiap kali pulang.', x + w / 2, y + 438, { s: 14, a: 'center', c: '#8a7a6a' });
  button(x + w / 2 - 90, y + h - 66, 180, 46, 'BATAL', () => { ui.modal = null; }, { col: 'wood', s: 16 });
}
