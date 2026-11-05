/* Petits outils DOM partagés. */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* Typographie française : espace fine insécable avant ; : ! ? et dans « ». */
export function fr(s = '') {
  return esc(s)
    .replace(/ ([;:!?])/g, '\u202F$1')
    .replace(/« /g, '«\u202F')
    .replace(/ »/g, '\u202F»');
}

export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function plural(n, one, many) {
  return `${n}\u00A0${n > 1 ? many : one}`;
}

let toastTimer;
export function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 1800);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    ta.remove();
    return ok;
  }
}

/* Bouton « Copier » : change de libellé pendant 1,6 s. */
export function bindCopy(btn, getText, { doneLabel = 'Copié', toastMsg = '' } = {}) {
  btn.addEventListener('click', async () => {
    const ok = await copyText(typeof getText === 'function' ? getText() : getText);
    const lbl = btn.querySelector('[data-lbl]');
    const prev = lbl ? lbl.textContent : null;
    if (ok) {
      btn.dataset.done = 'true';
      if (lbl) lbl.textContent = doneLabel;
      if (toastMsg) toast(toastMsg);
      setTimeout(() => { btn.dataset.done = 'false'; if (lbl) lbl.textContent = prev; }, 1600);
    } else {
      toast('Copie impossible');
    }
  });
}

/* Piège à focus simple pour tiroirs et dialogues. */
export function trapFocus(container, e) {
  if (e.key !== 'Tab') return;
  const f = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', container).filter((el) => el.offsetParent !== null);
  if (!f.length) return;
  const first = f[0];
  const last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
