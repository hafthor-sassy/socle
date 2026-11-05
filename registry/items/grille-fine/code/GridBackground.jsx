// Grille fine — React + Tailwind CSS. Couleur héritée de --text-muted (tokens.css).
// Ajoutez dans tailwind.config.js :
//   theme.extend.keyframes['grid-drift'] = { to: { transform: 'translate(var(--gx), var(--gy))' } }
import { useId } from 'react';

const DIRS = { diagonal: [1, 1], right: [1, 0], down: [0, 1] };

function Motif({ pattern, size, thickness }) {
  const c = size / 2;
  if (pattern === 'lines') return <path d={`M${size} 0V${size}H0`} fill="none" stroke="currentColor" strokeWidth={thickness} />;
  if (pattern === 'cross') return <path d={`M${c} ${c - 3}v6M${c - 3} ${c}h6`} fill="none" stroke="currentColor" strokeWidth={thickness} strokeLinecap="round" />;
  return <circle cx={c} cy={c} r={thickness} fill="currentColor" />;
}

export function GridBackground({ pattern = 'dots', size = 24, opacity = 0.35, thickness = 1, speed = 12, direction = 'diagonal' }) {
  const id = useId().replace(/:/g, '');
  const [dx, dy] = DIRS[direction] ?? DIRS.diagonal;
  const moving = speed > 0;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden text-[var(--text-muted)]" style={{ opacity }}>
      <svg
        className={`absolute ${moving ? 'animate-[grid-drift_var(--gd)_linear_infinite] motion-reduce:animate-none' : ''}`}
        style={{ top: -size, left: -size, width: `calc(100% + ${size * 2}px)`, height: `calc(100% + ${size * 2}px)`, '--gd': `${moving ? size / speed : 0}s`, '--gx': `${size * dx}px`, '--gy': `${size * dy}px` }}
      >
        <defs>
          <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
            <Motif pattern={pattern} size={size} thickness={thickness} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    </div>
  );
}

// Exemple
export function Exemple() {
  return (
    <section className="relative isolate min-h-[480px] bg-[var(--bg)]">
      <GridBackground pattern="dots" size={24} opacity={0.35} thickness={1} speed={12} direction="diagonal" />
      {/* Votre contenu ici */}
    </section>
  );
}
