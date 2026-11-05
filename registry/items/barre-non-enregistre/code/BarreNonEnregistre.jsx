// BarreNonEnregistre.jsx — page de réglages avec barre « non enregistré » : elle monte sur un ressort dès qu'une valeur
// diffère de l'état enregistré, compte les vrais écarts, tremble si l'on tente de partir, protège l'onglet (beforeunload)
// et enregistre au ⌘S / Ctrl S. React 18, Tailwind 3.4, tokens.css chargé. Sans bibliothèque.
// Exemple : Pelage (logiciel pour cliniques vétérinaires, marque fictive).
// Utilisation :
//   <BarreNonEnregistre position="flottante" delay={900} simulateError={false} shake={true} shortcut={true} onSave={async (v) => api.save(v)} />
//   Le hook useUnsaved(initial) se réutilise seul pour n'importe quel formulaire.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** Suivi d'un formulaire : valeurs, instantané enregistré, liste des champs réellement modifiés. */
export function useUnsaved(initial) {
  const [saved, setSaved] = useState(initial);
  const [values, setValues] = useState(initial);
  const changed = useMemo(() => Object.keys(values).filter((k) => values[k] !== saved[k]), [values, saved]);
  const set = useCallback((k, v) => setValues((o) => ({ ...o, [k]: v })), []);
  return { values, set, changed, dirty: changed.length > 0, commit: () => setSaved(values), reset: () => setValues(saved) };
}

const INITIAL = {
  nom: 'Clinique vétérinaire des Tanneurs', tel: '04 78 42 18 90', mail: 'accueil@tanneurs-veto.fr', adresse: '4 rue des Tanneurs, 69002 Lyon',
  duree: '20', samedi: true, urgences: false, sms: true, delai: '14',
  signature: 'L’équipe des Tanneurs. Pour toute question, répondez simplement à ce message.',
};
const NAV = ['Général', 'Clinique', 'Agenda en ligne', 'Rappels', 'Facturation', 'Équipe'];
const input = 'w-full min-h-11 rounded-lg border border-[var(--border-control)] bg-[var(--bg)] px-3 py-2 text-base text-[var(--text-strong)] outline-none transition focus:border-[var(--focus-ring)] focus:ring-1 focus:ring-[var(--focus-ring)] sm:min-h-10 sm:text-sm';
const Dot = ({ on }) => (on ? <span aria-hidden="true" className="h-1.5 w-1.5 flex-none rounded-full bg-[var(--accent)]" /> : null);

function Field({ id, label, changed, children }) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-[var(--text-strong)]">{label}<Dot on={changed} />{changed && <span className="sr-only">(modifié)</span>}</label>
      {children}
    </div>
  );
}
function Switch({ id, label, hint, checked, changed, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span id={id} className="flex flex-wrap items-center gap-x-2 text-base font-medium text-[var(--text-strong)] sm:text-sm">
        {label}<Dot on={changed} />
        <small className="basis-full text-sm font-normal text-[var(--text-muted)] sm:text-xs">{hint}</small>
      </span>
      <button type="button" role="switch" aria-checked={checked} aria-labelledby={id} onClick={() => onChange(!checked)}
        className={`relative h-[26px] w-11 flex-none rounded-full transition-colors ${checked ? 'bg-[var(--accent)]' : 'bg-[var(--border-strong)]'}`}>
        <span className={`absolute left-[3px] top-[3px] h-5 w-5 rounded-full bg-[var(--surface)] transition-transform duration-300 ease-[cubic-bezier(.3,1.4,.5,1)] motion-reduce:transition-none ${checked ? 'translate-x-[18px]' : ''}`} />
      </button>
    </div>
  );
}
const Select = ({ id, value, onChange, options }) => (
  <span className="relative block after:pointer-events-none after:absolute after:right-3.5 after:top-1/2 after:h-[7px] after:w-[7px] after:-translate-y-[70%] after:rotate-45 after:border-b-[1.5px] after:border-r-[1.5px] after:border-[var(--text-muted)]">
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${input} cursor-pointer appearance-none pr-9`}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  </span>
);

/**
 * @param {{ position?: 'flottante'|'pleine', delay?: number, simulateError?: boolean, shake?: boolean, shortcut?: boolean,
 *   onSave?: (values: object) => Promise<void> | void, className?: string }} props
 */
export default function BarreNonEnregistre({
  position = 'flottante',
  delay = 900,
  simulateError = false,
  shake = true,
  shortcut = true,
  onSave,
  className = '',
}) {
  const f = useUnsaved(INITIAL);
  const [phase, setPhase] = useState('idle'); // idle | saving | saved | error
  const [nudge, setNudge] = useState(0);
  const [live, setLive] = useState('');
  const saveBtn = useRef(null), timer = useRef(0);
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const visible = f.dirty || phase === 'saved' || phase === 'saving';
  const n = f.changed.length;

  useEffect(() => { if (f.dirty && phase === 'saved') setPhase('idle'); }, [f.dirty, phase]);
  const wasDirty = useRef(false);
  useEffect(() => {
    if (f.dirty && !wasDirty.current) setLive('Modifications non enregistrées.');
    if (!f.dirty && wasDirty.current && phase === 'idle') setLive('Plus aucune modification en attente.');
    wasDirty.current = f.dirty;
  }, [f.dirty, phase]);

  const save = useCallback(async () => {
    if (!f.dirty || phase === 'saving') return;
    setPhase('saving');
    try {
      await (onSave ? onSave(f.values) : new Promise((ok, ko) => setTimeout(() => (simulateError ? ko(new Error('réseau')) : ok()), delay)));
      f.commit(); setPhase('saved'); setLive('Modifications enregistrées.');
      clearTimeout(timer.current); timer.current = setTimeout(() => setPhase('idle'), 1400);
    } catch {
      setPhase('error'); setLive('Échec de l’enregistrement. Vos modifications sont toujours là.');
    }
  }, [f, phase, onSave, simulateError, delay]);
  const cancel = () => { f.reset(); setPhase('idle'); setLive('Modifications annulées.'); };

  /* Garde de départ : à appeler depuis vos liens ou votre routeur. Renvoie false si la navigation doit être bloquée. */
  const guard = (e) => {
    if (!f.dirty) return true;
    e?.preventDefault();
    setNudge((k) => k + 1); setLive('Modifications non enregistrées : enregistrez ou annulez avant de quitter cette page.');
    saveBtn.current?.focus({ preventScroll: true });
    return false;
  };
  const nudging = nudge > 0;
  useEffect(() => { if (!nudge) return undefined; const t = setTimeout(() => setNudge(0), 2400); return () => clearTimeout(t); }, [nudge]);

  useEffect(() => {
    const before = (e) => { if (f.dirty) { e.preventDefault(); e.returnValue = ''; } };
    const key = (e) => { if (shortcut && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); } };
    addEventListener('beforeunload', before); addEventListener('keydown', key);
    return () => { removeEventListener('beforeunload', before); removeEventListener('keydown', key); };
  }, [f.dirty, shortcut, save]);

  const msg = phase === 'saved' ? 'Modifications enregistrées' : phase === 'error' ? 'Échec de l’enregistrement, rien n’a été perdu'
    : nudging ? 'Enregistrez ou annulez avant de quitter' : null;
  const full = position === 'pleine';
  const ch = (k) => f.changed.includes(k);

  return (
    <div className={`grid min-h-screen grid-cols-1 font-sans text-[var(--text)] md:grid-cols-[240px_minmax(0,1fr)] ${className}`}>
      <aside aria-label="Réglages" className="sticky top-0 z-10 grid content-start gap-2 border-b border-[var(--border)] bg-[var(--surface)] pt-2 md:h-screen md:gap-6 md:border-b-0 md:border-r md:px-4 md:py-6">
        <a href="#" onClick={guard} aria-label="Pelage, accueil" className="mx-2 inline-flex h-11 items-center gap-2.5 px-2 text-lg font-semibold tracking-[-.03em] text-[var(--text-strong)] md:mx-0 md:h-10">
          <svg viewBox="0 0 100 100" className="h-7 w-7" aria-hidden="true"><rect width="100" height="100" rx="28" fill="var(--accent)" /><g fill="var(--accent-fg)"><ellipse cx="30" cy="44" rx="7" ry="9" /><ellipse cx="43" cy="31" rx="7" ry="9.5" /><ellipse cx="57" cy="31" rx="7" ry="9.5" /><ellipse cx="70" cy="44" rx="7" ry="9" /><path d="M50 50c-10 0-19 10-19 19 0 6 5 9 10 8 4-1 6-3 9-3s5 2 9 3c5 1 10-2 10-8 0-9-9-19-19-19Z" /></g></svg>
          pelage
        </a>
        <nav aria-label="Sections des réglages" className="flex gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:grid md:gap-0.5 md:overflow-visible md:p-0">
          {NAV.map((l) => (
            <a key={l} href="#" onClick={guard} aria-current={l === 'Clinique' ? 'page' : undefined}
              className={`flex h-10 flex-none items-center rounded-lg px-3 text-sm transition-colors md:h-9 ${l === 'Clinique' ? 'bg-[var(--accent-subtle)] font-medium text-[var(--text-strong)]' : 'text-[var(--text-muted)] hover:bg-[var(--state-hover)] hover:text-[var(--text-strong)]'}`}>{l}</a>
          ))}
        </nav>
      </aside>

      <main className="mx-auto w-full max-w-[808px] px-4 pb-40 pt-6 md:px-12 md:pt-12">
        <p className="m-0 font-mono text-xs font-medium uppercase tracking-[.04em] text-[var(--text-muted)]">Réglages · Clinique</p>
        <h1 className="m-0 mt-2 text-[length:var(--t-page)] font-semibold tracking-[-.02em] text-[var(--text-strong)]">Profil de la clinique</h1>
        <p className="m-0 mt-2 max-w-[60ch] text-sm text-[var(--text-muted)]">Ces informations apparaissent sur les rappels envoyés aux propriétaires et sur votre page de prise de rendez-vous.</p>

        <form noValidate onSubmit={(e) => { e.preventDefault(); save(); }} className="mt-8 grid gap-6">
          <fieldset className="m-0 grid gap-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 md:p-6">
            <legend className="float-left mb-1 w-full p-0 font-semibold text-[var(--text-strong)]">Identité</legend>
            <Field id="un-nom" label="Nom de la clinique" changed={ch('nom')}><input id="un-nom" className={input} value={f.values.nom} onChange={(e) => f.set('nom', e.target.value)} autoComplete="organization" /></Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="un-tel" label="Téléphone" changed={ch('tel')}><input id="un-tel" type="tel" className={input} value={f.values.tel} onChange={(e) => f.set('tel', e.target.value)} autoComplete="tel" /></Field>
              <Field id="un-mail" label="E-mail de contact" changed={ch('mail')}><input id="un-mail" type="email" className={input} value={f.values.mail} onChange={(e) => f.set('mail', e.target.value)} autoComplete="email" /></Field>
            </div>
            <Field id="un-adr" label="Adresse" changed={ch('adresse')}><input id="un-adr" className={input} value={f.values.adresse} onChange={(e) => f.set('adresse', e.target.value)} autoComplete="street-address" /></Field>
          </fieldset>

          <fieldset className="m-0 grid gap-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 md:p-6">
            <legend className="float-left mb-1 w-full p-0 font-semibold text-[var(--text-strong)]">Agenda</legend>
            <Field id="un-duree" label="Durée d’une consultation" changed={ch('duree')}>
              <Select id="un-duree" value={f.values.duree} onChange={(v) => f.set('duree', v)} options={[['15', '15 minutes'], ['20', '20 minutes'], ['30', '30 minutes'], ['45', '45 minutes']]} />
            </Field>
            <Switch id="un-sam" label="Ouvert le samedi matin" hint="De 9 h à 12 h 30, réservable en ligne" checked={f.values.samedi} changed={ch('samedi')} onChange={(v) => f.set('samedi', v)} />
            <Switch id="un-urg" label="Accepter les urgences en ligne" hint="Les créneaux d’urgence restent visibles jusqu’à 19 h" checked={f.values.urgences} changed={ch('urgences')} onChange={(v) => f.set('urgences', v)} />
          </fieldset>

          <fieldset className="m-0 grid gap-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 md:p-6">
            <legend className="float-left mb-1 w-full p-0 font-semibold text-[var(--text-strong)]">Rappels</legend>
            <Switch id="un-sms" label="Rappel de vaccin par SMS" hint="Envoyé au propriétaire avant l’échéance" checked={f.values.sms} changed={ch('sms')} onChange={(v) => f.set('sms', v)} />
            <Field id="un-delai" label="Délai du rappel" changed={ch('delai')}>
              <Select id="un-delai" value={f.values.delai} onChange={(v) => f.set('delai', v)} options={[['7', '7 jours avant'], ['14', '14 jours avant'], ['30', '30 jours avant']]} />
            </Field>
            <Field id="un-sig" label="Signature des messages" changed={ch('signature')}><textarea id="un-sig" rows={3} className={`${input} resize-y`} value={f.values.signature} onChange={(e) => f.set('signature', e.target.value)} /></Field>
          </fieldset>
        </form>
      </main>

      {/* La barre : hors du parcours clavier tant qu'elle est cachée ; monte sur un ressort, tremble à la tentative de départ. */}
      <div role="region" aria-label="Modifications non enregistrées" aria-hidden={!visible} inert={visible ? undefined : ''}
        key={nudging && shake ? `n${nudge}` : 'bar'}
        className={[
          'fixed z-[60] flex items-center gap-3 border bg-[var(--surface)] transition-[transform,opacity,border-color,box-shadow] duration-500 ease-[cubic-bezier(.22,1.35,.4,1)] motion-reduce:transition-opacity',
          'inset-x-2 bottom-[calc(8px+env(safe-area-inset-bottom))] rounded-2xl py-2 pl-4 pr-2 shadow-[var(--shadow-popover)]',
          full ? 'md:inset-x-0 md:bottom-0 md:left-[240px] md:justify-between md:rounded-none md:border-x-0 md:border-b-0 md:px-6 md:py-3 md:shadow-none'
            : 'md:inset-x-auto md:left-[calc(50%+120px)] md:bottom-6 md:w-max md:-translate-x-1/2 md:gap-6 md:rounded-full md:pl-5',
          nudging ? 'border-[var(--accent)] ring-[3px] ring-[var(--accent-subtle)]' : 'border-[var(--border)]',
          nudging && shake ? 'motion-safe:animate-[un-shake_520ms_cubic-bezier(.36,.07,.19,.97)]' : '',
          visible ? 'opacity-100' : 'pointer-events-none translate-y-[calc(100%+48px)] opacity-0',
        ].join(' ')}>
        <style>{'@keyframes un-shake{0%,100%{translate:0}15%{translate:-10px}30%{translate:8px}45%{translate:-6px}60%{translate:4px}75%{translate:-2px}}'}</style>
        <p className="m-0 flex min-w-0 items-center gap-2.5 text-sm font-medium tabular-nums text-[var(--text-strong)] md:whitespace-nowrap">
          <span aria-hidden="true" className={`h-2 w-2 flex-none rounded-full ${phase === 'saved' ? 'bg-[var(--up)]' : phase === 'error' ? 'bg-[var(--down)]' : 'bg-[var(--accent)] shadow-[0_0_0_4px_var(--accent-subtle)]'}`} />
          {msg || <>{n} modification{n > 1 ? 's' : ''}<span className="hidden md:inline"> non enregistrée{n > 1 ? 's' : ''}</span></>}
        </p>
        <div className="ml-auto flex gap-2 md:ml-0">
          <button type="button" onClick={cancel} disabled={phase === 'saving'}
            className="h-11 rounded-full border border-[var(--border-control)] px-4 text-sm font-medium text-[var(--text-strong)] hover:bg-[var(--state-hover)] md:h-9">Annuler</button>
          <button ref={saveBtn} type="button" onClick={save} aria-busy={phase === 'saving'}
            className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] active:scale-[.97] md:h-9">
            {phase === 'saving' && <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />}
            {phase === 'saving' ? 'Enregistrement…' : phase === 'saved' ? 'Enregistré' : phase === 'error' ? 'Réessayer' : 'Enregistrer'}
            {shortcut && phase !== 'saving' && <kbd aria-hidden="true" className="hidden rounded border border-[color-mix(in_srgb,var(--accent-fg)_35%,transparent)] px-1.5 font-mono text-[11px] leading-4 opacity-85 md:inline">{mac ? '⌘S' : 'Ctrl S'}</kbd>}
          </button>
        </div>
      </div>
      <p role="status" aria-live="polite" className="sr-only">{live}</p>
    </div>
  );
}
