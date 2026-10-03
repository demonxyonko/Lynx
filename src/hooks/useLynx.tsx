import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { MAX_CHAT } from '../config/defaults';
import { LynxError, toLynxError } from '../lib/errors';
import { store } from '../lib/store';
import type { AuthSession, ChatMsg, LinkState, PcState, Prefs } from '../types';
import { login, logout as clearDevice, pair as doPair } from '../services/authService';
import { ChatClient } from '../services/chatService';
import { NativeBridge, notify } from '../services/deviceService';
import { speak, stopSpeaking } from '../services/voiceService';

interface Ctx {
  link: LinkState; pc: PcState; msgs: ChatMsg[]; busy: boolean; error: LynxError | null; lastSeen: number | null;
  online: boolean; prefs: Prefs; toast: string; host: string | undefined;
  setPrefs(p: Partial<Prefs>): void; pair(base: string, code: string): Promise<void>;
  send(text: string): Promise<void>; retry(id: string): Promise<void>; wake(): Promise<void>;
  clearChat(): void; forgetDevice(): void; clearAll(): void; reconnect(): void;
}
const C = createContext<Ctx | null>(null);
export const useLynx = () => { const v = useContext(C); if (!v) throw new Error('LynxProvider missing'); return v; };

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export function LynxProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(store.session());
  const [prefs, setPrefsState] = useState<Prefs>(store.prefs());
  const [link, setLink] = useState<LinkState>(session ? 'connecting' : 'demo');
  const [pc, setPc] = useState<PcState>('unknown');
  const [msgs, setMsgs] = useState<ChatMsg[]>(store.chat());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<LynxError | null>(null);
  const [lastSeen, setLastSeen] = useState<number | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [toast, setToast] = useState('');
  const client = useRef<ChatClient | null>(null);
  const bridge = useRef<NativeBridge | null>(null);
  const prefsRef = useRef(prefs); prefsRef.current = prefs;
  const busyTimer = useRef<number | undefined>(undefined);

  const flash = useCallback((t: string) => { setToast(t); window.setTimeout(() => setToast(''), 3500); }, []);
  const addMsg = useCallback((m: ChatMsg) => setMsgs((cur) => {
    // PC replays its last ~50 broadcasts on every connect → de-duplicate by speaker+text+second.
    const dupe = cur.some((x) => x.speaker === m.speaker && x.text === m.text && Math.abs(x.ts - m.ts) < 2000);
    return dupe ? cur : [...cur, m].slice(-MAX_CHAT);
  }), []);
  useEffect(() => { store.saveChat(msgs); }, [msgs]);
  useEffect(() => {
    const up = () => setOnline(true), down = () => setOnline(false);
    addEventListener('online', up); addEventListener('offline', down);
    return () => { removeEventListener('online', up); removeEventListener('offline', down); };
  }, []);

  const teardown = useCallback(() => { client.current?.stop(); client.current = null; bridge.current?.stop(); bridge.current = null; }, []);

  const startLink = useCallback((base: string, auth: AuthSession, stored: { base: string; deviceToken: string }) => {
    teardown();
    const c = new ChatClient(base, auth, {
      onOpen: () => { setLink('online'); setError(null); },
      onSeen: () => setLastSeen(Date.now()),
      onStatus: setPc,
      onLog: (speaker, text, ts) => {
        addMsg({ id: uid(), speaker, text, ts });
        if (speaker === 'lynx') {
          window.clearTimeout(busyTimer.current); setBusy(false);
          if (prefsRef.current.speakReplies) speak(text, prefsRef.current);
          if (prefsRef.current.notify && document.hidden) void notify('LYNX', text.slice(0, 140));
        }
      },
      onClose: async (authLost) => {
        setLink('offline');
        if (!authLost) return;
        try { const a = await login(stored); c.setAuth(a); c.start(); }
        catch (e) { const le = toLynxError(e); setError(le); setLink(le.kind === 'unauthorized' ? 'unauthorized' : 'offline'); }
      },
    });
    client.current = c; c.start();
    if (prefsRef.current.bridge) { bridge.current = new NativeBridge(base, auth.token, flash); try { bridge.current.start(); } catch { /* optional */ } }
  }, [addMsg, flash, teardown]);

  const connect = useCallback(async () => {
    if (!session) { setLink('demo'); return; }
    setLink('connecting'); setError(null);
    try { const auth = await login(session); startLink(session.base, auth, session); }
    catch (e) { const le = toLynxError(e); setError(le); setLink(le.kind === 'unauthorized' ? 'unauthorized' : 'offline'); }
  }, [session, startLink]);

  useEffect(() => { void connect(); return teardown; }, [connect, teardown]);
  useEffect(() => { if (online && session && link === 'offline') void connect(); }, [online]); // eslint-disable-line react-hooks/exhaustive-deps

  const pair = useCallback(async (base: string, code: string) => {
    const { session: s, auth } = await doPair(base, code);
    setSession(s); setLink('connecting'); startLink(s.base, auth, s); flash('Phone connected');
  }, [flash, startLink]);

  const deliver = useCallback(async (id: string, text: string) => {
    if (!client.current) throw new LynxError('offline', 'Not connected to PC LYNX yet.');
    setBusy(true);
    window.clearTimeout(busyTimer.current); busyTimer.current = window.setTimeout(() => setBusy(false), 90000);
    try { await client.current.send(text); setMsgs((m) => m.map((x) => (x.id === id ? { ...x, failed: false } : x))); }
    catch (e) { setBusy(false); setMsgs((m) => m.map((x) => (x.id === id ? { ...x, failed: true } : x))); setError(toLynxError(e)); throw e; }
  }, []);
  const send = useCallback(async (text: string) => { const id = uid(); setMsgs((m) => [...m, { id, speaker: 'user', text, ts: Date.now() }]); await deliver(id, text); }, [deliver]);
  const retry = useCallback(async (id: string) => { const m = msgs.find((x) => x.id === id); if (m) await deliver(id, m.text); }, [msgs, deliver]);
  const wake = useCallback(async () => { try { await client.current?.wake(); flash('Wake signal sent'); } catch (e) { setError(toLynxError(e)); } }, [flash]);

  const setPrefs = useCallback((p: Partial<Prefs>) => setPrefsState((cur) => { const n = { ...cur, ...p }; store.savePrefs(n); return n; }), []);
  const forgetDevice = useCallback(() => { teardown(); clearDevice(); setSession(null); setLink('demo'); setPc('unknown'); setError(null); }, [teardown]);
  const clearAll = useCallback(() => { forgetDevice(); stopSpeaking(); store.clearAll(); setMsgs([]); setPrefsState(store.prefs()); }, [forgetDevice]);
  const clearChat = useCallback(() => setMsgs([]), []);

  const value = useMemo<Ctx>(() => ({
    link, pc, msgs, busy, error, lastSeen, online, prefs, toast, host: session?.base,
    setPrefs, pair, send, retry, wake, clearChat, forgetDevice, clearAll, reconnect: () => void connect(),
  }), [link, pc, msgs, busy, error, lastSeen, online, prefs, toast, session, setPrefs, pair, send, retry, wake, clearChat, forgetDevice, clearAll, connect]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
