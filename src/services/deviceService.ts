import { wsUrl } from './lynxApi';

export interface Capability { id: string; label: string; ok: boolean; note: string }

export async function battery(): Promise<{ level: number; charging: boolean } | null> {
  try { const b = await (navigator as any).getBattery?.(); return b ? { level: Math.round(b.level * 100), charging: !!b.charging } : null; } catch { return null; }
}
export function platformLabel(): string {
  const ua = navigator.userAgent;
  return /Android/i.test(ua) ? 'Android' : /iPhone|iPad/i.test(ua) ? 'iOS' : /Windows/i.test(ua) ? 'Windows' : 'Browser';
}
export function capabilities(): Capability[] {
  const c = (id: string, label: string, ok: boolean, note: string): Capability => ({ id, label, ok, note });
  return [
    c('mic', 'Microphone / speech input', !!(window.SpeechRecognition || window.webkitSpeechRecognition), 'Web Speech API (Chrome)'),
    c('tts', 'Voice output', 'speechSynthesis' in window, 'SpeechSynthesis API'),
    c('cam', 'Camera (QR pairing)', !!navigator.mediaDevices?.getUserMedia, 'getUserMedia'),
    c('qr', 'QR detection', !!window.BarcodeDetector, 'BarcodeDetector; manual code works without it'),
    c('vib', 'Vibration', 'vibrate' in navigator, 'Not available on every browser'),
    c('notif', 'Notifications', 'Notification' in window, 'Only while the app is open or recently active'),
    c('clip', 'Clipboard', !!navigator.clipboard, 'Requires the app to be in the foreground'),
    c('bat', 'Battery status', 'getBattery' in navigator, 'Chrome only'),
  ];
}
export async function notify(title: string, body: string): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const reg = await navigator.serviceWorker?.getRegistration();
  if (reg) await reg.showNotification(title, { body, icon: `${import.meta.env.BASE_URL}icons/icon-192.png` });
  else new Notification(title, { body });
}

/**
 * Optional bridge: lets PC LYNX's `mobile_control` tool reach this phone over /ws/native.
 * A PWA can only answer status/device_info/toast; everything else (tap, swipe, screenshot, open_app...)
 * needs the native Android app and is refused honestly.
 */
export class NativeBridge {
  private ws: WebSocket | null = null;
  constructor(private base: string, private token: string, private onToast: (t: string) => void) {}
  start() {
    this.ws = new WebSocket(wsUrl(this.base, '/ws/native', this.token));
    this.ws.onopen = async () => this.ws?.send(JSON.stringify({ type: 'device_info', payload: await this.info() }));
    this.ws.onmessage = async (e) => {
      let m: any; try { m = JSON.parse(String(e.data)); } catch { return; }
      if (m?.type !== 'command') return;
      const a = String(m.command?.action ?? '').toLowerCase();
      let res: Record<string, unknown>;
      if (a === 'status' || a === 'device_info') res = { ok: true, data: await this.info() };
      else if (a === 'toast') { const t = String(m.command?.text ?? ''); this.onToast(t); void notify('LYNX', t); res = { ok: true, data: 'Shown.' }; }
      else res = { ok: false, error: `"${a}" needs the native LYNX Android app; the browser app cannot do that.` };
      this.ws?.send(JSON.stringify({ type: 'result', request_id: m.request_id, ...res }));
    };
  }
  stop() { this.ws?.close(); this.ws = null; }
  private async info() {
    return { client: 'lynx-pwa', platform: platformLabel(), online: navigator.onLine, battery: await battery(), supported: ['status', 'device_info', 'toast'] };
  }
}
