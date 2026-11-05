// Pricing 3 offres — React + Tailwind CSS. Couleurs : variables de tokens.css. Textes génériques à remplacer.
import { useState } from 'react';

const PLANS = [
  {
    "id": "essentiel",
    "nom": "Essentiel",
    "pitch": "Pour découvrir et lancer vos premiers projets.",
    "m": 0,
    "y": 0,
    "cta": "Commencer gratuitement",
    "variant": "secondary",
    "featured": null,
    "unit": [
      "pour toujours"
    ],
    "lead": null,
    "feats": [
      "Jusqu’à 3 projets",
      "1 Go de stockage",
      "Modèles de base",
      "Export PDF",
      "Support par e-mail"
    ],
    "note_m": "Gratuit, sans carte bancaire"
  },
  {
    "id": "pro",
    "nom": "Pro",
    "pitch": "Pour les équipes qui produisent chaque semaine.",
    "m": 19,
    "y": 15,
    "cta": "Choisir Pro",
    "variant": "primary",
    "featured": true,
    "unit": [
      "par utilisateur",
      "par mois"
    ],
    "lead": "Tout ce qu’il y a dans Essentiel, plus :",
    "feats": [
      "Projets illimités",
      "100 Go de stockage",
      "Collaboration en temps réel",
      "Historique de 90 jours",
      "Support prioritaire"
    ],
    "note_m": null
  },
  {
    "id": "entreprise",
    "nom": "Entreprise",
    "pitch": "Pour les organisations qui ont besoin de contrôle.",
    "m": 39,
    "y": 31,
    "cta": "Parler à l’équipe",
    "variant": "secondary",
    "featured": null,
    "unit": [
      "par utilisateur",
      "par mois"
    ],
    "lead": "Tout ce qu’il y a dans Pro, plus :",
    "feats": [
      "Authentification unique (SSO)",
      "Rôles et permissions avancés",
      "Stockage illimité",
      "Historique illimité",
      "Accompagnement dédié"
    ],
    "note_m": null
  }
];

const GROUPS = [
  {
    "nom": "Projets",
    "rows": [
      {
        "nom": "Projets",
        "v": [
          "3",
          "Illimités",
          "Illimités"
        ]
      },
      {
        "nom": "Stockage",
        "v": [
          "1 Go",
          "100 Go",
          "Illimité"
        ]
      },
      {
        "nom": "Historique des versions",
        "v": [
          "7 jours",
          "90 jours",
          "Illimité"
        ]
      }
    ]
  },
  {
    "nom": "Collaboration",
    "rows": [
      {
        "nom": "Membres",
        "v": [
          "1",
          "Jusqu’à 50",
          "Illimités"
        ]
      },
      {
        "nom": "Commentaires et mentions",
        "v": [
          true,
          true,
          true
        ]
      },
      {
        "nom": "Édition en temps réel",
        "v": [
          false,
          true,
          true
        ]
      }
    ]
  },
  {
    "nom": "Sécurité",
    "rows": [
      {
        "nom": "Authentification à deux facteurs",
        "v": [
          true,
          true,
          true
        ]
      },
      {
        "nom": "Authentification unique (SSO)",
        "v": [
          false,
          false,
          true
        ]
      },
      {
        "nom": "Journal d’audit",
        "v": [
          false,
          false,
          true
        ]
      }
    ]
  },
  {
    "nom": "Support",
    "rows": [
      {
        "nom": "Support par e-mail",
        "v": [
          true,
          true,
          true
        ]
      },
      {
        "nom": "Support prioritaire",
        "v": [
          false,
          true,
          true
        ]
      },
      {
        "nom": "Accompagnement dédié",
        "v": [
          false,
          false,
          true
        ]
      }
    ]
  }
];

const FAQ = [
  {
    "q": "L’offre Essentiel est-elle vraiment gratuite ?",
    "r": "Oui, sans limite de durée et sans carte bancaire. Vous passez à Pro le jour où vos projets le demandent."
  },
  {
    "q": "Puis-je changer d’offre à tout moment ?",
    "r": "Oui. Le passage à une offre supérieure est immédiat et calculé au prorata ; le retour à une offre inférieure prend effet à la prochaine échéance."
  },
  {
    "q": "Comment fonctionne la facturation annuelle ?",
    "r": "Vous payez douze mois d’un coup, avec la remise affichée sur la bascule Annuel. Le prix par mois indiqué en tient déjà compte."
  },
  {
    "q": "Quels moyens de paiement acceptez-vous ?",
    "r": "Carte bancaire et prélèvement SEPA. L’offre Entreprise peut aussi être réglée sur facture, par virement."
  },
  {
    "q": "Puis-je annuler mon abonnement ?",
    "r": "Oui, en deux clics depuis vos réglages. Vous gardez l’accès jusqu’à la fin de la période déjà payée."
  }
];

const euro = (n) => `${n}\u00A0€`;

function Check({ className = '' }) {
  return (
    <svg className={`shrink-0 ${className}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function Cell({ v }) {
  if (v === true) return (<><Check className="inline-block text-[var(--text-strong)]" /><span className="sr-only">Inclus</span></>);
  if (v === false) return (<><span aria-hidden="true" className="text-[var(--text-disabled)]">—</span><span className="sr-only">Non inclus</span></>);
  return <span className="tabular-nums">{v}</span>;
}

const ring = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]';

export function PricingSection({ defaultPeriod = 'monthly', discount = 20, showCompare = true, showFaq = true }) {
  const [period, setPeriod] = useState(defaultPeriod);
  const yearly = period === 'yearly';

  return (
    <section aria-labelledby="pricing-title" className="bg-[var(--bg)] px-4 pb-20 pt-16 text-[var(--text)] md:px-8 md:pb-28 md:pt-24">
      <div className="mx-auto max-w-[1120px]">
        <header className="mb-10 grid justify-items-center gap-4 text-center">
          <h2 id="pricing-title" className="max-w-[20ch] text-balance text-[clamp(1.75rem,1.3rem+2vw,2.5rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-[var(--text-strong)]">
            Choisissez l’offre qui fait grandir votre équipe
          </h2>
          <p className="max-w-[48ch] text-[1.0625rem] leading-relaxed text-[var(--text-muted)]">Commencez gratuitement, changez d’offre quand vous voulez. Sans engagement.</p>
          <div role="radiogroup" aria-label="Période de facturation" className="mt-2 inline-flex gap-0.5 rounded-[var(--radius-ctl)] border border-[var(--border)] bg-[var(--raised)] p-0.5">
            {[['monthly', 'Mensuel'], ['yearly', 'Annuel']].map(([id, label]) => (
              <button key={id} type="button" role="radio" aria-checked={period === id} onClick={() => setPeriod(id)}
                className={`inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-medium ${ring} ${period === id ? 'bg-[var(--surface)] text-[var(--text-strong)] shadow-[var(--shadow-overlay)]' : 'text-[var(--text-muted)]'}`}>
                {label}
                {id === 'yearly' && <span className="inline-flex h-5 items-center rounded-full bg-[var(--tint-green-bg)] px-1.5 text-xs tabular-nums text-[var(--tint-green-fg)]">−{discount}&nbsp;%</span>}
              </button>
            ))}
          </div>
        </header>

        <div className="grid gap-4 min-[900px]:grid-cols-3">
          {PLANS.map((p) => {
            const price = yearly ? Math.round(p.m * (1 - discount / 100)) : p.m;
            return (
              <article key={p.id} aria-labelledby={`plan-${p.id}`}
                className={`flex flex-col gap-4 rounded-[var(--radius-card)] border bg-[var(--surface)] p-6 md:p-7 ${p.featured ? 'border-[var(--border-control)]' : 'border-[var(--border)]'}`}>
                <header className="flex min-h-6 items-center justify-between gap-2">
                  <h3 id={`plan-${p.id}`} className="text-lg font-semibold text-[var(--text-strong)]">{p.nom}</h3>
                  {p.featured && <span className="inline-flex h-6 items-center rounded-full border border-[var(--accent-subtle-border)] bg-[var(--accent-subtle)] px-2.5 text-xs font-medium text-[var(--accent)]">Le plus choisi</span>}
                </header>
                <p className="min-h-[2.9em] text-[15px] leading-snug text-[var(--text-muted)]">{p.pitch}</p>
                <p className="mt-2 flex items-center gap-3">
                  <span className="whitespace-nowrap text-[2.75rem] font-semibold leading-none tracking-[-0.03em] tabular-nums text-[var(--text-strong)]">{euro(price)}</span>
                  <span className="text-[13px] leading-snug text-[var(--text-muted)]">{p.unit.map((u, i) => <span key={i} className="block">{u}</span>)}</span>
                </p>
                <p className="-mt-2 min-h-[1.4em] text-[13px] tabular-nums text-[var(--text-muted)]">
                  {p.m === 0 ? p.note_m : yearly ? `Facturé ${euro(price * 12)} par an` : 'Facturé chaque mois'}
                </p>
                <a href="#" className={`flex h-11 items-center justify-center rounded-[var(--radius-ctl)] border px-4 text-[15px] font-medium ${ring} ${p.variant === 'primary'
                  ? 'border-transparent bg-[var(--accent)] text-[var(--accent-fg)] [@media(hover:hover)]:hover:bg-[var(--accent-hover)]'
                  : 'border-[var(--border-control)] bg-[var(--surface)] text-[var(--text-strong)] [@media(hover:hover)]:hover:shadow-[inset_0_0_0_999px_var(--state-hover)]'}`}>
                  {p.cta}
                </a>
                <ul className="mt-2 grid gap-3 border-t border-[var(--border)] pt-5">
                  {p.lead && <li className="text-sm text-[var(--text-muted)]">{p.lead}</li>}
                  {p.feats.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[15px] leading-snug"><Check className="mt-px text-[var(--text-strong)]" />{f}</li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        {showCompare && (
          <section aria-labelledby="compare-title" className="mt-20">
            <h3 id="compare-title" className="mb-6 text-center text-[1.375rem] font-semibold tracking-[-0.01em] text-[var(--text-strong)]">Comparer les offres</h3>
            {/* Tableau dès 768 px */}
            <div className="hidden overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] [touch-action:pan-x_pan-y] md:block">
              <table className="w-full min-w-[640px] border-collapse text-[15px]">
                <thead>
                  <tr className="h-14 border-b border-[var(--border)]">
                    <th scope="col"><span className="sr-only">Fonctionnalité</span></th>
                    {PLANS.map((p) => <th key={p.id} scope="col" className="px-5 font-semibold text-[var(--text-strong)]">{p.nom}</th>)}
                  </tr>
                </thead>
                {GROUPS.map((g) => (
                  <tbody key={g.nom}>
                    <tr className="h-10 border-b border-[var(--border)] bg-[var(--raised)]">
                      <th scope="colgroup" colSpan={4} className="px-5 text-left font-mono text-xs font-medium uppercase tracking-[0.04em] text-[var(--text-muted)]">{g.nom}</th>
                    </tr>
                    {g.rows.map((r) => (
                      <tr key={r.nom} className="h-[52px] border-b border-[var(--border)] last:border-0">
                        <th scope="row" className="w-2/5 px-5 text-left font-normal">{r.nom}</th>
                        {r.v.map((v, i) => <td key={i} className="px-5 text-center text-[var(--text-strong)]"><Cell v={v} /></td>)}
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>
            {/* Accordéon groupé sur mobile */}
            <div className="grid divide-y divide-[var(--border)] rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] md:hidden">
              {GROUPS.map((g, gi) => (
                <details key={g.nom} open={gi === 0} className="group">
                  <summary className={`flex min-h-14 cursor-pointer list-none items-center justify-between px-4 font-medium text-[var(--text-strong)] ${ring} [&::-webkit-details-marker]:hidden`}>
                    {g.nom}
                    <svg className="text-[var(--text-muted)] transition-transform group-open:rotate-180 motion-reduce:transition-none" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                  </summary>
                  {g.rows.map((r) => (
                    <div key={r.nom} className="border-t border-[var(--border)] px-4 pb-4 pt-3">
                      <p className="mb-2.5 text-[15px]">{r.nom}</p>
                      <dl className="grid grid-cols-3 gap-2">
                        {PLANS.map((p, i) => (
                          <div key={p.id} className="grid gap-1"><dt className="text-xs text-[var(--text-muted)]">{p.nom}</dt><dd className="min-h-5 text-sm text-[var(--text-strong)]"><Cell v={r.v[i]} /></dd></div>
                        ))}
                      </dl>
                    </div>
                  ))}
                </details>
              ))}
            </div>
          </section>
        )}

        {showFaq && (
          <section aria-labelledby="faq-title" className="mx-auto mt-20 max-w-[760px]">
            <h3 id="faq-title" className="mb-6 text-center text-[1.375rem] font-semibold tracking-[-0.01em] text-[var(--text-strong)]">Questions fréquentes</h3>
            <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
              {FAQ.map((f) => (
                <details key={f.q} className="group">
                  <summary className={`flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-1 font-medium text-[var(--text-strong)] ${ring} [&::-webkit-details-marker]:hidden`}>
                    {f.q}
                    <svg className="shrink-0 text-[var(--text-muted)] transition-transform group-open:rotate-45 motion-reduce:transition-none" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                  </summary>
                  <p className="max-w-[64ch] px-1 pb-5 text-[15px] leading-relaxed text-[var(--text-muted)]">{f.r}</p>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>
    </section>
  );
}

// Exemple
export function Exemple() {
  return <PricingSection defaultPeriod="monthly" discount={20} showCompare={true} showFaq={true} />;
}
