import { AES_SALT } from '../config/defaults';

const enc = new TextEncoder();
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));

/** Same scheme as the desktop dashboard: AES-256-CBC, key = SHA-256(sessionKey + salt), payload = base64(IV || ciphertext). */
export async function encryptCommand(sessionKey: string, text: string): Promise<string> {
  const raw = await crypto.subtle.digest('SHA-256', enc.encode(sessionKey + AES_SALT));
  const key = await crypto.subtle.importKey('raw', raw, { name: 'AES-CBC' }, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, enc.encode(text)));
  const out = new Uint8Array(16 + ct.length); out.set(iv); out.set(ct, 16);
  return b64(out);
}
