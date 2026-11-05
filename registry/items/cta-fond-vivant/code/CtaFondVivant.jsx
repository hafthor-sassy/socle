// CtaFondVivant.jsx — bloc d’appel à l’action final : une trame de traits qui s’orientent vers le pointeur
// (aiguilles aimantées) et s’allument à son approche ; sans pointeur, un faisceau de phare balaie la trame depuis le bouton.
// React 18, Tailwind 3.4, tokens.css chargé (le canvas relit --border-control et --accent-vivid). Aucune autre dépendance.
// Exemple : Fanal (observabilité d’API fictive).
// Utilisation :
//   <CtaFondVivant title="…" cta="Démarrer gratuitement" href="/inscription" step={24} length={10} radius={200} tone="accent" beacon fade="centre" />
import { useEffect, useRef } from 'react';

/* Moteur canvas (identique à la version HTML) — lit ses réglages dans les data-* de la section. */
var RM = typeof window !== 'undefined' && window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
function num(v, d) { v = parseFloat(v); return isNaN(v) ? d : v; }
function rgb(c) {
  var m = c.match(/rgba?\(([^)]+)\)/); if (m) { var p = m[1].split(/[ ,/]+/).map(parseFloat); return [p[0], p[1], p[2]]; }
  if (c[0] === '#') { var h = c.slice(1); if (h.length === 3) h = h.replace(/./g, '$&$&'); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  return [128, 128, 128];
}
function wrapPi(a) { while (a > Math.PI / 2) a -= Math.PI; while (a < -Math.PI / 2) a += Math.PI; return a; }

function setup(panel) {
  var root = panel.closest('[data-fondvivant]') || panel, off = [];
  function on(t, ev, fn, o) { t.addEventListener(ev, fn, o); off.push(function () { t.removeEventListener(ev, fn, o); }); }
  var cv = panel.querySelector('[data-fv-field]'), ctx = cv.getContext('2d');
  var btn = panel.querySelector('[data-fv-btn]');
  var W = 0, H = 0, dpr = 1, cells = [], cfg = {}, col = {}, raf = 0, visible = true, t0 = performance.now();
  var ptr = { x: 0, y: 0, on: false, last: 0 }, glow = 0, beamA = -Math.PI / 2, mixBeam = 0;

  function read() {
    cfg.pas = Math.max(12, num(root.dataset.pas, 24));
    cfg.len = num(root.dataset.longueur, 10);
    cfg.r = num(root.dataset.rayon, 200);
    cfg.ton = root.dataset.ton || 'accent';
    cfg.phare = root.dataset.phare !== 'false';
    cfg.fondu = root.dataset.fondu || 'centre';
  }
  function colors() {
    var cs = getComputedStyle(root);
    col.base = rgb(cs.getPropertyValue('--border-control').trim() || '#888');
    col.hot = rgb((cfg.ton === 'neutre' ? cs.getPropertyValue('--text-strong') : cs.getPropertyValue('--accent-vivid')).trim() || '#000');
    col.dark = document.documentElement.classList.contains('dark');
  }
  function layout() {
    var r = panel.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cells = [];
    var cols = Math.ceil(W / cfg.pas) + 1, rows = Math.ceil(H / cfg.pas) + 1, ox = (W - (cols - 1) * cfg.pas) / 2, oy = (H - (rows - 1) * cfg.pas) / 2;
    var inn = panel.querySelector('[data-fv-in]').getBoundingClientRect(), cx = inn.left - r.left + inn.width / 2, cy = inn.top - r.top + inn.height / 2, rx = inn.width / 2 + 24, ry = inn.height / 2 + 16;
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
      var x = ox + i * cfg.pas, y = oy + j * cfg.pas;
      var e = Math.hypot((x - cx) / rx, (y - cy) / ry);           /* 0 au centre, 1 au bord de l'ellipse du texte */
      var mask = cfg.fondu === 'aucun' ? 1 : Math.min(1, Math.max(0.1, (e - 0.7) / 0.6));
      cells.push({ x: x, y: y, a: rest(x, y, 0), v: 0, h: 0, m: mask });
    }
  }
  /* Champ au repos : une houle lente, comme une surface d'eau. */
  function rest(x, y, t) { return Math.sin(x * 0.012 + t * 0.00035) * 0.5 + Math.cos(y * 0.017 - t * 0.00028) * 0.35 + 0.35; }

  function origin() { var b = btn.getBoundingClientRect(), p = panel.getBoundingClientRect(); return { x: b.left - p.left + b.width / 2, y: b.top - p.top + b.height / 2 }; }

  function frame(now) {
    raf = 0;
    var t = now - t0, idle = !ptr.on || now - ptr.last > 2200;
    var beamOn = cfg.phare && idle && !RM.matches;
    mixBeam += ((beamOn ? 1 : 0) - mixBeam) * 0.05;
    glow += ((ptr.on && !idle ? 1 : 0) - glow) * 0.08;
    beamA += 0.0072;
    var o = origin(), R = cfg.r;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); ctx.lineCap = 'round';
    var base = col.base, hot = col.hot, ba = col.dark ? 0.42 : 0.5;
    for (var k = 0; k < cells.length; k++) {
      var c = cells[k], target = rest(c.x, c.y, RM.matches ? 0 : t), heat = 0;
      if (glow > 0.001) {
        var dx = ptr.x - c.x, dy = ptr.y - c.y, d = Math.hypot(dx, dy);
        if (d < R) { var w = 1 - d / R; w = w * w * (3 - 2 * w); var ta = Math.atan2(dy, dx); target += wrapPi(ta - target) * w * glow; heat = Math.max(heat, w * glow); }
      }
      if (mixBeam > 0.001) {
        var bx = c.x - o.x, by = c.y - o.y, bd = Math.hypot(bx, by), ang = Math.atan2(by, bx), da = Math.atan2(Math.sin(ang - beamA), Math.cos(ang - beamA));
        var cone = Math.max(0, 1 - Math.abs(da) / 0.3) * Math.min(1, bd / 90) * Math.max(0, 1 - 0.7 * bd / Math.max(W, H));
        if (cone > 0) { var bw = Math.min(1, cone * 1.25) * mixBeam; target += wrapPi(ang - target) * bw; heat = Math.max(heat, bw); }
      }
      /* Ressort sur l'angle et sur l'échauffement */
      if (RM.matches) { c.a = target; c.h = heat; }
      else {
        var f = wrapPi(target - c.a) * 0.11 - c.v * 0.32; c.v += f; c.a += c.v;
        c.h += (heat - c.h) * (heat > c.h ? 0.22 : 0.06);
      }
      var L = cfg.len * (0.75 + c.h * 1.3), ca = Math.cos(c.a) * L / 2, sa = Math.sin(c.a) * L / 2;
      var r = base[0] + (hot[0] - base[0]) * c.h, g = base[1] + (hot[1] - base[1]) * c.h, b = base[2] + (hot[2] - base[2]) * c.h;
      var alpha = (ba + (1 - ba) * c.h) * Math.max(c.m, c.h * 0.32);
      ctx.strokeStyle = 'rgba(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ',' + alpha.toFixed(3) + ')';
      ctx.lineWidth = 1.25 + c.h * 1;
      ctx.beginPath(); ctx.moveTo(c.x - ca, c.y - sa); ctx.lineTo(c.x + ca, c.y + sa); ctx.stroke();
    }
    /* La houle bouge toujours : la boucle ne s'arrête qu'en mode réduit, hors écran ou onglet masqué. */
    if (visible && !document.hidden && !RM.matches) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); }

  function onMove(e) { var r = panel.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.on = true; ptr.last = performance.now(); kick(); }
  on(panel, 'pointermove', onMove);
  on(panel, 'pointerdown', onMove);
  on(panel, 'pointerleave', function () { ptr.on = false; kick(); });

  var ro = 'ResizeObserver' in window ? new ResizeObserver(function () { layout(); kick(); if (RM.matches) frame(performance.now()); }) : null;
  if (ro) ro.observe(panel); else on(window, 'resize', function () { layout(); kick(); });
  var io = new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }, { threshold: 0 }); io.observe(panel);
  on(document, 'visibilitychange', kick);
  var mo = new MutationObserver(function () { colors(); kick(); if (RM.matches) frame(performance.now()); }); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-accent'] });

  read(); colors(); layout(); frame(performance.now());
  return {
    destroy: function () { off.forEach(function (f) { f(); }); if (ro) ro.disconnect(); io.disconnect(); mo.disconnect(); if (raf) cancelAnimationFrame(raf); },
    update: function () { read(); colors(); layout(); kick(); if (RM.matches) frame(performance.now()); },
    hover: function (x, y) { ptr.x = x; ptr.y = y; ptr.on = true; ptr.last = performance.now() + 1e9; kick(); },
    release: function () { ptr.on = false; ptr.last = 0; kick(); },
    beam: function (a) { beamA = a; },
    settle: function (n) { for (var i = 0; i < n; i++) { t0 -= 16; frame(performance.now()); if (raf) { cancelAnimationFrame(raf); raf = 0; } } kick(); },
  };
}

const Check = () => <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-[var(--up)]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" /></svg>;

/**
 * @param {{ title?: string, lead?: string, cta?: string, href?: string, step?: number, length?: number, radius?: number,
 *   tone?: 'accent'|'neutre', beacon?: boolean, fade?: 'centre'|'aucun', className?: string }} props
 */
export function CtaFondVivant({
  title = 'Voyez chaque requête avant vos utilisateurs.',
  lead = 'Traces, latences et erreurs de vos API, en direct. Branchez le SDK en deux minutes\u202f: Fanal signale l’incident avant le premier ticket.',
  cta = 'Démarrer gratuitement', href = '#inscription',
  step = 24, length = 10, radius = 200, tone = 'accent', beacon = true, fade = 'centre', className = '',
}) {
  const panel = useRef(null), api = useRef(null);
  useEffect(() => { api.current = setup(panel.current); return () => api.current?.destroy(); }, []);
  useEffect(() => { api.current?.update(); }, [step, length, radius, tone, beacon, fade, title]);
  return (
    <section data-fondvivant data-pas={step} data-longueur={length} data-rayon={radius} data-ton={tone} data-phare={String(beacon)} data-fondu={fade}
      aria-labelledby="fv-title" className={`relative mx-auto max-w-[1184px] p-4 font-[family-name:var(--font-sans)] text-[var(--text)] md:px-8 md:py-16 ${className}`}>
      <div ref={panel} className="relative isolate grid min-h-[560px] touch-pan-y place-items-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 pb-14 pt-16 text-center md:min-h-[520px] md:px-8 md:py-24">
        <canvas data-fv-field aria-hidden="true" className="absolute inset-0 -z-10 block h-full w-full" />
        <div data-fv-in className="relative max-w-[640px]">
          <p className="mb-6 inline-flex h-8 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] pl-1 pr-3 text-[13px] font-semibold text-[var(--text-strong)] md:mb-7">
            <svg viewBox="0 0 100 100" className="h-6 w-6" aria-hidden="true"><circle cx="50" cy="50" r="50" fill="var(--accent)" /><path d="M50 36 88 22v28z" fill="var(--accent-fg)" opacity=".55" /><path d="M43 78l3-30h8l3 30z" fill="var(--accent-fg)" /><path d="M36 78h28M44 26h12" stroke="var(--accent-fg)" strokeWidth="5" strokeLinecap="round" /><circle cx="50" cy="36" r="8" fill="var(--accent-fg)" /></svg>
            Fanal<i aria-hidden="true" className="h-3 w-px bg-[var(--border)]" /><span className="font-medium text-[var(--text-muted)]">Observabilité d’API</span>
          </p>
          <h2 id="fv-title" className="m-0 text-balance text-[2.125rem] font-semibold leading-[1.02] tracking-[-0.04em] text-[var(--text-strong)] md:text-[clamp(2rem,1.1rem+3vw,3.5rem)]">{title}</h2>
          <p className="mx-auto mt-5 max-w-[48ch] text-pretty text-base leading-relaxed text-[var(--text-muted)] md:text-[17px]">{lead}</p>
          <a data-fv-btn href={href} className="group mt-9 inline-flex h-[52px] w-full items-center justify-center gap-2.5 rounded-full bg-[var(--accent)] pl-7 pr-6 text-base font-medium text-[var(--accent-fg)] no-underline transition-[background-color,transform] duration-300 ease-[cubic-bezier(.34,1.4,.64,1)] hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--focus-ring)] active:scale-[.97] md:w-auto">
            {cta}
            <svg viewBox="0 0 16 16" className="h-[18px] w-[18px] transition-transform duration-[360ms] ease-[cubic-bezier(.34,1.4,.64,1)] group-hover:translate-x-[3px] motion-reduce:transition-none" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
          </a>
          <ul aria-label="Conditions de l’essai" className="m-0 mt-5 flex list-none flex-wrap justify-center gap-x-4 gap-y-1 p-0 text-[13px] text-[var(--text-muted)]">
            {['Sans carte bancaire', '14 jours d’essai', 'Hébergé en Europe'].map((t) => <li key={t} className="inline-flex items-center gap-1.5"><Check />{t}</li>)}
          </ul>
          <p aria-label="SDK disponibles : Node, Go, Python, Rust" className="mt-7 inline-flex flex-wrap justify-center gap-1.5 font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)]">
            {['Node', 'Go', 'Python', 'Rust'].map((t) => <span key={t} className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5">{t}</span>)}
          </p>
        </div>
      </div>
    </section>
  );
}

export default CtaFondVivant;
