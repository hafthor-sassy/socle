/* Bouton à remplissage directionnel : le fond entre par le bord (ou le point) d'arrivée
   du curseur et ressort par le bord de sortie. Clavier : entre par la gauche au focus. */
(function () {
  var EDGE = {
    left: 'inset(0 100% 0 0)', right: 'inset(0 0 0 100%)',
    top: 'inset(0 0 100% 0)', bottom: 'inset(100% 0 0 0)',
  };
  function side(el, x, y) {
    var r = el.getBoundingClientRect();
    // Distances relatives aux bords, normalisées par la taille (un bouton est plus large que haut)
    var d = { left: (x - r.left) / r.width, right: (r.right - x) / r.width, top: (y - r.top) / r.height, bottom: (r.bottom - y) / r.height };
    return Object.keys(d).reduce(function (a, b) { return d[a] <= d[b] ? a : b; });
  }
  function point(el, x, y) {
    var r = el.getBoundingClientRect();
    return [((x - r.left) / r.width * 100).toFixed(1) + '%', ((y - r.top) / r.height * 100).toFixed(1) + '%'];
  }
  function enter(el, x, y) {
    var circle = el.dataset.shape === 'circle';
    el.removeAttribute('data-state');
    if (circle) {
      var p = x != null ? point(el, x, y) : ['0%', '50%'];
      el.style.setProperty('--x', p[0]); el.style.setProperty('--y', p[1]);
      el.style.setProperty('--clip-from', 'circle(0% at ' + p[0] + ' ' + p[1] + ')');
    } else {
      el.style.setProperty('--clip-from', EDGE[x == null ? 'left' : side(el, x, y)]);
    }
    void el.offsetWidth; // applique la forme de départ sans transition
    el.dataset.state = 'in';
  }
  function leave(el, x, y) {
    var circle = el.dataset.shape === 'circle';
    if (circle) {
      var p = x != null ? point(el, x, y) : ['100%', '50%'];
      el.style.setProperty('--clip-to', 'circle(0% at ' + p[0] + ' ' + p[1] + ')');
    } else {
      // Le fond se retire vers le bord de sortie
      var s = x == null ? 'right' : side(el, x, y);
      var to = { left: 'inset(0 100% 0 0)', right: 'inset(0 0 0 100%)', top: 'inset(0 0 100% 0)', bottom: 'inset(100% 0 0 0)' }[s];
      el.style.setProperty('--clip-to', to);
    }
    el.dataset.state = 'out';
  }
  function attach(el) {
    if (el._dfill) return el._dfill;
    el.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' || e.pointerType === 'pen') enter(el, e.clientX, e.clientY); });
    el.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' || e.pointerType === 'pen') leave(el, e.clientX, e.clientY); });
    el.addEventListener('pointerdown', function (e) { if (e.pointerType === 'touch') enter(el, e.clientX, e.clientY); });
    el.addEventListener('pointerup', function (e) { if (e.pointerType === 'touch') setTimeout(function () { leave(el, e.clientX, e.clientY); }, 260); });
    el.addEventListener('focus', function () { if (el.matches(':focus-visible')) enter(el); });
    el.addEventListener('blur', function () { if (el.dataset.state === 'in') leave(el); });
    el._dfill = { enter: function (x, y) { enter(el, x, y); }, leave: function (x, y) { leave(el, x, y); } };
    return el._dfill;
  }
  function init(root) { (root || document).querySelectorAll('[data-dfill]').forEach(attach); }
  window.DFill = { init: init, attach: attach };
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', function () { init(); });
})();
