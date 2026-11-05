// Curseur contextuel — React + Tailwind CSS, sans dépendance.
// Couleurs : variables de tokens.css. Rôles déclarés sur les cibles : data-cursor="voir | glisser | lien | aimant | texte".
import { useEffect, useRef } from 'react';

const SIZES = { voir: 96, glisser: 112, lien: 32, defaut: 36 };

class Spring {
  constructor(v) { this.v = v; this.t = v; this.vel = 0; }
  step(k, c, dt) { this.vel += ((this.t - this.v) * k - this.vel * c) * dt; this.v += this.vel * dt; return Math.abs(this.t - this.v) + Math.abs(this.vel) * 0.01; }
  snap(v) { this.v = this.t = v; this.vel = 0; }
}

/** Glisser pour faire défiler un conteneur horizontal, avec inertie au relâché (souris seulement). */
export function useDragScroll(ref) {
  useEffect(() => {
    const track = ref.current; if (!track) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let down = false, sx = 0, sl = 0, lastX = 0, lastT = 0, vel = 0, moved = 0, raf = 0;
    const onDown = (e) => { if (e.pointerType !== 'mouse' || e.button !== 0) return; down = true; moved = 0; sx = lastX = e.clientX; sl = track.scrollLeft; lastT = performance.now(); vel = 0; cancelAnimationFrame(raf); };
    const onMove = (e) => {
      if (!down) return;
      const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      if (moved > 4) track.dataset.dragging = 'true';
      track.scrollLeft = sl - dx;
      const now = performance.now(); vel = (e.clientX - lastX) / Math.max(1, now - lastT); lastX = e.clientX; lastT = now;
    };
    const onUp = () => {
      if (!down) return; down = false;
      let v = -vel * 16;
      const glide = () => { if (Math.abs(v) < 0.4 || reduced.matches) { track.dataset.dragging = 'false'; return; } track.scrollLeft += v; v *= 0.93; raf = requestAnimationFrame(glide); };
      glide();
    };
    const onClick = (e) => { if (moved > 4) { e.preventDefault(); e.stopPropagation(); } };
    track.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp); track.addEventListener('click', onClick, true);
    return () => { cancelAnimationFrame(raf); track.removeEventListener('pointerdown', onDown); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); track.removeEventListener('click', onClick, true); };
  }, [ref]);
}

/**
 * Zone à curseur contextuel.
 * @param {object} props
 * @param {number} [props.stiffness=320]  Raideur du ressort
 * @param {number} [props.damping=26]     Amortissement
 * @param {number} [props.dot=8]          Diamètre du point central (px)
 * @param {number} [props.magnet=0.25]    Part du pointeur suivie par un bouton accroché
 * @param {boolean} [props.stretch=true]  Étirement selon la vitesse
 * @param {boolean} [props.labels=true]   Libellés « Voir », « Glisser »
 * @param {'normal'|'difference'} [props.blend='normal']
 */
export function CursorZone({ stiffness = 320, damping = 26, dot = 8, magnet = 0.25, stretch = true, labels = true, blend = 'normal', className = '', children, ...rest }) {
  const zoneRef = useRef(null), ringRef = useRef(null), dotRef = useRef(null), labelRef = useRef(null), glyphsRef = useRef([]);
  const opts = useRef({}); opts.current = { stiffness, damping, magnet, stretch };

  useEffect(() => {
    const zone = zoneRef.current, ring = ringRef.current, dotEl = dotRef.current, labelEl = labelRef.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)'), fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const X = new Spring(-100), Y = new Spring(-100), Wd = new Spring(36), Ht = new Spring(36), R = new Spring(18);
    let mx = -100, my = -100, raf = 0, last = 0, state = 'defaut', target = null, enabled = false, magnetEl = null, mgx = 0, mgy = 0;

    const release = () => { if (magnetEl) magnetEl.style.translate = ''; magnetEl = null; mgx = mgy = 0; };
    const enable = (on) => { enabled = on && fine.matches; zone.dataset.cursorOn = String(enabled); if (!enabled) release(); };
    const setState = (next, el) => {
      target = el; if (next !== 'aimant') release();
      if (next === state) return;
      state = next; zone.dataset.ccState = next;
      if (el && (next === 'voir' || next === 'glisser')) labelEl.textContent = el.getAttribute('data-cursor-label') || (next === 'voir' ? 'Voir' : 'Glisser');
    };
    const targets = () => {
      const o = opts.current, sz = SIZES[state] || SIZES.defaut;
      if (state === 'aimant' && target) {
        if (magnetEl && magnetEl !== target) release();
        const r = target.getBoundingClientRect(), pad = 6, rad = parseFloat(getComputedStyle(target).borderTopLeftRadius) || 8;
        const cx = r.left + r.width / 2 - mgx, cy = r.top + r.height / 2 - mgy;
        let px = (mx - cx) * o.magnet, py = (my - cy) * o.magnet;
        if (reduced.matches) { px = py = 0; } else { target.style.translate = `${px.toFixed(1)}px ${py.toFixed(1)}px`; magnetEl = target; mgx = px; mgy = py; }
        X.t = cx + px; Y.t = cy + py; Wd.t = r.width + pad * 2; Ht.t = r.height + pad * 2; R.t = Math.min(rad + pad, (r.height + pad * 2) / 2);
        return;
      }
      if (state === 'texte' && target) { const lh = parseFloat(getComputedStyle(target).lineHeight) || 24; X.t = mx; Y.t = my; Wd.t = 2; Ht.t = Math.min(32, lh + 4); R.t = 1; return; }
      const off = state === 'lien' ? 18 : 0;
      X.t = mx + off; Y.t = my + off; Wd.t = sz; Ht.t = sz; R.t = sz / 2;
    };
    const frame = (now) => {
      raf = 0;
      const o = opts.current, dt = Math.min(0.032, last ? (now - last) / 1000 : 0.016); last = now;
      targets();
      let e = 0;
      if (reduced.matches) [X, Y, Wd, Ht, R].forEach((s) => s.snap(s.t));
      else e = X.step(o.stiffness, o.damping, dt) + Y.step(o.stiffness, o.damping, dt) + Wd.step(o.stiffness * 0.8, o.damping, dt) + Ht.step(o.stiffness * 0.8, o.damping, dt) + R.step(o.stiffness * 0.8, o.damping, dt);
      let sx = 1, sy = 1, ang = 0;
      if (o.stretch && !reduced.matches && state !== 'aimant' && state !== 'texte') {
        const s = Math.min(0.35, Math.hypot(X.vel, Y.vel) / 5000);
        if (s > 0.01) { sx = 1 + s; sy = 1 - s * 0.6; ang = Math.atan2(Y.vel, X.vel) * 57.2958; }
      }
      const w = Math.max(2, Wd.v), h = Math.max(2, Ht.v);
      Object.assign(ring.style, { width: `${w}px`, height: `${h}px`, borderRadius: `${Math.max(1, R.v)}px`, transformOrigin: `${w / 2}px ${h / 2}px`,
        transform: `translate(${(X.v - w / 2).toFixed(2)}px,${(Y.v - h / 2).toFixed(2)}px) rotate(${ang.toFixed(1)}deg) scale(${sx.toFixed(3)},${sy.toFixed(3)})` });
      dotEl.style.transform = `translate(${mx}px,${my}px)`;
      const lt = `translate(${X.v.toFixed(2)}px,${Y.v.toFixed(2)}px) translate(-50%,-50%)`;
      labelEl.style.transform = lt; glyphsRef.current.forEach((g) => g && (g.style.transform = lt));
      if (e > 0.05 || state === 'aimant') raf = requestAnimationFrame(frame); else last = 0;
    };
    const wake = () => { if (!raf && enabled) raf = requestAnimationFrame(frame); };
    const onMove = (e) => {
      if (e.pointerType !== 'mouse') { if (enabled) enable(false); return; }
      if (!enabled) { enable(true); X.snap(e.clientX); Y.snap(e.clientY); }
      mx = e.clientX; my = e.clientY; zone.dataset.out = 'false';
      const el = e.target.closest?.('[data-cursor]');
      setState(el && zone.contains(el) ? el.getAttribute('data-cursor') : 'defaut', el);
      wake();
    };
    const onLeave = () => { zone.dataset.out = 'true'; setState('defaut', null); release(); };
    const onDown = (e) => { if (e.pointerType === 'mouse') zone.dataset.pressed = 'true'; };
    const onUp = () => { zone.dataset.pressed = 'false'; };
    const onScroll = () => enabled && wake();
    zone.addEventListener('pointermove', onMove, { passive: true }); zone.addEventListener('pointerover', onMove, { passive: true });
    zone.addEventListener('pointerleave', onLeave); zone.addEventListener('pointerdown', onDown); window.addEventListener('pointerup', onUp);
    window.addEventListener('scroll', onScroll, { passive: true });
    zone.dataset.ccState = 'defaut';
    return () => {
      cancelAnimationFrame(raf); release();
      zone.removeEventListener('pointermove', onMove); zone.removeEventListener('pointerover', onMove); zone.removeEventListener('pointerleave', onLeave);
      zone.removeEventListener('pointerdown', onDown); window.removeEventListener('pointerup', onUp); window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const pop = 'opacity-0 [scale:.6] transition-[opacity,scale] duration-[200ms,380ms] ease-[cubic-bezier(.34,1.56,.64,1)] motion-reduce:transition-none';
  const inverse = 'group-data-[cc-state=voir]/cc:bg-[var(--text-strong)] group-data-[cc-state=voir]/cc:border-[var(--text-strong)] group-data-[cc-state=glisser]/cc:bg-[var(--text-strong)] group-data-[cc-state=glisser]/cc:border-[var(--text-strong)] group-data-[cc-state=lien]/cc:bg-[var(--accent)] group-data-[cc-state=lien]/cc:border-[var(--accent)] group-data-[cc-state=aimant]/cc:bg-[var(--state-hover)] group-data-[cc-state=texte]/cc:bg-[var(--text-strong)]';
  return (
    <div ref={zoneRef} {...rest} className={`group/cc relative data-[cursor-on=true]:cursor-none data-[cursor-on=true]:[&_*]:!cursor-none ${className}`}>
      {children}
      <div aria-hidden="true" className={`pointer-events-none fixed left-0 top-0 z-50 h-0 w-0 opacity-0 transition-opacity duration-200 group-data-[cursor-on=true]/cc:opacity-100 group-data-[out=true]/cc:!opacity-0 ${blend === 'difference' ? 'mix-blend-difference' : ''}`}>
        <span ref={ringRef} className={`absolute left-0 top-0 rounded-full border-[1.5px] will-change-transform transition-colors duration-200 group-data-[pressed=true]/cc:[scale:.9] ${blend === 'difference' ? 'border-[var(--surface)]' : 'border-[var(--text-strong)]'} ${inverse}`} />
        <span ref={labelRef} className={`absolute left-0 top-0 whitespace-nowrap text-sm font-semibold tracking-[-0.01em] text-[var(--bg)] ${pop} ${labels ? 'group-data-[cc-state=voir]/cc:[scale:1] group-data-[cc-state=voir]/cc:opacity-100 group-data-[cc-state=glisser]/cc:[scale:1] group-data-[cc-state=glisser]/cc:opacity-100' : 'hidden'}`} />
        <svg ref={(n) => (glyphsRef.current[0] = n)} viewBox="0 0 24 24" className={`absolute left-0 top-0 size-4 fill-none stroke-[var(--accent-fg)] [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.8] ${pop} group-data-[cc-state=lien]/cc:[scale:1] group-data-[cc-state=lien]/cc:opacity-100`}><path d="M8 16 16 8M10 8h6v6" /></svg>
        <svg ref={(n) => (glyphsRef.current[1] = n)} viewBox="0 0 156 24" className={`absolute left-0 top-0 h-6 w-[156px] fill-none stroke-[var(--text-strong)] [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2] ${pop} group-data-[cc-state=glisser]/cc:[scale:1] group-data-[cc-state=glisser]/cc:opacity-100`}><path d="M10 5 3 12l7 7M146 5l7 7-7 7" /></svg>
        <span ref={dotRef} className="absolute left-0 top-0 rounded-full bg-[var(--text-strong)] transition-[opacity,scale] duration-200 group-data-[cc-state=aimant]/cc:[scale:.2] group-data-[cc-state=aimant]/cc:opacity-0 group-data-[cc-state=glisser]/cc:opacity-0 group-data-[cc-state=lien]/cc:opacity-0 group-data-[cc-state=texte]/cc:opacity-0 group-data-[cc-state=voir]/cc:[scale:.2] group-data-[cc-state=voir]/cc:opacity-0" style={{ width: dot, height: dot, margin: `${-dot / 2}px 0 0 ${-dot / 2}px` }} />
      </div>
    </div>
  );
}

/* Exemple : vitrine d'Ourlet (marque fictive, prêt-à-porter en maille). */
const CARDS = [
  { href: '#pull-brume', name: 'Pull Brume', price: '129 €', art: (
    <svg viewBox="0 0 300 340" aria-hidden="true" className="block h-auto w-full transition-[scale] duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04] motion-reduce:transition-none"><rect width="300" height="340" className="fill-[var(--accent-subtle)]"/><path d="M110 70c10 14 70 14 80 0l56 30 22 150-38 6-12-88v142H82V168l-12 88-38-6 22-150Z" className="fill-[var(--accent)]"/><path d="M110 70c10 14 70 14 80 0" className="fill-none stroke-[var(--accent-subtle)] [stroke-width:4] [stroke-linecap:round] [stroke-linejoin:round] opacity-70"/><path d="M82 290h136" className="fill-none stroke-[var(--accent-subtle)] [stroke-width:10] [stroke-dasharray:2_8] [stroke-linecap:round] [stroke-linejoin:round] opacity-70"/></svg>
  ) },
  { href: '#cardigan-sel', name: 'Cardigan Sel', price: '149 €', art: (
    <svg viewBox="0 0 300 340" aria-hidden="true" className="block h-auto w-full transition-[scale] duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04] motion-reduce:transition-none"><rect width="300" height="340" className="fill-[var(--accent-subtle-border)]"/><path d="M112 66 150 150 188 66l58 34 22 150-38 6-12-88v142H82V168l-12 88-38-6 22-150Z" className="fill-[var(--surface)]"/><path d="M150 150v158" className="fill-none stroke-[var(--accent-subtle)] [stroke-width:4] [stroke-linecap:round] [stroke-linejoin:round] opacity-70"/><circle cx="160" cy="180" r="5" className="fill-[var(--accent)]"/><circle cx="160" cy="216" r="5" className="fill-[var(--accent)]"/><circle cx="160" cy="252" r="5" className="fill-[var(--accent)]"/></svg>
  ) },
  { href: '#bonnet-roc', name: 'Bonnet Roc', price: '45 €', art: (
    <svg viewBox="0 0 300 340" aria-hidden="true" className="block h-auto w-full transition-[scale] duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04] motion-reduce:transition-none"><rect width="300" height="340" className="fill-[var(--accent-subtle)]"/><circle cx="150" cy="96" r="26" className="fill-[var(--accent-subtle-border)]"/><path d="M84 220c0-60 30-104 66-104s66 44 66 104Z" className="fill-[var(--accent)]"/><rect x="74" y="214" width="152" height="44" rx="10" className="fill-[var(--text-strong)]"/><path d="M96 222v28M116 222v28M136 222v28M156 222v28M176 222v28M196 222v28" className="fill-none stroke-[var(--bg)] [stroke-width:4] [stroke-linecap:round] [stroke-linejoin:round] opacity-50"/></svg>
  ) },
  { href: '#echarpe-dune', name: 'Écharpe Dune', price: '69 €', art: (
    <svg viewBox="0 0 300 340" aria-hidden="true" className="block h-auto w-full transition-[scale] duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04] motion-reduce:transition-none"><rect width="300" height="340" className="fill-[var(--accent-subtle-border)]"/><path d="M96 60h56l-6 160h-50Z" className="fill-[var(--accent)]"/><path d="M150 60h56l-10 230h-52Z" className="fill-[var(--text-strong)]"/><path d="M96 220h50v20H96ZM144 290h52v20h-52Z" className="fill-[var(--accent)]"/><path d="M102 240v26M114 240v30M126 240v24M138 240v28M150 310v22M162 310v26M174 310v20M186 310v24" className="fill-none stroke-[var(--accent-subtle)] [stroke-width:4] [stroke-linecap:round] [stroke-linejoin:round] opacity-70"/></svg>
  ) },
  { href: '#gilet-havre', name: 'Gilet Havre', price: '119 €', art: (
    <svg viewBox="0 0 300 340" aria-hidden="true" className="block h-auto w-full transition-[scale] duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04] motion-reduce:transition-none"><rect width="300" height="340" className="fill-[var(--accent-subtle)]"/><path d="M104 64 150 140 196 64l20 10 14 72-12 164H82L70 146l14-72Z" className="fill-[var(--text-strong)]"/><path d="M150 140v170M104 64l-4 80M196 64l4 80" className="fill-none stroke-[var(--bg)] [stroke-width:4] [stroke-linecap:round] [stroke-linejoin:round] opacity-50"/><rect x="102" y="226" width="32" height="26" rx="4" className="fill-[var(--accent)]"/></svg>
  ) },
  { href: '#chaussettes-lin', name: 'Chaussettes Lin', price: '24 €', art: (
    <svg viewBox="0 0 300 340" aria-hidden="true" className="block h-auto w-full transition-[scale] duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04] motion-reduce:transition-none"><rect width="300" height="340" className="fill-[var(--accent-subtle-border)]"/><path d="M90 60h50v150c0 10 6 16 16 20l30 12c18 8 14 40-10 38l-60-6c-18-2-26-14-26-32Z" className="fill-[var(--accent)]"/><path d="M160 80h50v150c0 10 6 16 16 20l20 8c18 8 14 40-10 38l-50-6c-18-2-26-14-26-32Z" className="fill-[var(--surface)]"/><path d="M90 84h50M160 104h50" className="fill-none stroke-[var(--accent-subtle)] [stroke-width:4] [stroke-linecap:round] [stroke-linejoin:round] opacity-70"/></svg>
  ) }
];

const focus = 'focus-visible:rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]';
const magnetic = 'transition-[translate,background-color] duration-[380ms] ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none';

export default function OurletShowcase() {
  const trackRef = useRef(null);
  useDragScroll(trackRef);
  return (
    <CursorZone aria-labelledby="ourlet-title" className="mx-auto max-w-[1200px] px-5 pb-10 pt-2 [font-family:var(--font-sans)] text-[var(--text)] min-[900px]:px-6 min-[900px]:pb-14 min-[900px]:pt-6">
      <header className="mb-6 flex h-16 items-center gap-2 min-[900px]:mb-10 min-[900px]:gap-8">
        <a href="#accueil" data-cursor="lien" aria-label="Ourlet, accueil" className={`inline-flex min-h-11 items-center gap-2.5 text-xl font-semibold tracking-[-0.03em] text-[var(--text-strong)] ${focus}`}>
          <svg viewBox="0 0 100 100" aria-hidden="true" className="size-[26px] text-[var(--accent)]"><path d="M50 10a40 40 0 1 1-28.3 11.7" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" /><path d="M22 22 34 34" stroke="currentColor" strokeWidth="10" strokeLinecap="round" /><circle cx="50" cy="50" r="10" fill="currentColor" /></svg>
          Ourlet
        </a>
        <nav aria-label="Rayons" className="mr-auto hidden gap-2 min-[900px]:flex">
          {['Femme', 'Homme', 'Journal'].map((n) => <a key={n} href={`#${n.toLowerCase()}`} data-cursor="lien" className={`inline-flex min-h-11 items-center px-3 text-[15px] text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)] ${focus}`}>{n}</a>)}
        </nav>
        <div className="ml-auto flex gap-1 min-[900px]:ml-0">
          <button type="button" data-cursor="aimant" aria-label="Rechercher" className={`grid size-11 place-items-center rounded-full text-[var(--text-strong)] ${magnetic} ${focus}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[22px] fill-none stroke-current [stroke-linecap:round] [stroke-width:1.6]"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
          </button>
          <button type="button" data-cursor="aimant" aria-label="Panier, 2 articles" className={`relative grid size-11 place-items-center rounded-full text-[var(--text-strong)] ${magnetic} ${focus}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[22px] fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.6]"><path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8Z" /><path d="M9 8V7a3 3 0 0 1 6 0v1" /></svg>
            <span aria-hidden="true" className="absolute right-1 top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[var(--accent)] px-1 text-[11px] font-semibold text-[var(--accent-fg)]">2</span>
          </button>
        </div>
      </header>

      <div className="grid items-center gap-8 min-[900px]:grid-cols-[1.1fr_.9fr] min-[900px]:gap-12">
        <div>
          <p className="mb-4 font-mono text-xs uppercase tracking-[.04em] text-[var(--text-muted)]">Collection automne · 24 pièces</p>
          <h1 id="ourlet-title" className="text-balance text-[clamp(2.5rem,1.4rem+4vw,5rem)] font-semibold leading-[.98] tracking-[-0.045em] text-[var(--text-strong)]">La maille, sans&nbsp;compromis.</h1>
          <p data-cursor="texte" className="mt-4 max-w-[30rem] text-base leading-relaxed text-[var(--text-muted)] min-[900px]:mt-6 min-[900px]:text-lg">Laine mérinos tricotée à Troyes, teintures végétales, coutures reprises à la main. Des pièces pensées pour durer dix hivers.</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 min-[900px]:mt-8">
            <a href="#collection" data-cursor="aimant" className={`inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--accent)] px-6 text-[15px] font-semibold text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] min-[900px]:w-auto ${magnetic} ${focus}`}>Découvrir la collection</a>
            <a href="#atelier" data-cursor="lien" className={`inline-flex min-h-11 items-center text-[15px] font-medium text-[var(--text-strong)] underline decoration-[var(--border-control)] underline-offset-[6px] transition-colors hover:decoration-current ${focus}`}>Visiter l’atelier</a>
          </div>
        </div>
        <a href="#manteau-rade" data-cursor="voir" className={`group grid gap-3 text-[var(--text-strong)] ${focus}`}>
          <span className="block overflow-hidden rounded-xl bg-[var(--raised)] [&>svg]:aspect-[4/3] min-[900px]:[&>svg]:aspect-[5/6]">
            <svg viewBox="0 0 400 480" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className="block h-auto w-full object-cover transition-[scale] duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04] motion-reduce:transition-none"><rect width="400" height="480" className="fill-[var(--accent-subtle)]"/><circle cx="300" cy="96" r="54" className="fill-[var(--accent-subtle-border)]"/><path d="M150 92c14 18 86 18 100 0l58 34 26 230-48 8-10-120-6 210H130l-6-210-10 120-48-8 26-230Z" className="fill-[var(--accent)]"/><path d="M200 112v300M150 92l50 64 50-64" className="fill-none stroke-[var(--accent-subtle)] [stroke-width:4] [stroke-linecap:round] [stroke-linejoin:round] opacity-70"/><circle cx="214" cy="200" r="5" className="fill-[var(--surface)]"/><circle cx="214" cy="248" r="5" className="fill-[var(--surface)]"/><circle cx="214" cy="296" r="5" className="fill-[var(--surface)]"/><path d="M134 300h44M222 300h44" className="fill-none stroke-[var(--accent-subtle)] [stroke-width:4] [stroke-linecap:round] [stroke-linejoin:round] opacity-70"/></svg>
          </span>
          <span className="flex justify-between gap-3 text-[15px]"><span className="font-medium">Manteau Rade</span><span className="tabular-nums text-[var(--text-muted)]">289&nbsp;€</span></span>
          <span className="flex gap-1.5" aria-label="3 coloris">
            {['bg-[var(--accent)]', 'bg-[var(--text-strong)]', 'bg-[var(--accent-subtle-border)]'].map((c) => <i key={c} className={`size-3.5 rounded-full border border-[var(--border)] ${c}`} />)}
          </span>
        </a>
      </div>

      <div className="mt-12 min-[900px]:mt-16">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-[length:var(--t-section)] font-semibold tracking-[-0.02em] text-[var(--text-strong)]">Les essentiels</h2>
          <p aria-hidden="true" className="text-[13px] text-[var(--text-muted)]">Faites glisser</p>
        </div>
        <ul ref={trackRef} data-cursor="glisser" tabIndex={0} aria-label="Les essentiels, défilement horizontal"
          className={`-mx-5 grid snap-x snap-mandatory auto-cols-[62%] grid-flow-col gap-4 overflow-x-auto overscroll-x-contain px-5 pb-2 [scrollbar-width:none] data-[dragging=true]:snap-none data-[dragging=true]:select-none min-[900px]:mx-0 min-[900px]:auto-cols-[minmax(220px,23%)] min-[900px]:rounded-xl min-[900px]:px-0 [&::-webkit-scrollbar]:hidden ${focus}`}>
          {CARDS.map((c) => (
            <li key={c.href} className="snap-start">
              <a href={c.href} draggable={false} className={`group grid gap-2.5 text-[var(--text-strong)] [[data-dragging=true]_&]:pointer-events-none ${focus}`}>
                <span className="block overflow-hidden rounded-xl bg-[var(--raised)] [&>svg]:aspect-[30/34]">{c.art}</span>
                <span className="flex justify-between gap-3 text-[15px]"><span className="font-medium">{c.name}</span><span className="tabular-nums text-[var(--text-muted)]">{c.price}</span></span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </CursorZone>
  );
}
