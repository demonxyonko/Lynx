import type { Route } from '../hooks/useHash';
const ITEMS: { id: Route; label: string; d: string }[] = [
  { id: 'home', label: 'Home', d: 'M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z' },
  { id: 'talk', label: 'Talk', d: 'M4 5h16v11H9l-5 4z' },
  { id: 'devices', label: 'Devices', d: 'M7 3h10v18H7zM11 18h2' },
  { id: 'settings', label: 'Settings', d: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM3 12h3M18 12h3M12 3v3M12 18v3' },
];
export function Nav({ route, go }: { route: Route; go: (r: Route) => void }) {
  return (
    <nav className="nav" aria-label="Main">
      {ITEMS.map((i) => (
        <button key={i.id} className={route === i.id ? 'on' : ''} aria-current={route === i.id ? 'page' : undefined} onClick={() => go(i.id)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d={i.d} /></svg>{i.label}
        </button>
      ))}
    </nav>
  );
}
