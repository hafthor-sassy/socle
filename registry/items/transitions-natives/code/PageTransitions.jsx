// Transitions de page natives — React + Tailwind CSS. View Transitions API, aucune bibliothèque.
// const navigate = useViewTransition({ style: 'glisse', duration: 420 });
// navigate(() => setPage('detail'), { direction: 'fwd', shared: [[imgEl, 'vt-img'], [titleEl, 'vt-title']] });
// Sans l'API (ou avec « réduire les animations »), l'état change instantanément : repli invisible.
// Couleurs : variables de tokens.css uniquement. Démo complète : <OurletShop />.
import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

/**
 * @typedef {'glisse'|'fondu'|'profondeur'} VTStyle
 * @typedef {'emphase'|'ressort'|'douce'} VTEase
 * @typedef {Object} VTOptions
 * @property {VTStyle} [style]      mouvement du reste de la page
 * @property {number}  [duration]   ms (120 à 1200)
 * @property {VTEase}  [ease]       courbe des éléments partagés
 */

export const EASES = {
  emphase: 'cubic-bezier(.2, 0, 0, 1)',
  douce: 'cubic-bezier(.4, 0, .2, 1)',
  ressort: 'linear(0, 0.029, 0.09, 0.183, 0.291, 0.403, 0.502, 0.606, 0.701, 0.775, 0.846, 0.905, 0.947, 0.984, 1.011, 1.028, 1.041, 1.048, 1.051, 1.05, 1.047, 1.043, 1.038, 1.033, 1.027, 1.021, 1.017, 1.013, 1.009, 1.006, 1.003, 1)',
};

/* Pseudo-éléments ::view-transition-* : ils vivent sur <html>, d'où une feuille globale injectée une fois. */
const VT_CSS = `
::view-transition-group(*){animation-duration:var(--vt-dur,420ms);animation-timing-function:var(--vt-ease,cubic-bezier(.2,0,0,1))}
::view-transition-old(root),::view-transition-new(root){animation:none}
::view-transition-old(vt-view),::view-transition-new(vt-view){animation-duration:var(--vt-dur,420ms);animation-timing-function:cubic-bezier(.2,0,0,1);animation-fill-mode:both}
::view-transition-old(vt-img),::view-transition-new(vt-img){height:100%;width:100%;object-fit:cover}
::view-transition-old(vt-title),::view-transition-new(vt-title){height:100%;width:auto;object-fit:none;object-position:left top}
html[data-vt-style=glisse][data-vt-dir=fwd]::view-transition-old(vt-view){animation-name:vt-out-l}
html[data-vt-style=glisse][data-vt-dir=fwd]::view-transition-new(vt-view){animation-name:vt-in-r}
html[data-vt-style=glisse][data-vt-dir=back]::view-transition-old(vt-view){animation-name:vt-out-r}
html[data-vt-style=glisse][data-vt-dir=back]::view-transition-new(vt-view){animation-name:vt-in-l}
html[data-vt-style=profondeur][data-vt-dir=fwd]::view-transition-old(vt-view){animation-name:vt-sink}
html[data-vt-style=profondeur][data-vt-dir=fwd]::view-transition-new(vt-view){animation-name:vt-rise}
html[data-vt-style=profondeur][data-vt-dir=back]::view-transition-old(vt-view){animation-name:vt-fade-out}
html[data-vt-style=profondeur][data-vt-dir=back]::view-transition-new(vt-view){animation-name:vt-unsink}
html[data-vt-style=fondu]::view-transition-old(vt-view){animation-name:vt-fade-out}
html[data-vt-style=fondu]::view-transition-new(vt-view){animation-name:vt-fade-in}
@keyframes vt-out-l{to{opacity:0;transform:translateX(-48px)}}@keyframes vt-in-r{from{opacity:0;transform:translateX(48px)}}
@keyframes vt-out-r{to{opacity:0;transform:translateX(48px)}}@keyframes vt-in-l{from{opacity:0;transform:translateX(-48px)}}
@keyframes vt-sink{to{opacity:0;transform:scale(.94);filter:blur(4px)}}@keyframes vt-rise{from{opacity:0;transform:translateY(24px)}}
@keyframes vt-unsink{from{opacity:0;transform:scale(.94);filter:blur(4px)}}@keyframes vt-fade-out{to{opacity:0}}@keyframes vt-fade-in{from{opacity:0}}
@media (prefers-reduced-motion:reduce){::view-transition-group(*),::view-transition-old(*),::view-transition-new(*){animation:none!important}}`;

function useGlobalCss() {
  useEffect(() => {
    if (document.getElementById('vt-css')) return;
    const s = document.createElement('style');
    s.id = 'vt-css';
    s.textContent = VT_CSS;
    document.head.appendChild(s);
  }, []);
}

/**
 * Renvoie navigate(update, { direction, shared }) : update() est exécuté de façon synchrone (flushSync)
 * pendant la capture. shared : fonction qui renvoie [élément, nom][] et qui est appelée avant ET après
 * la mise à jour, pour nommer les éléments partagés de l'ancienne puis de la nouvelle page.
 * @param {VTOptions} options
 */
export function useViewTransition({ style = 'glisse', duration = 420, ease = 'emphase' } = {}) {
  useGlobalCss();
  const busy = useRef(false);
  return useCallback((update, { direction = 'fwd', shared } = {}) => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || reduce || busy.current) { update(); return Promise.resolve(); }
    const html = document.documentElement;
    const name = (on) => (shared ? shared() : []).forEach(([el, n]) => { if (el) el.style.viewTransitionName = on ? n : ''; });
    html.style.setProperty('--vt-dur', `${Math.max(120, duration)}ms`);
    html.style.setProperty('--vt-ease', EASES[ease] || EASES.emphase);
    html.dataset.vtStyle = style;
    html.dataset.vtDir = direction;
    name(true);
    busy.current = true;
    const t = document.startViewTransition(() => { name(false); flushSync(update); name(true); });
    return t.finished.finally(() => { name(false); busy.current = false; delete html.dataset.vtStyle; delete html.dataset.vtDir; });
  }, [style, duration, ease]);
}

/* ------------------------------------------------------------------ */
/* Démo : boutique de mode « Ourlet », liste → fiche produit.          */
/* ------------------------------------------------------------------ */

const GARMENTS = {
  veste: '<path d="M70 54L44 72l-10 92 24 4 8-64z" style="fill:var(--ou-sh)"/><path d="M130 54l26 18 10 92-24 4-8-64z" style="fill:var(--ou-sh)"/><path d="M70 54l30-10 30 10 4 160H66z" style="fill:var(--ou-c)"/><path d="M88 48h24l-12 72z" style="fill:var(--ou-c2)" opacity=".35"/><path d="M88 48l-8 8 14 44 6 20zM112 48l8 8-14 44-6 20z" style="fill:var(--ou-sh)"/><path d="M100 120v94" style="stroke:var(--ou-sh)" stroke-width="2"/><circle cx="104" cy="140" r="3" style="fill:var(--ou-c2)"/><circle cx="104" cy="166" r="3" style="fill:var(--ou-c2)"/><rect x="72" y="152" width="20" height="24" rx="3" fill="none" style="stroke:var(--ou-sh)" stroke-width="2"/><rect x="108" y="152" width="20" height="24" rx="3" fill="none" style="stroke:var(--ou-sh)" stroke-width="2"/>',
  chemise: '<path d="M74 52L46 72l-8 84 22 4 8-56z" style="fill:var(--ou-sh)"/><path d="M126 52l28 20 8 84-22 4-8-56z" style="fill:var(--ou-sh)"/><path d="M74 52l26-8 26 8 6 162H68z" style="fill:var(--ou-c)"/><path d="M84 47l16 13-8 14-12-20zM116 47l-16 13 8 14 12-20z" style="fill:var(--ou-sh)"/><path d="M100 60v154" style="stroke:var(--ou-sh)" stroke-width="2"/><circle cx="100" cy="88" r="2.5" style="fill:var(--ou-c2)"/><circle cx="100" cy="114" r="2.5" style="fill:var(--ou-c2)"/><circle cx="100" cy="140" r="2.5" style="fill:var(--ou-c2)"/><circle cx="100" cy="166" r="2.5" style="fill:var(--ou-c2)"/><path d="M110 86h18v16a3 3 0 0 1-3 3h-12a3 3 0 0 1-3-3z" fill="none" style="stroke:var(--ou-sh)" stroke-width="2"/>',
  pantalon: '<path d="M68 44h64l8 170h-32l-8-116-8 116H60z" style="fill:var(--ou-c)"/><path d="M100 98l-8 116h-6l10-118zM100 98l8 116h6l-10-118z" style="fill:var(--ou-sh)"/><path d="M68 44h64v12H68z" style="fill:var(--ou-sh)"/><path d="M100 56v36" style="stroke:var(--ou-sh)" stroke-width="2"/><path d="M84 58v40M116 58v40" style="stroke:var(--ou-sh)" stroke-width="1.5"/><path d="M70 60q6 20 16 22M130 60q-6 20-16 22" fill="none" style="stroke:var(--ou-sh)" stroke-width="2"/>',
  pull: '<path d="M68 54L44 72l-10 94 24 4 8-64z" style="fill:var(--ou-sh)"/><path d="M132 54l24 18 10 94-24 4-8-64z" style="fill:var(--ou-sh)"/><path d="M68 54q32-14 64 0l2 150H66z" style="fill:var(--ou-c)"/><path d="M82 49q18 14 36 0" fill="none" style="stroke:var(--ou-sh)" stroke-width="7" stroke-linecap="round"/><path d="M66 196h68v10H66zM34 160l24 4-1 9-24-4zM166 160l-24 4 1 9 24-4z" style="fill:var(--ou-sh)"/>',
};

const PRODUCTS = [
  { id: 'veste', name: 'Veste Rivage', price: '189\u00a0€', color: 'Lin terre cuite', tag: 'Nouveau', bg: 'var(--accent-subtle)', c: 'var(--accent)', c2: 'var(--accent-fg)',
    desc: 'Veste de travail déstructurée en lin lavé, épaules tombantes et trois poches plaquées.', sizes: ['XS', 'S', 'M', 'L', 'XL'], out: ['XS'] },
  { id: 'chemise', name: 'Chemise Écume', price: '119\u00a0€', color: 'Gris ardoise', bg: 'var(--raised)', c: 'color-mix(in oklab, var(--text-strong) 82%, var(--bg))', c2: 'var(--bg)',
    desc: 'Chemise oversize au col cubain, en voile de lin très léger. Coutures anglaises et boutons en corozo.', sizes: ['XS', 'S', 'M', 'L', 'XL'], out: [] },
  { id: 'pantalon', name: 'Pantalon Grève', price: '139\u00a0€', color: 'Sable', bg: 'color-mix(in oklab, var(--accent-subtle) 55%, var(--raised))', c: 'var(--border-strong)', c2: 'var(--surface)',
    desc: 'Pantalon large à pinces, taille haute et ceinture élastiquée au dos. Longueur cheville.', sizes: ['34', '36', '38', '40', '42'], out: ['42'] },
  { id: 'pull', name: 'Pull Marée', price: '149\u00a0€', color: 'Encre', tag: 'Dernières pièces', bg: 'var(--tint-neutral-bg)', c: 'var(--accent-hover)', c2: 'var(--accent-fg)',
    desc: 'Pull col rond en maille de lin et coton, point mousse aux finitions.', sizes: ['XS', 'S', 'M', 'L', 'XL'], out: ['XS', 'XL'] },
];

function Garment({ p }) {
  return (
    <svg viewBox="0 0 200 250" preserveAspectRatio="xMidYMid meet" aria-hidden="true" className="absolute inset-0 h-full w-full transition-transform duration-[600ms] ease-[cubic-bezier(.2,0,0,1)] group-hover:-translate-y-[1.5%] group-hover:scale-[1.04] motion-reduce:transition-none"
      style={{ '--ou-c': p.c, '--ou-c2': p.c2, '--ou-sh': 'color-mix(in oklab, var(--ou-c) 74%, var(--ou-dark))' }}>
      <ellipse cx="100" cy="226" rx="62" ry="6" style={{ fill: 'var(--ou-dark)' }} opacity=".1" />
      <g transform="translate(0 4)" dangerouslySetInnerHTML={{ __html: GARMENTS[p.id] }} />
    </svg>
  );
}

/** @param {VTOptions & { shared?: boolean }} props */
export default function OurletShop({ style = 'glisse', duration = 420, ease = 'emphase', shared = true }) {
  const [page, setPage] = useState('list');
  const [size, setSize] = useState('M');
  const [cart, setCart] = useState(0);
  const [live, setLive] = useState('');
  const navigate = useViewTransition({ style, duration, ease });
  const cards = useRef({});
  const detailImg = useRef(null);
  const detailTitle = useRef(null);
  const lastId = useRef(null);
  const p = PRODUCTS.find((x) => x.id === page);

  // Paires [élément, nom] de la page affichée au moment de l'appel.
  const pairs = (id) => () => {
    if (!shared || !id) return [];
    const onList = !document.querySelector('[data-ou-detail]');
    const c = cards.current[id];
    return onList ? [[c?.querySelector('figure'), 'vt-img'], [c?.querySelector('p'), 'vt-title']] : [[detailImg.current, 'vt-img'], [detailTitle.current, 'vt-title']];
  };
  const open = (id, e) => {
    e?.preventDefault();
    lastId.current = id;
    navigate(() => setPage(id), { direction: 'fwd', shared: pairs(id) }).then(() => {
      detailTitle.current?.focus({ preventScroll: true });
      setLive(`${PRODUCTS.find((x) => x.id === id).name}, fiche produit`);
    });
  };
  const back = () => {
    if (page === 'list') return;
    navigate(() => setPage('list'), { direction: 'back', shared: pairs(page) }).then(() => {
      cards.current[lastId.current]?.focus({ preventScroll: true });
      setLive('Toute la collection');
    });
  };
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && back();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="mx-auto max-w-[1120px] font-[family-name:var(--font-sans)] text-[color:var(--text)] [--ou-dark:var(--text-strong)] dark:[--ou-dark:var(--bg)]">
      <header className="flex h-14 items-center gap-2 border-b border-[color:var(--border)] px-1 md:h-16 md:gap-6">
        <button type="button" onClick={back} className="mr-auto inline-flex min-h-11 items-center gap-2.5 rounded-lg text-[17px] font-semibold tracking-[-0.02em] text-[color:var(--text-strong)] md:mr-0">
          <svg viewBox="0 0 100 100" className="h-7 w-7" aria-hidden="true"><path d="M20 0H64L100 36V80A20 20 0 0 1 80 100H20A20 20 0 0 1 0 80V20A20 20 0 0 1 20 0Z" style={{ fill: 'var(--accent)' }} /><path d="M64 0L100 36H74A10 10 0 0 1 64 26Z" style={{ fill: 'var(--accent-fg)' }} opacity=".5" /><path d="M18 72H82" style={{ stroke: 'var(--accent-fg)' }} strokeWidth="6" strokeLinecap="round" strokeDasharray="6 8" fill="none" /></svg>
          Ourlet
        </button>
        <nav aria-label="Rayons" className="mr-auto hidden gap-1 md:flex">
          {['Été', 'Maille', 'Journal'].map((l, i) => (
            <a key={l} href="#" aria-current={i === 0 ? 'page' : undefined} className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-[color:var(--text-muted)] hover:bg-[var(--state-hover)] hover:text-[color:var(--text-strong)] aria-[current]:text-[color:var(--text-strong)]">{l}</a>
          ))}
        </nav>
        <button type="button" aria-label={`Panier, ${cart} article${cart > 1 ? 's' : ''}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[color:var(--border)] bg-[var(--surface)] px-3.5 text-sm font-medium text-[color:var(--text-strong)] hover:bg-[var(--raised)]">
          Panier <span key={cart} aria-hidden="true" className="inline-grid h-[22px] min-w-[22px] place-items-center rounded-full bg-[var(--accent)] px-1.5 font-[family-name:var(--font-mono)] text-xs font-semibold text-[color:var(--accent-fg)]">{cart}</span>
        </button>
      </header>

      <main className="px-0 pb-8 pt-6 md:px-1 md:pb-12 md:pt-10" style={{ viewTransitionName: 'vt-view' }}>
        {page === 'list' ? (
          <section aria-labelledby="ou-h">
            <div className="mb-5 md:mb-8 md:flex md:items-end md:justify-between md:gap-6">
              <div>
                <p className="mb-2 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.02em] text-[color:var(--text-muted)]">Collection été · 4 pièces</p>
                <h2 id="ou-h" className="text-[clamp(32px,4.2vw,52px)] font-semibold leading-[1.04] tracking-[-0.035em] text-[color:var(--text-strong)]">Le lin, coupé large.</h2>
              </div>
              <p className="mt-3 max-w-[34ch] text-[15px] leading-normal text-[color:var(--text-muted)] md:mt-0">Des pièces tissées en Normandie, lavées à la pierre et cousues dans notre atelier de Roubaix.</p>
            </div>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-4 md:gap-6">
              {PRODUCTS.map((x) => (
                <li key={x.id}>
                  <a href={`#${x.id}`} ref={(el) => { cards.current[x.id] = el; }} onClick={(e) => open(x.id, e)} className="group block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--focus-ring)]">
                    <figure className="relative m-0 aspect-[4/5] overflow-hidden rounded-xl md:rounded-2xl" style={{ background: x.bg }}>
                      {x.tag && <span className="absolute left-3 top-3 z-[1] rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[color:var(--text-strong)]">{x.tag}</span>}
                      <Garment p={x} />
                    </figure>
                    <div className="grid grid-cols-1 gap-0.5 pt-2.5 md:grid-cols-[1fr_auto] md:gap-x-3 md:pt-3.5">
                      <p className="w-fit text-sm font-medium tracking-[-0.01em] text-[color:var(--text-strong)] md:text-[15px]">{x.name}</p>
                      <span className="text-sm font-medium tabular-nums text-[color:var(--text-strong)] md:text-[15px]">{x.price}</span>
                      <span className="hidden text-sm text-[color:var(--text-muted)] md:col-span-2 md:block">{x.color}</span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section data-ou-detail aria-labelledby="ou-hd" className="grid grid-cols-1 items-start gap-5 md:grid-cols-[1.1fr_1fr] md:gap-12">
            <button type="button" onClick={back} className="col-span-full -my-2 -ml-3 inline-flex min-h-11 items-center gap-2 justify-self-start rounded-lg px-3 text-sm font-medium text-[color:var(--text-muted)] hover:bg-[var(--state-hover)] hover:text-[color:var(--text-strong)] md:-mb-6 md:-mt-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>Toute la collection
            </button>
            <figure ref={detailImg} className="relative m-0 aspect-square overflow-hidden rounded-xl md:aspect-[4/5] md:rounded-2xl" style={{ background: p.bg }}><Garment p={p} /></figure>
            <div>
              <h2 id="ou-hd" ref={detailTitle} tabIndex={-1} className="w-fit text-[clamp(28px,3.4vw,40px)] font-semibold leading-[1.08] tracking-[-0.03em] text-[color:var(--text-strong)] outline-none">{p.name}</h2>
              <p className="mt-3 text-lg font-medium tabular-nums text-[color:var(--text-strong)]">{p.price} · {p.color}</p>
              <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed">{p.desc}</p>
              <fieldset className="mt-7 border-0 p-0">
                <legend className="mb-2.5 text-sm font-medium text-[color:var(--text-strong)]">Taille</legend>
                <div className="grid grid-cols-5 gap-1.5 md:gap-2">
                  {p.sizes.map((s) => {
                    const off = p.out.includes(s);
                    return (
                      <label key={s} className="relative">
                        <input type="radio" name="ou-size" value={s} disabled={off} checked={size === s} onChange={() => setSize(s)} aria-label={`Taille ${s}${off ? ', épuisée' : ''}`} className="peer absolute inset-0 m-0 cursor-pointer opacity-0 disabled:cursor-not-allowed" />
                        <span aria-hidden="true" className="grid h-12 place-items-center rounded-lg border border-[color:var(--border)] bg-[var(--surface)] font-[family-name:var(--font-mono)] text-sm font-medium text-[color:var(--text-strong)] transition-colors peer-hover:border-[color:var(--border-strong)] peer-checked:border-[color:var(--text-strong)] peer-checked:shadow-[inset_0_0_0_1px_var(--text-strong)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--focus-ring)] peer-disabled:bg-[var(--raised)] peer-disabled:text-[color:var(--text-disabled)] peer-disabled:line-through">{s}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <button type="button" onClick={() => { setCart((n) => n + 1); setLive(`${p.name} ajouté au panier`); }} className="mt-4 h-[52px] w-full rounded-full bg-[var(--accent)] text-[15px] font-semibold text-[color:var(--accent-fg)] transition hover:bg-[var(--accent-hover)] active:scale-[.985]">Ajouter au panier</button>
            </div>
          </section>
        )}
      </main>
      <p aria-live="polite" className="sr-only">{live}</p>
    </div>
  );
}
