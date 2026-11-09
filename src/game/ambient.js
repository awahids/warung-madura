import { W } from './constants';
import { rnd } from './util';
import { G, ui, fx } from './state';
import { isRain } from './logic/day';

/** Partikel hujan & lalu lintas latar belakang (murni visual). */
export function updateAmbient(dt) {
  if (G.screen === 'play' && isRain()) {
    while (fx.rainDrops.length < 160) fx.rainDrops.push({ x: rnd(0, W), y: rnd(0, 500), v: rnd(500, 800) });
    for (const d of fx.rainDrops) {
      d.y += d.v * dt; d.x -= 80 * dt;
      if (d.y > 520) { d.y = rnd(-40, 0); d.x = rnd(0, W + 100); }
    }
  } else fx.rainDrops.length = 0;

  if (G.screen === 'play' && !ui.modal && Math.random() < dt / 7) {
    fx.traffic.push({ x: Math.random() < .5 ? -80 : W + 80, dir: 0, v: rnd(160, 260) });
  }
  for (const t of fx.traffic) { if (!t.dir) t.dir = t.x < 0 ? 1 : -1; t.x += t.dir * t.v * dt; }
  fx.traffic = fx.traffic.filter(t => t.x > -120 && t.x < W + 120);
}
