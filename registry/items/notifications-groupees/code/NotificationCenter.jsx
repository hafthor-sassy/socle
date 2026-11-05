// Centre de notifications groupées — React + Tailwind CSS + framer-motion. Couleurs : variables de tokens.css.
// Les notifications d'une même source forment une pile ; un clic la déplie. `layout` anime chaque changement.
import { useState } from 'react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';

const SPRINGS = { doux: { type: 'spring', stiffness: 300, damping: 30 }, sec: { type: 'spring', stiffness: 500, damping: 46 }, joueur: { type: 'spring', stiffness: 320, damping: 20 } };
const TONES = {
  blue: 'bg-[var(--tint-blue-bg)] text-[var(--tint-blue-fg)] border-[var(--tint-blue-border)]',
  violet: 'bg-[var(--tint-violet-bg)] text-[var(--tint-violet-fg)] border-[var(--tint-violet-border)]',
  amber: 'bg-[var(--tint-amber-bg)] text-[var(--tint-amber-fg)] border-[var(--tint-amber-border)]',
  green: 'bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)] border-[var(--tint-green-border)]',
};

/**
 * @typedef {{ id: string, title: string, text: string, time: string, read?: boolean }} Notif
 * @typedef {{ id: string, name: string, icon: React.ReactNode, tone: keyof TONES, items: Notif[] }} Group
 *
 * @param {object} props
 * @param {Group[]} props.groups            Groupes triés du plus récent au plus ancien (contrôlé)
 * @param {(groups: Group[]) => void} props.onChange
 * @param {'doux'|'sec'|'joueur'} [props.spring]
 * @param {1|2|3} [props.stackDepth]        Cartes visibles dans une pile repliée
 * @param {(n: Notif, g: Group) => void} [props.onOpen]
 */
export default function NotificationCenter({ groups, onChange, spring = 'doux', stackDepth = 3, onOpen }) {
  const reduce = useReducedMotion();
  const t = reduce ? { duration: 0 } : SPRINGS[spring] || SPRINGS.doux;
  const [open, setOpen] = useState({});
  const [filter, setFilter] = useState('all');
  const unread = groups.reduce((n, g) => n + g.items.filter((i) => !i.read).length, 0);

  const patch = (fn) => onChange(groups.map(fn).filter((g) => g.items.length));
  const markRead = (gid, nid) => patch((g) => (g.id !== gid ? g : { ...g, items: g.items.map((i) => (i.id === nid ? { ...i, read: true } : i)) }));
  const remove = (gid, nid) => patch((g) => (g.id !== gid ? g : { ...g, items: g.items.filter((i) => i.id !== nid) }));
  const clearGroup = (gid) => onChange(groups.filter((g) => g.id !== gid));
  const readAll = () => onChange(groups.map((g) => ({ ...g, items: g.items.map((i) => ({ ...i, read: true })) })));

  const visible = groups.map((g) => ({ ...g, shown: filter === 'unread' ? g.items.filter((i) => !i.read) : g.items })).filter((g) => g.shown.length);

  return (
    <section aria-labelledby="ng-title" className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 pb-3 pt-2 shadow-[var(--shadow-popover)] max-sm:rounded-none max-sm:border-0 max-sm:shadow-none">
      <header className="flex items-center justify-between gap-3 pb-1 pl-2 pr-1 pt-2">
        <h2 id="ng-title" className="m-0 flex items-center gap-2 text-lg font-semibold tracking-[-0.02em] text-[var(--text-strong)]">
          Notifications
          {unread > 0 && <span className="h-[22px] min-w-6 rounded-full border border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)] px-2 text-center text-xs font-semibold leading-5 tabular-nums">{unread}</span>}
        </h2>
        <button type="button" disabled={!unread} onClick={readAll} className="h-11 rounded-lg px-2.5 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent-subtle)] disabled:bg-transparent disabled:text-[var(--text-disabled)]">Tout marquer comme lu</button>
      </header>

      <div role="radiogroup" aria-label="Filtrer" className="mb-3 ml-2 mt-1 inline-flex gap-0.5 rounded-full border border-[var(--border)] bg-[var(--raised)] p-[3px] max-sm:mr-2 max-sm:flex">
        {[['all', 'Toutes'], ['unread', 'Non lues']].map(([v, l]) => (
          <button key={v} type="button" role="radio" aria-checked={filter === v} onClick={() => setFilter(v)}
            className={`h-9 rounded-full px-3.5 text-sm font-medium max-sm:flex-1 ${filter === v ? 'bg-[var(--surface)] text-[var(--text-strong)] shadow-[var(--shadow-overlay),inset_0_0_0_1px_var(--border)]' : 'text-[var(--text-muted)]'}`}>{l}</button>
        ))}
      </div>

      <LayoutGroup>
        <motion.div layout transition={t} className="flex flex-col">
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((g) => {
              const isOpen = open[g.id] && g.shown.length > 1;
              const depth = isOpen ? 0 : Math.min(g.shown.length - 1, stackDepth - 1);
              return (
                <motion.div key={g.id} layout transition={t} role="group" aria-label={g.name}
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
                  className="relative mb-3">
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div layout="position" transition={t} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} className="flex h-11 items-center gap-2 pl-2">
                        <span className="mr-auto text-[15px] font-semibold text-[var(--text-strong)]">{g.name}</span>
                        <button type="button" onClick={() => setOpen((o) => ({ ...o, [g.id]: false }))} className="h-9 rounded-full border border-[var(--border)] bg-[var(--raised)] px-3 text-[13px] font-medium hover:text-[var(--text-strong)]">Réduire</button>
                        <button type="button" aria-label={`Tout effacer : ${g.name}`} onClick={() => clearGroup(g.id)} className="grid h-9 w-9 place-items-center rounded-full border border-[var(--border)] bg-[var(--raised)]"><XIcon /></button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="relative isolate flex flex-col gap-2" style={{ marginBottom: depth * 8 }}>
                    <AnimatePresence initial={false} mode="popLayout">
                      {g.shown.map((n, i) => {
                        const back = !isOpen && i > 0;
                        if (back && i >= stackDepth) return null;
                        return (
                          <motion.article
                            key={n.id} layout transition={t}
                            initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: back && i === 2 ? 0.7 : 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
                            drag={!back && (isOpen || g.shown.length === 1) && !reduce ? 'x' : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={{ left: 0.9, right: 0.1 }}
                            onDragEnd={(_, info) => { if (info.offset.x < -140 || info.velocity.x < -700) remove(g.id, n.id); }}
                            aria-hidden={back || undefined}
                            style={back ? { position: 'absolute', inset: `${i * 8}px ${i * 8}px ${-i * 8}px`, zIndex: -i, pointerEvents: 'none' } : undefined}
                            className="group relative flex min-h-[72px] touch-pan-y gap-3 rounded-xl border border-[var(--border)] bg-[var(--raised)] p-3"
                          >
                            <motion.div animate={{ opacity: back ? 0 : 1 }} transition={{ duration: 0.2, delay: back ? 0 : 0.06 }} className="flex min-w-0 flex-1 gap-3">
                              <span aria-hidden="true" className={`grid h-9 w-9 flex-none place-items-center rounded-[10px] border ${TONES[g.tone]}`}>{g.icon}</span>
                              <span className="flex min-w-0 flex-1 flex-col pr-8">
                                <span className="flex items-center gap-1.5 text-[13px] leading-[18px] text-[var(--text-muted)]">
                                  {g.name} <span aria-hidden="true">·</span> {n.time}
                                  {!isOpen && i === 0 && g.shown.length > 1 && <span className="ml-auto rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 text-xs font-semibold text-[var(--text)]">+{g.shown.length - 1}</span>}
                                </span>
                                <span className={`mt-0.5 text-[15px] leading-5 text-[var(--text-strong)] ${n.read ? 'font-medium' : 'font-semibold'}`}>{n.title}</span>
                                <span className="text-sm leading-5 text-[var(--text-muted)]">{n.text}</span>
                              </span>
                              {!n.read && <span aria-hidden="true" className="absolute left-10 top-2 h-2.5 w-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_0_2px_var(--raised)]" />}
                            </motion.div>
                            {!back && (
                              <>
                                <button type="button"
                                  aria-expanded={g.shown.length > 1 ? isOpen : undefined}
                                  aria-label={!isOpen && g.shown.length > 1 ? `${g.name}, ${g.shown.length} notifications. Déplier` : `${n.title}. ${n.text}`}
                                  onClick={() => (!isOpen && g.shown.length > 1 ? setOpen((o) => ({ ...o, [g.id]: true })) : (markRead(g.id, n.id), onOpen && onOpen(n, g)))}
                                  className="absolute inset-0 z-[1] rounded-[inherit] hover:bg-[var(--state-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]" />
                                <button type="button" aria-label={`Effacer : ${n.title}`} onClick={() => remove(g.id, n.id)}
                                  className="absolute right-1.5 top-1.5 z-[2] grid h-8 w-8 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 max-sm:right-0 max-sm:top-0 max-sm:h-11 max-sm:w-11 max-sm:border-0 max-sm:bg-transparent"><XIcon /></button>
                              </>
                            )}
                          </motion.article>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>

      {!visible.length && (
        <div className="grid justify-items-center gap-1 px-4 pb-6 pt-8 text-center">
          <p className="m-0 font-semibold text-[var(--text-strong)]">{filter === 'unread' && groups.length ? 'Aucune notification non lue' : 'Vous êtes à jour'}</p>
          <p className="m-0 text-sm text-[var(--text-muted)]">Les nouvelles alertes apparaîtront ici.</p>
        </div>
      )}
      <p aria-live="polite" className="sr-only">{unread ? `${unread} notifications non lues` : 'Aucune notification non lue'}</p>
    </section>
  );
}

function XIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="1.75" strokeLinecap="round"><path d="M7 7l10 10M17 7 7 17" /></svg>;
}

/* Exemple
const [groups, setGroups] = useState([{ id: 'orders', name: 'Commandes', tone: 'blue', icon: <BagIcon />, items: [
  { id: 'n1', title: 'Nouvelle commande #4821', text: 'Claire Dumas · 3 articles · 128,90 €', time: 'il y a 2 min' },
  { id: 'n2', title: 'Nouvelle commande #4820', text: 'Hugo Petit · 1 article · 39,00 €', time: 'il y a 8 min' } ] }]);
// Nouvelle arrivée : setGroups((gs) => { const g = gs.find((x) => x.id === 'orders'); return [{ ...g, items: [nouvelle, ...g.items] }, ...gs.filter((x) => x !== g)]; });
<NotificationCenter groups={groups} onChange={setGroups} />
*/
