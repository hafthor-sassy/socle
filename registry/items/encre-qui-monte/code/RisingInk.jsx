// Encre qui monte — React + Tailwind CSS. WebGL 1 maison, aucune bibliothèque ; repli CSS sans WebGL.
// <RisingInk as="h2" duration={2600} turbulence={0.6} bleed={0.5} origin="bottom" color="text" wisps>L’encre se souvient de tout.</RisingInk>
// Le vrai texte reste dans le DOM (sélection, SEO, lecteurs d'écran) ; un canvas le recouvre le temps de l'effet.
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

const VS = 'attribute vec2 p; varying vec2 v; void main(){ v = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }';
const FS = `precision highp float;
uniform sampler2D uT, uB, uS; uniform vec2 uRes; uniform vec4 uBox; uniform float uP, uTime, uTurb, uBleed, uOrigin, uWisps; uniform vec3 uInk, uTint;
varying vec2 v;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++) { s += a * n(p); p = p * 2.03 + vec2(1.7, 9.2); a *= .5; } return s; }
void main(){
  float settle = smoothstep(.62, 1., uP), done = smoothstep(.93, 1., uP);
  vec2 asp = vec2(uRes.x / uRes.y, 1.), q = v * asp * 3.2;
  vec2 w = vec2(fbm(q * .8 + vec2(0., -uTime * .12)), fbm(q * .8 + vec2(3.1, 1.7) - uTime * .16));
  float n1 = fbm(q + 2.2 * w + vec2(0., -uTime * .32)), n2 = fbm(q * 1.8 + 1.6 * w + vec2(4.1, -uTime * .5));
  float ly = clamp((v.y - uBox.y) / max(.001, uBox.w - uBox.y), 0., 1.);
  vec2 c = vec2((uBox.x + uBox.z) * .5, (uBox.y + uBox.w) * .5);
  float rad = length((v - c) * asp) / max(.001, length((uBox.zw - c) * asp));
  float pos = uOrigin < .5 ? ly : rad;
  float front = uP * 1.38 - pos - (n1 - .5) * .8 * uTurb;
  float r = smoothstep(0., .5, front);
  vec2 disp = (vec2(n1, n2) - .5) * .085 * uTurb * (1. - settle);
  disp.y -= (1. - r) * .035 * (1. - uOrigin);
  vec2 s = v + disp;
  float T = texture2D(uT, s).a, B = texture2D(uB, s).a;
  float F = mix(B, T, settle) + (n2 - .5) * .22 * uTurb * (1. - settle);
  float thr = mix(1.05, mix(.5, .28, uBleed * (1. - settle)), r);
  float e = mix(.06 + .2 * uBleed, .02, settle);
  float a = smoothstep(thr - e, thr + e, F);
  a = mix(a, texture2D(uT, v).a, done);
  float S = texture2D(uS, v + vec2(0., -.06 * (1. - r)) + disp * 2.4).a;
  float band = smoothstep(-.05, .2, front) * (1. - smoothstep(.2, .85, front));
  float smoke = uWisps * S * smoothstep(.42, .78, n1 * .7 + n2 * .6) * band * (1. - settle) * .6;
  float mott = mix(.3 + .7 * smoothstep(.28, .72, n2 * .8 + n1 * .4), 1., settle * settle);
  float al = clamp(max(a * mott, smoke), 0., 1.);
  vec3 col = mix(uTint, uInk, clamp(smoothstep(.15, .95, a * mott) * (.55 + .45 * settle) + done, 0., 1.));
  gl_FragColor = vec4(col * al, al);
}`;
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
function cssRGB(el, v) { const p = document.createElement('span'); p.style.color = `var(${v})`; p.style.display = 'none'; el.appendChild(p); const m = getComputedStyle(p).color.match(/[\d.]+/g) || [0, 0, 0]; p.remove(); return [m[0] / 255, m[1] / 255, m[2] / 255]; }

/* Moteur impératif : un contexte WebGL par texte, détruit au démontage. */
function createInk(el, canvas, host) {
  let gl = null;
  try { gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false }); } catch { gl = null; }
  if (!gl) return null;
  const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = Object.fromEntries(['uT', 'uB', 'uS', 'uRes', 'uBox', 'uP', 'uTime', 'uTurb', 'uBleed', 'uOrigin', 'uWisps', 'uInk', 'uTint'].map((k) => [k, gl.getUniformLocation(pr, k)]));
  const tex = [0, 1, 2].map((i) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t); [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]].forEach(([k, val]) => gl.texParameteri(gl.TEXTURE_2D, k, val)); return t; });
  gl.uniform1i(U.uT, 0); gl.uniform1i(U.uB, 1); gl.uniform1i(U.uS, 2);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  let dpr = 1, W = 0, H = 0;
  const upload = (i, c) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tex[i]); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c); };
  const blur = (src, r, passes) => { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const x = c.getContext('2d'); x.filter = `blur(${(r * dpr).toFixed(1)}px)`; for (let i = 0; i < passes; i++) x.drawImage(src, 0, 0); return c; };
  return {
    /* Redessine le texte à l'emplacement exact de chaque mot du DOM (mêmes retours à la ligne). */
    layout() {
      const cs = getComputedStyle(el), fs = parseFloat(cs.fontSize), padX = fs * 0.35, padT = fs * 0.9, padB = fs * 0.35;
      const er = el.getBoundingClientRect(), hr = host.getBoundingClientRect();
      W = Math.ceil(er.width + padX * 2); H = Math.ceil(er.height + padT + padB); dpr = Math.min(2, window.devicePixelRatio || 1);
      Object.assign(canvas.style, { left: `${er.left - hr.left - padX}px`, top: `${er.top - hr.top - padT}px`, width: `${W}px`, height: `${H}px` });
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      const c2 = document.createElement('canvas'); c2.width = canvas.width; c2.height = canvas.height;
      const x = c2.getContext('2d'); x.scale(dpr, dpr); x.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      if ('letterSpacing' in x) x.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
      const m = x.measureText('Hg'), asc = m.fontBoundingBoxAscent || fs * 0.9, desc = m.fontBoundingBoxDescent || fs * 0.25;
      let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let node;
      while ((node = walker.nextNode())) {
        for (const mm of node.data.matchAll(/\S+/g)) {
          const rg = document.createRange(); rg.setStart(node, mm.index); rg.setEnd(node, mm.index + mm[0].length);
          const rc = rg.getClientRects()[0]; if (!rc) continue;
          const lx = rc.left - er.left + padX, ty = rc.top - er.top + padT;
          x.fillText(mm[0], lx, ty + (rc.height - (asc + desc)) / 2 + asc);
          minX = Math.min(minX, lx); maxX = Math.max(maxX, lx + rc.width); minY = Math.min(minY, ty); maxY = Math.max(maxY, ty + rc.height);
        }
      }
      upload(0, c2); upload(1, blur(c2, fs * 0.14, 2)); upload(2, blur(c2, fs * 0.5, 3));
      gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(U.uRes, W, H); gl.uniform4f(U.uBox, minX / W, 1 - maxY / H, maxX / W, 1 - minY / H);
    },
    colors(color) { const ink = cssRGB(el, color === 'accent' ? '--accent' : '--text-strong'), tint = cssRGB(el, '--accent-vivid'); gl.uniform3f(U.uInk, ...ink); gl.uniform3f(U.uTint, ...tint); },
    draw(p, time, o) {
      gl.uniform1f(U.uP, p); gl.uniform1f(U.uTime, time); gl.uniform1f(U.uTurb, o.turbulence); gl.uniform1f(U.uBleed, o.bleed); gl.uniform1f(U.uOrigin, o.origin === 'center' ? 1 : 0); gl.uniform1f(U.uWisps, o.wisps ? 1 : 0);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    destroy() { gl.getExtension('WEBGL_lose_context')?.loseContext(); },
  };
}

/* trigger : 'view' (à l'entrée dans l'écran) | 'hover' (survol, focus ou toucher du lien parent) | 'manual' (ref.play()) */
const RisingInk = forwardRef(function RisingInk({ as: Tag = 'span', children, className = '', duration = 2600, turbulence = 0.6, bleed = 0.5, origin = 'bottom', color = 'text', wisps = true, trigger = 'view', onEnd }, ref) {
  const textRef = useRef(null), canvasRef = useRef(null), engine = useRef(null), state = useRef({ raf: 0, playing: false, t0: 0, paused: 0, visible: true });
  const opts = useRef({}); opts.current = { duration, turbulence, bleed, origin, color, wisps };
  const play = () => {
    const el = textRef.current, cv = canvasRef.current, s = state.current; if (!el) return;
    cancelAnimationFrame(s.raf);
    if (reducedMotion()) { el.style.color = ''; if (cv) cv.style.opacity = '0'; return; }
    const eng = engine.current;
    if (!eng) { el.style.color = ''; el.animate([{ opacity: 0, filter: 'blur(18px)', clipPath: 'inset(100% 0 0 0)', transform: 'translateY(.12em)' }, { opacity: 1, filter: 'blur(0)', clipPath: 'inset(-20% 0 -20% 0)', transform: 'none' }], { duration: opts.current.duration, easing: 'cubic-bezier(.2,.7,.2,1)' }); return; }
    eng.layout(); eng.colors(opts.current.color);
    el.style.color = 'transparent'; cv.style.transition = 'none'; cv.style.opacity = '1';
    eng.draw(0, 0, opts.current); s.t0 = performance.now(); s.playing = true;
    const frame = (now) => {
      if (!s.visible || document.hidden) { s.playing = false; s.paused = now - s.t0; return; }
      const p = Math.min(1, (now - s.t0) / opts.current.duration);
      eng.draw(1 - (1 - p) ** 1.25, now / 1000, opts.current);
      if (p < 1) s.raf = requestAnimationFrame(frame);
      else { s.playing = false; cv.style.transition = 'opacity 240ms cubic-bezier(.2,0,0,1)'; cv.style.opacity = '0'; el.style.transition = 'color 240ms cubic-bezier(.2,0,0,1)'; el.style.color = ''; setTimeout(() => { el.style.transition = ''; }, 260); onEnd?.(); }
    };
    s.raf = requestAnimationFrame(frame);
  };
  useImperativeHandle(ref, () => ({ play }));

  useEffect(() => {
    const el = textRef.current, cv = canvasRef.current, s = state.current;
    engine.current = createInk(el, cv, cv.offsetParent || el.parentNode);
    if (!engine.current) cv.style.display = 'none';
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting; if (s.visible && !s.playing && el.style.color === 'transparent' && cv.style.opacity === '1') { s.t0 = performance.now() - s.paused; s.playing = true; requestAnimationFrame(function resume(now) { play(); }); } });
    io.observe(el);
    const mo = new MutationObserver(() => engine.current?.colors(opts.current.color));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-accent'] });
    let cleanup = () => {};
    if (trigger === 'view') {
      if (!reducedMotion()) el.style.color = 'transparent';
      const vio = new IntersectionObserver(([e]) => { if (e.isIntersecting) { vio.disconnect(); (document.fonts?.ready || Promise.resolve()).then(play); } }, { threshold: 0.35 });
      vio.observe(el); cleanup = () => vio.disconnect();
    } else if (trigger === 'hover') {
      const target = el.closest('a, button') || el; let last = 0;
      const go = (e) => { if (e.type === 'pointerenter' && e.pointerType !== 'mouse') return; if (e.type === 'pointerdown' && e.pointerType === 'mouse') return; const now = Date.now(); if (now - last < 600) return; last = now; play(); };
      ['pointerenter', 'focus', 'pointerdown'].forEach((t) => target.addEventListener(t, go));
      cleanup = () => ['pointerenter', 'focus', 'pointerdown'].forEach((t) => target.removeEventListener(t, go));
    }
    return () => { cleanup(); io.disconnect(); mo.disconnect(); cancelAnimationFrame(s.raf); engine.current?.destroy(); engine.current = null; };
  }, [trigger]);

  return (
    <>
      <Tag ref={textRef} className={`relative ${className}`}>{children}</Tag>
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute z-[1] opacity-0" />
    </>
  );
});
export default RisingInk;

/* Exemple complet : hero de maison d'édition (marque fictive « lavis »). Le parent doit être positionné (relative). */
export function BookLaunchHero({ title = 'L’encre se souvient de tout.', ...ink }) {
  return (
    <section aria-labelledby="ink-title" className="relative mx-auto grid w-full max-w-[1120px] items-center gap-10 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 pb-8 pt-7 font-[family-name:var(--font-sans)] text-[var(--text)] md:grid-cols-[1.25fr_.75fr] md:gap-16 md:rounded-2xl md:p-16">
      <div>
        <a href="#" aria-label="Lavis, accueil" className="mb-8 inline-flex items-baseline gap-2 text-xl font-semibold tracking-[-0.03em] text-[var(--text-strong)] md:mb-12">
          <svg viewBox="0 0 100 100" aria-hidden className="h-8 w-8 self-center"><circle cx="50" cy="50" r="50" fill="var(--accent)" /><path d="M50 18c11 15 22 27 22 39a22 22 0 0 1-44 0c0-12 11-24 22-39Z" fill="var(--accent-fg)" /><path d="M41 60c0 6 4 10 9 11" fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" /></svg>
          lavis<span className="text-sm font-normal tracking-normal text-[var(--text-muted)]">éditions</span>
        </a>
        <p className="mb-5 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.04em] text-[var(--text-muted)]">Rentrée littéraire 2027 · Roman</p>
        <RisingInk as="h2" {...ink} className="text-balance text-[clamp(2.5rem,1.4rem+4.2vw,5rem)] font-semibold leading-none tracking-[-0.045em] text-[var(--text-strong)]"><span id="ink-title">{title}</span></RisingInk>
        <p className="mt-7 max-w-[44ch] leading-relaxed text-[var(--text-muted)]">Dans <em className="text-[var(--text-strong)]">La Marée lente</em>, Mathilde Arnaud suit trois générations de femmes sur l’île de Bréhat, entre lettres jamais envoyées et carnets retrouvés.</p>
        <div className="mt-8 flex flex-col gap-3 md:flex-row">
          <a href="#" className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--text-strong)] px-5 font-medium text-[var(--surface)] hover:bg-[var(--text)] md:h-11 md:text-sm">Lire les premières pages</a>
          <a href="#" className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--border-control)] px-5 font-medium text-[var(--text-strong)] hover:bg-[var(--state-hover)] md:h-11 md:text-sm">Trouver une librairie</a>
        </div>
      </div>
      <a href="#" aria-label="La Marée lente, Mathilde Arnaud : voir la fiche du livre" className="group grid justify-items-center gap-4">
        <span className="relative flex aspect-[2/3] w-full max-w-[260px] flex-col rounded-[4px_12px_12px_4px] bg-[var(--accent-subtle)] px-7 pb-7 pt-8 text-[var(--text-strong)] shadow-[inset_6px_0_0_var(--accent-subtle-border)] transition-transform duration-[260ms] group-hover:-translate-y-1 group-hover:-rotate-[.6deg] md:max-w-[320px]">
          <span className="text-sm font-medium">Mathilde Arnaud</span>
          <span className="mt-auto" />
          <RisingInk trigger="hover" origin="center" color="accent" duration={2000} turbulence={0.8} bleed={0.7} wisps={false} className="block text-[clamp(2rem,1.5rem+1.6vw,2.75rem)] font-semibold leading-none tracking-[-0.04em] text-[var(--accent)]">La Marée lente</RisingInk>
          <span className="mt-3 text-sm italic text-[var(--text-muted)]">roman</span>
        </span>
        <span aria-hidden className="text-xs text-[var(--text-muted)]">Survolez ou touchez la couverture</span>
      </a>
    </section>
  );
}
