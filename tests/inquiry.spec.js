/* Inquiry: the cost of looking, and what looking is worth.

   Nothing announces itself any more. Clues arrive on four channels — a
   faulty piece on line 5 that somebody has been at, the bench radio, the
   yard camera, and the bin by the door — and none of them lights up, is
   outlined, or puts a prompt on the screen. What these tests defend is
   that each channel really is reachable, really does cost something, and
   really can be missed by a player who is only doing their job.

   All headless: these assert on plain state, never on pixels. */
const { test, expect } = require('@playwright/test');
const { boot } = require('./helpers');

/* Put the game on a given shift with the clock running and nothing read. */
async function enterShift(page, n, kit = []) {
  return page.evaluate(({ n, kit }) => {
    const g = window.SOL.game;
    window.SOL.logic.resetRun(g.run);
    g.run.ledger.owned = kit;
    g.run.shift = n;
    g.go('shift');
  }, { n, kit });
}

/* Advance until a piece carrying something is in the inspection bay. */
async function runToCarrier(page) {
  return page.evaluate(() => {
    const g = window.SOL.game, sc = window.SOL.screens.shift;
    for (let i = 0; i < 60 * 200; i++) {
      if (g.screen !== 'shift') return false;
      const r = sc.nearestReturn();
      if (r && r.clue) return true;
      g.tick(1 / 60);
    }
    return false;
  });
}

test.describe('clue data', () => {
  test('every shift carries at least one clue, and ids are unique', async ({ page }) => {
    await boot(page);
    const info = await page.evaluate(() => {
      const L = window.SOL.logic;
      return {
        perShift: L.SHIFTS.map((s) => L.cluesFor(s.n).length),
        ids: L.CLUES.map((c) => c.id),
        max: L.MAX_AWARENESS,
        weights: L.CLUES.map((c) => c.weight)
      };
    });
    expect(info.perShift.every((n) => n >= 1)).toBe(true);
    expect(new Set(info.ids).size).toBe(info.ids.length);
    expect(info.max).toBe(info.weights.reduce((a, b) => a + b, 0));
    expect(info.max).toBeGreaterThan(0);
  });

  test('clue weight escalates across the run', async ({ page }) => {
    await boot(page);
    const perShift = await page.evaluate(() =>
      window.SOL.logic.SHIFTS.map((s) =>
        window.SOL.logic.cluesFor(s.n).reduce((a, c) => a + c.weight, 0)));
    for (let i = 1; i < perShift.length; i++) {
      expect(perShift[i]).toBeGreaterThanOrEqual(perShift[i - 1]);
    }
    expect(perShift[perShift.length - 1]).toBeGreaterThan(perShift[0]);
  });

  test('every clue names a channel, and every channel is used', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const L = window.SOL.logic;
      const bad = L.CLUES.filter((c) => L.CHANNELS.indexOf(c.via) < 0).map((c) => c.id);
      const used = {};
      L.CHANNELS.forEach((v) => {
        used[v] = L.CLUES.filter((c) => c.via === v).length;
      });
      return { bad, used, channels: L.CHANNELS };
    });
    expect(r.bad).toEqual([]);
    for (const v of r.channels) expect(r.used[v], v).toBeGreaterThan(0);
  });

  /* The camera holds a scene for a fixed window and then the lorry is
     gone. One that arrives too late to close before the hooter can be
     neither found nor written off, and simply goes missing from the
     accounting — which is exactly how it went unnoticed for a build. */
  test('every yard-camera item closes before the hooter', async ({ page }) => {
    await boot(page);
    const bad = await page.evaluate(() => {
      const L = window.SOL.logic, out = [];
      L.SHIFTS.forEach((s) => {
        L.cluesVia(s.n, 'dock').forEach((c) => {
          var closes = c.at * s.duration + L.DOCK_WINDOW;
          if (closes > s.duration - 2) {
            out.push(c.id + ' closes at ' + closes.toFixed(1) + ' of ' + s.duration);
          }
        });
      });
      return out;
    });
    expect(bad).toEqual([]);
  });

  test('timed clues schedule inside their own shift', async ({ page }) => {
    await boot(page);
    const bad = await page.evaluate(() => {
      const L = window.SOL.logic, out = [];
      L.SHIFTS.forEach((s) => {
        L.cluesFor(s.n).forEach((c) => {
          // the bin has no clock of its own; it is whatever is left at the end
          if (c.via === 'trash') {
            if (c.at !== 0) out.push(c.id + ' has a time it cannot use');
            return;
          }
          const at = c.at * s.duration;
          if (c.at <= 0 || c.at >= 1) out.push(c.id + ' fraction ' + c.at);
          if (s.duration - at < L.readTime(c) + 4) out.push(c.id + ' too late');
        });
      });
      return out;
    });
    expect(bad).toEqual([]);
  });

  /* The first two shifts are the on-ramp: what a player finds there makes
     them better at the job and says nothing whatever about the customer.
     If that ever stops being true the ladder has been broken. */
  test('nothing findable in the first two shifts is about the customer',
    async ({ page }) => {
      await boot(page);
      const r = await page.evaluate(() => {
        const L = window.SOL.logic;
        const early = L.cluesFor(1).concat(L.cluesFor(2));
        const body = early.map((c) => c.lines.join(' ')).join(' ');
        return {
          n: early.length,
          weights: early.map((c) => c.weight),
          // they are about the bonus, the fault, the stores and the wireless
          trade: /bonus|split|stores|pedal|priority list/i.test(body),
          under: L.REVEAL_MIN_AWARENESS
        };
      });
      expect(r.n).toBeGreaterThanOrEqual(4);
      // small weights: the on-ramp cannot on its own earn the circular
      expect(Math.max(...r.weights)).toBeLessThanOrEqual(2);
      expect(r.weights.reduce((a, b) => a + b, 0)).toBeLessThan(r.under);
      expect(r.trade).toBe(true);
    });
});

test.describe('reading takes time', () => {
  test('lines surface one at a time and the item is unread until the last', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const L = window.SOL.logic, c = L.CLUES[0];
      const at = (t) => ({ shown: L.linesShown(c, t), read: L.isRead(c, t) });
      return {
        n: c.lines.length,
        start: at(0),
        first: at(L.CLUE_LEAD + 0.01),
        beforeEnd: at(L.readTime(c) - 0.01),
        end: at(L.readTime(c))
      };
    });
    expect(r.start).toEqual({ shown: 0, read: false });
    expect(r.first).toEqual({ shown: 1, read: false });
    expect(r.beforeEnd.shown).toBe(r.n);
    expect(r.beforeEnd.read).toBe(false);
    expect(r.end.read).toBe(true);
  });

  test('closing before the last line records nothing', async ({ page }) => {
    await boot(page);
    await enterShift(page, 1);
    expect(await runToCarrier(page)).toBe(true);

    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift;
      sc.look(null);
      const opened = !!sc.open;
      for (let i = 0; i < 60 * 1.0; i++) g.tick(1 / 60);
      const readBefore = sc.open.read;
      const counted = sc.closeInquiry();
      return {
        opened, readBefore, counted,
        awareness: g.run.awareness,
        seen: g.run.cluesSeen.length,
        openedIds: sc.shift.opened.length,
        action: sc.lastAction
      };
    });
    expect(r.opened).toBe(true);
    expect(r.readBefore).toBe(false);
    expect(r.counted).toBe(false);
    expect(r.awareness).toBe(0);
    expect(r.seen).toBe(0);
    expect(r.openedIds).toBe(0);
    expect(r.action).toBe('unread');
  });

  test('reading it through records it exactly once', async ({ page }) => {
    await boot(page);
    await enterShift(page, 1);
    expect(await runToCarrier(page)).toBe(true);

    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
      const clue = sc.nearestReturn().clue;
      sc.look(null);
      for (let i = 0; i < Math.ceil((L.readTime(clue) + 0.5) * 60); i++) g.tick(1 / 60);
      const afterRead = {
        awareness: g.run.awareness,
        seen: g.run.cluesSeen.slice(),
        shiftOpened: sc.shift.opened.slice()
      };
      const counted = sc.closeInquiry();
      L.recordClue(g.run, sc.shift, clue);     // must be a no-op
      return {
        weight: clue.weight, counted, afterRead,
        finalAwareness: g.run.awareness,
        finalSeen: g.run.cluesSeen.length
      };
    });
    expect(r.afterRead.awareness).toBe(r.weight);
    expect(r.afterRead.seen).toHaveLength(1);
    expect(r.afterRead.shiftOpened).toHaveLength(1);
    expect(r.counted).toBe(true);
    expect(r.finalAwareness).toBe(r.weight);
    expect(r.finalSeen).toBe(1);
  });
});

test.describe('looking closely at line 5', () => {
  /* The load-bearing claim of the channel: whatever there is to find rides
     in on a piece you already had a reason to touch, so the decision is
     never "go and look for the story", it is "take this off, or turn it
     over first". If a carrier ever fails to appear the channel is dead. */
  test('every part-borne item reaches the bay with tape on it', async ({ page }) => {
    await boot(page);
    for (const n of [1, 3, 4, 6]) {
      const r = await page.evaluate((n) => {
        const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
        L.resetRun(g.run);
        g.run.shift = n;
        g.go('shift');
        const want = L.cluesVia(n, 'part')
          .slice().sort((a, b) => a.at - b.at).map((c) => c.id);
        const carried = [];
        for (let i = 0; i < 60 * 200 && g.screen === 'shift'; i++) {
          g.tick(1 / 60);
          sc.returns.forEach((r) => {
            if (r.clue && carried.indexOf(r.clue.id) < 0) {
              carried.push(r.clue.id);
              /* Tape and fault are separate signals. A taped piece may or
                 may not also be faulty, but the arm must never take one:
                 a machine that sorts by the obvious would have binned it. */
              if (r.armable) carried.push('ARM WOULD TAKE: ' + r.clue.id);
            }
          });
        }
        return { want, carried };
      }, n);
      expect(r.carried, `shift ${n}`).toEqual(r.want);
    }
  });

  /* Investigating is not a thing you do to a piece; it is a thing you do
     to a piece with red tape on it. Everything else on line 5 is work. */
  test('only a taped piece can be investigated', async ({ page }) => {
    await boot(page);
    await enterShift(page, 5);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift;
      let guard = 0;
      while (guard++ < 60 * 120) {
        const q = sc.nearestReturn();
        if (q && !q.clue) break;
        g.tick(1 / 60);
      }
      const plain = sc.nearestReturn();
      const looked = sc.look(plain.x);
      const why = sc.lastAction;
      // clicking it on the belt takes it off instead, which is the job
      const before = sc.shift.pulled;
      sc.pointer(plain.x, window.SOL.LAY.retY + 20, 'down', g);
      return {
        found: !!plain, looked, why, open: !!sc.open,
        pulledDelta: sc.shift.pulled - before
      };
    });
    expect(r.found).toBe(true);
    expect(r.looked).toBe(false);
    expect(r.why).toBe('nolook');
    expect(r.open).toBe(false);
    // the same click did the job instead
    expect(r.pulledDelta).toBe(1);
  });

  /* The line throttles to a crawl while an item is open, so almost nothing
     slips the press any more. What reading costs is the clock: the shift
     burns at full speed while the line is barely turning, and the parts you
     never got the chance to make are the bill. */
  test('the clock runs at full speed while the line does not', async ({ page }) => {
    await boot(page);
    await enterShift(page, 4);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
      let guard = 0;
      while (!(sc.nearestReturn() && sc.nearestReturn().clue) && guard++ < 60 * 200) {
        g.tick(1 / 60);
        sc.stamp(null);
      }
      const before = {
        clock: sc.shift.timeLeft,
        stamped: sc.shift.stamped,
        spawned: sc.shift.spawned
      };
      sc.look(null);
      for (let i = 0; i < 6 * 60; i++) {
        g.tick(1 / 60);
        sc.stamp(null);          // refused the whole time: you are reading
      }
      const during = {
        clock: sc.shift.timeLeft,
        stamped: sc.shift.stamped,
        spawned: sc.shift.spawned,
        readSecs: sc.shift.readSecs,
        rate: sc.lineRate
      };
      sc.closeInquiry();
      for (let i = 0; i < 40; i++) g.tick(1 / 60);   // it eases back up
      return { before, during, after: sc.lineRate, slow: L.READ_SLOWDOWN };
    });

    // the clock does not care that you are reading
    expect(r.before.clock - r.during.clock).toBeCloseTo(6, 0);
    expect(r.during.readSecs).toBeCloseTo(6, 0);
    // the line very nearly stops
    expect(r.during.rate).toBeCloseTo(r.slow, 2);
    // nothing stamped in those six seconds, and barely anything arrived
    expect(r.during.stamped).toBe(r.before.stamped);
    expect(r.during.spawned - r.before.spawned).toBeLessThanOrEqual(1);
    expect(r.after).toBeGreaterThan(0.9);
  });

  /* The tape is consumed by reading it, so the second click on the same
     piece does the job. That is how a player learns the two are the same
     reach made two different ways. */
  test('reading a taped piece leaves it on the belt, and the next click takes it',
    async ({ page }) => {
      await boot(page);
      await enterShift(page, 3);
      expect(await runToCarrier(page)).toBe(true);
      const r = await page.evaluate(() => {
        const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
        const piece = sc.nearestReturn();
        const clue = piece.clue;
        sc.look(piece.x);
        for (let i = 0; i < Math.ceil((L.readTime(clue) + 1) * 60); i++) g.tick(1 / 60);
        sc.closeInquiry();
        const stillThere = sc.returns.indexOf(piece) >= 0;
        const tapeGone = !piece.clue;
        const pulled = sc.pull(piece.x);
        return {
          stillThere, tapeGone, pulled,
          gone: sc.returns.indexOf(piece) < 0,
          // shift 3's first taped piece is a tip: banked, and worth nothing
          seen: g.run.cluesSeen.length
        };
      });
      expect(r.seen).toBe(1);
      expect(r.stillThere).toBe(true);
      expect(r.tapeGone).toBe(true);
      expect(r.pulled).toBe(true);
      expect(r.gone).toBe(true);
    });

  test('a carrier pulled instead of looked at takes what it carried with it',
    async ({ page }) => {
      await boot(page);
      await enterShift(page, 3);
      expect(await runToCarrier(page)).toBe(true);
      const r = await page.evaluate(() => {
        const g = window.SOL.game, sc = window.SOL.screens.shift;
        const before = sc.shift.rejects;
        const ok = sc.pull(null);
        return {
          ok,
          open: !!sc.open,
          awareness: g.run.awareness,
          before,
          rejects: sc.shift.rejects
        };
      });
      // doing the job perfectly is exactly how you never find out
      expect(r.ok).toBe(true);
      expect(r.open).toBe(false);
      expect(r.awareness).toBe(0);
      // it never reached the works, so it was never sent back either
      expect(r.rejects).toBe(r.before);
    });
});

test.describe('the bench set and the yard camera', () => {
  test('neither carries anything until it has been bought', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const L = window.SOL.logic, E = window.SOL.econ;
      const bare = E.newLedger();
      const kitted = E.newLedger();
      kitted.owned = ['radio', 'camera'];
      return {
        map: L.CHANNEL_ITEM,
        bareRadio: L.channelOpen('radio', bare),
        bareDock: L.channelOpen('dock', bare),
        kitRadio: L.channelOpen('radio', kitted),
        kitDock: L.channelOpen('dock', kitted),
        // the two free channels are open to everybody, always
        part: L.channelOpen('part', bare),
        trash: L.channelOpen('trash', bare)
      };
    });
    expect(r.map).toEqual({ radio: 'radio', dock: 'camera' });
    expect(r.bareRadio).toBe(false);
    expect(r.bareDock).toBe(false);
    expect(r.kitRadio).toBe(true);
    expect(r.kitDock).toBe(true);
    expect(r.part).toBe(true);
    expect(r.trash).toBe(true);
  });

  /* The set talks whether or not there is anything to hear, and the lines
     that matter are read out in exactly the voice of the ones that do not.
     There is no prompt and no pause: either you were reading the bottom of
     the screen while you worked, or you were not. */
  test('the radio reads its item out over the ordinary programme', async ({ page }) => {
    await boot(page);
    await enterShift(page, 2, ['radio']);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift, C = window.SOL.content;
      const clue = window.SOL.logic.cluesVia(2, 'radio')[0];
      const filler = [];
      let started = null;
      for (let i = 0; i < 60 * 200 && g.screen === 'shift'; i++) {
        g.tick(1 / 60);
        if (g.screen !== 'shift') break;
        const line = sc.radioText();
        if (!sc.ambient && line && filler.indexOf(line) < 0) filler.push(line);
        if (sc.ambient && started === null) started = sc.shift.cfg.duration - sc.shift.timeLeft;
        // work the press throughout: this costs no attention but the reading
        sc.stamp(null);
      }
      return {
        started,
        due: clue.at * sc.shift.cfg.duration,
        awareness: g.run.awareness,
        seen: g.run.cluesSeen,
        fillerWasReal: filler.every((f) => C.RADIO_FILLER.indexOf(f) >= 0),
        fillerCount: filler.length
      };
    });
    // it goes out on its own schedule, is read through while you work, and
    // is banked without you ever having stopped
    expect(r.started).toBeGreaterThanOrEqual(r.due - 1);
    expect(r.awareness).toBeGreaterThan(0);
    expect(r.seen).toContain('c2-priority');
    // and the rest of the time it is genuinely just a radio
    expect(r.fillerWasReal).toBe(true);
    expect(r.fillerCount).toBeGreaterThan(1);
  });

  test('an unbought radio means the item goes out on a band nobody heard',
    async ({ page }) => {
      await boot(page);
      const r = await page.evaluate(() => {
        const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
        L.resetRun(g.run);
        g.run.shift = 2;
        g.go('shift');
        for (let i = 0; i < 60 * 200 && g.screen === 'shift'; i++) {
          g.tick(1 / 60);
          if (g.screen === 'shift') sc.stamp(null);
        }
        return { awareness: g.run.awareness, radio: sc.radioText() };
      });
      expect(r.awareness).toBe(0);
      expect(r.radio).toBe(null);
    });

  test('the yard camera shows the lorry for a while and then does not',
    async ({ page }) => {
      await boot(page);
      await enterShift(page, 4, ['camera']);
      const r = await page.evaluate(() => {
        const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
        // before it arrives there is nothing in the yard and looking says so
        const early = { up: !!sc.dockUp, ok: sc.lookDock(), why: sc.lastAction };
        let guard = 0;
        while (!sc.dockUp && guard++ < 60 * 120) g.tick(1 / 60);
        const arrived = !!sc.dockUp;
        const opened = sc.lookDock();
        const kind = sc.open ? sc.open.clue.kind : null;
        for (let i = 0; i < Math.ceil((L.readTime(sc.open.clue) + 0.5) * 60); i++) {
          g.tick(1 / 60);
        }
        sc.closeInquiry();
        return { early, arrived, opened, kind, awareness: g.run.awareness, window: L.DOCK_WINDOW };
      });
      expect(r.early.up).toBe(false);
      expect(r.early.ok).toBe(false);
      expect(r.early.why).toBe('dockidle');
      expect(r.arrived).toBe(true);
      expect(r.opened).toBe(true);
      expect(r.awareness).toBeGreaterThan(0);
    });

  test('a lorry nobody looked at is loaded and gone', async ({ page }) => {
    await boot(page);
    await enterShift(page, 4, ['camera']);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
      let guard = 0;
      while (!sc.dockUp && guard++ < 60 * 120) g.tick(1 / 60);
      const arrived = !!sc.dockUp;
      const passed0 = sc.shift.marksPassed;
      for (let i = 0; i < Math.ceil((L.DOCK_WINDOW + 1) * 60); i++) g.tick(1 / 60);
      return { arrived, gone: !sc.dockUp, passed: sc.shift.marksPassed - passed0 };
    });
    expect(r.arrived).toBe(true);
    expect(r.gone).toBe(true);
    // it was written down as gone by; line 5 may have lost one in the same
    // stretch, which is exactly what happens to somebody watching a camera
    expect(r.passed).toBeGreaterThanOrEqual(1);
  });
});

test.describe('the basket at the station', () => {
  test('it is emptied during the shift, and the foreman pays for it',
    async ({ page }) => {
      await boot(page);
      const r = await page.evaluate(() => {
        const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
        const E = window.SOL.econ;
        L.resetRun(g.run);
        g.run.shift = 1;
        g.go('shift');
        for (let i = 0; i < 60 * 6; i++) g.tick(1 / 60);

        const before = { done: sc.binDone, open: !!sc.bin };
        const opened = sc.openBin(g);
        const items = sc.bin.items.length;
        const marked = sc.bin.items.filter((x) => x.marked).length;
        // the line all but stops while the basket is open
        g.tick(1 / 60); g.tick(1 / 60);
        for (let i = 0; i < 20; i++) g.tick(1 / 60);
        const rate = sc.lineRate;

        // the harness sorts the rest and reads whatever was marked
        if (sc.bin) {
          for (let n = 0; n < 40 && sc.bin; n++) {
            const next = sc.bin.items.findIndex((x) => !x.gone);
            if (next < 0) break;
            sc.sortItem(next, g);
            if (sc.open) {
              const need = window.SOL.logic.readTime(sc.open.clue) + 0.2;
              for (let k = 0; k < Math.ceil(need * 60); k++) g.tick(1 / 60);
              sc.closeInquiry();
            }
          }
          if (sc.bin) sc.closeBin(g);
        }
        return {
          before, opened, items, marked, rate,
          done: sc.binDone,
          scrip: sc.shift.binScrip,
          sorted: sc.shift.trashSorted,
          rateEarned: E.BIN_SCRIP,
          again: sc.openBin(g)
        };
      });
      expect(r.before.done).toBe(false);
      expect(r.opened).toBe(true);
      expect(r.items).toBe(6);
      // exactly one thing in it is marked, on a shift that has something
      expect(r.marked).toBe(1);
      expect(r.rate).toBeLessThan(0.3);
      expect(r.done).toBe(true);
      expect(r.sorted).toBe(true);
      expect(r.scrip).toBe(r.rateEarned);
      // and it is a chore you do once a night
      expect(r.again).toBe(false);
    });

  test('the marked paper is the only thing in it that opens', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
      L.resetRun(g.run);
      g.run.shift = 1;
      g.go('shift');
      for (let i = 0; i < 60 * 4; i++) g.tick(1 / 60);
      sc.openBin(g);
      const markIdx = sc.bin.items.findIndex((x) => x.marked);

      // everything that is not marked just goes
      const opens = [];
      sc.bin.items.forEach((it, idx) => {
        if (idx === markIdx) return;
        sc.sortItem(idx, g);
        opens.push(!!sc.open);
      });
      const beforeMark = g.run.awareness;
      sc.sortItem(markIdx, g);
      const openedIt = !!sc.open;
      const kind = sc.open ? sc.open.clue.kind : null;
      for (let i = 0; i < Math.ceil((L.readTime(sc.open.clue) + 0.3) * 60); i++) {
        g.tick(1 / 60);
      }
      sc.closeInquiry();
      return { opens, openedIt, kind, beforeMark, after: g.run.cluesSeen.slice() };
    });
    // five ordinary things, none of which is anything
    expect(r.opens).toEqual([false, false, false, false, false]);
    expect(r.openedIt).toBe(true);
    expect(r.after).toContain('c1-pedal');
  });

  test('a basket left alone is a thing nobody found', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
      L.resetRun(g.run);
      g.run.shift = 1;
      g.go('shift');
      for (let i = 0; i < 60 * 200 && g.screen === 'shift'; i++) {
        g.tick(1 / 60);
        if (g.screen === 'shift') sc.stamp(null);
      }
      const rec = g.run.shiftLog[0];
      return {
        screen: g.screen,          // straight to the sheet, no interstitial
        sorted: rec.trashSorted,
        binScrip: rec.pay.bin,
        passed: rec.marksPassed,
        awareness: g.run.awareness
      };
    });
    expect(r.screen).toBe('summary');
    expect(r.sorted).toBe(false);
    expect(r.binScrip).toBe(0);
    expect(r.awareness).toBe(0);
    // what was in it went out with the skip, and nothing said so
    expect(r.passed).toBeGreaterThan(0);
  });
});

/* goal.md: it must not be obvious that anything is wrong. Only a player
   who actively goes looking should end up understanding, and the moment
   they do is a single named item — not a shift number. */
test.describe('the reveal', () => {
  test('nothing in the shift clues names the customer', async ({ page }) => {
    await boot(page);
    const leaks = await page.evaluate(() => {
      const L = window.SOL.logic, C = window.SOL.content, out = [];
      /* Words that would hand it over. The reveal item is exempt — it is
         the one place the game is allowed to say it. */
      const tells = new RegExp([
        'nazi', 'hitler', 'reich', 'gestapo', 'wehrmacht', 'luftwaffe',
        'german', 'berlin', 'final solution', 'auschwitz', 'holocaust',
        '\\bjew', 'armaments', 'concentration'
      ].join('|'), 'i');
      const scan = (id, s) => { if (tells.test(s)) out.push(id + ': ' + s); };
      L.SHIFTS.forEach((s) => {
        const sc = C.shift(s.n);
        scan('brief ' + s.n, sc.brief);
        scan('note ' + s.n, sc.note);
        scan('title ' + s.n, sc.title);
        L.cluesFor(s.n).forEach((c) => {
          scan(c.id, c.kind + ' ' + c.source + ' ' + c.lines.join(' '));
        });
      });
      C.RADIO_FILLER.forEach((f, i) => scan('filler ' + i, f));
      // and the chrome the player stares at from the title screen onward
      scan('shell', document.getElementById('plate').textContent);
      scan('menu', C.TITLE + ' ' + C.SUBTITLE + ' ' + C.HOWTO_NOTE);
      return out;
    });
    expect(leaks).toEqual([]);
  });

  test('the reveal is the one item that says it, and it says it once',
    async ({ page }) => {
      await boot(page);
      const r = await page.evaluate(() => {
        const L = window.SOL.logic;
        return {
          says: /\bthe final solution\b/i.test(L.REVEAL.lines.join(' ')),
          via: L.REVEAL.via,
          inShiftClues: L.SHIFTS.some((s) =>
            L.cluesFor(s.n).some((c) => c.id === L.REVEAL.id)),
          heaviest: L.CLUES.every((c) => c === L.REVEAL || c.weight < L.REVEAL.weight)
        };
      });
      expect(r.says).toBe(true);
      expect(r.inShiftClues).toBe(false);   // belongs to no shift
      expect(r.via).toBe('trash');          // and to the bottom of the bin
      expect(r.heaviest).toBe(true);
    });

  test('a run that never looks never sees it', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
      L.resetRun(g.run);
      const passed = [];
      for (let n = 1; n <= L.SHIFT_COUNT; n++) {
        g.run.shift = n;
        g.go('shift');
        // head down, press only: the basket is never touched
        for (let i = 0; i < 60 * 200 && g.screen === 'shift'; i++) {
          g.tick(1 / 60);
          if (g.screen === 'shift') sc.stamp(null);
        }
        passed.push(g.run.shiftLog[n - 1].marksPassed);
      }
      return {
        revealed: g.run.revealed,
        awareness: g.run.awareness,
        canStop: L.canStop(g.run, L.newShift(6)),
        offered: passed.reduce((a, b) => a + b, 0),
        /* What the six shifts actually put within reach of this player.
           Not the whole registry: the officer never called, and the two
           bought channels were never bought. */
        seen: g.run.shiftLog.reduce((a, s) => a + s.marksSeen, 0)
      };
    });
    expect(r.revealed).toBe(false);
    expect(r.awareness).toBe(0);
    // and with it, the master stop stays shut: there is nothing you could
    // say if they asked you why
    expect(r.canStop).toBe('unreasoned');
    /* Everything the run had to offer went past unfound, on all four
       channels, and at no point did the game say so. */
    expect(r.offered).toBe(r.seen);
    expect(r.offered).toBeGreaterThan(10);
  });

  test('a player using every channel reaches it on shift 3', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
      L.resetRun(g.run);
      // the curious player has bought the set and the camera, and sorts the bin
      g.run.ledger.owned = ['radio', 'camera'];
            const seenPerShift = [];
      for (let n = 1; n <= 3; n++) {
        g.run.shift = n;
        g.go('shift');
        for (let i = 0; i < 60 * 200 && g.screen === 'shift'; i++) {
          if (!sc.binDone && !sc.bin && !sc.open) window.__emptyBin();
          const r = sc.nearestReturn();
          if (r && r.clue && !sc.open) sc.look(r.x);
          if (sc.dockUp && !sc.open) sc.lookDock();
          g.tick(1 / 60);
          if (sc.open && sc.open.read) sc.closeInquiry();
          if (g.screen === 'shift' && !sc.open) sc.stamp(null);
        }
        seenPerShift.push(g.run.cluesSeen.slice());
      }
            return {
        revealed: g.run.revealed,
        on: g.run.revealedOn,
        beforeShift3: seenPerShift[1].indexOf(L.REVEAL.id) >= 0,
        ids: seenPerShift[2],
        awareness: g.run.awareness,
        min: L.REVEAL_MIN_AWARENESS,
        tier: L.awarenessTier(g.run)
      };
    });
    expect(r.beforeShift3).toBe(false);     // never earlier than the third
    expect(r.awareness).toBeGreaterThanOrEqual(r.min);
    expect(r.revealed).toBe(true);
    expect(r.on).toBe(3);
    expect(r.ids).toContain('reveal-circular');
    expect(r.tier).toBe('know');
  });

  /* Line 5 on its own cannot reach it at all, however diligently it is
     worked: the circular is at the bottom of the basket and there is no
     other way to it. The basket on its own does reach it, but not until
     the fifth shift, with one night left to do anything about it. */
  test('line 5 on its own never comes to it', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
      L.resetRun(g.run);
      for (let n = 1; n <= L.SHIFT_COUNT; n++) {
        g.run.shift = n;
        g.go('shift');
        for (let i = 0; i < 60 * 200 && g.screen === 'shift'; i++) {
          const car = sc.nearestReturn();
          if (car && car.clue && !sc.open) sc.look(car.x);
          g.tick(1 / 60);
          if (sc.open && sc.open.read) sc.closeInquiry();
          if (g.screen === 'shift' && !sc.open) sc.stamp(null);
        }
      }
      return {
        revealed: g.run.revealed,
        awareness: g.run.awareness,
        binsSorted: g.run.binsSorted,
        canStop: L.canStop(g.run, L.newShift(6))
      };
    });
    expect(r.binsSorted).toBe(0);
    expect(r.awareness).toBeGreaterThan(0);
    expect(r.revealed).toBe(false);
    // and with it, walking off the line stays shut for the whole quarter
    expect(r.canStop).toBe('unreasoned');
  });

  test('the basket on its own reaches it, and late', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
      L.resetRun(g.run);
      for (let n = 1; n <= L.SHIFT_COUNT; n++) {
        g.run.shift = n;
        g.go('shift');
        for (let i = 0; i < 60 * 200 && g.screen === 'shift'; i++) {
          if (!sc.binDone && !sc.bin && !sc.open) window.__emptyBin();
          g.tick(1 / 60);
          if (sc.open && sc.open.read) sc.closeInquiry();
          if (g.screen === 'shift' && !sc.open) sc.stamp(null);
        }
      }
      return { revealed: g.run.revealed, on: g.run.revealedOn };
    });
    expect(r.revealed).toBe(true);
    // two shifts later than a player who also turned pieces over
    expect(r.on).toBeGreaterThan(3);
  });

  /* Both free channels, nothing bought. The circular must not be behind a
     price — the radio and the camera buy more of the story and a wider
     margin, never the ending itself. */
  test('the two free channels together are enough, and on time', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
      L.resetRun(g.run);
            for (let n = 1; n <= 3; n++) {
        g.run.shift = n;
        g.go('shift');
        for (let i = 0; i < 60 * 200 && g.screen === 'shift'; i++) {
          if (!sc.binDone && !sc.bin && !sc.open) window.__emptyBin();
          const car = sc.nearestReturn();
          if (car && car.clue && !sc.open) sc.look(car.x);
          g.tick(1 / 60);
          if (sc.open && sc.open.read) sc.closeInquiry();
          if (g.screen === 'shift' && !sc.open) sc.stamp(null);
        }
      }
            return {
        revealed: g.run.revealed, on: g.run.revealedOn,
        owned: g.run.ledger.owned.length, tier: L.awarenessTier(g.run)
      };
    });
    expect(r.owned).toBe(0);
    expect(r.revealed).toBe(true);
    expect(r.on).toBe(3);
    expect(r.tier).toBe('know');
  });
});

test.describe('awareness bands', () => {
  test('tiers rise with cumulative weight and cover the full range', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const L = window.SOL.logic;
      const seen = [];
      for (let a = 0; a <= L.MAX_AWARENESS; a++) {
        const t = L.awarenessTier(a);
        if (seen[seen.length - 1] !== t) seen.push(t);
      }
      return {
        order: seen,
        zero: L.awarenessTier(0),
        full: L.awarenessTier(L.MAX_AWARENESS),
        frac: L.awarenessFraction(L.MAX_AWARENESS)
      };
    });
    expect(r.zero).toBe('none');
    expect(r.full).toBe('sure');
    expect(r.frac).toBe(1);
    expect(r.order).toEqual(['none', 'trace', 'doubt', 'know', 'sure']);
  });

  test('reading everything in the run reaches the top band', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const L = window.SOL.logic;
      const run = L.newRun();
      L.CLUES.forEach((c) => L.recordClue(run, null, c));
      return { awareness: run.awareness, tier: L.awarenessTier(run), max: L.MAX_AWARENESS };
    });
    expect(r.awareness).toBe(r.max);
    expect(r.tier).toBe('sure');
  });

  test('the shift record carries awareness forward', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const L = window.SOL.logic;
      const run = L.newRun();
      const sh = L.newShift(1);
      sh.stamped = 24;
      // a weighted one: the first three items of shift 1 are tips
      const weighted = L.CLUES.find((c) => c.weight > 0);
      L.recordClue(run, sh, weighted);
      L.closeShift(run, sh);
      return run.shiftLog[0];
    });
    expect(r.awareness).toBeGreaterThan(0);
    expect(r.tier).toBe('trace');
    expect(r.opened).toHaveLength(1);
  });
});
