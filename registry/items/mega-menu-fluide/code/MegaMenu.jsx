// Méga-menu fluide — React + Tailwind CSS. Couleurs : variables de tokens.css. Marque (Sillage) et contenus fictifs.
// Aucune dépendance en plus de React : le moteur (ressorts, glissement, clavier, tiroir à niveaux) est le même que
// dans l'onglet HTML ; il est monté sur le <header> par un useEffect et démonté proprement.
import { useEffect, useRef } from 'react';

/**
 * @typedef {Object} MegaMenuProps
 * @property {string}  [brand]        Nom affiché à côté du logo
 * @property {string}  [cta]          Libellé du bouton d'action
 * @property {'none'|'produit'|'solutions'|'ressources'} [defaultOpen] Panneau ouvert au montage (bureau)
 * @property {boolean} [openOnHover]  Ouvrir au survol de la souris (le clic et le clavier marchent toujours)
 * @property {boolean} [arrow]        Flèche qui pointe l'entrée active
 * @property {boolean} [pill]         Pastille de fond qui glisse d'une entrée à l'autre
 * @property {number}  [stiffness]    Raideur du ressort
 * @property {number}  [damping]      Amortissement du ressort
 * @property {number}  [slide]        Glissement du contenu en px
 * @property {number}  [openDelay]    Délai d'intention à l'ouverture (ms)
 * @property {number}  [closeDelay]   Délai de grâce à la fermeture (ms)
 * @property {(panel: string) => void} [onOpen]
 */

const PRODUIT = [
  ['Agents vocaux', 'Décrochent, qualifient, prennent rendez-vous.', <><path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>],
  ['Standard intelligent', 'Routage par intention, horaires, débordement.', <><path d="M4 6h10M4 12h16M4 18h7" /><path d="M17 4l3 2-3 2" /></>],
  ['Transcriptions', 'Chaque appel résumé, classé, retrouvable.', <><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 13h7M9 17h5" /></>],
  ['Analytique', 'Volumes, conversion et pics d’activité.', <path d="M4 20h16M7 16v-5M12 16V7M17 16v-8" />],
  ['Intégrations', 'Agenda, CRM, Slack : plus de 40 connecteurs.', <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><path d="M17.5 14v7M14 17.5h7" /></>],
  ['API et webhooks', 'Branchez Sillage à votre propre produit.', <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14" />],
];
const METIER = [['Cabinets médicaux', 'Rendez-vous et rappels'], ['Agences immobilières', 'Visites et qualification'], ['Artisans et dépannage', 'Urgences 24 h/24'], ['Restaurants', 'Réservations et commandes']];
const EQUIPE = [['Accueil et secrétariat', 'Zéro appel manqué'], ['Ventes', 'Leads qualifiés à chaud'], ['Support client', 'Réponses de niveau 1']];
const RESSOURCES = [
  ['Documentation', 'Guides d’installation et référence de l’API', <><path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4z" /><path d="M9 9h6M9 13h4" /></>],
  ['Blog', 'Retours de terrain et nouveautés', <><path d="M4 5h16v11H8l-4 4z" /><path d="M8 9.5h8M8 12.5h5" /></>],
  ['Communauté', 'Entraide entre utilisateurs', <><circle cx="9" cy="8" r="3.5" /><circle cx="17" cy="9.5" r="2.5" /><path d="M3 19a6 6 0 0 1 12 0M15 19a4 4 0 0 1 6-3.5" /></>],
  ['Statut du service', null, <path d="M3 12h4l3-7 4 14 3-7h4" />],
];
const WAVE = [38, 62, 48, 80, 56, 92, 70, 100, 64, 84, 52, 74, 96, 60, 44, 68, 36, 50];

function createMegaMenu() {
  var REDUCE = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LINEAR_OK = window.CSS && CSS.supports && CSS.supports('transition-timing-function', 'linear(0, 1)');

  /* Ressort critique ou sous-amorti, intégré à pas fixe : garde la vitesse quand la cible change en route. */
  function Spring(v) { this.x = v; this.v = 0; this.t = v; }
  Spring.prototype.set = function (t, instant) { this.t = t; if (instant) { this.x = t; this.v = 0; } };
  Spring.prototype.step = function (dt, k, c) {
    var h = 1 / 240;
    for (var s = 0; s < dt; s += h) { var a = -k * (this.x - this.t) - c * this.v; this.v += a * h; this.x += this.v * h; }
    if (Math.abs(this.x - this.t) < 0.05 && Math.abs(this.v) < 0.05) { this.x = this.t; this.v = 0; return false; }
    return true;
  };
  function springCss(k, c) {
    if (!LINEAR_OK) return { css: 'cubic-bezier(.32, 1.25, .5, 1)', dur: 420 };
    var sp = new Spring(0), pts = [0], t = 0; sp.set(1);
    while (t < 2.5) { var moving = sp.step(1 / 120, k, c); t += 1 / 120; pts.push(sp.x); if (!moving) break; }
    var out = [], n = pts.length - 1;
    for (var j = 0; j <= 40; j++) out.push(pts[Math.round(j / 40 * n)].toFixed(3));
    return { css: 'linear(' + out.join(', ') + ')', dur: Math.round(t * 1000) };
  }

  function mount(root) {
    if (root._mega) root._mega.destroy();
    var d = root.dataset;
    var o = {
      k: parseFloat(d.stiffness) || 320, c: parseFloat(d.damping) || 30, slide: d.slide != null ? parseFloat(d.slide) : 24,
      openDelay: d.openDelay != null ? parseFloat(d.openDelay) : 80, closeDelay: d.closeDelay != null ? parseFloat(d.closeDelay) : 220,
      hover: d.hover !== 'false',
    };
    var inner = root.querySelector('[data-mm-in]'), list = root.querySelector('[data-mm-list]'), pill = root.querySelector('[data-mm-pill]');
    var pos = root.querySelector('[data-mm-pos]'), vp = root.querySelector('[data-mm-viewport]'), arrow = root.querySelector('[data-mm-arrow]');
    var triggers = Array.prototype.slice.call(root.querySelectorAll('[data-mm-trigger]'));
    var tops = Array.prototype.slice.call(list.querySelectorAll('[data-mm-top]'));
    var panels = {}; root.querySelectorAll('[data-mm-panel]').forEach(function (p) { panels[p.dataset.mmPanel] = p; });
    var sc = springCss(o.k, o.c);
    root.style.setProperty('--mm-spring', sc.css); root.style.setProperty('--mm-dur', Math.min(700, sc.dur) + 'ms');

    var S = { x: new Spring(0), w: new Spring(0), h: new Spring(0), ax: new Spring(0), px: new Spring(0), pw: new Spring(0) };
    var cur = null, raf = 0, last = 0, openT = 0, closeT = 0, shown = false, dead = false, vpAnim = null;
    var listeners = [];
    function on(el, ev, fn, opt) { el.addEventListener(ev, fn, opt); listeners.push([el, ev, fn, opt]); }

    function rel(el) { var a = el.getBoundingClientRect(), b = inner.getBoundingClientRect(); return { l: a.left - b.left, w: a.width, c: a.left - b.left + a.width / 2 }; }
    function measure(p) { var was = p.hidden; p.hidden = false; var r = { w: p.offsetWidth, h: p.offsetHeight }; p.hidden = was; return r; }
    function frame(now) {
      raf = 0; if (dead) return;
      var dt = Math.min(0.05, (now - last) / 1000); last = now; var moving = false;
      for (var key in S) moving = S[key].step(dt, o.k, o.c) || moving;
      paint();
      if (moving) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
    function paint() {
      vp.style.width = Math.max(0, S.w.x).toFixed(2) + 'px'; vp.style.height = Math.max(0, S.h.x).toFixed(2) + 'px';
      pos.style.transform = 'translateX(' + S.x.x.toFixed(2) + 'px)';
      arrow.style.transform = 'translateX(' + (S.ax.x - S.x.x).toFixed(2) + 'px) rotate(45deg)';
      pill.style.transform = 'translateX(' + S.px.x.toFixed(2) + 'px)'; pill.style.width = Math.max(0, S.pw.x).toFixed(2) + 'px';
    }
    function pillTo(el, instant) {
      if (!el) { pill.classList.remove('is-on'); return; }
      var r = rel(el), lr = rel(list), first = !pill.classList.contains('is-on');
      S.px.set(r.l - lr.l, instant || first || REDUCE); S.pw.set(r.w, instant || first || REDUCE); pill.classList.add('is-on'); kick();
    }
    function target(name, instant) {
      var t = root.querySelector('[data-mm-trigger="' + name + '"]'), m = measure(panels[name]), r = rel(t), W = inner.clientWidth;
      var x = Math.max(8, Math.min(W - m.w - 8, r.c - m.w / 2));
      var snap = instant || REDUCE;
      S.x.set(x, snap); S.w.set(m.w, snap); S.h.set(m.h, snap); S.ax.set(r.c, snap); kick();
    }
    function slide(fromName, toName) {
      var a = panels[fromName], b = panels[toName];
      var dir = triggers.findIndex(function (t) { return t.dataset.mmTrigger === toName; }) > triggers.findIndex(function (t) { return t.dataset.mmTrigger === fromName; }) ? 1 : -1;
      b.hidden = false;
      if (REDUCE || !b.animate) { a.hidden = true; return; }
      var D = o.slide;
      a.getAnimations().forEach(function (x) { x.cancel(); }); b.getAnimations().forEach(function (x) { x.cancel(); });
      var out = a.animate([{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(' + (-dir * D) + 'px)', opacity: 0 }], { duration: 180, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' });
      out.onfinish = function () { if (cur !== fromName) { a.hidden = true; } out.cancel(); };
      b.animate([{ transform: 'translateX(' + (dir * D) + 'px)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }], { duration: 300, delay: 40, easing: 'cubic-bezier(.2, 0, 0, 1)', fill: 'backwards' });
    }
    function showVp(on) {
      if (on === shown) return; shown = on;
      if (vpAnim) vpAnim.cancel();
      var kf = [{ opacity: 0, transform: 'translateY(-6px) scale(.97)' }, { opacity: 1, transform: 'none' }];
      if (REDUCE || !vp.animate) { vp.style.opacity = on ? 1 : 0; arrow.style.opacity = on ? 1 : 0; return; }
      vp.style.opacity = 1;
      vpAnim = vp.animate(on ? kf : kf.slice().reverse(), { duration: on ? 220 : 160, easing: on ? 'cubic-bezier(.2, 0, 0, 1)' : 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' });
      arrow.animate([{ opacity: on ? 0 : 1 }, { opacity: on ? 1 : 0 }], { duration: on ? 220 : 140, fill: 'forwards' });
      if (!on) vpAnim.onfinish = function () { if (!shown) { vp.style.opacity = 0; Object.keys(panels).forEach(function (n) { panels[n].hidden = true; }); } };
    }
    function open(name, opts) {
      opts = opts || {};
      clearTimeout(openT); clearTimeout(closeT);
      if (cur === name) return;
      var prev = cur; cur = name;
      triggers.forEach(function (t) { t.setAttribute('aria-expanded', String(t.dataset.mmTrigger === name)); });
      root.classList.add('is-open');
      if (prev && shown) { target(name); slide(prev, name); }
      else { Object.keys(panels).forEach(function (n) { panels[n].hidden = n !== name; panels[n].getAnimations && panels[n].getAnimations().forEach(function (x) { x.cancel(); }); }); target(name, true); showVp(true); }
      pillTo(root.querySelector('[data-mm-trigger="' + name + '"]'));
      root.dispatchEvent(new CustomEvent('megamenu:open', { detail: { panel: name } }));
    }
    function close(focusBack) {
      clearTimeout(openT); clearTimeout(closeT);
      if (!cur) return;
      var t = root.querySelector('[data-mm-trigger="' + cur + '"]');
      triggers.forEach(function (x) { x.setAttribute('aria-expanded', 'false'); });
      cur = null; root.classList.remove('is-open'); showVp(false);
      if (!list.matches(':hover')) pillTo(null);
      if (focusBack && t) t.focus();
    }
    function links(name) { return Array.prototype.slice.call(panels[name].querySelectorAll('a[href]')); }

    /* Survol */
    triggers.forEach(function (t) {
      on(t, 'pointerenter', function (e) {
        if (e.pointerType !== 'mouse' || !o.hover) return;
        clearTimeout(openT); clearTimeout(closeT);
        var n = t.dataset.mmTrigger;
        openT = setTimeout(function () { open(n); }, cur ? 40 : o.openDelay);
      });
      on(t, 'pointerleave', function () { clearTimeout(openT); });
      on(t, 'click', function () { if (cur === t.dataset.mmTrigger) close(); else open(t.dataset.mmTrigger); });
    });
    tops.forEach(function (el) { on(el, 'pointerenter', function (e) { if (e.pointerType === 'mouse') { pillTo(el); if (cur && !el.dataset.mmTrigger && o.hover) { clearTimeout(closeT); closeT = setTimeout(function () { close(); }, 120); } } }); });
    on(list, 'pointerleave', function () { if (!cur) pillTo(null); else pillTo(root.querySelector('[data-mm-trigger="' + cur + '"]')); });
    on(root, 'pointerleave', function (e) { if (e.pointerType !== 'mouse' || !o.hover) return; clearTimeout(openT); closeT = setTimeout(function () { close(); }, o.closeDelay); });
    on(root, 'pointerenter', function () { clearTimeout(closeT); });
    on(pos, 'pointerenter', function () { clearTimeout(closeT); });
    on(document, 'pointerdown', function (e) { if (cur && !root.contains(e.target)) close(); });

    /* Clavier */
    on(list, 'keydown', function (e) {
      var i = tops.indexOf(e.target); if (i < 0) return;
      var n = e.target.dataset.mmTrigger, go = null;
      if (e.key === 'ArrowRight') go = tops[(i + 1) % tops.length];
      else if (e.key === 'ArrowLeft') go = tops[(i - 1 + tops.length) % tops.length];
      else if (e.key === 'Home') go = tops[0];
      else if (e.key === 'End') go = tops[tops.length - 1];
      if (go) { e.preventDefault(); go.focus(); pillTo(go); if (cur) { if (go.dataset.mmTrigger) open(go.dataset.mmTrigger); else close(); } return; }
      if (n && e.key === 'ArrowDown') { e.preventDefault(); open(n); var L = links(n); if (L[0]) setTimeout(function () { L[0].focus(); }, 0); return; }
      if (n && e.key === 'Tab' && !e.shiftKey && cur === n) { var L2 = links(n); if (L2[0]) { e.preventDefault(); L2[0].focus(); } }
    });
    on(pos, 'keydown', function (e) {
      if (!cur) return; var L = links(cur), i = L.indexOf(document.activeElement); if (i < 0) return;
      var t = root.querySelector('[data-mm-trigger="' + cur + '"]');
      if (e.key === 'ArrowDown') { e.preventDefault(); L[(i + 1) % L.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (i === 0) t.focus(); else L[i - 1].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); L[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); L[L.length - 1].focus(); }
      else if (e.key === 'Tab' && e.shiftKey && i === 0) { e.preventDefault(); t.focus(); }
      else if (e.key === 'Tab' && !e.shiftKey && i === L.length - 1) { e.preventDefault(); var nx = tops[tops.indexOf(t) + 1]; close(); (nx || root.querySelector('[data-mm-signin]')).focus(); }
    });
    on(root, 'keydown', function (e) { if (e.key === 'Escape' && cur) { e.preventDefault(); close(true); } });
    on(root, 'focusout', function (e) { if (cur && e.relatedTarget && !root.contains(e.relatedTarget)) close(); });
    on(window, 'resize', function () { if (cur) target(cur, true); pillTo(cur ? root.querySelector('[data-mm-trigger="' + cur + '"]') : null, true); if (window.innerWidth >= 960 && drawer && !drawer.hidden) closeDrawer(false); });

    /* ——— Tiroir mobile à niveaux ——— */
    var burger = root.querySelector('[data-mm-burger]'), drawer = root.querySelector('[data-mm-drawer]'), sheet = root.querySelector('[data-mm-sheet]');
    var levels = {}; root.querySelectorAll('[data-mm-level]').forEach(function (l) { levels[l.dataset.mmLevel] = l; });
    var stack = ['root'], hideT = 0;
    function setLevels(dir) {
      Object.keys(levels).forEach(function (k) {
        var l = levels[k], idx = stack.indexOf(k);
        l.dataset.pos = idx === stack.length - 1 ? 'current' : idx >= 0 ? 'past' : 'future';
        l.inert = l.dataset.pos !== 'current';
      });
    }
    function goLevel(name) { stack.push(name); setLevels(1); var h = levels[name].querySelector('[data-mm-h]'); setTimeout(function () { h && h.focus({ preventScroll: true }); }, 30); }
    function back() { if (stack.length < 2) return; var from = stack.pop(); setLevels(-1); var btn = levels[stack[stack.length - 1]].querySelector('[data-mm-go="' + from + '"]'); setTimeout(function () { btn && btn.focus({ preventScroll: true }); }, 30); }
    function openDrawer() {
      clearTimeout(hideT); stack = ['root']; setLevels(0);
      drawer.hidden = false; burger.setAttribute('aria-expanded', 'true');
      void drawer.offsetWidth; drawer.classList.add('is-open');
      document.documentElement.style.overflow = 'hidden';
      setTimeout(function () { var f = levels.root.querySelector('[data-mm-row]'); f && f.focus({ preventScroll: true }); }, 60);
    }
    function closeDrawer(focusBack) {
      if (drawer.hidden) return;
      drawer.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false');
      document.documentElement.style.overflow = '';
      hideT = setTimeout(function () { drawer.hidden = true; }, REDUCE ? 0 : 420);
      if (focusBack !== false) burger.focus();
    }
    if (burger && drawer) {
      on(burger, 'click', openDrawer);
      drawer.querySelectorAll('[data-mm-close]').forEach(function (b) { on(b, 'click', function () { closeDrawer(); }); });
      drawer.querySelectorAll('[data-mm-go]').forEach(function (b) { on(b, 'click', function () { goLevel(b.dataset.mmGo); }); });
      drawer.querySelectorAll('[data-mm-back]').forEach(function (b) { on(b, 'click', back); });
      on(drawer, 'keydown', function (e) {
        if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); return; }
        if (e.key === 'ArrowLeft' && stack.length > 1 && !/INPUT|TEXTAREA/.test(e.target.tagName)) { e.preventDefault(); back(); return; }
        var rows = Array.prototype.slice.call(levels[stack[stack.length - 1]].querySelectorAll('[data-mm-row]'));
        var i = rows.indexOf(document.activeElement);
        if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && rows.length) { e.preventDefault(); rows[(i + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length].focus(); return; }
        if (e.key === 'ArrowRight' && document.activeElement && document.activeElement.dataset.mmGo) { e.preventDefault(); goLevel(document.activeElement.dataset.mmGo); return; }
        if (e.key === 'Tab') { // piège du focus dans la feuille
          var f = Array.prototype.slice.call(sheet.querySelectorAll('a[href], button')).filter(function (x) { return !x.closest('[inert]') && x.offsetParent !== null; });
          if (!f.length) return; var a = f[0], z = f[f.length - 1];
          if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
        }
      });
      setLevels(0);
    }

    root._mega = {
      open: open, close: close, openDrawer: openDrawer, closeDrawer: closeDrawer, goLevel: goLevel, back: back,
      get current() { return cur; },
      destroy: function () {
        dead = true; cancelAnimationFrame(raf); clearTimeout(openT); clearTimeout(closeT); clearTimeout(hideT);
        listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); }); document.documentElement.style.overflow = '';
        root._mega = null;
      },
    };
    return root._mega;
  }
  return mount;
}

/* ——— Pièces de balisage ——— */
const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]';
const Logo = ({ brand }) => (
  <a href="#" aria-label={`${brand}, accueil`} className={`inline-flex h-11 items-center gap-2.5 rounded-lg text-[17px] font-semibold tracking-[-.02em] text-[var(--text-strong)] ${focus}`}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="6" fill="var(--accent)" /><path d="M7 14.5c1.6 1.4 3.2 2 5 2s3.4-.6 5-2M7 9.5c1.6-1.4 3.2-2 5-2s3.4.6 5 2" stroke="var(--accent-fg)" strokeWidth="1.75" strokeLinecap="round" /></svg>
    <span>{brand}</span>
  </a>
);
const Ic = ({ children, sm }) => (
  <span className={`grid place-items-center border border-[var(--border)] bg-[var(--raised)] text-[var(--text-strong)] transition-colors group-hover/it:border-[var(--border-control)] group-hover/it:bg-[var(--surface)] group-focus-visible/it:bg-[var(--surface)] ${sm ? 'row-span-2 h-9 w-9 rounded-lg' : 'h-10 w-10 rounded-[10px]'}`}>
    <svg viewBox="0 0 24 24" className={`${sm ? 'h-[18px] w-[18px]' : 'h-5 w-5'} fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.5]`}>{children}</svg>
  </span>
);
const Arrow = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform duration-300 ease-[var(--mm-spring)] group-hover/go:translate-x-[3px] group-focus-visible/go:translate-x-[3px]"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
const Chev = ({ d }) => <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] flex-none fill-none stroke-[var(--text-muted)] [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.75]"><path d={d} /></svg>;
const rowT = '[&>b]:text-sm [&>b]:font-semibold [&>b]:leading-5 [&>b]:text-[var(--text-strong)] [&>span]:text-[13px] [&>span]:leading-[18px] [&>span]:text-[var(--text-muted)]';
const Row = ({ t, d }) => <li><a href="#" className={`grid gap-0.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--state-hover)] focus-visible:bg-[var(--state-hover)] ${focus} ${rowT}`}><b>{t}</b><span>{d}</span></a></li>;
const Ok = () => <span className="inline-flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-[var(--up)]" />Tous les systèmes fonctionnent</span>;
const colH = 'm-0 px-3 pb-1 pt-2 font-[family-name:var(--font-mono)] text-[11px] font-medium uppercase leading-4 tracking-[.04em] text-[var(--text-muted)]';
const Top = ({ id, children }) => (
  <li>
    <button type="button" aria-expanded="false" aria-controls={`mm-p-${id}`} data-mm-trigger={id} data-mm-top
      className={`group/top relative inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm font-medium text-[var(--text)] transition-colors hover:text-[var(--text-strong)] aria-expanded:text-[var(--text-strong)] ${focus}`}>
      {children}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-[var(--text-muted)] transition-transform duration-300 ease-[var(--mm-spring)] group-aria-expanded/top:rotate-180 motion-reduce:transition-none"><path d="M6 9l6 6 6-6" /></svg>
    </button>
  </li>
);
const lvl = 'absolute inset-0 invisible translate-x-full overflow-y-auto bg-[var(--surface)] px-2 pb-6 pt-3 [transition:transform_var(--mm-dur,400ms)_var(--mm-spring),opacity_var(--mm-dur,400ms)_cubic-bezier(.2,0,0,1),visibility_0s_linear_var(--mm-dur,400ms)] data-[pos=current]:visible data-[pos=current]:translate-x-0 data-[pos=current]:[transition-delay:0s] data-[pos=past]:-translate-x-[28%] data-[pos=past]:opacity-0 motion-reduce:transition-none';
const mrow = `flex min-h-14 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-[17px] font-semibold leading-[1.3] tracking-[-.01em] text-[var(--text-strong)] active:bg-[var(--state-press)] ${focus}`;
const MGo = ({ to, children }) => <li><button type="button" data-mm-go={to} data-mm-row className={mrow}>{children}<Chev d="M9 6l6 6-6 6" /></button></li>;
const MSub = ({ t, d }) => <li><a href="#" data-mm-row className={`grid min-h-14 gap-0.5 rounded-xl px-3 py-2 active:bg-[var(--state-press)] ${focus} [&>b]:text-base [&>b]:font-semibold [&>b]:text-[var(--text-strong)] [&>span]:text-sm [&>span]:leading-5 [&>span]:text-[var(--text-muted)]`}><b>{t}</b><span>{d}</span></a></li>;
const Level = ({ id, parent, back, title, children }) => (
  <section data-mm-level={id} data-parent={parent} aria-labelledby={`mm-l-${id}`} className={lvl}>
    <button type="button" data-mm-back data-mm-row className={`inline-flex h-11 items-center gap-1 rounded-full pl-1.5 pr-3 text-[15px] font-medium text-[var(--text-muted)] active:bg-[var(--state-press)] ${focus}`}><Chev d="M15 6l-6 6 6 6" />{back}</button>
    <h2 id={`mm-l-${id}`} data-mm-h tabIndex={-1} className="mx-3 mb-2 mt-1 text-2xl font-semibold leading-tight tracking-[-.02em] text-[var(--text-strong)] outline-none">{title}</h2>
    <ul className="m-0 grid list-none gap-0.5 p-0">{children}</ul>
  </section>
);

/** @param {MegaMenuProps} props */
export function MegaMenu({
  brand = 'Sillage',
  cta = 'Essai gratuit',
  defaultOpen = 'none',
  openOnHover = true,
  arrow = true,
  pill = true,
  stiffness = 320,
  damping = 30,
  slide = 24,
  openDelay = 80,
  closeDelay = 220,
  onOpen,
}) {
  const ref = useRef(null);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  useEffect(() => {
    const root = ref.current;
    const api = createMegaMenu()(root);
    const handler = (e) => onOpenRef.current && onOpenRef.current(e.detail.panel);
    root.addEventListener('megamenu:open', handler);
    if (defaultOpen !== 'none' && window.innerWidth >= 960) requestAnimationFrame(() => api && api.open(defaultOpen));
    return () => { root.removeEventListener('megamenu:open', handler); api && api.destroy(); };
  }, [openOnHover, stiffness, damping, slide, openDelay, closeDelay, defaultOpen]);

  return (
    <header ref={ref} data-mega data-stiffness={stiffness} data-damping={damping} data-slide={slide} data-open-delay={openDelay} data-close-delay={closeDelay} data-hover={String(openOnHover)}
      className="group/mm relative z-20 border-b border-[var(--border)] bg-[var(--surface)] font-[family-name:var(--font-sans)] text-[var(--text)]">
      <div data-mm-in className="relative mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-4 min-[960px]:gap-8 min-[960px]:px-6">
        <Logo brand={brand} />

        <nav aria-label="Navigation principale" className="hidden min-[960px]:block">
          <ul data-mm-list className="relative isolate m-0 flex list-none items-center gap-1 p-0">
            <Top id="produit">Produit</Top>
            <Top id="solutions">Solutions</Top>
            <Top id="ressources">Ressources</Top>
            <li><a href="#" data-mm-top data-mm-link className={`inline-flex h-9 items-center rounded-full px-3 text-sm font-medium text-[var(--text)] hover:text-[var(--text-strong)] ${focus}`}>Tarifs</a></li>
            <li data-mm-pill aria-hidden="true" className={`pointer-events-none absolute left-0 top-1/2 -z-10 -mt-[18px] h-9 w-0 rounded-full bg-[var(--state-press)] opacity-0 transition-opacity duration-200 will-change-transform [&.is-on]:opacity-100 ${pill ? '' : 'hidden'}`} />
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <a href="#" data-mm-signin className={`hidden h-9 items-center rounded-full px-3 text-sm font-medium text-[var(--text)] hover:bg-[var(--state-hover)] hover:text-[var(--text-strong)] min-[960px]:inline-flex ${focus}`}>Se connecter</a>
          <a href="#" className={`group/go hidden h-9 items-center gap-1.5 rounded-full bg-[var(--accent)] px-3.5 text-sm font-semibold text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-hover)] min-[960px]:inline-flex ${focus}`}>{cta}<Arrow /></a>
          <button type="button" aria-expanded="false" aria-controls="mm-drawer" data-mm-burger className={`-mr-2 grid h-11 w-11 place-items-center rounded-full text-[var(--text-strong)] active:bg-[var(--state-press)] min-[960px]:hidden ${focus}`}>
            <span className="sr-only">Ouvrir le menu</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        </div>

        {/* Panneau flottant : suit l'entrée, change de taille avec ressort */}
        <div data-mm-pos className="pointer-events-none absolute left-0 top-full hidden pt-2.5 group-[.is-open]/mm:pointer-events-auto min-[960px]:block">
          <span data-mm-arrow aria-hidden="true" className={`absolute left-0 top-1 z-[2] -ml-1.5 h-3 w-3 rotate-45 rounded-tl-[3px] border-l border-t border-[var(--border)] bg-[var(--surface)] opacity-0 ${arrow ? '' : 'hidden'}`} />
          <div data-mm-viewport className="relative origin-top overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] opacity-0 shadow-[var(--shadow-popover)] will-change-transform">

            <div id="mm-p-produit" data-mm-panel="produit" hidden className="absolute left-0 top-0 grid w-[760px] grid-cols-[minmax(0,1fr)_232px] gap-4 p-4 [&[hidden]]:hidden">
              <div className="grid grid-cols-2 gap-1">
                {PRODUIT.map(([t, d, ic]) => (
                  <a key={t} href="#" className={`group/it grid grid-cols-[40px_minmax(0,1fr)] items-start gap-3 rounded-xl p-3 transition-colors hover:bg-[var(--state-hover)] focus-visible:bg-[var(--state-hover)] ${focus}`}>
                    <Ic>{ic}</Ic>
                    <span className={`grid gap-0.5 pt-px text-pretty ${rowT}`}><b>{t}</b><span>{d}</span></span>
                  </a>
                ))}
              </div>
              <a href="#" className={`group/go relative flex min-h-full flex-col justify-end gap-1.5 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--raised)] p-4 ${focus}`}>
                <span className="absolute left-3 top-3 inline-flex h-[22px] items-center rounded-full border border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)] px-2 text-xs font-semibold text-[var(--accent)]">Nouveau</span>
                <span aria-hidden="true" className="mb-2 mt-10 flex h-12 items-center gap-[3px]">
                  {WAVE.map((h, i) => <i key={i} style={{ height: `${h}%`, animationDelay: `${-(i % 5) * 0.3}s` }} className="flex-1 rounded-full bg-[var(--accent)] group-[.is-open]/mm:animate-pulse motion-reduce:!animate-none" />)}
                </span>
                <b className="text-balance text-[15px] font-semibold leading-5 text-[var(--text-strong)]">Clara 2, la voix qui ne fait pas robot</b>
                <span className="text-[13px] leading-[18px] text-[var(--text-muted)]">Intonation naturelle et réponse en 280&nbsp;ms.</span>
                <span className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-strong)]">Écouter un appel<Arrow /></span>
              </a>
            </div>

            <div id="mm-p-solutions" data-mm-panel="solutions" hidden className="absolute left-0 top-0 grid w-[560px] gap-3 p-4 [&[hidden]]:hidden">
              <div className="grid grid-cols-2 gap-2">
                <div><p id="mm-h-metier" className={colH}>Par métier</p><ul aria-labelledby="mm-h-metier" className="m-0 list-none p-0">{METIER.map(([t, d]) => <Row key={t} t={t} d={d} />)}</ul></div>
                <div><p id="mm-h-equipe" className={colH}>Par équipe</p><ul aria-labelledby="mm-h-equipe" className="m-0 list-none p-0">{EQUIPE.map(([t, d]) => <Row key={t} t={t} d={d} />)}</ul></div>
              </div>
              <a href="#" className={`group/go flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--raised)] p-3 text-[13px] font-medium text-[var(--text-strong)] ${focus}`}>
                <span className="inline-flex h-[22px] items-center whitespace-nowrap rounded-full border border-[var(--tint-green-border)] bg-[var(--tint-green-bg)] px-2 text-xs font-semibold text-[var(--tint-green-fg)]">Étude de cas</span>
                <span className="flex-1">Cabinet Lumière : 0 appel manqué en 3 mois</span><Arrow />
              </a>
            </div>

            <div id="mm-p-ressources" data-mm-panel="ressources" hidden className="absolute left-0 top-0 grid w-[440px] gap-3 p-4 [&[hidden]]:hidden">
              <ul className="m-0 grid list-none gap-0.5 p-0">
                {RESSOURCES.map(([t, d, ic]) => (
                  <li key={t}><a href="#" className={`group/it grid grid-cols-[36px_minmax(0,1fr)] items-center gap-x-3 gap-y-0.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--state-hover)] focus-visible:bg-[var(--state-hover)] ${focus} ${rowT}`}>
                    <Ic sm>{ic}</Ic><b>{t}</b><span>{d || <Ok />}</span>
                  </a></li>
                ))}
              </ul>
              <a href="#" className={`grid gap-1 rounded-xl border border-[var(--border)] bg-[var(--raised)] p-3 ${focus}`}>
                <span className="font-[family-name:var(--font-mono)] text-[11px] font-medium leading-4 text-[var(--text-muted)]">Dernier article · 4 min</span>
                <b className="text-sm font-semibold leading-5 text-[var(--text-strong)]">Faut-il annoncer qu’un agent vocal décroche&nbsp;?</b>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile : tiroir à niveaux */}
      <div id="mm-drawer" data-mm-drawer hidden className="group/dr fixed inset-0 z-50 min-[960px]:!hidden [&[hidden]]:hidden">
        <div data-mm-close className="absolute inset-0 bg-[var(--scrim)] opacity-0 transition-opacity duration-[var(--mm-dur,400ms)] group-[.is-open]/dr:opacity-100 motion-reduce:transition-none" />
        <div data-mm-sheet role="dialog" aria-modal="true" aria-label="Menu" className="absolute inset-y-0 right-0 flex w-full max-w-[420px] translate-x-full flex-col border-l border-[var(--border)] bg-[var(--surface)] pb-[var(--safe-bottom)] shadow-[var(--shadow-popover)] transition-transform duration-[var(--mm-dur,400ms)] ease-[var(--mm-spring)] group-[.is-open]/dr:translate-x-0 motion-reduce:transition-none">
          <div className="flex h-16 flex-none items-center justify-between border-b border-[var(--border)] px-4 pt-[var(--safe-top)]">
            <Logo brand={brand} />
            <button type="button" data-mm-close className={`-mr-2 grid h-11 w-11 place-items-center rounded-full text-[var(--text-strong)] active:bg-[var(--state-press)] ${focus}`}>
              <span className="sr-only">Fermer le menu</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          <div data-mm-levels className="relative flex-1 overflow-hidden">
            <section data-mm-level="root" aria-label="Menu principal" className={lvl}>
              <ul className="m-0 grid list-none gap-0.5 p-0">
                <MGo to="produit">Produit</MGo><MGo to="solutions">Solutions</MGo><MGo to="ressources">Ressources</MGo>
                <li><a href="#" data-mm-row className={mrow}>Tarifs</a></li>
              </ul>
            </section>
            <Level id="produit" parent="root" back="Menu" title="Produit">{PRODUIT.map(([t, d]) => <MSub key={t} t={t} d={d} />)}</Level>
            <Level id="solutions" parent="root" back="Menu" title="Solutions">
              <MGo to="metier">Par métier</MGo><MGo to="equipe">Par équipe</MGo>
              <MSub t="Étude de cas" d="Cabinet Lumière : 0 appel manqué en 3 mois" />
            </Level>
            <Level id="metier" parent="solutions" back="Solutions" title="Par métier">{METIER.map(([t, d]) => <MSub key={t} t={t} d={d} />)}</Level>
            <Level id="equipe" parent="solutions" back="Solutions" title="Par équipe">{EQUIPE.map(([t, d]) => <MSub key={t} t={t} d={d} />)}</Level>
            <Level id="ressources" parent="root" back="Menu" title="Ressources">{RESSOURCES.map(([t, d]) => <MSub key={t} t={t} d={d || 'Tous les systèmes fonctionnent'} />)}</Level>
          </div>
          <div className="grid flex-none grid-cols-2 gap-2 border-t border-[var(--border)] px-4 pb-4 pt-3">
            <a href="#" className={`inline-flex h-12 items-center justify-center rounded-full border border-[var(--border-control)] text-base font-semibold text-[var(--text-strong)] ${focus}`}>Se connecter</a>
            <a href="#" className={`inline-flex h-12 items-center justify-center rounded-full bg-[var(--accent)] text-base font-semibold text-[var(--accent-fg)] ${focus}`}>{cta}</a>
          </div>
        </div>
      </div>
    </header>
  );
}

// Exemple
export default function Exemple() {
  return <MegaMenu cta="Essai gratuit" defaultOpen="produit" stiffness={320} damping={30} />;
}
