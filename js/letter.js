/* letter.js — what the customer's office sends when the contract closes.

   Every run reaches this, including one that never investigated anything.
   It is the only document in the build that is not the plant's, and it is
   the only place the thing is named in full. See goal.md.

   The register is deliberately clerical. A letter that gloated would let
   the player off — they could dislike the writer and be done. A form
   letter, worked through in a stack by somebody with a quota of his own,
   which is *pleased with you*, does not offer that. Everything above the
   footer is stationery; the footer is the sentence the whole run has been
   withholding.

   The paper is drawn as paper: warmer and lighter than the works' steel
   notices, with its own typography, because it did not come from this
   building and should not look as though it did. */
(function (root) {
  'use strict';

  var SOL = root.SOL, P = SOL.P, D = SOL.D, S = SOL.scene, C = SOL.content;
  var L = SOL.logic;
  var W = SOL.W, H = SOL.H;
  var Screens = SOL.screens;

  var CARD = { x: 206, w: 788, top: 146, row: 23, button: 46 };

  /* Off-white, not white: a third carbon on cheap wartime stock. It is the
     only surface in the build that is not steel. */
  var PAPER = '#cfccc4';
  var PAPER_LO = '#b6b3ab';
  var INK = '#23231f';
  var INK_LO = '#54534c';
  /* The only colour in the build. Stamp-pad red on absorbent paper, not a
     bright one — it has to look printed rather than lit. Declared here and
     nowhere else, and a test asserts no other screen carries it. */
  var SEAL = '#9d2b20';
  Screens._SEAL = SEAL;

  Screens.letter = {
    name: 'letter',
    hits: [],
    res: null,
    card: null,

    enter: function (opts, g) {
      this.hits = [];
      this.res = L.resolveLetter(g.run);
      SOL.audio.paper && SOL.audio.paper();
    },

    close_: function (g) {
      SOL.audio.confirm && SOL.audio.confirm();
      g.go('ending');
    },

    /* The seal at the head of the sheet, and the only colour in the build.
       Six shifts of graphite, one reserved amber for documents you were
       already holding, and then this.

       The device is the artwork in js/seal.js, drawn through Path2D so it
       stays vector at any size. The eagle and its wreath go down in stamp
       ink; the device inside the wreath is the one thing in the whole piece
       allowed to be red. Struck slightly off square and slightly short of
       ink, because that is the register the entire letter is in: a form,
       stamped by somebody with a quota of his own. */
    sealPaths: null,

    buildSeal: function () {
      if (this.sealPaths || typeof Path2D === 'undefined') return this.sealPaths;
      var art = SOL.seal;
      if (!art) return null;
      this.sealPaths = {
        fills: art.fills.map(function (d) { return new Path2D(d); }),
        strokes: art.strokes.map(function (d) { return new Path2D(d); })
      };
      return this.sealPaths;
    },

    drawSeal: function (ctx, cx, cy, size) {
      var art = SOL.seal, paths = this.buildSeal();
      if (!art || !paths) return;
      var r = size / 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.03);                  // nothing is ever stamped square

      /* No disc and no ring. The device was drawn inside a ring to begin
         with, and the eagle's wings met it on both sides: it read as an
         emblem crammed into a badge rather than as a stamp struck onto a
         form. The artwork is the seal. It is scaled on its width, which is
         the dimension the wings run in. */
      var k = size / art.w;
      ctx.scale(k, k);
      ctx.translate(-art.w / 2, -art.h / 2);

      /* Ink, not black: a rubber stamp on absorbent paper never lays down
         solid, and a solid one would read as printed letterhead. */
      ctx.globalAlpha = 0.72;
      ctx.fillStyle = '#2b2a25';
      paths.fills.forEach(function (p) { ctx.fill(p, 'evenodd'); });

      // and the one red thing in the build
      ctx.globalAlpha = 1;
      ctx.strokeStyle = SEAL;
      ctx.lineWidth = art.strokeWidth;
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'miter';
      paths.strokes.forEach(function (p) { ctx.stroke(p); });

      ctx.restore();
    },

    draw: function (ctx, t, g) {
      this.hits = [];
      var res = this.res;
      if (!res) { g.go('ending'); return; }
      var copy = C.LETTERS[res.id] || C.LETTERS.noted;

      // the hall, done with you
      S.hall(ctx, t, { mood: 0.18, lamps: 2, floorY: 580, still: g.frozen });
      ctx.fillStyle = 'rgba(8,10,12,0.90)';
      ctx.fillRect(0, 0, W, H);
      Screens._headerRail(ctx, C.PLANT_NAME, C.LETTER_HEADING);

      var nx = CARD.x, nw = CARD.w, px = nx + 52, pw = nw - 104;

      var bodyOpt = { size: 13.5, color: INK, lineHeight: 23 };
      var bodyLines = D.wrap(ctx, copy.body, pw, bodyOpt).length;
      var footOpt = { size: 11.5, color: INK_LO, lineHeight: 19 };
      var footLines = D.wrap(ctx, C.LETTER_FOOTER, pw, footOpt).length;
      var figs = [
        [C.LETTER_FIGURES.demanded, String(res.demanded)],
        [C.LETTER_FIGURES.delivered, String(res.delivered)],
        [C.LETTER_FIGURES.share, Math.round(res.share * 100) + '%']
      ];

      var nh = CARD.top + bodyLines * 23 + 22 + figs.length * CARD.row
             + 14 + 48 + 16 + footLines * 19 + 22 + CARD.button + 24;
      var ny = Math.round((H - nh) / 2) + 6;
      this.card = { x: nx, y: ny, w: nw, h: nh };

      // the sheet itself
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.75)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 12;
      D.vgrad(ctx, nx, ny, nw, nh, PAPER, PAPER_LO);
      ctx.restore();
      // the fold it was sent in
      ctx.fillStyle = 'rgba(70,68,62,0.16)';
      ctx.fillRect(nx, ny + Math.round(nh * 0.38), nw, 1.5);

      var y = ny + 46;
      this.drawSeal(ctx, nx + nw - 96, y + 26, 168);

      D.stencil(ctx, C.LETTER_OFFICE, px, y, { size: 10, track: 3, color: INK_LO });
      y += 20;
      D.stencil(ctx, C.LETTER_REF, px, y, { size: 9.5, track: 2, color: INK_LO });
      y += 22;
      ctx.fillStyle = 'rgba(60,58,52,0.45)';
      ctx.fillRect(px, y, pw, 1);
      y += 32;

      D.txt(ctx, copy.title, px, y,
        { size: 19, weight: 600, family: 'sans', color: INK, track: 2.4 });

      y = D.para(ctx, copy.body, px, ny + CARD.top, pw, bodyOpt) + 16;

      /* The figures, in the office's own terms. CONTRACTED is the number
         the plant chased for six shifts; ACCEPTED is what the works could
         actually fit. They are set here, together, by the only party that
         was ever in a position to compare them. */
      figs.forEach(function (row) {
        D.stencil(ctx, row[0], px, y, { size: 10, track: 2.2, color: INK_LO });
        D.stencil(ctx, row[1], px + pw, y,
          { size: 11, track: 2.2, color: INK, align: 'right' });
        y += CARD.row;
      });

      /* The signature. Everything the player has read for six shifts has
         been unsigned, or countersigned by a department number with no
         department name. This is the one document in the build with a real
         name at the foot of it, and it is the name of the man whose
         programme the letter has just thanked them for. */
      y += 18;
      /* In the same ink as the type. A blue signature would have been the
         truer detail and it would have made two colours in the build; the
         seal is allowed to be the only one. */
      D.txt(ctx, C.LETTER_SIGNATURE, px + pw, y + 16, {
        size: 22, weight: 400, family: 'sans', italic: true,
        color: 'rgba(30,30,26,0.88)', align: 'right'
      });
      ctx.fillStyle = 'rgba(60,58,52,0.40)';
      ctx.fillRect(px + pw - 210, y + 26, 210, 1);
      D.stencil(ctx, C.LETTER_SIGNATORY, px + pw, y + 42,
        { size: 9.5, track: 2.6, color: INK_LO, align: 'right' });
      y += 48;

      ctx.fillStyle = 'rgba(60,58,52,0.35)';
      ctx.fillRect(px, y - 8, pw, 1);
      D.para(ctx, C.LETTER_FOOTER, px, y + 12, pw, footOpt);

      var b = { x: px - 16, y: ny + nh - CARD.button - 24, w: 250,
                h: CARD.button, id: 'close' };
      /* The one control, drawn as the works' own steel rather than as part
         of the letter: it is the player putting the paper down, not the
         office inviting them to. */
      Screens._control(ctx, b, C.LETTER_CLOSE,
        g.hoverId === 'close' ? 'hover' : 'active', { size: 13 });
      this.hits.push(b);

      Screens._footerRail(ctx, 'ENTER TO PUT IT DOWN');
      D.crt(ctx, W, H, t);
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
