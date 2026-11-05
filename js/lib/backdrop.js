/* Fond animé de l'accueil : trame de points (le motif « Grille fine ») qui dérive,
   halo discret et projecteur qui suit le curseur. Coupé avec prefers-reduced-motion. */
import { reducedMotion } from './dom.js';

let n = 0;
export function backdropHTML({ spot = true, cls = '' } = {}) {
  const id = `bd-${++n}`;
  return `<div class="backdrop ${cls}" aria-hidden="true" ${spot ? 'data-spot' : ''}>
    <div class="backdrop__halo"></div>
    <svg class="backdrop__dots"><defs><pattern id="${id}" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="12" cy="12" r="1" fill="currentColor"/></pattern></defs><rect width="100%" height="100%" fill="url(#${id})"/></svg>
    ${spot ? `<svg class="backdrop__dots backdrop__dots--lit"><defs><pattern id="${id}-l" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="12" cy="12" r="1.25" fill="currentColor"/></pattern></defs><rect width="100%" height="100%" fill="url(#${id}-l)"/></svg>` : ''}
  </div>`;
}

/* Projecteur : position du curseur en variables CSS, lissée. */
export function mountBackdrops(root) {
  const els = [...root.querySelectorAll('.backdrop[data-spot]')];
  if (!els.length) return () => {};
  if (reducedMotion() || !matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {};
  const st = els.map((el) => ({ el, host: el.parentElement, x: 0.7, y: 0.3, tx: 0.7, ty: 0.3, on: 0, ton: 0 }));
  let raf = 0;
  const tick = () => {
    raf = 0;
    let moving = false;
    st.forEach((s) => {
      s.x += (s.tx - s.x) * 0.12; s.y += (s.ty - s.y) * 0.12; s.on += (s.ton - s.on) * 0.1;
      s.el.style.setProperty('--mx', `${(s.x * 100).toFixed(2)}%`);
      s.el.style.setProperty('--my', `${(s.y * 100).toFixed(2)}%`);
      s.el.style.setProperty('--lit', s.on.toFixed(3));
      if (Math.abs(s.tx - s.x) > 0.001 || Math.abs(s.ty - s.y) > 0.001 || Math.abs(s.ton - s.on) > 0.002) moving = true;
    });
    if (moving) raf = requestAnimationFrame(tick);
  };
  const onMove = (e) => {
    st.forEach((s) => {
      const r = s.host.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      s.ton = inside ? 1 : 0;
      if (inside) { s.tx = (e.clientX - r.left) / r.width; s.ty = (e.clientY - r.top) / r.height; }
    });
    if (!raf) raf = requestAnimationFrame(tick);
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf); };
}
