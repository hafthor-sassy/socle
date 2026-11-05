// Recherche ⌘K des réglages — React 18 + Tailwind 3.4. Couleurs : variables de tokens.css uniquement.
// ⌘K (ou Ctrl K, ou /) ouvre une recherche floue sur tous les réglages ; Entrée fait défiler jusqu'au réglage,
// le surligne et place le focus sur son contrôle.
import { useEffect, useMemo, useRef, useState, useCallback, useId } from 'react';

const SPRINGS = {
  doux: 'linear(0, .013 .6%, .05 1.2%, .2 2.6%, .44 4.4%, .67 6.4%, .85 8.6%, .96 11%, 1.02 13.6%, 1.04 16.6%, 1.03 20.4%, 1.01 25%, 1 32%, 1)',
  sec: 'cubic-bezier(.2, 0, 0, 1)',
  joueur: 'linear(0, .02 .8%, .09 1.8%, .35 4%, .7 6.6%, 1 9.4%, 1.17 12.2%, 1.22 14.4%, 1.2 16.8%, 1.1 21%, 1 25.4%, .95 29.4%, .95 33%, .99 39%, 1.01 45%, 1.01 52%, 1 64%, 1)',
};

/** @typedef {{ id: string, title: string, desc?: string, keywords?: string, type: 'switch'|'select'|'text'|'segmented'|'button', value?: any, options?: string[] }} Setting */
/** @typedef {{ id: string, title: string, desc?: string, settings: Setting[] }} Section */

/** @type {Section[]} */
export const DEFAULT_SECTIONS = [
  { id: 'general', title: 'Général', desc: 'L’identité de l’école et l’affichage de Pupitre pour toute l’équipe.', settings: [
    { id: 'nom', title: 'Nom de l’école', desc: 'Affiché sur les factures, les e-mails et le portail des familles.', keywords: 'nom établissement école', type: 'text', value: 'École de musique Allegretto' },
    { id: 'fuseau', title: 'Fuseau horaire', desc: 'Sert au planning, aux rappels et à l’horodatage des présences.', keywords: 'fuseau horaire heure timezone', type: 'select', options: ['Europe/Paris (UTC+1)', 'Europe/Bruxelles (UTC+1)'], value: 'Europe/Paris (UTC+1)' },
    { id: 'theme', title: 'Thème', desc: 'Suivre le système bascule automatiquement le soir.', keywords: 'thème apparence sombre clair dark mode nuit', type: 'segmented', options: ['Clair', 'Sombre', 'Système'], value: 'Système' },
  ] },
  { id: 'cours', title: 'Cours et planning', desc: 'Valeurs par défaut des nouveaux créneaux, rappels et absences.', settings: [
    { id: 'duree', title: 'Durée d’un cours par défaut', desc: 'Modifiable ensuite créneau par créneau.', keywords: 'durée créneau leçon minutes', type: 'select', options: ['30 min', '45 min', '60 min'], value: '45 min' },
    { id: 'rappel', title: 'Rappel avant le cours', desc: 'Envoyé à l’élève, ou à sa famille s’il est mineur.', keywords: 'rappel notification sms veille oubli', type: 'select', options: ['2 h avant', '24 h avant', '48 h avant', 'Jamais'], value: '24 h avant' },
    { id: 'annulation', title: 'Facturer les annulations tardives', desc: 'Un cours annulé moins de 24 h avant reste dû.', keywords: 'annulation absence tardive pénalité', type: 'switch', value: true },
  ] },
  { id: 'facturation', title: 'Facturation', desc: 'Factures, échéanciers et relances envoyées aux familles.', settings: [
    { id: 'mentions', title: 'Mentions sur les factures', desc: 'SIRET, association loi 1901, TVA non applicable…', keywords: 'mentions facture siret tva légales', type: 'text', value: 'Association loi 1901 · SIRET 812 345 678 00019' },
    { id: 'relance', title: 'Relance des impayés', desc: 'E-mail automatique, puis un second une semaine plus tard.', keywords: 'relance impayé retard rappel paiement', type: 'select', options: ['Désactivée', '3 jours après l’échéance', '7 jours après l’échéance'], value: '7 jours après l’échéance' },
    { id: 'sepa', title: 'Prélèvement SEPA', desc: 'Mandat signé en ligne lors de l’inscription.', keywords: 'prélèvement sepa banque iban mandat', type: 'switch', value: false },
  ] },
  { id: 'securite', title: 'Sécurité', desc: 'Accès de l’équipe et traçabilité.', settings: [
    { id: '2fa', title: 'Double authentification obligatoire', desc: 'Un code à usage unique est demandé à chaque nouvel appareil.', keywords: 'double authentification 2fa mot de passe code sécurité', type: 'switch', value: false },
    { id: 'session', title: 'Déconnexion après inactivité', desc: 'S’applique aussi aux tablettes de l’accueil.', keywords: 'session déconnexion inactivité', type: 'select', options: ['1 h', '12 h', '7 jours'], value: '12 h' },
    { id: 'journal', title: 'Journal d’activité', desc: 'Qui a modifié quoi, sur les 12 derniers mois.', keywords: 'journal historique logs export', type: 'button', value: 'Exporter en CSV' },
  ] },
];

const norm = (s = '') => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, ' ').toLowerCase();
const range = (a, n) => Array.from({ length: n }, (_, i) => a + i);
function near(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0; while (i < a.length && a[i] === b[i]) i++;
  if (i === a.length && i === b.length) return true;
  return a.slice(i + 1) === b.slice(i + 1) || a.slice(i) === b.slice(i + 1) || a.slice(i + 1) === b.slice(i) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
}
function subseq(q, t) {
  const idx = []; let ti = 0, score = 0, prev = -2;
  for (const c of q) {
    while (ti < t.length && t[ti] !== c) ti++;
    if (ti >= t.length) return null;
    idx.push(ti); score += (ti === prev + 1 ? 6 : prev < 0 ? 1 : -.5) + (ti === 0 || t[ti - 1] === ' ' ? 5 : 0); prev = ti; ti++;
  }
  return { score: score - (idx[idx.length - 1] - idx[0]) * 0.35, idx };
}
/** Correspondance floue : sous-chaîne, tous les mots, mot-clé, section, sous-séquence, une faute. */
export function matchSetting(qRaw, e, tolerance = 'souple') {
  const q = norm(qRaw).trim().replace(/\s+/g, ' '); if (!q) return null;
  const nt = norm(e.title), nkw = norm(e.keywords).split(/\s+/).filter(Boolean), kw = (e.keywords || '').split(/\s+/).filter(Boolean);
  const at = nt.indexOf(q);
  if (at >= 0) return { score: 120 - at * 0.4 + (at === 0 || nt[at - 1] === ' ' ? 40 : 0), idx: range(at, q.length) };
  const words = q.split(' ');
  if (words.length > 1) {
    let idx = [];
    const ok = words.every((w) => { const p = nt.indexOf(w); if (p >= 0) { idx = idx.concat(range(p, w.length)); return true; } return nkw.some((k) => k.startsWith(w)); });
    if (ok) return { score: 90 + idx.length, idx };
  }
  const k = nkw.findIndex((k) => k.startsWith(q) || (q.length > 3 && k.includes(q)));
  if (k >= 0) return { score: 80 - k, idx: [], via: kw[k] };
  if (norm(e.section).startsWith(q)) return { score: 50, idx: [], via: e.section };
  if (tolerance === 'souple') {
    const s = subseq(q.replace(/ /g, ''), nt); if (s && s.score >= q.length * 2.8) return { score: 20 + s.score, idx: s.idx };
    if (q.length >= 4) {
      const tw = nt.split(' ').find((w) => w.length >= 4 && near(q, w)); if (tw) return { score: 40, idx: range(nt.indexOf(tw), tw.length), typo: true };
      const j = nkw.findIndex((w) => w.length >= 4 && near(q, w)); if (j >= 0) return { score: 35, idx: [], via: kw[j], typo: true };
    }
  }
  if (q.length > 3 && norm(e.desc).includes(q)) return { score: 15, idx: [], via: 'description' };
  return null;
}

function Highlight({ text, idx }) {
  if (!idx.length) return text;
  const set = new Set(idx), out = []; let buf = '', on = false;
  [...text].forEach((ch, i) => { const m = set.has(i); if (m !== on && buf) { out.push(on ? <mark key={i} className="bg-transparent font-semibold text-[var(--accent)] underline decoration-[var(--accent-subtle-border)] decoration-[1.5px] underline-offset-[3px]">{buf}</mark> : buf); buf = ''; } on = m; buf += ch; });
  if (buf) out.push(on ? <mark key="e" className="bg-transparent font-semibold text-[var(--accent)] underline decoration-[var(--accent-subtle-border)] decoration-[1.5px] underline-offset-[3px]">{buf}</mark> : buf);
  return out;
}

const fmtValue = (s, v) => s.type === 'switch' ? (v ? 'Activé' : 'Désactivé') : s.type === 'button' ? '' : String(v ?? '');

function Control({ s, value, onChange, id }) {
  const base = 'h-11 md:h-10 rounded-lg border border-[var(--border-control)] bg-[var(--surface)] px-3 text-base md:text-[15px] text-[var(--text-strong)] hover:border-[var(--text-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]';
  if (s.type === 'switch') return (
    <button id={id} type="button" role="switch" aria-checked={!!value} aria-labelledby={id + '-l'} onClick={() => onChange(!value)}
      className={`relative h-[26px] w-11 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] ${value ? 'bg-[var(--accent)]' : 'bg-[var(--border-control)]'}`}>
      <span className="absolute left-[3px] top-[3px] h-5 w-5 rounded-full transition-transform duration-300 [transition-timing-function:var(--rr-spring)]"
        style={{ transform: value ? 'translateX(18px)' : 'none', background: value ? 'var(--accent-fg)' : 'var(--surface)' }} />
    </button>);
  if (s.type === 'select') return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${base} w-full md:w-[220px] cursor-pointer`}>{s.options.map((o) => <option key={o}>{o}</option>)}</select>);
  if (s.type === 'text') return <input id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${base} w-full md:w-[280px]`} />;
  if (s.type === 'segmented') return (
    <div role="radiogroup" aria-labelledby={id + '-l'} className="inline-flex w-full md:w-auto rounded-[10px] border border-[var(--border)] bg-[var(--raised)] p-[3px]">
      {s.options.map((o, i) => (
        <button key={o} id={i === 0 ? id : undefined} type="button" role="radio" aria-checked={value === o} onClick={() => onChange(o)}
          className={`h-[38px] md:h-[34px] flex-1 rounded-[7px] px-3.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] ${value === o ? 'bg-[var(--surface)] text-[var(--text-strong)] shadow-[var(--shadow-overlay)]' : 'text-[var(--text-muted)]'}`}>{o}</button>))}
    </div>);
  return <button id={id} type="button" className={`${base} font-medium text-sm`}>{s.value}</button>;
}

export function RechercheReglages({
  sections = DEFAULT_SECTIONS,
  shortcut = 'mod+k',          // 'mod+k' | 'slash' | 'both'
  spring = 'doux',             // 'doux' | 'sec' | 'joueur'
  highlightMs = 2400,
  tolerance = 'souple',        // 'souple' | 'stricte'
  showValue = true,
  brand = 'pupitre',
}) {
  const uid = useId().replace(/:/g, '');
  const [values, setValues] = useState(() => Object.fromEntries(sections.flatMap((s) => s.settings.map((x) => [x.id, x.value]))));
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const [found, setFound] = useState(null);
  const [current, setCurrent] = useState(sections[0]?.id);
  const [recents, setRecents] = useState([]);
  const [announce, setAnnounce] = useState('');
  const scroller = useRef(null), input = useRef(null), listRef = useRef(null), opener = useRef(null), raf = useRef(0), spy = useRef(true);
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const isMac = typeof navigator !== 'undefined' && /Mac|iP(hone|ad)/.test(navigator.platform || navigator.userAgent);

  const index = useMemo(() => sections.flatMap((sec) => sec.settings.map((s) => ({ ...s, section: sec.title, sectionId: sec.id }))), [sections]);
  const results = useMemo(() => {
    if (!q.trim()) {
      const rec = recents.map((id) => index.find((e) => e.id === id)).filter(Boolean);
      const sug = ['rappel', 'relance', 'theme', '2fa'].map((id) => index.find((e) => e.id === id)).filter((e) => e && !rec.includes(e));
      return [...(rec.length ? [{ grp: 'Récents' }, ...rec.map((e) => ({ e, m: { idx: [] } }))] : []), { grp: 'Suggestions' }, ...sug.map((e) => ({ e, m: { idx: [] } }))];
    }
    const hits = index.map((e) => ({ e, m: matchSetting(q, e, tolerance) })).filter((r) => r.m).sort((a, b) => b.m.score - a.m.score);
    const order = [...new Set(hits.map((h) => h.e.section))];
    return order.flatMap((s) => [{ grp: s }, ...hits.filter((h) => h.e.section === s)]);
  }, [q, index, tolerance, recents]);
  const options = results.filter((r) => !r.grp);

  const openPalette = useCallback(() => { opener.current = document.activeElement; setQ(''); setActive(0); setOpen(true); }, []);
  const close = useCallback((restore = true) => { setOpen(false); if (restore) opener.current?.focus?.(); }, []);

  useEffect(() => {
    const onKey = (ev) => {
      const t = ev.target, typing = t?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t?.tagName);
      const mod = (shortcut === 'mod+k' || shortcut === 'both') && ev.key.toLowerCase() === 'k' && (ev.metaKey || ev.ctrlKey);
      const slash = (shortcut === 'slash' || shortcut === 'both') && ev.key === '/' && !typing && !ev.metaKey && !ev.ctrlKey;
      if (mod || slash) { ev.preventDefault(); openPalette(); }
    };
    document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey);
  }, [shortcut, openPalette]);
  useEffect(() => { if (open) requestAnimationFrame(() => input.current?.focus()); }, [open]);
  useEffect(() => { setActive(0); }, [q]);
  useEffect(() => { const el = listRef.current?.querySelector(`[data-i="${active}"]`); el?.scrollIntoView({ block: 'nearest' }); }, [active, open]);

  const scrollToY = (y, done) => {
    const el = scroller.current; cancelAnimationFrame(raf.current);
    const from = el.scrollTop, to = Math.max(0, Math.min(y, el.scrollHeight - el.clientHeight)), d = to - from;
    if (reduce || Math.abs(d) < 2) { el.scrollTop = to; done(); return; }
    const dur = Math.min(720, 280 + Math.abs(d) * 0.35), t0 = performance.now();
    const step = (now) => { const t = Math.min(1, (now - t0) / dur), k = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2; el.scrollTop = from + d * k; t < 1 ? (raf.current = requestAnimationFrame(step)) : done(); };
    raf.current = requestAnimationFrame(step);
  };
  const jump = (e) => {
    setRecents((r) => [e.id, ...r.filter((x) => x !== e.id)].slice(0, 3));
    close(false); spy.current = false; setCurrent(e.sectionId); setFound(null);
    const row = document.getElementById(`${uid}-${e.id}`), sc = scroller.current;
    const y = row.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - (sc.clientHeight - row.offsetHeight) * 0.38;
    scrollToY(y, () => {
      setFound({ id: e.id, k: Date.now() });
      document.getElementById(`${uid}-${e.id}-c`)?.focus({ preventScroll: true });
      setAnnounce(`${e.title}, dans ${e.section}. Le focus est sur son réglage.`);
      setTimeout(() => { spy.current = true; }, 200);
    });
  };
  useEffect(() => { if (!found) return; const t = setTimeout(() => setFound(null), reduce ? 4000 : highlightMs); return () => clearTimeout(t); }, [found, highlightMs, reduce]);

  const onScroll = () => {
    if (!spy.current) return; const sc = scroller.current, lim = sc.scrollTop + sc.clientHeight * 0.3;
    let cur = sections[0].id;
    if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2) cur = sections[sections.length - 1].id;
    else sections.forEach((s) => { const el = document.getElementById(`${uid}-sec-${s.id}`); if (el && el.offsetTop <= lim) cur = s.id; });
    setCurrent(cur);
  };
  const onPaletteKey = (ev) => {
    if (ev.key === 'ArrowDown') { ev.preventDefault(); setActive((a) => (a + 1) % Math.max(1, options.length)); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); setActive((a) => (a - 1 + options.length) % Math.max(1, options.length)); }
    else if (ev.key === 'Enter' && options[active]) { ev.preventDefault(); jump(options[active].e); }
    else if (ev.key === 'Escape') { ev.preventDefault(); q ? setQ('') : close(); }
    else if (ev.key === 'Tab') { ev.preventDefault(); input.current?.focus(); }
  };

  let n = -1;
  return (
    <div className="relative isolate mx-auto flex h-[100dvh] w-full max-w-[1120px] flex-col overflow-hidden bg-[var(--surface)] font-sans text-[var(--text)] md:h-[min(760px,calc(100vh-80px))] md:min-h-[560px] md:rounded-2xl md:border md:border-[var(--border)]"
      style={{ '--rr-spring': SPRINGS[spring] || SPRINGS.doux }}>
      <style>{`@keyframes rr-found{0%{opacity:0}8%{opacity:1}16%{opacity:.55}26%{opacity:1}70%{opacity:1}100%{opacity:0}}
        @keyframes rr-in{from{opacity:0;transform:translateY(4px)}}
        @media (prefers-reduced-motion: reduce){.rr-anim{animation:none!important;opacity:1!important}}`}</style>

      <header className="flex flex-none flex-wrap items-center gap-3 border-b border-[var(--border)] px-4 py-3 md:h-16 md:flex-nowrap md:gap-4 md:py-0 md:pl-6">
        <span className="inline-flex items-center gap-2">
          <svg viewBox="0 0 100 100" className="h-7 w-7" aria-hidden="true"><rect width="100" height="100" rx="28" fill="var(--accent)" /><path d="M25 27h50l-6 27H31Z" fill="var(--accent-fg)" /><path d="M34 36.5h32M33 45h34" fill="none" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round" /><path d="M50 55v20M37 81l13-7 13 7" fill="none" stroke="var(--accent-fg)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span className="text-lg font-semibold tracking-[-0.03em] text-[var(--text-strong)]">{brand}</span>
        </span>
        <span className="hidden whitespace-nowrap border-l border-[var(--border)] pl-4 text-sm text-[var(--text-muted)] md:inline">École Allegretto · Lyon 4e</span>
        <button type="button" onClick={openPalette} aria-haspopup="dialog" aria-keyshortcuts={shortcut === 'slash' ? '/' : 'Meta+K Control+K'}
          className="order-3 flex h-11 w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--raised)] pl-3 pr-1.5 text-[15px] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)] md:order-none md:ml-auto md:h-10 md:w-auto md:min-w-[280px] md:text-sm">
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
          <span className="flex-1 text-left">Rechercher un réglage</span>
          <kbd className="hidden h-7 min-w-9 place-items-center rounded-md border border-[var(--border)] bg-[var(--surface)] px-1.5 font-mono text-xs md:grid">{shortcut === 'slash' ? '/' : isMac ? '⌘K' : 'Ctrl K'}</kbd>
        </button>
        <span aria-hidden="true" className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-[var(--accent-subtle)] text-[13px] font-semibold text-[var(--text-strong)] md:ml-0">CL</span>
      </header>

      <div className="grid min-h-0 flex-1 grid-rows-[auto_1fr] md:grid-cols-[232px_1fr] md:grid-rows-1">
        <nav aria-label="Sections des réglages" className="flex gap-2 overflow-x-auto border-b border-[var(--border)] px-4 py-2.5 [scrollbar-width:none] md:flex-col md:gap-0.5 md:border-b-0 md:border-r md:px-3 md:py-6">
          {sections.map((s) => (
            <a key={s.id} href={`#${uid}-sec-${s.id}`} aria-current={current === s.id ? 'true' : undefined}
              onClick={(e) => { e.preventDefault(); spy.current = false; setCurrent(s.id); const el = document.getElementById(`${uid}-sec-${s.id}`); scrollToY(el.offsetTop - 24, () => { spy.current = true; }); }}
              className={`relative flex h-9 flex-none items-center whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-colors md:h-10 md:rounded-lg md:border-0 md:px-3
                ${current === s.id ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)] md:bg-[var(--raised)] md:text-[var(--text-strong)] md:before:absolute md:before:-left-3 md:before:top-2.5 md:before:bottom-2.5 md:before:w-[3px] md:before:rounded-r md:before:bg-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--state-hover)] hover:text-[var(--text)]'}`}>{s.title}</a>))}
        </nav>

        <div ref={scroller} onScroll={onScroll} className="relative overflow-auto px-4 pb-24 pt-6 md:px-10 md:pb-32 md:pt-8">
          {sections.map((sec) => (
            <section key={sec.id} id={`${uid}-sec-${sec.id}`} className="max-w-[720px] [&+&]:mt-10" aria-labelledby={`${uid}-h-${sec.id}`}>
              <h2 id={`${uid}-h-${sec.id}`} className="text-[length:var(--t-section)] font-semibold tracking-[-0.01em] text-[var(--text-strong)]">{sec.title}</h2>
              {sec.desc && <p className="mb-4 mt-1 text-sm text-[var(--text-muted)]">{sec.desc}</p>}
              <div className="isolate rounded-xl border border-[var(--border)]">
                {sec.settings.map((s) => {
                  const hit = found?.id === s.id;
                  return (
                    <div key={s.id} id={`${uid}-${s.id}`} className="relative z-0 flex flex-wrap items-center gap-3 p-4 first:rounded-t-xl last:rounded-b-xl md:min-h-[72px] md:gap-x-6 md:px-5 [&+&]:border-t [&+&]:border-[var(--border)]">
                      {hit && <span key={found.k} aria-hidden="true" className="rr-anim pointer-events-none absolute -inset-px -z-10 rounded-[inherit] bg-[var(--accent-subtle)] shadow-[inset_0_0_0_1.5px_var(--accent)]" style={{ animation: `rr-found ${highlightMs}ms var(--ease-out) both` }} />}
                      {hit && <span aria-hidden="true" className="pointer-events-none absolute -left-px bottom-3 top-3 w-[3px] rounded-r bg-[var(--accent)]" />}
                      <div className="min-w-0 flex-[1_1_260px]">
                        <label id={`${uid}-${s.id}-c-l`} htmlFor={`${uid}-${s.id}-c`} className={`block text-[15px] font-medium transition-colors duration-500 ${hit ? 'text-[var(--accent)]' : 'text-[var(--text-strong)]'}`}>{s.title}</label>
                        {s.desc && <p className="mt-0.5 text-sm leading-5 text-[var(--text-muted)]">{s.desc}</p>}
                      </div>
                      <Control s={s} id={`${uid}-${s.id}-c`} value={values[s.id]} onChange={(v) => setValues((o) => ({ ...o, [s.id]: v }))} />
                    </div>);
                })}
              </div>
            </section>))}
        </div>
      </div>

      {open && (
        <div className="absolute inset-0 z-50 grid items-start justify-items-center md:px-6 md:pt-[72px]">
          <div className="absolute inset-0 bg-[var(--scrim)]" onClick={() => close()} />
          <div role="dialog" aria-modal="true" aria-label="Rechercher un réglage" onKeyDown={onPaletteKey}
            className="relative flex max-h-[82%] w-full flex-col overflow-hidden rounded-b-2xl border-b border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-popover)] md:max-h-[min(520px,100%)] md:w-[min(640px,100%)] md:rounded-2xl md:border"
            style={{ animation: reduce ? 'none' : 'rr-in 380ms var(--rr-spring) both' }}>
            <div className="flex h-16 flex-none items-center gap-3 border-b border-[var(--border)] px-4 text-[var(--text-muted)] md:h-[60px]">
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
              <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} role="combobox" aria-expanded="true" aria-controls={`${uid}-list`} aria-autocomplete="list"
                aria-activedescendant={options[active] ? `${uid}-o-${options[active].e.id}` : undefined} aria-label="Rechercher un réglage" autoComplete="off" spellCheck={false}
                placeholder="Rappel, facture, thème sombre…" className="h-full min-w-0 flex-1 border-0 bg-transparent text-base text-[var(--text-strong)] outline-none placeholder:text-[var(--text-muted)]" />
              <button type="button" onClick={() => close()} className="h-7 rounded-md border border-[var(--border)] bg-[var(--raised)] px-2 font-mono text-xs">Échap</button>
            </div>
            <div ref={listRef} id={`${uid}-list`} role="listbox" aria-label="Réglages" className="flex-1 overflow-auto overscroll-contain p-2">
              {options.length === 0 && (
                <div className="grid justify-items-center gap-2 px-6 pb-8 pt-10 text-center">
                  <p className="text-[15px] font-medium text-[var(--text-strong)]">Aucun réglage pour « {q.trim()} »</p>
                  <p className="text-sm text-[var(--text-muted)]">Essayez un mot plus simple, ou l’un de ceux-ci :</p>
                  <div className="mt-2 flex flex-wrap justify-center gap-2">{['facture', 'rappel', 'sombre'].map((w) => <button key={w} type="button" onClick={() => setQ(w)} className="h-8 rounded-full border border-[var(--border)] bg-[var(--raised)] px-3 text-sm">{w}</button>)}</div>
                </div>)}
              {results.map((r, k) => {
                if (r.grp) return <div key={'g' + k} role="presentation" className="px-3 pb-1.5 pt-3 text-xs font-semibold uppercase tracking-[0.04em] text-[var(--text-muted)]">{r.grp}</div>;
                n++; const i = n, sel = i === active, v = showValue ? fmtValue(r.e, values[r.e.id]) : '';
                return (
                  <div key={r.e.id} id={`${uid}-o-${r.e.id}`} data-i={i} role="option" aria-selected={sel} onPointerMove={() => !sel && setActive(i)} onClick={() => jump(r.e)}
                    className={`relative flex min-h-14 cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2 transition-colors ${sel ? 'bg-[var(--raised)] before:absolute before:bottom-3.5 before:left-0 before:top-3.5 before:w-[3px] before:rounded-r before:bg-[var(--accent)]' : ''}`}
                    style={{ animation: reduce ? 'none' : `rr-in 260ms var(--ease-out) ${i * 18}ms both` }}>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] text-[var(--text-strong)]"><Highlight text={r.e.title} idx={r.m.idx} /></span>
                      <span className="mt-px block truncate text-[13px] text-[var(--text-muted)]">{r.e.section}{r.m.via && <> · {r.m.typo && 'proche de '}<mark className="rounded bg-[var(--accent-subtle)] px-[3px] text-[var(--text-strong)]">{r.m.via}</mark></>}{r.m.typo && !r.m.via && ' · orthographe proche'}</span>
                    </span>
                    {v && <span className={`hidden max-w-[40%] truncate text-[13px] md:block ${v === 'Activé' ? 'text-[var(--up)]' : 'text-[var(--text-muted)]'}`}>{v}</span>}
                  </div>);
              })}
            </div>
            <footer className="hidden h-11 flex-none items-center gap-4 border-t border-[var(--border)] bg-[var(--raised)] px-4 text-[13px] text-[var(--text-muted)] md:flex">
              <span>↑ ↓ naviguer</span><span>↵ ouvrir</span><span className="ml-auto tabular-nums">{q.trim() ? (options.length ? `${options.length} réglage${options.length > 1 ? 's' : ''}` : '') : `${index.length} réglages`}</span>
            </footer>
          </div>
        </div>)}
      <p aria-live="polite" className="sr-only">{announce}</p>
    </div>
  );
}

export default RechercheReglages;
