// Bouton « maintenir pour confirmer » — React + Tailwind CSS. Couleurs : variables de tokens.css.
import { useCallback, useEffect, useId, useRef, useState } from 'react';

const Trash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </svg>
);

export function HoldButton({
  children = 'Maintenir pour supprimer',
  doneLabel = 'Projet supprimé',
  duration = 1500,      // ms de maintien
  resetAfter = 2400,    // ms avant de revenir à l'état initial (0 = jamais)
  variant = 'danger',
  onConfirm,
}) {
  const hint = useId();
  const ref = useRef(null);
  const p = useRef(0);
  const holding = useRef(false);
  const raf = useRef(0);
  const last = useRef(0);
  const [done, setDone] = useState(false);
  const [pressed, setPressed] = useState(false);

  const paint = () => ref.current && ref.current.style.setProperty('--p', p.current.toFixed(4));
  const frame = useCallback((t) => {
    const dt = last.current ? t - last.current : 16;
    last.current = t;
    p.current = Math.min(1, Math.max(0, p.current + (holding.current ? dt / duration : (-dt / duration) * 3)));
    paint();
    if (holding.current && p.current >= 1) {
      holding.current = false; raf.current = 0; last.current = 0;
      setPressed(false); setDone(true);
      onConfirm && onConfirm();
      return;
    }
    if (!holding.current && p.current <= 0) { raf.current = 0; last.current = 0; return; }
    raf.current = requestAnimationFrame(frame);
  }, [duration, onConfirm]);

  const run = () => { if (!raf.current) { last.current = 0; raf.current = requestAnimationFrame(frame); } };
  const start = () => { if (done) return; holding.current = true; setPressed(true); run(); };
  const stop = () => { if (!holding.current) return; holding.current = false; setPressed(false); run(); };

  useEffect(() => {
    if (!done || !resetAfter) return undefined;
    const id = setTimeout(() => { setDone(false); run(); }, resetAfter);
    return () => clearTimeout(id);
  }, [done, resetAfter]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const tone = variant === 'primary'
    ? '[--tone:var(--accent)] [--on:var(--accent-fg)]'
    : '[--tone:var(--down)] [--on:var(--surface)]';
  const layer = 'absolute -inset-px inline-flex items-center justify-center gap-2 bg-[var(--tone)] px-5 text-[var(--on)]';

  return (
    <div className="grid justify-items-center gap-2.5">
      <button
        ref={ref}
        type="button"
        aria-describedby={hint}
        style={{ '--p': 0 }}
        onPointerDown={(e) => { if (e.button === 0) { start(); e.currentTarget.setPointerCapture(e.pointerId); } }}
        onPointerUp={stop}
        onPointerCancel={stop}
        onLostPointerCapture={stop}
        onBlur={stop}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) start(); } }}
        onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') stop(); }}
        className={`relative inline-grid h-12 select-none overflow-hidden whitespace-nowrap rounded-[var(--radius-ctl)] border border-[var(--tone)] bg-[var(--surface)] px-5 text-[15px] font-medium leading-none text-[var(--tone)]
          [touch-action:manipulation] transition-[scale] duration-[260ms] ease-[cubic-bezier(.34,1.56,.64,1)] motion-reduce:transition-none
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]
          ${pressed ? 'scale-[.97] motion-reduce:scale-100' : ''} ${tone}`}
      >
        <span className="inline-flex items-center justify-center gap-2 [grid-area:1/1]"><Trash />{children}</span>
        <span aria-hidden="true" className={`${layer} [clip-path:inset(0_calc((1-var(--p))*100%)_0_0)]`}><Trash />{children}</span>
        <span aria-hidden="true" className={`${layer} transition-[opacity,transform] duration-[260ms] ease-[cubic-bezier(.34,1.56,.64,1)] motion-reduce:transition-none ${done ? 'opacity-100' : 'translate-y-[40%] opacity-0 motion-reduce:translate-y-0'}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          {doneLabel}
        </span>
      </button>
      <p id={hint} className="m-0 text-[13px] text-[var(--text-muted)]">Maintenez le clic ou la touche Espace {(duration / 1000).toLocaleString('fr-FR')}&nbsp;s.</p>
      <span aria-live="polite" className="sr-only">{done ? doneLabel : ''}</span>
    </div>
  );
}

// Exemple
export function Exemple() {
  return <HoldButton duration={1500} resetAfter={2400} variant="danger" doneLabel="Projet supprimé" onConfirm={() => {}}>Maintenir pour supprimer</HoldButton>;
}
