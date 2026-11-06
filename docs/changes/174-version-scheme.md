# #174 – MAJOR.MINOR.PATCH with two-digit display, release per change, change records

## What and why
The developer asked ([#174](https://github.com/tom161819/Newgame/issues/174)) for exactly three version numbers, shown to players with MINOR and PATCH padded to two digits (`0.3.1` → `v0.03.01`). Every SAVE_VERSION change must be a MINOR (or MAJOR) release, and every other shipped game change a PATCH. Every release must be listed with its date and Save/Load impact on the game's own changelog. Every pull request must leave a short technical record for the next agent. This change adds the tooling and the rules. The first release written under them will be `0.4.0` (M3 milestone, shown `v0.04.00`): SAVE_VERSION went from 14 at `v0.3.0` to 32.

## Files and systems
- `src/data/semver.js` `displayVersion()` (alias `displayBuildVersion`). Used by `ChangelogPanel` (menu badges, page title, release headings), `VersionArchivePanel` and `scripts/version-catalog.mjs` (`versions/` page, archive build labels).
- `scripts/changelog-lib.mjs`: optional release metadata `saveVersion`; `saveVersionFrom()`; `lastRecordedSave()`; `prepareRelease(..., {saveVersion,title,milestone})` writes the metadata comment and refuses a PATCH that changes SAVE_VERSION. `scripts/prepare-release.mjs` reads SAVE_VERSION and accepts `--title` and `--milestone`.
- `scripts/version-catalog.mjs` `saveImpacts()` adds `saveVersion`/`saveImpact` (`recorded`, `compatible`, `newSchema`) to catalog versions. The in-game changelog and `versions/` page print it.
- `scripts/version-policy-lib.mjs` (pure rules) and `scripts/version-policy.mjs` (Git CLI, `npm run version:check`). It runs as the step "Version and change-record policy" in `.github/workflows/pr-quality.yml` with `--base=HEAD^1`, because the checkout is the PR merge commit.
- `scripts/release-gate.mjs` verify mode and `.github/workflows/verify-published-release.yml` now handle any tagged release. Only `type: "milestone"` releases still require the immutable playable archive.
- `docs/changes/TEMPLATE.md`, `AGENTS.md` (section "Versions, releases and change records"), `CLAUDE.md`.

## Implementation decisions
- Canonical SemVer stays everywhere data lives: `package.json`, the lockfile, tags (`v0.4.0`), catalog fields, `data-*` attributes and URLs. npm and SemVer reject leading zeros, so the padded form is display only and never stored.
- "Game change" means `src/`, `index.html`, `public/` except `public/versions/`, and `vite.config.js`. Studio, scripts, tests, workflows and docs ship no new game, so they need a change record but no release. A pull request touching only `docs/` (for example coordination) needs neither.
- Versions advance exactly one step from `main` (no skips, no repeats). Two concurrent PRs that both claim the next number conflict in `package.json`/`CHANGELOG.md`; the second merges `main` and takes the following number.
- Bootstrap: the gate only reports until `main` has a release that recorded `saveVersion`. Otherwise this very PR and Codex's open PRs would be blocked before the first release under the new scheme exists.
- Archives: only milestone releases (M1–M5) get immutable playable snapshots. A snapshot per PATCH would add about 1.6 MB to the repository for every PR. Every release is still tagged.

## Save/Load impact
None. SAVE_VERSION stays 32. Release metadata may now record the SAVE_VERSION a release shipped with; saves are untouched.

## Testing
- `npm test`: 708 pass. New `tests/version-display.test.js`, `tests/version-policy.test.js` (including a CLI run against a temporary Git repository); extended `tests/changelog.test.js` (metadata written, PATCH refused after a schema change) and `tests/version-catalog.test.js`.
- `npm run changelog:validate`, `npm run versions:validate`, `npm run build:pages` pass.
- The browser smoke with archive staging passes: menu badges, title and changelog headings show `v0.03.00`; the canonical value sits in `data-canonical-version`.
- `npm run version:check` on this branch reports that a release is missing (bootstrap: not blocking), as intended.

## Notes for the next agent
- Workflow for a game change from now on:
  1. Write the player-facing CHANGELOG entry under Unreleased and add `docs/changes/<issue>-<slug>.md`.
  2. Run `npm run release:prepare -- patch`, or `-- minor` when SAVE_VERSION changed (optionally with `--title "…"`).
  3. Commit and open the PR.
  4. After the merge, tag the merge commit `v<version>` and push the tag.
- If `main` moved to the same version meanwhile, merge `main` and prepare the next number.
- The M3 milestone release `0.4.0` is the next Claude step. It moves the whole current Unreleased section into `0.4.0`, runs `npm run release:gate -- M3 …`, adds the archive snapshot and tag, and from then on the gate blocks.
