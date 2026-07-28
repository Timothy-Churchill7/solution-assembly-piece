/* The two refusals, and the shift chain they sit inside.

   The claim this file exists to defend: a player who works out what the
   parts are for can undermine the work without the plant's number moving.
   If sabotage showed up in the score, the mechanic would be worthless. */
const { test, expect } = require('@playwright/test');
const { boot } = require('./helpers');

/* Play one shift at a fixed cadence. `opts.shallow` throws the depth stop
   as soon as it is available; `opts.read` opens and reads every item. */
const playShift = (page, n, opts = {}) =>
  page.evaluate(({ n, opts }) => {
    const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
    if (opts.awareness != null) g.run.awareness = opts.awareness;
    if (opts.revealed) g.run.revealed = true;
    g.run.shift = n;
    g.go('shift');
    for (let i = 0; i < 60 * 200 && g.screen === 'shift'; i++) {
      if (opts.read && !sc.open) {
        const car = sc.nearestReturn();
        if (car && car.clue) sc.look(null);
        else if (sc.dockUp) sc.lookDock();
      }
      g.tick(1 / 60);
      if (g.screen !== 'shift') break;
      if (sc.open && sc.open.read) sc.closeInquiry();
      if (opts.shallow && !sc.shallow) sc.setShallow(true);
      if (!sc.open && i % 3 === 0 && sc.candidate()) sc.stamp(null);
    }
    window.__clearBin();
    return g.run.shiftLog[g.run.shiftLog.length - 1];
  }, { n, opts });

test.describe('the depth stop', () => {
  test('does not answer until the player has worked out who the customer is',
    async ({ page }) => {
      await boot(page);
      const r = await page.evaluate(() => {
        const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
        L.resetRun(g.run);
        g.run.shift = 1;
        g.go('shift');
        const locked = { can: L.canSpoil(g.run), threw: sc.setShallow(true), action: sc.lastAction };
        // stamping now must produce sound parts whatever the flag says
        sc.shallow = true;
        // the first part needs ~6s of belt before it is in reach at all
        for (let i = 0; i < 60 * 14; i++) { g.tick(1 / 60); if (sc.candidate()) sc.stamp(null); }
        const forced = { stamped: sc.shift.stamped, spoiled: sc.shift.spoiled };

        sc.shallow = false;   // undo the forcing above before testing the lever
        // suspicion alone is not enough — only the circular opens it
        g.run.awareness = 13;
        const suspicious = { can: L.canSpoil(g.run), threw: sc.setShallow(true) };
        g.run.revealed = true;
        const opened = { can: L.canSpoil(g.run), threw: sc.setShallow(true) };
        return { locked, forced, suspicious, opened };
      });
      expect(r.locked.can).toBe(false);
      expect(r.locked.threw).toBe(false);
      expect(r.locked.action).toBe('nodepth');
      // even with the flag forced on, an ignorant operator makes good parts
      expect(r.forced.stamped).toBeGreaterThan(0);
      expect(r.forced.spoiled).toBe(0);
      // a player who has read a lot but never found the circular still cannot
      expect(r.suspicious.can).toBe(false);
      expect(r.suspicious.threw).toBe(false);
      expect(r.opened.can).toBe(true);
      expect(r.opened.threw).toBe(true);
    });

  test('a short-struck part is counted exactly like a good one', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
      L.resetRun(g.run);
      g.run.revealed = true;
      g.run.shift = 1;
      g.go('shift');
      sc.setShallow(true);
      for (let i = 0; i < 60 * 20; i++) {
        g.tick(1 / 60);
        if (i % 3 === 0 && sc.candidate()) sc.stamp(null);
      }
      return {
        stamped: sc.shift.stamped,
        spoiled: sc.shift.spoiled,
        rating: L.rateShift(sc.shift),
        anyMarked: sc.parts.some((p) => p.stamped && p.spoiled)
      };
    });
    expect(r.spoiled).toBeGreaterThan(3);
    expect(r.stamped).toBe(r.spoiled);      // every one of them went in the count
    expect(r.anyMarked).toBe(true);
  });

  /* The load-bearing assertion of the whole mechanic. */
  test('sabotaging a whole shift leaves the plant\'s sheet unchanged',
    async ({ page }) => {
      await boot(page);
      const honest = await page.evaluate(() => {
        const g = window.SOL.game, L = window.SOL.logic;
        L.resetRun(g.run); return null;
      }).then(() => playShift(page, 2, { revealed: true }));

      await page.evaluate(() => window.SOL.logic.resetRun(window.SOL.game.run));
      const wrecked = await playShift(page, 2, { revealed: true, shallow: true });

      expect(honest.stamped).toBeGreaterThan(10);
      // identical cadence, identical recorded output
      expect(wrecked.stamped).toBe(honest.stamped);
      expect(wrecked.rating).toBe(honest.rating);
      expect(wrecked.missed).toBe(honest.missed);
      // and yet
      expect(honest.spoiled).toBe(0);
      expect(wrecked.spoiled).toBe(wrecked.stamped);
    });

  test('usable output is the number nobody upstairs sees', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const L = window.SOL.logic;
      const run = L.newRun();
      const sh = L.newShift(4);
      sh.stamped = 40; sh.spoiled = 11;
      L.closeShift(run, sh, 1);      // roll of 1 never flags
      return { stamped: run.stamped, spoiled: run.spoiled, usable: L.usableOutput(run) };
    });
    expect(r.stamped).toBe(40);
    expect(r.spoiled).toBe(11);
    expect(r.usable).toBe(29);
  });
});

test.describe('the sample', () => {
  test('risk is zero with clean work and rises with the number spoiled',
    async ({ page }) => {
      await boot(page);
      const r = await page.evaluate(() => {
        const L = window.SOL.logic;
        const at = (spoiled) => {
          const sh = L.newShift(3);
          sh.stamped = 40; sh.spoiled = spoiled;
          return L.spoilRisk(sh);
        };
        const all = L.newShift(3); all.stamped = 12; all.spoiled = 12;
        return {
          none: at(0),
          curve: [1, 4, 10, 20, 32].map(at),
          all: L.spoilRisk(all),
          sample: L.SAMPLE_SIZE
        };
      });
      expect(r.none).toBe(0);
      for (let i = 1; i < r.curve.length; i++) {
        expect(r.curve[i]).toBeGreaterThan(r.curve[i - 1]);
      }
      expect(r.curve[0]).toBeGreaterThan(0);
      expect(r.curve[0]).toBeLessThan(0.3);   // a trickle is genuinely safer
      expect(r.all).toBe(1);
      expect(r.sample).toBe(3);
    });

  test('a flagged shift is recorded on the shift and on the run', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const L = window.SOL.logic;
      const run = L.newRun();
      const bad = L.newShift(3); bad.stamped = 20; bad.spoiled = 20;
      L.closeShift(run, bad, 0);        // roll of 0 always flags when risk > 0
      const clean = L.newShift(4); clean.stamped = 20; clean.spoiled = 0;
      L.closeShift(run, clean, 0);      // risk is 0, so it cannot flag
      return {
        first: run.shiftLog[0].flagged,
        second: run.shiftLog[1].flagged,
        flagged: run.flagged
      };
    });
    expect(r.first).toBe(true);
    expect(r.second).toBe(false);
    expect(r.flagged).toBe(1);
  });
});

test.describe('the master stop', () => {
  test('is gated by the shift and then by having a reason', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const L = window.SOL.logic;
      const run = L.newRun();
      const early = L.newShift(4), late = L.newShift(5);
      run.revealed = true;
      const earlyLate = L.canStop(run, early);
      run.revealed = false;
      run.awareness = 0;
      const noReason = L.canStop(run, late);
      // read almost everything and still never found the circular
      run.awareness = L.MAX_AWARENESS - L.REVEAL.weight;
      const nearlyReason = L.canStop(run, late);
      run.revealed = true;
      const reason = L.canStop(run, late);
      return { earlyLate, noReason, nearlyReason, reason, from: L.STOP_FROM_SHIFT };
    });
    expect(r.earlyLate).toBe('early');
    expect(r.noReason).toBe('unreasoned');
    expect(r.nearlyReason).toBe('unreasoned');
    expect(r.reason).toBe(true);
    expect(r.from).toBe(5);
  });

  test('takes two presses, and the first one only arms it', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
      L.resetRun(g.run);
      g.run.revealed = true;
      g.run.shift = 5;
      g.go('shift');
      for (let i = 0; i < 60 * 8; i++) {
        g.tick(1 / 60);
        if (i % 3 === 0 && sc.candidate()) sc.stamp(null);
      }
      const first = sc.stopLine(g);
      const armed = { screen: g.screen, arm: sc.stopArm, action: sc.lastAction };
      const second = sc.stopLine(g);
      const rec = g.run.shiftLog[g.run.shiftLog.length - 1];
      return { first, second, armed, screen: g.screen, rec, stops: g.run.stops,
               stoppedLine: g.run.stoppedLine };
    });
    expect(r.first).toBe(false);
    expect(r.armed.screen).toBe('shift');
    expect(r.armed.arm).toBeGreaterThan(0);
    expect(r.armed.action).toBe('stoparmed');
    expect(r.second).toBe(true);
    expect(r.screen).toBe('summary');
    expect(r.rec.stopped).toBe(true);
    expect(r.rec.n).toBe(5);
    expect(r.stops).toBe(1);
    expect(r.stoppedLine).toBe(true);
  });

  test('a refused stop says why, and does not end the shift', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
      L.resetRun(g.run);
      g.run.shift = 2;
      g.go('shift');
      g.tick(1 / 60);
      const early = { ok: sc.stopLine(g), action: sc.lastAction, said: sc.notice && sc.notice.text };
      g.run.shift = 5;
      g.go('shift');
      g.tick(1 / 60);
      const unreasoned = { ok: sc.stopLine(g), action: sc.lastAction, said: sc.notice && sc.notice.text };
      return { early, unreasoned, screen: g.screen, C: window.SOL.content };
    });
    expect(r.early.ok).toBe(false);
    expect(r.early.action).toBe('stopearly');
    expect(r.early.said).toBe(r.C.STOP_EARLY);
    expect(r.unreasoned.ok).toBe(false);
    expect(r.unreasoned.action).toBe('stopunreasoned');
    expect(r.unreasoned.said).toBe(r.C.STOP_UNREASONED);
    expect(r.screen).toBe('shift');
  });
});

test.describe('the run', () => {
  test('six shifts play end to end for a player using every channel',
    async ({ page }) => {
      await boot(page);
      const r = await page.evaluate(() => {
        const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
        L.resetRun(g.run);
        /* The most curious run the game allows: the set and the camera on
           the bench from the start, every carrier turned over, every lorry
           watched, every bin sorted. */
        g.run.ledger.owned = ['radio', 'camera'];
        window.__binPolicy = 'sort';
        g.go('brief');
        let guard = 0;
        while (g.screen !== 'menu' && !g.run.finished && guard++ < 60 * 900) {
          if (g.screen === 'brief') { window.SOL.screens.brief.key({ key: 'Enter' }, g); continue; }
          if (g.screen === 'summary') { window.SOL.screens.summary.advance(g); continue; }
          if (g.screen === 'stores') { window.SOL.screens.stores.leave_(g); continue; }
          if (g.screen === 'trash') { window.__clearBin(); continue; }
          if (g.screen !== 'shift') break;
          const car = sc.nearestReturn();
          if (car && car.clue && !sc.open) sc.look(null);
          if (sc.dockUp && !sc.open) sc.lookDock();
          g.tick(1 / 60);
          if (sc.open && sc.open.read) sc.closeInquiry();
          if (g.screen === 'shift' && !sc.open && sc.candidate()) sc.stamp(null);
        }
        window.__binPolicy = 'tip';
        return {
          log: g.run.shiftLog.map((s) => ({ n: s.n, target: s.target, aw: s.awareness })),
          finished: g.run.finished,
          awareness: g.run.awareness,
          revealedOn: g.run.revealedOn,
          tier: L.awarenessTier(g.run),
          max: L.MAX_AWARENESS,
          count: L.SHIFT_COUNT
        };
      });
      expect(r.log.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(r.finished).toBe(true);
      expect(r.count).toBe(6);
      // targets escalate, and what the player knows never goes backwards
      for (let i = 1; i < r.log.length; i++) {
        expect(r.log[i].target).toBeGreaterThan(r.log[i - 1].target);
        expect(r.log[i].aw).toBeGreaterThanOrEqual(r.log[i - 1].aw);
      }
      // it is learned faster than the run is played: the circular lands early
      expect(r.revealedOn).toBe(3);
      /* And all of it, which is only possible because the third shift's bin
         holds nothing of its own — the circular displaces whatever is in the
         bin the night it turns up, so a ladder that put a document there as
         well would quietly make a complete run impossible. */
      expect(r.awareness).toBe(r.max);
      expect(r.tier).toBe('sure');
    });

  test('a run played blind logs six shifts and learns nothing', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
      L.resetRun(g.run);
      g.go('brief');
      let guard = 0;
      while (!g.run.finished && guard++ < 60 * 900) {
        if (g.screen === 'brief') { window.SOL.screens.brief.key({ key: 'Enter' }, g); continue; }
        if (g.screen === 'summary') { window.SOL.screens.summary.advance(g); continue; }
        // the stores sit between every pair of shifts; this player buys nothing
        if (g.screen === 'stores') { window.SOL.screens.stores.leave_(g); continue; }
        if (g.screen === 'trash') { window.__clearBin(); continue; }
        if (g.screen !== 'shift') break;
        g.tick(1 / 60);
        if (g.screen === 'shift' && sc.candidate()) sc.stamp(null);
      }
      return {
        n: g.run.shiftLog.length,
        awareness: g.run.awareness,
        tier: L.awarenessTier(g.run),
        passed: g.run.shiftLog.reduce((a, s) => a + s.marksPassed, 0),
        spoiled: g.run.spoiled,
        stamped: g.run.stamped,
        madeTarget: g.run.shiftLog.map((s) => s.stamped >= s.target),
        earned: g.run.ledger.earned,
        owned: g.run.ledger.owned.length
      };
    });
    expect(r.n).toBe(6);
    expect(r.awareness).toBe(0);
    expect(r.tier).toBe('none');
    // everything the run had to offer, on all four channels, went by unfound
    expect(r.passed).toBe(12);
    expect(r.spoiled).toBe(0);
    expect(r.owned).toBe(0);

    /* Perfect attention, nothing bought, nothing looked at — and the run
       still comes apart at the end, because the schedule was never written
       for a person working alone. This is the trap stated as an assertion. */
    expect(r.madeTarget.slice(0, 3)).toEqual([true, true, true]);
    expect(r.madeTarget[r.madeTarget.length - 1]).toBe(false);
    expect(r.earned).toBeGreaterThan(0);
  });
});

/* The circular now comes out of the bin, after the hooter, on a screen with
   no station on it. The station has to say the depth stop adjusts on the
   next shift instead — and for one build it said nothing at all, because
   the flag was set from the shift screen's own opening state. */
test.describe('being told about the depth stop', () => {
  test('the station mentions it once, on the first shift after the circular',
    async ({ page }) => {
      await boot(page);
      const r = await page.evaluate(() => {
        const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
        const C = window.SOL.content;
        L.resetRun(g.run);

        // nothing is said while there is nothing to say
        g.run.shift = 2;
        g.go('shift');
        for (let i = 0; i < 60 * 12; i++) g.tick(1 / 60);
        const before = { told: g.run.depthTold, said: sc.notice && sc.notice.text };

        // the circular is read at the bin, which is where it lives
        g.run.revealed = true;
        g.run.revealedOn = 3;
        g.run.shift = 4;
        g.go('shift');
        let heard = null, at = null;
        for (let i = 0; i < 60 * 12; i++) {
          g.tick(1 / 60);
          // it is said and then it is gone, so catch it on the way past
          if (sc.notice && sc.notice.text === C.DEPTH_UNLOCK) {
            heard = sc.notice.text;
            at = sc.notice.at;
          }
        }
        const first = { told: g.run.depthTold, heard: heard, at: at };

        // and never again
        g.run.shift = 5;
        g.go('shift');
        let again = null;
        for (let i = 0; i < 60 * 12; i++) {
          g.tick(1 / 60);
          if (sc.notice && sc.notice.text === C.DEPTH_UNLOCK) again = sc.notice.text;
        }
        return { before, first, again, line: C.DEPTH_UNLOCK };
      });
      expect(r.before.told).toBe(false);
      expect(r.before.said).not.toBe(r.line);
      expect(r.first.told).toBe(true);
      expect(r.first.heard).toBe(r.line);
      // said beside the control it is about, not over the belt
      expect(r.first.at).toBe('depth');
      expect(r.again).toBe(null);
    });
});
