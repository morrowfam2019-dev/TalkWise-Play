# Play `main` merge gate

The Academy integration branch may be reviewed and tested without changing deployed Play `main`.

Do not merge to `main` until:
1. Academy and Play Staging runtime variables are configured.
2. The end-to-end `GAME-002` launch succeeds in Staging.
3. The Play integration CI is green on the final candidate commit.
4. Physical-device Voice + Manual fallback validation is complete where required.
5. Founder approval is given for the deployed Play `main` change.
