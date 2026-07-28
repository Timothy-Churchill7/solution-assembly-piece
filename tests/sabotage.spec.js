/* Refusal, and the shift chain it sits inside.

   There used to be a depth stop on the press: set it shallow and the die
   did not seat, so the part came off looking finished, was still counted,
   and the plant's number never moved. It was removed. It let the player
   refuse at no cost whatever to themselves, and it taught them that the
   sheet is the only thing in the building that can be fought.

   What replaces it is stated on the brief the first time you clock on
   knowing, and it is only the job itself: parts you do not stamp, faults
   you let past, and sound stock you put down the chute. All three show on
   the sheet. All three cost you the bonus. This file holds them. */
const { test, expect } = require('@playwright/test');
const { boot } = require('./helpers');

/* Play one shift at a fixed cadence.
     opts.read     open and read everything the shift offers
     opts.idle     never touch the press at all
     opts.scrap    put every part in the zone down the chute            */
const playShift = (page, n, opts = {}) =>
  page.evaluate(({ n, opts }) => {
    const g = window.SOL.game, sc = window.SOL.screens.shift;
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
      if (sc.open || opts.idle) continue;
      if (opts.scrap) sc.scrap(null);
      else if (i % 3 === 0 && sc.candidate()) sc.stamp(null);
    }
    window.__clearBin();
    return g.run.shiftLog[g.run.shiftLog.length - 1];
  }, { n, opts });

const fresh = (page) =>
  page.evaluate(() => window.SOL.logic.resetRun(window.SOL.game.run));

test.describe('what a station can withhold', () => {
  /* Three levers, and the brief names all three. Each one on its own has
     to move the number the customer actually receives, or the sentence on
     the brief is a lie. */
  test('not stamping and scrapping both withhold work', async ({ page }) => {
    await boot(page);
    await fresh(page);
    const worked = await playShift(page, 4, { revealed: true });
    await fresh(page);
    const idle = await playShift(page, 4, { revealed: true, idle: true });
    await fresh(page);
    const scrapped = await playShift(page, 4, { revealed: true, scrap: true });

    // a shift worked properly delivers a great deal
    expect(worked.stamped).toBeGreaterThan(20);
    expect(worked.usable).toBeGreaterThan(20);
    // standing still delivers nothing, and the sheet says exactly that
    expect(idle.stamped).toBe(0);
    expect(idle.usable).toBe(0);
    // and so does putting it all down the chute
    expect(scrapped.scrapped).toBeGreaterThan(10);
    expect(scrapped.stamped).toBeLessThan(worked.stamped);
    expect(scrapped.usable).toBeLessThan(worked.usable);
  });

  /* The third lever, and the only one the plant's own count cannot see:
     a fault let past is stamped, counted, paid for, and useless. */
  test('a fault let past is counted by the plant and not delivered',
    async ({ page }) => {
      await boot(page);
      const r = await page.evaluate(() => {
        const L = window.SOL.logic;
        const run = L.newRun();
        const sh = L.newShift(4);
        sh.stamped = 40; sh.rejects = 11;
        L.closeShift(run, sh);
        return {
          counted: run.stamped,
          rejects: run.rejects,
          usable: L.usableOutput(run),
          onSheet: run.shiftLog[0].stamped,
          delivered: L.deliveredBy(run.shiftLog[0])
        };
      });
      expect(r.counted).toBe(40);
      expect(r.rejects).toBe(11);
      expect(r.usable).toBe(29);
      // the sheet carries the first number and has no column for the second
      expect(r.onSheet).toBe(40);
      expect(r.delivered).toBe(29);
    });

  /* Unlike the depth stop, all of it is on the sheet. That is the point of
     the change: refusal now costs the person doing it. */
  test('withholding work costs the operator the bonus, every time',
    async ({ page }) => {
      await boot(page);
      await fresh(page);
      const worked = await playShift(page, 4, { revealed: true });
      await fresh(page);
      const idle = await playShift(page, 4, { revealed: true, idle: true });

      expect(worked.pay.bonus).toBeGreaterThan(0);
      expect(idle.pay.bonus).toBe(0);
      expect(idle.pay.total).toBeLessThan(worked.pay.total);
      // and the rating on the sheet says so in the plant's own words
      expect(idle.rating).toBe('SHORT');
    });
});

test.describe('being told what can be withheld', () => {
  /* The one piece of advice the game gives about refusing. It is on the
     brief, in the pencilled hand, the first time you clock on after the
     circular — and exactly once. */
  test('the brief says it once, on the first shift after the circular',
    async ({ page }) => {
      await boot(page);
      const r = await page.evaluate(() => {
        const g = window.SOL.game, L = window.SOL.logic, C = window.SOL.content;
        const br = window.SOL.screens.brief;
        L.resetRun(g.run);

        // nothing is said while there is nothing to say
        g.run.shift = 2;
        g.go('brief');
        g.redraw();
        const before = g.run.refusalTold;

        g.run.revealed = true;
        g.run.revealedOn = 3;
        g.run.shift = 4;
        g.go('brief');
        g.redraw();
        // drawing it must not spend it; clocking on must
        const drawn = g.run.refusalTold;
        br.begin_(g);
        return {
          before, drawn,
          after: g.run.refusalTold,
          note: C.REFUSAL_NOTE,
          // shift 4 has no welcome of its own, so this is the only addendum
          fourthHasWelcome: !!C.shift(4).welcome
        };
      });
      expect(r.before).toBe(false);
      expect(r.drawn).toBe(false);
      expect(r.after).toBe(true);
      expect(r.fourthHasWelcome).toBe(false);
      // it names all three levers and says what it costs
      expect(r.note).toMatch(/do not stamp/i);
      expect(r.note).toMatch(/faulty piece you let go past/i);
      expect(r.note).toMatch(/scrap chute/i);
      expect(r.note).toMatch(/bonus/i);
    });

  test('the press has no hidden control on it any more', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
      L.resetRun(g.run);
      g.run.revealed = true;
      g.run.shift = 5;
      g.go('shift');
      g.redraw();
      return {
        gone: [typeof sc.setShallow, typeof L.canSpoil, typeof L.spoilRisk,
               typeof sc.shallow].every((t) => t === 'undefined'),
        // one switch at the station, and it is the master stop
        controls: sc.hits.map((h) => h.id).filter((id) => id !== 'dock')
      };
    });
    expect(r.gone).toBe(true);
    expect(r.controls).toEqual(['stop']);
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
    // walking off skips the bin: you are not tidying up on your way out
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
          if (g.screen === 'brief') { window.SOL.screens.brief.begin_(g); continue; }
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
          told: g.run.refusalTold,
          tier: L.awarenessTier(g.run),
          max: L.MAX_AWARENESS,
          count: L.SHIFT_COUNT
        };
      });
      expect(r.log.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(r.finished).toBe(true);
      expect(r.count).toBe(6);
      for (let i = 1; i < r.log.length; i++) {
        expect(r.log[i].target).toBeGreaterThan(r.log[i - 1].target);
        expect(r.log[i].aw).toBeGreaterThanOrEqual(r.log[i - 1].aw);
      }
      expect(r.revealedOn).toBe(3);
      // and having found out, they were told once what could be done about it
      expect(r.told).toBe(true);
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
        if (g.screen === 'brief') { window.SOL.screens.brief.begin_(g); continue; }
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
        told: g.run.refusalTold,
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
    expect(r.owned).toBe(0);
    // never found out, so never told what could be done about it
    expect(r.told).toBe(false);

    /* Perfect attention, nothing bought, nothing looked at — and the run
       still comes apart at the end, because the schedule was never written
       for a person working alone. This is the trap stated as an assertion. */
    expect(r.madeTarget.slice(0, 3)).toEqual([true, true, true]);
    expect(r.madeTarget[r.madeTarget.length - 1]).toBe(false);
    expect(r.earned).toBeGreaterThan(0);
  });
});
