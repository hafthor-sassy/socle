// Bento 5 cases — React + Tailwind CSS. Couleurs : variables de tokens.css.
const cell =
  'flex min-w-0 flex-col justify-between gap-6 border border-[var(--border)] bg-[var(--surface)] p-6 md:p-7 ' +
  'transition-colors duration-[var(--motion-fast)] [@media(hover:hover)]:hover:border-[var(--border-control)] motion-reduce:transition-none';

function Text({ title, children }) {
  return (
    <div className="grid max-w-[34rem] gap-1.5">
      <h3 className="text-lg font-semibold leading-snug tracking-[-0.01em] text-[var(--text-strong)]">{title}</h3>
      <p className="text-pretty text-[15px] leading-normal text-[var(--text-muted)]">{children}</p>
    </div>
  );
}

const ROWS = [
  ['46%', 'Aujourd’hui'],
  ['62%', 'En cours', true],
  ['38%', 'Demain'],
  ['54%', 'Lundi'],
];

export function Bento({ gap = 16, radius = 12, showHeader = true, visuals = true }) {
  const r = { borderRadius: radius };
  return (
    <section aria-labelledby="bento-title" className="mx-auto max-w-[1120px] px-4 py-16 text-[var(--text)] md:px-8 md:py-24">
      {showHeader && (
        <header className="mb-8 grid max-w-[40rem] gap-3">
          <h2 id="bento-title" className="text-balance text-[clamp(1.75rem,1.3rem+2vw,2.5rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-[var(--text-strong)]">
            Tout ce qu’il faut, rien de trop
          </h2>
          <p className="text-[1.0625rem] leading-relaxed text-[var(--text-muted)]">Cinq raisons de travailler plus sereinement, réunies dans un seul espace.</p>
        </header>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 lg:grid-rows-[minmax(240px,auto)_minmax(240px,auto)_auto]" style={{ gap }}>
        <article className={`${cell} sm:col-span-2 lg:col-[1/4] lg:row-[1/3]`} style={r}>
          <Text title="Tout votre travail au même endroit">Projets, fichiers et décisions réunis dans une seule vue, à jour pour toute l’équipe.</Text>
          {visuals && (
            <div aria-hidden="true" className="grid gap-2 border border-[var(--border)] bg-[var(--raised)] p-3" style={{ borderRadius: Math.max(radius - 4, 4) }}>
              {ROWS.map(([w, label, active]) => (
                <div key={label} className={`grid h-11 grid-cols-[16px_1fr_auto] items-center gap-3 rounded-lg border px-3 ${active ? 'border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)]' : 'border-[var(--border)] bg-[var(--surface)]'}`}>
                  <i className={`h-4 w-4 rounded border-[1.5px] ${active ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-[var(--border-control)]'}`} />
                  <b className={`block h-2 rounded ${active ? 'bg-[var(--accent-subtle-border)]' : 'bg-[var(--tint-neutral-bg)]'}`} style={{ width: w }} />
                  <span className={`text-xs tabular-nums ${active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className={`${cell} sm:col-span-2 lg:col-[4/7] lg:row-[1]`} style={r}>
          <Text title="Recherche instantanée">Retrouvez n’importe quel élément en quelques lettres.</Text>
          {visuals && (
            <div aria-hidden="true" className="flex h-12 items-center gap-2.5 rounded-[var(--radius-ctl)] border border-[var(--border-control)] bg-[var(--surface)] pl-3.5 pr-2 text-[15px] text-[var(--text-muted)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
              <span className="flex-1 truncate text-[var(--text-strong)]">Rapport trimestriel</span>
              <kbd className="inline-flex h-6 items-center rounded-md border border-[var(--border)] bg-[var(--raised)] px-2 font-mono text-xs">⌘K</kbd>
            </div>
          )}
        </article>

        <article className={`${cell} lg:col-[4/6] lg:row-[2]`} style={r}>
          <Text title="Partage en un clic">Invitez qui vous voulez, avec les bons droits.</Text>
          {visuals && (
            <div aria-hidden="true" className="flex">
              {['AL', 'MK', 'JD', '+4'].map((a, i) => (
                <span key={a} className={`grid h-11 w-11 place-items-center rounded-full border-2 border-[var(--surface)] bg-[var(--raised)] text-[13px] font-semibold text-[var(--text-strong)] ring-1 ring-[var(--border)] ${i ? '-ml-2' : ''}`}>{a}</span>
              ))}
            </div>
          )}
        </article>

        <article className={`${cell} lg:col-[6/7] lg:row-[2]`} style={r}>
          <p className="whitespace-nowrap text-[clamp(2.25rem,1.8rem+2vw,3rem)] font-semibold leading-none tracking-[-0.03em] tabular-nums text-[var(--text-strong)]">99,9&nbsp;%</p>
          <Text title="Disponibilité">Mesurée sur les douze derniers mois.</Text>
        </article>

        <article className={`${cell} sm:col-span-2 lg:col-[1/7] lg:row-[3] lg:flex-row lg:items-center`} style={r}>
          <Text title="Branché sur vos outils">Agenda, messagerie, stockage : les intégrations se configurent en deux minutes.</Text>
          {visuals && (
            <div aria-hidden="true" className="flex flex-wrap gap-2">
              {['Ag', 'Ms', 'St', 'Fx', 'Cr', '+12'].map((t) => (
                <span key={t} className="grid h-12 w-12 place-items-center rounded-[10px] border border-[var(--border)] bg-[var(--raised)] text-[13px] font-semibold text-[var(--text-strong)]">{t}</span>
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

// Exemple
export function Exemple() {
  return <Bento gap={16} radius={12} showHeader={true} visuals={true} />;
}
