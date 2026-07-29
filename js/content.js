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
    "Nothing here depicts violence. There are no photographs and no " +
    "reconstructions; for six shifts the factory is a set of " +
    "shapes on a belt and a quota you are asked to meet.\n\n" +
    "The last screen is a letter from the office the parts were going to. " +
    "It carries that office's seal, it is signed by the man who ran the " +
    "programme, and it says plainly what the work was for. That is the " +
    "only place in the build with a swastika in it, the only place with a " +
    "real name in it, and the only colour in the whole piece.\n\n" +
    "All of it is deliberate. Six shifts withhold the name of the thing so " +
    "that the moment it is said carries what it should. Nothing here " +
    "celebrates or endorses any of it: the seal appears as the object of " +
    "your horror, and the letter exists to tell you what you were part of.";

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
    { k: 'SPACE, or CLICK the belt', v: 'Stamps the part in the press zone. Stamped parts are your quota; nothing else counts.' },
    { k: 'THE COOLDOWN', v: 'A stamp puts the press out for 1.7 seconds. The target rises every shift; your hands do not.' },
    { k: 'X', v: 'Takes a piece off the return line. Every faulty one you leave on costs you 3 scrip.' },
    { k: 'SPOTTING A FAULT', v: 'A faulty piece sits crooked, with a bright split across it. Every one, every time.' },
    { k: 'CLICK a piece on line 5', v: 'Looks at it. It stays on the belt. Most splits are cold white; a few run warm.' },
    { k: 'A WARM SPLIT', v: 'Those are the pieces with something on them. Nothing else is marked.' },
    { k: 'S', v: 'Scraps the part in the press zone. It counts as a miss. Available from shift 3.' },
    { k: 'ESC', v: 'Puts down whatever you are reading. Nothing stops while you read it.' }
  ];

  C.HOWTO_BUY =
    'Buy the foot pedal first. It cuts the press cooldown, and without it ' +
    'the target on the fifth shift cannot be met however well you play.';

  /* Said here, in the handbook, before any of it matters — and said again
     on the last screen by the people it mattered to. A player has to know
     that the only thing at stake is money, because otherwise they can tell
     themselves afterwards that they were afraid. */
  C.HOWTO_STAKES =
    'Nothing here is enforced by anything except your pay. A short count, a ' +
    'fault let through and good stock scrapped all cost you the bonus, and ' +
    'that is the entire consequence. Nobody comes down to the floor.';

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

       via 'part'   a faulty piece on line 5 whose split runs a tenth of
                    the way towards red instead of cold white. Free. It
                    costs the clock, and it stays on the belt either way.
       via 'radio'  the bench set, if it was bought, talking over the noise
                    while you work. Mostly adverts and weather.
       via 'dock'   the yard camera, if it was bought. Mostly an empty yard.
       via 'trash'  the basket at the station, emptied during the shift.
                    You are supposed to sort it. Nobody does.

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
      note: 'The count is taken at the end of the shift.',
      /* The only housekeeping the office ever asks for, and the reason a
         player ever clicks the bin. It is offered as two scrip and a
         favour, which is all it is until the fourth or fifth time. */
      welcome:
        "One more thing, from the foreman: the bin by your station wants " +
        "emptying before you clock off. Sort it out and there are a couple " +
        "of scrip in it for you.",
      clues: [
        {
          id: 'c1-fault', via: 'part', at: 0.26, weight: 0,
          kind: 'QUALITY NOTICE', tier: 'tip',
          source: 'Slipped under the strap of a piece coming back down line 5.',
          lines: [
            "This piece has a fault. Good catch.",
            "Keep an eye out for similar looking flaws in future to keep the " +
            "factory moving smoothly. They sit crooked in the seat and carry " +
            "a bright split corner to corner."
          ]
        },
        {
          id: 'c1-bonus', via: 'part', at: 0.62, weight: 0,
          kind: 'PAYROLL NOTICE', tier: 'tip',
          source: 'Wired to a returned piece, addressed to nobody in particular.',
          lines: [
            "Make sure you hit the quota. There is a 25 scrip bonus in it if " +
            "you make the number, and nothing at all if you are one short.",
            "It is the largest single part of a night's pay."
          ]
        },
        {
          id: 'c1-pedal', via: 'trash', at: 0, weight: 0,
          kind: 'STORES DOCKET', tier: 'tip',
          source: 'Balled up and thrown in the bin, with the sums still on it.',
          lines: [
            "The foot pedal gives the best return on investment in the stores.",
            "Without it you will not be able to hit your quota by shift 4."
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
        "work more of it.",
      note: 'Target raised. No change to the rate of pay.',
      clues: [
        {
          id: 'c2-scrap', via: 'part', at: 0.34, weight: 0,
          kind: 'QUALITY NOTICE', tier: 'tip',
          source: 'Another of the pre-printed slips, on a piece coming back.',
          lines: [
            "A missed flaw costs the company a great deal more than scrip.",
            "There is a 3 scrip penalty against your book for every one that " +
            "gets past this station and has to be pulled at the works."
          ]
        },
        {
          id: 'c2-arm', via: 'trash', at: 0, weight: 0,
          kind: 'STORES DOCKET', tier: 'tip',
          source: 'In the bin with the rest of the paper.',
          lines: [
            "The sorting arm takes three faults in four off line 5 for you, " +
            "and across a quarter it saves about what it costs.",
            "What you are really buying is not having to reach for line 5 all " +
            "night."
          ]
        },
        {
          id: 'c2-gauge', via: 'radio', at: 0.30, weight: 0,
          kind: 'ON THE BENCH SET', tier: 'tip',
          source: 'An advertisement, read at speed between the weather and the football.',
          lines: [
            "Buy Friedrich's electronics! Bench comparators, gauge blocks, " +
            "lamps for the close work.",
            "Ask at the works stores between shifts and see our exclusive " +
            "product line."
          ]
        },
        {
          id: 'c2-priority', via: 'radio', at: 0.62, weight: 1,
          kind: 'ON THE BENCH SET', tier: 'odd',
          source: 'A works notice, read out flat by somebody who has read out forty today.',
          lines: [
            "Plant 7 has been moved to the priority list. Leave is suspended " +
            "for the quarter and applications will not be considered.",
            "Then the football results, which take longer."
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
      note: 'Scrap chute live. Press S on a part in the zone.',
      clues: [
        {
          id: 'c3-reading', via: 'part', at: 0.20, weight: 0,
          kind: 'A NOTE IN THE SAME HAND', tier: 'tip',
          source: 'Folded into the seat of a piece, in a fitter\'s pencil.',
          lines: [
            "The line slows right down while you have something in your hands.",
            "Take your time over it. What it costs you is the clock, not the " +
            "parts."
          ]
        },
        {
          id: 'c3-feeder', via: 'trash', at: 0, weight: 0,
          kind: 'STORES DOCKET', tier: 'tip',
          source: 'The last of the costings, screwed up with the rest.',
          lines: [
            "The auto-feeder stamps 45% of line 4 on its own.",
            "It costs more than two shifts' pay and it is the only thing that " +
            "makes the last shift comfortable. Nobody here has ever bought " +
            "the whole list."
          ]
        },
        {
          id: 'c3-acceptance', via: 'part', at: 0.50, weight: 3,
          kind: 'INSPECTION RESULTS', tier: 'odd',
          source: 'Last week\'s figures, on a slip that should not be down here.',
          lines: [
            "Last week's inspection results: clean, efficient, and industrial.",
            "Underneath, in the same print: consignments are not purchased. " +
            "They are requisitioned, at a rate set by the office receiving " +
            "them, with no order for the works to accept or refuse.",
            "Only a government does that, and only to a supplier it does not " +
            "consider a supplier."
          ]
        },
        {
          id: 'c3-tape', via: 'trash', at: 0, weight: 2,
          kind: 'INSPECTION TAPE', tier: 'odd',
          source: 'A strip of linen tape, peeled off something and dropped in the bin.',
          lines: [
            "The split on a piece had been taped over by somebody who wanted " +
            "it to pass. This is the tape.",
            "Printed on it: an acceptance stamp, a date from the spring, a " +
            "serial, and a signature with an office after it. SS. EICKE.",
            "Nobody on this floor has ever been told who buys what we turn " +
            "out, and now there is a name on it."
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
          id: 'c4-return', via: 'part', at: 0.28, weight: 3,
          kind: 'RETURNED ASSEMBLY', tier: 'odd',
          source: 'A piece that came back down line 5 with its mating part still on it.',
          lines: [
            "Your collar, still on its shaft, and the shaft keyed to a drive " +
            "far heavier than this line was ever tooled for.",
            "This is not part of a machine tool. It is fixed plant: bolted " +
            "down somewhere and built to run continuously.",
            "The wear says months."
          ]
        },
        {
          id: 'c4-prefix', via: 'trash', at: 0, weight: 2,
          kind: 'SERIES PREFIX', tier: 'odd',
          source: 'A torn batch card, thrown out with the rest of the shift.',
          lines: [
            "The series prefix changed in the spring. The old one is in the " +
            "plant catalogue, three pages of it.",
            "The new one is not in the catalogue at all. Prefixes like that " +
            "come down from the customer, not up from us."
          ]
        },
        {
          id: 'c4-dock', via: 'dock', at: 0.36, weight: 3,
          kind: 'ON THE YARD CAMERA', tier: 'odd',
          source: 'The dock, from the bench, in the small hours of the shift.',
          lines: [
            "A lorry at the loading dock with a tarpaulin roped over the bed " +
            "and two men working the straps. No company markings on it.",
            "There is a pennant clipped to the wing — the kind only a state " +
            "vehicle carries — and the device on it stays behind a fold of " +
            "the tarpaulin the entire time it is in frame.",
            "They load it without paperwork and one of them keeps watching " +
            "the gate."
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
          id: 'c5-routing', via: 'trash', at: 0, weight: 4,
          kind: 'ROUTING SCHEDULE', tier: 'damning',
          source: 'The consolidated sheet, folded twice and dropped in with the swarf.',
          lines: [
            "Freight for the whole quarter on one page. Four destinations.",
            "Three are ordinary works, named, with towns beside them. The " +
            "fourth is a site code and a rail spur and no town at all.",
            "The fourth takes more than the other three put together."
          ]
        },
        {
          id: 'c5-handling', via: 'radio', at: 0.55, weight: 3,
          kind: 'ON THE BENCH SET', tier: 'damning',
          source: 'An open microphone somewhere in the works office, under the music.',
          lines: [
            "Consignments to the fourth destination are not to be discussed " +
            "outside the premises.",
            "It is an instruction, and from the way he says it, not the first " +
            "time he has given it.",
            "The other man says he knows. He says it in the voice of somebody " +
            "who decided a while ago not to ask."
          ]
        },
        {
          id: 'c5-tonnage', via: 'dock', at: 0.30, weight: 3,
          kind: 'ON THE YARD CAMERA', tier: 'damning',
          source: 'The weighbridge, and the docket the driver holds up to sign.',
          lines: [
            "The night's tonnage for the fourth destination, legible for a " +
            "second while he signs for it.",
            "It does not match any machine in the plant catalogue. It does not " +
            "match all of them together.",
            "Whatever it feeds, there is a great deal of it."
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
          id: 'c6-hours', via: 'part', at: 0.34, weight: 4,
          kind: 'MAINTENANCE RETURN', tier: 'damning',
          source: 'Folded into the seat of a piece, by somebody who wanted it found.',
          lines: [
            "A maintenance log for the fixed plant at the fourth destination, " +
            "and the parts consumed keeping it running.",
            "Your collars are on it by the thousand, every month since the " +
            "spring. This is where all of it has been going.",
            "The running hours never fall to zero. Not one night, not one " +
            "Sunday, in nine months."
          ]
        },
        {
          id: 'c6-withdrawal', via: 'trash', at: 0, weight: 5,
          kind: 'WITHDRAWAL ORDER', tier: 'damning',
          source: 'In the bin, torn across once, which is not how orders are destroyed.',
          lines: [
            "All quarterly records to be consolidated and the originals " +
            "destroyed.",
            "The list is attached. The routing schedule is on it. The " +
            "acceptance forms are on it. Every piece of paper that says where " +
            "any of this went is on it.",
            "Production figures are to be retained in full."
          ]
        },
        {
          /* Early in the shift, not late: the camera holds a scene for
             DOCK_WINDOW seconds and a lorry that arrives at 0.58 of a
             76-second shift is still in frame at the hooter, which means
             it can be neither found nor written off. A test checks every
             dock item now closes before the clock does. */
          id: 'c6-manifest', via: 'dock', at: 0.30, weight: 4,
          kind: 'ON THE YARD CAMERA', tier: 'damning',
          source: 'The yard at four in the morning, and the rail spur beyond it.',
          lines: [
            "Empty flat wagons coming the other way, back from the fourth " +
            "destination.",
            "Not a return load. Not scrap, not swarf, not anything at all.",
            "Whatever goes out there does not come back as anything."
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
    tier: 'reveal',
    kind: 'RIPPED HALF-SHEET',
    source: 'At the bottom of the bin, under the swarf, torn off something larger.',
    lines: [
      "Half a table from the customer's office. One row per plant, and what " +
      "each plant's quarter is assigned to. The other half is not here.",
      "FACTORY 5 — THE EASTERN FRONT.   FACTORY 6 — THE WESTERN FRONT.   " +
      "FACTORY 8 — ALGERIA.",
      "FACTORY 7, and somebody has been round it twice in pencil: THE FINAL " +
      "SOLUTION."
    ]
  };

  /* The officer's answer. It belongs to no shift and no channel that runs
     on a schedule: it exists only if the player turned down the upgrade to
     hear it, which is the one place the piece makes its own trade
     explicit. */
  C.OFFICER_CLUE = {
    id: 'c4-officer',
    via: 'officer',
    weight: 4,
    tier: 'damning',
    kind: 'WHAT HE TOLD YOU',
    source: 'Said quietly, by the door, with nobody else on the floor.',
    lines: [
      "The freight goes to a site code and a rail spur. No town beside it on " +
      "any sheet in this building.",
      "He gives you the code and the spur number and where on the map it " +
      "would be if it were on a map.",
      "He says it the way a man says a thing he has decided to stop " +
      "carrying, and then he says the offer stands until the end of the " +
      "quarter and you have had it."
    ]
  };

  C.shift = function (n) { return C.SHIFTS[Math.max(0, Math.min(C.SHIFTS.length - 1, n - 1))]; };

  C.BRIEF_HEADING = 'SHIFT ASSIGNMENT';
  C.BRIEF_BEGIN = 'TAKE THE STATION';

  /* ---------- inquiry ----------
     The only place in the build that gets colour. */

  C.INQUIRY_HEADING = 'ITEM OPENED';
  C.INQUIRY_COST = 'SHIFT SPENT READING';
  /* It used to read THE LINE DOES NOT STOP FOR THIS, which stopped being
     true the day the line started crawling while you read. The clock never
     did and never will, and that is where the cost of looking now sits. */
  C.INQUIRY_RUNNING = 'THE CLOCK DOES NOT STOP FOR THIS';
  C.INQUIRY_CLOSE_EARLY = 'PUT IT BACK';
  C.INQUIRY_CLOSE_DONE = 'RETURN TO THE PRESS';
  C.INQUIRY_UNREAD = 'PUT BACK UNREAD. IT DOES NOT COUNT AS HAVING LOOKED.';

  /* ---------- looking closely ----------
     One of the two free channels. Click any piece on line 5 and you look
     at it where it lies; it stays on the belt either way, so the reach for
     it afterwards is still yours to make. Almost none of them has anything
     on it, which is what stops looking from being a button you hold
     down. */

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
  /* The camera is bought kit and it has to earn its ninety-five scrip. It
     said nothing at all to begin with: the picture changed and a player
     working the press flat out simply never saw it, which is not subtlety,
     it is ninety-five scrip for a decoration. The monitor now says when
     there is something in it, in the plant's own grey, once. */
  C.DOCK_ALERT = 'SOMETHING IN THE YARD.';

  /* ---------- the bin by the door ----------
     Said once, on the first shift, by somebody who has worked here longer
     than you. It is not a warning and it is not a hint; it is a man saving
     you a job, and it is the reason most players will never sort it. */

  /* ---------- line 5 ----------
     The second duty. Everything here is written the way a works handbook
     would write it: a job, described flatly, with the consequence stated
     once and never repeated. */

  C.RET_LINE = 'LINE 5 · OUT TO PACKING';
  C.RET_ZONE = 'INSPECTION';
  C.PULL_HINT = 'X TAKE OFF LINE 5';
  C.SENT_BACK = 'SENT BACK';
  C.PULLED_OK = 'OFF THE LINE';
  C.PULLED_GOOD = 'THAT ONE WAS SOUND';
  C.LOOK_EMPTY = 'NOTHING IN THE BAY WITH ANYTHING ON IT.';

  /* Said once, at the start of the first shift, beside the line it is
     about. It states the job and nothing else. */
  C.LINE_FIVE = 'LINE 5 IS YOURS AS WELL.';
  C.LOOK_ROUND = 'THE PRESS WILL WAIT. IT ALWAYS DOES.';
  C.CHARGE_LABEL = 'CYCLE';

  /* ---------- the two refusals ----------
     Described the way the handbook would describe them: as machine
     adjustments. The game never says either one is brave. */

  C.STOP_LABEL = 'MASTER STOP';
  C.STOP_READY = 'STOP THE LINE';
  C.STOP_ARMED = 'AGAIN TO STOP IT';
  C.STOP_EARLY = 'THE MASTER STOP IS THE FOREMAN\u2019S.';
  C.STOP_UNREASONED = 'YOU HAVE NOTHING YOU COULD SAY IF THEY ASKED.';
  C.STOP_HINT = 'Q MASTER STOP';

  /* The one piece of advice the game gives about refusing, on the first
     brief after the circular. It replaced a control on the press that let
     a player wreck the work for free. */
  C.REFUSAL_NOTE =
    "Whatever they are building out there, they are building it out of what " +
    "leaves this station. Every part you do not stamp is one they do not " +
    "get. Every faulty piece you let go past on line 5 is one that fails " +
    "when they fit it. Every sound piece you put down the scrap chute is " +
    "one that never existed.\n\n" +
    "All three show on the sheet, and all three cost you the bonus. That is " +
    "the only thing any of it costs. There is no penalty here beyond the " +
    "money \u2014 nobody comes down to the floor, nobody is watching the press, " +
    "and nothing worse than a short pay packet has ever happened to anybody " +
    "who stood at it.";

  /* ---------- pay and the stores ----------
     The plant pays in its own scrip and sells the tools you need to go on
     being paid. The arithmetic does the work; nothing here raises its
     voice about it. */

  C.SCRIP = 'SCRIP';
  C.PAY_HEADING = 'PAY';
  C.PAY_ROWS = {
    day: 'DAY RATE',
    piece: 'PIECE',
    bonus: 'SCHEDULE BONUS',
    rejects: 'RETURNED WORK',
    late: 'LATE OFF THE FLOOR',
    bin: 'THE BASKET',
    total: 'TO YOUR BOOK'
  };

  /* Said once, on the stores screen, and never repeated. */
  C.PAY_BONUS_NOTE =
    'The bonus is paid against the sheet, not against the work. The sheet ' +
    'cannot tell the difference and neither can the office.';

  C.STORE_HEADING = 'WORKS STORES';
  C.STORE_BALANCE = 'ON YOUR BOOK';
  C.STORE_OWNED = 'ON THE BENCH';
  C.STORE_SHORT = 'SHORT';
  C.STORE_LEAVE = 'CLOCK ON';
  C.STORE_NOTE =
    'Scrip is paid against your book and spends here. It does not spend ' +
    'anywhere else.';

  C.STORE_ITEMS = {
    arm: {
      name: 'SORTING ARM',
      note: 'Takes three faults in four off line 5 for you.',
      blurb: 'It roughly pays for itself in deductions you never incur. What you actually buy is not having to reach for line 5 all night.'
    },
    lamp: {
      name: 'BENCH LAMP',
      note: 'Lights line 5. Faults become easier to see.',
      blurb: 'The split across a faulty piece is drawn brighter. It does not find them for you; it stops you squinting.'
    },
    radio: {
      name: 'BENCH RADIO',
      note: 'Plays while you work.',
      blurb: 'Weather, adverts, works notices. Two of the notices this quarter are worth hearing. It will not tell you which.'
    },
    gauge: {
      name: 'GAUGE BLOCK',
      note: 'Marks faulty pieces on line 5 outright.',
      blurb: 'Puts a small caret over anything that will not pass. You still have to take it off; you no longer have to decide.'
    },
    camera: {
      name: 'DOCK MONITOR',
      note: 'Shows the loading yard.',
      blurb: 'Mostly an empty yard. Press D to look at it properly when something is in it.'
    },
    pedal: {
      name: 'FOOT PEDAL',
      note: 'Cuts the press cooldown by 15%.',
      blurb: 'The single most useful thing on this list. Unaided, the target on the fifth shift cannot be met at all.'
    },
    feeder: {
      name: 'AUTO-FEEDER',
      note: 'Stamps 45% of line 4 on its own.',
      blurb: 'The whole answer to the press, and it costs more than two shifts of pay. It does line 4 and nothing else.'
    }
  };

  /* ---------- what the player knows ----------
     Bands, never a score. The plant keeps no column for any of this, and
     the words are flat descriptions rather than praise or reproach. */

  C.AWARENESS_HEADING = 'NOT RECORDED';
  C.AWARENESS_ROW = 'WHAT YOU HAVE SEEN';
  C.AWARENESS_LABELS = {
    none: 'NOTHING NOTED',
    trace: 'A FEW THINGS NOTED',
    doubt: 'ENOUGH TO WONDER',
    know: 'ENOUGH TO KNOW',
    sure: 'ENOUGH TO BE SURE'
  };

  /* ---------- the bin ----------
     A wire basket at the end of the bench, emptied during the shift rather
     than after it. There is no explanation attached to it any more: a man
     used to appear and tell you that sorting it was pointless because it
     all goes in the same skip, which spoiled the joke by making it. Now it
     is a basket, and what is in it is what is in it. */

  C.BIN_LABEL = 'WASTE';
  C.BIN_DONE = 'EMPTIED';
  C.BIN_HEADING = 'THE BASKET';
  C.BIN_TITLE = 'PAPER IN ONE, SWARF IN THE OTHER';
  C.BIN_SUB = 'THE LINE IS STILL RUNNING';
  C.BIN_LEAVE = 'LEAVE IT';
  C.BIN_DONE_BTN = 'BACK TO THE LINE';
  /* The basket has no keyboard shortcut, so the card lists it in the
     only terms that apply to it. */
  C.BIN_HINT = 'CLICK THE BASKET';
  C.BIN_FOOTER = 'CLICK EACH THING TO SORT IT  ·  ESC TO LEAVE IT';
  C.BIN_NOTE = 'BOTH BINS GO IN THE SAME SKIP.';

  /* Six things. The labels are flat and none of them is a hint — the one
     that matters is a warmer sheet of paper than the others, the same
     tenth of the way to red as the split on the line, and that is the
     only signal. */
  C.BIN_ITEMS = [
    { kind: 'paper', label: 'BATCH CARD' },
    { kind: 'swarf', label: 'SWARF' },
    { kind: 'paper', label: 'TORN SHEET' },
    { kind: 'swarf', label: 'TURNINGS' },
    { kind: 'paper', label: 'BALLED PAPER' },
    { kind: 'swarf', label: 'SWARF' }
  ];

  /* ---------- the officer ----------
     Once, between shifts. He is not a villain and he is not threatening
     anybody; he is a man from the works office with two things he can
     authorise and a preference about which one you take. */

  C.OFFICER_HEADING = 'BEFORE YOU CLOCK ON';
  C.OFFICER_TITLE = 'A MAN FROM THE WORKS OFFICE';
  C.OFFICER_BODY =
    "He is waiting by the gate with a folder he does not open. He says the " +
    "office is pleased with Station 4-C and that there is something they " +
    "can do for you, once, and only one of them.\n\n" +
    "They can put you on the heavier line for the rest of the quarter: more " +
    "stock across the belt, and the piece rate goes from 1 to 1.5 scrip on " +
    "every part you stamp between now and the end. Or he will answer the " +
    "question he says everybody on this floor eventually asks, and tell you " +
    "where the freight goes.\n\n" +
    "He says it plainly, without weighting it either way, and waits. He " +
    "does not come back.";
  C.OFFICER_UPGRADE = 'TAKE THE HEAVIER LINE';
  C.OFFICER_ANSWER = 'ASK HIM WHERE IT GOES';
  C.OFFICER_UPGRADE_NOTE =
    'Piece rate 1 to 1.5 scrip, and stock arrives about 15% faster, for the ' +
    'last three shifts. Worth about 60 scrip. Nothing is said about the ' +
    'customer.';
  C.OFFICER_ANSWER_NOTE =
    'He tells you where the freight goes. The line and the rate stay exactly ' +
    'as they are.';
  C.OFFICER_TAKEN = 'THE LINE WILL RUN HEAVIER FROM TONIGHT.';
  C.OFFICER_CLOSE = 'CLOCK ON';

  /* ---------- end of shift ---------- */

  C.SUMMARY_HEADING = 'END OF SHIFT';
  C.SUMMARY_ROWS = {
    stamped: 'STAMPED',
    target: 'TARGET',
    missed: 'PASSED UNFINISHED',
    scrapped: 'SCRAPPED',
    rating: 'RECORDED AS',
    lostToInquiry: 'PASSED WHILE YOU WERE READING',
    readSecs: 'SECONDS SPENT READING',
    marksPassed: 'WENT BY WITHOUT A LOOK',
    looked: 'PIECES TURNED OVER',
    usable: 'PARTS THAT WILL WORK',
    rejects: 'SENT BACK BY THE WORKS',
    pay: 'PAID TO YOUR BOOK',
    pulled: 'TAKEN OFF LINE 5',
    pulledSound: 'AND WERE SOUND',
    autoStamped: 'STAMPED BY THE FEEDER'
  };

  C.SUMMARY_CONTINUE = 'CLOCK OFF';
  C.SUMMARY_FINAL = 'END OF QUARTER';

  /* ---------- how it ends ----------
     Eight of them, and not one is a verdict. The piece has no standing to
     tell the player what they did was brave or shameful, and saying so
     would let them off: an ending that praises you is an ending you can
     accept and put down. These describe what happened, in the flattest
     voice the material will carry, and stop.

     Nothing here quotes or paraphrases the novel. */

  /* ---------- the letter ----------
     The last thing the customer's office ever sends this station, and the
     only document in the build addressed to the operator by name of post.
     It is a form letter closing out a contract — the register is a clerk
     with a quota of his own, working through a stack of these — and it
     carries one line at the foot that says what the schedule was for.

     Every run reaches it, including a run that never looked at anything.
     It thanks a player who delivered and reprimands one who did not, so a
     player who found a way to withhold work is told by the people it was
     withheld from that it registered. That is the only acknowledgement
     the piece ever offers, and it comes from the worst possible source. */

  C.LETTER_HEADING = 'ENCLOSED WITH THE FINAL PAY PACKET';
  C.LETTER_OFFICE = 'REICHSFÜHRUNG-SS · OFFICE OF PROCUREMENT · DEPARTMENT IV-B';
  C.LETTER_REF = 'CONTRACT CLOSURE · PLANT 7 · FINISHING · STATION 4-C';

  /* The signature. A real name, on the last screen, once — and it is the
     right one: the programme the letter thanks you for was his. Every
     document before this in the whole build has been unsigned, or signed
     by a department number with no department name. This is what all of
     that omission was for. */
  C.LETTER_SIGNATURE = 'Heinrich Himmler';
  C.LETTER_SIGNATORY = 'REICHSFÜHRER-SS';
  C.LETTER_CLOSE = 'PUT IT DOWN';
  C.LETTER_FIGURES = {
    demanded: 'CONTRACTED',
    delivered: 'ACCEPTED AT THE ASSEMBLY WORKS',
    share: 'AGAINST CONTRACT'
  };
  /* The line at the foot: the sort of thing that gets printed on every
     sheet an office of this kind sends out, and is therefore read by
     nobody. Everything above it is stationery too. */
  C.LETTER_FOOTER =
    'No proceedings arise from a contract closure. This office\'s interest ' +
    'in a station begins and ends with the figures on it. Records are not ' +
    'retained.';

  C.LETTERS = {
    commended: {
      title: 'CONTRACT CLOSED · SATISFACTORY',
      body:
        "The completion of the above contract is recorded, together with the " +
        "satisfactory conduct of the station named. Deliveries were received " +
        "in the quantities scheduled and within the quarter allowed.\n\n" +
        "The station is thanked for its part in the work of The Final " +
        "Solution. Not every service is a visible one. The schedule was " +
        "kept, and it was kept in part here, at this bench, by you.\n\n" +
        "No further action is required of the operator, whose name has been " +
        "entered against a satisfactory notation."
    },
    noted: {
      title: 'CONTRACT CLOSED · WITH REMARK',
      body:
        "The completion of the above contract is recorded. Deliveries fell " +
        "below the quantities scheduled, and a proportion of the work " +
        "accepted was found unserviceable on fitting.\n\n" +
        "The shortfall was made up from other suppliers and the work of The " +
        "Final Solution was not materially delayed. The station is reminded " +
        "that quantities are set centrally and are not a matter for the " +
        "floor.\n\n" +
        "The notation against the operator is amended and the bonus " +
        "adjusted. No other step is taken or contemplated."
    },
    reprimand: {
      title: 'CONTRACT CLOSED · UNSATISFACTORY',
      body:
        "The completion of the above contract is recorded, together with the " +
        "unsatisfactory conduct of the station named. A substantial part of " +
        "what was contracted was never delivered, or was delivered in a " +
        "condition that could not be fitted.\n\n" +
        "The work of The Final Solution was held up at the receiving site " +
        "while replacements were obtained. Whether this was incapacity or " +
        "something else is a question for the works and not for this " +
        "office.\n\n" +
        "The operator's notation has been altered and the quarter's bonus " +
        "is not payable."
    }
  };

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
        "stamped, checked and sent on, and will do exactly the job it was " +
        "made for.\n\n" +
        "Nobody made you. There was a schedule, and a bonus paid against the " +
        "sheet, and a stores account you were paying down. Those turn out to " +
        "have been enough."
    },
    partial: {
      title: 'SHORT, SOME NIGHTS',
      body:
        "After you knew, some of it stopped arriving. Not most of it. A slow " +
        "night here and a fault waved through there, and a number on the " +
        "sheet that held up well enough that nobody had to ask you anything.\n\n" +
        "It is not nothing. It is not much either, and you are the only " +
        "person who will ever be in a position to say which."
    },
    quiet: {
      title: 'A BAD RUN OF NIGHTS',
      body:
        "Most of what they were owed after you knew, they did not get. Parts " +
        "left on the belt, faults let through, sound stock down the chute — " +
        "and every sheet still inside the range a tired man on a bad week " +
        "could produce.\n\n" +
        "It cost you every bonus of the quarter and nobody came down to the " +
        "floor about it. There is no record anywhere that it was deliberate. " +
        "You are the only place that fact exists."
    },
    caught: {
      title: 'THEY CAME DOWN TO THE FLOOR',
      body:
        "Most of what they were owed after you knew, they did not get — and " +
        "you stopped bothering to make it look like anything else. Two sheets " +
        "in a row that no bad week explains.\n\n" +
        "Somebody came down from the office and stood at the end of the line " +
        "for a while, and then somebody spoke to you. The work went out short " +
        "regardless, which is the only part of it that mattered."
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
