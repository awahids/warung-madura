import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { personFor } from './people';

/** Galeri karakter 3D: semua tipe orang dalam satu barisan (halaman #/orang). */
export const CAST = [['juragan', 'Pak Haji'], ['ibu', 'Bu Sri'], ['ojol', 'Bang Ojol'], ['pemuda', 'Mas Dimas'], ['cowok', 'Bang Rizky'], ['hoodie', 'Tamu misterius'], ['penjaga', 'Penjaga warung'],
  ['ibuHijab', 'Bu berhijab'], ['bapak', 'Bapak sarungan'], ['pemuda2', 'Mas berkacamata'], ['cowok2', 'Bang keriting'], ['kurir', 'Kurir'],
  ['pelajar', 'Adik pelajar'], ['pelajarPutri', 'Pelajar berhijab'], ['tukang', 'Pak Tukang'], ['turis', 'Turis bule'], ['turis2', 'Turis wanita']];
const MOODS = ['happy', 'flat', 'angry', 'joy'];

export function createLineup(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#b8d8f0'); scene.fog = new THREE.Fog('#b8d8f0', 22, 48);
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 60);
  const controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.maxPolarAngle = Math.PI * .52; controls.target.set(0, .95, 0);
  scene.add(new THREE.HemisphereLight('#dcecff', '#8a7a62', 1.6));
  const sun = new THREE.DirectionalLight('#fff1d6', 3); sun.position.set(3, 6, 5); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 4, bottom: -2, near: 1, far: 20 }); scene.add(sun);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshStandardMaterial({ color: '#a7a59d', roughness: .95 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const X = i => (i - (CAST.length - 1) / 2) * 1.2;
  const people = CAST.map(([type], i) => { const p = personFor(type); p.position.set(X(i), 0, 0); p.rotation.y = Math.PI; scene.add(p); return p; });
  const faceOf = (i, y) => [[X(i), y + .04, 2.3], [X(i), y, 0]];
  const VIEWS = { depan: [[0, 1.3, 15], [0, .92, 0]], dekat: [[X(1), 1.3, 3.6], [X(1), 1.12, 0]], samping: [[11, 1.6, 4], [0, .92, 0]], baru: [[X(9), 1.3, 5.2], [X(9), 1.0, 0]], 'ojol depan': [[X(2) + .6, 1.2, 3.2], [X(2), .92, 0]], 'ojol belakang': [[X(2) - 1, 1.3, -3.2], [X(2), .92, 0]], 'wajah haji': faceOf(0, 1.38), 'wajah ibu': faceOf(1, 1.27), 'wajah ojol': faceOf(2, 1.38), tangan: [[X(3) + .35, .63, 1.0], [X(3) + .9, .48, 0]] };
  const setView = n => { const [p, t] = VIEWS[n] || VIEWS.depan; camera.position.set(...p); controls.target.set(...t); };
  setView('depan');
  const resize = () => { const r = canvas.parentElement.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(resize); ro.observe(canvas.parentElement); resize();
  let raf = 0, alive = true, lastBeat = -1; const clock = new THREE.Clock();
  const loop = () => {
    if (!alive) return; const t = clock.getElapsedTime();
    people.forEach((p, i) => { p.position.y = Math.abs(Math.sin(t * 1.4 + i)) * .004; p.userData.head.rotation.y = Math.sin(t * .6 + i * 1.7) * .3; p.userData.torso.rotation.y = Math.sin(t * .4 + i) * .06; });
    const beat = Math.floor(t / 2.5); if (beat !== lastBeat) { lastBeat = beat; people.forEach((p, i) => p.userData.setMood(MOODS[(beat + i) % MOODS.length])); }   // peragaan ekspresi bergiliran
    controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(loop);
  };
  loop();
  return { triangles: () => renderer.info.render.triangles, setView, dispose() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); scene.traverse(o => { o.geometry && o.geometry.dispose(); }); renderer.dispose(); } };
}
