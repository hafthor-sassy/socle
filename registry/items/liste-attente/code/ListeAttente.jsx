// ListeAttente.jsx — liste d’attente vivante : compteur d’inscrits qui roule chiffre par chiffre, validation de l’e-mail
// avec suggestion de domaine, bouton qui devient chargement, puis la place dans la file, la vague de livraison et le
// parrainage (chaque ami fait gagner des places, le repère avance sur un ressort). Compteur suspendu hors écran.
// React 18, Tailwind 3.4, tokens.css chargé (couleurs par variables). Aucune autre dépendance.
// Exemple : Lucarne (télescope connecté fictif). Remplacez onJoin par votre appel API.
// Utilisation :
//   <ListeAttente initialCount={12530} waveSize={2500} referralGain={50} live simulate onJoin={async (email) => ({ position })} />
import { useCallback, useEffect, useRef, useState } from 'react';

const NB = '\u202f';
const fr = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NB);
const DOMAINS = ['gmail.com', 'hotmail.fr', 'hotmail.com', 'yahoo.fr', 'yahoo.com', 'outlook.fr', 'outlook.com', 'orange.fr', 'free.fr', 'icloud.com', 'laposte.net', 'sfr.fr', 'wanadoo.fr', 'proton.me'];
const WAVES = ['mars 2027', 'avril 2027', 'mai 2027', 'juin 2027', 'juillet 2027', 'septembre 2027', 'octobre 2027', 'novembre 2027'];
const FRIENDS = ['Inès', 'Malo', 'Yasmine', 'Théo', 'Lou'];
const INIT = ['CL', 'AB', 'NM', 'JR', 'SK', 'EV', 'PO', 'TD'];
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function lev(a, b) {
  const m = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++) for (let j = 1; j <= a.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (b[i - 1] === a[j - 1] ? 0 : 1));
  return m[b.length][a.length];
}
/** Vérifie l’adresse et propose un domaine proche (gmail.con → gmail.com). */
export function checkEmail(v) {
  v = v.trim();
  if (!v) return { err: 'Indiquez votre adresse e-mail.' };
  if (!v.includes('@')) return { err: 'Il manque le @ dans l’adresse.' };
  const p = v.split('@'); if (p.length > 2 || !p[0]) return { err: 'Cette adresse ne semble pas valide.' };
  const d = p[1].toLowerCase();
  if (!/^[^\s@]+\.[a-z]{2,}$/i.test(d)) return { err: 'Il manque l’extension du domaine (.fr, .com…).' };
  if (!DOMAINS.includes(d)) { let best = null, bd = 3; DOMAINS.forEach((x) => { const k = lev(d, x); if (k < bd) { bd = k; best = x; } }); if (best && bd <= 2) return { ok: true, sugg: `${p[0]}@${best}` }; }
  return { ok: true };
}

/** Nombre qui roule : une colonne 0-9 par chiffre, décalée de droite à gauche, sur un ressort CSS. */
export function RollingNumber({ value, className = '' }) {
  const str = fr(value);
  const digits = str.replace(/\D/g, '');
  const prevLen = useRef(digits.length);
  const instant = prevLen.current !== digits.length; prevLen.current = digits.length;
  let di = 0;
  return (
    <span className={`inline-flex leading-none tabular-nums align-bottom ${className}`} aria-label={str} role="img">
      {Array.from(str).map((ch, i) => {
        if (!/\d/.test(ch)) return <span key={`s${i}`} className="inline-block w-[.22em]" />;
        const d = +ch, rank = digits.length - 1 - di++;
        return (
          <span key={`${digits.length}-${i}`} aria-hidden="true" className="relative inline-block h-[1em] overflow-hidden">
            <span className="flex flex-col transition-transform duration-[900ms] ease-[cubic-bezier(.34,1.36,.64,1)] motion-reduce:transition-none"
              style={{ transform: `translateY(${-d * 10}%)`, transitionDelay: instant ? '0ms' : `${rank * 45}ms`, transitionDuration: instant ? '0ms' : undefined }}>
              {Array.from({ length: 10 }, (_, k) => <i key={k} className="block h-[1em] text-center not-italic">{k}</i>)}
            </span>
          </span>
        );
      })}
    </span>
  );
}

const Sky = () => (
  <svg viewBox="0 0 220 152" aria-hidden="true" className="absolute bottom-[-1px] left-1/2 h-[124px] w-[180px] -translate-x-1/2 md:h-[152px] md:w-[220px]">
    <path d="M30 152V110a80 80 0 0 1 160 0v42z" className="fill-[var(--bg)] stroke-[var(--border-control)]" strokeWidth="1.5" />
    {[[62, 132, 1], [88, 98, 1.2], [118, 70, .8], [150, 118, 1], [74, 66, 1.6], [168, 92, 1], [102, 126, .8], [134, 140, 1.2], [56, 104, 1], [180, 130, .8], [96, 54, 1], [142, 96, 1.6]].map(([x, y, r], i) => (
      <circle key={i} cx={x} cy={y} r={r} className={`${i % 5 === 0 ? 'fill-[var(--accent)]' : 'fill-[var(--text-muted)]'} ${i % 3 === 0 ? 'animate-[latw_3.2s_ease-in-out_infinite] group-[.is-off]/la:[animation-play-state:paused] motion-reduce:animate-none' : ''}`} style={{ animationDelay: `${-i * 0.7}s` }} />
    ))}
    <path d="M139 58a14 14 0 1 0 12 19 11 11 0 1 1-12-19z" className="fill-[var(--text-strong)]" />
  </svg>
);

/**
 * @param {{ initialCount?: number, waveSize?: number, referralGain?: number, live?: boolean, simulate?: boolean,
 *   onJoin?: (email: string) => Promise<{ position?: number } | void>, className?: string }} props
 */
export function ListeAttente({ initialCount = 12530, waveSize = 2500, referralGain = 50, live = true, simulate = true, onJoin, className = '' }) {
  const [total, setTotal] = useState(initialCount);
  const [faces, setFaces] = useState([{ k: 'a', t: 'CL' }, { k: 'b', t: 'AB' }, { k: 'c', t: 'NM' }]);
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState({ text: '', err: false, sugg: null });
  const [status, setStatus] = useState('form'); // form | loading | done | error
  const [place, setPlace] = useState(0);
  const [toast, setToast] = useState(null);
  const [delta, setDelta] = useState(false);
  const [copied, setCopied] = useState(false);
  const [announce, setAnnounce] = useState('');
  const [shake, setShake] = useState(0);
  const [link] = useState(() => `lucarne.fr/r/${Math.random().toString(36).slice(2, 7)}`);
  const root = useRef(null), placeRef = useRef(null), suggested = useRef(''), visible = useRef(true), friends = useRef(0), sim = useRef(0);
  const [offscreen, setOffscreen] = useState(false);

  /* Compteur en direct simulé, suspendu hors écran */
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; setOffscreen(!e.isIntersecting); }, { threshold: 0.1 });
    io.observe(root.current); return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!live || offscreen || reduced()) return;
    let t;
    const tick = () => { t = setTimeout(() => {
      if (!document.hidden) { setTotal((n) => n + 1 + Math.floor(Math.random() * 3)); if (Math.random() < 0.5) setFaces((f) => [{ k: Math.random(), t: INIT[Math.floor(Math.random() * INIT.length)], fresh: true }, ...f].slice(0, 4)); }
      tick();
    }, 2200 + Math.random() * 3200); };
    tick(); return () => clearTimeout(t);
  }, [live, offscreen]);

  const n = Math.min(WAVES.length, Math.max(6, Math.ceil((total + waveSize) / waveSize)));
  const wave = Math.max(1, Math.min(n, Math.ceil(place / waveSize)));

  const referral = useCallback(() => {
    setPlace((p) => {
      const before = Math.ceil(p / waveSize), next = Math.max(1, p - referralGain), after = Math.ceil(next / waveSize);
      const name = FRIENDS[friends.current++ % FRIENDS.length];
      const text = `${name} s’est inscrit avec votre lien${NB}: ${after < before ? `vous passez en vague ${after}.` : `${referralGain} places gagnées.`}`;
      setToast({ k: Math.random(), name, text }); setAnnounce(text); setDelta(true); setTimeout(() => setDelta(false), 2600);
      if (simulate && friends.current < 3) sim.current = setTimeout(referral, 5200);
      return next;
    });
  }, [waveSize, referralGain, simulate]);
  useEffect(() => () => clearTimeout(sim.current), []);

  const submit = async (e) => {
    e.preventDefault();
    if (status === 'loading') return;
    const r = checkEmail(email);
    if (!r.ok) { setMsg({ text: r.err, err: true }); setShake((s) => s + 1); return; }
    if (r.sugg && suggested.current !== email) { suggested.current = email; setMsg({ text: '', err: false, sugg: r.sugg }); return; }
    setStatus('loading'); setMsg({ text: 'Inscription en cours…', err: false });
    try {
      const res = onJoin ? await onJoin(email.trim()) : await new Promise((ok) => setTimeout(ok, reduced() ? 200 : 1100));
      const pos = res?.position ?? total + 1;
      setTotal((t) => Math.max(t + 1, pos)); setFaces((f) => [{ k: 'me', t: 'Moi', me: true, fresh: true }, ...f].slice(0, 4));
      setPlace(Math.max(1, pos - 37)); requestAnimationFrame(() => setTimeout(() => setPlace(pos), 120));
      setStatus('done'); setMsg({ text: '', err: false });
      setAnnounce(`Vous êtes sur la liste, à la place ${fr(pos)}.`);
      setTimeout(() => placeRef.current?.focus({ preventScroll: true }), 560);
      if (simulate && !reduced()) sim.current = setTimeout(referral, 3600);
    } catch {
      setStatus('error'); setMsg({ text: '', err: false });
    }
  };
  const restart = () => { clearTimeout(sim.current); friends.current = 0; setStatus('form'); setEmail(''); setToast(null); setPlace(0); setTotal((t) => t - 1); setFaces((f) => f.filter((x) => !x.me)); };
  const copy = () => { const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1800); }; navigator.clipboard?.writeText(`https://${link}`).then(done, done) ?? done(); };

  const loading = status === 'loading';
  return (
    <section ref={root} aria-labelledby="la-title" className={`group/la ${offscreen ? 'is-off' : ''} relative mx-auto grid max-w-[1184px] grid-cols-[minmax(0,1fr)] items-center gap-8 px-4 py-12 font-[family-name:var(--font-sans)] text-[var(--text)] min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,480px)] min-[900px]:gap-[72px] min-[900px]:px-8 min-[900px]:py-24 ${className}`}>
      <style>{'@keyframes latw{0%,100%{opacity:1}50%{opacity:.25}}@keyframes laface{from{transform:scale(.4);opacity:0}}@keyframes lashake{20%{transform:translateX(-6px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}@keyframes lapop{from{opacity:0;transform:translateY(8px) scale(.96)}}@keyframes lain{from{opacity:0;transform:translateY(12px)}}@media (prefers-reduced-motion:reduce){.la-anim{animation:none!important}}'}</style>
      <div>
        <a href="#accueil" aria-label="Lucarne, accueil" className="mb-5 flex w-fit items-center gap-2.5 text-[15px] font-semibold tracking-[-0.01em] text-[var(--text-strong)] no-underline min-[900px]:mb-7">
          <svg viewBox="0 0 100 100" className="h-7 w-7" aria-hidden="true"><circle cx="50" cy="50" r="50" fill="var(--accent)" /><path d="M30 76V48a20 20 0 0 1 40 0v28z" fill="none" stroke="var(--accent-fg)" strokeWidth="6" strokeLinejoin="round" /><path d="M53 41a9 9 0 1 0 8 12 7 7 0 1 1-8-12z" fill="var(--accent-fg)" /><circle cx="41" cy="62" r="3.5" fill="var(--accent-fg)" /></svg>Lucarne
        </a>
        <p className="mb-4 flex w-fit items-center gap-2 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.04em] text-[var(--accent)] before:h-1.5 before:w-1.5 before:rounded-full before:bg-current before:content-['']">Précommandes au printemps</p>
        <h2 id="la-title" className="m-0 text-balance text-[2.25rem] font-semibold leading-[1.02] tracking-[-0.04em] text-[var(--text-strong)] min-[900px]:text-[clamp(2.25rem,1.2rem+3.2vw,3.75rem)]">Le ciel profond, depuis votre balcon.</h2>
        <p className="mt-5 max-w-[46ch] text-pretty text-base leading-relaxed text-[var(--text-muted)] min-[900px]:text-[17px]">Un télescope de 11 cm qui se pointe tout seul, même en ville. Il empile les poses et vous envoie la nébuleuse sur votre téléphone, sans réglage.</p>
        <dl className="mt-7 grid grid-cols-3 gap-4 border-t border-[var(--border)] pt-5 min-[900px]:mt-10 min-[900px]:pt-6">
          {[['Ouverture', '114 mm'], ['Poids', '3,2 kg'], ['Catalogue', '5 400 objets']].map(([k, v]) => <div key={k}><dt className="text-[13px] text-[var(--text-muted)]">{k}</dt><dd className="ml-0 mt-1 text-base font-semibold tracking-[-0.02em] text-[var(--text-strong)] tabular-nums min-[900px]:text-lg">{v}</dd></div>)}
        </dl>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="relative h-[136px] overflow-hidden border-b border-[var(--border)] bg-[var(--raised)] md:h-[168px]"><Sky /></div>
        <div className="p-5 md:p-7">
          <p className="mb-5 flex items-center gap-3">
            <span className="flex flex-none" aria-hidden="true">
              {faces.map((f, i) => <span key={f.k} className={`la-anim grid h-8 w-8 place-items-center rounded-full border-2 border-[var(--surface)] font-semibold ${i ? '-ml-2' : ''} ${f.me ? 'text-[10px]' : 'text-[11px]'} ${f.fresh ? 'animate-[laface_620ms_cubic-bezier(.34,1.36,.64,1)_both] bg-[var(--accent-subtle)] text-[var(--accent)]' : 'bg-[var(--raised)] text-[var(--text-strong)]'}`}>{f.t}</span>)}
            </span>
            <span className="text-[15px] leading-snug text-[var(--text-muted)]"><strong className="font-semibold text-[var(--text-strong)]"><RollingNumber value={total} /></strong> personnes attendent déjà</span>
          </p>

          {status !== 'done' ? (
            <div key="form">
              {status === 'error' && (
                <div role="alert" className="la-anim mb-4 flex animate-[lain_420ms_cubic-bezier(.32,.72,0,1)_both] items-start gap-3 rounded-xl border border-[var(--tint-red-border)] bg-[var(--tint-red-bg)] px-3.5 py-3 text-sm leading-snug text-[var(--tint-red-fg)]">
                  <svg viewBox="0 0 20 20" className="mt-px h-[18px] w-[18px] flex-none" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 3 2.5 16.5h15z" /><path d="M10 8.5v3.5M10 14.5v.01" /></svg>
                  <div><b className="block font-semibold">La connexion a échoué.</b>Votre adresse n’a pas été enregistrée. <button type="submit" form="la-form" className="font-semibold underline underline-offset-[3px]">Réessayer</button></div>
                </div>
              )}
              <form id="la-form" noValidate onSubmit={submit} className="grid gap-2">
                <label htmlFor="la-mail" className="text-sm font-medium text-[var(--text-strong)]">Recevez votre place dans la file</label>
                <div key={shake} className={`la-anim flex flex-col gap-2 md:flex-row ${shake ? 'animate-[lashake_420ms_cubic-bezier(.32,.72,0,1)]' : ''}`}>
                  <input id="la-mail" type="email" inputMode="email" autoComplete="email" placeholder="vous@exemple.fr" value={email} aria-describedby="la-msg" aria-invalid={msg.err || undefined}
                    onChange={(e) => { setEmail(e.target.value); if (msg.err) setMsg({ text: '', err: false }); }}
                    className={`h-[52px] min-w-0 flex-none rounded-xl border bg-[var(--bg)] px-4 text-[max(16px,1rem)] text-[var(--text-strong)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--text-muted)] md:h-12 md:flex-1 ${msg.err ? 'border-[var(--down)] focus:shadow-[0_0_0_3px_var(--tint-red-bg)]' : 'border-[var(--border-control)] focus:border-[var(--focus-ring)] focus:shadow-[0_0_0_3px_var(--accent-subtle)]'}`} />
                  <button type="submit" aria-busy={loading}
                    className={`relative grid h-[52px] flex-none place-items-center self-center bg-[var(--accent)] text-[15px] font-medium text-[var(--accent-fg)] transition-[width,border-radius,background-color,transform] duration-[420ms] ease-[cubic-bezier(.32,.72,0,1)] hover:bg-[var(--accent-hover)] active:scale-[.97] md:h-12 ${loading ? 'pointer-events-none w-[52px] rounded-full md:w-12' : 'w-full rounded-xl px-5 md:w-auto'}`}>
                    <span className={`whitespace-nowrap transition-opacity duration-150 ${loading ? 'opacity-0' : ''}`}>Rejoindre la liste</span>
                    {loading && <span aria-hidden="true" className="absolute h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent" />}
                  </button>
                </div>
                <p id="la-msg" aria-live="polite" className={`m-0 min-h-5 text-[13px] leading-normal ${msg.err ? 'text-[var(--down)]' : 'text-[var(--text-muted)]'}`}>
                  {msg.sugg ? <>Vouliez-vous dire <button type="button" className="font-semibold text-[var(--accent)] underline underline-offset-[3px]" onClick={() => { setEmail(msg.sugg); setMsg({ text: 'Parfait.', err: false }); }}>{msg.sugg}</button>{NB}?</> : msg.text}
                </p>
              </form>
              <p className="mt-4 text-xs leading-normal text-[var(--text-muted)]">Un seul e-mail le jour de votre précommande. Aucun acompte, désinscription en un clic.</p>
            </div>
          ) : (
            <div key="done" className="la-anim animate-[lain_520ms_cubic-bezier(.32,.72,0,1)_both]">
              <p className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--up)]"><svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 10.5 3.2 3.2L15 7" /></svg>Vous êtes sur la liste</p>
              <h3 ref={placeRef} tabIndex={-1} className="m-0 text-sm font-normal text-[var(--text-muted)] outline-none">Votre place</h3>
              <p className="mt-1.5 flex items-baseline gap-1.5 text-5xl font-semibold tracking-[-0.04em] text-[var(--text-strong)] md:text-[clamp(3rem,2.4rem+2vw,4rem)]">
                <small className="text-[0.4em] font-medium tracking-[-0.01em] text-[var(--text-muted)]">n°</small><RollingNumber value={place} />
                <span aria-hidden="true" className={`ml-1 inline-flex h-6 items-center self-center rounded-full bg-[var(--tint-green-bg)] px-2 text-[13px] font-semibold tracking-normal text-[var(--tint-green-fg)] transition-[opacity,transform] duration-500 ease-[cubic-bezier(.34,1.36,.64,1)] ${delta ? 'opacity-100' : 'translate-y-1.5 scale-90 opacity-0'}`}>−{referralGain}</span>
              </p>
              <div className="mt-6">
                <p className="mb-2.5 flex justify-between gap-3 text-sm"><b className="font-semibold text-[var(--text-strong)]">Vague {wave}</b><span className="text-[var(--text-muted)]">livraison {WAVES[wave - 1]}</span></p>
                <div aria-hidden="true" className="relative grid h-2 gap-1" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
                  {Array.from({ length: n }, (_, k) => <i key={k} className={`rounded-full transition-colors duration-500 ${k + 1 < wave ? 'bg-[var(--accent-subtle)] shadow-[inset_0_0_0_1px_var(--accent-subtle-border)]' : k + 1 === wave ? 'bg-[var(--accent)]' : 'bg-[var(--raised)] shadow-[inset_0_0_0_1px_var(--border)]'}`} />)}
                  <span className="absolute top-1/2 -ml-2 -mt-2 h-4 w-4 rounded-full border-[3px] border-[var(--surface)] bg-[var(--text-strong)] transition-[left] duration-1000 ease-[cubic-bezier(.34,1.36,.64,1)] motion-reduce:transition-none" style={{ left: `${Math.min(100, (place / (n * waveSize)) * 100)}%` }} />
                </div>
                <p aria-hidden="true" className="mt-2 flex justify-between font-[family-name:var(--font-mono)] text-[11px] text-[var(--text-muted)]"><span>Vague 1</span><span>Vague {n}</span></p>
              </div>
              <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--raised)] p-4">
                <p className="mb-3 text-sm leading-normal">Passez devant{NB}: <b className="text-[var(--text-strong)]">chaque ami inscrit avec votre lien vous fait gagner des places.</b></p>
                <div className="flex gap-2">
                  <label htmlFor="la-link" className="sr-only">Votre lien de parrainage</label>
                  <input id="la-link" readOnly value={link} onFocus={(e) => e.target.select()} className="h-11 min-w-0 flex-1 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 font-[family-name:var(--font-mono)] text-sm text-[var(--text-strong)]" />
                  <button type="button" onClick={copy} className={`inline-flex h-11 items-center gap-1.5 rounded-[10px] border px-3.5 text-sm font-medium transition-[background-color,transform] active:scale-[.96] ${copied ? 'border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)] text-[var(--accent)]' : 'border-[var(--border-control)] bg-[var(--surface)] text-[var(--text-strong)] hover:bg-[var(--state-hover)]'}`}>{copied ? 'Copié' : 'Copier'}</button>
                </div>
              </div>
              {toast && (
                <p key={toast.k} role="status" className="la-anim mt-4 flex animate-[lapop_520ms_cubic-bezier(.34,1.36,.64,1)_both] items-center gap-2.5 rounded-xl bg-[var(--text-strong)] px-3 py-2.5 text-[13px] leading-snug text-[var(--bg)]">
                  <span aria-hidden="true" className="grid h-6 w-6 flex-none place-items-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-[var(--accent-fg)]">{toast.name.slice(0, 2).toUpperCase()}</span><span>{toast.text}</span>
                </p>
              )}
              <p className="mt-4 text-xs leading-normal text-[var(--text-muted)]">Confirmation envoyée à {email.split('@')[0].slice(0, 1)}•••@{email.split('@')[1]}. <button type="button" onClick={restart} className="text-[13px] underline underline-offset-[3px]">Ce n’est pas vous{NB}?</button></p>
            </div>
          )}
          <p role="status" aria-live="polite" className="sr-only">{announce}</p>
        </div>
      </div>
    </section>
  );
}

export default ListeAttente;
