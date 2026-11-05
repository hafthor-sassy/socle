// GlobeClients.jsx — globe en points (WebGL1 maison, repli Canvas 2D), arcs de paiement animés depuis le siège,
// villes survolables, régions qui font tourner le globe sur un ressort, glisser avec inertie.
// React 18, Tailwind 3.4, tokens.css chargé. Aucune bibliothèque 3D. Exemple : Hélia (paiements internationaux, marque fictive).
// Utilisation :
//   <GlobeClients speed={6} tilt={18} density={14000} arcs={true} pulses={true} region={-1} />
//   <GlobeClients regions={…} cities={…} />   (cities[0] = point de départ des arcs)
import { useEffect, useRef, useState } from 'react';

/* eslint-disable */

  /* Moteur du globe : WebGL1 sans bibliothèque, repli Canvas 2D. Terres : masque 200 × 100 (Natural Earth 110 m, domaine public). */
  var LAND = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwD8AAAAAAAAAAAAAAAAAAAAAAAAAAPz/////HwAAAAAAAAAAAAAAAAAAAAAAAMD/n////wcA/AdAAACABwAAAAAAAAAAAGBs//P///8BAHgBAAAAADgAAAAAAAAAAACfuP/g////AQAAAADAAwD8BwACAAAAAACA8JF/APD//wEAAAAAOADw/wcADgAAAAAAwH/7/QPg//8AAAAAAA4M////DwwAAAF4AID94/0f4P//AAAAHgAG/v//////DwAA/////+9zfsD/fwAAwP8A4P7/////////B///////f/rB/wMAAPD/9////////////5///////x/+wf+ADwD8f/z///////////8A/v////93+IAfAAcA/v////////////9/AP//////AU4AHwAAgD//////////////fwD/+////wA+AAwAAIA/////////////4wcAfID///8A/gEAAACCPf7/////////B3EAAFgA/P//B/4DAAAABhv//////////wF8AAAAAPj//z//DwAAgA+m//////////8APAAAAAD0//9//x8AAICf////////////DxwAAAAA4P////8fAAAA/v///////////w8IAAAAAOD/////OQAAAPj///////////8LAAAAAACA/////3gAAAD8////////////CwAAAAAAgP////8HAAAA+P/ffv7//////wEAAAAAAID///+/AQAAAPj3Dz7///////8cAAAAAACA////HwAAAIA/3A94/v////8fDAAAAAAAgP///w8AAACAH/L///z/////DwQAAAAAAID///8HAAAAgA+Q+X/8////PwYGAAAAAAAA////AwAAAIDnC/n///////8MAwAAAAAAAP7//wMAAAAA/wNA//////9/7AMAAAAAAAD8//8AAAAAgP8HgP//////f3AAAAAAAAAA+P9/AAAAAMD/n7////////8QAAAAAAAAAPD/dwAAAADA////f///////AAAAAAAAAADwP8AAAAAA4P///3//////fwAAAAAAAAAAoD/AAAAAAPD//3//+P///38AAAAAAAAAAEA/AAAAAAD4/////g/+//+/AAAAAAAAAAAAPuABAAAA+P////4f/P//DwAAAAAAAAAAAD4MAwAAAPj////9H/iP/wIAAAAAAAAAAAB8BzgAAAD4////+Q/wB38DAAAAAAAAAAAA8AcAAAAA+P////sH8AP/gAAAAAAAAAAAAAA/AAAAAPz////zAeAB/MEAAAAAAAAAAAAAPAAAAAD8////fwDgAfyBAQAAAAAAAAAAADA4AAAA+P///48AwAHoAQIAAAAAAAAAAAAw/AMAAPD/////AMAAQAABAAAAAAAAAAAAwP8HAADg/////wAAAwgAAwAAAAAAAAAAAAD+HwAAwP///38AAAEYMAIAAAAAAAAAAAAA/n8AAICB//9/AAAANjgAAAAAAAAAAAAAAP//AAAAAP7/PwAAADw8AAAAAAAAAAAAAAD//wAAAAD+/x8AAAA4vwkAAAAAAAAAAACA//8HAAAA/v8PAAAAMN5gAAAAAAAAAAAAgP//PwAAAP7/BwAAAHDe6AcAAAAAAAAAAID//38AAAD8/wMAAABgwIEfAQAAAAAAAACA////AQAA+P8DAAAAwAAAvgQAAAAAAAAAAP///wEAAPj/AwAAAAAuAG4AAAAAAAAAAAD///8AAAD4/wMAAAAAAADAAAAAAAAAAAAA/v9/AAAA+P8HAAAAAABgCAAAAAAAAAAAAP7/fwAAAPj/hwAAAAAA8AwAAAAAAAAAAAD8/38AAAD8/8cAAAAAAP4cAAAAAAAAAAAA8P8/AAAA/P/zAAAAAAD/HwAAAAAAAAAAAOD/PwAAAPj/cAAAAACA/z8AAAAAAAAAAADg/z8AAAD4/3AAAAAA4P9/gAAAAAAAAAAA4P8fAAAA8P9wAAAAAPj//wAAAAAAAAAAAOD/AwAAAPD/MAAAAAD4//8BAAAAAAAAAADw/wEAAADwPwAAAAAA+P//AQAAAAAAAAAA8P8BAAAA4D8AAAAAAPj//wEAAAAAAAAAAPD/AAAAAOA/AAAAAADw//8BAAAAAAAAAADw/wAAAADAHwAAAAAA8P//AQAAAAAAAAAA8H8AAAAAwAcAAAAAAPCB/wAAAAAAAAAAAPAfAAAAAAAAAAAAAAAgAP8AEAAAAAAAAAD4HwAAAAAAAAAAAAAAAAD8ACAAAAAAAAAA+A8AAAAAAAAAAAAAAAAAOABgAAAAAAAAAPgBAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAD4AAAAAAAAAAAAAAAAAABgABgAAAAAAAAA+AAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAHwAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAB8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAADwMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAABgAAIASAAAAAAAAAAAAAAMAAAAAAAAAA4L8D/v///z8AAAAAAAAAAADwAQAAAAAAwP3/x///////DwAAAAAAAAAA+AMAAED///////P///////8HAAAAAAA4DPgDAADw////////////////BwAAwP///v//AQAA/P///////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';
  function createGlobe(wrap, canvas, opts, cb) {
    var bits = (function () { var s = atob(LAND), a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; })();
    function isLand(lat, lon) { var x = Math.floor((lon + 180) / 360 * 200) % 200, y = Math.min(99, Math.floor((90 - lat) / 180 * 100)), i = y * 200 + x; return (bits[i >> 3] >> (i & 7)) & 1; }
    function xyz(lat, lon, h) { var a = lat * Math.PI / 180, o = lon * Math.PI / 180, r = 1 + (h || 0); return [r * Math.cos(a) * Math.sin(o), r * Math.sin(a), r * Math.cos(a) * Math.cos(o)]; }
    var reduce = matchMedia('(prefers-reduced-motion: reduce)');
    var cities = opts.cities, hq = cities[0], SCALE = 0.8, TAU = Math.PI * 2;
    var st = { yaw: -(opts.startLon !== undefined ? opts.startLon : 10) * Math.PI / 180, pitch: (opts.tilt || 18) * Math.PI / 180, vy: 0, vp: 0, target: null, sel: -1, hot: -1, drag: null, t: 0, last: 0, visible: true, raf: 0, size: 0, dpr: 1 };
    var verts = [], counts = {};

    function buildGeometry() {
      verts = [];
      var N = opts.density || 14000, land = 0;
      for (var i = 0; i < N; i++) {
        var y = 1 - 2 * (i + 0.5) / N, lat = Math.asin(y) * 180 / Math.PI, lon = ((i * 2.399963229728653 * 180 / Math.PI) % 360) - 180;
        if (lat > -60 && isLand(lat, lon)) { var p = xyz(lat, lon); verts.push(p[0], p[1], p[2], 0, 0, -1); land++; }
      }
      var arcs = 0;
      if (opts.arcs !== false) cities.forEach(function (c, ci) {
        if (!ci) return;
        var a = xyz(hq.lat, hq.lon), b = xyz(c.lat, c.lon), dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2], ang = Math.acos(Math.max(-1, Math.min(1, dot)));
        var S = Math.max(24, Math.round(ang * 46)), sn = Math.sin(ang), lift = 0.05 + 0.2 * ang / Math.PI;
        for (var s = 0; s <= S; s++) {
          var t = s / S, k1 = Math.sin((1 - t) * ang) / sn, k2 = Math.sin(t * ang) / sn, h = 1 + lift * Math.sin(Math.PI * t);
          verts.push((a[0] * k1 + b[0] * k2) * h, (a[1] * k1 + b[1] * k2) * h, (a[2] * k1 + b[2] * k2) * h, 1, ci + t * 0.999, c.region); arcs++;
        }
      });
      cities.forEach(function (c, ci) { var p = xyz(c.lat, c.lon, 0.002); verts.push(p[0], p[1], p[2], 2, ci, c.region); });
      counts = { land: land, arcs: arcs, cities: cities.length };
      verts = new Float32Array(verts);
    }

    /* Couleurs relues dans tokens.css (palette et thème suivis par MutationObserver). */
    var probe = document.createElement('canvas').getContext('2d'), col = {};
    function rgb(v) { probe.fillStyle = '#000'; probe.fillStyle = v.trim() || '#000'; var s = probe.fillStyle; if (s[0] === '#') return [parseInt(s.slice(1, 3), 16) / 255, parseInt(s.slice(3, 5), 16) / 255, parseInt(s.slice(5, 7), 16) / 255]; var m = s.match(/[\d.]+/g); return [m[0] / 255, m[1] / 255, m[2] / 255]; }
    function readColors() { var cs = getComputedStyle(wrap); col = { land: rgb(cs.getPropertyValue('--text-muted')), acc: rgb(cs.getPropertyValue('--accent-vivid') || cs.getPropertyValue('--accent')), bg: rgb(cs.getPropertyValue('--surface')), strong: rgb(cs.getPropertyValue('--text-strong')) }; }

    var gl = null, prog, buf, U = {};
    try { gl = canvas.getContext('webgl', { antialias: true, premultipliedAlpha: false, alpha: true }) || canvas.getContext('experimental-webgl'); } catch (e) { gl = null; }
    var VS = 'attribute vec3 aPos;attribute vec3 aInfo;uniform mat3 uRot;uniform float uScale,uDpr,uPx,uTime,uSel,uHot,uPulse,uPt;varying float vA,vK,vR,vH;' +
      'void main(){vec3 p=uRot*aPos;float k=aInfo.x;gl_Position=vec4(p.x*uScale,p.y*uScale,0.,1.);float hid=(p.z<0.&&length(p.xy)<1.)?0.:1.;float u=uPx/560.;vK=k;vR=0.;vH=0.;' +
      'if(k<.5){vA=p.z>0.?(.3+.7*p.z):0.;gl_PointSize=uPt*uDpr*u*(.7+.5*p.z);}' +
      'else if(k<1.5){float idx=floor(aInfo.y),t=fract(aInfo.y),ph=fract(idx*.618),head=fract(uTime*.2+ph)*1.5-.25,d=t-head;' +
      'float tr=uPulse*smoothstep(-.22,0.,d)*(1.-smoothstep(0.,.025,d));float on=(uSel<0.||abs(aInfo.z-uSel)<.5)?1.:.22;' +
      'vA=hid*on*(.6+.4*tr);vH=tr;gl_PointSize=(3.+3.*tr)*uDpr*u;}' +
      'else{float on=(uSel<0.||abs(aInfo.z-uSel)<.5)?1.:.3;vA=(p.z>0.?1.:0.)*on;vR=fract(uTime*.55+aInfo.y*.37)*uPulse;vH=abs(aInfo.y-uHot)<.5?1.:0.;gl_PointSize=(30.+8.*vH)*uDpr*u;}}';
    var FS = 'precision mediump float;uniform vec3 uLand,uAcc,uBg,uStrong;varying float vA,vK,vR,vH;' +
      'void main(){vec2 c=gl_PointCoord*2.-1.;float r=length(c);if(vA<.003||r>1.)discard;vec3 col;float a;' +
      'if(vK<.5){col=uLand;a=vA*(1.-smoothstep(.72,1.,r));}' +
      'else if(vK<1.5){col=mix(uAcc,uStrong,vH*.3);a=vA*(1.-smoothstep(.7,1.,r));}' +
      'else{float core=1.-smoothstep(.24,.31,r);float edge=1.-smoothstep(.31,.41,r);float ring=(1.-vR)*(1.-smoothstep(.0,.06,abs(r-mix(.32,.96,vR))))*.8;' +
      'col=mix(uBg,uAcc,core);col=mix(col,uStrong,vH*core*.25);a=max(edge,ring*(1.-edge))*vA;col=mix(uAcc,col,edge);}' +
      'gl_FragColor=vec4(col,a);}';
    function compile(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
    if (gl) {
      try {
        prog = gl.createProgram(); gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
        gl.useProgram(prog); buf = gl.createBuffer();
        ['uRot', 'uScale', 'uDpr', 'uPx', 'uTime', 'uSel', 'uHot', 'uPulse', 'uPt', 'uLand', 'uAcc', 'uBg', 'uStrong'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
        gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      } catch (e) { console.warn('Globe : repli Canvas 2D', e); gl = null; }
    }
    var ctx = gl ? null : canvas.getContext('2d');
    wrap.dataset.rendu = gl ? 'webgl' : '2d';

    function upload() {
      buildGeometry();
      if (gl) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
        var aP = gl.getAttribLocation(prog, 'aPos'), aI = gl.getAttribLocation(prog, 'aInfo');
        gl.enableVertexAttribArray(aP); gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 24, 0);
        gl.enableVertexAttribArray(aI); gl.vertexAttribPointer(aI, 3, gl.FLOAT, false, 24, 12);
      }
    }
    function rot() {
      var cy = Math.cos(st.yaw), sy = Math.sin(st.yaw), cp = Math.cos(st.pitch), sp = Math.sin(st.pitch);
      /* R = Rx(pitch) · Ry(yaw), en colonnes pour WebGL */
      return [cy, sp * sy, -cp * sy, 0, cp, sp, sy, -sp * cy, cp * cy];
    }
    function project(p, R) { var x = R[0] * p[0] + R[3] * p[1] + R[6] * p[2], y = R[1] * p[0] + R[4] * p[1] + R[7] * p[2], z = R[2] * p[0] + R[5] * p[1] + R[8] * p[2]; return [x, y, z]; }

    function resize() {
      var w = wrap.clientWidth; if (!w) return;
      st.dpr = Math.min(2, window.devicePixelRatio || 1); st.size = w;
      canvas.width = Math.round(w * st.dpr); canvas.height = Math.round(w * st.dpr);
      if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
      draw();
    }

    function draw() {
      var R = rot(), pulse = opts.pulses !== false && !reduce.matches ? 1 : 0, time = reduce.matches ? 0 : st.t;
      if (gl) {
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniformMatrix3fv(U.uRot, false, R); gl.uniform1f(U.uScale, SCALE); gl.uniform1f(U.uDpr, st.dpr); gl.uniform1f(U.uPx, st.size);
        gl.uniform1f(U.uTime, time); gl.uniform1f(U.uSel, st.sel); gl.uniform1f(U.uHot, st.hot); gl.uniform1f(U.uPulse, pulse); gl.uniform1f(U.uPt, opts.point || 2.4);
        gl.uniform3fv(U.uLand, col.land); gl.uniform3fv(U.uAcc, col.acc); gl.uniform3fv(U.uBg, col.bg); gl.uniform3fv(U.uStrong, col.strong);
        gl.drawArrays(gl.POINTS, 0, verts.length / 6);
        return;
      }
      /* Repli 2D : même projection orthographique, sans impulsions animées. */
      var W = canvas.width, h = W / 2, k = h * SCALE, d = st.dpr * st.size / 560, css = function (c, a) { return 'rgba(' + Math.round(c[0] * 255) + ',' + Math.round(c[1] * 255) + ',' + Math.round(c[2] * 255) + ',' + a + ')'; };
      ctx.clearRect(0, 0, W, W);
      for (var i = 0; i < verts.length; i += 6) {
        var p = project([verts[i], verts[i + 1], verts[i + 2]], R), kind = verts[i + 3], x = h + p[0] * k, y = h - p[1] * k;
        if (kind === 0) { if (p[2] <= 0) continue; ctx.fillStyle = css(col.land, 0.3 + 0.7 * p[2]); var s = (opts.point || 2.4) * d * (0.75 + 0.45 * p[2]) * 0.8; ctx.fillRect(x - s / 2, y - s / 2, s, s); }
        else if (kind === 1) { if (p[2] < 0 && Math.hypot(p[0], p[1]) < 1) continue; var on = st.sel < 0 || verts[i + 5] === st.sel; ctx.fillStyle = css(col.acc, on ? 0.45 : 0.12); ctx.fillRect(x - d, y - d, 2 * d, 2 * d); }
        else { if (p[2] <= 0) continue; var on2 = st.sel < 0 || verts[i + 5] === st.sel, r = (verts[i + 4] === st.hot ? 5 : 4) * d; ctx.fillStyle = css(col.bg, on2 ? 1 : 0.3); ctx.beginPath(); ctx.arc(x, y, r + 1.5 * d, 0, TAU); ctx.fill(); ctx.fillStyle = css(col.acc, on2 ? 1 : 0.3); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
      }
    }

    function wrapPi(a) { return Math.atan2(Math.sin(a), Math.cos(a)); }
    function frame(now) {
      st.raf = 0; var dt = Math.min(0.05, (now - (st.last || now)) / 1000); st.last = now; st.t += dt;
      var moving = false;
      if (st.target && !st.drag) {
        var k = 38, c = 2 * Math.sqrt(k) * 0.9, ey = wrapPi(st.target.yaw - st.yaw), ep = st.target.pitch - st.pitch;
        st.vy += (k * ey - c * st.vy) * dt; st.vp += (k * ep - c * st.vp) * dt;
        st.yaw += st.vy * dt; st.pitch += st.vp * dt;
        moving = Math.abs(ey) > 0.0005 || Math.abs(st.vy) > 0.0005 || Math.abs(ep) > 0.0005;
      } else if (!st.drag) {
        var auto = st.hot >= 0 ? 0 : (opts.speed || 0) * Math.PI / 180;
        st.vy += (auto - st.vy) * (1 - Math.exp(-dt * 1.6)); st.vp *= Math.exp(-dt * 3);
        st.yaw += st.vy * dt; st.pitch = Math.max(-1.1, Math.min(1.1, st.pitch + st.vp * dt));
        moving = Math.abs(st.vy) > 0.0005 || Math.abs(st.vp) > 0.0005;
      }
      draw(); if (cb.frame) cb.frame();
      var pulsing = gl && opts.pulses !== false && !reduce.matches;
      if (st.visible && !reduce.matches && (moving || pulsing || st.drag)) st.raf = requestAnimationFrame(frame);
    }
    function wake() { if (!st.raf && st.visible) { st.last = 0; st.raf = requestAnimationFrame(frame); } if (reduce.matches) draw(); }

    /* Glisser pour tourner, avec inertie ; toucher vertical laissé au défilement (touch-action: pan-y). */
    canvas.addEventListener('pointerdown', function (e) {
      st.drag = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, moved: 0 }; st.target = null; st.vy = st.vp = 0;
      canvas.setPointerCapture(e.pointerId); wrap.classList.add('is-drag'); wake();
    });
    canvas.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      if (st.drag && st.drag.id === e.pointerId) {
        var now = performance.now(), dt = Math.max(1, now - st.drag.t) / 1000, R = r.width / 2 * SCALE;
        var dy = (e.clientX - st.drag.x) / R, dp = (e.clientY - st.drag.y) / R;
        st.yaw += dy; st.pitch = Math.max(-1.1, Math.min(1.1, st.pitch + dp));
        st.vy = st.vy * 0.5 + (dy / dt) * 0.5; st.vp = st.vp * 0.5 + (dp / dt) * 0.5; st.drag.moved += Math.abs(dy) + Math.abs(dp);
        st.drag.x = e.clientX; st.drag.y = e.clientY; st.drag.t = now; draw(); if (cb.frame) cb.frame();
        return;
      }
      if (e.pointerType === 'mouse') pick(e.clientX - r.left, e.clientY - r.top);
    });
    function end(e) {
      if (!st.drag || st.drag.id !== e.pointerId) return;
      var tap = st.drag.moved < 0.02; st.drag = null; wrap.classList.remove('is-drag');
      if (tap) { var r = canvas.getBoundingClientRect(); pick(e.clientX - r.left, e.clientY - r.top, true); }
      wake();
    }
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !st.drag) setHot(-1); });

    function screenOf(ci) { var c = cities[ci], p = project(xyz(c.lat, c.lon), rot()), h = st.size / 2; return { x: h + p[0] * h * SCALE, y: h - p[1] * h * SCALE, z: p[2] }; }
    function pick(x, y, tap) {
      var best = -1, bd = tap ? 26 : 16;
      cities.forEach(function (c, ci) { var s = screenOf(ci); if (s.z <= 0.05) return; var dd = Math.hypot(s.x - x, s.y - y); if (dd < bd) { bd = dd; best = ci; } });
      if (best < 0 && tap) { setHot(-1); return; }
      setHot(best);
    }
    function setHot(i) { if (st.hot === i) return; st.hot = i; canvas.style.cursor = i >= 0 ? 'pointer' : ''; if (cb.hot) cb.hot(i); wake(); }

    function setRegion(i, center) {
      st.sel = i; st.hot = -1; if (cb.hot) cb.hot(-1);
      if (i >= 0 && center) {
        var ty = -center[1] * Math.PI / 180, tp = center[0] * Math.PI / 180;
        if (reduce.matches) { st.yaw = ty; st.pitch = tp; st.target = null; } else { st.target = { yaw: st.yaw + wrapPi(ty - st.yaw), pitch: tp }; }
      } else st.target = null;
      wake();
    }

    var io = new IntersectionObserver(function (en) { st.visible = en[0].isIntersecting; if (st.visible) wake(); });
    io.observe(wrap);
    var onVis = function () { st.visible = !document.hidden; if (st.visible) wake(); };
    document.addEventListener('visibilitychange', onVis);
    var ro = new ResizeObserver(resize); ro.observe(wrap);
    var mo = new MutationObserver(function () { readColors(); wake(); draw(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class', 'data-accent'] });
    readColors(); upload(); resize(); wake();

    return {
      setRegion: setRegion, setHot: setHot, screenOf: screenOf, state: st, counts: function () { return counts; },
      setOpts: function (o) { var geo = o.density !== opts.density || o.arcs !== opts.arcs; for (var k in o) opts[k] = o[k]; if (o.tilt !== undefined && !st.target && st.sel < 0) st.pitch = o.tilt * Math.PI / 180; if (geo) upload(); readColors(); wake(); draw(); },
      destroy: function () { cancelAnimationFrame(st.raf); io.disconnect(); ro.disconnect(); mo.disconnect(); document.removeEventListener('visibilitychange', onVis); }
    };
  }
/* eslint-enable */

export const REGIONS = [
  { nom: 'Europe', centre: [48, 10], clients: 18420, pays: 29, evol: '+14 %' },
  { nom: 'Amérique du Nord', centre: [40, -88], clients: 6210, pays: 2, evol: '+31 %' },
  { nom: 'Amérique latine', centre: [-8, -62], clients: 1590, pays: 7, evol: '+19 %' },
  { nom: 'Afrique et Moyen-Orient', centre: [14, 22], clients: 3340, pays: 12, evol: '+27 %' },
  { nom: 'Asie-Pacifique', centre: [12, 118], clients: 4870, pays: 14, evol: '+42 %' },
];
export const CITIES = [
  { nom: 'Paris', lat: 48.86, lon: 2.35, region: 0, clients: 7240, note: 'Siège · 21 % des clients' },
  { nom: 'Berlin', lat: 52.52, lon: 13.4, region: 0, clients: 2140, note: '+18 % sur un an' },
  { nom: 'Madrid', lat: 40.42, lon: -3.7, region: 0, clients: 1630, note: '+11 % sur un an' },
  { nom: 'Stockholm', lat: 59.33, lon: 18.07, region: 0, clients: 860, note: '+24 % sur un an' },
  { nom: 'Milan', lat: 45.46, lon: 9.19, region: 0, clients: 1270, note: '+9 % sur un an' },
  { nom: 'Montréal', lat: 45.5, lon: -73.57, region: 1, clients: 1840, note: '+22 % sur un an' },
  { nom: 'New York', lat: 40.71, lon: -74.0, region: 1, clients: 2650, note: '+35 % sur un an' },
  { nom: 'San Francisco', lat: 37.77, lon: -122.42, region: 1, clients: 1720, note: '+33 % sur un an' },
  { nom: 'São Paulo', lat: -23.55, lon: -46.63, region: 2, clients: 940, note: '+21 % sur un an' },
  { nom: 'Mexico', lat: 19.43, lon: -99.13, region: 2, clients: 650, note: '+16 % sur un an' },
  { nom: 'Casablanca', lat: 33.57, lon: -7.59, region: 3, clients: 1380, note: '+29 % sur un an' },
  { nom: 'Dakar', lat: 14.72, lon: -17.47, region: 3, clients: 520, note: '+38 % sur un an' },
  { nom: 'Dubaï', lat: 25.2, lon: 55.27, region: 3, clients: 990, note: '+24 % sur un an' },
  { nom: 'Nairobi', lat: -1.29, lon: 36.82, region: 3, clients: 450, note: '+41 % sur un an' },
  { nom: 'Singapour', lat: 1.35, lon: 103.82, region: 4, clients: 1610, note: '+44 % sur un an' },
  { nom: 'Tokyo', lat: 35.68, lon: 139.69, region: 4, clients: 1350, note: '+37 % sur un an' },
  { nom: 'Sydney', lat: -33.87, lon: 151.21, region: 4, clients: 1080, note: '+40 % sur un an' },
  { nom: 'Bombay', lat: 19.08, lon: 72.88, region: 4, clients: 830, note: '+52 % sur un an' },
];
const ORDER = [0, 1, 4, 3, 2];
const nf = new Intl.NumberFormat('fr-FR');

/**
 * @param {{ speed?: number, tilt?: number, density?: number, arcs?: boolean, pulses?: boolean, region?: number,
 *   regions?: typeof REGIONS, cities?: typeof CITIES, className?: string }} props
 */
export default function GlobeClients({ speed = 6, tilt = 18, density = 14000, arcs = true, pulses = true, region = -1,
  regions = REGIONS, cities = CITIES, className = '' }) {
  const wrapRef = useRef(null), canvasRef = useRef(null), tipRef = useRef(null), globe = useRef(null), hotRef = useRef(-1);
  const [hot, setHot] = useState(-1);
  const [sel, setSel] = useState(region), [pinned, setPinned] = useState(region);
  const total = regions.reduce((s, r) => s + r.clients, 0);

  const placeTip = (follow) => {
    const i = hotRef.current, t = tipRef.current, g = globe.current; if (i < 0 || !t || !g) return;
    const s = g.screenOf(i), W = wrapRef.current.clientWidth;
    if (s.z <= 0.02) { t.style.opacity = '0'; return; }
    t.style.opacity = '1';
    t.style.transition = follow ? 'opacity 160ms' : 'opacity 160ms, transform 360ms cubic-bezier(.25,1.3,.4,1)';
    t.style.transform = `translate3d(${Math.max(0, Math.min(W - t.offsetWidth, s.x - t.offsetWidth / 2))}px, ${Math.max(0, s.y - t.offsetHeight - 18)}px, 0)`;
  };

  useEffect(() => {
    globe.current = createGlobe(wrapRef.current, canvasRef.current, { cities, speed, tilt, density, arcs, pulses, point: 3 }, {
      hot: (i) => { hotRef.current = i; setHot(i); },
      frame: () => placeTip(true),
    });
    return () => globe.current.destroy();
  }, [cities]);
  useEffect(() => { globe.current?.setOpts({ speed, tilt, density, arcs, pulses }); }, [speed, tilt, density, arcs, pulses]);
  useEffect(() => { setSel(region); setPinned(region); }, [region]);
  useEffect(() => { globe.current?.setRegion(sel, sel >= 0 ? regions[sel].centre : null); }, [sel, regions]);
  useEffect(() => { requestAnimationFrame(() => placeTip(false)); }, [hot]);

  const preview = (i) => { if (pinned < 0) setSel(i); };
  const city = hot >= 0 ? cities[hot] : null, r = sel >= 0 ? regions[sel] : null;

  return (
    <section aria-labelledby="gc-titre" onKeyDown={(e) => { if (e.key === 'Escape') { setPinned(-1); setSel(-1); } }}
      className={`relative isolate mx-auto flex w-full max-w-[1200px] flex-col items-stretch gap-2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] pb-6 pt-8 font-sans text-[var(--text)] sm:grid sm:grid-cols-1 sm:gap-6 sm:rounded-2xl sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-12 lg:py-14 lg:pl-16 lg:pr-8 ${className}`}>
      <div className="contents sm:grid sm:content-center sm:gap-4">
        <a href="#accueil" aria-label="Hélia, accueil" className="mx-5 inline-flex min-h-11 items-center gap-2 self-start justify-self-start rounded-lg text-base font-semibold tracking-[-.01em] text-[var(--text-strong)] no-underline sm:mx-0">
          <svg viewBox="0 0 100 100" aria-hidden="true" className="size-6"><circle cx="50" cy="50" r="50" fill="var(--accent)" /><g fill="none" stroke="var(--accent-fg)" strokeWidth="6" strokeLinecap="round"><circle cx="50" cy="50" r="27" /><ellipse cx="50" cy="50" rx="11" ry="27" /><path d="M23 50h54" /></g><circle cx="74" cy="29" r="9" fill="var(--accent-fg)" stroke="var(--accent)" strokeWidth="5" /></svg>
          Hélia
        </a>
        <p className="mx-5 mt-2 font-mono text-[13px] font-medium uppercase leading-4 tracking-[.04em] text-[var(--text-muted)] sm:mx-0">Paiements internationaux</p>
        <h2 id="gc-titre" className="mx-5 mt-1 text-balance text-[28px] font-semibold leading-[34px] tracking-[-.03em] text-[var(--text-strong)] sm:mx-0 sm:mt-0 sm:text-[clamp(28px,1.8vw+14px,42px)] sm:leading-[1.1]">
          <span className="tabular-nums">{nf.format(total)}</span> entreprises encaissent avec Hélia, dans 64&nbsp;pays.
        </h2>
        <p className="mx-5 mt-2 max-w-[46ch] text-pretty text-[15px] leading-[22px] text-[var(--text-muted)] sm:mx-0 sm:mt-0 sm:text-base sm:leading-6">Vos clients paient dans leur devise, vous recevez des euros le jour même. Choisissez une région pour voir où nous sommes déjà.</p>
        <ul role="list" onPointerLeave={(e) => e.pointerType === 'mouse' && preview(-1)}
          onBlur={(e) => { if (pinned < 0 && !e.currentTarget.contains(e.relatedTarget)) setSel(-1); }}
          className="order-6 m-0 mt-2 flex list-none snap-x snap-mandatory gap-2 overflow-x-auto px-5 pb-2 pt-1 [scrollbar-width:none] sm:order-none sm:mt-4 sm:grid sm:gap-0 sm:overflow-visible sm:border-t sm:border-[var(--border)] sm:p-0">
          {ORDER.map((i) => {
            const g = regions[i], on = sel === i, pressed = pinned === i;
            return (
              <li key={g.nom} className="flex-none snap-start scroll-mx-5 sm:border-b sm:border-[var(--border)]">
                <button type="button" aria-pressed={pressed}
                  onClick={() => { if (pinned === i) { setPinned(-1); setSel(-1); } else { setPinned(i); setSel(i); } }}
                  onPointerEnter={(e) => e.pointerType === 'mouse' && preview(i)}
                  onFocus={(e) => e.currentTarget.matches(':focus-visible') && preview(i)}
                  className={`group relative grid min-h-16 min-w-[156px] items-baseline gap-x-4 rounded-xl border border-[var(--border)] bg-[var(--raised)] px-4 py-2.5 text-left sm:min-h-14 sm:w-full sm:grid-cols-[1fr_auto] sm:rounded-lg sm:border-0 sm:bg-transparent sm:px-3 sm:hover:bg-[var(--state-hover)] ${pressed ? 'border-[var(--border-strong)]' : ''}`}>
                  <span aria-hidden="true" className={`absolute inset-x-4 -bottom-px h-0.5 origin-center rounded bg-[var(--accent)] transition-transform duration-300 [transition-timing-function:cubic-bezier(.3,1.4,.4,1)] sm:inset-x-auto sm:inset-y-3 sm:left-0 sm:h-auto sm:w-0.5 sm:origin-center ${on ? 'scale-100' : 'scale-0'}`} />
                  <span className="text-[15px] font-medium leading-[22px] text-[var(--text-strong)] sm:text-base">{g.nom}</span>
                  <span className="mt-1 text-lg font-semibold leading-none tracking-[-.02em] text-[var(--text-strong)] tabular-nums sm:row-span-2 sm:mt-0 sm:self-center sm:text-xl">{nf.format(g.clients)}</span>
                  <span className="text-sm leading-5 text-[var(--text-muted)]">{g.pays} pays · {g.evol}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="order-5 mt-2 grid justify-items-center gap-2 sm:order-none sm:mt-0">
        <p aria-hidden="true" className="order-first text-[13px] leading-5 text-[var(--text-muted)] sm:order-last">Glissez pour faire tourner le globe</p>
        <div ref={wrapRef} className="group/globe relative aspect-square w-full max-w-[420px] touch-pan-y select-none sm:max-w-[600px]">
          <div aria-hidden="true" className="absolute inset-[10%] rounded-full border border-[var(--border)] bg-[radial-gradient(circle_at_34%_28%,color-mix(in_oklab,var(--accent)_7%,var(--raised)),var(--surface)_72%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--accent)_10%,transparent),0_0_96px_-8px_color-mix(in_oklab,var(--accent)_22%,transparent)]" />
          <canvas ref={canvasRef} role="img" aria-label={`Globe : clients Hélia dans 64 pays, flux de paiement depuis ${cities[0].nom} vers ${cities.length - 1} villes. Le détail par région est dans la liste.`}
            className={`absolute inset-0 size-full ${hot >= 0 ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`} />
          <div ref={tipRef} aria-hidden="true" style={{ opacity: 0 }} className="pointer-events-none absolute left-0 top-0 z-[2] grid gap-0.5 whitespace-nowrap rounded-xl bg-[var(--text-strong)] px-3 py-2 text-[var(--surface)]">
            <strong className="text-[15px] font-semibold leading-5">{city?.nom}</strong>
            <span className="text-[13px] leading-[18px] opacity-80 tabular-nums">{city ? `${nf.format(city.clients)} clients · ${city.note}` : ''}</span>
          </div>
          <p aria-live="polite" className={`pointer-events-none absolute bottom-[4%] left-1/2 z-[2] m-0 whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--raised)] px-4 py-2 text-sm font-medium leading-5 text-[var(--text-strong)] tabular-nums transition-[opacity,transform] duration-[420ms] [transition-timing-function:cubic-bezier(.3,1.4,.4,1)] motion-reduce:transition-opacity ${r ? '-translate-x-1/2 opacity-100' : '-translate-x-1/2 translate-y-2 opacity-0'}`}>
            {r && <><b className="font-semibold">{r.nom}</b> · {nf.format(r.clients)} clients · {r.pays} pays</>}
          </p>
        </div>
      </div>

      <table className="sr-only">
        <caption>Clients Hélia par ville</caption>
        <thead><tr><th scope="col">Ville</th><th scope="col">Région</th><th scope="col">Clients</th></tr></thead>
        <tbody>{cities.map((c) => <tr key={c.nom}><td>{c.nom}</td><td>{regions[c.region].nom}</td><td>{nf.format(c.clients)}</td></tr>)}</tbody>
      </table>
    </section>
  );
}
