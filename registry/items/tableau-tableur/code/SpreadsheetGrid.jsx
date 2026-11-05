// Tableau façon tableur — React + Tailwind CSS, sans bibliothèque de grille. Couleurs : variables de tokens.css.
// <SpreadsheetGrid rows={rows} columns={columns} onChange={(changes) => save(changes)} />
// Grille virtualisée, sélection rectangulaire au glisser, poignée de recopie, édition en place, barre de formule,
// copier / couper / coller TSV (Excel, Numbers, Google Sheets), annuler / rétablir, navigation au clavier.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const PASS = { 'Pass 3 jours': 390, 'Pass 1 jour': 160, Exposant: 0, Intervenant: 0 };
export const DEFAULT_COLUMNS = [
  { key: 'nom', label: 'Participant', width: 184, type: 'text', grow: 1 },
  { key: 'societe', label: 'Société', width: 168, type: 'text', grow: 1 },
  { key: 'formule', label: 'Formule', width: 132, type: 'tag', options: Object.keys(PASS) },
  { key: 'nuits', label: 'Nuits', width: 80, type: 'int', min: 0, max: 14 },
  { key: 'prix', label: 'Prix / nuit', width: 112, type: 'eur' },
  { key: 'navette', label: 'Navette', width: 96, type: 'text', grow: 0.5 },
  { key: 'total', label: 'Total', width: 124, type: 'eur', compute: (r) => (+r.nuits || 0) * (+r.prix || 0) + (PASS[r.formule] || 0), formula: (i) => `=D${i}*E${i}+PASS(C${i})` },
];
const TAGS = ['bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]', 'bg-[var(--tint-blue-bg)] text-[var(--tint-blue-fg)]', 'bg-[var(--tint-amber-bg)] text-[var(--tint-amber-fg)]', 'bg-[var(--tint-violet-bg)] text-[var(--tint-violet-fg)]'];
const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 });
const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const PRE = ['Camille', 'Léa', 'Hugo', 'Inès', 'Nathan', 'Chloé', 'Louis', 'Manon', 'Jules', 'Sarah', 'Yanis', 'Lina', 'Adam', 'Zoé', 'Gabriel', 'Jade', 'Noah', 'Clara', 'Rayan', 'Alice', 'Théo', 'Emma', 'Malik', 'Anaïs', 'Paul', 'Salomé', 'Karim', 'Margaux', 'Victor', 'Nora'];
const NOMS = ['Roux', 'Lefèvre', 'Benali', 'Garnier', 'Moreau', 'Faure', 'Nguyen', 'Chevalier', 'Mercier', 'Haddad', 'Lambert', 'Rousseau', 'Perrin', 'Blanc', 'Guérin', 'Boyer', 'Diallo', 'Fontaine', 'Caron', 'Mallet', 'Barbier', 'Leclerc', 'Renaud', 'Meunier', 'Brunet', 'Da Silva', 'Colin', 'Vidal', 'Marchand', 'Arnaud'];
const SOC = ['Alpage Énergies', 'Studio Névé', 'Cordée Conseil', 'Granit Logiciels', 'Lauze & Fils', 'Crête Mobilité', 'Moraine Santé', 'Serac Data', 'Combe Assurances', 'Ubac Design', 'Adret Finance', 'Chamois Retail', 'Névé Labs', 'Pierrier Industrie', 'Hameau Média'];
export function sampleRows(n = 1200) {
  const R = rng(2027), prices = [89, 109, 129, 149, 175], out = [];
  for (let i = 0; i < n; i++) {
    const f = R(), formule = f < 0.58 ? 'Pass 3 jours' : f < 0.86 ? 'Pass 1 jour' : f < 0.96 ? 'Exposant' : 'Intervenant';
    const nuits = formule === 'Pass 1 jour' ? (R() < 0.6 ? 0 : 1) : formule === 'Pass 3 jours' ? 2 + (R() < 0.3 ? 1 : 0) : 1 + Math.floor(R() * 3);
    out.push({ nom: `${PRE[Math.floor(R() * PRE.length)]} ${NOMS[Math.floor(R() * NOMS.length)]}`, societe: SOC[Math.floor(R() * SOC.length)], formule, nuits, prix: nuits ? prices[Math.floor(R() * prices.length)] : '', navette: R() < 0.62 ? 'Oui' : 'Non' });
  }
  return out;
}

const isNum = (c) => c.type === 'int' || c.type === 'eur';
function parse(col, text) {
  text = String(text ?? '').trim();
  if (col.compute) return { skip: true };
  if (isNum(col)) {
    if (text === '') return { v: '' };
    let n = +text.replace(/\s|\u202f|\u00a0|€/g, '').replace(',', '.');
    if (Number.isNaN(n)) return { err: `« ${text.slice(0, 24)} » n’est pas un nombre (colonne ${col.label}).` };
    if (col.type === 'int') { n = Math.round(n); if (n < col.min || n > col.max) return { err: `${col.label} : entre ${col.min} et ${col.max}.` }; }
    if (n < 0) return { err: `${col.label} : pas de valeur négative.` };
    return { v: n };
  }
  if (col.type === 'tag' && text) { const hit = col.options.find((o) => o.toLowerCase().startsWith(text.toLowerCase())); return hit ? { v: hit } : { err: `Formule inconnue : ${col.options.join(', ')}.` }; }
  return { v: text };
}

export default function SpreadsheetGrid({
  rows: rowsProp, columns = DEFAULT_COLUMNS, title = 'Inscriptions — Rencontres Altitude 2027', eyebrow = 'Bivouac · Événements', rowCount = 1200,
  density = 'comfortable', gridLines = true, formulaBar = true, status = 'ready', height = 460, onChange,
}) {
  const [rows, setRows] = useState(() => rowsProp || sampleRows(rowCount));
  useEffect(() => { setRows(rowsProp || sampleRows(rowCount)); }, [rowsProp, rowCount]);
  const scrollRef = useRef(null), gridRef = useRef(null), editorRef = useRef(null), id = useMemo(() => `sh${Math.random().toString(36).slice(2, 7)}`, []);
  const [vw, setVw] = useState(1000), [scrollTop, setScrollTop] = useState(0), [mobile, setMobile] = useState(false);
  const [sel, setSel] = useState({ r: 0, c: 0, r0: 0, c0: 0, r1: 0, c1: 0, er: 0, ec: 0 });
  const [edit, setEdit] = useState(null), [bad, setBad] = useState(false), [copied, setCopied] = useState(null), [fill, setFill] = useState(null);
  const [msg, setMsg] = useState({ t: '', err: false }), [live, setLive] = useState(''), [saving, setSaving] = useState(false), [extend, setExtend] = useState(false);
  const hist = useRef({ undo: [], redo: [] }), drag = useRef(null), lastTap = useRef(null);
  const RH = mobile ? (density === 'compact' ? 40 : 44) : density === 'compact' ? 28 : 36, HH = 32, NUMW = mobile ? 40 : 48;

  useLayoutEffect(() => {
    const el = scrollRef.current; if (!el) return;
    const ro = new ResizeObserver(() => { setVw(el.clientWidth); setMobile(window.matchMedia('(max-width: 720px)').matches); }); ro.observe(el); return () => ro.disconnect();
  }, []);
  /* Les colonnes « grow » se partagent la place libre pour que la grille remplisse sa carte. */
  const cols = useMemo(() => {
    const base = NUMW + columns.reduce((a, c) => a + c.width, 0), free = Math.max(0, vw - base - 1), gsum = columns.reduce((a, c) => a + (c.grow ? c.width * c.grow : 0), 0);
    let x = NUMW; return columns.map((c) => { const w = Math.floor(c.width + (c.grow && gsum ? (free * c.width * c.grow) / gsum : 0)); const o = { ...c, w, x }; x += w; return o; });
  }, [columns, vw, NUMW]);
  const W = cols.length ? cols[cols.length - 1].x + cols[cols.length - 1].w : NUMW;
  const value = useCallback((r, c) => { const col = cols[c], row = rows[r]; if (!row) return ''; return col.compute ? col.compute(row) : row[col.key]; }, [cols, rows]);
  const show = (r, c) => { const v = value(r, c), col = cols[c]; if (v === '' || v == null) return ''; return col.type === 'eur' ? eur.format(+v) : col.type === 'int' ? nf.format(+v) : String(v); };
  const raw = (r, c) => { const v = value(r, c); if (v == null) return ''; return isNum(cols[c]) ? String(v).replace('.', ',') : String(v); };
  const say = (t) => { setLive(''); setTimeout(() => setLive(t), 20); };
  const note = (t, err = false) => { setMsg({ t, err }); clearTimeout(note.t); note.t = setTimeout(() => setMsg({ t: '', err: false }), err ? 4200 : 2600); };
  const box = (r0, c0, r1, c1) => ({ left: cols[c0].x, top: HH + r0 * RH, width: cols[c1].x + cols[c1].w - cols[c0].x, height: (r1 - r0 + 1) * RH });

  const reveal = (r, c) => {
    const el = scrollRef.current; if (!el) return; const b = box(r, c, r, c);
    if (b.top - HH < el.scrollTop) el.scrollTop = b.top - HH; else if (b.top + b.height > el.scrollTop + el.clientHeight) el.scrollTop = b.top + b.height - el.clientHeight;
    if (b.left - NUMW < el.scrollLeft) el.scrollLeft = b.left - NUMW; else if (b.left + b.width > el.scrollLeft + el.clientWidth) el.scrollLeft = b.left + b.width - el.clientWidth;
  };
  const select = (r, c, ext = false) => {
    r = Math.max(0, Math.min(rows.length - 1, r)); c = Math.max(0, Math.min(cols.length - 1, c));
    setSel((s) => (ext ? { ...s, r0: Math.min(s.r, r), r1: Math.max(s.r, r), c0: Math.min(s.c, c), c1: Math.max(s.c, c), er: r, ec: c } : { r, c, r0: r, r1: r, c0: c, c1: c, er: r, ec: c }));
    reveal(r, c);
  };

  /* Écriture groupée avec historique */
  const write = (cells, label) => {
    const changes = [], errs = [], next = rows.slice();
    cells.forEach(({ r, c, text }) => {
      const col = cols[c], p = parse(col, text); if (p.skip) return; if (p.err) { errs.push(p.err); return; }
      const before = next[r][col.key]; if (before === p.v) return;
      next[r] = { ...next[r], [col.key]: p.v }; changes.push({ row: r, col: col.key, before, after: p.v });
    });
    if (changes.length) {
      setRows(next); hist.current.undo.push({ changes, sel }); hist.current.redo = []; onChange?.(changes);
      setSaving(true); clearTimeout(write.t); write.t = setTimeout(() => setSaving(false), 700);
    }
    if (errs.length) { note(errs[0] + (errs.length > 1 ? ` (${errs.length} cellules refusées)` : ''), true); say(errs[0]); }
    else if (label && changes.length) note(label(changes.length));
    return changes.length;
  };
  const travel = (from, to, undoing) => {
    const h = hist.current[from].pop(); if (!h) return note(`Rien à ${undoing ? 'annuler' : 'rétablir'}.`);
    setRows((rs) => { const n = rs.slice(); h.changes.forEach((ch) => { n[ch.row] = { ...n[ch.row], [ch.col]: undoing ? ch.before : ch.after }; }); return n; });
    hist.current[to].push(h); setSel(h.sel); note(`${undoing ? 'Annulé' : 'Rétabli'} : ${h.changes.length} cellule${h.changes.length > 1 ? 's' : ''}`);
    onChange?.(h.changes.map((ch) => ({ ...ch, before: undoing ? ch.after : ch.before, after: undoing ? ch.before : ch.after })));
  };

  /* Édition */
  const startEdit = (initial) => {
    const col = cols[sel.c]; if (col.compute) return note('Total est calculé : =Nuits × Prix / nuit + prix du pass.');
    setSel((s) => ({ ...s, r0: s.r, r1: s.r, c0: s.c, c1: s.c })); reveal(sel.r, sel.c);
    setEdit({ r: sel.r, c: sel.c, value: initial ?? raw(sel.r, sel.c) }); setBad(false);
  };
  useEffect(() => { if (edit && editorRef.current) { editorRef.current.focus({ preventScroll: true }); const n = editorRef.current.value.length; editorRef.current.setSelectionRange(n, n); } }, [edit?.r, edit?.c]);
  const commit = (dr = 0, dc = 0) => {
    if (!edit) return;
    const p = parse(cols[edit.c], edit.value);
    if (p.err) { setBad(true); note(p.err, true); say(p.err); return; }
    write([{ r: edit.r, c: edit.c, text: edit.value }]); setEdit(null); setBad(false); gridRef.current?.focus({ preventScroll: true });
    if (dr || dc) select(edit.r + dr, edit.c + dc);
  };

  const clearSel = () => { const cells = []; for (let r = sel.r0; r <= sel.r1; r++) for (let c = sel.c0; c <= sel.c1; c++) cells.push({ r, c, text: '' }); write(cells, (n) => `${n} cellule${n > 1 ? 's effacées' : ' effacée'} · ⌘ Z pour annuler`); };
  const tsv = () => { const out = []; for (let r = sel.r0; r <= sel.r1; r++) { const l = []; for (let c = sel.c0; c <= sel.c1; c++) l.push(raw(r, c)); out.push(l.join('\t')); } return out.join('\n'); };
  const cellsCount = (sel.r1 - sel.r0 + 1) * (sel.c1 - sel.c0 + 1);
  const markCopied = (cut) => { setCopied({ r0: sel.r0, c0: sel.c0, r1: sel.r1, c1: sel.c1, cut }); note(`${cellsCount} cellule${cellsCount > 1 ? 's' : ''} ${cut ? 'coupée' : 'copiée'}${cellsCount > 1 ? 's' : ''} · ⌘ V pour coller · Échap pour annuler`); say(`${cellsCount} cellules copiées`); };
  const onCopy = (e, cut = false) => { if (edit) return; e.preventDefault(); e.clipboardData.setData('text/plain', tsv()); markCopied(cut); };
  const onPaste = (e) => {
    if (edit) return; e.preventDefault();
    const text = e.clipboardData.getData('text/plain'); if (!text) return;
    const lines = text.replace(/\r/g, '').replace(/\n$/, '').split('\n').map((l) => l.split('\t'));
    const single = lines.length === 1 && lines[0].length === 1 && cellsCount > 1;
    const H = single ? sel.r1 - sel.r0 + 1 : lines.length, Wc = single ? sel.c1 - sel.c0 + 1 : Math.max(...lines.map((l) => l.length)), cells = [];
    for (let i = 0; i < H; i++) for (let j = 0; j < Wc; j++) { const r = sel.r0 + i, c = sel.c0 + j; if (r < rows.length && c < cols.length) cells.push({ r, c, text: single ? lines[0][0] : lines[i]?.[j] ?? '' }); }
    if (copied?.cut) for (let r = copied.r0; r <= copied.r1; r++) for (let c = copied.c0; c <= copied.c1; c++) if (!(r >= sel.r0 && r < sel.r0 + H && c >= sel.c0 && c < sel.c0 + Wc)) cells.unshift({ r, c, text: '' });
    setSel((s) => ({ ...s, r1: Math.min(rows.length - 1, s.r0 + H - 1), c1: Math.min(cols.length - 1, s.c0 + Wc - 1) })); setCopied(null);
    write(cells, (n) => `${n} cellule${n > 1 ? 's collées' : ' collée'} · ⌘ Z pour annuler`);
  };

  const onKeyDown = (e) => {
    if (edit) return;
    const mod = e.metaKey || e.ctrlKey, k = e.key, ext = e.shiftKey, er = ext ? sel.er : sel.r, ec = ext ? sel.ec : sel.c;
    const page = Math.max(1, Math.floor((scrollRef.current?.clientHeight || 400) / RH) - 1);
    const mv = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[k];
    if (mv) { e.preventDefault(); return mod ? select(mv[0] ? (mv[0] < 0 ? 0 : rows.length - 1) : er, mv[1] ? (mv[1] < 0 ? 0 : cols.length - 1) : ec, ext) : select(er + mv[0], ec + mv[1], ext); }
    if (k === 'PageDown' || k === 'PageUp') { e.preventDefault(); return select(er + (k === 'PageDown' ? page : -page), ec, ext); }
    if (k === 'Home') { e.preventDefault(); return select(mod ? 0 : er, 0, ext); }
    if (k === 'End') { e.preventDefault(); return select(mod ? rows.length - 1 : er, cols.length - 1, ext); }
    if (k === 'Tab') { e.preventDefault(); return select(sel.r, sel.c + (ext ? -1 : 1)); }
    if (k === 'Enter') { e.preventDefault(); return ext ? select(sel.r - 1, sel.c) : startEdit(); }
    if (k === 'F2') { e.preventDefault(); return startEdit(); }
    if (k === 'Escape') { if (copied) { setCopied(null); say('Copie annulée'); } return; }
    if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); return clearSel(); }
    if (mod && k.toLowerCase() === 'a') { e.preventDefault(); return setSel({ r: 0, c: 0, r0: 0, c0: 0, r1: rows.length - 1, c1: cols.length - 1, er: rows.length - 1, ec: cols.length - 1 }); }
    if (mod && k.toLowerCase() === 'z') { e.preventDefault(); return e.shiftKey ? travel('redo', 'undo', false) : travel('undo', 'redo', true); }
    if (mod && k.toLowerCase() === 'y') { e.preventDefault(); return travel('redo', 'undo', false); }
    if (mod && k.toLowerCase() === 'd') { e.preventDefault(); const cells = []; for (let r = sel.r0 + 1; r <= sel.r1; r++) for (let c = sel.c0; c <= sel.c1; c++) cells.push({ r, c, text: raw(sel.r0, c) }); return write(cells, (n) => `Recopié vers le bas : ${n} cellules`); }
    if (!mod && !e.altKey && k.length === 1) { e.preventDefault(); startEdit(k); }
  };

  /* Pointeur : glisser pour sélectionner (souris, ou doigt en mode « Étendre »), poignée de recopie */
  const cellAt = (x, y) => { const b = gridRef.current.getBoundingClientRect(), px = x - b.left, r = Math.floor((y - b.top - HH) / RH); const c = cols.findIndex((col) => px < col.x + col.w); return { r: Math.max(0, Math.min(rows.length - 1, r)), c: c < 0 ? cols.length - 1 : c }; };
  const onPointerDown = (e) => {
    const cell = e.target.closest('[data-r]'); if (!cell || e.button > 0) return;
    if (edit) commit();
    const r = +cell.dataset.r, c = +cell.dataset.c;
    if (e.pointerType !== 'mouse' && !extend) { drag.current = { tap: { r, c, y: e.clientY } }; return; }
    e.preventDefault(); gridRef.current.focus({ preventScroll: true }); select(r, c, e.shiftKey || extend);
    drag.current = { id: e.pointerId, kind: 'sel' }; gridRef.current.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    const d = drag.current; if (!d || d.id !== e.pointerId) return; const q = cellAt(e.clientX, e.clientY);
    if (d.kind === 'sel') setSel((s) => (q.r === s.er && q.c === s.ec ? s : { ...s, r0: Math.min(s.r, q.r), r1: Math.max(s.r, q.r), c0: Math.min(s.c, q.c), c1: Math.max(s.c, q.c), er: q.r, ec: q.c }));
    if (d.kind === 'fill') setFill((f) => ({ ...f, to: Math.max(f.r1, q.r) }));
  };
  const onPointerUp = (e) => {
    const d = drag.current; drag.current = null; if (!d) return;
    if (d.tap) { const { r, c } = d.tap, now = Date.now(); if (Math.abs(e.clientY - d.tap.y) > 8) return; gridRef.current.focus({ preventScroll: true }); if (lastTap.current && lastTap.current.r === r && lastTap.current.c === c && now - lastTap.current.t < 380) { select(r, c); setTimeout(() => startEdit(), 0); lastTap.current = null; } else { select(r, c); lastTap.current = { r, c, t: now }; } return; }
    if (d.kind === 'fill' && fill && fill.to > fill.r1) {
      const h = fill.r1 - fill.r0 + 1, cells = [];
      for (let r = fill.r1 + 1; r <= fill.to; r++) for (let c = fill.c0; c <= fill.c1; c++) cells.push({ r, c, text: raw(fill.r0 + ((r - fill.r0) % h), c) });
      setSel((s) => ({ ...s, r1: fill.to, er: fill.to })); write(cells, (n) => `Recopié : ${n} cellules · ⌘ Z pour annuler`);
    }
    setFill(null);
  };
  const startFill = (e) => { e.preventDefault(); e.stopPropagation(); setFill({ r0: sel.r0, r1: sel.r1, c0: sel.c0, c1: sel.c1, to: sel.r1 }); drag.current = { id: e.pointerId, kind: 'fill' }; gridRef.current.setPointerCapture(e.pointerId); };

  /* Fenêtre de rendu */
  const viewH = scrollRef.current?.clientHeight || height;
  const a = Math.max(0, Math.floor((scrollTop - HH) / RH) - 8), b = Math.min(rows.length - 1, Math.ceil((scrollTop + viewH) / RH) + 8);
  const inSel = (r, c) => r >= sel.r0 && r <= sel.r1 && c >= sel.c0 && c <= sel.c1;
  const multi = sel.r0 !== sel.r1 || sel.c0 !== sel.c1;
  const aggr = useMemo(() => {
    if (!multi) return null; let sum = 0, n = 0, cnt = 0;
    for (let r = sel.r0; r <= sel.r1; r++) for (let c = sel.c0; c <= sel.c1; c++) { const v = value(r, c); if (v !== '' && v != null) cnt++; if (isNum(cols[c]) && v !== '' && !Number.isNaN(+v)) { sum += +v; n++; } }
    const money = cols.slice(sel.c0, sel.c1 + 1).every((c) => c.type === 'eur'), f = (x) => (money ? eur.format(x) : nf.format(x));
    return { sum: n ? f(sum) : null, avg: n ? f(sum / n) : null, cnt };
  }, [sel, value, cols, multi]);
  const revenue = useMemo(() => rows.reduce((acc, r) => acc + (cols.find((c) => c.compute)?.compute(r) || 0), 0), [rows, cols]);
  const ref = multi ? `${L[sel.c0]}${sel.r0 + 1}:${L[sel.c1]}${sel.r1 + 1}` : `${L[sel.c]}${sel.r + 1}`;
  const activeCol = cols[sel.c];
  const hint = mobile ? 'Touchez une cellule, touchez deux fois pour la modifier.' : 'Glissez pour sélectionner · Entrée modifier · ⌘ C ⌘ V copier-coller · ⌘ Z annuler';
  const btn = 'inline-flex h-11 flex-none items-center gap-1.5 rounded-lg border border-[var(--border-control)] bg-[var(--surface)] px-3.5 text-sm font-medium text-[var(--text-strong)]';

  return (
    <section aria-labelledby={`${id}-t`} className="relative mx-auto w-full max-w-[1120px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] font-[family-name:var(--font-sans)] text-[var(--text)] tabular-nums md:rounded-2xl">
      <header className="flex items-center justify-between gap-4 p-4 md:px-6 md:pb-4 md:pt-5">
        <div className="flex min-w-0 items-center gap-3">
          <svg viewBox="0 0 100 100" aria-hidden className="h-10 w-10 flex-none"><rect width="100" height="100" rx="28" fill="var(--accent)" /><path d="M20 76 50 24l30 52Z" fill="none" stroke="var(--accent-fg)" strokeWidth="8" strokeLinejoin="round" /><path d="M50 76 50 52 40 76" fill="none" stroke="var(--accent-fg)" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" /><circle cx="73" cy="30" r="5" fill="var(--accent-fg)" /></svg>
          <div className="min-w-0"><p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.04em] text-[var(--text-muted)]">{eyebrow}</p><h2 id={`${id}-t`} className="text-base font-semibold tracking-[-0.01em] text-[var(--text-strong)] md:text-xl">{title}</h2></div>
        </div>
        <p className="flex flex-none items-center gap-2 text-xs text-[var(--text-muted)]"><span aria-hidden className={`h-2 w-2 rounded-full ${saving ? 'animate-pulse bg-[var(--warn)]' : 'bg-[var(--up)]'}`} /><span className="hidden md:inline">{saving ? 'Enregistrement…' : 'Enregistré'}</span></p>
      </header>

      {formulaBar && (
        <div className="mx-4 mb-3 flex h-11 items-center overflow-hidden rounded-lg border border-[var(--border-control)] focus-within:outline focus-within:outline-2 focus-within:-outline-offset-1 focus-within:outline-[var(--focus-ring)] md:mx-6 md:h-10">
          <span aria-label="Cellule active" className="grid h-full w-14 flex-none place-items-center border-r border-[var(--border)] font-[family-name:var(--font-mono)] text-sm font-medium text-[var(--text-strong)] md:w-[72px]">{ref}</span>
          <span aria-hidden className="pl-3 pr-2 text-sm italic text-[var(--text-muted)]">ƒx</span>
          <input aria-label="Contenu de la cellule active" readOnly={!!activeCol?.compute} value={edit ? edit.value : activeCol?.compute ? activeCol.formula(sel.r + 1) : raw(sel.r, sel.c)}
            onFocus={() => !activeCol?.compute && !edit && setEdit({ r: sel.r, c: sel.c, value: raw(sel.r, sel.c), bar: true })} onChange={(e) => edit && setEdit({ ...edit, value: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(1, 0); } if (e.key === 'Escape') { setEdit(null); gridRef.current?.focus(); } }}
            className={`h-full min-w-0 flex-1 bg-transparent pr-3 text-base outline-none read-only:font-[family-name:var(--font-mono)] read-only:text-[var(--text-muted)] md:text-sm ${bad && edit?.bar ? 'text-[var(--down)]' : 'text-[var(--text-strong)]'}`} />
        </div>
      )}

      {mobile && (
        <div role="toolbar" aria-label="Actions sur la sélection" className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
          <button type="button" className={btn} onClick={() => startEdit()}>Modifier</button>
          <button type="button" className={btn} onClick={() => navigator.clipboard?.writeText(tsv()).then(() => markCopied(false), () => note('Copie refusée par le navigateur.', true))}>Copier</button>
          <button type="button" className={btn} onClick={clearSel}>Effacer</button>
          <button type="button" className={btn} onClick={() => travel('undo', 'redo', true)}>Annuler</button>
          <button type="button" aria-pressed={extend} className={`${btn} aria-pressed:border-[var(--accent)] aria-pressed:bg-[var(--accent-subtle)]`} onClick={() => setExtend((x) => !x)}>Étendre</button>
        </div>
      )}

      <div ref={scrollRef} onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)} className="relative overflow-auto overscroll-contain border-t border-[var(--border)]" style={{ height: mobile ? 420 : height }}>
        {status === 'ready' ? (
          <div ref={gridRef} role="grid" aria-labelledby={`${id}-t`} aria-multiselectable="true" aria-rowcount={rows.length + 1} aria-colcount={cols.length + 1} tabIndex={0}
            aria-activedescendant={sel.r >= a && sel.r <= b ? `${id}-${sel.r}-${sel.c}` : undefined}
            onKeyDown={onKeyDown} onCopy={onCopy} onCut={(e) => onCopy(e, true)} onPaste={onPaste} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={() => { drag.current = null; setFill(null); }}
            onDoubleClick={(e) => { const c = e.target.closest('[data-r]'); if (c) { select(+c.dataset.r, +c.dataset.c); setTimeout(() => startEdit(), 0); } }}
            className="group/grid relative select-none outline-none" style={{ width: W, height: HH + rows.length * RH }}>
            <div role="row" aria-rowindex={1} className="sticky top-0 z-[4] flex border-b border-[var(--border)] bg-[var(--raised)]" style={{ height: HH }}>
              <div role="columnheader" aria-label="Tout sélectionner" onClick={() => setSel({ r: 0, c: 0, r0: 0, c0: 0, r1: rows.length - 1, c1: cols.length - 1, er: rows.length - 1, ec: cols.length - 1 })} className="sticky left-0 z-[5] flex flex-none cursor-pointer items-center justify-center border-r border-[var(--border)] bg-[var(--raised)]" style={{ width: NUMW }}><svg viewBox="0 0 12 12" className="h-3 w-3 fill-[var(--text-muted)]" aria-hidden><path d="M11 1v10H1z" /></svg></div>
              {cols.map((c, i) => { const on = i >= sel.c0 && i <= sel.c1; return (
                <div key={c.key} role="columnheader" aria-colindex={i + 2} onClick={() => setSel({ r: sel.r, c: i, r0: 0, r1: rows.length - 1, c0: i, c1: i, er: rows.length - 1, ec: i })}
                  className={`flex flex-none cursor-pointer items-center gap-1.5 overflow-hidden whitespace-nowrap border-r border-[var(--border)] px-2.5 text-xs font-medium ${isNum(c) ? 'justify-end' : ''} ${on ? 'bg-[var(--accent-subtle)] text-[var(--text-strong)] shadow-[inset_0_-2px_0_var(--accent)]' : 'text-[var(--text-muted)]'}`} style={{ width: c.w }}>
                  {c.compute && <i aria-hidden className="font-semibold">ƒ</i>}<b className="font-[family-name:var(--font-mono)] text-[11px] font-medium text-[var(--text-disabled)]">{L[i]}</b>{c.label}
                </div>); })}
            </div>
            <div role="rowgroup" className="absolute left-0" style={{ top: HH }}>
              {Array.from({ length: Math.max(0, b - a + 1) }, (_, k) => a + k).map((r) => (
                <div key={r} role="row" aria-rowindex={r + 2} className="absolute left-0 flex" style={{ top: r * RH, height: RH, width: W }}>
                  <div role="rowheader" onClick={() => setSel({ r, c: 0, r0: r, r1: r, c0: 0, c1: cols.length - 1, er: r, ec: cols.length - 1 })} className={`sticky left-0 z-[3] flex flex-none cursor-pointer items-center justify-center border-b border-r border-[var(--border)] font-[family-name:var(--font-mono)] text-xs font-medium ${r >= sel.r0 && r <= sel.r1 ? 'bg-[var(--accent-subtle)] text-[var(--text-strong)] shadow-[inset_-2px_0_0_var(--accent)]' : 'bg-[var(--raised)] text-[var(--text-muted)]'}`} style={{ width: NUMW }}>{r + 1}</div>
                  {cols.map((c, ci) => { const v = show(r, ci); return (
                    <div key={c.key} id={`${id}-${r}-${ci}`} role="gridcell" aria-colindex={ci + 2} aria-selected={inSel(r, ci)} aria-readonly={c.compute ? true : undefined} data-r={r} data-c={ci}
                      className={`flex flex-none items-center overflow-hidden text-ellipsis whitespace-nowrap border-b border-[var(--border)] px-2.5 text-sm ${gridLines ? 'border-r' : ''} ${isNum(c) ? 'justify-end' : ''} ${c.compute ? 'bg-[var(--raised)] text-[var(--text)]' : 'bg-[var(--surface)] text-[var(--text-strong)]'} ${c.key === 'navette' && v === 'Non' ? '!text-[var(--text-muted)]' : ''}`} style={{ width: c.w }}>
                      {c.type === 'tag' && v ? <span className={`inline-flex h-5 items-center rounded-full px-2 text-xs font-medium ${TAGS[c.options.indexOf(v)] || TAGS[0]}`}>{v}</span> : v}
                    </div>); })}
                </div>
              ))}
            </div>
            {/* Sélection, cellule active, copie (fourmis), aperçu de recopie */}
            <div aria-hidden className={`pointer-events-none absolute z-[2] rounded-sm ${multi ? 'border border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)]' : ''}`} style={box(sel.r0, sel.c0, sel.r1, sel.c1)}>
              <i onPointerDown={startFill} className="pointer-events-auto absolute -bottom-[5px] -right-[5px] h-[9px] w-[9px] cursor-crosshair touch-none rounded-sm border-2 border-[var(--surface)] bg-[var(--accent)] after:absolute after:-inset-3 after:content-['']" />
            </div>
            <div aria-hidden className="pointer-events-none absolute z-[2] rounded-sm border-2 border-[var(--accent)] transition-all duration-[90ms] group-focus-within/grid:border-[var(--accent)]" style={(() => { const x = box(sel.r, sel.c, sel.r, sel.c); return { left: x.left - 1, top: x.top - 1, width: x.width + 1, height: x.height + 1 }; })()} />
            {copied && <svg aria-hidden className="pointer-events-none absolute z-[2] overflow-visible" style={(() => { const x = box(copied.r0, copied.c0, copied.r1, copied.c1); return { left: x.left - 1, top: x.top - 1, width: x.width + 2, height: x.height + 2 }; })()}><rect x="1" y="1" width="100%" height="100%" rx="2" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="5 4" className="motion-safe:animate-[sh-ants_600ms_linear_infinite]" style={{ width: 'calc(100% - 2px)', height: 'calc(100% - 2px)' }} /></svg>}
            {fill && fill.to > fill.r1 && <div aria-hidden className="pointer-events-none absolute z-[2] rounded-sm border border-dashed border-[var(--accent)]" style={box(fill.r0, fill.c0, fill.to, fill.c1)} />}
            {edit && !edit.bar && (() => { const x = box(edit.r, edit.c, edit.r, edit.c); return (
              <input ref={editorRef} aria-label={`Modifier ${L[edit.c]}${edit.r + 1}, ${cols[edit.c].label}`} aria-invalid={bad || undefined} value={edit.value}
                onChange={(e) => { setEdit({ ...edit, value: e.target.value }); setBad(false); }}
                onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); commit(e.shiftKey ? -1 : 1, 0); } else if (e.key === 'Tab') { e.preventDefault(); commit(0, e.shiftKey ? -1 : 1); } else if (e.key === 'Escape') { e.preventDefault(); setEdit(null); setBad(false); gridRef.current?.focus(); } }}
                onBlur={() => { if (parse(cols[edit.c], edit.value).err) { setEdit(null); setBad(false); } else commit(); }}
                className={`absolute z-[6] rounded-sm border-2 bg-[var(--surface)] px-[9px] text-base text-[var(--text-strong)] shadow-[var(--shadow-popover)] outline-none md:text-sm ${isNum(cols[edit.c]) ? 'text-right' : ''} ${bad ? 'border-[var(--down)]' : 'border-[var(--accent)]'}`}
                style={{ left: x.left - 1, top: x.top - 1, width: Math.max(x.width + 2, 120), height: x.height + 1 }} />); })()}
          </div>
        ) : status === 'loading' ? (
          <div aria-hidden className="absolute inset-0 motion-safe:animate-pulse" style={{ backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${RH - 1}px, var(--border) ${RH - 1}px ${RH}px)` }} />
        ) : (
          <div className="grid h-full place-content-center justify-items-center gap-1 p-6 text-center">
            <p className="font-semibold text-[var(--text-strong)]">Aucune inscription pour l’instant</p>
            <p className="text-sm text-[var(--text-muted)]">Collez une liste depuis un tableur (⌘ V) ou importez un fichier CSV.</p>
          </div>
        )}
      </div>

      <footer className="flex min-h-10 flex-col items-start gap-1 border-t border-[var(--border)] bg-[var(--raised)] px-4 py-3 text-xs md:flex-row md:items-center md:justify-between md:gap-4 md:px-6 md:py-2">
        <p aria-live="polite" className={`min-w-0 truncate ${msg.err ? 'text-[var(--down)]' : 'text-[var(--text-muted)]'}`}>{status === 'loading' ? 'Chargement des inscriptions…' : msg.t || hint}</p>
        {status === 'ready' && <p className="flex flex-none flex-wrap gap-3 text-[var(--text-muted)] md:gap-4">{aggr
          ? <>{aggr.sum && <span>Somme <b className="font-semibold text-[var(--text-strong)]">{aggr.sum}</b></span>}{aggr.avg && <span>Moyenne <b className="font-semibold text-[var(--text-strong)]">{aggr.avg}</b></span>}<span>Nombre <b className="font-semibold text-[var(--text-strong)]">{nf.format(aggr.cnt)}</b></span></>
          : <><span><b className="font-semibold text-[var(--text-strong)]">{nf.format(rows.length)}</b> inscriptions</span><span>Recettes <b className="font-semibold text-[var(--text-strong)]">{eur.format(revenue)}</b></span></>}</p>}
      </footer>
      <p className="sr-only" aria-live="assertive">{live}</p>
      <style>{'@keyframes sh-ants{to{stroke-dashoffset:-9}}'}</style>
    </section>
  );
}
