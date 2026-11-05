// BadgeStatut.jsx — badge de statut vivant : forme + onde + libellé, jamais la couleur seule.
// React 18, Tailwind 3.4, tokens.css chargé. Aucune dépendance d'animation (keyframes CSS injectées une fois).
// Exemple : page d'état de Fanal (hébergement cloud, marque fictive).
// Utilisation :
//   <BadgeStatut state="ok" label="" variant="teinte" size="md" pulse={true} speed={1} />
//   <PageEtat state="ok" variant="teinte" size="md" pulse={true} speed={1} />   (exemple complet, export par défaut)
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export const STATES = {
  ok: { label: 'Opérationnel', tone: 'green', glyph: <circle cx="8" cy="8" r="4.5" />, wave: 2.4 },
  'en-cours': { label: 'En cours', tone: 'blue', glyph: <><circle cx="8" cy="8" r="2.5" /><path data-arc d="M8 2.5a5.5 5.5 0 1 1-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></> },
  degrade: { label: 'Performances dégradées', tone: 'amber', glyph: <><path d="M8 2.75a5.25 5.25 0 1 0 0 10.5 5.25 5.25 0 0 0 0-10.5z" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M8 2.75v10.5a5.25 5.25 0 0 1 0-10.5z" /></>, wave: 1.6 },
  incident: { label: 'Incident en cours', tone: 'red', glyph: <path d="M8 2.2l5.8 5.8L8 13.8 2.2 8z" />, wave: 1.1, double: true },
  maintenance: { label: 'Maintenance', tone: 'violet', glyph: <><rect x="3.75" y="3" width="3" height="10" rx="1.2" /><rect x="9.25" y="3" width="3" height="10" rx="1.2" /></>, breathe: true },
  'hors-ligne': { label: 'Hors ligne', tone: 'neutral', glyph: <circle cx="8" cy="8" r="4.25" fill="none" stroke="currentColor" strokeWidth="2" /> },
};
const SIZES = { sm: 'h-6 gap-[5px] pl-1.5 pr-2 text-xs [--ind:12px]', md: 'h-8 gap-1.5 pl-2 pr-2.5 text-sm sm:h-7 sm:text-[13px] [--ind:14px]', lg: 'h-9 gap-2 pl-3 pr-3.5 text-[15px] [--ind:16px]', xl: 'h-10 gap-2.5 pl-3.5 pr-4 text-[15px] [--ind:16px]' };
/* Classes écrites en entier : Tailwind ne détecte pas les noms construits à la volée. */
const TONE = {
  green: { fg: 'text-[var(--tint-green-fg)]', bg: 'bg-[var(--tint-green-bg)]', ring: 'shadow-[inset_0_0_0_1px_var(--tint-green-border)]' },
  blue: { fg: 'text-[var(--tint-blue-fg)]', bg: 'bg-[var(--tint-blue-bg)]', ring: 'shadow-[inset_0_0_0_1px_var(--tint-blue-border)]' },
  amber: { fg: 'text-[var(--tint-amber-fg)]', bg: 'bg-[var(--tint-amber-bg)]', ring: 'shadow-[inset_0_0_0_1px_var(--tint-amber-border)]' },
  red: { fg: 'text-[var(--tint-red-fg)]', bg: 'bg-[var(--tint-red-bg)]', ring: 'shadow-[inset_0_0_0_1px_var(--tint-red-border)]' },
  violet: { fg: 'text-[var(--tint-violet-fg)]', bg: 'bg-[var(--tint-violet-bg)]', ring: 'shadow-[inset_0_0_0_1px_var(--tint-violet-border)]' },
  neutral: { fg: 'text-[var(--tint-neutral-fg)]', bg: 'bg-[var(--tint-neutral-bg)]', ring: 'shadow-[inset_0_0_0_1px_var(--tint-neutral-border)]' },
};
const CSS = `
@keyframes stb-wave{0%{transform:scale(.9);opacity:.55}80%,100%{transform:scale(2.7);opacity:0}}
@keyframes stb-spin{to{transform:rotate(1turn)}}
@keyframes stb-breathe{50%{opacity:.45}}
@keyframes stb-pop{from{transform:scale(.4);opacity:0}}
@keyframes stb-out{to{transform:translateY(calc(-100% - 6px));opacity:.2}}
@keyframes stb-in{from{transform:translateY(calc(100% + 6px));opacity:.2}}
.stb-paused *{animation-play-state:paused!important}
@media (prefers-reduced-motion:reduce){[data-stb] *{animation:none!important}[data-stb] [data-out]{display:none}}`;
let injected = false;
const useKeyframes = () => useEffect(() => {
  if (injected || typeof document === 'undefined') return;
  injected = true; const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s);
}, []);

/**
 * @param {{ state?: keyof typeof STATES, label?: string, variant?: 'teinte'|'contour'|'discret',
 *   size?: 'sm'|'md'|'lg'|'xl', pulse?: boolean, speed?: number, className?: string }} props
 */
export function BadgeStatut({ state = 'ok', label, variant = 'teinte', size = 'md', pulse = true, speed = 1, className = '' }) {
  useKeyframes();
  const s = STATES[state] || STATES.ok, text = label || s.label, t = s.tone;
  const ref = useRef(null), lastW = useRef(0);
  const [labels, setLabels] = useState([{ text, key: 0 }]);
  const [shapeKey, setShapeKey] = useState(0);
  const prevState = useRef(state);

  useEffect(() => {
    if (labels[labels.length - 1].text === text) return undefined;
    setLabels((l) => [{ ...l[l.length - 1], out: true }, { text, key: l[l.length - 1].key + 1, in: true }]);
    const id = setTimeout(() => setLabels((l) => l.filter((x) => !x.out)), 480);
    return () => clearTimeout(id);
  }, [text]);
  useEffect(() => { if (prevState.current !== state) { prevState.current = state; setShapeKey((k) => k + 1); } }, [state]);
  /* Largeur : de l'ancienne mesure à la nouvelle, puis retour à auto. */
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return undefined;
    el.style.width = ''; const w1 = el.getBoundingClientRect().width, w0 = lastW.current; lastW.current = w1;
    if (!w0 || Math.abs(w0 - w1) < 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    el.style.width = `${w0}px`; void el.offsetWidth; el.style.width = `${w1}px`;
    const id = setTimeout(() => { if (el) el.style.width = ''; }, 460);
    return () => clearTimeout(id);
  }, [text, size]);

  const look = variant === 'contour' ? `bg-[var(--surface)] ${TONE[t].ring}` : variant === 'discret' ? 'bg-transparent !px-0' : TONE[t].bg;
  const labelColor = variant === 'teinte' ? '' : variant === 'contour' ? 'text-[var(--text-strong)]' : 'text-[var(--text)]';
  const dur = (x) => `${x / speed}s`;
  const wave = { animation: `stb-wave ${dur(s.wave || 2)} cubic-bezier(.2,.6,.35,1) infinite` };

  return (
    <span ref={ref} data-stb className={`relative inline-flex items-center whitespace-nowrap rounded-full align-middle font-medium leading-none ${TONE[t].fg} transition-[width,background-color,color,box-shadow] duration-[420ms] ease-[cubic-bezier(.2,.9,.25,1)] ${SIZES[size]} ${look} ${className}`}>
      <span aria-hidden="true" className="relative grid h-[var(--ind)] w-[var(--ind)] flex-none place-items-center">
        {pulse && s.wave && <span className="absolute inset-[22%] rounded-full bg-current opacity-0" style={wave} />}
        {pulse && s.double && <span className="absolute inset-[22%] rounded-full bg-current opacity-0" style={{ ...wave, animationDelay: dur(0.36) }} />}
        <svg key={shapeKey} viewBox="0 0 16 16" className="relative h-full w-full overflow-visible fill-current" style={{ animation: shapeKey ? 'stb-pop 520ms cubic-bezier(.34,1.56,.64,1)' : undefined }}>
          <g style={pulse && s.breathe ? { animation: `stb-breathe ${dur(2.8)} ease-in-out infinite` } : undefined}>
            {state === 'en-cours' && pulse
              ? <><circle cx="8" cy="8" r="2.5" /><path d="M8 2.5a5.5 5.5 0 1 1-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ transformOrigin: '8px 8px', animation: `stb-spin ${dur(1)} linear infinite` }} /></>
              : s.glyph}
          </g>
        </svg>
      </span>
      <span className="relative -my-1.5 inline-grid overflow-hidden py-1.5">
        {labels.map((l) => (
          <span key={l.key} data-out={l.out ? '' : undefined} aria-hidden={l.out || undefined} className={`[grid-area:1/1] block leading-[1.2] ${labelColor}`}
            style={{ animation: l.out ? 'stb-out 460ms cubic-bezier(.65,0,.35,1) forwards' : l.in ? 'stb-in 460ms cubic-bezier(.65,0,.35,1) both' : undefined }}>{l.text}</span>
        ))}
      </span>
    </span>
  );
}

/* ——— Exemple : page d'état ——— */
const SERVICES = [
  { nom: 'API publique', zone: 'eu-west-3 · Paris', state: 'ok', uptime: 99.99, seed: 3 },
  { nom: 'Déploiements', zone: 'Builds et préversions', state: 'en-cours', label: 'Mise à jour en cours', uptime: 99.95, seed: 7 },
  { nom: 'Bases de données', zone: 'Postgres managé', state: 'degrade', uptime: 99.71, seed: 11 },
  { nom: 'CDN', zone: '42 points de présence', state: 'ok', uptime: 100, seed: 5 },
  { nom: 'Webhooks', zone: 'Livraison des évènements', state: 'maintenance', label: 'Maintenance 22 h – 23 h', uptime: 99.9, seed: 2 },
];
function bars(up, seed, n) {
  const out = []; let s = seed;
  for (let i = 0; i < 90; i++) {
    s = (s * 9301 + 49297) % 233280; const r = s / 233280;
    const v = up >= 100 ? 'up' : r > 0.985 - (100 - up) * 0.5 ? (r > 0.996 ? 'down' : 'warn') : 'up';
    if (i >= 90 - n) out.push(v);
  }
  return out;
}
const BAR = { up: 'bg-[color-mix(in_srgb,var(--up)_62%,var(--surface))]', warn: 'bg-[var(--warn)]', down: 'bg-[var(--down)]' };

/** @param {{ state?: keyof typeof STATES, label?: string, variant?: 'teinte'|'contour'|'discret', size?: 'sm'|'md'|'lg', pulse?: boolean, speed?: number }} props */
export default function PageEtat({ state = 'ok', label = 'Tous les systèmes fonctionnent', variant = 'teinte', size = 'md', pulse = true, speed = 1 }) {
  const ref = useRef(null);
  const [paused, setPaused] = useState(false);
  const [days, setDays] = useState(90);
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => setPaused(!e.isIntersecting));
    const ro = new ResizeObserver(() => setDays(el.clientWidth < 520 ? 30 : el.clientWidth < 760 ? 60 : 90));
    io.observe(el); ro.observe(el);
    return () => { io.disconnect(); ro.disconnect(); };
  }, []);
  const common = { variant, pulse, speed };
  return (
    <section ref={ref} aria-labelledby="stp-title" className={`mx-auto grid w-full max-w-[880px] gap-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 font-sans text-[var(--text)] sm:gap-8 sm:p-8 ${paused ? 'stb-paused' : ''}`}>
      <header className="flex items-center justify-between gap-4">
        <span className="inline-flex items-center gap-2 text-base font-semibold tracking-[-0.01em] text-[var(--text-strong)]">
          <svg viewBox="0 0 100 100" className="h-7 w-7" aria-hidden="true"><rect width="100" height="100" rx="28" fill="var(--accent)" /><circle cx="34" cy="50" r="10" fill="var(--accent-fg)" /><path d="M54 30a28 28 0 0 1 0 40M66 20a42 42 0 0 1 0 60" fill="none" stroke="var(--accent-fg)" strokeWidth="7" strokeLinecap="round" /></svg>
          Fanal
        </span>
        <a href="#alertes" className="inline-flex min-h-11 items-center px-1 text-sm font-medium text-[var(--accent)] underline decoration-[color-mix(in_srgb,var(--accent)_40%,transparent)] underline-offset-4 hover:decoration-current">S’abonner aux alertes</a>
      </header>
      <div className="grid justify-items-start gap-3">
        <h2 id="stp-title" className="m-0 text-[clamp(1.625rem,1.4rem+1vw,2rem)] font-semibold leading-tight tracking-[-0.02em] text-[var(--text-strong)]">État des services</h2>
        <div aria-live="polite" aria-atomic="true"><BadgeStatut state={state} label={label} size={size === 'sm' ? 'lg' : 'xl'} {...common} /></div>
        <p className="m-0 text-sm text-[var(--text-muted)]">Mis à jour il y a 1&nbsp;min · données sur {days} jours</p>
      </div>
      <ul role="list" className="m-0 list-none border-t border-[var(--border)] p-0">
        {SERVICES.map((sv) => (
          <li key={sv.nom} className="grid grid-cols-[minmax(0,1fr)_56px] items-center gap-x-3 gap-y-3 border-b border-[var(--border)] py-4 sm:grid-cols-[minmax(0,1fr)_64px] sm:gap-x-4 sm:py-5">
            <div className="col-span-2 flex min-w-0 items-start justify-between gap-4 sm:items-center">
              <span className="min-w-0 text-[15px] font-medium leading-[22px] text-[var(--text-strong)] sm:text-base">{sv.nom}<span className="block text-sm font-normal leading-5 text-[var(--text-muted)]">{sv.zone}</span></span>
              <BadgeStatut state={sv.state} label={sv.label} size={size} {...common} className="mt-0.5 sm:mt-0" />
            </div>
            <span aria-hidden="true" className="grid h-6 auto-cols-fr grid-flow-col gap-0.5 sm:gap-[3px]">
              {bars(sv.uptime, sv.seed, days).map((v, i) => <i key={i} className={`block rounded-sm ${BAR[v]}`} />)}
            </span>
            <span className="justify-self-end font-mono text-[13px] tabular-nums text-[var(--text-muted)]">{sv.uptime >= 100 ? '100' : sv.uptime.toFixed(2).replace('.', ',')}&nbsp;%</span>
          </li>
        ))}
      </ul>
      <div className="grid gap-3">
        <p className="m-0 font-mono text-xs uppercase tracking-[0.04em] text-[var(--text-muted)]">Tous les états</p>
        <div className="flex flex-wrap gap-x-3 gap-y-2">{Object.keys(STATES).map((k) => <BadgeStatut key={k} state={k} size={size} {...common} />)}</div>
      </div>
    </section>
  );
}
