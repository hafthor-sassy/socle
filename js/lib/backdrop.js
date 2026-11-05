/* Fond animé de l'accueil : « Trame de points réactive » (registry/items/trame-points-reactive).
   Grille de points sur canvas 2D tenus par des ressorts : ils s'écartent et grossissent autour
   du pointeur, prennent la couleur d'accent, un clic envoie une onde. Pointeur fantôme au tactile.
   Pause hors écran ; image fixe avec prefers-reduced-motion. Couleurs relues dans tokens.css. */
import { reducedMotion } from './dom.js';

export function backdropHTML({ cls = '', gap = 24, radius = 160 } = {}) {
  return `<div class="backdrop ${cls}" aria-hidden="true" data-dotgrid data-gap="${gap}" data-radius="${radius}"></div>`;
}

function parseColor(str) {
  const m = String(str).match(/[\d.]+/g) || [0, 0, 0];
  return [+m[0], +m[1], +m[2]];
}

function dotGrid(el, opts) {
  const host = el.parentElement;
  const o = { gap: 24, size: 1.5, radius: 160, force: 22, grow: 1.6, ambient: true, auto: true, ...opts };
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  el.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, dots = [];
  let px = -9999, py = -9999, inside = false, pinf = 0, lastInput = -1e9;
  const waves = [];
  let raf = 0, visible = true, last = 0, settledFor = 0;
  const t0 = performance.now();
  let colBase = [120, 120, 130], colAccent = [171, 78, 49];
  const still = () => reducedMotion();

  function colors() {
    const probe = document.createElement('i');
    probe.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden';
    el.appendChild(probe);
    probe.style.color = 'var(--border-control)'; colBase = parseColor(getComputedStyle(probe).color);
    probe.style.color = 'var(--accent-vivid)'; colAccent = parseColor(getComputedStyle(probe).color);
    probe.remove();
  }

  function layout() {
    const r = el.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const g = o.gap;
    const cols = Math.ceil(W / g) + 1, rows = Math.ceil(H / g) + 1;
    const offX = (W - (cols - 1) * g) / 2, offY = (H - (rows - 1) * g) / 2;
    dots = new Array(cols * rows);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      dots[j * cols + i] = { x: offX + i * g, y: offY + j * g, ox: 0, oy: 0, vx: 0, vy: 0, s: 0, vs: 0 };
    }
    draw(0, true);
  }

  function draw(time, frozen) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const base = o.size, amb = o.ambient && !frozen, cb = colBase, ca = colAccent;
    ctx.fillStyle = `rgba(${cb[0]},${cb[1]},${cb[2]},.55)`;
    ctx.beginPath();
    const hot = [];
    for (const d of dots) {
      const a = amb ? 0.18 * Math.sin(time * 0.0009 + d.x * 0.012 + d.y * 0.008) * Math.sin(time * 0.0006 - d.y * 0.01) : 0;
      if (d.s > 0.04) { hot.push(d); continue; }
      const rr = base * (1 + d.s + a), x = d.x + d.ox, y = d.y + d.oy;
      ctx.moveTo(x + rr, y); ctx.arc(x, y, rr, 0, 6.2832);
    }
    ctx.fill();
    for (const q of hot) {
      const m = Math.min(1, q.s / Math.max(0.2, o.grow));
      ctx.fillStyle = `rgba(${Math.round(cb[0] + (ca[0] - cb[0]) * m)},${Math.round(cb[1] + (ca[1] - cb[1]) * m)},${Math.round(cb[2] + (ca[2] - cb[2]) * m)},${(0.55 + 0.45 * m).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(q.x + q.ox, q.y + q.oy, base * (1 + q.s), 0, 6.2832); ctx.fill();
    }
  }

  function step(now) {
    raf = 0;
    if (!visible || still()) return;
    const dt = Math.min(0.033, last ? (now - last) / 1000 : 0.016); last = now;
    const R = o.radius, R2 = R * R, F = o.force, G = o.grow, time = now - t0;
    const ghost = o.auto && !inside && now - lastInput > 2200;
    if (ghost) {
      const mob = W < 720, gt = time * 0.00022;
      const cx = mob ? W * 0.62 : W * 0.72, cy = mob ? H * 0.78 : H * 0.45, ax = mob ? W * 0.26 : W * 0.16, ay = mob ? H * 0.08 : H * 0.24;
      const gx = cx + ax * Math.sin(gt * 2.1), gy = cy + ay * Math.sin(gt * 3.3 + 0.8);
      if (pinf < 0.02) { px = gx; py = gy; } else { px += (gx - px) * Math.min(1, dt * 3); py += (gy - py) * Math.min(1, dt * 3); }
    }
    pinf += ((inside ? 1 : ghost ? 0.75 : 0) - pinf) * Math.min(1, dt * (ghost ? 1.5 : 8));
    for (let w = waves.length - 1; w >= 0; w--) { waves[w].r += 720 * dt; waves[w].a -= dt * 0.9; if (waves[w].a <= 0) waves.splice(w, 1); }
    const k = 170, c = 14;
    let energy = 0;
    for (const d of dots) {
      let tx = 0, ty = 0, ts = 0;
      const dx = d.x - px, dy = d.y - py, d2 = dx * dx + dy * dy;
      if (pinf > 0.001 && d2 < R2) {
        const dist = Math.sqrt(d2) || 1, f = 1 - dist / R, e = f * f * (3 - 2 * f) * pinf;
        tx = dx / dist * F * e; ty = dy / dist * F * e; ts = G * e;
      }
      for (const wv of waves) {
        const wx = d.x - wv.x, wy = d.y - wv.y, wd = Math.sqrt(wx * wx + wy * wy) || 1;
        const band = 1 - Math.abs(wd - wv.r) / 70;
        if (band > 0) { const b = band * band * wv.a; tx += wx / wd * F * 0.8 * b; ty += wy / wd * F * 0.8 * b; ts += G * 0.9 * b; }
      }
      d.vx += ((tx - d.ox) * k - d.vx * c) * dt; d.vy += ((ty - d.oy) * k - d.vy * c) * dt;
      d.vs += ((ts - d.s) * k - d.vs * c) * dt;
      d.ox += d.vx * dt; d.oy += d.vy * dt; d.s += d.vs * dt;
      energy += Math.abs(d.vx) + Math.abs(d.vy) + Math.abs(d.vs) * 20;
    }
    draw(time, false);
    settledFor = energy < 0.5 && !waves.length ? settledFor + dt : 0;
    if (o.ambient || o.auto || settledFor < 0.25) raf = requestAnimationFrame(step); else last = 0;
  }
  const wake = () => { if (!raf && visible && !still()) raf = requestAnimationFrame(step); };

  const local = (e) => { const r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const onMove = (e) => {
    if (e.pointerType === 'touch') return; // au doigt : pointeur fantôme + onde au tap
    const [x, y] = local(e);
    inside = x >= 0 && y >= 0 && x <= W && y <= H;
    px = x; py = y; lastInput = performance.now();
    wake();
  };
  const onLeave = () => { inside = false; lastInput = performance.now(); wake(); };
  const onDown = (e) => {
    if (still() || (e.target.closest && e.target.closest('a,button,input,select,textarea,[role="button"]'))) return;
    const [x, y] = local(e); lastInput = performance.now();
    waves.push({ x, y, r: 0, a: 1 });
    if (waves.length > 4) waves.shift();
    wake();
  };
  host.addEventListener('pointermove', onMove, { passive: true });
  host.addEventListener('pointerdown', onDown, { passive: true });
  host.addEventListener('pointerleave', onLeave);
  host.addEventListener('pointercancel', onLeave);

  const ro = new ResizeObserver(() => { layout(); wake(); });
  ro.observe(el);
  const io = new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) wake(); else { cancelAnimationFrame(raf); raf = 0; last = 0; } });
  io.observe(el);
  const mo = new MutationObserver(() => { colors(); draw(performance.now() - t0, still()); wake(); });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-accent', 'data-theme'] });
  const onVis = () => { visible = !document.hidden; if (visible) wake(); };
  document.addEventListener('visibilitychange', onVis);
  const onTheme = () => { colors(); draw(performance.now() - t0, still()); wake(); };
  window.addEventListener('socle:theme', onTheme);

  colors(); layout(); wake();

  return () => {
    cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); mo.disconnect();
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('socle:theme', onTheme);
    host.removeEventListener('pointermove', onMove);
    host.removeEventListener('pointerdown', onDown);
    host.removeEventListener('pointerleave', onLeave);
    host.removeEventListener('pointercancel', onLeave);
    canvas.remove();
  };
}

export function mountBackdrops(root) {
  const els = [...root.querySelectorAll('.backdrop[data-dotgrid]')];
  const stops = els.map((el) => dotGrid(el, { gap: +el.dataset.gap || 24, radius: +el.dataset.radius || 160 }));
  return () => stops.forEach((s) => s());
}
