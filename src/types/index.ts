export type Speaker = 'user' | 'lynx';
export interface ChatMsg { id: string; speaker: Speaker; text: string; ts: number; failed?: boolean }
/** demo = not paired; connecting; online = link to PC open; offline = paired but unreachable; unauthorized = must re-pair */
export type LinkState = 'demo' | 'connecting' | 'online' | 'offline' | 'unauthorized';
export type PcState = 'unknown' | 'active' | 'sleeping';
export interface StoredSession { base: string; deviceToken: string }
export interface AuthSession { token: string; key: string }
export interface Prefs {
  userName: string; voiceName: string; rate: number; pitch: number; volume: number;
  speakReplies: boolean; notify: boolean; bridge: boolean;
}
export type ErrorKind = 'offline' | 'timeout' | 'unauthorized' | 'server' | 'malformed' | 'network' | 'mixed' | 'pairing';
declare global {
  interface Window { SpeechRecognition?: any; webkitSpeechRecognition?: any; BarcodeDetector?: any }
}
