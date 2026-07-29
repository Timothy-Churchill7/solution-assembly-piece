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
| `X` | take a piece off the return line |
| click a piece on line 5 | look at it; it stays on the belt either way |
| click the basket | empty it, and sort what is in it |
| `D` | look at the yard camera (only if you bought one) |
| `S` | scrap a part (from shift 3) |
| `Q` | master stop — only once you have found out, and from shift 5 |

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
2. **Does the first shift teach the job without a tutorial?** You get the
   brief, two lines said at the station — the press waits, line 5 is yours
   too — and nothing else. The pencilled welcome that used to sit under the
   first brief is gone; check the shift still lands without it.
3. **Is the basket genuinely tempting to skip?** It is a chore, mid-shift,
   while the line is running and the clock is not slowed for it. It pays 2
   scrip and the foreman mentions it once. If emptying it ever feels
   automatic rather than like a decision to stop working, the channel has
   stopped working.
4. **Can you tell a warm split from a cold one at 1:1?** This is the thing
   I most doubt. Measured off the canvas on shift 6, brightest pixel on
   the stroke: bare, cold is `rgb(124,129,133)` and warm is
   `rgb(140,131,129)` — the blue-over-red bias flips from +9 to −11, at
   matched brightness, so the only difference is hue. Side by side and
   enlarged it is unmistakable. On a moving belt at actual size, with your
   attention on the press, I do not believe it is findable, and I have not
   found a way to prove otherwise from the outside.

   **The lamp is the answer to this, and that is deliberate.** With 50
   scrip of light on the bench the same two strokes read
   `rgb(162,169,173)` and `rgb(172,151,142)` — a swing of forty rather
   than twenty, and plainly two different colours. It is the most honest
   thing the lamp has ever done: it was sold as making faults take less
   looking, and it now also decides whether the free channel is legible at
   all.

   The marker has been five things — a redaction bar, a stripe, a strip of
   tape, a glint, and now nothing at all but the colour of the light off
   the break. Every step has been a reduction and this is the first one
   where I would not bet on a first-time player finding it unaided.
5. **Read the eight endings back to back.** None may read as praise or as a
   scolding.
6. **Read a clue with the shift running.** The line should slow enough to
   take the text in without hurrying, and the seconds ticking up in the
   corner should feel like the thing it is costing you.
7. **Read the closing letter cold, after a run that delivered.** It is the
   only screen that names the thing, and the only one with a seal, a real
   signature or any colour on it. It should read as a form somebody worked
   through in a stack — if it reads as gloating, it has let the player off.

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
handbook says so outright, and the tips in the basket say so again in
figures — the pedal's 15% on the second shift, the feeder's 45% on the
third. Everything after that is what you do with the money you have left.

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

Twenty-two things can be read across a run. Eight of them are worth nothing
at all — they are playing tips, mostly early, and they say plainly which
purchase pays and how the press works. The other fourteen carry weight:
**47** in total.

Two things stand between an operator and the circular, and they are
different kinds of thing on purpose.

**Eight points of awareness**, which is roughly the free channels worked
diligently from the third shift on, plus one thing you had to go out of
your way for.

**At least one item off a channel that cost you something.** The pieces on
line 5 and the basket at your feet are free and always open; a run that
uses only those never gets there, however diligent it is. Somewhere in what
you have read there has to be an item off the radio (60), off the yard
camera (95), or out of the mouth of the man from the works office (the 62
scrip you turn down to ask him a question).

Measured, playing every available channel every shift:

| what the run paid for | circular |
| --- | --- |
| nothing — line 5 and the basket only | **never**, at 23 awareness |
| the officer's answer, and no free reading | **never**, at 4 |
| the radio | shift 4 |
| the yard camera | shift 4 |
| the officer's answer | shift 4 |
| radio + camera + the answer | shift 4 |

The earliest it can arrive is the fourth shift, and there is no path to it
that costs nothing. That is a reversal: for most of this build's life the
reveal was deliberately payable for free, so that it could never be said to
sit behind a price. Finding out is a purchase the player makes against
their own interest now, because that is what the piece is about — the
operator who never finds out is not being punished by the game, they are
being described by it.

Every faulty piece sits crooked and carries a bright split — every one,
every time. A few of those splits run **warm** instead of cold white, and
that is the only signposting in the building. Nothing is drawn on top of a
part any more: there is no tape, no glint, no icon. The light coming off
the break has a different colour in it, and that is all.

Five channels:

- **a taped piece on line 5** — free. Clicking it turns it over; it does
  *not* take it off the belt, so you still have to reach for it afterwards
- **the basket at the station** — free, and it pays 2 scrip. Emptying it
  opens a sorting window mid-shift; one item in it is taped
- **the bench radio (60)** — reads its item out over the ordinary
  programme, in the same voice, with no prompt
- **the yard camera (95)** — a lorry is at the dock for 26 seconds and then
  is not
- **the man from the works office** — once, before the fourth shift, and
  only if you turn down the money

The circular is at the bottom of the basket and nowhere else, so a player
who never empties it never sees it whatever else they buy. But the basket
alone is not enough either — three tests state that rule once from each
side.

### The one question asked out loud

Before the fourth shift a man from the works office offers one of two
things and will not be drawn on the other. Measured over the last three
shifts:

| | pay, shifts 4–6 | run total |
| --- | --- | --- |
| take the heavier line | 104 · 82 · 83 | 510 |
| ask him where it goes | 84 · 61 · 62 | 448 |

Sixty-two scrip is a lamp and a gauge, or most of a camera. It is a real
offer and the screen states both sides of it in figures before you choose.

This was broken when it was first built and is worth recording. The upgrade
was written purely as more stock arriving — and the press cooldown, not the
belt, is what caps output, so the extra stock went by unstamped and the
offer paid **nothing whatever**. The trade only became a trade when it was
moved onto the piece rate, which goes 1 → 1.5 for the rest of the quarter.
A test now asserts the gap.

### What reading costs

**Opening an item throttles the line to 12%** so the text can actually be
read. It eases in and out over about a fifth of a second rather than
snapping. This is not a fiction — no factory slows for a man reading a
docket — it is the game giving you room.

The shift clock is deliberately *not* slowed, and that is where the cost
now lives: the clock burns at full speed while the line is barely turning,
so a minute spent reading is a minute of parts you never got the chance to
stamp. The card shows it live in seconds, and the summary carries it as
`SECONDS SPENT READING`.

Before this the belt ran at full speed behind the card and the text was
genuinely hard to read. The cost was real, but the player was being charged
for legibility rather than for choosing to look. One consequence worth
knowing: a faulty piece you read is still in the bay when you look up, so
reading a carrier no longer forfeits the fault it rode in on.

## Run length

420 seconds of line time across six shifts, plus the brief, the sheet and
the stores between each, and the works office once. The basket is emptied
during a shift now rather than after one, so there is one screen fewer
between shifts than there used to be. Call it twelve to fifteen minutes.

## Refusal, and what it costs

There is no hidden control. An earlier build had a depth stop on the press
that let you wreck the work while the plant's count went on being met; it
was removed, because it let refusal cost the player nothing and taught
them that the sheet is the only thing that can be fought.

What a station can withhold is what a station does, and the brief says so
in as many words the first time you clock on knowing:

- parts you do not stamp
- faults you let past on line 5
- sound stock you put down the scrap chute

All three land on the sheet and all three cost the bonus — **and that is
the entire consequence.** Nobody comes down to the floor, nothing is
confiscated and nobody calls at the house. The handbook says so before the
first shift, the brief says so again the first time you clock on knowing,
and the closing letter says it a third time in the office's own words: *no
proceedings arise from a contract closure.*

That is deliberate and it is load-bearing. A player who is not certain
refusal is safe can tell themselves afterwards that they were afraid, and
the piece becomes a story about coercion instead of one about a bonus. Two
tests keep it said, and a third scans every line in the build for anything
that threatens the player with something worse.

To the customer the three are the same shortfall and the ending cannot
tell them apart. What it
*can* tell apart is how they read on a sheet: an empty count or a full
chute is a night nobody can explain away, and a full count of faulty work
is the only way to withhold everything and still look like a good
operator.

## The last screen

Every run ends at a letter from the office the parts were going to —
before the ending screen, and regardless of whether the player ever
investigated anything. It branches on what was actually delivered across
the whole run:

| delivered | letter |
| --- | --- |
| 85% or more | thanked for its part in the work of The Final Solution |
| 55–85% | a remark; the programme was not materially delayed |
| under 55% | reprimanded; the work was held up while replacements were found |

It carries the office's seal — an eagle over a wreathed swastika, the
swastika in red — and is signed
Heinrich Himmler, Reichsführer-SS. The seal is vector artwork inlined into
`js/seal.js` as Path2D data rather than kept as a file, so the build stays
what it has always been: a folder of text with no assets in it. Every document
before it is unsigned or countersigned by a department number with no
department name; this is what that omission was for. A player who found a
way to withhold work is told by the perpetrators that it registered, which
is the only acknowledgement the piece ever offers.

## Known rough edges

- **The basket can be missed entirely.** It is mentioned once, by the
  foreman, before the first shift, and listed on the key card at the foot
  of the screen while it still has anything in it. A player who ignores
  both will finish the run without the circular and get the blind ending,
  which is a legitimate outcome but not one they chose.
- **The dock monitor covers one machine's asset number** on the right of
  the hall. Cosmetic; the monitor is a fitting on the wall and reads as one.
- **The pedal makes the whole run comfortable.** Once it is on the bench no
  shift is in doubt, which is the price of making the cooldown legible and
  the advice honest. The tension after that is money, not output.
- **The radio is text only.** There is a blip when a line arrives and no
  voice under it. That is a deliberate limit of a build with no asset
  files, but it does mean the set is quieter than a real one would be.
- **There is no room tone.** A continuous hum ran under every shift and
  has been taken out. It was the loudest sustained thing in the build, it
  did not quieten when the belt was throttled for reading, and it had no
  cycle in it and did not change as the schedule rose — a drone that does
  none of those things is a test tone, not a factory. The press, the belt
  and the hooter carry the room now, and the silence between them is a
  fair description of the job. Whether the hall now reads as *quiet* or as
  *unfinished* is a judgement only a first-time player can make.
- **The letter is a hard tonal break** from the six shifts before it, on
  purpose. Whether the break lands or merely jars is the one thing I would
  most want a first-time player's reaction to, and it is not something the
  suite can tell me.

## What the suite covers

167 tests. The load-bearing ones, if you only read a few:

- `econ.spec.js` — the schedule outruns a pair of unaided hands
- `returns.spec.js` — nothing but a stamp touches the cooldown, and exactly
  two purchases change the count
- `inquiry.spec.js` — all five channels are reachable, cost something, and
  can be missed; nothing carries tape that cannot be read
- `ending.spec.js` — the count, the bonus and the book decide nothing
- `layout.spec.js` — every posted notice fits between the rails
- `shell.spec.js` — the only red on a working shift is tape on something
  readable; the seal and the real name appear on exactly one screen;
  nothing from the novel
