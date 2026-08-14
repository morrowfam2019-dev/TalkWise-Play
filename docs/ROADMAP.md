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
- Authoring-time validation extended (`npm run verify:world` per level) — ✅
  the script now verifies every registered world in one run
- Second sound built end-to-end to prove the pipeline (`/P/` or `/B/`) — ✅
  P Party: POP, PIG, PIZZA, PENGUIN, PANDA in the Party Plaza of P

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

- Microphone capture with explicit, child-appropriate permission flow
- Real pronunciation feedback (recording, playback, comparison)
- Honest confidence reporting — never a fabricated score
- Manual "I said it" confirmation remains available as a fallback

## Phase 5 — Parent + Child Profiles

- Multiple child profiles per household
- Server-backed progress replacing the local storage implementation
  (the `ProgressStore` interface already draws this seam)
- Parent view of practice history

## Phase 6 — Whop Integration

- Membership-gated access via the platform boundary in `src/platform/`
- Embedded (iframe) hosting alongside continued standalone operation
- Entitlement checks gate *content*, never the ability to run the app

## Phase 7 — Game Expansion

- Additional worlds, mini-games, and formats
- Avatar customization
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
