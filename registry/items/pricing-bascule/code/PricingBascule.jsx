// PricingBascule.jsx — trois offres d'abonnement avec bascule Mensuel / Annuel et prix à chiffres roulants.
// React 18 + Tailwind 3.4, tokens.css chargé (couleurs uniquement par variables). Sans bibliothèque d'animation :
// chaque chiffre est une colonne 0–9 déplacée par transition CSS (unités d'abord), les colonnes en trop se replient.
// Marque fictive : Volute. Utilisation :
//   <PricingBascule defaultPeriod="mensuel" discount={20} currency="EUR" featured={1} duration={700} stagger={60} />
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export const PLANS = [
  { name: 'Starter', monthly: 9, desc: 'Pour lancer un premier projet seul ou à deux.', cta: 'Commencer l’essai',
    features: ['3 projets actifs', '5 Go de stockage', 'Historique des versions sur 30 jours', 'Assistance par e-mail'] },
  { name: 'Pro', monthly: 24, desc: 'Pour les équipes qui livrent chaque semaine.', cta: 'Essayer Pro 14 jours', tag: 'Le plus choisi',
    features: ['Projets illimités', '100 Go de stockage', 'Historique sur 1 an', 'Intégrations et API', 'Assistance prioritaire'] },
  { name: 'Équipe', monthly: 49, desc: 'Pour les organisations qui gèrent des accès.', cta: 'Parler à un conseiller',
    features: ['Tout Pro, et :', 'Espaces d’équipe et rôles', 'SSO et journal d’audit', '1 To de stockage', 'Interlocuteur dédié'] },
];
const SPRING = 'cubic-bezier(.34,1.36,.64,1)';
const SYM = { EUR: '€', USD: '$', CHF: 'CHF' };
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const money = (v, currency) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v).replace(/\u202F/g, '\u00A0');
const focusRing = 'focus-visible:outline focus-visible:outline-[length:var(--focus-width)] focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-[var(--focus-offset)]';

/** Nombre roulant : une colonne par chiffre, clé = rang depuis la droite. */
export function RollingNumber({ value, currency = 'EUR', duration = 700, stagger = 60, className = '' }) {
  const digits = String(value).split('');
  const [width, setWidth] = useState(Math.max(1, digits.length));   // colonnes montées (on garde les sortantes le temps du repli)
  const [cw, setCw] = useState(0.6);
  const [instant, setInstant] = useState(true);
  const probe = useRef(null);
  useLayoutEffect(() => {
    const m = () => { const el = probe.current; if (!el) return; const fs = parseFloat(getComputedStyle(el).fontSize) || 56; const w = el.getBoundingClientRect().width / 10; if (w) setCw(+(w / fs).toFixed(3)); };
    m(); document.fonts?.ready.then(m);
    const id = requestAnimationFrame(() => setInstant(false)); return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => { if (digits.length > width) setWidth(digits.length); else if (digits.length < width) { const t = setTimeout(() => setWidth(digits.length), duration); return () => clearTimeout(t); } }, [digits.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const cols = Math.max(width, digits.length), after = currency !== 'USD', sym = <span className={`mt-[.14em] inline-block text-[.5em] leading-none tracking-normal ${after ? 'ml-[.1em]' : 'mr-[.06em]'}`}>{SYM[currency] || currency}</span>;
  const still = instant || reduced();
  return (
    <span aria-hidden="true" className={`relative inline-flex h-[1em] items-start font-semibold leading-none tracking-[-0.04em] tabular-nums text-[var(--text-strong)] ${className}`}>
      <span ref={probe} className="invisible absolute whitespace-nowrap">0123456789</span>
      {!after && sym}
      <span className="inline-flex">
        {Array.from({ length: cols }, (_, i) => {
          const rank = cols - 1 - i, di = digits.length - 1 - rank, on = di >= 0, d = on ? +digits[di] : 0;
          return (
            <span key={rank} className="inline-block h-[1em] overflow-hidden"
              style={{ width: on ? `${cw}em` : 0, opacity: on ? 1 : 0, transition: still ? 'none' : `width ${duration}ms ${SPRING}, opacity ${duration * 0.6}ms cubic-bezier(.2,0,0,1)` }}>
              <span className="flex flex-col will-change-transform"
                style={{ transform: `translateY(${-d * 10}%)`, transition: still ? 'none' : `transform ${duration}ms ${SPRING} ${rank * stagger}ms` }}>
                {'0123456789'.split('').map((c) => <span key={c} className="block h-[1em] text-center leading-none">{c}</span>)}
              </span>
            </span>
          );
        })}
      </span>
      {after && sym}
    </span>
  );
}

/**
 * @param {{ defaultPeriod?: 'mensuel'|'annuel', period?: 'mensuel'|'annuel', onPeriodChange?: (p: string) => void,
 *   discount?: number, currency?: 'EUR'|'USD'|'CHF', featured?: number, duration?: number, stagger?: number,
 *   plans?: typeof PLANS, className?: string }} props
 */
export function PricingBascule({ defaultPeriod = 'mensuel', period: controlled, onPeriodChange, discount = 20, currency = 'EUR', featured = 1, duration = 700, stagger = 60, plans = PLANS, className = '' }) {
  const [own, setOwn] = useState(defaultPeriod);
  const period = controlled || own;
  const [live, setLive] = useState('');
  const [tab, setTab] = useState(Math.max(0, featured));
  const sw = useRef(null), grid = useRef(null), cards = useRef([]), first = useRef(true);
  useEffect(() => { if (!controlled) setOwn(defaultPeriod); }, [defaultPeriod]); // eslint-disable-line react-hooks/exhaustive-deps
  const price = (m, p = period) => (p === 'annuel' ? Math.round(m * (1 - Math.max(0, Math.min(90, discount)) / 100)) : m);
  const setPeriod = (p) => {
    if (p === period) return;
    if (!controlled) setOwn(p); onPeriodChange?.(p);
    setLive(''); setTimeout(() => setLive(`Tarifs ${p === 'annuel' ? 'annuels' : 'mensuels'} : ${plans.map((x) => `${x.name} ${money(price(x.monthly, p), currency)}`).join(', ')} par utilisateur et par mois.`), 40);
  };
  const onKey = (e) => {
    const k = e.key; if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(k)) return;
    e.preventDefault(); const p = ['ArrowLeft', 'ArrowUp', 'Home'].includes(k) ? 'mensuel' : 'annuel'; setPeriod(p); sw.current?.querySelector(`[data-value="${p}"]`)?.focus();
  };
  /* Carrousel mobile : onglets synchronisés */
  const goTo = (i, smooth = true) => { const g = grid.current, c = cards.current[i]; if (!g || !c) return; g.scrollTo({ left: c.offsetLeft - (g.clientWidth - c.offsetWidth) / 2, behavior: smooth && !reduced() ? 'smooth' : 'auto' }); setTab(i); };
  useEffect(() => { if (first.current && window.matchMedia('(max-width: 767px)').matches) requestAnimationFrame(() => goTo(Math.max(0, featured), false)); first.current = false; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const raf = useRef(0);
  const onScroll = () => { cancelAnimationFrame(raf.current); raf.current = requestAnimationFrame(() => { const g = grid.current, mid = g.scrollLeft + g.clientWidth / 2; let best = 0, bd = 1e9; cards.current.forEach((c, i) => { const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } }); setTab(best); }); };

  const annual = period === 'annuel';
  return (
    <section aria-labelledby="pb-title" className={`mx-auto w-full max-w-[1120px] py-12 font-[family-name:var(--font-sans)] text-[var(--text)] md:px-10 md:py-[72px] ${className}`}>
      <style>{`@keyframes pb-pop{from{opacity:0;transform:scale(.6) translateY(4px)}to{opacity:1;transform:none}}@keyframes pb-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){.pb-anim{animation:none!important}}`}</style>
      <header className="grid justify-items-center px-5 text-center md:px-0">
        <span className="mb-5 inline-flex items-center gap-2 text-[var(--text-strong)] md:mb-6">
          <svg viewBox="0 0 100 100" aria-hidden="true" className="h-7 w-7"><rect width="100" height="100" rx="28" fill="var(--accent)" /><path d="M53 50a6 6 0 0 1-12 0a12 12 0 0 1 24 0a18 18 0 0 1-36 0a24 24 0 0 1 48 0" fill="none" stroke="var(--accent-fg)" strokeWidth="7" strokeLinecap="round" /></svg>
          <span className="text-lg font-semibold tracking-[-0.03em]">volute</span>
        </span>
        <h2 id="pb-title" className="max-w-[18ch] text-balance text-[clamp(2rem,1.5rem+1.6vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-[var(--text-strong)]">Un tarif simple, qui grandit avec vous</h2>
        <p className="mt-4 max-w-[54ch] text-pretty text-base leading-[1.55] text-[var(--text-muted)] md:text-[17px]">Tous les abonnements incluent les mises à jour, la sauvegarde quotidienne et l’export de vos données. Changez d’offre quand vous voulez.</p>
        <div ref={sw} role="radiogroup" aria-label="Période de facturation" onKeyDown={onKey}
          className="relative mt-6 grid w-full max-w-[360px] grid-cols-2 rounded-full border border-[var(--border)] bg-[var(--raised)] p-1 md:mt-8 md:inline-grid md:w-auto md:max-w-none">
          <span aria-hidden="true" className="absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-full bg-[var(--surface)] shadow-[0_0_0_1px_var(--border),var(--shadow-overlay)] motion-reduce:transition-none"
            style={{ transform: annual ? 'translateX(100%)' : 'none', transition: `transform 520ms ${SPRING}` }} />
          {['mensuel', 'annuel'].map((p) => (
            <button key={p} type="button" role="radio" data-value={p} aria-checked={period === p} tabIndex={period === p ? 0 : -1} onClick={() => setPeriod(p)}
              className={`relative z-[1] inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full px-3 text-[15px] font-medium transition-colors md:min-h-10 md:px-5 ${focusRing} ${period === p ? 'text-[var(--text-strong)]' : 'text-[var(--text-muted)]'}`}>
              {p === 'mensuel' ? 'Mensuel' : 'Annuel'}
              {p === 'annuel' && discount > 0 && (
                <span className={`inline-flex h-[22px] items-center rounded-full border px-2 text-xs font-semibold tabular-nums ${annual ? 'scale-[1.06] border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]' : 'border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)] text-[var(--text-strong)]'}`}
                  style={{ transition: `transform 460ms ${SPRING}, background-color 180ms` }}>−{discount} %</span>
              )}
            </button>
          ))}
        </div>
      </header>

      <div role="tablist" aria-label="Offres" className="mx-5 mt-7 flex justify-center gap-1 md:hidden"
        onKeyDown={(e) => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return; e.preventDefault(); const n = (tab + d + plans.length) % plans.length; goTo(n); e.currentTarget.children[n].focus(); }}>
        {plans.map((p, i) => (
          <button key={p.name} type="button" role="tab" aria-selected={tab === i} tabIndex={tab === i ? 0 : -1} onClick={() => goTo(i)}
            className={`min-h-11 rounded-full px-4 text-[15px] font-medium transition-colors ${focusRing} ${tab === i ? 'bg-[var(--raised)] text-[var(--text-strong)] shadow-[inset_0_0_0_1px_var(--border)]' : 'text-[var(--text-muted)]'}`}>{p.name}</button>
        ))}
      </div>

      <ul ref={grid} role="list" onScroll={onScroll}
        className="mt-4 flex snap-x snap-mandatory list-none gap-3 overflow-x-auto overscroll-x-contain px-5 pb-2 pt-1 [scroll-padding:0_20px] [scrollbar-width:none] md:mt-12 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:p-0 [&::-webkit-scrollbar]:hidden">
        {plans.map((p, i) => {
          const isF = i === featured, v = price(p.monthly), gain = (p.monthly - v) * 12;
          return (
            <li key={p.name} ref={(el) => { cards.current[i] = el; }}
              className={`relative flex flex-[0_0_calc(100%-48px)] snap-center flex-col rounded-2xl border border-[var(--border)] px-5 pb-5 pt-6 md:flex-auto md:px-6 md:pb-6 md:pt-7 ${isF ? 'bg-[var(--raised)]' : 'bg-[var(--surface)]'}`}>
              {isF && <span aria-hidden="true" className="absolute inset-x-6 top-0 h-0.5 rounded-b-sm bg-[var(--accent)]" />}
              <h3 className="flex items-center gap-2 text-lg font-semibold tracking-[-0.015em] text-[var(--text-strong)]">
                {p.name}
                {isF && p.tag && <span className="inline-flex h-6 items-center rounded-full border border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)] px-2.5 text-xs font-semibold tracking-normal">{p.tag}</span>}
              </h3>
              <p className="mt-2 text-[15px] leading-[1.45] text-[var(--text-muted)] md:min-h-[2.9em]">{p.desc}</p>
              <div className="mt-6 flex items-end gap-2.5">
                <RollingNumber value={v} currency={currency} duration={duration} stagger={stagger} className="text-[52px] md:text-[56px]" />
                <span aria-hidden="true" className="grid pb-1.5 text-sm leading-[1.3] text-[var(--text-muted)]"><span className="font-medium text-[var(--text)]">/ mois</span><span>par utilisateur</span></span>
                <span className="sr-only">{money(v, currency)} par utilisateur et par mois{annual ? `, facturé ${money(v * 12, currency)} par an` : ''}</span>
              </div>
              <div key={period + discount + currency} className="mt-2.5 flex min-h-[54px] flex-col items-start gap-1.5 text-sm tabular-nums text-[var(--text-muted)]">
                {annual ? (
                  <>
                    <span className="pb-anim" style={{ animation: 'pb-fade 360ms cubic-bezier(.2,0,0,1) both' }}><s aria-hidden="true" className="decoration-[1.5px]">{money(p.monthly, currency)}</s> soit {money(v * 12, currency)} par an</span>
                    {gain > 0 && <span className="pb-anim inline-flex h-6 items-center rounded-full border border-[var(--tint-green-border)] bg-[var(--tint-green-bg)] px-2 text-[12.5px] font-semibold text-[var(--tint-green-fg)]" style={{ animation: `pb-pop 520ms ${SPRING} ${duration * 0.45}ms both` }}>{money(gain, currency)} d’économie</span>}
                  </>
                ) : (
                  <>
                    <span className="pb-anim" style={{ animation: 'pb-fade 360ms cubic-bezier(.2,0,0,1) both' }}>Facturé chaque mois, sans engagement</span>
                    {discount > 0 && <button type="button" onClick={() => { setPeriod('annuel'); sw.current?.querySelector('[data-value="annuel"]')?.focus({ preventScroll: true }); }}
                      className="pb-anim min-h-6 rounded text-sm font-medium text-[var(--text-strong)] underline decoration-[var(--border-control)] underline-offset-[3px] hover:decoration-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                      style={{ animation: 'pb-fade 360ms cubic-bezier(.2,0,0,1) 80ms both' }}>Économisez {discount} % en annuel</button>}
                  </>
                )}
              </div>
              <a href="#" className={`mt-5 flex min-h-11 items-center justify-center rounded-full border text-[15px] font-medium no-underline transition-[background,transform] duration-300 active:scale-[.98] ${focusRing} ${isF ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]' : 'border-[var(--border-control)] bg-[var(--surface)] text-[var(--text-strong)] hover:bg-[var(--raised)]'}`}>{p.cta}</a>
              <ul role="list" className="mt-6 grid list-none gap-3 border-t border-[var(--border)] p-0 pt-5">
                {p.features.map((f) => (
                  <li key={f} className="relative pl-7 text-[15px] leading-[1.4]">
                    <span aria-hidden="true" className={`absolute left-0 top-px grid h-[18px] w-[18px] place-items-center rounded-full border ${isF ? 'border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)]' : 'border-[var(--border)] bg-[var(--raised)]'}`}>
                      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 fill-none stroke-[var(--text-strong)] [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.6]"><path d="m2.5 6.2 2.2 2.2 4.8-4.9" /></svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 px-5 text-center text-sm text-[var(--text-muted)] md:mt-8">Prix hors taxes. Sans engagement : passez au mensuel ou résiliez à tout moment.</p>
      <p aria-live="polite" className="sr-only">{live}</p>
    </section>
  );
}

export default PricingBascule;
