# Clue table — for editing

Edit this file freely: the prose, the tiers, the weights, which shift a
thing lands on, which channel carries it. Once you're happy I'll implement
it against `js/content.js` and rebalance the arithmetic.

To claude: use my words exactly, save for typos or small fixes, except when I surround them with (). That is a note to you to explain any special instructions or how I want the clue to look visually.

## How the player meets each channel

| channel | how it is encountered | free? |
| --- | --- | --- |
| `part` | a piece on line 5 with a little slip of paper tucked behind it. Click the piece. | free |
| `belt slip` | a slip of paper appears on lane 5. Click it. | free |
| `background slip` | a slip of paper sitting on a machine somewhere in the background. Click it. | free |
| `plane` | an advertising plane appears flying by out the window. Click it. | free |
| `trash` | a bin in the corner of the station. Click it during the shift; a sorting window opens, and one balled-up paper has a few marks of text. Click that. | free, +2 scrip for doing it |
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
out of the bin once cumulative weight reaches **10**.

When the user reaches 10 weight, the reveal presents itself as the next belt slip/background slip/trash/part clue that they see, overriding what was there before.

The buy radio/camera hints should not appear if the user has already bought the radio/camera.
---

## Shift 1 — INTAKE · all tips, no story

| id | tier | channel | wt | what it says |
| --- | --- | --- | --- | --- |
| `c1-fault` | TIP | part | 0 | This piece has a fault. Great job catching it, and keep an eye our for similar looking flaws in the future to keep the factory moving smoothly. |
| `c1-pedal` | TIP | trash | 0 | The foot pedal gives the best return on investment. Without it, you won't be able to hit your quota by turn 4. |
| `c1-bonus` | TIP | slip | 0 | Make sure you hit the quota, because there's a 25 scrip bonus if you make it. |

## Shift 2 — TOLERANCE · tips, and one thing that is a bit odd

| id | tier | channel | wt | what it says |
| --- | --- | --- | --- | --- |
| `c2-arm` | TIP | belt slip | 0 | The sorting arm takes three faults in four off line 5 for you. |
| `c2-facilites` | ODD | background slip | 1 | *(ledger of where the products went last month)* Facility 1: 1202. Facility 2: 1283. Facility 3: 533. Facility 4: 8964|
| `c2-buyradio` | ODD | belt slip | 0 | If you want to find out more about The Company, you should buy a radio and listen in.|
| `c2-scrap` | TIP | part | 0 | A missed flaw costs The Company much more than scrip. It's a 2 scrip penalty for each one you miss. |
| `c2-plane` | TIP | plane | 1 | Buy Spielmann's electronics! Press F in the shop to get 20% off! |
| `c2-priority` | ODD | radio | 2 | Plant 7 switched to priority 1. Leave & mail suspended for the quarter. |

## Shift 3 — REQUISITION · the last of the tips, and it starts

| id | tier | channel | wt | what it says |
| --- | --- | --- | --- | --- |
| `c3-reading` | TIP | part | 0 | The line slows down while you read. Take your time! |
| `c3-buyradio` | ODD | belt slip | 0 | If you want to find out more about The Company, you should buy a radio and listen in.|
| `c3-tape` | ODD | trash | 2 |  *(A crumpled up piece of paper with inspection results: Last week's inspection results: clean, efficient, and industrial. Below, an acceptance stamp, a date, a serial, and a signature with an office after it. **Officer Eicke.** )*|
| `c3-plane` | TIP | plane | 0 | Buy Spielmann's electronics! Press F in the shop to get 20% off! |
| `c3-feeder` | TIP | background slip | 1 | The auto-feeder stamps almost half of line 4 on its own. It's expensive but you won't be able to do your part to help The Company without it. |
| `c3-buycamera` | ODD | part | 0 | If you want to find out more about operations, you should buy the dock camera and take a loot at the loading dock.|
| `c3-dock` | ODD | dock | 2 or 3 if clicks | *(render this as a visual on the dock camera, not an interruption)* Alongside the normal white company trucks a fully black one comes in. *(If user clicks on it)* Darker boxes marked with Xs can be seen loading on. |
| `c3-priority` | ODD | radio | 1 | Plant 7 is now highest priority. It is the bottleneck of The Company's solution. |

## Shift 4 — DOWNSTREAM · the officer, and the paperwork stops pretending

| id | tier | channel | wt | what it says |
| --- | --- | --- | --- | --- |
| `c4-officer` | DAMNING | officer | 3 | *(only if you take the information branch — see below)* I can't tell you that. Do your part and stamp the widgets, or you'll sabatoge the whole operation. If you really want to know, buy a radio. |
| `c4-dock` | ODD | dock | 2 or 3 | *(render this as a visual on the dock camera, not an interruption)* Alongside the normal white company trucks a fully black one comes in. *(If user clicks on it)* Darker boxes marked with Xs can be seen loading on. |
| `c4-buyradio` | ODD | belt slip | 0 | If you want to find out more about The Company, you should buy a radio and listen in.|
| `c4-radio` | ODD | radio | 2 | *(talk show)* Shall we discuss the state of things? What's there to discuss? Churchill is being a real pain in the ass, that's for sure. |
| `c4-plane` | TIP | plane | 1 | Buy Fischer's electronics! Press F in the shop to get 20% off! |
| `c4-prefix` | ODD | trash | 2 | *(an informal note between supervisors)* Leadership said not to question the prices, but at this rate we'll be bankrupt in a month.  |

## Shift 5 — CONSIGNMENT · no more tips

| id | tier | channel | wt | what it says |
| --- | --- | --- | --- | --- |
| `c5-facilites` | ODD | background slip | 2 | *(ledger of where the products went last month)* Facility 1: 0. Facility 2: 0. Facility 3: 0. [Redacted]: 12749|
| `c5-buyradio` | ODD | belt slip | 1 | If you want to find out more about The Company, you should buy a radio and listen in.|
| `c5-handling` | DAMNING | radio | 3 | Consignments to the fourth destination are not to be discussed outside the premises. |
| `c5-dock` | ODD | dock | 2 or 3 | *(render this as a visual on the dock camera, not an interruption)* Alongside the normal white company trucks a fully black one comes in. *(If user clicks on it)* Darker boxes marked with Xs can be seen loading on. |

## Shift 6 — CONTINUITY

| id | tier | channel | wt | what it says |
| --- | --- | --- | --- | --- |
| `c6-withdrawal` | DAMNING | trash | 5 | All quarterly records to be consolidated and the originals destroyed. The list is attached: routing schedule, acceptance forms, every piece of paper saying where any of this went. Production figures retained in full. |
| `c6-dock` | ODD | dock | 2 or 3 | *(render this as a visual on the dock camera, not an interruption)* Alongside the normal white company trucks a fully black one comes in. *(If user clicks on it)* Darker boxes marked with Xs can be seen loading on. |
| `c6-radio` | ODD | radio | 2 | *(talk show)* Shall we discuss the state of things? Why, it just keeps getting worse! Russia was a disaster and now the Americans are joining. Don't speak of the Führer like that! |

## The circular

| id | tier | channel | wt | what it says |
| --- | --- | --- | --- | --- |
| `reveal-circular` | REVEAL | belt slip or trash | 6 |  (type: ripped letter showing a table with factory assignments, with the Nazi symbol SVG at the top) Factory 5: The Eastern Front. Factory 6: The Western Front. Factory 7 (circled): **The Final Solution**. Factory 8: Algeria. |

---

## The officer's question (shift 4)

Between shifts a man from the works stops by. You must pick your request:
- ask where the products go *(the answer)*
- ask for more responsiblity: more widgets will come through but your stamp will be upgraded to match *(the upgrade)*

| branch | what you get |
| --- | --- |
| **THE UPGRADE** | Line 4 runs heavier for the rest of the quarter — more parts arrive, so a higher ceiling and more scrip. Nothing is said about the customer. The stamping speed also increases to match it. |
| **THE ANSWER** | (`c4-officer`, weight 4). The line stays as it is. |

This is the whole thesis of the piece as a single click, and it is the only
place the game ever makes the trade explicit. Open questions for you:

- **Which shift?** 80% of the way through shift 4
- **How big should the upgrade be?** 20% faster belt, 20% more widgets, 20% faster stamp cooldown
- **Should he come back?** No

---
