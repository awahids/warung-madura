import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { galon, gas, toples, rakBensin, kardus, beras, aqua, cola, redbull, mie, gelas, bensin } from '../props3d/props';
import { woodTex, roofTex, slatTex, asphaltTex, concreteTex, bannerTex, signTex, reliefTex } from './textures';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { person, personFor, makeBag, makeBill, ARM } from './people';
import { createAmbience } from './ambience';
import { fillEtalase, fillWallShelf, hangingStrips, pouchGeometry, kopiTex, snackTex, cigTex } from './products';

/* Adegan warung Madura 3D prosedural. Satuan meter: x kanan, y atas, z ke arah jalan. Warung: x∈[-2.2,2.2], z∈[-3.2,0]. */

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .75, ...o });
const sh = m => { m.castShadow = true; m.receiveShadow = true; return m; };
const box = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = sh(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)); m.position.set(x, y, z); return m; };
const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];

/** Faktor pelunakan per frame yang konsisten di FPS berapa pun (r = faktor pada 60 fps). */
const kdt = (r, dt) => 1 - Math.pow(1 - r, Math.min(6, dt * 60));

export function createWarung(canvas, opts = {}) {
  const game = !!opts.game;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  // pantulan lingkungan (IBL) untuk material PBR: kaca, logam, plastik, kulit tampak nyata
  { const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .55; pm.dispose(); }
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
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 30 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .02; sun.shadow.radius = 3; scene.add(sun);
  const moon = new THREE.DirectionalLight('#7f95ff', 0); moon.position.set(-4, 8, 5); scene.add(moon);
  const neonLight = (x, y, z, on, dist = 9) => { const l = new THREE.PointLight('#ffffff', 0, dist, 2); l.position.set(x, y, z); scene.add(l); lampsNight.push({ light: l, on }); };
  neonLight(-1, 2.6, -1.3, 6); neonLight(1, 2.6, -1.3, 6); neonLight(0, 2.5, .6, 4, 10);

  /* ---------- tanah, jalan ---------- */
  const slab = box(5.2, .12, 4.5, new THREE.MeshStandardMaterial({ map: concreteTex(), bumpMap: reliefTex('concrete'), bumpScale: 1.4, roughness: .9 }), 0, -.055, -.95); slab.castShadow = false; scene.add(slab);
  const sidewalk = box(24, .12, 1.5, new THREE.MeshStandardMaterial({ map: concreteTex(), bumpMap: reliefTex('concrete'), bumpScale: 1.4, roughness: .9 }), 0, -.06, .75); sidewalk.castShadow = false; scene.add(sidewalk);
  const curb = box(24, .16, .14, std('#bdbab0'), 0, -.06, 1.55); scene.add(curb);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(60, 12), new THREE.MeshStandardMaterial({ map: asphaltTex(), bumpMap: reliefTex('asphalt', [10, 4]), bumpScale: 2, roughness: .95 })); road.rotation.x = -Math.PI / 2; road.position.set(0, -.12, 7.6); road.receiveShadow = true; scene.add(road);

  /* ---------- bangunan warung ---------- */
  const wood = new THREE.MeshStandardMaterial({ map: woodTex('#b97a3e', [3, 2]), bumpMap: reliefTex('wood', [3, 2]), bumpScale: 1.2, roughness: .8 });
  const woodDark = new THREE.MeshStandardMaterial({ map: woodTex('#7a4a22', [2, 2]), bumpMap: reliefTex('wood', [2, 2]), bumpScale: 1.2, roughness: .78 });
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
  const doorMat = new THREE.MeshStandardMaterial({ map: slatTex(), bumpMap: reliefTex('metal', [8, 4]), bumpScale: 1.6, roughness: .38, metalness: .8 });
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
  const gl = new THREE.Mesh(new THREE.BoxGeometry(cw, ch, cd), glass); gl.position.y = ch / 2; gl.raycast = () => {}; caseG.add(gl);   // kaca tidak menangkap klik
  const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(cw, ch, cd)), new THREE.LineBasicMaterial({ color: '#7d878f' })); frame.position.y = ch / 2; caseG.add(frame);
  [.01, .27].forEach(y => caseG.add(box(cw - .02, .012, cd - .02, new THREE.MeshStandardMaterial({ color: '#dfeaf0', transparent: true, opacity: .5 }), 0, y, 0)));
  fillEtalase(caseG, cw);
  // barang & peralatan di meja (koordinat lokal meja; permukaan y=1.0)
  const onCounter = (obj, x, z, sc = 1) => { obj.scale.setScalar(sc); obj.position.set(x, 1.0, z); counter.add(obj); return obj; };
  reg({ type: 'item', id: 'rokok' }, caseG, { badge: true });
  reg({ type: 'item', id: 'aqua' }, onCounter(aqua(), .52, -.16, 1.7), { badge: true, proxy: { size: [.08, .24, .08], at: [0, .11, 0] } });   // ukuran lokal (sebelum skala induk)
  reg({ type: 'item', id: 'cola' }, onCounter(cola(), .68, -.16, 1.8), { badge: true, proxy: { size: [.075, .13, .075], at: [0, .065, 0] } });
  reg({ type: 'item', id: 'redbull' }, onCounter(redbull(), .84, -.16, 1.8), { badge: true, proxy: { size: [.065, .14, .065], at: [0, .07, 0] } });
  reg({ type: 'item', id: 'mie' }, onCounter(mie(), 1.02, -.16, 1.9), { badge: true, proxy: { size: [.11, .11, .11], at: [0, .05, 0] } });
  reg({ type: 'item', id: 'kerupuk' }, onCounter(toples(), 1.3, -.1, 1.15), { badge: true });
  const calc = new THREE.Group(); calc.rotation.y = -.15;
  calc.add(box(.13, .03, .19, std('#3a3d42'), 0, .015, 0)); calc.add(box(.1, .005, .045, std('#9fd0a0'), 0, .032, -.055));
  onCounter(calc, .3, .13, 1.5); reg({ type: 'hitung' }, calc, { proxy: { size: [.15, .06, .2], at: [0, .03, 0] } });
  const phoneScreen = addGlow(new THREE.MeshStandardMaterial({ color: '#111', emissive: '#2f80d6', emissiveIntensity: .4 }), 1.2, .4);
  const phone = new THREE.Group(); phone.add(box(.075, .01, .15, std('#16181c'), 0, .005, 0));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(.062, .13), phoneScreen); scr.rotation.x = -Math.PI / 2; scr.position.set(0, .0105, 0); phone.add(scr);
  onCounter(phone, .62, .15, 1.6); reg({ type: 'hp' }, phone, { proxy: { size: [.1, .05, .17], at: [0, .02, 0] } });
  reg({ type: 'kopi-minum' }, onCounter(gelas(), .92, .13, 1.7), { proxy: { size: [.1, .1, .1], at: [0, .045, 0] } });
  const book = new THREE.Group(); book.add(box(.2, .025, .28, std('#efe2bd'), 0, .0125, 0)); book.add(box(.19, .006, .02, std('#7a4a22'), 0, .028, -.12));
  book.rotation.y = .2; onCounter(book, 1.2, .1, 1.3); reg({ type: 'buku' }, book, { proxy: { size: [.22, .06, .3], at: [0, .02, 0] } });

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
  const cans = new THREE.InstancedMesh(new THREE.CylinderGeometry(.033, .033, .12, 8), std('#ffffff', { metalness: .5, roughness: .35 }), 5 * 7);
  { let n = 0; const m = new THREE.Matrix4(), c = new THREE.Color(); for (let r = 0; r < 5; r++) for (let i = 0; i < 7; i++) for (let j = 0; j < 1; j++) { m.makeTranslation(-.32 + i * .107, .62 + r * .3 - (r === 4 ? .0 : 0) + .06, -.14 + j * .12); cans.setMatrixAt(n, m); cans.setColorAt(n, c.set(pick(['#c0281a', '#e6e8ea', '#2f80d6', '#3f9e58']))); n++; } }
  fridge.add(cans);
  fridge.add(box(.03, .5, .03, std('#bcc5cc', { metalness: .8 }), .38, .95, .39));

  // barang lantai: karung beras, galon, gas, kardus
  const place = (obj, x, y, z, s = 1, ry = 0) => { obj.scale.setScalar(s); obj.position.set(x, y, z); obj.rotation.y = ry; scene.add(obj); return obj; };
  [[-1.9, 0, -2.4, .3], [-1.45, 0, -2.45, -.15]].forEach(([x, y, z, ry]) => place(beras(), x, y, z, 1.25, ry));
  place(galon(), .6, 0, -2.45, 1.2); place(gas(), -.4, 0, -2.45, 1.3);
  place(kardus(), 1.0, 0, -1.9, 1.1, .2); place(kardus(), 1.0, .31, -1.9, 1.1, -.1);

  // renteng gantung di balok depan: kiri = kopi sachet, kanan = keripik/snack (sachet 3D menggembung)
  const mkRenteng = (id, kind, x0) => {
    const g = hangingStrips(kind, x0); scene.add(g);
    return reg({ type: 'item', id }, g, { badge: true, proxy: { size: [1.6, .5, .3], at: [x0 + .73, 2.08, -.18] } });   // pelantara klik hanya di bagian atas (tidak menutupi barang di bawahnya)
  };
  mkRenteng('kopi', 'kopi', -1.95); mkRenteng('snack', 'snack', .45);
  // spanduk promo di tiang kiri + kardus kiriman kurir (muncul saat barang tiba)
  const promoSign = new THREE.Group(); promoSign.position.set(-2.55, 1.7, .55); promoSign.rotation.y = Math.PI / 2;
  promoSign.add(new THREE.Mesh(new THREE.PlaneGeometry(.55, .4), new THREE.MeshStandardMaterial({ map: signTex('PROMO', '#c0281a', '#ffe9a0') })));
  scene.add(promoSign); reg({ type: 'promo' }, promoSign, { proxy: { size: [.6, .45, .2] } });
  const paket = new THREE.Group(); paket.position.set(-1.7, 0, .95); paket.visible = false;
  const pk = kardus(); pk.scale.setScalar(1.3); paket.add(pk); scene.add(paket); reg({ type: 'paket' }, paket);

  /* ---------- area luar ---------- */
  // meja display di teras, setinggi dada, supaya barang besar terlihat DI ATAS barang di meja kasir dari balik meja
  const TH = .85;
  const displayTable = (x, z, w) => {
    const t = new THREE.Group(); t.position.set(x, 0, z); scene.add(t);
    t.add(box(w, .05, .55, wood, 0, TH, 0)); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => t.add(box(.05, TH, .05, woodDark, a * (w / 2 - .05), TH / 2, b * .22)));
    t.add(box(w - .1, .04, .5, woodDark, 0, .3, 0));
  };
  displayTable(1.1, .05, 1.25); displayTable(2.0, .05, .85); displayTable(-1.75, .05, 1.0);
  const rak = place(rakBensin(), -1.75, TH + .025, .05, 1.0, 0); reg({ type: 'item', id: 'bensin' }, rak, { badge: true });
  reg({ type: 'item', id: 'galon' }, place(galon(), .82, TH + .025, .05, 1.2), { badge: true });
  reg({ type: 'item', id: 'gas' }, place(gas(), 1.38, TH + .025, .05, 1.3), { badge: true });
  reg({ type: 'item', id: 'beras' }, place(beras(), 1.76, TH + .025, .05, 1.2, .15), { badge: true });
  reg({ type: 'item', id: 'beras' }, place(beras(), 2.07, TH + .025, .05, 1.2, -.15));
  const bench = new THREE.Group(); bench.position.set(3.1, 0, .9); scene.add(bench);
  bench.add(box(1.4, .05, .36, wood, 0, .45, 0)); [-.6, .6].forEach(x => bench.add(box(.06, .45, .3, woodDark, x, .225, 0))); bench.add(box(1.4, .3, .04, wood, 0, .72, -.16));
  const stool = new THREE.Group(); stool.position.set(-2.3, 0, .95); scene.add(stool);
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
  const tree = new THREE.Group(); tree.position.set(4.4, 0, 1.0); scene.add(tree);
  tree.add(at(sh(new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, 1.6, 10), std('#6b4a2a'))), 0, .8, 0));
  [[0, 2.1, 0, .7], [.4, 1.8, .1, .5], [-.35, 1.85, -.1, .5]].forEach(([x, y, z, r]) => { const f = sh(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), std('#3f8a3a', { flatShading: true }))); f.position.set(x, y, z); tree.add(f); });
  // lampu jalan
  const lamp = new THREE.Group(); lamp.position.set(-3.2, 0, 1.25); scene.add(lamp);
  lamp.add(at(sh(new THREE.Mesh(new THREE.CylinderGeometry(.05, .07, 4.4, 10), std('#6d747a', { metalness: .5 }))), 0, 2.2, 0));
  lamp.add(box(.9, .06, .06, std('#6d747a', { metalness: .5 }), .4, 4.4, 0));
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.1, 12, 10), addGlow(new THREE.MeshBasicMaterial({ color: '#9a9a9a' }), '#ffe2a0', '#9a9a9a')); bulb.position.set(.8, 4.32, 0); lamp.add(bulb);
  const lampLight = new THREE.PointLight('#ffd9a0', 0, 12, 2); lampLight.position.set(-2.4, 4.2, 1.25); scene.add(lampLight); lampsNight.push({ light: lampLight, on: 30 });

  /* ---------- nampan di meja: barang pilihan pemain terbang dari rak lalu mendarat ---------- */
  const trayPlate = box(.84, .018, .2, new THREE.MeshStandardMaterial({ color: '#d8a15d', roughness: .6 }), .14, 1.012, -.5); scene.add(trayPlate);
  const trayRim = box(.86, .03, .02, woodDark, .14, 1.02, -.405); scene.add(trayRim);
  const SLOTS = 8, slotPos = i => new THREE.Vector3(-.2 + i * .1, 1.022, -.5);
  const miniCache = {};
  const tex = (k, f) => miniCache[k] || (miniCache[k] = f());
  const pouchMini = map => new THREE.Mesh(pouchGeometry(.09, .13, .03), new THREE.MeshStandardMaterial({ map, roughness: .45, side: THREE.DoubleSide }));
  /** Model mini sebuah barang (untuk nampan/di tangan), alas di y=0, tinggi ≈ .15 m. */
  const miniFor = id => {
    let o;
    switch (id) {
      case 'kopi': o = pouchMini(tex('kopi', () => kopiTex('HITAM', '#4a2a12', '#2a1608'))); break;
      case 'snack': o = pouchMini(tex('snack', () => snackTex('KERIPIK', '#d63b2f', '#8a1f18', '#f6c744'))); break;
      case 'rokok': o = new THREE.Mesh(new THREE.BoxGeometry(.058, .088, .024), new THREE.MeshStandardMaterial({ map: tex('cig', () => cigTex(0)), roughness: .6 })); break;
      case 'bensin': o = bensin(); break; case 'aqua': o = aqua(); break; case 'cola': o = cola(); break; case 'redbull': o = redbull(); break;
      case 'mie': o = mie(); break; case 'kerupuk': o = toples(); break; case 'galon': o = galon(); break; case 'gas': o = gas(); break; default: o = beras();
    }
    const holder = new THREE.Group(); holder.add(o);
    const b = new THREE.Box3().setFromObject(o), h = Math.max(.01, b.max.y - b.min.y), k = Math.min(2.4, Math.max(.4, .15 / h));
    o.scale.setScalar(k); o.position.y = -b.min.y * k; o.traverse(m => { if (m.isMesh) m.castShadow = true; });
    return holder;
  };
  const centerOf = id => { const it = items.find(i => i.act.id === id); if (!it) return new THREE.Vector3(0, 1.2, -1); return new THREE.Box3().setFromObject(it.obj).getCenter(new THREE.Vector3()); };
  const trayItems = []; let flights = [];
  /** counts = G.tray; hold = tahan tampilan (pelanggan sedang mengambil barang). */
  const syncTray = (counts, hold = false) => {
    if (hold) return;
    const ids = new Set([...Object.keys(counts), ...trayItems.map(t => t.id)]);
    for (const id of ids) {
      const need = Math.min(counts[id] || 0, 4), have = trayItems.filter(t => t.id === id);
      for (let n = have.length; n < need; n++) {
        const used = new Set(trayItems.map(t => t.slot)); let slot = 0; while (used.has(slot) && slot < SLOTS - 1) slot++;
        const obj = miniFor(id); const from = centerOf(id); obj.position.copy(from); obj.scale.setScalar(1.6); scene.add(obj);
        const rec = { id, obj, slot, landed: false }; trayItems.push(rec); penjagaAct('reach', from, slotPos(slot)); flights.push({ rec, from, to: slotPos(slot), t0: performance.now(), dur: 380 });
      }
      for (let n = have.length; n > need; n--) { const r = have[n - 1]; scene.remove(r.obj); trayItems.splice(trayItems.indexOf(r), 1); flights = flights.filter(f => f.rec !== r); }
    }
  };
  const stepFlights = () => {
    const now = performance.now();
    flights = flights.filter(f => {
      const p = Math.min(1, (now - f.t0) / f.dur), e = p * p * (3 - 2 * p);
      f.rec.obj.position.lerpVectors(f.from, f.to, e); f.rec.obj.position.y += Math.sin(Math.PI * p) * .3;
      f.rec.obj.scale.setScalar(1.6 - .6 * e); f.rec.obj.rotation.y += .25;
      if (p >= 1) { f.rec.obj.position.copy(f.to); f.rec.obj.scale.setScalar(1); f.rec.obj.rotation.y = 0; f.rec.landed = true; return false; }
      return true;
    });
  };

  /* ---------- orang ---------- */
  const demo = [];
  if (!game) {
    const ojol = person({ shirt: '#2fa84f', pants: '#2d5fa8', helmet: '#2fa84f' }); ojol.position.set(.45, 0, .85); ojol.rotation.y = .1; scene.add(ojol);
    const ibu = person({ shirt: '#d9729a', pants: '#8a5a8a', skin: '#b87a50', hair: '#222' }); ibu.scale.setScalar(.93); ibu.position.set(-.75, 0, 1.0); ibu.rotation.y = -.25; scene.add(ibu);
    demo.push(ojol, ibu);
  }
  const PJ_Y = .3;   // penjaga chibi berdiri di atas dingklik supaya bahunya setinggi meja kasir
  scene.add(box(.6, PJ_Y, .85, std('#8a5a32', { roughness: .85 }), .2, PJ_Y / 2, -1.15));
  const penjaga = personFor('penjaga'); penjaga.position.set(.2, PJ_Y, -1.3); penjaga.rotation.y = Math.PI; scene.add(penjaga);
  const people = [...demo, penjaga];

  /* ---------- mesin kasir + laci uang (di meja, menghadap penjaga) ---------- */
  const till = new THREE.Group(); till.position.set(.02, 1.0, .08); counter.add(till);
  till.add(box(.32, .13, .26, std('#3a3f46', { metalness: .45, roughness: .45 }), 0, .065, 0));
  const tillScreen = new THREE.Mesh(new THREE.BoxGeometry(.2, .09, .015), addGlow(new THREE.MeshStandardMaterial({ color: '#112', emissive: '#4fe08a', emissiveIntensity: .5 }), 1.3, .5));
  tillScreen.position.set(0, .2, .07); tillScreen.rotation.x = -.45; tillScreen.castShadow = true; till.add(tillScreen);
  const tillStand = box(.05, .09, .04, std('#3a3f46'), 0, .165, .08); till.add(tillStand);
  const drawer = new THREE.Group(); till.add(drawer);                           // meluncur ke arah penjaga (−z)
  drawer.add(box(.28, .06, .02, std('#8a8f96', { metalness: .6, roughness: .35 }), 0, .045, -.135));
  drawer.add(box(.26, .02, .22, std('#4a4f56'), 0, .02, -.02));
  [['#3f9e58', -.085, -.03], ['#3f78c4', 0, -.03], ['#8a55b8', .085, -.03], ['#b4783c', -.04, .05], ['#3f9e58', .05, .05]].forEach(([c, x, z]) => drawer.add(box(.07, .018, .045, std(c), x, .039, z)));
  [-.09, -.06, .08].forEach(x => { const c = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .004, 10), std('#d4a82a', { metalness: .7 })); c.position.set(x, .031, .09); drawer.add(c); });
  let drawerOpen = 0;

  /* ---------- animasi penjaga: menjangkau barang, menerima uang (laci), menyerahkan kantong, minum, main HP ---------- */
  const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
  const PJ_Z = -1.3, pj = { cont: null, timed: null, yaw: Math.PI, lean: 0, lastKind: null, contT0: 0 };
  const pjHand = penjaga.userData.hands[1]; let pjGrip = .28;
  const pjArm = penjaga.userData.arms[1], pjElbow = penjaga.userData.elbows[1], pjTorso = penjaga.userData.torso, pjHead = penjaga.userData.head;
  const restQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -.1)), downV = new THREE.Vector3(0, -1, 0), tmpQ = new THREE.Quaternion();
  const L1 = ARM, L2 = ARM, HOLD = ARM + .01, clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const _pv = new THREE.Vector3(), _n = new THREE.Vector3(), _u = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _m = new THREE.Matrix4();
  const _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion();
  /** Pegangan di tangan (menempel pada siku, tetap tegak): kantong, gelas, HP. */
  const holds = { bag: makeBag('#d63b2f'), mug: gelas(), phone: new THREE.Group() };
  holds.bag.position.set(0, -HOLD, 0);
  const mugIn = holds.mug; holds.mug = new THREE.Group(); mugIn.scale.setScalar(1.6); mugIn.position.set(0, -.04, 0); holds.mug.add(mugIn); holds.mug.position.set(0, -HOLD - .04, -.04);
  const phoneIn = box(.075, .01, .15, std('#16181c'), 0, 0, 0); phoneIn.rotation.x = 1.0; holds.phone.add(phoneIn); holds.phone.position.set(0, -HOLD, -.06);
  Object.values(holds).forEach(h => { h.visible = false; pjElbow.add(h); });
  const keepUpright = (obj, root) => { root.getWorldQuaternion(_qa); obj.parent.getWorldQuaternion(_qb); obj.quaternion.copy(_qb.invert().multiply(_qa)); };
  const DUR = { reach: 420, drink: 1400, phone: 600 };
  /** Aksi singkat penjaga: 'reach' (a=barang, b=nampan), 'drink', 'phone'. */
  const penjagaAct = (kind, a, b) => { pj.timed = { kind, a: a ? a.clone() : null, b: (b || a) ? (b || a).clone() : null, t0: performance.now(), dur: DUR[kind] }; };
  /** IK dua ruas: bahu+siku sehingga tangan sampai ke worldT (siku menekuk ke bawah). */
  const aimArm = (worldT, rate) => {
    const lt = pjArm.parent.worldToLocal(worldT.clone()).sub(pjArm.position);   // dalam bingkai induk lengan (badan atas)
    const d = clampN(lt.length(), .15, L1 + L2 - .005);
    _pv.copy(lt).normalize();
    _n.crossVectors(_pv, downV); if (_n.lengthSq() < 1e-4) _n.set(1, 0, 0); _n.normalize();       // sumbu engsel siku
    const alpha = Math.acos(clampN((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));        // lengan atas turun dari garis pandang
    const theta = Math.PI - Math.acos(clampN((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1)); // tekukan siku
    _u.copy(_pv).applyAxisAngle(_n, alpha);
    _y.copy(_u).negate(); _z.crossVectors(_n, _y); _m.makeBasis(_n, _y, _z); tmpQ.setFromRotationMatrix(_m);
    pjArm.quaternion.slerp(tmpQ, rate); pjElbow.rotation.x += (-theta - pjElbow.rotation.x) * rate;
  };
  const stepPenjaga = (t, dt) => {
    const now = performance.now(); penjaga.updateWorldMatrix(true, true);
    let act = pj.timed && now - pj.timed.t0 < pj.timed.dur ? pj.timed : null; if (!act) pj.timed = null;
    const kind = pj.cont ? pj.cont.kind : null; if (kind !== pj.lastKind) { pj.lastKind = kind; pj.contT0 = now; }
    const since = (now - pj.contT0) / 1000;
    let mode = 'idle', target = null;
    if (act) {
      mode = act.kind;
      if (mode === 'reach') target = (now - act.t0) / act.dur < .5 ? act.a : act.b;
      else if (mode === 'drink') target = penjaga.localToWorld(new THREE.Vector3(0, 1.02, -.46));
      else target = penjaga.localToWorld(new THREE.Vector3(0, .8, -.4));
    } else if (pj.cont) {
      mode = pj.cont.kind; target = pj.cont.target;
      // menerima uang: ambil dari tangan pelanggan, lalu masukkan ke laci & ambil kembalian
      if (mode === 'receive' && since > .9) target = drawer.localToWorld(new THREE.Vector3(0, .06, -.03));
    }
    // laci terbuka selama penjaga mengurus uang/kembalian
    const drawerT = !act && mode === 'receive' && since > .7 ? 1 : 0;
    drawerOpen += (drawerT - drawerOpen) * kdt(.14, dt); drawer.position.z = -drawerOpen * .2;
    holds.bag.visible = mode === 'give' && !!pj.cont && pj.cont.bag; holds.mug.visible = mode === 'drink'; holds.phone.visible = mode === 'phone';
    // jari: terbuka saat menjangkau/menerima, menggenggam saat memegang kantong/gelas/HP
    const gripT = mode === 'give' ? (pj.cont && pj.cont.bag ? .9 : .15) : mode === 'drink' ? .8 : mode === 'phone' ? .65 : mode === 'receive' ? (since < .9 ? .1 : .55) : mode === 'reach' ? .12 : .28;
    pjGrip += (gripT - pjGrip) * kdt(.25, dt); pjHand.userData.setCurl(pjGrip);
    if (target) aimArm(target, kdt(.22, dt)); else { pjArm.quaternion.slerp(restQ, kdt(.15, dt)); pjElbow.rotation.x += (.18 - pjElbow.rotation.x) * kdt(.15, dt); }
    Object.values(holds).forEach(h => { if (h.visible) keepUpright(h, penjaga); });
    // badan: menoleh ke sasaran, maju ke meja saat transaksi
    let yawT = Math.PI;
    if (target && (mode === 'reach' || mode === 'receive' || mode === 'give')) { const dx = target.x - penjaga.position.x, dz = target.z - penjaga.position.z; yawT = Math.PI + Math.max(-.8, Math.min(.8, angDiff(Math.PI, Math.atan2(-dx, -dz)))) * .6; }
    pj.yaw += angDiff(pj.yaw, yawT) * kdt(.15, dt); penjaga.rotation.y = pj.yaw;
    const leanT = mode === 'receive' || mode === 'give' ? 1 : mode === 'reach' ? .4 : 0;
    pj.lean += (leanT - pj.lean) * kdt(.15, dt); penjaga.position.z = PJ_Z + pj.lean * .35; pjTorso.rotation.x = -pj.lean * .25;
    pjHead.rotation.y += ((mode === 'idle' ? Math.sin(t * .6) * .22 : 0) - pjHead.rotation.y) * kdt(.08, dt);
  };
  scene.traverse(o => { if (o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry') o.castShadow = false; });
  // hemat lintasan bayangan: benda kecil (< 10 cm radius, mis. botol, kaleng, kemasan) tidak melempar bayangan
  scene.updateMatrixWorld(true);
  { const ws = new THREE.Vector3(); scene.traverse(o => { if ((o.isMesh || o.isInstancedMesh) && o.castShadow) { o.geometry.boundingSphere || o.geometry.computeBoundingSphere(); o.getWorldScale(ws); if (o.geometry.boundingSphere.radius * Math.max(ws.x, ws.y, ws.z) < .1) o.castShadow = false; } }); }

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
    renderer.toneMappingExposure = 1.1 + .15 * n; scene.environmentIntensity = .55 - .35 * n;
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
    penjaga: { pos: [.1, 2.0, -2.3], tgt: [.1, 1.05, 1], fp: true },
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
  const BAG_COLORS = ['#d63b2f', '#e8e8e8', '#2d2d33', '#f6c744'];
  /** Pegangan di tangan kanan: kantong/galon/gas/karung sesuai belanjaan, plus lembar uang. */
  const makeHolder = (kind, key) => {
    const h = new THREE.Group();
    if (kind === 'bag') { const bg = makeBag(BAG_COLORS[key.length * 7 % BAG_COLORS.length]); bg.position.y = -HOLD; h.add(bg); }
    else if (kind === 'galon') { const o = galon(); o.scale.setScalar(.78); o.position.y = -HOLD - .43 * .78 + .02; h.add(o); }
    else if (kind === 'gas') { const o = gas(); o.scale.setScalar(.95); o.position.y = -HOLD - .34 * .95 + .04; h.add(o); }
    else { const o = beras(); o.scale.setScalar(.8); o.position.set(0, -HOLD - .4, -.03); h.add(o); }
    return h;
  };
  /* serah-terima: uang/kantong terbang dari tangan ke tangan (lengan chibi terlalu pendek untuk bertemu di atas meja) */
  let handoffs = []; const _hv = new THREE.Vector3();
  const handoff = (obj, fromObj, toObj, dur) => { const a = fromObj.getWorldPosition(new THREE.Vector3()); obj.position.copy(a); scene.add(obj); handoffs.push({ obj, a, toObj, t0: performance.now(), dur }); };
  const stepHandoffs = () => {
    const now = performance.now();
    handoffs = handoffs.filter(f => {
      const p = Math.min(1, (now - f.t0) / f.dur), e = p * p * (3 - 2 * p);
      f.obj.position.lerpVectors(f.a, f.toObj.getWorldPosition(_hv), e); f.obj.position.y += Math.sin(Math.PI * p) * .22 + (f.lift || 0);
      if (p >= 1) { scene.remove(f.obj); return false; }
      return true;
    });
  };
  /** Kurir: berjalan masuk saat kiriman tiba, menunggu di samping kardus, pergi setelah barang diterima. */
  const kurir = personFor('kurir'); kurir.visible = false; scene.add(kurir);
  const KUR = { x: -6.5, on: false, home: -2.35, away: -6.5, z: 1.7 };
  const stepKurir = (t, dt) => {
    const tx = KUR.on ? KUR.home : KUR.away, dx = tx - KUR.x, moving = Math.abs(dx) > .03;
    if (moving) KUR.x += Math.sign(dx) * Math.min(Math.abs(dx), 2.4 * dt);
    kurir.visible = KUR.on || KUR.x > KUR.away + .05; if (!kurir.visible) return;
    const { legs, arms, head } = kurir.userData, ph = t * 9;
    kurir.position.set(KUR.x, moving ? Math.abs(Math.sin(ph)) * .03 : 0, KUR.z);
    kurir.rotation.y += angDiff(kurir.rotation.y, moving ? (dx > 0 ? -Math.PI / 2 : Math.PI / 2) : -.5) * kdt(.18, dt);
    const sw = moving ? Math.sin(ph) : 0; legs[0].rotation.x = sw * .55; legs[1].rotation.x = -sw * .55; arms[0].rotation.x = -sw * .4; arms[1].rotation.x = sw * .4;
    head.rotation.y = moving ? 0 : Math.sin(t * .7) * .25;
  };
  const ambience = createAmbience({ scene, addGlow });
  /** list: [{ key, type, x, z, moving, dir, pose: 'idle'|'pay'|'take', pt, carry }] — buat/hapus/gerakkan orang sesuai logika game. */
  const syncPeople = (list, t, dt = 1 / 60) => {
    const seen = new Set(); pj.cont = null;
    for (const it of list) {
      let e = crowd.get(it.key);
      if (!e) {
        const g = personFor(it.type, parseInt(it.key.slice(1), 10) || 0); g.position.set(it.x, 0, it.z); scene.add(g);
        const bill = makeBill(); bill.position.set(0, -HOLD - .03, -.05); bill.rotation.x = Math.PI / 2; bill.visible = false; g.userData.elbows[1].add(bill);
        e = { g, bill, ang: it.moving ? (it.dir > 0 ? -Math.PI / 2 : Math.PI / 2) : 0, lean: 0, a0: 0, a1: 0, b0: 0, b1: 0, s0: 0, s1: 0, g0: .28, g1: .28, holder: null, holderKind: null }; crowd.set(it.key, e);
      }
      seen.add(it.key);
      const want = it.moving ? (it.dir > 0 ? -Math.PI / 2 : Math.PI / 2) : (it.turn ?? 0);
      e.ang += angDiff(e.ang, want) * kdt(.18, dt); e.g.rotation.y = e.ang;
      const near = it.pose === 'pay' || it.pose === 'take';
      e.lean += ((near ? .32 : 0) - e.lean) * kdt(.12, dt);
      e.g.position.x = it.x; e.g.position.z = it.z - e.lean;
      const { legs, arms, elbows, head } = e.g.userData, ph = t * 9 + it.key.length;
      // bawaan di tangan kanan
      let showHold = false;
      if (it.carry) {
        if (e.holderKind !== it.carry) { if (e.holder) elbows[1].remove(e.holder); e.holder = makeHolder(it.carry, it.key); e.holderKind = it.carry; elbows[1].add(e.holder); }
        showHold = it.pose === 'take' ? it.pt > .45 : it.moving;
      }
      if (e.holder) e.holder.visible = showHold;
      // uang terbang ke tangan penjaga begitu tangan terangkat; kantong/barang terbang balik saat diserahkan
      const hand1 = e.g.userData.hands[1];
      if (it.pose === 'pay') { e.payT = (e.payT || 0) + dt; if (!e.billSent && e.payT > .55) { e.billSent = true; handoff(makeBill(), hand1, pjHand, 420); } } else { e.payT = 0; e.billSent = false; }
      if (it.pose === 'take' && it.carry) { if (!e.bagSent && it.pt > .2) { e.bagSent = true; handoff(makeHolder(it.carry, it.key), pjHand, hand1, 280); handoffs[handoffs.length - 1].lift = HOLD; } } else e.bagSent = false;
      e.bill.visible = it.pose === 'pay' && !e.billSent;
      if (it.mood !== e.mood) { e.mood = it.mood; e.g.userData.setMood(it.mood); }
      // target sudut bahu (a) & siku (b); rotation.x positif = terulur/menekuk ke depan (−z)
      let t0 = 0, t1 = 0, u0 = .1, u1 = .1, s0 = 0, s1 = 0;   // s = lengan membuka ke samping agar tidak menembus kepala besar
      if (it.pose === 'pay') { if (e.billSent && e.payT > 1) { t1 = .9; u1 = .6; s1 = .15; } else { t1 = 2.6; u1 = .1; s1 = .48; } t0 = .15; u0 = .15; }
      else if (it.pose === 'take') { const p = it.pt / 1.1; if (p < .45) { t0 = 2.6; u0 = .1; t1 = 2.6; u1 = .1; s0 = s1 = .48; } else if (p < .8) { t0 = .1; u0 = .2; t1 = .5; u1 = .9; } else { t0 = .05; u0 = .15; t1 = .35; u1 = 1.0; } }
      else if (it.moving) { const sw = Math.sin(ph); t0 = -sw * .4; u0 = .2 + Math.max(0, sw) * .2; if (it.carry) { t1 = .35; u1 = 1.05 + sw * .05; } else { t1 = sw * .4; u1 = .2 + Math.max(0, -sw) * .2; } }
      const ka = kdt(.22, dt); e.a0 += (t0 - e.a0) * ka; e.a1 += (t1 - e.a1) * ka; e.b0 += (u0 - e.b0) * ka; e.b1 += (u1 - e.b1) * ka; e.s0 += (s0 - e.s0) * ka; e.s1 += (s1 - e.s1) * ka;
      arms[0].rotation.x = e.a0; arms[1].rotation.x = e.a1; arms[0].rotation.z = .1 - e.s0; arms[1].rotation.z = e.s1 - .1; elbows[0].rotation.x = e.b0; elbows[1].rotation.x = e.b1;
      if (e.holder) e.holder.rotation.x = -(e.a1 + e.b1);   // bawaan tetap menggantung tegak
      // jari: menggenggam bawaan, memegang uang saat membayar, terbuka saat menjulur mengambil
      const reach = it.pose === 'take' && it.pt / 1.1 < .45;
      const g1T = showHold ? .9 : it.pose === 'pay' ? .55 : reach ? .08 : .28, g0T = reach ? .08 : .28, kg = kdt(.25, dt);
      e.g0 += (g0T - e.g0) * kg; e.g1 += (g1T - e.g1) * kg; e.g.userData.hands[0].userData.setCurl(e.g0); e.g.userData.hands[1].userData.setCurl(e.g1);
      if (it.moving) { legs[0].rotation.x = Math.sin(ph) * .55; legs[1].rotation.x = -Math.sin(ph) * .55; e.g.position.y = Math.abs(Math.sin(ph)) * .03; }
      else { legs[0].rotation.x *= 1 - kdt(.2, dt); legs[1].rotation.x *= 1 - kdt(.2, dt); e.g.position.y = Math.abs(Math.sin(t * 1.6 + it.key.length)) * .004; head.rotation.y = near ? head.rotation.y * (1 - kdt(.2, dt)) : Math.sin(t * .7 + it.key.length) * .25; }
      e.g.userData.torso.rotation.x = -e.lean * .5;
      if (it.pose === 'pay') pj.cont = { kind: 'receive', target: new THREE.Vector3(it.x + .08, 1.12, it.z - e.lean - .5) };
      else if (it.pose === 'take' && it.pt < .8) pj.cont = { kind: 'give', bag: it.pt < .2, target: new THREE.Vector3(it.x + .08, 1.1, it.z - e.lean - .42) };
      e.head = new THREE.Vector3(it.x, 2.06, it.z - e.lean);
      // LOD: detail halus (jari, wajah) hanya untuk orang yang dekat kamera
      const near2 = camera.position.distanceToSquared(e.g.position) < 30;   // ≈ 5,5 m
      if (near2 !== e.detail) { e.detail = near2; for (const m of e.g.userData.fine) m.visible = near2; }
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
    people.forEach((p, i) => { p.position.y = (p === penjaga ? PJ_Y : 0) + Math.abs(Math.sin(t * 1.6 + i)) * .004; if (p !== penjaga) p.userData.head.rotation.y = Math.sin(t * .7 + i * 2) * .25; });
    stepPenjaga(t, dt); stepKurir(t, dt); ambience.step(t, dt);
    if (handoffs.length) stepHandoffs();
    if (rainLines.visible) stepRain(dt);
    if (flights.length) stepFlights();
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
    setPaket(v) { paket.visible = v; KUR.on = v; },
    /** Diagnostik: posisi benda yang sedang terbang dari tangan ke tangan. */
    ambience: () => ambience.state(),
    /** Diagnostik: tempatkan kamera bebas (posisi, sasaran) untuk memeriksa sudut di luar tiga tampilan baku. */
    lookFrom(p, t) { tween = null; controls.minDistance = 0; controls.maxDistance = Infinity; camera.position.set(...p); controls.target.set(...t); },
    handoffs: () => handoffs.map(f => f.obj.position.toArray().map(v => +v.toFixed(2))),
    get drawerOpen() { return drawerOpen; },   // 0..1 (untuk tes)
    /** Diagnostik: apakah tiap barang terlihat dari kamera saat ini (tidak tertutup benda lain & ada di layar). */
    reachability() {
      scene.updateMatrixWorld(true);
      const solid = [];
      const shown = o => { for (let n = o; n; n = n.parent) if (!n.visible) return false; return true; };
      scene.traverse(o => { if (o.isMesh && shown(o)) { const m = o.material; if (m && !(m.transparent && m.opacity < .5) && m.visible !== false && !(m.side === THREE.BackSide)) solid.push(o); } });
      const rc = new THREE.Raycaster(), cam = camera.position, res = {}, mat = new THREE.Matrix4();
      const isIn = (o, root) => { for (let n = o; n; n = n.parent) if (n === root) return true; return false; };
      for (const it of items) {
        if (it.act.type !== 'item') continue;
        const pts = [];
        it.obj.traverse(m => { if (!m.isMesh || !shown(m) || m.material.visible === false) return;
          m.geometry.boundingBox || m.geometry.computeBoundingBox(); const c = m.geometry.boundingBox.getCenter(new THREE.Vector3());   // pusat badan, bukan titik asal (dasar)
          if (m.isInstancedMesh) { const n = m.count; for (const i of [0, n >> 1, n - 1]) { m.getMatrixAt(i, mat); pts.push(c.clone().applyMatrix4(mat).applyMatrix4(m.matrixWorld)); } }
          else pts.push(c.applyMatrix4(m.matrixWorld)); });
        let seen = 0, ok = 0;
        for (const t of pts.slice(0, 40)) {
          const p = t.clone().project(camera); if (p.z > 1 || Math.abs(p.x) > 1 || Math.abs(p.y) > 1) continue;   // di luar layar
          seen++; const d = t.clone().sub(cam); const dist = d.length(); rc.set(cam, d.normalize()); rc.far = dist + .02;
          const hit = rc.intersectObjects(solid, false)[0]; if (hit && isIn(hit.object, it.obj)) ok++; else if (hit) { const q = res[it.act.id] || (res[it.act.id] = { samples: 0, visible: 0 }); q.by = `${hit.object.geometry.type}@${hit.point.x.toFixed(2)},${hit.point.y.toFixed(2)},${hit.point.z.toFixed(2)}`; }
        }
        const r = res[it.act.id] || (res[it.act.id] = { samples: 0, visible: 0 }); r.samples += pts.length ? Math.min(pts.length, 40) : 0; r.onScreen = (r.onScreen || 0) + seen; r.visible += ok;
      }
      return res;
    },
    /** Diagnostik: 15 mesh terberat (segitiga × instans) — untuk memantau anggaran HP. */
    heavy() {
      const rows = [];
      scene.traverse(o => { if (o.isMesh && o.geometry) { const g = o.geometry, tri = (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); rows.push([Math.round(tri), o.isInstancedMesh ? 'instanced' : 'mesh', g.type, o.parent && o.parent.userData && o.parent.userData.act ? o.parent.userData.act.id : '']); } });
      const total = rows.reduce((a, r) => a + r[0], 0);
      const byType = {}; rows.forEach(r => { byType[r[2]] = (byType[r[2]] || 0) + r[0]; });
      return { total, byType: Object.entries(byType).sort((a, b) => b[1] - a[1]).slice(0, 10), top: rows.sort((a, b) => b[0] - a[0]).slice(0, 12) };
    },
    controls, items, pick: pickItem, penjagaAct, highlight, project, badges, syncPeople, syncTray, headPos, resize: resizeTo, frame: step,
    triangles: () => renderer.info.render.triangles,
    rakBensin: rak,
    dispose() { alive = false; cancelAnimationFrame(raf); ro && ro.disconnect(); controls.dispose(); scene.traverse(o => { o.geometry && o.geometry.dispose(); }); renderer.dispose(); },
  };
  return api;
}
