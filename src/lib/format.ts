export function greeting(name: string, d = new Date()): string {
  const h = d.getHours();
  const part = h < 5 ? 'Good evening' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return name ? `${part}, ${name}.` : `${part}.`;
}
export function ago(ts: number | null, now = Date.now()): string {
  if (!ts) return 'not seen yet';
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 20) return 'now';
  if (s < 90) return `${s}s ago`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
}
/** Never show raw IPs in the UI. */
export function friendlyHost(base: string | undefined): string {
  if (!base) return 'Not set';
  try { const h = new URL(base).hostname; return /^[\d.]+$|:/.test(h) ? 'Private server' : h; } catch { return 'Not set'; }
}
