/*
  Arbre de la bibliothèque : sections → catégories.
  Pour ajouter une catégorie : ajoutez un objet dans la section voulue.
  - id          : identifiant d'URL (minuscules, tirets)
  - nom         : libellé affiché
  - description : une ligne
  - icon        : contenu SVG 24 × 24, trait 1,5 px, sans remplissage
  - page        : (facultatif) page spéciale à la place de la grille d'items
  Le compteur de chaque catégorie est calculé à partir de registry/index.json.
*/

export const SECTIONS = [
  {
    id: 'fondations',
    num: '01',
    nom: 'Fondations',
    description: 'Les règles qui tiennent tout le reste : couleur, texte, espace, signes.',
    categories: [
      { id: 'couleurs', nom: 'Couleurs', page: 'couleurs',
        description: 'Neutres, sémantiques et 42 palettes d’accent en 9 catégories, conformes AA.',
        icon: '<circle cx="9" cy="9" r="5"/><circle cx="15" cy="9" r="5"/><circle cx="12" cy="15" r="5"/>' },
      { id: 'typographie', nom: 'Typographie', page: 'typographie',
        description: 'Geist et Geist Mono, échelle fluide, règles du français et polices d’affichage libres.',
        icon: '<path d="M5 7V5h14v2M12 5v14M9 19h6"/>' },
      { id: 'espacements', nom: 'Espacements & grille', page: 'espacements',
        description: 'Grille de 8 px, espacements nommés, rayons et hauteurs de contrôle.',
        icon: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 12h16M12 4v16"/>' },
      { id: 'icones', nom: 'Icônes', page: 'icones',
        description: 'Plus de 200 icônes au trait de 1,5 px, recherche FR et EN, copie SVG et JSX.',
        icon: '<circle cx="7.5" cy="7.5" r="3.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><path d="M7.5 13l4 7h-8z"/><path d="M16.5 13v7M13 16.5h7"/>' },
      { id: 'logos', nom: 'Logos & marques', page: 'marques',
        description: 'Les identités en cours et retenues, avec leurs palettes.',
        icon: '<path d="M5 5h5v9h9v5H6.5A1.5 1.5 0 0 1 5 17.5z"/><rect x="12.5" y="5" width="6.5" height="6.5" rx="1.5"/>' },
    ],
  },
  {
    id: 'composants',
    num: '02',
    nom: 'Composants',
    description: 'Les briques d’interface, avec tous leurs états.',
    categories: [
      { id: 'boutons', nom: 'Boutons',
        description: 'Boutons signature (magnétique, texte qui roule, maintien, tracé, remplissage) et bouton de base.',
        icon: '<rect x="3" y="7" width="18" height="10" rx="5"/><path d="M8.5 12h7"/>' },
      { id: 'champs', nom: 'Champs & formulaires',
        description: 'Libellé visible, aide et erreur, contrôles accessibles.',
        icon: '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M7 10v4"/>' },
      { id: 'cartes', nom: 'Cartes',
        description: 'En-tête, corps, pied facultatif ; jamais de carte dans une carte.',
        icon: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 13h16M8 16.5h5"/>' },
      { id: 'badges', nom: 'Badges & tags',
        description: 'Fond teinté et texte de la même teinte, jamais la couleur seule.',
        icon: '<path d="M3.5 12.6V5A1.5 1.5 0 0 1 5 3.5h7.6l8 8a1.5 1.5 0 0 1 0 2.1l-6.5 6.5a1.5 1.5 0 0 1-2.1 0z"/><circle cx="8" cy="8" r="1.25"/>' },
      { id: 'navigation', nom: 'Navigation',
        description: 'Barres de navigation, onglets, fils d’Ariane et menus.',
        icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M6.5 6.5h2M11 6.5h2"/>' },
      { id: 'modales', nom: 'Modales & tiroirs',
        description: 'Surcouches, panneaux latéraux et feuilles mobiles.',
        icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="8" width="10" height="8" rx="1.5"/>' },
      { id: 'notifications', nom: 'Notifications',
        description: 'Toasts, bannières et alertes en ligne.',
        icon: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>' },
      { id: 'tableaux', nom: 'Tableaux',
        description: 'Lignes de 48 px, chiffres à droite, défilement dans la carte.',
        icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9.5h18M3 15h18M9 4v16"/>' },
    ],
  },
  {
    id: 'animations',
    num: '03',
    nom: 'Animations & effets',
    description: 'Du mouvement qui guide l’œil, coupé si l’on réduit les animations.',
    categories: [
      { id: 'texte-anime', nom: 'Texte animé',
        description: 'Révélations, défilements et effets typographiques.',
        icon: '<path d="M4 7V5h10v2M9 5v12M7 17h4"/><path d="M15.5 13H20M17 17h3"/>' },
      { id: 'backgrounds', nom: 'Backgrounds',
        description: 'Fonds discrets : grilles, trames et motifs animables.',
        icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>' },
      { id: 'survol', nom: 'Survol & curseur',
        description: 'Réactions au pointeur, réservées à la souris.',
        icon: '<path d="M5 4l5.2 15 2.3-6.5L19 10.2z"/><path d="M13 13l6 6"/>' },
      { id: 'transitions', nom: 'Transitions',
        description: 'Entrées, sorties et passages d’un état à l’autre.',
        icon: '<rect x="3" y="7" width="8" height="10" rx="1.5"/><path d="M14 12h7M18 9l3 3-3 3"/>' },
      { id: 'chargements', nom: 'Chargements',
        description: 'Squelettes, indicateurs et progressions.',
        icon: '<path d="M21 12a9 9 0 1 1-6.2-8.56"/>' },
    ],
  },
  {
    id: 'sections',
    num: '04',
    nom: 'Sections',
    description: 'Des blocs de page complets, à assembler.',
    categories: [
      { id: 'hero', nom: 'Hero',
        description: 'Le premier écran : une promesse, une action.',
        icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 10h10M9 13.5h6"/>' },
      { id: 'bento', nom: 'Bento',
        description: 'Grilles asymétriques pour présenter plusieurs atouts.',
        icon: '<rect x="3" y="3" width="10" height="10" rx="1.5"/><rect x="15" y="3" width="6" height="6" rx="1.5"/><rect x="15" y="11" width="6" height="10" rx="1.5"/><rect x="3" y="15" width="10" height="6" rx="1.5"/>' },
      { id: 'fonctionnalites', nom: 'Fonctionnalités',
        description: 'Listes et grilles d’atouts, avec icône et preuve.',
        icon: '<path d="M4 6.5l1.5 1.5L8.5 5M11 6.5h9M4 12.5l1.5 1.5 3-3M11 12.5h9M4 18.5l1.5 1.5 3-3M11 18.5h9"/>' },
      { id: 'pricing', nom: 'Pricing',
        description: 'Offres, bascule de période et comparatif.',
        icon: '<path d="M17.5 7a6.5 6.5 0 1 0 0 10M5 10.5h8M5 13.5h8"/>' },
      { id: 'temoignages', nom: 'Témoignages',
        description: 'Citations, logos clients et preuve sociale.',
        icon: '<path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4z"/><path d="M8.5 9h7M8.5 12.5h4"/>' },
      { id: 'stats', nom: 'Stats',
        description: 'Chiffres clés, en chiffres tabulaires.',
        icon: '<path d="M4 20h16M7 16v-4M12 16V7M17 16V9"/>' },
      { id: 'faq', nom: 'FAQ',
        description: 'Questions fréquentes en accordéon accessible.',
        icon: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7M12 17h.01"/>' },
      { id: 'cta', nom: 'Appel à l’action',
        description: 'Le bloc qui conclut et fait agir.',
        icon: '<path d="M12 3v3M5.6 5.6l2.1 2.1M3 12h3"/><path d="M10 10l10 4-4 1.5-1.5 4.5z"/>' },
      { id: 'footer', nom: 'Footer',
        description: 'Pieds de page : liens, mentions et inscription.',
        icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 15h18M7 17.5h3M14 17.5h3"/>' },
    ],
  },
  {
    id: 'app-ui',
    num: '05',
    nom: 'App UI',
    description: 'Les écrans récurrents d’une application.',
    categories: [
      { id: 'tableau-de-bord', nom: 'Tableau de bord',
        description: 'KPI, graphiques et listes d’activité.',
        icon: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>' },
      { id: 'reglages', nom: 'Réglages',
        description: 'Pages de paramètres, groupes et interrupteurs.',
        icon: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>' },
      { id: 'authentification', nom: 'Authentification',
        description: 'Connexion, inscription, code et mot de passe oublié.',
        icon: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2"/>' },
      { id: 'etats-vides', nom: 'États vides',
        description: 'Premiers pas, aucun résultat, erreur et hors ligne.',
        icon: '<path d="M3 13l2.5-7A1.5 1.5 0 0 1 6.9 5h10.2a1.5 1.5 0 0 1 1.4 1L21 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 13h5l1.5 2.5h5L16 13h5"/>' },
    ],
  },
  {
    id: 'templates',
    num: '06',
    nom: 'Templates',
    description: 'Des pages complètes, prêtes à adapter.',
    categories: [
      { id: 'pages-completes', nom: 'Pages complètes',
        description: 'Sites vitrines, pages produit et pages d’application entières.',
        icon: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 15.5h6"/>' },
    ],
  },
];

/* Accès à plat : id → { ...catégorie, section } */
export const CATEGORIES = SECTIONS.flatMap((s) =>
  s.categories.map((c) => ({ ...c, section: s.id, sectionNom: s.nom, sectionNum: s.num }))
);

export function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id) || null;
}

export function getSection(id) {
  return SECTIONS.find((s) => s.id === id) || null;
}
