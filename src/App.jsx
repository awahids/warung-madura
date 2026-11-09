import { useCallback, useState } from 'react';
import GameCanvas from './components/GameCanvas';
import Loading from './components/Loading';
import Toolbar from './components/Toolbar';
import OrientationGuard from './components/OrientationGuard';

export default function App() {
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
