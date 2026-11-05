// MurColonnes.jsx — mur de témoignages en colonnes qui défilent en sens opposés et ralentissent en douceur au survol.
// React 18 + Tailwind 3.4, tokens.css chargé (couleurs uniquement par variables). Sans bibliothèque d'animation :
// un seul requestAnimationFrame pour toutes les colonnes, vitesse lissée, arrêt hors écran / onglet masqué / focus.
// Mobile (≤ 639 px) : deux rangées horizontales qu'on tient et fait glisser au doigt. Marque fictive : Escale.
// Utilisation : <MurColonnes speed={28} hoverSpeed={15} direction="alterne" columns={3} mask height={640} />
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';

export const AVIS = [
  { who: 'Claire Dumas', trip: 'Paris → Vienne · en couple', tint: 'blue', text: ['Le train de nuit pour Vienne était ', { b: 'parfaitement calé avec l’hôtel' }, '. On n’a rien eu à gérer, juste à profiter.'] },
  { who: 'Thomas Lebrun', trip: 'Lille → Turin · déplacement pro', tint: 'amber', text: ['J’ai changé mes billets la veille à cause d’une grève : ', { b: 'nouvel itinéraire en vingt minutes' }, ', sans frais.'] },
  { who: 'Samira Aït-Ali', trip: 'Lyon → Barcelone · en famille', tint: 'green', text: ['Avec deux enfants, chaque correspondance compte. Escale nous a proposé des trajets directs que je n’avais jamais trouvés.'] },
  { who: 'Julien Martel', trip: 'Nantes → Amsterdam', tint: 'violet', text: ['Le carnet de voyage sur le téléphone est génial : billets, adresses et horaires au même endroit, ', { b: 'même hors ligne' }, '.'] },
  { who: 'Élise Garnier', trip: 'Grenoble → Bolzano · randonnée', tint: 'pink', text: ['Une semaine dans les Dolomites sans prendre l’avion, et ', { b: 'un bilan carbone divisé par six' }, '. On recommence l’an prochain.'] },
  { who: 'Marc Olivier', trip: 'Bordeaux → Madrid', tint: 'blue', text: ['Service client joignable un dimanche soir, avec une vraie personne au bout du fil. Rare.'] },
  { who: 'Nadia Benali', trip: 'Office manager · séminaire à Berlin', tint: 'green', text: ['Nos quatorze collaborateurs sont arrivés à Berlin à la même heure, ', { b: 'places côte à côte' }, '. Organisation impeccable.'] },
  { who: 'Hugo Perrin', trip: 'Marseille → Genève', tint: 'amber', text: ['Les suggestions d’étapes m’ont fait découvrir Annecy sur la route de Genève. Meilleure pause du voyage.'] },
  { who: 'Inès Laurent', trip: 'Rennes → Londres', tint: 'violet', text: [{ b: 'Prix affiché, prix payé.' }, ' Pas de frais de dossier qui apparaissent à la dernière étape.'] },
  { who: 'Léa Moreau', trip: 'Toulouse → Rome · en solo', tint: 'pink', text: ['Premier voyage seule en Italie : j’étais rassurée par les alertes de quai et de retard en temps réel.'] },
  { who: 'Antoine Roy', trip: 'Strasbourg → Prague', tint: 'blue', text: ['Le comparatif train, bus et covoiturage pour le dernier kilomètre m’a évité un taxi hors de prix.'] },
  { who: 'Camille et Yanis', trip: 'Montpellier → Séville · road-trip', tint: 'green', text: ['On a construit le sud de l’Espagne en trois soirs, étape par étape. ', { b: 'L’appli s’adaptait à nos envies.' }] },
];
const TINT = {
  blue: 'bg-[var(--tint-blue-bg)] text-[var(--tint-blue-fg)] border-[var(--tint-blue-border)]',
  green: 'bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)] border-[var(--tint-green-border)]',
  amber: 'bg-[var(--tint-amber-bg)] text-[var(--tint-amber-fg)] border-[var(--tint-amber-border)]',
  violet: 'bg-[var(--tint-violet-bg)] text-[var(--tint-violet-fg)] border-[var(--tint-violet-border)]',
  pink: 'bg-[var(--tint-pink-bg)] text-[var(--tint-pink-fg)] border-[var(--tint-pink-border)]',
};
const initials = (n) => n.split(/\s+/).filter((w) => /^[A-ZÀ-Ý]/.test(w)).slice(0, 2).map((w) => w[0]).join('');
const focusRing = 'focus-visible:outline focus-visible:outline-[length:var(--focus-width)] focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-[var(--focus-offset)]';
const STAR = 'polygon(50% 4%, 61.8% 36%, 96% 38%, 69% 59%, 79% 93%, 50% 74%, 21% 93%, 31% 59%, 4% 38%, 38.2% 36%)';

function Card({ a, rows }) {
  return (
    <li className={`grid rounded-2xl border border-[var(--border)] bg-[var(--surface)] transition-colors hover:border-[var(--border-control)] ${rows ? 'w-[284px] content-between gap-3.5 px-[18px] pb-4 pt-[18px]' : 'gap-4 px-6 pb-5 pt-[22px]'}`}>
      <figure className="contents">
        <blockquote className={`m-0 text-pretty leading-[1.55] text-[var(--text)] ${rows ? 'text-[15px]' : 'text-base'}`}>
          {a.text.map((t, i) => (typeof t === 'string' ? <Fragment key={i}>{t}</Fragment> : <b key={i} className="font-semibold text-[var(--text-strong)]">{t.b}</b>))}
        </blockquote>
        <figcaption className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className={`grid h-10 w-10 flex-none place-items-center rounded-full border text-[13px] font-semibold tracking-[.02em] ${TINT[a.tint]}`}>{initials(a.who)}</span>
          <span className="grid min-w-0">
            <strong className="text-[15px] font-semibold text-[var(--text-strong)]">{a.who}</strong>
            <span className="flex items-center gap-1.5 truncate text-sm text-[var(--text-muted)]">
              <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5 flex-none fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.5]"><rect x="3.5" y="2" width="9" height="9.5" rx="2.5" /><path d="M3.5 7.5h9M6 14l-1.5-2.5M10 14l1.5-2.5" /></svg>
              <span className="truncate">{a.trip}</span>
            </span>
          </span>
        </figcaption>
      </figure>
    </li>
  );
}

/**
 * @param {{ items?: typeof AVIS, speed?: number, hoverSpeed?: number, direction?: 'alterne'|'meme', columns?: number,
 *   mask?: boolean, height?: number, className?: string }} props
 */
export function MurColonnes({ items = AVIS, speed = 28, hoverSpeed = 15, direction = 'alterne', columns = 3, mask = true, height = 640, className = '' }) {
  const [rows, setRows] = useState(false);
  const [still, setStill] = useState(false);
  const [paused, setPaused] = useState(false);
  const wall = useRef(null), sim = useRef([]), opts = useRef({});
  opts.current = { speed, slow: hoverSpeed / 100, paused, direction };

  useEffect(() => {
    const a = window.matchMedia('(max-width: 639px)'), b = window.matchMedia('(prefers-reduced-motion: reduce)');
    const f = () => { setRows(a.matches); setStill(b.matches); }; f();
    a.addEventListener('change', f); b.addEventListener('change', f);
    return () => { a.removeEventListener('change', f); b.removeEventListener('change', f); };
  }, []);
  const n = rows ? 2 : Math.max(1, Math.min(4, columns));
  const buckets = useMemo(() => { const out = Array.from({ length: n }, () => []); items.forEach((t, i) => out[i % n].push(t)); return out; }, [items, n]);

  /* Moteur : un rAF, colonnes en sens opposés, vitesse lissée vers la cible */
  useEffect(() => {
    if (still || !wall.current) return undefined;
    const cols = [...wall.current.querySelectorAll('[data-col]')];
    sim.current = cols.map((el, i) => ({ el, track: el.firstChild, off: (i * 137) % 400, f: 1, target: 1, size: 0, drag: null }));
    const measure = () => sim.current.forEach((c) => { const copy = c.track.firstChild; c.size = (rows ? copy.offsetWidth : copy.offsetHeight) + (rows ? 12 : 16); });
    const paint = () => sim.current.forEach((c) => { if (!c.size) return; const o = ((c.off % c.size) + c.size) % c.size; c.track.style.transform = rows ? `translate3d(${-o}px,0,0)` : `translate3d(0,${-o}px,0)`; });
    const dirOf = (i) => (opts.current.direction === 'meme' ? -1 : i % 2 ? 1 : -1);
    let raf = 0, last = 0, visible = true, focus = false;
    const tick = (now) => {
      raf = 0; const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      const hold = opts.current.paused || focus;
      sim.current.forEach((c, i) => { if (c.drag) return; c.f += ((hold ? 0 : c.target) - c.f) * Math.min(1, dt * 4.5); c.off -= dirOf(i) * opts.current.speed * c.f * dt; });
      paint(); if (visible && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const start = () => { if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(tick); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const offs = [];
    const on = (el, ev, fn) => { el.addEventListener(ev, fn); offs.push(() => el.removeEventListener(ev, fn)); };
    sim.current.forEach((c) => {
      on(c.el, 'pointerenter', (e) => { if (e.pointerType === 'mouse') c.target = opts.current.slow; });
      on(c.el, 'pointerleave', () => { c.target = 1; });
      on(c.el, 'pointerdown', (e) => { if (e.pointerType === 'mouse' && !rows) return; c.drag = { id: e.pointerId, start: rows ? e.clientX : e.clientY, off: c.off, moved: false }; c.target = 0; c.f = 0; });
      on(c.el, 'pointermove', (e) => { const d = c.drag; if (!d || e.pointerId !== d.id) return; const delta = (rows ? e.clientX : e.clientY) - d.start; if (!d.moved && Math.abs(delta) > 6) { d.moved = true; try { c.el.setPointerCapture(e.pointerId); } catch {} } if (d.moved) { c.off = d.off - delta; paint(); } });
      const up = (e) => { if (c.drag && e.pointerId === c.drag.id) { c.drag = null; c.target = 1; } };
      on(c.el, 'pointerup', up); on(c.el, 'pointercancel', up);
    });
    on(wall.current, 'focusin', () => { focus = true; }); on(wall.current, 'focusout', () => { focus = false; });
    const vis = () => (document.hidden ? stop() : start()); document.addEventListener('visibilitychange', vis);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }); io.observe(wall.current);
    const ro = new ResizeObserver(() => { measure(); paint(); }); ro.observe(wall.current);
    measure(); paint(); start();
    return () => { stop(); io.disconnect(); ro.disconnect(); offs.forEach((f) => f()); document.removeEventListener('visibilitychange', vis); };
  }, [buckets, rows, still]);

  const maskCls = !mask || still ? '' : rows ? '[mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]' : '[mask-image:linear-gradient(transparent,#000_14%,#000_86%,transparent)]';
  return (
    <section aria-labelledby="mc-title" className={`mx-auto w-full max-w-[1200px] px-4 pb-10 pt-12 font-[family-name:var(--font-sans)] text-[var(--text)] sm:px-10 sm:py-[72px] ${className}`}>
      <header className="grid justify-items-center text-center">
        <span className="mb-5 inline-flex items-center gap-2 text-[var(--text-strong)] sm:mb-6">
          <svg viewBox="0 0 100 100" aria-hidden="true" className="h-7 w-7"><rect width="100" height="100" rx="28" fill="var(--accent)" /><path d="M30 70c0-14 40-12 40-28 0-8-6-12-12-12" fill="none" stroke="var(--accent-fg)" strokeWidth="7" strokeLinecap="round" /><circle cx="30" cy="70" r="8" fill="var(--accent-fg)" /><circle cx="58" cy="30" r="8" fill="var(--accent-fg)" /></svg>
          <span className="text-lg font-semibold tracking-[-0.03em]">escale</span>
        </span>
        <h2 id="mc-title" className="max-w-[20ch] text-balance text-[clamp(2rem,1.5rem+1.6vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-[var(--text-strong)]">Ils sont partis en train, ils racontent</h2>
        <div className="mt-5 flex flex-col items-center gap-1.5 text-[15px] tabular-nums text-[var(--text-muted)] sm:flex-row sm:gap-2.5">
          <span aria-hidden="true" className="inline-flex gap-0.5">
            {[1, 1, 1, 1, 0.8].map((v, i) => <i key={i} className="h-4 w-4" style={{ clipPath: STAR, background: v < 1 ? 'linear-gradient(90deg, var(--accent) 80%, var(--border-control) 80%)' : 'var(--accent)' }} />)}
          </span>
          <span><strong className="font-semibold text-[var(--text-strong)]">4,8 / 5</strong> · 12 400 avis de voyageurs vérifiés</span>
        </div>
      </header>

      <div ref={wall} className={`relative mt-8 grid overflow-hidden sm:mt-12 ${rows ? '-mx-4 grid-cols-1 gap-3' : 'gap-4'} ${maskCls}`}
        style={rows ? undefined : { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, height: still ? 'auto' : height }}>
        {buckets.map((b, i) => (
          <div key={`${n}-${i}`} data-col className={`relative min-w-0 ${rows ? (still ? 'snap-x snap-mandatory overflow-x-auto pb-1' : 'cursor-grab touch-pan-y overflow-hidden active:cursor-grabbing') : 'touch-pan-x overflow-hidden'}`}>
            <div className={`flex will-change-transform ${rows ? 'w-max flex-row gap-3' : 'flex-col gap-4'} ${still && rows ? 'px-4' : ''}`}>
              {[0, 1].map((copy) => (still && copy ? null : (
                <ul key={copy} role="list" aria-hidden={copy ? true : undefined} className={`m-0 flex list-none p-0 ${rows ? 'flex-row gap-3' : 'flex-col gap-4'}`}>
                  {b.map((a) => <Card key={a.who} a={a} rows={rows} />)}
                </ul>
              )))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:mt-8">
        {!still && (
          <button type="button" aria-pressed={paused} onClick={() => setPaused((p) => !p)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] py-0 pl-3 pr-4 text-[15px] font-medium text-[var(--text-strong)] transition-colors hover:bg-[var(--raised)] ${focusRing}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.75]"><path d={paused ? 'M8 5.5v13l10-6.5Z' : 'M9 6v12M15 6v12'} /></svg>
            {paused ? 'Reprendre le défilement' : 'Mettre en pause'}
          </button>
        )}
        <a href="#" className={`text-[15px] font-medium text-[var(--text-strong)] underline decoration-[var(--border-control)] underline-offset-[3px] hover:decoration-current ${focusRing}`}>Lire les 12 400 avis</a>
      </div>
    </section>
  );
}

export default MurColonnes;
