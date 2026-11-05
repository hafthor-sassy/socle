/* Détail d'un design : scène d'aperçu, props, code, notes, navigation. */
import { getCategory } from '../../registry/categories.js';
import { loadIndex, loadMeta, loadCode, currentTheme } from '../lib/store.js';
import { icon } from '../lib/icons.js';
import { esc, fr, formatDate, bindCopy } from '../lib/dom.js';
import { demoURL, post, SANDBOX } from '../lib/frames.js';
import { highlight } from '../lib/highlight.js';
import { crumbs } from './category.js';

const WIDTHS = { mobile: 390, tablet: 768, desktop: 1280 };

function fmtVal(p, v) {
  if (p.type === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

function controlHTML(p, v) {
  const id = `p-${p.name}`;
  const hint = p.hint ? `<p class="prop__hint">${fr(p.hint)}</p>` : '';
  if (p.type === 'number') {
    return `<div class="prop">
      <div class="prop__top"><label for="${id}">${esc(p.label || p.name)}</label>
        <span class="numbox"><input id="${id}-n" type="number" inputmode="decimal" value="${v}" min="${p.min}" max="${p.max}" step="${p.step || 1}" data-prop="${p.name}" data-kind="num" aria-label="${esc(p.label || p.name)}, valeur">${p.unit ? `<span>${esc(p.unit)}</span>` : ''}</span></div>
      <input id="${id}" type="range" value="${v}" min="${p.min}" max="${p.max}" step="${p.step || 1}" data-prop="${p.name}" data-kind="range">
      ${hint}</div>`;
  }
  if (p.type === 'boolean') {
    return `<div class="prop"><div class="switch-row"><span class="label" id="${id}-l" style="font-size:var(--t-label);font-weight:500;color:var(--text-strong)">${esc(p.label || p.name)}</span>
      <button class="switch" type="button" role="switch" aria-checked="${!!v}" aria-labelledby="${id}-l" data-prop="${p.name}" data-kind="bool"></button></div>${hint}</div>`;
  }
  if (p.type === 'select') {
    const opts = p.options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }));
    if (opts.length <= 4) {
      return `<div class="prop"><div class="prop__top"><span class="label" id="${id}-l">${esc(p.label || p.name)}</span></div>
        <div class="seg ${opts.length === 4 ? 'seg--grid2' : ''}" role="radiogroup" aria-labelledby="${id}-l">${opts.map((o) => `<button type="button" role="radio" aria-checked="${String(o.value) === String(v)}" data-prop="${p.name}" data-kind="seg" data-value="${esc(o.value)}">${esc(o.label)}</button>`).join('')}</div>${hint}</div>`;
    }
    return `<div class="prop"><div class="prop__top"><label for="${id}">${esc(p.label || p.name)}</label></div>
      <select class="select" id="${id}" data-prop="${p.name}" data-kind="select">${opts.map((o) => `<option value="${esc(o.value)}" ${String(o.value) === String(v) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>${hint}</div>`;
  }
  return `<div class="prop"><div class="prop__top"><label for="${id}">${esc(p.label || p.name)}</label></div>
    <input class="input" id="${id}" type="text" value="${esc(v)}" data-prop="${p.name}" data-kind="text">${hint}</div>`;
}

export async function renderItem(view, id, onCat) {
  let meta;
  try { meta = await loadMeta(id); } catch (e) {
    view.innerHTML = `<div class="empty" style="margin-top:24px"><h1 class="t-section">Ce design n’existe pas</h1><p>Il a peut-être été renommé. Cherchez-le avec ⌘K.</p><a class="btn btn--secondary" href="#/">Vue d’ensemble</a></div>`;
    return;
  }
  const cat = getCategory(meta.categorie);
  if (onCat) onCat(meta.categorie);
  document.title = `${meta.nom} — Socle`;
  const { items } = await loadIndex();
  const siblings = items.filter((i) => i.categorie === meta.categorie).sort((a, b) => (b.date || '').localeCompare(a.date || '') || (a.ordre ?? 50) - (b.ordre ?? 50));
  const idx = siblings.findIndex((s) => s.id === meta.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const props = meta.props || [];
  const values = Object.fromEntries(props.map((p) => [p.name, p.default]));
  const narrow = matchMedia('(max-width: 767px)').matches;
  const state = { bg: currentTheme(), width: narrow ? 'mobile' : (meta.stage && meta.stage.width) || 'desktop', tab: 0, locked: false };
  const tabs = meta.code || [];
  const sources = await Promise.all(tabs.map((t) => loadCode(meta.id, t.file).catch(() => '/* Fichier introuvable */')));

  view.innerHTML = `
    ${crumbs([{ label: 'Bibliothèque', href: '#/' }, { label: cat ? cat.nom : meta.categorie, href: `#/c/${meta.categorie}` }, { label: meta.nom }])}
    <header class="dhead">
      <div class="dhead__tx">
        <h1 class="t-page">${esc(meta.nom)}</h1>
        <p>${fr(meta.description)}</p>
        <div class="phead__meta">${(meta.tags || []).map((t) => `<span class="badge">${esc(t)}</span>`).join('')}<span class="t-xs muted">Ajouté le ${formatDate(meta.date)}</span></div>
      </div>
      <a class="btn btn--secondary" href="${esc(demoURL(meta.id, { theme: currentTheme() }))}" target="_blank" rel="noopener">${icon('external', { size: 16 })}Ouvrir la démo</a>
    </header>

    <div class="workbench">
      <section class="stage" aria-label="Aperçu">
        <div class="stage__bar">
          <div class="grp">
            <div class="seg" role="radiogroup" aria-label="Fond de l’aperçu">
              <button type="button" role="radio" data-bg="light" aria-checked="false">Clair</button>
              <button type="button" role="radio" data-bg="dark" aria-checked="false">Sombre</button>
              <button type="button" role="radio" data-bg="grid" aria-checked="false">Quadrillé</button>
            </div>
          </div>
          <div class="grp">
            <div class="seg seg--icons" role="radiogroup" aria-label="Largeur de l’aperçu" data-widths>
              <button type="button" role="radio" data-w="mobile" aria-checked="false" aria-label="Mobile, 390 pixels">${icon('phone', { size: 16 })}<span class="lbl-wide">Mobile</span></button>
              <button type="button" role="radio" data-w="tablet" aria-checked="false" aria-label="Tablette, 768 pixels">${icon('tablet', { size: 16 })}<span class="lbl-wide">Tablette</span></button>
              <button type="button" role="radio" data-w="desktop" aria-checked="false" aria-label="Bureau">${icon('monitor', { size: 16 })}<span class="lbl-wide">Bureau</span></button>
            </div>
            <button class="icon-btn" type="button" data-replay aria-label="Rejouer l’animation">${icon('replay', { size: 18 })}</button>
            <button class="icon-btn" type="button" data-full aria-label="Plein écran">${icon('maximize', { size: 18 })}</button>
          </div>
        </div>
        <div class="stage__view" data-view>
          <div class="stage__frame" data-frame>
            <iframe data-demo data-theme-lock="1" title="Aperçu live de ${esc(meta.nom)}" sandbox="${SANDBOX}" src="${esc(demoURL(meta.id, { theme: state.bg === 'grid' ? currentTheme() : state.bg, bg: state.bg === 'grid' ? 'grid' : '', props: values }))}"></iframe>
          </div>
        </div>
        <div class="stage__foot"><span class="mono num" data-size></span><span class="lbl-wide">Aperçu isolé, au thème choisi</span></div>
      </section>

      ${props.length ? `<aside class="panel props" aria-labelledby="h-props">
        <div class="panel__head"><h2 id="h-props">Props</h2><button class="btn btn--ghost btn--sm" type="button" data-reset>Réinitialiser</button></div>
        <div class="panel__body" data-props>${props.map((p) => controlHTML(p, values[p.name])).join('')}</div>
      </aside>` : ''}
    </div>

    ${tabs.length ? `<section class="code" aria-label="Code">
      <div class="code__bar">
        <div class="seg" role="tablist" aria-label="Langage">${tabs.map((t, i) => `<button type="button" role="tab" id="tab-${i}" aria-controls="code-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-tab="${i}">${esc(t.label)}</button>`).join('')}</div>
        <div class="code__right"><span class="code__file" data-file></span>
          <button class="btn btn--secondary btn--sm copy-btn" type="button" data-copy>${icon('copy', { size: 16 })}<span data-lbl>Copier</span></button></div>
      </div>
      <div class="code__body" id="code-panel" role="tabpanel" aria-labelledby="tab-0"><pre tabindex="0"><code data-code></code></pre></div>
      <div class="code__more" data-more hidden><button class="btn btn--ghost btn--sm" type="button" data-expand>Afficher tout le code${icon('chevronDown', { size: 16 })}</button></div>
    </section>` : ''}

    <div class="facts">
      <section class="fact"><h3>${icon('package', { size: 18 })}Dépendances</h3>
        ${(meta.dependances || []).length ? `<ul>${meta.dependances.map((d) => `<li class="dep"><code>${esc(d.nom)}</code><span class="muted t-xs">${fr(d.note || '')}</span></li>`).join('')}</ul>` : '<p class="t-sm muted">Aucune : HTML et CSS seuls.</p>'}
      </section>
      <section class="fact"><h3>${icon('note', { size: 18 })}Notes d’usage</h3><ul>${(meta.usage || []).map((u) => `<li>${fr(u)}</li>`).join('')}</ul></section>
      <section class="fact"><h3>${icon('accessibility', { size: 18 })}Accessibilité</h3><ul>${(meta.accessibilite || []).map((u) => `<li>${fr(u)}</li>`).join('')}</ul></section>
    </div>

    ${prev || next ? `<nav class="pager" aria-label="Dans la catégorie">
      ${prev ? `<a class="prev" href="#/i/${esc(prev.id)}"><span>${icon('arrowLeft', { size: 14 })}Précédent</span><b>${esc(prev.nom)}</b></a>` : '<span></span>'}
      ${next ? `<a class="next" href="#/i/${esc(next.id)}"><span>Suivant${icon('arrowRight', { size: 14 })}</span><b>${esc(next.nom)}</b></a>` : ''}
    </nav>` : ''}
  `;

  /* ——— Scène ——— */
  const stage = view.querySelector('.stage');
  const vw = view.querySelector('[data-view]');
  const frame = view.querySelector('[data-frame]');
  const ifr = frame.querySelector('iframe');
  const sizeEl = view.querySelector('[data-size]');

  function layout() {
    const W = vw.clientWidth;
    const H = vw.clientHeight;
    const minDesk = (meta.stage && meta.stage.desktopMin) || 0;
    let target = state.width === 'desktop' ? Math.max(W, minDesk) : WIDTHS[state.width];
    const s = Math.min(1, W / target);
    frame.style.width = `${Math.round(target * s)}px`;
    frame.classList.toggle('is-device', state.width !== 'desktop' && target * s < W);
    ifr.style.width = `${target}px`;
    ifr.style.height = `${Math.round(H / s)}px`;
    ifr.style.transform = s < 1 ? `scale(${s})` : 'none';
    sizeEl.textContent = `${target} × ${Math.round(H / s)}${s < 1 ? ` · ${Math.round(s * 100)} %` : ''}`;
  }
  function syncSeg() {
    view.querySelectorAll('[data-bg]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.bg === state.bg)));
    view.querySelectorAll('[data-w]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.w === state.width)));
  }
  function sendTheme() {
    const theme = state.bg === 'grid' ? currentTheme() : state.bg;
    post(ifr, { type: 'theme', theme, bg: state.bg === 'grid' ? 'grid' : '' });
  }
  view.querySelectorAll('[data-bg]').forEach((b) => b.addEventListener('click', () => { state.bg = b.dataset.bg; state.locked = true; syncSeg(); sendTheme(); }));
  view.querySelectorAll('[data-w]').forEach((b) => b.addEventListener('click', () => { state.width = b.dataset.w; syncSeg(); layout(); }));
  view.querySelector('[data-replay]').addEventListener('click', () => post(ifr, { type: 'replay' }));
  const fullBtn = view.querySelector('[data-full]');
  function setFull(on) {
    stage.classList.toggle('is-full', on);
    document.body.style.overflow = on ? 'hidden' : '';
    fullBtn.innerHTML = icon(on ? 'minimize' : 'maximize', { size: 18 });
    fullBtn.setAttribute('aria-label', on ? 'Quitter le plein écran' : 'Plein écran');
    requestAnimationFrame(layout);
  }
  fullBtn.addEventListener('click', () => setFull(!stage.classList.contains('is-full')));
  const onKey = (e) => { if (e.key === 'Escape' && stage.classList.contains('is-full')) setFull(false); };
  document.addEventListener('keydown', onKey);
  const onTheme = (e) => { if (!state.locked && state.bg !== 'grid') { state.bg = e.detail; syncSeg(); } sendTheme(); };
  window.addEventListener('socle:theme', onTheme);
  const ro = new ResizeObserver(layout);
  ro.observe(vw);
  syncSeg();
  layout();

  /* ——— Props ——— */
  const codeEl = view.querySelector('[data-code]');
  function applyCode(text, tabId) {
    let out = text;
    props.forEach((p) => {
      if (!p.code) return;
      const raw = typeof p.code === 'string' || Array.isArray(p.code) ? p.code : p.code[tabId];
      if (!raw) return;
      [].concat(raw).forEach((pat) => {
        const def = pat.split('{v}').join(fmtVal(p, p.default));
        const cur = pat.split('{v}').join(fmtVal(p, values[p.name]));
        if (def !== cur) out = out.split(def).join(cur);
      });
    });
    return out;
  }
  function currentCode() { return tabs.length ? applyCode(sources[state.tab], tabs[state.tab].id) : ''; }
  function renderCode() {
    if (!tabs.length) return;
    const text = currentCode();
    codeEl.innerHTML = highlight(text, tabs[state.tab].lang);
    view.querySelector('[data-file]').textContent = tabs[state.tab].file.split('/').pop();
    const lines = text.split('\n').length;
    view.querySelector('[data-more]').hidden = lines <= 28 || view.querySelector('.code').classList.contains('is-open');
    view.querySelector('#code-panel').setAttribute('aria-labelledby', `tab-${state.tab}`);
  }
  function pushProps() { post(ifr, { type: 'props', props: values }); renderCode(); }

  const box = view.querySelector('[data-props]');
  if (box) {
    box.addEventListener('input', (e) => {
      const t = e.target;
      const name = t.dataset.prop;
      if (!name) return;
      const p = props.find((x) => x.name === name);
      if (t.dataset.kind === 'range' || t.dataset.kind === 'num') {
        let v = parseFloat(t.value);
        if (Number.isNaN(v)) return;
        v = Math.min(p.max, Math.max(p.min, v));
        values[name] = v;
        box.querySelectorAll(`[data-prop="${name}"]`).forEach((el) => { if (el !== t) el.value = v; });
      } else if (t.dataset.kind === 'select' || t.dataset.kind === 'text') {
        values[name] = t.value;
      }
      pushProps();
    });
    box.addEventListener('click', (e) => {
      const t = e.target.closest('[data-prop]');
      if (!t) return;
      const name = t.dataset.prop;
      if (t.dataset.kind === 'bool') {
        values[name] = !values[name];
        t.setAttribute('aria-checked', String(values[name]));
        pushProps();
      } else if (t.dataset.kind === 'seg') {
        values[name] = t.dataset.value;
        box.querySelectorAll(`[data-prop="${name}"][data-kind="seg"]`).forEach((b) => b.setAttribute('aria-checked', String(b === t)));
        pushProps();
      }
    });
    view.querySelector('[data-reset]').addEventListener('click', () => {
      props.forEach((p) => { values[p.name] = p.default; });
      box.innerHTML = props.map((p) => controlHTML(p, values[p.name])).join('');
      pushProps();
      post(ifr, { type: 'replay' });
    });
  }

  /* ——— Code ——— */
  if (tabs.length) {
    const tabBtns = [...view.querySelectorAll('[data-tab]')];
    const selectTab = (i, focus = false) => {
      state.tab = i;
      tabBtns.forEach((b, j) => { b.setAttribute('aria-selected', String(j === i)); b.tabIndex = j === i ? 0 : -1; });
      if (focus) tabBtns[i].focus();
      renderCode();
    };
    tabBtns.forEach((b, i) => {
      b.addEventListener('click', () => selectTab(i));
      b.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); selectTab((i + 1) % tabBtns.length, true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); selectTab((i - 1 + tabBtns.length) % tabBtns.length, true); }
      });
    });
    bindCopy(view.querySelector('[data-copy]'), currentCode, { toastMsg: 'Code copié' });
    view.querySelector('[data-expand]').addEventListener('click', () => { view.querySelector('.code').classList.add('is-open'); view.querySelector('[data-more]').hidden = true; });
    renderCode();
  }

  return () => {
    ro.disconnect();
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('socle:theme', onTheme);
    document.body.style.overflow = '';
  };
}
