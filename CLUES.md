# Clue table — for editing

Edit this file freely: the prose, the tiers, the weights, which shift a
thing lands on, which channel carries it. Once you're happy I'll implement
it against `js/content.js` and rebalance the arithmetic.

To claude: use my words exactly, save for typos or small fixes, except when I surround them with (). That is a note to you to explain any special instructions or how I want the clue to look visually.

## How the player meets each channel

| channel | how it is encountered | free? |
| --- | --- | --- |
| `part` | a piece on line 5 with a **red accent** on it. Click the piece. | free |
| `trash` | a bin in the corner of the station. Click it during the shift; a sorting window opens, and one balled-up paper has a **red accent**. Click that. | free, +2 scrip for doing it |
| `radio` | the bench radio reads it out while you work. No prompt. | 60 scrip |
| `dock` | the yard camera. Click the monitor when something is in it. | 95 scrip |
| `officer` | a man from the works office asks you a question between shifts. One branch is information. | free, costs the upgrade |

## Tiers

| tier | what it is | weight |
| --- | --- | --- |
| `TIP` | pure play advice. Harmless, no story at all. Makes you better at the job. | **0** |
| `ODD` | the workplace is strange. Deniable on its own. | 1–3 |
| `DAMNING` | not deniable. | 3–5 |
| `REVEAL` | the circular. Names it. | 6 |

**Arithmetic constraint, so you know what weights do:** the circular comes
out of the bin once cumulative weight reaches **8**, and not before shift 3.
Tips are weight 0 on purpose — finding only tips never advances the story,
which is what makes them safe to hand out freely. The two *free* channels
(`part` + `trash`) must total ≥ 8 by the end of shift 3, or a player who
buys nothing can never reach the reveal. Currently that path gives exactly 8.

---

## Shift 1 — INTAKE · all tips, no story

| id | tier | channel | wt | what it says |
| --- | --- | --- | --- | --- |
| `c1-fault` | TIP | part | 0 | This piece has a fault. Great job catching it, and keep an eye our for similar looking flaws in the future to keep the factory moving smoothly. |
| `c1-pedal` | TIP | trash | 0 | The foot pedal gives the best return on investment. Without it, you won't be able to hit your quota by turn 4. |
| `c1-bonus` | TIP | part | 0 | Make sure you hit the quota, because there's a 25 scrip bonus if you make it. |

## Shift 2 — TOLERANCE · tips, and one thing that is a bit odd

| id | tier | channel | wt | what it says |
| --- | --- | --- | --- | --- |
| `c2-arm` | TIP | trash | 0 | The sorting arm takes three faults in four off line 5 for you, and across a run it saves about what it costs. What you actually buy is not having to reach for line 5 all night. |
| `c2-scrap` | TIP | part | 0 | A missed flaw costs The Company much more than scrip. It's a 2 scrip penalty for each one you miss. |
| `c2-gauge` | TIP | radio | 0 | Buy Fredreich's electronics! Press F in the shop to see our exclusive product line. |
| `c2-priority` | ODD | radio | 1 | Plant 7 moved to the priority list. Leave suspended for the quarter. |

## Shift 3 — REQUISITION · the last of the tips, and it starts

| id | tier | channel | wt | what it says |
| --- | --- | --- | --- | --- |
| `c3-reading` | TIP | part | 0 | The line slows down while you read. Take your time! |
| `c3-acceptance` | ODD | part | 3 | Last week's inspection results: clean, efficient, and industrial. |
| `c3-tape` | ODD | trash | 2 | *(moved to the bin so the free path reaches 8 by shift 3)* The split has been taped over by somebody who wanted the piece to pass. On the tape: an acceptance stamp, a date, a serial, and a signature with an office after it. **SS. Eicke.** |
| `c3-feeder` | TIP | trash | 0 | The auto-feeder stamps 45% of line 4 on its own. It costs more than two shifts' pay and it is the only thing that makes the last shift comfortable. Nobody here has ever bought the lot. |

## Shift 4 — DOWNSTREAM · the officer, and the paperwork stops pretending

| id | tier | channel | wt | what it says |
| --- | --- | --- | --- | --- |
| `c4-officer` | DAMNING | officer | 4 | *(only if you take the information branch — see below)* He tells you where the freight goes. A site code, a rail spur, no town. He says it the way a man says a thing he has decided to stop carrying. |
| `c4-return` | ODD | part | 3 | Your collar, still on its shaft, keyed to a drive far heavier than this line was tooled for. Not a machine tool — fixed plant, bolted down, built to run continuously. The wear says months. |
| `c4-dock` | ODD | dock | 3 | A lorry at the dock, tarpaulin roped over the bed, no company markings. A pennant on the wing — the kind only a state vehicle carries — and the device on it stays behind a fold the whole time. |
| `c4-prefix` | ODD | trash | 2 | The series prefix changed in the spring. The old one is in the plant catalogue, three pages of it. The new one isn't in the catalogue at all. Prefixes like that come down from the customer. |

## Shift 5 — CONSIGNMENT · no more tips

| id | tier | channel | wt | what it says |
| --- | --- | --- | --- | --- |
| `c5-routing` | DAMNING | trash | 4 | Freight for the quarter on one page. Four destinations. Three are named works with towns. The fourth is a site code and a rail spur and no town at all — and it takes more than the other three together. |
| `c5-handling` | DAMNING | radio | 3 | An open microphone in the works office. Consignments to the fourth destination are not to be discussed outside the premises. It's an instruction, and not the first time he's given it. |
| `c5-tonnage` | DAMNING | dock | 3 | The weighbridge docket for the night's freight. The tonnage going to the fourth destination doesn't match any machine in the catalogue. Whatever it feeds, there is a great deal of it. |

## Shift 6 — CONTINUITY

| id | tier | channel | wt | what it says |
| --- | --- | --- | --- | --- |
| `c6-withdrawal` | DAMNING | trash | 5 | All quarterly records to be consolidated and the originals destroyed. The list is attached: routing schedule, acceptance forms, every piece of paper saying where any of this went. Production figures retained in full. |
| `c6-hours` | DAMNING | part | 4 | A maintenance log for the fixed plant at the fourth destination. Your collars on it by the thousand, every month since the spring. The running hours never fall to zero. Not one night, not one Sunday, in nine months. |
| `c6-manifest` | DAMNING | dock | 4 | The yard at four in the morning. Empty flat wagons going the other way — coming back from the fourth destination, and there is nothing on them. Whatever goes out there does not come back as anything. |

## The circular

| id | tier | channel | wt | what it says |
| --- | --- | --- | --- | --- |
| `reveal-circular` | REVEAL | trash | 6 |  (type: ripped letter showing a table with factory assignments.) Factory 5: The Eastern Front. Factory 6: The Western Front. Factory 7 (circled): **The Final Solution**. Factory 8: Algeria. |

---

## The officer's question (shift 4)

Between shifts a man from the works office puts a proposition. One
question, two answers, no way back:

| branch | what you get |
| --- | --- |
| **THE UPGRADE** | Line 4 runs heavier for the rest of the quarter — more parts arrive, so a higher ceiling and more scrip. Nothing is said about the customer. |
| **THE ANSWER** | He tells you where the freight goes (`c4-officer`, weight 4). The line stays as it is. |

This is the whole thesis of the piece as a single click, and it is the only
place the game ever makes the trade explicit. Open questions for you:

- **Which shift?** 4 feels right — late enough to matter, early enough to
  live with. 3 makes it the fulcrum of the run.
- **How big should the upgrade be?** Big enough to hurt to refuse. I'd
  suggest arrivals up ~15% for the remaining shifts, which is worth roughly
  30–40 scrip across the run.
- **Should he come back?** Once only, I think. A second offer would make it
  a shop.

---

## Counts

| | current | proposed |
| --- | --- | --- |
| clues | 13 | 20 |
| tips (weight 0) | 0 | 7 |
| max awareness | 39 | 41 |
| free path by end of shift 3 | 8 | 8 |
