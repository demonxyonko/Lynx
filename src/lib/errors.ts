import type { ErrorKind } from '../types';

export class LynxError extends Error {
  kind: ErrorKind; detail: string;
  constructor(kind: ErrorKind, message: string, detail = '') { super(message); this.kind = kind; this.detail = detail; }
}
export const MESSAGES: Record<ErrorKind, string> = {
  offline: "This phone is offline. LYNX will reconnect when you're back online.",
  timeout: "LYNX didn't answer in time. Check that PC LYNX is running and reachable, then retry.",
  unauthorized: 'This device is no longer paired. Pair it again from PC LYNX → Remote Control.',
  server: 'PC LYNX reported a problem. Try again in a moment.',
  malformed: "PC LYNX sent a reply this app doesn't understand. The versions may not match.",
  network: "LYNX can't reach the server right now. Check your connection, the server address, and that the PC's HTTPS link (tunnel) is up.",
  mixed: 'This app is served over HTTPS, so it can only talk to an HTTPS address. Use a secure tunnel such as Tailscale or Cloudflare Tunnel.',
  pairing: 'That pairing code or QR is not valid. Generate a fresh one on PC LYNX.',
};
export function toLynxError(e: unknown): LynxError {
  return e instanceof LynxError ? e : new LynxError('network', MESSAGES.network, String(e));
}
