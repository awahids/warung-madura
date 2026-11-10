import { useEffect, useRef, useState } from 'react';
import { createEngine3D } from '../game/engine3d';
import Loading from './Loading';
import OrientationGuard from './OrientationGuard';

const VIEWS = [['luar', 'Luar'], ['pembeli', 'Pembeli'], ['penjaga', 'Penjaga']];

/** Game utuh versi 3D: logika game yang sama, tampilan warung 3D + HUD di atasnya. */
export default function Game3D() {
  const stackRef = useRef(null), glRef = useRef(null), ovRef = useRef(null), eng = useRef(null);
  const [ready, setReady] = useState(false), [error, setError] = useState(null), [view, setView] = useState('luar');

  useEffect(() => {
    const e = createEngine3D({ stack: stackRef.current, glCanvas: glRef.current, overlay: ovRef.current, onReady: () => setReady(true), onError: setError });
    e.onView = v => setView(v); eng.current = e;
    return () => { e.destroy(); eng.current = null; };
  }, []);

  return (
    <div className="app">
      <div className="stage">
        <div className="stack3d" ref={stackRef}>
          <canvas ref={glRef} className="gl3d" aria-hidden="true" />
          <canvas ref={ovRef} className="ov3d" width={1280} height={720} aria-label="Juragan Warung 3D" />
        </div>
        {(!ready || error) && <Loading error={error} />}
        <OrientationGuard />
      </div>
      <div className="toolbar">
        <a href="#/">← Game 2D</a>
        <span className="spacer" />
        <span>Kamera:</span>
        {VIEWS.map(([id, label]) => (
          <button key={id} type="button" className={view === id ? 'on' : ''} onClick={() => eng.current && eng.current.setView(id)}>{label}</button>
        ))}
      </div>
    </div>
  );
}
