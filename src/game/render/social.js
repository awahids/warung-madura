import { ATLAS } from '../atlas.js';
import { TYPES } from '../data.js';
import { ctx } from '../gfx.js';
import { regById, regState, regTier, tierName } from '../logic/regulars.js';
import { TALKS, TOPICS, canChat, chat, markSpeech, speechOf, typedChars, visitorById, visitors } from '../logic/social.js';
import { SP, hit } from '../sprites.js';
import { TIER_AT } from '../story/regulars.js';
import { ui } from '../state.js';
import { T, rr, wrapText } from '../util.js';
import { button, panel } from '../widgets.js';
import { SFX } from '../audio.js';
import { canAct } from '../sprites.js';

/** Buka obrolan dengan pengunjung (id pengunjung). */
export function openChat(vid) { const v = visitorById(vid); if (!v) return; ui.chatId = vid; ui.modal = 'ngobrol'; markSpeech(v); SFX.click(); }

/** Tombol "WARGA" bila ada warga yang duduk di bangku & bisa diajak ngobrol (dipakai 2D & 3D). */
export function socialChip(x, y) {
  if (!canAct()) return false;
  const list = visitors().filter(canChat); if (!list.length) return false;
  const v = list[0], r = regById(v.id); if (!r) return false;
  const pulse = .5 + .5 * Math.sin(ui.frame / 10);
  button(x, y, 240, 40, `NGOBROL · ${r.name}`, () => openChat(v.vid), { col: 'blue', s: 14, tip: 'Warga sedang duduk di bangku depan — ajak ngobrol (tombol W)' });
  ctx.fillStyle = `rgba(255,228,92,${.4 + .5 * pulse})`; ctx.beginPath(); ctx.arc(x + 10, y + 8, 5, 0, 7); ctx.fill();
  return true;
}

export function ngobrolModal() {
  const v = visitorById(ui.chatId), r = v && regById(v.id);
  if (!v || !r) { ui.modal = null; return; }
  if (v.speechAt == null) markSpeech(v);
  const x = 60, y = 440, w = 1160, h = 270;
  panel(x, y, w, h);
  const tier = regTier(r.id), st = regState(r.id);
  // potret + nama
  const a = ATLAS[TYPES[r.type].spr]; ctx.fillStyle = 'rgba(255,255,255,.5)'; rr(ctx, x + 22, y + 30, 130, h - 52, 14); ctx.fill();
  if (a) SP(TYPES[r.type].spr, x + 87, y + h - 28, 190 / a[3], .5, 1);
  T(r.name, x + 172, y + 54, { s: 26, c: '#6b3a14' });
  T(`${'★'.repeat(tier)}${'☆'.repeat(3 - tier)} ${tierName(tier)}`, x + 172, y + 78, { s: 14, c: ['#8a8a8a', '#3a7ab8', '#2a8a2a', '#b88a10'][tier] });
  const nxt = TIER_AT[tier + 1], lo = TIER_AT[tier], f = nxt === undefined ? 1 : (st.aff - lo) / (nxt - lo);
  ctx.fillStyle = '#d8c28c'; rr(ctx, x + 300, y + 66, 150, 10, 5); ctx.fill(); ctx.fillStyle = ['#aab', '#5aa6e8', '#58b948', '#e0b030'][tier]; rr(ctx, x + 300, y + 66, Math.max(6, 150 * f), 10, 5); ctx.fill();
  T(nxt === undefined ? 'maks.' : `${Math.round(st.aff)}/${nxt}`, x + 458, y + 76, { s: 11, w: '700', c: '#5a3a1a' });
  // gelembung ucapan dengan efek ketik (sinkron dengan gerak mulut di 3D)
  const bx = x + 172, by = y + 92, bw = 440, bh = 120, full = speechOf(v), n = typedChars(v), talking = n < full.length;
  ctx.fillStyle = '#fffaf0'; rr(ctx, bx, by, bw, bh, 14); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#5a3a1a'; ctx.stroke();
  const lines = wrapText(full, bw - 36, 17, '600'); let left = n;
  lines.slice(0, 4).forEach((l, i) => { const part = l.slice(0, Math.max(0, Math.min(l.length, left))); left -= l.length + 1; if (part) T(part, bx + 18, by + 32 + i * 25, { s: 17, w: '600', c: '#3a2a1a' }); });
  if (talking) { T('…  ketuk untuk lewati', bx + bw - 14, by + bh - 10, { s: 12, a: 'right', c: '#b89a6a' }); hit(bx, by, bw, bh, () => { v.speechAt = -1e9; }, 'Lewati animasi ketik'); }
  if (v.log && !talking) { ctx.fillStyle = '#dff5d2'; rr(ctx, bx, by + bh + 8, bw, 32, 10); ctx.fill(); T(v.log.gain, bx + bw / 2, by + bh + 29, { s: 14, a: 'center', c: '#2a6a1a' }); }
  else if (!v.log && !talking) T('Pilih topik obrolan di sebelah kanan.', bx + 4, by + bh + 28, { s: 14, c: '#8a7a6a' });
  // topik
  const dots = Array.from({ length: TALKS }, (_, i) => (i < v.talks ? '●' : '○')).join(' ');
  T(`Kesempatan ngobrol: ${dots}`, x + 650, y + 54, { s: 15, c: '#5a3a1a' });
  TOPICS.forEach((t, i) => {
    const col = i % 2, row = Math.floor(i / 2), tx = x + 640 + col * 258, ty = y + 70 + row * 74;
    const used = !!v.used[t.id], noTalk = v.talks <= 0, bad = !t.ok(r, v);
    button(tx, ty, 246, 42, used ? `${t.label} ✓` : t.label, () => { chat(v.vid, t.id); }, { col: used ? 'grey' : 'green', s: 15, disabled: used || noTalk || bad || talking, tip: bad ? t.why : t.hint });
    wrapText(bad && t.why ? t.why : t.hint, 236, 11, '600').slice(0, 2).forEach((l, k) => T(l, tx + 123, ty + 58 + k * 12, { s: 11, a: 'center', w: '600', c: bad ? '#b3281e' : '#7a5a3a' }));
  });
  button(x + w - 160, y + 14, 140, 34, 'SELESAI', () => { ui.modal = null; }, { col: 'wood', s: 14 });
}
