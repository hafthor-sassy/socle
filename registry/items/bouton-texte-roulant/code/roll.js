/* Bouton à texte qui roule — découpe [data-roll] en lettres doublées.
   Le libellé complet reste lu par les lecteurs d'écran via aria-label sur le bouton. */
(function () {
  function split(el) {
    var text = el.dataset.text || el.textContent;
    el.dataset.text = text;
    var btn = el.closest('button, a');
    if (btn && !btn.hasAttribute('aria-label')) btn.setAttribute('aria-label', text);
    el.setAttribute('aria-hidden', 'true');
    el.textContent = '';
    Array.from(text).forEach(function (ch, i) {
      var c = document.createElement('span');
      c.className = 'roll__c';
      c.style.setProperty('--i', i);
      var a = document.createElement('span');
      var b = document.createElement('span');
      a.textContent = b.textContent = ch === ' ' ? '\u00A0' : ch;
      c.append(a, b);
      el.appendChild(c);
    });
    // L'icône part juste après la dernière lettre
    if (btn) btn.style.setProperty('--n', Math.max(0, text.length - 4));
  }
  function init(root) { (root || document).querySelectorAll('[data-roll]').forEach(split); }
  function set(el, text) { el.dataset.text = text; var btn = el.closest('button, a'); if (btn) btn.setAttribute('aria-label', text); split(el); }
  window.Roll = { init: init, set: set };
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', function () { init(); });
})();
