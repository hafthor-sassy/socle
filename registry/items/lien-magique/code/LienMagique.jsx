// Lien magique — React 18 + Tailwind 3.4. Couleurs : variables de tokens.css uniquement.
// E-mail (avec correction des fautes de domaine), puis « Vérifiez votre boîte » : enveloppe animée,
// bouton vers la bonne messagerie, renvoi minuté à délai croissant, retour pour corriger l'adresse.
import { useEffect, useRef, useState, useId } from 'react';

const SPRING = 'linear(0, .013 .6%, .05 1.2%, .2 2.6%, .44 4.4%, .67 6.4%, .85 8.6%, .96 11%, 1.02 13.6%, 1.04 16.6%, 1.03 20.4%, 1.01 25%, 1 32%, 1)';
const PROVIDERS = {
  gmail: { name: 'Gmail', url: 'https://mail.google.com/mail/u/0/#search/from%3Afournil.fr+in%3Aanywhere+newer_than%3A1h', domains: ['gmail.com', 'googlemail.com'] },
  outlook: { name: 'Outlook', url: 'https://outlook.live.com/mail/0/', domains: ['outlook.com', 'outlook.fr', 'hotmail.com', 'hotmail.fr', 'live.com', 'live.fr', 'msn.com'] },
  yahoo: { name: 'Yahoo Mail', url: 'https://mail.yahoo.com/', domains: ['yahoo.com', 'yahoo.fr', 'ymail.com'] },
  icloud: { name: 'iCloud Mail', url: 'https://www.icloud.com/mail', domains: ['icloud.com', 'me.com', 'mac.com'] },
  orange: { name: 'Mail Orange', url: 'https://mail.orange.fr/', domains: ['orange.fr', 'wanadoo.fr'] },
  proton: { name: 'Proton Mail', url: 'https://mail.proton.me/', domains: ['proton.me', 'protonmail.com'] },
};
const TYPO = { 'gmial.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gmail.fr': 'gmail.com', 'gamil.com': 'gmail.com', 'gnail.com': 'gmail.com', 'hotmial.com': 'hotmail.com', 'outlok.com': 'outlook.com', 'yaho.fr': 'yahoo.fr', 'orage.fr': 'orange.fr' };
const fmt = (s) => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const CSS = `
@keyframes ml-up{from{opacity:0;transform:translateY(10px)}}
@keyframes ml-letter{0%{transform:translateY(-30px);opacity:0}25%{opacity:1}100%{transform:translateY(36px)}}
@keyframes ml-fb{from{transform:scaleY(1)}to{transform:scaleY(0)}}
@keyframes ml-flap{from{transform:scaleY(0)}to{transform:scaleY(-1)}}
@keyframes ml-seal{from{transform:scale(0)}to{transform:scale(1)}}
@keyframes ml-fly{0%{transform:none}30%{transform:translate(-4px,3px) rotate(-2deg)}60%{transform:translate(10px,-8px) rotate(3deg)}100%{transform:none}}
@keyframes ml-trail{0%{opacity:0;transform:translateX(16px)}40%{opacity:.9}100%{opacity:0;transform:translateX(-12px)}}
@keyframes ml-float{0%,100%{transform:none}50%{transform:translateY(-4px)}}
.ml-in>*{animation:ml-up 520ms ${SPRING} both}.ml-in>*:nth-child(2){animation-delay:40ms}.ml-in>*:nth-child(3){animation-delay:80ms}.ml-in>*:nth-child(4){animation-delay:120ms}.ml-in>*:nth-child(n+5){animation-delay:160ms}
.ml-env .flap,.ml-env .flapb{transform-box:view-box;transform-origin:100px 68px}.ml-env .flap{transform:scaleY(-1)}.ml-env .flapb{transform:scaleY(0)}.ml-env .letter{transform:translateY(36px)}.ml-env .seal{transform-box:view-box;transform-origin:100px 104px}
.ml-env.play .letter{animation:ml-letter 900ms ${SPRING} both}.ml-env.play .flapb{animation:ml-fb 240ms 600ms cubic-bezier(.4,0,1,1) both}.ml-env.play .flap{animation:ml-flap 300ms 840ms cubic-bezier(.2,0,0,1) both}
.ml-env.play .seal{animation:ml-seal 520ms 1100ms ${SPRING} both}.ml-env.play .all{animation:ml-fly 1400ms 1400ms ease-in-out both}.ml-env.play .trail path{animation:ml-trail 900ms 1650ms cubic-bezier(.2,0,0,1) both}
.ml-env.idle .all{animation:ml-float 4s ease-in-out infinite}
@media (prefers-reduced-motion: reduce){.ml-root *{animation:none!important;transition-duration:0ms!important}}`;

function Envelope({ play }) {
  const [phase, setPhase] = useState('');
  useEffect(() => {
    if (!play || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    setPhase('play'); const t = setTimeout(() => setPhase('idle'), 3000); return () => clearTimeout(t);
  }, [play]);
  const line = { stroke: 'var(--border-strong)', strokeWidth: 1.5, strokeLinejoin: 'round' };
  return (
    <div aria-hidden="true" className={`ml-env -mt-2 mb-2 grid place-items-center ${phase}`}>
      <svg viewBox="0 0 200 150" className="h-[135px] w-[180px] overflow-visible sm:h-[150px] sm:w-[200px]">
        <circle cx="100" cy="80" r="62" fill="var(--accent-subtle)" />
        <g className="trail" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" opacity={phase === 'play' ? 1 : 0}><path d="M18 58h22" /><path d="M10 72h26" /><path d="M22 86h16" /></g>
        <g className="all">
          <path d="M48 68h104v56a6 6 0 0 1-6 6H54a6 6 0 0 1-6-6Z" fill="var(--raised)" {...line} />
          <path className="flapb" d="M48 68 100 30l52 38Z" fill="var(--raised)" {...line} />
          <g className="letter">
            <rect x="60" y="34" width="80" height="56" rx="5" fill="var(--surface)" {...line} />
            <path d="M72 46h40M72 55h56M72 64h44" fill="none" stroke="var(--border)" strokeWidth="4" strokeLinecap="round" />
            <rect x="72" y="72" width="36" height="9" rx="4.5" fill="var(--accent)" />
          </g>
          <path d="M48 70l52 34 52-34v54a6 6 0 0 1-6 6H54a6 6 0 0 1-6-6Z" fill="var(--surface)" {...line} />
          <path className="flap" d="M48 68 100 30l52 38Z" fill="var(--surface)" {...line} />
          <g className="seal"><circle cx="100" cy="104" r="11" fill="var(--accent)" /><path d="M95 104l3 4M100 101l3 6M105 103l2 3" fill="none" stroke="var(--accent-fg)" strokeWidth="2" strokeLinecap="round" /></g>
        </g>
      </svg>
    </div>);
}

const btn = 'inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border text-[15px] font-medium no-underline transition active:scale-[.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]';
const MailIcon = () => <svg viewBox="0 0 20 20" className="h-[18px] w-[18px] fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2.5" y="4.5" width="15" height="11" rx="2" /><path d="m3 5.5 7 5.5 7-5.5" /></svg>;
const ExtIcon = () => <svg viewBox="0 0 20 20" className="-ml-0.5 h-3.5 w-3.5 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 4.5H4.5v11h11V12M11 4.5h4.5V9M15.5 4.5 9 11" /></svg>;

export function LienMagique({
  resendDelay = 30,
  backoff = true,
  expiryMinutes = 15,
  providers = 'auto',              // 'auto' | 'tous'
  brand = 'fournil',
  onSend = () => wait(800),        // (email) => Promise — POST /auth/magic-link
}) {
  const uid = useId().replace(/:/g, '');
  const [step, setStep] = useState('form');
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);   // { msg, fix? }
  const [busy, setBusy] = useState(false);
  const [until, setUntil] = useState(0);
  const [total, setTotal] = useState(resendDelay);
  const [tries, setTries] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [resent, setResent] = useState(null); // 'busy' | 'done' | null
  const [note, setNote] = useState('');
  const [announce, setAnnounce] = useState('');
  const [play, setPlay] = useState(0);
  const card = useRef(null), input = useRef(null), title = useRef(null), h0 = useRef(0);

  useEffect(() => { if (step !== 'sent') return; const t = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(t); }, [step]);
  // Hauteur animée entre les deux étapes
  const morph = (fn) => { h0.current = card.current?.offsetHeight || 0; fn(); };
  useEffect(() => {
    const el = card.current; if (!el || !h0.current || !el.animate || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const h1 = el.offsetHeight; if (h1 !== h0.current) el.animate([{ height: `${h0.current}px` }, { height: `${h1}px` }], { duration: 560, easing: SPRING });
    h0.current = 0;
  }, [step]);

  const startTimer = (n) => { const d = backoff ? Math.min(resendDelay * 2 ** n, 300) : resendDelay; setTotal(d); setUntil(Date.now() + d * 1000); setNow(Date.now()); };
  const left = Math.max(0, (until - now) / 1000);

  const validate = (v) => {
    const dom = (v.split('@')[1] || '').toLowerCase();
    if (!v) return { msg: 'Saisissez votre adresse e-mail.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return { msg: 'Cette adresse semble incomplète : vérifiez le @ et le domaine.' };
    if (TYPO[dom]) return { msg: 'Vouliez-vous dire ', fix: `${v.split('@')[0]}@${TYPO[dom]}` };
    return null;
  };
  const submit = async (e) => {
    e.preventDefault(); const v = email.trim(), bad = validate(v);
    if (bad) { setError(bad); input.current?.focus(); return; }
    setBusy(true); await onSend(v); setBusy(false);
    setTries(0); setNote(''); setResent(null); startTimer(0); setPlay((p) => p + 1);
    morph(() => setStep('sent'));
    setTimeout(() => title.current?.focus({ preventScroll: true }), 30);
    setAnnounce(`Lien envoyé à ${v}. Il expire dans ${expiryMinutes} minutes.`);
  };
  const resend = async () => {
    setResent('busy'); await onSend(email.trim());
    const n = tries + 1; setTries(n); setResent('done');
    const d = new Date(); setNote(`Nouveau lien envoyé à ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}. Le précédent ne fonctionne plus.`);
    setAnnounce('Nouveau lien envoyé. Le précédent ne fonctionne plus.');
    setTimeout(() => { setResent(null); startTimer(n); }, 1600);
  };

  const dom = (email.split('@')[1] || '').toLowerCase();
  const match = Object.keys(PROVIDERS).find((k) => PROVIDERS[k].domains.includes(dom));
  const list = providers === 'auto' && match ? [match] : ['gmail', 'outlook'];
  const waiting = left > 0 && resent !== 'done';

  return (
    <div className="ml-root grid w-full font-sans text-[var(--text)] sm:place-items-center">
      <style>{CSS}</style>
      <div ref={card} className="relative min-h-[100dvh] w-full overflow-hidden bg-[var(--surface)] px-5 pb-7 pt-6 sm:min-h-0 sm:w-[min(440px,100%)] sm:rounded-2xl sm:border sm:border-[var(--border)] sm:p-8">
        <div className="mb-7 flex items-center gap-2">
          <svg viewBox="0 0 100 100" className="h-8 w-8" aria-hidden="true"><rect width="100" height="100" rx="28" fill="var(--accent)" /><path d="M17 62c0-17 15-30 33-30s33 13 33 30c0 6-4 10-10 10H27c-6 0-10-4-10-10Z" fill="var(--accent-fg)" /><path d="M35 47l6 11M48 43l6 13M61 46l6 11" fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" /></svg>
          <span className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-strong)]">{brand}</span>
        </div>

        {step === 'form' ? (
          <form noValidate onSubmit={submit} className="ml-in">
            <h2 className="text-[length:var(--t-section)] font-semibold leading-[1.3] text-[var(--text-strong)]">Connexion à votre compte</h2>
            <p className="mb-6 mt-2 text-[15px] leading-[22px] text-[var(--text-muted)]">Commandez votre pain pour demain matin. Pas de mot de passe : nous vous envoyons un lien de connexion.</p>
            <div>
              <label htmlFor={`${uid}-e`} className="mb-2 block text-sm font-medium text-[var(--text-strong)]">Adresse e-mail</label>
              <input ref={input} id={`${uid}-e`} type="email" inputMode="email" autoComplete="email" placeholder="vous@exemple.fr" value={email}
                aria-invalid={!!error} aria-describedby={error ? `${uid}-err` : undefined} onChange={(e) => { setEmail(e.target.value); setError(null); }}
                className={`h-12 w-full rounded-[10px] border bg-[var(--surface)] px-3.5 text-base text-[var(--text-strong)] outline-none transition placeholder:text-[var(--text-disabled)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-subtle-border)] ${error ? 'border-[var(--down)]' : 'border-[var(--border-control)] hover:border-[var(--text-muted)]'}`} />
              {error && <p id={`${uid}-err`} className="mt-2 text-sm text-[var(--down)]">{error.msg}{error.fix && <><button type="button" className="font-semibold underline underline-offset-[3px]" onClick={() => { setEmail(error.fix); setError(null); input.current?.focus(); }}>{error.fix}</button> ?</>}</p>}
            </div>
            <button type="submit" disabled={busy} className={`${btn} mt-4 w-full border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]`}>
              {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />}{busy ? 'Envoi…' : 'Recevoir mon lien'}
            </button>
            <p className="mt-4 text-[13px] leading-[19px] text-[var(--text-muted)]">En continuant, vous acceptez nos conditions d’utilisation. Nouveau client ? Le même lien crée votre compte.</p>
          </form>
        ) : (
          <div className="ml-in">
            <Envelope play={play} />
            <h2 ref={title} tabIndex={-1} className="text-center text-[length:var(--t-section)] font-semibold leading-[1.3] text-[var(--text-strong)] outline-none">Vérifiez votre boîte de réception</h2>
            <p className="mb-6 mt-2 text-center text-[15px] leading-[22px] text-[var(--text-muted)]">Nous avons envoyé un lien à <strong className="inline-block max-w-full font-semibold text-[var(--text-strong)] [overflow-wrap:anywhere]">{email.trim()}</strong>. Il expire dans {expiryMinutes} minutes.</p>
            <div className="grid gap-2">
              {list.map((k, i) => (
                <a key={k} href={PROVIDERS[k].url} target="_blank" rel="noopener noreferrer"
                  className={`${btn} w-full ${i === 0 ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]' : 'border-[var(--border-control)] bg-[var(--surface)] text-[var(--text-strong)] hover:bg-[var(--state-hover)]'}`}>
                  <MailIcon />Ouvrir {PROVIDERS[k].name}<ExtIcon /><span className="sr-only"> (nouvel onglet)</span>
                </a>))}
              {providers === 'auto' && !match && <small className="mt-1 text-center text-[13px] text-[var(--text-muted)]">Ou ouvrez votre messagerie habituelle.</small>}
            </div>
            <p className="mt-4 text-center text-[13px] leading-[19px] text-[var(--text-muted)]">Rien reçu ? Regardez dans les courriers indésirables ou l’onglet Promotions.</p>
            <div className="mt-3 flex flex-col gap-1 border-t border-[var(--border)] pt-3 sm:flex-row sm:justify-center">
              <button type="button" disabled={waiting || resent === 'busy'} onClick={resend}
                className={`inline-flex h-12 min-w-[196px] items-center justify-center gap-2 rounded-[10px] px-3 text-sm font-medium tabular-nums transition hover:enabled:bg-[var(--state-hover)] sm:h-11 ${resent === 'done' ? 'text-[var(--up)]' : waiting ? 'text-[var(--text-muted)]' : 'text-[var(--text-strong)]'}`}>
                {resent === 'done'
                  ? <svg viewBox="0 0 20 20" className="h-[18px] w-[18px] fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 10.5 3 3 7-7" /></svg>
                  : waiting && <svg viewBox="0 0 20 20" className="h-[18px] w-[18px] -rotate-90 fill-none" strokeWidth="2" aria-hidden="true"><circle cx="10" cy="10" r="8" stroke="var(--border)" /><circle cx="10" cy="10" r="8" stroke="var(--accent)" strokeLinecap="round" strokeDasharray="50.27" strokeDashoffset={50.27 * (1 - left / total)} /></svg>}
                {resent === 'busy' ? 'Envoi…' : resent === 'done' ? 'Lien renvoyé' : waiting ? `Renvoyer dans ${fmt(left)}` : 'Renvoyer le lien'}
              </button>
              <button type="button" onClick={() => { morph(() => setStep('form')); setTimeout(() => { input.current?.focus(); input.current?.select(); }, 30); }}
                className="inline-flex h-12 items-center justify-center rounded-[10px] px-3 text-sm font-medium text-[var(--text-muted)] transition hover:bg-[var(--state-hover)] hover:text-[var(--text-strong)] sm:h-11">Modifier l’adresse</button>
            </div>
            {note && <p className="mt-2 rounded-[10px] bg-[var(--raised)] px-3 py-2.5 text-center text-[13px] leading-[19px]" style={{ animation: `ml-up 420ms ${SPRING} both` }}>{note}</p>}
          </div>)}
        <p aria-live="polite" className="sr-only">{announce}</p>
      </div>
    </div>
  );
}

export default LienMagique;
