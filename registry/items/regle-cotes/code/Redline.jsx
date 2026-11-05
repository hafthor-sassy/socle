// Règle de cotes — React + Tailwind CSS. Couleurs : variables de tokens.css.
// <Redline> enveloppe la zone à mesurer ; marquez les éléments avec data-measure="Nom"
// et les conteneurs à auditer avec data-measure-group (+ data-measure-pad pour leurs marges).
import { useCallback, useEffect, useRef, useState } from 'react';

export const SPACE_TOKENS = { 4: 'space-1', 8: 'space-2', 12: 'space-3', 16: 'space-4', 20: 'space-5', 24: 'space-6', 32: 'space-8', 40: 'space-10', 48: 'space-12', 64: 'space-16' };
const TRIGGERS = [['alt', 'Survol', '⌥'], ['always', 'Toujours'], ['audit', 'Tout coter']];

const rectOf = (el) => { const r = el.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
const half = (v) => Math.round(v) + 0.5;

/** Calcule les cotes entre deux rectangles, à la manière de Figma. */
export function distances(A, B) {
  const out = [];
  const inside = B.l >= A.l && B.r <= A.r && B.t >= A.t && B.b <= A.b;
  const around = A.l >= B.l && A.r <= B.r && A.t >= B.t && A.b <= B.b;
  if (inside || around) {
    const I = inside ? B : A, O = inside ? A : B, my = I.t + I.h / 2, mx = I.l + I.w / 2;
    out.push([O.l, my, I.l, my], [I.r, my, O.r, my], [mx, O.t, mx, I.t], [mx, I.b, mx, O.b]);
  } else {
    if (B.l >= A.r || A.l >= B.r) {
      const L = B.l >= A.r ? A : B, R = L === A ? B : A, y1 = Math.max(A.t, B.t), y2 = Math.min(A.b, B.b);
      const y = y2 > y1 ? (y1 + y2) / 2 : R.t + R.h / 2;
      out.push([L.r, y, R.l, y]);
    }
    if (B.t >= A.b || A.t >= B.b) {
      const T = B.t >= A.b ? A : B, D = T === A ? B : A, x1 = Math.max(A.l, B.l), x2 = Math.min(A.r, B.r);
      const x = x2 > x1 ? (x1 + x2) / 2 : D.l + D.w / 2;
      out.push([x, T.b, x, D.t]);
    }
  }
  return out.map(([x1, y1, x2, y2]) => ({ x1, y1, x2, y2, v: Math.round(Math.abs(x2 - x1) + Math.abs(y2 - y1)) })).filter((d) => d.v > 0);
}

function Dim({ d, base, unit, tokens, mini, anim }) {
  const tok = tokens[d.v];
  const warn = !tok && d.v % base !== 0;
  const horiz = d.y1 === d.y2;
  const len = Math.abs(d.x2 - d.x1) + Math.abs(d.y2 - d.y1);
  const room = len > (mini ? 22 : 40);
  const stroke = warn ? 'var(--warn)' : 'var(--accent)';
  let cx = (d.x1 + d.x2) / 2, cy = (d.y1 + d.y2) / 2, tf = '-50%,-50%';
  if (!room) { if (horiz) { cy -= 6; tf = '-50%,-100%'; } else { cx += 10; tf = '0,-50%'; } }
  const label = mini ? String(d.v) : unit === 'token' && tok ? tok : `${d.v}${unit !== 'px' ? (tok ? ` · ${tok}` : warn ? ' · hors grille' : '') : ''}`;
  return (
    <>
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
        <path d={`M${half(d.x1)} ${half(d.y1)}L${half(d.x2)} ${half(d.y2)}`} stroke={stroke} strokeWidth="1" fill="none" shapeRendering="crispEdges"
          style={anim ? { strokeDasharray: len, strokeDashoffset: 0, animation: 'rl-draw 240ms cubic-bezier(.2,0,0,1) both', '--len': len } : undefined} />
        <path d={horiz ? `M${half(d.x1)} ${d.y1 - 4}v8M${half(d.x2)} ${d.y1 - 4}v8` : `M${d.x1 - 4} ${half(d.y1)}h8M${d.x1 - 4} ${half(d.y2)}h8`} stroke={stroke} strokeWidth="1" shapeRendering="crispEdges" />
      </svg>
      <span className={`absolute whitespace-nowrap font-mono font-semibold tabular-nums motion-reduce:animate-none ${mini ? 'h-[18px] rounded px-[5px] text-[11px] leading-[18px]' : 'h-[22px] rounded-md px-[7px] text-xs leading-[22px]'} ${warn ? 'bg-[var(--tint-amber-bg)] text-[var(--tint-amber-fg)] ring-1 ring-[var(--tint-amber-border)]' : 'bg-[var(--accent)] text-[var(--accent-fg)]'}`}
        style={{ left: cx, top: cy, transform: `translate(${tf})`, animation: anim ? 'rl-pop 360ms cubic-bezier(.34,1.56,.64,1) both' : undefined, '--tf': tf }}>
        {label}
      </span>
    </>
  );
}

export function Redline({
  trigger: triggerProp = 'always',  // 'alt' | 'always' | 'audit'
  unit = 'both',                   // 'both' | 'px' | 'token'
  base = 8,                        // pas de la grille
  showSizes = true,
  tokens = SPACE_TOKENS,
  onMeasure,
  className = '',
  children,
}) {
  const scope = useRef(null);
  const [trigger, setTrigger] = useState(triggerProp);
  const [alt, setAlt] = useState(false);
  const [hover, setHover] = useState(null);
  const [selected, setSelected] = useState(null);
  const [, setTick] = useState(0);
  const [live, setLive] = useState('');
  useEffect(() => setTrigger(triggerProp), [triggerProp]);
  // l'audit lit le DOM : un second rendu après montage
  useEffect(() => { const r = requestAnimationFrame(() => setTick((t) => t + 1)); return () => cancelAnimationFrame(r); }, [trigger]);
  const active = trigger === 'always' || (trigger === 'alt' && alt) || (trigger === 'audit' && selected);

  // redessine au défilement et au redimensionnement
  useEffect(() => {
    let raf = 0;
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setTick((t) => t + 1)); };
    window.addEventListener('scroll', on, { passive: true, capture: true });
    window.addEventListener('resize', on);
    return () => { window.removeEventListener('scroll', on, { capture: true }); window.removeEventListener('resize', on); cancelAnimationFrame(raf); };
  }, []);
  useEffect(() => {
    const k = (e) => {
      if (e.key === 'Alt') { setAlt(e.type === 'keydown'); if (e.type === 'keydown') e.preventDefault(); }
      if (e.type === 'keydown' && e.key === 'Escape') { setSelected(null); setHover(null); }
    };
    const blur = () => setAlt(false);
    window.addEventListener('keydown', k); window.addEventListener('keyup', k); window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', k); window.removeEventListener('keyup', k); window.removeEventListener('blur', blur); };
  }, []);
  // hors mode Alt, les éléments mesurables prennent le focus clavier
  useEffect(() => {
    scope.current?.querySelectorAll('[data-measure]').forEach((m) => {
      if (/^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(m.tagName)) return;
      if (trigger !== 'alt') m.setAttribute('tabindex', '0'); else m.removeAttribute('tabindex');
    });
  }, [trigger, children]);

  const pick = useCallback((t) => { const m = t?.closest?.('[data-measure]'); return m && scope.current?.contains(m) ? m : null; }, []);
  const parentOf = (el) => { let p = el.parentElement; while (p && p !== scope.current?.parentElement) { if (p.hasAttribute('data-measure')) return p; p = p.parentElement; } return null; };

  const onClickCapture = (e) => {
    const t = pick(e.target);
    if (e.nativeEvent.pointerType === 'touch') {
      if (trigger === 'alt') return;
      if (t) e.preventDefault();
      if (!t) { setSelected(null); setHover(null); }
      else if (!selected || hover) { setSelected(t); setHover(null); }
      else if (t === selected) setSelected(null);
      else setHover(t);
      return;
    }
    if (!(active || trigger === 'audit' || e.altKey)) return;
    e.preventDefault();
    setSelected(!t || selected === t ? null : t);
  };

  // mesures courantes
  const dims = [];
  let anchorEl = null;
  if (hover && (active || trigger === 'always') && hover !== selected) {
    anchorEl = selected || parentOf(hover);
    if (anchorEl) dims.push(...distances(rectOf(anchorEl), rectOf(hover)));
  }
  const key = `${anchorEl?.dataset.measure}|${hover?.dataset.measure}`;
  useEffect(() => {
    if (!dims.length) return;
    const txt = `De ${anchorEl.dataset.measure} à ${hover.dataset.measure} : ${dims.map((d) => `${d.v} px${tokens[d.v] ? ` (${tokens[d.v]})` : d.v % base ? ', hors grille' : ''}`).join(', ')}.`;
    setLive(txt);
    onMeasure && onMeasure({ from: anchorEl.dataset.measure, to: hover.dataset.measure, values: dims.map((d) => d.v) });
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  // audit : marges et écarts de chaque groupe
  const audit = [];
  if (trigger === 'audit' && scope.current) {
    scope.current.querySelectorAll('[data-measure-group]').forEach((g) => {
      const G = rectOf(g);
      const kids = [...g.children].filter((k) => k.offsetParent !== null && getComputedStyle(k).position !== 'absolute').map(rectOf);
      if (!kids.length) return;
      const u = kids.reduce((a, k) => ({ l: Math.min(a.l, k.l), t: Math.min(a.t, k.t), r: Math.max(a.r, k.r), b: Math.max(a.b, k.b) }), { l: 1e9, t: 1e9, r: -1e9, b: -1e9 });
      if (g.hasAttribute('data-measure-pad')) {
        const mx = (u.l + u.r) / 2, my = (u.t + u.b) / 2;
        [[mx, G.t, mx, u.t], [mx, u.b, mx, G.b], [G.l, my, u.l, my], [u.r, my, G.r, my]].forEach(([x1, y1, x2, y2]) => audit.push({ x1, y1, x2, y2, v: Math.round(Math.abs(x2 - x1) + Math.abs(y2 - y1)) }));
      }
      for (let i = 1; i < kids.length; i++) {
        const a = kids[i - 1], b = kids[i];
        if (b.t >= a.b - 1) { const x = Math.max(a.l, b.l) + 12; audit.push({ x1: x, y1: a.b, x2: x, y2: b.t, v: Math.round(b.t - a.b) }); }
        else if (b.l >= a.r - 1) { const y = (Math.max(a.t, b.t) + Math.min(a.b, b.b)) / 2; audit.push({ x1: a.r, y1: y, x2: b.l, y2: y, v: Math.round(b.l - a.r) }); }
      }
    });
  }
  const off = audit.filter((d) => d.v > 0 && !tokens[d.v] && d.v % base !== 0).length;
  const S = selected && rectOf(selected), H = hover && hover !== selected && rectOf(hover);

  return (
    <div className={className}>
      <style>{'@keyframes rl-draw{from{stroke-dashoffset:var(--len)}to{stroke-dashoffset:0}}@keyframes rl-pop{from{opacity:0;transform:translate(var(--tf)) scale(.5)}to{opacity:1;transform:translate(var(--tf)) scale(1)}}@media (prefers-reduced-motion:reduce){[style*="rl-"]{animation:none!important}}'}</style>
      <div role="toolbar" aria-label="Règle de cotes" className="sticky top-4 z-10 mx-auto mb-8 flex w-fit items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-[var(--shadow-popover)]">
        <div role="radiogroup" aria-label="Déclenchement" className="inline-flex rounded-full bg-[var(--raised)] p-0.5">
          {TRIGGERS.map(([v, l, k], i) => (
            <button key={v} type="button" role="radio" aria-checked={trigger === v} tabIndex={trigger === v ? 0 : -1}
              onClick={() => setTrigger(v)}
              onKeyDown={(e) => { const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (d) { e.preventDefault(); setTrigger(TRIGGERS[(i + d + 3) % 3][0]); } }}
              className={`inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm font-medium sm:min-h-9 sm:px-3.5 ${trigger === v ? 'bg-[var(--surface)] text-[var(--text-strong)] shadow-[var(--shadow-overlay)]' : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'}`}>
              {l}{k && <kbd className="hidden font-mono text-xs text-[var(--text-muted)] sm:inline">{k}</kbd>}
            </button>
          ))}
        </div>
        {off > 0 && (
          <span className="inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-full border border-[var(--tint-amber-border)] bg-[var(--tint-amber-bg)] px-3 text-sm font-medium text-[var(--tint-amber-fg)]">
            <span className="h-2 w-2 rounded-full bg-current" />{off}<span className="hidden sm:inline"> {off > 1 ? 'écarts' : 'écart'} hors grille</span>
          </span>
        )}
        <button type="button" disabled={!selected} aria-label="Effacer la sélection" onClick={() => { setSelected(null); setHover(null); }}
          className="grid h-9 w-9 place-items-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-strong)] disabled:opacity-40">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </div>
      <p aria-live="polite" className="sr-only">{live}</p>

      <div ref={scope} className={active || trigger === 'audit' ? '[&_[data-measure]]:cursor-crosshair' : ''}
        onPointerMove={(e) => { if (e.pointerType === 'touch') return; setAlt(e.altKey); const h = pick(e.target); if (h !== hover) setHover(h); }}
        onPointerLeave={(e) => { if (e.pointerType !== 'touch') setHover(null); }}
        onClickCapture={onClickCapture}
        onFocus={(e) => { if (e.target.matches(':focus-visible') && trigger !== 'alt') setHover(pick(e.target)); }}
        onKeyDown={(e) => { if (e.key === 'Enter' && e.target.hasAttribute('data-measure') && !/BUTTON|A/.test(e.target.tagName)) { e.preventDefault(); setSelected((s) => (s === e.target ? null : e.target)); } }}>
        {children}
      </div>

      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50">
        {S && (
          <>
            <svg className="absolute inset-0 h-full w-full overflow-visible">
              <rect x={half(S.l)} y={half(S.t)} width={Math.round(S.w) - 1} height={Math.round(S.h) - 1} fill="none" stroke="var(--accent)" strokeWidth="1.5" />
              {[[S.l, S.t], [S.r, S.t], [S.l, S.b], [S.r, S.b]].map(([x, y], i) => <rect key={i} x={x - 3} y={y - 3} width="6" height="6" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.25" />)}
            </svg>
            <span className="absolute -translate-y-full pb-1 text-[11px] font-semibold leading-4 text-[var(--accent)]" style={{ left: S.l, top: S.t }}>{selected.dataset.measure}</span>
            {showSizes && !dims.length && <span className="absolute -translate-x-1/2 -translate-y-1/2 rounded-md bg-[var(--surface)] px-[7px] font-mono text-xs font-semibold leading-[22px] text-[var(--text-strong)] ring-1 ring-[var(--accent)]" style={{ left: S.l + S.w / 2, top: S.b + 16 }}>{Math.round(S.w)} × {Math.round(S.h)}</span>}
          </>
        )}
        {H && (active || trigger === 'always') && (
          <>
            <svg className="absolute inset-0 h-full w-full overflow-visible">
              <rect x={half(H.l)} y={half(H.t)} width={Math.round(H.w) - 1} height={Math.round(H.h) - 1} fill="none" stroke="var(--accent)" strokeWidth="1" />
              {!selected && anchorEl && (() => { const A = rectOf(anchorEl); return <rect x={half(A.l)} y={half(A.t)} width={Math.round(A.w) - 1} height={Math.round(A.h) - 1} fill="none" stroke="var(--accent)" strokeDasharray="4 3" opacity=".7" />; })()}
            </svg>
            {!selected && <span className="absolute -translate-y-full pb-1 text-[11px] font-semibold leading-4 text-[var(--accent)]" style={{ left: H.l, top: H.t }}>{hover.dataset.measure}</span>}
          </>
        )}
        {dims.map((d, i) => <Dim key={`${key}-${i}`} d={d} base={base} unit={unit} tokens={tokens} anim />)}
        {audit.map((d, i) => d.v > 0 && <Dim key={`a${i}`} d={d} base={base} unit={unit} tokens={tokens} mini />)}
      </div>
    </div>
  );
}

export default Redline;
