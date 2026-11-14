import * as THREE from 'three';

/* Prop prosedural low-poly. Satuan ≈ meter, titik asal di tengah-bawah, sumbu Y ke atas.
   Setiap builder mengembalikan THREE.Group. Bisa ditimpa model GLB (lihat loadOverrides). */

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .6, metalness: 0, ...o });
const glass = (color, opacity = .55) => new THREE.MeshPhysicalMaterial({
  color, transparent: true, opacity, roughness: .08, metalness: 0, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false,
});
const shadowed = m => { m.castShadow = true; m.receiveShadow = true; return m; };
const lathe = (pts, material, seg = 24) => shadowed(new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), material));
const cyl = (r, h, material, y = 0, seg = 32) => { const m = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), material)); m.position.y = y + h / 2; return m; };
const torus = (r, tube, material, y) => { const m = shadowed(new THREE.Mesh(new THREE.TorusGeometry(r, tube, 5, 22), material)); m.rotation.x = Math.PI / 2; m.position.y = y; return m; };

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
  const n = 26, geo = new THREE.CylinderGeometry(.03, .03, .008, 9), inst = new THREE.InstancedMesh(geo, std('#fff'), n);
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
  g.add(lathe([[0, 0], [.04, 0], [.045, .02], [.045, .17], [.04, .2], [.021, .225], [.018, .25]], glass('#f2c230', .78), 12));
  g.add(lathe([[0, .01], [.037, .02], [.038, .17]], std('#f5c542', { transparent: true, opacity: .6 }), 10));
  g.add(cyl(.021, .016, std('#c0281a'), .25, 16));
  const label = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(.0455, .0455, .06, 12, 1, true, -Math.PI / 2.6, Math.PI / 1.3), new THREE.MeshStandardMaterial({ map: textTexture([['BENSIN', 40]], { w: 256, h: 64, bg: '#fff6d8', fg: '#b8431f' }), roughness: .5, side: THREE.DoubleSide })));
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
  const geo = new THREE.BoxGeometry(.32, .5, .14, 7, 10, 4), p = geo.attributes.position;
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

/* ---- sembako tambahan: minyak, telur, gula, sabun, susu kental manis, teh ---- */
export function minyak() {
  const g = new THREE.Group();
  g.add(lathe([[0, 0], [.036, 0], [.04, .012], [.04, .15], [.032, .18], [.019, .2], [.019, .225], [0, .225]], std('#e0a81c', { roughness: .25, transparent: true, opacity: .92 }), 14));
  g.add(cyl(.02, .02, std('#c0281a'), .222, 12));
  const label = new THREE.Mesh(new THREE.CylinderGeometry(.0405, .0405, .075, 14, 1, true), new THREE.MeshStandardMaterial({ map: textTexture([['MINYAK', 46, -6], ['GORENG', 34, 30]], { w: 256, h: 128, bg: '#fff4cf', fg: '#b8731a', accent: '#e0a81c' }), side: THREE.DoubleSide, roughness: .5 }));
  label.position.y = .085; g.add(label);
  return g;
}
export function telur() {
  const g = new THREE.Group();
  g.add(shadowed(new THREE.Mesh(new THREE.BoxGeometry(.3, .02, .32), std('#c9a36a', { roughness: .95 }))));        // alas karton
  for (const dz of [-.16, .16]) g.add(at3(shadowed(new THREE.Mesh(new THREE.BoxGeometry(.3, .045, .012), std('#b08850', { roughness: .95 }))), 0, .03, dz));
  for (const dx of [-.15, .15]) g.add(at3(shadowed(new THREE.Mesh(new THREE.BoxGeometry(.012, .045, .32), std('#b08850', { roughness: .95 }))), dx, .03, 0));
  const egg = new THREE.SphereGeometry(1, 8, 6), inst = new THREE.InstancedMesh(egg, std('#f3e6cc', { roughness: .55 }), 30), m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
  for (let r = 0; r < 5; r++) for (let k = 0; k < 6; k++) {
    const i = r * 6 + k; q.setFromEuler(new THREE.Euler(Math.random() * .2 - .1, Math.random() * 6, Math.random() * .2 - .1));
    m.compose(new THREE.Vector3(-.12 + k * .048, .05, -.125 + r * .062), q, new THREE.Vector3(.019, .026, .019)); inst.setMatrixAt(i, m);
    inst.setColorAt(i, c.set(Math.random() < .3 ? '#e3b98a' : '#f3e6cc'));
  }
  inst.castShadow = false; g.add(inst);
  return g;
}
const at3 = (m, x, y, z) => { m.position.set(x, y, z); return m; };
export function gula() {
  // kantong plastik bening 1 kg: karung bulat gemuk dengan leher terikat pita, butiran gula terlihat, label biru di kedua sisi
  const g = new THREE.Group();
  const prof = [[0, 0], [.045, .004], [.07, .03], [.078, .075], [.07, .12], [.045, .155], [.018, .176], [.014, .19]].map(([r, y]) => new THREE.Vector2(r, y));
  const bag = shadowed(new THREE.Mesh(new THREE.LatheGeometry(prof, 18), new THREE.MeshStandardMaterial({ color: '#f3f7fb', roughness: .22, transparent: true, opacity: .6, side: THREE.DoubleSide, depthWrite: false })));
  bag.scale.z = .6; g.add(bag);
  const sugar = shadowed(new THREE.Mesh(new THREE.SphereGeometry(1, 12, 9), new THREE.MeshStandardMaterial({ color: '#fffaf0', roughness: .85, emissive: '#2a2620', emissiveIntensity: .35 })));
  sugar.scale.set(.062, .068, .036); sugar.position.set(0, .075, 0); g.add(sugar);
  const tx = textTexture([['GULA', 62, -8], ['PASIR · 1 KG', 24, 36]], { w: 256, h: 128, bg: '#2f80d6', fg: '#fff', accent: '#e8f1ff' });
  const lm = new THREE.MeshStandardMaterial({ map: tx, roughness: .5 });
  [1, -1].forEach(d => { const l = new THREE.Mesh(new THREE.PlaneGeometry(.1, .05), lm); l.position.set(0, .08, d * .047); l.rotation.y = d > 0 ? 0 : Math.PI; g.add(l); });
  const tie = new THREE.Mesh(new THREE.TorusGeometry(.02, .005, 6, 14), std('#d62f2f')); tie.rotation.x = Math.PI / 2; tie.position.y = .168; g.add(tie);
  const frill = shadowed(new THREE.Mesh(new THREE.ConeGeometry(.035, .04, 10, 1, true), new THREE.MeshStandardMaterial({ color: '#f6f6f2', roughness: .4, transparent: true, opacity: .7, side: THREE.DoubleSide, depthWrite: false })));
  frill.position.y = .205; frill.scale.z = .5; g.add(frill);
  return g;
}
export function sabun() {
  // batang sabun oval berwarna merah muda dengan cetakan lingkaran dan busa — jelas berbeda dari kotak
  const g = new THREE.Group();
  const bar = shadowed(new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), new THREE.MeshStandardMaterial({ color: '#f29ab2', roughness: .28, emissive: '#5a1a2a', emissiveIntensity: .15 })));
  bar.scale.set(.052, .019, .033); bar.position.y = .017; g.add(bar);
  const emb = shadowed(new THREE.Mesh(new THREE.TorusGeometry(.016, .0035, 5, 16), std('#e0708f', { roughness: .4 }))); emb.rotation.x = Math.PI / 2; emb.position.set(0, .034, 0); emb.scale.set(1.3, 1, 1); g.add(emb);
  const foam = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .15, transparent: true, opacity: .82 });
  [[-.02, .04, .006, .009], [.015, .043, -.008, .007], [.028, .037, .012, .006], [-.005, .047, -.012, .0055], [.002, .037, .014, .005]].forEach(([x, y, z, r]) => { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), foam); b.position.set(x, y, z); g.add(b); });
  return g;
}
export function susu() {
  const g = new THREE.Group(), tx = textTexture([['SUSU', 54, -10], ['KENTAL', 30, 30]], { w: 256, h: 128, bg: '#2d6db5', fg: '#fff', accent: '#e8eef5' });
  g.add(at3(shadowed(new THREE.Mesh(new THREE.CylinderGeometry(.034, .034, .095, 14), new THREE.MeshStandardMaterial({ map: tx, metalness: .35, roughness: .4 }))), 0, .0475, 0));
  g.add(cyl(.034, .004, std('#c9ced3', { metalness: .8, roughness: .3 }), .095, 14));
  return g;
}
export function teh() {
  const g = new THREE.Group(), tx = textTexture([['TEH', 64, -8], ['CELUP', 34, 32]], { w: 256, h: 192, bg: '#c0281a', fg: '#fff', accent: '#f4e2a0' });
  g.add(at3(shadowed(new THREE.Mesh(new THREE.BoxGeometry(.075, .11, .042), [std('#a81f14'), std('#a81f14'), std('#c0281a'), std('#a81f14'), new THREE.MeshStandardMaterial({ map: tx, roughness: .55 }), std('#a81f14')])), 0, .055, 0));
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
