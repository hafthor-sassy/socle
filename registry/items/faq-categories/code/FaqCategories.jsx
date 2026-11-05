// FaqCategories.jsx — FAQ à catégories collantes : sommaire qui suit la lecture (indicateur à ressort),
// recherche insensible aux accents avec surlignage, réponses à hauteur animée, barre de puces sur mobile.
// React 18, Tailwind 3.4, tokens.css chargé (couleurs par variables). Aucune autre dépendance.
// Exemple : centre d’aide de Tamis (banque fictive pour indépendants).
// Utilisation :
//   <FaqCategories side="gauche" indicator="pastille" counts searchable openFirst offset={0} scroll="doux" />
//   <FaqCategories categories={mesRubriques} title="Questions fréquentes" />
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

/** @typedef {{ id: string, q: string, a: string }} Question */
/** @typedef {{ id: string, title: string, icon?: React.ReactNode, questions: Question[] }} Category */

const Ico = ({ d }) => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: d }} />
);

/** @type {Category[]} */
export const TAMIS_FAQ = [
  { id: 'compte', title: 'Ouverture du compte', icon: <Ico d='<path d="M4 20v-1a6 6 0 0 1 6-6h1"/><circle cx="10" cy="7" r="4"/><path d="M17 15v6M14 18h6"/>' />, questions: [
    { id: 'ouverture-delai', q: 'Combien de temps faut-il pour ouvrir un compte Tamis ?', a: 'Comptez 8 minutes pour la demande en ligne. Nous vérifions votre identité et votre immatriculation sous 24 h ouvrées ; votre IBAN est actif dès la validation, et votre carte virtuelle aussitôt.' },
    { id: 'ouverture-documents', q: 'Quels documents dois-je fournir ?', a: 'Une pièce d’identité en cours de validité et un avis de situation SIRENE de moins de trois mois. Pour une société : les statuts signés et la liste des bénéficiaires effectifs.' },
    { id: 'ouverture-micro', q: 'Puis-je ouvrir un compte en micro-entreprise ?', a: 'Oui, c’est même le cas de deux tiers de nos clients. L’offre Solo est pensée pour les micro-entrepreneurs : un compte dédié, sans frais de tenue, avec le suivi du chiffre d’affaires par rapport aux plafonds.' },
    { id: 'ouverture-iban', q: 'Mon IBAN est-il français ?', a: 'Oui : un IBAN en FR76, accepté par l’URSSAF, les impôts et tous vos clients. Vous pouvez le télécharger en PDF depuis l’application.' },
  ] },
  { id: 'cartes', title: 'Cartes et paiements', icon: <Ico d='<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h3"/>' />, questions: [
    { id: 'cartes-plafonds', q: 'Quels sont les plafonds de ma carte ?', a: 'Par défaut, 3 000 € de paiements et 1 000 € de retraits sur 30 jours glissants. Vous pouvez les relever vous-même jusqu’à 25 000 € depuis l’application, sans appeler personne.' },
    { id: 'cartes-virtuelles', q: 'Puis-je créer des cartes virtuelles ?', a: 'Autant que vous voulez, une par abonnement par exemple. Chaque carte a son propre plafond et se met en pause en un geste.' },
    { id: 'cartes-perte', q: 'Ma carte est perdue : que faire ?', a: 'Bloquez-la depuis l’application : c’est immédiat et réversible. Une carte virtuelle de remplacement est disponible tout de suite, la carte physique arrive sous 4 jours ouvrés.' },
  ] },
  { id: 'virements', title: 'Virements', icon: <Ico d='<path d="M4 8h14l-3-3M20 16H6l3 3"/>' />, questions: [
    { id: 'virements-instantanes', q: 'Les virements instantanés sont-ils inclus ?', a: 'Oui, dans toutes les offres et sans frais : l’argent arrive en moins de 10 secondes, 7 j/7, vers toute banque de la zone SEPA.' },
    { id: 'virements-recurrents', q: 'Comment programmer un virement récurrent ?', a: 'Depuis un bénéficiaire, choisissez « Programmer » puis la fréquence : chaque semaine, chaque mois ou à date fixe. Vous recevez un rappel la veille de chaque envoi.' },
    { id: 'virements-international', q: 'Combien de temps prend un virement international ?', a: 'Hors zone SEPA, comptez un à trois jours ouvrés selon la devise. Le taux de change est affiché avant validation, sans marge cachée.' },
  ] },
  { id: 'factures', title: 'Factures et TVA', icon: <Ico d='<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>' />, questions: [
    { id: 'factures-emettre', q: 'Puis-je émettre mes factures depuis Tamis ?', a: 'Oui. Créez un devis, transformez-le en facture, envoyez-la : elle est au format électronique exigé par la réforme, et le paiement reçu est rapproché tout seul.' },
    { id: 'factures-justificatifs', q: 'Comment rapprocher mes justificatifs ?', a: 'Photographiez le ticket ou transférez la facture par e-mail : Tamis lit le montant, la date et la TVA, puis l’associe à la bonne dépense. Il ne vous reste qu’à vérifier.' },
    { id: 'factures-tva', q: 'Comment préparer ma déclaration de TVA ?', a: 'L’onglet TVA calcule la taxe collectée et déductible de la période. Exportez le récapitulatif pour votre comptable, ou partagez-lui un accès en lecture.' },
  ] },
  { id: 'securite', title: 'Sécurité', icon: <Ico d='<path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6z"/><path d="m9 12 2 2 4-4"/>' />, questions: [
    { id: 'securite-fonds', q: 'Où sont conservés mes fonds ?', a: 'Chez notre banque partenaire, agréée par l’ACPR. Vos dépôts sont couverts par le Fonds de garantie des dépôts jusqu’à 100 000 €.' },
    { id: 'securite-2fa', q: 'Comment activer la double authentification ?', a: 'Elle est active dès l’ouverture : chaque opération sensible est validée dans l’application, par Face ID ou par votre code. Vous pouvez ajouter une clé de sécurité physique.' },
    { id: 'securite-suspect', q: 'Que faire si je reçois un message suspect ?', a: 'Ne cliquez sur aucun lien. Tamis ne vous demandera jamais votre code par SMS ni par téléphone. Transférez le message à notre équipe sécurité depuis l’application.' },
  ] },
  { id: 'tarifs', title: 'Offres et résiliation', icon: <Ico d='<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>' />, questions: [
    { id: 'tarifs-changer', q: 'Puis-je changer d’offre à tout moment ?', a: 'Oui, en deux clics depuis les réglages. Le changement vaut au prochain mois, et la différence est calculée au jour près.' },
    { id: 'tarifs-cloturer', q: 'Comment clôturer mon compte ?', a: 'Depuis les réglages, sans justification ni frais. Nous virons le solde sur le compte de votre choix et vous gardez l’accès à vos relevés pendant dix ans.' },
  ] },
];

/* Recherche : minuscules sans accents, index préservés (un caractère pour un caractère). */
const fold = (s) => Array.from(s, (c) => { const n = c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); return n.length === 1 ? n : c.toLowerCase()[0] || ' '; }).join('');
const useReduced = () => {
  const [r, set] = useState(false);
  useEffect(() => { const m = matchMedia('(prefers-reduced-motion: reduce)'); set(m.matches); const f = () => set(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f); }, []);
  return r;
};
const useMobile = () => {
  const [m, set] = useState(false);
  useEffect(() => { const q = matchMedia('(max-width: 899px)'); set(q.matches); const f = () => set(q.matches); q.addEventListener('change', f); return () => q.removeEventListener('change', f); }, []);
  return m;
};

function Highlight({ text, terms }) {
  if (!terms.length) return text;
  const f = fold(text), hits = [];
  terms.forEach((t) => { let k = 0; while ((k = f.indexOf(t, k)) > -1) { hits.push([k, k + t.length]); k += t.length; } });
  if (!hits.length) return text;
  hits.sort((a, b) => a[0] - b[0]);
  const out = []; let pos = 0;
  hits.forEach(([s, e], i) => { if (s < pos) return; out.push(text.slice(pos, s)); out.push(<mark key={i} className="-mx-0.5 rounded px-0.5 bg-[var(--accent-subtle)] text-[var(--text-strong)] shadow-[inset_0_-1px_0_var(--accent-subtle-border)]">{text.slice(s, e)}</mark>); pos = e; });
  out.push(text.slice(pos));
  return out;
}

function Item({ item, open, onToggle, terms, inAnswerOnly }) {
  const [vote, setVote] = useState(null);
  const [copied, setCopied] = useState(false);
  const copy = () => {
    const url = `${location.href.split('#')[0]}#${item.id}`;
    try { history.replaceState(null, '', `#${item.id}`); } catch {}
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1800); };
    navigator.clipboard?.writeText(url).then(done, done) ?? done();
  };
  const pill = 'inline-flex h-9 md:h-8 items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 text-[13px] text-[var(--text-muted)] transition-[color,border-color,transform] duration-150 hover:border-[var(--border-control)] hover:text-[var(--text-strong)] active:scale-[.96]';
  return (
    <li id={item.id} className="border-b border-[var(--border)]">
      <h4 className="m-0">
        <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={`${item.id}-a`}
          className="group flex min-h-[60px] md:min-h-[64px] w-full items-center gap-3 md:gap-4 py-4 text-left text-base md:text-[17px] font-medium leading-[1.45] tracking-[-0.01em] text-[var(--text-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus-ring)] rounded-lg">
          <span className="min-w-0 flex-1">
            <Highlight text={item.q} terms={terms} />
            {inAnswerOnly && <span className="ml-2 inline-block whitespace-nowrap rounded-md bg-[var(--tint-neutral-bg)] px-1.5 py-0.5 align-[2px] font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-muted)]">dans la réponse</span>}
          </span>
          <span aria-hidden="true" className={`relative h-8 w-8 flex-none rounded-full border transition-[background-color,border-color,color,transform] duration-500 ease-[cubic-bezier(.34,1.36,.64,1)] ${open ? 'rotate-180 border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-muted)] group-hover:border-[var(--border-control)] group-hover:text-[var(--text-strong)]'}`}>
            <span className="absolute left-1/2 top-1/2 -ml-1.5 -mt-[0.75px] h-[1.5px] w-3 rounded bg-current" />
            <span className={`absolute left-1/2 top-1/2 -ml-1.5 -mt-[0.75px] h-[1.5px] w-3 rounded bg-current transition-transform duration-500 ease-[cubic-bezier(.34,1.36,.64,1)] ${open ? 'rotate-0' : 'rotate-90'}`} />
          </span>
        </button>
      </h4>
      <div id={`${item.id}-a`} role="region" aria-label={item.q}
        className={`grid transition-[grid-template-rows,opacity,visibility] motion-reduce:transition-none ${open ? 'visible grid-rows-[1fr] opacity-100 duration-[420ms] ease-[cubic-bezier(.32,.72,0,1)]' : 'invisible grid-rows-[0fr] opacity-0 duration-300 ease-[cubic-bezier(.4,0,.2,1)]'}`}>
        <div className="overflow-hidden">
          <div className={`pb-6 md:pr-12 transition-transform duration-[420ms] ease-[cubic-bezier(.32,.72,0,1)] motion-reduce:transition-none ${open ? 'translate-y-0' : '-translate-y-1.5'}`}>
            <p className="m-0 max-w-[64ch] text-[15px] md:text-base leading-[1.65] text-[var(--text)]"><Highlight text={item.a} terms={terms} /></p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[var(--text-muted)]">
              {vote ? <span role="status" className="animate-[fcin_360ms_cubic-bezier(.32,.72,0,1)_both]">{vote === 'oui' ? 'Merci, c’est noté.' : 'Merci, nous allons la reformuler.'}</span> : (
                <span className="inline-flex items-center gap-1"><span className="mr-1">Utile ?</span>
                  <button type="button" className={pill} onClick={() => setVote('oui')} aria-label="Oui, cette réponse m’a aidé">Oui</button>
                  <button type="button" className={pill} onClick={() => setVote('non')} aria-label="Non, cette réponse ne m’a pas aidé">Non</button>
                </span>)}
              <button type="button" onClick={copy} aria-pressed={copied} className={`${pill} ml-auto ${copied ? 'border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)] text-[var(--accent)]' : ''}`}>
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>
                {copied ? 'Lien copié' : 'Copier le lien'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * @param {{ categories?: Category[], title?: string, lead?: string, side?: 'gauche'|'droite', indicator?: 'pastille'|'barre',
 *   counts?: boolean, searchable?: boolean, multiple?: boolean, openFirst?: boolean, offset?: number, scroll?: 'doux'|'instantane',
 *   className?: string }} props
 */
export function FaqCategories({
  categories = TAMIS_FAQ, title = 'Vos questions, réponses claires.',
  lead = 'Tout ce qu’il faut savoir sur votre compte pro : ouverture, cartes, virements, factures. Rangé par rubrique, à jour chaque semaine.',
  side = 'gauche', indicator = 'pastille', counts = true, searchable = true, multiple = false, openFirst = true,
  offset = 0, scroll = 'doux', className = '',
}) {
  const reduced = useReduced();
  const mobile = useMobile();
  const smooth = scroll !== 'instantane' && !reduced;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(() => new Set(openFirst && categories[0]?.questions[0] ? [categories[0].questions[0].id] : []));
  const [active, setActive] = useState(0);
  const [ind, setInd] = useState({ x: 0, y: 0, w: 0, h: 40, instant: true });
  const secRefs = useRef([]), linkRefs = useRef([]), listRef = useRef(null), asideRef = useRef(null), inputRef = useRef(null), lock = useRef(false);

  const terms = useMemo(() => fold(query.trim()).split(/\s+/).filter((t) => t.length > 1), [query]);
  const view = useMemo(() => categories.map((c) => ({ ...c, items: c.questions.map((it) => {
    const qf = fold(it.q), af = fold(it.a);
    const ok = !terms.length || terms.every((t) => qf.includes(t) || af.includes(t));
    return { it, ok, answerOnly: terms.length > 0 && !terms.every((t) => qf.includes(t)) };
  }).filter((x) => x.ok) })), [categories, terms]);
  const total = view.reduce((n, c) => n + c.items.length, 0);

  useEffect(() => { if (!multiple) setOpen((s) => new Set([...s].slice(0, 1))); }, [multiple]);
  const toggle = (id) => setOpen((s) => { const n = new Set(multiple ? s : []); if (s.has(id)) n.delete(id); else n.add(id); return n; });

  /* Scrollspy */
  const spy = useCallback(() => {
    if (lock.current) return;
    const line = offset + (mobile ? 96 : Math.min(200, innerHeight * 0.3));
    let idx = -1;
    secRefs.current.forEach((el, i) => { if (!el || el.hidden) return; if (idx < 0) idx = i; if (el.getBoundingClientRect().top - line <= 0) idx = i; });
    const d = document.documentElement;
    if (Math.ceil(innerHeight + scrollY) >= d.scrollHeight - 2) for (let j = secRefs.current.length - 1; j >= 0; j--) { const el = secRefs.current[j]; if (el && !el.hidden) { idx = j; break; } }
    if (idx >= 0) setActive(idx);
  }, [offset, mobile]);
  useEffect(() => {
    let t = 0; const on = () => { if (!t) t = requestAnimationFrame(() => { t = 0; spy(); }); };
    addEventListener('scroll', on, { passive: true }); addEventListener('resize', on); spy();
    return () => { removeEventListener('scroll', on); removeEventListener('resize', on); cancelAnimationFrame(t); };
  }, [spy, query]);

  /* Indicateur */
  useLayoutEffect(() => {
    const a = linkRefs.current[active]; if (!a) return;
    const li = a.parentElement;
    setInd((p) => ({ x: li.offsetLeft, y: li.offsetTop, w: a.offsetWidth, h: a.offsetHeight, instant: p.w === 0 || reduced }));
    if (mobile && listRef.current) listRef.current.scrollTo({ left: Math.max(0, li.offsetLeft - (listRef.current.clientWidth - a.offsetWidth) / 2), behavior: smooth ? 'smooth' : 'auto' });
  }, [active, mobile, reduced, smooth, total]);

  const go = (i) => {
    const s = secRefs.current[i]; if (!s) return;
    const head = mobile ? (asideRef.current?.offsetHeight || 0) + 16 : 32;
    setActive(i); lock.current = true;
    scrollTo({ top: Math.max(0, s.getBoundingClientRect().top + scrollY - offset - head), behavior: smooth ? 'smooth' : 'auto' });
    const end = () => { lock.current = false; removeEventListener('scrollend', end); };
    addEventListener('scrollend', end); setTimeout(end, smooth ? 900 : 60);
    s.querySelector('[data-sec-h]')?.focus({ preventScroll: true });
  };

  useEffect(() => {
    const k = (e) => { if (e.key === '/' && searchable && !/input|textarea|select/i.test(document.activeElement?.tagName || '')) { e.preventDefault(); inputRef.current?.focus(); } };
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, [searchable]);

  const right = side === 'droite';
  const pastille = indicator === 'pastille';
  return (
    <section aria-labelledby="fc-title" style={{ '--fc-offset': `${offset}px` }}
      className={`relative mx-auto max-w-[1184px] px-4 pb-[72px] pt-14 font-[family-name:var(--font-sans)] text-[var(--text)] min-[900px]:px-8 min-[900px]:pb-28 min-[900px]:pt-24 ${className}`}>
      <style>{'@keyframes fcin{from{opacity:0;transform:translateY(4px)}}'}</style>
      <header className="mb-6 grid items-end gap-6 min-[900px]:mb-16 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,400px)] min-[900px]:gap-x-16">
        <div>
          <a href="#accueil" aria-label="Tamis, centre d’aide" className="mb-5 inline-flex h-8 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] pl-1 pr-3 text-[13px] font-medium text-[var(--text-strong)] no-underline min-[900px]:mb-6">
            <svg viewBox="0 0 100 100" className="h-6 w-6" aria-hidden="true"><rect width="100" height="100" rx="28" fill="var(--accent)" /><path d="M22 36h56a28 28 0 0 1-56 0z" fill="var(--accent-fg)" /><path d="M16 36h68" stroke="var(--accent-fg)" strokeWidth="6" strokeLinecap="round" /><g fill="var(--accent)"><circle cx="38" cy="46" r="3.2" /><circle cx="50" cy="46" r="3.2" /><circle cx="62" cy="46" r="3.2" /><circle cx="44" cy="55" r="3.2" /><circle cx="56" cy="55" r="3.2" /></g><g fill="var(--accent-fg)" opacity=".7"><circle cx="46" cy="75" r="3" /><circle cx="54" cy="82" r="3" /></g></svg>
            <b className="font-semibold tracking-[-0.01em]">Tamis</b><span className="text-[var(--text-muted)]">Centre d’aide</span>
          </a>
          <h2 id="fc-title" className="m-0 text-balance text-[clamp(2rem,1.25rem+2.6vw,3.25rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-[var(--text-strong)]">{title}</h2>
          <p className="mt-4 max-w-[46ch] text-pretty text-base leading-relaxed text-[var(--text-muted)] min-[900px]:text-[17px]">{lead}</p>
        </div>
        {searchable && (
          <div>
            <label className="relative block">
              <span className="sr-only">Rechercher dans l’aide</span>
              <svg viewBox="0 0 20 20" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><circle cx="9" cy="9" r="5.75" /><path d="m13.5 13.5 3.25 3.25" /></svg>
              <input ref={inputRef} type="search" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') setQuery(''); }}
                placeholder="Plafond, TVA, IBAN…" autoComplete="off" spellCheck={false} aria-describedby="fc-status"
                className="h-12 w-full appearance-none rounded-xl border border-[var(--border-control)] bg-[var(--surface)] pl-12 pr-14 text-[max(16px,1rem)] text-[var(--text-strong)] placeholder:text-[var(--text-muted)] transition-[border-color,box-shadow] duration-200 focus:border-[var(--focus-ring)] focus:shadow-[0_0_0_3px_var(--accent-subtle)] focus:outline-none [&::-webkit-search-cancel-button]:hidden" />
              {query ? (
                <button type="button" onClick={() => { setQuery(''); inputRef.current?.focus(); }} aria-label="Effacer la recherche" className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--state-hover)] hover:text-[var(--text-strong)]">
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>
                </button>
              ) : <kbd aria-hidden="true" className="absolute right-3 top-1/2 hidden h-6 min-w-6 -translate-y-1/2 place-items-center rounded-md border border-[var(--border)] bg-[var(--raised)] px-1.5 font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)] min-[900px]:grid">/</kbd>}
            </label>
            <p id="fc-status" role="status" aria-live="polite" className="ml-1 mt-2 min-h-5 text-[13px] text-[var(--text-muted)]">
              {terms.length ? (total ? `${total} réponse${total > 1 ? 's' : ''} pour « ${query.trim()} »` : `Aucune réponse pour « ${query.trim()} »`) : ''}
            </p>
          </div>
        )}
      </header>

      <div className={`min-[900px]:grid min-[900px]:items-start min-[900px]:gap-[72px] ${right ? 'min-[900px]:grid-cols-[minmax(0,1fr)_248px]' : 'min-[900px]:grid-cols-[248px_minmax(0,1fr)]'}`}>
        <nav ref={asideRef} aria-label="Rubriques de la FAQ"
          className={`sticky top-[var(--fc-offset)] z-[2] -mx-4 mb-6 border-b border-[var(--border)] bg-[var(--bg)] py-2 min-[900px]:top-[calc(var(--fc-offset)+32px)] min-[900px]:mx-0 min-[900px]:mb-0 min-[900px]:border-0 min-[900px]:bg-transparent min-[900px]:py-0 ${right ? 'min-[900px]:order-2' : ''}`}>
          <p aria-hidden="true" className="mb-3 ml-3 hidden font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.04em] text-[var(--text-muted)] min-[900px]:block">Rubriques</p>
          <ul ref={listRef} role="list" className={`relative m-0 flex list-none gap-1 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-[900px]:block min-[900px]:overflow-visible min-[900px]:px-0 ${!pastille ? "min-[900px]:before:absolute min-[900px]:before:bottom-1 min-[900px]:before:left-0 min-[900px]:before:top-1 min-[900px]:before:w-px min-[900px]:before:bg-[var(--border)] min-[900px]:before:content-['']" : ''}`}>
            <li aria-hidden="true" role="presentation"
              style={{ transform: mobile ? `translate3d(${ind.x}px,0,0)` : `translate3d(0,${ind.y}px,0)`, width: mobile ? ind.w : '100%', height: ind.h, transition: ind.instant ? 'none' : undefined }}
              className={`pointer-events-none absolute left-0 top-0 transition-[transform,width,height] duration-[460ms] ease-[cubic-bezier(.34,1.36,.64,1)] ${pastille ? 'rounded-full border border-[var(--border)] bg-[var(--surface)] min-[900px]:rounded-lg' : ''}`}>
              {pastille ? <span className="absolute left-[11px] top-1/2 -mt-[3px] hidden h-1.5 w-1.5 rounded-full bg-[var(--accent)] min-[900px]:block" />
                : <span className="absolute bottom-0 left-3.5 right-3.5 h-0.5 rounded bg-[var(--accent)] min-[900px]:bottom-2 min-[900px]:left-0 min-[900px]:right-auto min-[900px]:top-2 min-[900px]:h-auto min-[900px]:w-0.5" />}
            </li>
            {view.map((c, i) => (
              <li key={c.id} className="flex-none">
                <a ref={(el) => (linkRefs.current[i] = el)} href={`#fc-${c.id}`} onClick={(e) => { e.preventDefault(); go(i); }}
                  aria-current={active === i ? 'true' : undefined} aria-disabled={c.items.length ? undefined : 'true'}
                  className={`relative z-[1] flex min-h-11 items-center gap-2 whitespace-nowrap rounded-lg px-3.5 text-[15px] leading-tight no-underline transition-colors min-[900px]:min-h-10 min-[900px]:gap-3 min-[900px]:whitespace-normal min-[900px]:py-2 ${pastille ? 'min-[900px]:pl-7' : 'min-[900px]:pl-5'} ${active === i ? 'font-medium text-[var(--text-strong)]' : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'} ${c.items.length ? '' : 'pointer-events-none opacity-45'}`}>
                  <span className="min-w-0 flex-1">{c.title}</span>
                  {counts && <span aria-hidden="true" className="flex-none font-[family-name:var(--font-mono)] text-xs tabular-nums text-[var(--text-muted)]">{c.items.length}</span>}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-8 hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 min-[900px]:block">
            <p className="flex items-center gap-2 text-sm font-medium text-[var(--text-strong)]"><span className="relative h-2 w-2 rounded-full bg-[var(--up)]"><span className="absolute -inset-1 animate-ping rounded-full border border-[var(--up)] motion-reduce:hidden" /></span>Conseillers en ligne</p>
            <p className="mb-3 mt-1.5 text-[13px] leading-normal text-[var(--text-muted)]">Réponse en 4 minutes en moyenne, 7 j/7 de 8 h à 22 h.</p>
            <a href="#contact" className="text-sm font-medium text-[var(--accent)] no-underline hover:underline">Ouvrir le chat →</a>
          </div>
        </nav>

        <div>
          {view.map((c, i) => (
            <section key={c.id} id={`fc-${c.id}`} ref={(el) => (secRefs.current[i] = el)} hidden={!c.items.length} aria-labelledby={`fc-${c.id}-t`} className="mt-10 first:mt-0 min-[900px]:mt-14">
              <div data-sec-h tabIndex={-1} className="mb-2 flex items-center gap-3 outline-none">
                <span aria-hidden="true" className="grid h-9 w-9 flex-none place-items-center rounded-[10px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-strong)]">{c.icon}</span>
                <h3 id={`fc-${c.id}-t`} className="m-0 text-[length:var(--t-section)] font-semibold leading-[1.3] tracking-[-0.015em] text-[var(--text-strong)]">{c.title}</h3>
                {counts && <span className="ml-auto font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)]">{c.items.length} question{c.items.length > 1 ? 's' : ''}</span>}
              </div>
              <ul role="list" className="m-0 list-none p-0">
                {c.items.map(({ it, answerOnly }) => <Item key={it.id} item={it} open={open.has(it.id)} onToggle={() => toggle(it.id)} terms={terms} inAnswerOnly={answerOnly} />)}
              </ul>
            </section>
          ))}
          {total === 0 && (
            <div role="status" className="animate-[fcin_360ms_cubic-bezier(.32,.72,0,1)_both] rounded-2xl border border-dashed border-[var(--border-control)] px-6 py-12 text-center">
              <h3 className="mb-1 text-[17px] font-semibold text-[var(--text-strong)]">Aucune réponse pour « {query.trim()} »</h3>
              <p className="mx-auto max-w-[40ch] text-[15px] text-[var(--text-muted)]">Essayez un mot plus court, ou l’une de ces recherches fréquentes.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {['plafond', 'TVA', 'carte perdue'].map((s) => <button key={s} type="button" onClick={() => setQuery(s)} className="h-11 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-strong)] md:h-9">{s}</button>)}
              </div>
            </div>
          )}
          <aside aria-label="Contacter le support" className="mt-12 flex flex-col items-start gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 min-[900px]:mt-16 min-[900px]:flex-row min-[900px]:items-center min-[900px]:gap-6 min-[900px]:p-6">
            <div className="flex-1">
              <h3 className="m-0 text-[17px] font-semibold tracking-[-0.01em] text-[var(--text-strong)]">Vous n’avez pas trouvé votre réponse ?</h3>
              <p className="mt-1 text-[15px] text-[var(--text-muted)]">Une conseillère vous répond par écrit, sans robot ni file d’attente.</p>
            </div>
            <a href="#contact" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-[18px] text-[15px] font-medium text-[var(--accent-fg)] no-underline transition-[background-color,transform] hover:bg-[var(--accent-hover)] active:scale-[.97] min-[900px]:h-11 min-[900px]:w-auto">Écrire au support →</a>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default FaqCategories;
