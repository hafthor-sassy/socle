# Ajouter un design en 3 étapes

## 1. Créer le squelette

```bash
node scripts/new-item.mjs <categorie> <id> ["Nom affiché"]
# ex. node scripts/new-item.mjs cartes carte-produit "Carte produit"
```

Les identifiants de catégorie sont dans `registry/categories.js` (`boutons`, `pricing`, `texte-anime`…). L’`id` est en minuscules et tirets ; il devient l’URL `#/i/<id>`.

Le script crée :

```
registry/items/<id>/
├── meta.json        Fiche du design
├── demo.html        Aperçu live (chargé dans une iframe)
└── code/
    ├── index.html   Onglet « HTML + CSS »
    └── <Nom>.jsx    Onglet « React + Tailwind »
```

## 2. Dessiner le design

**Le code d’abord.** `code/index.html` est la référence : le balisage entre `<!-- SECTION -->` et `<!-- /SECTION -->`, et le CSS dans `<style>`. La démo du squelette lit ce fichier et l’affiche : démo et code restent identiques sans copie.

**La démo.** `demo.html` charge `demo-kit/demo.js`, qui gère le thème, le fond quadrillé et les props :

```js
var props = Socle.props({ duree: 600, actif: true });  // mêmes valeurs par défaut que meta.json
Socle.onChange(render);   // appelé à chaque réglage dans le panneau Props
Socle.onReplay(render);   // bouton « Rejouer »
if (Socle.thumb) { /* vignette : version compacte */ }
```

**La fiche.** Dans `meta.json` :

| Champ | Rôle |
| --- | --- |
| `nom`, `description`, `tags`, `date` | Affichage, recherche, filtres, tri « récent » |
| `thumb.width` | Largeur de rendu de la vignette (elle est réduite à la carte) |
| `stage.desktopMin` | Largeur minimale du mode Bureau (1280 pour une section de page) |
| `dependances` | `[{ "nom": "tokens.css", "note": "…" }]` |
| `props` | Contrôles générés : `number` (min, max, step, unit), `boolean`, `select` (options), `text` |
| `props[].code` | Motif qui met le code à jour en direct : `{ "html": "--duree: {v}ms", "react": "duree={{v}}" }` (une chaîne ou une liste) |
| `code` | Onglets : `{ "id", "label", "file", "lang" }` (`html`, `css`, `js`, `jsx`) |
| `usage`, `accessibilite` | Notes affichées sous le code |

Règles du design system à respecter : couleurs uniquement par variables de `tokens.css`, grille de 8 px, rayons 8 / 12 / 16 / 999, accent rare, contraste AA en clair et en sombre, cibles de 44 px et champs de 16 px sur mobile, aucune ombre ni bordure colorée sur une carte, pas de dégradé ni d’emoji, animations coupées avec `prefers-reduced-motion`.

## 3. Publier

```bash
node scripts/build-index.mjs   # vérifie les fiches et régénère registry/index.json
node scripts/serve.mjs         # contrôle sur http://localhost:4000/socle/
git add registry && git commit -m "Ajout : <nom>" && git push
```

Le compteur de la catégorie, la recherche ⌘K et « Derniers ajouts » se mettent à jour seuls.

## Ajouter une catégorie

Ajoutez un objet dans la bonne section de `registry/categories.js` : `id`, `nom`, `description` d’une ligne et `icon` (contenu SVG 24 × 24, trait 1,5 px, `fill="none"`). Elle apparaît dans la navigation, l’accueil et la recherche, avec l’état « Bientôt » tant qu’elle est vide.
