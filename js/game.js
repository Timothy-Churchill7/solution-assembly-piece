/* game.js — screen manager, timing, input routing. */
(function (root) {
  'use strict';

  var SOL = root.SOL, D = SOL.D;
  var W = SOL.W, H = SOL.H;

  var G = SOL.game = {
    canvas: null,
    ctx: null,
    screen: 'menu',
    prev: null,
    t: 0,
    dt: 0,
    frozen: false,
    hoverId: null,
    pointer: { x: -1, y: -1 },
    run: null,
    frame: 0
  };

  /* ---------- boot ---------- */

  G.init = function (canvas) {
    G.canvas = canvas;
    G.ctx = canvas.getContext('2d', { alpha: false });
    G.run = SOL.logic.newRun();
    G.resize();
    root.addEventListener('resize', G.resize);

    canvas.addEventListener('mousemove', function (e) { route(e, 'move'); });
    canvas.addEventListener('mousedown', function (e) { route(e, 'down'); SOL.audio.start(); });
    canvas.addEventListener('mouseup', function (e) { route(e, 'up'); });
    canvas.addEventListener('mouseleave', function () {
      G.pointer.x = G.pointer.y = -1; G.hoverId = null;
    });
    root.addEventListener('keydown', function (e) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Backspace'].indexOf(e.key) >= 0) {
        e.preventDefault();
      }
      SOL.audio.start();
      var s = SOL.screens[G.screen];
      if (s && s.key) s.key(e, G);
    });

    var s0 = SOL.screens[G.screen];
    if (s0 && s0.enter) s0.enter({}, G);

    // ?still freezes time for deterministic screenshots.
    if (/[?&]still\b/.test(root.location.search)) G.freeze(9);

    var last = performance.now();
    function loop(now) {
      var raw = (now - last) / 1000;
      last = now;
      G.dt = G.frozen ? 0 : Math.min(raw, 1 / 20);
      G.t += G.dt;
      G.frame++;
      var sc = SOL.screens[G.screen];
      if (sc && sc.update && G.dt > 0) sc.update(G.dt, G);
      draw();
      root.requestAnimationFrame(loop);
    }
    root.requestAnimationFrame(loop);
  };

  G.resize = function () {
    var dpr = Math.min(root.devicePixelRatio || 1, 2);
    var c = G.canvas;
    c.width = Math.round(W * dpr);
    c.height = Math.round(H * dpr);
    G.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    G.ctx.textBaseline = 'alphabetic';
  };

  function draw() {
    var ctx = G.ctx;
    ctx.save();
    ctx.fillStyle = SOL.P.void;
    ctx.fillRect(0, 0, W, H);
    var s = SOL.screens[G.screen];
    if (s) s.draw(ctx, G.t, G);
    ctx.restore();
  }
  G.redraw = draw;

  /* ---------- navigation ---------- */

  G.go = function (name, opts) {
    var next = SOL.screens[name];
    if (!next) { console.error('[solution] no such screen:', name); return; }
    var cur = SOL.screens[G.screen];
    if (cur && cur.leave) cur.leave(G);
    G.prev = G.screen;
    G.screen = name;
    G.hoverId = null;
    if (next.enter) next.enter(opts || {}, G);
  };

  /* ---------- input ---------- */

  function route(e, type) {
    var r = G.canvas.getBoundingClientRect();
    var x = (e.clientX - r.left) * (W / r.width);
    var y = (e.clientY - r.top) * (H / r.height);
    G.pointer.x = x; G.pointer.y = y;
    var s = SOL.screens[G.screen];
    if (s && s.pointer) s.pointer(x, y, type, G);
  }

  /* ---------- screenshot support ---------- */

  G.freeze = function (at) {
    G.frozen = true;
    if (at != null) G.t = at;
    draw();
  };
  G.unfreeze = function () { G.frozen = false; };

  /* Advance the simulation one slice. No rendering — a test loop that
     redraws the whole hall 3000 times is unusably slow, and none of the
     state under test depends on having been painted. */
  G.tick = function (dt) {
    G.t += dt;
    G.dt = dt;
    var s = SOL.screens[G.screen];
    if (s && s.update) s.update(dt, G);
    G.dt = 0;
  };

  /* Advance by a fixed amount, then paint once. Used by tests so shift
     timing is deterministic and independent of frame rate. */
  G.step = function (seconds, opts) {
    opts = opts || {};
    var slice = opts.slice || 1 / 60;
    var left = seconds;
    var wasFrozen = G.frozen;
    G.frozen = false;
    while (left > 0) {
      var dt = Math.min(slice, left);
      G.tick(dt);
      left -= dt;
    }
    G.frozen = wasFrozen;
    if (opts.draw !== false) draw();
  };

})(typeof window !== 'undefined' ? window : globalThis);
