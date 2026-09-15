# Stage 1 Academy bridge review status

This branch is intentionally isolated from deployed `main`.

Completed in code:
- signed Academy launch claim validation
- one-time nonce redemption path with KV support and in-memory development fallback
- HttpOnly Academy browser session
- Academy session precedence over stale legacy browser session
- permanent game-ID scope enforcement on every concrete game route
- Academy-aware platform session
- Academy learner-scoped progress storage keying
- existing Whop flow preserved
- Node 22 integration CI

Still environment-dependent before merge/deployment:
- configure the same 32+ character Academy/Play launch secret in the Academy and Play Staging runtimes
- configure the Academy Staging Play URL
- configure durable nonce storage for multi-instance Play deployment
- complete an actual browser launch from Academy Staging into `GAME-002`
- verify microphone + Manual Mode on a physical iPhone/iPad

Current Speech Basketball visuals are not approved as final and are independent of this bridge.
