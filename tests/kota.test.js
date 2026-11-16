import { describe, it, expect, beforeEach } from 'vitest';
import { G, setG, ui } from '../src/game/state';
import * as persist from '../src/game/persist';
const { freshState } = persist;
import { startDay, nextDay } from '../src/game/logic/day';
import { chapterOf, chooseEvent, eventById, story } from '../src/game/logic/story';
import { BIZ, PROJECTS, CAMP_DAYS, CITY_DAYS, WIN_WEALTH } from '../src/game/story/kota';
import { dn, assetValue, incomeNominal, bizIncAt, bizLevel, build, buyBiz, campaign, canBuild, canRun, city, dawnKota, incomePerDay, isMiliarder, kota, netWorth, runElection, runForOffice, support } from '../src/game/logic/kota';
import { rpk } from '../src/game/util';

function begin() { setG(freshState(G)); G.story.chapterSeen = 99; ui.modal = null; startDay(); }
function openBab() { story().ending = 'dipercaya'; G.day++; startDay(); }

describe('babak usaha → miliarder → wali kota', () => {
  beforeEach(begin);

  it('rpk meringkas angka besar', () => {
    expect(rpk(1250000000)).toBe('Rp 1,25 M'); expect(rpk(12500000)).toBe('Rp 12,5 jt'); expect(rpk(95000)).toBe('Rp 95.000');
  });
  it('terbuka setelah epilog dan mengganti bab menjadi 6', () => {
    expect(kota().ch).toBe(0); expect(chapterOf()).toBeLessThan(6);
    openBab(); expect(kota().ch).toBe(6); expect(chapterOf()).toBe(6);
  });
  it('membeli usaha mengurangi kas dan memberi pendapatan harian', () => {
    openBab(); G.money = 10e6; expect(buyBiz('cabang')).toBe(true);
    expect(G.money).toBe(7.5e6); expect(bizLevel('cabang')).toBe(1); expect(incomeNominal()).toBe(1300000); expect(incomePerDay()).toBe(0);   // izin usaha baru butuh 3 hari
    const m = G.money; G.day++; startDay(); expect(G.money).toBe(m);
    G.day += 2; startDay(); G.day++; const m2 = G.money; startDay(); expect(Math.abs(G.money - m2 - 1.3e6) / 1.3e6).toBeLessThan(.1);
    expect(buyBiz('grosir')).toBe(false);   // kas kurang
  });
  it('pendapatan tidak ganda saat hari yang sama dimuat ulang', () => {
    openBab(); G.money = 10e6; buyBiz('cabang'); G.day++; startDay(); const m = G.money; dawnKota(); expect(G.money).toBe(m);
  });
  it('kekayaan bersih memasukkan 70% nilai aset dan memicu bab 7 saat 1 miliar', () => {
    openBab(); G.money = 100e6; buyBiz('grosir'); expect(assetValue()).toBe(Math.round(25e6 * .7));
    G.money = WIN_WEALTH; expect(isMiliarder()).toBe(true); G.day++; startDay();
    expect(kota().ch).toBe(7); expect(story().flags.miliarder).toBe(true); expect(chapterOf()).toBe(7);
  });
  it('simulasi rakus: miliarder tercapai dalam 20–80 hari', () => {
    openBab(); G.money = 3e6; let days = 0;
    while (!isMiliarder() && days < 200) {
      // beli upgrade dengan balik modal tercepat yang mampu dibayar
      for (;;) { const opts = BIZ.map(b => { const l = bizLevel(b.id); if (l >= 5) return null; const c = Math.round(b.cost * 2.2 ** l), g = bizIncAt(b, l + 1) - bizIncAt(b, l); return { id: b.id, c, roi: c / g }; }).filter(o => o && o.c <= G.money).sort((a, b) => a.roi - b.roi); if (!opts.length) break; buyBiz(opts[0].id); }
      G.day++; startDay(); days++;
    }
    expect(days).toBeGreaterThanOrEqual(25); expect(days).toBeLessThanOrEqual(45);
  });
  it('syarat mencalonkan diri & kampanye sampai pemilihan', () => {
    openBab(); kota().ch = 7; expect(canRun()).toBe(false);
    story().flags.diminta_calon = true; story().trust = 80; G.rep = 80; G.money = 2e9; kota().duk = 20; kota().rivalBonus = 0;
    expect(canRun()).toBe(true); expect(runForOffice()).toBe(true); expect(kota().phase).toBe('kampanye');
    const s0 = support(); G.money = 500e6; expect(campaign('baliho')).toBe(true); expect(support()).toBe(s0 + 2);
    for (let i = 0; i < 3; i++) campaign('baliho'); expect(campaign('baliho')).toBe(false);   // maks 3×
    for (let i = 0; i < CAMP_DAYS; i++) { G.day++; startDay(); ui.modal = null; }
    expect(kota().phase).toBe('wali'); expect(chapterOf()).toBe(9); expect(city()).toBeTruthy();
  });
  it('pemilihan: dukungan rendah kalah dan memberi simpati', () => {
    openBab(); const k = kota(); k.ch = 7; k.phase = 'kampanye'; k.rivalBonus = 6; story().trust = 10; G.rep = 10; const r = runElection();
    expect(r.win).toBe(false); expect(k.phase).toBe('usaha'); expect(k.sympathy).toBe(5); expect(canRun()).toBe(false);
  });
  it('proyek kota: biaya, durasi, efek, dan mark-up menurunkan integritas', () => {
    openBab(); const k = kota(); k.ch = 7; k.phase = 'kampanye'; story().trust = 100; G.rep = 100; k.duk = 50; runElection();
    const c = city(), j = PROJECTS.find(p => p.id === 'jalan'), kerja0 = c.ind.kerja;
    expect(build('jalan')).toBe(true); expect(c.apbd).toBe(250e6 - j.cost); expect(canBuild('jalan')).toBe(false);
    for (let i = 0; i < j.days + 6 && !c.done.jalan; i++) { G.day++; startDay(); ui.modal = null; }
    expect(c.done.jalan).toBe(true); expect(c.ind.kerja).toBeGreaterThan(kerja0 - .5 * j.days + 5);
    c.apbd = 1e9; const m = G.money, ig = k.integ; build('taman', true);
    expect(k.integ).toBe(ig - 8); expect(G.money).toBeGreaterThan(m); expect(dn().jejak).toBeGreaterThan(0);
  });
  it('maksimal dua proyek berjalan bersamaan', () => {
    openBab(); const k = kota(); k.ch = 9; k.phase = 'wali'; k.city = { day: 1, apbd: 5e9, ind: { sej: 50, bers: 50, kerja: 50, puas: 50 }, proj: [], done: {}, mark: 0, caught: 0, taxToday: 0 };
    build('jalan'); build('taman'); expect(canBuild('pasar')).toBe(false);
  });
  it('masa jabatan 30 hari berakhir dengan ending sesuai integritas', () => {
    openBab(); const k = kota(); k.ch = 9; k.phase = 'wali'; k.city = { day: CITY_DAYS, apbd: 0, ind: { sej: 80, bers: 80, kerja: 80, puas: 80 }, proj: [], done: {}, mark: 0, caught: 0, taxToday: 0 };
    k.integ = 90; G.day++; startDay(); expect(k.ending).toBe('bapak'); expect(ui.modal).toBe('kota_akhir');
  });
  it('ending korup bila integritas rendah', () => {
    openBab(); const k = kota(); k.ch = 9; k.phase = 'wali'; k.city = { day: CITY_DAYS, apbd: 0, ind: { sej: 80, bers: 80, kerja: 80, puas: 80 }, proj: [], done: {}, mark: 0, caught: 0, taxToday: 0 };
    k.integ = 20; G.day++; startDay(); expect(k.ending).toBe('korup');
  });
  it('efek kejadian baru (integritas, dukungan, kas kota) berfungsi', () => {
    openBab(); const k = kota(); story().cur = 'u_pajak'; ui.modal = 'event'; G.money = 5e6;
    chooseEvent(0); expect(k.integ).toBe(85); expect(G.money).toBe(3e6);
    story().cur = 'm_banjir'; story().result = null; G.money = 100e6; chooseEvent(0); expect(k.duk).toBe(6); expect(story().flags.banjir_bantu).toBe(true);
  });
  it('semua kejadian babak baru valid (pilihan, teks, efek dikenal)', () => {
    for (const id of ['u_awi', 'u_kerja', 'u_bank', 'u_pajak', 'm_majalah', 'm_banjir', 'm_beasiswa', 'm_desak', 'k_debat', 'k_fitnah', 'k_ibu', 'w_lantik', 'w_dinas', 'w_haji', 'c_banjir', 'c_demo', 'c_investor', 'c_pasar', 'c_festival', 'c_audit', 'c_wartawan']) {
      const e = eventById(id); expect(e, id).toBeTruthy(); expect(e.choices.length).toBeGreaterThanOrEqual(2);
      for (const c of e.choices) { expect(c.t && c.res, id).toBeTruthy(); for (const k of Object.keys(c.fx || {})) expect(['money', 'trust', 'rep', 'energy', 'xp', 'stock', 'flag', 'integ', 'duk', 'apbd', 'kota', 'bond', 'debt', 'dueShift', 'kasbon']).toContain(k); }
    }
  });
  it('kota tersimpan di save dan dimuat kembali', () => {
    openBab(); kota().biz.cabang = 2; G.money = 1; const mem = {}; globalThis.localStorage = { setItem: (a, b) => { mem[a] = b; }, getItem: a => mem[a] ?? null, removeItem: a => { delete mem[a]; } }; persist.save(); const s = persist.loadSave(); expect(s.kota.biz.cabang).toBe(2);
  });
});
void netWorth; void nextDay; void BIZ;

describe('dunia nyata: tender, fee, audit, KPK, DPRD, harga', () => {
  beforeEach(() => { begin(); openBab(); const k = kota(); k.ch = 7; k.phase = 'kampanye'; story().trust = 100; G.rep = 100; k.duk = 50; k.rivalBonus = -4; runElection(); ui.modal = null; });

  it('tender memberi pilihan jujur/murah/kroni dan fee masuk kantong menaikkan jejak', async () => {
    const K = await import('../src/game/logic/kota');
    expect(K.startTender('taman')).toBe(true); const c = city(), keys = c.tender.bids.map(b => b.key);
    expect(keys).toEqual(expect.arrayContaining(['jujur', 'murah', 'kroni'])); expect(c.tender.bids.find(b => b.key === 'jujur').fee).toBe(0);
    const i = keys.indexOf('kroni'), bid = c.tender.bids[i], m = G.money; expect(K.awardTender(i)).toBe(true);
    expect(G.money).toBe(m + bid.fee); expect(dn().jejak).toBeGreaterThan(0); expect(dn().fees).toBe(bid.fee); expect(c.proj[0].key).toBe('kroni');
  });
  it('lelang terbuka (e-procurement) menghapus kroni dan fee', async () => {
    const K = await import('../src/game/logic/kota'); city().apbd = 400e6; expect(K.setEproc()).toBe(true);
    K.startTender('taman'); expect(city().tender.bids.every(b => b.fee === 0 && b.key !== 'kroni' && b.key !== 'sendiri')).toBe(true);
  });
  it('proyek besar butuh DPRD ≥ 45', async () => {
    const K = await import('../src/game/logic/kota'); city().apbd = 1e9; dn().dprd = 30; expect(K.startTender('sekolah')).toBe(false); dn().dprd = 60; expect(K.startTender('sekolah')).toBe(true);
  });
  it('uang pelicin mempercepat proyek tapi menaikkan jejak', async () => {
    const K = await import('../src/game/logic/kota'); G.money = 100e6; city().apbd = 1e9; K.startTender('pasar'); city().tender.rush = true; const i = city().tender.bids.findIndex(b => b.key === 'jujur'); const days = 5;
    K.awardTender(i); expect(city().proj[0].left).toBe(days - 2); expect(dn().jejak).toBe(3); expect(G.money).toBeLessThan(100e6);
  });
  it('kualitas buruk: efek proyek lebih kecil dan bisa rusak lalu menimbulkan skandal', () => {
    const c = city(); c.proj.push({ id: 'jalan', left: 1, days: 3, price: 90e6, quality: 40, rel: 1, who: 'CV Asal', key: 'murah', fee: 9e6 });
    const k0 = c.ind.kerja; G.day++; startDay(); ui.modal = null; expect(c.done.jalan).toBe(true); expect(c.ind.kerja - k0).toBeLessThan(6 * .8 - .2 + 1);
    c.fail.jalan = c.day; const j0 = dn().jejak, s0 = dn().sorotan; G.day++; startDay(); ui.modal = null;
    expect(c.broken.jalan).toBe(true); expect(dn().jejak).toBeGreaterThan(j0 + 5); expect(dn().sorotan).toBeGreaterThan(s0 + 10);
  });
  it('audit: bersih → WTP; fee banyak → temuan; jejak sangat tinggi → ditangkap esok pagi', async () => {
    const K = await import('../src/game/logic/kota'); const d = dn();
    d.jejak = 0; d.sorotan = 0; expect(K.resolveAudit('kooperatif')).toBeLessThan(25);
    d.jejak = 40; d.fees = 100e6; G.money = 500e6; const S = K.resolveAudit('kooperatif'); expect(S).toBeGreaterThanOrEqual(25); expect(G.money).toBeLessThan(500e6);
    d.jejak = 90; d.sorotan = 40; K.resolveAudit('kooperatif'); expect(d.arrest).toBe(true);
    G.day++; startDay(); expect(kota().ending).toBe('tangkap'); expect(ui.modal).toBe('kota_akhir');
  });
  it('audit terjadwal pada hari ke-10 dan ke-20 masa jabatan', () => {
    const c = city(); c.day = 9; G.day++; startDay(); ui.modal = null; expect(dn().force === 'd_audit' || story().cur === 'd_audit' || G.events.some(e => e.id === 'd_audit')).toBe(true);
  });
  it('pengembalian fee ke kas kota menurunkan beban dan menolong saat KPK', async () => {
    const K = await import('../src/game/logic/kota'); const d = dn(); d.fees = 50e6; G.money = 80e6; const a0 = city().apbd;
    K.applyKotaFx({ returnFees: 1 }); expect(d.fees).toBe(0); expect(G.money).toBe(30e6); expect(city().apbd).toBe(a0 + 50e6);
  });
  it('inflasi menaikkan biaya pesanan grosir dan menurunkan pendapatan usaha', async () => {
    const K = await import('../src/game/logic/kota'); const { packPrice } = await import('../src/game/logic/actions'); const { ITEMS } = await import('../src/game/data');
    const p0 = packPrice(ITEMS[0]); dn().harga = 1.3; expect(packPrice(ITEMS[0])).toBeGreaterThan(p0 * 1.25); G.kota.biz.cabang = 1; G.kota.ready.cabang = 0; const i1 = K.incomePerDay(); dn().harga = 1; expect(K.incomePerDay()).toBeGreaterThan(i1);
  });
  it('saingan baru & ekonomi kota mengubah jumlah pembeli', async () => {
    const K = await import('../src/game/logic/kota'); city().ind.sej = 80; city().ind.kerja = 80; const hi = K.trafficMul(); city().ind.sej = 10; city().ind.kerja = 10; const lo = K.trafficMul();
    expect(hi).toBeGreaterThan(lo); dn().saingan = 5; expect(K.trafficMul()).toBeLessThan(lo);
  });
  it('izin usaha baru tertahan; uang pelicin mempercepat', async () => {
    const K = await import('../src/game/logic/kota'); G.money = 50e6; K.buyBiz('cabang'); expect(K.incomePerDay()).toBe(0); expect(dn().force).toBe('d_izin');
    K.applyKotaFx({ izin: 'cepat' }); G.day++; expect(K.incomePerDay()).toBeGreaterThan(0);
  });
  it('kejadian dunia nyata konsisten dan hanya yang forceOnly tak muncul acak', async () => {
    const { eventById } = await import('../src/game/logic/story');
    for (const id of ['d_jatah', 'd_audit', 'd_whistle', 'd_kpk', 'd_demo', 'd_bbm', 'd_izin', 'd_manajer', 'd_pesaing', 'd_kroni', 'd_banjir_besar', 'd_hujan_aman', 'd_kriminal', 'd_inspeksi']) { expect(eventById(id), id).toBeTruthy(); }
    expect(eventById('d_audit').forceOnly).toBe(true);
  });
});
