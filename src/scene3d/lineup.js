import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { personFor } from './people';

/** Galeri karakter 3D: semua tipe orang dalam satu barisan (halaman #/orang). */
export const CAST = [['juragan', 'Pak Haji'], ['ibu', 'Bu Sri'], ['ojol', 'Bang Ojol'], ['pemuda', 'Mas Dimas'], ['cowok', 'Bang Rizky'], ['hoodie', 'Tamu misterius'], ['penjaga', 'Penjaga warung']];

export function createLineup(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#b8d8f0'); scene.fog = new THREE.Fog('#b8d8f0', 12, 30);
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 60);
  const controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.maxPolarAngle = Math.PI * .52; controls.target.set(0, .95, 0);
  scene.add(new THREE.HemisphereLight('#dcecff', '#8a7a62', 1.6));
  const sun = new THREE.DirectionalLight('#fff1d6', 3); sun.position.set(3, 6, 5); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 4, bottom: -2, near: 1, far: 20 }); scene.add(sun);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshStandardMaterial({ color: '#a7a59d', roughness: .95 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const people = CAST.map(([type], i) => { const p = personFor(type); p.position.set((i - (CAST.length - 1) / 2) * .95, 0, 0); p.rotation.y = Math.PI; scene.add(p); return p; });
  const VIEWS = { depan: [[0, 1.25, 7.6], [0, .95, 0]], dekat: [[-2.1, 1.5, 2.6], [-2.1, 1.35, 0]], samping: [[6.5, 1.3, 2.5], [0, .95, 0]], 'ojol depan': [[-.45, 1.35, 2.7], [-.95, 1.0, 0]], 'ojol belakang': [[-1.8, 1.45, -2.7], [-.95, 1.0, 0]], 'wajah haji': [[-2.85, 1.56, 1.7], [-2.85, 1.52, 0]], 'wajah ibu': [[-1.9, 1.46, 1.6], [-1.9, 1.43, 0]], 'wajah ojol': [[-.95, 1.56, 1.7], [-.95, 1.52, 0]], tangan: [[-.78, .86, .5], [-.22, .78, 0]] };
  const setView = n => { const [p, t] = VIEWS[n] || VIEWS.depan; camera.position.set(...p); controls.target.set(...t); };
  setView('depan');
  const resize = () => { const r = canvas.parentElement.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(resize); ro.observe(canvas.parentElement); resize();
  let raf = 0, alive = true; const clock = new THREE.Clock();
  const loop = () => {
    if (!alive) return; const t = clock.getElapsedTime();
    people.forEach((p, i) => { p.position.y = Math.abs(Math.sin(t * 1.4 + i)) * .004; p.userData.head.rotation.y = Math.sin(t * .6 + i * 1.7) * .3; p.userData.torso.rotation.y = Math.sin(t * .4 + i) * .06; });
    controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(loop);
  };
  loop();
  return { triangles: () => renderer.info.render.triangles, setView, dispose() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); scene.traverse(o => { o.geometry && o.geometry.dispose(); }); renderer.dispose(); } };
}
