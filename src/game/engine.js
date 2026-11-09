import atlasUrl from './assets/atlas.webp';
import { W, H } from './constants';
import { ctx, setCtx, IMG } from './gfx';
import { ui } from './state';
import { loadSave } from './persist';
import { makeIcons } from './icons';
import { update } from './update';
import { draw } from './render';
import { updateAmbient } from './ambient';
import { attachInput } from './input';

/**
 * Mesin game: memuat atlas, menjalankan loop update/draw di sebuah <canvas>.
 * Dipakai oleh komponen React <GameCanvas />.
 */
export function createEngine(canvas, { onReady, onError } = {}) {
  ui.cv = canvas;
  setCtx(canvas.getContext('2d'));
  let raf = 0, last = 0, alive = true, detach = () => { }, ro = null;

  const resize = () => {
    const box = canvas.parentElement.getBoundingClientRect();
    const k = Math.min(box.width / W, box.height / H) || 1, dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = Math.floor(W * k) + 'px'; canvas.style.height = Math.floor(H * k) + 'px';
    const s = Math.max(1, Math.min(2, k * dpr));
    canvas.width = Math.round(W * s); canvas.height = Math.round(H * s);
    ctx.setTransform(s, 0, 0, s, 0, 0);
  };
  const loop = now => {
    if (!alive) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    updateAmbient(dt); update(dt); draw();
    raf = requestAnimationFrame(loop);
  };

  IMG.onload = () => {
    if (!alive) return;
    makeIcons(); ui.hasSave = !!loadSave();
    resize(); ro = new ResizeObserver(resize); ro.observe(canvas.parentElement);
    detach = attachInput(canvas);
    last = performance.now(); raf = requestAnimationFrame(loop);
    onReady && onReady();
  };
  IMG.onerror = () => onError && onError(new Error('Gagal memuat sprite atlas'));
  IMG.src = atlasUrl;

  return {
    destroy() { alive = false; cancelAnimationFrame(raf); detach(); ro && ro.disconnect(); IMG.onload = IMG.onerror = null; },
  };
}
