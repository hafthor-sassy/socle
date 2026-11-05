/* Bouton magnétique — attire le bouton vers le curseur dans un rayon donné,
   puis le ramène avec un vrai ressort (raideur + amortissement).
   Usage : <button data-magnetic> … </button> + ce script. Réglages par variables CSS. */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)');

  function attach(el) {
    if (el._magnetic) return el._magnetic;
    var x = 0, y = 0, vx = 0, vy = 0, tx = 0, ty = 0, raf = 0, last = 0;

    function read(name, fallback) {
      var v = parseFloat(getComputedStyle(el).getPropertyValue(name));
      return isNaN(v) ? fallback : v;
    }
    function frame(t) {
      var dt = last ? Math.min(0.032, (t - last) / 1000) : 0.016;
      last = t;
      var k = read('--mag-stiffness', 220);
      var c = read('--mag-damping', 16);
      // Ressort amorti : a = -k·(x - cible) - c·v
      vx += (-k * (x - tx) - c * vx) * dt;
      vy += (-k * (y - ty) - c * vy) * dt;
      x += vx * dt;
      y += vy * dt;
      el.style.setProperty('--mx', x.toFixed(2) + 'px');
      el.style.setProperty('--my', y.toFixed(2) + 'px');
      var still = Math.abs(x - tx) < 0.05 && Math.abs(y - ty) < 0.05 && Math.abs(vx) < 0.05 && Math.abs(vy) < 0.05;
      if (still) {
        x = tx; y = ty; vx = vy = 0; last = 0; raf = 0;
        el.style.setProperty('--mx', x + 'px');
        el.style.setProperty('--my', y + 'px');
        return;
      }
      raf = requestAnimationFrame(frame);
    }
    function wake() { if (!raf) raf = requestAnimationFrame(frame); }
    function target(dx, dy, near) {
      tx = dx; ty = dy;
      el.classList.toggle('is-near', !!near);
      wake();
    }
    function onMove(e) {
      if (reduce && reduce.matches) return;
      if (e.pointerType === 'touch') return; // pas d'aimant au doigt
      var r = el.getBoundingClientRect();
      // Centre « au repos » (sans le déplacement en cours)
      var cx = r.left + r.width / 2 - x;
      var cy = r.top + r.height / 2 - y;
      var dx = e.clientX - cx;
      var dy = e.clientY - cy;
      var ex = Math.max(Math.abs(dx) - r.width / 2, 0);
      var ey = Math.max(Math.abs(dy) - r.height / 2, 0);
      var near = Math.hypot(ex, ey) < read('--mag-radius', 120);
      var s = read('--mag-strength', 0.4);
      if (near) target(dx * s, dy * s, true);
      else if (tx || ty || el.classList.contains('is-near')) target(0, 0, false);
    }
    function onLeave() { target(0, 0, false); }

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    el._magnetic = {
      target: target,
      destroy: function () {
        window.removeEventListener('pointermove', onMove);
        document.documentElement.removeEventListener('pointerleave', onLeave);
        cancelAnimationFrame(raf);
        delete el._magnetic;
      },
    };
    return el._magnetic;
  }

  function init(root) {
    (root || document).querySelectorAll('[data-magnetic]').forEach(attach);
  }

  window.Magnetic = { init: init, attach: attach };
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', function () { init(); });
})();
