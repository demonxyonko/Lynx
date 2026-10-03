import { PAIR_KEY_RE } from '../config/defaults';
import { LynxError, MESSAGES } from '../lib/errors';
import { store } from '../lib/store';
import type { AuthSession, StoredSession } from '../types';
import { normalizeBase, request } from './lynxApi';

interface PairRes { ok: boolean; token?: string; key?: string; device_token?: string }
interface LoginRes { ok: boolean; token?: string; key?: string }

/** POST /api/native-pair — consumes the one-time 6-char key shown by PC LYNX → Remote Control. */
export async function pair(baseInput: string, code: string): Promise<{ session: StoredSession; auth: AuthSession }> {
  const base = normalizeBase(baseInput);
  const key = code.trim().toUpperCase();
  if (!PAIR_KEY_RE.test(key)) throw new LynxError('pairing', MESSAGES.pairing);
  const r = await request<PairRes>(base, '/api/native-pair', { method: 'POST', body: { key } });
  if (!r.ok || !r.token || !r.device_token) throw new LynxError('malformed', MESSAGES.malformed, 'native-pair missing fields');
  const session = { base, deviceToken: r.device_token };
  store.saveSession(session);
  return { session, auth: { token: r.token, key: r.key ?? key } };
}

/** POST /api/device-login — exchange the stored device token for a fresh session token + AES key. */
export async function login(s: StoredSession): Promise<AuthSession> {
  const r = await request<LoginRes>(s.base, '/api/device-login', { method: 'POST', body: { device_token: s.deviceToken } });
  if (!r.ok || !r.token) throw new LynxError('malformed', MESSAGES.malformed, 'device-login missing token');
  return { token: r.token, key: r.key ?? '' };
}
export const logout = () => store.forgetDevice();
