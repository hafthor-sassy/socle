// GhostTrails.jsx — les grands titres laissent une rémanence proportionnelle à la vitesse de défilement.
// Des copies s'écartent derrière la lettre quand on fait défiler vite, puis reviennent s'y fondre sur un ressort.
// React 18, Tailwind 3.4, tokens.css chargé. Sans bibliothèque : un seul rAF, actif seulement pendant le mouvement,
// qui écrit deux variables CSS (--gt-v, --gt-m) sur la racine. Aucun rendu React par image.
// Exemple : Nocturne (festival de musiques électroniques, marque fictive). Programme fictif.
// Utilisation :
//   <GhostTrails copies={5} gap={1.4} intensity={0.7} fill="solid" skew={true} blur={false} stiffness={170} damping={16}>
//     <Ghost as="h2" className="text-8xl font-bold">Mélodie Noire</Ghost>
//   </GhostTrails>
import { createContext, useContext, useEffect, useRef } from 'react';

const Ctx = createContext({ copies: 5 });

/**
 * @param {{ copies?: number, gap?: number, intensity?: number, fill?: 'solid'|'outline'|'mono', skew?: boolean,
 *   blur?: boolean, stiffness?: number, damping?: number, scroller?: React.RefObject<HTMLElement>,
 *   className?: string, children: React.ReactNode }} props
 */
export function GhostTrails({ copies = 5, gap = 1.4, intensity = 0.7, fill = 'solid', skew = true, blur = false,
  stiffness = 170, damping = 16, scroller, className = '', children }) {
  const ref = useRef(null);
  const cfg = useRef({ stiffness, damping });
  cfg.current = { stiffness, damping };

  useEffect(() => {
    const root = ref.current;
    const el = scroller?.current || window;
    const getY = () => (el === window ? window.scrollY : el.scrollTop);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0, running = false, lastY = getY(), lastT = 0, target = 0, x = 0, vel = 0;
    const set = (v, m) => { root.style.setProperty('--gt-v', v); root.style.setProperty('--gt-m', m); };

    /* Vitesse de défilement (px/ms) → lissage → ressort amorti → --gt-v signé, --gt-m de 0 à 1. */
    const tick = (now) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000)), y = getY();
      const raw = (y - lastY) / dt / 1000;
      lastY = y; lastT = now;
      target += (raw - target) * Math.min(1, dt * 18);
      const { stiffness: k, damping: c } = cfg.current;
      vel += (-k * (x - target) - c * vel) * dt; x += vel * dt;
      const v = Math.max(-1.6, Math.min(1.6, x));
      set(v.toFixed(4), Math.min(1, Math.abs(v) / 0.9).toFixed(4));
      if (Math.abs(x) < 0.0015 && Math.abs(vel) < 0.002 && Math.abs(raw) < 0.001 && Math.abs(target) < 0.001) {
        running = false; x = vel = target = 0; set(0, 0); return;
      }
      raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (running || reduce.matches) return;
      running = true; lastY = getY(); lastT = performance.now(); raf = requestAnimationFrame(tick);
    };
    /* Hors écran : rien ne tourne (le défilement réveille la boucle, qui s'arrête dès que le ressort est posé). */
    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(root);
    const onScroll = () => visible && wake();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => { el.removeEventListener('scroll', onScroll); io.disconnect(); cancelAnimationFrame(raf); };
  }, [scroller]);

  const n = Math.max(1, Math.min(10, copies));
  return (
    <Ctx.Provider value={{ copies: n, fill, skew, blur }}>
      <div ref={ref} className={`relative w-full overflow-x-clip ${className}`}
        style={{ '--gt-v': 0, '--gt-m': 0, '--gt-n': n, '--gt-gap': gap * 0.06, '--gt-int': intensity }}>
        {children}
      </div>
    </Ctx.Provider>
  );
}

/** Un titre à rémanence. Le texte est lu une fois : les copies sont aria-hidden. */
export function Ghost({ as: Tag = 'h2', className = '', children }) {
  const { copies, fill, skew, blur } = useContext(Ctx);
  const ghostColor = fill === 'outline' ? 'text-transparent [-webkit-text-stroke:1.5px_var(--accent)]'
    : fill === 'mono' ? 'text-[var(--text-strong)]' : 'text-[var(--accent)]';
  return (
    <Tag className={`relative isolate origin-left will-change-transform motion-reduce:!transform-none ${className}`}
      style={skew ? { transform: 'skewY(calc(var(--gt-v) * -.9deg))' } : undefined}>
      {children}
      {Array.from({ length: copies }, (_, i) => i + 1).map((k) => (
        <span key={k} aria-hidden="true"
          className={`pointer-events-none absolute inset-0 -z-10 select-none will-change-transform motion-reduce:hidden ${ghostColor}`}
          style={{
            transform: `translate3d(0, calc(var(--gt-v) * ${k} * var(--gt-gap) * 1em), 0)`,
            opacity: `calc(var(--gt-m) * var(--gt-int) * (1 - ${k} / (var(--gt-n) + 1)))`,
            filter: blur ? `blur(calc(${k} * var(--gt-m) * 1.2px))` : undefined,
          }}>
          {children}
        </span>
      ))}
    </Tag>
  );
}

/* Exemple complet : la page du festival Nocturne. */
const PROGRAMME = [
  { jour: 'Jeudi 11 juin', info: 'Grand Plateau · ouverture 19 h', artistes: [['Mélodie Noire', '23 h 30 · Grand Plateau'], ['Kaito', '01 h 00 · Toit-terrasse'], ['La Fréquence', '02 h 30 · Grand Plateau']] },
  { jour: 'Vendredi 12 juin', info: 'Trois scènes · ouverture 18 h', artistes: [['Ostra', '22 h 00 · La Cartonnerie'], ['Solène Vaux', '00 h 15 · Grand Plateau'], ['Baptiste R.', '03 h 00 · Toit-terrasse']] },
  { jour: 'Samedi 13 juin', info: 'Nuit blanche · jusqu’à 7 h', artistes: [['Ultramarine', '23 h 00 · Grand Plateau'], ['Nadja K', '02 h 00 · La Cartonnerie'], ['Aube', '05 h 30 · Toit-terrasse']] },
];
const caps = 'font-mono text-xs font-medium uppercase tracking-[.04em]';
const big = 'm-0 font-bold uppercase leading-[.95] tracking-[-.05em] text-[var(--text-strong)]';

export default function NocturnePage(props) {
  return (
    <GhostTrails {...props} className="bg-[var(--bg)] font-sans text-[var(--text)]">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-8 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] px-4 backdrop-blur-md md:h-16 md:px-8">
        <a href="#" aria-label="Nocturne, accueil" className="inline-flex items-center gap-2.5 text-lg font-semibold tracking-[-.03em] text-[var(--text-strong)]">
          <svg viewBox="0 0 100 100" className="h-7 w-7" aria-hidden="true">
            <rect width="100" height="100" rx="28" fill="var(--accent)" />
            <path d="M60 22a28 28 0 1 0 18 46 23 23 0 0 1-18-46Z" fill="var(--accent-fg)" />
            <path d="M24 40h14M20 52h12M24 64h10" fill="none" stroke="var(--accent-fg)" strokeWidth="6" strokeLinecap="round" />
          </svg>
          nocturne
        </a>
        <nav aria-label="Festival" className="ml-auto hidden gap-6 text-sm text-[var(--text-muted)] md:flex">
          <a href="#prog" className="hover:text-[var(--text-strong)]">Programme</a><a href="#" className="hover:text-[var(--text-strong)]">Lieux</a><a href="#" className="hover:text-[var(--text-strong)]">Infos pratiques</a>
        </nav>
        <a href="#" className="ml-auto inline-flex h-11 items-center rounded-full bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-fg)] md:ml-0 md:h-9">Billetterie</a>
      </header>

      <section aria-label="Nocturne 27" className="grid min-h-[88svh] content-end px-4 pb-10 pt-16 md:min-h-[calc(100vh-64px)] md:content-center md:px-8 md:pb-12">
        <p className={`${caps} mb-6 text-[var(--text-muted)]`}>Festival de musiques électroniques · 11 — 14 juin 2027 · Marseille</p>
        <Ghost as="h1" className={`${big} !leading-[.86] text-[clamp(3.5rem,.5rem+15vw,13rem)] tracking-[-.055em]`}>Nocturne 27</Ghost>
        <p className="mt-8 max-w-[46ch] leading-relaxed text-[var(--text-muted)]">Quatre nuits, trois scènes, quarante-deux artistes, du coucher du soleil à l’aube sur les toits de la Friche.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a href="#" className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--accent)] px-6 font-medium text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]">Pass 4 nuits · 129 €</a>
          <a href="#prog" className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--border-control)] px-6 font-medium text-[var(--text-strong)]">Voir le programme</a>
        </div>
      </section>

      <section id="prog" aria-label="Programme" className="px-4 pb-16 pt-4 md:px-8 md:pb-24 md:pt-8">
        {PROGRAMME.map((d) => (
          <div key={d.jour} className="border-t border-[var(--border)] pb-4 pt-8 md:pb-6 md:pt-12">
            <p className="mb-6 flex flex-wrap justify-between gap-x-6 gap-y-2 text-sm">
              <b className={`${caps} font-semibold text-[var(--accent)]`}>{d.jour}</b><span className="text-[var(--text-muted)]">{d.info}</span>
            </p>
            <ul role="list" className="m-0 list-none p-0">
              {d.artistes.map(([nom, meta]) => (
                <li key={nom} className="flex flex-col items-start gap-1 py-2 md:flex-row md:items-baseline md:justify-between md:gap-6 md:py-1">
                  <Ghost as="h3" className={`${big} text-[clamp(2.75rem,.5rem+11vw,9rem)]`}>{nom}</Ghost>
                  <span className="flex-none font-mono text-xs text-[var(--text-muted)] md:text-right">{meta}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <footer className="grid justify-items-start gap-8 border-t border-[var(--border)] px-4 pb-32 pt-16 md:px-8 md:pb-40 md:pt-24">
        <Ghost as="p" className={`${big} !leading-[.9] text-[clamp(3rem,.5rem+13vw,11rem)] tracking-[-.055em]`}>À la nuit.</Ghost>
        <a href="#" className="inline-flex h-12 items-center rounded-full bg-[var(--accent)] px-6 font-medium text-[var(--accent-fg)]">Réserver mon pass</a>
      </footer>
    </GhostTrails>
  );
}
