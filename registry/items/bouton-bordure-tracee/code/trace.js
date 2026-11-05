/* Bouton à bordure tracée — cale les rectangles SVG sur la taille réelle du bouton
   (et sur son rayon), à chaque redimensionnement. Le trait lui-même est animé en CSS. */
(function () {
  function fit(btn) {
    var w = btn.offsetWidth, h = btn.offsetHeight;
    var r = parseFloat(getComputedStyle(btn).borderTopLeftRadius) || 0;
    btn.querySelectorAll('.trace__svg rect').forEach(function (rect) {
      var sw = parseFloat(getComputedStyle(rect).strokeWidth) || 1;
      var inset = Math.min(sw, 2) / 2;
      rect.setAttribute('x', inset);
      rect.setAttribute('y', inset);
      rect.setAttribute('width', Math.max(0, w - inset * 2));
      rect.setAttribute('height', Math.max(0, h - inset * 2));
      var rr = Math.min(r, h / 2, w / 2) - inset;
      rect.setAttribute('rx', Math.max(0, rr));
    });
  }
  var ro = 'ResizeObserver' in window ? new ResizeObserver(function (es) { es.forEach(function (e) { fit(e.target); }); }) : null;
  function attach(btn) { fit(btn); if (ro) ro.observe(btn); }
  function init(root) { (root || document).querySelectorAll('[data-trace]').forEach(attach); }
  window.Trace = { init: init, attach: attach, fit: fit };
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', function () { init(); });
})();
