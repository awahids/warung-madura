import * as THREE from 'three';
import { pouchGeometry } from './products';

/* Karakter manusia prosedural yang meniru sprite asli: proporsi dewasa (≈1,7 m), wajah berfitur, rambut,
   pakaian bermotif (batik, daster bunga, jaket, sarung), alas kaki. Menghadap −z.
   Rangka untuk animasi: legs[] (pivot pinggul), arms[] (pivot bahu) → elbows[] → hands[], torso (pivot pinggang), head (pivot leher). */

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .72, ...o });
const sh = m => { m.castShadow = true; m.receiveShadow = true; return m; };
const place = (m, x = 0, y = 0, z = 0) => { m.position.set(x, y, z); return m; };
const taper = (rt, rb, len, mat, seg = 10) => sh(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, len, seg), mat));
// bola dibagi pakai: resolusi menurut ukuran bagian (kecil = sedikit segmen) agar jumlah segitiga tetap hemat
const SPH = {};
const sphere = n => SPH[n] || (SPH[n] = new THREE.SphereGeometry(1, n, Math.max(4, Math.round(n * .7))));
const ell = (rx, ry, rz, mat, seg = 18) => {
  const big = Math.max(rx, ry, rz), n = big < .016 ? 6 : big < .03 ? 7 : big < .06 ? 9 : Math.min(seg, 14);
  const m = sh(new THREE.Mesh(sphere(n), mat)); m.scale.set(rx, ry, rz); return m;
};
const lathe = (pts, mat, seg = 24) => sh(new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), mat));
const rnd = (a, b) => a + Math.random() * (b - a);

/* ---------- tekstur kain (kanvas, di-cache) ---------- */
const TX = {};
function tex(key, w, h, draw, rep = [1, 1]) {
  if (!TX[key]) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 4; TX[key] = t;
  }
  return TX[key];
}
const kawung = (g, cx, cy, r, c) => { g.fillStyle = c; for (let a = 0; a < 4; a++) { g.save(); g.translate(cx, cy); g.rotate(a * Math.PI / 2); g.beginPath(); g.ellipse(0, r * .55, r * .38, r * .62, 0, 0, 7); g.fill(); g.restore(); } };
const T = {
  batik: () => tex('batik', 256, 256, (g, w, h) => {
    g.fillStyle = '#9e1f28'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const cx = x * 64 + 32, cy = y * 64 + 32; kawung(g, cx, cy, 26, '#e0b050'); kawung(g, cx, cy, 14, '#5a0f14'); g.fillStyle = '#f2d486'; g.beginPath(); g.arc(cx, cy, 4, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(60,10,10,.5)'; g.lineWidth = 2; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
  }, [1.5, 1.2]),
  floral: () => tex('floral', 256, 256, (g, w, h) => {
    g.fillStyle = '#4a2a1c'; g.fillRect(0, 0, w, h);
    const cols = ['#e8688a', '#f08a3a', '#f6c744', '#f4f1e6', '#d83a5a'];
    for (let i = 0; i < 46; i++) {
      const x = rnd(0, w), y = rnd(0, h), r = rnd(9, 18), c = cols[i % cols.length];
      g.fillStyle = '#3f7a3a'; g.beginPath(); g.ellipse(x + r, y + r * .3, r * .7, r * .3, .6, 0, 7); g.fill();
      g.fillStyle = c; for (let p = 0; p < 5; p++) { g.beginPath(); g.ellipse(x + Math.cos(p * 1.2566) * r * .55, y + Math.sin(p * 1.2566) * r * .55, r * .5, r * .38, p * 1.2566, 0, 7); g.fill(); }
      g.fillStyle = '#f6d65a'; g.beginPath(); g.arc(x, y, r * .22, 0, 7); g.fill();
    }
  }, [2, 2]),
  sarong: () => tex('sarong', 128, 128, (g, w, h) => {
    g.fillStyle = '#6b4a2a'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(30,15,5,.55)'; for (let i = 0; i < 4; i++) { g.fillRect(i * 32 + 4, 0, 10, h); g.fillRect(0, i * 32 + 4, w, 10); }
    g.fillStyle = 'rgba(190,150,100,.45)'; for (let i = 0; i < 4; i++) { g.fillRect(i * 32 + 18, 0, 4, h); g.fillRect(0, i * 32 + 18, w, 4); }
  }, [3, 2]),
  jacket: () => tex('jacket', 256, 128, (g, w, h) => {      // lathe: u=0.5 depan
    g.fillStyle = '#2fa84f'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#12301a'; g.fillRect(w * .22, 0, 14, h); g.fillRect(w * .78 - 14, 0, 14, h);          // garis samping hitam
    g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(w * .5 - 2, 0, 4, h);                                      // ritsleting depan
    g.fillStyle = '#e8e8e8'; g.fillRect(w * .5 - 22, h * .3, 12, 6);                                         // label kecil
    g.fillStyle = '#cfd6da'; g.fillRect(0, h * .43, w, 7); g.fillRect(0, h * .55, w, 7);                       // pita reflektif melingkar (dada/lengan)
    g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(0, h * .43, w, 2); g.fillRect(0, h * .55, w, 2);
  }),
  tee: () => tex('tee', 256, 128, (g, w, h) => {
    g.fillStyle = '#d8c9a8'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2d2d33'; g.beginPath(); g.moveTo(w * .5 - 14, h * .32); g.lineTo(w * .5, h * .18); g.lineTo(w * .5 + 14, h * .32); g.closePath(); g.fill();   // logo segitiga
    g.fillRect(w * .5 - 16, h * .36, 32, 4);
  }),
  hoodie: () => tex('hoodie', 256, 128, (g, w, h) => {
    g.fillStyle = '#6b7280'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(w * .5 - 40, h * .62, 80, h * .3);                           // kantong kanguru
    g.fillStyle = '#e8e8e8'; g.fillRect(w * .5 - 14, h * .1, 3, h * .22); g.fillRect(w * .5 + 11, h * .1, 3, h * .22);   // tali
  }),
  dark: () => tex('dark', 64, 64, (g, w, h) => { g.fillStyle = '#26272d'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 80; i++) g.fillRect(rnd(0, w), rnd(0, h), 2, 2); }),
  denim: () => tex('denim', 64, 64, (g, w, h) => { g.fillStyle = '#3f5f93'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.07)'; for (let i = 0; i < w; i += 3) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); } }, [2, 4]),
};

/** Tekstur helai rambut: garis halus searah meridian (mengalir dari belahan ke belakang). */
const hairTexCache = {};
function hairTex(color) {
  if (hairTexCache[color]) return hairTexCache[color];
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = color; g.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 260; i++) { const x = rnd(0, 256), l = rnd(.05, .6) < .3 ? 1 : 0; g.strokeStyle = l ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.22)'; g.lineWidth = rnd(.6, 1.6); g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + rnd(-6, 6), 40, x + rnd(-8, 8), 85, x + rnd(-4, 4), 128); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.set(2, 1); return (hairTexCache[color] = t);
}

/* ---------- bagian tubuh ---------- */
const shade = (hex, f) => new THREE.Color(hex).multiplyScalar(f).getStyle();
const capsule = (r, len, mat) => sh(new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(.002, len - r * 1.2), 1, 5), mat));

/** Tangan berjari: telapak, empat jari tiga ruas, ibu jari dua ruas. sx = sisi (−1 kiri, +1 kanan). Bisa menggenggam: userData.setCurl(0..1). */
function makeHand(skin, glove, sx) {
  const mat = std(glove || skin, { roughness: glove ? .5 : .62 });
  const h = new THREE.Group(); h.position.y = -.29;                         // pergelangan
  h.add(place(ell(.019, .046, .038, mat, 12), 0, -.046, 0));                // telapak (tipis di sumbu x)
  h.add(place(ell(.016, .014, .036, mat, 10), 0, -.01, 0));                  // pergelangan→telapak
  const spec = [[-.026, .037, .026, .02], [-.0085, .043, .03, .021], [.0085, .04, .028, .02], [.026, .031, .022, .017]];   // z, panjang 3 ruas
  const fingers = spec.map(([z, l1, l2, l3], i) => {
    const r = .0098 - i * .0004;
    const j1 = new THREE.Group(); j1.position.set(0, -.088, z); h.add(j1); j1.add(place(capsule(r, l1, mat), 0, -l1 / 2, 0));
    const j2 = new THREE.Group(); j2.position.y = -l1; j1.add(j2); j2.add(place(capsule(r * .94, l2, mat), 0, -l2 / 2, 0));
    const j3 = new THREE.Group(); j3.position.y = -l2; j2.add(j3); j3.add(place(capsule(r * .86, l3, mat), 0, -l3 / 2, 0));
    if (!glove) j3.add(place(ell(.0058, .0075, .0025, std('#e8c8b8', { roughness: .35 }), 8), 0, -l3 * .55, -.0075));      // kuku
    return [j1, j2, j3];
  });
  const t1 = new THREE.Group(); t1.position.set(0, -.03, -.036); t1.rotation.x = .75; h.add(t1); t1.add(place(capsule(.0118, .034, mat), 0, -.017, 0));
  const t2 = new THREE.Group(); t2.position.y = -.034; t1.add(t2); t2.add(place(capsule(.0105, .028, mat), 0, -.014, 0));
  const k = [1.15, 1.55, 1.0], side = -sx;                                    // jari menekuk ke arah garis tengah tubuh
  let cur = -1;
  h.userData.setCurl = c => {
    if (Math.abs(c - cur) < .005) return; cur = c;
    fingers.forEach((f, i) => { const b = 1 - i * .04; f.forEach((j, n) => { j.rotation.z = side * c * k[n] * b; }); });
    t1.rotation.x = .75 - c * .35; t1.rotation.z = side * c * .35; t2.rotation.z = side * c * .6;
  };
  h.userData.setCurl(.28);
  return h;
}

/** Rambut dari kumpulan helai (ellipsoid) agar bervolume dan tidak seperti topi. */
function makeHair(style, color, parent, opts = {}) {
  const hm = new THREE.MeshStandardMaterial({ map: hairTex(color), roughness: .8 });
  const mat = () => hm;
  const tuft = (rx, ry, rz, x, y, z, rx_ = 0, ry_ = 0, rz_ = 0) => { const m = ell(rx, ry, rz, mat(), 10); m.position.set(x, y, z); m.rotation.set(rx_, ry_, rz_); parent.add(m); return m; };
  const baseMat = new THREE.MeshStandardMaterial({ map: hairTex(color), roughness: .8 });
  const cap = (thetaLen, scale = 1) => {
    const top = sh(new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI * thetaLen), baseMat)); top.scale.set(.1 * scale, .126 * scale, .112 * scale); top.position.set(0, .022, .008); parent.add(top);
    const back = sh(new THREE.Mesh(new THREE.SphereGeometry(1, 20, 6, Math.PI / 2 - Math.PI * .68, Math.PI * 1.36, Math.PI * thetaLen, Math.PI * .24), baseMat)); back.scale.set(.1 * scale, .126 * scale, .112 * scale); back.position.set(0, .022, .008); parent.add(back);
  };
  if (style === 'short' || style === 'swept') {
    cap(.4, 1.01);
    if (opts.front !== false) for (let i = 0; i < 9; i++) { const a = -1.1 + i * .275; tuft(.02, .008, .024, Math.sin(a) * .088, .066 - Math.abs(a) * .012, -.082 * Math.cos(a) - .006, .5, a * .6, a * .3); }   // poni/garis rambut depan (helai pipih)
    for (let i = 0; i < 4; i++) tuft(.034, .02, .04, rnd(-.04, .04), .105 + rnd(-.004, .006), rnd(-.045, .03), rnd(-.3, .3), rnd(-1, 1), rnd(-.3, .3));  // volume atas
    [-1, 1].forEach(sx => tuft(.011, .032, .017, sx * .092, -.004, -.034, 0, 0, sx * -.12));                                                          // cambang
    if (style === 'swept') { tuft(.045, .018, .03, -.02, .088, -.075, .3, 0, .35); tuft(.03, .014, .02, -.045, .072, -.092, .4, 0, .5); }              // jambul menyamping
    parent.add(place(sh(new THREE.Mesh(new THREE.BoxGeometry(.0018, .008, .09), std(shade(color, .6)))), style === 'swept' ? .03 : .018, .118, -.01));   // belahan
  } else if (style === 'bun') {
    cap(.44, 1.012);
    [-1, 1].forEach(sx => { tuft(.009, .036, .03, sx * .089, .016, .004, 0, 0, sx * -.08); tuft(.0065, .03, .009, sx * .082, .028, -.07, 0, 0, sx * -.25); });   // rambut di sisi + helai di pelipis
    for (let i = 0; i < 7; i++) { const a = -.95 + i * .32; tuft(.017, .007, .02, Math.sin(a) * .085, .07 - Math.abs(a) * .014, -.084 * Math.cos(a) - .004, .5, a * .6, a * .25); }   // garis rambut depan
    for (let i = 0; i < 3; i++) tuft(.028, .014, .036, rnd(-.03, .03), .112, rnd(-.04, .0), rnd(-.2, .2), rnd(-1, 1), 0);                              // ditarik rapi ke belakang
    parent.add(place(sh(new THREE.Mesh(new THREE.BoxGeometry(.0016, .006, .086), std('#c9a07c', { roughness: .6 }))), 0, .118, -.012));                 // belahan tengah (kulit kepala)
    const bun = ell(.052, .05, .046, mat(), 16); bun.position.set(0, .08, .104); parent.add(bun);
    const tie = sh(new THREE.Mesh(new THREE.TorusGeometry(.036, .0042, 6, 18), std('#c0281a', { roughness: .5 }))); tie.position.set(0, .066, .093); tie.rotation.x = Math.PI / 2 - .5; parent.add(tie);
    for (let i = 0; i < 3; i++) tuft(.012, .02, .012, rnd(-.03, .03), .08 + rnd(-.02, .025), .1 + rnd(-.01, .03), rnd(-1, 1), rnd(-1, 1), rnd(-1, 1));
  }
}

/** Kepala berfitur lengkap (menghadap −z). Opsi: skin, hair (gaya), hairColor, mustache, glasses, stubble, wrinkles, brow (tebal), eye. */
function makeHead(o) {
  const g = new THREE.Group(), skin = o.skin, s = std(skin, { roughness: .58 }), dark = std(shade(skin, .8), { roughness: .6 });
  // tengkorak + rahang + dagu + pipi + tulang alis
  g.add(place(ell(.094, .108, .1, s, 28), 0, .012, .004));
  g.add(place(ell(.082, .074, .088, s, 24), 0, -.048, -.012));
  g.add(place(ell(.034, .027, .034, s, 14), 0, -.097, -.058));
  g.add(place(ell(.072, .014, .03, s, 14), 0, .036, -.08));
  const hairCol = o.hairColor || '#1a1410', browMat = std(o.browColor || shade(hairCol, .85), { roughness: .8 });
  const eyeW = std('#f6f3ee', { roughness: .25 }), iris = std(o.eye || '#3a2416', { roughness: .2 }), pupil = std('#0a0806', { roughness: .15 });
  const hi = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: .8 });
  const lip = std(o.lip || shade(skin, .62), { roughness: .45 });
  [-1, 1].forEach(sx => {
    const ex = sx * .038;
    g.add(place(ell(.027, .017, .01, dark, 12), ex, .015, -.0885));                                  // cekungan mata
    g.add(place(ell(.0168, .0128, .012, eyeW, 14), ex, .014, -.0915));                              // bola mata
    g.add(place(ell(.0094, .0094, .004, iris, 12), ex, .014, -.1022));                              // iris
    g.add(place(ell(.0046, .0046, .003, pupil, 8), ex, .014, -.1045));                              // pupil
    g.add(place(ell(.0024, .0024, .002, hi, 6), ex + sx * -.0035, .0185, -.1055));                  // pantulan cahaya
    g.add(place(ell(.0185, .0044, .0125, s, 10), ex, .0242, -.0925));                               // kelopak atas
    g.add(place(ell(.017, .0026, .0125, dark, 10), ex, .0268, -.0935));                             // garis bulu mata
    g.add(place(ell(.0165, .0035, .0115, s, 10), ex, .0035, -.0925));                               // kelopak bawah
    // alis melengkung (tabung mengikuti kurva)
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(sx * -.021, -.002, 0), new THREE.Vector3(sx * -.004, .0075, 0), new THREE.Vector3(sx * .02, .0005 + (o.browLow ? -.003 : 0), 0)]);
    const brow = sh(new THREE.Mesh(new THREE.TubeGeometry(curve, 5, o.brow || .0052, 5), browMat)); brow.position.set(ex, .047, -.0945); brow.rotation.y = sx * .35; g.add(brow);
    // telinga
    g.add(place(ell(.011, .027, .017, s, 10), sx * .0925, 0, .008)); g.add(place(ell(.0058, .018, .008, dark, 8), sx * .0975, 0, .005)); g.add(place(ell(.0075, .008, .01, s, 8), sx * .092, -.026, .01));
    // sayap hidung & lipatan
    g.add(place(ell(.0082, .0085, .0085, s, 8), sx * .0108, -.0205, -.1015));
    g.add(place(ell(.0035, .0026, .003, pupil, 6), sx * .0072, -.0262, -.1085));
    g.add(place(ell(.003, .003, .004, dark, 6), sx * .0215, -.0585, -.0995));
    if (o.wrinkles) { const f = place(sh(new THREE.Mesh(new THREE.BoxGeometry(.0016, .026, .003), dark)), sx * .027, -.041, -.0975); f.rotation.z = sx * .45; g.add(f); const eyeL = place(sh(new THREE.Mesh(new THREE.BoxGeometry(.012, .0012, .003), dark)), sx * .055, .01, -.083); eyeL.rotation.z = sx * -.3; g.add(eyeL); }
  });
  g.add(place(ell(.007, .022, .01, s, 8), 0, 0, -.103));                                             // batang hidung
  g.add(place(ell(.0125, .0108, .0125, s, 12), 0, -.0215, -.1085));                                  // ujung hidung
  g.add(place(ell(.022, .0048, .009, lip, 12), 0, -.0535, -.099));                                   // bibir atas
  g.add(place(ell(.0195, .0066, .0095, lip, 12), 0, -.0625, -.0985));                                // bibir bawah
  g.add(place(sh(new THREE.Mesh(new THREE.BoxGeometry(.036, .0014, .004), std('#2a0f0c'))), 0, -.0578, -.1025));   // celah mulut
  if (o.mustache) { [-1, 1].forEach(sx => { const m = ell(.017, .0068, .011, browMat, 10); m.position.set(sx * .012, -.043, -.1045); m.rotation.z = sx * -.25; g.add(m); }); }
  if (o.stubble) g.add(place(ell(.079, .05, .09, new THREE.MeshStandardMaterial({ color: '#1a1410', transparent: true, opacity: .2, roughness: 1 }), 20), 0, -.06, -.006));
  if (o.wrinkles) [.062, .07, .078].forEach((y, i) => g.add(place(sh(new THREE.Mesh(new THREE.BoxGeometry(.05 - i * .008, .0013, .003), dark)), 0, y, -.0935 + i * .0008)));
  if (o.glasses) {
    const fm = std('#16161a', { metalness: .6, roughness: .3 });
    [-1, 1].forEach(sx => { g.add(place(sh(new THREE.Mesh(new THREE.TorusGeometry(.0225, .0019, 4, 14), fm)), sx * .038, .014, -.108)); g.add(place(sh(new THREE.Mesh(new THREE.BoxGeometry(.0018, .0018, .1), fm)), sx * .0605, .018, -.054)); });
    g.add(place(sh(new THREE.Mesh(new THREE.BoxGeometry(.02, .002, .002), fm)), 0, .02, -.109));
    g.add(place(new THREE.Mesh(new THREE.CircleGeometry(.0215, 20), new THREE.MeshStandardMaterial({ color: '#cfe8ff', transparent: true, opacity: .12, roughness: .05 })), -.038, .014, -.1085));
    g.add(place(new THREE.Mesh(new THREE.CircleGeometry(.0215, 20), new THREE.MeshStandardMaterial({ color: '#cfe8ff', transparent: true, opacity: .12, roughness: .05 })), .038, .014, -.1085));
  }
  if (o.hair) makeHair(o.hair, hairCol, g, { front: o.hairFront });
  return g;
}

/** Bangun manusia sesuai opsi. */
function buildHuman(o) {
  const g = new THREE.Group(), skin = std(o.skin, { roughness: .6 });
  const topMat = o.topTex ? new THREE.MeshStandardMaterial({ map: o.topTex(), roughness: .75 }) : std(o.top);
  const sleeveMat = o.sleeveTex ? new THREE.MeshStandardMaterial({ map: o.sleeveTex(), roughness: .75 }) : topMat;
  const botMat = o.botTex ? new THREE.MeshStandardMaterial({ map: o.botTex(), roughness: .8 }) : std(o.bottom || '#333');
  const HIP = .84, belly = o.belly || 0, B = o.build || 1;

  // kaki (pivot pinggul)
  const shortPants = o.legs === 'shorts', cover = o.legs === 'skirt' || o.legs === 'sarong';
  const legs = [-.09, .09].map(x => {
    const piv = new THREE.Group(); piv.position.set(x, HIP, 0);
    const thighM = shortPants || o.legs === 'pants' ? botMat : skin, calfM = o.legs === 'pants' ? botMat : skin;
    piv.add(place(taper(.088 * B, .062, .42, cover ? skin : thighM), 0, -.21, 0));
    piv.add(place(ell(.062, .062, .062, cover ? skin : thighM, 12), 0, -.42, 0));
    piv.add(place(taper(.06, .042, .37, calfM), 0, -.605, 0));
    // alas kaki
    if (o.shoe === 'sneaker') { piv.add(place(sh(new THREE.Mesh(new THREE.BoxGeometry(.1, .075, .27), std(o.shoeColor || '#e8e8e8', { roughness: .5 }))), 0, -.765, -.04)); piv.add(place(sh(new THREE.Mesh(new THREE.BoxGeometry(.104, .02, .28), std('#2a2a2a'))), 0, -.808, -.04)); }
    else { piv.add(place(sh(new THREE.Mesh(new THREE.BoxGeometry(.095, .018, .265), std(o.shoeColor || '#3a2a1c'))), 0, -.805, -.04)); piv.add(place(sh(new THREE.Mesh(new THREE.BoxGeometry(.1, .012, .05), std(o.shoeColor || '#3a2a1c'))), 0, -.78, -.07)); piv.add(place(ell(.044, .03, .09, skin, 10), 0, -.78, -.05)); }
    g.add(piv); return piv;
  });
  // pinggul
  g.add(place(ell(.175 * B, .13, .12, o.legs === 'pants' || shortPants ? botMat : (cover ? botMat : botMat), 18), 0, HIP - .01, 0));

  // badan atas (pivot pinggang)
  const torso = new THREE.Group(); torso.position.y = HIP; g.add(torso);
  const dress = o.legs === 'skirt';
  const prof = [[0, 0], [.155 * B, 0], [.172 * B, .08], [(.162 + belly) * B, .19], [(.17 + belly * 1.1) * B, .3], [.205 * B, .5], [.208 * B, .56], [.17, .62], [.075, .655], [0, .665]];
  if (dress) prof.unshift([0, -.4], [.27, -.4], [.255, -.3], [.21, -.12], [.17, 0]);
  const tm = lathe(prof, topMat); tm.scale.z = .62; torso.add(tm);
  if (o.legs === 'sarong') { const sg = lathe([[0, .2], [.205, .2], [.215, .1], [.23, -.15], [.245, -.5], [0, -.5]], botMat, 22); sg.scale.z = .75; sg.position.y = 0; g.add(sg); sg.position.y = HIP; }
  torso.add(place(taper(.046, .052, .12, skin), 0, .69, 0));                         // leher
  if (o.collar) { const c = sh(new THREE.Mesh(new THREE.TorusGeometry(.062, .013, 6, 18), std(o.collar))); c.rotation.x = Math.PI / 2; c.position.y = .645; c.scale.y = .8; torso.add(c); }
  if (o.vneck) { const v = sh(new THREE.Mesh(new THREE.ConeGeometry(.04, .13, 4), std(o.vneck))); v.rotation.x = Math.PI; v.rotation.y = Math.PI / 4; v.position.set(0, .57, -.065); v.scale.z = .3; torso.add(v); }

  // lengan
  const long = o.sleeves !== 'short', hands = [], elbows = [];
  const arms = [-1, 1].map(sx => {
    const piv = new THREE.Group(); piv.position.set(sx * .222 * B, .54, 0); piv.rotation.z = sx * -.1; torso.add(piv);
    piv.add(ell(.062, .062, .06, sleeveMat, 12));
    piv.add(place(taper(.056, .046, .29, sleeveMat), 0, -.15, 0));
    const el = new THREE.Group(); el.position.y = -.29; piv.add(el); elbows.push(el);
    el.add(ell(.047, .047, .047, long ? sleeveMat : skin, 10));
    el.add(place(taper(.046, .036, .26, long ? sleeveMat : skin), 0, -.14, 0));
    const hd = makeHand(o.skin, o.gloves, sx); el.add(hd); hands.push(hd);
    return piv;
  });

  // kepala
  const headG = new THREE.Group(); headG.position.y = .79; torso.add(headG);
  headG.add(makeHead(o));
  if (o.peci) { const p = taper(.088, .098, .085, std(o.peci, { roughness: .95 })); p.position.set(0, .115, .004); p.rotation.x = -.08; headG.add(p); const band = taper(.0995, .0995, .012, std('#c9a640', { metalness: .3 })); band.position.set(0, .082, .004); band.rotation.x = -.08; headG.add(band); }
  if (o.cap) {
    const dome = sh(new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI * .5), std(o.cap))); dome.scale.set(.108, .1, .118); dome.position.set(0, .05, .005); headG.add(dome);
    const brim = sh(new THREE.Mesh(new THREE.BoxGeometry(.13, .01, .095), std(o.cap))); brim.position.set(0, .062, -.11); brim.rotation.x = .12; headG.add(brim);
  }
  if (o.helmet) {
    const hm = std(o.helmet, { roughness: .2, metalness: .2 });
    const top = sh(new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI * .47), hm)); top.scale.set(.128, .136, .142); top.position.set(0, .018, .006); headG.add(top);
    const side = sh(new THREE.Mesh(new THREE.SphereGeometry(1, 20, 6, Math.PI / 2 - Math.PI * .7, Math.PI * 1.4, Math.PI * .47, Math.PI * .25), hm)); side.scale.set(.128, .136, .142); side.position.set(0, .018, .006); headG.add(side);
    const visor = sh(new THREE.Mesh(new THREE.SphereGeometry(1, 20, 4, Math.PI * 1.5 - Math.PI * .6, Math.PI * 1.2, 1.1, .38), std('#0e1216', { roughness: .08, metalness: .6, side: THREE.DoubleSide })));
    visor.scale.set(.1305, .1385, .1445); visor.position.set(0, .018, .006); headG.add(visor);                                                              // visor melengkung
    headG.add(place(sh(new THREE.Mesh(new THREE.BoxGeometry(.012, .01, .2), std('#f4f4f4'))), 0, .148, -.002));                                              // garis helm
  }
  if (o.hood) {
    const hd = sh(new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI * .62), std(o.hood))); hd.scale.set(.122, .142, .132); hd.position.set(0, .016, .018); headG.add(hd);
    const back = sh(new THREE.Mesh(new THREE.SphereGeometry(1, 20, 6, Math.PI / 2 - Math.PI * .72, Math.PI * 1.44, Math.PI * .62, Math.PI * .3), std(o.hood))); back.scale.set(.122, .142, .132); back.position.set(0, .016, .018); headG.add(back);
  }
  if (o.mask) headG.add(place(sh(new THREE.Mesh(new THREE.BoxGeometry(.15, .07, .06), std('#0c0c0e', { roughness: .9 }))), 0, -.04, -.085));
  if (o.deliveryBox) {   // tas boks pengantar makanan (insulated), persegi, di punggung
    const bx = new THREE.Group(), body = std(o.deliveryBox, { roughness: .55 });
    bx.add(sh(new THREE.Mesh(new THREE.BoxGeometry(.4, .4, .38), body)));
    bx.add(place(sh(new THREE.Mesh(new THREE.BoxGeometry(.412, .035, .392), std('#1f8a3c', { roughness: .5 }))), 0, .13, 0));            // tutup (garis sambungan)
    bx.add(place(sh(new THREE.Mesh(new THREE.BoxGeometry(.412, .018, .392), std('#16161a'))), 0, .2, 0));                              // pinggir atas hitam
    bx.add(place(new THREE.Mesh(new THREE.BoxGeometry(.3, .012, .012), std('#d8dde0', { metalness: .4, roughness: .25 })), 0, -.05, .192));   // pita reflektif
    bx.add(place(new THREE.Mesh(new THREE.BoxGeometry(.012, .3, .012), std('#d8dde0', { metalness: .4, roughness: .25 })), .15, 0, .192));
    const badge = new THREE.Mesh(new THREE.CircleGeometry(.07, 24), std('#f4f4f4', { roughness: .4 })); badge.position.set(0, .03, .1925); bx.add(badge);          // lambang generik
    bx.add(place(new THREE.Mesh(new THREE.CircleGeometry(.035, 24), std(o.deliveryBox)), 0, .03, .1935));
    bx.position.set(0, .4, .3); torso.add(bx);
    [-1, 1].forEach(sx => torso.add(place(sh(new THREE.Mesh(new THREE.BoxGeometry(.04, .42, .02), std('#16161a'))), sx * .11, .4, -.115)));   // tali bahu
  }
  if (o.backpack) {
    const bp = new THREE.Group(); bp.add(sh(new THREE.Mesh(new THREE.BoxGeometry(.28, .36, .13), std(o.backpack, { roughness: .7 }))));
    bp.add(place(sh(new THREE.Mesh(new THREE.BoxGeometry(.2, .14, .03), std('#1c1c20'))), 0, -.05, .08));
    bp.position.set(0, .35, .14); torso.add(bp);
    [-1, 1].forEach(sx => torso.add(place(sh(new THREE.Mesh(new THREE.BoxGeometry(.03, .34, .02), std('#1c1c20'))), sx * .1, .38, -.11)));   // tali ransel
  }
  g.userData = { legs, arms, elbows, hands, torso, head: headG };
  if (o.scale) g.scale.setScalar(o.scale);
  // hemat biaya bayangan: bagian sangat kecil (jari, kelopak, helai) tidak ikut melempar/menerima bayangan
  const fine = [];
  g.traverse(m => { if (m.isMesh) { m.geometry.computeBoundingSphere(); const r = m.geometry.boundingSphere.radius * Math.max(m.scale.x, m.scale.y, m.scale.z); if (r < .055) { m.castShadow = false; m.receiveShadow = false; } if (r < .03) fine.push(m); } });
  g.userData.fine = fine;   // bagian halus (jari, kelopak, helai): disembunyikan untuk orang yang jauh dari kamera (LOD)
  return g;
}

/* ---------- tipe orang di game ---------- */
const LOOK = {
  ojol: { skin: '#c58b5a', topTex: T.jacket, sleeveTex: T.jacket, legs: 'pants', bottom: '#1b1b20', shoe: 'sneaker', shoeColor: '#2a2a30', helmet: '#2fa84f', gloves: '#16161a', hair: 'short', collar: '#16161a', deliveryBox: '#2fa84f' },
  pemuda: { skin: '#c98e62', topTex: T.tee, sleeves: 'short', legs: 'shorts', bottom: '#34343c', shoe: 'sandal', shoeColor: '#3a2a1c', hair: 'swept', hairColor: '#171210', backpack: '#2b2d35', eye: '#2e1c12' },
  cowok: { skin: '#c58b5a', topTex: T.hoodie, sleeveTex: null, top: '#6b7280', legs: 'pants', bottom: '#4b5240', shoe: 'sneaker', shoeColor: '#8a8a82', cap: '#2f6b3a', hair: 'short', hairColor: '#1c1612', mustache: true, stubble: true },
  ibu: { skin: '#b87a50', topTex: T.floral, sleeves: 'short', legs: 'skirt', botTex: T.floral, shoe: 'sandal', shoeColor: '#6a3a2a', hair: 'bun', hairColor: '#241812', scale: .94, build: .95 },
  juragan: { skin: '#b98258', top: '#f2efe6', legs: 'sarong', botTex: T.sarong, shoe: 'sandal', shoeColor: '#4a3220', peci: '#f4f4f0', hair: 'short', hairFront: false, hairColor: '#d8d8d4', browColor: '#bdbdb8', mustache: true, wrinkles: true, glasses: true, brow: .006, belly: .025, vneck: '#ddd8cc', collar: '#e8e4d8', eye: '#4a3322' },
  hoodie: { skin: '#b98258', topTex: T.dark, sleeveTex: T.dark, legs: 'pants', bottom: '#2a2b33', shoe: 'sneaker', shoeColor: '#1c1c20', hood: '#26272d', mask: true, hair: null, scale: 1.02 },
  penjaga: { skin: '#b98258', topTex: T.batik, sleeveTex: T.batik, legs: 'sarong', botTex: T.sarong, shoe: 'sandal', shoeColor: '#4a3220', peci: '#151515', hair: 'short', hairFront: false, hairColor: '#17120f', mustache: true, wrinkles: true, brow: .0058, belly: .02, collar: '#7a1219' },
};
/** Figur umum untuk halaman demo (kompatibel dengan versi lama). */
export function person({ shirt = '#2f9e44', pants = '#2d5fa8', skin = '#c58b5a', helmet = null, hair = '#1a1410' } = {}) {
  return buildHuman({ skin, top: shirt, legs: 'pants', bottom: pants, shoe: 'sneaker', shoeColor: '#222', helmet, hair: helmet ? null : 'short', hairColor: hair });
}
/** Figur sesuai tipe pelanggan di logika game (ojol, pemuda, cowok, ibu, juragan, hoodie) atau 'penjaga'. */
export function personFor(type) { return buildHuman(LOOK[type] || LOOK.pemuda); }

/** Kantong kresek berisi belanjaan (tergantung dari tangan; titik asal = gagang di atas). */
export function makeBag(color = '#d63b2f') {
  const g = new THREE.Group();
  const body = new THREE.Mesh(pouchGeometry(.2, .26, .09), new THREE.MeshStandardMaterial({ color, roughness: .35, transparent: true, opacity: .88, side: THREE.DoubleSide }));
  body.position.y = -.17; body.castShadow = true; g.add(body);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(.045, .006, 6, 16), std('#e8e8e8')); handle.position.y = -.03; g.add(handle);
  [['#f6c744', -.04, -.2], ['#2f80d6', .04, -.17], ['#e8e8e8', 0, -.12]].forEach(([c, x, y]) => { const it = new THREE.Mesh(new THREE.BoxGeometry(.05, .08, .04), std(c)); it.position.set(x, y, 0); g.add(it); });
  return g;
}
/** Lembar uang kertas (dipegang saat membayar). */
export function makeBill(color = '#3f9e58') {
  const m = new THREE.Mesh(new THREE.BoxGeometry(.13, .005, .06), std(color, { roughness: .6 })); m.castShadow = true;
  m.add(new THREE.Mesh(new THREE.BoxGeometry(.06, .0055, .035), std('#e8f3e0')));
  return m;
}
