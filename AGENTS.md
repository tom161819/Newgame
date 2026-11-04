# Collaboration between Claude and Codex

Claude (Claude Code, reads `CLAUDE.md`, which imports this file) and Codex (reads this file) develop this repository at the same time. Both follow the same rules. They override older instructions in `docs/TASK_QUEUE.md`, `docs/upgrades/00_ORCHESTRATOR.md`, `docs/UPGRADE_ROADMAP_25_37.md` and stage requests that ask an agent to commit, push, deploy, tag or release directly on `main`.

1. Never commit or push to `main`. The developer reviews and merges every pull request. GitHub Pages deploys only from those merges.
2. One task, one branch from current `main`: Claude uses `claude/<task>`, Codex uses `codex/<task>`. Never commit to the other agent's branches or to `backup/*` branches unless the developer asks.
3. Finish every task with a pull request into `main`. If it depends on another open pull request, branch from that work and state the dependency and merge order in the description.
4. Before starting: `git fetch`, check `main`, open pull requests and `docs/COORDINATION.md`; run `npm ci` when dependencies changed.
5. Register the task in `docs/COORDINATION.md` (owner, branch, files held). Do not edit files another active task holds unless it is necessary; then note it in `docs/COORDINATION.md` and in the pull request.
6. Before finishing: `npm test`, `npm run changelog:validate`, the production build (`npm run build:pages`) and the browser smoke tests relevant to the change (`npm run smoke -- --base=/Newgame/`, with `--current-only` or `--full` as appropriate). Report real results, including anything not verified.
7. Describe every pull request briefly: what changed, tests and smoke results, Save/Load impact, files touched.
8. No force push, no history rewriting, never discard unfinished work. Save interrupted work as a clearly marked WIP commit on your own branch and push it.
9. Release gates, version numbers, tags and archive snapshots are prepared on a branch and published only after the developer merges them and explicitly asks for a release.

# Project workflow

- Read `docs/TASK_QUEUE.md` and finish one queued step at a time. Follow the user's standing commit, deployment and checkpoint instructions.
- `package.json` is the only authored source of the game version. Do not copy version numbers into UI or HTML. Game versions and `SAVE_VERSION` are separate; change the save schema only when data changes require migration.
- After completing and verifying a feature or fix, add a concise, player-facing English entry to `CHANGELOG.md` under `Unreleased`, in Added/Changed/Improved/Fixed/Balance/Removed as appropriate. Describe actual behaviour, not plans, commit counts or unverified work.
- Do not turn every commit into a release. Prepare a numbered release only when the developer asks. `npm run release:prepare -- minor|patch|major` prepares local files; it never commits, tags, pushes or publishes. Publishing ordinary queued work follows the user's explicit standing instructions.
- `CHANGELOG.md` is the only authored history. Vite generates the player data from released entries; never maintain a second manual list. Keep Unreleased hidden from players.
- Run `npm run changelog:validate`, relevant tests and the production build before completing work. Check Save/Load compatibility whenever changing persistent models.
- Existing `public/versions/<commit>/` snapshots are immutable. Add historical builds only from their actual Git commits and run `npm run archive:verify`.
- Historical bundles are generated data, not current source. Keep them out of broad searches/context; use the catalog, manifests and actual Git source for archive work. `.rgignore` excludes them from ordinary ripgrep discovery. Do not read minified snapshots to learn the current architecture.
- `.gitattributes` suppresses generated archive text diffs; inspect SHA manifests, derived metadata and original source commits instead. This does not change tracked bytes or weaken `archive:verify`.
