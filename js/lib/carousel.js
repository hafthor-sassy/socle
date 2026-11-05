/* Carrousel à défilement continu : boucle infinie sans saut (recyclage des cartes),
   pause au survol, au focus et au toucher, flèches, balayage, bouton pause.
   Avec prefers-reduced-motion : pas de défilement automatique. */
import { reducedMotion } from './dom.js';

export function mountCarousel(root, { speed = 28, onClone = null } = {}) {
  const viewport = root.querySelector('.carousel__viewport');
  const track = root.querySelector('.carousel__track');
  const prevBtn = root.querySelector('[data-prev]');
  const nextBtn = root.querySelector('[data-next]');
  const playBtn = root.querySelector('[data-play]');
  const originals = [...track.children];
  if (!originals.length) return () => {};
  let slides = [];
  let step = 0; let total = 0; let offset = 0; let last = 0; let raf = 0;
  let hover = false; let focus = false; let touch = false; let user = !reducedMotion();
  let anim = null; // { from, to, t0, d }
  let drag = null;

  function measure() {
    // Ajoute des copies tant que la piste ne couvre pas l'écran plus deux cartes.
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 24;
    const w = originals[0].getBoundingClientRect().width || 300;
    step = w + gap;
    let list = [...track.children];
    while (list.length * step < viewport.clientWidth + step * 2) {
      originals.forEach((o) => {
        const c = o.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        c.dataset.clone = '1';
        c.querySelectorAll('a, button, [tabindex]').forEach((x) => x.setAttribute('tabindex', '-1'));
        track.appendChild(c);
        if (onClone) onClone(c);
      });
      list = [...track.children];
    }
    slides = list;
    total = slides.length * step;
    place();
  }
  function place() {
    slides.forEach((s, i) => {
      let x = ((i * step - offset) % total + total) % total;
      if (x > total - step) x -= total;
      s.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
    });
  }
  const running = () => user && !hover && !focus && !touch && !drag && !document.hidden;
  function frame(t) {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(64, t - last) : 16;
    last = t;
    if (anim) {
      const k = Math.min(1, (t - anim.t0) / anim.d);
      const e = 1 - Math.pow(1 - k, 3);
      offset = anim.from + (anim.to - anim.from) * e;
      if (k >= 1) anim = null;
      place();
      return;
    }
    if (running()) { offset += (speed * dt) / 1000; place(); }
  }
  function go(dir) {
    // Aligne sur la carte suivante / précédente
    const base = anim ? anim.to : offset;
    const target = (Math.round(base / step) + dir) * step;
    anim = { from: offset, to: target, t0: performance.now(), d: reducedMotion() ? 1 : 420 };
  }
  function syncPlay() {
    if (!playBtn) return;
    playBtn.setAttribute('aria-pressed', String(!user));
    playBtn.setAttribute('aria-label', user ? 'Mettre le défilement en pause' : 'Reprendre le défilement');
    playBtn.dataset.state = user ? 'play' : 'pause';
  }
  prevBtn && prevBtn.addEventListener('click', () => go(-1));
  nextBtn && nextBtn.addEventListener('click', () => go(1));
  playBtn && playBtn.addEventListener('click', () => { user = !user; syncPlay(); });
  root.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hover = true; });
  root.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hover = false; });
  root.addEventListener('focusin', () => { focus = true; });
  root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget)) focus = false; });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  });
  // Balayage (toucher et souris)
  viewport.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY, o: offset, moved: false, id: e.pointerId, type: e.pointerType };
    if (e.pointerType !== 'mouse') touch = true;
    anim = null;
  });
  viewport.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(e.clientY - drag.y)) { drag.moved = true; viewport.setPointerCapture(e.pointerId); root.classList.add('is-dragging'); }
    if (drag.moved) { offset = drag.o - dx; place(); }
  });
  const end = (e) => {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    const moved = drag.moved; const type = drag.type;
    drag = null;
    root.classList.remove('is-dragging');
    if (moved) {
      root.dataset.dragged = '1';
      setTimeout(() => { delete root.dataset.dragged; }, 80);
      const target = Math.round(offset / step) * step;
      anim = { from: offset, to: target, t0: performance.now(), d: 300 };
    }
    if (type !== 'mouse') setTimeout(() => { touch = false; }, 2500);
  };
  viewport.addEventListener('pointerup', end);
  viewport.addEventListener('pointercancel', end);
  // Un glissé n'ouvre pas la carte
  viewport.addEventListener('click', (e) => { if (root.dataset.dragged) { e.preventDefault(); e.stopPropagation(); } }, true);
  // Le focus clavier sur une carte la ramène dans la vue
  track.addEventListener('focusin', (e) => {
    const s = e.target.closest('.carousel__slide');
    if (!s) return;
    const i = slides.indexOf(s);
    const x = ((i * step - offset) % total + total) % total;
    if (x < 0 || x + step > viewport.clientWidth) anim = { from: offset, to: offset + x - 0, t0: performance.now(), d: reducedMotion() ? 1 : 300 };
  });
  const ro = new ResizeObserver(() => measure());
  ro.observe(viewport);
  measure();
  syncPlay();
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); };
}
