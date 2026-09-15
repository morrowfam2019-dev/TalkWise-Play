# Academy bridge security assumptions

- Academy and Play share a dedicated launch secret only in matching non-production/production environments; never expose it to client JavaScript.
- The launch token is a bearer credential but is deliberately short lived and one-time redeemable.
- The token contains identifiers only and no raw speech, transcript, child email, exact DOB, address, or diagnosis data.
- A redeemed Academy session is HttpOnly and game scoped.
- Route authorization is enforced server-side on each concrete game route.
- Durable replay protection is required for horizontally scaled deployments; the in-memory nonce fallback is acceptable only for local/single-instance development.
- Staging and Production must use different launch secrets.
- Visual/gameplay upgrades are independent of the authentication/authorization contract.
