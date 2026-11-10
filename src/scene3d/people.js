import * as THREE from 'three';
import { pouchGeometry } from './products';

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .7, ...o });
const sh = m => { m.castShadow = true; m.receiveShadow = true; return m; };

/** Figur manusia low-poly (tinggi ≈ 1,7 m), menghadap -z. Lengan & kaki berporos di bahu/pinggul agar bisa dianimasikan. */
export function person({ shirt = '#2f9e44', pants = '#2d5fa8', skin = '#c58b5a', helmet = null, hair = '#1a1410' } = {}) {
  const g = new THREE.Group();
  const legs = [-.1, .1].map(x => {
    const piv = new THREE.Group(); piv.position.set(x, .82, 0);
    const l = sh(new THREE.Mesh(new THREE.BoxGeometry(.15, .82, .17), std(pants))); l.position.y = -.41; piv.add(l);
    const shoe = sh(new THREE.Mesh(new THREE.BoxGeometry(.16, .07, .26), std('#222'))); shoe.position.set(0, -.785, -.04); piv.add(shoe);
    g.add(piv); return piv;
  });
  const torso = sh(new THREE.Mesh(new THREE.CapsuleGeometry(.19, .36, 6, 14), std(shirt))); torso.position.y = 1.12; torso.scale.z = .7; g.add(torso);
  // lengan dua ruas: bahu (arms[i]) → siku (elbows[i]) → tangan; panjang 0,29 + 0,29
  const hands = [], elbows = [], arms = [-.27, .27].map(x => {
    const piv = new THREE.Group(); piv.position.set(x, 1.4, 0); piv.rotation.z = x < 0 ? .1 : -.1;
    const up = sh(new THREE.Mesh(new THREE.CapsuleGeometry(.056, .2, 5, 10), std(shirt))); up.position.y = -.15; piv.add(up);
    const elbow = new THREE.Group(); elbow.position.y = -.29; piv.add(elbow); elbows.push(elbow);
    const joint = sh(new THREE.Mesh(new THREE.SphereGeometry(.058, 10, 8), std(shirt))); elbow.add(joint);
    const fore = sh(new THREE.Mesh(new THREE.CapsuleGeometry(.05, .2, 5, 10), std(skin))); fore.position.y = -.15; elbow.add(fore);
    const h = sh(new THREE.Mesh(new THREE.SphereGeometry(.05, 10, 8), std(skin))); h.position.y = -.3; elbow.add(h); hands.push(h);
    g.add(piv); return piv;
  });
  const head = sh(new THREE.Mesh(new THREE.SphereGeometry(.12, 20, 16), std(skin))); head.position.y = 1.58; g.add(head);
  const neck = sh(new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .08, 10), std(skin))); neck.position.y = 1.46; g.add(neck);
  if (helmet) {
    const hm = sh(new THREE.Mesh(new THREE.SphereGeometry(.14, 20, 14, 0, Math.PI * 2, 0, Math.PI * .62), std(helmet, { roughness: .35 }))); hm.position.y = 1.59; g.add(hm);
    const v = new THREE.Mesh(new THREE.BoxGeometry(.2, .05, .1), std('#111', { roughness: .2 })); v.position.set(0, 1.57, -.09); g.add(v);
  } else { const hr = sh(new THREE.Mesh(new THREE.SphereGeometry(.125, 18, 12, 0, Math.PI * 2, 0, Math.PI * .5), std(hair))); hr.position.y = 1.6; g.add(hr); }
  g.userData = { legs, arms, elbows, hands, torso, head };
  return g;
}

/** Kantong kresek berisi belanjaan (tergantung dari tangan; titik asal = gagang di atas). */
export function makeBag(color = '#d63b2f') {
  const g = new THREE.Group();
  const body = new THREE.Mesh(pouchGeometry(.2, .26, .09), new THREE.MeshStandardMaterial({ color, roughness: .35, transparent: true, opacity: .88, side: THREE.DoubleSide }));
  body.position.y = -.17; body.castShadow = true; g.add(body);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(.045, .006, 6, 16), std('#e8e8e8')); handle.position.y = -.03; g.add(handle);
  // isi kantong: beberapa benda berwarna menonjol di balik plastik
  [['#f6c744', -.04, -.2], ['#2f80d6', .04, -.17], ['#e8e8e8', 0, -.12]].forEach(([c, x, y]) => { const it = new THREE.Mesh(new THREE.BoxGeometry(.05, .08, .04), std(c)); it.position.set(x, y, 0); g.add(it); });
  return g;
}
/** Lembar uang kertas (dipegang saat membayar). */
export function makeBill(color = '#3f9e58') {
  const m = new THREE.Mesh(new THREE.BoxGeometry(.13, .005, .06), std(color, { roughness: .6 })); m.castShadow = true;
  m.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(.06, .0055, .035), std('#e8f3e0')), {}));
  return m;
}

/** Figur sesuai tipe pelanggan di logika game (ojol, pemuda, cowok, ibu, juragan, hoodie). */
export function personFor(type) {
  switch (type) {
    case 'ojol': return person({ shirt: '#2fa84f', pants: '#2d5fa8', helmet: '#2fa84f' });
    case 'pemuda': return person({ shirt: '#d8c9a8', pants: '#34343c', skin: '#c98e62' });
    case 'cowok': { const p = person({ shirt: '#6b7280', pants: '#4b5240', skin: '#c58b5a' }); const cap = new THREE.Mesh(new THREE.SphereGeometry(.13, 18, 12, 0, Math.PI * 2, 0, Math.PI * .5), std('#2f6b3a')); cap.position.y = 1.6; cap.castShadow = true; p.add(cap); return p; }
    case 'ibu': {
      const p = person({ shirt: '#d9729a', pants: '#b45a82', skin: '#b87a50', hair: '#222' }); p.scale.setScalar(.93);
      const skirt = new THREE.Mesh(new THREE.CylinderGeometry(.2, .27, .62, 18), std('#b45a82')); skirt.position.y = .6; skirt.castShadow = true; p.add(skirt); return p;
    }
    case 'juragan': {
      const p = person({ shirt: '#a4262c', pants: '#6b4a2a', skin: '#b98258' });
      const peci = new THREE.Mesh(new THREE.CylinderGeometry(.1, .11, .09, 16), std('#151515')); peci.position.y = 1.67; peci.castShadow = true; p.add(peci);
      const sarong = new THREE.Mesh(new THREE.CylinderGeometry(.2, .24, .7, 18), std('#6b4a2a')); sarong.position.y = .55; sarong.castShadow = true; p.add(sarong); return p;
    }
    case 'hoodie': {
      const p = person({ shirt: '#2b2d35', pants: '#3a3a40', skin: '#b98258' });
      const hood = new THREE.Mesh(new THREE.SphereGeometry(.15, 18, 14, 0, Math.PI * 2, 0, Math.PI * .72), std('#2b2d35')); hood.position.y = 1.6; hood.castShadow = true; p.add(hood);
      const mask = new THREE.Mesh(new THREE.BoxGeometry(.17, .08, .06), std('#0c0c0c')); mask.position.set(0, 1.54, -.09); p.add(mask); return p;
    }
    default: return person();
  }
}
