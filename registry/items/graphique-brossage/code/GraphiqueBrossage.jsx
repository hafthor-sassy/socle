// Graphique à brossage — React + Tailwind CSS. Couleurs : variables de tokens.css.
export function GraphiqueBrossage({ label = "Graphique à brossage" }) {
  return <p className="m-0 text-[var(--t-section)] font-semibold text-[var(--text-strong)]">{label}</p>;
}
