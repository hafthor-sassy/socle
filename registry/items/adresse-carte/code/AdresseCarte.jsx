// AdresseCarte.jsx — saisie d'adresse semi-automatique + plan SVG à caméra à ressort.
// React 18, Tailwind 3.4, tokens.css chargé (couleurs par variables). Aucune API : données locales.
// Rues réelles de Lyon, numéros et positions fictifs (1 km = 250 unités du plan). Marque fictive : Brindille.
// Utilisation :
//   <AdresseCarte zoom={3.2} zoneKm={1.6} stiffness={170} damping={22} latency={220} mapStyle="plan" showZone={true} showRoute={true} onChange={(a) => console.log(a)} />
import { useEffect, useId, useMemo, useRef, useState } from 'react';

const KM = 250;
export const STREETS = [
  { n: 'Rue Mercière', cp: '69002', q: 'Presqu’île', a: [446, 462], b: [430, 612], r: [1, 98] },
  { n: 'Rue de la République', cp: '69002', q: 'Presqu’île', a: [502, 340], b: [474, 650], r: [1, 92] },
  { n: 'Rue du Président-Édouard-Herriot', cp: '69002', q: 'Presqu’île', a: [474, 338], b: [452, 640], r: [1, 120] },
  { n: 'Place des Terreaux', cp: '69001', q: 'Terreaux', a: [470, 318], b: [512, 318], r: [1, 24] },
  { n: 'Montée de la Grande-Côte', cp: '69001', q: 'Pentes', a: [466, 230], b: [488, 306], r: [1, 60] },
  { n: 'Boulevard de la Croix-Rousse', cp: '69004', q: 'Croix-Rousse', a: [340, 196], b: [650, 222], r: [1, 180] },
  { n: 'Place Bellecour', cp: '69002', q: 'Bellecour', a: [436, 682], b: [512, 682], r: [1, 40] },
  { n: 'Rue Victor-Hugo', cp: '69002', q: 'Ainay', a: [474, 708], b: [492, 834], r: [1, 64] },
  { n: 'Cours de Verdun', cp: '69002', q: 'Perrache', a: [440, 858], b: [560, 846], r: [1, 30] },
  { n: 'Rue Saint-Jean', cp: '69005', q: 'Vieux Lyon', a: [372, 478], b: [388, 640], r: [1, 80] },
  { n: 'Montée du Gourguillon', cp: '69005', q: 'Saint-Georges', a: [352, 612], b: [262, 640], r: [1, 30] },
  { n: 'Quai Fulchiron', cp: '69005', q: 'Saint-Georges', a: [396, 664], b: [432, 776], r: [1, 30] },
  { n: 'Cours Lafayette', cp: '69003', q: 'Part-Dieu', a: [650, 470], b: [990, 476], r: [1, 290] },
  { n: 'Rue Garibaldi', cp: '69003', q: 'Part-Dieu', a: [762, 190], b: [744, 920], r: [1, 380] },
  { n: 'Rue Paul-Bert', cp: '69003', q: 'Guillotière', a: [630, 584], b: [990, 566], r: [1, 260] },
  { n: 'Cours Gambetta', cp: '69007', q: 'Guillotière', a: [612, 652], b: [990, 646], r: [1, 210] },
  { n: 'Avenue Jean-Jaurès', cp: '69007', q: 'Jean-Macé', a: [612, 724], b: [690, 1000], r: [1, 400] },
  { n: 'Boulevard des Belges', cp: '69006', q: 'Brotteaux', a: [714, 262], b: [990, 250], r: [1, 120] },
];
const SHOP = [440, 520];
const DISTRICTS = [
  { pts: '790,-60 745,140 720,262 682,382 625,560 615,700 585,880 560,1060 1060,1060 1060,-60', step: 30, rot: 0 },
  { pts: '300,250 318,330 360,430 395,560 410,650 440,760 480,880 520,950 570,880 585,760 592,660 612,540 650,420 690,300 704,250', step: 24, rot: -6 },
  { pts: '300,-60 790,-60 704,250 300,250', step: 28, rot: 12 },
  { pts: '-60,-60 300,-60 318,120 270,220 300,330 370,470 392,620 430,760 490,900 520,1060 -60,1060', step: 40, rot: 24 },
];
const LABELS = [['Presqu’île', 470, 560, -84], ['Vieux Lyon', 352, 560, 82], ['Croix-Rousse', 500, 160, 0], ['Part-Dieu', 860, 420, 0], ['Guillotière', 820, 700, 0], ['Brotteaux', 870, 300, 0], ['Tête d’Or', 820, 262, 0], ['Fourvière', 220, 360, 0], ['Perrache', 500, 900, 0]];
const BRIDGES = [[300, 405, 560], [330, 430, 470], [610, 715, 420], [590, 700, 610], [575, 680, 760], [380, 470, 860]];

const fold = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’'-]/g, ' ');
const foldKeep = (s) => Array.from(s).map((c) => fold(c)[0] || ' ').join('');
const fmtKm = (u) => `${(u / KM).toFixed(1).replace('.', ',')}\u00a0km`;
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const dist = (p) => Math.hypot(p[0] - SHOP[0], p[1] - SHOP[1]);

export function pointOf(st, num) {
  if (num == null) return lerp(st.a, st.b, 0.5);
  const t = (Math.min(Math.max(num, st.r[0]), st.r[1]) - st.r[0]) / Math.max(1, st.r[1] - st.r[0]);
  const p = lerp(st.a, st.b, t);
  const nx = st.b[1] - st.a[1], ny = st.a[0] - st.b[0], L = Math.hypot(nx, ny) || 1, side = num % 2 ? 1 : -1;
  return [p[0] + (nx / L) * 7 * side, p[1] + (ny / L) * 7 * side];
}
export function search(raw) {
  const m = String(raw).trim().match(/^(\d{1,4})\s*(bis|ter)?\s*,?\s*(.*)$/i);
  const num = m ? parseInt(m[1], 10) : null;
  const rest = fold(m ? m[3] : raw).replace(/\s+/g, ' ').trim();
  const words = rest.split(' ').filter((w) => w && !/^(rue|r|av|bd|de|la|du|des|le|l|d)$/.test(w));
  if (!words.length && num == null) return [];
  return STREETS.map((st) => {
    const hay = fold(`${st.n} ${st.cp} ${st.q}`);
    let score = 0;
    const ok = words.every((w) => { const i = hay.indexOf(w); if (i < 0) return false; score += i === 0 || hay[i - 1] === ' ' ? 3 : 1; return true; });
    if (!ok || !words.length) return null;
    if (fold(st.n).startsWith(rest) || fold(st.n).includes(` ${rest}`)) score += 4;
    const n = num != null && num >= st.r[0] && num <= st.r[1] ? num : null;
    return { st, num: n, badNum: num != null && n == null, score, q: rest };
  }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 6);
}
function Highlight({ text, q }) {
  const f = foldKeep(text);
  const marks = q.split(' ').filter((w) => w.length > 1).map((w) => [f.indexOf(w), w.length]).filter((m) => m[0] > -1).sort((a, b) => a[0] - b[0]);
  const out = []; let pos = 0;
  marks.forEach(([i, l], k) => { if (i < pos) return; out.push(text.slice(pos, i), <mark key={k} className="bg-transparent font-semibold text-inherit underline decoration-[var(--accent)] decoration-2 underline-offset-[3px]">{text.slice(i, i + l)}</mark>); pos = i + l; });
  out.push(text.slice(pos));
  return <>{out}</>;
}

/* Caméra et épingle à ressort (Euler semi-implicite, 4 sous-pas par image). */
function useSpringCamera(svgRef, { stiffness, damping }) {
  const s = useRef({ cam: { x: 500, y: 520, z: 1.12, vx: 0, vy: 0, vz: 0 }, tgt: { x: 500, y: 520, z: 1.12 }, pin: { y: 0, v: 0, s: 1, vs: 0 }, raf: 0, last: 0, visible: true });
  const [frame, setFrame] = useState({ vb: '0 0 1000 1000', u: 1, pinY: 0, pinS: 1 });
  const k = useRef({ stiffness, damping }); k.current = { stiffness, damping };
  const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const draw = () => {
    const el = svgRef.current; if (!el) return;
    const r = el.getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height), { cam, pin } = s.current, side = 1000 / cam.z;
    const vw = w >= h ? side : (side * w) / h, vh = w >= h ? (side * h) / w : side;
    setFrame({ vb: `${cam.x - vw / 2} ${cam.y - vh / 2} ${vw} ${vh}`, u: vw / w, pinY: pin.y, pinS: pin.s });
  };
  const step = (now) => {
    const st = s.current; st.raf = 0;
    const dt = Math.min(0.064, (now - (st.last || now)) / 1000) || 0.016; st.last = now;
    const { stiffness: K, damping: C } = k.current, h = dt / 4, { cam, tgt, pin } = st;
    for (let i = 0; i < 4; i++) {
      cam.vx += (K * (tgt.x - cam.x) - C * cam.vx) * h; cam.x += cam.vx * h;
      cam.vy += (K * (tgt.y - cam.y) - C * cam.vy) * h; cam.y += cam.vy * h;
      cam.vz += (K * (tgt.z - cam.z) - C * cam.vz) * h; cam.z += cam.vz * h;
      pin.v += (420 * -pin.y - 15 * pin.v) * h; pin.y += pin.v * h;
      pin.vs += (300 * (1 - pin.s) - 18 * pin.vs) * h; pin.s += pin.vs * h;
    }
    draw();
    const moving = Math.abs(tgt.x - cam.x) + Math.abs(tgt.y - cam.y) > 0.05 || Math.abs(tgt.z - cam.z) > 5e-4 || Math.abs(pin.y) + Math.abs(pin.v) > 0.05 || Math.abs(1 - pin.s) > 1e-3;
    if (moving && st.visible) st.raf = requestAnimationFrame(step); else st.last = 0;
  };
  const kick = () => {
    const st = s.current;
    if (reduced()) { Object.assign(st.cam, st.tgt); st.pin.y = 0; st.pin.s = 1; draw(); return; }
    if (!st.raf) { st.last = 0; st.raf = requestAnimationFrame(step); }
  };
  useEffect(() => {
    const el = svgRef.current; if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => { s.current.visible = e.isIntersecting; if (e.isIntersecting) kick(); });
    const ro = new ResizeObserver(draw);
    io.observe(el); ro.observe(el); draw();
    return () => { io.disconnect(); ro.disconnect(); cancelAnimationFrame(s.current.raf); };
  }, []);
  return {
    frame,
    lookAt: (x, y, z) => { Object.assign(s.current.tgt, { x, y, z: Math.max(0.9, Math.min(6, z)) }); kick(); },
    zoomBy: (f) => { const t = s.current.tgt; t.z = Math.max(0.9, Math.min(6, t.z * f)); kick(); },
    dropPin: () => { Object.assign(s.current.pin, { y: -64, v: 0, s: 0.2, vs: 0 }); kick(); },
  };
}

const Icon = ({ d, className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={`${className} fill-none stroke-current`} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const PIN = 'M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11zM12 12.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5z';
const RESULT = {
  idle: { box: 'bg-[var(--raised)]', fg: 'text-[var(--text-muted)]', icon: 'M4 12h16M14 6l6 6-6 6' },
  ok: { box: 'bg-[var(--tint-green-bg)]', fg: 'text-[var(--tint-green-fg)]', icon: 'M5 12.5l4.5 4.5L19 7.5' },
  far: { box: 'bg-[var(--tint-amber-bg)]', fg: 'text-[var(--tint-amber-fg)]', icon: 'M3 17h2l2-6h7l2 6h5M9 11l1-4h3' },
  err: { box: 'bg-[var(--tint-red-bg)]', fg: 'text-[var(--tint-red-fg)]', icon: 'M12 8v5M12 16.5v.5M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17z' },
};

/**
 * @param {{ zoom?: number, zoneKm?: number, stiffness?: number, damping?: number, latency?: number,
 *   mapStyle?: 'plan'|'epure', showZone?: boolean, showRoute?: boolean,
 *   onChange?: (a: { rue: string, numero: number|null, cp: string, km: number, zone: boolean }) => void }} props
 */
export default function AdresseCarte({ zoom = 3.2, zoneKm = 1.6, stiffness = 170, damping = 22, latency = 220, mapStyle = 'plan', showZone = true, showRoute = true, onChange }) {
  const uid = useId().replace(/:/g, '');
  const svgRef = useRef(null);
  const { frame, lookAt, zoomBy, dropPin } = useSpringCamera(svgRef, { stiffness, damping });
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [opts, setOpts] = useState([]);
  const [active, setActive] = useState(-1);
  const [chosen, setChosen] = useState(null);
  const [routeKey, setRouteKey] = useState(0);
  const zone = zoneKm * KM;
  const fit = () => lookAt(SHOP[0] + 20, SHOP[1], Math.max(0.95, Math.min(2.4, 1000 / (zone * 2.6))));
  useEffect(fit, [zone]);

  useEffect(() => {
    if (!value.trim() || chosen) { setLoading(false); return undefined; }
    setLoading(latency > 120);
    const t = setTimeout(() => { const r = search(value); setOpts(r); setActive(r.length ? 0 : -1); setLoading(false); setOpen(true); }, latency);
    return () => clearTimeout(t);
  }, [value, latency, chosen]);

  useEffect(() => { /* aperçu : la carte glisse vers la suggestion active */
    const o = opts[active]; if (!o || chosen) return;
    const p = pointOf(o.st, o.num); lookAt(p[0], p[1], Math.min(zoom * 0.62, 2.2));
  }, [active, opts]);

  const choose = (o) => {
    if (!o) return;
    const p = pointOf(o.st, o.num), d = dist(p);
    setChosen({ ...o, p, d }); setOpen(false); setActive(-1);
    setValue(`${o.num != null ? `${o.num} ` : ''}${o.st.n}, ${o.st.cp} Lyon`);
    dropPin(); setRouteKey((k) => k + 1);
    lookAt(p[0] * 0.62 + SHOP[0] * 0.38, p[1] * 0.62 + SHOP[1] * 0.38, Math.min(zoom, 1000 / (d * 1.7 + 260)));
    onChange?.({ rue: o.st.n, numero: o.num, cp: o.st.cp, km: +(d / KM).toFixed(2), zone: d <= zone });
  };
  const reset = () => { setChosen(null); setValue(''); setOpts([]); setOpen(false); fit(); };

  const state = !chosen ? 'idle' : chosen.num == null ? 'err' : chosen.d <= zone ? 'ok' : 'far';
  const mins = chosen ? Math.max(4, Math.round(((chosen.d / KM) * 1.3 / 15) * 60)) : 0;
  const msg = {
    idle: ['Saisissez une adresse', 'Nous vous proposerons le premier créneau disponible.'],
    ok: ['Livrable aujourd’hui, 14 h – 16 h', chosen && `${fmtKm(chosen.d)} de l’atelier · environ ${mins} min à vélo · livraison offerte.`],
    far: ['Hors de la zone vélo', chosen && `${fmtKm(chosen.d)} de l’atelier · livraison demain matin par coursier (+4,90 €).`],
    err: ['Précisez le numéro', 'Le coursier a besoin du numéro de rue pour sonner à la bonne porte.'],
  }[state];

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => (opts.length ? (a + 1) % opts.length : -1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (opts.length ? (a - 1 + opts.length) % opts.length : -1)); }
    else if (e.key === 'Enter' && open && opts[active]) { e.preventDefault(); choose(opts[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); if (open) setOpen(false); else reset(); }
  };

  const grids = useMemo(() => DISTRICTS.map((q) => {
    let d = '';
    for (let y = -400; y <= 1400; y += q.step) d += `M-400 ${y}H1400`;
    for (let x = -400; x <= 1400; x += q.step * 1.35) d += `M${x.toFixed(1)} -400V1400`;
    return { ...q, d };
  }), []);
  const u = frame.u;
  const route = chosen && (() => {
    const p = chosen.p, mx = (SHOP[0] + p[0]) / 2 + (p[1] - SHOP[1]) * 0.18, my = (SHOP[1] + p[1]) / 2 - (p[0] - SHOP[0]) * 0.18;
    return `M${SHOP}Q${mx} ${my} ${p[0]} ${p[1]}`;
  })();
  const listId = `${uid}-list`;

  return (
    <div className="mx-auto w-full max-w-[1040px] font-sans text-[var(--text)]">
      <div className="grid overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] md:min-h-[600px] md:grid-cols-[380px_minmax(0,1fr)]">
        <section className="relative z-[2] flex flex-col gap-6 bg-[var(--surface)] p-6 md:border-r md:border-[var(--border)] md:p-8" aria-labelledby={`${uid}-t`}>
          <header className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-base font-semibold tracking-[-0.01em] text-[var(--text-strong)]">
              <svg viewBox="0 0 100 100" className="h-7 w-7" aria-hidden="true"><rect width="100" height="100" rx="28" fill="var(--accent)" /><path d="M50 80V44M50 58c-10 0-18-7-18-18 10 0 18 7 18 18zM50 50c0-12 8-20 20-20 0 12-8 20-20 20z" fill="none" stroke="var(--accent-fg)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Brindille
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.04em] text-[var(--text-muted)]">Étape 2 sur 3</span>
          </header>
          <div className="grid gap-2">
            <h2 id={`${uid}-t`} className="m-0 text-[clamp(1.625rem,1.4rem+1vw,2rem)] font-semibold leading-tight tracking-[-0.02em] text-[var(--text-strong)]">Où livrer le bouquet&nbsp;?</h2>
            <p className="m-0 text-sm text-[var(--text-muted)]">Bouquet Garance · 48&nbsp;€ · livré à vélo depuis l’atelier de la rue Mercière.</p>
          </div>

          <div className="relative grid gap-2">
            <label htmlFor={`${uid}-in`} className="text-sm font-medium text-[var(--text-strong)]">Adresse de livraison</label>
            <div className="group relative flex items-center">
              <span className="pointer-events-none absolute left-3 text-[var(--text-muted)] group-focus-within:text-[var(--accent)]"><Icon d={PIN} className="h-5 w-5" /></span>
              <input id={`${uid}-in`} value={value} placeholder="Ex. 12 rue Mercière" autoComplete="off" spellCheck={false} inputMode="search"
                role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={listId} aria-activedescendant={open && active > -1 ? `${uid}-o${active}` : undefined}
                aria-invalid={state === 'err' || undefined}
                onChange={(e) => { setChosen(null); setValue(e.target.value); if (!e.target.value) setOpts([]); }}
                onKeyDown={onKey} onBlur={() => setTimeout(() => setOpen(false), 120)}
                className="h-12 w-full rounded-lg border border-[var(--border-control)] bg-[var(--surface)] pl-11 pr-12 text-base text-[var(--text-strong)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-subtle)] aria-[invalid=true]:border-[var(--down)] md:h-11" />
              {loading && <span className="absolute right-3.5 h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] motion-reduce:animate-none" aria-hidden="true" />}
              {!loading && value && (
                <button type="button" onClick={reset} aria-label="Effacer l’adresse" className="absolute right-0.5 grid h-11 w-11 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--state-hover)] hover:text-[var(--text-strong)]"><Icon d="M7 7l10 10M17 7L7 17" /></button>
              )}
            </div>
            <p className="m-0 text-xs text-[var(--text-muted)]">Flèches pour parcourir, Entrée pour choisir.</p>
            {open && (
              <ul id={listId} role="listbox" aria-label="Suggestions d’adresses" onPointerDown={(e) => e.preventDefault()}
                className="absolute inset-x-0 top-[82px] z-[5] m-0 max-h-[336px] list-none overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-[var(--shadow-popover)]">
                {!opts.length && <li role="presentation" className="px-3 py-4 text-sm text-[var(--text-muted)]"><strong className="block font-semibold text-[var(--text-strong)]">Aucune adresse trouvée à Lyon</strong>Vérifiez l’orthographe ou saisissez seulement le nom de la rue.</li>}
                {opts.map((o, i) => {
                  const d = dist(pointOf(o.st, o.num)), on = i === active;
                  return (
                    <li key={o.st.n} id={`${uid}-o${i}`} role="option" aria-selected={on} onClick={() => choose(o)} onPointerMove={(e) => e.pointerType === 'mouse' && setActive(i)}
                      className={`grid min-h-14 cursor-pointer grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2.5 py-2 ${on ? 'bg-[var(--accent-subtle)]' : 'hover:bg-[var(--state-hover)]'}`}>
                      <span className={`grid h-8 w-8 place-items-center rounded-lg ${on ? 'bg-[var(--surface)] text-[var(--accent)]' : 'bg-[var(--raised)] text-[var(--text-muted)]'}`}><Icon d={PIN} /></span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-[var(--text-strong)]"><Highlight text={`${o.num != null ? `${o.num} ` : ''}${o.st.n}`} q={o.q} /></span>
                        <span className="block text-xs text-[var(--text-muted)]">{o.st.cp} Lyon · {o.st.q}{o.badNum ? ' · numéro hors plage' : o.num == null ? ' · sans numéro' : ''}</span>
                      </span>
                      <span className={`whitespace-nowrap font-mono text-xs tabular-nums ${d <= zone ? 'text-[var(--up)]' : 'text-[var(--text-muted)]'}`}>{fmtKm(d)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="grid gap-2">
            <label htmlFor={`${uid}-x`} className="text-sm font-medium text-[var(--text-strong)]">Complément <span className="font-normal text-[var(--text-muted)]">facultatif</span></label>
            <input id={`${uid}-x`} autoComplete="address-line2" placeholder="Bâtiment, étage, code d’entrée" className="h-12 w-full rounded-lg border border-[var(--border-control)] bg-[var(--surface)] px-4 text-base text-[var(--text-strong)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-subtle)] md:h-11" />
          </div>

          <div aria-live="polite" className={`grid grid-cols-[32px_minmax(0,1fr)] items-start gap-3 rounded-xl p-4 transition-colors ${RESULT[state].box}`}>
            <span className={`grid h-8 w-8 place-items-center rounded-full bg-[var(--surface)] ${RESULT[state].fg}`}><Icon d={RESULT[state].icon} className="h-[18px] w-[18px]" /></span>
            <div>
              <p className={`m-0 text-sm font-semibold ${state === 'idle' ? 'text-[var(--text-strong)]' : RESULT[state].fg}`}>{msg[0]}</p>
              <p className={`m-0 mt-0.5 text-sm ${RESULT[state].fg}`}>{msg[1]}</p>
            </div>
          </div>

          <button type="button" disabled={!(state === 'ok' || state === 'far')} className="mt-auto h-12 rounded-lg bg-[var(--accent)] text-sm font-semibold text-[var(--accent-fg)] transition hover:bg-[var(--accent-hover)] active:scale-[.985] disabled:cursor-not-allowed disabled:bg-[var(--raised)] disabled:text-[var(--text-disabled)] md:h-11">Continuer vers le paiement</button>
        </section>

        <div role="img" aria-label={chosen ? `Plan : ${value}${state === 'ok' ? ', dans la zone de livraison à vélo' : state === 'far' ? ', hors de la zone de livraison à vélo' : ''}` : 'Plan de Lyon avec la zone de livraison à vélo'}
          className="relative -order-1 h-[280px] overflow-hidden border-b border-[var(--border)] bg-[var(--raised)] md:order-none md:h-auto md:border-b-0">
          <svg ref={svgRef} viewBox={frame.vb} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 block h-full w-full" aria-hidden="true">
            <defs>{grids.map((g, i) => <clipPath key={i} id={`${uid}c${i}`}><polygon points={g.pts} /></clipPath>)}</defs>
            <rect x="-1000" y="-1000" width="3000" height="3000" fill="var(--raised)" />
            <g className={`transition-opacity duration-300 ${mapStyle === 'epure' ? 'opacity-0' : ''}`}>
              {grids.map((g, i) => <g key={i} clipPath={`url(#${uid}c${i})`}><path d={g.d} transform={`rotate(${g.rot} 500 500)`} fill="none" stroke="var(--surface)" strokeWidth="1.25" vectorEffect="non-scaling-stroke" /></g>)}
              <path d="M905 -40C900 200 890 420 880 600S860 900 850 1040" fill="none" stroke="var(--border-control)" strokeWidth="1.5" strokeDasharray="2 5" opacity=".6" vectorEffect="non-scaling-stroke" />
              <g fill="var(--tint-green-bg)"><ellipse cx="845" cy="150" rx="125" ry="92" /><ellipse cx="225" cy="470" rx="88" ry="112" /><rect x="430" y="660" width="86" height="46" rx="8" /></g>
              <ellipse cx="860" cy="150" rx="40" ry="22" fill="var(--tint-blue-bg)" />
            </g>
            <g fill="none" strokeLinecap="round">
              {STREETS.map((st) => <path key={st.n} d={`M${st.a}L${st.b}`} strokeWidth={mapStyle === 'epure' ? 4 : 7} stroke={chosen?.st.n === st.n || (!chosen && opts[active]?.st.n === st.n) ? 'var(--accent-subtle-border)' : 'var(--surface)'} />)}
            </g>
            <g fill="none" stroke="var(--tint-blue-bg)" strokeLinecap="round">
              <path d="M300-40C320 120 262 220 302 330S382 520 402 640S470 860 520 962" strokeWidth="30" />
              <path d="M770-40C726 140 702 262 662 382S602 560 592 700S560 880 520 962L548 1060" strokeWidth="46" />
            </g>
            <g fill="none" stroke="var(--surface)" strokeWidth="7">{BRIDGES.map((b, i) => <path key={i} d={`M${b[0]} ${b[2]}L${b[1]} ${b[2] + 4}`} />)}</g>
            {showZone && <circle cx={SHOP[0]} cy={SHOP[1]} r={zone} style={{ fill: 'color-mix(in srgb, var(--accent-vivid) 5%, transparent)' }} stroke="var(--accent-vivid)" strokeWidth="1.5" strokeDasharray="5 6" vectorEffect="non-scaling-stroke" />}
            {showRoute && route && (
              <path key={routeKey} d={route} pathLength="1" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke"
                strokeDasharray="1" className="animate-[adr-route_900ms_cubic-bezier(.65,0,.35,1)_160ms_both] motion-reduce:animate-none" />
            )}
            <g className="font-mono uppercase" fill="var(--text-muted)" style={{ fontSize: 10.5 * u, letterSpacing: '.08em', paintOrder: 'stroke', stroke: 'var(--raised)', strokeWidth: 3 * u }}>
              {LABELS.map(([t, x, y, r]) => <text key={t} x={x} y={y} textAnchor="middle" transform={r ? `rotate(${r} ${x} ${y})` : undefined}>{t}</text>)}
            </g>
            <g className="font-sans italic" fill="var(--tint-blue-fg)" opacity=".8" style={{ fontSize: 13 * u }}>
              <text x="296" y="270" textAnchor="middle" transform="rotate(82 296 270)">Saône</text>
              <text x="640" y="470" textAnchor="middle" transform="rotate(106 640 470)">Rhône</text>
            </g>
            <g transform={`translate(${SHOP}) scale(${u})`}>
              <circle r="15" style={{ fill: 'color-mix(in srgb, var(--accent) 18%, transparent)' }} />
              <circle r="8" fill="var(--accent)" stroke="var(--surface)" strokeWidth="3" />
            </g>
            {chosen && (
              <g transform={`translate(${chosen.p}) scale(${u})`}>
                <ellipse rx="9" ry="3.5" fill="var(--text-strong)" opacity=".18" transform={`scale(${0.5 + 0.5 * Math.min(1, 1 + frame.pinY / 60)})`} />
                <circle r="10" fill="none" stroke="var(--accent-vivid)" strokeWidth="2" key={routeKey} className="animate-[adr-ping_1200ms_cubic-bezier(.16,1,.3,1)_260ms_both] motion-reduce:hidden" />
                <g transform={`translate(0 ${frame.pinY}) scale(${0.6 + 0.4 * frame.pinS})`}>
                  <path d="M0 0C-3-6-14-14-14-25a14 14 0 0 1 28 0C14-14 3-6 0 0z" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2.5" strokeLinejoin="round" />
                  <circle cy="-25" r="5" fill="var(--surface)" />
                </g>
              </g>
            )}
          </svg>
          <style>{'@keyframes adr-route{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}@keyframes adr-ping{0%{opacity:.9;r:6}100%{opacity:0;r:44}}'}</style>
          <div className="absolute bottom-3 right-3 grid grid-flow-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-overlay)] md:bottom-auto md:right-4 md:top-4 md:grid-flow-row">
            {[['Zoomer', 'M12 6v12M6 12h12', () => zoomBy(1.5)], ['Dézoomer', 'M6 12h12', () => zoomBy(1 / 1.5)], ['Voir toute la zone', 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5', fit]].map(([l, d, fn], i) => (
              <button key={l} type="button" aria-label={l} onClick={fn} className={`grid h-11 w-11 place-items-center text-[var(--text)] hover:bg-[var(--state-hover)] hover:text-[var(--text-strong)] ${i ? 'border-l border-[var(--border)] md:border-l-0 md:border-t' : ''}`}><Icon d={d} className="h-[18px] w-[18px]" /></button>
            ))}
          </div>
          {showZone && (
            <p className="absolute bottom-4 left-3 m-0 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 font-mono text-xs tabular-nums text-[var(--text)] md:left-4">
              <span className="h-2.5 w-2.5 rounded-full border-[1.5px] border-dashed border-[var(--accent-vivid)]" aria-hidden="true" />Zone vélo · {zoneKm.toFixed(1).replace('.', ',')}&nbsp;km
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
