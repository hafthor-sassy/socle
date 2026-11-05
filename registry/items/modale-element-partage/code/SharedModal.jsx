// Modale à élément partagé — React + Tailwind CSS + framer-motion. Couleurs : variables de tokens.css.
// La carte devient la modale : couverture et titre partagent un layoutId, framer-motion corrige les déformations.
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const SPRINGS = {
  doux: { type: 'spring', stiffness: 170, damping: 22 },
  sec: { type: 'spring', stiffness: 300, damping: 35 },
  joueur: { type: 'spring', stiffness: 220, damping: 15 },
};

/**
 * @typedef {object} Course
 * @property {string} id
 * @property {string} tag            ex. « Design · 4 h 20 »
 * @property {string} title
 * @property {string} author
 * @property {React.ReactNode} cover  Illustration (SVG avec preserveAspectRatio="xMidYMid slice")
 * @property {string} description
 * @property {{ label: string, value: string }[]} [stats]
 * @property {{ title: string, duration: string }[]} [chapters]
 *
 * @param {object} props
 * @param {Course[]} props.items
 * @param {'doux'|'sec'|'joueur'} [props.spring]
 * @param {'blur'|'dim'|'none'} [props.scrim]
 * @param {boolean} [props.recede]        Les cartes voisines reculent pendant l'ouverture
 * @param {boolean} [props.dragToClose]   Glisser la couverture vers le bas pour fermer
 * @param {number} [props.maxWidth]       Largeur max du dialogue (px), bureau
 * @param {string} [props.ctaLabel]
 * @param {(item: Course) => void} [props.onStart]
 */
export default function SharedModal({
  items,
  spring = 'doux',
  scrim = 'blur',
  recede = true,
  dragToClose = true,
  maxWidth = 720,
  ctaLabel = 'Commencer le cours',
  onStart,
}) {
  const [openId, setOpenId] = useState(null);
  const reduce = useReducedMotion();
  const t = reduce ? { duration: 0 } : SPRINGS[spring] || SPRINGS.doux;
  const lastCard = useRef(null);
  const open = items.find((c) => c.id === openId);

  const close = () => setOpenId(null);

  return (
    <div className="text-[var(--text)]">
      <ul role="list" className="grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-[repeat(auto-fill,minmax(296px,1fr))] sm:gap-6">
        {items.map((c) => (
          <li key={c.id}>
            <motion.button
              type="button"
              layoutId={`card-${c.id}`}
              transition={t}
              aria-haspopup="dialog"
              aria-expanded={openId === c.id}
              onClick={(e) => { lastCard.current = e.currentTarget; setOpenId(c.id); }}
              animate={{ opacity: recede && openId && openId !== c.id ? 0.5 : 1, scale: recede && openId && openId !== c.id && !reduce ? 0.97 : 1 }}
              style={{ borderRadius: 16, visibility: openId === c.id ? 'hidden' : 'visible' }}
              className="group flex w-full items-center overflow-hidden border border-[var(--border)] bg-[var(--surface)] p-2 text-left hover:border-[var(--border-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] sm:flex-col sm:items-stretch sm:p-0"
            >
              <motion.span layoutId={`cover-${c.id}`} transition={t} style={{ borderRadius: 12 }} className="block aspect-square w-[104px] flex-none overflow-hidden bg-[var(--raised)] sm:aspect-[16/10] sm:w-full sm:!rounded-none [&>svg]:h-full [&>svg]:w-full">
                {c.cover}
              </motion.span>
              <span className="flex min-w-0 flex-col gap-1 py-1 pl-4 pr-2 sm:gap-1.5 sm:px-5 sm:pb-5 sm:pt-4">
                <span className="font-mono text-xs uppercase tracking-[0.04em] text-[var(--text-muted)]">{c.tag}</span>
                <motion.span layoutId={`title-${c.id}`} transition={t} className="text-[17px] font-semibold leading-tight tracking-[-0.015em] text-[var(--text-strong)] sm:text-lg">{c.title}</motion.span>
                <span className="mt-0.5 flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <Initials name={c.author} />avec {c.author}
                </span>
              </span>
            </motion.button>
          </li>
        ))}
      </ul>

      <AnimatePresence onExitComplete={() => lastCard.current && lastCard.current.focus({ preventScroll: true })}>
        {open && (
          <Dialog key={open.id} item={open} t={t} scrim={scrim} maxWidth={maxWidth} drag={dragToClose && !reduce} onClose={close} ctaLabel={ctaLabel} onStart={onStart} />
        )}
      </AnimatePresence>
    </div>
  );
}

function Dialog({ item, t, scrim, maxWidth, drag, onClose, ctaLabel, onStart }) {
  const closeRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    closeRef.current && closeRef.current.focus({ preventScroll: true });
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => { document.documentElement.style.overflow = prev; };
  }, []);

  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    if (e.key !== 'Tab' || !boxRef.current) return;
    const f = boxRef.current.querySelectorAll('button, a[href]');
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  return (
    <>
      <motion.div
        aria-hidden="true"
        onClick={onClose}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className={`fixed inset-0 z-40 ${scrim === 'none' ? '' : 'bg-[var(--scrim)]'} ${scrim === 'blur' ? 'backdrop-blur-[6px]' : ''}`}
      />
      <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center pt-3 sm:items-center sm:p-6">
        <motion.div
          ref={boxRef}
          role="dialog" aria-modal="true" aria-labelledby={`dlg-${item.id}`}
          layoutId={`card-${item.id}`} transition={t}
          onKeyDown={onKey}
          drag={drag ? 'y' : false} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0.08, bottom: 0.6 }}
          onDragEnd={(_, info) => { if (info.offset.y > 120 || info.velocity.y > 600) onClose(); }}
          style={{ borderRadius: 16, maxWidth }}
          className="pointer-events-auto relative flex h-full w-full flex-col overflow-hidden bg-[var(--surface)] shadow-[var(--shadow-popover)] max-sm:!rounded-b-none sm:h-auto sm:max-h-full"
        >
          <div className="overflow-auto overscroll-contain">
            <motion.div layoutId={`cover-${item.id}`} transition={t} style={{ borderRadius: 0 }} className="relative h-[220px] cursor-grab overflow-hidden active:cursor-grabbing [&>svg]:h-full [&>svg]:w-full">
              <span aria-hidden="true" className="absolute left-1/2 top-2 z-10 h-1 w-10 -translate-x-1/2 rounded-full bg-[var(--accent-fg)] opacity-70 sm:hidden" />
              {item.cover}
            </motion.div>
            <div className="flex flex-col gap-2 px-5 pt-5 sm:px-8 sm:pt-6">
              <span className="font-mono text-xs uppercase tracking-[0.04em] text-[var(--text-muted)]">{item.tag}</span>
              <motion.h3 id={`dlg-${item.id}`} layoutId={`title-${item.id}`} transition={t} className="m-0 text-[26px] font-semibold leading-[1.12] tracking-[-0.03em] text-[var(--text-strong)] sm:text-[30px]">{item.title}</motion.h3>
              <span className="flex items-center gap-2 text-sm text-[var(--text-muted)]"><Initials name={item.author} />avec {item.author}</span>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.12, duration: 0.3 } }} exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className="px-5 pb-6 pt-4 sm:px-8 sm:pb-8"
            >
              <p className="mb-6 mt-0 max-w-[60ch] text-base leading-relaxed">{item.description}</p>
              {item.stats && (
                <dl className="mb-6 mt-0 grid grid-cols-3 rounded-xl border border-[var(--border)]">
                  {item.stats.map((s, i) => (
                    <div key={s.label} className={`px-3 py-3 sm:px-4 ${i ? 'border-l border-[var(--border)]' : ''}`}>
                      <dt className="text-xs text-[var(--text-muted)]">{s.label}</dt>
                      <dd className="m-0 mt-1 text-[15px] font-semibold tabular-nums text-[var(--text-strong)]">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {item.chapters && (
                <>
                  <h4 className="mb-2 mt-0 text-sm font-semibold text-[var(--text-strong)]">Programme</h4>
                  <ol className="mb-6 mt-0 list-none p-0">
                    {item.chapters.map((ch, i) => (
                      <li key={ch.title} className="flex justify-between gap-4 border-t border-[var(--border)] py-2.5 text-[15px]">
                        <span><span className="mr-3 font-mono text-xs text-[var(--text-muted)]">{String(i + 1).padStart(2, '0')}</span>{ch.title}</span>
                        <span className="flex-none tabular-nums text-[var(--text-muted)]">{ch.duration}</span>
                      </li>
                    ))}
                  </ol>
                </>
              )}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { onStart && onStart(item); onClose(); }} className="h-11 flex-1 rounded-full border border-[var(--accent)] bg-[var(--accent)] px-5 text-[15px] font-medium text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] sm:flex-none">{ctaLabel}</button>
                <button type="button" className="h-11 flex-1 rounded-full border border-[var(--border-control)] bg-transparent px-5 text-[15px] font-medium text-[var(--text-strong)] hover:bg-[var(--state-hover)] sm:flex-none">Ajouter à ma liste</button>
              </div>
            </motion.div>
          </div>
          <motion.button
            ref={closeRef} type="button" aria-label="Fermer" onClick={onClose}
            initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1, transition: { delay: 0.1 } }} exit={{ opacity: 0, scale: 0.6 }}
            className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-strong)] hover:bg-[var(--raised)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] fill-none stroke-current" strokeWidth="1.75" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </motion.button>
        </motion.div>
      </div>
    </>
  );
}

function Initials({ name }) {
  const ini = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return <span aria-hidden="true" className="grid h-6 w-6 flex-none place-items-center rounded-full bg-[var(--accent-subtle)] text-[10px] font-semibold text-[var(--text-strong)]">{ini}</span>;
}

/* Exemple
<SharedModal spring="doux" scrim="blur" items={[{
  id: 'typo', tag: 'Design · 4 h 20', title: 'Typographie pour l’écran', author: 'Inès Barthe',
  cover: <svg viewBox="0 0 480 200" preserveAspectRatio="xMidYMid slice">…</svg>,
  description: 'Choisir une police, régler l’interlignage…',
  stats: [{ label: 'Durée', value: '4 h 20' }, { label: 'Leçons', value: '18' }, { label: 'Niveau', value: 'Intermédiaire' }],
  chapters: [{ title: 'Lire avant de dessiner', duration: '38 min' }],
}]} />
*/
