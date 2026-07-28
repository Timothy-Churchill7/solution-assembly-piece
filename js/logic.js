/* logic.js — pure game state.
   No canvas, no DOM, no timing. Everything here is a plain function over
   plain data so it can be asserted directly from the test suite. */
(function (root) {
  'use strict';

  var SOL = root.SOL || (root.SOL = {});
  var L = SOL.logic = {};
  var C = SOL.content;
  var E = SOL.econ;

  /* ---------- shift configuration ----------
     duration  seconds on the clock
     spawn     seconds between parts arriving
     speed     belt travel, px/sec
     target    parts the plant expects; the only number it records
     mood      how much light the hall gives (drops as the run goes on)
     ret       seconds between pieces passing on line 5
     flaw      the share of those that will not pass at the assembly works */

  L.SHIFTS = [
    { n: 1, duration: 62, spawn: 1.70, speed: 96,  target: 24, mood: 1.00, ret: 3.6, flaw: 0.14 },
    { n: 2, duration: 66, spawn: 1.58, speed: 106, target: 28, mood: 0.90, ret: 3.4, flaw: 0.18 },
    { n: 3, duration: 70, spawn: 1.46, speed: 116, target: 33, mood: 0.78, ret: 3.2, flaw: 0.22 },
    { n: 4, duration: 72, spawn: 1.34, speed: 126, target: 38, mood: 0.64, ret: 2.9, flaw: 0.28 },
    { n: 5, duration: 74, spawn: 1.24, speed: 136, target: 44, mood: 0.50, ret: 2.7, flaw: 0.32 },
    { n: 6, duration: 76, spawn: 1.16, speed: 146, target: 48, mood: 0.36, ret: 2.5, flaw: 0.36 }
  ];

  L.SHIFT_COUNT = L.SHIFTS.length;

  /* ---------- line 5 ----------
     The return line is loaded off the far end, so a piece released too late
     in the shift would still be in front of you at the hooter and could be
     neither caught nor blamed on you. Nothing is released inside this many
     seconds of the end, which makes every piece of a shift resolvable and
     the arithmetic below exact rather than average.

     RETURN_LEAD is a fact about the geometry in shift.js — how long a piece
     takes to cross from where it appears to the far side of the inspection
     zone. A test drives the real screen and checks the two still agree. */
  L.RETURN_LEAD = 10.5;

  L.returnCount = function (cfg) {
    return Math.max(0, Math.floor((cfg.duration - L.RETURN_LEAD) / cfg.ret));
  };

  /* Faults are dealt at the shift's rate rather than rolled per piece, so a
     shift always brings exactly the number the schedule assumes. */
  L.faultCount = function (cfg) {
    return Math.floor(L.returnCount(cfg) * cfg.flaw);
  };

  /* Whether the i-th piece to pass, counting from zero, is one of them. */
  L.isFaulty = function (i, cfg) {
    return Math.floor((i + 1) * cfg.flaw) > Math.floor(i * cfg.flaw);
  };

  /* Which faults the sorting arm takes, dealt the same way. `j` counts
     faults, not pieces. */
  L.armTakes = function (j, share) {
    return Math.floor((j + 1) * share) > Math.floor(j * share);
  };

  /* Scrapping a part is only available once the player has been given a
     reason to want it. */
  L.SCRAP_FROM_SHIFT = 3;

  /* ---------- refusal ----------
     Two forms, and they are not equivalent.

     The loud one: walking off the line. It is gated twice — late enough in
     the run to matter, and only for a player who has read enough to have a
     reason they could name. The station has a master stop from the first
     shift, because it is a factory, but it is not yours to use before then. */
  L.STOP_FROM_SHIFT = 5;

  L.canStop = function (run, shift) {
    if (!shift || shift.n < L.STOP_FROM_SHIFT) return 'early';
    if (!run || !run.revealed) return 'unreasoned';
    return true;
  };

  /* The quiet one: the press has an adjustable depth stop. Set shallow, the
     die does not seat and the part comes off looking finished. It is still
     counted, so the plant's number never moves — which is the whole reason
     this is the only refusal that can be sustained across a whole shift.

     Gated on the reveal itself, not on a quantity of suspicion. Wrecking
     work on a hunch is a different act from wrecking it knowingly, and the
     game is only interested in the second one. A player who never goes
     looking never learns the control is there. */
  L.canSpoil = function (run) { return !!(run && run.revealed); };

  /* The plant does not weigh every part; it pulls a handful at the end of
     the shift. Drawn without replacement, so this is the chance that at
     least one short-struck part is in the sample. Pure — the caller supplies
     the roll, which is what makes it assertable. */
  L.SAMPLE_SIZE = 3;

  L.spoilRisk = function (shift) {
    var n = shift.stamped, bad = shift.spoiled;
    if (!bad || n <= 0) return 0;
    if (bad >= n) return 1;
    var clean = 1;                      // P(no short-struck part drawn)
    for (var i = 0; i < L.SAMPLE_SIZE && i < n; i++) {
      clean *= Math.max(0, (n - bad) - i) / (n - i);
    }
    return 1 - clean;
  };

  L.inspect = function (shift, roll) { return roll < L.spoilRisk(shift); };

  L.shiftConfig = function (n) {
    return L.SHIFTS[Math.max(0, Math.min(L.SHIFTS.length - 1, n - 1))];
  };

  /* ---------- inquiry ----------
     Clues are authored in content.js, alongside the shift they belong to.
     Here they are flattened into one addressable registry so awareness can
     be reasoned about without touching the renderer. */

  L.CLUES = [];
  L.CLUES_BY_SHIFT = {};
  (C ? C.SHIFTS : []).forEach(function (sc) {
    var list = sc.clues || [];
    L.CLUES_BY_SHIFT[sc.n] = list;
    list.forEach(function (c) { L.CLUES.push(c); });
  });

  /* The four channels. Nothing in the build lights up to tell you an item
     is available; the channel is where it will be if you go and look. */
  L.CHANNELS = ['part', 'radio', 'dock', 'trash'];

  /* Two of the channels are bench kit and have to be bought before they
     carry anything at all. A run that never buys them cannot reach what
     goes out on them, which is the point: inquiry is paid for out of the
     same book as the tools that keep you employed. */
  L.CHANNEL_ITEM = { radio: 'radio', dock: 'camera' };

  L.channelOpen = function (via, ledger) {
    var item = L.CHANNEL_ITEM[via];
    return !item || E.owns(ledger, item);
  };

  /* Clues of one channel, for one shift, in the order they become
     available. `trash` items have no time of their own: the bin is emptied
     at the end of the shift and that is when they are there. */
  L.cluesVia = function (n, via) {
    return (L.CLUES_BY_SHIFT[n] || []).filter(function (c) {
      return (c.via || 'part') === via;
    });
  };

  /* ---------- the reveal ----------
     None of the shift clues name anything. They are all deniable on their
     own, and a player who works fast and looks at nothing can finish the
     run without the game ever having told them. The one item that names it
     is held back until the player has read enough of the rest to have gone
     looking on purpose.

     It belongs to no shift. Each shift from REVEAL_FROM_SHIFT on has a slot
     late in the clock; the item goes out at the first slot the player has
     earned. Read everything up to that point and it arrives in shift 3;
     read less and it slides later, or never comes at all. */

  L.REVEAL = C ? C.REVEAL : null;
  if (L.REVEAL) L.CLUES.push(L.REVEAL);

  L.REVEAL_FROM_SHIFT = 3;
  /* What the two free channels together are worth by the end of shift 3 —
     the piece on line 5 and the bin by the door, used every time. It is
     deliberately payable without buying anything, so the circular is never
     behind a price; the radio and the camera buy you more of the story and
     a wider margin for error, not the ending. One channel on its own does
     not come to it, and a test says so. */
  L.REVEAL_MIN_AWARENESS = 8;

  L.canReveal = function (run, shift) {
    if (!L.REVEAL || !run || run.revealed) return false;
    if (run.cluesSeen.indexOf(L.REVEAL.id) >= 0) return false;
    if (!shift || shift.n < L.REVEAL_FROM_SHIFT) return false;
    return run.awareness >= L.REVEAL_MIN_AWARENESS;
  };

  /* ---------- the bin by the door ----------
     Every shift ends at it. Sorting it costs you the hooter — the office
     docks for being on the floor after it — and most shifts it turns up
     nothing at all. It is the only channel that is free, always open, and
     never worth it on the balance of probability. */

  L.trashFor = function (run, shift) {
    /* The circular is under everything else, and it takes the night when
       it is there: a bin that gives it up gives up nothing else, and
       whatever the shift had put in it is simply gone with the skip. */
    if (L.canReveal(run, shift)) return L.REVEAL;
    var left = L.cluesVia(shift.n, 'trash').filter(function (c) {
      return run.cluesSeen.indexOf(c.id) < 0;
    });
    return left.length ? left[0] : null;
  };

  L.MAX_AWARENESS = L.CLUES.reduce(function (a, c) { return a + c.weight; }, 0);

  L.clue = function (id) {
    for (var i = 0; i < L.CLUES.length; i++) if (L.CLUES[i].id === id) return L.CLUES[i];
    return null;
  };

  L.cluesFor = function (n) { return L.CLUES_BY_SHIFT[n] || []; };

  /* Reading is not instantaneous. Lines surface one at a time, and an item
     only counts as read once the last one has. This is what makes looking
     cost something: the belt runs the whole time. */
  L.CLUE_LEAD = 0.45;   // before the first line appears
  L.CLUE_LINE = 1.35;   // between lines
  L.CLUE_TAIL = 0.90;   // after the last line, before it counts as read

  /* The bench set reads at the speed a person talks, not at the speed a
     page is turned, and it does not wait for you. */
  L.RADIO_LINE = 4.6;

  /* How long a lorry is at the dock. Long enough to glance up and see it,
     short enough that a shift spent at the press misses it entirely. */
  L.DOCK_WINDOW = 26;

  L.linesShown = function (clue, t) {
    if (t < L.CLUE_LEAD) return 0;
    return Math.min(clue.lines.length,
      1 + Math.floor((t - L.CLUE_LEAD) / L.CLUE_LINE));
  };

  L.readTime = function (clue) {
    return L.CLUE_LEAD + (clue.lines.length - 1) * L.CLUE_LINE + L.CLUE_TAIL;
  };

  L.isRead = function (clue, t) { return t >= L.readTime(clue); };

  /* Idempotent by clue id: an item read twice teaches nothing twice. */
  L.recordClue = function (run, shift, clue) {
    if (!clue || run.cluesSeen.indexOf(clue.id) >= 0) return false;
    run.cluesSeen.push(clue.id);
    run.awareness += clue.weight;
    if (clue.reveal) { run.revealed = true; run.revealedOn = shift ? shift.n : null; }
    if (shift) shift.opened.push(clue.id);
    return true;
  };

  /* Bands, not a score. The plant keeps no column for this.
     'know' begins where the reveal lands: the minimum to be offered it,
     plus the reveal itself. Below that the player has suspicions and no
     more than suspicions, which is the honest description of it. */
  L.AWARENESS_TIERS = [
    { id: 'sure',  min: 28 },
    { id: 'know',  min: 14 },   // REVEAL_MIN_AWARENESS + REVEAL.weight
    { id: 'doubt', min: 6 },
    { id: 'trace', min: 1 },
    { id: 'none',  min: 0 }
  ];

  L.awarenessTier = function (run) {
    var a = typeof run === 'number' ? run : run.awareness;
    for (var i = 0; i < L.AWARENESS_TIERS.length; i++) {
      if (a >= L.AWARENESS_TIERS[i].min) return L.AWARENESS_TIERS[i].id;
    }
    return 'none';
  };

  L.awarenessFraction = function (run) {
    var a = typeof run === 'number' ? run : run.awareness;
    return L.MAX_AWARENESS ? a / L.MAX_AWARENESS : 0;
  };

  /* ---------- a run ---------- */

  L.newRun = function () {
    return {
      shift: 1,
      stamped: 0,        // total parts stamped across the run
      missed: 0,         // parts that ran off the end untouched
      scrapped: 0,       // parts deliberately destroyed
      spoiled: 0,        // parts short-struck: counted by the plant, useless
      flagged: 0,        // shifts where a short-struck part turned up in the sample
      cluesSeen: [],     // ids of inquiry items opened, in order
      awareness: 0,      // points accumulated from those items
      revealed: false,   // the circular was read through
      revealedOn: null,  // and the shift it happened on
      depthTold: false,  // the station has mentioned the depth stop once
      shiftLog: [],      // one summary object per completed shift
      stoppedLine: false,// the line was walked off at least once
      stops: 0,          // how many times
      rejects: 0,        // faulty pieces that got past the station on line 5
      pulled: 0,         // pieces taken off line 5, by hand or by the arm
      pulledSound: 0,    // of those, good stock taken off in error
      looked: 0,         // pieces turned over across the run
      binsSorted: 0,     // shifts the bin was sorted rather than tipped
      ledger: E.newLedger(),
      finished: false
    };
  };

  L.resetRun = function (run) {
    var fresh = L.newRun();
    Object.keys(run).forEach(function (k) { delete run[k]; });
    Object.keys(fresh).forEach(function (k) { run[k] = fresh[k]; });
    return run;
  };

  /* ---------- a single shift in progress ---------- */

  L.newShift = function (n) {
    var cfg = L.shiftConfig(n);
    return {
      n: n,
      cfg: cfg,
      timeLeft: cfg.duration,
      stamped: 0,        // what the plant counts — short-struck parts included
      spoiled: 0,        // of those, the ones that will not do the job
      flagged: false,    // the end-of-shift sample turned one up
      missed: 0,
      scrapped: 0,
      spawned: 0,
      opened: [],        // clue ids read to the end during this shift
      lostToInquiry: 0,  // parts that passed unfinished while an item was open
      marksSeen: 0,      // items this shift put within reach, on any channel
      marksPassed: 0,    // of those, the ones that went by unfound
      looked: 0,         // pieces turned over on line 5, finding or not
      trashSorted: false,// the bin was sorted rather than tipped
      stopped: false,    // the shift ended because the operator stopped it
      late: false,       // still on the floor after the hooter
      /* line 5 */
      returns: 0,        // pieces released onto the return line
      faulty: 0,         // of those, the ones that will not pass
      pulled: 0,         // taken off, by hand or by the arm
      pulledFaulty: 0,
      pulledSound: 0,    // good stock taken off in error
      sweptByArm: 0,
      rejects: 0,        // faults that got past the station and were fitted
      autoStamped: 0,    // parts the feeder took while you were elsewhere
      over: false
    };
  };

  /* ---------- scoring ----------
     Deliberately flat: the plant counts stamped parts and nothing else.
     Missing a part and scrapping a part cost the same on the record; only
     the player knows the difference. */

  L.shiftQuota = function (shift) { return shift.stamped; };

  L.meetsTarget = function (shift) {
    return shift.stamped >= shift.cfg.target;
  };

  /* Bureaucratic band, not praise. */
  L.rateShift = function (shift) {
    var t = shift.cfg.target;
    var q = shift.stamped;
    if (q >= Math.ceil(t * 1.10)) return 'ABOVE SCHEDULE';
    if (q >= t) return 'ON SCHEDULE';
    if (q >= Math.ceil(t * 0.70)) return 'BEHIND SCHEDULE';
    return 'SHORT';
  };

  /* Fold a finished shift into the run. `roll` is the plant's end-of-shift
     sample; callers in the game pass Math.random(), tests pass a number. */
  L.closeShift = function (run, shift, roll) {
    shift.over = true;
    shift.flagged = L.inspect(shift, roll == null ? Math.random() : roll);
    if (shift.stopped) { run.stoppedLine = true; run.stops++; }
    if (shift.flagged) run.flagged++;
    run.stamped += shift.stamped;
    run.missed += shift.missed;
    run.scrapped += shift.scrapped;
    run.spoiled += shift.spoiled;
    run.rejects += shift.rejects;
    run.pulled += shift.pulled;
    run.pulledSound += shift.pulledSound;
    run.looked += shift.looked;
    if (shift.trashSorted) run.binsSorted++;

    /* Pay is settled here rather than on the summary screen, so a shift
       that is never looked at is still a shift that was paid for. */
    var pay = E.payFor({
      stamped: shift.stamped,
      target: shift.cfg.target,
      rejects: shift.rejects,
      late: shift.late,
      stopped: shift.stopped
    });
    E.credit(run.ledger, pay);

    run.shiftLog.push({
      n: shift.n,
      pay: pay,
      balance: run.ledger.scrip,
      rejects: shift.rejects,
      returns: shift.returns,
      faulty: shift.faulty,
      pulled: shift.pulled,
      pulledFaulty: shift.pulledFaulty,
      pulledSound: shift.pulledSound,
      sweptByArm: shift.sweptByArm,
      autoStamped: shift.autoStamped,
      late: shift.late,
      stamped: shift.stamped,
      missed: shift.missed,
      scrapped: shift.scrapped,
      spoiled: shift.spoiled,
      flagged: shift.flagged,
      stopped: shift.stopped,
      target: shift.cfg.target,
      rating: L.rateShift(shift),
      opened: shift.opened.slice(),
      lostToInquiry: shift.lostToInquiry,
      marksPassed: shift.marksPassed,
      looked: shift.looked,
      trashSorted: shift.trashSorted,
      awareness: run.awareness,
      revealed: run.revealed,
      tier: L.awarenessTier(run)
    });
    return run;
  };

  /* What the plant got, as opposed to what it counted. This is the number
     the score screen never shows and the endings turn on. */
  L.usableOutput = function (run) { return run.stamped - run.spoiled; };

  /* ---------- how it ends ----------
     Not a score. The run is read for two things and no others: whether the
     player ever found out, and what they did on the nights after they did.
     Everything else the plant recorded — the count, the bonus, the rating
     on every sheet — has no bearing on which of these comes up, which is
     the whole argument of the piece stated as a function.

     The reveal comes out of the bin after the hooter, so the shift it
     happens on is already over and cannot be part of the answer. Only the
     shifts strictly after it count. */

  L.afterReveal = function (run) {
    if (!run || !run.revealed || run.revealedOn == null) return null;
    var rows = run.shiftLog.filter(function (s) { return s.n > run.revealedOn; });
    var demanded = 0, delivered = 0, spoiled = 0, scrapped = 0, stops = 0, flagged = 0;
    rows.forEach(function (s) {
      demanded += s.target;
      // parts that will actually do the job they were made for
      delivered += Math.max(0, s.stamped - s.spoiled);
      spoiled += s.spoiled;
      scrapped += s.scrapped;
      if (s.stopped) stops++;
      if (s.flagged) flagged++;
    });
    return {
      shifts: rows.length,
      demanded: demanded,
      delivered: delivered,
      spoiled: spoiled,
      scrapped: scrapped,
      stops: stops,
      flagged: flagged,
      /* One number: the share of what the customer asked for, after you
         knew who the customer was, that it did not get. It does not care
         how it was withheld — short-struck, scrapped, or simply worked at
         badly — because from the far end of the rail spur it is the same
         shortfall, and goal.md asks for sabotage that looks like nothing
         more than doing the job poorly. */
      withheld: demanded > 0 ? 1 - Math.min(1, delivered / demanded) : 0
    };
  };

  L.WITHHELD_HEAVY = 0.45;   // most of it never worked
  L.WITHHELD_SOME = 0.15;    // enough to have been a decision

  L.ENDINGS = ['blind', 'uneasy', 'late', 'complicit', 'partial',
               'quiet', 'caught', 'loud'];

  L.resolveEnding = function (run) {
    var after = L.afterReveal(run);
    var tier = L.awarenessTier(run);
    var id;

    if (!run.revealed) {
      /* Never found out. There are two ways not to find out and they are
         not the same: one of them noticed things and let them go. */
      id = (tier === 'none' || tier === 'trace') ? 'blind' : 'uneasy';
    } else if (!after || after.shifts === 0) {
      // found out on the last night, with nothing left to do about it
      id = 'late';
    } else if (after.stops > 0) {
      // the loud refusal takes precedence over the quiet one; it is the
      // only thing you did that anybody in the building actually saw
      id = 'loud';
    } else if (after.withheld >= L.WITHHELD_HEAVY) {
      id = after.flagged > 0 ? 'caught' : 'quiet';
    } else if (after.withheld >= L.WITHHELD_SOME) {
      id = 'partial';
    } else {
      id = 'complicit';
    }

    return {
      id: id,
      tier: tier,
      revealed: !!run.revealed,
      revealedOn: run.revealedOn,
      after: after,
      counted: run.stamped,
      usable: L.usableOutput(run),
      demanded: L.TOTAL_TARGET,
      spoiled: run.spoiled,
      scrapped: run.scrapped,
      flagged: run.flagged,
      stops: run.stops,
      looked: run.looked,
      binsSorted: run.binsSorted,
      earned: run.ledger ? run.ledger.earned : 0,
      spent: run.ledger ? run.ledger.spent : 0,
      owned: run.ledger ? run.ledger.owned.slice() : []
    };
  };

  L.isLastShift = function (n) { return n >= L.SHIFT_COUNT; };

  /* Total the plant would have expected across every shift played. */
  L.targetThrough = function (n) {
    var sum = 0;
    for (var i = 0; i < n && i < L.SHIFTS.length; i++) sum += L.SHIFTS[i].target;
    return sum;
  };

  L.TOTAL_TARGET = L.targetThrough(L.SHIFT_COUNT);

})(typeof window !== 'undefined' ? window : globalThis);
