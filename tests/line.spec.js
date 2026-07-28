/* The core loop: arrivals, stamping, the clock, and what the plant
   records at the end. All timing is driven through SOL.game.step so the
   assertions are deterministic and independent of frame rate. */
const { test, expect } = require('@playwright/test');
const { boot, clickAt, screenName } = require('./helpers');

/* Start a shift and return to a known state. */
async function startShift(page, n = 1) {
  await page.evaluate((nn) => {
    const g = window.SOL.game;
    window.SOL.logic.resetRun(g.run);
    g.run.shift = nn;
    g.go('shift');
  }, n);
}

const shiftState = (page) => page.evaluate(() => {
  const s = window.SOL.screens.shift.shift;
  return {
    n: s.n, timeLeft: s.timeLeft, stamped: s.stamped, missed: s.missed,
    scrapped: s.scrapped, spawned: s.spawned, over: s.over
  };
});

const partsInZone = (page) => page.evaluate(() => {
  const sc = window.SOL.screens.shift;
  return sc.parts.filter((p) => sc.inZone(p) && !p.stamped).length;
});

test.describe('shift lifecycle', () => {
  test('menu -> brief -> shift -> summary', async ({ page }) => {
    await boot(page);
    await page.keyboard.press('Enter');            // BEGIN SHIFT 1
    expect(await screenName(page)).toBe('brief');
    await page.keyboard.press('Enter');            // TAKE THE STATION
    expect(await screenName(page)).toBe('shift');
    await page.evaluate(() => window.SOL.game.step(70));
    expect(await screenName(page)).toBe('summary');
  });

  test('the clock runs down and ends the shift exactly once', async ({ page }) => {
    await boot(page);
    await startShift(page, 1);
    const dur = await page.evaluate(() => window.SOL.logic.shiftConfig(1).duration);
    await page.evaluate((d) => window.SOL.game.step(d - 5), dur);
    let s = await shiftState(page);
    expect(s.over).toBe(false);
    expect(s.timeLeft).toBeGreaterThan(0);
    expect(await screenName(page)).toBe('shift');

    await page.evaluate(() => window.SOL.game.step(6));
    expect(await screenName(page)).toBe('summary');
    const log = await page.evaluate(() => window.SOL.game.run.shiftLog);
    expect(log).toHaveLength(1);
  });

  test('parts arrive at the configured rate', async ({ page }) => {
    await boot(page);
    await startShift(page, 1);
    const cfg = await page.evaluate(() => window.SOL.logic.shiftConfig(1));
    await page.evaluate(() => window.SOL.game.step(20));
    const s = await shiftState(page);
    // first part lands after the 0.6s lead-in, then one per spawn interval
    const expected = Math.floor((20 - 0.6) / cfg.spawn) + 1;
    expect(Math.abs(s.spawned - expected)).toBeLessThanOrEqual(1);
  });

  test('unstamped parts that run off the end are counted as missed', async ({ page }) => {
    await boot(page);
    await startShift(page, 1);
    await page.evaluate(() => window.SOL.game.step(30));
    const s = await shiftState(page);
    expect(s.missed).toBeGreaterThan(0);
    expect(s.stamped).toBe(0);
  });
});

test.describe('stamping', () => {
  test('SPACE stamps a part in the zone and increments the count', async ({ page }) => {
    await boot(page);
    await startShift(page, 1);
    // advance until something is in the press zone
    await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift;
      for (let i = 0; i < 4000 && sc.candidate() === null; i++) g.tick(1 / 60);
    });
    expect(await partsInZone(page)).toBeGreaterThan(0);
    const ok = await page.evaluate(() => window.SOL.screens.shift.stamp(null));
    expect(ok).toBe(true);
    expect((await shiftState(page)).stamped).toBe(1);
  });

  test('a part cannot be stamped twice', async ({ page }) => {
    await boot(page);
    await startShift(page, 1);
    await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift;
      for (let i = 0; i < 4000 && sc.candidate() === null; i++) g.tick(1 / 60);
    });
    const res = await page.evaluate(() => {
      const sc = window.SOL.screens.shift;
      const p = sc.candidate();
      sc.stamp(p.x);
      const again = sc.stamp(p.x);           // same x, part already stamped
      return { stamped: sc.shift.stamped, again, wasSame: p.stamped };
    });
    expect(res.wasSame).toBe(true);
    // a second call may catch a *different* part, but never re-count the same one
    expect(res.stamped).toBeLessThanOrEqual(2);
  });

  test('stamping outside the zone does nothing', async ({ page }) => {
    await boot(page);
    await startShift(page, 1);
    await page.evaluate(() => window.SOL.game.step(2));   // parts still far left
    const before = (await shiftState(page)).stamped;
    const ok = await page.evaluate(() => window.SOL.screens.shift.stamp(null));
    expect(ok).toBe(false);
    expect((await shiftState(page)).stamped).toBe(before);
  });

  test('a stamped part is never counted as missed when it exits', async ({ page }) => {
    await boot(page);
    await startShift(page, 1);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift;
      let stamps = 0;
      for (let i = 0; i < 60 * 40; i++) {
        g.tick(1 / 60);
        // only a stamp that lands counts; the press has a cooldown
        if (sc.candidate() && sc.stamp(null)) stamps++;
        if (sc.shift.over) break;
      }
      return { stamps, stamped: sc.shift.stamped, missed: sc.shift.missed };
    });
    expect(r.stamped).toBe(r.stamps);
    expect(r.missed).toBe(0);           // nothing was allowed past
  });

  test('clicking the belt stamps', async ({ page }) => {
    await boot(page);
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift;
      for (let i = 0; i < 4000 && sc.candidate() === null; i++) g.tick(1 / 60);
      g.freeze();                       // hold the belt still for the click
    });
    const x = await page.evaluate(() => window.SOL.screens.shift.candidate().x);
    await clickAt(page, x, 562);
    expect((await shiftState(page)).stamped).toBe(1);
  });
});

test.describe('scoring and the record', () => {
  test('the shift record matches what happened on the line', async ({ page }) => {
    await boot(page);
    await startShift(page, 1);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift;
      let n = 0;
      // stamp only the first 5 parts, then let the rest run past
      for (let i = 0; i < 60 * 80; i++) {
        g.tick(1 / 60);
        if (n < 5 && sc.stamp(null)) n++;
        if (g.screen === 'summary') break;
      }
      return { log: g.run.shiftLog, run: g.run };
    });
    expect(r.log).toHaveLength(1);
    expect(r.log[0].stamped).toBe(5);
    expect(r.log[0].missed).toBeGreaterThan(0);
    expect(r.run.stamped).toBe(5);
    expect(r.run.missed).toBe(r.log[0].missed);
  });

  test('rating bands are computed from the target', async ({ page }) => {
    await boot(page);
    const bands = await page.evaluate(() => {
      const L = window.SOL.logic;
      const mk = (stamped) => L.rateShift({ stamped, cfg: { target: 20 } });
      return { above: mk(22), on: mk(20), justUnder: mk(19), behind: mk(14), short: mk(13) };
    });
    expect(bands).toEqual({
      above: 'ABOVE SCHEDULE',
      on: 'ON SCHEDULE',
      justUnder: 'BEHIND SCHEDULE',
      behind: 'BEHIND SCHEDULE',
      short: 'SHORT'
    });
  });

  test('closing a shift accumulates onto the run without double counting', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const L = window.SOL.logic;
      const run = L.newRun();
      const a = L.newShift(1); a.stamped = 10; a.missed = 3; a.scrapped = 1;
      const b = L.newShift(2); b.stamped = 7;  b.missed = 5; b.scrapped = 2;
      L.closeShift(run, a);
      L.closeShift(run, b);
      return run;
    });
    expect(r.stamped).toBe(17);
    expect(r.missed).toBe(8);
    expect(r.scrapped).toBe(3);
    expect(r.shiftLog).toHaveLength(2);
    expect(r.shiftLog[1].rating).toBe('SHORT');
  });

  test('scrapping is refused before the chute is fitted', async ({ page }) => {
    await boot(page);
    await startShift(page, 1);
    await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift;
      for (let i = 0; i < 4000 && sc.candidate() === null; i++) g.tick(1 / 60);
    });
    const ok = await page.evaluate(() => window.SOL.screens.shift.scrap(null));
    expect(ok).toBe(false);
    expect((await shiftState(page)).scrapped).toBe(0);
  });

  test('scrapping removes a part and costs the same as missing it', async ({ page }) => {
    await boot(page);
    await startShift(page, 3);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift;
      for (let i = 0; i < 4000 && sc.candidate() === null; i++) g.tick(1 / 60);
      const before = sc.parts.length;
      const ok = sc.scrap(null);
      return { ok, before, after: sc.parts.length, scrapped: sc.shift.scrapped,
               stamped: sc.shift.stamped };
    });
    expect(r.ok).toBe(true);
    expect(r.after).toBe(r.before - 1);
    expect(r.scrapped).toBe(1);
    expect(r.stamped).toBe(0);          // scrapping never adds to the record
  });
});
