// Calculateur de prix au curseur — React 18 + Tailwind CSS, sans autre bibliothèque.
// Couleurs : variables de tokens.css. Marque (Parlo) et tarifs fictifs.
import { useEffect, useId, useMemo, useRef, useState } from 'react';

/** @typedef {{ key: string, label: string, hint?: string, unit: [string, string], default: number, stops: number[], compact?: boolean }} SliderDef */
/** @typedef {{ id: string, name: string, pitch?: string, base: number, prices: Record<string, { unit: number, included?: number, per?: number }>, limits?: Record<string, number> }} PlanDef */

export const PARLO_SLIDERS = [
  { key: 'seats', label: 'Sièges', hint: 'Superviseurs et agents dans la console', unit: ['siège', 'sièges'], default: 3,
    stops: [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250] },
  { key: 'minutes', label: 'Minutes d’appel IA', hint: 'Conversations tenues par vos agents vocaux', unit: ['min', 'min'], default: 500,
    stops: [0, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 7500, 10000, 15000, 20000, 30000, 40000, 50000, 75000, 100000] },
  { key: 'api', label: 'Appels API', hint: 'Webhooks, CRM et intégrations', unit: ['appel', 'appels'], default: 10000, compact: true,
    stops: [0, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2000000, 5000000, 10000000] },
];
export const PARLO_PLANS = [
  { id: 'essentiel', name: 'Essentiel', pitch: 'Pour démarrer', base: 0,
    prices: { seats: { unit: 9 }, minutes: { unit: 0.1 }, api: { included: 5000, unit: 0.4, per: 1000 } }, limits: { seats: 10, minutes: 5000 } },
  { id: 'pro', name: 'Pro', pitch: '2 000 min et 50 k appels inclus', base: 79,
    prices: { seats: { unit: 14 }, minutes: { included: 2000, unit: 0.08 }, api: { included: 50000, unit: 0.25, per: 1000 } }, limits: { seats: 50, minutes: 30000 } },
  { id: 'echelle', name: 'Échelle', pitch: '10 000 min et 500 k appels inclus', base: 349,
    prices: { seats: { unit: 9 }, minutes: { included: 10000, unit: 0.05 }, api: { included: 500000, unit: 0.12, per: 1000 } }, limits: {} },
];
export const PARLO_ENTERPRISE = { name: 'Entreprise', above: { seats: 150, minutes: 50000, api: 5000000 } };
export const PARLO_PRESETS = [
  { label: 'Startup', values: { seats: 3, minutes: 500, api: 10000 } },
  { label: 'PME', values: { seats: 12, minutes: 4000, api: 100000 } },
  { label: 'Centre d’appels', values: { seats: 60, minutes: 30000, api: 500000 } },
];

const ICONS = {
  seats: <><path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19" /><circle cx="10" cy="7.5" r="3.5" /><path d="M20 19v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 4.2a3.5 3.5 0 0 1 0 6.6" /></>,
  minutes: <path d="M5 9v6M9 6v12M13 9v6M17 7v10M21 10v4" />,
  api: <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" />,
};
const BOUNCE = 'cubic-bezier(.34,1.56,.64,1)';
const SMOOTH = 'cubic-bezier(.22,1,.36,1)';

function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = matchMedia('(prefers-reduced-motion: reduce)');
    setR(m.matches); const on = () => setR(m.matches); m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return r;
}

/* Ressort amorti → courbe linear() (repli : Bézier douce si le navigateur ne la connaît pas). */
function springEasing(stiffness, damping) {
  if (typeof CSS === 'undefined' || !CSS.supports('transition-timing-function', 'linear(0, 1)')) return { ease: SMOOTH, ms: 560 };
  let x = 0, v = 0, t = 0, still = 0; const dt = 1 / 120, pts = [];
  while (t < 2.5) {
    v += (-stiffness * (x - 1) - damping * v) * dt; x += v * dt; t += dt; pts.push(x);
    if (Math.abs(x - 1) < 0.001 && Math.abs(v) < 0.01) { if (++still > 12) break; } else still = 0;
  }
  const out = Array.from({ length: 41 }, (_, i) => (i === 40 ? 1 : +pts[Math.floor((i / 40) * (pts.length - 1))].toFixed(4)));
  return { ease: `linear(${out.join(', ')})`, ms: Math.round(t * 1000) };
}

/* Nombre qui roule : chaque chiffre est une colonne 0-9, alignée depuis la droite. */
function Rolling({ value, ease, ms, reduce }) {
  const chars = Array.from(String(value));
  return (
    <span className="inline-flex whitespace-nowrap tabular-nums">
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" className="inline-flex">
        {chars.map((c, i) => {
          const fromRight = chars.length - 1 - i;
          if (!/\d/.test(c)) return <span key={`c${fromRight}-${c}`} className="inline-block h-[1.15em] whitespace-pre align-top leading-[1.15em]">{c}</span>;
          return (
            <span key={`d${fromRight}`} className="inline-block h-[1.15em] overflow-hidden align-top leading-[1.15em]">
              <span className="flex flex-col"
                style={{ transform: `translateY(${-c * 10}%)`, transition: reduce ? 'none' : `transform ${ms}ms ${ease} ${Math.min(fromRight, 6) * 16}ms` }}>
                {'0123456789'.split('').map((d) => <span key={d} className="block h-[1.15em] text-center">{d}</span>)}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}

/**
 * @param {{
 *  title?: string, lead?: string, currency?: 'EUR'|'USD'|'GBP', defaultPeriod?: 'month'|'year', discount?: number,
 *  sliders?: string, defaultPreset?: number, bands?: boolean, roll?: 'spring'|'smooth'|'none', stiffness?: number, damping?: number,
 *  sliderDefs?: SliderDef[], plans?: PlanDef[], enterprise?: { name: string, above: Record<string, number> }, presets?: { label: string, values: Record<string, number> }[],
 *  onSelect?: (d: object) => void, onContact?: (d: object) => void, onChange?: (d: object) => void
 * }} props
 */
export function VolumePricing({
  title = 'Un prix qui suit votre volume, pas l’inverse.',
  lead = 'Réglez vos sièges, vos minutes d’appel et vos appels API : on calcule le total de chaque offre et on allume la moins chère pour vous.',
  currency = 'EUR', defaultPeriod = 'month', discount = 20,
  sliders = 'seats,minutes,api', defaultPreset = 0, bands = true,
  roll = 'spring', stiffness = 170, damping = 19,
  sliderDefs = PARLO_SLIDERS, plans = PARLO_PLANS, enterprise = PARLO_ENTERPRISE, presets = PARLO_PRESETS,
  onSelect, onContact, onChange,
}) {
  const uid = useId();
  const reduce = useReducedMotion();
  const keys = sliders.split(/[,\s]+/).filter(Boolean);
  const S = sliderDefs.filter((s) => keys.includes(s.key));
  const disc = Math.max(0, Math.min(90, discount)) / 100;

  const [values, setValues] = useState(() => {
    const v = Object.fromEntries(sliderDefs.map((s) => [s.key, keys.includes(s.key) ? s.default : s.stops[0]]));
    const p = presets[defaultPreset];
    if (p) Object.entries(p.values).forEach(([k, x]) => { if (keys.includes(k)) v[k] = x; });
    return v;
  });
  const [preset, setPreset] = useState(presets[defaultPreset] ? defaultPreset : -1);
  const [period, setPeriod] = useState(defaultPeriod);
  const [pick, setPick] = useState(null);
  const [active, setActive] = useState(null);
  const [jump, setJump] = useState(false);
  const [lean, setLean] = useState(0);

  const fmt = useMemo(() => {
    const o = { style: 'currency', currency, currencyDisplay: 'narrowSymbol' };
    const money = new Intl.NumberFormat('fr-FR', { ...o, maximumFractionDigits: 0 });
    const money2 = new Intl.NumberFormat('fr-FR', { ...o, minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const num = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
    const compact = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });
    return {
      money: (v) => money.format(Math.round(v)),
      amount: (v) => { const r = Math.round(v * 100) / 100; return r % 1 ? money2.format(r) : money.format(r); },
      unit: (u) => (u < 1 ? money2.format(u) : money.format(u)),
      v: (s, v) => (s.compact && v >= 10000 ? compact.format(v) : num.format(v)),
    };
  }, [currency]);
  const unitOf = (s, v) => (v > 1 ? s.unit[1] : s.unit[0]);
  const spring = useMemo(() => (roll === 'spring' ? springEasing(stiffness, damping) : { ease: SMOOTH, ms: roll === 'none' ? 0 : 520 }), [roll, stiffness, damping]);
  const R = (v) => <Rolling value={v} ease={spring.ease} ms={spring.ms} reduce={reduce || roll === 'none'} />;

  /* Calcul */
  const lineCost = (plan, key, v) => { const pr = plan.prices[key]; return pr ? (Math.max(0, v - (pr.included || 0)) / (pr.per || 1)) * pr.unit : 0; };
  const planCost = (plan, vals) => S.reduce((t, s) => t + lineCost(plan, s.key, vals[s.key]), plan.base || 0);
  const planOk = (plan, vals) => S.every((s) => !(plan.limits && plan.limits[s.key] != null && vals[s.key] > plan.limits[s.key]));
  const isEnt = (vals) => S.some((s) => enterprise?.above?.[s.key] != null && vals[s.key] > enterprise.above[s.key]);
  const recommend = (vals) => {
    if (isEnt(vals)) return 'ent';
    let best = null, bc = Infinity;
    plans.forEach((p) => { if (planOk(p, vals)) { const c = planCost(p, vals); if (c < bc - 1e-9) { bc = c; best = p.id; } } });
    return best;
  };
  const byId = (id) => plans.find((p) => p.id === id);

  const rec = recommend(values);
  const ent = rec === 'ent';
  const chosen = !ent && pick && planOk(byId(pick), values) ? pick : rec;
  const f = period === 'year' ? 1 - disc : 1;
  const costs = Object.fromEntries(plans.map((p) => [p.id, planOk(p, values) ? planCost(p, values) : null]));

  useEffect(() => { onChange?.({ plan: chosen, recommended: rec, period, volumes: values }); }, [chosen, rec, period, values]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Inclinaison de la bulle : vitesse → angle, ramené par un ressort. */
  const leanRef = useRef({ rot: 0, vel: 0, target: 0, raf: 0, lastP: null, lastT: 0, t: 0 });
  useEffect(() => () => cancelAnimationFrame(leanRef.current.raf), []);
  function pushLean(p, width) {
    if (reduce) return;
    const L = leanRef.current, now = performance.now();
    if (L.lastP !== null && now - L.lastT < 200) L.target = Math.max(-14, Math.min(14, -((p - L.lastP) * width) / Math.max(8, now - L.lastT) * 6));
    L.lastP = p; L.lastT = now;
    if (L.raf) return;
    const loop = (t) => {
      const dt = Math.min(0.032, L.t ? (t - L.t) / 1000 : 0.016); L.t = t;
      L.target *= Math.pow(0.02, dt); L.vel += ((L.target - L.rot) * 260 - L.vel * 22) * dt; L.rot += L.vel * dt;
      if (Math.abs(L.rot) < 0.05 && Math.abs(L.vel) < 0.05 && Math.abs(L.target) < 0.05) { L.rot = 0; L.raf = 0; L.t = 0; setLean(0); return; }
      setLean(L.rot); L.raf = requestAnimationFrame(loop);
    };
    L.raf = requestAnimationFrame(loop);
  }
  const jumpT = useRef(0);
  function doJump() { if (reduce) return; setJump(true); clearTimeout(jumpT.current); jumpT.current = setTimeout(() => setJump(false), 560); }

  /* Bandes : offre conseillée à chaque cran, les autres volumes figés. */
  function bandsFor(s) {
    const n = s.stops.length, runs = [];
    s.stops.forEach((v, i) => {
      const r = recommend({ ...values, [s.key]: v }) || 'none';
      const last = runs[runs.length - 1];
      if (last && last.id === r) last.b = i; else runs.push({ id: r, a: i, b: i });
    });
    return runs.map((r, k) => ({ id: r.id, st: k === 0 ? 0 : (r.a - 0.5) / (n - 1), en: k === runs.length - 1 ? 1 : (r.b + 0.5) / (n - 1) }));
  }

  /* Barre mobile : visible tant que le récapitulatif est hors écran. */
  const sumRef = useRef(null);
  const [showBar, setShowBar] = useState(false);
  useEffect(() => {
    if (!sumRef.current || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting), { threshold: 0.15 });
    io.observe(sumRef.current); return () => io.disconnect();
  }, []);

  const move = active ? '0ms' : jump ? '520ms' : '120ms';
  const plan = byId(chosen);
  const c = plan ? costs[chosen] : 0;
  const others = plans.filter((p) => p.id !== chosen && costs[p.id] != null).sort((a, b) => costs[a.id] - costs[b.id]);
  let tone = 'green', saveT = '', saveS = '';
  if (ent) { tone = 'neutral'; saveT = 'Votre volume dépasse nos offres en libre-service'; saveS = 'Un expert vous répond sous 24 h ouvrées avec un tarif dédié.'; }
  else if (pick && pick !== rec) { tone = 'amber'; saveT = `Ce choix coûte ${fmt.money((c - costs[rec]) * f)} de plus par mois`; saveS = `${byId(rec).name} couvre le même volume pour moins cher.`; }
  else {
    const alt = others[0], save = (alt ? (costs[alt.id] - c) * 12 * f : 0) + (period === 'year' ? c * 12 * disc : 0);
    if (save >= 1) { saveT = `Vous économisez ${fmt.money(save)} par an`; const s = [alt ? `face à ${alt.name}` : '', period === 'year' && disc ? 'remise annuelle incluse' : ''].filter(Boolean).join(', '); saveS = s.charAt(0).toUpperCase() + s.slice(1); }
    else if (disc) { tone = 'neutral'; saveT = `Passez à l’annuel : ${fmt.money(c * 12 * disc)} de moins par an`; saveS = 'Même offre, même volume, facturée une fois.'; }
    else { tone = 'neutral'; saveT = 'Le meilleur prix pour ce volume'; }
  }
  const TONE = {
    green: 'border-[var(--tint-green-border)] bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]',
    amber: 'border-[var(--tint-amber-border)] bg-[var(--tint-amber-bg)] text-[var(--tint-amber-fg)]',
    neutral: 'border-[var(--tint-neutral-border)] bg-[var(--tint-neutral-bg)] text-[var(--tint-neutral-fg)]',
  }[tone];
  const rows = !ent && plan ? [
    [`Abonnement ${plan.name}`, '', fmt.money(plan.base || 0)],
    ...S.map((s) => {
      const v = values[s.key], pr = plan.prices[s.key] || {}, inc = pr.included || 0, lc = lineCost(plan, s.key, v);
      const d = !pr.unit ? 'inclus' : v <= inc ? `${fmt.v(s, v)} sur ${fmt.v(s, inc)} inclus`
        : `${inc ? `${fmt.v(s, v - inc)} au-delà des ${fmt.v(s, inc)} inclus · ` : `${fmt.v(s, v)} × `}${fmt.unit(pr.unit)}${pr.per > 1 ? ` les ${fmt.v(s, pr.per)}` : s.unit[0] === 'min' ? '/min' : ''}`;
      return [s.label, d, lc ? fmt.amount(lc) : 'Inclus'];
    }),
    ...(period === 'year' && disc ? [['Remise annuelle', `−${Math.round(disc * 100)} %`, `−${fmt.amount(c * disc)}`, true]] : []),
  ] : [];
  const sumLabel = ent ? 'Votre volume' : pick && pick !== rec ? 'Offre choisie' : 'Offre conseillée';
  const total = ent ? 'Sur devis' : fmt.money(c * f);
  const available = plans.filter((p) => costs[p.id] != null);

  function cta() {
    const d = { plan: ent ? 'ent' : chosen, period, volumes: values };
    ent ? onContact?.(d) : onSelect?.(d);
  }
  function onPlansKey(e) {
    const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!dir || ent) return; e.preventDefault();
    const i = available.findIndex((p) => p.id === chosen), n = available[(i + dir + available.length) % available.length];
    if (n) { setPick(n.id); e.currentTarget.querySelector(`[data-plan="${n.id}"]`)?.focus(); }
  }

  return (
    <section aria-labelledby={`${uid}-t`} className="bg-[var(--bg)] px-4 pb-[72px] pt-14 [font-family:var(--font-sans)] text-[var(--text)]">
      <div className="mx-auto grid max-w-[1120px] gap-10">
        <header className="grid justify-items-center gap-3 text-center">
          <p className="m-0 [font-family:var(--font-mono)] text-xs uppercase tracking-[var(--track-caps)] text-[var(--text-muted)]">Tarifs à l’usage · Parlo</p>
          <h2 id={`${uid}-t`} className="m-0 max-w-[18ch] text-balance text-[clamp(2rem,1.4rem+2.6vw,3.25rem)] font-semibold leading-[1.06] tracking-[-.035em] text-[var(--text-strong)]">{title}</h2>
          <p className="m-0 max-w-[54ch] text-pretty text-[17px] leading-relaxed text-[var(--text-muted)]">{lead}</p>
        </header>

        <div className="grid items-start gap-4 min-[960px]:grid-cols-[minmax(0,1fr)_376px] min-[960px]:gap-6">
          {/* Volumes */}
          <div className="grid gap-2 rounded-[var(--radius-sheet)] border border-[var(--border)] bg-[var(--surface)] px-4 pb-4 pt-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pb-2">
              <h3 className="m-0 text-[17px] font-semibold tracking-[-.01em] text-[var(--text-strong)]">Votre volume mensuel</h3>
              {presets.length > 0 && (
                <div role="group" aria-label="Exemples de volume" className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-[var(--border)] bg-[var(--raised)] p-1 [scrollbar-width:none]">
                  {presets.map((p, i) => (
                    <button key={p.label} type="button" aria-pressed={preset === i}
                      onClick={() => { setPreset(i); setValues((v) => { const n = { ...v }; Object.entries(p.values).forEach(([k, x]) => { if (keys.includes(k)) n[k] = x; }); return n; }); doJump(); }}
                      className={`h-11 flex-none whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-[color,background-color,box-shadow] duration-[var(--motion-base)] focus-visible:outline focus-visible:outline-[length:var(--focus-width)] focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] sm:h-9
                        ${preset === i ? 'bg-[var(--surface)] text-[var(--text-strong)] [box-shadow:var(--shadow-overlay),0_0_0_1px_var(--border)]' : 'text-[var(--text-muted)] [@media(hover:hover)]:hover:text-[var(--text-strong)]'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {S.map((s, si) => {
              const v = values[s.key];
              const idx = s.stops.reduce((bi, x, i) => (Math.abs(x - v) < Math.abs(s.stops[bi] - v) ? i : bi), 0);
              const p = idx / (s.stops.length - 1);
              const B = bands ? bandsFor(s) : [{ id: 'all', st: 0, en: 1 }];
              const id = `${uid}-${s.key}`, isActive = active === s.key;
              return (
                <div key={s.key} className={`grid gap-1 pb-3 pt-4 ${si ? 'border-t border-[var(--border)]' : ''}`}>
                  <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                    <span aria-hidden="true" className="grid size-9 place-items-center rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--raised)] text-[var(--text-strong)] sm:size-10">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{ICONS[s.key] || <circle cx="12" cy="12" r="8" />}</svg>
                    </span>
                    <span className="grid min-w-0">
                      <label htmlFor={id} className="cursor-pointer text-[15px] font-semibold leading-snug text-[var(--text-strong)]">{s.label}</label>
                      {s.hint && <span id={`${id}-h`} className="hidden truncate text-[13px] text-[var(--text-muted)] min-[480px]:block">{s.hint}</span>}
                    </span>
                    <output htmlFor={id} className="inline-flex items-baseline gap-1.5 whitespace-nowrap text-[19px] font-semibold tracking-[-.02em] text-[var(--text-strong)] min-[480px]:text-[22px]">
                      {R(fmt.v(s, v))}<span className="text-[13px] font-medium tracking-normal text-[var(--text-muted)]">{unitOf(s, v)}</span>
                    </output>
                  </div>

                  <div className="relative h-12 touch-pan-y">
                    <div className="absolute inset-x-3 top-1/2 -mt-1 h-2">
                      {B.map((b, i) => {
                        const on = p >= b.st - 1e-6 && (p < b.en || i === B.length - 1);
                        const fill = Math.max(0, Math.min(1, (p - b.st) / Math.max(1e-6, b.en - b.st)));
                        return (
                          <span key={`${b.id}-${i}`}
                            className={`absolute top-0 h-full overflow-hidden rounded-full ${b.id === 'ent' ? 'bg-transparent shadow-[inset_0_0_0_1px_var(--border-control)]' : 'bg-[var(--scale-track)]'}`}
                            style={{ left: `${b.st * 100}%`, width: `calc(${(b.en - b.st) * 100}% - ${i < B.length - 1 ? 3 : 0}px)`, transform: bands && on ? 'scaleY(1.5)' : 'none',
                              transition: reduce ? 'none' : `left 520ms ${SMOOTH}, width 520ms ${SMOOTH}, transform 260ms ${BOUNCE}` }}>
                            <span className={`absolute inset-y-0 left-0 rounded-full ${b.id === 'ent' ? 'bg-[var(--text-muted)]' : 'bg-[var(--accent)]'}`}
                              style={{ width: `${fill * 100}%`, transition: reduce ? 'none' : `width ${move} ease-out` }} />
                          </span>
                        );
                      })}
                    </div>
                    <div className="pointer-events-none absolute top-1/2 size-0" style={{ left: `calc(12px + ${p} * (100% - 24px))`, transition: reduce ? 'none' : `left ${move} ease-out` }}>
                      <span className={`absolute -left-3 -top-3 size-6 rounded-full bg-[var(--surface)] [box-shadow:var(--shadow-popover),0_0_0_1px_var(--border)] transition-transform duration-300 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] dark:[box-shadow:var(--shadow-popover),0_0_0_1px_var(--border-control)]
                        ${isActive ? 'scale-[1.12]' : ''}`}>
                        <span className={`absolute inset-2 rounded-full bg-[var(--accent)] transition-transform duration-300 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] ${isActive ? 'scale-125' : ''}`} />
                      </span>
                      <span aria-hidden="true"
                        className="absolute bottom-[18px] left-0 grid h-7 min-w-10 place-items-center whitespace-nowrap rounded-[var(--radius-ctl)] bg-[var(--text-strong)] px-2.5 [font-family:var(--font-mono)] text-[13px] font-semibold tabular-nums text-[var(--bg)] after:absolute after:-bottom-1 after:left-1/2 after:-ml-1 after:size-2 after:rotate-45 after:rounded-[2px] after:bg-inherit"
                        style={{ transformOrigin: '50% calc(100% + 18px)', opacity: isActive ? 1 : 0,
                          transform: `translateX(-50%) rotate(${lean.toFixed(2)}deg) translateY(${isActive ? 0 : 6}px) scale(${isActive ? 1 : 0.85})`,
                          transition: reduce ? 'none' : `opacity 160ms ease-out, transform 320ms ${BOUNCE}` }}>
                        {fmt.v(s, v)}
                      </span>
                    </div>
                    <input id={id} type="range" min={0} max={s.stops.length - 1} step={1} value={idx}
                      aria-describedby={s.hint ? `${id}-h` : undefined}
                      aria-valuetext={`${fmt.v(s, v)} ${unitOf(s, v)}${rec ? `, offre conseillée : ${ent ? enterprise.name : byId(rec).name}` : ''}`}
                      onPointerDown={() => setActive(s.key)}
                      onPointerUp={(e) => { if (!e.currentTarget.matches(':focus-visible')) setActive(null); }}
                      onFocus={(e) => { if (e.currentTarget.matches(':focus-visible')) setActive(s.key); }}
                      onBlur={() => setActive(null)}
                      onChange={(e) => {
                        const i = +e.target.value; setPreset(-1);
                        if (active !== s.key) doJump();
                        pushLean(i / (s.stops.length - 1), e.target.getBoundingClientRect().width - 24);
                        setValues((x) => ({ ...x, [s.key]: s.stops[i] }));
                      }}
                      className="peer absolute inset-0 m-0 size-full cursor-grab appearance-none bg-transparent opacity-0 active:cursor-grabbing [&::-webkit-slider-thumb]:h-12 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:h-12 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:border-0" />
                    {/* Anneau de focus clavier, dessiné autour de la poignée */}
                    <span aria-hidden="true" className="pointer-events-none absolute top-1/2 -ml-[18px] -mt-[18px] size-9 rounded-full opacity-0 ring-2 ring-[var(--focus-ring)] ring-offset-2 ring-offset-[var(--surface)] peer-focus-visible:opacity-100"
                      style={{ left: `calc(12px + ${p} * (100% - 24px))`, transition: reduce ? 'none' : `left ${move} ease-out` }} />
                  </div>

                  {bands && (
                    <div aria-hidden="true" className="relative mx-3 h-[18px]">
                      {B.map((b, i) => {
                        const on = p >= b.st - 1e-6 && (p < b.en || i === B.length - 1);
                        const name = b.id === 'ent' ? 'Sur devis' : byId(b.id)?.name || '';
                        const tiny = (b.en - b.st) < (name.length * 7.5 + 22) / 600;
                        return (
                          <span key={`${b.id}-${i}`} className={`absolute top-0 flex items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap [font-family:var(--font-mono)] text-[11px] uppercase leading-[18px] tracking-[var(--track-caps)] ${on ? 'text-[var(--text-strong)]' : 'text-[var(--text-muted)]'} ${tiny ? 'opacity-0' : ''}`}
                            style={{ left: `${b.st * 100}%`, width: `${(b.en - b.st) * 100}%`, transition: reduce ? 'none' : `left 520ms ${SMOOTH}, width 520ms ${SMOOTH}, color 180ms` }}>
                            <span className="size-1.5 flex-none rounded-full bg-[var(--accent)]" style={{ transform: `scale(${on ? 1 : 0})`, transition: reduce ? 'none' : `transform 320ms ${BOUNCE}` }} />
                            {name}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Offres */}
            <div role="radiogroup" aria-label="Offres" onKeyDown={onPlansKey} className="grid gap-2 border-t border-[var(--border)] pt-4 sm:grid-cols-3">
              {plans.map((pl) => {
                const ok = costs[pl.id] != null, isRec = rec === pl.id, isSel = chosen === pl.id;
                const lim = !ok ? S.find((s) => pl.limits?.[s.key] != null && values[s.key] > pl.limits[s.key]) : null;
                return (
                  <button key={pl.id} type="button" role="radio" data-plan={pl.id} aria-checked={isSel} aria-disabled={!ok || undefined}
                    tabIndex={isSel || (!available.some((p) => p.id === chosen) && available[0]?.id === pl.id) ? 0 : -1}
                    aria-label={`${pl.name}, ${ok ? `${fmt.money(costs[pl.id] * f)} par mois` : 'indisponible pour ce volume'}${isRec ? ', conseillé' : ''}`}
                    onClick={() => { if (ok && !ent) setPick(pl.id); }}
                    className={`relative grid min-h-[72px] grid-cols-[minmax(0,1fr)_auto] content-center items-center gap-x-3 gap-y-0.5 rounded-[var(--radius-card)] border px-3.5 py-3 text-left transition-[border-color,background-color,box-shadow,transform] duration-500 sm:min-h-[104px] sm:grid-cols-1 sm:content-start sm:gap-1 sm:px-4 sm:py-3.5
                      focus-visible:outline focus-visible:outline-[length:var(--focus-width)] focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]
                      ${ent ? "opacity-[.55]" : ""}
                      ${!ok ? 'cursor-not-allowed border-dashed border-[var(--border)] bg-transparent' : isRec ? 'border-[var(--accent)] bg-[var(--surface)] shadow-[0_0_0_1px_var(--accent),0_16px_40px_-16px_var(--glow-accent),0_0_32px_var(--glow-accent)] active:scale-[.985]' : 'border-[var(--border)] bg-[var(--raised)] active:scale-[.985] [@media(hover:hover)]:hover:border-[var(--border-control)]'}`}>
                    <span className="flex min-h-[22px] items-center gap-2 sm:justify-between">
                      <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--text-strong)]">
                        <span aria-hidden="true" className={`grid size-4 flex-none place-items-center rounded-full border-[1.5px] ${isSel ? 'border-[var(--accent)]' : 'border-[var(--border-control)]'}`}>
                          <span className="size-2 rounded-full bg-[var(--accent)]" style={{ transform: `scale(${isSel ? 1 : 0})`, transition: `transform 320ms ${BOUNCE}` }} />
                        </span>
                        {pl.name}
                      </span>
                      <span aria-hidden="true" className="inline-flex h-[22px] items-center rounded-full bg-[var(--accent)] px-2 text-[11px] font-semibold text-[var(--accent-fg)]"
                        style={{ transform: `scale(${isRec ? 1 : 0.6})`, opacity: isRec ? 1 : 0, transition: reduce ? 'none' : `transform 360ms ${BOUNCE}, opacity 180ms` }}>Conseillé</span>
                    </span>
                    <span className={`col-start-2 row-span-2 row-start-1 flex items-baseline gap-1 sm:col-auto sm:row-auto sm:mt-1.5 ${ok ? 'text-[20px] font-semibold tracking-[-.03em] text-[var(--text-strong)] sm:text-2xl' : 'text-[15px] font-medium text-[var(--text-muted)]'}`}>
                      {ok ? <>{R(fmt.money(costs[pl.id] * f))}<small className="text-[13px] font-medium tracking-normal text-[var(--text-muted)]">/mois</small></> : 'Hors limite'}
                    </span>
                    <span className={`pl-6 text-xs leading-snug sm:pl-0 ${ok ? 'text-[var(--text-muted)]' : 'text-[var(--tint-amber-fg)]'}`}>
                      {ok ? pl.pitch : lim ? `Jusqu’à ${fmt.v(lim, pl.limits[lim.key])} ${unitOf(lim, pl.limits[lim.key])}` : 'Indisponible'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Récapitulatif */}
          <aside ref={sumRef} aria-labelledby={`${uid}-s`} className="grid scroll-mt-6 gap-1 rounded-[var(--radius-sheet)] border border-[var(--border)] bg-[var(--surface)] px-4 py-5 sm:p-6 min-[960px]:sticky min-[960px]:top-6">
            <div role="radiogroup" aria-label="Période de facturation" className="relative mb-5 grid grid-cols-2 rounded-full border border-[var(--border)] bg-[var(--raised)] p-1"
              onKeyDown={(e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); const n = period === 'year' ? 'month' : 'year'; setPeriod(n); e.currentTarget.querySelector(`[data-p="${n}"]`)?.focus(); } }}>
              <span aria-hidden="true" className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-[var(--surface)] [box-shadow:var(--shadow-overlay),0_0_0_1px_var(--border)]"
                style={{ transform: period === 'year' ? 'translateX(100%)' : 'none', transition: reduce ? 'none' : `transform 460ms ${BOUNCE}` }} />
              {[['month', 'Mensuel'], ['year', 'Annuel']].map(([k, l]) => (
                <button key={k} type="button" role="radio" data-p={k} aria-checked={period === k} tabIndex={period === k ? 0 : -1} onClick={() => setPeriod(k)}
                  className={`relative z-[1] inline-flex h-10 items-center justify-center gap-1.5 rounded-full text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-[length:var(--focus-width)] focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] ${period === k ? 'text-[var(--text-strong)]' : 'text-[var(--text-muted)]'}`}>
                  {l}{k === 'year' && disc > 0 && <span className="inline-flex h-5 items-center rounded-full bg-[var(--tint-green-bg)] px-1.5 text-[11px] font-semibold text-[var(--tint-green-fg)]">−{Math.round(disc * 100)} %</span>}
                </button>
              ))}
            </div>
            <p id={`${uid}-s`} className="m-0 [font-family:var(--font-mono)] text-xs uppercase tracking-[var(--track-caps)] text-[var(--text-muted)]">{sumLabel}</p>
            <p className="m-0 overflow-hidden text-xl font-semibold leading-snug tracking-[-.015em] text-[var(--text-strong)]">
              <span key={ent ? 'ent' : chosen} className="inline-block motion-safe:animate-[pcvIn_420ms_cubic-bezier(.22,1,.36,1)]">{ent ? enterprise.name : plan?.name}</span>
            </p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="text-[clamp(3rem,2.4rem+2.4vw,4rem)] font-semibold leading-none tracking-[-.045em] text-[var(--text-strong)]">{R(total)}</span>
              {!ent && <span className="text-sm text-[var(--text-muted)]">HT / mois</span>}
            </div>
            <p className="m-0 mt-1 min-h-[21px] text-sm text-[var(--text-muted)]">
              {ent ? 'Tarifs négociés au-delà de ce volume.' : period === 'year' ? `Facturé ${fmt.money(Math.round(c * f) * 12)} par an` : 'Sans engagement, résiliable chaque mois'}
            </p>
            <div className={`mt-3 grid grid-cols-[auto_1fr] items-start gap-2.5 rounded-[var(--radius-card)] border px-3.5 py-3 transition-colors duration-300 ${TONE}`}>
              <svg className="mt-px" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {tone === 'green' ? <><path d="M20 12a8 8 0 1 1-8-8" /><path d="M20 4l-8 8-3-3" /></> : tone === 'amber' ? <><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17h.01" /></> : <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>}
              </svg>
              <span className="grid gap-0.5">
                <b className="text-sm font-semibold leading-snug">{saveT}</b>
                {saveS && <small className="text-[13px] leading-snug opacity-90">{saveS}</small>}
                {tone === 'amber' && <button type="button" onClick={() => setPick(null)} className="mt-1 min-h-7 justify-self-start text-[13px] font-semibold underline underline-offset-[3px]">Prendre {byId(rec).name}</button>}
              </span>
            </div>
            {rows.length > 0 && (
              <dl className="m-0 mt-4 grid">
                {rows.map(([k, d, val, isDisc]) => (
                  <div key={k} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 border-t border-[var(--border)] py-2.5">
                    <dt className="text-sm leading-snug">{k}{d && <small className="mt-0.5 block text-xs tabular-nums text-[var(--text-muted)]">{d}</small>}</dt>
                    <dd className={`m-0 text-right text-sm font-semibold tabular-nums ${isDisc ? 'text-[var(--tint-green-fg)]' : 'text-[var(--text-strong)]'}`}>{val}</dd>
                  </div>
                ))}
              </dl>
            )}
            <button type="button" onClick={cta}
              className="group mt-4 inline-flex h-[52px] items-center justify-center gap-2 rounded-[var(--radius-ctl)] bg-[var(--accent)] px-5 text-base font-semibold text-[var(--accent-fg)] transition active:scale-[.98] focus-visible:outline focus-visible:outline-[length:var(--focus-width)] focus-visible:outline-offset-[var(--focus-offset)] focus-visible:outline-[var(--focus-ring)] [@media(hover:hover)]:hover:bg-[var(--accent-hover)]">
              {ent ? 'Parler à un expert' : `Choisir ${plan?.name}`}
              <svg className="transition-transform duration-300 [@media(hover:hover)]:group-hover:translate-x-[3px]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
            <p className="m-0 mt-2.5 text-balance text-center text-[13px] leading-normal text-[var(--text-muted)]">14 jours d’essai, sans carte bancaire. Changez d’offre à tout moment, au prorata.</p>
            <LiveRegion text={ent ? 'Volume au-delà des offres : tarif sur devis.' : `${sumLabel} : ${plan?.name}, ${total} hors taxes par mois.`} />
          </aside>
        </div>

        {/* Barre mobile collante */}
        <div className="sticky bottom-3 z-[2] -mt-10 h-0 min-[960px]:hidden">
          <div aria-hidden={!showBar}
            className={`absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 rounded-[var(--radius-sheet)] bg-[var(--text-strong)] py-2 pl-4 pr-2 text-[var(--bg)] [box-shadow:var(--shadow-toast)] ${showBar ? 'opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}
            style={{ transition: reduce ? 'none' : `transform 420ms ${BOUNCE}, opacity 180ms` }}>
            <span className="grid"><small className="text-xs opacity-80">{ent ? enterprise.name : `${plan?.name} · HT / mois`}</small><b className="text-lg font-semibold tracking-[-.02em]">{R(total)}</b></span>
            <button type="button" tabIndex={showBar ? 0 : -1} onClick={() => sumRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })}
              className="h-11 rounded-[var(--radius-ctl)] bg-[var(--bg)] px-4 text-sm font-semibold text-[var(--text-strong)]">Voir le détail</button>
          </div>
        </div>
      </div>
      {/* Entrée du nom d’offre (à placer dans tailwind.config sous keyframes si vous préférez) */}
      <style>{'@keyframes pcvIn{from{transform:translateY(60%);opacity:0;filter:blur(4px)}to{transform:none;opacity:1;filter:blur(0)}}'}</style>
    </section>
  );
}

/* Annonce le total après 700 ms de calme, pour ne pas inonder les lecteurs d’écran pendant un glissé. */
function LiveRegion({ text }) {
  const [said, setSaid] = useState('');
  useEffect(() => { const t = setTimeout(() => setSaid(text), 700); return () => clearTimeout(t); }, [text]);
  return <p className="sr-only" aria-live="polite">{said}</p>;
}

export default VolumePricing;
