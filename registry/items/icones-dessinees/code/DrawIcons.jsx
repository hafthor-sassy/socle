// Icônes qui se dessinent — React + Tailwind CSS. Couleurs : variables de tokens.css.
// <DrawIcon paths={[...]} /> trace n'importe quelle icône au trait 24 × 24 ; <DrawIconsDemo /> montre les états.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const CSS = `
@keyframes di-draw { 0% { stroke-dashoffset: 1; opacity: 0 } 6% { opacity: 1 } 100% { stroke-dashoffset: 0; opacity: 1 } }
.di-drawing .di-ink { animation: di-draw var(--dd) var(--de) both; animation-delay: calc(var(--i) * var(--ds)); }
@media (prefers-reduced-motion: reduce) { .di-drawing .di-ink { animation: none } }`;

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Ressort amorti échantillonné en easing CSS linear(). */
function spring(k = 260, c = 12) {
  let x = 0, v = 0, t = 0; const dt = 1 / 120, pts = [];
  while (t < 2.5) { v += (-k * (x - 1) - c * v) * dt; x += v * dt; t += dt; pts.push(x); if (t > 0.3 && Math.abs(x - 1) < 0.001 && Math.abs(v) < 0.01) break; }
  const step = Math.max(1, Math.round(pts.length / 48)), out = ['0'];
  for (let i = step; i < pts.length; i += step) out.push(pts[i].toFixed(3));
  return { easing: `linear(${[...out, '1'].join(', ')})`, duration: Math.round(t * 1000) };
}
const POP = spring();

/** Une icône qui se trace. `drawKey` change → l'icône se retrace. */
export function DrawIcon({ paths, drawKey = 0, duration = 700, stagger = 90, ease = 'cubic-bezier(.65,0,.35,1)', stroke = 1.5, size = 32, className = '', children }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el || reduced() || !drawKey) return;
    el.classList.remove('di-drawing'); void el.getBoundingClientRect(); el.classList.add('di-drawing');
  }, [drawKey]);
  return (
    <svg ref={ref} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={`overflow-visible fill-none stroke-current ${className}`}
      style={{ strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round', '--dd': `${duration}ms`, '--ds': `${stagger}ms`, '--de': ease }}>
      <g className="stroke-[var(--border)]">{paths.map((d, i) => <path key={i} d={d} />)}</g>
      <g data-ink>{paths.map((d, i) => <path key={i} d={d} pathLength="1" className="di-ink" style={{ '--i': i, strokeDasharray: '1 1' }} />)}</g>
      {children}
    </svg>
  );
}

const ICONS = [
  { id: 'ring', label: 'Alerte retard', hint: 'Sonne', paths: ['M12 3.2v1.6', 'M6.2 16.5V11a5.8 5.8 0 0 1 11.6 0v5.5l1.6 2H4.6z', 'M10 20.6a2 2 0 0 0 4 0'], origin: '12px 3.5px',
    frames: [0, 16, -13, 9, -5, 2, 0].map((r) => ({ transform: `rotate(${r}deg)` })), opts: { duration: 760, easing: 'ease-out' }, say: 'Nouvelle alerte : le 08 h 12 part avec 5 minutes de retard.' },
  { id: 'check', label: 'Billet validé', hint: 'Valide', toggle: true, paths: ['M12 3a9 9 0 1 1 0 18a9 9 0 1 1 0-18z', 'M8 12.4l2.7 2.7L16.2 9.6'], origin: '12px 12px',
    frames: [{ transform: 'scale(.82)' }, { transform: 'scale(1)' }], opts: POP, say: 'Billet validé.' },
  { id: 'heart', label: 'Trajet favori', hint: 'Ajoute', toggle: true, paths: ['M12 20s-7.6-4.6-7.6-10.2A4.4 4.4 0 0 1 12 7.2a4.4 4.4 0 0 1 7.6 2.6C19.6 15.4 12 20 12 20z'], origin: '12px 13px',
    frames: [{ transform: 'scale(.7)' }, { transform: 'scale(1)' }], opts: POP, say: 'Trajet ajouté aux favoris.' },
  { id: 'seek', label: 'Rechercher', hint: 'Balaye', paths: ['M10.5 4a6.5 6.5 0 1 1 0 13a6.5 6.5 0 1 1 0-13z', 'M15.4 15.4L20 20'], origin: '12px 12px',
    frames: [{ transform: 'rotate(0)' }, { transform: 'translate(-2.4px,-1px) rotate(-10deg)' }, { transform: 'translate(2.4px,1px) rotate(8deg)' }, { transform: 'rotate(0)' }], opts: { duration: 720 }, say: 'Recherche de trajets.' },
  { id: 'send', label: 'Envoyer le billet', hint: 'S’envole', paths: ['M20.5 3.5L3.6 10.4l7 3.1 3 6.9z', 'M20.5 3.5l-9.9 10'], origin: '12px 12px',
    frames: [{ transform: 'none', opacity: 1 }, { transform: 'translate(14px,-14px)', opacity: 0, offset: 0.5 }, { transform: 'translate(-12px,12px)', opacity: 0, offset: 0.51 }, { transform: 'none', opacity: 1 }], opts: { duration: 900, easing: 'cubic-bezier(.5,0,.2,1)' }, say: 'Billet envoyé par e-mail.' },
  { id: 'drop', label: 'Télécharger', hint: 'Dépose', paths: ['M12 3.8v11', 'M7.6 10.6L12 15l4.4-4.4', 'M4.5 15.5V18a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2.5'], origin: '12px 12px',
    frames: [{ transform: 'translateY(-5px)' }, { transform: 'translateY(0)' }], opts: POP, say: 'Billet téléchargé.' },
  { id: 'lock', label: 'Place réservée', hint: 'Verrouillée', toggle: true, initial: true, paths: ['M8.5 10.5V7.6a3.5 3.5 0 0 1 7 0v2.9', 'M6.5 10.5h11a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19v-7a1.5 1.5 0 0 1 1.5-1.5z', 'M12 14.4v2.2'], origin: '12px 12px',
    frames: [{ transform: 'scale(.94)' }, { transform: 'scale(1)' }], opts: POP, say: 'Place verrouillée.' },
  { id: 'pin', label: 'Gare de départ', hint: 'Se pose', paths: ['M12 19.6s-6.2-5.3-6.2-10.4a6.2 6.2 0 0 1 12.4 0c0 5.1-6.2 10.4-6.2 10.4z', 'M12 6.8a2.4 2.4 0 1 1 0 4.8a2.4 2.4 0 1 1 0-4.8z'], origin: '12px 20px',
    frames: [{ transform: 'translateY(-9px)' }, { transform: 'translateY(0)' }], opts: POP, say: 'Gare de départ : Lyon Part-Dieu.' },
];

function Tile({ icon, trigger, states, drawAt, cfg, announce }) {
  const [key, setKey] = useState(0);
  const [on, setOn] = useState(!!icon.initial);
  const ref = useRef(null);
  const redraw = useCallback(() => setKey((k) => k + 1), []);
  const click = () => {
    redraw();
    if (!states) return;
    const next = icon.toggle ? !on : on;
    if (icon.toggle) setOn(next);
    const g = ref.current?.querySelector('[data-ink]')?.parentNode;
    if (g && !reduced() && g.animate) { g.style.transformOrigin = icon.origin; g.style.transformBox = 'view-box'; g.animate(icon.frames, { duration: 600, ...icon.opts }); }
    announce(icon.toggle && !next ? `${icon.label} : annulé.` : icon.say);
  };
  useEffect(() => { if (drawAt) redraw(); }, [drawAt, redraw]);
  return (
    <li ref={ref}>
      <button type="button" aria-pressed={icon.toggle ? on : undefined} onClick={click}
        onPointerEnter={(e) => trigger === 'hover' && e.pointerType !== 'touch' && redraw()} onFocus={() => trigger === 'hover' && redraw()}
        className={`grid min-h-[120px] w-full grid-rows-[1fr_auto_auto] justify-items-start gap-1 rounded-[12px] border border-[var(--border)] bg-[var(--raised)] p-4 text-left transition duration-200 hover:border-[var(--border-control)] hover:bg-[var(--surface)] active:scale-[.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] sm:min-h-[136px] ${on && icon.toggle && icon.id !== 'lock' ? 'text-[var(--accent)]' : 'text-[var(--text-strong)]'}`}>
        <DrawIcon paths={icon.paths} drawKey={key} {...cfg} className={icon.id === 'heart' && on ? '[&_[data-ink]_path]:fill-[var(--accent)]' : ''} />
        <span className="text-sm font-medium text-[var(--text-strong)]">{icon.label}</span>
        <span className="font-mono text-[11px] uppercase tracking-[0.04em] text-[var(--text-muted)]">{icon.id === 'lock' ? (on ? 'Verrouillée' : 'Libérée') : icon.hint}</span>
      </button>
    </li>
  );
}

/** Grille de démonstration. trigger : 'hover' | 'enter' | 'loop'. */
export function DrawIconsDemo({ duration = 700, stagger = 90, ease = 'cubic-bezier(.65,0,.35,1)', stroke = 1.5, trigger = 'hover', states = true }) {
  const root = useRef(null);
  const [tick, setTick] = useState({});
  const [msg, setMsg] = useState('');
  const cfg = useMemo(() => ({ duration, stagger, ease, stroke }), [duration, stagger, ease, stroke]);

  useEffect(() => {
    const el = root.current; if (!el || trigger === 'hover' || reduced()) return;
    let timer = 0, i = 0, done = false;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(timer);
      if (!e.isIntersecting) return;
      if (trigger === 'enter' && !done) { done = true; ICONS.forEach((_, j) => setTimeout(() => setTick((t) => ({ ...t, [j]: Date.now() })), j * 110)); }
      if (trigger === 'loop') timer = setInterval(() => { setTick((t) => ({ ...t, [i]: Date.now() })); i = (i + 1) % ICONS.length; }, 650);
    }, { threshold: 0.25 });
    io.observe(el);
    return () => { io.disconnect(); clearInterval(timer); };
  }, [trigger]);

  return (
    <section ref={root} className="mx-auto w-full max-w-[880px] rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 font-sans text-[var(--text)] sm:p-6">
      <style>{CSS}</style>
      <ul role="list" className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-4">
        {ICONS.map((icon, i) => (
          <Tile key={icon.id} icon={icon} trigger={trigger} states={states} announce={setMsg}
            drawAt={tick[i]} cfg={cfg} />
        ))}
      </ul>
      <p aria-live="polite" className="sr-only">{msg}</p>
    </section>
  );
}

export default DrawIconsDemo;
