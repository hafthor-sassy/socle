// Flux d’intégrations — React + Tailwind CSS. SVG animé, aucune dépendance.
// Couleurs : variables de tokens.css. Marque (Maillon) et apps fictives, icônes génériques.
import { useEffect, useRef, useState } from 'react';

/* ——— Moteur des faisceaux : courbes SVG, comètes en dégradé, paquets de données ———
   Balisage attendu dans root :
     [data-flow-stage]  conteneur positionné des tuiles et du hub
     [data-flow-svg]    <svg> en fond de la scène
     [data-flow-core]   le carré du produit central (point d'arrivée des courbes)
     [data-flow-app]    une tuile par app : data-side="in|out", data-status="ok|pause"
     [data-flow-count]  (facultatif) compteur d'événements
*/
var FLOW_DEFAULTS = {
  speed: 1,           // multiplicateur de vitesse des paquets (1 = 160 px/s)
  packets: 2,         // paquets simultanés par faisceau (1 à 3)
  direction: 'both',  // 'both' (sources → produit → destinations) | 'in' | 'out'
  beam: 96,           // longueur de la comète, px
  curve: 0.5,         // courbure des liens (0 = droit, 1 = très arrondi)
  glow: true,         // halo discret autour des paquets
  statuts: true,      // les apps en pause n'émettent rien (lien en pointillés)
  count: 12482,       // valeur de départ du compteur
  onSelect: null,     // (app | null) => void, app = { index, name, role, stat, unit, latency, status, side, tint }
};

function createFlow(root, options) {
  var o = {}, k;
  for (k in FLOW_DEFAULTS) o[k] = FLOW_DEFAULTS[k];
  for (k in options || {}) if (options[k] !== undefined) o[k] = options[k];

  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var stage = root.querySelector('[data-flow-stage]');
  var svg = root.querySelector('[data-flow-svg]');
  var core = root.querySelector('[data-flow-core]');
  var hub = root.querySelector('[data-flow-hub]') || core;
  var countEl = root.querySelector('[data-flow-count]');
  var rings = root.querySelectorAll('[data-flow-ring]');
  var apps = [].slice.call(root.querySelectorAll('[data-flow-app]'));
  var uid = 'fx' + Math.random().toString(36).slice(2, 7);
  var links = [], sel = -1, sticky = false, raf = 0, last = 0, visible = true, dead = false;
  var count = o.count, lastPulse = 0, ringI = 0, seed = 11;
  var fmt = window.Intl ? new Intl.NumberFormat('fr-FR') : { format: String };

  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var a in attrs) n.setAttribute(a, attrs[a]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function info(i) {
    var a = apps[i], d = a.dataset;
    return { index: i, name: d.name, role: d.role, stat: d.stat, unit: d.unit, latency: d.latency, status: d.status || 'ok', side: d.side, tint: d.tint, logo: a.querySelector('[data-flow-logo]') };
  }
  function flowsIn(a) { return o.direction === 'in' || (o.direction === 'both' && a.dataset.side !== 'out'); }

  /* Construction du SVG */
  function build() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var defs = el('defs', {}, svg);
    if (o.glow) {
      var f = el('filter', { id: uid + '-glow', x: '-200%', y: '-200%', width: '500%', height: '500%' }, defs);
      el('feGaussianBlur', { stdDeviation: '3' }, f);
    }
    links = apps.map(function (a, i) {
      var g = el('g', {}, svg);
      g.style.transition = 'opacity 260ms cubic-bezier(.2,0,0,1)';
      var track = el('path', { fill: 'none', 'stroke-width': '1.5', 'stroke-linecap': 'round' }, g);
      track.style.stroke = 'var(--border-control)';
      track.style.strokeOpacity = '.45';
      track.style.transition = 'stroke 260ms cubic-bezier(.2,0,0,1), stroke-opacity 260ms cubic-bezier(.2,0,0,1)';
      var paused = o.statuts && a.dataset.status === 'pause';
      if (paused) track.setAttribute('stroke-dasharray', '2 6');
      var pk = [];
      var n = paused ? 0 : Math.max(1, Math.min(3, Math.round(o.packets)));
      for (var j = 0; j < n; j++) {
        var gid = uid + '-g' + i + '-' + j;
        var grad = el('linearGradient', { id: gid, gradientUnits: 'userSpaceOnUse' }, defs);
        [[0, 0], [.6, .45], [1, 1]].forEach(function (s) {
          var st = el('stop', { offset: String(s[0]) }, grad);
          st.style.stopColor = 'var(--accent)'; st.style.stopOpacity = String(s[1]);
        });
        var beam = el('path', { fill: 'none', stroke: 'url(#' + gid + ')', 'stroke-width': '2.25', 'stroke-linecap': 'round' }, g);
        beam.style.transition = 'stroke-width 260ms cubic-bezier(.2,0,0,1)';
        var halo = o.glow ? el('circle', { r: '7', filter: 'url(#' + uid + '-glow)' }, g) : null;
        if (halo) { halo.style.fill = 'var(--accent)'; halo.style.opacity = '0'; }
        var dot = el('circle', { r: '3' }, g);
        dot.style.fill = 'var(--accent)'; dot.style.opacity = '0';
        pk.push({ grad: grad, beam: beam, dot: dot, halo: halo, s: 0, wait: (j / n) * 2.2 + rnd() * .8, crossed: false });
      }
      // Étiquette de données : visible sur le faisceau sélectionné, elle suit le premier paquet
      var tag = null;
      if (!paused && a.dataset.payload) {
        tag = el('g', {}, g);
        tag.style.opacity = '0'; tag.style.transition = 'opacity 200ms cubic-bezier(.2,0,0,1)';
        var inner = el('g', {}, tag); tag.inner = inner;
        inner.style.transformBox = 'fill-box'; inner.style.transformOrigin = '50% 100%';
        var bg = el('rect', { height: '22', rx: '6', y: '-11' }, inner);
        bg.style.fill = 'var(--surface)'; bg.style.stroke = 'var(--border-strong)'; bg.style.strokeOpacity = '.6';
        var tx = el('text', { y: '3.5', 'text-anchor': 'middle' }, inner);
        tx.textContent = a.dataset.payload;
        tx.style.fill = 'var(--text-strong)'; tx.style.font = '500 11px var(--font-mono)';
        tag.bg = bg; tag.tx = tx;
      }
      return { app: a, g: g, track: track, pk: pk, tag: tag, len: 1, paused: paused, inbound: flowsIn(a) };
    });
    layout();
  }

  /* Géométrie : courbe de Bézier de la tuile vers le hub, horizontale ou verticale selon la mise en page */
  function layout() {
    var sr = stage.getBoundingClientRect(), cr = core.getBoundingClientRect(), hr = hub.getBoundingClientRect();
    svg.setAttribute('width', sr.width); svg.setAttribute('height', sr.height);
    svg.setAttribute('viewBox', '0 0 ' + sr.width + ' ' + sr.height);
    var hc = { x: cr.left - sr.left + cr.width / 2, y: cr.top - sr.top + cr.height / 2 };
    var groups = {};
    var geo = links.map(function (l) {
      var r = l.app.getBoundingClientRect();
      var c = { x: r.left - sr.left + r.width / 2, y: r.top - sr.top + r.height / 2 };
      var horiz = Math.abs(c.x - hc.x) > Math.abs(c.y - hc.y) * 0.9;
      var side = horiz ? (c.x < hc.x ? 'l' : 'r') : (c.y < hc.y ? 't' : 'b');
      var p0 = horiz ? { x: side === 'l' ? r.right - sr.left : r.left - sr.left, y: c.y }
                     : { x: c.x, y: side === 't' ? r.bottom - sr.top : r.top - sr.top };
      (groups[side] = groups[side] || []).push(l);
      return { l: l, c: c, side: side, horiz: horiz, p0: p0 };
    });
    // Arrivées réparties sur le bord du hub, dans l'ordre des tuiles
    geo.forEach(function (g) {
      var list = groups[g.side].slice().sort(function (a, b) {
        var ra = a.app.getBoundingClientRect(), rb = b.app.getBoundingClientRect();
        return g.horiz ? ra.top - rb.top : ra.left - rb.left;
      });
      var n = list.length, idx = list.indexOf(g.l), spread = g.horiz ? cr.height * .56 : cr.width * .56;
      var off = n > 1 ? (idx / (n - 1) - .5) * spread : 0;
      var p3 = g.horiz ? { x: g.side === 'l' ? cr.left - sr.left : cr.right - sr.left, y: hc.y + off }
                       : { x: hc.x + off, y: g.side === 't' ? cr.top - sr.top : hr.bottom - sr.top + 4 }; // sous le libellé du hub
      var cv = Math.max(0, Math.min(1, o.curve));
      var d;
      if (g.horiz) { var dx = (p3.x - g.p0.x) * cv; d = 'M' + g.p0.x + ' ' + g.p0.y + 'C' + (g.p0.x + dx) + ' ' + g.p0.y + ' ' + (p3.x - dx) + ' ' + p3.y + ' ' + p3.x + ' ' + p3.y; }
      else { var dy = (p3.y - g.p0.y) * cv; d = 'M' + g.p0.x + ' ' + g.p0.y + 'C' + g.p0.x + ' ' + (g.p0.y + dy) + ' ' + p3.x + ' ' + (p3.y - dy) + ' ' + p3.x + ' ' + p3.y; }
      g.l.track.setAttribute('d', d);
      g.l.pk.forEach(function (p) { p.beam.setAttribute('d', d); });
      g.l.len = g.l.track.getTotalLength() || 1;
    });
    if (sel >= 0 && links[sel]) placeTag(links[sel]);
    draw(0);
  }

  function setBeam(l, p, s) {
    var L = o.beam, len = l.len;
    var a, b, tail, head;
    if (l.inbound) { a = s - L; b = s; tail = Math.max(0, a); head = Math.min(len, b); }
    else { a = len - s; b = len - s + L; tail = Math.min(len, b); head = Math.max(0, a); }
    p.beam.setAttribute('stroke-dasharray', L + ' ' + (len + L * 2));
    p.beam.setAttribute('stroke-dashoffset', String(-a));
    var pt = l.track.getPointAtLength(tail), ph = l.track.getPointAtLength(head);
    p.grad.setAttribute('x1', pt.x); p.grad.setAttribute('y1', pt.y);
    p.grad.setAttribute('x2', ph.x + (ph.x === pt.x ? .01 : 0)); p.grad.setAttribute('y2', ph.y);
    var vis = s > 0 && s < len + L;
    var fade = Math.min(1, s / 24, (len - s) / 24 + 1);
    var dotOn = vis && s <= len ? Math.max(0, Math.min(1, Math.min(s, len - s) / 18)) : 0;
    p.dot.setAttribute('cx', ph.x); p.dot.setAttribute('cy', ph.y);
    p.dot.style.opacity = String(dotOn);
    if (p.halo) { p.halo.setAttribute('cx', ph.x); p.halo.setAttribute('cy', ph.y); p.halo.style.opacity = String(dotOn * .55); }
    p.beam.style.opacity = vis ? String(Math.max(0, fade)) : '0';
  }

  // Étiquette posée au milieu du lien sélectionné ; elle rebondit à chaque passage de paquet
  function placeTag(l) {
    if (!l.tag) return;
    var pt = l.track.getPointAtLength(l.len * .5);
    try { l.tag.w = Math.ceil(l.tag.tx.getComputedTextLength()) + 16; } catch (e) { l.tag.w = 96; }
    l.tag.bg.setAttribute('width', l.tag.w); l.tag.bg.setAttribute('x', -l.tag.w / 2);
    l.tag.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + (pt.y - 22).toFixed(1) + ')');
  }
  function popTag(l) {
    if (!l.tag || !l.tag.inner || !l.tag.inner.animate || reduce.matches) return;
    l.tag.inner.animate([{ transform: 'translateY(3px) scale(.92)', opacity: .5 }, { transform: 'none', opacity: 1 }], { duration: 360, easing: 'cubic-bezier(.34,1.56,.64,1)' });
  }
  function pulse(now) {
    if (now - lastPulse < 180) return;
    lastPulse = now;
    if (core.animate) core.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.045)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(.34,1.56,.64,1)' });
    var ring = rings[ringI++ % (rings.length || 1)];
    if (ring && ring.animate) ring.animate([{ transform: 'scale(1)', opacity: .55 }, { transform: 'scale(1.55)', opacity: 0 }], { duration: 1100, easing: 'cubic-bezier(.2,0,0,1)' });
    count += 3 + Math.floor(rnd() * 22);
    if (countEl) countEl.textContent = fmt.format(count);
  }
  function flash(a) {
    var logo = a.querySelector('[data-flow-logo]');
    if (logo && logo.animate) logo.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'cubic-bezier(.34,1.56,.64,1)' });
  }

  function draw(dt, now) {
    links.forEach(function (l, i) {
      var boost = sel === i ? 1.75 : 1;
      var v = 160 * o.speed * boost;
      l.pk.forEach(function (p, j) {
        if (reduce.matches || o.speed <= 0) { var sm = l.len * (.42 + j * .22) + o.beam * .5; setBeam(l, p, sm); return; }
        if (p.wait > 0) { p.wait -= dt * boost; p.beam.style.opacity = '0'; p.dot.style.opacity = '0'; if (p.halo) p.halo.style.opacity = '0'; return; }
        p.s += v * dt;
        if (!p.mid && p.s >= l.len * .5) { p.mid = true; if (sel === i) popTag(l); }
        if (!p.crossed && p.s >= l.len) { p.crossed = true; if (l.inbound) pulse(now || 0); else flash(l.app); }
        if (p.s >= l.len + o.beam) { p.s = 0; p.crossed = false; p.mid = false; p.wait = (.35 + rnd() * 1.6) / Math.max(.25, o.speed); }
        setBeam(l, p, p.s);
      });
    });
  }

  function frame(now) {
    raf = 0;
    if (dead) return;
    var dt = Math.min(.05, last ? (now - last) / 1000 : .016); last = now;
    draw(dt, now);
    wake();
  }
  function wake() {
    if (raf || dead || !visible || reduce.matches || o.speed <= 0) return;
    raf = requestAnimationFrame(frame);
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; last = 0; }

  /* Sélection : le faisceau survolé s'intensifie, les autres s'effacent */
  function select(i, isSticky) {
    sel = i; sticky = !!isSticky && i >= 0;
    links.forEach(function (l, j) {
      var on = j === i, dim = i >= 0 && !on;
      l.g.style.opacity = dim ? '.22' : '1';
      l.track.style.stroke = on ? 'var(--accent)' : 'var(--border-control)';
      l.track.style.strokeOpacity = on ? '.55' : '.45';
      l.pk.forEach(function (p) { p.beam.setAttribute('stroke-width', on ? '3.5' : '2.25'); });
      if (l.tag) { if (on) placeTag(l); l.tag.style.opacity = on ? '1' : '0'; }
      l.app.setAttribute('data-state', on ? 'active' : dim ? 'dim' : 'idle');
      l.app.setAttribute('aria-pressed', on && sticky ? 'true' : 'false');
    });
    root.setAttribute('data-selected', i >= 0 ? 'true' : 'false');
    if (typeof o.onSelect === 'function') o.onSelect(i >= 0 ? info(i) : null);
    if (reduce.matches) draw(0);
  }
  var handlers = [];
  function on(t, ev, fn, opt) { t.addEventListener(ev, fn, opt); handlers.push([t, ev, fn, opt]); }
  apps.forEach(function (a, i) {
    on(a, 'pointerenter', function (e) { if (e.pointerType === 'mouse' && !sticky) select(i); });
    on(a, 'pointerleave', function (e) { if (e.pointerType === 'mouse' && !sticky) select(-1); });
    on(a, 'focus', function () { if (!sticky) select(i); });
    on(a, 'blur', function () { if (!sticky) select(-1); });
    on(a, 'click', function () { if (sticky && sel === i) select(-1); else select(i, true); });
  });
  on(document, 'pointerdown', function (e) { if (sticky && !e.target.closest('[data-flow-app]')) select(-1); });
  on(root, 'keydown', function (e) { if (e.key === 'Escape' && sel >= 0) select(-1); });

  var ro = window.ResizeObserver ? new ResizeObserver(function () { layout(); }) : null;
  if (ro) ro.observe(stage); else on(window, 'resize', layout);
  var io = window.IntersectionObserver ? new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) wake(); else stop(); }) : null;
  if (io) io.observe(root);
  on(document, 'visibilitychange', function () { if (document.hidden) stop(); else wake(); });
  if (reduce.addEventListener) on(reduce, 'change', function () { stop(); draw(0); wake(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!dead) layout(); });

  if (countEl) countEl.textContent = fmt.format(count);
  build();
  select(-1);
  wake();

  return {
    update: function (next) {
      for (var k2 in next) if (next[k2] !== undefined) o[k2] = next[k2];
      var keepSel = sel, keepSticky = sticky;
      stop(); build(); select(keepSel, keepSticky); wake();
    },
    select: function (i) { select(i, true); },
    replay: function () { links.forEach(function (l) { l.pk.forEach(function (p, j) { p.s = 0; p.crossed = false; p.wait = j * .7; }); }); count = o.count; if (countEl) countEl.textContent = fmt.format(count); wake(); },
    destroy: function () {
      dead = true; stop();
      if (ro) ro.disconnect(); if (io) io.disconnect();
      handlers.forEach(function (h) { h[0].removeEventListener(h[1], h[2], h[3]); });
      while (svg.firstChild) svg.removeChild(svg.firstChild);
    },
  };
}

const ICONS = {
  "agenda": "<rect x=\"3.5\" y=\"5\" width=\"17\" height=\"15\" rx=\"2\"/><path d=\"M3.5 10h17M8 3v4M16 3v4\"/><path d=\"M8 14h2M12 14h2M8 17h2\"/>",
  "mail": "<rect x=\"3\" y=\"5.5\" width=\"18\" height=\"13\" rx=\"2\"/><path d=\"M3.5 7.5l8.5 6 8.5-6\"/>",
  "card": "<rect x=\"3\" y=\"6\" width=\"18\" height=\"12.5\" rx=\"2\"/><path d=\"M3 10.5h18M7 15h3\"/>",
  "form": "<rect x=\"5\" y=\"4\" width=\"14\" height=\"17\" rx=\"2\"/><path d=\"M9.5 4V3h5v1M8.5 10h7M8.5 13.5h7M8.5 17h4\"/>",
  "crm": "<circle cx=\"9\" cy=\"9\" r=\"3.2\"/><path d=\"M3.5 19a5.5 5.5 0 0 1 11 0\"/><path d=\"M15.5 6.2a3 3 0 0 1 0 5.6M17 14.2a5 5 0 0 1 3.5 4.8\"/>",
  "sheet": "<rect x=\"3.5\" y=\"4.5\" width=\"17\" height=\"15\" rx=\"2\"/><path d=\"M3.5 9.5h17M3.5 14.5h17M9.5 4.5v15\"/>",
  "chat": "<path d=\"M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4 4v-4H6a2 2 0 0 1-2-2z\"/><path d=\"M8.5 9h7M8.5 12h4\"/>",
  "db": "<ellipse cx=\"12\" cy=\"6\" rx=\"7\" ry=\"2.5\"/><path d=\"M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5\"/>"
};

const DEFAULT_APPS = [
  {
    "side": "in",
    "icon": "agenda",
    "tint": "blue",
    "name": "Agenda",
    "short": "Rendez-vous",
    "role": "Source · rendez-vous",
    "stat": "312",
    "unit": "rendez-vous synchronisés aujourd’hui",
    "latency": "120",
    "status": "ok",
    "payload": "RDV · 14 h 30"
  },
  {
    "side": "in",
    "icon": "mail",
    "tint": "violet",
    "name": "Messagerie",
    "short": "E-mails",
    "role": "Source · e-mails entrants",
    "stat": "2 140",
    "unit": "messages triés et étiquetés",
    "latency": "240",
    "status": "ok",
    "payload": "Devis · Atelier Nord"
  },
  {
    "side": "in",
    "icon": "card",
    "tint": "green",
    "name": "Paiements",
    "short": "Encaissements",
    "role": "Source · encaissements",
    "stat": "86",
    "unit": "paiements rapprochés",
    "latency": "95",
    "status": "ok",
    "payload": "+ 129,00 €"
  },
  {
    "side": "in",
    "icon": "form",
    "tint": "amber",
    "name": "Formulaires",
    "short": "Demandes",
    "role": "Source · demandes web",
    "stat": "47",
    "unit": "nouvelles demandes qualifiées",
    "latency": "160",
    "status": "ok",
    "payload": "Demande · Lyon"
  },
  {
    "side": "out",
    "icon": "crm",
    "tint": "pink",
    "name": "CRM",
    "short": "Fiches clients",
    "role": "Destination · fiches clients",
    "stat": "1 024",
    "unit": "fiches clients mises à jour",
    "latency": "180",
    "status": "ok",
    "payload": "Fiche · M. Durand"
  },
  {
    "side": "out",
    "icon": "sheet",
    "tint": "green",
    "name": "Tableur",
    "short": "Rapports",
    "role": "Destination · rapports",
    "stat": "18",
    "unit": "tableaux alimentés en continu",
    "latency": "300",
    "status": "ok",
    "payload": "Ligne 1 284"
  },
  {
    "side": "out",
    "icon": "chat",
    "tint": "blue",
    "name": "Équipe",
    "short": "Alertes",
    "role": "Destination · alertes d’équipe",
    "stat": "64",
    "unit": "alertes envoyées à l’équipe",
    "latency": "70",
    "status": "ok",
    "payload": "Stock bas · Réf. 42"
  },
  {
    "side": "out",
    "icon": "db",
    "tint": "neutral",
    "name": "Entrepôt",
    "short": "Archives",
    "role": "Destination · archives",
    "stat": "—",
    "unit": "synchronisation en pause jusqu’à 14 h",
    "latency": "—",
    "status": "pause",
    "payload": ""
  }
];

const TINTS = {
  blue: 'bg-[var(--tint-blue-bg)] text-[var(--tint-blue-fg)]',
  violet: 'bg-[var(--tint-violet-bg)] text-[var(--tint-violet-fg)]',
  green: 'bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]',
  amber: 'bg-[var(--tint-amber-bg)] text-[var(--tint-amber-fg)]',
  pink: 'bg-[var(--tint-pink-bg)] text-[var(--tint-pink-fg)]',
  neutral: 'bg-[var(--tint-neutral-bg)] text-[var(--tint-neutral-fg)]',
  brand: 'bg-[var(--accent)] text-[var(--accent-fg)]',
};

function Icon({ name, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: ICONS[name] || '' }} />
  );
}
function Mark({ size = 36 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <rect x="4" y="11" width="17" height="14" rx="7" /><rect x="15" y="11" width="17" height="14" rx="7" />
    </svg>
  );
}

function AppTile({ app, statuts }) {
  const pause = statuts && app.status === 'pause';
  return (
    <li>
      <button
        type="button" data-flow-app data-side={app.side} data-status={app.status} data-payload={app.payload}
        data-name={app.name} data-role={app.role} data-stat={app.stat} data-unit={app.unit} data-latency={app.latency} data-tint={app.tint}
        aria-describedby="fx-info"
        className={`group flex w-20 flex-col items-center gap-2 py-1 text-[var(--text-strong)] [-webkit-tap-highlight-color:transparent]
          transition-[opacity,translate,border-color] duration-[260ms] ease-[cubic-bezier(.34,1.56,.64,1)]
          data-[state=dim]:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--focus-ring)]
          min-[900px]:h-14 min-[900px]:w-[200px] min-[900px]:flex-row min-[900px]:gap-3 min-[900px]:rounded-xl min-[900px]:border min-[900px]:border-[var(--border)]
          min-[900px]:bg-[var(--surface)] min-[900px]:py-0 min-[900px]:pl-2 min-[900px]:pr-4 min-[900px]:text-left min-[900px]:data-[state=active]:border-[var(--border-strong)]
          ${app.side === 'in' ? 'data-[state=active]:translate-y-0.5 min-[900px]:data-[state=active]:translate-x-1 min-[900px]:data-[state=active]:translate-y-0' : 'data-[state=active]:-translate-y-0.5 min-[900px]:data-[state=active]:-translate-x-1 min-[900px]:data-[state=active]:translate-y-0'}
          motion-reduce:transition-none motion-reduce:data-[state=active]:translate-x-0 motion-reduce:data-[state=active]:translate-y-0`}
      >
        <span data-flow-logo aria-hidden="true"
          className={`relative grid h-[52px] w-[52px] flex-none place-items-center rounded-xl shadow-[inset_0_0_0_1px_var(--border)] min-[900px]:h-10 min-[900px]:w-10 min-[900px]:rounded-lg min-[900px]:shadow-none ${TINTS[app.tint] || TINTS.neutral}`}>
          <Icon name={app.icon} />
          {pause && <span className="absolute -right-[3px] -top-[3px] h-2.5 w-2.5 rounded-full bg-[var(--warn)] shadow-[0_0_0_2px_var(--surface)]" />}
        </span>
        <span className="grid min-w-0 text-center text-xs font-medium leading-4 min-[900px]:text-left min-[900px]:text-[0.9375rem] min-[900px]:leading-5">
          {app.name}
          <small className="hidden text-[0.8125rem] font-normal leading-[1.125rem] text-[var(--text-muted)] min-[900px]:block">{app.short}</small>
          {pause && <span className="sr-only">, en pause</span>}
        </span>
      </button>
    </li>
  );
}

function InfoPanel({ app, apps, statuts, brand }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (el && el.animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.animate([{ opacity: 0.4, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.2,0,0,1)' });
    }
  }, [app && app.name]);
  const paused = statuts ? apps.filter((a) => a.status === 'pause').length : 0;
  const hover = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;
  const pause = app && statuts && app.status === 'pause';
  const data = app ? apps.find((a) => a.name === app.name) || null : null;
  return (
    <div id="fx-info" role="status" aria-live="polite" ref={ref}
      className="mx-auto mt-10 flex min-h-[72px] max-w-[640px] flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 pl-3 pr-4 min-[900px]:mt-12 min-[900px]:flex-nowrap min-[900px]:gap-4">
      <span aria-hidden="true" className={`grid h-11 w-11 flex-none place-items-center rounded-lg ${data ? TINTS[data.tint] || TINTS.neutral : TINTS.brand}`}>
        {data ? <Icon name={data.icon} /> : <Mark size={22} />}
      </span>
      <span className="grid min-w-0">
        <b className="text-[0.9375rem] font-semibold leading-5 text-[var(--text-strong)]">{data ? data.name : brand}</b>
        <span className="text-[0.8125rem] leading-[1.125rem] text-[var(--text-muted)]">
          {data ? data.role : `${apps.length - paused} flux actifs${paused ? `, ${paused} en pause` : ''}`}
        </span>
      </span>
      <span className="order-3 min-w-0 basis-full text-sm text-[var(--text-muted)] min-[900px]:order-none min-[900px]:flex-1 min-[900px]:basis-auto">
        {!data ? (hover ? 'Survolez une app pour suivre son flux.' : 'Touchez une app pour suivre son flux.')
          : pause ? data.unit : (<><b className="font-mono font-medium tabular-nums text-[var(--text-strong)]">{data.stat}</b> {data.unit}</>)}
      </span>
      <span className="ml-auto flex flex-none items-center gap-3">
        {data && !pause && <span className="whitespace-nowrap font-mono text-xs font-medium text-[var(--text-muted)]">{data.latency}{'\u202F'}ms</span>}
        <span className={`inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-xs font-medium before:h-1.5 before:w-1.5 before:rounded-full before:content-[''] ${
          !data ? 'bg-[var(--accent-subtle)] text-[var(--text-strong)] before:bg-[var(--accent)]'
            : pause ? 'bg-[var(--tint-amber-bg)] text-[var(--tint-amber-fg)] before:bg-current'
              : 'bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)] before:bg-current'}`}>
          {!data ? 'En direct' : pause ? 'En pause' : 'Connecté'}
        </span>
      </span>
    </div>
  );
}

/**
 * @param {object} props
 * @param {string} [props.title]
 * @param {string} [props.lead]
 * @param {string} [props.brand]       nom du produit central
 * @param {Array<{side:'in'|'out', icon:string, tint:string, name:string, short:string, role:string, stat:string, unit:string, latency:string, status:'ok'|'pause', payload?:string}>} [props.apps]
 * @param {number} [props.speed]       vitesse des paquets (1 = 160 px/s)
 * @param {1|2|3}  [props.packets]     paquets simultanés par faisceau
 * @param {'both'|'in'|'out'} [props.direction]
 * @param {number} [props.beam]        longueur de la comète en px
 * @param {number} [props.curve]       courbure 0 à 1
 * @param {boolean} [props.glow]       halo discret autour des paquets
 * @param {boolean} [props.statuts]    afficher les apps en pause
 * @param {number} [props.count]       compteur de départ
 */
export function IntegrationFlow({
  title = 'Branchez vos outils. Maillon fait circuler le reste.',
  lead = 'Plus de 120 connecteurs natifs synchronisent vos données en temps réel, sans une ligne de code.',
  brand = 'Maillon', apps = DEFAULT_APPS,
  speed = 1, packets = 2, direction = 'both', beam = 96, curve = 0.5, glow = true, statuts = true, count = 12482,
}) {
  const root = useRef(null);
  const inst = useRef(null);
  const [sel, setSel] = useState(null);
  const opts = { speed, packets, direction, beam, curve, glow, statuts };

  useEffect(() => {
    inst.current = createFlow(root.current, { ...opts, count, onSelect: setSel });
    return () => { inst.current.destroy(); inst.current = null; };
  }, [apps]);
  useEffect(() => { if (inst.current) inst.current.update(opts); }, [speed, packets, direction, beam, curve, glow, statuts]);

  const col = (side) => apps.filter((a) => a.side === side).map((a) => <AppTile key={a.name} app={a} statuts={statuts} />);

  return (
    <section ref={root} aria-labelledby="fx-title" className="bg-[var(--bg)] px-4 py-16 font-sans text-[var(--text)] min-[900px]:px-6 min-[900px]:py-24">
      <header className="mx-auto max-w-[44rem] text-center">
        <p className="mb-4 font-mono text-xs font-medium uppercase leading-[18px] tracking-[0.04em] text-[var(--text-muted)]">Intégrations</p>
        <h2 id="fx-title" className="text-balance text-[clamp(1.75rem,1.15rem+2.3vw,3rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[var(--text-strong)]">{title}</h2>
        <p className="mx-auto mt-4 max-w-[34rem] text-pretty text-base text-[var(--text-muted)] min-[900px]:text-lg min-[900px]:leading-7">{lead}</p>
      </header>

      <div data-flow-stage className="relative mx-auto mt-10 grid max-w-[1120px] grid-cols-1 gap-[72px] min-[900px]:mt-16 min-[900px]:grid-cols-[minmax(200px,1fr)_minmax(320px,1.7fr)_minmax(200px,1fr)] min-[900px]:items-center min-[900px]:gap-0">
        <svg data-flow-svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" />
        <ul aria-label="Sources" className="relative z-[1] m-0 flex list-none justify-center gap-1 p-0 min-[900px]:grid min-[900px]:justify-items-end min-[900px]:gap-4">{col('in')}</ul>

        <div data-flow-hub className="relative z-[1] grid justify-items-center gap-1 before:pointer-events-none before:absolute before:-top-[72px] before:left-1/2 before:-z-10 before:h-60 before:w-60 before:-translate-x-1/2 before:rounded-full before:bg-[radial-gradient(closest-side,var(--glow-accent),transparent)] before:content-['']">
          <div data-flow-core className="relative mb-3 grid h-24 w-24 place-items-center rounded-2xl bg-[var(--accent)] text-[var(--accent-fg)]">
            <span data-flow-ring aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl border-[1.5px] border-[var(--accent)] opacity-0" />
            <span data-flow-ring aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl border-[1.5px] border-[var(--accent)] opacity-0" />
            <Mark />
          </div>
          <p className="m-0 text-base font-semibold text-[var(--text-strong)]">{brand}</p>
          <p className="m-0 text-[0.8125rem] leading-[1.125rem] text-[var(--text-muted)]">
            <span data-flow-count className="font-mono tabular-nums text-[var(--text-strong)]" /> événements traités
          </p>
        </div>

        <ul aria-label="Destinations" className="relative z-[1] m-0 flex list-none justify-center gap-1 p-0 min-[900px]:grid min-[900px]:justify-items-start min-[900px]:gap-4">{col('out')}</ul>
      </div>

      <InfoPanel app={sel} apps={apps} statuts={statuts} brand={brand} />
    </section>
  );
}

// Exemple
export function Exemple() {
  return <IntegrationFlow speed={1} packets={2} direction="both" beam={96} curve={0.5} glow={true} statuts={true} />;
}
