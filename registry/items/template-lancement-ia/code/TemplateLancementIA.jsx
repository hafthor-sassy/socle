// TemplateLancementIA.jsx — page complète « Lancement produit IA » : un composant par section, assemblés dans <TemplateLancementIA />.
// React 18, Tailwind 3.4, tokens.css chargé. Aucune bibliothèque d’animation : WebGL 1 maison pour le fond du hero,
// SVG animé (animateMotion) pour les intégrations, minuteries pour le fil d’agent. Tout s’arrête hors écran.
// Marque fictive : Nuée (agents IA pour les équipes opérations). Sections reprises des designs Socle :
// Hero shader interactif, Fil d’activité d’agent IA, Flux d’intégrations, Compteurs à l’entrée, Accordéon natif ; liste d’attente vivante.
// Utilisation : <TemplateLancementIA titre="Des agents qui finissent le travail." matiere="soie" force={1} validation={true} places={2418} />
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const EASE = 'cubic-bezier(.16,1,.3,1)';
const SPRING = 'cubic-bezier(.34,1.36,.64,1)';
const ring = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2';
const reducedNow = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const fmt = (n) => n.toLocaleString('fr-FR').replace(/\u202F|\u00A0/g, '\u202F');
const LOGO_VARS = { '--p': 'var(--accent)', '--lt': 'var(--accent-fg)', '--a': 'var(--accent-subtle)', '--ink': 'var(--text-strong)' };

/** Visible à l’écran (pause des boucles hors écran). */
function useInView(ref, margin = '0px') {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!('IntersectionObserver' in window)) { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: margin });
    io.observe(ref.current); return () => io.disconnect();
  }, [ref, margin]);
  return on;
}

export function NueeIcon({ className = 'size-7' }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className} style={LOGO_VARS}>
      <rect width="100" height="100" rx="28" style={{ fill: 'var(--p, currentColor)' }}/><circle cx="50" cy="50" r="25" fill="none" style={{ stroke: 'var(--lt, #fff)' }} strokeWidth="3" strokeDasharray="3 7" strokeLinecap="round" opacity=".7"/><circle cx="50" cy="50" r="12" style={{ fill: 'var(--lt, #fff)' }}/><circle cx="27" cy="38" r="6" style={{ fill: 'var(--lt, #fff)' }}/><circle cx="72" cy="31" r="5" style={{ fill: 'var(--lt, #fff)' }}/><circle cx="66" cy="74" r="6.5" style={{ fill: 'var(--a, var(--lt, #fff))' }}/><circle cx="29" cy="70" r="4" style={{ fill: 'var(--lt, #fff)' }}/>
    </svg>
  );
}
export function NueeLogo({ className = 'h-7 w-auto' }) {
  return (
    <svg viewBox="0 0 274 100" aria-hidden="true" className={className} style={LOGO_VARS}>
      <g><rect width="100" height="100" rx="28" style={{ fill: 'var(--p, currentColor)' }}/><circle cx="50" cy="50" r="25" fill="none" style={{ stroke: 'var(--lt, #fff)' }} strokeWidth="3" strokeDasharray="3 7" strokeLinecap="round" opacity=".7"/><circle cx="50" cy="50" r="12" style={{ fill: 'var(--lt, #fff)' }}/><circle cx="27" cy="38" r="6" style={{ fill: 'var(--lt, #fff)' }}/><circle cx="72" cy="31" r="5" style={{ fill: 'var(--lt, #fff)' }}/><circle cx="66" cy="74" r="6.5" style={{ fill: 'var(--a, var(--lt, #fff))' }}/><circle cx="29" cy="70" r="4" style={{ fill: 'var(--lt, #fff)' }}/></g><path d="M136.48 70V30.24H145.01L162.12 60.17V30.24H169.4V70H160.66L143.76 40.93V70ZM185.98 70.67Q181.43 70.67 178.79 67.68Q176.15 64.68 176.15 59.35V40.1H183.32V57.59Q183.32 61.34 184.56 63.1Q185.79 64.85 188.38 64.85Q191.28 64.85 192.89 62.92Q194.51 60.98 194.51 57.3V40.1H201.68V70H195.09L194.93 61.79L195.86 62.07Q195.15 66.29 192.63 68.48Q190.11 70.67 185.98 70.67ZM220.79 70.67Q216.32 70.67 213.04 68.75Q209.75 66.82 207.95 63.3Q206.16 59.77 206.16 55.05Q206.16 50.32 207.95 46.83Q209.75 43.33 213 41.38Q216.26 39.42 220.66 39.42Q224.93 39.42 228.13 41.33Q231.33 43.24 233.09 46.83Q234.84 50.41 234.84 55.44V57.04H213.59Q213.8 61 215.74 62.97Q217.67 64.94 220.88 64.94Q223.28 64.94 224.86 63.87Q226.45 62.8 227.09 60.83L234.41 61.29Q233.21 65.62 229.59 68.15Q225.97 70.67 220.79 70.67ZM213.59 52.23H227.4Q227.18 48.59 225.35 46.83Q223.52 45.07 220.66 45.07Q217.78 45.07 215.9 46.91Q214.03 48.75 213.59 52.23ZM217.62 36.87 221.05 28.99H228.24L223.2 36.87ZM252.21 70.67Q247.74 70.67 244.45 68.75Q241.17 66.82 239.37 63.3Q237.57 59.77 237.57 55.05Q237.57 50.32 239.37 46.83Q241.17 43.33 244.42 41.38Q247.67 39.42 252.08 39.42Q256.34 39.42 259.55 41.33Q262.75 43.24 264.5 46.83Q266.25 50.41 266.25 55.44V57.04H245.01Q245.22 61 247.15 62.97Q249.08 64.94 252.3 64.94Q254.7 64.94 256.28 63.87Q257.87 62.8 258.5 60.83L265.83 61.29Q264.63 65.62 261.01 68.15Q257.38 70.67 252.21 70.67ZM245.01 52.23H258.82Q258.59 48.59 256.76 46.83Q254.93 45.07 252.08 45.07Q249.2 45.07 247.32 46.91Q245.44 48.75 245.01 52.23Z" style={{ fill: 'var(--ink)' }} />
    </svg>
  );
}
const Eyebrow = ({ n, children, center }) => (
  <p className={`m-0 inline-flex items-center gap-2.5 font-mono text-[13px] font-medium uppercase leading-5 tracking-[0.04em] text-[var(--text-muted)] ${center ? 'justify-center' : ''}`}>
    <span className="inline-grid h-[22px] min-w-7 place-items-center rounded-full border border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)] px-1.5 text-xs text-[var(--text-strong)]">{n}</span>{children}
  </p>
);
const Arrow = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
const btn = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-base font-semibold no-underline transition-[background-color,transform] active:scale-[.98] ${ring}`;

/* ——— Fond WebGL : fluide en déformation de domaine (même shader que le design Socle) ——— */
const VERT = 'attribute vec2 a;varying vec2 vUv;void main(){vUv=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
const FRAG = "precision highp float;\nuniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform vec2 uVel;uniform float uForce;\nuniform vec3 uC0;uniform vec3 uC1;uniform vec3 uC2;uniform vec3 uC3;\nuniform float uGrain;uniform float uScale;uniform float uVeil;uniform float uStyle;uniform vec4 uRipple;uniform vec4 uFocus;uniform float uDark;uniform float uFlute;\nvarying vec2 vUv;\nfloat hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}\nfloat noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);vec2 u=f*f*(3.-2.*f);\n return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}\nfloat fbm(vec2 p){float v=0.;float a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}\nvoid main(){\n vec2 uv=vUv;vec2 K=uRes/min(uRes.x,uRes.y);float asp=uRes.x/uRes.y;\n vec2 p=(uv-.5)*K;vec2 m=(uMouse-.5)*K;\n vec2 dm=p-m;float d=length(dm);\n float infl=exp(-d*d*5.)*uForce;\n float ang=infl*1.8;float cs=cos(ang);float sn=sin(ang);\n p=m+mat2(cs,-sn,sn,cs)*dm;\n p-=uVel*infl*.8;\n float rt=uTime-uRipple.z;\n if(rt>0.&&rt<3.){vec2 rp=(uRipple.xy-.5)*K;float rr=length(((uv-.5)*K)-rp);float fr=rr-rt*.6;\n  float ring=sin(fr*26.)*exp(-fr*fr*30.)*(1.-rt/3.)*uRipple.w;p+=normalize(((uv-.5)*K)-rp+1e-4)*ring*.05;}\n float hl=0.;float sh=0.;\n if(uStyle>.5){float b=fract(uv.x*uRes.x/uFlute);float w=uFlute/min(uRes.x,uRes.y);\n  p.x+=(b-.5)*w*2.4;p.y+=(b-.5)*w*.25;\n  hl=exp(-pow((b-.16)*10.,2.))*.14;sh=pow(abs(b-.5)*2.,5.)*.16;}\n vec2 q0=p*uScale;float t=uTime*.07;\n vec2 q=vec2(fbm(q0+vec2(0.,t)),fbm(q0+vec2(5.2,1.3)-t));\n vec2 r=vec2(fbm(q0+3.*q+vec2(1.7,9.2)+t*1.3),fbm(q0+3.*q+vec2(8.3,2.8)-t*.9));\n float f=fbm(q0+3.*r);\n float band=.5+.5*sin(f*10.+length(q)*7.-uTime*.2);\n float fold=smoothstep(.5,1.,band)*smoothstep(.38,.7,f);\n vec3 col=mix(uC0,uC1,smoothstep(.28,.72,f));\n col=mix(col,uC2,smoothstep(.42,.82,f*length(q)*1.75)*.95);\n col=mix(col,uC3,fold*.9);\n col+=pow(fold,5.)*(.16-uDark*.06);\n col*=1.-sh;\n col=mix(col,uC3,infl*.15);\n col+=hl*mix(vec3(1.),uC1,.4)*(1.-uDark*.45);\n vec2 fv=(uv-uFocus.xy)/uFocus.zw;\n float v=1.-smoothstep(.75,1.7,length(fv));\n col=mix(col,uC0,clamp(v*uVeil,0.,.92));\n col+=(hash(uv*uRes+fract(uTime*.37)*91.)-.5)*uGrain*(1.-.35*(1.-uDark));\n gl_FragColor=vec4(col,1.);\n}";
function useFluid(canvasRef, hostRef, { style = 'soie', force = 1, speed = 1, paused = false }) {
  const opts = useRef({ style, force, speed, paused }); opts.current = { style, force, speed, paused };
  const [gl, setGl] = useState(true);
  useEffect(() => {
    const canvas = canvasRef.current, host = hostRef.current, reduce = reducedNow();
    let ctx = null; try { ctx = canvas.getContext('webgl', { antialias: false, alpha: false }); } catch (e) { ctx = null; }
    if (!ctx) { setGl(false); return; }
    const sh = (t, s) => { const o = ctx.createShader(t); ctx.shaderSource(o, s); ctx.compileShader(o); return ctx.getShaderParameter(o, ctx.COMPILE_STATUS) ? o : null; };
    const vs = sh(ctx.VERTEX_SHADER, VERT), fs = sh(ctx.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { setGl(false); return; }
    const prog = ctx.createProgram(); ctx.attachShader(prog, vs); ctx.attachShader(prog, fs); ctx.linkProgram(prog); ctx.useProgram(prog);
    const buf = ctx.createBuffer(); ctx.bindBuffer(ctx.ARRAY_BUFFER, buf); ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), ctx.STATIC_DRAW);
    const loc = ctx.getAttribLocation(prog, 'a'); ctx.enableVertexAttribArray(loc); ctx.vertexAttribPointer(loc, 2, ctx.FLOAT, false, 0, 0);
    const U = {}; ['uRes', 'uTime', 'uMouse', 'uVel', 'uForce', 'uC0', 'uC1', 'uC2', 'uC3', 'uGrain', 'uScale', 'uVeil', 'uStyle', 'uRipple', 'uFocus', 'uDark', 'uFlute'].forEach((n) => { U[n] = ctx.getUniformLocation(prog, n); });
    const probe = document.createElement('i'); probe.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden'; host.appendChild(probe);
    const rgb = (v) => { probe.style.color = `var(${v})`; const m = getComputedStyle(probe).color.match(/[\d.]+/g) || [0, 0, 0]; return [m[0] / 255, m[1] / 255, m[2] / 255]; };
    const mix = (a, b, k) => a.map((x, i) => x + (b[i] - x) * k);
    let cols, dark = 0, t = reduce ? 12 : 0, last = 0, raf = 0, visible = true, flute = 72, focus = [0.3, 0.55, 0.25, 0.3], lastMove = -1e9, ripple = [0, 0, -10, 0];
    const mouse = { x: 0.72, y: 0.55 }, target = { x: 0.72, y: 0.55 }, vel = { x: 0, y: 0 };
    const colors = () => {
      cols = [rgb('--bg'), rgb('--accent-subtle'), rgb('--accent'), rgb('--accent-vivid')];
      const b = cols[0]; dark = 0.2126 * b[0] + 0.7152 * b[1] + 0.0722 * b[2] < 0.4 ? 1 : 0;
      cols[1] = mix(cols[1], dark ? cols[2] : cols[3], dark ? 0.25 : 0.32); draw();
    };
    const resize = () => {
      const r = host.getBoundingClientRect(), mobile = r.width < 600, dpr = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 1.25) * 0.75;
      canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr)); ctx.viewport(0, 0, canvas.width, canvas.height);
      flute = (mobile ? 56 : 72) * canvas.width / r.width;
      const fe = host.querySelector('[data-focus]')?.getBoundingClientRect();
      if (fe) focus = [(fe.left + fe.width / 2 - r.left) / r.width, 1 - (fe.top + fe.height / 2 - r.top) / r.height, fe.width / 2 / r.width, fe.height / 2 / r.height];
      draw();
    };
    function draw() {
      if (!cols) return; const o = opts.current;
      ctx.uniform2f(U.uRes, canvas.width, canvas.height); ctx.uniform1f(U.uTime, t); ctx.uniform2f(U.uMouse, mouse.x, mouse.y); ctx.uniform2f(U.uVel, vel.x, vel.y);
      ctx.uniform1f(U.uForce, reduce ? 0 : o.force); [0, 1, 2, 3].forEach((i) => ctx.uniform3fv(U['uC' + i], cols[i]));
      ctx.uniform1f(U.uGrain, 0.04); ctx.uniform1f(U.uScale, 1.4); ctx.uniform1f(U.uVeil, 0.75); ctx.uniform1f(U.uStyle, o.style === 'verre' ? 1 : 0);
      ctx.uniform4f(U.uRipple, ...ripple); ctx.uniform4f(U.uFocus, ...focus); ctx.uniform1f(U.uDark, dark); ctx.uniform1f(U.uFlute, flute);
      ctx.drawArrays(ctx.TRIANGLES, 0, 3);
    }
    const frame = (now) => {
      raf = 0; const o = opts.current;
      if (o.paused || !visible || document.hidden) return;
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now; t += dt * o.speed;
      if (now - lastMove > 2500) { target.x = 0.66 + Math.sin(t * 0.35) * 0.2; target.y = 0.52 + Math.sin(t * 0.27 + 1.3) * 0.22; }
      const k = 1 - Math.exp(-dt * 7), px = mouse.x, py = mouse.y;
      mouse.x += (target.x - mouse.x) * k; mouse.y += (target.y - mouse.y) * k;
      const kv = 1 - Math.exp(-dt * 5); vel.x += (Math.max(-2, Math.min(2, (mouse.x - px) / dt)) - vel.x) * kv; vel.y += (Math.max(-2, Math.min(2, (mouse.y - py) / dt)) - vel.y) * kv;
      draw(); raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!reduce && !raf) { last = 0; raf = requestAnimationFrame(frame); } };
    const uv = (e) => { const p = e.touches ? e.touches[0] : e, r = host.getBoundingClientRect(); return p && { x: (p.clientX - r.left) / r.width, y: 1 - (p.clientY - r.top) / r.height }; };
    const move = (e) => { const u = uv(e); if (u) { target.x = u.x; target.y = u.y; lastMove = performance.now(); } };
    const down = (e) => { const u = uv(e); if (u) { ripple = [u.x, u.y, t, 1]; move(e); } };
    host.addEventListener('pointermove', move, { passive: true }); host.addEventListener('pointerdown', down, { passive: true });
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }); io.observe(host);
    const ro = new ResizeObserver(resize); ro.observe(host);
    const mo = new MutationObserver(colors); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-accent'] });
    const vis = () => !document.hidden && start(); document.addEventListener('visibilitychange', vis);
    colors(); resize(); start();
    opts.current.kick = () => { draw(); start(); };
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); mo.disconnect(); document.removeEventListener('visibilitychange', vis); host.removeEventListener('pointermove', move); host.removeEventListener('pointerdown', down); probe.remove(); ctx.deleteProgram(prog); ctx.deleteBuffer(buf); };
  }, [canvasRef, hostRef]);
  useEffect(() => { opts.current.kick?.(); }, [style, force, speed, paused]);
  return gl;
}

/* ——— 01 · Hero shader ——— */
const STEPS = [['214 factures lues et classées', '00:41'], ['Rapprochées des bons de commande', '02:12'], ['3 écarts validés par Clara', '09:30'], ['Écritures passées dans l’ERP', '09:58']];
export function Hero({ titre = 'Des agents qui finissent le travail.', matiere = 'soie', force = 1, carte = true }) {
  const host = useRef(null), canvas = useRef(null), [paused, setPaused] = useState(false), [n, setN] = useState(0), [inn, setIn] = useState(false);
  const gl = useFluid(canvas, host, { style: matiere, force, paused });
  const vis = useInView(host);
  useEffect(() => { const id = requestAnimationFrame(() => requestAnimationFrame(() => setIn(true))); return () => cancelAnimationFrame(id); }, []);
  useEffect(() => {
    if (reducedNow() || paused) { setN(STEPS.length); return; }
    if (!vis) return;
    const id = setTimeout(() => setN((x) => (x >= STEPS.length ? 0 : x + 1)), n === 0 ? 700 : n < STEPS.length ? 900 : 4200);
    return () => clearTimeout(id);
  }, [n, vis, paused]);
  const done = n >= STEPS.length;
  const enter = (i) => ({ opacity: inn ? 1 : 0, transform: inn ? 'none' : 'translateY(20px)', transition: `opacity 900ms ${EASE} ${120 + i * 80}ms, transform 900ms ${EASE} ${120 + i * 80}ms` });
  return (
    <section ref={host} aria-labelledby="nu-h1" className="relative isolate flex min-h-[max(100svh,640px)] flex-col overflow-hidden max-sm:min-h-0">
      <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 -z-10 size-full" />
      {!gl && <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_70%_40%,var(--accent-subtle),transparent),var(--bg)]" />}
      <header className="relative flex items-center gap-8 px-4 py-3 sm:px-[clamp(16px,4vw,56px)] sm:py-4">
        <a href="#accueil" aria-label="Nuée, accueil" className={`inline-flex min-h-11 items-center rounded-lg ${ring}`}><NueeLogo /></a>
        <nav aria-label="Principale" className="hidden gap-1 lg:flex">
          {[['#agent', 'L’agent'], ['#integrations', 'Intégrations'], ['#chiffres', 'Résultats'], ['#questions', 'Questions']].map(([h, l]) => <a key={h} href={h} className={`inline-flex min-h-10 items-center rounded-lg px-3 text-[15px] text-[var(--text)] no-underline hover:bg-[var(--state-hover)] hover:text-[var(--text-strong)] ${ring}`}>{l}</a>)}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <a href="#connexion" className="hidden min-h-10 items-center px-3 text-[15px] text-[var(--text)] no-underline sm:inline-flex">Connexion</a>
          <a href="#attente" className={`${btn} min-h-11 bg-[var(--accent)] px-4 text-[15px] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] sm:min-h-10`}>Liste d’attente</a>
        </div>
      </header>
      <div className="relative grid flex-1 content-start items-center gap-8 px-4 pb-24 pt-[clamp(176px,30svh,260px)] sm:content-center sm:px-[clamp(16px,4vw,56px)] sm:pt-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-12">
        <div data-focus className="grid max-w-[620px] gap-6">
          <a href="#attente" style={enter(0)} className={`inline-flex min-h-9 items-center gap-2 justify-self-start rounded-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] py-1 pl-1 pr-3 text-sm text-[var(--text-strong)] no-underline backdrop-blur ${ring}`}>
            <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-xs font-semibold text-[var(--accent-fg)]">Bêta</span>Ouverture par vagues dès janvier<Arrow />
          </a>
          <h1 id="nu-h1" style={enter(1)} className="m-0 text-[clamp(2.75rem,1.4rem+4.6vw,5.25rem)] font-semibold leading-[.98] tracking-[-0.045em] text-[var(--text-strong)] [text-wrap:balance]">{titre}</h1>
          <p style={enter(2)} className="m-0 max-w-[52ch] text-[17px] leading-relaxed text-[var(--text)] sm:text-lg">Nuée confie les tâches répétitives de vos opérations à des agents IA : factures, commandes, relances fournisseurs. Ils agissent dans vos outils et vous demandent l’accord quand ça compte.</p>
          <div style={enter(3)} className="flex flex-col gap-3 sm:flex-row">
            <a href="#attente" className={`${btn} min-h-[52px] bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] sm:min-h-12`}>Rejoindre la liste d’attente<Arrow /></a>
            <a href="#agent" className={`${btn} min-h-[52px] border border-[var(--border-control)] bg-[color-mix(in_srgb,var(--surface)_70%,transparent)] text-[var(--text-strong)] backdrop-blur hover:bg-[var(--surface)] sm:min-h-12`}>Voir un agent au travail</a>
          </div>
          <ul aria-label="Garanties" style={enter(4)} className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-sm text-[var(--text-muted)]">
            {['Hébergé dans l’UE', 'Validation humaine intégrée', 'Journal de chaque action'].map((x) => <li key={x} className="inline-flex items-center gap-2 before:size-1.5 before:rounded-full before:bg-[var(--accent)]">{x}</li>)}
          </ul>
        </div>
        {carte && (
          <aside aria-labelledby="nu-card" style={enter(5)} className="w-full max-w-[400px] rounded-2xl border border-[color-mix(in_srgb,var(--border)_70%,transparent)] bg-[color-mix(in_srgb,var(--surface)_72%,transparent)] p-4 shadow-[var(--shadow-popover)] backdrop-blur-xl sm:p-5 lg:justify-self-end">
            <div className="flex items-center justify-between font-mono text-[13px] text-[var(--text-muted)]">Tâche #2207
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-sans text-xs font-semibold ${done ? 'bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]' : 'bg-[var(--tint-amber-bg)] text-[var(--tint-amber-fg)]'}`}><span className="size-1.5 rounded-full bg-current" />{done ? 'Terminée' : 'En cours'}</span>
            </div>
            <h2 id="nu-card" className="m-0 mt-3 text-[17px] font-semibold text-[var(--text-strong)]">Rapprocher les factures d’octobre</h2>
            <p className="m-0 mt-1 text-sm text-[var(--text-muted)]">Boîte achats · 214 factures fournisseurs</p>
            <ol className="m-0 mt-4 grid list-none gap-0 p-0">
              {STEPS.map(([s, tm], i) => (
                <li key={s} className={`grid min-h-11 grid-cols-[20px_1fr_auto] items-center gap-3 text-sm transition-colors ${i < n ? 'text-[var(--text-strong)]' : 'text-[var(--text-muted)]'}`}>
                  <span aria-hidden="true" className={`grid size-5 place-items-center rounded-full border text-[10px] transition-all duration-500 ${i < n ? 'scale-100 border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]' : i === n && !done ? 'animate-pulse border-[var(--accent)]' : 'border-[var(--border-control)]'}`} style={{ transitionTimingFunction: SPRING }}>{i < n ? '✓' : ''}</span>
                  {s}<time className="font-mono text-xs text-[var(--text-muted)]">{tm}</time>
                </li>
              ))}
            </ol>
            <p className="m-0 mt-3 flex justify-between border-t border-[var(--border)] pt-3 text-[13px] text-[var(--text-muted)]">Agent Comptes fournisseurs<b className="font-semibold text-[var(--text-strong)]">6 h économisées</b></p>
          </aside>
        )}
      </div>
      <button type="button" aria-pressed={paused} onClick={() => setPaused((p) => !p)} className={`absolute bottom-4 right-4 grid size-11 place-items-center rounded-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] text-[var(--text-strong)] backdrop-blur sm:bottom-6 sm:right-6 ${ring}`}>
        <span className="sr-only">{paused ? 'Relancer le fond animé' : 'Mettre le fond en pause'}</span>
        {paused ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.2" /><rect x="14" y="5" width="4" height="14" rx="1.2" /></svg>}
      </button>
    </section>
  );
}

/* ——— Barre compacte, visible quand le hero est passé ——— */
export function Dock({ count, heroRef }) {
  const [on, setOn] = useState(false);
  useEffect(() => { const el = heroRef.current; if (!el) return; const io = new IntersectionObserver(([e]) => setOn(!e.isIntersecting), { rootMargin: '-120px 0px 0px 0px' }); io.observe(el); return () => io.disconnect(); }, [heroRef]);
  return (
    <div aria-hidden={!on} className={`fixed inset-x-3 top-3 z-20 flex h-[52px] items-center justify-between gap-3 whitespace-nowrap rounded-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_82%,transparent)] pl-2.5 pr-1.5 shadow-[var(--shadow-popover)] backdrop-blur-xl transition-[transform,opacity] duration-[640ms] motion-reduce:transition-none sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 ${on ? 'opacity-100' : '-translate-y-[88px] opacity-0 sm:-translate-y-[88px]'}`} style={{ transitionTimingFunction: SPRING }}>
      <a href="#accueil" tabIndex={on ? 0 : -1} className="inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--text-strong)] no-underline"><NueeIcon /><span className="hidden sm:inline">Nuée</span></a>
      <span className="inline-flex items-center gap-2 text-[13px] text-[var(--text-muted)] tabular-nums sm:text-sm"><span className="size-2 rounded-full bg-[var(--up)]" />Bêta privée · <b className="font-semibold text-[var(--text-strong)]">{fmt(count)}</b> équipes en attente</span>
      <a href="#attente" tabIndex={on ? 0 : -1} className="inline-flex h-10 items-center rounded-full bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-fg)] no-underline">Rejoindre</a>
    </div>
  );
}

/* ——— 02 · Fil d’activité d’agent : scénario rejoué, validation humaine au milieu ——— */
const SCENARIO = {
  plan: ['Lire la facture reçue', 'Retrouver le bon de commande', 'Contrôler quantités et prix', 'Passer l’écriture et prévenir le fournisseur'],
  steps: [
    { t: 'think', dur: 1500, p: 0, h: 'Comprendre la pièce', text: 'Une facture de Papeterie Lemaire est arrivée dans la boîte achats. Je la lis, puis je cherche le bon de commande qu’elle cite.' },
    { t: 'tool', dur: 520, p: 0, name: 'factures.lire', args: { source: 'achats@garance.fr', piece: 'F-88213.pdf' } },
    { t: 'result', dur: 260, pd: 0, title: 'Facture lue', kv: [['Fournisseur', 'Papeterie Lemaire'], ['Référence', 'BC-2026-1187'], ['Montant TTC', '1 284,00 €']] },
    { t: 'tool', dur: 640, p: 1, name: 'erp.commandes.trouver', args: { reference: 'BC-2026-1187' } },
    { t: 'result', dur: 260, pd: 1, title: 'Commande trouvée', kv: [['Commandé', '40 cartons de papier A4'], ['Montant prévu', '1 242,00 €']] },
    { t: 'think', dur: 1300, p: 2, h: 'Repérer l’écart', text: 'La facture dépasse la commande de 42 € : des frais de livraison. La règle de l’équipe demande une validation au-delà de 20 €.' },
    { t: 'ask', p: 2, title: 'Accepter l’écart de 42,00 € ?', kv: [['Commande', '1 242,00 €'], ['Facture', '1 284,00 €'], ['Motif', 'Frais de livraison']],
      ok: [{ t: 'tool', dur: 560, p: 3, name: 'erp.ecritures.passer', args: { piece: 'F-88213', montant: 1284 } }, { t: 'result', dur: 240, pd: 2, title: 'Écriture passée', note: 'Paiement prévu le 5 décembre.' },
        { t: 'tool', dur: 420, p: 3, name: 'email.envoyer', args: { a: 'compta@lemaire.fr', modele: 'accuse_reception' } }, { t: 'result', dur: 220, pd: 3, title: 'Accusé envoyé', note: 'Le fournisseur sait que sa facture est acceptée.' },
        { t: 'final', dur: 2200, text: 'Facture F-88213 rapprochée et enregistrée. L’écart de livraison est validé et noté pour les prochaines commandes.', tags: ['Écriture passée', 'Fournisseur prévenu'] }],
      ko: [{ t: 'tool', dur: 460, name: 'email.envoyer', args: { a: 'compta@lemaire.fr', modele: 'demande_avoir', montant: 42 } }, { t: 'result', dur: 220, title: 'Demande d’avoir envoyée', note: 'Relance automatique dans 5 jours.' },
        { t: 'final', dur: 2000, text: 'Facture mise en attente : un avoir de 42 € est demandé. Je vous préviens à sa réception.', tags: ['Facture en attente'] }] },
  ],
};
const KIND = { think: 'Réflexion', tool: 'Outil', result: 'Résultat', ask: 'Validation', final: 'Compte rendu' };
export function AgentFeed({ validation = true, autoValidation = true, speed: speed0 = 1 }) {
  const host = useRef(null), list = useRef(null), vis = useInView(host);
  const [log, setLog] = useState([]), [planState, setPlan] = useState(SCENARIO.plan.map(() => 'todo')), [queue, setQueue] = useState(SCENARIO.steps), [i, setI] = useState(0), [e, setE] = useState(0), [speed, setSpeed] = useState(speed0), [ended, setEnded] = useState(false), [run, setRun] = useState(0), [sr, setSr] = useState('');
  const reset = useCallback(() => { setLog([]); setPlan(SCENARIO.plan.map(() => 'todo')); setQueue(validation ? SCENARIO.steps : SCENARIO.steps.flatMap((s) => (s.t === 'ask' ? s.ok : [s]))); setI(0); setE(0); setEnded(false); setRun((r) => r + 1); }, [validation]);
  useEffect(reset, [reset]);
  const cur = queue[i];
  const decide = useCallback((ok) => {
    if (!cur || cur.t !== 'ask') return;
    setLog((l) => [...l, { ...cur, decided: ok ? 'Approuvé par vous' : 'Refusé par vous' }]);
    setQueue((q) => [...q.slice(0, i + 1), ...(ok ? cur.ok : cur.ko), ...q.slice(i + 1)]);
    setSr(ok ? 'Approuvé. L’agent reprend.' : 'Refusé. L’agent adapte sa réponse.');
    setI((x) => x + 1); setE(0);
  }, [cur, i]);
  useEffect(() => {
    if (!vis || ended) return;
    if (!cur) { setEnded(true); const id = setTimeout(reset, 4000); return () => clearTimeout(id); }
    if (cur.p != null) setPlan((p) => p.map((v, k) => (k === cur.p && v === 'todo' ? 'active' : v)));
    if (cur.t === 'ask') { if (!autoValidation) return; const id = setTimeout(() => decide(true), 7000); return () => clearTimeout(id); }
    const dur = reducedNow() ? 0 : cur.dur / speed, t0 = performance.now(); let raf = 0;
    const tick = () => {
      const k = Math.min(1, (performance.now() - t0) / Math.max(1, dur)); setE(k);
      if (k < 1) { raf = requestAnimationFrame(tick); return; }
      setLog((l) => [...l, cur]); if (cur.pd != null) setPlan((p) => p.map((v, j) => (j === cur.pd ? 'done' : v)));
      if (cur.t === 'tool') setSr(`${cur.name} : réussi`);
      setI((x) => x + 1); setE(0);
    };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [cur, vis, speed, ended, autoValidation, decide, reset, run]);
  useLayoutEffect(() => { const l = list.current; if (l) l.scrollTo({ top: l.scrollHeight, behavior: reducedNow() ? 'auto' : 'smooth' }); }, [log.length, i]);
  const Step = ({ s, live }) => {
    const shown = s.text ? s.text.slice(0, Math.ceil(s.text.length * (live ? e : 1))) : '';
    return (
      <li className="relative grid grid-cols-[24px_1fr] gap-3 pb-5 before:absolute before:bottom-0 before:left-[11px] before:top-7 before:w-px before:bg-[var(--border)] last:before:hidden">
        <span aria-hidden="true" className={`mt-0.5 grid size-6 place-items-center rounded-full border text-[11px] ${live ? 'animate-pulse border-[var(--accent)]' : s.t === 'ask' && !s.decided ? 'border-[var(--warn)]' : 'border-[var(--tint-green-border)] bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]'}`}>{live ? '' : '✓'}</span>
        <div className="min-w-0">
          <p className="m-0 flex flex-wrap items-center gap-2 text-[15px]"><span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--text-muted)]">{KIND[s.t]}</span>
            <span className="font-medium text-[var(--text-strong)]">{s.t === 'tool' ? <code className="font-mono text-sm">{s.name}</code> : s.h || s.title || 'Compte rendu'}</span>
            {live && <span className="rounded-full bg-[var(--accent-subtle)] px-2 text-xs font-medium text-[var(--text-strong)]">{s.t === 'ask' ? 'En attente' : 'En cours'}</span>}</p>
          {s.t === 'think' && <p className="m-0 mt-1 text-sm text-[var(--text-muted)]">{shown}</p>}
          {s.t === 'tool' && <pre className="m-0 mt-2 overflow-x-auto rounded-lg bg-[var(--raised)] p-3 font-mono text-xs text-[var(--text)]">{JSON.stringify(s.args, null, 2)}</pre>}
          {s.kv && <dl className="m-0 mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg bg-[var(--raised)] p-3 text-sm">{s.kv.map(([k, v]) => <Fragment key={k}><dt className="text-[var(--text-muted)]">{k}</dt><dd className="m-0 text-[var(--text-strong)]">{v}</dd></Fragment>)}</dl>}
          {s.note && <p className="m-0 mt-1 text-sm text-[var(--text)]">{s.note}</p>}
          {s.t === 'ask' && (s.decided ? <p className="m-0 mt-2 text-sm font-medium text-[var(--text-strong)]">{s.decided}</p> : live && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => decide(false)} className={`min-h-11 rounded-lg border border-[var(--border-control)] px-4 text-sm font-medium text-[var(--text-strong)] hover:bg-[var(--state-hover)] ${ring}`}>Refuser</button>
              <button type="button" onClick={() => decide(true)} className={`min-h-11 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] ${ring}`}>Approuver</button>
              <span className="text-xs text-[var(--text-muted)]">Rien n’est engagé tant que vous n’avez pas répondu.</span>
            </div>))}
          {s.t === 'final' && <><p className="m-0 mt-1 text-[15px] text-[var(--text-strong)]">{shown}</p>{!live && <p className="m-0 mt-2 flex flex-wrap gap-2">{s.tags.map((x) => <span key={x} className="rounded-full bg-[var(--tint-green-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--tint-green-fg)]">{x}</span>)}</p>}</>}
        </div>
      </li>
    );
  };
  return (
    <section ref={host} aria-labelledby="nu-af" className="grid h-[min(600px,78svh)] grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] lg:h-[640px]">
      <header className="flex items-center justify-between gap-3 p-4 sm:px-6">
        <div className="flex items-center gap-3"><NueeIcon className="size-9" /><div><h3 id="nu-af" className="m-0 text-[15px] font-semibold text-[var(--text-strong)]">Agent Comptes fournisseurs</h3><p className="m-0 text-[13px] text-[var(--text-muted)]">Nuée · Atelier Garance, achats</p></div></div>
        <p className="m-0 inline-flex flex-none items-center gap-2 whitespace-nowrap rounded-full border border-[var(--border)] px-3 py-1 text-[13px] font-medium text-[var(--text-strong)]"><span className={`size-2 rounded-full ${ended ? 'bg-[var(--text-muted)]' : 'bg-[var(--up)]'}`} />{ended ? 'Tâche terminée' : 'En cours'}</p>
      </header>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-y border-[var(--border)] bg-[var(--raised)] px-4 py-2 text-[13px] sm:px-6"><span className="font-mono uppercase tracking-[0.06em] text-[var(--text-muted)]">Tâche</span><b className="text-[var(--text-strong)]">Facture F-88213</b><span className="font-mono text-[var(--text-muted)]">Papeterie Lemaire</span><span className="rounded-full border border-[var(--border)] px-2">Rapprochement</span></div>
      <ol ref={list} role="log" aria-label="Activité de l’agent" tabIndex={0} className={`m-0 list-none overflow-y-auto p-4 sm:p-6 ${ring}`}>
        <li className="relative grid grid-cols-[24px_1fr] gap-3 pb-5 before:absolute before:bottom-0 before:left-[11px] before:top-7 before:w-px before:bg-[var(--border)]">
          <span aria-hidden="true" className="mt-0.5 grid size-6 place-items-center rounded-full border border-[var(--tint-green-border)] bg-[var(--tint-green-bg)] text-[11px] text-[var(--tint-green-fg)]">✓</span>
          <div><p className="m-0 text-[15px]"><span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--text-muted)]">Plan</span> <span className="font-medium text-[var(--text-strong)]">Plan d’action</span></p>
            <ol className="m-0 mt-2 grid list-none gap-1.5 p-0 text-sm">{SCENARIO.plan.map((x, k) => <li key={x} className={`flex items-center gap-2 ${planState[k] === 'done' ? 'text-[var(--text-muted)] line-through' : planState[k] === 'active' ? 'text-[var(--text-strong)]' : 'text-[var(--text-muted)]'}`}><span aria-hidden="true" className={`size-3.5 rounded-full border ${planState[k] === 'done' ? 'border-[var(--accent)] bg-[var(--accent)]' : planState[k] === 'active' ? 'border-[3px] border-[var(--accent)]' : 'border-[var(--border-control)]'}`} />{x}</li>)}</ol></div>
        </li>
        {log.map((s, k) => <Step key={k} s={s} />)}
        {cur && <Step s={cur} live />}
        {ended && <li className="py-2 text-center font-mono text-xs text-[var(--text-muted)]">Fin de la tâche · reprise dans un instant</li>}
      </ol>
      <footer className="flex items-center gap-3 border-t border-[var(--border)] px-4 py-3 sm:px-6">
        <button type="button" onClick={reset} aria-label="Rejouer la tâche" className={`grid size-11 place-items-center rounded-full text-[var(--text-strong)] hover:bg-[var(--state-hover)] ${ring}`}>↻</button>
        <div role="group" aria-label="Vitesse de lecture" className="flex rounded-full border border-[var(--border)] bg-[var(--raised)] p-1">{[0.5, 1, 2, 4].map((v) => <button key={v} type="button" aria-pressed={speed === v} onClick={() => setSpeed(v)} className={`min-h-9 min-w-11 rounded-full font-mono text-xs ${speed === v ? 'bg-[var(--surface)] text-[var(--text-strong)]' : 'text-[var(--text-muted)]'} ${ring}`}>{String(v).replace('.', ',')}×</button>)}</div>
      </footer>
      <p role="status" aria-live="polite" className="sr-only">{sr}</p>
    </section>
  );
}

/* ——— 03 · Flux d’intégrations : liens SVG calculés depuis la mise en page, paquets en animateMotion ——— */
const APPS_IN = [['Messagerie', 'Boîte achats', 'violet', 'M3.5 7.5l8.5 6 8.5-6M3 5.5h18v13H3z'], ['Commandes', 'Bons de commande', 'blue', 'M4 6h2l2 10h10l2-7H7'], ['Banque', 'Relevés', 'green', 'M3.5 9.5 12 4.5l8.5 5M5.5 10v7M10 10v7M14 10v7M18.5 10v7M3.5 19.5h17'], ['Formulaires', 'Demandes', 'amber', 'M5 4h14v17H5zM8.5 10h7M8.5 13.5h7M8.5 17h4']];
const APPS_OUT = [['ERP', 'Écritures', 'blue', 'M3.5 4.5h17v15h-17zM3.5 9.5h17M9.5 9.5v10'], ['Fournisseurs', 'Relances', 'pink', 'M4 12 20 4l-4 16-4-6zM12 14 20 4'], ['Équipe', 'Validations', 'green', 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4 4v-4H6a2 2 0 0 1-2-2z'], ['Archives', 'Pièces · en pause', 'neutral', 'M3.5 5h17v4h-17zM5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4', true]];
export function IntegrationFlow() {
  const stage = useRef(null), svg = useRef(null), hub = useRef(null), apps = useRef([]), [paths, setPaths] = useState([]), [sel, setSel] = useState(null), [count, setCount] = useState(18240);
  const vis = useInView(stage), reduce = reducedNow();
  useLayoutEffect(() => {
    const measure = () => {
      const s = stage.current.getBoundingClientRect(), h = hub.current.getBoundingClientRect(), vertical = s.width < 720;
      setPaths(apps.current.map((el, i) => {
        if (!el) return null; const r = el.getBoundingClientRect(), out = i >= APPS_IN.length;
        const a = vertical ? [r.left + r.width / 2 - s.left, out ? r.top - s.top : r.bottom - s.top] : [out ? r.left - s.left : r.right - s.left, r.top + r.height / 2 - s.top];
        const b = vertical ? [h.left + h.width / 2 - s.left, out ? h.bottom - s.top : h.top - s.top] : [out ? h.right - s.left : h.left - s.left, h.top + h.height / 2 - s.top];
        const [p, q] = out ? [b, a] : [a, b], m = vertical ? `C${p[0]} ${(p[1] + q[1]) / 2} ${q[0]} ${(p[1] + q[1]) / 2}` : `C${(p[0] + q[0]) / 2} ${p[1]} ${(p[0] + q[0]) / 2} ${q[1]}`;
        return `M${p[0]} ${p[1]} ${m} ${q[0]} ${q[1]}`;
      }));
    };
    measure(); const ro = new ResizeObserver(measure); ro.observe(stage.current); return () => ro.disconnect();
  }, []);
  useEffect(() => { const s = svg.current; if (!s?.pauseAnimations) return; vis && !reduce ? s.unpauseAnimations() : s.pauseAnimations(); }, [vis, reduce, paths]);
  useEffect(() => { if (!vis || reduce) return; const id = setInterval(() => setCount((c) => c + 3 + Math.floor(Math.random() * 22)), 1400); return () => clearInterval(id); }, [vis, reduce]);
  const all = [...APPS_IN, ...APPS_OUT];
  const tint = (t) => ({ background: `var(--tint-${t}-bg)`, color: `var(--tint-${t}-fg)`, borderColor: `var(--tint-${t}-border)` });
  const App = ([name, sub, t, d, paused], i) => (
    <li key={name}><button type="button" ref={(el) => (apps.current[i] = el)} aria-pressed={sel === i} onClick={() => setSel(sel === i ? null : i)}
      className={`flex w-full items-center gap-3 rounded-xl border bg-[var(--surface)] p-2 text-left transition-[border-color,transform] duration-300 hover:-translate-y-0.5 max-md:flex-col max-md:border-0 max-md:bg-transparent max-md:p-0 max-md:text-center md:h-14 md:w-[200px] md:pr-4 ${sel === i ? 'border-[var(--accent)]' : 'border-[var(--border)]'} ${ring}`}>
      <span aria-hidden="true" className="grid size-10 flex-none place-items-center rounded-lg border max-md:size-12" style={tint(t)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg></span>
      <span className="grid text-[13px] font-semibold leading-tight text-[var(--text-strong)] md:text-sm">{name}<small className="hidden text-xs font-normal text-[var(--text-muted)] md:block">{sub}</small>{paused && <span className="sr-only">, en pause</span>}</span>
    </button></li>
  );
  return (
    <section id="integrations" aria-labelledby="nu-fx" className="scroll-mt-6 border-y border-[var(--border)] bg-[var(--surface)] px-4 py-[72px] sm:px-[clamp(16px,4vw,56px)] sm:py-[clamp(80px,10vw,144px)]">
      <header className="mx-auto grid max-w-[44rem] justify-items-center gap-4 text-center"><Eyebrow n="03">Intégrations</Eyebrow>
        <h2 id="nu-fx" className="m-0 text-[clamp(1.75rem,1.15rem+2.3vw,3rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[var(--text-strong)] [text-wrap:balance]">Vos outils restent en place. Les agents circulent entre eux.</h2>
        <p className="m-0 max-w-[34rem] text-base leading-7 text-[var(--text-muted)] sm:text-lg">Nuée se branche en lecture puis en écriture, outil par outil. Rien à migrer : les agents travaillent là où vos équipes travaillent déjà.</p></header>
      <div ref={stage} className="relative mx-auto mt-12 grid max-w-[1120px] items-center gap-10 md:mt-16 md:grid-cols-[minmax(200px,1fr)_minmax(240px,1.4fr)_minmax(200px,1fr)] md:gap-0">
        <svg ref={svg} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full overflow-visible">
          {paths.map((d, i) => d && (
            <g key={i}>
              <path d={d} fill="none" stroke="var(--border-strong)" strokeOpacity={all[i][4] ? 0.5 : 0.35} strokeWidth="1.25" strokeDasharray={all[i][4] ? '3 5' : undefined} />
              {!all[i][4] && !reduce && [0, 1].map((k) => <circle key={k} r="3" fill="var(--accent)" visibility="hidden"><set attributeName="visibility" to="visible" begin={`${k * 1.1 + i * 0.17}s`} /><animateMotion dur={`${2.2 + (i % 3) * 0.4}s`} begin={`${k * 1.1 + i * 0.17}s`} repeatCount="indefinite" path={d} /></circle>)}
            </g>
          ))}
        </svg>
        <ul aria-label="Sources" className="relative m-0 grid list-none grid-cols-4 gap-2 p-0 md:grid-cols-1 md:justify-items-end md:gap-4">{APPS_IN.map((a, i) => App(a, i))}</ul>
        <div ref={hub} className="relative z-[1] mx-auto grid justify-items-center gap-2 text-center">
          <span className="grid size-24 place-items-center rounded-3xl bg-[var(--accent)] text-[var(--accent-fg)] shadow-[0_0_0_8px_var(--accent-subtle)] md:size-28"><svg width="44" height="44" viewBox="22 22 56 56" aria-hidden="true"><circle cx="50" cy="50" r="12" fill="currentColor" /><circle cx="27" cy="38" r="5" fill="currentColor" /><circle cx="72" cy="31" r="4.5" fill="currentColor" /><circle cx="66" cy="74" r="6" fill="currentColor" opacity=".7" /><circle cx="29" cy="70" r="3.5" fill="currentColor" /></svg></span>
          <p className="m-0 font-semibold text-[var(--text-strong)]">Nuée</p><p className="m-0 text-[13px] text-[var(--text-muted)]"><span className="text-[var(--text-strong)] tabular-nums">{fmt(count)}</span> actions exécutées</p>
        </div>
        <ul aria-label="Destinations" className="relative m-0 grid list-none grid-cols-4 gap-2 p-0 md:grid-cols-1 md:justify-items-start md:gap-4">{APPS_OUT.map((a, i) => App(a, i + APPS_IN.length))}</ul>
      </div>
      <p role="status" aria-live="polite" className="mx-auto mt-10 max-w-[560px] rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-center text-sm text-[var(--text-muted)]">
        {sel == null ? '7 flux actifs, 1 en pause. Touchez une app pour suivre son flux.' : `${all[sel][0]} · ${all[sel][1]}${all[sel][4] ? ' : synchronisation en pause pendant la clôture.' : ' : flux actif, données synchronisées en continu.'}`}
      </p>
    </section>
  );
}

/* ——— 04 · Compteurs à l’entrée ——— */
function Counter({ to, decimals = 0, prefix = '', suffix = '', run, delay }) {
  const [v, setV] = useState(reducedNow() ? to : 0);
  useEffect(() => {
    if (!run || reducedNow()) { if (reducedNow()) setV(to); return; }
    let raf = 0; const t0 = performance.now() + delay, D = 1800;
    const tick = (now) => { const k = Math.max(0, Math.min(1, (now - t0) / D)); setV(to * (1 - Math.pow(2, -10 * k))); if (k < 1) raf = requestAnimationFrame(tick); else setV(to); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [run, to, delay]);
  return <><span aria-hidden="true">{prefix}{v.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}<span className="ml-[.06em] text-[.5em] font-medium tracking-[-0.01em] text-[var(--text-muted)]">{suffix}</span></span><span className="sr-only">{prefix}{to.toLocaleString('fr-FR')} {suffix}</span></>;
}
const STATS = [['Tâches terminées sans aide', 91, 0, '', '%', 'Le reste arrive chez vous avec son contexte.'], ['Heures rendues par semaine', 14.5, 1, '', 'h', 'Par personne, en moyenne sur la période.'], ['Délai de traitement', 38, 0, '−', '%', 'Entre la réception et la clôture d’une tâche.'], ['Actions annulées', 0.4, 1, '', '%', 'Chaque action reste réversible pendant 24 h.']];
export function Stats() {
  const ref = useRef(null), seen = useInView(ref, '0px 0px -20% 0px'), [run, setRun] = useState(false);
  useEffect(() => { if (seen) setRun(true); }, [seen]);
  return (
    <section id="chiffres" ref={ref} aria-labelledby="nu-ce" className="mx-auto grid max-w-[1200px] scroll-mt-6 gap-8 px-4 py-[72px] sm:gap-14 sm:px-[clamp(16px,4vw,56px)] sm:py-[clamp(80px,10vw,144px)]">
      <div className="grid items-end gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-x-12"><div className="lg:col-span-2"><Eyebrow n="04">Résultats de la bêta</Eyebrow></div>
        <h2 id="nu-ce" className="m-0 max-w-[18ch] text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--text-strong)] sm:text-[clamp(28px,2vw+14px,44px)]">Trois mois de bêta, quarante équipes opérations.</h2>
        <p className="m-0 text-[15px] leading-[22px] text-[var(--text-muted)] sm:text-base">Mesures relevées chez les équipes pilotes entre août et octobre, sur leurs vraies tâches.</p></div>
      <dl className="m-0 grid grid-cols-2 gap-y-8 lg:grid-cols-4">
        {STATS.map(([l, to, d, pre, suf, note], i) => (
          <div key={l} className={`relative flex flex-col pr-3 pt-4 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[var(--border)] after:absolute after:inset-x-0 after:-top-px after:h-0.5 after:origin-left after:bg-[var(--accent)] after:transition-transform after:duration-[1800ms] sm:pr-6 sm:pt-6 ${i % 2 ? 'border-l border-[var(--border)] pl-4 sm:pl-6' : ''} ${i === 2 ? 'lg:border-l lg:pl-6' : ''} ${run ? 'after:scale-x-100' : 'after:scale-x-0'}`} style={{ transitionDelay: `${i * 120}ms` }}>
            <dt className="order-first min-h-8 font-mono text-[13px] font-medium uppercase leading-4 tracking-[0.02em] text-[var(--text-muted)] sm:tracking-[0.04em]">{l}</dt>
            <dd className="m-0 mt-2 text-[40px] font-semibold leading-none tracking-[-0.045em] text-[var(--text-strong)] tabular-nums sm:mt-4 sm:text-[clamp(40px,2.6vw+18px,60px)]"><Counter to={to} decimals={d} prefix={pre} suffix={suf} run={run} delay={i * 120} /></dd>
            <dd className="m-0 mt-3 max-w-[28ch] text-sm leading-5 sm:text-[15px] sm:leading-[22px]">{note}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ——— 05 · Liste d’attente vivante ——— */
export function RollingNumber({ value, className = '' }) {
  const s = fmt(value).split(''), [ready, setReady] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setReady(true)); return () => cancelAnimationFrame(id); }, []);
  let rank = s.filter((c) => /\d/.test(c)).length;
  return (
    <span aria-hidden="true" className={`inline-flex tabular-nums ${className}`}>
      {s.map((c, i) => {
        if (!/\d/.test(c)) return <span key={'s' + i} className="inline-block w-[.25em]" />;
        rank--;
        return (
          <span key={'d' + rank} className="inline-block h-[1.08em] overflow-hidden">
            <span className="flex flex-col" style={{ transform: `translateY(${-c * 10}%)`, transition: ready && !reducedNow() ? `transform 900ms ${SPRING} ${rank * 70}ms` : 'none' }}>
              {'0123456789'.split('').map((d) => <span key={d} className="block h-[1.08em] text-center leading-[1.08em]">{d}</span>)}
            </span>
          </span>
        );
      })}
    </span>
  );
}
const NAMES = [['Margaux', 'Lyon'], ['Thomas', 'Lille'], ['Inès', 'Bordeaux'], ['Karim', 'Marseille'], ['Léa', 'Nantes'], ['Hugo', 'Strasbourg']];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const TINTS = ['neutral', 'blue', 'green', 'violet', 'amber', 'pink'];
export function Waitlist({ count, setCount }) {
  const ref = useRef(null), vis = useInView(ref), input = useRef(null), doneRef = useRef(null);
  const [state, setState] = useState('form'), [err, setErr] = useState(''), [email, setEmail] = useState(''), [team, setTeam] = useState('1-5'), [pos, setPos] = useState(0), [copied, setCopied] = useState(''), [who, setWho] = useState(['Margaux', 'Lyon', 'il y a 2 min']), [faces, setFaces] = useState(['CR', 'TB', 'AM', 'LG', 'IS']), [live, setLive] = useState('');
  useEffect(() => {
    if (!vis || reducedNow()) return;
    let n = 0; const id = setInterval(() => { const p = NAMES[n++ % NAMES.length]; setCount((c) => c + 1); setWho([p[0], p[1], 'à l’instant']); setFaces((f) => [p[0][0] + p[1][0].toUpperCase(), ...f].slice(0, 5)); }, 8000);
    return () => clearInterval(id);
  }, [vis, setCount]);
  const submit = (e) => {
    e.preventDefault(); const v = email.trim();
    const bad = !v ? 'Indiquez votre e-mail professionnel pour réserver une place.' : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? 'Cette adresse semble incomplète, par exemple prenom@entreprise.fr.' : '';
    if (bad) { setErr(bad); input.current?.focus(); return; }
    setErr(''); setState('loading'); setLive('Réservation en cours…');
    setTimeout(() => { const p = count + 1; setCount(p); setPos(p); setState('done'); setLive(`Place réservée : numéro ${fmt(p)}.`); requestAnimationFrame(() => doneRef.current?.focus({ preventScroll: true })); }, reducedNow() ? 300 : 1100);
  };
  const wave = Math.max(1, Math.ceil(pos / 400)), link = `nuee.app/i/${(email.split('@')[0] || 'equipe').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}-${(pos % 9973).toString(36)}`;
  const copy = () => { const ok = (m) => { setCopied(m); setLive(m); setTimeout(() => setCopied(''), 2000); }; navigator.clipboard?.writeText('https://' + link).then(() => ok('Lien copié'), () => ok('Lien prêt')) ?? ok('Lien prêt'); };
  const field = 'h-[52px] min-w-0 flex-1 rounded-xl border bg-[var(--bg)] px-4 text-base text-[var(--text-strong)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--text-disabled)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_22%,transparent)]';
  return (
    <section id="attente" ref={ref} aria-labelledby="nu-wl" className="relative isolate scroll-mt-6 px-3 pb-[72px] pt-14 sm:px-[clamp(16px,4vw,56px)] sm:pb-[clamp(80px,10vw,144px)] sm:pt-[clamp(64px,8vw,120px)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--accent)_18%,transparent),transparent)] bg-[length:min(1100px,120vw)_560px] bg-[position:50%_55%] bg-no-repeat" />
      <div className="mx-auto grid max-w-[760px] gap-4 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 py-6 sm:gap-5 sm:rounded-3xl sm:p-[clamp(24px,4vw,48px)]">
        <div className="flex flex-wrap items-center justify-between gap-4"><Eyebrow n="05">Liste d’attente</Eyebrow>
          <p className="m-0 inline-flex min-h-7 items-center gap-2 overflow-hidden rounded-full bg-[var(--raised)] px-3 text-[13px] text-[var(--text-muted)]"><span className="size-2 flex-none rounded-full bg-[var(--up)]" /><span key={who.join()} className="motion-safe:animate-[nu-in_.5s_cubic-bezier(.16,1,.3,1)]">{who[0]}, {who[1]} · {who[2]}</span></p></div>
        <h2 id="nu-wl" className="m-0 text-[clamp(1.875rem,1.2rem+2.4vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-[var(--text-strong)] [text-wrap:balance]">Rejoignez les <RollingNumber value={count} className="align-top text-[var(--accent)]" /><span className="sr-only">{fmt(count)}</span> équipes en attente.</h2>
        <p className="m-0 max-w-[56ch] text-base leading-relaxed text-[var(--text-muted)] sm:text-[17px]">Nous ouvrons Nuée par vagues de 400 équipes, une par mois dès janvier. Chaque invitation acceptée vous fait gagner cent places.</p>
        {state !== 'done' ? (
          <form onSubmit={submit} noValidate className="grid gap-5">
            <div className="grid gap-2">
              <label htmlFor="nu-email" className="text-sm font-medium text-[var(--text-strong)]">E-mail professionnel</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input ref={input} id="nu-email" type="email" inputMode="email" autoComplete="email" placeholder="prenom@entreprise.fr" value={email} onChange={(e) => { setEmail(e.target.value); setErr(''); }} aria-invalid={!!err} aria-describedby="nu-hint nu-err" className={`${field} ${err ? 'border-[var(--down)]' : 'border-[var(--border-control)]'}`} />
                <button type="submit" aria-busy={state === 'loading'} disabled={state === 'loading'} className={`relative inline-flex h-14 items-center justify-center whitespace-nowrap rounded-xl bg-[var(--accent)] px-6 font-semibold text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] sm:h-[52px] ${ring}`}>
                  <span className={state === 'loading' ? 'opacity-0' : ''}>Réserver ma place</span>{state === 'loading' && <span aria-hidden="true" className="absolute size-5 animate-spin rounded-full border-2 border-[color-mix(in_srgb,var(--accent-fg)_30%,transparent)] border-t-[var(--accent-fg)]" />}
                </button>
              </div>
              <p id="nu-hint" className="m-0 text-sm text-[var(--text-muted)]">Un seul e-mail à l’ouverture de votre vague. Aucune publicité.</p>
              <p id="nu-err" role="alert" className="m-0 text-sm font-medium text-[var(--down)]">{err}</p>
            </div>
            <fieldset className="m-0 grid gap-2 border-0 p-0"><legend className="mb-2 p-0 text-sm font-medium text-[var(--text-strong)]">Taille de l’équipe opérations</legend>
              <div className="flex flex-wrap gap-2">{[['1-5', '1 à 5'], ['6-20', '6 à 20'], ['21-100', '21 à 100'], ['100+', 'Plus de 100']].map(([v, l]) => (
                <label key={v} className="relative"><input type="radio" name="nu-team" value={v} checked={team === v} onChange={() => setTeam(v)} className="peer absolute inset-0 m-0 cursor-pointer opacity-0" />
                  <span className="inline-flex h-10 items-center rounded-full border border-[var(--border)] px-4 text-sm peer-checked:border-[var(--accent)] peer-checked:bg-[var(--accent-subtle)] peer-checked:font-medium peer-checked:text-[var(--text-strong)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-[var(--focus-ring)]">{l}</span></label>))}</div>
            </fieldset>
          </form>
        ) : (
          <div ref={doneRef} tabIndex={-1} aria-labelledby="nu-pos" className="grid gap-5 outline-none motion-safe:animate-[nu-in_.6s_cubic-bezier(.16,1,.3,1)]">
            <p className="m-0 inline-flex h-8 items-center gap-2 justify-self-start rounded-full bg-[var(--tint-green-bg)] px-3 text-sm font-semibold text-[var(--tint-green-fg)]">✓ Place réservée</p>
            <p id="nu-pos" className="m-0 font-mono text-[13px] uppercase tracking-[0.04em] text-[var(--text-muted)]">Votre place dans la file</p>
            <p className="-mt-2 mb-0 flex items-baseline text-[64px] font-semibold leading-none tracking-[-0.05em] text-[var(--text-strong)] sm:text-[clamp(56px,6vw+24px,96px)]"><span className="mr-[.1em] text-[.42em] text-[var(--text-muted)]">n°</span><RollingNumber value={pos} /><span className="sr-only">numéro {fmt(pos)}</span></p>
            <div className="grid gap-2"><div aria-hidden="true" className="flex h-2 gap-1">{Array.from({ length: Math.min(12, wave + 2) }, (_, k) => <b key={k} className={`flex-1 rounded-full ${k + 1 < wave ? 'bg-[var(--accent-subtle-border)]' : k + 1 === wave ? 'bg-[var(--accent)]' : 'bg-[var(--raised)]'}`} />)}</div>
              <p className="m-0 flex flex-col justify-between gap-0.5 text-sm text-[var(--text-muted)] sm:flex-row"><span className="font-medium text-[var(--text-strong)]">Vague {wave} · {MONTHS[(wave - 1) % 12]} {2027 + Math.floor((wave - 1) / 12)}</span><span>{fmt(pos - 1)} équipes devant vous</span></p></div>
            <div className="grid gap-2"><label htmlFor="nu-link" className="text-sm font-medium text-[var(--text-strong)]">Votre lien d’invitation</label>
              <div className="flex flex-col gap-2 sm:flex-row"><input id="nu-link" readOnly value={link} className={`${field} border-[var(--border-control)] bg-[var(--raised)] font-mono text-[15px]`} />
                <button type="button" onClick={copy} className={`h-14 rounded-xl border px-5 font-semibold sm:h-[52px] ${copied ? 'border-[var(--tint-green-border)] bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]' : 'border-[var(--border-control)] bg-[var(--raised)] text-[var(--text-strong)]'} ${ring}`}>{copied || 'Copier'}</button></div></div>
            <button type="button" onClick={() => { setState('form'); setEmail(''); }} className="min-h-11 justify-self-start p-0 text-sm font-medium text-[var(--text-muted)] underline underline-offset-4 hover:text-[var(--text-strong)]">Utiliser une autre adresse</button>
          </div>
        )}
        <div className="flex flex-col items-start gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:gap-4">
          <ul aria-hidden="true" className="m-0 flex list-none p-0 pl-2">{faces.map((f, k) => <li key={f + k} className="-ml-2 grid size-9 place-items-center rounded-full border-2 border-[var(--surface)] text-xs font-semibold" style={{ background: `var(--tint-${TINTS[k % 6]}-bg)`, color: `var(--tint-${TINTS[k % 6]}-fg)` }}>{f}</li>)}</ul>
          <p className="m-0 text-sm text-[var(--text-muted)]">Responsables opérations, achats et finance de PME et d’ETI européennes.</p>
        </div>
        <p aria-live="polite" className="sr-only">{live}</p>
      </div>
    </section>
  );
}

/* ——— 06 · FAQ (details / summary natifs, variante cartes) ——— */
const FAQ = [['Que peut faire un agent sans mon accord ?', 'Ce que vous avez autorisé, et rien d’autre. Vous fixez des règles par outil et par montant : au-delà, l’agent s’arrête et vous demande dans le fil, par e-mail ou sur votre messagerie d’équipe.'],
  ['Où sont mes données ?', 'Hébergées dans l’Union européenne, chiffrées au repos et en transit. Elles ne servent jamais à entraîner un modèle ; vous pouvez tout exporter ou tout effacer en un clic.'],
  ['Et si l’agent se trompe ?', 'Chaque action est journalisée avec ses arguments et reste réversible pendant 24 heures. Un bouton annule l’action et tout ce qui en découle ; l’agent retient la correction pour la suite.'],
  ['Quand pourrai-je l’utiliser ?', 'Nous ouvrons par vagues de 400 équipes, une par mois à partir de janvier. Chaque invitation acceptée vous fait gagner cent places dans la file.']];
export function Faq() {
  return (
    <section id="questions" aria-labelledby="nu-faq" className="mx-auto grid max-w-[1120px] scroll-mt-6 gap-6 px-4 pb-[72px] pt-14 [interpolate-size:allow-keywords] sm:px-[clamp(16px,4vw,56px)] sm:pb-[clamp(80px,10vw,144px)] sm:pt-[clamp(64px,8vw,120px)] md:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] md:gap-16">
      <div className="grid content-start gap-3 md:sticky md:top-8"><Eyebrow n="06">Questions</Eyebrow>
        <h2 id="nu-faq" className="m-0 text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--text-strong)] md:text-[40px]">Avant de confier une tâche</h2>
        <p className="m-0 text-[15px] text-[var(--text-muted)] md:text-base">Sécurité, contrôle, données : ce que les équipes pilotes ont demandé en premier.</p></div>
      <div className="grid gap-2">
        {FAQ.map(([q, a], i) => (
          <details key={q} name="faq-nuee" open={i === 0} className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-colors open:bg-[var(--raised)] [&::details-content]:h-0 [&::details-content]:overflow-clip [&::details-content]:transition-[height,content-visibility] [&::details-content]:duration-300 [&::details-content]:[transition-behavior:allow-discrete] open:[&::details-content]:h-auto">
            <summary className={`flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-4 py-3.5 sm:px-5 [&::-webkit-details-marker]:hidden ${ring}`}>
              <span className="text-base font-medium text-[var(--text-strong)] sm:text-[17px]">{q}</span>
              <span aria-hidden="true" className="relative size-8 flex-none rounded-full border border-[var(--border)] transition-transform duration-300 group-open:rotate-180 group-open:border-[var(--accent)] group-open:bg-[var(--accent)] group-open:text-[var(--accent-fg)]"><i className="absolute left-1/2 top-1/2 -ml-1.5 -mt-px h-[1.5px] w-3 bg-current" /><i className="absolute left-1/2 top-1/2 -ml-1.5 -mt-px h-[1.5px] w-3 rotate-90 bg-current transition-opacity group-open:opacity-0" /></span>
            </summary>
            <p className="m-0 px-4 pb-4 text-[15px] leading-6 sm:px-5 sm:pb-5 sm:pr-14 sm:text-base">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer aria-labelledby="nu-foot" className="overflow-hidden border-t border-[var(--border)] bg-[var(--surface)] px-4 pb-6 pt-14 sm:px-[clamp(16px,4vw,56px)] sm:pt-[clamp(56px,7vw,96px)]">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col items-stretch justify-between gap-6 pb-8 sm:flex-row sm:items-end sm:pb-12">
          <h2 id="nu-foot" className="m-0 max-w-[16ch] text-[clamp(2rem,1rem+3vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-[var(--text-strong)]">Gardez la décision. Laissez la saisie.</h2>
          <a href="#attente" className={`${btn} bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]`}>Rejoindre la liste d’attente</a>
        </div>
        <div className="grid grid-cols-2 gap-6 border-t border-[var(--border)] py-8 sm:grid-cols-3">
          {[['Produit', ['L’agent', 'Intégrations', 'Résultats', 'Sécurité']], ['Ressources', ['Journal des versions', 'Documentation', 'Guide de démarrage']], ['Nuée', ['Manifeste', 'Recrutement', 'Contact']]].map(([t, l]) => (
            <nav key={t} aria-label={t} className="grid content-start"><p className="m-0 mb-2 font-mono text-xs uppercase tracking-[0.04em] text-[var(--text-muted)]">{t}</p>{l.map((x) => <a key={x} href="#" className="inline-flex min-h-11 items-center text-[15px] text-[var(--text)] no-underline hover:underline sm:min-h-9">{x}</a>)}</nav>
          ))}
        </div>
        <svg viewBox="128 20 146 58" aria-hidden="true" className="mt-6 block h-auto w-full"><path d="M136.48 70V30.24H145.01L162.12 60.17V30.24H169.4V70H160.66L143.76 40.93V70ZM185.98 70.67Q181.43 70.67 178.79 67.68Q176.15 64.68 176.15 59.35V40.1H183.32V57.59Q183.32 61.34 184.56 63.1Q185.79 64.85 188.38 64.85Q191.28 64.85 192.89 62.92Q194.51 60.98 194.51 57.3V40.1H201.68V70H195.09L194.93 61.79L195.86 62.07Q195.15 66.29 192.63 68.48Q190.11 70.67 185.98 70.67ZM220.79 70.67Q216.32 70.67 213.04 68.75Q209.75 66.82 207.95 63.3Q206.16 59.77 206.16 55.05Q206.16 50.32 207.95 46.83Q209.75 43.33 213 41.38Q216.26 39.42 220.66 39.42Q224.93 39.42 228.13 41.33Q231.33 43.24 233.09 46.83Q234.84 50.41 234.84 55.44V57.04H213.59Q213.8 61 215.74 62.97Q217.67 64.94 220.88 64.94Q223.28 64.94 224.86 63.87Q226.45 62.8 227.09 60.83L234.41 61.29Q233.21 65.62 229.59 68.15Q225.97 70.67 220.79 70.67ZM213.59 52.23H227.4Q227.18 48.59 225.35 46.83Q223.52 45.07 220.66 45.07Q217.78 45.07 215.9 46.91Q214.03 48.75 213.59 52.23ZM217.62 36.87 221.05 28.99H228.24L223.2 36.87ZM252.21 70.67Q247.74 70.67 244.45 68.75Q241.17 66.82 239.37 63.3Q237.57 59.77 237.57 55.05Q237.57 50.32 239.37 46.83Q241.17 43.33 244.42 41.38Q247.67 39.42 252.08 39.42Q256.34 39.42 259.55 41.33Q262.75 43.24 264.5 46.83Q266.25 50.41 266.25 55.44V57.04H245.01Q245.22 61 247.15 62.97Q249.08 64.94 252.3 64.94Q254.7 64.94 256.28 63.87Q257.87 62.8 258.5 60.83L265.83 61.29Q264.63 65.62 261.01 68.15Q257.38 70.67 252.21 70.67ZM245.01 52.23H258.82Q258.59 48.59 256.76 46.83Q254.93 45.07 252.08 45.07Q249.2 45.07 247.32 46.91Q245.44 48.75 245.01 52.23Z" fill="var(--raised)" stroke="var(--border)" strokeWidth=".25" /></svg>
        <div className="flex flex-col justify-between gap-2 pt-6 text-[13px] text-[var(--text-muted)] sm:flex-row"><p className="m-0">© 2026 Nuée SAS (marque fictive). Agents IA pour les équipes opérations.</p>
          <nav aria-label="Informations légales" className="flex gap-5">{['Mentions légales', 'Confidentialité', 'Sous-traitants'].map((x) => <a key={x} href="#" className="inline-flex min-h-11 items-center text-inherit no-underline hover:text-[var(--text-strong)] sm:min-h-8">{x}</a>)}</nav></div>
      </div>
    </footer>
  );
}

/* ——— La page ——— */
export default function TemplateLancementIA({ titre, matiere = 'soie', force = 1, carte = true, validation = true, autoValidation = true, places = 2418 }) {
  const [count, setCount] = useState(places), hero = useRef(null);
  useEffect(() => setCount(places), [places]);
  return (
    <div id="accueil" className="relative overflow-x-clip bg-[var(--bg)] font-sans text-[var(--text)] [scroll-behavior:smooth] motion-reduce:[scroll-behavior:auto]">
      <style>{'@keyframes nu-in{from{opacity:0;transform:translateY(12px)}}'}</style>
      <a href="#nu-main" className="absolute -top-16 left-4 z-30 rounded-lg bg-[var(--accent)] px-4 py-3 font-medium text-[var(--accent-fg)] focus:top-3">Aller au contenu</a>
      <Dock count={count} heroRef={hero} />
      <main id="nu-main">
        <div ref={hero}><Hero titre={titre} matiere={matiere} force={force} carte={carte} /></div>
        <section id="agent" aria-labelledby="nu-agent" className="mx-auto grid max-w-[1280px] scroll-mt-6 items-start gap-8 px-4 py-[72px] sm:px-[clamp(16px,4vw,56px)] sm:py-[clamp(80px,10vw,144px)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-[clamp(32px,5vw,80px)]">
          <div className="grid gap-5 lg:sticky lg:top-24"><Eyebrow n="02">L’agent au travail</Eyebrow>
            <h2 id="nu-agent" className="m-0 text-[clamp(1.875rem,1.1rem+2.6vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-[var(--text-strong)] [text-wrap:balance]">Chaque étape sous vos yeux, rien d’engagé sans vous.</h2>
            <p className="m-0 text-base leading-relaxed text-[var(--text-muted)] sm:text-[17px]">L’agent planifie, lit, vérifie puis agit dans vos outils. Dès qu’une décision engage de l’argent ou un fournisseur, il s’arrête et vous demande.</p>
            <ul role="list" className="m-0 mt-3 list-none border-t border-[var(--border)] p-0">{[['Il planifie', 'Un plan lisible avant la première action, mis à jour en direct.'], ['Il agit dans vos outils', 'ERP, messagerie, banque : chaque appel est journalisé avec ses arguments.'], ['Il vous demande', 'Approuvez ou refusez dans le fil ; il adapte la suite de son plan.']].map(([b, s]) => (
              <li key={b} className="relative grid gap-1 border-b border-[var(--border)] py-4 pl-7 before:absolute before:left-1 before:top-[22px] before:size-2.5 before:rounded-[3px] before:bg-[var(--accent)]"><b className="font-semibold text-[var(--text-strong)]">{b}</b><span className="text-[15px] leading-[22px] text-[var(--text-muted)]">{s}</span></li>))}</ul>
          </div>
          <AgentFeed validation={validation} autoValidation={autoValidation} />
        </section>
        <IntegrationFlow />
        <Stats />
        <Waitlist count={count} setCount={setCount} />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
