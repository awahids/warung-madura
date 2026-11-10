import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { galon, gas, toples, rakBensin, kardus, beras, aqua, cola, redbull, mie, gelas } from '../props3d/props';
import { woodTex, roofTex, slatTex, asphaltTex, concreteTex, bannerTex, signTex } from './textures';
import { person, personFor } from './people';
import { fillEtalase, fillWallShelf, hangingStrips } from './products';

/* Adegan warung Madura 3D prosedural. Satuan meter: x kanan, y atas, z ke arah jalan. Warung: x∈[-2.2,2.2], z∈[-3.2,0]. */

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .75, ...o });
const sh = m => { m.castShadow = true; m.receiveShadow = true; return m; };
const box = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = sh(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)); m.position.set(x, y, z); return m; };
const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];

export function createWarung(canvas, opts = {}) {
  const game = !!opts.game;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, .05, 90);
  const controls = new OrbitControls(camera, opts.controlsEl || canvas); controls.enableDamping = true; controls.maxPolarAngle = Math.PI * .52;

  // registri objek yang bisa diklik (mode game): act = { type, id? }
  const items = [];
  const reg = (act, obj, { badge = false, proxy = null } = {}) => {
    obj.userData.act = act;
    if (proxy) { const m = new THREE.Mesh(new THREE.BoxGeometry(...proxy.size), new THREE.MeshBasicMaterial()); m.position.set(...(proxy.at || [0, 0, 0])); m.visible = false; obj.add(m); }
    items.push({ act, obj, badge }); return obj;
  };
  const glows = [];      // material yang menyala saat malam: { mat, on, off }
  const lampsNight = []; // lampu yang hanya hidup malam: { light, on }
  const addGlow = (mat, on, off = 0) => { glows.push({ mat, on, off }); return mat; };

  /* ---------- lampu ---------- */
  const hemi = new THREE.HemisphereLight('#cfe6ff', '#8a7a62', 1.5); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff1d6', 3); sun.position.set(5, 8, 7); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 30 }); sun.shadow.bias = -.0004; scene.add(sun);
  const moon = new THREE.DirectionalLight('#7f95ff', 0); moon.position.set(-4, 8, 5); scene.add(moon);
  const neonLight = (x, y, z, on, dist = 9) => { const l = new THREE.PointLight('#ffffff', 0, dist, 2); l.position.set(x, y, z); scene.add(l); lampsNight.push({ light: l, on }); };
  neonLight(-1, 2.6, -1.3, 6); neonLight(1, 2.6, -1.3, 6); neonLight(0, 2.5, .6, 4, 10);

  /* ---------- tanah, jalan ---------- */
  const slab = box(5.2, .12, 4.5, new THREE.MeshStandardMaterial({ map: concreteTex(), roughness: .9 }), 0, -.055, -.95); slab.castShadow = false; scene.add(slab);
  const sidewalk = box(24, .12, 1.5, new THREE.MeshStandardMaterial({ map: concreteTex(), roughness: .9 }), 0, -.06, .75); sidewalk.castShadow = false; scene.add(sidewalk);
  const curb = box(24, .16, .14, std('#bdbab0'), 0, -.06, 1.55); scene.add(curb);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(60, 12), new THREE.MeshStandardMaterial({ map: asphaltTex(), roughness: .95 })); road.rotation.x = -Math.PI / 2; road.position.set(0, -.12, 7.6); road.receiveShadow = true; scene.add(road);
  const dash = new THREE.InstancedMesh(new THREE.BoxGeometry(1.3, .01, .14), new THREE.MeshBasicMaterial({ color: '#e8d9a0' }), 24);
  for (let i = 0; i < 24; i++) dash.setMatrixAt(i, new THREE.Matrix4().makeTranslation(-14 + i * 2.4, -.11, 7.4)); scene.add(dash);

  /* ---------- bangunan warung ---------- */
  const wood = new THREE.MeshStandardMaterial({ map: woodTex('#b97a3e', [3, 2]), roughness: .85 });
  const woodDark = new THREE.MeshStandardMaterial({ map: woodTex('#7a4a22', [2, 2]), roughness: .85 });
  const backWall = box(4.5, 3.0, .08, wood, 0, 1.5, -3.2); scene.add(backWall);
  scene.add(box(.08, 3.0, 3.3, wood, -2.24, 1.5, -1.6), box(.08, 3.0, 3.3, wood, 2.24, 1.5, -1.6));
  scene.add(box(.14, 3.0, .14, woodDark, -2.2, 1.5, .02), box(.14, 3.0, .14, woodDark, 2.2, 1.5, .02));
  scene.add(box(4.5, .6, .14, woodDark, 0, 2.65, .02)); // balok depan
  const roofMat = new THREE.MeshStandardMaterial({ map: roofTex(), roughness: .5, metalness: .2, side: THREE.DoubleSide });
  const roof = sh(new THREE.Mesh(new THREE.BoxGeometry(5.3, .05, 4.5), roofMat)); roof.position.set(0, 3.4, -1.2); roof.rotation.x = .06; scene.add(roof);
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(3.4, .58), new THREE.MeshStandardMaterial({ map: bannerTex(), roughness: .6 })); banner.position.set(0, 2.65, .1); scene.add(banner);
  [['PULSA', -1.9, '#2f80d6'], ['ES TEH', 1.9, '#3f9e58']].forEach(([t, x, c]) => { const s = new THREE.Mesh(new THREE.PlaneGeometry(.5, .19), new THREE.MeshStandardMaterial({ map: signTex(t, c) })); s.position.set(x, 2.65, .1); scene.add(s); });
  // tabung neon + rumah rolling door
  const tubeMat = addGlow(new THREE.MeshBasicMaterial({ color: '#9a9a9a' }), '#ffffff', '#9a9a9a');
  [-.9, .9].forEach(x => { const t = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, 1.4, 10), tubeMat); t.rotation.z = Math.PI / 2; t.position.set(x, 2.85, -1.3); scene.add(t); });
    const housing = sh(new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 4.3, 20), std('#7c848c', { metalness: .6, roughness: .4 }))); housing.rotation.z = Math.PI / 2; housing.position.set(0, 2.27, .1); scene.add(housing);

  // rolling door: pivot di atas; skala y mengecil saat dibuka
  const doorH = 2.2, doorTop = 2.25;
  const doorMat = new THREE.MeshStandardMaterial({ map: slatTex(), roughness: .45, metalness: .65 });
  const door = sh(new THREE.Mesh(new THREE.BoxGeometry(4.3, doorH, .05), doorMat)); door.userData.isDoor = true; scene.add(door);
  const doorBar = sh(new THREE.Mesh(new THREE.BoxGeometry(4.34, .08, .08), std('#4a5058', { metalness: .6 }))); scene.add(doorBar);
  let doorOpen = 1, doorTarget = 1;
  const applyDoor = () => {
    const s = Math.max(.02, 1 - doorOpen), h = doorH * s;
    door.scale.y = s; door.position.set(0, doorTop - h / 2, .12);
    doorBar.position.set(0, doorTop - h + .04, .12); door.visible = doorBar.visible = doorOpen < .985;
  };
  applyDoor();

  /* ---------- meja kasir + etalase ---------- */
  const counter = new THREE.Group(); counter.position.set(0, 0, -.8); scene.add(counter);
  counter.add(box(2.7, .95, .6, woodDark, 0, .475, 0), box(2.8, .05, .72, new THREE.MeshStandardMaterial({ map: woodTex('#c98a4b', [2, 1]), roughness: .6 }), 0, .975, .02));
  const glass = new THREE.MeshPhysicalMaterial({ color: '#cfe8f5', transparent: true, opacity: .22, roughness: .05, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false });
  const caseG = new THREE.Group(); caseG.position.set(-.75, 1.0, 0); counter.add(caseG);
  const cw = 1.2, ch = .55, cd = .5;
  const gl = new THREE.Mesh(new THREE.BoxGeometry(cw, ch, cd), glass); gl.position.y = ch / 2; caseG.add(gl);
  const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(cw, ch, cd)), new THREE.LineBasicMaterial({ color: '#7d878f' })); frame.position.y = ch / 2; caseG.add(frame);
  [.01, .27].forEach(y => caseG.add(box(cw - .02, .012, cd - .02, new THREE.MeshStandardMaterial({ color: '#dfeaf0', transparent: true, opacity: .5 }), 0, y, 0)));
  fillEtalase(caseG, cw);
  // barang & peralatan di meja (koordinat lokal meja; permukaan y=1.0)
  const onCounter = (obj, x, z, sc = 1) => { obj.scale.setScalar(sc); obj.position.set(x, 1.0, z); counter.add(obj); return obj; };
  reg({ type: 'item', id: 'rokok' }, caseG, { badge: true });
  reg({ type: 'item', id: 'aqua' }, onCounter(aqua(), .08, -.16, 1.7), { badge: true, proxy: { size: [.14, .4, .14], at: [0, .2, 0] } });
  reg({ type: 'item', id: 'cola' }, onCounter(cola(), .28, -.16, 1.8), { badge: true, proxy: { size: [.12, .24, .12], at: [0, .11, 0] } });
  reg({ type: 'item', id: 'redbull' }, onCounter(redbull(), .45, -.16, 1.8), { badge: true, proxy: { size: [.11, .26, .11], at: [0, .12, 0] } });
  reg({ type: 'item', id: 'mie' }, onCounter(mie(), .64, -.16, 1.9), { badge: true, proxy: { size: [.2, .2, .2], at: [0, .1, 0] } });
  reg({ type: 'item', id: 'kerupuk' }, onCounter(toples(), 1.1, -.12, 1.3), { badge: true });
  const calc = new THREE.Group(); calc.rotation.y = -.15;
  calc.add(box(.13, .03, .19, std('#3a3d42'), 0, .015, 0)); calc.add(box(.1, .005, .045, std('#9fd0a0'), 0, .032, -.055));
  onCounter(calc, .3, .13, 1.5); reg({ type: 'hitung' }, calc, { proxy: { size: [.22, .1, .3], at: [0, .04, 0] } });
  const phoneScreen = addGlow(new THREE.MeshStandardMaterial({ color: '#111', emissive: '#2f80d6', emissiveIntensity: .4 }), 1.2, .4);
  const phone = new THREE.Group(); phone.add(box(.075, .01, .15, std('#16181c'), 0, .005, 0));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(.062, .13), phoneScreen); scr.rotation.x = -Math.PI / 2; scr.position.set(0, .0105, 0); phone.add(scr);
  onCounter(phone, .62, .15, 1.6); reg({ type: 'hp' }, phone, { proxy: { size: [.14, .08, .24], at: [0, .03, 0] } });
  reg({ type: 'kopi-minum' }, onCounter(gelas(), .92, .13, 1.7), { proxy: { size: [.14, .16, .14], at: [0, .06, 0] } });
  const book = new THREE.Group(); book.add(box(.2, .025, .28, std('#efe2bd'), 0, .0125, 0)); book.add(box(.19, .006, .02, std('#7a4a22'), 0, .028, -.12));
  book.rotation.y = .2; onCounter(book, 1.2, .1, 1.3); reg({ type: 'buku' }, book, { proxy: { size: [.3, .1, .4], at: [0, .03, 0] } });

  /* ---------- rak dinding belakang ---------- */
  const BOARDS = [.3, .82, 1.34, 1.86];
  const shelfUnit = x => {
    const g = new THREE.Group(); g.position.set(x, 0, -3.02); scene.add(g);
    const W = 1.25;
    [-W / 2, W / 2].forEach(px => g.add(box(.05, 2.3, .34, woodDark, px, 1.15, 0)));
    BOARDS.forEach(y => g.add(box(W + .04, .035, .36, wood, 0, y, 0)));
    fillWallShelf(scene, x, BOARDS, W);
  };
  shelfUnit(-1.45); shelfUnit(-.1);

  // kulkas minuman (biru)
  const fridge = new THREE.Group(); fridge.position.set(1.7, 0, -2.7); scene.add(fridge);
  const fMat = std('#1f66b5', { roughness: .4, metalness: .2 });
  fridge.add(box(.95, 1.9, .05, fMat, 0, .95, -.335), box(.05, 1.9, .72, fMat, -.45, .95, 0), box(.05, 1.9, .72, fMat, .45, .95, 0), box(.95, .06, .72, fMat, 0, 1.87, 0), box(.95, .06, .72, fMat, 0, .03, 0));
  [.55, .85, 1.15, 1.45].forEach(y => fridge.add(box(.85, .015, .6, std('#dfe6ea', { metalness: .3 }), 0, y, 0)));
  const fGlass = new THREE.Mesh(new THREE.PlaneGeometry(.8, 1.6), new THREE.MeshPhysicalMaterial({ color: '#dff0ff', transparent: true, opacity: .18, roughness: .05, clearcoat: 1 })); fGlass.position.set(0, .95, .365); fridge.add(fGlass);
  const fLight = addGlow(new THREE.MeshBasicMaterial({ color: '#c3cbd0' }), '#ffffff', '#c3cbd0');
  const fBack = new THREE.Mesh(new THREE.PlaneGeometry(.85, 1.8), fLight); fBack.position.set(0, .95, -.305); fridge.add(fBack);
  const cans = new THREE.InstancedMesh(new THREE.CylinderGeometry(.033, .033, .12, 12), std('#ffffff', { metalness: .5, roughness: .35 }), 5 * 7 * 2);
  { let n = 0; const m = new THREE.Matrix4(), c = new THREE.Color(); for (let r = 0; r < 5; r++) for (let i = 0; i < 7; i++) for (let j = 0; j < 2; j++) { m.makeTranslation(-.32 + i * .107, .62 + r * .3 - (r === 4 ? .0 : 0) + .06, -.18 + j * .12); cans.setMatrixAt(n, m); cans.setColorAt(n, c.set(pick(['#c0281a', '#e6e8ea', '#2f80d6', '#3f9e58']))); n++; } }
  fridge.add(cans);
  fridge.add(box(.03, .5, .03, std('#bcc5cc', { metalness: .8 }), .38, .95, .39));

  // barang lantai: karung beras, galon, gas, kardus
  const place = (obj, x, y, z, s = 1, ry = 0) => { obj.scale.setScalar(s); obj.position.set(x, y, z); obj.rotation.y = ry; scene.add(obj); return obj; };
  [[-1.9, 0, -2.4, .3], [-1.45, 0, -2.45, -.15], [-1.7, .62, -2.42, .1]].forEach(([x, y, z, ry]) => place(beras(), x, y, z, 1.25, ry));
  [[.35, -2.45], [.7, -2.5], [.52, -2.2]].forEach(([x, z]) => place(galon(), x, 0, z, 1.2));
  [[-.5, -2.45], [-.2, -2.5], [-.35, -2.2]].forEach(([x, z]) => place(gas(), x, 0, z, 1.3));
  place(kardus(), 1.0, 0, -1.9, 1.1, .2); place(kardus(), 1.0, .31, -1.9, 1.1, -.1);

  // renteng gantung di balok depan: kiri = kopi sachet, kanan = keripik/snack (sachet 3D menggembung)
  const mkRenteng = (id, kind, x0) => {
    const g = hangingStrips(kind, x0); scene.add(g);
    return reg({ type: 'item', id }, g, { badge: true, proxy: { size: [1.6, .85, .3], at: [x0 + .73, 1.95, -.18] } });
  };
  mkRenteng('kopi', 'kopi', -1.95); mkRenteng('snack', 'snack', .45);
  // spanduk promo di tiang kiri + kardus kiriman kurir (muncul saat barang tiba)
  const promoSign = new THREE.Group(); promoSign.position.set(-2.55, 1.7, .55); promoSign.rotation.y = Math.PI / 2;
  promoSign.add(new THREE.Mesh(new THREE.PlaneGeometry(.55, .4), new THREE.MeshStandardMaterial({ map: signTex('PROMO', '#c0281a', '#ffe9a0') })));
  scene.add(promoSign); reg({ type: 'promo' }, promoSign, { proxy: { size: [.6, .45, .2] } });
  const paket = new THREE.Group(); paket.position.set(-1.0, 0, .95); paket.visible = false;
  const pk = kardus(); pk.scale.setScalar(1.3); paket.add(pk); scene.add(paket); reg({ type: 'paket' }, paket);

  /* ---------- area luar ---------- */
  const rak = place(rakBensin(), -1.7, 0, .6, 1.15, .1); reg({ type: 'item', id: 'bensin' }, rak, { badge: true });
  // meja display di teras (barang jualan galon/gas/beras: terlihat & bisa diklik dari balik meja kasir)
  const displayTable = (x, z, w) => {
    const t = new THREE.Group(); t.position.set(x, 0, z); scene.add(t);
    t.add(box(w, .05, .55, wood, 0, .6, 0)); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => t.add(box(.05, .6, .05, woodDark, a * (w / 2 - .05), .3, b * .22)));
    t.add(box(w - .1, .04, .5, woodDark, 0, .22, 0));
  };
  displayTable(1.75, .5, 1.1); displayTable(-.95, .5, 1.0);
  reg({ type: 'item', id: 'galon' }, place(galon(), 1.55, .625, .5, 1.2), { badge: true });
  reg({ type: 'item', id: 'gas' }, place(gas(), 2.0, .625, .5, 1.3), { badge: true });
  reg({ type: 'item', id: 'beras' }, place(beras(), -1.2, .625, .5, 1.2, .2), { badge: true });
  reg({ type: 'item', id: 'beras' }, place(beras(), -.7, .625, .5, 1.2, -.2));
  const bench = new THREE.Group(); bench.position.set(.45, 0, .7); scene.add(bench);
  bench.add(box(1.4, .05, .36, wood, 0, .45, 0)); [-.6, .6].forEach(x => bench.add(box(.06, .45, .3, woodDark, x, .225, 0))); bench.add(box(1.4, .3, .04, wood, 0, .72, -.16));
  const stool = new THREE.Group(); stool.position.set(2.45, 0, .85); scene.add(stool);
  stool.add(at(sh(new THREE.Mesh(new THREE.CylinderGeometry(.16, .15, .04, 20), std('#d63b2f', { roughness: .4 }))), 0, .42, 0));
  [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([a, b]) => stool.add(box(.03, .4, .03, std('#d63b2f', { roughness: .4 }), a * .09, .2, b * .09)));
  const bin = sh(new THREE.Mesh(new THREE.CylinderGeometry(.2, .17, .6, 16), std('#2f9e44', { roughness: .5 }))); bin.position.set(-2.7, .3, .55); scene.add(bin);

  /* ---------- lingkungan ---------- */
  const bColors = ['#c9b89a', '#a9b4a0', '#b8a6a0', '#9fb0b8', '#c8a98a'];
  const winMat = addGlow(new THREE.MeshBasicMaterial({ color: '#8d99a3' }), '#ffe9a0', '#8d99a3');
  const building = (x, z, w, h, d, c) => scene.add(box(w, h, d, std(c, { roughness: .95 }), x, h / 2, z));
  building(-4.4, -1.6, 3.2, 3.4, 3.6, '#b9a58a'); building(4.5, -1.6, 3.2, 3.0, 3.6, '#a8b3a2');
  for (let i = 0; i < 9; i++) building(-26 + i * 6.5, 20 + (i % 2) * 2, rnd(4, 6), rnd(5, 11), 5, pick(bColors));
  const wins = new THREE.InstancedMesh(new THREE.PlaneGeometry(.7, .9), winMat, 90); { const m = new THREE.Matrix4(); for (let i = 0; i < 90; i++) { m.makeTranslation(-26 + (i % 30) * 1.7, 2 + Math.floor(i / 30) * 2.6, 17.4); wins.setMatrixAt(i, m); } } scene.add(wins);
  const tree = new THREE.Group(); tree.position.set(3.6, 0, .9); scene.add(tree);
  tree.add(at(sh(new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, 1.6, 10), std('#6b4a2a'))), 0, .8, 0));
  [[0, 2.1, 0, .7], [.4, 1.8, .1, .5], [-.35, 1.85, -.1, .5]].forEach(([x, y, z, r]) => { const f = sh(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), std('#3f8a3a', { flatShading: true }))); f.position.set(x, y, z); tree.add(f); });
  // lampu jalan
  const lamp = new THREE.Group(); lamp.position.set(-3.2, 0, 1.25); scene.add(lamp);
  lamp.add(at(sh(new THREE.Mesh(new THREE.CylinderGeometry(.05, .07, 4.4, 10), std('#6d747a', { metalness: .5 }))), 0, 2.2, 0));
  lamp.add(box(.9, .06, .06, std('#6d747a', { metalness: .5 }), .4, 4.4, 0));
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.1, 12, 10), addGlow(new THREE.MeshBasicMaterial({ color: '#9a9a9a' }), '#ffe2a0', '#9a9a9a')); bulb.position.set(.8, 4.32, 0); lamp.add(bulb);
  const lampLight = new THREE.PointLight('#ffd9a0', 0, 12, 2); lampLight.position.set(-2.4, 4.2, 1.25); scene.add(lampLight); lampsNight.push({ light: lampLight, on: 30 });

  /* ---------- orang ---------- */
  const demo = [];
  if (!game) {
    const ojol = person({ shirt: '#2fa84f', pants: '#2d5fa8', helmet: '#2fa84f' }); ojol.position.set(.45, 0, .85); ojol.rotation.y = .1; scene.add(ojol);
    const ibu = person({ shirt: '#d9729a', pants: '#8a5a8a', skin: '#b87a50', hair: '#222' }); ibu.scale.setScalar(.93); ibu.position.set(-.75, 0, 1.0); ibu.rotation.y = -.25; scene.add(ibu);
    demo.push(ojol, ibu);
  }
  const penjaga = person({ shirt: '#a4262c', pants: '#3a3a4a', skin: '#b98258' }); penjaga.position.set(.55, 0, -1.55); penjaga.rotation.y = Math.PI; scene.add(penjaga);
  const peci = sh(new THREE.Mesh(new THREE.CylinderGeometry(.1, .11, .09, 16), std('#151515'))); peci.position.y = 1.67; penjaga.add(peci);
  const people = [...demo, penjaga];
  scene.traverse(o => { if (o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry') o.castShadow = false; });

  /* ---------- siang / malam / hujan ---------- */
  let night = false;
  const fog = new THREE.Fog('#9ccbf0', 18, 60); scene.fog = fog;
  const C = { dayBg: new THREE.Color('#9ccbf0'), nightBg: new THREE.Color('#070d24'), dayHemi: new THREE.Color('#cfe6ff'), nightHemi: new THREE.Color('#3d4c8a'), dayGnd: new THREE.Color('#8a7a62'), nightGnd: new THREE.Color('#1a1612') };
  const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  /** n: 0 siang … 1 malam; sky: warna langit css (opsional); rain: bool */
  const setLook = ({ night: n = 0, sky = null, rain = false } = {}) => {
    night = n > .5;
    const bg = sky ? new THREE.Color(sky) : C.dayBg.clone().lerp(C.nightBg, n); scene.background = bg; fog.color.copy(bg);
    fog.near = 18 - 8 * n - (rain ? 6 : 0); fog.far = 60 - 15 * n - (rain ? 25 : 0);
    hemi.color.copy(C.dayHemi).lerp(C.nightHemi, n); hemi.groundColor.copy(C.dayGnd).lerp(C.nightGnd, n); hemi.intensity = (1.5 - 1.15 * n) * (rain ? .75 : 1);
    sun.intensity = 3 * (1 - n) * (rain ? .45 : 1); moon.intensity = .5 * n;
    const on = smooth(.25, .75, n);
    lampsNight.forEach(l => { l.light.intensity = l.on * on; });
    glows.forEach(g => { const v = n > .45 ? g.on : g.off; if (g.mat.emissive) g.mat.emissiveIntensity = typeof g.on === 'number' ? (g.off + (g.on - g.off) * on) : 0; else g.mat.color.set(v); });
    renderer.toneMappingExposure = 1.1 + .15 * n;
    rainLines.visible = rain;
  };
  const setNight = v => setLook({ night: v ? 1 : 0 });
  // hujan
  const RN = 700, rainPos = new Float32Array(RN * 6);
  for (let i = 0; i < RN; i++) { const x = rnd(-9, 9), y = rnd(0, 7), z = rnd(-3, 11); rainPos.set([x, y, z, x - .05, y - .35, z], i * 6); }
  const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rainLines = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: '#b9cdf0', transparent: true, opacity: .45 })); rainLines.visible = false; rainLines.frustumCulled = false; scene.add(rainLines);
  const stepRain = dt => { const a = rainGeo.attributes.position, p = a.array; for (let i = 0; i < RN; i++) { const o = i * 6; let y = p[o + 1] - 13 * dt; if (y < 0) y += 7; p[o + 1] = y; p[o + 4] = y - .35; } a.needsUpdate = true; };
  setLook({ night: 0 });

  /* ---------- kamera ---------- */
  const VIEWS = {
    luar: { pos: [4.8, 1.9, 6.4], tgt: [0, 1.1, -.6], fp: false },
    pembeli: { pos: [0, 1.6, 4.6], tgt: [0, 1.3, -1.4], fp: false },
    penjaga: { pos: [.1, 1.72, -2.25], tgt: [.1, 1.25, 1], fp: true },
  };
  let tween = null, view = 'luar';
  const applyLimits = fp => {
    controls.enablePan = !fp; controls.enableZoom = !fp; controls.rotateSpeed = fp ? -.35 : 1;
    controls.minDistance = fp ? .05 : 1.5; controls.maxDistance = fp ? .05 : 16;
  };
  const setView = (name, instant = false) => {
    const v = VIEWS[name]; if (!v) return; view = name; penjaga.visible = !v.fp; camera.fov = v.fp ? 64 : 50; camera.updateProjectionMatrix();
    const from = { p: camera.position.clone(), t: controls.target.clone() };
    let to = { p: new THREE.Vector3(...v.pos), t: new THREE.Vector3(...v.tgt) };
    if (v.fp) { const dir = to.t.clone().sub(to.p).normalize(); to = { p: to.p, t: to.p.clone().add(dir.multiplyScalar(.05)) }; }
    controls.minDistance = .01; controls.maxDistance = 100; controls.enablePan = false;
    if (instant) { camera.position.copy(to.p); controls.target.copy(to.t); applyLimits(v.fp); return; }
    tween = { from, to, t: 0, t0: performance.now(), fp: v.fp };
  };
  setView('luar', true);

  /* ---------- interaksi halaman demo: klik pintu ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null;
  ray.params.Line.threshold = .01; // bawaan 1 m membuat bingkai etalase menangkap klik di sekitarnya
  if (!game) {
    canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
    canvas.addEventListener('pointerup', e => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
      const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      if ((ray.intersectObjects([door, housing, banner], false).length && door.visible) || (doorOpen > .98 && ray.intersectObject(housing, false).length)) { doorTarget = doorTarget > .5 ? 0 : 1; api.onDoor && api.onDoor(doorTarget > .5); }
    });
  }

  /* ---------- mode game: pilih objek, sorotan, proyeksi, kerumunan ---------- */
  const roots = items.map(i => i.obj);
  /** Objek interaktif di bawah titik ndc (−1..1), atau null. */
  const pickItem = (nx, ny) => {
    ndc.set(nx, ny); ray.setFromCamera(ndc, camera);
    for (const h of ray.intersectObjects(roots, true)) { let o = h.object; while (o && !o.userData.act) o = o.parent; if (o) return o; }
    return null;
  };
  let hot = null; const saved = new Map();
  const highlight = obj => {
    if (obj === hot) return;
    saved.forEach((v, m) => { m.emissive.copy(v.c); m.emissiveIntensity = v.i; }); saved.clear(); hot = obj;
    if (obj) obj.traverse(o => { const m = o.material; if (o.isMesh && m && m.emissive && !saved.has(m)) { saved.set(m, { c: m.emissive.clone(), i: m.emissiveIntensity }); m.emissive.set('#6a5400'); m.emissiveIntensity = .9; } });
  };
  const _v = new THREE.Vector3();
  const project = v3 => { _v.copy(v3).project(camera); return { x: (_v.x * .5 + .5) * 1280, y: (-_v.y * .5 + .5) * 720, z: _v.z }; };
  const anchorOf = ent => {
    if (!ent.anchor) { const b = new THREE.Box3().setFromObject(ent.obj); ent.anchor = new THREE.Vector3((b.min.x + b.max.x) / 2, b.max.y + .05, (b.min.z + b.max.z) / 2); }
    return ent.anchor;
  };
  /** Posisi layar lencana stok untuk tiap barang yang punya lencana. */
  const badges = () => items.filter(i => i.badge && i.act.type === 'item').map(i => ({ id: i.act.id, ...project(anchorOf(i)) })).filter(b => b.z < 1 && b.x > 0 && b.x < 1280 && b.y > 0 && b.y < 720);

  const crowd = new Map();
  const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
  /** list: [{ key, type, x, z, moving, dir }] — buat/hapus/gerakkan orang sesuai logika game. */
  const syncPeople = (list, t) => {
    const seen = new Set();
    for (const it of list) {
      let e = crowd.get(it.key);
      if (!e) { const g = personFor(it.type); g.position.set(it.x, 0, it.z); scene.add(g); e = { g, ang: it.moving ? (it.dir > 0 ? -Math.PI / 2 : Math.PI / 2) : 0 }; crowd.set(it.key, e); }
      seen.add(it.key);
      const want = it.moving ? (it.dir > 0 ? -Math.PI / 2 : Math.PI / 2) : (it.turn ?? 0);
      e.ang += angDiff(e.ang, want) * .18; e.g.rotation.y = e.ang;
      e.g.position.x = it.x; e.g.position.z = it.z;
      const { legs, arms, head } = e.g.userData, ph = t * 9 + it.key.length;
      if (it.moving) { legs[0].rotation.x = Math.sin(ph) * .55; legs[1].rotation.x = -Math.sin(ph) * .55; arms[0].rotation.x = -Math.sin(ph) * .4; arms[1].rotation.x = Math.sin(ph) * .4; e.g.position.y = Math.abs(Math.sin(ph)) * .03; }
      else { legs[0].rotation.x = legs[1].rotation.x = arms[0].rotation.x = arms[1].rotation.x = 0; e.g.position.y = Math.abs(Math.sin(t * 1.6 + it.key.length)) * .004; head.rotation.y = Math.sin(t * .7 + it.key.length) * .25; }
      e.head = new THREE.Vector3(it.x, 1.95, it.z);
    }
    for (const [k, e] of crowd) if (!seen.has(k)) { scene.remove(e.g); crowd.delete(k); }
  };
  const headPos = key => (crowd.get(key) || {}).head || null;

  /* ---------- loop ---------- */
  const resizeTo = (w, h) => { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  const resize = () => { const r = canvas.parentElement.getBoundingClientRect(); resizeTo(r.width, r.height); };
  let ro = null; if (!game) { ro = new ResizeObserver(resize); ro.observe(canvas.parentElement); resize(); }
  const clock = new THREE.Clock(); let raf = 0, alive = true;
  const step = (dt, t) => {
    if (!game) { doorOpen += (doorTarget - doorOpen) * Math.min(1, dt * 3.2); if (Math.abs(doorTarget - doorOpen) < .002) doorOpen = doorTarget; applyDoor(); }
    if (tween) {
      tween.t = Math.min(1, (performance.now() - tween.t0) / 900); const e = tween.t * tween.t * (3 - 2 * tween.t);
      camera.position.lerpVectors(tween.from.p, tween.to.p, e); controls.target.lerpVectors(tween.from.t, tween.to.t, e);
      if (tween.t >= 1) { applyLimits(tween.fp); tween = null; }
    }
    people.forEach((p, i) => { p.position.y = Math.abs(Math.sin(t * 1.6 + i)) * .004; p.userData.head.rotation.y = Math.sin(t * .7 + i * 2) * .25; });
    if (rainLines.visible) stepRain(dt);
    controls.update(); renderer.render(scene, camera);
  };
  const loop = () => { if (!alive) return; const dt = Math.min(clock.getDelta(), .05); step(dt, clock.elapsedTime); raf = requestAnimationFrame(loop); };
  if (!game) loop();

  const api = {
    onDoor: null,
    setNight, setLook, get night() { return night; },
    setDoor(open) { doorTarget = open ? 1 : 0; },
    setDoorFraction(f) { doorOpen = doorTarget = f; applyDoor(); },
    get doorOpen() { return doorTarget > .5; },
    setView, get view() { return view; },
    setAutoRotate(v) { controls.autoRotate = v; },
    setPaket(v) { paket.visible = v; },
    controls, items, pick: pickItem, highlight, project, badges, syncPeople, headPos, resize: resizeTo, frame: step,
    triangles: () => renderer.info.render.triangles,
    rakBensin: rak,
    dispose() { alive = false; cancelAnimationFrame(raf); ro && ro.disconnect(); controls.dispose(); scene.traverse(o => { o.geometry && o.geometry.dispose(); }); renderer.dispose(); },
  };
  return api;
}
