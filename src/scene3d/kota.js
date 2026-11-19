import * as THREE from 'three';
import { BIZ, PROJECTS } from '../game/story/kota.js';

/* ============================================================
   DIORAMA KOTA (3D): peta kecil yang berubah sesuai proyek, usaha, dan kebersihan kota.
   Grup ini diletakkan jauh dari warung dan hanya terlihat pada kamera "Kota".
   Tata letak: grid 3×3 petak (12×9 m) dengan jalan di antaranya; petak tengah = Balai Kota.
   ============================================================ */
export const CITY_ORIGIN = new THREE.Vector3(0, 0, -220);
/** Lokasi proyek di peta: [x, z]. Peta ±80 × ±55 m: danau memanjang di tengah, jembatan di utara, Balai Kota di timur. 'jalan' mengubah semua jalan. */
export const PLOT = { sekolah: [-48, -6], puskesmas: [-48, 16], drainase: [22, -22], pasar: [50, -24], industri: [72, -6], taman: [-2, 6], angkot: [44, 22], tpa: [62, 48], rusun: [-62, 30], rsud: [-62, 0], terminal: [22, 40] };
export const HALL_AT = [44, -5];
const LAKE = [[-8, -50], [6, -47], [12, -36], [10, -24], [16, -12], [14, 0], [8, 10], [4, 22], [8, 34], [2, 50], [-10, 52], [-14, 40], [-12, 28], [-18, 14], [-14, 0], [-18, -14], [-12, -26], [-14, -38]];
const BAY = [[54, 18], [66, 15], [80, 18], [80, 30], [66, 32], [56, 28]];
const ISLE = [[-9, 2], [-2, -1], [5, 3], [5, 10], [-2, 13], [-9, 9]];
/** Jalan: [lebar, titik...]; yang melewati danau (jembatan) ditandai bridge. */
const ROADS = [
  { w: 3.4, bridge: [-14, 12], pts: [[-80, -34], [-55, -33], [-30, -34], [-14, -33], [0, -33], [12, -33], [30, -35], [55, -33], [80, -36]] },
  { w: 2.8, pts: [[-30, -34], [-33, -15], [-32, 5], [-30, 25], [-26, 45], [-28, 56]] },
  { w: 2.8, pts: [[30, -35], [34, -18], [36, -4], [34, 12], [33, 22], [36, 38], [34, 56]] },
  { w: 2.4, pts: [[-80, 38], [-50, 40], [-26, 45]] },
  { w: 2.4, pts: [[36, 38], [55, 40], [80, 42]] },
  { w: 2.4, pts: [[36, -4], [52, -14], [66, -20], [80, -24]] },
  { w: 2.4, pts: [[36, 6], [52, 6], [80, 6]] },
  { w: 2, pts: [[-80, 12], [-55, 10], [-32, 8]] },
];
const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .8, ...o });
const box = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y + h / 2, z); m.castShadow = false; return m; };
const cyl = (r, h, mat, x = 0, y = 0, z = 0, seg = 12) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat); m.position.set(x, y + h / 2, z); return m; };

function label(text, sub = '', col = '#fff', k = 1) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = 'rgba(30,18,8,.82)'; g.beginPath(); g.roundRect(4, 14, 504, 100, 22); g.fill();
  g.fillStyle = col; g.textAlign = 'center'; g.font = '900 46px "Trebuchet MS",Arial,sans-serif'; g.fillText(text, 256, sub ? 62 : 80);
  if (sub) { g.fillStyle = '#ffd36a'; g.font = '700 32px "Trebuchet MS",Arial,sans-serif'; g.fillText(sub, 256, 100); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(9 * k * 1.5, 2.25 * k * 1.5, 1); return s;
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
  rusun: () => { const g = new THREE.Group(); [-3, 3].forEach(x => { g.add(box(4.2, 6.5, 3.4, M('#e9e2d2'), x, 0, -.8)); for (let f = 0; f < 5; f++) for (let w = -1; w <= 1; w++) g.add(box(.7, .5, .05, M('#5a7890'), x + w * 1.2, .9 + f * 1.2, .93)); g.add(box(4.4, .2, 3.6, M('#c9512f'), x, 6.5, -.8)); }); g.add(box(10, .1, 2.2, M('#9a9a96'), 0, 0, 2.4)); return g; },
  rsud: () => { const g = new THREE.Group(); g.add(box(9.5, 4.2, 5, M('#f6f6f2'), 0, 0, -.6)); g.add(box(4, 1.8, 3, M('#f6f6f2'), 2.2, 4.2, -.8)); g.add(box(.5, 2, .15, M('#e8312f'), -2.5, 2.2, 1.95)); g.add(box(2, .5, .15, M('#e8312f'), -2.5, 2.95, 1.95)); const hp = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, .08, 20), M('#3a3a40')); hp.position.set(2.2, 6.05, -.8); g.add(hp); g.add(box(1.4, .02, .25, M('#ffffff'), 2.2, 6.1, -.8)); g.add(box(2.2, 1.6, .2, M('#9fd0f0'), 0, 0, 1.95)); return g; },
  terminal: () => { const g = new THREE.Group(); g.add(box(10.5, .15, 6.5, M('#9a9a96'))); g.add(box(9, .3, 2.6, M('#2f7fbf'), 0, 3, -1.8)); for (const x of [-4, -1.3, 1.3, 4]) g.add(cyl(.12, 3, M('#cfcfcf'), x, 0, -1.8, 6)); [[-3, 1.8, '#e8312f'], [1, 1.8, '#3bb0d9'], [4.2, 1.8, '#f0b429']].forEach(([x, z, c]) => { g.add(box(3, 1.2, 1.2, M(c), x, .1, z)); g.add(box(2.6, .4, 1.22, M('#9fd0f0'), x, .75, z)); }); return g; },
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

/* ---------- geometri bantu ---------- */
const smooth2 = (pts, n = 90) => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal').getPoints(n).map(v => [v.x, v.z]);
const inPoly = (x, z, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
const shapeOf = (poly) => { const sh = new THREE.Shape(poly.map(([x, z]) => new THREE.Vector2(x, -z))); return sh; };
const holeOf = poly => new THREE.Path(poly.map(([x, z]) => new THREE.Vector2(x, -z)).reverse());
/** Pita jalan mengikuti kurva Catmull-Rom. */
function ribbon(pts, w, mat, y = .06) {
  const cv = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal'), P = cv.getPoints(pts.length * 14), pos = [], idx = [];
  P.forEach((p, i) => { const q = P[Math.min(i + 1, P.length - 1)], r = P[Math.max(i - 1, 0)], tx = q.x - r.x, tz = q.z - r.z, l = Math.hypot(tx, tz) || 1, nx = -tz / l * w / 2, nz = tx / l * w / 2; pos.push(p.x + nx, y, p.z + nz, p.x - nx, y, p.z - nz); if (i) { const k = (i - 1) * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.userData.pts = P; return m;
}
const nearRoad = (x, z, pad) => ROADS.some(r => { const P = r.pts; for (let i = 0; i < P.length - 1; i++) { const [ax, az] = P[i], [bx, bz] = P[i + 1], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz))); if (Math.hypot(x - ax - t * dx, z - az - t * dz) < r.w / 2 + pad) return true; } return false; });
const rnd = (() => { let s = 12345; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

export function createKota() {
  const group = new THREE.Group(); group.position.copy(CITY_ORIGIN); group.visible = false;
  const lakeP = smooth2(LAKE), bayP = smooth2(BAY, 40), isleP = smooth2(ISLE, 40);
  const inWater = (x, z, pad = 0) => (inPoly(x, z, lakeP) || inPoly(x, z, bayP)) && !inPoly(x, z, isleP) || (pad && [[x + pad, z], [x - pad, z], [x, z + pad], [x, z - pad]].some(([a, b]) => inPoly(a, b, lakeP) || inPoly(a, b, bayP)) && !inPoly(x, z, isleP));
  // air + daratan (dengan lubang danau & teluk) + pulau taman
  const water = new THREE.Mesh(new THREE.PlaneGeometry(260, 200), M('#2f7f93', { roughness: .15, metalness: .25 })); water.rotation.x = -Math.PI / 2; water.position.y = -.35; group.add(water);
  const land = shapeOf([[-80, -55], [80, -55], [80, 55], [-80, 55]]); land.holes.push(holeOf(lakeP), holeOf(bayP));
  const landMat = M('#8a9a58', { roughness: 1 });
  const landMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(land, { depth: .5, bevelEnabled: false }), landMat); landMesh.rotation.x = -Math.PI / 2; landMesh.position.y = -.5; group.add(landMesh);
  const isle = new THREE.Mesh(new THREE.ExtrudeGeometry(shapeOf(isleP), { depth: .5, bevelEnabled: false }), M('#6fae58', { roughness: 1 })); isle.rotation.x = -Math.PI / 2; isle.position.y = -.5; group.add(isle);
  const roads = new THREE.Group(); group.add(roads);

  /* kawasan perumahan statis: rumah beratap merah berbaris seperti peta satelit */
  const winMats = [];
  const plots = Object.values(PLOT).map(([x, z]) => [x, z, 8.5, 6.5]).concat([[HALL_AT[0], HALL_AT[1], 9, 7], [58, -44, 11, 6]]);
  const blocked = (x, z) => inWater(x, z, 1.6) || nearRoad(x, z, 1.6) || plots.some(([px, pz, hx, hz]) => Math.abs(x - px) < hx && Math.abs(z - pz) < hz) || (z < -40 && x < -28 && x > -78 && z > -50 && Math.abs(x + 50) < 24);
  const ZONES = [[-76, -36, -30, 52, .94], [18, 31, -8, 54, .92], [40, 78, 12, 60, .9], [38, 78, -32, -10, .85], [-28, -16, 34, 56, .85], [-78, -58, -54, -36, .45]];
  /* tata letak: baris rumah menghadap jalan lingkungan; tiap 6 baris ada gang; sebagian bangunan jadi apartemen */
  const spots = [], lanes = [], aparts = [];
  for (const [x0, x1, z0, z1, d] of ZONES) {
    let row = 0;
    for (let z = z0; z <= z1; z += 3.1, row++) {
      const lane = row % 6 === 5;
      for (let x = x0; x <= x1; x += 3.4) {
        if (blocked(x, z)) continue;
        if (lane) { lanes.push([x, z]); continue; }
        if (rnd() >= d) continue;
        const px = x + (rnd() - .5) * .25, pz = z + (rnd() - .5) * .2, facing = row % 6 < 3 ? 0 : Math.PI;
        if (x0 >= 18 && x0 < 40 && rnd() < .11 || (x0 >= 38 && rnd() < .06)) aparts.push([px, pz, 3 + Math.floor(rnd() * 4)]);
        else spots.push({ x: px, z: pz, rot: facing + (rnd() < .12 ? Math.PI / 2 : 0), sx: .85 + rnd() * .35, sy: .9 + rnd() * .35, sz: .9 + rnd() * .25, wall: Math.floor(rnd() * 5), roof: Math.floor(rnd() * 6), lawn: Math.floor(rnd() * 3) });
      }
    }
  }
  const N = spots.length, mx = new THREE.Matrix4(), col = new THREE.Color(), dm = new THREE.Object3D();
  const WALL = ['#efe6d6', '#f4f0e6', '#e9d3b4', '#d9d4c8', '#f0d9c4'], ROOF = ['#c9512f', '#b8432a', '#d9693c', '#9a3a2a', '#7a6a5a', '#c46a3a'], LAWN = ['#74a84e', '#6a9c48', '#86b05a'];
  const prism = new THREE.CylinderGeometry(1, 1, 2.3, 3); prism.rotateZ(Math.PI / 2); prism.rotateX(-Math.PI / 2); prism.scale(1, .62, 1.08);
  const lawnM = new THREE.InstancedMesh(new THREE.BoxGeometry(3.1, .05, 2.9), M('#fff', { roughness: 1 }), N), walls = new THREE.InstancedMesh(new THREE.BoxGeometry(2, 1, 1.6), M('#fff'), N), roofs = new THREE.InstancedMesh(prism, M('#fff', { roughness: .7 }), N);
  const doors = new THREE.InstancedMesh(new THREE.BoxGeometry(.34, .62, .08), M('#5a3a22'), N), slabs = new THREE.InstancedMesh(new THREE.BoxGeometry(.95, .04, 1.1), M('#9a9a96'), N);
  const place = (mesh, i, sp, ox, oy, oz, sx = 1, sy = 1, sz = 1) => { dm.position.set(sp.x, 0, sp.z); dm.rotation.set(0, sp.rot, 0); dm.updateMatrix(); mx.copy(dm.matrix); const l = new THREE.Matrix4().compose(new THREE.Vector3(ox, oy, oz), new THREE.Quaternion(), new THREE.Vector3(sx, sy, sz)); mx.multiply(l); mesh.setMatrixAt(i, mx); };
  spots.forEach((sp, i) => {
    place(lawnM, i, sp, 0, .03, 0); lawnM.setColorAt(i, col.set(LAWN[sp.lawn]));
    place(walls, i, sp, 0, .5 * sp.sy, 0, sp.sx, sp.sy, sp.sz); walls.setColorAt(i, col.set(WALL[sp.wall]));
    place(roofs, i, sp, 0, sp.sy + .3 * sp.sy, 0, sp.sx, sp.sy * .9 + .2, sp.sz); roofs.setColorAt(i, col.set(ROOF[sp.roof]));
    place(doors, i, sp, -.3 * sp.sx, .31, .8 * sp.sz); place(slabs, i, sp, .55 * sp.sx, .05, 1.1 * sp.sz);
  });
  group.add(lawnM, walls, roofs, doors, slabs);
  // gang antar baris rumah
  const laneM = new THREE.InstancedMesh(new THREE.BoxGeometry(3.5, .05, 1.5), M('#8d8a82', { roughness: 1 }), lanes.length); lanes.forEach(([x, z], i) => { mx.makeTranslation(x, .04, z); laneM.setMatrixAt(i, mx); }); group.add(laneM);
  // apartemen & ruko: kotak tinggi berjendela (tekstur kanvas) yang menyala malam hari
  const winCv = (lit) => { const c = document.createElement('canvas'); c.width = 128; c.height = 128; const g = c.getContext('2d'); g.fillStyle = lit ? '#000' : '#e6e2d8'; g.fillRect(0, 0, 128, 128); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = lit ? (((x * 7 + y * 3) % 5) ? '#ffcf70' : '#000') : '#5a7890'; g.fillRect(10 + x * 30, 8 + y * 30, 18, 18); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  const aptMat = new THREE.MeshStandardMaterial({ map: winCv(false), emissiveMap: winCv(true), emissive: '#fff', emissiveIntensity: 0, roughness: .6 });
  const tall = (w, h, d, floors) => { const g = new THREE.BoxGeometry(w, h, d); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * floors / 4); return g; };
  aparts.forEach(([x, z, fl]) => { const m = new THREE.Mesh(tall(2.8, fl * .9, 2.6, fl), aptMat); m.position.set(x, fl * .45, z); group.add(m); const rf = box(3, .12, 2.8, M('#7a7a78'), x, fl * .9, z); group.add(rf); });
  winMats.push(aptMat);
  // pohon: tampil makin banyak bila kota bersih
  const treeSpots = []; for (let i = 0; i < 700 && treeSpots.length < 260; i++) { const x = -78 + rnd() * 156, z = -53 + rnd() * 106; if (!blocked(x, z) && !spots.some(sp => Math.abs(sp.x - x) < 2 && Math.abs(sp.z - z) < 2)) treeSpots.push([x, z, .8 + rnd() * .6]); }
  const trees = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.1, 0), M('#3f8f3a', { flatShading: true }), treeSpots.length); treeSpots.forEach(([x, z, k], i) => { mx.makeScale(k, k, k); mx.setPosition(x, 1.1 * k, z); trees.setMatrixAt(i, mx); }); group.add(trees);
  // pusat belanja & lahan parkir (dekoratif), seperti kawasan komersial di peta
  const mall = new THREE.Group(); mall.add(box(18, 3.6, 9, new THREE.MeshStandardMaterial({ map: winCv(false), emissiveMap: winCv(true), emissive: '#fff', emissiveIntensity: 0 }))); [-6, 0, 6].forEach(x => mall.add(box(1.6, .6, 1.2, M('#9a9a98'), x, 3.9, 0))); mall.add(box(6, .25, 2, M('#d62f2f'), 0, 2.4, 5)); [-2.6, 2.6].forEach(x => mall.add(cyl(.12, 2.4, M('#cfcfcf'), x, 0, 5.8, 6))); mall.add(box(18.4, .3, 9.4, M('#c9c4b8'), 0, 3.6, 0)); mall.add(box(17, .06, 8, M('#4a4b50'), 0, 0, 8.5)); mall.position.set(58, 0, -44); group.add(mall);
  const ml = label('PUSAT BELANJA', '', '#fff', .8); ml.position.set(58, 6.4, -44); group.add(ml);
  [['DANAU KOTA BARU', -2, -18], ['JEMBATAN WADUK', 0, -30], ['PERUMAHAN TATAR', -58, -24], ['PERUMAHAN KULON', 66, 40]].forEach(([t, x, z]) => { const l = label(t, '', '#bfe6ff', .85); l.position.set(x, 4.2, z); group.add(l); });

  /* ---------- kota yang hidup: mobil di jalan, perahu di danau, lampu rumah menyala malam hari ---------- */
  const NCAR = 56, carCurves = ROADS.map(r => new THREE.CatmullRomCurve3(r.pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal'));
  const carLen = carCurves.map(c => c.getLength());
  const cars = Array.from({ length: NCAR }, (_, i) => ({ r: i % ROADS.length === 7 ? 0 : i % ROADS.length, t: rnd(), dir: rnd() < .5 ? 1 : -1, v: 5 + rnd() * 4, lane: .5 + rnd() * .35 }));
  const CARCOL = ['#e8312f', '#f2f2f2', '#3b6fd9', '#f0b429', '#2f9a6a', '#222222', '#e07a2a'];
  const carBody = new THREE.InstancedMesh(new THREE.BoxGeometry(2, .65, .95), M('#fff', { roughness: .4 }), NCAR), carTop = new THREE.InstancedMesh(new THREE.BoxGeometry(1.0, .5, .85), M('#9fd0f0', { roughness: .2 }), NCAR);
  cars.forEach((c, i) => carBody.setColorAt(i, col.set(CARCOL[i % CARCOL.length]))); group.add(carBody, carTop);
  const wet = (x, z) => inPoly(x, z, lakeP) && !inPoly(x, z, isleP);
  const boats = []; for (const [x, z] of [[-8, -20], [-2, -38], [-5, 30], [0, 42], [-12, -5], [0, 22], [-10, 20]]) if (wet(x, z)) boats.push({ x, z, a: rnd() * 6.28, v: 1.5 + rnd() * 1.2 });
  const boatHull = new THREE.InstancedMesh(new THREE.BoxGeometry(2.8, .5, 1.1), M('#f4f4f0'), boats.length), boatCab = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, .6, .8), M('#e8312f'), boats.length); group.add(boatHull, boatCab);
  let nightAmt = 0, carN = 20;
  const dummy = new THREE.Object3D(), up = new THREE.Vector3(0, 1, 0), tg = new THREE.Vector3(), side = new THREE.Vector3();
  const step = dt => {
    for (let i = 0; i < NCAR; i++) {
      const c = cars[i]; if (i >= carN) { dummy.position.set(0, -50, 0); dummy.scale.setScalar(.001); dummy.updateMatrix(); carBody.setMatrixAt(i, dummy.matrix); carTop.setMatrixAt(i, dummy.matrix); continue; }
      c.t += c.dir * c.v * dt / carLen[c.r]; if (c.t > 1) c.t -= 1; if (c.t < 0) c.t += 1;
      const cv = carCurves[c.r], p = cv.getPointAt(c.t); cv.getTangentAt(c.t, tg); if (c.dir < 0) tg.negate(); side.crossVectors(up, tg).normalize();
      const yaw = Math.atan2(tg.x, tg.z) - Math.PI / 2, onBridge = ROADS[c.r].bridge && p.x > ROADS[c.r].bridge[0] && p.x < ROADS[c.r].bridge[1];
      dummy.scale.setScalar(1); dummy.rotation.set(0, yaw, 0);
      dummy.position.set(p.x + side.x * c.lane, (onBridge ? .5 : .42), p.z + side.z * c.lane); dummy.updateMatrix(); carBody.setMatrixAt(i, dummy.matrix);
      dummy.position.y += .5; dummy.position.x -= Math.cos(yaw) * .15; dummy.position.z += Math.sin(yaw) * .15; dummy.updateMatrix(); carTop.setMatrixAt(i, dummy.matrix);
    }
    carBody.instanceMatrix.needsUpdate = carTop.instanceMatrix.needsUpdate = true; if (carBody.instanceColor) carBody.instanceColor.needsUpdate = true;
    boats.forEach((b, i) => {
      let nx = b.x + Math.cos(b.a) * b.v * dt, nz = b.z + Math.sin(b.a) * b.v * dt;
      if (!wet(nx + Math.cos(b.a) * 3, nz + Math.sin(b.a) * 3)) { b.a += 1.2 + rnd(); nx = b.x; nz = b.z; } else { b.x = nx; b.z = nz; b.a += Math.sin(performance.now() / 4000 + i) * dt * .08; }
      dummy.scale.setScalar(1); dummy.rotation.set(0, -b.a, 0); dummy.position.set(b.x, -.1, b.z); dummy.updateMatrix(); boatHull.setMatrixAt(i, dummy.matrix); dummy.position.set(b.x - Math.cos(b.a) * .3, .4, b.z - Math.sin(b.a) * .3); dummy.updateMatrix(); boatCab.setMatrixAt(i, dummy.matrix);
    });
    boatHull.instanceMatrix.needsUpdate = boatCab.instanceMatrix.needsUpdate = true;
    winMats.forEach(m => { m.emissiveIntensity = 1.1 * nightAmt; });
  };

  const dyn = new THREE.Group(); group.add(dyn);
  const sun = new THREE.DirectionalLight('#fff4d8', 2.2); sun.position.set(30, 60, 30); group.add(sun);
  const amb = new THREE.HemisphereLight('#dfeeff', '#7a8a6a', 1.2); group.add(amb);
  let sig = '';

  const buildRoads = (jalan, bers) => {
    roads.clear();
    const dbl = { side: THREE.DoubleSide }, mat = M(jalan ? '#3c3d42' : '#77746a', { roughness: .95, ...dbl }), line = M('#f0e0a0', dbl), deck = M('#9a9a98', dbl);
    for (const r of ROADS) {
      const rb = ribbon(r.pts, r.w, mat); roads.add(rb);
      if (r.bridge) { const b = ribbon(r.pts.filter(([x]) => x >= r.bridge[0] - 4 && x <= r.bridge[1] + 4), r.w + .8, deck, .12); roads.add(b); for (const x of [-10, -3, 4, 10]) roads.add(cyl(.5, 1.2, deck, x, -.9, -33, 8)); }
      if (jalan) roads.add(ribbon(r.pts, .16, line, .09));
      else { for (let i = 0; i < r.pts.length - 1; i += 2) { const [x, z] = r.pts[i]; roads.add(box(1, .02, 1, M('#2a2a2c'), x + 1, .08, z + .3)); } }   // lubang jalan
    }
    if (jalan) for (const [x, z] of [[-30, -28], [-32, 0], [-28, 30], [34, -26], [36, 6], [34, 30], [-45, -33], [45, -33], [10, -35], [-10, -35]]) { roads.add(cyl(.08, 3, M('#4a4a50'), x + 2, 0, z, 6)); roads.add(box(.6, .12, .3, M('#fff6c0', { emissive: '#ffe9a0', emissiveIntensity: .6 }), x + 2, 2.9, z)); }
    landMat.color.set(new THREE.Color('#8a9a58').lerp(new THREE.Color('#a39a68'), 1 - bers / 100));
  };

  /** state = G.kota (boleh null). Membangun ulang hanya bila ada perubahan. */
  const sync = k => {
    const c = k && k.city, lv = BIZ.map(b => (k && k.biz[b.id]) || 0), done = c ? Object.keys(c.done).filter(i => c.done[i]).sort().join() + '!' + Object.keys(c.broken || {}).filter(i => c.broken[i]).join() : '', pr = c ? c.proj.map(p => p.id + p.left).join() : '', bers = c ? Math.round(c.ind.bers / 10) : 4;
    const s = [lv.join(), done, pr, bers, !!c, c ? Math.round(c.ind.sej / 5) : 0, k && k.term].join('|'); if (s === sig) return; sig = s;
    carN = Math.round(14 + (c && c.done.jalan ? 22 : 0) + (c ? c.ind.sej * .2 : 4)); dyn.clear(); buildRoads(!!(c && c.done.jalan), c ? c.ind.bers : 40);
    trees.count = Math.round(treeSpots.length * (.35 + .65 * (c ? c.ind.bers : 40) / 100) + (c && c.done.taman ? 0 : 0));
    const H = hall(); H.position.set(HALL_AT[0], 0, HALL_AT[1]); dyn.add(H); const lh = label('BALAI KOTA', c ? '' : 'belum dilantik'); lh.position.set(HALL_AT[0], 8.5, HALL_AT[1]); dyn.add(lh);
    const rd = new THREE.Mesh(new THREE.TorusGeometry(3.6, .9, 4, 24), M(c && c.done.jalan ? '#3c3d42' : '#77746a')); rd.rotation.x = -Math.PI / 2; rd.position.set(36, .08, -4); dyn.add(rd);   // bundaran di depan Balai Kota
    for (const [id, [x, z]] of Object.entries(PLOT)) {
      const def = PROJECTS.find(p => p.id === id), g = new THREE.Group(); g.position.set(x, 0, z);
      const bk = c && c.broken && c.broken[id], ds = c && c.done[id] && !bk, run = c && c.proj.find(p => p.id === id);
      let sub = '';
      if (bk) { const b = BUILD[id](); b.scale.y = .4; b.rotation.z = .08; g.add(b); sub = 'RUSAK!'; }
      else if (ds) { g.add(BUILD[id]()); sub = 'selesai'; }
      else if (run) {
        const prog = 1 - run.left / def.days, b = BUILD[id](); b.scale.y = Math.max(.12, prog); g.add(b); sub = `sisa ${run.left} hari`;
        [[-5, -3.5], [5, -3.5], [-5, 3.5], [5, 3.5]].forEach(([px, pz]) => g.add(cyl(.1, 4.4, M('#f0b429'), px, 0, pz, 6)));
        const crane = new THREE.Group(); crane.add(cyl(.18, 8, M('#f0b429'), 0, 0, 0, 6)); crane.add(box(7, .25, .25, M('#f0b429'), -2.5, 8, 0)); crane.add(box(.1, 2.2, .1, M('#444'), -5.4, 5.8, 0)); crane.position.set(4.5, 0, -3.2); g.add(crane);
      } else { g.add(box(10.6, .1, 7.6, M('#b9a27a'))); [-5.3, 5.3].forEach(px => g.add(box(.12, .9, 7.6, M('#8a6a3a'), px, 0, 0))); sub = def.term > ((k && k.term) || 1) ? 'cadangan periode 2' : 'lahan kosong'; }
      const lb = label(def.name, sub, bk ? '#ff8a7a' : ds ? '#fff' : run ? '#ffe45c' : '#c8c8c8', .9); lb.position.set(0, 7, 0); g.add(lb); dyn.add(g);
    }
    // usaha pribadi di sudut barat laut + warung asal
    const wm = warungMini(); wm.position.set(-70, 0, -46); dyn.add(wm); const wl = label('WARUNG', 'asal usul', '#fff', .8); wl.position.set(-70, 4.6, -46); dyn.add(wl);
    BIZ.forEach((b, i) => { const l = lv[i]; if (!l) return; const bb = bizBuilding(b.id, l); bb.position.set(-60 + i * 8.5, 0, -46); dyn.add(bb); const bl = label(b.name, `Lv ${l}`, '#fff', .8); bl.position.set(-60 + i * 8.5, 3 + l * .9, -46); dyn.add(bl); });
  };
  const setNight = n => { nightAmt = n; sun.intensity = 2.2 * (1 - .8 * n); amb.intensity = 1.2 - .8 * n; };
  const dispose = () => { group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { (o.material.map) && o.material.map.dispose(); o.material.dispose(); } }); };
  return { group, sync, setNight, step, dispose, get center() { return CITY_ORIGIN; } };
}
