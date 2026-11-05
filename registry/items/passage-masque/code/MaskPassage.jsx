// Passage par masque — React + Tailwind CSS. Aucune dépendance : défilement de la fenêtre, masque CSS piloté en rAF.
// <MaskPassage shape="hublot" from={<SceneDepart />} to={<SceneArrivee />} />
// La scène « to » apparaît à travers la forme, qui grandit avec le défilement. Couleurs : variables de tokens.css.
import { useEffect, useRef, useState } from 'react';

/**
 * @typedef {'hublot'|'cercle'|'arche'|'losange'} MaskShape
 * @typedef {Object} MaskPassageProps
 * @property {React.ReactNode} from        scène de départ (plein cadre)
 * @property {React.ReactNode} to          scène révélée à travers la forme ; reçoit --mp-z (recadrage) et --mp-t (apparition du texte)
 * @property {MaskShape} [shape]
 * @property {number}  [length]            défilement consacré au passage, en % de hauteur d'écran (100 à 400)
 * @property {number}  [smooth]            inertie 0 à 0,3 (0 = colle au défilement)
 * @property {boolean} [ring]              liseré autour de la forme
 * @property {boolean} [zoom]              recadrage de la scène d'arrivée pendant l'ouverture
 * @property {(p: number) => void} [onProgress]
 * @property {(p: number) => React.ReactNode} [overlay]  éléments au-dessus des deux scènes (horloge, rail…)
 * @property {string}  [label]             nom accessible de la section
 */

const SHAPES = {
  hublot: { svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="30"/></svg>', ratio: 1, cover: 1.16 },
  cercle: { svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"/></svg>', ratio: 1, cover: 1.02 },
  arche: { svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140"><path d="M0 50a50 50 0 0 1 100 0v90H0Z"/></svg>', ratio: 1.4, cover: 1.12 },
  losange: { svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 0 100 50 50 100 0 50Z"/></svg>', ratio: 1, cover: 2.02 },
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const usePrefersReduced = () => {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const f = () => setR(m.matches);
    f(); m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, []);
  return r;
};

/** @param {MaskPassageProps} props */
export function MaskPassage({ from, to, shape = 'hublot', length = 220, smooth = 0.12, ring = true, zoom = true, onProgress, overlay, label }) {
  const root = useRef(null), track = useRef(null), sticky = useRef(null), a = useRef(null);
  const [p, setP] = useState(0);
  const reduce = usePrefersReduced();
  const opts = useRef({}); opts.current = { shape, smooth, ring, zoom, onProgress };

  useEffect(() => {
    if (reduce) return undefined;
    let cur = 0, target = 0, raf = 0, last = 0, visible = true;
    const paint = (v) => {
      const o = opts.current, s = SHAPES[o.shape] || SHAPES.hublot, el = root.current;
      const w = sticky.current.clientWidth, h = sticky.current.clientHeight;
      const e = easeIO(clamp(v / 0.86, 0, 1)), sw = Math.hypot(w, h) * s.cover * e, sh = sw * s.ratio;
      const st = el.style;
      st.setProperty('--mp-shape', `url("data:image/svg+xml,${encodeURIComponent(s.svg)}")`);
      st.setProperty('--mp-w', `${sw.toFixed(1)}px`); st.setProperty('--mp-h', `${sh.toFixed(1)}px`);
      st.setProperty('--mp-rw', `${(sw + 14).toFixed(1)}px`); st.setProperty('--mp-rh', `${(sh + 14 * s.ratio).toFixed(1)}px`);
      st.setProperty('--mp-ro', o.ring && e > 0 && e < 1 ? (1 - Math.pow(e, 6)).toFixed(3) : '0');
      st.setProperty('--mp-z', o.zoom ? (1.22 - 0.22 * easeIO(clamp(v / 0.95, 0, 1))).toFixed(4) : '1');
      st.setProperty('--mp-t', clamp((v - 0.62) / 0.3, 0, 1).toFixed(3));
      a.current.style.transform = `scale(${(1 - 0.08 * e).toFixed(4)})`;
      setP(v); o.onProgress?.(v);
    };
    const read = () => {
      const r = track.current.getBoundingClientRect(), span = r.height - sticky.current.offsetHeight;
      return span > 0 ? clamp(-r.top / span, 0, 1) : 0;
    };
    const loop = (t) => {
      raf = 0;
      const dt = last ? Math.min(64, t - last) : 16; last = t;
      const k = clamp(opts.current.smooth, 0, 0.3);
      cur = k <= 0.001 ? target : cur + (target - cur) * (1 - Math.exp(-dt / (k * 400)));
      if (Math.abs(target - cur) < 0.0004) cur = target;
      paint(cur);
      if (cur !== target && visible) raf = requestAnimationFrame(loop); else last = 0;
    };
    const kick = () => { if (!raf && visible) raf = requestAnimationFrame(loop); };
    const onScroll = () => { target = read(); kick(); };
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) onScroll(); });
    io.observe(root.current);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    paint(0); onScroll();
    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, [reduce]);

  const mask = (w, h) => ({ WebkitMask: `var(--mp-shape) center / var(${w}, 0px) var(${h}, 0px) no-repeat`, mask: `var(--mp-shape) center / var(${w}, 0px) var(${h}, 0px) no-repeat` });

  if (reduce) {
    // Repli statique : les deux scènes l'une sous l'autre, sans masque.
    return (
      <section aria-label={label} className="grid gap-4" style={{ '--mp-z': 1, '--mp-t': 1 }}>
        <div className="relative min-h-[560px] overflow-hidden rounded-2xl">{from}</div>
        <div className="relative min-h-[560px] overflow-hidden rounded-2xl">{to}</div>
      </section>
    );
  }
  return (
    <section ref={root} aria-label={label} className="relative">
      <div ref={track} className="relative" style={{ height: `calc(100svh + ${clamp(length, 100, 400)}svh)` }}>
        <div ref={sticky} className="sticky top-0 isolate h-[100svh] overflow-hidden rounded-xl md:rounded-2xl">
          <div ref={a} className="absolute inset-0 will-change-transform">{from}</div>
          <div aria-hidden="true" className="absolute inset-0 bg-[var(--accent-fg)]" style={{ ...mask('--mp-rw', '--mp-rh'), opacity: 'var(--mp-ro, 1)' }} />
          <div className="absolute inset-0" style={mask('--mp-w', '--mp-h')}>{to}</div>
          {overlay?.(p)}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Démo : « Hublot », train de nuit Paris → Vienne.                    */
/* ------------------------------------------------------------------ */

const STOPS = [[1182, '19 h 42', 'Paris-Est'], [1351, '22 h 31', 'Strasbourg'], [1692, '4 h 12', 'Munich'], [1805, '6 h 05', 'Salzbourg'], [1904, '7 h 44', 'Linz'], [2028, '9 h 48', 'Wien Hbf']];

function Depart({ minutes }) {
  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto] gap-x-16 bg-[var(--accent)] px-5 pb-[88px] pt-5 text-[color:var(--accent-fg)] lg:grid-cols-[minmax(0,1fr)_auto] lg:px-10 lg:py-8">
      <div className="col-span-full flex items-center gap-2.5 text-[17px] font-semibold tracking-[-0.02em]">
        <HublotMark className="h-7 w-7" fg="var(--accent-fg)" /> Hublot <small className="ml-1 font-[family-name:var(--font-mono)] text-[13px] font-medium tracking-normal opacity-80">Trains de nuit</small>
      </div>
      <div className="max-w-[820px] self-end md:self-center">
        <p className="mb-4 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.04em] opacity-85">Ligne Paris – Vienne · tous les soirs</p>
        <h2 className="text-[clamp(34px,10.5vw,48px)] font-semibold leading-[.98] tracking-[-0.045em] md:text-[clamp(36px,6.4vw,84px)]">Partez le soir. <span className="whitespace-nowrap">Réveillez-vous</span> à Vienne.</h2>
        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-[color:color-mix(in_oklab,var(--accent-fg)_30%,transparent)] pt-4 text-[15px] md:mt-8 md:pt-5">
          {[['Départ', 'Paris-Est · 19 h 42'], ['Arrivée', 'Wien Hbf · 9 h 48'], ['Cabine', '2 couchettes, lavabo']].map(([k, v], i) => (
            <div key={k} className={`grid gap-0.5 ${i === 2 ? 'hidden md:grid' : ''}`}><dt className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.04em] opacity-80">{k}</dt><dd className="m-0 font-medium tabular-nums">{v}</dd></div>
          ))}
        </dl>
      </div>
      <ol aria-label="Arrêts" className="m-0 hidden min-w-[220px] list-none self-center p-0 text-[15px] lg:grid">
        {STOPS.map(([m, t, n], i) => {
          const past = minutes >= m, now = past && minutes < (STOPS[i + 1]?.[0] ?? 1e9);
          return (
            <li key={n} className="relative grid min-h-11 grid-cols-[64px_1fr] items-center gap-4 pl-7">
              <span aria-hidden="true" className={`absolute left-[5px] w-0.5 bg-[color:color-mix(in_oklab,var(--accent-fg)_28%,transparent)] ${i === 0 ? 'top-1/2' : 'top-0'} ${i === STOPS.length - 1 ? 'bottom-1/2' : 'bottom-0'}`} />
              <span aria-hidden="true" className={`absolute left-0 top-1/2 -mt-1.5 h-3 w-3 rounded-full border-2 border-[color:var(--accent-fg)] transition ${past ? 'bg-[var(--accent-fg)]' : 'bg-[var(--accent)]'} ${now ? 'scale-[1.35]' : ''}`} />
              <span className="text-sm font-medium tabular-nums opacity-80">{t}</span>{n}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Arrivee() {
  const dark = 'color-mix(in oklab, var(--accent) 55%, var(--mp-dark))';
  return (
    <div className="h-full bg-[var(--accent-subtle)] text-[color:var(--text-strong)] [--mp-dark:var(--text-strong)] [--mp-win:var(--accent-subtle)] dark:[--mp-dark:var(--bg)] dark:[--mp-win:var(--accent)]">
      <svg viewBox="0 -200 1600 1200" preserveAspectRatio="xMidYMax slice" aria-hidden="true" className="absolute inset-0 h-full w-full origin-[50%_60%] will-change-transform" style={{ transform: 'scale(var(--mp-z, 1))' }}>
        <circle cx="1010" cy="610" r="170" style={{ fill: 'var(--accent)' }} />
        <path d="M0 700 L0 640 Q180 600 360 628 T760 618 T1180 630 T1600 610 L1600 700Z" style={{ fill: 'color-mix(in oklab, var(--accent) 30%, var(--accent-subtle))' }} />
        <g style={{ fill: dark }}>
          <path d="M120 700V610h40v-30h30v30h40v90Z" /><path d="M260 700v-70h70v70Z" /><path d="M360 700V560l10-14 4-90 4 90 10 14v140Z" /><path d="M350 700v-96h60v96Z" />
          <path d="M470 700v-80a50 50 0 0 1 100 0v80Z" /><path d="M515 576h10v-28h-10Z" /><path d="M600 700v-60h90v60Z" /><path d="M1300 700v-84h60v84Z" /><path d="M1380 700v-58h120v58Z" />
        </g>
        <g transform="translate(760 520)" style={{ stroke: dark }} fill="none" strokeWidth="5">
          <circle r="128" /><circle r="12" style={{ fill: dark }} />
          <path d="M0-128V128M-128 0H128M-90-90 90 90M90-90-90 90M-49-118 49 118M49-118-49 118M-118-49 118 49M118-49-118 49" strokeWidth="2.5" />
          <path d="M-40 180L0 0 40 180" strokeWidth="7" />
        </g>
        <path d="M0 700h1600v300H0Z" style={{ fill: 'color-mix(in oklab, var(--accent) 22%, var(--accent-subtle))' }} />
        <g style={{ fill: 'var(--accent)' }} opacity=".55"><rect x="900" y="724" width="220" height="6" rx="3" /><rect x="930" y="752" width="160" height="6" rx="3" /><rect x="960" y="780" width="100" height="6" rx="3" /></g>
        <g style={{ fill: 'color-mix(in oklab, var(--accent) 35%, var(--mp-dark))' }}>
          <path d="M0 860h1600v24H0Z" /><path d="M80 884h24v116H80ZM420 884h24v116h-24ZM760 884h24v116h-24ZM1100 884h24v116h-24ZM1440 884h24v116h-24Z" />
          <path d="M560 800h720a36 36 0 0 1 36 36v24H560Z" /><path d="M1316 800c60 0 96 20 120 60h-120Z" />
        </g>
        <g style={{ fill: 'var(--mp-win)' }} opacity=".9">{[600, 680, 760, 840, 920, 1000, 1080, 1160].map((x) => <rect key={x} x={x} y="818" width="56" height="22" rx="6" />)}</g>
      </svg>
      <div className="absolute left-5 right-5 top-[76px] max-w-[560px] md:left-10 md:top-8" style={{ opacity: 'var(--mp-t, 0)', transform: 'translateY(calc((1 - var(--mp-t, 0)) * 24px))' }}>
        <p className="mb-4 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.04em] text-[color:var(--text-muted)]">Wien Hauptbahnhof · 9 h 48</p>
        <h2 className="text-[clamp(28px,8.4vw,40px)] font-semibold leading-[.98] tracking-[-0.045em] md:text-[clamp(32px,4.6vw,60px)]">Le petit-déjeuner est servi au bord du Danube.</h2>
        <div className="mt-5 flex flex-wrap items-center gap-4 md:mt-7">
          <a href="#reserver" className="inline-flex min-h-12 items-center gap-2.5 rounded-full bg-[var(--accent)] px-[22px] text-[15px] font-semibold text-[color:var(--accent-fg)] transition-colors hover:bg-[var(--accent-hover)]">Réserver une cabine <span aria-hidden="true">→</span></a>
          <span className="text-[15px]">Couchette dès <b className="font-semibold tabular-nums text-[color:var(--text-strong)]">89&nbsp;€</b></span>
        </div>
      </div>
    </div>
  );
}

export function HublotMark({ className, fg = 'var(--accent)' }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M30 0h40a30 30 0 0 1 30 30v40a30 30 0 0 1-30 30H30A30 30 0 0 1 0 70V30A30 30 0 0 1 30 0Zm4 14a20 20 0 0 0-20 20v32a20 20 0 0 0 20 20h32a20 20 0 0 0 20-20V34a20 20 0 0 0-20-20Z" style={{ fill: fg }} />
      <path d="M32 64a18 18 0 0 1 36 0Z" style={{ fill: fg }} /><path d="M14 70h72v-4H14Z" style={{ fill: fg }} opacity=".55" />
    </svg>
  );
}

/** @param {Omit<MaskPassageProps, 'from'|'to'>} props */
export default function HublotDemo(props) {
  const [p, setP] = useState(0);
  const minutes = 19 * 60 + 42 + 846 * p;
  const m = Math.round(minutes) % 1440;
  const time = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const wrap = useRef(null);
  const go = (to) => {
    const r = wrap.current.getBoundingClientRect();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: window.scrollY + r.top + to * (r.height - window.innerHeight), behavior: reduce ? 'auto' : 'smooth' });
  };
  return (
    <div ref={wrap} className="font-[family-name:var(--font-sans)]">
      <MaskPassage {...props} label="De Paris à Vienne en train de nuit" onProgress={setP} from={<Depart minutes={minutes} />} to={<Arrivee />}
        overlay={() => (
          <>
            <span aria-hidden="true" className="absolute right-4 top-[18px] z-[3] inline-flex h-8 items-center gap-2 rounded-full bg-[var(--surface)] px-3 font-[family-name:var(--font-mono)] text-[13px] font-medium tabular-nums text-[color:var(--text-strong)] shadow-[var(--shadow-overlay)] md:right-10 md:top-[30px]"><i className="h-2 w-2 rounded-full bg-[var(--accent)]" />{time}</span>
            <div role="group" aria-label="Étapes du trajet" className="absolute bottom-4 left-4 right-4 z-[3] flex items-center justify-between gap-1 rounded-full bg-[var(--surface)] p-1 shadow-[var(--shadow-overlay)] md:bottom-7 md:left-auto md:right-7">
              <button type="button" aria-pressed={p < 0.5} onClick={() => go(0)} className="min-h-11 rounded-full px-3.5 text-[13px] font-medium text-[color:var(--text-muted)] aria-pressed:bg-[var(--raised)] aria-pressed:text-[color:var(--text-strong)] md:min-h-9">Départ</button>
              <span aria-hidden="true" className="relative h-1 flex-1 overflow-hidden rounded-full bg-[var(--border)] md:w-16 md:flex-none"><span className="absolute inset-0 origin-left rounded-full bg-[var(--accent)]" style={{ transform: `scaleX(${p})` }} /></span>
              <button type="button" aria-pressed={p >= 0.5} onClick={() => go(1)} className="min-h-11 rounded-full px-3.5 text-[13px] font-medium text-[color:var(--text-muted)] aria-pressed:bg-[var(--raised)] aria-pressed:text-[color:var(--text-strong)] md:min-h-9">Arrivée</button>
            </div>
          </>
        )} />
    </div>
  );
}
