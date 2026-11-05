// Décodage — React + Tailwind CSS, sans dépendance. Couleurs : variables de tokens.css.
// <DecodeText as="h1" text="Vos secrets, illisibles pour tous sauf vous." trigger="view" charset="symbols" order="ltr" duration={1400} />
// <SecretField secret="Tq7#mW2!vRpL" label="Banque en ligne" />
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const SETS = { symbols: '!<>-_\\/[]{}—=+*^?#%&@$', alnum: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', binary: '01', hex: '0123456789ABCDEF' };
const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('fr', { granularity: 'grapheme' }) : null;
const graphemes = (s) => (seg ? Array.from(seg.segment(s), (x) => x.segment) : Array.from(s));
const pick = (set) => set[Math.floor(Math.random() * set.length)];
const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
function ranks(n, order) {
  if (order === 'random') { const idx = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; } const r = []; idx.forEach((v, k) => { r[v] = n > 1 ? k / (n - 1) : 0; }); return r; }
  const mid = (n - 1) / 2; return [...Array(n).keys()].map((i) => (n < 2 ? 0 : order === 'center' ? Math.abs(i - mid) / (mid || 1) : i / (n - 1)));
}

/* Le moteur : écrit directement dans les <span> (aucun rendu React par image). */
export function useDecode(text, { charset = 'symbols', order = 'ltr', duration = 1200, delay = 0, lead = true } = {}) {
  const ref = useRef(null), raf = useRef(0);
  const chars = graphemes(text);
  /* Fige chaque lettre à la largeur de sa forme finale : la ligne ne tremble pas. */
  const lock = useCallback(() => {
    const spans = ref.current?.querySelectorAll('[data-ch]'); if (!spans) return;
    const cur = [...spans].map((s) => { const c = s.textContent; s.textContent = s.dataset.f; s.style.width = ''; return c; });
    const w = [...spans].map((s) => s.getBoundingClientRect().width);
    spans.forEach((s, i) => { s.style.width = `${w[i]}px`; s.textContent = cur[i]; });
  }, []);
  useLayoutEffect(() => { lock(); document.fonts?.ready.then(lock); }, [text, lock]);
  const play = useCallback((done) => {
    const spans = [...(ref.current?.querySelectorAll('[data-ch]') || [])], set = SETS[charset] || SETS.symbols, n = spans.length;
    cancelAnimationFrame(raf.current);
    spans.forEach((s) => { s.style.opacity = ''; });
    if (!n || prefersReduced()) { spans.forEach((s) => { s.textContent = s.dataset.f; s.dataset.state = ''; }); done?.(); return; }
    const settle = duration * 0.35, ends = ranks(n, order).map((p) => settle + p * (duration - settle)), start = performance.now() + delay;
    let last = 0;
    spans.forEach((s) => { s.textContent = pick(set); s.dataset.state = 'scr'; });
    const tick = (now) => {
      const t = now - start, swap = now - last > 48; let left = t < 0 ? 1 : 0;
      if (t >= 0) {
        spans.forEach((s, i) => {
          if (t >= ends[i]) { if (s.dataset.state) { s.textContent = s.dataset.f; s.dataset.state = ''; } return; }
          left++; if (swap) { s.textContent = pick(set); s.dataset.state = lead && t > ends[i] - 90 ? 'lead' : 'scr'; }
        });
        if (swap) last = now;
      }
      if (left) raf.current = requestAnimationFrame(tick); else done?.();
    };
    raf.current = requestAnimationFrame(tick);
  }, [charset, order, duration, delay, lead]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return { ref, chars, play, lock };
}

function Letters({ text, chars }) {
  let k = 0;
  return (
    <>
      <span className="sr-only">{text}</span>
      {text.split(/(\s+)/).map((w, wi) => (!w ? null : /^\s+$/.test(w) ? w : (
        <span key={wi} aria-hidden className="whitespace-nowrap">
          {graphemes(w).map((g) => { const i = k++; return <span key={i} data-ch data-f={g} className="inline-block whitespace-pre text-center data-[state=lead]:text-[var(--accent)] data-[state=scr]:text-[var(--dc-scr,var(--text-muted))]">{g}</span>; })}
        </span>
      )))}
    </>
  );
}

/* trigger : 'view' (à l'entrée dans l'écran), 'hover' (survol / focus du lien ou bouton parent), 'loop' (texts en boucle, en pause hors écran) */
export default function DecodeText({ as: Tag = 'span', text, texts, trigger = 'view', pause = 1800, className = '', ...opts }) {
  const list = texts?.length ? texts : [text];
  const [i, setI] = useState(0), cur = list[i % list.length];
  const { ref, chars, play } = useDecode(cur, opts);
  const visible = useRef(false), timer = useRef(0);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (trigger === 'view') {
      if (!prefersReduced()) el.querySelectorAll('[data-ch]').forEach((s) => { s.style.opacity = '0'; });
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); play(); } }, { threshold: 0.4 }); io.observe(el); return () => io.disconnect();
    }
    if (trigger === 'hover') {
      const host = el.closest('a, button') || el; let busy = false;
      const go = (e) => { if (busy || (e.type === 'pointerenter' && e.pointerType !== 'mouse')) return; busy = true; play(() => { busy = false; }); };
      host.addEventListener('pointerenter', go); host.addEventListener('focus', go);
      return () => { host.removeEventListener('pointerenter', go); host.removeEventListener('focus', go); };
    }
    if (trigger === 'loop') {
      const io = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; if (e.isIntersecting) play(() => { timer.current = setTimeout(() => visible.current && setI((x) => x + 1), pause); }); else clearTimeout(timer.current); });
      io.observe(el); return () => { io.disconnect(); clearTimeout(timer.current); };
    }
  }, [trigger, cur, play, pause]);
  return <Tag ref={ref} className={`[font-kerning:none] ${className}`}><Letters text={cur} chars={chars} /></Tag>;
}

/* Secret masqué : survol = aperçu, clic / toucher / Entrée = épingle ; les points se décodent en texte et inversement. */
export function SecretField({ secret, label }) {
  const mask = secret.replace(/./g, '•');
  const [open, setOpen] = useState(false), [pinned, setPinned] = useState(false), [shown, setShown] = useState(mask);
  const { ref, play } = useDecode(shown, { charset: 'alnum', order: open ? 'ltr' : 'random', duration: open ? 640 : 380 });
  const first = useRef(true);
  useEffect(() => { setShown(open ? secret : mask); }, [open, secret, mask]);
  useEffect(() => { if (first.current) { first.current = false; return; } play(); }, [shown, play]);
  return (
    <button type="button" aria-pressed={open} onClick={() => { const p = !(pinned && open); setPinned(p); setOpen(p); }}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setOpen(true)} onPointerLeave={(e) => e.pointerType === 'mouse' && !pinned && setOpen(false)} onBlur={() => { setPinned(false); setOpen(false); }}
      className="col-span-2 inline-flex min-h-11 w-full flex-row-reverse items-center justify-between rounded-lg bg-[var(--raised)] px-3 font-[family-name:var(--font-mono)] text-sm font-medium text-[var(--text-strong)] transition-colors hover:bg-[var(--state-hover)] aria-pressed:bg-[var(--state-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] md:col-span-1 md:w-auto md:flex-row md:justify-end md:bg-transparent">
      <span className="sr-only">{open ? 'Masquer' : 'Afficher'} le secret de {label}</span>
      <span ref={ref} aria-hidden className={`whitespace-pre tracking-[0.02em] ${open ? '' : 'text-[var(--text-muted)]'}`}>
        {graphemes(shown).map((g, i) => <span key={i} data-ch data-f={g} className="inline-block text-center data-[state=lead]:text-[var(--accent)] data-[state=scr]:text-[var(--text-muted)]">{g}</span>)}
      </span>
      <span aria-hidden className="font-[family-name:var(--font-sans)] text-xs font-normal text-[var(--text-muted)] md:hidden">{open ? 'Masquer' : 'Afficher'}</span>
      <span className="sr-only" aria-live="polite">{open ? `Affiché : ${secret.split('').join(' ')}` : ''}</span>
    </button>
  );
}

/* Exemple complet : hero de coffre-fort (marque fictive « verrou »). */
export function VaultHero({ title = 'Vos secrets, illisibles pour tous sauf vous.', trigger = 'view', charset = 'symbols', order = 'ltr', duration = 1400, scrambleColor = 'muted' }) {
  const items = [['Banque en ligne', 'c.roux@mail.fr', 'Tq7#mW2!vRpL'], ['Messagerie', 'camille.roux', 'lune-Brique-48-ocre'], ['Serveur de prod', 'Clé d’API', 'sk_live_9f3a7c21e4'], ['Wi-Fi du bureau', 'Atelier-5G', 'Gare2Lyon#27']];
  return (
    <section style={{ '--dc-scr': scrambleColor === 'accent' ? 'var(--accent)' : 'var(--text-muted)' }} className="mx-auto grid w-full max-w-[1120px] items-center gap-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 pb-5 pt-7 font-[family-name:var(--font-sans)] text-[var(--text)] md:grid-cols-[1.15fr_1fr] md:gap-12 md:rounded-2xl md:p-14">
      <div>
        <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.04em] text-[var(--text-muted)]"><DecodeText text="Chiffré de bout en bout · AES-256" charset="hex" duration={900} delay={150} /></p>
        <DecodeText as="h2" text={title} trigger={trigger} charset={charset} order={order} duration={duration} delay={300} texts={trigger === 'loop' ? [title, 'Un coffre, une clé : la vôtre.', 'Partagez un accès, jamais un mot de passe.'] : undefined}
          className="text-balance text-[clamp(2rem,1.2rem+3vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-[var(--text-strong)]" />
        <p className="mt-5 max-w-[46ch] leading-relaxed text-[var(--text-muted)]">Mots de passe, codes et clés d’API dans un coffre chiffré sur votre appareil. Même nous ne pouvons pas les lire.</p>
        <div className="mt-8 flex flex-col gap-3 md:flex-row">
          <a href="#" className="inline-flex h-12 items-center justify-center rounded-lg bg-[var(--accent)] px-5 font-medium text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] md:h-11 md:text-sm"><DecodeText text="Créer mon coffre" trigger="hover" charset="alnum" order="random" duration={520} /></a>
          <a href="#" className="inline-flex h-12 items-center justify-center rounded-lg border border-[var(--border-control)] px-5 font-medium text-[var(--text-strong)] hover:bg-[var(--state-hover)] md:h-11 md:text-sm"><DecodeText text="Voir l’audit de sécurité" trigger="hover" charset="alnum" order="random" duration={520} /></a>
        </div>
      </div>
      <div role="region" aria-label="Exemple de coffre" className="rounded-2xl bg-[var(--raised)] p-2">
        <p className="flex items-center gap-2 px-3 pb-3.5 pt-3 text-sm font-semibold text-[var(--text-strong)]"><span aria-hidden className="h-2 w-2 rounded-full bg-[var(--up)]" />Coffre personnel<span className="ml-auto text-xs font-normal text-[var(--text-muted)]">4 éléments</span></p>
        <ul className="grid gap-1">{items.map(([name, user, secret]) => (
          <li key={name} className="grid min-h-16 grid-cols-[minmax(0,1fr)] items-center gap-x-3 gap-y-1 rounded-xl bg-[var(--surface)] p-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <span className="grid min-w-0"><span className="truncate text-sm font-medium text-[var(--text-strong)]">{name}</span><span className="truncate text-xs text-[var(--text-muted)]">{user}</span></span>
            <SecretField secret={secret} label={name} />
          </li>))}
        </ul>
        <p className="px-3 pb-2 pt-3.5 text-xs text-[var(--text-muted)]"><DecodeText text="" texts={['Chiffré sur cet appareil', 'Aucune fuite détectée', 'Synchronisé il y a 2 min']} trigger="loop" charset="binary" order="random" duration={800} pause={2600} className="font-[family-name:var(--font-mono)] font-medium text-[var(--text-strong)]" /></p>
      </div>
    </section>
  );
}
