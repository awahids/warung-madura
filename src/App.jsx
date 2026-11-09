import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import GameCanvas from './components/GameCanvas';
import Loading from './components/Loading';
import Toolbar from './components/Toolbar';
import OrientationGuard from './components/OrientationGuard';

const Props3D = lazy(() => import('./props3d/Props3D'));

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => { const on = () => setHash(window.location.hash); window.addEventListener('hashchange', on); return () => window.removeEventListener('hashchange', on); }, []);
  return hash;
}

export default function App() {
  const route = useHashRoute();
  if (route === '#/props') return <Suspense fallback={<Loading />}><Props3D /></Suspense>;
  return <GameApp />;
}

function GameApp() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(e => setError(e), []);
  return (
    <div className="app">
      <div className="stage">
        <GameCanvas onReady={onReady} onError={onError} />
        {(!ready || error) && <Loading error={error} />}
        <OrientationGuard />
      </div>
      <Toolbar />
    </div>
  );
}
