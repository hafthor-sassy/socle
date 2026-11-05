// Connexion à scène vivante — React 18 + Tailwind 3.4. Couleurs : variables de tokens.css uniquement.
// La chouette suit le curseur de saisie, se cache les yeux sur le mot de passe, jette un œil s'il est affiché,
// secoue la tête à l'erreur et sautille à la réussite. Branchez onSignIn sur votre API.
import { useCallback, useEffect, useRef, useState, useId } from 'react';

const SPRINGS = {
  doux: { css: 'linear(0, .013 .6%, .05 1.2%, .2 2.6%, .44 4.4%, .67 6.4%, .85 8.6%, .96 11%, 1.02 13.6%, 1.04 16.6%, 1.03 20.4%, 1.01 25%, 1 32%, 1)', k: 0.09, d: 0.26 },
  joueur: { css: 'linear(0, .02 .8%, .09 1.8%, .35 4%, .7 6.6%, 1 9.4%, 1.17 12.2%, 1.22 14.4%, 1.2 16.8%, 1.1 21%, 1 25.4%, .95 29.4%, .95 33%, .99 39%, 1.01 45%, 1.01 52%, 1 64%, 1)', k: 0.14, d: 0.16 },
};

// Styles de la scène : les poses sont des sélecteurs sur data-pose.
const SCENE_CSS = `
.cs-scene{--cs-wing:color-mix(in oklab,var(--accent) 72%,var(--text-strong))}
.cs-scene .wing{transform-box:view-box;transition:transform 620ms var(--cs-spring)}
.cs-scene .wl{transform-origin:106px 186px}.cs-scene .wr{transform-origin:214px 186px}
.cs-scene .head{transform-box:view-box;transform-origin:160px 170px}
.cs-scene .hop,.cs-scene .shake{transform-box:view-box;transform-origin:160px 320px}
.cs-scene .lid{transform-box:fill-box;transform-origin:50% 0;transform:scaleY(0) translateY(-2px)}
.cs-scene .happy{opacity:0}.cs-scene .brow{opacity:0;transition:opacity 200ms}
.cs-scene .bubble{opacity:0;transform-box:view-box;transform-origin:206px 80px;transform:scale(.6);transition:opacity 180ms,transform 420ms var(--cs-spring)}
.cs-scene.has-bubble .bubble{opacity:1;transform:none}
.cs-scene[data-pose=cover] .wl,.cs-scene[data-pose=peek] .wl{transform:translate(2px,-2px) rotate(-160deg)}
.cs-scene[data-pose=cover] .wr{transform:translate(-2px,-2px) rotate(160deg)}
.cs-scene[data-pose=peek] .wr{transform:translate(-2px,18px) rotate(150deg)}
.cs-scene[data-pose=happy] .eyes{opacity:0}.cs-scene[data-pose=happy] .happy{opacity:1}
.cs-scene[data-pose=happy] .wl{transform:rotate(28deg)}.cs-scene[data-pose=happy] .wr{transform:rotate(-28deg)}
.cs-scene[data-pose=sad] .brow{opacity:1}
.cs-scene.is-shake .shake{animation:cs-shake 620ms cubic-bezier(.2,0,0,1)}
.cs-scene.is-hop .hop{animation:cs-hop 900ms var(--cs-spring)}
.cs-scene.is-live .stars circle{animation:cs-tw 3.2s ease-in-out infinite}.cs-scene.is-live .stars circle:nth-child(2n){animation-delay:-1.4s}
@keyframes cs-shake{15%{transform:rotate(-7deg)}35%{transform:rotate(6deg)}55%{transform:rotate(-4deg)}75%{transform:rotate(2deg)}}
@keyframes cs-hop{20%{transform:translateY(6px) scaleY(.95)}45%{transform:translateY(-26px)}70%{transform:scaleY(.97)}}
@keyframes cs-tw{0%,100%{opacity:.9}50%{opacity:.25}}
@keyframes cs-up{from{opacity:0;transform:translateY(10px)}}
@media (prefers-reduced-motion: reduce){.cs-root *{animation:none!important;transition-duration:0ms!important}}`;

function Owl({ headRef, pupilsRef, lidRefs, sayRef, rectRef }) {
  const wing = { fill: 'var(--cs-wing)' }, wline = { fill: 'none', stroke: 'var(--accent)', strokeWidth: 3, strokeLinecap: 'round', opacity: 0.7 };
  return (
    <svg viewBox="0 0 320 380" className="h-auto w-[184px] overflow-visible md:w-[min(100%,400px)]">
      <circle cx="62" cy="64" r="28" fill="var(--accent-subtle)" />
      <g className="stars" fill="var(--text-disabled)"><circle cx="58" cy="54" r="2" /><circle cx="96" cy="28" r="1.5" /><circle cx="196" cy="34" r="1.5" /><circle cx="292" cy="128" r="2" /><circle cx="30" cy="150" r="1.5" /><circle cx="278" cy="212" r="1.5" /></g>
      <rect x="58" y="336" width="204" height="22" rx="4" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.5" />
      <rect x="72" y="316" width="176" height="20" rx="4" fill="var(--accent-subtle)" stroke="var(--border-strong)" strokeWidth="1.5" />
      <path d="M84 326h56M84 347h80" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round" opacity=".6" />
      <rect x="196" y="320" width="10" height="12" rx="2" fill="var(--accent)" />
      <g className="bubble"><rect ref={rectRef} x="196" y="26" width="116" height="40" rx="12" fill="var(--surface)" stroke="var(--border)" strokeWidth="1.5" /><path d="M210 63l-10 19 24-17" fill="var(--surface)" stroke="var(--border)" strokeWidth="1.5" strokeLinejoin="round" /><text ref={sayRef} x="254" y="51" textAnchor="middle" fill="var(--text-strong)" style={{ font: '600 15px var(--font-sans)' }} /></g>
      <g className="hop"><g className="shake">
        <path d="M128 318c0-8 4-12 8-12s8 4 8 12M176 318c0-8 4-12 8-12s8 4 8 12" fill="none" stroke="var(--tint-amber-fg)" strokeWidth="5" strokeLinecap="round" />
        <path d="M160 112c56 0 86 46 86 102 0 60-36 100-86 100S74 274 74 214c0-56 30-102 86-102Z" fill="var(--accent)" />
        <ellipse cx="160" cy="240" rx="54" ry="60" fill="var(--accent-subtle)" />
        <path d="M140 222l6 6 6-6M168 222l6 6 6-6M154 246l6 6 6-6M140 270l6 6 6-6M168 270l6 6 6-6" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity=".55" />
        <g ref={headRef} className="head">
          <path d="M100 140 92 86l42 30ZM220 140l8-54-42 30Z" fill="var(--accent)" />
          <path d="M160 92c52 0 80 30 80 70 0 36-30 58-80 58s-80-22-80-58c0-40 28-70 80-70Z" fill="var(--accent)" />
          <circle cx="126" cy="160" r="38" fill="var(--accent-subtle)" /><circle cx="194" cy="160" r="38" fill="var(--accent-subtle)" />
          <g className="eyes">
            <circle cx="126" cy="160" r="25" fill="var(--surface)" /><circle cx="194" cy="160" r="25" fill="var(--surface)" />
            <g ref={pupilsRef}><circle cx="126" cy="160" r="12" fill="var(--text-strong)" /><circle cx="194" cy="160" r="12" fill="var(--text-strong)" /><circle cx="130" cy="155" r="3.5" fill="var(--surface)" /><circle cx="198" cy="155" r="3.5" fill="var(--surface)" /></g>
            <path ref={(el) => (lidRefs.current[0] = el)} className="lid" d="M100 160a26 26 0 0 1 52 0Z" fill="var(--accent-subtle)" />
            <path ref={(el) => (lidRefs.current[1] = el)} className="lid" d="M168 160a26 26 0 0 1 52 0Z" fill="var(--accent-subtle)" />
          </g>
          <path className="happy" d="M108 166c6-12 30-12 36 0M176 166c6-12 30-12 36 0" fill="none" stroke="var(--text-strong)" strokeWidth="5" strokeLinecap="round" />
          <path className="brow" d="M100 122c10-6 24-6 32 2M220 122c-10-6-24-6-32 2" fill="none" stroke="color-mix(in oklab, var(--accent) 60%, var(--text-strong))" strokeWidth="5" strokeLinecap="round" />
          <path d="M160 178l11 14-11 16-11-16Z" fill="var(--tint-amber-fg)" />
        </g>
        <g className="wing wl"><path d="M100 178c-26 18-34 64-20 108 18-12 32-44 34-82 0-12-4-20-14-26Z" style={wing} /><path d="M92 214c-4 16-4 32 0 48M102 210c-2 14-2 30 2 44" style={wline} /></g>
        <g className="wing wr"><path d="M220 178c26 18 34 64 20 108-18-12-32-44-34-82 0-12 4-20 14-26Z" style={wing} /><path d="M228 214c4 16 4 32 0 48M218 210c2 14 2 30-2 44" style={wline} /></g>
      </g></g>
    </svg>);
}

export function ConnexionScene({
  follow = 'pointer',      // 'pointer' | 'fields'
  bubbles = true,
  spring = 'doux',         // 'doux' | 'joueur'
  blink = true,
  side = 'right',          // 'right' | 'left'
  brand = 'chevêche',
  onSignIn = (id, password) => new Promise((r) => setTimeout(() => r({ ok: password === 'chouette' }), 900)),
}) {
  const uid = useId().replace(/:/g, '');
  const [pose, setPose] = useState('idle');
  const [showPw, setShowPw] = useState(false);
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState(null);   // { msg, field }
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [bubble, setBubble] = useState('');
  const [fx, setFx] = useState('');            // 'is-shake' | 'is-hop'
  const [announce, setAnnounce] = useState('');
  const [live, setLive] = useState(false);
  const scene = useRef(null), svgWrap = useRef(null), head = useRef(null), pupils = useRef(null), lids = useRef([]), sayRef = useRef(null), rectRef = useRef(null);
  const idRef = useRef(null), pwRef = useRef(null), toggleRef = useRef(null), btnRef = useRef(null), okTitle = useRef(null), mirror = useRef(null);
  const motion = useRef({ t: { x: 0, y: 0.1 }, c: { x: 0, y: 0 }, v: { x: 0, y: 0 }, raf: 0, seen: true });
  const poseRef = useRef('idle'); poseRef.current = pose;
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const S = SPRINGS[spring] || SPRINGS.doux;

  // Regard sur ressort
  const step = useCallback(() => {
    const m = motion.current;
    ['x', 'y'].forEach((a) => { m.v[a] += (m.t[a] - m.c[a]) * S.k; m.v[a] *= 1 - S.d; m.c[a] += m.v[a]; });
    if (pupils.current) pupils.current.style.transform = `translate(${(m.c.x * 10).toFixed(2)}px,${(m.c.y * 9).toFixed(2)}px)`;
    if (head.current) head.current.style.transform = `translate(${(m.c.x * 5).toFixed(2)}px,${(m.c.y * 3).toFixed(2)}px) rotate(${(m.c.x * 7).toFixed(2)}deg)`;
    const moving = Math.abs(m.t.x - m.c.x) + Math.abs(m.t.y - m.c.y) + Math.abs(m.v.x) + Math.abs(m.v.y) > 0.002;
    m.raf = moving && m.seen ? requestAnimationFrame(step) : 0;
  }, [S.k, S.d]);
  const look = useCallback((x, y) => {
    const m = motion.current; m.t = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
    if (reduce) { m.c = { ...m.t }; m.v = { x: 0, y: 0 }; step(); return; }
    if (!m.raf && m.seen) m.raf = requestAnimationFrame(step);
  }, [reduce, step]);
  const lookAt = useCallback((px, py, range = 420) => {
    const svg = svgWrap.current?.querySelector('svg'); if (!svg) return;
    const r = svg.getBoundingClientRect(), s = r.width / 320, dx = px - (r.left + 160 * s), dy = py - (r.top + 160 * s), dist = Math.hypot(dx, dy) || 1, f = Math.min(1, dist / range);
    look((dx / dist) * f, (dy / dist) * f);
  }, [look]);
  const followField = (input) => {
    const cs = getComputedStyle(input), mm = mirror.current; mm.style.font = cs.font;
    const pos = input.selectionStart ?? input.value.length;
    mm.textContent = (input.type === 'password' ? input.value.replace(/./g, '•') : input.value).slice(0, pos);
    const inner = input.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), ratio = Math.max(0, Math.min(1, (mm.offsetWidth - input.scrollLeft) / inner));
    const r = input.getBoundingClientRect(); lookAt(r.left + 14 + (r.width - 28) * ratio, r.top + r.height / 2, window.innerWidth < 640 ? 260 : 420);
  };

  // Bulle : largeur ajustée au texte
  useEffect(() => {
    if (!sayRef.current) return; sayRef.current.textContent = bubble;
    if (!bubble) return;
    const w = Math.ceil(sayRef.current.getComputedTextLength() + 28), x = 312 - w;
    rectRef.current.setAttribute('x', x); rectRef.current.setAttribute('width', w); sayRef.current.setAttribute('x', x + w / 2);
  }, [bubble]);
  const say = useCallback((t, ms) => { if (!bubbles) return setBubble(''); setBubble(t); if (ms) setTimeout(() => setBubble((b) => (b === t ? '' : b)), ms); }, [bubbles]);
  useEffect(() => { if (!bubbles) setBubble(''); }, [bubbles]);

  // Pause hors écran, pointeur, clignements, salut
  useEffect(() => {
    const m = motion.current;
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => { m.seen = e.isIntersecting; setLive(e.isIntersecting && !reduce); if (m.seen && !m.raf) m.raf = requestAnimationFrame(step); }) : null;
    io?.observe(scene.current);
    const onMove = (e) => { const a = document.activeElement; if (follow === 'pointer' && poseRef.current === 'idle' && ![idRef.current, pwRef.current, toggleRef.current].includes(a)) lookAt(e.clientX, e.clientY); };
    document.addEventListener('pointermove', onMove, { passive: true });
    let bt; const loop = () => { bt = setTimeout(() => {
      if (m.seen && blink && poseRef.current === 'idle' && !reduce) lids.current.forEach((l) => l?.animate([{ transform: 'scaleY(0) translateY(-2px)' }, { transform: 'scaleY(1)', offset: 0.45 }, { transform: 'scaleY(1)', offset: 0.55 }, { transform: 'scaleY(0) translateY(-2px)' }], { duration: 220, easing: 'ease-in-out' }));
      loop(); }, 2400 + Math.random() * 3600); };
    loop(); const hi = setTimeout(() => say('Hou hou ?', 2400), 900);
    return () => { io?.disconnect(); document.removeEventListener('pointermove', onMove); clearTimeout(bt); clearTimeout(hi); cancelAnimationFrame(m.raf); m.raf = 0; };
  }, [follow, blink, reduce, step, lookAt, say]);

  const idle = () => { setPose('idle'); look(0, 0.1); };
  const onPwFocus = (shown = showPw) => { if (shown) { setPose('peek'); followField(pwRef.current); say('Juste un œil…', 1800); } else { setPose('cover'); look(0, 0.2); say('Je ne regarde pas !', 1800); } };
  const onBlur = () => setTimeout(() => { const a = document.activeElement; if (![idRef.current, pwRef.current, toggleRef.current].includes(a) && !busy && !done) idle(); }, 0);
  const play = (cls) => { setFx(''); requestAnimationFrame(() => setFx(cls)); setTimeout(() => setFx(''), 1000); };
  const fail = (msg, field) => { setError({ msg, field }); setPose('sad'); look(0, 0.15); say(field === 'pw' ? 'Ce n’est pas le bon…' : 'Il en manque un bout', 2200); play('is-shake'); setAnnounce(msg); (field === 'pw' ? pwRef : idRef).current?.focus(); };

  const [attempts, setAttempts] = useState(5);
  const submit = async (e) => {
    e.preventDefault(); if (busy) return;
    if (!id.trim()) return fail('Saisissez votre e-mail ou votre numéro de carte.', 'id');
    if (!pw) return fail('Saisissez votre mot de passe.', 'pw');
    setBusy(true); setPose('idle'); const br = btnRef.current.getBoundingClientRect(); lookAt(br.left + br.width / 2, br.top + br.height / 2, 300); say('Voyons voir…');
    const res = await onSignIn(id.trim(), pw); setBusy(false);
    if (!res?.ok) { const n = Math.max(1, attempts - 1); setAttempts(n); return fail(`Mot de passe incorrect. Il vous reste ${n} essai${n > 1 ? 's' : ''}.`, 'pw'); }
    setPose('happy'); look(0, 0); say('Bonne lecture !', 2600); play('is-hop'); setDone(true); setAnnounce('Connexion réussie. Bonjour Claire.');
    setTimeout(() => okTitle.current?.focus({ preventScroll: true }), 30);
  };
  const reset = () => { setDone(false); setPw(''); setShowPw(false); setError(null); setAttempts(5); idle(); setBubble(''); setTimeout(() => idRef.current?.focus(), 30); };

  const input = (bad) => `h-12 w-full rounded-[10px] border bg-[var(--surface)] px-3.5 text-base text-[var(--text-strong)] outline-none transition placeholder:text-[var(--text-disabled)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-subtle-border)] ${bad ? 'border-[var(--down)]' : 'border-[var(--border-control)] hover:border-[var(--text-muted)]'}`;
  const link = 'text-sm text-[var(--text-strong)] underline decoration-[var(--border-strong)] underline-offset-[3px] hover:decoration-current';

  return (
    <div className="cs-root relative mx-auto grid min-h-[100dvh] w-full max-w-[1040px] grid-rows-[auto_1fr] overflow-hidden bg-[var(--surface)] font-sans text-[var(--text)] md:min-h-[620px] md:grid-cols-2 md:grid-rows-1 md:rounded-2xl md:border md:border-[var(--border)]"
      style={{ '--cs-spring': S.css }}>
      <style>{SCENE_CSS}</style>
      <span ref={mirror} aria-hidden="true" className="invisible absolute -left-[9999px] top-0 whitespace-pre" />

      <div ref={scene} aria-hidden="true" data-pose={pose}
        className={`cs-scene relative grid h-[232px] overflow-hidden border-b border-[var(--border)] bg-[var(--raised)] px-4 pt-3 md:row-start-1 md:h-auto md:border-b-0 md:px-6 md:pt-8 ${side === 'left' ? 'md:col-start-1 md:border-r' : 'md:col-start-2 md:border-l'} ${bubble ? 'has-bubble' : ''} ${fx} ${live ? 'is-live' : ''}`}
        style={{ placeItems: 'end center' }}>
        <div ref={svgWrap} className="contents"><Owl headRef={head} pupilsRef={pupils} lidRefs={lids} sayRef={sayRef} rectRef={rectRef} /></div>
      </div>

      <div className={`relative flex flex-col px-5 pb-8 pt-6 md:row-start-1 md:px-12 md:py-10 ${side === 'left' ? 'md:col-start-2' : 'md:col-start-1'}`}>
        <div className="mb-5 flex items-center gap-2 md:mb-10">
          <svg viewBox="0 0 100 100" className="h-8 w-8" aria-hidden="true"><rect width="100" height="100" rx="28" fill="var(--accent)" /><path d="M20 38c9-9 21-9 30 0 9-9 21-9 30 0" fill="none" stroke="var(--accent-fg)" strokeWidth="6" strokeLinecap="round" /><circle cx="35" cy="54" r="13" fill="var(--accent-fg)" /><circle cx="65" cy="54" r="13" fill="var(--accent-fg)" /><circle cx="37" cy="55" r="5.5" fill="var(--accent)" /><circle cx="63" cy="55" r="5.5" fill="var(--accent)" /><path d="M45 70h10l-5 9Z" fill="var(--accent-fg)" /></svg>
          <span className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-strong)]">{brand}</span>
        </div>

        {!done ? (
          <form noValidate onSubmit={submit} className="flex w-full flex-col md:max-w-[400px]">
            <h2 className="text-[26px] font-semibold leading-[1.2] tracking-[-0.02em] text-[var(--text-strong)] md:text-[length:var(--t-page)]">Bon retour à la médiathèque</h2>
            <p className="mb-5 mt-2 text-[15px] leading-[22px] text-[var(--text-muted)] md:mb-7">Réservez, prolongez vos prêts et retrouvez vos lectures dans les 14 médiathèques du réseau.</p>
            <label htmlFor={`${uid}-id`} className="mb-2 text-sm font-medium text-[var(--text-strong)]">E-mail ou numéro de carte</label>
            <input ref={idRef} id={`${uid}-id`} value={id} inputMode="email" autoComplete="username" spellCheck={false} placeholder="claire.dumas@exemple.fr"
              aria-invalid={error?.field === 'id'} aria-describedby={error?.field === 'id' ? `${uid}-err` : undefined} className={input(error?.field === 'id')}
              onChange={(e) => { setId(e.target.value); setError(null); requestAnimationFrame(() => followField(idRef.current)); }}
              onFocus={() => { setPose('idle'); followField(idRef.current); if (!id) say('Votre e-mail ?', 1800); }}
              onKeyUp={() => followField(idRef.current)} onClick={() => followField(idRef.current)} onBlur={onBlur} />
            <div className="mb-2 mt-5 flex items-baseline justify-between gap-3"><label htmlFor={`${uid}-pw`} className="text-sm font-medium text-[var(--text-strong)]">Mot de passe</label><a href="#" onClick={(e) => e.preventDefault()} className={link}>Mot de passe oublié ?</a></div>
            <div className="relative">
              <input ref={pwRef} id={`${uid}-pw`} type={showPw ? 'text' : 'password'} value={pw} autoComplete="current-password" aria-invalid={error?.field === 'pw'} aria-describedby={`${error?.field === 'pw' ? `${uid}-err ` : ''}${uid}-hint`}
                className={`${input(error?.field === 'pw')} pr-[52px]`} onFocus={() => onPwFocus()} onBlur={onBlur}
                onChange={(e) => { setPw(e.target.value); setError(null); if (showPw) requestAnimationFrame(() => followField(pwRef.current)); if (pose === 'sad') setPose(showPw ? 'peek' : 'cover'); }} />
              <button ref={toggleRef} type="button" aria-pressed={showPw} aria-label={showPw ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                onClick={() => { const n = !showPw; setShowPw(n); pwRef.current?.focus(); onPwFocus(n); }}
                className="absolute right-0.5 top-0.5 grid h-11 w-11 place-items-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /><path d="M4 4l16 16" strokeDasharray="23" strokeDashoffset={showPw ? 23 : 0} className="transition-[stroke-dashoffset] duration-300" /></svg>
              </button>
            </div>
            {error && <p id={`${uid}-err`} className="mt-2 text-sm text-[var(--down)]">{error.msg}</p>}
            <p id={`${uid}-hint`} className="mt-2 text-[13px] text-[var(--text-muted)]">Démo : le mot de passe est « chouette ».</p>
            <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-2.5 text-sm"><input type="checkbox" defaultChecked className="h-[18px] w-[18px] accent-[var(--accent)]" />Rester connecté sur cet appareil</label>
            <button ref={btnRef} type="submit" disabled={busy} className="mt-3 inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-[var(--accent)] text-[15px] font-medium text-[var(--accent-fg)] transition hover:bg-[var(--accent-hover)] active:scale-[.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]">
              {busy && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}{busy ? 'Connexion…' : 'Se connecter'}
            </button>
            <p className="mt-5 text-sm text-[var(--text-muted)]">Pas encore inscrit ? <a href="#" onClick={(e) => e.preventDefault()} className={link}>Créer ma carte</a></p>
          </form>
        ) : (
          <div className="flex w-full flex-col md:max-w-[400px]" style={{ animation: `cs-up 520ms ${S.css} both` }}>
            <span aria-hidden="true" className="mb-5 grid h-12 w-12 place-items-center rounded-full bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]"><svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 12.5 4 4 8-9" /></svg></span>
            <h2 ref={okTitle} tabIndex={-1} className="text-[length:var(--t-page)] font-semibold leading-[1.2] tracking-[-0.02em] text-[var(--text-strong)] outline-none">Bonjour Claire</h2>
            <p className="mb-7 mt-2 text-[15px] leading-[22px] text-[var(--text-muted)]">3 prêts en cours, dont <strong className="font-semibold text-[var(--text-strong)]">Le Liseur du 6 h 27</strong> à rendre jeudi. Votre réservation est arrivée à la médiathèque Croix-Rousse.</p>
            <button type="button" onClick={reset} className="h-12 self-start rounded-[10px] border border-[var(--border-control)] px-[18px] text-[15px] font-medium text-[var(--text-strong)] hover:bg-[var(--state-hover)]">Revenir au formulaire</button>
          </div>)}
        <p aria-live="polite" className="sr-only">{announce}</p>
      </div>
    </div>
  );
}

export default ConnexionScene;
