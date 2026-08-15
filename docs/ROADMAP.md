# TalkWise Play — Roadmap

TalkWise Play is a standalone speech-learning game platform for children, part
of TalkWise Academy. It is built as its own web application and must never
become structurally dependent on any hosting platform.

---

## Phase 1 — Core Playable Prototype ✅

One complete, genuinely playable adventure proving TalkWise can make a speech
game that feels like a game.

- **M Adventure** — target sound `/M/`, world "Mountain of M"
- Original TalkWise character ("Milo"), third-person movement, desktop + touch
- Five speech checkpoints (MOM, MOON, MILK, MOUSE, MONKEY)
- Manual practice confirmation — **no pronunciation scoring, no fake AI**
- Coins, optional collectibles, gated summit portal, results, replay
- Local progress persistence behind a swappable storage interface
- Deployed to Vercel as its own project

**Status: complete, pending founder review.**

---

## Phase 2 — Reusable Speech Game Engine

Turn the one-off level into a content pipeline.

- Extract level authoring so a new sound is a data file, not new code — ✅
  `P Party` added as a level file plus a world file; zero engine changes
- Multiple worlds sharing one engine; world/level binding by anchor index — ✅
- Difficulty settings (checkpoint count, world size, movement assists)
- One action verb per world — ✅ `WorldDefinition.action` is `"jump"` or
  `"slide"`, and it is the only thing the action button does in that world.
  Jump worlds raise ledges and never ask a child to duck; slide worlds are
  flat underfoot and never ask for a jump. The on-screen button, the
  keyboard hint, and the intro card all name the world's own verb, so a
  child learns one move per adventure instead of a moveset
- Authoring-time validation extended (`npm run verify:world` per level) — ✅
  the script now verifies every registered world in one run
- Second sound built end-to-end to prove the pipeline (`/P/` or `/B/`) — ✅
  P Party: POP, PIG, PIZZA, PENGUIN, PANDA in the Party Plaza of P
- Authored verification routes — ✅ a world can declare `verifyRoute`, the
  path its design actually means. `npm run verify:world` walks that line and
  presses the world's own action button (when a step blocks it, or when the
  ground ahead drops away), instead of guessing a straight line between
  checkpoints that cuts corners through geometry
- Invisible edge barrier — ✅ every `WorldDefinition` now declares `bounds`
  (`src/game/world/types.ts`), and the controller clamps the player inside
  them every frame (`src/game/core/controller.ts`). Previously nothing
  stopped a child from walking straight off the island's edge — they'd fall
  past the terrain and through the water plane before the kill-plane caught
  them several seconds later, which read as the game glitching rather than
  a fall. Now the player is stopped right at the shoreline, tested by
  scripting a sustained walk into the edge and confirming the position
  holds exactly at the wall instead of drifting through it

**Status: pipeline proven, pending founder review. Difficulty settings still open.**

## Phase 3 — TalkWise Play World + Progression

- Hub world replacing the current card-list home screen
- Cross-level progression, unlocks, and a coin economy — ✅ unlocks in;
  P Party stays locked (🔒 card on the home screen, and the `/play/p-party`
  route itself) until M Adventure is completed. `SpeechLevel.unlockRequires`
  is the data hook — a level names the id it needs, nothing else changes.
  A lifetime coin total across levels already existed (`profile.totalCoins`)
- Achievements and streaks — ✅ 7 badges (`src/player/achievements.ts`) plus a
  daily streak tracked on every completed run (local calendar day; same day
  twice is a no-op, the day right after extends it, any bigger gap resets to
  1). Both render on the home screen — a 🔥 streak badge in the header and an
  achievements grid below the adventure cards
- Richer environment art and character animation
- Background music — ✅ a synthesised looping theme, same
  no-shipped-audio-files approach as the sound effects

## Phase 4 — Voice Interaction

The first phase where the microphone is used at all.

- Microphone capture with explicit, child-appropriate permission flow — ✅
- Attempt-detection loop — ✅ word confirmation, not just noise: the
  browser's built-in speech recognition transcribes the attempt and checks
  it against the target word (`src/game/core/speech-recognition.ts`), so
  background noise and the wrong word are both rejected. Still no
  pronunciation *scoring* — a match either happened or it didn't. Listen (up
  to ~4.5s) → no match → listen again → no match a 2nd time → "Miss Maya"
  speaks the word once → 3rd attempt always advances the challenge, heard or
  not, so a quiet room or a shy voice never hard-locks a run
- Miss Maya's voice — ✅ real recorded clips (`public/audio/maya/*.mp3`, one
  per word, ElevenLabs via the Higgsfield connector's "Maya" preset — the
  brand's own ElevenLabs voice ID exists but isn't reachable through this
  connector, so this is the nearest available match) with a browser
  text-to-speech fallback for any word that doesn't have a recorded clip yet.
  All 35 challenge words across the seven adventures are now recorded, so the
  fallback is a safety net for future words rather than something a child
  hits today. Clips are trimmed of leading and trailing silence and encoded
  mono at 22.05 kHz — deliberately not lower, because /s/ and /f/ carry their
  identity in high-frequency energy and this is the model a child imitates
- Miss Maya's face — ✅ `public/characters/miss-maya.png`, the official
  AI-generated TalkWise headquarters portrait (cropped to a square avatar).
  A "🔊 Hear Miss Maya say it" button showing her photo is visible the
  moment a challenge opens — not gated behind failed attempts, so a child
  can hear the word before ever guessing at it
- Real pronunciation feedback (recording, playback, comparison) — still
  open; the attempt loop above confirms the right word was said, not how
  *well* it was said
- Honest confidence reporting — never a fabricated score
- Manual "I said it" confirmation remains available as a fallback — ✅ and
  it is now always reachable, not just automatic. "Turn microphone off" sits
  on screen the whole time a challenge is listening, and again on Miss
  Maya's popup, and drops straight to the "I SAID IT!" button. The choice
  persists on the profile (`micEnabled`), so a family whose microphone can't
  hear their child answers it once instead of at every checkpoint. It is
  still applied automatically when permission is denied or the browser has
  no speech recognition

## Phase 5 — Parent + Child Profiles

- Multiple child profiles per household — ✅ `Household` in
  `src/player/types.ts` holds many named `PlayerProfile`s with one active at
  a time; existing single-profile saves migrate into a first child
  automatically. A "Playing as" chip row on the home screen switches
  children and adds new ones — every existing consumer (`ChallengeModal`,
  `GameShell`, the home screen) still just reads "the active profile" and
  needed no changes
- Parent view of practice history — ✅ `/parent` lists every child's coins,
  streak, badge count, and per-level bests side by side. Honestly labeled as
  unprotected for now — there's no login system yet, so it's exactly as
  private as the device it's opened on
- Server-backed progress replacing the local storage implementation
  (the `HouseholdStore` interface already draws this seam) — still open;
  needs a real backend/auth decision, not made here

## Phase 6 — Whop Integration

Deliberately skipped for now — real entitlement checks need a Whop
account/API key and product setup that don't exist yet. Revisit when those
are available rather than building against a guessed protocol.

- Membership-gated access via the platform boundary in `src/platform/`
- Embedded (iframe) hosting alongside continued standalone operation
- Entitlement checks gate *content*, never the ability to run the app

## Phase 7 — Game Expansion

- Additional worlds, mini-games, and formats — ✅ seven adventures now, each
  with its own shape and its own verb rather than one recoloured layout,
  alternating jump / slide as the chain unlocks:
  - **M Adventure** (jump) — a spiral climb. Four concentric terraces, each
    reachable only by a single stair block, and those stairs sit at rotating
    compass points so the climb winds around the mountain
  - **P Party** (slide) — a hub and four stalls. Flat throughout; each stall
    is walled off with one entrance under a banner you can only duck beneath
  - **B Bay** (jump) — a chain of six islands spiralling inward over a
    shallow lagoon, so a missed hop is a splash rather than a fall
  - **W Woods** (slide) — one long trail with alcoves cut into the hedges
    and five fallen logs across it
  - **S Summit** (jump) — a switchback ridge. Five terraces too tall to
    jump, each with one mid-height stair at an alternating end, so the climb
    doubles back on itself like a mountain road
  - **L Lagoon** (slide) — a closed ring corridor around an unclimbable
    lagoon mound, cut into six stretches by six arches. One full lap
  - **F Falls** (jump) — eight ledges corkscrewing around a waterfall
    pillar, everything within a few strides of the centre
- Avatar customization — ✅ four characters (Milo, Pip, Nova, Sprout), each a
  palette and a head crest over the same rig, bought and worn from the store
- The store — ✅ `/shop`, spending coins on characters, auras, and movement
  boosts. `totalCoins` stays the lifetime record and `spentCoins` tracks the
  till, so buying something never erases an achievement already earned.
  **Boosts only ever change movement** — Super Boots jump higher, Speed Shoes
  run faster — and never the speech check; that line is stated in
  `src/content/shop.ts` and on the store page itself, and is the one rule
  this feature must not break
- Speech-bubble pickups — ✅ coins are the TalkWise mark itself, extruded
  with its three dots and tail, bobbing in place and turning to face the
  camera. Two other gold, faceted, floating objects used to read as stray
  coins next to the real ones — the checkpoint's marker gem and the
  decorative "crystal" props scattered along every path. Checkpoints are now
  a small flag planted on the plinth (waves in place, never floats); crystals
  are a cluster of thin ground-planted spikes in each world's own accent
  color (icy blue on the mountain and the bay, pink at the party stalls,
  firefly-green in the woods) instead of a hardcoded gold octahedron
- B Bay's two rescue pads (for a splash back onto the island chain) were
  under-tuned — ✅ retuned by simulating the actual controller physics
  (gravity, accel, jump math) to a boost and position that clears the target
  island with margin, each along one approach direction, and a ground arrow
  now marks that direction since height alone doesn't tell a child which way
  to be running when they hit the pad
- Seasonal content

---

## Future: Sound Library bridge

The TalkWise Sound Library remains its own separate product. A later phase may
add a progression bridge — completing required Sound Library content unlocks
the matching sound inside TalkWise Play. Phase 1 only preserves an
architecture capable of supporting this; nothing is implemented.

---

## Architectural rules

These hold across every phase:

| Layer | Location | Rule |
| --- | --- | --- |
| Game engine | `src/game/` | Knows nothing about which sound is being practiced |
| Speech content | `src/content/` | Pure data; no rendering or gameplay concepts |
| Player data | `src/player/` | Persistence behind an interface, swappable for a server |
| Platform | `src/platform/` | Inactive in Phase 1; the only place a host SDK may appear |

The game must keep running standalone, outside any host, at every phase.
