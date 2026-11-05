// Trame de points réactive — React + Tailwind CSS. Canvas 2D, sans dépendance.
// Couleurs : variables de tokens.css (--border-control pour les points, --accent-vivid près du pointeur).
import { useEffect, useRef, useState } from 'react';

/**
 * @param {object} props
 * @param {number} [props.gap=24]      Pas de la grille (px)
 * @param {number} [props.size=1.6]    Rayon d'un point au repos (px)
 * @param {number} [props.radius=160]  Rayon d'influence du pointeur (px)
 * @param {number} [props.force=22]    Écart maximal d'un point (px)
 * @param {number} [props.grow=1.6]    Grossissement près du pointeur (×)
 * @param {'accent'|'neutre'} [props.tone='accent']
 * @param {boolean} [props.ripple=true]   Onde au clic / tap
 * @param {boolean} [props.ambient=true]  Respiration lente de la trame
 * @param {boolean} [props.auto=true]     Pointeur fantôme sans souris
 * @param {'ellipse'|'none'} [props.mask='ellipse']
 * @param {(cell: {row: string, col: number}) => void} [props.onCell]
 */
export function DotGrid({
  gap = 24, size = 1.6, radius = 160, force = 22, grow = 1.6, tone = 'accent',
  ripple = true, ambient = true, auto = true, mask = 'ellipse', onCell, className = '', children,
}) {
  const hostRef = useRef(null);
  const fieldRef = useRef(null);
  const opts = useRef({});
  opts.current = { gap: Math.max(10, gap), size, radius, force, grow, tone, ripple, ambient, auto, onCell };
  const api = useRef(null);

  useEffect(() => {
    const el = fieldRef.current, section = hostRef.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const canvas = document.createElement('canvas');
    canvas.className = 'block h-full w-full';
    el.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let W = 1, H = 1, dpr = 1, dots = [], cols = 0, rows = 0, gapUsed = 0;
    let px = -9999, py = -9999, inside = false, pinf = 0, lastInput = -1e9;
    let waves = [], raf = 0, visible = true, last = 0, settled = 0;
    const t0 = performance.now();
    let cb = [120, 120, 130], ca = [171, 78, 49];

    const rgb = (s) => (String(s).match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);
    const colors = () => {
      const probe = document.createElement('i');
      probe.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden';
      el.appendChild(probe);
      probe.style.color = 'var(--border-control)'; cb = rgb(getComputedStyle(probe).color);
      probe.style.color = opts.current.tone === 'neutre' ? 'var(--text-strong)' : 'var(--accent-vivid)'; ca = rgb(getComputedStyle(probe).color);
      probe.remove();
    };
    const layout = () => {
      const r = el.getBoundingClientRect(), g = opts.current.gap;
      dpr = Math.min(2, window.devicePixelRatio || 1); W = Math.max(1, r.width); H = Math.max(1, r.height);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      cols = Math.ceil(W / g) + 1; rows = Math.ceil(H / g) + 1; gapUsed = g;
      const offX = (W - (cols - 1) * g) / 2, offY = (H - (rows - 1) * g) / 2;
      dots = [];
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) dots.push({ x: offX + i * g, y: offY + j * g, ox: 0, oy: 0, vx: 0, vy: 0, s: 0, vs: 0 });
      draw(0, true);
    };
    const draw = (time, still) => {
      const o = opts.current, amb = o.ambient && !still;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = `rgba(${cb[0]},${cb[1]},${cb[2]},.55)`; ctx.beginPath();
      const hot = [];
      for (const d of dots) {
        const a = amb ? 0.18 * Math.sin(time * 0.0009 + d.x * 0.012 + d.y * 0.008) * Math.sin(time * 0.0006 - d.y * 0.01) : 0;
        if (d.s > 0.04) { hot.push(d); continue; }
        const rr = o.size * (1 + d.s + a), x = d.x + d.ox, y = d.y + d.oy;
        ctx.moveTo(x + rr, y); ctx.arc(x, y, rr, 0, 6.2832);
      }
      ctx.fill();
      for (const q of hot) {
        const m = Math.min(1, q.s / Math.max(0.2, o.grow)), mix = (i) => Math.round(cb[i] + (ca[i] - cb[i]) * m);
        ctx.fillStyle = `rgba(${mix(0)},${mix(1)},${mix(2)},${(0.55 + 0.45 * m).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(q.x + q.ox, q.y + q.oy, o.size * (1 + q.s), 0, 6.2832); ctx.fill();
      }
    };
    const step = (now) => {
      raf = 0; if (!visible) return;
      const o = opts.current, dt = Math.min(0.033, last ? (now - last) / 1000 : 0.016); last = now;
      const time = now - t0, ghost = o.auto && !inside && now - lastInput > 2200;
      if (ghost) {
        const mob = W < 720, gt = time * 0.00022;
        const gx = (mob ? W * 0.5 : W * 0.72) + (mob ? W * 0.32 : W * 0.16) * Math.sin(gt * 2.1);
        const gy = (mob ? H * 0.2 : H * 0.5) + (mob ? H * 0.1 : H * 0.26) * Math.sin(gt * 3.3 + 0.8);
        if (pinf < 0.02) { px = gx; py = gy; } else { px += (gx - px) * Math.min(1, dt * 3); py += (gy - py) * Math.min(1, dt * 3); }
      }
      pinf += ((inside ? 1 : ghost ? 0.75 : 0) - pinf) * Math.min(1, dt * (ghost ? 1.5 : 8));
      waves = waves.filter((w) => { w.r += 720 * dt; w.a -= dt * 0.9; return w.a > 0; });
      const R = o.radius, R2 = R * R, k = 170, c = 14;
      let energy = 0;
      for (const d of dots) {
        let tx = 0, ty = 0, ts = 0;
        const dx = d.x - px, dy = d.y - py, d2 = dx * dx + dy * dy;
        if (pinf > 0.001 && d2 < R2) {
          const dist = Math.sqrt(d2) || 1, f = 1 - dist / R, e = f * f * (3 - 2 * f) * pinf;
          tx = (dx / dist) * o.force * e; ty = (dy / dist) * o.force * e; ts = o.grow * e;
        }
        for (const w of waves) {
          const wx = d.x - w.x, wy = d.y - w.y, wd = Math.sqrt(wx * wx + wy * wy) || 1, band = 1 - Math.abs(wd - w.r) / 70;
          if (band > 0) { const b = band * band * w.a; tx += (wx / wd) * o.force * 0.8 * b; ty += (wy / wd) * o.force * 0.8 * b; ts += o.grow * 0.9 * b; }
        }
        d.vx += ((tx - d.ox) * k - d.vx * c) * dt; d.vy += ((ty - d.oy) * k - d.vy * c) * dt; d.vs += ((ts - d.s) * k - d.vs * c) * dt;
        d.ox += d.vx * dt; d.oy += d.vy * dt; d.s += d.vs * dt;
        energy += Math.abs(d.vx) + Math.abs(d.vy) + Math.abs(d.vs) * 20;
      }
      draw(time, false);
      settled = energy < 0.5 && !waves.length ? settled + dt : 0;
      if (o.ambient || o.auto || settled < 0.25) raf = requestAnimationFrame(step); else last = 0;
    };
    const wake = () => { if (!raf && visible && !reduced.matches) raf = requestAnimationFrame(step); };
    const local = (e) => { const r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const onMove = (e) => {
      [px, py] = local(e); lastInput = performance.now();
      inside = px >= 0 && py >= 0 && px <= W && py <= H;
      section.dataset.active = String(inside);
      if (inside && opts.current.onCell) opts.current.onCell({ row: String.fromCharCode(65 + (Math.round(py / gapUsed) % 26)), col: Math.round(px / gapUsed) + 1 });
      wake();
    };
    const onLeave = () => { inside = false; lastInput = performance.now(); section.dataset.active = 'false'; wake(); };
    const onDown = (e) => {
      if (!opts.current.ripple || reduced.matches || e.target.closest('a,button,input,select,textarea')) return;
      const [x, y] = local(e); lastInput = performance.now();
      waves.push({ x, y, r: 0, a: 1 }); if (waves.length > 4) waves.shift(); wake();
    };
    section.addEventListener('pointermove', onMove, { passive: true });
    section.addEventListener('pointerdown', onDown, { passive: true });
    section.addEventListener('pointerleave', onLeave);
    const ro = new ResizeObserver(() => { layout(); wake(); }); ro.observe(el);
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) wake(); else { cancelAnimationFrame(raf); raf = 0; last = 0; } });
    io.observe(el);
    const mo = new MutationObserver(() => { colors(); draw(performance.now() - t0, reduced.matches); wake(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-accent'] });
    colors(); layout(); wake();
    api.current = { refresh: () => { colors(); if (opts.current.gap !== gapUsed) layout(); wake(); } };
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); mo.disconnect();
      section.removeEventListener('pointermove', onMove); section.removeEventListener('pointerdown', onDown); section.removeEventListener('pointerleave', onLeave);
      canvas.remove();
    };
  }, []);

  useEffect(() => { api.current?.refresh(); }, [gap, tone, size, ambient, auto]);

  const maskCls = mask === 'ellipse'
    ? '[&>canvas]:[mask-image:linear-gradient(#000_22%,transparent_62%)] md:[&>canvas]:[mask-image:radial-gradient(120%_90%_at_70%_50%,#000_40%,transparent_92%)]'
    : '';
  return (
    <section ref={hostRef} data-active="false" className={`group relative isolate grid overflow-hidden bg-[var(--bg)] [font-family:var(--font-sans)] text-[var(--text)] ${className}`}>
      <div ref={fieldRef} aria-hidden="true" className={`absolute inset-0 -z-10 touch-pan-y ${maskCls}`} />
      {children}
    </section>
  );
}

/* Exemple : hero de Semis (marque fictive, capteurs agricoles). */
export default function SemisHero() {
  const [cell, setCell] = useState({ row: 'A', col: 1 });
  const hum = 22 + Math.round(14 * (0.5 + 0.5 * Math.sin(cell.col * 0.45) * Math.cos(cell.row.charCodeAt(0) * 0.37)));
  return (
    <DotGrid onCell={setCell} className="min-h-[640px] items-end md:min-h-[clamp(600px,86svh,800px)] md:items-center">
      <div className="pointer-events-none mx-auto w-full max-w-[1200px] px-5 pb-8 pt-40 md:px-6 md:py-16 [&>*]:pointer-events-auto [&>*]:max-w-[36rem]">
        <p className="mb-5 inline-flex h-9 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] pl-2.5 pr-3.5 text-sm font-semibold text-[var(--text-strong)] md:mb-6">
          <svg viewBox="0 0 100 100" className="size-5 text-[var(--accent)]" aria-hidden="true">
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="6" opacity=".3" />
            <path d="M50 78V46" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
            <path d="M50 50C50 34 38 24 24 24c0 16 12 26 26 26Z" fill="currentColor" />
            <path d="M50 58c0-14 10-24 26-24 0 14-12 24-26 24Z" fill="currentColor" opacity=".55" />
          </svg>
          Semis<span className="h-3.5 w-px bg-[var(--border)]" aria-hidden="true" /><span className="font-medium text-[var(--text-muted)]">Capteurs de sol</span>
        </p>
        <h1 className="text-balance text-[clamp(2.375rem,1.5rem+3.3vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-[var(--text-strong)]">
          Chaque parcelle, mesurée au mètre&nbsp;près.
        </h1>
        <p className="mt-4 max-w-[30rem] text-pretty text-base leading-relaxed text-[var(--text-muted)] md:mt-6 md:text-lg">
          Semis pose un réseau de capteurs dans vos champs et vous dit, rang par rang, où arroser, où semer et où attendre.
        </p>
        <div className="mt-6 flex flex-col gap-3 md:mt-8 md:flex-row">
          <a href="#essai" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--accent)] px-5 text-[15px] font-semibold text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] md:min-h-11">
            Cartographier mon exploitation
          </a>
          <a href="#demo" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--border-control)] bg-[var(--surface)] px-5 text-[15px] font-semibold text-[var(--text-strong)] transition-colors hover:bg-[var(--raised)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] md:min-h-11">
            Voir une parcelle type
          </a>
        </div>
        <dl className="mt-8 flex justify-between gap-8 border-t border-[var(--border)] pt-4 md:mt-12 md:justify-start md:pt-5">
          {[['Parcelles suivies', '12 400'], ['Précision', '± 0,8 m'], ['Eau économisée', '− 27 %']].map(([k, v]) => (
            <div key={k} className="grid gap-1">
              <dt className="text-[13px] leading-[18px] text-[var(--text-muted)]">{k}</dt>
              <dd className="text-[19px] font-semibold tabular-nums tracking-[-0.02em] text-[var(--text-strong)] md:text-[22px]">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p aria-hidden="true" className="absolute left-5 top-5 flex h-8 translate-y-2 items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 font-mono text-xs tabular-nums text-[var(--text-muted)] opacity-0 transition duration-300 group-data-[active=true]:translate-y-0 group-data-[active=true]:opacity-100 md:bottom-6 md:left-auto md:right-6 md:top-auto motion-reduce:transition-none">
        <span>Rang {cell.row} · {String(cell.col).padStart(2, '0')}</span><span className="text-[var(--text-strong)]">Humidité {hum} %</span>
      </p>
    </DotGrid>
  );
}
