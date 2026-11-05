// Graphique à brossage — React + Tailwind CSS. Couleurs : variables de tokens.css. Aucune dépendance de graphe.
// <BrushChart data={rows} notes={notes} onBrushChange={({ from, to, days, totals }) => …} />
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

/**
 * @typedef {{ date: string, calls: number, transfers: number, duration: number }} Row  duration en secondes
 * @typedef {{ date: string, label: string }} Note
 * @typedef {Object} BrushChartProps
 * @property {string} [title]
 * @property {string} [eyebrow]
 * @property {'7'|'30'|'90'|'all'} [defaultRange]
 * @property {number} [days]                 jours des données d'exemple si `data` est absent
 * @property {Row[]} [data]
 * @property {Note[]} [notes]
 * @property {'chart-1'|'accent'|'chart-3'|'chart-4'|'chart-5'} [color]
 * @property {'area'|'line'} [variant]
 * @property {boolean} [smooth]
 * @property {boolean} [showTransfers]
 * @property {boolean} [annotations]
 * @property {number} [duration]             ms de la transition de zoom
 * @property {'ready'|'loading'|'empty'|'error'} [status]
 * @property {(e: { from: Date, to: Date, days: number, totals: object }) => void} [onBrushChange]
 * @property {() => void} [onRetry]
 */

const DAY = 864e5;
const M = { t: 32, r: 8, b: 28, l: 44 };
const COLORS = { 'chart-1': 'var(--chart-1)', accent: 'var(--accent-vivid)', 'chart-3': 'var(--chart-3)', 'chart-4': 'var(--chart-4)', 'chart-5': 'var(--chart-5)' };
const RANGES = [['7', '7 j'], ['30', '30 j'], ['90', '90 j'], ['all', 'Tout']];
const nf = new Intl.NumberFormat('fr-FR');
const pf = new Intl.NumberFormat('fr-FR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
const f1 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fdate = (t, o) => new Intl.DateTimeFormat('fr-FR', { ...o, timeZone: 'UTC' }).format(new Date(t));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const mmss = (s) => ({ m: Math.floor(Math.round(s) / 60), s: Math.round(s) % 60 });
const pad2 = (n) => String(n).padStart(2, '0');
const sign = (v, s) => (v > 0 ? '+' : v < 0 ? '−' : '±') + s;

/* Données d'exemple : appels traités par jour, déterministes */
export function demoData(count = 180) {
  let seed = 42;
  const r = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const end = Date.UTC(2026, 10, 4), camp = Date.UTC(2026, 7, 25), voice = Date.UTC(2026, 9, 1);
  const week = [0.46, 1.14, 1.06, 1.0, 1.03, 0.94, 0.6];
  const rows = [];
  for (let i = count - 1; i >= 0; i--) {
    const t = end - i * DAY, d = new Date(t), age = i;
    const trend = 760 - age * 1.55 - Math.pow(Math.max(0, age - 120) / 60, 2) * 30;
    const m = d.getUTCMonth(), day = d.getUTCDate();
    const summer = m === 7 && day < 23 ? 0.78 : m === 6 && day > 14 ? 0.9 : 1;
    const k = (t - camp) / DAY, boost = k >= 0 ? 0.42 * Math.exp(-k / 6) : 0;
    const calls = Math.max(12, Math.round(trend * week[d.getUTCDay()] * summer * (1 + boost) * (0.93 + r() * 0.14)));
    const rate = (t < voice ? 0.142 - (180 - age) * 0.00018 : 0.071 - Math.min(34, (t - voice) / DAY) * 0.0003) * (0.86 + r() * 0.28);
    const duration = (t < voice ? 166 - (180 - age) * 0.06 : 142) * (0.95 + r() * 0.1);
    rows.push({ date: new Date(t).toISOString().slice(0, 10), calls, transfers: Math.round(calls * rate), duration });
  }
  return { rows, notes: [{ date: '2026-08-25', label: 'Campagne de rentrée' }, { date: '2026-10-01', label: 'Agent « Clara » v2' }] };
}

/* Courbe monotone : jamais de dépassement entre deux jours */
function pathOf(p, smooth) {
  const n = p.length;
  if (!n) return '';
  const f = (v) => v.toFixed(1);
  let d = `M${f(p[0][0])},${f(p[0][1])}`;
  if (n < 3 || !smooth) { for (let j = 1; j < n; j++) d += `L${f(p[j][0])},${f(p[j][1])}`; return d; }
  const m = [], t = [];
  for (let i = 0; i < n - 1; i++) m[i] = (p[i + 1][1] - p[i][1]) / (p[i + 1][0] - p[i][0] || 1);
  t[0] = m[0]; t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) {
    const h0 = p[i][0] - p[i - 1][0], h1 = p[i + 1][0] - p[i][0];
    t[i] = m[i - 1] * m[i] <= 0 ? 0 : (3 * (h0 + h1)) / ((2 * h1 + h0) / m[i - 1] + (h1 + 2 * h0) / m[i]);
  }
  for (let i = 0; i < n - 1; i++) {
    const h = (p[i + 1][0] - p[i][0]) / 3;
    d += `C${f(p[i][0] + h)},${f(p[i][1] + t[i] * h)},${f(p[i + 1][0] - h)},${f(p[i + 1][1] - t[i + 1] * h)},${f(p[i + 1][0])},${f(p[i + 1][1])}`;
  }
  return d;
}
function nice(max) {
  const mag = Math.pow(10, Math.floor(Math.log10(max / 5 || 1)));
  for (const c of [1, 2, 2.5, 5, 10, 20]) { const s = c * mag; if (Math.ceil(max / s) <= 5) return { step: s, max: Math.ceil(max / s) * s }; }
  return { step: 20 * mag, max: Math.ceil(max / (20 * mag)) * 20 * mag };
}
function sum(rows, s, e) {
  let c = 0, tr = 0, du = 0;
  for (let i = s; i <= e; i++) { c += rows[i].calls; tr += rows[i].transfers; du += rows[i].duration * rows[i].calls; }
  return { calls: c, transfers: tr, resolved: c ? 1 - tr / c : 0, duration: c ? du / c : 0 };
}
function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => { const q = matchMedia('(prefers-reduced-motion: reduce)'); setR(q.matches); const f = () => setR(q.matches); q.addEventListener('change', f); return () => q.removeEventListener('change', f); }, []);
  return r;
}
function useSize() {
  const ref = useRef(null);
  const [s, setS] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setS({ w: e.contentRect.width, h: e.contentRect.height }));
    ref.current && ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, s];
}

/* Chiffres qui roulent : une bande 0–9 par chiffre, alignée depuis la droite */
function Rolling({ text, unit, label }) {
  const chars = text.split('');
  const nd = chars.filter((c) => /\d/.test(c)).length;
  let di = 0;
  return (
    <span className="relative inline-flex items-baseline whitespace-nowrap text-[length:var(--t-kpi)] font-semibold leading-[1.2] tracking-[-0.02em] text-[var(--text-strong)] tabular-nums">
      <span aria-hidden="true" className="inline-flex">
        {chars.map((c, i) => {
          if (!/\d/.test(c)) return <span key={`c${i}`} className="whitespace-pre">{c}</span>;
          const pos = nd - 1 - di++;
          return (
            <span key={`d${pos}`} className="inline-block h-[1.2em] overflow-hidden align-top [mask-image:linear-gradient(transparent,#000_12%,#000_88%,transparent)]">
              <span className="flex flex-col transition-transform duration-[760ms] ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none" style={{ transform: `translateY(${-c * 1.2}em)`, transitionDelay: `${pos * 28}ms` }}>
                {'0123456789'.split('').map((n) => <span key={n} className="block h-[1.2em] text-center leading-[1.2em]">{n}</span>)}
              </span>
            </span>
          );
        })}
      </span>
      {unit && <small aria-hidden="true" className="ml-[.12em] text-[.6em] font-medium tracking-normal text-[var(--text-muted)]">{unit}</small>}
      <span className="sr-only">{label}</span>
    </span>
  );
}
function Delta({ diff, text, goodWhenUp, label }) {
  const dir = Math.abs(diff) < 1e-9 ? 'flat' : diff > 0 ? 'up' : 'down';
  const tone = dir === 'flat' ? 'bg-[var(--tint-neutral-bg)] text-[var(--tint-neutral-fg)]' : (dir === 'up') === goodWhenUp ? 'bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]' : 'bg-[var(--tint-red-bg)] text-[var(--tint-red-fg)]';
  return (
    <span className={`inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2 text-xs font-medium tabular-nums transition-colors duration-[260ms] ${tone}`}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-[rotate] duration-[260ms] ease-[cubic-bezier(.34,1.36,.64,1)]" style={{ rotate: dir === 'down' ? '180deg' : dir === 'flat' ? '90deg' : '0deg' }}><path d="M12 19V5M6 11l6-6 6 6" /></svg>
      <span>{text}</span><span className="sr-only"> {label}</span>
    </span>
  );
}

/** @param {BrushChartProps} props */
export function BrushChart({
  title = 'Appels traités par vos agents',
  eyebrow = 'Ondine · Standard vocal IA',
  defaultRange = '30',
  days = 180,
  data,
  notes: notesProp,
  color = 'chart-1',
  variant = 'area',
  smooth = true,
  showTransfers = true,
  annotations = true,
  duration = 700,
  status = 'ready',
  onBrushChange,
  onRetry,
}) {
  const reduce = useReducedMotion();
  const src = useMemo(() => (data ? { rows: data, notes: notesProp || [] } : demoData(days)), [data, notesProp, days]);
  const rows = useMemo(() => src.rows.map((r) => ({ ...r, t: Date.parse(`${r.date}T00:00:00Z`) })), [src]);
  const notes = useMemo(() => src.notes.map((o) => ({ ...o, i: (Date.parse(`${o.date}T00:00:00Z`) - (rows[0]?.t ?? 0)) / DAY })).filter((o) => o.i >= 0 && o.i <= rows.length - 1), [src, rows]);
  const n = rows.length;
  const gmax = useMemo(() => Math.max(1, ...rows.map((r) => r.calls)), [rows]);
  const c = COLORS[color] || COLORS['chart-1'];

  const [plotRef, plot] = useSize();
  const [navRef, nav] = useSize();
  const w = Math.max(10, plot.w - M.l - M.r), h = Math.max(10, plot.h - M.t - M.b);

  /* Fenêtre cible + ressort critique (solution exacte, stable) */
  const yFor = useCallback((a, b) => { let m = 1; for (let i = Math.max(0, Math.floor(a)); i <= Math.min(n - 1, Math.ceil(b)); i++) m = Math.max(m, rows[i].calls); return nice(m * 1.08); }, [rows, n]);
  const initial = useMemo(() => { const len = defaultRange === 'all' ? n - 1 : Math.min(n, +defaultRange) - 1; const a = n - 1 - len, y = yFor(a, n - 1); return { a, b: n - 1, y: y.max, step: y.step }; }, [n, defaultRange, yFor]);
  const [target, setTarget] = useState(initial);
  const [view, setView] = useState(initial);
  const cur = useRef(initial), vel = useRef({ a: 0, b: 0, y: 0 }), omega = useRef(10), raf = useRef(0), tgt = useRef(initial);
  const [drag, setDrag] = useState(null);
  const [hover, setHover] = useState(null);
  const [live, setLive] = useState('');

  const go = useCallback((a, b, mode) => {
    if (!n) return;
    const len = Math.max(2, b - a);
    a = clamp(a, 0, Math.max(0, n - 1 - len)); b = Math.min(n - 1, a + len);
    const y = yFor(a, b), next = { a, b, y: y.max, step: y.step };
    tgt.current = next; setTarget(next);
    omega.current = mode === 'drag' ? 55 : 6.6 / Math.max(0.05, duration / 1000);
    if (reduce || mode === 'jump' || duration === 0) { cur.current = next; vel.current = { a: 0, b: 0, y: 0 }; setView(next); return; }
    if (raf.current) return;
    let last = 0;
    const frame = (t) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 1 / 60; last = t;
      let moving = false; const o = omega.current, nc = { ...cur.current }, nv = { ...vel.current };
      for (const k of ['a', 'b', 'y']) {
        const x0 = nc[k] - tgt.current[k], v0 = nv[k], e = Math.exp(-o * dt);
        nc[k] = tgt.current[k] + (x0 + (v0 + o * x0) * dt) * e;
        nv[k] = (v0 - o * (v0 + o * x0) * dt) * e;
        const eps = k === 'y' ? 0.2 : 0.0006;
        if (Math.abs(nc[k] - tgt.current[k]) > eps || Math.abs(nv[k]) > eps) moving = true; else { nc[k] = tgt.current[k]; nv[k] = 0; }
      }
      nc.step = tgt.current.step; cur.current = nc; vel.current = nv; setView(nc);
      raf.current = moving ? requestAnimationFrame(frame) : 0;
    };
    raf.current = requestAnimationFrame(frame);
  }, [n, yFor, duration, reduce]);
  const setRange = useCallback((r, mode) => { if (r === 'all') go(0, n - 1, mode); else { const d = clamp(+r || 30, 3, n); go(n - d, n - 1, mode); } }, [go, n]);
  useEffect(() => { setRange(defaultRange, 'jump'); }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setRange(defaultRange); }, [defaultRange]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  /* KPI de la période cible, comparés à la période précédente */
  const s = Math.round(target.a), e = Math.round(target.b), len = e - s + 1;
  const A = useMemo(() => (n ? sum(rows, s, e) : null), [rows, s, e, n]);
  const P = useMemo(() => (n && s - len >= 0 ? sum(rows, s - len, s - 1) : null), [rows, s, len, n]);
  useEffect(() => {
    if (!A || status !== 'ready') return;
    onBrushChange && onBrushChange({ from: new Date(rows[s].t), to: new Date(rows[e].t), days: len, totals: A });
    const id = setTimeout(() => setLive(`Du ${fdate(rows[s].t, { day: 'numeric', month: 'long' })} au ${fdate(rows[e].t, { day: 'numeric', month: 'long', year: 'numeric' })}, ${len} jours : ${nf.format(A.calls)} appels, ${pf.format(A.resolved)} résolus par l’IA.`), 300);
    return () => clearTimeout(id);
  }, [s, e]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!n) status = 'empty';
  const ready = status === 'ready';

  /* Échelles */
  const X = (i) => M.l + ((i - view.a) / (view.b - view.a || 1)) * w;
  const Y = (v) => M.t + h - (v / (view.y || 1)) * h;
  const NX = (i) => (n > 1 ? (i / (n - 1)) * nav.w : 0);
  const ppd = w / (view.b - view.a || 1);

  const i0 = Math.max(0, Math.floor(view.a) - 1), i1 = Math.min(n - 1, Math.ceil(view.b) + 1);
  const pts = [], alt = [];
  for (let i = i0; i <= i1 && n; i++) { pts.push([X(i), Y(rows[i].calls)]); alt.push([X(i), Y(rows[i].transfers)]); }
  const line = pathOf(pts, smooth);
  const area = pts.length ? `${line}L${pts[pts.length - 1][0].toFixed(1)},${M.t + h}L${pts[0][0].toFixed(1)},${M.t + h}Z` : '';
  const yTicks = [];
  for (let v = 0; v <= target.y + 0.001; v += target.step) if (Y(v) >= M.t - 2) yTicks.push(v);
  const xTicks = useMemo(() => {
    const out = [], steps = [1, 2, 3, 7, 14];
    const st = steps.find((k) => k * ppd >= 76) || 0;
    for (let i = Math.max(0, Math.floor(view.a)); i <= Math.min(n - 1, Math.ceil(view.b)); i++) {
      const d = new Date(rows[i].t);
      const ok = st === 0 ? d.getUTCDate() === 1 && (ppd * 30 >= 64 || d.getUTCMonth() % 2 === 0)
        : st >= 7 ? d.getUTCDay() === 1 && (st === 7 || Math.round(i / 7) % 2 === 0) : (n - 1 - i) % st === 0;
      if (ok) out.push({ i, label: st === 0 ? fdate(rows[i].t, d.getUTCMonth() === 0 ? { month: 'short', year: 'numeric' } : { month: 'long' }) : st >= 7 ? fdate(rows[i].t, { day: 'numeric', month: 'short' }) : fdate(rows[i].t, { weekday: 'short', day: 'numeric' }) });
    }
    return out;
  }, [view.a, view.b, ppd, rows, n]);
  const miniPts = useMemo(() => rows.map((r, i) => [NX(i), nav.h - 4 - (r.calls / gmax) * (nav.h - 16)]), [rows, nav.w, nav.h, gmax]); // eslint-disable-line react-hooks/exhaustive-deps
  const miniLine = pathOf(miniPts, true), miniArea = miniLine ? `${miniLine}L${nav.w},${nav.h}L0,${nav.h}Z` : '';
  const months = rows.map((r, i) => ({ i, d: new Date(r.t) })).filter((o) => o.i > 0 && o.d.getUTCDate() === 1);

  /* Frise : déplacer, redimensionner, tracer */
  const navIdx = (ev) => { const r = ev.currentTarget.getBoundingClientRect(); return clamp(((ev.clientX - r.left) / (r.width || 1)) * (n - 1), 0, n - 1); };
  const onDown = (ev) => {
    if (!ready || (ev.button && ev.button !== 0)) return;
    const part = ev.target.dataset.part || 'new';
    ev.currentTarget.setPointerCapture(ev.pointerId); ev.preventDefault();
    setDrag({ part, i0: navIdx(ev), a0: tgt.current.a, b0: tgt.current.b, x0: ev.clientX, moved: false });
  };
  const onMove = (ev) => {
    if (!drag) { if (ev.pointerType !== 'touch' && ready) setHover(Math.round(navIdx(ev))); return; }
    const i = navIdx(ev), d = drag;
    if (!d.moved && Math.abs(ev.clientX - d.x0) <= 3) return;
    if (!d.moved) setDrag({ ...d, moved: true });
    const l = d.b0 - d.a0;
    if (d.part === 'move') { const a = clamp(d.a0 + i - d.i0, 0, n - 1 - l); go(a, a + l, 'drag'); }
    else if (d.part === 'start') go(Math.min(i, d.b0 - 2), d.b0, 'drag');
    else if (d.part === 'end') go(d.a0, Math.max(i, d.a0 + 2), 'drag');
    else { let lo = Math.min(i, d.i0), hi = Math.max(i, d.i0); if (hi - lo < 2) { if (i < d.i0) lo = hi - 2; else hi = lo + 2; } go(clamp(lo, 0, n - 3), clamp(hi, 2, n - 1), 'drag'); }
    setHover(null);
  };
  const onUp = () => {
    if (!drag) return;
    const d = drag; setDrag(null);
    if (!d.moved && d.part === 'new') { const l = d.b0 - d.a0, a = clamp(Math.round(d.i0 - l / 2), 0, n - 1 - l); go(a, a + l); return; }
    const a = Math.round(tgt.current.a); go(a, Math.max(a + 2, Math.round(tgt.current.b)));
  };
  const bA = drag ? target.a : view.a, bB = drag ? target.b : view.b, x0 = NX(bA), x1 = NX(bB);

  /* Clavier */
  const keyNav = (part) => (ev) => {
    if (!ready) return;
    const l = e - s, k = ev.key, st = ev.shiftKey ? 7 : 1;
    const map = { ArrowLeft: -st, ArrowRight: st, ArrowDown: -st, ArrowUp: st, PageDown: -30, PageUp: 30 };
    if (part === 'win') {
      if (['ArrowUp', 'ArrowDown', '+', '-'].includes(k)) { const zin = k === 'ArrowUp' || k === '+'; const nl = clamp(l + (zin ? -Math.max(1, Math.round(l * 0.15)) : Math.max(1, Math.round(l * 0.18))), 2, n - 1); const a = clamp(Math.round((s + e) / 2 - nl / 2), 0, n - 1 - nl); go(a, a + nl); }
      else if (k === 'Home') go(0, l); else if (k === 'End') go(n - 1 - l, n - 1);
      else if (k === 'PageUp' || k === 'PageDown') { const a = clamp(s + (k === 'PageUp' ? l + 1 : -l - 1), 0, n - 1 - l); go(a, a + l); }
      else if (map[k]) { const a = clamp(s + map[k], 0, n - 1 - l); go(a, a + l); }
      else if (k === 'Escape' || k === 'Enter') setRange(defaultRange); else return;
    } else if (part === 'start') { if (k === 'Home') go(0, e); else if (k === 'End') go(e - 2, e); else if (map[k]) go(clamp(s + map[k], 0, e - 2), e); else return; }
    else { if (k === 'Home') go(s, s + 2); else if (k === 'End') go(s, n - 1); else if (map[k]) go(s, clamp(e + map[k], s + 2, n - 1)); else return; }
    ev.preventDefault();
  };
  const plotKey = (ev) => {
    if (!ready) return;
    let i = hover == null ? e : hover; const st = ev.shiftKey ? 7 : 1;
    if (ev.key === 'ArrowLeft') i -= st; else if (ev.key === 'ArrowRight') i += st; else if (ev.key === 'Home') i = s; else if (ev.key === 'End') i = e;
    else if (ev.key === 'Escape') { setHover(null); return; } else return;
    ev.preventDefault(); i = clamp(i, 0, n - 1);
    if (i < s) go(i, i + (e - s)); else if (i > e) go(i - (e - s), i);
    setHover(i);
    const r = rows[i]; setLive(`${fdate(r.t, { weekday: 'long', day: 'numeric', month: 'long' })} : ${nf.format(r.calls)} appels, ${nf.format(r.transfers)} transférés.`);
  };
  const plotIdx = (ev) => { const r = ev.currentTarget.getBoundingClientRect(), px = ev.clientX - r.left - M.l; return px < -12 || px > w + 12 ? null : Math.round(view.a + clamp(px / w, 0, 1) * (view.b - view.a)); };

  /* Infobulle */
  const on = ready && hover != null && hover >= Math.round(view.a) && hover <= Math.round(view.b);
  const hr = hover != null && n ? rows[hover] : null;
  const tipRef = useRef(null);
  const [tipSize, setTipSize] = useState({ w: 208, h: 100 });
  useLayoutEffect(() => { if (tipRef.current) { const r = tipRef.current; if (r.offsetWidth !== tipSize.w || r.offsetHeight !== tipSize.h) setTipSize({ w: r.offsetWidth, h: r.offsetHeight }); } });
  const hx = hr ? X(hover) : 0, hy1 = hr ? Y(hr.calls) : 0, hy2 = hr ? Y(hr.transfers) : 0;
  const tipLeft = clamp(hx + 16 + tipSize.w <= plot.w ? hx + 16 : hx - 16 - tipSize.w, 0, Math.max(0, plot.w - tipSize.w));
  const tipTop = clamp(Math.min(hy1, hy2) - tipSize.h / 2, 4, Math.max(4, plot.h - M.b - tipSize.h));
  const hNote = hr && notes.find((o) => Math.round(o.i) === hover);

  /* Raccourci actif */
  const activeRange = RANGES.find(([r]) => e === n - 1 && (r === 'all' ? s === 0 : len === Math.min(n, +r)))?.[0];
  const segRef = useRef(null);
  const [ind, setInd] = useState(null);
  useLayoutEffect(() => { const b = segRef.current?.querySelector(`[data-r="${activeRange}"]`); setInd(b ? { x: b.offsetLeft, w: b.offsetWidth } : null); }, [activeRange, plot.w]);

  const vs = `par rapport aux ${len} jours précédents`;
  const dur = A ? mmss(A.duration) : null;
  const sameY = n && new Date(rows[s].t).getUTCFullYear() === new Date(rows[e].t).getUTCFullYear();
  const periodText = !ready ? (status === 'loading' ? '\u00a0' : status === 'empty' ? 'Aucune donnée' : 'Dernière mise à jour impossible')
    : `${fdate(rows[s].t, sameY ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' })} – ${fdate(rows[e].t, { day: 'numeric', month: 'short', year: 'numeric' })} · ${len}\u00a0jours${P ? ` · vs\u00a0${len}\u00a0jours précédents` : ''}`;
  const kpis = A && [
    { k: 'calls', label: 'Appels traités', text: nf.format(A.calls), sr: `${nf.format(A.calls)} appels`, d: P && { diff: P.calls ? (A.calls - P.calls) / P.calls : 0, up: true, fmt: (v) => `${f1.format(Math.abs(v * 100))} %` } },
    { k: 'resolved', label: 'Résolus par l’IA', text: f1.format(A.resolved * 100), unit: '%', sr: pf.format(A.resolved), d: P && { diff: Math.round((A.resolved - P.resolved) * 1000) / 10, up: true, fmt: (v) => `${f1.format(Math.abs(v))} pt` } },
    { k: 'duration', label: 'Durée moyenne', text: `${dur.m}:${pad2(dur.s)}`, unit: 'min', sr: `${dur.m} minutes ${dur.s} secondes`, d: P && { diff: Math.round(A.duration - P.duration), up: false, fmt: (v) => `${Math.abs(v)} s` } },
    { k: 'transfers', label: 'Transférés à un humain', text: nf.format(A.transfers), sr: `${nf.format(A.transfers)} appels transférés`, d: P && { diff: P.transfers ? (A.transfers - P.transfers) / P.transfers : 0, up: false, fmt: (v) => `${f1.format(Math.abs(v * 100))} %` } },
  ];
  const pulse = status === 'loading' ? 'motion-safe:animate-pulse' : '';

  return (
    <section aria-labelledby="bc-title" style={{ '--bc-c': c }} className="relative mx-auto grid w-full max-w-[1120px] gap-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 pb-4 pt-6 font-sans text-[var(--text)] md:gap-8 md:px-8 md:pb-6 md:pt-8">
      <header className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="font-mono text-xs font-medium uppercase leading-4 tracking-[0.04em] text-[var(--text-muted)]">{eyebrow}</p>
          <h2 id="bc-title" className="mt-2 text-balance text-[length:var(--t-section)] font-semibold leading-[1.3] tracking-[-0.01em] text-[var(--text-strong)]">{title}</h2>
          <p className={`mt-1 text-sm tabular-nums text-[var(--text-muted)] ${status === 'loading' ? 'invisible' : ''}`}>{periodText}</p>
        </div>
        <div ref={segRef} role="group" aria-label="Raccourcis de période" className={`relative isolate grid auto-cols-fr grid-flow-col self-start rounded-full border border-[var(--border)] bg-[var(--raised)] p-1 ${ready ? '' : 'pointer-events-none opacity-50'}`}>
          <span aria-hidden="true" className="absolute inset-y-1 left-0 -z-10 rounded-full border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-overlay)] transition-[transform,width,opacity] duration-[520ms] ease-[cubic-bezier(.34,1.36,.64,1)] motion-reduce:transition-none dark:border-[var(--tint-neutral-border)] dark:bg-[var(--tint-neutral-bg)]" style={{ width: ind?.w || 0, transform: `translateX(${ind?.x || 0}px)`, opacity: ind ? 1 : 0 }} />
          {RANGES.map(([r, l]) => (
            <button key={r} data-r={r} type="button" aria-pressed={activeRange === r} onClick={() => setRange(r)}
              className={`h-11 rounded-full px-2 text-sm font-medium tabular-nums transition-colors md:h-9 md:min-w-14 md:px-4 ${activeRange === r ? 'text-[var(--text-strong)]' : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'} focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]`}>{l}</button>
          ))}
        </div>
      </header>

      <dl className="m-0 grid grid-cols-2 border-y border-[var(--border)] lg:grid-cols-4">
        {['Appels traités', 'Résolus par l’IA', 'Durée moyenne', 'Transférés à un humain'].map((label, i) => {
          const kp = ready && kpis ? kpis[i] : null;
          return (
            <div key={label} className={`grid content-start gap-2 py-4 ${i % 2 ? 'pl-4' : 'border-r border-[var(--border)] pr-4'} ${i > 1 ? 'border-t border-[var(--border)]' : ''} lg:border-r-0 lg:border-t-0 lg:px-6 lg:py-5 lg:first:pl-0 lg:[&+&]:border-l lg:[&+&]:border-[var(--border)]`}>
              <dt className="text-[13px] font-medium leading-[18px] text-[var(--text-muted)]">{label}</dt>
              <dd className="m-0 flex flex-col items-start gap-1 md:flex-row md:flex-wrap md:items-baseline md:gap-2">
                {kp ? <Rolling text={kp.text} unit={kp.unit} label={kp.sr} />
                  : status === 'loading' ? <span className={`block h-[1.2em] w-24 rounded-lg bg-[var(--raised)] text-[length:var(--t-kpi)] ${pulse}`} />
                  : <span className="text-[length:var(--t-kpi)] font-semibold leading-[1.2] text-[var(--text-strong)]"><span aria-hidden="true">—</span><span className="sr-only">Aucune donnée</span></span>}
                {kp && kp.d && <Delta diff={kp.d.diff} text={sign(kp.d.diff, kp.d.fmt(kp.d.diff))} goodWhenUp={kp.d.up} label={vs} />}
              </dd>
            </div>
          );
        })}
      </dl>

      <div className="relative grid min-w-0 gap-3 md:gap-4">
        <div aria-hidden="true" className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-medium leading-[18px] text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-2"><i className="w-4 rounded border-t-2 border-[var(--bc-c)]" />Appels traités</span>
          {showTransfers && <span className="inline-flex items-center gap-2"><i className="w-4 border-t-2 border-dashed border-[var(--text-muted)]" />Transférés à un humain</span>}
        </div>

        <div ref={plotRef} tabIndex={0} role="group" aria-roledescription="graphique" aria-label="Appels traités par jour. Flèches gauche et droite pour lire chaque jour." aria-describedby="bc-help"
          onPointerMove={(ev) => ready && setHover(plotIdx(ev))} onPointerDown={(ev) => ready && setHover(plotIdx(ev))}
          onPointerLeave={(ev) => ev.pointerType !== 'touch' && setHover(null)} onKeyDown={plotKey} onBlur={() => setHover(null)}
          className="relative -mx-2 h-[232px] touch-pan-y select-none rounded-lg outline-none focus-visible:shadow-[0_0_0_2px_var(--focus-ring)] md:h-[300px]">
          {ready && plot.w > 0 && (
            <svg aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${plot.w} ${plot.h}`}>
              <defs><clipPath id="bc-clip"><rect x={M.l} y={0} width={w} height={plot.h} /></clipPath></defs>
              {yTicks.map((v) => { const y = Math.round(Y(v)) + 0.5; return (
                <g key={v}>
                  <line x1={M.l} x2={M.l + w} y1={y} y2={y} shapeRendering="crispEdges" className={v === 0 ? 'stroke-[var(--border-control)] opacity-55' : 'stroke-[var(--chart-grid)]'} />
                  <text x={M.l - 12} y={Y(v) + 4} textAnchor="end" className="fill-[var(--text-muted)] font-mono text-xs tabular-nums">{nf.format(v)}</text>
                </g>); })}
              {annotations && notes.filter((o) => o.i >= view.a - 0.01 && o.i <= view.b + 0.01).map((o) => (
                <line key={o.date} x1={X(o.i)} x2={X(o.i)} y1={M.t - 4} y2={M.t + h} strokeDasharray="2 3" className="stroke-[var(--border-control)]" />
              ))}
              <g clipPath="url(#bc-clip)">
                {variant === 'area' && <path d={area} className="fill-[var(--bc-c)] opacity-[.12] dark:opacity-[.16]" />}
                {showTransfers && <path d={pathOf(alt, smooth)} fill="none" strokeWidth="1.5" strokeDasharray="4 4" className="stroke-[var(--text-muted)]" />}
                <path d={line} fill="none" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" className="stroke-[var(--bc-c)] dark:[filter:drop-shadow(0_0_6px_color-mix(in_srgb,var(--bc-c)_45%,transparent))]" />
              </g>
              {ppd > 40 && pts.filter((p) => p[0] >= M.l - 0.5 && p[0] <= M.l + w + 0.5).map((p, k) => <circle key={k} cx={p[0]} cy={p[1]} r="3" strokeWidth="2" className="fill-[var(--surface)] stroke-[var(--bc-c)]" />)}
              {xTicks.map((tk) => { const x = X(tk.i); return x < M.l + 16 || x > M.l + w - 16 ? null : <text key={tk.i} x={x} y={plot.h - 8} textAnchor="middle" className="fill-[var(--text-muted)] font-mono text-xs tabular-nums">{tk.label}</text>; })}
            </svg>
          )}
          {ready && (
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              {annotations && notes.map((o) => { const vis = o.i >= view.a - 0.01 && o.i <= view.b + 0.01; return (
                <span key={o.date} className="absolute left-0 top-1 inline-flex h-6 -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--raised)] px-2 text-xs font-medium text-[var(--text-muted)] transition-opacity duration-[180ms]" style={{ left: clamp(X(o.i), M.l + 64, M.l + w - 64), opacity: vis ? 1 : 0 }}>
                  <i className="h-1.5 w-1.5 rounded-full bg-[var(--bc-c)]" />{o.label}
                </span>); })}
              <span className="absolute bottom-7 top-8 w-px bg-[var(--border-control)] transition-opacity duration-[120ms]" style={{ left: hx, opacity: on ? 1 : 0 }} />
              {showTransfers && <span className="absolute -ml-[5px] -mt-[5px] h-2.5 w-2.5 rounded-full border-2 border-[var(--text-muted)] bg-[var(--surface)] transition-opacity duration-[120ms]" style={{ left: hx, top: hy2, opacity: on ? 1 : 0 }} />}
              <span className="absolute -ml-1.5 -mt-1.5 h-3 w-3 rounded-full border-2 border-[var(--surface)] bg-[var(--bc-c)] shadow-[0_0_0_5px_color-mix(in_srgb,var(--bc-c)_18%,transparent)] transition-opacity duration-[120ms]" style={{ left: hx, top: hy1, opacity: on ? 1 : 0 }} />
              <div ref={tipRef} className={`absolute min-w-[184px] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-[13px] leading-[18px] tabular-nums shadow-[var(--shadow-popover)] transition-[opacity,scale] duration-[180ms] ease-[cubic-bezier(.34,1.36,.64,1)] dark:bg-[var(--raised)] md:min-w-[208px] ${on ? 'scale-100 opacity-100' : 'scale-[.96] opacity-0'}`} style={{ left: tipLeft, top: tipTop, transformOrigin: tipLeft > hx ? 'left center' : 'right center' }}>
                {hr && <>
                  <p className="mb-2 font-mono text-xs font-medium text-[var(--text-muted)] first-letter:uppercase">{fdate(hr.t, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <div className="grid grid-cols-[12px_1fr_auto] items-center gap-2"><i className="border-t-2 border-[var(--bc-c)]" /><span>Appels traités</span><b className="font-semibold text-[var(--text-strong)]">{nf.format(hr.calls)}</b></div>
                  {showTransfers && <div className="mt-1 grid grid-cols-[12px_1fr_auto] items-center gap-2"><i className="border-t-2 border-dashed border-[var(--text-muted)]" /><span>Transférés</span><b className="font-semibold text-[var(--text-strong)]">{nf.format(hr.transfers)} · {pf.format(hr.transfers / hr.calls)}</b></div>}
                  <div className="mt-1 grid grid-cols-[12px_1fr_auto] items-center gap-2"><i /><span>Durée moyenne</span><b className="font-semibold text-[var(--text-strong)]">{mmss(hr.duration).m} min {pad2(mmss(hr.duration).s)}</b></div>
                  {hNote && annotations && <p className="mt-2 border-t border-[var(--border)] pt-2 text-[var(--text-muted)]">{hNote.label}</p>}
                </>}
              </div>
            </div>
          )}
          {status === 'loading' && (
            <svg aria-hidden="true" viewBox="0 0 400 100" preserveAspectRatio="none" className={`absolute bottom-7 left-11 right-2 top-8 h-[calc(100%-60px)] w-[calc(100%-52px)] ${pulse}`}><path d="M0 72 C40 60 60 78 100 62 S160 40 200 52 S270 70 300 44 S370 30 400 38 V100 H0Z" className="fill-[var(--raised)]" /></svg>
          )}
          {(status === 'empty' || status === 'error') && (
            <div className="absolute bottom-7 left-11 right-2 top-8 grid place-content-center justify-items-center gap-2 p-4 text-center">
              <span aria-hidden="true" className="mb-1 grid h-10 w-10 place-items-center rounded-full bg-[var(--raised)] text-[var(--text-muted)]"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16M7 16v-4M12 16V7M17 16V9" /></svg></span>
              <p className="text-base font-semibold text-[var(--text-strong)]">{status === 'empty' ? 'Aucun appel pour l’instant' : 'Statistiques indisponibles'}</p>
              <p className="max-w-[40ch] text-sm text-[var(--text-muted)]">{status === 'empty' ? 'Dès qu’un agent décroche, les appels du jour s’affichent ici, avec leur taux de résolution.' : 'La connexion au standard a échoué. Vos appels continuent d’être traités normalement.'}</p>
              {status === 'error' && <button type="button" onClick={onRetry} className="mt-2 h-11 rounded-full border border-[var(--border-control)] bg-[var(--surface)] px-5 text-sm font-medium text-[var(--text-strong)] hover:bg-[var(--raised)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]">Réessayer</button>}
            </div>
          )}
        </div>

        <div ref={navRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={() => !drag && setHover(null)} onDoubleClick={() => setRange(defaultRange)}
          className={`relative ml-9 mr-0 h-14 cursor-crosshair touch-none select-none rounded-lg ${ready ? '' : `bg-[var(--raised)] ${pulse}`}`}>
          {ready && nav.w > 0 && <>
            <svg aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${nav.w} ${nav.h}`}>
              <defs><clipPath id="bc-mclip"><rect x={x0} y={0} width={Math.max(0, x1 - x0)} height={nav.h} /></clipPath></defs>
              <rect width={nav.w} height={nav.h} rx="8" className="fill-[var(--raised)]" />
              {months.map((o) => <line key={o.i} x1={NX(o.i)} x2={NX(o.i)} y1={0} y2={nav.h} className="stroke-[var(--border)]" />)}
              {months.reduce((acc, o) => { const x = NX(o.i); if (x - acc.last > 44 && nav.w - x > 36) { acc.out.push(<text key={o.i} x={x + 6} y={16} className="fill-[var(--text-muted)] font-mono text-xs font-medium">{fdate(rows[o.i].t, { month: 'short' })}</text>); acc.last = x; } return acc; }, { out: [], last: -99 }).out}
              <path d={miniArea} className="fill-[var(--chart-muted)] opacity-[.16]" /><path d={miniLine} fill="none" strokeWidth="1.25" className="stroke-[var(--chart-muted)] opacity-70" />
              <g clipPath="url(#bc-mclip)"><path d={miniArea} className="fill-[var(--bc-c)] opacity-[.22]" /><path d={miniLine} fill="none" strokeWidth="1.25" className="stroke-[var(--bc-c)]" /></g>
              {annotations && notes.map((o) => <circle key={o.date} cx={NX(o.i)} cy={nav.h - 6} r="2.5" className="fill-[var(--bc-c)]" />)}
            </svg>
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-px bg-[var(--text-muted)] transition-opacity" style={{ transform: `translateX(${NX(hover ?? 0)}px)`, opacity: on ? 0.7 : 0 }} />
            <div data-part="move" role="slider" tabIndex={0} aria-label="Période affichée, flèches pour la déplacer, haut et bas pour zoomer"
              aria-valuemin={0} aria-valuemax={n - len} aria-valuenow={s} aria-valuetext={`Du ${fdate(rows[s].t, { day: 'numeric', month: 'long' })} au ${fdate(rows[e].t, { day: 'numeric', month: 'long', year: 'numeric' })}, ${len} jours`}
              onKeyDown={keyNav('win')}
              className={`absolute inset-y-0 left-0 rounded-lg border border-[var(--border-control)] bg-[color-mix(in_srgb,var(--bc-c)_6%,transparent)] outline-none hover:border-[var(--text-muted)] focus-visible:shadow-[0_0_0_2px_var(--focus-ring)] ${drag ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{ transform: `translateX(${x0}px)`, width: Math.max(8, x1 - x0) }} />
            {[['start', x0, s, 0, e - 2, 'Début de la période'], ['end', x1, e, s + 2, n - 1, 'Fin de la période']].map(([part, x, now, min, max, label]) => (
              <span key={part} data-part={part} role="slider" tabIndex={0} aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={now}
                aria-valuetext={fdate(rows[now].t, { day: 'numeric', month: 'long', year: 'numeric' })} onKeyDown={keyNav(part)}
                className="group absolute left-0 top-1/2 z-[1] -ml-[22px] -mt-7 grid h-14 w-11 cursor-ew-resize place-items-center outline-none" style={{ transform: `translateX(${x}px)` }}>
                <span className="pointer-events-none relative grid h-7 w-2.5 place-items-center rounded-full border border-[var(--border-control)] bg-[var(--surface)] shadow-[var(--shadow-overlay)] transition-transform duration-[180ms] ease-[cubic-bezier(.34,1.36,.64,1)] group-hover:scale-110 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-[var(--focus-ring)]">
                  <span className="h-2.5 w-0.5 rounded-sm bg-[var(--text-muted)]" />
                </span>
              </span>
            ))}
          </>}
        </div>
        <p id="bc-help" className={`text-center text-xs text-[var(--text-muted)] [@media(pointer:coarse)]:hidden ${ready ? '' : 'invisible'}`}>Glissez sur la frise pour choisir une période · double-clic pour revenir à la vue par défaut</p>
      </div>
      <p className="sr-only" aria-live="polite">{live}</p>
    </section>
  );
}

export default BrushChart;
