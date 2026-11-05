// Pricing par recharge · curseur — React + Tailwind CSS. Couleurs : variables de tokens.css. Chiffres fictifs.
import { useId, useMemo, useState } from 'react';

export function RechargeSlider({
  title = 'Rechargez, appelez, c’est tout.',
  lead = 'Vous payez les minutes d’appel de vos agents, rien d’autre. Plus la recharge est grande, plus la minute est douce.',
  cta = 'Recharger',
  currency = 'EUR',
  rate = 0.09,                 // prix de base par minute
  tiers = [10, 25, 50, 100],   // paliers rapides (le curseur va du premier au dernier)
  bonus = [0, 5, 10, 20],      // % de minutes offertes à partir de chaque palier
  onRecharge,
}) {
  const id = useId();
  const [amount, setAmount] = useState(tiers[Math.min(2, tiers.length - 1)]);
  const fmt = useMemo(() => ({
    money: new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }),
    money3: new Intl.NumberFormat('fr-FR', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 3 }),
    num: new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }),
  }), [currency]);
  const min = tiers[0];
  const max = tiers[tiers.length - 1];
  const b = tiers.reduce((acc, t, i) => (amount >= t ? bonus[i] || 0 : acc), 0);
  const minutes = Math.floor((amount * (1 + b / 100)) / rate);
  const fill = ((amount - min) / (max - min)) * 100;
  const firstBonus = tiers.find((t, i) => bonus[i] > 0);

  return (
    <section aria-labelledby={`${id}-t`} className="bg-[var(--bg)] px-4 pb-[72px] pt-14 font-[var(--font-sans)] text-[var(--text)]">
      <div className="mx-auto grid max-w-[640px] gap-8">
        <header className="grid justify-items-center gap-3 text-center">
          <p className="m-0 font-mono text-xs uppercase tracking-[.04em] text-[var(--text-muted)]">Prépayé · sans abonnement</p>
          <h2 id={`${id}-t`} className="m-0 text-balance text-[clamp(1.75rem,1.3rem+2vw,2.5rem)] font-semibold leading-[1.12] tracking-[-.02em] text-[var(--text-strong)]">{title}</h2>
          <p className="m-0 max-w-[46ch] text-[17px] leading-relaxed text-[var(--text-muted)]">{lead}</p>
        </header>

        <div className="grid gap-6 rounded-[var(--radius-sheet)] border border-[var(--border)] bg-[var(--surface)] px-5 py-6 sm:p-8">
          <div className="grid justify-items-center gap-1.5 text-center" aria-live="polite">
            <span className="text-[13px] text-[var(--text-muted)]">Montant de la recharge</span>
            <output htmlFor={`${id}-r`} className="text-[clamp(3.5rem,2.6rem+4vw,5.5rem)] font-semibold leading-none tracking-[-.04em] tabular-nums text-[var(--text-strong)]">{fmt.money.format(amount)}</output>
            <span className={`inline-flex h-[26px] items-center rounded-full border px-2.5 text-[13px] font-medium ${b ? 'border-[var(--tint-green-border)] bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]' : 'border-[var(--tint-neutral-border)] bg-[var(--tint-neutral-bg)] text-[var(--tint-neutral-fg)]'}`}>
              {b ? `+${b} % offerts` : `Bonus dès ${fmt.money.format(firstBonus || max)}`}
            </span>
          </div>

          <div className="relative pb-[22px] pt-1">
            <label htmlFor={`${id}-r`} className="sr-only">Montant de la recharge</label>
            <input
              id={`${id}-r`} type="range" min={min} max={max} step={max - min > 200 ? 10 : 5} value={amount}
              onChange={(e) => setAmount(+e.target.value)}
              aria-valuetext={`${fmt.money.format(amount)}, ${fmt.num.format(minutes)} minutes`}
              style={{ background: `linear-gradient(to right, var(--accent) ${fill}%, var(--scale-track) ${fill}%)` }}
              className="h-2 w-full cursor-pointer appearance-none rounded-full accent-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-[var(--focus-ring)]
                [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--accent)] [&::-webkit-slider-thumb]:bg-[var(--surface)]"
            />
            <div aria-hidden="true" className="absolute inset-x-3.5 bottom-0 h-[18px]">
              {tiers.map((t) => (
                <span key={t} style={{ left: `${((t - min) / (max - min)) * 100}%` }} className="absolute -translate-x-1/2 whitespace-nowrap font-mono text-[11px] tabular-nums text-[var(--text-muted)]">{fmt.money.format(t)}</span>
              ))}
            </div>
          </div>

          <div role="group" aria-label="Montants rapides" className="grid grid-cols-[repeat(auto-fit,minmax(68px,1fr))] gap-2">
            {tiers.map((t, i) => (
              <button key={t} type="button" aria-pressed={amount === t} onClick={() => setAmount(t)}
                className={`grid min-h-[52px] justify-items-center gap-0.5 rounded-[var(--radius-ctl)] border px-1 py-1.5 text-[15px] font-semibold tabular-nums transition active:scale-[.96] motion-reduce:transition-none
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]
                  ${amount === t ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]' : 'border-[var(--border-control)] bg-[var(--surface)] text-[var(--text-strong)] [@media(hover:hover)]:hover:bg-[var(--state-hover)]'}`}>
                {fmt.money.format(t)}
                <small className={`text-[11px] font-medium ${bonus[i] ? 'text-[var(--tint-green-fg)]' : 'text-[var(--text-muted)]'}`}>{bonus[i] ? `+${bonus[i]} %` : '—'}</small>
              </button>
            ))}
          </div>

          <dl className="m-0 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
            {[
              ['Minutes incluses', `${fmt.num.format(minutes)} min`],
              ['Prix effectif', `${fmt.money3.format(amount / minutes)}/min`],
              ['Soit environ', `${fmt.num.format(Math.floor(minutes / 3))} appels de 3 min`],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[1fr_auto] items-baseline gap-1 bg-[var(--raised)] px-3 py-3.5 sm:grid-cols-1">
                <dt className="text-xs text-[var(--text-muted)]">{k}</dt>
                <dd className="m-0 font-semibold tabular-nums text-[var(--text-strong)]">{v}</dd>
              </div>
            ))}
          </dl>

          <button type="button" onClick={() => onRecharge && onRecharge({ amount, currency })}
            className="group inline-flex h-[52px] items-center justify-center gap-2 rounded-[var(--radius-ctl)] bg-[var(--accent)] px-5 text-base font-semibold text-[var(--accent-fg)] transition active:scale-[.98] [@media(hover:hover)]:hover:bg-[var(--accent-hover)]
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] motion-reduce:transition-none">
            {cta} <span className="tabular-nums">{fmt.money.format(amount)}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform group-hover:translate-x-[3px] motion-reduce:transition-none"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
          <p className="-mt-2 mb-0 text-balance text-center text-[13px] leading-normal text-[var(--text-muted)]">
            Tarif de base <b className="font-semibold text-[var(--text-strong)]">{fmt.money3.format(rate)}</b> la minute · crédits valables 12 mois · facture à chaque recharge.
          </p>
        </div>
      </div>
    </section>
  );
}

// Exemple
export function Exemple() {
  return <RechargeSlider currency="EUR" rate={0.09} tiers={[10, 25, 50, 100]} bonus={[0, 5, 10, 20]} cta="Recharger" />;
}
