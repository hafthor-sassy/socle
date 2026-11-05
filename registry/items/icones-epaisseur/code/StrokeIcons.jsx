// Épaisseur réglable — React + Tailwind CSS. Couleurs : variables de tokens.css.
// <Icon> accepte size, strokeWidth et absoluteStrokeWidth ; <StrokeIconGallery> est la planche réglable avec copie.
import { useEffect, useMemo, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

export const ICONS = [
  { id: "vol", name: "Vol", keywords: "avion plane flight", body: (<><path d="M12 3c.97 0 1.75.78 1.75 1.75V9.5l6.75 3.9v1.85l-6.75-1.9v3.4l2.5 1.9v1.6L12 19.4l-4.25.85v-1.6l2.5-1.9v-3.4L3.5 15.25V13.4l6.75-3.9V4.75C10.25 3.78 11.03 3 12 3z" /></>) },
  { id: "valise", name: "Valise", keywords: "bagage suitcase luggage", body: (<><rect x="4.75" y="7.25" width="14.5" height="12.5" rx="2" /><path d="M9 7.25V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5v1.75M8.5 7.25v12.5M15.5 7.25v12.5" /></>) },
  { id: "carte", name: "Carte", keywords: "plan map", body: (<><path d="M3.75 6.25 9 4l6 2.5 5.25-2.25v13.5L15 20l-6-2.5-5.25 2.25z" /><path d="M9 4v13.5M15 6.5V20" /></>) },
  { id: "boussole", name: "Boussole", keywords: "explorer compass", body: (<><circle cx="12" cy="12" r="8.75" /><path d="m15 9-1.75 4.25L9 15l1.75-4.25z" /></>) },
  { id: "billet", name: "Billet", keywords: "ticket", body: (<><path d="M4.75 7h14.5a1.25 1.25 0 0 1 1.25 1.25v2a2 2 0 0 0 0 3.5v2A1.25 1.25 0 0 1 19.25 17H4.75a1.25 1.25 0 0 1-1.25-1.25v-2a2 2 0 0 0 0-3.5v-2A1.25 1.25 0 0 1 4.75 7z" /><path d="M14.5 7v1.5M14.5 11.25v1.5M14.5 15.5V17" /></>) },
  { id: "hotel", name: "Hôtel", keywords: "lit chambre bed hotel", body: (<><path d="M3.5 18.5V6M3.5 14.5h17v4M20.5 14.5V12a2.5 2.5 0 0 0-2.5-2.5h-7v5" /><circle cx="7.25" cy="11.75" r="1.75" /></>) },
  { id: "train", name: "Train", keywords: "rail tgv", body: (<><rect x="5.75" y="3.75" width="12.5" height="13.5" rx="3" /><path d="M5.75 10.25h12.5M9 14h.01M15 14h.01M8.5 17.25l-2 3M15.5 17.25l2 3" /></>) },
  { id: "photo", name: "Photo", keywords: "appareil camera", body: (<><path d="M4.75 7.5h2.6l1.4-2.25h6.5l1.4 2.25h2.6a1.5 1.5 0 0 1 1.5 1.5v8.75a1.5 1.5 0 0 1-1.5 1.5H4.75a1.5 1.5 0 0 1-1.5-1.5V9a1.5 1.5 0 0 1 1.5-1.5z" /><circle cx="12" cy="13" r="3.25" /></>) },
  { id: "passeport", name: "Passeport", keywords: "identite passport", body: (<><rect x="5.25" y="3.25" width="13.5" height="17.5" rx="2" /><circle cx="12" cy="10.25" r="3" /><path d="M9 10.25h6M12 7.25c.9.85 1.35 1.85 1.35 3s-.45 2.15-1.35 3c-.9-.85-1.35-1.85-1.35-3s.45-2.15 1.35-3zM9.5 16.25h5" /></>) },
  { id: "monde", name: "Monde", keywords: "globe international world", body: (<><circle cx="12" cy="12" r="8.75" /><path d="M3.25 12h17.5M12 3.25c2.4 2.5 3.6 5.4 3.6 8.75S14.4 18.25 12 20.75C9.6 18.25 8.4 15.35 8.4 12S9.6 5.75 12 3.25z" /></>) },
  { id: "montagne", name: "Montagne", keywords: "randonnee ski mountain", body: (<><path d="M2.75 19.25 9.25 8l3.5 6 2.25-3.5 6.25 8.75z" /><path d="m7.35 11.25 1.9 1.25 1.6-1.6" /></>) },
  { id: "soleil", name: "Soleil", keywords: "ete meteo sun", body: (<><circle cx="12" cy="12" r="4" /><path d="M12 2.75v2M12 19.25v2M2.75 12h2M19.25 12h2M5.45 5.45l1.4 1.4M17.15 17.15l1.4 1.4M5.45 18.55l1.4-1.4M17.15 6.85l1.4-1.4" /></>) },
  { id: "palmier", name: "Palmier", keywords: "tropiques plage palm", body: (<><path d="M12.75 20.5c0-4.25-.5-7.5-2-10M10.75 10.5c-2.25-2-5.25-2.25-7.25-.75M10.75 10.5C10.5 7.5 8.5 5.25 5.75 4.75M10.75 10.5c1.25-2.75 4-4.25 7-3.75M10.75 10.5c3 .25 5.75 2 6.75 4.75M7.5 20.5h10" /></>) },
  { id: "ancre", name: "Port", keywords: "ancre bateau croisiere anchor", body: (<><circle cx="12" cy="5.25" r="1.75" /><path d="M12 7v13.25M8.5 11h7M4.75 13.5A7.25 7.25 0 0 0 12 20.25a7.25 7.25 0 0 0 7.25-6.75" /></>) },
  { id: "lieu", name: "Lieu", keywords: "epingle position pin location", body: (<><path d="M12 21s6.75-5.9 6.75-11.25a6.75 6.75 0 1 0-13.5 0C5.25 15.1 12 21 12 21z" /><circle cx="12" cy="9.75" r="2.5" /></>) },
  { id: "horaire", name: "Horaire", keywords: "horloge heure clock time", body: (<><circle cx="12" cy="12" r="8.75" /><path d="M12 7.5V12l3 2" /></>) },
  { id: "agenda", name: "Dates", keywords: "calendrier agenda calendar", body: (<><rect x="3.75" y="5.25" width="16.5" height="15" rx="2" /><path d="M3.75 9.75h16.5M8 3.25v4M16 3.25v4M8 13.5h.01M12 13.5h.01M16 13.5h.01M8 17h.01M12 17h.01" /></>) },
  { id: "recherche", name: "Recherche", keywords: "loupe chercher search", body: (<><circle cx="11" cy="11" r="6.5" /><path d="m15.75 15.75 4.5 4.5" /></>) },
  { id: "favori", name: "Favori", keywords: "coeur aimer heart like", body: (<><path d="M12 20s-8-4.8-8-10.5A4.5 4.5 0 0 1 12 6.8a4.5 4.5 0 0 1 8 2.7C20 15.2 12 20 12 20z" /></>) },
  { id: "partager", name: "Partager", keywords: "envoyer share", body: (<><circle cx="17.75" cy="5.75" r="2.25" /><circle cx="6.25" cy="12" r="2.25" /><circle cx="17.75" cy="18.25" r="2.25" /><path d="m8.25 10.9 7.5-4.05M8.25 13.1l7.5 4.05" /></>) },
  { id: "wifi", name: "Wi-Fi", keywords: "connexion internet wifi", body: (<><path d="M3 9.5a12.75 12.75 0 0 1 18 0M6 12.75a8.5 8.5 0 0 1 12 0M9 16a4.25 4.25 0 0 1 6 0M12 19.5h.01" /></>) },
  { id: "cafe", name: "Café", keywords: "petit-dejeuner tasse coffee", body: (<><path d="M4.75 9.25h11.5v5.5a5 5 0 0 1-5 5h-1.5a5 5 0 0 1-5-5z" /><path d="M16.25 10.5h1.25a2.25 2.25 0 0 1 0 4.5h-1.25M8.5 3.75v2.5M12.5 3.75v2.5" /></>) },
  { id: "voiture", name: "Location", keywords: "voiture auto car", body: (<><path d="M5.25 16.75h-1.5v-3.5l1.75-5a2 2 0 0 1 1.9-1.5h9.2a2 2 0 0 1 1.9 1.5l1.75 5v3.5h-1.5M3.75 13h16.5M9.25 16.75h5.5" /><circle cx="7.25" cy="16.75" r="2" /><circle cx="16.75" cy="16.75" r="2" /></>) },
  { id: "mer", name: "Mer", keywords: "vagues plage ocean sea", body: (<><path d="M2.75 8c1.5 0 1.5-1.25 3.1-1.25S7.4 8 8.95 8s1.55-1.25 3.1-1.25S13.6 8 15.15 8s1.55-1.25 3.1-1.25S19.75 8 21.25 8M2.75 12.5c1.5 0 1.5-1.25 3.1-1.25s1.55 1.25 3.1 1.25 1.55-1.25 3.1-1.25 1.55 1.25 3.1 1.25 1.55-1.25 3.1-1.25 1.5 1.25 3 1.25M2.75 17c1.5 0 1.5-1.25 3.1-1.25S7.4 17 8.95 17s1.55-1.25 3.1-1.25S13.6 17 15.15 17s1.55-1.25 3.1-1.25S19.75 17 21.25 17" /></>) },
];

/** Une icône au trait. absoluteStrokeWidth garde l'épaisseur visuelle constante quelle que soit la taille. */
export function Icon({ name, size = 24, strokeWidth = 1.5, absoluteStrokeWidth = false, className = '', ...props }) {
  const ic = ICONS.find((i) => i.id === name) || ICONS[0];
  const sw = absoluteStrokeWidth ? (strokeWidth * 24) / size : strokeWidth;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" className={`transition-[stroke-width] duration-[260ms] motion-reduce:transition-none ${className}`} {...props}>
      {ic.body}
    </svg>
  );
}

const fr = (n) => String(+n.toFixed(2)).replace('.', ',');
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const pascal = (id) => id.replace(/(^|-)(\w)/g, (m, a, b) => b.toUpperCase());

function snippet(ic, size, written, format) {
  const inner = renderToStaticMarkup(<>{ic.body}</>).replace(/></g, '>\n  <');
  if (format === 'jsx') {
    return `export function Icon${pascal(ic.id)}({ size = ${size}, strokeWidth = ${written}, ...props }) {\n  return (\n    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>\n      ${inner.replace(/stroke-width/g, 'strokeWidth').replace(/\n  /g, '\n      ')}\n    </svg>\n  );\n}`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${written}" stroke-linecap="round" stroke-linejoin="round">\n  ${inner}\n</svg>`;
}

export function StrokeIconGallery({ strokeWidth: swProp = 1.5, size: sizeProp = 24, absoluteStrokeWidth: absProp = false, format: fmtProp = 'svg', onCopy }) {
  const [sw, setSw] = useState(swProp);
  const [size, setSize] = useState(sizeProp);
  const [abs, setAbs] = useState(absProp);
  const [format, setFormat] = useState(fmtProp);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(ICONS[0].id);
  const [copied, setCopied] = useState(false);
  const gridRef = useRef(null);
  useEffect(() => setSw(swProp), [swProp]);
  useEffect(() => setSize(+sizeProp), [sizeProp]);
  useEffect(() => setAbs(absProp), [absProp]);
  useEffect(() => setFormat(fmtProp), [fmtProp]);

  const list = useMemo(() => ICONS.filter((i) => !q.trim() || norm(`${i.id} ${i.name} ${i.keywords}`).includes(norm(q.trim()))), [q]);
  const ic = ICONS.find((i) => i.id === sel);
  const written = abs ? +((sw * 24) / size).toFixed(3) : sw;
  const code = snippet(ic, size, written, format);
  const mark = format === 'jsx' ? `strokeWidth = ${written}` : `stroke-width="${written}"`;
  const [before, after] = code.split(mark);

  const copy = async () => {
    try { await navigator.clipboard.writeText(code); } catch { /* presse-papiers refusé : le code reste sélectionnable */ }
    setCopied(true); setTimeout(() => setCopied(false), 1600);
    onCopy && onCopy({ id: sel, format, strokeWidth: written });
  };
  const onGridKey = (e) => {
    const tiles = [...gridRef.current.children], i = tiles.indexOf(document.activeElement);
    if (i < 0) return;
    const cols = Math.max(1, Math.round(gridRef.current.clientWidth / tiles[0].offsetWidth));
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(tiles[i].dataset.id); copy(); return; }
    const n = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols, Home: -i, End: tiles.length - 1 - i }[e.key];
    if (n == null) return;
    e.preventDefault();
    const t = tiles[Math.max(0, Math.min(tiles.length - 1, i + n))];
    setSel(t.dataset.id); t.focus();
  };

  return (
    <section aria-label="Icônes Escale" className="overflow-clip rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]">
      <header className="grid grid-cols-1 items-center gap-4 border-b border-[var(--border)] p-4 md:grid-cols-[auto_minmax(200px,1fr)_auto_auto_minmax(160px,220px)] md:gap-6 md:px-6">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-[var(--text-strong)]" aria-hidden="true">
            <path d="M4.5 19.5C6 12 11 6.5 19.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="0.01 3.4" />
            <circle cx="4.5" cy="19.5" r="1.5" fill="currentColor" /><circle cx="19.5" cy="4.5" r="1.5" fill="currentColor" /><circle cx="9.4" cy="9.95" r="2.75" fill="var(--accent)" />
          </svg>
          <div><h2 className="m-0 text-[17px] font-semibold leading-6 tracking-[-0.02em] text-[var(--text-strong)]">Escale</h2><p className="m-0 text-sm text-[var(--text-muted)] md:text-[13px]">{ICONS.length} icônes de voyage</p></div>
        </div>
        <label className="grid">
          <span className="flex justify-between text-sm font-medium text-[var(--text-strong)]">Épaisseur du trait<output className="font-mono font-semibold tabular-nums text-[var(--accent)]">{fr(sw)}&nbsp;px</output></span>
          <input type="range" min="1" max="2" step="0.25" value={sw} onChange={(e) => setSw(+e.target.value)} aria-valuetext={`${fr(sw)} pixel`} className="h-9 w-full cursor-pointer accent-[var(--accent)]" />
        </label>
        <div role="radiogroup" aria-label="Taille d’affichage" className="inline-flex w-fit rounded-full border border-[var(--border)] bg-[var(--raised)] p-0.5">
          {[16, 20, 24, 32].map((s) => (
            <button key={s} type="button" role="radio" aria-checked={size === s} onClick={() => setSize(s)}
              className={`min-h-9 min-w-11 rounded-full px-2 font-mono text-[13px] ${size === s ? 'bg-[var(--surface)] text-[var(--text-strong)] shadow-[var(--shadow-overlay)]' : 'text-[var(--text-muted)]'}`}>{s}</button>
          ))}
        </div>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 whitespace-nowrap text-sm font-medium">
          <input type="checkbox" role="switch" checked={abs} onChange={(e) => setAbs(e.target.checked)} className="peer sr-only" />
          <span aria-hidden="true" className="relative h-5 w-9 rounded-full bg-[var(--scale-track)] transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-[var(--surface)] after:shadow-[var(--shadow-overlay)] after:transition-transform after:duration-300 peer-checked:bg-[var(--accent)] peer-checked:after:translate-x-4 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus-ring)]" />
          Trait constant
        </label>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher" aria-label="Rechercher une icône"
          className="h-11 w-full rounded-lg border border-[var(--border-control)] bg-[var(--surface)] px-3 text-base text-[var(--text-strong)] placeholder:text-[var(--text-muted)] md:h-10 md:text-[15px]" />
      </header>

      <div className="grid md:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 p-4 md:p-6">
          {list.length ? (
            <ul ref={gridRef} role="listbox" aria-label="Icônes" onKeyDown={onGridKey} className="m-0 grid list-none grid-cols-3 gap-2 p-0 md:grid-cols-[repeat(auto-fill,minmax(92px,1fr))]">
              {list.map((i) => (
                <li key={i.id} data-id={i.id} role="option" aria-selected={sel === i.id} tabIndex={sel === i.id ? 0 : -1} onClick={() => setSel(i.id)}
                  className={`grid h-[88px] cursor-pointer content-center justify-items-center gap-2 rounded-xl border px-1 text-[var(--text-strong)] outline-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] md:h-24 md:gap-3 ${sel === i.id ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border)] hover:bg-[var(--raised)]'}`}>
                  <Icon name={i.id} size={size} strokeWidth={sw} absoluteStrokeWidth={abs} />
                  <span className={`max-w-full truncate text-sm md:text-xs ${sel === i.id ? 'text-[var(--text-strong)]' : 'text-[var(--text-muted)]'}`}>{i.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid justify-items-center gap-3 px-4 py-16 text-center text-sm text-[var(--text-muted)]">
              <p className="m-0"><strong className="mb-1 block font-semibold text-[var(--text-strong)]">Aucune icône pour « {q.trim()} »</strong>Essayez « avion », « plage » ou « hôtel ».</p>
              <button type="button" onClick={() => setQ('')} className="min-h-11 rounded-lg border border-[var(--border-control)] px-4 font-medium text-[var(--text-strong)]">Effacer la recherche</button>
            </div>
          )}
        </div>

        <aside aria-label="Icône sélectionnée" className="grid min-w-0 content-start gap-4 border-t border-[var(--border)] bg-[var(--raised)] p-4 md:border-l md:border-t-0 md:p-6">
          <div className="relative grid aspect-[16/10] place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <Icon name={sel} size={144} strokeWidth={sw} className="text-[var(--text-strong)]" />
            <span className="absolute bottom-2 left-3 font-mono text-xs text-[var(--text-muted)]">{size} × {size} · trait {fr(sw)}{abs && size !== 24 ? ` (écrit ${fr(written)})` : ''}</span>
          </div>
          <div className="flex items-baseline justify-between"><strong className="text-base font-semibold text-[var(--text-strong)]">{ic.name}</strong><code className="font-mono text-[13px] text-[var(--text-muted)]">Icon{pascal(ic.id)}</code></div>
          <div role="tablist" aria-label="Format" className="inline-flex gap-1">
            {['svg', 'jsx'].map((f) => (
              <button key={f} type="button" role="tab" aria-selected={format === f} onClick={() => setFormat(f)}
                className={`min-h-9 rounded-full border px-3.5 font-mono text-[13px] uppercase ${format === f ? 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-strong)]' : 'border-transparent text-[var(--text-muted)]'}`}>{f}</button>
            ))}
          </div>
          <pre role="tabpanel" tabIndex={0} className="m-0 max-h-[168px] overflow-auto whitespace-pre-wrap break-all rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 font-mono text-[13px] leading-[18px] md:text-xs">
            <code>{before}<mark className="rounded-[3px] bg-[var(--accent-subtle)] px-0.5 text-[var(--text-strong)]">{mark}</mark>{after}</code>
          </pre>
          <button type="button" onClick={copy} className="relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-lg bg-[var(--accent)] px-4 text-[15px] font-medium text-[var(--accent-fg)] transition active:scale-[.97]">
            {copied ? 'Copié' : format === 'jsx' ? 'Copier le composant JSX' : 'Copier le SVG'}
          </button>
          <p aria-live="polite" className="sr-only">{copied ? `Copié, trait ${fr(written)}` : ''}</p>
        </aside>
      </div>
    </section>
  );
}

export default StrokeIconGallery;
