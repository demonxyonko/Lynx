import { useEffect, useState } from 'react';
import { useLynx } from '../hooks/useLynx';
import { ago } from '../lib/format';
import { battery, capabilities, platformLabel } from '../services/deviceService';

export function Devices() {
  const { link, pc, lastSeen, online } = useLynx();
  const [bat, setBat] = useState<string>(''); const [, tick] = useState(0);
  useEffect(() => { void battery().then((b) => b && setBat(`${b.level}%${b.charging ? ' charging' : ''}`)); const t = setInterval(() => tick((n) => n + 1), 15000); return () => clearInterval(t); }, []);
  const live = link === 'online';
  const pcText = link === 'demo' ? 'Not paired' : live ? (pc === 'sleeping' ? 'Linked · asleep' : 'Linked · active') : link === 'connecting' ? 'Connecting' : link === 'unauthorized' ? 'Pairing expired' : 'Unreachable';
  return (
    <section className="page">
      <h1>Devices</h1>
      <p className="muted">PC LYNX has no device registry endpoint yet, so this shows the link state this phone can actually observe.</p>
      <div className="dev"><span className={`dot ${online ? 'on' : ''}`} /><div><b>This phone</b><small>{platformLabel()} · {online ? 'Online' : 'Offline'}{bat ? ` · Battery ${bat}` : ''}</small><small>Last seen: now</small></div></div>
      <div className="dev"><span className={`dot ${live ? 'on' : ''}`} /><div><b>PC LYNX</b><small>Windows · {pcText}</small><small>Last message: {live || lastSeen ? ago(lastSeen) : '—'}</small></div></div>
      <h2>What this phone can do</h2>
      <ul className="caps">{capabilities().map((c) => <li key={c.id}><span className={`chip ${c.ok ? 'ok' : ''}`}>{c.ok ? 'Available' : 'Unavailable'}</span><b>{c.label}</b><small>{c.note}</small></li>)}</ul>
      <p className="muted">Tapping, swiping, screenshots, opening other apps and reading notifications need the native LYNX Android app. A browser app cannot do them.</p>
    </section>
  );
}
