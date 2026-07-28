/* trash.js — the bin by the door.

   Every shift ends here, and the screen is built to be skipped. TIP IT OUT
   is the first control, it is the one the man on his way out recommends,
   it costs nothing and it takes a second. SORT IT is beside it in the same
   grey, costs you the hooter, and nine times in ten turns up nothing.

   That is the whole design of the channel. It is not a puzzle and it does
   not reward persistence with a drip of hints — it rewards a player who
   keeps paying a small certain cost against a large uncertain one, which
   is the only shape of curiosity this piece is interested in. The one
   thing it will eventually turn up, for a player who has been looking
   elsewhere too, is the circular. */
(function (root) {
  'use strict';

  var SOL = root.SOL, P = SOL.P, D = SOL.D, S = SOL.scene, C = SOL.content;
  var L = SOL.logic, E = SOL.econ;
  var W = SOL.W, H = SOL.H;
  var Screens = SOL.screens;

  var CARD = { x: 250, w: 700, top: 92, button: 46 };

  Screens.trash = {
    name: 'trash',
    hits: [],
    shift: null,
    found: null,      // what is in it this time, if anything
    done: false,      // the choice has been made
    sorted: false,
    open: null,       // { clue, t, shown, read } once something is being read
    card: null,

    enter: function (opts, g) {
      this.hits = [];
      this.shift = (opts && opts.shift) || null;
      this.done = false;
      this.sorted = false;
      this.open = null;
      this.card = null;
      /* Resolved on arrival, not on the click, so that what is in the bin
         does not depend on how long the player hesitated over it. */
      this.found = this.shift ? L.trashFor(g.run, this.shift) : null;
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
        L.recordClue(g.run, this.shift, o.clue);
      }
    },

    /* Tip it. Thirty seconds, no deduction, and whatever was in it goes to
       the same place everything else goes. */
    tip: function (g) {
      if (this.done) return false;
      this.done = true;
      this.sorted = false;
      if (this.found) this.shift.marksPassed++;
      SOL.audio.scrap && SOL.audio.scrap();
      this.close_(g);
      return true;
    },

    /* Sort it. The office docks for being on the floor after the hooter,
       and it docks whether or not there was anything in the bin. */
    sort: function (g) {
      if (this.done) return false;
      this.done = true;
      this.sorted = true;
      this.shift.trashSorted = true;
      this.shift.late = true;
      SOL.audio.paper && SOL.audio.paper();
      if (this.found) {
        this.open = { clue: this.found, t: 0, shown: 0, read: false };
        return true;
      }
      this.close_(g);
      return true;
    },

    /* Closing the item is not a decision point: whether it counted was
       settled when the last line surfaced, or did not. */
    close_: function (g) {
      this.open = null;
      L.closeShift(g.run, this.shift);
      g.go('summary', { shift: this.shift });
    },

    /* ----- render ----- */

    draw: function (ctx, t, g) {
      this.hits = [];
      if (!this.shift) { g.go('menu'); return; }

      S.hall(ctx, t, { mood: 0.4, lamps: 2, floorY: 560, still: g.frozen });
      ctx.fillStyle = 'rgba(4,5,6,0.86)';
      ctx.fillRect(0, 0, W, H);
      Screens._headerRail(ctx, C.PLANT_NAME, 'SHIFT ' + this.shift.n + ' · CLOCKING OFF');

      if (this.open) { this.drawItem(ctx, t, g); }
      else { this.drawBin(ctx, t, g); }

      Screens._footerRail(ctx, this.open
        ? (this.open.read ? 'ENTER OR ESC TO GO HOME' : C.INQUIRY_RUNNING)
        : '1 TIP IT OUT  ·  2 SORT IT');
      D.crt(ctx, W, H, t);
    },

    drawBin: function (ctx, t, g) {
      var nx = CARD.x, nw = CARD.w, px = nx + 44, pw = nw - 88;
      var saidOpt = { size: 13.5, color: P.dim, lineHeight: 23 };
      /* The line is said once, by somebody who has worked here longer than
         you. After that the bin is just a bin and nobody mentions it. */
      var say = this.shift.n === 1 ? C.TRASH_SAID : null;
      var saidLines = say ? D.wrap(ctx, say, pw, saidOpt).length : 0;

      /* Each note is wrapped to the width of the plate it belongs under.
         Set as two single lines to begin with, they ran into each other in
         the middle of the card and neither could be read. */
      var bw = Math.floor((pw - 24) / 2);
      var noteOpt = { size: 9.5, lineHeight: 15, color: 'rgba(74,82,89,0.95)' };
      var noteLines = Math.max(
        D.wrap(ctx, C.TRASH_TIP_NOTE, bw, noteOpt).length,
        D.wrap(ctx, C.TRASH_SORT_NOTE, bw, noteOpt).length);

      var nh = CARD.top + (saidLines ? saidLines * 23 + 26 : 0)
             + CARD.button + 18 + noteLines * 15 + 20 + 26;
      var ny = Math.round((H - nh) / 2) + 8;
      this.card = { x: nx, y: ny, w: nw, h: nh };
      Screens._notice(ctx, nx, ny, nw, nh, C.TRASH_HEADING);

      var y = ny + 74;
      D.txt(ctx, C.TRASH_TITLE, px, y,
        { size: 22, weight: 600, family: 'sans', color: P.bright, track: 4 });
      y += 18;
      D.seam(ctx, px, y, pw);
      y += 30;

      if (say) {
        y = D.para(ctx, say, px, y, pw, saidOpt) + 26;
      }

      /* Two plates, the same size, in the same grey, in the order a person
         would actually consider them. Nothing marks the second one out. */
      var tip = { x: px, y: y, w: bw, h: CARD.button, id: 'tip' };
      var srt = { x: px + bw + 24, y: y, w: bw, h: CARD.button, id: 'sort' };
      Screens._control(ctx, tip, C.TRASH_TIP,
        g.hoverId === 'tip' ? 'hover' : 'active', { size: 13 });
      Screens._control(ctx, srt, C.TRASH_SORT,
        g.hoverId === 'sort' ? 'hover' : 'idle', { size: 13 });
      this.hits.push(tip, srt);

      // what each one costs, stated flatly, under the plate it belongs to
      var ny2 = y + CARD.button + 18;
      D.para(ctx, C.TRASH_TIP_NOTE, px, ny2, bw, noteOpt);
      D.para(ctx, C.TRASH_SORT_NOTE, px + bw + 24, ny2, bw, noteOpt);
      D.stencil(ctx, '-' + E.LATE_DEDUCTION + ' ' + C.SCRIP,
        px + pw, ny2 + noteLines * 15 + 6,
        { size: 9, track: 2, color: 'rgba(74,82,89,0.95)', align: 'right' });
    },

    /* Whatever was under the swarf, read on the same card the line uses,
       because it is the same act. Nothing is running now, so this one
       costs only the time it took to be standing here reading it. */
    drawItem: function (ctx, t, g) {
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
      D.stencil(ctx, C.TRASH_FOUND, px + pw, y - 2,
        { size: 9.5, track: 2, color: P.faint, align: 'right' });
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

      var b = { x: px - 14, y: ny + nh - 72, w: 268, h: 46, id: 'home' };
      Screens._control(ctx, b, C.TRASH_DONE,
        g.hoverId === 'home' ? 'hover' : (o.read ? 'active' : 'idle'),
        { size: 12, accent: o.read });
      this.hits.push(b);
    },

    /* ----- input ----- */

    key: function (e, g) {
      if (this.open) {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') this.close_(g);
        return;
      }
      if (e.key === '1' || e.key === 'Enter' || e.key === ' ') { this.tip(g); return; }
      if (e.key === '2') { this.sort(g); return; }
    },

    pointer: function (x, y, type, g) {
      var hit = this.hits.find(function (r) { return D.inRect(x, y, r); });
      g.hoverId = hit ? hit.id : null;
      if (!hit || type !== 'down') return;
      if (hit.id === 'tip') this.tip(g);
      else if (hit.id === 'sort') this.sort(g);
      else if (hit.id === 'home') this.close_(g);
    }
  };

})(typeof window !== 'undefined' ? window : globalThis);
