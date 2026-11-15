import * as THREE from 'three';
import { BIZ, PROJECTS } from '../game/story/kota.js';

/* ============================================================
   DIORAMA KOTA (3D): peta kecil yang berubah sesuai proyek, usaha, dan kebersihan kota.
   Grup ini diletakkan jauh dari warung dan hanya terlihat pada kamera "Kota".
   Tata letak: grid 3×3 petak (12×9 m) dengan jalan di antaranya; petak tengah = Balai Kota.
   ============================================================ */
export const CITY_ORIGIN = new THREE.Vector3(0, 0, -220);
/** Petak proyek: [x, z]. Proyek 'jalan' mengubah jalan, bukan petak. */
export const PLOT = { drainase: [-19, -14], pasar: [0, -14], sekolah: [19, -14], puskesmas: [-19, 0], taman: [19, 0], tpa: [-19, 14], industri: [0, 14], angkot: [19, 14] };
const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .8, ...o });
const box = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y + h / 2, z); m.castShadow = false; return m; };
const cyl = (r, h, mat, x = 0, y = 0, z = 0, seg = 12) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat); m.position.set(x, y + h / 2, z); return m; };

function label(text, sub = '', col = '#fff') {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = 'rgba(30,18,8,.82)'; g.beginPath(); g.roundRect(4, 14, 504, 100, 22); g.fill();
  g.fillStyle = col; g.textAlign = 'center'; g.font = '900 46px "Trebuchet MS",Arial,sans-serif'; g.fillText(text, 256, sub ? 62 : 80);
  if (sub) { g.fillStyle = '#ffd36a'; g.font = '700 32px "Trebuchet MS",Arial,sans-serif'; g.fillText(sub, 256, 100); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(9, 2.25, 1); return s;
}
const tree = (x, z, k = 1) => { const g = new THREE.Group(); g.add(cyl(.25 * k, 1.4 * k, M('#7a5230'))); const l = new THREE.Mesh(new THREE.SphereGeometry(1.1 * k, 8, 6), M('#3f8f3a')); l.position.y = 2 * k; g.add(l); g.position.set(x, 0, z); return g; };

/* ---------- bangunan per proyek (footprint ± 10×7) ---------- */
const BUILD = {
  drainase: () => { const g = new THREE.Group(); g.add(box(11, .25, 1.4, M('#3a86c8', { roughness: .2, metalness: .2 }), 0, .02, -2.5)); g.add(box(11, .3, .4, M('#9a9a94'), 0, 0, -3.3)); g.add(box(11, .3, .4, M('#9a9a94'), 0, 0, -1.7)); g.add(cyl(1.3, .6, M('#6a6a70'), 3, 0, 1.5)); g.add(box(2, 1.4, 2, M('#8a8a90'), -3, 0, 1.6)); return g; },
  pasar: () => { const g = new THREE.Group(); g.add(box(10, .2, 6.5, M('#b8b0a0'))); ['#e25b45', '#f0b429', '#3b9ad9', '#58b948', '#e25b45', '#f0b429'].forEach((c, i) => { g.add(box(1.5, .25, 4.6, M(c), -4.2 + i * 1.68, 2.2, -.3)); g.add(cyl(.12, 2.2, M('#6b4020'), -4.2 + i * 1.68, 0, 1.8, 6)); g.add(box(1.2, .6, .8, M('#c98a4b'), -4.2 + i * 1.68, 0, 0)); }); return g; },
  sekolah: () => { const g = new THREE.Group(); g.add(box(9, 3.4, 3.6, M('#f2ede0'), 0, 0, -1)); g.add(box(9.4, .5, 4, M('#c0392b'), 0, 3.4, -1)); g.add(box(1.4, 2, .2, M('#6b4020'), 0, 0, .85)); for (let i = -3; i <= 3; i += 2) g.add(box(.9, .9, .2, M('#9fd0f0'), i, 1.5, .85)); g.add(cyl(.07, 4, M('#cfcfcf'), 4.2, 0, 2.2, 6)); g.add(box(1, .6, .05, M('#e8312f'), 4.7, 3.4, 2.2)); return g; },
  puskesmas: () => { const g = new THREE.Group(); g.add(box(8, 3, 4, M('#ffffff'), 0, 0, -.5)); g.add(box(8.4, .3, 4.4, M('#3b9ad9'), 0, 3, -.5)); g.add(box(.5, 1.7, .15, M('#e8312f'), 0, 3.4, 1.6)); g.add(box(1.7, .5, .15, M('#e8312f'), 0, 4, 1.6)); g.add(box(1.4, 1.8, .2, M('#9fd0f0'), 0, 0, 1.55)); return g; },
  taman: () => { const g = new THREE.Group(); g.add(box(10.5, .15, 7.5, M('#5aa24a'))); const p = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, .12, 20), M('#3a86c8', { roughness: .2 })); p.position.set(0, .2, 0); g.add(p); [[-4, -2.5], [4, -2.5], [-4, 2.5], [4, 2.5], [-3.2, 0], [3.2, 0]].forEach(([x, z]) => g.add(tree(x, z, .9))); g.add(box(1.6, .35, .5, M('#8a5a2a'), 0, .15, 3.1)); return g; },
  tpa: () => { const g = new THREE.Group(); g.add(box(7, 2.6, 4, M('#7e8a92'), -1.5, 0, -.5)); const d = new THREE.Mesh(new THREE.SphereGeometry(2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), M('#58b948')); d.position.set(3.2, 0, .5); g.add(d); g.add(cyl(.5, 4.4, M('#6a6a70'), -3.8, 0, -1.8)); g.add(box(1.6, 1, 1.2, M('#3b9ad9'), 1.5, 0, 2.4)); return g; },
  industri: () => { const g = new THREE.Group(); for (let i = 0; i < 3; i++) { g.add(box(3, 2.4, 5, M('#9a8f86'), -3.4 + i * 3.4, 0, -.3)); const r = box(3.1, .1, 5.2, M('#4a5560'), -3.4 + i * 3.4, 2.4, -.3); r.rotation.z = .3; g.add(r); } g.add(cyl(.45, 5.6, M('#7a4a3a'), 4.4, 0, -1.8)); g.add(cyl(.35, 4.2, M('#7a4a3a'), 3.6, 0, 1.8)); return g; },
  angkot: () => { const g = new THREE.Group(); g.add(box(5, .15, 2, M('#b8b0a0'), 0, 0, 2.2)); g.add(box(4.6, .18, 2.2, M('#2f9a6a'), 0, 2.2, 2.2)); [-2, 2].forEach(x => g.add(cyl(.08, 2.2, M('#6a6a70'), x, 0, 2.9, 6))); const v = box(2.8, 1.1, 1.3, M('#3bb0d9'), -1.5, .5, -1.6); g.add(v); g.add(box(1.5, .7, 1.2, M('#9fd0f0'), -1.1, 1.6, -1.6)); [-2.3, -.7].forEach(x => [-1, -2.2].forEach(z => g.add(cyl(.3, .2, M('#222'), x, .1, z, 10)))); g.add(box(.6, .3, .1, M('#58d658'), -1.5, 1.2, -.9)); return g; },
};
function hall() {
  const g = new THREE.Group();
  g.add(box(10, .4, 7, M('#cfc6b4')));
  g.add(box(7.5, 3.4, 4, M('#f2ede0'), 0, .4, -.5));
  for (let i = -3; i <= 3; i += 1.5) g.add(cyl(.28, 3.4, M('#ffffff'), i, .4, 1.9, 10));
  const roof = new THREE.Mesh(new THREE.ConeGeometry(5.6, 1.7, 4), M('#b0402c')); roof.rotation.y = Math.PI / 4; roof.position.set(0, 4.9, -.5); roof.scale.set(1, 1, .72); g.add(roof);
  g.add(cyl(.08, 4.2, M('#cfcfcf'), 5, 0, 2.8, 6)); g.add(box(1.1, .7, .05, M('#e8312f'), 5.55, 4.1, 2.8)); g.add(box(1.1, .35, .05, M('#fff'), 5.55, 3.75, 2.8));
  return g;
}
function warungMini() {
  const g = new THREE.Group();
  g.add(box(3, 1.8, 2.4, M('#c98a4b'))); g.add(box(3.3, .25, 2.7, M('#8a5424'), 0, 1.8, 0)); g.add(box(2.2, .9, .12, M('#ffd23a'), 0, .5, 1.25)); g.add(box(.3, .8, 2.4, M('#d62f2f'), -1.35, 1.9, 0));
  return g;
}
const BIZ_COL = { cabang: '#e08a3a', grosir: '#6a8fbf', minimarket: '#d62f2f', properti: '#8a7a9a' };
function bizBuilding(id, lv) {
  const g = new THREE.Group(), h = 1.6 + lv * .9, w = 3.4 + (id === 'properti' ? 1.2 : 0);
  g.add(box(w, h, 2.8, M(BIZ_COL[id]), 0, 0, 0)); g.add(box(w + .3, .22, 3.1, M('#4a3a30'), 0, h, 0));
  for (let i = 0; i < lv; i++) g.add(box(.5, .5, .06, M('#ffe9a0', { emissive: '#ffd36a', emissiveIntensity: .3 }), -w / 2 + .8 + i * .55, 1.0, 1.43));
  return g;
}

export function createKota() {
  const group = new THREE.Group(); group.position.copy(CITY_ORIGIN); group.visible = false;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 160), M('#7fb064', { roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -.05; ground.receiveShadow = true; group.add(ground);
  const roads = new THREE.Group(); group.add(roads);
  const dyn = new THREE.Group(); group.add(dyn);
  const sun = new THREE.DirectionalLight('#fff4d8', 2.2); sun.position.set(20, 40, 20); group.add(sun);
  const amb = new THREE.HemisphereLight('#dfeeff', '#7a8a6a', 1.1); group.add(amb);
  let sig = '';

  const buildRoads = (jalan, bers) => {
    roads.clear();
    const road = M(jalan ? '#3c3d42' : '#6a6a64', { roughness: .95 });
    [-7, 7].forEach(z => roads.add(box(64, .08, 3, road, 0, 0, z)));
    [-9.5, 9.5].forEach(x => roads.add(box(3, .08, 46, road, x, 0, 0)));
    if (jalan) { [-7, 7].forEach(z => { for (let x = -30; x < 30; x += 4) roads.add(box(2, .02, .18, M('#f0e0a0'), x, .09, z)); }); [-9.5, 9.5].forEach(x => { for (let z = -21; z < 21; z += 4) roads.add(box(.18, .02, 2, M('#f0e0a0'), x, .09, z)); }); for (const x of [-14, -4, 4, 14]) { roads.add(cyl(.07, 2.8, M('#4a4a50'), x, 0, -5.4, 6)); roads.add(box(.5, .12, .25, M('#fff6c0', { emissive: '#ffe9a0', emissiveIntensity: .6 }), x, 2.7, -5.4)); } }
    else { for (let i = 0; i < 6; i++) roads.add(box(.9, .02, .9, M('#2a2a2c'), -24 + i * 9.5, .09, 7)); }   // lubang jalan
    ground.material.color.set(new THREE.Color('#7fb064').lerp(new THREE.Color('#9c9a6a'), 1 - bers / 100));
  };

  /** state = G.kota (boleh null). Membangun ulang hanya bila ada perubahan. */
  const sync = k => {
    const c = k && k.city, lv = BIZ.map(b => (k && k.biz[b.id]) || 0), done = c ? Object.keys(c.done).sort().join() : '', pr = c ? c.proj.map(p => p.id + p.left).join() : '', bers = c ? Math.round(c.ind.bers / 10) : 4, tree_n = c ? c.done.taman : 0;
    const s = [lv.join(), done, pr, bers, !!c, tree_n].join('|'); if (s === sig) return; sig = s;
    dyn.clear(); buildRoads(!!(c && c.done.jalan), c ? c.ind.bers : 40);
    const H = hall(); H.position.set(0, 0, 0); dyn.add(H); const lh = label('BALAI KOTA', c ? '' : 'belum dilantik'); lh.position.set(0, 8, 0); dyn.add(lh);
    for (const [id, [x, z]] of Object.entries(PLOT)) {
      const def = PROJECTS.find(p => p.id === id), g = new THREE.Group(); g.position.set(x, 0, z);
      const ds = c && c.done[id], run = c && c.proj.find(p => p.id === id);
      let sub = ''; 
      if (ds) { g.add(BUILD[id]()); sub = 'selesai'; }
      else if (run) {
        const prog = 1 - run.left / def.days, b = BUILD[id](); b.scale.y = Math.max(.12, prog); g.add(b); sub = `sisa ${run.left} hari`;
        [[-5, -3.5], [5, -3.5], [-5, 3.5], [5, 3.5]].forEach(([px, pz]) => g.add(cyl(.1, 4.4, M('#f0b429'), px, 0, pz, 6)));
        const crane = new THREE.Group(); crane.add(cyl(.18, 8, M('#f0b429'), 0, 0, 0, 6)); crane.add(box(7, .25, .25, M('#f0b429'), 2.5, 8, 0)); crane.add(box(.1, 2.2, .1, M('#444'), 5.4, 5.8, 0)); crane.position.set(4, 0, -3); g.add(crane);
      } else { g.add(box(10.6, .1, 7.6, M('#b9a27a'))); [-5.3, 5.3].forEach(px => g.add(box(.12, .9, 7.6, M('#8a6a3a'), px, 0, 0))); sub = 'lahan kosong'; }
      const lb = label(def.name, sub, ds ? '#fff' : run ? '#ffe45c' : '#c8c8c8'); lb.position.set(0, 6.6, 0); g.add(lb); dyn.add(g);
    }
    // pohon pinggir jalan: lebih banyak bila kota bersih
    const nTree = 4 + Math.round(bers * 1.6); for (let i = 0; i < nTree; i++) { const a = i / nTree; dyn.add(tree(-30 + a * 60, i % 2 ? 19.5 : -19.5, .8)); }
    // usaha pribadi di sisi selatan + warung asal
    const wm = warungMini(); wm.position.set(-26, 0, 22); dyn.add(wm); const wl = label('WARUNG', 'asal usul'); wl.position.set(-26, 4.5, 22); dyn.add(wl);
    BIZ.forEach((b, i) => { const l = lv[i]; if (!l) return; const bb = bizBuilding(b.id, l); bb.position.set(-14 + i * 10, 0, 22); dyn.add(bb); const bl = label(b.name, `Lv ${l}`); bl.position.set(-14 + i * 10, 2 + 1.6 + l * .9, 22); dyn.add(bl); });
  };
  const dispose = () => { group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { (o.material.map) && o.material.map.dispose(); o.material.dispose(); } }); };
  const setNight = n => { sun.intensity = 2.2 * (1 - .8 * n); amb.intensity = 1.1 - .75 * n; };
  return { group, sync, setNight, dispose, get center() { return CITY_ORIGIN; } };
}
