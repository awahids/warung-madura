import { describe, it, expect, beforeEach, vi } from 'vitest';
import { START_STOCK } from '../src/game/data';
import { chooseEvent, choiceOk, closeStoryEvent, eventById, story } from '../src/game/logic/story';
import { G, setG, ui } from '../src/game/state';
import { freshState } from '../src/game/persist';
import { ITEMS } from '../src/game/data';
import { rp } from '../src/game/util';
import { startDay, openShop, nextDay } from '../src/game/logic/day';
import {
  spawnCustomer, active, addToTray, doHitung, trayMatches, giveBill, confirmChange,
  doKasbon, doHabis,
} from '../src/game/logic/customers';
import { orderCost, packPrice, placeOrder, receiveDelivery } from '../src/game/logic/actions';
import { update } from '../src/game/update';

function begin() { setG(freshState(G)); G.xp = 1e6; G.stock = { ...START_STOCK }; ui.modal = null; startDay(); G.door = 1; openShop(); G.firstCust = false; G.spawnCd = 1e9; }
function arrive() { for (let i = 0; i < 200 && !active(); i++) update(1 / 30); return active(); }

describe('util', () => {
  it('memformat rupiah', () => { expect(rp(1500000)).toBe('Rp 1.500.000'); });
});

describe('transaksi', () => {
  beforeEach(begin);

  it('pesanan cocok menghitung total & kembalian', () => {
    spawnCustomer('cowok'); const c = arrive();
    c.order = [{ id: 'rokok', qty: 2 }, { id: 'kopi', qty: 1 }];
    c.pay = 10000; c.total = 6000; c.change = 4000;
    expect(trayMatches(c)).toBe(false);
    addToTray('rokok'); addToTray('rokok'); addToTray('kopi');
    expect(trayMatches(c)).toBe(true);
    const before = G.money, stock = G.stock.rokok;
    doHitung(); expect(c.stage).toBe('pay');
    giveBill(2000, c); giveBill(2000, c);
    const rand = vi.spyOn(Math, 'random').mockReturnValue(.99); // tanpa tip acak
    confirmChange(); rand.mockRestore();
    expect(G.money - before).toBe(6000);
    expect(G.stock.rokok).toBe(stock);          // stok sudah dikurangi saat diambil
    expect(G.stats.served).toBe(1);
  });

  it('kembalian kurang tidak boleh dikonfirmasi', () => {
    spawnCustomer('cowok'); const c = arrive();
    c.order = [{ id: 'aqua', qty: 1 }]; c.total = 4000; c.pay = 10000; c.change = 6000;
    addToTray('aqua'); doHitung(); giveBill(2000, c); confirmChange();
    expect(c.stage).toBe('pay'); expect(G.stats.served).toBe(0);
  });

  it('kasbon dicatat sebagai piutang', () => {
    spawnCustomer('ibu', 'kasbon'); const c = arrive();
    c.order = [{ id: 'galon', qty: 1 }]; c.total = 7000;
    addToTray('galon'); doHitung(); expect(c.stage).toBe('kasbon');
    doKasbon(true); expect(G.debts).toHaveLength(1); expect(G.debts[0].amount).toBe(7000);
  });

  it('"maaf habis" menyesuaikan pesanan dengan stok', () => {
    G.stock.beras = 0;
    spawnCustomer('ibu'); const c = arrive();
    c.order = [{ id: 'beras', qty: 1 }, { id: 'kerupuk', qty: 1 }];
    addToTray('kerupuk'); doHabis();
    expect(c.order).toEqual([{ id: 'kerupuk', qty: 1 }]);
  });
});

describe('stok grosir', () => {
  beforeEach(begin);
  it('pesan → kurir tiba → stok bertambah', () => {
    G.cart = { bensin: 2 };
    expect(orderCost()).toBe(2 * packPrice(ITEMS.find(i => i.id === 'bensin')));   // sudah termasuk diskon level
    const money = G.money, stock = G.stock.bensin;
    placeOrder(); expect(G.money).toBeLessThan(money);
    G.abs += 100; receiveDelivery();
    expect(G.stock.bensin).toBe(stock + 10);
  });
});

describe('simulasi bot 3 hari', () => {
  it('berjalan tanpa error, uang & hari bertambah', () => {
    begin(); G.spawnCd = 0;
    for (let day = 1; day <= 3; day++) {
      if (day > 1) { nextDay(); G.door = 1; openShop(); G.firstCust = false; G.spawnCd = 0; }
      let guard = 0;
      while (!G.closing && guard++ < 200000) {
        update(1 / 30);
        const c = active();
        if (c) {
          if (c.stage === 'order') {
            for (const l of c.order) while ((G.tray[l.id] || 0) < l.qty && G.stock[l.id] > 0) addToTray(l.id);
            c.order.some(l => (G.tray[l.id] || 0) < l.qty) ? doHabis() : doHitung();
          } else if (c.stage === 'kasbon') doKasbon(true);
          else if (c.stage === 'pay') {
            let need = c.change; for (const v of [50000, 20000, 10000, 5000, 2000, 1000]) while (need >= v) { giveBill(v, c); need -= v; }
            confirmChange();
          }
        }
        if (guard % 300 === 0) { G.cart = { kopi: 1, rokok: 1, bensin: 1, aqua: 1, mie: 1, snack: 1 }; placeOrder(); }
        if (G.deliveries.some(d => G.abs >= d.eta)) receiveDelivery();
        G.energy = Math.max(G.energy, 40);
        if (ui.modal === 'win') ui.modal = null;
        if (ui.modal === 'event') { if (!story().result) chooseEvent(story().cur && eventById(story().cur).choices.findIndex(c => choiceOk(c))); closeStoryEvent(); }   // jawab kejadian cerita
      }
      for (let i = 0; i < 600 && ui.modal !== 'summary'; i++) update(1 / 30);
      expect(ui.modal).toBe('summary');
      expect(G.stats.served).toBeGreaterThan(10);
    }
    expect(G.day).toBe(3);
    expect(G.money).toBeGreaterThan(0);
  });
});

describe('level & pesan lewat HP', () => {
  beforeEach(() => { setG(freshState(G)); ui.modal = null; startDay(); });

  it('XP menaikkan level dan memberi bonus kas', async () => {
    const { addXp, level, xpAt, discountOf, etaOf } = await import('../src/game/logic/level');
    expect(level()).toBe(1);
    const money = G.money; addXp(xpAt(2));
    expect(level()).toBe(2); expect(G.money).toBe(money + 20000);
    addXp(xpAt(4) - G.xp); expect(level()).toBe(4);
    expect(discountOf(4)).toBeCloseTo(.06); expect(etaOf(4)).toBe(78);
  });

  it('diskon level dan kurir lebih cepat saat memesan', async () => {
    const { addXp, xpAt, etaOf } = await import('../src/game/logic/level');
    const { packPrice, orderCost, placeOrder } = await import('../src/game/logic/actions');
    const { ITEMS } = await import('../src/game/data');
    G.cart = { kopi: 2 }; expect(orderCost()).toBe(24000);
    addXp(xpAt(6)); G.money = 1e6;
    expect(packPrice(ITEMS[0])).toBe(10800);               // 12000 − 10%
    G.cart = { kopi: 2 }; const abs = G.abs; placeOrder();
    expect(G.deliveries[0].eta).toBe(abs + etaOf(6));
    expect(G.deliveries[0].items.kopi).toBe(20);
  });
});

describe('level membuka barang, pembeli, dan fitur', () => {
  beforeEach(() => { setG(freshState(G)); ui.modal = null; startDay(); });

  it('level 1: hanya 6 barang dasar dan pembeli dasar', async () => {
    const { itemOn, typeOn, featureOn } = await import('../src/game/logic/level');
    expect(itemOn('kopi')).toBe(true); expect(itemOn('gas')).toBe(false); expect(itemOn('cola')).toBe(false);
    expect(typeOn('ojol')).toBe(true); expect(typeOn('ibu')).toBe(false); expect(typeOn('juragan')).toBe(false);
    expect(featureOn('promo')).toBe(false); expect(featureOn('kasbon')).toBe(false);
    expect(G.stock.gas).toBeUndefined();
    expect(G.events.filter(e => e.k !== 'story')).toHaveLength(0);   // belum ada kasbon / tamu misterius
  });

  it('pembeli hanya memesan barang yang sudah terbuka', () => {
    for (let i = 0; i < 80; i++) {
      G.cust = [];
      spawnCustomer();
      const c = G.cust[0];
      expect(['ojol', 'pemuda', 'cowok']).toContain(c.type);
      for (const l of c.order) expect(['kopi', 'rokok', 'aqua', 'mie', 'snack', 'kerupuk']).toContain(l.id);
    }
  });

  it('barang terkunci tidak bisa dijual atau dipesan', async () => {
    const { baseCost } = await import('../src/game/logic/actions');
    spawnCustomer('ojol'); for (let i = 0; i < 200 && !active(); i++) update(1 / 30);
    G.stock.gas = 5; addToTray('gas'); expect(G.tray.gas).toBeUndefined();
    G.cart = { gas: 2 }; expect(baseCost()).toBe(0);
  });

  it('naik level membuka barang baru + stok perkenalan, pembeli, dan fitur', async () => {
    const { addXp, xpAt, itemOn, typeOn, featureOn, unlocksAt } = await import('../src/game/logic/level');
    const { usePromo } = await import('../src/game/logic/actions');
    usePromo(); expect(G.promo).toBe(false);                // promo terkunci
    addXp(xpAt(2));
    expect(itemOn('cola')).toBe(true); expect(G.stock.cola).toBeGreaterThan(0);
    expect(typeOn('ibu')).toBe(true); expect(featureOn('promo')).toBe(true);
    G.money = 100000; usePromo(); expect(G.promo).toBe(true);
    expect(unlocksAt(2).map(u => u.k).sort()).toEqual(['Barang', 'Fitur', 'Pembeli']);
    addXp(xpAt(8) - G.xp);
    expect(itemOn('gas')).toBe(true); expect(featureOn('express')).toBe(true);
  });

  it('pesan ulang dan kurir ekspres (level tinggi)', async () => {
    const { addXp, xpAt } = await import('../src/game/logic/level');
    const { placeOrder, reorder, orderCost, baseCost } = await import('../src/game/logic/actions');
    addXp(xpAt(8)); G.money = 1e6;
    G.cart = { kopi: 1 }; placeOrder(); expect(G.cart).toEqual({});
    reorder(); expect(G.cart).toEqual({ kopi: 1 });
    G.express = true; expect(orderCost()).toBe(baseCost() + Math.round(baseCost() * .15));
    const abs = G.abs; placeOrder(); expect(G.deliveries[1].eta).toBe(abs + 30);
  });
});

describe('pembeli baru (pelajar, tukang, turis)', () => {
  beforeEach(begin);

  it('muncul sesuai level dan hanya memesan barang yang terbuka', async () => {
    const { TYPE_LVL, ITEM_LVL, itemOn } = await import('../src/game/logic/level');
    expect(TYPE_LVL).toMatchObject({ pelajar: 3, tukang: 5, turis: 7 });
    G.xp = 0; setG(freshState(G)); startDay();           // level 1: tidak ada pembeli baru
    for (let i = 0; i < 120; i++) { G.cust = []; spawnCustomer(); expect(['pelajar', 'tukang', 'turis']).not.toContain(G.cust[0].type); }
    G.xp = 1e6; const seen = new Set();
    for (let i = 0; i < 600; i++) { G.cust = []; spawnCustomer(); const c = G.cust[0]; seen.add(c.type); for (const l of c.order) expect(itemOn(l.id)).toBe(true); }
    expect([...seen]).toEqual(expect.arrayContaining(['pelajar', 'tukang', 'turis']));
    expect(ITEM_LVL.redbull).toBeLessThanOrEqual(7);
  });

  it('turis membayar pecahan besar', () => {
    for (let i = 0; i < 40; i++) { G.cust = []; spawnCustomer('turis'); expect(G.cust[0].pay).toBeGreaterThanOrEqual(50000); }
  });

  it('semua tipe punya tampilan 3D (termasuk variasi)', async () => {
    const { VARIANTS } = await import('../src/scene3d/people');
    const { TYPES } = await import('../src/game/data');
    for (const t of ['pelajar', 'tukang', 'turis']) expect(TYPES[t]).toBeTruthy();
    expect(VARIANTS.pelajar).toHaveLength(2); expect(VARIANTS.turis).toHaveLength(2);
  });
});

describe('cerita: utang, kepercayaan, kejadian', () => {
  beforeEach(() => { setG(freshState(G)); ui.modal = null; startDay(); });

  it('utang awal Rp 1,2 jt, cicilan hari ke-4, kepercayaan 50', async () => {
    const S = await import('../src/game/logic/story');
    expect(S.story().debt).toBe(1200000); expect(S.story().due).toBe(4); expect(S.trust()).toBe(50);
    expect(S.installment()).toBe(90000);
  });

  it('cicilan dibayar bila saldo cukup; menunggak menambah bunga & menahan pesanan', async () => {
    const S = await import('../src/game/logic/story'); const { finishClose } = await import('../src/game/logic/day');
    G.day = 4; G.money = 500000; finishClose();
    expect(G.money).toBe(410000); expect(S.story().debt).toBe(1110000); expect(S.story().due).toBe(7);
    G.day = 7; G.money = 1000; finishClose();                         // menunggak #1
    expect(S.story().arrears).toBe(1); expect(S.story().debt).toBe(Math.round(1110000 * 1.05)); expect(S.story().due).toBe(8);
    G.day = 8; G.money = 1000; finishClose();                         // menunggak #2 → pesanan besok ditahan
    expect(S.story().arrears).toBe(2); G.day = 9; expect(S.orderBlocked()).toBe(true);
    G.cart = { kopi: 1 }; G.money = 1e6; const before = G.deliveries.length;
    const { placeOrder } = await import('../src/game/logic/actions'); placeOrder(); expect(G.deliveries.length).toBe(before);
  });

  it('mode santai meniadakan cicilan; utang lunas menghentikan cicilan', async () => {
    const S = await import('../src/game/logic/story'); const { finishClose } = await import('../src/game/logic/day');
    S.story().easy = true; G.day = 4; G.money = 0; finishClose(); expect(S.story().arrears).toBe(0);
    S.story().easy = false; S.story().debt = 80000; G.day = 4; G.money = 200000; finishClose();
    expect(S.story().lunas).toBe(true); expect(S.story().debt).toBe(0); expect(G.money).toBe(120000);
  });

  it('bayar utang lebih awal mengurangi sisa utang dan bisa melunasi', async () => {
    const S = await import('../src/game/logic/story'); G.money = 500000;
    expect(S.payDebt(50000)).toBe(true); expect(S.story().debt).toBe(1150000); expect(G.money).toBe(450000);
    S.story().debt = 30000; expect(S.payDebt(50000)).toBe(true); expect(S.story().lunas).toBe(true); expect(G.money).toBe(420000);
    G.money = 10; S.story().lunas = false; S.story().debt = 100000; expect(S.payDebt(50000)).toBe(false);
  });

  it('kepercayaan mengubah kesabaran pembeli dan peluang kasbon dilunasi', async () => {
    const S = await import('../src/game/logic/story');
    S.changeTrust(50); expect(S.trust()).toBe(100); expect(S.trustMul()).toBeCloseTo(1.12); expect(S.repayChance()).toBeCloseTo(.85);
    S.changeTrust(-200); expect(S.trust()).toBe(0); expect(S.trustMul()).toBeCloseTo(.88); expect(S.repayChance()).toBeCloseTo(.45);
    S.story().trust = 50; expect(S.repayChance()).toBeCloseTo(.65);
  });

  it('kejadian bab berurutan; pilihan menerapkan efek, kabar lanjutan datang di pagi hari', async () => {
    const S = await import('../src/game/logic/story');
    expect(S.pickEvent().id).toBe('jaka_kopi');
    S.openStoryEvent(); expect(ui.modal).toBe('event');
    const k = G.stock.kopi; S.chooseEvent(0);                           // kasih gratis
    expect(G.stock.kopi).toBe(k - 1); expect(S.trust()).toBe(53); expect(S.story().result.lines).toContain('Kepercayaan +3');
    S.closeStoryEvent(); expect(ui.modal).toBeNull(); expect(S.story().done).toContain('jaka_kopi');
    expect(S.pickEvent().id).toBe('kembalian');
    S.openStoryEvent(); G.money = 100000; S.chooseEvent(2);            // catat, ganti nanti → kabar 2 hari lagi
    expect(S.story().queue).toHaveLength(1); S.closeStoryEvent();
    G.day = 3; startDay(); expect(G.morning.some(m => m.includes('Orang itu mampir'))).toBe(true); expect(S.story().queue).toHaveLength(0);
  });

  it('pilihan dengan syarat tidak bisa dipilih bila stok/uang kurang', async () => {
    const S = await import('../src/game/logic/story');
    G.stock.aqua = 0; const ev = S.eventById('darto_pesan'); expect(S.choiceOk(ev.choices[0])).toBe(false); expect(S.choiceOk(ev.choices[2])).toBe(true);
    G.money = 1000; expect(S.choiceOk(S.eventById('kembalian').choices[0])).toBe(false);
  });

  it('bab mengikuti level; save menyimpan cerita', async () => {
    const S = await import('../src/game/logic/story'); const { addXp, xpAt } = await import('../src/game/logic/level');
    expect(S.chapterOf()).toBe(1); addXp(xpAt(3)); expect(S.chapterOf()).toBe(2); expect(S.chapterName()).toBe('Kasbon');
    const mem = {}; vi.stubGlobal('localStorage', { setItem: (k, v) => { mem[k] = v; }, getItem: k => mem[k] ?? null, removeItem: k => { delete mem[k]; } });
    const { save, loadSave } = await import('../src/game/persist'); S.changeTrust(7); save();
    expect(loadSave().story.trust).toBe(57); expect(loadSave().story.cur).toBeNull(); vi.unstubAllGlobals();
  });
});

describe('cerita Bab 3–5 dan epilog', () => {
  beforeEach(() => { setG(freshState(G)); ui.modal = null; startDay(); });
  const play = async (S, E, max = 20) => {   // memainkan kejadian bab berurutan, selalu memilih opsi pertama yang bisa dipilih
    const seq = [];
    for (let i = 0; i < max; i++) {
      const ev = S.pickEvent(); if (!ev || !E.SCRIPT.includes(ev)) break;
      seq.push(ev.id); S.openStoryEvent(ev.id); S.chooseEvent(ev.choices.findIndex(c => S.choiceOk(c))); S.closeStoryEvent();
    }
    return seq;
  };

  it('urutan Bab 3 → 5; kejadian bersyarat hanya muncul bila syaratnya terpenuhi', async () => {
    const S = await import('../src/game/logic/story'), E = await import('../src/game/story/events'), L = await import('../src/game/logic/level');
    L.addXp(L.xpAt(8)); G.money = 1e6; S.story().done = E.SCRIPT.filter(e => e.ch <= 2).map(e => e.id);
    const seq = await play(S, E);
    expect(seq.slice(0, 4)).toEqual(['hujan_harga', 'banjir_titip', 'turis_hujan', 'haji_hujan_belum']);   // tanpa utang Pak Darto & belum lunas
    expect(seq).not.toContain('darto_macet'); expect(seq).not.toContain('haji_hujan_lunas');
    expect(seq.slice(4, 7)).toEqual(['tamu_1', 'tamu_2', 'tamu_3']);
    expect(seq.slice(7, 9)).toEqual(['rt_titik', 'pilihan_besar']);
    expect(seq).toHaveLength(10); expect(seq[9]).toMatch(/^haji_akhir_/);
  });

  it('flag utang Pak Darto membuka kejadian macet; lunas memilih sambutan Pak Haji yang lain', async () => {
    const S = await import('../src/game/logic/story'), E = await import('../src/game/story/events'), L = await import('../src/game/logic/level');
    L.addXp(L.xpAt(5)); S.story().done = E.SCRIPT.filter(e => e.ch <= 2).map(e => e.id); S.story().flags.darto_utang = true; S.story().lunas = true;
    const seq = await play(S, E, 8);
    expect(seq).toContain('darto_macet'); expect(seq).toContain('haji_hujan_lunas'); expect(seq).not.toContain('haji_hujan_belum');
  });

  it('kejadian tamu bertudung dijadwalkan tengah malam', async () => {
    const S = await import('../src/game/logic/story'), E = await import('../src/game/story/events'), L = await import('../src/game/logic/level');
    L.addXp(L.xpAt(7)); S.story().done = E.SCRIPT.filter(e => e.ch <= 3).map(e => e.id);
    const ev = []; S.scheduleStory(ev); expect(ev[0].id).toBe('tamu_1'); expect(ev[0].t).toBeGreaterThanOrEqual(23.2);
    S.story().done.push('tamu_1', 'tamu_2', 'tamu_3'); const ev2 = []; S.scheduleStory(ev2); expect(ev2[0].t).toBeLessThan(19);   // kejadian siang / kolam acak
  });

  it('epilog: dipercaya / untung / bertahan', async () => {
    const S = await import('../src/game/logic/story');
    S.story().trust = 70; S.story().lunas = true; expect(S.endingId()).toBe('dipercaya');
    S.story().lunas = false; G.money = 100000; expect(S.endingId()).toBe('bertahan');
    S.story().trust = 30; G.money = 800000; expect(S.endingId()).toBe('untung');
    S.story().trust = 30; G.money = 1000; expect(S.endingId()).toBe('bertahan');
  });

  it('kejadian penutup membuka epilog (sekali) dan menyimpan pilihan besar', async () => {
    const S = await import('../src/game/logic/story'), E = await import('../src/game/story/events'), L = await import('../src/game/logic/level');
    L.addXp(L.xpAt(8)); G.money = 1e6; S.story().done = E.SCRIPT.filter(e => e.id !== 'haji_akhir_tinggi' && e.id !== 'haji_akhir_biasa' && e.id !== 'haji_akhir_rendah' && e.id !== 'pilihan_besar').map(e => e.id);
    S.story().trust = 80; S.story().lunas = true;
    S.openStoryEvent('pilihan_besar'); S.chooseEvent(1); S.closeStoryEvent();
    expect(S.story().flags.layanan).toBe(true);
    const fin = S.pickEvent(); expect(fin.id).toBe('haji_akhir_tinggi');
    S.openStoryEvent(fin.id); S.chooseEvent(0); S.closeStoryEvent();
    expect(ui.modal).toBe('epilog'); expect(S.story().ending).toBe('dipercaya');
    const ep = S.epilog(); expect(ep.title).toBe('WARUNG KITA'); expect(ep.lines.join(' ')).toContain('pulsa'); expect(ep.lines.join(' ')).toContain('lunas');
    expect(['haji_akhir_biasa', 'haji_akhir_rendah']).not.toContain(S.pickEvent() && S.pickEvent().id);
  });
});

describe('validasi data cerita', () => {
  it('semua kejadian konsisten: id unik, efek sah, barang sudah terbuka, flag dan syarat nyambung', async () => {
    const E = await import('../src/game/story/events'), L = await import('../src/game/logic/level'), D = await import('../src/game/data');
    const all = [...E.SCRIPT, ...E.POOL], ids = all.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    const FX = ['money', 'trust', 'rep', 'energy', 'xp', 'stock', 'flag', 'debt', 'dueShift', 'kasbon'], WHEN = ['lunas', 'flag', 'noFlag', 'trustMin', 'trustMax'];
    const chStart = { 1: 1, 2: 3, 3: 5, 4: 7, 5: 8 };
    const setFlags = new Set(); all.forEach(e => e.choices.forEach(c => c.fx && c.fx.flag && setFlags.add(c.fx.flag)));
    expect(E.POOL.length).toBeGreaterThanOrEqual(20);
    for (const ev of all) {
      const lvl = ev.ch ? chStart[ev.ch] : ev.minLevel;
      expect(typeof ev.who).toBe('string'); expect(ev.text.length).toBeGreaterThan(20); expect(ev.choices.length).toBeGreaterThanOrEqual(1); expect(ev.choices.length).toBeLessThanOrEqual(3);
      for (const k of Object.keys(ev.when || {})) expect(WHEN).toContain(k);
      if (ev.when && ev.when.flag) expect(setFlags.has(ev.when.flag)).toBe(true);
      for (const c of ev.choices) {
        expect(c.t.length).toBeLessThanOrEqual(46); expect(c.res.length).toBeGreaterThan(5);
        for (const k of Object.keys(c.fx || {})) expect(FX).toContain(k);
        for (const src of [c.fx && c.fx.stock, c.req && c.req.stock]) for (const id of Object.keys(src || {})) { expect(D.BY[id]).toBeTruthy(); expect(L.ITEM_LVL[id]).toBeLessThanOrEqual(lvl); }
        if (c.fx && c.fx.kasbon) expect(c.fx.kasbon.amount).toBeGreaterThan(0);
        for (const l of c.later || []) { expect(l.days).toBeGreaterThanOrEqual(0); expect(typeof l.text).toBe('string'); if (l.chance !== undefined) { expect(l.chance).toBeGreaterThan(0); expect(l.chance).toBeLessThan(1); if (l.elseText) expect(typeof l.elseText).toBe('string'); } }
      }
    }
    // grup penutup: tiap kejadian final punya grup, dan syarat trust tidak saling tumpang tindih
    const fin = E.SCRIPT.filter(e => e.final); expect(fin.length).toBe(3); fin.forEach(e => expect(e.group).toBe('akhir'));
  });
});
