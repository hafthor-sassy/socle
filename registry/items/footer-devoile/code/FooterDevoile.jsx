// FooterDevoile.jsx — la page se soulève à la fin du défilement et découvre le footer posé dessous (position: sticky).
// Le contenu du footer monte au rythme du dévoilement et un voile s'efface. React 18, Tailwind 3.4, tokens.css chargé.
// Aucune bibliothèque : une mesure par image pendant le défilement, écrite dans une variable CSS (--fd-p), sans rendu React.
// Exemple : Abri (assurance habitation en ligne, marque fictive).
// Utilisation :
//   <FooterDevoile title="Votre logement, couvert dès ce soir." effect="montee" radius={24} veil>
//     …contenu de la page (fond opaque)…
//   </FooterDevoile>
import { useEffect, useRef, useState } from 'react';

const GROUPS = [
  { title: 'Assurances', links: ['Habitation', 'Locataire', 'Propriétaire non occupant', 'Colocation'] },
  { title: 'Abri', links: ['À propos', 'Recrutement', 'Presse', 'Nos engagements'] },
  { title: 'Aide', links: ['Déclarer un sinistre', 'Centre d’aide', 'Nous écrire', 'État du service'] },
];

const Logo = ({ className = 'h-7 w-7' }) => (
  <svg viewBox="0 0 100 100" className={`flex-none ${className}`} aria-hidden="true">
    <rect width="100" height="100" rx="28" fill="var(--accent)" />
    <path d="M22 50 50 26l28 24M32 46v26h36V46" fill="none" stroke="var(--accent-fg)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="44" y="56" width="12" height="16" rx="2" fill="var(--accent-fg)" />
  </svg>
);

const btn = 'inline-flex h-12 items-center justify-center whitespace-nowrap rounded-full bg-[var(--accent)] px-6 font-medium text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-hover)] active:scale-[.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]';
const caps = 'font-mono text-xs font-medium uppercase tracking-[.04em] text-[var(--text-muted)]';

/**
 * @param {{ title?: string, effect?: 'montee'|'echelle'|'aucun', radius?: number, veil?: boolean,
 *   children?: React.ReactNode, className?: string }} props
 */
export default function FooterDevoile({
  title = 'Votre logement, couvert dès ce soir.',
  effect = 'montee',
  radius = 24,
  veil = true,
  children,
  className = '',
}) {
  const root = useRef(null), page = useRef(null), foot = useRef(null);
  const [wide, setWide] = useState(true);
  const [fixed, setFixed] = useState(false); // footer plus haut que l'écran : footer classique

  useEffect(() => {
    const mq = matchMedia('(min-width: 761px)');
    const sync = () => setWide(mq.matches);
    sync(); mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const h = foot.current.offsetHeight || 1, shown = innerHeight - page.current.getBoundingClientRect().bottom;
      root.current.style.setProperty('--fd-p', Math.max(0, Math.min(1, shown / h)).toFixed(4));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(measure); };
    const layout = () => { setFixed(foot.current.offsetHeight > innerHeight - 48); measure(); };
    const ro = new ResizeObserver(layout); ro.observe(foot.current);
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', layout);
    layout();
    return () => { ro.disconnect(); removeEventListener('scroll', onScroll); removeEventListener('resize', layout); cancelAnimationFrame(raf); };
  }, []);

  /* Montée : 48 px sur mobile, 96 px sur bureau. Échelle : de 92 % à 100 %. */
  const reduce = typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const move = reduce ? undefined : effect === 'montee' ? { transform: `translate3d(0, calc((1 - var(--fd-p)) * ${wide ? 96 : 48}px), 0)` }
    : effect === 'echelle' ? { transform: 'scale(calc(.92 + var(--fd-p) * .08))' } : undefined;

  return (
    <div ref={root} className={`relative isolate font-sans text-[var(--text)] ${className}`} style={{ '--fd-p': 1 }}>
      {/* La page : au-dessus du footer, fond opaque, elle s'en détache par le bas. */}
      <div ref={page} className="relative z-[1] border-b border-[var(--border)] bg-[var(--bg)]"
        style={{ borderRadius: `0 0 ${radius}px ${radius}px` }}>
        {children}
      </div>

      <footer ref={foot} aria-labelledby="fd-foot-t"
        className={`${fixed ? 'relative' : 'sticky'} bottom-0 z-0 overflow-hidden bg-[var(--surface)]`}>
        {veil && <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] bg-[var(--bg)]" style={{ opacity: 'calc((1 - var(--fd-p)) * .7)' }} />}
        <div className={`relative mx-auto max-w-[1120px] origin-bottom px-4 pb-6 pt-12 will-change-transform motion-reduce:!transform-none md:px-8 md:pb-8 md:pt-24`} style={move}>
          <div className="grid gap-6 border-b border-[var(--border)] pb-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-8 md:pb-16">
            <h2 id="fd-foot-t" className="m-0 max-w-[14ch] text-balance text-[clamp(2.25rem,1rem+3.6vw,4.25rem)] font-semibold leading-[1.02] tracking-[-.04em] text-[var(--text-strong)]">{title}</h2>
            <div className="grid gap-3 md:justify-items-end">
              <a href="#" className={btn}>Obtenir mon devis</a>
              <p className="m-0 text-center text-sm text-[var(--text-muted)]">Dès 6,90 € par mois · résiliable à tout moment</p>
            </div>
          </div>

          <div className="grid py-2 pb-6 md:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.3fr)] md:gap-8 md:py-12">
            {GROUPS.map((g) => (
              /* Mobile : tiroirs natifs fermés. Bureau : toujours ouverts, titre hors tabulation. */
              <details key={`${g.title}-${wide}`} open={wide} className="group border-b border-[var(--border)] md:border-0"
                onToggle={() => foot.current && setFixed(foot.current.offsetHeight > innerHeight - 48)}>
                <summary tabIndex={wide ? -1 : undefined} onClick={(e) => wide && e.preventDefault()}
                  className="flex min-h-[52px] cursor-pointer list-none items-center justify-between text-base font-medium text-[var(--text-strong)] md:pointer-events-none md:mb-4 md:block md:min-h-0 md:font-mono md:text-xs md:uppercase md:tracking-[.04em] md:text-[var(--text-muted)] [&::-webkit-details-marker]:hidden">
                  {g.title}
                  <span aria-hidden="true" className="mr-1 h-2 w-2 -translate-y-0.5 rotate-45 border-b-[1.5px] border-r-[1.5px] border-[var(--text-muted)] transition-transform group-open:translate-y-0.5 group-open:-rotate-[135deg] md:hidden" />
                </summary>
                <ul role="list" className="m-0 grid list-none gap-1 p-0 pb-3 md:pb-0">
                  {g.links.map((l) => (
                    <li key={l}><a href="#" className="inline-flex min-h-[44px] items-center gap-2 text-base text-[var(--text)] underline-offset-4 hover:text-[var(--text-strong)] hover:underline md:min-h-8 md:text-sm">
                      {l}{l === 'Recrutement' && <span className="rounded-full bg-[var(--accent-subtle)] px-2 py-0.5 text-xs text-[var(--text-strong)]">4 postes</span>}
                    </a></li>
                  ))}
                </ul>
              </details>
            ))}
            <div className="grid content-start gap-2 pt-6 md:pt-0">
              <p className={`m-0 ${caps}`}>Une question ?</p>
              <a href="#" className="text-[clamp(1.5rem,1.2rem+.8vw,2rem)] font-semibold tabular-nums tracking-[-.02em] text-[var(--text-strong)]">01 86 95 40 20</a>
              <p className="m-0 text-sm text-[var(--text-muted)]">Du lundi au samedi, de 8 h à 20 h. Appel non surtaxé.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[var(--border)] pt-6 text-sm text-[var(--text-muted)]">
            <p className="order-first m-0 inline-flex basis-full items-center gap-2 md:order-none md:basis-auto">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--up)]" />Tous les services fonctionnent
            </p>
            <a href="#" aria-label="Abri, accueil" className="inline-flex items-center gap-2.5 text-[17px] font-semibold tracking-[-.03em] text-[var(--text-strong)] md:-order-1"><Logo className="h-6 w-6" />abri</a>
            <nav aria-label="Informations légales" className="flex flex-wrap gap-x-5 md:ml-auto md:gap-6">
              {['Mentions légales', 'Confidentialité', 'Cookies'].map((l) => <a key={l} href="#" className="inline-flex min-h-[44px] items-center hover:text-[var(--text-strong)] md:min-h-0">{l}</a>)}
            </nav>
            <p className="m-0 basis-full text-xs">© 2026 Abri Assurances SAS, courtier en assurances (marque fictive).</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
