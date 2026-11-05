// Révélation de texte — React + Tailwind CSS.
// Ajoutez l'animation dans tailwind.config.js :
//   theme.extend.keyframes['reveal-up'] = { to: { transform: 'translateY(0)' } }
import { Fragment, useState } from 'react';

export function TextReveal({ text, delay = 100, duration = 700, stagger = 60, as: Tag = 'h1', className = '' }) {
  const [run, setRun] = useState(0); // incrémenter pour rejouer
  const words = text.trim().split(/\s+/);
  return (
    <Tag
      key={run}
      aria-label={text}
      onClick={() => setRun((n) => n + 1)}
      className={`m-0 text-balance font-semibold leading-[1.08] tracking-[-0.02em] text-[var(--text-strong)] text-[clamp(2.25rem,1.5rem+3vw,4rem)] ${className}`}
    >
      {words.map((word, i) => (
        <Fragment key={i}>
          <span aria-hidden="true" className="-mb-[0.08em] inline-block overflow-hidden pb-[0.08em] align-top">
            <span
              className="inline-block translate-y-[110%] animate-[reveal-up_var(--d)_cubic-bezier(0.2,0,0,1)_both] motion-reduce:translate-y-0 motion-reduce:animate-none"
              style={{ '--d': `${duration}ms`, animationDelay: `${delay + i * stagger}ms` }}
            >
              {word}
            </span>
          </span>
          {i < words.length - 1 && ' '}
        </Fragment>
      ))}
    </Tag>
  );
}

// Exemple
export function Exemple() {
  return <TextReveal text="Des interfaces qui tiennent debout." delay={100} duration={700} stagger={60} />;
}
