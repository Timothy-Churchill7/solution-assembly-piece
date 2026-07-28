/* econ.spec.js — pay, the book, and the ceiling on a pair of hands.

   The load-bearing test in this file is "the schedule outruns the hands":
   the whole economy exists to make that true, and if it stops being true
   the stores become decoration. */
const { test, expect } = require('@playwright/test');
const { boot, screenName } = require('./helpers');

test.describe('what a shift pays', () => {
  test('day rate, piece rate and the bonus for making the number', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const E = window.SOL.econ;
      return {
        made: E.payFor({ stamped: 30, target: 24 }),
        missed: E.payFor({ stamped: 20, target: 24 }),
        exact: E.payFor({ stamped: 24, target: 24 })
      };
    });
    expect(r.made.total).toBe(20 + 30 + 25);
    expect(r.made.bonus).toBe(25);
    // one part short of the number and the bonus is simply not there
    expect(r.missed.bonus).toBe(0);
    expect(r.missed.total).toBe(20 + 20);
    expect(r.exact.bonus).toBe(25);
  });

  test('returned work and a late clock-off come off the total', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const E = window.SOL.econ;
      return {
        clean: E.payFor({ stamped: 30, target: 24 }),
        sentBack: E.payFor({ stamped: 30, target: 24, rejects: 4 }),
        late: E.payFor({ stamped: 30, target: 24, late: true })
      };
    });
    expect(r.sentBack.rejects).toBe(-12);
    expect(r.sentBack.total).toBe(r.clean.total - 12);
    expect(r.late.total).toBe(r.clean.total - 6);
  });

  test('walking off the line costs half a day, and the book never goes backwards', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const E = window.SOL.econ;
      return {
        stopped: E.payFor({ stamped: 6, target: 43, stopped: true }),
        ruinous: E.payFor({ stamped: 0, target: 24, rejects: 40, late: true })
      };
    });
    expect(r.stopped.day).toBe(10);
    expect(r.stopped.total).toBe(16);
    // deductions can zero a shift's pay but cannot take scrip already earned
    expect(r.ruinous.total).toBe(0);
  });
});

test.describe('the book', () => {
  test('buying takes the scrip and puts the item on the bench', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const E = window.SOL.econ;
      const led = E.newLedger();
      E.credit(led, E.payFor({ stamped: 30, target: 24 }));
      const before = led.scrip;
      const ok = E.buy(led, 'gauge');
      return {
        before, ok, after: led.scrip, spent: led.spent,
        owns: E.owns(led, 'gauge'),
        again: E.canBuy(led, 'gauge'),
        unaffordable: E.canBuy(led, 'feeder')
      };
    });
    expect(r.before).toBe(75);
    expect(r.ok).toBe(true);
    expect(r.after).toBe(5);
    expect(r.spent).toBe(70);
    expect(r.owns).toBe(true);
    expect(r.again).toBe('owned');
    expect(r.unaffordable).toBe('funds');
  });

  test('a purchase that cannot be afforded changes nothing', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const E = window.SOL.econ;
      const led = E.newLedger();
      led.scrip = 20;
      const ok = E.buy(led, 'feeder');
      return { ok, scrip: led.scrip, owned: led.owned.length };
    });
    expect(r.ok).toBe(false);
    expect(r.scrip).toBe(20);
    expect(r.owned).toBe(0);
  });

  test('nobody can buy the whole catalogue', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const L = window.SOL.logic, E = window.SOL.econ;
      /* The ceiling on a run: every part that arrives in every shift gets
         stamped, and every bonus is paid. Nothing can earn more than this. */
      const best = L.SHIFTS.reduce((sum, cfg) => {
        const arrivals = Math.floor(cfg.duration / cfg.spawn);
        return sum + E.payFor({ stamped: arrivals, target: cfg.target }).total;
      }, 0);
      return { best, catalogue: E.TOTAL_CATALOGUE };
    });
    expect(r.best).toBeLessThan(r.catalogue);
  });
});

test.describe('the ceiling on a pair of hands', () => {
  test('the schedule outruns unaided hands before the run is over', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const L = window.SOL.logic, E = window.SOL.econ;
      const bare = E.newLedger();
      return L.SHIFTS.map((cfg) => ({
        n: cfg.n,
        target: cfg.target,
        capacity: E.capacity(cfg, bare, 0),
        shortfall: E.shortfall(cfg, bare, 0)
      }));
    });
    // the early shifts are winnable by hand, and comfortably
    for (const s of r.slice(0, 5)) {
      expect(s.capacity, `shift ${s.n}`).toBeGreaterThanOrEqual(s.target);
    }
    // the last one is not winnable by hand at all, however well it is played
    const last = r[r.length - 1];
    expect(last.capacity).toBeLessThan(last.target);
    expect(last.shortfall).toBeGreaterThan(0);

    // and it gets harder monotonically, rather than spiking at the end
    const slack = r.map((s) => s.capacity - s.target);
    for (let i = 2; i < slack.length; i++) {
      expect(slack[i], `shift ${i + 1} slack`).toBeLessThanOrEqual(slack[i - 1]);
    }
  });

  test('the pedal buys the last shift back', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const L = window.SOL.logic, E = window.SOL.econ;
      const bare = E.newLedger();
      const kit = E.newLedger();
      kit.owned = ['pedal'];
      const last = L.SHIFTS[L.SHIFTS.length - 1];
      return {
        bare: E.capacity(last, bare, 0),
        kit: E.capacity(last, kit, 0),
        target: last.target
      };
    });
    expect(r.bare).toBeLessThan(r.target);
    expect(r.kit).toBeGreaterThanOrEqual(r.target);
  });

  test('seconds spent elsewhere come straight off the ceiling', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const L = window.SOL.logic, E = window.SOL.econ;
      const bare = E.newLedger();
      const cfg = L.shiftConfig(4);
      return {
        idle: E.capacity(cfg, bare, 0),
        busy: E.capacity(cfg, bare, 16.2),   // ten cycles' worth
        cycle: E.cycle(bare)
      };
    });
    expect(r.cycle).toBeCloseTo(1.62, 5);
    expect(r.busy).toBe(r.idle - 10);
  });

  /* The second half of the trap. An operator who does the whole job — the
     press and line 5 — runs out of hands two shifts before an operator who
     lets line 5 go past, and the one who lets it go past is paying for it
     in deductions instead. Neither way through is free. */
  test('doing the whole job by hand fails earlier than doing half of it',
    async ({ page }) => {
      await boot(page);
      const r = await page.evaluate(() => {
        const L = window.SOL.logic, E = window.SOL.econ;
        const bare = E.newLedger();
        return L.SHIFTS.map((cfg) => ({
          n: cfg.n,
          target: cfg.target,
          faults: L.faultCount(cfg),
          ignoring: E.capacity(cfg, bare, 0),
          attentive: L.capacityAttentive(cfg.n, bare)
        }));
      });

      // every shift brings faults, and more of them as the run goes on
      for (const s of r) expect(s.faults, `shift ${s.n}`).toBeGreaterThan(0);
      for (let i = 1; i < r.length; i++) {
        expect(r[i].faults).toBeGreaterThanOrEqual(r[i - 1].faults);
      }

      const attentiveFails = r.filter((s) => s.attentive < s.target).map((s) => s.n);
      const ignoringFails = r.filter((s) => s.ignoring < s.target).map((s) => s.n);
      expect(attentiveFails).toEqual([5, 6]);
      expect(ignoringFails).toEqual([6]);

      // and the slack closes shift by shift rather than falling off a cliff
      const slack = r.map((s) => s.attentive - s.target);
      for (let i = 1; i < slack.length; i++) {
        expect(slack[i], `shift ${i + 1} slack`).toBeLessThan(slack[i - 1]);
      }
    });

  test('the arm takes most of line 5 off your hands, but not all of it',
    async ({ page }) => {
      await boot(page);
      const r = await page.evaluate(() => {
        const L = window.SOL.logic, E = window.SOL.econ;
        const bare = E.newLedger();
        const armed = E.newLedger(); armed.owned = ['arm'];
        const cfg = L.shiftConfig(5);
        return {
          share: E.ARM_SHARE,
          bareDuty: E.dutySeconds(L.faultCount(cfg), bare),
          armDuty: E.dutySeconds(L.faultCount(cfg), armed),
          bare: L.capacityAttentive(5, bare),
          armed: L.capacityAttentive(5, armed),
          target: cfg.target
        };
      });
      expect(r.armDuty).toBeGreaterThan(0);          // it has no opinion about the rest
      expect(r.armDuty).toBeCloseTo(r.bareDuty * (1 - r.share), 5);
      expect(r.armed).toBeGreaterThan(r.bare);
      expect(r.bare).toBeLessThan(r.target);
    });
});

/* `capacity` is an upper bound and nothing more: it assumes a part is
   always in the zone at the moment the charge fills, which no run of the
   real screen manages. Expect the running game to land a few parts under
   it — returns.spec.js is what actually holds the balance in place. */

test.describe('the press cycle', () => {
  test('the ram will not strike again until it is back up', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift, E = window.SOL.econ;
      g.run.shift = 1;
      g.go('shift');
      // build a populated belt so there is always something to take
      for (let i = 0; i < 60 * 20; i++) g.tick(1 / 60);
      const first = sc.stamp(null);
      const immediate = sc.stamp(null);
      const action = sc.lastAction;
      // wait out one full cycle and try again
      for (let i = 0; i < Math.ceil(E.cycle(g.run.ledger) * 60) + 2; i++) g.tick(1 / 60);
      const later = sc.stamp(null);
      return { first, immediate, action, later };
    });
    expect(r.first).toBe(true);
    expect(r.immediate).toBe(false);
    expect(r.action).toBe('charging');
    expect(r.later).toBe(true);
  });

  test('a shift cannot record more than the ceiling says it can', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift;
      const L = window.SOL.logic, E = window.SOL.econ;
      g.run.shift = 6;
      g.go('shift');
      // hammer the press every single frame for the whole shift
      for (let i = 0; i < 60 * 200 && g.screen === 'shift'; i++) {
        g.tick(1 / 60);
        if (g.screen === 'shift') sc.stamp(null);
      }
      window.__clearBin();
      const rec = g.run.shiftLog[g.run.shiftLog.length - 1];
      return {
        stamped: rec.stamped,
        target: rec.target,
        ceiling: E.capacity(L.shiftConfig(6), g.run.ledger, 0)
      };
    });
    expect(r.stamped).toBeLessThanOrEqual(r.ceiling);
    // which is the point: perfect play, and the number is still not made
    expect(r.stamped).toBeLessThan(r.target);
  });
});

test.describe('the stores between shifts', () => {
  test('a closed shift pays into the book and opens the stores', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift;
      g.run.shift = 1;
      g.go('shift');
      for (let i = 0; i < 60 * 200 && g.screen === 'shift'; i++) {
        g.tick(1 / 60);
        if (g.screen === 'shift') sc.stamp(null);
      }
      window.__clearBin();
      const rec = g.run.shiftLog[0];
      const onSummary = g.screen;
      window.SOL.screens.summary.advance(g);
      return {
        onSummary,
        after: g.screen,
        stamped: rec.stamped,
        rejects: rec.rejects,
        faults: window.SOL.logic.faultCount(window.SOL.logic.shiftConfig(1)),
        pay: rec.pay.total,
        scrip: g.run.ledger.scrip,
        nextShift: g.run.shift
      };
    });
    expect(r.onSummary).toBe('summary');
    expect(r.after).toBe('stores');
    expect(r.stamped).toBeGreaterThan(0);
    /* This player never looked up from the press, so every fault line 5
       brought was fitted and sent back, and the deduction is on the stub. */
    expect(r.rejects).toBe(r.faults);
    expect(r.pay).toBe(20 + r.stamped + (r.stamped >= 24 ? 25 : 0) - 3 * r.rejects);
    expect(r.scrip).toBe(r.pay);
    expect(r.nextShift).toBe(2);
  });

  test('what is bought stays bought, and clocking on leads to the brief', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, E = window.SOL.econ;
      const st = window.SOL.screens.stores;
      g.run.shift = 2;
      g.run.ledger.scrip = 120;
      g.go('stores');
      const bought = st.buy('gauge', g);
      const refused = st.buy('feeder', g);
      st.leave_(g);
      return {
        bought, refused,
        screen: g.screen,
        scrip: g.run.ledger.scrip,
        owns: E.owns(g.run.ledger, 'gauge')
      };
    });
    expect(r.bought).toBe(true);
    expect(r.refused).toBe(false);
    expect(r.scrip).toBe(50);
    expect(r.owns).toBe(true);
    expect(r.screen).toBe('brief');
  });

  test('the pedal shortens the cycle in the running game, not just on paper', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift, E = window.SOL.econ;

      function run(kit) {
        window.SOL.logic.resetRun(g.run);
        g.run.ledger.owned = kit;
        g.run.shift = 3;
        g.go('shift');
        for (let i = 0; i < 60 * 200 && g.screen === 'shift'; i++) {
          g.tick(1 / 60);
          if (g.screen === 'shift') sc.stamp(null);
        }
        window.__clearBin();
        return g.run.shiftLog[g.run.shiftLog.length - 1].stamped;
      }
      const bare = run([]);
      const pedal = run(['pedal']);
      return { bare, pedal };
    });
    expect(r.pedal).toBeGreaterThan(r.bare);
  });

  /* The first cut of this screen ran a hundred pixels off the bottom of the
     stage: the last item was not on screen at all and the CLOCK ON button
     printed straight over the row above it. The layout is a budget of
     constants, so this asserts the budget still adds up. */
  test('the card and every row it contains fit between the rails', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, E = window.SOL.econ;
      const st = window.SOL.screens.stores;
      // the tallest the pay stub ever gets: every deduction in play at once
      g.run.shiftLog.push({
        n: 2, target: 28,
        pay: E.payFor({ stamped: 30, target: 28, rejects: 3, late: true })
      });
      g.run.ledger.scrip = 300;
      g.go('stores');
      g.redraw();
      return {
        card: st.card,
        hits: st.hits.map((h) => ({ id: h.id, bottom: h.y + h.h, top: h.y })),
        H: window.SOL.H,
        catalogue: E.CATALOGUE.length
      };
    });

    const headerBottom = 34, footerTop = r.H - 31;
    expect(r.card.y).toBeGreaterThanOrEqual(headerBottom);
    expect(r.card.y + r.card.h).toBeLessThanOrEqual(footerTop);

    // every catalogue row is on screen and inside the card, plus CLOCK ON
    expect(r.hits.length).toBe(r.catalogue + 1);
    for (const h of r.hits) {
      expect(h.top, h.id).toBeGreaterThanOrEqual(r.card.y);
      expect(h.bottom, h.id).toBeLessThanOrEqual(r.card.y + r.card.h);
    }

    // and nothing overlaps the button it sits above
    const leave = r.hits.find((h) => h.id === 'leave');
    const rows = r.hits.filter((h) => h.id !== 'leave');
    for (const row of rows) {
      expect(row.bottom, row.id).toBeLessThanOrEqual(leave.top);
    }
  });

  test('the last shift goes to the ending, not to the stores', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, L = window.SOL.logic;
      const sh = L.newShift(L.SHIFT_COUNT);
      sh.stamped = 40;
      L.closeShift(g.run, sh, 1);
      window.SOL.screens.summary.enter({}, g);
      window.SOL.screens.summary.advance(g);
      return { screen: g.screen, finished: g.run.finished };
    });
    expect(r.screen).not.toBe('stores');
    expect(r.finished).toBe(true);
  });
});
