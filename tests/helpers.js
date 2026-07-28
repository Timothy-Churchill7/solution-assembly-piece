const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const PAGE = pathToFileURL(path.join(ROOT, 'index.html')).href;
const SHOTS = path.join(ROOT, 'shots');

/* Load the game and wait for boot. Collects console errors so a broken
   screen fails loudly instead of rendering something plausible. */
async function boot(page, query = '') {
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(PAGE + query);
  // Hit regions are built during draw, so wait for real frames, not just boot.
  await page.waitForFunction(() => window.SOL && window.SOL.ready === true &&
    window.SOL.game.frame > 3);

  /* Page-side conveniences for tests that drive the run rather than the
     pixels. The bin is emptied at the station during a shift now, so there
     is no interstitial to clear — `__emptyBin` does the chore from the
     outside, sorting every item and reading whatever was marked. */
  await page.evaluate(() => {
    window.__binPolicy = 'skip';
    window.__clearBin = function () { return false; };

    /* Emptying the basket is a clocking-off chore — the foreman asks for
       it "before you clock off" — so the harness does it in the last third
       of the shift, which is when a player would. It matters: what is in
       the basket is resolved when it is opened, so a bin emptied at the
       start of shift 3 has not yet earned the circular and one emptied at
       the end has. */
    window.__emptyBin = function (anyTime) {
      const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
      if (g.screen !== 'shift' || sc.binDone || sc.bin) return false;
      if (!anyTime && sc.shift.timeLeft > sc.shift.cfg.duration * 0.35) return false;
      if (!sc.openBin(g)) return false;
      for (let n = 0; n < 40 && sc.bin; n++) {
        const next = sc.bin.items.findIndex((i) => !i.gone);
        if (next < 0) break;
        sc.sortItem(next, g);
        if (sc.open) {
          const need = L.readTime(sc.open.clue) + 0.2;
          for (let i = 0; i < Math.ceil(need * 60); i++) g.tick(1 / 60);
          sc.closeInquiry();
        }
      }
      if (sc.bin) sc.closeBin(g);
      return true;
    };

    /* Answer the man from the works office, whichever way the caller
       wants. Defaults to the upgrade, which is what most people take. */
    window.__officerPolicy = 'upgrade';
    window.__clearOfficer = function () {
      const g = window.SOL.game, sc = window.SOL.screens.officer, L = window.SOL.logic;
      if (g.screen !== 'officer') return false;
      if (window.__officerPolicy === 'answer') {
        sc.askAnswer(g);
        const need = L.readTime(sc.open.clue) + 0.2;
        for (let i = 0; i < Math.ceil(need * 60); i++) g.tick(1 / 60);
      } else {
        sc.takeUpgrade(g);
      }
      sc.close_(g);
      return true;
    };
  });

  page.__errors = errors;
  return errors;
}

/* Deterministic frame: stop time, force one draw, then screenshot. */
async function still(page, t = 9) {
  await page.evaluate((tt) => window.SOL.game.freeze(tt), t);
  await page.waitForTimeout(60);
}

async function shot(page, name) {
  if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, name + '.png') });
}

/* Click in canvas logical coordinates (1200x750 space). */
async function clickAt(page, lx, ly) {
  const box = await page.locator('#screen').boundingBox();
  const sx = box.width / 1200, sy = box.height / 750;
  await page.mouse.click(box.x + lx * sx, box.y + ly * sy);
}

async function moveTo(page, lx, ly) {
  const box = await page.locator('#screen').boundingBox();
  const sx = box.width / 1200, sy = box.height / 750;
  await page.mouse.move(box.x + lx * sx, box.y + ly * sy);
}

const screenName = (page) => page.evaluate(() => window.SOL.game.screen);

module.exports = { ROOT, PAGE, SHOTS, boot, still, shot, clickAt, moveTo, screenName };
