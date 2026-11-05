// Clés API — React 18 + Tailwind 3.4. Couleurs : variables de tokens.css uniquement.
// Création avec affichage unique du secret, rotation avec délai de grâce et compte à rebours, révocation confirmée.
// Branchez onCreate / onRotate / onRevoke sur votre API : onCreate et onRotate renvoient le secret en clair (une seule fois).
import { useEffect, useRef, useState, useId } from 'react';

const SPRING = 'linear(0, .013 .6%, .05 1.2%, .2 2.6%, .44 4.4%, .67 6.4%, .85 8.6%, .96 11%, 1.02 13.6%, 1.04 16.6%, 1.03 20.4%, 1.01 25%, 1 32%, 1)';
const SCOPES = { previsions: ['Prévisions', 'Lecture · /v2/previsions'], historique: ['Historique', 'Lecture · /v2/archives'], alertes: ['Alertes', 'Écriture · webhooks'] };
const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const rand = (n) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return Array.from(a, (x) => A[x % 62]).join(''); };
const fmt = (ms) => { let s = Math.max(0, Math.ceil(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); s %= 60; return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':'); };
const later = (v) => new Promise((r) => setTimeout(() => r(v), 700));

export const DEFAULT_KEYS = [
  { id: 'k1', name: 'Serveur de production', env: 'live', scopes: ['previsions', 'historique'], tail: '3f9a', created: '12 mars 2026', last: 'il y a 2 min', calls: '48 210 appels / 7 j' },
  { id: 'k2', name: 'Application iOS', env: 'live', scopes: ['previsions'], tail: 'b71c', created: '4 juin 2026', last: 'il y a 1 h', calls: '9 874 appels / 7 j' },
  { id: 'k3', name: 'Alertes gel (cron)', env: 'live', scopes: ['previsions', 'alertes'], tail: 'e02d', created: '18 sept. 2026', last: 'hier, 23:40', calls: '1 402 appels / 7 j' },
];

const btn = 'inline-flex h-11 sm:h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-3.5 text-sm font-medium transition active:scale-[.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed';
const btnSec = `${btn} border-[var(--border-control)] bg-[var(--surface)] text-[var(--text-strong)] hover:bg-[var(--state-hover)]`;
const btnPri = `${btn} border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] disabled:border-[var(--border)] disabled:bg-[var(--raised)] disabled:text-[var(--text-disabled)]`;
const Icon = ({ d, className = 'h-[18px] w-[18px]' }) => <svg viewBox="0 0 20 20" className={`${className} flex-none fill-none stroke-current`} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;

export function ClesApi({
  keys: initialKeys = DEFAULT_KEYS,
  speed = 2880,            // démo : 24 h en 30 s ; en production : 1
  defaultGrace = 86400,    // secondes proposées par défaut pour la rotation
  prefix = 'iso',
  scramble = true,
  requireAck = true,
  onCreate = () => later(rand(32)),   // ({ name, env, scopes }) => Promise<secret>
  onRotate = () => later(rand(32)),   // (key, graceSeconds) => Promise<secret>
  onRevoke = () => {},                // (key) => void
}) {
  const uid = useId().replace(/:/g, '');
  const [keys, setKeys] = useState(() => initialKeys.map((k) => ({ ...k, status: 'active' })));
  const [env, setEnv] = useState('live');
  const [dlg, setDlg] = useState(null);       // { mode: 'create' | 'rotate', key?, step: 'form' | 'secret', secret?, newId? }
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [nameErr, setNameErr] = useState(false);
  const [scopes, setScopes] = useState(['previsions']);
  const [grace, setGrace] = useState(defaultGrace);
  const [shown, setShown] = useState('');
  const [copied, setCopied] = useState(false);
  const [ack, setAck] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [announce, setAnnounce] = useState('');
  const rootRef = useRef(null), opener = useRef(null), seen = useRef(true);
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const pre = (k) => `${prefix}_${k.env}_`;

  useEffect(() => setGrace(defaultGrace), [defaultGrace]);
  useEffect(() => {
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => { seen.current = e.isIntersecting; }) : null;
    io?.observe(rootRef.current);
    const t = setInterval(() => { if (seen.current && !document.hidden) setNow(Date.now()); }, 250);
    return () => { clearInterval(t); io?.disconnect(); };
  }, []);
  // Échéance de rotation atteinte : révocation automatique
  useEffect(() => { keys.forEach((k) => { if (k.status === 'rotating' && (k.revokeAt - now) * speed <= 0) revoke(k, 'auto'); }); }, [now]); // eslint-disable-line

  const revoke = (k, why) => {
    onRevoke(k); setConfirm(null);
    setKeys((ks) => ks.map((x) => (x.id === k.id ? { ...x, status: 'revoked' } : x)));
    setAnnounce(`Clé « ${k.name} » révoquée${why === 'auto' ? ' : le délai de grâce est écoulé.' : '.'}`);
    setTimeout(() => setKeys((ks) => ks.map((x) => (x.id === k.id ? { ...x, status: 'leaving' } : x))), reduce ? 600 : 1400);
    setTimeout(() => setKeys((ks) => ks.filter((x) => x.id !== k.id)), reduce ? 600 : 1850);
  };
  const open = (mode, key) => { opener.current = document.activeElement; setName(''); setNameErr(false); setScopes(['previsions']); setGrace(defaultGrace); setCopied(false); setAck(false); setDlg({ mode, key, step: 'form' }); };
  const close = () => { setDlg(null); setTimeout(() => opener.current?.focus?.(), 0); };

  const submit = async () => {
    if (dlg.mode === 'create' && !name.trim()) { setNameErr(true); return; }
    setBusy(true);
    const k = dlg.mode === 'rotate'
      ? { id: 'n' + Date.now(), name: dlg.key.name, env: dlg.key.env, scopes: dlg.key.scopes }
      : { id: 'n' + Date.now(), name: name.trim(), env, scopes: scopes.length ? scopes : ['previsions'] };
    const secret = dlg.mode === 'rotate' ? await onRotate(dlg.key, grace) : await onCreate(k);
    setBusy(false);
    const fresh = { ...k, tail: secret.slice(-4), created: 'aujourd’hui', last: 'Jamais utilisée', calls: '0 appel', status: 'active', fresh: true };
    setKeys((ks) => {
      if (dlg.mode !== 'rotate') return [fresh, ...ks];
      const i = ks.findIndex((x) => x.id === dlg.key.id), out = [...ks];
      out[i] = grace > 0 ? { ...out[i], status: 'rotating', graceMs: grace * 1000, revokeAt: Date.now() + (grace * 1000) / speed } : out[i];
      out.splice(i, 0, fresh); return out;
    });
    setDlg((d) => ({ ...d, step: 'secret', secret: pre(k) + secret, newId: k.id }));
    setAnnounce('Clé créée. Elle ne sera affichée qu’une fois : copiez-la maintenant.');
  };
  // Déchiffrement animé du secret
  useEffect(() => {
    if (dlg?.step !== 'secret') return;
    const full = dlg.secret, p = full.indexOf('_', full.indexOf('_') + 1) + 1;
    if (!scramble || reduce) { setShown(full); return; }
    let raf, t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / 900), n = p + Math.floor((full.length - p) * k); setShown(full.slice(0, n) + (n < full.length ? '\u0000' + rand(full.length - n) : '')); if (k < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
  }, [dlg?.step, dlg?.secret, scramble, reduce]);

  const finish = () => {
    if (dlg.mode === 'rotate' && grace === 0) revoke(dlg.key, 'now');
    else if (dlg.mode === 'rotate') setAnnounce(`Ancienne clé valable encore ${fmt(grace * 1000)}.`);
    close(); setTimeout(() => setKeys((ks) => ks.map((x) => ({ ...x, fresh: false }))), 8000);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(dlg.secret); setCopied(true); setAnnounce('Clé copiée dans le presse-papiers.'); }
    catch { const r = document.createRange(); r.selectNodeContents(document.getElementById(`${uid}-secret`)); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  };
  const trap = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); if (dlg.step === 'form') close(); else setAnnounce('Copiez la clé puis cochez la confirmation pour fermer.'); }
    if (e.key !== 'Tab') return;
    const f = [...e.currentTarget.querySelectorAll('button, input, summary')].filter((x) => !x.disabled && x.offsetParent);
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  };

  const visible = keys.filter((k) => k.env === env);
  const count = (e) => keys.filter((k) => k.env === e && k.status !== 'revoked' && k.status !== 'leaving').length;
  const [sv, ss] = shown.split('\u0000');

  return (
    <div ref={rootRef} className="relative isolate mx-auto min-h-screen w-full max-w-[1040px] overflow-hidden bg-[var(--surface)] font-sans text-[var(--text)] sm:min-h-[640px] sm:rounded-2xl sm:border sm:border-[var(--border)]" style={{ '--ak-spring': SPRING }}>
      <style>{`@keyframes ak-new{0%,60%{background:var(--accent-subtle)}100%{background:transparent}}@keyframes ak-in{from{opacity:0;transform:translateY(12px) scale(.97)}}@media (prefers-reduced-motion: reduce){.ak-m{animation:none!important;transition:none!important}}`}</style>
      <header className="flex h-[60px] items-center gap-4 border-b border-[var(--border)] px-4 sm:px-6">
        <span className="inline-flex items-center gap-2">
          <svg viewBox="0 0 100 100" className="h-7 w-7" aria-hidden="true"><rect width="100" height="100" rx="28" fill="var(--accent)" /><g fill="none" stroke="var(--accent-fg)" strokeWidth="5"><ellipse cx="49" cy="51" rx="30" ry="23" transform="rotate(-18 49 51)" /><ellipse cx="53" cy="49" rx="17.5" ry="12.5" transform="rotate(-18 53 49)" /></g><circle cx="56" cy="48" r="4.5" fill="var(--accent-fg)" /></svg>
          <span className="text-lg font-semibold tracking-[-0.03em] text-[var(--text-strong)]">isobare</span>
        </span>
        <span className="ml-auto inline-flex items-center gap-2 text-sm text-[var(--text-muted)] sm:ml-0 sm:border-l sm:border-[var(--border)] sm:pl-4"><span className="h-2 w-2 rounded-full bg-[var(--up)]" />Projet : Météo-Rail</span>
      </header>

      <div className="p-4 pt-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[length:var(--t-page)] font-semibold leading-[var(--t-page-lh)] tracking-[-0.02em] text-[var(--text-strong)]">Clés API</h2>
            <p className="mt-1.5 max-w-[52ch] text-[15px] text-[var(--text-muted)]">Signez vos appels à l’API Prévisions. Une clé secrète n’est affichée qu’une seule fois.</p>
          </div>
          <button type="button" className={btnPri} onClick={() => open('create')}><Icon d="M10 4v12M4 10h12" />Créer une clé</button>
        </div>

        <div role="tablist" aria-label="Environnement" className="mb-4 mt-6 flex gap-1 border-b border-[var(--border)]"
          onKeyDown={(e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') setEnv((v) => (v === 'live' ? 'test' : 'live')); }}>
          {[['live', 'Production'], ['test', 'Test']].map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={env === id} tabIndex={env === id ? 0 : -1} onClick={() => setEnv(id)}
              className={`relative inline-flex h-11 items-center gap-2 px-3 text-sm font-medium ${env === id ? 'text-[var(--text-strong)] after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded after:bg-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
              {label}<span className="h-5 min-w-5 rounded-full bg-[var(--raised)] px-1.5 font-mono text-xs leading-5 text-[var(--text-muted)]">{count(id)}</span>
            </button>))}
        </div>

        <ul role="tabpanel" aria-label="Clés" className="grid gap-3 lg:gap-0 lg:overflow-hidden lg:rounded-xl lg:border lg:border-[var(--border)]">
          {visible.length === 0 && (
            <li className="grid justify-items-center gap-2 rounded-xl border border-[var(--border)] px-6 py-12 text-center lg:border-0">
              <svg viewBox="0 0 56 56" className="h-14 w-14 fill-none stroke-[var(--text-muted)]" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="20" cy="28" r="9" /><path d="M29 28h20M42 28v7M48 28v5" /><circle cx="20" cy="28" r="2.5" /></svg>
              <b className="mt-1 text-[15px] font-medium text-[var(--text-strong)]">Aucune clé {env === 'test' ? 'de test' : 'de production'}</b>
              <p className="mb-2 max-w-[40ch] text-sm text-[var(--text-muted)]">{env === 'test' ? 'Les clés de test appellent le bac à sable : données fictives, sans quota.' : 'Créez une clé pour signer vos appels.'}</p>
              <button type="button" className={btnPri} onClick={() => open('create')}>Créer une clé {env === 'test' ? 'de test' : ''}</button>
            </li>)}
          {visible.map((k) => {
            const rotating = k.status === 'rotating', revoked = k.status === 'revoked' || k.status === 'leaving', left = rotating ? (k.revokeAt - now) * speed : 0;
            return (
              <li key={k.id} aria-label={k.name}
                className={`ak-m relative grid overflow-hidden rounded-xl border border-[var(--border)] transition-[grid-template-rows,opacity] duration-[420ms] [transition-timing-function:var(--ak-spring)] lg:rounded-none lg:border-0 lg:border-t lg:first:border-t-0 ${k.status === 'leaving' ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr]'}`}
                style={k.fresh ? { animation: 'ak-new 1600ms var(--ease-out) both' } : undefined}>
                <div className="min-h-0">
                  <div className={`grid gap-3 p-4 lg:min-h-[76px] lg:grid-cols-[minmax(200px,1.25fr)_minmax(230px,1.15fr)_minmax(140px,.8fr)_264px] lg:items-center lg:gap-x-6 lg:px-5 lg:py-3.5 ${revoked ? 'opacity-[.55]' : ''}`}>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-[15px] font-medium text-[var(--text-strong)]">{k.name}
                        {rotating && <span className="h-[22px] rounded-full border border-[var(--tint-amber-border)] bg-[var(--tint-amber-bg)] px-2 text-xs leading-5 text-[var(--tint-amber-fg)]">En rotation</span>}
                        {revoked && <span className="h-[22px] rounded-full border border-[var(--tint-red-border)] bg-[var(--tint-red-bg)] px-2 text-xs leading-5 text-[var(--tint-red-fg)]">Révoquée</span>}
                        {k.fresh && !revoked && <span className="h-[22px] rounded-full border border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)] px-2 text-xs leading-5">Nouvelle</span>}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5" aria-label="Permissions">{k.scopes.map((s) => <span key={s} className="h-[22px] rounded-md border border-[var(--border)] bg-[var(--raised)] px-2 font-mono text-xs leading-5 text-[var(--text-muted)]">{SCOPES[s]?.[0].toLowerCase()}</span>)}</div>
                    </div>
                    <div>
                      <span aria-label={`Clé se terminant par ${k.tail.split('').join(' ')}`} className={`whitespace-nowrap font-mono text-sm font-medium ${rotating ? 'text-[var(--text-muted)]' : ''} ${revoked ? 'line-through decoration-[var(--down)]' : ''}`}>{pre(k)}<i aria-hidden="true" className="not-italic tracking-[.08em] text-[var(--text-muted)]">••••••••</i>{k.tail}</span>
                      <small className="mt-1 block text-[13px] text-[var(--text-muted)]">Créée {k.created === 'aujourd’hui' ? 'aujourd’hui' : `le ${k.created}`}</small>
                    </div>
                    <div className="text-sm">{k.last}<small className="mt-0.5 block text-[13px] tabular-nums text-[var(--text-muted)]">{k.calls}</small></div>
                    {!revoked && (
                      <div className="flex gap-2 lg:justify-end">
                        {rotating ? (<>
                          <button type="button" className={`${btnSec} flex-1 lg:flex-none`} onClick={() => setKeys((ks) => ks.map((x) => (x.id === k.id ? { ...x, status: 'active' } : x)))}>Garder</button>
                          <button type="button" className={`${btnSec} flex-1 lg:flex-none`} onClick={() => revoke(k, 'now')}>Révoquer maintenant</button>
                        </>) : (<>
                          <button type="button" className={`${btnSec} flex-1 lg:flex-none`} onClick={() => open('rotate', k)}><Icon d="M15.5 8A6 6 0 0 0 4.6 6.5M4.5 12a6 6 0 0 0 10.9 1.5M15.8 3.5V8h-4.4M4.2 16.5V12h4.4" />Faire tourner</button>
                          <button type="button" aria-label={`Révoquer « ${k.name} »`} title="Révoquer" className={`${btn} w-11 border-transparent px-0 text-[var(--text-muted)] hover:bg-[var(--state-hover)] hover:text-[var(--text-strong)] sm:w-10`} onClick={() => setConfirm(k.id)}><Icon d="M4 6h12M8 6V4.5h4V6M6 6l.7 9.5h6.6L14 6" /></button>
                        </>)}
                      </div>)}
                  </div>
                  {rotating && (
                    <div className="flex flex-wrap items-center gap-3 px-4 pb-4 lg:flex-nowrap lg:px-5 lg:pb-3.5">
                      <span className="whitespace-nowrap text-sm font-medium text-[var(--warn)]">Révocation dans <b className="font-mono tabular-nums">{fmt(left)}</b></span>
                      <span className="h-1 min-w-20 flex-[1_1_100%] overflow-hidden rounded-full bg-[var(--raised)] lg:flex-1"><span className="block h-full origin-left rounded-full bg-[var(--warn)]" style={{ transform: `scaleX(${Math.max(0, left / k.graceMs)})` }} /></span>
                    </div>)}
                  <div className={`ak-m grid transition-[grid-template-rows] duration-[360ms] [transition-timing-function:var(--ak-spring)] ${confirm === k.id ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                      <div role="group" aria-label="Confirmer la révocation" className="mx-3 mb-3 flex flex-col gap-3 rounded-[10px] border border-[var(--tint-red-border)] bg-[var(--tint-red-bg)] p-3 sm:flex-row sm:items-center sm:pl-4">
                        <p className="flex-1 text-sm text-[var(--tint-red-fg)]">Révoquer <b className="font-semibold">{k.name}</b> ? Les appels signés avec cette clé échoueront aussitôt (401).</p>
                        <button type="button" tabIndex={confirm === k.id ? 0 : -1} className={btnSec} onClick={() => setConfirm(null)}>Annuler</button>
                        <button type="button" tabIndex={confirm === k.id ? 0 : -1} className={`${btn} border-[var(--down)] bg-[var(--down)] text-[var(--surface)]`} onClick={() => revoke(k, 'now')}>Révoquer</button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>);
          })}
        </ul>
        <p className="mt-4 text-[13px] text-[var(--text-muted)]">Les clés révoquées refusent les appels avec une erreur 401. Le journal garde leur trace pendant 90 jours.</p>
      </div>

      {dlg && (
        <div className="absolute inset-0 z-50 grid place-items-end sm:place-items-center sm:p-6">
          <div className="absolute inset-0 bg-[var(--scrim)]" onClick={() => dlg.step === 'form' && close()} />
          <div role="dialog" aria-modal="true" aria-labelledby={`${uid}-t`} onKeyDown={trap}
            className="ak-m relative max-h-[92%] w-full overflow-auto rounded-t-2xl border-t border-[var(--border)] bg-[var(--surface)] px-4 pb-4 pt-6 shadow-[var(--shadow-popover)] sm:w-[min(560px,100%)] sm:rounded-2xl sm:border sm:p-7"
            style={{ animation: `ak-in 460ms ${SPRING} both` }}>
            {dlg.step === 'form' ? (<>
              <h3 id={`${uid}-t`} className="text-[length:var(--t-section)] font-semibold text-[var(--text-strong)]">{dlg.mode === 'rotate' ? `Faire tourner « ${dlg.key.name} »` : `Nouvelle clé ${env === 'test' ? 'de test' : 'secrète'}`}</h3>
              <p className="mb-5 mt-2 text-sm leading-[21px] text-[var(--text-muted)]">{dlg.mode === 'rotate' ? 'Une nouvelle clé est créée avec les mêmes permissions. L’ancienne peut rester valable le temps de déployer la nouvelle.' : 'Donnez-lui le nom du service qui l’utilisera : vous la retrouverez plus vite le jour où il faudra la révoquer.'}</p>
              {dlg.mode === 'create' ? (
                <div className="grid gap-2">
                  <label htmlFor={`${uid}-n`} className="text-sm font-medium text-[var(--text-strong)]">Nom</label>
                  <input id={`${uid}-n`} autoFocus value={name} maxLength={40} placeholder="Serveur de production" aria-invalid={nameErr} aria-describedby={nameErr ? `${uid}-e` : undefined}
                    onChange={(e) => { setName(e.target.value); setNameErr(false); }} onKeyDown={(e) => e.key === 'Enter' && submit()}
                    className={`h-11 rounded-lg border bg-[var(--surface)] px-3 text-base text-[var(--text-strong)] ${nameErr ? 'border-[var(--down)]' : 'border-[var(--border-control)]'}`} />
                  {nameErr && <p id={`${uid}-e`} className="text-[13px] text-[var(--down)]">Donnez un nom à la clé.</p>}
                  <fieldset className="mt-3 grid gap-2"><legend className="mb-2 text-sm font-medium text-[var(--text-strong)]">Permissions</legend>
                    {Object.entries(SCOPES).map(([id, [t, d]]) => { const on = scopes.includes(id); return (
                      <label key={id} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-[10px] border px-3.5 py-2 transition-colors ${on ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border)]'}`}>
                        <input type="checkbox" checked={on} onChange={() => setScopes((s) => (on ? s.filter((x) => x !== id) : [...s, id]))} className="h-[18px] w-[18px] accent-[var(--accent)]" />
                        <span><b className="block text-sm font-medium text-[var(--text-strong)]">{t}</b><small className="block font-mono text-[13px] text-[var(--text-muted)]">{d}</small></span>
                      </label>); })}
                  </fieldset>
                </div>
              ) : (
                <fieldset className="grid gap-2"><legend className="mb-2 text-sm font-medium text-[var(--text-strong)]">Garder l’ancienne clé valable</legend>
                  {[[0, 'Non, révoquer tout de suite'], [3600, 'Pendant 1 heure'], [86400, 'Pendant 24 heures']].map(([v, l]) => (
                    <label key={v} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-[10px] border px-3.5 text-sm text-[var(--text-strong)] ${grace === v ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border)]'}`}>
                      <input type="radio" name={`${uid}-g`} checked={grace === v} onChange={() => setGrace(v)} className="h-[18px] w-[18px] accent-[var(--accent)]" />{l}
                    </label>))}
                </fieldset>)}
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" className={`${btnSec} flex-1 sm:flex-none`} onClick={close}>Annuler</button>
                <button type="button" className={`${btnPri} flex-1 sm:flex-none`} disabled={busy} onClick={submit}>
                  {busy && <span className="ak-m h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />}
                  {dlg.mode === 'rotate' ? 'Créer la nouvelle clé' : 'Créer la clé'}
                </button>
              </div>
            </>) : (<>
              <span aria-hidden="true" className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]"><Icon d="m5 10.5 3 3 7-7" className="h-[22px] w-[22px]" /></span>
              <h3 id={`${uid}-t`} className="text-[length:var(--t-section)] font-semibold text-[var(--text-strong)]">{dlg.mode === 'rotate' ? `Nouvelle clé pour « ${dlg.key.name} »` : 'Copiez votre clé maintenant'}</h3>
              <p className="mb-5 mt-2 text-sm leading-[21px] text-[var(--text-muted)]">Isobare n’en garde qu’une empreinte : <strong className="font-semibold text-[var(--text-strong)]">elle ne sera plus jamais affichée</strong>. Rangez-la dans votre gestionnaire de secrets.</p>
              <div className="flex flex-col gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--raised)] p-2 pl-3.5 sm:flex-row sm:items-center">
                <code id={`${uid}-secret`} aria-label="Clé secrète" className="min-w-0 flex-1 select-all break-all font-mono text-sm font-medium leading-[22px] text-[var(--text-strong)]">{sv}<span className="text-[var(--text-muted)]">{ss}</span></code>
                <button type="button" autoFocus onClick={copy} className={`${btn} min-w-[108px] ${copied ? 'border-[var(--tint-green-border)] bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]' : 'border-[var(--border-control)] bg-[var(--surface)] text-[var(--text-strong)]'}`}>
                  <Icon d={copied ? 'm5 10.5 3 3 7-7' : 'M7 7h9v9H7zM13 4.5H6A1.5 1.5 0 0 0 4.5 6v7'} />{copied ? 'Copiée' : 'Copier'}
                </button>
              </div>
              <details className="mt-3 rounded-[10px] border border-[var(--border)]">
                <summary className="flex min-h-11 cursor-pointer items-center px-3.5 text-sm">Exemple d’appel</summary>
                <pre className="overflow-x-auto border-t border-[var(--border)] px-3.5 pb-3.5 pt-3 font-mono text-[13px] leading-5">{`curl "https://api.isobare.dev/v2/previsions?lat=45.76&lon=4.83" \\\n  -H "Authorization: Bearer ${dlg.secret}"`}</pre>
              </details>
              {requireAck && <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 text-sm text-[var(--text-strong)]"><input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="h-[18px] w-[18px] accent-[var(--accent)]" />J’ai enregistré la clé en lieu sûr</label>}
              <div className="mt-6 flex justify-end"><button type="button" className={`${btnPri} flex-1 sm:flex-none`} disabled={requireAck ? !ack : !copied} onClick={finish}>Terminé</button></div>
            </>)}
          </div>
        </div>)}
      <p aria-live="polite" className="sr-only">{announce}</p>
    </div>
  );
}

export default ClesApi;
