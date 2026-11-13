import { describe, it, expect, beforeEach, vi } from 'vitest';
import { START_STOCK, BY, ITEMS } from '../src/game/data';
import { G, setG, ui } from '../src/game/state';
import { freshState } from '../src/game/persist';
import { startDay, openShop } from '../src/game/logic/day';
import { spawnCustomer } from '../src/game/logic/customers';
import { ITEM_LVL, itemOn } from '../src/game/logic/level';
import { socialTick, visitors, chat, TOPICS, TALKS, canChat, clearVisitors, speechOf, typedChars, isTalking, markSpeech, TYPE_CPS } from '../src/game/logic/social';
import { regState, regTier } from '../src/game/logic/regulars';
import { runAct } from '../src/game/engine3d';
import { bubbleSize } from '../src/game/render/scene';
import { placeBubble } from '../src/game/render/overlay3d';
import { REGULARS } from '../src/game/story/regulars';

function begin() { setG(freshState(G)); G.story.chapterSeen = 99; G.xp = 1e6; G.stock = { ...START_STOCK }; ui.modal = null; startDay(); G.door = 1; openShop(); G.firstCust = false; G.spawnCd = 1e9; G.events = []; }

describe('barang baru', () => {
  it('semua barang punya harga jual > modal, stok awal, dan level buka', () => {
    for (const it of ITEMS) { expect(it.price).toBeGreaterThan(it.cost); expect(START_STOCK[it.id]).toBeGreaterThan(0); expect(ITEM_LVL[it.id]).toBeGreaterThan(0); }
    for (const id of ['telur', 'minyak', 'gula', 'sabun', 'susu', 'teh']) expect(BY[id]).toBeTruthy();
  });
  it('telur bisa basi; ibu memesan barang baru bila sudah terbuka', () => {
    begin(); expect(itemOn('minyak')).toBe(true); expect(BY.telur.shelf).toBeGreaterThan(0);
    const seen = new Set(); for (let i = 0; i < 400; i++) { G.cust.length = 0; spawnCustomer('ibu'); G.cust[0].order.forEach(l => seen.add(l.id)); }
    for (const id of ['telur', 'minyak', 'gula']) expect(seen.has(id)).toBe(true);
  });
});

describe('sosialisasi dengan warga', () => {
  beforeEach(begin);

  it('warga mampir dan duduk di bangku (maks. 2), tidak yang sedang jadi karyawan/antre', () => {
    const rnd = vi.spyOn(Math, 'random').mockReturnValue(0);
    for (let i = 0; i < 6; i++) socialTick(1);
    rnd.mockRestore();
    const v = visitors(); expect(v).toHaveLength(2); expect(new Set(v.map(x => x.seat)).size).toBe(2);
    expect(new Set(v.map(x => x.id)).size).toBe(2); v.forEach(x => expect(x.talks).toBe(TALKS));
  });

  it('ngobrol: kedekatan & kewarasan naik, topik tak bisa diulang, kesempatan terbatas', () => {
    G.social = { v: [{ vid: 1, id: 'wati', seat: 0, until: G.abs + 150, talks: TALKS, used: {}, log: null, talked: false }], nid: 2, chats: 0 };
    G.energy = 50; const a0 = regState('wati').aff;
    const r1 = chat(1, 'kabar'); expect(r1.text.length).toBeGreaterThan(5);
    expect(regState('wati').aff).toBeGreaterThan(a0); expect(G.energy).toBe(58);
    expect(chat(1, 'kabar')).toBeNull();                               // topik sama tidak bisa lagi
    const kopi = G.stock.kopi; expect(chat(1, 'traktir')).toBeTruthy(); expect(G.stock.kopi).toBe(kopi - 1);
    expect(canChat(visitors()[0])).toBe(false);                        // 2 kesempatan habis
    expect(chat(1, 'curhat')).toBeNull();
    expect(visitors()[0].until).toBeLessThanOrEqual(G.abs + 25);       // lalu pamit
  });

  it('traktir butuh kopi; saran memasang "dari mulut ke mulut" yang menaikkan pesanan barang itu', () => {
    G.social = { v: [{ vid: 1, id: 'sri', seat: 0, until: G.abs + 150, talks: TALKS, used: {}, log: null, talked: false }], nid: 2, chats: 0 };
    G.stock.kopi = 0; expect(TOPICS.find(t => t.id === 'traktir').ok()).toBe(false); expect(chat(1, 'traktir')).toBeNull();
    chat(1, 'saran'); expect(G.buzz && G.buzz.day === G.day).toBe(true);
    const id = G.buzz.id; let withBuzz = 0, without = 0;
    for (let i = 0; i < 600; i++) { G.cust.length = 0; spawnCustomer('ibu'); if (G.cust[0].order.some(l => l.id === id)) withBuzz++; }
    G.buzz = null;
    for (let i = 0; i < 600; i++) { G.cust.length = 0; spawnCustomer('ibu'); if (G.cust[0].order.some(l => l.id === id)) without++; }
    expect(withBuzz).toBeGreaterThan(without);
  });

  it('klik warga 3D membuka obrolan; pergi saat waktu habis; hari baru mengosongkan bangku', () => {
    G.social = { v: [{ vid: 7, id: 'dimas', seat: 1, until: G.abs + 30, talks: TALKS, used: {}, log: null, talked: false }], nid: 8, chats: 0 };
    runAct({ type: 'warga', slot: 1 }, null); expect(ui.modal).toBe('ngobrol'); expect(ui.chatId).toBe(7);
    ui.modal = null; G.abs += 31; socialTick(.01); expect(visitors()).toHaveLength(0);
    G.social.v.push({ vid: 9, id: 'rani', seat: 0, until: G.abs + 99, talks: 2, used: {}, log: null, talked: false });
    startDay(); expect(visitors()).toHaveLength(0); clearVisitors();
  });
  it('data warga konsisten', () => { for (const r of REGULARS) { expect(regTier(r.id)).toBeGreaterThanOrEqual(0); expect(r.say.length).toBeGreaterThan(0); } });
});

describe('balon pesanan tidak menutupi barang', () => {
  beforeEach(begin);
  it('versi ringkas lebih kecil dari versi penuh', () => {
    spawnCustomer('ibu'); const c = G.cust[0]; c.order = [{ id: 'telur', qty: 3 }, { id: 'minyak', qty: 1 }, { id: 'gula', qty: 1 }, { id: 'kopi', qty: 2 }];
    const mini = bubbleSize(c, true);      // versi penuh lebar 296 & mengukur teks (butuh kanvas)
    expect(mini.w).toBeLessThan(296); expect(mini.hh).toBeLessThan(40 + 18 * 2 + 36 * c.order.length + 22);
  });
  it('penempatan memilih area yang paling sedikit menutupi barang & tetap di dalam layar', () => {
    spawnCustomer('ibu'); const c = G.cust[0], { w, hh } = bubbleSize(c, true);
    // barang memenuhi sisi kanan atas → balon harus menjauh dari sana
    const rects = [{ id: 'a', x: 700, y: 60, w: 560, h: 260 }, { id: 'b', x: 560, y: 80, w: 130, h: 200 }];
    const view = { itemRects: rects, courierWaiting: false, socialChip: false };
    ui.bubbleAt = null;
    for (let i = 0; i < 60; i++) placeBubble(w, hh, { x: 600, y: 300 }, view);
    const at = placeBubble(w, hh, { x: 600, y: 300 }, view);
    const ov = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    const r = { x: at.x, y: at.y, w, h: hh };
    expect(rects.reduce((s, q) => s + ov(r, q), 0)).toBeLessThan(w * hh * .1);
    expect(at.x).toBeGreaterThanOrEqual(0); expect(at.x + w).toBeLessThanOrEqual(1280); expect(at.y + hh).toBeLessThanOrEqual(720);
  });
});

describe('animasi bicara', () => {
  beforeEach(begin);
  const mk = () => ({ vid: 1, id: 'wati', seat: 0, until: G.abs + 150, talks: TALKS, used: {}, log: null, talked: false });
  it('sapaan awal diketik bertahap; mulut bergerak hanya selama teks belum selesai', () => {
    const v = mk(); G.social = { v: [v], nid: 2, chats: 0 };
    markSpeech(v); const t0 = v.speechAt, full = speechOf(v).length;
    expect(full).toBeGreaterThan(10);
    expect(typedChars(v, t0)).toBe(0); expect(isTalking(v, t0)).toBe(true);
    expect(typedChars(v, t0 + 1000 * 5 / TYPE_CPS)).toBe(5);
    expect(isTalking(v, t0 + 1000 * (full - 1) / TYPE_CPS)).toBe(true);
    expect(isTalking(v, t0 + 1000 * (full + 2) / TYPE_CPS)).toBe(false);
    expect(typedChars(v, t0 + 1e7)).toBe(full);                       // tidak melebihi panjang teks
  });
  it('memilih topik memulai ucapan baru (jawaban warga) dan bisa dilewati', () => {
    const v = mk(); G.social = { v: [v], nid: 2, chats: 0 }; markSpeech(v);
    const res = chat(1, 'kabar'); expect(speechOf(v)).toBe(res.text);
    expect(isTalking(v, v.speechAt + 1)).toBe(true);
    v.speechAt = -1e9; expect(isTalking(v)).toBe(false);              // ketuk balon → langsung selesai
  });
  it('tanpa penanda waktu dianggap sudah selesai bicara (aman untuk data lama)', () => { const v = mk(); expect(isTalking(v)).toBe(false); });
});
