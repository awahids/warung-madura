import { useEffect, useRef, useState } from 'react';
import { createWarung } from './warung';

const VIEWS = [['luar', 'Dari luar'], ['pembeli', 'Pembeli'], ['penjaga', 'Penjaga (sudut pandang)']];

/** Halaman warung 3D prosedural (#/warung). */
export default function Warung3D() {
  const canvasRef = useRef(null), api = useRef(null);
  const [night, setNight] = useState(false), [open, setOpen] = useState(true), [view, setView] = useState('luar'), [tris, setTris] = useState(0), [err, setErr] = useState(null);

  useEffect(() => {
    let w;
    try { w = createWarung(canvasRef.current); } catch (e) { setTimeout(() => setErr(e), 0); return undefined; }
    api.current = w; w.onDoor = v => setOpen(v);
    const t = setTimeout(() => setTris(w.triangles()), 1000);
    return () => { clearTimeout(t); w.dispose(); };
  }, []);

  return (
    <div className="warung3d">
      <canvas ref={canvasRef} />
      {err && <div className="overlay"><h1>3D tidak tersedia</h1><p>{String(err.message || err)}</p></div>}
      <div className="w3-bar">
        <a href="#/" className="w3-back">← Game</a>
        <div className="w3-group">
          {VIEWS.map(([id, label]) => (
            <button key={id} type="button" className={view === id ? 'on' : ''} onClick={() => { setView(id); api.current.setView(id); }}>{label}</button>
          ))}
        </div>
        <div className="w3-group">
          <button type="button" onClick={() => { const v = !open; setOpen(v); api.current.setDoor(v); }}>{open ? 'Tutup pintu' : 'Buka pintu'}</button>
          <button type="button" onClick={() => { const v = !night; setNight(v); api.current.setNight(v); }}>{night ? 'Siang' : 'Malam'}</button>
        </div>
        <span className="w3-info">±{tris.toLocaleString('id-ID')} segitiga · seret untuk melihat, klik pintu untuk buka/tutup</span>
      </div>
    </div>
  );
}
