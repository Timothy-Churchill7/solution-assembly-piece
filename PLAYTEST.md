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
| click the basket | tip it out; drag the paper right and the rest left |
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
   while the line is running and the clock is not slowed for it: twenty
   things to drag, one at a time, paper to the right and everything else to
   the left, with a thing dropped in the wrong chute coming straight back
   at you. It pays 2 scrip and the foreman mentions it once. If it ever
   feels automatic rather than like a decision to stop working, the channel
   has stopped working.
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
   because six was over before it registered as one. Twenty *drags* with
   the line throttled to 12% is about the right amount of tedium; thirty
   would be punishment.
7. **Is the circular's pair too obvious?** It is the one thing in the build
   allowed to be conspicuous: bigger, lighter, with a faint halo, and two
   of them. Everything else is dropped paper you have to be looking for.
   The argument for it is that by the time it is on the floor the player has
   read ten points' worth and earned being told plainly — but it is a
   deliberate break in the rule the other twenty-eight items keep.
8. **Can you tell paper from swarf without labels?** Nothing in the basket
   is named any more — the label used to read BATCH CARD or SWARF under
   each one, which turned the sort into reading twenty words rather than
   looking at twenty things. A ball of creased paper and a curl of swarf
   are different shapes; whether they are different *enough* at that size
   is the open question.
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
| nothing | 29/24 | 33/29 | 38/39 \* | 39/42 \* | 41/47 \* | 42/53 \* |
| sorting arm (40) | 29/24 | 33/29 | 38/39 \* | 39/42 \* | 41/47 \* | 42/53 \* |
| foot pedal (110) | 29/24 | 33/29 | 42/39 | 45/42 | 48/47 | 49/53 \* |
| auto-feeder (240) | 29/24 | 33/29 | 42/39 | 45/42 | 51/47 | 54/53 |
| both (350) | 29/24 | 33/29 | 42/39 | 45/42 | 51/47 | 57/53 |

**Two shifts of keeping up, then four of falling behind.** Arrivals are
slower than the press cooldown for two shifts and faster from the third:

| | 1 | 2 | 3 | 4 | 5 | 6 |
| --- | --- | --- | --- | --- | --- | --- |
| stock arriving | 31 | 36 | 45 | 48 | 54 | 60 |
| target | 24 | 29 | **39** | 42 | 47 | 53 |
| a bare press can strike | 36 | 38 | **40** | 41 | 43 | 44 |

So an unaided operator keeps up for two shifts — genuinely keeps up, with
stock to spare — and from the third falls behind. The pedal buys back 3, 4
and 5; the sixth needs the feeder. The pedal is affordable out of the first
two shifts' pay: **140 banked against a cost of 110.**

**The third shift's wall is a soft one, and deliberately so.** The bolded
row is the whole of it: a bare press can strike 40 parts in 70 seconds
against a target of 39, so a flawless operator could in principle make it
unaided — a part in the zone at the instant the cooldown ends, every time,
for seventy seconds. No measured run comes close; the figure on the running
screen is **38**. It was set to 41 for one revision, which made it
arithmetically impossible, and 39 is the chosen softer version: very hard
rather than barred, and the difference only exists for a player good enough
to find it. Whether anyone ever does is the kind of thing the suite cannot
answer.

This is a deliberate reshape. The schedule used to hold until the fifth
shift, which made four of the six a formality and left the stores as one
decision made once. Falling behind at the third means two thirds of the
quarter is spent short, and every visit to the stores is a real one.

**Exactly two of the seven items change the count** — the foot pedal,
which cuts the cooldown by 15%, and the auto-feeder, which stamps 45% of
line 4 without you. A test drives all seven and asserts that no other one
moves the number by a single part.

The sorting arm, the lamp, the gauge, the radio and the monitor buy sight,
sound, fewer deductions and fewer clicks. None of them buys output.

## Ignoring line 5

Same count either way — the cooldown does not care what your hands are
doing — but the deductions are ruinous:

| | 1 | 2 | 3 | 4 | 5 | 6 |
| --- | --- | --- | --- | --- | --- | --- |
| pay, doing the whole job | 74 | 78 | 58 | 79 | 82 | 83 |
| pay, line 5 left to run | 68 | 72 | 49 | 64 | 61 | 56 |

Cumulative: **454** against **370**. Eighty-four scrip is three-quarters
of a foot pedal, which is the thing that would have bought back shifts 3,
4 and 5. The sorting arm at 40 is priced just under what it saves.

The dip at shift 3 in both rows is the wall arriving: it is the first shift
whose bonus cannot be earned by hand.

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
| `plane` | a banner behind an aeroplane, right to left across the clerestory | free |
| `trash` | the basket at the station, emptied mid-shift | free, +2 scrip |
| `radio` | the bench set, reading it out over the noise | 60 |
| `dock` | the yard camera; 2 for watching, 3 if you go over | 95 |

| `officer` | the man from the works office, if you turn down his offer | costs the upgrade |

**Nothing gates the circular but arithmetic.** The free channels are worth
0/2/5/8/11/16 cumulatively; the bench set adds 3 by the end of shift 3 and
the camera 2, or 3 if you click the black lorry rather than only watching
it. Measured, driving the real screens:

| what the run bought | circular |
| --- | --- |
| nothing | shift 5 |
| the bench set (60) | shift 4 |
| set and camera, lorry clicked | shift 3 |

**One purchase, one shift.** That is the shape the weights were set for, and
it was briefly not true — see below.

### How the circular actually arrives

The moment the count reaches ten, the game puts out **a pair of slips of
its own**: one on a machine casing down the hall and one riding line 5,
both half again the size of an ordinary slip and lit rather than dull.
Whichever the player reaches for first is the one they read, and the other
goes with it. Neither can be missed by bad luck — the one on the belt is
released again behind itself if it reaches the end of the line, and the one
on the casing does not go anywhere at all. It is on the floor from the
moment it is earned until it is taken.

This replaced two earlier designs, and the second failed in a way worth
recording. The circular used to live at the bottom of the basket, which
meant a player who read everything on the floor and never did the chore
could pass the threshold and never be told. So it was changed to take the
place of the next ordinary slip instead — and that needed one to exist. The
notes telling you to buy a radio are most of what the `slip` channel
carries, and they stop turning up once there is a radio on the bench, so a
radio owner had **no eligible slip at all** in shift 4 and buying the set
could actually *delay* the reveal. The ladder went flat: 3 if you bought
everything and emptied the basket first thing, 5 otherwise, with nothing in
between.

A pair of its own cannot be crowded out, cannot be eaten by another item,
and does not care when you did the chore. The ladder above is graded again
and basket timing no longer moves it.

### The basket is a drag, not a click

Tipped out on the bench: twenty things scattered between two chutes, and
you drag the paper into the one on the right and everything else into the
one on the left. Nothing is labelled. Picking up the one with something
written on it opens it in your hand, before you have decided which chute it
was for.

A thing dropped in the wrong chute shakes itself off and goes back where it
was lying. The note at the foot of the card still says both chutes go in
the same skip, which is the joke and is load-bearing: the office does not
care which is which, and you still have to get it right.

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

### Reading costs nothing, and there is no clock on it

**Opening an item throttles the line to 12%**, eased in and out over about
a fifth of a second, and the shift clock goes down at the same rate. So
reading costs no output: no parts pass, no seconds burn.

The seconds-spent-reading feature is **gone entirely** — the live readout in
the corner of every card, the `SECONDS SPENT READING` row on the sheet, the
`PASSED WHILE YOU WERE READING` row, and the `readSecs` and `lostToInquiry`
counters behind them. Once the clock went onto the belt's rate those
seconds cost nothing, so a running total of them was a bill for nothing,
printed on every document in the game.

What the free channels still cost is **attention**, and the things that do
not wait for the line rate:

- a lorry is at the dock for 40 seconds and then is not
- an aeroplane crosses the window band once, right to left, in 22 seconds
- a piece on line 5 reaches the end of the line and goes out with what was
  behind it
- the basket is twenty drags with the hooter still coming

The circular's own pair is the exception and is meant to be: it waits.

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

184 tests. The load-bearing ones, if you only read a few:

- `econ.spec.js` — the schedule outruns a pair of unaided hands
- `returns.spec.js` — nothing but a stamp touches the cooldown, and exactly
  two purchases change the count
- `inquiry.spec.js` — all eight channels are reachable, cost something,
  and can be missed; and the four rows of the reveal ladder above
- `stores-code.spec.js` — the advertiser's code, the lorry's second look,
  the buy-a-radio notes going quiet once you own a radio, and the basket
  drag driven through the real pointer at real coordinates
- `ending.spec.js` — the count, the bonus and the book decide nothing
- `layout.spec.js` — every posted notice fits between the rails, including
  the notice board, whose card is measured by running its own layout
- `shell.spec.js` — no amber on a running line, and the paper marker stays
  under that threshold; the seal and the real name appear on exactly one
  screen; nothing from the novel
