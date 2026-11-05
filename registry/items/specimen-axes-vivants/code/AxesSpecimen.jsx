// Spécimen à axes vivants — React + Tailwind CSS. Couleurs : variables de tokens.css.
// Polices : déclarez dans votre CSS global
//   @font-face { font-family: "Archivo Var"; src: url(/fonts/archivo.woff2) format("woff2"); font-weight: 100 900; font-stretch: 62% 125%; }
//   @font-face { font-family: "Fraunces Var"; src: url(/fonts/fraunces.woff2) format("woff2"); font-weight: 100 900; }
import { useEffect, useId, useMemo, useRef, useState } from 'react';

export const FONTS = {
  archivo: {
    name: 'Archivo Variable', family: '"Archivo Var", var(--font-sans)',
    axes: [{ tag: 'wght', min: 100, max: 900 }, { tag: 'wdth', min: 62, max: 125, label: 'Chasse', ends: ['Étroit', 'Large'] }],
    presets: [['Étroit léger', 200, 0], ['Texte', 400, 60], ['Titre', 680, 40], ['Affiche', 900, 100]],
  },
  fraunces: {
    name: 'Fraunces Variable', family: '"Fraunces Var", Georgia, serif',
    axes: [{ tag: 'wght', min: 100, max: 900 }, { tag: 'SOFT', min: 0, max: 100, label: 'Douceur', ends: ['Vif', 'Doux'] }],
    presets: [['Fin vif', 200, 0], ['Texte', 400, 30], ['Titre', 640, 60], ['Gras doux', 900, 100]],
  },
};

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
const lerpAxis = (n, ax) => ax.min + n * (ax.max - ax.min);
const toFvs = (f, nw, ns) => `"${f.axes[0].tag}" ${Math.round(lerpAxis(nw, f.axes[0]))}, "${f.axes[1].tag}" ${lerpAxis(ns, f.axes[1]).toFixed(1)}`;

/** Titre dont chaque lettre suit le pointeur sur un ressort. */
export function LivingTitle({ text, font, mode, weight, second, peak, peakSecond, radius, stiffness, damping, onNear }) {
  const ref = useRef(null);
  const cfg = useRef({});
  const f = FONTS[font] || FONTS.archivo;
  cfg.current = { f, mode, bw: (weight - 100) / 800, bs: second / 100, pw: (peak - 100) / 800, ps: peakSecond / 100, radius, stiffness, damping, onNear };
  const letters = useMemo(() => Array.from(text || ' '), [text]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const spans = Array.from(el.querySelectorAll('[data-l]'));
    const st = spans.map(() => ({ w: cfg.current.bw, s: cfg.current.bs, vw: 0, vs: 0 }));
    let pointer = null, raf = 0, last = 0, visible = true, timer = 0;
    const t0 = performance.now();

    const frame = (now) => {
      raf = 0;
      if (!visible) return;
      const c = cfg.current, dt = last ? Math.min(0.033, (now - last) / 1000) : 1 / 60;
      last = now;
      const m = reduce && c.mode === 'vague' ? 'fixe' : c.mode;
      const rects = m === 'survol' && pointer ? spans.map((s) => s.getBoundingClientRect()) : null;
      let moving = false, best = -1, bestD = Infinity;
      spans.forEach((span, i) => {
        let inf = 0;
        if (m === 'vague') { inf = smooth(0.5 + 0.5 * Math.sin(((now - t0) / 1000) * 2.4 - i * 0.62)); moving = true; }
        else if (rects) {
          const r = rects[i], dx = pointer.x - (r.left + r.width / 2), dy = pointer.y - (r.top + r.height / 2);
          const d = Math.sqrt(dx * dx + dy * dy * 1.6);
          inf = smooth(clamp(1 - d / c.radius, 0, 1));
          if (d < bestD) { bestD = d; best = i; }
        }
        const s = st[i], tw = c.bw + (c.pw - c.bw) * inf, ts = c.bs + (c.ps - c.bs) * inf;
        if (reduce) { s.w = tw; s.s = ts; s.vw = s.vs = 0; }
        else {
          s.vw += (-c.stiffness * (s.w - tw) - c.damping * s.vw) * dt; s.w += s.vw * dt;
          s.vs += (-c.stiffness * (s.s - ts) - c.damping * s.vs) * dt; s.s += s.vs * dt;
          if (Math.abs(s.w - tw) + Math.abs(s.s - ts) + Math.abs(s.vw) + Math.abs(s.vs) > 0.0008) moving = true;
        }
        span.style.fontVariationSettings = toFvs(c.f, clamp(s.w, 0, 1), clamp(s.s, 0, 1));
      });
      if (c.onNear) c.onNear(best >= 0 && bestD < c.radius * 1.4 ? { char: letters[best], w: Math.round(lerpAxis(clamp(st[best].w, 0, 1), c.f.axes[0])), s: Math.round(lerpAxis(clamp(st[best].s, 0, 1), c.f.axes[1])) } : null);
      if (moving) raf = requestAnimationFrame(frame); else last = 0;
    };
    const wake = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };
    const move = (e) => { pointer = { x: e.clientX, y: e.clientY }; wake(); };
    const leave = (e) => { if (e.pointerType !== 'touch') { pointer = null; wake(); } };
    const up = (e) => { if (e.pointerType === 'touch') { clearTimeout(timer); timer = setTimeout(() => { pointer = null; wake(); }, 420); } };
    const host = el.parentElement;
    host.addEventListener('pointermove', move, { passive: true });
    host.addEventListener('pointerdown', move, { passive: true });
    host.addEventListener('pointerleave', leave);
    host.addEventListener('pointerup', up);
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) wake(); });
    io.observe(el);
    el._wake = wake;
    wake();
    return () => {
      cancelAnimationFrame(raf); clearTimeout(timer); io.disconnect();
      host.removeEventListener('pointermove', move); host.removeEventListener('pointerdown', move);
      host.removeEventListener('pointerleave', leave); host.removeEventListener('pointerup', up);
    };
  }, [letters]);

  // réveille la boucle quand un réglage change
  useEffect(() => { ref.current && ref.current._wake && ref.current._wake(); });

  return (
    <h2 ref={ref} aria-label={text}
      className="relative m-0 select-none whitespace-nowrap px-2 leading-none tracking-[-0.02em] text-[var(--text-strong)] [touch-action:pan-y]"
      style={{ fontFamily: f.family, fontSize: 'clamp(88px, 19cqi, 248px)' }}>
      {letters.map((ch, i) => (
        <span key={i} data-l aria-hidden="true" className="inline-block [will-change:font-variation-settings]">{ch === ' ' ? '\u00a0' : ch}</span>
      ))}
    </h2>
  );
}

function Range({ label, value, min, max, step = 1, display, ends, onChange, id }) {
  const p = ((value - min) / (max - min)) * 100;
  return (
    <label className="grid gap-2" htmlFor={id}>
      <span className="flex items-baseline justify-between text-sm font-medium text-[var(--text-strong)]">
        <span>{label}</span><output className="font-mono tabular-nums">{display}</output>
      </span>
      <span className="relative block h-11">
        <span className="absolute inset-x-0 top-1/2 -mt-0.5 h-1 rounded-full bg-[var(--scale-track)]" />
        <span className="absolute left-0 top-1/2 -mt-0.5 h-1 rounded-full bg-[var(--accent)]" style={{ width: `${p}%` }} />
        <input id={id} type="range" min={min} max={max} step={step} value={value} aria-valuetext={`${label} ${display}`}
          onChange={(e) => onChange(+e.target.value)}
          className="absolute inset-0 m-0 h-full w-full cursor-pointer appearance-none bg-transparent focus-visible:outline-none
            [&::-webkit-slider-thumb]:h-[22px] [&::-webkit-slider-thumb]:w-[22px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-solid [&::-webkit-slider-thumb]:border-[var(--accent)] [&::-webkit-slider-thumb]:bg-[var(--surface)]
            focus-visible:[&::-webkit-slider-thumb]:shadow-[0_0_0_2px_var(--surface),0_0_0_4px_var(--focus-ring)]
            [&::-moz-range-thumb]:h-[18px] [&::-moz-range-thumb]:w-[18px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-solid [&::-moz-range-thumb]:border-[var(--accent)] [&::-moz-range-thumb]:bg-[var(--surface)]" />
      </span>
      <span className="flex justify-between font-mono text-xs text-[var(--text-muted)]"><span>{ends[0]}</span><span>{ends[1]}</span></span>
    </label>
  );
}

export function AxesSpecimen({
  text = 'Ondée',
  font: fontProp = 'archivo',     // 'archivo' | 'fraunces'
  mode: modeProp = 'survol',      // 'survol' | 'vague' | 'fixe'
  weight: weightProp = 300,       // graisse de repos (100–900)
  second: secondProp = 60,        // second axe au repos, en % de sa plage
  peak = 900,                     // graisse au contact du pointeur
  peakSecond = 100,               // second axe au contact, en %
  radius = 160,                   // px d'influence autour du pointeur
  stiffness = 170,
  damping = 18,
  className = '',
}) {
  const [font, setFont] = useState(fontProp);
  const [mode, setMode] = useState(modeProp);
  const [weight, setWeight] = useState(weightProp);
  const [second, setSecond] = useState(secondProp);
  const [near, setNear] = useState(null);
  const uid = useId();
  useEffect(() => setFont(fontProp), [fontProp]);
  useEffect(() => setMode(modeProp), [modeProp]);
  useEffect(() => setWeight(weightProp), [weightProp]);
  useEffect(() => setSecond(secondProp), [secondProp]);

  const f = FONTS[font] || FONTS.archivo;
  const a2 = f.axes[1];
  const fvs = toFvs(f, (weight - 100) / 800, second / 100);
  const padRef = useRef(null);
  const padAt = (e) => {
    const r = padRef.current.getBoundingClientRect();
    setWeight(Math.round(100 + 800 * (1 - clamp((e.clientY - r.top) / r.height, 0, 1))));
    setSecond(+(clamp((e.clientX - r.left) / r.width, 0, 1) * 100).toFixed(1));
  };

  const Seg = ({ label, value, onChange, options }) => (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-[var(--border)] bg-[var(--raised)] p-1">
      {options.map(([v, l], i) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} tabIndex={value === v ? 0 : -1}
          onClick={() => onChange(v)}
          onKeyDown={(e) => { const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (d) { e.preventDefault(); onChange(options[(i + d + options.length) % options.length][0]); } }}
          className={`min-h-9 flex-1 rounded-full px-3.5 text-sm font-medium transition-colors ${value === v ? 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-strong)] shadow-[var(--shadow-overlay)]' : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'}`}>
          {l}
        </button>
      ))}
    </div>
  );

  return (
    <section className={`@container overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] ${className}`} style={{ containerType: 'inline-size' }}>
      <header className="flex flex-wrap items-center gap-4 border-b border-[var(--border)] px-4 py-3 md:pl-6">
        <span className="inline-flex min-h-11 items-center gap-2 text-[var(--text-strong)]">
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
            <defs><clipPath id={`${uid}c`}><circle cx="12" cy="12" r="8.25" /></clipPath></defs>
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path clipPath={`url(#${uid}c)`} fill="var(--accent)" d="M2 13.2c2.5-2 5-2 7.5 0s5 2 7.5 0 4-1.6 6-.6V24H2z" />
          </svg>
          <span className="text-lg font-semibold tracking-[-0.03em]">Ondée</span>
        </span>
        <p className="m-0 min-w-0 flex-1 truncate font-mono text-xs uppercase tracking-[0.04em] text-[var(--text-muted)]">Spécimen · {f.name}</p>
        <div className="flex flex-wrap gap-2">
          <Seg label="Police" value={font} onChange={setFont} options={[['archivo', 'Archivo'], ['fraunces', 'Fraunces']]} />
          <Seg label="Animation du titre" value={mode} onChange={setMode} options={[['survol', 'Survol'], ['vague', 'Vague'], ['fixe', 'Fixe']]} />
        </div>
      </header>

      <div className="relative grid justify-items-center gap-4 px-4 pb-6 pt-8 text-center md:px-6 md:pb-8 md:pt-10">
        <p className="m-0 font-mono text-xs uppercase tracking-[0.04em] text-[var(--text-muted)]">Numéro 14 — Automne</p>
        <LivingTitle text={text} font={font} mode={mode} weight={weight} second={second} peak={peak} peakSecond={peakSecond}
          radius={radius} stiffness={stiffness} damping={damping} onNear={setNear} />
        <p aria-hidden="true" className="m-0 inline-flex min-h-7 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--raised)] px-3 font-mono text-[13px] tabular-nums text-[var(--text-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          {near ? `« ${near.char} »  ${f.axes[0].tag} ${near.w} · ${a2.tag} ${near.s}` : mode === 'survol' ? 'Approchez le pointeur des lettres' : `${f.axes[0].tag} ${weight}`}
        </p>
      </div>

      <div className="grid items-center gap-6 border-t border-[var(--border)] px-4 py-6 md:grid-cols-[232px_1fr] md:gap-8 md:px-6">
        <div ref={padRef} aria-hidden="true"
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); padAt(e); }}
          onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) padAt(e); }}
          className="relative aspect-video w-full cursor-crosshair touch-none overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--raised)] md:aspect-square md:w-[232px]
            bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[size:24px_24px]">
          <span className="absolute left-2 top-2 font-mono text-[11px] uppercase text-[var(--text-muted)]">wght</span>
          <span className="absolute bottom-2 right-2 font-mono text-[11px] uppercase text-[var(--text-muted)]">{a2.tag}</span>
          <span className="pointer-events-none absolute inset-0 grid place-items-center text-8xl leading-none text-[var(--text-strong)] opacity-[.12]" style={{ fontFamily: f.family, fontVariationSettings: fvs }}>Ag</span>
          <span className="absolute -ml-2.5 -mt-2.5 h-5 w-5 rounded-full border-[3px] border-[var(--surface)] bg-[var(--accent)] shadow-[0_0_0_1px_var(--accent)] transition-[left,top] duration-150 ease-out motion-reduce:transition-none"
            style={{ left: `${second}%`, top: `${100 - ((weight - 100) / 800) * 100}%` }} />
        </div>
        <div className="grid min-w-0 gap-6">
          <Range id={`${uid}w`} label="Graisse" value={weight} min={100} max={900} display={weight} ends={['100 Fin', '900 Noir']} onChange={setWeight} />
          <Range id={`${uid}s`} label={a2.label} value={second} min={0} max={100} step={0.5} display={Math.round(lerpAxis(second / 100, a2))}
            ends={[`${a2.min} ${a2.ends[0]}`, `${a2.max} ${a2.ends[1]}`]} onChange={setSecond} />
          <div role="group" aria-label="Instances nommées" className="flex flex-wrap gap-2">
            {f.presets.map(([name, w, s]) => {
              const on = w === weight && Math.abs(s - second) < 0.6;
              return (
                <button key={name} type="button" aria-pressed={on} onClick={() => { setWeight(w); setSecond(s); }}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full border pl-3 pr-4 text-sm font-medium transition active:scale-95 ${on ? 'border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)] text-[var(--text-strong)]' : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-control)]'}`}>
                  <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-full bg-[var(--raised)] text-base text-[var(--text-strong)]" style={{ fontFamily: f.family, fontVariationSettings: toFvs(f, (w - 100) / 800, s / 100) }}>Ag</span>
                  {name} <span className="font-mono text-xs text-[var(--text-muted)]">{w}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border)] px-4 pb-4 pt-2 md:px-6 md:pb-6" style={{ fontFamily: f.family, fontVariationSettings: fvs }}>
        {[[64, 'Averse sur la ville'], [40, 'Les toits boivent la lumière d’octobre'], [24, 'Une revue lente sur l’architecture, la musique et ce qui pousse entre les pavés.']].map(([s, t]) => (
          <div key={s} className="grid items-baseline gap-1 border-b border-[var(--border)] py-4 md:grid-cols-[48px_1fr] md:gap-4">
            <span className="font-mono text-xs text-[var(--text-muted)]" style={{ fontVariationSettings: 'normal' }}>{s}</span>
            <p className="m-0 leading-[1.12] tracking-[-0.01em] text-[var(--text-strong)] md:truncate" style={{ fontSize: `min(${s}px, ${s === 64 ? '13cqi' : s === 40 ? '10cqi' : '100cqi'})`, fontVariationSettings: fvs }}>{t}</p>
          </div>
        ))}
        <div className="grid grid-cols-4 gap-2 pt-6 md:grid-cols-12">
          {['Aa', 'Éé', 'Œœ', 'Çç', 'Rg', '&', '«»', '?!', '01', '23', '4%', '€'].map((g) => (
            <span key={g} className="grid aspect-square place-items-center rounded-xl bg-[var(--raised)] text-[28px] text-[var(--text-strong)] transition-colors hover:bg-[var(--accent-subtle)]" style={{ fontVariationSettings: fvs }}>{g}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AxesSpecimen;
