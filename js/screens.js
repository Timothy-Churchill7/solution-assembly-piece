/* screens.js — one object per screen.
   Each screen exposes enter/draw/pointer/key. Hit regions are rebuilt
   during draw and consumed by the pointer handler, so layout lives in
   exactly one place. */
(function (root) {
  'use strict';

  var SOL = root.SOL, P = SOL.P, D = SOL.D, S = SOL.scene, C = SOL.content;
  var W = SOL.W, H = SOL.H;
  var Screens = SOL.screens = {};

  /* ---------- shared chrome ---------- */

  /* Top rail: plant identification, always present, never dramatic. */
  function headerRail(ctx, left, right) {
    D.vgrad(ctx, 0, 0, W, 34, 'rgba(12,15,17,0.94)', 'rgba(6,8,9,0.88)');
    D.seam(ctx, 0, 34, W, { alpha: 0.8 });
    D.stencil(ctx, left, 20, 22, { size: 10, color: P.faint, track: 2.6 });
    if (right) {
      D.stencil(ctx, right, W - 20, 22,
        { size: 10, color: 'rgba(126,136,144,0.85)', track: 2.6, align: 'right' });
    }
    // corner fixings
    D.rivet(ctx, 9, 17, 2.2);
    D.rivet(ctx, W - 9, 17, 2.2);
  }
  Screens._headerRail = headerRail;

  function footerRail(ctx, text) {
    D.vgrad(ctx, 0, H - 30, W, 30, 'rgba(6,8,9,0.86)', 'rgba(4,5,6,0.96)');
    D.seam(ctx, 0, H - 31, W, { alpha: 0.7 });
    D.stencil(ctx, text, W / 2, H - 11, { size: 9.5, color: P.faint, track: 3, align: 'center' });
  }
  Screens._footerRail = footerRail;

  /* A scrim so type stays legible over the hall. */
  function scrim(ctx, x, y, w, h, dir) {
    var g = ctx.createLinearGradient(x, y, dir === 'v' ? x : x + w, dir === 'v' ? y + h : y);
    g.addColorStop(0, 'rgba(11,14,16,0.86)');
    g.addColorStop(0.55, 'rgba(11,14,16,0.58)');
    g.addColorStop(1, 'rgba(11,14,16,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }
  Screens._scrim = scrim;

  /* A control: bevelled plate, stencilled label, optional accent (inquiry
     only). `state` is 'idle' | 'hover' | 'active'. */
  function control(ctx, r, label, state, o) {
    o = o || {};
    var hot = state === 'hover' || state === 'active';
    D.plate(ctx, r.x, r.y, r.w, r.h, {
      top: hot ? '#3c4145' : '#2c2f32',
      bot: hot ? '#262a2c' : '#1e2022',
      r: 2
    });
    if (state === 'active') {
      ctx.fillStyle = o.accent ? P.accent : P.mid;
      ctx.fillRect(r.x, r.y, 3, r.h);
    }
    D.rivet(ctx, r.x + 9, r.y + r.h / 2, 2.1);
    D.rivet(ctx, r.x + r.w - 9, r.y + r.h / 2, 2.1);
    D.stencil(ctx, label, r.x + 24, r.y + r.h / 2 + 4, {
      size: o.size || 12,
      track: 3,
      color: state === 'idle' ? P.mid : (o.accent ? P.accentHi : P.bright)
    });
    return r;
  }
  Screens._control = control;

  /* A posted notice: lighter steel card fixed to the wall. */
  function notice(ctx, x, y, w, h, title) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 26;
    ctx.shadowOffsetY = 10;
    D.plate(ctx, x, y, w, h, { top: '#2a2e30', bot: '#202224', r: 3 });
    ctx.restore();
    D.rivetsAround(ctx, x, y, w, h, 13, 3);
    if (title) {
      D.hatch(ctx, x + 1, y + 1, w - 2, 26, { step: 11, a: '#36393d', b: '#222528' });
      ctx.fillStyle = 'rgba(6,8,9,0.72)';
      ctx.fillRect(x + 1, y + 1, w - 2, 26);
      D.stencil(ctx, title, x + 26, y + 18, { size: 10.5, track: 3.4, color: P.mid });
      D.seam(ctx, x + 1, y + 27, w - 2, { alpha: 0.9 });
    }
    return { x: x, y: y, w: w, h: h };
  }
  Screens._notice = notice;

  /* =====================================================================
     MENU
     ===================================================================== */

  Screens.menu = {
    name: 'menu',
    index: 0,
    hits: [],

    enter: function () { this.hits = []; },

    draw: function (ctx, t, g) {
      var self = this;
      this.hits = [];

      S.hall(ctx, t, { mood: 1, lamps: 4, floorY: 548, still: g.frozen });

      // a working line in the foreground, unattended
      var beltY = 632;
      S.belt(ctx, 0, beltY, W, 58, t * 34);
      S.beltLight(ctx, 0, beltY, W, 58, 1);
      for (var i = 0; i < 9; i++) {
        var wx = ((t * 34 + i * 168) % (W + 240)) - 120;
        S.widget(ctx, wx, beltY + 29, 0.95, S.FORMS[i % 4], {
          hi: '#71767a', mid: '#494e52', lo: '#242628'
        });
      }

      scrim(ctx, 0, 0, W * 0.62, H, 'h');

      headerRail(ctx, C.PLANT_NAME, 'TERMINAL READY');

      // title
      var tx = 96, ty = 268;
      D.txt(ctx, C.TITLE, tx, ty, {
        size: 92, weight: 700, family: 'sans', color: P.bright, track: 16
      });
      // ghosted double-strike, like a tired tube
      D.txt(ctx, C.TITLE, tx + 2, ty + 1, {
        size: 92, weight: 700, family: 'sans', color: P.bright, track: 16, alpha: 0.10
      });
      D.seam(ctx, tx + 3, ty + 24, 486);
      D.stencil(ctx, C.SUBTITLE, tx + 4, ty + 50, { size: 11.5, track: 5.2, color: P.dim });

      // menu
      var mx = 96, my = 372, mw = 396, mh = 50, gap = 12;
      C.MENU_ITEMS.forEach(function (item, k) {
        var r = { x: mx, y: my + k * (mh + gap), w: mw, h: mh, id: item.id };
        var state = (k === self.index) ? 'active' : (g.hoverId === item.id ? 'hover' : 'idle');
        control(ctx, r, item.label, state, { size: 13 });
        if (k === self.index) {
          ctx.fillStyle = P.mid;
          ctx.fillRect(mx - 14, r.y + 8, 4, r.h - 16);
        }
        self.hits.push(r);
      });

      // The note for the current selection sits under the list, where the
      // background is scrimmed — never over the machine row.
      var py = my + C.MENU_ITEMS.length * (mh + gap) + 14;
      D.seam(ctx, mx, py - 4, mw, { alpha: 0.6 });
      D.stencil(ctx, C.MENU_ITEMS[this.index].note, mx, py + 20,
        { size: 10.5, track: 2.6, color: P.dim });
      D.stencil(ctx, 'BUILD 1.0 · NO ACCOUNT IS KEPT OF WHAT YOU NOTICE', mx, py + 46,
        { size: 9.5, track: 2.4, color: 'rgba(116,124,131,0.95)' });

      footerRail(ctx, C.MENU_FOOTER);
      D.crt(ctx, W, H, t);
    },

    key: function (e, g) {
      if (e.key === 'ArrowDown' || e.key === 's') {
        this.index = (this.index + 1) % C.MENU_ITEMS.length; SOL.audio.tick();
      } else if (e.key === 'ArrowUp' || e.key === 'w') {
        this.index = (this.index + C.MENU_ITEMS.length - 1) % C.MENU_ITEMS.length; SOL.audio.tick();
      } else if (e.key === 'Enter' || e.key === ' ') {
        this.choose(C.MENU_ITEMS[this.index].id, g);
      }
    },

    pointer: function (x, y, type, g) {
      var hit = null;
      for (var i = 0; i < this.hits.length; i++) {
        if (D.inRect(x, y, this.hits[i])) { hit = this.hits[i]; break; }
      }
      g.hoverId = hit ? hit.id : null;
      if (hit && type === 'down') {
        this.index = this.hits.indexOf(hit);
        this.choose(hit.id, g);
      }
    },

    choose: function (id, g) {
      SOL.audio.confirm();
      if (id === 'start') { SOL.logic.resetRun(g.run); g.go('brief'); }
      else if (id === 'credits') g.go('credits');
      else if (id === 'howto') g.go('howto');
    }
  };

  /* A recessed instrument: dark well, label above, value inside. */
  function gauge(ctx, x, y, w, h, label, value, o) {
    o = o || {};
    ctx.save();
    D.rrect(ctx, x, y, w, h, 2);
    var g2 = ctx.createLinearGradient(0, y, 0, y + h);
    g2.addColorStop(0, '#161818');
    g2.addColorStop(1, '#1e2022');
    ctx.fillStyle = g2;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.lineWidth = 1;
    D.rrect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(206,220,230,0.07)';
    D.rrect(ctx, x + 1.5, y + 1.5, w - 3, h - 3, 2); ctx.stroke();
    ctx.restore();

    D.stencil(ctx, label, x + 12, y + 17, { size: 9, track: 2.4, color: P.faint });
    if (value != null) {
      D.txt(ctx, value, o.right ? x + w - 12 : x + 12, y + h - 13, {
        size: o.size || 26,
        weight: 600,
        color: o.color || P.bright,
        align: o.right ? 'right' : 'left',
        track: o.track != null ? o.track : 1
      });
    }
    return { x: x, y: y, w: w, h: h };
  }
  Screens._gauge = gauge;

  /* =====================================================================
     CREDITS / ABOUT  — carries the required attribution verbatim
     ===================================================================== */

  Screens.credits = {
    name: 'credits',
    hits: [],

    enter: function () { this.hits = []; },

    draw: function (ctx, t, g) {
      this.hits = [];
      S.hall(ctx, t, { mood: 0.5, lamps: 3, floorY: H * 0.86, still: g.frozen });
      ctx.fillStyle = 'rgba(11,14,16,0.70)';
      ctx.fillRect(0, 0, W, H);

      headerRail(ctx, C.PLANT_NAME, 'NOTICE BOARD');

      var nx = 128, ny = 66, nw = W - 256, nh = 560;
      notice(ctx, nx, ny, nw, nh, 'ABOUT THIS PIECE');

      var px = nx + 40, pw = nw - 80;
      var y = ny + 76;

      D.txt(ctx, 'ORIGIN AND ATTRIBUTION', px, y,
        { size: 13, weight: 600, track: 3.4, color: P.bright });
      y += 14;
      D.seam(ctx, px, y, 220);
      y += 30;

      // The required paragraph. Rendered inside its own recessed panel so
      // it reads as a fixed plate rather than editable body copy.
      var boxH = 100;
      ctx.save();
      D.rrect(ctx, px - 16, y - 26, pw + 32, boxH, 2);
      ctx.fillStyle = 'rgba(3,4,5,0.72)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(70,80,88,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
      // neutral rule — the amber accent is reserved for inquiry only
      ctx.fillStyle = P.dim;
      ctx.fillRect(px - 16, y - 26, 2, boxH);

      D.paraRuns(ctx, C.ATTRIBUTION_RUNS, px, y, pw, {
        size: 14.5, color: P.text, lineHeight: 25
      });
      y += boxH + 8;

      D.txt(ctx, 'WHERE THE MECHANIC COMES FROM', px, y,
        { size: 13, weight: 600, track: 3.4, color: P.bright });
      y += 14;
      D.seam(ctx, px, y, 300);
      y += 28;
      y = D.para(ctx, C.LINEAGE, px, y, pw, { size: 13.5, color: P.dim, lineHeight: 23 });

      y += 16;
      D.txt(ctx, 'CONTENT', px, y, { size: 13, weight: 600, track: 3.4, color: P.bright });
      y += 14;
      D.seam(ctx, px, y, 120);
      y += 28;
      D.para(ctx, C.CRAFT_NOTE, px, y, pw, { size: 13.5, color: P.dim, lineHeight: 23 });

      var back = { x: nx + 40, y: ny + nh - 62, w: 190, h: 42, id: 'back' };
      control(ctx, back, 'BACK', g.hoverId === 'back' ? 'hover' : 'idle', { size: 12 });
      this.hits.push(back);

      footerRail(ctx, 'ESC OR BACKSPACE TO RETURN');
      D.crt(ctx, W, H, t);
    },

    key: function (e, g) {
      if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'Enter') g.go('menu');
    },

    pointer: function (x, y, type, g) {
      var hit = this.hits.find(function (r) { return D.inRect(x, y, r); });
      g.hoverId = hit ? hit.id : null;
      if (hit && type === 'down') { SOL.audio.confirm(); g.go('menu'); }
    }
  };

  /* =====================================================================
     INSTRUCTIONS
     ===================================================================== */

  /* The handbook grew a row every time the station did, and was laid out by
     adding guesses together: by the time line 5 was fitted the last two rows
     were off the bottom of the card and the BACK button was printed over
     them. Same treatment as the stores — a budget that adds up, with the
     card rect published for a test that checks it still does. */
  /* Wider than the other notices. The handbook is the one screen that has
     to explain things in sentences rather than label them, and at the old
     width the two paragraphs of advice at the foot pushed the card off the
     top of the stage. */
  var HOWTO = { x: 130, w: W - 260, top: 74, line: 16, button: 42 };

  Screens.howto = {
    name: 'howto',
    hits: [],
    card: null,

    enter: function () { this.hits = []; },

    draw: function (ctx, t, g) {
      this.hits = [];
      S.hall(ctx, t, { mood: 0.5, lamps: 3, floorY: H * 0.86, still: g.frozen });
      ctx.fillStyle = 'rgba(11,14,16,0.70)';
      ctx.fillRect(0, 0, W, H);

      headerRail(ctx, C.PLANT_NAME, 'OPERATOR HANDBOOK');

      var nx = HOWTO.x, nw = HOWTO.w;
      var px = nx + 44, pw = nw - 88;
      var noteOpt = { size: 13, color: P.faint, lineHeight: 22 };
      /* Each explanation is wrapped to the plate it sits on. They used to
         be printed as one unwrapped line each, which was fine while they
         were terse and ran silently off the side of the card the moment
         they started actually explaining anything. */
      var vOpt = { size: 12.5, lineHeight: HOWTO.line };
      var rows = C.HOWTO.map(function (r) { return D.wrap(ctx, r.v, pw, vOpt).length; });
      var bodyH = rows.reduce(function (a, n) { return a + 22 + n * HOWTO.line + 8; }, 0);
      var advOpt = { size: 13, color: P.text, lineHeight: 22 };
      var buyLines = D.wrap(ctx, C.HOWTO_BUY, pw, advOpt).length;
      var stakeLines = D.wrap(ctx, C.HOWTO_STAKES, pw, advOpt).length;
      var noteLines = buyLines + stakeLines
        + D.wrap(ctx, C.HOWTO_NOTE, pw, noteOpt).length;
      var nh = HOWTO.top + bodyH + 12 + noteLines * 22 + 20
             + 20 + HOWTO.button + 20;
      var ny = Math.round((H - nh) / 2);
      this.card = { x: nx, y: ny, w: nw, h: nh };
      notice(ctx, nx, ny, nw, nh, 'INSTRUCTIONS');

      var y = ny + HOWTO.top;

      C.HOWTO.forEach(function (row, i) {
        var h = 22 + rows[i] * HOWTO.line;
        D.plate(ctx, px - 14, y - 18, pw + 28, h, { top: '#272a2d', bot: '#1f2122', r: 2 });
        D.stencil(ctx, row.k, px, y - 2, { size: 11, track: 2.2, color: P.bright });
        D.para(ctx, row.v, px, y + 14, pw,
          { size: 12.5, lineHeight: HOWTO.line, color: P.dim });
        y += 22 + rows[i] * HOWTO.line + 8;
      });

      y += 10;
      /* The one piece of outright advice the handbook gives. It is here
         rather than buried in a clue because a player who never finds a
         clue still has to be able to finish the quarter. */
      y = D.para(ctx, C.HOWTO_BUY, px, y, pw, advOpt) + 10;
      /* The other half of the advice, and the more important half: what it
         costs to do the job badly is your bonus and nothing else. A player
         who does not know that can tell themselves afterwards that they
         were afraid, and the whole piece rests on them not being able to. */
      y = D.para(ctx, C.HOWTO_STAKES, px, y, pw, advOpt) + 10;
      D.para(ctx, C.HOWTO_NOTE, px, y, pw, noteOpt);

      var back = { x: px - 14, y: ny + nh - HOWTO.button - 20, w: 190, h: HOWTO.button, id: 'back' };
      control(ctx, back, 'BACK', g.hoverId === 'back' ? 'hover' : 'idle', { size: 12 });
      this.hits.push(back);

      footerRail(ctx, 'ESC OR BACKSPACE TO RETURN');
      D.crt(ctx, W, H, t);
    },

    key: function (e, g) {
      if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'Enter') g.go('menu');
    },

    pointer: function (x, y, type, g) {
      var hit = this.hits.find(function (r) { return D.inRect(x, y, r); });
      g.hoverId = hit ? hit.id : null;
      if (hit && type === 'down') { SOL.audio.confirm(); g.go('menu'); }
    }
  };

})(typeof window !== 'undefined' ? window : globalThis);
