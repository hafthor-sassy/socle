// Hero produit au défilement — React 18 + Tailwind CSS, sans autre bibliothèque.
// Couleurs : variables de tokens.css. Marque (Cadran) et chiffres fictifs.
// Bureau (≥ 1100 px) : la capture d’app est dessinée en JSX dans un espace de 1200 × 760 px, mise à l’échelle au conteneur.
// Téléphone et tablette (< 1100 px) : une vraie app mobile à taille réelle (texte ≥ 14 px) dont les couches se soulèvent
// l’une après l’autre au défilement, avec une carte de légende (téléphone) ou une liste d’étapes à droite (tablette).
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const W = 1200, H = 760, BP = 1100;
const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const seg = (p, a, b) => ease(clamp((p - a) / (b - a)));
const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const LINE = 'M0.0,127.6 C8.4,126.4 33.5,123.2 50.2,120.4 C66.9,117.6 83.7,113.4 100.4,111.0 C117.1,108.6 133.8,108.3 150.5,105.8 C167.2,103.3 184.0,99.3 200.7,96.2 C217.4,93.1 234.2,89.9 250.9,87.2 C267.6,84.5 284.4,83.4 301.1,80.0 C317.8,76.6 334.6,71.0 351.3,66.6 C368.0,62.2 384.8,57.8 401.5,53.4 C418.2,49.0 434.9,44.6 451.6,40.2 C468.3,35.8 485.1,31.3 501.8,26.8 C518.5,22.3 543.6,15.5 552.0,13.2';
const KPIS = [
  { label: 'MRR', value: '128 420 €', delta: '▲ 8,2 %', spark: 'M0,22 C5,20 11,19 16,19 C21,18 27,15 32,13 C37,13 43,12 48,11 C53,9 59,6 64,5 C67,4 71,2 72,2' },
  { label: 'Clients actifs', value: '1 284', delta: '▲ 3,1 %', spark: 'M0,22 C5,23 11,17 16,17 C21,17 27,12 32,12 C37,12 43,7 48,7 C53,7 59,2 64,2 C67,1 71,2 72,2' },
  { label: 'Churn mensuel', value: '1,9 %', delta: '▼ 0,4 pt', spark: 'M0,2 C5,5 11,6 16,6 C21,7 27,10 32,10 C37,11 43,14 48,14 C53,15 59,18 64,18 C67,19 71,21 72,22' },
  { label: 'Revenu moyen / compte', value: '100 €', delta: '▲ 4,8 %', spark: 'M0,22 C5,19 11,18 16,18 C21,17 27,14 32,14 C37,13 43,10 48,10 C53,9 59,3 64,2 C67,1 71,2 72,2' },
];
const NAV = [
  ['Vue d’ensemble', 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', '', true],
  ['Revenus', 'M4 18l5-6 4 3 7-9', ''], ['Clients', 'M3 19a6 6 0 0 1 12 0M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7', '1 284'],
  ['Abonnements', 'M4 7h16M4 12h16M4 17h10', ''], ['Factures', 'M7 3h7l4 4v14H7zM10 12h5M10 16h5', '3'],
  ['Prévisions', 'M4 20V10M10 20V4M16 20v-7M22 20H2', ''], ['Intégrations', 'M9 7V4M15 7V4M7 7h10v4a5 5 0 0 1-10 0zM12 16v4', ''],
];
const ROWS = [
  ['ML', 'Maison Lune', 'Pro → Échelle', '+270 €', 'Montée en gamme', 'green', 'Aujourd’hui'],
  ['BO', 'Brasserie Opale', 'Essentiel', '+49 €', 'Nouveau', 'blue', 'Hier'],
  ['SA', 'Studio Ardent', 'Pro', '−79 €', 'Résilié', 'red', '28 nov.'],
];
const TINT = {
  green: 'border-[var(--tint-green-border)] bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]',
  blue: 'border-[var(--tint-blue-border)] bg-[var(--tint-blue-bg)] text-[var(--tint-blue-fg)]',
  red: 'border-[var(--tint-red-border)] bg-[var(--tint-red-bg)] text-[var(--tint-red-fg)]',
};
const MONTHS = ['déc.', 'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.'];

const card = 'absolute rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)]';
/* Ombre de profondeur : n’apparaît qu’au détachement des couches. */
const Depth = () => <span aria-hidden="true" className="absolute inset-0 -z-10 rounded-[inherit] [box-shadow:var(--shadow-popover)]" style={{ opacity: 'min(1, calc(var(--e) * var(--i, 0) * 1.5))' }} />;
const Tag = ({ x, y, children }) => (
  <span className="absolute z-[1] inline-flex h-[26px] items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--text-strong)] px-2.5 text-xs font-semibold text-[var(--bg)] before:size-1.5 before:rounded-full before:bg-[var(--accent-vivid)] before:content-['']"
    style={{ left: x, top: y, transform: 'translateY(calc(-100% - 8px + (1 - var(--e)) * 8px))', opacity: 'calc((var(--e) - .35) * 2.4)' }}>{children}</span>
);
const Ic = ({ d, className = 'size-4' }) => <svg className={`${className} flex-none`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;


/* ——— Composition mobile ——— */
const M_LINE = 'M0.0,112.0 C4.6,110.9 18.2,108.0 27.3,105.5 C36.4,102.9 45.5,99.1 54.6,96.9 C63.6,94.7 72.7,94.5 81.8,92.2 C90.9,89.9 100.0,86.3 109.1,83.5 C118.2,80.6 127.3,77.7 136.4,75.3 C145.4,72.8 154.6,71.8 163.6,68.7 C172.7,65.6 181.8,60.5 190.9,56.5 C200.0,52.5 209.1,48.5 218.2,44.5 C227.3,40.5 236.4,36.5 245.4,32.5 C254.5,28.5 263.6,24.5 272.7,20.4 C281.8,16.3 295.4,10.1 300.0,8.0';
const STEPS = [
  ['Indicateurs en temps réel', 'MRR, clients et churn recalculés à chaque paiement.'],
  ['Graphiques et tableaux partagés', 'La courbe sur 12 mois et chaque mouvement client, au même endroit.'],
  ['Assistant et alertes', 'Cadran repère les montées en gamme et vous prévient au bon moment.'],
];
const M_TONE = { green: 'text-[var(--tint-green-fg)]', blue: 'text-[var(--tint-blue-fg)]', red: 'text-[var(--tint-red-fg)]' };
/* Logo Cadran : cadran aux trois quarts, l’aiguille pointe vers l’ouverture. */
export const CadranLogo = ({ className = 'size-5' }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" aria-hidden="true">
    <path d="M16 5.5A10.5 10.5 0 1 0 26.5 16" /><path d="M16 16l5.4-5.4" />
    <circle cx="16" cy="16" r="2.25" fill="currentColor" stroke="none" /><circle cx="24.7" cy="7.3" r="1.85" fill="currentColor" stroke="none" />
  </svg>
);
/* Une carte de l’app mobile : se soulève quand sa couche (--l) est à l’étape, les autres s’effacent un peu. */
const MCard = ({ layer, className = '', children }) => (
  <div className={`relative rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4 group-data-[narrow]/m:p-3.5 ${className}`}
    style={{ '--l': `var(--m${layer})`, zIndex: 1, transform: 'translateY(calc(var(--l) * -6px * var(--int))) scale(calc(1 + var(--l) * .03 * var(--int)))', opacity: 'calc(1 - .5 * max(0, var(--mx) - var(--l)))' }}>
    <span aria-hidden="true" className="absolute inset-0 -z-10 rounded-[inherit] [box-shadow:var(--shadow-popover)]" style={{ opacity: 'var(--l)' }} />
    {children}
  </div>
);

function MobileApp({ isStatic, glow, labels, n }) {
  const showSteps = labels && n > 0;
  return (
    <div data-hpd-m className={`group/m hidden ${isStatic ? 'relative justify-items-center gap-8 px-4 pt-10 max-[1099px]:grid' : 'pointer-events-none absolute inset-0 z-[2] max-[1099px]:block'}`}
      style={{ '--m1': 0, '--m2': 0, '--m3': 0, '--mx': 0, '--me': 0, '--cp': isStatic ? 1 : 0, '--msc': 0, '--mw': '358px', '--mh': '640px', '--sx': '0px' }}>
      <div data-hpd-mwrap className={`${isStatic ? 'relative' : 'absolute left-0 top-0'} origin-top [will-change:transform]`}
        style={{ width: 'var(--mw)', height: 'var(--mh)', perspective: 'var(--persp)', perspectiveOrigin: '50% 30%' }}>
        <div role="img" aria-label="Aperçu de l’app mobile Cadran : MRR de 128 420 € en hausse de 8,2 %, courbe sur 12 mois, derniers mouvements clients, notification de paiement et conseil de l’assistant."
          className="absolute inset-0 origin-[50%_30%] [transform-style:preserve-3d]"
          style={isStatic ? undefined : { transform: 'rotateX(calc(var(--tilt) * (1 - var(--a)) + 5deg * var(--me) * var(--int))) rotateY(calc(-7deg * var(--me) * var(--int)))' }}>
          {glow && <div aria-hidden="true" className="absolute -inset-x-[6%] bottom-[-2%] top-[6%] rounded-full [box-shadow:0_0_96px_32px_var(--glow-accent),0_32px_128px_16px_var(--glow)]" style={{ transform: 'translateZ(-1px)', opacity: 'calc(.5 + var(--a) * .5)' }} />}
          <div aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-[var(--radius-sheet)] border border-[var(--border)] bg-[var(--bg)] text-left text-sm leading-[1.45] text-[var(--text)] [box-shadow:var(--shadow-popover)]">
            {/* Barre d’état et barre d’app */}
            <div className="flex h-10 items-center justify-between px-6 text-sm font-semibold text-[var(--text-strong)]">
              <b>9:41</b>
              <span className="flex items-center gap-1.5">
                <svg className="h-[11px] w-auto" viewBox="0 0 20 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
                <svg className="h-[11px] w-auto" viewBox="0 0 26 12" fill="currentColor"><rect x=".75" y=".75" width="21" height="10.5" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".45" /><rect x="2.75" y="2.75" width="15" height="6.5" rx="1.5" /><rect x="23.25" y="4" width="1.75" height="4" rx=".8" opacity=".45" /></svg>
              </span>
            </div>
            <div className="flex h-[52px] items-center justify-between px-4">
              <span className="flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-[var(--radius-ctl)] bg-[var(--accent)] text-[var(--accent-fg)]"><CadranLogo /></span><b className="text-[17px] tracking-[-.015em] text-[var(--text-strong)]">Cadran</b></span>
              <span className="flex items-center gap-1">
                <span className="relative grid size-10 place-items-center"><Ic d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" className="size-[22px]" /><i className="absolute right-2.5 top-[9px] size-2 rounded-full border-[1.5px] border-[var(--bg)] bg-[var(--accent-vivid)]" /></span>
                <span className="grid size-8 place-items-center rounded-full border border-[var(--border)] bg-[var(--raised)] text-xs font-semibold text-[var(--text-strong)]">LM</span>
              </span>
            </div>

            {/* Contenu qui défile dans l’app (--msc) */}
            <div data-hpd-mview className="absolute inset-x-0 bottom-[72px] top-[92px] overflow-hidden">
              <div data-hpd-mscroll className="grid gap-3 px-4 pb-6 pt-1 group-data-[narrow]/m:px-3" style={{ transform: 'translateY(calc(var(--msc) * -1px))' }}>
                <div className="grid gap-0.5 pb-1"><b className="text-2xl font-semibold leading-tight tracking-[-.025em] text-[var(--text-strong)]">Vue d’ensemble</b><small className="text-sm text-[var(--text-muted)]">Novembre 2026 · à jour il y a 2 min</small></div>
                <div className="grid h-10 grid-cols-3 rounded-[var(--radius-ctl)] border border-[var(--border)] bg-[var(--raised)] p-[3px] text-sm font-medium text-[var(--text-muted)]">
                  <i className="grid place-items-center not-italic">7 j</i><i className="grid place-items-center rounded-md bg-[var(--surface)] not-italic text-[var(--text-strong)] shadow-[0_0_0_1px_var(--border)]">30 j</i><i className="grid place-items-center not-italic">12 mois</i>
                </div>

                <MCard layer={1}>
                  <div className="flex items-center justify-between"><small className="text-sm font-medium text-[var(--text-muted)]">MRR</small><span className={`inline-flex h-7 items-center rounded-full border px-2.5 text-sm font-semibold ${TINT.green}`}>▲ 8,2 %</span></div>
                  <b className="mt-0.5 block text-[34px] font-semibold leading-[1.1] tracking-[-.035em] tabular-nums text-[var(--text-strong)]">128 420 €</b>
                  <svg className="mb-3.5 mt-2.5 block h-10 w-full overflow-visible" viewBox="0 0 72 24" preserveAspectRatio="none" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><path d={KPIS[0].spark} vectorEffect="non-scaling-stroke" /></svg>
                  <div className="grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-3.5">
                    {[['Clients actifs', '1 284', '▲ 3,1 %'], ['Churn mensuel', '1,9 %', '▼ 0,4 pt']].map(([l, v, dl]) => (
                      <span key={l} className="grid grid-cols-[auto_1fr] items-baseline gap-x-2"><small className="col-span-2 text-sm text-[var(--text-muted)]">{l}</small><b className="text-xl font-semibold tracking-[-.02em] tabular-nums text-[var(--text-strong)]">{v}</b><em className="text-sm font-semibold not-italic text-[var(--up)]">{dl}</em></span>
                    ))}
                  </div>
                </MCard>

                <MCard layer={2}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="grid gap-0.5"><small className="text-sm text-[var(--text-muted)]">MRR sur 12 mois</small><b className="text-lg font-semibold tracking-[-.02em] text-[var(--text-strong)]">+80 % sur un an</b></span>
                    <span className="inline-flex h-8 items-center rounded-full border border-[var(--border)] bg-[var(--raised)] px-3 text-sm font-medium">12 mois</span>
                  </div>
                  <div className="relative mt-4 h-[120px]">
                    <svg className="block size-full overflow-visible" viewBox="0 0 300 120" preserveAspectRatio="none">
                      <path d="M0,8.5H300M0,45.5H300M0,82.5H300M0,119.5H300" fill="none" stroke="var(--chart-grid)" strokeDasharray="3 4" />
                      <path d={`${M_LINE} L300,120 L0,120 Z`} fill="var(--accent)" style={{ fillOpacity: 'calc(.12 * var(--draw))' }} />
                      <path d={M_LINE} pathLength="1" fill="none" stroke="var(--accent)" strokeWidth="2.25" strokeLinecap="round" strokeDasharray="1" style={{ strokeDashoffset: 'calc(1 - var(--draw))' }} />
                    </svg>
                    <span className="absolute left-full top-2 -ml-1.5 -mt-1.5 size-3 rounded-full border-[2.5px] border-[var(--accent)] bg-[var(--surface)]" style={{ transform: 'scale(calc(var(--draw) * var(--draw)))' }} />
                    <span className="absolute left-full top-2 whitespace-nowrap rounded-md bg-[var(--text-strong)] px-2 py-1.5 text-[13px] font-semibold leading-none text-[var(--bg)]" style={{ transform: 'translate(-100%, 0) translate(-12px, -50%)', opacity: 'calc((var(--draw) - .8) * 5)' }}>Nov. · 128,4 k€</span>
                  </div>
                  <div className="mt-2.5 flex justify-between [font-family:var(--font-mono)] text-[13px] font-medium leading-none text-[var(--text-muted)]">{['déc.', 'mars', 'juin', 'sept.', 'nov.'].map((m) => <i key={m} className="not-italic">{m}</i>)}</div>
                </MCard>

                <MCard layer={2}>
                  <div className="flex items-center justify-between"><b className="text-[17px] font-semibold tracking-[-.02em] text-[var(--text-strong)]">Derniers mouvements</b><span className="text-sm font-semibold text-[var(--accent)]">Tout voir</span></div>
                  <div className="mt-2.5">
                    {ROWS.map(([ini, name, plan, amt, st, tone]) => (
                      <div key={name} className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 border-t border-[var(--border)] py-3 last:pb-0 group-data-[narrow]/m:grid-cols-[36px_minmax(0,1fr)_auto] group-data-[narrow]/m:gap-2.5">
                        <i className="grid aspect-square w-full place-items-center rounded-full border border-[var(--border)] bg-[var(--raised)] text-[13px] font-semibold not-italic text-[var(--text-strong)]">{ini}</i>
                        <span className="grid min-w-0"><b className="truncate text-[15px] font-semibold text-[var(--text-strong)]">{name}</b><small className="truncate text-sm text-[var(--text-muted)]">{plan}</small></span>
                        <span className="grid justify-items-end text-right"><b className="text-[15px] font-semibold tabular-nums text-[var(--text-strong)]">{amt}</b><em className={`text-sm font-medium not-italic ${M_TONE[tone]}`}>{st}</em></span>
                      </div>
                    ))}
                  </div>
                </MCard>
              </div>
            </div>

            {/* Barre d’onglets */}
            <nav className="absolute inset-x-0 bottom-0 flex h-[72px] items-center justify-around border-t border-[var(--border)] bg-[var(--surface)] px-3 pb-3 text-[var(--text-muted)] after:absolute after:bottom-1.5 after:left-1/2 after:-ml-[60px] after:h-1 after:w-[120px] after:rounded-full after:bg-[var(--text-strong)] after:opacity-20 after:content-['']">
              <span className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--accent-subtle)] pl-3.5 pr-4 text-sm font-semibold text-[var(--accent)]"><Ic d={NAV[0][1]} className="size-[22px]" />Accueil</span>
              {[NAV[1][1], NAV[2][1], NAV[4][1]].map((d) => <span key={d} className="grid size-11 place-items-center"><Ic d={d} className="size-[22px]" /></span>)}
            </nav>

            {/* Couche 3 : la notification tombe du haut, l’assistant monte en feuille du bas */}
            {!isStatic && <div className="absolute inset-0 z-[3] bg-[var(--scrim)]" style={{ opacity: 'calc(var(--m3) * .85)' }} />}
            <div className="absolute inset-x-3 top-11 z-[4] grid grid-cols-[auto_1fr] items-center gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 [box-shadow:var(--shadow-toast)]"
              style={{ transform: 'translateY(calc((1 - var(--m3)) * -180%)) scale(calc(.96 + var(--m3) * .04))', opacity: 'min(1, calc(var(--m3) * 3))' }}>
              <span className="grid size-9 place-items-center rounded-full bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]"><Ic d="M5 12.5l4.5 4.5L19 7.5" className="size-[15px]" /></span>
              <span className="grid min-w-0"><b className="truncate text-sm font-semibold text-[var(--text-strong)]">Paiement reçu · Maison Lune</b><small className="text-sm text-[var(--text-muted)]">1 270 € · à l’instant</small></span>
            </div>
            {!isStatic && (
              <div className="absolute inset-x-0 bottom-0 z-[4] grid gap-3 rounded-t-[var(--radius-sheet)] border-t border-[var(--border)] bg-[var(--surface)] px-4 pb-6 pt-2 [box-shadow:var(--shadow-overlay)]" style={{ transform: 'translateY(calc((1 - var(--m3)) * 105%))' }}>
                <span className="mb-1 h-1 w-10 justify-self-center rounded-full bg-[var(--border-strong)]" />
                <span className="flex items-center gap-2.5 text-base text-[var(--text-strong)]"><span className="grid size-8 place-items-center rounded-[var(--radius-ctl)] bg-[var(--accent-subtle)] text-[var(--accent)]"><Ic d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" className="size-[18px]" /></span><b>Assistant Cadran</b></span>
                <p className="m-0 text-[15px] leading-normal">3 comptes Pro dépassent leur quota depuis deux semaines. Leur proposer Échelle rapporterait <b className="text-[var(--text-strong)]">+810 €</b> de MRR.</p>
                <span className="mt-1 grid grid-cols-2 gap-2 text-[15px] font-semibold">
                  <span className="grid h-11 place-items-center rounded-[var(--radius-ctl)] border border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]">Voir les comptes</span>
                  <span className="grid h-11 place-items-center rounded-[var(--radius-ctl)] border border-[var(--border-control)] bg-[var(--surface)] text-[var(--text-strong)]">Plus tard</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Légendes : carte en bas sur téléphone, liste à droite de l’app sur tablette (data-side) */}
      {showSteps && (
        <div data-hpd-steps className={isStatic
          ? 'relative grid gap-3 text-left'
          : 'absolute bottom-[calc(16px+env(safe-area-inset-bottom,0px))] left-1/2 grid gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4 text-left [box-shadow:var(--shadow-popover)] group-data-[side]/m:bottom-auto group-data-[side]/m:left-[var(--sx)] group-data-[side]/m:top-1/2 group-data-[side]/m:!w-[296px] group-data-[side]/m:gap-6 group-data-[side]/m:border-0 group-data-[side]/m:bg-transparent group-data-[side]/m:p-0 group-data-[side]/m:shadow-none'}
          style={isStatic ? { width: 'var(--mw)' } : { width: 'var(--mw)', opacity: 'var(--cp)', transform: 'translate(var(--stx), var(--sty))' }}>
          <span className={`[font-family:var(--font-mono)] text-[13px] font-medium uppercase leading-none tracking-[var(--track-caps)] text-[var(--text-muted)] ${isStatic ? 'hidden' : 'hidden group-data-[side]/m:block'}`}>Ce que Cadran vous montre</span>
          {!isStatic && (
            <span aria-hidden="true" className="grid grid-cols-3 gap-1.5 group-data-[side]/m:hidden">
              {STEPS.map((_, i) => <i key={i} data-hpd-bar className="relative h-1 overflow-hidden rounded-full bg-[var(--border)]"><span className="absolute inset-0 origin-left rounded-full bg-[var(--accent)]" style={{ transform: 'scaleX(var(--f, 0))' }} /></i>)}
            </span>
          )}
          <ol className={`m-0 grid list-none p-0 ${isStatic ? 'gap-5' : 'group-data-[side]/m:gap-7'}`}>
            {STEPS.slice(0, n).map(([t, d], i) => (
              <li key={t} data-hpd-step className={`grid grid-cols-[auto_1fr] content-start gap-x-3 ${isStatic ? '' : '[grid-area:1/1] group-data-[side]/m:relative group-data-[side]/m:[grid-area:auto] group-data-[side]/m:pl-5'}`}
                style={isStatic ? undefined : { '--v': 0, opacity: 'var(--vo)', transform: 'var(--vt)' }}>
                {!isStatic && <span aria-hidden="true" className="absolute inset-y-0 left-0 hidden w-0.5 rounded-full bg-[var(--border)] group-data-[side]/m:block"><span className="absolute inset-0 origin-top rounded-full bg-[var(--accent)]" style={{ transform: 'scaleY(var(--v))' }} /></span>}
                <span className="row-span-2 pt-0.5 [font-family:var(--font-mono)] text-sm font-semibold leading-[1.3] text-[var(--accent)]">0{i + 1}</span>
                <b className="text-base font-semibold leading-[1.3] tracking-[-.01em] text-[var(--text-strong)] group-data-[side]/m:text-[19px]">{t}</b>
                <p className="m-0 mt-1 text-sm leading-[1.45] text-[var(--text-muted)] group-data-[side]/m:text-[15px]">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

/**
 * @param {{
 *   title?: string, lead?: string, primaryLabel?: string, primaryHref?: string, secondaryLabel?: string, secondaryHref?: string,
 *   intensity?: number,     // 0 à 2 : ampleur du détachement des couches
 *   tilt?: number,          // inclinaison de départ, en degrés
 *   layers?: 0|1|2|3,       // nombre de couches qui se détachent
 *   perspective?: number,   // en px
 *   length?: number,        // longueur de défilement, en % de la hauteur d’écran
 *   smoothing?: number,     // 0 (direct) à 0,95 (très amorti)
 *   labels?: boolean, glow?: boolean,
 *   mode?: 'scroll'|'static'
 * }} props
 */
export function ProductScrollHero({
  title = 'Vos revenus SaaS, lisibles d’un coup d’œil.',
  lead = 'Cadran réunit abonnements, factures et churn dans un seul tableau de bord. Branché à Stripe en deux minutes, à jour à chaque paiement.',
  primaryLabel = 'Essayer 14 jours', primaryHref = '#essai',
  secondaryLabel = 'Voir une démo de 3 min', secondaryHref = '#demo',
  intensity = 1, tilt = 28, layers = 3, perspective = 1400, length = 180, smoothing = 0.86,
  labels = true, glow = true, mode = 'scroll',
}) {
  const rootRef = useRef(null), stageRef = useRef(null), headRef = useRef(null), shotRef = useRef(null);
  const [reduce, setReduce] = useState(false);
  const [faded, setFaded] = useState(false);
  useEffect(() => {
    const m = matchMedia('(prefers-reduced-motion: reduce)'); setReduce(m.matches);
    const on = () => setReduce(m.matches); m.addEventListener('change', on); return () => m.removeEventListener('change', on);
  }, []);
  const isStatic = reduce || mode === 'static';
  const n = Math.max(0, Math.min(3, layers));

  useIso(() => {
    const root = rootRef.current, stage = stageRef.current, head = headRef.current, shot = shotRef.current;
    if (!root) return;
    const q = (sel) => root.querySelector(sel);
    const m = q('[data-hpd-m]'), mwrap = q('[data-hpd-mwrap]'), mview = q('[data-hpd-mview]'), mscroll = q('[data-hpd-mscroll]'), steps = q('[data-hpd-steps]');
    const stepEls = root.querySelectorAll('[data-hpd-step]'), bars = root.querySelectorAll('[data-hpd-bar]');
    const mq = matchMedia(`(max-width: ${BP - 1}px)`);
    let mob = mq.matches, side = false;
    const geo = { s0: 0.5, s1: 0.6, y0: 0, y1: 0, mx0: 0, mx1: 0, my0: 0, my1: 0, msc: 0 };
    let cur = 0, target = 0, raf = 0, last = 0, visible = true, wasFaded = false;
    const k0 = Math.max(0, Math.min(0.97, smoothing));

    /* Téléphone (< 720 px) : app centrée, légende en bas. Tablette (720 – 1099 px) : app à gauche, étapes à droite. */
    const fitMobile = () => {
      const w = stage.clientWidth, h = stage.clientHeight;
      side = w >= 720;
      m.toggleAttribute('data-side', side);
      const mw = side ? Math.min(400, Math.round(w * 0.46)) : Math.min(w - 32, 420);
      m.style.setProperty('--mw', `${mw}px`);
      m.toggleAttribute('data-narrow', mw < 372);
      if (isStatic) { m.style.setProperty('--mh', `${Math.min(1100, 92 + mscroll.scrollHeight + 72)}px`); return; }
      let mh;
      if (side) {
        mh = Math.min(760, h - 64);
        const gap = 56, x = steps ? Math.round((w - (mw + gap + 296)) / 2) : Math.round((w - mw) / 2);
        geo.mx0 = Math.round((w - mw) / 2); geo.mx1 = x; geo.my1 = Math.round((h - mh) / 2);
        m.style.setProperty('--sx', `${x + mw + gap}px`);
      } else {
        const sh = steps ? steps.offsetHeight + 12 : 0;
        mh = Math.max(440, Math.min(720, h - 32 - sh));
        geo.mx0 = geo.mx1 = Math.round((w - mw) / 2); geo.my1 = 16;
      }
      m.style.setProperty('--mh', `${mh}px`);
      geo.my0 = head.offsetTop + head.offsetHeight + (side ? 40 : 24);
      geo.msc = Math.max(0, mscroll.scrollHeight - mview.clientHeight);   // défilement interne à l’étape 2
    };
    const fit = () => {
      mob = mq.matches;
      const w = stage.clientWidth;
      if (mob) return fitMobile();
      if (isStatic) { root.style.setProperty('--s', Math.min(1, (w - 32) / (W + 96)).toFixed(4)); return; }
      const h = stage.clientHeight, narrow = w < 768, fitW = (w - (narrow ? 32 : 96)) / (W + 96);
      if (narrow) { geo.s0 = fitW; geo.s1 = Math.min(0.5, fitW * 1.5, (h - 160) / H); }
      else { geo.s1 = Math.min(1, fitW, (h - 96) / H); geo.s0 = geo.s1 * 0.92; }
      geo.y0 = head.offsetTop + head.offsetHeight + (narrow ? 32 : 48);
      geo.y1 = Math.max(24, (h - H * geo.s1) / 2);
    };
    const progress = () => { const r = root.getBoundingClientRect(), t = root.offsetHeight - stage.clientHeight; return t > 0 ? clamp(-r.top / t) : 0; };
    const setFadedOnce = (a) => { if ((a > 0.5) !== wasFaded) { wasFaded = a > 0.5; setFaded(wasFaded); } };
    const renderMobile = (p) => {
      let a = seg(p, 0, 0.28), draw = seg(p, 0.04, 0.38);
      let s1 = n >= 1 ? seg(p, 0.32, 0.46) : 0, s2 = n >= 2 ? seg(p, 0.52, 0.66) : 0, s3 = n >= 3 ? seg(p, 0.72, 0.86) : 0;
      if (isStatic) { a = 1; draw = 1; s1 = s2 = s3 = 0; }
      const m1 = s1 * (1 - 0.65 * s2), m2 = s2 * (1 - 0.65 * s3), m3 = s3, cp = clamp((a - 0.55) / 0.45);
      root.style.setProperty('--a', a.toFixed(4));
      root.style.setProperty('--draw', draw.toFixed(4));
      const st = m.style;
      st.setProperty('--m1', m1.toFixed(4)); st.setProperty('--m2', m2.toFixed(4)); st.setProperty('--m3', m3.toFixed(4));
      st.setProperty('--mx', Math.max(m1, m2, m3).toFixed(4));
      st.setProperty('--me', s1.toFixed(4));
      st.setProperty('--cp', cp.toFixed(4));
      st.setProperty('--msc', (geo.msc * s2).toFixed(1));
      st.setProperty('--stx', side ? `${((1 - cp) * 24).toFixed(1)}px` : '-50%');
      st.setProperty('--sty', side ? '-50%' : `${((1 - cp) * 24).toFixed(1)}px`);
      /* Légendes : la sortante s’efface sur la 1re moitié de la transition, l’entrante apparaît sur la 2de */
      const o2 = clamp(s2 * 2), i2 = clamp(s2 * 2 - 1), o3 = clamp(s3 * 2), i3 = clamp(s3 * 2 - 1);
      const v = [1 - o2, i2 * (1 - o3), i3];
      stepEls.forEach((el, i) => {
        el.style.setProperty('--v', v[i].toFixed(4));
        el.style.setProperty('--vo', (side ? 0.4 + 0.6 * v[i] : v[i]).toFixed(4));
        el.style.setProperty('--vt', side ? 'none' : `translateY(${((1 - v[i]) * 10).toFixed(1)}px)`);
      });
      [s1, s2, s3].forEach((f, i) => bars[i] && bars[i].style.setProperty('--f', f.toFixed(4)));
      bars.forEach((b, i) => { b.style.display = i < n ? '' : 'none'; });
      if (isStatic) { mwrap.style.transform = ''; return; }
      const x = geo.mx0 + (geo.mx1 - geo.mx0) * a, y = geo.my0 + (geo.my1 - geo.my0) * a, sc = 0.92 + 0.08 * a;
      mwrap.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${sc.toFixed(4)})`;
      setFadedOnce(a);
    };
    const render = (p) => {
      if (mob) return renderMobile(p);
      let a = ease(clamp(p / 0.42)), e = ease(clamp((p - 0.5) / 0.38)), draw = ease(clamp((p - 0.06) / 0.4));
      if (isStatic) { a = 1; e = 0; draw = 1; }
      root.style.setProperty('--a', a.toFixed(4));
      root.style.setProperty('--e', (n ? e : 0).toFixed(4));
      root.style.setProperty('--draw', draw.toFixed(4));
      if (isStatic) { shot.style.transform = 'scale(var(--s))'; return; }
      const s = geo.s0 + (geo.s1 - geo.s0) * a, y = geo.y0 + (geo.y1 - geo.y0) * a;
      shot.style.transform = `translateY(${y.toFixed(1)}px) scale(${s.toFixed(4)})`;
      setFadedOnce(a);
    };
    const tick = (t) => {
      const dt = last ? Math.min(64, t - last) : 16; last = t;
      cur += (target - cur) * (k0 ? 1 - Math.pow(k0, dt / 16.67) : 1);
      if (Math.abs(target - cur) < 0.0004) cur = target;
      render(cur);
      if (cur !== target) raf = requestAnimationFrame(tick); else { raf = 0; last = 0; }
    };
    const request = () => { if (isStatic) return render(1); target = progress(); if (!raf) raf = requestAnimationFrame(tick); };
    const onScroll = () => { if (visible) request(); };
    const onResize = () => { fit(); render(cur); request(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    mq.addEventListener('change', onResize);
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) request(); });
    io.observe(root);
    fit(); cur = target = isStatic ? 1 : progress(); render(cur);
    document.fonts?.ready.then(() => { fit(); render(cur); });
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize); mq.removeEventListener('change', onResize); io.disconnect(); };
  }, [isStatic, n, smoothing, labels]);

  const L = (i) => ({ '--i': i <= n ? i : 0, transform: 'translateZ(calc(var(--i) * (.5px + var(--e) * 64px * var(--int)))) translateY(calc(var(--i) * var(--e) * -10px * var(--int)))' });
  const out = (dir) => ({ transform: `translateX(calc(var(--e) * ${dir} * 28px * var(--int)))` });

  return (
    <section ref={rootRef} aria-labelledby="hpd-r-title"
      className="relative bg-[var(--bg)] [font-family:var(--font-sans)] text-[var(--text)]"
      style={{ '--a': 0, '--e': 0, '--draw': 0, '--int': intensity, '--tilt': `${tilt}deg`, '--persp': `${perspective}px`, height: isStatic ? 'auto' : `calc(${100 + length} * 1svh)` }}>
      <div ref={stageRef} className={isStatic ? 'relative pb-12' : 'sticky top-0 h-[100svh] overflow-clip'}>
        <header ref={headRef}
          className={`${isStatic ? 'relative' : 'absolute inset-x-0 top-0'} z-[1] grid justify-items-center gap-4 px-4 pt-10 text-center min-[600px]:pt-16 md:gap-5 md:pt-[72px] ${faded && !isStatic ? 'pointer-events-none' : ''}`}
          style={isStatic ? undefined : { transform: 'translateY(calc(var(--a) * -48px))', opacity: 'calc(1 - var(--a) * 2)' }}>
          <a href="#nouveautes" className="group inline-flex min-h-9 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] py-1 pl-3 pr-3 text-[13px] font-medium text-[var(--text)] no-underline transition-colors focus-visible:outline focus-visible:outline-[length:var(--focus-width)] focus-visible:outline-offset-[var(--focus-offset)] focus-visible:outline-[var(--focus-ring)] min-[480px]:pl-1 [@media(hover:hover)]:hover:border-[var(--border-control)]">
            <span className="hidden h-[26px] items-center rounded-full bg-[var(--accent-subtle)] px-2.5 text-xs font-semibold text-[var(--accent)] min-[480px]:inline-flex">Nouveau</span>
            Prévisions de trésorerie à 12 mois
            <Ic d="M5 12h14M13 6l6 6-6 6" className="size-3.5 transition-transform duration-300 [@media(hover:hover)]:group-hover:translate-x-[3px]" />
          </a>
          <h1 id="hpd-r-title" className="m-0 max-w-[16ch] text-balance text-[clamp(2.5rem,1.5rem+4.6vw,4.75rem)] font-semibold leading-none tracking-[-.045em] text-[var(--text-strong)]">{title}</h1>
          <p className="m-0 max-w-[52ch] text-pretty text-[clamp(1rem,.95rem+.3vw,1.1875rem)] leading-[1.55] text-[var(--text-muted)]">{lead}</p>
          <div className="mt-1 flex w-full flex-wrap justify-center gap-x-3 gap-y-2">
            <a href={primaryHref} className="group inline-flex h-12 flex-[1_1_100%] items-center justify-center gap-2 rounded-[var(--radius-ctl)] bg-[var(--accent)] px-5 text-[15px] font-semibold text-[var(--accent-fg)] no-underline transition active:scale-[.98] focus-visible:outline focus-visible:outline-[length:var(--focus-width)] focus-visible:outline-offset-[var(--focus-offset)] focus-visible:outline-[var(--focus-ring)] min-[480px]:flex-none [@media(hover:hover)]:hover:bg-[var(--accent-hover)]">
              {primaryLabel}<Ic d="M5 12h14M13 6l6 6-6 6" className="size-4 transition-transform duration-300 [@media(hover:hover)]:group-hover:translate-x-[3px]" />
            </a>
            <a href={secondaryHref} className="inline-flex h-12 flex-[1_1_100%] items-center justify-center rounded-[var(--radius-ctl)] border border-[var(--border-control)] bg-[var(--surface)] px-5 text-[15px] font-semibold text-[var(--text-strong)] no-underline transition active:scale-[.98] focus-visible:outline focus-visible:outline-[length:var(--focus-width)] focus-visible:outline-offset-[var(--focus-offset)] focus-visible:outline-[var(--focus-ring)] min-[480px]:flex-none [@media(hover:hover)]:hover:bg-[var(--state-hover)]">{secondaryLabel}</a>
          </div>
          <p className="m-0 hidden text-[13px] text-[var(--text-muted)] min-[480px]:block">Sans carte bancaire · Données hébergées en France · 1 200 équipes</p>
          {!isStatic && (
            <p aria-hidden="true" className="m-0 flex items-center gap-2 [font-family:var(--font-mono)] text-[11px] uppercase tracking-[var(--track-caps)] text-[var(--text-muted)] max-[599px]:hidden [@media(max-height:760px)_and_(min-width:768px)]:hidden" style={{ opacity: 'calc(1 - var(--a) * 4)' }}>
              <span className="grid h-6 w-4 justify-items-center rounded-lg border-[1.5px] border-current pt-1"><i className="h-[5px] w-0.5 rounded-sm bg-current motion-safe:animate-bounce" /></span>Faites défiler
            </p>
          )}
        </header>

        {/* Capture : 1200 × 760 px mis à l’échelle */}
        <div className={`max-[1099px]:hidden ${isStatic ? 'relative mt-10' : 'pointer-events-none absolute inset-0 z-[2]'}`} style={isStatic ? { height: 'calc(760px * var(--s, .3) + 24px)' } : undefined}>
          <div ref={shotRef} className="absolute left-1/2 top-0 -ml-[600px] h-[760px] w-[1200px] origin-top [will-change:transform]" style={{ perspective: `${perspective}px`, perspectiveOrigin: '50% 35%' }}>
            <div role="img" aria-label="Aperçu de Cadran : tableau de bord des revenus avec MRR de 128 420 €, courbe sur 12 mois, répartition par offre, derniers mouvements clients et une alerte de l’assistant."
              className="absolute inset-0 text-[13px] leading-[1.4] [transform-style:preserve-3d]"
              style={{ transform: `translate3d(calc(var(--e) * -32px * var(--int)), calc((1 - var(--a)) * 40px - var(--e) * 24px * var(--int)), 0) rotateX(calc(${tilt}deg * (1 - var(--a)) + 11deg * var(--e) * var(--int))) rotateZ(calc(-5deg * var(--e) * var(--int))) scale(calc(1 - .17 * var(--e) * var(--int)))` }}>
              {glow && <div aria-hidden="true" className="absolute inset-x-[6%] bottom-[-2%] top-[8%] rounded-full [box-shadow:0_0_120px_40px_var(--glow-accent),0_40px_160px_20px_var(--glow)]" style={{ transform: 'translateZ(-1px)', opacity: 'calc(.5 + var(--a) * .5)' }} />}

              {/* Couche 0 : fenêtre */}
              <div aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-[var(--radius-sheet)] border border-[var(--border)] bg-[var(--bg)] [box-shadow:var(--shadow-popover)]">
                <aside className="absolute inset-y-0 left-0 flex w-[232px] flex-col gap-1 border-r border-[var(--border)] bg-[var(--surface)] px-3 py-4">
                  <div className="grid grid-cols-[auto_1fr] items-center gap-x-2.5 px-2 pb-4 pt-1">
                    <span className="row-span-2 grid size-8 place-items-center rounded-[var(--radius-ctl)] bg-[var(--accent)] text-[var(--accent-fg)]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round"><path d="M12 4a8 8 0 1 0 8 8" /><path d="M12 12l5-5" /></svg></span>
                    <b className="text-[15px] tracking-[-.01em] text-[var(--text-strong)]">Cadran</b><span className="-mt-0.5 text-xs leading-none text-[var(--text-muted)]">Atelier Nord</span>
                  </div>
                  {NAV.map(([l, d, badge, on]) => (
                    <span key={l} className={`flex h-[34px] items-center gap-2.5 rounded-[var(--radius-ctl)] px-2.5 ${on ? 'bg-[var(--raised)] font-semibold text-[var(--text-strong)] shadow-[inset_0_0_0_1px_var(--border)]' : ''}`}>
                      <Ic d={d} />{l}{badge && <em className="ml-auto text-[11px] not-italic tabular-nums text-[var(--text-muted)]">{badge}</em>}
                    </span>
                  ))}
                  <div className="px-2.5 pb-1.5 pt-5 [font-family:var(--font-mono)] text-[11px] uppercase leading-none tracking-[var(--track-caps)] text-[var(--text-muted)]">Équipes</div>
                  {[['Finance', 'var(--chart-1)'], ['Croissance', 'var(--chart-3)'], ['Support', 'var(--chart-4)']].map(([l, c]) => (
                    <span key={l} className="flex h-[34px] items-center gap-2.5 px-2.5"><i className="mx-1 size-2 rounded-[3px]" style={{ background: c }} />{l}</span>
                  ))}
                  <div className="mt-auto flex items-center gap-2.5 border-t border-[var(--border)] px-2 pt-3">
                    <span className="grid size-7 place-items-center rounded-full border border-[var(--border)] bg-[var(--raised)] text-[10px] font-semibold text-[var(--text-strong)]">LM</span>
                    <span className="grid"><b className="text-[13px] text-[var(--text-strong)]">Léa Martin</b><small className="text-[11px] text-[var(--text-muted)]">Directrice financière</small></span>
                  </div>
                </aside>
                <div className="absolute left-[232px] right-0 top-0 flex h-[60px] items-center justify-between border-b border-[var(--border)] px-6">
                  <span className="flex h-[34px] w-[380px] items-center gap-2 rounded-[var(--radius-ctl)] border border-[var(--border)] bg-[var(--surface)] px-2.5 text-[var(--text-muted)]"><Ic d="M11 17.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM20 20l-4-4" />Rechercher un client, une facture…<kbd className="ml-auto rounded border border-[var(--border)] px-1.5 [font-family:var(--font-mono)] text-[11px]">⌘K</kbd></span>
                  <span className="flex items-center gap-3.5">
                    <span className="flex">{['AK', 'TR', '+4'].map((a) => <span key={a} className="-ml-2 grid size-[30px] place-items-center rounded-full border-2 border-[var(--bg)] bg-[var(--raised)] text-[10px] font-semibold text-[var(--text-strong)]">{a}</span>)}</span>
                    <span className="relative grid size-[34px] place-items-center"><Ic d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" /><i className="absolute right-2 top-[7px] size-[7px] rounded-full border-[1.5px] border-[var(--bg)] bg-[var(--accent-vivid)]" /></span>
                    <span className="inline-flex h-8 items-center rounded-[var(--radius-ctl)] border border-[var(--border-control)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--text-strong)]">Exporter</span>
                  </span>
                </div>
                <div className="absolute left-[256px] right-6 top-[76px] flex items-center justify-between">
                  <span className="grid"><b className="text-xl tracking-[-.02em] text-[var(--text-strong)]">Vue d’ensemble</b><small className="text-xs text-[var(--text-muted)]">1 – 30 novembre 2026 · mis à jour il y a 2 min</small></span>
                  <span className="flex rounded-[var(--radius-ctl)] border border-[var(--border)] bg-[var(--raised)] p-[3px] text-xs font-medium text-[var(--text-muted)]">
                    <i className="px-3 py-[5px] not-italic">7 j</i><i className="rounded-md bg-[var(--surface)] px-3 py-[5px] not-italic text-[var(--text-strong)] shadow-[0_0_0_1px_var(--border)]">30 j</i><i className="px-3 py-[5px] not-italic">12 mois</i>
                  </span>
                </div>
              </div>

              {/* Couche 1 : indicateurs */}
              <div aria-hidden="true" className="absolute inset-0 [transform-style:preserve-3d]" style={L(1)}>
                {labels && <Tag x={958} y={136}>Indicateurs en temps réel</Tag>}
                {KPIS.map((k, i) => (
                  <div key={k.label} className={`${card} grid h-[104px] w-[218px] grid-cols-[1fr_auto] content-start gap-y-1 px-4 py-3.5`} style={{ left: 256 + i * 234, top: 136 }}>
                    <Depth />
                    <small className="col-span-2 text-xs text-[var(--text-muted)]">{k.label}</small>
                    <b className="text-2xl font-semibold tracking-[-.03em] tabular-nums text-[var(--text-strong)]">{k.value}</b>
                    <span className="self-center text-xs font-semibold text-[var(--up)]">{k.delta}</span>
                    <svg className="absolute bottom-3 left-4 h-[22px] w-[calc(100%-32px)] overflow-visible" viewBox="0 0 72 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"><path d={k.spark} /></svg>
                  </div>
                ))}
              </div>

              {/* Couche 2 : graphique, répartition, tableau */}
              <div aria-hidden="true" className="absolute inset-0 [transform-style:preserve-3d]" style={L(2)}>
                {labels && <Tag x={72} y={600}>Graphiques et tableaux partagés</Tag>}
                <div className={`${card} left-[256px] top-[256px] h-[292px] w-[600px]`}>
                  <Depth />
                  <div className="flex items-start justify-between px-4 pt-3.5">
                    <span className="grid gap-0.5"><small className="text-xs text-[var(--text-muted)]">MRR sur 12 mois</small><b className="text-xl tracking-[-.02em] tabular-nums text-[var(--text-strong)]">128 420 €</b></span>
                    <span className={`inline-flex h-[22px] items-center rounded-full border px-2 text-[11px] font-semibold ${TINT.green}`}>+80 % sur un an</span>
                  </div>
                  <svg className="absolute left-6 top-[92px] h-[150px] w-[552px] overflow-visible" viewBox="0 0 552 150" preserveAspectRatio="none">
                    <path d="M0,0.5H552M0,50.5H552M0,100.5H552M0,149.5H552" fill="none" stroke="var(--chart-grid)" strokeDasharray="3 4" />
                    <path d={`${LINE} L552,150 L0,150 Z`} fill="var(--accent)" style={{ fillOpacity: 'calc(.12 * var(--draw))' }} />
                    <path d={LINE} pathLength="1" fill="none" stroke="var(--accent)" strokeWidth="2.25" strokeLinecap="round" strokeDasharray="1" style={{ strokeDashoffset: 'calc(1 - var(--draw))' }} />
                  </svg>
                  <span className="absolute -ml-1.5 -mt-1.5 size-3 rounded-full border-[2.5px] border-[var(--accent)] bg-[var(--surface)]" style={{ left: 576, top: 105, transform: 'scale(calc(var(--draw) * var(--draw)))' }} />
                  <span className="absolute whitespace-nowrap rounded-md bg-[var(--text-strong)] px-2 py-[5px] text-[11px] font-semibold leading-none text-[var(--bg)]" style={{ left: 576, top: 105, transform: 'translate(-100%, -150%) translateX(-8px)', opacity: 'calc((var(--draw) - .8) * 5)' }}>Nov. · 128,4 k€</span>
                  <div className="absolute bottom-3.5 left-6 right-6 flex justify-between [font-family:var(--font-mono)] text-[10px] leading-none text-[var(--text-muted)]">{MONTHS.map((m) => <i key={m} className="flex w-0 justify-center not-italic">{m}</i>)}</div>
                </div>
                <div className={`${card} left-[872px] top-[256px] h-[292px] w-[304px]`}>
                  <Depth />
                  <div className="grid gap-0.5 px-4 pt-3.5"><small className="text-xs text-[var(--text-muted)]">Répartition par offre</small><b className="text-xl tracking-[-.02em] text-[var(--text-strong)]">3 offres</b></div>
                  <div className="absolute left-4 top-[84px] size-[120px]">
                    <svg className="size-full -rotate-90" viewBox="0 0 36 36" fill="none" strokeWidth="4.2">
                      <circle r="15.9" cx="18" cy="18" stroke="var(--chart-1)" strokeDasharray="48 52" />
                      <circle r="15.9" cx="18" cy="18" stroke="var(--chart-3)" strokeDasharray="37 63" strokeDashoffset="-48" />
                      <circle r="15.9" cx="18" cy="18" stroke="var(--chart-4)" strokeDasharray="15 85" strokeDashoffset="-85" />
                    </svg>
                    <span className="absolute inset-0 grid place-content-center text-center"><b className="text-lg tracking-[-.02em] text-[var(--text-strong)]">1 284</b><small className="text-[11px] text-[var(--text-muted)]">comptes</small></span>
                  </div>
                  <ul className="absolute left-[156px] right-4 top-[92px] m-0 grid list-none gap-3.5 p-0 text-xs">
                    {[['Échelle', '48 %', 'var(--chart-1)'], ['Pro', '37 %', 'var(--chart-3)'], ['Essentiel', '15 %', 'var(--chart-4)']].map(([l, v, c]) => (
                      <li key={l} className="grid grid-cols-[auto_1fr_auto] items-center gap-2"><i className="size-2 rounded-[3px]" style={{ background: c }} />{l}<b className="tabular-nums text-[var(--text-strong)]">{v}</b></li>
                    ))}
                  </ul>
                </div>
                <div className={`${card} left-[256px] top-[564px] h-[172px] w-[920px] overflow-hidden`}>
                  <Depth />
                  <div className="grid h-11 grid-cols-[2fr_1.4fr_1fr_1.4fr_1fr] items-center bg-[var(--raised)] px-4 text-xs font-medium text-[var(--text-muted)]"><span>Client</span><span>Offre</span><span>Montant</span><span>Statut</span><span>Date</span></div>
                  {ROWS.map(([ini, name, plan, amt, st, tone, date]) => (
                    <div key={name} className="grid h-[42px] grid-cols-[2fr_1.4fr_1fr_1.4fr_1fr] items-center border-t border-[var(--border)] px-4">
                      <span className="flex items-center font-medium text-[var(--text-strong)]"><i className="mr-2 grid size-[22px] place-items-center rounded-full border border-[var(--border)] bg-[var(--raised)] text-[9px] font-semibold not-italic">{ini}</i>{name}</span>
                      <span>{plan}</span><span className="font-semibold tabular-nums text-[var(--text-strong)]">{amt}</span>
                      <span><em className={`inline-flex h-[22px] items-center rounded-full border px-2 text-[11px] font-semibold not-italic ${TINT[tone]}`}>{st}</em></span><span>{date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Couche 3 : assistant et notification */}
              <div aria-hidden="true" className="absolute inset-0 [transform-style:preserve-3d]" style={L(3)}>
                {labels && <Tag x={916} y={676}>Assistant et alertes</Tag>}
                <div className={`${card} -left-12 top-[344px] grid w-[300px] gap-2.5 px-4 pb-4 pt-3.5`} style={out(-1)}>
                  <Depth />
                  <span className="flex items-center gap-2 text-[var(--text-strong)]"><span className="grid size-[26px] place-items-center rounded-[var(--radius-ctl)] bg-[var(--accent-subtle)] text-[var(--accent)]"><Ic d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" className="size-[15px]" /></span><b>Assistant Cadran</b></span>
                  <p className="m-0 leading-normal">3 comptes Pro dépassent leur quota de minutes depuis deux semaines. Leur proposer Échelle rapporterait <b className="text-[var(--text-strong)]">+810 €</b> de MRR.</p>
                  <span className="flex gap-2">
                    <span className="inline-flex h-8 items-center rounded-[var(--radius-ctl)] border border-[var(--accent)] bg-[var(--accent)] px-3 text-xs font-semibold text-[var(--accent-fg)]">Voir les comptes</span>
                    <span className="inline-flex h-8 items-center rounded-[var(--radius-ctl)] border border-[var(--border-control)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--text-strong)]">Plus tard</span>
                  </span>
                </div>
                <div className={`${card} left-[900px] top-[676px] grid h-16 w-[336px] grid-cols-[auto_1fr_auto] items-center gap-3 px-4`} style={out(1)}>
                  <Depth />
                  <span className="grid size-[30px] place-items-center rounded-full bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]"><Ic d="M5 12.5l4.5 4.5L19 7.5" className="size-[15px]" /></span>
                  <span className="grid"><b className="text-[var(--text-strong)]">Paiement reçu · Maison Lune</b><small className="text-xs text-[var(--text-muted)]">1 270 € · facture F-2026-1184</small></span>
                  <em className="mt-3.5 self-start text-[11px] not-italic text-[var(--text-muted)]">à l’instant</em>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Téléphone et tablette (< 1100 px) */}
        <MobileApp isStatic={isStatic} glow={glow} labels={labels} n={n} />
      </div>
    </section>
  );
}

export default ProductScrollHero;
