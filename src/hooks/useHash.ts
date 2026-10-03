import { useEffect, useState } from 'react';
export type Route = 'home' | 'talk' | 'devices' | 'settings' | 'connect';
const ROUTES: Route[] = ['home', 'talk', 'devices', 'settings', 'connect'];
const read = (): Route => { const h = location.hash.replace(/^#\/?/, '') as Route; return ROUTES.includes(h) ? h : 'home'; };
/** Hash routing: works on GitHub Pages with no server rewrites. */
export function useHash(): [Route, (r: Route) => void] {
  const [r, setR] = useState<Route>(read);
  useEffect(() => { const f = () => setR(read()); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  return [r, (n) => { location.hash = `#/${n}`; }];
}
