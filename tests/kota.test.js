import { describe, it, expect, beforeEach, vi } from 'vitest';
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
    const K = await import('../src/game/logic/kota'); const sp = vi.spyOn(Math, 'random').mockReturnValue(.5);
    expect(K.startTender('taman')).toBe(true); sp.mockRestore(); const c = city(), keys = c.tender.bids.map(b => b.key);
    expect(keys).toEqual(expect.arrayContaining(['jujur', 'murah', 'kroni'])); expect(c.tender.bids.find(b => b.key === 'jujur').fee).toBe(0);
    const i = keys.indexOf('kroni'), bid = c.tender.bids[i], m = G.money; expect(K.awardTender(i)).toBe(true);
    expect(G.money).toBe(m + bid.fee); expect(dn().jejak).toBeGreaterThan(0); expect(dn().fees).toBe(bid.fee); expect(c.proj[0].key).toBe('kroni');
  });
  it('lelang terbuka (e-procurement) menghapus kroni dan fee', async () => {
    const K = await import('../src/game/logic/kota'); city().apbd = 400e6; expect(K.setEproc()).toBe(true);
    const sp = vi.spyOn(Math, 'random').mockReturnValue(.5); K.startTender('taman'); sp.mockRestore(); expect(city().tender.bids.every(b => b.fee === 0 && b.key !== 'kroni' && b.key !== 'sendiri')).toBe(true);
  });
  it('proyek besar butuh DPRD ≥ 45', async () => {
    const K = await import('../src/game/logic/kota'); city().apbd = 1e9; dn().dprd = 30; expect(K.startTender('sekolah')).toBe(false); dn().dprd = 60; expect(K.startTender('sekolah')).toBe(true);
  });
  it('uang pelicin mempercepat proyek tapi menaikkan jejak', async () => {
    const K = await import('../src/game/logic/kota'); G.money = 100e6; city().apbd = 1e9; const sp = vi.spyOn(Math, 'random').mockReturnValue(.5); K.startTender('pasar'); sp.mockRestore(); city().tender.rush = true; const i = city().tender.bids.findIndex(b => b.key === 'jujur'); const days = 5;
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

describe('warga lama & Pak Haji di fase wali kota', () => {
  beforeEach(() => { begin(); openBab(); const k = kota(); k.ch = 7; k.phase = 'kampanye'; story().trust = 100; G.rep = 100; k.duk = 50; k.rivalBonus = -4; runElection(); ui.modal = null; city().apbd = 2e9; });

  it('dilantik: suasana hati warga lama & Pak Haji terisi', async () => {
    const K = await import('../src/game/logic/kota'); const k = kota();
    expect(Object.keys(k.warga)).toEqual(['sri', 'jaka', 'rani', 'darto', 'wati']); expect(K.hajiOf()).toBeGreaterThan(50);
  });
  it('mengambil fee: Rani paling kecewa, semua warga turun, dan Pak Haji "menelepon" malam itu', async () => {
    const K = await import('../src/game/logic/kota'); const r0 = K.moodOf('rani'), s0 = K.moodOf('sri');
    K.build('taman', true); expect(K.moodOf('rani')).toBe(r0 - 16); expect(K.moodOf('sri')).toBe(s0 - 4); expect(dn().force).toBe('h_fee');
    expect(dn().log.some(l => /Rani mulai menelusuri/.test(l.text))).toBe(true);
  });
  it('proyek yang dibutuhkan selesai menaikkan warga terkait; rusak menurunkannya', () => {
    const c = city(); c.proj.push({ id: 'jalan', left: 1, days: 3, price: 120e6, quality: 90, rel: 1, who: 'PT', key: 'jujur', fee: 0 });
    const s0 = kota().warga.sri, d0 = kota().warga.darto; G.day++; startDay(); ui.modal = null; expect(kota().warga.sri).toBe(Math.min(100, s0 + 14)); expect(kota().warga.darto).toBe(d0);
    c.fail.jalan = c.day; const s1 = kota().warga.sri; G.day++; startDay(); ui.modal = null; expect(kota().warga.sri).toBe(s1 - 15);
  });
  it('janji yang tidak ditepati dalam 8 hari membuat warga kecewa berat', async () => {
    const K = await import('../src/game/logic/kota'); K.applyKotaFx({ janji: { who: 'wati', proj: 'puskesmas' } }); const m0 = K.moodOf('wati');
    for (let i = 0; i < 9; i++) { G.day++; startDay(); ui.modal = null; }
    expect(K.moodOf('wati')).toBeLessThanOrEqual(m0 - 20); expect(kota().janji.wati).toBeUndefined();
  });
  it('janji yang ditepati menambah kepercayaan', async () => {
    const K = await import('../src/game/logic/kota'); K.applyKotaFx({ janji: { who: 'sri', proj: 'jalan' } }); city().done.jalan = true; const m0 = K.moodOf('sri');
    G.day++; startDay(); ui.modal = null; expect(K.moodOf('sri')).toBe(m0 + 6);
  });
  it('nada telepon Pak Haji mengikuti integritas & jejak', async () => {
    const K = await import('../src/game/logic/kota'); expect(K.hajiCall()).toBe('h_baik');
    dn().feesEver = 1; expect(K.hajiCall()).toBe('h_ragu'); dn().jejak = 50; expect(K.hajiCall()).toBe('h_kecewa');
  });
  it('warga datang ke balai kota bergiliran; tiap kejadian sekali', async () => {
    const K = await import('../src/game/logic/kota'); expect(K.nextWargaEvent()).toBe('ww_sri_gang');
    K.markWargaSeen('ww_sri_gang'); expect(K.nextWargaEvent()).toBe('ww_jaka_angkot');
    const c = city(); c.day = 3; dn().force = null; dn().queue = []; G.day++; startDay(); ui.modal = null;   // hari ke-4 masa jabatan
    expect([dn().force, ...G.events.map(e => e.id)]).toContain('ww_jaka_angkot');
  });
  it('janji angkot diingkari: Bang Jaka sangat kecewa', async () => {
    const K = await import('../src/game/logic/kota'); story().flags.angkot_ditunda = true; const m0 = K.moodOf('jaka'); K.build('angkot'); expect(K.moodOf('jaka')).toBe(m0 - 25);
  });
  it('pembeli di warung membicarakan kota (warga lama sesuai kebutuhannya)', async () => {
    const K = await import('../src/game/logic/kota'); expect(K.cityTalk('sri')).toMatch(/bolong/); city().done.jalan = true; expect(K.cityTalk('sri')).toMatch(/mulus/);
    kota().warga.sri = 20; expect(K.cityTalk('sri')).toMatch(/lupa/); dn().jejak = 50; expect(K.cityTalk(null)).toBeTruthy();
  });
  it('tender menunjukkan "korban" uang warga', async () => {
    const K = await import('../src/game/logic/kota'); const def = PROJECTS.find(p => p.id === 'sekolah');
    expect(K.victimOf({ key: 'kroni', price: 450e6, fee: 60e6 }, def)).toMatch(/beasiswa seperti Rani/); expect(K.victimOf({ key: 'jujur', price: 350e6, fee: 0 }, def)).toBe('');
    expect(K.victimOf({ key: 'murah', price: 270e6, fee: 20e6 }, def)).toMatch(/Rani yang menanggung/);
  });
  it('akhir masa jabatan menyebut Pak Haji dan warga yang paling terdampak', async () => {
    const K = await import('../src/game/logic/kota'); kota().haji = 20; kota().warga.rani = 10; kota().warga.sri = 90;
    const L = K.epilogPeople(); expect(L[0]).toMatch(/tidak datang/); expect(L.join(' ')).toMatch(/Rani bersaksi/); expect(L.join(' ')).toMatch(/Bu Sri lewat/);
  });
  it('kejadian warga lama valid', async () => {
    const { eventById } = await import('../src/game/logic/story');
    for (const id of ['ww_sri_gang', 'ww_sri_terima', 'ww_jaka_angkot', 'ww_rani_data', 'ww_rani_bangga', 'ww_darto_kerja', 'ww_wati_sehat', 'h_baik', 'h_ragu', 'h_kecewa', 'h_fee']) expect(eventById(id), id).toBeTruthy();
  });
});

describe('fee yang menggoda: situasi nyata', () => {
  beforeEach(() => { begin(); openBab(); const k = kota(); k.ch = 7; k.phase = 'kampanye'; story().trust = 100; G.rep = 100; k.duk = 50; k.rivalBonus = -4; runElection(); ui.modal = null; city().apbd = 2e9; });
  const mockR = v => vi.spyOn(Math, 'random').mockReturnValue(v);

  it('janji mepet: penawar jujur antre +3 hari, kroni menjamin lebih cepat', async () => {
    const K = await import('../src/game/logic/kota'); K.applyKotaFx({ janji: { who: 'sri', proj: 'jalan' } });
    const sp = mockR(.5); const b = K.makeBids('jalan'); sp.mockRestore();
    expect(b.find(x => x.key === 'jujur').dd).toBe(3); expect(b.find(x => x.key === 'kroni').dd).toBe(-1); expect(b.sit.join(' ')).toMatch(/Bu Sri/);
  });
  it('kas kota kurang: kroni menalangi separuh, sisanya dicicil dari pajak', async () => {
    const K = await import('../src/game/logic/kota'); city().apbd = 100e6; const sp = mockR(.5); K.startTender('jalan'); sp.mockRestore();
    const t = city().tender, i = t.bids.findIndex(b => b.key === 'kroni'), kr = t.bids[i]; expect(kr.upfront).toBe(Math.round(kr.price * .5));
    expect(K.awardTender(t.bids.findIndex(b => b.key === 'jujur'))).toBe(false);   // jujur tidak terjangkau
    K.startTender('jalan'); city().tender.bids = [kr]; expect(K.awardTender(0)).toBe(true); expect(city().talangan).toBe(kr.price - kr.upfront);
    const tl = city().talangan; G.day++; startDay(); ui.modal = null; expect(city().talangan).toBeLessThan(tl);
  });
  it('penawar jujur kadang mundur (harga material naik)', async () => {
    const K = await import('../src/game/logic/kota'); const sp = mockR(.05); const b = K.makeBids('taman'); sp.mockRestore();
    expect(b.some(x => x.key === 'jujur')).toBe(false); expect(b.sit.join(' ')).toMatch(/mundur/);
  });
  it('bagi fee ke DPRD: separuh fee, dukungan dewan naik', async () => {
    const K = await import('../src/game/logic/kota'); const sp = mockR(.5); K.startTender('taman'); sp.mockRestore();
    const t = city().tender, i = t.bids.findIndex(b => b.key === 'kroni'), fee = t.bids[i].fee, d0 = dn().dprd, m0 = G.money; t.share = true;
    K.awardTender(i); expect(G.money).toBe(m0 + Math.round(fee / 2)); expect(dn().dprd).toBe(Math.min(100, d0 + 12));
  });
  it('dividen ditahan selama menjabat bila usaha diserahkan; cair di akhir masa jabatan', async () => {
    const K = await import('../src/game/logic/kota'); const k = kota(); k.biz.cabang = 3; k.ready.cabang = 0;
    K.applyKotaFx({ usaha: 'serahkan' }); expect(K.incomePerDay()).toBe(0); const m0 = G.money; G.day++; startDay(); ui.modal = null;
    expect(G.money).toBe(m0); expect(k.held).toBeGreaterThan(0);
    K.applyKotaFx({ usaha: 'kelola' }); expect(K.incomePerDay()).toBeGreaterThan(0); expect(story().flags.konflik_usaha).toBe(true);
  });
  it('bantu warga dari kantong: suasana hati naik, ada jeda 3 hari', async () => {
    const K = await import('../src/game/logic/kota'); G.money = 50e6; const m0 = K.moodOf('sri');
    expect(K.bantuWarga('sri')).toBe(true); expect(K.moodOf('sri')).toBe(m0 + 8); expect(G.money).toBe(40e6); expect(K.bantuWarga('sri')).toBe(false);
  });
  it('risiko yang dirasakan rendah saat jejak masih kecil', async () => {
    const K = await import('../src/game/logic/kota'); expect(K.riskNow()).toBe('rendah'); dn().jejak = 50; expect(K.riskNow()).toBe('tinggi');
  });
  it('Pak Haji sakit (hari ke-12) dan aturan usaha (hari ke-2) terjadwal', () => {
    kota().biz.cabang = 1; const c = city(); c.day = 1; dn().force = null; dn().queue = []; G.day++; startDay(); ui.modal = null;
    expect([dn().force, ...dn().queue, ...G.events.map(e => e.id)]).toContain('w_usaha');
    c.day = 11; dn().force = null; dn().queue = []; G.day++; startDay(); ui.modal = null; expect([dn().force, ...dn().queue, ...G.events.map(e => e.id)]).toContain('h_sakit');
  });
});

describe('alur masa jabatan, periode kedua, dan warisan', () => {
  beforeEach(() => { begin(); openBab(); const k = kota(); k.ch = 7; k.phase = 'kampanye'; story().trust = 100; G.rep = 100; k.duk = 50; k.rivalBonus = -4; runElection(); ui.modal = null; city().apbd = 2e9; });
  const toDay = n => { const c = city(); c.day = n - 1; dn().force = null; dn().queue = []; G.day++; startDay(); ui.modal = null; return [dn().force, ...dn().queue, ...G.events.map(e => e.id)]; };

  it('kejadian bertanggal periode pertama: Pak Burhan, Koh Awi, Rani, surat Pak Haji', async () => {
    expect(toDay(6)).toContain('b_burhan_oposisi'); expect(toDay(9)).toContain('a_awi_hyper'); expect(toDay(16)).toContain('b_burhan_jebak');
    kota().warga.rani = 70; expect(toDay(18)).toContain('r_rani_magang'); kota().warga.rani = 20; const K = await import('../src/game/logic/kota'); expect(K.arcFor(18)).toBe('r_rani_demo');
    kota().haji = 80; expect(K.arcFor(22)).toBe('h_surat_baik'); kota().haji = 30; expect(K.arcFor(22)).toBe('h_surat_ragu');
  });
  it('Rani di bagian pengadaan: fee langsung ketahuan olehnya', async () => {
    const K = await import('../src/game/logic/kota'); story().flags.rani_pengadaan = true; const r0 = K.moodOf('rani'), j0 = dn().jejak;
    K.build('taman', true); expect(K.moodOf('rani')).toBe(Math.max(0, r0 - 26)); expect(dn().jejak).toBeGreaterThan(j0 + 7);
  });
  it('akhir periode pertama: bisa maju lagi atau pensiun', async () => {
    const K = await import('../src/game/logic/kota'); const c = city(); c.day = 30; G.day++; startDay();
    expect(ui.modal).toBe('kota_akhir'); expect(K.canReelect()).toBe(true); const d0 = c.day; G.day++; startDay(); expect(c.day).toBe(d0);   // kota berhenti setelah masa jabatan
    expect(K.retire()).toBe(true); expect(kota().final).toBe('pensiun'); expect(ui.modal).toBe('warisan');
    const W = K.warisanLines(); expect(W.title).toBe('CUKUP SATU PERIODE'); expect(W.lines.join(' ')).toMatch(/Periode 1/);
  });
  it('periode kedua: kampanye dinilai dari hasil kerja; menang → hari 1 lagi dengan kota yang sama & proyek periode 2', async () => {
    const K = await import('../src/game/logic/kota'); const c = city(); c.done.jalan = true; c.ind = { sej: 80, bers: 80, kerja: 80, puas: 80 }; c.day = 30; G.day++; startDay(); ui.modal = null;
    expect(K.canBuild('rsud')).toBe(false);
    expect(K.runSecondTerm()).toBe(true); expect(kota().phase).toBe('kampanye'); expect(K.reelectBonus()).toBeGreaterThan(10);
    kota().rivalBonus = -10; for (let i = 0; i < 7; i++) { G.day++; startDay(); }
    expect(kota().phase).toBe('wali'); expect(kota().term).toBe(2); expect(c.day).toBe(1); expect(c.done.jalan).toBe(true); expect(kota().ending).toBe(null); expect(K.canBuild('rsud')).toBe(true);
    const { chapterOf } = await import('../src/game/logic/story'); expect(chapterOf()).toBe(10);
  });
  it('kalah di periode kedua → kembali ke warung (warisan)', async () => {
    const K = await import('../src/game/logic/kota'); city().day = 30; G.day++; startDay(); ui.modal = null; K.runSecondTerm();
    kota().rivalBonus = 60; story().trust = 0; G.rep = 0; kota().duk = -50; K.runElection(); expect(kota().final).toBe('kalah'); expect(K.warisanLines().title).toBe('KEMBALI KE WARUNG');
  });
  it('akhir periode kedua: warisan menyebut penerus, warung lama, dan Pak Haji', async () => {
    const K = await import('../src/game/logic/kota'); const k = kota(); k.term = 2; k.endings = ['bapak']; story().flags.penerus_rani = true; story().flags.warung_koperasi = true; k.haji = 80;
    city().day = 30; G.day++; startDay(); expect(k.final).toBe('selesai'); expect(K.canReelect()).toBe(false);
    const L = K.warisanLines(); expect(L.title).toBe('WARISAN'); const t = L.lines.join(' ');
    expect(t).toMatch(/Periode 1: BAPAK/); expect(t).toMatch(/Periode 2/); expect(t).toMatch(/Rani terpilih/); expect(t).toMatch(/Warung Kita/); expect(t).toMatch(/bangku teras/);
  });
  it('kejadian bertanggal periode kedua', async () => {
    const K = await import('../src/game/logic/kota'); kota().term = 2;
    expect(K.arcFor(2)).toBe('p2_lantik'); expect(K.arcFor(8)).toBe('b_burhan_angket'); expect(K.arcFor(28)).toBe('p2_pengganti');
    dn().jejak = 40; expect(K.arcFor(15)).toBe('r_rani_kpk'); dn().jejak = 0; expect(K.arcFor(15)).toBe('r_rani_mitra');
    kota().haji = 70; expect(K.arcFor(23)).toBe('h_pamit'); kota().haji = 20; expect(K.arcFor(23)).toBe('h_pamit_dingin');
    expect(K.arcFor(2) && K.arcFor(12)).toBeFalsy();   // Pak Haji sakit hanya di periode pertama
  });
  it('semua kejadian alur valid', async () => {
    const { eventById } = await import('../src/game/logic/story');
    for (const id of ['b_burhan_oposisi', 'a_awi_hyper', 'b_burhan_jebak', 'r_rani_magang', 'r_rani_demo', 'h_surat_baik', 'h_surat_ragu', 'b_burhan_akhir', 'p2_lantik', 'b_burhan_angket', 'r_rani_kpk', 'r_rani_mitra', 'h_pamit', 'h_pamit_dingin', 'p2_pengganti']) expect(eventById(id), id).toBeTruthy();
  });
});

describe('mode mulai dari Bab 9', () => {
  it('langsung menjabat wali kota dengan keadaan pemain yang jujur & berhasil', async () => {
    const { startBab9 } = await import('../src/game/logic/shortcut');
    const { chapterOf, pickEvent } = await import('../src/game/logic/story');
    const { level } = await import('../src/game/logic/level');
    ui.hasSave = false; startBab9();
    const k = kota();
    expect(k.phase).toBe('wali'); expect(k.term).toBe(1); expect(chapterOf()).toBe(9); expect(city().day).toBe(1);
    expect(level()).toBeGreaterThanOrEqual(10); expect(story().lunas).toBe(true); expect(G.money).toBeGreaterThan(1e9);
    expect(Object.keys(k.warga)).toHaveLength(5); expect(G.events.some(e => e.k === 'bab')).toBe(true);   // kartu Bab 9 tampil
    const ev = pickEvent(); expect(ev && (ev.ch === 9 || ev.forceOnly || !ev.ch)).toBe(true);   // tidak ada cerita bab lama yang tersisa
    G.day++; startDay(); ui.modal = null; expect(city().day).toBe(2); expect(city().taxToday).toBeGreaterThan(0);
  });
  it('meminta konfirmasi bila ada simpanan', async () => {
    const { startBab9Clicked } = await import('../src/game/logic/shortcut');
    setG(persist.freshState(G)); ui.hasSave = true; ui.bab9Confirm = 0;
    expect(startBab9Clicked()).toBe(false); expect(startBab9Clicked()).toBe(true); expect(kota().phase).toBe('wali');
  });
});

describe('lewati hari', () => {
  it('membuka cerita hari ini dulu, lalu melewati hari: pajak & proyek jalan, warung tutup', async () => {
    const { startBab9 } = await import('../src/game/logic/shortcut');
    const { skipDay, pendingStory } = await import('../src/game/logic/day');
    ui.hasSave = false; startBab9(); const d0 = G.day, c = city();
    expect(pendingStory()).toBeTruthy();
    let guard = 0; while (pendingStory() && guard++ < 5) { expect(skipDay()).toBe('event'); ui.modal = null; story().cur = null; }
    const a0 = c.apbd; expect(skipDay()).toBe('skipped');
    expect(G.day).toBe(d0 + 1); expect(c.day).toBe(2); expect(c.apbd).toBeGreaterThan(a0); expect(G.running).toBe(false); expect(G.cust).toHaveLength(0);
  });
  it('alur bertanggal tidak terlewat saat melewati banyak hari', async () => {
    const { startBab9 } = await import('../src/game/logic/shortcut');
    const { skipDay } = await import('../src/game/logic/day');
    const { chooseEvent, closeStoryEvent, currentEvent } = await import('../src/game/logic/story');
    ui.hasSave = false; startBab9(); const seen = [];
    for (let i = 0; i < 60 && city().day < 10; i++) {
      const r = skipDay();
      if (ui.modal === 'event' && currentEvent()) { seen.push(currentEvent().id); chooseEvent(currentEvent().choices.findIndex(ch => !ch.req) >= 0 ? currentEvent().choices.findIndex(ch => !ch.req) : 0); closeStoryEvent(); }
      if (r !== 'event') ui.modal = null; else if (ui.modal === 'bab') ui.modal = null;
    }
    expect(seen).toEqual(expect.arrayContaining(['w_lantik', 'b_burhan_oposisi', 'a_awi_hyper']));
  });
});

describe('gema masa lalu, koran kota, bab 11 pulang', () => {
  beforeEach(async () => { const { startBab9 } = await import('../src/game/logic/shortcut'); ui.hasSave = false; startBab9(); ui.modal = null; });
  const toDay = n => { const c = city(); c.day = n - 1; dn().force = null; dn().queue = []; G.day++; startDay(); ui.modal = null; return [dn().force, ...dn().queue, ...G.events.map(e => e.id)]; };

  it('pilihan lama kembali menyapa: kembalian jujur, suap pajak, tamu bertudung', async () => {
    const K = await import('../src/game/logic/kota'); const f = story().flags;
    expect(K.nextEcho()).toBe('g_beasiswa');   // mulai Bab 9: beasiswa dianggap pernah diberikan
    f.jujur_kembalian = true; expect(K.nextEcho()).toBe('g_kembalian');
    K.markWargaSeen('g_kembalian'); f.suap_pajak = true; f.beasiswa = false; f.banjir_bantu = false; expect(K.nextEcho()).toBe('g_pajak');
    expect(toDay(3)).toContain('g_pajak');
  });
  it('Koran Kota memilih judul dari peristiwa terpenting', async () => {
    const K = await import('../src/game/logic/kota'); dn().log.push({ day: G.day, text: 'x', kind: 'fee' }, { day: G.day, text: 'y', kind: 'proyek' });
    expect(K.makeKoran().kind).toBe('fee'); dn().log.push({ day: G.day, text: 'z', kind: 'audit' }); expect(K.makeKoran().kind).toBe('audit');
    dn().log = []; city().ind.puas = 80; expect(K.makeKoran().kind).toBe('bagus');
    G.day++; startDay(); expect(G.morning[0]).toMatch(/KORAN KOTA/);
  });
  it('selesai menjabat → Bab 11 Pulang dengan kejadian berurutan sesuai pilihan', async () => {
    const K = await import('../src/game/logic/kota'); const { chapterOf } = await import('../src/game/logic/story');
    city().day = 30; G.day++; startDay(); ui.modal = null; story().flags.penerus_rani = true; K.retire(); ui.modal = null;
    expect(kota().final).toBe('pensiun'); expect(chapterOf()).toBe(11);
    const got = []; for (let i = 0; i < 5; i++) { dn().force = null; dn().queue = []; G.day++; startDay(); ui.modal = null; got.push(dn().force || (G.events.find(e => e.k === 'story') || {}).id); }
    expect(got.slice(0, 4)).toEqual(['p_pagi', 'p_sri', 'p_rani', 'p_haji']);
  });
  it('bila ditangkap, Bab 11 dimulai bertahun-tahun kemudian', async () => {
    dn().arrest = true; G.day++; startDay(); ui.modal = null; expect(kota().final).toBe('tangkap');
    dn().force = null; G.day++; startDay(); expect([dn().force, ...G.events.map(e => e.id)]).toContain('p_bebas');
  });
  it('semua kejadian gema & pulang valid', async () => {
    const { eventById } = await import('../src/game/logic/story');
    for (const id of ['g_kembalian', 'g_tamu', 'g_tamu_gelap', 'g_menimbun', 'g_banjir', 'g_beasiswa', 'g_pajak', 'g_awi', 'g_koperasi', 'g_kerabat', 'g_ipar', 'g_usaha', 'p_pagi', 'p_bebas', 'p_sri', 'p_rani', 'p_burhan', 'p_netral', 'p_haji']) expect(eventById(id), id).toBeTruthy();
  });
});

describe('tampilan warung 3D mengikuti cerita', () => {
  it('papan nama, papan kenangan, dan baliho berubah sesuai keadaan', async () => {
    const K = await import('../src/game/logic/kota');
    setG(persist.freshState(G)); expect(K.warungLook()).toEqual({ sign: { title: 'WARUNG MADURA', sub: 'Sembako · Minuman · Rokok · Pulsa', style: 'klasik' }, board: [], baliho: null });
    const { startBab9 } = await import('../src/game/logic/shortcut'); ui.hasSave = false; startBab9(); ui.modal = null;
    let L = K.warungLook(); expect(L.sign.sub).toMatch(/Pak Wali/); expect(L.board.map(b => b.kind)).toContain('lantik');
    story().flags.warung_koperasi = true; L = K.warungLook(); expect(L.sign).toMatchObject({ title: 'WARUNG KITA', style: 'kita' });
    delete story().flags.warung_koperasi; kota().endings = ['bapak']; kota().warga.rani = 90; kota().haji = 90; K.makeKoran();
    expect(K.warungLook().board.map(b => b.kind)).toEqual(['lantik', 'piagam', 'koran', 'rani', 'haji']);
    kota().final = 'tangkap'; L = K.warungLook(); expect(L.sign.style).toBe('pudar'); expect(L.board.map(b => b.kind)).toContain('skandal');
    kota().final = null; kota().phase = 'kampanye'; expect(K.warungLook().baliho.title).toBe('PILIH ANAK WARUNG'); kota().reelect = true; expect(K.warungLook().baliho.title).toBe('LANJUTKAN!');
    story().flags.warung_rizky = true; kota().phase = 'selesai'; expect(K.warungLook().sign.sub).toMatch(/Rizky/);
  });
});
