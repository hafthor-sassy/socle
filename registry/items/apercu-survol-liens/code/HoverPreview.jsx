// Aperçu au survol de liens — React + Tailwind CSS, sans dépendance.
// Couleurs : variables de tokens.css. Les affiches d'exemple sont des SVG ; passez vos <img> dans `image`.
import { useEffect, useRef, useState } from 'react';

const RATIOS = { portrait: '4 / 5', carre: '1 / 1', paysage: '3 / 2' };

/**
 * @typedef {{ href: string, title: string, place: string, time: string, image: React.ReactNode }} PreviewItem
 * @param {object} props
 * @param {PreviewItem[]} props.items
 * @param {number} [props.ease=0.16]   Inertie : part de la distance rattrapée par image
 * @param {number} [props.tilt=6]      Inclinaison maximale (degrés)
 * @param {number} [props.size=280]    Largeur de l'aperçu (px)
 * @param {'portrait'|'carre'|'paysage'} [props.format='portrait']
 * @param {'side'|'center'} [props.place='side']   À côté du curseur ou centré dessus
 * @param {'cursor'|'anchor'} [props.mode='cursor'] Suivi libre ou vertical seulement
 * @param {boolean} [props.dim=true]   Estomper les autres lignes
 */
export function HoverPreviewList({ items, ease = 0.16, tilt = 6, size = 280, format = 'portrait', place = 'side', mode = 'cursor', dim = true, className = '' }) {
  const rootRef = useRef(null), previewRef = useRef(null), reelRef = useRef(null);
  const [active, setActive] = useState(-1);
  const [shown, setShown] = useState(false);
  const opts = useRef({}); opts.current = { ease, tilt, size, place, mode };
  const st = useRef({ x: 0, y: 0, tx: 0, ty: 0, rot: 0, raf: 0, shown: false });

  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = () => window.matchMedia('(hover: hover) and (min-width: 720px)').matches;
  const dims = () => { const r = previewRef.current.getBoundingClientRect(); return [r.width || size, r.height || size * 1.25]; };
  const local = (cx, cy) => { const r = rootRef.current.getBoundingClientRect(); return [cx - r.left, cy - r.top]; };
  const aim = (p) => {
    if (opts.current.place !== 'side') return p[0];
    const w = dims()[0], right = p[0] + 32 + w / 2;
    return right + w / 2 > rootRef.current.getBoundingClientRect().width - 8 ? p[0] - 32 - w / 2 : right;
  };
  const frame = () => {
    const s = st.current; s.raf = 0;
    const k = reduced() ? 1 : opts.current.ease, vx = (s.tx - s.x) * k;
    s.x += vx; s.y += (s.ty - s.y) * k;
    const t = reduced() ? 0 : Math.max(-opts.current.tilt, Math.min(opts.current.tilt, vx * 0.35));
    s.rot += (t - s.rot) * 0.18;
    const [w, h] = dims();
    previewRef.current.style.transform = `translate3d(${(s.x - w / 2).toFixed(2)}px,${(s.y - h / 2).toFixed(2)}px,0) rotate(${s.rot.toFixed(2)}deg)`;
    if (Math.abs(s.tx - s.x) + Math.abs(s.ty - s.y) + Math.abs(s.rot) > 0.05) s.raf = requestAnimationFrame(frame);
  };
  const wake = () => { if (!st.current.raf) st.current.raf = requestAnimationFrame(frame); };
  const snapReel = (i) => { const r = reelRef.current; r.style.transition = 'none'; r.style.transform = `translateY(${-100 * i}%)`; r.offsetHeight; r.style.transition = ''; };
  const open = (i) => { if (!st.current.shown) snapReel(i); st.current.shown = true; setActive(i); setShown(true); };
  const close = () => { st.current.shown = false; setShown(false); setActive(-1); };

  const onEnter = (i) => (e) => {
    if (e.pointerType === 'touch' || !canHover()) return;
    const s = st.current, p = local(e.clientX, e.clientY), first = !s.shown;
    open(i);
    if (opts.current.mode === 'anchor') { anchor(e.currentTarget, first); return; }
    if (first) { s.x = aim(p); s.y = p[1]; }
    s.tx = aim(p); s.ty = p[1]; wake();
  };
  const anchor = (row, snap) => {
    const s = st.current, r = row.getBoundingClientRect(), p = local(r.right, r.top + r.height / 2), [w] = dims();
    s.tx = Math.max(w / 2, p[0] - w / 2 - 160); s.ty = p[1];
    if (snap) { s.x = s.tx; s.y = s.ty; }
    wake();
  };
  const onMove = (e) => {
    if (e.pointerType === 'touch' || !st.current.shown) return;
    const p = local(e.clientX, e.clientY);
    if (opts.current.mode !== 'anchor') st.current.tx = aim(p);
    st.current.ty = p[1]; wake();
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); cancelAnimationFrame(st.current.raf); };
  }, []);

  const ease420 = 'transition-transform duration-[420ms] ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none';
  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <ol onPointerMove={onMove} onPointerLeave={close} className="m-0 list-none border-t border-[var(--border)] p-0">
        {items.map((it, i) => {
          const dimmed = dim && shown && active !== i;
          return (
            <li key={it.href} className="border-b border-[var(--border)]">
              <a
                href={it.href}
                onPointerEnter={onEnter(i)}
                onFocus={(e) => { if (!canHover()) return; open(i); anchor(e.currentTarget, true); }}
                onBlur={() => setTimeout(() => { if (!rootRef.current?.contains(document.activeElement)) close(); }, 0)}
                className={`group grid grid-cols-[64px_1fr_20px] grid-rows-[auto_auto] items-center gap-x-4 gap-y-1 py-4 text-[var(--text-strong)] no-underline transition-opacity duration-[260ms] active:bg-[var(--state-press)] focus-visible:rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--focus-ring)] min-[720px]:min-h-[88px] min-[720px]:grid-cols-[48px_1fr_120px_72px_24px] min-[720px]:grid-rows-1 min-[720px]:px-2 min-[720px]:py-0 ${dimmed ? 'opacity-40' : ''}`}
              >
                <span aria-hidden="true" className="row-span-2 h-20 w-16 overflow-hidden rounded-lg bg-[var(--raised)] min-[720px]:hidden">{it.image}</span>
                <span className="hidden font-mono text-[13px] tabular-nums text-[var(--text-muted)] min-[720px]:block">{String(i + 1).padStart(2, '0')}</span>
                <span className={`text-lg font-medium leading-6 tracking-[-0.025em] min-[720px]:text-[clamp(1.25rem,1rem+1vw,1.875rem)] min-[720px]:leading-[1.15] min-[720px]:group-hover:translate-x-2 min-[720px]:group-focus-visible:translate-x-2 ${ease420}`}>{it.title}</span>
                <span className="col-start-2 row-start-2 text-sm text-[var(--text-muted)] min-[720px]:col-start-3 min-[720px]:row-start-1">{it.place}</span>
                <span className="col-start-2 row-start-2 justify-self-end text-sm tabular-nums text-[var(--text-muted)] min-[720px]:col-start-4 min-[720px]:row-start-1">{it.time}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true" className={`col-start-3 row-span-2 row-start-1 size-5 fill-none stroke-current text-[var(--text-muted)] [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.75] min-[720px]:col-start-5 min-[720px]:row-span-1 min-[720px]:-translate-x-1.5 min-[720px]:translate-y-1.5 min-[720px]:opacity-0 min-[720px]:group-hover:translate-x-0 min-[720px]:group-hover:translate-y-0 min-[720px]:group-hover:text-[var(--accent)] min-[720px]:group-hover:opacity-100 min-[720px]:group-focus-visible:opacity-100 ${ease420}`}>
                  <path d="M7 17 17 7M9 7h8v8" />
                </svg>
              </a>
            </li>
          );
        })}
      </ol>

      <div ref={previewRef} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-[5] hidden will-change-transform [@media(hover:hover)_and_(min-width:720px)]:block" style={{ width: size, aspectRatio: RATIOS[format] || RATIOS.portrait }}>
        <div
          className="relative h-full w-full overflow-hidden rounded-xl bg-[var(--raised)] shadow-[var(--shadow-popover)] transition-[clip-path,scale,opacity] duration-[520ms] ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none"
          style={{ clipPath: shown ? 'inset(0 0 0 0 round 12px)' : 'inset(50% 50% 50% 50% round 12px)', scale: shown ? '1' : '.86', opacity: shown ? 1 : 0 }}
        >
          <div ref={reelRef} className="flex h-full flex-col transition-transform duration-[640ms] ease-[cubic-bezier(.65,0,.35,1)] motion-reduce:transition-none" style={{ transform: `translateY(${-100 * Math.max(0, active)}%)` }}>
            {items.map((it) => <div key={it.href} className="h-full w-full shrink-0 [&>*]:h-full [&>*]:w-full [&>img]:object-cover">{it.image}</div>)}
          </div>
          <p className="absolute inset-x-3 bottom-3 m-0 flex h-8 items-center justify-between rounded-full bg-[var(--surface)] px-3 font-mono text-xs tracking-[.02em] text-[var(--text-strong)]">
            <span>{items[Math.max(0, active)]?.place}</span><span className="text-[var(--text-muted)]">{items[Math.max(0, active)]?.time}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* Affiches d'exemple (SVG aux couleurs de la palette) */
const Merzouga = () => (
  <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className="block h-full w-full shrink-0" aria-hidden="true"><rect width="400" height="500" className="fill-[var(--accent-subtle)]"/><path d="M0 60h400M0 92h400M0 124h400M0 156h400" className="fill-none [stroke-linecap:round] [stroke-linejoin:round] stroke-[var(--accent)] [stroke-opacity:.16] [stroke-width:2]"/><circle cx="262" cy="196" r="78" className="fill-[var(--surface)] [.dark_&]:fill-[var(--text-strong)]"/><circle cx="262" cy="196" r="98" className="fill-none [stroke-linecap:round] [stroke-linejoin:round] stroke-[var(--surface)] [.dark_&]:stroke-[var(--text-strong)] [stroke-width:2] [stroke-dasharray:2_8]"/><path d="M0 318c70-48 150-60 232-30 64 23 112 22 168-6v218H0Z" className="fill-[var(--accent)] [fill-opacity:.36]"/><path d="M0 366c64-34 128-30 196-4 70 27 134 26 204-8v146H0Z" className="fill-[var(--accent)] [fill-opacity:.64]"/><path d="M-10 430c110-60 230-58 420-6v76H-10Z" className="fill-[var(--accent)]"/><path d="M70 470c40-20 80-28 130-26" className="fill-none [stroke-linecap:round] [stroke-linejoin:round] stroke-[var(--surface)] [.dark_&]:stroke-[var(--text-strong)] [stroke-width:4] [stroke-dasharray:0_14]"/><path d="M118 352c4-8 14-8 18 0M140 352c3-6 10-6 14 0" className="fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:6] stroke-[var(--text-strong)]"/></svg>
);
const Venise = () => (
  <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className="block h-full w-full shrink-0" aria-hidden="true"><rect width="400" height="500" className="fill-[var(--accent)] [fill-opacity:.64]"/><path d="M0 40h400M0 70h400M0 100h400" className="fill-none [stroke-linecap:round] [stroke-linejoin:round] stroke-[var(--surface)] [.dark_&]:stroke-[var(--text-strong)] [stroke-opacity:.45] [stroke-width:3]"/><circle cx="292" cy="236" r="44" className="fill-[var(--surface)] [.dark_&]:fill-[var(--text-strong)]"/><path d="M0 300V196h400v104" className="fill-[var(--accent)]"/><path d="M28 300v-70a30 30 0 0 1 60 0v70M112 300v-70a30 30 0 0 1 60 0v70M196 300v-70a30 30 0 0 1 60 0v70M280 300v-70a30 30 0 0 1 60 0v70" className="fill-[var(--accent-subtle)]"/><path d="M0 196h400M0 180h400" className="fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:6] stroke-[var(--accent-subtle)]"/><rect y="300" width="400" height="200" className="fill-[var(--accent)] [fill-opacity:.36]"/><path d="M28 316v40M58 316v28M112 316v40M142 316v28M196 316v40M226 316v28M280 316v40M310 316v28" className="fill-none [stroke-linecap:round] [stroke-linejoin:round] stroke-[var(--accent-subtle)] [stroke-opacity:.45] [stroke-width:3]"/><path d="M262 330h60M248 352h88M270 374h44" className="fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:6] stroke-[var(--surface)] [.dark_&]:stroke-[var(--text-strong)]"/><path d="M60 430c40 10 100 10 150 0l-8 14H70Z" className="fill-[var(--text-strong)]"/><path d="M210 430l14-26" className="fill-none [stroke-linecap:round] [stroke-linejoin:round] stroke-[var(--text-strong)] [stroke-width:3]"/><path d="M0 470h400" className="fill-none [stroke-linecap:round] [stroke-linejoin:round] stroke-[var(--surface)] [.dark_&]:stroke-[var(--text-strong)] [stroke-width:4] [stroke-dasharray:0_14]"/></svg>
);
const Lofoten = () => (
  <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className="block h-full w-full shrink-0" aria-hidden="true"><rect width="400" height="500" className="fill-[var(--accent)]"/><path d="M-20 120c90-50 170-10 250-50s140-30 190-10" className="fill-none [stroke-linecap:round] [stroke-linejoin:round] stroke-[var(--surface)] [.dark_&]:stroke-[var(--text-strong)] [stroke-width:18] [stroke-opacity:.45] [stroke-width:3]"/><path d="M-20 160c100-40 180 0 250-40s130-30 190-20" className="fill-none [stroke-linecap:round] [stroke-linejoin:round] stroke-[var(--accent-subtle)] [stroke-width:18] [stroke-opacity:.45] [stroke-width:3]"/><circle cx="54" cy="56" r="2.5" className="fill-[var(--surface)] [.dark_&]:fill-[var(--text-strong)]"/><circle cx="148" cy="34" r="2" className="fill-[var(--surface)] [.dark_&]:fill-[var(--text-strong)]"/><circle cx="330" cy="48" r="3" className="fill-[var(--surface)] [.dark_&]:fill-[var(--text-strong)]"/><circle cx="252" cy="88" r="1.8" className="fill-[var(--surface)] [.dark_&]:fill-[var(--text-strong)]"/><circle cx="364" cy="128" r="2" className="fill-[var(--surface)] [.dark_&]:fill-[var(--text-strong)]"/><path d="M0 500V352l84-128 52 64 70-150 82 120 46-44 66 82v204Z" className="fill-[var(--accent-subtle)]"/><path d="M84 224l26 36-26 10-12-18ZM206 138l30 44-30 8-16-22Z" className="fill-[var(--surface)] [.dark_&]:fill-[var(--text-strong)]"/><path d="M0 500v-84l110-34 96 30 194-40v128Z" className="fill-[var(--accent)] [fill-opacity:.64]"/><rect x="250" y="384" width="40" height="26" className="fill-[var(--text-strong)]"/><path d="M244 386l26-18 26 18" className="fill-[var(--text-strong)]"/><rect x="262" y="392" width="8" height="8" className="fill-[var(--surface)] [.dark_&]:fill-[var(--text-strong)]"/><path d="M0 456h400" className="fill-none [stroke-linecap:round] [stroke-linejoin:round] stroke-[var(--surface)] [.dark_&]:stroke-[var(--text-strong)] [stroke-opacity:.45] [stroke-width:3]"/></svg>
);
const Kyoto = () => (
  <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className="block h-full w-full shrink-0" aria-hidden="true"><rect width="400" height="500" className="fill-[var(--accent-subtle)]"/><circle cx="200" cy="210" r="132" className="fill-[var(--accent)] [fill-opacity:.14]"/><circle cx="200" cy="210" r="96" className="fill-[var(--accent)] [fill-opacity:.36]"/><path d="M58 150c40 8 244 8 284 0l-8 22H66Z" className="fill-[var(--accent)]"/><rect x="84" y="186" width="232" height="16" className="fill-[var(--accent)]"/><rect x="190" y="172" width="20" height="18" className="fill-[var(--accent)]"/><rect x="118" y="168" width="22" height="332" className="fill-[var(--accent)]"/><rect x="260" y="168" width="22" height="332" className="fill-[var(--accent)]"/><rect y="440" width="400" height="60" className="fill-[var(--accent)] [fill-opacity:.64]"/><g className="fill-[var(--surface)] [.dark_&]:fill-[var(--text-strong)]"><rect x="40" y="300" width="26" height="36" rx="10"/><rect x="334" y="270" width="26" height="36" rx="10"/><rect x="318" y="356" width="22" height="30" rx="9"/><rect x="58" y="380" width="22" height="30" rx="9"/></g><path d="M53 280v20M347 250v20M329 338v18M69 362v18" className="fill-none [stroke-linecap:round] [stroke-linejoin:round] stroke-[var(--text-strong)] [stroke-width:3]"/><path d="M0 470h400" className="fill-none [stroke-linecap:round] [stroke-linejoin:round] stroke-[var(--surface)] [.dark_&]:stroke-[var(--text-strong)] [stroke-width:4] [stroke-dasharray:0_14]"/></svg>
);
const Acores = () => (
  <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className="block h-full w-full shrink-0" aria-hidden="true"><rect width="400" height="500" className="fill-[var(--accent-subtle)]"/><path d="M0 70h400M0 100h400" className="fill-none [stroke-linecap:round] [stroke-linejoin:round] stroke-[var(--accent)] [stroke-opacity:.16] [stroke-width:2]"/><circle cx="320" cy="84" r="34" className="fill-[var(--surface)] [.dark_&]:fill-[var(--text-strong)]"/><path d="M-20 300c60-90 140-120 220-120s170 40 240 110v210H-20Z" className="fill-[var(--accent)] [fill-opacity:.36]"/><ellipse cx="190" cy="250" rx="98" ry="30" className="fill-[var(--accent)] [fill-opacity:.64]"/><ellipse cx="190" cy="254" rx="70" ry="18" className="fill-[var(--surface)] [.dark_&]:fill-[var(--text-strong)]"/><path d="M-20 360c90-40 190-30 440 10v130H-20Z" className="fill-[var(--accent)] [fill-opacity:.64]"/><path d="M-10 500c40-70 120-70 170-110s120-60 250-60" className="fill-none [stroke-linecap:round] [stroke-linejoin:round] stroke-[var(--text-strong)] [stroke-width:16]"/><path d="M-10 500c40-70 120-70 170-110s120-60 250-60" className="fill-none [stroke-linecap:round] [stroke-linejoin:round] stroke-[var(--surface)] [.dark_&]:stroke-[var(--text-strong)] [stroke-width:3] [stroke-dasharray:12_14]"/><circle cx="246" cy="350" r="9" className="fill-none [stroke-linecap:round] [stroke-linejoin:round] stroke-[var(--text-strong)] [stroke-width:3]"/><circle cx="270" cy="346" r="9" className="fill-none [stroke-linecap:round] [stroke-linejoin:round] stroke-[var(--text-strong)] [stroke-width:3]"/><path d="M246 350l10-14h12l2 10M256 336l-4-8" className="fill-none [stroke-linecap:round] [stroke-linejoin:round] stroke-[var(--text-strong)] [stroke-width:3]"/><circle cx="262" cy="320" r="5" className="fill-[var(--text-strong)]"/></svg>
);

const ITEMS = [
  { href: '#merzouga', title: 'Dormir dans les dunes de Merzouga', place: 'Maroc', time: '12 min', image: <Merzouga /> },
  { href: '#venise', title: 'Venise, l’heure où la lagune se tait', place: 'Italie', time: '9 min', image: <Venise /> },
  { href: '#lofoten', title: 'Les Lofoten sous la nuit polaire', place: 'Norvège', time: '15 min', image: <Lofoten /> },
  { href: '#kyoto', title: 'Kyoto, de temple en temple à pied', place: 'Japon', time: '11 min', image: <Kyoto /> },
  { href: '#acores', title: 'Les Açores à vélo, d’un cratère à l’autre', place: 'Portugal', time: '13 min', image: <Acores /> },
];

/* Exemple : sommaire de Méridienne (marque fictive, revue de voyage). */
export default function MeridienneIndex() {
  return (
    <section aria-labelledby="mer-title" className="mx-auto max-w-[1120px] px-5 py-12 [font-family:var(--font-sans)] text-[var(--text)] min-[720px]:px-6 min-[720px]:py-[72px]">
      <header className="mb-6 grid items-end gap-x-12 gap-y-3 min-[720px]:mb-10 min-[720px]:grid-cols-[1fr_auto]">
        <p className="col-span-full mb-4 inline-flex items-center gap-2.5 text-base font-semibold tracking-[-0.01em] text-[var(--text-strong)]">
          <svg viewBox="0 0 100 100" aria-hidden="true" className="size-6 text-[var(--accent)]"><circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="7" /><path d="M50 6v88" stroke="currentColor" strokeWidth="7" /><path d="M50 6c-22 14-22 74 0 88" fill="none" stroke="currentColor" strokeWidth="7" /><circle cx="72" cy="38" r="9" fill="currentColor" /></svg>
          Méridienne
        </p>
        <h2 id="mer-title" className="text-[clamp(2rem,1.4rem+2.2vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-[var(--text-strong)]">Récits du numéro&nbsp;14</h2>
        <p className="max-w-[22rem] text-[15px] leading-[22px] text-[var(--text-muted)]">
          Cinq voyages lents, écrits sur place.<span className="hidden [@media(hover:hover)_and_(min-width:720px)]:inline"> Survolez un titre pour entrevoir le lieu.</span>
        </p>
      </header>
      <HoverPreviewList items={ITEMS} />
    </section>
  );
}
