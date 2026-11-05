// Dégradé maillé vivant — React + Tailwind CSS. Shader WebGL 1 natif, repli canvas 2D.
// Couleurs : variables de tokens.css (--accent-vivid, --accent, --accent-subtle-border, --bg), relues à chaque changement de thème ou de palette.
import { useEffect, useRef } from 'react';

/* Couleurs : relues dans les variables, puis teintes voisines par rotation de teinte (HSL). */
function rgbOf(el, v) {
  var i = document.createElement('i');
  i.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden;color:var(' + v + ')';
  el.appendChild(i);
  var m = (getComputedStyle(i).color.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(function (n) { return n / 255; });
  i.remove();
  return m;
}
function rot(c, deg) {
  var r = c[0], g = c[1], b = c[2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
  if (d) { s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
  h = (h + deg / 360 + 1) % 1;
  function f(p, q, t) { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }
  if (!s) return [l, l, l];
  var q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  return [f(p, q, h + 1 / 3), f(p, q, h), f(p, q, h - 1 / 3)];
}
function palette(el, o) {
  var vivid = rgbOf(el, '--accent-vivid'), acc = rgbOf(el, '--accent'), soft = rgbOf(el, '--accent-subtle-border'), bg = rgbOf(el, '--bg');
  var dark = (bg[0] + bg[1] + bg[2]) / 3 < 0.5;
  // En sombre, la 3e teinte est un reflet clair ; en clair, la teinte douce de l'accent.
  var hi = dark ? vivid.map(function (v, i) { return v + (rgbOf(el, '--text-strong')[i] - v) * 0.45; }) : soft;
  return { bg: bg, c: [vivid, rot(vivid, o.spread), hi, rot(acc, -o.spread * 0.8)], dark: dark };
}

var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
var FS = [
  'precision highp float;',
  'uniform vec2 uRes;uniform float uT;uniform vec3 uBg;uniform vec3 uC0;uniform vec3 uC1;uniform vec3 uC2;uniform vec3 uC3;',
  'uniform vec2 uPtr;uniform float uPtrA;uniform float uWarp;uniform float uInt;uniform float uGrain;uniform float uCalm;uniform float uSide;uniform float uDark;',
  'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
  'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
  'float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<4;i++){v+=a*n(p);p=m*p;a*=.5;}return v;}',
  'void main(){',
  '  vec2 uv=gl_FragCoord.xy/uRes;float asp=uRes.x/uRes.y;vec2 p=vec2(uv.x*asp,uv.y)*1.35;float t=uT*.35;',
  // Pointeur : tourbillon doux autour du curseur
  '  vec2 pp=vec2(uPtr.x*asp,uPtr.y)*1.35;vec2 dp=p-pp;float pf=uPtrA*exp(-dot(dp,dp)/.12);',
  '  p+=pf*.22*vec2(-dp.y,dp.x)/max(length(dp),.08);',
  // Déformation de domaine en deux passes : des nappes de soie plutôt que des taches rondes
  '  vec2 q=vec2(fbm(p+vec2(0.,t*.6)),fbm(p+vec2(5.2,1.3)-t*.5));',
  '  vec2 r=vec2(fbm(p+3.*uWarp*q+vec2(1.7,9.2)+t*.7),fbm(p+3.*uWarp*q+vec2(8.3,2.8)-t*.6));',
  '  float f=fbm(p+3.*uWarp*r);',
  '  vec3 col=mix(uC0,uC1,smoothstep(.25,.75,f));',
  '  col=mix(col,uC2,smoothstep(.45,1.,length(q))*(.85-.35*uDark));',
  '  col=mix(col,uC3,smoothstep(.45,.85,r.x)*.75);',
  // Vallées : le fond remonte entre les nappes pour donner du relief
  '  float depth=smoothstep(.2,.75,f*.9+r.y*.45+pf*.25);',
  '  depth=mix(depth,depth*depth,uDark);',
  '  col=mix(uBg,col,mix(1.,depth,.5+.45*uDark)*uInt);',
  '  float silk=sin((r.x+r.y)*9.+t*1.2);col+=silk*.025*uInt*depth;',
  // Zone calme : fondu vers --bg du côté du texte (0 gauche, 1 bas, 2 aucun)
  '  float calm=uSide<.5?smoothstep(uCalm+.28,uCalm-.06,uv.x):(uSide<1.5?smoothstep(min(.9,uCalm*1.45)+.3,min(.9,uCalm*1.45)-.08,uv.y):0.);',
  '  col=mix(col,uBg,clamp(calm,0.,1.));',
  '  float g=h(gl_FragCoord.xy+fract(uT*7.)*91.)-.5;col+=g*uGrain*(1.-calm*.8);',
  '  gl_FragColor=vec4(col,1.);',
  '}'
].join('\n');


/**
 * @param {object} props
 * @param {number} [props.speed=1]        Vitesse de l'ondulation (0 = figé)
 * @param {number} [props.warp=0.6]       Déformation des nappes (0 à 1)
 * @param {number} [props.spread=38]      Écart de teinte entre les couleurs (degrés)
 * @param {number} [props.intensity=0.85] Présence de la couleur sur le fond
 * @param {number} [props.grain=0.06]     Grain de film (0 à 0,15)
 * @param {boolean} [props.pointer=true]  Tourbillon autour du curseur (souris uniquement)
 * @param {number} [props.calm=0.42]      Part calme pour poser le texte
 * @param {'auto'|'left'|'bottom'|'none'} [props.side='auto']  Auto : à gauche, en bas sous 900 px
 */
export function MeshGradient({ speed = 1, warp = 0.6, spread = 38, intensity = 0.85, grain = 0.06, pointer = true, calm = 0.42, side = 'auto', className = '', children }) {
  const hostRef = useRef(null);
  const fieldRef = useRef(null);
  const opts = useRef({});
  opts.current = { speed, warp, spread, intensity, grain, pointer, calm, side };
  const api = useRef(null);

  useEffect(() => {
    const el = fieldRef.current, section = hostRef.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let canvas = document.createElement('canvas');
    canvas.className = 'block h-full w-full opacity-0 transition-opacity duration-[900ms] motion-reduce:transition-none';
    el.appendChild(canvas);
    let gl = null, prog = null, ctx2d = null;
    const U = {};
    try { gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false }); } catch { gl = null; }
    if (gl) {
      const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
      const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
      if (vs && fs) { prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog); if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) prog = null; }
      if (prog) {
        gl.useProgram(prog);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        ['uRes', 'uT', 'uBg', 'uC0', 'uC1', 'uC2', 'uC3', 'uPtr', 'uPtrA', 'uWarp', 'uInt', 'uGrain', 'uCalm', 'uSide', 'uDark'].forEach((k) => { U[k] = gl.getUniformLocation(prog, k); });
      } else gl = null;
    }
    if (!gl) { const c = document.createElement('canvas'); c.className = canvas.className; canvas.replaceWith(c); canvas = c; ctx2d = canvas.getContext('2d'); }

    let pal = palette(el, opts.current), W = 1, H = 1, raf = 0, visible = true, last = 0, time = 7;
    let ptr = [0.7, 0.5], ptrT = [0.7, 0.5], ptrA = 0, ptrAT = 0;
    const sideCode = () => { const o = opts.current; if (o.side === 'none' || o.calm <= 0) return 2; if (o.side === 'left') return 0; if (o.side === 'bottom') return 1; return W < 900 ? 1 : 0; };
    const resize = () => {
      const r = el.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
      const scale = gl ? Math.min(1.5, window.devicePixelRatio || 1) : 0.125;
      canvas.width = Math.max(2, Math.round(W * scale)); canvas.height = Math.max(2, Math.round(H * scale));
      if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const render = () => {
      const o = opts.current;
      if (gl) {
        const v3 = (k, c) => gl.uniform3f(U[k], c[0], c[1], c[2]);
        gl.uniform2f(U.uRes, canvas.width, canvas.height); gl.uniform1f(U.uT, time);
        v3('uBg', pal.bg); v3('uC0', pal.c[0]); v3('uC1', pal.c[1]); v3('uC2', pal.c[2]); v3('uC3', pal.c[3]);
        gl.uniform2f(U.uPtr, ptr[0], 1 - ptr[1]); gl.uniform1f(U.uPtrA, ptrA);
        gl.uniform1f(U.uWarp, o.warp); gl.uniform1f(U.uInt, o.intensity); gl.uniform1f(U.uGrain, o.grain);
        gl.uniform1f(U.uCalm, o.calm); gl.uniform1f(U.uSide, sideCode()); gl.uniform1f(U.uDark, pal.dark ? 1 : 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        return;
      }
      const w = canvas.width, h = canvas.height, t = time, c = ctx2d;
      const css = (a, al) => `rgba(${Math.round(a[0] * 255)},${Math.round(a[1] * 255)},${Math.round(a[2] * 255)},${al})`;
      c.fillStyle = css(pal.bg, 1); c.fillRect(0, 0, w, h);
      const pts = [[0.7 + 0.16 * Math.sin(t * 0.21), 0.38 - 0.18 * Math.cos(t * 0.17), 0.5], [0.92 + 0.12 * Math.cos(t * 0.19 + 1), 0.78 - 0.16 * Math.sin(t * 0.23 + 2), 0.45], [0.45 + 0.2 * Math.sin(t * 0.15 + 4), 0.85 - 0.22 * Math.cos(t * 0.13 + 1.5), 0.55], [0.98 + 0.1 * Math.sin(t * 0.11 + 3), 0.12 - 0.1 * Math.cos(t * 0.2), 0.4]];
      pts.forEach(([px, py, pr], i) => {
        let x = px * w, y = py * h; const rr = pr * h * 1.4;
        if (i === 0) { x += (ptr[0] * w - x) * 0.35 * ptrA; y += (ptr[1] * h - y) * 0.35 * ptrA; }
        const g = c.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, css(pal.c[i], o.intensity * 0.9)); g.addColorStop(1, css(pal.c[i], 0));
        c.fillStyle = g; c.fillRect(0, 0, w, h);
      });
      const sc = sideCode();
      if (sc < 2) {
        const cv = sc === 1 ? Math.min(0.9, o.calm * 1.45) : o.calm;
        const lg = sc === 0 ? c.createLinearGradient(0, 0, w, 0) : c.createLinearGradient(0, h, 0, 0);
        lg.addColorStop(0, css(pal.bg, 1)); lg.addColorStop(Math.max(0, cv - 0.06), css(pal.bg, 1)); lg.addColorStop(Math.min(1, cv + 0.28), css(pal.bg, 0));
        c.fillStyle = lg; c.fillRect(0, 0, w, h);
      }
    };
    const frame = (now) => {
      raf = 0; if (!visible) return;
      const o = opts.current, dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
      time += dt * o.speed * 0.9;
      const k = 1 - Math.exp(-dt * 3.2);
      ptr = [ptr[0] + (ptrT[0] - ptr[0]) * k, ptr[1] + (ptrT[1] - ptr[1]) * k]; ptrA += (ptrAT - ptrA) * (1 - Math.exp(-dt * 2));
      render();
      if (o.speed > 0 || Math.abs(ptrA - ptrAT) > 0.002) raf = requestAnimationFrame(frame); else last = 0;
    };
    const wake = () => { if (!raf && visible) { if (reduced.matches) render(); else raf = requestAnimationFrame(frame); } };
    const onMove = (e) => {
      if (!opts.current.pointer || e.pointerType === 'touch') return;
      const r = el.getBoundingClientRect(); ptrT = [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; ptrAT = 1; wake();
    };
    const onLeave = () => { ptrAT = 0; wake(); };
    section.addEventListener('pointermove', onMove, { passive: true });
    section.addEventListener('pointerleave', onLeave);
    const ro = new ResizeObserver(() => { resize(); render(); wake(); }); ro.observe(el);
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) wake(); else { cancelAnimationFrame(raf); raf = 0; last = 0; } }); io.observe(el);
    const mo = new MutationObserver(() => { pal = palette(el, opts.current); render(); wake(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-accent'] });
    resize(); render();
    requestAnimationFrame(() => canvas.classList.replace('opacity-0', 'opacity-100'));
    wake();
    api.current = { refresh: () => { pal = palette(el, opts.current); render(); wake(); } };
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); mo.disconnect();
      section.removeEventListener('pointermove', onMove); section.removeEventListener('pointerleave', onLeave);
      canvas.remove();
    };
  }, []);

  useEffect(() => { api.current?.refresh(); }, [speed, warp, spread, intensity, grain, calm, side]);

  return (
    <section ref={hostRef} className={`relative isolate grid overflow-hidden bg-[var(--bg)] [font-family:var(--font-sans)] text-[var(--text)] ${className}`}>
      <div ref={fieldRef} aria-hidden="true" className="absolute inset-0 -z-10" />
      {children}
    </section>
  );
}

const btn = 'inline-flex min-h-12 items-center justify-center rounded-lg px-5 text-[15px] font-semibold transition-colors active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] md:min-h-11';
const tx = [
  ['Studio Hublot', 'Virement reçu · aujourd’hui', '+ 2 400,00 €', true],
  ['Mise de côté TVA', 'Automatique · 20 %', '480,00 €'],
  ['Imprimerie Carmin', 'Carte · hier', '− 186,40 €'],
];

/* Exemple : hero d'Aplomb (marque fictive, banque en ligne pour indépendants). */
export default function AplombHero() {
  return (
    <MeshGradient className="min-h-[clamp(620px,90svh,820px)] items-end min-[900px]:items-center">
      <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-5 pb-8 pt-[200px] min-[900px]:grid-cols-[1.05fr_.95fr] min-[900px]:items-center min-[900px]:gap-12 min-[900px]:px-6 min-[900px]:py-16">
        <div>
          <a href="#accueil" aria-label="Aplomb, accueil" className="mb-4 inline-flex min-h-11 items-center gap-2.5 rounded-lg text-lg font-semibold tracking-[-0.02em] text-[var(--text-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] md:mb-6">
            <svg viewBox="0 0 100 100" className="size-7 text-[var(--accent)]" aria-hidden="true">
              <rect width="100" height="100" rx="28" fill="currentColor" />
              <path d="M28 72 50 26l22 46" fill="none" style={{ stroke: 'var(--accent-fg)' }} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M38 56h24" style={{ stroke: 'var(--accent-fg)' }} strokeWidth="9" strokeLinecap="round" />
            </svg>
            Aplomb
          </a>
          <h1 className="max-w-[13ch] text-balance text-[clamp(2.5rem,1.5rem+3.6vw,4.5rem)] font-semibold leading-none tracking-[-0.04em] text-[var(--text-strong)]">
            Votre argent pro, enfin au&nbsp;calme.
          </h1>
          <p className="mt-4 max-w-[30rem] text-pretty text-base leading-relaxed text-[var(--text-muted)] md:mt-6 md:text-lg">
            Le compte des indépendants qui met de côté la TVA et les cotisations à chaque encaissement. Vous ne voyez que ce qui est vraiment à vous.
          </p>
          <div className="mt-6 flex flex-col gap-3 md:mt-8 md:flex-row">
            <a href="#ouvrir" className={`${btn} bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]`}>Ouvrir un compte</a>
            <a href="#tarifs" className={`${btn} border border-[var(--border-control)] bg-[var(--surface)] text-[var(--text-strong)] hover:bg-[var(--raised)]`}>Voir les offres</a>
          </div>
          <p className="mt-5 text-[13px] leading-[18px] text-[var(--text-muted)]">Ouverture en 8 minutes · Agrément ACPR · IBAN français</p>
        </div>

        <figure aria-label="Exemple de compte Aplomb" className="m-0 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 min-[900px]:max-w-[400px] min-[900px]:justify-self-end min-[900px]:p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-muted)]">Disponible</span>
            <span className="inline-flex h-6 items-center rounded-full bg-[var(--accent-subtle)] px-2.5 text-xs font-medium text-[var(--text-strong)]">Compte Pro</span>
          </div>
          <p className="mb-4 mt-2 text-[34px] font-semibold leading-tight tracking-[-0.03em] tabular-nums text-[var(--text-strong)] min-[900px]:mb-5 min-[900px]:text-[40px]">
            8&nbsp;742<span className="text-2xl text-[var(--text-muted)]">,18&nbsp;€</span>
          </p>
          <div role="img" aria-label="Sur 12 434 € encaissés : 8 742 € disponibles, 2 486 € de TVA et 1 206 € de cotisations mis de côté" className="flex h-2 gap-1">
            <span className="rounded-full bg-[var(--accent)]" style={{ flex: 70.3 }} />
            <span className="rounded-full bg-[var(--accent-subtle-border)]" style={{ flex: 20 }} />
            <span className="rounded-full bg-[var(--border-control)]" style={{ flex: 9.7 }} />
          </div>
          <ul aria-hidden="true" className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] leading-[18px] text-[var(--text-muted)]">
            <li className="inline-flex items-center gap-1.5"><i className="size-2 rounded-sm bg-[var(--accent)]" />Disponible</li>
            <li className="inline-flex items-center gap-1.5"><i className="size-2 rounded-sm bg-[var(--accent-subtle-border)]" />TVA 2&nbsp;486&nbsp;€</li>
            <li className="inline-flex items-center gap-1.5"><i className="size-2 rounded-sm bg-[var(--border-control)]" />Cotisations 1&nbsp;206&nbsp;€</li>
          </ul>
          <ul className="mt-5 hidden border-t border-[var(--border)] min-[900px]:block">
            {tx.map(([name, meta, amt, isIn]) => (
              <li key={name} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 border-b border-[var(--border)] py-3 last:border-b-0 last:pb-0">
                <span className="text-sm font-medium text-[var(--text-strong)]">{name}</span>
                <span className="row-start-2 text-[13px] text-[var(--text-muted)]">{meta}</span>
                <span className={`col-start-2 row-span-2 row-start-1 self-center text-sm font-medium tabular-nums ${isIn ? 'text-[var(--up)]' : 'text-[var(--text-strong)]'}`}>{amt}</span>
              </li>
            ))}
          </ul>
        </figure>
      </div>
    </MeshGradient>
  );
}
