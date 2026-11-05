/* Socle — point d'entrée : routeur par hash (#/…), compatible sous-chemin. */
import { renderBar, setBarActive, treeHTML, bindTree, setActiveCat } from './lib/shell.js';
import { bindCmdk } from './lib/cmdk.js';
import { setTheme, hasStoredTheme } from './lib/store.js';
import { getCategory } from '../registry/categories.js';
import { renderHome } from './pages/home.js';
import { renderCategory } from './pages/category.js';
import { renderItem } from './pages/item.js';
import { renderBrands, renderBrand } from './pages/brands.js';
import { renderFoundation } from './pages/foundations.js';
import { esc } from './lib/dom.js';

const app = document.getElementById('app');
let cleanup = null;

/* Gabarit avec navigation latérale */
async function withShell(activeCat, render) {
  setActiveCat(activeCat);
  const tree = await treeHTML(activeCat);
  app.innerHTML = `<div class="shell">
      <aside class="side" aria-label="Navigation de la bibliothèque">${tree}</aside>
      <main class="main" id="contenu" tabindex="-1"><div class="main__in view-enter" id="view"></div></main>
    </div>`;
  bindTree(app.querySelector('.side'));
  const view = app.querySelector('#view');
  const c = await render(view);
  const cur = app.querySelector('.side [aria-current="page"]');
  if (cur) cur.scrollIntoView({ block: 'nearest' });
  return c;
}

async function withPage(render) {
  setActiveCat('__home');
  app.innerHTML = `<main id="contenu" tabindex="-1"><div class="view-enter" id="view"></div></main>`;
  return render(app.querySelector('#view'));
}

function notFound(view, what = 'Cette page') {
  view.innerHTML = `<div class="empty" style="margin-top:24px"><h1 class="t-section">${esc(what)} n’existe pas</h1><p>Le lien est peut-être ancien. Repartez de la vue d’ensemble ou cherchez avec ⌘K.</p><a class="btn btn--secondary" href="#/">Vue d’ensemble</a></div>`;
}

async function route() {
  if (typeof cleanup === 'function') { try { cleanup(); } catch (e) {} }
  cleanup = null;
  const hash = location.hash.replace(/^#/, '') || '/';
  const parts = hash.split('?')[0].split('/').filter(Boolean).map(decodeURIComponent);
  window.scrollTo(0, 0);

  try {
    if (parts.length === 0) {
      setBarActive('home');
      document.title = 'Socle — Bibliothèque de design';
      cleanup = await withPage(renderHome);
    } else if (parts[0] === 'c' && parts[1]) {
      const cat = getCategory(parts[1]);
      setBarActive(cat && cat.section === 'fondations' ? 'fondations' : 'home');
      if (cat && cat.page === 'marques') { location.replace('#/marques'); return; }
      cleanup = await withShell(parts[1], (view) => {
        if (!cat) return notFound(view, 'Cette catégorie');
        document.title = `${cat.nom} — Socle`;
        return cat.page ? renderFoundation(view, cat) : renderCategory(view, cat);
      });
    } else if (parts[0] === 'i' && parts[1]) {
      setBarActive('home');
      cleanup = await withShell('', (view) => renderItem(view, parts[1], (catId) => setSideActive(catId)));
    } else if (parts[0] === 'marques') {
      setBarActive('marques');
      cleanup = await withShell('logos', (view) => (parts[1] ? renderBrand(view, parts[1]) : renderBrands(view)));
    } else {
      setBarActive('');
      cleanup = await withShell('', (view) => notFound(view));
    }
  } catch (err) {
    console.error(err);
    const view = document.getElementById('view') || app;
    view.innerHTML = `<div class="empty" style="margin-top:24px"><h1 class="t-section">Impossible d’afficher cette page</h1><p>${esc(err.message || '')}</p><a class="btn btn--secondary" href="#/">Vue d’ensemble</a></div>`;
  }
  const main = document.getElementById('contenu');
  if (main && document.activeElement === document.body && route.count++ > 0) main.focus({ preventScroll: true });
}
route.count = 0;

/* Met la catégorie de l'item en surbrillance dans la navigation latérale. */
function setSideActive(catId) {
  setActiveCat(catId);
  const side = app.querySelector('.side');
  if (!side) return;
  side.querySelectorAll('.tree__link').forEach((a) => {
    if (a.getAttribute('href') === `#/c/${catId}`) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  const cur = side.querySelector('[aria-current="page"]');
  if (cur) {
    const list = cur.closest('.tree__list');
    if (list && list.hidden) { list.hidden = false; const h = side.querySelector(`[aria-controls="${list.id}"]`); h && h.setAttribute('aria-expanded', 'true'); }
    cur.scrollIntoView({ block: 'nearest' });
  }
}

/* Thème système suivi tant que l'utilisateur n'a pas choisi. */
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!hasStoredTheme()) setTheme(e.matches ? 'dark' : 'light', false);
});

renderBar();
bindCmdk();
window.addEventListener('hashchange', route);
route();
