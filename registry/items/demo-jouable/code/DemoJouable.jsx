// DemoJouable.jsx — section « Démo jouable » : un curseur fantôme réserve une salle dans une vraie mini-interface,
// puis le visiteur prend la main. React 18 + Tailwind 3.4, tokens.css chargé (couleurs uniquement par variables).
// Sans bibliothèque d'animation : le scénario est une suite d'étapes awaitables (move, click, drag, type) qui
// pilotent l'état React ; il se met en pause hors écran et s'arrête à la première action du visiteur.
// Exemple : Alcôve, réservation d'espaces de coworking (marque fictive).
// Utilisation : <DemoJouable speed={1} loop pointer="auto" showSteps cursorLabel="Camille" />
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const ROOMS = [
  { id: 'atelier', nom: 'Atelier', places: 4 },
  { id: 'verriere', nom: 'Verrière', places: 8 },
  { id: 'biblio', nom: 'Bibliothèque', places: 2 },
];
const BASE = [
  { id: 1, room: 'atelier', s: 0, n: 3, titre: 'Revue design', tint: 'blue' },
  { id: 2, room: 'biblio', s: 1, n: 1, titre: 'Appel client', tint: 'amber' },
  { id: 3, room: 'atelier', s: 5, n: 2, titre: 'Déjeuner d’équipe', tint: 'green' },
  { id: 4, room: 'biblio', s: 4, n: 3, titre: 'Session focus', tint: 'violet' },
  { id: 5, room: 'verriere', s: 6, n: 2, titre: 'Atelier client', tint: 'neutral' },
];
const PEOPLE = [{ i: 'IM', n: 'Inès' }, { i: 'TB', n: 'Théo' }, { i: 'SL', n: 'Sacha' }, { i: 'NK', n: 'Nora' }];
const DURS = [1, 2, 3, 4];
const ROWS = 8, START = 9 * 60, STEP = 30, ROW = 48;
const STEPS = [
  ['Choisir un créneau', 'Les salles libres s’affichent en direct ; glissez pour régler la durée.'],
  ['Inviter l’équipe', 'Titre, invités et visio se règlent dans la même fenêtre.'],
  ['Confirmer', 'La salle est bloquée, les invitations partent aussitôt.'],
];
const TINT = {
  blue: 'bg-[var(--tint-blue-bg)] text-[var(--tint-blue-fg)] border-[var(--tint-blue-border)]',
  amber: 'bg-[var(--tint-amber-bg)] text-[var(--tint-amber-fg)] border-[var(--tint-amber-border)]',
  green: 'bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)] border-[var(--tint-green-border)]',
  violet: 'bg-[var(--tint-violet-bg)] text-[var(--tint-violet-fg)] border-[var(--tint-violet-border)]',
  neutral: 'bg-[var(--tint-neutral-bg)] text-[var(--tint-neutral-fg)] border-[var(--tint-neutral-border)]',
};
const SPRING = 'cubic-bezier(.34,1.4,.64,1)';
const fmt = (s) => { const m = START + s * STEP; return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; };
const durLabel = (n) => { const m = n * STEP; return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ' ' + (m % 60) : ''}`; };
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const conflictOf = (list, r, s, n, ignoreId) => list.find((b) => b.id !== ignoreId && b.room === r && b.s < s + n && s < b.s + b.n);
const roomOf = (id) => ROOMS.find((r) => r.id === id);
const Stop = Symbol('stop');

function Icon({ d, className = 'h-5 w-5' }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={`${className} flex-none fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.5]`}><path d={d} /></svg>;
}

/**
 * @param {{ speed?: number, loop?: boolean, pointer?: 'auto'|'fleche'|'doigt', showSteps?: boolean, cursorLabel?: string, className?: string }} props
 */
export function DemoJouable({ speed = 1, loop = true, pointer = 'auto', showSteps = true, cursorLabel = 'Camille', className = '' }) {
  const [bookings, setBookings] = useState(BASE);
  const [draft, setDraft] = useState(null);           // { room, s, n, editId? }
  const [form, setForm] = useState({ titre: '', invites: [], visio: false });
  const [pop, setPop] = useState(null);               // { x, y, origin } | null
  const [mode, setMode] = useState('idle');           // idle | demo | you
  const [step, setStep] = useState({ i: -1, p: 0 });
  const [toast, setToast] = useState(null);           // { msg, undo? }
  const [hint, setHint] = useState(false);
  const [shown, setShown] = useState('verriere');
  const [compact, setCompact] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ghost, setGhost] = useState({ on: false, down: false, hover: null });
  const [live, setLive] = useState('');
  const [focus, setFocus] = useState({ room: 'verriere', s: 0 });

  const app = useRef(null), ghostEl = useRef(null), pos = useRef({ x: 0, y: 0 }), token = useRef(0), visible = useRef(true);
  const st = useRef({}); st.current = { bookings, draft, form, speed, mode, compact, pop };
  const toastT = useRef(0), loopT = useRef(0), interacted = useRef(false);

  /* Mesures */
  useLayoutEffect(() => {
    const el = app.current; if (!el) return;
    const ro = new ResizeObserver(() => setCompact(el.clientWidth < 560)); ro.observe(el);
    const io = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; }, { threshold: 0.15 }); io.observe(el);
    return () => { ro.disconnect(); io.disconnect(); };
  }, []);
  const q = (sel) => app.current?.querySelector(sel);
  const say = (t) => { setLive(''); setTimeout(() => setLive(t), 30); };

  /* Fenêtre de réservation : position à côté de la colonne */
  const placePop = useCallback((d) => {
    if (!d || !app.current) return setPop(null);
    if (app.current.clientWidth < 560) return setPop({ sheet: true });
    const a = app.current.getBoundingClientRect(), c = q(`[data-col="${d.room}"]`).getBoundingClientRect(), w = 304, h = q('[data-dj-pop]')?.offsetHeight || 500;
    const right = c.right - a.left + 8, left = c.left - a.left - w - 8, x = right + w <= a.width - 8 ? right : Math.max(8, left);
    const y = Math.max(8, Math.min(c.top - a.top + d.s * ROW - 8, a.height - h - 8));
    setPop({ x, y, origin: x === right ? 'left top' : 'right top' });
  }, []);
  const openForm = (d, f) => { setDraft(d); if (f) setForm(f); placePop(d); };
  const closeForm = (keep) => { setPop(null); if (!keep) { setDraft(null); setForm({ titre: '', invites: [], visio: false }); } };

  const showToast = (msg, undo) => { clearTimeout(toastT.current); setToast({ msg, undo }); toastT.current = setTimeout(() => setToast(null), 4200); };
  const confirm = () => new Promise((res) => {
    const { draft: d, form: f, bookings: list } = st.current;
    if (!d || conflictOf(list, d.room, d.s, d.n, d.editId)) return res();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const b = { id: d.editId || Date.now(), room: d.room, s: d.s, n: d.n, titre: f.titre.trim() || 'Réservation', invites: f.invites, visio: f.visio, mine: true, fresh: true };
      setBookings((l) => (d.editId ? l.map((x) => (x.id === d.editId ? b : x)) : [...l, b]));
      closeForm();
      const nb = b.invites.length, msg = `${roomOf(b.room).nom} réservée · ${fmt(b.s)} – ${fmt(b.s + b.n)}${nb ? ` · ${nb} invitation${nb > 1 ? 's' : ''} envoyée${nb > 1 ? 's' : ''}` : ''}`;
      showToast(msg, () => { setBookings((l) => l.filter((x) => x.id !== b.id)); showToast('Réservation annulée'); });
      say(msg); res();
    }, 650 / (st.current.mode === 'demo' ? st.current.speed : 1));
  });

  /* ---------- Curseur fantôme ---------- */
  const setXY = (x, y) => { pos.current = { x, y }; if (ghostEl.current) ghostEl.current.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`; };
  const sleep = (ms, t) => new Promise((res, rej) => {
    let left = ms / st.current.speed, last = performance.now();
    const tick = () => { if (t !== token.current) return rej(Stop); const now = performance.now(); if (visible.current) left -= now - last; last = now; if (left <= 0) return res(); setTimeout(tick, Math.min(60, Math.max(8, left))); };
    tick();
  });
  const centerOf = (el, fy = 0.5) => { const a = app.current.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left - a.left + r.width / 2, y: r.top - a.top + r.height * fy }; };
  const move = (to, t, dur, onStep) => new Promise((res, rej) => {
    const { x: fx, y: fy } = pos.current, dist = Math.hypot(to.x - fx, to.y - fy) || 1, d = (dur || Math.min(1100, 380 + dist * 1.1)) / st.current.speed;
    const bend = Math.min(60, dist * 0.18) * (fx < to.x ? -1 : 1), px = -(to.y - fy) / dist, py = (to.x - fx) / dist;
    let el = 0, last = performance.now();
    const f = (now) => {
      if (t !== token.current) return rej(Stop);
      if (visible.current) el += now - last; last = now;
      const k = Math.min(1, el / d), e = ease(k), arc = Math.sin(Math.PI * e) * bend;
      setXY(fx + (to.x - fx) * e + px * arc, fy + (to.y - fy) * e + py * arc); onStep?.(e);
      k < 1 ? requestAnimationFrame(f) : res();
    };
    requestAnimationFrame(f);
  });
  const ripple = () => { const r = document.createElement('span'); r.className = 'dj-ripple pointer-events-none absolute z-[8] -ml-5 -mt-5 h-10 w-10 rounded-full border-2 border-[var(--accent)]'; r.style.left = pos.current.x + 'px'; r.style.top = pos.current.y + 'px'; app.current.appendChild(r); setTimeout(() => r.remove(), 560); };
  const click = async (sel, t, fy) => {
    const el = q(sel); await move(centerOf(el, fy), t);
    setGhost((g) => ({ ...g, hover: sel })); await sleep(120, t);
    setGhost((g) => ({ ...g, down: true })); ripple(); await sleep(110, t);
    setGhost((g) => ({ ...g, down: false, hover: null }));
  };
  const progTok = useRef(0);
  const progress = (i, ms, t) => new Promise((res) => {
    let el = 0, last = performance.now(); const d = ms / st.current.speed, mine = ++progTok.current;
    const f = (now) => { if (t !== token.current || mine !== progTok.current) return res(); if (visible.current) el += now - last; last = now; const k = Math.min(1, el / d); setStep({ i, p: k }); k < 1 ? requestAnimationFrame(f) : res(); };
    requestAnimationFrame(f);
  });

  const script = async (t) => {
    const target = 'verriere', s0 = 2, n = 3, w = app.current.clientWidth, h = app.current.clientHeight;
    setXY(w * 0.82, h * 0.9); setGhost({ on: true, down: false, hover: null });
    await sleep(500, t);
    progress(0, 3000, t);
    if (st.current.compact) { await click(`[data-tab="${target}"]`, t); setShown(target); await sleep(260, t); }
    const cellSel = (s) => `[data-room="${target}"][data-slot="${s}"]`;
    await move(centerOf(q(cellSel(s0))), t); setGhost((g) => ({ ...g, hover: cellSel(s0) })); await sleep(260, t);
    setGhost({ on: true, down: true, hover: null }); ripple();
    setDraft({ room: target, s: s0, n: 1 }); await sleep(160, t);
    let lastN = 1;
    await move(centerOf(q(cellSel(s0 + n - 1)), 0.82), t, 900, (e) => { const k = Math.min(n, 1 + Math.floor(e * n + 0.2)); if (k !== lastN) { lastN = k; setDraft({ room: target, s: s0, n: k }); } });
    const d = { room: target, s: s0, n }; setGhost((g) => ({ ...g, down: false }));
    await sleep(140, t); openForm(d, { titre: '', invites: [], visio: false }); await sleep(420, t);
    progress(1, 4200, t);
    await click('[data-dj-input]', t);
    const text = 'Point produit';
    for (let i = 1; i <= text.length; i++) { setForm((f) => ({ ...f, titre: text.slice(0, i) })); await sleep(text[i - 1] === ' ' ? 90 : 48 + Math.random() * 46, t); }
    await sleep(220, t);
    for (const p of ['IM', 'SL']) { await click(`[data-person="${p}"]`, t); setForm((f) => ({ ...f, invites: [...f.invites, p] })); await sleep(210, t); }
    await click('[data-dj-visio-ui]', t); setForm((f) => ({ ...f, visio: true })); await sleep(380, t);
    progress(2, 1400, t);
    await click('[data-dj-submit]', t); await confirm(); await sleep(700, t);
    progTok.current++; setStep({ i: 3, p: 1 });
    await move({ x: w + 40, y: h * 0.7 }, t, 700);
    handOver(true);
  };

  /* ---------- États ---------- */
  const reset = () => {
    token.current++; clearTimeout(loopT.current); clearTimeout(toastT.current);
    setBookings(BASE); setDraft(null); setPop(null); setForm({ titre: '', invites: [], visio: false }); setToast(null);
    setShown('verriere'); setHint(false); setGhost({ on: false, down: false, hover: null }); setStep({ i: -1, p: 0 }); interacted.current = false;
  };
  const handOver = (fromScript) => {
    token.current++; setMode('you'); setGhost({ on: false, down: false, hover: null });
    setHint(true); setTimeout(() => setHint(false), 5200);
    say('Démo terminée. À vous de jouer : choisissez un créneau libre avec les flèches puis Entrée.');
    if (fromScript && loop) {
      const wait = () => { if (interacted.current) return; if (!visible.current) { loopT.current = setTimeout(wait, 1000); return; } play(); };
      loopT.current = setTimeout(wait, 9000);
    }
  };
  const takeOver = () => {
    interacted.current = true; clearTimeout(loopT.current);
    if (st.current.mode !== 'demo') return;
    token.current++; setGhost({ on: false, down: false, hover: null }); setMode('you'); setHint(false);
    setStep((s) => ({ ...s, i: s.i === 3 ? 3 : -2 }));
    if (!st.current.pop) setDraft(null);
    say('Vous avez la main.');
  };
  const play = () => {
    reset();
    if (reduced()) { setMode('you'); setStep({ i: 3, p: 1 }); setHint(true); return; }
    setMode('demo'); st.current.mode = 'demo';
    const t = token.current;
    requestAnimationFrame(() => script(t).catch(() => {}));
  };
  useEffect(() => {
    const el = app.current; let started = false;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) { started = true; io.disconnect(); play(); } }, { threshold: 0.35 });
    io.observe(el);
    return () => { io.disconnect(); token.current++; clearTimeout(loopT.current); clearTimeout(toastT.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Interactions du visiteur ---------- */
  const drag = useRef(null);
  const onCellDown = (e, room, s) => {
    if (conflictOf(bookings, room, s, 1)) return;
    takeOver(); setPop(null);
    drag.current = { room, s, id: e.pointerId };
    setDraft({ room, s, n: 1 }); setForm({ titre: '', invites: [], visio: false });
    if (e.pointerType === 'mouse') e.currentTarget.parentElement.parentElement.setPointerCapture(e.pointerId);
  };
  const onColsMove = (e) => {
    const g = drag.current; if (!g || e.pointerId !== g.id || e.pointerType !== 'mouse') return;
    const r = q(`[data-col="${g.room}"]`).getBoundingClientRect();
    const end = Math.max(g.s, Math.min(ROWS - 1, Math.floor((e.clientY - r.top) / ROW)));
    setDraft((d) => (d && d.n !== end - g.s + 1 ? { ...d, n: end - g.s + 1 } : d));
  };
  const onColsUp = (e) => { const g = drag.current; if (!g || e.pointerId !== g.id) return; drag.current = null; placePop(st.current.draft); setTimeout(() => q('[data-dj-input]')?.focus({ preventScroll: true }), 60); };
  const onCellKey = (e, ri, s) => {
    const k = e.key;
    if (k === 'Enter' || k === ' ') { e.preventDefault(); const room = ROOMS[ri].id; if (conflictOf(bookings, room, s, 1)) return; takeOver(); openForm({ room, s, n: 1 }, { titre: '', invites: [], visio: false }); setTimeout(() => q('[data-dj-input]')?.focus({ preventScroll: true }), 60); return; }
    const d = { ArrowDown: [0, 1], ArrowUp: [0, -1], ArrowRight: [1, 0], ArrowLeft: [-1, 0], Home: [0, -99], End: [0, 99] }[k]; if (!d) return;
    e.preventDefault(); if (compact) d[0] = 0;
    const nr = Math.max(0, Math.min(ROOMS.length - 1, ri + d[0])), ns = Math.max(0, Math.min(ROWS - 1, s + d[1]));
    setFocus({ room: ROOMS[nr].id, s: ns }); q(`[data-room="${ROOMS[nr].id}"][data-slot="${ns}"]`)?.focus({ preventScroll: true });
  };
  const removeEdit = () => {
    const b = bookings.find((x) => x.id === draft?.editId); if (!b) return closeForm();
    setBookings((l) => l.filter((x) => x.id !== b.id)); closeForm();
    showToast('Réservation supprimée', () => setBookings((l) => [...l, { ...b, fresh: true }]));
  };

  const bad = draft ? conflictOf(bookings, draft.room, draft.s, draft.n, draft.editId) : null;
  useEffect(() => { if (draft && pop) placePop(draft); /* suit la taille et le message de conflit */ }, [compact, !!bad]); // eslint-disable-line react-hooks/exhaustive-deps
  const touch = pointer === 'doigt' || (pointer === 'auto' && compact);
  const hov = (sel) => ghost.hover === sel;
  const focusRing = 'focus-visible:outline focus-visible:outline-[length:var(--focus-width)] focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-[var(--focus-offset)]';
  const btn = `relative inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border px-[18px] text-[15px] font-medium transition-[background,transform] duration-300 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] active:scale-[.97] ${focusRing}`;
  const primary = 'border-transparent bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]';
  const ghostBtn = 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-strong)] hover:bg-[var(--raised)]';

  return (
    <section aria-labelledby="dj-title" className={`mx-auto grid w-full max-w-[1200px] grid-cols-1 items-start px-4 py-10 font-[family-name:var(--font-sans)] text-[var(--text)] min-[900px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] min-[900px]:items-center min-[900px]:gap-14 min-[900px]:px-10 min-[900px]:py-16 ${className}`}>
      <style>{`@keyframes dj-in{from{opacity:0;transform:scale(.92) translateY(4px)}to{opacity:1;transform:none}}@keyframes dj-sheet{from{transform:translateY(100%)}to{transform:none}}@keyframes dj-pop{0%{transform:scale(.94)}55%{transform:scale(1.03)}100%{transform:none}}@keyframes dj-ripple{from{transform:scale(.3);opacity:.9}to{transform:scale(1.4);opacity:0}}@keyframes dj-drop{from{opacity:0;transform:translate(-50%,-10px)}to{opacity:1;transform:translateX(-50%)}}@keyframes dj-spin{to{transform:rotate(1turn)}}.dj-ripple{animation:dj-ripple 520ms cubic-bezier(.2,0,0,1) forwards}@media (prefers-reduced-motion:reduce){.dj-ripple{display:none}}`}</style>
      <div className="contents min-[900px]:block">
        <span className="mb-6 inline-flex items-center gap-2 justify-self-start text-[var(--text-strong)] min-[900px]:mb-8">
          <svg viewBox="0 0 100 100" aria-hidden="true" className="h-7 w-7"><rect width="100" height="100" rx="28" fill="var(--accent)" /><path d="M28 80V48a22 22 0 0 1 44 0v32Z" fill="var(--accent-fg)" /><path d="M40 80V62a10 10 0 0 1 20 0v18Z" fill="var(--accent)" /></svg>
          <span className="text-lg font-semibold tracking-[-0.03em]">alcôve</span>
        </span>
        <p className="mb-3 text-sm font-medium text-[var(--accent)] dark:text-[var(--accent-vivid)]">Réservation de salles</p>
        <h2 id="dj-title" className="text-balance text-[clamp(2rem,1.4rem+1.8vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-[var(--text-strong)]">Une salle libre, trois clics, aucun aller-retour.</h2>
        <p className="mt-4 max-w-[46ch] text-pretty text-base leading-[1.55] text-[var(--text-muted)] min-[900px]:text-[17px]">Alcôve affiche les disponibilités en direct, bloque le créneau et prévient les invités. Regardez la démo, puis essayez vous-même : c’est la vraie interface.</p>
        {showSteps && (
          <ol className="order-6 mt-6 grid list-none grid-cols-3 gap-2 p-0 min-[900px]:mt-8 min-[900px]:grid-cols-1 min-[900px]:gap-1">
            {STEPS.map(([t, sub], k) => {
              const active = step.i === k, done = k < step.i || step.i === 3;
              return (
                <li key={t} className={`relative grid gap-2 rounded-xl border border-[var(--border)] px-2.5 pb-4 pt-3 transition-colors duration-[var(--motion-slow)] min-[900px]:grid-cols-[32px_1fr] min-[900px]:gap-3 min-[900px]:border-transparent min-[900px]:pl-3 min-[900px]:pr-4 ${active ? 'bg-[var(--raised)]' : 'bg-[var(--surface)] min-[900px]:bg-transparent'}`}>
                  <span aria-hidden="true" className={`grid h-7 w-7 place-items-center rounded-full border font-[family-name:var(--font-mono)] text-[13px] font-medium transition-colors duration-[var(--motion-slow)] min-[900px]:h-8 min-[900px]:w-8 ${done ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]' : active ? 'border-[var(--accent)] bg-[var(--surface)] text-[var(--accent)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'}`}>{k + 1}</span>
                  <span className="grid gap-0.5 min-[900px]:pt-[5px]">
                    <strong className="text-sm font-semibold leading-tight text-[var(--text-strong)] min-[900px]:text-[15px]">{t}</strong>
                    <span className="hidden text-sm leading-[1.45] text-[var(--text-muted)] min-[900px]:block">{sub}</span>
                  </span>
                  <span aria-hidden="true" className={`absolute bottom-1 left-2.5 right-2.5 h-0.5 overflow-hidden rounded-full bg-[var(--border)] transition-opacity min-[900px]:left-14 min-[900px]:right-4 ${active ? 'opacity-100' : 'opacity-0'}`}>
                    <i className="block h-full w-full origin-left bg-[var(--accent)]" style={{ transform: `scaleX(${active ? step.p : 0})` }} />
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        <div className="order-7 mt-4 flex gap-2 min-[900px]:mt-8">
          {mode === 'demo' && (
            <button type="button" onClick={() => { takeOver(); setFocus({ room: shown, s: 0 }); }} className={`${btn} ${primary} min-w-0 flex-1 min-[900px]:flex-none`}>
              <Icon d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12m0-1.5a1.5 1.5 0 0 1 3 0V12m0-1a1.5 1.5 0 0 1 3 0v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.6-2.2L4.3 16a1.6 1.6 0 0 1 2.4-2.1L8 15" />Prendre la main
            </button>
          )}
          <button type="button" onClick={play} className={`${btn} ${mode === 'demo' ? ghostBtn : primary} min-w-0 flex-1 min-[900px]:flex-none`}>
            <Icon d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" />Revoir la démo
          </button>
        </div>
      </div>

      <div ref={app} role="group" aria-label="Interface Alcôve : planning des salles du jeudi 13 novembre"
        onPointerDownCapture={(e) => { if (mode === 'demo') takeOver(); }}
        onKeyDownCapture={(e) => { if (mode === 'demo' && e.key !== 'Tab') takeOver(); }}
        className="relative isolate order-5 mt-8 touch-pan-y select-none overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] min-[900px]:mt-0">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-[-20%] top-[-40%] -z-10 h-[80%] bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--accent)_9%,transparent),transparent)]" />
        <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] py-3 pl-2 pr-3">
          <div className="flex min-w-0 items-center gap-1">
            <button type="button" disabled aria-label="Jour précédent" className="grid h-9 w-9 place-items-center rounded-lg text-[var(--text-muted)] opacity-55"><Icon d="m14 6-6 6 6 6" /></button>
            <span className="grid min-w-0 px-1"><strong className="text-[15px] font-semibold text-[var(--text-strong)]">Jeu. 13 nov.</strong><span className="max-w-[140px] truncate text-[13px] text-[var(--text-muted)] min-[560px]:max-w-none">Lyon · Part-Dieu, 3ᵉ étage</span></span>
            <button type="button" disabled aria-label="Jour suivant" className="grid h-9 w-9 place-items-center rounded-lg text-[var(--text-muted)] opacity-55"><Icon d="m10 6 6 6-6 6" /></button>
          </div>
          <span className={`inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-full border px-3 text-[13px] font-medium ${mode === 'you' ? 'border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)] text-[var(--text-strong)]' : 'border-[var(--border)] bg-[var(--raised)]'}`}>
            <i className={`h-2 w-2 rounded-full ${mode === 'you' ? 'bg-[var(--up)]' : mode === 'demo' ? 'animate-pulse bg-[var(--accent)]' : 'bg-[var(--text-muted)]'}`} aria-hidden="true" />
            {mode === 'demo' ? 'Démo en cours' : 'À vous de jouer'}
          </span>
        </header>

        {compact && (
          <div role="tablist" aria-label="Salle" className="flex gap-1 border-b border-[var(--border)] p-2"
            onKeyDown={(e) => { const i = ROOMS.findIndex((r) => r.id === shown), d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return; e.preventDefault(); const n = ROOMS[(i + d + ROOMS.length) % ROOMS.length].id; setShown(n); q(`[data-tab="${n}"]`)?.focus(); }}>
            {ROOMS.map((r) => (
              <button key={r.id} type="button" role="tab" data-tab={r.id} aria-selected={shown === r.id} tabIndex={shown === r.id ? 0 : -1} onClick={() => setShown(r.id)}
                className={`grid min-h-11 flex-1 place-items-center rounded-lg text-sm font-medium leading-tight ${focusRing} ${shown === r.id ? 'bg-[var(--raised)] text-[var(--text-strong)] shadow-[inset_0_0_0_1px_var(--border)]' : 'text-[var(--text-muted)]'}`}>
                {r.nom}<small className="text-xs font-normal text-[var(--text-muted)]">{r.places} pl.</small>
              </button>
            ))}
          </div>
        )}

        <div className={`relative pb-4 pr-3 ${compact ? 'pt-3' : ''}`}>
          {!compact && (
            <div aria-hidden="true" className="grid h-[52px] grid-cols-[56px_repeat(3,minmax(0,1fr))] items-center gap-x-2">
              <span />
              {ROOMS.map((r) => <span key={r.id} className="grid leading-tight"><strong className="text-sm font-semibold text-[var(--text-strong)]">{r.nom}</strong><span className="text-xs text-[var(--text-muted)]">{r.places} places</span></span>)}
            </div>
          )}
          <div className="grid grid-cols-[56px_1fr]">
            <div aria-hidden="true">
              {Array.from({ length: ROWS }, (_, i) => <div key={i} style={{ height: ROW }} className="-translate-y-1.5 pr-3 text-right font-[family-name:var(--font-mono)] text-xs font-medium tabular-nums text-[var(--text-muted)]">{i % 2 ? '' : fmt(i)}</div>)}
            </div>
            <div role="grid" aria-label="Créneaux par salle, de 9 h à 13 h" onPointerMove={onColsMove} onPointerUp={onColsUp} onPointerCancel={() => { drag.current = null; }}
              className={`grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-3'}`}>
              {ROOMS.map((r, ri) => (compact && r.id !== shown ? null : (
                <div key={r.id} role="row" data-col={r.id} aria-label={r.nom} className="relative grid rounded-lg bg-[linear-gradient(var(--border)_1px,transparent_1px)]" style={{ gridAutoRows: ROW, backgroundSize: `100% ${ROW * 2}px` }}>
                  {Array.from({ length: ROWS }, (_, s) => {
                    const busy = conflictOf(bookings, r.id, s, 1), sel = `[data-room="${r.id}"][data-slot="${s}"]`;
                    return (
                      <button key={s} type="button" role="gridcell" data-room={r.id} data-slot={s} aria-disabled={!!busy}
                        tabIndex={focus.room === r.id && focus.s === s ? 0 : -1}
                        aria-label={`${r.nom}, ${fmt(s)}, ${busy ? 'occupé : ' + busy.titre : 'libre'}`}
                        onPointerDown={(e) => onCellDown(e, r.id, s)} onKeyDown={(e) => onCellKey(e, ri, s)} onFocus={() => setFocus({ room: r.id, s })}
                        className={`group relative rounded-lg ${busy ? 'pointer-events-none' : 'cursor-pointer'} ${focusRing}`}>
                        <span aria-hidden="true" className={`absolute inset-[3px] grid place-items-center rounded-md border border-dashed border-[var(--border-control)] text-lg font-light text-[var(--text-muted)] transition-[opacity,transform] duration-[var(--motion-base)] group-hover:scale-100 group-hover:opacity-100 group-focus-visible:opacity-100 ${hov(sel) ? 'scale-100 opacity-100' : 'scale-[.96] opacity-0'}`}>+</span>
                      </button>
                    );
                  })}
                  {bookings.filter((b) => b.room === r.id).map((b) => {
                    const El = b.mine ? 'button' : 'div';
                    return (
                      <El key={b.id} type={b.mine ? 'button' : undefined} aria-hidden={b.mine ? undefined : true}
                        aria-label={b.mine ? `${b.titre}, ${fmt(b.s)} – ${fmt(b.s + b.n)}, votre réservation : modifier` : undefined}
                        onClick={b.mine ? () => { if (mode !== 'demo') openForm({ room: b.room, s: b.s, n: b.n, editId: b.id }, { titre: b.titre, invites: b.invites || [], visio: !!b.visio }); } : undefined}
                        style={{ top: b.s * ROW + 2, height: b.n * ROW - 4, animation: b.fresh ? `dj-pop 560ms ${SPRING}` : undefined }}
                        className={`absolute inset-x-[3px] z-[2] grid content-start gap-px overflow-hidden rounded-lg border px-2.5 py-1.5 text-left text-sm leading-[1.3] min-[560px]:text-[13px] ${b.mine ? `cursor-pointer border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)] ${focusRing}` : TINT[b.tint]}`}>
                        <strong className="truncate font-semibold">{b.titre}</strong>
                        {b.n > 1 && <span className="whitespace-nowrap font-[family-name:var(--font-mono)] text-[11.5px] font-medium tabular-nums opacity-90">{fmt(b.s)} – {fmt(b.s + b.n)}</span>}
                      </El>
                    );
                  })}
                  {draft && draft.room === r.id && (
                    <div aria-hidden="true" style={{ top: draft.s * ROW + 2, height: draft.n * ROW - 4, transitionTimingFunction: 'cubic-bezier(.34,1.3,.64,1)' }}
                      className={`absolute inset-x-[3px] z-[3] grid content-start gap-px overflow-hidden rounded-lg border-[1.5px] border-dashed px-2.5 py-1.5 text-sm leading-[1.3] transition-[top,height] duration-[380ms] min-[560px]:text-[13px] ${bad ? 'border-[var(--down)] bg-[var(--tint-red-bg)] text-[var(--tint-red-fg)]' : 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--text-strong)]'}`}>
                      <strong className="truncate font-semibold">{form.titre.trim() || 'Nouvelle réservation'}</strong>
                      <span className="font-[family-name:var(--font-mono)] text-[11.5px] font-medium tabular-nums opacity-90">{fmt(draft.s)} – {fmt(draft.s + draft.n)}</span>
                      <i className="absolute bottom-1 left-1/2 -ml-3 h-1 w-6 rounded-full bg-current opacity-35" />
                    </div>
                  )}
                </div>
              )))}
            </div>
          </div>
          {hint && (
            <p className="pointer-events-none absolute left-1/2 top-2 z-[3] flex w-max max-w-[calc(100%-24px)] items-center gap-2 rounded-xl bg-[var(--text-strong)] px-3 py-2.5 text-sm text-[var(--bg)] shadow-[var(--shadow-toast)]" style={{ transform: 'translateX(-50%)', animation: `dj-drop 460ms ${SPRING}` }}>
              <Icon className="h-[18px] w-[18px]" d="M12 3v3M5.6 5.6l2.1 2.1M3 12h3m12.4-6.4-2.1 2.1M12 21l-2.5-8.5L18 15l-3.6 1.4Z" />À vous : choisissez un créneau libre, ou glissez sur plusieurs.
            </p>
          )}
        </div>

        {pop && draft && (
          <form data-dj-pop aria-labelledby="dj-pop-title" noValidate
            onSubmit={(e) => { e.preventDefault(); if (mode !== 'demo') confirm(); }}
            onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); closeForm(); q(`[data-room="${focus.room}"][data-slot="${focus.s}"]`)?.focus(); } }}
            style={pop.sheet ? { animation: `dj-sheet 380ms ${SPRING}` } : { left: pop.x, top: pop.y, transformOrigin: pop.origin, animation: `dj-in 380ms ${SPRING}` }}
            className={`absolute z-[5] m-0 grid gap-3 border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-popover)] ${pop.sheet ? 'inset-x-0 bottom-0 rounded-t-2xl border-t' : 'w-[304px] rounded-2xl border'}`}>
            <div className="-mr-1.5 -mt-1 flex items-start justify-between gap-2">
              <div>
                <p className="text-[13px] text-[var(--text-muted)]">{roomOf(draft.room).nom} · {roomOf(draft.room).places} places</p>
                <h3 id="dj-pop-title" className="mt-0.5 text-lg font-semibold tabular-nums tracking-[-0.02em] text-[var(--text-strong)]">{fmt(draft.s)} – {fmt(draft.s + draft.n)}</h3>
              </div>
              <button type="button" onClick={() => closeForm()} aria-label="Fermer" className={`grid h-9 w-9 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--state-hover)] hover:text-[var(--text-strong)] ${focusRing}`}><Icon d="M6 6l12 12M18 6 6 18" /></button>
            </div>
            <label className="grid gap-1.5">
              <span className="text-[13px] font-medium text-[var(--text-muted)]">Titre</span>
              <input data-dj-input type="text" value={form.titre} maxLength={40} autoComplete="off" placeholder="Ex. Point produit" onChange={(e) => setForm({ ...form, titre: e.target.value })}
                className="h-10 select-text rounded-lg border border-[var(--border-control)] bg-[var(--surface)] px-3 text-base text-[var(--text-strong)] outline-none focus:border-[var(--focus-ring)] focus:shadow-[0_0_0_3px_var(--accent-subtle)]" />
            </label>
            <fieldset className="m-0 grid min-w-0 gap-1.5 border-0 p-0">
              <legend className="mb-1.5 p-0 text-[13px] font-medium text-[var(--text-muted)]">Durée</legend>
              <div role="radiogroup" aria-label="Durée" className="grid grid-cols-4 gap-0.5 rounded-[10px] border border-[var(--border)] bg-[var(--raised)] p-[3px]"
                onKeyDown={(e) => { const d = ['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(e.key) ? -1 : 0; if (!d) return; e.preventDefault(); const n = DURS[Math.max(0, Math.min(3, DURS.indexOf(draft.n) + d))]; if (draft.s + n <= ROWS) setDraft({ ...draft, n }); }}>
                {DURS.map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={draft.n === n} tabIndex={draft.n === n ? 0 : -1} disabled={draft.s + n > ROWS} onClick={() => setDraft({ ...draft, n })}
                    className={`min-h-[34px] rounded-lg text-[13px] font-medium tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${focusRing} ${draft.n === n ? 'bg-[var(--surface)] text-[var(--text-strong)] shadow-[0_0_0_1px_var(--border),var(--shadow-overlay)]' : 'text-[var(--text-muted)]'}`}>{durLabel(n)}</button>
                ))}
              </div>
            </fieldset>
            <fieldset className="m-0 grid min-w-0 gap-1.5 border-0 p-0">
              <legend className="mb-1.5 p-0 text-[13px] font-medium text-[var(--text-muted)]">Invités</legend>
              <div className="flex flex-wrap gap-1.5">
                {PEOPLE.map((p) => {
                  const on = form.invites.includes(p.i), sel = `[data-person="${p.i}"]`;
                  return (
                    <button key={p.i} type="button" data-person={p.i} aria-pressed={on} onClick={() => setForm({ ...form, invites: on ? form.invites.filter((x) => x !== p.i) : [...form.invites, p.i] })}
                      className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border py-0 pl-1 pr-3 text-[13px] transition-[background,border-color,transform] duration-300 active:scale-95 ${focusRing} ${on ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--text-strong)]' : 'border-[var(--border)] bg-[var(--surface)]'} ${hov(sel) ? 'scale-95' : ''}`}>
                      <b aria-hidden="true" className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-semibold ${on ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : 'bg-[var(--raised)] text-[var(--text-muted)]'}`}>{p.i}</b>{p.n}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
              <span className="grid"><strong className="text-sm font-medium text-[var(--text-strong)]">Écran et visio</strong><small className="text-[13px] text-[var(--text-muted)]">Lien ajouté à l’invitation</small></span>
              <input data-dj-visio type="checkbox" role="switch" checked={form.visio} onChange={(e) => setForm({ ...form, visio: e.target.checked })} className="peer sr-only" />
              <i data-dj-visio-ui aria-hidden="true" className={`relative h-6 w-10 flex-none rounded-full transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus-ring)] ${form.visio ? 'bg-[var(--accent)]' : 'bg-[var(--border-control)]'}`}>
                <i className={`absolute left-[3px] top-[3px] h-[18px] w-[18px] rounded-full transition-transform duration-[360ms] ${form.visio ? 'translate-x-4 bg-[var(--accent-fg)]' : 'bg-[var(--surface)]'}`} style={{ transitionTimingFunction: 'cubic-bezier(.34,1.56,.64,1)' }} />
              </i>
            </label>
            {bad && <p role="alert" className="-mt-1 rounded-lg bg-[var(--tint-red-bg)] px-2.5 py-2 text-[13px] leading-[1.4] text-[var(--tint-red-fg)]">Chevauche « {bad.titre} » ({fmt(bad.s)} – {fmt(bad.s + bad.n)}). Raccourcissez la durée.</p>}
            <div className="flex justify-end gap-2 pt-0.5">
              <button type="button" onClick={() => (draft.editId ? removeEdit() : closeForm())} className={`${btn} ${ghostBtn} min-h-10 px-3.5 text-sm`}>{draft.editId ? 'Supprimer' : 'Annuler'}</button>
              <button data-dj-submit type="submit" disabled={!!bad || loading} className={`${btn} ${primary} min-h-10 px-3.5 text-sm disabled:cursor-not-allowed ${bad ? 'disabled:opacity-50' : ''}`}>
                {loading && <span aria-hidden="true" className="h-4 w-4 rounded-full border-2 border-current border-r-transparent" style={{ animation: 'dj-spin 700ms linear infinite' }} />}
                {loading ? (draft.editId ? 'Enregistrement…' : 'Réservation…') : draft.editId ? 'Enregistrer' : 'Réserver'}
              </button>
            </div>
          </form>
        )}

        <div role="status" aria-live="polite"
          className={`absolute bottom-4 left-1/2 z-[6] flex w-max max-w-[calc(100%-32px)] items-center gap-2.5 rounded-xl bg-[var(--text-strong)] py-2.5 pl-3.5 pr-2.5 text-sm text-[var(--bg)] shadow-[var(--shadow-toast)] transition-[transform,opacity] duration-[460ms] ${toast ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
          style={{ transform: `translate(-50%, ${toast ? '0' : 'calc(100% + 24px)'})`, transitionTimingFunction: SPRING }}>
          {toast && <><Icon className="h-[18px] w-[18px]" d="m5 12.5 4.5 4.5L19 7.5" /><span>{toast.msg}</span>
            {toast.undo && mode !== 'demo' && <button type="button" onClick={() => { clearTimeout(toastT.current); setToast(null); toast.undo(); }} className="min-h-8 rounded-lg px-2.5 text-sm font-semibold underline underline-offset-[3px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--bg)]">Annuler</button>}</>}
        </div>

        <div ref={ghostEl} aria-hidden="true" className={`pointer-events-none absolute left-0 top-0 z-[9] transition-opacity duration-[260ms] will-change-transform ${ghost.on ? 'opacity-100' : 'opacity-0'}`}>
          {touch
            ? <span className={`-ml-[18px] -mt-[18px] block h-9 w-9 rounded-full border-2 border-[color-mix(in_srgb,var(--text-strong)_65%,transparent)] bg-[color-mix(in_srgb,var(--text-strong)_20%,transparent)] transition-transform duration-150 ${ghost.down ? 'scale-[.78]' : ''}`} />
            : <svg viewBox="0 0 24 24" className={`-ml-1 -mt-[3px] block h-[22px] w-[22px] fill-[var(--text-strong)] stroke-[var(--surface)] [stroke-width:1.5] transition-transform duration-150 drop-shadow-[0_2px_3px_var(--scrim)] ${ghost.down ? 'scale-[.86]' : ''}`}><path d="M5 3.5 19 11l-6.2 1.6L9.6 19Z" /></svg>}
          {cursorLabel && <span className={`absolute whitespace-nowrap rounded-[999px_999px_999px_4px] bg-[var(--accent)] px-2 py-[3px] text-xs font-semibold text-[var(--accent-fg)] ${touch ? 'left-[18px] top-3.5' : 'left-3.5 top-4'}`}>{cursorLabel}</span>}
        </div>
      </div>
      <p aria-live="polite" className="sr-only">{live}</p>
    </section>
  );
}

export default DemoJouable;
