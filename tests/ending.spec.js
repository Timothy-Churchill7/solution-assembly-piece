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
    sh.spoiled = row.spoiled || 0;
    sh.scrapped = row.scrapped || 0;
    sh.stopped = !!row.stopped;
    L.closeShift(run, sh, row.flag ? 0 : 1);
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

/* The same, but everything after shift 3 comes off short-struck. */
const wrecked = () => TARGETS.map((t, i) => (
  i >= 3 ? { stamped: t, spoiled: t } : { stamped: t }));

test.describe('reading the run', () => {
  test('a player who never found out gets one of the two unknowing endings',
    async ({ page }) => {
      await boot(page);
      const blind = await build(page, { shifts: honest(), awareness: 0 });
      const uneasy = await build(page, { shifts: honest(), awareness: 9 });
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

  test('short-striking everything after the reveal is the quiet ending',
    async ({ page }) => {
      await boot(page);
      const r = await build(page,
        { shifts: wrecked(), revealed: true, revealedOn: 3, awareness: 20 });
      expect(r.ending.id).toBe('quiet');
      expect(r.ending.after.withheld).toBe(1);
      /* And the plant's own record of those shifts is spotless: every target
         met, every bonus paid. That is the mechanic, stated as an assertion. */
      expect(r.ending.counted).toBe(r.ending.demanded);
    });

  test('the same run, with one part pulled for checking, ends differently',
    async ({ page }) => {
      await boot(page);
      const clean = await build(page,
        { shifts: wrecked(), revealed: true, revealedOn: 3, awareness: 20 });
      const shifts = wrecked();
      shifts[4].flag = true;
      const caught = await build(page,
        { shifts, revealed: true, revealedOn: 3, awareness: 20 });
      expect(clean.ending.id).toBe('quiet');
      expect(caught.ending.id).toBe('caught');
      expect(caught.ending.after.flagged).toBe(1);
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
  test('working badly reads the same as short-striking', async ({ page }) => {
    await boot(page);
    const struck = await build(page,
      { shifts: wrecked(), revealed: true, revealedOn: 3, awareness: 20 });
    const slow = await build(page, {
      revealed: true, revealedOn: 3, awareness: 20,
      shifts: TARGETS.map((t, i) => (
        i >= 3 ? { stamped: 0 } : { stamped: t }))
    });
    expect(slow.ending.id).toBe(struck.ending.id);
    expect(slow.ending.after.withheld).toBe(1);
  });

  test('a half-hearted refusal has its own ending', async ({ page }) => {
    await boot(page);
    const r = await build(page, {
      revealed: true, revealedOn: 3, awareness: 20,
      // one bad night out of three, which is neither one thing nor the other
      shifts: TARGETS.map((t, i) => (
        i === 4 ? { stamped: t, spoiled: t } : { stamped: t }))
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
    const spec = { revealed: true, revealedOn: 3, awareness: 20 };
    const met = await build(page, Object.assign({}, spec, {
      shifts: TARGETS.map((t) => ({ stamped: t, spoiled: t }))
    }));
    const over = await build(page, Object.assign({}, spec, {
      shifts: TARGETS.map((t) => ({ stamped: t + 16, spoiled: t + 16 }))
    }));
    expect(met.ending.id).toBe(over.ending.id);
    // and they really did differ on everything the sheet keeps
    expect(over.ending.counted).toBeGreaterThan(met.ending.counted);
    expect(over.ending.earned).toBeGreaterThan(met.ending.earned);
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
          i === 4 ? { stamped: t, spoiled: t } : { stamped: t }))
      },
      { shifts: wrecked(), revealed: true, revealedOn: 3, awareness: 20 },
      (() => { const s = wrecked(); s[4].flag = true; return { shifts: s, revealed: true, revealedOn: 3, awareness: 20 }; })(),
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
      window.__clearBin();
      window.SOL.screens.summary.advance(g);
      const last = window.SOL.screens.ending;
      return {
        finished: g.run.finished,
        screen: g.screen,
        shown: last.res ? last.res.id : null,
        ending: L.resolveEnding(g.run).id
      };
    });
    expect(r.finished).toBe(true);
    // the last summary leads to the ending, not back to the menu
    expect(r.screen).toBe('ending');
    // a run that never looked at anything can only end one way
    expect(r.ending).toBe('blind');
    expect(r.shown).toBe('blind');
  });
});
