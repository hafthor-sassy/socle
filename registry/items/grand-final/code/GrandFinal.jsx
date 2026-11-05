// GrandFinal.jsx — dernier écran d’une page : le titre grandit autour de son point final, le point devient un aplat
// qui remplit l’écran, puis l’aplat se resserre jusqu’à devenir le bouton. Lié au défilement (sticky), lissé, sans boucle au repos.
// React 18, Tailwind 3.4, tokens.css chargé (couleurs par variables). Aucune autre dépendance.
// Exemple : Portulan (voyages en train de nuit, fictif).
// Utilisation :
//   <GrandFinal title="Partez lentement, arrivez ailleurs" cta="Réserver mon trajet" href="/reserver" distance={260} scale={7} overshoot rail smooth />
import { useEffect, useRef } from 'react';

/* Moteur (identique à la version HTML) — lit ses réglages dans les data-* de la section. */
var RM = typeof window !== 'undefined' && window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function seg(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
function inCubic(t) { return t * t * t; }
function outCubic(t) { return 1 - Math.pow(1 - t, 3); }
function inOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function outBack(t) { var c = 1.4, d = c + 1; return 1 + d * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }

function setup(root) {
  var off = [];
  function on(t, ev, fn, o) { t.addEventListener(ev, fn, o); off.push(function () { t.removeEventListener(ev, fn, o); }); }
  var stage = root.querySelector('[data-gf="stage"]');
  var title = root.querySelector('[data-gf="title"]'), dot = root.querySelector('[data-gf="dot"]');
  var intro = root.querySelector('[data-gf="intro"]'), hint = root.querySelector('[data-gf="hint"]'), aside = root.querySelectorAll('[data-gf="aside"]');
  var flood = root.querySelector('[data-gf="flood"]'), floodIn = flood.firstElementChild;
  var btn = root.querySelector('[data-gf="btn"]'), fill = root.querySelector('[data-gf="fill"]'), train = root.querySelector('[data-gf="train"]');
  var cfg = {}, geo = null, cur = 0, target = 0, raf = 0, forced = null, done = false;
  root.classList.add('is-js');

  function read() {
    cfg.distance = parseFloat(root.dataset.distance) || 260;
    cfg.scale = parseFloat(root.dataset.echelle) || 7;
    cfg.back = root.dataset.rebond !== 'false';
    cfg.smooth = root.dataset.lissage !== 'false';
    root.style.setProperty('--gf-distance', cfg.distance);
  }
  /* Géométrie mesurée sans transformation : centre du point, rectangle du bouton. */
  function measure() {
    var keepT = title.style.transform; title.style.transform = 'none';
    var s = stage.getBoundingClientRect(), d = dot.getBoundingClientRect(), b = btn.getBoundingClientRect(), t = title.getBoundingClientRect();
    title.style.transform = keepT;
    var cx = d.left - s.left + d.width / 2, cy = d.top - s.top + d.height / 2;
    title.style.setProperty('--gf-ox', (d.left - t.left + d.width / 2) + 'px');
    title.style.setProperty('--gf-oy', (d.top - t.top + d.height / 2) + 'px');
    geo = { W: s.width, H: s.height, cx: cx, cy: cy, r0: d.width / 2, R: Math.hypot(Math.max(cx, s.width - cx), Math.max(cy, s.height - cy)) + 2,
      bt: b.top - s.top, bl: b.left - s.left, bw: b.width, bh: b.height };
  }
  function progress() {
    var r = root.getBoundingClientRect(), span = r.height - stage.offsetHeight;
    return span > 0 ? clamp(-r.top / span, 0, 1) : 1;
  }

  /* Une image de la scène pour un avancement p (0 → 1). */
  function render(p) {
    if (!geo) measure();
    var g = geo;
    /* Acte 1 — le titre grandit autour de son point et s'efface */
    var a = seg(p, 0.06, 0.46), sA = 1 + (cfg.scale - 1) * inCubic(a);
    title.style.transform = a > 0 ? 'scale(' + sA.toFixed(4) + ')' : '';
    title.style.opacity = String(1 - seg(p, 0.3, 0.46));
    var fa = 1 - seg(p, 0.04, 0.16);
    for (var i = 0; i < aside.length; i++) { aside[i].style.opacity = String(fa); aside[i].style.transform = 'translateY(' + ((i ? 1 : -1) * 16 * (1 - fa)).toFixed(1) + 'px)'; }
    if (hint) hint.style.opacity = String(1 - seg(p, 0, 0.06));
    /* Acte 2 — l'aplat part du point (disque qui grandit avec le titre) jusqu'à couvrir l'écran */
    var f = seg(p, 0.1, 0.5), r = g.r0 * sA + (g.R - g.r0 * sA) * inCubic(f);
    var c = seg(p, 0.64, 0.86), k = cfg.back ? outBack(c) : outCubic(c);
    if (c <= 0) flood.style.clipPath = 'circle(' + Math.max(0, r).toFixed(1) + 'px at ' + g.cx.toFixed(1) + 'px ' + g.cy.toFixed(1) + 'px)';
    else {
      /* Acte 3 — l'aplat se resserre sur le rectangle du bouton */
      var top = g.bt * k, left = g.bl * k, right = (g.W - g.bl - g.bw) * k, bottom = (g.H - g.bt - g.bh) * k, rad = (g.bh / 2) * Math.min(1, k * 1.15);
      flood.style.clipPath = 'inset(' + top.toFixed(1) + 'px ' + right.toFixed(1) + 'px ' + bottom.toFixed(1) + 'px ' + left.toFixed(1) + 'px round ' + rad.toFixed(1) + 'px)';
    }
    var flooded = f >= 1 && c < 0.55;
    root.classList.toggle('is-flood', flooded);
    floodIn.style.opacity = String(seg(p, 0.5, 0.56) * (1 - seg(p, 0.6, 0.66)));
    floodIn.style.transform = 'scale(' + (0.94 + 0.06 * outCubic(seg(p, 0.48, 0.58)) + 0.04 * seg(p, 0.6, 0.66)).toFixed(4) + ')';
    var end = c >= 1;
    if (end !== done) { done = end; root.classList.toggle('is-done', end); }
    /* Rail */
    if (fill) fill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    if (train) train.style.left = (p * 100).toFixed(2) + '%';
  }

  function tick() {
    raf = 0;
    var t = forced != null ? forced : target;
    if (!cfg.smooth || forced != null) cur = t; else cur += (t - cur) * 0.16;
    if (Math.abs(t - cur) < 0.0004) cur = t;
    render(cur);
    if (cur !== t) raf = requestAnimationFrame(tick);
  }
  function onScroll() { target = progress(); if (!raf) raf = requestAnimationFrame(tick); }

  /* Clavier : si le bouton reçoit le focus avant la fin, on saute à la scène finale. */
  on(btn, 'focus', function () {
    if (done || RM.matches) return;
    var r = root.getBoundingClientRect(), y = r.top + scrollY + r.height - stage.offsetHeight;
    window.scrollTo({ top: y, behavior: 'auto' }); target = 1; cur = 1; render(1);
  });

  function relayout() { title.style.transform = ''; measure(); onScroll(); }
  read();
  if (RM.matches) { root.classList.add('is-done'); }
  else {
    on(window, 'scroll', onScroll, { passive: true });
    on(window, 'resize', relayout);
    var ro = new ResizeObserver(relayout); ro.observe(stage); off.push(function () { ro.disconnect(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
    measure(); target = cur = progress(); render(cur);
  }
  return {
    destroy: function () { off.forEach(function (f) { f(); }); if (raf) cancelAnimationFrame(raf); },
    update: function () { read(); relayout(); },
    set: function (p) { forced = p == null ? null : clamp(p, 0, 1); if (forced == null) onScroll(); else { cur = forced; render(cur); } },
    progress: function () { return cur; },
  };
}

const Logo = () => (
  <svg viewBox="0 0 100 100" className="h-7 w-7" aria-hidden="true">
    <rect width="100" height="100" rx="28" className="fill-[var(--accent)] transition-[fill] group-[.is-flood]/gf:fill-[var(--accent-fg)]" />
    <path d="M50 18 56 44 82 50 56 56 50 82 44 56 18 50 44 44z" className="fill-[var(--accent-fg)] group-[.is-flood]/gf:fill-[var(--accent)]" />
    <path d="M27 27l46 46M73 27 27 73" strokeWidth="3" strokeLinecap="round" opacity=".55" className="fill-none stroke-[var(--accent-fg)] group-[.is-flood]/gf:stroke-[var(--accent)]" />
    <circle cx="50" cy="50" r="5" className="fill-[var(--accent)] group-[.is-flood]/gf:fill-[var(--accent-fg)]" />
  </svg>
);

/**
 * @param {{ title?: string, eyebrow?: string, sub?: string, flood?: string, meta?: string[], kicker?: string, endTitle?: string,
 *   cta?: string, href?: string, micro?: string, distance?: number, scale?: number, overshoot?: boolean, rail?: boolean,
 *   smooth?: boolean, from?: string, to?: string }} props
 */
export function GrandFinal({
  title = 'Partez lentement, arrivez ailleurs', eyebrow = 'Dernier arrêt avant le départ',
  sub = '312 trajets de nuit vers 64 villes d’Europe. Vous dormez, le paysage change.',
  flood = 'Paris\u202f→ Vienne, en une seule nuit.', meta = ['Départ 19 h 12', 'Arrivée 9 h 47', 'Couchette dès 79\u202f€'],
  kicker = 'Prochain départ ce soir, 19 h 12', endTitle = 'Votre couchette vous attend.',
  cta = 'Réserver mon trajet', href = '#reserver', micro = 'Billets échangeables jusqu’au départ · Paiement en trois fois',
  distance = 260, scale = 7, overshoot = true, rail = true, smooth = true, from = 'Paris', to = 'Vienne',
}) {
  const root = useRef(null), api = useRef(null);
  useEffect(() => { api.current = setup(root.current); return () => api.current?.destroy(); }, []);
  useEffect(() => { api.current?.update(); }, [distance, scale, overshoot, smooth, title, cta]);
  const pad = 'absolute inset-0 grid place-content-center justify-items-center px-5 py-20 text-center md:px-8 md:py-24';
  const endItem = 'opacity-0 translate-y-3 transition-[opacity,transform] duration-500 ease-[cubic-bezier(.32,.72,0,1)] group-[.is-done]/gf:translate-y-0 group-[.is-done]/gf:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none';
  return (
    <section ref={root} data-grandfinal data-distance={distance} data-echelle={scale} data-rebond={String(overshoot)} data-lissage={String(smooth)}
      aria-labelledby="gf-end-title" style={{ height: `calc(100svh + ${distance}svh)` }}
      className="group/gf relative font-[family-name:var(--font-sans)] text-[var(--text)] motion-reduce:!h-auto">
      <div data-gf="stage" className="sticky top-0 isolate h-[100svh] overflow-hidden motion-reduce:relative motion-reduce:h-auto motion-reduce:min-h-[100svh]">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[3] flex items-center justify-between gap-4 px-5 py-4 md:px-8 md:py-6">
          <a href="#accueil" aria-label="Portulan, accueil" className="pointer-events-auto inline-flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.01em] text-[var(--text-strong)] no-underline transition-colors group-[.is-flood]/gf:text-[var(--accent-fg)]"><Logo />Portulan</a>
          <span aria-hidden="true" className="hidden font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.04em] text-[var(--text-muted)] transition-colors group-[.is-flood]/gf:text-[var(--accent-fg)] md:inline">Trains de nuit · Europe</span>
        </div>

        <div data-gf="intro" aria-hidden="true" className={`${pad} motion-reduce:hidden`}>
          <p data-gf="aside" className="mb-6 font-[family-name:var(--font-mono)] text-[13px] tracking-[0.04em] text-[var(--text-muted)]">{eyebrow}</p>
          <p data-gf="title" className="m-0 max-w-[14ch] text-balance text-[2.75rem] font-semibold leading-[0.98] tracking-[-0.045em] text-[var(--text-strong)] [transform-origin:var(--gf-ox,50%)_var(--gf-oy,50%)] md:text-[clamp(2.5rem,1rem+5.4vw,5.5rem)]">
            {title}<span data-gf="dot" className="ml-[0.04em] inline-block h-[0.2em] w-[0.2em] rounded-full bg-[var(--accent)] align-[0.02em]" />
          </p>
          <p data-gf="aside" className="mt-7 max-w-[44ch] text-base leading-relaxed text-[var(--text-muted)] md:text-[17px]">{sub}</p>
        </div>
        <p data-gf="hint" aria-hidden="true" className="absolute bottom-[88px] left-1/2 inline-flex -translate-x-1/2 items-center gap-2 text-[13px] text-[var(--text-muted)] motion-reduce:hidden md:bottom-24">
          <svg viewBox="0 0 16 16" className="h-4 w-4 animate-bounce" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v10M4 9l4 4 4-4" /></svg>Faites défiler
        </p>

        <div data-gf="flood" aria-hidden="true" style={{ clipPath: 'circle(0 at 50% 50%)' }}
          className={`${pad} pointer-events-none z-[2] bg-[var(--accent)] text-[var(--accent-fg)] group-[.is-done]/gf:invisible motion-reduce:hidden`}>
          <div>
            <p className="m-0 max-w-[16ch] text-balance text-[2.5rem] font-semibold leading-none tracking-[-0.045em] md:text-[clamp(2.25rem,1rem+5vw,5rem)]">{flood}</p>
            <ul className="m-0 mt-7 flex list-none flex-col justify-center gap-1.5 p-0 font-[family-name:var(--font-mono)] text-sm md:flex-row md:flex-wrap md:gap-x-6">{meta.map((m) => <li key={m} className="opacity-90">{m}</li>)}</ul>
          </div>
        </div>

        <div className={`${pad} z-[1] motion-reduce:relative motion-reduce:min-h-[100svh]`}>
          <p className={`mb-4 inline-flex items-center gap-2 font-[family-name:var(--font-mono)] text-[13px] tracking-[0.02em] text-[var(--text-muted)] ${endItem}`}><span className="h-1.5 w-1.5 rounded-full bg-[var(--up)]" />{kicker}</p>
          <h2 id="gf-end-title" className={`mb-8 max-w-[18ch] text-balance text-[2rem] font-semibold leading-[1.08] tracking-[-0.035em] text-[var(--text-strong)] md:text-[clamp(1.75rem,1.1rem+2.2vw,2.75rem)] ${endItem}`}>{endTitle}</h2>
          <a data-gf="btn" href={href}
            className="group/btn relative inline-flex h-14 items-center justify-center rounded-full bg-[var(--accent)] px-7 text-[17px] font-medium tracking-[-0.01em] text-[var(--accent-fg)] no-underline opacity-0 transition-[background-color,transform] duration-300 ease-[cubic-bezier(.34,1.4,.64,1)] hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus-ring)] active:scale-[.97] group-[.is-done]/gf:opacity-100 motion-reduce:opacity-100 md:h-[60px] md:px-8">
            <span className="inline-flex translate-y-1.5 items-center gap-2.5 opacity-0 transition-[opacity,transform] delay-[60ms] duration-[420ms] ease-[cubic-bezier(.34,1.4,.64,1)] group-[.is-done]/gf:translate-y-0 group-[.is-done]/gf:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100">
              {cta}<svg viewBox="0 0 16 16" className="h-[18px] w-[18px] transition-transform duration-[360ms] group-hover/btn:translate-x-[3px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
            </span>
          </a>
          <p className={`mt-5 text-sm text-[var(--text-muted)] delay-100 ${endItem}`}>{micro}</p>
        </div>

        {rail && (
          <div aria-hidden="true" className="pointer-events-none absolute bottom-6 left-1/2 z-[3] flex w-[min(420px,calc(100%-48px))] -translate-x-1/2 items-center gap-3 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.04em] text-[var(--text-muted)] transition-colors group-[.is-flood]/gf:text-[var(--accent-fg)] motion-reduce:hidden md:bottom-8">
            <span>{from}</span>
            <span className="relative h-0.5 flex-1 rounded bg-[var(--border)] group-[.is-flood]/gf:bg-[color-mix(in_srgb,var(--accent-fg)_30%,transparent)]">
              <span data-gf="fill" className="absolute inset-0 origin-left scale-x-0 rounded bg-[var(--accent)] group-[.is-flood]/gf:bg-[var(--accent-fg)]" />
              <span data-gf="train" className="absolute left-0 top-1/2 -ml-[5px] -mt-[5px] h-2.5 w-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_0_4px_var(--bg)] group-[.is-flood]/gf:bg-[var(--accent-fg)] group-[.is-flood]/gf:shadow-[0_0_0_4px_var(--accent)]" />
            </span>
            <span>{to}</span>
          </div>
        )}
      </div>
    </section>
  );
}

export default GrandFinal;
