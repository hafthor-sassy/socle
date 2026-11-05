// AccordeonNatif.jsx — FAQ sur details / summary natifs : exclusive (attribut name), hauteur animée en CSS pur
// (::details-content + interpolate-size) ou par Web Animations en repli, plus → moins, lien direct par question.
// React 18, Tailwind 3.4, tokens.css chargé. Sans bibliothèque. Exemple : Abri (assurance habitation, marque fictive).
// Utilisation :
//   <AccordeonNatif exclusive={true} icon="plus" duration={320} variant="lignes" links={true} />
//   <AccordeonNatif items={[{ id: 'delai', q: '…', a: <p>…</p> }]} />
import { useEffect, useRef, useState } from 'react';

export const ITEMS = [
  { id: 'delai', q: 'Combien de temps faut-il pour être assuré\u00a0?', a: <p>Quatre minutes en moyenne. Vous répondez à huit questions sur votre logement, vous choisissez votre formule et votre attestation arrive par e-mail dès le paiement validé, prête à envoyer à votre propriétaire ou à votre agence.</p> },
  { id: 'formule-essentielle', q: 'Que couvre la formule Essentielle\u00a0?', a: <><p>Les garanties que la loi et votre bail attendent, sans option inutile&nbsp;:</p><ul className="mt-2 list-disc pl-5 marker:text-[var(--accent)] [&>li]:mt-1"><li>dégâts des eaux, incendie et explosion&nbsp;;</li><li>vol et vandalisme après effraction&nbsp;;</li><li>bris de vitres et de miroirs&nbsp;;</li><li>responsabilité civile de toute la famille.</li></ul></> },
  { id: 'locataire', q: 'Je suis locataire : que dois-je donner à mon propriétaire\u00a0?', a: <p>Votre attestation d’assurance, chaque année. Elle est disponible à tout moment dans votre espace et se renouvelle seule à la date anniversaire&nbsp;; vous pouvez aussi l’envoyer directement depuis l’application.</p> },
  { id: 'sinistre', q: 'Comment déclarer un sinistre\u00a0?', a: <p>Depuis l’application, en photographiant les dégâts&nbsp;: la déclaration prend trois minutes. Un gestionnaire vous répond sous 48&nbsp;heures et, pour les petits sinistres, le remboursement part par virement le jour même de l’accord.</p> },
  { id: 'resiliation', q: 'Puis-je résilier à tout moment\u00a0?', a: <p>Oui, dès la fin de la première année, sans frais ni justificatif. Si vous venez d’un autre assureur, nous nous occupons de résilier votre ancien contrat à votre place.</p> },
  { id: 'objets-valeur', q: 'Mes objets de valeur sont-ils couverts\u00a0?', a: <p>Jusqu’à 3&nbsp;000&nbsp;€ sans justificatif, bijoux et matériel informatique compris. Au-delà, ajoutez l’option Objets précieux depuis votre espace&nbsp;: elle s’applique dès le lendemain.</p> },
  { id: 'demenagement', q: 'Que se passe-t-il si je déménage\u00a0?', a: <p>Indiquez votre nouvelle adresse et la date du départ&nbsp;: les deux logements sont couverts pendant les trente jours du déménagement, puis le contrat suit votre nouveau logement, avec un tarif recalculé.</p> },
];
const EASE = 'cubic-bezier(.32, .72, 0, 1)';
const NATIVE = typeof CSS !== 'undefined' && CSS.supports('interpolate-size: allow-keywords') && CSS.supports('selector(::details-content)');
const reduced = () => typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function Icon({ open, kind }) {
  const bar = 'absolute left-1/2 top-1/2 h-[1.5px] rounded bg-current transition-[transform,opacity] duration-[var(--an-duree)] [transition-timing-function:cubic-bezier(.32,.72,0,1)]';
  return (
    <span aria-hidden="true" className={`relative size-8 flex-none rounded-full border transition-[transform,background-color,border-color] duration-[var(--an-duree)] [transition-timing-function:cubic-bezier(.32,.72,0,1)] ${open ? 'rotate-180 border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]' : 'border-[var(--border)] text-[var(--text-strong)]'}`}>
      {kind === 'chevron' ? <>
        <i className={`${bar} -ml-[6.6px] -mt-[.75px] w-2 origin-right rotate-[40deg]`} />
        <i className={`${bar} -ml-[1.4px] -mt-[.75px] w-2 origin-left -rotate-[40deg]`} />
      </> : <>
        <i className={`${bar} -ml-1.5 -mt-[.75px] w-3`} />
        <i className={`${bar} -ml-1.5 -mt-[.75px] w-3 ${open ? 'scale-x-[.2] opacity-0' : 'rotate-90'}`} />
      </>}
    </span>
  );
}

/**
 * @param {{ items?: { id: string, q: string, a: React.ReactNode }[], exclusive?: boolean, icon?: 'plus'|'chevron', duration?: number,
 *   variant?: 'lignes'|'cartes', links?: boolean, defaultOpen?: string[], name?: string, className?: string }} props
 */
export default function AccordeonNatif({ items = ITEMS, exclusive = true, icon = 'plus', duration = 320, variant = 'lignes', links = true,
  defaultOpen = ['delai'], name = 'faq-abri', className = '' }) {
  const [open, setOpen] = useState(() => new Set(defaultOpen));
  const [flash, setFlash] = useState(null), [copied, setCopied] = useState(null);
  const refs = useRef({}), anims = useRef({});
  const cards = variant === 'cartes';

  /* Repli : anime la hauteur de la réponse quand le CSS ne sait pas le faire. */
  const animate = (id, to) => {
    const d = refs.current[id]; if (!d) return;
    const a = d.querySelector('[data-a]'), cur = d.open ? a.getBoundingClientRect().height : 0;
    anims.current[id]?.cancel();
    if (NATIVE || reduced()) { d.open = to; return; }
    if (!to && !d.open) return;
    if (to) d.open = true;
    const full = a.offsetHeight, end = to ? full : 0;
    a.style.overflow = 'hidden';
    const anim = a.animate([{ height: `${cur}px`, opacity: to ? Math.max(0.2, cur / full) : 1 }, { height: `${end}px`, opacity: to ? 1 : 0 }], { duration: duration * Math.max(0.4, Math.abs(end - cur) / full), easing: EASE });
    anims.current[id] = anim;
    anim.onfinish = () => { a.style.overflow = ''; if (!to) d.open = false; };
  };
  const toggle = (id, to = !open.has(id)) => {
    setOpen((s) => {
      const n = new Set(exclusive ? [] : s);
      if (exclusive) s.forEach((o) => o !== id && animate(o, false));
      to ? n.add(id) : n.delete(id); return n;
    });
    animate(id, to);
  };

  /* Lien direct : #sinistre ouvre la question, la centre et l'éclaire. */
  useEffect(() => {
    const go = () => {
      const id = decodeURIComponent(location.hash.slice(1)); if (!items.some((x) => x.id === id)) return;
      toggle(id, true); refs.current[id]?.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
      setFlash(null); requestAnimationFrame(() => setFlash(id));
    };
    go(); window.addEventListener('hashchange', go); return () => window.removeEventListener('hashchange', go);
  }, [items, exclusive]);
  useEffect(() => { if (exclusive && open.size > 1) setOpen((s) => new Set([[...s][0]])); }, [exclusive]);

  const copy = async (id) => {
    const url = `${location.href.split('#')[0]}#${id}`;
    try { history.replaceState(null, '', `#${id}`); await navigator.clipboard.writeText(url); setCopied({ id, msg: 'Lien copié' }); }
    catch { setCopied({ id, msg: `Lien prêt : #${id}` }); }
    setTimeout(() => setCopied((c) => (c?.id === id ? null : c)), 2000);
  };
  const allOpen = open.size === items.length;

  return (
    <section aria-labelledby="an-titre" style={{ '--an-duree': `${reduced() ? 0 : duration}ms`, interpolateSize: 'allow-keywords' }}
      className={`mx-auto flex w-full max-w-[1120px] flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 pb-6 pt-8 font-sans text-[var(--text)] sm:rounded-2xl sm:p-10 lg:grid lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-16 lg:p-16 ${className}`}>
      <div className="contents lg:sticky lg:top-8 lg:flex lg:flex-col lg:gap-4 lg:self-start">
        <a href="#accueil" aria-label="Abri, accueil" className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg text-base font-semibold tracking-[-.01em] text-[var(--text-strong)] no-underline lg:mb-2">
          <svg viewBox="0 0 100 100" aria-hidden="true" className="size-6"><rect width="100" height="100" rx="28" fill="var(--accent)" /><path d="M20 50a30 30 0 0 1 60 0z" fill="var(--accent-fg)" /><path d="M50 50v18a7 7 0 0 1-14 0" fill="none" stroke="var(--accent-fg)" strokeWidth="7" strokeLinecap="round" /></svg>
          Abri
        </a>
        <h2 id="an-titre" className="mt-2 text-[28px] font-semibold leading-[34px] tracking-[-.03em] text-[var(--text-strong)] sm:text-[clamp(28px,1.6vw+16px,40px)] sm:leading-[1.1] lg:mt-0">Questions fréquentes</h2>
        <p className="mt-3 text-pretty text-[15px] leading-[22px] text-[var(--text-muted)] sm:text-base sm:leading-6 lg:mt-0">Tout ce qu’il faut savoir avant d’assurer votre logement. Mis à jour le 3&nbsp;novembre&nbsp;2026.</p>
        {!exclusive && (
          <button type="button" aria-pressed={allOpen} onClick={() => { const to = !allOpen; setOpen(new Set(to ? items.map((x) => x.id) : [])); items.forEach((x) => animate(x.id, to)); }}
            className="mt-4 h-9 self-start rounded-lg border border-[var(--border-control)] bg-[var(--surface)] px-3.5 text-sm font-medium text-[var(--text-strong)] hover:bg-[var(--state-hover)] lg:mt-0">
            {allOpen ? 'Tout fermer' : 'Tout ouvrir'}
          </button>
        )}
        <div className="order-2 mt-6 grid gap-1 rounded-xl bg-[var(--raised)] p-5 lg:order-none">
          <p className="font-semibold text-[var(--text-strong)]">Votre question n’y est pas&nbsp;?</p>
          <p className="text-[15px] leading-[22px] text-[var(--text-muted)]">Un conseiller vous répond en moyenne en 6&nbsp;minutes, du lundi au samedi.</p>
          <a href="#contact" className="group -mb-2.5 inline-flex min-h-11 items-center gap-1.5 justify-self-start text-[15px] font-medium text-[var(--accent)] no-underline">Écrire à un conseiller<svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 fill-none stroke-current stroke-[1.5] transition-transform group-hover:translate-x-[3px]" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h10M9 4l4 4-4 4" /></svg></a>
        </div>
      </div>

      <div className={`order-1 mt-6 grid isolate lg:order-none lg:mt-0 ${cards ? 'gap-2' : 'border-t border-[var(--border)]'}`}>
        {items.map((it) => {
          const isOpen = open.has(it.id);
          return (
            <details key={it.id} id={it.id} ref={(n) => (refs.current[it.id] = n)} name={exclusive && NATIVE ? name : undefined} open={defaultOpen.includes(it.id) || undefined}
              onToggle={(e) => { if (NATIVE && e.currentTarget.open !== isOpen) setOpen((s) => { const n = new Set(exclusive ? [] : s); e.currentTarget.open ? n.add(it.id) : n.delete(it.id); return n; }); }}
              className={`group/q relative before:pointer-events-none before:absolute before:-inset-x-3 before:inset-y-0 before:-z-10 before:rounded-xl before:bg-[var(--accent-subtle)] before:opacity-0 ${flash === it.id ? 'before:animate-[an-flash_1600ms_ease-out]' : ''}
                [&::details-content]:overflow-clip [&::details-content]:[block-size:0] [&::details-content]:[transition:block-size_var(--an-duree)_cubic-bezier(.32,.72,0,1),content-visibility_var(--an-duree)_allow-discrete] [&[open]::details-content]:[block-size:auto]
                ${cards ? `rounded-xl border border-[var(--border)] transition-colors ${isOpen ? 'bg-[var(--raised)]' : 'bg-[var(--surface)]'}` : 'border-b border-[var(--border)]'}`}>
              <summary onClick={(e) => { if (!NATIVE) { e.preventDefault(); toggle(it.id); } }}
                className={`flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 rounded-lg [-webkit-tap-highlight-color:transparent] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] sm:gap-6 [&::-webkit-details-marker]:hidden ${cards ? 'py-3.5 pl-4 pr-3.5 sm:py-4 sm:pl-5 sm:pr-4' : 'py-4 pr-1'}`}>
                <span className="text-pretty text-base font-medium leading-[22px] tracking-[-.01em] text-[var(--text-strong)] transition-colors sm:text-[17px] sm:leading-6 [@media(hover:hover)]:group-hover/q:text-[var(--accent)]">{it.q}</span>
                <Icon open={isOpen} kind={icon} />
              </summary>
              <div data-a className={`text-[15px] leading-6 sm:text-base sm:leading-[26px] [&_p]:max-w-[62ch] [&_p]:text-pretty ${cards ? 'px-4 pb-4 sm:pb-5 sm:pl-5 sm:pr-14' : 'pb-5 sm:pb-6 sm:pr-16'}`}>
                {it.a}
                {links && (
                  <button type="button" onClick={() => copy(it.id)}
                    className={`-mb-3 mt-1 inline-flex min-h-11 items-center gap-1.5 text-[13px] font-medium transition-[opacity,color] focus-visible:opacity-100 sm:opacity-0 sm:group-hover/q:opacity-100 ${copied?.id === it.id ? 'text-[var(--accent)] sm:opacity-100' : 'text-[var(--text-muted)] hover:text-[var(--accent)]'}`}>
                    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 fill-none stroke-current stroke-[1.5]" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 9.5l3-3M7 4.5l1-1a2.8 2.8 0 0 1 4 4l-1 1M9 11.5l-1 1a2.8 2.8 0 0 1-4-4l1-1" /></svg>
                    {copied?.id === it.id ? copied.msg : 'Copier le lien de la question'}
                  </button>
                )}
              </div>
            </details>
          );
        })}
      </div>
      <p aria-live="polite" className="sr-only">{copied?.msg || ''}</p>
      <style>{'@keyframes an-flash{0%,30%{opacity:1}to{opacity:0}}'}</style>
    </section>
  );
}
