// TemplateStudioEditorial.jsx — page complète « Studio éditorial » : un composant par section, assemblés dans <TemplateStudioEditorial />.
// React 18 (react-dom pour flushSync), Tailwind 3.4, tokens.css chargé. Aucune bibliothèque : View Transitions API pour passer
// de l’index à une page projet (couverture et titre partagés, en-tête persistant), rideau en repli, galerie 3D en CSS liée au
// défilement, curseur contextuel à ressort (souris seulement). Les couvertures sont composées avec les variables de tokens.css.
// Marque fictive : Marge (studio de design éditorial et de scénographie).
// Utilisation : <TemplateStudioEditorial intro={true} transition="native" rayon={1} vitesse={1} />
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

export const PROJECTS = [
  {
    "id": "atlas-des-marees",
    "titre": "Atlas des marées",
    "annee": "2026",
    "client": "Éditions du Large",
    "disc": "Livre",
    "v": "marees",
    "t": "accent",
    "court": "Un atlas de 312 pages qui lit la côte atlantique au rythme de ses marées.",
    "texte": [
      "Trois ans de relevés, quarante cartes redessinées et un calendrier des coefficients qui court sur tout le livre : chaque double page suit l’heure de la pleine mer.",
      "Nous avons dessiné une grille à deux vitesses, serrée pour les tableaux, ample pour les cartes, et choisi un papier assez fin pour que la marée suivante transparaisse."
    ],
    "faits": [
      [
        "Format",
        "24 × 32 cm, 312 pages"
      ],
      [
        "Tirage",
        "4 000 exemplaires"
      ],
      [
        "Prix",
        "Prix du beau livre 2026"
      ]
    ]
  },
  {
    "id": "le-bruit-des-villes",
    "titre": "Le bruit des villes",
    "annee": "2025",
    "client": "Musée des Docks",
    "disc": "Exposition",
    "v": "ondes",
    "t": "ink",
    "court": "Une exposition sonore de 900 m² où chaque salle a sa propre fréquence.",
    "texte": [
      "Le parcours se lit à l’oreille : douze salles, douze enregistrements de villes, et une signalétique qui donne la mesure du bruit avant d’entrer.",
      "Les cartels ont été composés comme des partitions ; le catalogue reprend leurs portées et les décibels relevés le jour du vernissage."
    ],
    "faits": [
      [
        "Surface",
        "900 m², 12 salles"
      ],
      [
        "Visiteurs",
        "84 000 en cinq mois"
      ],
      [
        "Durée",
        "Mars à juillet 2025"
      ]
    ]
  },
  {
    "id": "halle-saint-roch",
    "titre": "Halle Saint-Roch",
    "annee": "2025",
    "client": "Ville de Montpellier",
    "disc": "Signalétique",
    "v": "fleches",
    "t": "subtle",
    "court": "La signalétique d’une halle de 1932 rouverte au public, lisible à quarante mètres.",
    "texte": [
      "Une famille de 64 panneaux émaillés, une typographie ouverte dessinée pour la lecture de loin et un code couleur par allée, repris au sol.",
      "Tout est démontable : les panneaux s’accrochent à la charpente d’origine sans un seul perçage."
    ],
    "faits": [
      [
        "Éléments",
        "64 panneaux émaillés"
      ],
      [
        "Lisibilité",
        "40 m pour les directions"
      ],
      [
        "Livraison",
        "Septembre 2025"
      ]
    ]
  },
  {
    "id": "herbier-du-jardin",
    "titre": "Herbier du jardin",
    "annee": "2024",
    "client": "Jardin botanique de Nantes",
    "disc": "Catalogue",
    "v": "herbier",
    "t": "raised",
    "court": "Le catalogue raisonné de 1 200 planches d’herbier, numérisées puis remises en page.",
    "texte": [
      "Chaque planche garde sa taille réelle à la double page ; les notices, en marge, suivent la main des botanistes du XIXᵉ siècle.",
      "Un index par couleur de fleur, imaginé avec les jardiniers, ouvre le livre à ceux qui ne connaissent pas les noms latins."
    ],
    "faits": [
      [
        "Planches",
        "1 200 numérisées"
      ],
      [
        "Pages",
        "448"
      ],
      [
        "Index",
        "Par couleur et par saison"
      ]
    ]
  },
  {
    "id": "revue-pli",
    "titre": "Revue Pli, n° 12",
    "annee": "2024",
    "client": "Pli, revue d’architecture",
    "disc": "Revue",
    "v": "numero",
    "t": "surface",
    "court": "La nouvelle formule d’une revue d’architecture : un pli, un sujet, un numéro.",
    "texte": [
      "La couverture se déplie en affiche ; le sommaire tient sur la tranche. Chaque numéro choisit une couleur, et une seule.",
      "Nous avons gardé le papier non couché de la première formule, rendu la grille plus libre et ouvert les marges aux annotations des auteurs."
    ],
    "faits": [
      [
        "Rythme",
        "Deux numéros par an"
      ],
      [
        "Format",
        "21 × 28 cm, dépliant 56 × 84 cm"
      ],
      [
        "Abonnés",
        "+ 38 % en un an"
      ]
    ]
  },
  {
    "id": "lumiere-froide",
    "titre": "Lumière froide",
    "annee": "2023",
    "client": "Centre photographique d’Arles",
    "disc": "Exposition",
    "v": "blocs",
    "t": "accent",
    "court": "Une exposition de photographie nordique, accrochée à hauteur d’enfant.",
    "texte": [
      "Les tirages descendent à 1,10 m du sol ; les textes, eux, restent à hauteur d’adulte. Deux lectures pour une même salle.",
      "Le livret de visite tient dans une poche et se déplie en plan."
    ],
    "faits": [
      [
        "Tirages",
        "86 photographies"
      ],
      [
        "Hauteur",
        "1,10 m au centre"
      ],
      [
        "Lieu",
        "Arles, été 2023"
      ]
    ]
  },
  {
    "id": "lettres-du-metro",
    "titre": "Lettres du métro",
    "annee": "2023",
    "client": "Éditions Ligne",
    "disc": "Livre",
    "v": "lettres",
    "t": "ink",
    "court": "L’histoire des lettres peintes du métro, de 1900 à nos jours, en 140 relevés.",
    "texte": [
      "Chaque lettre a été relevée sur place, au calque, puis vectorisée. Le livre les montre à l’échelle, avec la station et l’année de leur pose.",
      "Une jaquette en calque reprend le plan du réseau ; elle se superpose aux pages de garde."
    ],
    "faits": [
      [
        "Relevés",
        "140 stations"
      ],
      [
        "Pages",
        "256"
      ],
      [
        "Jaquette",
        "Calque imprimé"
      ]
    ]
  },
  {
    "id": "ateliers-ouverts",
    "titre": "Ateliers ouverts",
    "annee": "2022",
    "client": "Collectif Friche 42",
    "disc": "Identité",
    "v": "etoile",
    "t": "subtle",
    "court": "L’identité d’un week-end d’ateliers d’artistes ouverts dans une ancienne usine.",
    "texte": [
      "Un signe simple, une étoile à huit branches, que chaque artiste a redessinée à sa manière : 120 variantes pour 120 ateliers.",
      "Les affiches, le plan et les badges partagent la même grille, imprimée en une couleur sur papier recyclé."
    ],
    "faits": [
      [
        "Ateliers",
        "120 ouverts"
      ],
      [
        "Variantes",
        "120 étoiles"
      ],
      [
        "Public",
        "9 500 visiteurs"
      ]
    ]
  }
];
const LETTERS = ["M8 70V-1H25.52L45.14 54L64.7 -1H82.22V70H69.22V21L51.32 69.88H38.86L21 21V70Z", "M108.16 71.2Q99.84 71.2 94.73 67.36Q89.62 63.52 89.62 56.64Q89.62 49.68 93.92 45.8Q98.22 41.92 106.96 40.2L124.72 36.74Q124.72 31.04 122.11 28.18Q119.5 25.32 114.44 25.32Q109.78 25.32 107.12 27.45Q104.46 29.58 103.54 33.62L90.52 32.96Q92.06 24.54 98.27 19.97Q104.48 15.4 114.44 15.4Q125.84 15.4 131.68 21.13Q137.52 26.86 137.52 37.56V57.02Q137.52 59.14 138.25 59.91Q138.98 60.68 140.48 60.68H142.18V70Q141.58 70.18 140.24 70.31Q138.9 70.44 137.54 70.44Q134.22 70.44 131.63 69.35Q129.04 68.26 127.6 65.65Q126.16 63.04 126.16 58.44L127.32 59.2Q126.46 62.72 123.84 65.45Q121.22 68.18 117.2 69.69Q113.18 71.2 108.16 71.2ZM110.8 61.88Q115.06 61.88 118.17 60.21Q121.28 58.54 123 55.51Q124.72 52.48 124.72 48.44V45.44L110.88 48.24Q106.64 49.08 104.75 50.85Q102.86 52.62 102.86 55.44Q102.86 58.5 104.93 60.19Q107 61.88 110.8 61.88Z", "M146.24 70V16.6H158.2L158.68 31.44L157.64 31.18Q158.84 23.5 162.17 20.05Q165.5 16.6 171.26 16.6H176.22V27.56H171.24Q167.12 27.56 164.43 28.77Q161.74 29.98 160.39 32.53Q159.04 35.08 159.04 39.24V70Z", "M205.38 86.2Q198.36 86.2 193.38 84.3Q188.4 82.4 185.34 78.96Q182.28 75.52 181.1 71.04L194.3 70.12Q195.26 73.1 197.75 74.81Q200.24 76.52 205.38 76.52Q211.34 76.52 214.53 73.86Q217.72 71.2 217.72 65.56V58.84Q215.82 62.72 211.62 65.06Q207.42 67.4 202.22 67.4Q195.6 67.4 190.45 64.14Q185.3 60.88 182.41 55.04Q179.52 49.2 179.52 41.46Q179.52 33.78 182.38 27.93Q185.24 22.08 190.33 18.74Q195.42 15.4 201.98 15.4Q207.78 15.4 211.97 18Q216.16 20.6 218.12 24.92V16.6H230.6V65.28Q230.6 72.12 227.46 76.79Q224.32 81.46 218.66 83.83Q213 86.2 205.38 86.2ZM205.22 57.36Q210.94 57.36 214.34 53.11Q217.74 48.86 217.8 41.38Q217.86 36.4 216.33 32.83Q214.8 29.26 211.95 27.33Q209.1 25.4 205.22 25.4Q199.3 25.4 196.03 29.73Q192.76 34.06 192.76 41.38Q192.76 48.74 196.13 53.05Q199.5 57.36 205.22 57.36Z", "M263.16 71.2Q255.18 71.2 249.31 67.76Q243.44 64.32 240.23 58.03Q237.02 51.74 237.02 43.3Q237.02 34.86 240.23 28.62Q243.44 22.38 249.25 18.89Q255.06 15.4 262.92 15.4Q270.54 15.4 276.26 18.81Q281.98 22.22 285.11 28.62Q288.24 35.02 288.24 44V46.86H250.3Q250.68 53.92 254.13 57.44Q257.58 60.96 263.32 60.96Q267.6 60.96 270.43 59.05Q273.26 57.14 274.4 53.62L287.48 54.44Q285.34 62.18 278.87 66.69Q272.4 71.2 263.16 71.2ZM250.3 38.26H274.96Q274.56 31.76 271.29 28.62Q268.02 25.48 262.92 25.48Q257.78 25.48 254.43 28.77Q251.08 32.06 250.3 38.26Z"];
const N = PROJECTS.length, STEP = 360 / N;
const ring = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-[3px]';
const reducedNow = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const pad = (n) => String(n).padStart(2, '0');

/* Styles que Tailwind n’exprime pas : compositions des couvertures (unités cqw), pseudo-éléments des View Transitions. */
const CSS = `
.mgr-cv{--bgc:var(--accent);--fgc:var(--accent-fg);position:relative;display:block;container-type:inline-size;aspect-ratio:3/4;width:100%;overflow:hidden;border-radius:4px;background:var(--bgc);color:var(--fgc)}
.mgr-t-accent{--bgc:var(--accent);--fgc:var(--accent-fg)}.mgr-t-ink{--bgc:var(--text-strong);--fgc:var(--bg)}.mgr-t-subtle{--bgc:var(--accent-subtle);--fgc:var(--text-strong)}
.mgr-t-raised{--bgc:var(--raised);--fgc:var(--text-strong)}.mgr-t-surface{--bgc:var(--surface);--fgc:var(--accent);box-shadow:inset 0 0 0 1px var(--border)}
.mgr-cv i,.mgr-cv b{position:absolute;display:block}
.mgr-top{position:absolute;left:7cqw;right:7cqw;top:6cqw;display:flex;justify-content:space-between;font:500 4.4cqw/1 var(--font-mono);letter-spacing:.04em;text-transform:uppercase;opacity:.82}
.mgr-tt{position:absolute;left:7cqw;right:7cqw;bottom:13cqw;font:600 10.5cqw/.98 var(--font-sans);letter-spacing:-.04em;text-wrap:balance}
.mgr-by{position:absolute;left:7cqw;bottom:6cqw;font:500 4.2cqw/1 var(--font-sans);opacity:.82}
::view-transition-group(*){animation-duration:900ms;animation-timing-function:cubic-bezier(.7,0,.2,1)}
::view-transition-old(root){animation:mgr-out 900ms cubic-bezier(.7,0,.2,1) both}::view-transition-new(root){animation:mgr-in 900ms cubic-bezier(.7,0,.2,1) both}
::view-transition-old(mgr-head),::view-transition-new(mgr-head){animation:none}
::view-transition-old(mgr-cover),::view-transition-new(mgr-cover){height:100%;width:100%;object-fit:cover}
@keyframes mgr-out{to{opacity:0;transform:translateY(-40px) scale(.98)}}@keyframes mgr-in{from{opacity:0;transform:translateY(64px)}}
@media (prefers-reduced-motion:reduce){::view-transition-group(*),::view-transition-old(*),::view-transition-new(*){animation:none!important}}`;

/* ——— Couverture composée ——— */
export function Cover({ p, className = '', style }) {
  const c = 'currentColor', a = 'var(--accent)';
  const art = {
    marees: [1, 2, 3, 4].map((k) => <i key={k} style={{ left: '50%', top: '40%', width: `${k * 22}cqw`, aspectRatio: 1, border: `.9cqw solid ${c}`, borderRadius: '50%', translate: '-50% -50%', opacity: 1 - k * 0.18 }} />),
    ondes: Array.from({ length: 9 }, (_, k) => <i key={k} style={{ left: `${10 + k * 9.4}cqw`, top: '18cqw', width: '2.6cqw', height: `${10 + ((k * 37) % 11) * 4.6}cqw`, borderRadius: '2cqw', background: c }} />),
    fleches: Array.from({ length: 6 }, (_, k) => <i key={k} style={{ left: '10cqw', top: `${17 + k * 11}cqw`, width: `${30 + ((k * 23) % 5) * 10}cqw`, height: '6cqw', background: c, opacity: 1 - k * 0.1, clipPath: 'polygon(0 35%,82% 35%,82% 0,100% 50%,82% 100%,82% 65%,0 65%)' }} />),
    herbier: [<i key="1" style={{ left: '50%', top: '16cqw', width: '30cqw', aspectRatio: '1/2', background: a, borderRadius: '100% 0', rotate: '-32deg', translate: '-90% 0' }} />, <i key="2" style={{ left: '50%', top: '10cqw', width: '30cqw', aspectRatio: '1/2', background: a, borderRadius: '100% 0', rotate: '30deg', translate: '-10% 0' }} />,
      <i key="3" style={{ left: '50%', top: '34cqw', width: '22cqw', aspectRatio: '1/2', background: a, borderRadius: '100% 0', rotate: '-4deg', translate: '-50% 0', opacity: 0.7 }} />, <i key="4" style={{ left: '50%', top: '52cqw', width: '.8cqw', height: '40cqw', background: c }} />],
    numero: <b style={{ left: '4cqw', top: '6cqw', font: '600 92cqw/.8 var(--font-sans)', letterSpacing: '-0.08em', color: a }}>12</b>,
    blocs: [[7, 18, 54, 40, 1], [66, 18, 27, 18, 0.6], [66, 40, 27, 18, 0.35]].map(([l, t, w, h, o]) => <i key={l + t} style={{ left: `${l}cqw`, top: `${t}cqw`, width: `${w}cqw`, height: `${h}cqw`, background: c, opacity: o }} />),
    lettres: [<b key="g" style={{ left: '6cqw', top: '12cqw', font: '600 62cqw/.9 var(--font-sans)', letterSpacing: '-0.06em', color: 'var(--accent-vivid)' }}>Aa</b>, <i key="r" style={{ left: '7cqw', right: '7cqw', top: '76cqw', height: '1.4cqw', background: c }} />],
    etoile: [0, 45, 90, 135].map((r) => <i key={r} style={{ left: '50%', top: '42%', width: '64cqw', height: '9cqw', borderRadius: '9cqw', background: a, translate: '-50% -50%', rotate: `${r}deg` }} />),
  }[p.v];
  return (
    <span aria-hidden="true" className={`mgr-cv mgr-t-${p.t} ${className}`} style={style}>
      <span className="absolute inset-0">{art}</span>
      <span className="mgr-top"><span>{p.disc}</span><span>{p.annee}</span></span>
      <span className="mgr-tt">{p.titre}</span><span className="mgr-by">{p.client}</span>
    </span>
  );
}

export function MargeLogo({ className = 'h-[26px] w-auto' }) {
  return <svg viewBox="0 0 305 100" aria-hidden="true" className={className} style={{ '--p': 'var(--accent)', '--lt': 'var(--accent-fg)', '--a': 'var(--accent-subtle)', '--ink': 'var(--text-strong)' }}><g><rect width="100" height="100" rx="28" style={{ fill: 'var(--p, currentColor)' }}/><rect x="24" y="22" width="34" height="56" rx="4" style={{ fill: 'var(--lt, #fff)' }}/><rect x="66" y="22" width="10" height="30" rx="3" style={{ fill: 'var(--a, var(--lt, #fff))' }}/><path d="M31 34H51M31 42H51M31 50H45" fill="none" style={{ stroke: 'var(--p, currentColor)' }} strokeWidth="4" strokeLinecap="round"/></g><path d="M136.48 70V30.24H146.29L157.28 61.04L168.23 30.24H178.04V70H170.76V42.56L160.74 69.93H153.76L143.76 42.56V70ZM193.41 70.67Q188.75 70.67 185.89 68.52Q183.03 66.37 183.03 62.52Q183.03 58.62 185.44 56.45Q187.84 54.28 192.74 53.31L202.68 51.37Q202.68 48.18 201.22 46.58Q199.76 44.98 196.93 44.98Q194.32 44.98 192.83 46.17Q191.34 47.36 190.82 49.63L183.53 49.26Q184.39 44.54 187.87 41.98Q191.35 39.42 196.93 39.42Q203.31 39.42 206.58 42.63Q209.85 45.84 209.85 51.83V62.73Q209.85 63.92 210.26 64.35Q210.67 64.78 211.51 64.78H212.46V70Q212.12 70.1 211.37 70.17Q210.62 70.25 209.86 70.25Q208 70.25 206.55 69.64Q205.1 69.03 204.3 67.56Q203.49 66.1 203.49 63.53L204.14 63.95Q203.66 65.92 202.19 67.45Q200.72 68.98 198.47 69.83Q196.22 70.67 193.41 70.67ZM194.89 65.45Q197.27 65.45 199.02 64.52Q200.76 63.58 201.72 61.89Q202.68 60.19 202.68 57.93V56.25L194.93 57.81Q192.56 58.28 191.5 59.28Q190.44 60.27 190.44 61.85Q190.44 63.56 191.6 64.51Q192.76 65.45 194.89 65.45ZM215.57 70V40.1H222.27L222.54 48.41L221.96 48.26Q222.63 43.96 224.5 42.03Q226.36 40.1 229.59 40.1H232.36V46.23H229.57Q227.27 46.23 225.76 46.91Q224.25 47.59 223.5 49.02Q222.74 50.44 222.74 52.77V70ZM249.53 79.07Q245.6 79.07 242.81 78.01Q240.02 76.94 238.31 75.02Q236.6 73.09 235.94 70.58L243.33 70.07Q243.87 71.74 245.26 72.69Q246.65 73.65 249.53 73.65Q252.87 73.65 254.66 72.16Q256.44 70.67 256.44 67.51V63.75Q255.38 65.92 253.03 67.23Q250.68 68.54 247.76 68.54Q244.06 68.54 241.17 66.72Q238.29 64.89 236.67 61.62Q235.05 58.35 235.05 54.02Q235.05 49.72 236.65 46.44Q238.25 43.16 241.1 41.29Q243.96 39.42 247.63 39.42Q250.88 39.42 253.22 40.88Q255.57 42.34 256.67 44.76V40.1H263.66V67.36Q263.66 71.19 261.9 73.8Q260.14 76.42 256.97 77.74Q253.8 79.07 249.53 79.07ZM249.44 62.92Q252.65 62.92 254.55 60.54Q256.45 58.16 256.49 53.97Q256.52 51.18 255.66 49.18Q254.81 47.19 253.21 46.1Q251.62 45.02 249.44 45.02Q246.13 45.02 244.3 47.45Q242.47 49.87 242.47 53.97Q242.47 58.09 244.35 60.51Q246.24 62.92 249.44 62.92ZM282.73 70.67Q278.26 70.67 274.97 68.75Q271.69 66.82 269.89 63.3Q268.09 59.77 268.09 55.05Q268.09 50.32 269.89 46.83Q271.69 43.33 274.94 41.38Q278.19 39.42 282.6 39.42Q286.86 39.42 290.07 41.33Q293.27 43.24 295.02 46.83Q296.77 50.41 296.77 55.44V57.04H275.53Q275.74 61 277.67 62.97Q279.6 64.94 282.82 64.94Q285.22 64.94 286.8 63.87Q288.39 62.8 289.02 60.83L296.35 61.29Q295.15 65.62 291.53 68.15Q287.9 70.67 282.73 70.67ZM275.53 52.23H289.34Q289.11 48.59 287.28 46.83Q285.45 45.07 282.6 45.07Q279.72 45.07 277.84 46.91Q275.96 48.75 275.53 52.23Z" style={{ fill: 'var(--ink)' }} /></svg>;
}

/* ——— Curseur contextuel : ressort amorti, rôle lu sur data-cursor (voir | lien | aimant), souris seulement ——— */
export function ContextCursor({ zone }) {
  const ringRef = useRef(null), labelRef = useRef(null), [on, setOn] = useState(false), [state, setState] = useState('defaut'), [label, setLabel] = useState('');
  useEffect(() => {
    const z = zone.current, fine = matchMedia('(hover: hover) and (pointer: fine)');
    if (!z || !fine.matches) return;
    const S = { x: -100, y: -100, w: 36, vx: 0, vy: 0, vw: 0 }, T = { x: -100, y: -100, w: 36 }; let raf = 0, last = 0, st = 'defaut';
    const SIZE = { voir: 96, lien: 28, aimant: 56, defaut: 36 };
    const frame = (now) => {
      raf = 0; const dt = Math.min(0.032, last ? (now - last) / 1000 : 0.016); last = now;
      if (reducedNow()) { S.x = T.x; S.y = T.y; S.w = T.w; } else ['x', 'y', 'w'].forEach((k) => { S['v' + k] += ((T[k] - S[k]) * 320 - S['v' + k] * 26) * dt; S[k] += S['v' + k] * dt; });
      const el = ringRef.current; if (el) { el.style.width = el.style.height = S.w + 'px'; el.style.transform = `translate(${S.x - S.w / 2}px, ${S.y - S.w / 2}px)`; }
      if (labelRef.current) labelRef.current.style.transform = `translate(${S.x}px, ${S.y}px)`;
      if (Math.abs(T.x - S.x) + Math.abs(T.y - S.y) + Math.abs(T.w - S.w) > 0.3) raf = requestAnimationFrame(frame); else last = 0;
    };
    const move = (e) => {
      if (e.pointerType !== 'mouse') return;
      setOn(true); const t = e.target.closest?.('[data-cursor]'); const s = t ? t.dataset.cursor : 'defaut';
      if (s !== st) { st = s; setState(s); setLabel(t?.dataset.cursorLabel || (s === 'voir' ? 'Voir' : '')); }
      const off = s === 'lien' ? 18 : 0; T.x = e.clientX + off; T.y = e.clientY + off; T.w = SIZE[s] || 36;
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const leave = () => setOn(false);
    z.addEventListener('pointermove', move, { passive: true }); z.addEventListener('pointerleave', leave);
    return () => { z.removeEventListener('pointermove', move); z.removeEventListener('pointerleave', leave); cancelAnimationFrame(raf); };
  }, [zone]);
  const fill = state === 'voir' ? 'bg-[var(--text-strong)] border-[var(--text-strong)]' : state === 'lien' ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--text-strong)]';
  return (
    <div aria-hidden="true" className={`pointer-events-none fixed left-0 top-0 z-50 transition-opacity duration-200 ${on ? 'opacity-100' : 'opacity-0'}`}>
      <span ref={ringRef} className={`absolute left-0 top-0 rounded-full border-[1.5px] transition-colors duration-200 ${fill}`} />
      <span ref={labelRef} className="absolute left-0 top-0"><span className={`block -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-sm font-semibold text-[var(--bg)] transition-[opacity,scale] duration-300 ${state === 'voir' ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>{label}</span></span>
    </div>
  );
}

/* ——— En-tête persistant ——— */
export function Header({ onHome }) {
  const [time, setTime] = useState('');
  useEffect(() => { let t; const f = () => { try { setTime(new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).format(new Date())); } catch (e) { /* */ } t = setTimeout(f, 60000 - (Date.now() % 60000)); }; f(); return () => clearTimeout(t); }, []);
  return (
    <header className="sticky top-0 z-20 grid h-14 grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_86%,transparent)] px-4 backdrop-blur-md md:h-16 md:grid-cols-[auto_1fr_auto_auto] md:gap-6 md:px-[clamp(16px,3.4vw,48px)]" style={{ viewTransitionName: 'mgr-head' }}>
      <a href="#/" onClick={onHome} data-cursor="lien" aria-label="Marge, accueil" className={`inline-flex min-h-11 items-center rounded-lg ${ring}`}><MargeLogo /></a>
      <nav aria-label="Principale" className="hidden justify-self-center md:flex">{[['#travaux', 'Travaux'], ['#index', 'Index'], ['#studio', 'Studio'], ['#contact', 'Contact']].map(([h, l]) => <a key={h} href={h} data-cursor="lien" className={`group relative inline-flex h-10 items-center px-3 text-[15px] text-[var(--text-muted)] no-underline hover:text-[var(--text-strong)] ${ring}`}>{l}<span className="absolute inset-x-3 bottom-2 h-px origin-right scale-x-0 bg-current transition-transform duration-500 group-hover:origin-left group-hover:scale-x-100" /></a>)}</nav>
      <p className="m-0 hidden gap-2 font-mono text-[13px] text-[var(--text-muted)] tabular-nums md:inline-flex">Marseille<time className="text-[var(--text-strong)]">{time}</time></p>
      <a href="#contact" data-cursor="aimant" className={`col-start-3 inline-flex h-10 items-center justify-self-end rounded-full bg-[var(--accent)] px-[18px] text-sm font-medium text-[var(--accent-fg)] no-underline hover:bg-[var(--accent-hover)] md:col-start-auto ${ring}`}>Écrire au studio</a>
    </header>
  );
}

/* ——— Typographie géante, lettre par lettre ——— */
export function Hero({ delay = 0 }) {
  const [on, setOn] = useState(false);
  useEffect(() => { const id = setTimeout(() => setOn(true), delay); return () => clearTimeout(id); }, [delay]);
  const still = reducedNow();
  const fade = { opacity: on || still ? 1 : 0, transform: on || still ? 'none' : 'translateY(16px)', transition: still ? 'none' : 'opacity 900ms cubic-bezier(.16,1,.3,1) 500ms, transform 900ms cubic-bezier(.16,1,.3,1) 500ms' };
  return (
    <section aria-labelledby="mgr-h1" className="border-b border-[var(--border)] px-4 pb-12 pt-6 md:px-[clamp(16px,3.4vw,48px)] md:pb-[clamp(48px,7vw,112px)] md:pt-[clamp(24px,4vw,56px)]">
      <h1 id="mgr-h1" className="sr-only">Marge, studio de design éditorial et de scénographie</h1>
      <svg viewBox="0 -4 288 100" aria-hidden="true" className="block h-auto w-full overflow-hidden">
        {LETTERS.map((d, i) => <g key={i} style={{ transformBox: 'fill-box', transformOrigin: '50% 100%', transform: on || still ? 'none' : 'translateY(105%)', transition: still ? 'none' : `transform 1200ms cubic-bezier(.16,1,.3,1) ${i * 80}ms` }}><path d={d} fill={i === LETTERS.length - 1 ? 'var(--accent)' : 'var(--text-strong)'} /></g>)}
      </svg>
      <div className="mt-6 grid gap-4 border-t border-[var(--border)] pt-5 md:mt-[clamp(24px,3vw,40px)] md:grid-cols-[1fr_1.4fr_1fr] md:gap-8">
        <p style={fade} className="m-0 font-mono text-[13px] leading-5 text-[var(--text-muted)]">(Studio de design éditorial)</p>
        <p style={fade} className="m-0 max-w-[30ch] text-[clamp(1.25rem,.9rem+1vw,1.75rem)] font-medium leading-tight tracking-[-0.02em] text-[var(--text-strong)]">Nous dessinons des livres qu’on relit, des expositions qu’on traverse deux fois et des signes qu’on suit sans y penser.</p>
        <p style={fade} className="m-0 text-[15px] leading-[22px] md:text-right">Livres · Expositions<br />Signalétique · Identités<br /><span className="text-[var(--text-muted)]">Marseille, depuis 2011</span></p>
      </div>
    </section>
  );
}

/* ——— Galerie 3D : anneau de couvertures, rotation liée au défilement avec un temps d’arrêt par projet ——— */
export function Gallery3D({ rayon = 1, vitesse = 1, onOpen, cardRefs }) {
  const sec = useRef(null), ringEl = useRef(null), [R, setR] = useState(400), [active, setActive] = useState(0), [run, setRun] = useState(2400), [flat, setFlat] = useState(false), state = useRef({ ang: 0, target: 0, raf: 0 });
  const paint = useCallback(() => {
    const s = state.current, el = ringEl.current; if (!el) return;
    el.style.transform = `translate(-50%, -50%) translateZ(${-R}px) rotateX(-4deg) rotateY(${s.ang.toFixed(3)}deg)`;
    [...el.children].forEach((c, i) => { const a = (((i * STEP + s.ang) % 360) + 540) % 360 - 180, cs = Math.cos((a * Math.PI) / 180); c.style.opacity = (0.18 + 0.82 * Math.max(0, cs)).toFixed(3); c.style.visibility = cs < -0.2 ? 'hidden' : 'visible'; const lnk = c.querySelector('a'); if (lnk) lnk.tabIndex = Math.abs(a) < STEP / 2 ? 0 : -1; });
    setActive(((Math.round(-s.ang / STEP) % N) + N) % N);
  }, [R]);
  useLayoutEffect(() => {
    const lay = () => { setFlat(reducedNow()); const w = ringEl.current?.offsetWidth || 300; setR(Math.round((w / 2) / Math.tan(Math.PI / N) * 1.3 * rayon)); setRun(Math.round(innerHeight * (N - 1) * 0.42 / vitesse)); };
    lay(); addEventListener('resize', lay); return () => removeEventListener('resize', lay);
  }, [rayon, vitesse]);
  useEffect(() => {
    if (flat) return;
    const s = state.current;
    const measure = () => { const r = sec.current.getBoundingClientRect(), total = sec.current.offsetHeight - innerHeight, p = Math.max(0, Math.min(1, -r.top / Math.max(1, total))); const f = p * (N - 1), k = Math.floor(f), x = Math.max(0, Math.min(1, (f - k - 0.22) / 0.56)); s.target = -(k + x * x * (3 - 2 * x)) * STEP; sec.current.style.setProperty('--p', p.toFixed(4)); };
    const loop = () => { s.raf = 0; const d = s.target - s.ang; s.ang += d * 0.12; if (Math.abs(d) < 0.02) s.ang = s.target; paint(); if (s.ang !== s.target) s.raf = requestAnimationFrame(loop); };
    const on = () => { measure(); if (!s.raf) s.raf = requestAnimationFrame(loop); };
    measure(); s.ang = s.target; paint(); addEventListener('scroll', on, { passive: true });
    return () => { removeEventListener('scroll', on); cancelAnimationFrame(s.raf); };
  }, [paint, flat, run]);
  const p = PROJECTS[active];
  return (
    <section id="travaux" ref={sec} aria-labelledby="mgr-gal" className="relative scroll-mt-14 border-b border-[var(--border)]" style={{ height: flat ? 'auto' : `calc(100vh + ${run}px)` }}>
      <div className={`${flat ? 'relative' : 'sticky top-14 h-[calc(100svh-56px)] min-h-[480px] md:top-16 md:h-[calc(100vh-64px)] md:min-h-[520px]'} grid grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden`}>
        <div className="flex items-baseline justify-between px-4 pt-6 md:px-[clamp(16px,3.4vw,48px)]"><h2 id="mgr-gal" className="m-0 font-mono text-[13px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)]">Travaux choisis</h2>{!flat && <p aria-hidden="true" className="m-0 font-mono text-[13px] text-[var(--text-muted)]"><b className="text-[var(--text-strong)]">{pad(active + 1)}</b> / {pad(N)}</p>}</div>
        <div className={flat ? 'py-6' : 'relative [perspective:900px] md:[perspective:1700px]'} data-cursor="voir" data-cursor-label="Voir">
          <ul ref={ringEl} className={flat ? 'm-0 grid list-none auto-cols-[min(58vw,260px)] grid-flow-col gap-4 overflow-x-auto px-4 pb-2 [scroll-snap-type:x_mandatory]' : 'absolute left-1/2 top-[47%] m-0 aspect-[3/4] w-[min(58vw,260px)] list-none p-0 [transform-style:preserve-3d] md:w-[clamp(240px,22vw,360px)]'}>
            {PROJECTS.map((x, i) => (
              <li key={x.id} className={flat ? '[scroll-snap-align:start]' : 'absolute inset-0 [backface-visibility:hidden] [transform-style:preserve-3d]'} style={flat ? undefined : { transform: `rotateY(${i * STEP}deg) translateZ(${R}px)` }}>
                <a href={`#/projet/${x.id}`} onClick={(e) => { e.preventDefault(); onOpen(x.id); }} aria-label={`${x.titre}, ${x.disc.toLowerCase()}, ${x.annee}`} className={`block rounded transition-[scale] duration-500 hover:scale-[1.03] ${ring}`}>
                  <Cover p={x} className="shadow-[0_24px_48px_-24px_var(--scrim)]" style={{}} ref={undefined} />
                  <span ref={(el) => (cardRefs.current[x.id] = el)} className="absolute inset-0" />
                </a>
              </li>
            ))}
          </ul>
        </div>
        {!flat && <div aria-hidden="true" className="grid justify-items-center gap-1 px-4 pb-3 text-center"><p key={p.id} className="m-0 text-[clamp(1.5rem,1rem+1.4vw,2.25rem)] font-semibold leading-tight tracking-[-0.03em] text-[var(--text-strong)] motion-safe:animate-[mgr-cap_.5s_cubic-bezier(.16,1,.3,1)]">{p.titre}</p><p className="m-0 text-[15px] text-[var(--text-muted)]">{p.disc} · {p.client} · {p.annee}</p>
          <div className="mt-2 h-0.5 w-full bg-[var(--border)]"><i className="block h-full origin-left bg-[var(--accent)]" style={{ transform: 'scaleX(var(--p, 0))' }} /></div></div>}
      </div>
    </section>
  );
}

/* ——— Index avec aperçu qui suit le curseur ——— */
export function ProjectIndex({ onOpen }) {
  const [peek, setPeek] = useState(null), pos = useRef({ x: 0, y: 0 }), el = useRef(null);
  const move = (e, id) => { if (e.pointerType !== 'mouse') return; pos.current = { x: e.clientX + 24, y: e.clientY - 140 }; if (el.current) el.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`; setPeek(id); };
  return (
    <section id="index" aria-labelledby="mgr-idx" className="relative scroll-mt-14 px-4 py-16 md:px-[clamp(16px,3.4vw,48px)] md:py-[clamp(64px,8vw,128px)]">
      <div className="flex items-baseline justify-between gap-4 border-b border-[var(--border)] pb-6"><h2 id="mgr-idx" className="m-0 text-[clamp(2.5rem,1.2rem+4.4vw,6rem)] font-semibold leading-[.95] tracking-[-0.05em] text-[var(--text-strong)]">Index</h2><p className="m-0 font-mono text-[13px] text-[var(--text-muted)]">{pad(N)} projets, 2022 – 2026</p></div>
      <ol role="list" className="group/list m-0 list-none p-0" onPointerLeave={() => setPeek(null)}>
        {PROJECTS.map((x) => (
          <li key={x.id}><a href={`#/projet/${x.id}`} data-cursor="lien" onClick={(e) => { e.preventDefault(); onOpen(x.id); }} onPointerMove={(e) => move(e, x.id)}
            className={`group grid grid-cols-[52px_minmax(0,1fr)_20px] items-center gap-x-3 gap-y-1 border-b border-[var(--border)] py-4 no-underline transition-[padding] duration-500 md:min-h-[76px] md:grid-cols-[80px_minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1fr)_24px] md:gap-6 md:py-0 md:hover:pl-4 ${ring}`}>
            <span className="row-span-2 self-start pt-1.5 font-mono text-sm text-[var(--text-muted)] tabular-nums md:row-span-1 md:self-center md:pt-0">{x.annee}</span>
            <span className="text-xl font-semibold leading-tight tracking-[-0.03em] text-[var(--text-strong)] group-hover:text-[var(--accent)] md:text-[clamp(1.25rem,.9rem+1vw,1.875rem)]">{x.titre}</span>
            <span className="col-start-2 row-start-2 text-sm text-[var(--text-muted)] md:col-start-auto md:row-start-auto md:text-[15px]">{x.client}</span>
            <span className="hidden text-[15px] text-[var(--text-muted)] md:inline">{x.disc}</span>
            <svg viewBox="0 0 20 20" aria-hidden="true" className="col-start-3 row-span-2 row-start-1 size-5 fill-none stroke-current stroke-[1.5] text-[var(--text-muted)] transition-transform duration-500 group-hover:-rotate-45 group-hover:text-[var(--accent)] md:col-start-auto md:row-span-1 md:row-start-auto"><path d="M4 10h12M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a></li>
        ))}
      </ol>
      <div ref={el} aria-hidden="true" className={`pointer-events-none fixed left-0 top-0 z-[5] hidden w-[200px] transition-opacity duration-300 md:block ${peek ? 'opacity-100' : 'opacity-0'}`}>{peek && <Cover p={PROJECTS.find((x) => x.id === peek)} className="shadow-[var(--shadow-popover)]" />}</div>
    </section>
  );
}

export function Studio() {
  return (
    <section id="studio" aria-labelledby="mgr-st" className="scroll-mt-14 border-t border-[var(--border)] px-4 py-16 md:px-[clamp(16px,3.4vw,48px)] md:py-[clamp(64px,8vw,128px)]">
      <div className="flex items-baseline justify-between gap-4 border-b border-[var(--border)] pb-6"><h2 id="mgr-st" className="m-0 text-[clamp(2.5rem,1.2rem+4.4vw,6rem)] font-semibold leading-[.95] tracking-[-0.05em] text-[var(--text-strong)]">Studio</h2><p className="m-0 font-mono text-[13px] text-[var(--text-muted)]">Marseille et Lyon</p></div>
      <p data-cursor="texte" className="m-0 mt-10 max-w-[24ch] text-[clamp(1.75rem,.9rem+2.8vw,4rem)] font-medium leading-[1.08] tracking-[-0.035em] text-[var(--text-strong)] md:mt-[clamp(40px,5vw,72px)]">Quatorze personnes autour d’une même table : des graphistes, une typographe, deux scénographes, un éditeur. Nous restons petits pour suivre chaque projet jusqu’à l’imprimerie, et jusqu’au jour de l’accrochage.</p>
      <dl className="m-0 mt-12 grid border-t border-[var(--border)] md:mt-[clamp(48px,6vw,96px)] md:grid-cols-3">
        {[['Livres imprimés', '212'], ['Expositions', '38'], ['Prix et sélections', '17']].map(([t, v], i) => (
          <div key={t} className={`flex flex-row-reverse items-baseline justify-between gap-2 border-b border-[var(--border)] py-4 md:flex-col-reverse md:items-start md:justify-start md:border-b-0 md:py-0 md:pr-6 md:pt-6 ${i ? 'md:border-l md:pl-6' : ''}`}><dt className="text-[15px] text-[var(--text-muted)]">{t}</dt><dd className="m-0 text-5xl font-semibold leading-[.9] tracking-[-0.05em] text-[var(--text-strong)] tabular-nums md:text-[clamp(3rem,2rem+3vw,6rem)]">{v}</dd></div>
        ))}
      </dl>
      <div className="mt-12 grid gap-8 md:mt-[clamp(48px,6vw,96px)] md:grid-cols-2">
        {[['Ils nous confient leurs projets', ['Éditions du Large', 'Musée des Docks', 'Ville de Montpellier', 'Jardin botanique de Nantes', 'Centre photographique d’Arles', 'Pli, revue d’architecture']], ['Ce que nous faisons', ['Livres et catalogues', 'Scénographie et graphisme d’exposition', 'Signalétique', 'Identités culturelles', 'Revues et éditions périodiques']]].map(([h, l]) => (
          <div key={h}><h3 className="m-0 mb-4 font-mono text-[13px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)]">{h}</h3><ul role="list" className="m-0 grid list-none p-0">{l.map((x) => <li key={x} className="border-b border-[var(--border)] py-2.5 text-base text-[var(--text-strong)] md:text-[17px]">{x}</li>)}</ul></div>
        ))}
      </div>
    </section>
  );
}

/* ——— Page projet ——— */
export function ProjectPage({ id, onBack, onOpen }) {
  const i = PROJECTS.findIndex((x) => x.id === id), p = PROJECTS[i], nx = PROJECTS[(i + 1) % N], ref = useRef(null);
  useEffect(() => { ref.current?.focus({ preventScroll: true }); }, [id]);
  return (
    <article ref={ref} tabIndex={-1} aria-labelledby="mgr-pt" className="px-4 pt-6 outline-none md:px-[clamp(16px,3.4vw,48px)] md:pt-[clamp(24px,3vw,40px)]">
      <div className="flex items-center justify-between gap-4">
        <a href="#/" data-cursor="lien" onClick={(e) => { e.preventDefault(); onBack(); }} className={`group inline-flex min-h-11 items-center gap-2 text-[15px] font-medium text-[var(--text-strong)] no-underline ${ring}`}><svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 fill-none stroke-current stroke-[1.6] transition-transform duration-500 group-hover:-translate-x-1"><path d="M13 8H3M7 4 3 8l4 4" strokeLinecap="round" strokeLinejoin="round" /></svg>Tous les travaux</a>
        <p className="m-0 font-mono text-[13px] text-[var(--text-muted)]">{pad(i + 1)} / {pad(N)} · {p.disc} · {p.annee}</p>
      </div>
      <h2 id="mgr-pt" className="m-0 mt-6 w-fit max-w-[14ch] text-[clamp(3rem,1.2rem+7vw,9rem)] font-semibold leading-[.92] tracking-[-0.055em] text-[var(--text-strong)] [text-wrap:balance] md:mt-[clamp(24px,4vw,56px)]">{p.titre}</h2>
      <div className="mt-8 grid gap-8 pb-16 md:mt-[clamp(32px,5vw,72px)] md:grid-cols-[5fr_6fr] md:gap-[clamp(32px,5vw,80px)] md:pb-[clamp(64px,8vw,128px)]">
        <figure className="m-0 self-start md:sticky md:top-24" style={{ viewTransitionName: 'mgr-cover' }}><Cover p={p} className="!rounded-md" /></figure>
        <div className="grid content-start gap-8 motion-safe:animate-[mgr-rise_.9s_cubic-bezier(.16,1,.3,1)_.16s_backwards]">
          <p className="m-0 text-[clamp(1.375rem,1rem+1.2vw,2rem)] font-medium leading-tight tracking-[-0.02em] text-[var(--text-strong)]">{p.court}</p>
          <div className="grid max-w-[60ch] gap-4 text-base leading-relaxed md:text-[17px]">{p.texte.map((t) => <p key={t} className="m-0">{t}</p>)}</div>
          <dl className="m-0 grid border-t border-[var(--border)]">{[['Client', p.client], ['Discipline', p.disc], ['Année', p.annee], ...p.faits].map(([k, v]) => <div key={k} className="grid gap-0.5 border-b border-[var(--border)] py-3.5 text-[15px] md:grid-cols-[160px_1fr] md:gap-4"><dt className="text-[var(--text-muted)]">{k}</dt><dd className="m-0 text-[var(--text-strong)]">{v}</dd></div>)}</dl>
        </div>
      </div>
      <a href={`#/projet/${nx.id}`} data-cursor="voir" data-cursor-label="Suivant" onClick={(e) => { e.preventDefault(); onOpen(nx.id, true); }} className={`group grid gap-2 border-t border-[var(--border)] py-10 no-underline md:py-[clamp(40px,6vw,96px)] ${ring}`}>
        <span className="font-mono text-[13px] uppercase tracking-[0.04em] text-[var(--text-muted)]">Projet suivant</span>
        <b className="text-[clamp(2.5rem,1rem+5vw,7rem)] font-semibold leading-[.95] tracking-[-0.05em] text-[var(--text-strong)] transition-[color,padding] duration-500 group-hover:pl-6 group-hover:text-[var(--accent)]">{nx.titre}</b>
      </a>
    </article>
  );
}

export function Contact() {
  return (
    <section id="contact" aria-labelledby="mgr-ct" className="scroll-mt-14 border-t border-[var(--border)] bg-[var(--surface)] px-4 pb-8 pt-16 md:px-[clamp(16px,3.4vw,48px)] md:pt-[clamp(64px,8vw,128px)]">
      <h2 id="mgr-ct" className="m-0 font-mono text-[13px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)]">Un livre, une exposition, un manuscrit ?</h2>
      <a href="mailto:bonjour@marge.studio" data-cursor="voir" data-cursor-label="Écrire" className={`mt-6 block w-fit max-w-full break-words text-[clamp(2rem,.6rem+6.4vw,8.5rem)] font-semibold leading-none tracking-[-0.055em] text-[var(--text-strong)] no-underline hover:text-[var(--accent)] ${ring}`}>bonjour@marge.studio</a>
      <div className="mt-12 grid gap-6 border-t border-[var(--border)] pt-6 text-[15px] leading-6 md:mt-[clamp(48px,6vw,96px)] md:grid-cols-3 md:gap-8">
        <p className="m-0"><b className="mb-2 block font-semibold text-[var(--text-strong)]">Marseille</b>14 rue des Petites-Maries<br />13001 Marseille</p>
        <p className="m-0"><b className="mb-2 block font-semibold text-[var(--text-strong)]">Lyon</b>3 quai Saint-Vincent<br />69001 Lyon</p>
        <p className="m-0"><b className="mb-2 block font-semibold text-[var(--text-strong)]">Suivre</b><a href="#" data-cursor="lien" className="inline-flex min-h-11 items-center underline underline-offset-4 md:min-h-0">Journal du studio</a><br /><a href="#" data-cursor="lien" className="inline-flex min-h-11 items-center underline underline-offset-4 md:min-h-0">Lettre trimestrielle</a></p>
      </div>
      <p className="m-0 mt-12 text-[13px] text-[var(--text-muted)]">© 2026 Marge, studio de design éditorial (marque fictive).</p>
    </section>
  );
}

/* ——— Rideau : six lames d’accent (intro et repli sans View Transitions) ——— */
function useCurtain() {
  const layer = useRef(null), label = useRef(null);
  const run = (dir, T = 900) => { const s = [...layer.current.querySelectorAll('i')], each = T * 0.62, st = (T - each) / (s.length - 1);
    return Promise.all(s.map((el, i) => { el.style.transformOrigin = dir === 'in' ? 'center top' : 'center bottom'; return el.animate(dir === 'in' ? [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }] : [{ transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }], { duration: each, delay: i * st, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' }).finished; })); };
  const show = (on, txt) => { layer.current.style.visibility = on ? 'visible' : 'hidden'; if (txt != null) label.current.textContent = txt; };
  const cover = async (txt, swap) => { show(true, txt); await run('in'); label.current.style.opacity = 1; swap(); await new Promise((r) => setTimeout(r, 260)); label.current.style.opacity = 0; await run('out'); show(false); };
  const intro = async () => { show(true, 'Marge'); layer.current.querySelectorAll('i').forEach((i) => { i.style.transform = 'scaleY(1)'; }); label.current.style.opacity = 1; await new Promise((r) => setTimeout(r, 520)); label.current.style.opacity = 0; await run('out', 1000); show(false); };
  const el = (
    <div ref={layer} aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 grid grid-cols-6" style={{ visibility: 'hidden' }}>
      {[0, 1, 2, 3, 4, 5].map((k) => <i key={k} className="-mr-px block bg-[var(--accent)]" style={{ transform: 'scaleY(0)' }} />)}
      <p ref={label} className="absolute left-1/2 top-1/2 m-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[clamp(2rem,1rem+4vw,5rem)] font-semibold tracking-[-0.05em] text-[var(--accent-fg)] opacity-0 transition-opacity duration-300">Marge</p>
    </div>
  );
  return { el, cover, intro };
}

/* ——— La page : routage par l’adresse (#/projet/<id>), transitions persistantes ——— */
export default function TemplateStudioEditorial({ intro = true, transition = 'native', rayon = 1, vitesse = 1 }) {
  const zone = useRef(null), cardRefs = useRef({}), savedY = useRef(0), busy = useRef(false);
  const [route, setRoute] = useState(() => (typeof location !== 'undefined' && location.hash.match(/^#\/projet\/([\w-]+)/)?.[1]) || null);
  const [heroDelay, setHeroDelay] = useState(intro && !reducedNow() ? 900 : 0);
  const curtain = useCurtain(), [live, setLive] = useState('');
  useEffect(() => { if (intro && !reducedNow()) curtain.intro(); else setHeroDelay(0); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const navigate = useCallback((id, fromNext) => {
    if (busy.current || id === route) return;
    const p = PROJECTS.find((x) => x.id === id), swap = () => {
      if (id) { if (!route) savedY.current = scrollY; flushSync(() => setRoute(id)); scrollTo(0, 0); }
      else { flushSync(() => setRoute(null)); scrollTo(0, savedY.current); }
    };
    const done = () => { busy.current = false; setLive(id ? `${p.titre}, page projet` : 'Index des travaux'); try { history.replaceState(null, '', id ? `#/projet/${id}` : '#/'); } catch (e) { /* bac à sable */ } };
    busy.current = true;
    if (transition === 'aucune' || (reducedNow() && transition !== 'rideau')) { swap(); done(); return; }
    if (transition === 'native' && document.startViewTransition) {
      const card = id && !route && !fromNext ? cardRefs.current[id]?.previousElementSibling : null;
      if (card) card.style.viewTransitionName = 'mgr-cover';
      const t = document.startViewTransition(() => {
        if (card) card.style.viewTransitionName = '';
        swap();
        if (!id && route) { const back = cardRefs.current[route]?.previousElementSibling; const cv = document.querySelector('[style*="mgr-cover"]'); if (back && !cv) back.style.viewTransitionName = 'mgr-cover'; }
      });
      t.finished.catch(() => {}).finally(() => { Object.values(cardRefs.current).forEach((s) => { if (s?.previousElementSibling) s.previousElementSibling.style.viewTransitionName = ''; }); done(); });
      return;
    }
    curtain.cover(id ? p.titre : 'Travaux', swap).then(done);
  }, [route, transition, curtain]);
  useEffect(() => { const k = (e) => { if (e.key === 'Escape' && route) navigate(null); }; addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, [route, navigate]);
  return (
    <div ref={zone} id="accueil" className="relative min-h-screen overflow-x-clip bg-[var(--bg)] font-sans text-[var(--text)] [scroll-behavior:smooth] motion-reduce:[scroll-behavior:auto] [@media(hover:hover)_and_(pointer:fine)]:[&_a]:cursor-none">
      <style>{CSS + '@keyframes mgr-cap{from{opacity:0;transform:translateY(8px)}}@keyframes mgr-rise{from{opacity:0;transform:translateY(24px)}}'}</style>
      <a href="#mgr-main" className="absolute -top-16 left-4 z-[60] rounded-lg bg-[var(--accent)] px-4 py-3 text-[var(--accent-fg)] focus:top-3">Aller au contenu</a>
      <Header onHome={(e) => { e.preventDefault(); if (route) navigate(null); else scrollTo({ top: 0, behavior: reducedNow() ? 'auto' : 'smooth' }); }} />
      <main id="mgr-main">
        {route ? <ProjectPage id={route} onBack={() => navigate(null)} onOpen={navigate} /> : (
          <>
            <Hero delay={heroDelay} />
            <Gallery3D rayon={rayon} vitesse={vitesse} onOpen={navigate} cardRefs={cardRefs} />
            <ProjectIndex onOpen={navigate} />
            <Studio />
          </>
        )}
        <Contact />
      </main>
      {curtain.el}
      <p aria-live="polite" className="sr-only">{live}</p>
      <ContextCursor zone={zone} />
    </div>
  );
}
