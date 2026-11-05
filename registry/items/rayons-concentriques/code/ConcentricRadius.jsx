// Rayons concentriques — React + Tailwind CSS. Couleurs : variables de tokens.css.
// La règle : rayon intérieur = max(rayon extérieur − marge, 0). <Nested> l'applique à n'importe quelle imbrication.
import { createContext, useContext } from 'react';

const Ctx = createContext({ radius: 24, padding: 8, mode: 'concentric' });

/** Surface imbriquée : lit le rayon de son parent et retire la marge. */
export function Nested({ as: Tag = 'div', className = '', style, children, ...rest }) {
  const parent = useContext(Ctx);
  const radius = parent.mode === 'same' ? parent.radius : Math.max(parent.radius - parent.padding, 0);
  return (
    <Ctx.Provider value={{ ...parent, radius }}>
      <Tag className={`transition-[border-radius,padding] duration-[420ms] [transition-timing-function:cubic-bezier(.34,1.3,.64,1)] motion-reduce:transition-none ${className}`}
        style={{ borderRadius: radius, ...style }} {...rest}>
        {children}
      </Tag>
    </Ctx.Provider>
  );
}

/** Racine : fixe le rayon extérieur et la marge commune à tous les niveaux. */
export function ConcentricRoot({ radius = 24, padding = 8, mode = 'concentric', className = '', children }) {
  return (
    <Ctx.Provider value={{ radius, padding, mode }}>
      <div className={`transition-[border-radius,padding] duration-[420ms] motion-reduce:transition-none ${className}`} style={{ borderRadius: radius, padding }}>
        {children}
      </div>
    </Ctx.Provider>
  );
}

export function NacreBalanceCard({ radius = 24, padding = 8, mode = 'concentric' }) {
  return (
    <ConcentricRoot radius={radius} padding={padding} mode={mode}
      className="w-full max-w-[440px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow-popover)]">
      <header className="flex items-center justify-between px-3 pb-4 pt-3">
        <span className="inline-flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em] text-[var(--text-strong)]">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
            <path d="M12 3.5c4.7 0 8.5 3.8 8.5 8.5s-3.8 8.5-8.5 8.5S3.5 16.7 3.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12 7.25a4.75 4.75 0 1 1-4.75 4.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="12" r="1.75" fill="var(--accent)" />
          </svg>
          Nacre
        </span>
        <span className="rounded-full bg-[var(--accent-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--text-strong)]">Compte joint</span>
      </header>
      <Nested className="bg-[var(--raised)]" style={{ padding: `${padding + 12}px ${padding + 12}px ${padding}px` }}>
        <p className="m-0 text-sm font-medium text-[var(--text-muted)]">Solde disponible</p>
        <p className="m-0 mt-1 text-[clamp(2.25rem,8cqi,2.5rem)] font-semibold leading-[1.2] tracking-[-0.03em] tabular-nums text-[var(--text-strong)]">4 218,60 €</p>
        <p className="mb-5 mt-1 inline-flex items-center gap-1 text-sm font-medium text-[var(--up)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg>
          + 312,00 € ce mois-ci
        </p>
        <div className="grid grid-cols-2" style={{ gap: padding }}>
          <Nested as="button" type="button" className="min-h-12 bg-[var(--accent)] text-base font-medium text-[var(--accent-fg)] active:scale-[.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]">Virer</Nested>
          <Nested as="button" type="button" className="min-h-12 border border-[var(--border)] bg-[var(--surface)] text-base font-medium text-[var(--text-strong)] active:scale-[.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]">Recevoir</Nested>
        </div>
      </Nested>
    </ConcentricRoot>
  );
}

/** Démo complète : carte + légende des rayons + verdict. */
export function ConcentricRadius({ radius = 24, padding = 8, mode = 'concentric' }) {
  const r2 = mode === 'same' ? radius : Math.max(radius - padding, 0);
  const r3 = mode === 'same' ? radius : Math.max(r2 - padding, 0);
  const corner = ((padding + (r2 - radius) * (1 - Math.SQRT1_2)) * Math.SQRT2).toFixed(1).replace('.', ',');
  const warn = mode === 'same' || radius - 2 * padding <= 0;
  const rows = [['Panneau', 'var(--text-strong)', radius], ['Carte', 'var(--accent)', r2], ['Boutons', 'var(--text-muted)', r3]];
  return (
    <section className="grid overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] md:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid place-items-center bg-[var(--raised)] px-4 py-8 md:px-8 md:py-12">
        <NacreBalanceCard radius={radius} padding={padding} mode={mode} />
      </div>
      <aside className="grid content-start gap-4 border-t border-[var(--border)] p-4 md:border-l md:border-t-0 md:p-6">
        <h3 className="m-0 text-base font-semibold text-[var(--text-strong)]">Rayons concentriques</h3>
        <dl className="m-0 grid gap-2">
          {rows.map(([k, c, v]) => (
            <div key={k} className="flex items-center justify-between gap-2">
              <dt className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text)]"><i className="h-[3px] w-3 rounded-sm" style={{ background: c }} />{k}</dt>
              <dd className="m-0 font-mono text-[13px] tabular-nums text-[var(--text-strong)]">{v}&nbsp;px</dd>
            </div>
          ))}
        </dl>
        <p role="status" className={`m-0 rounded-lg border p-3 text-sm font-medium ${warn ? 'border-[var(--tint-amber-border)] bg-[var(--tint-amber-bg)] text-[var(--tint-amber-fg)]' : 'border-[var(--tint-green-border)] bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]'}`}>
          {mode === 'same'
            ? `Même rayon partout : la marge passe de ${padding}\u00a0px sur les bords à ${corner}\u00a0px dans le coin.`
            : radius - 2 * padding <= 0
              ? 'La marge dépasse la moitié du rayon : les boutons perdent leur arrondi.'
              : `Coins concentriques : la marge reste à ${padding}\u00a0px tout autour, coin compris.`}
        </p>
      </aside>
    </section>
  );
}

export default ConcentricRadius;
