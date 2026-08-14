# TalkWise Play

Speech-learning adventure games for children, from TalkWise Academy.

TalkWise Play is a **standalone** web application. It is a separate repository,
separate Next.js app, and separate Vercel project from
[TalkWise-Website](https://github.com/morrowfam2019-dev/TalkWise-Website) — no
shared deployment config, environment variables, or domains.

**Phase 1 ships one complete adventure: M Adventure (`/M/`).**
See [`docs/ROADMAP.md`](docs/ROADMAP.md) for what comes next.

## The gameplay loop

Home → pick an adventure → control an original character → explore the Mountain
of M → find five speech checkpoints → say each word out loud → earn coins →
climb to the summit portal → celebrate → replay.

### No fake speech AI

There is **no pronunciation scoring in Phase 1** and nothing pretends to
listen. The child practices the word out loud and confirms it themselves with
a large **I SAID IT!** button. Real microphone interaction arrives in Phase 4,
and the flow is shaped so it can slot in without redesign.

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
