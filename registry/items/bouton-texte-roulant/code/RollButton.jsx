// Bouton à texte qui roule — React + Tailwind CSS. Couleurs : variables de tokens.css.
// Chaque lettre a deux copies empilées ; au survol elles défilent d'une ligne, en décalé.

const Arrow = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const tones = {
  solid: 'bg-[var(--accent)] text-[var(--accent-fg)] border-transparent',
  outline: 'bg-transparent text-[var(--text-strong)] border-[var(--border-control)] [@media(hover:hover)]:hover:bg-[var(--state-hover)]',
  ink: 'bg-[var(--text-strong)] text-[var(--bg)] border-transparent',
};

export function RollButton({ children = 'Voir les offres', stagger = 18, duration = 520, direction = 'up', variant = 'solid', className = '', ...rest }) {
  const text = String(children);
  const down = direction === 'down';
  const move = down
    ? '-translate-y-[1.25em] group-hover:translate-y-0 group-focus-visible:translate-y-0'
    : 'group-hover:-translate-y-[1.25em] group-focus-visible:-translate-y-[1.25em]';
  return (
    <button
      type="button"
      aria-label={text}
      className={`group inline-flex h-12 items-center gap-2.5 whitespace-nowrap rounded-[var(--radius-ctl)] border pl-[22px] pr-5 text-base font-medium leading-none
        transition-[background-color,scale] duration-200 active:scale-[.97]
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] ${tones[variant]} ${className}`}
      {...rest}
    >
      <span aria-hidden="true" className="inline-flex h-[1.25em] overflow-hidden leading-[1.25em]">
        {Array.from(text).map((ch, i) => (
          <span
            key={i}
            style={{ transitionDuration: `${duration}ms`, transitionDelay: `${i * stagger}ms` }}
            className={`inline-flex ${down ? 'flex-col-reverse' : 'flex-col'} transition-transform ease-[cubic-bezier(.76,0,.24,1)] motion-reduce:transform-none motion-reduce:transition-none ${move}`}
          >
            <span className="block h-[1.25em] whitespace-pre">{ch === ' ' ? '\u00A0' : ch}</span>
            <span className="block h-[1.25em] whitespace-pre">{ch === ' ' ? '\u00A0' : ch}</span>
          </span>
        ))}
      </span>
      <span aria-hidden="true" className="relative inline-grid h-4 w-4 overflow-hidden">
        <Arrow style={{ transitionDuration: `${duration}ms`, transitionDelay: `${Math.max(0, text.length - 4) * stagger}ms` }}
          className="[grid-area:1/1] transition-transform ease-[cubic-bezier(.76,0,.24,1)] group-hover:translate-x-[120%] motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
        <Arrow style={{ transitionDuration: `${duration}ms`, transitionDelay: `${Math.max(0, text.length - 4) * stagger}ms` }}
          className="[grid-area:1/1] -translate-x-[120%] transition-transform ease-[cubic-bezier(.76,0,.24,1)] group-hover:translate-x-0 motion-reduce:hidden" />
      </span>
    </button>
  );
}

// Exemple
export function Exemple() {
  return <RollButton stagger={18} duration={520} direction="up" variant="solid">Voir les offres</RollButton>;
}
