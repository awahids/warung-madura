import { describe, it, expect } from 'vitest';
import { G, setG, ui } from '../src/game/state';
import * as persist from '../src/game/persist';
import { startDay } from '../src/game/logic/day';
import { story } from '../src/game/logic/story';
import { BIZ, CAMP_ACTS, PROJECTS } from '../src/game/story/kota';
import { bizIncAt, bizLevel, bizNextCost, buyBiz, campaign, canBuild, city, build, cityAvg, isMiliarder, kota, runElection, support, rivalPower } from '../src/game/logic/kota';

/* Simulasi keseimbangan babak lanjutan dengan "pemain" otomatis: pastikan tiap tahap bisa dimenangkan tapi tidak sepele. */
function begin() { setG(persist.freshState(G)); G.story.chapterSeen = 99; ui.modal = null; startDay(); story().ending = 'dipercaya'; G.day++; startDay(); }
const nextDay = () => { G.day++; startDay(); ui.modal = null; };

function daysToMiliarder(warungPerDay, careless = 0) {
  begin(); G.money = 3e6; let d = 0;
  while (!isMiliarder() && d < 200) {
    for (;;) {
      const opts = BIZ.map(b => { const l = bizLevel(b.id), c = bizNextCost(b.id); return c === null ? null : { id: b.id, c, roi: c / (bizIncAt(b, l + 1) - bizIncAt(b, l)) }; }).filter(o => o && o.c <= G.money).sort((a, b) => a.roi - b.roi);
      if (!opts.length || (careless && d % (careless + 1))) break; buyBiz(opts[0].id);
    }
    G.money += warungPerDay; nextDay(); d++;
  }
  return d;
}
function election({ trust, rep, duk = 0, flags = {}, camp = 'bersih', integ = 80 }) {
  begin(); const k = kota(); k.ch = 7; k.phase = 'usaha'; story().trust = trust; G.rep = rep; k.duk = duk; k.integ = integ; Object.assign(story().flags, flags); k.rivalBonus = 0;
  G.money = 5e9; k.phase = 'kampanye'; k.camp = { day: 0, pts: 0, uses: {} };
  if (camp !== 'tidak') for (const a of CAMP_ACTS) if (!a.dirty || camp === 'kotor') for (let i = 0; i < a.max; i++) campaign(a.id);
  return support();
}
function mayor({ strategy, integ = 80 }) {
  begin(); const k = kota(); k.ch = 7; k.phase = 'kampanye'; story().trust = 80; G.rep = 80; k.duk = 40; k.integ = integ; runElection();
  G.money = 0; const c = city(); let guard = 0;
  while (!k.ending && guard++ < 60) {
    const ids = PROJECTS.filter(p => canBuild(p.id)).sort((a, b) => strategy === 'murah' ? a.cost - b.cost : (Object.values(b.fx).reduce((s, v) => s + Math.max(0, v), 0) / b.cost) - (Object.values(a.fx).reduce((s, v) => s + Math.max(0, v), 0) / a.cost));
    if (strategy !== 'malas') for (const p of ids) { if (!canBuild(p.id)) continue; build(p.id, strategy === 'korup'); }
    nextDay();
  }
  return { ending: k.ending, avg: cityAvg(), puas: Math.round(c.ind.puas), integ: k.integ, done: Object.keys(c.done).join(), caught: c.caught, apbd: Math.round(c.apbd / 1e6), ind: Object.values(c.ind).map(Math.round).join('/') };
}

describe('keseimbangan babak lanjutan', () => {
  it('miliarder tercapai dalam ±30–50 hari (pemain rajin) dan tidak lebih dari ~70 hari (pemain santai)', () => {
    const fast = daysToMiliarder(250e3), slow = daysToMiliarder(250e3, 3);
    console.log('hari ke miliarder: rajin', fast, 'santai', slow);
    expect(fast).toBeGreaterThanOrEqual(25); expect(fast).toBeLessThanOrEqual(45); expect(slow).toBeLessThanOrEqual(80);
  });
  it('pemilihan: warga dipercaya menang, yang dibenci kalah, politik uang menolong tapi merusak integritas', () => {
    const rows = {
      baik: election({ trust: 80, rep: 80, duk: 12 }), biasa: election({ trust: 60, rep: 60, duk: 4 }), buruk: election({ trust: 25, rep: 40 }),
      biasaTanpaKampanye: election({ trust: 60, rep: 60, duk: 4, camp: 'tidak' }), kotor: election({ trust: 60, rep: 60, duk: 4, camp: 'kotor', integ: 80 }),
    };
    console.log('dukungan', rows, 'lawan', 52);
    expect(rows.baik).toBeGreaterThan(52 + 10); expect(rows.buruk).toBeLessThan(52);
    expect(rows.biasa).toBeGreaterThan(rows.biasaTanpaKampanye + 18); expect(rows.biasaTanpaKampanye).toBeLessThan(52 - 4);   // kampanye menentukan bagi pemilih yang biasa-biasa
    expect(rows.kotor).toBeLessThanOrEqual(rows.biasa + 14);
  });
  it('masa jabatan: bersih & strategis bisa jadi Bapak Pembangunan, korup terjerat, asal-asalan biasa', () => {
    const smart = mayor({ strategy: 'efisien' }), cheap = mayor({ strategy: 'murah' }), dirty = mayor({ strategy: 'korup' }), lazy = mayor({ strategy: 'malas' });
    console.log('wali kota', JSON.stringify({ smart, cheap, dirty, lazy }));
    expect(dirty.ending).toBe('korup'); expect(smart.integ).toBe(80);
    expect(smart.ending).toBe('bapak'); expect(['bapak', 'biasa']).toContain(cheap.ending); expect(lazy.ending).toBe('biasa'); expect(lazy.avg).toBeLessThan(smart.avg - 6);
  });
});
void rivalPower;
