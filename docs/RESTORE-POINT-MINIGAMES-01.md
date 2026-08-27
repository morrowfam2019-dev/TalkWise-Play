# Restore point — before Mini Games Launch Collection 01

## The commit

```
4df4b2182d62519172f664d6abd17d34c36c6750
Merge pull request #4 from morrowfam2019-dev/claude/speech-adventures-progression-9hvxzw
```

Pushed to the remote as the branch **`restore/pre-minigames-collection-01`**.
(As with the previous restore point, a tag ref could not be pushed — this
environment's git proxy refuses tag refs with a 403 — so the branch is the
durable remote marker.)

This is the last commit of the founder-approved, production-working
TalkWise Play platform *before* Launch Collection 01 (GAME-003 … GAME-008)
was added.

## What it contains

- **Platform** — Whop entitlement, external-browser launch bridge, signed
  session cookies, KV-backed progress, game registry, universal coin wallet,
  child profiles.
- **GAME-001 Speech Adventures** — three stages (Beginner Sound Explorer,
  Intermediate Word Adventures, Expert Sentence Adventures), character shop,
  its own save namespace.
- **GAME-002 Speech Basketball** — Shootout, Time Attack, Clutch (coming
  soon), baller shop, its own save namespace.

## Verified green at this commit

Run immediately before any Launch Collection 01 code was written:

| Command | Result |
| --- | --- |
| `npm run build` | pass — 22 routes compiled |
| `npm run lint` | pass — no findings |
| `npm run typecheck` | pass |
| `npm run verify:progress` | pass — 31 checks |
| `npm run verify:speech` | pass — 299 checks |
| `npm run verify:world` | pass — 0 problems |

## How to restore

Whole-repo rollback:

```bash
git fetch origin restore/pre-minigames-collection-01
git reset --hard origin/restore/pre-minigames-collection-01
```

Or redeploy that branch directly from the hosting dashboard.

## What a rollback costs, and what it does not

Rolling back removes the six mini-games and the shared framework. It does
**not** strand anybody's saved data:

- Launch Collection 01 adds `games["GAME-003"]` … `games["GAME-008"]` as new
  sibling keys under each child profile. It does not rename, re-key or
  rewrite `GAME-001` or `GAME-002` state, the wallet, the streak, or the
  household shape.
- A pre-collection build reading a post-collection profile simply ignores the
  six keys it does not know. `sanitizeProfile` preserves the namespaces it
  recognises and drops nothing else.
- Coins earned in a mini-game are already in the shared wallet as plain
  `totalCoins`, so they survive a rollback intact.

The same additive discipline as the v1→v2 household migration and the
GAME-002 mode expansion.
