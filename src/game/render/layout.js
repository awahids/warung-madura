import { ATLAS } from '../atlas';
import { ctx } from '../gfx';
import { rr, T } from '../util';
import { BY } from '../data';

/** Tinggi tampilan barang (px, koordinat game 1280×720) — besar agar terbaca di layar HP. */
export const SZ = { shelf: 120, ground: 140, rakBensin: 190, etalase: 230, hang: 150, gear: 80 };

/** Skala agar sprite punya tinggi `h` piksel. */
export const scaleH = (name, h) => h / ATLAS[name][3];

/** Susun sprite berurutan dengan jarak merata. Mengembalikan pusat-x & skala tiap sprite. */
export function flow(items, { h, gap, x, align = 'left' }) {
  const ws = items.map(i => ATLAS[i.spr][2] * scaleH(i.spr, i.h || h));
  const total = ws.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
  let cur = align === 'right' ? x - total : align === 'center' ? x - total / 2 : x;
  const out = items.map((i, k) => { const cx = cur + ws[k] / 2; cur += ws[k] + gap; return { ...i, cx, sc: scaleH(i.spr, i.h || h), w: ws[k] }; });
  return { slots: out, left: out[0].cx - out[0].w / 2, right: out[out.length - 1].cx + out[out.length - 1].w / 2 };
}

export function groundShadow(cx, y, w) {
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(cx, y, w * .55, 6, 0, 0, 7); ctx.fill();
}

/** Papan rak kayu tempat barang berdiri, dengan label harga di bawah tiap barang. */
export function shelfPlank(left, right, y, slots) {
  const x = left - 14, w = right - left + 28, h = 24;
  ctx.fillStyle = 'rgba(0,0,0,.28)'; rr(ctx, x + 2, y + 4, w, h, 5); ctx.fill();
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#e0b070'); g.addColorStop(1, '#9a6430');
  ctx.fillStyle = g; rr(ctx, x, y, w, h, 5); ctx.fill();
  ctx.strokeStyle = '#6b4020'; ctx.lineWidth = 2; ctx.stroke();
  for (const s of slots) T(`${BY[s.id].price / 1000}rb`, s.cx, y + 18, { s: 15, a: 'center', c: '#fff6dc', stroke: 'rgba(60,30,10,.8)', sw: 3 });
}

/** Plakat nama kecil di atas rak/etalase. */
export function nameTag(cx, y, text) {
  ctx.font = '700 13px "Trebuchet MS",sans-serif'; const w = ctx.measureText(text).width + 22;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; rr(ctx, cx - w / 2 + 2, y + 3, w, 24, 8); ctx.fill();
  ctx.fillStyle = '#7a4a22'; rr(ctx, cx - w / 2, y, w, 24, 8); ctx.fill();
  ctx.strokeStyle = '#d9a55f'; ctx.lineWidth = 2; ctx.stroke();
  T(text, cx, y + 17, { s: 13, a: 'center', c: '#ffe9b8' });
}
