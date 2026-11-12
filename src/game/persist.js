import { DAY_START, SAVE_KEY } from './constants.js';
import { START_STOCK } from './data.js';
import { ITEM_LVL } from './logic/level.js';
import { initStory } from './logic/story.js';
import { G, ui } from './state.js';

export function freshState(keep) {
  return {
    screen: 'play', day: 1, abs: 0, h: DAY_START, money: 150000, xp: 0, story: initStory(1), rep: 50, energy: 100,
    stock: Object.fromEntries(Object.entries(START_STOCK).filter(([id]) => (ITEM_LVL[id] || 1) <= 1)), tray: {}, cust: [], leaving: [], debts: [], deliveries: [], cart: {},
    totalProfit: 0, won: false, sound: keep ? keep.sound : true, auto: keep ? keep.auto : false,
    door: 0, doorState: 'closed', running: false, promo: false, rain: null, phoneCd: 0, drinkCd: 0,
    stats: null, missions: [], events: [], spawnCd: 3, idle: 0, morning: [], firstCust: true,
  };
}

/* ---------- save / load ---------- */
export function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      day: G.day, xp: G.xp || 0, lastOrder: G.lastOrder || null,
      story: G.story ? { ...G.story, cur: null, result: null } : null, money: G.money, rep: G.rep, stock: G.stock, debts: G.debts, deliveries: G.deliveries,
      totalProfit: G.totalProfit, won: G.won, sound: G.sound, auto: G.auto,
    }));
    ui.hasSave = true;
  } catch { }
}
export function loadSave() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.day) return s; } catch { } return null;
}
export function wipeSave() { try { localStorage.removeItem(SAVE_KEY); } catch { } ui.hasSave = false; }
