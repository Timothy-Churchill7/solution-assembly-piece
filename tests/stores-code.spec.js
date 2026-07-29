/* stores-code.spec.js — the advertiser's code, and the second look.

   Two things a player only gets for looking at something with no bearing
   on the quota: a banner behind an aeroplane, and a lorry worth going over
   to the monitor for. Both are optional, both are missable, and both pay
   in the plant's own currency. */
const { test, expect } = require('@playwright/test');
const { boot } = require('./helpers');

test.describe('the advertiser\'s code', () => {
  test('F does nothing until a banner has actually been read',
    async ({ page }) => {
      await boot(page);
      const r = await page.evaluate(() => {
        const g = window.SOL.game, L = window.SOL.logic, E = window.SOL.econ;
        const st = window.SOL.screens.stores;
        L.resetRun(g.run);
        g.run.ledger.scrip = 500;
        g.go('stores');

        const cold = st.code_(g);
        const priceCold = E.priceOf(g.run.ledger, 'radio');

        // now read one, the way the shift screen would
        const ad = L.CLUES.filter((c) => c.via === 'plane')[0];
        L.recordClue(g.run, null, ad);
        const sawAd = g.run.sawAd;

        const warm = st.code_(g);
        const again = st.code_(g);      // it is not a toggle
        return {
          cold, warm, again, sawAd, priceCold,
          radio: E.priceOf(g.run.ledger, 'radio'),
          arm: E.priceOf(g.run.ledger, 'arm'),
          camera: E.priceOf(g.run.ledger, 'camera'),
          pedal: E.priceOf(g.run.ledger, 'pedal'),
          lamp: E.priceOf(g.run.ledger, 'lamp'),
          list: E.CATALOGUE.reduce((a, i) => (a[i.id] = i.cost, a), {})
        };
      });
      expect(r.cold).toBe(false);
      expect(r.priceCold).toBe(r.list.radio);
      expect(r.sawAd).toBe(true);
      expect(r.warm).toBe(true);
      expect(r.again).toBe(false);

      // the three lines that firm makes, and only those three
      expect(r.radio).toBe(Math.round(r.list.radio * 0.8));
      expect(r.arm).toBe(Math.round(r.list.arm * 0.8));
      expect(r.camera).toBe(Math.round(r.list.camera * 0.8));
      expect(r.pedal).toBe(r.list.pedal);
      expect(r.lamp).toBe(r.list.lamp);
    });

  test('the discount is what is actually charged at the counter',
    async ({ page }) => {
      await boot(page);
      const r = await page.evaluate(() => {
        const g = window.SOL.game, L = window.SOL.logic, E = window.SOL.econ;
        L.resetRun(g.run);
        const led = g.run.ledger;
        led.scrip = 100;
        g.run.sawAd = true;
        window.SOL.screens.stores.code_(g);
        const before = led.scrip;
        const bought = E.buy(led, 'radio');
        return { bought, before, after: led.scrip, spent: led.spent };
      });
      expect(r.bought).toBe(true);
      expect(r.before - r.after).toBe(48);   // 60 list, 48 with the code
      expect(r.spent).toBe(48);
    });
});

test.describe('the second look', () => {
  test('the black lorry is worth two for watching and three for going over',
    async ({ page }) => {
      await boot(page);
      const r = await page.evaluate(() => {
        const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
        function run(closer) {
          L.resetRun(g.run);
          g.run.ledger.owned = ['camera'];
          g.run.shift = 3;
          g.go('shift');
          for (let i = 0; i < 60 * 400 && g.screen === 'shift'; i++) {
            g.tick(1 / 60);
            if (sc.dockUp) break;
          }
          const clue = sc.dockUp;
          sc.lookDock();
          const took = closer ? sc.lookLorry() : false;
          const twice = closer ? sc.lookLorry() : false;   // once only
          return { aw: g.run.awareness, took, twice, base: clue.weight,
                   bonus: clue.clickWeight, opened: !!sc.open };
        }
        return { watched: run(false), wentOver: run(true) };
      });
      // and it never takes the hall away from you to say it
      expect(r.watched.opened).toBe(false);
      expect(r.wentOver.opened).toBe(false);
      expect(r.watched.aw).toBe(r.watched.base);
      expect(r.wentOver.took).toBe(true);
      expect(r.wentOver.twice).toBe(false);
      expect(r.wentOver.aw).toBe(r.wentOver.base + r.wentOver.bonus);
      expect(r.wentOver.aw).toBeGreaterThan(r.watched.aw);
    });
});

test.describe('the slips', () => {
  test('every paper channel puts something in reach on the shift it belongs to',
    async ({ page }) => {
      await boot(page);
      for (const via of ['slip', 'bgslip', 'plane']) {
        const r = await page.evaluate((via) => {
          const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
          const got = [];
          for (let n = 1; n <= L.SHIFT_COUNT; n++) {
            L.resetRun(g.run);
            g.run.shift = n;
            g.go('shift');
            const want = L.cluesVia(n, via, g.run.ledger).map((c) => c.id);
            if (!want.length) continue;
            for (let i = 0; i < 60 * 400 && g.screen === 'shift'; i++) {
              g.tick(1 / 60);
              if (via === 'slip') {
                const s = sc.returns.find((q) => q.bare && q.clue && sc.inRetZone(q));
                if (s && !sc.open) sc.look(s.x);
              }
              if (via === 'bgslip' && sc.bgUp && !sc.open) sc.lookBg();
              if (via === 'plane' && sc.planeUp && !sc.open) sc.lookPlane();
              if (sc.open && sc.open.read) sc.closeInquiry();
              if (g.screen === 'shift' && !sc.open) sc.stamp(null);
            }
            want.forEach((id) => {
              got.push(g.run.cluesSeen.indexOf(id) >= 0 ? id : 'MISSED ' + id);
            });
          }
          return got;
        }, via);
        expect(r.length, via).toBeGreaterThan(0);
        expect(r.filter((s) => s.startsWith('MISSED')), via).toEqual([]);
      }
    });

  /* The buy-a-radio notes stop turning up once there is a radio on the
     bench. A game that keeps handing them over after the fact has stopped
     paying attention to the player. */
  test('the buy-one-of-these notes stop once you have bought it',
    async ({ page }) => {
      await boot(page);
      const r = await page.evaluate(() => {
        const L = window.SOL.logic, E = window.SOL.econ;
        const bare = E.newLedger();
        const kitted = E.newLedger();
        kitted.owned = ['radio', 'camera'];
        const count = (led) => {
          let n = 0;
          for (let s = 1; s <= L.SHIFT_COUNT; s++) {
            L.CHANNELS.forEach((v) => { n += L.cluesVia(s, v, led).length; });
          }
          return n;
        };
        const gated = L.CLUES.filter((c) => c.unless).map((c) => c.id);
        return { bare: count(bare), kitted: count(kitted), gated };
      });
      expect(r.gated.length).toBeGreaterThan(0);
      expect(r.kitted).toBe(r.bare - r.gated.length);
    });
});
