// Liste collante synchronisée — React + Tailwind CSS. Aucune bibliothèque.
// Une liste qu’on fait défiler, un visuel unique collant qui change d’écran selon l’étape lue ;
// sur téléphone, le visuel se colle en haut et la liste défile dessous. Couleurs : variables de tokens.css.
// Marque et données fictives : Comptoir (caisse pour restaurants).
import { useEffect, useRef, useState } from 'react';

const EASE = 'ease-[cubic-bezier(.22,1,.36,1)]';
const mono = '[font-family:var(--font-mono)]';
const STEPS = [
  { t: 'Prise de commande en trois touches', d: 'La table, les plats, envoyer. Les modifications («\u00a0sans oignon\u00a0», «\u00a0cuisson rosée\u00a0») suivent le plat jusqu’en cuisine.', a: 'prise de commande',
    alt: 'Commande de la table 12 : deux plats et un dessert, total 64 euros, bouton Envoyer en cuisine.' },
  { t: 'La cuisine voit tout, dans l’ordre', d: 'Chaque bon arrive sur l’écran du passe avec son minuteur. Le chef envoie par table, la salle est prévenue quand c’est prêt.', a: 'cuisine synchronisée',
    alt: 'Écran de cuisine : trois bons en cours avec leur minuteur, la table 12 est prête.' },
  { t: 'Paiement à table, addition partagée', d: 'Le terminal vient à table : par carte, sans contact ou en plusieurs parts, pourboire proposé sans gêne.', a: 'paiement à table',
    alt: 'Paiement de la table 12 : 64 euros partagés en trois parts de 21,34 euros, pourboire 10 % sélectionné.' },
  { t: 'Des stocks qui se tiennent seuls', d: 'Chaque plat vendu décompte ses ingrédients. Une alerte prévient avant la rupture, la commande fournisseur est prête.', a: 'stocks',
    alt: 'Stocks : burrata en alerte avec 4 portions restantes, autres produits au-dessus du seuil.' },
  { t: 'La clôture en un clic', d: 'Ticket Z, chiffre d’affaires, couverts et ticket moyen : envoyés à votre expert-comptable avant que vous ayez rangé la salle.', a: 'clôture',
    alt: 'Clôture du jour : 3 482 euros de chiffre d’affaires, 126 couverts, ticket moyen 27,60 euros.' },
];

const Head = ({ b, s }) => (
  <div className="flex items-baseline justify-between gap-3"><b className="text-base font-semibold tracking-[-0.01em] text-[var(--text-strong)] min-[860px]:text-lg">{b}</b><span className="text-sm text-[var(--text-muted)]">{s}</span></div>
);
const Btn = ({ children, soft }) => (
  <span className={`grid min-h-11 place-items-center rounded-xl text-sm font-semibold min-[860px]:min-h-12 min-[860px]:text-[15px] ${soft ? 'mt-auto border border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)] text-[var(--text-strong)]' : 'bg-[var(--accent)] text-[var(--accent-fg)]'}`}>{children}</span>
);

/* Les cinq écrans du visuel unique */
const SCENES = [
  (on) => (<>
    <Head b="Table 12" s="3 couverts · 20:14" />
    <ul className="m-0 grid list-none gap-1 p-0">
      {[['2', 'Tartare de bœuf', '36,00', 'Cuisson\u00a0: sans oignon'], ['1', 'Risotto aux cèpes', '19,00'], ['1', 'Tarte fine aux pommes', '9,00', null, true]].map(([q, n, p, note, nw], i) => (
        <li key={n} className={`grid grid-cols-[36px_1fr_auto] items-baseline gap-x-2 rounded-[10px] px-2.5 py-2 text-sm min-[860px]:px-3 min-[860px]:py-2.5 min-[860px]:text-[15px] ${i % 2 ? '' : 'bg-[var(--raised)]'} ${nw && on ? 'motion-safe:animate-[lc-new_900ms_cubic-bezier(.22,1,.36,1)_350ms_both]' : ''}`}>
          <span className={`text-[13px] text-[var(--text-muted)] ${mono}`}>{q} ×</span><b className="font-medium text-[var(--text-strong)]">{n}</b><em className="not-italic tabular-nums">{p}</em>
          {note && <small className="col-start-2 col-end-4 text-[13px] text-[var(--warn)]">{note}</small>}
        </li>
      ))}
    </ul>
    <div className="mt-auto flex justify-between border-t border-[var(--border)] pt-3 text-[15px]"><span>Total</span><b className="text-xl tabular-nums text-[var(--text-strong)]">64,00&nbsp;€</b></div>
    <Btn>Envoyer en cuisine</Btn>
  </>),
  () => (<>
    <Head b="Passe" s="3 bons en cours" />
    <div className="grid min-h-0 flex-1 grid-cols-3 gap-1.5 min-[860px]:gap-2.5">
      {[['T12', '08:41', ['2 Tartare', '1 Risotto'], 'ok'], ['T07', '05:12', ['4 Entrecôte', '2 Salade'], 0.62], ['T03', '14:30', ['1 Bar rôti', '1 Risotto'], 0.92, true]].map(([t, time, l, st, warn]) => (
        <div key={t} className={`relative flex flex-col gap-1.5 overflow-hidden rounded-xl border bg-[var(--raised)] p-2 text-[13px] min-[860px]:p-3 min-[860px]:text-sm ${st === 'ok' ? 'border-[var(--tint-green-border)]' : 'border-[var(--border)]'}`}>
          <p className="m-0 mb-1 flex justify-between"><b className="font-semibold text-[var(--text-strong)]">{t}</b><time className={`text-[13px] ${mono} ${warn ? 'text-[var(--down)]' : 'text-[var(--text-muted)]'}`}>{time}</time></p>
          {l.map((x, i) => <span key={x} className={i ? 'hidden min-[860px]:block' : ''}>{x}</span>)}
          {st === 'ok' ? <em className="mt-auto self-start rounded-full border border-[var(--tint-green-border)] bg-[var(--tint-green-bg)] px-2.5 py-0.5 text-[13px] font-semibold not-italic text-[var(--tint-green-fg)]">Prêt</em>
            : <i className="absolute inset-x-0 bottom-0 h-1 bg-[var(--border)]"><b style={{ width: `${st * 100}%` }} className={`absolute inset-y-0 left-0 ${warn ? 'bg-[var(--down)]' : 'bg-[var(--accent)]'}`} /></i>}
        </div>
      ))}
    </div>
  </>),
  (on) => (
    <div className="grid flex-1 content-center justify-items-center gap-4 text-center">
      <p className="m-0 text-sm text-[var(--text-muted)]">Table 12 · part 1 sur 3</p>
      <p className="m-0 text-[clamp(2.5rem,1.6rem+2.6vw,4rem)] font-semibold leading-none tracking-[-0.04em] tabular-nums text-[var(--text-strong)]">21,34&nbsp;€</p>
      <div className="inline-flex gap-1 rounded-full bg-[var(--raised)] p-1">
        {['Sans', '10\u00a0%', '15\u00a0%'].map((x, i) => <span key={x} className={`min-w-14 rounded-full px-2.5 py-2 text-sm font-medium min-[860px]:min-w-16 min-[860px]:px-3 ${i === 1 ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : 'text-[var(--text-muted)]'}`}>{x}</span>)}
      </div>
      <div className="flex items-center gap-3 pt-2 text-sm text-[var(--text-muted)]">
        <span className="relative grid h-11 w-11 place-items-center rounded-full bg-[var(--accent-subtle)] text-[var(--text-strong)]">
          {[0, 1].map((k) => <i key={k} style={{ animationDelay: `${k * 0.8}s` }} className={`absolute inset-0 rounded-full border-[1.5px] border-[var(--accent)] opacity-0 ${on ? 'motion-safe:animate-[lc-nfc_2.4s_cubic-bezier(.22,1,.36,1)_infinite]' : ''}`} />)}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M8.5 8.5a5 5 0 0 1 0 7M12 6a8.5 8.5 0 0 1 0 12M15.5 3.5a12 12 0 0 1 0 17" /></svg>
        </span>
        Approchez la carte
      </div>
    </div>
  ),
  () => (<>
    <Head b="Stocks" s="mis à jour à l’instant" />
    <ul className="m-0 grid list-none gap-2 p-0 min-[860px]:gap-3">
      {[['Burrata', 0.12, '4 portions', true], ['Cèpes', 0.46, '2,3 kg'], ['Bœuf (tartare)', 0.68, '18 portions'], ['Pommes', 0.84, '6 kg']].map(([n, p, v, low], i) => (
        <li key={n} className={`grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1 text-sm min-[860px]:grid-cols-[1fr_1.2fr_auto] min-[860px]:gap-3 min-[860px]:text-[15px] ${i === 3 ? 'hidden min-[860px]:grid' : ''}`}>
          <b className="font-medium text-[var(--text-strong)]">{n}</b>
          <i className="relative col-span-full row-start-2 h-1.5 overflow-hidden rounded-full bg-[var(--raised)] min-[860px]:col-span-1 min-[860px]:row-start-auto min-[860px]:h-2"><b style={{ width: `${p * 100}%` }} className={`absolute inset-y-0 left-0 rounded-full ${low ? 'bg-[var(--down)]' : 'bg-[var(--accent)]'}`} /></i>
          <span className={`min-w-[92px] text-right text-sm tabular-nums ${low ? 'font-semibold text-[var(--down)]' : 'text-[var(--text-muted)]'}`}>{v}</span>
        </li>
      ))}
    </ul>
    <Btn soft>Commande fournisseur prête · 3 articles</Btn>
  </>),
  () => (<>
    <Head b="Clôture · jeudi 5 nov." s="Ticket Z n° 1 204" />
    <p className="m-0 grid gap-1 text-[clamp(2.25rem,1.6rem+2vw,3.25rem)] font-semibold leading-none tracking-[-0.04em] tabular-nums text-[var(--text-strong)]">3 482&nbsp;€<small className="text-sm font-medium leading-5 tracking-normal text-[var(--up)]">+9&nbsp;% vs jeudi dernier</small></p>
    <div className="flex min-h-8 flex-1 items-end gap-2">
      {[0.3, 0.42, 0.85, 0.62, 0.36, 0.52, 0.94, 0.7].map((h, i) => <i key={i} style={{ height: `${h * 100}%` }} className={`flex-1 rounded-[6px_6px_2px_2px] ${i === 6 ? 'bg-[var(--accent)]' : 'bg-[var(--accent-subtle)]'}`} />)}
    </div>
    <dl className="m-0 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-3">
      {[['Couverts', '126'], ['Ticket moyen', '27,60\u00a0€']].map(([a, b]) => <div key={a} className="flex flex-col-reverse"><dt className="text-sm text-[var(--text-muted)]">{a}</dt><dd className="m-0 text-[22px] font-semibold tabular-nums text-[var(--text-strong)]">{b}</dd></div>)}
    </dl>
  </>),
];

export function ListeCollante({
  cote = 'droite',          // 'droite' | 'gauche' : côté du visuel sur bureau
  transition = 'glisse',    // 'glisse' | 'fondu'
  progression = true,       // la barre de l’étape se remplit avec la lecture
  hauteur = 70,             // hauteur d’une étape, en % de la hauteur d’écran
  numeros = true,
}) {
  const [active, setActive] = useState(0);
  const root = useRef(null), aside = useRef(null), items = useRef([]), bars = useRef([]);
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Ligne de lecture : à 45 % de la zone visible (sous le visuel collant sur téléphone) */
  const readLine = () => {
    const top = aside.current && getComputedStyle(aside.current).position === 'sticky' ? aside.current.getBoundingClientRect().bottom : 0;
    return top + (window.innerHeight - top) * 0.45;
  };
  useEffect(() => {
    let ticking = false, live = false;
    const update = () => {
      ticking = false; const line = readLine(); let pick = 0;
      items.current.forEach((el, k) => {
        if (!el) return; const r = el.getBoundingClientRect(); if (r.top <= line) pick = k;
        const bar = bars.current[k]; const br = bar.getBoundingClientRect();
        bar.firstElementChild.style.transform = `scaleY(${reduce ? (r.top <= line ? 1 : 0) : Math.max(0, Math.min(1, (line - br.top) / Math.max(1, br.height)))})`;
      });
      setActive(pick);
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    const io = new IntersectionObserver(([e]) => {                  // écoute du défilement seulement quand la section est à l’écran
      if (e.isIntersecting && !live) { addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); live = true; onScroll(); }
      if (!e.isIntersecting && live) { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); live = false; }
    });
    io.observe(root.current); update();
    return () => { io.disconnect(); removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); };
  }, [hauteur]);

  const jump = (k) => {
    const r = items.current[k].getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + r.top - readLine() + 24, behavior: reduce ? 'auto' : 'smooth' }); setActive(k);
  };

  return (
    <section ref={root} aria-labelledby="lc-title" style={{ '--lc-h': hauteur }}
      className="relative bg-[var(--bg)] px-4 py-12 [font-family:var(--font-sans)] text-[var(--text)] min-[860px]:px-[clamp(16px,4vw,56px)] min-[860px]:py-[clamp(48px,7vw,96px)]">
      <style>{'@keyframes lc-new{from{opacity:0;transform:translateX(-12px)}}@keyframes lc-nfc{0%{transform:scale(1);opacity:.8}100%{transform:scale(1.7);opacity:0}}'}</style>
      <header className="mx-auto mb-6 grid max-w-[1200px] gap-4">
        <p className="m-0 flex items-center gap-3">
          <span className="inline-flex text-[var(--text-strong)] [--a:var(--accent-vivid)] [--ink:var(--text-strong)] [--lt:var(--accent-fg)] [--p:var(--accent)]"><svg viewBox="0 0 378 100" aria-hidden="true" focusable="false" className="block h-6 w-auto"><g data-role="icone"><rect width="100" height="100" rx="28" style={{ fill: 'var(--p, currentColor)' }}/><path d="M24 64A26 26 0 0 1 76 64Z" style={{ fill: 'var(--lt, #fff)' }}/><rect x="18" y="68" width="64" height="8" rx="4" style={{ fill: 'var(--lt, #fff)' }}/><circle cx="50" cy="32" r="5" style={{ fill: 'var(--a, var(--lt, #fff))' }}/></g><path data-role="nom" d="M148.81 70.9Q143.4 70.9 139.24 68.42Q135.09 65.93 132.75 61.3Q130.41 56.66 130.41 50.18Q130.41 43.8 132.69 39.13Q134.98 34.45 139.14 31.9Q143.31 29.34 148.9 29.34Q156.5 29.34 160.72 33.12Q164.93 36.89 166.18 43.7L158.58 44.06Q157.85 40.14 155.44 37.91Q153.03 35.68 148.9 35.68Q145.52 35.68 143.06 37.46Q140.6 39.23 139.27 42.49Q137.93 45.74 137.93 50.18Q137.93 54.66 139.29 57.88Q140.64 61.11 143.1 62.83Q145.56 64.56 148.85 64.56Q153.28 64.56 155.71 62.13Q158.14 59.71 158.78 55.46L166.4 55.82Q165.63 60.49 163.39 63.86Q161.15 67.23 157.5 69.06Q153.84 70.9 148.81 70.9ZM184.32 70.67Q179.9 70.67 176.59 68.75Q173.27 66.82 171.44 63.3Q169.62 59.77 169.62 55.05Q169.62 50.29 171.44 46.79Q173.27 43.3 176.59 41.36Q179.9 39.42 184.32 39.42Q188.75 39.42 192.05 41.36Q195.35 43.3 197.17 46.79Q199 50.29 199 55.05Q199 59.77 197.17 63.3Q195.35 66.82 192.05 68.75Q188.75 70.67 184.32 70.67ZM184.32 64.87Q187.79 64.87 189.68 62.28Q191.58 59.68 191.58 55.05Q191.58 50.43 189.68 47.83Q187.79 45.23 184.32 45.23Q180.86 45.23 178.95 47.83Q177.03 50.43 177.03 55.05Q177.03 59.68 178.95 62.28Q180.86 64.87 184.32 64.87ZM204.01 70V40.1H210.5L210.73 47.42L210.02 47.11Q210.57 44.69 211.83 42.98Q213.09 41.27 214.9 40.35Q216.72 39.42 218.89 39.42Q222.68 39.42 225.04 41.59Q227.4 43.75 228.04 47.49L227.05 47.5Q227.55 44.88 228.78 43.09Q230.02 41.31 231.89 40.36Q233.76 39.42 236.11 39.42Q239.24 39.42 241.47 40.73Q243.7 42.03 244.89 44.56Q246.09 47.1 246.09 50.77V70H238.92V52.65Q238.92 48.96 237.68 47.1Q236.44 45.25 233.83 45.25Q232.12 45.25 230.89 46.14Q229.66 47.04 229 48.74Q228.34 50.43 228.34 52.85V70H221.71V52.85Q221.71 49.19 220.58 47.22Q219.45 45.25 216.7 45.25Q214.99 45.25 213.76 46.14Q212.54 47.04 211.86 48.75Q211.18 50.47 211.18 52.85V70ZM252.85 78.4V40.1H259.7L259.86 46.46L259.16 46.14Q260.28 42.86 262.83 41.14Q265.38 39.42 268.77 39.42Q273.04 39.42 275.86 41.54Q278.67 43.66 280.08 47.2Q281.48 50.74 281.48 55.05Q281.48 59.34 280.07 62.89Q278.65 66.44 275.82 68.56Q273 70.67 268.73 70.67Q266.5 70.67 264.57 69.88Q262.64 69.08 261.26 67.64Q259.89 66.19 259.32 64.22L260.01 63.66V78.4ZM267.05 64.87Q270.31 64.87 272.19 62.26Q274.07 59.65 274.07 55.05Q274.07 50.44 272.19 47.84Q270.31 45.23 267.05 45.23Q264.88 45.23 263.3 46.32Q261.73 47.42 260.87 49.62Q260.01 51.81 260.01 55.05Q260.01 58.28 260.85 60.48Q261.69 62.68 263.28 63.77Q264.88 64.87 267.05 64.87ZM298.44 70Q293.98 70 291.88 67.94Q289.78 65.88 289.78 61.44V33.08H296.95V60.75Q296.95 62.85 297.86 63.65Q298.77 64.44 300.64 64.44H304.85V70ZM285.1 45.65V40.1H304.85V45.65ZM322.25 70.67Q317.83 70.67 314.51 68.75Q311.2 66.82 309.37 63.3Q307.55 59.77 307.55 55.05Q307.55 50.29 309.37 46.79Q311.2 43.3 314.51 41.36Q317.83 39.42 322.25 39.42Q326.68 39.42 329.98 41.36Q333.27 43.3 335.1 46.79Q336.92 50.29 336.92 55.05Q336.92 59.77 335.1 63.3Q333.27 66.82 329.98 68.75Q326.68 70.67 322.25 70.67ZM322.25 64.87Q325.71 64.87 327.61 62.28Q329.51 59.68 329.51 55.05Q329.51 50.43 327.61 47.83Q325.71 45.23 322.25 45.23Q318.79 45.23 316.88 47.83Q314.96 50.43 314.96 55.05Q314.96 59.68 316.88 62.28Q318.79 64.87 322.25 64.87ZM341.94 70V40.1H349.11V70ZM341.81 36.1V29.76H349.24V36.1ZM355.89 70V40.1H362.58L362.85 48.41L362.27 48.26Q362.94 43.96 364.81 42.03Q366.67 40.1 369.9 40.1H372.68V46.23H369.89Q367.58 46.23 366.07 46.91Q364.57 47.59 363.81 49.02Q363.05 50.44 363.05 52.77V70Z" style={{ fill: 'var(--ink, currentColor)' }}/></svg></span>
          <span className={`border-l border-[var(--border)] pl-3 text-[13px] uppercase leading-5 tracking-[0.04em] text-[var(--text-muted)] ${mono}`}>Caisse pour restaurants</span>
        </p>
        <h2 id="lc-title" className="m-0 max-w-[20ch] text-[clamp(1.875rem,1.2rem+2.4vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-[var(--text-strong)] [text-wrap:balance]">Du premier couvert à la clôture, une seule caisse.</h2>
      </header>

      <div className="mx-auto grid max-w-[1200px] grid-cols-1 min-[860px]:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] min-[860px]:gap-[clamp(32px,6vw,96px)]">
        <ol className={`m-0 list-none p-0 ${cote === 'gauche' ? 'min-[860px]:order-2' : ''}`}>
          {STEPS.map((s, k) => (
            <li key={s.t} ref={(el) => (items.current[k] = el)}
              className={`relative grid content-start gap-2 py-8 pl-6 min-[860px]:content-center min-[860px]:py-6 min-[860px]:pl-8 ${k === 0 ? 'min-[860px]:content-start min-[860px]:pt-24' : ''}`}
              style={{ minHeight: `calc(var(--lc-h) * ${k === 4 ? 1 : 0.75}vh)` }}>
              <button type="button" aria-label={`Afficher l’étape : ${s.a}`} aria-current={active === k ? 'step' : undefined} onClick={() => jump(k)}
                className="absolute inset-0 z-[1] w-full cursor-pointer rounded-xl border-0 bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]" />
              <span ref={(el) => (bars.current[k] = el)} aria-hidden="true" className={`absolute bottom-8 left-0 w-0.5 overflow-hidden rounded bg-[var(--border)] min-[860px]:bottom-6 ${k === 0 ? 'top-8 min-[860px]:top-24' : 'top-8 min-[860px]:top-6'}`}>
                <i className={`absolute inset-0 origin-top rounded bg-[var(--accent)] ${progression ? '' : 'hidden'}`} />
                {!progression && active === k && <i className="absolute inset-0 rounded bg-[var(--accent)]" />}
              </span>
              {numeros && <p className={`m-0 text-[13px] leading-5 transition-colors duration-[400ms] ${mono} ${active === k ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>{String(k + 1).padStart(2, '0')}</p>}
              <h3 className={`m-0 text-[clamp(1.25rem,1.05rem+.7vw,1.75rem)] font-semibold leading-[1.2] tracking-[-0.02em] transition-colors duration-[400ms] ${active === k ? 'text-[var(--text-strong)]' : 'text-[var(--text-muted)]'}`}>{s.t}</h3>
              <p className={`m-0 max-w-[44ch] text-base leading-[26px] transition-colors duration-[400ms] ${active === k ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>{s.d}</p>
            </li>
          ))}
        </ol>

        <div ref={aside} className={`sticky top-0 z-[2] -mx-4 -order-1 bg-[var(--bg)] px-4 pb-4 pt-2 after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-6 after:h-6 after:bg-gradient-to-b after:from-[var(--bg)] after:content-[''] min-[860px]:after:hidden min-[860px]:static min-[860px]:mx-0 min-[860px]:p-0 min-[860px]:bg-transparent ${cote === 'gauche' ? 'min-[860px]:order-1' : 'min-[860px]:order-2'}`}>
          <div className="min-[860px]:sticky min-[860px]:top-[max(24px,calc(50vh-280px))]">
            <figure aria-label="Aperçu de l’écran Comptoir" className="m-0 rounded-[20px] border border-[var(--border)] bg-[var(--raised)] p-2 min-[860px]:rounded-3xl min-[860px]:p-3">
              <div aria-hidden="true" className="flex items-center justify-between gap-3 px-1.5 pb-2 pt-0.5 text-[13px] text-[var(--text-muted)] min-[860px]:px-2 min-[860px]:pb-3 min-[860px]:pt-1">
                <span className="inline-flex items-center gap-2 font-medium text-[var(--text)]"><i className="h-2 w-2 rounded-full bg-[var(--up)]" />Comptoir · Le Petit Zinc</span>
                <span className={`tabular-nums ${mono}`}><b className="font-semibold text-[var(--text-strong)]">{String(active + 1).padStart(2, '0')}</b> / 05</span>
              </div>
              <div className="relative h-[min(40svh,300px)] overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface)] min-[860px]:aspect-[4/3.2] min-[860px]:h-auto min-[860px]:rounded-2xl">
                {SCENES.map((scene, k) => (
                  <div key={k} role="img" aria-label={STEPS[k].alt} aria-hidden={active !== k}
                    className={`absolute inset-0 flex flex-col gap-2.5 p-3.5 min-[860px]:gap-4 min-[860px]:p-[clamp(16px,2.4vw,28px)] ${EASE} motion-reduce:transition-none
                      ${active === k ? 'visible translate-y-0 scale-100 opacity-100 transition-[opacity,transform] delay-75 duration-[520ms,800ms]'
                        : `invisible opacity-0 transition-[opacity,transform,visibility] duration-[420ms,700ms,0ms] ${transition === 'fondu' ? '' : k < active ? '-translate-y-6 scale-[.985]' : 'translate-y-6 scale-[.985]'}`}`}>
                    {scene(active === k)}
                  </div>
                ))}
              </div>
              <div aria-hidden="true" className="flex justify-center gap-1.5 pt-2 min-[860px]:pt-3">
                {STEPS.map((_, k) => <i key={k} className={`h-1.5 rounded-full transition-[width,background-color,opacity] duration-500 ${EASE} ${active === k ? 'w-5 bg-[var(--accent)]' : 'w-1.5 bg-[var(--border-strong)] opacity-50'}`} />)}
              </div>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ListeCollante;
