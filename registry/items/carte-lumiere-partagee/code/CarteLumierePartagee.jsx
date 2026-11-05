// CarteLumierePartagee.jsx — une seule source de lumière pour toute une rangée de cartes.
// React 18, Tailwind 3.4, tokens.css chargé. Aucune dépendance d'animation.
// Marque fictive : Équipage (logiciel RH).
// Utilisation :
//   <CarteLumierePartagee radius={320} intensity={0.9} borderWidth={1} inertia={0.16} inner={true} source="accent" />
import { useEffect, useRef } from 'react';

const FEATURES = [
  { titre: 'Onboarding sans papier', texte: 'Contrat signé en ligne, ordinateur commandé, accès ouverts\u00a0: le nouvel arrivant a tout dès son premier matin.', kpi: 'J-7', kpiTexte: 'tout est prêt', href: '#onboarding', icon: 'M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20zM14 3.5V8h4M10 13l1.75 1.75L15 11.5' },
  { titre: 'Congés et absences', texte: 'Une demande en deux gestes, validée depuis Slack ou Teams. Les soldes se recalculent seuls, jours fériés compris.', kpi: '−80 %', kpiTexte: 'de relances', href: '#conges', icon: 'M5.5 5h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3.5 10h17M8 3v4M16 3v4M8.5 14.5h3' },
  { titre: 'Indicateurs sociaux', texte: 'Index égalité, turnover, absentéisme\u00a0: calculés chaque mois et prêts pour le CSE, sans export Excel.', kpi: '12', kpiTexte: 'indicateurs suivis', href: '#indicateurs', icon: 'M4 19.5h16M6.5 16V11M11.5 16V7M16.5 16v-6' },
  { titre: 'Paie connectée', texte: 'Variables de paie contrôlées puis envoyées à votre logiciel ou à votre cabinet le 25, chaque mois, sans ressaisie.', kpi: '0', kpiTexte: 'ressaisie', href: '#paie', icon: 'M5 20.5V9.5L12 4l7 5.5v11M9.5 20.5v-5h5v5' },
  { titre: 'Organigramme vivant', texte: 'Qui fait quoi, qui remplace qui pendant les vacances\u00a0: l’organigramme suit les arrivées et les départs.', kpi: '340', kpiTexte: 'collaborateurs', href: '#organigramme', icon: 'M12 4a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM6 15a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM18 15a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM12 9v3.5M6 15v-1.5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1V15' },
  { titre: 'Entretiens préparés', texte: 'L’assistant rassemble objectifs, retours et formations suivies\u00a0: le manager arrive avec une synthèse, pas une page blanche.', kpi: '12 min', kpiTexte: 'de préparation', href: '#entretiens', icon: 'M12 3.5l1.9 4.6 4.6 1.9-4.6 1.9L12 16.5l-1.9-4.6L5.5 10l4.6-1.9zM18 15.5l.8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8z' },
];

/* Halo du bord (masqué à l'épaisseur du bord) et lueur intérieure, lus depuis les variables de la carte. */
const RING = 'radial-gradient(var(--lum-r) circle at calc(var(--lx) + 1px) calc(var(--ly) + 1px), color-mix(in srgb, var(--lum-c) calc(var(--lum-i) * 100%), transparent), color-mix(in srgb, var(--lum-c) calc(var(--lum-i) * 60%), transparent) 30%, transparent 74%)';
const GLOW = 'radial-gradient(calc(var(--lum-r) * 1.1) circle at var(--lx) var(--ly), color-mix(in srgb, var(--lum-c) calc(var(--lum-i) * 13%), transparent), transparent 70%)';
const MASK = 'linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)';

/**
 * @param {{ items?: typeof FEATURES, radius?: number, intensity?: number, borderWidth?: number,
 *   inner?: boolean, inertia?: number, source?: 'accent'|'neutre' }} props
 */
export default function CarteLumierePartagee({ items = FEATURES, radius = 320, intensity = 0.9, borderWidth = 1, inner = true, inertia = 0.16, source = 'accent' }) {
  const rootRef = useRef(null);
  const opts = useRef({ radius, inertia }); opts.current = { radius, inertia };

  useEffect(() => {
    const root = rootRef.current; if (!root) return undefined;
    const cards = [...root.querySelectorAll('[data-lum-card]')];
    const tgt = { x: -9999, y: -9999 }, cur = { x: -9999, y: -9999 };
    let raf = 0, visible = true, jump = true;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const paint = () => cards.forEach((c) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--lx', `${(cur.x - r.left).toFixed(1)}px`);
      c.style.setProperty('--ly', `${(cur.y - r.top).toFixed(1)}px`);
      const dx = Math.max(r.left - cur.x, 0, cur.x - r.right), dy = Math.max(r.top - cur.y, 0, cur.y - r.bottom);
      c.style.setProperty('--near', Math.max(0, 1 - Math.hypot(dx, dy) / (opts.current.radius * 0.6)).toFixed(3));
    });
    const frame = () => {
      raf = 0;
      const k = reduced() ? 1 : 1 - Math.min(0.95, opts.current.inertia);
      if (jump) { cur.x = tgt.x; cur.y = tgt.y; jump = false; }
      cur.x += (tgt.x - cur.x) * k; cur.y += (tgt.y - cur.y) * k;
      paint();
      if (visible && Math.abs(tgt.x - cur.x) + Math.abs(tgt.y - cur.y) > 0.6) raf = requestAnimationFrame(frame);
    };
    const aim = (x, y) => { tgt.x = x; tgt.y = y; if (!raf) raf = requestAnimationFrame(frame); };
    const light = (v) => root.style.setProperty('--lum-o', v);
    const onMove = (e) => { if (e.pointerType === 'touch') return; if (root.style.getPropertyValue('--lum-o') !== '1') { light(1); jump = true; } aim(e.clientX, e.clientY); };
    const onLeave = (e) => { if (e.pointerType !== 'touch') light(0); };
    const onTouch = (e) => { const t = e.touches[0]; light(1); aim(t.clientX, t.clientY); };
    const sweep = () => { /* au toucher, la source suit le défilement */
      if (!coarse || !visible) return;
      const r = root.querySelector('ul').getBoundingClientRect();
      aim(r.left + r.width * 0.72, Math.min(r.bottom - 24, Math.max(r.top + 24, window.innerHeight * 0.42))); light(1);
    };
    const onFocus = (e) => { const c = e.target.closest('[data-lum-card]'); if (!c) return; const r = c.getBoundingClientRect(); light(1); aim(r.left + r.width / 2, r.top + r.height * 0.2); };
    const onBlur = (e) => { if (!root.contains(e.relatedTarget) && !coarse) light(0); };
    root.addEventListener('pointermove', onMove); root.addEventListener('pointerleave', onLeave);
    root.addEventListener('touchstart', onTouch, { passive: true }); root.addEventListener('touchmove', onTouch, { passive: true });
    root.addEventListener('focusin', onFocus); root.addEventListener('focusout', onBlur);
    window.addEventListener('scroll', sweep, { passive: true }); window.addEventListener('resize', paint);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) sweep(); });
    io.observe(root); sweep();
    return () => {
      cancelAnimationFrame(raf); io.disconnect();
      root.removeEventListener('pointermove', onMove); root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('touchstart', onTouch); root.removeEventListener('touchmove', onTouch);
      root.removeEventListener('focusin', onFocus); root.removeEventListener('focusout', onBlur);
      window.removeEventListener('scroll', sweep); window.removeEventListener('resize', paint);
    };
  }, [items]);

  return (
    <section ref={rootRef} aria-labelledby="lum-title" className="mx-auto grid w-full max-w-[1120px] gap-8 font-sans text-[var(--text)] sm:gap-10"
      style={{ '--lum-r': `${radius}px`, '--lum-i': intensity, '--lum-b': `${borderWidth}px`, '--lum-c': source === 'neutre' ? 'var(--text-strong)' : 'var(--accent-vivid)' }}>
      <header className="grid max-w-[640px] gap-3">
        <p className="m-0 inline-flex items-center gap-2.5 font-mono text-[13px] uppercase tracking-[0.04em] text-[var(--text-muted)]">
          <svg viewBox="0 0 100 100" className="h-6 w-6 flex-none" aria-hidden="true"><rect width="100" height="100" rx="28" fill="var(--accent)" /><g fill="none" stroke="var(--accent-fg)" strokeWidth="7" strokeLinecap="round"><circle cx="38" cy="38" r="10" /><path d="M20 74c0-10 8-17 18-17s18 7 18 17" /></g><g fill="var(--accent-fg)" opacity=".7"><circle cx="64" cy="42" r="8.5" /><path d="M52 74c1.5-8.5 6.5-14 13-14 7.5 0 13 6 14 14z" /></g></svg>
          Équipage · logiciel RH
        </p>
        <h2 id="lum-title" className="m-0 text-balance text-[clamp(1.75rem,1.3rem+1.8vw,2.5rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-[var(--text-strong)]">Tout le parcours du salarié, au même endroit.</h2>
        <p className="m-0 text-base text-[var(--text-muted)]">De la signature du contrat à l’entretien annuel, chaque étape est reliée à la suivante. Vos équipes RH gagnent un jour par semaine.</p>
      </header>
      <ul role="list" className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4 p-0">
        {items.map((f) => (
          <li key={f.titre} data-lum-card
            className="group relative isolate grid grid-cols-[40px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-transform duration-300 [--lx:-999px] [--ly:-999px] focus-within:-translate-y-0.5 motion-reduce:transition-none sm:min-h-[248px] sm:grid-cols-1 sm:grid-rows-[auto_auto_1fr_auto] sm:items-stretch sm:gap-2 sm:p-6">
            <span aria-hidden="true" className="pointer-events-none absolute inset-[-1px] z-[1] rounded-[inherit] transition-opacity duration-[420ms] motion-reduce:transition-none"
              style={{ padding: 'var(--lum-b)', background: RING, WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', mask: MASK, opacity: 'var(--lum-o, 0)' }} />
            {inner && <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-[1] rounded-[inherit] transition-opacity duration-[420ms]" style={{ background: GLOW, opacity: 'var(--lum-o, 0)' }} />}
            <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-xl sm:mb-4"
              style={{ background: 'color-mix(in srgb, var(--lum-c) calc(var(--near, 0) * var(--lum-o, 0) * 12%), var(--raised))', color: 'color-mix(in srgb, var(--lum-c) calc(var(--near, 0) * var(--lum-o, 0) * 100%), var(--text-strong))' }}>
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon} /></svg>
            </span>
            <h3 className="m-0 text-[clamp(1.25rem,1.18rem+.3vw,1.375rem)] font-semibold leading-[1.3] tracking-[-0.01em] text-[var(--text-strong)]">
              <a href={f.href} className="text-inherit no-underline outline-none after:absolute after:inset-0 after:z-[2] after:rounded-2xl focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-[var(--focus-ring)]">{f.titre}</a>
            </h3>
            <p className="col-span-full m-0 text-sm leading-[1.375rem] text-[var(--text-muted)] sm:col-span-1">{f.texte}</p>
            <p className="col-span-full m-0 mt-1 border-t border-[var(--border)] pt-3 text-sm text-[var(--text-muted)] sm:col-span-1 sm:mt-4 sm:pt-4">
              <span className="mr-1.5 font-mono font-semibold tabular-nums text-[var(--text-strong)]">{f.kpi}</span>{f.kpiTexte}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
