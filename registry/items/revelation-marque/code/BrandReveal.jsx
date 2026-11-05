// Révélation de marque — React + Tailwind CSS. Couleurs : variables de tokens.css.
// <BrandReveal>{page}</BrandReveal> : le logo se construit, le mot-symbole monte de son masque, puis le voile se lève.
// Web Animations API + easing linear() généré depuis un ressort ; aucune bibliothèque d'animation.
import { useCallback, useEffect, useRef, useState } from 'react';

const PETALS = [
  'M16 16A7.2 7.2 0 0 1 16 3.4A7.2 7.2 0 0 1 16 16Z',
  'M16 16A7.2 7.2 0 0 1 28.6 16A7.2 7.2 0 0 1 16 16Z',
  'M16 16A7.2 7.2 0 0 1 16 28.6A7.2 7.2 0 0 1 16 16Z',
  'M16 16A7.2 7.2 0 0 1 3.4 16A7.2 7.2 0 0 1 16 16Z',
];
const ROT = [0, 90, 180, 270];
const EXPO = 'cubic-bezier(.16, 1, .3, 1)';
const INOUT = 'cubic-bezier(.76, 0, .24, 1)';
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function spring(k, c) {
  let x = 0, v = 0, t = 0; const dt = 1 / 120, pts = [];
  while (t < 3) { v += (-k * (x - 1) - c * v) * dt; x += v * dt; t += dt; pts.push(x); if (t > 0.3 && Math.abs(x - 1) < 0.001 && Math.abs(v) < 0.01) break; }
  const step = Math.max(1, Math.round(pts.length / 56)), out = ['0'];
  for (let i = step; i < pts.length; i += step) out.push(pts[i].toFixed(3));
  return { easing: `linear(${[...out, '1'].join(', ')})`, duration: Math.round(t * 1000) };
}

export function NacreMark({ className = '' }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      {PETALS.map((d) => <path key={d} d={d} className="fill-[var(--accent)]" />)}
      <circle cx="16" cy="16" r="2.1" className="fill-[var(--bg)]" />
    </svg>
  );
}

export function BrandReveal({
  name = 'nacre', mode = 'intro', exit = 'curtain', duration = 2400, stagger = 90,
  stiffness = 240, damping = 15, showPercent = true, onDone, children,
}) {
  const refs = { root: useRef(null), veil: useRef(null), big: useRef(null), spin: useRef(null), pearl: useRef(null), center: useRef(null) };
  const petals = useRef([]), letters = useRef([]);
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState('loading'); // loading → leaving → done
  const ctl = useRef({ anims: [], timers: [], raf: 0, run: 0, visible: true, pending: null });

  const clear = useCallback(() => {
    const c = ctl.current; c.run++;
    c.anims.forEach((a) => a.cancel()); c.anims = []; c.timers.forEach(clearTimeout); c.timers = []; cancelAnimationFrame(c.raf); c.pending = null;
  }, []);

  const play = useCallback(() => {
    clear();
    const c = ctl.current, id = c.run;
    const A = (el, kf, o) => { if (!el) return null; const a = el.animate(kf, { fill: 'both', ...o }); c.anims.push(a); return a; };
    const later = (fn, ms) => c.timers.push(setTimeout(fn, ms));
    setPhase('loading'); setPct(0);
    if (reduced()) {
      setPct(100);
      if (mode !== 'loop') later(() => { setPhase('leaving'); A(refs.veil.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).onfinish = () => { setPhase('done'); onDone?.(); }; }, 700);
      return;
    }
    const S = spring(stiffness, damping);
    petals.current.forEach((p, i) => A(p, [
      { transform: `rotate(${ROT[i] - 90}deg) scale(0)`, opacity: 0 },
      { transform: `rotate(${ROT[i] - 90}deg) scale(.15)`, opacity: 1, offset: 0.08 },
      { transform: 'rotate(0deg) scale(1)', opacity: 1 },
    ], { duration: S.duration, easing: S.easing, delay: i * stagger }));
    A(refs.spin.current, [{ transform: 'rotate(-45deg)' }, { transform: 'rotate(0deg)' }], { duration: S.duration + 200, easing: S.easing, delay: 3 * stagger + 120 });
    A(refs.pearl.current, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: S.duration, easing: spring(420, 16).easing, delay: 4 * stagger + 160 });
    letters.current.forEach((l, i) => A(l, [{ transform: 'translateY(115%) rotate(6deg)' }, { transform: 'none' }], { duration: 900, easing: EXPO, delay: 4 * stagger + 260 + i * 45 }));

    const t0 = performance.now();
    const tick = (now) => {
      if (id !== ctl.current.run) return;
      const p = Math.min(1, (now - t0) / duration), e = p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
      setPct(Math.round(e * 100));
      if (p < 1) c.raf = requestAnimationFrame(tick);
    };
    c.raf = requestAnimationFrame(tick);

    if (mode === 'loop') {
      const out = () => {
        petals.current.forEach((p, i) => A(p, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'rotate(90deg) scale(0)', opacity: 0 }], { duration: 520, easing: INOUT, delay: i * 50 }));
        A(refs.pearl.current, [{ transform: 'scale(1)' }, { transform: 'scale(0)' }], { duration: 300, easing: INOUT });
        letters.current.forEach((l, i) => A(l, [{ transform: 'none' }, { transform: 'translateY(-115%)' }], { duration: 520, easing: INOUT, delay: i * 30 }));
        later(() => (ctl.current.visible ? play() : (ctl.current.pending = play)), 760);
      };
      later(() => (ctl.current.visible ? out() : (ctl.current.pending = out)), duration + 400);
      return;
    }

    later(() => {
      setPhase('leaving');
      let a;
      if (exit === 'zoom') {
        A(refs.big.current, [{ transform: 'scale(1)' }, { transform: 'scale(.9)', offset: 0.18 }, { transform: 'scale(42)' }], { duration: 1100, easing: 'cubic-bezier(.7, 0, .2, 1)' });
        a = A(refs.veil.current, [{ opacity: 1 }, { opacity: 1, offset: 0.55 }, { opacity: 0 }], { duration: 1100, easing: 'linear' });
      } else if (exit === 'fade') {
        a = A(refs.veil.current, [{ opacity: 1, filter: 'blur(0)' }, { opacity: 0, filter: 'blur(6px)' }], { duration: 700, easing: 'ease-out' });
      } else {
        A(refs.center.current, [{ transform: 'none' }, { transform: 'translateY(-40px)' }], { duration: 1000, easing: INOUT });
        a = A(refs.veil.current, [
          { transform: 'none', borderBottomLeftRadius: '0px', borderBottomRightRadius: '0px' },
          { transform: 'translateY(-60%)', borderBottomLeftRadius: '50% 120px', borderBottomRightRadius: '50% 120px', offset: 0.6 },
          { transform: 'translateY(-110%)', borderBottomLeftRadius: '50% 0px', borderBottomRightRadius: '50% 0px' },
        ], { duration: 1050, easing: INOUT });
      }
      if (a) a.onfinish = () => { if (id === ctl.current.run) { setPhase('done'); onDone?.(); } };
    }, duration + 200);
  }, [clear, mode, exit, duration, stagger, stiffness, damping, onDone]);

  useEffect(() => { play(); return clear; }, [play, clear]);

  // Pause hors de l'écran (préchargeur en boucle).
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      const c = ctl.current; c.visible = e.isIntersecting;
      c.anims.forEach((a) => { if (!c.visible && a.playState === 'running') a.pause(); if (c.visible && a.playState === 'paused') a.play(); });
      if (c.visible && c.pending) { const f = c.pending; c.pending = null; f(); }
    }, { threshold: 0.1 });
    if (refs.root.current) io.observe(refs.root.current);
    return () => io.disconnect();
  }, []);

  const revealed = phase !== 'loading';
  return (
    <div ref={refs.root} className="relative isolate min-h-[600px] overflow-hidden bg-[var(--bg)] font-sans text-[var(--text)]">
      <div className={`min-h-[inherit] transition duration-700 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transform-none ${revealed ? 'translate-y-0 opacity-100 delay-150' : 'translate-y-6 opacity-0'}`}>
        {typeof children === 'function' ? children({ replay: play }) : children}
      </div>

      {(
        <div ref={refs.veil} hidden={phase === 'done'} role="status" aria-live="polite" aria-label={`Chargement de ${name}`}
          className="absolute inset-0 z-[5] grid place-items-center bg-[var(--surface)] text-[var(--text-strong)] will-change-transform">
          <div ref={refs.center} className="grid justify-items-center gap-5">
            <svg ref={refs.big} viewBox="0 0 32 32" aria-hidden="true" className="h-auto w-[clamp(88px,11vw,120px)] overflow-visible">
              <g ref={refs.spin} style={{ transformBox: 'view-box', transformOrigin: '16px 16px' }}>
                {PETALS.map((d, i) => <path key={d} ref={(el) => { petals.current[i] = el; }} d={d} className="fill-[var(--accent)]" style={{ transformBox: 'view-box', transformOrigin: '16px 16px' }} />)}
              </g>
              <circle ref={refs.pearl} cx="16" cy="16" r="2.1" className="fill-[var(--surface)]" style={{ transformBox: 'view-box', transformOrigin: '16px 16px' }} />
            </svg>
            <span aria-hidden="true" className="inline-flex overflow-hidden px-[.02em] pb-[.12em] pt-[.04em] text-[clamp(36px,4.6vw,52px)] font-semibold leading-none tracking-[-0.05em]">
              {[...name].map((ch, i) => <span key={i} ref={(el) => { letters.current[i] = el; }} className="inline-block">{ch}</span>)}
            </span>
          </div>
          <div aria-hidden="true" className={`absolute inset-x-[clamp(16px,4vw,48px)] bottom-[clamp(24px,4vw,40px)] flex items-center gap-4 transition-opacity ${showPercent ? 'opacity-100' : 'opacity-0'}`}>
            <span className="relative h-px flex-1 overflow-hidden bg-[var(--border)]">
              <i className="absolute inset-0 origin-left bg-[var(--text-strong)]" style={{ transform: `scaleX(${pct / 100})` }} />
            </span>
            <span className="min-w-[4ch] text-right font-mono text-[13px] tabular-nums text-[var(--text-muted)]">{pct}&nbsp;%</span>
          </div>
          <span className="sr-only">{revealed ? `${name} est prêt.` : 'Chargement…'}</span>
        </div>
      )}
    </div>
  );
}

export default BrandReveal;
