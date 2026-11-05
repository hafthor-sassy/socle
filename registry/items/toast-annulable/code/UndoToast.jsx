// Toast annulable — React + Tailwind CSS + framer-motion. Couleurs : variables de tokens.css.
// La bordure se vide comme un compte à rebours (Web Animations, pausable) ; Annuler ou Ctrl/⌘ Z restaure.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const isMac = typeof navigator !== 'undefined' && /Mac|iP(hone|ad|od)/.test(navigator.platform || navigator.userAgent);
const POS = {
  'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2 max-sm:bottom-3',
  'bottom-right': 'bottom-6 right-6 max-sm:bottom-3',
  'top-center': 'top-6 left-1/2 -translate-x-1/2 max-sm:top-3',
};

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {React.ReactNode} props.message
 * @param {string|number} [props.timerKey]   Changer la clé relance le compte à rebours (ex. nouvelle suppression regroupée)
 * @param {number} [props.duration]          ms avant validation
 * @param {'border'|'bar'} [props.indicator]
 * @param {'bottom-center'|'bottom-right'|'top-center'} [props.position]
 * @param {boolean} [props.pauseOnHover]     Pause au survol et au focus
 * @param {boolean} [props.shortcut]         Ctrl/⌘ Z annule
 * @param {string} [props.undoLabel]
 * @param {() => void} props.onUndo
 * @param {() => void} props.onExpire        Temps écoulé ou fermeture : valider l'action
 */
export function UndoToast({
  open, message, timerKey = 0, duration = 6000, indicator = 'border', position = 'bottom-center',
  pauseOnHover = true, shortcut = true, undoLabel = 'Annuler', onUndo, onExpire,
}) {
  const reduce = useReducedMotion();
  const box = useRef(null), ring = useRef(null), bar = useRef(null), anim = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [held, setHeld] = useState({ hover: false, focus: false });
  const cb = useRef({ onUndo, onExpire }); cb.current = { onUndo, onExpire };

  useLayoutEffect(() => {
    if (!open || !box.current) return;
    const ro = new ResizeObserver(() => setSize({ w: box.current.offsetWidth, h: box.current.offsetHeight }));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = indicator === 'bar' ? bar.current : ring.current;
    if (!el) return;
    const kf = indicator === 'bar' ? [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }] : [{ strokeDashoffset: 0 }, { strokeDashoffset: 100 }];
    const a = el.animate(kf, { duration, easing: 'linear', fill: 'forwards' });
    a.onfinish = () => cb.current.onExpire();
    anim.current = a;
    return () => { a.onfinish = null; a.cancel(); };
  }, [open, timerKey, duration, indicator]);

  useEffect(() => {
    const a = anim.current;
    if (!a) return;
    const sync = () => {
      const stop = (pauseOnHover && (held.hover || held.focus)) || document.hidden;
      if (stop && a.playState === 'running') a.pause();
      if (!stop && a.playState === 'paused') a.play();
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, [held, pauseOnHover, open, timerKey]);

  useEffect(() => {
    if (!open || !shortcut) return;
    const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); cb.current.onUndo(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, shortcut]);

  const top = position === 'top-center';
  return (
    <div role="region" aria-label="Notifications" className={`pointer-events-none fixed z-[60] max-sm:left-3 max-sm:right-3 max-sm:translate-x-0 ${POS[position]}`}>
      <p role="status" aria-live="polite" className="sr-only">{open ? <>{message}. {isMac ? 'Commande' : 'Contrôle'} Z pour annuler.</> : ''}</p>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={box}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: top ? -16 : 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 380, damping: 26 } }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: top ? -8 : 8, scale: 0.98, transition: { duration: 0.18 } }}
            onPointerEnter={() => setHeld((h) => ({ ...h, hover: true }))}
            onPointerLeave={() => setHeld((h) => ({ ...h, hover: false }))}
            onFocus={() => setHeld((h) => ({ ...h, focus: true }))}
            onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHeld((h) => ({ ...h, focus: false })); }}
            className="pointer-events-auto relative flex min-h-14 max-w-[520px] items-center gap-3 rounded-xl bg-[var(--surface)] py-1.5 pl-4 pr-1.5 text-[var(--text-strong)] shadow-[var(--shadow-toast),inset_0_0_0_1px_var(--border)] max-sm:max-w-none"
          >
            {indicator === 'border' ? (
              <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                <rect ref={ring} x=".75" y=".75" rx="11.25" width={Math.max(0, size.w - 1.5)} height={Math.max(0, size.h - 1.5)} pathLength="100"
                  fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="100 100" strokeLinecap="round" />
              </svg>
            ) : (
              <span ref={bar} aria-hidden="true" className="absolute inset-x-3 bottom-0 h-0.5 origin-left rounded bg-[var(--accent)]" />
            )}
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 flex-none fill-none stroke-[var(--text-muted)]" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></svg>
            <motion.p key={timerKey} initial={reduce || !timerKey ? false : { y: 6, opacity: 0.2 }} animate={{ y: 0, opacity: 1 }} className="m-0 min-w-0 flex-1 text-[15px] leading-5">{message}</motion.p>
            <button type="button" onClick={onUndo} className="inline-flex h-11 flex-none items-center gap-2 rounded-lg px-3 text-[15px] font-semibold text-[var(--accent)] hover:bg-[var(--accent-subtle)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]">
              {undoLabel}
              {shortcut && <kbd className="rounded-md border border-[var(--border)] px-1.5 py-0.5 font-mono text-xs font-medium text-[var(--text-muted)] [@media(hover:none)]:hidden">{isMac ? '⌘ Z' : 'Ctrl Z'}</kbd>}
            </button>
            <button type="button" aria-label="Fermer la notification" onClick={onExpire} className="-ml-2 grid h-11 w-11 flex-none place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--state-hover)] hover:text-[var(--text-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] fill-none stroke-current" strokeWidth="1.5" strokeLinecap="round"><path d="M7 7l10 10M17 7 7 17" /></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Exemple : liste de fichiers, suppressions regroupées dans un seul toast. */
export default function FileListWithUndo({ initial, duration = 6000 }) {
  const [files, setFiles] = useState(initial);
  const [pending, setPending] = useState([]); // { file, index }
  const visible = files.filter((f) => !pending.some((p) => p.file.id === f.id));

  const remove = (file) => setPending((p) => [...p, { file, index: files.indexOf(file) }]);
  const undo = () => setPending([]);
  const commit = () => { setFiles((fs) => fs.filter((f) => !pending.some((p) => p.file.id === f.id))); setPending([]); };

  return (
    <>
      <ul role="list" className="m-0 list-none p-2">
        <AnimatePresence initial={false}>
          {visible.map((f) => (
            <motion.li key={f.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0, x: -12 }}
              className="flex min-h-16 items-center gap-3 overflow-hidden rounded-xl px-3 hover:bg-[var(--state-hover)]">
              <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-[var(--text-strong)]">{f.name}</span>
              <button type="button" aria-label={`Mettre « ${f.name} » à la corbeille`} onClick={() => remove(f)}
                className="grid h-11 w-11 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--tint-red-bg)] hover:text-[var(--down)]">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></svg>
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <UndoToast
        open={pending.length > 0}
        timerKey={pending.length}
        duration={duration}
        message={pending.length === 1 ? <><b>« {pending[0].file.name} »</b> placé dans la corbeille</> : <><b>{pending.length} fichiers</b> placés dans la corbeille</>}
        onUndo={undo}
        onExpire={commit}
      />
    </>
  );
}

/* <FileListWithUndo initial={[{ id: 1, name: 'Devis-Martin-v3.pdf' }, { id: 2, name: 'Plans-RDC.dwg' }]} /> */
