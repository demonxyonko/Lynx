import { lazy, Suspense } from 'react';
import { StatusBanner } from './components/Banner';
import { Nav } from './components/Nav';
import { useHash } from './hooks/useHash';
import { LynxProvider, useLynx } from './hooks/useLynx';
import { Home } from './pages/Home';

const Talk = lazy(() => import('./pages/Talk').then((m) => ({ default: m.Talk })));
const Devices = lazy(() => import('./pages/Devices').then((m) => ({ default: m.Devices })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const Connect = lazy(() => import('./pages/Connect').then((m) => ({ default: m.Connect })));

function Shell() {
  const [route, go] = useHash();
  const { toast } = useLynx();
  return (
    <div className="app">
      <StatusBanner go={go} />
      <main>
        <Suspense fallback={<p className="muted pad">Loading…</p>}>
          {route === 'home' && <Home go={go} />}
          {route === 'talk' && <Talk />}
          {route === 'devices' && <Devices />}
          {route === 'settings' && <Settings go={go} />}
          {route === 'connect' && <Connect go={go} />}
        </Suspense>
      </main>
      {toast && <div className="toast" role="status">{toast}</div>}
      <Nav route={route} go={go} />
    </div>
  );
}
export default function App() { return <LynxProvider><Shell /></LynxProvider>; }
