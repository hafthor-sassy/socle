/* Fondations : Couleurs, Typographie, Espacements, Icônes — alimentées par le design system. */
import { CATEGORIES } from '../../registry/categories.js';
import { icon, rawIcon, UI_ICONS } from '../lib/icons.js';
import { esc, fr, copyText, toast } from '../lib/dom.js';
import { currentTheme } from '../lib/store.js';
import { crumbs } from './category.js';

/* ——— Contraste WCAG ——— */
function lum(hex) {
  const h = hex.replace('#', '');
  const v = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
export function contrast(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
const ratio = (r) => `${r.toFixed(2).replace('.', ',')}:1`;
const grade = (r, min = 4.5) => (r >= 7 ? 'AAA' : r >= min ? 'AA' : r >= 3 ? 'AA grand' : 'Échec');

/* ——— Lecture de tokens.css ——— */
let tokensP = null;
function tokens() {
  if (!tokensP) {
    tokensP = fetch('css/tokens.css').then((r) => r.text()).then((css) => {
      const block = (re) => { const m = css.match(re); return m ? m[1] : ''; };
      const parse = (s) => Object.fromEntries([...s.matchAll(/--([\w-]+):([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
      return { light: parse(block(/:root\{([^}]*--bg:[^}]*)\}/)), dark: parse(block(/\n\.dark\{([^}]*--bg:[^}]*)\}/)), all: parse(block(/:root\{([^}]*--font-sans[^}]*)\}/)) };
    });
  }
  return tokensP;
}
let palP = null;
const palettes = () => (palP ||= fetch('data/palettes.json').then((r) => r.json()));

function head(cat, extra = '') {
  return `${crumbs([{ label: 'Bibliothèque', href: '#/' }, { label: 'Fondations', href: '#/' }, { label: cat.nom }])}
  <header class="phead">
    <div class="phead__title"><span class="tile">${rawIcon(cat.icon, { size: 22 })}</span><h1 class="t-page">${esc(cat.nom)}</h1></div>
    <p>${fr(cat.description)}</p>${extra}
  </header>`;
}

const swatch = (hex) => `<button class="chipcolor" type="button" data-hex="${esc(hex)}" aria-label="Copier ${esc(hex)}"><i style="background:${esc(hex)}"></i>${esc(hex)}</button>`;

function bindHex(view) {
  if (view.dataset.hexBound) return;
  view.dataset.hexBound = '1';
  view.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-hex]');
    if (!b) return;
    const ok = await copyText(b.dataset.hex);
    toast(ok ? `${b.dataset.hex} copié` : 'Copie impossible');
  });
}

/* ——— Couleurs ——— */
async function couleurs(view, cat) {
  const [t, pals] = await Promise.all([tokens(), palettes()]);
  const L = t.light; const D = t.dark;
  const NEUTRES = [
    ['bg', 'Fond de page'], ['surface', 'Carte'], ['raised', 'Surface élevée'], ['border', 'Séparateur décoratif'], ['border-control', 'Contour de champ et contrôle'],
    ['text-strong', 'Titres'], ['text', 'Texte courant'], ['text-muted', 'Texte secondaire'], ['text-disabled', 'Désactivé'],
  ];
  const SEM = [['up', 'Hausse, succès'], ['down', 'Baisse, erreur'], ['warn', 'Avertissement'], ['info', 'Information']];
  const isText = (k) => k.startsWith('text') || k === 'border-control' || SEM.some((s) => s[0] === k);
  const row = ([k, role]) => {
    const rl = isText(k) ? contrast(L[k], L.surface) : null;
    const rd = isText(k) ? contrast(D[k], D.surface) : null;
    const min = k.startsWith('border') ? 3 : 4.5;
    const exempt = k === 'text-disabled';
    const fmt = (r) => (r == null ? '<span class="muted">—</span>' : `<span class="ratio">${ratio(r)}</span> ${exempt ? '<span class="badge">Exempté</span>' : `<span class="badge ${r >= min ? 'badge--green' : 'badge--red'}">${grade(r, min)}</span>`}`);
    return `<tr><td><code>--${k}</code></td><td class="muted">${esc(role)}</td><td>${swatch(L[k])}</td><td>${fmt(rl)}</td><td>${swatch(D[k])}</td><td>${fmt(rd)}</td></tr>`;
  };
  const th = '<tr><th>Variable</th><th>Rôle</th><th>Clair</th><th>Contraste sur carte</th><th>Sombre</th><th>Contraste sur carte</th></tr>';

  const theme = currentTheme();
  const palCard = (p) => {
    const c = theme === 'dark' ? p.sombre : p.clair;
    const k = p.controle || {};
    const surf = theme === 'dark' ? D.surface : L.surface;
    const rAcc = contrast(c.accent, surf);
    const rFg = contrast(c.texte_sur_accent, c.accent);
    const rDoux = contrast(c.accent, c.doux);
    const isBrand = p.id === 'terracotta';
    return `<article class="pal" data-accent="${esc(p.id)}">
      <div class="pal__strip">
        <button type="button" data-hex="${esc(c.accent)}" style="background:${esc(c.accent)}" aria-label="Copier l’accent ${esc(c.accent)}"></button>
        <button type="button" data-hex="${esc(c.vif)}" style="background:${esc(c.vif)}" aria-label="Copier le vif ${esc(c.vif)}"></button>
        <button type="button" data-hex="${esc(c.doux)}" style="background:${esc(c.doux)}" aria-label="Copier le doux ${esc(c.doux)}"></button>
      </div>
      <div class="pal__body">
        <div class="pal__name"><b>${esc(p.nom)}</b>${isBrand ? '<span class="badge badge--accent">Socle</span>' : `<span class="t-xs muted mono">${esc(c.accent)}</span>`}</div>
        <div class="pal__rows">
          <div class="pal__row"><span>Accent sur carte</span><span class="ratio">${ratio(rAcc)}</span></div>
          <div class="pal__row"><span>Texte sur accent</span><span class="ratio">${ratio(rFg)}</span></div>
          <div class="pal__row"><span>Accent sur doux</span><span class="ratio">${ratio(rDoux)}</span></div>
        </div>
        <div class="pal__demo"><span class="btn btn--primary" aria-hidden="true">Action</span><span class="badge badge--accent">Actif</span></div>
      </div>
    </article>`;
  };

  view.innerHTML = `${head(cat)}
    <section class="sec" aria-labelledby="h-neutres">
      <h2 id="h-neutres" class="t-section">Neutres</h2>
      <p class="sub">${fr('90 % de l’écran. Le sombre utilise trois surfaces, jamais un bloc noir. Contrastes mesurés sur --surface.')}</p>
      <div class="tokens"><div class="tokens__scroll"><table><thead>${th}</thead><tbody>${NEUTRES.map(row).join('')}</tbody></table></div></div>
    </section>
    <section class="sec" aria-labelledby="h-sem">
      <h2 id="h-sem" class="t-section">Sémantiques</h2>
      <p class="sub">${fr('Toujours doublées d’un libellé ou d’une icône : la couleur ne porte jamais seule l’information.')}</p>
      <div class="tokens"><div class="tokens__scroll"><table><thead>${th}</thead><tbody>${SEM.map(row).join('')}</tbody></table></div></div>
    </section>
    <section class="sec" aria-labelledby="h-pal">
      <h2 id="h-pal" class="t-section">Palettes d’accent</h2>
      <p class="sub">${fr(`${pals.length} palettes calculées en OKLCH : même poids perçu d’une teinte à l’autre. Accent, vif, doux, en thème ${theme === 'dark' ? 'sombre' : 'clair'}. Cliquez une teinte pour copier son code.`)}</p>
      <div class="pal-grid">${pals.map(palCard).join('')}</div>
    </section>`;
  bindHex(view);
  if (!view.dataset.themeBound) {
    view.dataset.themeBound = '1';
    const onTheme = () => { if (view.isConnected) couleurs(view, cat); };
    window.addEventListener('socle:theme', onTheme);
    return () => window.removeEventListener('socle:theme', onTheme);
  }
}

/* ——— Typographie ——— */
async function typographie(view, cat) {
  const t = await tokens();
  const A = t.all;
  const SCALE = [
    ['Display', 'clamp(2rem, 1.55rem + 1.9vw, 3rem)', '1,08', '600', 't-display', 'Des fondations solides.'],
    ['Titre de page', A['t-page'], A['t-page-lh'], '600', 't-page', 'Bibliothèque de design'],
    ['KPI', A['t-kpi'], A['t-kpi-lh'], '600', '', '12\u00A0480\u00A0€'],
    ['Section', A['t-section'], A['t-section-lh'], '600', 't-section', 'Derniers ajouts'],
    ['Corps', A['t-base'], A['t-base-lh'], '400', '', 'Le texte courant, 16\u00A0px sur mobile comme sur PC, interligne 24\u00A0px.'],
    ['Secondaire', A['t-sm'], A['t-sm-lh'], '400', 't-sm', 'Texte d’aide, métadonnées et descriptions de carte.'],
    ['Libellé', A['t-label'], A['t-label-lh'], '500', '', 'Libellé de champ'],
    ['Légende', A['t-xs'], A['t-xs-lh'], '400', 't-xs', 'Ajouté le 5 nov. 2026'],
  ];
  const style = (row) => {
    if (row[4]) return '';
    if (row[0] === 'KPI') return 'font-size:var(--t-kpi);line-height:var(--t-kpi-lh);font-weight:600;letter-spacing:var(--track-tight);font-variant-numeric:tabular-nums';
    if (row[0] === 'Libellé') return 'font-size:var(--t-label);line-height:var(--t-label-lh);font-weight:500';
    return '';
  };
  view.innerHTML = `${head(cat)}
    <section class="sec" aria-labelledby="h-fam">
      <h2 id="h-fam" class="t-section">Familles</h2>
      <p class="sub">${fr('Auto-hébergées en woff2 variable (100 à 900), font-display : swap, pile de secours système.')}</p>
      <div class="specimens">
        <div class="specimen"><span class="eyebrow">Geist · interface</span><span class="big">Aa</span>
          <div class="weights"><span style="font-weight:400">Regular</span><span style="font-weight:500">Medium</span><span style="font-weight:600">SemiBold</span><span style="font-weight:700">Bold</span></div>
          <p class="t-sm muted">ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>abcdefghijklmnopqrstuvwxyz · 0123456789 · éèàçœ «\u202F»</p></div>
        <div class="specimen"><span class="eyebrow">Geist Mono · code et valeurs</span><span class="big mono" style="font-family:var(--font-mono)">{ }</span>
          <div class="weights mono" style="font-family:var(--font-mono)"><span style="font-weight:400">Regular</span><span style="font-weight:500">Medium</span><span style="font-weight:600">SemiBold</span></div>
          <p class="t-sm muted mono" style="font-family:var(--font-mono)">#AB4E31 · 4,5:1 · 120ms · --space-4</p></div>
      </div>
    </section>
    <section class="sec" aria-labelledby="h-scale">
      <h2 id="h-scale" class="t-section">Échelle</h2>
      <p class="sub">${fr('Fluide avec clamp() : pas de saut brutal à 768 px. Approche optique −0,02 em sur les titres, −0,01 em sur les sections.')}</p>
      <div>${SCALE.map((r) => `<div class="type-row"><div class="spec"><b>${esc(r[0])}</b><span>${esc(r[1])}</span><span>interligne ${esc(r[2])} · ${esc(r[3])}</span></div><div class="sample ${r[4]}" style="${style(r)}">${esc(r[5])}</div></div>`).join('')}</div>
    </section>
    <section class="sec" aria-labelledby="h-rules">
      <h2 id="h-rules" class="t-section">Texte et nombres</h2>
      <p class="sub">${fr('Les règles appliquées partout dans Socle.')}</p>
      <div class="rules">
        <div class="rule"><b>Jamais de mot coupé</b>2 lignes maximum pour un nom, puis «\u202F…\u202F» avec infobulle.</div>
        <div class="rule"><b>Nombre et unité liés</b>Espace insécable : 20\u00A0k€, 42\u00A0%, 16\u00A0px.</div>
        <div class="rule"><b>Chiffres tabulaires</b>Partout où l’on compare des valeurs : tableaux, prix, KPI.</div>
        <div class="rule"><b>Typographie française</b>Espace fine insécable avant ;\u202F:\u202F!\u202F? et dans les guillemets «\u202F»</div>
        <div class="rule"><b>Champs à 16\u00A0px minimum</b>Safari zoome la page dès qu’un champ est plus petit.</div>
        <div class="rule"><b>Retours à la ligne propres</b>text-wrap : balance sur les titres, pretty sur les paragraphes.</div>
      </div>
    </section>`;
}

/* ——— Espacements ——— */
async function espacements(view, cat) {
  const t = await tokens();
  const A = t.all;
  const SP = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16];
  const R = [['Contrôle', 'radius-ctl', 'Boutons, champs'], ['Carte', 'radius-card', 'Cartes, aperçus'], ['Feuille', 'radius-sheet', 'Tiroirs, dialogues'], ['Pastille', 'radius-pill', 'Badges, pastilles']];
  view.innerHTML = `${head(cat)}
    <section class="sec" aria-labelledby="h-grid">
      <h2 id="h-grid" class="t-section">Grille de 8\u00A0px</h2>
      <p class="sub">${fr('Toutes les tailles, marges et hauteurs tombent sur la grille ; 4 px pour les ajustements fins.')}</p>
      <div class="grid8" aria-hidden="true">
        <div class="blk" style="left:16px;top:16px;width:160px;height:64px">160 × 64</div>
        <div class="blk" style="left:192px;top:16px;width:96px;height:64px">96 × 64</div>
        <div class="blk" style="left:16px;top:96px;width:272px;height:88px">272 × 88</div>
        <div class="blk" style="left:304px;top:16px;width:120px;height:168px">120 × 168</div>
      </div>
    </section>
    <section class="sec" aria-labelledby="h-space">
      <h2 id="h-space" class="t-section">Espacements nommés</h2>
      <p class="sub">${fr('De --space-1 à --space-16, au lieu de multiplications improvisées.')}</p>
      <div class="tokens" style="padding:0 16px"><div class="space-list">${SP.map((n) => `<div class="space-row"><code>--space-${n}</code><span class="v">${esc(A['space-' + n] || '')}</span><span><span class="bar-v" style="display:block;width:var(--space-${n})"></span></span></div>`).join('')}</div></div>
    </section>
    <section class="sec" aria-labelledby="h-radius">
      <h2 id="h-radius" class="t-section">Rayons</h2>
      <p class="sub">${fr('Quatre rayons seulement : 8, 12, 16 et 999 px.')}</p>
      <div class="radii">${R.map(([n, k, u]) => `<div class="radius"><div class="shape" style="border-radius:var(--${k})"></div><div><b>${esc(n)}</b><span>--${k} · ${esc(A[k] || '')}</span><p class="t-xs muted">${esc(u)}</p></div></div>`).join('')}</div>
    </section>
    <section class="sec" aria-labelledby="h-ctl">
      <h2 id="h-ctl" class="t-section">Hauteurs et repères</h2>
      <p class="sub">${fr('Cibles tactiles de 44 px sur mobile, contrôles de 36 px sur PC, 32 px pour une action secondaire.')}</p>
      <div class="tokens"><div class="tokens__scroll"><table><thead><tr><th>Variable</th><th>Usage</th><th class="r">Valeur</th></tr></thead><tbody>
        ${[['ctl-h', 'Contrôle sur mobile'], ['ctl-h-desktop', 'Contrôle sur PC'], ['ctl-h-min', 'Action secondaire sur PC'], ['row-h', 'Ligne de liste'], ['icon-sm', 'Icône petite'], ['icon-md', 'Icône standard'], ['icon-lg', 'Icône grande'], ['focus-width', 'Anneau de focus'], ['motion-fast', 'Survol, appui'], ['motion-base', 'Ouverture'], ['motion-slow', 'Panneaux']]
          .map(([k, u]) => `<tr><td><code>--${k}</code></td><td class="muted">${esc(u)}</td><td class="r"><span class="ratio">${esc(A[k] || '')}</span></td></tr>`).join('')}
      </tbody></table></div></div>
    </section>
    <section class="sec" aria-labelledby="h-bp">
      <h2 id="h-bp" class="t-section">Points de rupture</h2>
      <div class="tokens"><div class="tokens__scroll"><table><thead><tr><th>Largeur</th><th>Comportement</th></tr></thead><tbody>
        <tr><td><span class="ratio">&lt; 768\u00A0px</span></td><td class="muted">Mobile : marges 16 px, cibles 44 px, filtres en feuille plein écran</td></tr>
        <tr><td><span class="ratio">≥ 768\u00A0px</span></td><td class="muted">Tablette et PC : marges 24 px, contrôles 36 px</td></tr>
        <tr><td><span class="ratio">≥ 1\u00A0024\u00A0px</span></td><td class="muted">Navigation latérale visible</td></tr>
        <tr><td><span class="ratio">≥ 1\u00A0280\u00A0px</span></td><td class="muted">Contenu centré à 1 280 px, marges 32 px, panneau de props à droite</td></tr>
      </tbody></table></div></div>
    </section>`;
}

/* ——— Icônes ——— */
function iconSVG(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}
async function icones(view, cat) {
  const ui = Object.entries(UI_ICONS).filter(([k]) => k !== 'squareFill');
  view.innerHTML = `${head(cat)}
    <section class="sec" aria-labelledby="h-cat-ic">
      <h2 id="h-cat-ic" class="t-section">Catégories</h2>
      <p class="sub">${fr('24 × 24, trait de 1,5 px, extrémités arrondies. Cliquez pour copier le SVG.')}</p>
      <div class="icon-grid">${CATEGORIES.map((c) => `<button class="icon-cell" type="button" data-svg="${esc(c.icon)}" aria-label="Copier l’icône ${esc(c.nom)}">${rawIcon(c.icon, { size: 24 })}<span>${esc(c.nom)}</span></button>`).join('')}</div>
    </section>
    <section class="sec" aria-labelledby="h-ui-ic">
      <h2 id="h-ui-ic" class="t-section">Interface</h2>
      <p class="sub">${fr('Tailles 16, 20 et 24 px, alignées sur la ligne de texte ; libellé accessible si l’icône est seule.')}</p>
      <div class="icon-grid">${ui.map(([k, b]) => `<button class="icon-cell" type="button" data-svg="${esc(b)}" aria-label="Copier l’icône ${esc(k)}">${rawIcon(b, { size: 24 })}<span class="mono">${esc(k)}</span></button>`).join('')}</div>
    </section>`;
  view.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-svg]');
    if (!b) return;
    const ok = await copyText(iconSVG(b.dataset.svg));
    toast(ok ? 'SVG copié' : 'Copie impossible');
  });
}

export function renderFoundation(view, cat) {
  const map = { couleurs, typographie, espacements, icones };
  const fn = map[cat.page];
  if (!fn) { view.innerHTML = head(cat); return; }
  return fn(view, cat);
}
