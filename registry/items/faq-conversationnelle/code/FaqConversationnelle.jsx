// FaqConversationnelle.jsx — FAQ en conversation : la question part de la liste et rejoint le fil sur un ressort,
// l’assistant « réfléchit », puis la réponse s’écrit mot à mot au rythme de la phrase. Source, vote, questions liées,
// saisie libre avec suggestions, bouton stop pour tout afficher. Pause hors écran.
// React 18, Tailwind 3.4, tokens.css chargé (couleurs par variables). Aucune autre dépendance.
// Exemple : Auvent (assurance habitation fictive).
// Utilisation :
//   <FaqConversationnelle speed={48} natural thinking={700} caret related source autoplay />
//   <FaqConversationnelle data={{ bot, welcome, fallback, items: [{ id, q, a, src, rel, kw }] }} />
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export const AUVENT_FAQ = {
  "bot": "Assistant Auvent",
  "welcome": "Bonjour. Je réponds à partir de vos conditions générales, relues par nos juristes. Choisissez une question ou posez la vôtre.",
  "fallback": "Je n’ai pas de réponse sûre à cette question, et je préfère ne pas improviser. Une conseillère peut vous répondre en quelques minutes.",
  "items": [
    {
      "id": "couverture",
      "q": "Que couvre l’assurance habitation Auvent ?",
      "kw": "garanties couvre couverture inclus protege incendie vol",
      "a": "Votre logement et vos biens, contre l’incendie, le dégât des eaux, le vol, les catastrophes naturelles et le bris de glace. La responsabilité civile de toute la famille est incluse, y compris celle de vos enfants à l’école.",
      "src": "Conditions générales, art. 2",
      "rel": [
        "franchise",
        "valeur",
        "degat"
      ]
    },
    {
      "id": "prix",
      "q": "Combien coûte l’assurance pour un deux‑pièces ?",
      "kw": "prix tarif cout cher mois euros devis appartement studio",
      "a": "À partir de 7,90 € par mois pour un locataire, 11,40 € pour un propriétaire occupant. Le prix dépend surtout de la surface, de la ville et de la valeur de vos biens : le devis prend deux minutes, sans appel.",
      "src": "Grille tarifaire 2026",
      "rel": [
        "franchise",
        "couverture",
        "resilier"
      ]
    },
    {
      "id": "degat",
      "q": "Que faire en cas de dégât des eaux ?",
      "kw": "degat eaux fuite inondation sinistre declarer voisin constat",
      "a": "Coupez l’eau, photographiez les dégâts, puis déclarez le sinistre dans l’application sous cinq jours ouvrés. Si un voisin est concerné, remplissez ensemble le constat amiable : l’application le pré‑remplit pour vous.",
      "src": "Guide sinistres, p. 4",
      "rel": [
        "delai",
        "franchise"
      ]
    },
    {
      "id": "franchise",
      "q": "Quelle est la franchise ?",
      "kw": "franchise reste charge payer montant",
      "a": "150 € par sinistre avec la formule Essentielle, aucune avec la formule Sereine. Pour une catastrophe naturelle, la franchise légale de 380 € s’applique dans tous les cas.",
      "src": "Conditions particulières, art. 7",
      "rel": [
        "prix",
        "delai"
      ]
    },
    {
      "id": "valeur",
      "q": "Mes objets de valeur sont-ils couverts ?",
      "kw": "objets valeur bijoux ordinateur velo facture",
      "a": "Oui, jusqu’à 30 % du capital mobilier. Pour un objet de plus de 3 000 €, gardez la facture ou une photo datée : c’est ce qui accélère le plus l’indemnisation.",
      "src": "Conditions générales, art. 5.3",
      "rel": [
        "couverture",
        "delai"
      ]
    },
    {
      "id": "resilier",
      "q": "Puis-je résilier à tout moment ?",
      "kw": "resilier resiliation annuler arreter quitter changer assureur",
      "a": "Après un an, oui : sans frais ni justification, grâce à la loi Hamon. Avant, la résiliation reste possible en cas de déménagement. Et si vous venez d’ailleurs, nous prévenons votre ancien assureur à votre place.",
      "src": "Conditions générales, art. 11",
      "rel": [
        "demenager",
        "prix"
      ]
    },
    {
      "id": "demenager",
      "q": "Je déménage : comment transférer mon contrat ?",
      "kw": "demenager demenagement adresse transferer nouveau logement attestation",
      "a": "Indiquez votre nouvelle adresse dans l’application. Le contrat est transféré au jour de la remise des clés, et l’attestation pour votre propriétaire part dans la foulée.",
      "src": "Espace client, rubrique Logement",
      "rel": [
        "resilier",
        "prix"
      ]
    },
    {
      "id": "delai",
      "q": "En combien de temps suis-je indemnisé ?",
      "kw": "delai indemnise indemnisation remboursement temps virement expert",
      "a": "En moyenne six jours après une déclaration complète. Pour un sinistre de moins de 1 500 €, le virement part souvent sous 48 heures, sans passage d’expert.",
      "src": "Engagements de service 2026",
      "rel": [
        "degat",
        "franchise"
      ]
    }
  ]
};

const fold = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const termsOf = (q) => fold(q).split(/[^a-z0-9€]+/).filter((t) => t.length > 2);
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
/* Ressort amorti échantillonné (k raideur, c amortissement) → valeurs de 1 à 0 et durée en ms. */
function spring(k = 170, c = 19) {
  let x = 1, v = 0; const dt = 1 / 60, out = [];
  for (let i = 0; i < 240; i++) { v += (-k * x - c * v) * dt; x += v * dt; out.push(x); if (Math.abs(x) < 6e-4 && Math.abs(v) < 0.01) break; }
  return { values: out, duration: Math.round(out.length * dt * 1000) };
}

const Glyph = () => (<>
  <path d="M22 46 50 24l28 22" fill="none" stroke="var(--accent-fg)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
  <path d="M28 50h44v6a7.33 7.33 0 0 1-14.67 0 7.33 7.33 0 0 1-14.66 0A7.33 7.33 0 0 1 28 56z" fill="var(--accent-fg)" />
  <path d="M38 66v10M62 66v10" fill="none" stroke="var(--accent-fg)" strokeWidth="6" strokeLinecap="round" />
</>);
const Avatar = ({ size = 32 }) => (
  <span aria-hidden="true" className="grid flex-none place-items-center rounded-full bg-[var(--accent)]" style={{ width: size, height: size }}>
    <svg viewBox="0 0 100 100" width={size} height={size}><g transform="translate(12 10) scale(.76)"><Glyph /></g></svg>
  </span>
);
const ArrowUR = () => <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 flex-none text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5" /></svg>;
const chip = 'fq-in inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-left text-sm leading-snug transition-[border-color,background-color,transform] duration-200 hover:border-[var(--border-control)] hover:bg-[var(--raised)] active:scale-[.97] md:min-h-9';

function Highlight({ text, q }) {
  const f = fold(text), hits = [];
  termsOf(q).forEach((t) => { const k = f.indexOf(t); if (k > -1) hits.push([k, k + t.length]); });
  hits.sort((a, b) => a[0] - b[0]);
  const out = []; let pos = 0;
  hits.forEach(([s, e], i) => { if (s < pos) return; out.push(text.slice(pos, s), <mark key={i} className="bg-transparent text-[var(--accent)] underline decoration-[1.5px] underline-offset-[3px]">{text.slice(s, e)}</mark>); pos = e; });
  out.push(text.slice(pos));
  return out;
}

function Answer({ msg, data, seen, onAsk, related, source }) {
  const [vote, setVote] = useState(null);
  const words = msg.words;
  const done = msg.shown >= words.length;
  const it = msg.item;
  return (
    <div className="grid max-w-full grid-cols-[28px_minmax(0,1fr)] items-start gap-2.5 md:max-w-[92%] md:grid-cols-[32px_minmax(0,1fr)] md:gap-3">
      <span className="-mt-0.5"><Avatar size={msg.small ? 28 : 32} /></span>
      <div>
        {msg.thinking ? (
          <span aria-hidden="true" className="inline-flex h-8 items-center gap-[5px] rounded-full bg-[var(--raised)] px-3.5">
            {[0, 1, 2].map((i) => <i key={i} className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)] [animation:fqdot_1.1s_cubic-bezier(.32,.72,0,1)_infinite] motion-reduce:[animation:none]" style={{ animationDelay: `${i * 140}ms` }} />)}
          </span>
        ) : (
          <p aria-hidden="true" className="m-0 text-pretty text-[15.5px] leading-[1.62] text-[var(--text-strong)]">
            {words.slice(0, msg.shown).map((w, i) => (/^\s+$/.test(w) ? w : <span key={i} className="[animation:fqword_380ms_cubic-bezier(.32,.72,0,1)_both] motion-reduce:[animation:none]">{w}</span>))}
            {!done && <span className="ml-0.5 inline-block h-[1.05em] w-2 rounded-sm bg-[var(--accent)] align-[-0.16em] [animation:fqcaret_1s_steps(1)_infinite] motion-reduce:[animation:none]" style={{ display: msg.caret ? undefined : 'none' }} />}
          </p>
        )}
        {done && !msg.thinking && it && (
          <>
            <div className="fq-in mt-3 flex flex-wrap items-center gap-2">
              {source && <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[var(--border)] px-2.5 font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)]">
                <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 2h5l3 3v9H4z" /><path d="M9 2v3h3M6.5 9h3M6.5 11.5h3" /></svg>{it.src}</span>}
              <span role="group" aria-label="Cette réponse vous a-t-elle aidé ?" className="ml-auto inline-flex gap-0.5">
                {[['1', 'Utile', 'M7 11v9H4v-9zM7 11l4-7c1.5 0 2.5 1 2.2 2.6L12.6 10H18a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 16.8 20H7'], ['0', 'Pas utile', 'M17 13V4h3v9zM17 13l-4 7c-1.5 0-2.5-1-2.2-2.6l.6-3.4H6a2 2 0 0 1-2-2.3l1.2-6A2 2 0 0 1 7.2 4H17']].map(([v, l, d]) => (
                  <button key={v} type="button" aria-label={l} aria-pressed={vote === v} onClick={() => setVote(v)}
                    className={`grid h-11 w-11 place-items-center rounded-lg transition-[background-color,color,transform] duration-200 active:scale-[.88] md:h-8 md:w-8 ${vote === v ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--state-hover)] hover:text-[var(--text-strong)]'}`}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
                  </button>))}
              </span>
            </div>
            {related && it.rel?.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-[13px] text-[var(--text-muted)]">Questions liées</p>
                <div className="flex flex-wrap gap-2">
                  {it.rel.map((r, k) => { const x = data.items.find((i) => i.id === r); return x && (
                    <button key={r} type="button" data-q={r} onClick={(e) => onAsk(r, e.currentTarget)} style={{ animationDelay: `${120 + k * 70}ms` }}
                      className={`${chip} ${seen.has(r) ? 'text-[var(--text-muted)]' : 'text-[var(--text-strong)]'}`}>{x.q}<ArrowUR /></button>); })}
                </div>
              </div>
            )}
          </>
        )}
        {done && !msg.thinking && !it && msg.fallback && (
          <a href="#conseiller" className="fq-in mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-fg)] no-underline hover:bg-[var(--accent-hover)]">Parler à une conseillère</a>
        )}
      </div>
    </div>
  );
}

/**
 * @param {{ data?: typeof AUVENT_FAQ, speed?: number, natural?: boolean, thinking?: number, caret?: boolean,
 *   related?: boolean, source?: boolean, autoplay?: boolean, top?: string[], className?: string }} props
 */
export function FaqConversationnelle({
  data = AUVENT_FAQ, speed = 48, natural = true, thinking = 700, caret = true, related = true, source = true,
  autoplay = true, top = ['couverture', 'prix', 'degat', 'franchise', 'resilier'], className = '',
}) {
  const [msgs, setMsgs] = useState([]);
  const [seen, setSeen] = useState(() => new Set());
  const [value, setValue] = useState('');
  const [sel, setSel] = useState(0);
  const [taOpen, setTaOpen] = useState(false);
  const [announce, setAnnounce] = useState('');
  const thread = useRef(null), root = useRef(null), stick = useRef(true), visible = useRef(true), timer = useRef(0), pending = useRef(null), flyFrom = useRef(null);
  const busy = msgs.length > 0 && (msgs[msgs.length - 1].thinking || (msgs[msgs.length - 1].words && msgs[msgs.length - 1].shown < msgs[msgs.length - 1].words.length));
  const byId = useCallback((id) => data.items.find((i) => i.id === id), [data]);
  const opts = value.trim() ? data.items.map((it) => { const f = fold(`${it.q} ${it.kw || ''}`); let s = 0; termsOf(value).forEach((t) => { if (f.includes(t)) s += 2; else if (t.length > 4 && f.includes(t.slice(0, -1))) s += 1; }); return { it, s }; }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3) : [];

  /* Minuterie unique, suspendue hors écran et onglet masqué. */
  const schedule = useCallback((fn, ms) => { clearTimeout(timer.current); pending.current = { fn, at: performance.now() + ms }; if (visible.current && !document.hidden) timer.current = setTimeout(() => { pending.current = null; fn(); }, ms); else pending.current.left = ms; }, []);
  useEffect(() => {
    const resume = () => { const p = pending.current; if (!p || !visible.current || document.hidden) return; clearTimeout(timer.current); timer.current = setTimeout(() => { pending.current = null; p.fn(); }, p.left ?? Math.max(0, p.at - performance.now())); };
    const pause = () => { const p = pending.current; clearTimeout(timer.current); if (p) p.left = Math.max(0, p.at - performance.now()); };
    const io = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; e.isIntersecting ? resume() : pause(); }, { threshold: 0.05 });
    io.observe(root.current);
    const vis = () => (document.hidden ? pause() : resume());
    document.addEventListener('visibilitychange', vis);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', vis); clearTimeout(timer.current); };
  }, []);

  const update = (fn) => setMsgs((m) => { const c = m.slice(); c[c.length - 1] = fn(c[c.length - 1]); return c; });
  const finishAll = useCallback(() => { clearTimeout(timer.current); pending.current = null; update((b) => (b.role === 'bot' ? { ...b, thinking: false, shown: b.words.length } : b)); }, []);

  const msgsRef = useRef(msgs); msgsRef.current = msgs;
  const step = useCallback(() => {
    const m = msgsRef.current, b = m[m.length - 1];
    if (!b || !b.words || b.thinking || b.shown >= b.words.length) return;
    let n = b.shown + 1; while (n < b.words.length && /^\s+$/.test(b.words[n - 1])) n++;
    msgsRef.current = [...m.slice(0, -1), { ...b, shown: n }];
    update((x) => ({ ...x, shown: n }));
    const w = b.words[n - 1] || '';
    let d = speed;
    if (natural) { d *= 0.55 + Math.random() * 0.9 + Math.min(w.length, 12) * 0.035; if (/[,;]$/.test(w)) d += speed * 2.6; else if (/[.!?:…]\u202f?$/.test(w)) d += speed * 5.5; }
    if (n < b.words.length) schedule(step, d);
  }, [speed, natural, schedule]);

  const ask = useCallback((id, from, text) => {
    const it = id ? byId(id) : null;
    const instant = reduced();
    clearTimeout(timer.current); pending.current = null;
    flyFrom.current = from ? from.getBoundingClientRect() : null;
    const answer = it ? it.a : data.fallback;
    const bot = { role: 'bot', item: it, fallback: !it, words: answer.split(/(\s+)/).filter(Boolean), shown: instant ? Infinity : 0, thinking: !instant, caret, key: Math.random() };
    setMsgs((m) => [...m.map((x) => (x.role === 'bot' && x.words ? { ...x, thinking: false, shown: x.words.length } : x)), { role: 'me', text: it ? it.q : text, key: Math.random() }]);
    stick.current = true;
    if (it) setSeen((s) => new Set(s).add(it.id));
    if (instant) { setMsgs((m) => [...m, { ...bot, shown: bot.words.length }]); setAnnounce(`${data.bot} : ${answer}`); return; }
    schedule(() => {
      msgsRef.current = [...msgsRef.current, bot];
      setMsgs((m) => [...m, bot]);
      const wait = Math.min(1400, thinking * (natural ? 0.8 + Math.random() * 0.4 : 1));
      schedule(() => { const m = msgsRef.current; msgsRef.current = [...m.slice(0, -1), { ...m[m.length - 1], thinking: false }]; update((b) => ({ ...b, thinking: false })); schedule(step, speed); }, wait);
    }, 260);
  }, [byId, data, caret, thinking, natural, speed, schedule, step]);

  /* Annonce lecteur d’écran une fois la réponse complète. */
  const last = msgs[msgs.length - 1];
  useEffect(() => { if (last?.role === 'bot' && last.words && !last.thinking && last.shown >= last.words.length) setAnnounce(`${data.bot} : ${last.words.join('')}`); }, [last?.shown, last?.thinking]); // eslint-disable-line

  /* Suivre le bas du fil tant que le lecteur ne remonte pas. */
  useLayoutEffect(() => { const t = thread.current; if (t && stick.current) t.scrollTop = t.scrollHeight; });

  /* Envol de la bulle depuis la question cliquée (fantôme fixe, ressort). */
  useLayoutEffect(() => {
    const a = flyFrom.current; if (!a || reduced()) return; flyFrom.current = null;
    const bubbles = thread.current?.querySelectorAll('[data-me]'); const b = bubbles?.[bubbles.length - 1]; if (!b) return;
    const r = b.getBoundingClientRect(); const g = b.cloneNode(true);
    Object.assign(g.style, { position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, margin: 0, zIndex: 30, pointerEvents: 'none' });
    document.body.appendChild(g); b.style.visibility = 'hidden';
    const dx = a.left + Math.min(a.width, r.width) / 2 - (r.left + r.width / 2), dy = a.top + a.height / 2 - (r.top + r.height / 2);
    const s = spring(), n = s.values.length;
    const anim = g.animate(s.values.map((x, i) => ({ transform: `translate(${dx * x}px,${dy * x}px) scale(${0.86 + 0.14 * Math.min(1.08, 1 - x)})`, opacity: Math.min(1, 0.2 + i / (n * 0.18)), offset: i / (n - 1) })), { duration: s.duration, easing: 'linear', fill: 'both' });
    const done = () => { b.style.visibility = ''; g.remove(); };
    anim.onfinish = done; anim.oncancel = done;
  }, [msgs.length]);

  useEffect(() => { if (!autoplay) return; const t = setTimeout(() => ask(top[0], root.current?.querySelector(`[data-top="${top[0]}"]`)), 900); return () => clearTimeout(t); }, []); // eslint-disable-line

  const submit = (e) => {
    e.preventDefault();
    if (busy) return finishAll();
    const txt = value.trim(); if (!txt) return;
    const pick = taOpen && opts[sel] ? opts[sel].it.id : null;
    setValue(''); setTaOpen(false);
    ask(pick, null, pick ? null : txt);
  };
  const reset = () => { clearTimeout(timer.current); pending.current = null; setMsgs([]); setSeen(new Set()); };

  return (
    <section ref={root} aria-labelledby="fq-title" className={`relative isolate mx-auto grid max-w-[1184px] grid-cols-[minmax(0,1fr)] items-center gap-6 px-4 py-12 font-[family-name:var(--font-sans)] text-[var(--text)] min-[900px]:grid-cols-[minmax(0,400px)_minmax(0,1fr)] min-[900px]:gap-16 min-[900px]:px-8 min-[900px]:py-24 ${className}`}>
      <style>{'@keyframes fqword{from{opacity:0;filter:blur(4px)}}@keyframes fqcaret{50%{opacity:0}}@keyframes fqdot{0%,60%,100%{transform:none;opacity:.45}30%{transform:translateY(-4px);opacity:1}}@keyframes fqin{from{opacity:0;transform:translateY(8px) scale(.98)}}.fq-in{animation:fqin 520ms cubic-bezier(.34,1.4,.64,1) both}@media (prefers-reduced-motion:reduce){.fq-in{animation:none}}'}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-[14%] right-[6%] -z-10 hidden w-[52%] rounded-full bg-[color-mix(in_srgb,var(--accent)_11%,transparent)] blur-[72px] min-[900px]:block" />
      <div className="min-w-0">
        <a href="#accueil" aria-label="Auvent, accueil" className="mb-4 inline-flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.01em] text-[var(--text-strong)] no-underline min-[900px]:mb-6">
          <svg viewBox="0 0 100 100" className="h-7 w-7" aria-hidden="true"><rect width="100" height="100" rx="28" fill="var(--accent)" /><Glyph /></svg>Auvent
        </a>
        <h2 id="fq-title" className="m-0 text-balance text-[2rem] font-semibold leading-[1.05] tracking-[-0.035em] text-[var(--text-strong)] min-[900px]:text-[clamp(2rem,1.3rem+2.2vw,3rem)]">Une question{'\u202f'}?<br /> Il suffit de la poser.</h2>
        <p className="mt-4 text-pretty text-base leading-relaxed text-[var(--text-muted)] min-[900px]:text-[17px]">Notre assistant répond à partir de vos conditions générales, en clair et avec la source. Et si la réponse n’est pas sûre, il vous passe une conseillère.</p>
        <p aria-hidden="true" className="mb-2 mt-10 hidden font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.04em] text-[var(--text-muted)] min-[900px]:block">Les plus posées</p>
        <ul role="list" aria-label="Questions les plus posées" className="m-0 hidden list-none border-t border-[var(--border)] p-0 min-[900px]:block">
          {top.map((id) => { const it = byId(id); return it && (
            <li key={id} className="border-b border-[var(--border)]">
              <button type="button" data-top={id} aria-pressed={seen.has(id)} onClick={(e) => ask(id, e.currentTarget)}
                className={`group flex min-h-[52px] w-full items-center gap-3 px-1 py-3 text-left text-[15px] font-medium leading-snug transition-[padding,color] duration-300 hover:pl-2 ${seen.has(id) ? 'text-[var(--text-muted)]' : 'text-[var(--text-strong)]'}`}>
                <span className="min-w-0 flex-1">{it.q}</span>
                <svg viewBox="0 0 16 16" className={`h-4 w-4 flex-none transition-transform duration-[420ms] ease-[cubic-bezier(.34,1.4,.64,1)] group-hover:translate-x-[3px] ${seen.has(id) ? 'text-[var(--up)]' : 'text-[var(--text-muted)] group-hover:text-[var(--accent)]'}`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
              </button>
            </li>); })}
        </ul>
      </div>

      <div role="region" aria-label="Conversation avec l’assistant Auvent" className="relative -mx-1 flex h-[min(640px,calc(100vh-32px))] min-h-[520px] min-w-0 flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] min-[900px]:mx-0 min-[900px]:h-[620px]">
        <header className="flex items-center gap-3 border-b border-[var(--border)] py-3.5 pl-5 pr-4">
          <Avatar />
          <div className="min-w-0 flex-1">
            <b className="block text-[15px] font-semibold tracking-[-0.01em] text-[var(--text-strong)]">{data.bot}</b>
            <span className="flex items-center gap-1.5 text-[13px] text-[var(--text-muted)]"><i aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--up)]" />Répond en quelques secondes</span>
          </div>
          <button type="button" onClick={reset} aria-label="Recommencer la conversation" className="grid h-10 w-10 place-items-center rounded-[10px] text-[var(--text-muted)] hover:bg-[var(--state-hover)] hover:text-[var(--text-strong)]">
            <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10a6 6 0 1 0 1.8-4.3" /><path d="M4 3.5V6.5h3" /></svg>
          </button>
        </header>
        <div ref={thread} role="log" aria-label="Fil de la conversation" tabIndex={0} onScroll={(e) => { const t = e.currentTarget; stick.current = t.scrollHeight - t.scrollTop - t.clientHeight < 48; }}
          className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 pb-2 pt-5 [scrollbar-width:thin] min-[900px]:px-5 min-[900px]:pt-6">
          <p className="self-center font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.04em] text-[var(--text-muted)]">Aujourd’hui</p>
          <div className="grid grid-cols-[28px_minmax(0,1fr)] items-start gap-2.5 md:max-w-[92%] md:grid-cols-[32px_minmax(0,1fr)] md:gap-3">
            <span className="-mt-0.5"><Avatar /></span><p className="m-0 text-[15.5px] leading-[1.62] text-[var(--text-strong)]">{data.welcome}</p>
          </div>
          {msgs.map((m) => (m.role === 'me' ? (
            <div key={m.key} className="max-w-[88%] self-end md:max-w-[82%]">
              <p data-me className="m-0 rounded-[18px_18px_6px_18px] bg-[var(--accent)] px-4 py-2.5 text-[15px] font-medium leading-[1.45] text-[var(--accent-fg)]">{m.text}</p>
            </div>
          ) : <Answer key={m.key} msg={m} data={data} seen={seen} onAsk={ask} related={related} source={source} />))}
        </div>
        <div role="group" aria-label="Questions fréquentes" className="flex gap-2 overflow-x-auto overscroll-x-contain px-4 pt-2.5 [scrollbar-width:none] min-[900px]:hidden">
          {data.items.map((it) => <button key={it.id} type="button" onClick={(e) => ask(it.id, e.currentTarget)} className={`${chip} flex-none whitespace-nowrap text-[var(--text-strong)]`}>{it.q}</button>)}
        </div>
        <form onSubmit={submit} autoComplete="off" className="relative px-3 pb-3 pt-2.5 min-[900px]:px-4 min-[900px]:pb-4 min-[900px]:pt-3">
          {taOpen && opts.length > 0 && (
            <ul id="fq-ta" role="listbox" aria-label="Questions proches" onMouseDown={(e) => e.preventDefault()}
              className="fq-in absolute inset-x-3 bottom-[calc(100%-4px)] z-[5] m-0 list-none rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-[var(--shadow-popover)] min-[900px]:inset-x-4">
              <li role="presentation" className="px-2.5 pb-1 pt-1.5 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.04em] text-[var(--text-muted)]">Questions proches</li>
              {opts.map((o, i) => (
                <li key={o.it.id} id={`fq-opt-${i}`} role="option" aria-selected={i === sel} onClick={() => { setValue(''); setTaOpen(false); ask(o.it.id); }}
                  className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[15px] leading-snug text-[var(--text-strong)] ${i === sel ? 'bg-[var(--raised)]' : ''}`}><ArrowUR /><span><Highlight text={o.it.q} q={value} /></span></li>
              ))}
            </ul>
          )}
          <div className="flex h-[52px] items-center gap-2 rounded-full border border-[var(--border-control)] bg-[var(--bg)] pl-[18px] pr-1.5 transition-[border-color,box-shadow] focus-within:border-[var(--focus-ring)] focus-within:shadow-[0_0_0_3px_var(--accent-subtle)]">
            <label htmlFor="fq-in" className="sr-only">Votre question</label>
            <input id="fq-in" value={value} placeholder="Posez votre question…" enterKeyHint="send" role="combobox" aria-autocomplete="list" aria-controls="fq-ta" aria-expanded={taOpen && opts.length > 0}
              aria-activedescendant={taOpen && opts.length ? `fq-opt-${sel}` : undefined}
              onChange={(e) => { setValue(e.target.value); setSel(0); setTaOpen(true); }} onBlur={() => setTimeout(() => setTaOpen(false), 120)}
              onKeyDown={(e) => { if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && opts.length) { e.preventDefault(); setSel((s) => (s + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length); } if (e.key === 'Escape') { if (taOpen) setTaOpen(false); else if (busy) finishAll(); } }}
              className="h-full min-w-0 flex-1 border-0 bg-transparent text-[max(16px,1rem)] text-[var(--text-strong)] outline-none placeholder:text-[var(--text-muted)]" />
            <button type="submit" disabled={!busy && !value.trim()} aria-label={busy ? 'Afficher toute la réponse' : 'Envoyer'}
              className={`relative grid h-10 w-10 flex-none place-items-center rounded-full transition-[background-color,transform] duration-300 ease-[cubic-bezier(.34,1.4,.64,1)] active:scale-90 disabled:bg-[var(--raised)] disabled:text-[var(--text-muted)] ${busy ? 'bg-[var(--text-strong)] text-[var(--bg)]' : 'bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]'}`}>
              {busy ? <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" aria-hidden="true"><rect x="6" y="6" width="8" height="8" rx="2" fill="currentColor" /></svg>
                : <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 16V4M5 9l5-5 5 5" /></svg>}
            </button>
          </div>
          <p className="mt-2 hidden text-center text-xs text-[var(--text-muted)] min-[900px]:block">Entrée pour envoyer · Échap pour tout afficher</p>
        </form>
        <p role="status" aria-live="polite" className="sr-only">{announce}</p>
      </div>
    </section>
  );
}

export default FaqConversationnelle;
