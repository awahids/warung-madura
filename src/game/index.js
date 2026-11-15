// Pintu masuk publik modul game
import { ui } from './state';
/** Jeda/lanjutkan simulasi dari luar (mis. saat layar portrait). */
export const setPaused = v => { ui.paused = !!v; };
export * as constants from './constants';
