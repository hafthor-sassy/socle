// Bouton à bordure tracée — React + Tailwind CSS. Couleurs : variables de tokens.css.
// Ajoutez une fois dans votre CSS global :
//   @keyframes trace-run { to { stroke-dashoffset: -100; } }
import { useLayoutEffect, useRef, useState } from 'react';

const radii = { ctl: 'var(--radius-ctl)', card: 'var(--radius-card)', pill: 'var(--radius-pill)' };

export function TraceButton({
  children = 'Réserver une démo',
  speed = 3.2,        // s par tour
  length = 24,        // % du contour
  width = 1.5,        // px
  trigger = 'loop',   // 'loop' | 'hover'
  shape = 'ctl',      // 'ctl' | 'card' | 'pill'
  className = '',
  ...rest
}) {
  const ref = useRef(null);
  const [box, setBox] = useState({ w: 0, h: 0, r: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    const fit = () => setBox({ w: el.offsetWidth, h: el.offsetHeight, r: parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0 });
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [shape]);

  const i = Math.min(width, 2) / 2;
  const rect = { x: i, y: i, width: Math.max(0, box.w - 2 * i), height: Math.max(0, box.h - 2 * i), rx: Math.max(0, Math.min(box.r, box.h / 2, box.w / 2) - i), pathLength: 100, fill: 'none' };
  const loop = trigger === 'loop';
  const line = loop
    ? { strokeDasharray: `${length} ${100 - length}`, animation: `trace-run ${speed}s linear infinite` }
    : { strokeDasharray: '100 100', transition: `stroke-dashoffset ${speed / 3}s cubic-bezier(.65,0,.35,1)` };

  return (
    <button
      ref={ref}
      type="button"
      style={{ borderRadius: radii[shape] }}
      className={`group relative isolate inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap bg-[var(--surface)] px-6 text-[15px] font-medium leading-none text-[var(--text-strong)]
        transition-[background-color,scale] duration-200 [@media(hover:hover)]:hover:bg-[var(--raised)] active:scale-[.97]
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--focus-ring)] ${className}`}
      {...rest}
    >
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full overflow-visible">
        <rect {...rect} stroke="var(--border-control)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <rect {...rect} stroke="var(--accent-vivid)" strokeWidth={width} strokeLinecap="round" vectorEffect="non-scaling-stroke" style={line}
          className={`motion-reduce:![animation:none] motion-reduce:![stroke-dasharray:none] ${loop ? '' : '[stroke-dashoffset:100] group-hover:[stroke-dashoffset:0] group-focus-visible:[stroke-dashoffset:0] motion-reduce:[stroke-dashoffset:0]'}`} />
      </svg>
      {children}
    </button>
  );
}

// Exemple
export function Exemple() {
  return <TraceButton speed={3.2} length={24} width={1.5} trigger="loop" shape="ctl">Réserver une démo</TraceButton>;
}
