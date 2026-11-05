// Simulateur de daltonisme — React + Tailwind CSS. Couleurs : variables de tokens.css.
// Filtre SVG feColorMatrix (Machado 2009, RVB linéaire), volet de comparaison à ressort,
// paires à risque mesurées sur les variables réellement rendues. Passez votre interface en children.
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';

const M = {
  normale: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  protanopie: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deuteranopie: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881],
  tritanopie: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039],
  achromatopsie: [0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722],
};
const VISIONS = [
  ['normale', 'Normale', 'Référence'],
  ['protanopie', 'Protanopie', 'Rouge · 1 % des hommes'],
  ['deuteranopie', 'Deutéranopie', 'Vert · 6 % des hommes'],
  ['tritanopie', 'Tritanopie', 'Bleu · 0,01 %'],
  ['achromatopsie', 'Achromatopsie', 'Aucune couleur'],
];
const ANOMALIES = { protanopie: 'Protanomalie', deuteranopie: 'Deutéranomalie', tritanopie: 'Tritanomalie', achromatopsie: 'Vision des couleurs réduite' };
export const DEFAULT_PAIRS = [
  ['--up', '--down', 'Hausse / baisse', 'Statuts et deltas'],
  ['--accent', '--down', 'Accent / erreur', 'Bouton et message d’erreur'],
  ['--warn', '--down', 'Alerte / erreur', 'Niveaux de gravité'],
  ['--accent', '--chart-3', 'Série 2026 / 2025', 'Courbe comparée'],
  ['--chart-3', '--chart-6', 'Zone 2 / zone 3', 'Barre empilée'],
  ['--chart-6', '--chart-2', 'Zone 3 / zone 4', 'Barre empilée'],
  ['--chart-2', '--down', 'Zone 4 / zone 5', 'Barre empilée'],
  ['--chart-1', '--chart-4', 'Série 1 / série 4', 'Palette de graphiques'],
];

const mix = (v, s) => v.map((x, i) => M.normale[i] + (x - M.normale[i]) * s);
let ctx;
function rgb(c) {
  if (!ctx) { const cv = document.createElement('canvas'); cv.width = cv.height = 1; ctx = cv.getContext('2d', { willReadFrequently: true }); }
  ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0] / 255, d[1] / 255, d[2] / 255];
}
const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
function oklab([r, g, b]) {
  const L = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * L + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * L - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * L + 0.7827717662 * m - 0.808675766 * s];
}
const sim = (l, m) => [0, 1, 2].map((r) => Math.min(1, Math.max(0, m[r * 3] * l[0] + m[r * 3 + 1] * l[1] + m[r * 3 + 2] * l[2])));
const dE = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) * 100;
const fr = (n) => n.toFixed(1).replace('.', ',');

/**
 * @param {{ vision?: 'normale'|'protanopie'|'deuteranopie'|'tritanopie'|'achromatopsie', severite?: number,
 *   mode?: 'comparer'|'simuler', position?: number, seuil?: number, risques?: boolean,
 *   pairs?: [string, string, string, string][], children?: React.ReactNode }} props
 */
export function ColorBlindSimulator({ vision: v0 = 'deuteranopie', severite: s0 = 100, mode = 'comparer', position = 50, seuil = 7, risques = true, pairs = DEFAULT_PAIRS, children }) {
  const [vision, setVision] = useState(v0);
  const [severite, setSeverite] = useState(s0);
  const [rows, setRows] = useState([]);
  const [drag, setDrag] = useState(false);
  const fid = 'cvd' + useId().replace(/:/g, '');
  const stage = useRef(null), src = useRef(null), split = useRef(null);
  const anim = useRef({ target: position, cur: position, vel: 0, raf: 0 });
  useEffect(() => setVision(v0), [v0]);
  useEffect(() => setSeverite(s0), [s0]);

  const m = useMemo(() => mix(M[vision] || M.normale, severite / 100), [vision, severite]);
  const values = [m[0], m[1], m[2], 0, 0, m[3], m[4], m[5], 0, 0, m[6], m[7], m[8], 0, 0, 0, 0, 0, 1, 0].map((x) => +x.toFixed(6)).join(' ');

  /* Volet : ressort léger écrit directement dans une variable CSS (aucun rendu React par image). */
  const place = (x) => {
    stage.current && stage.current.style.setProperty('--cvd-x', `${x}%`);
    if (split.current) { split.current.setAttribute('aria-valuenow', Math.round(x)); split.current.setAttribute('aria-valuetext', `${Math.round(x)} % en vision normale`); }
  };
  const go = useCallback((x, instant) => {
    const a = anim.current; a.target = Math.max(0, Math.min(100, x));
    if (instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { a.cur = a.target; a.vel = 0; place(a.cur); return; }
    const tick = () => {
      a.vel = a.vel * 0.55 + (a.target - a.cur) * 0.22; a.cur += a.vel;
      if (Math.abs(a.target - a.cur) < 0.05 && Math.abs(a.vel) < 0.05) { a.cur = a.target; place(a.cur); a.raf = 0; return; }
      place(a.cur); a.raf = requestAnimationFrame(tick);
    };
    if (!a.raf) a.raf = requestAnimationFrame(tick);
  }, []);
  useLayoutEffect(() => { go(position, true); }, [position, go]);
  useEffect(() => () => cancelAnimationFrame(anim.current.raf), []);
  const fromEvent = (e) => { const r = stage.current.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 100; };

  /* Paires à risque, recalculées si la vision, le thème ou la palette changent. */
  useLayoutEffect(() => {
    if (!risques) return;
    const measure = () => {
      const cs = getComputedStyle(src.current);
      setRows(pairs.map(([va, vb, label, hint]) => {
        const a = cs.getPropertyValue(va).trim(), b = cs.getPropertyValue(vb).trim();
        if (!a || !b) return null;
        const la = rgb(a).map(lin), lb = rgb(b).map(lin);
        const before = dE(oklab(la), oklab(lb)), after = dE(oklab(sim(la, m)), oklab(sim(lb, m)));
        return { a, b, label, hint, before, after, bad: vision !== 'normale' && after < seuil };
      }).filter(Boolean));
    };
    measure();
    const mo = new MutationObserver(measure);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-accent', 'style'] });
    return () => mo.disconnect();
  }, [m, vision, seuil, risques, pairs]);

  const onKeyVision = (e) => {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return;
    e.preventDefault();
    const i = VISIONS.findIndex(([id]) => id === vision), n = VISIONS[(i + d + VISIONS.length) % VISIONS.length][0];
    setVision(n); e.currentTarget.querySelector(`[data-v="${n}"]`).focus();
  };
  const onKeySplit = (e) => {
    const step = e.shiftKey ? 10 : 2, a = anim.current.target;
    const next = { ArrowLeft: a - step, ArrowDown: a - step, ArrowRight: a + step, ArrowUp: a + step, Home: 0, End: 100 }[e.key];
    if (next == null) return; e.preventDefault(); go(next);
  };

  const comparing = mode === 'comparer' && vision !== 'normale';
  const bad = rows.filter((r) => r.bad).length;
  const nom = VISIONS.find(([id]) => id === vision)[1];
  const hint = vision === 'normale' ? 'Choisissez une vision à simuler' : severite >= 100 ? (vision === 'achromatopsie' ? 'Monochromatie complète' : 'Dichromatie complète') : severite === 0 ? 'Aucun effet' : `${ANOMALIES[vision]} à ${severite} %`;
  const content = children || <PulsaDashboard />;
  const caps = 'font-mono text-xs uppercase tracking-[0.04em] text-[var(--text-muted)]';

  return (
    <section aria-label="Simulateur de daltonisme" className="@container mx-auto grid w-full max-w-[1200px] gap-4 font-sans text-[var(--text)]">
      <svg width="0" height="0" aria-hidden focusable="false" className="absolute">
        <filter id={fid} colorInterpolationFilters="linearRGB"><feColorMatrix type="matrix" values={values} /></filter>
      </svg>

      <header className="grid gap-4 @[1000px]:grid-cols-[1fr_260px] @[1000px]:items-center">
        <div role="radiogroup" aria-label="Type de vision" onKeyDown={onKeyVision}
          className="grid grid-cols-6 gap-1 rounded-2xl border border-[var(--border)] bg-[var(--raised)] p-1 @[760px]:grid-cols-5">
          {VISIONS.map(([id, label, sub], i) => (
            <button key={id} type="button" role="radio" data-v={id} aria-checked={vision === id} tabIndex={vision === id ? 0 : -1} onClick={() => setVision(id)}
              className={`${i < 3 ? 'col-span-2' : 'col-span-3'} grid min-h-11 min-w-0 cursor-pointer justify-items-center gap-0.5 rounded-xl px-2.5 py-2 text-center text-[var(--text-muted)] transition hover:bg-[var(--state-hover)] aria-checked:bg-[var(--surface)] aria-checked:shadow-[var(--shadow-overlay),0_0_0_1px_var(--border)] @[760px]:col-span-1 @[760px]:min-h-[52px] @[760px]:justify-items-start @[760px]:px-3.5 @[760px]:text-left`}>
              <b className={`text-sm font-medium ${vision === id ? 'text-[var(--text-strong)]' : 'text-[var(--text)]'}`}>{label}</b>
              <small className="hidden max-w-full truncate text-xs @[760px]:block">{sub}</small>
            </button>
          ))}
        </div>
        <label className={`grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1 ${vision === 'normale' ? 'pointer-events-none opacity-45' : ''}`}>
          <span className={caps}>Sévérité <output className="ml-1 text-[var(--text-strong)]">{severite} %</output></span>
          <input type="range" min="0" max="100" step="5" value={severite} onChange={(e) => setSeverite(+e.target.value)} className="h-11 w-full cursor-pointer accent-[var(--accent)]" />
          <span className="col-span-2 text-[13px] text-[var(--text-muted)]">{hint}</span>
        </label>
      </header>

      <div className="grid gap-4 @[1000px]:grid-cols-[1fr_340px] @[1000px]:items-start">
        <div ref={stage} style={{ '--cvd-x': `${position}%` }} onClick={(e) => comparing && e.target === stage.current && go(fromEvent(e))}
          className="relative isolate min-w-0 touch-pan-y select-none overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)]">
          <div ref={src} className={`p-3 @[520px]:p-4 @[640px]:p-6 ${comparing ? '!pt-[52px]' : ''}`}>{content}</div>
          {vision !== 'normale' && (
            <div aria-hidden inert="" className={`pointer-events-none absolute inset-0 bg-[var(--bg)] p-3 @[520px]:p-4 @[640px]:p-6 ${comparing ? '!pt-[52px]' : ''}`}
              style={{ filter: `url(#${fid})`, clipPath: comparing ? 'inset(0 0 0 var(--cvd-x))' : 'none' }}>{content}</div>
          )}
          {comparing && (
            <div ref={split} role="slider" tabIndex={0} aria-label="Position du volet de comparaison" aria-valuemin={0} aria-valuemax={100} aria-valuenow={position}
              onKeyDown={onKeySplit}
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDrag(true); go(fromEvent(e)); }}
              onPointerMove={(e) => drag && go(fromEvent(e))} onPointerUp={() => setDrag(false)} onPointerCancel={() => setDrag(false)}
              className="group absolute inset-y-0 left-[var(--cvd-x)] z-[2] -ml-[22px] w-11 cursor-ew-resize touch-none outline-none before:absolute before:inset-y-0 before:left-[21px] before:w-0.5 before:bg-[var(--text-strong)]">
              <span className="pointer-events-none absolute right-[30px] top-3 whitespace-nowrap rounded-full bg-[var(--text-strong)] px-2.5 py-1 text-xs font-medium text-[var(--bg)]">Vision normale</span>
              <span className="pointer-events-none absolute left-[30px] top-3 whitespace-nowrap rounded-full bg-[var(--text-strong)] px-2.5 py-1 text-xs font-medium text-[var(--bg)]">{nom}</span>
              <span aria-hidden className={`absolute left-1/2 top-1/2 -ml-[22px] -mt-[22px] grid size-11 place-items-center rounded-full bg-[var(--text-strong)] text-[var(--bg)] shadow-[var(--shadow-popover)] transition-transform duration-[360ms] [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] group-hover:scale-110 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-[3px] group-focus-visible:outline-[var(--focus-ring)] ${drag ? 'scale-110' : ''}`}>
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 7l-5 5 5 5M15 7l5 5-5 5" /></svg>
              </span>
            </div>
          )}
        </div>

        {risques && (
          <aside aria-live="polite" className="grid content-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <header className="flex items-baseline justify-between gap-2">
              <p className={`m-0 ${caps}`}>Paires à risque</p>
              <p className="m-0 text-sm text-[var(--text-muted)]"><b className="text-[22px] font-semibold tabular-nums text-[var(--text-strong)]">{bad}</b> {bad > 1 ? 'paires qui se confondent' : 'paire qui se confond'}</p>
            </header>
            <ul className="m-0 grid list-none gap-1 p-0">
              {rows.map((r) => (
                <li key={r.label} className={`grid min-h-12 grid-cols-[40px_1fr_auto] items-center gap-3 rounded-xl px-2 py-1.5 text-sm ${r.bad ? 'bg-[var(--tint-red-bg)]' : ''}`}>
                  <span aria-hidden className="flex h-6 w-10 overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_var(--border)]" style={{ filter: `url(#${fid})` }}>
                    <i className="flex-1" style={{ background: r.a }} /><i className="flex-1" style={{ background: r.b }} />
                  </span>
                  <span><b className="block font-medium text-[var(--text-strong)]">{r.label}</b><small className="text-xs text-[var(--text-muted)]">{r.hint}</small></span>
                  <span className={`whitespace-nowrap text-right font-mono text-[13px] font-medium tabular-nums ${r.bad ? 'text-[var(--tint-red-fg)]' : 'text-[var(--text-muted)]'}`}>
                    {fr(r.before)} → {fr(r.after)}
                    <em className={`block text-[11px] not-italic uppercase tracking-[0.04em] ${r.bad ? '' : 'text-[var(--up)]'}`}>{vision === 'normale' ? 'Référence' : r.bad ? 'Se confondent' : 'Distinctes'}</em>
                  </span>
                </li>
              ))}
            </ul>
            <p className="m-0 text-[13px] leading-5 text-[var(--text-muted)]">ΔE OKLab × 100 entre les deux couleurs, avant → après simulation. Sous le seuil, ajoutez une étiquette, un motif ou une icône.</p>
          </aside>
        )}
      </div>
    </section>
  );
}

/* Interface d'exemple (marque fictive Pulsa, suivi d'entraînement). Remplacez-la par la vôtre via children. */
export function PulsaDashboard() {
  const card = 'grid min-w-0 content-start gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5';
  const k = 'm-0 text-[13px] leading-[18px] text-[var(--text-muted)]';
  const v = 'm-0 text-[22px] font-semibold leading-7 tracking-[-0.02em] tabular-nums text-[var(--text-strong)] @[520px]:text-[26px] @[520px]:leading-8';
  const zones = [['12%', 'var(--chart-1)', 'Z1 Repos'], ['18%', 'var(--chart-3)', 'Z2 Endurance'], ['27%', 'var(--chart-6)', 'Z3 Tempo'], ['29%', 'var(--chart-2)', 'Z4 Seuil'], ['14%', 'var(--down)', 'Z5 Max']];
  const seances = [['var(--up)', 'Sortie longue · 21 km', 'Validée'], ['var(--down)', 'Seuil 3 × 10 min', 'Écourtée'], ['var(--warn)', 'Côtes 10 × 200 m', 'À reprogrammer']];
  return (
    <div className="grid gap-3 @[640px]:grid-cols-[1.2fr_1fr]">
      <header className="flex min-h-10 items-center justify-between gap-3 @[640px]:col-span-2">
        <span className="inline-flex items-center gap-2 text-[var(--text-strong)]" aria-label="Pulsa">
          <svg viewBox="0 0 100 100" className="size-7" aria-hidden><rect width="100" height="100" rx="30" fill="var(--accent)" /><path d="M18 54h15l8-19 12 34 8-15h21" fill="none" stroke="var(--accent-fg)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <b className="text-lg font-semibold tracking-[-0.02em]">Pulsa</b>
        </span>
        <span className="text-[13px] text-[var(--text-muted)]">Semaine 45 · 3–9 nov.</span>
      </header>
      <div className="grid grid-cols-2 gap-3 @[520px]:grid-cols-3 @[640px]:col-span-2">
        <article className={card}><p className={k}>FC moyenne</p><p className={v}>148 <small className="text-sm font-medium text-[var(--text-muted)]">bpm</small></p><p className="m-0 text-[13px] font-medium text-[var(--down)]">▲ 6 vs semaine 44</p></article>
        <article className={card}><p className={k}>VO2 max</p><p className={v}>47</p><p className="m-0 text-[13px] font-medium text-[var(--up)]">▲ 2 en 30 jours</p></article>
        <article className={`${card} col-span-2 @[520px]:col-span-1`}><p className={k}>Récupération</p><p className={v}>82 <small className="text-sm font-medium text-[var(--text-muted)]">%</small></p><p className="m-0 text-[13px] font-medium text-[var(--warn)]">Sommeil court</p></article>
      </div>
      <article className={`${card} gap-3 @[640px]:col-span-2`}>
        <div className="flex items-center justify-between gap-2"><p className={k}>Zones cardiaques · fractionné 8 × 400 m</p><span className="rounded-full bg-[var(--tint-red-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--down)]">Surcharge</span></div>
        <div className="flex h-7 gap-[3px]" aria-hidden>{zones.map(([w, c]) => <i key={c} className="rounded-md" style={{ width: w, background: c }} />)}</div>
        <ul className="m-0 flex list-none flex-wrap gap-x-3.5 gap-y-1.5 p-0 text-[13px] text-[var(--text-muted)]">
          {zones.map(([, c, l]) => <li key={l} className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-[3px]" style={{ background: c }} />{l}</li>)}
        </ul>
      </article>
      <article className={card}>
        <div className="flex items-center justify-between gap-2"><p className={k}>Distance hebdomadaire</p>
          <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-muted)]"><i className="size-2.5 rounded-[3px] bg-[var(--accent)]" />2026 <i className="ml-2 size-2.5 rounded-[3px] bg-[var(--chart-3)]" />2025</span></div>
        <svg viewBox="0 0 320 110" className="block h-auto w-full overflow-visible" aria-hidden fill="none" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
          <path d="M0 20h320M0 55h320M0 90h320" stroke="var(--chart-grid)" strokeWidth="1" />
          <path d="M0 78 40 70 80 74 120 58 160 62 200 50 240 56 280 44 320 48" stroke="var(--chart-3)" />
          <path d="M0 70 40 60 80 64 120 44 160 40 200 30 240 36 280 22 320 18" stroke="var(--accent)" />
          <circle cx="280" cy="22" r="4.5" fill="var(--surface)" stroke="var(--accent)" />
        </svg>
      </article>
      <article className={card}>
        <p className={k}>Séances</p>
        <ul className="m-0 mt-1 grid list-none gap-0.5 p-0">
          {seances.map(([c, l, s], i) => (
            <li key={l} className={`grid min-h-9 grid-cols-[10px_1fr_auto] items-center gap-2.5 text-sm ${i ? 'border-t border-[var(--border)]' : ''}`}>
              <i className="size-2.5 rounded-full" style={{ background: c }} /><span>{l}</span><b className="text-[13px] font-medium" style={{ color: c }}>{s}</b>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}

export default ColorBlindSimulator;
