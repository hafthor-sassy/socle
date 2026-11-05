/* Marques : galerie des logos (window.BRANDS, LOGOS, LOGO_PALETTES), palettes en direct et fiches techniques. */
import { icon } from '../lib/icons.js';
import { esc, fr, copyText, toast } from '../lib/dom.js';
import { currentTheme } from '../lib/store.js';
import { contrast, ratio, ensureContrast } from '../lib/color.js';
import { crumbs } from './category.js';

const brands = () => window.BRANDS || [];
const logosOf = (bid) => {
  const b = (window.LOGOS || {})[bid];
  if (!b) return { categories: [], items: [] };
  const items = (b.items || []).map((it, i) => ({ ...it, id: it.id || it.num || String(i + 1).padStart(2, '0'), num: it.num || it.id || String(i + 1).padStart(2, '0') }));
  return { categories: b.categories || [], items };
};

/* ——— Couleurs d'un logo ——— */
const ROLES = {
  p: ['Principale', 'Forme principale de l’icône', 3],
  s: ['Secondaire', 'Formes secondaires', 3],
  a: ['Accent', 'Bloc ou détail d’accent', 3],
  t: ['Accent du texte', 'Partie colorée du mot-symbole', 4.5],
  ink: ['Texte', 'Mot-symbole', 4.5],
  lt: ['Clair', 'Fond clair, texte sur sombre', 0],
  dk: ['Sombre', 'Fond sombre, texte sur clair', 0],
  bg: ['Fond', 'Fond de la vignette', 0],
};
/* Couleurs résolues d'une palette pour un thème. safe : applique nos règles (repères ≥ 3:1, texte ≥ 4,5:1 sur le fond). */
export function logoVars(pal, theme, safe = true) {
  const d = theme === 'dark';
  const raw = {
    bg: d ? pal.dk : pal.lt,
    ink: d ? pal.lt : pal.dk,
    p: (d && pal.p_d) || pal.p,
    s: (d && pal.s_d) || pal.s,
    a: (d && pal.a_d) || pal.a,
    t: (d ? pal.t_d : pal.t) || (d && pal.a_d) || pal.a,
    dk: pal.dk,
    lt: pal.lt,
  };
  const v = { ...raw };
  const adjusted = {};
  if (safe) {
    ['p', 's', 'a'].forEach((k) => { if (v[k]) v[k] = ensureContrast(v[k], v.bg, 3); });
    ['t', 'ink'].forEach((k) => { if (v[k]) v[k] = ensureContrast(v[k], v.bg, 4.5); });
    Object.keys(v).forEach((k) => { if (v[k] !== raw[k]) adjusted[k] = raw[k]; });
  }
  return { v, adjusted };
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
function art(item, kind, pal, theme, label, safe = true) {
  const svg = uniq(svgFor(item, kind, theme)).replace('<svg ', `<svg role="img" aria-label="${esc(label)}" `);
  return `<div class="art-box" style="${styleVars(logoVars(pal, theme, safe).v)}">${svg}</div>`;
}
const ownPals = (item) => (item.palettes && item.palettes.length ? item.palettes : [(window.LOGO_PALETTES || []).find((p) => p.id === item.palette_defaut)].filter(Boolean));
/* Palettes proposées : celles de la piste puis les 20 palettes Socle. */
function palOptions(item) {
  const own = ownPals(item).map((p, i) => ({ key: `own:${i}`, pal: p, nom: p.nom || 'Origine', group: 'Palettes de la piste' }));
  const names = new Set(own.map((o) => o.nom));
  const lib = (window.LOGO_PALETTES || []).filter((p) => !names.has(p.nom)).map((p) => ({ key: p.id, pal: p, nom: p.nom, group: 'Palettes Socle' }));
  return [...own, ...lib];
}
function pickPal(item, key) {
  const opts = palOptions(item);
  return (opts.find((o) => o.key === key) || opts[0]);
}
const dot = (pal) => `<span class="paldot" aria-hidden="true"><i style="background:${esc(pal.p)}"></i><i style="background:${esc(pal.a || pal.s)}"></i></span>`;

/* ——— Sélecteur de palette (surcouche) ——— */
let popEl = null;
function closePop() {
  if (!popEl) return;
  const { el, anchor, off } = popEl;
  popEl = null; el.remove(); off();
  anchor.setAttribute('aria-expanded', 'false');
  anchor.focus({ preventScroll: true });
}
function openPalPicker(anchor, opts, currentKey, onPick, title = 'Palette') {
  if (popEl && popEl.anchor === anchor) { closePop(); return; }
  closePop();
  const groups = [...new Set(opts.map((o) => o.group))];
  const el = document.createElement('div');
  el.className = 'palpop';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', title);
  el.innerHTML = `<div class="palpop__head">${esc(title)}</div>${groups.map((g) => `<div class="palpop__group"><p class="eyebrow">${esc(g)}</p><div class="palpop__grid" role="radiogroup" aria-label="${esc(g)}">${opts.filter((o) => o.group === g).map((o) => `<button type="button" role="radio" class="palpop__opt" aria-checked="${o.key === currentKey}" data-key="${esc(o.key)}" title="${esc(o.nom)}">${dot(o.pal)}<span>${esc(o.nom)}</span></button>`).join('')}</div></div>`).join('')}`;
  document.body.appendChild(el);
  const r = anchor.getBoundingClientRect();
  const w = Math.min(340, window.innerWidth - 16);
  el.style.width = `${w}px`;
  const left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8);
  const below = window.innerHeight - r.bottom;
  el.style.left = `${left}px`;
  if (below < 320 && r.top > below) { el.style.bottom = `${window.innerHeight - r.top + 6}px`; el.style.maxHeight = `${r.top - 16}px`; }
  else { el.style.top = `${r.bottom + 6}px`; el.style.maxHeight = `${below - 16}px`; }
  anchor.setAttribute('aria-expanded', 'true');
  const onDoc = (e) => { if (!el.contains(e.target) && !anchor.contains(e.target)) closePop(); };
  const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); closePop(); } };
  const onScroll = (e) => { if (!el.contains(e.target)) closePop(); };
  setTimeout(() => document.addEventListener('pointerdown', onDoc), 0);
  document.addEventListener('keydown', onKey);
  window.addEventListener('scroll', onScroll, true);
  popEl = { el, anchor, off: () => { document.removeEventListener('pointerdown', onDoc); document.removeEventListener('keydown', onKey); window.removeEventListener('scroll', onScroll, true); } };
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-key]');
    if (!b) return;
    onPick(b.dataset.key);
    closePop();
  });
  const cur = el.querySelector('[aria-checked="true"]') || el.querySelector('[data-key]');
  cur && cur.focus({ preventScroll: true });
}
window.addEventListener('hashchange', closePop);

/* Vitrine utilisée sur l'accueil et la liste des marques. */
export function brandShowcase() {
  const theme = currentTheme();
  return `<div class="brand-grid">${brands().map((b) => {
    const { items } = logosOf(b.id);
    const shown = (b.vitrine || []).map((id) => items.find((x) => x.id === id)).filter(Boolean).slice(0, 4);
    while (shown.length < 4 && items[shown.length]) shown.push(items[shown.length]);
    return `<a class="brand-card" href="#/marques/${esc(b.id)}">
      <div class="brand-card__show" aria-hidden="true">${shown.map((it) => `<div class="cell">${art(it, 'svg_app', ownPals(it)[0], theme, it.nom)}</div>`).join('')}</div>
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
    <header class="phead"><h1 class="t-page">Marques</h1><p>${fr('Chaque projet, ses pistes de logo, ses icônes d’app et ses palettes. Clair et sombre, fiches techniques, SVG et PNG prêts à l’emploi.')}</p></header>
    ${brandShowcase()}`;
  const onTheme = () => { const g = view.querySelector('.brand-grid'); if (g) g.outerHTML = brandShowcase(); };
  window.addEventListener('socle:theme', onTheme);
  return () => window.removeEventListener('socle:theme', onTheme);
}

/* État partagé galerie ↔ fiche (palette choisie, contraste garanti). */
const shared = { pal: {}, safe: true, all: '' };

export async function renderBrand(view, bid) {
  const b = brands().find((x) => x.id === bid);
  if (!b) {
    view.innerHTML = `<div class="empty" style="margin-top:24px"><h1 class="t-section">Marque introuvable</h1><a class="btn btn--secondary" href="#/marques">Toutes les marques</a></div>`;
    return;
  }
  document.title = `${b.nom} — Marques — Socle`;
  const { categories, items } = logosOf(bid);
  const state = { cat: '', theme: currentTheme(), locked: false };
  const keyOf = (it) => shared.pal[`${bid}/${it.id}`] || 'own:0';
  const retained = items.filter((it) => /retenu/i.test(it.categorie || ''));
  const libOpts = [{ key: '', pal: { p: 'var(--text-muted)', a: 'var(--border-control)' }, nom: 'Palette d’origine', group: 'Par défaut' },
    ...(window.LOGO_PALETTES || []).map((p) => ({ key: p.id, pal: p, nom: p.nom, group: 'Palettes Socle' }))];

  view.innerHTML = `
    ${crumbs([{ label: 'Bibliothèque', href: '#/' }, { label: 'Marques', href: '#/marques' }, { label: b.nom }])}
    <header class="phead">
      <h1 class="t-page">${esc(b.nom)}</h1>
      <p>${fr(b.baseline)}</p>
      <div class="phead__meta"><span class="badge ${retained.length ? 'badge--accent' : ''}">${esc(b.statut || '')}</span><span class="t-xs muted num">${items.length}\u00A0pistes</span></div>
    </header>
    <div data-feature></div>
    <div class="toolbar toolbar--logos">
      <div class="toolbar__left"><div class="seg" role="radiogroup" aria-label="Catégorie de logo" data-cats>
        <button type="button" role="radio" aria-checked="true" data-cat="">Toutes</button>
        ${categories.filter((c) => items.some((it) => it.categorie === c)).map((c) => `<button type="button" role="radio" aria-checked="false" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}
      </div></div>
      <div class="toolbar__right">
        <button class="palbtn" type="button" aria-haspopup="dialog" aria-expanded="false" data-all>${icon('palette', { size: 16 })}<span data-all-lbl>Palette pour toutes</span>${icon('chevronDown', { size: 16 })}</button>
        <div class="seg" role="radiogroup" aria-label="Thème des logos" data-themes>
          <button type="button" role="radio" data-th="light">Clair</button><button type="button" role="radio" data-th="dark">Sombre</button>
        </div>
      </div>
    </div>
    <div class="switch-row logo-safe"><span class="t-sm" id="safe-l"><b class="strong">Contraste garanti</b> <span class="muted">· repères ≥\u00A03:1 et texte ≥\u00A04,5:1 sur le fond, couleurs ajustées en OKLCH</span></span>
      <button class="switch" type="button" role="switch" aria-checked="${shared.safe}" aria-labelledby="safe-l" data-safe></button></div>
    <div class="logo-grid" data-grid></div>`;

  const grid = view.querySelector('[data-grid]');
  const feat = view.querySelector('[data-feature]');

  function card(it) {
    const o = pickPal(it, keyOf(it));
    const sheet = `#/marques/${esc(bid)}/${esc(it.id)}`;
    const { adjusted } = logoVars(o.pal, state.theme, shared.safe);
    return `<article class="logo-card" data-id="${esc(it.id)}">
      <a class="logo-card__art" href="${sheet}" aria-label="Fiche technique : ${esc(it.nom)}">${art(it, 'svg_logo', o.pal, state.theme, `Logo ${b.nom}, piste ${it.nom}`, shared.safe)}
        <div class="logo-card__icons" aria-hidden="true">${art(it, 'svg_app', o.pal, state.theme, '', shared.safe)}</div></a>
      <div class="logo-card__body">
        <div class="logo-card__title"><span class="n">${esc(it.num)}</span><a href="${sheet}"><b>${esc(it.nom)}</b></a><span class="badge ${/retenu/i.test(it.categorie || '') ? 'badge--accent' : ''}" style="margin-left:auto">${esc(it.categorie || '')}</span></div>
        <p class="clamp2" title="${esc(it.idee || '')}">${fr(it.idee || '')}</p>
        <p class="t-xs muted mono">${esc(it.typo_titre || '')}${Object.keys(adjusted).length ? ' · <span class="adj">couleurs ajustées</span>' : ''}</p>
      </div>
      <div class="logo-card__foot">
        <button class="palbtn palbtn--sm" type="button" aria-haspopup="dialog" aria-expanded="false" data-pick aria-label="Palette : ${esc(o.nom)}">${dot(o.pal)}<span>${esc(o.nom)}</span>${icon('chevronDown', { size: 14 })}</button>
        <div class="logo-card__actions">
          <button class="icon-btn" type="button" data-copy="svg_logo" aria-label="Copier le SVG du logo" title="Copier le SVG du logo">${icon('copy', { size: 16 })}</button>
          <a class="btn btn--ghost btn--sm btn--arrow" href="${sheet}">Fiche${icon('arrowRight', { size: 14 })}</a>
        </div>
      </div>
    </article>`;
  }

  function renderFeature() {
    if (!retained.length) { feat.innerHTML = ''; return; }
    const it = retained[0];
    const o = pickPal(it, keyOf(it));
    feat.innerHTML = `<section class="sec" aria-labelledby="h-ret" style="margin-bottom:40px">
      <div class="block__head" style="margin-bottom:12px"><div><h2 id="h-ret" class="t-section">Logo retenu · ${esc(it.nom)}</h2><p class="sub muted t-sm" style="margin-top:4px">${fr(it.idee || '')}</p></div>
        <a class="btn btn--secondary btn--arrow" href="#/marques/${esc(bid)}/${esc(it.id)}">Fiche technique${icon('arrowRight', { size: 16 })}</a></div>
      <div class="feature">
        <div class="art">${art(it, 'svg_logo', o.pal, 'light', `${b.nom}, version claire`, shared.safe)}</div>
        <div class="art">${art(it, 'svg_logo', o.pal, 'dark', `${b.nom}, version sombre`, shared.safe)}</div>
        <div class="app">${art(it, 'svg_app', o.pal, 'light', `Icône d’app ${b.nom}`, shared.safe)}${art(it, 'svg_app', o.pal, 'dark', `Icône d’app ${b.nom}, sombre`, shared.safe)}</div>
      </div></section>`;
  }

  function render() {
    const list = items.filter((it) => !state.cat || it.categorie === state.cat);
    grid.innerHTML = list.map(card).join('');
    view.querySelectorAll('[data-th]').forEach((x) => x.setAttribute('aria-checked', String(x.dataset.th === state.theme)));
    const lbl = view.querySelector('[data-all-lbl]');
    const cur = libOpts.find((o) => o.key === shared.all);
    lbl.textContent = shared.all && cur ? `Toutes en ${cur.nom}` : 'Palette pour toutes';
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
  view.querySelector('[data-safe]').addEventListener('click', (e) => {
    shared.safe = !shared.safe;
    e.currentTarget.setAttribute('aria-checked', String(shared.safe));
    renderFeature(); render();
  });
  const allBtn = view.querySelector('[data-all]');
  allBtn.addEventListener('click', () => openPalPicker(allBtn, libOpts, shared.all, (key) => {
    shared.all = key;
    items.forEach((it) => {
      const opts = palOptions(it);
      const k = `${bid}/${it.id}`;
      if (!key) delete shared.pal[k];
      else { const own = opts.find((o) => o.nom === (window.LOGO_PALETTES || []).find((p) => p.id === key)?.nom && o.key.startsWith('own:')); shared.pal[k] = own ? own.key : key; }
    });
    renderFeature(); render();
    toast(key ? `Palette ${libOpts.find((o) => o.key === key).nom} appliquée à toutes les pistes` : 'Palettes d’origine rétablies');
  }, 'Palette pour toutes les pistes'));

  grid.addEventListener('click', async (e) => {
    const c = e.target.closest('.logo-card');
    if (!c) return;
    const it = items.find((x) => x.id === c.dataset.id);
    const pk = e.target.closest('[data-pick]');
    if (pk) {
      openPalPicker(pk, palOptions(it), keyOf(it), (key) => {
        shared.pal[`${bid}/${it.id}`] = key;
        c.outerHTML = card(it);
        if (it === retained[0]) renderFeature();
        const nb = grid.querySelector(`[data-id="${CSS.escape(it.id)}"] [data-pick]`); nb && nb.focus();
      }, `Palette · ${it.nom}`);
      return;
    }
    const cp = e.target.closest('[data-copy]');
    if (cp) {
      const o = pickPal(it, keyOf(it));
      const svg = resolved(svgFor(it, cp.dataset.copy, state.theme), logoVars(o.pal, state.theme, shared.safe).v);
      const ok = await copyText(svg);
      toast(ok ? 'SVG du logo copié' : 'Copie impossible');
    }
  });
  const onTheme = (e) => { if (!state.locked) { state.theme = e.detail; render(); } };
  window.addEventListener('socle:theme', onTheme);
  renderFeature();
  render();
  return () => { window.removeEventListener('socle:theme', onTheme); closePop(); };
}

/* ——— Fiche technique d'un logo ——— */
function download(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function svgSize(svg) {
  const m = svg.match(/viewBox="([\d.\-\s]+)"/);
  const v = m ? m[1].trim().split(/\s+/).map(Number) : [0, 0, 100, 100];
  return { w: v[2], h: v[3] };
}
async function svgToPng(svg, width) {
  const { w, h } = svgSize(svg);
  const height = Math.round(width * h / w);
  const src = svg.includes('xmlns=') ? svg : svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  const sized = src.replace('<svg ', `<svg width="${width}" height="${height}" `);
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sized);
  await img.decode();
  const cv = document.createElement('canvas');
  cv.width = width; cv.height = height;
  cv.getContext('2d').drawImage(img, 0, 0, width, height);
  return new Promise((res) => cv.toBlob(res, 'image/png'));
}

export async function renderLogoSheet(view, bid, lid) {
  const b = brands().find((x) => x.id === bid);
  const { items } = logosOf(bid);
  const it = items.find((x) => x.id === lid);
  if (!b || !it) {
    view.innerHTML = `<div class="empty" style="margin-top:24px"><h1 class="t-section">Logo introuvable</h1><a class="btn btn--secondary" href="#/marques/${esc(bid)}">Retour à la marque</a></div>`;
    return;
  }
  document.title = `${it.nom} — ${b.nom} — Socle`;
  const k = `${bid}/${it.id}`;
  const idx = items.indexOf(it);
  const prev = items[idx - 1]; const next = items[idx + 1];

  function html() {
    const o = pickPal(it, shared.pal[k] || 'own:0');
    const L = logoVars(o.pal, 'light', shared.safe); const D = logoVars(o.pal, 'dark', shared.safe);
    const used = new Set([...(svgFor(it, 'svg_logo', 'light') + svgFor(it, 'svg_logo', 'dark') + svgFor(it, 'svg_app', 'light')).matchAll(/var\(--(\w+)\)/g)].map((m) => m[1]));
    const keys = ['p', 's', 'a', 't', 'ink', 'bg'].filter((x) => used.has(x) || (x === 'bg' && (used.has('lt') || used.has('dk'))));
    const cell = (V, kk, bg) => {
      const hex = V.v[kk];
      if (kk === 'bg') return `<td><button class="chipcolor" type="button" data-hex="${esc(hex)}" aria-label="Copier ${esc(hex)}"><i style="background:${esc(hex)}"></i>${esc(hex)}</button></td><td class="muted">—</td>`;
      const min = ROLES[kk][2];
      const r = contrast(hex, bg);
      const adj = V.adjusted[kk] ? `<span class="t-xs muted" title="Valeur d’origine ${esc(V.adjusted[kk])}"> · ajusté</span>` : '';
      return `<td><button class="chipcolor" type="button" data-hex="${esc(hex)}" aria-label="Copier ${esc(hex)}"><i style="background:${esc(hex)}"></i>${esc(hex)}</button>${adj}</td>
        <td><span class="ratio">${ratio(r)}</span> <span class="badge ${r >= min ? 'badge--green' : 'badge--red'}">${r >= min ? (min >= 4.5 ? 'Texte AA' : 'Repère AA') : 'Échec'}</span></td>`;
    };
    const rows = keys.map((kk) => `<tr><td><code>--${kk === 'bg' ? 'bg' : kk}</code></td><td class="muted">${esc(ROLES[kk][1])}</td>${cell(L, kk, L.v.bg)}${cell(D, kk, D.v.bg)}</tr>`).join('');
    const dl = (kind, theme, fmt, lbl) => `<button class="btn btn--secondary btn--sm" type="button" data-dl="${kind}|${theme}|${fmt}">${icon('download', { size: 16 })}${esc(lbl)}</button>`;
    return `
    ${crumbs([{ label: 'Marques', href: '#/marques' }, { label: b.nom, href: `#/marques/${esc(bid)}` }, { label: it.nom }])}
    <header class="dhead">
      <div class="dhead__tx">
        <div class="phead__meta"><span class="eyebrow">Fiche technique · ${esc(it.num)}</span>${/retenu/i.test(it.categorie || '') ? '<span class="badge badge--accent">Logo retenu</span>' : ''}</div>
        <h1 class="t-page">${esc(it.nom)}</h1>
        <p>${fr(it.idee || '')}</p>
      </div>
      <div class="sheet-actions">
        <button class="palbtn" type="button" aria-haspopup="dialog" aria-expanded="false" data-pick aria-label="Palette : ${esc(o.nom)}">${dot(o.pal)}<span>${esc(o.nom)}</span>${icon('chevronDown', { size: 16 })}</button>
        <button class="btn btn--primary btn--arrow" type="button" data-copysvg>${icon('copy', { size: 16 })}Copier le SVG</button>
      </div>
    </header>

    <div class="sheet-hero">
      <figure class="sheet-art">${art(it, 'svg_logo', o.pal, 'light', `${it.nom}, version claire`, shared.safe)}<figcaption>Clair</figcaption></figure>
      <figure class="sheet-art">${art(it, 'svg_logo', o.pal, 'dark', `${it.nom}, version sombre`, shared.safe)}<figcaption>Sombre</figcaption></figure>
    </div>

    <div class="sheet-grid">
      <section class="fact"><h3>${icon('square', { size: 18 })}Icône d’app</h3>
        <div class="sheet-apps">
          ${[96, 64, 40, 24].map((s) => `<div style="--sz:${s}px">${art(it, 'svg_app', o.pal, 'light', `Icône ${s} px`, shared.safe)}<span class="t-xs muted num">${s}</span></div>`).join('')}
        </div>
        <div class="sheet-apps sheet-apps--dark">
          ${[96, 64, 40, 24].map((s) => `<div style="--sz:${s}px">${art(it, 'svg_app', o.pal, 'dark', `Icône sombre ${s} px`, shared.safe)}<span class="t-xs muted num">${s}</span></div>`).join('')}
        </div>
      </section>
      <section class="fact"><h3>${icon('type', { size: 18 })}Typographie et forme</h3>
        <dl class="kv">
          <dt>Mot-symbole</dt><dd>${esc(it.typo_titre || '—')}</dd>
          <dt>Texte d’accompagnement</dt><dd>${esc(it.typo_texte || 'Geist')}</dd>
          <dt>Catégorie</dt><dd>${esc(it.categorie || '—')}</dd>
          <dt>Forme</dt><dd>${esc(it.forme || 'Pictogramme + mot-symbole')}</dd>
          <dt>Ton</dt><dd>${esc(it.ton || '—')}</dd>
        </dl>
      </section>
      <section class="fact"><h3>${icon('maximize', { size: 18 })}Protection et taille minimale</h3>
        <div class="clearspace" aria-hidden="true">${art(it, 'svg_logo', o.pal, currentTheme(), '', shared.safe)}<span class="cs-box" style="${(() => { const { w, h } = svgSize(svgFor(it, 'svg_logo', 'light')); return `inset:${(40 / h * 100).toFixed(2)}% ${(40 / w * 100).toFixed(2)}%`; })()}"></span></div>
        <ul>
          <li>${fr('Zone de protection : 40 unités tout autour (la marge de la planche), soit environ la hauteur du bloc de l’icône. Rien n’y entre.')}</li>
          <li>${fr('Logo complet : 96 px de large minimum à l’écran, 25 mm en impression.')}</li>
          <li>${fr('Sous ces tailles, utiliser l’icône seule : 16 px minimum (favicon).')}</li>
        </ul>
      </section>
    </div>

    <section class="sec" aria-labelledby="h-cols">
      <h2 id="h-cols" class="t-section">Couleurs et contrastes</h2>
      <p class="sub">${fr(`Palette ${o.nom}. Mesurés sur le fond réel de chaque version. Règles : repères de l’icône ≥ 3:1, texte ≥ 4,5:1.${shared.safe ? ' Les couleurs qui échouaient sont éclaircies (sombre) ou foncées (clair) en OKLCH, à teinte constante.' : ' Contraste garanti désactivé : couleurs d’origine.'}`)}</p>
      <div class="tokens"><div class="tokens__scroll"><table><thead><tr><th>Variable</th><th>Rôle</th><th>Clair</th><th>Contraste</th><th>Sombre</th><th>Contraste</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    </section>

    <div class="sheet-grid sheet-grid--2">
      <section class="fact"><h3>${icon('check', { size: 18 })}Usages</h3><ul>
        ${it.usage ? `<li>${fr(it.usage)}</li>` : ''}
        <li>${fr('Version claire sur fond clair, version sombre (couleurs éclaircies) sur fond sombre.')}</li>
        <li>${fr('Sur une photo, poser le logo sur une zone calme ou un voile du fond.')}</li>
        <li>${fr('Ne pas déformer, incliner, ombrer ni recolorer hors des palettes proposées.')}</li>
      </ul></section>
      <section class="fact"><h3>${icon('download', { size: 18 })}Téléchargements</h3>
        <div class="dl-grid">
          <span class="t-xs muted">Logo</span><div>${dl('svg_logo', 'light', 'svg', 'SVG clair')}${dl('svg_logo', 'dark', 'svg', 'SVG sombre')}${dl('svg_logo', 'light', 'png', 'PNG clair')}${dl('svg_logo', 'dark', 'png', 'PNG sombre')}</div>
          <span class="t-xs muted">Icône d’app</span><div>${dl('svg_app', 'light', 'svg', 'SVG')}${dl('svg_app', 'light', 'png', 'PNG 1024')}${dl('svg_app', 'dark', 'png', 'PNG sombre')}</div>
          <span class="t-xs muted">Pictogramme</span><div>${dl('svg_icone', 'light', 'svg', 'SVG clair')}${dl('svg_icone', 'dark', 'svg', 'SVG sombre')}</div>
        </div>
      </section>
    </div>

    ${prev || next ? `<nav class="pager" aria-label="Pistes de ${esc(b.nom)}">
      ${prev ? `<a class="prev" href="#/marques/${esc(bid)}/${esc(prev.id)}"><span>${icon('arrowLeft', { size: 14 })}Précédent</span><b>${esc(prev.nom)}</b></a>` : '<span></span>'}
      ${next ? `<a class="next" href="#/marques/${esc(bid)}/${esc(next.id)}"><span>Suivant${icon('arrowRight', { size: 14 })}</span><b>${esc(next.nom)}</b></a>` : ''}
    </nav>` : ''}`;
  }
  const paint = () => { view.innerHTML = html(); };
  paint();
  const current = (theme) => { const o = pickPal(it, shared.pal[k] || 'own:0'); return logoVars(o.pal, theme, shared.safe).v; };
  view.addEventListener('click', async (e) => {
    const pk = e.target.closest('[data-pick]');
    if (pk) { openPalPicker(pk, palOptions(it), shared.pal[k] || 'own:0', (key) => { shared.pal[k] = key; paint(); view.querySelector('[data-pick]').focus(); }, `Palette · ${it.nom}`); return; }
    const hx = e.target.closest('[data-hex]');
    if (hx) { const ok = await copyText(hx.dataset.hex); toast(ok ? `${hx.dataset.hex} copié` : 'Copie impossible'); return; }
    if (e.target.closest('[data-copysvg]')) {
      const th = currentTheme();
      const ok = await copyText(resolved(svgFor(it, 'svg_logo', th), current(th)));
      toast(ok ? `SVG ${th === 'dark' ? 'sombre' : 'clair'} copié` : 'Copie impossible');
      return;
    }
    const d = e.target.closest('[data-dl]');
    if (d) {
      const [kind, theme, fmt] = d.dataset.dl.split('|');
      const svg = resolved(svgFor(it, kind, theme), current(theme));
      const name = `${bid}-${it.id}-${kind.replace('svg_', '')}-${theme === 'dark' ? 'sombre' : 'clair'}.${fmt}`;
      try {
        if (fmt === 'svg') download(name, new Blob([svg], { type: 'image/svg+xml' }));
        else download(name, await svgToPng(svg, kind === 'svg_logo' ? 2048 : 1024));
        toast(`${name} téléchargé`);
      } catch (err) { toast('Export impossible'); }
    }
  });
  const onTheme = () => { if (view.isConnected) paint(); };
  window.addEventListener('socle:theme', onTheme);
  return () => { window.removeEventListener('socle:theme', onTheme); closePop(); };
}
