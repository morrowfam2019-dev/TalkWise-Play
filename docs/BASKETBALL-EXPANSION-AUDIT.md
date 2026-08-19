# GAME-002 Speech Basketball — pre-expansion audit

Baseline: commit `54d9775` on `main`, tagged `pre-basketball-expansion`.
Written before any expansion code was touched (BUILD ORDER step 2).

## What GAME-002 was, at baseline

One mode, no mode concept anywhere. `BasketballShell.tsx` (275 lines) is a
single component that hard-codes the whole Speech Shootout loop as a
five-state phase machine: `word → meter → shooting → banner → results`,
ten times.

```
src/games/basketball/
  BasketballShell.tsx      the entire game: phase machine + layout
  core/round.ts            pure round rules (plan, resolveShot, streaks, summary)
  core/audio.ts            oscillator-synthesised SFX, no audio files shipped
  scene/CourtScene.tsx     R3F <Canvas> + camera rig
  scene/Court.tsx          floor + lines
  scene/Hoop.tsx           backboard, rim, net, pole — rim at y=2.6, r=0.23, origin
  scene/Ball.tsx           one ball, parabolic tween from A to B
  scene/BallerAvatar.tsx   procedural baller, shot-phase state machine
  ui/WordPrompt.tsx        the speech gate (mic, retries, Miss Maya example)
  ui/ShotMeter.tsx         the timing bar
  ui/RoundHud.tsx          shot counter, score, coins, streak
  ui/RoundResults.tsx      end-of-round card
src/content/basketball/
  types.ts                 court spots, DIFFICULTIES (meter-shaped), coin constants
  roster.ts                11 ballers + jerseys, shop items
```

## Reusable as-is

- **`scene/Court.tsx`, `scene/Hoop.tsx`, `scene/BallerAvatar.tsx`** — pure
  presentation, no mode assumptions. The 5 new ballers live in `roster.ts`
  and are consumed only through `getBaller(id)`. Every new mode can use them
  untouched, which is how the founder's approved character work is preserved.
- **`ui/WordPrompt.tsx`** — already the exact "speech gate" every mode needs:
  listen, retry, Miss Maya's example after two misses, third attempt always
  unlocks. Needs only cosmetic props (headline text) to serve Time Attack's
  single unlock gate. Generalised, not duplicated.
- **`core/audio.ts`** — `HoopAudio` synthesises everything; extending it with
  bounce/rim/backboard/countdown/buzzer tones costs nothing and ships no files.
- **`ui/RoundHud.tsx`, `ui/RoundResults.tsx`** — Shootout-shaped (shot 4 of 10).
  Time Attack needs its own HUD/results; these stay Shootout's.

## Not reusable for Time Attack

- **`scene/Ball.tsx`** is a *tween*, not physics: it interpolates from a
  release point to a predetermined target. It cannot express "the drag vector
  decided where this ball goes". Time Attack needs a real integrated
  trajectory and its own pooled ball rendering.
- **`ui/ShotMeter.tsx` / `core/round.ts:resolveShot`** decide makes by timing
  tier and RNG. Time Attack's make must come from where the ball actually
  went. Untouched — the founder's shot-meter probability fix stays exactly as
  shipped and Shootout keeps using it.
- **`CourtScene`'s `CameraRig`** frames one court spot at a time. Time Attack
  wants a fixed arcade framing.

## The difficulty problem

`DIFFICULTIES` in `content/basketball/types.ts` is *meter* difficulty —
green-zone width and sweep speed. The spec's Easy/Intermediate/Hard is
**speech** difficulty. These are different axes and must not be conflated,
so the new speech-difficulty model is added alongside rather than replacing
the meter config, and Shootout's meter tuning is left as-is.

Shared speech content today offers exactly one tier: 5 whole words per sound
(`MOM`, `MOON`, `MILK`, …) — i.e. Intermediate only. Easy (sound builder
ladders) and Hard (sentences) have no data to draw on and must be authored
into the shared content layer, additively.

## Save schema at baseline

```
games["GAME-002"] = { owned: string[], loadout: {ballerId, jerseyId}, highScores: {[soundId]: {...}} }
```

`highScores` is keyed by sound id only — no mode, no difficulty. It must keep
working untouched for every existing profile, so the expansion adds a parallel
`modes` tree rather than re-keying it. `sanitizeBasketballState` already
tolerates missing fields, which is the same additive pattern the v1→v2
household migration used.

## Constraints carried into the build

1. Shootout's phase machine, meter, and `resolveShot` probabilities are
   production-verified — the refactor moves the file, it does not rewrite the
   logic.
2. Basketball's cross-module imports are only `@/content/*`, `@/player/*`,
   `@/speech/*`, `@/ui/*`. Every new file keeps that list unchanged.
3. Nothing in `platform/` or `games/adventures/` may be edited.
