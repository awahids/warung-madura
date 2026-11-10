import * as THREE from 'three';
import { pouchGeometry } from './products';

/* Karakter manusia prosedural yang meniru sprite asli: proporsi dewasa (≈1,7 m), wajah berfitur, rambut,
   pakaian bermotif (batik, daster bunga, jaket, sarung), alas kaki. Menghadap −z.
   Rangka untuk animasi: legs[] (pivot pinggul), arms[] (pivot bahu) → elbows[] → hands[], torso (pivot pinggang), head (pivot leher). */

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .72, ...o });
const sh = m => { m.castShadow = true; m.receiveShadow = true; return m; };
const place = (m, x = 0, y = 0, z = 0) => { m.position.set(x, y, z); return m; };
const taper = (rt, rb, len, mat, seg = 14) => sh(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, len, seg), mat));
const ell = (rx, ry, rz, mat, seg = 20) => { const m = sh(new THREE.Mesh(new THREE.SphereGeometry(1, seg, Math.round(seg * .8)), mat)); m.scale.set(rx, ry, rz); return m; };
const lathe = (pts, mat, seg = 36) => sh(new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), mat));
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

/* ---------- bagian tubuh ---------- */
function makeHead({ skin, hair = null, hairColor = '#1a1410', mustache = false }) {
  const g = new THREE.Group(), s = std(skin, { roughness: .6 });
  g.add(ell(.095, .122, .104, s, 28));
  const eyeW = std('#f4f1ec', { roughness: .3 }), pupil = std('#15110e', { roughness: .2 }), brow = std(hairColor === '#d8d8d8' ? '#9a9a9a' : '#1a1410');
  [-1, 1].forEach(sx => {
    g.add(place(ell(.017, .012, .01, eyeW, 12), sx * .038, .016, -.092));
    g.add(place(ell(.0085, .0085, .006, pupil, 10), sx * .038, .016, -.1));
    const b = place(sh(new THREE.Mesh(new THREE.BoxGeometry(.042, .008, .01), brow)), sx * .039, .047, -.093); b.rotation.z = -sx * .12; g.add(b);
    g.add(place(ell(.012, .026, .018, s, 10), sx * .097, 0, .005));                       // telinga
  });
  g.add(place(ell(.015, .021, .02, s, 12), 0, -.014, -.104));                               // hidung
  g.add(place(ell(.026, .0065, .01, std('#7a3028', { roughness: .5 }), 12), 0, -.055, -.097)); // bibir
  if (mustache) g.add(place(ell(.03, .007, .012, std('#1a1410'), 10), 0, -.04, -.1));
  // rambut
  const hm = std(hairColor, { roughness: .85 });
  if (hair === 'short' || hair === 'bun') {
    const top = sh(new THREE.Mesh(new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI * .43), hm)); top.scale.set(.102, .128, .114); top.position.set(0, .022, .008); g.add(top);
    const back = sh(new THREE.Mesh(new THREE.SphereGeometry(1, 28, 10, Math.PI / 2 - Math.PI * .66, Math.PI * 1.32, Math.PI * .43, Math.PI * .22), hm)); back.scale.set(.102, .128, .114); back.position.set(0, .022, .008); g.add(back);
    if (hair === 'bun') g.add(place(ell(.05, .05, .045, hm, 14), 0, .085, .085));
  }
  return g;
}
const hand = (skin, glove) => { const h = new THREE.Group(); h.add(ell(.04, .056, .028, std(glove || skin, { roughness: glove ? .5 : .65 }), 12)); h.add(place(ell(.014, .03, .014, std(glove || skin), 8), .035, .01, -.01)); h.position.y = -.31; return h; };

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
  if (o.legs === 'sarong') { const sg = lathe([[0, .2], [.205, .2], [.215, .1], [.23, -.15], [.245, -.5], [0, -.5]], botMat, 32); sg.scale.z = .75; sg.position.y = 0; g.add(sg); sg.position.y = HIP; }
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
    const hd = hand(o.skin, o.gloves); el.add(hd); hands.push(hd);
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
    const top = sh(new THREE.Mesh(new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI * .47), hm)); top.scale.set(.128, .136, .142); top.position.set(0, .018, .006); headG.add(top);
    const side = sh(new THREE.Mesh(new THREE.SphereGeometry(1, 28, 10, Math.PI / 2 - Math.PI * .7, Math.PI * 1.4, Math.PI * .47, Math.PI * .25), hm)); side.scale.set(.128, .136, .142); side.position.set(0, .018, .006); headG.add(side);
    headG.add(place(sh(new THREE.Mesh(new THREE.BoxGeometry(.19, .042, .05), std('#101418', { roughness: .08, metalness: .5 }))), 0, .052, -.128));       // visor
    headG.add(place(sh(new THREE.Mesh(new THREE.BoxGeometry(.012, .01, .2), std('#f4f4f4'))), 0, .148, -.002));                                              // garis helm
  }
  if (o.hood) {
    const hd = sh(new THREE.Mesh(new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI * .62), std(o.hood))); hd.scale.set(.122, .142, .132); hd.position.set(0, .016, .018); headG.add(hd);
    const back = sh(new THREE.Mesh(new THREE.SphereGeometry(1, 28, 10, Math.PI / 2 - Math.PI * .72, Math.PI * 1.44, Math.PI * .62, Math.PI * .3), std(o.hood))); back.scale.set(.122, .142, .132); back.position.set(0, .016, .018); headG.add(back);
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
  return g;
}

/* ---------- tipe orang di game ---------- */
const LOOK = {
  ojol: { skin: '#c58b5a', topTex: T.jacket, sleeveTex: T.jacket, legs: 'pants', bottom: '#1b1b20', shoe: 'sneaker', shoeColor: '#2a2a30', helmet: '#2fa84f', gloves: '#16161a', hair: 'short', collar: '#16161a', deliveryBox: '#2fa84f' },
  pemuda: { skin: '#c98e62', topTex: T.tee, sleeves: 'short', legs: 'shorts', bottom: '#34343c', shoe: 'sandal', shoeColor: '#3a2a1c', hair: 'short', hairColor: '#171210', backpack: '#2b2d35' },
  cowok: { skin: '#c58b5a', topTex: T.hoodie, sleeveTex: null, top: '#6b7280', legs: 'pants', bottom: '#4b5240', shoe: 'sneaker', shoeColor: '#8a8a82', cap: '#2f6b3a', hair: 'short', mustache: true },
  ibu: { skin: '#b87a50', topTex: T.floral, sleeves: 'short', legs: 'skirt', botTex: T.floral, shoe: 'sandal', shoeColor: '#6a3a2a', hair: 'bun', hairColor: '#241812', scale: .94, build: .95 },
  juragan: { skin: '#b98258', top: '#f2efe6', legs: 'sarong', botTex: T.sarong, shoe: 'sandal', shoeColor: '#4a3220', peci: '#f4f4f0', hair: 'short', hairColor: '#d8d8d8', mustache: true, belly: .025, vneck: '#ddd8cc', collar: '#e8e4d8' },
  hoodie: { skin: '#b98258', topTex: T.dark, sleeveTex: T.dark, legs: 'pants', bottom: '#2a2b33', shoe: 'sneaker', shoeColor: '#1c1c20', hood: '#26272d', mask: true, hair: null, scale: 1.02 },
  penjaga: { skin: '#b98258', topTex: T.batik, sleeveTex: T.batik, legs: 'sarong', botTex: T.sarong, shoe: 'sandal', shoeColor: '#4a3220', peci: '#151515', hair: 'short', mustache: true, belly: .02, collar: '#7a1219' },
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
