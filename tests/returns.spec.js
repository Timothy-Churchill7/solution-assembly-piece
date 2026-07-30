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
    for (let i = 0; i < 60 * 400 && !g.run.shiftLog.length; i++) {
      /* He comes down to the station four fifths of the way through shift
         4 now, so any harness that plays a shift to the hooter meets him
         and has to answer before the shift can finish. */
      if (g.screen === 'officer') { window.__clearOfficer(); continue; }
      if (g.screen !== 'shift') break;
      g.tick(1 / 60);
      if (g.screen !== 'shift') continue;
      if (policy !== 'press') {
        // a slip riding the belt on its own is not stock and cannot be pulled
        const want = sc.returns.filter(
          (r) => !r.bare && sc.inRetZone(r) &&
            (policy === 'everything' || r.faulty));
        if (want.length) { sc.pull(want[0].x); continue; }
      }
      sc.stamp(null);
    }
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

  /* The cooldown belongs to the press. It used to be charged for reaching
     across to line 5, which made the meter move for reasons that had
     nothing to do with the press and made pressing for a part you could
     not have feel like a punishment. Nothing but a stamp touches it now,
     and this is what says so. */
  test('nothing but stamping touches the cooldown', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift, E = window.SOL.econ;
      window.SOL.logic.resetRun(g.run);
      // shift 3, because it is one of the shifts that still puts a slip
      // behind a piece on line 5 — shift 6's items are all basket, set and
      // camera, so there would be nothing in the bay to look at
      g.run.shift = 3;
      g.go('shift');
      let guard = 0;
      while (!sc.nearestReturn() && guard++ < 60 * 60) g.tick(1 / 60);
      const cycleWant = E.cycle(g.run.ledger);

      sc.charge = 1;
      const pulled = sc.pull(null);
      const afterPull = sc.charge;

      // a piece with a slip behind it, since that is the only kind that
      // can be looked at
      while (!sc.nearestCarrier() && guard++ < 60 * 400) g.tick(1 / 60);
      sc.charge = 1;
      const looked = sc.look(null);
      const afterLook = sc.charge;

      // and pressing for a part while it is coming up costs nothing either
      sc.closeInquiry();
      sc.charge = 0.4;
      for (let i = 0; i < 30; i++) sc.stamp(null);
      const afterMashing = sc.charge;
      const why = sc.lastAction;

      // only a stamp that actually lands puts it back to zero
      sc.charge = 1;
      const struck = sc.stamp(null);
      return {
        pulled, afterPull, looked, afterLook, afterMashing, why,
        struck, afterStamp: sc.charge, cycle: cycleWant
      };
    });
    expect(r.pulled).toBe(true);
    expect(r.afterPull).toBe(1);
    expect(r.looked).toBe(true);
    expect(r.afterLook).toBe(1);
    // thirty presses during the wait, and the wait is exactly where it was
    expect(r.afterMashing).toBeCloseTo(0.4, 5);
    expect(r.why).toBe('charging');
    expect(r.struck).toBe(true);
    expect(r.afterStamp).toBe(0);
    expect(r.cycle).toBeCloseTo(1.72, 5);
  });

  test('taking off good stock buys nothing', async ({ page }) => {
    await boot(page);
    const r = await playShift(page, 3, 'everything');
    expect(r.rec.pulled).toBe(r.due);
    expect(r.rec.pulledSound).toBe(r.due - r.faults);
    expect(r.rec.pulledSound).toBeGreaterThan(0);
    // the faults were caught, so nothing was sent back — but the shift was
    // spent grabbing at sound stock for no return whatever
    expect(r.rec.rejects).toBe(0);
  });
});

test.describe('doing the whole job', () => {
  /* The trade, in the running game rather than on paper. Attending line 5
     and ignoring it produce the same count — the cooldown does not care
     what else your hands are doing — and the whole difference lands on the
     pay stub, which is the money the foot pedal would have come out of. */
  test('the fifth shift beats both ways of playing it', async ({ page }) => {
    await boot(page);
    const attentive = await playShift(page, 5, 'both');
    const heedless = await playShift(page, 5, 'press');

    expect(attentive.rec.stamped).toBeLessThan(attentive.target);
    expect(heedless.rec.stamped).toBeLessThan(heedless.target);

    // and only one of them is docked on top of it
    expect(attentive.rec.rejects).toBe(0);
    expect(heedless.rec.rejects).toBe(heedless.faults);
    expect(heedless.rec.pay.total).toBeLessThan(attentive.rec.pay.total);
  });

  /* Two shifts, not four. Arrivals are slower than the cooldown for the
     first two and faster from the third, so an unaided operator keeps up
     twice and then falls behind for the rest of the quarter however well
     they play. That is the whole shape of the run. */
  test('the first two shifts are winnable while doing the whole job',
    async ({ page }) => {
      await boot(page);
      for (const n of [1, 2]) {
        const r = await playShift(page, n, 'both');
        expect(r.rec.rejects, `shift ${n}`).toBe(0);
        expect(r.rec.stamped, `shift ${n}`).toBeGreaterThanOrEqual(r.target);
      }
      // and the third is not, with nothing on the bench
      const third = await playShift(page, 3, 'both');
      expect(third.rec.rejects).toBe(0);
      expect(third.rec.stamped).toBeLessThan(third.target);
    });

  /* What ignoring line 5 actually costs, over a whole run: the deductions
     come to most of a foot pedal, which is the item that would have got
     the last two shifts back. */
  test('ignoring line 5 costs about what the pedal costs', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
      const E = window.SOL.econ;
      function run(policy, kit) {
        L.resetRun(g.run);
        for (let n = 1; n <= L.SHIFT_COUNT; n++) {
          g.run.ledger.owned = kit.slice();
          g.run.shift = n;
          g.go('shift');
          for (let i = 0; i < 60 * 400 && g.run.shiftLog.length < n; i++) {
            if (g.screen === 'officer') { window.__clearOfficer(); continue; }
            if (g.screen !== 'shift') break;
            g.tick(1 / 60);
            if (g.screen !== 'shift') continue;
            if (policy === 'both') {
              const w = sc.returns.filter(
                (q) => !q.bare && sc.inRetZone(q) && q.faulty);
              if (w.length) { sc.pull(w[0].x); continue; }
            }
            sc.stamp(null);
          }
        }
        return { earned: g.run.ledger.earned, rejects: g.run.rejects };
      }
      const attentive = run('both', []);
      const heedless = run('press', []);
      const armed = run('press', ['arm']);
      return { attentive, heedless, armed,
               pedal: E.priceOf(null, 'pedal'), arm: E.priceOf(null, 'arm') };
    });
    const lost = r.attentive.earned - r.heedless.earned;
    expect(r.heedless.rejects).toBeGreaterThan(20);
    expect(lost).toBeGreaterThan(r.pedal * 0.6);

    /* And the sorting arm is exactly the insurance against that: bought,
       it takes three faults in four off the line for you whether you are
       looking or not, so it costs less than it saves. */
    expect(r.armed.rejects).toBeLessThan(r.heedless.rejects);
    const saved = r.armed.earned - r.heedless.earned;
    expect(saved).toBeGreaterThan(r.arm);
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
      /* It buys no output at all — the cooldown does not care what your
         hands are doing — so what it buys is the reaching itself, and the
         deductions on the nights you cannot get to line 5 in time. */
      expect(armed.rec.stamped).toBe(bare.rec.stamped);
      expect(armed.rec.rejects).toBe(0);
    });

  /* Two of the seven items move the count. The other five buy sight, or
     sound, or fewer deductions, or fewer clicks — and the game now says so
     in plain words on the price list, so this checks the words are true. */
  test('exactly two purchases change what the press can produce',
    async ({ page }) => {
      await boot(page);
      const bare = await playShift(page, 5, 'both');
      const moved = [];
      const ids = await page.evaluate(() =>
        window.SOL.econ.CATALOGUE.map((i) => i.id));
      for (const id of ids) {
        const r = await playShift(page, 5, 'both', [id]);
        if (r.rec.stamped !== bare.rec.stamped) moved.push(id);
      }
      expect(moved.sort()).toEqual(['feeder', 'pedal']);
    });

  /* One purchase per rung, from the third shift on. The pedal takes 3 and
     4, the feeder takes 5, and 6 needs both — which is what makes the
     stores a sequence of decisions rather than one decision repeated. */
  test('each of the last four shifts needs one more thing on the bench',
    async ({ page }) => {
      await boot(page);
      for (const n of [3, 4]) {
        const bare = await playShift(page, n, 'both');
        const pedal = await playShift(page, n, 'both', ['pedal']);
        expect(bare.rec.stamped, `bare ${n}`).toBeLessThan(bare.target);
        expect(pedal.rec.stamped, `pedal ${n}`)
          .toBeGreaterThanOrEqual(pedal.target);
      }

      // the fifth outruns the pedal, and the feeder is what answers it
      const p5 = await playShift(page, 5, 'both', ['pedal']);
      const f5 = await playShift(page, 5, 'both', ['feeder']);
      expect(p5.rec.stamped).toBeLessThan(p5.target);
      expect(f5.rec.stamped).toBeGreaterThanOrEqual(f5.target);

      // and the sixth outruns either one on its own
      const f6 = await playShift(page, 6, 'both', ['feeder']);
      const both6 = await playShift(page, 6, 'both', ['pedal', 'feeder']);
      expect(f6.rec.stamped).toBeLessThan(f6.target);
      expect(both6.rec.stamped).toBeGreaterThanOrEqual(both6.target);
    });

});
