# Solution

A short browser game about doing a job well and not asking what the job is
for. You stand at a finishing line in a components plant across six shifts,
stamping parts to meet a quota and watching a second line for pieces that
will not pass. The schedule rises every shift. Your hands do not.

Nothing in it announces itself. There is no marker, no prompt and no colour
on a working shift; what there is to find arrives on the ordinary channels
of a working night — a faulty piece somebody has been at, a bench radio, a
camera pointed at the yard, the bin by the door — and every one of them
costs you output to use. The plant records output and nothing else.

There is no clean win. The ending is decided by how much you chose to know
and what you did on the nights after you knew.

## Attribution

Concept inspired by 'Solution,' a fictional game described in Gabrielle
Zevin's novel *Tomorrow, and Tomorrow, and Tomorrow* (2022). This is an
independent, non-commercial fan project. It is not affiliated with,
endorsed by, or reviewed by the author or publisher.

The mechanic this piece runs on — complicity produced by an efficiency
score rather than by a story beat — has real-world lineage in serious games
discourse, notably Brenda Romero's mechanics-driven work on historical
atrocity; that is offered as honest context for where these ideas sit in
game-design history, not as a claim of endorsement by anyone named here.

No text from the novel is reproduced anywhere in this build. The book
describes a game called "Solution" but never shows its screens or its
writing; every line of in-game copy here is original.

## Content note

Nothing in this build depicts violence. There are no photographs and no
reconstructions of real events; for six shifts the subject is approached
entirely through paperwork, routing, silhouette and omission.

The final screen is a letter from the office the parts were going to. It
carries that office's seal — a swastika, in red — is signed by the man who
ran the programme, and states plainly what the work was for. That is the
only screen in the build with a symbol on it, the only one with a real
name on it, and the only colour anywhere in the piece. All of it is
deliberate and all of it is late: the run withholds the name of the thing
for six shifts so that the moment it is said carries what it should.
Nothing here celebrates or endorses any of it — the seal is the object of
the player's horror, and the letter exists to tell them what they were
part of.

*Display of the symbol is legally restricted in Germany and Austria
outside recognised artistic and educational exemptions.*

## Running it

No build step, no dependencies, no server required.

```bash
open index.html
```

If your browser is strict about local files, any static server works:

```bash
npx --yes http-server -p 8080 -c-1 .
```

## Deploying

Static, and genuinely static — the repository is the site. On Netlify:
publish directory `.`, no build command. `netlify.toml` says so already, so
connecting the repo is the whole of it.

## Tests

```bash
npm install && npx playwright install chromium && npm test
```

168 tests. They cover the pay arithmetic and the ceiling on a pair of
hands, both assembly lines, every inquiry channel, the layout budget of
every posted notice, and the ending resolver — including the load-bearing
claim that the count, the bonus and the balance on the book decide nothing
about how the run ends. Two of them check that nothing in the build has
drifted toward the novel.

`npm run shots` renders every screen to `shots/` for visual review. Those
are not pixel comparisons; they exist to be looked at.

See [PLAYTEST.md](PLAYTEST.md) for the measured balance table, what to
check by hand, and the rough edges I know about.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | The whole entry point. |
| `js/logic.js` | Pure state: scoring, awareness, ending resolution. No canvas. |
| `js/content.js` | Every line of player-facing text. |
| `js/scene.js` | The hall: silhouettes, lamps, belt, parts. |
| `js/econ.js` | Pure economy: pay, the stores, what a pair of hands can do. |
| `js/screens.js` | Shared chrome, menu, about, handbook. |
| `js/shift.js` | The station: both lines, the press, the four channels. |
| `js/stores.js` `js/trash.js` `js/ending.js` | The screens between and after shifts. |
| `js/draw.js` | Canvas primitives — type, plates, rivets, CRT surface. |
| `js/audio.js` | Every sound, procedural. No asset files anywhere in the build. |
| `tests/` | Playwright: logic assertions and screenshot capture. |
