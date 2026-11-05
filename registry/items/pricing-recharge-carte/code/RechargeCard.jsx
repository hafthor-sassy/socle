// Pricing par recharge · carte éditoriale — React + Tailwind CSS. Couleurs : variables de tokens.css. Chiffres fictifs.
import { useId, useMemo, useRef, useState } from 'react';

const INCLUS = [
  'Numéro dédié et appels entrants inclus',
  'Transcription et enregistrement de chaque appel',
  'Facturation à la seconde après la première minute',
  'Sans abonnement, crédits valables 12 mois',
];

/* Groupe radio : une seule tabulation, flèches pour changer */
function Segmented({ label, values, value, onChange, render, small = false }) {
  const id = useId();
  const ref = useRef(null);
  const move = (e) => {
    const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!k) return;
    e.preventDefault();
    const n = values[(values.indexOf(value) + k + values.length) % values.length];
    onChange(n);
    requestAnimationFrame(() => ref.current.querySelector(`[data-v="${n}"]`).focus());
  };
  return (
    <div className="grid gap-2">
      <span id={id} className="text-sm font-medium text-[var(--text-strong)]">{label}</span>
      <div ref={ref} role="radiogroup" aria-labelledby={id} onKeyDown={move}
        className="grid auto-cols-fr grid-flow-col gap-0.5 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-[3px]">
        {values.map((v, i) => (
          <button key={v} data-v={v} type="button" role="radio" aria-checked={v === value} tabIndex={v === value ? 0 : -1} onClick={() => onChange(v)}
            className={`grid content-center justify-items-center gap-px rounded-[9px] px-0.5 py-1 font-semibold tabular-nums transition active:scale-[.96] motion-reduce:transition-none
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--focus-ring)]
              ${small ? 'min-h-11 text-sm' : 'min-h-[52px] text-base'}
              ${v === value ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : 'text-[var(--text-muted)] [@media(hover:hover)]:hover:bg-[var(--state-hover)] [@media(hover:hover)]:hover:text-[var(--text-strong)]'}`}>
            {render(v, i, v === value)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function RechargeCard({
  title = 'Une minute, un prix.',
  cta = 'Recharger',
  currency = 'EUR',
  rate = 0.09,
  tiers = [10, 25, 50, 100],
  bonus = [0, 5, 10, 20],
  autoDefault = true,
  thresholds = [5, 10, 20],
  onRecharge,
}) {
  const id = useId();
  const [amount, setAmount] = useState(tiers[Math.min(2, tiers.length - 1)]);
  const [auto, setAuto] = useState(autoDefault);
  const [thr, setThr] = useState(thresholds[1] ?? thresholds[0]);
  const f = useMemo(() => ({
    money: new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }),
    money2: new Intl.NumberFormat('fr-FR', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 3 }),
    num: new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }),
  }), [currency]);
  const b = bonus[tiers.indexOf(amount)] || 0;
  const minutes = Math.floor((amount * (1 + b / 100)) / rate);
  const firstBonus = tiers.find((t, i) => bonus[i] > 0);

  return (
    <section aria-labelledby={`${id}-t`} className="bg-[var(--bg)] px-4 pb-16 pt-12 font-[var(--font-sans)] text-[var(--text)]">
      <div className="mx-auto grid max-w-[1040px] overflow-hidden rounded-[var(--radius-sheet)] border border-[var(--border)] bg-[var(--surface)] min-[880px]:grid-cols-[1.1fr_1fr]">
        <div className="grid content-start gap-4 px-5 py-7 min-[880px]:p-12">
          <p className="m-0 font-mono text-xs uppercase tracking-[.04em] text-[var(--text-muted)]">Tarif unique · prépayé</p>
          <h2 id={`${id}-t`} className="m-0 text-[clamp(1.375rem,1.2rem+.8vw,1.75rem)] font-semibold leading-tight tracking-[-.015em] text-[var(--text-strong)]">{title}</h2>
          <p className="mt-2 flex items-end gap-3">
            <b className="text-[clamp(4rem,2.6rem+6vw,7rem)] font-semibold leading-[.9] tracking-[-.05em] tabular-nums text-[var(--text-strong)]">{f.money2.format(rate)}</b>
            <span className="pb-[.5em] text-[15px] leading-snug text-[var(--text-muted)]">par minute<br />d’appel</span>
          </p>
          <p className="m-0 text-sm tabular-nums text-[var(--tint-green-fg)]">
            {b ? `${f.money2.format(amount / minutes)} la minute avec le bonus de cette recharge` : `Bonus de minutes dès ${f.money.format(firstBonus || amount)}`}
          </p>
          <ul className="mt-3 grid list-none gap-2.5 border-t border-[var(--border)] p-0 pt-4">
            {INCLUS.map((x) => (
              <li key={x} className="flex gap-2.5 text-[15px] leading-snug">
                <span aria-hidden="true" className="mt-0.5 grid h-[18px] w-[18px] flex-none place-items-center rounded-full border border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)] text-[var(--accent)]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                </span>{x}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid content-start gap-5 border-t border-[var(--border)] bg-[var(--raised)] px-5 pb-7 pt-6 min-[880px]:border-l min-[880px]:border-t-0 min-[880px]:p-10">
          <Segmented label="Montant de la recharge" values={tiers} value={amount} onChange={setAmount}
            render={(v, i, on) => (<>{f.money.format(v)}<small className={`min-h-[13px] text-[11px] font-medium ${on ? 'text-[var(--accent-fg)]' : 'text-[var(--tint-green-fg)]'}`}>{bonus[i] ? `+${bonus[i]} %` : ''}</small></>)} />

          <div aria-live="polite" className="grid gap-1 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="m-0 flex items-baseline gap-2 text-[15px] text-[var(--text-muted)]">≈ <b className="text-[2rem] font-semibold leading-tight tracking-[-.02em] tabular-nums text-[var(--text-strong)]">{f.num.format(Math.floor(minutes / 3))}</b> appels de 3 min</p>
            <p className="m-0 flex flex-wrap items-center gap-2 text-sm tabular-nums text-[var(--text-muted)]">{f.num.format(minutes)} minutes
              {b > 0 && <span className="inline-flex h-[22px] items-center rounded-full border border-[var(--tint-green-border)] bg-[var(--tint-green-bg)] px-2 text-xs font-medium text-[var(--tint-green-fg)]">+{b} % offerts</span>}
            </p>
          </div>

          <div className="grid gap-3 pt-1">
            <div className="flex items-center justify-between gap-4">
              <span id={`${id}-a`} className="grid gap-0.5 text-[13px] text-[var(--text-muted)]"><b className="text-[15px] font-medium text-[var(--text-strong)]">Recharge automatique</b>Rechargé quand le solde passe sous le seuil.</span>
              <button type="button" role="switch" aria-checked={auto} aria-labelledby={`${id}-a`} onClick={() => setAuto(!auto)}
                className={`relative h-[26px] w-11 flex-none rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] ${auto ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-[var(--border-control)] bg-[var(--scale-track)]'}`}>
                <span className={`absolute left-[3px] top-[3px] h-[18px] w-[18px] rounded-full shadow transition-transform duration-200 ease-[cubic-bezier(.34,1.56,.64,1)] motion-reduce:transition-none ${auto ? 'translate-x-[18px] bg-[var(--accent-fg)]' : 'bg-[var(--surface)]'}`} />
              </button>
            </div>
            {auto && <Segmented small label="Seuil" values={thresholds} value={thr} onChange={setThr} render={(v) => `Sous ${f.money.format(v)}`} />}
          </div>

          <button type="button" onClick={() => onRecharge && onRecharge({ amount, currency, auto, threshold: auto ? thr : null })}
            className="h-[52px] rounded-[var(--radius-ctl)] bg-[var(--accent)] text-base font-semibold text-[var(--accent-fg)] transition active:scale-[.98] [@media(hover:hover)]:hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] motion-reduce:transition-none">
            {cta} <span className="tabular-nums">{f.money.format(amount)}{auto ? ' · auto' : ''}</span>
          </button>
          <p className="-mt-2 mb-0 text-balance text-center text-xs leading-normal text-[var(--text-muted)]">Paiement sécurisé · facture immédiate · remboursement du solde non utilisé sur demande.</p>
        </div>
      </div>
    </section>
  );
}

// Exemple
export function Exemple() {
  return <RechargeCard currency="EUR" rate={0.09} tiers={[10, 25, 50, 100]} bonus={[0, 5, 10, 20]} autoDefault={true} cta="Recharger" />;
}
