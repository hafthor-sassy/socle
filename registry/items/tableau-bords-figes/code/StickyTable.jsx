// Tableau à bords figés — React + Tailwind CSS. Couleurs : variables de tokens.css. Sans dépendance d'animation.
// En-tête, première colonne, dernière colonne et ligne de total collés ; une ombre signale chaque bord qu'il reste à faire défiler.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * @typedef {object} Column
 * @property {string} key
 * @property {React.ReactNode} label
 * @property {string} [unit]                         ex. « t/ha », affiché en gris dans l'en-tête
 * @property {'left'|'right'} [align]                right par défaut (chiffres)
 * @property {'num'|'text'} [sort]                   absent : colonne non triable
 * @property {(row: any) => React.ReactNode} [render]
 * @property {(row: any) => number|string} [value]   valeur de tri (sinon row[key])
 *
 * @param {object} props
 * @param {Column[]} props.columns                   La première colonne est figée à gauche (en-têtes de ligne)
 * @param {any[]} props.rows
 * @param {(row: any) => string} props.rowKey
 * @param {Record<string, React.ReactNode>} [props.footer]  Ligne de total figée en bas
 * @param {string} props.caption                     Nom du tableau (lu par les lecteurs d'écran)
 * @param {boolean} [props.pinEnd]                   Fige aussi la dernière colonne (désactivé sous 600 px)
 * @param {'comfort'|'compact'} [props.density]
 * @param {boolean} [props.zebra]
 * @param {boolean} [props.crosshair]                Surligne la colonne survolée
 * @param {boolean} [props.shadows]
 * @param {number} [props.maxHeight]                 px
 * @param {number} [props.firstWidth]                px (148 sur mobile)
 */
export default function StickyTable({
  columns, rows, rowKey, footer, caption, pinEnd = true, density = 'comfort', zebra = false, crosshair = true, shadows = true, maxHeight = 520, firstWidth = 200,
}) {
  const sc = useRef(null);
  const [edge, setEdge] = useState({ l: false, r: true, t: false, b: true, sbw: 0, sbh: 0, last: 0 });
  const [sort, setSort] = useState(null); // { key, dir }
  const [col, setCol] = useState(-1);

  const measure = useCallback(() => {
    const el = sc.current; if (!el) return;
    const mx = el.scrollWidth - el.clientWidth, my = el.scrollHeight - el.clientHeight;
    const lastTh = el.querySelector('thead th:last-child');
    const last = lastTh && getComputedStyle(lastTh).position === 'sticky' ? lastTh.offsetWidth : 0;
    setEdge({ l: el.scrollLeft > 1, r: el.scrollLeft < mx - 1, t: el.scrollTop > 1, b: el.scrollTop < my - 1, sbw: el.offsetWidth - el.clientWidth, sbh: el.offsetHeight - el.clientHeight, last });
  }, []);
  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure); ro.observe(sc.current);
    return () => ro.disconnect();
  }, [measure, pinEnd, density]);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const c = columns.find((x) => x.key === sort.key);
    const v = (r) => (c.value ? c.value(r) : r[c.key]);
    const s = sort.dir === 'ascending' ? 1 : -1;
    return [...rows].sort((a, b) => (c.sort === 'text' ? s * String(v(a)).localeCompare(String(v(b)), 'fr') : s * ((v(a) ?? -Infinity) - (v(b) ?? -Infinity))));
  }, [rows, sort, columns]);

  const cycle = (c) => setSort((s) => {
    const first = c.sort === 'text' ? 'ascending' : 'descending';
    if (!s || s.key !== c.key) return { key: c.key, dir: first };
    if (s.dir === first) return { key: c.key, dir: first === 'ascending' ? 'descending' : 'ascending' };
    return null;
  });

  const rowH = density === 'compact' ? 'h-10' : 'h-14';
  const cell = (i, n) => {
    const firstC = i === 0, lastC = pinEnd && i === n - 1;
    return [
      'whitespace-nowrap border-b border-[var(--border)] bg-[var(--surface)] px-4 max-sm:px-3',
      firstC ? 'sticky left-0 z-[1] border-r text-left' : '',
      lastC ? 'sm:sticky sm:right-0 sm:z-[1] sm:border-l' : '',
      crosshair && col === i && i > 0 ? 'bg-[linear-gradient(var(--state-hover),var(--state-hover))]' : '',
    ].join(' ');
  };
  const n = columns.length;
  const shade = 'pointer-events-none absolute z-[4] transition-opacity duration-200';

  return (
    <div className="relative border-t border-[var(--border)]" style={{ '--first': `${firstWidth}px` }}>
      <div ref={sc} onScroll={measure} role="region" aria-label={caption} tabIndex={0} onPointerLeave={() => setCol(-1)}
        className="overflow-auto overscroll-contain focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--focus-ring)] max-sm:max-h-[64vh]"
        style={{ maxHeight }}>
        <table className="w-max min-w-full border-separate border-spacing-0 text-sm tabular-nums">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={c.key} scope="col" aria-sort={sort && sort.key === c.key ? sort.dir : undefined}
                  className={`${cell(i, n)} !h-11 !bg-[var(--raised)] !px-1 text-[13px] font-medium text-[var(--text-muted)] ${i === 0 ? 'z-[3]' : 'z-[2]'} sticky top-0 ${pinEnd && i === n - 1 ? 'sm:z-[3]' : ''}`}
                  style={i === 0 ? { width: 'var(--first)', minWidth: 'var(--first)', maxWidth: 'var(--first)' } : undefined}>
                  {c.sort ? (
                    <button type="button" onClick={() => cycle(c)}
                      className={`flex h-9 w-full items-center gap-1 rounded-lg px-3 hover:bg-[var(--state-hover)] hover:text-[var(--text-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--focus-ring)] ${(c.align || (i === 0 ? 'left' : 'right')) === 'left' ? 'justify-start' : 'justify-end'} ${sort && sort.key === c.key ? 'text-[var(--text-strong)]' : ''}`}>
                      {c.label}{c.unit && <span className="font-normal text-[var(--text-disabled)]">{c.unit}</span>}
                      <span aria-hidden="true" className={`ml-0.5 text-[10px] transition-opacity ${sort && sort.key === c.key ? 'opacity-100' : 'opacity-0'}`}>{sort && sort.key === c.key && sort.dir === 'ascending' ? '▲' : '▼'}</span>
                    </button>
                  ) : <span className="px-3">{c.label}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, ri) => (
              <tr key={rowKey(r)} className="group">
                {columns.map((c, i) => {
                  const Tag = i === 0 ? 'th' : 'td';
                  return (
                    <Tag key={c.key} scope={i === 0 ? 'row' : undefined} onPointerEnter={() => setCol(i)}
                      className={`${cell(i, n)} ${rowH} font-normal group-hover:bg-[linear-gradient(var(--state-hover),var(--state-hover))] ${zebra && ri % 2 ? '!bg-[var(--raised)]' : ''} ${(c.align || (i === 0 ? 'left' : 'right')) === 'left' ? 'text-left' : 'text-right'}`}
                      style={i === 0 ? { width: 'var(--first)', minWidth: 'var(--first)', maxWidth: 'var(--first)' } : undefined}>
                      {c.render ? c.render(r) : r[c.key] ?? <span className="text-[var(--text-disabled)]">—</span>}
                    </Tag>
                  );
                })}
              </tr>
            ))}
          </tbody>
          {footer && (
            <tfoot>
              <tr>
                {columns.map((c, i) => {
                  const Tag = i === 0 ? 'th' : 'td';
                  return (
                    <Tag key={c.key} scope={i === 0 ? 'row' : undefined}
                      className={`${cell(i, n)} sticky bottom-0 !h-12 border-b-0 border-t !bg-[var(--raised)] font-semibold text-[var(--text-strong)] ${i === 0 ? 'z-[3]' : 'z-[2]'} ${pinEnd && i === n - 1 ? 'sm:z-[3]' : ''} ${(c.align || (i === 0 ? 'left' : 'right')) === 'left' ? 'text-left' : 'text-right'}`}>
                      {footer[c.key]}
                    </Tag>
                  );
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {shadows && (
        <>
          <span aria-hidden="true" className={`${shade} inset-x-0 top-11 h-2 bg-[linear-gradient(var(--scrim),transparent)] ${edge.t ? 'opacity-30' : 'opacity-0'}`} />
          <span aria-hidden="true" className={`${shade} inset-x-0 h-2 bg-[linear-gradient(transparent,var(--scrim))] ${edge.b && footer ? 'opacity-30' : 'opacity-0'}`} style={{ bottom: 48 + edge.sbh }} />
          <span aria-hidden="true" className={`${shade} inset-y-0 w-3 bg-[linear-gradient(90deg,var(--scrim),transparent)] ${edge.l ? 'opacity-30' : 'opacity-0'}`} style={{ left: 'var(--first)' }} />
          <span aria-hidden="true" className={`${shade} inset-y-0 w-3 bg-[linear-gradient(-90deg,var(--scrim),transparent)] ${edge.r ? 'opacity-30' : 'opacity-0'}`} style={{ right: edge.last + edge.sbw }} />
        </>
      )}
      <p aria-live="polite" className="sr-only">{sort ? `Trié par ${sort.key}, ${sort.dir === 'ascending' ? 'croissant' : 'décroissant'}` : ''}</p>
    </div>
  );
}

/* Exemple
<StickyTable caption="Campagne 2025-2026" rowKey={(r) => r.id}
  columns={[
    { key: 'name', label: 'Parcelle', sort: 'text', render: (r) => <><span className="block font-medium text-[var(--text-strong)]">{r.name}</span><span className="block text-[13px] text-[var(--text-muted)]">{r.commune}</span></> },
    { key: 'surface', label: 'Surface', unit: 'ha', sort: 'num', render: (r) => r.surface.toLocaleString('fr-FR') },
    { key: 'yield', label: 'Rendement', unit: 't/ha', sort: 'num' },
    { key: 'status', label: 'Statut', align: 'left', sort: 'text' },
  ]}
  rows={parcelles}
  footer={{ name: 'Total', surface: '378,3', yield: '4,5', status: '12 / 18' }} />
*/
