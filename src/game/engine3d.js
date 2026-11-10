import atlasUrl from './assets/atlas.webp';
import { SFX } from './audio.js';
import { H, W } from './constants.js';
import { BY } from './data.js';
import { IMG, ctx, setCtx } from './gfx.js';
import { makeIcons } from './icons.js';
import { addToTray, doHitung } from './logic/customers.js';
import { drinkKopi, receiveDelivery, usePhone as tapPhone, usePromo as tapPromo } from './logic/actions.js';
import { isRain } from './logic/day.js';
import { attachInput } from './input.js';
import { loadSave } from './persist.js';
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
export const toWorldX = x2d => (x2d - 640) / 190 * .75;

const describe = act => {
  switch (act.type) {
    case 'item': { const it = BY[act.id]; return `${it.name} · ${rp(it.price)} · stok ${G.stock[act.id] || 0}`; }
    case 'hitung': return 'Kalkulator — hitung belanjaan';
    case 'hp': return 'Main HP — isi ulang energi (jangan saat ada pembeli!)';
    case 'kopi-minum': return 'Seduh kopi — +18 energi (pakai 1 kopi sachet)';
    case 'buku': return 'Buku Catatan — pesan barang ke agen grosir';
    case 'promo': return G.promo ? 'Promo sedang aktif' : 'Pasang promo Rp 20.000 (pembeli lebih ramai)';
    case 'paket': return 'Kardus dari kurir — klik untuk terima barang';
    default: return '';
  }
};
/** Jalankan aksi game untuk objek 3D yang diklik. */
export function runAct(act, scene) {
  if (act.type === 'buku') { ui.modal = 'notebook'; SFX.click(); return; }
  if (!canAct()) return;
  switch (act.type) {
    case 'item': addToTray(act.id); break;
    case 'hitung': doHitung(); break;
    case 'hp': tapPhone(); scene && scene.penjagaAct('phone'); break;
    case 'kopi-minum': { const cd = G.drinkCd; drinkKopi(); if (G.drinkCd > cd) scene && scene.penjagaAct('drink'); break; }
    case 'promo': tapPromo(); break;
    case 'paket': receiveDelivery(); break;
    default: break;
  }
}

/** Daftar orang 3D dari state game (pelanggan antre + yang sedang pergi), lengkap dengan pose & bawaan. */
export function crowdFromGame(nextId) {
  const out = [];
  const add = (c, leaving) => {
    if (!c.k3) c.k3 = 'c' + nextId();
    const entering = !leaving && c.state === 'in', leavingMove = leaving && c.leaveT > 1.1;
    let pose = 'idle';
    if (!leaving && c.stage === 'pay' && c.state === 'wait') pose = 'pay';          // mengulurkan uang
    else if (leaving && c.took && c.leaveT <= 1.1) pose = 'take';                  // mengambil belanjaan
    out.push({
      key: c.k3, type: c.type, x: toWorldX(c.x), z: !leaving && c.idx > 0 ? 1.15 : .55,
      moving: entering || leavingMove, dir: leaving ? (c.x < W / 2 ? -1 : 1) : Math.sign((c.tx ?? c.x) - c.x) || 1, turn: 0,
      pose, pt: leaving ? c.leaveT : 0, carry: leaving && c.took ? c.carry : null,
    });
  };
  G.cust.forEach(c => add(c, false)); G.leaving.forEach(c => add(c, true));
  return out;
}

export function createEngine3D({ stack, glCanvas, overlay, onReady, onError } = {}) {
  ui.cv = overlay; setCtx(overlay.getContext('2d'));
  ui.touch = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  let scene = null, raf = 0, alive = true, last = 0, t = 0, ro = null, detach = () => { }, prevScreen = null, lookKey = '', idN = 0, pending = null, pressTimer = 0;
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

  const syncScene = () => {
    // pintu, waktu, cuaca
    const playing = G.screen === 'play';
    scene.setDoorFraction(!playing || G.doorState === 'open' ? 1 : G.door);
    const h = playing ? G.h : 12, dk = darkness(h), n = clamp(dk / .62, 0, 1), rain = playing && isRain(), sky = skyAt(h)[1];
    const key = `${Math.round(n * 50)}|${rain}|${sky}`;
    if (key !== lookKey) { lookKey = key; scene.setLook({ night: n, sky, rain }); }
    scene.setPaket(playing && G.deliveries.some(d => G.abs >= d.eta));
    // kamera mengikuti layar: judul = memutar dari luar; main = sudut pandang penjaga
    if (G.screen !== prevScreen) {
      prevScreen = G.screen;
      if (G.screen === 'title') { scene.setView('luar'); scene.setAutoRotate(true); } else { scene.setAutoRotate(false); scene.setView('penjaga'); api.view = 'penjaga'; api.onView && api.onView('penjaga'); }
    }
    scene.syncPeople(playing ? crowdFromGame(() => ++idN) : [], t);
    // nampan: tahan isi saat pelanggan mengulurkan tangan mengambil belanjaan
    scene.syncTray(playing ? G.tray : {}, playing && G.leaving.some(c => c.took && c.leaveT < .55));
  };

  const hover = () => {
    ui.tooltip = '';
    if (!alive || G.screen !== 'play' || ui.modal || mouse.x < 0 || overHit() || ui.dragDoor) { scene.highlight(null); return; }
    const o = scene.pick(...ndcOf());
    const act = o && o.userData.act, usable = act && (act.type === 'buku' || canAct());
    scene.highlight(usable ? o : null);
    if (usable && !ui.touch) ui.tooltip = describe(act);
  };

  const view = { badges: [], headOf: c => { const hp = c.k3 && scene.headPos(c.k3); return hp ? scene.project(hp) : null; } };

  const loop = now => {
    if (!alive) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
    update(dt); syncScene();
    const prevHits = ui.hits; ui.hits = prevHits; hover();
    scene.frame(dt, t);
    ctx.clearRect(0, 0, W, H);
    ui.hits = []; const tip = ui.tooltip; ui.tooltip = tip;
    view.badges = G.screen === 'play' ? scene.badges() : [];
    drawOverlay3D(view);
    if (ui.shake > 0) ui.shake = 0;
    overlay.style.cursor = ui.hits.some(h => inRect(mouse.x, mouse.y, h.x, h.y, h.w, h.h)) || ui.tooltip || ui.longTip ? 'pointer' : 'default';
    raf = requestAnimationFrame(loop);
  };

  const start = () => {
    scene = createWarung(glCanvas, { game: true, controlsEl: overlay });
    if (import.meta.env.DEV) window.__game3d = { G, ui, scene, runAct, ...customersApi, ...dayApi }; // hanya debug/tes UI
    scene.controls.enablePan = false;
    makeIcons(); ui.hasSave = !!loadSave();
    resize(); ro = new ResizeObserver(resize); ro.observe(stack.parentElement);
    detach = attachInput(overlay);

    // jangan putar kamera saat menyentuh UI / menarik pintu / modal terbuka
    const guard = () => { scene.controls.enabled = !(overHit() || ui.modal || G.doorState === 'closed' || G.screen !== 'play' && false); };
    const onDownCapture = e => {
      const r = overlay.getBoundingClientRect(); mouse.x = (e.clientX - r.left) / r.width * W; mouse.y = (e.clientY - r.top) / r.height * H; guard();
    };
    const onDown = e => {
      if (ui.consumed || G.screen !== 'play' || ui.modal) return;
      const o = scene.pick(...ndcOf()); const act = o && o.userData.act; if (!act) return;
      pending = { act, o, x: e.clientX, y: e.clientY, long: false };
      if (ui.touch) pressTimer = setTimeout(() => { if (pending) { pending.long = true; ui.longTip = describe(act); } }, 420);
    };
    const onUp = e => {
      scene.controls.enabled = true; clearTimeout(pressTimer);
      if (pending) {
        const { act, o, x, y, long } = pending; pending = null;
        const moved = Math.hypot(e.clientX - x, e.clientY - y) > 8;
        if (!long && !moved && (!ui.modal)) { const now = scene.pick(...ndcOf()); if (now === o) runAct(act, scene); }
      }
      ui.longTip = '';
    };
    const onKey = e => {
      if (e.key === '1') api.setView('luar'); else if (e.key === '2') api.setView('pembeli'); else if (e.key === '3') api.setView('penjaga');
    };
    overlay.addEventListener('pointerdown', onDownCapture, true);
    overlay.addEventListener('pointerdown', onDown);
    overlay.addEventListener('pointerup', onUp);
    window.addEventListener('keydown', onKey);
    cleanups.push(() => { overlay.removeEventListener('pointerdown', onDownCapture, true); overlay.removeEventListener('pointerdown', onDown); overlay.removeEventListener('pointerup', onUp); window.removeEventListener('keydown', onKey); });
    last = performance.now(); raf = requestAnimationFrame(loop);
    onReady && onReady(api);
  };

  const api = {
    view: 'luar', onView: null,
    setView(name) { api.view = name; scene && scene.setView(name); api.onView && api.onView(name); },
    destroy() { alive = false; cancelAnimationFrame(raf); detach(); cleanups.forEach(f => f()); ro && ro.disconnect(); scene && scene.dispose(); IMG.onload = IMG.onerror = null; fx.floats.length = 0; },
    get scene() { return scene; },
  };

  IMG.onload = () => { if (alive) { try { start(); } catch (e) { onError && onError(e); } } };
  IMG.onerror = () => onError && onError(new Error('Gagal memuat sprite atlas'));
  IMG.src = atlasUrl;
  return api;
}
