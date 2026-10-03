import { useRef, useState } from 'react';
import { useLynx } from '../hooks/useLynx';
import type { Route } from '../hooks/useHash';
import { toLynxError } from '../lib/errors';
import { parsePairing, qrSupported, scanQr } from '../services/pairingService';

export function Connect({ go }: { go: (r: Route) => void }) {
  const { pair, link } = useLynx();
  const [base, setBase] = useState(''); const [code, setCode] = useState(''); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false); const [scanning, setScanning] = useState(false);
  const video = useRef<HTMLVideoElement>(null); const abort = useRef<AbortController | null>(null);

  const submit = async () => {
    setBusy(true); setMsg('');
    try { await pair(base, code); go('home'); } catch (e) { setMsg(toLynxError(e).message); } finally { setBusy(false); }
  };
  const scan = async () => {
    setMsg(''); setScanning(true); abort.current = new AbortController();
    try {
      const p = parsePairing(await scanQr(video.current!, abort.current.signal));
      setCode(p.key);
      setMsg(p.host ? 'Code captured. The QR points at a local address, which this HTTPS app cannot call. Enter your secure (HTTPS) PC link below, then connect.' : 'Code captured. Enter your secure PC link and connect.');
    } catch (e) { setMsg(toLynxError(e).message); } finally { setScanning(false); }
  };
  return (
    <section className="page">
      <h1>Connect this device to LYNX</h1>
      <p className="muted">On PC LYNX press <b>Remote Control</b> to show a 6-character code. Codes expire after 10 minutes and work once.</p>
      {qrSupported() && <button className="ghost" onClick={scanning ? () => abort.current?.abort() : scan}>{scanning ? 'Stop scanning' : 'Scan QR from PC'}</button>}
      <video ref={video} className={scanning ? 'cam' : 'hide'} muted playsInline />
      <label>Secure PC link<input value={base} onChange={(e) => setBase(e.target.value)} placeholder="https://your-pc.tailnet.ts.net" inputMode="url" autoCapitalize="off" autoCorrect="off" /></label>
      <label>Pairing code<input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} placeholder="ABC234" autoCapitalize="characters" /></label>
      {msg && <p className="note" role="alert">{msg}</p>}
      <button className="primary" disabled={busy || !base || code.length !== 6} onClick={submit}>{busy ? 'Connecting…' : 'Connect'}</button>
      {link !== 'demo' && <button className="ghost" onClick={() => go('home')}>Cancel</button>}
      <p className="muted">Needs an HTTPS address for your PC (Tailscale or Cloudflare Tunnel) and the one-line CORS change in docs/PAIRING.md.</p>
    </section>
  );
}
