/* Icônes d'interface : 24 × 24, trait 1,5 px, extrémités arrondies. */
const P = {
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevronDown: '<path d="M6 9l6 6 6-6"/>',
  chevronRight: '<path d="M9 6l6 6-6 6"/>',
  chevronLeft: '<path d="M15 6l-6 6 6 6"/>',
  arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowUpRight: '<path d="M7 17L17 7M8 7h9v9"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  replay: '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5"/><path d="M4 4v4.5h4.5"/>',
  maximize: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  minimize: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 17.5h2"/>',
  tablet: '<rect x="4.5" y="3" width="15" height="18" rx="2"/><path d="M11 17.5h2"/>',
  monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  sort: '<path d="M7 4v16M4 17l3 3 3-3M17 20V4M14 7l3-3 3 3"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  sidebar: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  grid: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9.5h16M4 14.5h16M9.5 4v16M14.5 4v16"/>',
  square: '<rect x="4" y="4" width="16" height="16" rx="2"/>',
  squareFill: '<rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor"/>',
  terminal: '<path d="M5 8l4 4-4 4M12 16h7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  book: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/>',
  package: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
  accessibility: '<circle cx="12" cy="4.5" r="1.5"/><path d="M5 8l7 1.5L19 8M12 9.5V14l-3 6.5M12 14l3 6.5"/>',
  note: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 11h6M9 15h4"/>',
  corner: '<path d="M4 20V4h16"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.8-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11.5" r="1"/><circle cx="10" cy="7.5" r="1"/><circle cx="15" cy="7.5" r="1"/>',
  type: '<path d="M5 7V5h14v2M12 5v14M9 19h6"/>',
  chevronUp: '<path d="M6 15l6-6 6 6"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  play: '<path d="M7 5l12 7-12 7z"/>',
};

export function icon(name, { size = 20, cls = '', label = '' } = {}) {
  const body = P[name] || '';
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';
  return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" ${a11y}>${body}</svg>`;
}

/* Icône depuis un contenu SVG brut (catégories). */
export function rawIcon(body, { size = 20, cls = '' } = {}) {
  return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

export const UI_ICONS = P;
