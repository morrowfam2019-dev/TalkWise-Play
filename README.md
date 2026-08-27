# TalkWise Play

Speech-learning adventure games for children, from TalkWise Academy.

TalkWise Play is a **standalone** web application. It is a separate repository,
separate Next.js app, and separate Vercel project from
[TalkWise-Website](https://github.com/morrowfam2019-dev/TalkWise-Website) — no
shared deployment config, environment variables, or domains.

TalkWise Play is a **platform with a library of independent games**, not one
game. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the shape of the
codebase and [`docs/ROADMAP.md`](docs/ROADMAP.md) for what comes next.

## The library

**Featured** — longer experiences with deeper progression:

| Id | Game | What it is |
| --- | --- | --- |
| `GAME-001` | Speech Adventures | A 3D world in three stages: sounds, words, sentences |
| `GAME-002` | Speech Basketball | Say the word, unlock the shot — Shootout and Time Attack |

**Quick Play** — short, replayable mini-games (30 seconds to 4 minutes), all
six built on the shared framework in `src/minigames`. See
[`docs/MINIGAMES-LAUNCH-01.md`](docs/MINIGAMES-LAUNCH-01.md):

| Id | Game | Core mechanic |
| --- | --- | --- |
| `GAME-003` | Bubble Blast | Pop the bubbles that match your sound |
| `GAME-004` | Sound Match | Drag the right picture into the backpack |
| `GAME-005` | Colour & Shape Hunt | Listen, then find it in the scene |
| `GAME-006` | Guess the Sound | Which one made that noise? |

Coins are a **universal wallet** spendable in any shop; what coins buy stays
in the buying game's own inventory. Every game owns its own save namespace.

### Speech, honestly

The microphone confirms that a child *said the word*, using the browser's own
speech recognition. There is **no pronunciation scoring** anywhere and nothing
pretends to grade an accent or a speech difference. Every speech moment can
also be passed with a large **I SAID IT!** button, from the first second — a
bad microphone must never be able to stop a child playing.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4
- three.js + @react-three/fiber for the 3D world

Chosen for a phone-first browser game: primitive geometry and flat-shaded
materials (no model or texture downloads), cheap lighting with no shadow maps,
and sound effects synthesised at runtime via the Web Audio API rather than
shipped as audio files.

## Development

```bash
npm install
npm run dev          # http://localhost:3002
```

Port 3002 keeps it clear of the main site's dev server on 3001.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm run verify:world` | Level validation — see below |
| `npm run verify:progress` | Saved-progress migration and namespace isolation |
| `npm run verify:speech` | Recognition rules and the sound → word → sentence ladder |
| `npm run verify:minigames` | Mini-game content, scoring, coin formula and saves |

### Controls

- **Desktop** — WASD or arrow keys to move, drag to look, `Q`/`E` to turn the
  camera, space to jump
- **Mobile** — on-screen joystick, drag anywhere to look, JUMP button

Append `?debug=1` to a level URL for a live player-position readout, which is
useful when placing checkpoints and collectibles.

### `npm run verify:world`

Level layout is data, and data is easy to get subtly wrong. This runs the real
`PlayerController` against the real world data with no browser involved, and
checks two things:

1. **Placement** — every checkpoint, coin, and the finish portal sits on the
   terrain surface rather than buried inside a hill or floating above it.
2. **Traversal** — a simulated player can actually walk the intended route from
   spawn to the summit, climbing every stair, without getting stuck or falling
   off the island.

It catches an unreachable checkpoint in seconds. Run it after any change to a
world definition.

## Architecture

Four layers, deliberately kept apart so the game can grow without rewrites:

```
src/
  game/       Engine: movement, collision, camera, world data, scene, HUD
  content/    Speech content: sounds, words, prompts, levels (pure data)
  player/     Player data: coins, progression, storage abstraction
  platform/   Platform integration boundary — INACTIVE in Phase 1
```

The rules that make this worth having:

- **The engine never names a word.** A world supplies checkpoint *anchors*;
  a level supplies *challenges*; they are bound by index at load time. Swapping
  `/M/` for `/P/` means adding a data file, not editing gameplay code.
- **Nothing reads storage directly.** `ProgressStore` is an interface with a
  localStorage implementation today and room for a server later.
- **No host SDK outside `src/platform/`.** Whop integration is Phase 6; the
  game must keep running standalone, unhosted, at every phase.

## Deployment

Deployed as its own Vercel project (`talkwise-play`) under the TalkWise team,
building from `main` in this repository. Do not link this repo to the
TalkWise-Website Vercel project.
