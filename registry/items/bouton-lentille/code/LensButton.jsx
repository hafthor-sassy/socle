// Bouton lentille — React + Tailwind CSS, WebGL 1 sans bibliothèque. Couleurs : variables de tokens.css.
// Réfracte la source affichée derrière (canvas, image ou vidéo de même origine) : bords qui bombent, grossissement,
// aberration chromatique, reflet qui suit le pointeur, voile pour le contraste AA. Repli CSS sans WebGL.
import { useEffect, useRef, useState } from 'react';

const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
const FS = `precision mediump float;
uniform sampler2D T;uniform vec2 S;uniform float M,R,K,AB,FR,DPR;uniform vec2 L;uniform vec4 V;uniform vec3 RIM;
float sd(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
vec3 tx(vec2 px){vec2 uv=(px+M)/(S+2.*M);return texture2D(T,clamp(uv,0.001,.999)).rgb;}
vec3 fr(vec2 px){if(FR<.1)return tx(px);vec3 c=tx(px)*.2;
 for(int i=0;i<8;i++){float a=float(i)*.785398;c+=tx(px+vec2(cos(a),sin(a))*FR)*.1;}return c;}
void main(){
 vec2 p=vec2(gl_FragCoord.x,S.y*DPR-gl_FragCoord.y)/DPR;vec2 c=S*.5;vec2 q=p-c;
 float d=sd(q,c,R);float h=.5;
 vec2 n=normalize(vec2(sd(q+vec2(h,0.),c,R)-sd(q-vec2(h,0.),c,R),sd(q+vec2(0.,h),c,R)-sd(q-vec2(0.,h),c,R))+1e-5);
 float inn=-d;float bz=min(S.y*.5,24.);float t=clamp(1.-inn/bz,0.,1.);
 float amt=K*t*t*bz*1.6;vec2 base=c+q*(1.-.1*K);vec2 o=n*amt;
 vec3 col=vec3(fr(base+o*(1.+AB)).r,fr(base+o).g,fr(base+o*(1.-AB)).b);
 col=mix(col,V.rgb,V.a);
 vec2 ld=normalize(L-c+1e-3);float face=max(0.,dot(n,ld));
 float rim=smoothstep(2.2,0.,inn)*(.25+.75*face)+smoothstep(7.,0.,inn)*face*.35;
 col+=RIM*rim*(.35+.4*min(K,1.));
 vec2 g=p-L;col+=RIM*exp(-dot(g,g)/(2.*S.y*S.y*.7))*.10*min(K,1.);
 col*=1.-smoothstep(5.,0.,inn)*(1.-face)*.12;
 col=clamp(col,0.,1.);float a=clamp(.5-d,0.,1.);gl_FragColor=vec4(col*a,a);}`;

const rgb = (str) => {
  const c = document.createElement('canvas').getContext('2d');
  c.fillStyle = '#000'; c.fillStyle = str;
  const v = c.fillStyle;
  if (v[0] === '#') return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);
  const m = v.match(/[\d.]+/g) || [0, 0, 0];
  return [m[0] / 255, m[1] / 255, m[2] / 255];
};

/**
 * @param {object} props
 * @param {React.RefObject<HTMLCanvasElement|HTMLImageElement|HTMLVideoElement>} props.source  Élément affiché derrière le bouton
 * @param {boolean} [props.animated]   La source bouge : rendu à chaque image (pause hors écran)
 * @param {number} [props.refraction]  0 à 1,5
 * @param {number} [props.aberration]  0 à 1
 * @param {number} [props.frost]       Flou du verre (px)
 * @param {number} [props.veil]        Opacité du voile de surface (0 à 0,7) : garde le libellé lisible
 * @param {number} [props.rest]        Part de la réfraction au repos (0 à 1)
 */
export function LensButton({
  source, animated = true, refraction = 1, aberration = 0.35, frost = 1.5, veil = 0.42, rest = 0.3,
  children = 'Prendre mon billet', className = '', ...rest_
}) {
  const btn = useRef(null);
  const cv = useRef(null);
  const st = useRef({ k: 0, v: 0, hot: false, press: false, light: [0, 0], lightT: null });
  const cfg = useRef({});
  cfg.current = { refraction, aberration, frost, veil, rest, animated };
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = cv.current, el = btn.current, src = source?.current;
    const gl = canvas?.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
    let pr = null;
    if (gl && src) {
      const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
      if (vs && fs) { pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) pr = null; }
    }
    if (!pr) { setFallback(true); return; }
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((w) => gl.texParameteri(gl.TEXTURE_2D, w, gl.CLAMP_TO_EDGE));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    const U = Object.fromEntries(['T', 'S', 'M', 'R', 'K', 'AB', 'FR', 'DPR', 'L', 'V', 'RIM'].map((n) => [n, gl.getUniformLocation(pr, n)]));
    const snap = document.createElement('canvas'), sctx = snap.getContext('2d');
    let colors = {};
    const readColors = () => {
      const cs = getComputedStyle(document.documentElement), dark = document.documentElement.classList.contains('dark');
      colors = { veil: rgb(cs.getPropertyValue('--surface').trim()), rim: dark ? rgb(cs.getPropertyValue('--text-strong').trim()).map((x) => x * 0.55) : rgb(cs.getPropertyValue('--surface').trim()) };
    };
    readColors();

    let raf = 0, last = 0, visible = true;
    const render = () => {
      const s = st.current, c = cfg.current, dpr = Math.min(2, devicePixelRatio || 1), w = el.offsetWidth, h = el.offsetHeight, m = 44;
      const W = Math.round(w * dpr), H = Math.round(h * dpr);
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      const br = el.getBoundingClientRect(), sr = src.getBoundingClientRect();
      const sx = (src.width || src.naturalWidth || src.videoWidth) / sr.width, sy = (src.height || src.naturalHeight || src.videoHeight) / sr.height;
      const ow = Math.round((w + 2 * m) * dpr), oh = Math.round((h + 2 * m) * dpr), sc = br.width / w || 1;
      if (snap.width !== ow || snap.height !== oh) { snap.width = ow; snap.height = oh; }
      const cx = br.left + br.width / 2 - sr.left, cy = br.top + br.height / 2 - sr.top;
      sctx.clearRect(0, 0, ow, oh);
      try { sctx.drawImage(src, (cx - (w / 2 + m) * sc) * sx, (cy - (h / 2 + m) * sc) * sy, (w + 2 * m) * sc * sx, (h + 2 * m) * sc * sy, 0, 0, ow, oh); } catch { return; }
      gl.viewport(0, 0, W, H);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, snap);
      gl.uniform1i(U.T, 0); gl.uniform2f(U.S, w, h); gl.uniform1f(U.M, m);
      gl.uniform1f(U.R, Math.min(h / 2, parseFloat(getComputedStyle(el).borderTopLeftRadius) || h / 2));
      gl.uniform1f(U.K, Math.max(0, s.k)); gl.uniform1f(U.AB, c.aberration * 0.45); gl.uniform1f(U.FR, c.frost); gl.uniform1f(U.DPR, dpr);
      gl.uniform2f(U.L, s.light[0], s.light[1]);
      gl.uniform4f(U.V, ...colors.veil, c.veil); gl.uniform3f(U.RIM, ...colors.rim);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const frame = (t) => {
      const s = st.current, c = cfg.current, dt = last ? Math.min(0.033, (t - last) / 1000) : 1 / 60;
      last = t;
      const target = c.refraction * (s.press ? 1.25 : s.hot ? 1 : c.rest);
      if (reduce.matches) { s.k = target; s.v = 0; } else { s.v += (-170 * (s.k - target) - 15 * s.v) * dt; s.k += s.v * dt; }
      const lt = s.lightT || [el.offsetWidth * 0.22, -el.offsetHeight * 0.6];
      s.light = s.light.map((v, i) => v + (lt[i] - v) * Math.min(1, dt * 14));
      render();
      const moving = Math.abs(s.k - target) + Math.abs(s.v) > 0.002 || Math.abs(lt[0] - s.light[0]) > 0.5;
      raf = moving || (c.animated && visible && !reduce.matches) ? requestAnimationFrame(frame) : 0;
      if (!raf) last = 0;
    };
    const wake = () => { if (!raf) raf = requestAnimationFrame(frame); };
    st.current.wake = wake;
    st.current.k = cfg.current.refraction * cfg.current.rest;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; wake(); });
    io.observe(el);
    const mo = new MutationObserver(() => { readColors(); wake(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-accent'] });
    addEventListener('resize', wake); addEventListener('scroll', wake, { passive: true });
    wake();
    return () => { cancelAnimationFrame(raf); io.disconnect(); mo.disconnect(); removeEventListener('resize', wake); removeEventListener('scroll', wake); };
  }, [source]);

  useEffect(() => { st.current.wake?.(); }, [refraction, aberration, frost, veil, rest, animated]);

  const set = (patch) => { Object.assign(st.current, patch); st.current.wake?.(); };
  return (
    <button
      ref={btn}
      type="button"
      onPointerEnter={() => set({ hot: true })}
      onPointerLeave={() => set({ hot: false, press: false, lightT: null })}
      onPointerMove={(e) => { const r = btn.current.getBoundingClientRect(); set({ lightT: [e.clientX - r.left, e.clientY - r.top] }); }}
      onPointerDown={() => set({ press: true })}
      onPointerUp={() => set({ press: false })}
      onFocus={() => set({ hot: true })}
      onBlur={() => set({ hot: false })}
      style={fallback ? { background: `color-mix(in srgb, var(--surface) ${Math.round(veil * 100) + 18}%, transparent)` } : undefined}
      className={[
        'relative isolate inline-flex h-[60px] items-center justify-center gap-3 whitespace-nowrap rounded-full px-7',
        'text-[17px] font-semibold tracking-[-0.01em] text-[var(--text-strong)] [-webkit-tap-highlight-color:transparent]',
        'transition-[scale] duration-[420ms] ease-[cubic-bezier(.34,1.56,.64,1)] active:scale-[.97] active:duration-100 motion-reduce:transition-none',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus-ring)]',
        fallback ? 'shadow-[inset_0_0_0_1px_var(--border)] backdrop-blur-[10px] backdrop-saturate-150' : '',
        className,
      ].join(' ')}
      {...rest_}
    >
      {!fallback && <canvas ref={cv} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 size-full rounded-[inherit]" />}
      <span className="relative">{children}</span>
    </button>
  );
}

/* Exemple
const bg = useRef(null);
<section className="relative">
  <canvas ref={bg} className="absolute inset-0 size-full" />  // ou <img ref={bg} … /> de même origine
  <LensButton source={bg}>Prendre mon billet</LensButton>
</section>
*/
