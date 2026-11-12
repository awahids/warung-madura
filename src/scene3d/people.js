import * as THREE from 'three';
import { pouchGeometry } from './products';
import { reliefTex, skinTex } from './textures';

/* Karakter manusia prosedural bergaya chibi 3D (tinggi ≈1,8 m, dua kepala): mata besar berkilau yang berkedip,
   pipi merona, pakaian bermotif (batik, daster bunga, jaket, sarung), alas kaki. Menghadap −z.
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

/* ---------- gaya chibi 3D: kepala besar, mata besar berkilau yang berkedip, pipi merona, badan mungil ---------- */
export const ARM = .22;                                         // panjang satu ruas lengan (bahu→siku, siku→pergelangan)
export const SIZE = 1.15;                                      // skala seluruh figur: tinggi ≈1,8 m agar kepala terlihat di atas barang dagangan
const HS = 1.25;                                                // pembesaran kepala: tinggi badan ≈ dua kepala
const R = .32;                                                  // jari-jari kepala (≈ sepertiga tinggi badan)
const HEAD = [R, R * .95, R * .95];                             // setengah sumbu kepala
const ink = new THREE.MeshBasicMaterial({ color: '#2a1f2e' });  // mata: tinta gelap, tidak terpengaruh cahaya
const shine = new THREE.MeshBasicMaterial({ color: '#ffffff' });
const MAT = {};
const mat = (c, rough = .68) => MAT[c + rough] || (MAT[c + rough] = std(c, { roughness: rough }));
/** Kulit: tekstur pori + relief halus + kilau 'sheen' lembut (pendekatan hamburan bawah kulit). Di-cache per warna. */
const SKIN = {};
const skinMat = hex => SKIN[hex] || (SKIN[hex] = new THREE.MeshPhysicalMaterial({ color: '#ffffff', map: skinTex(hex), bumpMap: reliefTex('skin', [2, 2]), bumpScale: .5, roughness: .58, sheen: .8, sheenRoughness: .45, sheenColor: new THREE.Color('#ffb59a'), clearcoat: .08, clearcoatRoughness: .5 }));
/** Kain: relief anyaman + kilau serat di tepi (sheen). weave: 'weave' | 'knit'. */
const FAB = {};
const fabric = (c, weave = 'weave', rough = .85) => FAB[c + weave] || (FAB[c + weave] = new THREE.MeshPhysicalMaterial({ color: c, roughness: rough, bumpMap: reliefTex(weave, [10, 10]), bumpScale: .6, sheen: .7, sheenRoughness: .6, sheenColor: new THREE.Color(c).lerp(new THREE.Color('#ffffff'), .35) }));
const fabricTex = (map, weave = 'weave') => new THREE.MeshPhysicalMaterial({ map, roughness: .85, bumpMap: reliefTex(weave, [12, 12]), bumpScale: .6, sheen: .6, sheenRoughness: .6, sheenColor: new THREE.Color('#d8d0c4') });
const HAIR = {};
const hairMat = c => HAIR[c] || (HAIR[c] = new THREE.MeshPhysicalMaterial({ color: c, roughness: .48, bumpMap: reliefTex('hair', [3, 3]), bumpScale: .8, sheen: 1, sheenRoughness: .35, sheenColor: new THREE.Color(c).lerp(new THREE.Color('#ffffff'), .45) }));
const dome = (r, theta, m, seg = 18) => sh(new THREE.Mesh(new THREE.SphereGeometry(r, seg, 10, 0, Math.PI * 2, 0, theta), m));
/** Potongan kulit bola; phi dipusatkan di depan (−z) atau belakang (+z). */
const shell = (r, front, width, t0, tl, m) => sh(new THREE.Mesh(new THREE.SphereGeometry(r, 16, 6, (front ? 1.5 : .5) * Math.PI - width / 2, width, t0, tl), m));
/** z permukaan depan kepala di (x, y) agar mata, pipi, dan mulut menempel di wajah. */
const faceZ = (x, y) => -HEAD[2] * Math.sqrt(Math.max(0, 1 - (x / HEAD[0]) ** 2 - (y / HEAD[1]) ** 2));

/** Tangan bulat ala chibi dengan ibu jari kecil. userData.setCurl(0..1): mengepal saat menggenggam. */
function makeHand(skin, glove, sx) {
  const m = glove ? mat(glove, .6) : skinMat(skin), h = new THREE.Group(); h.position.y = -ARM;   // pergelangan
  const palm = place(ell(.066, .068, .066, m), 0, -.025, 0); h.add(palm);
  const thumb = place(ell(.025, .033, .025, m), -sx * .045, -.02, -.042); h.add(thumb);
  h.userData.setCurl = c => { palm.scale.set(.066 - c * .006, .068 - c * .012, .066); thumb.position.y = -.02 - c * .02; };
  h.userData.setCurl(.28);
  return h;
}

/** Rambut: tudung bola yang dimiringkan ke belakang + jambul/poni kerucut, sanggul untuk ibu. */
function makeHair(style, color, parent, front = true) {
  const m = hairMat(color), k = R / .29;
  const cap = dome(R * 1.09, front ? 1.78 : 1.6, m); cap.position.set(0, .018, .018); cap.rotation.x = front ? .48 : .74; parent.add(cap);
  const tuft = (x, y, z, rx, rz, s = 1) => { const t = sh(new THREE.Mesh(new THREE.ConeGeometry(.058 * s * k, .14 * s * k, 6), m)); t.position.set(x * k, y * k, z * k); t.rotation.set(rx, 0, rz); parent.add(t); };
  if (front) {
    const list = style === 'swept' ? [[-.115, .128, -.232, -2.6, -.7], [0, .14, -.244, -2.6, -.6], [.115, .128, -.22, -2.6, -.5]]
      : style === 'bun' ? [[-.19, .1, -.19, -2.7, .75, .8], [.19, .1, -.19, -2.7, -.75, .8]]
        : [[-.14, .116, -.244, -2.64, .35], [-.046, .116, -.26, -2.64, .12], [.046, .116, -.26, -2.64, -.12], [.14, .116, -.244, -2.64, -.35]];
    list.forEach(a => tuft(...a));
    if (style === 'swept') tuft(-.03, .3, -.14, -.9, .25, 1.25);                                   // jambul
  }
  if (style === 'curly') [[-.16, .256, -.077], [0, .307, -.064], [.16, .256, -.077], [-.09, .288, .115], [.09, .288, .115], [-.25, .13, -.02], [.25, .13, -.02]].forEach(([x, y, z]) => parent.add(place(ell(.09, .09, .09, m), x * k, y * k, z * k)));   // ikal
  if (style === 'bun') {
    parent.add(place(ell(.11, .105, .1, m), 0, .22, .29));                                        // sanggul
    const tie = sh(new THREE.Mesh(new THREE.TorusGeometry(.062, .011, 6, 16), mat('#c0281a', .5))); tie.position.set(0, .19, .245); tie.rotation.x = Math.PI / 2 - .7; parent.add(tie);
  }
}

/** Kepala chibi (menghadap −z). Opsi: skin, hair (gaya), hairColor, hairFront, mustache, glasses, stubble. */
function makeHead(o) {
  const g = new THREE.Group(), skin = skinMat(o.skin);
  const skull = sh(new THREE.Mesh(new THREE.SphereGeometry(1, 22, 16), skin)); skull.scale.set(...HEAD); g.add(skull);
  const eyes = [], arcs = [], brows = [], ey = -.012;
  [-1, 1].forEach(sx => {
    if (!o.hijab) g.add(place(ell(.05, .055, .03, skin), sx * R * .98, -.02, .01));                // telinga
    const x = sx * .105, e = new THREE.Group(); e.position.set(x, ey, faceZ(x, ey) + .004); g.add(e); eyes.push(e);
    const ball = new THREE.Mesh(sphere(10), ink); ball.scale.set(.037, .053, .02); e.add(ball);
    const arc = new THREE.Mesh(new THREE.TorusGeometry(.034, .01, 5, 10, Math.PI), ink); arc.position.set(x, ey - .012, faceZ(x, ey) - .004); arc.visible = false; g.add(arc); arcs.push(arc);   // mata tersenyum (^ ^)
    const brow = new THREE.Mesh(new THREE.BoxGeometry(.075, .016, .012), ink); brow.position.set(x, ey + .082, faceZ(x, ey + .082) - .004); brow.rotation.z = sx * .38; brow.visible = false; g.add(brow); brows.push(brow);   // alis marah
    const sp = place(new THREE.Mesh(sphere(6), shine), .012, .02, -.016); sp.scale.setScalar(.012); e.add(sp);    // kilau mata
    const bx = sx * .178, by = -.082;
    if (!o.mask) { const b = new THREE.Mesh(sphere(8), mat('#f59aa6')); b.scale.set(.04, .024, .012); b.position.set(bx, by, faceZ(bx, by) + .004); g.add(b); }   // pipi merona
    if (o.glasses) g.add(place(sh(new THREE.Mesh(new THREE.TorusGeometry(.064, .009, 6, 18), mat('#3a3030', .4))), x, ey, faceZ(x, ey) - .026));
    if (o.mustache) { const m = ell(.036, .013, .014, mat(o.browColor || o.hairColor || '#1a1410', .8)); m.position.set(sx * .032, -.066, faceZ(sx * .032, -.066) - .004); m.rotation.z = sx * -.3; g.add(m); }
  });
  if (o.glasses) g.add(place(new THREE.Mesh(new THREE.BoxGeometry(.07, .009, .009), mat('#3a3030', .4)), 0, ey, faceZ(0, ey) - .03));
  const my = -.1, mouth = new THREE.Mesh(new THREE.TorusGeometry(.032, .009, 5, 10, Math.PI), mat('#b4435a')); mouth.position.set(0, my, faceZ(0, my) - .003); mouth.rotation.z = Math.PI;
  // ekspresi: senang (senyum), datar, marah (cemberut + alis), girang (mulut terbuka + mata ^ ^)
  const lipM = mat('#b4435a'), mz = faceZ(0, my) - .004;
  const mouths = { happy: mouth, flat: place(new THREE.Mesh(new THREE.BoxGeometry(.06, .012, .012), lipM), 0, my - .012, mz), angry: place(new THREE.Mesh(new THREE.TorusGeometry(.032, .009, 5, 10, Math.PI), lipM), 0, my - .034, mz), joy: place(new THREE.Mesh(new THREE.CircleGeometry(.045, 14, Math.PI, Math.PI), new THREE.MeshStandardMaterial({ color: '#7a1f33', roughness: .6, side: THREE.DoubleSide })), 0, my + .012, mz - .004) };
  if (!o.mask) Object.values(mouths).forEach(m => g.add(m));
  [...Object.values(mouths), ...arcs, ...brows].forEach(m => { m.userData.noLod = true; });
  g.userData.setMood = mood => {
    const k = mouths[mood] ? mood : 'happy';
    for (const n in mouths) mouths[n].visible = n === k;
    eyes.forEach(e => { e.visible = k !== 'joy'; }); arcs.forEach(a => { a.visible = k === 'joy'; }); brows.forEach(b => { b.visible = k === 'angry'; });
  };
  g.userData.setMood('happy');
  if (o.stubble) { const st = shell(R * 1.012, true, 1.5, 2.05, .75, new THREE.MeshStandardMaterial({ color: '#1a1410', transparent: true, opacity: .16, roughness: 1 })); st.scale.set(1, .95, .95); g.add(st); }
  if (o.hair) makeHair(o.hair, o.hairColor || '#1a1410', g, o.hairFront !== false);
  // kedipan: digerakkan saat kepala dirender, jadi tidak perlu dipanggil dari adegan
  let blinkAt = performance.now() + 800 + Math.random() * 3000;
  skull.onBeforeRender = () => {
    const now = performance.now(), shut = now > blinkAt && now < blinkAt + 120;
    if (now > blinkAt + 120) blinkAt = now + 2000 + Math.random() * 3000;
    eyes[0].scale.y = eyes[1].scale.y = shut ? .14 : 1;
  };
  return g;
}

/** Bangun manusia chibi sesuai opsi. Rangka: legs[] (pinggul), arms[] (bahu) → elbows[] → hands[], torso (pinggang), head (leher). */
function buildHuman(o) {
  const g = new THREE.Group(), skin = skinMat(o.skin);
  const topMat = o.topTex ? fabricTex(o.topTex(), 'knit') : fabric(o.top, 'knit');
  const sleeveMat = o.sleeveTex ? fabricTex(o.sleeveTex(), 'knit') : topMat;
  const botMat = o.botTex ? fabricTex(o.botTex()) : fabric(o.bottom || '#333');
  const HIP = .36, belly = o.belly || 0, B = o.build || 1;

  // kaki pendek (pivot pinggul)
  const cover = o.legs === 'skirt' || o.legs === 'sarong';
  const legs = [-.095, .095].map(x => {
    const piv = new THREE.Group(); piv.position.set(x, HIP, 0);
    const up = cover ? skin : botMat, low = o.legs === 'pants' ? botMat : skin;
    piv.add(place(taper(.098 * B, .092, .14, up, 12), 0, -.06, 0));
    piv.add(place(taper(.092, .084, .16, low, 12), 0, -.21, 0));
    if (o.shoe === 'sneaker') { const s = ell(.096, .058, .14, mat(o.shoeColor || '#e8e8e8', .5)); s.position.set(0, -.302, -.04); piv.add(s); }
    else { piv.add(place(ell(.084, .045, .12, skin), 0, -.3, -.04)); piv.add(place(sh(new THREE.Mesh(new THREE.BoxGeometry(.165, .024, .27), mat(o.shoeColor || '#3a2a1c'))), 0, -.347, -.04)); }
    g.add(piv); return piv;
  });
  g.add(place(ell(.192 * B, .1, .15, botMat), 0, HIP, 0));                         // pinggul

  // badan atas mungil (pivot pinggang)
  const torso = new THREE.Group(); torso.position.y = HIP; g.add(torso);
  const prof = [[0, -.03], [.205 * B, -.03], [(.212 + belly) * B, .06], [(.2 + belly) * B, .17], [.178 * B, .29], [.15 * B, .36], [.08, .415], [0, .42]];
  if (o.legs === 'skirt') prof.splice(0, 2, [0, -.24], [.3, -.24], [.28, -.17], [.235, -.06]);
  const tm = lathe(prof, topMat); tm.scale.z = .82; torso.add(tm);
  if (o.legs === 'sarong') { const sg = lathe([[0, .08], [.214 * B, .08], [.222 * B, 0], [.232, -.14], [.24, -.27], [0, -.27]], botMat, 22); sg.scale.z = .82; sg.position.y = HIP; g.add(sg); }
  torso.add(place(taper(.062, .07, .06, skin), 0, .435, 0));                              // leher
  if (o.collar) { const c = sh(new THREE.Mesh(new THREE.TorusGeometry(.074, .017, 6, 18), mat(o.collar))); c.rotation.x = Math.PI / 2; c.position.y = .418; c.scale.y = .8; torso.add(c); }
  if (o.vneck) [.32, .25, .18].forEach(y => torso.add(place(ell(.014, .014, .008, mat(o.vneck, .4)), 0, y, -(y > .3 ? .139 : y > .2 ? .155 : .166))));   // kancing koko

  // lengan dua ruas
  const long = o.sleeves !== 'short', hands = [], elbows = [];
  const arms = [-1, 1].map(sx => {
    const piv = new THREE.Group(); piv.position.set(sx * .215 * B, .355, 0); piv.rotation.z = sx * -.1; torso.add(piv);
    piv.add(ell(.074, .074, .074, sleeveMat));
    piv.add(place(taper(.07, .064, ARM, sleeveMat), 0, -ARM / 2, 0));
    const el = new THREE.Group(); el.position.y = -ARM; piv.add(el); elbows.push(el);
    el.add(ell(.064, .064, .064, long ? sleeveMat : skin));
    el.add(place(taper(.064, .056, ARM - .02, long ? sleeveMat : skin), 0, -ARM / 2, 0));
    const hd = makeHand(o.skin, o.gloves, sx); el.add(hd); hands.push(hd);
    return piv;
  });

  // kepala besar
  const headG = new THREE.Group(); headG.position.y = .45 + R * .95 * HS; torso.add(headG);
  const hs = new THREE.Group(); hs.scale.setScalar(HS); headG.add(hs);   // semua bagian kepala dibuat pada ukuran R lalu diperbesar
  const face = makeHead(o); hs.add(face);
  if (o.peci) { const p = taper(.22, .25, .17, mat(o.peci, .95), 20); p.position.set(0, .335, .025); p.rotation.x = .1; hs.add(p); const band = taper(.253, .253, .024, std('#c9a640', { metalness: .3 }), 20); band.position.set(0, .265, .018); band.rotation.x = .1; hs.add(band); }
  if (o.hijab) {
    const hm = mat(o.hijab, .8), hr = R * 1.13, at = m => { m.position.set(0, .012, .03); hs.add(m); return m; };
    at(dome(hr, Math.PI * .6, hm, 22)).rotation.x = .42;                                              // tudung: tepi rapi di atas mata
    at(shell(hr, false, Math.PI * 1.36, Math.PI * .5, Math.PI * .36, hm));                              // sisi & belakang
    at(sh(new THREE.Mesh(new THREE.SphereGeometry(hr, 22, 6, 0, Math.PI * 2, 2.08, Math.PI - 2.08), hm)));   // lilitan di bawah dagu
    const drape = taper(.17, .33, .2, hm, 18); drape.position.y = .37; drape.scale.z = .86; torso.add(drape);                                    // kain menjuntai di bahu
  }
  if (o.earCig) { const c = sh(new THREE.Mesh(new THREE.CylinderGeometry(.011, .011, .13, 6), mat('#f4f1e6', .6))); c.rotation.x = Math.PI / 2 - .25; c.position.set(R * 1.02, .05, -.03); hs.add(c); hs.add(place(ell(.012, .012, .016, mat('#c98a4a')), R * 1.02, .034, .03)); }   // rokok di telinga
  if (o.cap) {
    const cr = R * 1.13, d = dome(cr, Math.PI * .5, mat(o.cap)); d.position.set(0, .03, .012); d.rotation.x = .25; hs.add(d);
    const brim = sh(new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .018, 16, 1, false, Math.PI * .5, Math.PI), mat(o.cap))); brim.position.set(0, .03 + cr * .25, .03 - cr * .93); brim.rotation.x = .2; brim.scale.z = 1.1; hs.add(brim);
  }
  if (o.helmet) {
    const hm = std(o.helmet, { roughness: .2, metalness: .2 }), hr = R * 1.16;
    const top = dome(hr, Math.PI * .5, hm, 20); top.position.set(0, .02, .012); top.rotation.x = .16; hs.add(top);
    const side = shell(hr, false, Math.PI * 1.34, Math.PI * .46, Math.PI * .3, hm); side.position.set(0, .02, .012); hs.add(side);
    const visor = shell(hr * 1.02, true, Math.PI * .7, .74, .3, std('#0e1216', { roughness: .08, metalness: .6, side: THREE.DoubleSide })); visor.position.set(0, .03, .012); hs.add(visor);   // visor terangkat
    hs.add(place(sh(new THREE.Mesh(new THREE.BoxGeometry(.03, .02, .46), mat('#f4f4f4'))), 0, hr - .004, .07));                // garis helm
  }
  if (o.hood) {
    const hm = mat(o.hood, .9), hr = R * 1.14;
    const hd = dome(hr, Math.PI * .6, hm, 20); hd.position.set(0, .012, .03); hd.rotation.x = .42; hs.add(hd);
    const back = shell(hr, false, Math.PI * 1.36, Math.PI * .5, Math.PI * .36, hm); back.position.set(0, .012, .03); hs.add(back);
  }
  if (o.mask) { const mk = shell(R * 1.03, true, 1.7, 1.74, .8, mat('#0c0c0e', .9)); mk.scale.set(1, .95, .95); hs.add(mk); }
  if (o.deliveryBox) {   // tas boks pengantar makanan di punggung
    const bx = new THREE.Group(), body = mat(o.deliveryBox, .55);
    bx.add(sh(new THREE.Mesh(new THREE.BoxGeometry(.38, .36, .3), body)));
    bx.add(place(sh(new THREE.Mesh(new THREE.BoxGeometry(.392, .032, .312), mat('#1f8a3c', .5))), 0, .115, 0));
    bx.add(place(sh(new THREE.Mesh(new THREE.BoxGeometry(.392, .018, .312), mat('#16161a'))), 0, .18, 0));
    const tape = std('#d8dde0', { metalness: .4, roughness: .25 });
    bx.add(place(new THREE.Mesh(new THREE.BoxGeometry(.28, .012, .012), tape), 0, -.05, .152));
    bx.add(place(new THREE.Mesh(new THREE.BoxGeometry(.012, .26, .012), tape), .14, 0, .152));
    bx.add(place(new THREE.Mesh(new THREE.CircleGeometry(.065, 20), mat('#f4f4f4', .4)), 0, .025, .1525));
    bx.add(place(new THREE.Mesh(new THREE.CircleGeometry(.032, 20), body), 0, .025, .1535));
    bx.scale.setScalar(.85); bx.position.set(0, .2, .28); torso.add(bx);
    [-1, 1].forEach(sx => torso.add(place(sh(new THREE.Mesh(new THREE.BoxGeometry(.036, .2, .02), mat('#16161a'))), sx * .095, .27, -.15)));
  }
  if (o.backpack) {
    const bp = new THREE.Group(); bp.add(sh(new THREE.Mesh(new THREE.BoxGeometry(.27, .32, .13), mat(o.backpack, .7))));
    bp.add(place(sh(new THREE.Mesh(new THREE.BoxGeometry(.19, .12, .03), mat('#1c1c20'))), 0, -.05, .08));
    bp.scale.setScalar(.85); bp.position.set(0, .2, .2); torso.add(bp);
    [-1, 1].forEach(sx => torso.add(place(sh(new THREE.Mesh(new THREE.BoxGeometry(.03, .2, .02), mat('#1c1c20'))), sx * .095, .27, -.15)));
  }
  g.userData = { legs, arms, elbows, hands, torso, head: headG, setMood: face.userData.setMood };
  g.scale.setScalar((o.scale || 1) * SIZE);
  // hemat biaya bayangan: bagian kecil tidak melempar/menerima bayangan; yang sangat kecil disembunyikan saat jauh (LOD)
  const fine = [];
  g.traverse(m => { if (m.isMesh) { m.geometry.computeBoundingSphere(); const r = m.geometry.boundingSphere.radius * Math.max(m.scale.x, m.scale.y, m.scale.z); if (r < .055) { m.castShadow = false; m.receiveShadow = false; } if (r < .02 && !m.userData.noLod) fine.push(m); } });
  g.userData.fine = fine;
  return g;
}

/* ---------- tipe orang di game ---------- */
const LOOK = {
  ojol: { skin: '#c58b5a', topTex: T.jacket, sleeveTex: T.jacket, legs: 'pants', bottom: '#1b1b20', shoe: 'sneaker', shoeColor: '#2a2a30', helmet: '#2fa84f', gloves: '#16161a', hair: 'short', hairFront: false, collar: '#16161a', deliveryBox: '#2fa84f' },
  pemuda: { skin: '#c98e62', topTex: T.tee, sleeves: 'short', legs: 'shorts', bottom: '#34343c', shoe: 'sandal', shoeColor: '#3a2a1c', hair: 'swept', hairColor: '#171210', backpack: '#2b2d35', eye: '#2e1c12' },
  cowok: { skin: '#c58b5a', topTex: T.hoodie, sleeveTex: null, top: '#6b7280', legs: 'pants', bottom: '#4b5240', shoe: 'sneaker', shoeColor: '#8a8a82', cap: '#2f6b3a', hair: 'short', hairColor: '#1c1612', mustache: true, stubble: true },
  ibu: { skin: '#b87a50', topTex: T.floral, sleeves: 'short', legs: 'skirt', botTex: T.floral, shoe: 'sandal', shoeColor: '#6a3a2a', hair: 'bun', hairColor: '#241812', scale: .94, build: .95 },
  juragan: { skin: '#b98258', top: '#f2efe6', legs: 'sarong', botTex: T.sarong, shoe: 'sandal', shoeColor: '#4a3220', peci: '#f4f4f0', hair: 'short', hairFront: false, hairColor: '#b9b9b4', browColor: '#e4e4e0', mustache: true, wrinkles: true, glasses: true, brow: .006, belly: .025, vneck: '#ddd8cc', collar: '#e8e4d8', eye: '#4a3322' },
  hoodie: { skin: '#b98258', topTex: T.dark, sleeveTex: T.dark, legs: 'pants', bottom: '#2a2b33', shoe: 'sneaker', shoeColor: '#1c1c20', hood: '#26272d', mask: true, hair: null, scale: 1.02 },
  // variasi penampilan (logika game tetap memakai enam tipe di atas)
  ibuHijab: { skin: '#c58b5a', top: '#7d6a9c', legs: 'skirt', shoe: 'sandal', shoeColor: '#6a3a2a', hijab: '#e9b9c3', hair: null, scale: .94, build: .95 },
  bapak: { skin: '#a8734a', top: '#f1efe8', sleeves: 'short', legs: 'sarong', botTex: T.sarong, shoe: 'sandal', shoeColor: '#4a3220', hair: 'short', hairColor: '#2a2420', mustache: true, belly: .035, earCig: true },
  pemuda2: { skin: '#d09a70', top: '#3f78c4', sleeves: 'short', legs: 'pants', botTex: T.denim, shoe: 'sneaker', shoeColor: '#e8e8e8', hair: 'short', hairColor: '#171210', glasses: true },
  cowok2: { skin: '#b07a4e', top: '#8a3b3b', legs: 'pants', bottom: '#2f3440', shoe: 'sneaker', shoeColor: '#d8d8d2', hair: 'curly', hairColor: '#1c1612' },
  kurir: { skin: '#c58b5a', top: '#e07b2a', legs: 'pants', bottom: '#2a2b33', shoe: 'sneaker', shoeColor: '#2a2a30', cap: '#e07b2a', hair: 'short', hairColor: '#1c1612', collar: '#16161a' },
  penjaga: { skin: '#b98258', topTex: T.batik, sleeveTex: T.batik, legs: 'sarong', botTex: T.sarong, shoe: 'sandal', shoeColor: '#4a3220', peci: '#151515', hair: 'short', hairFront: false, hairColor: '#17120f', mustache: true, wrinkles: true, brow: .0058, belly: .02, collar: '#7a1219' },
};
/** Figur umum untuk halaman demo (kompatibel dengan versi lama). */
export function person({ shirt = '#2f9e44', pants = '#2d5fa8', skin = '#c58b5a', helmet = null, hair = '#1a1410' } = {}) {
  return buildHuman({ skin, top: shirt, legs: 'pants', bottom: pants, shoe: 'sneaker', shoeColor: '#222', helmet, hair: helmet ? null : 'short', hairColor: hair });
}
/** Figur sesuai tipe pelanggan di logika game (ojol, pemuda, cowok, ibu, juragan, hoodie), 'penjaga', 'kurir', atau nama variasi. */
export const VARIANTS = { ibu: ['ibu', 'ibuHijab'], juragan: ['juragan', 'bapak'], pemuda: ['pemuda', 'pemuda2'], cowok: ['cowok', 'cowok2'] };
/** n memilih variasi penampilan tipe itu (stabil per pelanggan). */
export function personFor(type, n = 0) { const v = VARIANTS[type]; return buildHuman(LOOK[v ? v[Math.abs(n) % v.length] : type] || LOOK.pemuda); }

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
