// Checklist de démarrage — React + Tailwind CSS. Aucune dépendance.
// <Checklist tasks={TASKS} layout="card" initialDone={3} confetti={true} confettiCount={70} autoNext={true} stiffness={210} damping={20} />
// Anneau de progression à ressort (rAF, en pause hors écran), coche dessinée, titre barré, ouverture de l'étape suivante,
// confettis canvas aux couleurs de la palette quand tout est fait. En carte ou en lanceur flottant.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * @typedef {{ key: string, title: string, minutes: number, text: string, action: string, secondary?: string }} Task
 * @typedef {Object} ChecklistProps
 * @property {Task[]} tasks
 * @property {'card'|'launcher'} [layout]
 * @property {number} [initialDone]        nombre de tâches déjà faites au montage
 * @property {boolean} [confetti]
 * @property {number} [confettiCount]
 * @property {boolean} [autoNext]          ouvre l'étape suivante après une coche
 * @property {number} [stiffness]          ressort de l'anneau
 * @property {number} [damping]
 * @property {string} [title]
 * @property {string} [doneTitle]
 * @property {(task: Task) => Promise<void>|void} [onAction]   action principale d'une étape ; la tâche se coche quand la promesse se résout
 * @property {(state: { done: number, total: number, complete: boolean }) => void} [onChange]
 * @property {React.ReactNode} [footer]   contenu affiché une fois tout terminé
 */

const SPRING = 'linear(0,.009,.035 2.1%,.141,.281 6.7%,.723 12.9%,.938 16.7%,1.017,1.077,1.121,1.149 24.3%,1.159,1.163,1.161,1.154 29.9%,1.129 32.8%,1.051 39.6%,1.017 43.1%,.991,.977 51%,.974 53.8%,.975 57.1%,.997 69.8%,1.003 76.9%,1)';
const CSS = `
.ckr{--ckr-spring:cubic-bezier(.34,1.56,.64,1)}@supports (transition-timing-function:linear(0,1)){.ckr{--ckr-spring:${SPRING}}}
.ckr-tick{stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 320ms cubic-bezier(.65,0,.35,1) 90ms}
.ckr-done .ckr-tick{stroke-dashoffset:0}
.ckr-pop circle{animation:ckr-pop 560ms var(--ckr-spring)}
.ckr-name::after{content:"";position:absolute;left:0;right:0;top:50%;height:1.5px;margin-top:-.5px;background:currentColor;transform:scaleX(0);transform-origin:left;transition:transform 380ms cubic-bezier(.65,0,.35,1) 120ms}
.ckr-done .ckr-name::after{transform:scaleX(1)}
.ckr-roll-up{animation:ckr-up 420ms var(--ckr-spring)}.ckr-roll-down{animation:ckr-down 420ms var(--ckr-spring)}
.ckr-swap{animation:ckr-swap 420ms cubic-bezier(.2,0,0,1)}
.ckr-sp{transition-timing-function:var(--ckr-spring)}
@keyframes ckr-pop{from{transform:scale(.6)}}@keyframes ckr-up{from{transform:translateY(70%);opacity:0}}@keyframes ckr-down{from{transform:translateY(-70%);opacity:0}}
@keyframes ckr-swap{from{opacity:0;transform:translateY(6px)}}
@media (prefers-reduced-motion:reduce){.ckr *{animation:none!important;transition:none!important}}`;

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Ressort amorti sur une valeur : renvoie la valeur animée. Pause quand `active` est faux. */
function useSpring(target, { stiffness = 210, damping = 20, active = true } = {}) {
  const [x, setX] = useState(target);
  const s = useRef({ x: target, v: 0 });
  useEffect(() => {
    if (reduced()) { s.current = { x: target, v: 0 }; setX(target); return; }
    if (!active) return;
    let raf, last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      for (let t = 0; t < dt; t += 1 / 120) { const h = Math.min(1 / 120, dt - t); s.current.v += (-stiffness * (s.current.x - target) - damping * s.current.v) * h; s.current.x += s.current.v * h; }
      setX(s.current.x);
      if (Math.abs(s.current.x - target) < 5e-4 && Math.abs(s.current.v) < 5e-4) { s.current = { x: target, v: 0 }; setX(target); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, stiffness, damping, active]);
  return x;
}

/** Confettis sur un canvas plein écran, couleurs lues dans les variables de tokens. */
function useConfetti() {
  const ref = useRef(null);
  const burst = useCallback((x, y, n = 70) => {
    const c = ref.current; if (!c || reduced()) return;
    const ctx = c.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    const cs = getComputedStyle(c), pal = ['--accent', '--accent-vivid', '--accent-subtle-border', '--border-strong'].map((v) => cs.getPropertyValue(v).trim());
    let parts = Array.from({ length: n }, (_, i) => {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.95, sp = 420 + Math.random() * 620;
      return { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 14, s: 5 + Math.random() * 4, round: Math.random() < 0.28, c: pal[i % pal.length], w: 6 + Math.random() * 8, t: 0, life: 1.3 + Math.random() * 0.9 };
    });
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      parts = parts.filter((p) => p.t < p.life);
      for (const p of parts) {
        p.t += dt; p.vy += 1500 * dt; p.vx *= 0.12 ** dt; p.vy *= 0.32 ** dt;
        p.x += (p.vx + Math.sin(p.t * p.w) * 24) * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        ctx.save(); ctx.globalAlpha = Math.min(1, (p.life - p.t) / 0.45); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.s * 0.45, 0, 6.283); ctx.fill(); }
        else { const k = Math.abs(Math.cos(p.t * p.w)); ctx.fillRect(-p.s / 2, -p.s * 0.8 * k - 0.5, p.s, p.s * 1.6 * k + 1); }
        ctx.restore();
      }
      if (parts.length) requestAnimationFrame(frame); else ctx.clearRect(0, 0, c.width, c.height);
    };
    requestAnimationFrame(frame);
  }, []);
  return [ref, burst];
}

function Ring({ value, size = 64, stroke = 6, children }) {
  const r = (size - stroke) / 2;
  return (
    <span aria-hidden="true" className="relative block flex-none" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-[var(--raised)]" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" pathLength="100" strokeDasharray="100 100"
          strokeDashoffset={100 - Math.max(0, Math.min(1, value)) * 100} className="stroke-[var(--accent)]" />
      </svg>
      {children}
    </span>
  );
}

/** @param {ChecklistProps} props */
export function Checklist({ tasks, layout = 'card', initialDone = 3, confetti = true, confettiCount = 70, autoNext = true, stiffness = 210, damping = 20,
  title = 'Ouvrez votre boutique', doneTitle = 'Votre boutique est en ligne', onAction, onChange, footer }) {
  useEffect(() => { if (!document.getElementById('ckr-css')) { const s = document.createElement('style'); s.id = 'ckr-css'; s.textContent = CSS; document.head.appendChild(s); } }, []);
  const total = tasks.length;
  const [done, setDone] = useState(() => new Set(tasks.slice(0, initialDone).map((t) => t.key)));
  const [open, setOpen] = useState(() => tasks[initialDone]?.key ?? null);
  const [busy, setBusy] = useState(null);
  const [pop, setPop] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [onScreen, setOnScreen] = useState(true);
  const [live, setLive] = useState('');
  const root = useRef(null), ring = useRef(null), launcherBtn = useRef(null), prevN = useRef(done.size), roll = useRef('');
  const [canvas, burst] = useConfetti();
  const n = done.size, complete = n === total;
  const p = useSpring(n / total, { stiffness, damping, active: onScreen });
  const minutes = tasks.reduce((s, t) => s + (done.has(t.key) ? 0 : t.minutes), 0);

  useEffect(() => { setDone(new Set(tasks.slice(0, initialDone).map((t) => t.key))); setOpen(tasks[initialDone]?.key ?? null); prevN.current = initialDone; }, [initialDone, tasks]);
  useEffect(() => { const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting)); io.observe(root.current); return () => io.disconnect(); }, []);
  useLayoutEffect(() => { roll.current = n > prevN.current ? 'ckr-roll-up' : n < prevN.current ? 'ckr-roll-down' : ''; }, [n]);
  useEffect(() => {
    onChange?.({ done: n, total, complete });
    if (complete && prevN.current < total && confetti) {
      const t = setTimeout(() => { const r = ring.current?.getBoundingClientRect(); if (r) burst(r.left + r.width / 2, r.top + r.height / 2, confettiCount); }, 260);
      prevN.current = n; return () => clearTimeout(t);
    }
    prevN.current = n;
  }, [n]);

  function toggle(task, on = !done.has(task.key)) {
    setDone((d) => { const nd = new Set(d); on ? nd.add(task.key) : nd.delete(task.key); return nd; });
    const count = n + (on ? 1 : -1);
    setLive(`${on ? 'Étape terminée\u00a0: ' : 'Étape à refaire\u00a0: '}${task.title}. ${count} sur ${total}.`);
    if (!on) return;
    setPop(task.key); setTimeout(() => setPop(null), 600);
    setOpen(null);
    if (autoNext) {
      const i = tasks.indexOf(task), next = [...tasks.slice(i + 1), ...tasks.slice(0, i)].find((t) => t.key !== task.key && !done.has(t.key));
      if (next) setTimeout(() => setOpen(next.key), reduced() ? 0 : 220);
    }
  }
  async function act(task) {
    if (busy) return;
    setBusy(task.key);
    await (onAction ? onAction(task) : new Promise((r) => setTimeout(r, reduced() ? 0 : 650)));
    setBusy(null); toggle(task, true);
  }

  const launcher = layout === 'launcher';
  const btn = 'inline-flex items-center justify-center gap-2 h-11 sm:h-9 px-3.5 rounded-lg border text-[15px] sm:text-sm font-medium whitespace-nowrap transition-transform active:scale-[.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]';

  return (
    <section ref={root} aria-labelledby="ckr-title" onKeyDown={(e) => { if (launcher && e.key === 'Escape') { setExpanded(false); launcherBtn.current?.focus(); } }}
      className={`ckr font-sans text-[var(--text)] ${launcher ? 'fixed sm:absolute inset-x-3 sm:inset-x-auto bottom-3 sm:bottom-6 sm:right-6 z-10 grid justify-items-stretch sm:justify-items-end gap-3' : 'relative'}`}>
      <div inert={launcher && !expanded ? '' : undefined}
        className={`relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl ${launcher ? `w-full sm:w-[400px] max-h-[calc(100vh-96px)] overflow-y-auto shadow-[var(--shadow-popover)] origin-bottom sm:origin-[calc(100%-48px)_calc(100%+24px)] transition-[opacity,transform] duration-[420ms] ckr-sp ${expanded ? 'opacity-100 scale-100' : 'opacity-0 scale-[.88] translate-y-2 pointer-events-none invisible'}` : ''}`}>
        <header className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4">
          <span ref={ring}>
            <Ring value={p}>
              <span className={`absolute inset-0 flex items-baseline justify-center pt-5 tabular-nums text-[var(--text-strong)] transition-[opacity,transform] duration-300 ckr-sp ${complete ? 'opacity-0 scale-[.6]' : ''}`}>
                <span key={n} className={`inline-block text-xl leading-6 font-semibold tracking-[-0.02em] ${roll.current}`}>{n}</span>
                <span className="text-[13px] text-[var(--text-muted)]">/{total}</span>
              </span>
              <svg viewBox="0 0 24 24" className={`absolute inset-0 m-auto w-7 h-7 fill-none stroke-[var(--accent)] [stroke-width:2.25] transition-opacity ${complete ? 'opacity-100 ckr-done' : 'opacity-0'}`} strokeLinecap="round" strokeLinejoin="round">
                <path d="M6.5 12.5l3.5 3.5 7.5-8" pathLength="1" className="ckr-tick [transition-delay:260ms]" />
              </svg>
            </Ring>
          </span>
          <div className="flex-1 min-w-0">
            <h2 id="ckr-title" key={complete ? 'd' : 't'} className="ckr-swap m-0 text-[17px] leading-6 font-semibold tracking-[-0.01em] text-[var(--text-strong)]">{complete ? doneTitle : title}</h2>
            <p key={`${n}`} className="ckr-swap mt-0.5 mb-0 text-sm leading-5 text-[var(--text-muted)] tabular-nums">
              {complete ? `Les ${total} étapes sont faites. Bravo\u00a0!` : `Encore ${total - n} ${total - n > 1 ? 'étapes' : 'étape'} · environ ${minutes}\u00a0min`}
            </p>
          </div>
          {launcher && (
            <button type="button" aria-label="Fermer le guide" onClick={() => { setExpanded(false); launcherBtn.current?.focus(); }}
              className="grid place-items-center w-10 h-10 -mr-2 -mt-2 self-start rounded-lg text-[var(--text-muted)] hover:bg-[var(--state-hover)] hover:text-[var(--text-strong)]">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          )}
        </header>
        <div aria-hidden="true" className="h-px mx-4 sm:mx-5 bg-[var(--border)]" />
        <ol role="list" className="m-0 p-1 sm:p-2 list-none">
          {tasks.map((t) => {
            const isDone = done.has(t.key), isOpen = open === t.key;
            return (
              <li key={t.key} className={`rounded-xl transition-colors ${isOpen ? 'bg-[var(--raised)]' : ''} ${isDone ? 'ckr-done' : ''}`}>
                <div className="flex items-center">
                  <button type="button" role="checkbox" aria-checked={isDone} aria-label={t.title} onClick={() => toggle(t)}
                    className={`group grid place-items-center flex-none w-11 h-14 sm:h-12 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[var(--focus-ring)] ${pop === t.key && !reduced() ? 'ckr-pop' : ''}`}>
                    <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] overflow-visible" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" strokeWidth="1.5" className={`[transform-box:fill-box] origin-center transition-colors ${isDone ? 'fill-[var(--accent)] stroke-[var(--accent)]' : 'fill-transparent stroke-[var(--border-control)] group-hover:stroke-[var(--text-strong)]'}`} />
                      <path d="M7.5 12.3l3 3 6-6.3" pathLength="1" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ckr-tick stroke-[var(--accent-fg)]" />
                    </svg>
                  </button>
                  <button type="button" aria-expanded={isOpen} aria-controls={`ckr-${t.key}`} onClick={() => setOpen(isOpen ? null : t.key)}
                    className="flex items-center gap-3 flex-1 min-w-0 h-14 sm:h-12 pl-1 pr-3 rounded-lg text-left text-[15px] leading-5 font-medium text-[var(--text-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]">
                    <span className={`ckr-name relative min-w-0 truncate transition-colors ${isDone ? 'text-[var(--text-muted)]' : ''}`}>{t.title}</span>
                    <span className={`ml-auto flex-none text-[13px] text-[var(--text-muted)] tabular-nums ${isDone ? 'invisible' : ''}`}>{t.minutes}&nbsp;min</span>
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className={`flex-none text-[var(--text-muted)] transition-transform duration-300 ckr-sp ${isOpen ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </div>
                <div id={`ckr-${t.key}`} inert={isOpen ? undefined : ''} className={`grid transition-[grid-template-rows] duration-[360ms] ease-[cubic-bezier(.2,0,0,1)] ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className={`min-h-0 overflow-hidden pl-11 sm:pl-12 pr-3 sm:pr-4 transition-[opacity,transform] duration-300 ${isOpen ? 'opacity-100 translate-y-0 delay-75' : 'opacity-0 -translate-y-1'}`}>
                    <p className="m-0 text-[15px] sm:text-sm leading-6 sm:leading-[22px] text-[var(--text-muted)] [text-wrap:pretty]">{t.text}</p>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-3 pb-4">
                      <button type="button" aria-busy={busy === t.key || undefined} onClick={() => act(t)} className={`${btn} border-transparent bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] ${busy === t.key ? 'pointer-events-none' : ''}`}>
                        {busy === t.key && <span aria-hidden="true" className="w-3.5 h-3.5 rounded-full border-2 border-current border-r-transparent animate-spin" />}
                        {t.action}
                      </button>
                      {t.secondary && <button type="button" onClick={() => setOpen(null)} className={`${btn} bg-[var(--surface)] border-[var(--border)] text-[var(--text-strong)] hover:border-[var(--border-control)]`}>{t.secondary}</button>}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <div inert={complete ? undefined : ''} className={`grid transition-[grid-template-rows] duration-[360ms] ease-[cubic-bezier(.2,0,0,1)] ${complete ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="min-h-0 overflow-hidden px-4 sm:px-5">
            <div className="pt-4 pb-5 border-t border-[var(--border)]">{footer}</div>
          </div>
        </div>
        <p role="status" className="sr-only">{live}</p>
      </div>
      {launcher && (
        <button ref={launcherBtn} type="button" aria-expanded={expanded} onClick={() => setExpanded((e) => !e)}
          className="justify-self-end inline-flex items-center gap-2.5 h-12 pl-2 pr-4 rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm font-medium text-[var(--text-strong)] shadow-[var(--shadow-popover)] transition-transform active:scale-[.96]">
          <Ring value={p} size={32} stroke={5} />Démarrage<span className="text-[var(--text-muted)] tabular-nums">{n}/{total}</span>
        </button>
      )}
      <canvas ref={canvas} aria-hidden="true" className="fixed inset-0 w-screen h-screen pointer-events-none z-[60]" />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Exemple : le tableau de bord d'Étal, création de boutique en ligne pour artisans. */
export const TASKS = [
  { key: 'shop', title: 'Créer votre boutique', minutes: 1, text: 'Nom, adresse de la boutique et logo. Vous pourrez tout changer plus tard.', action: 'Modifier les informations' },
  { key: 'product', title: 'Ajouter un premier produit', minutes: 4, text: 'Une photo, un prix, un stock\u00a0: la fiche se publie avec la boutique.', action: 'Ajouter un produit', secondary: 'Importer un catalogue' },
  { key: 'shipping', title: 'Choisir vos modes de livraison', minutes: 3, text: 'Colissimo, Mondial Relay ou retrait à l’atelier, avec vos propres tarifs.', action: 'Configurer la livraison' },
  { key: 'payments', title: 'Activer les paiements', minutes: 2, text: 'Reliez votre compte bancaire pour recevoir vos ventes sous 2 jours ouvrés. Carte, Apple Pay et virement.', action: 'Activer les paiements', secondary: 'Plus tard' },
  { key: 'publish', title: 'Publier la boutique', minutes: 1, text: 'Votre adresse etal.shop/atelier-brume devient visible et vos clients peuvent commander.', action: 'Publier maintenant', secondary: 'Prévisualiser' },
];

export default function EtalOnboarding(props) {
  const [state, setState] = useState({ done: props.initialDone ?? 3, total: TASKS.length, complete: false });
  return (
    <div className="relative w-full max-w-[1120px] mx-auto bg-[var(--surface)] border border-[var(--border)] rounded-xl sm:rounded-2xl font-sans text-[var(--text)]">
      <header className="flex items-center gap-3 h-16 px-4 sm:px-6 border-b border-[var(--border)]">
        <a href="#" aria-label="Étal, accueil" className="inline-flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em] text-[var(--text-strong)] no-underline">
          <svg viewBox="0 0 100 100" width="28" height="28" aria-hidden="true"><rect width="100" height="100" rx="28" style={{ fill: 'var(--accent)' }} /><g fill="none" style={{ stroke: 'var(--accent-fg)' }} strokeWidth="6" strokeLinejoin="round" strokeLinecap="round"><path d="M18 40l8-16h48l8 16" /><path d="M18 40a8 8 0 0 0 16 0a8 8 0 0 0 16 0a8 8 0 0 0 16 0a8 8 0 0 0 16 0" /><path d="M26 54v22h48V54" /></g><rect x="43" y="60" width="14" height="16" rx="2" style={{ fill: 'var(--accent-fg)' }} /></svg>
          Étal
        </a>
        <span className="hidden sm:inline pl-3 border-l border-[var(--border)] text-sm font-medium">Atelier Brume</span>
        <span className={`inline-flex items-center gap-2 h-7 px-3 rounded-full text-[13px] font-medium transition-colors ${state.complete ? 'bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]' : 'bg-[var(--tint-neutral-bg)] text-[var(--tint-neutral-fg)]'}`}>
          <span aria-hidden="true" className={`w-2 h-2 rounded-full bg-current ${state.complete ? 'motion-safe:animate-pulse' : 'opacity-70'}`} />{state.complete ? 'En ligne' : 'Brouillon'}
        </span>
        <span aria-hidden="true" className="grid place-items-center ml-auto w-8 h-8 rounded-full bg-[var(--raised)] text-xs font-semibold text-[var(--text-strong)]">IB</span>
      </header>
      <main className={`px-4 sm:px-6 pt-6 sm:pt-10 ${props.layout === 'launcher' ? 'pb-28 min-h-[640px]' : 'pb-8 sm:pb-12'}`}>
        <h1 className="m-0 text-[length:var(--t-page)] leading-[1.2] font-semibold tracking-[-0.02em] text-[var(--text-strong)]">Bonjour Inès</h1>
        <p className="mt-2 mb-6 sm:mb-8 max-w-[560px] text-[15px] leading-6 text-[var(--text-muted)]">Atelier Brume ouvre bientôt. Voici ce qu’il reste à faire avant vos premières commandes.</p>
        <div className={props.layout === 'launcher' ? '' : 'grid grid-cols-[minmax(0,1fr)] sm:grid-cols-[minmax(0,480px)_minmax(0,1fr)] gap-6 items-start'}>
          <Checklist tasks={TASKS} {...props} onChange={setState}
            footer={<>
              <p className="m-0 text-[15px] sm:text-sm leading-6 text-[var(--text-muted)]">Votre boutique est visible sur etal.shop/atelier-brume. Partagez le lien à vos clients et suivez vos premières commandes ici.</p>
              <div className="flex flex-col sm:flex-row gap-2 pt-3">
                <a href="#" className="inline-flex items-center justify-center h-11 sm:h-9 px-3.5 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] text-[15px] sm:text-sm font-medium no-underline">Voir ma boutique</a>
                <button type="button" className="h-11 sm:h-9 px-3.5 rounded-lg border border-[var(--border)] text-[15px] sm:text-sm font-medium text-[var(--text-strong)]">Masquer ce guide</button>
              </div>
            </>} />
          {props.layout !== 'launcher' && (
            <aside aria-label="Aperçu de la boutique" className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
              <div className="flex items-center h-8 px-3 rounded-lg bg-[var(--surface)] font-mono text-[13px] text-[var(--text-muted)]">etal.shop/atelier-brume</div>
              <p className="mt-6 mb-0 mx-1 text-xl font-semibold tracking-[-0.01em] text-[var(--text-strong)]">Atelier Brume</p>
              <p className="m-0 mx-1 text-sm text-[var(--text-muted)]">Céramique tournée à la main · Nantes</p>
              <p className={`mt-4 mb-0 p-3 rounded-lg bg-[var(--surface)] text-[13px] transition-opacity duration-500 ${state.done >= 4 ? 'opacity-100' : 'opacity-30'}`}>Paiement par carte, Apple Pay et virement</p>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
