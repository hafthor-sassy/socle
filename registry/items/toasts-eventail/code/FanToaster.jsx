// Pile en éventail — React + Tailwind CSS + framer-motion. Couleurs : variables de tokens.css.
// Toasts empilés en profondeur, étalés au survol / au toucher / au focus, fermés d'un glissement (élan conservé).
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const SPRINGS = { doux: { stiffness: 260, damping: 26 }, sec: { stiffness: 420, damping: 42 }, joueur: { stiffness: 320, damping: 17 } };
const TONES = {
  success: ['var(--tint-green-bg)', 'var(--tint-green-fg)', 'var(--tint-green-border)', 'M5 12.5l4.5 4.5L19 7.5'],
  info: ['var(--tint-blue-bg)', 'var(--tint-blue-fg)', 'var(--tint-blue-border)', 'M12 11v6M12 7.5v.01'],
  warning: ['var(--tint-amber-bg)', 'var(--tint-amber-fg)', 'var(--tint-amber-border)', 'M12 8v5M12 16.5v.01'],
  error: ['var(--tint-red-bg)', 'var(--tint-red-fg)', 'var(--tint-red-border)', 'M8 8l8 8M16 8l-8 8'],
  loading: ['var(--accent-subtle)', 'var(--accent)', 'var(--accent-subtle-border)', 'M12 3a9 9 0 1 0 9 9'],
};

const Ctx = createContext(null);
/** const toast = useFanToast(); toast.push({ type, title, description, action: { label, onClick }, duration }) → id */
export const useFanToast = () => useContext(Ctx);

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {'bottom-right'|'bottom-center'|'top-right'} [props.position]
 * @param {number} [props.visible]     Toasts visibles dans la pile repliée
 * @param {number} [props.gap]         Écart une fois étalée (px)
 * @param {number} [props.duration]    ms avant disparition (les toasts « loading » restent)
 * @param {'doux'|'sec'|'joueur'} [props.spring]
 * @param {boolean} [props.swipe]      Glisser horizontalement pour fermer
 * @param {boolean} [props.expanded]   Toujours étalée
 */
export function FanToaster({ children, position = 'bottom-right', visible = 3, gap = 12, duration = 6000, spring = 'doux', swipe = true, expanded = false }) {
  const [toasts, setToasts] = useState([]);
  const [heights, setHeights] = useState({});
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const uid = useRef(0);
  const region = useRef(null);
  const open = expanded || hover || focus;

  const dismiss = useCallback((id) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);
  const push = useCallback((o) => { const id = ++uid.current; setToasts((ts) => [{ type: 'info', ...o, id }, ...ts].slice(0, 8)); return id; }, []);
  const update = useCallback((id, o) => setToasts((ts) => ts.map((t) => (t.id === id ? { ...t, ...o, rev: (t.rev || 0) + 1 } : t))), []);
  const clear = useCallback(() => setToasts([]), []);
  const api = useMemo(() => ({ push, update, dismiss, clear }), [push, update, dismiss, clear]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey && e.code === 'KeyT' && region.current) { const first = region.current.querySelector('li'); if (first) { e.preventDefault(); first.focus(); } }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const top = position === 'top-right';
  const dir = top ? 1 : -1;
  let acc = 0;
  const front = toasts[0] ? heights[toasts[0].id] || 64 : 0;
  const layout = toasts.map((t, i) => {
    const h = heights[t.id] || 64;
    if (open) { const y = dir * acc; acc += h + gap; return { y, scale: 1, opacity: 1, height: h, content: 1 }; }
    return { y: dir * i * 14, scale: Math.max(0.7, 1 - i * 0.055), opacity: i < visible ? 1 : 0, height: i === 0 ? h : front, content: i === 0 ? 1 : 0 };
  });
  const listH = open ? Math.max(0, acc - gap) : front + 14 * Math.max(0, Math.min(visible, toasts.length) - 1);
  const place = { 'bottom-right': 'bottom-6 right-6', 'bottom-center': 'bottom-6 left-1/2 -ml-[184px]', 'top-right': 'top-6 right-6' }[position];

  return (
    <Ctx.Provider value={api}>
      {children}
      <section
        ref={region} aria-label="Notifications (Alt + T)"
        onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setHover(false)}
        onFocus={() => setFocus(true)}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFocus(false)}
        onKeyDown={(e) => { if (e.key === 'Escape') { setHover(false); e.target.blur(); } }}
        className={`pointer-events-none fixed z-[60] w-[368px] max-sm:left-3 max-sm:right-3 max-sm:ml-0 max-sm:w-auto ${place} ${top ? 'max-sm:top-3' : 'max-sm:bottom-3'}`}
      >
        <button type="button" onClick={clear} tabIndex={open && toasts.length > 1 ? 0 : -1}
          className={`pointer-events-auto absolute right-0 h-8 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] font-medium text-[var(--text-muted)] transition hover:text-[var(--text-strong)] ${top ? 'top-full mt-2' : 'bottom-full mb-2'} ${open && toasts.length > 1 ? 'opacity-100' : 'invisible translate-y-1.5 opacity-0'}`}
          style={top ? { top: listH } : undefined}
        >Tout effacer</button>
        <motion.ol animate={{ height: listH }} transition={{ type: 'spring', ...SPRINGS[spring] }} className="pointer-events-auto relative m-0 list-none p-0">
          <AnimatePresence initial={false}>
            {toasts.map((t, i) => (
              <Toast key={t.id} t={t} i={i} l={layout[i]} top={top} spring={SPRINGS[spring]} swipe={swipe} paused={open} duration={duration}
                onHeight={(h) => setHeights((hs) => (hs[t.id] === h ? hs : { ...hs, [t.id]: h }))}
                onDismiss={() => dismiss(t.id)} onTap={() => setHover(true)} />
            ))}
          </AnimatePresence>
        </motion.ol>
      </section>
    </Ctx.Provider>
  );
}

function Toast({ t, i, l, top, spring, swipe, paused, duration, onHeight, onDismiss, onTap }) {
  const reduce = useReducedMotion();
  const inner = useRef(null);
  const left = useRef(t.duration || duration);
  const [bg, fg, bd, icon] = TONES[t.type] || TONES.info;

  useLayoutEffect(() => {
    if (!inner.current) return;
    const ro = new ResizeObserver(() => onHeight(inner.current.offsetHeight));
    ro.observe(inner.current);
    return () => ro.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { left.current = t.duration || duration; }, [t.rev, t.type, duration, t.duration]);
  useEffect(() => {
    if (t.type === 'loading' || paused || document.hidden) return;
    const start = performance.now();
    const id = setTimeout(onDismiss, left.current);
    return () => { clearTimeout(id); left.current = Math.max(800, left.current - (performance.now() - start)); };
  }, [paused, t.type, t.rev]); // eslint-disable-line react-hooks/exhaustive-deps

  const tr = reduce ? { duration: 0 } : { type: 'spring', ...spring };
  return (
    <motion.li
      tabIndex={0}
      aria-label={`${t.title}${t.description ? '. ' + t.description : ''}`}
      role={t.type === 'error' ? 'alert' : 'status'}
      initial={{ y: top ? -24 : 24, scale: 0.92, opacity: 0 }}
      animate={{ y: l.y, scale: l.scale, opacity: l.opacity, height: l.height, x: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: l.y + (top ? -16 : 16) }}
      transition={tr}
      drag={swipe && !reduce ? 'x' : false}
      dragSnapToOrigin
      dragElastic={0.9}
      onDragEnd={(_, info) => { const w = inner.current ? inner.current.offsetWidth : 360; if (Math.abs(info.offset.x) > w * 0.32 || Math.abs(info.velocity.x) > 650) onDismiss(); }}
      onTap={(e) => e.pointerType !== 'mouse' && onTap()}
      onKeyDown={(e) => { if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); onDismiss(); } }}
      style={{ zIndex: 100 - i, transformOrigin: top ? '50% 0' : '50% 100%', pointerEvents: l.content || l.opacity === 1 ? 'auto' : 'none' }}
      className={`absolute inset-x-0 cursor-grab touch-pan-y select-none overflow-hidden rounded-xl bg-[var(--surface)] shadow-[var(--shadow-toast),inset_0_0_0_1px_var(--border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] active:cursor-grabbing ${top ? 'top-0' : 'bottom-0'}`}
    >
      <motion.div ref={inner} animate={{ opacity: l.content }} transition={tr} className="flex items-start gap-3 py-3.5 pl-4 pr-2">
        <span aria-hidden="true" className="-mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-full border" style={{ background: bg, color: fg, borderColor: bd }}>
          <svg viewBox="0 0 24 24" className={`h-4 w-4 fill-none stroke-current ${t.type === 'loading' ? 'animate-spin' : ''}`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 pt-px">
          <span className="text-[15px] font-semibold leading-5 text-[var(--text-strong)]">{t.title}</span>
          {t.description && <span className="text-sm leading-5 text-[var(--text-muted)]">{t.description}</span>}
          {t.action && (
            <button type="button" onClick={(e) => { e.stopPropagation(); t.action.onClick && t.action.onClick(); onDismiss(); }}
              className="mt-1.5 h-8 self-start rounded-full border border-[var(--border-control)] px-3 text-[13px] font-medium text-[var(--text-strong)] hover:bg-[var(--state-hover)]">{t.action.label}</button>
          )}
        </span>
        <button type="button" aria-label={`Fermer : ${t.title}`} onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          className="-mt-1.5 grid h-8 w-8 flex-none place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--state-hover)] hover:text-[var(--text-strong)] max-sm:-mr-1 max-sm:-mt-3 max-sm:h-11 max-sm:w-11">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.75" strokeLinecap="round"><path d="M7 7l10 10M17 7 7 17" /></svg>
        </button>
      </motion.div>
    </motion.li>
  );
}

/* Exemple
function PayrollButton() {
  const toast = useFanToast();
  return <button onClick={() => {
    const id = toast.push({ type: 'loading', title: 'Calcul des fiches de paie…', description: '42 salariés' });
    run().then(() => toast.update(id, { type: 'success', title: 'Fiches de paie prêtes', action: { label: 'Ouvrir' } }));
  }}>Lancer la paie</button>;
}
<FanToaster position="bottom-right" visible={3}><PayrollButton /></FanToaster>
*/
export default FanToaster;
