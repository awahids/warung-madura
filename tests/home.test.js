import { describe, it, expect, beforeEach, vi } from 'vitest';
import { START_STOCK } from '../src/game/data';
import { G, setG, ui } from '../src/game/state';
import { freshState } from '../src/game/persist';
import { startDay, openShop } from '../src/game/logic/day';
import { spawnCustomer } from '../src/game/logic/customers';
import { whyNotHome, restAtHome, restsLeft, eligibleStories, MAX_RESTS, ENERGY_PER_HOUR } from '../src/game/logic/home';
import { HOME_STORIES } from '../src/game/story/home';
import { story } from '../src/game/logic/story';

function begin() { setG(freshState(G)); G.story.chapterSeen = 99; G.xp = 1e6; G.stock = { ...START_STOCK }; ui.modal = null; ui.homeResult = null; startDay(); G.door = 1; openShop(); G.firstCust = false; G.spawnCd = 1e9; G.events = []; G.energy = 40; G.rain = null; }

describe('rumah: pulang istirahat', () => {
  beforeEach(begin);

  it('syarat pulang: warung buka, tak ada pembeli, kewarasan belum penuh, belum larut, maksimal 2×', () => {
    expect(whyNotHome(1)).toBeNull();
    spawnCustomer('ibu'); expect(whyNotHome(1)).toMatch(/pembeli/); G.cust.length = 0;
    G.energy = 100; expect(whyNotHome(1)).toMatch(/penuh/); G.energy = 40;
    G.h = 25.2; expect(whyNotHome(1)).toMatch(/larut/); G.h = 8;
    G.running = false; expect(whyNotHome(1)).toMatch(/buka/); G.running = true;
  });

  it('istirahat memajukan waktu, memulihkan kewarasan, dan memunculkan cerita rumah', () => {
    const h0 = G.h, a0 = G.abs; vi.spyOn(Math, 'random').mockReturnValue(.3);
    const r = restAtHome(2); vi.restoreAllMocks();
    expect(r).toBeTruthy(); expect(G.h).toBeCloseTo(h0 + 2); expect(G.abs).toBeCloseTo(a0 + 120);
    expect(G.energy).toBeGreaterThanOrEqual(40 + ENERGY_PER_HOUR * 2); expect(G.energy).toBeLessThanOrEqual(100);
    expect(ui.modal).toBe('rumah'); expect(ui.homeResult.story.title.length).toBeGreaterThan(5); expect(restsLeft()).toBe(MAX_RESTS - 1);
  });

  it('batas 2× per hari; hari baru mereset jatah tetapi cerita tidak berulang berturut-turut', () => {
    const seen = []; ui.modal = null;
    expect(restAtHome(1)).toBeTruthy(); seen.push(ui.homeResult.story.id); G.energy = 40;
    expect(restAtHome(1)).toBeTruthy(); seen.push(ui.homeResult.story.id); G.energy = 40;
    expect(restAtHome(1)).toBeNull(); expect(new Set(seen).size).toBe(2);
    startDay(); G.door = 1; openShop(); G.energy = 40; expect(restsLeft()).toBe(MAX_RESTS);
  });

  it('terlalu larut: hari berakhir bila istirahat melewati jam tutup tidak diizinkan', () => {
    G.h = 25.0; expect(restAtHome(2)).toBeNull(); expect(G.h).toBe(25.0);
  });

  it('cerita bersyarat: hujan, malam, utang, kepercayaan', () => {
    const ids = () => eligibleStories().map(h => h.id);
    expect(ids()).not.toContain('hujan_atap'); expect(ids()).not.toContain('doa_malam'); expect(ids()).not.toContain('tetangga');
    G.rain = { from: 0, len: 24 }; G.h = 10; expect(ids()).toContain('hujan_atap');
    G.rain = null; G.h = 21; expect(ids()).toContain('doa_malam');
    story().trust = 80; expect(ids()).toContain('tetangga');
    story().easy = false; story().lunas = false; story().debt = 500000; expect(ids()).toContain('catatan_utang'); expect(ids()).not.toContain('bebas_utang');
    story().lunas = true; story().debt = 0; expect(ids()).toContain('bebas_utang'); expect(ids()).not.toContain('catatan_utang');
  });

  it('data cerita rumah valid', () => {
    expect(HOME_STORIES.length).toBeGreaterThanOrEqual(10);
    expect(new Set(HOME_STORIES.map(h => h.id)).size).toBe(HOME_STORIES.length);
    for (const h of HOME_STORIES) { expect(h.title.length).toBeGreaterThan(3); expect(h.text.length).toBeGreaterThan(40); expect(h.fx).toBeTruthy(); }
  });
});
