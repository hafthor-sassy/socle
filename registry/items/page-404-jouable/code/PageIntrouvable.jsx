// 404 jouable — React + Tailwind CSS. Aucune dépendance.
// <NotFoundPlayground mode="gravity" code="404" gravity={1800} bounce={0.3} push={32} showCursor={false} />
// Les chiffres sont de vrais corps rigides (boîtes orientées, impulsions, frottement, rebond) : le curseur les pousse,
// on les attrape et on les lance. Le moteur (NotFound, ci-dessous) est du JavaScript sans framework, piloté par
// les attributs data-* que le composant tient à jour ; boucle rAF arrêtée au repos et hors écran.
import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * @typedef {Object} NotFoundPlaygroundProps
 * @property {'gravity'|'float'} [mode]   gravité : les chiffres tombent et s'empilent ; apesanteur : un ressort les ramène
 * @property {string} [code]              3 ou 4 chiffres
 * @property {number} [gravity]           px/s²
 * @property {number} [bounce]            restitution, 0 à 0,8
 * @property {number} [push]              rayon de poussée du curseur, px
 * @property {boolean} [showCursor]       affiche la zone de poussée
 * @property {string} [className]
 */

/* ---------- Moteur physique (identique à l'onglet HTML) ---------- */
var DIGITS = {"0":[60.5,74.2,"M30.26 74.2Q20.94 74.2 14.13 69.73Q7.32 65.26 3.66 56.96Q0 48.66 0 37.2Q0 25.74 3.69 17.39Q7.38 9.04 14.16 4.52Q20.94 0 30.26 0Q39.62 0 46.37 4.52Q53.12 9.04 56.81 17.37Q60.5 25.7 60.5 37.2Q60.5 48.6 56.84 56.9Q53.18 65.2 46.4 69.7Q39.62 74.2 30.26 74.2ZM30.26 61.42Q37.3 61.42 41.07 55.32Q44.84 49.22 44.84 37.2Q44.84 29.14 43.16 23.71Q41.48 18.28 38.25 15.53Q35.02 12.78 30.26 12.78Q25.54 12.78 22.28 15.53Q19.02 18.28 17.34 23.71Q15.66 29.14 15.66 37.2Q15.66 49.22 19.43 55.32Q23.2 61.42 30.26 61.42Z"],"1":[30.6,71.0,"M15.4 71V24.28H0V13.16H6.12Q10.56 13.16 13.3 11.95Q16.04 10.74 17.28 7.86Q18.52 4.98 18.52 0H30.6V71Z"],"2":[53.8,72.6,"M0 72.6Q0 63.48 2.44 56.8Q4.88 50.12 10.44 44.83Q16 39.54 25.22 34.72Q30.06 32.18 32.91 30.25Q35.76 28.32 36.98 26.33Q38.2 24.34 38.2 21.64Q38.2 19.02 37.05 17.05Q35.9 15.08 33.68 13.93Q31.46 12.78 28.14 12.78Q22.74 12.78 19.59 15.96Q16.44 19.14 15.7 25.14L0.1 24.24Q1.06 12.88 8.34 6.44Q15.62 0 28.02 0Q36.16 0 41.93 2.69Q47.7 5.38 50.75 10.21Q53.8 15.04 53.8 21.44Q53.8 26.96 51.94 30.79Q50.08 34.62 45.98 37.81Q41.88 41 35.14 44.6Q26.62 49.16 22.51 53.04Q18.4 56.92 18.1 59.82H53.8V72.6Z"],"3":[56.16,74.2,"M27.98 74.2Q14.8 74.2 7.65 68.17Q0.5 62.14 0 51.78L15.5 51.18Q16.04 56.48 19.29 58.95Q22.54 61.42 27.98 61.42Q31.56 61.42 34.38 60.35Q37.2 59.28 38.85 57.09Q40.5 54.9 40.5 51.6Q40.5 46.48 37 43.93Q33.5 41.38 27.54 41.38H21.16V30.1H27.54Q32.1 30.1 35.17 28.14Q38.24 26.18 38.24 21.52Q38.24 17.46 35.74 15.12Q33.24 12.78 27.82 12.78Q22.44 12.78 19.73 15Q17.02 17.22 16.44 20.72L1.08 19.94Q2.14 10.86 9.08 5.43Q16.02 0 27.82 0Q36.22 0 42.02 2.41Q47.82 4.82 50.83 9.3Q53.84 13.78 53.84 19.92Q53.84 26.22 49.66 30.33Q45.48 34.44 37.74 35.88V34.2Q46.56 35.5 51.36 40.31Q56.16 45.12 56.16 52.68Q56.16 59.42 52.69 64.25Q49.22 69.08 42.9 71.64Q36.58 74.2 27.98 74.2Z"],"4":[58.84,71.0,"M35.32 71V57.46H0V45.4L32.44 0H50.52V44.68H58.84V57.46H50.52V71ZM16.1 44.68H35.32V18.72Z"],"5":[55.9,72.6,"M27.78 72.6Q19.08 72.6 13.09 69.98Q7.1 67.36 3.83 62.59Q0.56 57.82 0 51.44L15.42 50.72Q16.28 55.28 19.46 57.52Q22.64 59.76 27.78 59.76Q33.66 59.76 36.98 56.5Q40.3 53.24 40.3 47.36Q40.3 43.62 38.77 40.81Q37.24 38 34.44 36.42Q31.64 34.84 27.7 34.84Q23.4 34.84 20.33 36.73Q17.26 38.62 15.98 41.52H0.78L5.72 0H51.04V12.78H18.66L16.06 33.52L14.34 32.04Q16 29.42 18.56 27.55Q21.12 25.68 24.54 24.66Q27.96 23.64 32.06 23.64Q39.4 23.64 44.74 26.73Q50.08 29.82 52.99 35.19Q55.9 40.56 55.9 47.36Q55.9 55.06 52.43 60.76Q48.96 66.46 42.63 69.53Q36.3 72.6 27.78 72.6Z"],"6":[54.86,74.2,"M27.66 74.2Q18.52 74.2 12.36 70.31Q6.2 66.42 3.1 59.05Q0 51.68 0 41.34Q0 32.42 1.81 24.87Q3.62 17.32 7.29 11.77Q10.96 6.22 16.64 3.11Q22.32 0 30.04 0Q40.38 0 46.45 5.01Q52.52 10.02 54.5 18.6L40.46 19.64Q39.26 16.28 36.94 14.41Q34.62 12.54 29.98 12.54Q22.98 12.54 18.98 18.6Q14.98 24.66 14.56 37.4L12.46 37Q13.5 34.12 15.92 31.61Q18.34 29.1 22.06 27.55Q25.78 26 30.82 26Q38.06 26 43.48 28.88Q48.9 31.76 51.88 37Q54.86 42.24 54.86 49.24Q54.86 57.16 51.42 62.75Q47.98 68.34 41.88 71.27Q35.78 74.2 27.66 74.2ZM27.56 62.08Q33 62.08 36.37 58.65Q39.74 55.22 39.74 49.36Q39.74 45.6 38.26 42.78Q36.78 39.96 34.16 38.4Q31.54 36.84 28 36.84Q24.28 36.84 21.41 38.4Q18.54 39.96 16.91 42.78Q15.28 45.6 15.28 49.36Q15.28 53.12 16.78 55.99Q18.28 58.86 21.07 60.47Q23.86 62.08 27.56 62.08Z"],"7":[52.44,71.0,"M14.42 71Q14.42 60 17.21 49.71Q20 39.42 25.08 30.11Q30.16 20.8 36.98 12.78H0V0H52.44V11.94Q44.98 20.34 39.92 29.15Q34.86 37.96 32.34 48.18Q29.82 58.4 29.82 71Z"],"8":[59.6,74.2,"M29.8 74.2Q20.76 74.2 14.06 71.83Q7.36 69.46 3.68 64.79Q0 60.12 0 53.28Q0 45.34 4.99 40.17Q9.98 35 18.36 33.56L18.56 35.62Q11.62 34.28 7.54 30.1Q3.46 25.92 3.46 19.5Q3.46 13.72 6.52 9.32Q9.58 4.92 15.46 2.46Q21.34 0 29.8 0Q38.26 0 44.16 2.46Q50.06 4.92 53.1 9.32Q56.14 13.72 56.14 19.5Q56.14 25.92 52.08 30.04Q48.02 34.16 41.04 35.62L41.24 33.56Q49.66 35.06 54.63 40.2Q59.6 45.34 59.6 53.28Q59.6 60.12 55.95 64.79Q52.3 69.46 45.62 71.83Q38.94 74.2 29.8 74.2ZM29.8 61.36Q36.2 61.36 40.07 58.65Q43.94 55.94 43.94 50.98Q43.94 46.1 40.27 43.13Q36.6 40.16 29.8 40.16Q23.04 40.16 19.35 43.13Q15.66 46.1 15.66 50.98Q15.66 55.94 19.53 58.65Q23.4 61.36 29.8 61.36ZM29.8 29.52Q34.9 29.52 37.78 27.45Q40.66 25.38 40.66 21.12Q40.66 17.28 37.91 15Q35.16 12.72 29.8 12.72Q24.54 12.72 21.74 15Q18.94 17.28 18.94 21.12Q18.94 25.38 21.82 27.45Q24.7 29.52 29.8 29.52Z"],"9":[55.28,74.2,"M25.86 74.2Q15.98 74.2 9.89 69.67Q3.8 65.14 1.26 56.62L15.82 55.74Q16.9 58.62 19.41 60.14Q21.92 61.66 25.86 61.66Q33.32 61.66 36.87 56.16Q40.42 50.66 40.46 37.94L42.38 38.76Q39.76 44.14 35.1 46.83Q30.44 49.52 23.66 49.52Q16.64 49.52 11.31 46.54Q5.98 43.56 2.99 38.2Q0 32.84 0 25.68Q0 17.76 3.32 12.02Q6.64 6.28 12.66 3.14Q18.68 0 26.62 0Q36.3 0 42.67 4.04Q49.04 8.08 52.16 15.79Q55.28 23.5 55.28 34.64Q55.28 43.9 53.52 51.24Q51.76 58.58 48.17 63.68Q44.58 68.78 39.03 71.49Q33.48 74.2 25.86 74.2ZM26.96 38.56Q30.72 38.56 33.46 36.99Q36.2 35.42 37.72 32.51Q39.24 29.6 39.24 25.52Q39.24 21.46 37.8 18.45Q36.36 15.44 33.66 13.78Q30.96 12.12 27.16 12.12Q23.52 12.12 20.83 13.76Q18.14 15.4 16.69 18.39Q15.24 21.38 15.24 25.44Q15.24 29.48 16.71 32.41Q18.18 35.34 20.8 36.95Q23.42 38.56 26.96 38.56Z"]};
var mq = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)');
function reduced() { return !!(mq && mq.matches); }

/* ---------- Corps rigides : boîtes orientées, impulsions séquentielles ---------- */
function NotFound(el) {
  var stage = el.querySelector('.nf__stage'), cursorEl = el.querySelector('.nf__cursor');
  var W = 0, H = 0, bodies = [], raf = 0, last = 0, calm = 0, visible = true;
  var ptr = { on: false, x: -999, y: -999, vx: 0, vy: 0, t: 0, id: null }, grab = null;
  function num(k, d) { var v = parseFloat(el.dataset[k]); return isNaN(v) ? d : v; }

  function build() {
    bodies.forEach(function (b) { if (b.shadow) b.shadow.remove(); });
    bodies = [].slice.call(stage.querySelectorAll('.nf__glyph')).map(function (svg) {
      var vb = svg.viewBox.baseVal, sh = document.createElement('span');
      sh.className = 'nf__shadow'; stage.insertBefore(sh, stage.querySelector('.nf__glyph'));
      return { el: svg, shadow: sh, rw: vb.width, rh: vb.height, w: 0, h: 0, x: 0, y: 0, a: 0, vx: 0, vy: 0, va: 0, m: 1, I: 1, hx: 0, hy: 0 };
    });
  }
  function layout(keep) {
    var r = stage.getBoundingClientRect(), oldW = W, oldH = H;
    W = r.width; H = r.height; if (!W || !H) return;
    var gh = Math.min(H * 0.66, W * 0.27), gap = gh * 0.1, total = 0;
    bodies.forEach(function (b) { b.h = gh * b.rh / 74.2; b.w = b.h * b.rw / b.rh; total += b.w; });
    total += gap * (bodies.length - 1);
    var x = (W - total) / 2, float = el.dataset.mode === 'float';
    bodies.forEach(function (b) {
      b.el.style.width = b.w + 'px'; b.el.style.height = b.h + 'px';
      b.shadow.style.width = b.w * 0.9 + 'px';
      b.m = b.w * b.h * 0.001; b.I = b.m * (b.w * b.w + b.h * b.h) / 12;
      b.hx = x + b.w / 2; b.hy = float ? H * 0.47 : H - b.h / 2; x += b.w + gap;
      if (keep && oldW) { b.x *= W / oldW; b.y = Math.min(b.y * H / oldH, H - b.h / 2); }
    });
  }
  function place(drop) {
    var float = el.dataset.mode === 'float';
    bodies.forEach(function (b, i) {
      b.vx = 0; b.va = 0; b.a = 0; b.x = b.hx;
      if (reduced() || !drop) { b.y = b.hy; b.vy = 0; return; }
      if (float) { b.y = b.hy + 40 + i * 18; b.vy = -260 - i * 60; b.a = (i - 1) * 0.12; }
      else { b.y = -b.h * (0.7 + i * 0.55); b.vy = 0; b.a = (i - 1) * 0.06; }
    });
    render(); wake();
  }

  function corners(b) {
    var c = Math.cos(b.a), s = Math.sin(b.a), hw = b.w / 2, hh = b.h / 2;
    return [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(function (p) { return [b.x + p[0] * c - p[1] * s, b.y + p[0] * s + p[1] * c]; });
  }
  function toLocal(b, px, py) { var c = Math.cos(b.a), s = Math.sin(b.a), dx = px - b.x, dy = py - b.y; return [dx * c + dy * s, -dx * s + dy * c]; }
  function toWorldDir(b, lx, ly) { var c = Math.cos(b.a), s = Math.sin(b.a); return [lx * c - ly * s, lx * s + ly * c]; }

  /* Boîte contre boîte : axe séparateur (SAT) pour la normale et la profondeur, coins inclus pour les points de contact. */
  function axes(b) { var c = Math.cos(b.a), s = Math.sin(b.a); return [[c, s], [-s, c]]; }
  function radius(b, ax, n) { return Math.abs(b.w / 2 * (ax[0][0] * n[0] + ax[0][1] * n[1])) + Math.abs(b.h / 2 * (ax[1][0] * n[0] + ax[1][1] * n[1])); }
  function inside(b, p, tol) { var l = toLocal(b, p[0], p[1]); return Math.abs(l[0]) <= b.w / 2 + tol && Math.abs(l[1]) <= b.h / 2 + tol; }
  function pair(A, B, out) {
    if (Math.abs(A.x - B.x) > (A.w + B.w) * 0.75 || Math.abs(A.y - B.y) > (A.h + B.h) * 0.75) return;
    var aa = axes(A), ab = axes(B), all = aa.concat(ab), best = Infinity, n = null, dx = A.x - B.x, dy = A.y - B.y;
    for (var k = 0; k < 4; k++) {
      var ax = all[k], d = dx * ax[0] + dy * ax[1], o = radius(A, aa, ax) + radius(B, ab, ax) - Math.abs(d);
      if (o <= 0) return;
      if (o < best) { best = o; n = d < 0 ? [-ax[0], -ax[1]] : [ax[0], ax[1]]; }
    }
    var pts = corners(A).filter(function (p) { return inside(B, p, 0.5); }).concat(corners(B).filter(function (p) { return inside(A, p, 0.5); }));
    if (!pts.length) {
      var ca = corners(A).sort(function (p, q) { return (p[0] * n[0] + p[1] * n[1]) - (q[0] * n[0] + q[1] * n[1]); })[0];
      var cb = corners(B).sort(function (p, q) { return (q[0] * n[0] + q[1] * n[1]) - (p[0] * n[0] + p[1] * n[1]); })[0];
      pts = [[(ca[0] + cb[0]) / 2, (ca[1] + cb[1]) / 2]];
    }
    pts.forEach(function (p) { out.push({ a: A, b: B, nx: n[0], ny: n[1], px: p[0], py: p[1], pen: best / pts.length * Math.min(pts.length, 2) }); });
  }
  function contacts() {
    var out = [], ceil = -16;
    bodies.forEach(function (b) {
      corners(b).forEach(function (p) {
        if (p[1] > H) out.push({ a: b, b: null, nx: 0, ny: -1, px: p[0], py: p[1], pen: p[1] - H });
        if (p[0] < 0) out.push({ a: b, b: null, nx: 1, ny: 0, px: p[0], py: p[1], pen: -p[0] });
        if (p[0] > W) out.push({ a: b, b: null, nx: -1, ny: 0, px: p[0], py: p[1], pen: p[0] - W });
        if (p[1] < ceil && b.vy < 0) out.push({ a: b, b: null, nx: 0, ny: 1, px: p[0], py: p[1], pen: ceil - p[1] });
      });
    });
    for (var i = 0; i < bodies.length; i++) for (var j = i + 1; j < bodies.length; j++) pair(bodies[i], bodies[j], out);
    if (ptr.on && !reduced()) {
      var R = num('push', 32);
      bodies.forEach(function (b) {
        if (grab && grab.b === b) return;
        var l = toLocal(b, ptr.x, ptr.y), cx = Math.max(-b.w / 2, Math.min(b.w / 2, l[0])), cy = Math.max(-b.h / 2, Math.min(b.h / 2, l[1]));
        var inside = cx === l[0] && cy === l[1], nx, ny, d, wp = toWorldDir(b, cx, cy), qx = b.x + wp[0], qy = b.y + wp[1];
        if (inside) { var fx = b.w / 2 - Math.abs(l[0]), fy = b.h / 2 - Math.abs(l[1]); var ld = fx < fy ? [l[0] < 0 ? 1 : -1, 0] : [0, l[1] < 0 ? 1 : -1]; var wn = toWorldDir(b, ld[0], ld[1]); nx = wn[0]; ny = wn[1]; d = -Math.min(fx, fy); }
        else { nx = qx - ptr.x; ny = qy - ptr.y; d = Math.hypot(nx, ny); if (d > R) return; nx /= d || 1; ny /= d || 1; }
        out.push({ a: b, b: null, nx: nx, ny: ny, px: qx, py: qy, pen: R - d, vx: ptr.vx, vy: ptr.vy, soft: true });
      });
    }
    return out;
  }
  function resolve(c, e, mu) {
    var A = c.a, B = c.b, rax = c.px - A.x, ray = c.py - A.y, rbx = B ? c.px - B.x : 0, rby = B ? c.py - B.y : 0;
    var vax = A.vx - A.va * ray, vay = A.vy + A.va * rax;
    var vbx = B ? B.vx - B.va * rby : (c.vx || 0), vby = B ? B.vy + B.va * rbx : (c.vy || 0);
    var rx = vax - vbx, ry = vay - vby, vn = rx * c.nx + ry * c.ny;
    if (vn >= 0) return;
    var ran = rax * c.ny - ray * c.nx, rbn = rbx * c.ny - rby * c.nx;
    var k = 1 / A.m + ran * ran / A.I + (B ? 1 / B.m + rbn * rbn / B.I : 0);
    var ee = Math.abs(vn) > 90 ? e : 0, j = -(1 + ee) * vn / k;
    if (c.soft) j = Math.min(j, 40 * A.m * 60);
    apply(A, B, c.nx * j, c.ny * j, rax, ray, rbx, rby);
    vax = A.vx - A.va * ray; vay = A.vy + A.va * rax;
    vbx = B ? B.vx - B.va * rby : (c.vx || 0); vby = B ? B.vy + B.va * rbx : (c.vy || 0);
    var tx = -c.ny, ty = c.nx, vt = (vax - vbx) * tx + (vay - vby) * ty;
    var rat = rax * ty - ray * tx, rbt = rbx * ty - rby * tx;
    var kt = 1 / A.m + rat * rat / A.I + (B ? 1 / B.m + rbt * rbt / B.I : 0);
    var jt = Math.max(-mu * j, Math.min(mu * j, -vt / kt));
    apply(A, B, tx * jt, ty * jt, rax, ray, rbx, rby);
  }
  function apply(A, B, jx, jy, rax, ray, rbx, rby) {
    A.vx += jx / A.m; A.vy += jy / A.m; A.va += (rax * jy - ray * jx) / A.I;
    if (B) { B.vx -= jx / B.m; B.vy -= jy / B.m; B.va -= (rbx * jy - rby * jx) / B.I; }
  }
  function correct(list) {
    list.forEach(function (c) {
      var pen = c.pen - 0.4; if (pen <= 0) return;
      var A = c.a, B = c.b, ia = 1 / A.m, ib = B ? 1 / B.m : 0, k = (c.soft ? 0.35 : 0.7) * pen / (ia + ib);
      A.x += c.nx * k * ia; A.y += c.ny * k * ia;
      if (B) { B.x -= c.nx * k * ib; B.y -= c.ny * k * ib; }
    });
  }
  function step(dt) {
    var float = el.dataset.mode === 'float', g = num('gravity', 1800), e = num('bounce', 0.3);
    bodies.forEach(function (b) {
      if (float) {
        b.vx += (-(b.x - b.hx) * 34 - b.vx * 5.2) * dt; b.vy += (-(b.y - b.hy) * 34 - b.vy * 5.2) * dt;
        var da = Math.atan2(Math.sin(b.a), Math.cos(b.a)); b.va += (-da * 30 - b.va * 4.6) * dt;
      } else { b.vy += g * dt; b.vx *= Math.pow(0.9, dt); b.va *= Math.pow(0.7, dt); }
    });
    if (grab) {
      var b = grab.b, wp = toWorldDir(b, grab.lx, grab.ly), ax = b.x + wp[0], ay = b.y + wp[1];
      var avx = b.vx - b.va * wp[1], avy = b.vy + b.va * wp[0];
      var fx = ((ptr.x - ax) * 520 - avx * 30) * b.m, fy = ((ptr.y - ay) * 520 - avy * 30) * b.m;
      b.vx += fx / b.m * dt; b.vy += fy / b.m * dt; b.va += (wp[0] * fy - wp[1] * fx) / b.I * dt * 0.6;
      b.va *= Math.pow(0.02, dt);
    }
    var list = contacts();
    for (var it = 0; it < 8; it++) list.forEach(function (c) { resolve(c, e, 0.55); });
    bodies.forEach(function (b) {
      var sp = Math.hypot(b.vx, b.vy); if (sp > 5000) { b.vx *= 5000 / sp; b.vy *= 5000 / sp; }
      b.va = Math.max(-40, Math.min(40, b.va));
      b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt;
    });
    for (var p = 0; p < 2; p++) correct(contacts());
  }
  function render() {
    bodies.forEach(function (b) {
      b.el.style.transform = 'translate(' + (b.x - b.w / 2).toFixed(2) + 'px,' + (b.y - b.h / 2).toFixed(2) + 'px) rotate(' + b.a.toFixed(4) + 'rad)';
      var lift = Math.max(0, H - (b.y + b.h / 2)), k = Math.max(0, 1 - lift / (H * 0.9));
      b.shadow.style.transform = 'translateX(' + (b.x - b.w * 0.45).toFixed(1) + 'px) scaleX(' + (0.5 + 0.5 * k).toFixed(3) + ')';
      b.shadow.style.opacity = (0.15 + 0.85 * k).toFixed(3);
    });
    if (ptr.on) { var R = num('push', 32); cursorEl.style.width = cursorEl.style.height = R * 2 + 'px'; cursorEl.style.transform = 'translate(' + (ptr.x - R) + 'px,' + (ptr.y - R) + 'px)'; }
  }
  function frame(now) {
    var dt = Math.min(1 / 30, (now - last) / 1000); last = now;
    var n = Math.max(1, Math.ceil(dt / (1 / 120)));
    for (var i = 0; i < n; i++) step(dt / n);
    render();
    var energy = bodies.reduce(function (s, b) { return s + Math.abs(b.vx) + Math.abs(b.vy) + Math.abs(b.va) * 40; }, 0);
    calm = energy < 6 && !grab && !ptr.on ? calm + 1 : 0;
    if (calm > 45 || !visible) { raf = 0; return; }
    raf = requestAnimationFrame(frame);
  }
  function wake() { if (reduced()) return; calm = 0; if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(frame); } }

  /* ---------- Pointeur : pousser au survol, attraper et lancer ---------- */
  function local(e) { var r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  function track(e) {
    var p = local(e), now = performance.now(), dt = Math.max(1, now - ptr.t) / 1000;
    if (ptr.t && ptr.x > -900) { ptr.vx = ptr.vx * 0.4 + 0.6 * (p[0] - ptr.x) / dt; ptr.vy = ptr.vy * 0.4 + 0.6 * (p[1] - ptr.y) / dt; }
    var sp = Math.hypot(ptr.vx, ptr.vy); if (sp > 2400) { ptr.vx *= 2400 / sp; ptr.vy *= 2400 / sp; }
    ptr.x = p[0]; ptr.y = p[1]; ptr.t = now;
  }
  function hit(x, y) { for (var i = bodies.length - 1; i >= 0; i--) { var l = toLocal(bodies[i], x, y); if (Math.abs(l[0]) <= bodies[i].w / 2 + 6 && Math.abs(l[1]) <= bodies[i].h / 2 + 6) return { b: bodies[i], lx: l[0], ly: l[1] }; } return null; }
  stage.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { ptr.t = 0; track(e); ptr.on = true; stage.classList.add('is-pushing'); wake(); } });
  stage.addEventListener('pointermove', function (e) { track(e); if (ptr.on || grab) wake(); });
  stage.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !grab) { ptr.on = false; ptr.vx = ptr.vy = 0; stage.classList.remove('is-pushing'); } });
  stage.addEventListener('pointerdown', function (e) {
    if (reduced()) return;
    ptr.t = 0; track(e);
    var h = hit(ptr.x, ptr.y);
    if (h) { grab = h; stage.setPointerCapture(e.pointerId); stage.classList.add('is-grabbing'); e.preventDefault(); }
    else if (e.pointerType !== 'mouse') { ptr.on = true; stage.setPointerCapture(e.pointerId); }
    wake();
  });
  function up(e) {
    if (grab) { grab = null; stage.classList.remove('is-grabbing'); }
    if (e.pointerType !== 'mouse') { ptr.on = false; ptr.x = ptr.y = -999; }
    wake();
  }
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);

  function shake() {
    if (reduced()) return;
    var float = el.dataset.mode === 'float';
    bodies.forEach(function (b, i) { b.vx += (Math.random() - 0.5) * 700; b.vy -= (float ? 300 : 900) + Math.random() * 600; b.va += (Math.random() - 0.5) * 10; });
    wake();
  }
  function setCode(code) {
    code = String(code || '404').replace(/[^0-9]/g, '').slice(0, 4) || '404';
    var old = stage.querySelectorAll('.nf__glyph');
    old.forEach(function (n) { n.remove(); });
    code.split('').forEach(function (ch) {
      var d = DIGITS[ch], svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'), p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      svg.setAttribute('class', 'nf__glyph'); svg.setAttribute('data-glyph', ch); svg.setAttribute('viewBox', '0 0 ' + d[0] + ' ' + d[1]);
      p.setAttribute('d', d[2]); svg.appendChild(p); stage.insertBefore(svg, cursorEl);
    });
    el.dataset.code = code;
    el.querySelectorAll('[data-nf-code]').forEach(function (n) { n.textContent = code; });
    var t = el.querySelector('.nf__sr'); if (t) t.textContent = 'Erreur ' + code + '\u00a0: page introuvable';
    build(); layout(); place(true);
  }
  function reset(drop) { layout(); place(drop !== false); }

  el.addEventListener('click', function (e) {
    if (e.target.closest('[data-nf-shake]')) shake();
    if (e.target.closest('[data-nf-reset]')) reset();
  });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) wake(); }).observe(stage);
  if ('ResizeObserver' in window) new ResizeObserver(function () { var w = W; layout(true); if (w && Math.abs(stage.getBoundingClientRect().width - w) > 1) { render(); wake(); } }).observe(stage);
  build(); layout();
  if (el.dataset.code && el.dataset.code !== '404') setCode(el.dataset.code); else place(true);
  return { shake: shake, reset: reset, setCode: setCode, wake: wake, layout: function () { layout(); bodies.forEach(function (b) { if (el.dataset.mode === 'float') b.vy += 1; }); wake(); },
    poke: function (x, y, vx, vy) { ptr.on = true; ptr.x = x; ptr.y = y; ptr.vx = vx; ptr.vy = vy; wake(); }, release: function () { ptr.on = false; ptr.x = ptr.y = -999; }, size: function () { return [W, H]; } };
}


const CSS = `
.nfr .nf__glyph{position:absolute;left:0;top:0;display:block;overflow:visible;fill:var(--text-strong);transform-origin:50% 50%;will-change:transform}
.nfr .nf__glyph:nth-of-type(2){fill:var(--accent)}
.nfr .nf__shadow{position:absolute;left:0;bottom:-3px;height:6px;border-radius:50%;background:var(--border);filter:blur(1.5px);pointer-events:none}
.nfr .nf__cursor{position:absolute;left:0;top:0;border:1px dashed var(--border-control);border-radius:999px;pointer-events:none;opacity:0;transition:opacity 180ms}
.nfr[data-show-cursor=true] .is-pushing .nf__cursor{opacity:1}
.nfr .is-grabbing{cursor:grabbing}
@keyframes nfr-in{from{opacity:0;transform:translateY(4px)}}
@media (prefers-reduced-motion:reduce){.nfr *{animation:none!important;transition:none!important}}`;

/** @param {NotFoundPlaygroundProps} props */
export function NotFoundPlayground({ mode = 'gravity', code = '404', gravity = 1800, bounce = 0.3, push = 32, showCursor = false, className = '' }) {
  const root = useRef(null), api = useRef(null);
  useEffect(() => {
    if (!document.getElementById('nfr-css')) { const s = document.createElement('style'); s.id = 'nfr-css'; s.textContent = CSS; document.head.appendChild(s); }
    api.current = NotFound(root.current);
    api.current.setCode(code);
  }, []);
  useEffect(() => { api.current?.setCode(code); }, [code]);
  useEffect(() => { api.current?.reset(); }, [mode]);
  useEffect(() => { api.current?.wake(); }, [gravity, bounce, push]);
  const btn = 'inline-flex flex-1 sm:flex-none items-center justify-center gap-2 h-11 sm:h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[15px] sm:text-sm font-medium text-[var(--text-strong)] hover:bg-[var(--state-hover)] hover:border-[var(--border-control)] active:scale-[.96] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]';
  return (
    <section ref={root} data-mode={mode} data-gravity={gravity} data-bounce={bounce} data-push={push} data-code={code} data-show-cursor={String(showCursor)}
      aria-labelledby="nfr-title" className={`nfr relative [clip-path:inset(-24px_-50vw_-50vh_-50vw)] ${className}`}>
      <h1 id="nfr-title" className="sr-only">Erreur {code}&nbsp;: page introuvable</h1>
      <div aria-hidden="true" className="nf__stage relative h-[200px] sm:h-[320px] touch-pan-y select-none cursor-grab motion-reduce:cursor-default">
        <span className="absolute inset-x-0 bottom-0 h-px opacity-70 bg-[length:8px_1px] bg-[linear-gradient(90deg,var(--border-control)_50%,transparent_50%)]" />
        <span className="nf__cursor" />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 pt-4">
        <p className="grid gap-0.5 m-0 pl-3 border-l-2 border-[var(--accent)] text-sm sm:text-[13px] leading-5 sm:leading-[18px] text-[var(--text-muted)]">
          <span className="font-mono text-xs leading-[18px] uppercase tracking-[0.04em] text-[var(--text-strong)]">Salle {code}</span>
          <span><em className="text-[var(--text)]">Sans titre (page introuvable)</em>, 2026</span>
          <span className="motion-reduce:hidden">Poussez, attrapez, lancez.</span>
        </p>
        <div className="flex gap-2 motion-reduce:hidden">
          <button type="button" data-nf-shake className={btn}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M8 5l-3 3 3 3M16 13l3 3-3 3M5 8h9a4 4 0 0 1 4 4M19 16h-9a4 4 0 0 1-4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>Secouer
          </button>
          <button type="button" data-nf-reset className={btn}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v3.5H8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>Replacer
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------- Recherche : combobox accessible ---------- */
const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function Highlight({ text, q }) {
  const i = q ? norm(text).indexOf(norm(q)) : -1;
  if (i < 0) return text;
  return <>{text.slice(0, i)}<mark className="bg-transparent text-inherit underline decoration-[var(--accent)] decoration-2 underline-offset-[3px]">{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}

/** @param {{ items: { k: string, t: string, m: string }[], onNavigate?: (item: object) => void }} props */
export function NotFoundSearch({ items, onNavigate }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState('');
  const shown = useMemo(() => (q.trim() ? items.filter((it) => norm(`${it.t} ${it.m} ${it.k}`).includes(norm(q.trim()))).slice(0, 6) : items.filter((_, i) => [0, 4, 6, 7].includes(i))), [q, items]);
  useEffect(() => { setActive(shown.length ? 0 : -1); if (q.trim()) setStatus(shown.length ? `${shown.length} suggestion${shown.length > 1 ? 's' : ''}` : 'Aucun résultat'); }, [shown]);
  const choose = (i) => { const it = shown[i]; if (!it) return; setQ(it.t); setOpen(false); setStatus(`Ouverture de «\u00a0${it.t}\u00a0»`); onNavigate?.(it); };
  return (
    <div className="relative w-full mt-3 text-left">
      <label className="flex items-center gap-3 h-[52px] pl-4 pr-2 rounded-xl border border-[var(--border-control)] bg-[var(--surface)] text-[var(--text-muted)] transition focus-within:border-[var(--focus-ring)] focus-within:shadow-[0_0_0_3px_var(--accent-subtle)]">
        <span className="sr-only">Rechercher sur Cimaise</span>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        <input role="combobox" aria-expanded={open} aria-controls="nfr-list" aria-autocomplete="list" aria-activedescendant={open && active >= 0 ? `nfr-opt-${active}` : undefined}
          value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 80)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!open) return setOpen(true); if (shown.length) setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : -1) + shown.length) % shown.length); }
            else if (e.key === 'Enter') { e.preventDefault(); choose(active); }
            else if (e.key === 'Escape') { if (open) { e.preventDefault(); setOpen(false); } else setQ(''); }
          }}
          placeholder="Une exposition, un musée, un artiste…" autoComplete="off" spellCheck={false}
          className="flex-1 min-w-0 h-full border-0 bg-transparent outline-none text-base text-[var(--text-strong)] placeholder:text-[var(--text-muted)]" />
        <kbd aria-hidden="true" className="hidden sm:inline-flex items-center h-7 px-2 rounded-lg border border-[var(--border)] font-mono text-xs text-[var(--text-muted)]">Entrée</kbd>
      </label>
      {open && (
        <ul id="nfr-list" role="listbox" aria-label="Suggestions" onPointerDown={(e) => e.preventDefault()}
          className="absolute inset-x-0 top-[calc(100%+8px)] z-10 grid gap-0.5 max-h-80 m-0 p-1.5 overflow-y-auto list-none rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-popover)] origin-top motion-safe:animate-[nfr-in_220ms_cubic-bezier(.2,0,0,1)]">
          <li role="presentation" className="px-2.5 pt-2 pb-1 font-mono text-[11px] leading-4 uppercase tracking-[0.04em] text-[var(--text-muted)]">{q.trim() ? 'Résultats' : 'Recherches fréquentes'}</li>
          {!shown.length && <li role="presentation" className="px-2.5 py-3 text-sm text-[var(--text-muted)]">Aucun résultat pour «&nbsp;{q}&nbsp;». Essayez un nom de ville ou de musée.</li>}
          {shown.map((it, i) => (
            <li key={it.t} id={`nfr-opt-${i}`} role="option" aria-selected={i === active} onPointerMove={() => setActive(i)} onClick={() => choose(i)}
              style={{ animationDelay: `${i * 24}ms` }}
              className={`grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[92px_minmax(0,1fr)_auto] items-center gap-3 min-h-14 sm:min-h-12 px-2.5 py-1.5 rounded-lg cursor-pointer motion-safe:animate-[nfr-in_260ms_cubic-bezier(.2,0,0,1)_both] ${i === active ? 'bg-[var(--raised)]' : ''}`}>
              <span className={`hidden sm:inline-flex justify-self-start items-center h-[22px] px-2 rounded-full text-xs font-medium ${it.k === 'Exposition' ? 'bg-[var(--accent-subtle)] text-[var(--text-strong)]' : 'bg-[var(--tint-neutral-bg)] text-[var(--tint-neutral-fg)]'}`}>{it.k}</span>
              <span className="min-w-0">
                <span className="block truncate text-[15px] leading-5 font-medium text-[var(--text-strong)]"><Highlight text={it.t} q={q.trim()} /></span>
                <span className="block truncate text-[13px] leading-[18px] text-[var(--text-muted)]">{it.m}</span>
              </span>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className={`text-[var(--text-muted)] transition-opacity ${i === active ? 'opacity-100' : 'opacity-0'}`}><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </li>
          ))}
        </ul>
      )}
      <p role="status" className="sr-only">{status}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Exemple : la page 404 de Cimaise, billetterie d'expositions et de musées. */
export const ITEMS = [
  { k: 'Exposition', t: 'Lumières du Nord, peinture scandinave 1880–1910', m: 'Musée des Bastions, Lyon · jusqu’au 2 mars' },
  { k: 'Exposition', t: 'Matière brute, sculpture contemporaine', m: 'La Halle aux grains, Toulouse · jusqu’au 18 janv.' },
  { k: 'Exposition', t: 'Photographier la ville, 1950–1980', m: 'Galerie du Quai, Marseille · jusqu’au 9 févr.' },
  { k: 'Exposition', t: 'Tisser le paysage, tapisseries d’artistes', m: 'Pavillon Saint-Roch, Rouen · dès le 14 déc.' },
  { k: 'Lieu', t: 'Musée des Bastions', m: 'Lyon 2e · ouvert aujourd’hui jusqu’à 18 h' },
  { k: 'Lieu', t: 'Pavillon Saint-Roch', m: 'Rouen · fermé le lundi' },
  { k: 'Pratique', t: 'Billetterie et tarifs réduits', m: 'Moins de 26 ans, demandeurs d’emploi, groupes' },
  { k: 'Pratique', t: 'Pass Cimaise annuel', m: 'Entrée libre dans 40 lieux partenaires' },
  { k: 'Pratique', t: 'Accessibilité des lieux', m: 'Fauteuils, boucles magnétiques, visites en LSF' },
  { k: 'Pratique', t: 'Visites en famille', m: 'Ateliers dès 4 ans, le mercredi et le week-end' },
];

export default function CimaiseNotFound(props) {
  return (
    <div className="relative w-full max-w-[1120px] mx-auto rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--surface)] font-sans text-[var(--text)]">
      <header className="relative z-[2] flex items-center gap-3 sm:gap-6 h-16 px-4 sm:px-6 border-b border-[var(--border)] bg-[var(--surface)] rounded-t-xl sm:rounded-t-2xl">
        <a href="#" aria-label="Cimaise, accueil" className="inline-flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em] text-[var(--text-strong)] no-underline">
          <svg viewBox="0 0 100 100" width="28" height="28" aria-hidden="true"><rect width="100" height="100" rx="28" style={{ fill: 'var(--accent)' }} /><g fill="none" style={{ stroke: 'var(--accent-fg)' }} strokeWidth="6" strokeLinecap="round"><rect x="24" y="22" width="52" height="40" rx="3" /><path d="M50 22V12M22 78h56" /></g><rect x="40" y="70" width="20" height="8" style={{ fill: 'var(--accent-fg)' }} /><circle cx="50" cy="42" r="8" style={{ fill: 'var(--accent-fg)' }} /></svg>
          Cimaise
        </a>
        <nav aria-label="Principale" className="hidden sm:flex gap-1">
          {['Expositions', 'Lieux', 'Billetterie'].map((l) => <a key={l} href="#" className="inline-flex items-center h-9 px-3 rounded-lg text-sm font-medium text-[var(--text-muted)] no-underline hover:bg-[var(--state-hover)] hover:text-[var(--text-strong)]">{l}</a>)}
        </nav>
        <a href="#" className="ml-auto inline-flex items-center h-10 sm:h-9 px-3 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--text-strong)] no-underline">Mon compte</a>
      </header>
      <main className="px-4 sm:px-6 pt-4 sm:pt-6 pb-10 sm:pb-14">
        <NotFoundPlayground {...props} />
        <section aria-labelledby="nfr-h2" className="grid justify-items-center gap-3 max-w-[600px] mx-auto mt-8 sm:mt-10 text-center">
          <h2 id="nfr-h2" className="m-0 text-[length:var(--t-page)] leading-[1.2] font-semibold tracking-[-0.02em] text-[var(--text-strong)] [text-wrap:balance]">Cette salle est fermée au public</h2>
          <p className="m-0 text-[15px] leading-6 text-[var(--text-muted)] [text-wrap:pretty]">La page que vous cherchez a été déplacée ou n’a jamais été accrochée. Cherchez une exposition, un lieu ou une information pratique.</p>
          <NotFoundSearch items={ITEMS} />
          <ul role="list" className="flex flex-wrap justify-center gap-x-2 gap-y-1 mt-2 p-0 list-none">
            {['Expositions en cours', 'Musées près de vous', 'Billetterie', 'Nous écrire'].map((l) => (
              <li key={l}><a href="#" className="inline-flex items-center h-11 sm:h-9 px-2.5 rounded-lg text-[15px] sm:text-sm font-medium text-[var(--text-strong)] underline decoration-[var(--border-control)] underline-offset-4 hover:bg-[var(--state-hover)] hover:decoration-[var(--text-strong)]">{l}</a></li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
