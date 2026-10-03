import { encryptCommand } from '../lib/crypto';
import type { AuthSession, PcState } from '../types';
import { request, wsUrl } from './lynxApi';

export interface ChatEvents {
  onOpen(): void; onClose(authLost: boolean): void;
  onLog(speaker: 'user' | 'lynx', text: string, ts: number): void;
  onStatus(s: PcState): void; onSeen(): void;
}

/** Live link to PC LYNX: WebSocket /ws (log/status/sys broadcasts) + POST /api/command (encrypted when a key is known). */
export class ChatClient {
  private ws: WebSocket | null = null; private stopped = true; private retry = 0; private timer: number | undefined;
  constructor(private base: string, private auth: AuthSession, private ev: ChatEvents) {}

  setAuth(a: AuthSession) { this.auth = a; }
  start() { this.stopped = false; this.open(); }
  stop() { this.stopped = true; clearTimeout(this.timer); this.ws?.close(); this.ws = null; }

  private open() {
    try { this.ws = new WebSocket(wsUrl(this.base, '/ws', this.auth.token)); } catch { this.schedule(false); return; }
    this.ws.onopen = () => { this.retry = 0; this.ev.onOpen(); };
    this.ws.onmessage = (e) => {
      this.ev.onSeen();
      let m: any; try { m = JSON.parse(String(e.data)); } catch { return; }
      if (m?.type === 'log' && typeof m.text === 'string' && (m.speaker === 'user' || m.speaker === 'lynx'))
        this.ev.onLog(m.speaker, m.text, m.ts ? Date.parse(m.ts) || Date.now() : Date.now());
      else if (m?.type === 'status') this.ev.onStatus(m.state === 'active' ? 'active' : 'sleeping');
    };
    this.ws.onclose = (e) => { if (!this.stopped) this.schedule(e.code === 4001); };
  }
  private schedule(authLost: boolean) {
    this.ev.onClose(authLost);
    if (authLost) return; // provider re-logs in, then calls setAuth + start
    this.retry = Math.min(this.retry + 1, 6);
    this.timer = window.setTimeout(() => this.open(), Math.min(1000 * 2 ** this.retry, 20000));
  }
  async send(text: string): Promise<void> {
    const body = this.auth.key ? { enc: await encryptCommand(this.auth.key, text) } : { text };
    await request(this.base, '/api/command', { method: 'POST', body, token: this.auth.token });
  }
  async wake(): Promise<void> { await request(this.base, '/api/wake', { method: 'POST', body: {}, token: this.auth.token }); }
}
