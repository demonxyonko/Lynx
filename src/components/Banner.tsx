import { useState } from 'react';
import { useLynx } from '../hooks/useLynx';

export function StatusBanner({ go }: { go: (r: 'connect') => void }) {
  const { link, error, online, reconnect } = useLynx();
  const [dbg, setDbg] = useState(false);
  if (!online) return <div className="banner warn" role="status">You're offline. The app still opens; LYNX will reconnect when you're back.</div>;
  if (link === 'demo') return (
    <div className="banner" role="status">Demo mode — this phone isn't paired with PC LYNX. Nothing here is live.
      <button className="link" onClick={() => go('connect')}>Pair this phone</button></div>);
  if (link === 'unauthorized') return (
    <div className="banner bad" role="alert">{error?.message}<button className="link" onClick={() => go('connect')}>Pair again</button></div>);
  if (link === 'offline' && error) return (
    <div className="banner warn" role="alert">{error.message}
      <button className="link" onClick={reconnect}>Retry</button>
      {error.detail && <button className="link" onClick={() => setDbg(!dbg)}>{dbg ? 'Hide details' : 'Details'}</button>}
      {dbg && <code className="dbg">{error.detail}</code>}</div>);
  return null;
}
