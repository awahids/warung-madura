// Pintu masuk publik modul game
export { createEngine } from './engine';
import { ui } from './state';
/** Jeda/lanjutkan simulasi dari luar (mis. saat layar portrait). */
export const setPaused = v => { ui.paused = !!v; };
export * as constants from './constants';
