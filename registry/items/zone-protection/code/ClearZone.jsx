// Zone de protection — React + Tailwind CSS. Couleurs : variables de tokens.css.
// x = la moitié de la hauteur de l'icône ; la marge s'exprime en multiples de x.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const MARK = (
  <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
    <path d="M7 11h12.6a3.2 3.2 0 1 0-3.2-3.2" /><path d="M7 15.6h17.4" /><path d="M7 20.2h9.4a3.2 3.2 0 1 1-3.2 3.2" />
  </g>
);

const GROUNDS = {
  light: { stage: 'bg-[var(--surface)]', tile: 'bg-[var(--accent)] text-[var(--accent-fg)]', word: 'text-[var(--text-strong)]' },
  dark: { stage: 'bg-[var(--text-strong)]', tile: 'bg-[var(--surface)] text-[var(--text-strong)]', word: 'text-[var(--surface)]' },
  accent: { stage: 'bg-[var(--accent)]', tile: 'bg-[var(--accent-fg)] text-[var(--accent)]', word: 'text-[var(--accent-fg)]' },
};

export function Lockup({ h = 72, version = 'horizontal', tileClass = GROUNDS.light.tile, wordClass = GROUNDS.light.word, name = 'brise' }) {
  return (
    <span className={`relative inline-flex items-center leading-none ${version === 'stacked' ? 'flex-col' : ''} ${wordClass}`} style={{ gap: h * (version === 'stacked' ? 0.24 : 0.28) }}>
      <span className={`grid flex-none place-items-center ${tileClass}`} style={{ width: h, height: h, borderRadius: h * 0.28 }}>
        <svg viewBox="0 0 32 32" className="size-full" aria-hidden="true">{MARK}</svg>
      </span>
      {version !== 'icon' && <b className="font-semibold tracking-[-0.055em]" style={{ fontSize: h * 0.82 }}>{name}</b>}
    </span>
  );
}

export function ClearZone({ margin = 1, version = 'horizontal', ground = 'light', dimensions = true, iconSize = 72 }) {
  const stage = useRef(null), zone = useRef(null), btn = useRef(null), drag = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hit, setHit] = useState(0);
  const g = GROUNDS[ground] || GROUNDS.light;
  const x = iconSize / 2, pad = margin * x;

  const check = useCallback(() => {
    if (!zone.current || !btn.current) return;
    const z = zone.current.getBoundingClientRect(), b = btn.current.getBoundingClientRect();
    const ox = Math.min(z.right, b.right) - Math.max(z.left, b.left), oy = Math.min(z.bottom, b.bottom) - Math.max(z.top, b.top);
    setHit(ox > 0 && oy > 0 ? Math.round(Math.min(ox, oy)) : 0);
  }, []);
  useLayoutEffect(check, [pos, margin, version, check]);
  useEffect(() => { const t = setTimeout(check, 450); return () => clearTimeout(t); }, [margin, check]);

  const clamp = (p) => {
    const s = stage.current.getBoundingClientRect(), b = btn.current.getBoundingClientRect();
    const bx = b.left - pos.x, by = b.top - pos.y;
    return { x: Math.max(s.left + 8 - bx, Math.min(s.right - 8 - b.width - bx, p.x)), y: Math.max(s.top + 8 - by, Math.min(s.bottom - 8 - b.height - by, p.y)) };
  };
  const onKey = (e) => {
    const st = e.shiftKey ? 32 : 8;
    const d = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] }[e.key];
    if (e.key === 'Escape' || e.key === 'Home') { e.preventDefault(); setPos({ x: 0, y: 0 }); return; }
    if (!d) return;
    e.preventDefault(); setPos(clamp({ x: pos.x + d[0], y: pos.y + d[1] }));
  };
  const spring = 'duration-[420ms] ease-[cubic-bezier(.3,1.25,.5,1)] motion-reduce:transition-none';

  return (
    <div ref={stage} className={`relative grid min-h-[380px] touch-none place-items-center overflow-hidden rounded-[12px] border border-[var(--border)] px-4 pb-32 pt-8 font-sans md:min-h-[440px] md:rounded-[16px] md:px-6 md:pb-[88px] md:pt-12 ${g.stage}`}>
      <div ref={zone} className={`relative rounded-[2px] transition-[padding] ${spring} ${hit ? 'outline outline-2 outline-[var(--down)]' : 'outline-dashed outline-1 outline-[var(--border-control)]'}`} style={{ padding: pad }}>
        <svg aria-hidden="true" className={`absolute inset-0 size-full ${ground === 'light' ? 'opacity-90' : 'opacity-[.16]'}`}>
          <defs><pattern id="cz-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" fill={hit ? 'var(--tint-red-bg)' : 'var(--accent-subtle)'} /><path d="M0 0v8" stroke={hit ? 'var(--tint-red-border)' : 'var(--accent-subtle-border)'} strokeWidth="2" />
          </pattern></defs>
          <rect width="100%" height="100%" fill="url(#cz-hatch)" />
        </svg>
        <span role="img" aria-label="Logo brise et sa zone de protection"><Lockup h={iconSize} version={version} tileClass={g.tile} wordClass={g.word} /></span>
        {dimensions && ground === 'light' && (
          <>
            <span aria-hidden="true" className={`absolute top-0 grid place-items-center border-x border-[var(--text-strong)] font-mono text-xs transition-all ${spring}`} style={{ left: pad, width: x, height: pad }}>
              <i className="rounded bg-[var(--surface)] px-1 not-italic text-[var(--text-strong)]">x</i>
            </span>
            <span aria-hidden="true" className={`absolute left-0 grid place-items-center border-y border-[var(--text-strong)] font-mono text-xs transition-all ${spring}`} style={{ top: pad, width: pad, height: x }}>
              <i className="rounded bg-[var(--surface)] px-1 not-italic text-[var(--text-strong)]">x</i>
            </span>
          </>
        )}
      </div>

      <button ref={btn} type="button" onKeyDown={onKey} aria-describedby="cz-status"
        aria-label="Élément à déplacer : bouton « Ouvrir un compte ». Flèches pour le rapprocher du logo."
        onPointerDown={(e) => { drag.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }; e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerMove={(e) => drag.current && setPos(clamp({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }))}
        onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
        className={`absolute bottom-5 right-4 z-[2] inline-flex h-11 cursor-grab touch-none select-none items-center gap-2 rounded-full pl-[18px] pr-4 text-[15px] font-medium shadow-[var(--shadow-popover)] active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] md:bottom-6 md:right-6 ${ground === 'dark' ? 'bg-[var(--surface)] text-[var(--text-strong)]' : 'bg-[var(--text-strong)] text-[var(--surface)]'}`}
        style={{ translate: `${pos.x}px ${pos.y}px` }}>
        Ouvrir un compte
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </button>

      <p id="cz-status" role="status" className={`absolute inset-x-4 bottom-20 m-0 text-sm md:bottom-[30px] md:left-6 md:right-60 ${hit ? 'font-medium text-[var(--down)]' : ground === 'light' ? 'text-[var(--text-muted)]' : ground === 'dark' ? 'text-[var(--surface)]' : 'text-[var(--accent-fg)]'}`}>
        {hit ? `Trop près : le bouton entre de ${hit} px dans la zone de protection.` : pos.x || pos.y ? 'Distance respectée : rien n’entre dans la zone.' : 'Glissez le bouton vers le logo : la zone le signale dès qu’il y entre.'}
      </p>
    </div>
  );
}

export default ClearZone;
