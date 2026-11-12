import { SFX } from './audio.js';
import { DAY_END, DAY_START, HOUR_SEC, W } from './constants.js';
import { RATE } from './data.js';
import { angryLeave, checkMissions, spawnCustomer } from './logic/customers.js';
import { typeOn } from './logic/level.js';
import { openStoryEvent } from './logic/story.js';
import { endDay, finishClose, isRain, openShop } from './logic/day.js';
import { G, fx, ui } from './state.js';
import { clamp, lerp, pick, rnd } from './util.js';
import { toast } from './widgets.js';

/* ---- update ---- */
export function update(dt) {
  if (ui.paused) return;
  ui.frame++;
  G.phoneCd = Math.max(0, (G.phoneCd || 0) - dt); G.drinkCd = Math.max(0, (G.drinkCd || 0) - dt);
  for (const f of fx.floats) f.t += dt; fx.floats = fx.floats.filter(f => f.t < 1.4);
  for (const t of fx.toasts) t.t += dt; fx.toasts = fx.toasts.filter(t => t.t < 3.4);
  if (G.screen !== 'play') return;

  // pintu
  if (G.doorState === 'closing') { G.door = Math.max(0, G.door - dt * .9); if (G.door <= 0) finishClose(); }
  if (G.doorState === 'closed' && !ui.dragDoor && G.door > 0 && G.door < .96) G.door = Math.max(0, G.door - dt * .04);
  if (G.doorState === 'closed' && G.door >= .96) openShop();

  // pelanggan bergerak (juga saat pause bukan)
  const slotX = [640, 450, 835], slotY = [512, 500, 500], slotS = [1.12, .96, .96];
  if (!ui.modal) {
    G.cust.forEach((c, i) => { c.idx = i; c.tx = slotX[i]; c.ty = slotY[i]; c.ts = slotS[i]; });
    for (const c of G.cust) {
      c.y = c.ty; c.sc = c.sc ? lerp(c.sc, c.ts, .1) : c.ts;
      const dx = c.tx - c.x, sp = 420 * dt; c.x += Math.abs(dx) < sp ? dx : Math.sign(dx) * sp;
      if (Math.abs(c.tx - c.x) < 2) { if (c.state === 'in') c.state = 'wait'; }
      c.bob += dt * 3;
    }
    for (const c of G.leaving) {
      c.leaveT += dt; c.sc = c.sc || 1; c.bob += dt * 5;
      if (c.leaveT > (c.walkAt ?? 1.1)) { c.x += (c.x < W / 2 ? -1 : 1) * 380 * dt; c.dir = c.x < W / 2 ? -1 : 1; }
    }
    G.leaving = G.leaving.filter(c => c.x > -160 && c.x < W + 160);
  }

  if (!G.running || ui.modal) return;

  // waktu
  const dh = dt / HOUR_SEC; G.h += dh; G.abs += dh * 60;
  G.energy -= dh * (G.h >= 23 ? 5.4 : 4);

  // spawn
  const ri0 = clamp(Math.floor(G.h) - DAY_START, 0, RATE.length - 1);
  const repMul = .75 + G.rep / 100 * .55, rainMul = isRain() ? .75 : 1;
  const p = RATE[ri0] * .55 * repMul * rainMul * (G.promo ? 1.4 : 1) * dh;
  G.idle = G.cust.length ? 0 : G.idle + dt;
  G.spawnCd -= dt;
  if (G.spawnCd <= 0 && G.h < DAY_END - .6) {
    if (G.firstCust) { G.firstCust = false; spawnCustomer('pemuda'); G.spawnCd = 4; }
    else if (Math.random() < p || G.idle > 9) { if (spawnCustomer()) { G.spawnCd = 1.5; G.idle = 0; } }
  }
  // event
  for (const e of G.events) if (!e.done && G.h >= e.t && (e.k === 'story' || G.cust.length < 3)) {
    if (e.k === 'story') { if (!G.cust.some(c => c.state === 'wait') && !ui.modal) { e.done = true; openStoryEvent(e.id); } continue; }   // tunggu sampai tidak sedang melayani
    e.done = true;
    if (e.k === 'kasbon') spawnCustomer(pick(['ibu', 'cowok', 'pemuda'].filter(typeOn)), 'kasbon');
    else { spawnCustomer('hoodie'); toast('Seseorang berhoodie dan bermasker muncul di tengah malam…', '#cfd8ff'); SFX.chirp(); }
  }
  // kesabaran
  for (const c of [...G.cust]) {
    if (c.state !== 'wait' && c.state !== 'in') continue;
    if (c.stage === 'pay' || c.stage === 'kasbon') continue;
    c.patience -= dt * (c.idx === 0 ? 1 : .55);
    if (c.patience <= 0) angryLeave(c);
  }
  // kurir
  const d = G.deliveries.find(x => G.abs >= x.eta);
  if (d && !d.notified) { d.notified = true; SFX.bell(); toast('Kurir datang! Klik kardus di kiri bawah.', '#cfe8ff'); }
  checkMissions();
  if (G.energy <= 0) { toast('Kamu pingsan kecapekan…', '#ffd0d0'); endDay('faint'); }
  else if (G.h >= DAY_END) endDay('normal');

  // suara jangkrik malam
  if (G.h > 19 || G.h < 5) { fx.cricketT -= dt; if (fx.cricketT <= 0) { SFX.chirp(); fx.cricketT = rnd(1.5, 4); } }
}

