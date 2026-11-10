import * as THREE from 'three';

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .7, ...o });
const sh = m => { m.castShadow = true; m.receiveShadow = true; return m; };

/** Figur manusia low-poly sederhana (tinggi ≈ 1,7 m), menghadap -z. */
export function person({ shirt = '#2f9e44', pants = '#2d5fa8', skin = '#c58b5a', helmet = null, hair = '#1a1410' } = {}) {
  const g = new THREE.Group();
  const legs = [-.1, .1].map(x => { const l = sh(new THREE.Mesh(new THREE.BoxGeometry(.15, .82, .17), std(pants))); l.position.set(x, .41, 0); g.add(l); return l; });
  const shoes = [-.1, .1].map(x => { const s = sh(new THREE.Mesh(new THREE.BoxGeometry(.16, .07, .26), std('#222'))); s.position.set(x, .035, -.04); g.add(s); return s; });
  const torso = sh(new THREE.Mesh(new THREE.CapsuleGeometry(.19, .36, 6, 14), std(shirt))); torso.position.y = 1.12; torso.scale.z = .7; g.add(torso);
  const arms = [-.27, .27].map(x => { const a = sh(new THREE.Mesh(new THREE.CapsuleGeometry(.055, .36, 5, 10), std(shirt))); a.position.set(x, 1.18, 0); a.rotation.z = x < 0 ? .12 : -.12; g.add(a); return a; });
  const hands = [-.3, .3].map(x => { const h = sh(new THREE.Mesh(new THREE.SphereGeometry(.05, 10, 8), std(skin))); h.position.set(x * 1.03, .93, 0); g.add(h); return h; });
  const head = sh(new THREE.Mesh(new THREE.SphereGeometry(.12, 20, 16), std(skin))); head.position.y = 1.58; g.add(head);
  const neck = sh(new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .08, 10), std(skin))); neck.position.y = 1.46; g.add(neck);
  if (helmet) {
    const hm = sh(new THREE.Mesh(new THREE.SphereGeometry(.14, 20, 14, 0, Math.PI * 2, 0, Math.PI * .62), std(helmet, { roughness: .35 }))); hm.position.y = 1.59; g.add(hm);
    const v = new THREE.Mesh(new THREE.BoxGeometry(.2, .05, .1), std('#111', { roughness: .2 })); v.position.set(0, 1.57, -.09); g.add(v);
  } else { const hr = sh(new THREE.Mesh(new THREE.SphereGeometry(.125, 18, 12, 0, Math.PI * 2, 0, Math.PI * .5), std(hair))); hr.position.y = 1.6; g.add(hr); }
  g.userData = { legs, shoes, arms, hands, torso, head };
  return g;
}

/** Figur sesuai tipe pelanggan di logika game (ojol, pemuda, cowok, ibu, juragan, hoodie). */
export function personFor(type) {
  switch (type) {
    case 'ojol': return person({ shirt: '#2fa84f', pants: '#2d5fa8', helmet: '#2fa84f' });
    case 'pemuda': { const p = person({ shirt: '#d8c9a8', pants: '#34343c', skin: '#c98e62' }); p.userData.legs.forEach(l => { l.scale.y = .75; l.position.y = .3; }); return p; }
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
