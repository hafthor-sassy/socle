// Tableau à sparklines — React + Tailwind CSS + framer-motion. Couleurs : variables de tokens.css (clair et sombre).
// <SparklineTable rows={rows} onReorder={(ids) => save(ids)} />
// rows : [{ id, nom, lieu, region, mw, statut: 'ok' | 'maint' | 'bride', dispo, serie: [valeur par jour, du plus ancien au plus récent] }]
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Reorder, animate, motion, useDragControls, useReducedMotion } from 'framer-motion';

const nf0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const df = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const STATUS = { maint: ['Maintenance', 'bg-[var(--tint-amber-bg)] text-[var(--tint-amber-fg)]'], bride: ['Bridé', 'bg-[var(--tint-blue-bg)] text-[var(--tint-blue-fg)]'] };
const fold = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/* ——— Données d'exemple : 12 parcs éoliens, 180 jours ——— */
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const SITES = [
  ['plouarzel', 'Plouarzel', 'Finistère', 'Bretagne', 24, 'ok', 98.1, 0.31], ['tregor', 'Lannion-Trégor', 'Côtes-d’Armor', 'Bretagne', 36, 'ok', 96.4, 0.29],
  ['mene', 'Le Mené', 'Côtes-d’Armor', 'Bretagne', 18, 'maint', 71.2, 0.27], ['corbieres', 'Corbières', 'Aude', 'Occitanie', 42, 'ok', 97.3, 0.33],
  ['aumelas', 'Causse d’Aumelas', 'Hérault', 'Occitanie', 30, 'bride', 88.6, 0.28], ['montagne-noire', 'Montagne Noire', 'Tarn', 'Occitanie', 27, 'ok', 95.0, 0.26],
  ['fruges', 'Fruges', 'Pas-de-Calais', 'Hauts-de-France', 54, 'ok', 97.8, 0.3], ['santerre', 'Plateau du Santerre', 'Somme', 'Hauts-de-France', 48, 'ok', 94.2, 0.28],
  ['vimeu', 'Vimeu', 'Somme', 'Hauts-de-France', 33, 'ok', 96.9, 0.29], ['mont-arbre', 'Mont de l’Arbre', 'Marne', 'Grand Est', 39, 'ok', 93.5, 0.25],
  ['meuse', 'Côtes de Meuse', 'Meuse', 'Grand Est', 45, 'ok', 96.1, 0.24], ['lorrain', 'Plateau lorrain', 'Moselle', 'Grand Est', 16, 'bride', 89.4, 0.22],
];
export function sampleRows(days = 180) {
  const fronts = {};
  ['Bretagne', 'Occitanie', 'Hauts-de-France', 'Grand Est'].forEach((r, ri) => {
    const R = rng(97 + ri * 31); let w = 0.9; fronts[r] = [];
    for (let d = 0; d < days; d++) { w += (R() - 0.5) * 0.36 + (1 - w) * 0.18; fronts[r].push(Math.max(0.15, w)); }
  });
  return SITES.map(([id, nom, lieu, region, mw, statut, dispo, cf], i) => {
    const R = rng(11 + i * 7), trend = (R() - 0.5) * 0.7, serie = [];
    for (let d = 0; d < days; d++) {
      const season = 1 + 0.3 * (d / days - 0.5) + 0.08 * Math.sin(d / 9) + trend * (d / days - 0.5);
      let v = mw * 24 * cf * fronts[region][d] * season * (0.82 + R() * 0.36);
      if (statut === 'maint' && d > days - 12) v *= 0.35;
      serie.push(Math.round(v));
    }
    return { id, nom, lieu, region, mw, statut, dispo, serie };
  });
}

/* Ressort amorti → courbe CSS linear(), pour les rouleaux de chiffres. */
function springCss(k, c) {
  let x = 0, v = 0, t = 0; const dt = 1 / 120, pts = [0];
  while (t < 3) { v += (-k * (x - 1) - c * v) * dt; x += v * dt; t += dt; pts.push(x); if (Math.abs(1 - x) < 0.0008 && Math.abs(v) < 0.004) break; }
  const step = Math.max(1, Math.round(pts.length / 48)), out = [];
  for (let i = 0; i < pts.length; i += step) out.push(+pts[i].toFixed(4));
  return { ease: `linear(${[...out, 1].join(', ')})`, ms: Math.round(t * 1000) };
}

function useWidth() {
  const ref = useRef(null); const [w, setW] = useState(160);
  useEffect(() => { const el = ref.current; if (!el) return; const ro = new ResizeObserver(([e]) => setW(Math.max(40, Math.round(e.contentRect.width)))); ro.observe(el); return () => ro.disconnect(); }, []);
  return [ref, w];
}

function paths(vals, w, h, pad = 3) {
  const min = Math.min(...vals), max = Math.max(...vals), rg = max - min || 1, n = vals.length;
  const pts = vals.map((v, i) => [(i / (n - 1)) * w, pad + (1 - (v - min) / rg) * (h - pad * 2)]);
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 1; i < n; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], mx = (x0 + x1) / 2; d += `C${mx.toFixed(2)} ${y0.toFixed(2)} ${mx.toFixed(2)} ${y1.toFixed(2)} ${x1.toFixed(2)} ${y1.toFixed(2)}`; }
  return { line: d, area: `${d}L${w} ${h}L0 ${h}Z`, pts, max };
}

function Sparkline({ values, curve, up, color, height = 32, endDate }) {
  const [ref, w] = useWidth(); const [hover, setHover] = useState(null); const reduce = useReducedMotion();
  const p = useMemo(() => paths(values, w, height), [values, w, height]);
  const stroke = color === 'trend' ? (up ? 'var(--up)' : 'var(--down)') : color === 'neutral' ? 'var(--text-muted)' : 'var(--accent)';
  const i = hover ?? values.length - 1, pt = p.pts[i];
  const day = (back) => { const t = new Date(endDate); t.setDate(t.getDate() - back); return t; };
  const label = `Tendance ${up ? 'en hausse' : 'en baisse'} : de ${nf0.format(values[0])} à ${nf0.format(values[values.length - 1])} MWh par jour, pic de ${nf0.format(p.max)} MWh`;
  const onMove = (e) => { if (e.pointerType !== 'mouse') return; const r = e.currentTarget.getBoundingClientRect(); setHover(Math.max(0, Math.min(values.length - 1, Math.round(((e.clientX - r.left) / r.width) * (values.length - 1))))); };
  return (
    <span ref={ref} className="relative block cursor-crosshair" style={{ height }} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
      <svg role="img" aria-label={label} viewBox={`0 0 ${w} ${height}`} className="absolute inset-0 block h-full w-full overflow-visible">
        {curve === 'area' && <path d={p.area} fill={stroke} fillOpacity={0.12} />}
        {curve === 'bars'
          ? values.map((v, k) => { const bw = w / values.length, bh = Math.max(1.5, (v / (p.max || 1)) * (height - 2)); return <rect key={k} x={k * bw + bw * 0.18} y={height - bh} width={Math.max(0.8, bw * 0.64)} height={bh} rx={Math.min(1.5, bw * 0.3)} fill={stroke} fillOpacity={k === values.length - 1 ? 1 : 0.5} />; })
          : <path key={`${values.length}-${curve}`} d={p.line} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={reduce ? 0 : 1} style={reduce ? undefined : { animation: 'spt-draw 900ms cubic-bezier(.2,0,0,1) forwards' }} />}
      </svg>
      {hover != null && <span className="pointer-events-none absolute -bottom-1 -top-1 w-px bg-[var(--border-strong)] opacity-60" style={{ left: `${(pt[0] / w) * 100}%` }} />}
      {curve !== 'bars' && <span className="pointer-events-none absolute h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_2px_var(--surface)]" style={{ left: `${(pt[0] / w) * 100}%`, top: `${(pt[1] / height) * 100}%`, background: stroke }} />}
      {hover != null && <span aria-hidden className="pointer-events-none absolute bottom-full z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--text-strong)] px-2 py-1 text-xs font-medium text-[var(--surface)]" style={{ left: `${(pt[0] / w) * 100}%` }}>{df.format(day(values.length - 1 - hover))} · <b className="font-semibold">{nf0.format(values[hover])} MWh</b></span>}
    </span>
  );
}

/* Compteur à rouleaux : chaque chiffre glisse sur le ressort, de droite à gauche. */
function Odometer({ text, unit, spring }) {
  const chars = [...text];
  return (
    <span role="text" aria-label={`${text}${unit ? ` ${unit}` : ''}`} className="inline-flex h-5 items-center justify-end overflow-hidden whitespace-nowrap text-sm font-semibold leading-5 text-[var(--text-strong)] tabular-nums">
      {chars.map((c, i) => /\d/.test(c)
        ? <span key={`${chars.length}-${i}`} aria-hidden className="inline-block h-5 w-[1ch] overflow-hidden"><span className="flex flex-col" style={{ transform: `translateY(${-20 * +c}px)`, transition: `transform ${spring.ms}ms ${spring.ease} ${(chars.length - i) * 18}ms` }}>{'0123456789'.split('').map((n) => <span key={n} className="block h-5 text-center">{n}</span>)}</span></span>
        : <span key={`${chars.length}-${i}`} aria-hidden>{c}</span>)}
      {unit && <span aria-hidden className="ml-[3px] text-xs font-normal text-[var(--text-muted)]">{unit}</span>}
    </span>
  );
}

function TotalSpark({ values, stiffness, damping }) {
  const [ref, w] = useWidth(); const reduce = useReducedMotion();
  const norm = (a) => { const mn = Math.min(...a), mx = Math.max(...a); return a.map((v) => (v - mn) / (mx - mn || 1)); };
  const [shown, setShown] = useState(() => norm(values)); const cur = useRef(shown);
  useEffect(() => {
    const to = norm(values), from = cur.current.length === to.length ? cur.current : to;
    if (reduce || from === to) { cur.current = to; setShown(to); return; }
    const ctl = animate(0, 1, { type: 'spring', stiffness, damping, onUpdate: (x) => { const v = from.map((f, i) => f + (to[i] - f) * x); cur.current = v; setShown(v); } });
    return () => ctl.stop();
  }, [values.join(','), stiffness, damping, reduce]);
  const p = paths(shown, w, 36);
  return <span ref={ref} className="relative block h-9 md:h-9"><svg aria-hidden viewBox={`0 0 ${w} 36`} className="absolute inset-0 h-full w-full"><path d={p.area} fill="var(--text-strong)" fillOpacity={0.08} /><path d={p.line} fill="none" stroke="var(--text-strong)" strokeWidth={1.5} strokeLinejoin="round" /></svg></span>;
}

const GRIP = <svg viewBox="0 0 16 16" className="h-4 w-4 fill-current" aria-hidden>{[[5.5, 3.5], [10.5, 3.5], [5.5, 8], [10.5, 8], [5.5, 12.5], [10.5, 12.5]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={1.25} />)}</svg>;
const ARROW = <svg viewBox="0 0 12 12" className="h-3 w-3 fill-none stroke-current" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 9.5v-7M3 5.5l3-3 3 3" /></svg>;
const GRID = 'md:grid-cols-[40px_minmax(180px,1.5fr)_104px_128px_minmax(150px,1.4fr)_112px_132px] md:[grid-template-areas:none]';
const MOBILE = 'grid-cols-[44px_1fr_auto] [grid-template-areas:"h_n_v"_"s_s_s"_"m_p_d"] gap-y-2';
const cellNum = 'md:text-right md:px-3';
const lab = 'block text-xs text-[var(--text-muted)] md:hidden';

function Row({ d, s, period, curve, color, rowH, reorderable, spring, onGrabStart, grabbed, onKey, endDate }) {
  const controls = useDragControls(); const stt = STATUS[d.statut]; const up = s.var >= 0;
  return (
    <Reorder.Item as="div" role="row" value={d.id} dragListener={false} dragControls={controls} layout="position"
      transition={{ type: 'spring', stiffness: spring.k, damping: spring.c }} whileDrag={{ scale: 1.01, boxShadow: 'var(--shadow-popover)', zIndex: 2, borderRadius: 12 }}
      className={`relative grid ${MOBILE} ${GRID} items-center border-b border-[var(--border)] bg-[var(--surface)] py-3 pl-1 pr-4 hover:bg-[var(--state-hover)] md:gap-y-0 md:px-3 md:py-0 ${grabbed ? 'z-[2] rounded-xl shadow-[0_0_0_2px_var(--focus-ring),var(--shadow-popover)]' : ''}`}
      style={{ minHeight: rowH }}>
      <span role="cell" className="grid place-items-center self-start [grid-area:h] md:self-center md:[grid-area:auto]">
        <button type="button" aria-label={`Déplacer ${d.nom}`} aria-describedby="spt-help" onPointerDown={(e) => { if (!reorderable) return; e.preventDefault(); onGrabStart(); controls.start(e); }} onKeyDown={onKey}
          className={`grid h-11 w-11 cursor-grab touch-none place-items-center rounded-lg text-[var(--text-disabled)] hover:bg-[var(--state-press)] hover:text-[var(--text-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] active:cursor-grabbing md:h-10 md:w-8 ${reorderable ? '' : 'invisible'}`}>{GRIP}</button>
      </span>
      <span role="rowheader" className="min-w-0 pr-2 [grid-area:n] md:px-3 md:[grid-area:auto]">
        <span className="block truncate text-base font-medium text-[var(--text-strong)] md:text-sm">{d.nom}</span>
        <span className="flex items-center gap-1.5 truncate text-xs text-[var(--text-muted)]">{d.lieu}{stt && <span className={`inline-flex h-[18px] items-center gap-1 rounded-full px-1.5 text-xs font-medium ${stt[1]}`}><i className="h-1.5 w-1.5 rounded-full bg-current" />{stt[0]}</span>}</span>
      </span>
      <span role="cell" className={`pl-3 text-sm [grid-area:m] md:[grid-area:auto] ${cellNum}`}><span className={lab}>Puissance</span><span className="text-[var(--text-strong)]">{d.mw}</span><span className="ml-[3px] text-xs text-[var(--text-muted)]">MW</span></span>
      <span role="cell" className={`text-center text-sm [grid-area:p] md:[grid-area:auto] ${cellNum}`}><span className={lab}>Production</span><span className="text-[var(--text-strong)]">{nf0.format(s.prod)}</span><span className="ml-[3px] text-xs text-[var(--text-muted)]">MWh</span></span>
      <span role="cell" className="py-1 pl-3 [grid-area:s] md:px-3 md:py-0 md:[grid-area:auto]"><span className="block h-11 md:h-8"><Sparkline values={s.cur} curve={curve} color={color} up={up} height={32} endDate={endDate} /></span></span>
      <span role="cell" className="text-right [grid-area:v] md:px-3 md:[grid-area:auto]">
        <span className={`inline-flex h-6 items-center gap-0.5 rounded-full px-2 text-xs font-medium ${up ? 'bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]' : 'bg-[var(--tint-red-bg)] text-[var(--tint-red-fg)] [&_svg]:rotate-180'}`}>{ARROW}{up ? '+' : '−'}{nf1.format(Math.abs(s.var))} %<span className="sr-only"> par rapport aux {period} jours précédents</span></span>
      </span>
      <span role="cell" className="text-right text-sm [grid-area:d] md:px-3 md:[grid-area:auto]"><span className={lab}>Disponibilité</span>
        <span className="inline-flex items-center justify-end gap-2"><span className="text-[var(--text-strong)]">{nf1.format(d.dispo)} %</span><span aria-hidden className="h-1 w-10 overflow-hidden rounded-full bg-[var(--scale-track)]"><i className={`block h-full origin-left rounded-full ${d.dispo < 85 ? 'bg-[var(--warn)]' : 'bg-[var(--text-muted)]'}`} style={{ transform: `scaleX(${d.dispo / 100})` }} /></span></span>
      </span>
    </Reorder.Item>
  );
}

function Th({ k, children, ariaSort, sortBy }) {
  return (
  <span role="columnheader" aria-sort={ariaSort(k)} className="px-3 text-right first:text-left">
    <button type="button" onClick={() => sortBy(k)} className={`-mx-1.5 inline-flex h-8 items-center gap-1 rounded-md px-1.5 text-xs font-medium hover:bg-[var(--state-hover)] hover:text-[var(--text-strong)] ${ariaSort(k) !== 'none' ? 'text-[var(--text-strong)]' : 'text-[var(--text-muted)]'}`}>
      {children}<svg viewBox="0 0 12 12" aria-hidden className={`h-3 w-3 fill-none stroke-current transition ${ariaSort(k) === 'none' ? 'opacity-0' : ''} ${ariaSort(k) === 'ascending' ? 'rotate-180' : ''}`} strokeWidth={1.5} strokeLinecap="round"><path d="M6 2.5v7M3 6.5l3 3 3-3" /></svg>
    </button>
  </span>
  );
}

export default function SparklineTable({
  rows: rowsProp, title = 'Parcs en exploitation', eyebrow = 'Éolis · Exploitation', period = 30, curve = 'area', color = 'accent', density = 'comfortable',
  reorderable = true, showTotals = true, stiffness = 260, damping = 24, status = 'ready', endDate = '2026-11-04', onReorder, onRetry,
}) {
  const data = useMemo(() => rowsProp || sampleRows(), [rowsProp]);
  const [order, setOrder] = useState(() => data.map((d) => d.id));
  const [region, setRegion] = useState('all'); const [q, setQ] = useState(''); const [sort, setSort] = useState(null);
  const [grab, setGrab] = useState(null); const [live, setLive] = useState('');
  const reduce = useReducedMotion();
  useEffect(() => setOrder(data.map((d) => d.id)), [data]);
  const spring = useMemo(() => ({ ...(reduce ? { ease: 'linear', ms: 1 } : springCss(stiffness, damping)), k: stiffness, c: reduce ? 1000 : damping }), [stiffness, damping, reduce]);
  const stats = useCallback((d) => {
    const cur = d.serie.slice(-period), prev = d.serie.slice(-2 * period, -period), sum = cur.reduce((a, b) => a + b, 0), ps = prev.reduce((a, b) => a + b, 0);
    return { cur, prod: sum, var: ps ? ((sum - ps) / ps) * 100 : 0 };
  }, [period]);
  const regions = useMemo(() => ['all', ...new Set(data.map((d) => d.region))], [data]);
  const visible = useMemo(() => {
    const f = fold(q.trim());
    let list = data.filter((d) => (region === 'all' || d.region === region) && (!f || fold(`${d.nom} ${d.lieu} ${d.region}`).includes(f)));
    if (sort) { const [k, dir] = sort; const m = dir === 'asc' ? 1 : -1; list = [...list].sort((a, b) => { const va = k === 'nom' || k === 'mw' || k === 'dispo' ? a[k] : stats(a)[k], vb = k === 'nom' || k === 'mw' || k === 'dispo' ? b[k] : stats(b)[k]; return (typeof va === 'string' ? va.localeCompare(vb, 'fr') : va - vb) * m; }); }
    else list = [...list].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    return list;
  }, [data, region, q, sort, order, stats]);
  const ids = visible.map((d) => d.id);
  const say = (t) => { setLive(''); setTimeout(() => setLive(t), 30); };

  /* Les lignes masquées gardent leur rang : on réinsère l'ordre visible à leurs places. */
  const merge = (vis) => { let i = 0; return order.map((id) => (vis.includes(id) ? vis[i++] : id)); };
  const commitSort = () => { if (sort) { setOrder(merge(ids)); setSort(null); } };
  const reorder = (vis) => { const next = merge(vis); setOrder(next); onReorder?.(next); };

  const onKey = (id, nom) => (e) => {
    if (!reorderable) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (grab) { setGrab(null); say(`${nom} posé en position ${ids.indexOf(id) + 1}`); onReorder?.(order); } else { commitSort(); setGrab({ id, order }); say(`${nom} saisi, position ${ids.indexOf(id) + 1} sur ${ids.length}. Flèches pour déplacer, Espace pour poser, Échap pour annuler.`); } return; }
    if (!grab) return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); const i = ids.indexOf(id), j = i + (e.key === 'ArrowUp' ? -1 : 1); if (j < 0 || j >= ids.length) return; const vis = [...ids]; vis.splice(i, 1); vis.splice(j, 0, id); setOrder(merge(vis)); say(`${nom}, position ${j + 1} sur ${ids.length}`); }
    if (e.key === 'Escape') { e.preventDefault(); setOrder(grab.order); setGrab(null); say('Déplacement annulé'); }
  };
  const sortBy = (k) => { const first = k === 'nom' ? 'asc' : 'desc'; setSort((s) => (!s || s[0] !== k ? [k, first] : s[1] === first ? [k, first === 'asc' ? 'desc' : 'asc'] : null)); };
  const ariaSort = (k) => (sort && sort[0] === k ? (sort[1] === 'asc' ? 'ascending' : 'descending') : 'none');

  const tot = useMemo(() => {
    let mw = 0, prod = 0, prev = 0, dw = 0; const agg = new Array(period).fill(0);
    visible.forEach((d) => { const s = stats(d); mw += d.mw; prod += s.prod; prev += s.prod / (1 + s.var / 100); dw += d.dispo * d.mw; s.cur.forEach((v, i) => { agg[i] += v; }); });
    return { mw, prod, v: prev ? ((prod - prev) / prev) * 100 : 0, dispo: mw ? dw / mw : 0, agg };
  }, [visible, stats, period]);
  const rowH = density === 'compact' ? 48 : 56;

  return (
    <section aria-labelledby="spt-title" className="relative mx-auto w-full max-w-[1120px] rounded-xl border border-[var(--border)] bg-[var(--surface)] font-[family-name:var(--font-sans)] text-[var(--text)] tabular-nums md:rounded-2xl">
      <style>{'@keyframes spt-draw{to{stroke-dashoffset:0}}'}</style>
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 px-4 pb-3 pt-5 md:px-6 md:pb-4 md:pt-6">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 100 100" aria-hidden className="h-10 w-10 flex-none"><rect width="100" height="100" rx="28" fill="var(--accent)" /><g fill="var(--accent-fg)"><path d="M47.6 44 46 84h8l-1.6-40Z" />{[0, 120, 240].map((r) => <path key={r} d="M50 41C45.5 31 46 19 50 11C54 19 54.5 31 50 41Z" transform={`rotate(${r} 50 41)`} />)}</g><circle cx="50" cy="41" r="4.5" fill="var(--accent)" /><circle cx="50" cy="41" r="2" fill="var(--accent-fg)" /></svg>
          <div><p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.04em] text-[var(--text-muted)]">{eyebrow}</p><h2 id="spt-title" className="text-xl font-semibold tracking-[-0.01em] text-[var(--text-strong)]">{title}</h2></div>
        </div>
        <p className="text-sm text-[var(--text-muted)]">Production des {period} derniers jours, au {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(endDate))}</p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-4 md:gap-4 md:px-6">
        <div role="radiogroup" aria-label="Filtrer par région" className="flex w-full gap-0 overflow-x-auto rounded-lg bg-[var(--raised)] p-1 [scrollbar-width:none] md:w-auto">
          {regions.map((r) => {
            const on = region === r, n = r === 'all' ? data.length : data.filter((d) => d.region === r).length;
            return (
              <button key={r} type="button" role="radio" aria-checked={on} tabIndex={on ? 0 : -1} onClick={() => setRegion(r)}
                onKeyDown={(e) => { const i = regions.indexOf(region); const j = e.key === 'ArrowRight' ? (i + 1) % regions.length : e.key === 'ArrowLeft' ? (i - 1 + regions.length) % regions.length : -1; if (j >= 0) { e.preventDefault(); setRegion(regions[j]); e.currentTarget.parentNode.children[j].focus(); } }}
                className={`relative h-9 flex-none whitespace-nowrap rounded-md px-3 text-sm font-medium md:h-8 ${on ? 'text-[var(--text-strong)]' : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'}`}>
                {on && <motion.span layoutId="spt-pill" aria-hidden transition={{ type: 'spring', stiffness: spring.k, damping: spring.c }} className="absolute inset-0 rounded-md bg-[var(--surface)] shadow-[var(--shadow-overlay)]" />}
                <span className="relative">{r === 'all' ? 'Toutes' : r}<small className="ml-1.5 font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)]">{n}</small></span>
              </button>
            );
          })}
        </div>
        <div className="flex w-full items-center gap-2 md:w-auto">
          <label className="relative block flex-1">
            <span className="sr-only">Rechercher un parc</span>
            <svg viewBox="0 0 24 24" aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 fill-none stroke-[var(--text-muted)]" strokeWidth={1.5} strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un parc" className="h-11 w-full rounded-lg border border-[var(--border-control)] bg-[var(--surface)] pl-[34px] pr-3 text-base text-[var(--text-strong)] placeholder:text-[var(--text-muted)] md:h-9 md:w-[220px] md:text-sm" />
          </label>
          <label className="md:hidden"><span className="sr-only">Trier par</span>
            <select value={sort ? sort.join(':') : 'manual'} onChange={(e) => setSort(e.target.value === 'manual' ? null : e.target.value.split(':'))} className="h-11 rounded-lg border border-[var(--border-control)] bg-[var(--surface)] px-3 text-base font-medium text-[var(--text-strong)]">
              <option value="manual">Ordre manuel</option><option value="prod:desc">Production ↓</option><option value="var:desc">Variation ↓</option><option value="dispo:asc">Disponibilité ↑</option><option value="nom:asc">Nom A → Z</option>
            </select>
          </label>
        </div>
      </div>

      <div role="table" aria-labelledby="spt-title" aria-describedby="spt-help" className="relative border-t border-[var(--border)]">
        <div role="row" className={`hidden min-h-10 items-center border-b border-[var(--border)] bg-[var(--raised)] px-3 md:grid ${GRID}`}>
          <span role="columnheader"><span className="sr-only">Réordonner</span></span>
          <span role="columnheader" aria-sort={ariaSort('nom')} className="px-3"><button type="button" onClick={() => sortBy('nom')} className="-mx-1.5 h-8 rounded-md px-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-strong)]">Parc</button></span>
          <Th k="mw" ariaSort={ariaSort} sortBy={sortBy}>Puissance</Th><Th k="prod" ariaSort={ariaSort} sortBy={sortBy}>Production</Th>
          <span role="columnheader" className="px-3 text-xs font-medium text-[var(--text-muted)]">Tendance</span>
          <Th k="var" ariaSort={ariaSort} sortBy={sortBy}>Variation</Th><Th k="dispo" ariaSort={ariaSort} sortBy={sortBy}>Disponibilité</Th>
        </div>

        {status === 'ready' && visible.length > 0 && (
          <Reorder.Group as="div" role="rowgroup" axis="y" values={ids} onReorder={reorder}>
            {visible.map((d) => <Row key={d.id} d={d} s={stats(d)} period={period} curve={curve} color={color} rowH={rowH} reorderable={reorderable} spring={spring} endDate={endDate}
              grabbed={grab?.id === d.id} onGrabStart={commitSort} onKey={onKey(d.id, d.nom)} />)}
          </Reorder.Group>
        )}
        {status === 'loading' && <div role="rowgroup" aria-hidden>{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className={`grid ${GRID} items-center gap-3 border-b border-[var(--border)] px-4 py-4 md:px-3`}><span /><span className="h-2.5 animate-pulse rounded-full bg-[var(--raised)]" style={{ width: `${52 + ((i * 17) % 36)}%` }} /><span className="hidden h-2.5 animate-pulse rounded-full bg-[var(--raised)] md:block" /><span className="hidden h-2.5 animate-pulse rounded-full bg-[var(--raised)] md:block" /><span className="h-5 animate-pulse rounded-md bg-[var(--raised)]" /><span className="hidden h-5 animate-pulse rounded-full bg-[var(--raised)] md:block" /><span className="hidden h-2.5 animate-pulse rounded-full bg-[var(--raised)] md:block" /></div>)}</div>}
        {(status === 'empty' || (status === 'ready' && !visible.length)) && (
          <div className="grid justify-items-center gap-1 border-b border-[var(--border)] px-6 py-12 text-center">
            <p className="font-semibold text-[var(--text-strong)]">{status === 'empty' ? 'Aucun parc pour l’instant' : q ? `Aucun parc ne correspond à « ${q.trim()} »` : 'Aucun parc dans cette région'}</p>
            <p className="mb-3 text-sm text-[var(--text-muted)]">Essayez une autre région ou un autre nom.</p>
            {status === 'ready' && <button type="button" onClick={() => { setQ(''); setRegion('all'); }} className="h-11 rounded-lg border border-[var(--border-control)] px-4 text-sm font-medium text-[var(--text-strong)] hover:bg-[var(--state-hover)] md:h-9">Effacer les filtres</button>}
          </div>
        )}
        {status === 'error' && (
          <div role="alert" className="grid justify-items-center gap-1 border-b border-[var(--border)] px-6 py-12 text-center">
            <p className="font-semibold text-[var(--text-strong)]">Les relevés n’ont pas pu être chargés</p>
            <p className="mb-3 text-sm text-[var(--text-muted)]">La télémétrie des parcs ne répond pas. Vos données sont intactes.</p>
            <button type="button" onClick={onRetry} className="h-11 rounded-lg border border-[var(--border-control)] px-4 text-sm font-medium text-[var(--text-strong)] hover:bg-[var(--state-hover)] md:h-9">Réessayer</button>
          </div>
        )}
        {showTotals && status === 'ready' && visible.length > 0 && (
          <div role="row" className={`grid grid-cols-[1fr_1fr_auto] [grid-template-areas:"n_n_v"_"s_s_s"_"m_p_d"] gap-y-2 bg-[var(--raised)] px-4 py-3 ${GRID} md:min-h-16 md:items-center md:gap-y-0 md:px-3 md:py-0`}>
            <span role="cell" className="hidden md:block" />
            <span role="rowheader" className="[grid-area:n] md:px-3 md:[grid-area:auto]"><span className="block font-medium text-[var(--text-strong)]">Total</span><span className="text-xs text-[var(--text-muted)]">{visible.length} parc{visible.length > 1 ? 's' : ''}</span></span>
            <span role="cell" className="[grid-area:m] md:px-3 md:text-right md:[grid-area:auto]"><span className={lab}>Puissance</span><Odometer text={nf0.format(tot.mw)} unit="MW" spring={spring} /></span>
            <span role="cell" className="text-center [grid-area:p] md:px-3 md:text-right md:[grid-area:auto]"><span className={lab}>Production</span><Odometer text={nf0.format(Math.round(tot.prod))} unit="MWh" spring={spring} /></span>
            <span role="cell" className="[grid-area:s] md:px-3 md:[grid-area:auto]"><TotalSpark values={tot.agg} stiffness={stiffness} damping={damping} /></span>
            <span role="cell" className="text-right [grid-area:v] md:px-3 md:[grid-area:auto]"><span className={lab}>Variation</span><Odometer text={`${tot.v >= 0 ? '+' : '−'}${nf1.format(Math.abs(tot.v))}`} unit="%" spring={spring} /></span>
            <span role="cell" className="text-right [grid-area:d] md:px-3 md:[grid-area:auto]"><span className={lab}>Disponibilité</span><Odometer text={nf1.format(tot.dispo)} unit="%" spring={spring} /></span>
          </div>
        )}
      </div>
      {reorderable && <p id="spt-help" className="px-4 pb-4 pt-3 text-xs text-[var(--text-muted)] md:px-6">Poignée : glisser pour réordonner, ou Espace puis ↑ ↓ et Espace pour poser.</p>}
      <p className="sr-only" aria-live="polite">{live}</p>
    </section>
  );
}

