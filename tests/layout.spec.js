/* layout.spec.js — the cards have to fit on the card.

   Every posted notice in the build is sized by adding named constants
   together, and every time the station has grown a duty one of them has
   quietly stopped adding up: the stores ran a hundred pixels off the
   bottom of the stage, the handbook printed its BACK button over the last
   two rows, and the end-of-shift sheet overflowed as soon as a late shift
   had scrap, returns, short-struck work and a flagged sample at once.

   Screenshots caught the first two, and only because they were looked at.
   This file catches them without being looked at. */
const { test, expect } = require('@playwright/test');
const { boot } = require('./helpers');

const HEADER_BOTTOM = 34;
const FOOTER_TOP = 750 - 31;

function fits(card, where) {
  expect(card, where).toBeTruthy();
  expect(card.y, `${where} top`).toBeGreaterThanOrEqual(HEADER_BOTTOM);
  expect(card.y + card.h, `${where} bottom`).toBeLessThanOrEqual(FOOTER_TOP);
}

test.describe('posted notices fit between the rails', () => {
  test('the handbook, with every row the station has grown', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const g = window.SOL.game;
      g.go('howto');
      g.redraw();
      const sc = window.SOL.screens.howto;
      return { card: sc.card, back: sc.hits[0], rows: window.SOL.content.HOWTO.length };
    });
    fits(r.card, 'handbook');
    expect(r.rows).toBeGreaterThanOrEqual(8);
    // the BACK button is inside the card and clear of the last row
    expect(r.back.y).toBeGreaterThanOrEqual(r.card.y);
    expect(r.back.y + r.back.h).toBeLessThanOrEqual(r.card.y + r.card.h);
  });

  /* The handbook wraps its explanations now that they say more than a
     few words each. Before it did, a sentence that outgrew the card ran
     off the side of it in silence. This checks the wrap is real and that
     no row has grown into a paragraph. */
  test('every handbook explanation wraps to its plate, in one or two lines',
    async ({ page }) => {
      await boot(page);
      const r = await page.evaluate(() => {
        const g = window.SOL.game, D = window.SOL.D, C = window.SOL.content;
        const ctx = document.getElementById('screen').getContext('2d');
        g.go('howto');
        g.redraw();
        const pw = window.SOL.screens.howto.card.w - 88;
        const opt = { size: 12.5, lineHeight: 16 };
        return C.HOWTO.map((row) => ({
          k: row.k,
          lines: D.wrap(ctx, row.v, pw, opt).length,
          widest: Math.max.apply(null, D.wrap(ctx, row.v, pw, opt)
            .map((l) => Math.round(D.measure(ctx, l, opt))))
        }));
      });
      const pw = 1200 - 336 - 88;
      expect(r.filter((x) => x.widest > pw)).toEqual([]);
      expect(r.filter((x) => x.lines > 2)).toEqual([]);
    });

  test('every shift brief, including the one with the addendum', async ({ page }) => {
    await boot(page);
    for (const n of [1, 2, 3, 4, 5, 6]) {
      const card = await page.evaluate((n) => {
        const g = window.SOL.game;
        g.run.shift = n;
        g.go('brief');
        g.redraw();
        return window.SOL.screens.brief.card;
      }, n);
      fits(card, `brief ${n}`);
    }
  });

  /* The worst end-of-shift sheet the game can produce: a late shift with
     the scrap chute cut, work sent back, good stock pulled in error, the
     feeder running, and something read on the line. */
  test('the end-of-shift sheet at its very fullest', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, L = window.SOL.logic;
      L.resetRun(g.run);
      const sh = L.newShift(6);
      sh.stamped = 44; sh.missed = 9; sh.scrapped = 4;
      sh.rejects = 5; sh.late = true; sh.readSecs = 41; sh.marksPassed = 2;
      sh.pulled = 11; sh.pulledFaulty = 8; sh.pulledSound = 3; sh.autoStamped = 19;
      L.closeShift(g.run, sh);
      g.go('summary');
      g.redraw();
      const sc = window.SOL.screens.summary;
      const rec = g.run.shiftLog[0];
      return {
        card: sc.card,
        button: sc.hits[0],
        usable: rec.usable,
        cols: sc.columns(rec)
      };
    });
    // the case really is the full one, or the test is proving nothing
    expect(r.usable).toBe(39);
    expect(r.cols.sheet.length).toBe(6);
    expect(r.cols.own.length).toBe(7);
    fits(r.card, 'summary');
    expect(r.button.y + r.button.h).toBeLessThanOrEqual(r.card.y + r.card.h);
  });

  test('the end-of-shift sheet at its emptiest', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const g = window.SOL.game, L = window.SOL.logic;
      L.resetRun(g.run);
      const sh = L.newShift(1);
      sh.stamped = 26;
      L.closeShift(g.run, sh);
      g.go('summary');
      g.redraw();
      const sc = window.SOL.screens.summary;
      return { card: sc.card, cols: sc.columns(g.run.shiftLog[0]) };
    });
    fits(r.card, 'summary, empty');
    // nothing happened worth recording, so the right-hand column is one row
    expect(r.cols.own.length).toBe(1);
  });
});

/* Eight endings, eight different lengths of copy, one card. */
test.describe('the last screen', () => {
  test('every ending fits between the rails', async ({ page }) => {
    await boot(page);
    const ids = await page.evaluate(() => window.SOL.logic.ENDINGS);
    expect(ids).toHaveLength(8);
    for (const id of ids) {
      const r = await page.evaluate((id) => {
        const g = window.SOL.game, L = window.SOL.logic;
        L.resetRun(g.run);
        // stand a run up with plausible figures, then force the branch
        g.run.stamped = 214; g.run.rejects = 96; g.run.looked = 31;
        g.run.binsSorted = 4; g.run.awareness = 39;
        g.run.ledger.earned = 470; g.run.ledger.spent = 325;
        g.run.revealed = true; g.run.revealedOn = 3;
        g.go('ending');
        const sc = window.SOL.screens.ending;
        sc.res = Object.assign(L.resolveEnding(g.run), { id: id });
        g.redraw();
        return { card: sc.card, button: sc.hits[0] };
      }, id);
      fits(r.card, `ending ${id}`);
      expect(r.button.y + r.button.h, id).toBeLessThanOrEqual(r.card.y + r.card.h);
      expect(r.button.y, id).toBeGreaterThanOrEqual(r.card.y);
    }
  });

  /* The figures are two columns of label-and-value, and the value is right
     aligned to the column edge — so a long label and a long value meet in
     the middle and print through each other. One of them did. */
  test('no figure label runs into its own value', async ({ page }) => {
    await boot(page);
    const over = await page.evaluate(() => {
      const g = window.SOL.game, L = window.SOL.logic, D = window.SOL.D;
      const ctx = document.getElementById('screen').getContext('2d');
      L.resetRun(g.run);
      g.run.stamped = 9999; g.run.rejects = 8888;
      g.run.looked = 999; g.run.binsSorted = 6;
      g.run.ledger.earned = 9999; g.run.ledger.spent = 9999;
      // the widest the awareness value ever gets
      g.run.awareness = L.MAX_AWARENESS;
      g.go('ending');
      g.redraw();
      const sc = window.SOL.screens.ending;
      const colW = Math.floor((sc.card.w - 88 - 48) / 2);
      const figs = sc.figures(sc.res);
      const bad = [];
      figs.left.concat(figs.right).forEach((row) => {
        const lw = D.measure(ctx, row[0], { size: 10, track: 2.2 });
        const vw = D.measure(ctx, String(row[1]), { size: 10.5, track: 2.2 });
        // 12px of daylight between the two, at the very least
        if (lw + vw + 12 > colW) bad.push(row[0] + ' + ' + row[1]);
      });
      return bad;
    });
    expect(over).toEqual([]);
  });
});

/* Three letters, three lengths of copy, one sheet of paper. */
test.describe('the letter', () => {
  test('every letter fits between the rails', async ({ page }) => {
    await boot(page);
    const ids = await page.evaluate(() => window.SOL.logic.LETTERS);
    expect(ids).toHaveLength(3);
    for (const id of ids) {
      const r = await page.evaluate((id) => {
        const g = window.SOL.game, L = window.SOL.logic;
        L.resetRun(g.run);
        g.run.stamped = 214; g.run.rejects = 96;
        g.go('letter');
        const sc = window.SOL.screens.letter;
        sc.res = Object.assign(L.resolveLetter(g.run), { id: id });
        g.redraw();
        return { card: sc.card, button: sc.hits[0] };
      }, id);
      fits(r.card, `letter ${id}`);
      expect(r.button.y + r.button.h, id).toBeLessThanOrEqual(r.card.y + r.card.h);
      expect(r.button.y, id).toBeGreaterThanOrEqual(r.card.y);
    }
  });
});
