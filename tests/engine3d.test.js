import { describe, it, expect, beforeEach } from 'vitest';
import { G, setG, ui } from '../src/game/state';
import { freshState } from '../src/game/persist';
import { startDay, openShop } from '../src/game/logic/day';
import { spawnCustomer, active } from '../src/game/logic/customers';
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
});
