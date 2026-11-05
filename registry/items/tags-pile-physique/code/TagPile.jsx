// Tags en pile physique — React + Tailwind CSS. Couleurs : variables de tokens.css. Contenu fictif (Tremplin, recrutement).
// Aucune dépendance en plus de React : le moteur (Verlet + capsules, ~3 ko) est le même que dans l'onglet HTML.
// Chaque tag est un <button aria-pressed> rendu par React ; le moteur ne fait que le placer (transform).
import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * @typedef {'lang'|'front'|'data'|'ops'|'design'|'method'} TagKind
 * @typedef {{ label: string, kind?: TagKind, selected?: boolean }} Tag
 * @typedef {Object} TagPileProps
 * @property {Tag[]}   [tags]       Tags de départ
 * @property {number}  [gravity]    Multiplicateur de gravité (1 = 2 600 px/s²)
 * @property {number}  [bounce]     Rebond sur le sol et les murs, 0 à 0,9
 * @property {number}  [friction]   Frottement entre tags et au sol, 0 à 1
 * @property {'pluie'|'bloc'} [drop] Arrivée des tags
 * @property {boolean} [push]       La souris lancée pousse la pile
 * @property {number}  [height]     Hauteur de la zone en px (+96 px sur mobile)
 * @property {'md'|'lg'} [size]     Hauteur des tags : 44 ou 56 px
 * @property {string}  [title]
 * @property {(selected: string[]) => void} [onChange]
 */

export const TAGS_dev = [
  { label: 'TypeScript', kind: 'lang', selected: true }, { label: 'React', kind: 'front', selected: true }, { label: 'Node.js', kind: 'lang' },
  { label: 'PostgreSQL', kind: 'data' }, { label: 'Accessibilité', kind: 'design', selected: true }, { label: 'Docker', kind: 'ops' },
  { label: 'GraphQL', kind: 'front' }, { label: 'Tests E2E', kind: 'method' }, { label: 'Rust', kind: 'lang' }, { label: 'Figma', kind: 'design' },
  { label: 'CI/CD', kind: 'ops' }, { label: 'Redis', kind: 'data' }, { label: 'Next.js', kind: 'front' }, { label: 'Python', kind: 'lang' },
  { label: 'Kubernetes', kind: 'ops' }, { label: 'Revue de code', kind: 'method' }, { label: 'Svelte', kind: 'front' }, { label: 'Storybook', kind: 'design' },
];

const KIND = {
  lang: 'bg-[var(--tint-blue-bg)] text-[var(--tint-blue-fg)] border-[var(--tint-blue-border)]',
  front: 'bg-[var(--tint-violet-bg)] text-[var(--tint-violet-fg)] border-[var(--tint-violet-border)]',
  data: 'bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)] border-[var(--tint-green-border)]',
  ops: 'bg-[var(--tint-amber-bg)] text-[var(--tint-amber-fg)] border-[var(--tint-amber-border)]',
  design: 'bg-[var(--tint-pink-bg)] text-[var(--tint-pink-fg)] border-[var(--tint-pink-border)]',
  method: 'bg-[var(--surface)] text-[var(--text-strong)] border-[var(--border-control)]',
};
const ON = 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)]';

/* ——— Moteur : capsules (2 points + tige rigide) en Verlet, contraintes de position ——— */
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
function closest(a, b, c, d) {
  const d1x = b.x - a.x, d1y = b.y - a.y, d2x = d.x - c.x, d2y = d.y - c.y, rx = a.x - c.x, ry = a.y - c.y;
  const A = d1x * d1x + d1y * d1y, E = d2x * d2x + d2y * d2y, F = d2x * rx + d2y * ry;
  let s, t;
  if (A < 1e-6 && E < 1e-6) return [0, 0];
  if (A < 1e-6) { s = 0; t = clamp(F / E, 0, 1); } else {
    const C = d1x * rx + d1y * ry;
    if (E < 1e-6) { t = 0; s = clamp(-C / A, 0, 1); } else {
      const B = d1x * d2x + d1y * d2y, den = A * E - B * B;
      s = den > 1e-6 ? clamp((B * F - C * E) / den, 0, 1) : 0; t = (B * s + F) / E;
      if (t < 0) { t = 0; s = clamp(-C / A, 0, 1); } else if (t > 1) { t = 1; s = clamp((B - C) / A, 0, 1); }
    }
  }
  return [s, t];
}

function createPile(zone, opt, onTap) {
  const G = 2600 * opt.gravity, BOUNCE = clamp(opt.bounce, 0, 0.9), MU = clamp(opt.friction, 0, 1), HS = 1 / 180, IT = 6;
  let bodies = [], W = 0, H = 0, raf = 0, last = 0, still = 0, visible = false, started = false, dead = false;
  let timers = [], grab = null, pointer = null, down = null, lastMv = null, pushT = 0;
  const pt = (x, y) => ({ x, y, px: x, py: y });
  const measure = () => { W = zone.clientWidth; H = zone.clientHeight; };
  const make = (el) => { const w = el.offsetWidth, h = el.offsetHeight; return { el, w, h, r: h / 2, L: Math.max(0, w - h), a: pt(0, 0), b: pt(0, 0), on: false }; };
  const find = (el) => bodies.find((b) => b.el === el);
  function place(bd, cx, cy, ang) {
    const hx = Math.cos(ang) * bd.L / 2, hy = Math.sin(ang) * bd.L / 2;
    Object.assign(bd.a, pt(cx - hx, cy - hy)); Object.assign(bd.b, pt(cx + hx, cy + hy));
    bd.on = true; bd.el.style.opacity = 1;
  }
  function draw() {
    for (const bd of bodies) {
      if (!bd.on) continue;
      const cx = (bd.a.x + bd.b.x) / 2, cy = (bd.a.y + bd.b.y) / 2;
      let ang = Math.atan2(bd.b.y - bd.a.y, bd.b.x - bd.a.x);
      if (ang > Math.PI / 2) ang -= Math.PI; else if (ang < -Math.PI / 2) ang += Math.PI; // texte toujours à l'endroit
      bd.el.style.transform = `translate3d(${(cx - bd.w / 2).toFixed(2)}px,${(cy - bd.h / 2).toFixed(2)}px,0) rotate(${ang.toFixed(4)}rad)`;
    }
  }
  const nudgeSeg = (bd, s, nx, ny, k) => { bd.a.x += nx * k * (1 - s); bd.a.y += ny * k * (1 - s); bd.b.x += nx * k * s; bd.b.y += ny * k * s; };
  function pair(p, q, lastIt) {
    if (!p.on || !q.on) return;
    if (Math.max(p.a.x, p.b.x) + p.r < Math.min(q.a.x, q.b.x) - q.r || Math.max(q.a.x, q.b.x) + q.r < Math.min(p.a.x, p.b.x) - p.r) return;
    if (Math.max(p.a.y, p.b.y) + p.r < Math.min(q.a.y, q.b.y) - q.r || Math.max(q.a.y, q.b.y) + q.r < Math.min(p.a.y, p.b.y) - p.r) return;
    const [s, t] = closest(p.a, p.b, q.a, q.b), minD = p.r + q.r;
    const dx = p.a.x + s * (p.b.x - p.a.x) - (q.a.x + t * (q.b.x - q.a.x)), dy = p.a.y + s * (p.b.y - p.a.y) - (q.a.y + t * (q.b.y - q.a.y));
    let dist = Math.hypot(dx, dy); if (dist >= minD) return;
    let nx = 0, ny = -1; if (dist > 1e-4) { nx = dx / dist; ny = dy / dist; } else dist = 0;
    const ws = (1 - s) ** 2 + s * s + (1 - t) ** 2 + t * t, lam = (minD - dist) / ws;
    if (grab && grab.bd === p) return nudgeSeg(q, t, -nx, -ny, lam * 2);
    if (grab && grab.bd === q) return nudgeSeg(p, s, nx, ny, lam * 2);
    nudgeSeg(p, s, nx, ny, lam); nudgeSeg(q, t, -nx, -ny, lam);
    if (lastIt && MU > 0) {
      const rx = (1 - s) * (p.a.x - p.a.px) + s * (p.b.x - p.b.px) - (1 - t) * (q.a.x - q.a.px) - t * (q.b.x - q.b.px);
      const ry = (1 - s) * (p.a.y - p.a.py) + s * (p.b.y - p.b.py) - (1 - t) * (q.a.y - q.a.py) - t * (q.b.y - q.b.py);
      const rn = rx * nx + ry * ny, tx = (rx - rn * nx) * MU * 0.5 / ws, ty = (ry - rn * ny) * MU * 0.5 / ws;
      p.a.px += tx * (1 - s); p.a.py += ty * (1 - s); p.b.px += tx * s; p.b.py += ty * s;
      q.a.px -= tx * (1 - t); q.a.py -= ty * (1 - t); q.b.px -= tx * t; q.b.py -= ty * t;
    }
  }
  function walls(bd, p, lastIt) {
    const r = bd.r, vx = p.x - p.px, vy = p.y - p.py;
    if (p.y > H - r) { p.y = H - r; if (lastIt) { p.py = vy > 1.2 ? p.y + vy * BOUNCE : p.y; p.px = p.x - vx * (1 - MU * 0.6); } }
    if (p.x < r) { p.x = r; if (lastIt) p.px = vx < -1.2 ? p.x + vx * BOUNCE : p.x; }
    if (p.x > W - r) { p.x = W - r; if (lastIt) p.px = vx > 1.2 ? p.x + vx * BOUNCE : p.x; }
    if (p.y < -H * 1.5) p.y = -H * 1.5;
  }
  function pushBy(bd) {
    const R = 22, dx = bd.b.x - bd.a.x, dy = bd.b.y - bd.a.y, L2 = dx * dx + dy * dy;
    const s = L2 > 1e-6 ? clamp(((pointer.x - bd.a.x) * dx + (pointer.y - bd.a.y) * dy) / L2, 0, 1) : 0;
    const ox = bd.a.x + s * dx - pointer.x, oy = bd.a.y + s * dy - pointer.y, dist = Math.hypot(ox, oy), minD = bd.r + R;
    if (dist >= minD || dist < 1e-4) return;
    nudgeSeg(bd, s, ox / dist, oy / dist, (minD - dist) / ((1 - s) ** 2 + s * s) * 0.35);
  }
  function step() {
    for (const bd of bodies) {
      if (!bd.on) continue;
      for (const p of [bd.a, bd.b]) {
        let vx = (p.x - p.px) * 0.996, vy = (p.y - p.py) * 0.996; const v = Math.hypot(vx, vy);
        if (v > 40) { vx *= 40 / v; vy *= 40 / v; }
        p.px = p.x; p.py = p.y; p.x += vx; p.y += vy + G * HS * HS;
      }
    }
    for (let k = 0; k < IT; k++) {
      const lastIt = k === IT - 1;
      for (const bd of bodies) {
        if (!bd.on) continue;
        const dx = bd.b.x - bd.a.x, dy = bd.b.y - bd.a.y, d = Math.hypot(dx, dy) || 1e-4, c = (d - bd.L) / d / 2;
        bd.a.x += dx * c; bd.a.y += dy * c; bd.b.x -= dx * c; bd.b.y -= dy * c;
      }
      if (grab) {
        const g = grab.bd, s = grab.s, ws = (1 - s) ** 2 + s * s;
        const ex = (grab.x - (g.a.x + s * (g.b.x - g.a.x))) * 0.5, ey = (grab.y - (g.a.y + s * (g.b.y - g.a.y))) * 0.5;
        g.a.x += ex * (1 - s) / ws; g.a.y += ey * (1 - s) / ws; g.b.x += ex * s / ws; g.b.y += ey * s / ws;
      }
      for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) pair(bodies[i], bodies[j], lastIt);
      if (opt.push && pointer && !grab) bodies.forEach((bd) => bd.on && pushBy(bd));
      for (const bd of bodies) if (bd.on) { walls(bd, bd.a, lastIt); walls(bd, bd.b, lastIt); }
    }
  }
  const energy = () => bodies.reduce((e, b) => (b.on ? Math.max(e, Math.abs(b.a.x - b.a.px) + Math.abs(b.a.y - b.a.py), Math.abs(b.b.x - b.b.px) + Math.abs(b.b.y - b.b.py)) : e), 0);
  function frame(now) {
    raf = 0; if (dead || !visible) return;
    const dt = Math.min(0.05, (now - (last || now)) / 1000) || 1 / 60; last = now;
    for (let i = Math.max(1, Math.round(dt / HS)); i > 0; i--) step();
    draw();
    still = energy() < 0.03 && !grab && !pointer && !timers.length ? still + 1 : 0;
    if (still > 45) { last = 0; return; } // endormi
    raf = requestAnimationFrame(frame);
  }
  const wake = () => { still = 0; if (!raf && visible && !dead) { last = 0; raf = requestAnimationFrame(frame); } };
  function spawn(bd, i) {
    let x = bd.w / 2 + 8 + Math.random() * Math.max(1, W - bd.w - 16), y = -bd.h;
    if (opt.drop === 'bloc') y = -bd.h - (i % 6) * (bd.h + 4) - Math.floor(i / 6) * 8;
    place(bd, clamp(x, bd.w / 2 + 4, W - bd.w / 2 - 4), y, (Math.random() - 0.5) * 0.6);
  }
  function drop() {
    timers.forEach(clearTimeout); timers = []; measure();
    bodies.forEach((bd) => { bd.on = false; bd.el.style.opacity = 0; });
    bodies.forEach((bd, i) => {
      if (opt.drop === 'bloc') return spawn(bd, i);
      const id = setTimeout(() => { spawn(bd, i); timers.splice(timers.indexOf(id), 1); wake(); }, 70 + i * 85); timers.push(id);
    });
    draw(); wake();
  }
  /* Nouveaux tags rendus par React : ils tombent du haut ; tags retirés : oubliés */
  function sync() {
    const els = [...zone.querySelectorAll('[data-tag]')];
    bodies = bodies.filter((b) => els.includes(b.el));
    els.forEach((el) => { if (!find(el)) { const bd = make(el); bodies.push(bd); if (started) { place(bd, clamp(W / 2 + (Math.random() - 0.5) * 80, bd.w / 2, W - bd.w / 2), -bd.h, (Math.random() - 0.5) * 0.5); wake(); } } });
    draw();
  }
  function shake() {
    bodies.forEach((bd) => {
      if (!bd.on) return;
      const up = 9 + Math.random() * 9, side = (Math.random() - 0.5) * 8, spin = (Math.random() - 0.5) * 5;
      bd.a.py = bd.a.y + up + spin; bd.b.py = bd.b.y + up - spin; bd.a.px = bd.a.x - side; bd.b.px = bd.b.x - side;
    });
    wake();
  }
  function nudge(el, dx, dy) { const bd = find(el); if (!bd || !bd.on) return; bd.a.px -= dx; bd.b.px -= dx; bd.a.py -= dy; bd.b.py -= dy; wake(); }

  const local = (e) => { const r = zone.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const onDown = (e) => {
    const el = e.target.closest('[data-tag]'); if (!el || e.button > 0) return;
    const bd = find(el); if (!bd || !bd.on) return;
    const p = local(e), dx = bd.b.x - bd.a.x, dy = bd.b.y - bd.a.y, L2 = dx * dx + dy * dy;
    down = { el, bd, id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, s: L2 > 1e-6 ? clamp(((p.x - bd.a.x) * dx + (p.y - bd.a.y) * dy) / L2, 0, 1) : 0.5 };
    try { el.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
  };
  const onMove = (e) => {
    const p = local(e);
    if (down && e.pointerId === down.id) {
      if (!down.moved && Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y) > 6) { down.moved = true; grab = { bd: down.bd, s: down.s, ...p }; down.el.dataset.grabbed = ''; }
      if (grab) { grab.x = clamp(p.x, 0, W); grab.y = clamp(p.y, -H, H); wake(); }
      return;
    }
    if (opt.push && e.pointerType === 'mouse') { // ne pousse que lancée : approchée lentement, la souris peut saisir
      const now = performance.now(), sp = lastMv ? Math.hypot(p.x - lastMv.x, p.y - lastMv.y) / Math.max(1, now - lastMv.t) : 0;
      lastMv = { ...p, t: now }; clearTimeout(pushT);
      if (sp > 0.6) { pointer = p; wake(); pushT = setTimeout(() => { pointer = null; }, 90); } else pointer = null;
    }
  };
  const onUp = (e) => {
    if (!down || e.pointerId !== down.id) return;
    delete down.el.dataset.grabbed; if (!down.moved) onTap(down.el.dataset.tag);
    grab = null; down = null; wake();
  };
  const onLeave = () => { pointer = null; lastMv = null; wake(); };
  zone.addEventListener('pointerdown', onDown); zone.addEventListener('pointermove', onMove); zone.addEventListener('pointerup', onUp);
  zone.addEventListener('pointercancel', onUp); zone.addEventListener('pointerleave', onLeave);
  const ro = new ResizeObserver(() => {
    const w0 = W; measure();
    bodies.forEach((bd) => { const w = bd.el.offsetWidth, h = bd.el.offsetHeight; Object.assign(bd, { w, h, r: h / 2, L: Math.max(0, w - h) }); });
    if (w0 && W !== w0) bodies.forEach((bd) => [bd.a, bd.b].forEach((p) => { p.x *= W / w0; p.px *= W / w0; }));
    wake();
  });
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !started) { started = true; drop(); } if (visible) wake(); }, { threshold: 0.15 });
  measure(); sync(); ro.observe(zone); io.observe(zone);
  return {
    shake, drop, sync, nudge,
    destroy() { dead = true; cancelAnimationFrame(raf); timers.forEach(clearTimeout); ro.disconnect(); io.disconnect();
      zone.removeEventListener('pointerdown', onDown); zone.removeEventListener('pointermove', onMove); zone.removeEventListener('pointerup', onUp);
      zone.removeEventListener('pointercancel', onUp); zone.removeEventListener('pointerleave', onLeave); },
  };
}

function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => { const m = matchMedia('(prefers-reduced-motion: reduce)'); setR(m.matches); const f = () => setR(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f); }, []);
  return r;
}

export default function TagPile({
  tags: initial = TAGS_dev, gravity = 1, bounce = 0.2, friction = 0.5, drop = 'pluie', push = true, height = 360, size = 'md',
  title = 'Compétences', onChange,
}) {
  const [tags, setTags] = useState(initial);
  const [draft, setDraft] = useState('');
  const [msg, setMsg] = useState({ text: '', error: false });
  const [live, setLive] = useState('');
  const zoneRef = useRef(null), pile = useRef(null);
  const reduce = useReducedMotion();
  const count = tags.filter((t) => t.selected).length;

  const toggle = useCallback((label) => {
    setTags((list) => {
      const next = list.map((t) => (t.label === label ? { ...t, selected: !t.selected } : t));
      const t = next.find((x) => x.label === label), n = next.filter((x) => x.selected).length;
      setLive(`${label} ${t.selected ? 'mis en avant' : 'retiré'}. ${n} compétence${n > 1 ? 's' : ''} en avant.`);
      onChange?.(next.filter((x) => x.selected).map((x) => x.label));
      return next;
    });
  }, [onChange]);
  const tapRef = useRef(toggle); tapRef.current = toggle;

  // Le moteur est recréé quand un réglage physique change, pas quand on sélectionne un tag
  useEffect(() => {
    if (reduce || !zoneRef.current) return undefined;
    pile.current = createPile(zoneRef.current, { gravity, bounce, friction, drop, push }, (l) => tapRef.current(l));
    return () => { pile.current?.destroy(); pile.current = null; };
  }, [reduce, gravity, bounce, friction, drop, push, size]);
  useEffect(() => { pile.current?.sync(); }, [tags.length]);

  function add(e) {
    e.preventDefault();
    const label = draft.trim().replace(/\s+/g, ' ');
    if (!label) return setMsg({ text: 'Saisissez une compétence avant d’ajouter.', error: true });
    const dup = tags.find((t) => t.label.toLowerCase() === label.toLowerCase());
    if (dup) {
      const el = zoneRef.current?.querySelector(`[data-tag="${CSS.escape(dup.label)}"]`);
      if (el) pile.current?.nudge(el, 0, -16);
      return setMsg({ text: `« ${dup.label} » est déjà dans la pile.`, error: true });
    }
    if (tags.length >= 40) return setMsg({ text: '40 compétences au maximum.', error: true });
    setTags((l) => [...l, { label, kind: 'method', selected: true }]);
    setDraft(''); setMsg({ text: '', error: false }); setLive(`${label} ajouté et mis en avant.`);
  }

  const h = size === 'lg' ? 'h-14 text-[18px]' : 'h-11 text-[15px]';
  return (
    <section aria-labelledby="tp-title" className="grid w-full max-w-[720px] grid-cols-[minmax(0,1fr)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] font-sans text-[var(--text)]">
      <header className="flex items-start justify-between gap-4 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
        <div>
          <h3 id="tp-title" className="text-[17px] font-semibold leading-6 tracking-[-0.01em] text-[var(--text-strong)]">{title}</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{reduce ? 'Touchez une compétence pour la mettre en avant.' : 'Touchez pour mettre en avant, faites glisser pour lancer.'}</p>
        </div>
        <p aria-hidden="true" className="inline-flex h-7 shrink-0 items-center whitespace-nowrap rounded-full border border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)] px-3 text-[13px] font-semibold tabular-nums text-[var(--accent)]">{count}&nbsp;en avant</p>
      </header>

      <div
        ref={zoneRef}
        role="group"
        aria-label="Pile de compétences, flèches pour pousser un tag, Entrée pour le mettre en avant"
        style={{ '--tp-h': `${height}px` }}
        className={reduce
          ? 'mx-2 flex flex-wrap content-start gap-2 rounded-xl bg-[var(--raised)] p-4 sm:mx-3'
          : 'relative mx-2 h-[calc(var(--tp-h)+96px)] select-none overflow-hidden rounded-xl bg-[var(--raised)] [touch-action:pan-y] [background-image:radial-gradient(circle_at_1px_1px,var(--border)_1px,transparent_1.5px)] [background-size:16px_16px] sm:mx-3 sm:h-[var(--tp-h)]'}
      >
        {tags.map((t) => (
          <button
            key={t.label}
            type="button"
            data-tag={t.label}
            aria-pressed={!!t.selected}
            onClick={(e) => { if (reduce || e.detail === 0) toggle(t.label); }}
            onKeyDown={(e) => {
              const m = { ArrowLeft: [-7, 0], ArrowRight: [7, 0], ArrowUp: [0, -14], ArrowDown: [0, 6] }[e.key];
              if (m && pile.current) { e.preventDefault(); pile.current.nudge(e.currentTarget, m[0], m[1]); }
            }}
            className={`group inline-flex items-center gap-2 whitespace-nowrap rounded-full border pl-3.5 pr-[18px] font-medium tracking-[-0.01em] transition-colors duration-200 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] data-[grabbed]:z-10 data-[grabbed]:cursor-grabbing data-[grabbed]:shadow-[var(--shadow-popover)] ${h} ${t.selected ? ON : KIND[t.kind || 'method']} ${reduce ? 'relative cursor-pointer' : 'absolute left-0 top-0 cursor-grab opacity-0 [touch-action:none] will-change-transform'}`}
          >
            <span aria-hidden="true" className="relative h-3.5 w-3.5 shrink-0">
              <span className={`absolute inset-1 rounded-full bg-current opacity-70 transition-transform duration-300 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] ${t.selected ? 'scale-0' : 'scale-100'}`} />
              <span className={`absolute left-1 top-px h-[9px] w-[5px] origin-[60%_60%] rotate-45 border-b-2 border-r-2 border-current transition-transform duration-300 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] ${t.selected ? 'scale-100' : 'scale-0'}`} />
            </span>
            {t.label}
          </button>
        ))}
      </div>

      <footer className="flex flex-wrap items-center gap-2 p-2 sm:p-3">
        <form onSubmit={add} noValidate className="flex min-w-0 flex-[1_1_280px] gap-2">
          <label htmlFor="tp-new" className="sr-only">Ajouter une compétence</label>
          <input
            id="tp-new" value={draft} maxLength={24} autoComplete="off" placeholder="Ajouter une compétence"
            onChange={(e) => setDraft(e.target.value)} aria-invalid={msg.error || undefined} aria-describedby="tp-msg"
            className="h-11 min-w-0 flex-1 rounded-full border border-[var(--border-control)] bg-[var(--surface)] px-3.5 text-base text-[var(--text-strong)] placeholder:text-[var(--text-muted)] aria-[invalid=true]:border-[var(--down)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
          />
          <button type="submit" className="h-11 whitespace-nowrap rounded-full bg-[var(--accent)] px-[18px] text-sm font-semibold text-[var(--accent-fg)] transition active:scale-[.97] hover:bg-[var(--accent-hover)]">Ajouter</button>
        </form>
        {!reduce && (
          <button type="button" onClick={() => pile.current?.shake()} className="inline-flex h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-[var(--border)] px-[18px] text-sm font-semibold text-[var(--text-strong)] transition active:scale-[.97] hover:bg-[var(--state-hover)] sm:flex-none">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 14c2-4 4-4 6 0s4 4 6 0 3-3 4-2M4 8c2-4 4-4 6 0s4 4 6 0 3-3 4-2" /></svg>
            Secouer
          </button>
        )}
        <p id="tp-msg" aria-live="polite" className={`basis-full px-2 text-[13px] leading-[18px] empty:hidden ${msg.error ? 'text-[var(--down)]' : 'text-[var(--text-muted)]'}`}>{msg.text}</p>
      </footer>
      <p className="sr-only" aria-live="polite">{live}</p>
    </section>
  );
}
