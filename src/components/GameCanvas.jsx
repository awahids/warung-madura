import { useEffect, useRef } from 'react';
import { createEngine } from '../game';

/** Membungkus mesin game canvas ke dalam siklus hidup React. */
export default function GameCanvas({ onReady, onError }) {
  const ref = useRef(null);
  useEffect(() => {
    const engine = createEngine(ref.current, { onReady, onError });
    return () => engine.destroy();
  }, [onReady, onError]);
  return <canvas ref={ref} width={1280} height={720} aria-label="Juragan Warung" />;
}
