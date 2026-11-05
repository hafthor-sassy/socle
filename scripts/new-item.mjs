#!/usr/bin/env node
// Crée le squelette d'un design : node scripts/new-item.mjs <categorie> <id> ["Nom affiché"]
import { mkdir, writeFile, access } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [cat, id, nomArg] = process.argv.slice(2);
const { CATEGORIES } = await import(pathToFileURL(path.join(root, 'registry', 'categories.js')).href);

if (!cat || !id) {
  console.error('Usage : node scripts/new-item.mjs <categorie> <id> ["Nom affiché"]');
  console.error('Catégories : ' + CATEGORIES.filter((c) => !c.page).map((c) => c.id).join(', '));
  process.exit(1);
}
const category = CATEGORIES.find((c) => c.id === cat);
if (!category || category.page) {
  console.error(`Catégorie inconnue ou réservée : « ${cat} ».`);
  process.exit(1);
}
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
  console.error('L’id doit être en minuscules, chiffres et tirets (ex. carte-produit).');
  process.exit(1);
}
const dir = path.join(root, 'registry', 'items', id);
try { await access(dir); console.error(`Le dossier registry/items/${id} existe déjà.`); process.exit(1); } catch {}

const nom = nomArg || id.split('-').map((w, i) => (i ? w : w[0].toUpperCase() + w.slice(1))).join(' ');
const today = new Date().toISOString().slice(0, 10);
const comp = nom.replace(/[^A-Za-z0-9]+(.)?/g, (m, c) => (c ? c.toUpperCase() : '')).replace(/^./, (c) => c.toUpperCase()) || 'Composant';

const meta = {
  id, nom, categorie: cat,
  description: 'Une phrase qui dit ce que fait ce design et quand l’utiliser.',
  tags: [],
  date: today,
  thumb: { width: 1024 },
  dependances: [{ nom: 'tokens.css', note: 'Variables du design system' }],
  props: [
    { name: 'label', label: 'Libellé', type: 'text', default: nom, code: { html: '<p class="demo-item">{v}</p>' } },
  ],
  code: [
    { id: 'html', label: 'HTML + CSS', file: 'code/index.html', lang: 'html' },
    { id: 'react', label: 'React + Tailwind', file: `code/${comp}.jsx`, lang: 'jsx' },
  ],
  usage: ['Quand l’utiliser, et quand l’éviter.'],
  accessibilite: ['Contraste, clavier, lecteurs d’écran, réduction des animations.'],
};

const html = `<!-- ${nom} — nécessite tokens.css. -->
<link rel="stylesheet" href="tokens.css">

<!-- SECTION -->
<p class="demo-item">${nom}</p>
<!-- /SECTION -->

<style>
  .demo-item { margin: 0; color: var(--text-strong); font: 600 var(--t-section) / 1.3 var(--font-sans); }
</style>
`;

const demo = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${nom} — démo</title>
<link rel="stylesheet" href="../../../css/tokens.css">
<link rel="stylesheet" href="../../../demo-kit/demo.css">
<script src="../../../demo-kit/demo.js"></script>
<style id="component-css"></style>
</head>
<body>
<main class="demo-center" id="mount"></main>
<script>
  // Valeurs par défaut = « default » des props dans meta.json
  var props = Socle.props({ label: ${JSON.stringify(nom)} });
  var src = '';
  function render(p) {
    var mount = document.getElementById('mount');
    mount.innerHTML = src;
    var el = mount.querySelector('.demo-item');
    if (el) el.textContent = p.label;
  }
  // Le CSS et le balisage viennent du fichier de code : la démo et le code restent identiques.
  fetch('code/index.html').then(function (r) { return r.text(); }).then(function (t) {
    var css = t.match(/<style>([\\s\\S]*?)<\\/style>/);
    var mk = t.match(/<!-- SECTION -->([\\s\\S]*?)<!-- \\/SECTION -->/);
    document.getElementById('component-css').textContent = css ? css[1] : '';
    src = mk ? mk[1] : '';
    render(props);
  });
  Socle.onChange(render);
  Socle.onReplay(render);
</script>
</body>
</html>
`;

const react = `// ${nom} — React + Tailwind CSS. Couleurs : variables de tokens.css.
export function ${comp}({ label = ${JSON.stringify(nom)} }) {
  return <p className="m-0 text-[var(--t-section)] font-semibold text-[var(--text-strong)]">{label}</p>;
}
`;

await mkdir(path.join(dir, 'code'), { recursive: true });
await writeFile(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');
await writeFile(path.join(dir, 'demo.html'), demo);
await writeFile(path.join(dir, 'code', 'index.html'), html);
await writeFile(path.join(dir, 'code', `${comp}.jsx`), react);
console.log(`Créé : registry/items/${id}/ (meta.json, demo.html, code/)`);
console.log('Ensuite : complétez meta.json, dessinez la démo, puis lancez node scripts/build-index.mjs');
