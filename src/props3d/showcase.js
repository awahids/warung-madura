import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PROPS } from './props';

const X = [-1.5, -1.05, -.62, -.28, .32, 1.0, 1.5]; // posisi tiap prop di meja

function woodTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#b97a3e'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? 'rgba(90,50,20,.18)' : 'rgba(255,220,170,.1)'; g.fillRect(0, i * 32, 256, 32); g.fillStyle = 'rgba(60,30,10,.5)'; g.fillRect(0, i * 32, 256, 2); }
  for (let i = 0; i < 160; i++) { g.strokeStyle = `rgba(70,35,12,${Math.random() * .12})`; g.beginPath(); const y = Math.random() * 256; g.moveTo(0, y); g.lineTo(256, y + Math.random() * 4 - 2); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** Jika ada public/models/<id>.glb, pakai itu menggantikan prop prosedural (mis. hasil Meshy). */
async function tryLoadGLB(id, targetH) {
  const url = `${import.meta.env.BASE_URL}models/${id}.glb`;
  try {
    const res = await fetch(url); if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    if (new TextDecoder().decode(buf.slice(0, 4)) !== 'glTF') return null; // server SPA mengembalikan html
    const gltf = await new Promise((ok, no) => new GLTFLoader().parse(buf, '', ok, no));
    const obj = gltf.scene, box = new THREE.Box3().setFromObject(obj), size = box.getSize(new THREE.Vector3());
    obj.scale.setScalar(targetH / size.y);
    const b2 = new THREE.Box3().setFromObject(obj); const c = b2.getCenter(new THREE.Vector3());
    obj.position.set(-c.x, -b2.min.y, -c.z);
    obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const g = new THREE.Group(); g.add(obj); return g;
  } catch { return null; }
}

export function createShowcase(canvas, { onGLB } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 50); camera.position.set(0, 1.0, 4.4);
  let moved = false;
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, .3, 0); controls.enableDamping = true; controls.maxPolarAngle = Math.PI * .52; controls.minDistance = 1.2; controls.maxDistance = 6;
  controls.autoRotateSpeed = 1.2;
  controls.addEventListener('start', () => { moved = true; });
  // jarak kamera agar seluruh meja (±1.9 m) muat di lebar layar
  const homeZ = () => Math.max(3.4, 1.95 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect));

  const hemi = new THREE.HemisphereLight('#cfe6ff', '#8a6a4a', 1.1); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff1d6', 2.2); sun.position.set(2.5, 4, 3);
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: .5, far: 12 }); sun.shadow.bias = -.0005;
  scene.add(sun);
  const neon = new THREE.PointLight('#ffffff', 0, 8, 1.6); neon.position.set(0, 1.7, .9); scene.add(neon);
  const tube = new THREE.Mesh(new THREE.BoxGeometry(1.6, .035, .035), new THREE.MeshBasicMaterial({ color: '#ffffff' })); tube.position.set(0, 1.7, .6); tube.visible = false; scene.add(tube);

  // lantai, dinding, meja
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ color: '#9a9a94', roughness: .9 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -.9; floor.receiveShadow = true; scene.add(floor);
  const wallTex = woodTexture(); wallTex.repeat.set(3, 2);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), new THREE.MeshStandardMaterial({ map: wallTex, roughness: .9, color: '#c9a070' })); wall.position.set(0, 1.4, -1.1); wall.receiveShadow = true; scene.add(wall);
  const topTex = woodTexture(); topTex.repeat.set(3, 1);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(4.2, .1, 1.1), new THREE.MeshStandardMaterial({ map: topTex, roughness: .7 })); counter.position.y = -.05; counter.receiveShadow = true; counter.castShadow = true; scene.add(counter);
  const body = new THREE.Mesh(new THREE.BoxGeometry(4.1, .8, 1.0), new THREE.MeshStandardMaterial({ color: '#7a4a22', roughness: .85 })); body.position.y = -.5; body.castShadow = true; scene.add(body);

  // prop
  const slots = PROPS.map((p, i) => {
    const holder = new THREE.Group(); holder.position.set(X[i], 0, 0); scene.add(holder);
    const obj = p.build(); holder.add(obj);
    return { ...p, holder, obj, glb: false };
  });
  slots.forEach(async s => {
    const g = await tryLoadGLB(s.id, s.h);
    if (g) { s.holder.remove(s.obj); s.holder.add(g); s.obj = g; s.glb = true; onGLB && onGLB(s.id); }
  });

  let night = false, raf = 0, alive = true;
  const setNight = v => {
    night = v; scene.background = new THREE.Color(v ? '#0b1330' : '#9ccbf0');
    hemi.intensity = v ? .12 : 2.2; sun.intensity = v ? 0 : 3.2; neon.intensity = v ? 10 : 0; tube.visible = v;
    renderer.toneMappingExposure = v ? 1.2 : 1.1;
  };
  setNight(false);

  const resize = () => {
    const r = canvas.parentElement.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
    if (!moved) camera.position.set(0, 1.0, homeZ());
    controls.update();
  };
  const ro = new ResizeObserver(resize); ro.observe(canvas.parentElement); resize();
  const clock = new THREE.Clock();
  const loop = () => {
    if (!alive) return;
    const t = clock.getElapsedTime();
    slots.forEach((s, i) => { if (s.spin) s.holder.rotation.y = t * .8 + i; });
    controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(loop);
  };
  loop();

  return {
    slots,
    setNight, get night() { return night; },
    setAutoRotate: v => { controls.autoRotate = v; },
    setSpin: v => slots.forEach(s => { s.spin = v; if (!v) s.holder.rotation.y = 0; }),
    focus(id) { const s = slots.find(x => x.id === id); if (s) { controls.target.set(s.holder.position.x, .25, 0); camera.position.set(s.holder.position.x, .6, 1.6); } },
    reset() { moved = false; controls.target.set(0, .3, 0); camera.position.set(0, 1.0, homeZ()); },
    triangles() { return renderer.info.render.triangles; },
    dispose() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); scene.traverse(o => { o.geometry && o.geometry.dispose(); }); renderer.dispose(); },
  };
}
