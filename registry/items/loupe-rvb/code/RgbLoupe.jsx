// Loupe RVB — React + Tailwind CSS. Shader WebGL 1 natif, repli canvas 2D, sans dépendance.
// Couleurs : variables de tokens.css (voile --bg, bord --text-strong ; l'image d'exemple est dessinée avec la palette).
// Le moteur ci-dessous est du JavaScript sans framework (écouteurs posés sur la scène, retirés au démontage par destroy).
import { useEffect, useRef } from 'react';

const REDUCED = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

/* eslint-disable */
function css(el, v) {
  var i = document.createElement('i'); i.style.cssText = 'position:absolute;visibility:hidden;color:var(' + v + ')'; el.appendChild(i);
  var c = getComputedStyle(i).color; i.remove(); return c;
}
function rgb(c) { return (String(c).match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(function (n) { return n / 255; }); }

/* Image d'exemple : un cadran dessiné finement (guillochage, minuterie, textes) pour tenir le grossissement. */
function drawWatch(el, S) {
  var c = document.createElement('canvas'); c.width = c.height = S;
  var g = c.getContext('2d'), k = S / 1000, C = function (v) { return css(el, v); };
  var bg = C('--raised'), ink = C('--text-strong'), muted = C('--text-muted'), acc = C('--accent'), viv = C('--accent-vivid'), soft = C('--accent-subtle'), softB = C('--accent-subtle-border'), surf = C('--surface'), bord = C('--border'), bstrong = C('--border-strong');
  var font = getComputedStyle(el).fontFamily || 'sans-serif', mono = getComputedStyle(document.documentElement).getPropertyValue('--font-mono') || 'monospace';
  g.scale(k, k); g.fillStyle = bg; g.fillRect(0, 0, 1000, 1000);
  // Bracelet en cuir : deux bandes, piqûres en pointillé
  var darkBg = (rgb(bg)[0] + rgb(bg)[1] + rgb(bg)[2]) / 3 < .5;
    g.fillStyle = darkBg ? C('--border-control') : ink; g.globalAlpha = .9;
  g.fillRect(380, -20, 240, 220); g.fillRect(380, 800, 240, 240); g.globalAlpha = 1;
  g.setLineDash([10, 9]); g.lineWidth = 2.5; g.strokeStyle = softB;
  [[396, -20, 396, 200], [604, -20, 604, 200], [396, 800, 396, 1020], [604, 800, 604, 1020]].forEach(function (l) { g.beginPath(); g.moveTo(l[0], l[1]); g.lineTo(l[2], l[3]); g.stroke(); });
  g.setLineDash([]);
  // Cornes et boîte
  g.fillStyle = bstrong; [[360, 150, 60, 90], [580, 150, 60, 90], [360, 760, 60, 90], [580, 760, 60, 90]].forEach(function (r) { g.beginPath(); g.roundRect(r[0], r[1], r[2], r[3], 18); g.fill(); });
  g.beginPath(); g.arc(500, 500, 330, 0, 7); g.fillStyle = bstrong; g.fill();
  g.beginPath(); g.arc(500, 500, 316, 0, 7); g.fillStyle = surf; g.fill();
  g.beginPath(); g.arc(500, 500, 308, 0, 7); g.lineWidth = 2; g.strokeStyle = bord; g.stroke();
  // Couronne
  g.fillStyle = bstrong; g.beginPath(); g.roundRect(820, 470, 34, 60, 8); g.fill();
  g.strokeStyle = surf; g.lineWidth = 2; for (var cy = 476; cy < 526; cy += 7) { g.beginPath(); g.moveTo(826, cy); g.lineTo(848, cy); g.stroke(); }
  // Cadran soleillé : rayons très fins
  g.save(); g.beginPath(); g.arc(500, 500, 290, 0, 7); g.clip();
  g.fillStyle = soft; g.fillRect(200, 200, 600, 600);
  g.strokeStyle = acc; g.lineWidth = 0.8;
  for (var a = 0; a < 720; a++) { var t = a / 720 * Math.PI * 2; g.globalAlpha = a % 2 ? .10 : .22; g.beginPath(); g.moveTo(500 + Math.cos(t) * 60, 500 + Math.sin(t) * 60); g.lineTo(500 + Math.cos(t) * 290, 500 + Math.sin(t) * 290); g.stroke(); }
  // Guillochage en rosace au centre
  g.globalAlpha = .28; g.lineWidth = 0.7;
  for (var r0 = 0; r0 < 24; r0++) { g.beginPath(); g.arc(500 + Math.cos(r0 / 24 * 6.283) * 40, 500 + Math.sin(r0 / 24 * 6.283) * 40, 110, 0, 7); g.stroke(); }
  g.globalAlpha = 1; g.restore();
  // Minuterie chemin de fer
  for (var m = 0; m < 60; m++) {
    var ang = m / 60 * 6.283 - 1.5708, big = m % 5 === 0;
    g.strokeStyle = ink; g.lineWidth = big ? 3 : 1.4;
    g.beginPath(); g.moveTo(500 + Math.cos(ang) * 282, 500 + Math.sin(ang) * 282); g.lineTo(500 + Math.cos(ang) * (big ? 262 : 270), 500 + Math.sin(ang) * (big ? 262 : 270)); g.stroke();
  }
  g.beginPath(); g.arc(500, 500, 283, 0, 7); g.lineWidth = 1; g.strokeStyle = ink; g.stroke();
  g.beginPath(); g.arc(500, 500, 269, 0, 7); g.stroke();
  // Index appliqués (sauf 3, 6, 9, 12 : chiffres)
  for (var h = 0; h < 12; h++) {
    var ah = h / 12 * 6.283 - 1.5708;
    if (h % 3 === 0) continue;
    g.save(); g.translate(500 + Math.cos(ah) * 220, 500 + Math.sin(ah) * 220); g.rotate(ah + 1.5708);
    g.fillStyle = ink; g.beginPath(); g.roundRect(-7, -26, 14, 52, 3); g.fill();
    g.fillStyle = surf; g.fillRect(-1.5, -20, 3, 40); g.restore();
  }
  g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '600 64px ' + font; g.fillText('12', 500, 290); g.fillText('9', 290, 502);
  // Guichet de date à 3 h
  g.fillStyle = surf; g.strokeStyle = ink; g.lineWidth = 2; g.beginPath(); g.roundRect(672, 474, 62, 52, 6); g.fill(); g.stroke();
  g.fillStyle = ink; g.font = '600 34px ' + font; g.fillText('14', 703, 502);
  // Petite seconde à 6 h, guillochée en cercles
  g.save(); g.beginPath(); g.arc(500, 676, 74, 0, 7); g.fillStyle = surf; g.fill(); g.clip();
  g.strokeStyle = acc; g.globalAlpha = .35; g.lineWidth = .8; for (var rr = 6; rr < 74; rr += 5) { g.beginPath(); g.arc(500, 676, rr, 0, 7); g.stroke(); }
  g.restore(); g.globalAlpha = 1;
  for (var s2 = 0; s2 < 60; s2++) { var as = s2 / 60 * 6.283 - 1.5708, b2 = s2 % 10 === 0; g.strokeStyle = ink; g.lineWidth = b2 ? 2 : 1; g.beginPath(); g.moveTo(500 + Math.cos(as) * 70, 676 + Math.sin(as) * 70); g.lineTo(500 + Math.cos(as) * (b2 ? 58 : 64), 676 + Math.sin(as) * (b2 ? 58 : 64)); g.stroke(); }
  g.font = '600 16px ' + font; g.fillStyle = ink; g.fillText('60', 500, 630); g.fillText('30', 500, 724); g.fillText('15', 547, 677); g.fillText('45', 453, 677);
  g.strokeStyle = viv; g.lineWidth = 2.5; g.beginPath(); g.moveTo(500, 690); g.lineTo(538, 638); g.stroke(); g.beginPath(); g.arc(500, 676, 5, 0, 7); g.fillStyle = viv; g.fill();
  // Textes (micro-détails pour la loupe)
  g.fillStyle = ink; g.font = '600 30px ' + font; g.fillText('CADRAN', 500, 380);
  g.font = '500 13px ' + mono; g.fillStyle = muted; g.fillText('BESANÇON · AUTOMATIQUE · 72 H', 500, 410);
  g.font = '500 10px ' + mono; g.fillText('MOUVEMENT FRANÇAIS  ·  N° 0147 / 300', 500, 766);
  // Aiguilles (10 h 09) bleuies : couleur d'accent
  function hand(angle, len, w, tail, col, lume) {
    g.save(); g.translate(500, 500); g.rotate(angle);
    g.fillStyle = col; g.beginPath(); g.moveTo(-w / 2, tail); g.lineTo(-w * .35, -len + 18); g.lineTo(0, -len); g.lineTo(w * .35, -len + 18); g.lineTo(w / 2, tail); g.closePath(); g.fill();
    if (lume) { g.fillStyle = surf; g.beginPath(); g.roundRect(-w * .18, -len + 40, w * .36, len * .55, 3); g.fill(); }
    g.restore();
  }
  hand((10 + 9 / 60) / 12 * 6.283, 170, 22, 30, acc, true);
  hand(9 / 60 * 6.283, 248, 16, 34, acc, true);
  g.save(); g.translate(500, 500); g.rotate(37 / 60 * 6.283); g.strokeStyle = viv; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 60); g.lineTo(0, -270); g.stroke();
  g.fillStyle = viv; g.beginPath(); g.arc(0, 44, 9, 0, 7); g.fill(); g.restore();
  g.beginPath(); g.arc(500, 500, 13, 0, 7); g.fillStyle = acc; g.fill(); g.beginPath(); g.arc(500, 500, 5, 0, 7); g.fillStyle = surf; g.fill();
  // Reflet du saphir : un arc clair très discret
  g.save(); g.beginPath(); g.arc(500, 500, 300, 3.6, 4.6); g.lineWidth = 26; g.strokeStyle = surf; g.globalAlpha = .18; g.stroke(); g.restore();
  return c;
}

var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
var FS = [
  'precision highp float;',
  'uniform sampler2D uTex;uniform vec2 uRes;uniform float uImgAsp;uniform vec2 uLens;uniform float uSize;uniform float uZoom;uniform float uShift;',
  'uniform float uRadius;uniform float uDim;uniform float uOn;uniform float uBarrel;uniform vec3 uBg;uniform vec3 uEdge;',
  'vec2 toUV(vec2 p){vec2 q=p/uRes;float ca=uRes.x/uRes.y;',
  '  if(ca>uImgAsp){q.y=.5+(q.y-.5)*(uImgAsp/ca);}else{q.x=.5+(q.x-.5)*(ca/uImgAsp);}return q;}',
  'float box(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}',
  'void main(){',
  '  vec2 p=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y);',
  '  vec3 base=texture2D(uTex,toUV(p)).rgb;',
  '  float h=uSize*.5;float d=box(p-uLens,vec2(h),min(uRadius,h));',
  '  vec3 col=mix(base,uBg,uDim*uOn);',
  '  if(uSize>1.&&d<1.5){',
  '    vec2 dir=(p-uLens)/max(h,1.);float r2=dot(dir,dir);',
  '    vec2 off=(p-uLens)/uZoom*(1.-uBarrel*.12*r2);',
  '    vec2 q=uLens+off;vec2 sv=dir*uShift/uZoom*(.15+.85*r2);',
  '    float rr=texture2D(uTex,toUV(q+sv)).r;float gg=texture2D(uTex,toUV(q)).g;float bb=texture2D(uTex,toUV(q-sv)).b;',
  '    vec3 lens=vec3(rr,gg,bb);',
  '    lens*=1.-.10*smoothstep(.55,1.,max(abs(dir.x),abs(dir.y)));',
  '    float inside=1.-smoothstep(-.75,.75,d);',
  '    col=mix(col,lens,inside);',
  '    float edge=1.-smoothstep(0.,1.4,abs(d+.6));col=mix(col,uEdge,edge*.9);',
  '  }',
  '  gl_FragColor=vec4(col,1.);',
  '}'].join('\n');

export function createLoupe(el, initial) {
  var o = Object.assign({}, initial), frame = el.querySelector('[data-lp-frame]'), zoomEl = el.querySelector('[data-lp-zoom]'), statusEl = el.querySelector('[data-lp-status]');
  var canvas = document.createElement('canvas'); el.insertBefore(canvas, el.firstChild);
  var gl = null, prog = null, U = {}, tex = null, ctx = null, img = null, imgAsp = 1;
  if (o.fallback !== 'canvas') { try { gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false }); } catch (e) { gl = null; } }
  if (gl) {
    var sh = function (t, s) { var x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); return gl.getShaderParameter(x, gl.COMPILE_STATUS) ? x : null; };
    var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (vs && fs) { prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog); if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) prog = null; }
    if (prog) {
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      ['uTex', 'uRes', 'uImgAsp', 'uLens', 'uSize', 'uZoom', 'uShift', 'uRadius', 'uDim', 'uOn', 'uBarrel', 'uBg', 'uEdge'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
      tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    } else gl = null;
  }
  if (!gl) { var c2 = document.createElement('canvas'); canvas.replaceWith(c2); canvas = c2; ctx = canvas.getContext('2d'); }
  el.dataset.renderer = gl ? 'webgl' : 'canvas';

  var W = 1, H = 1, dpr = 1, raf = 0, last = 0, visible = true;
  var lx = { v: 0, t: 0, vel: 0 }, ly = { v: 0, t: 0, vel: 0 }, on = { v: 0, t: 0, vel: 0 };
  var bgC = [0, 0, 0], edgeC = [1, 1, 1], placed = false, touchTimer = 0, touchOn = false, touchStart = null;

  function themeColors() { bgC = rgb(css(el, '--bg')); edgeC = rgb(css(el, '--text-strong')); }
  function useImage(source) {
    img = source; imgAsp = (source.width || 1) / (source.height || 1);
    if (gl) { gl.bindTexture(gl.TEXTURE_2D, tex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source); }
    render();
  }
  function sample() { useImage(drawWatch(el, W * dpr > 900 ? 2048 : 1536)); }
  function load() {
    if (!o.src) { (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(sample); return; }
    var im = new Image(); im.crossOrigin = 'anonymous'; el.dataset.state = 'loading';
    im.onload = function () { el.dataset.state = 'ready'; useImage(im); };
    im.onerror = function () { el.dataset.state = 'error'; statusEl.textContent = 'Image indisponible : exemple intégré affiché.'; el.dispatchEvent(new CustomEvent('loupe:error')); sample(); };
    im.src = o.src;
  }
  function resize() {
    var r = el.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
    if (!placed) { lx.v = lx.t = W * .5; ly.v = ly.t = H * .5; }
  }
  function lensSize() { return Math.min(o.size, W * .7, H * .7); }
  function render() {
    if (!img) return;
    var s = lensSize() * (0.35 + 0.65 * on.v) * (on.v > 0.01 ? 1 : 0), rad = o.shape === 'round' ? 9999 : 12;
    if (gl) {
      gl.uniform1i(U.uTex, 0); gl.uniform2f(U.uRes, canvas.width, canvas.height); gl.uniform1f(U.uImgAsp, imgAsp);
      gl.uniform2f(U.uLens, lx.v * dpr, ly.v * dpr); gl.uniform1f(U.uSize, s * dpr); gl.uniform1f(U.uZoom, o.zoom);
      gl.uniform1f(U.uShift, (REDUCED.matches ? 0 : o.shift) * dpr); gl.uniform1f(U.uRadius, rad * dpr); gl.uniform1f(U.uDim, o.dim);
      gl.uniform1f(U.uOn, on.v); gl.uniform1f(U.uBarrel, o.barrel ? 1 : 0);
      gl.uniform3f(U.uBg, bgC[0], bgC[1], bgC[2]); gl.uniform3f(U.uEdge, edgeC[0], edgeC[1], edgeC[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else {
      var cw = canvas.width, ch = canvas.height, ca = cw / ch, sw = img.width, shh = img.height, sx = 0, sy = 0;
      if (ca > imgAsp) { shh = img.width / ca; sy = (img.height - shh) / 2; } else { sw = img.height * ca; sx = (img.width - sw) / 2; }
      ctx.drawImage(img, sx, sy, sw, shh, 0, 0, cw, ch);
      if (on.v > 0.01) {
        ctx.fillStyle = 'rgba(' + bgC.map(function (v) { return Math.round(v * 255); }).join(',') + ',' + (o.dim * on.v) + ')'; ctx.fillRect(0, 0, cw, ch);
        var L = s * dpr, cx = lx.v * dpr, cy = ly.v * dpr, kx = sw / cw, ky = shh / ch;
        ctx.save(); ctx.beginPath(); ctx.roundRect(cx - L / 2, cy - L / 2, L, L, Math.min(rad * dpr, L / 2)); ctx.clip();
        var srcW = L / o.zoom * kx, srcH = L / o.zoom * ky;
        ctx.drawImage(img, sx + cx * kx - srcW / 2, sy + cy * ky - srcH / 2, srcW, srcH, cx - L / 2, cy - L / 2, L, L);
        ctx.restore();
        ctx.lineWidth = 1.5 * dpr; ctx.strokeStyle = 'rgb(' + edgeC.map(function (v) { return Math.round(v * 255); }).join(',') + ')';
        ctx.beginPath(); ctx.roundRect(cx - L / 2, cy - L / 2, L, L, Math.min(rad * dpr, L / 2)); ctx.stroke();
      }
    }
    var fs = s, fx = lx.v - fs / 2, fy = ly.v - fs / 2;
    frame.style.setProperty('--lp-size', fs + 'px');
    frame.style.transform = 'translate(' + fx.toFixed(2) + 'px,' + fy.toFixed(2) + 'px)';
  }
  function spring(s, k, c, dt) { s.vel += ((s.t - s.v) * k - s.vel * c) * dt; s.v += s.vel * dt; return Math.abs(s.t - s.v) + Math.abs(s.vel) * .01; }
  function step(now) {
    raf = 0; if (!visible) return;
    var dt = Math.min(0.032, last ? (now - last) / 1000 : 0.016); last = now; var e = 0;
    if (REDUCED.matches) { lx.v = lx.t; ly.v = ly.t; on.v = on.t; lx.vel = ly.vel = on.vel = 0; }
    else { var k = o.stiffness, c = 2 * Math.sqrt(k) * 0.9; e = spring(lx, k, c, dt) + spring(ly, k, c, dt) + spring(on, 220, 26, dt); }
    on.v = Math.max(0, Math.min(1.06, on.v));
    render();
    if (e > 0.02) raf = requestAnimationFrame(step); else { last = 0; if (on.t === 0) { on.v = 0; render(); } }
  }
  function wake() { if (!raf && visible) raf = requestAnimationFrame(step); }
  function setOn(v) { on.t = v ? 1 : 0; el.classList.toggle('is-on', !!v); wake(); }
  function moveTo(x, y, snap) {
    var h = lensSize() / 2; x = Math.max(h * .4, Math.min(W - h * .4, x)); y = Math.max(h * .4, Math.min(H - h * .4, y));
    lx.t = x; ly.t = y; if (snap || !placed) { lx.v = x; ly.v = y; } placed = true; wake();
  }
  function local(e) { var r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }

  el.addEventListener('pointerenter', function (e) { if (e.pointerType === 'touch') return; var p = local(e); moveTo(p[0], p[1], on.v < .05); setOn(true); });
  el.addEventListener('pointermove', function (e) {
    var p = local(e);
    if (e.pointerType === 'touch') {
      if (touchOn) moveTo(p[0], p[1] - lensSize() * .5 - 24);
      else if (touchStart && Math.hypot(p[0] - touchStart[0], p[1] - touchStart[1]) > 8) { clearTimeout(touchTimer); touchStart = null; }
      return;
    }
    moveTo(p[0], p[1]); if (!el.classList.contains('is-on')) setOn(true);
  }, { passive: true });
  el.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') setOn(false); });
  // Tactile : appui long pour activer, puis la loupe suit le doigt (au-dessus de lui) sans faire défiler
  el.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'touch') return;
    var p = local(e); touchStart = p; clearTimeout(touchTimer);
    touchTimer = setTimeout(function () { touchOn = true; moveTo(p[0], p[1] - lensSize() * .5 - 24, true); setOn(true); }, 220);
  });
  window.addEventListener('pointerup', function (e) { if (e.pointerType !== 'touch') return; clearTimeout(touchTimer); touchStart = null; if (touchOn) { touchOn = false; setOn(false); } });
  el.addEventListener('touchmove', function (e) { if (touchOn) e.preventDefault(); }, { passive: false });
  el.addEventListener('contextmenu', function (e) { if (touchOn || touchStart) e.preventDefault(); });
  // Clavier : flèches pour déplacer, + / − pour le grossissement, Échap pour ranger
  el.addEventListener('focus', function () { if (!placed) moveTo(W * .5, H * .5, true); setOn(true); });
  el.addEventListener('blur', function () { setOn(false); });
  el.addEventListener('keydown', function (e) {
    var st = e.shiftKey ? 48 : 16, map = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] };
    if (map[e.key]) { e.preventDefault(); setOn(true); moveTo(lx.t + map[e.key][0], ly.t + map[e.key][1]); }
    else if (e.key === '+' || e.key === '=' || e.key === '-') {
      e.preventDefault(); o.zoom = Math.max(1.5, Math.min(6, Math.round((o.zoom + (e.key === '-' ? -.5 : .5)) * 10) / 10));       label(); statusEl.textContent = 'Grossissement ' + zoomEl.textContent; render();
    } else if (e.key === 'Escape') setOn(false);
  });
  function label() { zoomEl.textContent = '× ' + String(o.zoom).replace('.', ','); }

  var ro = new ResizeObserver(function () { var oldW = W; resize(); if (!o.src && img && Math.abs(W - oldW) > 200) sample(); else render(); }); ro.observe(el);
  var io = new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) wake(); }); io.observe(el);
  var mo = new MutationObserver(function () { themeColors(); if (!o.src) sample(); else render(); });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-accent'] });

  themeColors(); resize(); label(); load();
  requestAnimationFrame(function () { el.setAttribute('data-ready', ''); });

  var api = {
    renderer: gl ? 'webgl' : 'canvas',
    update: function (n) { var srcChanged = n.src !== o.src; o = n; el.dataset.shape = o.shape; label(); if (srcChanged) load(); else render(); wake(); },
    /* Démo et tests : poser la loupe en (x, y), fractions de la scène */
    destroy: function () { cancelAnimationFrame(raf); clearTimeout(touchTimer); ro.disconnect(); io.disconnect(); mo.disconnect(); canvas.remove(); },
  peek: function (fx, fy) { if (fx == null) { setOn(false); return; } moveTo(W * fx, H * fy, true); on.v = 1; setOn(true); render(); },
  };
  return api;
}

/* eslint-enable */

/**
 * @param {object} props
 * @param {string} [props.src='']        Image servie avec CORS ; vide = cadran d'exemple
 * @param {string} props.alt             Description de l'image
 * @param {number} [props.size=200]      Côté de la loupe (px)
 * @param {number} [props.zoom=2.6]      Grossissement (+ / − au clavier)
 * @param {number} [props.shift=5]       Décalage RVB visible au bord (px)
 * @param {boolean} [props.barrel=true]  Déformation de lentille
 * @param {number} [props.dim=0.28]      Voile autour de la loupe
 * @param {'square'|'round'} [props.shape='square']
 * @param {number} [props.stiffness=260] Raideur du suivi
 */
export function RgbLoupe({ src = '', alt, size = 200, zoom = 2.6, shift = 5, barrel = true, dim = 0.28, shape = 'square', stiffness = 260, className = '' }) {
  const ref = useRef(null), api = useRef(null);
  const opts = { size, zoom, shift, barrel, dim, shape, stiffness, src, fallback: '' };
  useEffect(() => { api.current = createLoupe(ref.current, opts); return () => api.current.destroy(); }, []);
  useEffect(() => { api.current?.update(opts); }, [size, zoom, shift, barrel, dim, shape, stiffness, src]);

  return (
    <figure ref={ref} tabIndex={0} data-shape={shape}
      aria-label={`${alt}. Survolez, ou utilisez les flèches, pour inspecter à la loupe ; plus et moins changent le grossissement.`}
      className={`group relative m-0 aspect-square cursor-crosshair touch-pan-y overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--raised)] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] min-[900px]:rounded-2xl [&>canvas]:absolute [&>canvas]:inset-0 [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full ${className}`}>
      <span data-lp-frame aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-[2] h-[var(--lp-size,200px)] w-[var(--lp-size,200px)] opacity-0 will-change-transform group-[.is-on]:opacity-100 group-[.is-on]:transition-opacity group-[.is-on]:duration-200">
        {['-left-1.5 -top-1.5 border-l-[1.5px] border-t-[1.5px]', '-right-1.5 -top-1.5 border-r-[1.5px] border-t-[1.5px]', '-bottom-1.5 -left-1.5 border-b-[1.5px] border-l-[1.5px]', '-bottom-1.5 -right-1.5 border-b-[1.5px] border-r-[1.5px]'].map((c) => (
          <i key={c} className={`absolute size-3.5 border-[var(--text-strong)] group-data-[shape=round]:hidden ${c}`} />
        ))}
        <b data-lp-zoom className="absolute left-1/2 top-[calc(100%+12px)] grid h-6 -translate-x-1/2 place-items-center whitespace-nowrap rounded-full bg-[var(--text-strong)] px-2 font-mono text-xs font-semibold tabular-nums text-[var(--bg)]" />
      </span>
      <figcaption className="absolute bottom-4 left-4 z-[1] inline-flex h-8 items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 font-mono text-xs text-[var(--text-muted)] transition-opacity duration-[260ms] group-[.is-on]:opacity-0">
        <span className="[@media(hover:none),(pointer:coarse)]:hidden">Survolez pour inspecter</span>
        <span className="hidden [@media(hover:none),(pointer:coarse)]:inline">Touchez longuement pour inspecter</span>
      </figcaption>
      <p data-lp-status role="status" aria-live="polite" className="sr-only" />
    </figure>
  );
}

/* Exemple : fiche produit de Cadran (marque fictive, horlogerie). */
const SPECS = [['Calibre', 'Automatique C-12'], ['Réserve de marche', '72 h'], ['Verre', 'Saphir bombé'], ['Étanchéité', '10 bar']];
const btn = 'inline-flex min-h-12 w-full items-center justify-center rounded-lg px-[22px] text-[15px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] min-[900px]:w-auto';

export default function CadranProduct() {
  return (
    <section aria-labelledby="cadran-title" className="mx-auto grid max-w-[1200px] gap-7 px-5 pb-10 pt-4 [font-family:var(--font-sans)] text-[var(--text)] min-[900px]:grid-cols-[1.1fr_.9fr] min-[900px]:items-center min-[900px]:gap-14 min-[900px]:px-6 min-[900px]:py-14">
      <RgbLoupe alt="Montre Méridien 38, cadran soleillé, aiguilles bleuies" />
      <div>
        <a href="#cadran" aria-label="Cadran, accueil" className="mb-2 inline-flex min-h-11 items-center gap-2.5 rounded-lg text-lg font-semibold tracking-[-0.02em] text-[var(--text-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] min-[900px]:mb-4">
          <svg viewBox="0 0 100 100" aria-hidden="true" className="size-[26px] text-[var(--accent)]"><circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" /><path d="M50 22v28l18 12" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="50" cy="50" r="6" fill="currentColor" /></svg>
          Cadran
        </a>
        <p className="mb-2 font-mono text-xs uppercase leading-normal tracking-[.04em] text-[var(--text-muted)]">Atelier de Besançon · Série de 300</p>
        <h1 id="cadran-title" className="text-[clamp(2.25rem,1.5rem+2.8vw,3.75rem)] font-semibold leading-none tracking-[-0.04em] text-[var(--text-strong)]">Méridien&nbsp;38</h1>
        <p className="mt-4 text-[22px] font-semibold tabular-nums text-[var(--text-strong)]">1&nbsp;450&nbsp;€ <span className="text-sm font-normal text-[var(--text-muted)]">TTC, gravure offerte</span></p>
        <p className="mt-5 max-w-[28rem] text-base leading-relaxed text-[var(--text-muted)]">Cadran soleillé guilloché à la main, index appliqués et aiguilles bleuies à la flamme. Approchez : chaque détail tient à la loupe.</p>
        <dl className="mt-5 grid grid-cols-2 gap-x-6 border-t border-[var(--border)] min-[900px]:mt-7">
          {SPECS.map(([k, v]) => (
            <div key={k} className="grid gap-0.5 border-b border-[var(--border)] py-3">
              <dt className="text-[13px] text-[var(--text-muted)]">{k}</dt><dd className="text-[15px] font-medium text-[var(--text-strong)]">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-7 flex flex-col gap-3 min-[900px]:flex-row">
          <a href="#essayage" className={`${btn} bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]`}>Réserver un essayage</a>
          <a href="#panier" className={`${btn} border border-[var(--border-control)] bg-[var(--surface)] text-[var(--text-strong)] hover:bg-[var(--raised)]`}>Ajouter au panier</a>
        </div>
      </div>
    </section>
  );
}
