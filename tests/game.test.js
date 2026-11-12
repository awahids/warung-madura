import { describe, it, expect, beforeEach, vi } from 'vitest';
import { START_STOCK } from '../src/game/data';
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
    expect(G.events).toHaveLength(0);                       // belum ada kasbon / tamu misterius
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
