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
