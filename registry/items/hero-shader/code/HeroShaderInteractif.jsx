// Hero shader interactif — React + Tailwind CSS. WebGL 1 maison, aucune bibliothèque.
// Couleurs : lues dans les variables de tokens.css (--bg, --accent-subtle, --accent, --accent-vivid) et relues
// quand la palette ou le thème changent. Marque fictive : Vigie (cybersécurité).
import { useEffect, useRef } from 'react';

/* ——— Moteur (identique à la version HTML) ——— */
var VERT = 'attribute vec2 a;varying vec2 vUv;void main(){vUv=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
var FRAG = [
  'precision highp float;',
  'uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform vec2 uVel;uniform float uForce;',
  'uniform vec3 uC0;uniform vec3 uC1;uniform vec3 uC2;uniform vec3 uC3;',
  'uniform float uGrain;uniform float uScale;uniform float uVeil;uniform float uStyle;uniform vec4 uRipple;uniform vec4 uFocus;uniform float uDark;uniform float uFlute;',
  'varying vec2 vUv;',
  'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
  'float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);vec2 u=f*f*(3.-2.*f);',
  ' return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}',
  'float fbm(vec2 p){float v=0.;float a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}',
  'void main(){',
  ' vec2 uv=vUv;vec2 K=uRes/min(uRes.x,uRes.y);float asp=uRes.x/uRes.y;',     /* unités : le plus petit côté vaut 1 (portrait comme paysage) */
  ' vec2 p=(uv-.5)*K;vec2 m=(uMouse-.5)*K;',
  ' vec2 dm=p-m;float d=length(dm);',
  ' float infl=exp(-d*d*5.)*uForce;',
  ' float ang=infl*1.8;float cs=cos(ang);float sn=sin(ang);',
  ' p=m+mat2(cs,-sn,sn,cs)*dm;',               /* tourbillon autour du pointeur */
  ' p-=uVel*infl*.8;',                         /* le fluide est poussé dans le sens du geste */
  ' float rt=uTime-uRipple.z;',
  ' if(rt>0.&&rt<3.){vec2 rp=(uRipple.xy-.5)*K;float rr=length(((uv-.5)*K)-rp);float fr=rr-rt*.6;',
  '  float ring=sin(fr*26.)*exp(-fr*fr*30.)*(1.-rt/3.)*uRipple.w;p+=normalize(((uv-.5)*K)-rp+1e-4)*ring*.05;}',
  ' float hl=0.;float sh=0.;',
  ' if(uStyle>.5){float b=fract(uv.x*uRes.x/uFlute);float w=uFlute/min(uRes.x,uRes.y);',   /* verre cannelé : chaque cannelure agrandit et décale sa tranche de fluide */
  '  p.x+=(b-.5)*w*2.4;p.y+=(b-.5)*w*.25;',
  '  hl=exp(-pow((b-.16)*10.,2.))*.14;sh=pow(abs(b-.5)*2.,5.)*.16;}',
  ' vec2 q0=p*uScale;float t=uTime*.07;',
  ' vec2 q=vec2(fbm(q0+vec2(0.,t)),fbm(q0+vec2(5.2,1.3)-t));',
  ' vec2 r=vec2(fbm(q0+3.*q+vec2(1.7,9.2)+t*1.3),fbm(q0+3.*q+vec2(8.3,2.8)-t*.9));',
  ' float f=fbm(q0+3.*r);',
  ' float band=.5+.5*sin(f*10.+length(q)*7.-uTime*.2);',     /* plis de soie */
  ' float fold=smoothstep(.5,1.,band)*smoothstep(.38,.7,f);',
  ' vec3 col=mix(uC0,uC1,smoothstep(.28,.72,f));',
  ' col=mix(col,uC2,smoothstep(.42,.82,f*length(q)*1.75)*.95);',
  ' col=mix(col,uC3,fold*.9);',
  ' col+=pow(fold,5.)*(.16-uDark*.06);',
  ' col*=1.-sh;',
  ' col=mix(col,uC3,infl*.15);',
  ' col+=hl*mix(vec3(1.),uC1,.4)*(1.-uDark*.45);',
  ' vec2 fv=(uv-uFocus.xy)/uFocus.zw;',
  ' float v=1.-smoothstep(.75,1.7,length(fv));',      /* voile de lecture : plein sous le texte, fondu au-delà */
  ' col=mix(col,uC0,clamp(v*uVeil,0.,.92));',
  ' col+=(hash(uv*uRes+fract(uTime*.37)*91.)-.5)*uGrain*(1.-.35*(1.-uDark));',
  ' gl_FragColor=vec4(col,1.);',
  '}'
].join('\n');


function mountShader(root, D) {
  var canvas = root.querySelector('.hsh__gl');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cfg = function () { return { style: D.style === 'verre' ? 1 : 0, force: +D.force || 0, speed: D.speed === undefined ? 1 : +D.speed, grain: +D.grain || 0, scale: +D.scale || 1.4, veil: D.veil === undefined ? .75 : +D.veil, quality: +D.quality || .75 }; };
  var C = cfg();
  root.style.setProperty('--hsh-veil', C.veil);
  var raf = 0, visible = true, paused = false, disposed = false, t = 0, last = 0;
  var wander = [.66, .52, .2, .22], mouse = { x: .72, y: .55 }, target = { x: .72, y: .55 }, vel = { x: 0, y: 0 }, lastMove = -1e9, ripple = [0, 0, -10, 0];
  var focus = [.3, .55, .25, .3], flute = 72, cols = null, dark = 0;

  /* Entrée du contenu */
  requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('is-in'); }); });

  /* Carte d’incident : les étapes se cochent en boucle (pause hors écran et avec « réduire les animations »). */
  var steps = [].slice.call(root.querySelectorAll('[data-step]')), badge = root.querySelector('[data-hsh-badge]'), badgeTxt = root.querySelector('[data-hsh-badge-txt]');
  var stepTimer = 0, stepI = 0;
  function showSteps(n, running) {
    steps.forEach(function (li, i) { li.classList.toggle('is-on', i < n); li.classList.toggle('is-run', running && i === n); });
    var done = n >= steps.length; if (badge) { badge.classList.toggle('is-done', done); badgeTxt.textContent = done ? 'Fermé' : 'En cours'; }
  }
  function stepLoop() {
    clearTimeout(stepTimer);
    if (!steps.length) return;
    if (reduce || paused || !visible) { if (reduce) showSteps(steps.length, false); return; }
    showSteps(stepI, stepI < steps.length);
    var wait = stepI === 0 ? 700 : stepI < steps.length ? 900 : 4200;
    stepI = stepI >= steps.length ? 0 : stepI + 1;
    stepTimer = setTimeout(stepLoop, wait);
  }
  showSteps(reduce ? steps.length : 0, false);

  /* Couleurs : relues dans les variables de tokens.css (palette, thème), jamais recopiées. */
  var probe = document.createElement('i'); probe.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden'; root.appendChild(probe);
  function rgb(v) {
    probe.style.color = 'var(' + v + ')';
    var m = getComputedStyle(probe).color.match(/[\d.]+/g) || [0, 0, 0];
    return [m[0] / 255, m[1] / 255, m[2] / 255];
  }
  function readColors() {
    cols = [rgb('--bg'), rgb('--accent-subtle'), rgb('--accent'), rgb('--accent-vivid')];
    var b = cols[0]; dark = (0.2126 * b[0] + 0.7152 * b[1] + 0.0722 * b[2]) < .4 ? 1 : 0;
    cols[1] = mix(cols[1], dark ? cols[2] : cols[3], dark ? .25 : .32);   /* le fond doux de l’accent seul est trop discret : on le relève */
    if (reduce || paused) draw();
  }
  function mix(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }

  /* WebGL */
  var gl = null, prog, buf, U = {};
  function onLost(e) { e.preventDefault(); stop(); root.classList.remove('is-gl'); }
  try { gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'low-power' }) || canvas.getContext('experimental-webgl'); } catch (e) { gl = null; } if (gl && gl.isContextLost()) gl = null;
  function sh(type, src) { var s = gl.createShader(type); if (!s) return null; gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; }
  if (gl) {
    var vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG.replace('precision highp', (gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT) || {}).precision ? 'precision highp' : 'precision mediump'));
    if (vs && fs) {
      prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) gl = null;
    } else gl = null;
  }
  if (gl) {
    gl.useProgram(prog);
    buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ['uRes', 'uTime', 'uMouse', 'uVel', 'uForce', 'uC0', 'uC1', 'uC2', 'uC3', 'uGrain', 'uScale', 'uVeil', 'uStyle', 'uRipple', 'uFocus', 'uDark', 'uFlute'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
    canvas.addEventListener('webglcontextlost', onLost);
    root.classList.add('is-gl');
  }

  function resize() {
    if (!gl) return;
    var r = root.getBoundingClientRect(), mobile = r.width < 600;
    var dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.25) * C.quality;
    var w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
    flute = (mobile ? 56 : 72) * w / r.width;           /* largeur d’une cannelure : 72 px (56 px sur téléphone) */
    var fe = root.querySelector('[data-hsh-focus]').getBoundingClientRect();
    focus = [(fe.left + fe.width * .5 - r.left) / r.width, 1 - (fe.top + fe.height * .5 - r.top) / r.height, fe.width * .5 / r.width, fe.height * .5 / r.height];
    wander = mobile ? [.5, 1 - 150 / r.height, .3, 90 / r.height] : [.66, .52, .2, .22];
    if (reduce || paused) draw();
  }

  function draw() {
    if (!gl || !cols) return;
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uTime, t);
    gl.uniform2f(U.uMouse, mouse.x, mouse.y);
    gl.uniform2f(U.uVel, vel.x, vel.y);
    gl.uniform1f(U.uForce, reduce ? 0 : C.force);
    gl.uniform3fv(U.uC0, cols[0]); gl.uniform3fv(U.uC1, cols[1]); gl.uniform3fv(U.uC2, cols[2]); gl.uniform3fv(U.uC3, cols[3]);
    gl.uniform1f(U.uGrain, C.grain); gl.uniform1f(U.uScale, C.scale); gl.uniform1f(U.uVeil, C.veil); gl.uniform1f(U.uStyle, C.style);
    gl.uniform4f(U.uRipple, ripple[0], ripple[1], ripple[2], ripple[3]);
    gl.uniform4f(U.uFocus, focus[0], focus[1], focus[2], focus[3]); gl.uniform1f(U.uDark, dark); gl.uniform1f(U.uFlute, flute);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(now) {
    raf = 0;
    if (disposed || paused || !visible || document.hidden) return;
    var dt = Math.min(.05, last ? (now - last) / 1000 : .016); last = now;
    t += dt * C.speed;
    /* Au repos (pas de pointeur depuis 2,5 s), le point d’attraction se promène seul : le fond vit aussi sur téléphone. */
    if (now - lastMove > 2500) { target.x = wander[0] + Math.sin(t * .35) * wander[2]; target.y = wander[1] + Math.sin(t * .27 + 1.3) * wander[3]; }
    var k = 1 - Math.exp(-dt * 7);               /* suivi amorti, sans à-coup */
    var px = mouse.x, py = mouse.y;
    mouse.x += (target.x - mouse.x) * k; mouse.y += (target.y - mouse.y) * k;
    var vx = (mouse.x - px) / dt, vy = (mouse.y - py) / dt, kv = 1 - Math.exp(-dt * 5);
    vel.x += (Math.max(-2, Math.min(2, vx)) - vel.x) * kv; vel.y += (Math.max(-2, Math.min(2, vy)) - vel.y) * kv;
    draw();
    raf = requestAnimationFrame(frame);
  }
  function start() { if (!gl || reduce || paused || raf || disposed) return; last = 0; raf = requestAnimationFrame(frame); }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  /* Pointeur et toucher (sans bloquer le défilement : écouteurs passifs). */
  function toUv(x, y) { var r = root.getBoundingClientRect(); return { x: (x - r.left) / r.width, y: 1 - (y - r.top) / r.height }; }
  function onMove(e) { var p = e.touches ? e.touches[0] : e; if (!p) return; var u = toUv(p.clientX, p.clientY); target.x = u.x; target.y = u.y; lastMove = performance.now(); }
  function onDown(e) { var p = e.touches ? e.touches[0] : e; if (!p) return; var u = toUv(p.clientX, p.clientY); ripple = [u.x, u.y, t, 1]; onMove(e); }
  root.addEventListener('pointermove', onMove, { passive: true });
  root.addEventListener('pointerdown', onDown, { passive: true });
  root.addEventListener('touchmove', onMove, { passive: true });

  /* Pause : bouton (critère WCAG 2.2.2), hors écran, onglet masqué. */
  var pauseBtn = root.querySelector('[data-hsh-pause]'), pauseTxt = root.querySelector('[data-hsh-pause-txt]');
  function onPause() {
    paused = !paused; pauseBtn.setAttribute('aria-pressed', String(paused));
    pauseTxt.textContent = paused ? 'Relancer le fond animé' : 'Mettre le fond en pause';
    if (paused) { stop(); clearTimeout(stepTimer); showSteps(steps.length, false); } else { start(); stepLoop(); }
  }
  pauseBtn.addEventListener('click', onPause);
  var io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) { start(); stepLoop(); } else { stop(); clearTimeout(stepTimer); } });
    io.observe(root);
  }
  function onVis() { if (!document.hidden) start(); }
  document.addEventListener('visibilitychange', onVis);
  var ro = 'ResizeObserver' in window ? new ResizeObserver(resize) : null; if (ro) ro.observe(root); else window.addEventListener('resize', resize);
  var mo = new MutationObserver(readColors);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-accent'] });

  readColors(); resize();
  if (gl) { if (reduce) { t = 12; draw(); } else { draw(); start(); } }
  stepLoop();

  return {
    update: function () { C = cfg(); root.style.setProperty('--hsh-veil', C.veil); resize(); draw(); },
    destroy: function () {
      disposed = true; stop(); clearTimeout(stepTimer); if (io) io.disconnect(); if (ro) ro.disconnect(); mo.disconnect();
      document.removeEventListener('visibilitychange', onVis); window.removeEventListener('resize', resize);
      pauseBtn.removeEventListener('click', onPause); canvas.removeEventListener('webglcontextlost', onLost); root.removeEventListener('pointermove', onMove); root.removeEventListener('pointerdown', onDown); root.removeEventListener('touchmove', onMove);
      if (probe.parentNode) probe.parentNode.removeChild(probe);
      if (gl && !gl.isContextLost()) { gl.deleteProgram(prog); gl.deleteBuffer(buf); }      /* le canvas reste réutilisable (React) */
    }
  };
}

/* ——— Composant ——— */
const STEPS = [
  ['Alerte reçue de l’EDR', '00:02'],
  ['Appareil connu, VPN de l’entreprise', '00:09'],
  ['Double facteur confirmé par l’utilisatrice', '00:21'],
  ['Fermé, preuve jointe au ticket', '00:38'],
];
const ARROW = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    className="transition-transform duration-[400ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-[3px]"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
const glass = 'bg-[color-mix(in_srgb,var(--surface)_74%,transparent)] border border-[var(--border)] backdrop-blur-[24px] backdrop-saturate-[1.3]';
const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]';
const enter = 'opacity-0 translate-y-[14px] transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] [.is-in_&]:opacity-100 [.is-in_&]:translate-y-0 motion-reduce:opacity-100 motion-reduce:translate-y-0 motion-reduce:transition-none';

export function HeroShaderInteractif({
  titre = 'Vos alertes de sécurité, triées avant le café.',
  style = 'soie',      // 'soie' | 'verre'
  force = 1,           // intensité du curseur, 0 à 2
  vitesse = 1,         // 0 à 2
  echelle = 1.4,       // taille des volutes
  grain = 0.04,
  voile = 0.75,        // voile de lecture sous le texte, 0 à 1
  qualite = 0.75,      // échelle de rendu du canvas
  carte = true,        // carte d’incident en verre
}) {
  const root = useRef(null);
  const engine = useRef(null);
  const opts = { style, force, speed: vitesse, scale: echelle, grain, veil: voile, quality: qualite };

  useEffect(() => {                               // monté une fois, remonté quand un réglage change
    engine.current = mountShader(root.current, { ...opts });
    return () => { engine.current && engine.current.destroy(); engine.current = null; };
  }, [style, force, vitesse, echelle, grain, voile, qualite, carte]);

  return (
    <section ref={root} aria-labelledby="hsh-title" data-card={String(carte)}
      className="group/h relative isolate flex min-h-0 touch-pan-y flex-col overflow-hidden bg-[var(--bg)] [font-family:var(--font-sans)] text-[var(--text)] min-[600px]:min-h-[max(100svh,640px)]">
      <canvas aria-hidden="true" className="hsh__gl pointer-events-none absolute inset-0 -z-10 block h-full w-full opacity-0 transition-opacity duration-[1200ms] [.is-gl_&]:opacity-100" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 transition-opacity duration-[1200ms] [.is-gl_&]:opacity-0
        [background:radial-gradient(60%_70%_at_85%_30%,color-mix(in_srgb,var(--accent-vivid)_55%,transparent),transparent_70%),radial-gradient(50%_60%_at_70%_90%,color-mix(in_srgb,var(--accent)_45%,transparent),transparent_70%),radial-gradient(70%_80%_at_20%_10%,var(--accent-subtle),transparent_70%),var(--bg)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 hidden min-[1024px]:block
        [background:linear-gradient(90deg,color-mix(in_srgb,var(--bg)_calc(var(--hsh-veil,.75)*70%),transparent)_0%,transparent_62%)]" />

      <header className="relative z-[2] flex items-center gap-3 px-4 py-3 min-[600px]:gap-8 min-[600px]:px-[clamp(16px,4vw,56px)] min-[600px]:py-4">
        <a href="#" aria-label="Vigie, accueil" className={`inline-flex min-h-11 items-center rounded-lg text-[var(--text-strong)] [--a:var(--accent-vivid)] [--ink:var(--text-strong)] [--lt:var(--accent-fg)] [--p:var(--accent)] ${focusRing}`}>
          <svg viewBox="0 0 265 100" aria-hidden="true" focusable="false" className="block h-7 w-auto"><g data-role="icone"><rect width="100" height="100" rx="28" style={{ fill: 'var(--p, currentColor)' }}/><path d="M18 50C27 35 38 28 50 28S73 35 82 50C73 65 62 72 50 72S27 65 18 50Z" fill="none" style={{ stroke: 'var(--lt, #fff)' }} strokeWidth="7" strokeLinejoin="round"/><circle cx="50" cy="50" r="10" style={{ fill: 'var(--lt, #fff)' }}/><circle cx="76" cy="24" r="7" style={{ fill: 'var(--a, var(--lt, #fff))' }}/></g><path data-role="nom" d="M143.44 70 129.08 30.24H136.71L147.87 61.87L158.99 30.24H166.63L152.21 70ZM170.53 70V40.1H177.69V70ZM170.39 36.1V29.76H177.83V36.1ZM197.2 79.07Q193.27 79.07 190.48 78.01Q187.7 76.94 185.98 75.02Q184.27 73.09 183.61 70.58L191 70.07Q191.54 71.74 192.93 72.69Q194.33 73.65 197.2 73.65Q200.54 73.65 202.33 72.16Q204.12 70.67 204.12 67.51V63.75Q203.05 65.92 200.7 67.23Q198.35 68.54 195.44 68.54Q191.73 68.54 188.84 66.72Q185.96 64.89 184.34 61.62Q182.72 58.35 182.72 54.02Q182.72 49.72 184.32 46.44Q185.93 43.16 188.78 41.29Q191.63 39.42 195.3 39.42Q198.55 39.42 200.9 40.88Q203.24 42.34 204.34 44.76V40.1H211.33V67.36Q211.33 71.19 209.57 73.8Q207.81 76.42 204.64 77.74Q201.47 79.07 197.2 79.07ZM197.12 62.92Q200.32 62.92 202.22 60.54Q204.13 58.16 204.16 53.97Q204.19 51.18 203.34 49.18Q202.48 47.19 200.88 46.1Q199.29 45.02 197.12 45.02Q193.8 45.02 191.97 47.45Q190.14 49.87 190.14 53.97Q190.14 58.09 192.02 60.51Q193.91 62.92 197.12 62.92ZM218.07 70V40.1H225.24V70ZM217.94 36.1V29.76H225.37V36.1ZM244.91 70.67Q240.44 70.67 237.15 68.75Q233.86 66.82 232.06 63.3Q230.27 59.77 230.27 55.05Q230.27 50.32 232.06 46.83Q233.86 43.33 237.12 41.38Q240.37 39.42 244.77 39.42Q249.04 39.42 252.24 41.33Q255.44 43.24 257.2 46.83Q258.95 50.41 258.95 55.44V57.04H237.7Q237.92 61 239.85 62.97Q241.78 64.94 245 64.94Q247.39 64.94 248.98 63.87Q250.56 62.8 251.2 60.83L258.52 61.29Q257.33 65.62 253.7 68.15Q250.08 70.67 244.91 70.67ZM237.7 52.23H251.51Q251.29 48.59 249.46 46.83Q247.63 45.07 244.77 45.07Q241.89 45.07 240.02 46.91Q238.14 48.75 237.7 52.23Z" style={{ fill: 'var(--ink, currentColor)' }}/></svg>
        </a>
        <nav aria-label="Principale" className="hidden gap-1 min-[1024px]:flex">
          {['Produit', 'Clients', 'Tarifs', 'Documentation'].map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} className={`inline-flex min-h-10 items-center rounded-lg px-3 text-[15px] font-medium text-[var(--text)] no-underline hover:bg-[color-mix(in_srgb,var(--surface)_60%,transparent)] ${focusRing}`}>{l}</a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <a href="#connexion" className={`hidden min-h-10 items-center rounded-lg px-3 text-[15px] font-medium text-[var(--text)] no-underline min-[600px]:inline-flex ${focusRing}`}>Connexion</a>
          <a href="#demo" className={`inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-4 text-[15px] font-semibold text-[var(--accent-fg)] no-underline hover:bg-[var(--accent-hover)] min-[600px]:min-h-10 ${focusRing}`}>Démo</a>
        </div>
      </header>

      <div className={`relative z-[1] mx-auto grid w-full max-w-[1360px] flex-1 content-start items-center gap-8 px-4 pb-24 pt-[clamp(176px,30svh,260px)]
        min-[600px]:content-center min-[600px]:gap-10 min-[600px]:px-[clamp(16px,4vw,56px)] min-[600px]:pb-[88px] min-[600px]:pt-6
        ${carte ? 'min-[1024px]:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)] min-[1024px]:gap-12 min-[1024px]:pb-[72px]' : ''}`}>
        <div data-hsh-focus className="grid max-w-[640px] justify-items-start gap-5 min-[600px]:gap-6">
          <a href="#agents" className={`group inline-flex min-h-9 items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-medium text-[var(--text-strong)] no-underline ${glass} ${enter} ${focusRing}`}>
            <span className="rounded-full bg-[var(--accent)] px-2 py-1 text-xs font-semibold leading-4 text-[var(--accent-fg)]">Nouveau</span>
            Agents de réponse autonomes {ARROW}
          </a>
          <h1 id="hsh-title" className={`m-0 text-[clamp(2.375rem,1.2rem+5.6vw,2.75rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-[var(--text-strong)] [text-wrap:balance] min-[600px]:text-[clamp(2.5rem,1.1rem+4.2vw,5.25rem)] min-[600px]:leading-none min-[600px]:tracking-[-0.042em] ${enter} delay-[60ms]`}>{titre}</h1>
          <p className={`m-0 max-w-[52ch] text-base leading-6 min-[600px]:text-lg min-[600px]:leading-7 ${enter} delay-[140ms]`}>
            Vigie confie le premier tri à des agents IA : neuf alertes sur dix sont fermées avec leur preuve, la dixième arrive chez vous avec tout son contexte.
          </p>
          <div className={`grid w-full gap-3 min-[600px]:flex min-[600px]:w-auto min-[600px]:flex-wrap ${enter} delay-[220ms]`}>
            <a href="#demo" className={`group inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 text-base font-semibold tracking-[-0.01em] text-[var(--accent-fg)] no-underline transition hover:bg-[var(--accent-hover)] active:scale-[.97] min-[600px]:min-h-12 ${focusRing}`}>Demander une démo {ARROW}</a>
            <a href="#incident" className={`inline-flex min-h-[52px] items-center justify-center rounded-full px-5 text-base font-semibold text-[var(--text-strong)] no-underline backdrop-blur-[12px] hover:bg-[var(--surface)] min-[600px]:min-h-12 bg-[color-mix(in_srgb,var(--surface)_72%,transparent)] border border-[var(--border)] ${focusRing}`}>Voir un incident traité</a>
          </div>
          <ul aria-label="Garanties" className={`m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-sm leading-5 text-[var(--text-muted)] ${enter} delay-[300ms]`}>
            {['SOC 2 Type II', 'Hébergé dans l’UE', '340 équipes sécurité'].map((t) => (
              <li key={t} className="inline-flex items-center gap-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[var(--accent)] before:content-['']">{t}</li>
            ))}
          </ul>
        </div>

        {carte && (
          <aside aria-labelledby="hsh-card-t"
            className={`w-full justify-self-start rounded-2xl p-4 min-[600px]:w-[min(100%,400px)] min-[600px]:p-5 min-[1024px]:justify-self-end ${glass}
              translate-y-3 opacity-0 transition-[opacity,transform] delay-300 duration-[1200ms] ease-[cubic-bezier(.16,1,.3,1)] [.is-in_&]:translate-y-0 [.is-in_&]:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100`}>
            <div className="flex items-center justify-between gap-3">
              <span className="[font-family:var(--font-mono)] text-[13px] leading-5 text-[var(--text-muted)]">Incident #4821</span>
              <span data-hsh-badge className="inline-flex items-center gap-1.5 rounded-full border border-[var(--tint-amber-border)] bg-[var(--tint-amber-bg)] px-2.5 py-0.5 text-[13px] font-semibold leading-5 text-[var(--tint-amber-fg)] transition-colors duration-300
                [&.is-done]:border-[var(--tint-green-border)] [&.is-done]:bg-[var(--tint-green-bg)] [&.is-done]:text-[var(--tint-green-fg)]">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" /><span data-hsh-badge-txt>Fermé</span>
              </span>
            </div>
            <h2 id="hsh-card-t" className="m-0 mt-3 text-lg font-semibold leading-6 tracking-[-0.01em] text-[var(--text-strong)]">Connexion inhabituelle depuis Lisbonne</h2>
            <p className="m-0 mt-1 text-sm leading-5 text-[var(--text-muted)]">Compte c.martin · poste MAC-0412</p>
            <ol className="m-0 mt-4 grid list-none p-0">
              {STEPS.map(([t, time], i) => (
                <li key={t} data-step className={`relative grid min-h-11 grid-cols-[20px_1fr_auto] items-center gap-3 text-sm leading-5 text-[var(--text-muted)] transition-colors duration-[400ms] [&.is-on]:text-[var(--text-strong)]
                  ${i ? "before:absolute before:left-[9.5px] before:top-[-12px] before:h-6 before:w-px before:bg-[var(--border)] before:content-['']" : ''}`}>
                  <span aria-hidden="true" className="relative z-[1] grid h-5 w-5 place-items-center rounded-full border-[1.5px] border-[var(--border-strong)] bg-[var(--surface)] text-[var(--accent-fg)] transition-[background-color,border-color,transform] duration-500 ease-[cubic-bezier(.34,1.56,.64,1)]
                    [.is-on>&]:scale-[1.06] [.is-on>&]:border-[var(--accent)] [.is-on>&]:bg-[var(--accent)] [.is-run>&]:animate-spin [.is-run>&]:border-[var(--accent)] [.is-run>&]:border-t-transparent motion-reduce:animate-none">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="scale-0 transition-transform delay-75 duration-[360ms] ease-[cubic-bezier(.34,1.56,.64,1)] [.is-on>span>&]:scale-100"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                  </span>
                  <span>{t}</span>
                  <time className="[font-family:var(--font-mono)] text-[13px] leading-5 tabular-nums text-[var(--text-muted)]">{time}</time>
                </li>
              ))}
            </ol>
            <p className="m-0 mt-4 flex justify-between gap-3 border-t border-[var(--border)] pt-4 text-sm leading-5 text-[var(--text-muted)]">
              <span>Traité par l’agent Triage</span><b className="font-semibold text-[var(--text-strong)]">14 min économisées</b>
            </p>
          </aside>
        )}
      </div>

      <button type="button" aria-pressed="false" data-hsh-pause
        className={`group/p absolute bottom-6 right-4 z-[3] hidden h-11 w-11 cursor-pointer place-items-center rounded-full text-[var(--text-strong)] backdrop-blur-[12px] hover:bg-[var(--surface)] [.is-gl_&]:grid min-[600px]:bottom-5 min-[600px]:right-[clamp(16px,4vw,56px)] bg-[color-mix(in_srgb,var(--surface)_72%,transparent)] border border-[var(--border)] ${focusRing}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="group-aria-pressed/p:hidden"><rect x="6" y="5" width="4" height="14" rx="1.2" /><rect x="14" y="5" width="4" height="14" rx="1.2" /></svg>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="hidden group-aria-pressed/p:block"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></svg>
        <span data-hsh-pause-txt className="sr-only">Mettre le fond en pause</span>
      </button>
    </section>
  );
}

export default HeroShaderInteractif;
