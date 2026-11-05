// AvatarVideo.jsx — témoignages vidéo : un portrait rond s'agrandit sur un ressort jusqu'au lecteur sous-titré,
// puis revient exactement à sa place. React 18 + Tailwind 3.4, tokens.css chargé (couleurs uniquement par variables).
// Sans bibliothèque : le portrait animé est dessiné en canvas (couleurs relues dans tokens.css à chaque changement
// de palette ou de thème) ; `src` sur une personne lit une vraie vidéo muette à la place. Le moteur (ressort, lecture,
// sous-titres) est monté par un useEffect et démonté proprement. Marque fictive : Nacre.
// Utilisation : <AvatarVideo captions autoClose chain={false} ratio="16/9" stiffness={220} />
import { useEffect, useRef } from 'react';

export const PEOPLE = [
  { name: 'Margaux Fontaine', role: 'Céramiste · Nantes', tint: 'amber', hair: 'bun',
    cues: ['J’ai ouvert mon compte un dimanche soir, entre deux cuissons.', 'Le lendemain, ma carte était dans l’appli : j’encaissais au marché.', 'Ce qui a tout changé : les factures se rapprochent seules des paiements.', 'Je passe une heure par mois sur ma compta, plus une journée.'] },
  { name: 'Karim Haddad', role: 'Food truck · Lille', tint: 'green', hair: 'short', beard: true,
    cues: ['En food truck, je bouge tous les jours : tout passe par le téléphone.', 'Le terminal est relié au compte, je vois la recette du midi en direct.', 'Et quand la TVA tombe, l’argent est déjà mis de côté.'] },
  { name: 'Chloé Martin', role: 'Photographe · Lyon', tint: 'violet', hair: 'long',
    cues: ['Je facture des clients en Suisse et en Belgique.', 'Avant, chaque virement me coûtait des frais et trois jours d’attente.', 'Maintenant c’est instantané, avec le taux affiché avant de valider.', 'Mon comptable a accès à tout, sans me demander un seul relevé.'] },
  { name: 'Paul Girard', role: 'Kinésithérapeute · Bordeaux', tint: 'blue', hair: 'short', glasses: true,
    cues: ['J’ai repris un cabinet avec deux associés.', 'Chacun a sa carte, avec ses propres plafonds.', 'Les dépenses communes sont réparties toutes seules en fin de mois.', 'Et le conseiller m’a rappelé dans l’heure, le jour de l’ouverture.'] },
  { name: 'Awa Diop', role: 'Studio de yoga · Montpellier', tint: 'pink', hair: 'curly',
    cues: ['Mes élèves paient par lien, même pour un cours d’essai.', 'Les abonnements se renouvellent seuls, je suis prévenue en cas d’échec.', 'Je vois enfin ce que je gagne vraiment, chaque semaine.'] },
];
const TINTS = ['amber', 'green', 'violet', 'blue', 'pink'];
const fmt = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const timeline = (cues) => { let at = 0; const tl = cues.map((text) => { const d = Math.max(2.4, Math.min(4.2, text.length * 0.058)); const o = { t0: at, t1: at + d, text }; at += d + 0.35; return o; }); return { tl, dur: at }; };
const focusRing = 'focus-visible:outline focus-visible:outline-[length:var(--focus-width)] focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2';

/* ---------- Dessin du portrait (vignette fixe ou « vidéo » animée) ---------- */
function rr(ctx, x, y, w, h, r) { ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
export function drawPortrait(ctx, w, h, p, C, t, amp, scene) {
  const k = C.tint[p.tint], s = Math.min(w, h), cx = w / 2, r = s * (scene ? 0.17 : 0.26);
  const sway = scene ? Math.sin(t * 0.9) * 0.035 + amp * 0.02 : 0, bob = scene ? Math.sin(t * 1.7) * r * 0.03 : 0, cy = (scene ? h * 0.44 : h * 0.47) + bob;
  ctx.clearRect(0, 0, w, h); ctx.fillStyle = k.bg; ctx.fillRect(0, 0, w, h);
  if (scene) {
    const g = ctx.createRadialGradient(w * 0.2, h * 0.1, 0, w * 0.2, h * 0.1, w * 0.7); g.addColorStop(0, C.subtle); g.addColorStop(1, C.subtle0); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) { const bx = ((i * 0.37 + Math.sin(t * 0.07 + i) * 0.04) % 1) * w, by = (0.12 + ((i * 0.53) % 0.6)) * h; ctx.globalAlpha = 0.28 + (i % 2) * 0.14; ctx.fillStyle = i % 3 ? k.border : C.subtle; ctx.beginPath(); ctx.arc(bx, by, s * (0.04 + (i % 3) * 0.03), 0, 6.283); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  ctx.save(); ctx.translate(cx, cy + r * 1.4); ctx.rotate(sway); ctx.translate(-cx, -(cy + r * 1.4));
  ctx.fillStyle = k.fg;
  if (p.hair === 'long') { ctx.beginPath(); rr(ctx, cx - r * 1.12, cy - r * 1.05, r * 2.24, r * 2.6, r * 0.9); ctx.fill(); }
  if (p.hair === 'bun') { ctx.beginPath(); ctx.arc(cx + r * 0.1, cy - r * 1.18, r * 0.44, 0, 6.283); ctx.fill(); }
  if (p.hair === 'curly') for (let a = 0; a < 14; a++) { const an = Math.PI * (0.95 + (a / 13) * 1.1); ctx.beginPath(); ctx.arc(cx + Math.cos(an) * r * 1.02, cy - r * 0.1 + Math.sin(an) * r * 1.08, r * 0.34, 0, 6.283); ctx.fill(); }
  ctx.fillStyle = C.accent; ctx.beginPath(); ctx.moveTo(cx - r * 2.5, h + 2); ctx.bezierCurveTo(cx - r * 2.4, cy + r * 1.75, cx - r * 1.4, cy + r * 1.55, cx, cy + r * 1.55); ctx.bezierCurveTo(cx + r * 1.4, cy + r * 1.55, cx + r * 2.4, cy + r * 1.75, cx + r * 2.5, h + 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = k.border; ctx.beginPath(); rr(ctx, cx - r * 0.36, cy + r * 0.55, r * 0.72, r * 1.1, r * 0.3); ctx.fill();
  ctx.fillStyle = C.accentFg; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.moveTo(cx - r * 0.5, cy + r * 1.56); ctx.lineTo(cx, cy + r * 2.05); ctx.lineTo(cx + r * 0.5, cy + r * 1.56); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
  ctx.fillStyle = k.border; ctx.beginPath(); ctx.moveTo(cx - r * 0.36, cy + r * 1.5); ctx.lineTo(cx, cy + r * 1.9); ctx.lineTo(cx + r * 0.36, cy + r * 1.5); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.9, r * 1.06, 0, 0, 6.283); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx - r * 0.9, cy + r * 0.08, r * 0.14, r * 0.22, 0, 0, 6.283); ctx.ellipse(cx + r * 0.9, cy + r * 0.08, r * 0.14, r * 0.22, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = k.fg; ctx.beginPath();
  if (p.hair === 'short') { ctx.ellipse(cx, cy - r * 0.55, r * 0.96, r * 0.62, 0, Math.PI * 1.02, Math.PI * 1.98); ctx.lineTo(cx + r * 0.92, cy - r * 0.25); ctx.quadraticCurveTo(cx + r * 0.3, cy - r * 0.7, cx - r * 0.92, cy - r * 0.3); ctx.closePath(); }
  else if (p.hair === 'curly') { ctx.ellipse(cx, cy - r * 0.5, r * 0.95, r * 0.62, 0, Math.PI, 0); ctx.quadraticCurveTo(cx, cy - r * 0.62, cx - r * 0.95, cy - r * 0.5); }
  else { ctx.ellipse(cx, cy - r * 0.42, r * 0.96, r * 0.72, 0, Math.PI, 0); ctx.quadraticCurveTo(cx + r * 0.1, cy - r * 0.9, cx - r * 0.25, cy - r * 0.55); ctx.quadraticCurveTo(cx - r * 0.7, cy - r * 0.2, cx - r * 0.96, cy - r * 0.42); }
  ctx.fill();
  if (p.beard) { ctx.beginPath(); ctx.moveTo(cx - r * 0.88, cy + r * 0.1); ctx.quadraticCurveTo(cx - r * 0.8, cy + r * 1.12, cx, cy + r * 1.12); ctx.quadraticCurveTo(cx + r * 0.8, cy + r * 1.12, cx + r * 0.88, cy + r * 0.1); ctx.quadraticCurveTo(cx + r * 0.5, cy + r * 0.5, cx, cy + r * 0.42); ctx.quadraticCurveTo(cx - r * 0.5, cy + r * 0.5, cx - r * 0.88, cy + r * 0.1); ctx.fill(); }
  const blink = scene && t % 3.7 < 0.13 ? 0.12 : 1, lift = amp * r * 0.06;
  ctx.beginPath(); ctx.ellipse(cx - r * 0.34, cy + r * 0.06, r * 0.085, r * 0.1 * blink, 0, 0, 6.283); ctx.ellipse(cx + r * 0.34, cy + r * 0.06, r * 0.085, r * 0.1 * blink, 0, 0, 6.283); ctx.fill();
  ctx.lineCap = 'round'; ctx.strokeStyle = k.fg; ctx.lineWidth = r * 0.07; ctx.beginPath();
  ctx.moveTo(cx - r * 0.48, cy - r * 0.2 - lift); ctx.quadraticCurveTo(cx - r * 0.34, cy - r * 0.28 - lift, cx - r * 0.2, cy - r * 0.2 - lift);
  ctx.moveTo(cx + r * 0.2, cy - r * 0.2 - lift); ctx.quadraticCurveTo(cx + r * 0.34, cy - r * 0.28 - lift, cx + r * 0.48, cy - r * 0.2 - lift); ctx.stroke();
  if (p.glasses) { ctx.lineWidth = r * 0.055; ctx.beginPath(); rr(ctx, cx - r * 0.6, cy - r * 0.1, r * 0.5, r * 0.36, r * 0.12); rr(ctx, cx + r * 0.1, cy - r * 0.1, r * 0.5, r * 0.36, r * 0.12); ctx.moveTo(cx - r * 0.1, cy + r * 0.02); ctx.lineTo(cx + r * 0.1, cy + r * 0.02); ctx.stroke(); }
  if (!p.beard) { ctx.globalAlpha = 0.35; ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(cx - r * 0.55, cy + r * 0.4, r * 0.13, 0, 6.283); ctx.arc(cx + r * 0.55, cy + r * 0.4, r * 0.13, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1; }
  const mh = r * (0.07 + amp * 0.2), mw = r * (0.34 - amp * 0.06);
  ctx.fillStyle = p.beard ? k.border : k.fg; ctx.beginPath(); rr(ctx, cx - mw / 2, cy + r * 0.5 - mh / 2, mw, mh, Math.min(mh, mw) / 2); ctx.fill();
  if (p.beard) { ctx.fillStyle = C.accent; ctx.globalAlpha = 0.9; ctx.beginPath(); rr(ctx, cx - mw / 2 + 1, cy + r * 0.5 - mh / 2 + 1, mw - 2, Math.max(1, mh - 2), Math.min(mh, mw) / 2); ctx.fill(); ctx.globalAlpha = 1; }
  ctx.restore();
}
function readColors() {
  const cs = getComputedStyle(document.documentElement), v = (n) => cs.getPropertyValue(n).trim(), tint = {};
  TINTS.forEach((n) => { tint[n] = { bg: v(`--tint-${n}-bg`), fg: v(`--tint-${n}-fg`), border: v(`--tint-${n}-border`) }; });
  /* même couleur à alpha 0 : un dégradé vers « transparent » passerait par le noir */
  const probe = document.createElement('canvas').getContext('2d'); probe.fillStyle = '#000'; probe.fillStyle = v('--accent-subtle');
  const sv = probe.fillStyle, n = sv[0] === '#' ? parseInt(sv.slice(1), 16) : 0;
  return { tint, accent: v('--accent'), accentFg: v('--accent-fg'), subtle: v('--accent-subtle'), subtle0: sv[0] === '#' ? `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},0)` : sv.replace(/rgba?\(([^,]+),([^,]+),([^,)]+).*$/, 'rgba($1,$2,$3,0)') };
}

/* ---------- Moteur : ressort de l'élément partagé, lecture, sous-titres ---------- */
function createEngine(root, people, opts) {
  const $ = (s) => root.querySelector(s);
  const player = $('[data-av-player]'), scrim = $('[data-av-scrim]'), media = $('[data-av-media]'), canvas = $('[data-av-canvas]'), cap = $('[data-av-cap]');
  const playBtn = $('[data-av-play]'), bar = $('[data-av-bar]'), fill = $('[data-av-fill]'), time = $('[data-av-time]'), cc = $('[data-av-cc]');
  const nameEl = $('[data-av-name]'), roleEl = $('[data-av-role]'), transcript = $('[data-av-transcript]');
  const faces = [...root.querySelectorAll('[data-av-face]')];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let C = readColors(), cur = null, pos = 0, playing = false, raf = 0, last = 0, morph = null, mx = 0, mv = 0, video = null, visible = true, lastCue = null;
  const P = people.map((p, i) => ({ ...p, ...timeline(p.cues), seen: 0, btn: faces[i], thumb: faces[i].querySelector('canvas') }));
  const off = [];
  const on = (el, ev, fn, o) => { el.addEventListener(ev, fn, o); off.push(() => el.removeEventListener(ev, fn, o)); };

  const paintThumbs = () => P.forEach((p) => { const c = p.thumb, d = Math.min(2, window.devicePixelRatio || 1), sz = c.clientWidth || 84; c.width = sz * d; c.height = sz * d; drawPortrait(c.getContext('2d'), c.width, c.height, p, C, 0, 0, false); });
  const target = () => {
    const vw = innerWidth, vh = innerHeight, mobile = vw < 768, ratio = mobile ? 4 / 5 : { '16/9': 16 / 9, '4/5': 4 / 5, '1/1': 1 }[opts.ratio] || 16 / 9;
    let w = mobile ? vw - 24 : Math.min(860, vw - 96), h = w / ratio; const maxH = vh - (mobile ? 48 : 96); if (h > maxH) { h = maxH; w = h * ratio; }
    return { x: (vw - w) / 2, y: (vh - h) / 2, w, h, r: 16 };
  };
  const from = (p) => { const b = p.btn.getBoundingClientRect(), i = 6; return { x: b.left + i, y: b.top + i, w: b.width - i * 2, h: b.height - i * 2, r: (b.width - i * 2) / 2 }; };
  const place = (a, b, k) => { const x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k, w = a.w + (b.w - a.w) * k, h = a.h + (b.h - a.h) * k, r = a.r + (b.r - a.r) * Math.min(1, Math.max(0, k)); Object.assign(player.style, { left: `${x}px`, top: `${y}px`, width: `${Math.max(1, w)}px`, height: `${Math.max(1, h)}px`, borderRadius: `${Math.min(r, Math.min(w, h) / 2)}px` }); };
  const sizeCanvas = () => { const b = target(), d = Math.min(2, window.devicePixelRatio || 1); canvas.width = Math.round(b.w * d); canvas.height = Math.round(b.h * d); };
  const spring = (toOpen, done) => {
    const k = opts.stiffness || 220, c = 2 * Math.sqrt(k) * 0.78, goal = toOpen ? 1 : 0; let lt = 0;
    if (!morph) { mv = 0; mx = toOpen ? 0 : 1; } if (reduce.matches) mx = goal;
    morph = (now) => {
      const dt = Math.min(0.032, (now - (lt || now)) / 1000) || 0.016; lt = now;
      for (let i = 0; i < 2; i++) { mv += ((-k * (mx - goal) - c * mv) * dt) / 2; mx += (mv * dt) / 2; }
      const A = from(cur), B = target(); place(A, B, mx); scrim.dataset.on = String(toOpen);
      if ((Math.abs(mx - goal) < 0.001 && Math.abs(mv) < 0.01) || reduce.matches) { mx = goal; mv = 0; place(A, B, goal); morph = null; done(); return false; }
      return true;
    };
  };
  const open = (p) => {
    if (cur && cur !== p) close(true);
    if (cur === p && player.dataset.open === 'true') return;
    cur = p; pos = 0; playing = true; lastCue = null;
    nameEl.textContent = p.name; roleEl.textContent = p.role;
    transcript.textContent = `Transcription : ${p.cues.join(' ')}`;
    if (video) { video.remove(); video = null; }
    if (p.src) { video = document.createElement('video'); Object.assign(video, { src: p.src, muted: true, playsInline: true }); video.className = 'absolute inset-0 h-full w-full object-cover'; video.setAttribute('aria-hidden', 'true'); media.appendChild(video); canvas.hidden = true; video.play().catch(() => {}); } else canvas.hidden = false;
    sizeCanvas(); player.hidden = false; scrim.hidden = false; player.dataset.open = 'false'; player.dataset.paused = 'false';
    p.btn.dataset.away = 'true'; P.forEach((q) => { q.btn.tabIndex = -1; });
    spring(true, () => { player.dataset.open = 'true'; playBtn.focus({ preventScroll: true }); });
    start();
  };
  function close(instant) {
    if (!cur) return;
    const p = cur; playing = false; player.dataset.open = 'false'; cap.dataset.on = 'false';
    const finish = () => { player.hidden = true; scrim.hidden = true; scrim.dataset.on = 'false'; p.btn.dataset.away = 'false'; P.forEach((q) => { q.btn.tabIndex = 0; }); video?.pause(); cur = null; if (!instant) p.btn.focus({ preventScroll: true }); };
    if (instant) { morph = null; finish(); return; }
    spring(false, finish); start();
  }
  const setPlaying = (v) => { playing = v; player.dataset.paused = String(!v); playBtn.setAttribute('aria-label', v ? 'Pause' : 'Lecture'); if (video) v ? video.play().catch(() => {}) : video.pause(); if (v) start(); };
  const seek = (f) => { if (!cur) return; pos = Math.max(0, Math.min(cur.dur, f * cur.dur)); if (video?.duration) video.currentTime = pos % video.duration; frame(); };
  const amp = (p, t) => { const c = p.tl.find((q) => t >= q.t0 && t < q.t1); if (!c) return { a: 0, c: null }; const edge = Math.min(1, (t - c.t0) * 6, (c.t1 - t) * 6), syl = 0.5 + 0.5 * Math.sin(t * 17 + Math.sin(t * 5.3) * 2.2); return { a: Math.max(0, edge) * (0.25 + 0.75 * syl * syl), c }; };
  function frame() {
    if (!cur) return;
    const A = amp(cur, pos), still = reduce.matches;
    if (!video) drawPortrait(canvas.getContext('2d'), canvas.width, canvas.height, cur, C, still ? 0 : pos, still ? 0 : A.a, true);
    if (A.c !== lastCue) { lastCue = A.c; cap.dataset.on = 'false'; if (A.c) { cap.textContent = A.c.text; void cap.offsetWidth; cap.dataset.on = 'true'; } }
    const f = pos / cur.dur; fill.style.width = `${f * 100}%`; bar.setAttribute('aria-valuenow', String(Math.round(f * 100))); bar.setAttribute('aria-valuetext', `${fmt(pos)} sur ${fmt(cur.dur)}`);
    time.textContent = `${fmt(pos)} / ${fmt(cur.dur)}`;
    cur.seen = Math.max(cur.seen, f); cur.btn.style.setProperty('--seen', cur.seen.toFixed(3)); cur.btn.dataset.seen = cur.seen > 0.98 ? 'all' : cur.seen > 0.005 ? 'some' : 'none';
  }
  function tick(now) {
    raf = 0; const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now; let keep = false;
    if (morph) keep = morph(now) || keep;
    if (cur && playing && visible && player.dataset.open === 'true') { pos += dt; keep = true; if (pos >= cur.dur) { pos = cur.dur; frame(); ended(); return; } }
    if (cur) frame();
    if (keep && visible && !document.hidden) raf = requestAnimationFrame(tick);
  }
  function start() { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } }
  function ended() {
    setPlaying(false); const p = cur, i = P.indexOf(p);
    if (opts.chain && i < P.length - 1) { setTimeout(() => { if (cur === p) { close(true); open(P[i + 1]); } }, 700); return; }
    if (opts.autoClose) setTimeout(() => { if (cur === p) close(); }, 700);
  }

  P.forEach((p) => on(p.btn, 'click', () => open(p)));
  on(playBtn, 'click', () => { if (cur && pos >= cur.dur) pos = 0; setPlaying(!playing); });
  on($('[data-av-close]'), 'click', () => close());
  on(scrim, 'click', () => close());
  on(cc, 'click', () => { opts.captions = !opts.captions; root.dataset.captions = String(opts.captions); cc.setAttribute('aria-pressed', String(opts.captions)); });
  const barSeek = (e) => { const r = bar.getBoundingClientRect(); seek((e.clientX - r.left) / r.width); };
  on(bar, 'pointerdown', (e) => { bar.setPointerCapture(e.pointerId); barSeek(e); bar._drag = true; });
  on(bar, 'pointermove', (e) => { if (bar._drag) barSeek(e); });
  on(bar, 'pointerup', () => { bar._drag = false; });
  on(player, 'keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.target === bar && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); seek((pos + (e.key === 'ArrowRight' ? 2 : -2)) / cur.dur); return; }
    if ((e.key === ' ' || e.key === 'k') && e.target.tagName !== 'BUTTON') { e.preventDefault(); setPlaying(!playing); }
    if (e.key === 'Tab') { const f = [...player.querySelectorAll('button, [tabindex="0"]')], i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
  });
  on(window, 'resize', () => { paintThumbs(); if (cur && !morph) { sizeCanvas(); place(from(cur), target(), 1); frame(); } });
  on(document, 'visibilitychange', () => { if (!document.hidden) start(); });
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting || !!cur; if (visible) start(); }); io.observe(root);
  const mo = new MutationObserver(() => { C = readColors(); paintThumbs(); if (cur) frame(); }); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-accent'] });
  paintThumbs();
  return {
    setOpts: (o) => { Object.assign(opts, o); cc.setAttribute('aria-pressed', String(opts.captions)); if (cur && !morph) { sizeCanvas(); place(from(cur), target(), 1); frame(); } },
    open: (i) => open(P[i || 0]), close: () => close(),
    destroy: () => { cancelAnimationFrame(raf); io.disconnect(); mo.disconnect(); off.forEach((f) => f()); video?.remove(); },
  };
}

/**
 * @param {{ people?: typeof PEOPLE, captions?: boolean, autoClose?: boolean, chain?: boolean,
 *   ratio?: '16/9'|'4/5'|'1/1', stiffness?: number, className?: string }} props
 *   Chaque personne : { name, role, tint: 'amber'|'green'|'violet'|'blue'|'pink', hair: 'bun'|'short'|'long'|'curly', beard?, glasses?, cues: string[], src?: string }
 */
export function AvatarVideo({ people = PEOPLE, captions = true, autoClose = true, chain = false, ratio = '16/9', stiffness = 220, className = '' }) {
  const root = useRef(null), engine = useRef(null);
  useEffect(() => { engine.current = createEngine(root.current, people, { captions, autoClose, chain, ratio, stiffness }); return () => engine.current?.destroy(); }, [people]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { engine.current?.setOpts({ captions, autoClose, chain, ratio, stiffness }); }, [captions, autoClose, chain, ratio, stiffness]);
  const glass = 'grid h-11 w-11 flex-none cursor-pointer place-items-center rounded-full border-0 backdrop-blur-[8px] transition-[background,transform] duration-300 active:scale-[.92] bg-[color-mix(in_srgb,var(--surface)_18%,transparent)] text-[var(--surface)] hover:bg-[color-mix(in_srgb,var(--surface)_30%,transparent)] dark:bg-[color-mix(in_srgb,var(--text-strong)_14%,transparent)] dark:text-[var(--text-strong)] dark:hover:bg-[color-mix(in_srgb,var(--text-strong)_24%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--surface)] dark:focus-visible:outline-[var(--text-strong)]';
  const ico = 'h-5 w-5 fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.75]';

  return (
    <section ref={root} data-captions={String(captions)} aria-labelledby="av-title" className={`group/av mx-auto w-full min-w-0 max-w-[1120px] pb-10 pt-12 font-[family-name:var(--font-sans)] text-[var(--text)] md:px-10 md:pb-16 md:pt-[72px] ${className}`}>
      <header className="grid justify-items-center px-5 text-center md:px-0">
        <span className="mb-6 inline-flex items-center gap-2 text-[var(--text-strong)]">
          <svg viewBox="0 0 100 100" aria-hidden="true" className="h-7 w-7"><rect width="100" height="100" rx="28" fill="var(--accent)" /><path d="M26 66c8-26 40-34 48-12-14-6-30 0-36 14Z" fill="var(--accent-fg)" /><circle cx="62" cy="36" r="7" fill="var(--accent-fg)" /></svg>
          <span className="text-lg font-semibold tracking-[-0.03em]">nacre</span>
        </span>
        <h2 id="av-title" className="max-w-[20ch] text-balance text-[clamp(2rem,1.5rem+1.6vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-[var(--text-strong)]">Ils ont ouvert leur compte pro. Écoutez-les.</h2>
        <p className="mt-4 max-w-[50ch] text-pretty text-base leading-[1.55] text-[var(--text-muted)] md:text-[17px]">Cinq indépendants racontent leur premier mois avec Nacre, en moins de quinze secondes chacun.</p>
      </header>

      <ul role="list" className="mt-8 flex list-none snap-x snap-mandatory gap-1 overflow-x-auto px-5 pb-2 pt-1 [scroll-padding:0_20px] [scrollbar-width:none] md:mt-12 md:justify-center md:gap-4 md:overflow-visible md:p-0 [&::-webkit-scrollbar]:hidden">
        {people.map((p) => {
          const { dur } = timeline(p.cues);
          return (
            <li key={p.name} className="grid w-32 flex-none snap-start content-start justify-items-center gap-3 text-center md:w-44">
              <button type="button" data-av-face aria-label={`Écouter ${p.name}, ${p.role} (${fmt(dur)})`}
                className={`group/f relative h-20 w-20 rounded-full border-0 bg-transparent p-0 transition-[transform,opacity] duration-[420ms] [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] hover:scale-[1.06] active:scale-[.97] data-[away=true]:scale-90 data-[away=true]:opacity-0 md:h-24 md:w-24 ${focusRing}`}>
                <svg viewBox="0 0 36 36" aria-hidden="true" className="absolute inset-0 h-full w-full -rotate-90 fill-none [stroke-width:2.5]">
                  <circle cx="18" cy="18" r="16.4" pathLength="100" className="stroke-[var(--border)]" />
                  <circle cx="18" cy="18" r="16.4" pathLength="100" className="stroke-[var(--accent)] opacity-0 transition-[stroke-dashoffset] duration-[600ms] [stroke-dasharray:100] [stroke-dashoffset:calc(100_-_var(--seen,0)_*_100)] [stroke-linecap:round] group-data-[seen=all]/f:opacity-100 group-data-[seen=some]/f:opacity-100 dark:stroke-[var(--accent-vivid)]" />
                </svg>
                <canvas aria-hidden="true" className="absolute inset-1.5 h-[calc(100%-12px)] w-[calc(100%-12px)] rounded-full" />
                <span aria-hidden="true" className="absolute bottom-0.5 right-0.5 grid h-[30px] w-[30px] place-items-center rounded-full border-[3px] border-[var(--bg)] bg-[var(--accent)] text-[var(--accent-fg)] transition-transform duration-[420ms] group-hover/f:scale-110 group-data-[seen=all]/f:bg-[var(--surface)] group-data-[seen=all]/f:text-[var(--text-strong)]">
                  <svg viewBox="0 0 12 12" className="h-3 w-3 fill-current"><path d="M3.5 2.2v7.6L10 6Z" /></svg>
                </span>
              </button>
              <span className="grid gap-0.5">
                <strong className="text-[15px] font-semibold text-[var(--text-strong)]">{p.name}</strong>
                <span className="text-sm leading-[1.35] text-[var(--text-muted)]">{p.role}</span>
                <span aria-hidden="true" className="mt-0.5 font-[family-name:var(--font-mono)] text-xs font-medium tabular-nums text-[var(--text-muted)]">{fmt(dur)}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 px-5 text-center text-sm text-[var(--text-muted)] md:mt-8">Touchez un portrait pour l’écouter</p>

      <div data-av-scrim hidden className="fixed inset-0 z-40 bg-[var(--scrim)] opacity-0 transition-opacity duration-300 data-[on=true]:opacity-100 motion-reduce:transition-none" />
      <div data-av-player role="dialog" aria-modal="true" aria-labelledby="av-p-name" hidden className="group/p fixed left-0 top-0 z-[41] isolate overflow-hidden bg-[var(--raised)]">
        <div data-av-media className="absolute inset-0"><canvas data-av-canvas aria-hidden="true" className="absolute inset-0 block h-full w-full object-cover" /></div>
        <div className="absolute inset-0 flex flex-col justify-between opacity-0 transition-opacity duration-[260ms] group-data-[open=true]/p:opacity-100">
          <div className="relative z-0 flex items-center justify-between gap-2 p-3 pl-5 before:pointer-events-none before:absolute before:inset-x-0 before:-bottom-8 before:top-0 before:-z-10 before:bg-[linear-gradient(var(--scrim),transparent),linear-gradient(var(--scrim),transparent_70%)]">
            <span className="grid [text-shadow:0_1px_2px_var(--scrim)]"><strong id="av-p-name" data-av-name className="text-base font-semibold text-[var(--surface)] dark:text-[var(--text-strong)]" /><span data-av-role className="text-sm text-[color-mix(in_srgb,var(--surface)_82%,transparent)] dark:text-[var(--text)]" /></span>
            <button type="button" data-av-close aria-label="Fermer et revenir aux portraits" className={glass}><svg viewBox="0 0 24 24" aria-hidden="true" className={ico}><path d="M6 6l12 12M18 6 6 18" /></svg></button>
          </div>
          <p data-av-cap aria-hidden="true" className="mx-auto mb-1 mt-auto max-w-[92%] translate-y-1.5 text-balance rounded-lg bg-[color-mix(in_srgb,var(--text-strong)_78%,transparent)] px-3 py-1.5 text-center text-base leading-[1.45] text-[var(--bg)] opacity-0 transition-[opacity,transform] duration-300 group-data-[captions=false]/av:hidden data-[on=true]:translate-y-0 data-[on=true]:opacity-100 dark:bg-[color-mix(in_srgb,var(--bg)_78%,transparent)] dark:text-[var(--text-strong)] md:max-w-[min(86%,620px)] md:text-lg" />
          <div className="relative z-0 flex items-center gap-2 p-3 before:pointer-events-none before:absolute before:inset-x-0 before:-top-10 before:bottom-0 before:-z-10 before:bg-[linear-gradient(transparent,var(--scrim)),linear-gradient(transparent_30%,var(--scrim))]">
            <button type="button" data-av-play aria-label="Pause" className={glass}>
              <svg viewBox="0 0 24 24" aria-hidden="true" className={`${ico} group-data-[paused=true]/p:hidden`}><path d="M9 6v12M15 6v12" /></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="hidden h-5 w-5 fill-current group-data-[paused=true]/p:block"><path d="M8 5.5v13l10-6.5Z" /></svg>
            </button>
            <div data-av-bar role="slider" tabIndex={0} aria-label="Position de lecture" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} aria-valuetext="0:00"
              className="relative h-11 flex-1 cursor-pointer touch-none before:absolute before:inset-x-0 before:top-1/2 before:-mt-0.5 before:h-1 before:rounded-full before:bg-[color-mix(in_srgb,var(--surface)_35%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--surface)] dark:before:bg-[color-mix(in_srgb,var(--text-strong)_25%,transparent)]">
              <i data-av-fill className="absolute left-0 top-1/2 -mt-0.5 h-1 w-0 rounded-full bg-[var(--surface)] dark:bg-[var(--text-strong)]" />
            </div>
            <span data-av-time aria-hidden="true" className="flex-none text-right font-[family-name:var(--font-mono)] text-xs font-medium tabular-nums text-[var(--surface)] dark:text-[var(--text-strong)] md:min-w-[84px] md:text-[13px]">0:00 / 0:00</span>
            <button type="button" data-av-cc aria-pressed={captions} aria-label="Sous-titres" className={`${glass} aria-[pressed=false]:opacity-60`}><svg viewBox="0 0 24 24" aria-hidden="true" className={ico}><rect x="3.5" y="5.5" width="17" height="13" rx="3" /><path d="M10.5 10.2a2 2 0 1 0 0 3.6M16.5 10.2a2 2 0 1 0 0 3.6" /></svg></button>
          </div>
          <p data-av-transcript className="sr-only" />
        </div>
      </div>
    </section>
  );
}

export default AvatarVideo;
