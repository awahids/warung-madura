import { describe, it, expect, beforeEach } from 'vitest';
import { G, setG, ui } from '../src/game/state';
import { freshState } from '../src/game/persist';
import { startDay, openShop } from '../src/game/logic/day';
import { spawnCustomer, active, addToTray, doHitung, giveBill, confirmChange, carryKind } from '../src/game/logic/customers';
import { update } from '../src/game/update';
import { toWorldX, crowdFromGame, runAct } from '../src/game/engine3d';

function begin() { setG(freshState(G)); ui.modal = null; startDay(); G.door = 1; openShop(); G.firstCust = false; G.spawnCd = 1e9; }

describe('jembatan logika → 3D', () => {
  beforeEach(begin);

  it('memetakan slot antrean 2D ke dunia 3D (meter)', () => {
    expect(toWorldX(640)).toBeCloseTo(0);
    expect(toWorldX(450)).toBeLessThan(0);
    expect(toWorldX(835)).toBeGreaterThan(0);
    expect(toWorldX(-120)).toBeLessThan(-2.5);   // masuk dari luar layar kiri
  });

  it('kerumunan 3D mengikuti pelanggan game dengan kunci stabil', () => {
    spawnCustomer('ibu'); spawnCustomer('ojol');
    let n = 0; const next = () => ++n;
    const first = crowdFromGame(next);
    expect(first).toHaveLength(2);
    expect(first.map(p => p.type)).toEqual(['ibu', 'ojol']);
    expect(first[0].moving).toBe(true);                      // masih berjalan masuk
    const again = crowdFromGame(next);
    expect(again.map(p => p.key)).toEqual(first.map(p => p.key)); // kunci tidak berubah antar-frame
    for (let i = 0; i < 200 && !active(); i++) update(1 / 30);
    expect(crowdFromGame(next)[0].moving).toBe(false);       // sudah sampai di loket
  });

  it('klik barang 3D memanggil logika yang sama dengan versi 2D', () => {
    spawnCustomer('cowok'); for (let i = 0; i < 200 && !active(); i++) update(1 / 30);
    const stock = G.stock.aqua;
    runAct({ type: 'item', id: 'aqua' });
    expect(G.tray.aqua).toBe(1); expect(G.stock.aqua).toBe(stock - 1);
  });

  it('aksi barang diabaikan saat warung tutup, tetapi buku catatan tetap bisa dibuka', () => {
    G.doorState = 'closed';
    runAct({ type: 'item', id: 'aqua' });
    expect(G.tray.aqua).toBeUndefined();
    runAct({ type: 'buku' });
    expect(ui.modal).toBe('notebook');
  });

  it('pelanggan yang membayar mengulurkan uang, lalu mengambil dan membawa pulang belanjaan', () => {
    spawnCustomer('juragan'); for (let i = 0; i < 300 && !active(); i++) update(1 / 30);
    const c = active(); c.order = [{ id: 'galon', qty: 1 }]; c.total = 7000; c.pay = 10000; c.change = 3000;
    addToTray('galon'); doHitung();
    let n = 0; const next = () => ++n;
    expect(crowdFromGame(next)[0].pose).toBe('pay');
    giveBill(2000, c); giveBill(1000, c); confirmChange();
    expect(c.took).toBe(true); expect(c.carry).toBe('galon');
    const leaving = crowdFromGame(next)[0];
    expect(leaving.pose).toBe('take'); expect(leaving.carry).toBe('galon'); expect(leaving.pt).toBeLessThan(1.1);
    for (let i = 0; i < 40; i++) update(1 / 30);              // lewat 1,1 dtk → berjalan pergi sambil membawa
    const walking = crowdFromGame(next)[0];
    expect(walking.moving).toBe(true); expect(walking.pose).toBe('idle'); expect(walking.carry).toBe('galon');
  });

  it('jenis bawaan: barang besar dibawa langsung, selain itu kantong', () => {
    expect(carryKind([{ id: 'aqua', qty: 2 }])).toBe('bag');
    expect(carryKind([{ id: 'aqua', qty: 1 }, { id: 'gas', qty: 1 }])).toBe('gas');
    expect(carryKind([{ id: 'beras', qty: 1 }, { id: 'galon', qty: 1 }])).toBe('galon');
  });

  it('pelanggan yang pergi tanpa membeli tidak membawa apa-apa', () => {
    spawnCustomer('ibu'); for (let i = 0; i < 300 && !active(); i++) update(1 / 30);
    const c = active(); c.patience = .01; for (let i = 0; i < 5; i++) update(1 / 30);
    const gone = crowdFromGame(() => 1).find(p => p.pose === 'take');
    expect(gone).toBeUndefined();
  });

  it('pembayaran pas: ada fase terima uang (laci terbuka) sebelum mengambil belanjaan', () => {
    ui.mode3d = true;
    try {
      spawnCustomer('cowok'); for (let i = 0; i < 300 && !active(); i++) update(1 / 30);
      const c = active(); c.order = [{ id: 'aqua', qty: 1 }]; c.total = 4000; c.pay = 4000; c.change = 0;
      addToTray('aqua'); doHitung();                       // pas → langsung selesai
      expect(c.quick).toBe(true); expect(c.took).toBe(true); expect(c.walkAt).toBeGreaterThan(1.1);
      let n = 0; const next = () => ++n;
      expect(crowdFromGame(next)[0].pose).toBe('pay');     // awalnya: menyerahkan uang
      c.leaveT = c.walkAt - 1.1 + .3;                      // setelah fase terima uang
      const take = crowdFromGame(next)[0];
      expect(take.pose).toBe('take'); expect(take.pt).toBeCloseTo(.3, 5);
      c.leaveT = c.walkAt + .1;
      expect(crowdFromGame(next)[0].moving).toBe(true);
    } finally { ui.mode3d = false; }
  });

  it('di mode 2D pembayaran pas tidak menambah waktu berdiri', () => {
    ui.mode3d = false;
    spawnCustomer('cowok'); for (let i = 0; i < 300 && !active(); i++) update(1 / 30);
    const c = active(); c.order = [{ id: 'aqua', qty: 1 }]; c.total = 4000; c.pay = 4000; c.change = 0;
    addToTray('aqua'); doHitung();
    expect(c.walkAt).toBeUndefined();
  });
});
