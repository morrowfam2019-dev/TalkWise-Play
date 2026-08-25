# Restore point — before the GAME-001 three-level progression upgrade

## The commit

```
1b9c5a08e2bc6a189f7805d8f6a2ae2ac68875cb
Rebalance character shop pricing in both games
```

Pushed to the remote as the branch **`restore/pre-game001-progression`**,
and tagged locally under the same name. (The tag itself could not be pushed
— this environment's git proxy refuses tag refs with a 403 — so the branch
is the durable remote marker.)

This is the last commit of the founder-approved, production-working
TalkWise Play platform *before* Speech Adventures was split into
Beginner / Intermediate / Expert.

## What it contains

- Platform: Whop entitlement, external-browser launch bridge, signed session
  cookies, KV-backed progress, game registry, universal wallet.
- GAME-001 Speech Adventures: 7 word adventures (M, P, B, W, S, L, F) at
  `/games/adventures`, played at `/games/adventures/play/[levelId]`.
- GAME-002 Speech Basketball: Shootout, Time Attack, Clutch (coming soon),
  baller shop, its own save namespace.
- Verified green at this commit: `npm run build`, `npm run lint`,
  `npm run typecheck`.

## How to restore

Whole-repo rollback:

```bash
git fetch origin restore/pre-game001-progression
git checkout -B <branch> origin/restore/pre-game001-progression
git push --force-with-lease origin <branch>
```

Or, on Vercel, promote the deployment built from commit `1b9c5a0`.

## What a rollback does to saved data

Nothing is lost. The progression upgrade is **additive** to saved data:

- Existing word-adventure records stay exactly where they have always been,
  at `profile.games["GAME-001"].levels[levelId]`. The upgrade does not move,
  rename, or rewrite them — it reads them as the Intermediate tier in place.
- Beginner and Expert progress is written to **new** keys
  (`games["GAME-001"].beginner` and `.expert`). A rolled-back build simply
  ignores keys it does not know about; `sanitizeAdventuresState` drops
  unknown fields without touching `levels`, `owned` or `loadout`.
- The wallet, streak and settings are platform-level and untouched by any of
  this.

So a child who plays Beginner on the new build and is then rolled back keeps
every coin and every word-adventure record; only the (new) Beginner map
progress is invisible to the old build — and it returns if the new build is
redeployed, because the server copy is never rewritten to remove it.
