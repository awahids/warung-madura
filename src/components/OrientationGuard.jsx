import { useEffect, useState } from 'react';
import { setPaused } from '../game';

/** Di HP posisi tegak: jeda game dan minta pengguna memutar layar ke mendatar. */
const QUERY = '(orientation: portrait) and (max-width: 820px)';

export default function OrientationGuard() {
  const [portrait, setPortrait] = useState(() => window.matchMedia(QUERY).matches);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = () => { setPortrait(mq.matches); if (!mq.matches) setDismissed(false); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const blocking = portrait && !dismissed;
  useEffect(() => { setPaused(blocking); return () => setPaused(false); }, [blocking]);

  if (!blocking) return null;
  return (
    <div className="overlay rotate" role="alert">
      <div className="phone" aria-hidden="true" />
      <h1>Putar HP ke mendatar</h1>
      <p>Juragan Warung paling nyaman dimainkan dalam mode landscape.</p>
      <button type="button" onClick={() => setDismissed(true)}>Tetap main tegak</button>
    </div>
  );
}
