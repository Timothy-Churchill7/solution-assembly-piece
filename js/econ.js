/* econ.js — what the work is worth, and what the plant will sell you back.

   Pure: no canvas, no DOM, no timing. Everything here is a function over
   plain data so the test suite can assert on it directly — including the
   claim the whole design rests on, which is that the schedule outruns a
   pair of unaided hands before the run is over. */
(function (root) {
  'use strict';

  var SOL = root.SOL || (root.SOL = {});
  var C = SOL.content;
  var E = SOL.econ = {};

  /* ---------- what a shift pays ----------
     A day rate nobody could live on, a piece rate that can be pushed, and
     a bonus for making the number. The bonus is the only part large enough
     to matter, and it is paid against the sheet rather than against the
     work — which is a distinction the office has no way of drawing and
     will turn out to matter later. */

  E.DAY_RATE = 20;
  E.PIECE_RATE = 1;
  E.TARGET_BONUS = 25;
  E.REJECT_PENALTY = 3;    // per part the assembly works sent back
  E.LATE_DEDUCTION = 6;    // still on the floor after the hooter
  E.BIN_SCRIP = 2;         // for emptying the basket, as the foreman said

  /* The heavier line the works office offers on the fourth shift. It was
     written as more stock arriving and nothing else, which paid the player
     exactly nothing: the press cooldown is the ceiling, not the belt, so
     extra stock simply went by unstamped. The trade is real only if it
     touches the book, so it does — the rate goes up on every part from
     there to the end of the quarter, and the money is what buys output,
     through the stores. */
  E.UPGRADE_PIECE_RATE = 1.5;

  /* Walking off the line is not free. Half a day is what the plant docks
     for a station that stood idle, and it does not ask why it stood idle. */
  E.STOPPED_DAY_FACTOR = 0.5;

  E.payFor = function (rec) {
    rec = rec || {};
    var stamped = rec.stamped || 0;
    var day = rec.stopped
      ? Math.round(E.DAY_RATE * E.STOPPED_DAY_FACTOR)
      : E.DAY_RATE;
    var piece = Math.round(
      (rec.upgraded ? E.UPGRADE_PIECE_RATE : E.PIECE_RATE) * stamped);
    var bonus = stamped >= (rec.target || 0) ? E.TARGET_BONUS : 0;
    var rejects = -E.REJECT_PENALTY * (rec.rejects || 0);
    var late = rec.late ? -E.LATE_DEDUCTION : 0;
    var bin = rec.binScrip || 0;
    var gross = day + piece + bonus + bin;
    return {
      day: day,
      piece: piece,
      bonus: bonus,
      rejects: rejects,
      late: late,
      bin: bin,
      // the book is never allowed to go backwards; it simply pays nothing
      total: Math.max(0, gross + rejects + late)
    };
  };

  /* ---------- the stores ----------
     Costs are set against a run that earns roughly five hundred if it makes
     every number. The catalogue comes to more than that. Nobody leaves here
     with all of it, and the two items that carry no advantage at the bench
     — the radio and the monitor — are priced against the ones that do.
     Curiosity is bought out of the same book as competence.

     Priced strictly by what each one gives back, because the first cut was
     not: the sorting arm cost more than the foot pedal and did less, which
     made it a trap for anyone reading the list top to bottom. The order
     below is the order a player sees, and it is the order of price. */

  E.CATALOGUE = [
    { id: 'arm',    cost: 40 },
    { id: 'lamp',   cost: 50 },
    { id: 'radio',  cost: 60 },
    { id: 'gauge',  cost: 70 },
    { id: 'camera', cost: 95 },
    { id: 'pedal',  cost: 110 },
    { id: 'feeder', cost: 240 }
  ];

  /* Copy lives in content.js; this joins the two so the catalogue can be
     rendered from one list. */
  E.items = function () {
    return E.CATALOGUE.map(function (it) {
      var copy = (C && C.STORE_ITEMS && C.STORE_ITEMS[it.id]) || {};
      return {
        id: it.id, cost: it.cost,
        name: copy.name || it.id.toUpperCase(),
        note: copy.note || '',
        blurb: copy.blurb || ''
      };
    });
  };

  E.item = function (id) {
    var all = E.items();
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  };

  E.TOTAL_CATALOGUE = E.CATALOGUE.reduce(function (a, it) { return a + it.cost; }, 0);

  /* ---------- the book ---------- */

  E.newLedger = function () {
    return {
      scrip: 0,      // spendable now
      owned: [],     // item ids on the bench
      earned: 0,     // paid in across the run
      spent: 0,      // paid back out to the stores
      pay: []        // one breakdown per shift, in order
    };
  };

  E.owns = function (ledger, id) {
    return !!ledger && ledger.owned.indexOf(id) >= 0;
  };

  E.canBuy = function (ledger, id) {
    var it = E.item(id);
    if (!it) return 'unknown';
    if (E.owns(ledger, id)) return 'owned';
    if (!ledger || ledger.scrip < it.cost) return 'funds';
    return true;
  };

  E.buy = function (ledger, id) {
    if (E.canBuy(ledger, id) !== true) return false;
    var it = E.item(id);
    ledger.scrip -= it.cost;
    ledger.spent += it.cost;
    ledger.owned.push(id);
    return true;
  };

  E.credit = function (ledger, breakdown) {
    if (!ledger || !breakdown) return ledger;
    ledger.scrip += breakdown.total;
    ledger.earned += breakdown.total;
    ledger.pay.push(breakdown);
    return ledger;
  };

  /* ---------- what a pair of hands can do ----------
     The press has a cycle. It is the real constraint on a shift — not how
     fast the belt runs, but how soon the ram is back up and willing. Every
     expensive thing in the catalogue is, one way or another, an attempt to
     buy your way out of this one number.

     Nothing here is a metaphor: `capacity` is the ceiling the running game
     enforces, and a test asserts it drops below the schedule. */

  /* The cooldown is a fact about the press and about nothing else. It
     starts when the ram strikes and it ends when the ram is back up, and
     no other thing you do at this station touches it.

     It used to. Reaching across to line 5 and turning a piece over both
     came off the charge, which made the second duty provably expensive
     against a test harness and completely baffling to play: the meter
     moved for reasons that had nothing to do with the press, and pressing
     for a part you could not have felt like being punished for trying.
     Line 5 costs what it should have cost all along — the seconds and the
     clicks you spend up there instead of at the press, and the parts that
     go by while you are reading something. */

  /* 1.72 rather than 1.70 because shift 1 spawns a part every 1.70s, and a
     cooldown exactly equal to the arrival rate makes the first shift a
     metronome — every part lands the instant the press frees up, which is
     both dull to play and a degenerate case for anything measuring it. */
  E.CYCLE = 1.72;           // seconds between strikes, unaided

  /* The one purchase that changes the number above. Fifteen per cent is
     not dramatic and it is the difference between finishing the quarter
     and not: unaided, the schedule beats you on the fifth shift. */
  E.PEDAL_FACTOR = 0.85;
  E.PEDAL_CUT = Math.round((1 - E.PEDAL_FACTOR) * 100);

  E.FEEDER_SHARE = 0.45;    // share of arrivals the feeder takes unattended

  E.cycle = function (ledger) {
    return E.CYCLE * (E.owns(ledger, 'pedal') ? E.PEDAL_FACTOR : 1);
  };

  E.autoShare = function (ledger) {
    return E.owns(ledger, 'feeder') ? E.FEEDER_SHARE : 0;
  };

  /* ---------- the second duty ----------
     Line 5 passes the station carrying finished work to packing, and you
     are the last pair of eyes on it. A piece that will not pass at the
     assembly works has to come off before it gets there; one that does not
     is fitted, found, and sent back against your name at REJECT_PENALTY a
     time. That deduction is the whole cost of ignoring it, and it is a
     large one: it is the money you would have bought the foot pedal with. */

  /* The arm sweeps its share whether or not you are watching, so what it
     is really worth is the deductions it prevents on the nights you are
     too busy at the press to reach for line 5: three in four faults across
     a run comes to about forty scrip. It is priced just under what it
     saves, measured by driving the real screen, so it pays for itself and
     the reaching it spares you is the profit. */
  E.ARM_SHARE = 0.75;

  E.armShare = function (ledger) {
    return E.owns(ledger, 'arm') ? E.ARM_SHARE : 0;
  };

  /* Ceiling on stamped parts for one shift, given the kit on the bench.
     Two limits and no others: how many parts arrive, and how often the
     press will answer. */
  E.capacity = function (cfg, ledger) {
    if (!cfg) return 0;
    var arrivals = Math.floor(cfg.duration / cfg.spawn);
    var auto = Math.floor(arrivals * E.autoShare(ledger));
    return Math.min(arrivals, auto + Math.floor(cfg.duration / E.cycle(ledger)));
  };

  /* Positive when the schedule cannot be met, however well it is played. */
  E.shortfall = function (cfg, ledger) {
    return cfg.target - E.capacity(cfg, ledger);
  };

})(typeof window !== 'undefined' ? window : globalThis);
