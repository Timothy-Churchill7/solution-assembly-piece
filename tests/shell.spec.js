const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { boot, clickAt, screenName, ROOT } = require('./helpers');

const REQUIRED_ATTRIBUTION =
  "Concept inspired by 'Solution,' a fictional game described in Gabrielle " +
  "Zevin's novel Tomorrow, and Tomorrow, and Tomorrow (2022). This is an " +
  "independent, non-commercial fan project. It is not affiliated with, " +
  "endorsed by, or reviewed by the author or publisher.";

test.describe('shell', () => {
  test('boots from file:// with no console errors', async ({ page }) => {
    const errors = await boot(page);
    expect(await screenName(page)).toBe('menu');
    expect(errors).toEqual([]);
  });

  test('canvas is sized and actually painted', async ({ page }) => {
    await boot(page);
    const info = await page.evaluate(() => {
      const c = document.getElementById('screen');
      const x = c.getContext('2d');
      const d = x.getImageData(0, 0, c.width, c.height).data;
      let lit = 0;
      for (let i = 0; i < d.length; i += 4 * 97) if (d[i] > 12) lit++;
      return { w: c.width, h: c.height, lit };
    });
    expect(info.w).toBeGreaterThanOrEqual(1200);
    expect(info.h).toBeGreaterThanOrEqual(750);
    expect(info.lit).toBeGreaterThan(50); // not a black rectangle
  });

  /* The palette is a deliberate cool grey rather than mathematically
     neutral, so HSV saturation is the honest measure of "desaturated".
     It is only meaningful on pixels bright enough to see: in near-black,
     8-bit quantisation alone produces large nominal saturation. */
  test('menu carries no colour outside the reserved accent', async ({ page }) => {
    await boot(page, '?still=1');
    const m = await page.evaluate(() => {
      const c = document.getElementById('screen');
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let sum = 0, saturated = 0, n = 0, max = 0;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        if (mx < 60) continue;                    // not visible content
        const s = (mx - mn) / mx;
        sum += s; n++;
        if (s > max) max = s;
        if (s > 0.30) saturated++;
      }
      return { mean: sum / n, max, saturatedFraction: saturated / n, n };
    });
    expect(m.n).toBeGreaterThan(5000);            // there is content to judge
    expect(m.mean).toBeLessThan(0.15);
    expect(m.saturatedFraction).toBeLessThan(0.0005);
  });

  /* goal.md reserves the accent for inquiry alone. It used to be spent on
     the marked crates that rode the belt — a lit box with a tag on it, which
     is a game pointing at its own story. Those are gone. The only amber left
     in the build is the rule and the heading on an item already in your
     hands, so the running line must now be entirely colourless and the
     reading card must not be. Both halves are asserted here. */
  test('the accent appears only once something is already in your hands',
    async ({ page }) => {
      await boot(page);

      /* Measured against the whole frame rather than only lit pixels:
         opening an item dims the hall, which halves the lit count and would
         inflate a lit-relative ratio for a fixed amount of amber. */
      const measure = () => page.evaluate(() => {
        const c = document.getElementById('screen');
        const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        let warm = 0, lit = 0, total = 0;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          total++;
          if (Math.max(r, g, b) < 60) continue;
          lit++;
          // amber is the only hue in the build: red well clear of blue
          if (r - b > 34 && r > g && g > b) warm++;
        }
        return { warmFraction: warm / total, lit };
      });

      /* A working shift, with everything on the bench, at the moment a
         carrier is in the bay and a lorry is at the dock — that is, with
         every channel of the game live at once and nothing yet touched. */
      await page.evaluate(() => {
        const g = window.SOL.game, sc = window.SOL.screens.shift;
        window.SOL.logic.resetRun(g.run);
        g.run.ledger.owned = ['lamp', 'gauge', 'radio', 'camera'];
        g.run.shift = 4;
        g.go('shift');
        for (let i = 0; i < 60 * 200 && g.screen === 'shift'; i++) {
          const r = sc.nearestReturn();
          if (r && r.clue && sc.dockUp) break;
          g.tick(1 / 60);
          if (i % 3 === 0) sc.stamp(null);
        }
        g.step(0.02);
      });
      const working = await page.evaluate(() => {
        const sc = window.SOL.screens.shift;
        const r = sc.nearestReturn();
        return { carrier: !!(r && r.clue), lorry: !!sc.dockUp, radio: !!sc.radioText() };
      });
      const plain = await measure();

      // and with that item turned over and read through
      await page.evaluate(() => {
        const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
        sc.look(null);
        for (let i = 0; i < Math.ceil(L.readTime(sc.open.clue) * 60) + 6; i++) g.tick(1 / 60);
        g.step(0.02);
      });
      const opened = await measure();

      // the frame really did have everything live on it
      expect(working.carrier).toBe(true);
      expect(working.lorry).toBe(true);
      expect(working.radio).toBe(true);
      expect(plain.lit).toBeGreaterThan(5000);
      /* And not one warm pixel. A player looking at this screen is given
         no reason whatever to think there is anything on it. */
      expect(plain.warmFraction).toBe(0);
      // the item in your hands does, and it is the only thing that does
      expect(opened.warmFraction).toBeGreaterThan(0.0004);
      expect(opened.warmFraction).toBeLessThan(0.01);
    });
});

/* goal.md allows the seal, the real name and the colour red on exactly one
   screen: the letter that closes the run. What these hold is the "one
   screen" part, because any of the three leaking anywhere earlier would
   turn an accusation into decoration and give away in shift 1 what the
   piece spends six shifts withholding. */
test.describe('the one screen', () => {
  const CHROME = ['menu', 'credits', 'howto', 'brief', 'stores', 'ending'];

  /* Red is not in the palette. It exists as one literal inside letter.js
     and nowhere else in the build, and this measures the actual pixels
     rather than trusting that. */
  const redFraction = (page) => page.evaluate(() => {
    const c = document.getElementById('screen');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let red = 0, total = 0;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      total++;
      // the seal: clearly red, clearly not the amber accent
      if (r > 90 && r - g > 55 && r - b > 55 && g - b < 26) red++;
    }
    return red / total;
  });

  test('no screen but the letter has any red on it', async ({ page }) => {
    await boot(page);
    for (const name of CHROME) {
      await page.evaluate((n) => {
        const g = window.SOL.game, L = window.SOL.logic;
        L.resetRun(g.run);
        g.run.revealed = true; g.run.revealedOn = 3; g.run.awareness = 30;
        g.run.stamped = 180; g.run.shift = 4;
        g.go(n);
        g.redraw();
      }, name);
      expect(await redFraction(page), name).toBe(0);
    }

    // and a shift with every channel live on it, including a lorry at the dock
    await page.evaluate(() => {
      const g = window.SOL.game, sc = window.SOL.screens.shift, L = window.SOL.logic;
      L.resetRun(g.run);
      g.run.ledger.owned = ['lamp', 'gauge', 'radio', 'camera'];
      g.run.shift = L.SHIFT_COUNT;
      g.go('shift');
      for (let i = 0; i < 60 * 200 && g.screen === 'shift'; i++) {
        const r = sc.nearestReturn();
        if (r && r.clue && sc.dockUp) break;
        g.tick(1 / 60);
        if (i % 3 === 0) sc.stamp(null);
      }
      g.step(0.02);
    });
    expect(await redFraction(page), 'the last shift').toBe(0);

    // the letter, and only the letter
    await page.evaluate(() => {
      const g = window.SOL.game;
      g.go('letter');
      g.redraw();
    });
    const onLetter = await redFraction(page);
    expect(onLetter).toBeGreaterThan(0.0002);
    // a seal, not a flag: a trace of the frame and no more
    expect(onLetter).toBeLessThan(0.01);
  });

  test('the real name is on the letter and nowhere else', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const C = window.SOL.content, L = window.SOL.logic;
      const everywhere = [];
      const add = (w, s) => { if (s) everywhere.push([w, String(s)]); };
      L.SHIFTS.forEach((s) => {
        const sc = C.shift(s.n);
        add('brief ' + s.n, sc.brief + ' ' + sc.note + ' ' + (sc.welcome || ''));
        L.cluesFor(s.n).forEach((c) => add(c.id, c.lines.join(' ') + c.source + c.kind));
      });
      add('reveal', C.REVEAL.lines.join(' '));
      L.ENDINGS.forEach((id) => add('ending ' + id, C.ENDINGS[id].title + C.ENDINGS[id].body));
      C.RADIO_FILLER.forEach((f, i) => add('filler ' + i, f));
      add('refusal', C.REFUSAL_NOTE);
      add('shell', document.getElementById('plate').textContent + ' ' + document.title);
      const name = /himmler|reichsf/i;
      return {
        leaks: everywhere.filter(([, s]) => name.test(s)).map(([w]) => w),
        signature: C.LETTER_SIGNATURE,
        signatory: C.LETTER_SIGNATORY,
        office: C.LETTER_OFFICE
      };
    });
    expect(r.leaks).toEqual([]);
    expect(r.signature).toBe('Heinrich Himmler');
    expect(r.signatory).toMatch(/REICHSF/);
    expect(r.office).toMatch(/REICHSF/);
  });

  test('the build still has no image assets to leak one', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => ({
      images: document.querySelectorAll('img, svg, picture, canvas:not(#screen)').length,
      icons: document.querySelectorAll('link[rel*="icon"]').length,
      title: document.title
    }));
    expect(r.images).toBe(0);
    expect(r.icons).toBe(0);
    expect(r.title).not.toMatch(/reich|nazi|solution final/i);
  });

  /* The About screen has to describe the build it actually is. It said
     "no insignia" for most of this project's life and that stopped being
     true the day the letter got a seal. */
  test('the content note describes the build honestly', async ({ page }) => {
    await boot(page);
    const note = await page.evaluate(() => window.SOL.content.CRAFT_NOTE);
    expect(note).toMatch(/swastika/i);
    expect(note).toMatch(/last screen|letter/i);
    expect(note).toMatch(/only colour|only color/i);
    // and it still says what the build does not do
    expect(note).toMatch(/no photographs/i);
    expect(note).toMatch(/celebrat|endorse/i);
  });
});

test.describe('navigation', () => {
  test('menu -> about -> back, by mouse', async ({ page }) => {
    await boot(page);
    await clickAt(page, 200, 446);           // ABOUT
    expect(await screenName(page)).toBe('credits');
    await clickAt(page, 230, 585);           // BACK
    expect(await screenName(page)).toBe('menu');
  });

  test('menu -> instructions -> back, by keyboard', async ({ page }) => {
    await boot(page);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    expect(await page.evaluate(() => window.SOL.screens.menu.index)).toBe(2);
    await page.keyboard.press('Enter');
    expect(await screenName(page)).toBe('howto');
    await page.keyboard.press('Escape');
    expect(await screenName(page)).toBe('menu');
  });

  test('menu selection wraps', async ({ page }) => {
    await boot(page);
    await page.keyboard.press('ArrowUp');
    expect(await page.evaluate(() => window.SOL.screens.menu.index)).toBe(2);
  });
});

test.describe('attribution', () => {
  test('exact paragraph is present in content', async ({ page }) => {
    await boot(page);
    const flat = await page.evaluate(() => window.SOL.content.ATTRIBUTION);
    expect(flat).toBe(REQUIRED_ATTRIBUTION);
  });

  test('italic run list reassembles to the exact paragraph', async ({ page }) => {
    await boot(page);
    const joined = await page.evaluate(() =>
      window.SOL.content.ATTRIBUTION_RUNS.map((r) => r.t).join(''));
    expect(joined).toBe(REQUIRED_ATTRIBUTION);
  });

  test('about screen is reachable from the main menu', async ({ page }) => {
    await boot(page);
    const ids = await page.evaluate(() => window.SOL.content.MENU_ITEMS.map((i) => i.id));
    expect(ids).toContain('credits');
    await clickAt(page, 200, 446);
    expect(await screenName(page)).toBe('credits');
  });

  test('README carries the attribution and the lineage sentence', async () => {
    const p = path.join(ROOT, 'README.md');
    expect(fs.existsSync(p)).toBe(true);
    const md = fs.readFileSync(p, 'utf8');
    const norm = md.replace(/\*/g, '').replace(/\s+/g, ' ');
    expect(norm).toContain(REQUIRED_ATTRIBUTION.replace(/\s+/g, ' '));
    expect(md).toMatch(/Romero/);
    expect(md).toMatch(/serious games/i);
  });
});

/* Every sound in the build is called through the same optional shape the
   codebase uses everywhere else, and a mistyped name in that shape does
   nothing at all — silently, forever. The source is scanned here and the
   names checked against what the audio module actually exposes. */
test.describe('sound', () => {
  test('every sound the game asks for exists', async ({ page }) => {
    const fs = require('fs');
    const path = require('path');
    const { ROOT } = require('./helpers');

    const dir = path.join(ROOT, 'js');
    const wanted = new Set();
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.js') || f === 'audio.js') continue;
      const src = fs.readFileSync(path.join(dir, f), 'utf8');
      for (const m of src.matchAll(/SOL\.audio\.([a-zA-Z_$][\w$]*)/g)) {
        wanted.add(m[1]);
      }
    }
    expect(wanted.size).toBeGreaterThan(8);

    await boot(page);
    const have = await page.evaluate(() => {
      const out = [];
      for (const k in window.SOL.audio) {
        if (typeof window.SOL.audio[k] === 'function') out.push(k);
      }
      return out;
    });
    const missing = [...wanted].filter((k) => have.indexOf(k) < 0).sort();
    expect(missing).toEqual([]);
  });

  /* Line 5 grew three verbs that all borrowed sounds from somewhere else,
     so a reach, a look and a scrap were audibly the same act. */
  test('the station\'s verbs do not share a sound', async ({ page }) => {
    await boot(page);
    const r = await page.evaluate(() => {
      const src = {};
      ['stamp', 'stampShort', 'stampAuto', 'lift', 'turn', 'scrap',
       'paper', 'radio', 'lever', 'reveal', 'tick'].forEach((k) => {
        src[k] = String(window.SOL.audio[k]);
      });
      return src;
    });
    const bodies = Object.entries(r);
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        expect(bodies[i][1], bodies[i][0] + ' vs ' + bodies[j][0])
          .not.toBe(bodies[j][1]);
      }
    }
  });
});

/* goal.md's hard constraint: not one sentence, phrase or line of in-game
   copy may come from the novel. Nothing here can diff against a book it
   does not have, so it does the next honest thing — it checks that the
   build has not drifted toward the source at all. Every proper noun the
   novel owns is absent, the title appears only inside the required
   attribution, and no run of copy is presented as a quotation. */
test.describe('nothing from the novel', () => {
  const collect = (page) => page.evaluate(() => {
    const C = window.SOL.content, L = window.SOL.logic;
    const out = [];
    const add = (where, s) => { if (s) out.push([where, String(s)]); };

    L.SHIFTS.forEach((s) => {
      const sc = C.shift(s.n);
      add('brief ' + s.n, sc.brief);
      add('note ' + s.n, sc.note);
      add('title ' + s.n, sc.title);
      add('welcome ' + s.n, sc.welcome);
    });
    L.CLUES.forEach((c) => {
      add(c.id, c.kind + ' ' + c.source + ' ' + c.lines.join(' '));
    });
    L.ENDINGS.forEach((id) => {
      add('ending ' + id, C.ENDINGS[id].title + ' ' + C.ENDINGS[id].body);
    });
    C.RADIO_FILLER.forEach((f, i) => add('filler ' + i, f));
    C.HOWTO.forEach((r, i) => add('howto ' + i, r.k + ' ' + r.v));
    Object.keys(C.STORE_ITEMS).forEach((k) => {
      const it = C.STORE_ITEMS[k];
      add('store ' + k, it.name + ' ' + it.note + ' ' + it.blurb);
    });
    Object.keys(C.SUMMARY_LINES).forEach((k) => add('signoff ' + k, C.SUMMARY_LINES[k]));
    ['TITLE', 'SUBTITLE', 'HOWTO_NOTE', 'PLANT_NAME', 'TRASH_SAID',
     'TRASH_NOTHING', 'PAY_BONUS_NOTE', 'STORE_NOTE', 'STORE_EMPTY',
     'ENDING_NOTE', 'SAMPLE_FLAGGED', 'CRAFT_NOTE'].forEach((k) => add(k, C[k]));
    return out;
  });

  test('no name, place or game the novel owns appears anywhere', async ({ page }) => {
    await boot(page);
    const copy = await collect(page);
    expect(copy.length).toBeGreaterThan(40);
    /* Characters, studios and the games-within-the-book. If any of these
       ever turns up in this build, somebody has been writing from memory
       of the novel instead of writing. */
    const owned = new RegExp('\\b(' + [
      'sadie', 'masur', 'sam masur', 'marx', 'watanabe', 'dov', 'mizrah',
      'ichigo', 'mapletown', 'emilyblaster', 'counterpart high',
      'master of the revels', 'unfair games', 'pioneers', 'zevin'
    ].join('|') + ')\\b', 'i');
    const hits = copy.filter(([, s]) => owned.test(s)).map(([w]) => w);
    expect(hits).toEqual([]);
  });

  test('the novel is named once, in the attribution, and nowhere else',
    async ({ page }) => {
      await boot(page);
      const copy = await collect(page);
      const title = /tomorrow,? and tomorrow/i;
      expect(copy.filter(([, s]) => title.test(s)).map(([w]) => w)).toEqual([]);

      const r = await page.evaluate(() => {
        const C = window.SOL.content;
        return {
          attribution: C.ATTRIBUTION,
          rejoined: C.ATTRIBUTION_RUNS.map((x) => x.t).join('')
        };
      });
      // it is in the one place goal.md requires it, worded exactly
      expect(r.attribution).toContain('Tomorrow, and Tomorrow, and Tomorrow');
      expect(r.rejoined).toBe(r.attribution);
    });

  test('no line of in-game copy is presented as a quotation', async ({ page }) => {
    await boot(page);
    const copy = await collect(page);
    /* A quoted run of six words or more would be somebody else talking.
       Everything in this build is the plant, or the player, or a man on
       his way out of the door, and none of them is being cited. */
    const quoted = /["“][^"”]*(\s+\S+){5,}[^"”]*["”]/;
    const hits = copy.filter(([, s]) => quoted.test(s)).map(([w]) => w);
    expect(hits).toEqual([]);
  });

  test('the required attribution is on the about screen, verbatim',
    async ({ page }) => {
      await boot(page);
      const r = await page.evaluate(() => {
        const g = window.SOL.game;
        g.go('credits');
        g.redraw();
        const C = window.SOL.content;
        return {
          reachable: g.screen === 'credits',
          runs: C.ATTRIBUTION_RUNS.map((x) => x.t).join(''),
          required: C.ATTRIBUTION,
          lineage: C.LINEAGE
        };
      });
      expect(r.reachable).toBe(true);
      expect(r.runs).toBe(r.required);
      expect(r.lineage).toContain('Brenda Romero');
    });
});

/* The piece only works if the player knows, while they are playing, that
   the only thing at stake is money. A player who does not know that can
   tell themselves afterwards they were afraid, and the whole argument
   collapses into a story about coercion. It is said in three places and
   this is what keeps it said. */
test.describe('what is actually at stake', () => {
  test('the handbook, the brief and the letter all say it is only the pay',
    async ({ page }) => {
      await boot(page);
      const r = await page.evaluate(() => {
        const C = window.SOL.content;
        return {
          handbook: C.HOWTO_STAKES,
          brief: C.REFUSAL_NOTE,
          footer: C.LETTER_FOOTER,
          letters: window.SOL.logic.LETTERS.map((id) => C.LETTERS[id].body)
        };
      });

      // the handbook, before any of it matters
      expect(r.handbook).toMatch(/bonus/i);
      expect(r.handbook).toMatch(/entire consequence|nothing else|only/i);
      expect(r.handbook).toMatch(/nobody comes down to the floor/i);

      // the brief, on the first shift after finding out
      expect(r.brief).toMatch(/bonus/i);
      expect(r.brief).toMatch(/no penalty|nothing worse|only thing/i);

      // and the office itself, on every letter, at the end
      expect(r.footer).toMatch(/no proceedings/i);
      for (const body of r.letters) {
        expect(body).toMatch(/bonus|notation/i);
      }
    });

  /* Nothing anywhere may threaten the player with anything else. If a line
     ever implies the plant or the customer will do something to them, the
     excuse is back and the piece has been let off. */
  test('nothing in the build threatens the player with anything worse',
    async ({ page }) => {
      await boot(page);
      const hits = await page.evaluate(() => {
        const C = window.SOL.content, L = window.SOL.logic;
        const all = [];
        const add = (w, s) => { if (s) all.push([w, String(s)]); };
        L.SHIFTS.forEach((s) => {
          const sc = C.shift(s.n);
          add('brief ' + s.n, sc.brief + ' ' + sc.note);
          L.cluesFor(s.n).forEach((c) => add(c.id, c.lines.join(' ')));
        });
        add('reveal', C.REVEAL.lines.join(' '));
        add('refusal', C.REFUSAL_NOTE);
        L.LETTERS.forEach((id) => add('letter ' + id, C.LETTERS[id].body));
        add('footer', C.LETTER_FOOTER);
        L.ENDINGS.forEach((id) => add('ending ' + id, C.ENDINGS[id].body));
        Object.keys(C.SUMMARY_LINES).forEach((k) => add('signoff ' + k, C.SUMMARY_LINES[k]));
        C.HOWTO.forEach((h, i) => add('howto ' + i, h.v));

        const threat = /\b(arrest|arrested|shot|shoot|prison|camp|police|denounce|denounced|reported to|taken away|disappear|punish|punished|punishment)\b/i;
        return all.filter(([, s]) => threat.test(s)).map(([w]) => w);
      });
      expect(hits).toEqual([]);
    });
});
