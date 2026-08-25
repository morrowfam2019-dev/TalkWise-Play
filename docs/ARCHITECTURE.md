# TalkWise Play — platform architecture

> Written so a future session can understand the shape of this codebase
> without rediscovering it. If you are about to add a game, read
> [Adding GAME-003](#adding-game-003) and nothing else should be necessary.

## The one-sentence version

**TalkWise Play is a platform that owns a library of independent games.**
Speech Adventures is GAME-001. Speech Basketball is GAME-002. Neither owns
the platform, and neither can reach into the other.

## Layers

```
src/
  platform/          Whop identity, entitlement, launch bridge, game registry
  speech/            Shared speech services: recognition + Miss Maya's voice
  content/
    speech/          Shared speech content — both games ask it for challenges
                     beginner/  sound library + developmental groups
                     expert/    sentence quests
                     curriculum.ts  the sound → word → sentence view
    shop-item.ts     The 4 fields every shop item has, whoever sells it
    adventures/      GAME-001 catalogue (characters, hats, auras, boosts)
    basketball/      GAME-002 catalogue (ballers, jerseys) + court/scoring data
  games/
    adventures/      GAME-001 engine — 3D world, controller, challenge modal
                     explorer/  BEGINNER — open maps, sound stations
                     expert/    EXPERT — sentence story shell
    basketball/      GAME-002 engine — court, shot meter, round logic
  player/            Child profiles, wallet, per-game namespaces, persistence
  ui/                Platform-level shared components
  app/
    (protected)/     Everything behind the membership gate
    launch/          Launch-credential redemption (ungated by necessity)
    locked/          "Membership required" screen (ungated by necessity)
    api/             launch + progress endpoints
```

The dependency rule: **games may depend on platform, content and player.
Platform must never depend on a game. Games must never depend on each
other.** Basketball's only cross-module imports are `@/speech/*`,
`@/content/*`, `@/player/*` and `@/ui/*` — verify with:

```bash
grep -rh 'from "@/' src/games/basketball | sed 's/.*from "//; s/".*//' | sort -u
```

## Game registry

`src/platform/games/registry.ts` is the single source of truth for which
games exist. The library homepage, routing and every namespaced data lookup
read from it.

| Permanent id | Display name (rebrandable) | Route |
| --- | --- | --- |
| `GAME-001` | Speech Adventures | `/games/adventures` |
| `GAME-002` | Speech Basketball | `/games/basketball` |

**Permanent ids are immutable.** They are written into saved progress,
inventories and high scores. `displayName` is the only thing marketing may
change — renaming "Speech Basketball" to "TalkWise Hoops" must never orphan
a child's data, which is exactly why the two are separate fields.

## Player data model

`src/player/types.ts`.

```
Household
  └── children[childId]: PlayerProfile
        ├── name, totalCoins, spentCoins        ← platform-wide
        ├── currentStreak, bestStreak           ← platform-wide
        ├── micEnabled, assistMode              ← platform-wide
        └── games
              ├── GAME-001 → { owned, loadout, levels, beginner, expert }
              └── GAME-002 → { owned, loadout, highScores, modes, … }
```

Anything that belongs to the *child* is platform-level. Anything that
belongs to a *game* is namespaced under `games[GAME_ID]`.

`purchaseItem` and `equipItem` both require an explicit `gameId`, so a call
site cannot write into a game it did not name. That is the mechanism that
keeps a basketball jersey out of the Adventures wardrobe — enforced by the
function signature, not by convention.

### The coin decision

Coins are a **universal TalkWise Play wallet**, not per-game currency.
Coins earned anywhere are spendable anywhere. This is the behaviour the game
already shipped with and it was preserved deliberately rather than silently
redenominating anyone's savings.

What is *not* shared is what coins buy: every purchase lands in the buying
game's own inventory. Per-game currency would be a product decision and an
explicit migration, not a refactor.

### Storage and migration

`talkwise-play/household/v2` in `localStorage`, plus the server copy below.

`sanitizeProfile` accepts both shapes. A v1 profile is flat — its
`owned`/`loadout`/`levels` were all Adventures data because Adventures was
the only game — so those fields are read straight into the GAME-001
namespace, which is where they always belonged. The wallet, streak and
settings are platform-level in both shapes and carry across untouched.
Nothing is duplicated and no coins are minted. The v1 key is left in place,
so rolling a deploy back does not strand anyone's progress.

## Server-backed progress

`src/platform/progress/store.ts` + `/api/progress` + `src/player/ProgressSync.tsx`.

```
Whop member (the family)
  └── child profile
        └── game id
              └── that game's progress, inventory, records
```

Keyed by the **verified** Whop member id, taken from the session cookie or
Whop token and never from the request body.

**The rule that prevents duplicated rewards:** the server is canonical
whenever it holds anything. Local storage is uploaded only when the server
has no save for that member at all — a genuine first migration. The two
copies are never merged and coin totals are never summed, so a migration
that runs twice is a no-op rather than a way to mint currency.

Writes are re-sanitised server-side through the same `sanitizeHousehold` the
client uses. This is anti-corruption, not anti-cheat — coin totals are still
client-authored, the honest tradeoff for a single-player practice game with
no competitive stakes.

## The Whop launch bridge

### Why it exists

Speech recognition does not work inside Whop's embedded iOS webview. Every
browser on iOS runs on WebKit, and in-frame the speech APIs a child needs
are unusable. But Whop is the paid access gate. So the two roles are split:
**Whop proves membership, the member's own browser runs the game.**

### The flow

1. Member opens TalkWise Play inside Whop.
2. `(protected)/layout.tsx` resolves access. A verified, entitled member in
   the Whop frame gets `LaunchScreen` — **not** the game.
3. Tapping OPEN TALKWISE PLAY posts to `/api/launch`, which mints a launch
   credential only for a request Whop itself signed carrying a live
   entitlement.
4. The member's default browser opens `/launch?t=…`.
5. `/launch` redeems the credential, burns it, sets a signed HttpOnly
   session cookie, and redirects to the library with the token stripped from
   the URL.

### Security properties

- Launch credentials live **2 minutes**, are redeemed **once**, contain no
  Whop API key and no reusable credential, and can buy nothing except a
  session on our own origin.
- With KV configured, the credential is a fully opaque random string held
  server-side and deleted atomically with `GETDEL` — single-use is absolute
  across every serverless instance.
- Without KV, it falls back to a signed expiring token plus a per-instance
  burn list. A replay on the minting instance is refused; cross-instance,
  the 2-minute expiry is the bound. **Configure KV in production.**
- Sessions are `HttpOnly` + `Secure` + `SameSite=lax` signed cookies. Never
  `localStorage`. They carry a Whop user id and two timestamps — nothing else.
- Entitlement is re-checked against Whop every **12 hours**, so a cancelled
  membership loses access the same day. A Whop outage during revalidation
  keeps the family playing rather than ejecting them mid-practice.
- Knowing the public URL grants nothing. An unauthenticated visitor gets
  `/locked`, which renders no level list, no profiles and no game content.

### The enforcement switch

The gate activates only once `TALKWISE_LAUNCH_SECRET` is set, because a gate
that cannot verify its own tokens would lock members out rather than let
them in. Until it is set, TalkWise Play behaves exactly as it did before the
bridge existed.

## GAME-001's three stages

Speech Adventures is one game with three stages of production. The stages
are the product: a child does not "get better at Speech Adventures", they
move from making a sound, to using it in a word, to using it in a sentence.

```
BEGINNER      Sound Explorer       /m/                        "I can make the sound."
INTERMEDIATE  Word Adventures      MOON                       "I can use it in a word."
EXPERT        Sentence Adventures  "I see the big moon."      "I can use it in a sentence."
```

**The join between the three is a single shared id.** `BeginnerSound.id`,
`SpeechSound.id` on an Intermediate level, and `ExpertQuest.soundId` are the
same string. Nothing else has to line up, so a sound can exist at one stage
before the others catch up — which is exactly the state the library will be
in for the eighth sound. `content/speech/curriculum.ts` is the read-only
view over that join; it owns no content of its own, so adding content never
means editing it.

```
src/
  content/speech/
    beginner/    groups.ts (developmental grouping + its rationale)
                 sounds.ts (the sound library, incl. recognition config)
    levels/      INTERMEDIATE — the original word adventures, untouched
    tiers.ts     phrase + sentence ladders per sound
    expert/      quests.ts (one authored quest + generated ones)
    curriculum.ts
  games/adventures/
    explorer/    BEGINNER — maps/, ExplorerShell, SoundStationModal
    (root)       INTERMEDIATE — GameShell, GameScene, ChallengeModal
    expert/      EXPERT — QuestShell, SentenceChallenge
```

Routes: `/games/adventures` is the stage picker; `/beginner`, `/intermediate`
and `/expert` are the three stage homes. **The original play route
`/games/adventures/play/[levelId]` is unchanged**, so every existing link,
bookmark and legacy redirect still lands on the same adventure.

### Beginner reuses the engine rather than forking it

An explorer map is a `WorldDefinition` with sound stations where checkpoints
would be — `toWorldDefinition()` adapts it — so Beginner runs the *same*
collision, controller, camera, terrain renderer and touch controls the word
adventures already shipped. Two things differ, and only two: stations stand
where checkpoints would, and there is no finish portal, because an open park
has nothing to finish.

Stations stay re-enterable: the controller is passed an all-false
`completed` array, so a child who has already lit /m/ can walk back to the
swings tomorrow and say it again. Trigger radius is a prop, defaulted to the
word adventures' value and widened only for Beginner — on a 104 × 104 map a
four-year-old aiming at a letter should not be able to walk past it.

### Beginner cannot be failed

Browser speech recognition is unreliable on isolated consonants. That is a
platform fact, not a tuning problem, and an earlier isolated-sound
difficulty tier was removed from this codebase for exactly that reason. The
Beginner tier is built for that reality instead of against it:

- `SoundRecognizer` accepts a wide set of transcripts per sound — what
  browsers actually return for a hummed consonant, plus any token starting
  with the sound, plus the sound's anchor word;
- three misses credit the turn anyway;
- the manual "I SAID IT" button is on screen from the first second, not
  unlocked by failing.

Nothing in Beginner scores, grades or records accuracy. The save layer
counts turns taken and turns finished, and that is all it counts.

### Expert is DOM, not WebGL

Expert is a communication challenge, not a traversal one: a character puts a
situation to you, you say a sentence, the world answers. Walking to the next
checkpoint would add nothing to that and would make Expert read as
Intermediate with longer signs. It is also the honest scope call — one
polished mobile-first Expert experience now beats a half-built second 3D
engine, and everything on screen comes from `ExpertQuest` data, so adding a
story is a content change.

Recognised words stay recognised across attempts (`PhraseRecognizer`
accumulates by word id), so a learner repairs the one word they missed
rather than restarting the sentence.

### GAME-001 save shape

```
games["GAME-001"]
  ├── owned, loadout        shop inventory — shared by all three stages
  ├── levels                INTERMEDIATE — the original key, unmoved
  ├── beginner              { maps: { [mapId]: { stations, celebrated } } }
  └── expert                { quests: { [questId]: { bestScenes, … } } }
```

`levels` was **deliberately not renamed**. Every production profile already
has it, the word adventures already write it, and moving live saved data to
a new key buys nothing but a migration that can strand somebody. The stage a
record belongs to is expressed in the types and accessors, not in a key
rename. `sanitizeAdventuresState` additionally accepts an
`intermediate.levels` shape and merges it record-by-record, so a save
written by any future build that does move the key is read rather than
dropped.

`beginner` and `expert` are new sibling keys. A pre-upgrade profile has
neither, gets the empty defaults, and loses nothing — the same additive
pattern as the v1→v2 household migration. A rollback is equally safe: an
older build ignores the two keys it does not know, and `levels` is exactly
where it always was.

Sanitising is idempotent, which matters because the household is
re-sanitised on every read, on every write, and again server-side.
`npm run verify:progress` proves it.

### Stage access

No stage is locked behind another, and no map is locked behind another map.
A family picks where their child belongs today. Placement is a product
decision for later; guessing at it here would mean the game telling a
four-year-old what they are not ready for.

The Beginner sound *grouping* follows the broad consensus on typical English
consonant acquisition (Shriberg's Early-8 / Middle-8 / Late-8; Crowe &
McLeod 2020), clustered by articulator so a pre-K learner practises one
mouth movement at a time. It orders **content**, not children — see
`content/speech/beginner/groups.ts` for the rationale and the explicit
non-claims.

## GAME-002's mode system

Speech Basketball is one game with several ways to play it. It applies the
same discipline to its modes that the platform applies to its games.

```
src/games/basketball/
  modes/
    registry.ts               which modes exist — the single source of truth
    shootout/ShootoutMode.tsx    MODE 01, speech before every shot
    timeattack/TimeAttackMode.tsx MODE 02, one speech gate then 30s of arcade
    clutch/                      MODE 03, Coming Soon (rules in core/clutch.ts)
  core/      round.ts (Shootout rules) · arcade.ts (Time Attack physics)
             rewards.ts (coin formulas) · clutch.ts · audio.ts
  scene/     Court · Hoop · BallerAvatar · Ball · CourtScene · ArcadeScene
  ui/        SpeechGate (shared) · ModeSetup (shared) · per-mode HUD/results
```

**Shared by every mode:** the court, hoop and ball geometry, the selected
baller, the speech gate, the sound/difficulty picker, the audio, and the
save layer. **Owned by each mode:** its rules, its timer, its scoring, its
speech cadence, and its result shape. A mode is a component plus a registry
entry plus a record slot — nothing else in Basketball needs editing to add
one, which is the same promise `Adding GAME-003` makes at the platform level.

Routes: `/games/basketball` (mode select) → `/games/basketball/<slug>`
(sound + difficulty) → the mode's play route. Shootout's original
`/games/basketball/play/[soundId]` is unchanged and still works, with
difficulty as an optional query parameter.

### Speech difficulty is not game difficulty

`content/speech/engine.ts` answers `gameId + mode + practiceTrack +
languageBackground + soundId + difficulty + targetCount → SpeechTarget[]`.
Easy/Intermediate/Hard describe how hard the **talking** is — sound-builder
syllables, whole words and phrases, full sentences. Basketball's shot-meter
tuning in `content/basketball/types.ts` is a separate axis and was left
alone. Games never own word lists; ladders live in `content/speech/tiers.ts`.

`practiceTrack` and `languageBackground` are in the signature but default to
Speech Development today. That is deliberate: adding an English-Pronunciation
track with language-background pools later must be a data change here, not a
second basketball engine per language.

### GAME-002 save shape

```
games["GAME-002"]
  ├── owned, loadout            unchanged
  ├── highScores                unchanged — Shootout, keyed by sound id alone
  ├── modes                     shootout | timeAttack | clutch,
  │                             each keyed `${soundId}:${difficulty}`
  ├── difficultyProgress        keyed `${soundId}:${difficulty}`
  ├── achievements
  └── dailyPlays                today's per-mode counts, for coin caps
```

`highScores` is the original map and every production profile has it, so it
is left exactly as it was and Shootout keeps writing it. Everything new lives
alongside. A profile saved before the expansion has no `modes` key,
`sanitizeBasketballState` supplies the empty default, and nothing is lost or
recomputed — the same additive pattern as the v1→v2 household migration.
Legacy scores are deliberately **not** back-filled into mode records, because
that would invent a difficulty the child never played at.

## Adding GAME-003

1. Register it in `src/platform/games/registry.ts` (new permanent id).
2. Add its state slice in `src/player/games/<game>.ts` — default state and a
   `sanitize` function — and wire it into `GameStates` in `player/types.ts`
   and `sanitizeProfile` in `player/storage.ts`.
3. Add its engine under `src/games/<game>/` and its content under
   `src/content/<game>/`.
4. Add routes under `src/app/(protected)/games/<game>/`.
5. If it sells anything, give it its own shop screen writing to its own
   namespace via `buyItem(GAME_00N, item)`.

Nothing in GAME-001 or GAME-002 should need editing. If it does, the
abstraction is wrong — fix that rather than working around it.

## Verification

Three Node suites run the real game logic with no browser and no rendering.
They are the fastest way to know a data change did not quietly break a
level, a save, or the speech ladder.

| Command | What it proves |
| --- | --- |
| `npm run verify:world` | Every word adventure walks spawn → checkpoints → portal, and every Beginner map walks spawn → every station → home, with no fall and no stuck leg. Anchors and coins sit on the surface. |
| `npm run verify:progress` | v1 and pre-tier saves migrate intact, sanitising is idempotent, and no stage or game can write into another's records. |
| `npm run verify:speech` | Every sound matches everything its recognition config lists and rejects silence; the sound → word → sentence ladder joins up for every supported sound; every Expert sentence splits into matchable words. |

Add `npm run build`, `npm run lint` and `npm run typecheck` and that is the
full gate. A map is data, and data is easy to get subtly wrong.

## Privacy notes

- The only child data stored is a display name the family types in, plus
  gameplay progress. No email, no location, no contact details, no free text.
- There is no chat, no friends, no public profile and no child-to-child
  contact of any kind, by design.
- The parent view is **not** password-protected. It is as private as the
  device it is opened on. This is flagged on the page itself and is worth a
  product decision before any wider rollout.
- Server-stored progress is keyed by Whop member id. Deleting a member's
  stored progress currently has no self-serve path — worth building before
  making any data-deletion promises.
- **No COPPA compliance claim is made or implied here.** Anything in that
  territory needs founder/legal review, not an engineering assumption.

## Environment variables

See `.env.example`. Summary:

| Variable | Required for | Effect if missing |
| --- | --- | --- |
| `WHOP_API_KEY`, `NEXT_PUBLIC_WHOP_APP_ID`, `WHOP_EXPERIENCE_ID` | Whop identity + entitlement | App runs standalone, unintegrated |
| `TALKWISE_LAUNCH_SECRET` | Launch bridge + membership gate | Enforcement off, app openly reachable |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Absolute single-use tokens, cross-device progress | Both degrade safely; progress stays local |
| `NEXT_PUBLIC_APP_URL` | Pinning the launch origin | Derived from the request |
