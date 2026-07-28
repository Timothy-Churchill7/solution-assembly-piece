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
     pixels. Every shift now ends at the bin, so a test that wants a closed
     shift has to say what it did with it — `binPolicy` is that choice,
     defaulted to what almost every player will actually do. */
  await page.evaluate(() => {
    window.__binPolicy = 'tip';
    window.__clearBin = function () {
      const g = window.SOL.game, tr = window.SOL.screens.trash;
      if (g.screen !== 'trash') return false;
      if (window.__binPolicy === 'sort') {
        tr.sort(g);
        // sorting may open whatever was in it; read it through, then go
        if (tr.open) {
          const need = window.SOL.logic.readTime(tr.open.clue) + 0.2;
          for (let i = 0; i < Math.ceil(need * 60); i++) g.tick(1 / 60);
          tr.close_(g);
        }
      } else {
        tr.tip(g);
      }
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
