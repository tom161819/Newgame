# Collaboration between Claude and Codex

Claude (Claude Code, reads `CLAUDE.md`, which imports this file) and Codex (reads this file) develop this repository at the same time. Both follow the same rules. They override older instructions in `docs/TASK_QUEUE.md`, `docs/upgrades/00_ORCHESTRATOR.md`, `docs/UPGRADE_ROADMAP_25_37.md` and stage requests about how work reaches `main`. The developer's standing instruction stays: verified work is published to GitHub and GitHub Pages without waiting for manual approval; it now goes through a pull request that the agent merges itself.

1. Never push commits directly to `main`. Work reaches `main` only by merging a pull request (merge commit; no squash or rebase of shared history). Each merge deploys GitHub Pages.
2. One task, one branch from current `main`: Claude uses `claude/<task>`, Codex uses `codex/<task>`. Never commit to the other agent's branches or to `backup/*` branches unless the developer asks.
3. Finish every task with a pull request into `main`. If it depends on another open pull request, branch from that work and state the dependency and merge order in the description.
   - The agent that opened a pull request merges it itself once rule 6 passes and GitHub reports no conflicts. If `main` moved meanwhile, merge `main` into the branch (never force push), rerun the checks, then merge.
   - Resolve routine merge conflicts autonomously in your own task branch, preserving both agents' intended changes. The user explicitly removed the previous conflict-confirmation requirement on 2026-11-04. Inspect both sides, run relevant tests and record the resolution; never discard another agent's work or rewrite shared history. Ask only when intent is genuinely ambiguous or a real technical blocker cannot be resolved.
   - Merge the other agent's pull request only when the developer asks, or when it is the next item in an agreed merge order in `docs/COORDINATION.md` and its own description says it is verified.
   - Do not merge a pull request marked draft, WIP or "hold", or one the developer asked to wait.
   - After a merge, check that the GitHub Pages workflow run for it succeeded; if it failed, fix it at once in a new branch and pull request.
4. Before starting: `git fetch`, check `main`, open pull requests and `docs/COORDINATION.md`; run `npm ci` when dependencies changed.
5. Register the task in `docs/COORDINATION.md` (owner, branch, files held). Do not edit files another active task holds unless it is necessary; then note it in `docs/COORDINATION.md` and in the pull request.
6. Before finishing: `npm test`, `npm run changelog:validate`, the production build (`npm run build:pages`) and the browser smoke tests relevant to the change (`npm run smoke -- --base=/Newgame/`, with `--current-only` or `--full` as appropriate). Report real results, including anything not verified.
7. Describe every pull request briefly: what changed, tests and smoke results, Save/Load impact, files touched.
8. No force push, no history rewriting, never discard unfinished work. Save interrupted work as a clearly marked WIP commit on your own branch and push it.
9. Milestone releases M1–M5 are explicitly authorized in advance (user renewed this instruction on 2026-11-04). After the milestone gate passes, autonomously prepare the next MINOR version, changelog and source-verified archive in a branch, merge through a pull request, publish the real tag for the merged release source, verify GitHub Pages success and continue the next task in `docs/TASK_QUEUE.md`. Do not wait for another release instruction or confirmation, including after Stage10/M2; this supersedes the earlier uploaded handoff requiring a stop there. Keep all required tests and release/deployment checks. Stop only for a genuine unresolved technical blocker or environment limitation, save a recoverable checkpoint, and never claim a blocked publication succeeded.

# Current queue priority — explicit user reorder, 2026-11-04

Finish the active M2 publication, then C01–C08 in order, then original master
11–15 in order. The user moved Stone Pavement, Wheelwright/Wagons/Stables/Housing,
Needs/Happiness, Trade and Background Simulation behind those eight tasks.
Keep original IDs and M3–M5 release gates; this order overrides older requests
that put C01–C08 after master15. Follow `docs/TASK_QUEUE.md` and
`docs/CODEX_PROGRESS.md`, including the deferred Stables/Knight dependency.

# Project workflow

- Read `docs/TASK_QUEUE.md` and finish one queued step at a time. Follow the user's standing commit, deployment and checkpoint instructions.
- `package.json` is the only authored source of the game version. Do not copy version numbers into UI or HTML. Game versions and `SAVE_VERSION` are separate; increase `SAVE_VERSION` whenever the persistent data model changes (see Alpha save policy).
- After completing and verifying a feature or fix, add a concise, player-facing English entry to `CHANGELOG.md` under `Unreleased`, in Added/Changed/Improved/Fixed/Balance/Removed as appropriate. Describe actual behaviour, not plans, commit counts or unverified work.
- Do not turn every commit into a release. Numbered M1–M5 milestone releases use the standing authorization above; no new prompt is needed. Unrelated standalone releases still follow the developer's scope. `npm run release:prepare -- minor|patch|major` prepares local files; complete the authorized Git/tag/archive/Pages workflow after validation.
- `CHANGELOG.md` is the only authored history. Vite generates the player data from released entries; never maintain a second manual list. Keep Unreleased hidden from players.
- Run `npm run changelog:validate`, relevant tests and the production build before completing work. Verify current-schema Save/Load whenever changing persistent models.
- Existing `public/versions/<commit>/` snapshots are immutable. Add historical builds only from their actual Git commits and run `npm run archive:verify`.
- Historical bundles are generated data, not current source. Keep them out of broad searches/context; use the catalog, manifests and actual Git source for archive work. `.rgignore` excludes them from ordinary ripgrep discovery. Do not read minified snapshots to learn the current architecture.
- `.gitattributes` suppresses generated archive text diffs; inspect SHA manifests, derived metadata and original source commits instead. This does not change tracked bytes or weaken `archive:verify`.

# Alpha save policy

Medieval Kingdom is in ALPHA and only its author tests it. Backward compatibility of saved games between versions is not required. These rules override any stage specification, request or older document that asks for save migrations or compatibility with older saves, until the developer explicitly asks for compatibility again.

1. Do not write migrations for older saves when the data model changes. Increase `SAVE_VERSION` instead.
2. Only remove obsolete requirements and tests that verify support for old formats. Keep every test needed for the current Save/Load.
3. Save and load must remain fully functional within the current schema version.
4. A save with another schema version is rejected before the running world changes (`IncompatibleSaveError`). The Load menu shows a clear notice and offers a new game. Never delete or convert saves automatically; deleting needs the player's confirmation.
5. Keep validating the consistency of resources, units, production tasks, reservations, construction and the economy on Save/Load.
6. `SAVE_VERSION` stays independent of the game version in `package.json`.
7. Never change or delete historical archive builds in `public/versions/`; each keeps its own isolated saves.
8. Claude (`CLAUDE.md`) and Codex (`AGENTS.md`) follow these same rules; `docs/upgrades/00_ORCHESTRATOR.md` and `docs/UPGRADE_ROADMAP_25_37.md` refer to them.
9. Later stages do not implement compatibility with older saves unless the developer explicitly asks for it again.
10. Never remove tests just to make a build pass. Keep or improve coverage of the current game behaviour.
