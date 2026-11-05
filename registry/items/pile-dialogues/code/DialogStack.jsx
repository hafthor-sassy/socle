// Pile de dialogues — React + Tailwind CSS. Couleurs : variables de tokens.css. Contenu fictif (Jalon, gestion de projet).
// Aucune dépendance en plus de React : un <dialog> natif (showModal) contient les étapes ; chacune s'empile sur la
// précédente, Échap / « Retour » / le voile reviennent d'un niveau et rendent le focus à l'élément d'origine.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * @typedef {Object} DialogStackProps
 * @property {string}  [spaceName]     Nom à saisir pour confirmer
 * @property {number}  [offset]        Décalage vertical par niveau (px)
 * @property {number}  [scale]         Réduction par niveau (0,05 = 5 %)
 * @property {number}  [duration]      Durée des transitions (ms)
 * @property {'back'|'close'|'none'} [backdrop] Effet d'un clic sur le voile
 * @property {boolean} [typedConfirm]  Exiger la saisie du nom
 * @property {(r: { what: 'move'|'export'|'delete', dest: string|null }) => void} [onConfirm]
 */

const SPRING = 'cubic-bezier(.32,1.3,.55,1)';
const btn = 'inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-lg border px-[18px] text-sm font-semibold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-auto focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]';
const ghost = `${btn} border-[var(--border)] bg-[var(--surface)] text-[var(--text-strong)] hover:bg-[var(--raised)]`;
const primary = `${btn} border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]`;
const danger = `${btn} border-[var(--tint-red-fg)] bg-[var(--tint-red-fg)] text-[var(--surface)] hover:opacity-90`;
const reduced = () => typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function Option({ name, value, checked, onChange, title, sub, badge }) {
  return (
    <label className={`grid cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus-ring)] ${badge ? 'grid-cols-[20px_36px_minmax(0,1fr)]' : 'grid-cols-[20px_minmax(0,1fr)]'} ${checked ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border)]'}`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="h-5 w-5 accent-[var(--accent)] focus-visible:outline-none" />
      {badge && <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--raised)] font-mono text-xs font-semibold text-[var(--text-muted)]">{badge}</span>}
      <span><b className="block text-[15px] font-medium leading-[22px] text-[var(--text-strong)]">{title}</b><small className="block text-[13px] leading-[18px] text-[var(--text-muted)]">{sub}</small></span>
    </label>
  );
}

export default function DialogStack({
  spaceName = 'Refonte site 2027', offset = 14, scale = 0.05, duration = 420, backdrop = 'back', typedConfirm = true, onConfirm,
}) {
  const dlg = useRef(null), opener = useRef(null), focusBack = useRef([]), cards = useRef({});
  const [stack, setStack] = useState([]);
  const [leaving, setLeaving] = useState([]);
  const [entering, setEntering] = useState(null);
  const [open, setOpen] = useState(false);
  const [what, setWhat] = useState('move');
  const [dest, setDest] = useState('Marketing');
  const [progress, setProgress] = useState(0);
  const [typed, setTyped] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);
  const [topH, setTopH] = useState(0);
  const total = what === 'delete' ? 2 : 3;
  const top = stack[stack.length - 1];

  // Hauteur de la carte du dessus : les cartes du dessous y sont rognées
  useLayoutEffect(() => {
    const el = cards.current[top]; if (!el) return undefined;
    setTopH(el.offsetHeight);
    const ro = new ResizeObserver(() => setTopH(el.offsetHeight)); ro.observe(el);
    return () => ro.disconnect();
  }, [top]);
  // Focus dans la nouvelle carte
  useEffect(() => {
    const el = cards.current[top]; if (!el) return;
    el.querySelector('input:checked, input[type="text"], button[type="submit"]:not(:disabled), button')?.focus({ preventScroll: true });
  }, [top]);
  // Export simulé : chargement, puis « Continuer » s'active
  useEffect(() => {
    if (top !== 'export') return undefined;
    setProgress(0);
    const t = setInterval(() => setProgress((k) => { const n = Math.min(248, k + 9 + Math.round(Math.random() * 14)); if (n >= 248) clearInterval(t); return n; }), reduced() ? 20 : 90);
    return () => clearInterval(t);
  }, [top]);

  function push(step) {
    focusBack.current.push(document.activeElement);
    setStack((s) => [...s, step]);
    if (!reduced()) { setEntering(step); requestAnimationFrame(() => requestAnimationFrame(() => setEntering(null))); }
    if (step === 'confirm') { setTyped(''); setErr(''); }
  }
  function back() {
    if (stack.length <= 1) return close();
    const step = stack[stack.length - 1];
    setLeaving((l) => [...l, step]);
    setStack((s) => s.slice(0, -1));
    setTimeout(() => setLeaving((l) => l.filter((x) => x !== step)), reduced() ? 0 : 280);
    focusBack.current.pop()?.focus?.({ preventScroll: true });
  }
  function show() {
    if (dlg.current.open) return;
    setDone(null); dlg.current.showModal(); document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => setOpen(true)); push('choose');
  }
  function close(after) {
    setOpen(false); setLeaving(stack);
    setTimeout(() => {
      setStack([]); setLeaving([]); focusBack.current = [];
      dlg.current?.close(); document.documentElement.style.overflow = '';
      after?.(); opener.current?.focus({ preventScroll: true });
    }, reduced() ? 0 : 260);
  }
  function submit(e, step) {
    e.preventDefault();
    if (step === 'choose') push(what === 'delete' ? 'confirm' : what);
    else if (step === 'move' || step === 'export') push('confirm');
    else {
      if (typedConfirm && typed.trim() !== spaceName) { setErr(typed.trim() ? 'Le nom saisi ne correspond pas (majuscules comprises).' : 'Saisissez le nom de l’espace.'); return; }
      close(() => { setDone({ what, dest }); onConfirm?.({ what, dest: what === 'move' ? dest : null }); });
    }
  }

  const visible = [...stack, ...leaving.filter((s) => !stack.includes(s))];
  const stepNo = (s) => (s === 'confirm' ? total : stack.indexOf(s) + 1);
  const cardStyle = (s) => {
    const i = stack.indexOf(s), d = i < 0 ? 0 : stack.length - 1 - i, out = leaving.includes(s) || entering === s;
    return {
      zIndex: i < 0 ? 99 : i + 1,
      transform: out ? 'translateY(32px) scale(.98)' : `translateY(${-d * offset}px) scale(${1 - d * scale})`,
      opacity: out ? 0 : 1,
      height: d > 0 && topH ? topH : undefined,
      transition: reduced() ? 'none' : `transform ${duration}ms ${SPRING}, opacity 260ms cubic-bezier(.2,0,0,1)`,
    };
  };
  const shell = (s, title, children, foot) => {
    const i = stack.indexOf(s), under = i > -1 && i < stack.length - 1;
    return (
      <form key={s} ref={(el) => { cards.current[s] = el; }} onSubmit={(e) => submit(e, s)} noValidate inert={under || leaving.includes(s) ? '' : undefined} style={cardStyle(s)}
        className={`col-start-1 row-start-1 grid origin-top gap-4 self-end rounded-2xl border border-[var(--border)] px-4 pb-4 pt-5 shadow-[var(--shadow-popover)] sm:self-start sm:p-6 ${under ? 'pointer-events-none overflow-hidden bg-[color-mix(in_srgb,var(--surface)_55%,var(--raised))] [&>*]:opacity-35' : 'bg-[var(--surface)]'}`}>
        <p className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.04em] text-[var(--text-muted)]">
          <span>Étape {stepNo(s)} sur {total}</span>
          <span aria-hidden="true" className="inline-flex gap-1.5">{Array.from({ length: total }, (_, k) => <i key={k} className={`h-1.5 rounded-full transition-all duration-300 ${k === stepNo(s) - 1 ? 'w-[18px] bg-[var(--accent)]' : 'w-1.5 bg-[var(--border-control)] opacity-45'}`} />)}</span>
        </p>
        <h2 id={`ds-t-${s}`} className="-mt-1 text-xl font-semibold leading-7 tracking-[-0.02em] text-[var(--text-strong)] [text-wrap:balance]">{title}</h2>
        {children}
        <div className="mt-1 flex flex-col-reverse justify-end gap-2 sm:flex-row">{foot}</div>
      </form>
    );
  };
  const backBtn = (label = 'Retour') => <button type="button" onClick={back} className={ghost}>{label}</button>;

  return (
    <div className="w-full max-w-[760px] font-sans text-[var(--text)]">
      <section aria-labelledby="ds-zone-t" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--tint-red-border)] bg-[var(--surface)] p-5">
        <div>
          <h3 id="ds-zone-t" className="text-base font-semibold text-[var(--text-strong)]">Supprimer l’espace</h3>
          <p className="mt-1 max-w-[46ch] text-sm text-[var(--text-muted)]">L’espace « {spaceName} », ses 248 tâches et ses 6 tableaux. Vous choisirez quoi garder avant de confirmer.</p>
        </div>
        <button ref={opener} type="button" onClick={show} className={`${btn} border-[var(--tint-red-border)] bg-[var(--surface)] text-[var(--tint-red-fg)] hover:bg-[var(--tint-red-bg)]`}>Supprimer l’espace…</button>
      </section>
      {done && (
        <p role="status" className="mt-3 rounded-xl border border-[var(--tint-green-border)] bg-[var(--tint-green-bg)] px-4 py-3 text-sm text-[var(--tint-green-fg)]">
          Espace « {spaceName} » supprimé. {done.what === 'move' ? `248 tâches déplacées dans « ${done.dest} ».` : done.what === 'export' ? 'Export envoyé par courriel.' : 'Récupérable 30 jours.'}{' '}
          <button type="button" onClick={() => setDone(null)} className="font-semibold underline underline-offset-[3px]">Annuler</button>
        </p>
      )}

      <dialog ref={dlg} aria-labelledby={top ? `ds-t-${top}` : undefined} onCancel={(e) => { e.preventDefault(); back(); }}
        onClick={(e) => { if (e.target === e.currentTarget || e.target.dataset.scrim !== undefined) { if (backdrop === 'close') close(); else if (backdrop === 'back') back(); } }}
        className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent px-2 pb-2 text-inherit backdrop:bg-transparent open:flex open:flex-col open:justify-end sm:px-4 sm:pt-[16vh] sm:open:block">
        <div data-scrim="" aria-hidden="true" className={`absolute inset-0 bg-[var(--scrim)] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} />
        <div data-scrim="" className="relative mx-auto grid w-full sm:max-w-[480px]">
          {visible.includes('choose') && shell('choose', `Supprimer « ${spaceName} » ?`, (
            <>
              <p className="-mt-1 text-[15px] leading-[22px] text-[var(--text-muted)]">248 tâches, 6 tableaux et 1,2 Go de fichiers. Les 12 membres perdront l’accès. Que faire des tâches&nbsp;?</p>
              <fieldset className="grid gap-2"><legend className="sr-only">Devenir des tâches</legend>
                <Option name="what" value="move" checked={what === 'move'} onChange={() => setWhat('move')} title="Les déplacer dans un autre espace" sub="Historique et pièces jointes conservés." />
                <Option name="what" value="export" checked={what === 'export'} onChange={() => setWhat('export')} title="Les exporter puis supprimer" sub="Un fichier CSV avec commentaires et dates." />
                <Option name="what" value="delete" checked={what === 'delete'} onChange={() => setWhat('delete')} title="Tout supprimer" sub="Rien n’est conservé après 30 jours." />
              </fieldset>
            </>
          ), <>{backBtn('Annuler')}<button type="submit" className={primary}>Continuer</button></>)}

          {visible.includes('move') && shell('move', 'Où déplacer les 248 tâches ?', (
            <fieldset className="grid gap-2"><legend className="sr-only">Espace de destination</legend>
              {[['Marketing', 'MK', '9 membres · 412 tâches'], ['Produit', 'PR', '14 membres · 1 086 tâches'], ['Archives 2026', 'AR', 'Lecture seule pour les membres']].map(([n, b, sub]) => (
                <Option key={n} name="dest" value={n} badge={b} checked={dest === n} onChange={() => setDest(n)} title={n} sub={sub} />
              ))}
            </fieldset>
          ), <>{backBtn()}<button type="submit" className={primary}>Continuer</button></>)}

          {visible.includes('export') && shell('export', 'Export des tâches', (
            <>
              <div className="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-x-3 gap-y-1 rounded-xl bg-[var(--raised)] p-3.5">
                <span aria-hidden="true" className={`row-span-2 grid h-10 w-10 place-items-center rounded-lg ${progress >= 248 ? 'bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]' : 'bg-[var(--surface)] text-[var(--text-muted)]'}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 13h7M9 17h5" /></svg>
                </span>
                <span><b className="block font-mono text-sm font-medium text-[var(--text-strong)]">refonte-site-2027.csv</b>
                  <small className="text-[13px] tabular-nums text-[var(--text-muted)]" aria-live="polite">{progress >= 248 ? 'Prêt · 84 Ko · lien envoyé à camille@jalon.app' : `Préparation… ${progress} sur 248 tâches`}</small></span>
                {progress < 248 && <span aria-hidden="true" className="col-start-2 h-1 overflow-hidden rounded-full bg-[var(--border)]"><span className="block h-full rounded-full bg-[var(--accent)]" style={{ width: `${(progress / 248) * 100}%` }} /></span>}
              </div>
              <p className="-mt-1 text-sm text-[var(--text-muted)]">Le lien de téléchargement est aussi envoyé par courriel et reste valable 7 jours.</p>
            </>
          ), <>{backBtn()}<button type="submit" disabled={progress < 248} className={primary}>Continuer</button></>)}

          {visible.includes('confirm') && shell('confirm', 'Confirmer la suppression', (
            <>
              <p className="-mt-1 text-[15px] leading-[22px] text-[var(--text-muted)]">
                {what === 'move' ? `Les 248 tâches iront dans « ${dest} ». L’espace sera supprimé pour ses 12 membres.` : what === 'export' ? 'L’export est prêt. L’espace et ses 248 tâches seront supprimés pour ses 12 membres.' : 'Les 248 tâches seront supprimées. Elles restent récupérables 30 jours par un administrateur.'}
              </p>
              {typedConfirm && (
                <div className="grid gap-2">
                  <label htmlFor="ds-name" className="text-sm">Saisissez <b className="font-semibold text-[var(--text-strong)]">{spaceName}</b> pour confirmer</label>
                  <input id="ds-name" type="text" value={typed} onChange={(e) => { setTyped(e.target.value); setErr(''); }} autoComplete="off" spellCheck={false} aria-invalid={!!err || undefined} aria-describedby="ds-name-err"
                    className="h-11 rounded-lg border border-[var(--border-control)] bg-[var(--surface)] px-3 font-mono text-base text-[var(--text-strong)] aria-[invalid=true]:border-[var(--tint-red-fg)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]" />
                  <p id="ds-name-err" className="text-[13px] text-[var(--tint-red-fg)] empty:hidden">{err}</p>
                </div>
              )}
            </>
          ), <>{backBtn()}<button type="submit" className={danger}>Supprimer définitivement</button></>)}
        </div>
      </dialog>
    </div>
  );
}
