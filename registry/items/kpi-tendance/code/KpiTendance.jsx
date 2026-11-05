// KpiTendance.jsx — cartes KPI : chiffre qui roule colonne par colonne, mini-courbe qui se redessine en morphing,
// écart signé avec flèche et texte (jamais la couleur seule), sens « une baisse est une bonne nouvelle » pris en charge.
// Survol ou doigt sur la courbe pour lire un point. États chargement et erreur. React 18, Tailwind 3.4, tokens.css chargé.
// Sans bibliothèque de graphique. Exemple : Comptoir (logiciel de caisse pour restaurants, marque fictive), données fictives.
// Utilisation :
//   <KpiTendance period="semaine" status="normal" curve="lissee" area duration={900} />
//   <KpiTendance kpis={[{ key: 'mrr', label: 'MRR', unit: '€', dec: 0, semaine: [12000, 11000, [/* série */]] }]} />
import { useEffect, useId, useMemo, useRef, useState } from 'react';

/* Série pseudo-aléatoire reproductible : tendance + cycle + bruit léger. */
function serie(n, base, amp, seed, trend) {
  let s = seed; const f = n === 12 ? (Math.PI * 2) / 6 : n === 30 ? (Math.PI * 2) / 7 : 1.3;
  return Array.from({ length: n }, (_, i) => { s = (s * 9301 + 49297) % 233280; return base * (1 + (trend * i) / n) + amp * (Math.sin(i * f + seed) * 0.7 + (s / 233280 - 0.5) * 0.5); });
}
/** @typedef {{ key: string, label: string, unit?: string, dec?: number, pt?: boolean, inverse?: boolean,
 *   jour: [number, number, number[]], semaine: [number, number, number[]], mois: [number, number, number[]] }} Kpi */
/** @type {Kpi[]} */
export const KPIS = [
  { key: 'ca', label: 'Chiffre d’affaires', unit: '€', dec: 0, jour: [4812, 4282, serie(12, 380, 220, 3, 0.2)], semaine: [31640, 28150, serie(7, 4400, 900, 5, 0.25)], mois: [128900, 121300, serie(30, 4200, 800, 7, 0.12)] },
  { key: 'couverts', label: 'Couverts servis', dec: 0, jour: [186, 171, serie(12, 15, 9, 11, 0.1)], semaine: [1214, 1144, serie(7, 170, 30, 13, 0.2)], mois: [4980, 4712, serie(30, 165, 28, 17, 0.1)] },
  { key: 'ticket', label: 'Ticket moyen', unit: '€', dec: 2, jour: [25.87, 25.04, serie(12, 25, 3, 19, 0.02)], semaine: [26.06, 26.54, serie(7, 26.4, 1.4, 23, -0.05)], mois: [25.88, 25.75, serie(30, 25.8, 1.2, 29, 0.01)] },
  { key: 'annul', label: 'Annulations de réservation', unit: '%', dec: 1, pt: true, inverse: true, jour: [3.2, 4.1, serie(12, 3.8, 1.4, 31, -0.3)], semaine: [4.1, 5.0, serie(7, 4.8, 1.1, 37, -0.25)], mois: [3.8, 4.7, serie(30, 4.4, 1.2, 41, -0.2)] },
];
const PERIODS = [['jour', 'Aujourd’hui'], ['semaine', '7 jours'], ['mois', '30 jours']];
const VS = { jour: 'vs jeudi dernier', semaine: 'vs les 7 jours précédents', mois: 'vs les 30 jours précédents' };
const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const labels = (p, n) => Array.from({ length: n }, (_, i) => {
  if (p === 'jour') return `${11 + i} h`;
  const d = new Date(2026, 10, 5); d.setDate(d.getDate() - (n - 1 - i));
  return `${p === 'semaine' ? `${JOURS[d.getDay()]} ` : ''}${d.getDate()} ${MOIS[d.getMonth()]}`;
});
const nf = (v, dec = 0) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v);
const useReduced = () => typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Chiffre roulant : une colonne 0-9 par chiffre, translateY sur une courbe à léger dépassement, décalée de droite à gauche. */
function Rolling({ text, duration }) {
  const chars = Array.from(text);
  let fromRight = 0;
  const delays = chars.map((c, i) => (/\d/.test(chars[chars.length - 1 - i]) ? fromRight++ : 0)).reverse();
  return (
    <span aria-hidden="true" className="inline-flex h-[1.1em] overflow-hidden">
      {chars.map((c, i) => (/\d/.test(c) ? (
        <span key={`${chars.length}-${i}`} className="relative inline-block h-[1.1em] w-[.62em] overflow-hidden">
          <span className="absolute inset-x-0 top-0 flex flex-col text-center motion-reduce:!transition-none"
            style={{ transform: `translateY(${-c * 1.1}em)`, transition: `transform ${duration}ms cubic-bezier(.25,1.25,.45,1) ${delays[i] * 40}ms` }}>
            {Array.from({ length: 10 }, (_, k) => <span key={k} className="h-[1.1em] leading-[1.1em]">{k}</span>)}
          </span>
        </span>
      ) : <span key={`${chars.length}-${i}`} className={`inline-block h-[1.1em] leading-[1.1em] ${/\s/.test(c) ? 'w-[.22em]' : ''}`}>{c}</span>))}
    </span>
  );
}

/* Rééchantillonnage sur N points (Catmull-Rom ou linéaire) : toutes les périodes ont le même nombre de points. */
function resample(vals, n, smooth) {
  const L = vals.length, at = (i) => vals[Math.max(0, Math.min(L - 1, i))];
  return Array.from({ length: n }, (_, i) => {
    const t = (i / (n - 1)) * (L - 1), a = Math.floor(t), u = t - a;
    if (!smooth) return at(a) + (at(a + 1) - at(a)) * u;
    const [p0, p1, p2, p3] = [at(a - 1), at(a), at(a + 1), at(a + 2)];
    return 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
  });
}
const N = 96;

function Sparkline({ values, labels: labs, format, smooth, area, duration }) {
  const line = useRef(null), fill = useRef(null), end = useRef(null), cur = useRef(null), box = useRef(null);
  const [hover, setHover] = useState(null);
  const reduce = useReduced();
  const ny = useMemo(() => { const lo = Math.min(...values), hi = Math.max(...values), r = hi - lo || 1; return values.map((v) => 1 - (v - lo) / r); }, [values]);
  const target = useMemo(() => resample(ny, N, smooth), [ny, smooth]);

  /* Morphing : interpolation point à point en rAF, uniquement pendant la transition. Écrit le chemin hors rendu React. */
  useEffect(() => {
    const from = cur.current || target, t0 = performance.now(), dur = reduce ? 0 : duration;
    let raf = 0;
    const frame = (now) => {
      const t = dur ? Math.min(1, (now - t0) / dur) : 1, e = 1 - (1 - t) ** 4;
      const pts = target.map((v, i) => [(i / (N - 1)) * 100, 6 + (from[i] + (v - from[i]) * e) * 70]);
      cur.current = pts.map((p) => (p[1] - 6) / 70);
      const d = `M${pts.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join('L')}`;
      line.current.setAttribute('d', d); fill.current.setAttribute('d', `${d}L100 88L0 88Z`);
      end.current.style.top = `${(pts[N - 1][1] / 88) * 100}%`;
      if (t < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduce]);

  const pick = (e) => {
    const r = box.current.getBoundingClientRect(), n = values.length;
    setHover(Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width) * (n - 1)))));
  };
  const hx = hover == null ? 0 : (hover / (values.length - 1)) * 100;
  const hy = hover == null ? 0 : ((6 + target[Math.round((hover / (values.length - 1)) * (N - 1))] * 70) / 88) * 100;

  return (
    <div ref={box} aria-hidden="true" onPointerMove={pick} onPointerDown={pick} onPointerLeave={() => setHover(null)}
      className="relative -mx-5 -mb-4 mt-4 h-[88px] cursor-crosshair touch-pan-y self-end max-sm:col-start-2 max-sm:row-span-3 max-sm:row-start-1 max-sm:m-0 max-sm:h-16 max-sm:self-center">
      <svg viewBox="0 0 100 88" preserveAspectRatio="none" className="block h-full w-full overflow-visible">
        <line x1="0" x2="100" y1="87.5" y2="87.5" stroke="var(--border)" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
        <path ref={fill} fill="var(--accent-subtle)" opacity={area ? 0.9 : 0} />
        <path ref={line} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {hover != null && <line x1={hx} x2={hx} y1="0" y2="88" stroke="var(--border-strong)" vectorEffect="non-scaling-stroke" />}
      </svg>
      <span ref={end} className="pointer-events-none absolute left-full -ml-1.5 -mt-[4.5px] h-[9px] w-[9px] rounded-full border-2 border-[var(--accent)] bg-[var(--surface)]" />
      {hover != null && <>
        <span className="pointer-events-none absolute -ml-[4.5px] -mt-[4.5px] h-[9px] w-[9px] rounded-full bg-[var(--accent)] shadow-[0_0_0_3px_var(--surface)]" style={{ left: `${hx}%`, top: `${hy}%` }} />
        <span className="pointer-events-none absolute z-[2] whitespace-nowrap rounded-lg bg-[var(--text-strong)] px-2.5 py-1.5 text-xs tabular-nums text-[var(--bg)]"
          style={{ left: `clamp(80px, ${hx}%, calc(100% - 80px))`, top: `calc(${hy}% - 10px)`, transform: 'translate(-50%, -100%)' }}>
          {labs[hover]} · <b className="font-semibold">{format(values[hover])}</b>
        </span>
      </>}
    </div>
  );
}

function Delta({ kpi, period }) {
  const [val, prev] = kpi[period];
  const diff = kpi.pt ? val - prev : ((val - prev) / prev) * 100;
  const dir = diff > 0.05 ? 'haut' : diff < -0.05 ? 'bas' : 'stable';
  const good = kpi.inverse ? diff < 0 : diff > 0;
  const tone = dir === 'stable' ? 'border-[var(--tint-neutral-border)] bg-[var(--tint-neutral-bg)] text-[var(--tint-neutral-fg)]'
    : good ? 'border-[var(--tint-green-border)] bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]'
      : 'border-[var(--tint-red-border)] bg-[var(--tint-red-bg)] text-[var(--tint-red-fg)]';
  return (
    <p aria-hidden="true" className="m-0 mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs max-sm:col-start-1">
      <span className={`inline-flex h-6 items-center gap-0.5 rounded-full border pl-1.5 pr-2 font-semibold tabular-nums ${tone}`}>
        <svg viewBox="0 0 16 16" className={`h-3.5 w-3.5 transition-transform duration-300 ${dir === 'bas' ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11 11 4M6 4h5v5" /></svg>
        {diff > 0 ? '+' : diff < 0 ? '−' : '±'}{nf(Math.abs(diff), 1)}{kpi.pt ? ' pt' : ' %'}
      </span>
      <span className="basis-full text-[var(--text-muted)]">{VS[period]}</span>
    </p>
  );
}

function srText(kpi, period) {
  const [val, prev] = kpi[period], diff = kpi.pt ? val - prev : ((val - prev) / prev) * 100;
  const dir = diff > 0.05 ? 'en hausse de ' : diff < -0.05 ? 'en baisse de ' : 'stable, ';
  const good = kpi.inverse ? diff < 0 : diff > 0;
  const unit = kpi.unit === '€' ? ' euros' : kpi.unit === '%' ? ' %' : '';
  return `${kpi.label} : ${nf(val, kpi.dec)}${unit}, ${dir}${nf(Math.abs(diff), 1)}${kpi.pt ? ' point' : ' %'} ${VS[period]}${Math.abs(diff) > 0.05 ? (good ? ' (bonne tendance)' : ' (à surveiller)') : ''}.`;
}

const card = 'relative grid min-h-[232px] grid-rows-[auto_auto_auto_1fr] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 pb-4 pt-5 max-sm:min-h-0 max-sm:grid-cols-[minmax(0,1fr)_112px] max-sm:grid-rows-[auto_auto_auto] max-sm:gap-x-3 max-sm:p-4';
const pulse = 'block rounded-lg bg-[var(--raised)] motion-safe:animate-pulse';

/**
 * @param {{ kpis?: Kpi[], period?: 'jour'|'semaine'|'mois', status?: 'normal'|'chargement'|'erreur', curve?: 'lissee'|'brute',
 *   area?: boolean, duration?: number, onRetry?: () => void, className?: string }} props
 */
export default function KpiTendance({
  kpis = KPIS,
  period = 'semaine',
  status = 'normal',
  curve = 'lissee',
  area = true,
  duration = 900,
  onRetry,
  className = '',
}) {
  const [p, setP] = useState(period);
  const [live, setLive] = useState('');
  const radios = useRef([]);
  const id = useId();
  useEffect(() => setP(period), [period]);

  const choose = (v, focus) => {
    setP(v);
    if (focus) radios.current[PERIODS.findIndex(([k]) => k === v)]?.focus();
    setLive(`Période : ${PERIODS.find(([k]) => k === v)[1]}. ${kpis.map((k) => `${k.label} ${nf(k[v][0], k.dec)}`).join(', ')}.`);
  };
  const onKey = (e, i) => {
    const d = ['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(e.key) ? -1 : 0;
    if (d) { e.preventDefault(); choose(PERIODS[(i + d + PERIODS.length) % PERIODS.length][0], true); }
  };
  const active = PERIODS.findIndex(([k]) => k === p);

  return (
    <section aria-labelledby={`${id}-t`} aria-busy={status === 'chargement'} className={`mx-auto w-full max-w-[1200px] p-4 font-sans text-[var(--text)] sm:p-8 ${className}`}>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 100 100" className="h-10 w-10 flex-none" aria-hidden="true">
            <rect width="100" height="100" rx="28" fill="var(--accent)" />
            <path d="M30 22h40v56l-6.67-5-6.67 5-6.66-5-6.67 5-6.66-5L30 78Z" fill="var(--accent-fg)" />
            <path d="M39 36h22M39 46h22M39 56h12" fill="none" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round" />
          </svg>
          <div>
            <h2 id={`${id}-t`} className="m-0 text-[length:var(--t-section)] font-semibold tracking-[-.01em] text-[var(--text-strong)]">Le Bistrot des Halles</h2>
            <p className="m-0 text-sm text-[var(--text-muted)]">Caisse et réservations · mis à jour à {'14\u00a0h\u00a032'}</p>
          </div>
        </div>
        {/* Segmenté : radiogroup, flèches du clavier, pastille glissante sur un ressort. */}
        <div role="radiogroup" aria-label="Période" className="relative grid auto-cols-fr grid-flow-col rounded-full border border-[var(--border)] bg-[var(--raised)] p-1">
          <span aria-hidden="true" className="absolute bottom-1 left-1 top-1 rounded-full bg-[var(--surface)] shadow-[var(--shadow-overlay)] transition-transform duration-[420ms] ease-[cubic-bezier(.3,1.3,.5,1)] motion-reduce:transition-none"
            style={{ width: `calc((100% - 8px) / ${PERIODS.length})`, transform: `translateX(${active * 100}%)` }} />
          {PERIODS.map(([k, label], i) => (
            <button key={k} ref={(el) => { radios.current[i] = el; }} type="button" role="radio" aria-checked={p === k} tabIndex={p === k ? 0 : -1}
              onClick={() => choose(k)} onKeyDown={(e) => onKey(e, i)}
              className={`relative z-[1] h-9 whitespace-nowrap rounded-full px-2 text-sm font-medium transition-colors sm:h-8 sm:px-4 ${p === k ? 'text-[var(--text-strong)]' : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'}`}>
              {label}
            </button>
          ))}
        </div>
      </header>

      <ul role="list" className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <li key={k.key} className={card}>
            {status === 'chargement' ? (
              <>
                <span className={`${pulse} h-4 w-[55%]`} /><span className={`${pulse} mt-3 h-8 w-[70%]`} />
                <span className={`${pulse} mt-3.5 h-5 w-[46%]`} /><span className={`${pulse} mt-4 h-14 self-end`} />
              </>
            ) : status === 'erreur' ? (
              <>
                <p className="m-0 text-sm text-[var(--text-muted)]">{k.label}</p>
                <div className="grid content-center justify-items-start gap-2 max-sm:col-span-2">
                  <strong className="text-sm font-semibold text-[var(--text-strong)]">Données indisponibles</strong>
                  <p className="m-0 text-sm text-[var(--text-muted)]">La caisse n’a pas répondu. Les ventes sont conservées et seront synchronisées.</p>
                  <button type="button" onClick={onRetry} className="mt-1 inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--border-control)] px-3.5 text-sm font-medium text-[var(--text-strong)] hover:bg-[var(--state-hover)]">Réessayer</button>
                </div>
              </>
            ) : (
              <>
                <p className="m-0 text-sm text-[var(--text-muted)] max-sm:col-start-1">{k.label}</p>
                <p className="m-0 mt-2 flex h-[1.1em] items-baseline whitespace-nowrap text-[28px] font-semibold leading-[1.1] tracking-[-.03em] tabular-nums text-[var(--text-strong)] max-sm:col-start-1 sm:text-[clamp(1.75rem,1.4rem+.9vw,2.25rem)]">
                  <span className="sr-only">{srText(k, p)}</span>
                  <Rolling text={nf(k[p][0], k.dec)} duration={duration} />
                  {k.unit && <span aria-hidden="true" className="ml-[.12em] text-[.55em] font-medium tracking-normal text-[var(--text-muted)]">{k.unit}</span>}
                </p>
                <Delta kpi={k} period={p} />
                <Sparkline values={k[p][2]} labels={labels(p, k[p][2].length)} smooth={curve !== 'brute'} area={area} duration={duration}
                  format={(v) => `${nf(v, k.dec)}${k.unit ? `\u202f${k.unit}` : ''}`} />
              </>
            )}
          </li>
        ))}
      </ul>
      <p role="status" aria-live="polite" className="sr-only">{live}</p>
    </section>
  );
}
