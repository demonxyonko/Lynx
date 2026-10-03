import { Core, type CoreState } from '../components/Core';
import { useLynx } from '../hooks/useLynx';
import type { Route } from '../hooks/useHash';
import { greeting } from '../lib/format';

export function Home({ go }: { go: (r: Route) => void }) {
  const { link, pc, prefs, msgs, busy, wake } = useLynx();
  const live = link === 'online';
  const state: CoreState = !live ? 'off' : busy ? 'thinking' : 'idle';
  const status = link === 'demo' ? 'Demo mode' : live ? (pc === 'sleeping' ? 'Linked · PC asleep' : 'Linked · Ready') : link === 'connecting' ? 'Connecting…' : 'Not reachable';
  const recent = msgs.slice(-3).reverse();
  return (
    <section className="page home">
      <Core state={state} label={status} />
      <h1>{greeting(prefs.userName)}</h1>
      <p className="sub">{status}</p>
      <button className="primary" onClick={() => go('talk')}>Talk to LYNX</button>
      {live && pc === 'sleeping' && <button className="ghost" onClick={wake}>Wake PC LYNX</button>}
      <div className="cards">
        <div className="card"><b>PC</b><span className={`dot ${live ? 'on' : ''}`} />{link === 'demo' ? 'Not paired' : live ? (pc === 'sleeping' ? 'Linked, asleep' : 'Linked') : 'Unreachable'}</div>
        <div className="card"><b>Phone</b><span className="dot on" />This device</div>
      </div>
      <h2>Recent</h2>
      {recent.length === 0 ? <p className="muted">No conversation yet. Say hello.</p> :
        <ul className="recent">{recent.map((m) => <li key={m.id}><i>{m.speaker === 'lynx' ? 'LYNX' : 'You'}</i> {m.text.slice(0, 90)}</li>)}</ul>}
    </section>
  );
}
