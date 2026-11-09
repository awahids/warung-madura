import { useEffect, useState } from 'react';

const REPO = 'https://github.com/awahids/warung';

export default function Toolbar() {
  const [full, setFull] = useState(false);
  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  const toggle = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.());
  return (
    <div className="toolbar">
      <span>Juragan Warung · simulasi warung Madura</span>
      <span className="spacer" />
      <a href={REPO} target="_blank" rel="noreferrer">GitHub</a>
      <button onClick={toggle}>{full ? 'Keluar layar penuh' : 'Layar penuh'}</button>
    </div>
  );
}
