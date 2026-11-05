// Hero produit au défilement — React 18 + Tailwind CSS, sans autre bibliothèque.
// Couleurs : variables de tokens.css. Marque (Cadran) et chiffres fictifs.
// La capture d’app est dessinée en JSX dans un espace de 1200 × 760 px, mise à l’échelle au conteneur.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const W = 1200, H = 760;
const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const LINE = 'M0.0,127.6 C8.4,126.4 33.5,123.2 50.2,120.4 C66.9,117.6 83.7,113.4 100.4,111.0 C117.1,108.6 133.8,108.3 150.5,105.8 C167.2,103.3 184.0,99.3 200.7,96.2 C217.4,93.1 234.2,89.9 250.9,87.2 C267.6,84.5 284.4,83.4 301.1,80.0 C317.8,76.6 334.6,71.0 351.3,66.6 C368.0,62.2 384.8,57.8 401.5,53.4 C418.2,49.0 434.9,44.6 451.6,40.2 C468.3,35.8 485.1,31.3 501.8,26.8 C518.5,22.3 543.6,15.5 552.0,13.2';
const KPIS = [
  { label: 'MRR', value: '128 420 €', delta: '▲ 8,2 %', spark: 'M0,22 C5,20 11,19 16,19 C21,18 27,15 32,13 C37,13 43,12 48,11 C53,9 59,6 64,5 C67,4 71,2 72,2' },
  { label: 'Clients actifs', value: '1 284', delta: '▲ 3,1 %', spark: 'M0,22 C5,23 11,17 16,17 C21,17 27,12 32,12 C37,12 43,7 48,7 C53,7 59,2 64,2 C67,1 71,2 72,2' },
  { label: 'Churn mensuel', value: '1,9 %', delta: '▼ 0,4 pt', spark: 'M0,2 C5,5 11,6 16,6 C21,7 27,10 32,10 C37,11 43,14 48,14 C53,15 59,18 64,18 C67,19 71,21 72,22' },
  { label: 'Revenu moyen / compte', value: '100 €', delta: '▲ 4,8 %', spark: 'M0,22 C5,19 11,18 16,18 C21,17 27,14 32,14 C37,13 43,10 48,10 C53,9 59,3 64,2 C67,1 71,2 72,2' },
];
const NAV = [
  ['Vue d’ensemble', 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', '', true],
  ['Revenus', 'M4 18l5-6 4 3 7-9', ''], ['Clients', 'M3 19a6 6 0 0 1 12 0M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7', '1 284'],
  ['Abonnements', 'M4 7h16M4 12h16M4 17h10', ''], ['Factures', 'M7 3h7l4 4v14H7zM10 12h5M10 16h5', '3'],
  ['Prévisions', 'M4 20V10M10 20V4M16 20v-7M22 20H2', ''], ['Intégrations', 'M9 7V4M15 7V4M7 7h10v4a5 5 0 0 1-10 0zM12 16v4', ''],
];
const ROWS = [
  ['ML', 'Maison Lune', 'Pro → Échelle', '+270 €', 'Montée en gamme', 'green', 'Aujourd’hui'],
  ['BO', 'Brasserie Opale', 'Essentiel', '+49 €', 'Nouveau', 'blue', 'Hier'],
  ['SA', 'Studio Ardent', 'Pro', '−79 €', 'Résilié', 'red', '28 nov.'],
];
const TINT = {
  green: 'border-[var(--tint-green-border)] bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]',
  blue: 'border-[var(--tint-blue-border)] bg-[var(--tint-blue-bg)] text-[var(--tint-blue-fg)]',
  red: 'border-[var(--tint-red-border)] bg-[var(--tint-red-bg)] text-[var(--tint-red-fg)]',
};
const MONTHS = ['déc.', 'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.'];

const card = 'absolute rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)]';
/* Ombre de profondeur : n’apparaît qu’au détachement des couches. */
const Depth = () => <span aria-hidden="true" className="absolute inset-0 -z-10 rounded-[inherit] [box-shadow:var(--shadow-popover)]" style={{ opacity: 'min(1, calc(var(--e) * var(--i, 0) * 1.5))' }} />;
const Tag = ({ x, y, children }) => (
  <span className="absolute z-[1] inline-flex h-[26px] items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--text-strong)] px-2.5 text-xs font-semibold text-[var(--bg)] before:size-1.5 before:rounded-full before:bg-[var(--accent-vivid)] before:content-['']"
    style={{ left: x, top: y, transform: 'translateY(calc(-100% - 8px + (1 - var(--e)) * 8px))', opacity: 'calc((var(--e) - .35) * 2.4)' }}>{children}</span>
);
const Ic = ({ d, className = 'size-4' }) => <svg className={`${className} flex-none`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;

/**
 * @param {{
 *   title?: string, lead?: string, primaryLabel?: string, primaryHref?: string, secondaryLabel?: string, secondaryHref?: string,
 *   intensity?: number,     // 0 à 2 : ampleur du détachement des couches
 *   tilt?: number,          // inclinaison de départ, en degrés
 *   layers?: 0|1|2|3,       // nombre de couches qui se détachent
 *   perspective?: number,   // en px
 *   length?: number,        // longueur de défilement, en % de la hauteur d’écran
 *   smoothing?: number,     // 0 (direct) à 0,95 (très amorti)
 *   labels?: boolean, glow?: boolean,
 *   mode?: 'scroll'|'static'
 * }} props
 */
export function ProductScrollHero({
  title = 'Vos revenus SaaS, lisibles d’un coup d’œil.',
  lead = 'Cadran réunit abonnements, factures et churn dans un seul tableau de bord. Branché à Stripe en deux minutes, à jour à chaque paiement.',
  primaryLabel = 'Essayer 14 jours', primaryHref = '#essai',
  secondaryLabel = 'Voir une démo de 3 min', secondaryHref = '#demo',
  intensity = 1, tilt = 28, layers = 3, perspective = 1400, length = 180, smoothing = 0.86,
  labels = true, glow = true, mode = 'scroll',
}) {
  const rootRef = useRef(null), stageRef = useRef(null), headRef = useRef(null), shotRef = useRef(null);
  const [reduce, setReduce] = useState(false);
  const [faded, setFaded] = useState(false);
  useEffect(() => {
    const m = matchMedia('(prefers-reduced-motion: reduce)'); setReduce(m.matches);
    const on = () => setReduce(m.matches); m.addEventListener('change', on); return () => m.removeEventListener('change', on);
  }, []);
  const isStatic = reduce || mode === 'static';
  const n = Math.max(0, Math.min(3, layers));

  useIso(() => {
    const root = rootRef.current, stage = stageRef.current, head = headRef.current, shot = shotRef.current;
    if (!root) return;
    const geo = { s0: 0.5, s1: 0.6, y0: 0, y1: 0 };
    let cur = 0, target = 0, raf = 0, last = 0, visible = true, wasFaded = false;
    const k0 = Math.max(0, Math.min(0.97, smoothing));
    const fit = () => {
      const w = stage.clientWidth;
      if (isStatic) { root.style.setProperty('--s', Math.min(1, (w - 32) / (W + 96)).toFixed(4)); return; }
      const h = stage.clientHeight, narrow = w < 768, fitW = (w - (narrow ? 32 : 96)) / (W + 96);
      if (narrow) { geo.s0 = fitW; geo.s1 = Math.min(0.5, fitW * 1.5, (h - 160) / H); }
      else { geo.s1 = Math.min(1, fitW, (h - 96) / H); geo.s0 = geo.s1 * 0.92; }
      geo.y0 = head.offsetTop + head.offsetHeight + (narrow ? 32 : 48);
      geo.y1 = Math.max(24, (h - H * geo.s1) / 2);
    };
    const progress = () => { const r = root.getBoundingClientRect(), t = root.offsetHeight - stage.clientHeight; return t > 0 ? clamp(-r.top / t) : 0; };
    const render = (p) => {
      let a = ease(clamp(p / 0.42)), e = ease(clamp((p - 0.5) / 0.38)), draw = ease(clamp((p - 0.06) / 0.4));
      if (isStatic) { a = 1; e = 0; draw = 1; }
      root.style.setProperty('--a', a.toFixed(4));
      root.style.setProperty('--e', (n ? e : 0).toFixed(4));
      root.style.setProperty('--draw', draw.toFixed(4));
      if (isStatic) { shot.style.transform = 'scale(var(--s))'; return; }
      const s = geo.s0 + (geo.s1 - geo.s0) * a, y = geo.y0 + (geo.y1 - geo.y0) * a;
      shot.style.transform = `translateY(${y.toFixed(1)}px) scale(${s.toFixed(4)})`;
      if ((a > 0.5) !== wasFaded) { wasFaded = a > 0.5; setFaded(wasFaded); }
    };
    const tick = (t) => {
      const dt = last ? Math.min(64, t - last) : 16; last = t;
      cur += (target - cur) * (k0 ? 1 - Math.pow(k0, dt / 16.67) : 1);
      if (Math.abs(target - cur) < 0.0004) cur = target;
      render(cur);
      if (cur !== target) raf = requestAnimationFrame(tick); else { raf = 0; last = 0; }
    };
    const request = () => { if (isStatic) return render(1); target = progress(); if (!raf) raf = requestAnimationFrame(tick); };
    const onScroll = () => { if (visible) request(); };
    const onResize = () => { fit(); request(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) request(); });
    io.observe(root);
    fit(); cur = target = isStatic ? 1 : progress(); render(cur);
    document.fonts?.ready.then(() => { fit(); render(cur); });
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize); io.disconnect(); };
  }, [isStatic, n, smoothing]);

  const L = (i) => ({ '--i': i <= n ? i : 0, transform: 'translateZ(calc(var(--i) * (.5px + var(--e) * 64px * var(--int)))) translateY(calc(var(--i) * var(--e) * -10px * var(--int)))' });
  const out = (dir) => ({ transform: `translateX(calc(var(--e) * ${dir} * 28px * var(--int)))` });

  return (
    <section ref={rootRef} aria-labelledby="hpd-r-title"
      className="relative bg-[var(--bg)] [font-family:var(--font-sans)] text-[var(--text)]"
      style={{ '--a': 0, '--e': 0, '--draw': 0, '--int': intensity, height: isStatic ? 'auto' : `calc(${100 + length} * 1svh)` }}>
      <div ref={stageRef} className={isStatic ? 'relative pb-12' : 'sticky top-0 h-[100svh] overflow-clip'}>
        <header ref={headRef}
          className={`${isStatic ? 'relative' : 'absolute inset-x-0 top-0'} z-[1] grid justify-items-center gap-4 px-4 pt-16 text-center md:gap-5 md:pt-[72px] ${faded && !isStatic ? 'pointer-events-none' : ''}`}
          style={isStatic ? undefined : { transform: 'translateY(calc(var(--a) * -48px))', opacity: 'calc(1 - var(--a) * 2)' }}>
          <a href="#nouveautes" className="group inline-flex min-h-9 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] py-1 pl-3 pr-3 text-[13px] font-medium text-[var(--text)] no-underline transition-colors focus-visible:outline focus-visible:outline-[length:var(--focus-width)] focus-visible:outline-offset-[var(--focus-offset)] focus-visible:outline-[var(--focus-ring)] min-[480px]:pl-1 [@media(hover:hover)]:hover:border-[var(--border-control)]">
            <span className="hidden h-[26px] items-center rounded-full bg-[var(--accent-subtle)] px-2.5 text-xs font-semibold text-[var(--accent)] min-[480px]:inline-flex">Nouveau</span>
            Prévisions de trésorerie à 12 mois
            <Ic d="M5 12h14M13 6l6 6-6 6" className="size-3.5 transition-transform duration-300 [@media(hover:hover)]:group-hover:translate-x-[3px]" />
          </a>
          <h1 id="hpd-r-title" className="m-0 max-w-[16ch] text-balance text-[clamp(2.5rem,1.5rem+4.6vw,4.75rem)] font-semibold leading-none tracking-[-.045em] text-[var(--text-strong)]">{title}</h1>
          <p className="m-0 max-w-[52ch] text-pretty text-[clamp(1rem,.95rem+.3vw,1.1875rem)] leading-[1.55] text-[var(--text-muted)]">{lead}</p>
          <div className="mt-1 flex w-full flex-wrap justify-center gap-x-3 gap-y-2">
            <a href={primaryHref} className="group inline-flex h-12 flex-[1_1_100%] items-center justify-center gap-2 rounded-[var(--radius-ctl)] bg-[var(--accent)] px-5 text-[15px] font-semibold text-[var(--accent-fg)] no-underline transition active:scale-[.98] focus-visible:outline focus-visible:outline-[length:var(--focus-width)] focus-visible:outline-offset-[var(--focus-offset)] focus-visible:outline-[var(--focus-ring)] min-[480px]:flex-none [@media(hover:hover)]:hover:bg-[var(--accent-hover)]">
              {primaryLabel}<Ic d="M5 12h14M13 6l6 6-6 6" className="size-4 transition-transform duration-300 [@media(hover:hover)]:group-hover:translate-x-[3px]" />
            </a>
            <a href={secondaryHref} className="inline-flex h-12 flex-[1_1_100%] items-center justify-center rounded-[var(--radius-ctl)] border border-[var(--border-control)] bg-[var(--surface)] px-5 text-[15px] font-semibold text-[var(--text-strong)] no-underline transition active:scale-[.98] focus-visible:outline focus-visible:outline-[length:var(--focus-width)] focus-visible:outline-offset-[var(--focus-offset)] focus-visible:outline-[var(--focus-ring)] min-[480px]:flex-none [@media(hover:hover)]:hover:bg-[var(--state-hover)]">{secondaryLabel}</a>
          </div>
          <p className="m-0 hidden text-[13px] text-[var(--text-muted)] min-[480px]:block">Sans carte bancaire · Données hébergées en France · 1 200 équipes</p>
          {!isStatic && (
            <p aria-hidden="true" className="m-0 flex items-center gap-2 [font-family:var(--font-mono)] text-[11px] uppercase tracking-[var(--track-caps)] text-[var(--text-muted)] [@media(max-height:760px)_and_(min-width:768px)]:hidden" style={{ opacity: 'calc(1 - var(--a) * 4)' }}>
              <span className="grid h-6 w-4 justify-items-center rounded-lg border-[1.5px] border-current pt-1"><i className="h-[5px] w-0.5 rounded-sm bg-current motion-safe:animate-bounce" /></span>Faites défiler
            </p>
          )}
        </header>

        {/* Capture : 1200 × 760 px mis à l’échelle */}
        <div className={isStatic ? 'relative mt-10' : 'pointer-events-none absolute inset-0 z-[2]'} style={isStatic ? { height: 'calc(760px * var(--s, .3) + 24px)' } : undefined}>
          <div ref={shotRef} className="absolute left-1/2 top-0 -ml-[600px] h-[760px] w-[1200px] origin-top [will-change:transform]" style={{ perspective: `${perspective}px`, perspectiveOrigin: '50% 35%' }}>
            <div role="img" aria-label="Aperçu de Cadran : tableau de bord des revenus avec MRR de 128 420 €, courbe sur 12 mois, répartition par offre, derniers mouvements clients et une alerte de l’assistant."
              className="absolute inset-0 text-[13px] leading-[1.4] [transform-style:preserve-3d]"
              style={{ transform: `translate3d(calc(var(--e) * -32px * var(--int)), calc((1 - var(--a)) * 40px - var(--e) * 24px * var(--int)), 0) rotateX(calc(${tilt}deg * (1 - var(--a)) + 11deg * var(--e) * var(--int))) rotateZ(calc(-5deg * var(--e) * var(--int))) scale(calc(1 - .17 * var(--e) * var(--int)))` }}>
              {glow && <div aria-hidden="true" className="absolute inset-x-[6%] bottom-[-2%] top-[8%] rounded-full [box-shadow:0_0_120px_40px_var(--glow-accent),0_40px_160px_20px_var(--glow)]" style={{ transform: 'translateZ(-1px)', opacity: 'calc(.5 + var(--a) * .5)' }} />}

              {/* Couche 0 : fenêtre */}
              <div aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-[var(--radius-sheet)] border border-[var(--border)] bg-[var(--bg)] [box-shadow:var(--shadow-popover)]">
                <aside className="absolute inset-y-0 left-0 flex w-[232px] flex-col gap-1 border-r border-[var(--border)] bg-[var(--surface)] px-3 py-4">
                  <div className="grid grid-cols-[auto_1fr] items-center gap-x-2.5 px-2 pb-4 pt-1">
                    <span className="row-span-2 grid size-8 place-items-center rounded-[var(--radius-ctl)] bg-[var(--accent)] text-[var(--accent-fg)]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round"><path d="M12 4a8 8 0 1 0 8 8" /><path d="M12 12l5-5" /></svg></span>
                    <b className="text-[15px] tracking-[-.01em] text-[var(--text-strong)]">Cadran</b><span className="-mt-0.5 text-xs leading-none text-[var(--text-muted)]">Atelier Nord</span>
                  </div>
                  {NAV.map(([l, d, badge, on]) => (
                    <span key={l} className={`flex h-[34px] items-center gap-2.5 rounded-[var(--radius-ctl)] px-2.5 ${on ? 'bg-[var(--raised)] font-semibold text-[var(--text-strong)] shadow-[inset_0_0_0_1px_var(--border)]' : ''}`}>
                      <Ic d={d} />{l}{badge && <em className="ml-auto text-[11px] not-italic tabular-nums text-[var(--text-muted)]">{badge}</em>}
                    </span>
                  ))}
                  <div className="px-2.5 pb-1.5 pt-5 [font-family:var(--font-mono)] text-[11px] uppercase leading-none tracking-[var(--track-caps)] text-[var(--text-muted)]">Équipes</div>
                  {[['Finance', 'var(--chart-1)'], ['Croissance', 'var(--chart-3)'], ['Support', 'var(--chart-4)']].map(([l, c]) => (
                    <span key={l} className="flex h-[34px] items-center gap-2.5 px-2.5"><i className="mx-1 size-2 rounded-[3px]" style={{ background: c }} />{l}</span>
                  ))}
                  <div className="mt-auto flex items-center gap-2.5 border-t border-[var(--border)] px-2 pt-3">
                    <span className="grid size-7 place-items-center rounded-full border border-[var(--border)] bg-[var(--raised)] text-[10px] font-semibold text-[var(--text-strong)]">LM</span>
                    <span className="grid"><b className="text-[13px] text-[var(--text-strong)]">Léa Martin</b><small className="text-[11px] text-[var(--text-muted)]">Directrice financière</small></span>
                  </div>
                </aside>
                <div className="absolute left-[232px] right-0 top-0 flex h-[60px] items-center justify-between border-b border-[var(--border)] px-6">
                  <span className="flex h-[34px] w-[380px] items-center gap-2 rounded-[var(--radius-ctl)] border border-[var(--border)] bg-[var(--surface)] px-2.5 text-[var(--text-muted)]"><Ic d="M11 17.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM20 20l-4-4" />Rechercher un client, une facture…<kbd className="ml-auto rounded border border-[var(--border)] px-1.5 [font-family:var(--font-mono)] text-[11px]">⌘K</kbd></span>
                  <span className="flex items-center gap-3.5">
                    <span className="flex">{['AK', 'TR', '+4'].map((a) => <span key={a} className="-ml-2 grid size-[30px] place-items-center rounded-full border-2 border-[var(--bg)] bg-[var(--raised)] text-[10px] font-semibold text-[var(--text-strong)]">{a}</span>)}</span>
                    <span className="relative grid size-[34px] place-items-center"><Ic d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" /><i className="absolute right-2 top-[7px] size-[7px] rounded-full border-[1.5px] border-[var(--bg)] bg-[var(--accent-vivid)]" /></span>
                    <span className="inline-flex h-8 items-center rounded-[var(--radius-ctl)] border border-[var(--border-control)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--text-strong)]">Exporter</span>
                  </span>
                </div>
                <div className="absolute left-[256px] right-6 top-[76px] flex items-center justify-between">
                  <span className="grid"><b className="text-xl tracking-[-.02em] text-[var(--text-strong)]">Vue d’ensemble</b><small className="text-xs text-[var(--text-muted)]">1 – 30 novembre 2026 · mis à jour il y a 2 min</small></span>
                  <span className="flex rounded-[var(--radius-ctl)] border border-[var(--border)] bg-[var(--raised)] p-[3px] text-xs font-medium text-[var(--text-muted)]">
                    <i className="px-3 py-[5px] not-italic">7 j</i><i className="rounded-md bg-[var(--surface)] px-3 py-[5px] not-italic text-[var(--text-strong)] shadow-[0_0_0_1px_var(--border)]">30 j</i><i className="px-3 py-[5px] not-italic">12 mois</i>
                  </span>
                </div>
              </div>

              {/* Couche 1 : indicateurs */}
              <div aria-hidden="true" className="absolute inset-0 [transform-style:preserve-3d]" style={L(1)}>
                {labels && <Tag x={958} y={136}>Indicateurs en temps réel</Tag>}
                {KPIS.map((k, i) => (
                  <div key={k.label} className={`${card} grid h-[104px] w-[218px] grid-cols-[1fr_auto] content-start gap-y-1 px-4 py-3.5`} style={{ left: 256 + i * 234, top: 136 }}>
                    <Depth />
                    <small className="col-span-2 text-xs text-[var(--text-muted)]">{k.label}</small>
                    <b className="text-2xl font-semibold tracking-[-.03em] tabular-nums text-[var(--text-strong)]">{k.value}</b>
                    <span className="self-center text-xs font-semibold text-[var(--up)]">{k.delta}</span>
                    <svg className="absolute bottom-3 left-4 h-[22px] w-[calc(100%-32px)] overflow-visible" viewBox="0 0 72 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"><path d={k.spark} /></svg>
                  </div>
                ))}
              </div>

              {/* Couche 2 : graphique, répartition, tableau */}
              <div aria-hidden="true" className="absolute inset-0 [transform-style:preserve-3d]" style={L(2)}>
                {labels && <Tag x={72} y={600}>Graphiques et tableaux partagés</Tag>}
                <div className={`${card} left-[256px] top-[256px] h-[292px] w-[600px]`}>
                  <Depth />
                  <div className="flex items-start justify-between px-4 pt-3.5">
                    <span className="grid gap-0.5"><small className="text-xs text-[var(--text-muted)]">MRR sur 12 mois</small><b className="text-xl tracking-[-.02em] tabular-nums text-[var(--text-strong)]">128 420 €</b></span>
                    <span className={`inline-flex h-[22px] items-center rounded-full border px-2 text-[11px] font-semibold ${TINT.green}`}>+80 % sur un an</span>
                  </div>
                  <svg className="absolute left-6 top-[92px] h-[150px] w-[552px] overflow-visible" viewBox="0 0 552 150" preserveAspectRatio="none">
                    <path d="M0,0.5H552M0,50.5H552M0,100.5H552M0,149.5H552" fill="none" stroke="var(--chart-grid)" strokeDasharray="3 4" />
                    <path d={`${LINE} L552,150 L0,150 Z`} fill="var(--accent)" style={{ fillOpacity: 'calc(.12 * var(--draw))' }} />
                    <path d={LINE} pathLength="1" fill="none" stroke="var(--accent)" strokeWidth="2.25" strokeLinecap="round" strokeDasharray="1" style={{ strokeDashoffset: 'calc(1 - var(--draw))' }} />
                  </svg>
                  <span className="absolute -ml-1.5 -mt-1.5 size-3 rounded-full border-[2.5px] border-[var(--accent)] bg-[var(--surface)]" style={{ left: 576, top: 105, transform: 'scale(calc(var(--draw) * var(--draw)))' }} />
                  <span className="absolute whitespace-nowrap rounded-md bg-[var(--text-strong)] px-2 py-[5px] text-[11px] font-semibold leading-none text-[var(--bg)]" style={{ left: 576, top: 105, transform: 'translate(-100%, -150%) translateX(-8px)', opacity: 'calc((var(--draw) - .8) * 5)' }}>Nov. · 128,4 k€</span>
                  <div className="absolute bottom-3.5 left-6 right-6 flex justify-between [font-family:var(--font-mono)] text-[10px] leading-none text-[var(--text-muted)]">{MONTHS.map((m) => <i key={m} className="flex w-0 justify-center not-italic">{m}</i>)}</div>
                </div>
                <div className={`${card} left-[872px] top-[256px] h-[292px] w-[304px]`}>
                  <Depth />
                  <div className="grid gap-0.5 px-4 pt-3.5"><small className="text-xs text-[var(--text-muted)]">Répartition par offre</small><b className="text-xl tracking-[-.02em] text-[var(--text-strong)]">3 offres</b></div>
                  <div className="absolute left-4 top-[84px] size-[120px]">
                    <svg className="size-full -rotate-90" viewBox="0 0 36 36" fill="none" strokeWidth="4.2">
                      <circle r="15.9" cx="18" cy="18" stroke="var(--chart-1)" strokeDasharray="48 52" />
                      <circle r="15.9" cx="18" cy="18" stroke="var(--chart-3)" strokeDasharray="37 63" strokeDashoffset="-48" />
                      <circle r="15.9" cx="18" cy="18" stroke="var(--chart-4)" strokeDasharray="15 85" strokeDashoffset="-85" />
                    </svg>
                    <span className="absolute inset-0 grid place-content-center text-center"><b className="text-lg tracking-[-.02em] text-[var(--text-strong)]">1 284</b><small className="text-[11px] text-[var(--text-muted)]">comptes</small></span>
                  </div>
                  <ul className="absolute left-[156px] right-4 top-[92px] m-0 grid list-none gap-3.5 p-0 text-xs">
                    {[['Échelle', '48 %', 'var(--chart-1)'], ['Pro', '37 %', 'var(--chart-3)'], ['Essentiel', '15 %', 'var(--chart-4)']].map(([l, v, c]) => (
                      <li key={l} className="grid grid-cols-[auto_1fr_auto] items-center gap-2"><i className="size-2 rounded-[3px]" style={{ background: c }} />{l}<b className="tabular-nums text-[var(--text-strong)]">{v}</b></li>
                    ))}
                  </ul>
                </div>
                <div className={`${card} left-[256px] top-[564px] h-[172px] w-[920px] overflow-hidden`}>
                  <Depth />
                  <div className="grid h-11 grid-cols-[2fr_1.4fr_1fr_1.4fr_1fr] items-center bg-[var(--raised)] px-4 text-xs font-medium text-[var(--text-muted)]"><span>Client</span><span>Offre</span><span>Montant</span><span>Statut</span><span>Date</span></div>
                  {ROWS.map(([ini, name, plan, amt, st, tone, date]) => (
                    <div key={name} className="grid h-[42px] grid-cols-[2fr_1.4fr_1fr_1.4fr_1fr] items-center border-t border-[var(--border)] px-4">
                      <span className="flex items-center font-medium text-[var(--text-strong)]"><i className="mr-2 grid size-[22px] place-items-center rounded-full border border-[var(--border)] bg-[var(--raised)] text-[9px] font-semibold not-italic">{ini}</i>{name}</span>
                      <span>{plan}</span><span className="font-semibold tabular-nums text-[var(--text-strong)]">{amt}</span>
                      <span><em className={`inline-flex h-[22px] items-center rounded-full border px-2 text-[11px] font-semibold not-italic ${TINT[tone]}`}>{st}</em></span><span>{date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Couche 3 : assistant et notification */}
              <div aria-hidden="true" className="absolute inset-0 [transform-style:preserve-3d]" style={L(3)}>
                {labels && <Tag x={916} y={676}>Assistant et alertes</Tag>}
                <div className={`${card} -left-12 top-[344px] grid w-[300px] gap-2.5 px-4 pb-4 pt-3.5`} style={out(-1)}>
                  <Depth />
                  <span className="flex items-center gap-2 text-[var(--text-strong)]"><span className="grid size-[26px] place-items-center rounded-[var(--radius-ctl)] bg-[var(--accent-subtle)] text-[var(--accent)]"><Ic d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" className="size-[15px]" /></span><b>Assistant Cadran</b></span>
                  <p className="m-0 leading-normal">3 comptes Pro dépassent leur quota de minutes depuis deux semaines. Leur proposer Échelle rapporterait <b className="text-[var(--text-strong)]">+810 €</b> de MRR.</p>
                  <span className="flex gap-2">
                    <span className="inline-flex h-8 items-center rounded-[var(--radius-ctl)] border border-[var(--accent)] bg-[var(--accent)] px-3 text-xs font-semibold text-[var(--accent-fg)]">Voir les comptes</span>
                    <span className="inline-flex h-8 items-center rounded-[var(--radius-ctl)] border border-[var(--border-control)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--text-strong)]">Plus tard</span>
                  </span>
                </div>
                <div className={`${card} left-[900px] top-[676px] grid h-16 w-[336px] grid-cols-[auto_1fr_auto] items-center gap-3 px-4`} style={out(1)}>
                  <Depth />
                  <span className="grid size-[30px] place-items-center rounded-full bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]"><Ic d="M5 12.5l4.5 4.5L19 7.5" className="size-[15px]" /></span>
                  <span className="grid"><b className="text-[var(--text-strong)]">Paiement reçu · Maison Lune</b><small className="text-xs text-[var(--text-muted)]">1 270 € · facture F-2026-1184</small></span>
                  <em className="mt-3.5 self-start text-[11px] not-italic text-[var(--text-muted)]">à l’instant</em>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductScrollHero;
