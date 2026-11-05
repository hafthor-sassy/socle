// Bouton à remplissage directionnel — React + Tailwind CSS. Couleurs : variables de tokens.css.
import { useRef, useState } from 'react';

const EDGE = { left: 'inset(0 100% 0 0)', right: 'inset(0 0 0 100%)', top: 'inset(0 0 100% 0)', bottom: 'inset(100% 0 0 0)' };

function nearestEdge(el, x, y) {
  const r = el.getBoundingClientRect();
  const d = { left: (x - r.left) / r.width, right: (r.right - x) / r.width, top: (y - r.top) / r.height, bottom: (r.bottom - y) / r.height };
  return Object.keys(d).reduce((a, b) => (d[a] <= d[b] ? a : b));
}
function at(el, x, y) {
  const r = el.getBoundingClientRect();
  return `${(((x - r.left) / r.width) * 100).toFixed(1)}% ${(((y - r.top) / r.height) * 100).toFixed(1)}%`;
}

export function DirectionalFillButton({
  children = 'Rejoindre la liste',
  shape = 'edge',      // 'edge' : nappe depuis le bord · 'circle' : cercle depuis le point d'entrée
  duration = 420,      // ms
  variant = 'accent',  // 'accent' | 'ink' | 'pill'
  className = '',
  ...rest
}) {
  const ref = useRef(null);
  const [clip, setClip] = useState({ value: EDGE.left, animate: false });

  const enter = (x, y) => {
    const el = ref.current;
    const circle = shape === 'circle' && x != null;
    const from = circle ? `circle(0% at ${at(el, x, y)})` : EDGE[x == null ? 'left' : nearestEdge(el, x, y)];
    const to = circle ? `circle(150% at ${at(el, x, y)})` : 'inset(0 0 0 0)';
    setClip({ value: from, animate: false });
    requestAnimationFrame(() => requestAnimationFrame(() => setClip({ value: to, animate: true })));
  };
  const leave = (x, y) => {
    const el = ref.current;
    const to = shape === 'circle' && x != null ? `circle(0% at ${at(el, x, y)})` : EDGE[x == null ? 'right' : nearestEdge(el, x, y)];
    setClip({ value: to, animate: true, out: true });
  };

  const fill = variant === 'ink' ? 'bg-[var(--text-strong)] text-[var(--bg)]' : 'bg-[var(--accent)] text-[var(--accent-fg)]';
  const round = variant === 'pill' ? 'rounded-full' : 'rounded-[var(--radius-ctl)]';
  const active = clip.animate && !clip.out;

  return (
    <button
      ref={ref}
      type="button"
      onPointerEnter={(e) => e.pointerType !== 'touch' && enter(e.clientX, e.clientY)}
      onPointerLeave={(e) => e.pointerType !== 'touch' && leave(e.clientX, e.clientY)}
      onPointerDown={(e) => e.pointerType === 'touch' && enter(e.clientX, e.clientY)}
      onPointerUp={(e) => { if (e.pointerType === 'touch') { const { clientX: x, clientY: y } = e; setTimeout(() => leave(x, y), 260); } }}
      onFocus={(e) => e.currentTarget.matches(':focus-visible') && enter()}
      onBlur={() => leave()}
      className={`relative inline-grid h-12 overflow-hidden whitespace-nowrap border bg-transparent px-6 text-[15px] font-medium leading-none text-[var(--text-strong)]
        transition-[border-color,scale] active:scale-[.97] motion-reduce:transition-none
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]
        ${active ? (variant === 'ink' ? 'border-[var(--text-strong)]' : 'border-[var(--accent)]') : 'border-[var(--border-control)]'} ${round} ${className}`}
      style={{ transitionDuration: `${duration}ms` }}
      {...rest}
    >
      <span className="inline-flex items-center justify-center [grid-area:1/1]">{children}</span>
      <span
        aria-hidden="true"
        className={`absolute -inset-px inline-flex items-center justify-center px-6 motion-reduce:!transition-none ${fill}`}
        style={{ clipPath: clip.value, transition: clip.animate ? `clip-path ${clip.out ? duration * 0.8 : duration}ms cubic-bezier(.22,1,.36,1)` : 'none' }}
      >
        {children}
      </span>
    </button>
  );
}

// Exemple
export function Exemple() {
  return <DirectionalFillButton shape="edge" duration={420} variant="accent">Rejoindre la liste</DirectionalFillButton>;
}
