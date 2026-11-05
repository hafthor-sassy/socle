// Onglets à pastille glissante — React + Tailwind CSS. Couleurs : variables de tokens.css. Contenu fictif (Cursif).
// Aucune dépendance en plus de React. La pastille est placée par ses bords gauche et droit ; en allant vers la droite,
// le bord droit mène (ressort) et le gauche suit avec du retard : c'est l'étirement. Motif ARIA tabs complet.
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

/**
 * @typedef {{ id: string, label: string, icon?: React.ReactNode, count?: number, content: React.ReactNode }} TabItem
 * @typedef {Object} SlidingTabsProps
 * @property {TabItem[]} [items]
 * @property {string}  [defaultTab]   id de l'onglet ouvert au montage
 * @property {'surface'|'accent'|'underline'} [variant]
 * @property {number}  [duration]     Durée du glissement (ms)
 * @property {number}  [stretch]      Étirement 0 à 1
 * @property {'auto'|'manual'} [activation] Les flèches activent (auto) ou déplacent seulement le focus (manual)
 * @property {boolean} [icons]
 * @property {boolean} [counts]
 * @property {boolean} [fill]         Onglets répartis sur toute la largeur
 * @property {'md'|'sm'} [size]       44 ou 36 px de haut
 * @property {string}  [label]        Nom accessible de la liste
 * @property {(id: string) => void} [onChange]
 */

const I = (d) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 opacity-85">{d}</svg>;
const Row = ({ n, t, d, state }) => (
  <li className="grid min-h-14 grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[var(--border)] py-2 last:border-b-0">
    <span className={`font-mono text-[13px] ${state === 'done' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>{n}</span>
    <span className={`text-[15px] leading-[22px] ${state === 'done' ? 'text-[var(--text-muted)]' : 'text-[var(--text-strong)]'} ${state === 'now' ? 'font-semibold' : ''}`}>{t}</span>
    <span className={`whitespace-nowrap text-sm tabular-nums ${state === 'now' ? 'font-semibold text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>{d}</span>
  </li>
);

export const COURSE_TABS = [
  { id: 'apercu', label: 'Aperçu', icon: I(<><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>), content: (
    <>
      <p className="max-w-[56ch] text-base leading-relaxed">Apprenez à choisir, associer et régler des caractères pour l’écran&nbsp;: échelle fluide, interlignage, longueur de ligne et contraste.</p>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--raised)]"><span className="block h-full w-[42%] rounded-full bg-[var(--accent)]" /></div>
      <p className="mt-2 text-sm text-[var(--text-muted)]"><b className="font-semibold text-[var(--text-strong)]">5 leçons sur 12</b> · environ 2&nbsp;h&nbsp;10 restantes</p>
    </>
  ) },
  { id: 'lecons', label: 'Leçons', count: 12, icon: I(<><rect x="3.5" y="5" width="17" height="13" rx="2.5" /><path d="M10.5 9.5v4l3.5-2z" /></>), content: (
    <ol className="-my-2">
      <Row n="01" t="Lire avant de dessiner" d="12 min" state="done" /><Row n="02" t="Anatomie d’un caractère" d="18 min" state="done" />
      <Row n="06" t="Interlignage et rythme vertical" d="16 min" state="now" /><Row n="07" t="Associer deux familles" d="21 min" />
    </ol>
  ) },
  { id: 'exos', label: 'Exercices', count: 4, icon: I(<><path d="M14.5 4.5l5 5L9 20H4v-5z" /><path d="M12.5 6.5l5 5" /></>), content: (
    <ol className="-my-2"><Row n="A" t="Recomposer une page de presse" d="18/20" state="done" /><Row n="B" t="Échelle fluide pour un tableau de bord" d="À rendre jeudi" state="now" /><Row n="C" t="Couple serif et sans pour une revue" d="Verrouillé" /></ol>
  ) },
  { id: 'forum', label: 'Discussions', count: 28, icon: I(<><path d="M4 5h16v11H9l-5 4z" /><path d="M8 9.5h8M8 12.5h5" /></>), content: (
    <ol className="-my-2"><Row n="MB" t="Quel interlignage pour du 15 px en Geist ?" d="2 h" /><Row n="SL" t="Mon échelle saute entre 768 et 1024 px" d="hier" /></ol>
  ) },
  { id: 'certif', label: 'Certificat', icon: I(<><circle cx="12" cy="9" r="5.5" /><path d="M8.5 13.5L7 21l5-2.5 5 2.5-1.5-7.5" /></>), content: (
    <div className="grid justify-items-center gap-3 px-2 py-6 text-center text-[var(--text-muted)]">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></svg>
      <p className="max-w-[44ch] text-[15px] leading-relaxed"><b className="mb-1 block font-semibold text-[var(--text-strong)]">Encore 7 leçons avant votre certificat.</b>Il est délivré quand toutes les leçons sont vues et les exercices notés au-dessus de 12/20.</p>
    </div>
  ) },
];

const LEAD = 'cubic-bezier(.3,1.35,.5,1)', TRAIL = 'cubic-bezier(.65,0,.35,1)';

export default function SlidingTabs({
  items = COURSE_TABS, defaultTab, variant = 'surface', duration = 380, stretch = 0.6, activation = 'auto',
  icons = true, counts = true, fill = false, size = 'md', label = 'Sections du cours', onChange,
}) {
  const uid = useId();
  const [active, setActive] = useState(() => Math.max(0, items.findIndex((t) => t.id === defaultTab)));
  const [from, setFrom] = useState(null);
  const [pill, setPill] = useState(null);
  const [hover, setHover] = useState(null);
  const listRef = useRef(null), scrollerRef = useRef(null), tabRefs = useRef([]), prev = useRef(active);
  const reduce = typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const edges = (i) => { const t = tabRefs.current[i], l = listRef.current; return t && l ? { left: t.offsetLeft, right: l.clientWidth - t.offsetLeft - t.offsetWidth } : null; };

  const place = useCallback((animate) => {
    const e = edges(active); if (!e) return;
    const right = active > prev.current, K = Math.min(1, Math.max(0, stretch));
    const lead = duration * (1 - K * 0.35), trail = duration * (1 + K * 0.15), wait = Math.round(duration * K * 0.18);
    const transition = animate && !reduce && duration > 0 && active !== prev.current
      ? `left ${right ? trail : lead}ms ${right ? TRAIL : LEAD} ${right ? wait : 0}ms, right ${right ? lead : trail}ms ${right ? LEAD : TRAIL} ${right ? 0 : wait}ms`
      : 'none';
    setPill({ ...e, transition });
  }, [active, duration, stretch, reduce]);

  useLayoutEffect(() => { place(true); prev.current = active; }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
  // Recalage sans animation quand la barre change de taille (police chargée, rotation, réglages)
  const placeRef = useRef(place); placeRef.current = place;
  useEffect(() => {
    let first = true;
    const ro = new ResizeObserver(() => { if (first) { first = false; return; } placeRef.current(false); });
    if (listRef.current) ro.observe(listRef.current);
    document.fonts?.ready.then(() => placeRef.current(false));
    return () => ro.disconnect();
  }, []);
  useEffect(() => { place(false); }, [size, icons, counts, fill]); // eslint-disable-line react-hooks/exhaustive-deps

  function reveal(i) {
    const s = scrollerRef.current, t = tabRefs.current[i]; if (!s || !t || s.scrollWidth <= s.clientWidth) return;
    const pad = 24; let x = s.scrollLeft;
    if (t.offsetLeft - pad < x) x = t.offsetLeft - pad; else if (t.offsetLeft + t.offsetWidth + pad > x + s.clientWidth) x = t.offsetLeft + t.offsetWidth + pad - s.clientWidth;
    s.scrollTo({ left: x, behavior: reduce ? 'auto' : 'smooth' });
  }
  function select(i, focus) {
    if (i === active) return;
    setFrom(i > active ? 'right' : 'left'); setActive(i); reveal(i);
    if (focus) tabRefs.current[i]?.focus({ preventScroll: true });
    onChange?.(items[i].id);
  }
  function onKey(e) {
    const i = tabRefs.current.indexOf(document.activeElement); if (i < 0) return;
    const n = items.length, to = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
    if (to === undefined) { if (activation === 'manual' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(i); } return; }
    e.preventDefault();
    if (activation === 'manual') { tabRefs.current[to]?.focus({ preventScroll: true }); reveal(to); } else select(to, true);
  }

  const underline = variant === 'underline', accent = variant === 'accent';
  const h = size === 'sm' ? 'h-9' : 'h-11';
  const trackCls = underline
    ? 'gap-1 border-b border-[var(--border)]'
    : 'gap-0.5 rounded-full border border-[var(--border)] bg-[var(--raised)] p-1';
  const pillCls = underline
    ? 'bottom-[-1px] h-0.5 z-[1] bg-[var(--accent)]'
    : `top-1 bottom-1 -z-10 rounded-full ${accent ? 'bg-[var(--accent)]' : 'border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-overlay)]'}`;

  return (
    <div className="w-full max-w-[760px] font-sans text-[var(--text)]">
      <div ref={scrollerRef} className="overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div ref={listRef} role="tablist" aria-label={label} onKeyDown={onKey} onPointerLeave={() => setHover(null)}
          className={`relative isolate ${fill ? 'flex min-w-full' : 'inline-flex align-top'} ${trackCls}`}>
          {hover !== null && hover !== active && !reduce && (
            <span aria-hidden="true" style={edges(hover) || undefined}
              className={`pointer-events-none absolute -z-10 bg-[var(--state-hover)] transition-[left,right] duration-200 ${underline ? 'bottom-1.5 top-1.5 rounded-lg' : 'bottom-1 top-1 rounded-full'}`} />
          )}
          {pill && <span aria-hidden="true" style={{ left: pill.left, right: pill.right, transition: pill.transition }} className={`pointer-events-none absolute ${pillCls}`} />}
          {items.map((t, i) => {
            const on = i === active;
            return (
              <button
                key={t.id} ref={(el) => { tabRefs.current[i] = el; }} type="button" role="tab"
                id={`${uid}-t-${t.id}`} aria-controls={`${uid}-p-${t.id}`} aria-selected={on} tabIndex={on ? 0 : -1}
                onClick={() => select(i)} onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(i)}
                className={`relative inline-flex ${fill ? 'flex-[1_0_auto]' : 'flex-none'} ${h} items-center justify-center gap-2 whitespace-nowrap px-3.5 text-[15px] font-medium tracking-[-0.01em] transition-colors duration-200 sm:px-4 ${underline ? 'rounded-lg' : 'rounded-full'} focus-visible:outline focus-visible:outline-[3px] focus-visible:-outline-offset-2 focus-visible:outline-[var(--focus-ring)] ${on ? (accent ? 'text-[var(--accent-fg)]' : 'text-[var(--text-strong)]') : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'}`}
              >
                {icons && t.icon}
                <span>{t.label}</span>
                {counts && t.count != null && (
                  <span className={`inline-grid h-5 min-w-6 place-items-center rounded-full px-1.5 text-xs font-semibold tabular-nums transition-colors ${on ? (accent ? 'bg-[color-mix(in_srgb,var(--accent-fg)_18%,transparent)] text-[var(--accent-fg)]' : 'bg-[var(--accent-subtle)] text-[var(--accent)]') : 'bg-[var(--state-press)] text-[var(--text-muted)]'}`}>{t.count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative mt-4">
        {items.map((t, i) => (
          <section
            key={t.id + (i === active ? `-${active}` : '')} role="tabpanel" id={`${uid}-p-${t.id}`} aria-labelledby={`${uid}-t-${t.id}`} tabIndex={0} hidden={i !== active}
            style={i === active && from && !reduce ? { animation: 'st-in 260ms cubic-bezier(.2,0,0,1) both', '--st-x': from === 'right' ? '16px' : '-16px' } : undefined}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] sm:p-5"
          >
            {t.content}
          </section>
        ))}
      </div>
      <style>{'@keyframes st-in{from{opacity:0;transform:translateX(var(--st-x,0))}}'}</style>
    </div>
  );
}
