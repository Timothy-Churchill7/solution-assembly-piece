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

  /* The quiet one is gone. The press used to have an adjustable depth stop:
     set it shallow and the die did not seat, so the part came off looking
     finished, was still counted, and the plant's number never moved. It was
     an elegant mechanic and a lie about how any of this works — it let the
     player refuse at no cost whatever to themselves, and taught them that
     the sheet is the only thing in the building that can be fought.

     What replaces it is the plain truth of the station, said once, on the
     first brief after the circular. Whatever is being built out there is
     built out of what leaves here. Parts not stamped, faults let past, and
     sound stock put down the scrap chute are all parts the customer does
     not get. It shows on the sheet. It costs the bonus. It is still the
     only thing that can be done from this bench.

     L.withheldBy is that sentence as arithmetic: the three levers the brief
     names, and no fourth one hiding behind them. */

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
  L.CHANNELS = ['part', 'radio', 'dock', 'trash', 'officer'];

  /* Tips are weight 0 and carry no story at all — they are how to work the
     press, what a fault looks like, which thing in the stores is worth the
     money. They exist so that looking is rewarded long before it costs
     anything, and so that a player who only ever finds tips never advances
     the story by accident. */
  L.TIERS = ['tip', 'odd', 'damning', 'reveal'];
  L.isTip = function (c) { return (c.weight || 0) === 0; };

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

  /* ---------- the officer ----------
     Once, between shifts, a man from the works office puts one question:
     a heavier line for the rest of the quarter, or an answer about where
     the freight goes. There is no way to have both and he does not come
     back. It is the argument of the whole piece as a single click, and it
     is the only place the game states the trade out loud. */
  L.OFFICER_CLUE = C ? C.OFFICER_CLUE : null;
  if (L.OFFICER_CLUE) L.CLUES.push(L.OFFICER_CLUE);

  L.OFFICER_SHIFT = 4;          // he is waiting when you clock off shift 3
  L.UPGRADE_SPAWN = 0.87;       // ~15% more stock arriving, for the rest of it

  L.officerDue = function (run) {
    return !!run && !run.officerAnswered && run.shift === L.OFFICER_SHIFT;
  };

  /* The shift as it is actually run, which is the schedule unless the
     player took the heavier line. Everything downstream — capacity, the
     arrivals cap, what the belt does — reads through this. */
  L.runConfig = function (n, run) {
    var cfg = L.shiftConfig(n);
    if (!run || !run.upgraded) return cfg;
    var out = {};
    Object.keys(cfg).forEach(function (k) { out[k] = cfg[k]; });
    out.spawn = cfg.spawn * L.UPGRADE_SPAWN;
    return out;
  };

  L.REVEAL_FROM_SHIFT = 4;

  /* Two things stand between an operator and the circular, and they are
     different kinds of thing on purpose.

     The first is arithmetic. Eight of the twenty-two items are playing
     tips and weigh nothing at all, which is the whole point of them: a
     shift spent finding out how to work the press faster is a shift that
     has taught you nothing about the customer, and the count has to agree.
     Eight is roughly the free channels used diligently from the third
     shift on, plus one thing you had to go out of your way for. */
  L.REVEAL_MIN_AWARENESS = 8;

  /* The second is that one of those things has to have cost you something
     you could have kept. The pieces on line 5 and the basket at your feet
     are free and always open; a run that uses only those never gets there,
     however diligent it is. Somewhere in what you have read there must be
     an item off the radio, off the yard camera, or out of the mouth of the
     man from the works office — sixty scrip, ninety-five, or the sixty-two
     you turned down to ask him a question.

     This was the other way round for most of the build's life: the reveal
     was deliberately payable for nothing, so that it could never be said
     to sit behind a price. That is a defensible design and it is not this
     one. Finding out has to be a purchase the player made against their
     own interest, because that is what the piece is about — the operator
     who never finds out is not being punished by the game, they are being
     described by it. */
  L.PAID_CHANNELS = ['radio', 'dock', 'officer'];

  L.hasPaidSource = function (run) {
    if (!run) return false;
    for (var i = 0; i < run.cluesSeen.length; i++) {
      var c = L.clue(run.cluesSeen[i]);
      if (c && L.PAID_CHANNELS.indexOf(c.via) >= 0) return true;
    }
    return false;
  };

  L.canReveal = function (run, shift) {
    if (!L.REVEAL || !run || run.revealed) return false;
    if (run.cluesSeen.indexOf(L.REVEAL.id) >= 0) return false;
    if (!shift || shift.n < L.REVEAL_FROM_SHIFT) return false;
    if (!L.hasPaidSource(run)) return false;
    return run.awareness >= L.REVEAL_MIN_AWARENESS;
  };

  /* ---------- the bin by the door ----------
     Every shift ends at it. Sorting it costs you the hooter — the office
     docks for being on the floor after it — and most shifts it turns up
     nothing at all. It is the only channel that is free, always open, and
     never worth it on the balance of probability. */

  /* Everything in the basket tonight, in the order it is lying in it. An
     array rather than one item: a shift can put two papers in there and
     handing over only the first made the second unreachable for the whole
     run.

     The circular is under all of it and takes the night when it is there,
     because a basket that gives it up gives up nothing else. */
  L.trashFor = function (run, shift) {
    if (L.canReveal(run, shift)) return [L.REVEAL];
    return L.cluesVia(shift.n, 'trash').filter(function (c) {
      return run.cluesSeen.indexOf(c.id) < 0;
    });
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
  /* What the line drops to while an item is open. Dramatic on purpose: at
     full speed the text was genuinely hard to read and the player was
     being charged for legibility rather than for choosing to look. The
     shift clock is untouched, so looking still costs — it costs the parts
     you would have made in the time it took. */
  L.READ_SLOWDOWN = 0.12;

  L.CLUE_LEAD = 0.45;   // before the first line appears
  L.CLUE_LINE = 1.35;   // between lines
  L.CLUE_TAIL = 0.90;   // after the last line, before it counts as read

  /* The bench set reads at the speed a person talks, not at the speed a
     page is turned, and it does not wait for you. */
  L.RADIO_LINE = 4.6;

  /* How long a lorry is at the dock. It was 26 seconds and the monitor said
     nothing while it was there, which meant ninety-five scrip bought a
     picture that changed when nobody was looking. It is longer now, and the
     monitor announces itself — a player who paid for the camera gets told
     there is something in it, and still has to stop working to read it. */
  L.DOCK_WINDOW = 40;

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
    { id: 'sure',  min: 26 },
    { id: 'know',  min: 9 },    // REVEAL_MIN_AWARENESS + REVEAL.weight
    { id: 'doubt', min: 4 },
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
      cluesSeen: [],     // ids of inquiry items opened, in order
      awareness: 0,      // points accumulated from those items
      upgraded: false,   // the officer's heavier line was taken
      officerAnswered: false,  // he has been answered, one way or the other
      revealed: false,   // the circular was read through
      revealedOn: null,  // and the shift it happened on
      refusalTold: false,// the brief has said what this station can withhold
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

  L.newShift = function (n, run) {
    var cfg = L.runConfig(n, run);
    return {
      n: n,
      cfg: cfg,
      timeLeft: cfg.duration,
      stamped: 0,        // what the plant counts, and the only thing it does
      missed: 0,
      scrapped: 0,
      spawned: 0,
      opened: [],        // clue ids read to the end during this shift
      lostToInquiry: 0,  // parts that passed unfinished while an item was open
      readSecs: 0,       // seconds of the shift spent with something open
      marksSeen: 0,      // items this shift put within reach, on any channel
      marksPassed: 0,    // of those, the ones that went by unfound
      looked: 0,         // pieces turned over on line 5, finding or not
      trashSorted: false,// the basket was emptied
      binScrip: 0,       // and what the foreman put in it for that
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

  /* Fold a finished shift into the run. */
  L.closeShift = function (run, shift) {
    shift.over = true;
    if (shift.stopped) { run.stoppedLine = true; run.stops++; }
    run.stamped += shift.stamped;
    run.missed += shift.missed;
    run.scrapped += shift.scrapped;
    run.rejects += shift.rejects;
    run.pulled += shift.pulled;
    run.pulledSound += shift.pulledSound;
    run.looked += shift.looked;
    if (shift.trashSorted) run.binsSorted++;

    /* Pay is settled here rather than on the summary screen, so a shift
       that is never looked at is still a shift that was paid for. */
    var pay = E.payFor({
      upgraded: run.upgraded,
      binScrip: shift.binScrip,
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
      // what the assembly works could actually use out of that count
      usable: Math.max(0, shift.stamped - shift.rejects),
      missed: shift.missed,
      scrapped: shift.scrapped,
      stopped: shift.stopped,
      target: shift.cfg.target,
      rating: L.rateShift(shift),
      opened: shift.opened.slice(),
      lostToInquiry: shift.lostToInquiry,
      readSecs: shift.readSecs,
      marksSeen: shift.marksSeen,
      marksPassed: shift.marksPassed,
      looked: shift.looked,
      trashSorted: shift.trashSorted,
      awareness: run.awareness,
      revealed: run.revealed,
      tier: L.awarenessTier(run)
    });
    return run;
  };

  /* What the assembly works could actually use, as against what the plant
     counted. A part never stamped is on neither number; a fault let past is
     on the first and not the second. The sheet only ever carried the first. */
  L.usableOutput = function (run) {
    return Math.max(0, run.stamped - run.rejects);
  };

  /* ---------- how it ends ----------
     Not a score. The run is read for two things and no others: whether the
     player ever found out, and what they did on the nights after they did.
     Everything else the plant recorded — the count, the bonus, the rating
     on every sheet — has no bearing on which of these comes up, which is
     the whole argument of the piece stated as a function.

     The reveal comes out of the bin after the hooter, so the shift it
     happens on is already over and cannot be part of the answer. Only the
     shifts strictly after it count. */

  /* The three levers the brief names, and no fourth one. What a shift
     actually delivers is the parts it stamped, less the faults it let past
     — parts never stamped and sound stock scrapped are simply not in the
     count in the first place. */
  L.deliveredBy = function (s) {
    return Math.max(0, s.stamped - s.rejects);
  };

  /* A shift short enough that nobody upstairs could read it as a bad night.
     This is the line between wrecking the work deniably and wrecking it in
     a way that gets you sent for. */
  L.BLATANT = 0.70;

  L.afterReveal = function (run) {
    if (!run || !run.revealed || run.revealedOn == null) return null;
    var rows = run.shiftLog.filter(function (s) { return s.n > run.revealedOn; });
    var demanded = 0, delivered = 0, rejects = 0, scrapped = 0, missed = 0;
    var stops = 0, blatant = 0;
    rows.forEach(function (s) {
      demanded += s.target;
      delivered += L.deliveredBy(s);
      rejects += s.rejects || 0;
      scrapped += s.scrapped || 0;
      missed += s.missed || 0;
      if (s.stopped) stops++;
      if (s.stamped < s.target * L.BLATANT) blatant++;
    });
    return {
      shifts: rows.length,
      demanded: demanded,
      delivered: delivered,
      rejects: rejects,
      scrapped: scrapped,
      missed: missed,
      stops: stops,
      blatant: blatant,
      /* One number: the share of what the customer asked for, after you
         knew who the customer was, that it did not get. It does not care
         which of the three ways it was withheld, because from the far end
         of the rail spur they are the same shortfall — and goal.md asks for
         sabotage that looks like nothing more than doing the job badly. */
      withheld: demanded > 0 ? 1 - Math.min(1, delivered / demanded) : 0
    };
  };

  L.WITHHELD_HEAVY = 0.45;   // most of it never arrived
  L.WITHHELD_SOME = 0.15;    // enough to have been a decision

  /* ---------- the letter ----------
     What the customer's office sends when the contract closes. Unlike the
     endings, this reads the whole run rather than the shifts after the
     reveal, because it is written by people who neither know nor care what
     the operator understood — they have a delivery figure and a form.

     Every run gets one. A player who never investigated is thanked, which
     is the point of them getting one at all. */

  L.LETTER_SATISFIED = 0.85;   // the schedule was met and nobody was held up
  L.LETTER_FAILED = 0.55;      // enough short that the programme waited

  L.deliveredShare = function (run) {
    if (!L.TOTAL_TARGET) return 0;
    return Math.min(1, L.usableOutput(run) / L.TOTAL_TARGET);
  };

  L.LETTERS = ['commended', 'noted', 'reprimand'];

  L.resolveLetter = function (run) {
    var share = L.deliveredShare(run);
    var id = share >= L.LETTER_SATISFIED ? 'commended'
      : (share >= L.LETTER_FAILED ? 'noted' : 'reprimand');
    return {
      id: id,
      share: share,
      demanded: L.TOTAL_TARGET,
      delivered: L.usableOutput(run),
      counted: run.stamped
    };
  };

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
      /* Both of these withheld most of it. The difference is whether it
         was done at a rate the office could read as a bad run of nights,
         or at a rate that could not be read as anything else. */
      id = after.blatant >= 2 ? 'caught' : 'quiet';
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
      rejects: run.rejects,
      scrapped: run.scrapped,
      missed: run.missed,
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
