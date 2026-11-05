// Pricing par recharge · calculateur d'usage — React + Tailwind CSS. Couleurs : variables de tokens.css. Chiffres fictifs.
import { useId, useMemo, useState } from 'react';

const range = 'h-11 w-full cursor-pointer appearance-none bg-transparent focus-visible:outline-none ' +
  '[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,var(--accent)_var(--fill),var(--scale-track)_var(--fill))] ' +
  '[&::-webkit-slider-thumb]:-mt-[9px] [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--accent)] [&::-webkit-slider-thumb]:bg-[var(--surface)] ' +
  'focus-visible:[&::-webkit-slider-thumb]:outline focus-visible:[&::-webkit-slider-thumb]:outline-2 focus-visible:[&::-webkit-slider-thumb]:outline-offset-2 focus-visible:[&::-webkit-slider-thumb]:outline-[var(--focus-ring)]';

export function RechargeCalculator({
  title = 'Combien vont coûter vos appels ?',
  cta = 'Recharger',
  currency = 'EUR',
  rate = 0.09,
  tiers = [10, 25, 50, 100, 250],
  bonus = [0, 5, 10, 15, 25],
  defaultCalls = 40,
  defaultDuration = 3,
  defaultDays = 22,
  onRecharge,
}) {
  const id = useId();
  const [calls, setCalls] = useState(defaultCalls);
  const [dur, setDur] = useState(defaultDuration);
  const [days, setDays] = useState(defaultDays);
  const f = useMemo(() => ({
    money: new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }),
    money3: new Intl.NumberFormat('fr-FR', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 3 }),
    num: new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }),
    int: new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }),
  }), [currency]);

  const rows = tiers.map((t, i) => { const b = bonus[i] || 0; const m = Math.floor((t * (1 + b / 100)) / rate); return { t, b, m, eff: t / m }; });
  const perDay = calls * dur;
  const need = perDay * days;
  let reco = rows.find((r) => r.m >= need);
  let times = 1;
  if (!reco) { reco = rows[rows.length - 1]; times = Math.ceil(need / reco.m); }
  const cover = Math.min(1, (reco.m * times) / need);
  const coverDays = Math.floor((reco.m * times) / perDay);
  const recoLabel = `${times > 1 ? `${times} × ` : ''}${f.money.format(reco.t)}`;
  const pct = (v, min, max) => ({ '--fill': `${((v - min) / (max - min)) * 100}%` });

  return (
    <section aria-labelledby={`${id}-t`} className="bg-[var(--bg)] px-4 pb-[72px] pt-14 font-[var(--font-sans)] text-[var(--text)]">
      <div className="mx-auto grid max-w-[960px] gap-7">
        <header className="grid justify-items-center gap-3 text-center">
          <p className="m-0 font-mono text-xs uppercase tracking-[.04em] text-[var(--text-muted)]">Estimez avant de recharger</p>
          <h2 id={`${id}-t`} className="m-0 text-balance text-[clamp(1.75rem,1.3rem+2vw,2.5rem)] font-semibold leading-[1.12] tracking-[-.02em] text-[var(--text-strong)]">{title}</h2>
          <p className="m-0 max-w-[50ch] text-[17px] leading-relaxed text-[var(--text-muted)]">Réglez votre volume : nous calculons la recharge qui couvre votre mois au meilleur prix à la minute.</p>
        </header>

        <div className="grid overflow-hidden rounded-[var(--radius-sheet)] border border-[var(--border)] bg-[var(--surface)] min-[860px]:grid-cols-2">
          <div className="grid content-start gap-6 px-5 py-6 min-[860px]:p-8">
            <div className="grid gap-2">
              <div className="flex items-baseline justify-between gap-3"><label htmlFor={`${id}-c`} className="text-sm font-medium text-[var(--text-strong)]">Appels par jour</label><output htmlFor={`${id}-c`} className="text-xl font-semibold tabular-nums text-[var(--text-strong)]">{f.int.format(calls)}</output></div>
              <input id={`${id}-c`} type="range" min="1" max="300" value={calls} onChange={(e) => setCalls(+e.target.value)} style={pct(calls, 1, 300)} className={range} />
            </div>
            <div className="grid gap-2">
              <div className="flex items-baseline justify-between gap-3"><label htmlFor={`${id}-d`} className="text-sm font-medium text-[var(--text-strong)]">Durée moyenne d’un appel</label><output htmlFor={`${id}-d`} className="text-xl font-semibold tabular-nums text-[var(--text-strong)]">{f.num.format(dur)} min</output></div>
              <input id={`${id}-d`} type="range" min="0.5" max="10" step="0.5" value={dur} onChange={(e) => setDur(+e.target.value)} style={pct(dur, 0.5, 10)} className={range} />
            </div>
            <div className="grid gap-2">
              <span id={`${id}-j`} className="text-sm font-medium text-[var(--text-strong)]">Jours d’activité par mois</span>
              <div role="radiogroup" aria-labelledby={`${id}-j`} className="grid grid-cols-2 gap-0.5 rounded-[var(--radius-ctl)] border border-[var(--border)] bg-[var(--raised)] p-[3px]"
                onKeyDown={(e) => { if (e.key.startsWith('Arrow')) { e.preventDefault(); setDays(days === 22 ? 30 : 22); } }}>
                {[[22, 'Jours ouvrés · 22'], [30, 'Tous les jours · 30']].map(([v, l]) => (
                  <button key={v} type="button" role="radio" aria-checked={days === v} tabIndex={days === v ? 0 : -1} onClick={() => setDays(v)}
                    className={`min-h-11 rounded-md px-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--focus-ring)] ${days === v ? 'bg-[var(--surface)] text-[var(--text-strong)] shadow-sm' : 'text-[var(--text-muted)]'}`}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          <div aria-live="polite" className="grid content-start gap-5 border-t border-[var(--border)] bg-[var(--raised)] px-5 py-6 min-[860px]:border-l min-[860px]:border-t-0 min-[860px]:p-8">
            <div className="grid grid-cols-2 gap-3">
              {[['Minutes par mois', f.int.format(need)], ['Coût mensuel estimé', f.money.format(Math.ceil(need * reco.eff))]].map(([k, v]) => (
                <div key={k} className="grid gap-1"><span className="text-[13px] text-[var(--text-muted)]">{k}</span><b className="text-[clamp(1.625rem,1.4rem+1vw,2rem)] font-semibold leading-tight tracking-[-.02em] tabular-nums text-[var(--text-strong)]">{v}</b></div>
              ))}
            </div>
            <div className="grid gap-2 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4">
              <span className="text-sm font-medium text-[var(--text-strong)]">Recharge conseillée</span>
              <p className="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <b className="text-4xl font-semibold leading-none tracking-[-.03em] tabular-nums text-[var(--accent)]">{recoLabel}</b>
                <span className="text-[13px] tabular-nums text-[var(--text-muted)]">{reco.b ? `+${reco.b} % offerts · ` : ''}{f.money3.format(reco.eff)}/min</span>
              </p>
              <div role="img" aria-label={`Crédits : ${Math.round(cover * 100)} % du mois couvert`} className="relative mt-1 h-3 overflow-hidden rounded-full bg-[var(--scale-track)]">
                <span className="absolute inset-0 origin-left rounded-full bg-[var(--accent-vivid)] transition-transform duration-[260ms] motion-reduce:transition-none" style={{ transform: `scaleX(${cover})` }} />
                {[25, 50, 75].map((x) => <span key={x} className="absolute inset-y-0 -ml-px w-0.5 bg-[var(--surface)]" style={{ left: `${x}%` }} />)}
              </div>
              <p className="m-0 text-[13px] tabular-nums text-[var(--text-muted)]">
                {coverDays >= days ? `Couvre tout le mois · ${f.int.format(reco.m * times - need)} min de marge` : `Couvre ${coverDays} jours sur ${days}`}
              </p>
            </div>
            <button type="button" onClick={() => onRecharge && onRecharge({ amount: reco.t * times, currency })}
              className="h-[52px] rounded-[var(--radius-ctl)] bg-[var(--accent)] text-base font-semibold text-[var(--accent-fg)] transition active:scale-[.98] [@media(hover:hover)]:hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] motion-reduce:transition-none">
              {cta} <span className="tabular-nums">{recoLabel}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] [touch-action:pan-x_pan-y]">
          <table className="w-full min-w-[520px] border-collapse text-sm tabular-nums">
            <caption className="border-b border-[var(--border)] px-4 py-3.5 text-left font-semibold text-[var(--text-strong)]">Plus la recharge est grande, plus la minute baisse</caption>
            <thead><tr className="bg-[var(--raised)] text-xs text-[var(--text-muted)]">
              {['Recharge', 'Bonus', 'Minutes', 'Prix / min', 'Couvre'].map((h, i) => <th key={h} scope="col" className={`h-10 px-4 font-medium ${i > 1 ? 'text-right' : 'text-left'}`}>{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.map((r) => {
                const on = r === reco;
                return (
                  <tr key={r.t} aria-current={on || undefined} className={`border-t border-[var(--border)] ${on ? 'bg-[var(--accent-subtle)]' : ''}`}>
                    <td className={`h-12 whitespace-nowrap px-4 font-semibold ${on ? 'text-[var(--accent)]' : 'text-[var(--text-strong)]'}`}>{f.money.format(r.t)}{on && <span className="ml-2 inline-flex h-5 items-center rounded-full bg-[var(--accent)] px-[7px] align-[1px] text-[11px] font-medium text-[var(--accent-fg)]">Conseillée</span>}</td>
                    <td className="px-4">{r.b ? <span className="font-medium text-[var(--tint-green-fg)]">+{r.b} %</span> : '—'}</td>
                    <td className="px-4 text-right">{f.int.format(r.m)}</td>
                    <td className="px-4 text-right">{f.money3.format(r.eff)}</td>
                    <td className="px-4 text-right">{f.int.format(Math.floor(r.m / perDay))} j</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// Exemple
export function Exemple() {
  return <RechargeCalculator currency="EUR" rate={0.09} tiers={[10, 25, 50, 100, 250]} bonus={[0, 5, 10, 15, 25]} cta="Recharger" />;
}
