# Project workflow

- Read `docs/TASK_QUEUE.md` and finish one queued step at a time. Follow the user's standing commit, deployment and checkpoint instructions.
- `package.json` is the only authored source of the game version. Do not copy version numbers into UI or HTML. Game versions and `SAVE_VERSION` are separate; change the save schema only when data changes require migration.
- After completing and verifying a feature or fix, add a concise, player-facing English entry to `CHANGELOG.md` under `Unreleased`, in Added/Changed/Improved/Fixed/Balance/Removed as appropriate. Describe actual behaviour, not plans, commit counts or unverified work.
- Do not turn every commit into a release. Prepare a numbered release only when the developer asks. `npm run release:prepare -- minor|patch|major` prepares local files; it never commits, tags, pushes or publishes. Publishing ordinary queued work follows the user's explicit standing instructions.
- `CHANGELOG.md` is the only authored history. Vite generates the player data from released entries; never maintain a second manual list. Keep Unreleased hidden from players.
- Run `npm run changelog:validate`, relevant tests and the production build before completing work. Check Save/Load compatibility whenever changing persistent models.
- Existing `public/versions/<commit>/` snapshots are immutable. Add historical builds only from their actual Git commits and run `npm run archive:verify`.
