// Rideaux — React + Tailwind CSS. Couleurs : variables de tokens.css. Web Animations API, aucune dépendance.
// <CurtainTransition activeKey={page} mode="store">{pages[page]}</CurtainTransition>
// Changez activeKey : le rideau couvre, la nouvelle page remplace l'ancienne à l'abri, puis le rideau s'ouvre.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * @typedef {'volet'|'store'|'iris'|'pixels'|'diagonale'} CurtainMode
 * @typedef {Object} CurtainProps
 * @property {string} activeKey                 clé de la page affichée
 * @property {React.ReactNode} children         contenu de la page active
 * @property {CurtainMode} [mode]
 * @property {'right'|'left'|'down'|'up'} [direction]
 * @property {number} [duration]               ms, fermeture + pause + ouverture
 * @property {number} [slats]                  lames (store) ou densité (pixels)
 * @property {'accent'|'encre'|'relief'|'duo'} [color]
 * @property {React.ReactNode} [label]         texte affiché sur le rideau fermé (false pour aucun)
 * @property {'click'|'center'} [origin]       point de départ de l'iris
 * @property {(key: string) => void} [onCover] rideau fermé, page échangée
 * @property {(key: string) => void} [onChange] transition terminée
 * @property {string} [className]
 */

const IN_OUT = 'cubic-bezier(.76, 0, .24, 1)';
const OUT = 'cubic-bezier(.16, 1, .3, 1)';
const TONES = {
  accent: { c: 'var(--accent)', c2: 'var(--accent-subtle)', fg: 'var(--accent-fg)' },
  encre: { c: 'var(--text-strong)', c2: 'var(--border-control)', fg: 'var(--surface)' },
  relief: { c: 'var(--raised)', c2: 'var(--border)', fg: 'var(--text-strong)' },
  duo: { c: 'var(--accent)', c2: 'var(--text-strong)', fg: 'var(--accent-fg)' },
};
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const done = (anims) => Promise.all(anims.map((a) => a.finished));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* Balayage oblique : points exprimés dans l'axe du mouvement, puis orientés */
function poly(pts, dir) {
  return `polygon(${pts.map(([u, v]) => {
    const [x, y] = dir === 'right' ? [u, v] : dir === 'left' ? [100 - u, v] : dir === 'down' ? [v, u] : [v, 100 - u];
    return `${x}% ${y}%`;
  }).join(', ')})`;
}

function buildPieces(layer, o, W, H) {
  layer.querySelectorAll('[data-piece], [data-cells]').forEach((n) => n.remove());
  const horiz = o.dir === 'right' || o.dir === 'left';
  const mk = (alt, css = '') => {
    const p = document.createElement('div');
    p.dataset.piece = '';
    p.style.cssText = `position:absolute;inset:0;background:${alt ? 'var(--ct-c2)' : 'var(--ct-c)'};will-change:transform,clip-path;${css}`;
    layer.prepend(p);
    return p;
  };
  if (o.mode === 'volet' || o.mode === 'diagonale') { const front = mk(false); const back = mk(true); return [back, front]; }
  if (o.mode === 'iris') return [mk(false)];
  if (o.mode === 'store') {
    return Array.from({ length: o.n }, (_, i) => {
      const a = `${((i / o.n) * 100).toFixed(3)}%`, s = `calc(${(100 / o.n).toFixed(3)}% + 1px)`;
      return mk(o.color === 'duo' && i % 2, horiz ? `inset:0 auto 0 ${a};width:${s}` : `inset:${a} 0 auto 0;height:${s}`);
    });
  }
  const cols = Math.min(32, o.n * 2), size = W / cols, rows = Math.ceil(H / size);
  const g = document.createElement('div');
  g.dataset.cells = '';
  g.style.cssText = `position:absolute;inset:0;display:grid;grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},${size}px)`;
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = document.createElement('i');
    i.style.cssText = `opacity:0;background:${o.color === 'duo' && (r * 31 + c * 17) % 7 < 2 ? 'var(--ct-c2)' : 'var(--ct-c)'}`;
    i.dataset.u = String(horiz ? c / (cols - 1) : r / (rows - 1));
    g.appendChild(i); cells.push(i);
  }
  layer.prepend(g);
  return cells;
}

function animate(o, P, T, ctx, phase) {
  const axis = o.dir === 'right' || o.dir === 'left' ? 'X' : 'Y', sgn = o.dir === 'right' || o.dir === 'down' ? 1 : -1;
  const cover = phase === 'cover', an = [];
  const two = (frames) => (cover ? P : [...P].reverse()).forEach((p, i) => an.push(p.animate(frames, { duration: T * (i ? 0.86 : 0.9), delay: i ? T * 0.14 : 0, easing: IN_OUT, fill: 'both' })));
  if (o.mode === 'volet') {
    two(cover ? [{ transform: `translate${axis}(${-sgn * 101}%)` }, { transform: `translate${axis}(0)` }] : [{ transform: `translate${axis}(0)` }, { transform: `translate${axis}(${sgn * 101}%)` }]);
  } else if (o.mode === 'diagonale') {
    two(cover
      ? [{ clipPath: poly([[-40, 0], [0, 0], [-40, 100], [-40, 100]], o.dir) }, { clipPath: poly([[-40, 0], [140, 0], [100, 100], [-40, 100]], o.dir) }]
      : [{ clipPath: poly([[0, 0], [140, 0], [140, 100], [-40, 100]], o.dir) }, { clipPath: poly([[140, 0], [140, 0], [140, 100], [100, 100]], o.dir) }]);
  } else if (o.mode === 'store') {
    const n = P.length, each = T * 0.62, st = (T - each) / Math.max(1, n - 1);
    P.forEach((p, i) => {
      const k = sgn > 0 ? i : n - 1 - i, start = cover === sgn > 0;
      p.style.transformOrigin = axis === 'X' ? `${start ? 'left' : 'right'} center` : `center ${start ? 'top' : 'bottom'}`;
      an.push(p.animate(cover ? [{ transform: `scale${axis}(0)` }, { transform: `scale${axis}(1)` }] : [{ transform: `scale${axis}(1)` }, { transform: `scale${axis}(0)` }], { duration: each, delay: k * st, easing: 'cubic-bezier(.65, 0, .35, 1)', fill: 'both' }));
    });
  } else if (o.mode === 'iris') {
    if (cover) an.push(P[0].animate([{ clipPath: `circle(0px at ${ctx.x}px ${ctx.y}px)` }, { clipPath: `circle(${ctx.R}px at ${ctx.x}px ${ctx.y}px)` }], { duration: T, easing: 'cubic-bezier(.7, 0, .3, 1)', fill: 'both' }));
    else {
      /* trou qui s'ouvre au même point : chemin evenodd recalculé à chaque image */
      const p = P[0];
      p.getAnimations().forEach((a) => { a.commitStyles?.(); a.cancel(); });
      const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      an.push({ finished: new Promise((res) => {
        let t0 = 0;
        const f = (t) => {
          if (ctx.dead()) return res();
          if (!t0) t0 = t;
          const k = clamp((t - t0) / T, 0, 1), r = Math.max(0.01, ease(k) * ctx.R), { x, y, W, H } = ctx;
          p.style.clipPath = `path(evenodd, "M0 0H${W}V${H}H0Z M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z")`;
          if (k < 1) ctx.raf = requestAnimationFrame(f); else res();
        };
        ctx.raf = requestAnimationFrame(f);
      }) });
    }
  } else {
    P.forEach((c) => {
      const u = sgn < 0 ? 1 - +c.dataset.u : +c.dataset.u;
      an.push(c.animate(cover ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }], { duration: 80, delay: (0.62 * u + 0.38 * Math.random()) * (T - 80), easing: 'linear', fill: 'both' }));
    });
  }
  return an;
}

/** @param {CurtainProps} props */
export function CurtainTransition({
  activeKey,
  children,
  mode = 'store',
  direction = 'right',
  duration = 1200,
  slats = 7,
  color = 'accent',
  label,
  origin = 'click',
  onCover,
  onChange,
  className = '',
}) {
  const rootRef = useRef(null), layerRef = useRef(null), labelRef = useRef(null), viewRef = useRef(null);
  const [shown, setShown] = useState({ key: activeKey, node: children });
  const [running, setRunning] = useState(false);
  const latest = useRef({ children, label });
  latest.current = { children, label };
  const busy = useRef(false), queued = useRef(null), point = useRef(null), dead = useRef(false), swapRes = useRef(null);
  const opts = useRef({});
  opts.current = { mode, dir: direction, dur: clamp(duration, 200, 4000), n: clamp(slats, 2, 24), color, origin, onCover, onChange };

  /* Même clé : le contenu se met à jour sans transition */
  useEffect(() => { if (!busy.current && activeKey === shown.key) setShown({ key: activeKey, node: children }); }, [children]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { dead.current = true; }, []);
  /* L'échange de page est rendu avant d'ouvrir le rideau */
  useLayoutEffect(() => { if (swapRes.current) { swapRes.current(); swapRes.current = null; } }, [shown]);

  useEffect(() => {
    if (activeKey === shown.key && !busy.current) return;
    if (busy.current) { queued.current = activeKey; return; }
    run(activeKey);
  }, [activeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(key) {
    const o = opts.current, root = rootRef.current, layer = layerRef.current, lab = labelRef.current;
    const swap = () => new Promise((res) => {
      swapRes.current = res;
      setShown({ key, node: latest.current.children });
      o.onCover?.(key);
    });
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !root) {
      await swap();
      viewRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160 });
      o.onChange?.(key);
      return;
    }
    busy.current = true;
    setRunning(true);
    const W = root.clientWidth, H = root.clientHeight, rb = root.getBoundingClientRect();
    const p = o.origin === 'click' && point.current ? point.current : { x: W / 2, y: H / 2 };
    const ctx = { x: Math.round(p.x), y: Math.round(p.y), W, H, R: Math.ceil(Math.hypot(Math.max(p.x, W - p.x), Math.max(p.y, H - p.y))) + 2, dead: () => dead.current, raf: 0 };
    const vt = Math.max(0, -rb.top), vb = Math.min(H, window.innerHeight - rb.top);
    lab.style.top = `${clamp((vt + vb) / 2, 80, Math.max(80, H - 80))}px`;
    const C = o.dur * 0.44, HOLD = o.dur * 0.12, R = o.dur * 0.44;
    const P = buildPieces(layer, o, W, H);
    const showLabel = latest.current.label !== false;
    const a1 = animate(o, P, C, ctx, 'cover');
    if (showLabel) a1.push(lab.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: C * 0.5, delay: C * 0.62, easing: OUT, fill: 'both' }));
    await done(a1);
    await swap();
    await wait(HOLD);
    const a2 = animate(o, P, R, ctx, 'reveal');
    if (showLabel) a2.push(lab.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-12px)' }], { duration: R * 0.3, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'both' }));
    await done(a2);
    if (dead.current) return;
    cancelAnimationFrame(ctx.raf);
    lab.getAnimations().forEach((a) => a.cancel());
    layer.querySelectorAll('[data-piece], [data-cells]').forEach((n) => n.remove());
    busy.current = false;
    setRunning(false);
    o.onChange?.(key);
    if (queued.current != null && queued.current !== key) { const q = queued.current; queued.current = null; run(q); } else queued.current = null;
  }

  const tone = TONES[color] || TONES.accent;
  const pill = color === 'duo' || mode === 'pixels';
  return (
    <div ref={rootRef} className={`relative isolate overflow-hidden [.dark_&]:[--ct-duo:var(--raised)] ${className}`}
      style={{ '--ct-c': tone.c, '--ct-c2': color === 'duo' ? 'var(--ct-duo, var(--text-strong))' : tone.c2 }}
      onPointerDownCapture={(e) => { const r = rootRef.current.getBoundingClientRect(); point.current = { x: e.clientX - r.left, y: e.clientY - r.top }; }}
      onKeyDownCapture={() => { point.current = null; }}>
      <div ref={viewRef}>{shown.node}</div>
      <div ref={layerRef} aria-hidden="true" className={`absolute inset-0 z-[5] overflow-hidden ${running ? 'block' : 'hidden'}`}>
        <p ref={labelRef} className={`absolute left-1/2 z-[2] m-0 grid -translate-x-1/2 -translate-y-1/2 justify-items-center gap-2 whitespace-nowrap text-center opacity-0 ${pill ? 'rounded-xl bg-[var(--surface)] px-7 py-4 text-[var(--text-strong)]' : ''}`} style={pill ? undefined : { color: tone.fg }}>
          <span className="text-[clamp(2rem,1.4rem+3vw,3.5rem)] font-semibold leading-none tracking-[-0.035em]">{label}</span>
        </p>
      </div>
    </div>
  );
}

/* ——— Exemple complet : un site de trois pages ——— */
const PAGES = [
  { key: 'studio', title: 'Studio' },
  { key: 'projets', title: 'Projets' },
  { key: 'contact', title: 'Contact' },
];

export function AtelierNordDemo(props) {
  const [page, setPage] = useState('studio');
  const i = PAGES.findIndex((p) => p.key === page);
  const go = (k) => (e) => { e.preventDefault(); setPage(k); };
  const btn = 'inline-flex h-12 items-center gap-2 rounded-full px-[22px] text-[15px] font-medium transition active:scale-[.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]';
  const content = {
    studio: (
      <section className="grid min-h-[600px] content-start gap-10 px-4 pb-8 pt-10 sm:px-8 lg:px-12 lg:pt-[72px]">
        <div className="grid items-end gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.04em] text-[var(--text-muted)]">Studio d’architecture · Lyon</p>
            <h2 className="mt-4 text-balance text-[clamp(2.25rem,1.6rem+3.2vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-[var(--text-strong)]">Des lieux qui respirent.</h2>
            <p className="mt-5 max-w-[46ch] text-[17px] leading-7 text-[var(--text-muted)]">Maisons, ateliers et lieux publics dessinés autour de la lumière, du bois et du temps long. Douze ans, quarante-huit projets livrés.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#projets" onClick={go('projets')} className={`${btn} bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]`}>Voir les projets →</a>
              <a href="#contact" onClick={go('contact')} className={`${btn} border border-[var(--border-control)] text-[var(--text-strong)] hover:bg-[var(--raised)]`}>Nous écrire</a>
            </div>
          </div>
          <svg viewBox="0 0 360 300" aria-hidden="true" className="w-full max-w-[420px] justify-self-end">
            <circle cx="276" cy="64" r="26" className="fill-[var(--accent)]" />
            <path d="M24 268V142a46 46 0 0 1 92 0v126z" className="fill-[var(--raised)]" />
            <path d="M132 268V96a58 58 0 0 1 116 0v172z" className="fill-[var(--accent-subtle)] stroke-[var(--accent-subtle-border)]" />
            <path d="M264 268V170a40 40 0 0 1 80 0v98z" className="fill-[var(--raised)]" />
            <path d="M8 268h344M190 268V150M172 268v-60h36v60" fill="none" strokeWidth="1.5" strokeLinecap="round" className="stroke-[var(--border-control)]" />
          </svg>
        </div>
      </section>
    ),
    projets: (
      <section className="grid min-h-[600px] content-start gap-10 px-4 pb-8 pt-10 sm:px-8 lg:px-12 lg:pt-[72px]">
        <h2 className="text-[clamp(1.75rem,1.4rem+1.6vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--text-strong)]">Projets choisis</h2>
        <ul className="m-0 grid list-none gap-6 p-0 sm:grid-cols-3">
          {[['Maison Albe', 'Annecy · 2025 · 186 m²'], ['Halle Brune', 'Lyon · 2024 · Marché couvert'], ['Atelier Sorgue', 'Avignon · 2023 · Réhabilitation']].map(([t, s]) => (
            <li key={t}><div className="aspect-[3/2] rounded-xl bg-[var(--raised)]" /><p className="mt-3 font-semibold text-[var(--text-strong)]">{t}</p><p className="text-sm text-[var(--text-muted)]">{s}</p></li>
          ))}
        </ul>
      </section>
    ),
    contact: (
      <section className="grid min-h-[600px] content-start gap-10 px-4 pb-8 pt-10 sm:px-8 lg:px-12 lg:pt-[72px]">
        <h2 className="text-[clamp(2.25rem,1.6rem+3.2vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-[var(--text-strong)]">Parlons de votre projet.</h2>
        <a href="mailto:bonjour@atelier-nord.fr" className="justify-self-start text-[clamp(1.25rem,1rem+1.6vw,2.25rem)] font-medium text-[var(--text-strong)] underline decoration-[var(--border-control)] decoration-1 underline-offset-[6px] hover:decoration-[var(--accent)]">bonjour@atelier-nord.fr</a>
      </section>
    ),
  };
  return (
    <CurtainTransition activeKey={page} label={PAGES[i].title} {...props}
      className="mx-auto w-full max-w-[1120px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] font-sans text-[var(--text)]">
      <header className="flex h-16 items-center gap-4 border-b border-[var(--border)] px-4 sm:px-8">
        <a href="#studio" onClick={go('studio')} className="inline-flex min-h-11 items-center gap-3 font-semibold text-[var(--text-strong)]"><span aria-hidden="true" className="h-5 w-5 rounded-[4px_12px_4px_4px] bg-[var(--accent)]" /><span className="max-[419px]:hidden">Atelier Nord</span></a>
        <nav aria-label="Navigation du site" className="ml-auto flex">
          {PAGES.map((p) => (
            <a key={p.key} href={`#${p.key}`} onClick={go(p.key)} aria-current={p.key === page ? 'page' : undefined}
              className={`relative inline-flex h-11 items-center px-3 text-sm font-medium sm:px-4 ${p.key === page ? 'text-[var(--text-strong)] after:absolute after:inset-x-3 after:bottom-1.5 after:h-0.5 after:rounded after:bg-[var(--accent)] sm:after:inset-x-4' : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'}`}>{p.title}</a>
          ))}
        </nav>
        <span aria-hidden="true" className="hidden font-mono text-xs tabular-nums tracking-[0.04em] text-[var(--text-muted)] sm:inline">{String(i + 1).padStart(2, '0')} / 03</span>
      </header>
      {content[page]}
      <p className="sr-only" aria-live="polite">Page {PAGES[i].title}</p>
    </CurtainTransition>
  );
}

export default CurtainTransition;
