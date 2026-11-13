import { SFX } from '../audio.js';
import { DAY_END } from '../constants.js';
import { G, ui } from '../state.js';
import { clamp, pick } from '../util.js';
import { toast } from '../widgets.js';
import { HOME_STORIES } from '../story/home.js';
import { isRain, endDay } from './day.js';
import { receiveDelivery } from './actions.js';
import { applyFx, chapterOf, story, trust } from './story.js';

/* ============================================================
   RUMAH — pulang untuk istirahat
   Pemain boleh menutup warung sementara (maks. 2×/hari, 1–2 jam game) untuk memulihkan kewarasan.
   Selama pergi tidak ada pembeli; pesanan kurir menunggu. Setiap istirahat memunculkan cerita rumah.
   ============================================================ */
export const MAX_RESTS = 2;
export const REST_HOURS = [1, 2];
export const ENERGY_PER_HOUR = 22;

const home = () => G.home || (G.home = { rests: 0, recent: [] });
export const restsLeft = () => MAX_RESTS - home().rests;

/** Bisakah pulang sekarang? mengembalikan alasan penolakan atau null. */
export function whyNotHome(hours = 1) {
  if (G.screen !== 'play' || !G.running) return 'Warung harus sedang buka.';
  if (G.cust.length || G.leaving.some(c => c.leaveT < 1.3)) return 'Masih ada pembeli. Layani dulu.';
  if (restsLeft() <= 0) return 'Hari ini sudah istirahat dua kali.';
  if (G.h + hours > DAY_END - .5) return 'Hari sudah terlalu larut untuk pulang.';
  if (G.energy >= 98) return 'Kewarasanmu masih penuh.';
  return null;
}

/** Cerita yang memenuhi syarat saat ini. */
export function eligibleStories() {
  const s = story(), utang = !s.easy && !s.lunas && s.debt > 0;
  return HOME_STORIES.filter(h => {
    const w = h.when; if (!w) return true;
    if (w.rain && !isRain()) return false;
    if (w.night && G.h < 19.5) return false;
    if (w.chapterMin && chapterOf() < w.chapterMin) return false;
    if (w.trustMin && trust() < w.trustMin) return false;
    if (w.hutang && !utang) return false;
    if (w.noUtang && utang) return false;
    return true;
  });
}
function pickStory() {
  const pool = eligibleStories(), recent = home().recent, fresh = pool.filter(h => !recent.includes(h.id));
  return pick(fresh.length ? fresh : pool);
}

/** Pulang & istirahat `hours` jam: waktu maju, kewarasan pulih, cerita rumah muncul. Mengembalikan hasil atau null. */
export function restAtHome(hours = 1) {
  const why = whyNotHome(hours); if (why) { SFX.err(); toast(why, '#ffd0d0'); return null; }
  const h0 = G.energy, st = pickStory();
  G.h += hours; G.abs += hours * 60; home().rests++;
  G.energy = clamp(G.energy + ENERGY_PER_HOUR * hours, 0, 100);
  if (G.social) G.social.v = [];                                    // warga di bangku pulang
  const lines = applyFx(st.fx); home().recent = [...home().recent, st.id].slice(-5);
  if (G.deliveries.some(d => G.abs >= d.eta)) receiveDelivery();     // kiriman diterima tetangga/dititip
  const res = { hours, story: st, gain: Math.round(G.energy - h0), lines, hour: G.h };
  ui.homeResult = res; ui.modal = 'rumah'; SFX.good();
  if (G.h >= DAY_END - .01) endDay('normal');
  return res;
}
export const resetHomeDay = () => { G.home = { rests: 0, recent: (G.home && G.home.recent) || [] }; };
