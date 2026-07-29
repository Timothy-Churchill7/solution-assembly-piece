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
| click a slip on the belt, a machine, or an aeroplane | read it |
| click the basket | empty it, and sort what is in it |
| `D` | look at the yard camera (only if you bought one) |
| `F` in the stores | the advertiser's code, if you have read one of the banners |
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
4. **Is the paper findable without being a quest icon?** Cream at
   `#d8cfb4` against a hall that runs `#1a1c1e` to `#8e9397`. It is the
   only warm thing on a working screen and it stays under the threshold
   the amber test uses, so it reads as an object in the building rather
   than a piece of interface. Four of the eight channels are paper and
   each puts it somewhere different — behind a piece, on the belt, on a
   machine, behind an aeroplane — so the question is whether a player
   learns *paper means read me* once and then finds all four.
5. **Does the aeroplane read as being outside?** It crosses the clerestory
   band and the glazing bars are redrawn over it, so it is behind the
   glass. It is the only time in six shifts the game shows you there is an
   outside, and it is carrying an advertisement.
6. **Is twenty things in the basket a chore or a slog?** Twenty was chosen
   because six was over before it registered as one. Twenty clicks with
   the line throttled to 12% is about the right amount of tedium; thirty
   would be punishment.
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

Twenty-nine things can be read across a run, across **eight** channels.
Weight tops out at 43 and the circular needs **10**.

| channel | how you meet it | free? |
| --- | --- | --- |
| `part` | a slip tucked in behind a piece on line 5 | free |
| `slip` | a slip riding line 5 with no part under it | free |
| `bgslip` | a slip left on a machine casing down the hall | free |
| `plane` | a banner behind an aeroplane, across the clerestory | free |
| `trash` | the basket at the station, emptied mid-shift | free, +2 scrip |
| `radio` | the bench set, reading it out over the noise | 60 |
| `dock` | the yard camera; 2 for watching, 3 if you go over | 95 |

| `officer` | the man from the works office, if you turn down his offer | costs the upgrade |

**Nothing gates the circular but arithmetic.** The free channels are worth
0/2/5/8/11/16 cumulatively; the bench set adds 3 by the end of shift 3 and
the camera 2, or 3 if you click the black lorry rather than only watching
it. Measured, driving the real screens:

| what the run did | circular |
| --- | --- |
| line 5's pieces only, nothing else | **never** — and awareness stays at **0** |
| everything free, bought nothing | shift 5 |
| the bench set | shift 4 |
| set and camera, lorry clicked, basket done late | shift 4 |
| set and camera, lorry clicked, basket done **first thing** | **shift 3** |

Two of those rows are worth dwelling on.

**Line 5's pieces carry four items across the whole quarter and every one
is a playing tip.** An operator who works the return line diligently and
touches nothing else finishes a better worker and no wiser at all. That is
the sharpest thing the weight table says and it is said in arithmetic
rather than in prose.

**The last two rows differ only in when you empty the basket.** The
circular replaces the next piece of paper after the count crosses ten.
Empty the basket late and its points land after shift 3's last slip has
gone by, so there is nothing left to carry it and it waits a shift. Empty
it first thing and the shift's own aeroplane takes it. Same purchases,
same reading, one shift apart, entirely on when you did the chore. That
was not designed; it fell out of the rule and it is worth keeping.

An earlier build had an explicit rule that the free path could never reach
the circular at all. It is gone. It turned a difference of degree into a
wall, and the table above says the same thing more honestly.

### The yard camera is a picture, not a card

The only channel that never opens anything over the hall. Four lorries at
the dock: three of the company's own, pale and marked, and one that is
not — unmarked, unlit, black end to end. Clicking the monitor reads the
picture. Clicking the **black one** is the second look, worth a third
point, and puts three crates on the apron with a cross chalked on each.

It costs no cycle and no clock. What ninety-five scrip buys is having to
be looking in a third direction while the press runs, and the seconds your
eyes were in the wrong corner — not a card that stops the shift to read
three sentences at you, which is what it used to be.

### The advertiser's code

A light aircraft crosses the clerestory once or twice a quarter dragging a
banner for an electronics firm. Read one and `F` in the stores takes **20%
off** the bench set, the sorting arm and the yard monitor — 60/40/95
becomes 48/32/76, which is 39 scrip, most of a lamp. It does nothing at
all until a banner has actually been read, and the stores never mention
it. It is the only thing in the game that pays cash for looking at
something with no bearing on the quota.

### The one question asked out loud

He comes down to the station **four fifths of the way through shift 4**,
with the line running — not between shifts, where he used to wait. Ask for
more responsibility and from the next shift the line runs 20% heavier, the
press cooldown drops 20%, and the target rises 20% to match. Ask where the
products go and he tells you, worth 3, and nothing else changes.

CLUES.md first specified 50% / 50% / 60%. That measured out at roughly
four foot pedals, free, which would have made the 110-scrip pedal
pointless and the stores a formality. 20/20/20 is about one good purchase,
which is what a trade needs to be.

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
  both loses the whole `trash` channel — 9 of the 43 points.
- **The `part` channel is now all tips and no story.** Four items across
  six shifts, every one weight 0. That is a defensible statement about
  what the return line teaches you, but it also means the first channel a
  player masters is the one that never pays, and I do not know whether
  that reads as an argument or as an anticlimax.
- **Twenty clicks is a lot of clicks.** The basket is the longest single
  interaction in the game and it happens six times. It is meant to feel
  like a chore; whether it crosses into feeling like filler is exactly the
  kind of thing the suite cannot tell me.
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

177 tests. The load-bearing ones, if you only read a few:

- `econ.spec.js` — the schedule outruns a pair of unaided hands
- `returns.spec.js` — nothing but a stamp touches the cooldown, and exactly
  two purchases change the count
- `inquiry.spec.js` — all eight channels are reachable, cost something,
  and can be missed; and the four rows of the reveal ladder above
- `stores-code.spec.js` — the advertiser's code, the lorry's second look,
  and the buy-a-radio notes going quiet once you own a radio
- `ending.spec.js` — the count, the bonus and the book decide nothing
- `layout.spec.js` — every posted notice fits between the rails
- `shell.spec.js` — no amber on a running line, and the paper marker stays
  under that threshold; the seal and the real name appear on exactly one
  screen; nothing from the novel
