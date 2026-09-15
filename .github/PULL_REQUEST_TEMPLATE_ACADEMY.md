## TalkWise Academy integration checklist

- [ ] Academy launch token is short lived, signed, and one-time redeemable.
- [ ] Academy session is learner + game scoped.
- [ ] Direct navigation to unauthorized `GAME-###` routes is denied server-side.
- [ ] Legacy Whop access cannot widen Academy game scope.
- [ ] Manual Mode remains available.
- [ ] No raw child speech/transcript/recording is stored by the bridge.
- [ ] Node 22 CI passes typecheck, lint, verification scripts, and production build.
- [ ] Staging environment secrets are configured independently.
- [ ] End-to-end Staging launch from Academy to `GAME-002` is verified.
- [ ] No visual approval of Speech Basketball is implied by this integration PR.
- [ ] Founder approves any merge that would affect the deployed Play `main` branch.
