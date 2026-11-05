// Bento filtrable — React + Tailwind CSS. Aucune bibliothèque : FLIP fait main avec l’API Web Animations.
// Couleurs : uniquement les variables de tokens.css (suit la palette). Marque fictive : Gabarit (création de sites sans code).
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const EASE = 'cubic-bezier(.22,1,.36,1)';
const FILTERS = [
  { id: 'tout', label: 'Tout', phrase: 'fonctionnalités' },
  { id: 'creer', label: 'Créer', phrase: 'fonctionnalités pour créer' },
  { id: 'publier', label: 'Publier', phrase: 'fonctionnalités pour publier' },
  { id: 'vendre', label: 'Vendre', phrase: 'fonctionnalités pour vendre' },
  { id: 'mesurer', label: 'Mesurer', phrase: 'fonctionnalités pour mesurer' },
];
/* Compositions (6 colonnes) selon le nombre de cases : la grille reste pleine. */
const LAYOUTS = { 1: ['6x2'], 2: ['3x2', '3x2'], 3: ['4x2', '2x1', '2x1'], 4: ['3x2', '3x1', '3x1', '6x1'], 5: ['4x2', '2x1', '2x1', '3x1', '3x1'] };
const LAYOUTS4 = { 1: ['4x2'], 2: ['2x2', '2x2'], 3: ['4x1', '2x1', '2x1'], 4: ['2x2', '2x1', '2x1', '4x1'], 5: ['4x1', '2x1', '2x1', '2x1', '2x1'] };
const TOUT4 = ['4x2', '2x1', '2x1', '2x1', '2x1', '4x1', '2x2', '2x1', '2x1'];

const pill = 'rounded-full px-3 py-2 text-[13px] font-semibold leading-none';
const mono = '[font-family:var(--font-mono)]';

const CARDS = [
  { id: 'editor', cats: ['creer'], tout: '4x2', om: 1, big: true, t: 'Éditeur visuel', d: 'Glissez, alignez, c’est en ligne. Chaque bloc s’adapte seul au téléphone.',
    art: (tall) => (
      <div className="relative grid h-full w-full grid-cols-1 gap-3 min-[1024px]:grid-cols-[1fr_168px]">
        <div className="grid grid-rows-[auto_1fr_auto] gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--raised)] p-3">
          <div className="flex items-center gap-2"><i className="h-[18px] w-[18px] rounded-md bg-[var(--accent)]" /><b className="ml-auto h-1.5 w-9 rounded-full bg-[var(--border)]" /><b className="h-1.5 w-9 rounded-full bg-[var(--border)]" /></div>
          <div className="grid content-center gap-2 px-[8%]"><i className="h-3.5 w-[78%] rounded-full bg-[var(--text-strong)] opacity-85" /><i className="h-3.5 w-[52%] rounded-full bg-[var(--text-strong)] opacity-85" /><i className="mt-1.5 h-[22px] w-[92px] rounded-full bg-[var(--accent)]" /></div>
          <div className="grid h-14 grid-cols-[1fr_1.3fr_1fr] gap-2 min-[720px]:h-[72px]">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]" />
            <div className="relative rounded-lg border border-[var(--accent)] bg-[var(--accent-subtle)] outline outline-1 outline-[var(--accent)]">
              <span className={`absolute -top-[26px] left-0 hidden whitespace-nowrap rounded-md bg-[var(--accent)] px-2 py-0.5 text-[11px] leading-4 text-[var(--accent-fg)] min-[720px]:block ${mono}`}>Bloc image · 480 px</span>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]" />
          </div>
        </div>
        <div className="hidden content-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 min-[1024px]:grid">
          <p className="m-0 text-xs text-[var(--text-muted)]">Espacement</p>
          <div className="relative my-1 h-1 rounded-full bg-[var(--border)]"><i className="absolute inset-y-0 left-0 w-[62%] rounded-full bg-[var(--accent)]" /></div>
          <p className="m-0 text-xs text-[var(--text-muted)]">Rayon</p>
          <div className={`grid grid-cols-3 gap-0.5 rounded-lg bg-[var(--raised)] p-0.5 text-center text-[11px] ${mono}`}><b className="py-1 font-medium text-[var(--text-muted)]">8</b><b className="rounded-md bg-[var(--surface)] py-1 font-medium text-[var(--text-strong)]">12</b><b className="py-1 font-medium text-[var(--text-muted)]">16</b></div>
        </div>
        <div className="absolute left-[56%] top-[62%] flex items-start gap-0.5 text-[var(--accent)] motion-safe:animate-[bf-cur_5s_ease-in-out_infinite]">
          <svg width="16" height="16" viewBox="0 0 24 24"><path d="M5 3l14 8-6 1.6L10 19z" fill="currentColor" /></svg>
          <span className="mt-3 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[11px] font-semibold leading-4 text-[var(--accent-fg)]">Camille</span>
        </div>
      </div>
    ) },
  { id: 'models', cats: ['creer'], tout: '2x1', om: 3, t: '120 modèles', d: 'Portfolio, restaurant, boutique : partez d’une base soignée.',
    art: (tall) => (
      <div className="relative h-full w-full">
        {[['left-[4%] -rotate-6', 'bg-[var(--raised)]'], ['left-[27%] z-[1] -translate-y-1.5', 'bg-[var(--surface)]'], ['left-1/2 rotate-6', 'bg-[var(--raised)]']].map(([pos, bg], i) => (
          <i key={i} className={`absolute -bottom-5 h-[110%] w-[46%] rounded-[10px] border border-[var(--border)] ${bg} ${pos}`}>
            <b className="absolute inset-x-2.5 top-2.5 h-[34%] rounded-md bg-[var(--accent-subtle)]" />
          </i>
        ))}
      </div>
    ) },
  { id: 'collab', cats: ['creer'], tout: '2x1', om: 6, t: 'À plusieurs, en direct', d: 'Inès modifie la page Tarifs pendant que vous écrivez l’accueil.',
    art: (tall) => (
      <div className="flex items-center">
        {['IR', 'CM', 'TB', '+4'].map((x, i) => (
          <span key={x} className={`-ml-2 grid h-10 w-10 place-items-center rounded-full border-2 border-[var(--surface)] text-[13px] font-semibold first:ml-0
            ${i === 1 ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : i === 3 ? 'bg-[var(--raised)] text-[var(--text-muted)]' : 'bg-[var(--accent-subtle)] text-[var(--text-strong)]'}`}>{x}</span>
        ))}
      </div>
    ) },
  { id: 'publish', cats: ['publier'], tout: '2x1', om: 2, t: 'Publié en 8 secondes', d: 'Images optimisées, cache mondial, retour arrière en un clic.',
    art: (tall) => (
      <div className="flex w-full flex-col gap-4">
        <ul className={`m-0 list-none p-0 ${tall ? 'grid' : 'hidden'}`}>
          {[['42 pages générées', '1,9 s'], ['128 images optimisées (−61 %)', '3,4 s'], ['Cache mondial, 34 villes', '2,1 s'], ['En ligne sur atelier-lune.fr', '0,8 s']].map(([a, b]) => (
            <li key={a} className="flex min-h-10 items-center gap-2.5 border-b border-[var(--border)] text-sm text-[var(--text)]">
              <span className="h-2 w-2 rounded-full bg-[var(--up)] ring-4 ring-[var(--tint-green-bg)]" />{a}<time className={`ml-auto text-[13px] text-[var(--text-muted)] ${mono}`}>{b}</time>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          <span className={`${pill} bg-[var(--accent)] text-[var(--accent-fg)]`}>Publier</span>
          <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--raised)]"><i className="absolute inset-0 origin-left rounded-full bg-[var(--accent)]" /></span>
          <span className={`text-[13px] text-[var(--text-muted)] ${mono}`}>8,2 s</span>
        </div>
      </div>
    ) },
  { id: 'domain', cats: ['publier'], tout: '2x1', om: 7, t: 'Votre nom de domaine', d: 'Branché en deux étapes, certificat SSL inclus et renouvelé.',
    art: (tall) => (
      <div className="flex w-full flex-col gap-4">
        <ul className={`m-0 list-none gap-1.5 p-0 ${tall ? 'grid' : 'hidden'}`}>
          {[['A', '@', '76.76.21.21'], ['CNAME', 'www', 'sites.gabarit.app'], ['TXT', '@', 'gabarit-verif=7f2c…']].map(([a, b, c]) => (
            <li key={a} className="grid min-h-10 grid-cols-[64px_48px_1fr_auto] items-center gap-3 rounded-lg bg-[var(--raised)] px-3 text-[13px]">
              <b className={`text-xs text-[var(--text-strong)] ${mono}`}>{a}</b><span className="text-[var(--text-muted)]">{b}</span><code className={`truncate ${mono}`}>{c}</code><i className="text-xs font-semibold not-italic text-[var(--tint-green-fg)]">Vérifié</i>
            </li>
          ))}
        </ul>
        <div className={`flex min-h-11 items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--raised)] pl-3 pr-2 text-sm font-medium text-[var(--text-strong)] ${mono}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-[var(--up)]"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
          atelier-lune.fr<em className="ml-auto rounded-full bg-[var(--tint-green-bg)] px-2 py-1 text-xs font-semibold not-italic text-[var(--tint-green-fg)] [font-family:var(--font-sans)]">SSL actif</em>
        </div>
      </div>
    ) },
  { id: 'seo', cats: ['publier', 'mesurer'], tout: '2x1', om: 8, t: 'Référencement', d: 'Titres, aperçus et plan du site générés, score vérifié à chaque publication.',
    art: (tall) => (
      <div className="flex w-full flex-col gap-4">
        <ul className={`m-0 list-none p-0 ${tall ? 'grid' : 'hidden'}`}>
          {['Titre de 58 caractères', 'Description de la page', 'Texte alternatif sur 41 images sur 41', 'Plan du site envoyé aux moteurs'].map((x) => (
            <li key={x} className="flex min-h-10 items-center gap-2.5 border-b border-[var(--border)] text-sm"><span className="h-2 w-2 rounded-full bg-[var(--up)] ring-4 ring-[var(--tint-green-bg)]" />{x}</li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 flex-none place-items-center rounded-full [background:conic-gradient(var(--accent)_338deg,var(--raised)_0)]">
            <b className="grid h-[38px] w-[38px] place-items-center rounded-full bg-[var(--surface)] text-sm font-semibold text-[var(--text-strong)]">94</b>
          </span>
          <span className="grid min-w-0 gap-1"><i className="text-xs not-italic text-[var(--text-muted)]">atelier-lune.fr</i><b className="truncate text-sm font-medium text-[var(--info)]">Céramiques faites main à Nantes</b></span>
        </div>
      </div>
    ) },
  { id: 'shop', cats: ['vendre'], tout: '3x2', om: 4, big: true, t: 'Une boutique intégrée', d: 'Stock, variantes et livraison. Zéro commission sur vos ventes.',
    art: (tall) => (
      <div className="grid h-full w-full grid-cols-2 gap-4 min-[720px]:grid-cols-[1.1fr_1fr]">
        <div className="relative overflow-hidden rounded-xl bg-[var(--accent-subtle)]">
          <span className="absolute bottom-[14%] left-1/2 h-[58%] w-[38%] -translate-x-1/2 rounded-[46%_46%_30%_30%/40%_40%_24%_24%] bg-[var(--accent)]" />
        </div>
        <div className="flex flex-col justify-end gap-1">
          <span className="mb-2 flex items-center gap-1.5"><i className="h-4 w-4 rounded-full bg-[var(--accent)] ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--surface)]" /><i className="h-4 w-4 rounded-full bg-[var(--text-strong)]" /><i className="h-4 w-4 rounded-full border border-[var(--border)] bg-[var(--accent-subtle)]" /><small className="ml-1 text-[13px] text-[var(--text-muted)]">3 émaux</small></span>
          <b className="text-base text-[var(--text-strong)]">Vase Lune</b><span className="text-sm text-[var(--text-muted)]">Grès émaillé · 24 cm</span>
          <span className="mt-2 flex items-center justify-between gap-2"><strong className="text-lg tabular-nums text-[var(--text-strong)]">48 €</strong><em className={`${pill} bg-[var(--accent)] not-italic text-[var(--accent-fg)]`}>Ajouter</em></span>
        </div>
      </div>
    ) },
  { id: 'stats', cats: ['mesurer'], rang: { mesurer: 0 }, tout: '3x1', om: 5, t: '12 480 visites ce mois-ci', d: 'Sans cookie ni bandeau : des statistiques respectueuses.',
    art: (tall) => (
      <div className="flex h-full w-full flex-col justify-end gap-4">
        <div className="relative flex min-h-[64px] flex-1 items-end gap-1.5">
          {[.38, .52, .44, .61, .58, .72, .66, .84, .78, .95].map((h, i, a) => (
            <i key={i} style={{ height: `${h * 100}%` }} className={`flex-1 rounded-[4px_4px_2px_2px] ${i === a.length - 1 ? 'bg-[var(--accent)]' : 'bg-[var(--accent-subtle)]'}`} />
          ))}
          <em className="absolute right-0 top-0 rounded-full bg-[var(--tint-green-bg)] px-2 py-0.5 text-xs font-semibold not-italic text-[var(--tint-green-fg)]">+18 %</em>
        </div>
        <dl className={`m-0 grid-cols-3 gap-3 ${tall ? 'grid' : 'hidden'}`}>
          {[['Pages vues', '31 204'], ['Durée moyenne', '2 min 41'], ['Depuis un mobile', '68 %']].map(([a, b]) => (
            <div key={a} className="flex flex-col-reverse gap-0.5"><dt className="text-[13px] text-[var(--text-muted)]">{a}</dt><dd className="m-0 text-xl font-semibold tracking-[-0.02em] tabular-nums text-[var(--text-strong)]">{b}</dd></div>
          ))}
        </dl>
      </div>
    ) },
  { id: 'pay', cats: ['vendre', 'mesurer'], tout: '3x1', om: 9, top: true, t: 'Paiements reçus', d: 'Carte, Apple Pay et virement, versés sous 2 jours ouvrés.',
    art: (tall) => (
      <div className="grid w-full gap-2">
        {[['1042', 'Carte', '96,00'], ['1041', 'Apple Pay', '48,00'], ['1040', 'Virement', '132,00'], ['1039', 'Carte', '36,00'], ['1038', 'Carte', '64,00'], ['1037', 'Apple Pay', '48,00']].map(([n, m, v]) => (
          <span key={n} className="flex min-h-9 items-center gap-3 rounded-lg bg-[var(--raised)] px-3 text-sm">
            <b className="font-medium text-[var(--text)]">Commande #{n}</b><i className="not-italic text-[var(--text-muted)]">{m}</i><em className="ml-auto font-semibold not-italic tabular-nums text-[var(--up)]">+ {v} €</em>
          </span>
        ))}
      </div>
    ) },
];

function useMedia(q) {
  const [m, setM] = useState(false);
  useEffect(() => { const mq = matchMedia(q); const on = () => setM(mq.matches); on(); mq.addEventListener('change', on); return () => mq.removeEventListener('change', on); }, [q]);
  return m;
}

export function BentoFiltrable({
  filtre = 'tout',       // filtre affiché au départ
  duree = 620,           // ms, durée du réarrangement
  decalage = 40,         // ms entre deux cases
  compteurs = true,      // nombre de cases dans chaque filtre
  mobile = '1',          // colonnes sur téléphone : '1' | '2'
}) {
  const [f, setF] = useState(filtre);
  useEffect(() => setF(filtre), [filtre]);
  const phone = useMedia('(max-width: 719px)');
  const tablet = useMedia('(min-width: 720px) and (max-width: 1023px)');
  const reduce = useMedia('(prefers-reduced-motion: reduce)');
  const grid = useRef(null), bar = useRef(null), pillRef = useRef(null), btns = useRef({});
  const rects = useRef(new Map());
  const [leaving, setLeaving] = useState([]);   // cases qui s’effacent à leur ancienne place

  const visible = useMemo(() => {
    const v = CARDS.filter((c) => f === 'tout' || c.cats.includes(f));
    return v.sort((a, b) => ((a.rang && a.rang[f] !== undefined ? a.rang[f] : 10 + CARDS.indexOf(a)) - (b.rang && b.rang[f] !== undefined ? b.rang[f] : 10 + CARDS.indexOf(b))));
  }, [f]);
  const size = (c, i) => {
    if (phone) return null;
    if (f === 'tout') return tablet ? TOUT4[CARDS.indexOf(c)] : c.tout;
    const t = (tablet ? LAYOUTS4 : LAYOUTS)[Math.min(visible.length, 5)] || [];
    return t[i] || '2x1';
  };

  const choose = (id) => {
    if (id === f) return;
    const g = grid.current, gr = g.getBoundingClientRect(), m = new Map(), out = [];
    g.querySelectorAll('[data-card]').forEach((el) => {
      const r = el.getBoundingClientRect(); m.set(el.dataset.card, r);
      const c = CARDS.find((x) => x.id === el.dataset.card);
      if (id !== 'tout' && !c.cats.includes(id)) out.push({ c, box: { left: r.left - gr.left, top: r.top - gr.top, width: r.width, height: r.height } });
    });
    rects.current = m; setLeaving(reduce ? [] : out); setF(id);
  };

  /* FLIP : chaque case repart de son ancienne boîte, son contenu est contre-étiré pour ne pas se déformer. */
  useLayoutEffect(() => {
    const first = rects.current; rects.current = new Map();
    if (!first.size || reduce) return;
    const anims = [];
    grid.current.querySelectorAll('[data-card]').forEach((el, i) => {
      if (el.hasAttribute('data-out')) {
        const a = el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.94)' }], { duration: duree * 0.45, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });
        a.onfinish = () => setLeaving((l) => l.filter((x) => x.c.id !== el.dataset.card));
        anims.push(a); return;
      }
      const a = first.get(el.dataset.card), b = el.getBoundingClientRect(), delay = i * decalage;
      if (!a) { anims.push(el.animate([{ opacity: 0, transform: 'scale(.94) translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: duree * 0.8, delay: delay + duree * 0.25, easing: EASE, fill: 'backwards' })); return; }
      const dx = a.left - b.left, dy = a.top - b.top, sx = a.width / b.width, sy = a.height / b.height;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) return;
      anims.push(el.animate([{ transform: `translate(${dx}px,${dy}px) scale(${sx},${sy})` }, { transform: 'none' }], { duration: duree, delay, easing: EASE, fill: 'backwards' }));
      anims.push(el.firstElementChild.animate([{ transform: `scale(${1 / sx},${1 / sy})` }, { transform: 'none' }], { duration: duree, delay, easing: EASE, fill: 'backwards' }));
    });
    return () => anims.forEach((x) => x.finish && x.finish());
  }, [f]);

  /* Pastille du filtre actif */
  useLayoutEffect(() => {
    const b = btns.current[f], p = pillRef.current; if (!b || !p) return;
    p.style.width = `${b.offsetWidth}px`; p.style.transform = `translateX(${b.offsetLeft}px)`;
  }, [f, phone, tablet, compteurs]);

  const onKey = (e) => {
    const i = FILTERS.findIndex((x) => x.id === f);
    let k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (e.key === 'Home') k = -i; if (e.key === 'End') k = FILTERS.length - 1 - i;
    if (!k) return; e.preventDefault();
    const n = FILTERS[(i + k + FILTERS.length) % FILTERS.length]; choose(n.id); btns.current[n.id].focus();
  };
  const count = (id) => (id === 'tout' ? CARDS.length : CARDS.filter((c) => c.cats.includes(id)).length);
  const phrase = FILTERS.find((x) => x.id === f).phrase;

  return (
    <section aria-labelledby="bf-title" className="bg-[var(--bg)] px-4 py-12 [font-family:var(--font-sans)] text-[var(--text)] min-[720px]:px-[clamp(16px,4vw,56px)] min-[720px]:py-[clamp(48px,7vw,96px)]">
      <style>{'@keyframes bf-cur{0%,15%{transform:translate(0,0)}45%,75%{transform:translate(28px,4px)}100%{transform:translate(0,0)}}'}</style>
      <div className="mx-auto grid max-w-[1200px] gap-4">
        <p className="m-0 flex items-center gap-3">
          <span className="inline-flex text-[var(--text-strong)] [--a:var(--accent-subtle)] [--ink:var(--text-strong)] [--lt:var(--accent-fg)] [--p:var(--accent)]"><svg viewBox="0 0 327 100" aria-hidden="true" focusable="false" className="block h-6 w-auto"><g data-role="icone"><rect width="100" height="100" rx="28" style={{ fill: 'var(--p, currentColor)' }}/><rect x="22" y="22" width="56" height="16" rx="5" style={{ fill: 'var(--lt, #fff)' }}/><rect x="22" y="44" width="26" height="34" rx="5" style={{ fill: 'var(--lt, #fff)' }}/><rect x="54" y="44" width="24" height="14" rx="5" style={{ fill: 'var(--a, var(--lt, #fff))' }}/><rect x="54" y="64" width="24" height="14" rx="5" style={{ fill: 'var(--lt, #fff)' }} opacity=".55"/></g><path data-role="nom" d="M148.56 70.9Q142.87 70.9 138.81 68.24Q134.74 65.59 132.58 60.92Q130.41 56.26 130.41 50.18Q130.41 44.18 132.61 39.48Q134.82 34.78 138.97 32.06Q143.12 29.34 148.94 29.34Q153.97 29.34 157.43 31.07Q160.88 32.79 162.95 35.87Q165.02 38.95 165.83 43.01L158.26 43.39Q157.62 39.88 155.46 37.78Q153.3 35.68 148.99 35.68Q145.19 35.68 142.74 37.63Q140.3 39.58 139.12 42.86Q137.93 46.13 137.93 50.18Q137.93 54.33 139.11 57.57Q140.29 60.82 142.76 62.69Q145.24 64.56 149.08 64.56Q152.02 64.56 154.16 63.32Q156.3 62.08 157.51 59.94Q158.72 57.8 158.87 55.18H149.03V49.52H165.95V70H161.24L160.82 61.26L161.71 61.82Q161.11 64.49 159.21 66.53Q157.32 68.58 154.57 69.74Q151.82 70.9 148.56 70.9ZM180.11 70.67Q175.45 70.67 172.59 68.52Q169.73 66.37 169.73 62.52Q169.73 58.62 172.14 56.45Q174.55 54.28 179.44 53.31L189.39 51.37Q189.39 48.18 187.93 46.58Q186.46 44.98 183.63 44.98Q181.02 44.98 179.53 46.17Q178.04 47.36 177.53 49.63L170.24 49.26Q171.1 44.54 174.58 41.98Q178.05 39.42 183.63 39.42Q190.01 39.42 193.28 42.63Q196.56 45.84 196.56 51.83V62.73Q196.56 63.92 196.96 64.35Q197.37 64.78 198.21 64.78H199.16V70Q198.83 70.1 198.08 70.17Q197.33 70.25 196.57 70.25Q194.71 70.25 193.26 69.64Q191.81 69.03 191 67.56Q190.19 66.1 190.19 63.53L190.84 63.95Q190.36 65.92 188.89 67.45Q187.43 68.98 185.18 69.83Q182.92 70.67 180.11 70.67ZM181.59 65.45Q183.98 65.45 185.72 64.52Q187.46 63.58 188.42 61.89Q189.39 60.19 189.39 57.93V56.25L181.64 57.81Q179.26 58.28 178.2 59.28Q177.15 60.27 177.15 61.85Q177.15 63.56 178.3 64.51Q179.46 65.45 181.59 65.45ZM218.89 70.67Q215.76 70.67 213.42 69.32Q211.08 67.97 209.79 65.56L209.63 70H202.84V30.24H210.01V44.33Q211.19 42.3 213.5 40.86Q215.81 39.42 218.89 39.42Q222.74 39.42 225.56 41.35Q228.39 43.28 229.93 46.78Q231.48 50.29 231.48 55.05Q231.48 59.81 229.93 63.31Q228.39 66.82 225.56 68.75Q222.74 70.67 218.89 70.67ZM217.24 64.87Q220.34 64.87 222.2 62.26Q224.06 59.65 224.06 55.05Q224.06 50.41 222.23 47.82Q220.39 45.23 217.31 45.23Q215.01 45.23 213.37 46.38Q211.72 47.54 210.86 49.74Q210.01 51.93 210.01 55.05Q210.01 58.07 210.86 60.28Q211.72 62.5 213.35 63.68Q214.98 64.87 217.24 64.87ZM245.13 70.67Q240.47 70.67 237.61 68.52Q234.75 66.37 234.75 62.52Q234.75 58.62 237.16 56.45Q239.56 54.28 244.46 53.31L254.4 51.37Q254.4 48.18 252.94 46.58Q251.48 44.98 248.65 44.98Q246.04 44.98 244.55 46.17Q243.06 47.36 242.54 49.63L235.25 49.26Q236.11 44.54 239.59 41.98Q243.07 39.42 248.65 39.42Q255.03 39.42 258.3 42.63Q261.57 45.84 261.57 51.83V62.73Q261.57 63.92 261.98 64.35Q262.39 64.78 263.23 64.78H264.18V70Q263.84 70.1 263.09 70.17Q262.34 70.25 261.58 70.25Q259.72 70.25 258.27 69.64Q256.82 69.03 256.02 67.56Q255.21 66.1 255.21 63.53L255.86 63.95Q255.38 65.92 253.91 67.45Q252.44 68.98 250.19 69.83Q247.94 70.67 245.13 70.67ZM246.61 65.45Q248.99 65.45 250.74 64.52Q252.48 63.58 253.44 61.89Q254.4 60.19 254.4 57.93V56.25L246.65 57.81Q244.28 58.28 243.22 59.28Q242.16 60.27 242.16 61.85Q242.16 63.56 243.32 64.51Q244.48 65.45 246.61 65.45ZM267.85 70V40.1H274.55L274.82 48.41L274.24 48.26Q274.91 43.96 276.78 42.03Q278.64 40.1 281.87 40.1H284.64V46.23H281.85Q279.55 46.23 278.04 46.91Q276.53 47.59 275.78 49.02Q275.02 50.44 275.02 52.77V70ZM289.64 70V40.1H296.81V70ZM289.5 36.1V29.76H296.94V36.1ZM315.52 70Q311.06 70 308.96 67.94Q306.86 65.88 306.86 61.44V33.08H314.03V60.75Q314.03 62.85 314.94 63.65Q315.85 64.44 317.72 64.44H321.93V70ZM302.18 45.65V40.1H321.93V45.65Z" style={{ fill: 'var(--ink, currentColor)' }}/></svg></span>
          <span className={`border-l border-[var(--border)] pl-3 text-[13px] uppercase leading-5 tracking-[0.04em] text-[var(--text-muted)] ${mono}`}>Fonctionnalités</span>
        </p>
        <h2 id="bf-title" className="m-0 max-w-[22ch] text-[clamp(1.875rem,1.2rem+2.4vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-[var(--text-strong)] [text-wrap:balance]">Tout pour publier votre site, sans attendre un développeur.</h2>
      </div>

      <div className="mx-auto -mx-4 mb-4 mt-6 flex max-w-[1200px] flex-col items-stretch gap-4 min-[720px]:mx-auto min-[720px]:mt-8 min-[720px]:flex-row min-[720px]:items-center min-[720px]:justify-between">
        <div ref={bar} role="toolbar" aria-label="Filtrer les fonctionnalités" onKeyDown={onKey}
          className="relative mx-4 inline-flex gap-1 overflow-x-auto rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 [scrollbar-width:none] min-[720px]:mx-0">
          <span ref={pillRef} aria-hidden="true" className="absolute left-0 top-1 h-[calc(100%-8px)] rounded-full bg-[var(--accent)] transition-[transform,width] duration-[520ms] ease-[cubic-bezier(.34,1.3,.64,1)] motion-reduce:transition-none" />
          {FILTERS.map((x) => (
            <button key={x.id} ref={(el) => (btns.current[x.id] = el)} type="button" aria-pressed={f === x.id} tabIndex={f === x.id ? 0 : -1} onClick={() => choose(x.id)}
              className={`group relative z-[1] inline-flex min-h-11 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border-0 bg-transparent px-3.5 text-[15px] font-medium transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] min-[720px]:min-h-10 min-[720px]:px-4
                ${f === x.id ? 'text-[var(--accent-fg)]' : 'text-[var(--text-muted)] hover:text-[var(--text-strong)]'}`}>
              {x.label}
              {compteurs && <span className={`min-w-[22px] rounded-full px-1.5 py-0.5 text-center text-xs leading-4 ${mono} ${f === x.id ? 'bg-[color-mix(in_srgb,var(--accent-fg)_18%,transparent)] text-[var(--accent-fg)]' : 'bg-[var(--raised)] text-[var(--text-muted)]'}`}>{count(x.id)}</span>}
            </button>
          ))}
        </div>
        <p role="status" aria-live="polite" className="m-0 px-4 text-sm tabular-nums text-[var(--text-muted)] min-[720px]:px-0">{visible.length} {phrase}</p>
      </div>

      <ul ref={grid} className={`relative mx-auto m-0 grid max-w-[1200px] list-none gap-3 p-0 min-[720px]:auto-rows-[200px] min-[720px]:grid-cols-4 min-[1024px]:grid-cols-6 ${mobile === '2' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {visible.map((c, i) => {
          const s = size(c, i); const [cs, rs] = s ? s.split('x') : [null, null];
          return (
            <li key={c.id} data-card={c.id}
              style={phone ? { order: c.om, gridColumn: mobile === '2' && c.big ? 'span 2' : undefined } : { gridColumn: `span ${cs}`, gridRow: `span ${rs}`, order: i }}
              className={`relative origin-top-left overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] transition-colors hover:border-[var(--border-strong)] ${c.big ? 'min-h-[300px] min-[720px]:min-h-0' : ''}`}>
              <div className="flex h-full origin-top-left flex-col gap-4 p-4 min-[720px]:absolute min-[720px]:inset-0 min-[720px]:p-5">
                <div>
                  <h3 className="m-0 text-base font-semibold leading-6 tracking-[-0.01em] text-[var(--text-strong)] min-[720px]:text-[17px]">{c.t}</h3>
                  <p className="m-0 mt-1 max-w-[46ch] text-sm leading-5 text-[var(--text-muted)]">{c.d}</p>
                </div>
                <div aria-hidden="true" className={`relative flex min-h-[72px] flex-1 ${c.top ? 'max-h-32 items-start overflow-hidden [mask-image:linear-gradient(#000_calc(100%-24px),transparent)] min-[720px]:max-h-none' : 'items-end'}`}>
                  {c.art(!phone && rs === '2')}   {/* une case haute montre plus de détails */}
                </div>
              </div>
            </li>
          );
        })}
        {leaving.map(({ c, box }) => (
          <li key={`out-${c.id}`} data-card={c.id} data-out="" aria-hidden="true" style={{ position: 'absolute', ...box }}
            className="pointer-events-none overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex h-full flex-col gap-4 p-5"><h3 className="m-0 text-[17px] font-semibold leading-6 text-[var(--text-strong)]">{c.t}</h3><p className="m-0 text-sm text-[var(--text-muted)]">{c.d}</p></div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default BentoFiltrable;
