// État vide guidé — React + Tailwind CSS. Aucune dépendance.
// <EmptyState variant="first" size="standard" draw={true} secondary={true} query="Lyon 7e" retryAfter={15} onAction={(a) => …} />
// Quatre variantes : premiers pas (first), aucun résultat (search), erreur (error), hors ligne (offline).
// Le trait de l'illustration se dessine, le détail d'accent rebondit (ressort CSS linear()), puis le texte arrive.
// Couleurs : uniquement les variables de tokens.css (--accent, --surface, --border-strong…), elles suivent la palette.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * @typedef {'first'|'search'|'error'|'offline'} EmptyVariant
 * @typedef {Object} EmptyStateProps
 * @property {EmptyVariant} [variant]
 * @property {'standard'|'compact'} [size]       compact : illustration à gauche, pour une carte ou un panneau
 * @property {boolean} [draw]                     tracé animé du trait à chaque changement de variante
 * @property {boolean} [secondary]                affiche l'action secondaire
 * @property {string} [query]                     terme affiché dans « aucun résultat »
 * @property {number} [retryAfter]                hors ligne : secondes avant la nouvelle tentative automatique (0 = jamais)
 * @property {() => Promise<boolean>} [onRetry]   erreur / hors ligne : résout true si la connexion revient
 * @property {(action: string, variant: EmptyVariant) => void} [onAction]
 * @property {Partial<Record<EmptyVariant, { title?: string, text?: string, primary?: string, secondaryLabel?: string }>>} [copy]
 * @property {string} [className]
 */

const CSS = `
.evr .evr-l{fill:none;stroke:var(--border-strong);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.evr .evr-thin{stroke:var(--border-control);stroke-width:1.25}.evr .evr-thick{stroke-width:3}.evr .evr-dash{stroke-dasharray:2 5}
.evr .evr-a{fill:none;stroke:var(--accent);stroke-width:1.75;stroke-linecap:round;vector-effect:non-scaling-stroke}
.evr .evr-face{fill:var(--surface)}.evr .evr-side,.evr .evr-floor{fill:var(--raised)}.evr .evr-gap{fill:none;stroke:var(--surface);stroke-width:7;stroke-linecap:round}
.evr .evr-dot{fill:var(--accent)}.evr .evr-dot-m{fill:var(--border-control)}.evr .evr-pop{transform-box:fill-box;transform-origin:center}
.evr{--evr-spring:cubic-bezier(.34,1.56,.64,1)}
@supports (transition-timing-function:linear(0,1)){.evr{--evr-spring:linear(0,.009,.035 2.1%,.141,.281 6.7%,.723 12.9%,.938 16.7%,1.017,1.077,1.121,1.149 24.3%,1.159,1.163,1.161,1.154 29.9%,1.129 32.8%,1.051 39.6%,1.017 43.1%,.991,.977 51%,.974 53.8%,.975 57.1%,.997 69.8%,1.003 76.9%,1)}}
.evr [data-in] .evr-l:not(.evr-dash),.evr [data-in] .evr-a{stroke-dasharray:1;stroke-dashoffset:1;animation:evr-draw 760ms cubic-bezier(.65,0,.35,1) forwards;animation-delay:calc(var(--i,0)*70ms)}
.evr [data-in] .evr-dash{animation:evr-fade .4s cubic-bezier(.2,0,0,1) both .36s}
.evr [data-in] :is(.evr-face,.evr-side,.evr-floor){animation:evr-fade .52s cubic-bezier(.2,0,0,1) both .12s}
.evr [data-in] .evr-pop{animation:evr-pop .62s var(--evr-spring) both .6s}
.evr [data-in] .evr-up{animation:evr-up .52s cubic-bezier(.2,0,0,1) both;animation-delay:var(--d,0ms)}
.evr[data-idle] .evr-panel:not([data-in]) .evr-pop{animation:evr-float 3.2s ease-in-out infinite}
.evr[data-idle] .evr-panel:not([data-in]) .evr-dash{animation:evr-march 1.4s linear infinite}
.evr .evr-shake{animation:evr-shake .36s cubic-bezier(.2,0,0,1)}
.evr-dots{background-image:radial-gradient(var(--border) 1px,transparent 1.5px);background-size:12px 12px;-webkit-mask-image:radial-gradient(closest-side,#000 30%,transparent 100%);mask-image:radial-gradient(closest-side,#000 30%,transparent 100%)}
@keyframes evr-draw{to{stroke-dashoffset:0}}@keyframes evr-fade{from{opacity:0}}@keyframes evr-pop{from{opacity:0;transform:scale(.4) rotate(-20deg)}}
@keyframes evr-up{from{opacity:0;transform:translateY(8px)}}@keyframes evr-float{50%{transform:translateY(-3px) rotate(6deg)}}@keyframes evr-march{to{stroke-dashoffset:-14}}
@keyframes evr-shake{20%,60%{transform:translateX(-4px)}40%,80%{transform:translateX(4px)}}
@media (prefers-reduced-motion:reduce){.evr *{animation:none!important;transition:none!important}}`;

const ART = {
  first: (
    <>
      <ellipse className="evr-floor" cx="84" cy="110" rx="50" ry="5" />
      <path className="evr-face" d="M72 58l4-30 26 3-4 30z" /><path className="evr-l" d="M72 58l4-30 26 3-4 30" />
      <circle className="evr-l evr-thin" cx="89" cy="35" r="2.5" /><path className="evr-l evr-thin" d="M80 44l14 2M79 51l9 1" />
      <path className="evr-side" d="M110 66l16-10v40l-16 10z" /><path className="evr-face" d="M50 66h60v40H50z" />
      <path className="evr-l" d="M50 66h60v40H50zM110 66l16-10v40l-16 10M50 66l16-10h60" />
      <path className="evr-face" d="M50 66L36 50l18-8 12 14z" /><path className="evr-l" d="M50 66L36 50l18-8 12 14" />
      <path className="evr-face" d="M110 66l22 6 12-12-18-4z" /><path className="evr-l" d="M110 66l22 6 12-12-18-4" />
      <path className="evr-l evr-thin" d="M60 78h24M60 86h14" /><path className="evr-l evr-dash" d="M104 26c6-8 14-11 22-9" />
      <g className="evr-pop"><path className="evr-a" d="M136 8v16M128 16h16" /><circle className="evr-dot" cx="146" cy="32" r="2.5" /></g>
    </>
  ),
  search: (
    <>
      <ellipse className="evr-floor" cx="80" cy="112" rx="52" ry="5" />
      <path className="evr-l evr-thin" d="M30 42h44M30 58h30M30 74h38M30 90h24" />
      <circle className="evr-face" cx="92" cy="62" r="24" /><circle className="evr-l" cx="92" cy="62" r="24" />
      <path className="evr-l evr-dash" d="M80 56h24M80 68h14" /><path className="evr-l evr-thick" d="M110 80l18 18" />
      <g className="evr-pop"><path className="evr-a" d="M132 26l8-8M138 36h10M126 18v-8" /></g>
    </>
  ),
  error: (
    <>
      <ellipse className="evr-floor" cx="80" cy="112" rx="52" ry="5" />
      <path className="evr-l" d="M8 70h26" />
      <rect className="evr-face" x="34" y="56" width="22" height="28" rx="4" /><rect className="evr-l" x="34" y="56" width="22" height="28" rx="4" />
      <path className="evr-l" d="M56 63h10M56 77h10" />
      <rect className="evr-face" x="94" y="52" width="26" height="36" rx="4" /><rect className="evr-l" x="94" y="52" width="26" height="36" rx="4" />
      <path className="evr-l evr-thin" d="M101 64h4M101 76h4" /><path className="evr-l" d="M120 70c14 0 14 24 32 24" />
      <g className="evr-pop"><path className="evr-a" d="M80 40v10M70 46l4 7M90 46l-4 7M80 100v-10" /></g>
    </>
  ),
  offline: (
    <>
      <ellipse className="evr-floor" cx="80" cy="112" rx="52" ry="5" />
      <path className="evr-face" d="M50 92h60a17 17 0 0 0 2-34 25 25 0 0 0-48-6 20 20 0 0 0-14 40z" />
      <path className="evr-l" d="M50 92h60a17 17 0 0 0 2-34 25 25 0 0 0-48-6 20 20 0 0 0-14 40z" />
      <path className="evr-gap" d="M46 34l70 62" /><path className="evr-l evr-a" d="M46 34l70 62" />
      <g className="evr-pop"><path className="evr-l evr-thin" d="M124 30a20 20 0 0 1 22 0M128 37a12 12 0 0 1 14 0" /><circle className="evr-dot-m" cx="135" cy="44" r="2.5" /></g>
    </>
  ),
};

const COPY = {
  first: { title: 'Votre première expédition vous attend', text: 'Importez vos commandes ou créez un envoi\u00a0: Quai choisit le transporteur et imprime l’étiquette.', primary: 'Créer une expédition', secondaryLabel: 'Importer un fichier CSV' },
  search: { title: 'Aucune expédition pour', text: 'Vérifiez l’orthographe ou retirez un filtre\u00a0: la recherche porte sur le numéro de suivi, le client et la ville.', primary: 'Effacer la recherche', secondaryLabel: 'Retirer les filtres' },
  error: { title: 'Impossible de charger les expéditions', text: 'Le service de suivi ne répond pas. Vos envois ne sont pas perdus\u00a0: rien n’a été modifié.', primary: 'Réessayer', secondaryLabel: 'État du service' },
  offline: { title: 'Vous êtes hors ligne', text: 'Les expéditions s’afficheront dès le retour du réseau. Les étiquettes déjà téléchargées restent disponibles.', primary: 'Réessayer', secondaryLabel: 'Étiquettes hors ligne' },
};
const ACTIONS = { first: ['create', 'import'], search: ['clear', 'filters'], error: ['retry', 'status'], offline: ['retry', 'labels'] };

function useCss() {
  useEffect(() => {
    if (document.getElementById('evr-css')) return;
    const s = document.createElement('style'); s.id = 'evr-css'; s.textContent = CSS; document.head.appendChild(s);
  }, []);
}

/** @param {EmptyStateProps} props */
export function EmptyState({ variant = 'first', size = 'standard', draw = true, secondary = true, query = 'Lyon 7e', retryAfter = 15, onRetry, onAction, copy = {}, className = '' }) {
  useCss();
  const root = useRef(null), art = useRef(null);
  const [inPlay, setInPlay] = useState(0);
  const [idle, setIdle] = useState(true);
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(retryAfter);
  const [note, setNote] = useState('Code QUA-503');
  const [copied, setCopied] = useState(false);
  const c = { ...COPY[variant], ...(copy[variant] || {}) };
  const compact = size === 'compact';

  /* Rejoue l'entrée à chaque variante ; numérote les traits pour le tracé en cascade. */
  useLayoutEffect(() => {
    const svg = art.current; if (!svg) return;
    svg.querySelectorAll('.evr-l, .evr-a').forEach((n, i) => { if (!n.classList.contains('evr-dash')) n.setAttribute('pathLength', '1'); n.style.setProperty('--i', i); });
    if (!draw || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setInPlay((n) => n + 1);
    const t = setTimeout(() => setInPlay(0), 1400);
    return () => clearTimeout(t);
  }, [variant, draw]);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setIdle(e.isIntersecting)); io.observe(root.current);
    return () => io.disconnect();
  }, []);

  const shake = () => { const f = art.current?.parentElement; if (!f || matchMedia('(prefers-reduced-motion: reduce)').matches) return; f.classList.remove('evr-shake'); void f.offsetWidth; f.classList.add('evr-shake'); };

  async function retry() {
    if (busy) return;
    setBusy(true); onAction?.('retry', variant);
    const ok = onRetry ? await onRetry().catch(() => false) : await new Promise((r) => setTimeout(() => r(false), 1200));
    setBusy(false);
    if (ok) return;
    shake();
    const t = new Date();
    if (variant === 'error') setNote(`Code QUA-503 · échec à ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`);
    else setLeft(retryAfter);
  }

  /* Hors ligne : compte à rebours puis nouvelle tentative automatique. */
  useEffect(() => { setLeft(retryAfter); }, [variant, retryAfter]);
  useEffect(() => {
    if (variant !== 'offline' || !retryAfter || busy) return;
    if (left <= 0) { retry(); return; }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [variant, retryAfter, left, busy]);

  const [primaryAction, secondaryAction] = ACTIONS[variant];
  const btn = 'relative inline-flex items-center justify-center gap-2 h-12 sm:h-10 w-full sm:w-auto px-4 rounded-lg border text-[15px] sm:text-sm font-medium whitespace-nowrap transition-[background,border-color,transform] duration-150 active:scale-[.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]';

  return (
    <section ref={root} aria-live="polite" data-idle={idle || undefined}
      className={`evr relative grid place-items-center text-center ${compact ? 'px-4 py-8 sm:px-6' : 'min-h-0 sm:min-h-[440px] px-4 py-10 sm:px-6 sm:pt-12 sm:pb-14'} ${className}`}>
      <div key={variant} data-in={inPlay ? '' : undefined}
        className={`evr-panel grid gap-6 w-full min-w-0 ${compact ? 'max-w-[560px] grid-cols-[72px_1fr] sm:grid-cols-[112px_1fr] items-center justify-items-start gap-x-4 sm:gap-x-6 gap-y-4 text-left' : 'max-w-[440px] justify-items-center'}`}>
        <div className={`relative grid place-items-center ${compact ? 'row-span-1 sm:row-span-3 w-[72px] h-16 sm:w-28 sm:h-24' : 'w-48 h-36 sm:w-56 sm:h-44'}`}>
          <span aria-hidden="true" className="evr-dots absolute -inset-x-6 -inset-y-2 pointer-events-none" />
          <svg ref={art} viewBox="0 0 160 128" aria-hidden="true" className={`relative overflow-visible ${compact ? 'w-[72px] sm:w-28' : 'w-[168px] sm:w-[200px]'}`}>{ART[variant]}</svg>
        </div>
        <div className="evr-up grid gap-2 min-w-0" style={{ '--d': '140ms' }}>
          <h2 className={`m-0 font-semibold tracking-[-0.01em] text-[var(--text-strong)] [text-wrap:balance] ${compact ? 'text-[17px] leading-6' : 'text-[length:var(--t-section)] leading-[1.3]'}`}>
            {variant === 'search' ? <>{c.title} «&nbsp;<span className="[overflow-wrap:anywhere]">{query}</span>&nbsp;»</> : c.title}
          </h2>
          <p className="m-0 text-[15px] leading-6 text-[var(--text-muted)] [text-wrap:pretty]">{c.text}</p>
        </div>
        <div className={`evr-up flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto ${compact ? 'col-span-2 sm:col-span-1 justify-start' : 'justify-center'}`} style={{ '--d': '220ms' }}>
          <button type="button" aria-busy={busy || undefined}
            onClick={() => (primaryAction === 'retry' ? retry() : onAction?.(primaryAction, variant))}
            className={`${btn} border-transparent bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] ${busy ? 'pointer-events-none' : ''}`}>
            {busy && <span aria-hidden="true" className="w-4 h-4 rounded-full border-2 border-current border-r-transparent animate-spin" />}
            {variant === 'first' && !busy && <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg>}
            {busy ? 'Connexion…' : c.primary}
          </button>
          {secondary && (
            <button type="button" onClick={() => onAction?.(secondaryAction, variant)}
              className={`${btn} border-[var(--border)] bg-transparent text-[var(--text-strong)] hover:bg-[var(--state-hover)] hover:border-[var(--border-control)]`}>
              {c.secondaryLabel}
            </button>
          )}
        </div>
        {variant === 'error' && (
          <p className={`evr-up m-0 -mt-2 inline-flex items-center gap-2 font-mono text-[13px] leading-[18px] text-[var(--text-muted)] tabular-nums ${compact ? 'col-span-2 sm:col-span-1 mt-0' : ''}`} style={{ '--d': '300ms' }}>
            {note}
            <button type="button" onClick={() => { navigator.clipboard?.writeText('QUA-503').catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1400); }}
              className="h-7 px-2 rounded-lg font-sans text-[13px] font-medium text-[var(--text-strong)] underline underline-offset-[3px] decoration-[var(--border-control)] hover:bg-[var(--state-hover)]">
              {copied ? 'Copié' : 'Copier'}
            </button>
          </p>
        )}
        {variant === 'offline' && retryAfter > 0 && (
          <p className={`evr-up m-0 -mt-2 inline-flex items-center gap-2 font-mono text-[13px] leading-[18px] text-[var(--text-muted)] tabular-nums ${compact ? 'col-span-2 sm:col-span-1 mt-0' : ''}`} style={{ '--d': '300ms' }}>
            <span aria-hidden="true" className="w-2 h-2 rounded-full bg-[var(--warn)] motion-safe:animate-pulse" />
            {busy ? 'Connexion en cours…' : `Nouvelle tentative dans ${left} s`}
          </p>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Exemple : la page Expéditions de Quai. La recherche bascule vers « aucun résultat ». */
export default function QuaiExpeditions({ variant: initial = 'first', ...rest }) {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [variant, setVariant] = useState(initial);
  const [chips, setChips] = useState(['Statut\u00a0: en transit', 'Transporteur\u00a0: Colissimo']);
  useEffect(() => setVariant(initial), [initial]);
  useEffect(() => { const t = setTimeout(() => setDebounced(q.trim()), 220); return () => clearTimeout(t); }, [q]);
  const shown = debounced ? 'search' : variant === 'search' ? 'first' : variant;
  return (
    <div className="max-w-[1040px] mx-auto bg-[var(--surface)] border border-[var(--border)] rounded-xl sm:rounded-2xl overflow-hidden font-sans text-[var(--text)]">
      <header className="flex flex-wrap sm:flex-nowrap items-center gap-x-4 sm:gap-6 gap-y-2 px-4 sm:px-6 py-3 sm:py-0 sm:h-16 border-b border-[var(--border)]">
        <a href="#" className="inline-flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em] text-[var(--text-strong)] no-underline" aria-label="Quai, accueil">
          <svg viewBox="0 0 100 100" width="28" height="28" aria-hidden="true"><rect width="100" height="100" rx="28" style={{ fill: 'var(--accent)' }} /><rect x="29" y="22" width="42" height="34" rx="5" style={{ fill: 'var(--accent-fg)' }} /><path d="M50 22v13" fill="none" style={{ stroke: 'var(--accent)' }} strokeWidth="6" strokeLinecap="round" /><rect x="17" y="62" width="66" height="8" rx="4" style={{ fill: 'var(--accent-fg)' }} /><path d="M21 81q7-6 14.5 0t14.5 0 14.5 0 14.5 0" fill="none" style={{ stroke: 'var(--accent-fg)' }} strokeWidth="5" strokeLinecap="round" /></svg>
          Quai
        </a>
        <nav aria-label="Sections" className="order-3 sm:order-none flex gap-1 w-[calc(100%+2rem)] sm:w-auto -mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto">
          {['Expéditions', 'Entrepôts', 'Retours', 'Transporteurs'].map((l, i) => (
            <a key={l} href="#" aria-current={i === 0 ? 'page' : undefined}
              className={`flex-none inline-flex items-center h-10 sm:h-9 px-3 rounded-lg text-[15px] sm:text-sm font-medium no-underline ${i === 0 ? 'bg-[var(--raised)] text-[var(--text-strong)]' : 'text-[var(--text-muted)] hover:bg-[var(--state-hover)] hover:text-[var(--text-strong)]'}`}>{l}</a>
          ))}
        </nav>
        <label className="flex-1 sm:flex-none sm:ml-auto sm:w-[280px] flex items-center gap-2 h-11 sm:h-9 pl-3 pr-2 border border-[var(--border)] focus-within:border-[var(--border-control)] rounded-lg bg-[var(--bg)] text-[var(--text-muted)]">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <span className="sr-only">Rechercher une expédition</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une expédition" autoComplete="off"
            className="flex-1 min-w-0 h-full border-0 bg-transparent outline-none text-base sm:text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)]" />
        </label>
      </header>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-4 sm:px-6 pt-6 sm:pt-8">
        <div>
          <h1 className="m-0 text-[length:var(--t-page)] leading-[1.2] font-semibold tracking-[-0.02em] text-[var(--text-strong)]">Expéditions</h1>
          <p className="mt-1 mb-0 text-sm text-[var(--text-muted)]">Entrepôt de Vénissieux · novembre</p>
        </div>
        {shown === 'search' && chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <button key={c} type="button" onClick={() => setChips((l) => l.filter((x) => x !== c))}
                className="inline-flex items-center gap-2 h-9 sm:h-8 pl-3 pr-2 rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm sm:text-[13px] font-medium hover:bg-[var(--state-hover)]">
                {c}<span aria-hidden="true" className="text-[var(--text-muted)]">×</span><span className="sr-only">, retirer le filtre</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <EmptyState {...rest} variant={shown} query={debounced || rest.query}
        onAction={(a) => { if (a === 'clear') setQ(''); if (a === 'filters') setChips([]); }} />
    </div>
  );
}
