// Squelette fidèle — React + Tailwind CSS. Aucune dépendance.
// <SkeletonScope state="loading"> … <Sk group={1}>12 480,52 €</Sk> … </SkeletonScope>
// Le squelette est la vraie mise en page : chaque <Sk> devient un bloc de chargement de sa taille exacte.
// Reflet synchronisé (une bande fixée à l'écran), arrivée en cascade, aucun décalage de mise en page.
import { useEffect, useRef, useState } from 'react';

/**
 * @typedef {'loading'|'ready'|'empty'|'error'} SkState
 * @typedef {Object} SkeletonScopeProps
 * @property {SkState} state
 * @property {'sweep'|'pulse'|'none'} [shimmer]
 * @property {number} [speed]                   durée d'un reflet, en secondes
 * @property {'cascade'|'together'} [arrival]
 * @property {string} [busyLabel]               annoncé aux lecteurs d'écran pendant le chargement
 * @property {string} [readyLabel]
 * @property {string} [className]
 * @property {React.ReactNode} children
 */

const CSS = `
.sk-scope [data-sk]{position:relative;transition:color 320ms cubic-bezier(.2,0,0,1) var(--sk-d,0ms)}
.sk-scope [data-sk]>*{transition:opacity 320ms cubic-bezier(.2,0,0,1) var(--sk-d,0ms)}
.sk-scope [data-sk]::after{content:"";position:absolute;inset:0;z-index:2;border-radius:6px;background:var(--sk-base);opacity:0;pointer-events:none;transition:opacity 320ms cubic-bezier(.2,0,0,1) var(--sk-d,0ms)}
.sk-scope [data-sk=box]::after,.sk-scope [data-sk=round]::after{border-radius:inherit}
.sk-scope:is([data-state=loading],[data-state=error]) [data-sk]{color:transparent;transition-delay:0ms}
.sk-scope:is([data-state=loading],[data-state=error]) [data-sk]>*{opacity:0;transition-delay:0ms}
.sk-scope:is([data-state=loading],[data-state=error]) [data-sk]::after{opacity:1;transition-delay:0ms}
.sk-scope[data-state=loading][data-shimmer=sweep] [data-sk]::after{background:linear-gradient(100deg,transparent 0%,var(--sk-hi) 50%,transparent 100%) -40vw 0/40vw 100% no-repeat fixed,var(--sk-base);animation:sk-sweep var(--sk-speed,1.6s) cubic-bezier(.4,0,.2,1) infinite}
.sk-scope[data-state=loading][data-shimmer=pulse] [data-sk]::after{animation:sk-pulse var(--sk-speed,1.6s) ease-in-out infinite}
@keyframes sk-sweep{to{background-position:100vw 0,0 0}}@keyframes sk-pulse{50%{opacity:.5}}
@media (prefers-reduced-motion:reduce){.sk-scope [data-sk],.sk-scope [data-sk]::after,.sk-scope [data-sk]>*{transition:none!important;animation:none!important}}`;

/** @param {SkeletonScopeProps} props */
export function SkeletonScope({ state, shimmer = 'sweep', speed = 1.6, arrival = 'cascade', busyLabel = 'Chargement…', readyLabel = 'Contenu chargé', className = '', children }) {
  useEffect(() => {
    if (document.getElementById('sk-css')) return;
    const s = document.createElement('style'); s.id = 'sk-css'; s.textContent = CSS; document.head.appendChild(s);
  }, []);
  const hidden = state === 'loading' || state === 'error';
  return (
    <div data-state={state} data-shimmer={shimmer} data-arrival={arrival} aria-busy={state === 'loading'}
      className={`sk-scope [--sk-base:var(--raised)] [--sk-hi:color-mix(in_oklab,var(--border)_70%,var(--surface))] dark:[--sk-hi:color-mix(in_oklab,var(--border)_90%,var(--text-muted)_10%)] ${className}`}
      style={{ '--sk-speed': `${speed}s`, '--sk-step': arrival === 'cascade' ? '70ms' : '0ms' }}>
      <p role="status" className="sr-only">{state === 'loading' ? busyLabel : state === 'error' ? '' : readyLabel}</p>
      <div aria-hidden={hidden || undefined}>{children}</div>
    </div>
  );
}

/**
 * Élément qui devient un bloc de squelette.
 * @param {{ as?: any, group?: number, shape?: 'text'|'box'|'round', className?: string, style?: object, children?: React.ReactNode }} props
 */
export function Sk({ as: Tag = 'span', group = 0, shape = 'text', className = '', style, children, ...rest }) {
  return (
    <Tag data-sk={shape === 'text' ? '' : shape} className={className} style={{ '--sk-d': `calc(${group} * var(--sk-step, 70ms))`, ...style }} {...rest}>{children}</Tag>
  );
}

/* ------------------------------------------------------------------ */
/* Démo : tableau de bord « Pécule », banque en ligne.                 */
/* ------------------------------------------------------------------ */

const TX = [
  ['M4 7h16l-1.5 9.5a2 2 0 0 1-2 1.5h-9a2 2 0 0 1-2-1.5zM9 7V5.5a3 3 0 0 1 6 0V7', 'Biocoop Saint-Cyprien', 'Courses · aujourd’hui', '−42,80 €'],
  ['M3 12h18M12 3v18', 'Virement de Julien M.', 'Remboursement · hier', '+35,00 €', true],
  ['M5 18V8l7-4 7 4v10M9 18v-5h6v5', 'Loyer novembre', 'Logement · 1er nov.', '−780,00 €'],
  ['M5 17h14M7 17V9h10v8M9 9V6h6v3', 'SNCF Connect', 'Transport · 31 oct.', '−64,00 €'],
  ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9 10h.01M15 10h.01M9 15c1.5 1.2 4.5 1.2 6 0', 'Cinéma ABC', 'Loisirs · 30 oct.', '−19,50 €'],
];
const BARS = [38, 22, 64, 30, 46, 18, 72, 40, 28, 54, 34, 86];
const DAYS = ['1', '3', '6', '8', '10', '13', '15', '17', '20', '22', '24', '26'];
const SPRING = 'linear(0, 0.029, 0.09, 0.183, 0.291, 0.403, 0.502, 0.606, 0.701, 0.775, 0.846, 0.905, 0.947, 0.984, 1.011, 1.028, 1.041, 1.048, 1.051, 1.05, 1.047, 1.043, 1.038, 1.033, 1.027, 1.021, 1.017, 1.013, 1.009, 1.006, 1.003, 1)';
const fmt = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function useCountUp(to, run) {
  const [v, setV] = useState(to);
  useEffect(() => {
    if (!run || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(to); return undefined; }
    let raf, t0;
    const f = (t) => { t0 ??= t; const k = Math.min(1, (t - t0) / 900); setV(to * (1 - Math.pow(1 - k, 4))); if (k < 1) raf = requestAnimationFrame(f); };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, [to, run]);
  return v;
}

const card = 'relative min-w-0 rounded-xl border border-[color:var(--border)] bg-[var(--surface)] px-4 py-5 md:rounded-2xl md:p-6';
const label = 'm-0 inline-block text-sm font-medium text-[color:var(--text-muted)]';

/**
 * @param {{ state?: 'auto'|SkState, delay?: number, shimmer?: 'sweep'|'pulse'|'none', speed?: number, arrival?: 'cascade'|'together' }} props
 */
export default function PeculeDashboard({ state = 'auto', delay = 1800, shimmer = 'sweep', speed = 1.6, arrival = 'cascade' }) {
  const [s, setS] = useState(state === 'auto' ? 'loading' : state);
  const prev = useRef(s);
  const load = (ms = delay) => { setS('loading'); const t = setTimeout(() => setS('ready'), ms); return () => clearTimeout(t); };
  useEffect(() => (state === 'auto' ? load() : setS(state)), [state, delay]);
  useEffect(() => { prev.current = s; }, [s]);
  const loading = s === 'loading' || s === 'error', empty = s === 'empty';
  const balance = useCountUp(empty ? 0 : 12480.52, s === 'ready' && prev.current !== 'ready');

  return (
    <div className="mx-auto max-w-[1120px] font-[family-name:var(--font-sans)] text-[color:var(--text)]">
      <header className="mb-4 flex items-center gap-3 md:mb-6">
        <span className="mr-auto inline-flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em] text-[color:var(--text-strong)]">
          <svg viewBox="0 0 100 100" className="h-7 w-7" aria-hidden="true"><circle cx="50" cy="56" r="44" style={{ fill: 'var(--accent)' }} /><rect x="30" y="40" width="40" height="9" rx="4.5" style={{ fill: 'var(--accent-fg)' }} /><circle cx="50" cy="17" r="15" style={{ fill: 'var(--accent)' }} opacity=".55" /></svg>Pécule
        </span>
        <span className="grid text-right text-sm text-[color:var(--text-muted)]"><span className="hidden md:inline">Jeudi 5 novembre</span><b className="font-medium text-[color:var(--text-strong)]">Bonjour Claire</b></span>
        <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-full bg-[var(--accent-subtle)] text-sm font-semibold text-[color:var(--accent)]">CM</span>
      </header>

      {s === 'error' && (
        <div role="alert" className="mb-4 flex items-center gap-3 rounded-xl border border-[color:var(--tint-red-border)] bg-[var(--tint-red-bg)] py-3 pl-4 pr-3 text-sm text-[color:var(--tint-red-fg)]">
          <p className="m-0 mr-auto">Impossible de joindre votre banque. Vos derniers chiffres datent d’il y a 2 h.</p>
          <button type="button" onClick={() => load(1200)} className="min-h-11 rounded-full border border-[color:var(--tint-red-border)] bg-[var(--surface)] px-4 text-sm font-medium text-[color:var(--text-strong)]">Réessayer</button>
        </div>
      )}

      <SkeletonScope state={s} shimmer={shimmer} speed={speed} arrival={arrival} busyLabel="Chargement de vos comptes…" readyLabel="Comptes à jour">
        <div className="grid grid-cols-1 gap-3 md:gap-4 min-[900px]:grid-cols-3">
          <section aria-label="Solde total" className={`${card} min-[900px]:col-span-2`}>
            <h2 className={label}>Solde total</h2>
            <div><Sk as="p" group={1} className="mt-2 inline-block text-[clamp(36px,4.4vw,52px)] font-semibold leading-[1.1] tracking-[-0.04em] tabular-nums text-[color:var(--text-strong)]">{fmt.format(balance).replace(/\u202f/g, '\u00a0')} <small className="text-[.5em] font-medium tracking-[-0.02em] text-[color:var(--text-muted)]">€</small></Sk></div>
            {!empty && <Sk shape="round" group={1} className="mt-3 inline-flex rounded-full bg-[var(--tint-green-bg)] px-2.5 py-1 text-[13px] font-medium tabular-nums text-[color:var(--tint-green-fg)]">+3,2 % depuis octobre</Sk>}
            <dl className="mb-0 mt-6 grid grid-cols-2 gap-x-3 gap-y-4 border-t border-[color:var(--border)] pt-5 md:grid-cols-3 md:gap-4">
              {[['Compte courant', '2 140,18 €'], ['Livret Pécule', '8 930,34 €'], ['Objectif « Japon »', '1 410,00 €']].map(([k, v], i) => (
                <div key={k} className={`grid min-w-0 gap-1 ${i === 2 ? 'col-span-2 md:col-span-1' : ''}`}><Sk as="dt" group={2} className="w-fit text-sm text-[color:var(--text-muted)]">{k}</Sk><Sk as="dd" group={2} className="m-0 w-fit font-medium tabular-nums text-[color:var(--text-strong)]">{empty ? '0,00 €' : v}</Sk></div>
              ))}
            </dl>
          </section>

          <section aria-label="Carte" className={card}>
            <div className="flex items-baseline justify-between"><h2 className={label}>Carte</h2><a href="#carte" className="-m-3 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-[color:var(--text-strong)] hover:bg-[var(--state-hover)]">Gérer</a></div>
            <Sk as="div" shape="box" group={1} className="relative mt-4 grid aspect-[2.2] content-between overflow-hidden rounded-xl bg-[var(--accent)] p-4 text-[color:var(--accent-fg)] min-[900px]:aspect-[1.586]">
              <span className="text-[13px] opacity-85">Pécule Visa</span>
              <b className="font-[family-name:var(--font-mono)] text-[15px] font-medium tracking-[.08em]">•••• 4821</b>
            </Sk>
            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between gap-2 text-[color:var(--text-muted)]"><Sk group={3}>Plafond mensuel</Sk><Sk as="b" group={3} className="font-medium tabular-nums text-[color:var(--text-strong)]">{empty ? '0 €' : '612 €'} / 2 000 €</Sk></div>
              <Sk as="div" shape="round" group={3} className="h-2 overflow-hidden rounded-full bg-[var(--raised)]"><i className="block h-full rounded-full bg-[var(--accent)] transition-[width] duration-[900ms]" style={{ width: loading || empty ? '0%' : '30.6%' }} /></Sk>
            </div>
          </section>

          <section aria-label="Dépenses de novembre" className={`${card} flex flex-col min-[900px]:col-span-2`}>
            <div className="flex items-baseline justify-between gap-3"><h2 className={label}>Dépenses de novembre</h2><Sk group={3} className="text-[22px] font-semibold tracking-[-0.02em] tabular-nums text-[color:var(--text-strong)]">{empty ? '0 €' : '1 286 €'}</Sk></div>
            <div role="img" aria-label="Dépenses par jour en novembre, 1 286 € au total, pic le 26 novembre" className="relative mt-5 flex min-h-[148px] flex-1 items-end gap-[5px] pb-7 before:absolute before:inset-x-0 before:bottom-7 before:border-t before:border-[color:var(--border)] md:min-h-[168px] md:gap-2">
              {BARS.map((h, i) => (
                <Sk key={i} as="div" shape="box" group={4} className={`relative min-h-1 flex-1 rounded-[6px_6px_2px_2px] ${i === BARS.length - 1 ? 'bg-[var(--accent)]' : 'bg-[color:color-mix(in_oklab,var(--accent)_22%,var(--raised))]'}`}
                  style={{ height: empty ? '4px' : loading ? `${(26 + 22 * Math.sin(i * 0.9 + 1)).toFixed(0)}%` : `${h}%`, transition: `height 720ms ${SPRING}` }}>
                  <span className={`absolute -bottom-[26px] left-1/2 -translate-x-1/2 text-[11px] tabular-nums text-[color:var(--text-muted)] md:text-xs ${i % 2 === 0 && i !== BARS.length - 1 ? 'invisible md:visible' : ''}`}>{DAYS[i]}</span>
                </Sk>
              ))}
            </div>
          </section>

          <section aria-label="Dernières opérations" className={card}>
            <div className="flex items-baseline justify-between"><h2 className={label}>Dernières opérations</h2><a href="#operations" className="-m-3 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-medium text-[color:var(--text-strong)] hover:bg-[var(--state-hover)]">Tout voir</a></div>
            {empty ? (
              <div className="grid justify-items-center gap-2 px-2 pb-4 pt-8 text-center text-sm text-[color:var(--text-muted)]">
                <b className="text-[15px] font-medium text-[color:var(--text-strong)]">Aucune opération ce mois-ci</b>
                <span>Vos paiements apparaîtront ici en temps réel.</span>
                <a href="#alimenter" className="mt-2 inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-4 text-sm font-semibold text-[color:var(--accent-fg)]">Alimenter mon compte</a>
              </div>
            ) : (
              <ul className="m-0 mt-3 list-none p-0">
                {TX.map(([d, name, meta, amt, inc], i) => (
                  <li key={name} className="grid min-h-[60px] grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[color:var(--border)] last:border-b-0">
                    <Sk shape="box" group={5 + i} className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--raised)] text-[color:var(--text-strong)]"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg></Sk>
                    <p className="m-0 grid min-w-0 gap-0.5"><Sk as="b" group={5 + i} className="w-fit max-w-full truncate text-[15px] font-medium text-[color:var(--text-strong)]">{name}</Sk><Sk group={5 + i} className="w-fit max-w-full truncate text-[13px] text-[color:var(--text-muted)]">{meta}</Sk></p>
                    <Sk group={5 + i} className={`text-[15px] font-medium tabular-nums ${inc ? 'text-[color:var(--up)]' : 'text-[color:var(--text-strong)]'}`}>{amt}</Sk>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </SkeletonScope>
    </div>
  );
}
