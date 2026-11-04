# Collaboration between Claude and Codex

Claude (Claude Code, reads `CLAUDE.md`, which imports this file) and Codex (reads this file) develop this repository at the same time. Both follow the same rules. They override older instructions in `docs/TASK_QUEUE.md`, `docs/upgrades/00_ORCHESTRATOR.md`, `docs/UPGRADE_ROADMAP_25_37.md` and stage requests about how work reaches `main`. The developer's standing instruction stays: verified work is published to GitHub and GitHub Pages without waiting for manual approval; it now goes through a pull request that the agent merges itself.

1. Never push commits directly to `main`. Work reaches `main` only by merging a pull request (merge commit; no squash or rebase of shared history). Each merge deploys GitHub Pages.
2. One task, one branch from current `main`: Claude uses `claude/<task>`, Codex uses `codex/<task>`. Never commit to the other agent's branches or to `backup/*` branches unless the developer asks.
3. Finish every task with a pull request into `main`. If it depends on another open pull request, branch from that work and state the dependency and merge order in the description.
   - The agent that opened a pull request merges it itself once rule 6 passes and GitHub reports no conflicts. If `main` moved meanwhile, inspect commits and files changed since the PR's last successful checks. **Do not routinely merge `main` back** merely because its SHA changed. If the new changes touch overlapping files, shared interfaces, dependent gameplay systems, Save/Load schema, or release/archive gates, or GitHub requires an up-to-date branch, merge `main` into your branch (never force push), rerun relevant checks, then merge. When changes are independent, GitHub reports no conflicts and mandatory checks are green, merge without a redundant sync commit and CI run. Never bypass required checks.
   - Resolve routine merge conflicts autonomously in your own task branch, preserving both agents' intended changes. The user explicitly removed the previous conflict-confirmation requirement on 2026-11-04. Inspect both sides, run relevant tests and record the resolution; never discard another agent's work or rewrite shared history. Ask only when intent is genuinely ambiguous or a real technical blocker cannot be resolved.
   - Merge the other agent's pull request only when the developer asks, when it is the next item in an agreed merge order in `docs/COORDINATION.md` and its own description says it is verified, **or when handling an eligible `[MERGE-HELP]` Issue under the strict verification rules below**.
   - Do not merge a pull request marked draft, WIP or "hold", or one the developer asked to wait.
   - After a merge, check that a GitHub Pages deployment containing that commit (or a newer descendant) succeeded; if it failed, fix it at once in a new branch and pull request. A previous run cancelled because of a newer `main` push is superseded, not a build failure: verify the newest deployment.
4. Before starting: `git fetch`, check `main`, open pull requests and `docs/COORDINATION.md`; run `npm ci` when dependencies changed.
5. Register the task in `docs/COORDINATION.md` (owner, branch, files held). Do not edit files another active task holds unless it is necessary; then note it in `docs/COORDINATION.md` and in the pull request.
6. Before finishing: `npm test`, `npm run changelog:validate`, the production build (`npm run build:pages`) and the browser smoke tests relevant to the change (`npm run smoke -- --base=/Newgame/`, with `--current-only` or `--full` as appropriate). Report real results, including anything not verified.
7. Describe every pull request briefly: what changed, tests and smoke results, Save/Load impact, files touched.
8. No force push, no history rewriting, never discard unfinished work. Save interrupted work as a clearly marked WIP commit on your own branch and push it.
9. Milestone releases M1–M5 are explicitly authorized in advance (user renewed this instruction on 2026-11-04). After the milestone gate passes, autonomously prepare the next MINOR version, changelog and source-verified archive in a branch, merge through a pull request, publish the real tag for the merged release source, verify GitHub Pages success and continue the next task in `docs/TASK_QUEUE.md`. Do not wait for another release instruction or confirmation, including after Stage10/M2; this supersedes the earlier uploaded handoff requiring a stop there. Keep all required tests and release/deployment checks. Stop only for a genuine unresolved technical blocker or environment limitation, save a recoverable checkpoint, and never claim a blocked publication succeeded.

## MERGE-HELP: hand off permission-blocked pull requests

A GitHub API `403 Forbidden` may mean an agent's integration cannot merge a PR even though the developer could merge it in the GitHub UI. It does **not** authorize bypassing branch protection or skipping required checks.

**Codex (or any agent blocked from merging its own PR):**

1. Before trying to merge, recheck the PR's live state, base branch (`main`), exact head SHA, dependency order, conflicts, required status checks and any review/hold requirements. Attempt a normal **merge commit**, not squash/rebase, only if allowed by rule 3.
2. On `403 Forbidden` or another *permissions-only* merge failure, do not retry the same denied operation in a loop. Do not interpret `403` as proof that the PR is safe or mergeable. Investigate the specific restriction where possible.
3. If the only blocker is the current agent's integration permissions, search open Issues for an existing `[MERGE-HELP]` request for this exact PR. If none exists, create **one** GitHub Issue titled `[MERGE-HELP] Codex PR #<number> – merge assistance`, with labels `agent:claude` and `status:ready`. Include the PR URL, base/head branch, exact current head SHA, required CI results and links, merge error/HTTP status, unresolved dependencies and any coordination/merge-order constraints. Do **not** post credentials or tokens.
4. Mark the original PR as **verified but unmerged / awaiting merge help**, link the Issue, and record the dependency in `docs/COORDINATION.md` when feasible. Do not mark the work deployed, merged or done before it truly reaches `main`. If Issue creation is also forbidden, leave the same handoff details in the PR discussion (if permitted), otherwise in a pushed checkpoint, and flag it for manual merge.
5. Continue **independent** ready tasks on new branches from current `main` while capacity permits. For work that depends on an unmerged PR, either stop that dependency or explicitly use a *stacked branch and PR* with the predecessor identified and a documented merge order; do not mark stacked work ready to merge into `main` until dependencies have actually merged. Never tag, release, deploy or falsely close a blocked stage.

**Claude (when reading its GitHub Issue queue):**

1. Give `[MERGE-HELP]` Issues labeled `agent:claude` + `status:ready` priority over ordinary development work when safe to do so. Avoid two sessions handling the same request concurrently. The assistance is for merging the **existing** verified PR, not for duplicating implementation.
2. Re-fetch the PR and evaluate live head SHA, required checks, open reviews, branch protection, mergeability, actual dependencies, `docs/COORDINATION.md` and explicit developer instructions. A recorded green check for an **older** SHA is insufficient. Never merge a Draft, WIP, HOLD, unapproved-asset PR or a PR with unresolved requirements/conflicts. **MERGE-HELP is an exception to the usual same-agent merge ownership rule, not an exception to merge safety rules.**
3. If fully eligible and Claude's GitHub connection permits it, perform the normal merge commit on the **expected current head SHA**; do not modify the other agent's code/branch simply to overcome access restrictions. If `main` changed independently, follow rule 3 and do not add redundant sync commits. On success, link the actual merge commit, close the help Issue (`status:done`) and update coordination; verify the latest Pages deployment containing the merged commit (or a newer descendant).
4. If merge is forbidden or unsafe, write the exact blocker and required manual action on the Issue, replace `status:ready` with `status:blocked` and leave the PR open. Do not retry the same unsuccessful action repeatedly; move on to other safe work.

**Owner's fallback:** If both integrations cannot merge, keep the checked, unsquashed PRs open and clearly ordered for **manual batch merging** in GitHub. Re-check conflicts and required checks **at the time of each manual merge**; after one merges, reassess dependencies and newer commits. Never bulk-merge blindly. If permissions prevent recording the queue in the repository, use the PRs and linked Issues as the authoritative merge queue.

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
