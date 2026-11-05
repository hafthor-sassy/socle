// Bouton magnétique — React + Tailwind CSS. Couleurs : variables de tokens.css.
import { useEffect, useRef } from 'react';

export function MagneticButton({
  children = 'Démarrer un projet',
  strength = 0.4,   // part de la distance au curseur suivie par le bouton
  radius = 120,     // px autour du bouton où l'aimant agit
  stiffness = 220,  // raideur du ressort
  damping = 16,     // amortissement : bas = rebond, haut = retour sec
  variant = 'solid',
  className = '',
  ...rest
}) {
  const ref = useRef(null);
  const cfg = useRef({ strength, radius, stiffness, damping });
  cfg.current = { strength, radius, stiffness, damping };

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let x = 0, y = 0, vx = 0, vy = 0, tx = 0, ty = 0, raf = 0, last = 0;

    const frame = (t) => {
      const dt = last ? Math.min(0.032, (t - last) / 1000) : 0.016;
      last = t;
      const { stiffness: k, damping: c } = cfg.current;
      vx += (-k * (x - tx) - c * vx) * dt;
      vy += (-k * (y - ty) - c * vy) * dt;
      x += vx * dt;
      y += vy * dt;
      el.style.setProperty('--mx', `${x.toFixed(2)}px`);
      el.style.setProperty('--my', `${y.toFixed(2)}px`);
      if (Math.abs(x - tx) + Math.abs(y - ty) + Math.abs(vx) + Math.abs(vy) < 0.1) {
        el.style.setProperty('--mx', `${tx}px`);
        el.style.setProperty('--my', `${ty}px`);
        x = tx; y = ty; vx = vy = 0; last = 0; raf = 0;
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf) raf = requestAnimationFrame(frame); };

    const onMove = (e) => {
      if (e.pointerType === 'touch') return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2 - x);
      const dy = e.clientY - (r.top + r.height / 2 - y);
      const ex = Math.max(Math.abs(dx) - r.width / 2, 0);
      const ey = Math.max(Math.abs(dy) - r.height / 2, 0);
      const near = Math.hypot(ex, ey) < cfg.current.radius;
      el.dataset.near = String(near);
      tx = near ? dx * cfg.current.strength : 0;
      ty = near ? dy * cfg.current.strength : 0;
      wake();
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf); };
  }, []);

  const tone = variant === 'outline'
    ? 'bg-[var(--surface)] text-[var(--text-strong)] border-[var(--border-control)]'
    : 'bg-[var(--accent)] text-[var(--accent-fg)] border-transparent';
  const dot = variant === 'outline'
    ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
    : 'bg-[var(--accent-fg)] text-[var(--accent)]';

  return (
    <button
      ref={ref}
      type="button"
      style={{ '--mx': '0px', '--my': '0px' }}
      className={`group relative inline-flex h-14 items-center gap-3.5 whitespace-nowrap rounded-full border pl-6 pr-2 text-base font-medium leading-none
        [transform:translate3d(var(--mx),var(--my),0)] transition-[scale] duration-200 ease-[cubic-bezier(.34,1.56,.64,1)] active:scale-[.96]
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--focus-ring)]
        motion-reduce:transform-none motion-reduce:transition-none ${tone} ${className}`}
      {...rest}
    >
      <span className="[transform:translate3d(calc(var(--mx)*.1),calc(var(--my)*.1),0)] motion-reduce:transform-none">{children}</span>
      <span aria-hidden="true" className={`grid h-10 w-10 place-items-center rounded-full [transform:translate3d(calc(var(--mx)*.12),calc(var(--my)*.12),0)] motion-reduce:transform-none ${dot}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
          className="transition-[rotate] duration-[260ms] ease-[cubic-bezier(.34,1.56,.64,1)] group-data-[near=true]:-rotate-45 group-focus-visible:-rotate-45 motion-reduce:transition-none">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </button>
  );
}

// Exemple
export function Exemple() {
  return <MagneticButton strength={0.4} radius={120} stiffness={220} damping={16} variant="solid">Démarrer un projet</MagneticButton>;
}
