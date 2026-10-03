import { LynxError, MESSAGES } from '../lib/errors';

/** Validate and normalise a user-entered server address. Only http(s) origins are accepted. */
export function normalizeBase(input: string): string {
  let s = input.trim();
  if (!s) throw new LynxError('pairing', 'Enter the HTTPS address of your PC LYNX link.');
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s) && !/^https?:\/\//i.test(s)) throw new LynxError('pairing', 'Only http(s) addresses are allowed.');
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  let u: URL;
  try { u = new URL(s); } catch { throw new LynxError('pairing', 'That server address is not valid.'); }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new LynxError('pairing', 'Only http(s) addresses are allowed.');
  return u.origin;
}
const isLocal = (h: string) => h === 'localhost' || h === '127.0.0.1';

/** HTTPS pages can't call http:// hosts (mixed content) except localhost. Fail early with a useful message. */
export function assertReachableScheme(base: string): void {
  const u = new URL(base);
  if (location.protocol === 'https:' && u.protocol === 'http:' && !isLocal(u.hostname)) throw new LynxError('mixed', MESSAGES.mixed, base);
}
export const wsUrl = (base: string, path: string, token: string) =>
  `${base.replace(/^http/i, 'ws')}${path}?token=${encodeURIComponent(token)}`;

interface Opts { method?: 'GET' | 'POST'; body?: unknown; token?: string; timeout?: number }

export async function request<T>(base: string, path: string, o: Opts = {}): Promise<T> {
  if (!navigator.onLine) throw new LynxError('offline', MESSAGES.offline);
  assertReachableScheme(base);
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), o.timeout ?? 10000);
  try {
    const res = await fetch(base + path, {
      method: o.method ?? 'GET', signal: ctl.signal,
      headers: { ...(o.body ? { 'Content-Type': 'application/json' } : {}), ...(o.token ? { Authorization: `Bearer ${o.token}` } : {}) },
      body: o.body ? JSON.stringify(o.body) : undefined,
    });
    if (res.status === 401) throw new LynxError('unauthorized', MESSAGES.unauthorized, `401 ${path}`);
    if (res.status >= 500) throw new LynxError('server', MESSAGES.server, `${res.status} ${path}`);
    let json: unknown;
    try { json = await res.json(); } catch { throw new LynxError('malformed', MESSAGES.malformed, `non-JSON ${res.status} ${path}`); }
    if (!res.ok) throw new LynxError('server', MESSAGES.server, `${res.status} ${path}`);
    return json as T;
  } catch (e) {
    if (e instanceof LynxError) throw e;
    if ((e as Error).name === 'AbortError') throw new LynxError('timeout', MESSAGES.timeout, path);
    // Browsers hide the cause: CORS, mixed content, DNS, refused connection all look the same.
    throw new LynxError('network', MESSAGES.network, `${(e as Error).message} (${path}) — often missing CORS on the PC, or an unreachable/HTTP address`);
  } finally { clearTimeout(timer); }
}
