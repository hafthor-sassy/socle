// Logo en situation — React + Tailwind CSS. Couleurs : variables de tokens.css.
// Passez votre icône dans `mark` (contenu SVG 32 × 32 en currentColor) : toutes les maquettes suivent.
import { useEffect, useState } from 'react';

const STRATA = (
  <>
    <path d="M7.18 13.2a9 9 0 0 1 17.64 0z" />
    <path d="M7 14.8h18v4.8H7z" />
    <path d="M7 21.2h6.4V26H7zM18.6 21.2H25V26h-6.4z" />
  </>
);

const TILES = {
  accent: 'bg-[var(--accent)] text-[var(--accent-fg)]',
  ink: 'bg-[var(--text-strong)] text-[var(--surface)]',
  light: 'bg-[var(--surface)] text-[var(--accent)]',
};

const slug = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'marque';

function Mark({ mark, className = '' }) {
  return <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" className={className}>{mark}</svg>;
}

function Tile({ mark, tile, size, radius, className = '' }) {
  return (
    <span className={`inline-grid flex-none place-items-center shadow-[inset_0_0_0_1px_var(--border)] ${TILES[tile]} ${className}`}
      style={{ width: size, height: size, borderRadius: radius }}>
      <Mark mark={mark} className="h-[62%] w-[62%]" />
    </span>
  );
}

function Cell({ title, meta, className = '', children }) {
  return (
    <figure className={`m-0 grid min-w-0 grid-rows-[1fr_auto] gap-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-3 md:rounded-[16px] md:p-4 ${className}`}>
      {children}
      <figcaption className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--text-muted)]">
        <b className="font-medium text-[var(--text-strong)]">{title}</b>{meta}
      </figcaption>
    </figure>
  );
}

export function LogoInSitu({ name = 'Strata', mark = STRATA, tile = 'accent', avatar = 'circle', appRadius = 22.5, flipped: flippedProp = false }) {
  const [flipped, setFlipped] = useState(flippedProp);
  useEffect(() => setFlipped(flippedProp), [flippedProp]);
  const s = slug(name);
  const tileCls = TILES[tile] || TILES.accent;
  return (
    <section className="mx-auto w-full max-w-[1040px] font-sans text-[var(--text)]">
      <header className="mb-6">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.04em] text-[var(--text-muted)]">Logo en situation</p>
        <h2 className="m-0 max-w-[18ch] text-[length:var(--t-page)] font-semibold leading-tight tracking-tight text-[var(--text-strong)]">{name}, posé partout où il vivra.</h2>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Cell title="Favicon" className="md:col-span-2" meta={
          <span className="inline-flex items-end gap-4">
            {[16, 32, 48].map((z) => (
              <span key={z} className="inline-grid justify-items-center gap-1">
                <Tile mark={mark} tile={tile} size={z} radius={z * 0.22} />
                <em className="font-mono text-[11px] not-italic">{z}</em>
              </span>
            ))}
          </span>}>
          <div aria-hidden="true" className="overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--bg)]">
            <div className="flex items-end gap-1 bg-[var(--raised)] px-2 pt-2">
              <span className="flex h-9 min-w-0 items-center gap-2 rounded-t-lg bg-[var(--surface)] px-3 text-[13px] text-[var(--text-strong)]">
                <Tile mark={mark} tile={tile} size={16} radius={4} />
                <span className="truncate">{name} — Studio d’architecture</span>
              </span>
            </div>
            <div className="border-b border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-[13px] text-[var(--text-muted)]">
              <span className="block truncate rounded-full bg-[var(--raised)] px-3 py-0.5">{s}-studio.fr/projets</span>
            </div>
            <div className="grid gap-2.5 p-5">
              <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--text-strong)]"><Mark mark={mark} className="size-5 text-[var(--accent)]" />{name}</span>
              <span className="text-lg font-semibold tracking-tight text-[var(--text-strong)]">Halle Rive Gauche, livraison 2027</span>
              <span className="grid grid-cols-3 gap-2">{[0, 1, 2].map((i) => <i key={i} className="h-12 rounded-lg bg-[var(--raised)]" />)}</span>
            </div>
          </div>
        </Cell>

        <Cell title="Icône d’app" meta={<span>Rayon {String(appRadius).replace('.', ',')} %</span>}>
          <div aria-hidden="true" className="relative grid min-h-[220px] place-items-center rounded-[12px] bg-[var(--raised)] px-4 pb-24 pt-6">
            <span className="grid justify-items-center gap-1.5">
              <Tile mark={mark} tile={tile} size={56} radius={`${appRadius}%`} />
              <span className="text-xs text-[var(--text-strong)]">{name}</span>
            </span>
            <span className="absolute inset-x-3 bottom-3 flex items-center gap-2.5 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm">
              <Tile mark={mark} tile={tile} size={32} radius={`${appRadius}%`} />
              <span className="min-w-0"><b className="block font-semibold text-[var(--text-strong)]">{name}</b><em className="block truncate not-italic text-[var(--text-muted)]">Plans de la phase APS validés par le client.</em></span>
            </span>
          </div>
        </Cell>

        <Cell title="Avatar" meta={<span>{avatar === 'square' ? 'Carré arrondi' : 'Cercle'}</span>}>
          <div className="grid gap-0.5 overflow-hidden rounded-[12px] border border-[var(--border)] px-4 pb-4">
            <div aria-hidden="true" className="-mx-4 h-[72px] bg-[var(--accent-subtle)] bg-[repeating-linear-gradient(-12deg,transparent_0_10px,var(--accent-subtle-border)_10px_11px)]" />
            <span aria-hidden="true" className={`-mt-9 mb-2 grid size-[72px] place-items-center shadow-[0_0_0_4px_var(--surface)] ${tileCls} ${avatar === 'square' ? 'rounded-[16px]' : 'rounded-full'}`}>
              <Mark mark={mark} className="size-[56%]" />
            </span>
            <p className="m-0 font-semibold text-[var(--text-strong)]">{name} Studio</p>
            <p className="m-0 text-sm text-[var(--text-muted)]">@{s}.studio</p>
            <p className="mt-2 text-sm">Architecture et réhabilitation à Bordeaux. Bois, pierre, lumière.</p>
          </div>
        </Cell>

        <Cell title="Carte de visite" className="md:col-span-2" meta={<span>85 × 55 mm · touchez pour retourner</span>}>
          <button type="button" aria-pressed={flipped} aria-label="Retourner la carte de visite" onClick={() => setFlipped(!flipped)}
            className="grid place-items-center rounded-[12px] bg-[var(--raised)] p-4 [perspective:1200px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]">
            <span className="relative block aspect-[85/55] w-full max-w-[400px] transition-transform duration-[900ms] ease-[cubic-bezier(.3,1.3,.4,1)] [transform-style:preserve-3d] motion-reduce:transition-none"
              style={{ transform: flipped ? 'rotateY(180deg)' : 'none' }}>
              <span className={`absolute inset-0 grid place-content-center justify-items-center gap-3 rounded-[10px] shadow-[var(--shadow-popover)] [backface-visibility:hidden] ${tileCls}`}>
                <Mark mark={mark} className="size-16" />
                <b className="text-[28px] font-semibold tracking-[-0.045em]">{name}</b>
              </span>
              <span className="absolute inset-0 grid grid-rows-[auto_1fr_auto] rounded-[10px] bg-[var(--surface)] p-5 text-left shadow-[var(--shadow-popover),inset_0_0_0_1px_var(--border)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--text-strong)]"><Mark mark={mark} className="size-5 text-[var(--accent)]" />{name}</span>
                <span className="grid self-center"><b className="text-[17px] font-semibold text-[var(--text-strong)]">Clémence Arnaud</b><em className="text-sm not-italic text-[var(--text-muted)]">Architecte associée</em></span>
                <span className="font-mono text-xs leading-[18px] text-[var(--text-muted)]">06 41 22 87 30<br />clemence@{s}-studio.fr<br />14 quai des Chartrons, Bordeaux</span>
              </span>
            </span>
          </button>
        </Cell>
      </div>
    </section>
  );
}

export default LogoInSitu;
