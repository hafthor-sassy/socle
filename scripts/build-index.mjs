#!/usr/bin/env node
// Génère registry/index.json à partir des dossiers registry/items/<id>/meta.json.
// Usage : node scripts/build-index.mjs
import { readdir, readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const itemsDir = path.join(root, 'registry', 'items');
const { CATEGORIES } = await import(pathToFileURL(path.join(root, 'registry', 'categories.js')).href);
const catIds = new Set(CATEGORIES.map((c) => c.id));

const errors = [];
const items = [];
const dirs = (await readdir(itemsDir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort();

for (const dir of dirs) {
  const base = path.join(itemsDir, dir);
  let meta;
  try {
    meta = JSON.parse(await readFile(path.join(base, 'meta.json'), 'utf8'));
  } catch (e) {
    errors.push(`${dir} : meta.json illisible (${e.message})`);
    continue;
  }
  if (meta.id !== dir) errors.push(`${dir} : « id » doit valoir « ${dir} » (trouvé « ${meta.id} »)`);
  if (!catIds.has(meta.categorie)) errors.push(`${dir} : catégorie inconnue « ${meta.categorie} »`);
  for (const k of ['nom', 'description', 'date']) if (!meta[k]) errors.push(`${dir} : champ « ${k} » manquant`);
  try { await access(path.join(base, 'demo.html')); } catch { errors.push(`${dir} : demo.html manquant`); }
  for (const c of meta.code || []) {
    try { await access(path.join(base, c.file)); } catch { errors.push(`${dir} : fichier de code introuvable ${c.file}`); }
  }
  items.push({
    id: meta.id,
    nom: meta.nom,
    categorie: meta.categorie,
    description: meta.description,
    tags: meta.tags || [],
    date: meta.date,
    ...(meta.thumb ? { thumb: meta.thumb } : {}),
    ...(meta.ordre != null ? { ordre: meta.ordre } : {}),
  });
}

if (errors.length) {
  console.error('Index non généré :\n- ' + errors.join('\n- '));
  process.exit(1);
}

items.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (a.ordre ?? 50) - (b.ordre ?? 50) || a.nom.localeCompare(b.nom, 'fr'));
const out = { version: 1, total: items.length, items };
await writeFile(path.join(root, 'registry', 'index.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`registry/index.json : ${items.length} design${items.length > 1 ? 's' : ''}.`);
