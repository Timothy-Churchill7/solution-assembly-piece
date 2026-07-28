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

  /* Walking off the line is not free. Half a day is what the plant docks
     for a station that stood idle, and it does not ask why it stood idle. */
  E.STOPPED_DAY_FACTOR = 0.5;

  E.payFor = function (rec) {
    rec = rec || {};
    var stamped = rec.stamped || 0;
    var day = rec.stopped
      ? Math.round(E.DAY_RATE * E.STOPPED_DAY_FACTOR)
      : E.DAY_RATE;
    var piece = E.PIECE_RATE * stamped;
    var bonus = stamped >= (rec.target || 0) ? E.TARGET_BONUS : 0;
    var rejects = -E.REJECT_PENALTY * (rec.rejects || 0);
    var late = rec.late ? -E.LATE_DEDUCTION : 0;
    var gross = day + piece + bonus;
    return {
      day: day,
      piece: piece,
      bonus: bonus,
      rejects: rejects,
      late: late,
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
    { id: 'lamp',   cost: 45 },
    { id: 'radio',  cost: 60 },
    { id: 'gauge',  cost: 70 },
    { id: 'arm',    cost: 85 },
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

  E.CYCLE = 1.62;           // seconds between strikes, unaided
  /* The pedal buys back roughly a shift's worth of reaching for the lever.
     Set at 0.80 to begin with, which made it the only purchase in the
     catalogue that mattered: it carried every shift on its own from the
     second one, and the sorting arm cost more and did less. At 0.90 it
     buys back the fifth shift and not the sixth, which is what leaves the
     last one to be solved rather than bought. */
  E.PEDAL_FACTOR = 0.90;
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
     is fitted, found, and sent back against your name.

     Reaching across costs PULL_TIME, and it is charged against the cycle
     rather than run alongside it — a pull pushes the next strike back by
     that long whenever it is made. The first cut of this ran the reach as
     a separate window of busy hands, and a player who reached while the
     ram was coming up anyway paid nothing at all: line 5 was free, and the
     whole second duty was decoration. Taking it off the cycle is what
     makes it a cost you cannot time your way out of.

     That is the difficulty of the job. Neither duty is hard. There is one
     pair of hands and the schedule is written as though there were two. */

  E.PULL_TIME = 1.05;       // seconds a reach across puts the next strike back
  E.ARM_SHARE = 0.75;       // faults the sorting arm takes before you see them

  E.armShare = function (ledger) {
    return E.owns(ledger, 'arm') ? E.ARM_SHARE : 0;
  };

  /* The reach, as a fraction of a cycle — what a pull takes off the charge.
     Absolute seconds, not a fixed share: the foot pedal buys a faster press,
     never a faster arm. */
  E.pullCharge = function (ledger) {
    return E.PULL_TIME / E.cycle(ledger);
  };

  /* Turning a piece over and looking at it costs more than taking it off,
     and does not take it off. Curiosity is not a cheaper way of doing the
     job; it is a thing you do instead of the job. */
  E.LOOK_TIME = 1.6;

  E.lookCharge = function (ledger) {
    return E.LOOK_TIME / E.cycle(ledger);
  };

  /* Seconds of a shift given to line 5, for a station that catches every
     fault that reaches it. The arm takes its share first and for nothing. */
  E.dutySeconds = function (faults, ledger) {
    return (faults || 0) * E.PULL_TIME * (1 - E.armShare(ledger));
  };

  /* Ceiling on stamped parts for one shift, given the kit on the bench.
     `duties` is seconds the shift spends on something other than the press
     — line 5, and later a look at the monitor. Zero for an operator who
     lets line 5 run past, which is a strategy and has its own bill. */
  E.capacity = function (cfg, ledger, duties) {
    if (!cfg) return 0;
    var arrivals = Math.floor(cfg.duration / cfg.spawn);
    var auto = Math.floor(arrivals * E.autoShare(ledger));
    var open = Math.max(0, cfg.duration - (duties || 0));
    var byHand = Math.floor(open / E.cycle(ledger));
    return Math.min(arrivals, auto + byHand);
  };

  /* Positive when the schedule cannot be met, however well it is played. */
  E.shortfall = function (cfg, ledger, duties) {
    return cfg.target - E.capacity(cfg, ledger, duties);
  };

})(typeof window !== 'undefined' ? window : globalThis);
