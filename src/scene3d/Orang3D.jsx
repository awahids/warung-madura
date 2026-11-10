import { useEffect, useRef, useState } from 'react';
import { createLineup, CAST } from './lineup';

export default function Orang3D() {
  const ref = useRef(null), api = useRef(null), [err, setErr] = useState(null);
  useEffect(() => {
    try { api.current = createLineup(ref.current); } catch (e) { setTimeout(() => setErr(e), 0); return undefined; }
    if (import.meta.env.DEV) window.__lineup = api.current;
    return () => api.current && api.current.dispose();
  }, []);
  return (
    <div className="warung3d">
      <canvas ref={ref} />
      {err && <div className="overlay"><h1>3D tidak tersedia</h1><p>{String(err.message || err)}</p></div>}
      <div className="w3-bar">
        <a href="#/" className="w3-back">← Game</a>
        <div className="w3-group">{['depan', 'dekat', 'samping', 'ojol depan', 'ojol belakang', 'wajah haji', 'wajah ibu', 'wajah ojol', 'tangan'].map(v => <button key={v} type="button" onClick={() => api.current.setView(v)}>{v[0].toUpperCase() + v.slice(1)}</button>)}</div>
        <span className="w3-info">{CAST.map(c => c[1]).join(' · ')}</span>
      </div>
    </div>
  );
}
