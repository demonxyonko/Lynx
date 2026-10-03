import type { Prefs } from '../types';
export const APP_NAME = 'LYNX';
/** Mirrors dashboard/server.py: _AES_SALT, key alphabet (no O/I/L/0/1), 6-char one-time pairing key. */
export const AES_SALT = 'LYNX-DASHBOARD-v1';
export const PAIR_KEY_RE = /^[A-HJ-KM-NP-Z2-9]{6}$/;
export const MAX_CHAT = 200;
export const DEFAULT_PREFS: Prefs = {
  userName: 'Ricky', voiceName: '', rate: 1, pitch: 1, volume: 1,
  speakReplies: false, notify: false, bridge: false,
};
