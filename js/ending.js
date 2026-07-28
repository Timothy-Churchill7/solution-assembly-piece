/* ending.js — the last screen.

   It is a notice, like every other screen in the building, and it is the
   only one that is not addressed to the plant. What it does is describe
   what happened and then stop. There is no score, no rating, no band, and
   nothing anywhere on it that tells the player what to think of any of it:
   an ending that praises you is an ending you can accept and put down.

   The figures at the foot are the point of the screen. One of them — the
   count — is the only number the plant ever kept, and it sits in the same
   type and at the same size as seven numbers nobody upstairs has ever
   seen or asked for. */
(function (root) {
  'use strict';

  var SOL = root.SOL, P = SOL.P, D = SOL.D, S = SOL.scene, C = SOL.content;
  var L = SOL.logic;
  var W = SOL.W, H = SOL.H;
  var Screens = SOL.screens;

  var CARD = { x: 200, w: 800, top: 118, row: 25, button: 46, gap: 48 };

  Screens.ending = {
    name: 'ending',
    hits: [],
    res: null,       // the resolved ending, computed once on arrival
    card: null,

    enter: function (opts, g) {
      this.hits = [];
      this.res = L.resolveEnding(g.run);
      SOL.audio.lineOff && SOL.audio.lineOff();
    },

    /* The figures, in two columns. The plant's own number is first and is
       given no more room than the seven beside it. */
    figures: function (res) {
      var s = C.ENDING_STATS;
      return {
        left: [
          [s.counted, String(res.counted)],
          [s.usable, String(res.usable)],
          [s.demanded, String(res.demanded)],
          [s.earned, String(res.earned)]
        ],
        right: [
          [s.spent, String(res.spent)],
          [s.looked, String(res.looked)],
          [s.bins, String(res.binsSorted)],
          [s.knew, C.AWARENESS_LABELS[res.tier]]
        ]
      };
    },

    draw: function (ctx, t, g) {
      this.hits = [];
      var res = this.res;
      if (!res) { g.go('menu'); return; }
      var copy = C.ENDINGS[res.id] || C.ENDINGS.blind;

      /* The hall, nearly out. The lamps are the plant's and the plant has
         finished with you for the quarter. */
      S.hall(ctx, t, { mood: 0.22, lamps: 2, floorY: 580, still: g.frozen });
      ctx.fillStyle = 'rgba(11,14,16,0.80)';
      ctx.fillRect(0, 0, W, H);
      Screens._headerRail(ctx, C.PLANT_NAME, C.ENDING_HEADING);

      var nx = CARD.x, nw = CARD.w, px = nx + 44, pw = nw - 88;
      var colW = Math.floor((pw - CARD.gap) / 2);

      var bodyOpt = { size: 13.5, color: P.text, lineHeight: 23 };
      var bodyLines = D.wrap(ctx, copy.body, pw, bodyOpt).length;
      var noteOpt = { size: 10.5, color: 'rgba(116,124,131,0.95)', lineHeight: 18 };
      var noteLines = D.wrap(ctx, C.ENDING_NOTE, pw, noteOpt).length;
      var figs = this.figures(res);
      var rows = Math.max(figs.left.length, figs.right.length);

      var nh = CARD.top + bodyLines * 23 + 26 + 26 + rows * CARD.row
             + 16 + noteLines * 18 + 24 + CARD.button + 26;
      var ny = Math.round((H - nh) / 2) + 8;
      this.card = { x: nx, y: ny, w: nw, h: nh };
      Screens._notice(ctx, nx, ny, nw, nh, C.ENDING_HEADING);

      var y = ny + 76;
      D.txt(ctx, copy.title, px, y,
        { size: 26, weight: 600, family: 'sans', color: P.bright, track: 4 });
      /* Which shift it came apart on, stated as plainly as a date on a
         docket. A run that never found out has nothing to put here. */
      if (res.revealed) {
        D.stencil(ctx, 'KNEW FROM SHIFT ' + res.revealedOn, px + pw, y - 3,
          { size: 9.5, track: 2.6, color: P.faint, align: 'right' });
      }
      y += 18;
      D.seam(ctx, px, y, pw);

      y = D.para(ctx, copy.body, px, ny + CARD.top, pw, bodyOpt);

      y += 26;
      D.seam(ctx, px, y - 14, pw);
      D.stencil(ctx, C.ENDING_STAT_HEADING, px, y,
        { size: 9.5, track: 3.2, color: P.faint });
      y += 26;

      var self = this;
      [[figs.left, px], [figs.right, px + colW + CARD.gap]].forEach(function (col) {
        var cy = y;
        col[0].forEach(function (r) {
          D.stencil(ctx, r[0], col[1], cy, { size: 10, track: 2.2, color: P.dim });
          D.stencil(ctx, r[1], col[1] + colW, cy,
            { size: 10.5, track: 2.2, color: P.text, align: 'right' });
          cy += CARD.row;
        });
      });
      y += rows * CARD.row + 16;

      D.para(ctx, C.ENDING_NOTE, px, y, pw, noteOpt);

      var b = { x: px - 14, y: ny + nh - CARD.button - 26, w: 260,
                h: CARD.button, id: 'close' };
      Screens._control(ctx, b, C.ENDING_CLOSE,
        g.hoverId === 'close' ? 'hover' : 'active', { size: 13 });
      this.hits.push(b);

      Screens._footerRail(ctx, 'ENTER TO RETURN TO THE MENU');
      D.crt(ctx, W, H, t);
    },

    close_: function (g) {
      SOL.audio.confirm && SOL.audio.confirm();
      g.go('menu');
    },

    key: function (e, g) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') this.close_(g);
    },

    pointer: function (x, y, type, g) {
      var hit = this.hits.find(function (r) { return D.inRect(x, y, r); });
      g.hoverId = hit ? hit.id : null;
      if (hit && type === 'down') this.close_(g);
    }
  };

})(typeof window !== 'undefined' ? window : globalThis);
