/* Kualitas grafis 3D (per perangkat, disimpan di localStorage — bukan di save game).
   'auto' mulai dari Tinggi dan turun ke Rendah sendiri bila FPS rendah (lalu diingat); 'high' / 'low' memaksa pilihan. */
const QK = 'juragan_quality', AK = 'juragan_autolow';
let hook = null;
const rd = k => { try { return localStorage.getItem(k); } catch { return null; } };
const wr = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* abaikan */ } };

export const qualityPref = () => rd(QK) || 'auto';
export const effectiveQuality = () => { const p = qualityPref(); return p === 'auto' ? (rd(AK) ? 'low' : 'high') : p; };
export const qualityLabel = () => { const p = qualityPref(), e = effectiveQuality(); return p === 'auto' ? `Otomatis (${e === 'low' ? 'Rendah' : 'Tinggi'})` : p === 'low' ? 'Rendah' : 'Tinggi'; };
/** Dipasang oleh mesin 3D: dipanggil dengan kualitas efektif tiap kali berubah. */
export const onQuality = fn => { hook = fn; };

export function cycleQuality() {
  const order = ['auto', 'high', 'low'], p = order[(order.indexOf(qualityPref()) + 1) % order.length];
  wr(QK, p === 'auto' ? null : p); if (p === 'auto') wr(AK, null);   // kembali ke otomatis → uji ulang FPS
  if (hook) hook(effectiveQuality());
  return p;
}
/** FPS terukur rendah di mode otomatis: turun ke Rendah dan ingat untuk sesi berikutnya. */
export function autoDowngrade() { if (qualityPref() !== 'auto' || effectiveQuality() === 'low') return false; wr(AK, '1'); if (hook) hook('low'); return true; }
