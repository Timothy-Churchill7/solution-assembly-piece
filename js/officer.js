/* officer.js — the one question the game asks out loud.

   Once, between shifts, a man from the works office offers two things and
   will authorise exactly one: more stock across the line for the rest of
   the quarter, or an answer about where the freight goes. He does not come
   back and there is no way to have both.

   Everything else in the build makes the player pay for curiosity in
   seconds and scrip, quietly, without ever naming the trade. This names
   it. It is the argument of the whole piece rendered as two buttons, and
   the two buttons are deliberately the same size, in the same grey, with
   their consequences stated flatly underneath. Nothing here recommends
   either one. */
(function (root) {
  'use strict';

  var SOL = root.SOL, P = SOL.P, D = SOL.D, S = SOL.scene, C = SOL.content;
  var L = SOL.logic;
  var W = SOL.W, H = SOL.H;
  var Screens = SOL.screens;

  var CARD = { x: 232, w: W - 464, top: 116, button: 50 };

  Screens.officer = {
    name: 'officer',
    hits: [],
    card: null,
    open: null,      // his answer, once it has been asked for
    took: null,      // 'upgrade' | 'answer', for the beat after choosing

    enter: function (opts, g) {
      this.hits = [];
      this.open = null;
      this.took = null;
    },

    update: function (dt, g) {
      if (!this.open) return;
      var o = this.open;
      o.t += dt;
      var shown = L.linesShown(o.clue, o.t);
      if (shown > o.shown) {
        o.shown = shown;
        SOL.audio.reveal && SOL.audio.reveal();
      }
      if (!o.read && L.isRead(o.clue, o.t)) {
        o.read = true;
        L.recordClue(g.run, null, o.clue);
      }
    },

    /* More stock, a faster press, and a target raised to match, from the
       next shift on. It is applied at the shift boundary rather than in
       the middle of the one he interrupts, because a quota that changes
       number while the clock is running is a bug as far as the player is
       concerned, whatever the fiction says. */
    takeUpgrade: function (g) {
      if (g.run.officerAnswered) return false;
      g.run.officerAnswered = true;
      g.run.upgraded = true;
      this.took = 'upgrade';
      SOL.audio.lever && SOL.audio.lever();
      return true;
    },

    /* The answer. Read the same way every other document in the build is
       read, because that is what it is. */
    askAnswer: function (g) {
      if (g.run.officerAnswered) return false;
      g.run.officerAnswered = true;
      this.took = 'answer';
      this.open = { clue: L.OFFICER_CLUE, t: 0, shown: 0, read: false };
      SOL.audio.paper && SOL.audio.paper();
      return true;
    },

    /* Back to the press, and to the shift he interrupted — not to the
       stores and not to a fresh shift. */
    close_: function (g) {
      SOL.audio.confirm && SOL.audio.confirm();
      g.go('shift', { resume: true });
    },

    /* ----- render ----- */

    draw: function (ctx, t, g) {
      this.hits = [];
      S.hall(ctx, t, { mood: 0.34, lamps: 2, floorY: 560, still: g.frozen });
      ctx.fillStyle = 'rgba(11,14,16,0.80)';
      ctx.fillRect(0, 0, W, H);
      Screens._headerRail(ctx, C.PLANT_NAME, C.OFFICER_HEADING);

      if (this.open) this.drawAnswer(ctx, t, g);
      else this.drawOffer(ctx, t, g);

      Screens._footerRail(ctx, this.open
        ? (this.open.read ? 'ENTER TO CLOCK ON' : C.INQUIRY_RUNNING)
        : '1 THE HEAVIER LINE  ·  2 ASK HIM');
      D.crt(ctx, W, H, t);
    },

    drawOffer: function (ctx, t, g) {
      var nx = CARD.x, nw = CARD.w, px = nx + 44, pw = nw - 88;
      var bodyOpt = { size: 13.5, color: P.text, lineHeight: 23 };
      var bodyLines = D.wrap(ctx, C.OFFICER_BODY, pw, bodyOpt).length;

      var bw = Math.floor((pw - 24) / 2);
      var noteOpt = { size: 9.5, lineHeight: 15, color: 'rgba(116,124,131,0.95)' };
      var noteLines = Math.max(
        D.wrap(ctx, C.OFFICER_UPGRADE_NOTE, bw, noteOpt).length,
        D.wrap(ctx, C.OFFICER_ANSWER_NOTE, bw, noteOpt).length);

      var nh = CARD.top + bodyLines * 23 + 26 + CARD.button + 18
             + noteLines * 15 + 26;
      var ny = Math.round((H - nh) / 2) + 8;
      this.card = { x: nx, y: ny, w: nw, h: nh };
      Screens._notice(ctx, nx, ny, nw, nh, C.OFFICER_HEADING);

      var y = ny + 66;
      D.txt(ctx, C.OFFICER_TITLE, px, y,
        { size: 22, weight: 600, family: 'sans', color: P.bright, track: 3.4 });
      y += 16;
      D.seam(ctx, px, y, pw);

      y = D.para(ctx, C.OFFICER_BODY, px, ny + CARD.top, pw, bodyOpt) + 24;

      /* Two plates, the same size, in the same grey. Neither is the
         default and neither is styled as the brave one. */
      var up = { x: px, y: y, w: bw, h: CARD.button, id: 'upgrade' };
      var ask = { x: px + bw + 24, y: y, w: bw, h: CARD.button, id: 'answer' };
      Screens._control(ctx, up, C.OFFICER_UPGRADE,
        g.hoverId === 'upgrade' ? 'hover' : 'idle', { size: 13 });
      Screens._control(ctx, ask, C.OFFICER_ANSWER,
        g.hoverId === 'answer' ? 'hover' : 'idle', { size: 13 });
      this.hits.push(up, ask);

      var ny2 = y + CARD.button + 18;
      D.para(ctx, C.OFFICER_UPGRADE_NOTE, px, ny2, bw, noteOpt);
      D.para(ctx, C.OFFICER_ANSWER_NOTE, px + bw + 24, ny2, bw, noteOpt);
    },

    /* What he said, on the same card an item on the line is read on,
       because it is the same act: somebody has told you something. */
    drawAnswer: function (ctx, t, g) {
      var o = this.open, clue = o.clue;
      var nx = 190, nw = W - 380, pw = nw - 88;
      var lineOpt = { size: 13.5, color: P.text, lineHeight: 22 };
      var rows = clue.lines.map(function (s) { return D.wrap(ctx, s, pw, lineOpt).length; });
      var bodyH = rows.reduce(function (a, n) { return a + n * 22 + 12; }, 0);
      var nh = 78 + 26 + 24 + bodyH + 30 + 46 + 26;
      var ny = Math.round((H - nh) / 2) + 8;
      this.card = { x: nx, y: ny, w: nw, h: nh };

      Screens._notice(ctx, nx, ny, nw, nh, C.INQUIRY_HEADING);
      ctx.fillStyle = P.accent;
      ctx.fillRect(nx, ny + 28, 3, nh - 28);

      var px = nx + 44;
      var y = ny + 78;
      D.txt(ctx, clue.kind, px, y,
        { size: 19, weight: 600, family: 'sans', color: P.accentHi, track: 3.6 });
      y += 20;
      D.stencil(ctx, clue.source, px, y, { size: 10, track: 1.6, color: P.dim });
      y += 24;
      D.seam(ctx, px, y - 8, pw);

      for (var i = 0; i < clue.lines.length; i++) {
        if (i >= o.shown) break;
        var age = o.t - (L.CLUE_LEAD + i * L.CLUE_LINE);
        var a = D.clamp(age / 0.55, 0, 1);
        y = D.para(ctx, clue.lines[i], px, y + 10, pw, {
          size: lineOpt.size, lineHeight: lineOpt.lineHeight,
          color: P.text, alpha: 0.15 + 0.85 * a
        }) + 2;
      }

      var b = { x: px - 14, y: ny + nh - 72, w: 268, h: 46, id: 'close' };
      Screens._control(ctx, b, C.OFFICER_CLOSE,
        g.hoverId === 'close' ? 'hover' : (o.read ? 'active' : 'idle'),
        { size: 12, accent: o.read });
      this.hits.push(b);
    },

    /* ----- input ----- */

    key: function (e, g) {
      if (this.open) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') this.close_(g);
        return;
      }
      if (e.key === '1') { this.takeUpgrade(g); this.close_(g); return; }
      if (e.key === '2') { this.askAnswer(g); return; }
    },

    pointer: function (x, y, type, g) {
      var hit = this.hits.find(function (r) { return D.inRect(x, y, r); });
      g.hoverId = hit ? hit.id : null;
      if (!hit || type !== 'down') return;
      if (hit.id === 'upgrade') { this.takeUpgrade(g); this.close_(g); }
      else if (hit.id === 'answer') this.askAnswer(g);
      else if (hit.id === 'close') this.close_(g);
    }
  };

})(typeof window !== 'undefined' ? window : globalThis);
