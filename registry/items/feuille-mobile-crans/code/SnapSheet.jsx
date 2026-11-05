// Feuille mobile à crans — React + Tailwind CSS. Couleurs : variables de tokens.css. Contenu fictif (Rayon, vélos).
// Aucune dépendance en plus de React : même moteur que l'onglet HTML (ressort, projection de la vitesse, élastique).
// Le conteneur prend la hauteur de son parent : placez-le dans un élément en h-[100dvh] pour une page plein écran.
// Requêtes de conteneur (@container, @[720px]:) : plugin officiel @tailwindcss/container-queries (natif en Tailwind 4).
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * @typedef {'peek'|'half'|'full'} Snap
 * @typedef {Object} SnapSheetProps
 * @property {Snap}    [defaultSnap]
 * @property {'list'|'loading'|'empty'} [state]  Contenu de la feuille
 * @property {number}  [stiffness]
 * @property {number}  [damping]
 * @property {boolean} [recede]   La vue derrière recule en plein écran
 * @property {number}  [peek]     Hauteur visible en position réduite (px)
 * @property {number}  [top]      Marge en haut en plein écran (px)
 * @property {React.ReactNode} [background]  Vue derrière (carte par défaut)
 * @property {(s: Snap) => void} [onSnapChange]
 */

const NAMES = ['full', 'half', 'peek'];
const LABEL = { full: 'Plein écran', half: 'À moitié ouverte', peek: 'Réduite' };
const reduced = () => typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const STATIONS = [
  { n: 3, name: 'Place du Capitole', meta: '2 min · 160 m · mis à jour il y a 30 s', bikes: 2, ebikes: 1, best: true },
  { n: 7, name: 'Jean-Jaurès', meta: '4 min · 320 m', bikes: 4, ebikes: 3 },
  { n: 5, name: 'Saint-Sernin', meta: '5 min · 410 m', bikes: 5, ebikes: 0 },
  { n: 0, name: 'Esquirol', meta: '6 min · 480 m · 9 places libres', bikes: 0, ebikes: 0 },
];

function MapBackground() {
  return (
    <svg viewBox="0 0 400 860" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <rect width="400" height="860" fill="var(--raised)" />
      <path d="M-20 520C80 470 140 560 230 520S360 430 430 470V560C360 520 300 600 220 610S80 560-20 600Z" fill="var(--tint-blue-bg)" />
      <path d="M40 120h140v130H40zM250 650h120v120H250z" fill="var(--tint-green-bg)" />
      <path d="M-10 300H420M200-10V870M-10 690L420 640M90-10L130 870" fill="none" stroke="var(--border)" strokeWidth="18" strokeLinecap="round" />
      <path d="M-10 300H420M200-10V870M-10 690L420 640M90-10L130 870" fill="none" stroke="var(--surface)" strokeWidth="14" strokeLinecap="round" />
      <path d="M-10 190H420M-10 400H420M-10 800H420M300-10V870M30-10V870M-10 90L420 140M240 300L360 520" fill="none" stroke="var(--surface)" strokeWidth="5" strokeLinecap="round" />
      {[[200, 300, 3], [300, 190, 7], [118, 420, 0], [300, 400, 5]].map(([x, y, n]) => (
        <g key={`${x}-${y}`}><circle cx={x} cy={y} r="16" fill="var(--accent)" stroke="var(--surface)" strokeWidth="3" /><text x={x} y={y + 5} textAnchor="middle" fill="var(--accent-fg)" style={{ font: '700 14px var(--font-sans)' }}>{n}</text></g>
      ))}
      <circle cx="160" cy="250" r="22" fill="var(--tint-blue-fg)" opacity=".16" /><circle cx="160" cy="250" r="8" fill="var(--tint-blue-fg)" stroke="var(--surface)" strokeWidth="3" />
    </svg>
  );
}

export default function SnapSheet({
  defaultSnap = 'half', state = 'list', stiffness = 420, damping = 36, recede = true, peek = 152, top = 48, background, onSnapChange,
}) {
  const rootRef = useRef(null), sheetRef = useRef(null), backRef = useRef(null), scrimRef = useRef(null), bodyRef = useRef(null), gripRef = useRef(null);
  const m = useRef({ y: 0, v: 0, target: 0, raf: 0, last: 0, snaps: { full: 0, half: 0, peek: 0 }, drag: null });
  const [snapName, setSnapName] = useState(defaultSnap);
  const [dragging, setDragging] = useState(false);
  const cur = useRef(defaultSnap);

  const paint = useCallback(() => {
    const { y, snaps } = m.current;
    if (sheetRef.current) sheetRef.current.style.transform = `translate3d(0,${y.toFixed(2)}px,0)`;
    const p = Math.max(0, Math.min(1, (snaps.half - y) / (snaps.half - snaps.full || 1)));
    if (backRef.current) {
      backRef.current.style.transform = recede ? `translateY(${(p * 10).toFixed(2)}px) scale(${(1 - p * 0.06).toFixed(4)})` : '';
      backRef.current.style.borderRadius = recede ? `${(p * 16).toFixed(1)}px` : '';
    }
    if (scrimRef.current) scrimRef.current.style.opacity = (p * (recede ? 0.6 : 0.3)).toFixed(3);
  }, [recede]);

  const frame = useCallback((now) => {
    const s = m.current; s.raf = 0;
    const dt = Math.min(0.05, (now - (s.last || now)) / 1000) || 1 / 60; s.last = now;
    for (let t = 0, h = 1 / 240; t < dt; t += h) { s.v += (-stiffness * (s.y - s.target) - damping * s.v) * h; s.y += s.v * h; }
    if (Math.abs(s.y - s.target) < 0.3 && Math.abs(s.v) < 4) { s.y = s.target; s.v = 0; s.last = 0; paint(); return; }
    paint(); s.raf = requestAnimationFrame(frame);
  }, [stiffness, damping, paint]);

  const snap = useCallback((name, vel = 0) => {
    const s = m.current; cur.current = name; s.target = s.snaps[name]; s.v = vel;
    setSnapName(name); onSnapChange?.(name);
    if (name !== 'full' && bodyRef.current) bodyRef.current.scrollTop = 0;
    if (reduced()) { s.y = s.target; s.v = 0; paint(); } else if (!s.raf) { s.last = 0; s.raf = requestAnimationFrame(frame); }
  }, [frame, paint, onSnapChange]);

  const measure = useCallback(() => {
    const H = rootRef.current?.clientHeight || 0;
    m.current.snaps = { full: top, half: Math.round(H * 0.48), peek: H - peek };
    return H;
  }, [top, peek]);

  // Montage : la feuille entre par le bas et monte jusqu'à son cran
  useLayoutEffect(() => {
    const H = measure(); const s = m.current;
    s.y = reduced() ? s.snaps[cur.current] : H; paint(); snap(cur.current);
    const ro = new ResizeObserver(() => { measure(); s.target = s.snaps[cur.current]; if (!s.raf) { s.y = s.target; paint(); } });
    ro.observe(rootRef.current);
    return () => { ro.disconnect(); cancelAnimationFrame(s.raf); s.raf = 0; };
  }, [measure, paint]); // eslint-disable-line react-hooks/exhaustive-deps

  const rubber = (raw) => {
    const { full, peek: pk } = m.current.snaps;
    if (raw < full) return full - Math.pow(full - raw, 0.8) * 0.5;
    if (raw > pk) return pk + Math.pow(raw - pk, 0.8) * 0.5;
    return raw;
  };
  const onPointerDown = (e) => {
    if (e.button > 0) return;
    const inHead = e.target.closest('[data-handle]'), inBody = e.target.closest('[data-body]');
    if (!inHead && !(inBody && cur.current !== 'full')) return;
    m.current.drag = { pending: true, x: e.clientX, y0: e.clientY, start: m.current.y, id: e.pointerId, samples: [] };
    // écoute sur la fenêtre : le doigt sort vite de la poignée quand on la tire vers le haut
    const mv = (ev) => moveRef.current(ev), up = (ev) => { upRef.current(ev); if (!m.current.drag) { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); } };
    window.addEventListener('pointermove', mv, { passive: false }); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  };
  const onPointerMove = (e) => {
    const s = m.current, d = s.drag; if (!d || e.pointerId !== d.id) return;
    const dy = e.clientY - d.y0;
    if (d.pending) {
      if (Math.abs(dy) < 6 || Math.abs(dy) < Math.abs(e.clientX - d.x)) return; // un toucher reste un clic
      d.pending = false; d.start = s.y - dy; cancelAnimationFrame(s.raf); s.raf = 0; s.v = 0; setDragging(true);
      try { sheetRef.current.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    }
    s.y = rubber(d.start + dy); paint();
    const t = performance.now(); d.samples.push([t, e.clientY]);
    while (d.samples.length > 2 && t - d.samples[0][0] > 100) d.samples.shift();
  };
  const onPointerUp = (e) => {
    const s = m.current, d = s.drag; if (!d || e.pointerId !== d.id) return;
    s.drag = null; setDragging(false); if (d.pending) return;
    let vel = 0; const a = d.samples[0], b = d.samples[d.samples.length - 1];
    if (a && b && a !== b) vel = ((b[1] - a[1]) / Math.max(1, b[0] - a[0])) * 1000;
    const proj = s.y + vel * 0.2;
    let best = NAMES.reduce((acc, n) => (Math.abs(s.snaps[n] - proj) < Math.abs(s.snaps[acc] - proj) ? n : acc), cur.current);
    if (Math.abs(vel) > 1100 && best === cur.current) { const i = NAMES.indexOf(best); best = NAMES[vel < 0 ? Math.max(0, i - 1) : Math.min(2, i + 1)]; }
    snap(best, Math.max(-4000, Math.min(4000, vel)));
    const swallow = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
    rootRef.current.addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(() => rootRef.current?.removeEventListener('click', swallow, true), 0);
  };
  const moveRef = useRef(onPointerMove); moveRef.current = onPointerMove;
  const upRef = useRef(onPointerUp); upRef.current = onPointerUp;
  const onGripKey = (e) => {
    const i = NAMES.indexOf(cur.current), d = { ArrowUp: -1, ArrowRight: -1, PageUp: -1, ArrowDown: 1, ArrowLeft: 1, PageDown: 1 }[e.key];
    if (e.key === 'Home') { e.preventDefault(); snap('full'); } else if (e.key === 'End') { e.preventDefault(); snap('peek'); }
    else if (d) { e.preventDefault(); snap(NAMES[Math.max(0, Math.min(2, i + d))]); }
  };
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && cur.current === 'full') { snap('half'); gripRef.current?.focus(); } };
    const el = rootRef.current; el.addEventListener('keydown', onKey); return () => el.removeEventListener('keydown', onKey);
  }, [snap]);

  const full = snapName === 'full';
  const sub = state === 'loading' ? 'Recherche des stations autour de vous…' : state === 'empty' ? 'Aucune station dans un rayon de 15 min' : '4 stations à moins de 6 min à pied';
  const cta = 'h-11 shrink-0 rounded-full px-[18px] text-[15px] font-semibold transition active:scale-[.96] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]';

  return (
    <div ref={rootRef} className="@container relative isolate h-full min-h-[480px] overflow-hidden bg-[var(--text-strong)] font-sans text-[var(--text)] dark:bg-[var(--bg)]">
      <div ref={backRef} aria-hidden="true" className="absolute inset-0 origin-top overflow-hidden bg-[var(--raised)] will-change-transform">
        {background ?? <MapBackground />}
        <div className="absolute inset-x-3 top-3 flex h-[52px] items-center gap-2 rounded-full bg-[var(--surface)] px-2 shadow-[var(--shadow-popover)]">
          <svg width="28" height="28" viewBox="0 0 100 100" className="m-1"><rect width="100" height="100" rx="28" fill="var(--accent)" /><circle cx="50" cy="50" r="25" fill="none" stroke="var(--accent-fg)" strokeWidth="9" /><path d="M50 50L67.7 32.3" stroke="var(--accent-fg)" strokeWidth="8" strokeLinecap="round" /><circle cx="50" cy="50" r="7" fill="var(--accent-fg)" /></svg>
          <span className="text-base text-[var(--text-muted)]">Où allez-vous&nbsp;?</span>
        </div>
      </div>
      <div ref={scrimRef} aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[var(--scrim)] opacity-0" />

      <section ref={sheetRef} aria-label="Stations proches" onPointerDown={onPointerDown}
        style={{ height: `calc(100% - ${top}px)`, transform: 'translateY(100%)' }}
        className={`absolute inset-x-0 top-0 z-10 flex flex-col rounded-t-2xl bg-[var(--surface)] shadow-[0_-1px_0_var(--border),var(--shadow-popover)] will-change-transform @[720px]:left-4 @[720px]:right-auto @[720px]:w-[420px] ${dragging ? 'cursor-grabbing' : ''}`}>
        <div data-handle="" className={`flex-none select-none px-4 pb-3 [touch-action:none] ${dragging ? '' : 'cursor-grab'}`}>
          <button ref={gripRef} type="button" role="slider" aria-label="Hauteur de la feuille" aria-valuemin={1} aria-valuemax={3} aria-valuenow={{ full: 3, half: 2, peek: 1 }[snapName]} aria-valuetext={LABEL[snapName]}
            onKeyDown={onGripKey} onClick={() => snap(cur.current === 'half' ? 'full' : 'half')}
            className="grid h-7 w-full place-items-center rounded-lg [touch-action:none] focus-visible:outline focus-visible:outline-[3px] focus-visible:-outline-offset-4 focus-visible:outline-[var(--focus-ring)]">
            <span aria-hidden="true" className={`h-[5px] rounded-full bg-[var(--border-control)] transition-all duration-200 ${dragging ? 'w-[52px] opacity-90' : 'w-10 opacity-55'}`} />
          </button>
          <div className="flex items-center justify-between gap-3">
            <div><h3 className="text-xl font-semibold leading-7 tracking-[-0.02em] text-[var(--text-strong)]">Stations proches</h3><p className="mt-0.5 text-sm text-[var(--text-muted)]">{sub}</p></div>
            <button type="button" className={`${cta} bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]`}>Réserver</button>
          </div>
        </div>

        <div ref={bodyRef} data-body="" inert={snapName === 'peek' ? '' : undefined}
          className={`min-h-0 flex-1 overscroll-contain px-4 pb-6 ${full ? 'overflow-y-auto [touch-action:pan-y]' : 'overflow-hidden [touch-action:none]'}`}>
          {state === 'loading' && <ul aria-label="Chargement des stations" aria-busy="true">{[0, 1, 2].map((k) => <li key={k} className="my-2 h-16 animate-pulse rounded-xl bg-[var(--raised)] motion-reduce:animate-none" />)}</ul>}
          {state === 'empty' && (
            <div className="grid justify-items-center gap-3 px-2 py-6 text-center text-[var(--text-muted)]">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="6" cy="17" r="3.5" /><circle cx="18" cy="17" r="3.5" /><path d="M6 17l3.5-8H14l4 8M3 3l18 18" /></svg>
              <p className="max-w-[32ch] text-[15px] leading-normal"><b className="block font-semibold text-[var(--text-strong)]">Aucune station à moins de 15 min.</b>Élargissez la zone ou activez les vélos hors station.</p>
              <button type="button" className={`${cta} bg-[var(--raised)] text-[var(--text-strong)]`}>Élargir à 2 km</button>
            </div>
          )}
          {state === 'list' && (
            <>
              <ul>
                {STATIONS.map((st) => (
                  <li key={st.name} className="grid grid-cols-[36px_minmax(0,1fr)] items-center gap-x-3 gap-y-1 border-t border-[var(--border)] py-3">
                    <span className={`row-span-2 grid h-9 w-9 place-items-center rounded-full text-sm font-bold ${st.best ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : st.bikes ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'bg-[var(--raised)] text-[var(--text-muted)]'}`}>{st.n}</span>
                    <span><b className="block text-base font-medium leading-[22px] text-[var(--text-strong)]">{st.name}</b><small className="text-sm text-[var(--text-muted)]">{st.meta}</small></span>
                    <span className={`col-start-2 flex flex-wrap gap-x-4 gap-y-1 text-sm tabular-nums ${st.bikes ? '' : 'text-[var(--text-muted)]'}`}>
                      {st.bikes ? (<><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[var(--accent)]" />{st.bikes} vélo{st.bikes > 1 ? 's' : ''}</span><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[var(--tint-amber-fg)]" />{st.ebikes} électrique{st.ebikes > 1 ? 's' : ''}</span></>) : (<><span>Aucun vélo</span><span>Retour possible</span></>)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mb-6 mt-2 flex items-center gap-3 rounded-xl bg-[var(--raised)] py-3.5 pl-4 pr-3.5">
                <p className="flex-1 text-sm text-[var(--text-muted)]"><b className="block text-[15px] font-semibold text-[var(--text-strong)]">Pass Journée · 5&nbsp;€</b>45 min offertes à chaque trajet, électriques compris.</p>
                <button type="button" className={`${cta} bg-[var(--surface)] text-[var(--text-strong)]`}>Choisir</button>
              </div>
            </>
          )}
        </div>
      </section>
      <p className="sr-only" aria-live="polite">Feuille {LABEL[snapName].toLowerCase()}</p>
    </div>
  );
}
