import * as THREE from 'three';
import { person, personFor, ARM } from './people';
import { gelas } from '../props3d/props';

/* Suasana di sekitar warung (murni visual, tidak menyentuh logika game):
   kendaraan lewat di dua lajur, pejalan kaki, gerobak bakso dan pangkalan ojek di seberang jalan,
   warga nongkrong minum kopi di bangku teras, dan kucing warung.
   Lajur kendaraan sengaja di paruh jauh jalan (z ≥ 8) supaya tidak melintas di antara kamera Luar/Pembeli dan warung. */

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .7, ...o });
const box = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };
const ball = (rx, ry, rz, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 9), mat); m.scale.set(rx, ry, rz); m.position.set(x, y, z); m.castShadow = true; return m; };
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const kdt = (r, dt) => 1 - Math.pow(1 - r, Math.min(6, dt * 60));
const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
/** Orang yang jauh dari kamera: tanpa bayangan dan tanpa detail terkecil. */
const far = g => { g.traverse(m => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; } }); for (const m of g.userData.fine || []) m.visible = false; return g; };
const walkPose = (g, sw) => { const { legs, arms } = g.userData; legs[0].rotation.x = sw * .55; legs[1].rotation.x = -sw * .55; arms[0].rotation.x = -sw * .4; arms[1].rotation.x = sw * .4; };
const sitPose = (g, leg = 1.45) => { g.userData.legs.forEach(l => { l.rotation.x = leg; }); };

function signTex(text, bg, fg) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 256, 64); g.fillStyle = fg; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 34);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const sign = (text, bg, fg, w, h) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: signTex(text, bg, fg), roughness: .6, side: THREE.DoubleSide }));

/* ---------- kendaraan (menghadap +x) ---------- */
const tyre = std('#1c1c20', { roughness: .9 });
const wheel = (r, w, x, z) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 14), tyre); m.rotation.x = Math.PI / 2; m.position.set(x, r, z); m.castShadow = true; return m; };
function car(color, lightMat, van = false) {
  const g = new THREE.Group(), L = van ? 3.0 : 2.6, body = std(color, { roughness: .45 }), glass = std('#22303a', { roughness: .2, metalness: .3 });
  g.add(box(L, .55, 1.3, body, 0, .55, 0));
  g.add(box(van ? L * .78 : L * .5, .5, 1.2, body, van ? -.2 : -.1, 1.05, 0));
  g.add(box(van ? L * .8 : L * .52, .34, 1.22, glass, van ? -.2 : -.1, 1.06, 0));
  g.add(box(van ? L * .78 : L * .5, .06, 1.24, body, van ? -.2 : -.1, 1.31, 0));
  [-1, 1].forEach(s => { g.add(wheel(.28, .22, L * .3, s * .6), wheel(.28, .22, -L * .3, s * .6)); g.add(box(.06, .14, .26, lightMat, L / 2, .62, s * .42)); g.add(box(.06, .12, .22, std('#b8281f', { emissive: '#7a0f0a', emissiveIntensity: .6 }), -L / 2, .62, s * .42)); });
  if (van) g.add(box(.5, .16, 1.0, std('#f4e2a0'), L * .28, 1.4, 0));   // papan trayek angkot
  return g;
}
function motor(color, lightMat, rider) {
  const g = new THREE.Group(), body = std(color, { roughness: .4 }), dark = std('#2a2b30');
  g.add(wheel(.26, .12, .62, 0), wheel(.26, .12, -.62, 0));
  g.add(box(1.0, .22, .3, body, -.05, .5, 0)); g.add(box(.6, .1, .34, dark, -.25, .66, 0));                    // badan + jok
  const fork = box(.1, .7, .1, dark, .55, .62, 0); fork.rotation.z = .35; g.add(fork);
  g.add(box(.08, .06, .62, dark, .42, .98, 0)); g.add(box(.1, .14, .16, lightMat, .6, .86, 0));               // setang + lampu
  if (rider) { rider.rotation.y = -Math.PI / 2; rider.position.set(-.22, .32, 0); sitPose(rider, 1.2); rider.userData.arms.forEach(a => { a.rotation.x = 1.25; }); g.add(rider); }
  return g;
}

/* ---------- kucing warung ---------- */
function makeCat(color = '#e08a3a') {
  const g = new THREE.Group(), fur = std(color, { roughness: .85 }), pale = std('#f6ead8', { roughness: .85 }), ink = new THREE.MeshBasicMaterial({ color: '#2a1f2e' });
  const body = ball(.105, .095, .17, fur, 0, .14, 0); g.add(body);
  const head = new THREE.Group(); head.position.set(0, .23, -.17); g.add(head);
  head.add(ball(.125, .11, .105, fur)); head.add(ball(.045, .03, .025, pale, 0, -.04, -.092));
  const eyes = [-1, 1].map(s => { const e = ball(.02, .028, .01, ink, s * .052, .012, -.098); e.castShadow = false; head.add(e); return e; });
  [-1, 1].forEach(s => { const ear = new THREE.Mesh(new THREE.ConeGeometry(.045, .08, 4), fur); ear.position.set(s * .075, .11, 0); ear.rotation.z = s * -.25; head.add(ear); });
  const legs = [[-.055, -.11], [.055, -.11], [-.055, .11], [.055, .11]].map(([x, z]) => { const p = new THREE.Group(); p.position.set(x, .085, z); const l = new THREE.Mesh(new THREE.CylinderGeometry(.028, .026, .085, 6), fur); l.position.y = -.0425; p.add(l); g.add(p); return p; });
  const tail = new THREE.Group(); tail.position.set(0, .17, .16); const tl = new THREE.Mesh(new THREE.CylinderGeometry(.018, .024, .22, 6), fur); tl.position.y = .1; tail.add(tl); tail.rotation.x = -.5; g.add(tail);
  g.userData = { body, head, eyes, legs, tail };
  return g;
}

export function createAmbience({ scene, addGlow }) {
  const root = new THREE.Group(); scene.add(root);
  const lightMat = addGlow(new THREE.MeshBasicMaterial({ color: '#dcd8c8' }), '#fff3c0', '#dcd8c8');
  const lampMat = addGlow(new THREE.MeshBasicMaterial({ color: '#c9c2a8' }), '#ffd98a', '#c9c2a8');

  /* ---------- marka: lajur kendaraan di paruh jauh jalan ---------- */
  const LANES = [{ z: 8.9, dir: 1, v: 6.2 }, { z: 11.7, dir: -1, v: 7.4 }];
  const edge = new THREE.Mesh(new THREE.BoxGeometry(60, .01, .1), new THREE.MeshBasicMaterial({ color: '#d9d2b0' })); edge.position.set(0, -.11, 7.45); root.add(edge);
  const dash = new THREE.InstancedMesh(new THREE.BoxGeometry(1.3, .01, .14), new THREE.MeshBasicMaterial({ color: '#e8d9a0' }), 24);
  for (let i = 0; i < 24; i++) dash.setMatrixAt(i, new THREE.Matrix4().makeTranslation(-27.6 + i * 2.4, -.11, 10.3)); root.add(dash);

  /* ---------- seberang jalan: trotoar, gerobak bakso, pangkalan ojek ---------- */
  const walk = box(60, .12, 3.9, std('#bdb9ae', { roughness: .95 }), 0, -.06, 15.55); walk.castShadow = false; root.add(walk);
  root.add(box(60, .16, .14, std('#bdbab0'), 0, -.06, 13.6));
  const wood = std('#b97a3e'), dark = std('#5a3a20');

  const bakso = new THREE.Group(); bakso.position.set(-3.6, 0, 14.6); root.add(bakso);
  bakso.add(box(1.5, .5, .8, std('#2f6fb3', { roughness: .5 }), 0, .7, 0));
  bakso.add(box(1.4, .5, .7, new THREE.MeshStandardMaterial({ color: '#cfe8ff', transparent: true, opacity: .28, roughness: .05 }), 0, 1.2, 0));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => bakso.add(box(.05, 1.3, .05, wood, a * .7, 1.35, b * .36)));
  bakso.add(box(1.7, .07, 1.05, std('#d63b2f', { roughness: .5 }), 0, 2.02, 0));
  [-1, 1].forEach(s => { const w = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .06, 16), tyre); w.rotation.z = Math.PI / 2; w.position.set(s * .82, .34, .05); bakso.add(w); });
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .26, 14), std('#c9ced2', { metalness: .6, roughness: .3 })); pot.position.set(.35, 1.09, 0); bakso.add(pot);
  [[-.4, 1.02, 0], [-.25, 1.02, .1], [-.3, 1.1, -.08], [-.12, 1.02, -.05]].forEach(([x, y, z]) => bakso.add(ball(.07, .07, .07, std('#b9a58c'), x, y, z)));
  const bs = sign('BAKSO', '#f6e7b0', '#b3261e', 1.3, .32); bs.position.set(0, 1.78, -.5); bs.rotation.y = Math.PI; bakso.add(bs);
  bakso.add(at(new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), lampMat), .6, 1.86, -.3));
  const seller = far(personFor('bapak')); seller.position.set(-3.6, 0, 15.5); root.add(seller);

  const ojek = new THREE.Group(); ojek.position.set(4.2, 0, 15.3); root.add(ojek);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => ojek.add(box(.08, 2.3, .08, dark, a * 1.4, 1.15, b * .8)));
  ojek.add(box(3.2, .08, 2.0, std('#2f9e44', { roughness: .6 }), 0, 2.34, 0));
  ojek.add(box(2.2, .06, .4, wood, 0, .45, .5)); [-.9, .9].forEach(x => ojek.add(box(.06, .45, .34, dark, x, .225, .5)));
  const os = sign('OJEK', '#f4f4f0', '#1f7a36', 1.6, .4); os.position.set(0, 2.1, -1.02); os.rotation.y = Math.PI; ojek.add(os);
  ojek.add(at(new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), lampMat), 0, 2.2, 0));
  const parked = motor('#2fa84f', lightMat, null); parked.rotation.y = Math.PI / 2 + .3; parked.position.set(-1.9, 0, -.2); parked.traverse(m => { m.castShadow = false; }); ojek.add(parked);
  const driver = far(personFor('ojol')); driver.position.set(4.6, .2, 15.85); sitPose(driver); root.add(driver);

  /* ---------- kendaraan lewat ---------- */
  const mk = (kind, color) => {
    const g = kind === 'motor' ? motor(color, lightMat, far(person({ shirt: pick(['#3f78c4', '#c0617a', '#6aa84f', '#e0a030']), pants: '#2b2d42', helmet: pick(['#d63b2f', '#f4f4f0', '#16161a']) }))) : car(color, lightMat, kind === 'angkot');
    g.traverse(m => { if (m.isMesh) m.castShadow = false; }); g.visible = false; root.add(g); return { g, on: false, x: 0 };
  };
  const fleet = [
    [mk('car', '#d9603b'), mk('motor', '#3a3f46'), mk('angkot', '#3f8ed6')],
    [mk('car', '#4a6f9c'), mk('motor', '#b3261e'), mk('car', '#e8e4d8')],
  ];
  const timers = [rnd(.5, 3), rnd(2, 5)];
  const stepTraffic = (t, dt) => {
    LANES.forEach((ln, i) => {
      const list = fleet[i];
      timers[i] -= dt;
      if (timers[i] <= 0) {
        const idle = list.filter(v => !v.on), clear = list.every(v => !v.on || Math.abs(v.x - (-30 * ln.dir)) > 9);
        if (idle.length && clear) { const v = pick(idle); v.on = true; v.x = -30 * ln.dir; v.g.rotation.y = ln.dir > 0 ? 0 : Math.PI; v.g.visible = true; }
        timers[i] = rnd(3, 9);
      }
      for (const v of list) {
        if (!v.on) continue;
        v.x += ln.dir * ln.v * dt; v.g.position.set(v.x, -.1 + Math.abs(Math.sin(t * 9 + v.x)) * .008, ln.z);
        if (Math.abs(v.x) > 31) { v.on = false; v.g.visible = false; }
      }
    });
  };

  /* ---------- pejalan kaki di trotoar seberang ---------- */
  const walkers = [
    { g: far(person({ shirt: '#c0617a', pants: '#3d5a80', skin: '#d9a47c' })), x: -12, dir: 1, v: 1.1, z: 16.3 },
    { g: far(personFor('ibuHijab')), x: 9, dir: -1, v: .9, z: 16.7 },
  ];
  walkers.forEach(w => root.add(w.g));
  const stepWalkers = (t, dt) => {
    walkers.forEach((w, i) => {
      w.x += w.dir * w.v * dt; if (Math.abs(w.x) > 24) w.dir = -Math.sign(w.x);
      const ph = t * 8 * w.v + i * 2;
      w.g.position.set(w.x, Math.abs(Math.sin(ph)) * .03, w.z); w.g.rotation.y = w.dir > 0 ? -Math.PI / 2 : Math.PI / 2; walkPose(w.g, Math.sin(ph));
    });
  };

  /* ---------- warga nongkrong minum kopi di bangku teras ---------- */
  const warga = personFor('cowok2'); warga.position.set(3.4, .2, .93); warga.rotation.y = Math.PI; sitPose(warga); root.add(warga);
  const mug = gelas(); mug.scale.setScalar(1.5); mug.position.set(0, -ARM - .1, -.05); warga.userData.elbows[1].add(mug);
  const stepWarga = t => {
    const u = warga.userData, p = (t % 8) / 8, k = p < .32 ? Math.sin(Math.PI * p / .32) : 0;     // sesekali menyeruput
    u.arms[1].rotation.x = .45 + k * 1.75; u.elbows[1].rotation.x = 1.0 - k * .75; u.arms[1].rotation.z = -.1 + k * .42;
    u.arms[0].rotation.x = .35; u.elbows[0].rotation.x = .8;
    u.head.rotation.y = Math.sin(t * .35) * .5; u.head.rotation.x = -k * .12;
    const mood = k > .2 ? 'joy' : 'happy'; if (mood !== u.mood) { u.mood = mood; u.setMood(mood); }
  };

  /* ---------- kucing: tidur di teras, sesekali pindah tempat ---------- */
  const cat = makeCat(); root.add(cat);
  const SPOTS = [[-3.0, 1.2], [2.0, 1.32], [3.75, .45]], LANE_Z = 1.4;   // menyusuri tepi trotoar, di belakang antrean
  const C = { spot: 0, state: 'sleep', timer: rnd(8, 16), path: [], x: SPOTS[0][0], z: SPOTS[0][1], yaw: 2.4 };
  const stepCat = (t, dt) => {
    const u = cat.userData; C.timer -= dt;
    if (C.state === 'sleep' && C.timer <= 0) { C.state = 'sit'; C.timer = rnd(2, 4); }
    else if (C.state === 'sit' && C.timer <= 0) {
      if (C.path.length || C.arrived) { C.arrived = false; C.state = 'sleep'; C.timer = rnd(14, 30); }
      else { let n = C.spot; while (n === C.spot) n = Math.floor(Math.random() * SPOTS.length); C.spot = n; C.path = [[C.x, LANE_Z], [SPOTS[n][0], LANE_Z], SPOTS[n]]; C.state = 'walk'; }
    }
    let moving = false;
    if (C.state === 'walk') {
      const [tx, tz] = C.path[0], dx = tx - C.x, dz = tz - C.z, d = Math.hypot(dx, dz);
      if (d < .04) { C.path.shift(); if (!C.path.length) { C.state = 'sit'; C.timer = rnd(3, 6); C.arrived = true; } }
      else { const s = Math.min(d, .9 * dt); C.x += dx / d * s; C.z += dz / d * s; C.yaw += angDiff(C.yaw, Math.atan2(-dx, -dz)) * kdt(.2, dt); moving = true; }
    }
    const asleep = C.state === 'sleep', ph = t * 11;
    cat.position.set(C.x, moving ? Math.abs(Math.sin(ph)) * .012 : 0, C.z); cat.rotation.y = C.yaw;
    const low = asleep ? 1 : 0, kk = kdt(.12, dt);
    u.body.position.y += ((asleep ? .095 : .14) - u.body.position.y) * kk; u.body.scale.y = .095 * (asleep ? 1 + Math.sin(t * 1.6) * .06 : 1);
    u.head.position.y += ((asleep ? .11 : C.state === 'sit' ? .25 : .23) - u.head.position.y) * kk; u.head.rotation.x = low * .25;
    u.eyes.forEach(e => { e.scale.y = asleep ? .004 : .028; });
    u.legs.forEach((l, i) => { l.visible = !asleep; l.rotation.x = moving ? Math.sin(ph + (i % 3 ? Math.PI : 0)) * .6 : 0; });
    u.tail.rotation.x = asleep ? -1.5 : -.5; u.tail.rotation.z = asleep ? .9 : Math.sin(t * (moving ? 6 : 2)) * .35;
  };

  return {
    step(t, dt) { stepTraffic(t, dt); stepWalkers(t, dt); stepWarga(t); stepCat(t, dt); seller.userData.head.rotation.y = Math.sin(t * .5) * .35; driver.userData.head.rotation.y = Math.sin(t * .4 + 1) * .4; },
    /** Diagnostik: keadaan kucing dan jumlah kendaraan yang sedang melintas. */
    state: () => ({ cat: C.state, catAt: [+C.x.toFixed(2), +C.z.toFixed(2)], vehicles: fleet.flat().filter(v => v.on).length }),
  };
}
function at(m, x, y, z) { m.position.set(x, y, z); return m; }
