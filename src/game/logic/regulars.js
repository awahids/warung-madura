import { SFX } from '../audio.js';
import { BY } from '../data.js';
import { G } from '../state.js';
import { clamp, pick } from '../util.js';
import { toast } from '../widgets.js';
import { REGULARS, START_AFF, TIERS, TIER_AT } from '../story/regulars.js';
import { checkAchievements } from './achievements.js';
import { applyFx, story } from './story.js';

/* Pelanggan tetap: kedekatan 0–100 per tokoh → tingkat Asing/Kenal/Akrab/Sahabat.
   Tingkat memengaruhi kesabaran (+6%/tingkat), peluang & besar tip, sapaan, dan hadiah sekali saat jadi Sahabat. */
export const regById = id => REGULARS.find(r => r.id === id) || null;
export const regByName = n => REGULARS.find(r => r.name === n) || null;
export const tierOf = aff => TIER_AT.reduce((t, a, i) => (aff >= a ? i : t), 0);
const rec = id => { const s = story(); s.regs = s.regs || {}; return s.regs[id] || (s.regs[id] = { aff: START_AFF, visits: 0, last: 0, gift: false }); };
export const regState = id => rec(id);
export const regTier = id => tierOf(rec(id).aff);
export const tierName = t => TIERS[t];
/** Bonus kesabaran pembeli menurut tingkat (1,00 … 1,18). */
export const patienceMul = id => 1 + .06 * regTier(id);

/** Ubah kedekatan; mengumumkan naik/turun tingkat dan memberi hadiah sekali saat pertama jadi Sahabat. */
export function bond(id, n) {
  const r = regById(id); if (!r) return; const s = rec(id), before = tierOf(s.aff);
  s.aff = clamp(Math.round((s.aff + n) * 10) / 10, 0, 100); const after = tierOf(s.aff);
  if (after > before) { SFX.up(); toast(`${r.name} kini ${TIERS[after]} denganmu!`, '#ffe45c'); story().kabar.push(`${r.name} makin dekat denganmu (${TIERS[after]}).`); }
  else if (after < before) { SFX.down(); toast(`${r.name} mulai menjauh (${TIERS[after]}).`, '#ffd0d0'); story().kabar.push(`${r.name} mulai menjauh.`); }
  if (s.aff >= TIER_AT[3] && !s.gift) { s.gift = true; applyFx(r.reward.fx); toast(r.reward.text, '#ffe45c'); story().kabar.push(r.reward.text); }
  checkAchievements();
}
export const employedIds = () => (story().staff || []).map(s => s.id);
/** Peran aktif: karyawan dengan peran ini dan kesetiaan ≥ 30. */
export const hasRole = role => (story().staff || []).some(s => s.loyalty >= 30 && (regById(s.id) || {}).job === role);
export function bondByName(name, n) { const r = regByName(name); if (r) bond(r.id, n); }

/** Mungkin memilih pelanggan tetap untuk tipe ini: yang belum datang hari ini & tidak sedang ada di warung. */
export function pickRegular(type) {
  const inPlay = new Set([...G.cust, ...G.leaving].map(c => c.reg).filter(Boolean));
  const staff = new Set(employedIds());
  const pool = REGULARS.filter(r => r.type === type && rec(r.id).last !== G.day && !inPlay.has(r.id) && !staff.has(r.id));
  if (!pool.length) return null;
  const r = pick(pool); return Math.random() < .3 + .002 * rec(r.id).aff ? r : null;   // 34% … 50%
}
export function noteVisit(id) { const s = rec(id); s.visits++; s.last = G.day; }
/** Bobot pesanan: bobot tipe + kesukaan tokoh (×2). */
export function orderWeights(base, r) { const w = { ...base }; for (const k in r.fav) w[k] = (w[k] || 0) + r.fav[k] * 2; return w; }
export const favItems = r => Object.entries(r.fav).sort((a, b) => b[1] - a[1]).map(([id]) => id).filter(id => BY[id]);
export const regularsAtLeast = t => REGULARS.filter(r => regTier(r.id) >= t).length;
export const giftCount = () => REGULARS.filter(r => rec(r.id).gift).length;
