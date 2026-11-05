// GrapheActivite.jsx — une année en cases (façon contributions) qui se remplit en vague sur un ressort,
// bulle d'info par jour, légende filtrante, grille ARIA navigable au clavier, fiche du jour sur mobile.
// React 18, Tailwind 3.4, tokens.css chargé. Sans bibliothèque. Exemple : Foulée (course à pied, marque fictive).
// Utilisation :
//   <GrapheActivite wave="diagonale" speed={14} year={2026} shape="carre" legend={true} summary={true} />
//   <GrapheActivite values={{ '2026-03-14': 12.4 }} today={new Date()} />   (vos données : valeur par jour)
import { useEffect, useMemo, useRef, useState } from 'react';

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const fmtDate = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fmtKm = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtInt = new Intl.NumberFormat('fr-FR');
const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const level = (km) => (km <= 0 ? 0 : km < 6 ? 1 : km < 10 ? 2 : km < 16 ? 3 : 4);
const LV = ['var(--raised)', 'color-mix(in oklab, var(--accent) 34%, var(--raised))', 'color-mix(in oklab, var(--accent) 58%, var(--raised))', 'color-mix(in oklab, var(--accent) 80%, var(--raised))', 'var(--accent)'];
const LEGEND = ['les jours de repos', 'les sorties de moins de 6 km', 'les sorties de 6 à 10 km', 'les sorties de 10 à 16 km', 'les sorties de plus de 16 km'];
const TODAY = new Date(2026, 10, 5); // date de référence de l'exemple ; passez today={new Date()} en production
const SPRING = 'linear(0, .02, .09 4%, .37 10%, .86 19%, 1.06 25%, 1.12 29%, 1.11 33%, 1.03 41%, .99 48%, .985 54%, 1 70%, 1)';

/** Données d'exemple déterministes : préparation marathon au printemps, vacances en août. */
export function sampleData(year) {
  let s = year * 9301 + 49297; const rnd = () => ((s = (s * 9301 + 49297) % 233280), s / 233280);
  const out = {}; const d = new Date(year, 0, 1);
  while (d.getFullYear() === year) {
    const m = d.getMonth(), wd = (d.getDay() + 6) % 7, doy = Math.floor((d - new Date(year, 0, 1)) / 864e5);
    const build = year === 2026 ? Math.max(0, 1 - Math.abs(doy - 100) / 70) : Math.max(0, 1 - Math.abs(doy - 270) / 60);
    let p = [0.55, 0.15, 0.6, 0.12, 0.35, 0.45, 0.8][wd] + build * 0.2, km = 0;
    if (m === 7 && d.getDate() > 4 && d.getDate() < 22) p *= 0.15;
    if (rnd() < p) {
      if (wd === 6) km = rnd() < 0.25 ? 8 + rnd() * 4 : 12 + build * 18 + rnd() * 7;
      else if (wd === 2) km = 7 + build * 6 + rnd() * 3;
      else km = 4 + rnd() * 5 + build * 3;
      km = Math.round(km * 10) / 10;
    }
    if (year === 2026 && m === 3 && d.getDate() === 19) km = 42.2;
    out[key(d)] = km; d.setDate(d.getDate() + 1);
  }
  return out;
}

const useMedia = (q) => {
  const [m, setM] = useState(false);
  useEffect(() => { const mq = matchMedia(q); setM(mq.matches); const f = () => setM(mq.matches); mq.addEventListener('change', f); return () => mq.removeEventListener('change', f); }, [q]);
  return m;
};
const useTween = (to, dur, reduce) => {
  const [v, setV] = useState(0); const from = useRef(0);
  useEffect(() => {
    let raf; const a = from.current, t0 = performance.now();
    const f = (now) => { const t = reduce ? 1 : Math.min(1, (now - t0) / dur); const x = a + (to - a) * (1 - (1 - t) ** 3); setV(x); from.current = x; if (t < 1) raf = requestAnimationFrame(f); };
    raf = requestAnimationFrame(f); return () => cancelAnimationFrame(raf);
  }, [to, dur, reduce]);
  return v;
};

/**
 * @param {{ wave?: 'diagonale'|'colonnes'|'radiale', speed?: number, year?: number, years?: number[], shape?: 'carre'|'rond',
 *   legend?: boolean, summary?: boolean, values?: Record<string, number>, today?: Date, className?: string }} props
 */
export default function GrapheActivite({ wave = 'diagonale', speed = 14, year: yearProp = 2026, years = [2025, 2026], shape = 'carre',
  legend = true, summary = true, values, today = TODAY, className = '' }) {
  const reduce = useMedia('(prefers-reduced-motion: reduce)');
  const narrow = useMedia('(max-width: 640px)');
  const [year, setYear] = useState(Number(yearProp));
  useEffect(() => setYear(Number(yearProp)), [yearProp]);
  const [current, setCurrent] = useState(-1);
  const [tip, setTip] = useState(null); // { i, x, y, snap }
  const [filter, setFilter] = useState(null), [peek, setPeek] = useState(null);
  const [shown, setShown] = useState(false), [waveKey, setWaveKey] = useState(0);
  const gridRef = useRef(null), chartRef = useRef(null), tipRef = useRef(null), scrollerRef = useRef(null), cellRefs = useRef([]);
  const yearRefs = useRef({});
  const radius = shape === 'rond' ? 'rounded-full' : 'rounded-[calc(var(--c)*.25)]';

  const model = useMemo(() => {
    const vals = values || sampleData(year);
    const start = new Date(year, 0, 1), off = (start.getDay() + 6) % 7, first = new Date(year, 0, 1 - off);
    const weeks = Math.ceil((off + (new Date(year, 11, 31) - start) / 864e5 + 1) / 7);
    const days = [], slots = [], months = []; let todayIdx = -1;
    for (let w = 0; w < weeks; w++) for (let r = 0; r < 7; r++) {
      const d = new Date(first); d.setDate(first.getDate() + w * 7 + r);
      const dl = wave === 'colonnes' ? w * speed : wave === 'radiale' ? Math.hypot(w - weeks + 1, (r - 3) * 1.4) * speed : (w + r * 0.9) * speed;
      if (d.getFullYear() !== year) { slots.push({ w, r, i: -1 }); continue; }
      const future = d > today, km = future ? 0 : vals[key(d)] || 0, i = days.length;
      if (key(d) === key(today)) todayIdx = i;
      days.push({ d, km, future, w, r, l: future ? -1 : level(km), delay: Math.round(dl) });
      slots.push({ w, r, i });
      if (d.getDate() === 1) months.push({ m: d.getMonth(), col: (r === 0 ? w : w + 1) + 1 });
    }
    let km = 0, runs = 0, streak = 0, best = 0, cur = 0;
    days.forEach((x) => { if (x.future) return; km += x.km; if (x.km > 0) { runs++; cur++; streak = Math.max(streak, cur); best = Math.max(best, x.km); } else cur = 0; });
    return { days, slots, months, weeks, todayIdx, sum: { km: Math.round(km), runs, streak, best } };
  }, [year, values, wave, speed, today]);
  const { days } = model;

  useEffect(() => { setCurrent(model.todayIdx >= 0 ? model.todayIdx : days.length - 1); setTip(null); }, [model]);
  /* Vague : à l'entrée dans l'écran, puis à chaque changement d'année ou de réglage. */
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(gridRef.current); return () => io.disconnect();
  }, []);
  useEffect(() => { if (shown) setWaveKey((k) => k + 1); }, [shown, year, wave, speed]);
  useEffect(() => {
    if (!narrow || current < 0) return; const el = cellRefs.current[current], sc = scrollerRef.current;
    if (el && sc && !tip) sc.scrollLeft = Math.max(0, el.offsetLeft - sc.clientWidth + 120);
  }, [narrow, model, current >= 0]);

  const place = (i, snap) => {
    const el = cellRefs.current[i], c = chartRef.current, t = tipRef.current; if (!el || !c) return;
    const cr = c.getBoundingClientRect(), er = el.getBoundingClientRect(), tw = t?.offsetWidth || 180, th = t?.offsetHeight || 64;
    const cx = er.left - cr.left + er.width / 2;
    setTip((p) => ({ i, x: Math.max(-8, Math.min(cr.width - tw + 8, cx - tw / 2)), y: er.top - cr.top - th - 10, snap: snap || !p }));
  };
  const go = (i, scroll) => {
    i = Math.max(0, Math.min(days.length - 1, i)); setCurrent(i); place(i);
    const el = cellRefs.current[i];
    if (el && gridRef.current.contains(document.activeElement)) el.focus({ preventScroll: true });
    const sc = scrollerRef.current;
    if (scroll && narrow && el && sc && (el.offsetLeft < sc.scrollLeft + 48 || el.offsetLeft > sc.scrollLeft + sc.clientWidth - 48)) sc.scrollTo({ left: el.offsetLeft - sc.clientWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
  };
  const onKey = (e) => {
    const x = days[current]; if (!x) return;
    const m = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 }[e.key];
    if (m !== undefined) { e.preventDefault(); go(current + m, true); }
    else if (e.key === 'Home') { e.preventDefault(); go(current - x.r, true); }
    else if (e.key === 'End') { e.preventDefault(); go(current + 6 - x.r, true); }
    else if (e.key === 'Escape') setTip(null);
  };
  const describe = (x) => {
    const a = x.future ? 'À venir' : x.km ? `${fmtKm.format(x.km)} km` : 'Repos';
    const s = x.km ? Math.round(300 + (x.km > 20 ? 25 : x.km > 12 ? 12 : 0) + ((x.d.getDate() * 37) % 40)) : 0;
    const b = fmtDate.format(x.d);
    return [a, b.charAt(0).toUpperCase() + b.slice(1), s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} /km` : ''];
  };
  const active = tip ? days[tip.i] : null, info = active ? describe(active) : null;
  const sel = days[current] ? describe(days[current]) : null;
  const lvlOn = filter ?? peek;

  const km = useTween(model.sum.km, 700, reduce), runs = useTween(model.sum.runs, 700, reduce);
  const streak = useTween(model.sum.streak, 700, reduce), best = useTween(model.sum.best, 700, reduce);
  const SUM = [['Distance', fmtInt.format(Math.round(km)), 'km'], ['Sorties', fmtInt.format(Math.round(runs))], ['Plus longue série', fmtInt.format(Math.round(streak)), 'jours'], ['Plus longue sortie', fmtKm.format(best), 'km']];

  const yearBtn = yearRefs.current[year];
  return (
    <section aria-labelledby="ga-titre" style={{ '--g': '4px' }}
      className={`mx-auto grid w-full max-w-[1200px] gap-6 [--c:16px] sm:[--c:13px] xl:[--c:15px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 pb-4 pt-6 font-sans text-[var(--text)] sm:gap-8 sm:rounded-2xl sm:px-12 sm:pb-8 sm:pt-10 ${className}`}>
      <header className="grid gap-2">
        <div className="mb-2 flex items-center justify-between gap-4 sm:mb-4">
          <a href="#accueil" aria-label="Foulée, accueil" className="inline-flex min-h-11 items-center gap-2 rounded-lg text-base font-semibold tracking-[-.01em] text-[var(--text-strong)] no-underline">
            <svg viewBox="0 0 100 100" aria-hidden="true" className="size-6"><rect width="100" height="100" rx="28" fill="var(--accent)" /><path d="M30 70 46 30M48 70l16-40M66 70l8-20" fill="none" stroke="var(--accent-fg)" strokeWidth="9" strokeLinecap="round" /></svg>
            Foulée
          </a>
          <div role="radiogroup" aria-label="Année affichée" className="relative inline-flex rounded-full border border-[var(--border)] bg-[var(--raised)] p-1">
            <span aria-hidden="true" style={{ width: yearBtn?.offsetWidth || 72, transform: `translateX(${(yearBtn?.offsetLeft || 4) - 4}px)` }}
              className="absolute left-1 top-1 h-9 rounded-full border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-overlay)] transition-[transform,width] duration-[420ms] [transition-timing-function:cubic-bezier(.3,1.4,.4,1)] motion-reduce:transition-none" />
            {years.map((y, i) => (
              <button key={y} ref={(n) => (yearRefs.current[y] = n)} type="button" role="radio" aria-checked={y === year} tabIndex={y === year ? 0 : -1}
                onClick={() => setYear(y)}
                onKeyDown={(e) => { const d = ['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(e.key) ? -1 : 0; if (!d) return; e.preventDefault(); const n = years[(i + d + years.length) % years.length]; setYear(n); yearRefs.current[n]?.focus(); }}
                className={`relative z-[1] h-9 min-w-16 rounded-full px-3 text-sm font-medium tabular-nums transition-colors sm:min-w-[72px] sm:px-4 ${y === year ? 'text-[var(--text-strong)]' : 'text-[var(--text-muted)]'}`}>{y}</button>
            ))}
          </div>
        </div>
        <h2 id="ga-titre" className="text-[26px] font-semibold leading-8 tracking-[-.03em] text-[var(--text-strong)] sm:text-[clamp(26px,1.4vw+16px,36px)] sm:leading-[1.15]">Votre année en foulées</h2>
        <p className="max-w-[60ch] text-[15px] leading-[22px] text-[var(--text-muted)] sm:text-base sm:leading-6">
          Une case par jour, plus elle est foncée, plus la sortie était longue. {narrow ? 'Faites glisser la frise et touchez un jour.' : 'Survolez ou parcourez au clavier pour le détail.'}
        </p>
      </header>

      {summary && (
        <dl className="m-0 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
          {SUM.map(([t, v, u]) => (
            <div key={t} className="rounded-xl bg-[var(--raised)] p-3 sm:p-4">
              <dt className="font-mono text-xs font-medium uppercase leading-4 tracking-[.02em] text-[var(--text-muted)] sm:text-[13px] sm:tracking-[.04em]">{t}</dt>
              <dd className="m-0 mt-2 text-2xl font-semibold leading-[1.1] tracking-[-.03em] text-[var(--text-strong)] tabular-nums sm:text-[28px]">{v}{u && <small className="text-[15px] font-medium tracking-normal text-[var(--text-muted)]">&nbsp;{u}</small>}</dd>
            </div>
          ))}
        </dl>
      )}

      <div ref={scrollerRef} className="-mx-4 overflow-x-auto overscroll-x-contain px-4 pb-2 [mask-image:linear-gradient(90deg,transparent,#000_16px,#000_calc(100%-16px),transparent)] sm:-mx-2 sm:px-2 sm:pb-0 sm:[mask-image:none]">
        <div ref={chartRef} className="relative grid w-max grid-cols-[32px_auto] grid-rows-[20px_auto] gap-x-2 gap-y-1.5 pt-1 sm:mx-auto">
          <div aria-hidden="true" className="col-start-2 grid gap-x-[var(--g)] text-[13px] leading-5 text-[var(--text-muted)]" style={{ gridTemplateColumns: `repeat(${model.weeks}, var(--c))` }}>
            {model.months.map((m) => <span key={m.m} style={{ gridColumn: m.col }} className={`whitespace-nowrap transition-colors ${active && active.d.getMonth() === m.m ? 'text-[var(--text-strong)]' : ''}`}>{MOIS[m.m]}</span>)}
          </div>
          <div aria-hidden="true" className="sticky left-0 z-[2] col-start-1 row-span-2 row-start-1 grid grid-rows-[repeat(7,var(--c))] items-center gap-y-[var(--g)] self-start bg-[var(--surface)] pr-1 pt-[26px] text-xs leading-none text-[var(--text-muted)] before:absolute before:-bottom-1 before:right-full before:top-0 before:w-4 before:bg-[var(--surface)] sm:static sm:before:hidden">
            {['lun', '', 'mer', '', 'ven', '', 'dim'].map((d, i) => <span key={i}>{d}</span>)}
          </div>
          <div ref={gridRef} role="grid" aria-labelledby="ga-titre" aria-describedby="ga-aide" onKeyDown={onKey}
            onPointerLeave={(e) => e.pointerType === 'mouse' && !gridRef.current.contains(document.activeElement) && setTip(null)}
            onBlur={(e) => !gridRef.current.contains(e.relatedTarget) && setTip(null)}
            className="col-start-2 row-start-2 grid gap-[var(--g)] outline-none" style={{ gridTemplateColumns: `repeat(${model.weeks}, var(--c))`, gridTemplateRows: 'repeat(7, var(--c))' }}>
            {Array.from({ length: 7 }, (_, r) => (
              <div key={r} role="row" className="contents">
                {model.slots.filter((s) => s.r === r).map((s) => {
                  if (s.i < 0) return <div key={`${s.w}-${r}`} aria-hidden="true" className="invisible" style={{ gridColumn: s.w + 1, gridRow: r + 1 }} />;
                  const x = days[s.i], isToday = s.i === model.todayIdx, dim = lvlOn !== null && x.l !== lvlOn, hot = tip?.i === s.i;
                  return (
                    <div key={`${waveKey}-${s.i}`} ref={(n) => (cellRefs.current[s.i] = n)} role="gridcell" tabIndex={s.i === current ? 0 : -1}
                      aria-label={`${fmtDate.format(x.d)}, ${x.future ? 'à venir' : x.km ? `${fmtKm.format(x.km)} km` : 'repos'}`}
                      aria-current={isToday ? 'date' : undefined} aria-disabled={x.future || undefined}
                      onPointerOver={(e) => e.pointerType === 'mouse' && place(s.i)}
                      onClick={(e) => { setCurrent(s.i); place(s.i); e.currentTarget.focus({ preventScroll: true }); }}
                      onFocus={() => { setCurrent(s.i); place(s.i); }}
                      style={{ gridColumn: s.w + 1, gridRow: r + 1, background: x.l < 0 ? 'transparent' : LV[x.l],
                        boxShadow: isToday ? '0 0 0 2px var(--surface), 0 0 0 3.5px var(--text-strong)' : x.l < 0 ? 'inset 0 0 0 1px var(--border)' : 'inset 0 0 0 1px color-mix(in oklab, var(--text) 6%, transparent)',
                        opacity: !shown && !reduce ? 0 : dim ? 0.18 : 1,
                        animation: shown && !reduce && waveKey ? `ga-pop 560ms ${SPRING} ${x.delay}ms backwards` : 'none' }}
                      className={`size-[var(--c)] outline-none transition-[opacity,transform] duration-200 focus-visible:z-[1] focus-visible:scale-[1.2] focus-visible:!shadow-[0_0_0_2px_var(--surface),0_0_0_4px_var(--focus-ring)] motion-reduce:!transform-none ${radius} ${x.l < 0 ? 'cursor-default' : 'cursor-pointer hover:relative hover:z-[1] hover:scale-[1.3]'} ${hot ? 'relative z-[1] scale-[1.3]' : ''}`} />
                  );
                })}
              </div>
            ))}
          </div>
          {!narrow && (
            <div ref={tipRef} aria-hidden="true" style={{ transform: `translate3d(${tip?.x || 0}px, ${(tip?.y || 0) + (tip ? 0 : 4)}px, 0) scale(${tip ? 1 : 0.96})`, transition: tip?.snap || reduce ? 'opacity 140ms' : 'opacity 140ms, transform 300ms cubic-bezier(.25,1.25,.4,1)' }}
              className={`pointer-events-none absolute left-0 top-0 z-[3] grid min-w-44 origin-bottom gap-0.5 whitespace-nowrap rounded-xl bg-[var(--text-strong)] px-3 py-2.5 text-[var(--surface)] ${tip ? 'opacity-100' : 'opacity-0'}`}>
              <strong className="text-[15px] font-semibold leading-5 tabular-nums">{info?.[0]}</strong>
              <span className="text-[13px] leading-[18px] opacity-80">{info?.[1]}</span>
              {info?.[2] && <em className="font-mono text-xs not-italic leading-4 opacity-70">{info[2]}</em>}
            </div>
          )}
        </div>
      </div>
      <p id="ga-aide" className="sr-only">Flèches pour changer de jour ou de semaine, Début et Fin pour la semaine.</p>

      <div className="flex min-h-11 flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
        {narrow && (
          <div aria-live="polite" className="grid grid-cols-[44px_1fr_44px] items-center gap-2 rounded-xl bg-[var(--raised)] p-2">
            <button type="button" aria-label="Jour précédent" onClick={() => go(current - 1, true)} className="grid size-11 place-items-center rounded-lg bg-[var(--surface)] text-[var(--text-strong)]"><svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 fill-none stroke-current stroke-[1.75]" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3 5 8l5 5" /></svg></button>
            <p className="m-0 grid gap-0.5 text-center">
              <strong className="text-base font-semibold leading-[22px] text-[var(--text-strong)] tabular-nums">{tip && sel ? sel[0] + (sel[2] ? ` · ${sel[2]}` : '') : 'Touchez une case'}</strong>
              <span className="text-sm leading-5 text-[var(--text-muted)]">{tip && sel ? sel[1] : 'pour voir la sortie du jour'}</span>
            </p>
            <button type="button" aria-label="Jour suivant" onClick={() => go(current + 1, true)} className="grid size-11 place-items-center rounded-lg bg-[var(--surface)] text-[var(--text-strong)]"><svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 fill-none stroke-current stroke-[1.75]" strokeLinecap="round" strokeLinejoin="round"><path d="m6 3 5 5-5 5" /></svg></button>
          </div>
        )}
        {legend && (
          <div className="mx-auto inline-flex items-center gap-1 text-[13px] leading-5 text-[var(--text-muted)] sm:ml-auto sm:mr-0">
            <span className="mx-1">Repos</span>
            {LV.map((bg, l) => (
              <button key={l} type="button" aria-pressed={filter === l} aria-label={`Afficher ${LEGEND[l]}`} style={{ background: bg }}
                onClick={() => setFilter((f) => (f === l ? null : l))}
                onPointerEnter={(e) => e.pointerType === 'mouse' && setPeek(l)} onPointerLeave={() => setPeek(null)}
                className={`relative size-5 p-0 transition-transform after:absolute after:-inset-x-0.5 after:-inset-y-3 hover:scale-125 sm:size-[var(--c)] ${radius} ${filter === l ? 'scale-125 shadow-[0_0_0_2px_var(--surface),0_0_0_3.5px_var(--text-strong)]' : 'shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--text)_6%,transparent)]'}`} />
            ))}
            <span className="mx-1">16&nbsp;km&nbsp;+</span>
          </div>
        )}
      </div>
      <style>{'@keyframes ga-pop{from{opacity:0;transform:scale(.25)}30%{opacity:1}to{opacity:1;transform:scale(1)}}'}</style>
    </section>
  );
}
