/* flow.js — the screens either side of a shift.
   Both are the same object: a notice posted where you clock in and where
   you clock out. The plant talks to you only in paperwork. */
(function (root) {
  'use strict';

  var SOL = root.SOL, P = SOL.P, D = SOL.D, S = SOL.scene, C = SOL.content, L = SOL.logic;
  var W = SOL.W, H = SOL.H;
  var Screens = SOL.screens;

  function dimHall(ctx, t, g, mood) {
    S.hall(ctx, t, { mood: mood, lamps: 3, floorY: 560, still: g.frozen });
    ctx.fillStyle = 'rgba(11,14,16,0.72)';
    ctx.fillRect(0, 0, W, H);
  }

  /* =====================================================================
     SHIFT BRIEF
     ===================================================================== */

  Screens.brief = {
    name: 'brief',
    hits: [],
    card: null,   // published so a test can check it fits between the rails

    enter: function (opts, g) { this.hits = []; },

    draw: function (ctx, t, g) {
      this.hits = [];
      var n = g.run.shift;
      var cfg = L.shiftConfig(n);
      var sc = C.shift(n);

      dimHall(ctx, t, g, cfg.mood);
      Screens._headerRail(ctx, C.PLANT_NAME, 'SHIFT ' + n + ' OF ' + L.SHIFT_COUNT);

      // size the card to its copy so no shift leaves a pool of dead space
      var nx = 232, nw = W - 464;
      var pw = nw - 88;
      var bodyOpt = { size: 14, color: P.text, lineHeight: 25 };
      var bodyLines = D.wrap(ctx, sc.brief, pw, bodyOpt).length;
      /* The first shift carries a pencilled addendum under the printed
         part: the only place the build gives permission to look.

         The first brief after the circular carries a different one, in the
         same hand and set apart the same way, and it is the only advice the
         game ever gives about refusing. It replaced a control on the press
         that let a player wreck the work for free. This costs the bonus,
         says so, and does not tell them to do it. */
      var addendum = sc.welcome;
      if (g.run.revealed && !g.run.refusalTold) addendum = C.REFUSAL_NOTE;
      var welOpt = { size: 12.5, color: P.dim, lineHeight: 21 };
      var welLines = addendum ? D.wrap(ctx, addendum, pw, welOpt).length : 0;
      var nh = 84 + 66 + 34 + bodyLines * 25 + 18 + 58 + 30
             + (welLines ? welLines * 21 + 26 : 0) + 30 + 46 + 26;
      var ny = Math.round((H - nh) / 2) + 8;
      this.card = { x: nx, y: ny, w: nw, h: nh };
      Screens._notice(ctx, nx, ny, nw, nh, C.BRIEF_HEADING);

      var px = nx + 44;
      var y = ny + 84;

      D.txt(ctx, String(n).padStart(2, '0'), px, y + 26,
        { size: 54, weight: 700, family: 'sans', color: 'rgba(120,132,142,0.42)', track: 2 });
      D.txt(ctx, sc.title, px + 92, y + 14,
        { size: 26, weight: 600, family: 'sans', color: P.bright, track: 5 });
      D.stencil(ctx, 'LINE 4 · FINISHING PRESS 4-C', px + 94, y + 36,
        { size: 9.5, track: 2.6, color: P.faint });
      y += 66;
      D.seam(ctx, px, y, pw);
      y += 34;

      y = D.para(ctx, sc.brief, px, y, pw, bodyOpt);
      y += 18;

      // the target, given the weight the plant gives it
      D.plate(ctx, px - 14, y - 22, pw + 28, 58, { top: '#2b2e31', bot: '#1e2022', r: 2 });
      D.stencil(ctx, 'TARGET FOR THIS SHIFT', px, y - 2, { size: 9.5, track: 2.6, color: P.faint });
      D.txt(ctx, cfg.target + ' PARTS', px, y + 22,
        { size: 19, weight: 600, color: P.bright, track: 2.5 });
      y += 58;

      // the note gets its own line — it used to overprint the target
      D.stencil(ctx, sc.note, px, y + 4, { size: 10, track: 2.2, color: P.dim });
      y += 30;

      if (addendum) {
        // set apart with a rule, because it is not the office talking
        ctx.fillStyle = 'rgba(104,114,122,0.42)';
        ctx.fillRect(px - 18, y - 6, 2, welLines * 21 + 6);
        D.para(ctx, addendum, px, y + 8, pw, welOpt);
      }

      var b = { x: px - 14, y: ny + nh - 72, w: 260, h: 46, id: 'begin' };
      Screens._control(ctx, b, C.BRIEF_BEGIN,
        g.hoverId === 'begin' ? 'hover' : 'active', { size: 13 });
      this.hits.push(b);

      Screens._footerRail(ctx, 'ENTER TO BEGIN');
      D.crt(ctx, W, H, t);
    },

    /* Marked on the way out rather than during draw, so that redrawing the
       brief — which the test suite and the screenshot capture both do —
       cannot silently spend the one time it is shown. */
    begin_: function (g) {
      if (g.run.revealed) g.run.refusalTold = true;
      SOL.audio.confirm();
      g.go('shift');
    },

    key: function (e, g) {
      if (e.key === 'Enter' || e.key === ' ') this.begin_(g);
      else if (e.key === 'Escape') g.go('menu');
    },

    pointer: function (x, y, type, g) {
      var hit = this.hits.find(function (r) { return D.inRect(x, y, r); });
      g.hoverId = hit ? hit.id : null;
      if (hit && type === 'down') this.begin_(g);
    }
  };

  /* =====================================================================
     END OF SHIFT
     ===================================================================== */

  function signOff(rec) {
    if (rec.stopped) return C.SUMMARY_LINES.stopped;
    if (rec.rating === 'ABOVE SCHEDULE') return C.SUMMARY_LINES.above;
    if (rec.rating === 'ON SCHEDULE') return C.SUMMARY_LINES.on;
    if (rec.rating === 'BEHIND SCHEDULE') return C.SUMMARY_LINES.behind;
    return C.SUMMARY_LINES.short;
  }

  /* The sheet that goes upstairs, and the sheet that does not.

     These used to be one column, and by the last shifts — scrap chute cut,
     work sent back, good stock pulled in error, the feeder running — the
     card ran off the bottom of the stage. Two columns is not only shorter: the
     plant's arithmetic and the operator's sit side by side at the same
     size, and the difference between them is the whole piece. */
  var SUM = {
    x: 200, w: 800,
    top: 126,     // card top to the first row's baseline
    row: 32,      // a production row
    awRow: 26,    // a row of what nobody records
    gap: 48,      // between the two columns
    button: 46
  };

  Screens.summary = {
    name: 'summary',
    hits: [],
    rec: null,
    card: null,   // published so a test can check it still fits the stage

    enter: function (opts, g) {
      this.hits = [];
      this.rec = g.run.shiftLog[g.run.shiftLog.length - 1] || null;
    },

    /* The two columns, built before anything is drawn so the card can be
       sized to whichever of them is taller. */
    columns: function (rec) {
      var sheet = [
        [C.SUMMARY_ROWS.stamped, String(rec.stamped), true],
        [C.SUMMARY_ROWS.target, String(rec.target), false],
        [C.SUMMARY_ROWS.missed, String(rec.missed), false]
      ];
      if (rec.scrapped > 0 || rec.n >= L.SCRAP_FROM_SHIFT) {
        sheet.push([C.SUMMARY_ROWS.scrapped, String(rec.scrapped), false]);
      }
      // line 5 is charged to the station, so it is on the plant's side
      sheet.push([C.SUMMARY_ROWS.rejects, String(rec.rejects || 0), false]);
      /* Pay sits on the sheet with everything else, in the same type, at
         the same size. The plant does not consider it a separate subject. */
      sheet.push([C.SUMMARY_ROWS.pay, '+' + rec.pay.total, false]);

      var own = [[C.AWARENESS_ROW, C.AWARENESS_LABELS[rec.tier]]];
      /* Seconds, not parts. The line crawls while you read, so almost
         nothing slips the press — what reading costs is the clock. */
      if (rec.readSecs > 0) {
        own.push([C.SUMMARY_ROWS.readSecs, String(Math.round(rec.readSecs))]);
      }
      if (rec.marksPassed > 0) own.push([C.SUMMARY_ROWS.marksPassed, String(rec.marksPassed)]);
      if (rec.pulled > 0) own.push([C.SUMMARY_ROWS.pulled, String(rec.pulled)]);
      /* Good stock taken off in error. Nobody upstairs will ever know, and
         it cost you the same second as catching a real one. */
      if (rec.pulledSound > 0) own.push([C.SUMMARY_ROWS.pulledSound, String(rec.pulledSound)]);
      if (rec.autoStamped > 0) own.push([C.SUMMARY_ROWS.autoStamped, String(rec.autoStamped)]);
      /* STAMPED, in the other column, is what the plant counted. This is
         what the assembly works could use out of it, and the two only
         differ when a fault got past the station. It is the only place in
         the build the two numbers are ever set beside each other. */
      if (rec.usable < rec.stamped) {
        own.push([C.SUMMARY_ROWS.usable, String(rec.usable)]);
      }
      return { sheet: sheet, own: own };
    },

    draw: function (ctx, t, g) {
      this.hits = [];
      var rec = this.rec;
      if (!rec) { g.go('menu'); return; }
      var last = L.isLastShift(rec.n);

      dimHall(ctx, t, g, L.shiftConfig(rec.n).mood);
      Screens._headerRail(ctx, C.PLANT_NAME,
        'SHIFT ' + rec.n + (rec.stopped ? ' STOPPED' : ' CLOSED'));

      var nx = SUM.x, nw = SUM.w, pw = nw - 88;
      var colW = Math.floor((pw - SUM.gap) / 2);
      var col = this.columns(rec);

      var signOpt = { size: 13.5, color: P.dim, lineHeight: 23 };
      var signLines = D.wrap(ctx, signOff(rec), pw, signOpt).length;

      // whichever column is taller sets the height of the pair
      var sheetH = col.sheet.length * SUM.row + 10 + 44;
      var ownH = 26 + col.own.length * SUM.awRow;
      var colH = Math.max(sheetH, ownH);

      var nh = SUM.top + colH + 20 + signLines * 23 + 24 + SUM.button + 26;
      var ny = Math.round((H - nh) / 2) + 8;
      this.card = { x: nx, y: ny, w: nw, h: nh };
      Screens._notice(ctx, nx, ny, nw, nh, C.SUMMARY_HEADING);

      var px = nx + 44;
      var qx = px + colW + SUM.gap;   // the second column
      var y = ny + 82;

      D.txt(ctx, C.shift(rec.n).title, px, y + 6,
        { size: 22, weight: 600, family: 'sans', color: P.bright, track: 4 });
      D.stencil(ctx, 'SHIFT ' + rec.n + ' OF ' + L.SHIFT_COUNT, px + pw, y + 4,
        { size: 10, track: 2.6, color: P.faint, align: 'right' });
      y += 24;
      D.seam(ctx, px, y, pw);

      var top = ny + SUM.top;

      // ----- left: the sheet that goes upstairs
      var ly = top;
      col.sheet.forEach(function (r, i) {
        if (i % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.014)';
          ctx.fillRect(px - 14, ly - 19, colW + 28, SUM.row);
        }
        D.stencil(ctx, r[0], px, ly, { size: 11, track: 2.4, color: r[2] ? P.text : P.dim });
        D.txt(ctx, r[1], px + colW, ly + 2,
          { size: r[2] ? 20 : 15, weight: 600, align: 'right', color: r[2] ? P.bright : P.mid });
        ly += SUM.row;
      });
      ly += 10;
      D.seam(ctx, px, ly - 12, colW);
      D.stencil(ctx, C.SUMMARY_ROWS.rating, px, ly + 12, { size: 11, track: 2.4, color: P.dim });
      D.txt(ctx, rec.rating, px + colW, ly + 14,
        { size: 17, weight: 600, align: 'right', color: P.bright, track: 2 });

      /* ----- right: the sheet that does not.
         Deliberately unstyled and unlit, and set in smaller type than the
         column beside it. The plant has no instrument for any of this.

         Centred against the production rows rather than hung from the top
         of them: on an ordinary shift there is one line here and six over
         there, and top-aligning left a hole in the corner of the card.
         Centred, it reads as a note in the margin, which is what it is. */
      var ry = top + Math.round((colH - ownH) / 2);
      ctx.fillStyle = 'rgba(104,114,122,0.55)';
      ctx.fillRect(qx - 22, ry - 18, 2, 8 + col.own.length * SUM.awRow + 18);
      D.stencil(ctx, C.AWARENESS_HEADING, qx, ry - 4,
        { size: 9.5, track: 3.2, color: P.faint });
      ry += 26;
      col.own.forEach(function (r) {
        D.stencil(ctx, r[0], qx, ry, { size: 10, track: 2.2, color: P.dim });
        D.stencil(ctx, r[1], qx + colW, ry,
          { size: 10.5, track: 2.2, color: P.text, align: 'right' });
        ry += SUM.awRow;
      });

      // ----- full width again: the sign-off, and the sample if it caught you
      y = top + colH + 8;
      D.seam(ctx, px, y - 14, pw);
      y = D.para(ctx, signOff(rec), px, y + 12, pw, signOpt);

      var b = { x: px - 14, y: ny + nh - 72, w: 280, h: 46, id: 'continue' };
      Screens._control(ctx, b, last ? C.SUMMARY_FINAL : C.SUMMARY_CONTINUE,
        g.hoverId === 'continue' ? 'hover' : 'active', { size: 13 });
      this.hits.push(b);

      Screens._footerRail(ctx, 'ENTER TO CONTINUE');
      D.crt(ctx, W, H, t);
    },

    advance: function (g) {
      var rec = this.rec;
      SOL.audio.confirm();
      if (!L.isLastShift(rec.n)) {
        g.run.shift = rec.n + 1;
        /* He used to be here, between shifts. He comes down to the station
           four fifths of the way through the fourth shift now, with the
           line still running, so there is nothing to route to from the pay
           sheet any more. */
        // the stores are open between shifts, and the brief is on the far
        // side of them — you are paid and then given somewhere to spend it
        g.go('stores');
      } else {
        /* The quarter is over. The customer's office closes the contract
           before the player is allowed to think about any of it. */
        g.run.finished = true;
        g.go('letter');
      }
    },

    key: function (e, g) {
      if (e.key === 'Enter' || e.key === ' ') this.advance(g);
    },

    pointer: function (x, y, type, g) {
      var hit = this.hits.find(function (r) { return D.inRect(x, y, r); });
      g.hoverId = hit ? hit.id : null;
      if (hit && type === 'down') this.advance(g);
    }
  };

})(typeof window !== 'undefined' ? window : globalThis);
