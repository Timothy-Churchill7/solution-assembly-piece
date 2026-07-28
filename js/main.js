/* main.js — boot. */
(function (root) {
  'use strict';
  var SOL = root.SOL;

  function boot() {
    var canvas = document.getElementById('screen');
    if (!canvas) { console.error('[solution] canvas missing'); return; }
    SOL.game.init(canvas);
    SOL.ready = true;
    root.dispatchEvent(new Event('solution:ready'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(typeof window !== 'undefined' ? window : globalThis);
