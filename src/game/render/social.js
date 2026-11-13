import { ATLAS } from '../atlas.js';
import { TYPES } from '../data.js';
import { ctx } from '../gfx.js';
import { regById, regState, regTier, tierName } from '../logic/regulars.js';
import { TALKS, TOPICS, canChat, chat, visitorById, visitors } from '../logic/social.js';
import { SP } from '../sprites.js';
import { TIER_AT } from '../story/regulars.js';
import { ui } from '../state.js';
import { T, rr, wrapText } from '../util.js';
import { button, panel } from '../widgets.js';
import { SFX } from '../audio.js';
import { canAct } from '../sprites.js';

/** Buka obrolan dengan pengunjung (id pengunjung). */
export function openChat(vid) { if (!visitorById(vid)) return; ui.chatId = vid; ui.modal = 'ngobrol'; SFX.click(); }

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
  const x = 250, y = 70, w = 780, h = 580;
  panel(x, y, w, h);
  const tier = regTier(r.id), st = regState(r.id);
  T(r.name, x + 36, y + 58, { s: 32, c: '#6b3a14' });
  T(`${'★'.repeat(tier)}${'☆'.repeat(3 - tier)} ${tierName(tier)}${r.job ? '' : ''}`, x + 36, y + 86, { s: 16, c: ['#8a8a8a', '#3a7ab8', '#2a8a2a', '#b88a10'][tier] });
  const nxt = TIER_AT[tier + 1], lo = TIER_AT[tier], f = nxt === undefined ? 1 : (st.aff - lo) / (nxt - lo);
  ctx.fillStyle = '#d8c28c'; rr(ctx, x + 200, y + 74, 200, 12, 6); ctx.fill(); ctx.fillStyle = ['#aab', '#5aa6e8', '#58b948', '#e0b030'][tier]; rr(ctx, x + 200, y + 74, Math.max(6, 200 * f), 12, 6); ctx.fill();
  T(nxt === undefined ? 'maks.' : `${Math.round(st.aff)}/${nxt}`, x + 410, y + 86, { s: 12, w: '700', c: '#5a3a1a' });
  // potret
  const a = ATLAS[TYPES[r.type].spr]; ctx.fillStyle = 'rgba(255,255,255,.5)'; rr(ctx, x + 30, y + 108, 170, 250, 16); ctx.fill();
  if (a) SP(TYPES[r.type].spr, x + 115, y + 350, 220 / a[3], .5, 1);
  // gelembung ucapan
  const bx = x + 220, by = y + 108, bw = w - 250, bh = 250;
  ctx.fillStyle = '#fffaf0'; rr(ctx, bx, by, bw, bh, 16); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#5a3a1a'; ctx.stroke();
  ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.moveTo(bx, by + 90); ctx.lineTo(bx - 16, by + 106); ctx.lineTo(bx, by + 122); ctx.fill();
  const text = v.log ? v.log.text : (tier >= 2 ? r.akrab[0] : r.say[0]);
  wrapText(text, bw - 40, 19, '600').slice(0, 6).forEach((l, i) => T(l, bx + 20, by + 44 + i * 28, { s: 19, w: '600', c: '#3a2a1a' }));
  if (v.log) { ctx.fillStyle = '#dff5d2'; rr(ctx, bx + 14, by + bh - 52, bw - 28, 38, 10); ctx.fill(); T(v.log.gain, bx + bw / 2, by + bh - 27, { s: 15, a: 'center', c: '#2a6a1a' }); }
  else T('Pilih topik obrolan di bawah ini.', bx + 20, by + bh - 22, { s: 14, c: '#8a7a6a' });
  // topik
  const dots = Array.from({ length: TALKS }, (_, i) => (i < v.talks ? '●' : '○')).join(' ');
  T(`Kesempatan ngobrol: ${dots}`, x + 36, y + 392, { s: 16, c: '#5a3a1a' });
  TOPICS.forEach((t, i) => {
    const col = i % 2, row = Math.floor(i / 2), tx = x + 30 + col * 372, ty = y + 408 + row * 66;
    const used = !!v.used[t.id], noTalk = v.talks <= 0, bad = !t.ok(r, v);
    button(tx, ty, 354, 38, used ? `${t.label} ✓` : t.label, () => { chat(v.vid, t.id); }, { col: used ? 'grey' : 'green', s: 16, disabled: used || noTalk || bad, tip: bad ? t.why : t.hint });
    T(bad && t.why ? t.why : t.hint, tx + 177, ty + 54, { s: 11, a: 'center', w: '600', c: bad ? '#b3281e' : '#7a5a3a' });
  });
  button(x + w - 170, y + 22, 140, 36, 'SELESAI', () => { ui.modal = null; }, { col: 'wood', s: 15 });
}
