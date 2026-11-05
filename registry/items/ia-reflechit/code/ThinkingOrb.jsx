// L'IA réfléchit — React + Tailwind CSS. WebGL 1 maison (repli canvas 2D), aucune dépendance.
// <ThinkingOrb step="tool" size={96} />   step : 'think' | 'tool' | 'answer' | 'done' | 'error'
// <ThinkingLabel text="Recherche dans le bail…" />   libellé qui change avec un fondu flou et un reflet
// Couleurs relues dans tokens.css (accent, accent-vivid, down…) à chaque changement de thème ou de palette.
import { useEffect, useRef, useState } from 'react';

/**
 * @typedef {'think'|'tool'|'answer'|'done'|'error'} AgentStep
 * @typedef {Object} ThinkingOrbProps
 * @property {AgentStep} step
 * @property {number} [size]       px (48 à 160)
 * @property {number} [speed]      multiplicateur de vitesse (0,5 à 2)
 * @property {number} [energy]     déformation 0 à 1
 * @property {'webgl'|'canvas'} [render]
 * @property {number} [beat]       incrémentez-le à chaque mot reçu pour faire pulser l'orbe
 * @property {string} [className]
 */

const VS = 'attribute vec2 p;varying vec2 v;void main(){v=p;gl_Position=vec4(p,0.,1.);}';
const FS = [
  'precision highp float;varying vec2 v;uniform float t,en,ring,pulse,sz,err,beat;uniform vec3 c1,c2,c3,c4,c5;',
  'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
  'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}',
  'float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}',
  'vec4 over(vec4 d,vec3 c,float a){return vec4(c*a,a)+d*(1.-a);}',
  'void main(){vec2 uv=v*1.5;float r=length(uv),a=atan(uv.y,uv.x);',
  'vec2 cs=vec2(cos(a),sin(a));float wob=(n(cs*1.3+vec2(t*.6,t*.4))-.5)*.18+(n(cs*2.6+vec2(4.-t*.9,t*.7))-.5)*.09;',
  'float R=.62*sz*(1.+wob*en)+pulse*.035*beat;',
  'vec4 o=vec4(0.);',
  /* halo */
  'vec3 gc=mix(c2,c4,err);float g=exp(-max(r-R,0.)*7.)*.42;o=over(o,gc,g*step(R*.9,r));',
  /* corps : aurore intérieure, lumière qui tourne, bord doux */
  'float q=clamp(r/R,0.,1.);float z=sqrt(max(0.,1.-q*q));',
  'vec2 w=uv*1.5+vec2(fbm(uv*2.+t*.35),fbm(uv*2.-t*.3))*1.5*(.4+en);float sw=fbm(w+t*.2);',
  'vec3 col=mix(c5,c1,.45+.55*z);col=mix(col,c2,smoothstep(.35,.8,sw)*.8);',
  'float st=smoothstep(.58,.92,fbm(w*1.7-t*.25));col=mix(col,c3,st*.5);',
  'vec2 lp=vec2(cos(t*.7),sin(t*.9))*R*.38;col+=c3*exp(-length(uv-lp)/(R*.32))*.35;',
  'col=mix(col,mix(c2,c3,.45),pow(1.-z,2.6)*.7);col=mix(col,c4,err*.85);',
  'float body=smoothstep(R,R-.035,r);o=over(o,col,body);',
  /* anneau d'outil : trois arcs qui tournent */
  'if(ring>.01){float rr=R*1.34;float band=smoothstep(.024,.004,abs(r-rr));float seg=smoothstep(.3,.85,sin(a*3.-t*4.));o=over(o,c2,band*seg*ring);}',
  /* pulsation de réponse : une onde qui part du bord */
  'if(pulse>.01){float ph=fract(t*.55);float pr=R+ph*.42;float pb=smoothstep(.022,.0,abs(r-pr))*(1.-ph)*pulse*.6;o=over(o,c2,pb*(1.-body));}',
  'gl_FragColor=o;}'
].join('\n');
// énergie, vitesse, anneau, pulsation, taille, erreur
const TARGET = { think: [1, 1, 0, 0, 1, 0], tool: [0.7, 1.6, 1, 0, 0.94, 0], answer: [0.45, 0.8, 0, 1, 1.02, 0], done: [0.12, 0.35, 0, 0, 0.86, 0], error: [0.9, 2.2, 0, 0, 0.92, 1] };
const PROBES = ['var(--accent)', 'var(--accent-vivid)', 'var(--th-hi)', 'var(--down)', 'color-mix(in oklab, var(--accent) 45%, var(--th-deep))'];
const parse = (c) => (c.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map((x) => x / 255);
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function createGL(canvas) {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true });
  if (!gl) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  try {
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    gl.useProgram(prog);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {}; ['t', 'en', 'ring', 'pulse', 'sz', 'err', 'beat', 'c1', 'c2', 'c3', 'c4', 'c5'].forEach((k) => { U[k] = gl.getUniformLocation(prog, k); });
    return { gl, U };
  } catch { return null; }
}

/** @param {ThinkingOrbProps} props */
export function ThinkingOrb({ step = 'think', size = 96, speed = 1, energy = 0.6, render = 'webgl', beat = 0, className = '' }) {
  const canvas = useRef(null), probes = useRef(null);
  const state = useRef({ cur: TARGET.think.slice(), tgt: TARGET.think.slice(), t: 0, beat: 0, speed, energy });
  state.current.tgt = TARGET[step]; state.current.speed = speed; state.current.energy = energy;
  useEffect(() => { state.current.beat = 1; }, [beat]);

  useEffect(() => {
    const cv = canvas.current, S = state.current;
    const ctx = render === 'webgl' ? createGL(cv) : null;
    const c2d = ctx ? null : cv.getContext('2d');
    let cols = [], raf = 0, last = 0, visible = true;
    const read = () => { cols = [...probes.current.children].map((i) => parse(getComputedStyle(i).color)); draw(); };
    const draw = () => {
      if (!cols.length) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.round(cv.clientWidth * dpr), H = Math.round(cv.clientHeight * dpr);
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; ctx?.gl.viewport(0, 0, W, H); }
      const { cur } = S, en = cur[0] * (0.25 + S.energy * 1.25);
      if (ctx) {
        const { gl, U } = ctx;
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(U.t, S.t); gl.uniform1f(U.en, en); gl.uniform1f(U.ring, cur[2]); gl.uniform1f(U.pulse, cur[3]); gl.uniform1f(U.sz, cur[4]); gl.uniform1f(U.err, cur[5]); gl.uniform1f(U.beat, S.beat);
        ['c1', 'c2', 'c3', 'c4', 'c5'].forEach((k, i) => gl.uniform3fv(U[k], cols[i]));
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        return;
      }
      // Repli canvas 2D
      const c = c2d, cx = W / 2, cy = H / 2, R = (W / 2) * ((0.62 * cur[4]) / 1.5);
      const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
      const rgb = (v, a) => `rgba(${v.map((x) => Math.round(x * 255)).join(',')},${a})`;
      const k1 = mix(cols[0], cols[3], cur[5] * 0.85), k2 = mix(cols[1], cols[3], cur[5] * 0.85);
      c.clearRect(0, 0, W, H);
      const g = c.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.6); g.addColorStop(0, rgb(k2, 0.3)); g.addColorStop(1, rgb(k2, 0));
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.beginPath();
      for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2, rr = R * (1 + en * (0.05 * Math.sin(a * 3 + S.t * 1.7) + 0.03 * Math.sin(a * 5 - S.t * 2.3))); c[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
      const f = c.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R * 1.05); f.addColorStop(0, rgb(mix(k2, cols[2], 0.45), 1)); f.addColorStop(0.55, rgb(k2, 1)); f.addColorStop(1, rgb(k1, 1));
      c.fillStyle = f; c.fill();
      if (cur[2] > 0.01) { c.lineWidth = W * 0.012; c.strokeStyle = rgb(k2, cur[2]); for (let s = 0; s < 3; s++) { c.beginPath(); c.arc(cx, cy, R * 1.32, S.t * 1.3 + s * 2.094, S.t * 1.3 + s * 2.094 + 0.9); c.stroke(); } }
    };
    const loop = (now) => {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now;
      S.cur = S.cur.map((v, i) => v + (S.tgt[i] - v) * (1 - Math.exp(-dt * 5)));
      S.t += dt * S.cur[1] * S.speed; S.beat *= Math.exp(-dt * 6);
      draw();
      if (visible && !document.hidden && !reduced()) raf = requestAnimationFrame(loop); else last = 0;
    };
    const kick = () => { if (reduced()) { S.cur = S.tgt.slice(); draw(); } else if (!raf && visible) raf = requestAnimationFrame(loop); };
    S.kick = kick;
    const mo = new MutationObserver(read); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-accent'] });
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }); io.observe(cv);
    document.addEventListener('visibilitychange', kick);
    read(); kick();
    return () => { cancelAnimationFrame(raf); mo.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange', kick); S.kick = null; };
  }, [render]);
  useEffect(() => { state.current.kick?.(); }, [step]);

  return (
    <div aria-hidden="true" className={`relative flex-none [--th-deep:var(--text-strong)] [--th-hi:var(--surface)] dark:[--th-deep:var(--bg)] dark:[--th-hi:var(--text-strong)] ${className}`} style={{ width: size, height: size }}>
      <canvas key={render} ref={canvas} className="absolute -inset-1/4 h-[150%] w-[150%]" />
      <span ref={probes} className="absolute h-0 w-0 overflow-hidden">{PROBES.map((c) => <i key={c} style={{ color: c }} />)}</span>
    </div>
  );
}

/** Libellé qui se remplace avec un fondu flou ; reflet balayant tant que l'agent travaille. */
export function ThinkingLabel({ text, shimmer = true, tone = 'default' }) {
  const [items, setItems] = useState([{ text, id: 0 }]);
  const id = useRef(0);
  useEffect(() => {
    setItems((list) => (list[list.length - 1].text === text ? list : [...list.slice(-1), { text, id: ++id.current }]));
  }, [text]);
  return (
    <div className={`relative h-[26px] overflow-hidden text-[15px] font-medium tracking-[-0.01em] md:text-base ${tone === 'error' ? 'text-[color:var(--down)]' : 'text-[color:var(--text-strong)]'}`}>
      {items.map((it, i) => {
        const on = i === items.length - 1;
        return (
          <span key={it.id} onAnimationEnd={() => !on && setItems((l) => l.filter((x) => x.id !== it.id))}
            className={`absolute left-0 top-0 max-w-full truncate leading-[26px] motion-reduce:!animate-none ${on ? 'motion-safe:animate-[th-in_420ms_cubic-bezier(.16,1,.3,1)_80ms_both]' : 'motion-safe:animate-[th-out_280ms_cubic-bezier(.4,0,1,1)_both] motion-reduce:hidden'} ${on && shimmer && tone !== 'error' ? 'th-shine' : ''}`}>
            {it.text}
          </span>
        );
      })}
      <style>{`@keyframes th-in{from{opacity:0;transform:translateY(12px);filter:blur(4px)}}@keyframes th-out{to{opacity:0;transform:translateY(-12px);filter:blur(4px)}}
.th-shine{background:linear-gradient(90deg,var(--text-muted) 0%,var(--text-muted) 35%,var(--text-strong) 50%,var(--text-muted) 65%,var(--text-muted) 100%) 0 0/300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:th-shine 2.2s linear infinite}
@keyframes th-shine{from{background-position:100% 0}to{background-position:-50% 0}}
@media (prefers-reduced-motion:reduce){.th-shine{animation:none;background:none;color:var(--text-strong)}}`}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Démo : « Lucide », agent d'analyse de contrats.                     */
/* ------------------------------------------------------------------ */

const SCRIPT = [
  ['think', 'Je lis le document…', 2200, ['Lecture', ' de Bail_Rivoli_2026.pdf, 14 pages']],
  ['tool', 'Recherche dans le bail…', 2600, ['Recherche', null, ['révision', 'indexation', 'ILC']]],
  ['think', 'Je compare avec la loi Pinel…', 1600, ['Vérification', ' article L145-38 du Code de commerce']],
  ['answer', 'J’écris la réponse…', 0, ['Rédaction', ' de la synthèse']],
];
const ANSWER = 'Oui\u00a0: l’article\u00a06 indexe le loyer chaque année sur l’ILC. Trois risques\u00a0: 1.\u00a0aucun plafond de hausse n’est prévu\u202f; 2.\u00a0la clause d’échelle mobile peut déclencher une révision dès 25\u00a0% de variation\u202f; 3.\u00a0la date de référence (T2\u00a02025) est antérieure à la signature.';

/** @param {{ step?: 'auto'|AgentStep, size?: number, speed?: number, energy?: number, render?: 'webgl'|'canvas', shimmer?: boolean }} props */
export default function LucideAgent({ step: forced = 'auto', size = 96, speed = 1, energy = 0.6, render = 'webgl', shimmer = true }) {
  const [step, setStep] = useState('think');
  const [label, setLabel] = useState(SCRIPT[0][1]);
  const [done, setDone] = useState(0);         // nombre d'étapes terminées
  const [shown, setShown] = useState(1);       // nombre d'étapes affichées
  const [text, setText] = useState('');
  const [open, setOpen] = useState(true);
  const [beat, setBeat] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [run, setRun] = useState(0);
  const t0 = useRef(0);

  useEffect(() => {
    const timers = []; let iv;
    t0.current = performance.now(); setText(''); setOpen(true); setElapsed(0);
    if (forced !== 'auto') {
      const idx = { think: 1, tool: 2, answer: 4, done: 4, error: 1 }[forced];
      setStep(forced); setShown(idx); setDone(forced === 'done' ? 4 : idx - 1);
      setLabel(forced === 'done' ? 'Réponse prête' : forced === 'error' ? 'Le document n’a pas pu être lu' : SCRIPT[idx - 1][1]);
      setText(forced === 'done' ? ANSWER : forced === 'answer' ? `${ANSWER.slice(0, 120)}…` : '');
      return undefined;
    }
    let at = 0;
    SCRIPT.forEach(([s, l, d], i) => {
      timers.push(setTimeout(() => {
        setStep(s); setLabel(l); setShown(i + 1); setDone(i);
        if (s === 'answer') {
          const words = ANSWER.split(/( +)/); let k = 0;
          iv = setInterval(() => {
            k += 1; setText(words.slice(0, k).join('')); if (words[k - 1]?.trim()) setBeat((b) => b + 1);
            if (k >= words.length) { clearInterval(iv); setDone(4); setStep('done'); setLabel('Réponse prête'); setOpen(false); }
          }, reduced() ? 0 : 55);
        }
      }, at));
      at += d;
    });
    const tick = setInterval(() => setElapsed(Math.floor((performance.now() - t0.current) / 1000)), 500);
    return () => { timers.forEach(clearTimeout); clearInterval(iv); clearInterval(tick); };
  }, [forced, run]);

  const working = step !== 'done' && step !== 'error';
  const announce = { think: 'L’agent réfléchit', tool: 'L’agent utilise un outil', answer: 'L’agent rédige la réponse', done: 'Réponse prête', error: 'Erreur : le document n’a pas pu être lu' }[step];

  return (
    <div className="mx-auto max-w-[760px] font-[family-name:var(--font-sans)] text-[color:var(--text)]">
      <div className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-[var(--surface)] md:rounded-2xl">
        <header className="flex h-14 items-center gap-2.5 border-b border-[color:var(--border)] px-4 md:px-5">
          <span className="mr-auto inline-flex items-center gap-2 text-base font-semibold tracking-[-0.02em] text-[color:var(--text-strong)]"><LucideMark />Lucide</span>
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[var(--raised)] px-2.5 text-[13px] text-[color:var(--text-muted)]">Agent<span className="hidden md:inline"> · analyse de contrats</span></span>
        </header>
        <div className="grid gap-5 px-4 pb-6 pt-5 md:gap-6 md:px-5 md:pb-7 md:pt-6">
          <div className="grid max-w-[92%] justify-items-end gap-2 justify-self-end md:max-w-[78%]">
            <p className="m-0 rounded-2xl rounded-br bg-[var(--raised)] px-4 py-3 text-[15px] leading-normal text-[color:var(--text-strong)]">Ce bail prévoit-il une révision du loyer&#8239;? Résume les risques pour nous en trois points.</p>
            <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-[color:var(--border)] pl-2 pr-3 text-[13px]"><b className="font-medium text-[color:var(--text-strong)]">Bail_Rivoli_2026.pdf</b><span className="text-[color:var(--text-muted)]">14 pages</span></span>
          </div>
          <div className="grid gap-3 md:grid-cols-[var(--th-size)_minmax(0,1fr)] md:gap-x-5" style={{ '--th-size': `${size}px` }}>
            <div className="flex items-center gap-3.5 md:contents">
              <ThinkingOrb step={step} size={size} speed={speed} energy={energy} render={render} beat={beat} className="max-md:!h-[calc(var(--th-size)*.72)] max-md:!w-[calc(var(--th-size)*.72)]" />
              <div className="grid min-w-0 flex-1 content-center gap-1 pt-1">
                <ThinkingLabel text={label} shimmer={shimmer && working} tone={step === 'error' ? 'error' : 'default'} />
                <span className="text-sm tabular-nums text-[color:var(--text-muted)]">{step === 'done' ? `Réfléchi pendant ${Math.max(1, elapsed)} s` : step === 'error' ? 'Réessayez ou envoyez un autre fichier' : `Réfléchit depuis ${elapsed} s`}</span>
              </div>
            </div>
            <div className="md:col-start-2">
              {step === 'done' && (
                <button type="button" aria-expanded={open} aria-controls="th-steps" onClick={() => setOpen((o) => !o)} className="-mb-2 -ml-2 mt-1 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-[color:var(--text-muted)] hover:bg-[var(--state-hover)] hover:text-[color:var(--text-strong)]">
                  {open ? 'Masquer le raisonnement' : 'Afficher le raisonnement (4 étapes)'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
                </button>
              )}
              {open && (
                <ol id="th-steps" aria-label="Étapes de l’agent" className="m-0 mt-4 grid list-none gap-0.5 p-0">
                  {SCRIPT.slice(0, shown).map(([, , , [b, rest, codes]], i) => {
                    const isDone = i < done, live = !isDone && working;
                    return (
                      <li key={b} className="grid min-h-8 grid-cols-[24px_minmax(0,1fr)] items-start gap-2.5 py-1 text-sm leading-[22px] text-[color:var(--text-muted)] motion-safe:animate-[th-in_420ms_cubic-bezier(.16,1,.3,1)]">
                        <span aria-hidden="true" className={`grid h-[22px] w-[22px] place-items-center rounded-full border-[1.5px] ${isDone ? 'border-[color:var(--accent)] bg-[var(--accent)] text-[color:var(--accent-fg)]' : live ? 'border-[color:var(--accent)] border-r-transparent motion-safe:animate-spin' : 'border-[color:var(--border-strong)]'}`}>
                          {isDone && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
                        </span>
                        <span><b className="font-medium text-[color:var(--text-strong)]">{b}</b>{rest}{codes?.map((c) => <code key={c} className="ml-1.5 rounded-md bg-[var(--raised)] px-1.5 py-px font-[family-name:var(--font-mono)] text-[13px] font-medium text-[color:var(--text-strong)]">{c}</code>)}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
              {text && <p className="m-0 mt-4 text-[15px] leading-[1.65]">{text}{step === 'answer' && <span aria-hidden="true" className="ml-0.5 inline-block h-[1.1em] w-2 rounded-sm bg-[var(--accent)] align-[-0.15em] motion-safe:animate-pulse" />}</p>}
              {(step === 'done' || step === 'error') && (
                <div className="mt-4 flex gap-2">
                  <button type="button" className="inline-flex min-h-11 items-center rounded-full border border-[color:var(--border)] bg-[var(--surface)] px-3.5 text-sm font-medium text-[color:var(--text-strong)] hover:bg-[var(--raised)] md:min-h-10">Copier</button>
                  <button type="button" onClick={() => setRun((r) => r + 1)} className="inline-flex min-h-11 items-center rounded-full border border-[color:var(--border)] bg-[var(--surface)] px-3.5 text-sm font-medium text-[color:var(--text-strong)] hover:bg-[var(--raised)] md:min-h-10">Régénérer</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <p role="status" className="sr-only">{announce}</p>
    </div>
  );
}

export function LucideMark({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="46" style={{ fill: 'var(--accent)' }} /><circle cx="38" cy="38" r="16" style={{ fill: 'var(--accent-fg)' }} opacity=".85" />
      <path d="M74 58c0 9-7 16-16 16 9 0 16 7 16 16 0-9 7-16 16-16-9 0-16-7-16-16Z" style={{ fill: 'var(--accent-fg)' }} />
    </svg>
  );
}
