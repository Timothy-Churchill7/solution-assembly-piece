/* ending.spec.js — what the run is read for.

   The argument of the whole piece is that the plant's numbers are not the
   measure of anything. These tests hold the endings to that: the count,
   the bonus, the rating on every sheet and the balance on the book must
   have no bearing whatever on which ending comes up. What decides it is
   whether the player found out, and what they did on the nights after. */
const { test, expect } = require('@playwright/test');
const { boot } = require('./helpers');

/* Build a run out of plain shift records, without touching a screen. */
const build = (page, spec) => page.evaluate((spec) => {
  const L = window.SOL.logic;
  const run = L.newRun();
  run.revealed = !!spec.revealed;
  run.revealedOn = spec.revealedOn == null ? null : spec.revealedOn;
  run.awareness = spec.awareness || 0;
  (spec.shifts || []).forEach((row, i) => {
    const sh = L.newShift(i + 1);
    sh.stamped = row.stamped;
    sh.rejects = row.rejects || 0;
    sh.scrapped = row.scrapped || 0;
    sh.stopped = !!row.stopped;
    L.closeShift(run, sh);
  });
  return { ending: L.resolveEnding(run), all: L.ENDINGS };
}, spec);

/* The schedule, read from the game rather than repeated here — these
   fixtures used to carry their own copy of the targets and quietly stopped
   matching the run the day one of them moved. */
let TARGETS = [];
test.beforeEach(async ({ page }) => {
  await boot(page);
  TARGETS = await page.evaluate(() => window.SOL.logic.SHIFTS.map((s) => s.target));
});

/* Six shifts of honest, competent work: every target met exactly. */
const honest = () => TARGETS.map((t) => ({ stamped: t }));

/* The same, but after shift 3 almost nothing arrives — worked slowly, and
   what did get stamped had faults in it. Deniable: every sheet is inside
   what a tired man on a bad week could produce. */
const wrecked = () => TARGETS.map((t, i) => (
  i >= 3 ? { stamped: Math.round(t * 0.75), rejects: Math.round(t * 0.7) }
    : { stamped: t }));

/* And the version nobody could read as a bad week. */
const blatant = () => TARGETS.map((t, i) => (
  i >= 3 ? { stamped: Math.round(t * 0.2) } : { stamped: t }));

test.describe('reading the run', () => {
  test('a player who never found out gets one of the two unknowing endings',
    async ({ page }) => {
      await boot(page);
      const blind = await build(page, { shifts: honest(), awareness: 0 });
      const uneasy = await build(page, { shifts: honest(), awareness: 5 });
      expect(blind.ending.id).toBe('blind');
      // suspicion without the circular is its own ending, and not the same one
      expect(uneasy.ending.id).toBe('uneasy');
      expect(uneasy.ending.tier).toBe('doubt');
      expect(blind.ending.after).toBe(null);
    });

  test('finding out on the last night is not the same as doing nothing',
    async ({ page }) => {
      await boot(page);
      const late = await build(page,
        { shifts: honest(), revealed: true, revealedOn: 6, awareness: 20 });
      const nothing = await build(page,
        { shifts: honest(), revealed: true, revealedOn: 3, awareness: 20 });
      expect(late.ending.id).toBe('late');
      expect(late.ending.after.shifts).toBe(0);
      expect(nothing.ending.id).toBe('complicit');
      expect(nothing.ending.after.shifts).toBe(3);
    });

  test('withholding most of it, deniably, is the quiet ending',
    async ({ page }) => {
      await boot(page);
      const r = await build(page,
        { shifts: wrecked(), revealed: true, revealedOn: 3, awareness: 20 });
      expect(r.ending.id).toBe('quiet');
      expect(r.ending.after.withheld).toBeGreaterThanOrEqual(0.45);
      /* Every sheet still inside what a bad week explains, so nobody came
         down to the floor — and the customer got almost none of it. */
      expect(r.ending.after.blatant).toBe(0);
      expect(r.ending.usable).toBeLessThan(r.ending.counted);
    });

  test('withholding it in a way nobody could misread is the caught ending',
    async ({ page }) => {
      await boot(page);
      const quiet = await build(page,
        { shifts: wrecked(), revealed: true, revealedOn: 3, awareness: 20 });
      const caught = await build(page,
        { shifts: blatant(), revealed: true, revealedOn: 3, awareness: 20 });
      expect(quiet.ending.id).toBe('quiet');
      expect(caught.ending.id).toBe('caught');
      // two sheets in a row that no bad week explains
      expect(caught.ending.after.blatant).toBeGreaterThanOrEqual(2);
    });

  test('walking off the line is the loud one, whatever else was done',
    async ({ page }) => {
      await boot(page);
      const shifts = wrecked();
      shifts[4].stopped = true;
      const r = await build(page,
        { shifts, revealed: true, revealedOn: 3, awareness: 20 });
      expect(r.ending.id).toBe('loud');
      expect(r.ending.after.stops).toBe(1);
    });

  /* goal.md: sabotage should come in the form of playing the game badly.
     So a run that simply produces less after the reveal must read the same
     as a run that short-strikes — the far end of the rail spur cannot tell
     the difference and neither can this. */
  test('the three levers are worth the same to the customer', async ({ page }) => {
    await boot(page);
    const spec = { revealed: true, revealedOn: 3, awareness: 20 };

    // stamped nothing at all
    const slow = await build(page, Object.assign({}, spec, {
      shifts: TARGETS.map((t, i) => (i >= 3 ? { stamped: 0 } : { stamped: t }))
    }));
    // stamped everything, and every one of them had a fault in it
    const faulty = await build(page, Object.assign({}, spec, {
      shifts: TARGETS.map((t, i) => (
        i >= 3 ? { stamped: t, rejects: t } : { stamped: t }))
    }));
    // stamped nothing, because it all went down the chute
    const chute = await build(page, Object.assign({}, spec, {
      shifts: TARGETS.map((t, i) => (
        i >= 3 ? { stamped: 0, scrapped: t } : { stamped: t }))
    }));

    /* From the far end of the rail spur these are the same shortfall: the
       customer got none of it, three different ways. That is goal.md's
       "sabotage should come in the form of playing the game badly". */
    for (const r of [slow, faulty, chute]) {
      expect(r.ending.after.withheld).toBe(1);
    }

    /* What they are not the same in is how they read on the sheet, and the
       ending is allowed to know that. An empty count and a full chute are
       both nights nobody can explain away; a full count of faulty work is
       the only way to withhold everything and still look like a good
       operator, and it is the one the plant cannot see at all. */
    expect(slow.ending.id).toBe('caught');
    expect(chute.ending.id).toBe('caught');
    expect(faulty.ending.id).toBe('quiet');
    expect(faulty.ending.counted).toBe(faulty.ending.demanded);
    expect(faulty.ending.usable).toBeLessThan(faulty.ending.counted);
    expect(faulty.ending.after.blatant).toBe(0);
  });

  test('a half-hearted refusal has its own ending', async ({ page }) => {
    await boot(page);
    const r = await build(page, {
      revealed: true, revealedOn: 3, awareness: 20,
      // one bad night out of three, which is neither one thing nor the other
      shifts: TARGETS.map((t, i) => (
        i === 4 ? { stamped: t, rejects: t } : { stamped: t }))
    });
    expect(r.ending.id).toBe('partial');
    expect(r.ending.after.withheld).toBeGreaterThan(0.15);
    expect(r.ending.after.withheld).toBeLessThan(0.45);
  });
});

test.describe('what the ending does not depend on', () => {
  /* The load-bearing claim. Two runs that differ in every number the plant
     records, and in nothing else, must end the same way. */
  test('the count, the bonus and the book decide nothing', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const L = window.SOL.logic;
      function run(stampedFor) {
        const out = L.newRun();
        out.revealed = true; out.revealedOn = 3; out.awareness = 20;
        L.SHIFTS.forEach((cfg, i) => {
          const sh = L.newShift(i + 1);
          sh.stamped = stampedFor(cfg.target, i);
          /* Faults are dialled so that both runs deliver the same share of
             what was asked for, however much each of them stamped. That is
             the point: the shortfall is held constant and every number the
             plant keeps is varied around it. */
          if (i >= 3) sh.rejects = Math.max(0, sh.stamped - Math.round(cfg.target * 0.32));
          L.closeShift(out, sh);
        });
        return out;
      }
      // the same share withheld, out of wildly different amounts of work
      const lean = run((t) => Math.round(t * 0.8));
      const heavy = run((t) => t * 2);
      // and a third that did identical work and was simply paid more
      const paid = run((t) => Math.round(t * 0.8));
      paid.ledger.earned = 9999;
      paid.ledger.spent = 4000;
      return {
        lean: L.resolveEnding(lean),
        heavy: L.resolveEnding(heavy),
        paid: L.resolveEnding(paid)
      };
    });
    // twice the parts, twice the bonuses, and the same ending
    expect(r.heavy.counted).toBeGreaterThan(r.lean.counted * 2 - 1);
    expect(r.heavy.id).toBe(r.lean.id);
    // and the balance on the book is not an input at all
    expect(r.paid.earned).toBe(9999);
    expect(r.paid.id).toBe(r.lean.id);
  });

  test('every ending is reachable, and the list is exhaustive', async ({ page }) => {
    await boot(page);
    const reached = new Set();

    const cases = [
      { shifts: honest(), awareness: 0 },
      { shifts: honest(), awareness: 9 },
      { shifts: honest(), revealed: true, revealedOn: 6, awareness: 20 },
      { shifts: honest(), revealed: true, revealedOn: 3, awareness: 20 },
      {
        revealed: true, revealedOn: 3, awareness: 20,
        shifts: TARGETS.map((t, i) => (
          i === 4 ? { stamped: t, rejects: t } : { stamped: t }))
      },
      { shifts: wrecked(), revealed: true, revealedOn: 3, awareness: 20 },
      { shifts: blatant(), revealed: true, revealedOn: 3, awareness: 20 },
      (() => { const s = wrecked(); s[4].stopped = true; return { shifts: s, revealed: true, revealedOn: 3, awareness: 20 }; })()
    ];

    let all = null;
    for (const c of cases) {
      const r = await build(page, c);
      reached.add(r.ending.id);
      all = r.all;
    }
    expect([...reached].sort()).toEqual([...all].sort());
    expect(all).toHaveLength(8);
  });

  test('every ending has copy, and none of it is a verdict', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const L = window.SOL.logic, C = window.SOL.content;
      const missing = L.ENDINGS.filter((id) => {
        const e = C.ENDINGS[id];
        return !e || !e.title || !e.body;
      });
      /* Words that would make the piece a judge. It has no standing to be
         one, and an ending that praises the player is an ending they can
         accept and put down. */
      const verdicts = /\b(brave|heroic|coward|guilty|innocent|well done|congratulations|you did the right thing|redeemed|forgiven)\b/i;
      const preachy = L.ENDINGS.filter((id) =>
        verdicts.test(C.ENDINGS[id].title + ' ' + C.ENDINGS[id].body));
      return { missing, preachy, ids: L.ENDINGS };
    });
    expect(r.missing).toEqual([]);
    expect(r.preachy).toEqual([]);
  });
});

test.describe('the run reaches an ending on its own', () => {
  test('finishing the last shift resolves one', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
      L.resetRun(g.run);
      g.run.shift = 6;
      g.go('shift');
      for (let i = 0; i < 60 * 200 && g.screen === 'shift'; i++) {
        g.tick(1 / 60);
        if (g.screen === 'shift') sc.stamp(null);
      }
      window.SOL.screens.summary.advance(g);
      // the customer closes the contract before you get to think about it
      const atLetter = g.screen;
      window.SOL.screens.letter.close_(g);
      const last = window.SOL.screens.ending;
      return {
        finished: g.run.finished,
        atLetter,
        screen: g.screen,
        shown: last.res ? last.res.id : null,
        ending: L.resolveEnding(g.run).id
      };
    });
    expect(r.finished).toBe(true);
    expect(r.atLetter).toBe('letter');
    // and then the ending, which is the part that is about you
    expect(r.screen).toBe('ending');
    // a run that never looked at anything can only end one way
    expect(r.ending).toBe('blind');
    expect(r.shown).toBe('blind');
  });
});

/* The letter closes the contract before the player is allowed to think
   about any of it. Every run reaches it, including one that investigated
   nothing — that is the whole reason it exists, and it is the only place
   in the build the thing is named in full. */
test.describe('the letter from the customer', () => {
  const letterFor = (page, stampedFor, rejectsFor) => page.evaluate(
    ({ stampedFor, rejectsFor }) => {
      const L = window.SOL.logic;
      const run = L.newRun();
      L.SHIFTS.forEach((cfg, i) => {
        const sh = L.newShift(i + 1);
        sh.stamped = Math.round(cfg.target * stampedFor);
        sh.rejects = Math.round(cfg.target * rejectsFor);
        L.closeShift(run, sh);
      });
      return { letter: L.resolveLetter(run), all: L.LETTERS };
    }, { stampedFor, rejectsFor });

  test('a run that delivered is thanked', async ({ page }) => {
    await boot(page);
    const r = await letterFor(page, 1.0, 0);
    expect(r.letter.id).toBe('commended');
    expect(r.letter.share).toBe(1);
  });

  test('a run that withheld most of it is reprimanded', async ({ page }) => {
    await boot(page);
    const r = await letterFor(page, 0.3, 0);
    expect(r.letter.id).toBe('reprimand');
    expect(r.letter.share).toBeLessThan(0.55);
  });

  /* Faults let past read the same to the office as parts never stamped,
     because the office is counting what it could fit. This is the one
     acknowledgement the piece ever offers that quiet sabotage landed —
     and it comes from the people it was done to. */
  test('letting faults through reads to them as not delivering',
    async ({ page }) => {
      await boot(page);
      const short = await letterFor(page, 0.3, 0);
      const faulty = await letterFor(page, 1.0, 0.7);
      expect(faulty.letter.id).toBe(short.letter.id);
      expect(faulty.letter.id).toBe('reprimand');
      // the plant counted a full quarter out of one of them
      expect(faulty.letter.counted).toBeGreaterThan(short.letter.counted);
      expect(faulty.letter.delivered).toBeCloseTo(short.letter.delivered, -1);
    });

  test('every letter is reachable and every one has copy', async ({ page }) => {
    await boot(page);
    const reached = new Set();
    for (const [s, j] of [[1.0, 0], [0.7, 0], [0.2, 0]]) {
      const r = await letterFor(page, s, j);
      reached.add(r.letter.id);
    }
    const r = await page.evaluate(() => {
      const L = window.SOL.logic, C = window.SOL.content;
      return {
        all: L.LETTERS,
        missing: L.LETTERS.filter((id) => {
          const l = C.LETTERS[id];
          return !l || !l.title || !l.body;
        }),
        unnamed: L.LETTERS.filter((id) =>
          !/\bThe Final Solution\b/.test(C.LETTERS[id].body)),
        signature: C.LETTER_SIGNATURE
      };
    });
    expect([...reached].sort()).toEqual([...r.all].sort());
    expect(r.missing).toEqual([]);
    /* Every one of the three names it, in the body, in those words — so no
       run finishes uncertain about what the quarter was for, whichever
       letter it earned. */
    expect(r.unnamed).toEqual([]);
    expect(r.signature).toBe('Heinrich Himmler');
  });

  test('the last summary leads to the letter, and the letter to the ending',
    async ({ page }) => {
      await boot(page);
      const r = await page.evaluate(() => {
        const g = window.SOL.game, L = window.SOL.logic;
        L.resetRun(g.run);
        const sh = L.newShift(L.SHIFT_COUNT);
        sh.stamped = 40;
        L.closeShift(g.run, sh);
        window.SOL.screens.summary.enter({}, g);
        window.SOL.screens.summary.advance(g);
        const atLetter = g.screen;
        const shown = window.SOL.screens.letter.res.id;
        window.SOL.screens.letter.close_(g);
        return { atLetter, shown, after: g.screen, finished: g.run.finished };
      });
      expect(r.atLetter).toBe('letter');
      expect(r.shown).toBeTruthy();
      expect(r.after).toBe('ending');
      expect(r.finished).toBe(true);
    });

  /* A player who never looked at anything still gets told. */
  test('a run that investigated nothing is still told what it was for',
    async ({ page }) => {
      await boot(page);
      const r = await page.evaluate(() => {
        const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
        L.resetRun(g.run);
        g.go('brief');
        let guard = 0;
        while (!g.run.finished && guard++ < 60 * 900) {
          if (g.screen === 'brief') { window.SOL.screens.brief.begin_(g); continue; }
          if (g.screen === 'summary') { window.SOL.screens.summary.advance(g); continue; }
          if (g.screen === 'officer') { window.__clearOfficer(); continue; }
          if (g.screen === 'officer') { window.__clearOfficer(); continue; }
        if (g.screen === 'stores') { window.SOL.screens.stores.leave_(g); continue; }
                    if (g.screen !== 'shift') break;
          g.tick(1 / 60);
          if (g.screen === 'shift' && sc.candidate()) sc.stamp(null);
        }
        return {
          awareness: g.run.awareness,
          revealed: g.run.revealed,
          screen: g.screen,
          letter: window.SOL.screens.letter.res.id,
          ending: L.resolveEnding(g.run).id
        };
      });
      // learned nothing the whole quarter, and is thanked for it by name of post
      expect(r.awareness).toBe(0);
      expect(r.revealed).toBe(false);
      expect(r.screen).toBe('letter');
      expect(r.letter).toBe('commended');
      expect(r.ending).toBe('blind');
    });
});
