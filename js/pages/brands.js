/* Marques : galerie des logos (données window.BRANDS, LOGOS, LOGO_PALETTES). */
import { icon } from '../lib/icons.js';
import { esc, fr, copyText, toast } from '../lib/dom.js';
import { currentTheme } from '../lib/store.js';
import { crumbs } from './category.js';

const brands = () => window.BRANDS || [];
const logosOf = (bid) => {
  const b = (window.LOGOS || {})[bid];
  if (!b) return { categories: [], items: [] };
  const items = (b.items || []).map((it, i) => ({ ...it, id: it.id || it.num || String(i + 1).padStart(2, '0'), num: it.num || it.id || String(i + 1).padStart(2, '0') }));
  return { categories: b.categories || [], items };
};

/* Couleurs résolues d'une palette pour un thème. */
function vars(pal, theme) {
  const d = theme === 'dark';
  return {
    bg: d ? pal.dk : pal.lt,
    ink: d ? pal.lt : pal.dk,
    p: (d && pal.p_d) || pal.p,
    s: (d && pal.s_d) || pal.s,
    a: (d && pal.a_d) || pal.a,
    dk: pal.dk,
    lt: pal.lt,
  };
}
const styleVars = (v) => Object.entries(v).map(([k, x]) => `--${k}:${x}`).join(';');

let uid = 0;
function uniq(svg) {
  const n = `u${++uid}`;
  return svg.replace(/id="([^"]+)"/g, `id="$1-${n}"`).replace(/url\(#([^)]+)\)/g, `url(#$1-${n})`).replace(/href="#([^"]+)"/g, `href="#$1-${n}"`);
}
function svgFor(item, kind, theme) {
  const key = theme === 'dark' && item[`${kind}_d`] ? `${kind}_d` : kind;
  return item[key] || item[kind] || '';
}
function resolved(svg, v) {
  return svg.replace(/var\(--(\w+)\)/g, (m, k) => v[k] || m);
}
function art(item, kind, pal, theme, label) {
  const svg = uniq(svgFor(item, kind, theme)).replace('<svg ', `<svg role="img" aria-label="${esc(label)}" `);
  return `<div style="${styleVars(vars(pal, theme))}">${svg}</div>`;
}
const palsOf = (item) => (item.palettes && item.palettes.length ? item.palettes : [ (window.LOGO_PALETTES || []).find((p) => p.id === item.palette_defaut) ].filter(Boolean));

/* Vitrine utilisée sur l'accueil et la liste des marques. */
export function brandShowcase() {
  const theme = currentTheme();
  return `<div class="brand-grid">${brands().map((b) => {
    const { items } = logosOf(b.id);
    const shown = (b.vitrine || []).map((id) => items.find((x) => x.id === id)).filter(Boolean).slice(0, 4);
    while (shown.length < 4 && items[shown.length]) shown.push(items[shown.length]);
    return `<a class="brand-card" href="#/marques/${esc(b.id)}">
      <div class="brand-card__show" aria-hidden="true">${shown.map((it) => `<div class="cell">${art(it, 'svg_app', palsOf(it)[0], theme, it.nom)}</div>`).join('')}</div>
      <div class="brand-card__body">
        <div class="row"><b class="strong">${esc(b.nom)}</b><span class="t-xs muted num">${items.length}\u00A0pistes</span></div>
        <p class="t-sm muted">${fr(b.baseline)}</p>
        <p class="t-xs muted">${fr(b.statut || '')}</p>
      </div>
    </a>`;
  }).join('')}</div>`;
}

export async function renderBrands(view) {
  document.title = 'Marques — Socle';
  view.innerHTML = `
    ${crumbs([{ label: 'Bibliothèque', href: '#/' }, { label: 'Fondations', href: '#/' }, { label: 'Marques' }])}
    <header class="phead"><h1 class="t-page">Marques</h1><p>${fr('Chaque projet, ses pistes de logo, ses icônes d’app et ses palettes. Clair et sombre, SVG prêts à copier.')}</p></header>
    ${brandShowcase()}`;
  const onTheme = () => { const g = view.querySelector('.brand-grid'); if (g) g.outerHTML = brandShowcase(); };
  window.addEventListener('socle:theme', onTheme);
  return () => window.removeEventListener('socle:theme', onTheme);
}

export async function renderBrand(view, bid) {
  const b = brands().find((x) => x.id === bid);
  if (!b) {
    view.innerHTML = `<div class="empty" style="margin-top:24px"><h1 class="t-section">Marque introuvable</h1><a class="btn btn--secondary" href="#/marques">Toutes les marques</a></div>`;
    return;
  }
  document.title = `${b.nom} — Marques — Socle`;
  const { categories, items } = logosOf(bid);
  const state = { cat: '', theme: currentTheme(), pal: {}, locked: false };
  items.forEach((it) => { state.pal[it.id] = 0; });
  const retained = items.filter((it) => /retenu/i.test(it.categorie || ''));

  view.innerHTML = `
    ${crumbs([{ label: 'Bibliothèque', href: '#/' }, { label: 'Marques', href: '#/marques' }, { label: b.nom }])}
    <header class="phead">
      <h1 class="t-page">${esc(b.nom)}</h1>
      <p>${fr(b.baseline)}</p>
      <div class="phead__meta"><span class="badge ${retained.length ? 'badge--accent' : ''}">${esc(b.statut || '')}</span><span class="t-xs muted num">${items.length}\u00A0pistes</span></div>
    </header>
    <div data-feature></div>
    <div class="toolbar">
      <div class="toolbar__left"><div class="seg" role="radiogroup" aria-label="Catégorie de logo" data-cats>
        <button type="button" role="radio" aria-checked="true" data-cat="">Toutes</button>
        ${categories.map((c) => `<button type="button" role="radio" aria-checked="false" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}
      </div></div>
      <div class="toolbar__right"><div class="seg" role="radiogroup" aria-label="Thème des logos" data-themes>
        <button type="button" role="radio" data-th="light">Clair</button><button type="button" role="radio" data-th="dark">Sombre</button>
      </div></div>
    </div>
    <div class="logo-grid" data-grid></div>`;

  const grid = view.querySelector('[data-grid]');
  const feat = view.querySelector('[data-feature]');

  function card(it) {
    const pals = palsOf(it);
    const pal = pals[state.pal[it.id]] || pals[0];
    return `<article class="logo-card" data-id="${esc(it.id)}">
      <div class="logo-card__art">${art(it, 'svg_logo', pal, state.theme, `Logo ${b.nom}, piste ${it.nom}`)}
        <div class="logo-card__icons" aria-hidden="true">${art(it, 'svg_app', pal, state.theme, '')}</div></div>
      <div class="logo-card__body">
        <div class="logo-card__title"><span class="n">${esc(it.num)}</span><b>${esc(it.nom)}</b><span class="badge" style="margin-left:auto">${esc(it.categorie || '')}</span></div>
        <p class="clamp2" title="${esc(it.idee || '')}">${fr(it.idee || '')}</p>
        <p class="t-xs muted mono">${esc(it.typo_titre || '')}</p>
      </div>
      <div class="logo-card__foot">${pals.length < 2 ? `<span class="t-xs muted">${esc((pals[0] && pals[0].nom) || '')}</span>` : ''}
        <div class="swatches" role="radiogroup" aria-label="Palette" ${pals.length < 2 ? 'hidden' : ''}>${pals.map((p, i) => `<button class="sw" type="button" role="radio" aria-checked="${i === (state.pal[it.id] || 0)}" aria-label="${esc(p.nom || 'Palette')}" title="${esc(p.nom || '')}" data-pal="${i}"><i style="background:${esc(p.p)}"></i></button>`).join('')}</div>
        <div class="logo-card__actions">
          <button class="btn btn--ghost btn--sm" type="button" data-copy="svg_logo">${icon('copy', { size: 16 })}Logo</button>
          <button class="btn btn--ghost btn--sm" type="button" data-copy="svg_app">${icon('copy', { size: 16 })}Icône</button>
        </div>
      </div>
    </article>`;
  }

  function renderFeature() {
    if (!retained.length) { feat.innerHTML = ''; return; }
    const it = retained[0];
    const pal = palsOf(it)[0];
    feat.innerHTML = `<section class="sec" aria-labelledby="h-ret" style="margin-bottom:40px">
      <h2 id="h-ret" class="t-section">Logo retenu · ${esc(it.nom)}</h2>
      <p class="sub">${fr(it.idee || '')}</p>
      <div class="feature">
        <div class="art">${art(it, 'svg_logo', pal, 'light', `${b.nom}, version claire`)}</div>
        <div class="art">${art(it, 'svg_logo', pal, 'dark', `${b.nom}, version sombre`)}</div>
        <div class="app">${art(it, 'svg_app', pal, 'light', `Icône d’app ${b.nom}`)}</div>
      </div></section>`;
  }

  function render() {
    const list = items.filter((it) => !state.cat || it.categorie === state.cat);
    grid.innerHTML = list.map(card).join('');
    view.querySelectorAll('[data-th]').forEach((x) => x.setAttribute('aria-checked', String(x.dataset.th === state.theme)));
  }

  view.querySelector('[data-cats]').addEventListener('click', (e) => {
    const x = e.target.closest('[data-cat]');
    if (!x) return;
    state.cat = x.dataset.cat;
    view.querySelectorAll('[data-cat]').forEach((y) => y.setAttribute('aria-checked', String(y === x)));
    render();
  });
  view.querySelector('[data-themes]').addEventListener('click', (e) => {
    const x = e.target.closest('[data-th]');
    if (!x) return;
    state.theme = x.dataset.th; state.locked = true; render();
  });
  grid.addEventListener('click', async (e) => {
    const c = e.target.closest('.logo-card');
    if (!c) return;
    const it = items.find((x) => x.id === c.dataset.id);
    const sw = e.target.closest('[data-pal]');
    if (sw) { state.pal[it.id] = +sw.dataset.pal; c.outerHTML = card(it); const nc = grid.querySelector(`[data-id="${CSS.escape(it.id)}"] [data-pal="${sw.dataset.pal}"]`); nc && nc.focus(); return; }
    const cp = e.target.closest('[data-copy]');
    if (cp) {
      const pal = palsOf(it)[state.pal[it.id] || 0];
      const svg = resolved(svgFor(it, cp.dataset.copy, state.theme), vars(pal, state.theme));
      const ok = await copyText(svg);
      toast(ok ? `SVG ${cp.dataset.copy === 'svg_app' ? 'de l’icône' : 'du logo'} copié` : 'Copie impossible');
    }
  });
  const onTheme = (e) => { if (!state.locked) { state.theme = e.detail; render(); } };
  window.addEventListener('socle:theme', onTheme);
  renderFeature();
  render();
  return () => window.removeEventListener('socle:theme', onTheme);
}
