import { PAIR_KEY_RE } from '../config/defaults';
import { LynxError, MESSAGES } from '../lib/errors';

export interface PairingPayload { host: string; port: number; key: string }

/**
 * Parses the desktop QR format built in main.py `_make_remote_key`:  lynx://pair?host=<ip>&port=<n>&key=<6 chars>
 * Nothing in the payload is ever opened or fetched automatically; only the key is used,
 * and the server address is something the user types/confirms.
 */
export function parsePairing(raw: string): PairingPayload {
  const t = raw.trim();
  if (PAIR_KEY_RE.test(t.toUpperCase())) return { host: '', port: 0, key: t.toUpperCase() }; // bare code
  let u: URL;
  try { u = new URL(t); } catch { throw new LynxError('pairing', MESSAGES.pairing); }
  if (u.protocol !== 'lynx:' || u.hostname !== 'pair') throw new LynxError('pairing', MESSAGES.pairing);
  const host = u.searchParams.get('host') ?? '';
  const port = Number(u.searchParams.get('port') ?? '8000');
  const key = (u.searchParams.get('key') ?? '').toUpperCase();
  if (!/^[A-Za-z0-9.\-]{1,253}$/.test(host) || !Number.isInteger(port) || port < 1 || port > 65535 || !PAIR_KEY_RE.test(key))
    throw new LynxError('pairing', MESSAGES.pairing);
  return { host, port, key };
}
export const qrSupported = () => typeof window !== 'undefined' && !!window.BarcodeDetector && !!navigator.mediaDevices?.getUserMedia;

/** Scan one QR from the camera using the browser's BarcodeDetector (Chrome on Android). Caller owns the stream. */
export async function scanQr(video: HTMLVideoElement, signal: AbortSignal): Promise<string> {
  const det = new window.BarcodeDetector({ formats: ['qr_code'] });
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
  video.srcObject = stream; await video.play();
  try {
    while (!signal.aborted) {
      const found = await det.detect(video);
      if (found[0]?.rawValue) return found[0].rawValue as string;
      await new Promise((r) => setTimeout(r, 250));
    }
    throw new LynxError('pairing', 'Scan cancelled.');
  } finally { stream.getTracks().forEach((t) => t.stop()); video.srcObject = null; }
}
