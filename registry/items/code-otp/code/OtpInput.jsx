// Code à 6 chiffres — React + Tailwind CSS. Couleurs : variables de tokens.css.
// Un seul vrai champ (autocomplete="one-time-code") sous des cases dessinées : collage et saisie auto du SMS natifs.
import { useEffect, useId, useRef, useState } from 'react';

const KEYFRAMES = `
@keyframes otp-in{from{opacity:0;transform:translateY(14px) scale(.7);filter:blur(2px)}60%{opacity:1;filter:none}}
@keyframes otp-blink{0%,55%{opacity:1}56%,100%{opacity:0}}
@keyframes otp-wave{0%{translate:0 0}35%{translate:0 -8px}100%{translate:0 0}}
@keyframes otp-pulse{50%{background:var(--raised)}}
@keyframes otp-shake{0%,100%{translate:0}15%{translate:-8px}30%{translate:7px}45%{translate:-5px}60%{translate:3px}75%{translate:-1.5px}}
@media (prefers-reduced-motion: reduce){.otp-anim,.otp-anim *{animation:none!important;transition:none!important}}`;

/**
 * @param {object} props
 * @param {(code: string) => Promise<boolean> | boolean} props.onComplete  true = code valide
 * @param {number} [props.length]        4 à 8
 * @param {number} [props.group]         Taille des groupes (0 = sans séparateur)
 * @param {'numeric'|'alphanumeric'} [props.type]
 * @param {boolean} [props.mask]         Points au lieu des caractères
 * @param {number} [props.wave]          ms entre deux cases de la vague de réussite
 * @param {string} [props.label]         Nom accessible
 * @param {string} [props.describedBy]  id du texte d'aide
 * @param {(state: 'idle'|'busy'|'success'|'error') => void} [props.onStateChange]
 */
export function OtpInput({
  onComplete, length = 6, group = 3, type = 'numeric', mask = false, wave = 70,
  label, describedBy, onStateChange, className = '',
}) {
  const id = useId();
  const input = useRef(null);
  const [value, setValue] = useState('');
  const [state, setState] = useState('idle');
  const [focus, setFocus] = useState(false);
  const [shake, setShake] = useState(0);
  const alpha = type === 'alphanumeric';
  const clean = (v) => (alpha ? v.toUpperCase().replace(/[^A-Z0-9]/g, '') : v.replace(/\D/g, '')).slice(0, length);

  useEffect(() => { onStateChange?.(state); }, [state]);

  const change = async (raw) => {
    if (state === 'busy' || state === 'success') return;
    const v = clean(raw);
    setValue(v);
    if (state === 'error') setState('idle');
    if (v.length === length && value.length !== length) {
      setState('busy');
      let ok = false;
      try { ok = await onComplete?.(v); } catch { ok = false; }
      if (ok) { setState('success'); return; }
      setState('error'); setShake((n) => n + 1);
      navigator.vibrate?.([10, 40, 10]);
      setTimeout(() => { setValue(''); input.current?.focus(); }, 520);
    }
  };

  const slots = [];
  for (let i = 0; i < length; i++) {
    if (group && i && i % group === 0) slots.push(<span key={`s${i}`} className="mx-0.5 h-0.5 w-3 flex-none rounded bg-[var(--border-control)]" />);
    const ch = value[i] || '';
    const active = focus && i === Math.min(value.length, length - 1) && state !== 'success';
    const tone = state === 'success'
      ? 'border-[var(--tint-green-border)] bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)] animate-[otp-wave_520ms_cubic-bezier(.34,1.56,.64,1)_both]'
      : state === 'error'
        ? 'border-[var(--down)] bg-[var(--tint-red-bg)] text-[var(--tint-red-fg)]'
        : state === 'busy'
          ? 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-strong)] animate-[otp-pulse_900ms_ease-in-out_infinite]'
          : active
            ? 'border-[var(--focus-ring)] bg-[var(--surface)] text-[var(--text-strong)] shadow-[0_0_0_3px_var(--accent-subtle-border)]'
            : 'border-[var(--border-control)] bg-[var(--surface)] text-[var(--text-strong)]';
    slots.push(
      <span key={i} style={{ animationDelay: `${i * (state === 'busy' ? 90 : wave)}ms`, transitionDelay: state === 'success' ? `${i * wave}ms` : undefined }}
        className={`relative grid aspect-[13/16] min-w-0 max-w-[60px] flex-1 place-items-center rounded-xl border font-[family-name:var(--font-mono)] text-[26px] font-semibold tabular-nums transition-colors duration-200 ${tone}`}>
        {ch && <span key={ch + i} className="animate-[otp-in_380ms_cubic-bezier(.34,1.56,.64,1)]">{mask ? '•' : ch}</span>}
        {active && !ch && <span className="absolute h-7 w-0.5 rounded-sm bg-[var(--text-strong)] animate-[otp-blink_1.1s_steps(1)_infinite]" />}
      </span>,
    );
  }

  return (
    <div className={`otp-anim relative block max-w-full ${className}`}>
      <style>{KEYFRAMES}</style>
      <label htmlFor={id} className="sr-only">{label || `Code de vérification à ${length} ${alpha ? 'caractères' : 'chiffres'}`}</label>
      <input
        ref={input} id={id} value={value} onChange={(e) => change(e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        onSelect={(e) => { const n = e.currentTarget.value.length; e.currentTarget.setSelectionRange(n, n); }}
        type="text" inputMode={alpha ? 'text' : 'numeric'} autoComplete="one-time-code" autoCapitalize={alpha ? 'characters' : 'off'}
        spellCheck={false} maxLength={length} pattern={alpha ? `[A-Za-z0-9]{${length}}` : `\\d{${length}}`}
        readOnly={state === 'success'} aria-invalid={state === 'error' || undefined} aria-busy={state === 'busy' || undefined}
        aria-describedby={describedBy}
        className="absolute inset-0 z-10 m-0 size-full cursor-text border-0 bg-transparent p-0 text-[16px] tracking-[2.5em] text-transparent caret-transparent outline-none selection:bg-transparent [-webkit-tap-highlight-color:transparent]"
      />
      <div aria-hidden="true" key={shake} className={`flex items-center gap-2 ${shake ? 'animate-[otp-shake_460ms_cubic-bezier(.36,.07,.19,.97)]' : ''}`}>
        {slots}
      </div>
    </div>
  );
}

/* Exemple
<p id="otp-aide">Envoyé par SMS au 06 •• •• •• 42.</p>
<OtpInput describedBy="otp-aide" onComplete={async (code) => (await fetch('/api/2fa', { method: 'POST', body: code })).ok} />
*/
