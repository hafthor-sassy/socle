// Barre île dynamique — React + Tailwind CSS. Couleurs : variables de tokens.css. Contenu fictif (Grain, torréfacteur).
// Aucune dépendance en plus de React : la forme (largeur, hauteur, rayon) suit un ressort maison, comme dans l'onglet HTML.
// Ajoutez une fois dans votre CSS global les @keyframes « di-in » et « di-out » (voir la constante KEYFRAMES ci-dessous,
// injectée ici par une balise <style> pour que le composant marche tel quel). Tailwind : darkMode: 'class' (classe .dark de Socle).
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * @typedef {'idle'|'search'|'cart'|'delivery'|'alert'} IslandState
 * @typedef {[name: string, notes: string, price: string]} Product
 * @typedef {Object} DynamicIslandProps
 * @property {IslandState} [state]          État contrôlé (sinon interne, à partir de defaultState)
 * @property {IslandState} [defaultState]
 * @property {(s: IslandState) => void} [onStateChange]
 * @property {number}  [cartCount]          Nombre d'articles affiché sur le badge
 * @property {string}  [lastItem]           Article affiché dans l'état « cart »
 * @property {(p: Product) => void} [onPick] Choix d'un résultat de recherche
 * @property {() => void} [onOpenCart]
 * @property {() => void} [onRetry]
 * @property {'encre'|'surface'} [tone]
 * @property {'top'|'bottom'} [position]
 * @property {number}  [stiffness]
 * @property {number}  [damping]
 * @property {number}  [autoClose]          ms avant le retour au repos (0 = jamais)
 * @property {boolean} [blur]               Flou pendant le fondu des contenus
 * @property {Product[]} [catalogue]
 */

export const CATALOGUE = [
  ['Éthiopie Guji', 'Floral, pêche blanche · 250 g', '14,90 €'], ['Colombie Huila', 'Caramel, pomme · 250 g', '12,50 €'],
  ['Kenya Nyeri', 'Cassis, pamplemousse · 250 g', '16,20 €'], ['Brésil Cerrado', 'Noisette, cacao · 1 kg', '32,00 €'],
  ['Pérou décaféiné', 'Chocolat au lait · 250 g', '13,40 €'], ['Moulin manuel Ardoise', 'Meules coniques en acier', '89,00 €'],
  ['Guatemala Huehuetenango', 'Miel, amande · 250 g', '13,90 €'], ['Abonnement découverte', 'Un café différent chaque mois', '11,00 €/mois'],
];
const KEYFRAMES = '@keyframes di-in{from{opacity:0;scale:.94;filter:blur(var(--di-blur,6px))}}@keyframes di-out{to{opacity:0;scale:.96;filter:blur(var(--di-blur,4px))}}@keyframes di-ring{to{stroke-dashoffset:100}}';
const fold = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const radius = (h) => (h <= 64 ? h / 2 : Math.max(16, 32 - (h - 64) * 0.3));
const reduced = () => typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Ressort amorti intégré à pas fixe : garde sa vitesse si la cible change en route */
function useSpringBox(ref, stiffness, damping) {
  const s = useRef({ w: 216, h: 52, vw: 0, vh: 0, tw: 216, th: 52, raf: 0, last: 0 });
  const paint = () => { const el = ref.current, b = s.current; if (!el) return; el.style.width = `${b.w}px`; el.style.height = `${b.h}px`; el.style.borderRadius = `${radius(b.h)}px`; };
  const loop = useCallback((now) => {
    const b = s.current; b.raf = 0;
    const dt = Math.min(0.05, (now - (b.last || now)) / 1000) || 1 / 60; b.last = now;
    for (let t = 0, h = 1 / 240; t < dt; t += h) {
      b.vw += (-stiffness * (b.w - b.tw) - damping * b.vw) * h; b.w += b.vw * h;
      b.vh += (-stiffness * (b.h - b.th) - damping * b.vh) * h; b.h += b.vh * h;
    }
    const done = Math.abs(b.w - b.tw) + Math.abs(b.h - b.th) < 0.3 && Math.abs(b.vw) + Math.abs(b.vh) < 0.3;
    if (done) { b.w = b.tw; b.h = b.th; b.vw = b.vh = 0; b.last = 0; } else b.raf = requestAnimationFrame(loop);
    paint();
  }, [stiffness, damping]); // eslint-disable-line react-hooks/exhaustive-deps
  const go = useCallback((w, h, { kick = 0, instant = false } = {}) => {
    const b = s.current; b.tw = w; b.th = h; b.vw += kick;
    if (instant || reduced()) { b.w = w; b.h = h; b.vw = b.vh = 0; paint(); return; }
    if (!b.raf) b.raf = requestAnimationFrame(loop);
  }, [loop]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => cancelAnimationFrame(s.current.raf), []);
  return go;
}

const Bean = ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="50" rx="24" ry="34" transform="rotate(32 50 50)" fill="currentColor" /></svg>;
const iconBtn = 'relative inline-grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-[var(--di-hover)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]';
const cta = 'h-11 shrink-0 rounded-full px-4 text-sm font-semibold transition active:scale-[.96] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]';

export default function DynamicIsland({
  state: controlled, defaultState = 'idle', onStateChange, cartCount = 2, lastItem = 'Éthiopie Guji · 250 g',
  onPick, onOpenCart, onRetry, tone = 'encre', position = 'top', stiffness = 340, damping = 26, autoClose = 4000, blur = true,
  catalogue = CATALOGUE,
}) {
  const [inner, setInner] = useState(defaultState);
  const state = controlled ?? inner;
  const setState = useCallback((s) => { if (controlled === undefined) setInner(s); onStateChange?.(s); }, [controlled, onStateChange]);
  const [views, setViews] = useState([{ key: 0, state }]);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [hold, setHold] = useState(false);
  const shapeRef = useRef(null), viewRef = useRef(null), inputRef = useRef(null), seq = useRef(0), prev = useRef(state), first = useRef(true);
  const go = useSpringBox(shapeRef, stiffness, damping);
  const results = query.trim() ? catalogue.filter((r) => fold(`${r[0]} ${r[1]}`).includes(fold(query.trim()))).slice(0, 5) : catalogue.slice(0, 4);

  // Nouvel état : l'ancienne vue sort (flou), la nouvelle entre ; la forme va à la taille mesurée
  useEffect(() => {
    if (state === prev.current) return;
    prev.current = state; seq.current += 1;
    const key = seq.current;
    setViews((v) => [...v.map((x) => ({ ...x, out: true })), { key, state }]);
    const t = setTimeout(() => setViews((v) => v.filter((x) => x.key === key)), reduced() ? 0 : 170);
    if (state === 'search') { setQuery(''); setActive(0); setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 60); }
    return () => clearTimeout(t);
  }, [state]);
  useLayoutEffect(() => {
    const el = viewRef.current; if (!el) return;
    go(el.offsetWidth, el.offsetHeight, { instant: first.current }); first.current = false;
  });
  useEffect(() => { const ro = new ResizeObserver(() => viewRef.current && go(viewRef.current.offsetWidth, viewRef.current.offsetHeight)); ro.observe(document.documentElement); return () => ro.disconnect(); }, [go]);

  // Retour au repos automatique, en pause au survol ou au focus
  useEffect(() => {
    if (!autoClose || hold || !['cart', 'delivery'].includes(state)) return undefined;
    const t = setTimeout(() => setState('idle'), state === 'delivery' ? autoClose + 2000 : autoClose);
    return () => clearTimeout(t);
  }, [state, hold, autoClose, setState]);

  // Échap ferme, « / » et ⌘K ouvrent la recherche ; clic hors de l'île ferme la recherche
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && state !== 'idle') { e.preventDefault(); setState('idle'); return; }
      const a = document.activeElement, typing = a && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable);
      if (!typing && (e.key === '/' || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)))) { e.preventDefault(); setState('search'); }
    };
    const onDown = (e) => { if (state === 'search' && !shapeRef.current?.contains(e.target)) setState('idle'); };
    document.addEventListener('keydown', onKey); document.addEventListener('pointerdown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown); };
  }, [state, setState]);

  const pick = (r) => { if (!r) return; onPick?.(r); setState('cart'); };
  const onSearchKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % Math.max(1, results.length)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i - 1 + results.length) % Math.max(1, results.length)); }
    else if (e.key === 'Enter') { e.preventDefault(); pick(results[active]); }
  };

  const vars = tone === 'surface'
    ? { '--di-bg': 'var(--surface)', '--di-fg': 'var(--text-strong)', '--di-muted': 'var(--text-muted)', '--di-line': 'var(--border)', '--di-hover': 'var(--state-hover)' }
    : { '--di-bg': 'var(--text-strong)', '--di-fg': 'var(--surface)', '--di-muted': 'color-mix(in srgb, var(--surface) 68%, transparent)', '--di-line': 'color-mix(in srgb, var(--surface) 16%, transparent)', '--di-hover': 'color-mix(in srgb, var(--surface) 12%, transparent)' };
  // En sombre, l'encre devient une surface élevée (classe « dark » sur <html>)
  const darkEncre = tone === 'encre' ? 'dark:[--di-bg:var(--raised)] dark:[--di-fg:var(--text-strong)] dark:[--di-muted:var(--text-muted)] dark:[--di-line:var(--border)] dark:[--di-hover:var(--state-hover)]' : '';

  function content(s) {
    if (s === 'idle') return (
      <div className="flex h-[52px] items-center gap-1 whitespace-nowrap pl-3 pr-1">
        <a href="#" aria-label="Grain, accueil" className="inline-flex h-11 items-center gap-2 rounded-full pr-2 text-base font-semibold tracking-[-0.02em]">
          <svg width="28" height="28" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="28" fill="var(--accent)" /><ellipse cx="50" cy="50" rx="22" ry="31" transform="rotate(32 50 50)" fill="var(--accent-fg)" /><path d="M62 28c-10 6-18 14-14 24s0 18-12 22" fill="none" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round" /></svg>
          Grain
        </a>
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-[var(--di-line)]" />
        <button type="button" onClick={() => setState('search')} aria-label="Rechercher (raccourci /)" aria-keyshortcuts="/" className={iconBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></svg>
        </button>
        <button type="button" onClick={() => { go(shapeRef.current.offsetWidth, shapeRef.current.offsetHeight, { kick: 160 }); onOpenCart?.(); }} aria-label={`Panier, ${cartCount} article${cartCount > 1 ? 's' : ''}`} className={iconBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>
          <span key={cartCount} className="absolute right-1 top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[var(--accent)] px-[5px] text-[11px] font-bold tabular-nums text-[var(--accent-fg)] shadow-[0_0_0_2px_var(--di-bg)]">{cartCount}</span>
        </button>
      </div>
    );
    if (s === 'search') return (
      <div className="w-[min(560px,calc(100vw-32px))] px-1.5 pb-2 pt-1.5">
        <div className="relative flex h-12 items-center gap-2.5 pl-3 pr-1.5 text-[var(--di-muted)] after:absolute after:inset-x-3 after:-bottom-0.5 after:h-px after:bg-[var(--di-line)] focus-within:after:h-0.5 focus-within:after:bg-[var(--focus-ring)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></svg>
          <input ref={inputRef} value={query} onChange={(e) => { setQuery(e.target.value); setActive(0); }} onKeyDown={onSearchKey}
            role="combobox" aria-expanded="true" aria-controls="di-results" aria-autocomplete="list" aria-label="Rechercher un café"
            aria-activedescendant={results.length ? `di-o-${active}` : undefined} placeholder="Un café, une origine, un moulin…" autoComplete="off" enterKeyHint="go"
            className="h-11 min-w-0 flex-1 bg-transparent text-base text-[var(--di-fg)] outline-none placeholder:text-[var(--di-muted)]" />
          <button type="button" onClick={() => setState('idle')} aria-label="Fermer la recherche" className="grid h-11 w-11 place-items-center rounded-full hover:bg-[var(--di-hover)] [@media(hover:hover)]:h-8 [@media(hover:hover)]:w-auto [@media(hover:hover)]:rounded-lg [@media(hover:hover)]:border [@media(hover:hover)]:border-[var(--di-line)] [@media(hover:hover)]:px-2.5">
            <span className="hidden font-mono text-xs [@media(hover:hover)]:inline">Échap</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true" className="[@media(hover:hover)]:hidden"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <p className="mx-3 mb-1 mt-2.5 font-mono text-[11px] uppercase tracking-[0.04em] text-[var(--di-muted)]">{!query.trim() ? 'Populaires cette semaine' : results.length ? `${results.length} résultat${results.length > 1 ? 's' : ''}` : 'Aucun résultat'}</p>
        <ul id="di-results" role="listbox" aria-label="Résultats" className="grid gap-0.5">
          {results.length ? results.map((r, i) => (
            <li key={r[0]} id={`di-o-${i}`} role="option" aria-selected={i === active} onPointerMove={() => setActive(i)} onClick={() => pick(r)}
              className="grid min-h-[52px] cursor-pointer grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl py-1.5 pl-2 pr-3 aria-selected:bg-[var(--di-hover)]">
              <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)]"><Bean /></span>
              <span className="min-w-0"><b className="block truncate text-[15px] font-medium">{r[0]}</b><small className="text-[13px] text-[var(--di-muted)]">{r[1]}</small></span>
              <span className="text-sm tabular-nums text-[var(--di-muted)]">{r[2]}</span>
            </li>
          )) : (
            <li role="presentation" className="px-3 pb-3 pt-4 text-sm text-[var(--di-muted)]"><b className="block font-semibold text-[var(--di-fg)]">Aucun café pour « {query.trim()} »</b>Essayez une origine (Kenya, Pérou) ou un arôme (cacao, floral).</li>
          )}
        </ul>
      </div>
    );
    const note = (icon, title, sub, end) => (
      <div className="flex h-16 items-center gap-2.5 whitespace-nowrap px-2.5 sm:gap-3">
        {icon}
        <span className="grid min-w-0 gap-0.5 pr-1"><b className="text-sm font-semibold tracking-[-0.01em] sm:text-[15px]">{title}</b><span className="truncate text-[13px] text-[var(--di-muted)] sm:text-sm">{sub}</span></span>
        {end}
      </div>
    );
    if (s === 'cart') return note(
      <span aria-hidden="true" className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)]"><Bean size={22} /><span className="absolute -bottom-[3px] -right-[3px] grid h-[18px] w-[18px] place-items-center rounded-full bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)] shadow-[0_0_0_2px_var(--di-bg)]"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span></span>,
      'Ajouté au panier', lastItem,
      <>
        <button type="button" onClick={() => { setState('idle'); onOpenCart?.(); }} className={`${cta} bg-[var(--accent)] text-[var(--accent-fg)]`}>Voir&nbsp;{cartCount}</button>
        {autoClose > 0 && <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" className="mr-1 shrink-0 -rotate-90"><circle cx="12" cy="12" r="10" fill="none" strokeWidth="2.5" stroke="var(--di-line)" /><circle cx="12" cy="12" r="10" fill="none" strokeWidth="2.5" stroke="var(--di-fg)" strokeLinecap="round" pathLength="100" strokeDasharray="100" style={{ animation: reduced() ? 'none' : `di-ring ${autoClose}ms linear forwards`, animationPlayState: hold ? 'paused' : 'running' }} /></svg>}
      </>,
    );
    if (s === 'delivery') return note(
      <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="17" r="3" /><circle cx="18" cy="17" r="3" /><path d="M6 17l3.5-8H14l4 8M9.5 9H8M14 9l-1.5-3H15" /></svg></span>,
      'Commande en route', 'Arrivée entre 14 h 20 et 14 h 40',
      <span aria-hidden="true" className="grid w-14 justify-items-end gap-1.5 pr-2 sm:w-[72px]"><span className="h-1 w-full overflow-hidden rounded-full bg-[var(--di-line)]"><span className="block h-full w-[62%] rounded-full bg-[var(--tint-green-fg)]" /></span><span className="font-mono text-xs text-[var(--di-muted)]">12 min</span></span>,
    );
    return note(
      <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--tint-red-bg)] text-[var(--tint-red-fg)]"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M12 7.5v6M12 16.5h.01" /><circle cx="12" cy="12" r="9" /></svg></span>,
      'Paiement refusé', 'Carte expirée en 10/26',
      <button type="button" onClick={() => { onRetry?.(); setState('delivery'); }} className={`${cta} bg-[var(--di-hover)] text-[var(--di-fg)]`}>Réessayer</button>,
    );
  }

  const announce = { cart: `Ajouté au panier : ${lastItem}. ${cartCount} articles.`, delivery: 'Commande en route, arrivée entre 14 h 20 et 14 h 40.' }[state] || '';
  return (
    <div style={{ ...vars, ...(blur ? {} : { '--di-blur': '0px' }) }}
      className={`pointer-events-none fixed inset-x-0 z-50 flex justify-center font-sans ${position === 'bottom' ? 'bottom-2 items-end sm:bottom-4' : 'top-2 sm:top-4'} ${darkEncre}`}>
      <style>{KEYFRAMES}</style>
      <div aria-hidden="true" className={`fixed inset-0 bg-[var(--scrim)] transition-opacity duration-300 ${state === 'search' ? 'opacity-100' : 'opacity-0'}`} />
      <div ref={shapeRef}
        onPointerEnter={() => setHold(true)} onPointerLeave={() => setHold(false)} onFocus={() => setHold(true)} onBlur={() => setHold(false)}
        className="pointer-events-auto relative h-[52px] w-[216px] overflow-hidden rounded-[26px] bg-[var(--di-bg)] text-[var(--di-fg)] shadow-[var(--shadow-popover)] [contain:layout_paint] dark:shadow-[var(--shadow-popover),inset_0_0_0_1px_var(--di-line)]">
        {views.map((v) => (
          <div key={v.key} ref={v.out ? undefined : viewRef} inert={v.out ? '' : undefined} aria-hidden={v.out || undefined}
            style={{ animation: reduced() ? undefined : v.out ? 'di-out 160ms cubic-bezier(.4,0,1,1) both' : v.key ? 'di-in 300ms cubic-bezier(.2,0,0,1) 50ms both' : undefined }}
            className="absolute left-1/2 top-0 w-max max-w-[min(560px,calc(100vw-32px))] origin-top -translate-x-1/2">
            {content(v.state)}
          </div>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">{announce}</p>
      <p className="sr-only" role="alert">{state === 'alert' ? 'Paiement refusé : carte expirée.' : ''}</p>
    </div>
  );
}
