import { useEffect, useState } from 'react';

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || window.navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** Tombol "Pasang" (Android/desktop lewat beforeinstallprompt; iOS lewat petunjuk Bagikan). */
export default function InstallButton() {
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const onPrompt = e => { e.preventDefault(); setPrompt(e); };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); };
  }, []);

  if (installed) return null;
  if (!prompt && !isIOS()) return null;

  const click = async () => {
    if (prompt) { prompt.prompt(); await prompt.userChoice.catch(() => { }); setPrompt(null); } else setHint(h => !h);
  };
  return (
    <>
      <button type="button" onClick={click}>Pasang aplikasi</button>
      {hint && <span className="ios-hint">Ketuk ikon Bagikan lalu “Tambah ke Layar Utama”</span>}
    </>
  );
}
