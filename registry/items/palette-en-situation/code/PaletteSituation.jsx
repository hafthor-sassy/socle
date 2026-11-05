// Palette en situation — React + Tailwind CSS. Couleurs : uniquement les variables de tokens.css
// (qui contient les 42 palettes sous [data-accent="…"]). Aucune dépendance en plus de React.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

export const PALETTES = [
  ['graphite','Graphite','Classiques'],['encre','Encre','Classiques'],['indigo','Indigo','Classiques'],['cobalt','Cobalt','Classiques'],['azur','Azur','Classiques'],['lagon','Lagon','Classiques'],['sarcelle','Sarcelle','Classiques'],['jade','Jade','Classiques'],['foret','Forêt','Classiques'],['olive','Olive','Classiques'],['ambre','Ambre','Classiques'],['miel','Miel','Classiques'],['braise','Braise','Classiques'],['terracotta','Terracotta','Classiques'],['corail','Corail','Classiques'],['rubis','Rubis','Classiques'],['framboise','Framboise','Classiques'],['orchidee','Orchidée','Classiques'],['violet','Violet','Classiques'],['moka','Moka','Classiques'],
  ['argile','Argile','Terres'],['ocre','Ocre','Terres'],['lavande','Lavande','Pastels'],['menthe','Menthe','Pastels'],['peche','Pêche','Pastels'],['neon-rose','Néon rose','Néons'],['neon-lime','Néon lime','Néons'],['neon-violet','Néon violet','Néons'],
  ['ardoise','Ardoise','Monochromes'],['fumee','Fumée','Monochromes'],['sable','Sable','Monochromes'],['mousse','Mousse','Nature'],['sauge','Sauge','Nature'],['lichen','Lichen','Nature'],['minuit','Minuit','Nuit'],['aubergine','Aubergine','Nuit'],
  ['bordeaux','Bordeaux','Luxe'],['or','Or','Luxe'],['emeraude','Émeraude','Luxe'],['moutarde','Moutarde','Rétro'],['brique','Brique','Rétro'],['petrole','Pétrole','Rétro'],
].map(([id, nom, famille]) => ({ id, nom, famille }));

const VARS = ['--accent', '--accent-hover', '--accent-fg', '--accent-vivid', '--accent-subtle', '--accent-subtle-border', '--focus-ring'];
const BARS = [1, 1, 2, 1, 2, 3, 4, 2, 1, 1, 0, 0];
const RAYONS = { 8: ['8px', '8px'], 12: ['12px', '8px'], 16: ['16px', '12px'] };

/* Couleur CSS quelconque → [r, g, b] via un canvas 1 px (hex, rgb(), oklch()…) */
let ctx;
function toRgb(c) {
  if (!ctx) { const cv = document.createElement('canvas'); cv.width = cv.height = 1; ctx = cv.getContext('2d', { willReadFrequently: true }); }
  ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]];
}
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (c) => { const [r, g, b] = toRgb(c).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const hex = (c) => '#' + toRgb(c).map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
const fr = (n) => n.toFixed(2).replace('.', ',');

/**
 * @param {{ palette?: string, rayon?: 8|12|16, revelation?: boolean, showExport?: boolean, filtres?: boolean, onChange?: (id: string) => void }} props
 */
export function PaletteSituation({ palette = 'lagon', rayon = 12, revelation = true, showExport = true, filtres = true, onChange }) {
  const [current, setCurrent] = useState(palette);
  const [famille, setFamille] = useState('Toutes');
  const [r, setR] = useState(rayon);
  const [mesures, setMesures] = useState({ rows: [], css: '' });
  const [copie, setCopie] = useState(false);
  const scene = useRef(null);
  const swatches = useRef(null);

  useEffect(() => setCurrent(palette), [palette]);
  useEffect(() => setR(rayon), [rayon]);

  const familles = useMemo(() => ['Toutes', ...new Set(PALETTES.map((p) => p.famille))], []);
  const visibles = PALETTES.filter((p) => famille === 'Toutes' || p.famille === famille);
  const pal = PALETTES.find((p) => p.id === current) || PALETTES[5];

  /* Mesure des contrastes sur les valeurs réellement calculées (suit aussi le thème clair / sombre). */
  useLayoutEffect(() => {
    const measure = () => {
      const cs = getComputedStyle(scene.current), v = (n) => cs.getPropertyValue(n).trim();
      const rows = [
        ['Texte sur accent', v('--accent-fg'), v('--accent'), 4.5],
        ['Accent sur surface', v('--accent'), v('--surface'), 4.5],
        ['Accent sur teinte', v('--accent'), v('--accent-subtle'), 4.5],
        ['Vif sur fond (graphique)', v('--accent-vivid'), v('--bg'), 3],
      ].map(([label, fg, bg, min]) => { const k = ratio(fg, bg); return { label, fg, bg, k, lvl: k >= 7 ? 'AAA' : k >= min ? (min === 3 ? 'AA 3:1' : 'AA') : 'Échec' }; });
      const dark = !!scene.current.closest('.dark');
      const css = `/* ${pal.nom} · ${dark ? 'sombre' : 'clair'} */\n${dark ? '.dark' : ':root'} {\n${VARS.map((n) => `  ${n}: ${hex(v(n))};`).join('\n')}\n}\n/* ou, avec tokens.css : */\n<html data-accent="${pal.id}">`;
      setMesures({ rows, css });
    };
    measure();
    const mo = new MutationObserver(measure);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, [pal.id, pal.nom]);

  function choose(id, from) {
    if (id === current) return;
    const apply = () => { setCurrent(id); onChange && onChange(id); };
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!from || !revelation || !document.startViewTransition || reduce) return apply();
    const a = from.getBoundingClientRect(), s = scene.current.getBoundingClientRect();
    const root = document.documentElement;
    root.style.setProperty('--pal-x', `${a.left + a.width / 2 - s.left}px`);
    root.style.setProperty('--pal-y', `${a.top + a.height / 2 - s.top}px`);
    root.classList.add('pal-vt');
    document.startViewTransition(() => flushSync(apply)).finished.finally(() => root.classList.remove('pal-vt'));
  }

  function onKey(e) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (step == null && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const btns = [...swatches.current.querySelectorAll('[role=radio]')];
    let i = btns.indexOf(document.activeElement);
    i = e.key === 'Home' ? 0 : e.key === 'End' ? btns.length - 1 : (i + step + btns.length) % btns.length;
    btns[i].focus(); choose(btns[i].dataset.id, btns[i]);
  }

  async function copy() {
    try { await navigator.clipboard.writeText(mesures.css); setCopie(true); setTimeout(() => setCopie(false), 1600); } catch { /* sélection manuelle */ }
  }

  const [rCard, rCtl] = RAYONS[r] || RAYONS[12];
  const caps = 'm-0 font-mono text-xs uppercase tracking-[0.04em] text-[var(--text-muted)]';
  const focusId = visibles.some((p) => p.id === current) ? current : visibles[0] && visibles[0].id;

  return (
    <section aria-label="Palette en situation" className="@container mx-auto w-full max-w-[1180px] font-sans text-[var(--text)]">
      {/* Animation de révélation (View Transitions) : à placer une fois dans votre CSS global. */}
      <style>{`html.pal-vt::view-transition-old(root),html.pal-vt::view-transition-new(root),html.pal-vt::view-transition-old(pal-scene){animation:none}
html.pal-vt::view-transition-new(pal-scene){animation:pal-reveal 620ms cubic-bezier(.2,0,0,1) both}
@keyframes pal-reveal{from{clip-path:circle(0 at var(--pal-x,0) var(--pal-y,50%))}to{clip-path:circle(150% at var(--pal-x,0) var(--pal-y,50%))}}`}</style>
      <div className="grid gap-4 @[880px]:grid-cols-[308px_1fr] @[880px]:items-start @[880px]:gap-10">
        <aside className="contents @[880px]:grid @[880px]:content-start @[880px]:gap-4">
          <header className="order-1">
            <p className={caps}>Palette</p>
            <p aria-live="polite" className="mt-1 flex items-baseline gap-2 text-2xl font-semibold tracking-[-0.02em] text-[var(--text-strong)]">
              {pal.nom} <span className="text-[13px] font-medium tracking-normal text-[var(--text-muted)]">{pal.famille}</span>
            </p>
          </header>
          {filtres && (
            <div role="toolbar" aria-label="Filtrer par famille" className="order-2 -mx-1 flex gap-2 overflow-x-auto p-1 [scrollbar-width:none] @[880px]:flex-wrap">
              {familles.map((f) => (
                <button key={f} type="button" aria-pressed={f === famille} onClick={() => setFamille(f)}
                  className="min-h-9 flex-none cursor-pointer rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] text-[var(--text-muted)] transition-colors hover:bg-[var(--raised)] hover:text-[var(--text-strong)] aria-pressed:border-[var(--text-strong)] aria-pressed:bg-[var(--text-strong)] aria-pressed:text-[var(--bg)]">
                  {f}
                </button>
              ))}
            </div>
          )}
          <div ref={swatches} role="radiogroup" aria-label="Choisir une palette" onKeyDown={onKey}
            className="order-3 grid auto-cols-[44px] grid-flow-col overflow-x-auto [scrollbar-width:none] @[880px]:grid-flow-row @[880px]:grid-cols-[repeat(7,44px)]">
            {visibles.map((p) => {
              const on = p.id === current;
              return (
                <button key={p.id} type="button" role="radio" aria-checked={on} aria-label={p.nom} title={p.nom} data-id={p.id} data-accent={p.id}
                  tabIndex={p.id === focusId ? 0 : -1} onClick={(e) => choose(p.id, e.currentTarget)}
                  className="group relative grid aspect-square min-h-11 cursor-pointer place-items-center rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]">
                  <i className={`size-7 rounded-full bg-[var(--accent)] shadow-[inset_0_0_0_1px_var(--accent-subtle-border)] transition-transform duration-300 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] ${on ? 'scale-[.78]' : 'group-hover:scale-110'}`} />
                  <span aria-hidden className={`absolute inset-[5px] rounded-full border-2 border-[var(--accent)] transition duration-300 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] ${on ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`} />
                </button>
              );
            })}
          </div>
          <div className="order-5 flex items-center justify-between gap-4">
            <span id="pal-rayon" className={caps}>Rayon</span>
            <div role="radiogroup" aria-labelledby="pal-rayon" className="inline-flex gap-1 rounded-full border border-[var(--border)] bg-[var(--raised)] p-1">
              {[8, 12, 16].map((v) => (
                <button key={v} type="button" role="radio" aria-checked={r === v} tabIndex={r === v ? 0 : -1} onClick={() => setR(v)}
                  className="min-h-9 min-w-11 cursor-pointer rounded-full font-mono text-[13px] text-[var(--text-muted)] transition-colors aria-checked:bg-[var(--surface)] aria-checked:text-[var(--text-strong)] aria-checked:shadow-[var(--shadow-overlay)]">{v}</button>
              ))}
            </div>
          </div>
          {showExport && (
            <div className="order-6 grid gap-2">
              <button type="button" onClick={copy} className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-ctl)] border border-[var(--border-control)] bg-[var(--surface)] px-4 text-sm font-medium hover:bg-[var(--raised)] ${copie ? 'text-[var(--up)]' : 'text-[var(--text-strong)]'}`}>
                {copie ? 'Variables copiées' : 'Copier les variables'}
              </button>
              <pre aria-label="Variables CSS de la palette" className="m-0 max-h-[196px] overflow-auto whitespace-pre rounded-[var(--radius-ctl)] border border-[var(--border)] bg-[var(--raised)] px-4 py-3 font-mono text-xs leading-5 text-[var(--text-muted)]">{mesures.css}</pre>
            </div>
          )}
        </aside>

        {/* Scène : tout ce qui est dedans lit les variables de la palette choisie. */}
        <div ref={scene} data-accent={pal.id} style={{ viewTransitionName: 'pal-scene', '--o-r-card': rCard, '--o-r-ctl': rCtl }}
          className="order-4 min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-2 @[880px]:p-6 [&_*]:transition-colors [&_*]:duration-[260ms] motion-reduce:[&_*]:transition-none">
          <div className="@container grid gap-4">
            <header className="flex min-h-14 items-center gap-4 rounded-[var(--o-r-card)] border border-[var(--border)] bg-[var(--surface)] py-2 pl-3 pr-2">
              <span className="inline-flex items-center gap-2 text-[var(--text-strong)]" aria-label="Orée">
                <svg viewBox="0 0 100 100" className="size-7" aria-hidden><rect width="100" height="100" rx="26" fill="var(--accent)" /><path d="M31 55a19 19 0 0 1 38 0z" fill="var(--accent-fg)" /><path d="M19 64h62M31 76h38" stroke="var(--accent-fg)" strokeWidth="6.5" strokeLinecap="round" /></svg>
                <b className="text-lg font-semibold tracking-[-0.04em]">orée</b>
              </span>
              <nav aria-label="Exemple" className="mr-auto hidden gap-1 text-sm @[560px]:flex">
                <a href="#" aria-current="page" className="rounded-full bg-[var(--raised)] px-3 py-2 text-[var(--text-strong)] no-underline">Trajets</a>
                <a href="#" className="px-3 py-2 text-[var(--text-muted)] no-underline">Carnets</a>
                <a href="#" className="px-3 py-2 text-[var(--text-muted)] no-underline">Aide</a>
              </nav>
              <Btn className="ml-auto min-h-10 @[560px]:ml-0">Réserver</Btn>
            </header>

            <div className="grid gap-4 @[560px]:grid-cols-[1.35fr_1fr]">
              <article className="grid min-w-0 content-start gap-4 rounded-[var(--o-r-card)] border border-[var(--border)] bg-[var(--surface)] px-2 pb-4 pt-2 @[560px]:row-span-2">
                <div className="relative aspect-[16/7] overflow-hidden rounded-[calc(var(--o-r-card)-4px)] bg-[var(--accent-subtle)]" aria-hidden>
                  <svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid slice" className="block size-full">
                    <rect width="320" height="140" fill="var(--accent-subtle)" />
                    <circle cx="232" cy="64" r="26" fill="var(--accent-vivid)" />
                    <path fill="var(--accent-subtle-border)" d="M0 98c40-22 82-30 128-18s86 6 120-12 56-10 72-2v74H0z" />
                    <path fill="var(--accent)" d="M0 112c52-18 104-14 152-2s104 10 168-14v44H0z" />
                    <path stroke="var(--accent-fg)" strokeWidth="2" opacity=".6" d="M0 124h320" />
                    <path fill="var(--accent-fg)" d="M40 121v-9a5 5 0 0 1 5-5h78a14 14 0 0 1 12 7l3 7zM142 121v-9a5 5 0 0 1 5-5h34a5 5 0 0 1 5 5v9z" />
                    <g fill="var(--accent)">{[50, 66, 82, 98, 150, 166].map((x) => <rect key={x} x={x} y="110" width="10" height="5" rx="1.5" />)}</g>
                  </svg>
                  <span className="absolute left-3 top-3"><Badge solid>Train de nuit</Badge></span>
                </div>
                <div role="tablist" aria-label="Exemple" className="inline-flex gap-1 border-b border-[var(--border)] px-2 text-sm">
                  <button role="tab" aria-selected="true" className="relative min-h-11 px-2 font-medium text-[var(--text-strong)] after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded after:bg-[var(--accent)]">Aller simple</button>
                  <button role="tab" aria-selected="false" className="min-h-11 px-2 text-[var(--text-muted)]">Aller-retour</button>
                </div>
                <div className="flex items-end justify-between gap-4 px-2">
                  <div>
                    <h3 className="m-0 text-[22px] font-semibold leading-7 tracking-[-0.02em] text-[var(--text-strong)]">Paris → Venise</h3>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">Départ 19&nbsp;h&nbsp;42 · arrivée 9&nbsp;h&nbsp;05 · couchette 4&nbsp;places</p>
                  </div>
                  <p className="m-0 whitespace-nowrap text-2xl font-semibold tabular-nums text-[var(--text-strong)]"><small className="text-[13px] font-normal text-[var(--text-muted)]">dès</small> 89&nbsp;€</p>
                </div>
                <ol aria-label="Arrêts" className="relative mx-2 grid grid-cols-3 p-0 text-[13px] leading-[18px] text-[var(--text-muted)] before:absolute before:left-[5px] before:right-1/3 before:top-[5px] before:h-0.5 before:bg-[var(--accent-subtle-border)]">
                  {[['19\u00a0h\u00a042', 'Paris Bercy'], ['03\u00a0h\u00a010', 'Milan'], ['09\u00a0h\u00a005', 'Venise']].map(([h, v], i) => (
                    <li key={v} className="relative list-none pt-5">
                      <span className={`absolute left-0 top-0 size-3 rounded-full border-2 border-[var(--accent)] ${i ? 'bg-[var(--surface)]' : 'bg-[var(--accent)]'}`} />
                      <b className="block font-medium tabular-nums text-[var(--text-strong)]">{h}</b>{v}
                    </li>
                  ))}
                </ol>
                <div className="flex flex-wrap items-center gap-2 px-2">
                  <Btn>Choisir ce trajet</Btn>
                  <button type="button" className="min-h-11 rounded-[var(--o-r-ctl)] border border-[var(--border-control)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text-strong)]">Comparer</button>
                  <span className="ml-auto"><Badge>Places limitées</Badge></span>
                </div>
              </article>

              <article className="grid min-w-0 content-start gap-3 rounded-[var(--o-r-card)] border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className={caps}>Vos voyages en 2026</p>
                <p className="m-0 text-[28px] font-semibold leading-8 tracking-[-0.02em] tabular-nums text-[var(--text-strong)]">18&nbsp;trajets <span className="align-[4px] text-[13px] font-medium tracking-normal text-[var(--up)]">+6</span></p>
                <svg viewBox="0 0 240 88" role="img" aria-label="Trajets par mois, pic en juillet avec 4 trajets" className="block h-auto w-full">
                  {[0, 1, 2].map((g) => <line key={g} x1="0" x2="240" y1={8 + g * 28} y2={8 + g * 28} stroke="var(--chart-grid)" />)}
                  {BARS.map((v, i) => { const h = 8 + (v / 4) * 60; return <rect key={i} x={i * 20 + 3} y={72 - h} width="14" height={h} rx="3" fill={v === 4 ? 'var(--accent)' : 'var(--accent-subtle-border)'} />; })}
                </svg>
                <p className="m-0 flex items-center gap-2 text-[13px] text-[var(--text-muted)]"><span className="size-2 rounded-full bg-[var(--accent)]" />Juillet · 4&nbsp;trajets</p>
              </article>

              <article className="grid min-w-0 content-start gap-3 rounded-[var(--o-r-card)] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
                <label className="grid gap-2 font-medium text-[var(--text-strong)]">Destination
                  <span className="flex min-h-11 items-center gap-2 rounded-[var(--o-r-ctl)] border border-[var(--accent)] bg-[var(--surface)] px-3 font-normal text-[var(--text)] shadow-[0_0_0_3px_var(--accent-subtle)]">Vienne, Autriche</span>
                </label>
                <div className="flex min-h-10 items-center justify-between">Alerte de prix
                  <span aria-hidden className="flex h-6 w-10 justify-end rounded-full bg-[var(--accent)] p-0.5"><i className="size-5 rounded-full bg-[var(--accent-fg)]" /></span>
                </div>
                <div className="grid grid-cols-4 gap-1" aria-hidden>
                  {['var(--accent)', 'var(--accent)', 'var(--accent-subtle-border)', 'var(--border)'].map((c, i) => <i key={i} className="h-1 rounded-full" style={{ background: c }} />)}
                </div>
                <a href="#" className="text-[var(--accent)] underline-offset-[3px]">Voir les conditions d’échange</a>
              </article>

              <article aria-label="Contrastes mesurés" className="grid min-w-0 gap-3 rounded-[var(--o-r-card)] border border-[var(--border)] bg-[var(--surface)] p-4 @[560px]:col-span-2">
                <p className={caps}>Contrastes mesurés</p>
                <ul className="m-0 grid list-none gap-2 p-0 @[560px]:grid-cols-2 @[560px]:gap-x-6">
                  {mesures.rows.map((m) => (
                    <li key={m.label} className="grid min-h-9 grid-cols-[28px_1fr_auto_auto] items-center gap-2.5 text-sm">
                      <span aria-hidden className="grid size-7 place-items-center rounded-lg text-xs font-semibold" style={{ background: m.bg, color: m.fg }}>Aa</span>
                      <span>{m.label}</span>
                      <span className="font-mono text-[13px] font-medium tabular-nums text-[var(--text-strong)]">{fr(m.k)}:1</span>
                      <span className={`min-w-10 rounded-full px-1.5 py-1 text-center font-mono text-[11px] font-medium ${m.lvl === 'Échec' ? 'bg-[var(--tint-red-bg)] text-[var(--tint-red-fg)]' : m.lvl === 'AAA' ? 'bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]' : 'bg-[var(--tint-blue-bg)] text-[var(--tint-blue-fg)]'}`}>{m.lvl}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Btn({ className = '', children }) {
  return <button type="button" className={`inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-[var(--o-r-ctl)] bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] ${className}`}>{children}</button>;
}
function Badge({ solid = false, children }) {
  return <span className={`inline-flex min-h-6 items-center rounded-full border px-2.5 text-xs font-medium ${solid ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]' : 'border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)] text-[var(--accent)]'}`}>{children}</span>;
}

export default PaletteSituation;
