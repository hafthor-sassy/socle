// Hero typographique — React + Tailwind CSS. Couleurs : uniquement les variables de tokens.css (suit la palette).
// Aucune dépendance d’animation : transitions CSS pilotées par l’état. Marque fictive : Fugue (studio de design de marque).
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const EASE = 'cubic-bezier(.16,1,.3,1)'; // expo-out : départ vif, pose très douce

const ENTREES = {
  montee: { transform: 'translateY(105%)' },
  flou: { transform: 'translateY(24%)', filter: 'blur(16px)', opacity: 0 },
  bascule: { transform: 'translateY(100%) rotate(6deg)', transformOrigin: '0 100%' },
};

function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setR(m.matches); on();
    m.addEventListener('change', on); return () => m.removeEventListener('change', on);
  }, []);
  return r;
}

/** Regroupe les mots par ligne réelle (offsetTop), recalculé quand la largeur change. */
function useLines(words, ref) {
  const [lines, setLines] = useState([words]);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const measure = () => {
      const spans = [...el.querySelectorAll('[data-measure] > span')]; // un span par mot
      const out = []; let top = null;
      spans.forEach((s, i) => { if (top === null || Math.abs(s.offsetTop - top) > 4) { out.push([]); top = s.offsetTop; } out[out.length - 1].push(words[i]); });
      setLines(out.length ? out : [words]);
    };
    measure();
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => ro.disconnect();
  }, [words.join(' ')]);
  return lines;
}

function Word({ w, accent, trait, play, delay }) {
  const bare = w.toLowerCase().replace(/[.,;:!?…»«"’]/g, '');
  if (!accent || bare !== accent.toLowerCase()) return <span className="inline-block whitespace-nowrap">{w}</span>;
  const core = w.replace(/[.,;:!?…]+$/, ''); const tail = w.slice(core.length);
  return (
    <span className="inline-block whitespace-nowrap">
      <span className="relative text-[var(--accent)]">
        {core}
        {trait && (
          <svg viewBox="0 0 400 22" preserveAspectRatio="none" className="pointer-events-none absolute -left-[1%] bottom-[-.07em] h-[.2em] w-[102%] overflow-visible">
            <path pathLength="1" d="M4 15C90 7 200 5 396 11" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round"
              style={{ strokeDasharray: 1, strokeDashoffset: play ? 0 : 1, transition: `stroke-dashoffset 900ms cubic-bezier(.65,0,.35,1) ${delay}ms` }} />
          </svg>
        )}
      </span>
      {tail}
    </span>
  );
}

export function HeroTypographique({
  titre = 'Des marques qui tiennent la distance.',
  motAccent = 'distance',
  entree = 'montee',          // 'montee' | 'flou' | 'bascule'
  duree = 1100,               // ms, par ligne
  decalage = 110,             // ms entre deux lignes
  align = 'gauche',           // 'gauche' | 'centre'
  trait = true,               // trait dessiné sous le mot accentué
  cta = 'Démarrer un projet',
  href = '#contact',
}) {
  const reduce = useReducedMotion();
  const words = titre.trim().split(/\s+/);
  const titleRef = useRef(null);
  const rootRef = useRef(null);
  const lines = useLines(words, titleRef);
  const [play, setPlay] = useState(false);
  const [time, setTime] = useState('');

  // L’entrée part quand le hero devient visible ; elle rejoue si le titre ou le style changent.
  useEffect(() => {
    setPlay(false);
    if (reduce) { setPlay(true); return; }
    const r = rootRef.current.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {           // déjà à l’écran (cas normal d’un hero)
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setPlay(true)));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { io.disconnect(); requestAnimationFrame(() => requestAnimationFrame(() => setPlay(true))); }
    }, { threshold: 0.2 });
    io.observe(rootRef.current);
    return () => io.disconnect();
  }, [titre, entree, duree, decalage, reduce]);

  // Heure locale du studio, à la minute.
  useEffect(() => {
    let t;
    const tick = () => {
      setTime(new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).format(new Date()));
      t = setTimeout(tick, 60000 - (Date.now() % 60000));
    };
    tick(); return () => clearTimeout(t);
  }, []);

  const after = 120 + lines.length * decalage + duree * 0.35;
  const fade = (i) => ({
    opacity: play ? 1 : 0, transform: play ? 'none' : 'translateY(16px)',
    transition: reduce ? 'none' : `opacity 900ms ${EASE} ${i < 0 ? 0 : after + 120 + i * 90}ms, transform 900ms ${EASE} ${i < 0 ? 0 : after + 120 + i * 90}ms`,
  });
  const centre = align === 'centre';

  return (
    <section ref={rootRef} aria-labelledby="htp-titre"
      className="relative isolate flex min-h-[max(100svh,560px)] flex-col overflow-hidden bg-[var(--bg)] px-4 pb-6 pt-3 [font-family:var(--font-sans)] text-[var(--text)] min-[900px]:px-[clamp(16px,4vw,64px)] min-[900px]:pb-12 min-[900px]:pt-6">
      <header className="flex min-h-11 items-center justify-between gap-4">
        <a href="#" aria-label="Fugue, accueil"
          className="inline-flex min-h-11 items-center rounded-lg text-[var(--text-strong)] [--a:var(--accent-subtle)] [--ink:var(--text-strong)] [--lt:var(--accent-fg)] [--p:var(--accent)]">
          <svg viewBox="0 0 295 100" aria-hidden="true" focusable="false" className="block h-7 w-auto"><g data-role="icone"><rect width="100" height="100" rx="28" style={{ fill: 'var(--p, currentColor)' }}/><rect x="26" y="24" width="13" height="52" rx="6.5" style={{ fill: 'var(--lt, #fff)' }}/><rect x="26" y="24" width="48" height="13" rx="6.5" style={{ fill: 'var(--lt, #fff)' }}/><rect x="45" y="44" width="25" height="13" rx="6.5" style={{ fill: 'var(--lt, #fff)' }}/><circle cx="70" cy="70" r="6.5" style={{ fill: 'var(--a, var(--lt, #fff))' }}/></g><path data-role="nom" d="M132.48 70V30.24H159.09V36.58H135.81L139.76 32.5V50.74L135.81 47.44H158.08V53.69H135.81L139.76 50.4V70ZM174.26 70.67Q169.7 70.67 167.06 67.68Q164.42 64.68 164.42 59.35V40.1H171.59V57.59Q171.59 61.34 172.83 63.1Q174.07 64.85 176.65 64.85Q179.55 64.85 181.17 62.92Q182.78 60.98 182.78 57.3V40.1H189.95V70H183.36L183.2 61.79L184.13 62.07Q183.42 66.29 180.9 68.48Q178.38 70.67 174.26 70.67ZM209.47 79.07Q205.54 79.07 202.75 78.01Q199.96 76.94 198.25 75.02Q196.53 73.09 195.87 70.58L203.26 70.07Q203.8 71.74 205.2 72.69Q206.59 73.65 209.47 73.65Q212.81 73.65 214.59 72.16Q216.38 70.67 216.38 67.51V63.75Q215.32 65.92 212.96 67.23Q210.61 68.54 207.7 68.54Q203.99 68.54 201.11 66.72Q198.22 64.89 196.61 61.62Q194.99 58.35 194.99 54.02Q194.99 49.72 196.59 46.44Q198.19 43.16 201.04 41.29Q203.89 39.42 207.56 39.42Q210.81 39.42 213.16 40.88Q215.51 42.34 216.6 44.76V40.1H223.59V67.36Q223.59 71.19 221.83 73.8Q220.08 76.42 216.91 77.74Q213.74 79.07 209.47 79.07ZM209.38 62.92Q212.58 62.92 214.49 60.54Q216.39 58.16 216.42 53.97Q216.46 51.18 215.6 49.18Q214.74 47.19 213.15 46.1Q211.55 45.02 209.38 45.02Q206.06 45.02 204.23 47.45Q202.4 49.87 202.4 53.97Q202.4 58.09 204.29 60.51Q206.18 62.92 209.38 62.92ZM240.17 70.67Q235.61 70.67 232.97 67.68Q230.33 64.68 230.33 59.35V40.1H237.5V57.59Q237.5 61.34 238.74 63.1Q239.98 64.85 242.56 64.85Q245.47 64.85 247.08 62.92Q248.69 60.98 248.69 57.3V40.1H255.86V70H249.27L249.12 61.79L250.05 62.07Q249.33 66.29 246.81 68.48Q244.29 70.67 240.17 70.67ZM275.54 70.67Q271.07 70.67 267.78 68.75Q264.49 66.82 262.7 63.3Q260.9 59.77 260.9 55.05Q260.9 50.32 262.7 46.83Q264.49 43.33 267.75 41.38Q271 39.42 275.4 39.42Q279.67 39.42 282.87 41.33Q286.08 43.24 287.83 46.83Q289.58 50.41 289.58 55.44V57.04H268.34Q268.55 61 270.48 62.97Q272.41 64.94 275.63 64.94Q278.02 64.94 279.61 63.87Q281.19 62.8 281.83 60.83L289.16 61.29Q287.96 65.62 284.34 68.15Q280.71 70.67 275.54 70.67ZM268.34 52.23H282.15Q281.92 48.59 280.09 46.83Q278.26 45.07 275.4 45.07Q272.52 45.07 270.65 46.91Q268.77 48.75 268.34 52.23Z" style={{ fill: 'var(--ink, currentColor)' }}/></svg>
        </a>
        <p className="m-0 inline-flex items-center gap-2 [font-family:var(--font-mono)] text-[13px] tabular-nums text-[var(--text-muted)]">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--up)] motion-safe:animate-pulse" />
          <span className="hidden min-[900px]:inline">Studio à Lyon ·</span>
          <time>{time}</time>
        </p>
      </header>

      <div className={`flex flex-1 flex-col justify-center gap-[clamp(24px,3.2vw,40px)] pt-[clamp(32px,5vw,64px)] ${centre ? 'items-center text-center' : ''}`}>
        <p style={fade(-1)} className="m-0 [font-family:var(--font-mono)] text-[13px] uppercase leading-5 tracking-[0.04em] text-[var(--text-muted)]">
          <span className="text-[var(--text-strong)]">(01)</span> Identités, sites et systèmes de marque depuis 2014
        </p>

        <h1 id="htp-titre" ref={titleRef}
          className={`relative m-0 text-[clamp(3.25rem,0.9rem+8.6vw,9.5rem)] font-semibold leading-[.94] tracking-[-0.045em] text-[var(--text-strong)] min-[900px]:max-w-[14ch] ${centre ? 'mx-auto' : ''}`}>
          <span className="sr-only">{titre}</span>
          {/* Copie invisible qui sert à mesurer les lignes réelles */}
          <span data-measure aria-hidden="true" className="pointer-events-none invisible absolute inset-x-0 top-0">
            {words.map((w, i) => <span key={i} className="inline-block whitespace-nowrap">{w}</span>).reduce((a, el, i) => (i ? [...a, ' ', el] : [el]), [])}
          </span>
          <span aria-hidden="true">
            {lines.map((ws, li) => (
              <span key={li} className="-mb-[.16em] block overflow-clip pb-[.16em]">
                <span className="inline-block will-change-transform"
                  style={play ? { transform: 'none', filter: 'none', opacity: 1,
                      transition: reduce ? 'none' : `transform ${duree}ms ${EASE} ${120 + li * decalage}ms, filter ${duree}ms ${EASE} ${120 + li * decalage}ms, opacity ${duree * 0.7}ms ${EASE} ${120 + li * decalage}ms` }
                    : reduce ? {} : ENTREES[entree]}>
                  {ws.map((w, i) => (
                    <span key={i}><Word w={w} accent={motAccent} trait={trait} play={play} delay={after} />{i < ws.length - 1 ? ' ' : ''}</span>
                  ))}
                </span>
              </span>
            ))}
          </span>
        </h1>

        <div className={`grid items-end gap-6 border-t border-[var(--border)] min-[900px]:pt-6 ${centre ? 'justify-items-center' : 'min-[900px]:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_auto] min-[900px]:gap-12'}`}>
          <p style={fade(0)} className="m-0 max-w-[46ch] text-base leading-6 min-[900px]:pt-4 min-[900px]:text-[17px] min-[900px]:leading-[26px]">
            Nous dessinons des identités qui restent justes dix ans plus tard : un nom, un logo, une typographie et les règles pour que votre équipe les applique seule.
          </p>
          <dl style={fade(1)} className="m-0 grid grid-cols-2 items-start gap-4 min-[900px]:pt-4">
            {[['126', 'Marques accompagnées'], ['6 ans', 'Durée moyenne d’une collaboration']].map(([v, l]) => (
              <div key={l} className="flex flex-col-reverse justify-end gap-2">
                <dt className="text-sm leading-5 text-[var(--text-muted)]">{l}</dt>
                <dd className="m-0 text-[32px] font-semibold leading-none tracking-[-0.03em] text-[var(--text-strong)] tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          <div style={fade(2)} className={`-order-1 grid gap-3 pt-6 min-[900px]:order-none min-[900px]:pt-0 ${centre ? 'justify-items-center text-center' : 'min-[900px]:justify-items-end min-[900px]:text-right'}`}>
            <a href={href}
              className="group inline-flex min-h-14 w-full items-center justify-between gap-4 rounded-full bg-[var(--accent)] py-2 pl-6 pr-2 text-[17px] font-semibold tracking-[-0.01em] text-[var(--accent-fg)] no-underline transition-[background-color,transform] duration-200 hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--focus-ring)] active:scale-[.98] min-[900px]:w-auto min-[900px]:min-w-[264px]">
              <span>{cta}</span>
              <span aria-hidden="true" className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--accent-fg)_16%,transparent)]">
                {[0, 1].map((k) => (
                  <svg key={k} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
                    className={`col-start-1 row-start-1 transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${k ? '-translate-x-[160%] group-hover:translate-x-0 group-focus-visible:translate-x-0' : 'group-hover:translate-x-[160%] group-focus-visible:translate-x-[160%]'}`}>
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                ))}
              </span>
            </a>
            <p className="m-0 text-sm leading-5 text-[var(--text-muted)]">Réponse sous 48 h · 2 places pour janvier</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroTypographique;
