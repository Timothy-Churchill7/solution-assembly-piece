# Playtest notes

Everything below was measured by driving the real screens headlessly, not
estimated. Re-measure with `npx playwright test` after any change to
`js/econ.js` or `js/logic.js` — the numbers move together.

## How to play it

Open `index.html`. No server, no build step. It also runs from a static
host unchanged.

| key | at the station |
| --- | --- |
| `SPACE` / click the belt | stamp the part in the press zone |
| `A` / click line 5 | take a piece off the return line |
| `E` | turn over the piece in the inspection bay and look at it |
| `D` | look at the yard camera (only if you bought one) |
| `X` | scrap a part (from shift 3) |
| `F` | press depth — only if you have found out who the customer is |
| `Q` | master stop — same condition, and from shift 5 |

## What to check by hand

These are the things the suite cannot judge.

1. **Can you tell a fault from a sound piece on line 5 without the gauge?**
   It should take looking, and it should not take squinting. Shift 6 is the
   hard case: the hall is at its darkest there and the inspection bay is
   deliberately lit at full regardless.
2. **Does the first shift teach the job without a tutorial?** You get two
   lines at the station (the press waits; line 5 is yours too), a pencilled
   note on the brief, and nothing else.
3. **Is the bin genuinely tempting to skip?** `TIP IT OUT` is first, free,
   and recommended by a man on his way out. If sorting ever feels like the
   obvious choice, the channel has stopped working.
4. **Does anything on the shift screen look like it wants clicking?** It
   must not. A test asserts there is no colour on it; only your own eye can
   say whether the composition is pointing anywhere.
5. **Read the eight endings back to back.** None may read as praise or as a
   scolding.

## Measured balance

Parts stamped against target, playing the whole job honestly — press *and*
line 5, every fault taken off. `*` is a shift the number was not made.

| bench | 1 | 2 | 3 | 4 | 5 | 6 |
| --- | --- | --- | --- | --- | --- | --- |
| nothing | 33/24 | 36/28 | 38/33 | 38/38 | 39/43 \* | 39/48 \* |
| sorting arm (85) | 33/24 | 37/28 | 39/33 | 40/38 | 42/43 \* | 42/48 \* |
| foot pedal (110) | 33/24 | 39/28 | 43/33 | 43/38 | 43/43 | 43/48 \* |
| pedal + arm (195) | 33/24 | 39/28 | 43/33 | 44/38 | 46/43 | 47/48 \* |
| auto-feeder (240) | 33/24 | 38/28 | 44/33 | 48/38 | 54/43 | 56/48 |

And the same player ignoring line 5 entirely, which is the other way to
play it:

| | 1 | 2 | 3 | 4 | 5 | 6 |
| --- | --- | --- | --- | --- | --- | --- |
| nothing, line 5 left to run | 33/24 | 37/28 | 40/33 | 42/38 | 43/43 | 44/48 \* |

**The shape this is meant to have.** Spend nothing and the schedule beats
you at shift 5, whichever way you play. Ignore line 5 to keep the count up
and the deductions take the money you would have bought the kit with. Only
the auto-feeder carries the last shift outright, and it costs 240 against a
best-case run of about 570 — so buying it is giving up the radio and the
camera, which are the two things that would have told you what any of this
was for.

## Pay, unaided, doing the whole job

Per shift, and cumulative:

`78 (78) · 81 (159) · 83 (242) · 83 (325) · 59 (384) · 59 (443)`

The two shifts where the number is missed cost the 25 bonus, which is why
the last two are 59. Catalogue total is **705**; nobody finishes with all
of it.

## Line 5, per shift

| | 1 | 2 | 3 | 4 | 5 | 6 |
| --- | --- | --- | --- | --- | --- | --- |
| pieces passing | 14 | 16 | 18 | 21 | 23 | 26 |
| of those, faults | 1 | 2 | 3 | 5 | 7 | 9 |

Faults are dealt at the shift's rate rather than rolled per piece, so a
shift always brings exactly this many. Every one that gets past you is
fitted at the assembly works, found there, and docked at 3 scrip.

## Finding things out

Maximum awareness is **39**; the circular needs **8** and can only come out
of the bin from shift 3. Four channels:

- **a faulty piece on line 5** — free, costs a cycle, and turning it over
  does *not* take it off the belt, so the fault still goes past you
- **the bench radio (60)** — reads its item out over the ordinary
  programme, in the same voice, with no prompt
- **the yard camera (95)** — a lorry is at the dock for 26 seconds and then
  is not
- **the bin by the door** — every shift, sorting it costs 6 scrip

The two free channels used diligently reach the circular on shift 3 with
nothing bought — a test holds that, because the reveal must never sit
behind a price. One channel alone never reaches it.

## Run length

420 seconds of line time across six shifts, plus the brief, the bin, the
sheet and the stores between each. Call it twelve to fifteen minutes.

## Known rough edges

- **The bin is four clicks' worth of interstitial per shift** (bin → sheet
  → stores → brief). Each earns its place, but the sequence is long, and a
  player replaying to chase a different ending will feel it.
- **The dock monitor covers one machine's asset number** on the right of
  the hall. Cosmetic; the monitor is a fitting on the wall and reads as one.
- **`pedal + arm` finishes shift 6 one part short** at the cadence the test
  harness plays at. A human with better rhythm may close it; I have not
  confirmed that by hand, and it is the one balance number in the build I
  would want a real playtester on.
- **The radio is text only.** There is a blip when a line arrives and no
  voice under it. That is a deliberate limit of a build with no asset
  files, but it does mean the set is quieter than a real one would be.

## What the suite covers

153 tests. The load-bearing ones, if you only read a few:

- `econ.spec.js` — the schedule outruns a pair of unaided hands
- `returns.spec.js` — the catalogue is a ladder, and the reach off line 5
  costs the same however it is timed
- `inquiry.spec.js` — every channel is reachable, costs something, and can
  be missed
- `ending.spec.js` — the count, the bonus and the book decide nothing
- `layout.spec.js` — every posted notice fits between the rails
- `shell.spec.js` — no colour on a working shift; nothing from the novel
