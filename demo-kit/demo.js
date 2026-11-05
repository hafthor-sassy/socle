/*
  Kit des démos : thème, fond, props.
  - Lecture initiale par la query string : ?theme=dark&bg=grid&thumb=1&duree=600
  - Mises à jour live par postMessage depuis l'application :
      { socle: 1, type: 'props', props: {...} }
      { socle: 1, type: 'theme', theme: 'dark', bg: 'grid' }
      { socle: 1, type: 'replay' }
  Usage dans une démo :
      const props = Socle.props({ duree: 600, actif: true, variante: 'primaire' });
      Socle.onChange((p) => render(p));
      Socle.onReplay(() => rejouer());
*/
(function () {
  var q = new URLSearchParams(location.search);
  var root = document.documentElement;
  if (!root.hasAttribute('data-accent')) root.setAttribute('data-accent', q.get('accent') || 'terracotta');
  function setTheme(t, bg) {
    root.classList.toggle('dark', t === 'dark');
    root.classList.toggle('bg-grid', bg === 'grid');
  }
  var sys = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  setTheme(q.get('theme') || sys, q.get('bg'));
  if (q.get('thumb')) root.classList.add('is-thumb');

  var current = {};
  var defaults = {};
  var changeCbs = [];
  var replayCbs = [];

  function cast(def, raw) {
    if (typeof def === 'number') { var n = parseFloat(raw); return isNaN(n) ? def : n; }
    if (typeof def === 'boolean') return raw === 'true' || raw === '1';
    return raw;
  }

  window.Socle = {
    thumb: !!q.get('thumb'),
    reducedMotion: function () { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; },
    props: function (defs) {
      defaults = defs || {};
      Object.keys(defaults).forEach(function (k) {
        current[k] = q.has(k) ? cast(defaults[k], q.get(k)) : defaults[k];
      });
      return current;
    },
    onChange: function (cb) { changeCbs.push(cb); },
    onReplay: function (cb) { replayCbs.push(cb); },
  };

  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.socle !== 1) return;
    if (d.type === 'theme') setTheme(d.theme, d.bg);
    if (d.type === 'props' && d.props) {
      Object.keys(d.props).forEach(function (k) { if (k in defaults) current[k] = cast(defaults[k], String(d.props[k])); });
      changeCbs.forEach(function (cb) { cb(current); });
    }
    if (d.type === 'replay') replayCbs.forEach(function (cb) { cb(current); });
  });
})();
