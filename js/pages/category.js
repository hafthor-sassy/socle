/* Page catégorie : en-tête, filtres par tags, tri, grille de vignettes. */
import { CATEGORIES } from '../../registry/categories.js';
import { loadIndex } from '../lib/store.js';
import { icon, rawIcon } from '../lib/icons.js';
import { esc, fr, formatDate, plural, bindCopy } from '../lib/dom.js';
import { thumbHTML, mountThumbs } from '../lib/frames.js';
import { openDrawer, closeDrawer } from '../lib/shell.js';

export function cardHTML(it) {
  const cat = CATEGORIES.find((c) => c.id === it.categorie);
  const tag = (it.tags || [])[0];
  return `<a class="shot" href="#/i/${esc(it.id)}">
    ${thumbHTML(it)}
    <div class="shot__meta"><div class="tx"><b>${esc(it.nom)}</b><span>${esc(cat ? cat.nom : '')}</span></div>${tag ? `<span class="badge">${esc(tag)}</span>` : ''}</div>
  </a>`;
}

export function crumbs(parts) {
  return `<nav class="crumbs" aria-label="Fil d’Ariane"><ol style="display:contents">${parts.map((p, i) => {
    const last = i === parts.length - 1;
    const sep = i ? icon('chevronRight', { size: 14 }) : '';
    return `<li style="display:contents">${sep}${last ? `<span aria-current="page">${esc(p.label)}</span>` : `<a href="${p.href}">${esc(p.label)}</a>`}</li>`;
  }).join('')}</ol></nav>`;
}

export async function renderCategory(view, cat) {
  const { items: all } = await loadIndex();
  const items = all.filter((i) => i.categorie === cat.id);
  const tags = [...new Set(items.flatMap((i) => i.tags || []))].sort((a, b) => a.localeCompare(b, 'fr'));
  const state = { tags: new Set(), sort: 'recent' };

  const head = `
    ${crumbs([{ label: 'Bibliothèque', href: '#/' }, { label: cat.sectionNom, href: '#/' }, { label: cat.nom }])}
    <header class="phead">
      <div class="phead__title"><span class="tile">${rawIcon(cat.icon, { size: 22 })}</span><h1 class="t-page">${esc(cat.nom)}</h1></div>
      <p>${fr(cat.description)}</p>
    </header>`;

  if (!items.length) {
    const others = CATEGORIES.filter((c) => !c.page && all.some((i) => i.categorie === c.id)).slice(0, 4);
    const cmd = `node scripts/new-item.mjs ${cat.id} mon-design`;
    view.innerHTML = `${head}
      <div class="empty">
        <span class="tile">${rawIcon(cat.icon, { size: 26 })}</span>
        <h2 class="t-section">Bientôt</h2>
        <p>${fr(`Aucun design dans « ${cat.nom} » pour l’instant. Le premier s’ajoute en une commande :`)}</p>
        <span class="cmd-line"><code>${esc(cmd)}</code><button class="icon-btn copy-btn" type="button" aria-label="Copier la commande">${icon('copy', { size: 16 })}</button></span>
        ${others.length ? `<div class="suggest">${others.map((c) => `<a class="chip" href="#/c/${c.id}">${esc(c.nom)}</a>`).join('')}</div>` : ''}
      </div>`;
    bindCopy(view.querySelector('.copy-btn'), cmd, { toastMsg: 'Commande copiée' });
    return;
  }

  view.innerHTML = `${head}
    <div class="toolbar">
      <div class="toolbar__left">
        <button class="btn btn--secondary filters-btn" type="button" ${tags.length ? '' : 'hidden'}>${icon('filter', { size: 16 })}<span data-flabel>Filtres</span></button>
        <div class="chips" role="group" aria-label="Filtrer par tag">
          ${tags.map((t) => `<button class="chip" type="button" aria-pressed="false" data-tag="${esc(t)}">${icon('check', { size: 14 })}${esc(t)}</button>`).join('')}
        </div>
      </div>
      <div class="toolbar__right">
        <span class="count" data-count></span>
        <div class="seg" role="radiogroup" aria-label="Trier">
          <button type="button" role="radio" aria-checked="true" data-sort="recent">Récent</button>
          <button type="button" role="radio" aria-checked="false" data-sort="nom">Nom</button>
        </div>
      </div>
    </div>
    <div class="grid" data-grid></div>`;

  const grid = view.querySelector('[data-grid]');
  const countEl = view.querySelector('[data-count]');

  function apply() {
    let list = items.filter((i) => !state.tags.size || (i.tags || []).some((t) => state.tags.has(t)));
    list = list.slice().sort(state.sort === 'nom' ? (a, b) => a.nom.localeCompare(b.nom, 'fr') : (a, b) => (b.date || '').localeCompare(a.date || ''));
    grid.innerHTML = list.length ? list.map(cardHTML).join('') : `<p class="muted">Aucun design avec ces tags.</p>`;
    countEl.textContent = plural(list.length, 'design', 'designs');
    view.querySelectorAll('.chip[data-tag]').forEach((c) => c.setAttribute('aria-pressed', String(state.tags.has(c.dataset.tag))));
    const fl = view.querySelector('[data-flabel]');
    fl.textContent = state.tags.size ? `Filtres (${state.tags.size})` : 'Filtres';
    mountThumbs(grid);
  }

  view.querySelector('.toolbar .chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tag]');
    if (!b) return;
    const t = b.dataset.tag;
    state.tags.has(t) ? state.tags.delete(t) : state.tags.add(t);
    apply();
  });
  view.querySelectorAll('[data-sort]').forEach((b) => b.addEventListener('click', () => {
    state.sort = b.dataset.sort;
    view.querySelectorAll('[data-sort]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    apply();
  }));
  view.querySelector('.filters-btn').addEventListener('click', () => {
    openDrawer({
      side: 'right',
      title: '<h2 class="t-label strong" style="font-weight:600">Filtres</h2>',
      label: 'Filtres',
      body: `<div style="padding:16px;display:grid;gap:12px"><p class="eyebrow">Tags</p><div class="chips">${tags.map((t) => `<button class="chip" type="button" aria-pressed="${state.tags.has(t)}" data-tag="${esc(t)}">${icon('check', { size: 14 })}${esc(t)}</button>`).join('')}</div></div>`,
      foot: `<button class="btn btn--secondary" type="button" data-reset>Effacer</button><button class="btn btn--primary" type="button" data-done>Afficher</button>`,
      onMount: (d) => {
        d.querySelector('.chips').addEventListener('click', (e) => {
          const b = e.target.closest('[data-tag]');
          if (!b) return;
          const t = b.dataset.tag;
          state.tags.has(t) ? state.tags.delete(t) : state.tags.add(t);
          b.setAttribute('aria-pressed', String(state.tags.has(t)));
          apply();
        });
        d.querySelector('[data-reset]').addEventListener('click', () => { state.tags.clear(); d.querySelectorAll('[data-tag]').forEach((b) => b.setAttribute('aria-pressed', 'false')); apply(); });
        d.querySelector('[data-done]').addEventListener('click', () => closeDrawer());
      },
    });
  });
  apply();
}
