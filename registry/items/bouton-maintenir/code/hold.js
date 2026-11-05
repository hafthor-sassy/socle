/* Bouton « maintenir pour confirmer » : le remplissage progresse tant que l'on maintient
   (souris, doigt, Espace ou Entrée) ; relâché trop tôt, il se vide. À 100 %, l'action est confirmée.
   Événement émis : « hold:confirm » sur le bouton. */
(function () {
  function attach(btn) {
    if (btn._hold) return btn._hold;
    var p = 0, holding = false, raf = 0, last = 0, timer = 0;
    var live = btn.parentElement && btn.parentElement.querySelector('.hold-live');

    function dur() { return Math.max(200, +btn.dataset.duration || 1500); }
    function set(v) { p = Math.max(0, Math.min(1, v)); btn.style.setProperty('--p', p.toFixed(4)); }
    function frame(t) {
      var dt = last ? t - last : 16;
      last = t;
      if (holding) set(p + dt / dur());
      else set(p - (dt / dur()) * 3); // se vide trois fois plus vite
      if (holding && p >= 1) return done();
      if (!holding && p <= 0) { raf = 0; last = 0; return; }
      raf = requestAnimationFrame(frame);
    }
    function start() {
      if (btn.dataset.state === 'done' || btn.disabled) return;
      holding = true;
      btn.classList.add('is-holding');
      if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
    }
    function stop() {
      if (!holding) return;
      holding = false;
      btn.classList.remove('is-holding');
      if (!raf && p > 0) { last = 0; raf = requestAnimationFrame(frame); }
    }
    function done() {
      holding = false; raf = 0; last = 0;
      set(1);
      btn.classList.remove('is-holding');
      btn.dataset.state = 'done';
      if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) { try { navigator.vibrate(12); } catch (e) {} }
      if (live) live.textContent = btn.dataset.done || 'Confirmé';
      btn.dispatchEvent(new CustomEvent('hold:confirm', { bubbles: true }));
      var r = +btn.dataset.reset;
      clearTimeout(timer);
      if (r > 0) timer = setTimeout(reset, r);
    }
    function reset() {
      delete btn.dataset.state;
      if (live) live.textContent = '';
      last = 0; holding = false;
      if (!raf) raf = requestAnimationFrame(frame);
    }

    btn.addEventListener('pointerdown', function (e) { if (e.button === 0) { start(); try { btn.setPointerCapture(e.pointerId); } catch (err) {} } });
    btn.addEventListener('pointerup', stop);
    btn.addEventListener('pointercancel', stop);
    btn.addEventListener('lostpointercapture', stop);
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    btn.addEventListener('keydown', function (e) {
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(); }
      else if (e.key === ' ' || e.key === 'Enter') e.preventDefault();
      if (e.key === 'Escape') stop();
    });
    btn.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') stop(); });
    btn.addEventListener('blur', stop);

    btn._hold = { reset: reset, set: set, start: start, stop: stop };
    return btn._hold;
  }
  function init(root) { (root || document).querySelectorAll('[data-hold]').forEach(attach); }
  window.Hold = { init: init, attach: attach };
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', function () { init(); });
})();
