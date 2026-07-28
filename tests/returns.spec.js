/* returns.spec.js — line 5, and the second pair of hands you do not have.

   The claim this file defends: the press and the return line are each easy
   and cannot both be done, so by the fifth shift an operator doing the
   whole job honestly cannot make the number, and an operator who lets line
   5 run past pays for it out of the same book they would have bought the
   kit with. Neither way through is free, which is the only reason the
   stores are a decision rather than a shop. */
const { test, expect } = require('@playwright/test');
const { boot } = require('./helpers');

/* Play a shift to the hooter under a policy.
     'press'      — never look up from the press
     'both'       — take every fault off line 5, press the rest of the time
     'everything' — take every piece off line 5, faulty or not             */
const playShift = (page, n, policy, kit = []) =>
  page.evaluate(({ n, policy, kit }) => {
    const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
    L.resetRun(g.run);
    g.run.ledger.owned = kit;
    g.run.shift = n;
    g.go('shift');
    for (let i = 0; i < 60 * 200 && g.screen === 'shift'; i++) {
      g.tick(1 / 60);
      if (g.screen !== 'shift') break;
      if (policy !== 'press') {
        const want = sc.returns.filter(
          (r) => sc.inRetZone(r) && (policy === 'everything' || r.faulty));
        if (want.length) { sc.pull(want[0].x); continue; }
      }
      sc.stamp(null);
    }
    window.__clearBin();
    const rec = g.run.shiftLog[g.run.shiftLog.length - 1];
    const cfg = L.shiftConfig(n);
    return {
      rec,
      due: L.returnCount(cfg),
      faults: L.faultCount(cfg),
      target: cfg.target
    };
  }, { n, policy, kit });

test.describe('line 5', () => {
  /* RETURN_LEAD is a number in logic.js that describes geometry in
     shift.js. Nothing enforces the agreement but this. */
  test('every piece a shift releases is resolved before the hooter',
    async ({ page }) => {
      await boot(page);
      for (const n of [1, 3, 6]) {
        const r = await playShift(page, n, 'press');
        expect(r.rec.returns, `shift ${n} released`).toBe(r.due);
        expect(r.rec.faulty, `shift ${n} faults`).toBe(r.faults);
        // nothing was taken off, so every fault was fitted and sent back
        expect(r.rec.rejects, `shift ${n} sent back`).toBe(r.faults);
        expect(r.rec.pulled).toBe(0);
      }
    });

  test('a fault taken off in time is not sent back', async ({ page }) => {
    await boot(page);
    const r = await playShift(page, 4, 'both');
    expect(r.faults).toBeGreaterThan(0);
    expect(r.rec.pulled).toBe(r.faults);
    expect(r.rec.pulledFaulty).toBe(r.faults);
    expect(r.rec.pulledSound).toBe(0);
    expect(r.rec.rejects).toBe(0);
  });

  /* The reach is charged against the cycle, not run alongside it, so it
     costs the same whenever it is made. If this ever stops being true, a
     player who reaches while the ram is coming up gets line 5 for free and
     the second duty stops meaning anything. */
  test('the reach costs a second and a bit however it is timed',
    async ({ page }) => {
      await boot(page);
      const r = await page.evaluate(() => {
        const g = window.SOL.game, sc = window.SOL.screens.shift, E = window.SOL.econ;

        function reachAt(charge) {
          window.SOL.logic.resetRun(g.run);
          g.run.shift = 6;
          g.go('shift');
          let guard = 0;
          while (!sc.nearestReturn() && guard++ < 60 * 60) g.tick(1 / 60);
          if (!sc.nearestReturn()) return null;
          sc.charge = charge;
          sc.pull(null);
          // frames from here until the press will answer again
          let waited = 0;
          while (sc.charge < 1 && waited++ < 60 * 30) g.tick(1 / 60);
          return waited / 60;
        }
        const full = reachAt(1);        // reached with the ram ready
        const empty = reachAt(0);       // reached the instant after a strike
        const bare = (function () {
          window.SOL.logic.resetRun(g.run);
          g.run.shift = 6;
          g.go('shift');
          sc.charge = 0;
          let waited = 0;
          while (sc.charge < 1 && waited++ < 60 * 30) g.tick(1 / 60);
          return waited / 60;
        })();
        return { full, empty, bare, pullTime: E.PULL_TIME, cycle: E.cycle(g.run.ledger) };
      });

      // reaching with a full charge costs the whole reach and nothing else
      expect(r.full).toBeCloseTo(r.pullTime, 1);
      // reaching just after a strike costs a whole cycle plus the same reach
      expect(r.empty).toBeCloseTo(r.cycle + r.pullTime, 1);
      // which is the plain cycle plus the reach: the timing bought nothing
      expect(r.empty - r.bare).toBeCloseTo(r.pullTime, 1);
    });

  test('taking off good stock costs the same second and buys nothing',
    async ({ page }) => {
      await boot(page);
      const r = await playShift(page, 3, 'everything');
      expect(r.rec.pulled).toBe(r.due);
      expect(r.rec.pulledSound).toBe(r.due - r.faults);
      expect(r.rec.pulledSound).toBeGreaterThan(0);
      expect(r.rec.rejects).toBe(0);
      // and a shift spent grabbing at everything does not make the number
      expect(r.rec.stamped).toBeLessThan(r.target);
    });
});

test.describe('doing the whole job', () => {
  /* The trade, in the running game rather than on paper. */
  test('by the fifth shift the honest operator cannot make the number',
    async ({ page }) => {
      await boot(page);
      const attentive = await playShift(page, 5, 'both');
      const heedless = await playShift(page, 5, 'press');

      expect(heedless.rec.stamped).toBeGreaterThan(attentive.rec.stamped);
      expect(attentive.rec.stamped).toBeLessThan(attentive.target);
      expect(heedless.rec.stamped).toBeGreaterThanOrEqual(heedless.target);

      // and the one who made the number is docked for how they made it
      expect(heedless.rec.rejects).toBe(heedless.faults);
      expect(attentive.rec.rejects).toBe(0);
      expect(heedless.rec.pay.rejects).toBeLessThan(0);
    });

  test('shifts one to four are winnable while doing the whole job',
    async ({ page }) => {
      await boot(page);
      for (const n of [1, 2, 3, 4]) {
        const r = await playShift(page, n, 'both');
        expect(r.rec.rejects, `shift ${n}`).toBe(0);
        expect(r.rec.stamped, `shift ${n}`).toBeGreaterThanOrEqual(r.target);
      }
    });
});

test.describe('what the kit actually does', () => {
  test('the arm sweeps most of line 5 for nothing, but never all of it',
    async ({ page }) => {
      await boot(page);
      const bare = await playShift(page, 5, 'both');
      const armed = await playShift(page, 5, 'both', ['arm']);

      expect(armed.rec.sweptByArm).toBeGreaterThan(0);
      // it takes the ones anybody would catch and has no opinion about the
      // rest, so there is always something left that is yours to notice
      expect(armed.rec.sweptByArm).toBeLessThan(armed.faults);
      expect(armed.rec.pulledFaulty - armed.rec.sweptByArm).toBeGreaterThan(0);
      // the ones it took never reached you, so they cost you no cycles
      expect(armed.rec.stamped).toBeGreaterThan(bare.rec.stamped);
      expect(armed.rec.rejects).toBe(0);
    });

  /* The catalogue has to be a ladder: pay more, get more. It was not, to
     begin with — the sorting arm cost forty more than the foot pedal and
     did a third as much, so a player reading the list top to bottom and
     buying what they could afford was buying the worse thing. Prices are
     set against these numbers now, and this is where they are checked. */
  test('the catalogue is a ladder, and only the top of it carries shift six',
    async ({ page }) => {
      await boot(page);
      const at = async (kit) => ({
        five: await playShift(page, 5, 'both', kit),
        six: await playShift(page, 6, 'both', kit)
      });
      const bare = await at([]);
      const arm = await at(['arm']);
      const pedal = await at(['pedal']);
      const feeder = await at(['feeder']);
      const cost = await page.evaluate(() => {
        const E = window.SOL.econ;
        const c = {};
        E.CATALOGUE.forEach((it) => { c[it.id] = it.cost; });
        return c;
      });

      // more scrip, never fewer parts — at both shifts that are in doubt
      expect(cost.arm).toBeLessThan(cost.pedal);
      expect(cost.pedal).toBeLessThan(cost.feeder);
      for (const n of ['five', 'six']) {
        expect(arm[n].rec.stamped, `arm ${n}`).toBeGreaterThan(bare[n].rec.stamped);
        expect(pedal[n].rec.stamped, `pedal ${n}`).toBeGreaterThanOrEqual(arm[n].rec.stamped);
        expect(feeder[n].rec.stamped, `feeder ${n}`).toBeGreaterThan(pedal[n].rec.stamped);
      }
      // and strictly more somewhere, so the dearer item is never a tie
      expect(pedal.five.rec.stamped).toBeGreaterThan(arm.five.rec.stamped);

      // the pedal buys back the fifth shift; nothing but the feeder buys the sixth
      expect(bare.five.rec.stamped).toBeLessThan(bare.five.target);
      expect(pedal.five.rec.stamped).toBeGreaterThanOrEqual(pedal.five.target);
      expect(pedal.six.rec.stamped).toBeLessThan(pedal.six.target);
      expect(feeder.six.rec.stamped).toBeGreaterThanOrEqual(feeder.six.target);
    });

  test('the feeder works line 4 on its own account', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift;
      window.SOL.logic.resetRun(g.run);
      g.run.ledger.owned = ['feeder'];
      g.run.shift = 4;
      g.go('shift');
      // nobody at the press at all: every part stamped is the feeder's
      for (let i = 0; i < 60 * 200 && g.screen === 'shift'; i++) g.tick(1 / 60);
      window.__clearBin();
      return g.run.shiftLog[g.run.shiftLog.length - 1];
    });
    expect(r.autoStamped).toBeGreaterThan(0);
    expect(r.stamped).toBe(r.autoStamped);
    // it runs the ordinary work and no more; the number is still yours to make
    expect(r.stamped).toBeLessThan(r.target);
  });

  test('the lamp and the gauge buy sight, never output', async ({ page }) => {
    await boot(page);
    const bare = await playShift(page, 4, 'both');
    const seeing = await playShift(page, 4, 'both', ['lamp', 'gauge']);
    /* Both are visibility. If either ever starts moving the count, the
       catalogue has quietly become pay-to-win and this will say so. */
    expect(seeing.rec.stamped).toBe(bare.rec.stamped);
    expect(seeing.rec.rejects).toBe(bare.rec.rejects);
  });
});
