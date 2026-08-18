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
    speech/          Shared word content — both games ask it for challenges
    shop-item.ts     The 4 fields every shop item has, whoever sells it
    adventures/      GAME-001 catalogue (characters, hats, auras, boosts)
    basketball/      GAME-002 catalogue (ballers, jerseys) + court/scoring data
  games/
    adventures/      GAME-001 engine — 3D world, controller, challenge modal
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
              ├── GAME-001 → { owned, loadout, levels }
              └── GAME-002 → { owned, loadout, highScores }
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
