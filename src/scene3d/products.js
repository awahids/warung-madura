import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/* Kemasan barang dagangan prosedural: sachet/pouch menggembung, bungkus rokok, botol, kaleng, kardus.
   Dipakai untuk isi etalase, rak dinding, dan renteng gantung. Semua label generik (tanpa merek). */

const rnd = (a, b) => a + Math.random() * (b - a);
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const center = (g, text, x, y, size, fill, stroke) => {
  g.font = `900 ${size}px "Trebuchet MS",Arial,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (stroke) { g.lineWidth = size * .16; g.strokeStyle = stroke; g.strokeText(text, x, y); }
  g.fillStyle = fill; g.fillText(text, x, y);
};

/* ---------- geometri ---------- */
/** Kantong bantal: dua sisi menggembung, tepi atas/bawah menyempit (bagian segel). */
export function pouchGeometry(w, h, d, sx = 3, sy = 5) {
  const front = new THREE.PlaneGeometry(w, h, sx, sy), p = front.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) / w + .5, v = p.getY(i) / h + .5;
    const sealed = v < .08 || v > .92 ? .12 : 1;                       // segel atas-bawah hampir datar
    const bu = Math.pow(Math.max(0, Math.sin(Math.PI * u)), .6), bv = Math.pow(Math.max(0, Math.sin(Math.PI * v)), .45); // max(0,…): sin bisa −1e-16 → NaN
    p.setZ(i, (d / 2) * bu * bv * sealed);
  }
  front.computeVertexNormals();
  const back = front.clone(); back.rotateY(Math.PI);
  return mergeGeometries([front, back]);
}
const lathe = pts => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 14);

/* ---------- tekstur kemasan ---------- */
function crimp(g, w, h) {   // segel bergerigi atas & bawah
  g.fillStyle = 'rgba(255,255,255,.32)'; g.fillRect(0, 0, w, h * .1); g.fillRect(0, h * .9, w, h * .1);
  g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 2;
  for (let x = 0; x < w; x += 6) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h * .1); g.moveTo(x, h * .9); g.lineTo(x, h); g.stroke(); }
}
const bean = (g, x, y, s, col) => { g.save(); g.translate(x, y); g.rotate(-.5); g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, s * .55, s * .8, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = s * .12; g.beginPath(); g.moveTo(0, -s * .75); g.quadraticCurveTo(s * .3, 0, 0, s * .75); g.stroke(); g.restore(); };
const chip = (g, x, y, s, col) => {      // kripik bulat bergelombang (bukan segitiga)
  g.save(); g.translate(x, y); g.rotate(x * .05); g.fillStyle = col; g.beginPath();
  for (let a = 0; a <= 6.2832; a += .2) { const r = s * (1 + .12 * Math.sin(a * 6)); g.lineTo(Math.cos(a) * r, Math.sin(a) * r * .8); }
  g.closePath(); g.fill(); g.strokeStyle = 'rgba(120,60,0,.45)'; g.lineWidth = 2.5; g.stroke();
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-s * .25, -s * .25, s * .35, s * .18, -.5, 0, 7); g.fill(); g.restore();
};

/** Sachet kopi: latar warna, biji kopi, nama varian. */
export const kopiTex = (name, bg, accent, ink = '#fff') => canvasTex(128, 192, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, bg); gr.addColorStop(1, accent); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.ellipse(w / 2, h * .42, w * .38, h * .22, 0, 0, 7); g.fill();
  bean(g, w / 2, h * .42, 30, '#4a2a12'); bean(g, w / 2 - 22, h * .46, 14, '#6b3f1d'); bean(g, w / 2 + 22, h * .38, 14, '#6b3f1d');
  center(g, name, w / 2, h * .72, 26, ink, 'rgba(0,0,0,.5)'); center(g, 'SACHET', w / 2, h * .84, 15, 'rgba(255,255,255,.85)');
  crimp(g, w, h);
});
/** Sachet snack/keripik: latar warna, kripik, nama. */
export const snackTex = (name, bg, accent, chipCol) => canvasTex(128, 192, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, bg); gr.addColorStop(1, accent); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(rnd(10, w - 10), rnd(30, h - 30), rnd(8, 18), 0, 7); g.fill(); }
  chip(g, w * .3, h * .34, 17, chipCol); chip(g, w * .68, h * .4, 20, chipCol); chip(g, w * .42, h * .52, 15, chipCol);
  g.fillStyle = 'rgba(255,255,255,.92)'; g.fillRect(8, h * .66, w - 16, h * .2);
  center(g, name, w / 2, h * .76, 24, accent); crimp(g, w, h);
});
/** Bungkus mie instan / gula (pouch umum). */
export const pouchTex = (name, bg, band, ink) => canvasTex(128, 192, (g, w, h) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = band; g.fillRect(0, h * .3, w, h * .32);
  g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.arc(w / 2, h * .46, 34, 0, 7); g.fill();
  center(g, name, w / 2, h * .46, name.length > 5 ? 24 : 30, ink, 'rgba(0,0,0,.35)'); center(g, '500 g', w / 2, h * .8, 16, ink); crimp(g, w, h);
});
/** Bungkus rokok: kotak dengan pita. variant 0..3 */
export const cigTex = variant => {
  const P = [['#f4f4f4', '#c0281a', '#222', 'FILTER'], ['#c0281a', '#f4e2a0', '#fff', 'KRETEK'], ['#1c1c20', '#d4a82a', '#d4a82a', 'GOLD'], ['#2f6bb0', '#e8eef5', '#fff', 'MILD']][variant % 4];
  return canvasTex(96, 128, (g, w, h) => {
    g.fillStyle = P[0]; g.fillRect(0, 0, w, h); g.fillStyle = P[1]; g.fillRect(0, h * .38, w, h * .26);
    g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(0, h * .12, w, 3); center(g, P[3], w / 2, h * .51, 24, P[2] === '#222' ? '#fff' : P[2]);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.font = '700 9px Arial'; g.textAlign = 'center'; g.fillText('MEROKOK DAPAT MEMBAHAYAKAN', w / 2, h * .86);
  });
};
/** Kotak biskuit/deterjen: label bergaris. */
export const boxTex = (name, bg, accent) => canvasTex(128, 192, (g, w, h) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = accent; g.fillRect(0, 0, w, h * .22); g.fillRect(0, h * .84, w, h * .16);
  g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.ellipse(w / 2, h * .5, w * .36, h * .2, 0, 0, 7); g.fill();
  center(g, name, w / 2, h * .5, name.length > 6 ? 20 : 26, accent);
});
const bottleTex = (name, body, label) => canvasTex(64, 128, (g, w, h) => {
  g.fillStyle = body; g.fillRect(0, 0, w, h); g.fillStyle = label; g.fillRect(0, h * .36, w, h * .36);
  center(g, name, w / 2, h * .54, 15, '#7a3a10');
});
const canTex = (name, bg, band) => canvasTex(128, 64, (g, w, h) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = band; g.fillRect(0, h * .3, w, h * .4); center(g, name, w / 2, h * .5, 22, '#fff', 'rgba(0,0,0,.4)');
});

/* ---------- penempatan massal (InstancedMesh per jenis) ---------- */
const MATS = {};
const mat = (key, make) => MATS[key] || (MATS[key] = make());
function def(key) {
  const pouch = (w, h, d, texFn) => ({ geo: pouchGeometry(w, h, d), mat: mat(key, () => new THREE.MeshStandardMaterial({ map: texFn(), roughness: .45, metalness: .05, side: THREE.DoubleSide })) });
  const box = (w, h, d, texFn) => ({ geo: new THREE.BoxGeometry(w, h, d), mat: mat(key, () => new THREE.MeshStandardMaterial({ map: texFn(), roughness: .6 })) });
  switch (key) {
    case 'cig0': case 'cig1': case 'cig2': case 'cig3': return box(.058, .088, .024, () => cigTex(+key[3]));
    case 'biskuit0': return pouch(.1, .15, .035, () => snackTex('BISKUIT', '#e8a23a', '#b3541a', '#f6d68a'));
    case 'biskuit1': return pouch(.1, .15, .035, () => snackTex('WAFER', '#d9547c', '#8a1f4a', '#f6c6d4'));
    case 'permen': return pouch(.085, .12, .03, () => snackTex('PERMEN', '#4aa8d8', '#1c5f9a', '#ffe28a'));
    case 'mie': return pouch(.11, .16, .03, () => pouchTex('MIE', '#e8b923', '#c0281a', '#fff'));
    case 'gula': return pouch(.1, .15, .04, () => pouchTex('GULA', '#f4f4f4', '#2f80d6', '#fff'));
    case 'oil': return { geo: lathe([[0, 0], [.04, 0], [.045, .012], [.045, .17], [.036, .2], [.021, .225], [.021, .25], [0, .25]]), mat: mat(key, () => new THREE.MeshStandardMaterial({ map: bottleTex('MINYAK', '#e6b020', '#fff4d0'), roughness: .3 })) };
    case 'can': return { geo: new THREE.CylinderGeometry(.034, .034, .1, 18), mat: mat(key, () => new THREE.MeshStandardMaterial({ map: canTex('SUSU', '#2f80d6', '#fff'), roughness: .35, metalness: .4 })) };
    case 'boxA': return box(.11, .17, .07, () => boxTex('SABUN', '#2f9e60', '#1a5f3a'));
    case 'boxB': return box(.1, .15, .065, () => boxTex('TEH', '#c0281a', '#7a1010'));
    default: throw new Error('jenis barang tidak dikenal: ' + key);
  }
}
/** Kumpulkan penempatan lalu bangun satu InstancedMesh per jenis. */
export function createStock() {
  const bins = new Map();
  return {
    add(key, x, y, z, ry = 0, tilt = 0) { (bins.get(key) || bins.set(key, []).get(key)).push([x, y, z, ry, tilt]); return this; },
    build(cast = true) {
      const g = new THREE.Group(), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
      for (const [key, list] of bins) {
        const { geo, mat: mt } = def(key), inst = new THREE.InstancedMesh(geo, mt, list.length);
        // geometri "bantal"/lathe berpusat di tengah-bawah berbeda; offset y agar alas di y=0
        geo.computeBoundingBox(); const lift = -geo.boundingBox.min.y;
        list.forEach(([x, y, z, ry, tilt], i) => { e.set(tilt, ry, 0); q.setFromEuler(e); m.compose(p.set(x, y + lift, z), q, one); inst.setMatrixAt(i, m); });
        inst.castShadow = cast; inst.receiveShadow = true; g.add(inst);
      }
      return g;
    },
  };
}

/** Isi etalase kaca (lebar cw): rokok eceran di rak atas, biskuit/wafer/permen di rak bawah. Koordinat lokal etalase. */
export function fillEtalase(caseG, cw) {
  const s = createStock();
  const rows = [[.26, ['cig0', 'cig1', 'cig2', 'cig3']], [.012, ['biskuit0', 'biskuit1', 'permen', 'biskuit0']]];
  rows.forEach(([y, kinds], r) => {
    for (let row = 0; row < 2; row++) for (let i = 0; i < 14; i++) {
      const k = kinds[Math.floor(i / 3.5) % kinds.length], x = -cw / 2 + .08 + i * ((cw - .16) / 13), z = row === 0 ? -.1 : .1;
      s.add(k, x, y + .006, z + rnd(-.01, .01), rnd(-.15, .15), r === 1 ? rnd(-.08, .08) : 0);
    }
  });
  caseG.add(s.build());
}

/** Isi satu unit rak dinding. xs = pusat unit (dunia), boards = tinggi papan. */
export function fillWallShelf(scene, cx, boards, W = 1.25, zBack = -3.02) {
  const s = createStock();
  const themes = [['oil', 'gula', 'oil', 'gula'], ['mie', 'can', 'mie', 'can'], ['boxA', 'boxB', 'boxA', 'boxB'], ['biskuit0', 'permen', 'biskuit1', 'permen']];
  boards.forEach((y, bi) => {
    const kinds = themes[bi % themes.length];
    for (let row = 0; row < 2; row++) for (let i = 0; i < 9; i++) {
      const k = kinds[Math.floor(i / 2.3) % kinds.length], x = cx - W / 2 + .1 + i * .125;
      s.add(k, x, y + .0175, zBack - .05 + row * .13, rnd(-.12, .12));
    }
  });
  scene.add(s.build(false));   // rak belakang: tanpa bayangan (hemat)
}

/**
 * Renteng gantung: tali + sachet 3D menggembung yang bergantungan. kind: 'kopi' | 'snack'.
 * Mengembalikan Group (sudah berisi tali + semua sachet).
 */
export function hangingStrips(kind, x0, count = 8, top = 2.33, perStrip = 6) {
  const variants = kind === 'kopi'
    ? [kopiTex('HITAM', '#4a2a12', '#2a1608'), kopiTex('SUSU', '#c89b64', '#7a4a22'), kopiTex('GULA', '#8a5a2a', '#4a2a12', '#ffe9b0'), kopiTex('JAHE', '#d98a2c', '#8a4a10')]
    : [snackTex('KERIPIK', '#d63b2f', '#8a1f18', '#f6c744'), snackTex('JAGUNG', '#f6c744', '#c98a14', '#fff1a8'), snackTex('COKLAT', '#7a4a2a', '#3a1f10', '#f0c8a0'), snackTex('BALADO', '#e8662a', '#a03a10', '#ffd27a')];
  const geo = pouchGeometry(.09, .13, .03), g = new THREE.Group();
  const mats = variants.map(map => new THREE.MeshStandardMaterial({ map, roughness: .45, side: THREE.DoubleSide }));
  const per = Math.ceil(count * perStrip / variants.length), insts = mats.map(m => { const i = new THREE.InstancedMesh(geo, m, per + 4); i.count = 0; i.castShadow = false; return i; });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(), strings = [];
  let n = 0;
  for (let i = 0; i < count; i++) {
    const x = x0 + i * .21, z = -.14 - (i % 2) * .08, len = perStrip * .125 + .04;
    strings.push(x, top, z, x, top - len, z);
    for (let j = 0; j < perStrip; j++) {
      const vi = n++ % variants.length, inst = insts[vi];
      e.set(rnd(-.06, .06), rnd(-.5, .5), rnd(-.06, .06)); q.setFromEuler(e);
      m4.compose(p.set(x, top - .075 - j * .125, z), q, one); inst.setMatrixAt(inst.count++, m4);
    }
  }
  insts.forEach(i => { i.instanceMatrix.needsUpdate = true; g.add(i); });
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(strings, 3));
  g.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: '#cfcfcf' })));
  return g;
}
