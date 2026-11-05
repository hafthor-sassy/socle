// Dépôt de fichiers aimanté — React + Tailwind CSS + framer-motion. Couleurs : variables de tokens.css.
// La zone attire l'aperçu du fichier glissé (ressort vers son centre), puis chaque fichier s'envole vers la liste
// avec aperçu, progression, erreurs (format, taille, réseau) et reprise. Branchez votre envoi via `upload`.
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, useSpring } from 'framer-motion';

const fmt = (b) => (b < 1e6 ? `${Math.max(1, Math.round(b / 1e3))} ko` : `${(b / 1e6).toFixed(1).replace('.', ',')} Mo`);
let uid = 0;

/** Envoi simulé, à remplacer : (file, onProgress) => Promise<string | void> (le texte renvoyé s'affiche une fois envoyé). */
const fakeUpload = (file, onProgress) => new Promise((res) => {
  let p = 0;
  const id = setInterval(() => { p = Math.min(1, p + 0.05 + Math.random() * 0.08); onProgress(p); if (p >= 1) { clearInterval(id); res(); } }, 120);
});

/**
 * @param {object} props
 * @param {number} [props.maxSize]   Mo par fichier
 * @param {string[]} [props.accept]  Types MIME acceptés
 * @param {number} [props.pull]      Force de l'aimant (0–1)
 * @param {number} [props.radius]    Portée hors de la zone (px)
 * @param {number} [props.stiffness]
 * @param {number} [props.damping]
 * @param {(file: File, onProgress: (p: number) => void) => Promise<string|void>} [props.upload]
 * @param {(items: object[]) => void} [props.onChange]
 */
export function MagnetDrop({
  maxSize = 10, accept = ['application/pdf', 'image/jpeg', 'image/png'], pull = 0.55, radius = 140,
  stiffness = 210, damping = 20, upload = fakeUpload, onChange, className = '',
}) {
  const zone = useRef(null);
  const list = useRef(null);
  const input = useRef(null);
  const depth = useRef(0);
  const reduce = useReducedMotion();
  const [items, setItems] = useState([]);
  const [drag, setDrag] = useState(null); // { count, near, inside, f }
  const [live, setLive] = useState('');
  const spring = reduce ? { duration: 0 } : { stiffness, damping };
  const gx = useSpring(0, spring), gy = useSpring(0, spring), gs = useSpring(0, { stiffness: 260, damping: 22 });
  const zx = useSpring(0, { stiffness: 180, damping: 18 }), zy = useSpring(0, { stiffness: 180, damping: 18 });

  useEffect(() => { onChange?.(items); }, [items]);

  const patch = (id, p) => setItems((all) => all.map((it) => (it.id === id ? { ...it, ...p } : it)));
  const check = (f) => (accept.length && !accept.includes(f.type) ? 'Format non pris en charge'
    : f.size > maxSize * 1e6 ? `Trop lourd : ${fmt(f.size)} (max ${maxSize} Mo)` : '');

  const send = (it) => {
    patch(it.id, { state: 'sending', progress: 0, error: '' });
    upload(it.file, (p) => patch(it.id, { progress: p })).then(
      (meta) => { patch(it.id, { state: 'done', progress: 1, meta: meta || '' }); setLive(`${it.name} envoyé.`); },
      (e) => { patch(it.id, { state: 'error', retryable: true, error: `${e?.message || 'Échec de l’envoi'} · Réessayez` }); setLive(`Échec de l’envoi de ${it.name}.`); },
    );
  };

  const add = (files) => {
    if (!files.length) return;
    const z = zone.current.getBoundingClientRect(), l = list.current.getBoundingClientRect();
    const added = files.map((file, i) => {
      const error = check(file);
      return {
        id: ++uid, file, name: file.name, size: file.size, type: file.type, error, state: error ? 'error' : 'queued', progress: 0,
        thumb: /^image\/(png|jpe?g|webp|gif|avif)$/.test(file.type) ? URL.createObjectURL(file) : null,
        from: { x: z.left + z.width / 2 - (l.left + l.width / 2), y: z.top + z.height / 2 - (l.top + 36 + i * 80), delay: i * 0.07 },
      };
    });
    setItems((all) => [...added, ...all]);
    added.filter((it) => !it.error).forEach(send);
    const bad = added.filter((it) => it.error).length;
    setLive(`${added.length} fichier${added.length > 1 ? 's ajoutés' : ' ajouté'}${bad ? `, dont ${bad} refusé${bad > 1 ? 's' : ''}` : ''}.`);
  };

  const remove = (it) => { if (it.thumb) URL.revokeObjectURL(it.thumb); setItems((all) => all.filter((x) => x.id !== it.id)); setLive(`${it.name} retiré.`); };

  // Aimant : suit le glisser sur toute la page
  useEffect(() => {
    const hasFiles = (e) => [...(e.dataTransfer?.types || [])].includes('Files');
    const move = (x, y, count) => {
      const r = zone.current.getBoundingClientRect(), cx = r.width / 2, cy = r.height / 2, px = x - r.left, py = y - r.top;
      const dist = Math.hypot(Math.max(-px, 0, px - r.width), Math.max(-py, 0, py - r.height));
      const near = dist < radius, inside = dist === 0, f = near ? (1 - dist / radius) ** 2 : 0;
      const k = inside ? pull + (1 - pull) * 0.35 : pull * f;
      gx.set(px + (cx - px) * k); gy.set(py + (cy - py) * k); gs.set(1);
      zx.set(near ? Math.max(-1, Math.min(1, (px - cx) / r.width)) * 10 * (inside ? 0.6 : f) : 0);
      zy.set(near ? Math.max(-1, Math.min(1, (py - cy) / r.height)) * 10 * (inside ? 0.6 : f) : 0);
      setDrag((d) => ({ count: count || d?.count || 1, near, inside, f: inside ? 1 : f }));
      return inside;
    };
    const end = (dropped) => {
      const r = zone.current.getBoundingClientRect();
      if (dropped) { gx.set(r.width / 2); gy.set(r.height / 2); }
      gs.set(0); zx.set(0); zy.set(0); setDrag(null);
    };
    const onEnter = (e) => {
      if (!hasFiles(e)) return;
      if (depth.current++ === 0) { const r = zone.current.getBoundingClientRect(); gx.jump(e.clientX - r.left); gy.jump(e.clientY - r.top); }
      move(e.clientX, e.clientY, e.dataTransfer.items?.length);
    };
    const onOver = (e) => { if (!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = move(e.clientX, e.clientY) ? 'copy' : 'none'; };
    const onLeave = (e) => { if (hasFiles(e) && --depth.current <= 0) { depth.current = 0; end(false); } };
    const onDrop = (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault(); depth.current = 0;
      const r = zone.current.getBoundingClientRect(), inside = e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom;
      end(inside);
      if (inside) add([...e.dataTransfer.files]);
    };
    document.addEventListener('dragenter', onEnter); document.addEventListener('dragover', onOver);
    document.addEventListener('dragleave', onLeave); document.addEventListener('drop', onDrop);
    return () => {
      document.removeEventListener('dragenter', onEnter); document.removeEventListener('dragover', onOver);
      document.removeEventListener('dragleave', onLeave); document.removeEventListener('drop', onDrop);
    };
  }, [pull, radius, maxSize, accept.join()]);

  const f = drag?.f || 0;
  const ok = items.filter((i) => i.state === 'done').length;
  const busy = items.some((i) => i.state === 'sending' || i.state === 'queued');
  const total = items.reduce((a, i) => a + (i.error && !i.retryable ? 0 : i.size), 0);

  return (
    <div className={`grid items-start gap-6 md:grid-cols-[1.05fr_1fr] ${className}`}>
      <motion.div
        ref={zone}
        style={{ x: zx, y: zy, background: drag?.near ? `color-mix(in srgb, var(--accent-subtle) ${Math.round(f * 100)}%, var(--raised))` : undefined }}
        animate={{ scale: 1 + f * 0.015 }}
        onClick={() => input.current?.click()}
        className="group relative isolate grid min-h-[220px] cursor-pointer place-items-center rounded-2xl bg-[var(--raised)] px-4 py-6 md:min-h-[360px] md:px-6 md:py-8"
      >
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full overflow-visible">
          <rect x="1" y="1" rx="15" style={{ width: 'calc(100% - 2px)', height: 'calc(100% - 2px)' }} fill="none" strokeDasharray="8 7"
            className={`transition-colors ${drag ? 'stroke-[var(--accent)] [animation:drop-march_900ms_linear_infinite] motion-reduce:[animation:none]' : 'stroke-[var(--border-control)] group-hover:stroke-[var(--text-muted)]'}`}
            strokeWidth={drag?.inside ? 2.5 : 1.5} />
        </svg>
        <style>{'@keyframes drop-march{to{stroke-dashoffset:-30}}'}</style>
        <div className={`grid justify-items-center gap-2 text-center transition-opacity ${drag?.inside ? 'opacity-35' : ''}`}>
          <p className="m-0 text-[18px] font-semibold leading-6 text-[var(--text-strong)]">
            {drag?.inside ? 'Relâchez pour déposer' : drag?.near ? 'Encore un peu…' : 'Glissez vos fichiers ici'}
          </p>
          <p className="m-0 text-[14px] leading-5 text-[var(--text-muted)]">PDF, JPG ou PNG · {maxSize} Mo max par fichier</p>
          <button type="button" onClick={(e) => { e.stopPropagation(); input.current?.click(); }}
            className="mt-3 min-h-11 rounded-full border border-[var(--border-control)] bg-[var(--surface)] px-[18px] text-[15px] font-medium text-[var(--text-strong)] hover:bg-[var(--bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]">
            Parcourir les fichiers
          </button>
        </div>
        <input ref={input} type="file" multiple accept={accept.join(',')} tabIndex={-1} aria-hidden="true" className="pointer-events-none absolute size-px opacity-0"
          onChange={(e) => { add([...e.target.files]); e.target.value = ''; }} />
        {/* Aperçu aimanté */}
        <motion.div aria-hidden="true" style={{ x: gx, y: gy, scale: gs, opacity: gs }} className="pointer-events-none absolute left-0 top-0 z-10 -ml-[60px] -mt-[46px] h-[92px] w-[120px]">
          <span className="absolute inset-x-3 bottom-4 top-0 -rotate-[7deg] rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface)] shadow-[var(--shadow-popover)]" />
          <span className="absolute inset-x-3 bottom-4 top-0 rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface)] shadow-[var(--shadow-popover)]" />
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--accent)] px-2.5 py-1 text-[13px] font-semibold leading-[18px] text-[var(--accent-fg)]">
            {drag?.count || 1} fichier{(drag?.count || 1) > 1 ? 's' : ''}
          </span>
        </motion.div>
      </motion.div>

      <div className="grid gap-3">
        <ul ref={list} aria-label="Fichiers déposés" className="m-0 grid list-none gap-2 p-0">
          <AnimatePresence initial={false}>
            {items.map((it) => (
              <motion.li key={it.id} layout={!reduce}
                initial={reduce ? false : { x: it.from.x, y: it.from.y, scale: 0.42, opacity: 0 }}
                animate={{ x: 0, y: 0, scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 20, delay: it.from.delay } }}
                exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
                className="grid grid-cols-[48px_1fr_auto] items-center gap-3 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-2.5 pr-2">
                <span className="relative grid size-12 place-items-center overflow-hidden rounded-lg bg-[var(--raised)] text-[var(--text-muted)]">
                  {it.thumb ? <img alt="" src={it.thumb} className="size-full object-cover" /> : (
                    <><svg viewBox="0 0 24 24" aria-hidden="true" className="size-[26px] fill-none stroke-current [stroke-linejoin:round] [stroke-width:1.5]"><path d="M7 3.5h7l4.5 4.5v12.5H7zM14 3.5V8h4.5" /></svg>
                      <span className="absolute bottom-[5px] rounded-[3px] bg-[var(--text-strong)] px-[3px] font-[family-name:var(--font-mono)] text-[9px] font-semibold leading-3 text-[var(--surface)]">{(it.name.split('.').pop() || '').slice(0, 4).toUpperCase()}</span></>
                  )}
                  {it.state === 'done' && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-[var(--up)] text-[var(--surface)] shadow-[0_0_0_2px_var(--surface)]">
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3 fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4]"><path d="M5.5 12.5l4 4 9-9" /></svg>
                    </motion.span>
                  )}
                </span>
                <span className="grid min-w-0 gap-1">
                  <span className="truncate text-[15px] font-medium leading-5 text-[var(--text-strong)]">{it.name}</span>
                  <span className={`text-[14px] leading-5 tabular-nums ${it.state === 'error' ? 'text-[var(--down)]' : it.state === 'done' ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
                    {it.state === 'error' ? it.error : it.state === 'done' ? (it.meta || `${fmt(it.size)} · Envoyé`) : `${fmt(it.size)} · ${it.state === 'queued' ? 'En attente' : `Envoi ${Math.round(it.progress * 100)} %`}`}
                  </span>
                  {it.state !== 'done' && !(it.state === 'error' && !it.retryable) && (
                    <span role="progressbar" aria-label={`Envoi de ${it.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(it.progress * 100)}
                      className="relative h-1 overflow-hidden rounded-sm bg-[var(--border)]">
                      <span className={`absolute inset-0 origin-left transition-transform duration-200 ease-linear ${it.state === 'error' ? 'bg-[var(--down)]' : 'bg-[var(--accent)]'}`} style={{ transform: `scaleX(${it.progress})` }} />
                    </span>
                  )}
                </span>
                <span className="flex items-center">
                  {it.state === 'error' && it.retryable && (
                    <IconBtn label={`Réessayer l’envoi de ${it.name}`} d="M5 12a7 7 0 1 0 2.05-4.95M5 5v4h4" onClick={() => send(it)} />
                  )}
                  <IconBtn label={`Retirer ${it.name}`} d="M7 7l10 10M17 7L7 17" onClick={() => remove(it)} />
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {!items.length && <p className="m-0 rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-center text-[15px] leading-[22px] text-[var(--text-muted)]">Aucune pièce pour l’instant. Les fichiers déposés apparaîtront ici.</p>}
        <p className="m-0 text-[14px] leading-5 tabular-nums text-[var(--text-muted)]">
          {items.length ? `${items.length} pièce${items.length > 1 ? 's' : ''} · ${fmt(total)}${busy ? ' · envoi en cours' : ''} · ${ok} envoyée${ok > 1 ? 's' : ''}` : '0 pièce'}
        </p>
      </div>
      <p role="status" aria-live="polite" className="sr-only">{live}</p>
    </div>
  );
}

function IconBtn({ label, d, onClick }) {
  return (
    <button type="button" aria-label={label} onClick={onClick}
      className="grid size-11 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--state-hover)] hover:text-[var(--text-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--focus-ring)]">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.75]"><path d={d} /></svg>
    </button>
  );
}

/* Exemple : envoi réel avec suivi de progression (XHR)
const upload = (file, onProgress) => new Promise((res, rej) => {
  const x = new XMLHttpRequest(); x.open('POST', '/api/pieces');
  x.upload.onprogress = (e) => onProgress(e.loaded / e.total);
  x.onload = () => (x.status < 300 ? res() : rej(new Error('Refusé par le serveur')));
  x.onerror = () => rej(new Error('Connexion perdue'));
  const body = new FormData(); body.append('fichier', file); x.send(body);
});
<MagnetDrop upload={upload} maxSize={10} />
*/
