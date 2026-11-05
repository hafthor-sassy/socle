// Passkey — React 18 + Tailwind 3.4. Couleurs : variables de tokens.css uniquement.
// Vrai WebAuthn (navigator.credentials.get) si disponible, sinon simulation : empreinte à maintenir ou visage.
// En production, onPasskey reçoit les options du serveur et renvoie l'assertion vérifiée.
import { useCallback, useEffect, useRef, useState, useId } from 'react';

const SPRING = 'linear(0, .013 .6%, .05 1.2%, .2 2.6%, .44 4.4%, .67 6.4%, .85 8.6%, .96 11%, 1.02 13.6%, 1.04 16.6%, 1.03 20.4%, 1.01 25%, 1 32%, 1)';
const RIDGES = [
  'M28 34A4 4 0 1 1 34 37.5c0 6-1 12-3 17',
  'M24.2 38.5A9 9 0 0 1 36.5 26.2M38.7 28A9 9 0 0 1 38.9 39.8c-.4 6-1.6 11-3.6 15',
  'M18.5 37.6A14 14 0 0 1 27.2 20.8M30.1 20.1A14 14 0 0 1 44.7 39.9c-.5 5-1.6 9-3.2 12.6',
  'M13.3 37.3A19 19 0 0 1 21.1 18.4M24.9 16.4A19 19 0 0 1 50.7 30.7M51 34.7A19 19 0 0 1 49.6 44',
  'M8.1 31.9A24 24 0 0 1 44 13.2M48.1 16.2A24 24 0 0 1 55.9 31.9M24.2 38.5c.6 5-.6 10-3 14',
  'M5.7 21.7A29 29 0 0 1 28 5.3M35 5.2A29 29 0 0 1 58.3 21.7M18.5 37.6c.4 4-.4 8-2 11.4',
];
const DOTS = Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2 - Math.PI / 2; return [32 + 27 * Math.cos(a), 32 + 27 * Math.sin(a)]; });
const CSS = `@keyframes pk-draw{to{stroke-dashoffset:0}}@keyframes pk-shake{20%{transform:translateX(-8px)}40%{transform:translateX(7px)}60%{transform:translateX(-4px)}80%{transform:translateX(2px)}}
@keyframes pk-up{from{opacity:0;transform:translateY(10px)}}@keyframes pk-bar{from{transform:scaleX(0)}to{transform:none}}
@media (prefers-reduced-motion: reduce){.pk-root *{animation:none!important;transition-duration:0ms!important}}`;

async function webauthnAvailable() {
  if (typeof window === 'undefined' || !window.PublicKeyCredential || !navigator.credentials || !window.isSecureContext) return false;
  const pol = document.permissionsPolicy || document.featurePolicy;
  if (pol?.allowsFeature && !pol.allowsFeature('publickey-credentials-get')) return false;
  try { return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(); } catch { return false; }
}
// Exemple : en production, le challenge vient de votre serveur et la réponse y est vérifiée.
const defaultPasskey = async () => {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  return navigator.credentials.get({ publicKey: { challenge, rpId: location.hostname, userVerification: 'required', timeout: 60000 } });
};

export function Passkey({
  mode = 'auto',                 // 'auto' | 'finger' | 'face'
  holdMs = 1200,
  webauthn = 'auto',             // 'auto' | 'simule'
  simulatedOutcome = 'success',  // 'success' | 'failure'
  onPasskey = defaultPasskey,    // () => Promise<credential>
  onPassword = async () => true, // (id, password) => Promise<boolean>
  brand = 'mélisse',
}) {
  const uid = useId().replace(/:/g, '');
  const [state, setState] = useState('idle');   // idle | scanning | success | error
  const [p, setP] = useState(0);
  const [help, setHelp] = useState('');
  const [real, setReal] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [pwErr, setPwErr] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [fails, setFails] = useState(0);
  const [announce, setAnnounce] = useState('');
  const holding = useRef(false), raf = useRef(0), last = useRef(0), pRef = useRef(0), timer = useRef(0), scanRef = useRef(null), passRef = useRef(null), okRef = useRef(null);
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const face = mode === 'face' || (mode === 'auto' && typeof navigator !== 'undefined' && /iPhone|iPad/.test(navigator.userAgent));
  const tapMode = real || face;

  useEffect(() => { let on = true; if (webauthn === 'simule') setReal(false); else webauthnAvailable().then((v) => on && setReal(v)); return () => { on = false; }; }, [webauthn]);
  useEffect(() => { if (state === 'idle') setHelp(real ? 'Touchez pour utiliser la clé de cet appareil' : face ? 'Touchez puis regardez l’écran' : 'Maintenez votre doigt sur le capteur'); }, [real, face, state]);
  useEffect(() => () => { cancelAnimationFrame(raf.current); clearTimeout(timer.current); }, []);

  const setProgress = (v) => { pRef.current = v; setP(v); };
  const say = (t) => { setHelp(t); setAnnounce(t); };
  const success = useCallback(() => {
    setProgress(1); setState('success'); say('Identité confirmée'); navigator.vibrate?.(12);
    timer.current = setTimeout(() => { setWelcome(true); setTimeout(() => okRef.current?.focus({ preventScroll: true }), 30); }, reduce ? 200 : 900);
  }, [reduce]);
  const fail = useCallback((msg) => {
    setFails((n) => n + 1); setState('error'); say(face ? 'Visage non reconnu. Réessayez.' : msg); navigator.vibrate?.([20, 60, 20]);
    timer.current = setTimeout(() => { setProgress(0); setState('idle'); }, 1600);
  }, [face]);
  const finish = useCallback(() => (simulatedOutcome === 'failure' ? fail('Empreinte non reconnue. Réessayez, ou utilisez votre mot de passe.') : success()), [simulatedOutcome, fail, success]);

  // Maintien : la progression monte pendant l'appui et redescend au relâchement
  const loop = useCallback((now) => {
    const dt = Math.min(64, now - last.current); last.current = now;
    let v = holding.current ? Math.min(1, pRef.current + dt / holdMs) : Math.max(0, pRef.current - dt / 260);
    setProgress(v);
    if (holding.current && v >= 1) { holding.current = false; raf.current = 0; finish(); return; }
    raf.current = holding.current || v > 0 ? requestAnimationFrame(loop) : 0;
  }, [holdMs, finish]);
  const start = () => {
    if (state === 'success' || welcome) return; clearTimeout(timer.current);
    holding.current = true; setState('scanning'); setHelp('Ne bougez pas…');
    if (reduce) { holding.current = false; setProgress(1); finish(); return; }
    if (!raf.current) { last.current = performance.now(); raf.current = requestAnimationFrame(loop); }
  };
  const release = () => {
    if (!holding.current) return; holding.current = false;
    if (pRef.current < 1) { setState('idle'); setHelp('Maintenez jusqu’au bout du cercle'); navigator.vibrate?.(6); }
    if (!raf.current) { last.current = performance.now(); raf.current = requestAnimationFrame(loop); }
  };
  const scanFace = () => {
    if (state === 'scanning' || state === 'success') return; clearTimeout(timer.current); setState('scanning'); setHelp('Analyse du visage…');
    if (reduce) { setProgress(1); finish(); return; }
    const t0 = performance.now(), dur = Math.min(holdMs + 400, 1800);
    const f = (now) => { const v = Math.min(1, (now - t0) / dur); setProgress(v); if (v < 1) raf.current = requestAnimationFrame(f); else { raf.current = 0; finish(); } };
    raf.current = requestAnimationFrame(f);
  };
  const realGet = async () => {
    setState('scanning'); setHelp('Suivez les instructions de votre appareil…');
    try { const cred = await onPasskey(); cred ? success() : fail('Connexion annulée.'); }
    catch (e) { setProgress(0); if (e?.name === 'NotAllowedError') { setState('idle'); say('Connexion annulée. Réessayez quand vous voulez.'); } else { setReal(false); fail('Clé d’accès indisponible sur cet appareil.'); } }
  };
  const activate = () => (real ? realGet() : scanFace());

  const submitPw = async (e) => {
    e.preventDefault(); const v = passRef.current.value;
    if (!v) { setPwErr(true); passRef.current.focus(); return; }
    setPwErr(false); if (await onPassword(e.target.elements.id.value, v)) { setWelcome(true); setAnnounce('Connexion réussie. Bienvenue, Claire.'); setTimeout(() => okRef.current?.focus({ preventScroll: true }), 30); }
  };
  const reset = () => { clearTimeout(timer.current); cancelAnimationFrame(raf.current); raf.current = 0; holding.current = false; setProgress(0); setState('idle'); setWelcome(false); setPwOpen(false); setFails(0); setTimeout(() => scanRef.current?.focus(), 30); };

  const n = RIDGES.length, k = Math.round(p * DOTS.length), err = state === 'error', ok = state === 'success';
  const field = 'h-12 rounded-[10px] border border-[var(--border-control)] bg-[var(--surface)] px-3.5 text-base text-[var(--text-strong)] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-subtle-border)]';
  const link = 'mx-auto mt-3 block min-h-11 px-3 text-sm font-medium text-[var(--text-strong)] underline decoration-[var(--border-strong)] underline-offset-[3px] hover:decoration-current';

  return (
    <div className="pk-root grid w-full font-sans text-[var(--text)] sm:place-items-center">
      <style>{CSS}</style>
      <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[var(--surface)] px-5 pb-8 pt-6 sm:min-h-0 sm:w-[min(440px,100%)] sm:rounded-2xl sm:border sm:border-[var(--border)] sm:p-8">
        <div className="mb-7 flex items-center gap-2">
          <svg viewBox="0 0 100 100" className="h-8 w-8" aria-hidden="true"><rect width="100" height="100" rx="28" fill="var(--accent)" /><path d="M50 81C29 67 19 55 19 42c0-9 7-16 16-16 7 0 12 4 15 10 3-6 8-10 15-10 9 0 16 7 16 16 0 13-10 25-31 39Z" fill="var(--accent-fg)" /><path d="M28 47h11l4-8 6 15 4-7h19" fill="none" stroke="var(--accent)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-strong)]">{brand}</span>
          <span className="ml-auto h-6 rounded-full bg-[var(--raised)] px-2.5 text-xs leading-6 text-[var(--text-muted)]">Mutuelle santé</span>
        </div>

        {!welcome ? (
          <div>
            <h2 className="text-[length:var(--t-section)] font-semibold leading-[1.3] text-[var(--text-strong)]">Accédez à votre espace adhérent</h2>
            <p className="mt-1.5 text-[15px] leading-[22px] text-[var(--text-muted)]">Remboursements, carte de tiers payant et téléconsultation, sans mot de passe.</p>

            <div className="mb-7 mt-8 grid justify-items-center gap-3 sm:mb-6 sm:mt-7">
              <button ref={scanRef} type="button" aria-describedby={`${uid}-help`} aria-label={`Se connecter avec une clé d’accès${tapMode ? '' : ' : maintenez appuyé'}`}
                onPointerDown={(e) => { if (e.button !== 0 || tapMode) return; e.preventDefault(); e.currentTarget.setPointerCapture?.(e.pointerId); start(); }}
                onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} onContextMenu={(e) => e.preventDefault()}
                onClick={() => tapMode && activate()}
                onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !tapMode) { e.preventDefault(); if (!e.repeat) start(); } }}
                onKeyUp={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !tapMode) { e.preventDefault(); release(); } }}
                className={`relative grid h-40 w-40 touch-none select-none place-items-center rounded-full transition-transform duration-[420ms] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] sm:h-[136px] sm:w-[136px] ${err ? 'bg-[var(--tint-red-bg)]' : 'bg-[var(--accent-subtle)]'} ${state === 'scanning' ? 'scale-[.94]' : ''}`}
                style={{ transitionTimingFunction: SPRING, animation: err ? 'pk-shake 480ms cubic-bezier(.2,0,0,1)' : undefined }}>
                <svg viewBox="0 0 64 64" className="h-32 w-32 overflow-visible sm:h-28 sm:w-28" aria-hidden="true">
                  <circle cx="32" cy="32" r="31" fill="none" stroke="var(--accent-subtle-border)" strokeWidth="1.5" />
                  <circle cx="32" cy="32" r="31" fill="none" pathLength="1" stroke={err ? 'var(--down)' : 'var(--accent)'} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1" strokeDashoffset={1 - p} opacity={p > 0.002 ? 1 : 0} transform="rotate(-90 32 32)" />
                  <g style={{ opacity: ok || err ? 0 : 1, transform: ok || err ? 'scale(.8)' : 'none', transformOrigin: '32px 32px', transition: `opacity 260ms, transform 420ms ${SPRING}` }}>
                    {face ? (<>
                      <path d="M14 22v-4a4 4 0 0 1 4-4h4M42 14h4a4 4 0 0 1 4 4v4M50 42v4a4 4 0 0 1-4 4h-4M22 50h-4a4 4 0 0 1-4-4v-4" fill="none" stroke="var(--text-strong)" strokeWidth="2.8" strokeLinecap="round" style={{ transform: state === 'scanning' ? 'scale(.86)' : 'none', transformOrigin: '32px 32px', transition: `transform 500ms ${SPRING}` }} />
                      <path d="M25 26v3M39 26v3M32 27v8h-2M26 40c3.5 3 8.5 3 12 0" fill="none" stroke="var(--text-strong)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                      {DOTS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.4" fill={i < k ? 'var(--accent)' : 'var(--border-strong)'} />)}
                    </>) : (<>
                      {RIDGES.map((d, i) => <path key={'b' + i} d={d} fill="none" stroke="var(--border-strong)" strokeWidth="2.6" strokeLinecap="round" />)}
                      {RIDGES.map((d, i) => { const f = Math.max(0, Math.min(1, p * (n + 1) - i)); return f > 0 && <path key={'l' + i} d={d} pathLength="1" fill="none" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="1" strokeDashoffset={1 - f} />; })}
                      {state === 'scanning' && <rect x="4" y={58 - p * 54} width="56" height="3" rx="1.5" fill="var(--accent)" opacity=".35" />}
                    </>)}
                  </g>
                  {(ok || err) && (
                    <g style={{ animation: `pk-up 420ms ${SPRING} both` }}>
                      <circle cx="32" cy="32" r="24" fill={err ? 'var(--down)' : 'var(--accent)'} />
                      <path d={err ? 'M24 24l16 16M40 24 24 40' : 'm21 32.5 7.5 7.5L44 24.5'} pathLength="1" fill="none" stroke={err ? 'var(--surface)' : 'var(--accent-fg)'} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1" strokeDashoffset="1" style={{ animation: 'pk-draw 420ms 120ms cubic-bezier(.2,0,0,1) forwards' }} />
                    </g>)}
                </svg>
              </button>
              <p id={`${uid}-help`} className={`min-h-[22px] text-center text-[15px] ${err ? 'text-[var(--down)]' : ''}`}>{help}</p>
              <span className={`inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs before:h-1.5 before:w-1.5 before:rounded-full before:bg-current ${real ? 'bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]' : 'bg-[var(--raised)] text-[var(--text-muted)]'}`}>{real ? 'Clé d’accès de cet appareil' : 'Simulation : WebAuthn indisponible ici'}</span>
            </div>

            <button type="button" onClick={() => { if (tapMode) activate(); else { scanRef.current?.focus(); say('Maintenez le capteur, ou la barre d’espace'); } }}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[var(--accent)] text-[15px] font-medium text-[var(--accent-fg)] transition hover:bg-[var(--accent-hover)] active:scale-[.97]">
              <svg viewBox="0 0 20 20" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="7.5" cy="10" r="3.5" /><path d="M11 10h6.5M15 10v3M17.5 10v2" /></svg>Se connecter avec une clé d’accès
            </button>
            <button type="button" aria-expanded={pwOpen} aria-controls={`${uid}-pw`} className={link} onClick={() => { setPwOpen((o) => !o); if (!pwOpen) setTimeout(() => passRef.current?.focus(), 60); }}>
              {pwOpen ? 'Revenir à la clé d’accès' : fails >= 2 ? 'Utiliser plutôt mon mot de passe' : 'Utiliser mon mot de passe'}
            </button>
            <div id={`${uid}-pw`} className={`grid transition-[grid-template-rows] duration-[460ms] ${pwOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`} style={{ transitionTimingFunction: SPRING }}>
              <form noValidate onSubmit={submitPw} className={`grid gap-2 overflow-hidden pt-1 transition-opacity ${pwOpen ? 'opacity-100' : 'opacity-0'}`} inert={pwOpen ? undefined : ''}>
                <label htmlFor={`${uid}-id`} className="mt-2 text-sm font-medium text-[var(--text-strong)]">E-mail ou n° d’adhérent</label>
                <input id={`${uid}-id`} name="id" defaultValue="claire.martin@exemple.fr" autoComplete="username webauthn" className={field} />
                <label htmlFor={`${uid}-pass`} className="mt-2 text-sm font-medium text-[var(--text-strong)]">Mot de passe</label>
                <input ref={passRef} id={`${uid}-pass`} type="password" autoComplete="current-password" aria-invalid={pwErr} className={`${field} ${pwErr ? 'border-[var(--down)]' : ''}`} onChange={() => setPwErr(false)} />
                {pwErr && <p className="text-sm text-[var(--down)]">Saisissez votre mot de passe.</p>}
                <button type="submit" className="mt-2 h-12 rounded-[10px] border border-[var(--border-control)] text-[15px] font-medium text-[var(--text-strong)] hover:bg-[var(--state-hover)]">Se connecter</button>
              </form>
            </div>
            <details className="mt-4 border-t border-[var(--border)] pt-3">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center text-sm text-[var(--text-muted)]">Qu’est-ce qu’une clé d’accès ?</summary>
              <p className="mt-1 text-center text-sm leading-[21px] text-[var(--text-muted)]">Une clé numérique rangée sur votre téléphone ou votre ordinateur, déverrouillée par votre empreinte, votre visage ou le code de l’appareil. Rien à retenir, et elle ne fonctionne que sur melisse.fr : impossible à hameçonner.</p>
            </details>
          </div>
        ) : (
          <div style={{ animation: `pk-up 520ms ${SPRING} both` }}>
            <span aria-hidden="true" className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-[var(--accent)] text-lg font-semibold text-[var(--accent-fg)]">CM</span>
            <h2 ref={okRef} tabIndex={-1} className="text-[length:var(--t-section)] font-semibold text-[var(--text-strong)] outline-none">Bonjour Claire</h2>
            <p className="mt-1.5 text-[15px] text-[var(--text-muted)]">Adhérente n° 0482 117 · Formule Équilibre</p>
            <ul className="mt-5 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)]">
              <li className="flex min-h-14 items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-muted)]"><span className="flex-1"><b className="font-medium text-[var(--text-strong)]">2 remboursements</b> versés cette semaine</span><span className="font-medium tabular-nums text-[var(--text-strong)]">48,30 €</span></li>
              <li className="flex min-h-14 items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-muted)]"><span className="flex-1"><b className="font-medium text-[var(--text-strong)]">Carte de tiers payant</b> valable jusqu’au 31 déc. 2026</span><span className="font-medium text-[var(--text-strong)]">Voir</span></li>
            </ul>
            <div aria-hidden="true" className="mt-5 h-1 overflow-hidden rounded-full bg-[var(--raised)]"><span className="block h-full origin-left bg-[var(--accent)]" style={{ animation: 'pk-bar 2400ms 300ms cubic-bezier(.2,0,0,1) both' }} /></div>
            <p className="mt-2 text-[13px] text-[var(--text-muted)]">Ouverture de votre espace…</p>
            <button type="button" className={link} onClick={reset}>Revenir à la connexion</button>
          </div>)}
        <p aria-live="polite" className="sr-only">{announce}</p>
      </div>
    </div>
  );
}

export default Passkey;
