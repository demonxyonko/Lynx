export type CoreState = 'idle' | 'listening' | 'speaking' | 'thinking' | 'off';
/** The LYNX core: the one expressive element. State is also exposed as text for screen readers. */
export function Core({ state, label }: { state: CoreState; label: string }) {
  return (
    <div className="core" data-state={state} role="img" aria-label={`LYNX core: ${label}`}>
      <span className="ring r1" /><span className="ring r2" /><span className="orb" />
    </div>
  );
}
