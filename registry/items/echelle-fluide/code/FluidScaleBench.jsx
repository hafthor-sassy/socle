// Banc de l'échelle fluide — React + Tailwind CSS. Couleurs : variables de tokens.css. Aucune dépendance.
// Le cadre est un conteneur (container-type) : les tailles y sont en cqi, l'export en vw.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const NOMS = { '-2': 'Mention', '-1': 'Légende', 0: 'Texte', 1: 'Chapô', 2: 'Titre 3', 3: 'Titre 2', 4: 'Titre 1', 5: 'Affiche', 6: 'Géant' };
const RMIN = 320, RMAX = 1600;
const PRESETS = [['Téléphone', 375], ['Tablette', 834], ['Portable', 1280], ['Bureau', 1536]];
const r4 = (n) => Math.round(n * 10000) / 10000;
const fr = (n, d) => n.toFixed(d).replace('.', ',');

/** Échelle modulaire fluide (formule d'Utopia) : niveau k = base × ratio^k, de vmin à vmax. */
export function fluidScale({ vmin = 360, vmax = 1440, baseMin = 16, baseMax = 19, ratioMin = 1.2, ratioMax = 1.333, from = -1, to = 5 } = {}) {
  return Array.from({ length: to - from + 1 }, (_, i) => {
    const k = from + i, min = baseMin * ratioMin ** k, max = baseMax * ratioMax ** k;
    const slope = (max - min) / (vmax - vmin), icpt = min - slope * vmin;
    return {
      k, nom: NOMS[k] || `Niveau ${k}`, min, max,
      css: (unit = 'vw') => `clamp(${r4(min / 16)}rem, ${r4(icpt / 16)}rem + ${r4(slope * 100)}${unit}, ${r4(max / 16)}rem)`,
      at: (w) => Math.min(max, Math.max(min, icpt + slope * w)),
    };
  });
}

/**
 * @param {{ largeur?: number, vmin?: number, vmax?: number, baseMin?: number, baseMax?: number, ratioMin?: number, ratioMax?: number, children?: React.ReactNode }} props
 * children : votre contenu ; utilisez style={{ fontSize: 'var(--fl-s<k>)' }} (k de -1 à 5) et data-level={k}.
 */
export function FluidScaleBench({ largeur = 834, vmin = 360, vmax = 1440, baseMin = 16, baseMax = 19, ratioMin = 1.2, ratioMax = 1.333, children }) {
  const levels = useMemo(() => fluidScale({ vmin, vmax, baseMin, baseMax, ratioMin, ratioMax }), [vmin, vmax, baseMin, baseMax, ratioMin, ratioMax]);
  const bench = useRef(null), frame = useRef(null), ruler = useRef(null), graphBox = useRef(null);
  const [W, setWState] = useState(largeur);
  const [avail, setAvail] = useState(0);
  const [frameH, setFrameH] = useState(0);
  const [px, setPx] = useState({});
  const [active, setActive] = useState(null);
  const [anim, setAnim] = useState(false);
  const [gw, setGw] = useState(480);
  const [copied, setCopied] = useState(false);
  const first = useRef(true);

  const setW = useCallback((w, animate = false) => {
    setAnim(animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    setWState(Math.max(RMIN, Math.min(RMAX, Math.round(w))));
  }, []);
  useEffect(() => setW(largeur), [largeur, setW]);

  useLayoutEffect(() => {
    const ro = new ResizeObserver(() => {
      const a = bench.current.clientWidth - 36; setAvail(a);
      if (first.current) { first.current = false; if (a >= RMIN && largeur > a) setWState(Math.floor(a)); }
      setGw(graphBox.current ? graphBox.current.clientWidth : 480);
    });
    ro.observe(bench.current); if (graphBox.current) ro.observe(graphBox.current);
    const rf = new ResizeObserver(([e]) => setFrameH(e.target.offsetHeight)); rf.observe(frame.current);
    return () => { ro.disconnect(); rf.disconnect(); };
  }, [largeur]);

  const s = avail ? Math.min(1, avail / W) : 1;

  /* Tailles réellement rendues, lues après chaque changement (et en fin de transition). */
  useLayoutEffect(() => {
    const read = () => setPx(Object.fromEntries(levels.map((l) => { const el = frame.current.querySelector(`[data-level="${l.k}"]`); return [l.k, el ? parseFloat(getComputedStyle(el).fontSize) : l.at(W)]; })));
    read(); const t = setTimeout(read, 440); return () => clearTimeout(t);
  }, [W, levels]);

  const grip = useRef(null);
  const onGripDown = (e) => { e.currentTarget.setPointerCapture(e.pointerId); grip.current = { x: e.clientX, w: W, s }; };
  const onGripMove = (e) => { if (grip.current) setW(grip.current.w + (e.clientX - grip.current.x) / grip.current.s); };
  const rulerDrag = useRef(false);
  const fromRuler = (e) => { const r = ruler.current.getBoundingClientRect(); setW(RMIN + ((e.clientX - r.left) / r.width) * (RMAX - RMIN)); };
  const onThumbKey = (e) => {
    const st = e.shiftKey ? 100 : 10, map = { ArrowLeft: W - st, ArrowDown: W - st, ArrowRight: W + st, ArrowUp: W + st, Home: RMIN, End: RMAX };
    if (map[e.key] == null) return; e.preventDefault(); setW(map[e.key], e.key === 'Home' || e.key === 'End');
  };

  const code = `/* Échelle fluide · ${vmin} → ${vmax} px · ${fr(ratioMin, 3)} → ${fr(ratioMax, 3)} */\n:root {\n${levels.map((l) => `  --step-${l.k < 0 ? '-' : ''}${Math.abs(l.k)}: ${l.css('vw')};`).join('\n')}\n}`;
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* sélection manuelle */ } };
  const vars = Object.fromEntries(levels.map((l) => [`--fl-s${l.k}`, l.css('cqi')]));
  const hl = (k) => (active === k ? 'outline outline-2 outline-offset-4 outline-[var(--accent)] rounded' : '');
  const fs = (k) => ({ fontSize: `var(--fl-s${k})` });

  /* Graphe */
  const gh = Math.round(Math.min(260, Math.max(180, gw * 0.5))), pl = 36, pb = 22, pt = 8, pr = 8;
  const ymax = Math.ceil(levels[levels.length - 1].max / 8) * 8;
  const X = (v) => pl + ((v - RMIN) / (RMAX - RMIN)) * (gw - pl - pr), Yy = (v) => pt + (1 - v / ymax) * (gh - pt - pb);
  const caps = 'font-mono text-xs uppercase tracking-[0.04em] text-[var(--text-muted)]';
  const card = 'min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3';

  return (
    <section aria-label="Banc de l’échelle fluide" className="@container mx-auto grid w-full max-w-[1240px] grid-cols-[minmax(0,1fr)] gap-4 font-sans text-[var(--text)]">
      <header className="grid gap-x-6 gap-y-3 @[520px]:flex @[520px]:flex-wrap @[520px]:items-end @[520px]:justify-between">
        <div className="grid min-w-0 gap-0.5">
          <span className={caps}>Largeur du cadre</span>
          <b className="text-[26px] font-semibold leading-8 tracking-[-0.02em] tabular-nums text-[var(--text-strong)] @[520px]:text-[32px] @[520px]:leading-10">{W} px</b>
          {s < 1 && <small className="font-mono text-xs text-[var(--text-muted)]">Aperçu réduit à {Math.round(s * 100)} %</small>}
        </div>
        <div role="group" aria-label="Largeurs types" className="grid min-w-0 grid-cols-4 gap-1 rounded-2xl border border-[var(--border)] bg-[var(--raised)] p-1 @[520px]:flex @[520px]:rounded-full">
          {PRESETS.map(([l, w]) => (
            <button key={w} type="button" aria-pressed={W === w} onClick={() => setW(w, true)}
              className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)] aria-pressed:bg-[var(--surface)] aria-pressed:text-[var(--text-strong)] aria-pressed:shadow-[var(--shadow-overlay)] @[520px]:min-h-9 @[520px]:rounded-full @[520px]:px-3.5">
              {l}<small className="hidden font-mono text-[11px] opacity-80 @[520px]:inline">{w}</small>
            </button>
          ))}
        </div>
      </header>

      <div ref={ruler} className="relative h-11 cursor-pointer touch-none"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); rulerDrag.current = true; fromRuler(e); }}
        onPointerMove={(e) => rulerDrag.current && fromRuler(e)} onPointerUp={() => { rulerDrag.current = false; }} onPointerCancel={() => { rulerDrag.current = false; }}>
        <div aria-hidden className="absolute inset-x-0 top-0 h-5">
          {Array.from({ length: 33 }, (_, i) => { const v = RMIN + i * 40, maj = v % 320 === 0; return (
            <span key={v} className="absolute bottom-0 w-px" style={{ left: `${(i / 32) * 100}%`, height: maj ? 10 : 5, background: maj ? 'var(--text-muted)' : 'var(--border-strong)' }}>
              {maj && <span className={`absolute -top-3 font-mono text-[10px] text-[var(--text-muted)] ${v === RMIN ? 'left-0' : v === RMAX ? 'right-0' : '-translate-x-1/2'}`}>{v}</span>}
            </span>); })}
        </div>
        <span aria-hidden className="absolute top-[30px] h-1 rounded-full bg-[var(--accent-subtle-border)]" style={{ left: `${((vmin - RMIN) / (RMAX - RMIN)) * 100}%`, width: `${((vmax - vmin) / (RMAX - RMIN)) * 100}%` }} />
        <span role="slider" tabIndex={0} aria-label="Largeur du cadre" aria-valuemin={RMIN} aria-valuemax={RMAX} aria-valuenow={W} aria-valuetext={`${W} pixels`} onKeyDown={onThumbKey}
          className="absolute top-[22px] -ml-2.5 size-5 cursor-grab rounded-full border-[3px] border-[var(--surface)] bg-[var(--accent)] shadow-[0_0_0_1px_var(--accent)] outline-none after:absolute after:-inset-3 focus-visible:shadow-[0_0_0_1px_var(--accent),0_0_0_4px_var(--focus-ring)]"
          style={{ left: `${((W - RMIN) / (RMAX - RMIN)) * 100}%` }} />
      </div>

      <div ref={bench} className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--raised)] p-3" style={{ height: frameH * s + 24 }}>
        <div ref={frame} style={{ ...vars, width: W, transform: s < 1 ? `scale(${s})` : undefined, containerType: 'inline-size', transformOrigin: '0 0' }}
          className={`overflow-hidden rounded-xl bg-[var(--surface)] shadow-[0_0_0_1px_var(--border)] ${anim ? 'transition-[width,transform] duration-[420ms] [transition-timing-function:cubic-bezier(.2,0,0,1)]' : ''}`}>
          {children || (
            <article className="grid p-[clamp(16px,4cqi,48px)]">
              <header className="mb-[clamp(16px,4cqi,40px)] flex items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
                <span className="inline-flex items-center gap-2 text-[var(--text-strong)]" aria-label="Brève">
                  <svg viewBox="0 0 100 100" className="size-7" aria-hidden><rect width="100" height="100" rx="24" fill="var(--accent)" /><path d="M26 33h48M26 50h48M26 67h26" fill="none" stroke="var(--accent-fg)" strokeWidth="9" strokeLinecap="round" /><circle cx="70" cy="67" r="6.5" fill="var(--accent-fg)" /></svg>
                  <b className="text-xl font-semibold tracking-[-0.03em]">Brève</b>
                </span>
                <span className="hidden min-w-0 truncate text-[var(--text-muted)] @[521px]:inline" style={fs(-1)}>Société · Climat · Économie · Culture</span>
              </header>
              <p data-level="-1" style={fs(-1)} className={`m-0 mb-[0.75em] font-semibold uppercase tracking-[0.04em] text-[var(--accent)] ${hl(-1)}`}>Mobilités · Enquête</p>
              <h1 data-level="5" style={fs(5)} className={`m-0 max-w-[16ch] text-balance font-semibold leading-[1.04] tracking-[-0.035em] text-[var(--text-strong)] ${hl(5)}`}>Les villes moyennes réinventent le vélo</h1>
              <p data-level="1" style={fs(1)} className={`m-0 mt-[0.9em] max-w-[40ch] leading-[1.45] ${hl(1)}`}>À Niort, Annecy ou Valence, les pistes cyclables ont doublé en cinq ans. Récit d’une révolution discrète, loin des métropoles.</p>
              <p style={fs(-1)} className="m-0 mt-[1.2em] text-[var(--text-muted)]">Par Lina Moreau · 5&nbsp;novembre 2026 · lecture 6&nbsp;min</p>
              <div className="mt-[clamp(24px,5cqi,56px)] grid gap-[clamp(16px,4cqi,48px)] border-t border-[var(--border)] pt-[clamp(16px,3cqi,32px)] @[720px]:grid-cols-[1.2fr_1fr]">
                <div>
                  <h2 data-level="3" style={fs(3)} className={`m-0 font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--text-strong)] ${hl(3)}`}>Des budgets multipliés par trois</h2>
                  <p data-level="0" style={fs(0)} className={`m-0 mt-[0.6em] max-w-[62ch] leading-[1.6] ${hl(0)}`}>En 2021, la communauté d’agglomération consacrait 4&nbsp;€ par habitant aux aménagements cyclables. Elle en dépense aujourd’hui 13, soit plus que Bordeaux ou Lille. Les élus parlent d’un «&nbsp;rattrapage&nbsp;»&#8239;; les usagers, d’un changement de vie.</p>
                </div>
                <div>
                  <h3 data-level="2" style={fs(2)} className={`m-0 font-semibold leading-[1.25] tracking-[-0.01em] text-[var(--text-strong)] ${hl(2)}`}>Ce que disent les compteurs</h3>
                  <p style={fs(0)} className={`m-0 mt-[0.6em] max-w-[62ch] leading-[1.6] ${hl(0)}`}>Sur le pont de la Sèvre, les capteurs enregistrent 2&#8239;400 passages par jour, contre 900 avant les travaux. Le pic du matin dépasse désormais celui des voitures.</p>
                  <p style={fs(-1)} className={`m-0 mt-[1em] text-[var(--text-muted)] ${hl(-1)}`}>Source&nbsp;: observatoire régional des mobilités, octobre 2026.</p>
                </div>
              </div>
              <p data-level="4" style={fs(4)} className={`m-0 mt-[clamp(24px,5cqi,56px)] text-balance border-l-[3px] border-[var(--accent)] pl-[0.7em] font-medium leading-[1.2] tracking-[-0.02em] text-[var(--text-strong)] ${hl(4)}`}>«&nbsp;On a cessé de dessiner la ville pour la voiture.&nbsp;»</p>
            </article>
          )}
        </div>
        <span aria-hidden onPointerDown={onGripDown} onPointerMove={onGripMove} onPointerUp={() => { grip.current = null; }} onPointerCancel={() => { grip.current = null; }}
          className="group absolute inset-y-3 -ml-1 grid w-6 cursor-ew-resize touch-none place-items-center" style={{ left: 12 + W * s }}>
          <i className="h-12 w-1.5 rounded-full bg-[var(--border-strong)] transition-all duration-300 group-hover:h-16 group-hover:bg-[var(--accent)]" />
        </span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 @[960px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] @[960px]:items-start">
        <div className={card}>
          <div aria-hidden className="grid grid-cols-[1fr_auto] gap-3 px-2 pb-2 pt-1 font-mono text-[11px] uppercase tracking-[0.04em] text-[var(--text-muted)] @[520px]:grid-cols-[1fr_auto_112px]"><span>Niveau</span><span className="text-right">Taille</span><span className="hidden text-right @[520px]:block">min → max</span></div>
          <ol className="m-0 grid list-none p-0" onPointerLeave={() => setActive(null)}>
            {levels.slice().reverse().map((l, i) => {
              const v = px[l.k] ?? l.at(W);
              return (
                <li key={l.k} tabIndex={0} aria-label={l.nom} onPointerOver={() => setActive(l.k)} onFocus={() => setActive(l.k)} onBlur={() => setActive(null)}
                  className={`grid min-h-[52px] grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-2 py-1.5 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--focus-ring)] @[520px]:grid-cols-[1fr_auto_112px] ${i ? 'border-t border-[var(--border)]' : ''} ${active === l.k ? 'bg-[var(--raised)]' : ''}`}>
                  <span className="grid min-w-0 gap-0.5">
                    <b className="text-sm font-medium text-[var(--text-strong)]">{l.nom} <span className="font-mono text-xs text-[var(--text-muted)]">{l.k < 0 ? `−${-l.k}` : l.k}</span></b>
                    <code className="truncate font-mono text-[11px] text-[var(--text-muted)]">{l.css('vw')}</code>
                  </span>
                  <span className="min-w-[7ch] text-right font-mono text-lg font-semibold tabular-nums text-[var(--text-strong)]">{fr(v, 1)}<small className="ml-0.5 text-[11px] font-medium text-[var(--text-muted)]">px</small></span>
                  <span className="col-span-2 grid grid-cols-[auto_1fr] items-center gap-2.5 font-mono text-[11px] tabular-nums text-[var(--text-muted)] @[520px]:col-span-1 @[520px]:grid-cols-1 @[520px]:gap-1.5 @[520px]:text-right">
                    <span>{fr(l.min, 1)} → {fr(l.max, 1)}</span>
                    <span className="relative h-1 rounded-full bg-[var(--scale-track)]"><i className="absolute inset-y-0 left-0 rounded-full bg-[var(--accent)]" style={{ width: `${Math.round(((v - l.min) / Math.max(0.01, l.max - l.min)) * 100)}%` }} /></span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
        <figure ref={graphBox} className={`${card} m-0 grid gap-2`}>
          <figcaption className={caps}>Taille selon la largeur</figcaption>
          <svg viewBox={`0 0 ${gw} ${gh}`} height={gh} className="block h-auto w-full overflow-visible" role="img" aria-label="Courbes des tailles de chaque niveau en fonction de la largeur d’écran">
            <rect x={X(vmin)} y={pt} width={X(vmax) - X(vmin)} height={gh - pt - pb} rx="4" fill="var(--accent-subtle)" opacity=".6" />
            {Array.from({ length: Math.floor(ymax / (ymax > 64 ? 16 : 8)) + 1 }, (_, i) => i * (ymax > 64 ? 16 : 8)).map((y) => (
              <g key={y}><line x1={pl} x2={gw - pr} y1={Yy(y)} y2={Yy(y)} stroke="var(--chart-grid)" /><text x={pl - 6} y={Yy(y) + 3} textAnchor="end" className="fill-[var(--text-muted)] font-mono text-[10px]">{y}</text></g>
            ))}
            {[320, 640, 960, 1280, 1600].map((v) => <text key={v} x={X(v)} y={gh - 6} textAnchor={v === 320 ? 'start' : v === 1600 ? 'end' : 'middle'} className="fill-[var(--text-muted)] font-mono text-[10px]">{v}</text>)}
            {levels.map((l) => <path key={l.k} fill="none" stroke={active === l.k ? 'var(--accent)' : 'var(--chart-muted)'} strokeWidth={active === l.k ? 2.5 : 1.5} d={`M${X(RMIN)} ${Yy(l.min)}L${X(vmin)} ${Yy(l.min)}L${X(vmax)} ${Yy(l.max)}L${X(RMAX)} ${Yy(l.max)}`} />)}
            <line x1={X(W)} x2={X(W)} y1={pt} y2={gh - pb} stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="3 3" />
            {levels.map((l) => <circle key={l.k} cx={X(W)} cy={Yy(l.at(W))} r={active === l.k ? 4.5 : 3} fill="var(--surface)" stroke="var(--accent)" strokeWidth="2" />)}
          </svg>
        </figure>
        <div className={`${card} grid gap-2 @[960px]:col-span-2`}>
          <div className="flex items-center justify-between gap-2"><span className={caps}>Variables CSS</span>
            <button type="button" onClick={copy} className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-[var(--border-control)] bg-[var(--surface)] px-3.5 text-sm font-medium ${copied ? 'text-[var(--up)]' : 'text-[var(--text-strong)]'}`}>{copied ? 'Copié' : 'Copier'}</button>
          </div>
          <pre className="m-0 max-h-[240px] overflow-auto whitespace-pre rounded-lg bg-[var(--raised)] px-3.5 py-3 font-mono text-xs leading-5 text-[var(--text-muted)]">{code}</pre>
        </div>
      </div>
    </section>
  );
}

export default FluidScaleBench;
