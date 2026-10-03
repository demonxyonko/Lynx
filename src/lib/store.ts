import { DEFAULT_PREFS, MAX_CHAT } from '../config/defaults';
import type { ChatMsg, Prefs, StoredSession } from '../types';

// NOTE: localStorage is readable by any script on this origin. Only the device-scoped token
// (revocable on the PC) and the server address are stored. No API keys or master secrets exist here.
const K = { session: 'lynx.session', prefs: 'lynx.prefs', chat: 'lynx.chat' };
function read<T>(k: string, fb: T): T { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fb; } catch { return fb; } }
function write(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* quota/private mode */ } }

export const store = {
  session: () => read<StoredSession | null>(K.session, null),
  saveSession: (s: StoredSession) => write(K.session, s),
  prefs: (): Prefs => ({ ...DEFAULT_PREFS, ...read<Partial<Prefs>>(K.prefs, {}) }),
  savePrefs: (p: Prefs) => write(K.prefs, p),
  chat: () => read<ChatMsg[]>(K.chat, []),
  saveChat: (m: ChatMsg[]) => write(K.chat, m.slice(-MAX_CHAT)),
  forgetDevice: () => { try { localStorage.removeItem(K.session); } catch { /* ignore */ } },
  clearAll: () => { try { Object.values(K).forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ } },
};
