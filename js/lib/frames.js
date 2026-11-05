/* Aperçus live : URL de démo, vignettes à l'échelle, diffusion du thème. */
import { itemPath, currentTheme } from './store.js';
import { esc } from './dom.js';

/*
  sandbox : scripts seulement. La démo tourne dans une origine opaque : elle ne
  peut ni lire l'application, ni naviguer, ni ouvrir de fenêtre. Ses fichiers
  (polices, code/) se chargent grâce à Access-Control-Allow-Origin: *, envoyé par
  GitHub Pages et par scripts/serve.mjs en local.
*/
export const SANDBOX = 'allow-scripts';

export function demoURL(id, { theme = currentTheme(), bg = '', thumb = false, props = null } = {}) {
  const q = new URLSearchParams();
  q.set('theme', theme);
  if (bg) q.set('bg', bg);
  if (thumb) q.set('thumb', '1');
  if (props) Object.entries(props).forEach(([k, v]) => q.set(k, String(v)));
  return `${itemPath(id)}demo.html?${q.toString()}`;
}

export function post(iframe, msg) {
  try { iframe.contentWindow && iframe.contentWindow.postMessage({ socle: 1, ...msg }, '*'); } catch (e) { /* ignoré */ }
}

/* Vignette : l'iframe est rendue à sa largeur réelle puis réduite. */
export function thumbHTML(item) {
  const w = (item.thumb && item.thumb.width) || 1024;
  const h = Math.round(w * 0.75);
  return `<div class="shot__frame" data-thumb-w="${w}" data-thumb-h="${h}">
    <iframe data-demo data-src="${esc(demoURL(item.id, { thumb: true }))}" title="Aperçu de ${esc(item.nom)}" tabindex="-1" aria-hidden="true" sandbox="${SANDBOX}" width="${w}" height="${h}"></iframe>
  </div>`;
}

let ro = null;
let io = null;
function scaleFrame(frame) {
  const w = +frame.dataset.thumbW;
  const ifr = frame.querySelector('iframe');
  if (!ifr) return;
  const s = frame.clientWidth / w;
  ifr.style.transform = `scale(${s})`;
}

export function mountThumbs(root = document) {
  if (!ro) ro = new ResizeObserver((entries) => entries.forEach((e) => scaleFrame(e.target)));
  if (!io) {
    io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const ifr = e.target.querySelector('iframe[data-src]');
        if (ifr && !ifr.getAttribute('src')) ifr.src = ifr.dataset.src.replace(/theme=\w+/, 'theme=' + currentTheme());
        io.unobserve(e.target);
      });
    }, { rootMargin: '200px' });
  }
  root.querySelectorAll('.shot__frame').forEach((f) => { scaleFrame(f); ro.observe(f); io.observe(f); });
}

/* Le thème de l'app suit dans toutes les démos. */
window.addEventListener('socle:theme', (e) => {
  document.querySelectorAll('iframe[data-demo]').forEach((ifr) => {
    if (ifr.dataset.themeLock) return;
    post(ifr, { type: 'theme', theme: e.detail });
  });
});
