// CompteurRoulant.jsx — un nombre qui roule chiffre par chiffre (sens du changement respecté, unités en premier,
// tours supplémentaires sur les grands sauts, colonnes qui apparaissent ou se replient).
// React 18, Tailwind 3.4, tokens.css chargé. Sans bibliothèque d'animation. Exemple : fiche produit Ourlet (marque fictive).
// Utilisation :
//   <CompteurRoulant value={1284} format="entier" stiffness={210} damping={22} stagger={45} blur={true} />
//   <FicheProduit viewers={1284} viewersFormat="entier" stiffness={210} damping={22} stagger={45} blur={true} cap={99} live={true} />   (exemple complet)
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const NF = {
  entier: new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }),
  compact: new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }),
  monnaie: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }),
};
export const formatFr = (v, format = 'entier', cap = 99) => (format === 'badge' ? (v > cap ? `${NF.entier.format(cap)}+` : NF.entier.format(v)) : (NF[format] || NF.entier).format(v));
const STRIP = Array.from({ length: 30 }, (_, i) => i % 10);
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * @param {{ value: number, format?: 'entier'|'compact'|'monnaie'|'badge', cap?: number, stiffness?: number,
 *   damping?: number, stagger?: number, blur?: boolean, lineHeight?: number, className?: string }} props
 */
export function CompteurRoulant({ value, format = 'entier', cap = 99, stiffness = 210, damping = 22, stagger = 45, blur = true, lineHeight = 1.2, className = '' }) {
  const text = formatFr(value, format, cap);
  const chars = Array.from(text);
  const sim = useRef(new Map());          // clé (rang depuis la droite) → { p, v, t, at }
  const strips = useRef(new Map());
  const prev = useRef(null);
  const raf = useRef(0), last = useRef(0), visible = useRef(true), host = useRef(null);
  const cfg = useRef({}); cfg.current = { stiffness, damping, blur };
  const [entered, setEntered] = useState(() => new Set());

  const paint = () => sim.current.forEach((c, key) => {
    const el = strips.current.get(key); if (!el) return;
    const y = (((c.p % 10) + 10) % 10) + 10;
    el.style.transform = `translateY(${(-y * 100) / 30}%)`;
    el.style.filter = cfg.current.blur && Math.abs(c.v) > 2 ? `blur(${Math.min(1, Math.abs(c.v) * 0.025).toFixed(2)}px)` : '';
  });
  const step = (now) => {
    raf.current = 0;
    const dt = Math.min(0.05, (now - (last.current || now)) / 1000) || 0.016; last.current = now;
    const { stiffness: K, damping: C } = cfg.current, h = dt / 4;
    let busy = false;
    sim.current.forEach((c) => {
      if (now < c.at) { busy = true; return; }
      for (let i = 0; i < 4; i++) { c.v += (K * (c.t - c.p) - C * c.v) * h; c.p += c.v * h; }
      if (Math.abs(c.t - c.p) + Math.abs(c.v) > 0.002) busy = true; else { c.p = c.t; c.v = 0; }
    });
    paint();
    if (busy && visible.current) raf.current = requestAnimationFrame(step); else last.current = 0;
  };

  useLayoutEffect(() => {
    const p = prev.current, dir = p == null ? 0 : Math.sign(value - p), delta = p == null ? 0 : Math.abs(value - p);
    prev.current = value;
    const now = performance.now(), fresh = new Set();
    let rank = 0;
    chars.slice().reverse().forEach((ch, r) => {
      if (!/\d/.test(ch)) return;
      const d = +ch, key = r; let c = sim.current.get(key);
      if (!c) { c = { p: d, v: 0, t: d, at: 0 }; sim.current.set(key, c); if (p != null) fresh.add(key); }
      else {
        const cur = ((c.t % 10) + 10) % 10, extra = Math.min(2, Math.floor(delta / 10 ** (rank + 1))) * 10;
        const steps = dir > 0 ? ((d - cur + 10) % 10) + extra : dir < 0 ? -(((cur - d + 10) % 10) + extra) : d - cur;
        c.t += steps; c.at = now + rank * stagger;
      }
      if (p == null || reduced()) { c.p = c.t; c.v = 0; }
      rank++;
    });
    [...sim.current.keys()].forEach((k) => { if (k >= chars.length || !/\d/.test(chars[chars.length - 1 - k])) sim.current.delete(k); });
    if (fresh.size) { setEntered(fresh); requestAnimationFrame(() => requestAnimationFrame(() => setEntered(new Set()))); }
    paint();
    if (!raf.current) { last.current = 0; raf.current = requestAnimationFrame(step); }
  }, [text]);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; if (e.isIntersecting && !raf.current) raf.current = requestAnimationFrame(step); });
    if (host.current) io.observe(host.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf.current); };
  }, []);

  const lh = `${lineHeight}em`;
  const mask = 'linear-gradient(transparent, #000 18%, #000 82%, transparent)';
  return (
    <span ref={host} className={`inline-flex items-baseline whitespace-nowrap tabular-nums ${className}`} style={{ lineHeight: lh }}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-flex items-baseline">
        {chars.map((ch, i) => {
          const key = chars.length - 1 - i;
          if (!/\d/.test(ch)) return <span key={`s${key}${ch}`} className="inline-block" style={{ lineHeight: lh }}>{ch}</span>;
          const enter = entered.has(key);
          return (
            <span key={`d${key}`} className="relative inline-block overflow-hidden align-bottom transition-[width,opacity] duration-[360ms] ease-[cubic-bezier(.2,.9,.25,1)] motion-reduce:transition-none"
              style={{ width: enter ? 0 : '1ch', opacity: enter ? 0 : 1, height: lh, WebkitMaskImage: mask, maskImage: mask }}>
              <span ref={(n) => { if (n) strips.current.set(key, n); else strips.current.delete(key); }} className="block will-change-transform">
                {STRIP.map((n, j) => <span key={j} className="block text-center" style={{ height: lh, lineHeight: lh }}>{n}</span>)}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}

/* Pastille d'icône : le nombre roule, la pastille rebondit à chaque changement (sans remonter le compteur). */
function Pastille({ n, soft, bumpKey, cap, roll }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el || !bumpKey || reduced()) return;
    el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.22)', offset: 0.3 }, { transform: 'scale(1)' }], { duration: 520, easing: 'cubic-bezier(.34,1.8,.5,1)' });
  }, [bumpKey]);
  return (
    <span ref={ref} aria-hidden="true" className={`absolute left-6 top-[3px] inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold leading-none shadow-[0_0_0_2px_var(--surface)] ${soft ? 'bg-[var(--text-strong)] text-[var(--surface)]' : 'bg-[var(--accent)] text-[var(--accent-fg)]'}`}>
      <CompteurRoulant value={n} format="badge" cap={cap} lineHeight={1.25} {...roll} />
    </span>
  );
}

/* ——— Exemple : fiche produit ——— */
/** @param {{ viewers?: number, viewersFormat?: 'entier'|'compact', cap?: number, stiffness?: number, damping?: number, stagger?: number, blur?: boolean, live?: boolean }} props */
export default function FicheProduit({ viewers = 1284, viewersFormat = 'entier', cap = 99, stiffness = 210, damping = 22, stagger = 45, blur = true, live = true }) {
  const roll = { stiffness, damping, stagger, blur };
  const [qty, setQty] = useState(1);
  const [bag, setBag] = useState(2);
  const [fav, setFav] = useState(12);
  const [liked, setLiked] = useState(false);
  const [bump, setBump] = useState({ bag: 0, fav: 0 });
  const [watching, setWatching] = useState(viewers);
  const [msg, setMsg] = useState('');
  useEffect(() => setWatching(viewers), [viewers]);
  useEffect(() => { /* visiteurs en direct : marche aléatoire */
    if (!live) return undefined;
    const id = setInterval(() => { if (!document.hidden) setWatching((w) => Math.max(1, w + Math.round((Math.random() - 0.42) * 14))); }, 3000);
    return () => clearInterval(id);
  }, [live]);
  const add = () => { const n = bag + qty; setBag(n); setBump((b) => ({ ...b, bag: b.bag + 1 })); setMsg(`${qty} veste${qty > 1 ? 's' : ''} Garance ajoutée${qty > 1 ? 's' : ''} : ${n} articles dans le panier.`); };

  return (
    <div className="mx-auto w-full max-w-[1080px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] font-sans text-[var(--text)]">
      <style>{'@keyframes our-ping{80%,100%{transform:scale(2.6);opacity:0}}'}</style>
      <header className="flex h-14 items-center gap-6 border-b border-[var(--border)] pl-4 pr-2 md:h-16 md:pl-6 md:pr-4">
        <a href="#accueil" aria-label="Ourlet, accueil" className="inline-flex items-center gap-2.5 text-lg font-semibold tracking-[-0.01em] text-[var(--text-strong)] no-underline">
          <svg viewBox="0 0 100 100" className="h-7 w-7" aria-hidden="true"><circle cx="50" cy="50" r="50" fill="var(--accent)" /><path d="M24 40c8 6 17 9 26 9s18-3 26-9" fill="none" stroke="var(--accent-fg)" strokeWidth="7" strokeLinecap="round" /><path d="M22 62c9 7 18.5 10 28 10s19-3 28-10" fill="none" stroke="var(--accent-fg)" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 9" /></svg>
          Ourlet
        </a>
        <nav aria-label="Rayons" className="mr-auto hidden gap-1 md:flex">
          {['Nouveautés', 'Femme', 'Homme', 'L’atelier'].map((l, i) => <a key={l} href={`#r${i}`} aria-current={i === 0 ? 'page' : undefined} className={`inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium no-underline hover:bg-[var(--state-hover)] hover:text-[var(--text-strong)] ${i === 0 ? 'text-[var(--text-strong)]' : 'text-[var(--text-muted)]'}`}>{l}</a>)}
        </nav>
        <div className="ml-auto flex gap-1">
          <button type="button" aria-label={`Favoris, ${fav} articles`} aria-pressed={liked} onClick={() => { setLiked(!liked); setFav((f) => f + (liked ? -1 : 1)); setBump((b) => ({ ...b, fav: b.fav + 1 })); }}
            className="relative grid h-11 w-11 place-items-center rounded-full text-[var(--text-strong)] hover:bg-[var(--state-hover)]">
            <svg viewBox="0 0 24 24" className={`h-[22px] w-[22px] stroke-current ${liked ? 'fill-[var(--accent)] text-[var(--accent)]' : 'fill-none'}`} strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.2a4.4 4.4 0 0 1 7.5 2.7C19.5 15.4 12 20 12 20z" /></svg>
            <Pastille n={fav} soft bumpKey={bump.fav} cap={cap} roll={roll} />
          </button>
          <button type="button" aria-label={`Panier, ${bag} article${bag > 1 ? 's' : ''}`} className="relative grid h-11 w-11 place-items-center rounded-full text-[var(--text-strong)] hover:bg-[var(--state-hover)]">
            <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] fill-none stroke-current" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true"><path d="M5.5 8.5h13l-1 11.5h-11zM9 8.5V7a3 3 0 0 1 6 0v1.5" /></svg>
            <Pastille n={bag} bumpKey={bump.bag} cap={cap} roll={roll} />
          </button>
        </div>
      </header>
      <div className="grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <figure aria-hidden="true" className="relative m-0 grid min-h-[300px] place-items-center bg-[var(--accent-subtle)] md:min-h-[560px]">
          <svg viewBox="0 0 320 360" className="h-auto w-[min(48%,200px)] md:w-[min(62%,300px)]">
            <path d="M112 40L58 64Q46 70 42 84L20 262l40 8 28-150v216h144V120l28 150 40-8-22-178q-4-14-16-20l-54-24c-6 18-26 30-48 30s-42-12-48-30z" fill="color-mix(in srgb, var(--accent) 78%, var(--surface))" />
            <path d="M112 40l26 74M208 40l-26 74M160 70v266M112 40c6 18 26 30 48 30s42-12 48-30M104 236h36M180 236h36M30 238l36 6M290 238l-36 6" fill="none" stroke="color-mix(in srgb, var(--accent) 55%, var(--text-strong))" strokeWidth="2" strokeLinecap="round" opacity=".45" />
            {[130, 180, 230].map((y) => <circle key={y} cx="160" cy={y} r="4" fill="color-mix(in srgb, var(--accent) 40%, var(--text-strong))" opacity=".6" />)}
          </svg>
          <span className="absolute bottom-4 left-4 inline-flex h-9 items-center rounded-full border border-[var(--border)] bg-[var(--surface)] pl-2.5 pr-3 text-sm font-medium text-[var(--text)] md:h-8 md:text-[13px]">
            <span className="relative mr-2 h-2 w-2 rounded-full bg-[var(--up)]"><span className="absolute inset-0 rounded-full bg-[var(--up)] motion-safe:animate-[our-ping_2s_cubic-bezier(.2,.6,.35,1)_infinite]" /></span>
            <CompteurRoulant value={watching} format={viewersFormat} className="font-semibold text-[var(--text-strong)]" {...roll} />&nbsp;personnes regardent
          </span>
        </figure>
        <div className="grid content-start gap-3 px-5 pb-7 pt-6 md:gap-4 md:px-12 md:pb-10 md:pt-12">
          <p className="m-0 font-mono text-xs uppercase tracking-[0.04em] text-[var(--text-muted)]">Nouvelle collection · lin lavé</p>
          <h2 className="m-0 text-[clamp(1.75rem,1.4rem+1.4vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--text-strong)]">Veste Garance</h2>
          <p className="m-0 flex items-baseline gap-2 text-[clamp(1.625rem,1.5rem+.55vw,1.875rem)] font-semibold tracking-[-0.01em] text-[var(--text-strong)]">
            <CompteurRoulant value={129 * qty} format="monnaie" {...roll} /><span className="font-mono text-xs font-medium tracking-[0.04em] text-[var(--text-muted)]">TTC</span>
          </p>
          <p className="m-0 max-w-[44ch] text-base text-[var(--text-muted)]">Lin français lavé à la pierre, coupe droite, boutons en corozo. Fabriquée à Roubaix.</p>
          <div className="mt-2 flex gap-3">
            <div role="group" aria-label="Quantité" className="inline-flex h-12 items-center rounded-lg border border-[var(--border-control)]">
              <button type="button" aria-label="Retirer une veste" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-[46px] w-11 place-items-center rounded-lg text-[var(--text-strong)] hover:bg-[var(--state-hover)] disabled:cursor-not-allowed disabled:text-[var(--text-disabled)]"><svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="M6 12h12" /></svg></button>
              <span className="min-w-7 text-center text-base font-semibold text-[var(--text-strong)]"><CompteurRoulant value={qty} {...roll} /></span>
              <button type="button" aria-label="Ajouter une veste" disabled={qty >= 9} onClick={() => setQty((q) => Math.min(9, q + 1))} className="grid h-[46px] w-11 place-items-center rounded-lg text-[var(--text-strong)] hover:bg-[var(--state-hover)] disabled:cursor-not-allowed disabled:text-[var(--text-disabled)]"><svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="M12 6v12M6 12h12" /></svg></button>
            </div>
            <button type="button" onClick={add} className="h-12 flex-1 rounded-lg bg-[var(--accent)] text-base font-semibold text-[var(--accent-fg)] transition hover:bg-[var(--accent-hover)] active:scale-[.985]">Ajouter au panier</button>
          </div>
          <p aria-live="polite" className="sr-only">{msg}</p>
        </div>
      </div>
    </div>
  );
}
