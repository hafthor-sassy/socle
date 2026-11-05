// Fil d’activité d’agent IA — React + Tailwind CSS + framer-motion. Couleurs : variables de tokens.css. Personnes et données fictives.
'use client';
import { useCallback, useEffect, useId, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

/* Scénarios : un agent téléphonique prend, déplace ou oriente un rendez-vous pendant l’appel.
   Étapes : plan · think · tool · result · ask (avec ses suites ok / ko) · final. dur en ms à la vitesse 1×. */
export const SCENARIOS = {
  rdv: {
    caller: 'Camille Roux', number: '+33 6 •• •• 42 18', intent: 'Nouveau rendez-vous', start: '14:02:07', offset: 31,
    steps: [
      { t: 'plan', dur: 900, items: ['Retrouver la fiche de Camille', 'Chercher un créneau mardi matin', 'Réserver le créneau retenu', 'Confirmer par SMS'] },
      { t: 'think', dur: 1700, p: 0, h: 'Comprendre la demande', text: 'Camille veut un détartrage mardi matin, avant 11 h. Je retrouve sa fiche avec son numéro pour connaître sa praticienne habituelle, puis je cherche un créneau de 30 minutes.' },
      { t: 'tool', dur: 420, p: 0, name: 'patients.rechercher', args: { telephone: '+33 6 •• •• 42 18', nom: 'Roux' } },
      { t: 'result', dur: 260, pd: 0, title: 'Fiche trouvée', kv: [['Patiente', 'Camille Roux · P-20418'], ['Praticienne', 'Dr Hélène Martin'], ['Dernière visite', '12 mai 2026']] },
      { t: 'tool', dur: 780, p: 1, name: 'agenda.chercher_creneaux', args: { praticien: 'dr-martin', date: '2026-11-10', avant: '11:00', duree_min: 30 } },
      { t: 'result', dur: 260, pd: 1, title: '3 créneaux mardi 10 nov.', slots: ['08:30', '09:15', '10:30'], pick: 2 },
      { t: 'think', dur: 1100, p: 2, h: 'Choisir le créneau', text: 'Camille préfère la fin de matinée : 10 h 30 lui convient. La réservation engage l’agenda du cabinet.' },
      { t: 'ask', p: 2, title: 'Réserver mardi 10 nov. à 10:30 ?', rule: 'Règle du cabinet : patiente connue, créneau sous 14 jours.',
        kv: [['Patiente', 'Camille Roux'], ['Praticienne', 'Dr Hélène Martin'], ['Acte', 'Détartrage · 30 min'], ['Créneau', 'mar. 10 nov. · 10:30 – 11:00']],
        ok: [
          { t: 'tool', dur: 520, p: 2, name: 'agenda.reserver', args: { patient_id: 'P-20418', praticien: 'dr-martin', debut: '2026-11-10T10:30', duree_min: 30, motif: 'Détartrage' } },
          { t: 'result', dur: 240, pd: 2, title: 'Rendez-vous créé', note: 'Réservation <b>RDV-7F3K2</b> ajoutée à l’agenda du Dr Martin.' },
          { t: 'tool', dur: 380, p: 3, name: 'sms.envoyer', args: { a: '+33 6 •• •• 42 18', modele: 'confirmation_rdv', rdv: 'RDV-7F3K2' } },
          { t: 'result', dur: 220, pd: 3, title: 'SMS remis', note: 'Message remis à l’opérateur, accusé de réception attendu.' },
          { t: 'final', dur: 2600, text: 'C’est noté, Camille : détartrage mardi 10 novembre à 10 h 30 avec le Dr Martin. Je vous envoie la confirmation par SMS. Puis-je faire autre chose pour vous ?', tags: [['ok', 'Rendez-vous créé'], ['ok', 'SMS envoyé']] }
        ],
        ko: [
          { t: 'think', dur: 1000, h: 'Changer d’approche', skip: [2, 3], text: 'Réservation refusée : je ne bloque pas le créneau. Je propose à Camille d’être rappelée par le secrétariat.' },
          { t: 'tool', dur: 420, name: 'rappels.creer', args: { patient_id: 'P-20418', motif: 'Détartrage, mardi matin', avant: '17:00' } },
          { t: 'result', dur: 220, title: 'Rappel programmé', note: 'Le secrétariat rappelle Camille avant <b>17:00</b>.' },
          { t: 'final', dur: 2400, text: 'Je préfère que le secrétariat vous confirme ce créneau, Camille. On vous rappelle avant 17 h aujourd’hui. Bonne journée !', tags: [['neutral', 'Rappel programmé']] }
        ] }
    ]
  },
  report: {
    caller: 'Julien Ferrand', number: '+33 7 •• •• 09 61', intent: 'Déplacer un rendez-vous', start: '09:41:52', offset: 24,
    steps: [
      { t: 'plan', dur: 900, items: ['Retrouver le rendez-vous de Julien', 'Trouver un créneau vendredi après-midi', 'Déplacer après validation', 'Prévenir par SMS'] },
      { t: 'think', dur: 1400, p: 0, h: 'Comprendre la demande', text: 'Julien ne peut plus venir jeudi matin. Je retrouve son rendez-vous, puis je cherche un créneau de 20 minutes vendredi après 14 h.' },
      { t: 'tool', dur: 400, p: 0, name: 'patients.rechercher', args: { telephone: '+33 7 •• •• 09 61' } },
      { t: 'result', dur: 260, pd: 0, title: 'Rendez-vous trouvé', kv: [['Patient', 'Julien Ferrand · P-11873'], ['Rendez-vous', 'jeu. 12 nov. · 09:00'], ['Acte', 'Contrôle annuel · 20 min']] },
      { t: 'tool', dur: 720, p: 1, name: 'agenda.chercher_creneaux', args: { praticien: 'dr-martin', date: '2026-11-13', apres: '14:00', duree_min: 20 } },
      { t: 'result', dur: 260, pd: 1, title: '3 créneaux vendredi 13 nov.', slots: ['14:30', '15:10', '16:40'], pick: 0 },
      { t: 'ask', p: 2, title: 'Déplacer au vendredi 13 nov. à 14:30 ?', rule: 'Règle du cabinet : déplacement sans frais à plus de 24 h.',
        kv: [['Patient', 'Julien Ferrand'], ['Avant', 'jeu. 12 nov. · 09:00'], ['Après', 'ven. 13 nov. · 14:30 – 14:50'], ['Praticienne', 'Dr Hélène Martin']],
        ok: [
          { t: 'tool', dur: 1500, p: 2, fail: true, name: 'agenda.deplacer', args: { rdv: 'RDV-4H8PD', debut: '2026-11-13T14:30' } },
          { t: 'result', dur: 2000, title: 'Agenda indisponible', error: 'HTTP 503 · aucune réponse en 1,5 s', retry: true },
          { t: 'think', dur: 900, p: 2, h: 'Décider d’un nouvel essai', text: 'Erreur temporaire de l’agenda : je réessaie une fois avant de prévenir Julien.' },
          { t: 'tool', dur: 480, p: 2, name: 'agenda.deplacer', label: '2ᵉ essai', args: { rdv: 'RDV-4H8PD', debut: '2026-11-13T14:30' } },
          { t: 'result', dur: 240, pd: 2, title: 'Rendez-vous déplacé', note: '<b>RDV-4H8PD</b> passe au vendredi 13 nov. à 14:30.' },
          { t: 'tool', dur: 360, p: 3, name: 'sms.envoyer', args: { a: '+33 7 •• •• 09 61', modele: 'deplacement_rdv', rdv: 'RDV-4H8PD' } },
          { t: 'result', dur: 220, pd: 3, title: 'SMS remis', note: 'Message remis à l’opérateur.' },
          { t: 'final', dur: 2400, text: 'C’est fait, Julien : votre contrôle passe au vendredi 13 novembre à 14 h 30. Vous recevez la confirmation par SMS dans un instant.', tags: [['ok', 'Rendez-vous déplacé'], ['neutral', '1 nouvelle tentative']] }
        ],
        ko: [
          { t: 'think', dur: 900, h: 'Changer d’approche', skip: [2, 3], text: 'Déplacement refusé : le rendez-vous de jeudi reste en place. Je le dis simplement à Julien.' },
          { t: 'final', dur: 2200, text: 'Je garde votre rendez-vous de jeudi à 9 h pour l’instant, Julien. Le secrétariat vous rappelle s’il se libère un créneau vendredi.', tags: [['neutral', 'Rendez-vous inchangé']] }
        ] }
    ]
  },
  urgence: {
    caller: 'Sofia Benali', number: '+33 6 •• •• 77 03', intent: 'Douleur · urgence', start: '11:18:40', offset: 19,
    steps: [
      { t: 'plan', dur: 800, items: ['Évaluer l’urgence', 'Chercher un créneau d’urgence aujourd’hui', 'Orienter l’appel', 'Laisser une note au praticien'] },
      { t: 'think', dur: 1500, p: 0, pd: 0, h: 'Évaluer l’urgence', text: 'Douleur forte depuis hier soir et joue gonflée : je traite l’appel comme une urgence et je cherche d’abord un créneau aujourd’hui.' },
      { t: 'tool', dur: 640, p: 1, name: 'agenda.chercher_creneaux', args: { type: 'urgence', date: '2026-11-05', toute_la_journee: true } },
      { t: 'result', dur: 260, pd: 1, title: 'Aucun créneau', empty: 'Aucun créneau d’urgence disponible aujourd’hui.' },
      { t: 'think', dur: 1300, p: 2, h: 'Chercher une issue', text: 'Plus de créneau libre. Le Dr Martin garde une ligne pour ce cas, mais le transfert l’interrompt en consultation.' },
      { t: 'ask', p: 2, title: 'Transférer l’appel au Dr Martin ?', rule: 'Règle du cabinet : transfert autorisé pour une urgence signalée.',
        kv: [['Appelante', 'Sofia Benali'], ['Motif', 'Douleur forte, gonflement'], ['Ligne', 'Urgences du cabinet'], ['Attente estimée', 'moins de 2 min']],
        ok: [
          { t: 'tool', dur: 900, p: 2, name: 'telephonie.transferer', args: { vers: 'ligne-urgences', priorite: 'haute', annonce: true } },
          { t: 'result', dur: 240, pd: 2, title: 'Transfert accepté', note: 'Le Dr Martin prend l’appel dans environ <b>1 min</b>.' },
          { t: 'tool', dur: 340, p: 3, name: 'notes.ajouter', args: { patient: 'Sofia Benali', note: 'Douleur forte depuis la veille, gonflement joue droite.' } },
          { t: 'result', dur: 200, pd: 3, title: 'Note ajoutée', note: 'Visible dans le dossier avant la reprise de l’appel.' },
          { t: 'final', dur: 2200, text: 'Je vous passe le Dr Martin tout de suite, Sofia. Restez en ligne, cela prend moins de deux minutes.', tags: [['ok', 'Appel transféré'], ['ok', 'Note au dossier']] }
        ],
        ko: [
          { t: 'tool', dur: 420, p: 3, skip: [2], name: 'rappels.creer', args: { patient: 'Sofia Benali', priorite: 'haute', avant: '15:00' } },
          { t: 'result', dur: 220, pd: 3, title: 'Rappel prioritaire', note: 'Le Dr Martin rappelle Sofia avant <b>15:00</b>.' },
          { t: 'final', dur: 2600, text: 'Le Dr Martin vous rappelle dès la fin de sa consultation, avant 15 h. Si la douleur augmente ou si vous avez de la fièvre, appelez le 15.', tags: [['neutral', 'Rappel prioritaire']] }
        ] }
    ]
  }
};


const KIND = { plan: 'Plan', think: 'Réflexion', tool: 'Outil', result: 'Résultat', ask: 'Validation', auto: 'Validation', final: 'Réponse' };
const fr = (x, d = 1) => x.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtDur = (ms) => (ms < 1000 ? `${Math.round(ms)} ms` : `${fr(ms / 1000)} s`);
const pad = (n) => String(n).padStart(2, '0');
const copy = (s) => ({ ...s });

function flatten(steps, approval) {
  const out = [];
  steps.forEach((s) => {
    if (s.t === 'ask' && !approval) out.push({ t: 'auto', dur: 260, p: s.p, title: 'Validation automatique', rule: s.rule }, ...s.ok.map(copy));
    else out.push(copy(s));
  });
  return out;
}

/* Texte avec <b>…</b> → éléments React (sans innerHTML). */
function Rich({ text }) {
  return text.split(/(<b>.*?<\/b>)/).map((part, i) =>
    part.startsWith('<b>') ? <b key={i} className="font-semibold">{part.slice(3, -4)}</b> : <span key={i}>{part}</span>
  );
}

const Svg = ({ children, size = 14, w = 2.25, className = '' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>{children}</svg>
);
const Icon = {
  running: () => <Svg className="motion-safe:animate-spin"><circle cx="12" cy="12" r="8" opacity=".25" /><path d="M20 12a8 8 0 0 0-8-8" /></Svg>,
  success: () => <Svg><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>,
  approved: () => <Svg><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>,
  error: () => <Svg><path d="M7 7l10 10M17 7L7 17" /></Svg>,
  waiting: () => <Svg><path d="M9.5 7v10M14.5 7v10" /></Svg>,
  refused: () => <Svg><path d="M6 12h12" /></Svg>,
};
const NODE = {
  running: 'border-[var(--accent-subtle-border)] bg-[var(--surface)] text-[var(--accent)] shadow-[0_0_0_4px_var(--glow-accent)]',
  success: 'border-[var(--tint-green-border)] bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]',
  approved: 'border-[var(--tint-green-border)] bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)]',
  error: 'border-[var(--tint-red-border)] bg-[var(--tint-red-bg)] text-[var(--tint-red-fg)]',
  waiting: 'border-[var(--tint-amber-border)] bg-[var(--tint-amber-bg)] text-[var(--tint-amber-fg)] shadow-[0_0_0_4px_var(--glow)]',
  refused: 'border-[var(--tint-neutral-border)] bg-[var(--tint-neutral-bg)] text-[var(--tint-neutral-fg)]',
};
const TONE = {
  run: 'bg-[var(--accent-subtle)] text-[var(--text-strong)] border-[var(--accent-subtle-border)]',
  wait: 'bg-[var(--tint-amber-bg)] text-[var(--tint-amber-fg)] border-[var(--tint-amber-border)]',
  err: 'bg-[var(--tint-red-bg)] text-[var(--tint-red-fg)] border-[var(--tint-red-border)]',
  ok: 'bg-[var(--tint-green-bg)] text-[var(--tint-green-fg)] border-[var(--tint-green-border)]',
  neutral: 'bg-[var(--tint-neutral-bg)] text-[var(--tint-neutral-fg)] border-[var(--tint-neutral-border)]',
};
const Badge = ({ tone, children }) => (
  <span className={`inline-flex h-[22px] flex-none items-center rounded-full border px-2 text-xs font-medium ${TONE[tone]}`}>{children}</span>
);

function Collapse({ open, children }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div key="c" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
          transition={reduce ? { duration: 0 } : { height: { type: 'spring', stiffness: 320, damping: 34 }, opacity: { duration: 0.18 } }} className="overflow-hidden">
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Toggle({ open, onClick, controls, children }) {
  return (
    <button type="button" aria-expanded={open} aria-controls={controls} onClick={onClick}
      className="relative -my-1.5 -ml-2 inline-flex min-h-8 items-center gap-1.5 rounded-[var(--radius-ctl)] px-2 text-[13px] text-[var(--text-muted)] after:absolute after:inset-x-0 after:-inset-y-1.5 hover:bg-[var(--state-hover)] hover:text-[var(--text-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]">
      <Svg w={2}><path d="M9 6l6 6-6 6" style={{ transformOrigin: 'center', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 260ms cubic-bezier(.2,1.2,.3,1)' }} /></Svg>
      <span>{children}</span>
    </button>
  );
}

function Json({ obj }) {
  const keys = Object.keys(obj);
  return (
    <pre className="m-0 mt-1 whitespace-pre-wrap break-words rounded-[var(--radius-ctl)] border border-[var(--border)] bg-[var(--raised)] p-3 font-mono text-xs leading-[18px] text-[var(--text-muted)]">
      {'{\n'}
      {keys.map((k, i) => {
        const v = obj[k];
        const cls = typeof v === 'number' ? 'text-[var(--tint-blue-fg)]' : typeof v === 'boolean' ? 'text-[var(--tint-amber-fg)]' : 'text-[var(--tint-green-fg)]';
        return (
          <span key={k}>{'  '}<span className="text-[var(--tint-violet-fg)]">"{k}"</span>: <span className={cls}>{typeof v === 'string' ? `"${v}"` : String(v)}</span>{i < keys.length - 1 ? ',\n' : '\n'}</span>
        );
      })}
      {'}'}
    </pre>
  );
}

function KV({ rows, bare }) {
  return (
    <dl className={`m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px] leading-5 ${bare ? '' : 'rounded-[var(--radius-ctl)] bg-[var(--raised)] p-3'}`}>
      {rows.map(([k, v]) => [<dt key={k + 't'} className="text-[var(--text-muted)]">{k}</dt>, <dd key={k + 'd'} className="m-0 min-w-0 font-medium text-[var(--text-strong)]">{v}</dd>])}
    </dl>
  );
}

const STYLE = `
@keyframes af-shine{from{-webkit-mask-position:100% 0;mask-position:100% 0}to{-webkit-mask-position:0 0;mask-position:0 0}}
@keyframes af-wave{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}
@keyframes af-ping{0%{opacity:.7;transform:scale(.6)}100%{opacity:0;transform:scale(1.6)}}
@keyframes af-slide{from{transform:translateX(-100%)}to{transform:translateX(250%)}}
@keyframes af-blink{50%{opacity:0}}
@media (prefers-reduced-motion:no-preference){
.af-shine{-webkit-mask-image:linear-gradient(90deg,#000 30%,rgba(0,0,0,.45) 50%,#000 70%);mask-image:linear-gradient(90deg,#000 30%,rgba(0,0,0,.45) 50%,#000 70%);-webkit-mask-size:300% 100%;mask-size:300% 100%;animation:af-shine 1.6s linear infinite}
.af-wave i{animation:af-wave 1.1s ease-in-out infinite}.af-ping::after{animation:af-ping 1.8s cubic-bezier(.2,0,0,1) infinite}
.af-slide{animation:af-slide 1.1s cubic-bezier(.2,0,0,1) infinite}.af-caret{animation:af-blink 1s steps(1) infinite}}
`;

/**
 * Fil d’activité d’un agent IA (téléphonique) : plan, réflexion, appels d’outil, résultats, validation humaine, réponse.
 * @param {{ agent?: string, role?: string, scenario?: keyof typeof SCENARIOS, scenarios?: object, speed?: number,
 *   density?: 'confortable'|'compacte', args?: 'replies'|'ouverts'|'masques', approval?: boolean,
 *   time?: 'relatif'|'absolu'|'masque', thinking?: boolean, autoscroll?: boolean, autoApprove?: number, loop?: boolean,
 *   height?: number|string, onDecision?: (d: {decision: 'approve'|'refuse', titre: string}) => void,
 *   onDone?: (r: {scenario: string, duree: number, outils: number, erreurs: number}) => void }} props
 */
export function AgentActivityFeed({
  agent = 'Iris',
  role = 'Agent téléphonique · Cabinet dentaire des Carmes',
  scenario = 'rdv',
  scenarios = SCENARIOS,
  speed: speedProp = 1,
  density = 'confortable',
  args = 'replies',
  approval = true,
  time = 'relatif',
  thinking = true,
  autoscroll = true,
  autoApprove = 0,     // ms avant validation automatique (démo en boucle) ; 0 = attendre un humain
  loop = false,
  height = 600,
  onDecision,
  onDone,
}) {
  const uid = useId();
  const reduce = useReducedMotion();
  const sc = scenarios[scenario] || scenarios.rdv;
  const [speed, setSpeed] = useState(speedProp);
  useEffect(() => setSpeed(speedProp), [speedProp]);
  const [, force] = useReducer((x) => x + 1, 0);
  const eng = useRef(null);
  const rootRef = useRef(null);
  const feedRef = useRef(null);
  const visible = useRef(true);
  const [follow, setFollow] = useState(true);
  const [unseen, setUnseen] = useState(0);
  const followRef = useRef(true);
  const intent = useRef(0);
  const [live, setLive] = useState('');
  const cb = useRef({ onDecision, onDone });
  cb.current = { onDecision, onDone };
  const opts = useRef({});
  opts.current = { speed, autoApprove, loop, reduce, args };
  const compact = density === 'compacte';

  /* ——— Moteur : file d’étapes sur une horloge virtuelle ——— */
  const plan = (i, v) => { const e = eng.current; if (i == null || !e.plan[i] || e.plan[i] === 'done' || e.plan[i] === 'skip') return; e.plan[i] = v; };
  const start = (s) => {
    const e = eng.current;
    Object.assign(s, { e: 0, t0: e.t, open: s.t === 'think' ? true : opts.current.args === 'ouverts' });
    if (s.t === 'plan') e.plan = s.items.map(() => 'todo');
    plan(s.p, 'active');
    if (s.t === 'tool') e.tools++;
    s.state = s.t === 'ask' ? 'waiting' : 'running';
    if (s.t === 'ask') setLive(`Validation requise : ${s.title}`);
    if (!followRef.current) setUnseen((n) => n + 1);
  };
  const finish = (s) => {
    const e = eng.current;
    if (s.t === 'tool' && s.fail) { s.state = 'error'; e.errors++; setLive(`${s.name} : échec après ${fmtDur(s.e)}`); }
    else if (s.t === 'result' && s.error) s.state = 'error';
    else { s.state = 'success'; if (s.t === 'tool') setLive(`${s.name} : réussi en ${fmtDur(s.e)}`); }
    if (s.t === 'final') setLive(`Réponse donnée : ${s.text}`);
    if (s.t === 'think') setTimeout(() => { if (!s.touched) { s.open = false; force(); } }, opts.current.reduce ? 0 : 700);
    if (s.pd != null) plan(s.pd, 'done');
    (s.skip || []).forEach((i) => plan(i, 'skip'));
  };
  const next = () => {
    const e = eng.current;
    e.i++;
    const s = e.queue[e.i];
    if (s) start(s);
    else {
      e.ended = true;
      cb.current.onDone?.({ scenario, duree: e.t, outils: e.tools, erreurs: e.errors });
      if (opts.current.loop) e.loopTimer = setTimeout(reset, 2800);
    }
  };
  const reset = useCallback(() => {
    if (eng.current) clearTimeout(eng.current.loopTimer);
    eng.current = { queue: flatten(sc.steps, approval), i: -1, t: 0, tools: 0, errors: 0, ended: false, plan: [] };
    followRef.current = true; setFollow(true); setUnseen(0);
    next();
    force();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sc, approval]);
  const decide = (ok) => {
    const e = eng.current;
    const s = e.queue[e.i];
    if (!s || s.t !== 'ask' || s.state !== 'waiting') return;
    s.state = ok ? 'approved' : 'refused';
    s.decidedAt = e.t;
    e.queue.splice(e.i + 1, 0, ...(ok ? s.ok : s.ko).map(copy));
    setLive(ok ? 'Approuvé. L’agent reprend.' : 'Refusé. L’agent adapte sa réponse.');
    cb.current.onDecision?.({ decision: ok ? 'approve' : 'refuse', titre: s.title });
    next();
    force();
  };
  const advance = (real) => {
    const e = eng.current;
    let s = e.queue[e.i];
    if (!s || e.ended) return;
    if (s.t === 'ask') {
      if (s.state !== 'waiting') return;
      s.e += real; e.t += real;
      if (opts.current.autoApprove && s.e >= opts.current.autoApprove) decide(true);
      return;
    }
    let dt = opts.current.reduce ? Infinity : real * opts.current.speed;
    while (s && s.t !== 'ask' && dt > 0) {
      const left = s.dur - s.e;
      if (dt < left) { s.e += dt; e.t += dt; dt = 0; }
      else { s.e = s.dur; e.t += left; dt -= left; finish(s); next(); s = e.queue[e.i]; }
    }
  };

  useEffect(() => { reset(); return () => clearTimeout(eng.current?.loopTimer); }, [reset]);

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const frame = (now) => {
      const dt = last ? Math.min(now - last, 100) : 16;
      last = now;
      if (visible.current && !document.hidden && eng.current && !eng.current.ended) { advance(dt); force(); }
      else last = 0;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const io = new IntersectionObserver(([en]) => { visible.current = en.isIntersecting; }, { threshold: 0.1 });
    if (rootRef.current) io.observe(rootRef.current);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Mode des arguments : appliqué aux étapes déjà affichées. */
  useEffect(() => { eng.current?.queue.forEach((s) => { if (s.t === 'tool' && s.e != null) s.open = args === 'ouverts'; }); force(); }, [args]);

  /* ——— Défilement : suit le direct, s’arrête si l’on remonte ——— */
  const gap = () => { const f = feedRef.current; return f ? f.scrollHeight - f.scrollTop - f.clientHeight : 0; };
  useLayoutEffect(() => {
    const f = feedRef.current;
    if (!f) return;
    if (followRef.current && autoscroll && gap() > 1) f.scrollTop = f.scrollHeight;
    else if (!autoscroll && followRef.current && gap() > 24) { followRef.current = false; setFollow(false); }
  });
  const markIntent = () => { intent.current = performance.now(); };
  const onScroll = () => {
    const g = gap();
    if (g < 8) { if (!followRef.current) { followRef.current = true; setFollow(true); setUnseen(0); } return; }
    if (performance.now() - intent.current < 900 && followRef.current && g > 24) { followRef.current = false; setFollow(false); setUnseen(0); }
  };
  const jump = () => {
    followRef.current = true; setFollow(true); setUnseen(0);
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
  };

  const e = eng.current;
  if (!e) return null;
  const shown = e.queue.slice(0, e.i + 1).filter((s) => s.e != null);
  const stamp = (t) => {
    if (time === 'absolu') {
      const [h, m, s0] = sc.start.split(':').map(Number);
      const s = h * 3600 + m * 60 + s0 + sc.offset + Math.floor(t / 1000);
      return `${pad(Math.floor(s / 3600) % 24)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
    }
    return `+${fr(t / 1000)} s`;
  };
  const clockS = sc.offset + Math.floor(e.t / 1000);
  const clock = `${pad(Math.floor(clockS / 60))}:${pad(clockS % 60)}`;
  const toggle = (s) => { s.touched = true; s.open = !s.open; force(); };
  const gapY = compact ? 'pb-3' : 'pb-5';
  const pad6 = compact ? 'px-4' : 'px-4 sm:px-6';

  const badge = (s) => {
    if (s.state === 'running') return <Badge tone="run">En cours</Badge>;
    if (s.state === 'waiting') return <Badge tone="wait">En attente</Badge>;
    if (s.state === 'approved') return <Badge tone="ok">Approuvé</Badge>;
    if (s.state === 'refused') return <Badge tone="neutral">Refusé</Badge>;
    if (s.state === 'error') return <Badge tone="err">{s.t === 'result' ? 'Erreur 503' : 'Échec'}</Badge>;
    return null;
  };
  const stateLabel = { running: 'En cours', waiting: 'En attente', approved: 'Approuvé', refused: 'Refusé', error: 'Échec', success: 'Réussi' };

  const title = (s) => {
    if (s.t === 'plan') return 'Plan d’action';
    if (s.t === 'think') return s.h;
    if (s.t === 'tool') return <><code className="font-mono text-[.9em] font-medium">{s.name}</code>{s.label && <span className="text-[var(--text-muted)]"> · {s.label}</span>}</>;
    if (s.t === 'final') return `Réponse à ${sc.caller.split(' ')[0]}`;
    return s.title;
  };
  const stream = (s) => s.text.slice(0, Math.min(s.text.length, Math.ceil((s.text.length * s.e) / (s.dur * 0.94))));
  const caret = (s) => s.state === 'running' && <span aria-hidden="true" className="af-caret ml-0.5 inline-block h-[1em] w-0.5 rounded-sm bg-[var(--accent)] align-[-2px]" />;

  const body = (s, i) => {
    const cid = `${uid}-c${i}`;
    switch (s.t) {
      case 'plan':
        return (
          <ol className="m-0 grid list-none gap-1 p-0">
            {s.items.map((x, k) => {
              const v = e.plan[k];
              return (
                <li key={k} className={`flex min-h-6 items-center gap-2 transition-colors ${v === 'active' ? 'text-[var(--text-strong)]' : v === 'skip' ? 'text-[var(--text-disabled)] line-through' : 'text-[var(--text-muted)]'}`}>
                  <i aria-hidden="true" className={`grid size-4 flex-none place-items-center rounded-full border not-italic text-[var(--tint-green-fg)] ${v === 'done' ? 'border-[var(--tint-green-border)] bg-[var(--tint-green-bg)]' : v === 'active' ? 'border-[var(--accent)] shadow-[inset_0_0_0_3px_var(--surface),inset_0_0_0_8px_var(--accent)]' : v === 'skip' ? 'border-dashed border-[var(--text-disabled)]' : 'border-[var(--border-control)]'}`}>
                    {v === 'done' && <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 22 }}><Svg size={10} w={3}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg></motion.span>}
                  </i>
                  <span>{x}</span>
                </li>
              );
            })}
          </ol>
        );
      case 'think':
        return (
          <div>
            <Toggle open={s.open} controls={cid} onClick={() => toggle(s)}>{s.open ? 'Masquer le raisonnement' : 'Afficher le raisonnement'}</Toggle>
            <div id={cid}><Collapse open={s.open}><p className="m-0 max-w-[62ch] pt-1 text-[var(--text-muted)]">{stream(s)}{caret(s)}</p></Collapse></div>
          </div>
        );
      case 'tool':
        return (
          <>
            {s.state === 'running' && <div aria-hidden="true" className="relative h-0.5 overflow-hidden rounded-sm bg-[var(--scale-track)]"><span className="af-slide absolute inset-y-0 left-0 w-2/5 rounded-sm bg-[var(--accent)]" /></div>}
            {args !== 'masques' && (
              <div>
                <Toggle open={s.open} controls={cid} onClick={() => toggle(s)}>Arguments ({Object.keys(s.args).length})</Toggle>
                <div id={cid}><Collapse open={s.open}><Json obj={s.args} /></Collapse></div>
              </div>
            )}
          </>
        );
      case 'result':
        if (s.kv) return <KV rows={s.kv} />;
        if (s.slots) return (
          <ul aria-label="Créneaux proposés" className="m-0 flex list-none flex-wrap gap-2 p-0">
            {s.slots.map((x, k) => (
              <motion.li key={x} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 22, delay: k * 0.06 }}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 font-mono text-[13px] font-medium ${k === s.pick ? 'border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)] text-[var(--text-strong)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)]'}`}>
                {k === s.pick && <Svg size={10} w={3}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>}{x}{k === s.pick && <span className="font-sans text-xs text-[var(--text-muted)]">retenu</span>}
              </motion.li>
            ))}
          </ul>
        );
        if (s.empty) return <p className="m-0 rounded-[var(--radius-ctl)] border border-dashed border-[var(--border-control)] p-3 text-[13px] text-[var(--text-muted)]">{s.empty}</p>;
        if (s.error) return (
          <p className="m-0 rounded-[var(--radius-ctl)] border border-[var(--tint-red-border)] bg-[var(--tint-red-bg)] p-3 text-[13px] leading-5 text-[var(--tint-red-fg)]">
            <b className="font-semibold">{s.error}</b>
            <small className="block text-xs">{s.state === 'running' ? `Nouvelle tentative dans ${fr(Math.max(0, s.dur - s.e) / 1000)} s` : 'Nouvelle tentative lancée.'}</small>
          </p>
        );
        return <p className="m-0 rounded-[var(--radius-ctl)] bg-[var(--raised)] p-3 text-[13px] leading-5 text-[var(--text)]"><Rich text={s.note} /></p>;
      case 'ask':
        return (
          <div className="grid gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--raised)] p-4">
            <KV rows={s.kv} bare />
            {s.state === 'waiting' ? (
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => decide(false)} className="inline-flex h-11 items-center rounded-[var(--radius-ctl)] border border-[var(--border-control)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text-strong)] transition-transform hover:bg-[var(--raised)] active:scale-[.97] md:h-9 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]">Refuser</button>
                <button type="button" onClick={() => decide(true)} className="inline-flex h-11 items-center rounded-[var(--radius-ctl)] border border-[var(--accent)] bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-fg)] transition-transform hover:bg-[var(--accent-hover)] active:scale-[.97] md:h-9 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]">Approuver</button>
                <span className="flex-[1_1_160px] text-xs text-[var(--text-muted)]">L’appelant patiente en musique pendant votre décision.</span>
              </div>
            ) : (
              <p className="m-0 flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
                {s.state === 'approved' ? <Icon.success /> : <Icon.refused />}
                {s.state === 'approved' ? 'Approuvé' : 'Refusé'} par vous {time === 'absolu' ? `à ${stamp(s.decidedAt)}` : `après ${fmtDur(s.e)}`}
              </p>
            )}
          </div>
        );
      case 'auto':
        return <p className="m-0 text-[var(--text-muted)]">{s.rule}</p>;
      case 'final':
        return (
          <>
            <p className="m-0 max-w-[60ch] border-l-2 border-[var(--accent)] pl-3 text-[var(--text-strong)]" style={{ fontSize: compact ? 15 : 16, lineHeight: compact ? '22px' : '24px' }}>{stream(s)}{caret(s)}</p>
            {s.state === 'success' && <div className="flex flex-wrap gap-2">{s.tags.map(([tone, label]) => <Badge key={label} tone={tone}>{label}</Badge>)}</div>}
          </>
        );
      default:
        return null;
    }
  };

  const n = shown.length;
  return (
    <section ref={rootRef} aria-labelledby={`${uid}-t`} style={{ height }}
      className={`relative mx-auto grid w-full min-w-0 max-w-[760px] grid-cols-[minmax(0,1fr)] grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden rounded-[var(--radius-sheet)] border border-[var(--border)] bg-[var(--surface)] font-[family-name:var(--font-sans)] text-[var(--text)] ${compact ? 'text-sm leading-5' : 'text-[15px] leading-[22px]'}`}>
      <style>{STYLE}</style>

      <header className={`flex items-center justify-between gap-4 py-4 ${pad6}`}>
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className="grid size-10 flex-none place-items-center rounded-full border border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)] text-[var(--accent)]">
            <Svg size={20} w={1.75}><path d="M5 10v4M9 7v10M13 4v16M17 8v8M21 11v2" /></Svg>
          </span>
          <div className="min-w-0">
            <h2 id={`${uid}-t`} className="m-0 text-[15px] font-semibold leading-5 tracking-[-0.01em] text-[var(--text-strong)]">{agent}</h2>
            <p className="m-0 truncate text-[13px] leading-[18px] text-[var(--text-muted)]">{role}</p>
          </div>
        </div>
        <p className="m-0 inline-flex h-8 flex-none items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--raised)] px-3 text-[13px] font-medium text-[var(--text-strong)]">
          <span aria-hidden="true" className={`relative size-2 rounded-full after:absolute after:-inset-1 after:rounded-full after:border-[1.5px] after:border-[var(--up)] after:opacity-0 after:content-[''] ${e.ended ? 'bg-[var(--text-disabled)]' : 'af-ping bg-[var(--up)]'}`} />
          <span className="hidden sm:inline">{e.ended ? 'Appel terminé' : 'En appel'}</span>
          <span className="font-mono text-xs tabular-nums text-[var(--text-muted)]">{clock}</span>
        </p>
      </header>

      <div className={`flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 border-y border-[var(--border)] bg-[var(--raised)] py-2 text-[13px] leading-[18px] ${pad6}`}>
        <span className="font-mono text-[11px] font-medium uppercase tracking-[.04em] text-[var(--text-muted)]">Appelant</span>
        <b className="font-semibold text-[var(--text-strong)]">{sc.caller}</b>
        <span className="font-mono text-xs text-[var(--text-muted)]">{sc.number}</span>
        <span className="inline-flex h-6 items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 text-xs">{sc.intent}</span>
        <span aria-hidden="true" className={`ml-auto inline-flex h-5 items-center gap-0.5 ${e.ended ? '' : 'af-wave'}`}>
          {[0, -0.9, -0.35, -0.7, -0.15, -0.55, -0.8].map((d, k) => <i key={k} className="block h-4 w-0.5 scale-y-[.25] rounded-sm bg-[var(--text-muted)]" style={{ animationDelay: `${d}s` }} />)}
        </span>
      </div>

      <div className="relative min-h-0">
        <ol ref={feedRef} tabIndex={0} role="log" aria-live="off" aria-label="Activité de l’agent, de la plus ancienne à la plus récente"
          onScroll={onScroll} onWheel={(ev) => ev.deltaY < 0 && markIntent()} onTouchStart={markIntent} onPointerDown={markIntent}
          onKeyDown={(ev) => /^(ArrowUp|PageUp|Home)$/.test(ev.key) && markIntent()}
          className={`m-0 h-full list-none overflow-y-auto overscroll-contain pb-2 [scrollbar-width:thin] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--focus-ring)] ${compact ? 'p-4' : 'p-4 sm:p-6'}`}>
          <AnimatePresence initial={false}>
            {shown.map((s, i) => (thinking || s.t !== 'think') && (
              <motion.li key={`${scenario}-${i}-${s.t}`}
                initial={reduce ? false : { opacity: 0, y: 8, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className={`relative grid grid-cols-[24px_minmax(0,1fr)] gap-3 ${gapY} before:absolute before:bottom-1.5 before:left-[11.5px] before:top-[30px] before:w-px before:bg-[var(--border)] before:content-[''] last:before:hidden`}>
                <span aria-hidden="true" className={`-mt-px grid size-6 place-items-center rounded-full border ${NODE[s.state]}`}>
                  <motion.span key={s.state} initial={reduce || s.state === 'running' ? false : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }}>
                    {Icon[s.state]()}
                  </motion.span>
                </span>
                <div className="min-w-0">
                  <div className="flex min-h-[22px] items-center gap-2">
                    <span className="hidden flex-none font-mono text-[11px] font-medium uppercase leading-4 tracking-[.04em] text-[var(--text-muted)] sm:inline">{KIND[s.t]}</span>
                    <span className={`min-w-0 font-medium text-[var(--text-strong)] ${s.t === 'ask' ? 'text-balance' : 'truncate'} ${s.state === 'running' ? 'af-shine' : ''}`}>{title(s)}</span>
                    {badge(s)}
                    <span className="ml-auto inline-flex flex-none items-center gap-2 pl-2 text-xs leading-4 text-[var(--text-muted)]">
                      {time !== 'masque' && <time className="hidden font-mono tabular-nums sm:inline">{stamp(s.t0)}</time>}
                      {['think', 'tool', 'final', 'ask'].includes(s.t) && <span className="inline-flex h-5 items-center rounded-full bg-[var(--raised)] px-1.5 font-mono tabular-nums text-[var(--text)]">{fmtDur(s.e)}</span>}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-2">{body(s, i)}</div>
                  <span className="sr-only"> — {stateLabel[s.state]}</span>
                </div>
              </motion.li>
            ))}
            {e.ended && (
              <motion.li key="end" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 pb-4 pt-1 text-xs text-[var(--text-muted)] before:h-px before:flex-1 before:bg-[var(--border)] before:content-[''] after:h-px after:flex-1 after:bg-[var(--border)] after:content-['']">
                Fin de l’appel · {clock}
              </motion.li>
            )}
          </AnimatePresence>
        </ol>
        <AnimatePresence>
          {!follow && (
            <motion.button type="button" onClick={jump} initial={{ opacity: 0, y: 8, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 8, x: '-50%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              aria-label={`${e.ended ? 'Aller à la fin' : 'Suivre le direct'}${unseen ? `, ${unseen} nouvelle${unseen > 1 ? 's' : ''} étape${unseen > 1 ? 's' : ''}` : ''}`}
              className="absolute bottom-3 left-1/2 inline-flex h-11 items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-4 text-[13px] font-medium text-[var(--text-strong)] shadow-[var(--shadow-popover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]">
              {e.ended ? 'Aller à la fin' : 'Suivre le direct'}
              {unseen > 0 && <b className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--accent)] px-1.5 font-mono text-[11px] text-[var(--accent-fg)]">{unseen}</b>}
              <Svg size={16} w={1.75}><path d="M12 5v14M6 13l6 6 6-6" /></Svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <footer className={`flex items-center gap-2 border-t border-[var(--border)] py-2 pl-2 ${compact ? 'pr-4' : 'pr-4 sm:pl-4 sm:pr-6'}`}>
        <button type="button" onClick={reset} aria-label="Rejouer le scénario"
          className="grid size-11 place-items-center rounded-[var(--radius-ctl)] text-[var(--text-muted)] hover:bg-[var(--state-hover)] hover:text-[var(--text-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]">
          <Svg size={18} w={1.75}><path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5" /><path d="M4 4v4.5h4.5" /></Svg>
        </button>
        <div role="group" aria-label="Vitesse de lecture" className="inline-flex rounded-full border border-[var(--border)] bg-[var(--raised)] p-0.5">
          {[0.5, 1, 2, 4].map((v) => (
            <button key={v} type="button" aria-pressed={speed === v} onClick={() => setSpeed(v)}
              className={`h-10 min-w-11 rounded-full px-2 font-mono text-xs font-medium transition-colors md:h-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] ${speed === v ? 'bg-[var(--surface)] text-[var(--text-strong)] shadow-[var(--shadow-overlay)]' : 'text-[var(--text-muted)]'}`}>
              {fr(v, v % 1 ? 1 : 0)}×
            </button>
          ))}
        </div>
        <p className="m-0 ml-auto text-right text-xs leading-4 tabular-nums text-[var(--text-muted)]">
          <span className="hidden sm:inline">{n} étape{n > 1 ? 's' : ''} · {e.tools} outil{e.tools > 1 ? 's' : ''}{e.errors ? ` · ${e.errors} erreur${e.errors > 1 ? 's' : ''}` : ''} · </span>
          Durée totale <b className="font-mono font-semibold text-[var(--text-strong)]">{fr(e.t / 1000)} s</b>
        </p>
      </footer>
      <p role="status" aria-live="polite" className="sr-only">{live}</p>
    </section>
  );
}

export default AgentActivityFeed;
