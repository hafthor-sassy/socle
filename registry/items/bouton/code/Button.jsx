// Bouton — React + Tailwind CSS. Les couleurs viennent des variables de tokens.css.
import { forwardRef } from 'react';

const base =
  'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-ctl)] border border-transparent font-medium leading-none ' +
  'transition-[background-color,border-color,box-shadow,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)] ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] ' +
  'active:scale-[0.98] disabled:cursor-not-allowed disabled:border-transparent disabled:bg-[var(--raised)] disabled:text-[var(--text-disabled)] disabled:shadow-none disabled:active:scale-100 ' +
  'motion-reduce:transition-none motion-reduce:active:scale-100';

const variants = {
  primary: 'bg-[var(--accent)] text-[var(--accent-fg)] [@media(hover:hover)]:hover:bg-[var(--accent-hover)] active:bg-[var(--accent-hover)]',
  secondary: 'border-[var(--border-control)] bg-[var(--surface)] text-[var(--text-strong)] [@media(hover:hover)]:hover:shadow-[inset_0_0_0_999px_var(--state-hover)] active:shadow-[inset_0_0_0_999px_var(--state-press)]',
  ghost: 'bg-transparent text-[var(--text-strong)] [@media(hover:hover)]:hover:bg-[var(--state-hover)] active:bg-[var(--state-press)]',
  danger: 'bg-[var(--down)] text-[var(--surface)] [@media(hover:hover)]:hover:shadow-[inset_0_0_0_999px_var(--state-press)]',
};

const sizes = {
  sm: 'h-8 px-3 text-[13px] before:absolute before:inset-x-0 before:-inset-y-1.5 before:content-[""]',
  md: 'h-11 px-4 text-sm md:h-10',
  lg: 'h-12 px-5 text-base',
};

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled = false, icon = false, className = '', children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      aria-busy={loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${loading ? 'cursor-progress' : ''} ${className}`}
      {...rest}
    >
      <span className={loading ? 'invisible' : ''}>{children}</span>
      {icon && (
        <svg className={loading ? 'invisible' : ''} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      )}
      {loading && (
        <span aria-hidden="true" className="absolute inset-0 m-auto h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:[animation-duration:1.6s]" />
      )}
    </button>
  );
});

// Exemple
export function Exemple() {
  return (
    <Button variant="primary" size="md" loading={false} disabled={false} icon={true}>
      Continuer
    </Button>
  );
}
