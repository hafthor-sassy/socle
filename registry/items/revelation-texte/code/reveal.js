// Révélation de texte — Vanilla JS : découpe un titre en mots et lance l'animation.
// À utiliser avec le CSS de l'onglet « HTML + CSS ».
export function reveal(el, { delay = 100, duration = 700, stagger = 60 } = {}) {
  const text = el.textContent.trim().replace(/\s+/g, ' ');
  el.setAttribute('aria-label', text);
  el.style.setProperty('--reveal-delay', `${delay}ms`);
  el.style.setProperty('--reveal-duration', `${duration}ms`);
  el.style.setProperty('--reveal-stagger', `${stagger}ms`);
  el.classList.add('reveal');
  el.innerHTML = text
    .split(' ')
    .map((word, i) => `<span class="reveal__w" style="--i: ${i}" aria-hidden="true"><span>${word}</span></span>`)
    .join(' ');
  return {
    // Rejoue l'animation sans recharger la page
    replay() {
      el.querySelectorAll('.reveal__w > span').forEach((s) => {
        s.style.animation = 'none';
        void s.offsetWidth;
        s.style.animation = '';
      });
    },
  };
}

// Exemple : révéler le titre quand il entre dans l'écran
const title = document.querySelector('[data-reveal]');
const io = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) {
    reveal(title, { delay: 100, duration: 700, stagger: 60 });
    io.disconnect();
  }
});
io.observe(title);
