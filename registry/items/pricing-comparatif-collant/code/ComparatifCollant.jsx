// ComparatifCollant.jsx — tableau comparatif d'offres d'abonnement à en-têtes collants.
// React 18 + Tailwind 3.4, tokens.css chargé (couleurs uniquement par variables). Sans bibliothèque :
// collage en CSS (sticky), compaction par IntersectionObserver, bande qui glisse par transition (ressort),
// repli des lignes identiques par grid-template-rows 1fr → 0fr. Marque fictive : Prisme.
// Utilisation : <ComparatifCollant onlyDiff={false} compactOnStick band featured={1} density="confort" />
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const Y = true, N = false;
export const DATA = {
  plans: [
    { nom: 'Gratuit', d: 'Pour découvrir, seul ou à trois.', prix: '0 €', unite: 'pour toujours', cta: 'Créer un compte' },
    { nom: 'Équipe', d: 'Pour les équipes qui s’organisent.', prix: '12 €', unite: '/ membre / mois', cta: 'Essai 14 jours', tag: 'Populaire' },
    { nom: 'Business', d: 'Pour structurer plusieurs équipes.', prix: '29 €', unite: '/ membre / mois', cta: 'Essai 14 jours' },
    { nom: 'Entreprise', d: 'Pour les exigences de sécurité.', prix: 'Sur devis', unite: '', cta: 'Nous contacter' },
  ],
  groups: [
    { nom: 'Collaboration', rows: [
      ['Membres', '3', 'Illimités', 'Illimités', 'Illimités'], ['Espaces de travail', '1', '5', 'Illimités', 'Illimités'],
      ['Invités externes', N, '10', '50', 'Illimités'], ['Commentaires et mentions', Y, Y, Y, Y], ['Modèles partagés', N, Y, Y, Y]] },
    { nom: 'Stockage et données', rows: [
      ['Stockage', '2 Go', '100 Go', '1 To', 'Sur mesure'], ['Historique des versions', '7 jours', '90 jours', '1 an', 'Illimité'],
      ['Export des données', Y, Y, Y, Y], ['Sauvegarde quotidienne', Y, Y, Y, Y]] },
    { nom: 'Automatisation', rows: [
      ['Intégrations', '3', 'Illimitées', 'Illimitées', 'Illimitées'], ['Automatisations par mois', '100', '5 000', '50 000', 'Sur mesure'],
      ['API et webhooks', N, Y, Y, Y, 'Accès en lecture et écriture à vos espaces, avec clés par membre et journal des appels.'], ['Assistant de rédaction IA', N, Y, Y, Y]] },
    { nom: 'Sécurité et administration', rows: [
      ['Double authentification', Y, Y, Y, Y], ['Connexion unique (SSO)', N, N, Y, Y, 'Vos membres se connectent avec le compte de leur organisation (SAML 2.0 ou OpenID Connect).'],
      ['Journal d’audit', N, N, '90 jours', 'Illimité', 'Qui a fait quoi et quand : connexions, partages, exports, changements de droits.'],
      ['Rôles personnalisés', N, N, Y, Y], ['Données hébergées en Europe', Y, Y, Y, Y]] },
    { nom: 'Assistance', rows: [
      ['Canal', 'Communauté', 'E-mail', 'Chat prioritaire', 'Responsable dédié'], ['Délai de première réponse', N, '24 h', '4 h', '1 h'],
      ['Accompagnement au démarrage', N, N, Y, Y]] },
  ],
};
const SPRING = 'cubic-bezier(.34,1.3,.64,1)';
const focusRing = 'focus-visible:outline focus-visible:outline-[length:var(--focus-width)] focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-[var(--focus-offset)]';
const Chev = ({ className = '' }) => <svg viewBox="0 0 16 16" aria-hidden="true" className={`h-4 w-4 flex-none fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.75] ${className}`}><path d="m4 6 4 4 4-4" /></svg>;

function Value({ v }) {
  if (v === true) return <><span className="grid h-6 w-6 place-items-center rounded-full border border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)] text-[var(--text-strong)]"><svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5 fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]"><path d="m3.5 8.4 3 3 6-6.6" /></svg></span><span className="sr-only">Inclus</span></>;
  if (v === false) return <><span aria-hidden="true" className="block h-[1.5px] w-3.5 rounded bg-[var(--border-control)]" /><span className="sr-only">Non inclus</span></>;
  return v;
}

/**
 * @param {{ data?: typeof DATA, onlyDiff?: boolean, compactOnStick?: boolean, band?: boolean, featured?: number,
 *   density?: 'confort'|'compacte', className?: string }} props
 */
export function ComparatifCollant({ data = DATA, onlyDiff = false, compactOnStick = true, band = true, featured = 1, density = 'confort', className = '' }) {
  const n = data.plans.length;
  const [diff, setDiff] = useState(onlyDiff);
  const [stuck, setStuck] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [pick, setPick] = useState([1, 2]);
  const [closed, setClosed] = useState({});
  const [hover, setHover] = useState(-1);
  const [bandBox, setBandBox] = useState(null);
  const [tip, setTip] = useState(null);             // { text, x, y, key }
  const [headH, setHeadH] = useState(168);
  const sentinel = useRef(null), head = useRef(null), table = useRef(null), heads = useRef([]);
  useEffect(() => setDiff(onlyDiff), [onlyDiff]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)'); const f = () => setMobile(mq.matches); f(); mq.addEventListener('change', f);
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 }); io.observe(sentinel.current);
    const close = () => setTip(null); window.addEventListener('scroll', close, { passive: true });
    return () => { mq.removeEventListener('change', f); io.disconnect(); window.removeEventListener('scroll', close); };
  }, []);
  useLayoutEffect(() => { const t = setTimeout(() => head.current && setHeadH(head.current.offsetHeight), stuck ? 450 : 0); return () => clearTimeout(t); }, [stuck, mobile, compactOnStick]);

  /* Bande : colonne survolée, sinon offre mise en avant */
  const col = hover > -1 ? hover : featured;
  useLayoutEffect(() => {
    const ref = heads.current[col], t = table.current; if (!ref || !t || col < 0) return setBandBox(null);
    const a = t.getBoundingClientRect(), r = ref.getBoundingClientRect(); setBandBox({ x: r.left - a.left, w: r.width });
  }, [col, mobile, stuck, n]);
  useEffect(() => { const f = () => setHover((h) => h); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  const onMove = (e) => {
    if (e.pointerType !== 'mouse' || !band) return;
    const i = heads.current.findIndex((h) => { if (!h) return false; const r = h.getBoundingClientRect(); return e.clientX >= r.left && e.clientX < r.right; });
    if (i !== hover) setHover(i);
  };

  const visibleCols = mobile ? pick : data.plans.map((_, i) => i);
  const isSame = (vals) => visibleCols.every((c) => vals[c] === vals[visibleCols[0]]);
  const sameCount = useMemo(() => data.groups.reduce((s, g) => s + g.rows.filter((r) => isSame(r.slice(1, n + 1))).length, 0), [data, mobile, pick]); // eslint-disable-line react-hooks/exhaustive-deps
  const order = (i) => (mobile ? { order: pick.indexOf(i) + 1 } : undefined);
  const shown = (i) => !mobile || pick.includes(i);
  const choose = (slot, v) => setPick((p) => { const q = [...p]; if (q[1 - slot] === v) q[1 - slot] = q[slot]; q[slot] = v; return q; });
  const compact = compactOnStick && stuck;
  const rowH = density === 'compacte' ? 'md:min-h-[44px]' : 'md:min-h-[56px]';
  const grid = 'grid grid-cols-2 md:grid-cols-[minmax(220px,1.25fr)_repeat(4,minmax(0,1fr))]';
  const tr = { transitionTimingFunction: SPRING };
  const bandBg = 'bg-[color-mix(in_srgb,var(--accent)_7%,transparent)] dark:bg-[color-mix(in_srgb,var(--accent)_11%,transparent)]';

  return (
    <section aria-labelledby="pc-title" className={`mx-auto w-full max-w-[1180px] px-4 pb-14 pt-12 font-[family-name:var(--font-sans)] text-[var(--text)] md:px-10 md:pb-20 md:pt-[72px] ${className}`}>
      <style>{`@keyframes pc-tip{from{opacity:0;transform:translateY(-4px) scale(.96)}to{opacity:1;transform:none}}`}</style>
      <header className="mb-6 grid justify-items-center text-center md:mb-10">
        <span className="mb-6 inline-flex items-center gap-2 text-[var(--text-strong)]">
          <svg viewBox="0 0 100 100" aria-hidden="true" className="h-7 w-7"><rect width="100" height="100" rx="28" fill="var(--accent)" /><path d="M50 22 78 70H22Z" fill="var(--accent-fg)" opacity=".55" /><path d="M50 22 64 70H22Z" fill="var(--accent-fg)" /></svg>
          <span className="text-lg font-semibold tracking-[-0.03em]">prisme</span>
        </span>
        <h2 id="pc-title" className="text-balance text-[clamp(2rem,1.5rem+1.6vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-[var(--text-strong)]">Comparez les offres, ligne par ligne</h2>
        <p className="mt-4 max-w-[56ch] text-pretty text-base leading-[1.55] text-[var(--text-muted)] md:text-[17px]">Tout ce qui change d’une offre à l’autre, sans petites lignes. Les prix s’entendent par membre et par mois, hors taxes.</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:mt-7">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--surface)] py-0 pl-2 pr-4 text-[15px] font-medium text-[var(--text-strong)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--focus-ring)]">
            <input type="checkbox" role="switch" checked={diff} onChange={(e) => setDiff(e.target.checked)} className="peer sr-only" />
            <i aria-hidden="true" className={`relative h-6 w-10 rounded-full transition-colors ${diff ? 'bg-[var(--accent)]' : 'bg-[var(--border-control)]'}`}>
              <i className={`absolute left-[3px] top-[3px] h-[18px] w-[18px] rounded-full transition-transform duration-[380ms] ${diff ? 'translate-x-4 bg-[var(--accent-fg)]' : 'bg-[var(--surface)]'}`} style={{ transitionTimingFunction: 'cubic-bezier(.34,1.56,.64,1)' }} />
            </i>
            Seulement les différences
          </label>
          <span aria-live="polite" className="min-h-5 text-sm tabular-nums text-[var(--text-muted)]">{diff ? `${sameCount} ligne${sameCount > 1 ? 's' : ''} identique${sameCount > 1 ? 's' : ''} masquée${sameCount > 1 ? 's' : ''}` : ''}</span>
        </div>
      </header>

      <div ref={sentinel} aria-hidden="true" className="h-px" />
      <div ref={table} role="table" aria-labelledby="pc-title" className="relative" onPointerMove={onMove} onPointerLeave={() => setHover(-1)}>
        {/* En-têtes collants */}
        <div ref={head} role="rowgroup" className={`sticky top-0 z-[4] after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-[var(--border)] ${stuck ? 'bg-[color-mix(in_srgb,var(--bg)_94%,transparent)] backdrop-blur-[16px] backdrop-saturate-[1.4]' : 'bg-[var(--bg)]'}`}>
          {band && bandBox && !mobile && <span aria-hidden="true" className={`pointer-events-none absolute bottom-0 left-0 top-2 rounded-t-xl ${bandBg} transition-[transform,width] duration-[520ms] motion-reduce:transition-none`} style={{ width: bandBox.w, transform: `translateX(${bandBox.x}px)`, ...tr }} />}
          <div role="row" className={`relative z-[1] ${grid}`}>
            <div role="columnheader" className="hidden items-end pb-4 pr-4 md:flex">
              <p className={`max-w-[22ch] text-[13px] text-[var(--text-muted)] transition-opacity ${compact ? 'opacity-0' : ''}`}>Prix par membre et par mois, hors taxes.</p><span className="sr-only">Fonction</span>
            </div>
            {data.plans.map((p, i) => {
              const isF = i === featured, slot = pick.indexOf(i);
              return (
                <div key={p.nom} role="columnheader" ref={(el) => { heads.current[i] = el; }} style={order(i)}
                  className={`relative content-end transition-[padding] duration-[420ms] ${shown(i) ? 'grid' : 'hidden'} ${compact ? 'py-3' : 'pb-4 pt-5'} ${mobile ? (slot === 0 ? 'pr-2' : 'pl-2') : 'px-4'}`}>
                  {mobile ? (
                    <label className="relative block">
                      <span className="sr-only">Offre {slot + 1} à comparer</span>
                      <select value={i} onChange={(e) => choose(slot, +e.target.value)} className={`min-h-11 w-full cursor-pointer appearance-none rounded-xl border border-[var(--border-control)] bg-[var(--surface)] pl-3 pr-9 text-base font-semibold text-[var(--text-strong)] ${focusRing}`}>
                        {data.plans.map((o, k) => <option key={o.nom} value={k}>{o.nom}</option>)}
                      </select>
                      <Chev className="pointer-events-none absolute right-3 top-3.5 text-[var(--text-muted)]" />
                    </label>
                  ) : (
                    <span className="flex min-h-6 items-center gap-2 text-base font-semibold text-[var(--text-strong)]">{p.nom}{isF && p.tag && <span className="inline-flex h-[22px] items-center rounded-full border border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)] px-2 text-xs font-semibold">{p.tag}</span>}</span>
                  )}
                  {!mobile && (
                    <span className={`grid transition-[grid-template-rows,opacity] duration-[420ms] ${compact ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr]'}`} style={tr}>
                      <span className="min-h-0 overflow-hidden pt-1 text-[13px] leading-[1.4] text-[var(--text-muted)]">{p.d}</span>
                    </span>
                  )}
                  <span className={`flex items-baseline gap-1.5 tabular-nums transition-[margin] duration-[420ms] ${compact ? 'mt-1' : mobile ? 'mt-2' : 'mt-3'}`} style={tr}>
                    <strong className={`font-semibold leading-none tracking-[-0.035em] text-[var(--text-strong)] transition-[font-size] duration-[420ms] ${compact ? (mobile ? 'text-lg' : 'text-xl') : mobile ? 'text-[22px]' : 'text-[30px]'}`} style={tr}>{p.prix}</strong>
                    {p.unite && <span className="whitespace-nowrap text-[13px] text-[var(--text-muted)]">{p.unite}</span>}
                  </span>
                  <a href="#" aria-label={`${p.cta} : offre ${p.nom}`}
                    className={`flex items-center justify-center overflow-hidden whitespace-nowrap rounded-full border text-sm font-medium no-underline transition-[background,min-height,margin,opacity] duration-[420ms] active:scale-[.97] ${focusRing} ${isF ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]' : 'border-[var(--border-control)] bg-[var(--surface)] text-[var(--text-strong)] hover:bg-[var(--raised)]'} ${compact ? (mobile ? 'mt-0 h-0 min-h-0 border-0 opacity-0' : 'mt-2 min-h-8') : mobile ? 'mt-2 min-h-11' : 'mt-3.5 min-h-10'}`} style={tr}>{p.cta}</a>
                </div>
              );
            })}
          </div>
        </div>

        {/* Corps */}
        <div role="rowgroup" className="relative">
          {band && bandBox && !mobile && <span aria-hidden="true" className={`pointer-events-none absolute bottom-0 left-0 top-0 z-[3] rounded-b-xl ${bandBg} transition-[transform,width] duration-[520ms] motion-reduce:transition-none`} style={{ width: bandBox.w, transform: `translateX(${bandBox.x}px)`, ...tr }} />}
          {data.groups.map((g, gi) => {
            const isClosed = !!closed[gi], hidden = diff ? g.rows.filter((r) => isSame(r.slice(1, n + 1))).length : 0;
            return (
              <div key={g.nom} className="relative z-[1]">
                <button type="button" aria-expanded={!isClosed} aria-controls={`pc-g${gi}`} onClick={() => setClosed((c) => ({ ...c, [gi]: !c[gi] }))}
                  className={`sticky z-[2] flex min-h-12 w-full items-center gap-2.5 bg-[var(--bg)] pb-2 pt-5 text-left text-[13px] font-semibold uppercase tracking-[var(--track-caps)] text-[var(--text-muted)] ${focusRing}`} style={{ top: headH }}>
                  <Chev className={`transition-transform duration-[380ms] ${isClosed ? '-rotate-90' : ''}`} />
                  <span className="text-[var(--text-strong)]">{g.nom}</span>
                  {hidden > 0 && <small className="text-xs font-medium normal-case tracking-normal">{hidden === g.rows.length ? 'identique partout' : `${hidden} masquée${hidden > 1 ? 's' : ''}`}</small>}
                </button>
                <div id={`pc-g${gi}`} className={`grid transition-[grid-template-rows] duration-[480ms] ${isClosed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`} style={tr}>
                  <div className="min-h-0 overflow-hidden">
                    {g.rows.map((r) => {
                      const vals = r.slice(1, n + 1), tipText = r[n + 1], gone = diff && isSame(vals);
                      return (
                        <div key={r[0]} className={`grid transition-[grid-template-rows,opacity] duration-[460ms] ${gone ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr]'}`} style={tr}>
                          <div role="row" aria-hidden={gone || undefined} className={`min-h-0 overflow-hidden border-t border-[var(--border)] ${grid}`}>
                            <div role="rowheader" className={`col-span-2 flex items-center gap-1.5 pt-3.5 text-sm text-[var(--text-muted)] md:col-span-1 md:py-2 md:text-[15px] md:text-[var(--text)] ${rowH}`}>
                              {r[0]}
                              {tipText && (
                                <button type="button" aria-expanded={tip?.key === r[0]} aria-label={`En savoir plus : ${r[0]}`}
                                  onClick={(e) => { e.stopPropagation(); if (tip?.key === r[0]) return setTip(null); const b = e.currentTarget.getBoundingClientRect(); setTip({ key: r[0], text: tipText, x: Math.max(12, Math.min(b.left - 8, window.innerWidth - 272)), y: b.bottom + 6 }); }}
                                  onKeyDown={(e) => { if (e.key === 'Escape') setTip(null); }}
                                  className={`-my-1 inline-grid h-7 w-7 place-items-center rounded-full text-[var(--text-muted)] hover:bg-[var(--state-hover)] hover:text-[var(--text-strong)] ${focusRing}`}>
                                  <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 fill-none stroke-current [stroke-linecap:round] [stroke-width:1.5]"><circle cx="8" cy="8" r="6.25" /><path d="M8 7.25V11M8 5v.01" /></svg>
                                </button>
                              )}
                            </div>
                            {vals.map((v, i) => (
                              <div key={i} role="cell" style={order(i)}
                                className={`items-center pb-3.5 pt-1.5 text-base tabular-nums transition-colors md:px-4 md:py-2 md:text-[15px] ${rowH} ${shown(i) ? 'flex' : 'hidden'} ${mobile && pick.indexOf(i) === 1 ? 'pl-2' : ''} ${hover > -1 && hover !== i ? 'text-[var(--text)]' : 'text-[var(--text-strong)]'}`}>
                                <Value v={v} />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {tip && (
        <span role="status" onClick={() => setTip(null)} className="fixed z-30 w-[260px] rounded-xl bg-[var(--text-strong)] px-3 py-2.5 text-[13px] leading-[1.45] text-[var(--bg)] shadow-[var(--shadow-popover)]"
          style={{ left: tip.x, top: tip.y, animation: `pc-tip 300ms ${SPRING}` }}>{tip.text}</span>
      )}
      <p className="mt-10 text-center text-[15px] text-[var(--text-muted)]">Besoin d’un volume particulier ou d’une facture annuelle ? <a href="#" className={`text-[var(--text-strong)] underline underline-offset-[3px] ${focusRing}`}>Parlez-en à l’équipe</a>.</p>
    </section>
  );
}

export default ComparatifCollant;
