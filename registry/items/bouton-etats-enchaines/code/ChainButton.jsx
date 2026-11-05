// Bouton à états enchaînés — React + Tailwind CSS + framer-motion. Couleurs : variables de tokens.css.
// idle → loading → success | error : la largeur suit chaque libellé (layout sur ressort), l'erreur tremble.
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'framer-motion';

/**
 * @param {object} props
 * @param {() => Promise<unknown>} props.onAction  Action asynchrone : résolue = succès, rejetée = erreur
 * @param {React.ReactNode} [props.children]       Libellé au repos
 * @param {string} [props.loadingLabel]           Annoncé aux lecteurs d'écran pendant le chargement
 * @param {string} [props.successLabel]
 * @param {string} [props.errorLabel]
 * @param {number} [props.resetAfter]             ms avant le retour au repos (0 = reste sur le résultat)
 * @param {number} [props.minLoading]             Durée minimale du chargement, pour que la rotation se lise
 * @param {'pill'|'rounded'} [props.shape]
 * @param {'solid'|'outline'} [props.variant]
 * @param {boolean} [props.block]                 Pleine largeur du parent (hors chargement)
 * @param {{ stiffness: number, damping: number }} [props.spring]
 * @param {boolean} [props.haptic]                Vibration courte sur erreur (mobiles compatibles)
 */
export function ChainButton({
  onAction,
  children = 'Envoyer',
  loadingLabel = 'Envoi en cours',
  successLabel = 'Envoyé',
  errorLabel = 'Échec, réessayer',
  resetAfter = 2600,
  minLoading = 600,
  shape = 'pill',
  variant = 'solid',
  block = false,
  spring = { stiffness: 260, damping: 20 },
  haptic = true,
  className = '',
}) {
  const [status, setStatus] = useState('idle');
  const reduce = useReducedMotion();
  const shake = useAnimationControls();
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const run = async () => {
    if (status === 'loading' || status === 'success') return;
    clearTimeout(timer.current);
    setStatus('loading');
    const t0 = Date.now();
    let next = 'success';
    try { await onAction?.(); } catch { next = 'error'; }
    await new Promise((r) => setTimeout(r, Math.max(0, minLoading - (Date.now() - t0))));
    setStatus(next);
    if (next === 'error') {
      if (!reduce) shake.start({ x: [0, -7, 6, -4, 3, -1.5, 0], transition: { duration: 0.46 } });
      if (haptic) (navigator.userActivation?.hasBeenActive ?? true) && navigator.vibrate?.([12, 40, 12]);
    }
    if (resetAfter > 0) timer.current = setTimeout(() => setStatus('idle'), resetAfter);
  };

  const tones = {
    idle: variant === 'outline'
      ? 'bg-[var(--surface)] text-[var(--text-strong)] border-[var(--border-control)] hover:bg-[var(--raised)]'
      : 'bg-[var(--accent)] text-[var(--accent-fg)] border-transparent hover:bg-[var(--accent-hover)]',
    loading: variant === 'outline'
      ? 'bg-[var(--surface)] text-[var(--text-strong)] border-[var(--border-control)]'
      : 'bg-[var(--accent)] text-[var(--accent-fg)] border-transparent',
    success: 'bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)] border-[var(--tint-green-border)]',
    error: 'bg-[var(--tint-red-bg)] text-[var(--tint-red-fg)] border-[var(--tint-red-border)]',
  };
  const busy = status === 'loading' || status === 'success';
  const springT = reduce ? { duration: 0 } : { type: 'spring', ...spring };
  const radius = status === 'loading' || shape === 'pill' ? 999 : 12;

  return (
    <>
      <motion.button
        type="button"
        layout
        animate={shake}
        onClick={run}
        aria-busy={status === 'loading'}
        aria-disabled={busy}
        transition={{ layout: springT }}
        style={{ borderRadius: radius }}
        className={[
          'relative inline-flex h-[52px] min-w-[52px] items-center justify-center overflow-hidden border',
          'whitespace-nowrap text-[16px] font-[550] tracking-[-0.006em] transition-colors duration-200',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--focus-ring)]',
          'active:scale-[.97] aria-disabled:cursor-default',
          status === 'loading' ? 'w-[52px]' : block ? 'w-full' : '',
          tones[status],
          className,
        ].join(' ')}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={status}
            layout="position"
            initial={reduce ? false : { opacity: 0, y: 10, scale: 0.92, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.92, filter: 'blur(3px)' }}
            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 30, opacity: { duration: 0.2 }, filter: { duration: 0.2, ease: 'easeOut' } }}
            className={['inline-flex items-center gap-2.5', status === 'loading' ? 'px-0' : 'px-6'].join(' ')}
          >
            {status === 'idle' && (<>{children}<Icon d="M5 12h13M13 6l6 6-6 6" /></>)}
            {status === 'loading' && (<><Spinner reduce={reduce} /><span className="sr-only">{loadingLabel}</span></>)}
            {status === 'success' && (<><Check reduce={reduce} />{successLabel}</>)}
            {status === 'error' && (<><Icon d="M12 7.5v5.5M12 16.5v.01" circle />{errorLabel}</>)}
          </motion.span>
        </AnimatePresence>
      </motion.button>
      <p role="status" aria-live="polite" className="sr-only">
        {status === 'loading' ? loadingLabel : status === 'success' ? successLabel : status === 'error' ? `${errorLabel}. Vous pouvez réessayer.` : ''}
      </p>
    </>
  );
}

function Icon({ d, circle = false }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 flex-none fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.9]">
      <path d={d} />{circle && <circle cx="12" cy="12" r="9" />}
    </svg>
  );
}

function Spinner({ reduce }) {
  return (
    <motion.svg viewBox="0 0 24 24" aria-hidden="true" className="size-[22px] fill-none stroke-current [stroke-linecap:round] [stroke-width:2.2]"
      animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: 'linear', duration: reduce ? 2.4 : 0.8 }}>
      <circle cx="12" cy="12" r="9" strokeDasharray="57" strokeDashoffset="34" />
    </motion.svg>
  );
}

function Check({ reduce }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 flex-none fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.9]">
      <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: reduce ? 0 : 0.38, delay: reduce ? 0 : 0.22, ease: [0.65, 0, 0.35, 1] }} />
    </svg>
  );
}

/* Exemple
<ChainButton onAction={() => fetch('/api/virements', { method: 'POST' }).then((r) => { if (!r.ok) throw r; })}
  successLabel="Virement envoyé">Envoyer 240,00 €</ChainButton>
*/
