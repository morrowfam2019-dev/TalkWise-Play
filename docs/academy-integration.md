# TalkWise Academy → TalkWise Play bridge

Status: Stage 1 integration candidate. This document describes the contract only; it does not approve the current game visuals as final.

## Contract

1. TalkWise Academy authorizes the adult, household, learner, entitlement, and requested permanent `GAME-###` id.
2. Academy mints a short-lived signed launch credential containing IDs only.
3. TalkWise Play redeems the credential once, validates issuer/audience/time/game format, and burns the nonce.
4. The credential is exchanged for an HttpOnly browser session and removed from the URL.
5. Academy sessions carry exactly one or more explicitly allowed game IDs; direct navigation to an ungranted game is denied server-side.
6. A stale legacy Whop session must not widen an Academy-scoped launch.
7. Voice and Manual Mode remain game capabilities. Manual Mode is never removed as a consequence of speech recognition support.
8. No raw child speech, recording, transcript, email, or child name is required in the launch credential.

## Stable game identities

- `GAME-001` Speech Adventures
- `GAME-002` Speech Basketball — Stage 1 Academy free Play pilot
- `GAME-003` Bubble Blast
- `GAME-004` Sound Match
- `GAME-005` Colour & Shape Hunt
- `GAME-006` Guess the Sound

These IDs are permanent data identities, not visual approvals. The Basketball renderer, 3D scene, characters, court, animation, effects, UI, and gameplay presentation may be substantially upgraded later without changing `GAME-002` or orphaning progress.

## Verification

The `academy-integration` branch runs Node 22 CI with TypeScript, lint, progress/speech/minigame verification, and a production build. Do not merge this branch into deployed `main` until the Academy/Play environment secrets and end-to-end Staging launch are configured and verified.
