// Bouton gluant — React + Tailwind CSS + framer-motion. Couleurs : variables de tokens.css.
// Filtre SVG « goo » (flou + seuil alpha) sur un calque de gouttes ; icônes nettes sur un calque séparé.
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const ICONS = {
  note: 'M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3zM14 8l3 3',
  photo: 'M4 8.5h3.2L9 6h6l1.8 2.5H20V18H4zM15.2 13a3.2 3.2 0 1 1-6.4 0 3.2 3.2 0 0 1 6.4 0z',
  vocal: 'M12 14.5a3 3 0 0 0 3-3v-5a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zM6 11.5a6 6 0 0 0 12 0M12 17.5v3',
  lien: 'M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1',
  tache: 'M8 4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4zM8.5 12.2l2.4 2.4 4.8-5',
};

/**
 * @param {object} props
 * @param {{ id: string, label: string, icon?: string }[]} [props.actions]  icon : clé de ICONS ou tracé SVG 24×24
 * @param {(id: string) => void} [props.onSelect]
 * @param {'auto'|'arc'|'colonne'|'ligne'} [props.layout]  auto : éventail au pointeur fin, colonne au doigt
 * @param {number} [props.gap]        Distance entre deux gouttes voisines (px)
 * @param {number} [props.blur]       Viscosité : écart type du flou (px)
 * @param {number} [props.stiffness]
 * @param {number} [props.damping]
 * @param {number} [props.stagger]    Décalage entre gouttes (ms)
 * @param {boolean} [props.labels]    Étiquettes visibles en colonne
 * @param {string} [props.label]      Nom accessible du bouton principal
 */
export function GooButton({
  actions = [
    { id: 'note', label: 'Note' },
    { id: 'photo', label: 'Photo' },
    { id: 'vocal', label: 'Mémo vocal' },
    { id: 'lien', label: 'Lien' },
  ],
  onSelect,
  layout = 'auto',
  gap = 76,
  blur = 10,
  stiffness = 200,
  damping = 16,
  stagger = 60,
  labels = true,
  label = 'Créer',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [peek, setPeek] = useState(false);
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, '');
  const root = useRef(null);
  const mainBtn = useRef(null);
  const items = useRef([]);
  const n = actions.length;
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(pointer: coarse), (max-width: 640px)');
    const f = () => setCoarse(m.matches);
    f(); m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, []);
  const lay = layout === 'auto' ? (coarse ? 'colonne' : 'arc') : layout;

  const pos = useMemo(() => actions.map((_, i) => {
    if (lay === 'colonne') return [0, -(i + 1) * gap];
    if (lay === 'ligne') return [-(i + 1) * gap, 0];
    const step = n > 1 ? Math.PI / 2 / (n - 1) : 0;
    const r = Math.max(gap + 40, n > 1 ? gap / (2 * Math.sin(step / 2)) : 0);
    const a = Math.PI + (n > 1 ? step * i : Math.PI / 4);
    return [Math.cos(a) * r, Math.sin(a) * r];
  }), [actions, lay, gap, n]);

  useEffect(() => {
    if (!open) return;
    const away = (e) => { if (!root.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);

  const onKey = (e) => {
    if (e.key === 'Escape' && open) { e.preventDefault(); setOpen(false); mainBtn.current?.focus(); return; }
    const i = items.current.indexOf(document.activeElement);
    if (i < 0 || !/^Arrow/.test(e.key)) return;
    e.preventDefault();
    const next = e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? i + 1 : i - 1;
    (next < 0 ? mainBtn.current : items.current[Math.min(n - 1, next)])?.focus();
  };

  const spring = (i) => reduce ? { duration: 0 } : { type: 'spring', stiffness, damping, delay: ((open ? i : n - 1 - i) * stagger) / 1000 };
  const at = (i) => { const f = open ? 1 : peek ? 0.16 : 0; return { x: pos[i][0] * f, y: pos[i][1] * f }; };

  return (
    <div ref={root} onKeyDown={onKey} className={`relative size-[60px] ${className}`}>
      <svg aria-hidden="true" className="absolute size-0 overflow-hidden">
        <filter id={`goo-${uid}`} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur} />
          <feColorMatrix mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -11" />
        </filter>
      </svg>

      {/* Calque filtré : gouttes + disque principal, assez grand pour contenir l'étendue des gouttes */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-[640px] -top-[640px] size-[760px]"
        style={{ filter: reduce ? 'none' : `url(#goo-${uid})` }}>
        {actions.map((a, i) => (
          <motion.span key={a.id} className="absolute left-[646px] top-[646px] size-12 rounded-full bg-[var(--accent)]"
            initial={false} animate={{ ...at(i), scale: open ? 1 : peek ? 0.7 : 0.6 }} transition={spring(i)} />
        ))}
        <span className="absolute left-[640px] top-[640px] size-[60px] rounded-full bg-[var(--accent)]" />
      </div>

      <ul id={`goo-menu-${uid}`} aria-label={label} inert={open ? undefined : ''} className="absolute inset-0 m-0 list-none p-0">
        {actions.map((a, i) => (
          <motion.li key={a.id} className="absolute left-[6px] top-[6px] size-12" initial={false} animate={at(i)} transition={spring(i)}>
            <button ref={(el) => (items.current[i] = el)} type="button"
              onClick={() => { onSelect?.(a.id); setOpen(false); mainBtn.current?.focus(); }}
              className={[
                'group relative grid size-12 place-items-center rounded-full text-[var(--accent-fg)] transition-opacity duration-200',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--focus-ring)]',
                open ? 'opacity-100' : 'pointer-events-none opacity-0',
              ].join(' ')}>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[22px] fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.75]">
                <path d={ICONS[a.icon || a.id] || a.icon} />
              </svg>
              <span className={[
                'pointer-events-none absolute whitespace-nowrap rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5',
                'text-[14px] font-medium leading-5 text-[var(--text-strong)] shadow-[var(--shadow-popover)] transition-opacity duration-150',
                lay === 'ligne' ? 'bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2' : 'right-[calc(100%+12px)] top-1/2 -translate-y-1/2',
                open && labels && lay === 'colonne' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
              ].join(' ')}>{a.label}</span>
            </button>
          </motion.li>
        ))}
      </ul>

      <motion.button ref={mainBtn} type="button" aria-expanded={open} aria-controls={`goo-menu-${uid}`} aria-label={label}
        onClick={(e) => { setOpen((o) => !o); if (!open && e.detail === 0) setTimeout(() => items.current[0]?.focus(), 60); }}
        onPointerEnter={(e) => e.pointerType !== 'touch' && setPeek(true)} onPointerLeave={() => setPeek(false)}
        whileTap={reduce ? undefined : { scale: 0.9 }} transition={{ type: 'spring', stiffness: 520, damping: 22 }}
        className="absolute inset-0 grid place-items-center rounded-full text-[var(--accent-fg)] [-webkit-tap-highlight-color:transparent] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus-ring)]">
        <motion.svg viewBox="0 0 24 24" aria-hidden="true" className="size-[26px] fill-none stroke-current [stroke-linecap:round] [stroke-width:2]"
          animate={{ rotate: open ? 135 : 0 }} transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 18 }}>
          <path d="M12 5v14M5 12h14" />
        </motion.svg>
      </motion.button>
    </div>
  );
}

/* Exemple
<div className="relative h-[560px]">
  <GooButton className="!absolute bottom-6 right-6" onSelect={(id) => console.log(id)} />
</div>
*/
