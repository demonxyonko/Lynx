import { useEffect, useRef, useState } from 'react';
import { Core, type CoreState } from '../components/Core';
import { useLynx } from '../hooks/useLynx';
import { listen, speak, stopSpeaking, sttSupported, ttsSupported } from '../services/voiceService';

const DEMO = [{ id: 'd1', s: 'user', t: 'What\'s on my plate today?' }, { id: 'd2', s: 'lynx', t: 'Demo preview only. Pair this phone to talk to your real LYNX.' }];

export function Talk() {
  const { link, msgs, busy, send, retry, clearChat, prefs } = useLynx();
  const [text, setText] = useState(''); const [hearing, setHearing] = useState(false); const [note, setNote] = useState('');
  const stopRef = useRef<(() => void) | null>(null); const end = useRef<HTMLDivElement>(null);
  const live = link === 'online';
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs, busy]);
  useEffect(() => () => { stopRef.current?.(); stopSpeaking(); }, []);

  const submit = async (t = text) => { const v = t.trim(); if (!v || !live) return; setText(''); try { await send(v); } catch { /* shown on message */ } };
  const mic = () => {
    if (hearing) { stopRef.current?.(); return; }
    if (!sttSupported()) { setNote('Speech input isn\'t supported in this browser. Type instead.'); return; }
    setNote(''); setHearing(true);
    stopRef.current = listen({
      onText: (t, fin) => { setText(t); if (fin) void submit(t); },
      onEnd: () => setHearing(false), onError: (m) => { setNote(m); setHearing(false); },
    });
  };
  const state: CoreState = hearing ? 'listening' : busy ? 'thinking' : live ? 'idle' : 'off';
  const list = live || msgs.length ? msgs.map((m) => ({ id: m.id, s: m.speaker, t: m.text, failed: m.failed })) : DEMO.map((d) => ({ ...d, failed: false }));
  return (
    <section className="page talk">
      <header className="talkhead"><Core state={state} label={hearing ? 'listening' : busy ? 'thinking' : 'idle'} />
        <div className="acts">
          {ttsSupported() && <button className="ghost sm" onClick={stopSpeaking}>Stop speaking</button>}
          <button className="ghost sm" onClick={clearChat}>Clear</button></div></header>
      <div className="feed" aria-live="polite">
        {!live && msgs.length === 0 && <p className="tag">Demo preview</p>}
        {list.map((m) => (
          <div key={m.id} className={`msg ${m.s}`}>
            <p>{m.t}</p>
            {m.failed && <button className="link" onClick={() => void retry(m.id)}>Not delivered — retry</button>}
            {m.s === 'lynx' && ttsSupported() && <button className="link" onClick={() => speak(m.t, prefs)}>Read aloud</button>}
          </div>))}
        {busy && <div className="msg lynx typing" aria-label="LYNX is thinking"><span /><span /><span /></div>}
        <div ref={end} />
      </div>
      {note && <p className="note" role="alert">{note}</p>}
      <form className="composer" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={live ? 'Message LYNX' : 'Pair this phone to send messages'} aria-label="Message" disabled={!live} />
        <button type="button" className={`icon ${hearing ? 'rec' : ''}`} onClick={mic} aria-label={hearing ? 'Stop listening' : 'Speak to LYNX'} disabled={!live}>
          <svg viewBox="0 0 24 24"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM6 11a6 6 0 0 0 12 0M12 17v4" /></svg></button>
        <button className="primary sm" disabled={!live || !text.trim()}>Send</button>
      </form>
    </section>
  );
}
