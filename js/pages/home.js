/* Accueil : accroche, derniers ajouts, index des sections, marques. */
import { SECTIONS, CATEGORIES } from '../../registry/categories.js';
import { loadIndex, countsByCategory } from '../lib/store.js';
import { icon, rawIcon } from '../lib/icons.js';
import { esc, fr } from '../lib/dom.js';
import { thumbHTML, mountThumbs } from '../lib/frames.js';
import { cardHTML } from './category.js';
import { brandShowcase } from './brands.js';

export async function renderHome(view) {
  const [{ items }, counts] = await Promise.all([loadIndex(), countsByCategory()]);
  const latest = items.slice(0, 6);
  const nCats = CATEGORIES.length;
  const nBrands = (window.BRANDS || []).length;
  const first = items[0];

  view.innerHTML = `
  <div class="page">
    <section class="hero" aria-labelledby="h-hero">
      <p class="eyebrow">Bibliothèque de design</p>
      <h1 id="h-hero" class="t-display">Des fondations solides pour chaque interface.</h1>
      <p class="lead">${fr('Composants, animations et sections : un aperçu live, des props réglables et le code à copier en HTML/CSS ou React.')}</p>
      <div class="hero__actions">
        ${first ? `<a class="btn btn--primary" href="#/c/${first.categorie}">Parcourir la bibliothèque${icon('arrowRight', { size: 16 })}</a>` : ''}
        <button class="btn btn--secondary" type="button" data-open-cmdk>${icon('search', { size: 16 })}Rechercher</button>
      </div>
      <div class="hero__stats" role="list">
        <div class="stat" role="listitem"><b>${items.length}</b><span>designs</span></div>
        <div class="stat" role="listitem"><b>${nCats}</b><span>catégories</span></div>
        <div class="stat" role="listitem"><b>${nBrands}</b><span>marques</span></div>
      </div>
    </section>

    <section class="block" aria-labelledby="h-latest">
      <div class="block__head">
        <div><h2 id="h-latest" class="t-section">Derniers ajouts</h2><p class="muted t-sm">Aperçus live, au thème de l’interface.</p></div>
      </div>
      ${latest.length ? `<div class="grid">${latest.map(cardHTML).join('')}</div>` : `<p class="muted">Aucun design pour l’instant.</p>`}
    </section>

    <section class="block" aria-labelledby="h-index">
      <div class="block__head"><div><h2 id="h-index" class="t-section">Toute la bibliothèque</h2><p class="muted t-sm">Six sections, des fondations aux pages complètes.</p></div></div>
      <div class="index">
        ${SECTIONS.map((s) => `
          <div class="index__sec">
            <div class="index__meta"><span class="eyebrow">${s.num}</span><h3>${esc(s.nom)}</h3><p>${fr(s.description)}</p></div>
            <ul class="index__cats">
              ${s.categories.map((c) => {
                const n = counts[c.id] || 0;
                const special = !!c.page;
                const empty = !special && n === 0;
                const right = special ? icon('arrowRight', { size: 16, cls: 'c' }) : `<span class="c">${empty ? 'Bientôt' : n}</span>`;
                return `<li><a class="cat-row ${empty ? 'is-empty' : ''}" href="#/c/${c.id}"><span class="tile">${rawIcon(c.icon, { size: 18 })}</span><span class="nm">${esc(c.nom)}</span>${right}</a></li>`;
              }).join('')}
            </ul>
          </div>`).join('')}
      </div>
    </section>

    <section class="block" aria-labelledby="h-brands">
      <div class="block__head">
        <div><h2 id="h-brands" class="t-section">Marques</h2><p class="muted t-sm">Logos, icônes d’app et palettes de chaque projet.</p></div>
        <a class="link-more" href="#/marques">Toutes les marques${icon('arrowRight', { size: 16 })}</a>
      </div>
      ${brandShowcase()}
    </section>
  </div>
  <footer class="foot"><span>Socle · bibliothèque de design</span><span>Geist · Terracotta · grille de 8 px</span></footer>`;

  mountThumbs(view);
}
