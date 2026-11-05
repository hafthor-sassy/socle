// Correcteur typographique français — React + Tailwind CSS. Couleurs : variables de tokens.css. Aucune dépendance.
// Le texte est saisi dans un textarea transparent posé sur un miroir qui dessine les marques au pixel près.
// Règles : Lexique de l'Imprimerie nationale (espaces fines et insécables, guillemets, nombres, unités).
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';

/* ——— Moteur de règles (identique à l'onglet HTML) ——— */
var NB = '\u00A0', NN = '\u202F';
export const EXEMPLE = "Leçon 4 : la Révolution industrielle\n\nPourquoi l'Angleterre ouvre-t-elle la voie? Au 19ème siècle, la machine à vapeur bouleverse l'industrie textile : en 1850, Manchester compte déjà 300000 habitants.\n\nComme l'écrit un historien, \"la ville devient une immense usine\"... Les ouvriers - souvent des enfants - travaillent 14 h par jour ; leurs salaires baissent de 20%.\n\nA retenir : l'Etat n'intervient que tardivement , avec la loi de 1833. Quel coeur fallait-il pour accepter cela!";

/* Chaque règle renvoie des corrections { s, e, r } sur le texte. */
function rules(o) {
  var sp = o.espace === 'normale' ? NB : NN;
  var R = [];
  if (o.espaces !== false) R.push(
    { id: 'pv', cat: 'espaces', label: function (m) { return 'Espace ' + (sp === NN ? 'fine ' : '') + 'insécable avant «\u00A0' + m.sign + '\u00A0»'; },
      find: function (t) { var out = [], re = /(\S)( ?)([;!?])/g, m;
        while ((m = re.exec(t))) { var prev = m[1]; if ('!?;'.indexOf(prev) > -1 || prev === NN || prev === NB || /[\(\[]/.test(prev)) continue; if (isUrl(t, m.index)) continue;
          var s = m.index + 1; out.push({ s: s, e: s + m[2].length, r: sp, sign: m[3] }); }
        return out; } },
    { id: 'dp', cat: 'espaces', label: function () { return 'Espace insécable avant «\u00A0:\u00A0»'; },
      find: function (t) { var out = [], re = /(\S)( ?):(?!\/\/)/g, m;
        while ((m = re.exec(t))) { if (/\d/.test(m[1]) && /\d/.test(t[re.lastIndex] || '')) continue; if (m[1] === NB || m[1] === NN || isUrl(t, m.index)) continue;
          var s = m.index + 1; out.push({ s: s, e: s + m[2].length, r: NB, sign: ':' }); }
        return out; } },
    { id: 'av', cat: 'espaces', label: function (m) { return 'Pas d’espace avant «\u00A0' + m.sign + '\u00A0»'; },
      find: function (t) { var out = [], re = /([^\s]) +([,.])(?!\.)/g, m; while ((m = re.exec(t))) { var s = m.index + 1; out.push({ s: s, e: re.lastIndex - 1, r: '', sign: m[2] }); } return out; } },
    { id: 'dbl', cat: 'espaces', label: function () { return 'Espaces multiples'; },
      find: function (t) { var out = [], re = /([^ \n]) {2,}(?=\S)/g, m; while ((m = re.exec(t))) out.push({ s: m.index + 1, e: re.lastIndex, r: ' ' }); return out; } },
    { id: 'mil', cat: 'espaces', label: function () { return 'Séparateur de milliers (espace fine)'; },
      find: function (t) { var out = [], re = /\b\d{5,}\b/g, m;
        while ((m = re.exec(t))) { var n = m[0], r = n.replace(/\B(?=(\d{3})+(?!\d))/g, NN); out.push({ s: m.index, e: m.index + n.length, r: r }); }
        var re2 = /\b(\d{1,3})((?: \d{3})+)\b/g; while ((m = re2.exec(t))) out.push({ s: m.index, e: re2.lastIndex, r: m[0].replace(/ /g, NN) });
        return out; } },
    { id: 'unit', cat: 'espaces', label: function (m) { return 'Espace insécable avant l’unité «\u00A0' + m.sign + '\u00A0»'; },
      find: function (t) { var out = [], re = /(\d)( ?)(%|€|\$|km\/h|km|kg|cm|mm|min|h|°C|Mo|Go)(?![\p{L}\d])/gu, m;
        while ((m = re.exec(t))) { var want = m[3] === '%' ? NN : NB; if (m[2] === want) continue; var s = m.index + 1; out.push({ s: s, e: s + m[2].length, r: want, sign: m[3] }); }
        return out; } }
  );
  if (o.signes !== false) R.push(
    { id: 'gui', cat: 'signes', label: function () { return 'Guillemets français «\u00A0…\u00A0»'; },
      find: function (t) { var out = [], re = /"([^"\n]{1,400})"/g, m; while ((m = re.exec(t))) out.push({ s: m.index, e: re.lastIndex, r: '«' + NB + m[1].trim() + NB + '»' }); 
        var re2 = /«( ?)(?=\S)/g; while ((m = re2.exec(t))) out.push({ s: m.index + 1, e: m.index + 1 + m[1].length, r: NB, sign: '«' });
        var re3 = /(\S)( ?)»/g; while ((m = re3.exec(t))) { if (m[1] === NB || m[1] === NN) continue; out.push({ s: m.index + 1, e: m.index + 1 + m[2].length, r: NB, sign: '»' }); }
        return out; } },
    { id: 'apo', cat: 'signes', label: function () { return 'Apostrophe typographique ’'; },
      find: function (t) { var out = [], re = /(\p{L})'(?=\p{L})/gu, m; while ((m = re.exec(t))) out.push({ s: m.index + m[1].length, e: m.index + m[1].length + 1, r: '’' }); return out; } },
    { id: 'susp', cat: 'signes', label: function () { return 'Points de suspension …'; },
      find: function (t) { var out = [], re = /\.{3}/g, m; while ((m = re.exec(t))) out.push({ s: m.index, e: m.index + 3, r: '…' }); return out; } },
    { id: 'tiret', cat: 'signes', label: function () { return 'Tiret d’incise «\u00A0–\u00A0»'; },
      find: function (t) { var out = [], re = / - /g, m; while ((m = re.exec(t))) out.push({ s: m.index + 1, e: m.index + 2, r: '–' }); return out; } }
  );
  if (o.ortho !== false) R.push(
    { id: 'ord', cat: 'ortho', label: function () { return 'Abréviation de l’ordinal : «\u00A0e\u00A0»'; },
      find: function (t) { var out = [], re = /\b(\d+)(ème|eme|è|ième)(?![\p{L}])/gu, m; while ((m = re.exec(t))) out.push({ s: m.index + m[1].length, e: re.lastIndex, r: 'e' }); return out; } },
    { id: 'maj', cat: 'ortho', label: function () { return 'Majuscule accentuée'; },
      find: function (t) { var out = [], re = /\bE(tat|tats|cole|coles|glise|tudiant|tudiants|tudiante|conomie|quipe|té|crit|crits|valuation)\b/g, m;
        while ((m = re.exec(t))) out.push({ s: m.index, e: m.index + 1, r: 'É' });
        var re2 = /(^|[.!?…]\s+|\n)A (?=\p{Ll})/gu; while ((m = re2.exec(t))) out.push({ s: m.index + m[1].length, e: m.index + m[1].length + 1, r: 'À' });
        return out; } },
    { id: 'lig', cat: 'ortho', label: function () { return 'Ligature œ'; },
      find: function (t) { var out = [], re = /\b(c|s|v|n|m|ch|b|v)oe(ur|urs|uvre|uvres|il|ils|uf|ufs|u|ux|sophage)\b/gi, m;
        while ((m = re.exec(t))) { var i = m.index + m[1].length, up = t[i] === 'O'; out.push({ s: i, e: i + 2, r: up ? 'Œ' : 'œ' }); }
        var re2 = /\b([Oo])e(uvre|uvres|il|ils|uf|ufs|cuménique)\b/g; while ((m = re2.exec(t))) out.push({ s: m.index, e: m.index + 2, r: m[1] === 'O' ? 'Œ' : 'œ' });
        return out; } }
  );
  return R;
}
function isUrl(t, i) { var a = t.lastIndexOf(' ', i), b = t.lastIndexOf('\n', i), w = t.slice(Math.max(a, b) + 1, i + 2); return /^(https?:|www\.)/i.test(w) || /@/.test(w); }

/* Toutes les corrections, triées, sans recouvrement, et sans les corrections nulles. */
export function analyse(t, o) {
  var list = [];
  rules(o).forEach(function (rule) { rule.find(t).forEach(function (m) { if (t.slice(m.s, m.e) === m.r) return; m.rule = rule; list.push(m); }); });
  list.sort(function (a, b) { return a.s - b.s || b.e - a.e; });
  var out = [], end = -1;
  list.forEach(function (m) { if (m.s >= end || (m.s === m.e && m.s > end)) { out.push(m); end = Math.max(end, m.e); } });
  return out;
}

const CATS = { espaces: ['Espaces', 'bg-[var(--tint-amber-bg)] text-[var(--tint-amber-fg)]', 'var(--warn)', 'var(--tint-amber-bg)'], signes: ['Signes', 'bg-[var(--tint-blue-bg)] text-[var(--tint-blue-fg)]', 'var(--info)', 'var(--tint-blue-bg)'], ortho: ['Orthotypographie', 'bg-[var(--tint-violet-bg)] text-[var(--tint-violet-fg)]', 'var(--tint-violet-fg)', 'var(--tint-violet-bg)'] };
const reduce = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Espaces insécables rendues visibles dans le miroir, sans changer la largeur des caractères. */
function Vis({ text, inv }) {
  return text.split(/([\u00A0\u202F])/).map((p, i) => (p === NB || p === NN)
    ? <span key={i} className={`relative ${inv ? 'after:absolute after:left-1/2 after:top-[52%] after:rounded-full after:bg-[var(--accent)] ' + (p === NN ? 'after:-ml-[3.5px] after:-mt-[1.5px] after:h-[3px] after:w-[7px]' : 'after:-ml-[2.5px] after:-mt-[2.5px] after:size-[5px]') : ''}`}>{p}</span>
    : <Fragment key={i}>{p}</Fragment>);
}
function Show({ s }) {
  if (s === '') return '∅';
  const blank = s.trim() === '';
  return s.split('').map((c, i) => c === NB || c === NN || (c === ' ' && blank)
    ? <u key={i} title={c === NB ? 'espace insécable' : c === NN ? 'espace fine insécable' : 'espace'} className="inline-block min-w-[10px] rounded-sm no-underline shadow-[inset_0_-2px_0_currentColor]">{c === ' ' ? '\u2002' : c}</u>
    : <Fragment key={i}>{c}</Fragment>);
}

/**
 * @param {{ espace?: 'fine'|'normale', invisibles?: boolean, espaces?: boolean, signes?: boolean, ortho?: boolean,
 *   defaultValue?: string, onChange?: (text: string) => void }} props
 */
export function FrenchTypoChecker({ espace = 'fine', invisibles = false, espaces = true, signes = true, ortho = true, defaultValue = EXEMPLE, onChange }) {
  const [text, setText] = useState(defaultValue);
  const [ignored, setIgnored] = useState({});
  const [inv, setInv] = useState(invisibles);
  const [hot, setHot] = useState(-1);
  const [fixed, setFixed] = useState([]);
  const [leaving, setLeaving] = useState(-1);
  const input = useRef(null), mirror = useRef(null);
  useEffect(() => setInv(invisibles), [invisibles]);
  useEffect(() => { onChange && onChange(text); }, [text, onChange]);
  useEffect(() => { if (!fixed.length) return; const t = setTimeout(() => setFixed([]), 1200); return () => clearTimeout(t); }, [fixed]);

  const opts = { espace, espaces, signes, ortho };
  const key = (m) => `${m.rule.id}:${m.s}:${text.slice(m.s, m.e)}`;
  const issues = useMemo(() => analyse(text, opts).filter((m) => !ignored[`${m.rule.id}:${m.s}:${text.slice(m.s, m.e)}`]), [text, espace, espaces, signes, ortho, ignored]);

  function apply(sel) {
    let t = text, shift = 0; const done = [];
    [...sel].sort((a, b) => a.s - b.s).forEach((m) => { const s0 = m.s + shift; done.push({ s: m.r.length ? s0 : Math.max(0, s0 - 1), e: s0 + Math.max(1, m.r.length) }); shift += m.r.length - (m.e - m.s); });
    [...sel].sort((a, b) => b.s - a.s).forEach((m) => { t = t.slice(0, m.s) + m.r + t.slice(m.e); });
    setText(t); setFixed(done);
  }
  function act(i, kind) {
    const m = issues[i]; if (!m) return;
    if (kind === 'go') { input.current.focus({ preventScroll: true }); input.current.setSelectionRange(m.s, m.e); const mk = mirror.current.querySelector(`mark[data-i="${i}"]`); mk && mk.scrollIntoView({ block: 'center', behavior: reduce() ? 'auto' : 'smooth' }); return; }
    setLeaving(i);
    setTimeout(() => { setLeaving(-1); if (kind === 'skip') setIgnored((g) => ({ ...g, [key(m)]: 1 })); else apply([m]); }, reduce() ? 0 : 180);
  }

  /* Miroir : texte, marques des corrections et zones fraîchement corrigées */
  const pieces = [];
  { const marks = issues.map((m, i) => { const z = m.s === m.e && m.s > 0; return { s: z ? m.s - 1 : m.s, e: m.e, i, cat: m.rule.cat, ins: z }; });
    const fx = fixed.filter((f) => !marks.some((m) => m.s < f.e && m.e > f.s)).map((f) => ({ ...f, fx: true }));
    let pos = 0;
    [...marks, ...fx].sort((a, b) => a.s - b.s).forEach((m, n) => {
      if (m.s < pos) return;
      pieces.push(<Vis key={`t${n}`} text={text.slice(pos, m.s)} inv={inv} />);
      const inner = text.slice(m.s, m.e), c = CATS[m.cat] || CATS.espaces, isHot = m.i === hot;
      pieces.push(m.fx
        ? <span key={`f${n}`} className="rounded-[3px] motion-safe:animate-[ty-fixed_1100ms_cubic-bezier(.2,0,0,1)_both]"><Vis text={inner} inv={inv} /></span>
        : <mark key={`m${n}`} data-i={m.i} className="rounded-[3px] text-transparent transition-[background-color,box-shadow] duration-[180ms]"
            style={{ background: m.ins && !isHot ? 'transparent' : isHot ? 'var(--accent-subtle)' : c[3], boxShadow: m.ins ? `inset -3px 0 0 ${isHot ? 'var(--accent)' : c[2]}, inset 0 -2px 0 ${isHot ? 'var(--accent)' : c[2]}` : isHot ? 'inset 0 0 0 2px var(--accent)' : `inset 0 -2px 0 ${c[2]}` }}><Vis text={inner} inv={inv} /></mark>);
      pos = m.e;
    });
    pieces.push(<Vis key="end" text={text.slice(pos) + '\n\u200B'} inv={inv} />);
  }

  const n = issues.length;
  const cats = issues.reduce((acc, m) => ({ ...acc, [m.rule.cat]: (acc[m.rule.cat] || 0) + 1 }), {});
  const words = (text.match(/[\p{L}\d’'-]+/gu) || []).length;
  const field = 'col-start-1 row-start-1 m-0 whitespace-pre-wrap break-words border-0 px-4 pb-6 pt-4 font-sans text-base leading-[1.75] @[521px]:px-5 @[521px]:pb-7 @[521px]:pt-5 @[521px]:text-[17px]';

  return (
    <section aria-label="Correcteur typographique français" className="@container mx-auto w-full max-w-[1160px] font-sans text-[var(--text)]">
      <style>{'@keyframes ty-fixed{0%{background:var(--tint-green-bg);box-shadow:inset 0 -2px 0 var(--up)}100%{background:transparent;box-shadow:inset 0 -2px 0 transparent}}@keyframes ty-draw{to{stroke-dashoffset:0}}@keyframes ty-tick{0%{transform:translateY(-6px);opacity:.3}}'}</style>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 @[900px]:grid-cols-[minmax(0,1fr)_360px] @[900px]:items-start @[900px]:gap-6">
        <div className="grid min-w-0 grid-rows-[auto_1fr_auto] rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
            <span className="inline-flex items-center gap-2 text-[var(--text-strong)]" aria-label="Cahier">
              <svg viewBox="0 0 100 100" className="size-7" aria-hidden><rect width="100" height="100" rx="28" fill="var(--accent)" /><path d="M50 32c-8-5-18-7-28-6v44c10-1 20 1 28 6 8-5 18-7 28-6V26c-10-1-20 1-28 6zM50 32v44" fill="none" stroke="var(--accent-fg)" strokeWidth="6.5" strokeLinejoin="round" strokeLinecap="round" /></svg>
              <b className="text-lg font-semibold tracking-[-0.02em]">Cahier</b>
            </span>
            <span className="hidden whitespace-nowrap text-[13px] text-[var(--text-muted)] @[521px]:inline">Histoire · 4<sup className="text-[.7em]">e</sup> B · {words} {words > 1 ? 'mots' : 'mot'}</span>
          </header>
          <div className="relative grid min-h-[280px] focus-within:shadow-[inset_0_0_0_2px_var(--focus-ring)]">
            <div ref={mirror} aria-hidden className={`${field} pointer-events-none text-transparent`}>{pieces}</div>
            <textarea ref={input} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} aria-label="Texte à vérifier" placeholder="Collez ou tapez votre texte ici…"
              className={`${field} size-full resize-none overflow-hidden bg-transparent text-[var(--text-strong)] caret-[var(--accent)] outline-none placeholder:text-[var(--text-disabled)]`} />
            {!text && (
              <div className="pointer-events-none absolute inset-x-5 top-[76px] grid justify-items-start gap-4 text-[15px] leading-6 text-[var(--text-muted)]">
                <p className="m-0">Collez un texte : chaque règle typographique française est vérifiée à mesure que vous écrivez.</p>
                <button type="button" onClick={() => { setText(EXEMPLE); setIgnored({}); }} className="pointer-events-auto min-h-11 rounded-lg border border-[var(--border-control)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text-strong)] hover:bg-[var(--raised)]">Coller un exemple</button>
              </div>
            )}
          </div>
          <footer className="sticky bottom-0 z-[2] flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 @[900px]:static">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-sm">
              <input type="checkbox" checked={inv} onChange={(e) => setInv(e.target.checked)} className="peer sr-only" />
              <span aria-hidden className="flex h-[22px] w-9 rounded-full bg-[var(--border-control)] p-0.5 transition-colors peer-checked:bg-[var(--accent)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus-ring)]">
                <i className={`size-[18px] rounded-full transition-transform duration-300 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] ${inv ? 'translate-x-3.5 bg-[var(--accent-fg)]' : 'bg-[var(--surface)]'}`} />
              </span>
              Afficher les espaces insécables
            </label>
            <button type="button" disabled={!n} onClick={() => apply(issues)}
              className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-fg)] transition hover:bg-[var(--accent-hover)] active:scale-[.97] disabled:cursor-default disabled:opacity-45 @[521px]:flex-none">
              Tout corriger <span className="h-[22px] min-w-[22px] rounded-full bg-[var(--accent-fg)] px-1.5 font-mono text-xs font-semibold leading-[22px] tabular-nums text-[var(--accent)]">{n}</span>
            </button>
          </footer>
        </div>

        <aside className="grid min-w-0 content-start gap-3 @[900px]:sticky @[900px]:top-4">
          <header className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div aria-live="polite" className="flex items-baseline gap-2.5">
              <b key={n} className="inline-block text-4xl font-semibold tracking-[-0.02em] tabular-nums text-[var(--text-strong)] motion-safe:animate-[ty-tick_380ms_cubic-bezier(.34,1.56,.64,1)]">{n}</b>
              <span className="text-sm text-[var(--text-muted)]">{n > 1 ? 'corrections proposées' : 'correction proposée'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(CATS).filter((k) => cats[k]).map((k) => <span key={k} className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium ${CATS[k][1]}`}><i className="size-2 rounded-full bg-current" />{CATS[k][0]} · {cats[k]}</span>)}
            </div>
          </header>
          <ol className="m-0 grid list-none gap-1.5 p-0 @[900px]:max-h-[520px] @[900px]:overflow-auto" onPointerLeave={() => setHot(-1)}>
            {issues.map((m, i) => {
              const a = Math.max(0, m.s - 14), b = Math.min(text.length, m.e + 14), before = text.slice(m.s, m.e);
              return (
                <li key={`${m.rule.id}-${m.s}`} onPointerOver={() => setHot(i)} onFocus={() => setHot(i)}
                  className={`grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 rounded-xl border bg-[var(--surface)] py-3 pl-3.5 pr-3 transition-[border-color,opacity,transform] duration-300 ${hot === i ? 'border-[var(--border-strong)]' : 'border-[var(--border)]'} ${leaving === i ? 'translate-x-4 scale-[.98] opacity-0' : ''}`}>
                  <span className="flex min-w-0 items-center gap-2 text-[13px] leading-[18px] text-[var(--text-muted)]"><i className="size-2 flex-none rounded-full" style={{ background: CATS[m.rule.cat][2] }} />{m.rule.label(m)}</span>
                  <span className="flex gap-1">
                    <button type="button" onClick={() => act(i, 'skip')} className="min-h-11 min-w-11 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] font-medium text-[var(--text-strong)] hover:bg-[var(--raised)] @[521px]:min-h-9">Ignorer</button>
                    <button type="button" onClick={() => act(i, 'fix')} className="min-h-11 min-w-11 rounded-lg border border-[var(--text-strong)] bg-[var(--text-strong)] px-3 text-[13px] font-medium text-[var(--bg)] hover:bg-[var(--text)] @[521px]:min-h-9">Corriger</button>
                  </span>
                  <button type="button" onClick={() => act(i, 'go')} aria-label={`Aller à la correction ${i + 1} dans le texte`}
                    className="col-span-2 min-w-0 cursor-pointer truncate border-0 bg-transparent p-0 text-left text-[15px] leading-6">
                    {a > 0 && '…'}{text.slice(a, m.s).replace(/\n/g, ' ')}
                    {before && <del className="rounded-[3px] bg-[var(--tint-red-bg)] px-0.5 text-[var(--text-muted)] decoration-[var(--down)]"><Show s={before} /></del>}
                    <ins className="rounded-[3px] bg-[var(--tint-green-bg)] px-0.5 font-medium text-[var(--text-strong)] no-underline"><Show s={m.r} /></ins>
                    {text.slice(m.e, b).replace(/\n/g, ' ')}{b < text.length && '…'}
                  </button>
                </li>
              );
            })}
          </ol>
          {n === 0 && text.length > 0 && (
            <div className="grid grid-cols-[44px_1fr] items-center gap-3 rounded-2xl bg-[var(--tint-green-bg)] p-4 text-[var(--tint-green-fg)]">
              <svg viewBox="0 0 48 48" className="size-11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="24" cy="24" r="20" strokeDasharray="126" strokeDashoffset="126" className="motion-safe:animate-[ty-draw_620ms_cubic-bezier(.2,0,0,1)_forwards] motion-reduce:[stroke-dashoffset:0]" />
                <path d="M15 24.5l6 6 12-13" strokeDasharray="30" strokeDashoffset="30" className="motion-safe:animate-[ty-draw_420ms_380ms_cubic-bezier(.2,0,0,1)_forwards] motion-reduce:[stroke-dashoffset:0]" />
              </svg>
              <p className="m-0 text-sm leading-5"><b className="block text-[15px]">Texte conforme</b>Espaces, signes et nombres suivent les règles de l’Imprimerie nationale.</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

export default FrenchTypoChecker;
