/* Données : index du registre, métadonnées d'items, réglages globaux. */
import { CATEGORIES } from '../../registry/categories.js';

let indexPromise = null;
const metaCache = new Map();
const codeCache = new Map();

export function loadIndex() {
  if (!indexPromise) {
    indexPromise = fetch('registry/index.json', { cache: 'no-cache' })
      .then((r) => { if (!r.ok) throw new Error('index'); return r.json(); })
      .then((data) => {
        const items = (data.items || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.nom.localeCompare(b.nom, 'fr'));
        return { ...data, items };
      })
      .catch(() => ({ items: [] }));
  }
  return indexPromise;
}

export async function countsByCategory() {
  const { items } = await loadIndex();
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, 0]));
  items.forEach((it) => { if (it.categorie in counts) counts[it.categorie] += 1; });
  // Pages spéciales : compter ce qu'elles présentent
  counts.marques = 0;
  if (window.LOGOS) {
    counts.logos = Object.values(window.LOGOS).reduce((n, b) => n + (b.items || []).length, 0);
  }
  return counts;
}

export function itemPath(id) {
  return `registry/items/${encodeURIComponent(id)}/`;
}

export async function loadMeta(id) {
  if (metaCache.has(id)) return metaCache.get(id);
  const p = fetch(itemPath(id) + 'meta.json', { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error('meta'); return r.json(); });
  metaCache.set(id, p);
  try { return await p; } catch (e) { metaCache.delete(id); throw e; }
}

export async function loadCode(id, file) {
  const key = id + '/' + file;
  if (codeCache.has(key)) return codeCache.get(key);
  const p = fetch(itemPath(id) + file, { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error('code'); return r.text(); });
  codeCache.set(key, p);
  return p;
}

/* Thème global */
export function currentTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function setTheme(t, persist = true) {
  document.documentElement.classList.toggle('dark', t === 'dark');
  if (persist) { try { localStorage.setItem('socle-theme', t); } catch (e) {} }
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', t === 'dark' ? '#0D0E10' : '#EFEFF2'));
  window.dispatchEvent(new CustomEvent('socle:theme', { detail: t }));
}

export function hasStoredTheme() {
  try { return !!localStorage.getItem('socle-theme'); } catch (e) { return false; }
}
