import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { galon, gas, toples, rakBensin, kardus, beras } from '../props3d/props';
import { woodTex, roofTex, slatTex, asphaltTex, concreteTex, bannerTex, signTex, rentengTex } from './textures';
import { person } from './people';

/* Adegan warung Madura 3D prosedural. Satuan meter: x kanan, y atas, z ke arah jalan. Warung: x∈[-2.2,2.2], z∈[-3.2,0]. */

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .75, ...o });
const sh = m => { m.castShadow = true; m.receiveShadow = true; return m; };
const box = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = sh(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)); m.position.set(x, y, z); return m; };
const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];

/** Kumpulan kotak berwarna dalam satu InstancedMesh (barang dagangan di rak). */
function instancedBoxes(items) {
  const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), std('#ffffff', { roughness: .55 }), items.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
  items.forEach((it, i) => { m.compose(p.set(it.x, it.y + it.h / 2, it.z), q, s.set(it.w, it.h, it.d)); inst.setMatrixAt(i, m); inst.setColorAt(i, c.set(it.c)); });
  inst.castShadow = true; inst.receiveShadow = true; return inst;
}
const PACK = ['#d63b2f', '#f6c744', '#2f80d6', '#3f9e58', '#8a55b8', '#f08a2c', '#e9e9e9', '#e5528a'];

export function createWarung(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, .05, 90);
  const controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.maxPolarAngle = Math.PI * .52;

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
  const caseItems = []; [.012, .272].forEach(y => { for (let i = 0; i < 14; i++) for (let j = 0; j < 2; j++) caseItems.push({ x: -cw / 2 + .07 + i * .081, y, z: -.1 + j * .2, w: .06, h: rnd(.05, .09), d: .09, c: pick(PACK) }); });
  const caseInst = instancedBoxes(caseItems); caseG.add(caseInst);
  // peralatan di meja
  const calc = new THREE.Group(); calc.position.set(.55, 1.0, -.05); calc.rotation.y = -.15; counter.add(calc);
  calc.add(box(.13, .03, .19, std('#3a3d42'), 0, .015, 0)); calc.add(box(.1, .005, .045, std('#9fd0a0'), 0, .032, -.055));
  const book = box(.2, .025, .28, std('#efe2bd'), .95, 1.0125, .03); book.rotation.y = .2; counter.add(book);
  const phoneScreen = addGlow(new THREE.MeshStandardMaterial({ color: '#111', emissive: '#2f80d6', emissiveIntensity: .4 }), 1.2, .4);
  const phone = box(.075, .01, .15, std('#16181c'), .3, 1.005, .18); counter.add(phone);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(.062, .13), phoneScreen); scr.rotation.x = -Math.PI / 2; scr.position.set(.3, 1.012, .18); counter.add(scr);
  const tp = toples(); tp.scale.setScalar(1.3); tp.position.set(1.05, 1.0, -.1); counter.add(tp);
  const k = kardus(); k.scale.setScalar(.9); k.position.set(-1.2, .0, -.1); k.visible = false; counter.add(k);

  /* ---------- rak dinding belakang ---------- */
  const shelfItems = [];
  const shelfUnit = x => {
    const g = new THREE.Group(); g.position.set(x, 0, -3.02); scene.add(g);
    const W = 1.25;
    [-W / 2, W / 2].forEach(px => g.add(box(.05, 2.3, .34, woodDark, px, 1.15, 0)));
    [.3, .82, 1.34, 1.86].forEach(y => {
      g.add(box(W + .04, .035, .36, wood, 0, y, 0));
      for (let r = 0; r < 2; r++) for (let i = 0; i < 9; i++) shelfItems.push({ x: x - W / 2 + .1 + i * .125, y: y + .0175, z: -3.02 - .06 + r * .13, w: .1, h: rnd(.15, .27), d: .1, c: pick(PACK) });
    });
  };
  shelfUnit(-1.45); shelfUnit(-.1);
  scene.add(instancedBoxes(shelfItems));

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
  place(beras(), -1.9, 0, -2.4, 1.25, .3); place(beras(), -1.45, 0, -2.45, 1.25, -.15); place(beras(), -1.7, .62, -2.42, 1.25, .1);
  [[.35, -2.45], [.7, -2.5], [.52, -2.2]].forEach(([x, z]) => place(galon(), x, 0, z, 1.2));
  [[-.5, -2.45], [-.2, -2.5], [-.35, -2.2]].forEach(([x, z]) => place(gas(), x, 0, z, 1.3));
  place(kardus(), 1.0, 0, -1.9, 1.1, .2); place(kardus(), 1.0, .31, -1.9, 1.1, -.1);

  // renteng gantung di balok depan
  const rTex = rentengTex(), rGeo = new THREE.PlaneGeometry(.13, .62);
  for (let i = 0; i < 17; i++) { const m = new THREE.Mesh(rGeo, new THREE.MeshStandardMaterial({ map: rTex, transparent: true, alphaTest: .3, side: THREE.DoubleSide, roughness: .6 })); m.position.set(-2.0 + i * .25, 2.02, -.14 - (i % 2) * .08); m.rotation.y = (i % 3 - 1) * .15; scene.add(m); }

  /* ---------- area luar ---------- */
  const rak = place(rakBensin(), -1.7, 0, .6, 1.15, .1);
  place(galon(), 2.55, 0, .45, 1.2); place(gas(), 2.2, 0, .5, 1.3);
  const bench = new THREE.Group(); bench.position.set(.9, 0, .65); scene.add(bench);
  bench.add(box(1.4, .05, .36, wood, 0, .45, 0)); [-.6, .6].forEach(x => bench.add(box(.06, .45, .3, woodDark, x, .225, 0))); bench.add(box(1.4, .3, .04, wood, 0, .72, -.16));
  const stool = new THREE.Group(); stool.position.set(1.9, 0, .8); scene.add(stool);
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
  const ojol = person({ shirt: '#2fa84f', pants: '#2d5fa8', helmet: '#2fa84f' }); ojol.position.set(.45, 0, .85); ojol.rotation.y = .1; scene.add(ojol);
  const ibu = person({ shirt: '#d9729a', pants: '#8a5a8a', skin: '#b87a50', hair: '#222' }); ibu.scale.setScalar(.93); ibu.position.set(-.75, 0, 1.0); ibu.rotation.y = -.25; scene.add(ibu);
  const penjaga = person({ shirt: '#a4262c', pants: '#3a3a4a', skin: '#b98258' }); penjaga.position.set(.55, 0, -1.55); penjaga.rotation.y = Math.PI; scene.add(penjaga);
  const peci = sh(new THREE.Mesh(new THREE.CylinderGeometry(.1, .11, .09, 16), std('#151515'))); peci.position.y = 1.67; penjaga.add(peci);
  const people = [ojol, ibu, penjaga];
  scene.traverse(o => { if (o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry') o.castShadow = false; });

  /* ---------- siang / malam ---------- */
  let night = false;
  const fog = new THREE.Fog('#9ccbf0', 18, 60); scene.fog = fog;
  const setNight = v => {
    night = v;
    const bg = new THREE.Color(v ? '#070d24' : '#9ccbf0'); scene.background = bg; fog.color.copy(bg); fog.near = v ? 10 : 18; fog.far = v ? 45 : 60;
    hemi.color.set(v ? '#3d4c8a' : '#cfe6ff'); hemi.groundColor.set(v ? '#1a1612' : '#8a7a62'); hemi.intensity = v ? .35 : 1.5;
    sun.intensity = v ? 0 : 3; moon.intensity = v ? .5 : 0;
    lampsNight.forEach(l => { l.light.intensity = v ? l.on : 0; });
    glows.forEach(g => {
      if (g.mat.emissive) g.mat.emissiveIntensity = v ? g.on : g.off;
      else g.mat.color.set(v ? g.on : g.off);
    });
    renderer.toneMappingExposure = v ? 1.25 : 1;
  };
  setNight(false);

  /* ---------- kamera ---------- */
  const VIEWS = {
    luar: { pos: [4.8, 1.9, 6.4], tgt: [0, 1.1, -.6], fp: false },
    pembeli: { pos: [0, 1.6, 4.6], tgt: [0, 1.3, -1.4], fp: false },
    penjaga: { pos: [.1, 1.55, -1.7], tgt: [.1, 1.4, 1], fp: true },
  };
  let tween = null, view = 'luar';
  const applyLimits = fp => {
    controls.enablePan = !fp; controls.enableZoom = !fp; controls.rotateSpeed = fp ? -.35 : 1;
    controls.minDistance = fp ? .05 : 1.5; controls.maxDistance = fp ? .05 : 16;
  };
  const setView = (name, instant = false) => {
    const v = VIEWS[name]; if (!v) return; view = name; penjaga.visible = !v.fp;
    const from = { p: camera.position.clone(), t: controls.target.clone() };
    let to = { p: new THREE.Vector3(...v.pos), t: new THREE.Vector3(...v.tgt) };
    if (v.fp) { const dir = to.t.clone().sub(to.p).normalize(); to = { p: to.p, t: to.p.clone().add(dir.multiplyScalar(.05)) }; }
    controls.minDistance = .01; controls.maxDistance = 100; controls.enablePan = false;
    if (instant) { camera.position.copy(to.p); controls.target.copy(to.t); applyLimits(v.fp); return; }
    tween = { from, to, t: 0, fp: v.fp };
  };
  setView('luar', true);

  /* ---------- interaksi: klik pintu ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null;
  canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', e => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
    const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (ray.intersectObjects([door, housing, banner], false).length && door.visible || (doorOpen > .98 && ray.intersectObject(housing, false).length)) { doorTarget = doorTarget > .5 ? 0 : 1; api.onDoor && api.onDoor(doorTarget > .5); }
  });

  /* ---------- loop ---------- */
  const resize = () => { const r = canvas.parentElement.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.fov = r.width / r.height < 1 ? 62 : 50; camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(resize); ro.observe(canvas.parentElement); resize();
  const clock = new THREE.Clock(); let raf = 0, alive = true;
  const loop = () => {
    if (!alive) return;
    const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
    doorOpen += (doorTarget - doorOpen) * Math.min(1, dt * 3.2); if (Math.abs(doorTarget - doorOpen) < .002) doorOpen = doorTarget; applyDoor();
    if (tween) {
      tween.t = Math.min(1, tween.t + dt / .9); const e = tween.t * tween.t * (3 - 2 * tween.t);
      camera.position.lerpVectors(tween.from.p, tween.to.p, e); controls.target.lerpVectors(tween.from.t, tween.to.t, e);
      if (tween.t >= 1) { applyLimits(tween.fp); tween = null; }
    }
    people.forEach((p, i) => { p.position.y = Math.abs(Math.sin(t * 1.6 + i)) * .004; p.userData.head.rotation.y = Math.sin(t * .7 + i * 2) * .25; });
    controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(loop);
  };
  loop();

  const api = {
    onDoor: null,
    setNight, get night() { return night; },
    setDoor(open) { doorTarget = open ? 1 : 0; },
    get doorOpen() { return doorTarget > .5; },
    setView, get view() { return view; },
    triangles: () => renderer.info.render.triangles,
    rakBensin: rak,
    dispose() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); scene.traverse(o => { o.geometry && o.geometry.dispose(); }); renderer.dispose(); },
  };
  return api;
}
