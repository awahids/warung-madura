// Status bersama (stabil, bisa diimpor oleh semua modul)
export const G = {};                       // state permainan; identitas objek tetap
export function setG(obj) { for (const k of Object.keys(G)) delete G[k]; Object.assign(G, obj); }
export const mouse = { x: -99, y: -99, down: false };
export const ui = {                        // state antarmuka/input
  modal: null, hits: [], tooltip: '', frame: 0, shake: 0, hasSave: false,
  dragDoor: false, dragY: 0, dragDoor0: 0, cv: null,
  paused: false, touch: false, longTip: '', consumed: false,
};
export const fx = { floats: [], toasts: [], rainDrops: [], traffic: [], cricketT: 0 };
setG({ screen: 'title', sound: true, auto: false });
