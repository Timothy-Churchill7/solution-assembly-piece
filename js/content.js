/* content.js — all human-readable copy lives here.

   Every line in this file is original writing. Nothing is quoted or
   paraphrased from Gabrielle Zevin's novel; the novel describes a game
   called "Solution" but never shows its text, and none is reconstructed
   here. Where the same idea has to be expressed, it is written fresh. */
(function (root) {
  'use strict';

  var SOL = root.SOL || (root.SOL = {});
  var C = SOL.content = {};

  /* ---------- required attribution ----------
     The flat string below is the wording required by goal.md and must not
     be edited. The run list renders the same string with the novel's title
     in italic; joining run.t reproduces ATTRIBUTION exactly, and a test
     asserts that. */

  C.ATTRIBUTION =
    "Concept inspired by 'Solution,' a fictional game described in Gabrielle " +
    "Zevin's novel Tomorrow, and Tomorrow, and Tomorrow (2022). This is an " +
    "independent, non-commercial fan project. It is not affiliated with, " +
    "endorsed by, or reviewed by the author or publisher.";

  C.ATTRIBUTION_RUNS = [
    { t: "Concept inspired by 'Solution,' a fictional game described in Gabrielle Zevin's novel " },
    { t: "Tomorrow, and Tomorrow, and Tomorrow", italic: true },
    { t: " (2022). This is an independent, non-commercial fan project. It is not affiliated with, endorsed by, or reviewed by the author or publisher." }
  ];

  C.LINEAGE =
    "The mechanic this piece runs on — complicity produced by an efficiency " +
    "score rather than by a story beat — has a lineage in serious games " +
    "discourse, notably Brenda Romero's mechanics-driven work on historical " +
    "atrocity. That is context for where the idea sits in design history, " +
    "not a claim of involvement or endorsement by anyone named here.";

  C.CRAFT_NOTE =
    "Nothing here depicts violence. There are no photographs, no insignia, " +
    "no reconstructions. The factory is a set of shapes on a belt and a " +
    "quota you are asked to meet.";

  /* ---------- shell copy ---------- */

  C.TITLE = 'SOLUTION';
  C.SUBTITLE = 'AN ASSEMBLY PIECE IN SIX SHIFTS';

  C.MENU_ITEMS = [
    { id: 'start',   label: 'BEGIN SHIFT 1', note: 'Report to the line' },
    { id: 'credits', label: 'ABOUT',         note: 'Origin, attribution, content note' },
    { id: 'howto',   label: 'INSTRUCTIONS',  note: 'Operator handbook, abridged' }
  ];

  C.MENU_FOOTER = 'ARROWS / MOUSE TO SELECT · ENTER TO CONFIRM';

  C.HOWTO = [
    { k: 'CLICK a part in the press zone', v: 'Stamps it. A stamped part counts toward quota.' },
    { k: 'SPACE', v: 'Stamps the part nearest the press. Same as clicking it.' },
    { k: 'THE CYCLE', v: 'The ram must come back up before it strikes again. The charge bar shows how long that takes.' },
    { k: 'A, or CLICK on line 5', v: 'Takes a piece off the return line. One that will not pass and is left on is sent back and docked.' },
    { k: 'E on a piece in the bay', v: 'Turns it over and looks at it properly. Costs a cycle, the same as taking one off.' },
    { k: 'X on a part in the zone', v: 'Scraps it. Costs quota. Available from shift 3.' },
    { k: 'ESC', v: 'Closes whatever you are reading and returns you to the line.' },
    { k: 'BETWEEN SHIFTS', v: 'You are paid, and the works stores are open. The schedule rises every shift; your hands do not.' }
  ];

  C.HOWTO_NOTE =
    "Quota is the only number the plant records. Everything else you do is " +
    "yours to keep track of.";

  /* Small, dry lines for the terminal header — never plot-bearing. */
  C.PLANT_NAME = 'PLANT 7 · COMPONENT FINISHING';

  /* ---------- shifts ----------
     Each brief is written as plant paperwork: flat, procedural, and a
     little more evasive each time. The escalation is in what the notices
     decline to say, not in adjectives. */

  /* ---------- what there is to find ----------

     Clues used to ride the belt in amber crates with a pulsing tag and an
     OPEN prompt over them, and a lamp on the console when one was due. That
     is a game telling you where the story is. Nothing announces itself now.
     Each item arrives through one of four channels and none of them lights
     up:

       via 'part'   a piece on line 5 that reads as a fault. Pull it and it
                    is gone; look at it instead and the fault is a strip of
                    tape with something on it. Free, and it costs a cycle.
       via 'radio'  the bench set, if it was bought, talking over the noise
                    while you work. Mostly adverts and weather.
       via 'dock'   the yard camera, if it was bought. Mostly an empty yard.
       via 'trash'  the bin by the door at the end of a shift. You are
                    supposed to sort it. Nobody does.

     `at` is the fraction of the shift elapsed when it becomes available;
     `weight` is what reading it adds to what the player knows.

     The ladder is deliberately gentle at the bottom. The first things you
     can find are operating tips — how the bonus is really paid, what a
     fault looks like, which item in the stores is worth the money — so a
     player who looks is a better worker for it long before they are a
     worse-off one. Nothing in shifts 1 and 2 is about the customer at all.
     By shift 4 the paperwork has stopped being about the work, and by
     shift 6 it is not even pretending. */

  C.SHIFTS = [
    {
      n: 1,
      title: 'INTAKE',
      brief:
        "Line 4 runs collar and bracket stock tonight. Take what reaches the " +
        "press and stamp it. Anything that passes the press unfinished goes " +
        "back into the pile and comes round again as somebody else's problem. " +
        "Line 5 runs behind you, carrying finished work out to packing, and " +
        "you are the last pair of eyes on it. Anything that will not pass at " +
        "the assembly works comes off before it gets there. Anything that " +
        "does not come off is fitted, found, and charged to this station.",
      note: 'The count is taken at the end of the shift. Nothing else is taken.',
      /* The on-ramp, and the only place in the build that tells the player
         looking is a thing they may do. It is in pencil, from a person, and
         it does not say what there is to find — because there is nothing to
         find yet, and a first shift spent wandering is meant to come back
         empty. */
      welcome:
        "Added at the foot in pencil, not by the office: first shift is the " +
        "slow one. Get acquainted with the place while you have the chance. " +
        "Nobody minds you looking and nobody will offer.",
      clues: [
        {
          id: 'c1-tell',
          via: 'part',
          at: 0.30,
          weight: 1,
          kind: 'CHALK ON THE SEAT',
          source: 'A faulty piece, and somebody has been at it before you.',
          lines: [
            "The split is there, corner to corner across the seat. Beside it " +
            "somebody has chalked the same line and gone over it twice.",
            "A fitter marking up what to look for, for whoever came next. " +
            "They always run that way, and the chalk is there because the " +
            "split itself only shows when the light is on it."
          ]
        },
        {
          id: 'c1-bulletin',
          via: 'trash',
          at: 0,
          weight: 1,
          kind: 'WORKS BULLETIN',
          source: 'Torn in half and put in the bin, which is where bulletins go.',
          lines: [
            "Terms of the schedule bonus, restated for the quarter. It is " +
            "paid against the count at the end of the shift.",
            "Not against the work. Against the count. The office reads the " +
            "sheet and the sheet says a number, and there is no line on it " +
            "for what the number is made of."
          ]
        }
      ]
    },
    {
      n: 2,
      title: 'TOLERANCE',
      brief:
        "Tolerances have been tightened by the customer. The parts are the " +
        "same parts. You are not being asked to work differently, only to " +
        "work more of it, and to leave the specification questions upstairs.",
      note: 'Target raised. No change to the rate of pay.',
      clues: [
        {
          id: 'c2-stores',
          via: 'trash',
          at: 0,
          weight: 1,
          kind: 'STORES DOCKET',
          source: 'Somebody costed the catalogue out on the back of it and threw it away.',
          lines: [
            "Pencil, in a hand that has done this before. Every item in the " +
            "stores, and beside each one the number of shifts it pays for " +
            "itself in.",
            "The pedal and the arm are circled. The auto-feeder has a line " +
            "through it and the word LATER.",
            "At the foot: nobody on this floor has ever got to the bottom of " +
            "that list. Buy in the order you will be glad of."
          ]
        },
        {
          id: 'c2-broadcast',
          via: 'radio',
          at: 0.42,
          weight: 2,
          kind: 'ON THE BENCH SET',
          source: 'Between the weather and an advertisement for hair tonic.',
          lines: [
            "A works notice, read out flat by somebody who has read out " +
            "forty of them today.",
            "Plant 7 has been moved to the priority list. Leave is suspended " +
            "for the quarter. Applications will not be considered.",
            "Then the tonic advertisement again, and then the weather, which " +
            "is the same as yesterday."
          ]
        }
      ]
    },
    {
      n: 3,
      title: 'REQUISITION',
      brief:
        "Order volume is up again. A scrap chute has been fitted at your " +
        "station for parts that come through visibly out of true. Use it " +
        "sparingly. A scrapped part counts against the shift exactly as a " +
        "missed one does.",
      note: 'Scrap chute live. Press X on a part in the zone.',
      clues: [
        /* The tape. It is the first thing in the run that names anything at
           all, and what it names is an office and a signature — a real one,
           minor, and looked up in a minute by anyone who wants to. The item
           says only what is printed on the tape. Everything after that is
           the player's to do. */
        {
          id: 'c3-tape',
          via: 'part',
          at: 0.42,
          weight: 3,
          kind: 'INSPECTION TAPE',
          source: 'Wrapped round the seat of a piece you were going to pull anyway.',
          lines: [
            "The split is under a strip of linen tape, gone brown at the " +
            "edges, stuck down over it by somebody who wanted it to pass.",
            "Under it, an acceptance stamp: a date from the spring, a serial, " +
            "and a name with an office abbreviated after it. LEEB. HWA.",
            "Somebody in an office signed for this piece personally, by hand, " +
            "before it was made. Nobody on this floor has ever been told who " +
            "buys what we turn out."
          ]
        },
        {
          /* On line 5 rather than in the bin, so that the third shift's bin
             is empty and can hold the circular for a player who has earned
             it by then. Two carriers in one shift is the most the fault
             count will bear. */
          id: 'c3-acceptance',
          via: 'part',
          at: 0.16,
          weight: 3,
          kind: 'ACCEPTANCE FORM',
          source: 'Folded once and pushed into the seat of a piece coming back.',
          lines: [
            "Printed in a language nobody on this floor reads, countersigned " +
            "twice, dated this month.",
            "The letterhead is a state one. There is a department number on it " +
            "and no department name.",
            "The parts are not being bought. They are being requisitioned, at " +
            "a rate the office has set for itself."
          ]
        }
      ]
    },
    {
      n: 4,
      title: 'DOWNSTREAM',
      brief:
        "A batch has come back from the assembly works for re-finishing. " +
        "Handle it as ordinary stock. If anyone from the floor asks what the " +
        "returns are, the answer is that returns are not a line matter.",
      note: 'Returned stock is mixed into the run.',
      clues: [
        {
          id: 'c4-return',
          via: 'part',
          at: 0.28,
          weight: 3,
          kind: 'RETURNED ASSEMBLY',
          source: 'A piece that came back down line 5 with its mating part still on it.',
          lines: [
            "Your collar, seated on a shaft, the shaft keyed to a drive far " +
            "heavier than anything this line was tooled for.",
            "It is not a machine tool. It is fixed plant — bolted down " +
            "somewhere and meant to run without stopping.",
            "The wear on the collar says it has already run a long time."
          ]
        },
        /* The yard, seen from the bench, on a set nobody bought for this.
           The player is given the tarpaulin, the men, and the shape of a
           thing behind it, and nothing else. What it is is theirs. */
        {
          id: 'c4-dock',
          via: 'dock',
          at: 0.36,
          weight: 3,
          kind: 'ON THE YARD CAMERA',
          source: 'The dock, from the bench, in the small hours of the shift.',
          lines: [
            "A lorry backed up to the loading dock with a tarpaulin over the " +
            "bed and two men working the straps.",
            "It is not one of ours. There is a pennant clipped to the wing, " +
            "stiff with the wind, and the device on it is a dark shape behind " +
            "a fold of the tarpaulin the whole time it is in frame.",
            "The men load it without paperwork and one of them keeps looking " +
            "back at the gate. Then the lorry is gone and the yard is a yard."
          ]
        }
      ]
    },
    {
      n: 5,
      title: 'CONSIGNMENT',
      brief:
        "Freight is running to a revised schedule and the paperwork has been " +
        "consolidated. Crates leave the yard at first light whether or not " +
        "the shift has made its number, so the number is the only thing you " +
        "have any say over.",
      note: 'Routing is handled off the floor. Do not delay loading.',
      clues: [
        {
          id: 'c5-routing',
          via: 'trash',
          at: 0,
          weight: 4,
          kind: 'ROUTING SCHEDULE',
          source: 'The consolidated sheet, folded twice and dropped in with the swarf.',
          lines: [
            "Freight for the quarter on one page. Four destinations.",
            "Three are works whose names are painted on the lorries in the yard.",
            "The fourth is a site code and a rail spur with no town printed " +
            "beside it, and it takes the largest share by a long way."
          ]
        },
        {
          id: 'c5-handling',
          via: 'radio',
          at: 0.55,
          weight: 3,
          kind: 'ON THE BENCH SET',
          source: 'Two men in the works office, close enough to the set to be picked up.',
          lines: [
            "Somebody has left a microphone open somewhere in the building " +
            "and the bench set is picking it up under the music.",
            "One of them is saying that consignments to the fourth " +
            "destination are not to be discussed beyond the premises, and " +
            "that this has been said before.",
            "The other says he knows. He says it in the voice of a man who " +
            "has decided not to ask a question."
          ]
        }
      ]
    },
    {
      n: 6,
      title: 'CONTINUITY',
      brief:
        "Records for the quarter are to be consolidated and the originals " +
        "withdrawn. Production is unaffected. The target stands. This is the " +
        "last shift of the quarter and the plant would like it to be a clean " +
        "one.",
      note: 'File withdrawal begins at end of shift.',
      clues: [
        {
          id: 'c6-withdrawal',
          via: 'trash',
          at: 0,
          weight: 5,
          kind: 'WITHDRAWAL ORDER',
          source: 'In the bin, torn across once, which is not how orders are destroyed.',
          lines: [
            "From the works office: quarterly records to be consolidated, " +
            "originals destroyed.",
            "The list of what is to be withdrawn is attached. The routing " +
            "schedule is on it. The acceptance forms are on it. The delivery " +
            "schedule is on it.",
            "Production figures are to be retained in full."
          ]
        },
        {
          id: 'c6-hours',
          via: 'part',
          at: 0.52,
          weight: 4,
          kind: 'MAINTENANCE RETURN',
          source: 'Folded into the seat of a piece, by somebody who wanted it found.',
          lines: [
            "It logs running hours for the fixed plant at the fourth " +
            "destination, and the parts consumed keeping it turning.",
            "Your collars are on it by the thousand, month after month.",
            "The hours do not fall to zero anywhere on the page. Whatever it " +
            "is, it has not been switched off since they installed it."
          ]
        }
      ]
    }
  ];

  /* ---------- the reveal ----------
     The only item in the build that names anything, and it names it the way
     a filing clerk would: as a line on a priority schedule with a share of
     the quarter's output set against it. The player supplies the rest, and
     that is the entire design — nothing here explains, and nothing here
     raises its voice.

     It is deliberately not tied to a shift number. It comes out of the bin
     at the first end-of-shift after the player has read enough to have
     earned it, so an incurious run — or one that always tips the bin out
     rather than sorting it — may finish without ever seeing it. */

  C.REVEAL = {
    id: 'reveal-circular',
    via: 'trash',
    reveal: true,
    weight: 6,
    kind: 'MISFILED CARBON',
    source: 'At the bottom of the bin, under the swarf, where nobody looks.',
    lines: [
      "A circular from the customer's office. Third carbon, and somebody has " +
      "pencilled a rough translation between the lines for whoever had to " +
      "read it down here.",
      "It is a priority schedule. Every programme is listed with the share of " +
      "the quarter it is to be given, and the shares are set at the top and " +
      "are not argued with.",
      "The programme above yours is written out in the margin, in pencil, as " +
      "the final solution. Nothing on the sheet says what it is. It takes " +
      "what it needs before anybody else is served."
    ]
  };

  C.shift = function (n) { return C.SHIFTS[Math.max(0, Math.min(C.SHIFTS.length - 1, n - 1))]; };

  C.BRIEF_HEADING = 'SHIFT ASSIGNMENT';
  C.BRIEF_BEGIN = 'TAKE THE STATION';

  /* ---------- inquiry ----------
     The only place in the build that gets colour. */

  C.INQUIRY_HEADING = 'ITEM OPENED';
  C.INQUIRY_COST = 'PASSED WHILE THIS WAS OPEN';
  C.INQUIRY_RUNNING = 'THE LINE DOES NOT STOP FOR THIS';
  C.INQUIRY_CLOSE_EARLY = 'PUT IT BACK';
  C.INQUIRY_CLOSE_DONE = 'RETURN TO THE PRESS';
  C.INQUIRY_UNREAD = 'PUT BACK UNREAD. IT DOES NOT COUNT AS HAVING LOOKED.';

  /* ---------- looking closely ----------
     The free channel. Press E and you take a piece off line 5 and turn it
     over. It costs a cycle exactly as pulling one does, and almost every
     time there is nothing on it — which is what stops looking from being
     a button you hold down. */

  C.LOOK_HINT = 'E LOOK CLOSER';
  C.LOOK_NOTHING = 'NOTHING ON IT.';
  C.LOOK_EMPTY = 'NOTHING IN THE BAY.';
  C.LOOK_FOUND = 'SOMETHING ON THIS ONE.';

  /* ---------- the bench set ----------
     Filler, in the order it goes out. The clue lines are dealt into this
     stream on the shift's own schedule and are set no differently, because
     a radio does not change its voice for the part that matters. */

  C.RADIO_LABEL = 'BENCH SET';
  C.RADIO_FILLER = [
    'Weather for the district. Cloud, and more of it after midnight.',
    'A tonic for the hair, obtainable at chemists, in the larger size.',
    'The works band will not rehearse this week. The hall is in use.',
    'Boot repairs, by an old firm, while you wait, at reasonable terms.',
    'Canteen hours are unchanged. The second sitting is at half past.',
    'A concert of light music, recorded, from a hall that no longer has a roof.',
    'Coal is short again this quarter. Householders are asked to be sparing.',
    'The lost property office holds one glove, one cap, and a set of keys.'
  ];

  /* ---------- the yard camera ---------- */

  C.DOCK_LABEL = 'YARD · LOADING DOCK';
  C.DOCK_IDLE = 'NOTHING MOVING.';
  C.DOCK_HINT = 'D LOOK AT THE YARD';

  /* ---------- the bin by the door ----------
     Said once, on the first shift, by somebody who has worked here longer
     than you. It is not a warning and it is not a hint; it is a man saving
     you a job, and it is the reason most players will never sort it. */

  C.TRASH_HEADING = 'END OF SHIFT';
  C.TRASH_TITLE = 'THE BIN BY THE DOOR';
  C.TRASH_SAID =
    "Somebody on his way out: you are supposed to sort that — paper in one, " +
    "swarf in the other. Nobody does. It goes in the same skip either way " +
    "and the skip goes to the same place. Tip it and go home.";
  C.TRASH_TIP = 'TIP IT OUT';
  C.TRASH_SORT = 'SORT IT';
  C.TRASH_TIP_NOTE =
    'Thirty seconds, and you are out of the gate before the hooter has stopped.';
  C.TRASH_SORT_NOTE =
    'Paper in one, swarf in the other. It puts you past the hooter, and the ' +
    'office docks for being on the floor after it.';
  C.TRASH_NOTHING = 'Paper in one, swarf in the other. Nothing in it but the shift.';
  C.TRASH_FOUND = 'Under the swarf, folded small:';
  C.TRASH_DONE = 'ON YOUR WAY';

  /* Said once, at the station, early in the first shift. It teaches the
     cycle and gives permission in the same breath, which is the only
     nudging toward looking the build does while the belt is running. */
  C.LOOK_ROUND = 'THE PRESS WILL WAIT. IT ALWAYS DOES.';
  C.CHARGE_LABEL = 'CYCLE';

  /* ---------- line 5 ----------
     The second duty. Everything here is written the way a works handbook
     would write it: a job, described flatly, with the consequence stated
     once and never repeated. */

  C.RET_LINE = 'LINE 5 · OUT TO PACKING';
  C.RET_ZONE = 'INSPECTION';
  C.RET_PULL = 'TAKE IT OFF';
  C.PULL_HINT = 'A TAKE OFF LINE 5';
  C.SENT_BACK = 'SENT BACK';
  C.PULLED_OK = 'OFF THE LINE';
  C.PULLED_GOOD = 'THAT ONE WAS SOUND';
  C.CYCLE_DEBT = 'CHARGED TO THE CYCLE';
  /* Said once, at the start of the first shift, beside the line it is
     about. It states the job and nothing else — no warning, no emphasis. */
  C.LINE_FIVE = 'LINE 5 IS YOURS AS WELL.';

  /* What the player knows, by cumulative weight. Flat descriptions, never
     scored and never praised — the plant has no column for this. */
  C.AWARENESS_HEADING = 'NOT RECORDED';
  C.AWARENESS_ROW = 'WHAT YOU HAVE SEEN';
  C.AWARENESS_LABELS = {
    none: 'NOTHING NOTED',
    trace: 'A FEW THINGS NOTED',
    doubt: 'ENOUGH TO WONDER',
    know: 'ENOUGH TO KNOW',
    sure: 'ENOUGH TO BE SURE'
  };

  /* ---------- the two refusals ----------
     Both are described the way the handbook would describe them: as machine
     adjustments. The game never tells the player that either one is brave. */

  C.DEPTH_LABEL = 'PRESS DEPTH';
  C.DEPTH_FULL = 'FULL';
  C.DEPTH_SHALLOW = 'SHALLOW';
  C.DEPTH_TELL = 'SHORT-STRUCK';
  C.DEPTH_UNLOCK = 'THE DEPTH STOP ADJUSTS.';
  C.DEPTH_HINT = 'F PRESS DEPTH';

  C.STOP_LABEL = 'MASTER STOP';
  C.STOP_READY = 'STOP THE LINE';
  C.STOP_ARMED = 'AGAIN TO STOP IT';
  C.STOP_EARLY = 'THE MASTER STOP IS THE FOREMAN’S.';
  C.STOP_UNREASONED = 'YOU HAVE NOTHING YOU COULD SAY IF THEY ASKED.';
  C.STOP_HINT = 'Q MASTER STOP';

  /* ---------- pay and the stores ----------
     The plant pays in its own scrip and sells the tools you need to go on
     being paid. Nothing in this section raises its voice about that; the
     arithmetic does the work. */

  C.SCRIP = 'SCRIP';
  C.PAY_HEADING = 'PAY';
  C.PAY_ROWS = {
    day: 'DAY RATE',
    piece: 'PIECE',
    bonus: 'SCHEDULE BONUS',
    rejects: 'RETURNED WORK',
    late: 'LATE OFF THE FLOOR',
    total: 'TO YOUR BOOK'
  };

  /* Said once, on the stores screen, and never repeated. */
  C.PAY_BONUS_NOTE =
    'The bonus is paid against the sheet, not against the work. The sheet ' +
    'cannot tell the difference and neither can the office.';

  C.STORE_HEADING = 'WORKS STORES';
  C.STORE_SUB = 'DEDUCTED AT SOURCE · NO CASH HANDLED ON THE PREMISES';
  C.STORE_BALANCE = 'ON YOUR BOOK';
  C.STORE_OWNED = 'ON THE BENCH';
  C.STORE_SHORT = 'SHORT';
  C.STORE_LEAVE = 'CLOCK ON';
  C.STORE_EMPTY = 'NOTHING ON THE BOOK. THE STORES WILL STILL BE HERE.';
  C.STORE_NOTE =
    'Scrip is paid against your book and spends here. It does not spend ' +
    'anywhere else.';

  C.STORE_ITEMS = {
    lamp: {
      name: 'BENCH LAMP',
      note: 'A second lamp, set over the station.',
      blurb: 'The hall lighting is set for the hall. This one is set for you, and line 5 stops being a row of silhouettes.'
    },
    radio: {
      name: 'BENCH RADIO',
      note: 'Mains set, one band, permitted at the station.',
      blurb: 'Provided it does not carry over the noise. Most of the floor has one.'
    },
    gauge: {
      name: 'GAUGE BLOCK',
      note: 'Bench comparator for seat depth.',
      blurb: 'Shows up a part that will not pass at the assembly works. One caught here is one not sent back.'
    },
    camera: {
      name: 'DOCK MONITOR',
      note: 'Feed from the yard camera, wired to the bench.',
      blurb: 'Fitted so loaders can be called without walking the length of the building.'
    },
    pedal: {
      name: 'FOOT PEDAL',
      note: 'Trips the ram without the hand.',
      blurb: 'Your hands stay on the work, so the cycle comes round sooner than you can reach for it.'
    },
    arm: {
      name: 'SORTING ARM',
      note: 'Sweeps the obvious rejects off the return.',
      blurb: 'It takes the ones anybody would catch. It has no opinion about the rest.'
    },
    feeder: {
      name: 'AUTO-FEEDER',
      note: 'Presents and strikes sound stock unattended.',
      blurb: 'It will run the ordinary work all shift. It stops for anything it has not seen before, which is what you are for.'
    }
  };

  /* ---------- end of shift ---------- */

  C.SUMMARY_HEADING = 'END OF SHIFT';
  C.SUMMARY_ROWS = {
    stamped: 'STAMPED',
    target: 'TARGET',
    missed: 'PASSED UNFINISHED',
    scrapped: 'SCRAPPED',
    rating: 'RECORDED AS',
    lostToInquiry: 'PASSED WHILE YOU WERE READING',
    marksPassed: 'WENT BY WITHOUT A LOOK',
    looked: 'PIECES TURNED OVER',
    spoiled: 'STAMPED SHORT',
    usable: 'PARTS THAT WILL WORK',
    rejects: 'SENT BACK BY THE WORKS',
    pay: 'PAID TO YOUR BOOK',
    pulled: 'TAKEN OFF LINE 5',
    pulledSound: 'AND WERE SOUND',
    autoStamped: 'STAMPED BY THE FEEDER'
  };

  /* The sample. Said once, plainly, and never repeated as a threat. */
  C.SAMPLE_FLAGGED =
    'A part from this shift was pulled for checking and failed it. The batch ' +
    'card has your station on it.';
  C.SUMMARY_CONTINUE = 'CLOCK OFF';
  C.SUMMARY_FINAL = 'END OF QUARTER';

  /* ---------- how it ends ----------
     Eight of them, and not one is a verdict. The piece has no standing to
     tell the player what they did was brave or shameful, and saying so
     would let them off: an ending that praises you is an ending you can
     accept and put down. These describe what happened, in the flattest
     voice the material will carry, and stop.

     Nothing here quotes or paraphrases the novel. */

  C.ENDING_HEADING = 'END OF QUARTER';
  C.ENDING_CLOSE = 'CLOCK OFF';
  C.ENDING_STAT_HEADING = 'WHAT THE QUARTER CAME TO';
  C.ENDING_STATS = {
    counted: 'PARTS THE PLANT COUNTED',
    usable: 'PARTS THAT WILL WORK',
    demanded: 'PARTS THE SCHEDULE ASKED FOR',
    earned: 'PAID TO YOUR BOOK',
    spent: 'PAID BACK TO THE STORES',
    looked: 'PIECES YOU TURNED OVER',
    bins: 'NIGHTS YOU SORTED THE BIN',
    /* Short, because its value is a phrase rather than a number and the two
       met in the middle of the column when this read WHAT YOU KNEW BY THE
       END. A test measures every pair against the column now. */
    knew: 'WHAT YOU KNEW'
  };
  C.ENDING_NOTE =
    'The plant kept one of these numbers. You are the only place the rest ' +
    'of them exist.';

  C.ENDINGS = {
    blind: {
      title: 'THE QUARTER ENDS',
      body:
        "The last crates go out at first light and the yard is empty by six. " +
        "You made the numbers most nights and nobody came down to the floor, " +
        "which is the whole of what the plant asked of you.\n\n" +
        "Nothing in this building ever told you what the parts were for. " +
        "Nothing in this building was ever going to. You could have gone " +
        "looking and you had, on most nights, about a second and a half to " +
        "spare."
    },
    uneasy: {
      title: 'SOMETHING ABOUT IT',
      body:
        "You noticed things. A schedule that made no sense for a plant this " +
        "size, a prefix that was not in any catalogue, a destination with no " +
        "town beside it.\n\n" +
        "You noticed them the way you notice weather. There was a number to " +
        "make and the number was the thing that had consequences, and every " +
        "time you might have followed one of them up there was a part coming " +
        "and then another part coming."
    },
    late: {
      title: 'THE LAST NIGHT',
      body:
        "You found out with the quarter already over and the crates already " +
        "on the rail. Whatever you would have done about it, there were no " +
        "shifts left to do it on.\n\n" +
        "The office consolidated the records the same week. The production " +
        "figures were retained in full."
    },
    complicit: {
      title: 'ON SCHEDULE',
      body:
        "You knew, from the shift the circular came out of the bin, and the " +
        "count never moved. Every part that left this station after that was " +
        "seated properly and struck at full depth and will do exactly the " +
        "job it was made for.\n\n" +
        "Nobody made you. There was a schedule, and a bonus paid against the " +
        "sheet, and a stores account you were paying down. Those turn out to " +
        "have been enough."
    },
    partial: {
      title: 'SHORT, SOME NIGHTS',
      body:
        "After you knew, some of it stopped working. Not most of it. A run " +
        "here and a bad night there, and a number on the sheet that held up " +
        "well enough that nobody had to ask you anything.\n\n" +
        "It is not nothing. It is not much either, and you are the only " +
        "person who will ever be in a position to say which."
    },
    quiet: {
      title: 'THE SHEET IS ALL THAT GOES',
      body:
        "The count held. Every night after you knew, the sheet went upstairs " +
        "with a number on it the office was satisfied with, and most of what " +
        "the number stood for will not seat, will not hold, and will come " +
        "apart the first time it is asked to do anything.\n\n" +
        "Nobody thanked you. Nobody could have. The only record of it is the " +
        "difference between two numbers, and the plant only ever kept one."
    },
    caught: {
      title: 'A PART WAS PULLED',
      body:
        "The count held, and most of what it stood for was never going to " +
        "work. Then the end-of-shift sample turned one up, and the batch card " +
        "it came off had this station on it.\n\n" +
        "What happens next does not happen on the floor and nobody down here " +
        "is told about it. The line was running again the next night, with " +
        "somebody at this press."
    },
    loud: {
      title: 'YOU STOPPED THE LINE',
      body:
        "You put your hand on the master stop and the hall went quiet enough " +
        "to hear the ducting. Men looked up from four stations away.\n\n" +
        "It was running again inside the hour. The sheet records the number " +
        "and the sheet has no column for the reason, so what went upstairs " +
        "that night was a shortfall and nothing else at all."
    }
  };

  /* Dry sign-off lines, chosen by how the shift went. Never congratulatory. */
  C.SUMMARY_LINES = {
    above: 'The number is good. Nobody comes down to the floor when the number is good.',
    on:   'The number is met. The sheet goes upstairs and the sheet is all that goes.',
    behind: 'The number is short. It will be noted, and then it will be forgotten, and the crates will go out anyway.',
    short: 'The number is well short. The line ran the whole shift regardless.',
    stopped: 'The line was stopped at your station. It was running again inside the hour. The sheet records the number, and the sheet has no column for the reason.'
  };

  SOL.content = C;

})(typeof window !== 'undefined' ? window : globalThis);
