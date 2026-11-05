// Bento extensible — React + Tailwind CSS. Aucune bibliothèque : FLIP piloté par un vrai ressort (masse 1),
// vitesse conservée si l’on change d’avis en plein vol, contenu contre-étiré. Couleurs : variables de tokens.css.
// Marque et données fictives : Mésange (suivi du sommeil).
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const HR = 'M0.0 23.3 L3.3 22.8 L6.7 17.2 L10.0 21.3 L13.3 17.9 L16.7 20.9 L20.0 26.1 L23.3 26.0 L26.7 33.9 L30.0 34.7 L33.3 41.5 L36.7 44.2 L40.0 43.4 L43.3 40.8 L46.7 46.0 L50.0 43.7 L53.3 38.2 L56.7 33.2 L60.0 34.1 L63.3 34.1 L66.7 28.8 L70.0 36.9 L73.3 32.0 L76.7 39.2 L80.0 43.7 L83.3 47.3 L86.7 48.9 L90.0 47.3 L93.3 54.0 L96.7 51.1 L100.0 49.7 L103.3 49.8 L106.7 45.5 L110.0 46.3 L113.3 43.1 L116.7 39.2 L120.0 33.4 L123.3 34.6 L126.7 35.8 L130.0 34.9 L133.3 38.1 L136.7 41.8 L140.0 40.2 L143.3 42.9 L146.7 47.6 L150.0 44.8 L153.3 43.9 L156.7 38.5 L160.0 36.3 L163.3 36.0 L166.7 26.2 L170.0 29.6 L173.3 24.1 L176.7 19.4 L180.0 23.5 L183.3 21.1 L186.7 26.0 L190.0 22.7 L193.3 23.9 L196.7 27.2 L200.0 25.7';
const BR = 'M0.0 30.0 L1.7 27.0 L3.3 24.2 L5.0 22.0 L6.7 20.5 L8.3 19.9 L10.0 20.3 L11.7 21.6 L13.3 23.9 L15.0 26.7 L16.7 30.0 L18.3 33.3 L20.0 36.4 L21.7 38.8 L23.3 40.5 L25.0 41.1 L26.7 40.6 L28.3 39.1 L30.0 36.7 L31.7 33.5 L33.3 30.0 L35.0 26.4 L36.7 23.2 L38.3 20.6 L40.0 18.9 L41.7 18.2 L43.3 18.8 L45.0 20.4 L46.7 23.0 L48.3 26.3 L50.0 30.0 L51.7 33.7 L53.3 37.0 L55.0 39.7 L56.7 41.4 L58.3 42.0 L60.0 41.4 L61.7 39.7 L63.3 37.0 L65.0 33.7 L66.7 30.0 L68.3 26.3 L70.0 23.0 L71.7 20.4 L73.3 18.8 L75.0 18.2 L76.7 18.9 L78.3 20.6 L80.0 23.2 L81.7 26.4 L83.3 30.0 L85.0 33.5 L86.7 36.7 L88.3 39.1 L90.0 40.6 L91.7 41.1 L93.3 40.5 L95.0 38.8 L96.7 36.4 L98.3 33.3 L100.0 30.0 L101.7 26.7 L103.3 23.9 L105.0 21.6 L106.7 20.3 L108.3 19.9 L110.0 20.5 L111.7 22.0 L113.3 24.2 L115.0 27.0 L116.7 30.0 L118.3 32.9 L120.0 35.5 L121.7 37.5 L123.3 38.7 L125.0 39.1 L126.7 38.5 L128.3 37.2 L130.0 35.1 L131.7 32.7 L133.3 30.0 L135.0 27.4 L136.7 25.1 L138.3 23.3 L140.0 22.2 L141.7 21.9 L143.3 22.4 L145.0 23.6 L146.7 25.4 L148.3 27.6 L150.0 30.0 L151.7 32.4 L153.3 34.5 L155.0 36.1 L156.7 37.1 L158.3 37.4 L160.0 37.0 L161.7 35.9 L163.3 34.3 L165.0 32.3 L166.7 30.0 L168.3 27.8 L170.0 25.8 L171.7 24.2 L173.3 23.2 L175.0 22.8 L176.7 23.2 L178.3 24.2 L180.0 25.8 L181.7 27.8 L183.3 30.0 L185.0 32.3 L186.7 34.3 L188.3 35.9 L190.0 37.0 L191.7 37.4 L193.3 37.1 L195.0 36.1 L196.7 34.5 L198.3 32.4 L200.0 30.0';
/* Hypnogramme : [minutes, phase] — 0 éveil, 1 paradoxal, 2 léger, 3 profond (23:10 → 07:05) */
const NUIT = [[12,0],[18,2],[42,3],[20,2],[14,1],[10,2],[48,3],[22,2],[18,1],[6,0],[30,2],[34,3],[26,2],[24,1],[4,0],[36,2],[18,3],[30,2],[28,1],[15,2],[20,1]];
const ROW = [15, 45, 75, 105];
const FILL = ['fill-[var(--text-disabled)]', 'fill-[var(--accent-vivid)] opacity-55', 'fill-[var(--accent)] opacity-35', 'fill-[var(--accent)]'];
const k = 'm-0 [font-family:var(--font-mono)] text-[13px] uppercase leading-5 tracking-[0.04em] text-[var(--text-muted)]';
const big = 'mt-auto mb-0 text-4xl min-[900px]:text-[44px] font-semibold leading-none tracking-[-0.04em] tabular-nums text-[var(--text-strong)]';
const unit = 'ml-1.5 text-[15px] font-medium tracking-normal text-[var(--text-muted)]';
const wipe = 'motion-safe:animate-[be-wipe_1100ms_cubic-bezier(.65,0,.35,1)_180ms_both]';

function Hypno() {
  let x = 0;
  const tot = NUIT.reduce((a, [m]) => a + m, 0);
  return (
    <figure aria-label="Hypnogramme de 23 h 10 à 7 h 05 : quatre cycles complets, sommeil profond surtout en début de nuit."
      className="m-0 grid min-h-0 grid-cols-[72px_1fr] grid-rows-[1fr_auto] gap-x-3 gap-y-2 min-[900px]:grid-cols-[88px_1fr]">
      <div aria-hidden="true" className="grid grid-rows-4 items-center text-xs text-[var(--text-muted)] min-[900px]:text-[13px]"><span>Éveil</span><span>Paradoxal</span><span>Léger</span><span>Profond</span></div>
      <svg viewBox="0 0 475 120" preserveAspectRatio="none" aria-hidden="true" className="h-full min-h-24 w-full">
        {NUIT.map(([m, s], i) => {
          const w = (m * 475) / tot, x0 = x; x += w;
          return (
            <g key={i}>
              {i > 0 && <path d={`M${x0} ${ROW[NUIT[i - 1][1]]}V${ROW[s]}`} className="fill-none stroke-[var(--border-strong)] opacity-60 [vector-effect:non-scaling-stroke]" />}
              <rect x={x0 + 0.6} y={ROW[s] - 9} width={Math.max(w - 1.2, 1)} height="18" rx="4" className={`${FILL[s]} origin-left [transform-box:fill-box] motion-safe:animate-[be-in_700ms_cubic-bezier(.22,1,.36,1)_both]`} />
            </g>
          );
        })}
      </svg>
      <div aria-hidden="true" className="col-start-2 flex justify-between [font-family:var(--font-mono)] text-xs text-[var(--text-muted)]"><span>23:10</span><span>01:00</span><span>03:00</span><span>05:00</span><span>07:05</span></div>
    </figure>
  );
}
function Stats({ items }) {
  return (
    <dl className="m-0 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-4 min-[900px]:grid-cols-[repeat(auto-fit,minmax(120px,1fr))] min-[900px]:gap-4">
      {items.map(([a, b]) => (
        <div key={a} className="flex flex-col-reverse gap-0.5"><dt className="text-sm text-[var(--text-muted)]">{a}</dt><dd className="m-0 text-lg font-semibold leading-6 tracking-[-0.02em] tabular-nums text-[var(--text-strong)] min-[900px]:text-[22px] min-[900px]:leading-7">{b}</dd></div>
      ))}
    </dl>
  );
}
function Bars({ items, range }) {
  return (
    <ul className="m-0 grid list-none content-center gap-3 p-0">
      {items.map(([label, w, val, pos, note]) => (
        <li key={label} className={`grid items-center gap-x-3 gap-y-1.5 text-[15px] ${range ? 'grid-cols-[1fr_auto] min-[900px]:grid-cols-[120px_1fr_80px_180px] min-[900px]:gap-4' : 'grid-cols-[1fr_64px] min-[900px]:grid-cols-[minmax(150px,1.2fr)_2fr_72px] min-[900px]:gap-4'}`}>
          <span>{label}</span>
          <i className="relative col-span-full row-start-2 h-3 overflow-hidden rounded-full bg-[var(--raised)] min-[900px]:col-span-1 min-[900px]:row-start-auto">
            <b style={{ width: `${w * 100}%` }} className={`absolute inset-y-0 left-0 origin-left rounded-full motion-safe:animate-[be-in_800ms_cubic-bezier(.22,1,.36,1)_200ms_both] ${pos ? 'bg-[var(--accent)]' : 'bg-[var(--down)] opacity-80'}`} />
          </i>
          <b className="text-right font-semibold tabular-nums text-[var(--text-strong)] min-[900px]:text-left">{val}</b>
          {note && <em className="col-span-full text-sm not-italic text-[var(--text-muted)] min-[900px]:col-span-1">{note}</em>}
        </li>
      ))}
    </ul>
  );
}

const CARDS = [
  { id: 'score', base: '2x2', sr: 'Score de sommeil : 86 sur 100',
    sum: (size) => (
      <div className={`h-full ${size === '2x1' ? 'grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] gap-x-4' : 'flex flex-col gap-2'}`}>
        <p className={k}>Score de sommeil</p>
        <div className={`relative grid min-h-0 place-items-center ${size === '2x1' ? 'col-start-2 row-span-2 h-full' : 'flex-1'}`}>
          <svg viewBox="0 0 120 120" className="h-full max-h-[180px] -rotate-90" style={{ aspectRatio: 1 }}><circle cx="60" cy="60" r="52" pathLength="100" className="fill-none stroke-[var(--raised)] [stroke-width:9]" /><circle cx="60" cy="60" r="52" pathLength="100" strokeDasharray="86 100" strokeLinecap="round" className="fill-none stroke-[var(--accent)] [stroke-width:9]" /></svg>
          <b className={`absolute font-semibold tracking-[-0.04em] text-[var(--text-strong)] ${size === '2x2' ? 'text-[44px]' : 'text-[28px]'}`}>86</b>
        </div>
        <p className={`m-0 grid gap-0.5 text-[17px] font-semibold leading-6 text-[var(--text-strong)] ${size === '2x1' ? 'self-end' : ''}`}>Nuit réparatrice<span className="text-sm font-normal text-[var(--text-muted)]">7 h 33 de sommeil</span></p>
      </div>
    ),
    k: 'Score de sommeil · 86', h: '7 h 33 de sommeil, dont 2 h 22 de sommeil profond',
    det: () => (<><Hypno /><Stats items={[['Profond', '2 h 22'], ['Paradoxal', '1 h 44'], ['Endormissement', '12 min'], ['Réveils', '3']]} /></>) },
  { id: 'coeur', base: '1x1', sr: 'Rythme cardiaque : 52 battements par minute au repos',
    sum: () => (<div className="flex h-full flex-col gap-2"><p className={k}>Rythme au repos</p><p className={big}>52<small className={unit}>bpm</small></p>
      <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="h-10 w-full overflow-visible"><path d={HR} className="fill-none stroke-[var(--accent)] [stroke-width:2] [vector-effect:non-scaling-stroke]" /></svg></div>),
    k: 'Rythme cardiaque', h: 'Au plus bas à 48 bpm vers 3 h, signe d’une vraie récupération',
    det: () => (<><svg viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true" className={`h-full min-h-20 w-full overflow-visible ${wipe}`}><path d={`${HR} L200 60 L0 60 Z`} className="fill-[var(--accent-subtle)]" /><path d={HR} className="fill-none stroke-[var(--accent)] [stroke-width:2] [vector-effect:non-scaling-stroke]" /></svg>
      <Stats items={[['Moyenne', '54 bpm'], ['Minimum', '48 bpm'], ['Variabilité', '64 ms'], ['Tendance 7 nuits', '−2 bpm']]} /></>) },
  { id: 'reveil', base: '1x1', sr: 'Réveil en douceur entre 6 h 45 et 7 h 05',
    sum: () => (<div className="flex h-full flex-col gap-2"><p className={k}>Réveil en douceur</p><p className={big}>6:52</p><p className="m-0 text-sm text-[var(--text-muted)]">Fenêtre 6:45 – 7:05</p></div>),
    k: 'Réveil en douceur', h: 'Réveillé à 6 h 52, en sommeil léger, 13 minutes avant l’heure limite',
    det: () => (<>
      <div aria-hidden="true" className="grid content-center gap-2">
        <div className="relative h-10 rounded-xl bg-[var(--raised)]">
          <i className="absolute inset-y-0 left-[33.3%] w-[44.4%] rounded-xl border border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)]" />
          <i className="absolute -inset-y-1.5 left-[48.9%] w-0.5 rounded bg-[var(--accent)]"><b className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent)] px-2 py-0.5 [font-family:var(--font-mono)] text-xs font-semibold text-[var(--accent-fg)]">6:52</b></i>
        </div>
        <div className="grid grid-cols-[33.3%_44.4%_1fr_auto] [font-family:var(--font-mono)] text-xs text-[var(--text-muted)]"><span>6:30</span><span>6:45</span><span>7:05</span><span>7:15</span></div>
      </div>
      <p className="m-0 max-w-[64ch] text-[15px] leading-6 text-[var(--text-muted)]">La lampe monte en 20 minutes jusqu’à 300 lux, puis un son doux démarre dès que Mésange détecte une phase de sommeil léger dans la fenêtre choisie.</p></>) },
  { id: 'souffle', base: '1x1', sr: 'Respiration : 14 cycles par minute, aucune pause détectée',
    sum: () => (<div className="flex h-full flex-col gap-2"><p className={k}>Respiration</p><p className={big}>14<small className={unit}>/ min</small></p>
      <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="h-10 w-full overflow-visible"><path d={BR} className="fill-none stroke-[var(--accent)] [stroke-width:2] [vector-effect:non-scaling-stroke]" /></svg></div>),
    k: 'Respiration', h: 'Aucune pause respiratoire détectée cette nuit',
    det: () => (<><svg viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true" className={`h-full min-h-20 w-full overflow-visible ${wipe}`}><path d={BR} className="fill-none stroke-[var(--accent)] [stroke-width:2] [vector-effect:non-scaling-stroke]" /></svg>
      <Stats items={[['Fréquence', '14 / min'], ['Pauses > 10 s', '0'], ['Ronflements', '4 min']]} /></>) },
  { id: 'habitudes', base: '1x1', sr: 'Habitudes : un café après 16 heures réduit votre sommeil profond',
    sum: () => (<div className="flex h-full flex-col gap-2"><p className={k}>Ce qui joue</p><p className="m-0 mt-auto grid gap-0.5 text-xl font-semibold leading-[26px] tracking-[-0.01em] text-[var(--text-strong)]">Café après 16 h<span className="text-sm font-normal leading-5 tracking-normal text-[var(--text-muted)]">−12 min de sommeil profond</span></p></div>),
    k: 'Ce qui joue sur vos nuits · 30 nuits', h: 'Trois habitudes ont un effet net sur votre sommeil',
    det: () => <Bars items={[['Écran coupé avant 22 h 30', 0.72, '+18 min', true], ['Sport en fin de journée', 0.44, '+9 min', true], ['Café après 16 h', 0.58, '−12 min', false]]} /> },
  { id: 'chambre', base: '4x1', sr: 'Chambre : 18,5 degrés, 34 décibels, obscurité totale',
    sum: () => (
      <div className="flex h-full flex-col justify-between gap-2 min-[900px]:flex-row min-[900px]:items-end">
        <p className={`${k} min-[900px]:self-start`}>Votre chambre</p>
        <ul className="m-0 grid list-none grid-cols-2 gap-x-4 gap-y-2 p-0 min-[900px]:flex min-[900px]:gap-10">
          {[['18,5 °C', 'Température'], ['34 dB', 'Bruit moyen'], ['0 lux', 'Lumière'], ['52 %', 'Humidité']].map(([a, b]) => (
            <li key={b} className="grid gap-0.5"><b className="text-xl font-semibold leading-6 tracking-[-0.02em] tabular-nums text-[var(--text-strong)] min-[900px]:text-[26px] min-[900px]:leading-8">{a}</b><span className="text-[13px] text-[var(--text-muted)] min-[900px]:text-sm">{b}</span></li>
          ))}
        </ul>
      </div>
    ),
    k: 'Votre chambre', h: 'Des conditions idéales, sauf un pic de bruit à 4 h 12',
    det: () => <Bars range items={[['Température', 0.47, '18,5 °C', true, 'idéal 17 – 19 °C'], ['Bruit', 0.34, '34 dB', true, 'pic à 58 dB à 4:12'], ['Humidité', 0.52, '52 %', true, 'idéal 40 – 60 %']]} /> },
];

/* Colonnes de la grille : 4 dès 900 px, 2 en dessous (lu par media query, pas par la grille, pour ne jamais compter les colonnes implicites) */
function useCols() {
  const [c, setC] = useState(() => (typeof window !== 'undefined' && window.matchMedia('(min-width: 900px)').matches ? 4 : 2));
  useLayoutEffect(() => {
    const m = window.matchMedia('(min-width: 900px)'); const on = () => setC(m.matches ? 4 : 2);
    on(); m.addEventListener('change', on); return () => m.removeEventListener('change', on);
  }, []);
  return c;
}

export function BentoExtensible({
  ouvert = '',       // id de la case ouverte au départ ('' : aucune)
  raideur = 260,     // ressort : raideur
  amorti = 26,       // ressort : amortissement (bas : rebond, haut : sec)
  flou = false,      // estomper les cases fermées quand une case est ouverte (baisse le contraste)
}) {
  const [open, setOpen] = useState(ouvert || null);
  useEffect(() => setOpen(ouvert || null), [ouvert]);
  const grid = useRef(null), els = useRef({}), springs = useRef({}), before = useRef(null), raf = useRef(0);
  const cols = useCols();
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Tailles : ouverte = toute la largeur sur 2 rangées (3 sur 2 colonnes) ; la dernière fermée s’étire pour remplir. */
  const sizes = {};
  if (!open) CARDS.forEach((c) => { sizes[c.id] = cols === 2 ? (c.base === '1x1' ? '1x1' : '2x1') : c.base; });
  else {
    const rest = CARDS.filter((c) => c.id !== open), lone = rest.length % cols;
    sizes[open] = `${cols}x${cols === 2 ? 3 : 2}`;
    rest.forEach((c, i) => { sizes[c.id] = i === rest.length - 1 && lone ? `${cols - lone + 1}x1` : '1x1'; });
  }

  const toggle = (id) => {
    const m = {}; CARDS.forEach((c) => { m[c.id] = els.current[c.id].getBoundingClientRect(); });   // boîtes affichées, ressort compris
    before.current = m; setOpen((o) => (o === id ? null : id));
  };
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && open) { toggle(open); } };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  });

  useLayoutEffect(() => {
    const first = before.current; before.current = null;
    if (!first || reduce) return;
    CARDS.forEach((c) => {
      const el = els.current[c.id]; el.style.transform = ''; el.firstElementChild.style.transform = '';
      const a = first[c.id], b = el.getBoundingClientRect(), s = springs.current[c.id] || { vx: 0, vy: 0, vsx: 0, vsy: 0 };
      Object.assign(s, { x: a.left - b.left, y: a.top - b.top, sx: a.width / b.width, sy: a.height / b.height });
      springs.current[c.id] = s;
    });
    let last = 0;
    const paint = () => CARDS.forEach((c) => { const s = springs.current[c.id], el = els.current[c.id];
      el.style.transform = `translate(${s.x}px,${s.y}px) scale(${s.sx},${s.sy})`; el.firstElementChild.style.transform = `scale(${1 / s.sx},${1 / s.sy})`; });
    const tick = (now) => {
      const dt = Math.min(1 / 15, last ? (now - last) / 1000 : 1 / 60); last = now; const h = dt / 4; let moving = false;
      CARDS.forEach((c) => {
        const s = springs.current[c.id];
        for (let i = 0; i < 4; i++) {
          s.vx += (-raideur * s.x - amorti * s.vx) * h; s.x += s.vx * h;
          s.vy += (-raideur * s.y - amorti * s.vy) * h; s.y += s.vy * h;
          s.vsx += (-raideur * (s.sx - 1) - amorti * s.vsx) * h; s.sx += s.vsx * h;
          s.vsy += (-raideur * (s.sy - 1) - amorti * s.vsy) * h; s.sy += s.vsy * h;
        }
        if (Math.abs(s.x) + Math.abs(s.y) > 0.3 || Math.abs(s.sx - 1) + Math.abs(s.sy - 1) > 0.002 || Math.abs(s.vx) + Math.abs(s.vy) > 2) moving = true;
        else Object.assign(s, { x: 0, y: 0, vx: 0, vy: 0, vsx: 0, vsy: 0, sx: 1, sy: 1 });
      });
      paint();
      if (moving) raf.current = requestAnimationFrame(tick);
      else CARDS.forEach((c) => { els.current[c.id].style.transform = ''; els.current[c.id].firstElementChild.style.transform = ''; });
    };
    paint(); cancelAnimationFrame(raf.current); raf.current = requestAnimationFrame(tick);
    if (open && cols === 2) setTimeout(() => { const r = els.current[open].getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) els.current[open].scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
  }, [open]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <section aria-labelledby="be-title" className="bg-[var(--bg)] px-4 py-12 [font-family:var(--font-sans)] text-[var(--text)] min-[900px]:px-[clamp(16px,4vw,56px)] min-[900px]:py-[clamp(48px,7vw,96px)]">
      <style>{'@keyframes be-in{from{transform:scaleX(0)}}@keyframes be-wipe{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}'}</style>
      <header className="mx-auto mb-8 grid max-w-[1200px] gap-4">
        <p className="m-0 flex items-center gap-3">
          <span className="inline-flex text-[var(--text-strong)] [--a:var(--accent-vivid)] [--ink:var(--text-strong)] [--lt:var(--accent-fg)] [--p:var(--accent)]"><svg viewBox="0 0 373 100" aria-hidden="true" focusable="false" className="block h-6 w-auto"><g data-role="icone"><circle cx="50" cy="50" r="50" style={{ fill: 'var(--p, currentColor)' }}/><path d="M45.24 28.06A25 25 0 1 0 70.65 61.10A21 21 0 0 1 45.24 28.06Z" style={{ fill: 'var(--lt, #fff)' }}/><circle cx="70" cy="66" r="5" style={{ fill: 'var(--a, var(--lt, #fff))' }}/></g><path data-role="nom" d="M132.48 70V30.24H142.29L153.28 61.04L164.23 30.24H174.04V70H166.76V42.56L156.74 69.93H149.76L139.76 42.56V70ZM194.23 70.67Q189.76 70.67 186.47 68.75Q183.18 66.82 181.38 63.3Q179.59 59.77 179.59 55.05Q179.59 50.32 181.38 46.83Q183.18 43.33 186.44 41.38Q189.69 39.42 194.09 39.42Q198.36 39.42 201.56 41.33Q204.76 43.24 206.52 46.83Q208.27 50.41 208.27 55.44V57.04H187.02Q187.24 61 189.17 62.97Q191.1 64.94 194.32 64.94Q196.71 64.94 198.3 63.87Q199.88 62.8 200.52 60.83L207.84 61.29Q206.65 65.62 203.02 68.15Q199.4 70.67 194.23 70.67ZM187.02 52.23H200.83Q200.61 48.59 198.78 46.83Q196.95 45.07 194.09 45.07Q191.21 45.07 189.34 46.91Q187.46 48.75 187.02 52.23ZM191.06 36.87 194.48 28.99H201.67L196.63 36.87ZM225.46 70.67Q220.88 70.67 217.89 69.37Q214.89 68.07 213.34 65.79Q211.79 63.52 211.56 60.58L218.89 60.27Q219.29 62.6 220.79 63.9Q222.28 65.21 225.48 65.21Q227.99 65.21 229.33 64.38Q230.67 63.56 230.67 61.82Q230.67 60.8 230.19 60.13Q229.72 59.46 228.34 58.95Q226.96 58.44 224.3 57.97Q219.77 57.16 217.21 56.01Q214.64 54.86 213.6 53.12Q212.56 51.39 212.56 48.85Q212.56 44.65 215.78 42.04Q219 39.42 225.23 39.42Q229.55 39.42 232.31 40.78Q235.07 42.15 236.49 44.43Q237.92 46.72 238.15 49.48L230.89 49.82Q230.83 48.42 230.2 47.3Q229.57 46.18 228.34 45.53Q227.11 44.89 225.12 44.89Q222.57 44.89 221.27 45.91Q219.97 46.93 219.97 48.59Q219.97 49.8 220.5 50.57Q221.02 51.35 222.31 51.84Q223.6 52.33 225.82 52.68Q230.44 53.37 233.12 54.53Q235.81 55.7 236.95 57.46Q238.08 59.23 238.08 61.73Q238.08 66.02 234.65 68.35Q231.22 70.67 225.46 70.67ZM251.79 70.67Q247.13 70.67 244.27 68.52Q241.41 66.37 241.41 62.52Q241.41 58.62 243.82 56.45Q246.23 54.28 251.12 53.31L261.07 51.37Q261.07 48.18 259.61 46.58Q258.14 44.98 255.31 44.98Q252.7 44.98 251.21 46.17Q249.72 47.36 249.21 49.63L241.92 49.26Q242.78 44.54 246.26 41.98Q249.73 39.42 255.31 39.42Q261.69 39.42 264.96 42.63Q268.24 45.84 268.24 51.83V62.73Q268.24 63.92 268.64 64.35Q269.05 64.78 269.89 64.78H270.84V70Q270.51 70.1 269.76 70.17Q269.01 70.25 268.25 70.25Q266.39 70.25 264.94 69.64Q263.49 69.03 262.68 67.56Q261.87 66.1 261.87 63.53L262.52 63.95Q262.04 65.92 260.57 67.45Q259.11 68.98 256.86 69.83Q254.6 70.67 251.79 70.67ZM253.27 65.45Q255.66 65.45 257.4 64.52Q259.14 63.58 260.1 61.89Q261.07 60.19 261.07 57.93V56.25L253.32 57.81Q250.94 58.28 249.88 59.28Q248.83 60.27 248.83 61.85Q248.83 63.56 249.98 64.51Q251.14 65.45 253.27 65.45ZM274.52 70V40.1H281L281.28 48.48L280.41 48.14Q280.88 45.01 282.27 43.1Q283.66 41.19 285.69 40.31Q287.72 39.42 290.13 39.42Q293.44 39.42 295.69 40.87Q297.95 42.31 299.12 44.86Q300.29 47.41 300.29 50.77V70H293.12V53.08Q293.12 50.56 292.63 48.82Q292.15 47.07 291 46.16Q289.86 45.25 287.94 45.25Q285.06 45.25 283.37 47.26Q281.69 49.27 281.69 53.08V70ZM319.79 79.07Q315.86 79.07 313.07 78.01Q310.28 76.94 308.57 75.02Q306.85 73.09 306.19 70.58L313.58 70.07Q314.12 71.74 315.52 72.69Q316.91 73.65 319.79 73.65Q323.13 73.65 324.91 72.16Q326.7 70.67 326.7 67.51V63.75Q325.64 65.92 323.28 67.23Q320.93 68.54 318.02 68.54Q314.31 68.54 311.43 66.72Q308.54 64.89 306.93 61.62Q305.31 58.35 305.31 54.02Q305.31 49.72 306.91 46.44Q308.51 43.16 311.36 41.29Q314.21 39.42 317.88 39.42Q321.13 39.42 323.48 40.88Q325.83 42.34 326.92 44.76V40.1H333.91V67.36Q333.91 71.19 332.15 73.8Q330.4 76.42 327.23 77.74Q324.06 79.07 319.79 79.07ZM319.7 62.92Q322.9 62.92 324.81 60.54Q326.71 58.16 326.74 53.97Q326.78 51.18 325.92 49.18Q325.06 47.19 323.47 46.1Q321.87 45.02 319.7 45.02Q316.38 45.02 314.55 47.45Q312.72 49.87 312.72 53.97Q312.72 58.09 314.61 60.51Q316.5 62.92 319.7 62.92ZM353.55 70.67Q349.08 70.67 345.79 68.75Q342.5 66.82 340.7 63.3Q338.91 59.77 338.91 55.05Q338.91 50.32 340.7 46.83Q342.5 43.33 345.76 41.38Q349.01 39.42 353.41 39.42Q357.68 39.42 360.88 41.33Q364.08 43.24 365.84 46.83Q367.59 50.41 367.59 55.44V57.04H346.34Q346.56 61 348.49 62.97Q350.42 64.94 353.64 64.94Q356.03 64.94 357.62 63.87Q359.2 62.8 359.84 60.83L367.16 61.29Q365.97 65.62 362.34 68.15Q358.72 70.67 353.55 70.67ZM346.34 52.23H360.15Q359.93 48.59 358.1 46.83Q356.27 45.07 353.41 45.07Q350.53 45.07 348.66 46.91Q346.78 48.75 346.34 52.23Z" style={{ fill: 'var(--ink, currentColor)' }}/></svg></span>
          <span className={`border-l border-[var(--border)] pl-3 ${k}`}>Nuit du 4 au 5 novembre</span>
        </p>
        <h2 id="be-title" className="m-0 text-[clamp(1.875rem,1.2rem+2.4vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-[var(--text-strong)] [text-wrap:balance]">Votre nuit, expliquée simplement.</h2>
        <p className="m-0 max-w-[56ch] text-base leading-6 text-[var(--text-muted)] min-[900px]:text-[17px] min-[900px]:leading-[26px]">Touchez une case pour voir le détail. Mésange lit votre sommeil sans montre au poignet, depuis la table de chevet.</p>
      </header>

      <ul ref={grid} className="relative mx-auto m-0 grid max-w-[1200px] list-none auto-rows-[172px] grid-cols-2 gap-3 p-0 [grid-auto-flow:row_dense] min-[900px]:auto-rows-[200px] min-[900px]:grid-cols-4">
        {CARDS.map((c) => {
          const on = open === c.id, [cw, rh] = sizes[c.id].split('x');
          return (
            <li key={c.id} ref={(el) => (els.current[c.id] = el)} style={{ gridColumn: `span ${cw}`, gridRow: `span ${rh}` }}
              className={`relative origin-top-left overflow-hidden rounded-2xl border bg-[var(--surface)] transition-colors will-change-transform ${on ? 'z-[2] border-[var(--accent-subtle-border)]' : 'border-[var(--border)] hover:border-[var(--border-strong)]'}`}>
              <div className="absolute inset-0 origin-top-left">
                <button type="button" aria-expanded={on} aria-controls={`be-d-${c.id}`} onClick={() => toggle(c.id)}
                  className={`absolute z-[3] cursor-pointer border-0 p-0 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-[3px] focus-visible:outline-[var(--focus-ring)]
                    ${on ? 'right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-[var(--raised)] hover:bg-[var(--state-press)]' : 'inset-0 h-full w-full rounded-2xl bg-transparent'}`}>
                  {on && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true" className="text-[var(--text-strong)]"><path d="M6 6l12 12M18 6L6 18" /></svg>}
                  <span className="sr-only">{on ? 'Réduire' : `${c.sr}. Voir le détail`}</span>
                </button>
                <div aria-hidden="true" className={`absolute inset-0 p-4 transition-opacity min-[900px]:p-5 ${on ? 'invisible opacity-0 duration-[120ms]' : `duration-[260ms] ${open && flou ? 'opacity-55' : 'opacity-100'}`}`}>
                  {c.sum(sizes[c.id])}
                </div>
                <div id={`be-d-${c.id}`} role="region" aria-label={`Détail : ${c.k}`}
                  className={`absolute inset-0 grid grid-rows-[auto_1fr_auto] gap-4 px-4 pb-4 pt-5 transition-[opacity,transform] duration-[260ms,520ms] ease-[cubic-bezier(.22,1,.36,1)] min-[900px]:gap-5 min-[900px]:p-6 ${on ? 'visible translate-y-0 opacity-100 delay-[140ms]' : 'invisible translate-y-2 opacity-0'}`}>
                  <div className="grid gap-1.5 pr-14">
                    <p className={k}>{c.k}</p>
                    <h3 className="m-0 max-w-[34ch] text-[19px] font-semibold leading-[25px] tracking-[-0.02em] text-[var(--text-strong)] [text-wrap:balance] min-[900px]:text-[clamp(1.25rem,1rem+.8vw,1.625rem)] min-[900px]:leading-[1.2]">{c.h}</h3>
                  </div>
                  {on && c.det()}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default BentoExtensible;
