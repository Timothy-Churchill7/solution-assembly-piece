/* stores.js — the works stores, open between shifts.

   The plant pays you in scrip and then sells you the tools you need in
   order to go on being paid. That is the whole screen; it is laid out as a
   price list because a price list is what it is.

   Nothing here carries the accent. The radio and the monitor are the two
   things in the catalogue that will let a player learn anything, and they
   sit in the list at their price between a lamp and a foot pedal, with no
   more emphasis than either. Marking them would give away that this is a
   game with something to find. */
(function (root) {
  'use strict';

  var SOL = root.SOL, P = SOL.P, D = SOL.D, S = SOL.scene, C = SOL.content;
  var L = SOL.logic, E = SOL.econ;
  var W = SOL.W, H = SOL.H;
  var Screens = SOL.screens;

  /* The card has to hold a fixed seven-row catalogue and a pay stub whose
     height varies with how the shift went, between the header rail and the
     footer rail. The first version of this screen was laid out by adding
     guesses together and ran a hundred pixels off the bottom of the stage,
     so the numbers below are a budget that adds up, and `this.card` is
     published for a test that checks it still does. */
  var ROW_H = 44;
  var CARD = { x: 140, y: 44, w: 920 };
  var TOP_BLOCK = 96;    // title bar, then the sub-heading
  var BOOK_H = 92;       // the pay stub
  var NOTES_H = 48;      // the two lines of stores signage
  var BUTTON_H = 46;

  function ledgerOf(g) { return g.run && g.run.ledger; }

  Screens.stores = {
    name: 'stores',
    hits: [],
    rec: null,        // the shift just closed, for the pay breakdown
    lastBuy: null,    // id of the most recent purchase, for one frame of feedback
    buyT: 0,
    card: null,       // the notice rect, published so a test can check it fits

    enter: function (opts, g) {
      this.hits = [];
      this.lastBuy = null;
      this.buyT = 0;
      this.rec = g.run.shiftLog[g.run.shiftLog.length - 1] || null;
    },

    update: function (dt) {
      if (this.buyT > 0) this.buyT = Math.max(0, this.buyT - dt);
    },

    buy: function (id, g) {
      var led = ledgerOf(g);
      if (E.canBuy(led, id) !== true) return false;
      E.buy(led, id);
      this.lastBuy = id;
      this.buyT = 1.2;
      SOL.audio.lever && SOL.audio.lever();
      return true;
    },

    leave_: function (g) {
      SOL.audio.confirm && SOL.audio.confirm();
      g.go('brief');
    },

    /* ----- render ----- */

    draw: function (ctx, t, g) {
      this.hits = [];
      var led = ledgerOf(g);
      var rec = this.rec;

      S.hall(ctx, t, { mood: 0.5, lamps: 3, floorY: 560, still: g.frozen });
      ctx.fillStyle = 'rgba(4,5,6,0.86)';
      ctx.fillRect(0, 0, W, H);

      Screens._headerRail(ctx, C.PLANT_NAME,
        rec ? 'AFTER SHIFT ' + rec.n : 'BETWEEN SHIFTS');

      var items = E.items();
      var nx = CARD.x, nw = CARD.w, px = nx + 44, pw = nw - 88;
      var nh = TOP_BLOCK + BOOK_H + 20 + items.length * ROW_H + 18
             + NOTES_H + 14 + BUTTON_H + 22;
      var ny = CARD.y;
      this.card = { x: nx, y: ny, w: nw, h: nh };
      Screens._notice(ctx, nx, ny, nw, nh, C.STORE_HEADING);

      var y = ny + 62;
      D.stencil(ctx, C.STORE_SUB, px, y, { size: 9, track: 2.4, color: P.faint });
      y = ny + TOP_BLOCK;

      this.drawBook(ctx, px, y, pw, rec, led);
      y += BOOK_H + 20;
      D.seam(ctx, px, y - 12, pw);

      for (var i = 0; i < items.length; i++) {
        this.drawRow(ctx, items[i], px, y, pw, i, led, g);
        y += ROW_H;
      }

      y += 18;
      /* When there is nothing on the book that reaches the cheapest thing
         on the list, saying how scrip works is no use to anybody. The
         stores say the other thing instead, and say it without sympathy. */
      var broke = !items.some(function (it) { return E.canBuy(led, it.id) === true; })
        && items.some(function (it) { return !E.owns(led, it.id); });
      D.stencil(ctx, broke ? C.STORE_EMPTY : C.STORE_NOTE, px, y + 4,
        { size: 9.5, track: 1.8, color: 'rgba(74,82,89,0.95)' });
      /* The one editorial line on the screen, kept down here with the rest
         of the signage rather than printed next to the figure it is about. */
      D.para(ctx, C.PAY_BONUS_NOTE, px, y + 22, Math.floor(pw * 0.72),
        { size: 9.5, color: 'rgba(66,74,80,0.95)', lineHeight: 15 });

      var b = { x: px - 14, y: ny + nh - BUTTON_H - 22, w: 240, h: BUTTON_H, id: 'leave' };
      Screens._control(ctx, b, C.STORE_LEAVE,
        g.hoverId === 'leave' ? 'hover' : 'active', { size: 13 });
      this.hits.push(b);

      Screens._footerRail(ctx, 'CLICK TO BUY  ·  ENTER TO CLOCK ON');
      D.crt(ctx, W, H, t);
    },

    /* The shift's pay as a stub — a row of small figures reading left to
       right, ending in the total — and the balance it leaves, large, on the
       right. Laid out horizontally because a vertical list of five items
       made the top of the card taller than the catalogue underneath it,
       which put the plant's arithmetic above the player's choices. */
    drawBook: function (ctx, px, y, pw, rec, led) {
      var pay = rec && rec.pay;

      var cols = [];
      if (pay) {
        cols.push([C.PAY_ROWS.day, pay.day, false]);
        cols.push([C.PAY_ROWS.piece, pay.piece, false]);
        if (pay.bonus > 0) cols.push([C.PAY_ROWS.bonus, pay.bonus, false]);
        if (pay.rejects < 0) cols.push([C.PAY_ROWS.rejects, pay.rejects, false]);
        if (pay.late < 0) cols.push([C.PAY_ROWS.late, pay.late, false]);
        cols.push([C.PAY_ROWS.total, pay.total, true]);
      }

      // no stub means no heading — an empty PAY label over blank card was
      // worse than saying nothing
      if (cols.length) {
        D.stencil(ctx, C.PAY_HEADING, px, y + 10,
          { size: 9.5, track: 3.2, color: P.faint });
      }

      /* Columns are sized to their own label rather than to a constant.
         A fixed 96px pitch printed SCHEDULE BONUS straight through the
         heading of the column after it. */
      var labelOpt = { size: 8, track: 1.6 };
      var cx = px;
      cols.forEach(function (c, i) {
        var last = c[2];
        var wide = Math.max(64, D.measure(ctx, c[0], labelOpt)) + 26;
        if (last && i > 0) {
          // a rule where the adding stops
          cx += 10;
          ctx.fillStyle = 'rgba(226,238,246,0.10)';
          ctx.fillRect(cx - 13, y + 28, 1, 30);
        }
        D.stencil(ctx, c[0], cx, y + 40,
          { size: 8, track: 1.6, color: last ? P.dim : P.faint });
        D.txt(ctx, (c[1] < 0 ? '' : '+') + c[1], cx, y + 62, {
          size: last ? 17 : 14, weight: 600,
          color: c[1] < 0 ? P.warn : (last ? P.bright : P.mid)
        });
        cx += wide;
      });

      // the balance, given the size the plant gives it
      var bx = px + pw;
      D.stencil(ctx, C.STORE_BALANCE, bx, y + 10,
        { size: 9.5, track: 3.2, color: P.faint, align: 'right' });
      D.txt(ctx, String(led ? led.scrip : 0), bx, y + 62,
        { size: 42, weight: 700, family: 'sans', align: 'right', color: P.bright });
      D.stencil(ctx, C.SCRIP, bx, y + 80,
        { size: 9, track: 3, color: P.dim, align: 'right' });
    },

    drawRow: function (ctx, it, px, y, pw, i, led, g) {
      var state = E.canBuy(led, it.id);
      var owned = state === 'owned';
      var short = state === 'funds';
      var hot = g.hoverId === 'buy:' + it.id && state === true;
      var fresh = this.lastBuy === it.id && this.buyT > 0;

      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.014)';
        ctx.fillRect(px - 14, y - 4, pw + 28, ROW_H - 6);
      }
      if (hot) {
        ctx.fillStyle = 'rgba(226,238,246,0.05)';
        ctx.fillRect(px - 14, y - 4, pw + 28, ROW_H - 6);
        ctx.fillStyle = 'rgba(226,238,246,0.34)';
        ctx.fillRect(px - 14, y - 4, 2, ROW_H - 6);
      }
      if (fresh) {
        // one beat of acknowledgement, then it is just a thing you own
        ctx.fillStyle = 'rgba(226,238,246,' + (0.06 * (this.buyT / 1.2)) + ')';
        ctx.fillRect(px - 14, y - 4, pw + 28, ROW_H - 6);
      }

      var nameCol = owned ? P.dim : (short ? 'rgba(104,114,122,0.85)' : P.text);
      D.stencil(ctx, it.name, px, y + 13, { size: 12, track: 2.6, color: nameCol });
      D.stencil(ctx, it.note, px, y + 29,
        { size: 9.5, track: 1.4, color: owned || short ? 'rgba(70,78,85,0.9)' : P.faint });

      var rx = px + pw;
      if (owned) {
        D.stencil(ctx, C.STORE_OWNED, rx, y + 20,
          { size: 10, track: 2.4, color: P.dim, align: 'right' });
      } else {
        D.txt(ctx, String(it.cost), rx, y + 19,
          { size: 17, weight: 600, align: 'right',
            color: short ? 'rgba(90,99,107,0.9)' : P.bright });
        if (short) {
          D.stencil(ctx, C.STORE_SHORT, rx, y + 33,
            { size: 8.5, track: 2, color: 'rgba(74,82,89,0.95)', align: 'right' });
        }
      }

      if (state === true) {
        this.hits.push({ x: px - 14, y: y - 4, w: pw + 28, h: ROW_H - 6, id: 'buy:' + it.id });
      }
    },

    /* ----- input ----- */

    key: function (e, g) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        this.leave_(g);
        return;
      }
      // 1..7 buy straight off the list, in the order it is printed
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= E.CATALOGUE.length) this.buy(E.CATALOGUE[n - 1].id, g);
    },

    pointer: function (x, y, type, g) {
      var hit = this.hits.find(function (r) { return D.inRect(x, y, r); });
      g.hoverId = hit ? hit.id : null;
      if (!hit || type !== 'down') return;
      if (hit.id === 'leave') { this.leave_(g); return; }
      if (hit.id.indexOf('buy:') === 0) this.buy(hit.id.slice(4), g);
    }
  };

})(typeof window !== 'undefined' ? window : globalThis);
