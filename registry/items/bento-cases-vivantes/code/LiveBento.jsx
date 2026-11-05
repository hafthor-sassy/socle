// Bento à cases vivantes — React + Tailwind CSS. Couleurs : variables de tokens.css. Marque (Sillage) et chiffres fictifs.
// Aucune dépendance en plus de React : le moteur des micro-démos (horloge par case, ressorts, pause hors écran)
// est le même que dans l'onglet HTML ; il est monté sur la section par un useEffect et démonté proprement.
import { useEffect, useRef } from 'react';

/**
 * @typedef {Object} LiveBentoProps
 * @property {string}  [eyebrow]    Surtitre en capitales
 * @property {string}  [title]      Titre de la section
 * @property {string}  [lead]       Chapeau sous le titre
 * @property {boolean} [header]     Afficher l'en-tête (surtitre, titre, chapeau)
 * @property {number}  [speed]      Multiplicateur de vitesse des micro-démos (0,5 à 2)
 * @property {number}  [stagger]    Décalage en ms entre cases entrées ensemble à l'écran
 * @property {boolean} [ambient]    Vie continue après l'intro (en pause hors écran)
 * @property {boolean} [repeat]     Rejouer l'intro à chaque entrée à l'écran
 * @property {boolean} [halo]       Halo discret qui suit la souris
 * @property {number}  [stiffness]  Raideur du ressort
 * @property {number}  [damping]    Amortissement du ressort
 * @property {number}  [gap]        Espacement de la grille en px (multiple de 8)
 * @property {12|16}   [radius]     Rayon des cases en px
 * @property {string}  [className]
 */

/* Classes Tailwind des éléments créés par le moteur (listes, rouleaux, barres). */
const K = {
  grid: 'stroke-[var(--chart-grid)] [stroke-dasharray:2_4]',
  wave: 'h-full flex-1 rounded-full bg-[var(--text-muted)] opacity-[.55] [transform:scaleY(.08)] will-change-transform group-data-[state=live]/call:bg-[var(--accent)] group-data-[state=live]/call:opacity-100',
  bar: 'flex-1 rounded-[3px] bg-[var(--chart-muted)] opacity-[.45] [transform:scaleY(0)] origin-bottom will-change-transform last:bg-[var(--accent)] last:opacity-100',
  note: 'absolute inset-x-0 top-0 grid h-16 grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--raised)] px-3 shadow-[var(--shadow-overlay)] origin-top will-change-transform transition-[transform,opacity] duration-[var(--lb-dur,600ms)] ease-[var(--lb-spring)] motion-reduce:transition-none',
  enter: '[transform:translateY(-24px)_scale(.94)] opacity-0',
  noteIc: 'grid h-9 w-9 place-items-center rounded-lg border',
  tone: {
    green: 'border-[var(--tint-green-border)] bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]',
    blue: 'border-[var(--tint-blue-border)] bg-[var(--tint-blue-bg)] text-[var(--tint-blue-fg)]',
    amber: 'border-[var(--tint-amber-border)] bg-[var(--tint-amber-bg)] text-[var(--tint-amber-fg)]',
    violet: 'border-[var(--tint-violet-border)] bg-[var(--tint-violet-bg)] text-[var(--tint-violet-fg)]',
  },
  noteT: 'grid min-w-0 gap-0.5 [&>b]:truncate [&>b]:text-sm [&>b]:font-semibold [&>b]:leading-[18px] [&>b]:text-[var(--text-strong)] [&>span]:truncate [&>span]:text-xs [&>span]:text-[var(--text-muted)]',
  noteWhen: 'mt-3 self-start whitespace-nowrap font-[family-name:var(--font-mono)] text-[11px] leading-none text-[var(--text-muted)]',
  odoD: 'block h-[1em] overflow-hidden',
  odoCol: 'flex flex-col will-change-transform transition-transform duration-700 ease-[var(--lb-spring)] [&>span]:block [&>span]:h-[1em] [&>span]:leading-none motion-reduce:transition-none',
  odoSep: 'block h-[1em] w-[.18em]',
};

function createLiveBento() {
  var REDUCE = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LINEAR_OK = window.CSS && CSS.supports && CSS.supports('transition-timing-function', 'linear(0, 1)');
  var nf = new Intl.NumberFormat('fr-FR'), fr = { format: function (v) { return nf.format(v).replace(/\u202F/g, '\u00A0'); } };

  /* Ressort amorti simulé (masse 1) : fonction d'easing + chaîne CSS linear() */
  function makeSpring(k, c) {
    var x = 0, v = 0, dt = 1 / 240, t = 0, pts = [0], rest = 0;
    while (t < 3) {
      v += (-k * (x - 1) - c * v) * dt; x += v * dt; t += dt; pts.push(x);
      if (Math.abs(x - 1) < 0.002 && Math.abs(v) < 0.02) { if (++rest > 12) break; } else rest = 0;
    }
    pts[pts.length - 1] = 1;
    var n = pts.length - 1;
    function ease(p) { if (p >= 1) return 1; if (p <= 0) return 0; var f = p * n, i = Math.floor(f); return pts[i] + (pts[i + 1] - pts[i]) * (f - i); }
    var css = [];
    for (var j = 0; j <= 48; j++) css.push(ease(j / 48).toFixed(3));
    return { ease: ease, dur: Math.round(t * 1000), css: LINEAR_OK ? 'linear(' + css.join(', ') + ')' : 'cubic-bezier(.34, 1.4, .64, 1)' };
  }
  var outCubic = function (p) { return 1 - Math.pow(1 - p, 3); };
  var inOut = function (p) { return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, p) { return a + (b - a) * p; }
  function rnd(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  /* ——— Horloge par case ——— */
  function Cell(el, bento) { this.el = el; this.b = bento; this.t = 0; this.q = []; this.tw = []; this.s = {}; this.visible = false; this.played = false; this.def = DEMOS[el.dataset.live]; }
  Cell.prototype.at = function (ms, fn) { this.q.push({ t: this.t + ms, fn: fn }); this.q.sort(function (a, b) { return a.t - b.t; }); this.b.kick(); };
  Cell.prototype.tween = function (ms, fn, ease) { this.tw.push({ t0: this.t, d: Math.max(1, ms), fn: fn, ease: ease || outCubic }); this.b.kick(); };
  Cell.prototype.step = function (dt) {
    this.t += dt;
    for (var i = 0; i < this.tw.length; i++) { var w = this.tw[i], k = clamp((this.t - w.t0) / w.d, 0, 1); w.fn(w.ease(k), k); if (k >= 1) { this.tw.splice(i--, 1); } }
    while (this.q.length && this.q[0].t <= this.t) this.q.shift().fn();
    var live = this.def.frame ? this.def.frame(this, dt) : false;
    return live || this.q.length > 0 || this.tw.length > 0;
  };
  Cell.prototype.clear = function () { this.q = []; this.tw = []; };
  Cell.prototype.start = function (delay) {
    var c = this; c.clear(); c.def.reset(c); c.played = true;
    if (REDUCE) { c.def.final(c); return; }
    c.at(delay || 0, function () { c.def.play(c); });
  };
  Cell.prototype.ambient = function () { return this.b.o.ambient && !REDUCE; };

  /* ——— Les six micro-démos ——— */
  var DEMOS = {};
  var q = function (c, k) { return c.el.querySelector('[data-lb="' + k + '"]'); };
  var qa = function (c, k) { return Array.prototype.slice.call(c.el.querySelectorAll('[data-lb="' + k + '"]')); };

  /* A · courbe qui se trace, puis lecture au survol */
  var VALS = [110, 127, 113, 106, 93, 98, 119, 123, 147, 143, 128, 102, 116, 149, 140, 162, 172, 155, 112, 129, 179, 162, 174, 195, 185, 125, 139, 207, 190, 188];
  var TOTAL = VALS.reduce(function (a, b) { return a + b; }, 0);
  var DAYS = VALS.map(function (_, i) { return new Date(2026, 9, 6 + i).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }); });
  DEMOS.chart = {
    init: function (c) {
      var s = c.s; s.plot = q(c, 'plot'); s.line = q(c, 'line'); s.area = q(c, 'area'); s.dot = q(c, 'dot'); s.tip = q(c, 'tip'); s.big = q(c, 'big'); s.guide = q(c, 'guide');
      s.p = 0; s.hover = -1;
      s.layout = function () {
        var w = s.plot.clientWidth, h = s.plot.clientHeight; if (!w) return;
        var top = 40, bot = 8, mn = Math.min.apply(null, VALS) * .8, mx = Math.max.apply(null, VALS);
        s.pts = VALS.map(function (v, i) { return [i / (VALS.length - 1) * w, top + (1 - (v - mn) / (mx - mn)) * (h - top - bot)]; });
        var P = s.pts, d = 'M' + P[0][0].toFixed(1) + ' ' + P[0][1].toFixed(1);
        for (var i = 0; i < P.length - 1; i++) {
          var p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
          d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
        }
        s.line.setAttribute('d', d); s.area.setAttribute('d', d + ' L' + w + ' ' + h + ' L0 ' + h + ' Z');
        s.len = s.line.getTotalLength(); s.w = w; s.h = h;
        s.line.style.strokeDasharray = s.len + ' ' + s.len;
        var g = q(c, 'grid'), html = '';
        for (var k = 0; k < 4; k++) { var y = top + k * (h - top - bot) / 3; html += '<line class="' + K.grid + '" x1="0" x2="' + w + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>'; }
        g.innerHTML = html; s.guide.setAttribute('y2', h);
        paint();
      };
      function place(x, y, idx) {
        s.dot.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
        var tw = s.tip.offsetWidth || 110, tx = clamp(x - tw / 2, 0, s.w - tw), ty = Math.max(0, y - 40);
        s.tip.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px)';
        q(c, 'tip-v').textContent = fr.format(VALS[idx]); q(c, 'tip-d').textContent = DAYS[idx];
      }
      function paint() {
        if (!s.pts) return;
        var p = s.p;
        s.line.style.strokeDashoffset = (s.len * (1 - p)).toFixed(1);
        var pt = s.line.getPointAtLength(s.len * p);
        s.area.style.clipPath = 'inset(0 ' + Math.max(0, s.w - pt.x).toFixed(1) + 'px 0 0)';
        s.dot.style.opacity = p > 0.01 ? 1 : 0;
        s.tip.style.opacity = p > 0.06 ? 1 : 0;
        var idx = s.hover >= 0 ? s.hover : Math.round(pt.x / s.w * (VALS.length - 1));
        if (s.hover >= 0) { var P = s.pts[s.hover]; place(P[0], P[1], idx); s.guide.setAttribute('x1', P[0]); s.guide.setAttribute('x2', P[0]); }
        else place(pt.x, pt.y, idx);
        s.big.textContent = fr.format(Math.round(TOTAL * p));
      }
      s.paint = paint;
      s.ro = new ResizeObserver(s.layout); s.ro.observe(s.plot);
      s.move = function (e) {
        if (s.p < 1) return;
        var r = s.plot.getBoundingClientRect(), i = Math.round(clamp((e.clientX - r.left) / r.width, 0, 1) * (VALS.length - 1));
        if (i !== s.hover) { s.hover = i; s.plot.classList.add('is-scrub'); paint(); }
      };
      s.leave = function () { s.hover = -1; s.plot.classList.remove('is-scrub'); paint(); };
      s.plot.addEventListener('pointermove', s.move); s.plot.addEventListener('pointerleave', s.leave);
    },
    reset: function (c) { c.s.p = 0; c.s.hover = -1; c.s.plot.classList.remove('is-done', 'is-scrub'); q(c, 'badge').style.opacity = 0; c.s.paint(); },
    play: function (c) {
      var b = q(c, 'badge'), sp = c.b.spring;
      c.tween(1700, function (e) { c.s.p = e; c.s.paint(); }, inOut);
      c.at(1500, function () { c.tween(sp.dur, function (e, k) { b.style.opacity = clamp(k * 3, 0, 1); b.style.transform = 'translateY(' + ((1 - e) * 6).toFixed(2) + 'px) scale(' + lerp(.86, 1, e).toFixed(3) + ')'; }, sp.ease); });
      c.at(1750, function () { c.s.plot.classList.add('is-done'); });
    },
    final: function (c) { c.s.p = 1; c.s.paint(); q(c, 'badge').style.opacity = 1; q(c, 'badge').style.transform = 'none'; },
  };

  /* B · appel entrant : sonnerie, décroché, transcription, rendez-vous */
  DEMOS.call = {
    init: function (c) {
      var w = q(c, 'wave'), h = ''; for (var i = 0; i < 36; i++) h += '<i class="' + K.wave + '"></i>'; w.innerHTML = h;
      c.s.bars = Array.prototype.slice.call(w.children); c.s.amp = 0.08; c.s.target = 0.08; c.s.ph = 0; c.s.sec = 0; c.s.timer = false;
      c.s.msgs = qa(c, 'msg').map(function (li) { var b = li.querySelector('[data-b]'); b._me = li.hasAttribute('data-me'); b._dots = li.querySelector('[data-dots]'); return b; });
    },
    setState: function (c, st) { q(c, 'call').dataset.state = st; },
    reset: function (c) {
      var s = c.s; this.setState(c, 'ring'); q(c, 'call').classList.remove('is-on');
      q(c, 'status').textContent = 'Appel entrant'; q(c, 'time').textContent = '00:00'; s.sec = 0; s.timer = false; s.amp = s.target = 0.08; s.speak = 0;
      var a = q(c, 'actions'); a.style.opacity = 1; a.style.transform = 'none'; a.style.visibility = 'visible';
      var d = q(c, 'done'); d.style.opacity = 0; d.style.transform = 'scale(.9)';
      var sl = q(c, 'slot'); sl.style.opacity = 0; sl.style.transform = 'translateY(8px)'; q(c, 'slot-new').style.opacity = 0; q(c, 'slot-old').style.textDecorationLine = 'none';
      s.msgs.forEach(function (m) { m.style.opacity = 0; m.style.clipPath = ''; m.style.color = ''; m.style.transform = ''; m._dots.style.opacity = 0; });
      DEMOS.call.paintWave(c, 0);
    },
    reveal: function (c, i, at) {
      var m = c.s.msgs[i], me = m._me, dots = m._dots, sp = c.b.spring;
      function clip(e) {
        var W = m.offsetWidth, H = m.offsetHeight, rw = lerp(W - 64, 0, e), rh = lerp(H - 36, 0, e);
        return me ? 'inset(0 0 ' + rh.toFixed(1) + 'px ' + rw.toFixed(1) + 'px round 12px)' : 'inset(0 ' + rw.toFixed(1) + 'px ' + rh.toFixed(1) + 'px 0 round 12px)';
      }
      c.at(at, function () {
        m.style.clipPath = clip(0); m.style.color = 'transparent'; dots.style.opacity = 1;
        c.tween(220, function (e) { m.style.opacity = e; m.style.transform = 'translateY(' + ((1 - e) * 6).toFixed(1) + 'px)'; });
        c.s.target = me ? 0.12 : 0.85; c.s.speak = me ? 0 : 1;
      });
      c.at(at + 760, function () {
        dots.style.opacity = 0; m.style.color = '';
        c.tween(sp.dur, function (e) { m.style.clipPath = clip(Math.min(e, 1.04)); }, sp.ease);
        c.at(sp.dur, function () { m.style.clipPath = ''; });
        c.s.target = me ? 0.9 : 0.15;
      });
    },
    play: function (c) {
      var self = this, s = c.s, a = q(c, 'actions'), yes = q(c, 'yes'), d = q(c, 'done'), sp = c.b.spring;
      q(c, 'call').classList.add('is-on');
      c.at(1500, function () { c.tween(260, function (e, k) { yes.style.transform = 'scale(' + (1 - Math.sin(k * Math.PI) * .07).toFixed(3) + ')'; }); });
      c.at(1800, function () {
        self.setState(c, 'live'); q(c, 'status').textContent = 'En ligne · agent Clara'; s.timer = true; s.target = .3;
        c.tween(240, function (e) { a.style.opacity = 1 - e; a.style.transform = 'translateY(' + (e * 8).toFixed(1) + 'px)'; });
        c.at(240, function () { a.style.visibility = 'hidden'; });
      });
      self.reveal(c, 0, 2200);
      self.reveal(c, 1, 3500);
      self.reveal(c, 2, 4900);
      c.at(4500, function () { var sl = q(c, 'slot'); c.tween(sp.dur, function (e, k) { sl.style.opacity = clamp(k * 3, 0, 1); sl.style.transform = 'translateY(' + ((1 - e) * 8).toFixed(1) + 'px)'; }, sp.ease); });
      c.at(5300, function () { q(c, 'slot-old').style.textDecorationLine = 'line-through'; var nw = q(c, 'slot-new'); c.tween(360, function (e) { nw.style.opacity = e; nw.style.transform = 'translateX(' + ((1 - e) * -6).toFixed(1) + 'px)'; }); });
      c.at(6200, function () {
        self.setState(c, 'done'); q(c, 'status').textContent = 'Appel terminé'; s.timer = false; s.target = 0.5;
        c.tween(sp.dur, function (e, k) { d.style.opacity = clamp(k * 3, 0, 1); d.style.transform = 'scale(' + lerp(.9, 1, e).toFixed(3) + ')'; }, sp.ease);
      });
      if (c.ambient() && !c.b.thumb) c.at(11500, function () { c.tween(320, function (e) { q(c, 'call').style.opacity = 1 - e; }); c.at(340, function () { self.reset(c); q(c, 'call').style.opacity = 1; self.play(c); }); });
    },
    final: function (c) {
      this.setState(c, 'done'); q(c, 'status').textContent = 'Appel terminé'; q(c, 'time').textContent = '00:42';
      q(c, 'actions').style.visibility = 'hidden'; q(c, 'slot').style.opacity = 1; q(c, 'slot').style.transform = 'none'; q(c, 'slot-new').style.opacity = 1; q(c, 'slot-old').style.textDecorationLine = 'line-through'; var d = q(c, 'done'); d.style.opacity = 1; d.style.transform = 'none';
      c.s.msgs.forEach(function (m) { m.style.opacity = 1; m.style.clipPath = ''; m.style.transform = 'none'; });
      c.s.amp = .5; this.paintWave(c, 2400);
    },
    paintWave: function (c, t) {
      var s = c.s;
      s.bars.forEach(function (b, i) {
        var n = Math.sin(t * .011 + i * .9) * .5 + Math.sin(t * .023 + i * 2.1) * .3 + Math.sin(t * .005 + i * .35) * .2;
        var env = Math.sin((i + .5) / s.bars.length * Math.PI);
        b.style.transform = 'scaleY(' + clamp(.08 + s.amp * env * (.55 + .45 * n), .06, 1).toFixed(3) + ')';
      });
    },
    frame: function (c, dt) {
      var s = c.s; if (!q(c, 'call').classList.contains('is-on')) return false;
      if (q(c, 'call').dataset.state !== 'done') s.ph += dt;
      s.amp += (s.target - s.amp) * Math.min(1, dt / 160);
      this.paintWave(c, s.ph);
      if (s.timer) { var before = Math.floor(s.sec); s.sec += dt / 1000 * 6; if (Math.floor(s.sec) !== before) { var x = Math.floor(s.sec); q(c, 'time').textContent = String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0'); } }
      return true;
    },
  };

  /* C · curseurs multijoueurs */
  DEMOS.cursors = {
    init: function (c) {
      var s = c.s; s.board = q(c, 'board'); s.curs = qa(c, 'cur'); s.nodes = qa(c, 'node'); s.links = qa(c, 'link'); s.pos = [[0, 0], [0, 0], [0, 0]]; s.drag = [0, 0];
      s.rand = rnd(7);
      s.ro = new ResizeObserver(function () { s.W = s.board.clientWidth; s.H = s.board.clientHeight; DEMOS.cursors.links(c); }); s.ro.observe(s.board);
    },
    links: function (c) {
      var s = c.s, B = s.board.getBoundingClientRect(); if (!B.width) return;
      function r(n) { var x = n.getBoundingClientRect(); return { l: x.left - B.left, r: x.right - B.left, t: x.top - B.top, b: x.bottom - B.top, cx: (x.left + x.right) / 2 - B.left, cy: (x.top + x.bottom) / 2 - B.top }; }
      var a = r(s.nodes[0]), b = r(s.nodes[1]), d = r(s.nodes[2]);
      s.links[0].setAttribute('d', 'M' + a.r + ' ' + a.cy + ' C' + (a.r + 40) + ' ' + a.cy + ' ' + (b.l - 40) + ' ' + b.cy + ' ' + b.l + ' ' + b.cy);
      s.links[1].setAttribute('d', 'M' + a.cx + ' ' + a.b + ' C' + a.cx + ' ' + (d.cy + 4) + ' ' + (d.l - 40) + ' ' + d.cy + ' ' + d.l + ' ' + d.cy);
    },
    put: function (c, i, x, y) { c.s.pos[i] = [x, y]; c.s.curs[i].style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)'; },
    move: function (c, i, x, y, ms, ease) { var self = this, f = c.s.pos[i].slice(); c.tween(ms, function (e) { self.put(c, i, lerp(f[0], x, e), lerp(f[1], y, e)); }, ease || inOut); },
    nodeAt: function (c, i, fx, fy) { var n = c.s.nodes[i]; return [n.offsetLeft + n.offsetWidth * fx, n.offsetTop + n.offsetHeight * fy]; },
    reset: function (c) {
      var s = c.s, W = s.W || s.board.clientWidth, H = s.H || s.board.clientHeight;
      this.put(c, 0, -24, H * .3); this.put(c, 1, W * .2, H + 24); this.put(c, 2, W + 24, H * .5);
      s.nodes.forEach(function (n) { n.removeAttribute('data-sel'); n.style.transform = ''; });
      var cm = q(c, 'comment'); cm.style.opacity = 0; cm.style.transform = 'scale(.6)';
      var p = q(c, 'presence'); p.style.opacity = 0; p.style.transform = 'translateY(6px)';
      q(c, 'marquee').style.opacity = 0; s.dragging = false; this.links(c);
    },
    box: function (c) {
      var n1 = c.s.nodes[1], n2 = c.s.nodes[2];
      return { x0: Math.min(n1.offsetLeft, n2.offsetLeft) - 8, y0: n1.offsetTop - 6, x1: Math.max(n1.offsetLeft + n1.offsetWidth, n2.offsetLeft + n2.offsetWidth) + 8, y1: n2.offsetTop + n2.offsetHeight + 8 };
    },
    play: function (c) {
      var self = this, s = c.s, W = s.W || s.board.clientWidth, H = s.H || s.board.clientHeight, sp = c.b.spring, n0 = s.nodes[0]; s.W = W; s.H = H;
      var t0 = self.nodeAt(c, 0, .62, .62), bx = self.box(c);
      self.move(c, 0, t0[0], t0[1], 900); self.move(c, 1, W * .07, H * .55, 1100); self.move(c, 2, W * .78, H * .72, 1000);
      c.at(950, function () { n0.dataset.sel = 'v'; c.tween(220, function (e, k) { s.curs[0].firstChild.style.transform = 'scale(' + (1 - Math.sin(k * Math.PI) * .18).toFixed(3) + ')'; }); });
      c.at(1250, function () {
        var dx = Math.min(20, W * .05), dy = 10, f = s.pos[0].slice();
        c.tween(800, function (e) { n0.style.transform = 'translate(' + (dx * e).toFixed(1) + 'px,' + (dy * e).toFixed(1) + 'px)'; self.put(c, 0, f[0] + dx * e, f[1] + dy * e); self.links(c); }, inOut);
      });
      c.at(1700, function () { var cm = q(c, 'comment'); c.tween(sp.dur, function (e, k) { cm.style.opacity = clamp(k * 3, 0, 1); cm.style.transform = 'scale(' + lerp(.6, 1, e).toFixed(3) + ')'; }, sp.ease); });
      c.at(2200, function () {
        var mq = q(c, 'marquee');
        self.move(c, 2, bx.x1, bx.y1, 450, outCubic);
        c.at(470, function () {
          mq.style.opacity = 1;
          c.tween(700, function (e) {
            var cx = lerp(bx.x1, bx.x0, e), cy = lerp(bx.y1, bx.y0, e); self.put(c, 2, cx, cy);
            mq.style.left = cx + 'px'; mq.style.top = cy + 'px'; mq.style.width = (bx.x1 - cx) + 'px'; mq.style.height = (bx.y1 - cy) + 'px';
          }, inOut);
          c.at(720, function () { s.nodes[1].dataset.sel = 'p'; s.nodes[2].dataset.sel = 'p'; c.tween(260, function (e) { mq.style.opacity = 1 - e; }); });
          c.at(1000, function () { self.move(c, 2, bx.x0 + 22, (bx.y0 + bx.y1) / 2 - 8, 800); });
        });
      });
      c.at(3300, function () { var p = q(c, 'presence'); c.tween(sp.dur, function (e, k) { p.style.opacity = clamp(k * 3, 0, 1); p.style.transform = 'translateY(' + ((1 - e) * 6).toFixed(1) + 'px)'; }, sp.ease); });
      if (c.ambient() && !c.b.thumb) c.at(4800, function () { s.home = s.pos.map(function (p) { return p.slice(); }); self.wander(c); });
    },
    wander: function (c) {
      var self = this, s = c.s, i = Math.floor(s.rand() * 3), h = s.home[i];
      var x = clamp(h[0] + (s.rand() - .5) * 36, 8, s.W - 70), y = clamp(h[1] + (s.rand() - .5) * 24, 6, s.H - (i === 1 ? 72 : 36));
      self.move(c, i, x, y, 900 + s.rand() * 600);
      c.at(900 + s.rand() * 1100, function () { self.wander(c); });
    },
    final: function (c) {
      var s = c.s, W = s.W || s.board.clientWidth, H = s.H || s.board.clientHeight, bx = this.box(c), n0 = s.nodes[0], dx = Math.min(20, W * .05);
      n0.style.transform = 'translate(' + dx + 'px,10px)'; this.links(c);
      var t0 = this.nodeAt(c, 0, .62, .62);
      this.put(c, 0, t0[0] + dx, t0[1] + 10); this.put(c, 1, W * .07, H * .55); this.put(c, 2, bx.x0 + 22, (bx.y0 + bx.y1) / 2 - 8);
      n0.dataset.sel = 'v'; s.nodes[1].dataset.sel = 'p'; s.nodes[2].dataset.sel = 'p';
      var cm = q(c, 'comment'); cm.style.opacity = 1; cm.style.transform = 'none';
      var p = q(c, 'presence'); p.style.opacity = 1; p.style.transform = 'none';
    },
  };

  /* D · notifications qui s'empilent */
  var IC = {
    cal: '<path d="M5 5h14v15H5zM5 9.5h14M9 3v4M15 3v4"/><path d="M9.5 14.5l2 2 3.5-3.5"/>',
    fwd: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/><path d="M15 3h6v6M21 3l-6 6"/>',
    gauge: '<path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l3.5-4.5"/><path d="M4 20h16"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16v4M17 18h4"/>',
    paid: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 11.5l2 2 4-4"/>',
  };
  var NOTES = [
    ['green', 'cal', 'Rendez-vous confirmé', 'Camille M. · ven. 13 nov.'],
    ['blue', 'fwd', 'Appel transféré', 'Vers Julien · demande de devis'],
    ['amber', 'gauge', 'Forfait utilisé à 80 %', 'Rechargez avant le 30 nov.'],
    ['violet', 'spark', 'Résumé du matin prêt', '14 appels analysés'],
    ['green', 'paid', 'Facture payée', 'F-2026-114 · 189,00 €'],
  ];
  DEMOS.notifs = {
    init: function (c) { c.s.stack = q(c, 'stack'); c.s.n = 0; c.s.i = 0; c.s.clock = 581; },
    reset: function (c) { c.s.stack.innerHTML = ''; c.s.n = 0; c.s.i = 0; c.s.clock = 581; this.count(c); },
    count: function (c) { var n = c.s.n; q(c, 'ncount').textContent = (n > 9 ? '9+' : n) + (n > 1 ? ' nouvelles' : ' nouvelle'); },
    layout: function (c) {
      Array.prototype.forEach.call(c.s.stack.children, function (el, d) {
        el.style.transform = 'translateY(' + (d * 72) + 'px) scale(' + (d > 2 ? .96 : 1) + ')';
        el.style.opacity = d > 2 ? 0 : d === 2 ? .5 : 1;
        el.style.zIndex = 10 - d;
      });
    },
    make: function (c) {
      var n = NOTES[c.s.i++ % NOTES.length], el = document.createElement('div');
      el.className = K.note;
      el.innerHTML = '<span class="' + K.noteIc + ' ' + K.tone[n[0]] + '"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + IC[n[1]] + '</svg></span><span class="' + K.noteT + '"><b>' + n[2] + '</b><span>' + n[3] + '</span></span><span class="' + K.noteWhen + '">' + String(Math.floor(c.s.clock / 60)).padStart(2, '0') + ':' + String(c.s.clock % 60).padStart(2, '0') + '</span>';
      c.s.clock += 2 + (c.s.i % 3);
      return el;
    },
    push: function (c, instant) {
      var s = c.s, el = this.make(c), dur = Math.round(c.b.spring.dur / c.b.o.speed);
      c.el.style.setProperty('--lb-dur', dur + 'ms'); c.el.style.setProperty('--lb-dur-o', Math.round(300 / c.b.o.speed) + 'ms');
      var enter = K.enter.split(' '); if (!instant) el.classList.add.apply(el.classList, enter);
      s.stack.insertBefore(el, s.stack.firstChild);
      if (!instant) { void el.offsetWidth; el.classList.remove.apply(el.classList, enter); }
      this.layout(c);
      while (s.stack.children.length > 4) s.stack.removeChild(s.stack.lastChild);
      s.n++; this.count(c);
    },
    play: function (c) {
      var self = this;
      self.push(c); c.at(650, function () { self.push(c); }); c.at(1300, function () { self.push(c); });
      if (c.ambient() && !c.b.thumb) { var loop = function () { self.push(c); c.at(2800, loop); }; c.at(3600, loop); }
    },
    final: function (c) { this.push(c, true); this.push(c, true); this.push(c, true); },
  };

  /* E · compteur à rouleaux + barres */
  var BARS = [42, 55, 48, 61, 58, 70, 52, 66, 74, 69, 80, 77, 88, 96];
  DEMOS.counter = {
    init: function (c) {
      var s = c.s; s.odo = q(c, 'odo'); s.base = parseInt(s.odo.dataset.value, 10) || 12480; s.val = s.base;
      var h = ''; BARS.forEach(function (v) { h += '<i class="' + K.bar + '" style="height:' + v + '%"></i>'; }); q(c, 'bars').innerHTML = h;
      s.bars = Array.prototype.slice.call(q(c, 'bars').children); s.cols = [];
    },
    build: function (c, v) {
      var s = c.s, str = fr.format(v), h = '';
      for (var i = 0; i < str.length; i++) {
        if (/\d/.test(str[i])) { var col = ''; for (var k = 0; k < 20; k++) col += '<span>' + (k % 10) + '</span>'; h += '<span class="' + K.odoD + '"><span class="' + K.odoCol + '" data-col>' + col + '</span></span>'; }
        else h += '<span class="' + K.odoSep + '"></span>';
      }
      s.odo.innerHTML = h; s.str = str;
      s.cols = Array.prototype.slice.call(s.odo.querySelectorAll('[data-col]')).map(function (el) { return { el: el, i: 0 }; });
    },
    set: function (c, i, idx, animate, delay) {
      var col = c.s.cols[i]; col.i = idx;
      col.el.style.transitionDuration = animate ? Math.round((c.b.spring.dur + 400) / c.b.o.speed) + 'ms' : '0ms';
      col.el.style.transitionDelay = animate && delay ? Math.round(delay / c.b.o.speed) + 'ms' : '0ms';
      col.el.style.transform = 'translateY(' + (-idx) + 'em)';
    },
    show: function (c, v, intro) {
      var self = this, s = c.s, str = fr.format(v);
      if (!s.cols.length || str.length !== s.str.length) { self.build(c, v); }
      var digits = str.replace(/\D/g, '');
      s.cols.forEach(function (col, i) {
        var n = +digits[i], cur = col.i % 10;
        if (intro) { self.set(c, i, 0, false); void col.el.offsetWidth; self.set(c, i, n + 10, true, i * 70); }
        else if (n !== cur) { self.set(c, i, n > cur ? n : n + 10, true); }
        var target = col.i;
        if (target >= 10) c.at(c.b.spring.dur + 400 + (intro ? i * 70 : 0) + 40, function () { if (col.i === target) self.set(c, i, target - 10, false); });
      });
      s.val = v;
    },
    reset: function (c) { var s = c.s; s.val = s.base; s.cols = []; this.build(c, s.base); s.cols.forEach(function (col, i) { DEMOS.counter.set(c, i, 0, false); }); s.bars.forEach(function (b) { b.style.transform = 'scaleY(0)'; }); q(c, 'count').classList.remove('is-on'); },
    play: function (c) {
      var self = this, s = c.s, sp = c.b.spring;
      self.show(c, s.base, true);
      c.tween(sp.dur + BARS.length * 45, function (_, k) {
        var t = k * (sp.dur + BARS.length * 45);
        s.bars.forEach(function (b, i) { b.style.transform = 'scaleY(' + sp.ease(clamp((t - i * 45) / sp.dur, 0, 1)).toFixed(3) + ')'; });
      }, function (p) { return p; });
      c.at(900, function () { q(c, 'count').classList.add('is-on'); });
      if (c.ambient() && !c.b.thumb) { var loop = function () { self.show(c, s.val + 1 + Math.floor(Math.random() * 3)); var last = s.bars[s.bars.length - 1]; c.tween(500, function (e, k) { last.style.transform = 'scaleY(' + (1 + Math.sin(k * Math.PI) * .06).toFixed(3) + ')'; }); c.at(3200, loop); }; c.at(3400, loop); }
    },
    final: function (c) { var s = c.s; this.build(c, s.base); var d = s.str.replace(/\D/g, ''); s.cols.forEach(function (col, i) { DEMOS.counter.set(c, i, +d[i], false); }); s.bars.forEach(function (b) { b.style.transform = 'none'; }); },
  };

  /* F · latence en cascade */
  var MAXMS = 400;
  DEMOS.latency = {
    init: function (c) { c.s.segs = qa(c, 'seg'); c.s.ms = qa(c, 'lms'); c.s.cur = [0, 0, 0]; c.s.rand = rnd(11); },
    paint: function (c, v, fill) {
      var start = 0, tot = 0;
      c.s.segs.forEach(function (seg, i) {
        seg.style.left = (start / MAXMS * 100).toFixed(2) + '%'; seg.style.width = (v[i] * fill[i] / MAXMS * 100).toFixed(2) + '%';
        c.s.ms[i].textContent = Math.round(v[i] * fill[i]); start += v[i]; tot += v[i] * fill[i];
      });
      q(c, 'ltotal').textContent = Math.round(tot);
    },
    reset: function (c) { c.s.cur = [90, 140, 50]; this.paint(c, c.s.cur, [0, 0, 0]); q(c, 'lcall').textContent = 'Dernier appel · p95 410\u00A0ms'; },
    play: function (c) {
      var self = this, s = c.s, f = [0, 0, 0];
      [0, 1, 2].forEach(function (i) { c.at(i * 380, function () { c.tween(520, function (e) { f[i] = e; self.paint(c, s.cur, f); }, outCubic); }); });
      if (c.ambient() && !c.b.thumb) {
        var n = 1;
        var loop = function () {
          var from = s.cur.slice(), to = [78 + s.rand() * 26, 118 + s.rand() * 50, 40 + s.rand() * 20].map(Math.round);
          c.tween(Math.round(c.b.spring.dur * 1.2), function (e) { s.cur = from.map(function (a, i) { return lerp(a, to[i], e); }); self.paint(c, s.cur, [1, 1, 1]); }, c.b.spring.ease);
          n++; q(c, 'lcall').textContent = 'Appel n° ' + n + ' · p95 410\u00A0ms';
          c.at(3600, loop);
        };
        c.at(4200, loop);
      }
    },
    final: function (c) { this.paint(c, [90, 140, 50], [1, 1, 1]); },
  };

  /* ——— Montage ——— */
  function mount(root) {
    if (root._liveBento) root._liveBento.destroy();
    var d = root.dataset;
    var bento = {
      o: { speed: clamp(parseFloat(d.speed) || 1, .25, 4), stagger: parseFloat(d.stagger) || 0, ambient: d.ambient !== 'false', repeat: d.repeat === 'true' },
      thumb: root.hasAttribute('data-thumb'), raf: 0, last: 0, dead: false,
    };
    bento.spring = makeSpring(parseFloat(d.stiffness) || 180, parseFloat(d.damping) || 18);
    root.style.setProperty('--lb-spring', bento.spring.css);
    root.dataset.halo = d.halo === 'false' ? 'false' : 'true';
    var cells = Array.prototype.slice.call(root.querySelectorAll('[data-live]')).filter(function (el) { return DEMOS[el.dataset.live]; }).map(function (el) { return new Cell(el, bento); });
    function loop(now) {
      bento.raf = 0; if (bento.dead) return;
      var dt = Math.min(250, now - bento.last); bento.last = now; var busy = false;
      cells.forEach(function (c) { if (c.visible && !document.hidden && c.played) busy = c.step(dt * bento.o.speed) || busy; });
      if (busy) bento.raf = requestAnimationFrame(loop);
    }
    bento.kick = function () { if (!bento.raf && !bento.dead) { bento.last = performance.now(); bento.raf = requestAnimationFrame(loop); } };
    cells.forEach(function (c) { c.def.init(c); c.def.reset(c); if (REDUCE) { c.played = true; c.def.final(c); } });

    function pauseAnims(c, on) { if (!c.el.getAnimations) return; c.el.getAnimations({ subtree: true }).forEach(function (a) { try { on ? a.pause() : a.play(); } catch (e) {} }); }
    var io = new IntersectionObserver(function (entries) {
      var k = 0;
      entries.slice().sort(function (a, b) { return cells.findIndex(function (c) { return c.el === a.target; }) - cells.findIndex(function (c) { return c.el === b.target; }); }).forEach(function (e) {
        var c = cells.find(function (x) { return x.el === e.target; }); if (!c) return;
        if (e.isIntersecting) {
          c.visible = true; c.el.classList.remove('is-paused'); pauseAnims(c, false);
          if (!c.played) c.start((k++) * bento.o.stagger);
          bento.kick();
        } else if (c.visible) {
          c.visible = false; c.el.classList.add('is-paused'); pauseAnims(c, true);
          if (bento.o.repeat) { c.clear(); c.played = false; c.def.reset(c); }
        }
      });
    }, { threshold: 0.3 });
    cells.forEach(function (c) { io.observe(c.el); });

    function onVis() { if (!document.hidden) bento.kick(); }
    document.addEventListener('visibilitychange', onVis);
    function halo(e) {
      if (root.dataset.halo !== 'true' || e.pointerType !== 'mouse') return;
      var cell = e.target.closest && e.target.closest('[data-live]'); if (!cell) return;
      var r = cell.getBoundingClientRect(); cell.style.setProperty('--mx', (e.clientX - r.left) + 'px'); cell.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }
    root.addEventListener('pointermove', halo);

    root._liveBento = {
      replay: function () { var k = 0; cells.forEach(function (c) { c.played = false; c.clear(); c.def.reset(c); if (c.visible) c.start((k++) * bento.o.stagger); }); bento.kick(); },
      destroy: function () {
        bento.dead = true; cancelAnimationFrame(bento.raf); io.disconnect(); document.removeEventListener('visibilitychange', onVis); root.removeEventListener('pointermove', halo);
        cells.forEach(function (c) { if (c.s.ro) c.s.ro.disconnect(); if (c.s.plot) { c.s.plot.removeEventListener('pointermove', c.s.move); c.s.plot.removeEventListener('pointerleave', c.s.leave); } });
        root._liveBento = null;
      },
    };
    return root._liveBento;
  }
  return mount;
}

const ARROW = <svg width="16" height="16" viewBox="0 0 16 16" className="block overflow-visible"><path d="M2 1.5l11 5.2-4.6 1.4-2.1 4.4z" className="stroke-[var(--surface)] [stroke-linejoin:round] [stroke-width:1.25]" /></svg>;
const cell = 'group/cell relative isolate flex min-w-0 flex-col gap-6 overflow-hidden rounded-[var(--lb-radius)] border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors duration-200 md:p-6 '
  + "before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:opacity-0 before:transition-opacity before:duration-300 before:content-[''] before:bg-[radial-gradient(360px_circle_at_var(--mx,50%)_var(--my,50%),var(--glow),transparent_70%)] "
  + 'group-data-[halo=true]/lb:hover:before:opacity-100 [@media(hover:hover)]:group-data-[halo=true]/lb:hover:border-[var(--border-control)]';
const art = 'flex min-h-0 flex-1 flex-col';
const k = 'font-[family-name:var(--font-mono)] text-xs leading-4 tracking-[.02em] text-[var(--text-muted)]';
const big = 'font-semibold leading-none tracking-[-.035em] tabular-nums text-[var(--text-strong)] text-[clamp(2rem,1.6rem+1.4vw,2.5rem)]';
const msgB = 'relative max-w-[86%] rounded-xl border px-3 py-2 text-sm leading-5 text-[var(--text-strong)] text-pretty';
const dots = 'absolute top-0 flex h-9 items-center gap-1 px-3.5 opacity-0 [&>i]:h-1.5 [&>i]:w-1.5 [&>i]:rounded-full [&>i]:bg-[var(--text-muted)] [&>i]:animate-pulse [&>i:nth-child(2)]:[animation-delay:.15s] [&>i:nth-child(3)]:[animation-delay:.3s] motion-reduce:[&>i]:animate-none';
const Text = ({ t, children }) => (
  <div className="grid max-w-[34rem] gap-1.5">
    <h3 className="m-0 text-balance text-[17px] font-semibold leading-[1.35] tracking-[-.01em] text-[var(--text-strong)]">{t}</h3>
    <p className="m-0 text-pretty text-[15px] leading-normal text-[var(--text-muted)]">{children}</p>
  </div>
);
const Cur = ({ tone, name, children }) => {
  const c = { v: ['[&_path]:fill-[var(--tint-violet-fg)]', 'border-[var(--tint-violet-border)] bg-[var(--tint-violet-bg)] text-[var(--tint-violet-fg)]'],
    g: ['[&_path]:fill-[var(--tint-green-fg)]', 'border-[var(--tint-green-border)] bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]'],
    p: ['[&_path]:fill-[var(--tint-pink-fg)]', 'border-[var(--tint-pink-border)] bg-[var(--tint-pink-bg)] text-[var(--tint-pink-fg)]'] }[tone];
  return (
    <span data-lb="cur" className={`pointer-events-none absolute left-0 top-0 z-[2] block will-change-transform ${c[0]}`}>
      {ARROW}
      <b className={`absolute left-3 top-4 inline-flex h-5 items-center whitespace-nowrap rounded-full border px-2 text-[11px] font-semibold leading-none ${c[1]}`}>{name}</b>
      {children && <em data-lb="comment" className={`absolute left-3 top-10 inline-flex h-7 origin-top-left items-center whitespace-nowrap rounded-lg rounded-tl-sm border px-2.5 text-xs font-medium not-italic opacity-0 ${c[1]}`}>{children}</em>}
    </span>
  );
};
const Node = ({ x, y, children }) => (
  <span data-lb="node" style={{ left: x, top: y }} className="absolute inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-2.5 pr-3 text-[13px] font-medium text-[var(--text-strong)] will-change-transform transition-shadow duration-200 data-[sel=v]:shadow-[0_0_0_1.5px_var(--tint-violet-fg)] data-[sel=p]:shadow-[0_0_0_1.5px_var(--tint-pink-fg)]">
    <i className="h-2 w-2 rounded-sm bg-[var(--text-muted)]" />{children}
  </span>
);
const Msg = ({ me, children }) => (
  <li data-lb="msg" data-me={me ? '' : undefined} className={`flex ${me ? 'justify-end' : ''}`}>
    <span data-b className={`${msgB} ${me ? 'rounded-br border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)]' : 'rounded-bl border-[var(--border)] bg-[var(--surface)]'}`}>
      {children}<i data-dots className={`${dots} ${me ? 'right-0' : 'left-0'}`}><i /><i /><i /></i>
    </span>
  </li>
);
const Row = ({ label, tone, ms }) => (
  <div className="grid grid-cols-[92px_minmax(0,1fr)_36px] items-center gap-2 text-[13px] text-[var(--text-muted)] sm:grid-cols-[104px_minmax(0,1fr)_40px] sm:gap-3">
    <span>{label}</span>
    <span className="relative h-3 rounded bg-[var(--scale-track)]"><i data-lb="seg" className={`absolute inset-y-0 left-0 w-0 rounded ${tone}`} /></span>
    <b data-lb="lms" className="text-right font-[family-name:var(--font-mono)] text-[13px] font-semibold leading-none tabular-nums text-[var(--text-strong)]">{ms}</b>
  </div>
);

/** @param {LiveBentoProps} props */
export function LiveBento({
  eyebrow = 'Sillage · agents vocaux',
  title = 'Votre standard ne dort jamais.',
  lead = 'Six choses que vos agents font pendant que vous travaillez, montrées telles qu’elles se passent.',
  header = true,
  speed = 1,
  stagger = 120,
  ambient = true,
  repeat = false,
  halo = true,
  stiffness = 180,
  damping = 18,
  gap = 16,
  radius = 16,
  className = '',
}) {
  const ref = useRef(null);
  useEffect(() => {
    const api = createLiveBento()(ref.current);
    return () => api && api.destroy();
  }, [speed, stagger, ambient, repeat, halo, stiffness, damping]);

  return (
    <section aria-labelledby="lb-title" className={`mx-auto max-w-[1200px] px-4 py-16 font-[family-name:var(--font-sans)] text-[var(--text)] md:px-8 md:py-24 ${className}`}>
      {header && (
        <header className="mb-10 grid max-w-[40rem] gap-3">
          <p className="m-0 font-[family-name:var(--font-mono)] text-xs font-medium uppercase leading-[18px] tracking-[.04em] text-[var(--text-muted)]">{eyebrow}</p>
          <h2 id="lb-title" className="m-0 text-balance text-[clamp(2rem,1.4rem+2.6vw,3rem)] font-semibold leading-[1.06] tracking-[-.035em] text-[var(--text-strong)]">{title}</h2>
          <p className="m-0 max-w-[34rem] text-pretty text-[17px] leading-relaxed text-[var(--text-muted)]">{lead}</p>
        </header>
      )}

      <div ref={ref} data-live-bento data-speed={speed} data-stagger={stagger} data-ambient={String(ambient)} data-repeat={String(repeat)} data-halo={String(halo)} data-stiffness={stiffness} data-damping={damping}
        style={{ '--lb-gap': `${gap}px`, '--lb-radius': `${radius}px` }}
        className="group/lb grid grid-cols-1 gap-[var(--lb-gap)] sm:grid-cols-2 lg:grid-cols-6">

        {/* A · courbe qui se trace */}
        <article data-live="chart" className={`${cell} sm:col-span-2 lg:col-[1/5] lg:row-[1]`}>
          <div className={art} aria-hidden="true">
            <div className="grid gap-3">
              <div className="flex items-end justify-between gap-3">
                <div className="grid gap-1"><span className={k}>Appels traités · 30 jours</span><b data-lb="big" className={big}>4 288</b></div>
                <span data-lb="badge" className="inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full border border-[var(--tint-green-border)] bg-[var(--tint-green-bg)] px-2 text-[13px] font-medium tabular-nums text-[var(--tint-green-fg)]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg>+38,4&nbsp;%
                </span>
              </div>
              <div data-lb="plot" className="group/plot relative h-44 cursor-crosshair touch-pan-y">
                <svg data-lb="svg" className="absolute inset-0 h-full w-full overflow-visible">
                  <g data-lb="grid" />
                  <path data-lb="area" className="fill-[var(--accent-subtle)] opacity-90" />
                  <path data-lb="line" className="fill-none stroke-[var(--accent)] [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]" />
                  <line data-lb="guide" y1="0" className="stroke-[var(--border-control)] opacity-0 transition-opacity [stroke-dasharray:3_3] group-[.is-scrub]/plot:opacity-100" />
                </svg>
                <span data-lb="dot" className="absolute left-0 top-0 -ml-1.5 -mt-1.5 h-3 w-3 rounded-full border-2 border-[var(--accent)] bg-[var(--surface)] opacity-0 will-change-transform">
                  <i className="absolute -inset-1.5 rounded-full border border-[var(--accent)] opacity-0 group-[.is-done]/plot:animate-ping group-[.is-done]/plot:opacity-60 motion-reduce:!animate-none motion-reduce:!opacity-0" />
                </span>
                <span data-lb="tip" className="pointer-events-none absolute left-0 top-0 inline-flex h-7 items-baseline gap-1.5 whitespace-nowrap rounded-lg border border-[var(--border)] bg-[var(--raised)] px-2.5 text-xs leading-[26px] text-[var(--text-muted)] opacity-0 shadow-[var(--shadow-popover)] will-change-transform">
                  <b data-lb="tip-v" className="text-[13px] font-semibold tabular-nums text-[var(--text-strong)]">188</b> <span data-lb="tip-d">mer. 4 nov.</span>
                </span>
              </div>
              <div className="flex justify-between font-[family-name:var(--font-mono)] text-[11px] font-medium leading-4 text-[var(--text-muted)]"><span>6 oct.</span><span>13 oct.</span><span>20 oct.</span><span>27 oct.</span><span>4 nov.</span></div>
            </div>
          </div>
          <Text t="Chaque appel devient une donnée">Volume, rendez-vous pris et pics d’activité, mis à jour en continu. Survolez la courbe pour lire chaque jour.</Text>
        </article>

        {/* B · carte d'appel entrant */}
        <article data-live="call" className={`${cell} sm:row-span-2 lg:col-[5/7] lg:row-[1/3]`}>
          <div className={art} aria-hidden="true">
            <div data-lb="call" data-state="ring" className="group/call flex flex-1 flex-col gap-4 rounded-[calc(var(--lb-radius)-4px)] border border-[var(--border)] bg-[var(--raised)] p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-[13px] font-medium text-[var(--text-strong)]">
                  <i className="h-2 w-2 rounded-full bg-[var(--warn)] group-data-[state=live]/call:bg-[var(--up)] group-data-[state=done]/call:bg-[var(--text-disabled)]" /><span data-lb="status">Appel entrant</span>
                </span>
                <span data-lb="time" className="font-[family-name:var(--font-mono)] text-[13px] font-medium leading-none tabular-nums text-[var(--text-muted)]">00:00</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="relative grid h-12 w-12 flex-none place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[15px] font-semibold text-[var(--text-strong)]">
                  CM
                  <i className="absolute -inset-px rounded-full border-[1.5px] border-[var(--accent)] opacity-0 group-[[data-state=ring].is-on]/call:animate-ping group-[[data-state=ring].is-on]/call:opacity-50 motion-reduce:!animate-none" />
                </span>
                <span className="grid min-w-0 gap-0.5"><b className="text-base font-semibold text-[var(--text-strong)]">Camille Martin</b><span className="whitespace-nowrap font-[family-name:var(--font-mono)] text-[13px] leading-[18px] text-[var(--text-muted)]">+33 6 12 •• •• 42</span></span>
              </div>
              <div data-lb="wave" className="flex h-10 items-center gap-0.5" />
              <ol className="m-0 grid flex-1 list-none content-end gap-2 p-0">
                <Msg>Bonjour, je voudrais décaler mon rendez-vous de jeudi.</Msg>
                <Msg me>Bien sûr. Vendredi à 10&nbsp;h&nbsp;30, cela vous convient&nbsp;?</Msg>
                <Msg>Parfait, merci beaucoup&nbsp;!</Msg>
              </ol>
              <div data-lb="slot" className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 opacity-0">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--raised)] text-[var(--text-strong)]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 5h14v15H5zM5 9.5h14M9 3v4M15 3v4" /></svg></span>
                <span className="grid min-w-0 gap-0.5 text-[13px] leading-[18px] tabular-nums">
                  <s data-lb="slot-old" className="text-[var(--text-muted)] decoration-[var(--text-muted)]">jeu. 12 nov. · 09:00</s>
                  <b data-lb="slot-new" className="font-semibold text-[var(--text-strong)] opacity-0">ven. 13 nov. · 10:30</b>
                </span>
                <span className="font-[family-name:var(--font-mono)] text-[11px] leading-none text-[var(--text-muted)]">Agenda</span>
              </div>
              <div className="grid">
                <div data-lb="actions" className="col-start-1 row-start-1 grid grid-cols-2 gap-2">
                  <span className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold text-[var(--text-strong)]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>Refuser</span>
                  <span data-lb="yes" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-sm font-semibold text-[var(--accent-fg)]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></svg>Décrocher</span>
                </div>
                <div data-lb="done" className="col-start-1 row-start-1 inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[var(--tint-green-border)] bg-[var(--tint-green-bg)] text-sm font-semibold text-[var(--tint-green-fg)] opacity-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>Rendez-vous déplacé
                </div>
              </div>
            </div>
          </div>
          <Text t="Décroché à la première sonnerie">L’agent comprend, répond et met l’agenda à jour, sans attente ni musique.</Text>
        </article>

        {/* C · curseurs multijoueurs */}
        <article data-live="cursors" className={`${cell} lg:col-[1/3] lg:row-[2]`}>
          <div className={art} aria-hidden="true">
            <div data-lb="board" className="relative min-h-[184px] flex-1 overflow-hidden rounded-[calc(var(--lb-radius)-4px)] border border-[var(--border)] bg-[var(--raised)] bg-[radial-gradient(var(--border)_1px,transparent_1.2px)] bg-[length:16px_16px]">
              <svg data-lb="links" className="absolute inset-0 h-full w-full [&_path]:fill-none [&_path]:stroke-[var(--border-control)] [&_path]:[stroke-dasharray:3_4] [&_path]:[stroke-width:1.25]"><path data-lb="link" /><path data-lb="link" /></svg>
              <Node x="5%" y="12%">Accueil</Node>
              <Node x="52%" y="9%">Prise de RDV</Node>
              <Node x="47%" y="55%">Transfert</Node>
              <span data-lb="marquee" className="absolute left-0 top-0 h-0 w-0 rounded border border-dashed border-[var(--tint-pink-fg)] bg-[var(--tint-pink-bg)] opacity-0" />
              <Cur tone="v" name="Léa" />
              <Cur tone="g" name="Karim">Un SMS de rappel&nbsp;?</Cur>
              <Cur tone="p" name="Inès" />
              <span data-lb="presence" className="absolute bottom-2 right-2 inline-flex h-7 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] pl-1 pr-2.5 text-xs font-medium text-[var(--text-strong)] opacity-0">
                <span className="flex [&>i]:-ml-1 [&>i]:grid [&>i]:h-[22px] [&>i]:w-[22px] [&>i]:place-items-center [&>i]:rounded-full [&>i]:border-[1.5px] [&>i]:border-[var(--surface)] [&>i]:text-[9px] [&>i]:tracking-[-.02em] [&>i]:font-semibold [&>i]:not-italic [&>i:first-child]:ml-0">
                  <i className="bg-[var(--tint-violet-bg)] text-[var(--tint-violet-fg)]">LM</i><i className="bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]">KB</i><i className="bg-[var(--tint-pink-bg)] text-[var(--tint-pink-fg)]">IA</i>
                </span>3 en ligne
              </span>
            </div>
          </div>
          <Text t="Pensé pour toute l’équipe">Les scénarios d’appel s’éditent à plusieurs, en direct.</Text>
        </article>

        {/* D · notifications qui arrivent */}
        <article data-live="notifs" className={`${cell} lg:col-[3/5] lg:row-[2]`}>
          <div className={art} aria-hidden="true">
            <div className="grid gap-3">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>Aujourd’hui</span>
                <span data-lb="ncount" className="inline-flex h-[22px] items-center rounded-full border border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)] px-2 font-semibold tabular-nums text-[var(--accent)]">0 nouvelle</span>
              </div>
              <div data-lb="stack" className="relative h-52" />
            </div>
          </div>
          <Text t="Alertes au bon moment">Rendez-vous, transferts et seuils, sans bruit inutile.</Text>
        </article>

        {/* E · compteur */}
        <article data-live="counter" className={`${cell} lg:col-[1/4] lg:row-[3]`}>
          <div className={`${art} justify-center`} aria-hidden="true">
            <div data-lb="count" className="group/count flex flex-wrap items-end justify-between gap-6">
              <div className="grid gap-2">
                <span data-lb="odo" data-value="12480" className="inline-flex h-[1em] overflow-hidden text-[clamp(3rem,2.4rem+2.4vw,4rem)] font-semibold leading-none tracking-[-.04em] tabular-nums text-[var(--text-strong)]" />
                <span className="inline-flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-xs leading-4 text-[var(--text-muted)]"><i className="h-1.5 w-1.5 rounded-full bg-[var(--up)] group-[.is-on]/count:animate-pulse motion-reduce:!animate-none" />en direct</span>
              </div>
              <div data-lb="bars" className="flex h-[72px] min-w-[160px] max-w-[260px] flex-1 items-end gap-1" />
            </div>
          </div>
          <Text t="Appels décrochés en novembre">99,2&nbsp;% de décroché, nuits et week-ends compris.</Text>
        </article>

        {/* F · latence */}
        <article data-live="latency" className={`${cell} lg:col-[4/7] lg:row-[3]`}>
          <div className={`${art} justify-center`} aria-hidden="true">
            <div className="grid gap-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3 pb-2">
                <b className={big}><span data-lb="ltotal">280</span>&nbsp;ms</b>
                <span data-lb="lcall" className={k}>Dernier appel · p95 410&nbsp;ms</span>
              </div>
              <div className="relative grid gap-2.5">
                <Row label="Écoute" tone="bg-[var(--chart-1)]" ms="90" />
                <Row label="Compréhension" tone="bg-[var(--chart-4)]" ms="140" />
                <Row label="Voix" tone="bg-[var(--chart-3)]" ms="50" />
                <span className="pointer-events-none absolute -bottom-1.5 -top-1.5 left-[calc(92px+8px+(100%-92px-36px-16px)*.75)] border-l border-dashed border-[var(--border-control)] sm:left-[calc(104px+12px+(100%-104px-40px-24px)*.75)]">
                  <span className="absolute bottom-full left-0 -translate-x-1/2 -translate-y-1 whitespace-nowrap font-[family-name:var(--font-mono)] text-[10px] leading-none text-[var(--text-muted)]">300 ms</span>
                </span>
              </div>
            </div>
          </div>
          <Text t={'Répond en moins de 300\u00A0ms'}>Écoute, compréhension et voix, mesurées à chaque appel.</Text>
        </article>
      </div>
    </section>
  );
}

// Exemple
export default function Exemple() {
  return <LiveBento speed={1} stagger={120} ambient halo />;
}
