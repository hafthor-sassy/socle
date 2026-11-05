// Carte holographique — React + Tailwind CSS. Couleurs : variables de tokens.css. Aucune autre dépendance.
// Inclinaison au pointeur, au clavier et au gyroscope (autorisation iOS), paillettes sur canvas, retour au repos par ressort.
import { useEffect, useRef, useState } from 'react';

const MARK = 'M14 14H40V60H86V86H22A8 8 0 0 1 14 78Z';
const svgMask = (svg, size) => `url("data:image/svg+xml,${encodeURIComponent(svg)}") 0 0 / ${size}px ${size}px`;
const MASKS = {
  lignes: 'repeating-linear-gradient(-58deg, #000 0 1px, rgba(0,0,0,.5) 1px 4px)',
  losanges: svgMask("<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'><path d='M8 .5 15.5 8 8 15.5 .5 8Z' fill='none' stroke='#000'/><circle cx='8' cy='8' r='1.2'/></svg>", 16),
  monogramme: svgMask(`<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><g opacity='.6' transform='translate(5 5) scale(.19) translate(-14 -14)'><path d='${MARK}'/><rect x='50' y='14' width='36' height='36' rx='8'/></g><g opacity='.3' transform='translate(29 29) scale(.19) translate(-14 -14)'><path d='${MARK}'/><rect x='50' y='14' width='36' height='36' rx='8'/></g></svg>`, 48),
  uni: 'linear-gradient(#000, #000)',
};
const FOIL = 'repeating-linear-gradient(110deg, var(--chart-1) 0%, var(--chart-4) 6%, var(--chart-5) 12%, var(--chart-6) 18%, var(--chart-3) 24%, var(--chart-1) 30%)';
const LIGHT_SPOT = 'radial-gradient(farthest-corner circle at calc(50% + var(--x) * 50%) calc(50% + var(--y) * 50%), #000 0%, rgba(0,0,0,.55) 35%, rgba(0,0,0,.12) 75%)';
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/**
 * @param {{
 *   name?: string, memberId?: string, since?: string, until?: string, tier?: string,
 *   motif?: 'lignes' | 'losanges' | 'monogramme' | 'uni',
 *   tilt?: number, glare?: number, foil?: number, sparkle?: number, radius?: 8 | 12 | 16,
 *   stiffness?: number, damping?: number, surface?: 'nuit' | 'theme', gyroscope?: boolean, autoSway?: boolean,
 *   className?: string
 * }} props
 */
export function CarteHolographique({
  name = 'Camille Arnaud',
  memberId = '0428 7731',
  since = '03/2024',
  until = '12/2027',
  tier = 'Pro',
  motif = 'lignes',   // motif qui découpe le film irisé
  tilt = 14,          // inclinaison max en degrés
  glare = 0.6,        // force du reflet (0 → 1)
  foil = 0.7,         // force de l'irisation (0 → 1)
  sparkle = 0.5,      // densité des paillettes (0 → 1)
  radius = 16,        // 8, 12 ou 16 px
  stiffness = 170,    // raideur du ressort
  damping = 14,       // amortissement : bas = oscille, haut = retour sec
  surface = 'nuit',   // 'nuit' : toujours sombre ; 'theme' : suit le thème de la page
  gyroscope = true,
  autoSway = false,
  className = '',
}) {
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const cardRef = useRef(null);
  const cvsRef = useRef(null);
  const cfg = useRef({});
  cfg.current = { stiffness, damping, autoSway, gyroscope, sparkle };
  const api = useRef(null);
  const [active, setActive] = useState(false);
  const [gyroState, setGyroState] = useState('off'); // off | ask | denied | error | on

  useEffect(() => {
    const root = rootRef.current, stage = stageRef.current, card = cardRef.current, cvs = cvsRef.current;
    const ctx = cvs.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let x = 0, y = 0, vx = 0, vy = 0, tx = 0, ty = 0, raf = 0, last = 0, clock = 0;
    let inView = true, hover = false, focusTilt = false, gyro = false, b0 = null, g0 = null;
    let W = 0, H = 0, dpr = 1, colors = [], sparks = [];

    const readColors = () => {
      const cs = getComputedStyle(card);
      colors = ['--chart-1', '--chart-4', '--chart-5', '--chart-6', '--chart-3', '--chart-2'].map((n) => cs.getPropertyValue(n).trim() || 'gray');
      colors.light = cs.getPropertyValue('--holo-light').trim();
    };
    const seed = () => {
      let s = 42;
      const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
      sparks = Array.from({ length: Math.round(clamp(cfg.current.sparkle, 0, 1) * 420) }, (_, i) => {
        const big = r() < 0.1;
        return { x: r(), y: r(), s: big ? 1.2 + r() * 1 : 0.5 + r() * 0.8, nx: r() * 2 - 1, ny: r() * 2 - 1, c: i % 6, star: big };
      });
    };
    const draw = () => {
      if (!W) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (const p of sparks) {
        const dx = p.nx - x, dy = p.ny - y, b = Math.exp(-(dx * dx + dy * dy) / 0.09);
        const px = p.x * W, py = p.y * H;
        ctx.globalAlpha = 0.12 + 0.88 * b;
        ctx.fillStyle = colors[p.c];
        ctx.beginPath(); ctx.arc(px, py, p.s, 0, 6.2832); ctx.fill();
        if (b > 0.5) {
          const k = (b - 0.5) / 0.5;
          ctx.globalAlpha = k; ctx.fillStyle = colors.light;
          ctx.beginPath(); ctx.arc(px, py, p.s * 0.6, 0, 6.2832); ctx.fill();
          if (p.star) {
            const l = p.s * 5 * k;
            ctx.strokeStyle = colors.light; ctx.lineWidth = 0.6; ctx.globalAlpha = k * 0.8;
            ctx.beginPath(); ctx.moveTo(px - l, py); ctx.lineTo(px + l, py); ctx.moveTo(px, py - l); ctx.lineTo(px, py + l); ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
    };
    const size = () => {
      W = card.offsetWidth; H = card.offsetHeight; dpr = Math.min(2, window.devicePixelRatio || 1);
      cvs.width = Math.round(W * dpr); cvs.height = Math.round(H * dpr);
      draw();
    };
    const paint = () => {
      root.style.setProperty('--x', x.toFixed(4));
      root.style.setProperty('--y', y.toFixed(4));
      root.style.setProperty('--hyp', clamp(Math.hypot(x, y), 0, 1).toFixed(3));
      root.style.setProperty('--fa', `${(Math.atan2(y, x) * 57.2958 + x * 90).toFixed(1)}deg`);
      draw();
    };
    const frame = (t) => {
      const dt = last ? Math.min(0.032, (t - last) / 1000) : 0.016;
      last = t;
      const { stiffness: k, damping: c, autoSway: sway } = cfg.current;
      if (sway && !hover && !gyro && !focusTilt) { clock += dt; tx = Math.sin(clock * 0.7) * 0.6; ty = Math.sin(clock * 0.43 + 1) * 0.4; }
      vx += (-k * (x - tx) - c * vx) * dt;
      vy += (-k * (y - ty) - c * vy) * dt;
      x += vx * dt; y += vy * dt;
      const rest = !sway && Math.abs(x - tx) + Math.abs(y - ty) + Math.abs(vx) + Math.abs(vy) < 0.002;
      if (rest) { x = tx; y = ty; vx = vy = 0; }
      paint();
      if (rest || !inView) { raf = 0; last = 0; return; }
      raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && inView && !reduce) raf = requestAnimationFrame(frame); };
    const target = (nx, ny) => { tx = clamp(nx, -1, 1); ty = clamp(ny, -1, 1); wake(); };

    const onMove = (e) => {
      if (reduce || (gyro && e.pointerType === 'touch')) return;
      hover = true; setActive(true);
      const r = stage.getBoundingClientRect();
      target(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
    };
    const onLeave = () => { hover = false; setActive(false); if (!gyro) target(0, 0); };
    const onKey = (e) => {
      const m = { ArrowLeft: [-0.34, 0], ArrowRight: [0.34, 0], ArrowUp: [0, -0.34], ArrowDown: [0, 0.34] }[e.key];
      if (m) { e.preventDefault(); focusTilt = true; target(tx + m[0], ty + m[1]); }
      if (e.key === 'Escape') { focusTilt = false; target(0, 0); }
    };
    const onFocus = () => { if (!hover && card.matches(':focus-visible')) { focusTilt = true; target(-0.45, -0.3); } };
    const onBlur = () => { if (focusTilt) { focusTilt = false; target(0, 0); } };
    const onOrient = (e) => {
      if (e.beta == null || e.gamma == null || !inView || reduce) return;
      if (b0 == null) { b0 = e.beta; g0 = e.gamma; }
      b0 += (e.beta - b0) * 0.004; g0 += (e.gamma - g0) * 0.004;   // recentrage lent
      gyro = true;
      if (!hover) target((e.gamma - g0) / 22, (e.beta - b0) / 22);
    };
    const startGyro = () => { window.addEventListener('deviceorientation', onOrient); setGyroState('on'); };

    card.addEventListener('pointermove', onMove, { passive: true });
    card.addEventListener('pointerdown', onMove, { passive: true });
    card.addEventListener('pointerleave', onLeave);
    card.addEventListener('pointercancel', onLeave);
    card.addEventListener('keydown', onKey);
    card.addEventListener('focus', onFocus);
    card.addEventListener('blur', onBlur);

    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const pp = document.permissionsPolicy || document.featurePolicy; // iframe sans allow="accelerometer; gyroscope" : on s'abstient
    const allowed = !(pp && pp.allowsFeature) || (pp.allowsFeature('accelerometer') && pp.allowsFeature('gyroscope'));
    if (cfg.current.gyroscope && allowed && coarse && 'DeviceOrientationEvent' in window) {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') setGyroState('ask');
      else startGyro();
    }

    const io = new IntersectionObserver(([en]) => { inView = en.isIntersecting; if (inView) wake(); });
    io.observe(root);
    const ro = new ResizeObserver(size);
    ro.observe(card);
    const mo = new MutationObserver(() => { readColors(); draw(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-accent'] });

    readColors(); seed(); size();
    if (reduce) { x = tx = 0.42; y = ty = -0.3; }
    paint(); wake();

    api.current = {
      refresh: () => { readColors(); seed(); draw(); wake(); },
      requestGyro: () => DeviceOrientationEvent.requestPermission()
        .then((s) => (s === 'granted' ? startGyro() : setGyroState('denied')))
        .catch(() => setGyroState('error')),
    };
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); mo.disconnect();
      window.removeEventListener('deviceorientation', onOrient);
      ['pointermove', 'pointerdown'].forEach((t) => card.removeEventListener(t, onMove));
      ['pointerleave', 'pointercancel'].forEach((t) => card.removeEventListener(t, onLeave));
      card.removeEventListener('keydown', onKey); card.removeEventListener('focus', onFocus); card.removeEventListener('blur', onBlur);
    };
  }, []);

  useEffect(() => { api.current && api.current.refresh(); }, [sparkle, surface, autoSway]);

  const vars = {
    '--holo-tilt': `${tilt}deg`, '--holo-radius': `${radius}px`,
    '--x': 0, '--y': 0, '--hyp': 0, '--fa': '0deg',
  };
  const layer = 'pointer-events-none absolute inset-0 h-full w-full';
  const gyroLabel = { ask: 'Activer l’inclinaison', denied: 'Inclinaison refusée : Réglages › Safari', error: 'Gyroscope indisponible' }[gyroState];

  return (
    <div ref={rootRef} style={vars} className={`grid w-full max-w-[400px] justify-items-center gap-6 ${className}`}>
      <div ref={stageRef} className="relative w-full [perspective:1000px]">
        <span aria-hidden="true"
          className={`pointer-events-none absolute inset-x-[10%] bottom-[-4%] top-[14%] rounded-[var(--holo-radius)] blur-[24px]
            bg-[color-mix(in_srgb,var(--text-strong)_16%,transparent)] dark:bg-[color-mix(in_srgb,var(--chart-4)_24%,transparent)]
            [transform:translate3d(calc(var(--x)*-16px),calc(var(--y)*-10px+8px),0)] motion-reduce:[transform:translateY(8px)]`} />
        <article
          ref={cardRef}
          tabIndex={0}
          data-accent="terracotta"
          aria-label={`Carte membre Socle ${tier}`}
          aria-describedby="holo-hint"
          className={`${surface === 'nuit' ? 'dark' : ''} relative isolate block aspect-[1.586] w-full touch-pan-y overflow-hidden rounded-[var(--holo-radius)]
            bg-[var(--surface)] text-[var(--text)] outline-none [container-type:inline-size] [will-change:transform]
            [--holo-light:var(--surface)] [&.dark]:[--holo-light:var(--text-strong)] dark:[--holo-light:var(--text-strong)]
            [transform:rotateX(calc(var(--y)*var(--holo-tilt)*-1))_rotateY(calc(var(--x)*var(--holo-tilt)))] motion-reduce:[transform:none]
            transition-[scale] duration-[420ms] ease-[cubic-bezier(.34,1.56,.64,1)] ${active ? 'scale-[1.035] motion-reduce:scale-100' : 'scale-100'}
            focus-visible:shadow-[0_0_0_2px_var(--bg),0_0_0_4px_var(--focus-ring)]
            after:pointer-events-none after:absolute after:inset-0 after:z-[4] after:rounded-[inherit] after:content-['']
            after:shadow-[inset_0_0_0_1px_var(--border),inset_0_1px_0_color-mix(in_srgb,var(--holo-light)_14%,transparent)]`}
        >
          <span aria-hidden="true" className={layer} style={{ background: 'radial-gradient(120% 100% at 0% 0%, var(--raised), var(--surface) 62%)' }} />
          <canvas ref={cvsRef} aria-hidden="true" className={`${layer} z-[1] ${surface === 'nuit' ? 'mix-blend-screen' : 'opacity-55 mix-blend-multiply dark:opacity-100 dark:mix-blend-screen'}`} />
          <span aria-hidden="true"
            className={`${layer} z-[1] ${surface === 'nuit' ? 'mix-blend-screen' : 'mix-blend-multiply dark:mix-blend-screen'}`}
            style={{
              backgroundImage: FOIL,
              backgroundSize: '400% 400%',
              backgroundPosition: 'calc(50% + var(--x) * 60%) calc(50% + var(--y) * 60%)',
              opacity: `calc(${foil} * (.1 + var(--hyp) * .85))`,
              filter: 'saturate(1.35)',
              // le motif, croisé avec une tache qui suit la lumière
              WebkitMask: `${MASKS[motif] || MASKS.lignes}, ${LIGHT_SPOT}`,
              WebkitMaskComposite: 'source-in',
              mask: `${MASKS[motif] || MASKS.lignes}, ${LIGHT_SPOT}`,
              maskComposite: 'intersect',
            }} />

          <div className="relative z-[2] grid h-full grid-rows-[auto_1fr_auto] p-6 [text-shadow:0_0_1px_var(--surface),0_0_10px_color-mix(in_srgb,var(--surface)_70%,transparent)] [@container(max-width:359px)]:px-5 [@container(max-width:359px)]:py-4">
            <div className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 text-base font-semibold leading-6 tracking-[-0.01em] text-[var(--text-strong)]">
                <svg viewBox="14 14 72 72" aria-hidden="true" className="h-6 w-6"><path d={MARK} fill="var(--accent-vivid)" /><rect x="50" y="14" width="36" height="36" rx="8" fill="var(--accent)" /></svg>
                Socle
              </span>
              <span aria-hidden="true"
                className="relative grid h-10 w-10 place-items-center rounded-full shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--holo-light)_30%,transparent)]"
                style={{ background: 'conic-gradient(from var(--fa), var(--chart-1), var(--chart-4), var(--chart-5), var(--chart-6), var(--chart-3), var(--chart-1))' }}>
                <span className="absolute inset-0 rounded-full mix-blend-overlay"
                  style={{ background: 'radial-gradient(circle at calc(50% + var(--x) * 40%) calc(50% + var(--y) * 40%), color-mix(in srgb, var(--holo-light) 60%, transparent), transparent 60%)' }} />
                <svg viewBox="14 14 72 72" className="relative h-[18px] w-[18px] fill-[var(--surface)] opacity-[.82]"><path d={MARK} /><rect x="50" y="14" width="36" height="36" rx="8" /></svg>
              </span>
            </div>
            <div className="grid gap-1 self-end pb-4 [@container(max-width:359px)]:pb-3">
              <p className="m-0 flex items-baseline gap-2 font-mono text-xs font-medium uppercase leading-4 tracking-[.08em] text-[var(--text-muted)]">
                Carte membre
                <span className="bg-clip-text font-semibold [text-shadow:none] tracking-[.14em] text-transparent"
                  style={{ backgroundImage: 'linear-gradient(90deg, var(--chart-1), var(--chart-4), var(--chart-5), var(--chart-6), var(--chart-3))', backgroundSize: '300% 100%', backgroundPosition: 'calc(50% + var(--x) * 50%) 0' }}>
                  {tier}
                </span>
              </p>
              <h3 className="m-0 truncate text-[26px] font-semibold leading-8 tracking-[-0.02em] text-[var(--text-strong)] [@container(max-width:359px)]:text-[22px] [@container(max-width:359px)]:leading-7">{name}</h3>
            </div>
            <dl className="m-0 flex justify-between gap-4 border-t border-[var(--border)] pt-3 [@container(max-width:359px)]:gap-2">
              {[['N° membre', memberId], ['Depuis', since], ['Valide jusqu’à', until]].map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="whitespace-nowrap text-xs font-medium leading-4 text-[var(--text)]">{k}</dt>
                  <dd className="m-0 mt-0.5 whitespace-nowrap font-mono text-sm font-medium leading-5 tabular-nums text-[var(--text-strong)]">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <span aria-hidden="true" className={`${layer} z-[3] ${surface === 'nuit' ? 'mix-blend-screen' : 'mix-blend-soft-light dark:mix-blend-screen'}`}
            style={{
              background: 'radial-gradient(farthest-corner circle at calc(50% + var(--x) * 55%) calc(50% + var(--y) * 55%), color-mix(in srgb, var(--holo-light) 42%, transparent) 0%, color-mix(in srgb, var(--holo-light) 10%, transparent) 30%, transparent 60%)',
              opacity: `calc(${glare} * (.25 + var(--hyp) * .75))`,
            }} />
        </article>
      </div>
      <p id="holo-hint" className="sr-only">Carte interactive : les flèches du clavier l’inclinent, Échap la remet à plat.</p>
      {gyroscope && gyroLabel && (
        <button type="button" disabled={gyroState !== 'ask'} onClick={() => api.current.requestGyro()}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border-control)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text-strong)]
            transition-[background-color,scale] duration-150 active:scale-[.97] disabled:text-[var(--text-muted)] [@media(hover:hover)]:hover:enabled:bg-[var(--raised)]
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="7" y="3" width="10" height="18" rx="2.5" /><path d="M11 17.5h2M3.5 9.5a9 9 0 0 0 0 5M20.5 9.5a9 9 0 0 1 0 5" /></svg>
          <span aria-live="polite">{gyroLabel}</span>
        </button>
      )}
    </div>
  );
}

// Exemple
export function Exemple() {
  return (
    <CarteHolographique
      name="Camille Arnaud"
      motif="lignes"
      tilt={14}
      glare={0.6}
      foil={0.7}
      sparkle={0.5}
      radius={16}
      stiffness={170}
      damping={14}
      surface="nuit"
      gyroscope={true}
      autoSway={false}
    />
  );
}
