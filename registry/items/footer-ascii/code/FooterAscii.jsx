// FooterAscii.jsx — footer dont le logo (pictogramme + nom) est rendu en caractères dans un canvas 2D.
// Bords orientés (- / | \), densité qui suit la forme ; au survol, les caractères se brouillent puis se recomposent,
// un clic ou un toucher envoie une onde. React 18, Tailwind 3.4, tokens.css chargé. Sans bibliothèque.
// Exemple : Glyphe (studio de jeux vidéo indépendant, marque fictive).
// Utilisation :
//   <FooterAscii word="glyphe" cell={9} charset="classique" color="encre" radius={120} motif="logo" edges shimmer grid />
import { useEffect, useRef } from 'react';

const SETS = {
  classique: { ramp: ' .:-=+*#%@', scramble: '!<>-_\\/[]{}=+*^?#%&$@' },
  blocs: { ramp: ' ░▒▓█', scramble: '░▒▓█▚▞▙▟▛▜' },
  binaire: { ramp: ' .01', scramble: '01' },
};
const PIXEL_G = [[0, 1], [0, 2], [0, 3], [0, 4], [1, 0], [2, 0], [2, 3], [2, 4], [3, 0], [3, 4], [4, 1], [4, 2], [4, 3], [4, 4]];

/* Moteur : échantillonne la forme, dessine l'image de base une fois, puis seulement les cellules actives. */
function createAscii(art, canvas, getOpts) {
  const g = canvas.getContext('2d'), base = document.createElement('canvas'), bg = base.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cs = getComputedStyle(art), sans = cs.getPropertyValue('--font-sans').trim() || 'sans-serif', mono = cs.getPropertyValue('--font-mono').trim() || 'monospace';
  let o = getOpts(), cols = 0, rows = 0, cw = 9, ch = 15, dpr = 1, W = 0, H = 0, cell = [], heat = new Float32Array(0), hot = new Set();
  let colors = {}, raf = 0, last = 0, frame = 0, visible = true, pointer = null, waves = [], shimmerAt = 0;

  const readColors = () => {
    const s = getComputedStyle(art), v = (n) => s.getPropertyValue(n).trim();
    const ink = v('--text-strong'), acc = v('--accent');
    colors = { trame: v('--border'), faint: v('--text-muted'), shape: o.color === 'accent' ? acc : ink,
      edge: o.color === 'mono' ? ink : acc, hot: o.color === 'accent' ? ink : o.color === 'mono' ? v('--text-muted') : acc };
  };

  const sample = () => {
    const S = 4, mw = cols * S, cellH = (ch / cw) * S;
    const m = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    m.font = `800 100px ${sans}`;
    const mt = m.measureText(o.word), asc = mt.actualBoundingBoxAscent || 74, desc = mt.actualBoundingBoxDescent || 22;
    const logo = o.motif === 'logo', icon = logo ? (asc + desc) * 0.92 : 0, gap = logo ? 26 : 0;
    const F = (mw * 0.94) / (icon + gap + mt.width), contentH = (asc + desc) * F, mh = Math.ceil(contentH / cellH + 2) * cellH;
    rows = Math.round(mh / cellH);
    m.canvas.width = mw; m.canvas.height = Math.ceil(mh);
    m.fillStyle = colors.shape; // masque interne : seule la couverture (alpha) compte
    const x0 = mw * 0.03, top = (mh - contentH) / 2;
    if (logo) {
      const u = (icon * F) / 5.4;
      PIXEL_G.forEach(([r, c]) => { m.beginPath(); (m.roundRect || m.rect).call(m, x0 + (c * 1.1 + 0.1) * u, top + (r * 1.1 + 0.1) * u, u, u, u * 0.18); m.fill(); });
    }
    m.font = `800 ${100 * F}px ${sans}`;
    m.fillText(o.word, x0 + (icon + gap) * F, top + asc * F);
    const data = m.getImageData(0, 0, m.canvas.width, m.canvas.height).data, cov = new Float32Array(cols * rows);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const y0 = Math.floor(r * cellH), y1 = Math.min(m.canvas.height, Math.floor((r + 1) * cellH)); let sum = 0, n = 0;
      for (let y = y0; y < y1; y++) for (let x = c * S; x < c * S + S; x++) { sum += data[(y * mw + x) * 4 + 3]; n++; }
      cov[r * cols + c] = n ? sum / n / 255 : 0;
    }
    const ramp = SETS[o.charset].ramp, at = (c, r) => (c < 0 || r < 0 || c >= cols || r >= rows ? 0 : cov[r * cols + c]);
    cell = new Array(cols * rows);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const k = cov[r * cols + c]; let glyph = ' ', kind = 0;
      const gx = (at(c + 1, r) - at(c - 1, r)) / cw, gy = (at(c, r + 1) - at(c, r - 1)) / ch, mag = Math.hypot(gx, gy) * cw;
      if (k > 0.06) {
        let sum5 = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) sum5 += at(c + dx, r + dy);
        const q = k * (0.55 + 0.45 * Math.pow(sum5 / 15, 1.3));
        kind = 1; glyph = ramp[Math.min(ramp.length - 1, 1 + Math.floor(q * (ramp.length - 1)))];
        if (o.edges && o.charset === 'classique' && mag > 0.32 && k < 0.9) {
          const a = ((Math.atan2(gy, gx) * 180) / Math.PI + 450) % 180;
          glyph = a < 22.5 || a >= 157.5 ? '-' : a < 67.5 ? '\\' : a < 112.5 ? '|' : '/'; kind = 2;
        }
      } else if (o.grid && (r + c) % 2 === 0 && r % 2 === 0) { glyph = '·'; kind = 3; }
      cell[r * cols + c] = { ch: glyph, kind };
    }
    heat = new Float32Array(cols * rows); hot.clear();
  };

  const setFont = (ctx) => { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.font = `500 ${(cw * 1.5).toFixed(1)}px ${mono}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; };
  const xy = (i) => [(W - cols * cw) / 2 + ((i % cols) + 0.5) * cw, (Math.floor(i / cols) + 0.5) * ch];
  const paintBase = () => {
    bg.setTransform(1, 0, 0, 1, 0, 0); bg.clearRect(0, 0, base.width, base.height); setFont(bg);
    cell.forEach((c, i) => { if (!c.kind) return; bg.fillStyle = c.kind === 3 ? colors.trame : c.kind === 2 ? colors.edge : colors.shape; bg.fillText(c.ch, ...xy(i)); });
  };
  const draw = () => {
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, canvas.width, canvas.height); g.drawImage(base, 0, 0);
    if (!hot.size) return;
    setFont(g);
    const sc = SETS[o.charset].scramble;
    hot.forEach((i) => {
      const h = heat[i], c = cell[i], [x, y] = xy(i);
      g.clearRect(x - cw / 2, y - ch / 2, cw, ch);
      if (!c.kind && h < 0.35) return;
      const settled = h < 0.18 && c.kind; // la cellule a retrouvé son caractère
      g.globalAlpha = c.kind ? 1 : Math.min(1, h * 1.2) * 0.7;
      g.fillStyle = settled ? (c.kind === 2 ? colors.edge : c.kind === 3 ? colors.trame : colors.shape) : c.kind ? colors.hot : colors.faint;
      g.fillText(settled ? c.ch : sc[(i * 7 + (frame >> 2) * 13 + (i % 5) * 3) % sc.length], x, y);
    });
    g.globalAlpha = 1;
  };
  const heatAt = (px, py, R, amount, ring) => {
    const ox = (W - cols * cw) / 2;
    for (let r = Math.max(0, Math.floor((py - R) / ch)); r <= Math.min(rows - 1, Math.ceil((py + R) / ch)); r++)
      for (let c = Math.max(0, Math.floor((px - ox - R) / cw)); c <= Math.min(cols - 1, Math.ceil((px - ox + R) / cw)); c++) {
        const d = Math.hypot(ox + (c + 0.5) * cw - px, (r + 0.5) * ch - py), t = ring != null ? 1 - Math.abs(d - ring) / (cw * 3) : 1 - d / R;
        if (t <= 0) continue;
        const i = r * cols + c, v = Math.min(1, t * amount);
        if (v > heat[i]) { heat[i] = v; hot.add(i); }
      }
  };
  const tick = (now) => {
    raf = 0; frame++;
    const dt = Math.min(0.05, (now - (last || now)) / 1000) || 0.016; last = now;
    if (pointer) heatAt(pointer.x, pointer.y, o.radius, 1.6);
    waves = waves.filter((w) => { const rad = ((now - w.t0) / 1000) * 900; if (rad > W * 1.2) return false; heatAt(w.x, w.y, rad + cw * 3, 1, rad); return true; });
    if (o.shimmer && now > shimmerAt) {
      shimmerAt = now + 90;
      for (let s = 0; s < 3; s++) { const j = Math.floor(Math.random() * cell.length); if (cell[j] && (cell[j].kind === 1 || cell[j].kind === 2)) { heat[j] = Math.max(heat[j], 0.55); hot.add(j); } }
    }
    const k = Math.exp(-dt * 2.6);
    hot.forEach((i) => { heat[i] *= k; if (heat[i] < 0.01) { heat[i] = 0; hot.delete(i); } });
    draw();
    if (visible && (hot.size || pointer || waves.length || o.shimmer)) raf = requestAnimationFrame(tick); else last = 0;
  };
  const wake = () => { if (!raf && visible && !reduce && cols) { last = 0; raf = requestAnimationFrame(tick); } };

  const layout = () => {
    o = getOpts(); readColors();
    dpr = Math.min(2, devicePixelRatio || 1); W = art.clientWidth; if (!W) return;
    cw = Math.max(5, o.cell * (W < 600 ? 0.72 : 1)); ch = cw * 1.72; cols = Math.floor(W / cw);
    sample(); H = Math.round(rows * ch);
    canvas.style.height = `${H}px`;
    [canvas, base].forEach((c) => { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
    paintBase(); draw(); wake();
  };

  const local = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const onMove = (e) => { if (e.pointerType === 'mouse') { pointer = local(e); wake(); } };
  const onLeave = () => { pointer = null; };
  const onDown = (e) => { const p = local(e); waves.push({ ...p, t0: performance.now() }); if (e.pointerType !== 'mouse') pointer = p; wake(); };
  const onUp = (e) => { if (e.pointerType !== 'mouse') pointer = null; };
  art.addEventListener('pointermove', onMove); art.addEventListener('pointerleave', onLeave);
  art.addEventListener('pointerdown', onDown); art.addEventListener('pointerup', onUp); art.addEventListener('pointercancel', onUp);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake(); else { cancelAnimationFrame(raf); raf = 0; } });
  io.observe(art);
  let lw = 0; const ro = new ResizeObserver(() => { if (art.clientWidth !== lw) { lw = art.clientWidth; layout(); } });
  /* Palette ou thème changés sur <html> : on relit les couleurs. */
  const mo = new MutationObserver(() => { readColors(); paintBase(); draw(); });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-accent'] });
  let alive = true;
  Promise.all([document.fonts.load(`800 100px ${sans}`), document.fonts.load(`500 16px ${mono}`)]).catch(() => {}).then(() => { if (alive) { ro.observe(art); layout(); } });

  return {
    update: layout,
    destroy: () => {
      alive = false; cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); mo.disconnect();
      art.removeEventListener('pointermove', onMove); art.removeEventListener('pointerleave', onLeave);
      art.removeEventListener('pointerdown', onDown); art.removeEventListener('pointerup', onUp); art.removeEventListener('pointercancel', onUp);
    },
  };
}

const COLS = [
  { title: 'Jeux', links: [['Marée basse', '2026'], ['Cartographe', 'Accès anticipé'], ['Atlas des sons']] },
  { title: 'Studio', links: [['Manifeste'], ['Recrutement'], ['Dossier de presse']] },
  { title: 'Communauté', links: [['Serveur de discussion'], ['Lettre du studio'], ['Journal de développement']] },
];
const caps = 'font-mono text-xs font-medium uppercase tracking-[.04em]';

/**
 * @param {{ word?: string, cell?: number, charset?: 'classique'|'blocs'|'binaire', color?: 'encre'|'accent'|'mono',
 *   radius?: number, motif?: 'logo'|'nom', edges?: boolean, shimmer?: boolean, grid?: boolean, className?: string }} props
 */
export default function FooterAscii({
  word = 'glyphe',
  cell = 9,
  charset = 'classique',
  color = 'encre',
  radius = 120,
  motif = 'logo',
  edges = true,
  shimmer = true,
  grid = true,
  className = '',
}) {
  const artRef = useRef(null), canvasRef = useRef(null), engine = useRef(null);
  const opts = useRef({});
  opts.current = { word, cell, charset: SETS[charset] ? charset : 'classique', color, radius, motif, edges, shimmer, grid };

  useEffect(() => {
    engine.current = createAscii(artRef.current, canvasRef.current, () => opts.current);
    return () => engine.current.destroy();
  }, []);
  useEffect(() => { engine.current?.update(); }, [word, cell, charset, color, radius, motif, edges, shimmer, grid]);

  return (
    <footer aria-labelledby="fa-t" className={`relative overflow-hidden border-t border-[var(--border)] bg-[var(--surface)] px-4 pb-4 pt-12 font-sans text-[var(--text)] md:px-8 md:pb-6 md:pt-16 ${className}`}>
      <div className="grid gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16">
        <div>
          <p className={`m-0 text-[var(--accent)] ${caps}`}>Studio indépendant · Nantes</p>
          <h2 id="fa-t" className="m-0 mt-4 max-w-[20ch] text-balance text-[clamp(1.5rem,1.1rem+1.2vw,2.25rem)] font-semibold leading-[1.12] tracking-[-.03em] text-[var(--text-strong)]">
            Des jeux courts, faits main, qui tiennent dans une soirée.
          </h2>
          <a href="#" className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[var(--border-control)] px-5 text-center text-sm font-medium text-[var(--text-strong)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)] md:min-h-11 md:w-auto">
            Ajouter Marée basse à ma liste de souhaits
          </a>
        </div>
        <nav aria-label="Plan du site" className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-8">
          {COLS.map((col, i) => (
            <div key={col.title} className={i === 0 ? 'col-span-2 md:col-span-1' : ''}>
              <h3 className={`m-0 mb-4 text-[var(--text-muted)] ${caps}`}>{col.title}</h3>
              <ul role="list" className="m-0 grid list-none gap-1 p-0">
                {col.links.map(([label, tag]) => (
                  <li key={label}>
                    <a href="#" className="inline-flex min-h-[44px] flex-wrap items-center gap-x-2 gap-y-1 text-base underline-offset-4 hover:text-[var(--text-strong)] hover:underline md:min-h-8 md:text-sm">
                      {label}{tag && <span className="rounded-lg border border-[var(--border)] px-1.5 font-mono text-[11px] leading-[18px] text-[var(--text-muted)]">{tag}</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Le logo en caractères : canvas décoratif, nom lu par le conteneur. Glissé vertical libre au toucher. */}
      <div ref={artRef} role="img" aria-label={`${word.charAt(0).toUpperCase()}${word.slice(1)}, logo dessiné en caractères`}
        className="relative -mx-1 mt-10 cursor-crosshair touch-pan-y md:-mx-2 md:mt-14">
        <canvas ref={canvasRef} aria-hidden="true" className="block h-0 w-full" />
      </div>

      <div className="mt-6 flex flex-col gap-2 border-t border-[var(--border)] pt-5 font-mono text-sm text-[var(--text-muted)] md:flex-row md:flex-wrap md:justify-between md:gap-x-8 md:text-xs">
        <p className="m-0"><span aria-hidden="true" className="mr-2 inline-block h-[1em] w-[.6em] bg-[var(--accent)] align-[-2px] motion-safe:animate-pulse" />Glyphe SARL (marque fictive) · 2019 — 2026</p>
        <nav aria-label="Informations légales" className="flex flex-wrap gap-x-6">
          {['Mentions légales', 'Confidentialité', 'Contact presse'].map((l) => (
            <a key={l} href="#" className="inline-flex min-h-[44px] items-center hover:text-[var(--text-strong)] md:min-h-0">{l}</a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
