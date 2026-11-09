import { useEffect, useRef, useState } from 'react';
import atlas from '../game/atlas.json';
import atlasUrl from '../game/assets/atlas.webp';
import { createShowcase } from './showcase';
import { PROPS } from './props';

const AW = 1024, AH = 675; // ukuran atlas.webp

function SpriteThumb({ name, box = 64 }) {
  const [x, y, w, h] = atlas[name], s = Math.min(box / w, box / h);
  return <div className="thumb" style={{ width: w * s, height: h * s, backgroundImage: `url(${atlasUrl})`, backgroundSize: `${AW * s}px ${AH * s}px`, backgroundPosition: `-${x * s}px -${y * s}px` }} />;
}

/** Halaman uji coba prop 3D (#/props): prosedural, dapat ditimpa GLB dari public/models/. */
export default function Props3D() {
  const canvasRef = useRef(null), api = useRef(null);
  const [night, setNight] = useState(false), [auto, setAuto] = useState(false), [spin, setSpin] = useState(false);
  const [glb, setGlb] = useState([]), [tris, setTris] = useState(0);

  useEffect(() => {
    const s = createShowcase(canvasRef.current, { onGLB: id => setGlb(g => [...g, id]) });
    api.current = s;
    const t = setTimeout(() => setTris(s.triangles()), 800);
    return () => { clearTimeout(t); s.dispose(); };
  }, []);

  const toggle = (setter, apiFn) => v => { setter(v); apiFn(v); };
  return (
    <div className="props3d">
      <div className="p3-canvas"><canvas ref={canvasRef} /></div>
      <aside className="p3-panel">
        <a href="#/" className="p3-back">← Kembali ke game</a>
        <h2>Uji coba prop 3D</h2>
        <p className="p3-note">Seret untuk memutar, cubit/scroll untuk zoom. Kiri: sprite 2D · kanan: model 3D.</p>
        <div className="p3-toggles">
          <label><input type="checkbox" checked={night} onChange={e => toggle(setNight, v => api.current.setNight(v))(e.target.checked)} /> Malam (neon)</label>
          <label><input type="checkbox" checked={auto} onChange={e => toggle(setAuto, v => api.current.setAutoRotate(v))(e.target.checked)} /> Kamera berputar</label>
          <label><input type="checkbox" checked={spin} onChange={e => toggle(setSpin, v => api.current.setSpin(v))(e.target.checked)} /> Putar barang</label>
          <button type="button" onClick={() => api.current.reset()}>Reset kamera</button>
        </div>
        <ul className="p3-list">
          {PROPS.map(p => (
            <li key={p.id} onClick={() => api.current.focus(p.id)}>
              <SpriteThumb name={p.sprite} />
              <span>{p.name}<small>{glb.includes(p.id) ? 'model GLB' : 'prosedural'}</small></span>
            </li>
          ))}
        </ul>
        <p className="p3-note">Segitiga di adegan: ±{tris.toLocaleString('id-ID')}. Taruh <code>public/models/&lt;id&gt;.glb</code> (mis. <code>galon.glb</code>) untuk mengganti model prosedural.</p>
      </aside>
    </div>
  );
}
