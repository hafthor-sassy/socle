// CarteChemise.jsx — la carte s'ouvre comme une chemise cartonnée : le rabat bascule sur un ressort,
// les pièces sortent l'une après l'autre en éventail. React 18, Tailwind 3.4, tokens.css chargé.
// Aucune dépendance d'animation (ressorts maison, rAF arrêté au repos). Marque fictive : Liasse.
// Utilisation :
//   <CarteChemise angle={58} fan={5} stiffness={260} damping={19} stagger={55} mode="clic" unique={false} />
import { useEffect, useRef, useState } from 'react';

export const DOSSIERS = [
  { id: 'lefevre', nom: 'Maison Lefèvre', sous: 'SARL · boulangerie · Lyon 4e', onglet: 'Clôture 2025', statut: 'warn', statutTexte: 'À valider', recu: 8, total: 11, echeance: 'Échéance 15 déc.',
    pieces: [{ t: 'pdf', nom: 'Bilan 2025.pdf', meta: 'Reçu le 3 nov. · 412 Ko' }, { t: 'xls', nom: 'Grand livre.xlsx', meta: 'Reçu le 2 nov. · 1,8 Mo' }, { t: 'pdf', nom: 'Relevés bancaires T4.pdf', meta: 'Reçu hier · 236 Ko' }] },
  { id: 'sorel', nom: 'Atelier Sorel', sous: 'SAS · menuiserie · Villeurbanne', onglet: 'TVA · T3', statut: 'ok', statutTexte: 'Prêt à déposer', recu: 14, total: 14, echeance: 'Échéance 24 nov.',
    pieces: [{ t: 'pdf', nom: 'Déclaration CA3.pdf', meta: 'Généré ce matin · 88 Ko' }, { t: 'zip', nom: 'Factures fournisseurs.zip', meta: '42 factures · 9,4 Mo' }, { t: 'pdf', nom: 'Notes de frais.pdf', meta: 'Reçu le 30 oct. · 640 Ko' }] },
  { id: 'nadal', nom: 'Studio Nadal', sous: 'EI · photographe · Lyon 7e', onglet: 'Paie · octobre', statut: 'err', statutTexte: 'Incomplet', recu: 3, total: 6, echeance: 'Échéance 5 nov.',
    pieces: [{ t: 'pdf', nom: 'Bulletins d’octobre.pdf', meta: '2 salariés · 310 Ko' }, { t: 'xml', nom: 'DSN octobre.xml', meta: 'Brouillon · 24 Ko' }, { t: 'xls', nom: 'Variables de paie.xlsx', meta: 'Manque\u00a0: heures sup.' }] },
];
const TYPE = { pdf: 'bg-[var(--tint-red-bg)] text-[var(--tint-red-fg)]', xls: 'bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]', zip: 'bg-[var(--tint-neutral-bg)] text-[var(--tint-neutral-fg)]', xml: 'bg-[var(--tint-blue-bg)] text-[var(--tint-blue-fg)]' };
const STATUS = {
  ok: ['bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]', 'M5.5 12.5l4 4 9-9'],
  warn: ['bg-[var(--tint-amber-bg)] text-[var(--tint-amber-fg)]', 'M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM12 8v4.5l2.5 1.5'],
  err: ['bg-[var(--tint-red-bg)] text-[var(--tint-red-fg)]', 'M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM12 8v5M12 16v.01'],
};
const PEEK = 0.3;
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function Chemise({ d, open, onToggle, angle, fan, stiffness, damping, stagger, mode }) {
  const ref = useRef(null), docRefs = useRef([]), btnRef = useRef(null), docsRef = useRef(null);
  const [hover, setHover] = useState(false);
  const sim = useRef({ p: { x: 0, v: 0, t: 0 }, d: [0, 1, 2].map(() => ({ x: 0, v: 0, t: 0, next: null, at: 0 })), raf: 0, last: 0 });
  const cfg = useRef({}); cfg.current = { angle, fan, stiffness, damping };

  const paint = () => {
    const el = ref.current; if (!el) return;
    const { p, d: ds } = sim.current, { angle: A, fan: F } = cfg.current, narrow = el.offsetWidth < 360;
    el.style.setProperty('--p', p.x.toFixed(4));
    el.querySelector('[data-front]').style.transform = `rotateX(${(-p.x * A).toFixed(2)}deg)`;
    ds.forEach((s, i) => {
      const n = docRefs.current[i]; if (!n) return;
      const off = i - 1, x = Math.max(-0.05, s.x);
      n.style.transform = `translate(${off * x * (narrow ? 6 : 16) + i * 4 - 4}px, ${i * 10 - x * (96 - i * 26)}px) rotate(${off * x * F * (narrow ? 0.55 : 1)}deg)`;
      n.style.boxShadow = `0 ${x * 10}px ${x * 24}px color-mix(in srgb, var(--text-strong) ${x * 10}%, transparent)`;
    });
  };
  const step = (now) => {
    const st = sim.current; st.raf = 0;
    const dt = Math.min(0.05, (now - (st.last || now)) / 1000) || 0.016; st.last = now;
    const { stiffness: K, damping: C } = cfg.current, h = dt / 4;
    let busy = false;
    st.d.forEach((s) => { if (s.next != null && now >= s.at) { s.t = s.next; s.next = null; } if (s.next != null) busy = true; });
    for (let i = 0; i < 4; i++) {
      st.p.v += (K * (st.p.t - st.p.x) - C * st.p.v) * h; st.p.x += st.p.v * h;
      st.d.forEach((s) => { s.v += (K * 0.8 * (s.t - s.x) - C * 0.9 * s.v) * h; s.x += s.v * h; });
    }
    paint();
    [st.p, ...st.d].forEach((s) => { if (Math.abs(s.t - s.x) + Math.abs(s.v) > 8e-4) busy = true; });
    if (busy) st.raf = requestAnimationFrame(step); else st.last = 0;
  };
  useEffect(() => {
    const st = sim.current, now = performance.now();
    st.p.t = open ? 1 : hover ? PEEK : 0;
    st.d.forEach((s, i) => { s.next = open ? 1 : hover ? 0.18 + i * 0.04 : 0; s.at = now + (open ? i : 2 - i) * stagger; });
    if (reduced()) { st.p.x = st.p.t; st.d.forEach((s) => { s.t = s.next; s.next = null; s.x = s.t; }); paint(); return; }
    if (!st.raf) { st.last = 0; st.raf = requestAnimationFrame(step); }
  }, [open, hover, stagger]);
  useEffect(() => { paint(); return () => cancelAnimationFrame(sim.current.raf); }, [angle, fan]);
  useEffect(() => { if (open && btnRef.current === document.activeElement) setTimeout(() => docRefs.current[2]?.focus({ preventScroll: true }), 240); }, [open]);

  /* inert posé à la main : compatible React 18 et 19 */
  useEffect(() => { docsRef.current?.toggleAttribute('inert', !open); }, [open]);
  const mouse = (fn) => (e) => { if (e.pointerType === 'mouse') fn(); };
  return (
    <article ref={ref} aria-labelledby={`${d.id}-n`} className="relative pt-20 sm:pt-[88px]"
      onPointerEnter={mouse(() => { if (mode === 'survol') onToggle(true); else if (mode !== 'clic-seul') setHover(true); })}
      onPointerLeave={mouse(() => { setHover(false); if (mode === 'survol') onToggle(false); })}
      onKeyDown={(e) => { if (e.key === 'Escape' && open) { e.preventDefault(); onToggle(false); btnRef.current?.focus(); } }}>
      <div className="relative h-[232px] [perspective-origin:50%_0%] [perspective:1100px]">
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 top-[22px] rounded-[4px_16px_16px_16px] border border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)]">
          <span className="absolute -left-px bottom-[calc(100%-1px)] inline-flex h-[30px] items-center whitespace-nowrap rounded-t-xl border border-b-0 border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)] px-4 font-mono text-xs uppercase tracking-[0.04em] text-[var(--text-strong)]">{d.onglet}</span>
        </div>
        <div id={`${d.id}-docs`} ref={docsRef} className="absolute inset-x-4 top-10 h-44 sm:inset-x-5">
          {d.pieces.map((f, i) => (
            <a key={f.nom} href={`#${d.id}-${i}`} ref={(n) => { docRefs.current[i] = n; }}
              className="absolute inset-0 grid origin-bottom grid-cols-[auto_minmax(0,1fr)] grid-rows-[auto_1fr_auto] content-start gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 pb-3 pt-3.5 text-[var(--text)] no-underline outline-none hover:border-[var(--border-control)] focus-visible:z-[3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
              style={{ transform: `translate(${i * 4 - 4}px, ${i * 10}px)` }}>
              <span className={`inline-flex h-[22px] items-center rounded px-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] ${TYPE[f.t]}`}>{f.t === 'xls' ? 'XLSX' : f.t.toUpperCase()}</span>
              <span className="self-center truncate text-sm font-medium text-[var(--text-strong)]">{f.nom}</span>
              <span aria-hidden="true" className="col-span-full grid content-start gap-[7px]"><i className="block h-1.5 rounded-full bg-[var(--raised)]" /><i className="block h-1.5 w-[82%] rounded-full bg-[var(--raised)]" /><i className="block h-1.5 w-[58%] rounded-full bg-[var(--raised)]" /></span>
              <span className="col-span-full font-mono text-xs tabular-nums text-[var(--text-muted)]">{f.meta}</span>
            </a>
          ))}
        </div>
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[120px] rounded-b-2xl" style={{ background: 'linear-gradient(to top, color-mix(in srgb, var(--text-strong) calc((1 - var(--p, 0)) * 14%), transparent), transparent)' }} />
        <div data-front className="absolute inset-x-0 bottom-0 grid h-[168px] origin-bottom grid-rows-[auto_auto_1fr] gap-1 rounded-[12px_12px_16px_16px] border border-[var(--accent-subtle-border)] p-4 [backface-visibility:hidden] sm:p-5"
          style={{ background: 'color-mix(in srgb, var(--accent-subtle) 62%, var(--surface))' }}>
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ background: 'linear-gradient(to bottom, color-mix(in srgb, var(--surface) calc(var(--p, 0) * 55%), transparent), transparent 70%)' }} />
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-[8%] top-full h-[22px] origin-top rounded-[50%]" style={{ background: 'radial-gradient(closest-side, color-mix(in srgb, var(--text-strong) calc(8% + var(--p, 0) * 10%), transparent), transparent)', transform: 'scaleY(calc(.6 + var(--p, 0) * .8))' }} />
          <div className="relative flex items-center justify-between gap-3" style={{ opacity: 'calc(1 - var(--p, 0) * .25)' }}>
            <h3 id={`${d.id}-n`} className="m-0 text-[clamp(1.25rem,1.18rem+.3vw,1.375rem)] font-semibold leading-[1.3] tracking-[-0.01em] text-[var(--text-strong)]">{d.nom}</h3>
            <span className={`inline-flex h-7 flex-none items-center gap-1.5 whitespace-nowrap rounded-full pl-2 pr-2.5 text-[13px] font-medium ${STATUS[d.statut][0]}`}>
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={STATUS[d.statut][1]} /></svg>{d.statutTexte}
            </span>
          </div>
          <p className="relative m-0 text-sm text-[var(--text-muted)]" style={{ opacity: 'calc(1 - var(--p, 0) * .25)' }}>{d.sous}</p>
          <div className="relative flex items-center justify-between gap-4 self-end border-t border-[var(--accent-subtle-border)] pt-3" style={{ opacity: 'calc(1 - var(--p, 0) * .25)' }}>
            <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 sm:max-w-[160px] sm:grid-cols-1">
              <span className="block h-1.5 overflow-hidden rounded-full" style={{ background: 'color-mix(in srgb, var(--accent-subtle-border) 70%, var(--surface))' }}><i className="block h-full rounded-full bg-[var(--accent)]" style={{ width: `${(d.recu / d.total) * 100}%` }} /></span>
              <span className="whitespace-nowrap font-mono text-xs tabular-nums text-[var(--text-muted)]">{d.recu} / {d.total} pièces</span>
            </div>
            <span className="hidden whitespace-nowrap font-mono text-xs tabular-nums text-[var(--text)] sm:inline">{d.echeance}</span>
          </div>
          <button ref={btnRef} type="button" aria-expanded={open} aria-controls={`${d.id}-docs`}
            onClick={() => onToggle(!open)}
            onFocus={(e) => { if (e.currentTarget.matches(':focus-visible')) setHover(true); }} onBlur={() => setHover(false)}
            className="absolute inset-0 w-full cursor-pointer rounded-[inherit] border-0 bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]">
            <span className="sr-only">{open ? 'Fermer' : 'Ouvrir'} le dossier {d.nom}, {d.pieces.length} pièces récentes</span>
          </button>
        </div>
      </div>
    </article>
  );
}

/**
 * @param {{ dossiers?: typeof DOSSIERS, angle?: number, fan?: number, stiffness?: number, damping?: number,
 *   stagger?: number, mode?: 'clic'|'survol'|'clic-seul', unique?: boolean }} props
 */
export default function CarteChemise({ dossiers = DOSSIERS, angle = 58, fan = 5, stiffness = 260, damping = 19, stagger = 55, mode = 'clic', unique = false }) {
  const [opened, setOpened] = useState({});
  const toggle = (id, v) => setOpened((o) => (unique ? { [id]: v } : { ...o, [id]: v }));
  return (
    <section aria-labelledby="chem-title" className="mx-auto grid w-full max-w-[1120px] gap-6 font-sans text-[var(--text)] sm:gap-10">
      <header className="grid max-w-[620px] gap-2.5">
        <p className="m-0 mb-1.5 inline-flex items-center gap-2 text-base font-semibold tracking-[-0.01em] text-[var(--text-strong)]">
          <svg viewBox="0 0 100 100" className="h-[26px] w-[26px]" aria-hidden="true"><path d="M8 22a10 10 0 0 1 10-10h20l10 10h34a10 10 0 0 1 10 10v46a10 10 0 0 1-10 10H18A10 10 0 0 1 8 78z" fill="var(--accent)" opacity=".55" /><path d="M8 40a8 8 0 0 1 8-8h68a8 8 0 0 1 8 8v38a10 10 0 0 1-10 10H18A10 10 0 0 1 8 78z" fill="var(--accent)" /><path d="M26 60h48M26 72h28" fill="none" stroke="var(--accent-fg)" strokeWidth="7" strokeLinecap="round" /></svg>
          Liasse
        </p>
        <h2 id="chem-title" className="m-0 text-[clamp(1.625rem,1.4rem+1vw,2rem)] font-semibold leading-tight tracking-[-0.02em] text-[var(--text-strong)]">Dossiers à traiter cette semaine</h2>
        <p className="m-0 text-base text-[var(--text-muted)]">Ouvrez une chemise pour voir les pièces reçues&#8239;; tout le reste attend dans la bannette.</p>
      </header>
      <ul role="list" className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-x-6 gap-y-6 p-0 sm:gap-y-8">
        {dossiers.map((d) => (
          <li key={d.id}>
            <Chemise d={d} open={!!opened[d.id]} onToggle={(v) => toggle(d.id, v)} angle={angle} fan={fan} stiffness={stiffness} damping={damping} stagger={stagger} mode={mode} />
          </li>
        ))}
      </ul>
    </section>
  );
}
