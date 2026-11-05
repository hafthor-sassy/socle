// TemplateSaasCalme.jsx — page complète « SaaS calme » : un composant par section, assemblés dans <TemplateSaasCalme />.
// React 18, Tailwind 3.4, framer-motion ≥ 11 (bento seulement : réarrangement FLIP par layout), tokens.css chargé.
// Couleurs uniquement par variables de tokens.css : la palette Socle (Olive par défaut) s’applique sans toucher au code.
// Marque fictive : Tilleul (devis et factures pour artisans). Sections reprises des designs Socle :
// Hero typographique, Bento filtrable, Bascule à chiffres roulants, Accordéon natif, Footer dévoilé.
// Utilisation : <TemplateSaasCalme titre="Vos devis signés avant le café." motAccent="café" filtre="tout" periode="mensuel" remise={20} effetFooter="montee" />
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { LayoutGroup, motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const EASE = 'cubic-bezier(.16,1,.3,1)';
const SPRING = 'cubic-bezier(.34,1.36,.64,1)';
const ring = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2';
const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const money = (v) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v).replace(/\u202F/g, '\u00A0');

/* ——— Logo (icône + mot-symbole vectorisé) ——— */
export function TilleulLogo({ className = 'h-7 w-auto' }) {
  return (
    <svg viewBox="0 0 292 100" aria-hidden="true" className={className}
      style={{ '--p': 'var(--accent)', '--lt': 'var(--accent-fg)', '--a': 'var(--accent-subtle)', '--ink': 'var(--text-strong)' }}>
      <rect width="100" height="100" rx="28" style={{ fill: 'var(--p)' }} />
      <path d="M50 80C31 69 20 53 25 38C28.5 28 40 24.5 50 33C60 24.5 71.5 28 75 38C80 53 69 69 50 80Z" style={{ fill: 'var(--lt)' }} />
      <path d="M50 36V72M50 52 40 44M50 60 61 51" fill="none" style={{ stroke: 'var(--p)' }} strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="73" cy="22" r="6" style={{ fill: 'var(--a)' }} />
      <path d="M144.69 70V36.58H132.63V30.24H164.05V36.58H151.99V70ZM166.97 70V40.1H174.13V70ZM166.83 36.1V29.76H174.27V36.1ZM187.52 70Q184.23 70 182.29 68.32Q180.35 66.64 180.35 62.92V30.24H187.52V62.19Q187.52 63.36 188.1 63.9Q188.67 64.44 189.75 64.44H191.94V70ZM202.47 70Q199.18 70 197.24 68.32Q195.3 66.64 195.3 62.92V30.24H202.47V62.19Q202.47 63.36 203.05 63.9Q203.62 64.44 204.7 64.44H206.89V70ZM223.15 70.67Q218.68 70.67 215.39 68.75Q212.1 66.82 210.3 63.3Q208.51 59.77 208.51 55.05Q208.51 50.32 210.3 46.83Q212.1 43.33 215.36 41.38Q218.61 39.42 223.01 39.42Q227.28 39.42 230.48 41.33Q233.68 43.24 235.44 46.83Q237.19 50.41 237.19 55.44V57.04H215.94Q216.16 61 218.09 62.97Q220.02 64.94 223.24 64.94Q225.63 64.94 227.22 63.87Q228.8 62.8 229.44 60.83L236.76 61.29Q235.57 65.62 231.94 68.15Q228.32 70.67 223.15 70.67ZM215.94 52.23H229.75Q229.53 48.59 227.7 46.83Q225.87 45.07 223.01 45.07Q220.13 45.07 218.26 46.91Q216.38 48.75 215.94 52.23ZM251.5 70.67Q246.95 70.67 244.31 67.68Q241.67 64.68 241.67 59.35V40.1H248.84V57.59Q248.84 61.34 250.08 63.1Q251.31 64.85 253.9 64.85Q256.8 64.85 258.41 62.92Q260.03 60.98 260.03 57.3V40.1H267.2V70H260.61L260.45 61.79L261.38 62.07Q260.67 66.29 258.15 68.48Q255.63 70.67 251.5 70.67ZM280.59 70Q277.3 70 275.36 68.32Q273.42 66.64 273.42 62.92V30.24H280.59V62.19Q280.59 63.36 281.17 63.9Q281.74 64.44 282.82 64.44H285.01V70Z" style={{ fill: 'var(--ink)' }} />
    </svg>
  );
}

const Eyebrow = ({ n, children }) => (
  <p className="m-0 font-mono text-[13px] font-medium uppercase leading-5 tracking-[0.04em] text-[var(--text-muted)]">
    <span className="text-[var(--text-strong)]">({n})</span> {children}
  </p>
);

/* ——— Navigation collante + menu mobile ——— */
const LINKS = [['#fonctions', 'Fonctionnalités'], ['#tarifs', 'Tarifs'], ['#avis', 'Avis'], ['#questions', 'Questions']];
export function Nav() {
  const [stuck, setStuck] = useState(false), [open, setOpen] = useState(false);
  useEffect(() => { const f = () => setStuck(window.scrollY > 8); f(); addEventListener('scroll', f, { passive: true }); return () => removeEventListener('scroll', f); }, []);
  useEffect(() => { if (!open) return; const k = (e) => e.key === 'Escape' && setOpen(false); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, [open]);
  return (
    <header className={`sticky top-0 z-20 flex h-[60px] items-center gap-8 border-b px-4 transition-[background-color,border-color] duration-300 md:h-16 md:px-[clamp(16px,4vw,56px)] ${stuck ? 'border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_84%,transparent)] backdrop-blur-md' : 'border-transparent'}`}>
      <a href="#accueil" aria-label="Tilleul, accueil" className={`inline-flex min-h-11 items-center rounded-lg ${ring}`}><TilleulLogo className="h-[26px] w-auto md:h-7" /></a>
      <nav aria-label="Principale" className="ml-2 hidden gap-1 md:flex">
        {LINKS.map(([h, l]) => <a key={h} href={h} className={`inline-flex h-9 items-center rounded-full px-3 text-[15px] text-[var(--text-muted)] no-underline transition-colors hover:bg-[var(--state-hover)] hover:text-[var(--text-strong)] ${ring}`}>{l}</a>)}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <a href="#connexion" className="hidden h-9 items-center rounded-full px-3 text-[15px] text-[var(--text-muted)] no-underline hover:text-[var(--text-strong)] md:inline-flex">Se connecter</a>
        <a href="#essai" className={`inline-flex h-9 items-center rounded-full bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-fg)] no-underline hover:bg-[var(--accent-hover)] ${ring}`}>Essai gratuit</a>
        <button type="button" aria-expanded={open} aria-controls="tl-menu" onClick={() => setOpen((o) => !o)} className={`relative -mr-2.5 size-11 rounded-full md:hidden ${ring}`}>
          <span className="sr-only">{open ? 'Fermer le menu' : 'Menu'}</span>
          <i aria-hidden="true" className={`absolute left-[14px] top-[18px] h-[1.5px] w-4 rounded bg-[var(--text-strong)] transition-transform duration-[380ms] ${open ? 'translate-y-[3.5px] rotate-45' : ''}`} style={{ transitionTimingFunction: EASE }} />
          <i aria-hidden="true" className={`absolute left-[14px] top-[25px] h-[1.5px] w-4 rounded bg-[var(--text-strong)] transition-transform duration-[380ms] ${open ? '-translate-y-[3.5px] -rotate-45' : ''}`} style={{ transitionTimingFunction: EASE }} />
        </button>
      </div>
      {open && (
        <div id="tl-menu" className="absolute inset-x-0 top-[60px] border-b border-[var(--border)] bg-[var(--bg)] px-4 pb-4 pt-2 md:hidden">
          <nav aria-label="Menu mobile" className="grid" onClick={(e) => e.target.closest('a') && setOpen(false)}>
            {[...LINKS, ['#connexion', 'Se connecter']].map(([h, l]) => <a key={l} href={h} className="flex min-h-[52px] items-center border-b border-[var(--border)] text-lg font-medium text-[var(--text-strong)] no-underline last:border-0">{l}</a>)}
          </nav>
        </div>
      )}
    </header>
  );
}

/* ——— Hero typographique : lignes réelles mesurées, entrée en cascade derrière un masque ——— */
export function Hero({ titre = 'Vos devis signés avant le café.', motAccent = 'café', entree = 'montee', duree = 1100, decalage = 110 }) {
  const words = titre.split(/\s+/);
  const h1 = useRef(null), [lines, setLines] = useState([words]), [play, setPlay] = useState(false);
  useLayoutEffect(() => {
    const measure = () => {
      const el = h1.current; if (!el) return;
      const spans = [...el.querySelectorAll('[data-probe] [data-w]')], out = []; let top = null;   /* copie à plat, invisible : les lignes se recomposent si la largeur change */
      spans.forEach((s, i) => { if (top === null || Math.abs(s.offsetTop - top) > 4) { out.push([]); top = s.offsetTop; } out[out.length - 1].push(words[i]); });
      setLines((prev) => (JSON.stringify(prev) === JSON.stringify(out) ? prev : out));
    };
    measure(); const ro = new ResizeObserver(measure); ro.observe(h1.current); document.fonts?.ready.then(measure); return () => ro.disconnect();
  }, [titre]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setPlay(false); const id = requestAnimationFrame(() => requestAnimationFrame(() => setPlay(true))); return () => cancelAnimationFrame(id); }, [titre, entree]);
  const still = prefersReduced();
  const from = { montee: 'translateY(105%)', bascule: 'translateY(100%) rotate(6deg)', flou: 'translateY(24%)' }[entree];
  const accent = motAccent.trim().toLowerCase();
  const word = (w, k) => {
    const bare = w.toLowerCase().replace(/[.,;:!?…»«"’]/g, '');
    if (!accent || bare !== accent) return <span key={k} className="inline-block whitespace-nowrap">{w}</span>;
    const core = w.replace(/[.,;:!?…]+$/, ''), tail = w.slice(core.length);
    return (
      <span key={k} className="inline-block whitespace-nowrap">
        <span className="relative text-[var(--accent)]">{core}
          <svg viewBox="0 0 400 22" preserveAspectRatio="none" className="pointer-events-none absolute -left-[1%] bottom-[-.07em] h-[.2em] w-[102%] overflow-visible">
            <path pathLength="1" d="M4 15C90 7 200 5 396 11" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeDasharray="1"
              style={{ strokeDashoffset: play || still ? 0 : 1, transition: still ? 'none' : `stroke-dashoffset 900ms cubic-bezier(.65,0,.35,1) ${120 + lines.length * decalage + duree * 0.35}ms` }} />
          </svg>
        </span>{tail}
      </span>
    );
  };
  const fade = (i) => ({ opacity: play || still ? 1 : 0, transform: play || still ? 'none' : 'translateY(16px)', transition: still ? 'none' : `opacity 900ms ${EASE} ${120 + lines.length * decalage + duree * 0.35 + 120 + i * 90}ms, transform 900ms ${EASE} ${120 + lines.length * decalage + duree * 0.35 + 120 + i * 90}ms` });
  let n = 0;
  return (
    <section aria-labelledby="tl-h1" className="px-4 pb-10 pt-6 md:px-[clamp(16px,4vw,64px)] md:pb-[clamp(40px,5vw,72px)] md:pt-[clamp(32px,7vw,112px)]">
      <div className="flex flex-col gap-6 md:gap-[clamp(24px,3.2vw,40px)]">
        <Eyebrow n="01">Devis, factures et relances pour artisans</Eyebrow>
        <h1 id="tl-h1" ref={h1} className="relative m-0 max-w-none text-[clamp(3.25rem,0.9rem+8.6vw,9.5rem)] font-semibold leading-[.94] tracking-[-0.045em] text-[var(--text-strong)] md:max-w-[14ch]">
          <span className="sr-only">{titre}</span>
          <span data-probe aria-hidden="true" className="invisible absolute inset-x-0 top-0">{words.map((w, i) => <span key={i}><span data-w className="inline-block whitespace-nowrap">{w}</span>{i < words.length - 1 ? ' ' : ''}</span>)}</span>
          <span aria-hidden="true">
            {lines.map((ln, li) => (
              <span key={li} className="-mb-[.16em] block overflow-clip pb-[.16em]">
                <span className="inline-block will-change-transform" style={{ transform: play || still ? 'none' : from, filter: entree === 'flou' && !play && !still ? 'blur(16px)' : 'none', opacity: entree === 'flou' && !play && !still ? 0 : 1,
                  transition: still ? 'none' : `transform ${duree}ms ${EASE} ${120 + li * decalage}ms, filter ${duree}ms ${EASE} ${120 + li * decalage}ms, opacity ${duree * 0.7}ms ${EASE} ${120 + li * decalage}ms` }}>
                  {ln.map((w, i) => <span key={i}>{word(w, n++)}{i < ln.length - 1 ? ' ' : ''}</span>)}
                </span>
              </span>
            ))}
          </span>
        </h1>
        <div className="grid items-end gap-6 border-t border-[var(--border)] md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_auto] md:gap-12 md:pt-[clamp(8px,2vw,24px)]">
          <p style={fade(0)} className="m-0 max-w-[46ch] text-base leading-6 md:pt-4 md:text-[17px] md:leading-[26px]">Tilleul prépare vos devis depuis le chantier, les envoie à signer, puis transforme chaque signature en facture et relance à votre place. Vous gardez les mains libres.</p>
          <dl style={fade(1)} className="m-0 grid grid-cols-2 gap-4 md:pt-4">
            {[['Artisans équipés', '12 400'], ['Délai moyen de paiement', '9 jours']].map(([t, d]) => (
              <div key={t} className="flex flex-col-reverse justify-end gap-2"><dt className="text-sm text-[var(--text-muted)]">{t}</dt><dd className="m-0 text-[32px] font-semibold leading-none tracking-[-0.03em] text-[var(--text-strong)] tabular-nums">{d}</dd></div>
            ))}
          </dl>
          <div style={fade(2)} className="order-first grid gap-3 pt-6 md:order-none md:justify-items-end md:pt-0 md:text-right">
            <a href="#essai" className={`group inline-flex min-h-14 w-full items-center justify-between gap-4 rounded-full bg-[var(--accent)] py-2 pl-6 pr-2 text-[17px] font-semibold text-[var(--accent-fg)] no-underline transition-colors hover:bg-[var(--accent-hover)] active:scale-[.98] md:w-auto md:min-w-[264px] ${ring}`}>
              Essayer 30 jours
              <span aria-hidden="true" className="grid size-10 place-items-center overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--accent-fg)_16%,transparent)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-500 group-hover:translate-x-1"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </span>
            </a>
            <p className="m-0 text-sm text-[var(--text-muted)]">Sans carte bancaire · Prêt pour la facture électronique</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ——— Apparition unique au défilement ——— */
function useReveal() {
  const ref = useRef(null), [on, setOn] = useState(false);
  useEffect(() => {
    if (prefersReduced() || !('IntersectionObserver' in window)) { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(ref.current); return () => io.disconnect();
  }, []);
  return [ref, { opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(24px)', transition: `opacity 900ms ${EASE}, transform 900ms ${EASE}` }];
}

/* ——— Aperçu du produit : un devis dessiné en HTML ——— */
const LINES = [['Dépose de la baignoire et évacuation', '1 u', '280,00 €', '280,00 €'], ['Receveur de douche extra-plat 90 × 140', '1 u', '640,00 €', '640,00 €'],
  ['Faïence murale, pose comprise', '12 m²', '54,00 €', '648,00 €'], ['Paroi de douche fixe, verre 8 mm', '1 u', '410,00 €', '410,00 €']];
export function ProductShot() {
  const [ref, style] = useReveal();
  return (
    <section aria-label="Aperçu d’un devis dans Tilleul" className="px-4 pb-16 md:px-[clamp(16px,4vw,56px)] md:pb-[clamp(64px,8vw,120px)]">
      <div ref={ref} style={style} className="mx-auto max-w-[1200px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <div aria-hidden="true" className="flex h-10 items-center gap-2 border-b border-[var(--border)] bg-[var(--raised)] px-4">
          {[0, 1, 2].map((i) => <i key={i} className="size-2.5 rounded-full bg-[var(--border)]" />)}
          <span className="ml-4 hidden font-mono text-xs text-[var(--text-muted)] md:inline">app.tilleul.fr / devis / D-2026-118</span>
        </div>
        <div className="grid md:min-h-[420px] md:grid-cols-[200px_minmax(0,1fr)]">
          <aside aria-hidden="true" className="hidden content-start gap-1 border-r border-[var(--border)] px-3 py-4 md:grid">
            {['Devis', 'Factures', 'Clients', 'Bibliothèque', 'Trésorerie'].map((b, i) => <b key={b} className={`flex h-9 items-center rounded-lg px-3 text-sm font-medium ${i ? 'text-[var(--text-muted)]' : 'bg-[var(--accent-subtle)] text-[var(--text-strong)]'}`}>{b}</b>)}
          </aside>
          <div className="grid content-start gap-4 px-4 py-5 md:gap-6 md:px-[clamp(16px,3vw,40px)] md:py-8">
            <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:gap-6">
              <div>
                <p className="m-0 font-mono text-[13px] text-[var(--text-muted)]">Devis D-2026-118</p>
                <h2 className="m-0 mt-1 text-[19px] font-semibold leading-[26px] tracking-[-0.02em] text-[var(--text-strong)] md:text-[22px] md:leading-7">Rénovation de salle de bains</h2>
                <p className="m-0 mt-1 text-sm text-[var(--text-muted)]">Mme Hélène Lefèvre · 14 rue des Tanneurs, Nantes</p>
              </div>
              <p className="m-0 inline-flex h-8 flex-none items-center gap-2 rounded-full bg-[var(--tint-green-bg)] px-3 text-sm font-medium text-[var(--tint-green-fg)]"><span className="size-2 rounded-full bg-current" />Signé ce matin à 07:42</p>
            </div>
            <table className="w-full border-collapse text-sm tabular-nums">
              <caption className="sr-only">Lignes du devis</caption>
              <thead className="hidden md:table-header-group"><tr>{['Ouvrage', 'Qté', 'Prix unitaire', 'Total HT'].map((t, i) => <th key={t} scope="col" className={`border-b border-[var(--border)] pb-2 text-[13px] font-medium text-[var(--text-muted)] ${i ? 'pl-4 text-right' : 'text-left'}`}>{t}</th>)}</tr></thead>
              <tbody>
                {LINES.map((l) => (
                  <tr key={l[0]} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 border-b border-[var(--border)] py-3 md:table-row md:py-0">
                    <td className="col-span-2 text-[15px] text-[var(--text-strong)] md:border-b md:border-[var(--border)] md:py-3.5 md:text-sm md:text-[var(--text)]">{l[0]}</td>
                    <td className="text-[15px] text-[var(--text-muted)] md:border-b md:border-[var(--border)] md:py-3.5 md:pl-4 md:text-right md:text-sm">{l[1]}</td>
                    <td className="hidden md:table-cell md:border-b md:border-[var(--border)] md:py-3.5 md:pl-4 md:text-right">{l[2]}</td>
                    <td className="text-right text-[15px] font-medium text-[var(--text-strong)] md:border-b md:border-[var(--border)] md:py-3.5 md:pl-4 md:text-sm">{l[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="grid gap-2 text-[15px] tabular-nums md:min-w-[280px] md:justify-self-end md:text-sm">
              <p className="m-0 flex justify-between gap-6 text-[var(--text-muted)]"><span>Total HT</span><b className="font-medium text-[var(--text)]">1 978,00 €</b></p>
              <p className="m-0 flex justify-between gap-6 text-[var(--text-muted)]"><span>TVA 10 %</span><b className="font-medium text-[var(--text)]">197,80 €</b></p>
              <p className="m-0 flex justify-between gap-6 border-t border-[var(--border)] pt-2 text-[17px] text-[var(--text-strong)]"><span>Total TTC</span><b className="font-semibold">2 175,80 €</b></p>
            </div>
            <div className="flex flex-col items-stretch justify-between gap-4 pt-2 md:flex-row md:items-center">
              <span className="inline-flex h-8 items-center rounded-full bg-[var(--raised)] px-3 text-sm">Acompte de 30 % demandé</span>
              <span className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-fg)] md:h-10">Transformer en facture →</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Proof() {
  return (
    <section aria-labelledby="tl-proof" className="mx-auto grid max-w-[1200px] gap-6 px-4 pb-16 md:px-[clamp(16px,4vw,56px)] md:pb-[clamp(64px,8vw,112px)]">
      <h2 id="tl-proof" className="m-0 text-center text-sm font-medium text-[var(--text-muted)]">Ils envoient leurs devis avec Tilleul</h2>
      <ul role="list" className="m-0 grid list-none grid-cols-2 gap-x-4 gap-y-3 p-0 text-center md:flex md:flex-wrap md:justify-center md:gap-x-10">
        {['Menuiserie Vasseur', 'Ateliers Combe', 'Plomberie du Lez', 'Toitures Arnal', 'Peyrac Électricité', 'Carrelages Ruiz'].map((n) => <li key={n} className="text-base font-semibold tracking-[-0.03em] text-[var(--text-muted)] md:text-[19px]">{n}</li>)}
      </ul>
    </section>
  );
}

/* ——— Bento filtrable : framer-motion déplace et redimensionne les cases (layout) ——— */
const FEATURES = [
  { id: 'devis', cats: ['devis', 'factures'], tout: '4x2', t: 'Un devis en trois minutes', p: 'Choisissez vos ouvrages, Tilleul calcule la TVA, l’acompte et les mentions obligatoires. Signé, il devient facture d’un geste.',
    art: <div className="grid w-full gap-1 rounded-xl bg-[var(--raised)] p-4 text-sm tabular-nums">{[['Dépose baignoire', '280 €'], ['Receveur extra-plat', '640 €'], ['Faïence murale · 12 m²', '648 €']].map(([a, b], i) => <div key={a} className={`flex justify-between rounded-lg bg-[var(--surface)] px-3 py-2.5 ${i === 2 ? 'shadow-[inset_0_0_0_1px_var(--accent)]' : ''}`}><span>{a}</span><b className="font-medium text-[var(--text-strong)]">{b}</b></div>)}<div className="mt-1 flex justify-between px-3 py-2.5 text-base font-semibold text-[var(--text-strong)]"><span>Total TTC</span><b>2 175,80 €</b></div><span className="justify-self-end rounded-full bg-[var(--accent)] px-4 py-2 font-medium text-[var(--accent-fg)]">Envoyer à signer</span></div> },
  { id: 'signature', cats: ['devis'], tout: '2x1', t: 'Signature sur le téléphone', p: 'Votre client signe du doigt, l’horodatage fait foi.',
    art: <div className="grid gap-2"><svg viewBox="0 0 220 56" className="h-[60px] w-full max-w-[260px] overflow-visible"><path d="M6 38c14-22 22-30 28-26s-10 30-4 32 18-30 26-28-4 24 4 24 14-18 22-18 4 14 12 14 12-10 22-12 18 6 30 2 22-6 36-8" fill="none" stroke="var(--text-strong)" strokeWidth="2.25" strokeLinecap="round" /></svg><span className="justify-self-start rounded-full bg-[var(--tint-green-bg)] px-2.5 py-1 text-[13px] font-medium text-[var(--tint-green-fg)]">Signé · 07:42</span></div> },
  { id: 'prix', cats: ['devis'], tout: '2x1', t: 'Vos prix, rangés', p: 'Vos ouvrages à vos tarifs, en deux lettres.',
    art: <div className="grid w-full gap-1.5 text-sm"><span className="flex h-9 items-center rounded-lg border border-[var(--border-control)] px-3 text-[var(--text-strong)]">pose car</span><span className="flex justify-between rounded-lg bg-[var(--raised)] px-3 py-1.5"><b className="font-medium">Pose carrelage sol</b><em className="not-italic text-[var(--text-muted)]">48 €/m²</em></span></div> },
  { id: 'relances', cats: ['factures'], tout: '3x1', t: 'Relances qui restent polies', p: 'Un rappel courtois à J+7, une relance ferme à J+15. Vous ne relancez plus personne.',
    art: <ol className="relative m-0 grid w-full list-none grid-cols-3 gap-2 p-0 text-[13px] before:absolute before:inset-x-3 before:top-[11px] before:h-0.5 before:bg-[var(--border)]">{[['J', 'Facture envoyée', 1], ['J+7', 'Rappel courtois', 1], ['J+15', 'Relance ferme', 0]].map(([b, s, on]) => <li key={b} className="relative grid gap-2"><b className={`grid h-6 w-max min-w-6 place-items-center rounded-full border px-1.5 font-mono text-xs font-semibold ${on ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]' : 'border-[var(--border-control)] bg-[var(--surface)] text-[var(--text-strong)]'}`}>{b}</b><span className={on ? '' : 'text-[var(--text-muted)]'}>{s}</span></li>)}</ol> },
  { id: 'paiement', cats: ['factures', 'suivi'], tout: '3x1', t: 'Payé en ligne, rapproché seul', p: 'Carte ou virement instantané depuis la facture. Le paiement se coche tout seul.',
    art: <div className="flex w-full flex-wrap items-center gap-2"><span className="mr-auto text-[28px] font-semibold tracking-[-0.03em] text-[var(--text-strong)] tabular-nums">1 840,00 €</span>{['Carte', 'Virement'].map((m) => <span key={m} className="rounded-full border border-[var(--border)] px-3 py-1.5 text-[13px]">{m}</span>)}<span className="rounded-full bg-[var(--tint-green-bg)] px-3 py-1.5 text-[13px] font-semibold text-[var(--tint-green-fg)]">✓ Payée</span></div> },
  { id: 'hors-ligne', cats: ['devis', 'suivi'], tout: '2x1', t: 'Même sans réseau', p: 'Au sous-sol ou en rase campagne : tout part dès que le réseau revient.',
    art: <span className="inline-flex items-center gap-2.5 rounded-full bg-[var(--tint-amber-bg)] px-3.5 py-2 text-[13px] font-medium text-[var(--tint-amber-fg)]"><span className="size-2 rounded-full bg-current" />Hors ligne · 3 devis en attente d’envoi</span> },
  { id: 'tresorerie', cats: ['suivi'], tout: '4x1', lead: 'suivi', t: 'La trésorerie, d’un coup d’œil', p: 'Ce qui est encaissé, ce qui arrive, ce qui traîne.',
    art: <div className="relative flex h-28 w-full items-end gap-2 pt-8 md:h-full">{[.42, .55, .48, .66, .61, .84].map((h, i) => <i key={i} className={`flex-1 rounded-t-md border ${i === 5 ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)]'}`} style={{ height: `${h * 100}%` }} />)}<em className="absolute right-0 top-0 rounded-full bg-[var(--tint-green-bg)] px-2.5 text-[13px] font-semibold not-italic leading-5 text-[var(--tint-green-fg)]">+18 % sur 6 mois</em></div> },
];
const FILTERS = [['tout', 'Tout'], ['devis', 'Devis'], ['factures', 'Factures'], ['suivi', 'Suivi']];
const LAYOUT = { 1: ['6x2'], 2: ['3x2', '3x2'], 3: ['4x2', '2x1', '2x1'], 4: ['3x2', '3x1', '3x1', '6x1'] };
const LABEL = { tout: 'fonctionnalités', devis: 'pour les devis', factures: 'pour les factures', suivi: 'pour le suivi' };
export function Features({ filtre = 'tout' }) {
  const [f, setF] = useState(filtre); useEffect(() => setF(filtre), [filtre]);
  const reduce = useReducedMotion();
  const vis = useMemo(() => {
    const list = FEATURES.filter((x) => f === 'tout' || x.cats.includes(f));
    if (f !== 'tout') list.sort((a, b) => (b.lead === f) - (a.lead === f));
    return list.map((x, i) => ({ ...x, size: f === 'tout' ? x.tout : (LAYOUT[list.length] || [])[i] || '2x1' }));
  }, [f]);
  const spring = reduce ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 30 };
  return (
    <section id="fonctions" aria-labelledby="tl-bf" className="scroll-mt-[72px] border-t border-[var(--border)] px-4 py-12 md:px-[clamp(16px,4vw,56px)] md:py-[clamp(48px,7vw,96px)]">
      <div className="mx-auto grid max-w-[1200px] gap-4"><Eyebrow n="02">Fonctionnalités</Eyebrow>
        <h2 id="tl-bf" className="m-0 max-w-[22ch] text-[clamp(1.875rem,1.2rem+2.4vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-[var(--text-strong)]">Tout le chemin, du devis au virement.</h2></div>
      <div className="mx-auto mb-4 mt-6 flex max-w-[1200px] flex-col gap-3 md:mt-8 md:flex-row md:items-center md:justify-between">
        <LayoutGroup id="tl-filtres">
          <div role="toolbar" aria-label="Filtrer les fonctionnalités" className="relative -mx-4 flex gap-1 overflow-x-auto rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 [scrollbar-width:none] md:mx-0 md:inline-flex">
            {FILTERS.map(([k, l]) => {
              const n = k === 'tout' ? FEATURES.length : FEATURES.filter((x) => x.cats.includes(k)).length, on = f === k;
              return (
                <button key={k} type="button" aria-pressed={on} onClick={() => setF(k)} className={`relative inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full px-4 text-[15px] font-medium transition-colors md:min-h-10 ${on ? 'text-[var(--accent-fg)]' : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'} ${ring}`}>
                  {on && <motion.span layoutId="tl-pill" className="absolute inset-0 rounded-full bg-[var(--accent)]" transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 32 }} />}
                  <span className="relative">{l}</span>
                  <span className={`relative min-w-[22px] rounded-full px-1.5 py-0.5 text-center font-mono text-xs ${on ? 'bg-[color-mix(in_srgb,var(--accent-fg)_18%,transparent)]' : 'bg-[var(--raised)]'}`}>{n}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
        <p role="status" aria-live="polite" className="m-0 text-sm text-[var(--text-muted)] tabular-nums">{vis.length} fonctionnalités{f === 'tout' ? '' : ' ' + LABEL[f]}</p>
      </div>
      <motion.ul layout className="relative mx-auto grid max-w-[1200px] list-none grid-cols-1 gap-3 p-0 md:auto-rows-[200px] md:grid-cols-6">
        <AnimatePresence mode="popLayout" initial={false}>
          {vis.map((x) => {
            const [c, r] = x.size.split('x');
            return (
              <motion.li key={x.id} layout transition={spring} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94, transition: { duration: reduce ? 0 : 0.28 } }}
                style={{ '--c': c, '--r': r }} className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] transition-colors hover:border-[var(--border-strong)] md:[grid-column:span_var(--c)] md:[grid-row:span_var(--r)]">
                <motion.div layout="position" className={`flex h-full gap-4 p-4 md:p-5 ${x.id === 'tresorerie' ? 'flex-col md:flex-row' : 'flex-col'}`}>
                  <div className={x.id === 'tresorerie' ? 'md:w-[38%] md:flex-none' : ''}>
                    <h3 className="m-0 text-base font-semibold leading-6 tracking-[-0.01em] text-[var(--text-strong)] md:text-[17px]">{x.t}</h3>
                    <p className="m-0 mt-1 max-w-[46ch] text-sm leading-5 text-[var(--text-muted)]">{x.p}</p>
                  </div>
                  <div aria-hidden="true" className="relative flex min-h-[72px] flex-1 items-end">{x.art}</div>
                </motion.div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ul>
    </section>
  );
}

/* ——— Pricing à bascule : chiffres roulants (colonnes 0–9 en transition CSS) ——— */
export function RollingNumber({ value, duration = 700, stagger = 60 }) {
  const digits = String(value).split(''), [ready, setReady] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setReady(true)); return () => cancelAnimationFrame(id); }, []);
  const still = !ready || prefersReduced();
  return (
    <span aria-hidden="true" className="inline-flex h-[1em] items-start font-semibold leading-none tracking-[-0.04em] text-[var(--text-strong)] tabular-nums">
      {digits.map((d, i) => {
        const rank = digits.length - 1 - i;
        return (
          <span key={rank} className="inline-block h-[1em] w-[.6em] overflow-hidden">
            <span className="flex flex-col" style={{ transform: `translateY(${-d * 10}%)`, transition: still ? 'none' : `transform ${duration}ms ${SPRING} ${rank * stagger}ms` }}>
              {'0123456789'.split('').map((c) => <span key={c} className="block h-[1em] text-center">{c}</span>)}
            </span>
          </span>
        );
      })}
      <span className="ml-[.1em] mt-[.14em] inline-block text-[.5em] leading-none tracking-normal">€</span>
    </span>
  );
}
const PLANS = [
  { name: 'Solo', monthly: 15, desc: 'Pour l’artisan qui fait tout lui-même.', cta: 'Commencer l’essai', features: ['1 utilisateur', 'Devis et factures illimités', 'Signature électronique', 'Relances automatiques'] },
  { name: 'Atelier', monthly: 29, tag: 'Le plus choisi', desc: 'Pour une équipe de deux à dix compagnons.', cta: 'Essayer Atelier 30 jours', features: ['5 utilisateurs', 'Paiement en ligne', 'Bibliothèque d’ouvrages partagée', 'Export comptable', 'Assistance par téléphone'] },
  { name: 'Entreprise', monthly: 59, desc: 'Pour plusieurs équipes et un bureau d’études.', cta: 'Parler à un conseiller', features: ['Tout Atelier, et :', 'Utilisateurs illimités', 'Situations de travaux', 'Rôles et validations', 'Interlocuteur dédié'] },
];
export function Pricing({ periode = 'mensuel', remise = 20, featured = 1 }) {
  const [p, setP] = useState(periode); useEffect(() => setP(periode), [periode]);
  const price = (m) => (p === 'annuel' ? Math.round(m * (1 - remise / 100)) : m);
  const radios = [['mensuel', 'Mensuel'], ['annuel', 'Annuel']];
  return (
    <section id="tarifs" aria-labelledby="tl-pb" className="scroll-mt-[72px] border-t border-[var(--border)] px-0 py-16 md:px-[clamp(16px,4vw,56px)] md:py-[clamp(72px,9vw,128px)]">
      <header className="mx-auto grid max-w-[1120px] justify-items-center px-5 text-center">
        <Eyebrow n="03">Tarifs</Eyebrow>
        <h2 id="tl-pb" className="m-0 mt-4 max-w-[18ch] text-[clamp(2rem,1.5rem+1.6vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-[var(--text-strong)]">Un prix par mois, jamais par facture.</h2>
        <p className="m-0 mt-4 max-w-[54ch] text-[17px] leading-relaxed text-[var(--text-muted)]">Devis et factures illimités dans toutes les offres. Changez d’offre quand l’atelier grandit, sans rien ressaisir.</p>
        <div role="radiogroup" aria-label="Période de facturation" className="relative mt-8 inline-grid grid-cols-2 rounded-full border border-[var(--border)] bg-[var(--raised)] p-1"
          onKeyDown={(e) => { if (['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); setP(e.key === 'ArrowLeft' ? 'mensuel' : 'annuel'); } }}>
          <span aria-hidden="true" className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-[var(--surface)] shadow-[0_0_0_1px_var(--border)] transition-transform duration-500" style={{ transform: p === 'annuel' ? 'translateX(100%)' : 'none', transitionTimingFunction: SPRING }} />
          {radios.map(([v, l]) => (
            <button key={v} type="button" role="radio" aria-checked={p === v} tabIndex={p === v ? 0 : -1} onClick={() => setP(v)} className={`relative z-10 inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-medium ${p === v ? 'text-[var(--text-strong)]' : 'text-[var(--text-muted)]'} ${ring}`}>
              {l}{v === 'annuel' && <span className={`inline-flex h-[22px] items-center rounded-full border px-2 text-xs font-semibold transition-colors ${p === 'annuel' ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]' : 'border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)] text-[var(--text-strong)]'}`}>−{remise} %</span>}
            </button>
          ))}
        </div>
      </header>
      <ul role="list" className="mx-auto mt-12 flex max-w-[1120px] list-none snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:grid md:grid-cols-3 md:overflow-visible md:px-0">
        {PLANS.map((x, i) => {
          const v = price(x.monthly), on = i === featured;
          return (
            <li key={x.name} className={`relative flex w-[82%] flex-none snap-center flex-col rounded-2xl border border-[var(--border)] px-6 pb-6 pt-7 md:w-auto ${on ? 'bg-[var(--raised)] before:absolute before:inset-x-6 before:top-0 before:h-0.5 before:rounded-b before:bg-[var(--accent)]' : 'bg-[var(--surface)]'}`}>
              <h3 className="m-0 flex items-center gap-2 text-lg font-semibold text-[var(--text-strong)]">{x.name}{x.tag && <span className="rounded-full border border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)] px-2 py-0.5 text-xs font-semibold">{x.tag}</span>}</h3>
              <p className="m-0 mt-1 text-[15px] text-[var(--text-muted)]">{x.desc}</p>
              <div className="mt-6 flex items-end gap-2 text-[56px]">
                <RollingNumber value={v} /><span aria-hidden="true" className="mb-1 grid text-sm leading-tight"><span className="font-medium text-[var(--text-strong)]">/ mois</span><span className="text-[var(--text-muted)]">hors taxes</span></span>
                <span className="sr-only">{money(v)} hors taxes par mois{p === 'annuel' ? `, facturé ${money(v * 12)} par an` : ''}</span>
              </div>
              <p className="m-0 mt-2 min-h-[44px] text-sm text-[var(--text-muted)]">{p === 'annuel' ? <><s>{money(x.monthly)}</s> soit {money(v * 12)} par an · <b className="font-semibold text-[var(--text-strong)]">{money((x.monthly - v) * 12)} d’économie</b></> : 'Facturé chaque mois, sans engagement'}</p>
              <a href={i === 2 ? '#contact' : '#essai'} className={`mt-4 inline-flex min-h-11 items-center justify-center rounded-full border text-[15px] font-medium no-underline ${on ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]' : 'border-[var(--border-control)] text-[var(--text-strong)] hover:bg-[var(--state-hover)]'} ${ring}`}>{x.cta}</a>
              <ul role="list" className="m-0 mt-6 grid list-none gap-3 border-t border-[var(--border)] p-0 pt-6 text-[15px]">
                {x.features.map((f) => <li key={f} className="flex gap-3"><span aria-hidden="true" className="mt-0.5 grid size-5 flex-none place-items-center rounded-full bg-[var(--accent-subtle)] text-[11px] text-[var(--text-strong)]">✓</span>{f}</li>)}
              </ul>
            </li>
          );
        })}
      </ul>
      <p aria-live="polite" className="sr-only">Tarifs {p === 'annuel' ? 'annuels' : 'mensuels'} : {PLANS.map((x) => `${x.name} ${money(price(x.monthly))}`).join(', ')} hors taxes par mois.</p>
      <p className="m-0 mt-4 px-5 text-center text-sm text-[var(--text-muted)]">Prix hors taxes. Résiliable en un clic, vos données restent exportables.</p>
    </section>
  );
}

export function Quote() {
  const [ref, style] = useReveal();
  return (
    <section id="avis" aria-label="Avis d’un client" className="scroll-mt-[72px] border-t border-[var(--border)] px-4 py-16 md:px-[clamp(16px,4vw,56px)] md:py-[clamp(72px,9vw,128px)]">
      <figure ref={ref} style={style} className="m-0 mx-auto grid max-w-[960px] gap-8">
        <blockquote className="m-0"><p className="m-0 text-[clamp(1.625rem,1rem+2.2vw,3rem)] font-medium leading-[1.15] tracking-[-0.03em] text-[var(--text-strong)] [text-wrap:balance]">« Je faisais mes devis le dimanche soir. Maintenant je les envoie depuis la camionnette, et la moitié sont signés avant que je sois rentré. »</p></blockquote>
        <figcaption className="flex items-center gap-4"><span aria-hidden="true" className="grid size-12 flex-none place-items-center rounded-full bg-[var(--accent-subtle)] text-[15px] font-semibold text-[var(--text-strong)]">SV</span><span className="grid text-sm leading-[22px] text-[var(--text-muted)] md:text-[15px]"><b className="font-semibold text-[var(--text-strong)]">Sébastien Vasseur</b>Menuisier à Nantes, 4 compagnons · client depuis 2024</span></figcaption>
      </figure>
    </section>
  );
}

/* ——— FAQ : details / summary natifs, exclusifs par l’attribut name, hauteur animée par le navigateur quand il sait le faire ——— */
const FAQ = [
  ['facture-electronique', 'Tilleul est-il prêt pour la facture électronique ?', 'Oui. Vos factures partent au format exigé et Tilleul reçoit aussi celles de vos fournisseurs. Vous n’avez rien à paramétrer : le changement se fait de notre côté, à la date prévue par la loi.'],
  ['import', 'Puis-je reprendre mes clients et mes prix ?', 'Importez un fichier de tableur ou envoyez-nous votre export : nous reprenons clients, ouvrages et numérotation en moins de 48 heures, gratuitement.'],
  ['mentions', 'Les mentions obligatoires sont-elles ajoutées ?', 'Toutes, selon votre statut : assurance décennale et zone couverte, taux de TVA réduits et attestation simplifiée, conditions d’acompte et pénalités de retard.'],
  ['hors-ligne', 'Ça marche vraiment sans réseau ?', 'L’application garde vos clients et votre bibliothèque sur le téléphone. Vous rédigez et faites signer hors ligne ; l’envoi part tout seul dès que le réseau revient.'],
  ['resiliation', 'Puis-je arrêter quand je veux ?', 'Oui, en un clic depuis vos réglages, sans préavis. Vos devis et factures restent consultables et exportables pendant dix ans, comme la loi l’impose.'],
];
export function Faq() {
  return (
    <section id="questions" aria-labelledby="tl-faq" className="grid scroll-mt-[72px] border-t border-[var(--border)] px-4 pb-20 pt-16 [interpolate-size:allow-keywords] md:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] md:gap-16 md:px-[max(clamp(16px,4vw,56px),calc((100%-1120px)/2))] md:pb-[clamp(96px,10vw,160px)] md:pt-[clamp(72px,9vw,128px)]">
      <div className="flex flex-col gap-3 md:sticky md:top-24 md:gap-4 md:self-start">
        <Eyebrow n="04">Questions</Eyebrow>
        <h2 id="tl-faq" className="m-0 text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--text-strong)] md:text-[clamp(28px,1.6vw+16px,40px)]">Questions fréquentes</h2>
        <p className="m-0 text-[15px] leading-[22px] text-[var(--text-muted)] md:text-base">Ce que les artisans nous demandent avant de passer à Tilleul.</p>
        <div className="order-last mt-6 grid gap-1 rounded-xl bg-[var(--raised)] p-5 md:order-none">
          <p className="m-0 font-semibold text-[var(--text-strong)]">Une autre question ?</p>
          <p className="m-0 text-[15px] text-[var(--text-muted)]">L’équipe vous répond en moins d’une heure, du lundi au vendredi.</p>
          <a href="#contact" className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-medium text-[var(--accent)] no-underline">Écrire à l’équipe →</a>
        </div>
      </div>
      <div className="mt-6 border-t border-[var(--border)] md:mt-0">
        {FAQ.map(([id, q, a], i) => (
          <details key={id} id={id} name="faq-tilleul" open={i === 0} className="group border-b border-[var(--border)] [&::details-content]:h-0 [&::details-content]:overflow-clip [&::details-content]:transition-[height,content-visibility] [&::details-content]:duration-300 [&::details-content]:[transition-behavior:allow-discrete] open:[&::details-content]:h-auto">
            <summary className={`flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 rounded-lg py-4 pr-1 md:gap-6 [&::-webkit-details-marker]:hidden ${ring}`}>
              <span className="text-base font-medium leading-[22px] tracking-[-0.01em] text-[var(--text-strong)] md:text-[17px] md:leading-6">{q}</span>
              <span aria-hidden="true" className="relative size-8 flex-none rounded-full border border-[var(--border)] transition-[transform,background-color] duration-300 group-open:rotate-180 group-open:border-[var(--accent)] group-open:bg-[var(--accent)] group-open:text-[var(--accent-fg)]">
                <i className="absolute left-1/2 top-1/2 -ml-1.5 -mt-px h-[1.5px] w-3 rounded bg-current" />
                <i className="absolute left-1/2 top-1/2 -ml-1.5 -mt-px h-[1.5px] w-3 rotate-90 rounded bg-current transition-[transform,opacity] duration-300 group-open:scale-x-[.2] group-open:opacity-0" />
              </span>
            </summary>
            <p className="m-0 max-w-[62ch] pb-5 text-[15px] leading-6 md:pb-6 md:pr-16 md:text-base md:leading-[26px]">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ——— Footer dévoilé : la page se soulève et découvre le footer, collé dessous ——— */
export function RevealFooter({ effet = 'montee', children }) {
  const page = useRef(null), foot = useRef(null), [pr, setPr] = useState(1), [flat, setFlat] = useState(false);
  useEffect(() => {
    let raf = 0;
    const measure = () => { raf = 0; const h = foot.current.offsetHeight || 1; setFlat(h > innerHeight - 48); setPr(Math.max(0, Math.min(1, (innerHeight - page.current.getBoundingClientRect().bottom) / h))); };
    const on = () => { if (!raf) raf = requestAnimationFrame(measure); };
    measure(); addEventListener('scroll', on, { passive: true }); addEventListener('resize', on);
    return () => { removeEventListener('scroll', on); removeEventListener('resize', on); cancelAnimationFrame(raf); };
  }, []);
  const still = prefersReduced();
  const t = still ? 'none' : effet === 'echelle' ? `scale(${0.92 + pr * 0.08})` : `translate3d(0, ${(1 - pr) * 96}px, 0)`;
  return (
    <div className="relative isolate bg-[var(--bg)] text-[var(--text)]">
      <div ref={page} className="relative z-[1] rounded-b-3xl border-b border-[var(--border)] bg-[var(--bg)]">{children}</div>
      <footer ref={foot} id="essai" aria-labelledby="tl-foot" className={`${flat ? 'relative' : 'sticky'} bottom-0 z-0 overflow-hidden bg-[var(--surface)]`}>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] bg-[var(--bg)]" style={{ opacity: (1 - pr) * 0.7 }} />
        <div className="relative mx-auto max-w-[1200px] origin-bottom px-4 pb-6 pt-12 md:px-[clamp(16px,4vw,56px)] md:pb-8 md:pt-24" style={{ transform: t }}>
          <div className="grid items-end gap-6 border-b border-[var(--border)] pb-8 md:grid-cols-[minmax(0,1fr)_auto] md:gap-8 md:pb-16">
            <h2 id="tl-foot" className="m-0 max-w-[14ch] text-[clamp(2.25rem,1rem+3.6vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-[var(--text-strong)]">Votre prochain devis part ce soir.</h2>
            <div className="grid gap-3 md:justify-items-end">
              <a href="#essai" className={`inline-flex h-12 items-center justify-center rounded-full bg-[var(--accent)] px-6 font-medium text-[var(--accent-fg)] no-underline hover:bg-[var(--accent-hover)] ${ring}`}>Essayer 30 jours</a>
              <p className="m-0 text-center text-sm text-[var(--text-muted)]">Sans carte bancaire · Résiliable en un clic</p>
            </div>
          </div>
          <div className="grid gap-0 py-6 md:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.3fr)] md:gap-8 md:py-12">
            {[['Produit', ['Devis', 'Factures', 'Paiement en ligne', 'Tarifs']], ['Métiers', ['Menuisiers', 'Plombiers', 'Électriciens', 'Peintres']], ['Tilleul', ['À propos', 'Recrutement', 'Guides', 'État du service']]].map(([t, l]) => (
              <nav key={t} aria-label={t} className="border-b border-[var(--border)] py-3 md:border-0 md:py-0">
                <p className="m-0 mb-2 font-mono text-xs uppercase tracking-[0.04em] text-[var(--text-muted)] md:mb-4">{t}</p>
                <ul role="list" className="m-0 grid list-none grid-cols-2 gap-1 p-0 md:grid-cols-1">{l.map((x) => <li key={x}><a href="#" className="inline-flex min-h-11 items-center text-base text-[var(--text)] no-underline hover:underline md:min-h-8 md:text-sm">{x}</a></li>)}</ul>
              </nav>
            ))}
            <div id="contact" className="grid content-start gap-2 pt-6 md:pt-0">
              <p className="m-0 font-mono text-xs uppercase tracking-[0.04em] text-[var(--text-muted)]">Une question ?</p>
              <a href="#" className="text-[clamp(1.5rem,1.2rem+.8vw,2rem)] font-semibold tracking-[-0.02em] text-[var(--text-strong)] no-underline tabular-nums">01 99 00 42 18</a>
              <p className="m-0 text-sm text-[var(--text-muted)]">Du lundi au vendredi, de 7 h 30 à 19 h. Une équipe basée à Clermont-Ferrand.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[var(--border)] pt-6 text-sm text-[var(--text-muted)]">
            <TilleulLogo className="h-6 w-auto" />
            <p className="m-0 inline-flex items-center gap-2"><span className="size-2 rounded-full bg-[var(--up)]" />Tous les services fonctionnent</p>
            <nav aria-label="Informations légales" className="flex gap-6 md:ml-auto">{['Mentions légales', 'Confidentialité', 'Cookies'].map((x) => <a key={x} href="#" className="inline-flex min-h-11 items-center text-[var(--text-muted)] no-underline hover:text-[var(--text-strong)]">{x}</a>)}</nav>
            <p className="m-0 basis-full text-xs">© 2026 Tilleul SAS, logiciel de devis et de facturation (marque fictive).</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ——— La page ——— */
export default function TemplateSaasCalme({ titre, motAccent, entree = 'montee', filtre = 'tout', periode = 'mensuel', remise = 20, effetFooter = 'montee' }) {
  return (
    <div id="accueil" className="font-sans [scroll-behavior:smooth] motion-reduce:[scroll-behavior:auto]">
      <RevealFooter effet={effetFooter}>
        <a href="#tl-main" className="absolute -top-16 left-4 z-30 rounded-lg bg-[var(--accent)] px-4 py-3 font-medium text-[var(--accent-fg)] focus:top-3">Aller au contenu</a>
        <Nav />
        <main id="tl-main">
          <Hero titre={titre} motAccent={motAccent} entree={entree} />
          <ProductShot />
          <Proof />
          <Features filtre={filtre} />
          <Pricing periode={periode} remise={remise} />
          <Quote />
          <Faq />
        </main>
      </RevealFooter>
    </div>
  );
}
