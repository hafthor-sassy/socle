// LogosPreuve.jsx — logos clients qui défilent ; au survol, la rangée freine avec inertie, le logo se colore
// et une carte à ressort affiche son résultat chiffré. React 18, Tailwind 3.4, tokens.css chargé. Sans bibliothèque.
// Exemple : Charpente (logiciel de suivi de chantiers, marque fictive). Clients et chiffres fictifs.
// Utilisation :
//   <LogosPreuve duration={42} rows={2} direction="gauche" braking={6} card="flottante" colorize={true} fadeEdges={true}
//     title="1 400 entreprises du bâtiment ont repris la main sur leurs délais." />
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/** @typedef {{ name: string, href: string, n: string, label: string, sector: string, mark: JSX.Element, word: JSX.Element }} Client */

const Mark = ({ children }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6 flex-none fill-current transition-transform duration-[420ms] [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] group-[.is-on]:-translate-y-px group-[.is-on]:scale-110 group-[.is-on]:text-[var(--lp-mark)]">{children}</svg>
);
const ln = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' };
const cut = { fill: 'none', stroke: 'var(--surface)', strokeWidth: 1.5, strokeLinecap: 'round' };

/** @type {Client[][]} */
export const CLIENTS = [
  [
    { name: 'Maçonnerie Ferrand', href: '#etude-ferrand', n: '−32 %', label: 'de retards de livraison', sector: 'Gros œuvre · Lyon',
      mark: <Mark><rect x="3" y="5" width="8" height="6" rx="1" /><rect x="13" y="5" width="8" height="6" rx="1" /><rect x="8" y="13" width="8" height="6" rx="1" /></Mark>,
      word: <span className="text-base font-bold tracking-[.22em]">FERRAND</span> },
    { name: 'Alvéole Habitat', href: '#etude-alveole', n: '×2,4', label: 'chantiers suivis par conducteur de travaux', sector: 'Promotion · Nantes',
      mark: <Mark><path d="M12 3l7.5 4.5v9L12 21l-7.5-4.5v-9z" {...ln} /><path d="M12 8l3.5 2v4L12 16l-3.5-2v-4z" /></Mark>,
      word: <span className="text-[19px] font-semibold tracking-tight">alvéole<small className="ml-1 text-xs font-medium uppercase tracking-[.04em]">habitat</small></span> },
    { name: 'Ossature Nord', href: '#etude-ossature', n: '11 h', label: 'gagnées par semaine et par équipe', sector: 'Construction bois · Lille',
      mark: <Mark><path d="M4 20V9l8-5 8 5v11" {...ln} /><path d="M4 14h16M9 9v11M15 9v11" {...ln} /></Mark>,
      word: <span className="text-[19px] font-normal tracking-[-.01em]">Ossature Nord</span> },
    { name: 'Lumen Électricité', href: '#etude-lumen', n: '−48 %', label: 'de réserves à la réception des travaux', sector: 'Second œuvre · Toulouse',
      mark: <Mark><path d="M13.5 2 5 13.5h6L10 22l9-12h-6z" /></Mark>,
      word: <span className="text-[21px] font-extrabold tracking-[-.045em]">lumen</span> },
    { name: 'Toits de Garonne', href: '#etude-garonne', n: '98 %', label: 'des comptes rendus envoyés le jour même', sector: 'Couverture · Bordeaux',
      mark: <Mark><path d="M2 14 12 6l10 8" {...ln} /><path d="M5 18c2.3-1.3 4.7-1.3 7 0s4.7 1.3 7 0" {...ln} /></Mark>,
      word: <span className="font-serif text-xl font-medium italic">Toits de Garonne</span> },
    { name: 'Vauban Ingénierie', href: '#etude-vauban', n: '−21 %', label: 'de dépassement sur les budgets de lots', sector: 'Bureau d’études · Strasbourg',
      mark: <Mark><path d="M12 2.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 15.8l-5.3 2.8 1-5.8-4.2-4.1 5.9-.9z" {...ln} /></Mark>,
      word: <span className="font-mono text-base font-medium">VAUBAN/ING</span> },
  ],
  [
    { name: 'Brique & Cie', href: '#etude-brique', n: '+36 %', label: 'de chantiers livrés à la date prévue', sector: 'Rénovation · Rennes',
      mark: <Mark><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M3 12h18M12 3v9M8 12v9M16 12v9" {...cut} /></Mark>,
      word: <span className="text-[21px] font-extrabold tracking-[-.045em]">Brique&amp;Cie</span> },
    { name: 'Atelier Sorel', href: '#etude-sorel', n: '−3 j', label: 'sur le délai moyen d’un devis', sector: 'Menuiserie · Annecy',
      mark: <Mark><circle cx="12" cy="12" r="8.5" {...ln} /><path d="M12 3.5v17M5 8l14 8" {...ln} /></Mark>,
      word: <span className="text-[19px] font-normal">atelier sorel</span> },
    { name: 'Groupe Calade', href: '#etude-calade', n: '640', label: 'engins suivis en temps réel sur 9 sites', sector: 'Travaux publics · Marseille',
      mark: <Mark><circle cx="7" cy="7" r="3" /><circle cx="17" cy="7" r="3" /><circle cx="7" cy="17" r="3" /><circle cx="17" cy="17" r="3" /></Mark>,
      word: <span className="text-base font-bold tracking-[.22em]">CALADE</span> },
    { name: 'Rive Paysage', href: '#etude-rive', n: '100 %', label: 'des procès-verbaux signés sur tablette', sector: 'Paysagisme · Angers',
      mark: <Mark><path d="M12 21c-5-3-7.5-7-7.5-11A7.5 7.5 0 0 1 12 2.5 7.5 7.5 0 0 1 19.5 10c0 4-2.5 8-7.5 11z" /><path d="M12 21V9" {...cut} /></Mark>,
      word: <span className="font-serif text-xl font-medium italic">Rive</span> },
    { name: 'Plinthe', href: '#etude-plinthe', n: '−27 %', label: 'd’heures de reprise après livraison', sector: 'Peinture et finitions · Paris',
      mark: <Mark><path d="M4 4h16v11H4z" {...ln} /><path d="M4 18h16v2H4z" /></Mark>,
      word: <span className="font-mono text-base font-medium">plinthe.</span> },
    { name: 'Cordée BTP', href: '#etude-cordee', n: '+19 pts', label: 'de marge sur les lots techniques', sector: 'Travaux en hauteur · Grenoble',
      mark: <Mark><path d="M3 20 10 6l4 7 2-3 5 10z" /></Mark>,
      word: <span className="text-[19px] font-semibold tracking-tight">Cordée<b className="ml-1 font-extrabold">BTP</b></span> },
  ],
];

const SPRING = 'linear(0, .009, .035 2.1%, .141, .281 6.7%, .723 12.9%, .938 16.7%, 1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, .991, .977 51%, .974 53.8%, .975 57.1%, .997 69.8%, 1.003 76.9%, 1)';
const useMedia = (q) => {
  const [m, setM] = useState(false);
  useEffect(() => { const mq = matchMedia(q); setM(mq.matches); const f = () => setM(mq.matches); mq.addEventListener('change', f); return () => mq.removeEventListener('change', f); }, [q]);
  return m;
};

/**
 * @param {{ duration?: number, rows?: 1|2, direction?: 'gauche'|'droite', braking?: number, card?: 'flottante'|'ancree',
 *   colorize?: boolean, fadeEdges?: boolean, title?: string, clients?: Client[][], className?: string }} props
 */
export default function LogosPreuve({ duration = 42, rows = 2, direction = 'gauche', braking = 6, card = 'flottante', colorize = true, fadeEdges = true,
  title = '1 400 entreprises du bâtiment ont repris la main sur leurs délais.', clients = CLIENTS, className = '' }) {
  const reduce = useMedia('(prefers-reduced-motion: reduce)');
  const narrow = useMedia('(max-width: 640px)');
  const docked = narrow || card === 'ancree';
  const rootRef = useRef(null), cardRef = useRef(null);
  const rowRefs = useRef([]), trackRefs = useRef([]), sim = useRef([]);
  const [copies, setCopies] = useState([2, 2]);
  const [active, setActive] = useState(null); // { r, i, el, pinned }
  const pre = useRef(null); // carte affichée au moment du toucher : 1er toucher = résultat, 2e = lien
  const state = useRef({ hoverRow: -1, active: null, visible: true, raf: 0, last: 0 });
  const cfg = useRef({}); cfg.current = { duration, direction, braking, reduce, docked };
  state.current.active = active;
  const shown = clients.slice(0, rows);

  /* Nombre de copies : assez pour couvrir deux largeurs de rangée. */
  useLayoutEffect(() => {
    const measure = () => setCopies(shown.map((_, r) => {
      const t = trackRefs.current[r], row = rowRefs.current[r]; if (!t || !row) return 2;
      const first = t.querySelector('[data-set]'); const w = (first?.scrollWidth || 1) + 8;
      sim.current[r] = { ...(sim.current[r] || { x: 0, v: null }), w };
      return Math.max(2, Math.ceil((row.clientWidth * 2) / w) + 1);
    }));
    let lastW = 0; const ro = new ResizeObserver(() => { const w = rootRef.current.clientWidth; if (w !== lastW) { lastW = w; measure(); } }); ro.observe(rootRef.current); return () => ro.disconnect();
  }, [rows, clients]);

  const place = useCallback((follow) => {
    const a = state.current.active, c = cardRef.current; if (!a || !c || cfg.current.docked) return;
    const rr = rootRef.current.getBoundingClientRect(), lr = a.el.getBoundingClientRect();
    const cx = lr.left - rr.left + lr.width / 2, x = Math.max(16, Math.min(rr.width - c.offsetWidth - 16, cx - c.offsetWidth / 2));
    c.style.setProperty('--x', `${x}px`); c.style.setProperty('--y', `${lr.top - rr.top - c.offsetHeight - 12}px`);
    c.style.setProperty('--cx', `${Math.max(20, Math.min(c.offsetWidth - 20, cx - x))}px`);
    c.style.transitionProperty = follow ? 'opacity' : 'opacity, transform';
  }, []);

  const wake = useCallback(() => {
    const s = state.current; if (s.raf || !s.visible || cfg.current.reduce) return; s.last = 0;
    const frame = (now) => {
      s.raf = 0; const dt = Math.min(0.05, (now - (s.last || now)) / 1000); s.last = now; let moving = false;
      sim.current.forEach((r, i) => {
        if (!r || !trackRefs.current[i]) return;
        const sign = (cfg.current.direction === 'droite' ? -1 : 1) * (i % 2 ? -1 : 1);
        const target = s.hoverRow === i || s.active?.pinned ? 0 : (r.w / cfg.current.duration) * sign;
        if (r.v === null) r.v = target;
        r.v += (target - r.v) * (1 - Math.exp(-dt * cfg.current.braking)); if (Math.abs(r.v - target) < 0.5) r.v = target;
        r.x = (((r.x - r.v * dt) % r.w) - r.w) % r.w;
        trackRefs.current[i].style.transform = `translate3d(${r.x.toFixed(2)}px,0,0)`;
        if (r.v !== 0) moving = true;
      });
      if (s.active) place(true);
      if (s.visible && (moving || s.active)) s.raf = requestAnimationFrame(frame);
    };
    s.raf = requestAnimationFrame(frame);
  }, [place]);

  useEffect(() => {
    const s = state.current; const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting; if (s.visible) wake(); });
    io.observe(rootRef.current); const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener('visibilitychange', vis); wake();
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', vis); cancelAnimationFrame(s.raf); s.raf = 0; };
  }, [wake]);
  useEffect(() => { sim.current.forEach((r) => r && (r.v = null)); wake(); }, [duration, direction, rows, wake]);
  useLayoutEffect(() => { place(false); wake(); }, [active, place, wake]);
  useEffect(() => {
    if (!active?.pinned) return;
    const off = (e) => { if (!rootRef.current.contains(e.target)) setActive(null); };
    document.addEventListener('pointerdown', off); return () => document.removeEventListener('pointerdown', off);
  }, [active]);

  const show = (r, i, el, pinned) => setActive((a) => (a && a.r === r && a.i === i && a.pinned === pinned ? a : { r, i, el, pinned }));
  const onFocus = (r, i, el) => {
    const s = sim.current[r], row = rowRefs.current[r];
    if (s && row && !reduce) {
      s.v = 0; const rw = row.clientWidth; let left = el.parentNode.offsetLeft + s.x;
      if (left < 24 || left + el.offsetWidth > rw - 24) s.x = Math.min(0, Math.max(1 - s.w, rw / 2 - (el.parentNode.offsetLeft + el.offsetWidth / 2))); trackRefs.current[r].style.transform = `translate3d(${s.x}px,0,0)`;
    }
    show(r, i, el, true);
  };
  const cur = active ? shown[active.r]?.[active.i] : null;
  const mask = fadeEdges && !reduce ? '[mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]' : '';

  return (
    <section ref={rootRef} aria-labelledby="lp-titre" style={{ '--lp-mark': colorize ? 'var(--accent)' : 'currentColor' }}
      onPointerDownCapture={() => { pre.current = active; }}
      onKeyDown={(e) => { if (e.key === 'Escape' && active) { active.el.blur(); setActive(null); } }}
      onBlur={(e) => { if (!rootRef.current.contains(e.relatedTarget)) setActive(null); }}
      className={`relative isolate mx-auto w-full max-w-[1200px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] pb-8 pt-12 font-sans text-[var(--text)] sm:rounded-2xl sm:pb-20 sm:pt-[72px] ${className}`}>
      <div className="grid justify-items-center gap-3 px-5 text-center sm:gap-4 sm:px-8">
        <a href="#accueil" aria-label="Charpente, accueil" className="inline-flex min-h-11 items-center gap-2 rounded-lg text-base font-semibold tracking-[-.01em] text-[var(--text-strong)] no-underline">
          <svg viewBox="0 0 100 100" aria-hidden="true" className="size-6"><rect width="100" height="100" rx="28" fill="var(--accent)" /><path d="M22 54 50 29l28 25M34 50v22h32V50" fill="none" stroke="var(--accent-fg)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" /><path d="M50 30v44" stroke="var(--accent-fg)" strokeWidth="5" strokeLinecap="round" /></svg>
          Charpente
        </a>
        <p className="mt-2 font-mono text-[13px] font-medium uppercase leading-4 tracking-[.04em] text-[var(--text-muted)]">Ils pilotent leurs chantiers avec nous</p>
        <h2 id="lp-titre" className="max-w-[24ch] text-balance text-[28px] font-semibold leading-[34px] tracking-[-.03em] text-[var(--text-strong)] sm:text-[clamp(28px,2.2vw+14px,44px)] sm:leading-[1.1]">{title}</h2>
        <p className="max-w-[54ch] text-pretty text-[15px] leading-[22px] text-[var(--text-muted)] sm:text-base sm:leading-6">Chaque logo cache un résultat mesuré sur douze mois et vérifié avec le client. Survolez-le ou touchez-le pour le découvrir.</p>
      </div>

      <div className="mt-8 grid gap-0 sm:mt-12 sm:gap-2">
        {shown.map((list, r) => (
          <div key={r} ref={(n) => (rowRefs.current[r] = n)} className={`relative overflow-hidden py-2 ${mask}`}
            onPointerEnter={(e) => { if (e.pointerType === 'mouse') { state.current.hoverRow = r; wake(); } }}
            onPointerLeave={(e) => { if (e.pointerType === 'mouse') { state.current.hoverRow = -1; if (!active?.pinned) setActive(null); wake(); } }}>
            <div ref={(n) => (trackRefs.current[r] = n)} className={`flex gap-2 will-change-transform ${reduce ? 'flex-wrap justify-center px-4' : 'w-max'}`}>
              {Array.from({ length: reduce ? 1 : copies[r] || 2 }, (_, k) => (
                <ul key={k} data-set={k === 0 ? '' : undefined} role="list" aria-hidden={k ? true : undefined}
                  className={`m-0 flex list-none gap-2 p-0 ${reduce ? 'flex-wrap justify-center' : ''}`}>
                  {list.map((c, i) => {
                    const on = active && active.r === r && active.i === i;
                    return (
                      <li key={c.name} className="flex-none">
                        <a href={c.href} tabIndex={k ? -1 : undefined}
                          onPointerOver={(e) => e.pointerType === 'mouse' && show(r, i, e.currentTarget, false)}
                          onFocus={(e) => !k && onFocus(r, i, e.currentTarget)}
                          onClick={(e) => { if (e.detail && !(pre.current && pre.current.r === r && pre.current.i === i)) { e.preventDefault(); show(r, i, e.currentTarget, true); } }}
                          className={`group relative inline-flex h-14 items-center gap-2.5 whitespace-nowrap rounded-xl px-[18px] no-underline outline-none transition-[color,opacity] duration-[260ms] [-webkit-tap-highlight-color:transparent] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--focus-ring)] sm:h-16 sm:px-6
                            ${on ? 'is-on text-[var(--text-strong)] opacity-100' : `text-[var(--text-muted)] ${active ? 'opacity-[.38]' : colorize ? 'opacity-[.78]' : ''}`}`}>
                          <span aria-hidden="true" className={`absolute inset-1 -z-10 rounded-xl bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--accent)_16%,transparent),transparent)] transition-[opacity,transform] duration-[420ms] ${on ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`} />
                          {c.mark}{c.word}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div ref={cardRef} aria-hidden={!docked}
        style={docked ? undefined : { transform: `translate3d(var(--x,0px), calc(var(--y,0px) + ${cur ? 0 : 10}px), 0) scale(${cur ? 1 : 0.94})`, transitionTimingFunction: `ease, ${SPRING}`, transitionDuration: '180ms, 620ms' }}
        className={`${docked ? `relative mx-4 mt-4 grid grid-cols-[auto_1fr] items-center gap-x-4 sm:mx-auto sm:mt-6 sm:max-w-[560px] sm:gap-x-5 ${cur ? '' : 'hidden'}` : 'pointer-events-none absolute left-0 top-0 z-10 w-72 shadow-[var(--shadow-popover)]'}
          rounded-2xl border border-[var(--border)] bg-[var(--raised)] p-4 transition-[opacity,transform] sm:p-5 sm:pb-4 ${cur ? 'opacity-100' : 'opacity-0'} motion-reduce:!transition-opacity`}>
        {!docked && <span aria-hidden="true" style={{ left: 'var(--cx,50%)' }} className="absolute -bottom-[7px] -ml-1.5 size-3 rotate-45 rounded-br-[3px] border-b border-r border-[var(--border)] bg-[var(--raised)]" />}
        {cur && <>
          <p key={cur.name} className={`${docked ? 'row-span-2' : ''} text-4xl font-semibold leading-none tracking-[-.04em] text-[var(--text-strong)] tabular-nums motion-safe:animate-[lp-num_520ms_cubic-bezier(.2,0,0,1)_both] sm:text-[44px]`}>{cur.n}</p>
          <p className={`${docked ? '' : 'mt-2'} text-pretty text-[15px] leading-[22px]`}>{cur.label}</p>
          <div className="col-span-full mt-4 grid gap-0.5 border-t border-[var(--border)] pt-3 text-sm font-medium leading-5 text-[var(--text-strong)]">{cur.name}<span className="font-normal text-[var(--text-muted)]">{cur.sector}</span></div>
          <a href={cur.href} tabIndex={docked ? 0 : -1} className="group/more col-span-full -mb-2 mt-1 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-[var(--accent)] no-underline">
            Lire l’étude de cas
            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 fill-none stroke-current stroke-[1.5] transition-transform group-hover/more:translate-x-[3px]" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
          </a>
        </>}
      </div>
      {narrow && !active && <p className="mx-5 mt-4 text-center text-sm text-[var(--text-muted)]">Touchez un logo pour voir son résultat.</p>}
      <p aria-live="polite" className="sr-only">{cur ? `${cur.name} : ${cur.n} ${cur.label}.` : ''}</p>
      <style>{'@keyframes lp-num{from{opacity:0;filter:blur(6px);transform:translateY(8px)}to{opacity:1;filter:none;transform:none}}'}</style>
    </section>
  );
}
