// Rampe OKLCH — React + Tailwind CSS. Interface en variables de tokens.css ; les 12 paliers sont calculés
// (OKLCH → sRGB, chroma réduit dans la gamme), contrastes WCAG 2 et APCA vérifiés en direct. Aucune dépendance.
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const ROLES = ['Fond de l’app', 'Fond subtil', 'Élément', 'Élément survolé', 'Élément actif', 'Bordure subtile', 'Bordure', 'Bordure forte', 'Plein', 'Plein survolé', 'Texte doux', 'Texte fort'];
const CMAX = 0.37;

/* ——— Couleur ——— */
function lch2lin(L, C, H) {
  const h = (H * Math.PI) / 180, a = C * Math.cos(h), b = C * Math.sin(h);
  let l = L + 0.3963377774 * a + 0.2158037573 * b, m = L - 0.1055613458 * a - 0.0638541728 * b, s = L - 0.0894841775 * a - 1.291485548 * b;
  l **= 3; m **= 3; s **= 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}
const inGamut = (c) => c.every((v) => v >= -1e-4 && v <= 1.0001);
const gam = (v) => { v = Math.min(1, Math.max(0, v)); return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055; };
const ungam = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
export function maxChroma(L, H) { let lo = 0, hi = CMAX; for (let i = 0; i < 16; i++) { const mid = (lo + hi) / 2; if (inGamut(lch2lin(L, mid, H))) lo = mid; else hi = mid; } return lo; }
const toHex = (lin) => '#' + lin.map((v) => Math.round(gam(v) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
function srgb2lch([R, G, B]) {
  const r = ungam(R), g = ungam(G), b = ungam(B);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, Bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, Bb), ((Math.atan2(Bb, A) * 180) / Math.PI + 360) % 360];
}
let ctx;
function cssRgb(c) {
  if (!ctx) { const cv = document.createElement('canvas'); cv.width = cv.height = 1; ctx = cv.getContext('2d', { willReadFrequently: true }); }
  ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0] / 255, d[1] / 255, d[2] / 255];
}
const clampLin = (c) => c.map((v) => Math.min(1, Math.max(0, v)));
const Y = (c) => { const [r, g, b] = clampLin(c); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const wcag = (a, b) => { const x = Y(a), y = Y(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
function apca(txt, bg) { // APCA-W3 0.0.98G, valeur absolue de Lc
  const f = (c) => { const [r, g, b] = clampLin(c).map(gam); return 0.2126729 * r ** 2.4 + 0.7151522 * g ** 2.4 + 0.072175 * b ** 2.4; };
  let yt = f(txt), yb = f(bg); const bt = 0.022;
  if (yt < bt) yt += (bt - yt) ** 1.414; if (yb < bt) yb += (bt - yb) ** 1.414;
  if (Math.abs(yb - yt) < 0.0005) return 0;
  const S = yb > yt ? (yb ** 0.56 - yt ** 0.57) * 1.14 : (yb ** 0.65 - yt ** 0.62) * 1.14;
  return Math.abs(S) < 0.1 ? 0 : Math.abs((S > 0 ? S - 0.027 : S + 0.027) * 100);
}
const WHITE = [1, 1, 1], BLACK = [0, 0, 0];
const fr = (n, d = 2) => n.toFixed(d).replace('.', ',');

/** 12 paliers réguliers à l'œil autour de la couleur de base (palier 9). */
export function makeRamp(H, L9, C9, mode = 'clair') {
  const c = (x) => Math.min(0.99, Math.max(0.05, x));
  let Ls, Cf;
  if (mode === 'sombre') {
    const Ld = Math.min(0.76, Math.max(0.56, L9));
    Ls = [0.165, 0.195, 0.24, 0.275, 0.31, 0.35, 0.405, 0.48, Ld, Ld + 0.04, 0.8, 0.945];
    Cf = [0.1, 0.14, 0.28, 0.38, 0.46, 0.52, 0.6, 0.72, 1, 1, 0.72, 0.24];
  } else {
    const l11 = Math.min(L9 - 0.08, 0.53);
    Ls = [0.988, 0.972, 0.948, 0.922, 0.893, 0.852, 0.79, 0.66, L9, L9 - 0.045, l11, Math.min(0.3, l11 - 0.14)];
    Cf = [0.012, 0.03, 0.07, 0.11, 0.15, 0.21, 0.3, 0.5, 1, 1.02, 0.9, 0.42];
  }
  return Ls.map((L0, i) => {
    const L = c(L0), C = Math.min(C9 * Cf[i], maxChroma(L, H)), lin = lch2lin(L, C, H);
    const fg = wcag(WHITE, lin) >= wcag(BLACK, lin) ? '#FFFFFF' : '#000000';
    return { n: i + 1, L, C, H, lin, hex: toHex(lin), fg, role: ROLES[i] };
  });
}

/**
 * @param {{ teinte?: number, clarte?: number, chroma?: number, suivre?: boolean, mode?: 'clair'|'sombre', selection?: number,
 *   onChange?: (steps: {n:number, hex:string, L:number, C:number, H:number}[]) => void }} props
 */
export function OklchRamp({ teinte = 265, clarte = 52, chroma = 0.13, suivre = true, mode: mode0 = 'clair', selection = 9, onChange }) {
  const root = useRef(null), plane = useRef(null), canvas = useRef(null), hueCanvas = useRef(null), handle = useRef(null), stepsRef = useRef(null);
  const [st, setSt] = useState({ H: teinte, L: clarte / 100, C: chroma });
  const [follow, setFollow] = useState(suivre);
  const [mode, setMode] = useState(mode0);
  const [sel, setSel] = useState(selection);
  const [fmt, setFmt] = useState('oklch');
  const [copied, setCopied] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const spring = useRef({ x: 0, y: 0, vx: 0, vy: 0, raf: 0 });
  const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => setMode(mode0), [mode0]);
  useEffect(() => setSel(selection), [selection]);
  useEffect(() => { setFollow(suivre); if (!suivre) setSt({ H: teinte, L: clarte / 100, C: Math.min(chroma, maxChroma(clarte / 100, teinte)) }); }, [suivre, teinte, clarte, chroma]);

  /* Partir de l'accent : lit --accent (palette tokens.css) et suit ses changements. */
  useLayoutEffect(() => {
    if (!follow) return;
    const read = () => {
      const v = getComputedStyle(root.current).getPropertyValue('--accent').trim(); if (!v) return;
      const [L, C, H] = srgb2lch(cssRgb(v));
      if (C < 0.02) return setSt((s) => ({ ...s, C: 0.02, L: Math.max(0.4, Math.min(0.62, L)) }));
      const L9 = Math.max(0.4, Math.min(0.75, L)), Hh = Math.round(H);
      setSt({ H: Hh, L: L9, C: Math.min(C, maxChroma(L9, Hh)) });
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-accent', 'style'] });
    return () => mo.disconnect();
  }, [follow]);

  const steps = useMemo(() => makeRamp(st.H, st.L, st.C, mode), [st, mode]);
  useEffect(() => { onChange && onChange(steps); }, [steps, onChange]);

  /* Plan clarté × chroma et bande de teintes */
  useEffect(() => {
    const W = 150, H = 100, cv = canvas.current; cv.width = W; cv.height = H;
    const g = cv.getContext('2d'), img = g.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const lin = lch2lin(1 - y / (H - 1), (x / (W - 1)) * CMAX, st.H);
      if (!inGamut(lin)) continue;
      const k = (y * W + x) * 4; img.data[k] = gam(lin[0]) * 255; img.data[k + 1] = gam(lin[1]) * 255; img.data[k + 2] = gam(lin[2]) * 255; img.data[k + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }, [st.H]);
  useEffect(() => {
    const cv = hueCanvas.current; cv.width = 360; cv.height = 1;
    const g = cv.getContext('2d'), img = g.createImageData(360, 1);
    for (let i = 0; i < 360; i++) { const lin = lch2lin(0.7, Math.min(0.13, maxChroma(0.7, i)), i); img.data.set([gam(lin[0]) * 255, gam(lin[1]) * 255, gam(lin[2]) * 255, 255], i * 4); }
    g.putImageData(img, 0, 0);
  }, []);
  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(plane.current); return () => ro.disconnect();
  }, []);
  const pos = useCallback((L, C) => [(C / CMAX) * size.w, (1 - L) * size.h], [size]);

  /* Poignée sur ressort (raideur 260, amortissement 22). */
  useEffect(() => {
    const s = spring.current, el = handle.current; if (!size.w) return;
    const target = () => pos(st.L, st.C);
    if (reduce() || !s.init) { [s.x, s.y] = target(); s.init = true; el.style.transform = `translate(${s.x}px,${s.y}px)`; return; }
    cancelAnimationFrame(s.raf);
    let last = performance.now();
    const tick = (t) => {
      const dt = Math.min(0.032, (t - last) / 1000); last = t; const [qx, qy] = target();
      s.vx += ((qx - s.x) * 260 - s.vx * 22) * dt; s.vy += ((qy - s.y) * 260 - s.vy * 22) * dt; s.x += s.vx * dt; s.y += s.vy * dt;
      el.style.transform = `translate(${s.x.toFixed(2)}px,${s.y.toFixed(2)}px)`;
      if (Math.abs(qx - s.x) + Math.abs(qy - s.y) < 0.3 && Math.abs(s.vx) + Math.abs(s.vy) < 3) { el.style.transform = `translate(${qx}px,${qy}px)`; return; }
      s.raf = requestAnimationFrame(tick);
    };
    s.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(s.raf);
  }, [st.L, st.C, size, pos]);

  /* Vague de ressort sur les cases quand la teinte ou la rampe changent. */
  useEffect(() => {
    if (reduce() || !stepsRef.current) return;
    const btns = [...stepsRef.current.querySelectorAll('button')], t0 = performance.now(); let raf;
    const f = (t) => {
      let done = true;
      btns.forEach((b, i) => { const tt = (t - t0) / 1000 - i * 0.025; if (tt < 0.9) done = false; b.style.setProperty('--lift', `${tt < 0 ? 0 : (-6 * Math.exp(-7 * tt) * Math.sin(16 * tt)).toFixed(2)}px`); });
      if (!done) raf = requestAnimationFrame(f); else btns.forEach((b) => b.style.setProperty('--lift', '0px'));
    };
    raf = requestAnimationFrame(f); return () => cancelAnimationFrame(raf);
  }, [st.H, mode]);

  const setFromPointer = (e) => {
    const r = plane.current.getBoundingClientRect();
    const L = Math.max(0.3, Math.min(0.85, 1 - (e.clientY - r.top) / r.height));
    const C = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * CMAX;
    setFollow(false); setSt((s) => ({ ...s, L, C: Math.min(C, maxChroma(L, s.H)) }));
  };
  const [dragging, setDragging] = useState(false);
  const onHandleKey = (e) => {
    const k = e.shiftKey ? 5 : 1, d = { ArrowUp: [0.01, 0], ArrowDown: [-0.01, 0], ArrowRight: [0, 0.005], ArrowLeft: [0, -0.005] }[e.key];
    if (!d) return; e.preventDefault(); setFollow(false);
    setSt((s) => { const L = Math.max(0.3, Math.min(0.85, s.L + d[0] * k)); return { ...s, L, C: Math.min(Math.max(0, s.C + d[1] * k), maxChroma(L, s.H)) }; });
  };

  const nine = steps[8];
  const tx = mode === 'sombre' ? steps[0] : steps[11];
  const cands = [[WHITE, '#FFFFFF'], [tx.lin, tx.hex]];
  const fg9 = (cands.find(([c]) => wcag(c, nine.lin) >= 4.5) || [...cands, [BLACK, '#000000']].sort((x, y) => wcag(y[0], nine.lin) - wcag(x[0], nine.lin))[0])[1];
  const bg = steps[mode === 'sombre' ? 0 : 1];
  const checks = [
    ['Texte fort sur fond', steps[11], steps[1], 7, 'AAA'], ['Texte doux sur fond', steps[10], steps[1], 4.5, 'AA'],
    ['Libellé sur plein', { lin: cssRgb(fg9).map(ungam), hex: fg9 }, nine, 4.5, 'AA'], ['Plein sur fond (composant)', nine, steps[0], 3, '3:1'],
    ['Bordure forte sur fond', steps[7], steps[0], 3, '3:1'], ['Texte fort · APCA', steps[11], steps[1], 90, 'Lc 90', true], ['Texte doux · APCA', steps[10], steps[1], 60, 'Lc 60', true],
  ].map(([label, a, b, min, tag, isApca]) => { const v = isApca ? apca(a.lin, b.lin) : wcag(a.lin, b.lin); const ok = v >= min; return { label, a, b, v, ok, isApca, tag: !ok ? 'Échec' : !isApca && v >= 7 ? 'AAA' : tag }; });
  const pass = checks.filter((c) => c.ok).length;
  const s = steps[sel - 1], onBg = wcag(s.lin, bg.lin), lvl = (k) => (k >= 7 ? 'AAA' : k >= 4.5 ? 'AA' : k >= 3 ? 'AA large' : '—');

  const code = fmt === 'tw'
    ? `// tailwind.config.js — rampe ${mode === 'sombre' ? 'sombre' : 'claire'}\ncolors: {\n  teinte: {\n${steps.map((x) => `    ${x.n}: '${x.hex}',`).join('\n')}\n  },\n}`
    : `/* Rampe ${mode === 'sombre' ? 'sombre' : 'claire'} · teinte ${Math.round(st.H)}° */\n${mode === 'sombre' ? '.dark' : ':root'} {\n${steps.map((x) => `  --teinte-${x.n}: ${fmt === 'hex' ? x.hex : `oklch(${(x.L * 100).toFixed(1)}% ${x.C.toFixed(3)} ${x.H.toFixed(1)})`};`).join('\n')}\n}`;
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* sélection manuelle */ } };
  const hueLin = lch2lin(0.7, Math.min(0.13, maxChroma(0.7, st.H)), st.H);
  const vars = Object.fromEntries(steps.map((x) => [`--r${x.n}`, x.hex]));
  const caps = 'font-mono text-xs uppercase tracking-[0.04em] text-[var(--text-muted)]';
  const card = 'min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4';
  const lvlCls = (t) => (t === 'Échec' ? 'bg-[var(--tint-red-bg)] text-[var(--tint-red-fg)]' : t === 'AAA' ? 'bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]' : 'bg-[var(--tint-blue-bg)] text-[var(--tint-blue-fg)]');

  return (
    <section ref={root} aria-label="Rampe OKLCH" style={{ ...vars, '--r9-fg': fg9 }} className="@container mx-auto w-full max-w-[1240px] font-sans text-[var(--text)]">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 @[1040px]:grid-cols-[360px_minmax(0,1fr)] @[1040px]:items-start @[1040px]:gap-10">
        {/* Sélecteur */}
        <div className="grid min-w-0 content-start gap-4 @[1040px]:sticky @[1040px]:top-6">
          <header>
            <p className={`m-0 ${caps}`}>Couleur de base · palier 9</p>
            <p className="m-0 mt-2 flex flex-wrap items-center gap-3">
              <span className="size-8 rounded-lg shadow-[inset_0_0_0_1px_var(--border)]" style={{ background: nine.hex }} />
              <b className="text-[22px] font-semibold tracking-[-0.02em] tabular-nums text-[var(--text-strong)]">{nine.hex}</b>
              <code className="font-mono text-[13px] text-[var(--text-muted)]">oklch({fr(nine.L * 100, 1)} % {fr(nine.C, 3)} {Math.round(nine.H)})</code>
            </p>
          </header>
          <div ref={plane} className="relative aspect-[3/2] cursor-crosshair touch-none overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--raised)] @[640px]:aspect-video @[1040px]:aspect-square"
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDragging(true); setFromPointer(e); }}
            onPointerMove={(e) => dragging && setFromPointer(e)} onPointerUp={() => setDragging(false)} onPointerCancel={() => setDragging(false)}>
            <canvas ref={canvas} aria-hidden className="absolute inset-0 block size-full" />
            <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible" viewBox={`0 0 ${size.w || 1} ${size.h || 1}`}>
              <path fill="none" stroke="var(--text-strong)" strokeWidth="1.25" opacity=".5" d={Array.from({ length: 49 }, (_, i) => { const L = 1 - i / 48, [x, y] = pos(L, maxChroma(L, st.H)); return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; }).join('')} />
              <polyline fill="none" stroke="var(--text-strong)" strokeWidth="1.5" strokeDasharray="3 4" opacity=".55" points={steps.map((x) => pos(x.L, x.C).map((v) => v.toFixed(1)).join(',')).join(' ')} />
              {steps.map((x) => { const [cx, cy] = pos(x.L, x.C); return <circle key={x.n} cx={cx} cy={cy} r={x.n === sel ? 5 : 3.5} fill="var(--surface)" stroke="var(--text-strong)" strokeWidth={x.n === sel ? 3 : 1.5} />; })}
            </svg>
            <div ref={handle} role="slider" tabIndex={0} aria-label="Clarté et chroma de la couleur de base" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(st.L * 100)}
              aria-valuetext={`Clarté ${Math.round(st.L * 100)} %, chroma ${fr(st.C, 3)}, teinte ${Math.round(st.H)}°`} onKeyDown={onHandleKey}
              className={`absolute left-0 top-0 -ml-3.5 -mt-3.5 size-7 rounded-full border-[3px] border-[var(--surface)] shadow-[0_0_0_1px_var(--text-strong),var(--shadow-popover)] outline-none transition-[scale] duration-300 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] focus-visible:shadow-[0_0_0_1px_var(--text-strong),0_0_0_4px_var(--focus-ring)] ${dragging ? 'scale-[1.18] cursor-grabbing' : 'cursor-grab'}`}
              style={{ background: nine.hex }} />
            <span aria-hidden className="pointer-events-none absolute right-2.5 top-2.5 font-mono text-[11px] uppercase tracking-[0.04em] text-[var(--text-muted)]">Clarté ↑</span>
            <span aria-hidden className="pointer-events-none absolute bottom-2.5 right-2.5 font-mono text-[11px] uppercase tracking-[0.04em] text-[var(--text-muted)]">Chroma →</span>
          </div>
          <label className="grid gap-2">
            <span className={caps}>Teinte <output className="ml-1 text-[var(--text-strong)]">{Math.round(st.H)}°</output></span>
            <span className="relative block h-11">
              <canvas ref={hueCanvas} aria-hidden className="absolute inset-x-0 top-3 h-5 w-full rounded-full shadow-[inset_0_0_0_1px_var(--border)]" />
              <input type="range" min="0" max="360" step="1" value={Math.round(st.H)}
                onChange={(e) => { const H = +e.target.value; setFollow(false); setSt((v) => ({ ...v, H, C: Math.min(v.C, maxChroma(v.L, H)) })); }}
                style={{ '--hue-c': toHex(hueLin) }}
                className="absolute inset-0 m-0 h-11 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:size-[22px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-[var(--surface)] [&::-moz-range-thumb]:bg-[var(--hue-c)] [&::-webkit-slider-thumb]:size-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-[var(--surface)] [&::-webkit-slider-thumb]:bg-[var(--hue-c)] [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_var(--text-strong),var(--shadow-popover)] focus-visible:outline-none focus-visible:[&::-webkit-slider-thumb]:shadow-[0_0_0_1px_var(--text-strong),0_0_0_4px_var(--focus-ring)]" />
            </span>
          </label>
          <button type="button" aria-pressed={follow} onClick={() => setFollow((f) => !f)}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 justify-self-start rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)] aria-pressed:border-[var(--accent-subtle-border)] aria-pressed:bg-[var(--accent-subtle)] aria-pressed:text-[var(--accent)]">
            Partir de l’accent de la palette
          </button>
        </div>

        {/* Paliers, détail, vérifications, aperçu, export */}
        <div className="grid min-w-0 content-start gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="radiogroup" aria-label="Rampe affichée" className="inline-flex gap-1 rounded-full border border-[var(--border)] bg-[var(--raised)] p-1">
              {[['clair', 'Rampe claire'], ['sombre', 'Rampe sombre']].map(([m, l]) => (
                <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)}
                  className="min-h-9 cursor-pointer rounded-full px-3.5 text-sm font-medium text-[var(--text-muted)] transition-colors aria-checked:bg-[var(--surface)] aria-checked:text-[var(--text-strong)] aria-checked:shadow-[var(--shadow-overlay)]">{l}</button>
              ))}
            </div>
            <p aria-live="polite" className="m-0 text-sm text-[var(--text-muted)]"><b className="tabular-nums text-[var(--text-strong)]">{pass}</b>/{checks.length} vérifications réussies</p>
          </div>

          <ol ref={stepsRef} aria-label="Les 12 paliers" className="m-0 grid list-none grid-cols-4 gap-1.5 p-0 @[480px]:grid-cols-6 @[640px]:grid-cols-12"
            onKeyDown={(e) => { const d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 1, ArrowUp: -1 }[e.key]; if (!d) return; e.preventDefault(); const n = Math.max(1, Math.min(12, sel + d)); setSel(n); stepsRef.current.querySelector(`[data-n="${n}"]`).focus(); }}>
            {steps.map((x) => (
              <li key={x.n}>
                <button type="button" data-n={x.n} aria-pressed={sel === x.n} tabIndex={sel === x.n ? 0 : -1} onClick={() => setSel(x.n)} aria-label={`Palier ${x.n}, ${x.role}, ${x.hex}`}
                  style={{ background: x.hex, color: x.fg, transform: 'translateY(var(--lift, 0px))', boxShadow: x.L > 0.9 || x.L < 0.2 ? 'inset 0 0 0 1px var(--border)' : 'none' }}
                  className="grid min-h-[88px] w-full cursor-pointer content-between rounded-xl p-2.5 text-left transition-colors duration-[260ms] aria-pressed:outline aria-pressed:outline-2 aria-pressed:outline-offset-2 aria-pressed:outline-[var(--text-strong)] focus-visible:outline-[var(--focus-ring)] @[640px]:min-h-[148px] @[640px]:px-2">
                  <b className="font-mono text-[15px] font-semibold leading-none">{x.n}</b>
                  <small className="font-mono text-[11px] tabular-nums opacity-90 @[640px]:rotate-180 @[640px]:[writing-mode:vertical-rl]">{x.hex}</small>
                </button>
              </li>
            ))}
          </ol>

          <div className="grid gap-4 @[640px]:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <article aria-live="polite" className={`${card} grid content-start gap-3`}>
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-xl font-semibold shadow-[inset_0_0_0_1px_var(--border)]" style={{ background: s.hex, color: s.fg }}>{s.n}</span>
                <div><b className="block text-base font-semibold text-[var(--text-strong)]">{s.role}</b><span className="text-[13px] text-[var(--text-muted)]">Palier {s.n} sur 12</span></div>
              </div>
              <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                {[['Hex', s.hex], ['OKLCH', `${fr(s.L * 100, 1)} % ${fr(s.C, 3)} ${Math.round(s.H)}`], ['Texte blanc', `${fr(wcag(WHITE, s.lin))}:1 ${lvl(wcag(WHITE, s.lin))}`], ['Texte noir', `${fr(wcag(BLACK, s.lin))}:1 ${lvl(wcag(BLACK, s.lin))}`], [`Sur le fond (palier ${bg.n})`, `${fr(onBg)}:1 · Lc ${fr(apca(s.lin, bg.lin), 0)}`]].map(([k, v]) => (
                  <Fragment key={k}><dt className="text-[var(--text-muted)]">{k}</dt><dd className="m-0 text-right font-mono text-[13px] font-medium tabular-nums text-[var(--text-strong)]">{v}</dd></Fragment>
                ))}
              </dl>
            </article>
            <article className={`${card} grid content-start gap-2.5`}>
              <p className={`m-0 ${caps}`}>Vérifications</p>
              <ul className="m-0 grid list-none gap-1 p-0">
                {checks.map((c) => (
                  <li key={c.label} className="grid min-h-10 grid-cols-[32px_1fr_auto_auto] items-center gap-2.5 text-sm">
                    <span aria-hidden className="grid h-7 w-8 place-items-center rounded-lg text-xs font-semibold shadow-[inset_0_0_0_1px_var(--border)]" style={{ background: c.b.hex, color: c.a.hex }}>Aa</span>
                    <span>{c.label}</span>
                    <span className="whitespace-nowrap font-mono text-[13px] font-medium tabular-nums text-[var(--text-strong)]">{c.isApca ? `Lc ${fr(c.v, 0)}` : `${fr(c.v)}:1`}</span>
                    <span className={`min-w-11 rounded-full px-1.5 py-1 text-center font-mono text-[11px] font-medium ${lvlCls(c.tag)}`}>{c.tag}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          {/* Aperçu (marque fictive Nacre) : uniquement les paliers générés */}
          <article aria-label="Aperçu avec la rampe" className="grid gap-4 rounded-2xl border border-[var(--r6)] bg-[var(--r1)] p-4 text-[var(--r12)] transition-colors duration-[260ms]">
            <header className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2">
                <svg viewBox="0 0 100 100" className="size-7" aria-hidden><rect width="100" height="100" rx="28" fill="var(--r9)" /><path d="M20 66a30 30 0 0 1 60 0M32 66a18 18 0 0 1 36 0" fill="none" stroke="var(--r9-fg)" strokeWidth="7" strokeLinecap="round" /><circle cx="50" cy="66" r="7" fill="var(--r9-fg)" /></svg>
                <b className="text-lg font-semibold tracking-[-0.02em]">Nacre</b>
              </span>
              <span className="rounded-full border border-[var(--r6)] bg-[var(--r3)] px-2.5 py-1 text-xs font-medium text-[var(--r11)]">Compte Pro</span>
            </header>
            <div className="grid gap-4 @[640px]:grid-cols-2">
              <div>
                <p className="m-0 text-[13px] text-[var(--r11)]">Solde disponible</p>
                <p className="m-0 text-[30px] font-semibold leading-9 tracking-[-0.02em] tabular-nums">12&nbsp;480,35&nbsp;€</p>
                <p className="m-0 text-[13px] text-[var(--r11)]">+&nbsp;1&nbsp;240&nbsp;€ ce mois-ci · <a href="#" className="font-medium text-[var(--r11)] underline-offset-[3px]">Voir le relevé</a></p>
              </div>
              <div className="grid content-end gap-2 rounded-xl border border-[var(--r5)] bg-[var(--r2)] p-3">
                <p className="m-0 text-[13px] text-[var(--r11)]">Épargne vacances</p>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--r4)]"><i className="block h-full w-[65%] rounded-full bg-[var(--r9)]" /></div>
                <p className="m-0 text-[13px] text-[var(--r11)]">2&nbsp;600&nbsp;€ sur 4&nbsp;000&nbsp;€</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="min-h-11 rounded-lg bg-[var(--r9)] px-4 text-sm font-medium text-[var(--r9-fg)] hover:bg-[var(--r10)]">Virement</button>
              <button type="button" className="min-h-11 rounded-lg bg-[var(--r3)] px-4 text-sm font-medium text-[var(--r11)] hover:bg-[var(--r4)]">Ajouter une carte</button>
            </div>
          </article>

          <div className={`${card} grid grid-cols-[1fr_auto] items-center gap-3`}>
            <div role="tablist" aria-label="Format d’export" className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
              {[['oklch', 'CSS oklch()'], ['hex', 'CSS hex'], ['tw', 'Tailwind']].map(([f, l]) => (
                <button key={f} type="button" role="tab" aria-selected={fmt === f} onClick={() => setFmt(f)}
                  className="min-h-9 cursor-pointer whitespace-nowrap rounded-lg px-3 text-[13px] text-[var(--text-muted)] aria-selected:bg-[var(--raised)] aria-selected:font-medium aria-selected:text-[var(--text-strong)]">{l}</button>
              ))}
            </div>
            <button type="button" onClick={copy} className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-[var(--border-control)] bg-[var(--surface)] px-3.5 text-sm font-medium ${copied ? 'text-[var(--up)]' : 'text-[var(--text-strong)]'}`}>{copied ? 'Copié' : 'Copier'}</button>
            <pre role="tabpanel" className="col-span-2 m-0 max-h-[220px] overflow-auto whitespace-pre rounded-lg bg-[var(--raised)] px-4 py-3 font-mono text-xs leading-5 text-[var(--text-muted)]">{code}</pre>
          </div>
        </div>
      </div>
    </section>
  );
}

export default OklchRamp;
