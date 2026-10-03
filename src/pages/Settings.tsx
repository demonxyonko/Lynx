import { useEffect, useState } from 'react';
import { useLynx } from '../hooks/useLynx';
import type { Route } from '../hooks/useHash';
import { friendlyHost } from '../lib/format';
import { stopSpeaking, speak, sttSupported, ttsSupported, voices } from '../services/voiceService';

export function Settings({ go }: { go: (r: Route) => void }) {
  const { prefs, setPrefs, host, error, link, forgetDevice, clearAll } = useLynx();
  const [vs, setVs] = useState(voices());
  useEffect(() => { if (!ttsSupported()) return; const f = () => setVs(voices()); speechSynthesis.addEventListener('voiceschanged', f); return () => speechSynthesis.removeEventListener('voiceschanged', f); }, []);
  const notif = async (on: boolean) => {
    if (on && 'Notification' in window && Notification.permission !== 'granted') { if ((await Notification.requestPermission()) !== 'granted') return; }
    setPrefs({ notify: on });
  };
  return (
    <section className="page">
      <h1>Settings</h1>
      <h2>Identity</h2>
      <label>Your name<input value={prefs.userName} onChange={(e) => setPrefs({ userName: e.target.value })} /></label>
      <p className="muted">Assistant: LYNX. Personality, memory and voice live on PC LYNX; this phone doesn't change them.</p>
      <h2>Voice</h2>
      {!sttSupported() && <p className="muted">Speech input isn't available in this browser.</p>}
      {ttsSupported() ? <>
        <label>Voice<select value={prefs.voiceName} onChange={(e) => setPrefs({ voiceName: e.target.value })}><option value="">Default</option>{vs.map((v) => <option key={v.name} value={v.name}>{v.name}</option>)}</select></label>
        <label>Speed {prefs.rate.toFixed(1)}<input type="range" min="0.5" max="2" step="0.1" value={prefs.rate} onChange={(e) => setPrefs({ rate: +e.target.value })} /></label>
        <label>Pitch {prefs.pitch.toFixed(1)}<input type="range" min="0.5" max="2" step="0.1" value={prefs.pitch} onChange={(e) => setPrefs({ pitch: +e.target.value })} /></label>
        <label>Volume {Math.round(prefs.volume * 100)}%<input type="range" min="0" max="1" step="0.05" value={prefs.volume} onChange={(e) => setPrefs({ volume: +e.target.value })} /></label>
        <div className="row"><button className="ghost sm" onClick={() => speak('This is LYNX.', prefs)}>Test voice</button><button className="ghost sm" onClick={stopSpeaking}>Stop</button></div>
        <label className="sw"><input type="checkbox" checked={prefs.speakReplies} onChange={(e) => setPrefs({ speakReplies: e.target.checked })} />Speak replies on this phone (PC LYNX also speaks them aloud)</label></>
        : <p className="muted">Voice output isn't available in this browser.</p>}
      <h2>Notifications and device</h2>
      <label className="sw"><input type="checkbox" checked={prefs.notify} onChange={(e) => void notif(e.target.checked)} />Notify me of replies when the app is in the background</label>
      <label className="sw"><input type="checkbox" checked={prefs.bridge} onChange={(e) => setPrefs({ bridge: e.target.checked })} />Let PC LYNX send this phone status and toast requests (applies on next connect)</label>
      <h2>Connection</h2>
      <p>Server: {friendlyHost(host)} · {link}</p>
      <button className="ghost" onClick={() => go('connect')}>{host ? 'Pair again' : 'Pair this phone'}</button>
      <details><summary>Debug details</summary><code className="dbg">{error ? `${error.kind}: ${error.detail || error.message}` : 'No errors.'}</code></details>
      <h2>Privacy</h2>
      <p className="muted">Stored on this phone: server address, a revocable device token, preferences and the last 200 messages. No API keys are ever stored here.</p>
      <button className="ghost" onClick={forgetDevice}>Forget this device</button>
      <button className="danger" onClick={() => { if (confirm('Clear all LYNX data on this phone?')) clearAll(); }}>Clear local data</button>
    </section>
  );
}
