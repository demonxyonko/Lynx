import type { Prefs } from '../types';

export const sttSupported = () => !!(window.SpeechRecognition || window.webkitSpeechRecognition);
export const ttsSupported = () => 'speechSynthesis' in window;
export const voices = () => (ttsSupported() ? speechSynthesis.getVoices() : []);

/** One-shot dictation. Mic is only open while this runs. Returns a stop() handle. */
export function listen(cb: { onText(t: string, final: boolean): void; onEnd(): void; onError(msg: string): void }): () => void {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  const r = new Ctor();
  r.lang = navigator.language || 'en-US'; r.interimResults = true; r.continuous = false;
  r.onresult = (e: any) => { const x = e.results[e.results.length - 1]; cb.onText(x[0].transcript, x.isFinal); };
  r.onerror = (e: any) => cb.onError(e.error === 'not-allowed' ? 'Microphone permission was denied. Allow it in Chrome site settings.' : e.error === 'no-speech' ? "I didn't hear anything." : `Speech recognition failed (${e.error}).`);
  r.onend = () => cb.onEnd();
  r.start();
  return () => { try { r.stop(); } catch { /* already stopped */ } };
}
export function speak(text: string, p: Prefs): void {
  if (!ttsSupported()) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = p.rate; u.pitch = p.pitch; u.volume = p.volume;
  const v = voices().find((x) => x.name === p.voiceName); if (v) u.voice = v;
  speechSynthesis.speak(u);
}
export const stopSpeaking = () => { if (ttsSupported()) speechSynthesis.cancel(); };
