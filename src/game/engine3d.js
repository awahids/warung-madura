import { canChat, isAsking, isTalking, visitorById, visitors, voicePitch } from './logic/social.js';
import { tone } from './audio.js';
import { openChat } from './render/social.js';
import atlasUrl from './assets/atlas.webp';
import { SFX } from './audio.js';
import { H, W } from './constants.js';
import { BY } from './data.js';
import { IMG, ctx, setCtx } from './gfx.js';
import { makeIcons } from './icons.js';
import { addToTray, doHitung } from './logic/customers.js';
import { drinkKopi, receiveDelivery, usePromo as tapPromo } from './logic/actions.js';
import { isRain } from './logic/day.js';
import { ITEM_LVL, itemOn } from './logic/level.js';
import { regById } from './logic/regulars.js';
import { staffList } from './logic/staff.js';
import { attachInput } from './input.js';
import { loadSave } from './persist.js';
import { autoDowngrade, effectiveQuality, onQuality } from './quality.js';
import { toast } from './widgets.js';
import { darkness, skyAt } from './render/background.js';
import { drawOverlay3D } from './render/overlay3d.js';
import { canAct } from './sprites.js';
import { G, fx, mouse, ui } from './state.js';
import { update } from './update.js';
import { clamp, inRect, rp } from './util.js';
import * as customersApi from './logic/customers.js';
import * as dayApi from './logic/day.js';
import { createWarung } from '../scene3d/warung.js';

/* Menyambungkan logika game (G, update, transaksi…) ke adegan warung 3D.
   Logika tidak berubah: posisi pelanggan dari update() dipetakan ke dunia 3D, barang 3D yang diklik
   memanggil fungsi yang sama seperti versi 2D, dan UI 2D digambar sebagai lapisan transparan. */

/** Peta koordinat x layar 2D (slot antrean 450/640/835) → x dunia 3D (meter). */
export const toWorldX = x2d => (x2d - 640) / 190;   // slot berjarak ≈1 m agar kepala chibi yang besar tidak saling menutupi

/** Titik pointer → koordinat NDC (−1..1) adegan 3D, dihitung dari event + kotak overlay.
    Dipakai saat pointerup: di layar sentuh `mouse` sudah direset ke −99 oleh handler input umum sebelum handler 3D berjalan. */
export const pointerToNdc = (e, rect, w = W, h = H) => { const x = (e.clientX - rect.left) / rect.width * w, y = (e.clientY - rect.top) / rect.height * h; return [x / w * 2 - 1, -(y / h * 2 - 1)]; };

/** Ekspresi wajah pelanggan 3D dari sisa kesabaran: senang → datar → marah; girang saat pulang membawa belanjaan. */
export const moodOf = (c, leaving) => leaving ? (c.took ? 'joy' : 'angry') : (c.patience / c.max > .55 ? 'happy' : c.patience / c.max > .28 ? 'flat' : 'angry');

const describe = act => {
  switch (act.type) {
    case 'item': { const it = BY[act.id]; return `${it.name} · ${rp(it.price)} · stok ${G.stock[act.id] || 0}`; }
    case 'hitung': return 'Kalkulator — hitung belanjaan';
    case 'hp': return 'HP — pesan barang ke grosir / main medsos';
    case 'kopi-minum': return 'Seduh kopi — +18 energi (pakai 1 kopi sachet)';
    case 'buku': return 'Buku Catatan — cek stok & harga';
    case 'promo': return G.promo ? 'Promo sedang aktif' : 'Pasang promo Rp 20.000 (pembeli lebih ramai)';
    case 'kurir': case 'paket': return 'Kurir — klik untuk menerima kiriman barang';
    case 'warga': { const v = visitors().find(x => x.seat === act.slot), r = v && regById(v.id); return r ? `${r.name} — klik untuk ngobrol${v.talks > 0 ? '' : ' (sudah puas ngobrol)'}` : ''; }
    default: return '';
  }
};
/** Kiriman sudah tiba dan menunggu diterima? */
export const deliveryArrived = () => G.deliveries.some(d => G.abs >= d.eta);
/** Terima kiriman dari kurir (klik kurir/kardus, tombol layar, atau tombol K); penjaga menjangkau kurir. */
export function acceptDelivery(scene) {
  if (!deliveryArrived()) return false;
  const hp = scene && scene.kurirHead && scene.kurirHead();
  receiveDelivery();
  if (hp && scene) scene.penjagaAct('reach', hp.clone().setY(1.2), hp.clone().setY(1.1));
  return true;
}

/** Jalankan aksi game untuk objek 3D yang diklik. */
export function runAct(act, scene) {
  if (act.type === 'buku') { ui.modal = 'notebook'; SFX.click(); return; }
  if (act.type === 'hp') { ui.modal = 'phone'; SFX.click(); scene && scene.penjagaAct('phone'); return; }
  if (!canAct()) return;
  switch (act.type) {
    case 'item': addToTray(act.id); break;
    case 'hitung': doHitung(); break;
    case 'kopi-minum': { const cd = G.drinkCd; drinkKopi(); if (G.drinkCd > cd) scene && scene.penjagaAct('drink'); break; }
    case 'promo': tapPromo(); break;
    case 'kurir': case 'paket': acceptDelivery(scene); break;
    case 'warga': { const v = visitors().find(x => x.seat === act.slot); if (v) openChat(v.vid); break; }
    default: break;
  }
}

/** Pelanggan di loket sedang mengucapkan kalimatnya (sejak tiba di loket; durasi mengikuti panjang kalimat). */
export const SAY_CPS = 16;                                          // pelanggan berbicara lebih lambat dari efek ketik dialog agar mulut tidak terlalu cepat berhenti
export function isSpeaking(c, t = (typeof performance !== 'undefined' ? performance.now() : Date.now())) {
  if (c.state !== 'wait') return false;
  if (c.sayAt == null) c.sayAt = t;
  return (t - c.sayAt) / 1000 * SAY_CPS < (c.say || '').length;
}

/** Daftar orang 3D dari state game (pelanggan antre + yang sedang pergi), lengkap dengan pose & bawaan. */
export function crowdFromGame(nextId) {
  const out = [];
  const add = (c, leaving) => {
    if (!c.k3) c.k3 = 'c' + nextId();
    const walkAt = c.walkAt ?? 1.1, takeAt = walkAt - 1.1;           // pembayaran pas: fase "terima uang" dulu, lalu mengambil belanjaan
    const entering = !leaving && c.state === 'in', leavingMove = leaving && c.leaveT > walkAt;
    let pose = 'idle', pt = 0;
    const talk = !leaving && c.state === 'wait' && c.idx === 0 && isSpeaking(c);              // menyampaikan pesanan: mulut bergerak
    if (!leaving && c.stage === 'pay' && c.state === 'wait') pose = 'pay';          // mengulurkan uang
    else if (leaving && c.took) { if (c.leaveT < takeAt) pose = 'pay'; else { pose = c.leaveT - takeAt <= 1.1 ? 'take' : 'idle'; pt = c.leaveT - takeAt; } }
    out.push({
      key: c.k3, type: c.type, look: c.look, x: toWorldX(c.x), z: !leaving && c.idx > 0 ? 1.15 : .55,
      moving: entering || leavingMove, dir: leaving ? (c.x < W / 2 ? -1 : 1) : Math.sign((c.tx ?? c.x) - c.x) || 1, turn: 0,
      pose, pt, carry: leaving && c.took ? c.carry : null, mood: moodOf(c, leaving), talk,
    });
  };
  G.cust.forEach(c => add(c, false)); G.leaving.forEach(c => add(c, true));
  return out;
}

/** Suara bicara pelanggan di loket: satu nada pendek tiap dua huruf, nada khas tipe/tokoh (lebih pelan dari dialog). */
function customerVoice(c) {
  if (ui.modal || !G.running) return;
  const n = Math.min((c.say || '').length, Math.floor(((performance.now() - (c.sayAt ?? performance.now())) / 1000) * SAY_CPS));
  if (c.voiceN == null) c.voiceN = 0;
  while (c.voiceN < n) { const ch = c.say[c.voiceN]; if (ch && ch !== ' ' && c.voiceN % 2 === 0) { const f = voicePitch(c.reg || c.type) * (1 + (ch.charCodeAt(0) % 5) * .07); tone(f, .045, 'square', .016, 0, -f * .08); } c.voiceN++; }
}

const STICK = { x: 140, y: 590, r: 64, hit: 120 };   // joystick virtual (koordinat layar 1280×720)

export function createEngine3D({ stack, glCanvas, overlay, onReady, onError } = {}) {
  ui.cv = overlay; ui.mode3d = true; setCtx(overlay.getContext('2d'));
  ui.touch = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  let scene = null, raf = 0, alive = true, last = 0, t = 0, ro = null, detach = () => { }, prevScreen = null, lookKey = '', lockedKey = null, staffShown = null, idN = 0, pending = null, pressTimer = 0;
  const cleanups = [];

  const resize = () => {
    const box = stack.parentElement.getBoundingClientRect();
    const k = Math.min(box.width / W, box.height / H) || 1, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.floor(W * k), ch = Math.floor(H * k);
    stack.style.width = cw + 'px'; stack.style.height = ch + 'px';
    glCanvas.style.width = overlay.style.width = cw + 'px'; glCanvas.style.height = overlay.style.height = ch + 'px';
    scene && scene.resize(cw, ch);
    const s = Math.max(1, Math.min(2, k * dpr)); overlay.width = Math.round(W * s); overlay.height = Math.round(H * s); ctx.setTransform(s, 0, 0, s, 0, 0);
  };

  const ndcOf = () => [mouse.x / W * 2 - 1, -(mouse.y / H * 2 - 1)];
  const overHit = () => ui.hits.some(h => inRect(mouse.x, mouse.y, h.x, h.y, h.w, h.h));

  let wasChatting = false, camBefore = null;
  const syncScene = dt => {
    // pintu, waktu, cuaca
    const playing = G.screen === 'play';
    scene.setDoorFraction(!playing || G.doorState === 'open' ? 1 : G.door);
    const h = playing ? G.h : 12, dk = darkness(h), n = clamp(dk / .62, 0, 1), rain = playing && isRain(), sky = skyAt(h)[1];
    const key = `${Math.round(n * 50)}|${rain}|${sky}`;
    if (key !== lookKey) { lookKey = key; scene.setLook({ night: n, sky, rain }); }
    const lockKey = playing ? Object.keys(ITEM_LVL).filter(id => !itemOn(id)).join(',') : '';   // judul: semua barang tampil
    if (lockKey !== lockedKey) { lockedKey = lockKey; scene.setLockedItems(lockKey ? lockKey.split(',') : []); }
    const staffKey = playing ? staffList().map(s => s.id).join(',') : '';   // karyawan tampil di warung
    if (staffKey !== staffShown) { staffShown = staffKey; scene.setStaff(staffList().map(s => { const r = regById(s.id); return { id: s.id, type: r.type, look: r.look }; })); }
    // dialog ngobrol: kamera pindah ke depan bangku & warga yang bicara menggerakkan mulut; kembali ke sudut semula saat selesai
    const chatting = playing && ui.modal === 'ngobrol', cv = chatting ? visitorById(ui.chatId) : null;
    if (chatting !== wasChatting) { wasChatting = chatting; if (chatting) { camBefore = api.view; scene.setView('ngobrol'); } else if (camBefore) { scene.setView(camBefore); camBefore = null; } }
    { const ac = playing && G.cust.find(x => x.state === 'wait' && x.idx === 0); if (ac) customerVoice(ac); }
    scene.setTalking(cv && isTalking(cv) ? cv.seat : -1); scene.setPenjagaTalking(!!cv && isAsking(cv));
    scene.setPaket(playing && G.deliveries.some(d => G.abs >= d.eta));
    scene.setVisitors(playing ? visitors().map(v => { const r = regById(v.id); return { key: v.vid, type: r.type, look: r.look, seat: v.seat }; }) : []);
    // kamera mengikuti layar: judul = memutar dari luar; main = sudut pandang penjaga
    if (G.screen !== prevScreen) {
      prevScreen = G.screen;
      if (G.screen === 'title') { scene.setView('luar'); scene.setAutoRotate(true); } else { scene.setAutoRotate(false); scene.setView('penjaga'); api.view = 'penjaga'; api.onView && api.onView('penjaga'); }
    }
    scene.syncPeople(playing ? crowdFromGame(() => ++idN) : [], t, dt);
    // nampan: tahan isi saat pelanggan mengulurkan tangan mengambil belanjaan
    scene.syncTray(playing ? G.tray : {}, playing && G.leaving.some(c => c.took && c.leaveT < ((c.walkAt ?? 1.1) - 1.1) + .55));
  };

  const hover = () => {
    ui.tooltip = '';
    if (!alive || G.screen !== 'play' || ui.modal || ui.walk || mouse.x < 0 || overHit() || ui.dragDoor) { scene.highlight(null); return; }
    const o = scene.pick(...ndcOf());
    const act = o && o.userData.act, usable = act && (act.type === 'buku' || canAct());
    scene.highlight(usable ? o : null);
    if (usable && !ui.touch) ui.tooltip = describe(act);
  };

  const keys = new Set(), stick = { id: null, x: 0, y: 0 };
  let viewBeforeWalk = 'penjaga';
  /** Masuk/keluar mode jalan-jalan. Keluar: penjaga kembali ke meja dan kamera ke sudut semula/pilihan. */
  function setWalkMode(on, toView) {
    if (on === !!ui.walk && !toView) return;
    if (on) { if (G.screen !== 'play') return; viewBeforeWalk = api.view === 'jalan' ? 'penjaga' : api.view; ui.walk = true; scene.setWalk(true); api.view = 'jalan'; api.onView && api.onView('jalan'); toast('Jalan-jalan: WASD/panah (atau joystick). E = aksi. G = kembali ke meja.', '#cfe8ff'); }
    else { ui.walk = false; keys.clear(); stick.x = stick.y = 0; stick.id = null; scene.setWalk(false); const v = toView || viewBeforeWalk; api.view = v; scene.setView(v); api.onView && api.onView(v); }
  }
  /** Gerakkan penjaga dari masukan keyboard/joystick & cari interaksi terdekat. */
  function stepWalkInput(dt) {
    if (!ui.walk) { view.walkPrompt = null; view.walkUI = false; return; }
    if (G.screen !== 'play') { setWalkMode(false); return; }
    let ix = stick.x, iz = stick.y;
    if (keys.has('l')) ix -= 1; if (keys.has('r')) ix += 1; if (keys.has('u')) iz -= 1; if (keys.has('d')) iz += 1;
    if (!ui.modal) scene.walkStep(ix, iz, keys.has('run') || Math.hypot(stick.x, stick.y) > .92, dt); else scene.walkStep(0, 0, false, dt);
    view.walkUI = true; view.stick = { ...STICK, kx: stick.x, ky: stick.y, active: stick.id !== null };
    const p = scene.walkPos, d = (x, z) => Math.hypot(p.x - x, p.z - z); let pr = null;
    const vv = visitors().find(x => canChat(x));
    if (deliveryArrived() && scene.kurirAtHome && d(.66, .62) < 2.1) pr = { label: 'Terima kiriman', run: () => acceptDelivery(scene) };
    else if (vv && d(3.1, .9) < 2.2) pr = { label: `Ngobrol dengan ${(regById(vv.id) || {}).name || 'warga'}`, run: () => { setWalkMode(false); openChat(vv.vid); } };
    else if (d(-4.4, .6) < 1.5) pr = { label: 'Pulang istirahat', run: () => { ui.homeResult = null; ui.modal = 'rumah'; } };
    else if (d(.2, -1.3) < 1.4 || (p.z < -.2 && p.x > -2.1 && p.x < 2.1)) pr = { label: 'Kembali ke meja', run: () => setWalkMode(false) };
    view.walkPrompt = pr;
  }
  const view = {
    walkPrompt: null, walkUI: false, stick: null, exitWalk: () => setWalkMode(false),
    badges: [], headOf: c => { const hp = c.k3 && scene.headPos(c.k3); return hp ? scene.project(hp) : null; },
    itemRects: [], courierWaiting: false, courierHead: null, acceptCourier: () => acceptDelivery(scene),
  };

  // mode otomatis: ukur FPS rata-rata ±3 detik setelah main dimulai; di bawah ~28 fps → turun ke grafis Rendah (diingat)
  let fpsN = 0, fpsSum = 0, fpsDone = false;
  const fpsWatch = rdt => {
    if (fpsDone || G.screen !== 'play' || document.hidden || ui.modal) return;
    if (++fpsN <= 40) return;                                   // abaikan pemanasan (kompilasi shader)
    fpsSum += rdt;
    if (fpsN >= 40 + 150) { fpsDone = true; if (fpsSum / 150 > 1 / 28 && autoDowngrade()) toast('Grafis diturunkan otomatis agar lancar. Ubah di menu Jeda.', '#cfe8ff'); }
  };
  const loop = now => {
    if (!alive) return;
    const raw = (now - last) / 1000, dt = Math.min(.05, raw), rdt = Math.min(.25, raw); last = now; t += dt;   // rdt: waktu nyata untuk pelunakan gerak
    update(dt); syncScene(rdt);
    fpsWatch(rdt);
    const prevHits = ui.hits; ui.hits = prevHits; hover();
    scene.frame(rdt, t);
    ctx.clearRect(0, 0, W, H);
    ui.hits = []; const tip = ui.tooltip; ui.tooltip = tip;
    stepWalkInput(rdt);
    view.badges = G.screen === 'play' && !ui.walk ? scene.badges() : [];
    view.itemRects = G.screen === 'play' ? scene.itemRects() : [];
    view.courierWaiting = G.screen === 'play' && G.running && deliveryArrived();   // tombol & gelembung 'terima kiriman'
    const kh = view.courierWaiting && scene.kurirHead(); view.courierHead = kh ? scene.project(kh) : null;
    drawOverlay3D(view);
    if (ui.shake > 0) ui.shake = 0;
    overlay.style.cursor = ui.hits.some(h => inRect(mouse.x, mouse.y, h.x, h.y, h.w, h.h)) || ui.tooltip || ui.longTip ? 'pointer' : 'default';
    raf = requestAnimationFrame(loop);
  };

  const start = () => {
    scene = createWarung(glCanvas, { game: true, controlsEl: overlay });
    scene.setQuality(effectiveQuality()); onQuality(q => scene && scene.setQuality(q));
    if (import.meta.env.DEV) window.__game3d = { G, ui, mouse, scene, runAct, ...customersApi, ...dayApi }; // hanya debug/tes UI
    scene.controls.enablePan = false;
    makeIcons(); ui.hasSave = !!loadSave();
    resize(); ro = new ResizeObserver(resize); ro.observe(stack.parentElement);
    detach = attachInput(overlay);

    // jangan putar kamera saat menyentuh UI / menarik pintu / modal terbuka
    const guard = () => { scene.controls.enabled = !ui.walk && !(overHit() || ui.modal || G.doorState === 'closed'); };
    const onDownCapture = e => {
      const r = overlay.getBoundingClientRect(); mouse.x = (e.clientX - r.left) / r.width * W; mouse.y = (e.clientY - r.top) / r.height * H; guard();
      // joystick virtual (mode jalan): sentuh/klik di sekitar pangkalnya
      if (ui.walk && !ui.modal && Math.hypot(mouse.x - STICK.x, mouse.y - STICK.y) < STICK.hit && stick.id === null) {
        stick.id = e.pointerId; try { overlay.setPointerCapture(e.pointerId); } catch { /* abaikan */ }
        moveStick(e); e.stopImmediatePropagation();
      }
    };
    const moveStick = e => {
      const r = overlay.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * W - STICK.x, py = (e.clientY - r.top) / r.height * H - STICK.y, m = Math.hypot(px, py), k = Math.min(1, m / STICK.r);
      stick.x = m > 0 ? px / m * k : 0; stick.y = m > 0 ? py / m * k : 0;
    };
    const onStickMove = e => { if (stick.id === e.pointerId) moveStick(e); };
    const endStick = e => { if (stick.id === e.pointerId) { stick.id = null; stick.x = stick.y = 0; } };
    const onDown = e => {
      if (ui.consumed || G.screen !== 'play' || ui.modal || ui.walk) return;   // jalan-jalan: barang tidak bisa diklik dari jauh
      const o = scene.pick(...pointerToNdc(e, overlay.getBoundingClientRect())); const act = o && o.userData.act; if (!act) return;
      pending = { act, o, x: e.clientX, y: e.clientY, long: false };
      if (ui.touch) pressTimer = setTimeout(() => { if (pending) { pending.long = true; ui.longTip = describe(act); } }, 420);
    };
    const onUp = e => {
      endStick(e); scene.controls.enabled = !ui.walk; clearTimeout(pressTimer);
      if (pending) {
        const { act, o, x, y, long } = pending; pending = null;
        const moved = Math.hypot(e.clientX - x, e.clientY - y) > 8;
        if (!long && !moved && (!ui.modal)) { const now = scene.pick(...pointerToNdc(e, overlay.getBoundingClientRect())); if (now === o) runAct(act, scene); }
      }
      ui.longTip = '';
    };
    const WALK_KEYS = { w: 'u', arrowup: 'u', s: 'd', arrowdown: 'd', a: 'l', arrowleft: 'l', d: 'r', arrowright: 'r' };
    const onKeyUp = e => { keys.delete(WALK_KEYS[e.key.toLowerCase()]); if (e.key === 'Shift') keys.delete('run'); };
    const onKey = e => {
      const lk = e.key.toLowerCase();
      if (ui.walk && !ui.modal && WALK_KEYS[lk]) { keys.add(WALK_KEYS[lk]); e.preventDefault(); return; }
      if (e.key === 'Shift') keys.add('run');
      if (G.screen === 'play' && !ui.modal) {
        if (lk === 'g') { setWalkMode(!ui.walk); return; }
        if (lk === 'e' && ui.walk && view.walkPrompt) { view.walkPrompt.run(); return; }
      }
      if (e.key === '1') api.setView('luar'); else if (e.key === '2') api.setView('pembeli'); else if (e.key === '3') api.setView('penjaga'); else if (e.key === '4') api.setView('jalan');
      else if ((e.key === 'k' || e.key === 'K') && G.screen === 'play' && !ui.modal && canAct()) acceptDelivery(scene);
    };
    overlay.addEventListener('pointerdown', onDownCapture, true);
    overlay.addEventListener('pointerdown', onDown);
    const onCancel = () => { clearTimeout(pressTimer); pending = null; ui.longTip = ''; scene.controls.enabled = !ui.walk; };
    overlay.addEventListener('pointerup', onUp);
    overlay.addEventListener('pointercancel', e => { endStick(e); onCancel(); });
    overlay.addEventListener('pointermove', onStickMove);
    window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKeyUp); window.addEventListener('blur', () => keys.clear());
    cleanups.push(() => { overlay.removeEventListener('pointerdown', onDownCapture, true); overlay.removeEventListener('pointerdown', onDown); overlay.removeEventListener('pointerup', onUp); overlay.removeEventListener('pointercancel', onCancel); window.removeEventListener('keydown', onKey); });
    last = performance.now(); raf = requestAnimationFrame(loop);
    onReady && onReady(api);
  };

  const api = {
    view: 'luar', onView: null,
    setView(name) { if (name === 'jalan') { setWalkMode(true); return; } if (ui.walk) setWalkMode(false, name); else { api.view = name; scene && scene.setView(name); api.onView && api.onView(name); } },
    get walking() { return !!ui.walk; },
    destroy() { ui.walk = false; ui.mode3d = false; onQuality(null); alive = false; cancelAnimationFrame(raf); detach(); cleanups.forEach(f => f()); ro && ro.disconnect(); scene && scene.dispose(); IMG.onload = IMG.onerror = null; fx.floats.length = 0; },
    get scene() { return scene; },
  };

  IMG.onload = () => { if (alive) { try { start(); } catch (e) { onError && onError(e); } } };
  IMG.onerror = () => onError && onError(new Error('Gagal memuat sprite atlas'));
  IMG.src = atlasUrl;
  return api;
}
