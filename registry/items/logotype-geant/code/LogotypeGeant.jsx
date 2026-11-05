// LogotypeGeant.jsx — footer signé par le nom de la marque sur toute la largeur. Sous le pointeur, les lettres prennent
// de la graisse, se soulèvent et s'étirent, chacune sur son ressort ; au repos, une vague traverse le mot.
// Chaque lettre garde une case de largeur fixe : sa graisse change, sa largeur est compensée (scaleX), le mot ne bouge pas.
// React 18, Tailwind 3.4, tokens.css chargé, police variable (Geist). Sans bibliothèque : styles écrits hors rendu React.
// Exemple : Ressac (maillots de bain et surf, marque fictive).
// Utilisation :
//   <LogotypeGeant word="ressac" effect="elastique" radius={260} minWeight={300} maxWeight={900} stiffness={180} damping={13} idleWave />
import { useEffect, useRef } from 'react';

const STEPS = [100, 200, 300, 400, 500, 600, 700, 800, 900];
const COLS = [
  { title: 'Boutique', links: ['Maillots femme', 'Maillots homme', 'Combinaisons', 'Ponchos et serviettes'] },
  { title: 'Ressac', links: ['L’atelier d’Hossegor', 'Matières recyclées', 'Journal'] },
  { title: 'Aide', links: ['Livraison et retours', 'Guide des tailles', 'Nous écrire'] },
];

/**
 * @param {{ word?: string, effect?: 'elastique'|'soulevement'|'graisse', radius?: number, minWeight?: number,
 *   maxWeight?: number, stiffness?: number, damping?: number, idleWave?: boolean, className?: string }} props
 */
export default function LogotypeGeant({
  word = 'ressac',
  effect = 'elastique',
  radius = 260,
  minWeight = 300,
  maxWeight = 900,
  stiffness = 180,
  damping = 13,
  idleWave = true,
  className = '',
}) {
  const wordRef = useRef(null), stageRef = useRef(null);
  const cfg = useRef({});
  cfg.current = { effect, radius, min: minWeight, max: maxWeight, k: stiffness, c: damping, wave: idleWave };
  const letters = Array.from(word);

  useEffect(() => {
    const el = wordRef.current, stage = stageRef.current;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = document.createElement('canvas').getContext('2d');
    const fam = getComputedStyle(el).fontFamily;
    let L = [], fs = 100, raf = 0, last = 0, visible = true, pointer = null, wave = null, timer = 0, alive = true;

    const widthAt = (l, wt) => { const t = (Math.max(100, Math.min(900, wt)) - 100) / 100, i = Math.min(7, Math.floor(t)); return l.w[i] + (l.w[i + 1] - l.w[i]) * (t - i); };
    const base = () => (reduce ? 600 : cfg.current.min);

    /* Calage : à sa graisse de repos, le mot remplit exactement la largeur disponible. */
    const fit = () => {
      if (!L.length) return;
      const sum = L.reduce((a, l) => a + widthAt(l, base()), 0);
      fs = (el.clientWidth / sum) * 100 * 0.995;
      el.style.fontSize = `${fs.toFixed(2)}px`;
      let acc = el.getBoundingClientRect().left;
      L.forEach((l) => { l.slot = (widthAt(l, base()) * fs) / 100; l.node.style.width = `${l.slot.toFixed(2)}px`; l.cx = acc + l.slot / 2; acc += l.slot; });
      paint(); el.style.visibility = 'visible';
    };
    const paint = () => {
      const { effect: fx, max } = cfg.current, lift = fx === 'graisse' ? 0 : fs * 0.07, stretch = fx === 'elastique' ? 0.1 : 0;
      L.forEach((l) => {
        const s = Math.max(-0.25, Math.min(1.25, l.s)), wt = Math.max(100, Math.min(900, base() + (max - base()) * s));
        const g = l.node.firstChild, sx = l.slot / ((widthAt(l, wt) * fs) / 100);
        g.style.fontVariationSettings = `"wght" ${wt.toFixed(0)}`;
        g.style.transform = `translate3d(0,${(-lift * s).toFixed(2)}px,0) scale(${sx.toFixed(4)},${(1 + stretch * s).toFixed(4)})`;
        g.style.color = s > 0.02 ? `color-mix(in oklab, var(--text-strong), var(--accent) ${Math.round(Math.min(1, s) * 100)}%)` : '';
      });
    };
    const influence = (l, x) => { const d = (l.cx - x) / cfg.current.radius; return Math.exp(-d * d * 1.6); };

    const tick = (now) => {
      raf = 0;
      const dt = Math.min(0.034, (now - (last || now)) / 1000) || 0.016; last = now;
      const { k, c } = cfg.current;
      let crest = null;
      if (wave) {
        const p = (now - wave.t0) / 1500;
        if (p >= 1) { wave = null; schedule(); }
        else { const r = el.getBoundingClientRect(); crest = r.left - cfg.current.radius + p * (r.width + cfg.current.radius * 2); }
      }
      let moving = false;
      L.forEach((l) => {
        let t = pointer ? influence(l, pointer) : 0;
        if (crest != null) t = Math.max(t, influence(l, crest) * 0.85);
        l.v += (-k * (l.s - t) - c * l.v) * dt; l.s += l.v * dt;
        if (Math.abs(l.s - t) > 0.001 || Math.abs(l.v) > 0.001) moving = true;
      });
      paint();
      if ((moving || pointer != null || wave) && visible) raf = requestAnimationFrame(tick); else last = 0;
    };
    const wake = () => { if (!raf && visible && !reduce) { last = 0; raf = requestAnimationFrame(tick); } };
    const startWave = () => { if (!reduce) { wave = { t0: performance.now() }; wake(); } };
    /* Vague au repos toutes les 7 s, seulement à l'écran et si personne ne touche le mot. */
    const schedule = () => { clearTimeout(timer); if (cfg.current.wave && visible && !reduce) timer = setTimeout(() => (pointer == null ? startWave() : schedule()), 7000); };

    const footer = stage.closest('footer');
    const onMove = (e) => { if (e.pointerType === 'touch' && !stage.contains(e.target)) return; pointer = e.clientX; wake(); };
    const onLeave = () => { pointer = null; wake(); schedule(); };
    const onDown = (e) => { if (e.pointerType !== 'mouse') { pointer = e.clientX; wake(); } };
    const onUp = (e) => { if (e.pointerType !== 'mouse') onLeave(); };
    footer.addEventListener('pointermove', onMove);
    footer.addEventListener('pointerleave', onLeave);
    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) { schedule(); if (cfg.current.wave) setTimeout(startWave, 400); } else { clearTimeout(timer); cancelAnimationFrame(raf); raf = 0; }
    });
    const ro = new ResizeObserver(fit);

    /* Largeur de chaque lettre à chaque graisse, mesurée au canvas une fois la police chargée. */
    document.fonts.load(`300 100px ${fam}`).then(() => document.fonts.ready).then(() => {
      if (!alive) return;
      L = [...el.children].map((node) => ({
        node, s: 0, v: 0, slot: 0, cx: 0,
        w: STEPS.map((s) => { ctx.font = `${s} 100px ${fam}`; return ctx.measureText(node.textContent).width; }),
      }));
      fit(); ro.observe(el); io.observe(stage);
    });
    return () => {
      alive = false; cancelAnimationFrame(raf); clearTimeout(timer); io.disconnect(); ro.disconnect();
      footer.removeEventListener('pointermove', onMove); footer.removeEventListener('pointerleave', onLeave);
      stage.removeEventListener('pointerdown', onDown); stage.removeEventListener('pointerup', onUp); stage.removeEventListener('pointercancel', onUp);
    };
  }, [word, minWeight]);

  const caps = 'font-mono text-xs font-medium uppercase tracking-[.04em] text-[var(--text-muted)]';
  return (
    <footer aria-labelledby="lg-news-t" className={`relative overflow-hidden border-t border-[var(--border)] bg-[var(--surface)] px-4 pt-12 font-sans text-[var(--text)] md:px-8 md:pt-16 ${className}`}>
      <div className="grid gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16">
        <form onSubmit={(e) => { e.preventDefault(); e.currentTarget.querySelector('[role=status]').textContent = 'Merci ! Première marée le 1er décembre.'; }}>
          <h2 id="lg-news-t" className="m-0 text-[length:var(--t-page)] font-semibold leading-tight tracking-[-.02em] text-[var(--text-strong)]">La marée du mois</h2>
          <p className="m-0 mt-3 max-w-[44ch] text-base text-[var(--text-muted)] md:text-sm">Un e-mail par mois : les prévisions de houle, une nouvelle pièce de l’atelier et les fins de série avant tout le monde.</p>
          <div className="mt-6 flex max-w-none gap-2 rounded-full border border-[var(--border-control)] bg-[var(--bg)] p-1 focus-within:border-[var(--focus-ring)] md:max-w-[440px]">
            <label htmlFor="lg-mail" className="sr-only">Adresse e-mail</label>
            <input id="lg-mail" type="email" required autoComplete="email" placeholder="vous@exemple.fr"
              className="h-11 min-w-0 flex-1 bg-transparent px-4 text-base text-[var(--text-strong)] outline-none placeholder:text-[var(--text-muted)] md:h-10" />
            <button type="submit" className="h-11 flex-none rounded-full bg-[var(--accent)] px-5 text-sm font-medium text-[var(--accent-fg)] transition hover:bg-[var(--accent-hover)] active:scale-[.97] md:h-10">S’inscrire</button>
          </div>
          <p role="status" aria-live="polite" className="m-0 mt-2 min-h-[22px] text-sm text-[var(--text-strong)]" />
        </form>

        <nav aria-label="Plan du site" className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-8">
          {COLS.map((col, i) => (
            <div key={col.title} className={i === 0 ? 'col-span-2 md:col-span-1' : ''}>
              <h3 className={`m-0 mb-4 ${caps}`}>{col.title}</h3>
              <ul role="list" className={`m-0 grid list-none gap-1 p-0 ${i === 0 ? 'grid-cols-2 gap-x-4 md:grid-cols-1' : ''}`}>
                {col.links.map((l) => (
                  <li key={l}><a href="#" className="inline-flex min-h-[44px] items-center text-base underline-offset-4 hover:text-[var(--text-strong)] hover:underline md:min-h-8 md:text-sm">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="mt-10 flex flex-col gap-2 border-t border-[var(--border)] py-5 text-sm text-[var(--text-muted)] md:mt-16 md:flex-row md:flex-wrap md:justify-between md:gap-x-8 md:text-xs">
        <p className="m-0"><span aria-hidden="true" className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[var(--up)] align-[2px]" />Expédié sous 48 h depuis Hossegor · Retours gratuits 30 jours</p>
        <p className="m-0 flex flex-wrap gap-x-4 gap-y-1">
          <span className="basis-full md:basis-auto">© 2026 Ressac (marque fictive)</span>
          <a href="#" className="inline-flex min-h-[44px] items-center hover:text-[var(--text-strong)] md:min-h-0">Mentions légales</a>
          <a href="#" className="inline-flex min-h-[44px] items-center hover:text-[var(--text-strong)] md:min-h-0">CGV</a>
        </p>
      </div>

      {/* Le mot : lu une fois (role="img"), lettres décoratives. Le doigt glisse dessus, le défilement vertical reste libre. */}
      <div ref={stageRef} className="relative -mx-4 touch-pan-y select-none px-4 md:-mx-8 md:px-8">
        <p ref={wordRef} role="img" aria-label={word}
          className="invisible m-0 flex justify-between whitespace-nowrap pb-[.05em] text-[20vw] font-light leading-[.76] text-[var(--text-strong)] motion-reduce:font-semibold">
          {letters.map((ch, i) => (
            <span key={`${ch}-${i}`} aria-hidden="true" className="block flex-none text-center">
              <span className="block origin-bottom will-change-transform">{ch}</span>
            </span>
          ))}
        </p>
      </div>
    </footer>
  );
}
