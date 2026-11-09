import { useCallback, useEffect, useState } from 'react';
import InstallButton from './InstallButton';

const REPO = 'https://github.com/awahids/warung-madura';
const root = () => document.documentElement;
const nativeElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;
const nativeRequest = () => root().requestFullscreen || root().webkitRequestFullscreen;
const nativeExit = () => document.exitFullscreen || document.webkitExitFullscreen;

/**
 * Layar penuh: pakai Fullscreen API bila ada; kalau tidak (mis. iPhone Safari) atau gagal,
 * pakai mode "imersif" CSS yang menyembunyikan toolbar dan memenuhi viewport.
 */
export function useFullscreen() {
  const [native, setNative] = useState(false);
  const [pseudo, setPseudo] = useState(false);

  useEffect(() => {
    const sync = () => setNative(!!nativeElement());
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => { document.removeEventListener('fullscreenchange', sync); document.removeEventListener('webkitfullscreenchange', sync); };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('immersive', native || pseudo);
  }, [native, pseudo]);

  const enter = useCallback(async () => {
    const req = nativeRequest();
    if (req) {
      try {
        await req.call(root());
        try { await window.screen.orientation?.lock?.('landscape'); } catch { /* tidak didukung */ }
        return;
      } catch { /* jatuh ke mode imersif */ }
    }
    setPseudo(true);
  }, []);

  const exit = useCallback(async () => {
    setPseudo(false);
    if (nativeElement()) { try { await nativeExit().call(document); } catch { /* abaikan */ } }
    try { window.screen.orientation?.unlock?.(); } catch { /* abaikan */ }
  }, []);

  useEffect(() => {
    if (!pseudo) return undefined;
    const onKey = e => { if (e.key === 'Escape') setPseudo(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pseudo]);

  const active = native || pseudo;
  return { active, toggle: () => (active ? exit() : enter()) };
}

export default function Toolbar() {
  const { active, toggle } = useFullscreen();
  return (
    <>
      <div className="toolbar">
        <span>Juragan Warung · simulasi warung Madura</span>
        <span className="spacer" />
        <a href={REPO} target="_blank" rel="noreferrer">GitHub</a>
        <InstallButton />
        <button type="button" onClick={toggle}>Layar penuh</button>
      </div>
      {active && (
        <button type="button" className="exit-fs" onClick={toggle} aria-label="Keluar layar penuh">✕ Keluar</button>
      )}
    </>
  );
}
