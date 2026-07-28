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

**The cooldown belongs to the press and to nothing else.** A stamp that
lands puts it out for 1.72 seconds. Reaching across to line 5, turning a
piece over, and pressing for a part that is not there all leave it exactly
where it was. The foot pedal is the only thing in the game that changes
it.

## What to check by hand

These are the things the suite cannot judge.

1. **Can you tell a fault from a sound piece on line 5 without the gauge?**
   It should take looking, and it should not take squinting. Shift 6 is the
   hard case: the hall is at its darkest there and the inspection bay is
   deliberately lit at full regardless. The whole palette was lifted once
   already because the answer was no.
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

Parts stamped against target, playing the whole job — press *and* line 5,
every fault taken off. `*` is a shift the number was not made.

| bench | 1 | 2 | 3 | 4 | 5 | 6 |
| --- | --- | --- | --- | --- | --- | --- |
| nothing | 33/24 | 35/28 | 38/33 | 39/38 | 41/44 \* | 42/48 \* |
| sorting arm (40) | 33/24 | 35/28 | 38/33 | 39/38 | 41/44 \* | 42/48 \* |
| foot pedal (110) | 33/24 | 39/28 | 45/33 | 46/38 | 48/44 | 49/48 |
| auto-feeder (240) | 33/24 | 39/28 | 45/33 | 50/38 | 53/44 | 60/48 |

**Exactly two of the seven items change the count** — the foot pedal, which
cuts the cooldown by 15%, and the auto-feeder, which stamps 45% of line 4
without you. A test drives all seven and asserts that no other one moves
the number by a single part. The price list says so in plain words.

The sorting arm, the lamp, the gauge, the radio and the monitor buy sight,
sound, fewer deductions and fewer clicks. None of them buys output, and the
game no longer implies otherwise.

**The shape this is meant to have.** Buy nothing and the schedule beats you
on the fifth shift and again on the sixth. The pedal is the answer, the
handbook says so outright, and the docket in the shift-2 bin says so again.
Everything after that is what you do with the money you have left.

## Ignoring line 5

Same count either way — the cooldown does not care what your hands are
doing — but the deductions are ruinous:

| | 1 | 2 | 3 | 4 | 5 | 6 |
| --- | --- | --- | --- | --- | --- | --- |
| pay, doing the whole job | 78 | 80 | 83 | 84 | 61 | 62 |
| pay, line 5 left to run | 75 | 74 | 74 | 69 | 40 | 35 |

Cumulative: **448** against **367**. Eighty-one scrip is three-quarters of a
foot pedal, which is the thing that would have got the last two shifts
back. The sorting arm at 40 is priced just under the ~42 it saves you.

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

- **a faulty piece on line 5** — free. Turning it over does *not* take it
  off the belt, so the fault still goes past you, and the parts on line 4
  go past too while you read
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
- **The pedal makes the whole run comfortable.** Once it is on the bench no
  shift is in doubt, which is the price of making the cooldown legible and
  the advice honest. The tension after that is money, not output.
- **The radio is text only.** There is a blip when a line arrives and no
  voice under it. That is a deliberate limit of a build with no asset
  files, but it does mean the set is quieter than a real one would be.

## What the suite covers

156 tests. The load-bearing ones, if you only read a few:

- `econ.spec.js` — the schedule outruns a pair of unaided hands
- `returns.spec.js` — nothing but a stamp touches the cooldown, and exactly
  two purchases change the count
- `inquiry.spec.js` — every channel is reachable, costs something, and can
  be missed
- `ending.spec.js` — the count, the bonus and the book decide nothing
- `layout.spec.js` — every posted notice fits between the rails
- `shell.spec.js` — no colour on a working shift; nothing from the novel
