// CompteursEntree.jsx — chiffres clés qui roulent une seule fois jusqu'à leur valeur à l'entrée dans l'écran,
// en décalé, avec un trait d'accent synchronisé. React 18, Tailwind 3.4, tokens.css chargé. Sans bibliothèque.
// Exemple : Escale (voyages sur mesure, marque fictive). Chiffres fictifs.
// Utilisation :
//   <CompteursEntree duration={1800} stagger={120} curve="expo" start="zero" line={true} />
//   <CompteursEntree stats={[{ label: 'Clients', value: 1200, note: '…' }]} />
import { useEffect, useRef, useState } from 'react';

const CURVES = { expo: (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t)), doux: (t) => 1 - (1 - t) ** 3, lineaire: (t) => t };

/** @typedef {{ label: string, value: number, decimals?: number, prefix?: string, suffix?: string, note?: string }} Stat */
/** @type {Stat[]} */
export const STATS = [
  { label: 'Voyageurs partis cette année', value: 38600, note: 'De Lisbonne à Hokkaidō, en petit comité.' },
  { label: 'Note moyenne', value: 4.9, decimals: 1, suffix: '/5', note: 'Sur 12\u00a0400 avis vérifiés après le retour.' },
  { label: 'Destinations', value: 72, note: 'Toutes repérées par l’équipe avant d’être proposées.' },
  { label: 'Repartiraient avec nous', value: 96, suffix: '\u00a0%', note: 'Enquête menée trois mois après chaque voyage.' },
];

const Value = ({ stat, v }) => {
  const nf = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: stat.decimals || 0, maximumFractionDigits: stat.decimals || 0 });
  const affix = 'ml-[.06em] text-[.5em] font-medium tracking-[-.01em] text-[var(--text-muted)]';
  return <>{stat.prefix && <span className={affix}>{stat.prefix}</span>}{nf.format(v)}{stat.suffix && <span className={affix}>{stat.suffix}</span>}</>;
};

/**
 * @param {{ stats?: Stat[], duration?: number, stagger?: number, curve?: 'expo'|'doux'|'lineaire', start?: 'zero'|'proche',
 *   line?: boolean, title?: string, className?: string }} props
 */
export default function CompteursEntree({ stats = STATS, duration = 1800, stagger = 120, curve = 'expo', start = 'zero', line = true,
  title = 'Des voyages pensés à la main, depuis 2014.', className = '' }) {
  const from = start === 'proche' ? 0.82 : 0;
  const [p, setP] = useState(() => stats.map(() => from));
  const ref = useRef(null);

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const run = () => {
      if (reduce) return setP(stats.map(() => 1));
      const ease = CURVES[curve] || CURVES.expo, t0 = performance.now();
      const frame = (now) => {
        let running = false;
        setP(stats.map((_, i) => { const t = Math.max(0, Math.min(1, (now - t0 - i * stagger) / duration)); if (t < 1) running = true; return from + (1 - from) * ease(t); }));
        if (running) raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    };
    setP(stats.map(() => from));
    /* Une seule fois, quand 40 % de la section est visible. */
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); run(); } }, { threshold: 0.4 });
    io.observe(ref.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [stats, duration, stagger, curve, from]);

  const round = (s, v) => (s.decimals ? Math.round(v * 10 ** s.decimals) / 10 ** s.decimals : Math.round(v));

  return (
    <section ref={ref} aria-labelledby="ce-titre" className={`mx-auto grid w-full max-w-[1200px] gap-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-8 font-sans text-[var(--text)] sm:gap-14 sm:rounded-2xl sm:p-10 lg:p-16 ${className}`}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-end lg:gap-x-12">
        <a href="#accueil" aria-label="Escale, accueil" className="col-span-full inline-flex min-h-11 items-center gap-2 justify-self-start rounded-lg text-base font-semibold tracking-[-.01em] text-[var(--text-strong)] no-underline">
          <svg viewBox="0 0 100 100" aria-hidden="true" className="size-6"><circle cx="50" cy="50" r="50" fill="var(--accent)" /><path d="M24 70C30 44 52 30 76 30" fill="none" stroke="var(--accent-fg)" strokeWidth="7" strokeLinecap="round" strokeDasharray=".5 12" /><circle cx="24" cy="70" r="7" fill="var(--accent-fg)" /><path d="M68 22l12 8-12 8" fill="none" stroke="var(--accent-fg)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Escale
        </a>
        <h2 id="ce-titre" className="max-w-[18ch] text-balance text-[28px] font-semibold leading-[34px] tracking-[-.03em] text-[var(--text-strong)] sm:text-[clamp(28px,2vw+14px,44px)] sm:leading-[1.1]">{title}</h2>
        <p className="text-pretty text-[15px] leading-[22px] text-[var(--text-muted)] sm:text-base sm:leading-6">Chaque itinéraire est construit par un conseiller qui connaît le terrain. Voici ce que cela donne, une fois les valises posées.</p>
      </div>
      <dl className="m-0 grid grid-cols-2 gap-y-8 sm:gap-y-10 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className={`relative flex flex-col pt-4 sm:pt-6 ${i % 2 ? 'border-l border-[var(--border)] pl-4 sm:pl-6' : 'pr-3 sm:pr-6'} ${i > 0 && i % 2 === 0 ? 'lg:border-l lg:border-[var(--border)] lg:pl-6' : ''}`}>
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-[var(--border)]" />
            {line && <span aria-hidden="true" style={{ transform: `scaleX(${p[i]})` }} className="absolute inset-x-0 -top-px h-0.5 origin-left bg-[var(--accent)]" />}
            <dt className="min-h-8 font-mono text-[13px] font-medium uppercase leading-4 tracking-[.02em] text-[var(--text-muted)] sm:min-h-0 sm:tracking-[.04em]">{s.label}</dt>
            <dd className="m-0 mt-2 text-[40px] font-semibold leading-none tracking-[-.045em] text-[var(--text-strong)] tabular-nums sm:mt-4 sm:text-[clamp(40px,2.6vw+18px,60px)]">
              {/* Pile : la valeur finale invisible réserve la largeur. */}
              <span className="inline-grid [&>*]:[grid-area:1/1]">
                <span aria-hidden="true" className="invisible"><Value stat={s} v={s.value} /></span>
                <span aria-hidden="true"><Value stat={s} v={round(s, s.value * p[i])} /></span>
                <span className="sr-only"><Value stat={s} v={s.value} /></span>
              </span>
            </dd>
            {s.note && <dd className="m-0 mt-3 max-w-[28ch] text-pretty text-sm leading-5 sm:text-[15px] sm:leading-[22px]">{s.note}</dd>}
          </div>
        ))}
      </dl>
    </section>
  );
}
