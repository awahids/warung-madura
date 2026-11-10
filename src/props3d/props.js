import * as THREE from 'three';

/* Prop prosedural low-poly. Satuan ≈ meter, titik asal di tengah-bawah, sumbu Y ke atas.
   Setiap builder mengembalikan THREE.Group. Bisa ditimpa model GLB (lihat loadOverrides). */

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .6, metalness: 0, ...o });
const glass = (color, opacity = .55) => new THREE.MeshPhysicalMaterial({
  color, transparent: true, opacity, roughness: .08, metalness: 0, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false,
});
const shadowed = m => { m.castShadow = true; m.receiveShadow = true; return m; };
const lathe = (pts, material, seg = 40) => shadowed(new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), material));
const cyl = (r, h, material, y = 0, seg = 32) => { const m = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), material)); m.position.y = y + h / 2; return m; };
const torus = (r, tube, material, y) => { const m = shadowed(new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 40), material)); m.rotation.x = Math.PI / 2; m.position.y = y; return m; };

function textTexture(lines, { w = 256, h = 128, bg = '#fff', fg = '#111', accent } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  if (accent) { g.fillStyle = accent; g.fillRect(0, 0, w, h * .18); g.fillRect(0, h * .82, w, h * .18); }
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach(([t, size, dy = 0]) => { g.font = `900 ${size}px "Trebuchet MS",Arial,sans-serif`; g.fillText(t, w / 2, h / 2 + dy); });
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; return tex;
}

export function galon() {
  const g = new THREE.Group();
  g.add(lathe([[0, 0], [.115, 0], [.13, .02], [.13, .27], [.115, .31], [.075, .345], [.05, .37], [.05, .43]], glass('#3a86e0', .62)));
  g.add(lathe([[0, .02], [.1, .03], [.11, .25]], std('#8fc5ff', { transparent: true, opacity: .55 }), 24)); // isi air
  [.09, .14, .2].forEach(y => g.add(torus(.1315, .004, std('#2a6cc0'), y)));
  g.add(cyl(.056, .035, std('#1c5fb4'), .425));
  return g;
}

export function gas() {
  const g = new THREE.Group();
  g.add(lathe([[0, .03], [.075, .03], [.092, .05], [.1, .1], [.1, .17], [.09, .23], [.055, .258], [.04, .262]], std('#8cc63e', { roughness: .4, metalness: .25 })));
  g.add(cyl(.082, .035, std('#5d8a2a', { roughness: .5, metalness: .3 }), 0));          // kaki
  g.add(cyl(.042, .045, std('#9aa0a6', { metalness: .7, roughness: .35 }), .26));           // kolar
  g.add(cyl(.018, .05, std('#c9a227', { metalness: .8, roughness: .3 }), .3));             // katup
  const wheel = torus(.03, .006, std('#b3281e'), .35); wheel.rotation.x = 0; g.add(wheel);
  g.add(torus(.07, .008, std('#9aa0a6', { metalness: .7 }), .27));                          // pengaman
  return g;
}

export function toples() {
  const g = new THREE.Group();
  g.add(lathe([[0, 0], [.1, 0], [.105, .02], [.105, .2], [.095, .225], [.07, .235]], glass('#dfeaf0', .32)));
  g.add(cyl(.075, .03, std('#c0281a', { roughness: .4 }), .235));
  g.add(torus(.03, .008, std('#c0281a'), .27));
  const n = 46, geo = new THREE.CylinderGeometry(.03, .03, .008, 14), inst = new THREE.InstancedMesh(geo, std('#fff'), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * .075;
    e.set(Math.random() * 1.2 - .6, Math.random() * 6, Math.random() * 1.2 - .6); q.setFromEuler(e);
    m.compose(new THREE.Vector3(Math.cos(a) * r, .03 + (i / n) * .17 + Math.random() * .01, Math.sin(a) * r), q, new THREE.Vector3(1, 1, 1));
    inst.setMatrixAt(i, m); inst.setColorAt(i, col.set('#f0d8a0').offsetHSL(0, 0, (Math.random() - .5) * .12));
  }
  inst.castShadow = true; g.add(inst);
  return g;
}

export function bensin() {
  const g = new THREE.Group();
  g.add(lathe([[0, 0], [.04, 0], [.045, .02], [.045, .17], [.04, .2], [.021, .225], [.018, .25]], glass('#f2c230', .78), 24));
  g.add(lathe([[0, .01], [.037, .02], [.038, .17]], std('#f5c542', { transparent: true, opacity: .6 }), 16));
  g.add(cyl(.021, .016, std('#c0281a'), .25, 16));
  const label = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(.0455, .0455, .06, 24, 1, true, -Math.PI / 2.6, Math.PI / 1.3), new THREE.MeshStandardMaterial({ map: textTexture([['BENSIN', 40]], { w: 256, h: 64, bg: '#fff6d8', fg: '#b8431f' }), roughness: .5, side: THREE.DoubleSide })));
  label.position.y = .085; g.add(label);
  return g;
}

export function rakBensin() {
  const g = new THREE.Group(), wood = std('#b5763a', { roughness: .8 });
  const W = .62, D = .26, H = .85;
  [[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2]].forEach(([x, z]) => { const p = shadowed(new THREE.Mesh(new THREE.BoxGeometry(.04, H, .04), wood)); p.position.set(x, H / 2, z); g.add(p); });
  [.04, .34, .62].forEach(y => { const s = shadowed(new THREE.Mesh(new THREE.BoxGeometry(W + .04, .03, D + .04), wood)); s.position.set(0, y, 0); g.add(s); });
  const top = shadowed(new THREE.Mesh(new THREE.BoxGeometry(W + .08, .03, D + .08), std('#8a5424', { roughness: .8 }))); top.position.y = H; g.add(top);
  [.055, .355].forEach(y => { for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) { const b = bensin(); b.position.set(-.255 + i * .102, y, -.06 + j * .12); g.add(b); } });
  return g;
}

export function kardus() {
  const g = new THREE.Group(), card = std('#c99a5b', { roughness: .9 }), tape = std('#e6c58f', { roughness: .4 });
  const body = shadowed(new THREE.Mesh(new THREE.BoxGeometry(.4, .28, .3), card)); body.position.y = .14; g.add(body);
  const t = shadowed(new THREE.Mesh(new THREE.BoxGeometry(.07, .004, .302), tape)); t.position.y = .282; g.add(t);
  const t2 = shadowed(new THREE.Mesh(new THREE.BoxGeometry(.07, .282, .004), tape)); t2.position.set(0, .14, .151); g.add(t2);
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(.16, .12), new THREE.MeshStandardMaterial({ map: textTexture([['AIR', 44, -26], ['MINERAL', 34, 10], ['24 BOTOL', 22, 44]], { w: 256, h: 192, bg: '#e8f3fb', fg: '#1c5fb4', accent: '#2f80d6' }), roughness: .6 }));
  lbl.position.set(.105, .14, .1515); g.add(lbl);
  return g;
}

export function beras() {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(.32, .5, .14, 10, 16, 6), p = geo.attributes.position;
  const sstep = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const nx = x / .16, ny = y / .25;
    z *= 1 + .55 * (1 - ny * ny) * (1 - nx * nx * .35);
    x *= (1 - .42 * sstep(.55, 1, ny)) * (1 + .1 * (1 - ny * ny));
    z *= 1 - .35 * sstep(.75, 1, Math.abs(ny));
    p.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  const body = shadowed(new THREE.Mesh(geo, std('#dcc193', { roughness: .95 }))); body.position.y = .25; g.add(body);
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(.2, .16), new THREE.MeshStandardMaterial({ map: textTexture([['BERAS', 58, -8], ['PREMIUM', 24, 36]], { w: 256, h: 205, bg: '#f6ecd2', fg: '#2f7a2f', accent: '#2f7a2f' }), roughness: .8 }));
  lbl.position.set(0, .26, .114); g.add(lbl);
  const fold = shadowed(new THREE.Mesh(new THREE.BoxGeometry(.2, .03, .06), std('#b89a66', { roughness: 1 }))); fold.position.set(0, .495, 0); g.add(fold);
  return g;
}


/* ---- barang dagangan kecil (dipakai di adegan game) ---- */
export function aqua() {
  const g = new THREE.Group();
  g.add(lathe([[0, 0], [.03, 0], [.033, .01], [.033, .15], [.028, .17], [.015, .19], [.013, .21]], glass('#9fd3ff', .6), 20));
  g.add(cyl(.015, .016, std('#2f80d6'), .208, 12));
  const band = new THREE.Mesh(new THREE.CylinderGeometry(.0335, .0335, .07, 20, 1, true), new THREE.MeshStandardMaterial({ map: textTexture([['AIR', 56, -14], ['MINERAL', 34, 18]], { w: 256, h: 128, bg: '#e8f3fb', fg: '#1c5fb4', accent: '#2f80d6' }), side: THREE.DoubleSide }));
  band.position.y = .075; g.add(band);
  return g;
}
const can = (r, h, tex, topColor = '#c9ced3') => {
  const g = new THREE.Group();
  const body = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(r, r * .97, h, 24), new THREE.MeshStandardMaterial({ map: tex, metalness: .5, roughness: .35 }))); body.position.y = h / 2; g.add(body);
  g.add(cyl(r * .9, .006, std(topColor, { metalness: .8, roughness: .3 }), h, 20));
  return g;
};
export function cola() { return can(.033, .122, textTexture([['COLA', 62, 0]], { w: 256, h: 128, bg: '#c0281a', fg: '#fff' })); }
export function redbull() { return can(.027, .135, textTexture([['ENERGI', 46, 0]], { w: 256, h: 128, bg: '#2d4f8e', fg: '#e7edf5', accent: '#c9ced3' })); }
export function mie() {
  const g = new THREE.Group();
  const cup = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(.046, .032, .09, 24, 1, true), new THREE.MeshStandardMaterial({ map: textTexture([['MIE', 60, -12], ['INSTAN', 36, 28]], { w: 256, h: 128, bg: '#f6c744', fg: '#c0281a', accent: '#c0281a' }), side: THREE.DoubleSide, roughness: .6 })));
  cup.position.y = .045; g.add(cup); g.add(cyl(.032, .004, std('#f6c744'), 0, 20)); g.add(cyl(.048, .008, std('#e9e9e9'), .09, 24));
  return g;
}
export function gelas() {
  const g = new THREE.Group(), m = std('#3fa84f', { roughness: .4 });
  g.add(cyl(.04, .09, m, 0, 20)); const h = torus(.026, .007, m, .05); h.rotation.x = 0; h.position.x = .052; g.add(h);
  g.add(cyl(.034, .004, std('#4a2a12'), .084, 18));
  return g;
}

/** id → { nama, builder, sprite (padanan 2D di atlas), tinggi target (m) untuk model GLB } */
export const PROPS = [
  { id: 'galon', name: 'Galon 19 L', build: galon, sprite: 'galon', h: .43 },
  { id: 'gas', name: 'Gas melon 3 kg', build: gas, sprite: 'gas', h: .36 },
  { id: 'toples', name: 'Toples kerupuk', build: toples, sprite: 'toples', h: .27 },
  { id: 'bensin', name: 'Botol bensin', build: bensin, sprite: 'rakBensin', h: .25 },
  { id: 'rakBensin', name: 'Rak bensin', build: rakBensin, sprite: 'rakBensin', h: .88 },
  { id: 'kardus', name: 'Kardus air mineral', build: kardus, sprite: 'dusAqua', h: .29 },
  { id: 'beras', name: 'Karung beras', build: beras, sprite: 'beras2', h: .51 },
];
