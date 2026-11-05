// Icônes qui se transforment — React + Tailwind CSS. Couleurs : variables de tokens.css.
// <MorphIcon name="play" on={playing} /> interpole les tracés sur un ressort ; aucune bibliothèque d'animation.
import { useEffect, useRef, useState } from 'react';

/* Paires à segments égaux. line : interpolée en polaire ; poly, q, solid : point à point ; o : opacité. */
export const SHAPES = {
  menu: { spin: 180, a: [{ k: 'line', p: [[4, 7], [20, 7]] }, { k: 'line', p: [[4, 12], [20, 12]] }, { k: 'line', p: [[4, 17], [20, 17]] }],
    b: [{ k: 'line', p: [[6, 6], [18, 18]] }, { k: 'line', p: [[12, 12], [12, 12]], o: 0 }, { k: 'line', p: [[6, 18], [18, 6]] }] },
  play: { a: [{ k: 'solid', p: [[7.5, 4.8], [13.4, 8.4], [13.4, 15.6], [7.5, 19.2]] }, { k: 'solid', p: [[13.4, 8.4], [19.2, 12], [19.2, 12], [13.4, 15.6]] }],
    b: [{ k: 'solid', p: [[6.8, 5], [10.2, 5], [10.2, 19], [6.8, 19]] }, { k: 'solid', p: [[13.8, 5], [17.2, 5], [17.2, 19], [13.8, 19]] }] },
  follow: { a: [{ k: 'line', p: [[5, 12], [19, 12]] }, { k: 'line', p: [[12, 5], [12, 19]] }],
    b: [{ k: 'line', p: [[5.5, 12.6], [9.8, 16.9]] }, { k: 'line', p: [[9.8, 16.9], [18.6, 7.4]] }] },
  volume: { fixed: 'M4.2 9.4h2.9l4.4-3.9v13l-4.4-3.9H4.2a.7.7 0 0 1-.7-.7V10.1a.7.7 0 0 1 .7-.7z',
    a: [{ k: 'q', p: [[14.6, 9.6], [16.2, 12], [14.6, 14.4]] }, { k: 'q', p: [[17.2, 6.8], [20.6, 12], [17.2, 17.2]] }],
    b: [{ k: 'q', p: [[15.2, 9.5], [17.7, 12], [20.2, 14.5]] }, { k: 'q', p: [[20.2, 9.5], [17.7, 12], [15.2, 14.5]] }] },
  share: { a: [{ k: 'poly', p: [[4.5, 12], [19, 12]] }, { k: 'poly', p: [[13, 6], [19, 12], [13, 18]] }],
    b: [{ k: 'poly', p: [[9.8, 17.2], [9.8, 17.2]], o: 0 }, { k: 'poly', p: [[5, 12.6], [9.8, 17.2], [19, 7.2]] }] },
};

const lerp = (a, b, t) => a + (b - a) * t;
const r2 = (n) => Math.round(n * 100) / 100;
const polar = ([a, b]) => ({ cx: (a[0] + b[0]) / 2, cy: (a[1] + b[1]) / 2, len: Math.hypot(b[0] - a[0], b[1] - a[1]), ang: Math.atan2(b[1] - a[1], b[0] - a[0]) });

function segPath(s0, s1, t) {
  if (s0.k === 'line') {
    const A = polar(s0.p), B = polar(s1.p);
    let d = B.ang - A.ang;
    while (d > Math.PI / 2) d -= Math.PI;
    while (d < -Math.PI / 2) d += Math.PI;
    const cx = lerp(A.cx, B.cx, t), cy = lerp(A.cy, B.cy, t), len = Math.max(0, lerp(A.len, B.len, t)), ang = A.ang + d * t;
    const ex = (Math.cos(ang) * len) / 2, ey = (Math.sin(ang) * len) / 2;
    return `M${r2(cx - ex)} ${r2(cy - ey)}L${r2(cx + ex)} ${r2(cy + ey)}`;
  }
  const pts = s0.p.map((p, i) => [r2(lerp(p[0], s1.p[i][0], t)), r2(lerp(p[1], s1.p[i][1], t))]);
  if (s0.k === 'q') return `M${pts[0].join(' ')}Q${pts[1].join(' ')} ${pts[2].join(' ')}`;
  return `M${pts.map((p) => p.join(' ')).join('L')}${s0.k === 'solid' ? 'Z' : ''}`;
}

/** Ressort amorti (Euler semi-implicite, 4 sous-pas) : renvoie une valeur qui peut dépasser 0..1. */
function useSpring(target, stiffness, damping) {
  const [x, setX] = useState(target);
  const s = useRef({ x: target, v: 0, raf: 0, last: 0 });
  useEffect(() => {
    const st = s.current;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { st.x = target; st.v = 0; setX(target); return; }
    const frame = (t) => {
      const dt = st.last ? Math.min(0.032, (t - st.last) / 1000) : 1 / 60;
      st.last = t;
      for (let i = 0; i < 4; i++) { st.v += (-stiffness * (st.x - target) - damping * st.v) * (dt / 4); st.x += st.v * (dt / 4); }
      if (Math.abs(st.x - target) < 0.0005 && Math.abs(st.v) < 0.005) { st.x = target; st.v = 0; st.last = 0; setX(target); return; }
      setX(st.x);
      st.raf = requestAnimationFrame(frame);
    };
    cancelAnimationFrame(st.raf);
    st.raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(st.raf);
  }, [target, stiffness, damping]);
  return x;
}

export function MorphIcon({ name, on = false, stiffness = 320, damping = 22, stroke = 1.5, spin = true, size = 24, className = '' }) {
  const shape = SHAPES[name];
  const t = useSpring(on ? 1 : 0, stiffness, damping);
  if (!shape) return null;
  const rot = spin && shape.spin ? shape.spin * t : 0;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={`overflow-visible ${className}`}
      style={{ fill: 'none', stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
      <g style={{ transform: `rotate(${rot}deg)`, transformOrigin: '12px 12px', transformBox: 'view-box' }}>
        {shape.fixed && <path d={shape.fixed} />}
        {shape.a.map((s0, i) => {
          const s1 = shape.b[i];
          const o = lerp(s0.o ?? 1, s1.o ?? 1, Math.min(1, Math.max(0, t)));
          return <path key={i} d={segPath(s0, s1, t)} opacity={o} style={s0.k === 'solid' ? { fill: 'currentColor', strokeWidth: 2 } : undefined} />;
        })}
      </g>
    </svg>
  );
}

/** Exemple : contrôles d'un lecteur. */
export function PlayerControls({ stiffness = 320, damping = 22, stroke = 1.5, spin = true }) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [menu, setMenu] = useState(false);
  const cfg = { stiffness, damping, stroke, spin };
  const round = 'inline-grid size-11 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-strong)] transition hover:border-[var(--border-control)] hover:bg-[var(--raised)] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]';
  return (
    <div className="flex flex-wrap items-center gap-3 font-sans">
      <button type="button" className={round} aria-expanded={menu} aria-label={menu ? 'Fermer le menu' : 'Ouvrir le menu'} onClick={() => setMenu(!menu)}>
        <MorphIcon name="menu" on={menu} {...cfg} size={22} />
      </button>
      <button type="button" className={round} aria-pressed={muted} aria-label={muted ? 'Rétablir le son' : 'Couper le son'} onClick={() => setMuted(!muted)}>
        <MorphIcon name="volume" on={muted} {...cfg} size={22} />
      </button>
      <button type="button" aria-label={playing ? 'Mettre en pause' : 'Lire l’épisode'} onClick={() => setPlaying(!playing)}
        className="inline-grid size-16 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-fg)] transition hover:bg-[var(--accent-hover)] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]">
        <MorphIcon name="play" on={playing} {...cfg} size={28} />
      </button>
      <button type="button" aria-pressed={followed} onClick={() => setFollowed(!followed)}
        className={`inline-flex h-11 items-center gap-2 rounded-full border pl-3.5 pr-[18px] text-[15px] font-medium text-[var(--text-strong)] transition active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] ${followed ? 'border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)]' : 'border-[var(--border-control)]'}`}>
        <MorphIcon name="follow" on={followed} {...cfg} size={20} />
        <span className="min-w-[7.2ch] text-left">{followed ? 'Abonné' : 'S’abonner'}</span>
      </button>
    </div>
  );
}

export default MorphIcon;
