// Préchargeur en tuiles — React + Tailwind CSS. Aucune dépendance (Web Animations API).
// <TilePreloader columns={6} tasks={[fontsReady, heroImage]} onDone={…}>{(done) => <Page revealed={done} />}</TilePreloader>
// Des colonnes couvrent l'écran, un compteur roule de 000 à 100 au rythme des tâches, puis les colonnes s'ouvrent sur la page.
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * @typedef {Object} TilePreloaderProps
 * @property {number} [columns]                    3 à 12
 * @property {number} [duration]                   durée minimale du chargement, en ms
 * @property {'up'|'down'|'alternate'} [exit]
 * @property {'left'|'center'|'random'} [order]
 * @property {'large'|'small'|'none'} [counter]
 * @property {'accent'|'ink'|'relief'} [tone]
 * @property {Promise<unknown>[]} [tasks]          promesses réelles : la progression ne dépasse jamais leur avancée
 * @property {'container'|'page'} [scope]          page = plein écran en position fixe
 * @property {number} [replayKey]                  changez-la pour rejouer
 * @property {() => void} [onDone]
 * @property {(done: boolean) => React.ReactNode} children
 */

const STEPS = [[0, 'Chargement des tirages'], [0.34, 'Développement'], [0.72, 'Accrochage'], [1, 'Bienvenue']];
const SPRING = 'linear(0, 0.029, 0.09, 0.183, 0.291, 0.403, 0.502, 0.606, 0.701, 0.775, 0.846, 0.905, 0.947, 0.984, 1.011, 1.028, 1.041, 1.048, 1.051, 1.05, 1.047, 1.043, 1.038, 1.033, 1.027, 1.021, 1.017, 1.013, 1.009, 1.006, 1.003, 1)';
const TONES = {
  accent: ['var(--accent)', 'var(--accent)', 'var(--accent-fg)'],
  relief: ['var(--accent)', 'var(--cj-relief)', 'var(--accent-fg)'],
  ink: ['var(--text-strong)', 'var(--text-strong)', 'var(--bg)'],
};
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Progression simulée : rapide, une hésitation, puis la fin.
const curve = (k) => (k < 0.45 ? 0.62 * (1 - (1 - k / 0.45) ** 2) : k < 0.62 ? 0.62 + (0.06 * (k - 0.45)) / 0.17 : 0.68 + 0.32 * ((k - 0.62) / 0.38) ** 1.6);

function Digit({ value, lead, roll = true }) {
  return (
    <span className={`block h-[1em] overflow-hidden transition-opacity duration-300 ${lead ? 'opacity-30' : ''}`}>
      <span className="grid" style={{ transform: `translateY(${-value}em)`, transition: roll && !reduced() ? `transform 520ms ${SPRING}` : 'none' }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, i) => <span key={i} className="block h-[1em]">{d}</span>)}
      </span>
    </span>
  );
}

/** @param {TilePreloaderProps} props */
export function TilePreloader({ columns = 6, duration = 2600, exit = 'up', order = 'left', counter = 'large', tone = 'relief', tasks, scope = 'container', replayKey = 0, onDone, children }) {
  const [p, setP] = useState(0);
  const [phase, setPhase] = useState('loading'); // loading → leaving → done
  const tiles = useRef([]);
  const tasksRef = useRef(tasks); tasksRef.current = tasks;
  const leaving = useRef(false);
  const run = useRef(0);
  const n = Math.max(3, Math.min(12, columns));
  const [c1, c2, fg] = TONES[tone] || TONES.relief;

  const finish = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    const my = run.current;
    setP(1);
    if (reduced()) { setPhase('done'); onDone?.(); return; }
    const idx = [...Array(n).keys()];
    const rank = order === 'center' ? idx.map((i) => Math.floor(Math.abs(i - (n - 1) / 2)))
      : order === 'random' ? (() => { const r = [...idx].sort(() => Math.random() - 0.5); return idx.map((i) => r.indexOf(i)); })() : idx;
    setTimeout(() => {
      if (my !== run.current) return;
      setPhase('leaving');
      const anims = tiles.current.slice(0, n).map((t, i) => {
        const dir = exit === 'down' ? 1 : exit === 'alternate' ? (i % 2 ? 1 : -1) : -1;
        return t.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${dir * 101}%)` }], { duration: 820, delay: 260 + rank[i] * 70, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'forwards' });
      });
      Promise.all(anims.map((a) => a.finished)).then(() => { if (my === run.current) { setPhase('done'); onDone?.(); } }, () => {});
    }, 260);
  }, [n, order, exit, onDone]);

  const finishRef = useRef(finish); finishRef.current = finish;
  useEffect(() => {
    const my = ++run.current;
    leaving.current = false;
    const tasks = tasksRef.current;
    tiles.current.forEach((t) => t?.getAnimations().forEach((a) => a.cancel()));
    setPhase('loading'); setP(0);
    let real = tasks?.length ? 0 : 1, settled = 0, raf;
    tasks?.forEach((t) => Promise.resolve(t).finally(() => { settled += 1; real = settled / tasks.length; }));
    const t0 = performance.now(), dur = Math.max(800, duration);
    let best = 0;
    const tick = (t) => {
      if (my !== run.current) return;
      const v = Math.min(curve(Math.min(1, (t - t0) / dur)), real === 1 ? 1 : 0.98 * real + 0.02);
      best = Math.max(best, v); setP(best);
      if (best >= 1) { finishRef.current(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [replayKey, duration, n]); // eslint-disable-line react-hooks/exhaustive-deps

  const pct = Math.round(p * 100), s = String(pct).padStart(3, '0');
  const step = STEPS.reduce((acc, [at, l]) => (p >= at ? l : acc), STEPS[0][1]);
  const done = phase !== 'loading';

  return (
    <div className="relative isolate overflow-hidden [--cj-relief:color-mix(in_oklab,var(--accent)_90%,var(--text-strong))] dark:[--cj-relief:color-mix(in_oklab,var(--accent)_90%,var(--bg))]">
      <div aria-busy={phase !== 'done'}>{children(done)}</div>
      {phase !== 'done' && (
        <div className={`${scope === 'page' ? 'fixed' : 'absolute'} inset-0 z-[5]`} style={{ color: fg }}>
          <div aria-hidden="true" className="absolute inset-0 flex">
            {[...Array(n)].map((_, i) => (
              <div key={`${replayKey}-${i}`} ref={(el) => { tiles.current[i] = el; }} className="h-full flex-1 will-change-transform"
                style={{ background: i % 2 ? c2 : c1, boxShadow: i ? `inset 1px 0 0 color-mix(in oklab, ${fg} 10%, transparent)` : undefined }} />
            ))}
          </div>
          <div className={`absolute inset-0 grid grid-rows-[auto_1fr_auto] px-5 pb-5 pt-4 transition duration-500 md:px-10 md:py-7 ${phase === 'leaving' ? '-translate-y-6 opacity-0' : ''}`}>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="inline-flex items-center gap-2.5 text-[17px] font-semibold tracking-[-0.02em]"><ContrejourMark color={fg} />Contrejour</span>
              <span className="hidden font-[family-name:var(--font-mono)] text-[13px] opacity-85 md:inline">Toulouse · 12.06 → 28.06.2027</span>
            </div>
            <div role="progressbar" aria-label="Chargement" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.floor(pct / 10) * 10} className="grid place-self-center justify-items-center gap-3">
              {counter !== 'none' && (
                <div aria-hidden="true" className={`flex items-start font-semibold leading-none tracking-[-0.06em] tabular-nums ${counter === 'small' ? 'text-[clamp(48px,7vw,88px)]' : 'text-[clamp(104px,17vw,240px)]'}`}>
                  <Digit value={+s[0]} lead={pct < 100} /><Digit value={pct === 100 ? 10 : +s[1]} lead={pct < 10} /><Digit value={pct === 100 ? 10 : +s[2]} roll={false} />
                  <span className="ml-[.08em] mt-[.16em] text-[.22em] tracking-normal opacity-80">%</span>
                </div>
              )}
              {counter !== 'large' && <div className="h-0.5 w-[min(320px,60vw)] overflow-hidden rounded-full" style={{ background: `color-mix(in oklab, ${fg} 22%, transparent)` }}><i className="block h-full origin-left" style={{ background: fg, transform: `scaleX(${p})` }} /></div>}
              <div key={step} aria-hidden="true" className="min-h-[22px] font-[family-name:var(--font-mono)] text-sm uppercase tracking-[0.02em] opacity-90 motion-safe:animate-[cj-step_420ms_cubic-bezier(.16,1,.3,1)]">{step}</div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="font-[family-name:var(--font-mono)] text-xs opacity-85 md:text-[13px]">f/8 · 1/125 s · ISO 400</span>
              <button type="button" onClick={finish} className="min-h-11 rounded-full border px-4 text-sm font-medium hover:bg-[color:color-mix(in_oklab,currentColor_10%,transparent)]" style={{ borderColor: `color-mix(in oklab, ${fg} 35%, transparent)` }}>Passer</button>
            </div>
          </div>
        </div>
      )}
      <p aria-live="polite" className="sr-only">{phase === 'done' ? 'Page chargée' : 'Chargement du festival'}</p>
      <style>{'@keyframes cj-step{from{opacity:0;transform:translateY(8px)}}'}</style>
    </div>
  );
}

export function ContrejourMark({ color = 'var(--accent)', className = 'h-7 w-7' }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="64" cy="36" r="30" style={{ fill: color }} opacity=".55" /><rect y="24" width="76" height="76" rx="18" style={{ fill: color }} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Démo : « Contrejour », rencontres photographiques.                  */
/* ------------------------------------------------------------------ */

const ease = 'cubic-bezier(.16,1,.3,1)';
function Line({ i, show, children }) {
  return (
    <span className="-mb-[.06em] block overflow-hidden pb-[.06em]">
      <span className="block motion-reduce:!transform-none" style={{ transform: show ? 'none' : 'translateY(105%)', transition: `transform 900ms ${ease} ${i * 90 + 120}ms` }}>{children}</span>
    </span>
  );
}
function Fade({ i, show, className = '', as: Tag = 'div', children, ...rest }) {
  return <Tag className={`motion-reduce:!transform-none motion-reduce:!opacity-100 ${className}`} style={{ opacity: show ? 1 : 0, transform: show ? 'none' : 'translateY(12px)', transition: `opacity 700ms ${ease} ${i * 90 + 200}ms, transform 700ms ${ease} ${i * 90 + 200}ms` }} {...rest}>{children}</Tag>;
}

/** @param {Omit<TilePreloaderProps, 'children'>} props */
export default function ContrejourDemo(props) {
  const btn = 'inline-flex min-h-11 flex-auto items-center justify-center whitespace-nowrap rounded-full px-4 text-sm font-semibold md:flex-none md:px-[18px]';
  return (
    <div className="min-h-[720px] overflow-hidden rounded-xl bg-[var(--bg)] font-[family-name:var(--font-sans)] text-[color:var(--text)] [--cj-ink:var(--text-strong)] dark:[--cj-ink:var(--bg)] md:min-h-[640px] md:rounded-2xl">
      <TilePreloader {...props}>
        {(show) => (
          <div className="min-h-[720px] origin-top px-4 pb-6 pt-3 motion-reduce:!transform-none md:min-h-[640px] md:px-10 md:pb-10 md:pt-6" style={{ transform: show ? 'none' : 'scale(1.04)', transition: `transform 1100ms ${ease}` }}>
            <header className="flex h-14 items-center gap-6">
              <a href="#accueil" className="mr-auto inline-flex items-center gap-2.5 text-[17px] font-semibold tracking-[-0.02em] text-[color:var(--text-strong)]"><ContrejourMark />Contrejour</a>
              <nav aria-label="Festival" className="hidden gap-1 md:flex">{['Programme', 'Lieux', 'Infos pratiques'].map((l) => <a key={l} href="#" className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-[color:var(--text-muted)] hover:bg-[var(--state-hover)] hover:text-[color:var(--text-strong)]">{l}</a>)}</nav>
              <a href="#billets" className={`${btn} flex-none bg-[var(--accent)] text-[color:var(--accent-fg)] hover:bg-[var(--accent-hover)]`}>Billets</a>
            </header>
            <section aria-labelledby="cj-h1" className="grid items-center gap-7 pt-6 min-[900px]:grid-cols-[1.05fr_1fr] min-[900px]:gap-12 min-[900px]:pt-10">
              <div>
                <Fade i={0} show={show} as="p" className="mb-5 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.04em] text-[color:var(--text-muted)]">Rencontres photographiques · 9ᵉ édition</Fade>
                <h1 id="cj-h1" className="text-[clamp(44px,13.5vw,60px)] font-semibold leading-[.95] tracking-[-0.05em] text-[color:var(--text-strong)] md:text-[clamp(44px,6.6vw,92px)]"><Line i={0} show={show}>La lumière</Line><Line i={1} show={show}>par derrière.</Line></h1>
                <Fade i={2} show={show} as="p" className="mt-4 max-w-[40ch] text-base leading-relaxed md:mt-6 md:text-[17px]">41 expositions, 214 photographes et 16 lieux à Toulouse, du 12 au 28 juin 2027. Entrée libre dans la moitié des lieux.</Fade>
                <Fade i={3} show={show} className="mt-6 flex flex-wrap gap-3 md:mt-8">
                  <a href="#programme" className={`${btn} bg-[var(--accent)] text-[color:var(--accent-fg)] hover:bg-[var(--accent-hover)]`}>Voir le programme</a>
                  <a href="#billets" className={`${btn} border border-[color:var(--border)] bg-[var(--surface)] text-[color:var(--text-strong)] hover:bg-[var(--raised)]`}>Pass festival · 24&nbsp;€</a>
                </Fade>
              </div>
              <Fade i={1} show={show} as="figure" aria-label="Affiche 2027 : une silhouette à contre-jour devant un soleil bas" className="relative m-0 aspect-[4/3] overflow-hidden rounded-2xl bg-[var(--accent-subtle)] min-[900px]:aspect-[4/5]">
                <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className="absolute inset-0 h-full w-full motion-reduce:!transform-none" style={{ transform: show ? 'none' : 'scale(1.12)', transition: `transform 1600ms ${ease} 100ms` }}>
                  <circle cx="250" cy="210" r="120" style={{ fill: 'var(--accent)' }} />
                  <circle cx="250" cy="210" r="160" fill="none" style={{ stroke: 'var(--accent)' }} strokeWidth="2" opacity=".35" />
                  <circle cx="250" cy="210" r="205" fill="none" style={{ stroke: 'var(--accent)' }} strokeWidth="1.5" opacity=".2" />
                  <path d="M0 360q110-40 220-10t180-6v156H0Z" style={{ fill: 'color-mix(in oklab, var(--accent) 45%, var(--accent-subtle))' }} />
                  <path d="M140 500v-96q0-34 30-48l18-8q-20-16-20-44 0-38 34-38t34 38q0 28-20 44l18 8q30 14 30 48v96Z" style={{ fill: 'color-mix(in oklab, var(--accent) 30%, var(--cj-ink))' }} />
                  <circle cx="96" cy="120" r="14" style={{ fill: 'var(--accent)' }} opacity=".25" /><circle cx="60" cy="86" r="6" style={{ fill: 'var(--accent)' }} opacity=".3" />
                </svg>
                <figcaption className="absolute bottom-3 left-3 rounded-full bg-[var(--surface)] px-2.5 py-1.5 text-xs leading-none text-[color:var(--text-strong)]">© Inès Barrault · « Garonne, 6 h 12 »</figcaption>
              </Fade>
            </section>
          </div>
        )}
      </TilePreloader>
    </div>
  );
}
