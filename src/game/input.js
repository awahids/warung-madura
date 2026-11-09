import { W, H, HUD_H } from './constants';
import { clamp, inRect } from './util';
import { audio } from './audio';
import { G, ui, mouse } from './state';
import { doHitung } from './logic/customers';

/** Pasang event pointer/keyboard ke canvas. Mengembalikan fungsi pelepas. */
export function attachInput(cv) {
  const toLogical = e => {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
  };
  const onMove = e => {
    const p = toLogical(e); mouse.x = p.x; mouse.y = p.y;
    if (ui.dragDoor && G.doorState === 'closed') {
      const d = clamp(ui.dragDoor0 + (ui.dragY - mouse.y) / (H - HUD_H) * 1.5, 0, 1);
      if (d > G.door) G.door = d;
    }
  };
  const onDown = e => {
    audio(); const p = toLogical(e); mouse.x = p.x; mouse.y = p.y; mouse.down = true;
    if (G.screen === 'play' && G.doorState === 'closed' && !ui.modal) {
      const onBtn = ui.hits.some(h => h.h < 400 && inRect(p.x, p.y, h.x, h.y, h.w, h.h));
      if (!onBtn) {
        ui.dragDoor = true; ui.dragY = p.y; ui.dragDoor0 = G.door;
        try { cv.setPointerCapture(e.pointerId); } catch { /* abaikan */ }
      }
    }
    for (let i = ui.hits.length - 1; i >= 0; i--) {
      const h = ui.hits[i];
      if (inRect(p.x, p.y, h.x, h.y, h.w, h.h)) { if (h.fn) h.fn(); return; }
    }
  };
  const onUp = () => { mouse.down = false; ui.dragDoor = false; };
  const onLeave = () => { onUp(); mouse.x = -99; mouse.y = -99; };
  const onKey = e => {
    if (G.screen !== 'play') return;
    if (e.key === 'Escape') {
      if (!ui.modal) ui.modal = 'pause';
      else if (['pause', 'help', 'notebook'].includes(ui.modal)) ui.modal = null;
    } else if (e.key === ' ' && !ui.modal) { e.preventDefault(); doHitung(); }
  };
  cv.addEventListener('pointermove', onMove);
  cv.addEventListener('pointerdown', onDown);
  cv.addEventListener('pointerup', onUp);
  cv.addEventListener('pointerleave', onLeave);
  window.addEventListener('keydown', onKey);
  return () => {
    cv.removeEventListener('pointermove', onMove); cv.removeEventListener('pointerdown', onDown);
    cv.removeEventListener('pointerup', onUp); cv.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('keydown', onKey);
  };
}
