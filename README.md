# Socle

La bibliothèque de design de Moha : composants, animations, sections de page, templates et marques. Chaque design a un aperçu live, des props réglables et son code à copier en **HTML + CSS** et **React + Tailwind**.

- Site 100 % statique : HTML, CSS et JavaScript en modules ES, **aucune étape de build**.
- Routeur par hash (`#/…`) et chemins relatifs : fonctionne servi sous un sous-chemin (`/socle/`).
- Design system Studio : Geist et Geist Mono, neutres à 90 %, accent Terracotta, grille de 8 px, clair et sombre AA.

## Pages

| Route | Contenu |
| --- | --- |
| `#/` | Accueil : derniers ajouts, index des six sections, marques |
| `#/c/<categorie>` | Catégorie : filtres par tags, tri, grille d’aperçus live, état « Bientôt » |
| `#/i/<id>` | Détail : scène d’aperçu (fond, largeur, rejouer, plein écran), props, code, notes |
| `#/c/couleurs`, `#/c/typographie`, `#/c/espacements`, `#/c/icones` | Fondations, lues depuis `css/tokens.css` et `data/palettes.json` |
| `#/marques`, `#/marques/<id>` | Galerie des logos (`data/logos-data.js`), palettes, clair / sombre, copie du SVG |

Recherche : **⌘K** (ou Ctrl K, ou `/`) sur les designs, catégories et marques.

## Structure

```
socle/
├── index.html                 Coquille de l’application
├── manifest.webmanifest       PWA (icônes, standalone)
├── assets/                    Logo, icônes d’app, favicon, polices Geist
├── css/
│   ├── tokens.css             Variables du design system (ne pas modifier à la main)
│   └── app.css                Styles de l’application
├── js/
│   ├── app.js                 Routeur
│   ├── lib/                   Barre, navigation, ⌘K, aperçus, coloration du code
│   └── pages/                 Accueil, catégorie, détail, marques, fondations
├── data/                      Palettes du DS, logos des marques
├── demo-kit/                  Base commune des démos (thème, props, rejouer)
├── registry/
│   ├── categories.js          Arbre sections → catégories
│   ├── index.json             Liste des designs (générée)
│   └── items/<id>/            meta.json, demo.html, code/
└── scripts/
    ├── new-item.mjs           Squelette d’un nouveau design
    ├── build-index.mjs        Régénère registry/index.json
    └── serve.mjs              Serveur local façon GitHub Pages
```

## Ajouter un design

```bash
node scripts/new-item.mjs boutons bouton-icone "Bouton icône"
# … dessiner la démo, compléter meta.json et code/
node scripts/build-index.mjs
```

Le détail est dans [CONTRIBUTING.md](CONTRIBUTING.md).

## En local

```bash
node scripts/serve.mjs        # http://localhost:4000/socle/
```

Le serveur imite GitHub Pages : site sous `/socle/` et en-tête `Access-Control-Allow-Origin: *`. Les démos tournent dans une iframe `sandbox="allow-scripts"` (origine isolée) ; cet en-tête leur permet de charger les polices et leur fichier de code. Node 18 ou plus, aucune dépendance.

## Déploiement sur GitHub Pages

1. Créer le dépôt `socle` et pousser la branche `main`.
2. *Settings → Pages* : source « Deploy from a branch », branche `main`, dossier `/ (root)`.
3. Le site est publié sur `https://<compte>.github.io/socle/`.

Le fichier `.nojekyll` désactive Jekyll pour que tous les dossiers soient servis tels quels. Penser à lancer `node scripts/build-index.mjs` avant chaque commit qui ajoute ou modifie un design.
