/*
  Coloration syntaxique légère, sans dépendance.
  Langages : html, css, js, jsx (et ts/tsx traités comme js).
  Renvoie du HTML découpé en lignes (<span class="ln" data-n="1">…</span>).
*/
import { esc } from './dom.js';

const span = (cls, s) => `<span class="tk-${cls}">${esc(s)}</span>`;

const JS_KW = new Set('import export from default const let var function return if else for while do switch case break continue new class extends super this typeof instanceof in of try catch finally throw async await yield null undefined true false void delete static get set as type interface'.split(' '));

function hlJS(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const rest = src.slice(i);
    let m;
    if (rest.startsWith('//')) { const e = src.indexOf('\n', i); const j = e === -1 ? n : e; out += span('c', src.slice(i, j)); i = j; continue; }
    if (rest.startsWith('/*')) { const e = src.indexOf('*/', i + 2); const j = e === -1 ? n : e + 2; out += span('c', src.slice(i, j)); i = j; continue; }
    if (rest.startsWith('{/*')) { const e = src.indexOf('*/}', i); const j = e === -1 ? n : e + 3; out += span('c', src.slice(i, j)); i = j; continue; }
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < n && src[j] !== c) { if (src[j] === '\\') j++; if (c !== '`' && src[j] === '\n') break; j++; }
      out += span('s', src.slice(i, j + 1)); i = j + 1; continue;
    }
    if ((m = /^<\/?([A-Za-z][\w.]*)/.exec(rest)) && /[\s(=>{,;:?&|]|^$/.test(src[i - 1] || '')) {
      out += esc(m[0].slice(0, m[0].indexOf(m[1]))) + span('t', m[1]); i += m[0].length;
      // attributs JSX jusqu'au '>' de fermeture de balise
      let depth = 0;
      while (i < n) {
        const r = src.slice(i);
        if (depth === 0 && (r.startsWith('/>') || r[0] === '>')) { const t = r.startsWith('/>') ? '/>' : '>'; out += esc(t); i += t.length; break; }
        if (r[0] === '{') { depth++; out += '{'; i++; continue; }
        if (r[0] === '}') { depth--; out += '}'; i++; continue; }
        if (depth === 0 && (m = /^[A-Za-z_:][\w:-]*/.exec(r))) { out += span('a', m[0]); i += m[0].length; continue; }
        if (r[0] === '"' || r[0] === "'" || r[0] === '`') {
          const q = r[0]; let j = i + 1; while (j < n && src[j] !== q) { if (src[j] === '\\') j++; j++; }
          out += span('s', src.slice(i, j + 1)); i = j + 1; continue;
        }
        if (depth > 0 && (m = /^[A-Za-z_$][\w$]*/.exec(r))) { out += JS_KW.has(m[0]) ? span('k', m[0]) : esc(m[0]); i += m[0].length; continue; }
        if (depth > 0 && (m = /^\d+(\.\d+)?/.exec(r))) { out += span('n', m[0]); i += m[0].length; continue; }
        out += esc(r[0]); i++;
      }
      continue;
    }
    if ((m = /^\d+(\.\d+)?(e-?\d+)?/.exec(rest)) && !/[\w$]/.test(src[i - 1] || '')) { out += span('n', m[0]); i += m[0].length; continue; }
    if ((m = /^[A-Za-z_$][\w$]*/.exec(rest))) {
      const w = m[0];
      if (JS_KW.has(w)) out += span('k', w);
      else if (src[i + w.length] === '(') out += span('f', w);
      else out += esc(w);
      i += w.length; continue;
    }
    out += esc(c); i++;
  }
  return out;
}

function hlCSS(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  let inBlock = 0;
  while (i < n) {
    const rest = src.slice(i);
    let m;
    if (rest.startsWith('/*')) { const e = src.indexOf('*/', i + 2); const j = e === -1 ? n : e + 2; out += span('c', src.slice(i, j)); i = j; continue; }
    if (rest[0] === '"' || rest[0] === "'") { const q = rest[0]; let j = i + 1; while (j < n && src[j] !== q) j++; out += span('s', src.slice(i, j + 1)); i = j + 1; continue; }
    if (rest[0] === '{') { inBlock++; out += '{'; i++; continue; }
    if (rest[0] === '}') { inBlock = Math.max(0, inBlock - 1); out += '}'; i++; continue; }
    if (rest[0] === '@' && (m = /^@[\w-]+/.exec(rest))) { out += span('k', m[0]); i += m[0].length; continue; }
    if (inBlock && (m = /^(--[\w-]+|[a-z-]+)(\s*:)/.exec(rest)) && /[{;\s]/.test(src[i - 1] || ' ')) {
      // propriété (en se méfiant des sélecteurs imbriqués du type a:hover)
      const after = src.slice(i + m[0].length).split(/[;{}]/)[0];
      if (!/\{/.test(src.slice(i, i + m[0].length + after.length + 1))) { out += span('p', m[1]) + esc(m[2]); i += m[0].length; continue; }
    }
    if ((m = /^#[0-9a-fA-F]{3,8}\b/.exec(rest))) { out += span('n', m[0]); i += m[0].length; continue; }
    if ((m = /^-?\d*\.?\d+(px|rem|em|ms|s|%|vh|vw|dvh|deg|fr|ch)?/.exec(rest)) && !/[\w-]/.test(src[i - 1] || '')) { out += span('n', m[0]); i += m[0].length; continue; }
    if (!inBlock && (m = /^[.#]?[A-Za-z_][\w-]*/.exec(rest))) { out += span(rest[0] === '.' || rest[0] === '#' ? 'a' : 't', m[0]); i += m[0].length; continue; }
    if ((m = /^[A-Za-z_-][\w-]*(?=\()/.exec(rest))) { out += span('f', m[0]); i += m[0].length; continue; }
    out += esc(rest[0]); i++;
  }
  return out;
}

function hlHTML(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const rest = src.slice(i);
    let m;
    if (rest.startsWith('<!--')) { const e = src.indexOf('-->', i); const j = e === -1 ? n : e + 3; out += span('c', src.slice(i, j)); i = j; continue; }
    if ((m = /^<!doctype[^>]*>/i.exec(rest))) { out += span('c', m[0]); i += m[0].length; continue; }
    if ((m = /^<(\/?)([A-Za-z][\w-]*)/.exec(rest))) {
      const tag = m[2].toLowerCase();
      out += esc('<' + m[1]) + span('t', m[2]); i += m[0].length;
      while (i < n && src[i] !== '>') {
        const r = src.slice(i);
        let a;
        if ((a = /^[A-Za-z_:@][\w:.-]*/.exec(r))) { out += span('a', a[0]); i += a[0].length; continue; }
        if (r[0] === '"' || r[0] === "'") { const q = r[0]; let j = i + 1; while (j < n && src[j] !== q) j++; out += span('s', src.slice(i, j + 1)); i = j + 1; continue; }
        out += esc(r[0]); i++;
      }
      if (i < n) { out += '&gt;'; i++; }
      if (!m[1] && (tag === 'style' || tag === 'script')) {
        const end = src.toLowerCase().indexOf(`</${tag}`, i);
        const j = end === -1 ? n : end;
        out += tag === 'style' ? hlCSS(src.slice(i, j)) : hlJS(src.slice(i, j));
        i = j;
      }
      continue;
    }
    if ((m = /^&[#\w]+;/.exec(rest))) { out += span('n', m[0]); i += m[0].length; continue; }
    out += esc(rest[0]); i++;
  }
  return out;
}

export function highlight(src, lang = 'html') {
  const l = lang.toLowerCase();
  let html;
  try {
    if (l === 'css') html = hlCSS(src);
    else if (['js', 'jsx', 'ts', 'tsx', 'mjs', 'javascript'].includes(l)) html = hlJS(src);
    else html = hlHTML(src);
  } catch (e) {
    html = esc(src);
  }
  return splitLines(html);
}

/* Découpe en lignes en refermant / rouvrant les <span> ouverts. */
function splitLines(html) {
  const lines = html.split('\n');
  const open = [];
  const res = [];
  lines.forEach((line, idx) => {
    const prefix = open.join('');
    const tags = line.match(/<span class="tk-\w+">|<\/span>/g) || [];
    tags.forEach((t) => { if (t === '</span>') open.pop(); else open.push(t); });
    const suffix = '</span>'.repeat(open.length);
    res.push(`<span class="ln" data-n="${idx + 1}">${prefix}${line}${suffix}</span>`);
  });
  return res.join('');
}
