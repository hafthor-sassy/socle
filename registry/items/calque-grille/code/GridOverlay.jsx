// Calque de grille — React + Tailwind CSS. Couleurs : variables de tokens.css.
// Montez <GridOverlay /> une fois à la racine de l'application (en développement par exemple) :
// la touche G l'affiche, Maj + G change de calque, Échap le masque.
import { useCallback, useEffect, useState } from 'react';

const MODES = ['both', 'columns', 'baseline'];
const SHORT = { columns: 'Colonnes', baseline: 'Base', both: 'Les deux' };
const TONES = { accent: 'var(--accent)', info: 'var(--info)', down: 'var(--down)', neutral: 'var(--text-strong)' };

function useBreakpoint({ columns, gutter, margin }) {
  const pick = useCallback(() => {
    const w = typeof window === 'undefined' ? 1440 : window.innerWidth;
    if (w >= 1200) return { columns, gutter, margin };
    if (w >= 768) return { columns: Math.min(8, columns), gutter: Math.min(gutter, 24), margin: Math.min(margin, 32) };
    return { columns: 4, gutter: 16, margin: 16 };
  }, [columns, gutter, margin]);
  const [bp, setBp] = useState(pick);
  useEffect(() => {
    const on = () => setBp(pick());
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [pick]);
  return bp;
}

export function GridOverlay({
  columns = 12,          // colonnes au bureau (≥ 1200 px)
  gutter = 24,           // px
  margin = 48,           // px de marge latérale
  maxWidth = 1280,       // largeur maximale du conteneur
  baseline = 8,          // pas de la ligne de base
  tone = 'accent',       // 'accent' | 'info' | 'down' | 'neutral'
  opacity = 12,          // intensité en %
  defaultVisible = false,
  defaultMode = 'both',
  shortcut = true,
  onChange,
}) {
  const [visible, setVisible] = useState(defaultVisible);
  const [mode, setMode] = useState(defaultMode);
  const [shift, setShift] = useState(0);
  const bp = useBreakpoint({ columns, gutter, margin });
  useEffect(() => setVisible(defaultVisible), [defaultVisible]);
  useEffect(() => setMode(defaultMode), [defaultMode]);
  useEffect(() => { onChange && onChange({ visible, mode }); }, [visible, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!shortcut) return;
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
      if (e.key === 'Escape') { setVisible(false); return; }
      if (e.key.toLowerCase() !== 'g') return;
      e.preventDefault();
      if (e.shiftKey) setMode((m) => MODES[(MODES.indexOf(m) + 1) % MODES.length]);
      else setVisible((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shortcut]);

  // la ligne de base reste collée au document pendant le défilement
  useEffect(() => {
    let raf = 0;
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setShift(-(window.scrollY % (baseline * 4)))); };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => { window.removeEventListener('scroll', on); cancelAnimationFrame(raf); };
  }, [baseline]);

  const c = TONES[tone] || TONES.accent;
  const mix = (k) => `color-mix(in srgb, ${c} ${opacity * k}%, transparent)`;
  const showCols = visible && mode !== 'baseline';
  const showBase = visible && mode !== 'columns';
  const isWide = typeof window !== 'undefined' && window.innerWidth > 640;

  return (
    <>
      <div aria-hidden="true" className={`pointer-events-none fixed inset-0 z-50 ${visible ? 'visible' : 'invisible'}`}>
        <div className="absolute inset-0 transition-opacity duration-300 motion-reduce:transition-none"
          style={{
            opacity: showBase ? (mode === 'both' ? 0.75 : 1) : 0,
            backgroundImage: `linear-gradient(to bottom, ${mix(0.75)} 1px, transparent 1px), linear-gradient(to bottom, ${mix(2.2)} 1px, transparent 1px)`,
            backgroundSize: `100% ${baseline}px, 100% ${baseline * 4}px`,
            backgroundPosition: `0 ${shift}px`,
          }} />
        <div className="absolute inset-y-0 left-0 right-0 mx-auto grid"
          style={{ maxWidth, padding: `0 ${bp.margin}px`, columnGap: bp.gutter, gridTemplateColumns: `repeat(${bp.columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: bp.columns }, (_, i) => (
            <div key={i} className="relative origin-top motion-reduce:!transition-none"
              style={{
                background: mix(1),
                boxShadow: `inset 1px 0 ${mix(3)}, inset -1px 0 ${mix(3)}`,
                transform: `scaleY(${showCols ? 1 : 0})`,
                opacity: showCols ? 1 : 0,
                transition: showCols
                  ? `transform 560ms cubic-bezier(.16,1,.3,1) ${i * 28}ms, opacity 200ms ease-out ${i * 28}ms`
                  : 'transform 220ms ease-in, opacity 160ms ease-in',
              }}>
              <span className="absolute inset-x-0 top-2 text-center font-mono text-[10px] font-semibold leading-4 tabular-nums" style={{ color: c }}>{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      <div role="region" aria-label="Calque de grille"
        className={`fixed bottom-4 left-3 right-[76px] z-[51] flex items-center justify-between gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] py-1 pl-4 pr-1 text-[var(--text)] shadow-[var(--shadow-popover)] transition-[opacity,transform] duration-300 [transition-timing-function:cubic-bezier(.34,1.4,.64,1)] motion-reduce:transition-none sm:right-auto sm:left-4 sm:pr-1.5 ${visible ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-3 opacity-0'}`}>
        <p className="m-0 inline-flex items-center gap-2 whitespace-nowrap font-mono text-[13px] font-medium tabular-nums text-[var(--text-strong)]"
          aria-live="polite" aria-label={visible ? `Grille affichée : ${SHORT[mode]}, ${bp.columns} colonnes` : 'Grille masquée'}>
          <span className="h-2 w-2 rounded-sm" style={{ background: c }} />
          {bp.columns} col · {bp.gutter} · {bp.margin}{mode !== 'columns' && isWide ? ` · base ${baseline}` : ''}
        </p>
        <div role="radiogroup" aria-label="Calque affiché" className="hidden rounded-full bg-[var(--raised)] p-0.5 sm:inline-flex">
          {['columns', 'baseline', 'both'].map((m, i, all) => (
            <button key={m} type="button" role="radio" aria-checked={mode === m} tabIndex={mode === m ? 0 : -1}
              onClick={() => setMode(m)}
              onKeyDown={(e) => { const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (d) { e.preventDefault(); setMode(all[(i + d + all.length) % all.length]); } }}
              className={`min-h-9 rounded-full px-3 text-[13px] font-medium transition-colors ${mode === m ? 'bg-[var(--surface)] text-[var(--text-strong)] shadow-[var(--shadow-overlay)]' : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'}`}>
              {SHORT[m]}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setMode((m) => MODES[(MODES.indexOf(m) + 1) % MODES.length])}
          aria-label={`Calque affiché : ${SHORT[mode]}. Changer`}
          className="inline-flex min-h-11 items-center rounded-full bg-[var(--raised)] px-4 text-sm font-medium text-[var(--text-strong)] sm:hidden">
          {SHORT[mode]}
        </button>
      </div>

      <button type="button" aria-pressed={visible} aria-keyshortcuts="G" aria-label={`${visible ? 'Masquer' : 'Afficher'} la grille (touche G)`}
        onClick={() => setVisible((v) => !v)}
        className={`fixed bottom-4 right-3 z-[51] inline-flex h-12 w-[52px] items-center justify-center gap-2 rounded-full border shadow-[var(--shadow-popover)] transition active:scale-95 sm:right-4 sm:w-auto sm:pl-3.5 sm:pr-3 ${visible ? 'border-transparent bg-[var(--accent)] text-[var(--accent-fg)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-strong)]'}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <rect x="3.75" y="3.75" width="16.5" height="16.5" rx="2.25" /><path d="M9.25 3.75v16.5M14.75 3.75v16.5" />
        </svg>
        <kbd className="hidden h-6 min-w-6 place-items-center rounded-md border border-current px-1.5 font-mono text-xs font-semibold opacity-80 sm:grid">G</kbd>
      </button>
    </>
  );
}

export default GridOverlay;
