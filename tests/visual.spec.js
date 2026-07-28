/* Screenshot capture for human (and self-) review.
   These are not pixel-comparison tests — they render each key moment to
   shots/ so the frames can be looked at and criticised. */
const { test } = require('@playwright/test');
const { boot, still, shot, clickAt, moveTo } = require('./helpers');

test.describe.configure({ mode: 'serial' });

test('shots: menu', async ({ page }) => {
  await boot(page);
  await still(page, 9);
  await shot(page, '01-menu');
});

test('shots: menu with pointer hover', async ({ page }) => {
  await boot(page);
  await moveTo(page, 200, 446);
  await still(page, 9);
  await shot(page, '02-menu-hover');
});

test('shots: about / attribution', async ({ page }) => {
  await boot(page);
  await clickAt(page, 200, 446);
  await still(page, 9);
  await shot(page, '03-about');
});

test('shots: instructions', async ({ page }) => {
  await boot(page);
  await clickAt(page, 200, 508);
  await still(page, 9);
  await shot(page, '04-instructions');
});

test('shots: shift brief', async ({ page }) => {
  await boot(page);
  await page.keyboard.press('Enter');
  await still(page, 9);
  await shot(page, '05-brief');
});

test('shots: mid-shift, line running', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game, sc = window.SOL.screens.shift;
    g.run.shift = 1;
    g.go('shift');
    // run a while and work at a realistic, imperfect rate
    for (let i = 0; i < 60 * 26; i++) {
      g.tick(1 / 60);
      if (i % 3 === 0 && sc.candidate()) sc.stamp(null);
    }
    g.step(0.02);
  });
  await still(page);
  await shot(page, '06-shift-running');
});

test('shots: the press striking', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game, sc = window.SOL.screens.shift;
    g.run.shift = 1;
    g.go('shift');
    for (let i = 0; i < 60 * 26; i++) {
      g.tick(1 / 60);
      if (i % 3 === 0 && sc.candidate()) sc.stamp(null);
    }
    // catch the ram at the bottom of its travel
    while (sc.candidate() === null) g.tick(1 / 60);
    sc.stamp(null);
    g.step(0.09);
  });
  await still(page);
  await shot(page, '07-press-strike');
});

/* A carrier in the bay: a faulty piece with something on it, and nothing
   whatever on the screen to say so. If this frame ever looks different
   from an ordinary one, the channel has started announcing itself. */
test('shots: a piece worth turning over, unannounced', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game, sc = window.SOL.screens.shift;
    g.run.shift = 3;
    g.go('shift');
    for (let i = 0; i < 60 * 200 && g.screen === 'shift'; i++) {
      const r = sc.nearestReturn();
      if (r && r.clue) break;
      g.tick(1 / 60);
      if (i % 3 === 0) sc.stamp(null);
    }
    g.step(0.02);
  });
  await still(page);
  await shot(page, '08-carrier-in-the-bay');
});

/* The same piece, turned over. The line has not stopped. */
test('shots: an item part-read, the line still running', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game, sc = window.SOL.screens.shift;
    g.run.shift = 3;
    g.go('shift');
    for (let i = 0; i < 60 * 200 && g.screen === 'shift'; i++) {
      const r = sc.nearestReturn();
      if (r && r.clue) break;
      g.tick(1 / 60);
      if (i % 3 === 0) sc.stamp(null);
    }
    sc.look(null);
    g.step(2.0);
  });
  await still(page);
  await shot(page, '09-item-opening');
});

/* And read through, with what it cost showing on the sheet behind it. */
test('shots: an item read through', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
    g.run.shift = 6;
    g.go('shift');
    for (let i = 0; i < 60 * 200 && g.screen === 'shift'; i++) {
      const r = sc.nearestReturn();
      if (r && r.clue) break;
      g.tick(1 / 60);
      if (i % 3 === 0) sc.stamp(null);
    }
    sc.look(null);
    for (let i = 0; i < Math.ceil(L.readTime(sc.open.clue) * 60) + 4; i++) g.tick(1 / 60);
    g.step(0.02);
  });
  await still(page);
  await shot(page, '10-item-read');
});

test('shots: end of shift', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game, sc = window.SOL.screens.shift;
    g.run.shift = 1;
    g.go('shift');
    for (let i = 0; i < 60 * 200; i++) {
      g.tick(1 / 60);
      if (i % 3 === 0 && g.screen === 'shift' && sc.candidate()) sc.stamp(null);
      if (g.screen === 'summary') break;
    }
  });
  await still(page, 9);
  await shot(page, '08-summary');
});

test('shots: the depth stop set shallow', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game, sc = window.SOL.screens.shift;
    g.run.revealed = true;        // the circular has been read
    g.run.shift = 3;
    g.go('shift');
    for (let i = 0; i < 60 * 30; i++) {
      g.tick(1 / 60);
      if (!sc.shallow) sc.setShallow(true);
      if (i % 3 === 0 && sc.candidate()) sc.stamp(null);
    }
    sc.notice = null;             // let the station speak for itself
    g.step(0.02);
  });
  await still(page);
  await shot(page, '13-station-shallow');
});

test('shots: the master stop, armed', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game, sc = window.SOL.screens.shift;
    g.run.revealed = true;
    g.run.shift = 5;
    g.go('shift');
    for (let i = 0; i < 60 * 24; i++) {
      g.tick(1 / 60);
      if (i % 3 === 0 && sc.candidate()) sc.stamp(null);
    }
    sc.stopLine(g);               // arms it; a second press would end the shift
    g.step(0.02);
  });
  await still(page);
  await shot(page, '14-stop-armed');
});

test('shots: end of a shift that was quietly wrecked', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
    g.run.revealed = true;
    g.run.shift = 4;
    g.go('shift');
    for (let i = 0; i < 60 * 200 && g.screen === 'shift'; i++) {
      if (!sc.shallow) sc.setShallow(true);
      g.tick(1 / 60);
      if (g.screen === 'shift' && i % 3 === 0 && sc.candidate()) sc.stamp(null);
    }
    window.__clearBin();
    // the sample found one, which is the version of this screen worth looking at
    const rec = g.run.shiftLog[g.run.shiftLog.length - 1];
    rec.flagged = true;
    window.SOL.screens.summary.rec = rec;
    g.step(0.02);
  });
  await still(page, 9);
  await shot(page, '15-summary-sabotage');
});

/* The one screen in the build that names anything, reached the only way it
   can be reached: two free channels used every shift, and then the bottom
   of the bin on the way out. */
test('shots: the circular, read through', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
    const tr = window.SOL.screens.trash;
    L.resetRun(g.run);
    for (let n = 1; n <= 3; n++) {
      g.run.shift = n;
      g.go('shift');
      for (let i = 0; i < 60 * 200 && g.screen === 'shift'; i++) {
        const car = sc.nearestReturn();
        if (car && car.clue && !sc.open) sc.look(null);
        g.tick(1 / 60);
        if (sc.open && sc.open.read) sc.closeInquiry();
        if (g.screen === 'shift' && !sc.open) sc.stamp(null);
      }
      tr.sort(g);
      if (tr.open && tr.open.clue.reveal) {
        // hold it open, fully surfaced, and stop here
        const need = Math.ceil((L.readTime(tr.open.clue) + 0.5) * 60);
        for (let k = 0; k < need; k++) g.tick(1 / 60);
        g.step(0.02);
        return;
      }
      if (tr.open) {
        const need = Math.ceil((L.readTime(tr.open.clue) + 0.3) * 60);
        for (let k = 0; k < need; k++) g.tick(1 / 60);
      }
      tr.close_(g);
      window.SOL.screens.summary.advance(g);
      if (g.screen === 'stores') window.SOL.screens.stores.leave_(g);
    }
  });
  await still(page);
  await shot(page, '16-the-reveal');
});

/* The moment after: the item is back on the belt and a control the player
   has looked past five times is suddenly worth reading. */
test('shots: the station, one control richer', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
    L.resetRun(g.run);
    g.run.revealed = true;      // as if the circular had just been closed
    g.run.shift = 4;
    g.go('shift');
    for (let i = 0; i < 60 * 18; i++) {
      g.tick(1 / 60);
      if (i % 3 === 0 && sc.candidate()) sc.stamp(null);
    }
    // fire the unlock line now, against a belt that has work on it
    sc.depthKnown = false;
    g.tick(1 / 60);
    g.step(0.02);
  });
  await still(page);
  await shot(page, '17-depth-unlocked');
});

/* ---------- the economy ---------- */

/* The stores after the first shift: enough on the book for one cheap thing
   and not nearly enough for the thing that would actually help. */
test('shots: the works stores, first time through', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game, sc = window.SOL.screens.shift;
    g.run.shift = 1;
    g.go('shift');
    for (let i = 0; i < 60 * 200 && g.screen === 'shift'; i++) {
      g.tick(1 / 60);
      if (g.screen === 'shift') sc.stamp(null);
    }
    window.__clearBin();
    window.SOL.screens.summary.advance(g);
  });
  await still(page, 9);
  await shot(page, '18-stores');
});

/* Later, with kit already on the bench, so the list shows all three states
   at once: owned, affordable, out of reach. */
test('shots: the stores with the bench half furnished', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game, L = window.SOL.logic;
    for (let n = 1; n <= 3; n++) {
      const sh = L.newShift(n);
      sh.stamped = sh.cfg.target + 2;
      L.closeShift(g.run, sh, 1);
    }
    g.run.ledger.owned = ['lamp', 'gauge'];
    g.run.ledger.scrip = 118;
    g.run.shift = 4;
    g.go('stores');
  });
  await still(page, 9);
  await shot(page, '19-stores-furnished');
});

/* Hovering a row that can be afforded. The only feedback in the list is a
   rule down the left edge — no colour, because the stores are plant
   business and the accent is not the plant's to spend. */
test('shots: the stores, a row under the pointer', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game;
    g.run.ledger.scrip = 300;
    g.run.shift = 3;
    g.go('stores');
    g.redraw();
  });
  await moveTo(page, 600, 470);
  await still(page, 9);
  await shot(page, '20-stores-hover');
});

/* The widest the pay stub ever gets: every deduction in play at once. This
   is the state that used to print SCHEDULE BONUS through the heading of the
   column beside it. */
test('shots: the stores after a docked shift', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game, E = window.SOL.econ;
    g.run.shiftLog.push({
      n: 4, target: 38,
      pay: E.payFor({ stamped: 40, target: 38, rejects: 5, late: true })
    });
    g.run.ledger.owned = ['lamp', 'radio'];
    g.run.ledger.scrip = 96;
    g.run.shift = 5;
    g.go('stores');
  });
  await still(page, 9);
  await shot(page, '23-stores-docked');
});

/* The first brief, carrying the pencilled addendum that is the only
   permission the build ever gives to go and look at things. */
test('shots: the first brief and its addendum', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game;
    g.run.shift = 1;
    g.go('brief');
  });
  await still(page, 9);
  await shot(page, '21-brief-welcome');
});

/* The console with the cycle meter part charged: the ram is down and the
   station is, briefly, not permitted to do anything. */
test('shots: the console mid-cycle', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game, sc = window.SOL.screens.shift;
    g.run.shift = 2;
    g.go('shift');
    for (let i = 0; i < 60 * 30; i++) {
      g.tick(1 / 60);
      if (g.screen === 'shift') sc.stamp(null);
    }
    // catch it partway back up
    sc.stamp(null);
    g.step(0.55);
  });
  await still(page);
  await shot(page, '22-cycle-charging');
});

/* The same screen after a shift where the player did look, so the
   unrecorded block below the sheet has something in it. */
test('shots: end of shift after looking', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game, sc = window.SOL.screens.shift;
    g.run.shift = 3;
    g.go('shift');
    for (let i = 0; i < 60 * 200; i++) {
      if (g.screen !== 'shift') break;
      const car = sc.nearestReturn();
      if (car && car.clue && !sc.open) sc.look(null);
      g.tick(1 / 60);
      if (sc.open && sc.open.read) sc.closeInquiry();
      if (g.screen === 'shift' && !sc.open && sc.candidate()) sc.stamp(null);
      if (g.screen === 'summary') break;
    }
  });
  await still(page, 9);
  await shot(page, '12-summary-aware');
});

/* ---------- line 5 ----------
   The second duty. What these have to show is that the station reads as
   two jobs at two distances without the return line either disappearing
   into the roof or competing with the press for the eye. */

test('shots: both lines running, a fault coming down line 5', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game, sc = window.SOL.screens.shift;
    g.run.shift = 4;
    g.go('shift');
    // run on until a fault is in the inspection zone, working the press
    for (let i = 0; i < 60 * 200; i++) {
      if (g.screen !== 'shift') break;
      if (sc.returns.some((r) => r.faulty && sc.inRetZone(r))) break;
      g.tick(1 / 60);
      if (i % 3 === 0) sc.stamp(null);
    }
    g.step(0.02);
  });
  await still(page);
  await shot(page, '24-two-lines');
});

/* The same moment with the lamp and the gauge on the bench: the fault is
   the same shape, and takes less looking for. */
test('shots: line 5 under the bench lamp and the gauge', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game, sc = window.SOL.screens.shift;
    g.run.ledger.owned = ['lamp', 'gauge'];
    g.run.shift = 4;
    g.go('shift');
    for (let i = 0; i < 60 * 200; i++) {
      if (g.screen !== 'shift') break;
      if (sc.returns.some((r) => r.faulty && sc.inRetZone(r))) break;
      g.tick(1 / 60);
      if (i % 3 === 0) sc.stamp(null);
    }
    g.step(0.02);
  });
  await still(page);
  await shot(page, '25-line5-lit');
});

/* Just after a reach across: the cycle meter has gone below empty and the
   station is paying for it. */
test('shots: the cycle in deficit after a reach', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game, sc = window.SOL.screens.shift;
    g.run.shift = 5;
    g.go('shift');
    for (let i = 0; i < 60 * 200; i++) {
      if (g.screen !== 'shift') break;
      if (sc.nearestReturn()) break;
      g.tick(1 / 60);
      if (i % 3 === 0) sc.stamp(null);
    }
    sc.charge = 0.35;
    sc.pull(null);
    g.step(0.25);
  });
  await still(page);
  await shot(page, '26-cycle-deficit');
});

/* The fullest sheet the game can produce, which is the case that used to
   run off the bottom of the stage. */
test('shots: end of shift, everything at once', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game, L = window.SOL.logic;
    L.resetRun(g.run);
    g.run.awareness = 30;
    g.run.revealed = true;
    const sh = L.newShift(6);
    sh.stamped = 44; sh.spoiled = 12; sh.missed = 9; sh.scrapped = 4;
    sh.rejects = 5; sh.late = true; sh.lostToInquiry = 7; sh.marksPassed = 2;
    sh.pulled = 11; sh.pulledFaulty = 8; sh.pulledSound = 3; sh.autoStamped = 19;
    L.closeShift(g.run, sh, 0);
    g.go('summary');
  });
  await still(page, 9);
  await shot(page, '27-summary-full');
});

/* And the handbook, which grew two rows this milestone. */
test('shots: the handbook with line 5 in it', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => window.SOL.game.go('howto'));
  await still(page, 9);
  await shot(page, '28-handbook');
});

/* ---------- the quiet channels ----------
   None of these may look like a game pointing at itself. */

test('shots: the bin by the door, first time', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game, L = window.SOL.logic;
    L.resetRun(g.run);
    const sh = L.newShift(1);
    sh.stamped = 31;
    g.go('trash', { shift: sh });
  });
  await still(page, 9);
  await shot(page, '29-the-bin');
});

test('shots: the bin on a later shift, nobody explaining it', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game, L = window.SOL.logic;
    L.resetRun(g.run);
    const sh = L.newShift(5);
    sh.stamped = 41;
    g.go('trash', { shift: sh });
  });
  await still(page, 9);
  await shot(page, '30-the-bin-later');
});

test('shots: something under the swarf', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game, L = window.SOL.logic;
    const tr = window.SOL.screens.trash;
    L.resetRun(g.run);
    const sh = L.newShift(5);
    sh.stamped = 41;
    g.go('trash', { shift: sh });
    tr.sort(g);
    for (let i = 0; i < Math.ceil(L.readTime(tr.open.clue) * 60) + 6; i++) g.tick(1 / 60);
    g.step(0.02);
  });
  await still(page, 9);
  await shot(page, '31-bin-found');
});

/* The bench set, mid-sentence, over a line that has not stopped. */
test('shots: the bench set reading something out', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game, sc = window.SOL.screens.shift;
    g.run.ledger.owned = ['radio'];
    g.run.shift = 2;
    g.go('shift');
    for (let i = 0; i < 60 * 200 && g.screen === 'shift'; i++) {
      if (sc.ambient && sc.ambient.shown > 1) break;
      g.tick(1 / 60);
      if (i % 3 === 0) sc.stamp(null);
    }
    g.step(0.02);
  });
  await still(page);
  await shot(page, '32-radio');
});

/* The yard camera with nothing in it, which is what it mostly shows. */
test('shots: the yard camera, empty', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game, sc = window.SOL.screens.shift;
    g.run.ledger.owned = ['camera'];
    g.run.shift = 4;
    g.go('shift');
    for (let i = 0; i < 60 * 16; i++) {
      g.tick(1 / 60);
      if (i % 3 === 0) sc.stamp(null);
    }
    g.step(0.02);
  });
  await still(page);
  await shot(page, '33-dock-empty');
});

/* And with a lorry at it. Nothing on the screen says so. */
test('shots: the yard camera, a lorry at the dock', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game, sc = window.SOL.screens.shift;
    g.run.ledger.owned = ['camera'];
    g.run.shift = 4;
    g.go('shift');
    for (let i = 0; i < 60 * 200 && g.screen === 'shift'; i++) {
      if (sc.dockUp) break;
      g.tick(1 / 60);
      if (i % 3 === 0) sc.stamp(null);
    }
    g.step(0.02);
  });
  await still(page);
  await shot(page, '34-dock-lorry');
});

/* ---------- the last screen ----------
   Three of the eight, chosen because they are the three the piece is
   actually about: the run that never knew, the run that knew and carried
   on, and the run that knew and quietly did not. */

const endingShot = (page, id, name) => page.evaluate((id) => {
  const g = window.SOL.game, L = window.SOL.logic;
  L.resetRun(g.run);
  g.run.stamped = 214; g.run.spoiled = 96; g.run.looked = 31;
  g.run.binsSorted = 4; g.run.awareness = 39;
  g.run.ledger.earned = 470; g.run.ledger.spent = 325;
  g.run.revealed = true; g.run.revealedOn = 3;
  g.go('ending');
  const sc = window.SOL.screens.ending;
  sc.res = Object.assign(L.resolveEnding(g.run), { id: id });
}, id);

test('shots: the ending, a run that never found out', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const g = window.SOL.game, L = window.SOL.logic;
    L.resetRun(g.run);
    g.run.stamped = 231; g.run.looked = 0; g.run.binsSorted = 0;
    g.run.ledger.earned = 452; g.run.ledger.spent = 240;
    g.run.ledger.owned = ['pedal', 'arm'];
    g.go('ending');
  });
  await still(page, 9);
  await shot(page, '35-ending-blind');
});

test('shots: the ending, a run that knew and carried on', async ({ page }) => {
  await boot(page);
  await endingShot(page, 'complicit');
  await still(page, 9);
  await shot(page, '36-ending-complicit');
});

test('shots: the ending, a run that knew and quietly did not', async ({ page }) => {
  await boot(page);
  await endingShot(page, 'quiet');
  await still(page, 9);
  await shot(page, '37-ending-quiet');
});
