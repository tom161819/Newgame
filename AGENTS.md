# Working on Medieval Kingdom (Claude chats, without GitHub)

Since 6 Nov 2026 the GitHub account `tom161819` is suspended and Codex no longer works on the game. Development continues in Claude chats of the owner's claude.ai project **MK**. These rules replace the earlier GitHub collaboration rules (pull requests, Issues as a task queue, MERGE-HELP, Codex queue, GitHub Pages deploys); they stay in the Git history and come back only if the developer asks once GitHub is restored. The developer's standing instruction stays: verified work is published without waiting for manual approval, and after a released version or a finished task the agent starts on the next task by itself.

## Chats and areas

- **Mechaniky** (and the original chat): the game – `src/**`, `index.html`, `public/` (not `public/versions/`), game tests and smoke scripts, releases and the game page.
- **Grafika**: Asset Studio, sprites and reviews – `art/**`, `studio/**`, `scripts/studio-*`, `scripts/blender*`, Studio tests. It never bumps the game version.
- **Úkoly**: the plan page only; no code.
- **Koncepty**: designs and briefs for larger mechanics; reads the repository, never pushes.

A chat stays in its area. Shared files (`docs/COORDINATION.md`, `docs/changes/`, `package.json`, `CHANGELOG.md`) are merged by hand on conflict, keeping both sides.

## Source of truth and history

1. **Code:** the private claude.ai page *MK – shared development store* holds the Git history as base64 git bundles plus `manifest.json` (entries `n`, `tip`, `prereq`, `bundleSha256`). It replaces the GitHub remote. Procedure: the project document `sdilene-uloziste.md`.
2. **Tasks:** the claude.ai page *MK – development plan* (database `items/<id>`: area, status `planovano | rozpracovano | ceka | hotovo`, priority, order, spec, comments). It replaces GitHub Issues and the queue below. Set your task to `rozpracovano` when you start and to `hotovo` with `version` and commit when it is published. Write with `ifVersion`.
3. One branch `main`, linear history. Before every push pull the store and put your local commits on top of its tip (a `git worktree` + `cherry-pick` when `public/versions/` is missing from the working copy, because a rebase refuses the "deleted" archive). Never rewrite commits that are already in the store; no force, no deleting other chats' work.
4. **Commit only named files.** Working copies from the store or a backup zip have no `public/versions/`; `git commit -a` would delete the archive. Restore `public/versions/versions.json` with `git checkout HEAD -- public/versions/versions.json` before a build.
5. **Before finishing:** `npm test`, `npm run changelog:validate`, `npm run version:check -- --base=HEAD^1` (the backup's `origin/main` is stale at 0.8.1), a build and the browser smokes relevant to the change (`npm run build -- --base=/Newgame/`, then `npm run smoke -- --current-only` plus the scenario flags such as `--building-unlocks`). `--full` needs the version archive and is run only where `public/versions/` exists. Report real results, including what could not be verified.
6. **Publishing a game version:** `npm run build:artifact` (`dist-artifact/`, relative base) and publish the changed files (usually `index.html`, `assets/index-*.js`/`.css`, `versions/*`) to the game page with the title `Medieval Kingdom X.Y.Z`, removing the replaced `assets/index-*` files. Then push to the store, mark the task `hotovo`, and send the owner a backup zip now and then (without `node_modules`, `dist*`).
7. **Studio:** `npm run studio:build` and publish to the Asset Studio page; owner decisions come from its database (reviews), taken over by the Grafika chat on "spustit revizi".
8. Graphics a mechanic waits for: the mechanics chat may build a provisional sprite itself and replace it when the owner approves the final one in the Studio.
9. **„Převzít ceny“ (take over building prices):** save the proposals – the Studio's `prices` documents (`db_list` on the Studio page, slug `d772dccf-fd89-4d2c-8d0a-36bbb102e3ce`) or the JSON the owner copied from the Asset Library – to a file, run `npm run prices:sync -- <file>` (`--dry-run` first if unsure). It rewrites the prices in `src/data/objects/*.js`, verifies them and prints applied / ignored / remove. Then change record, `release:prepare -- patch`, tests, build, commit, publish the game, push; only after that delete the documents listed under remove from the Studio (`db_write` delete with `ifVersion`, so one changed meanwhile stays).
10. **„Převzít UI“ (take over the interface design):** read the Studio's `ui` documents (`db_list` on the Studio page) and take the one with `forGame: true`. Normalise its `config` with `normalizeUiConfig` from `art/ui/uiConfig.js` and write it to `art/ui/ui-config.json`. Then change record, `release:prepare -- patch`, tests, build, commit, publish the game, push. Leave the documents in place: they are the owner's saved designs. The game applies the file through `applyUiConfig` and `art/ui/ui-theme.css`; the one-time wiring is plan task `m-ui-lab-do-hry`. After the snapshots go stale (new windows, a changed HUD), run `npm run ui:capture` (Grafika).
11. **„Převzít svět“ (take over the world defaults):** list the Studio's `worldDefaults` documents (`db_list` on the Studio page, World Lab proposals `{levels, by, at, note}`), save them to a file and run `npm run world:sync -- <file>`. It writes the newest valid proposal into `DEFAULT_WORLD_LEVELS` in `src/data/worldCode.js` and prints applied / ignored / remove. Then change record, `release:prepare -- patch`, tests, build, commit, publish the game, push; only after that delete the documents listed under remove (`db_write` delete with `ifVersion`). The generator and `worldCode.js` belong to the mechanics chat; the Studio only imports them.

# Project workflow

- Read the task on the plan page first (its `spec`), then `docs/TASK_QUEUE.md` and the linked original specifications for requirements; complete and release one dependency-safe step at a time. Follow the user's standing commit, publication and checkpoint instructions.
- `package.json` is the only authored source of the game version. Do not copy version numbers into UI or HTML. Game versions and `SAVE_VERSION` are separate; increase `SAVE_VERSION` whenever the persistent data model changes (see Alpha save policy).
- After completing and verifying a feature or fix, add a concise, player-facing English entry to `CHANGELOG.md` under `Unreleased`, in Added/Changed/Improved/Fixed/Balance/Removed as appropriate. Describe actual behaviour, not plans, commit counts or unverified work. Release it in the same commit when the change ships to players.
- Every change that ships to players is a release (see *Versions, releases and change records* below). Milestone releases M1–M5 still follow rule 9 and the release gate. `npm run release:prepare -- major|minor|patch [--title "…"] [--milestone]` prepares the version, lockfile and changelog locally; then commit the named files and tag `v<version>` locally (the tag travels in the store bundle).
- `CHANGELOG.md` is the only authored history. Vite generates the player data from released entries; never maintain a second manual list. Keep Unreleased hidden from players. A published game change must never stay hidden there: after a release commit, Unreleased is empty.
- Run `npm run changelog:validate`, relevant tests and the production build before completing work. Verify current-schema Save/Load whenever changing persistent models.
- Existing `public/versions/<commit>/` snapshots are immutable. Add historical builds only from their actual Git commits and run `npm run archive:verify`.
- Historical bundles are generated data, not current source. Keep them out of broad searches/context; use the catalog, manifests and actual Git source for archive work. `.rgignore` excludes them from ordinary ripgrep discovery. Do not read minified snapshots to learn the current architecture.
- `.gitattributes` suppresses generated archive text diffs; inspect SHA manifests, derived metadata and original source commits instead. This does not change tracked bytes or weaken `archive:verify`.

# Versions, releases and change records (#174, 2026-11-06)

These rules supersede the earlier "do not turn every commit into a release" and four-part versioning instructions; the M1–M5 milestone gates (rule 9) stay.

1. **Exactly three numbers, MAJOR.MINOR.PATCH.** `package.json`, `package-lock.json`, Git tags and catalog data use canonical SemVer (`0.3.1`, tag `v0.3.1`). Players see MINOR and PATCH padded to at least two digits (`v0.03.01`, `v0.03.100`) through `displayVersion()` in `src/data/semver.js`. Never write a padded number into `package.json`, and never add a fourth part.
2. **MAJOR** for a new generation of the game (`0.3.4 → 1.0.0`).
3. **MINOR** for every change of `SAVE_VERSION` or the persistent data model (`0.3.4 → 0.4.0`, PATCH resets to 0). `release:prepare -- patch` refuses a changed `SAVE_VERSION`. Do not raise `SAVE_VERSION` just to release.
4. **PATCH** for every other change that ships to players: feature, improvement or fix without a schema change (`0.4.0 → 0.4.1`). "Ships to players" means `src/`, `index.html`, `public/` (not `public/versions/`) or `vite.config.js`. Studio, scripts, tests, workflows and docs alone are not a game release.
5. **Every release has its own `CHANGELOG.md` section** with date, player-facing summary and the SAVE_VERSION it ships with (`"saveVersion"` in the version comment, written by `release:prepare`). The game's changelog shows each release with its Save/Load impact. Unreleased is empty after a release.
6. **Versions advance one step from the store's tip**: no skipped, repeated or lower numbers. If another chat released the same number meanwhile, put your work on top of the store and prepare the next number.
7. **Change record in every commit** that touches anything outside `docs/`: `docs/changes/<issue>-<slug>.md` from `docs/changes/TEMPLATE.md`, about 5–20 sentences. Sections: What and why; Files and systems; Implementation decisions; Save/Load impact; Testing; Notes for the next agent. Do not write records retroactively for old work.
8. **Gate:** `npm run version:check` enforces rules 3–7. Without GitHub run it per commit as `npm run version:check -- --base=HEAD^1`.
9. **Tags and archives:** tag `v<version>` locally on the release commit and include the tag in the store bundle (`git bundle create out.bundle <prev tip>..main v<version>`). The game page has no room for the version archive (119 MiB); the archive lives in the owner's `newgame-archiv-verzi.zip`. Only milestone releases (`--milestone`, M1–M5) get an immutable playable archive snapshot via the release gate. Historical tags, releases and archives are never renamed or rewritten.

# Graphics: designs, owner review and integration (#210, 2026-11-06)

New or replaced graphics follow one loop. The owner only looks, comments and clicks; agents never edit approvals by hand.

1. **Mechanics first.** A new building or object ships through a normal PR with a clearly marked placeholder (procedural or temporary sprite). The mechanics must not depend on final art.
2. **Three designs.** Claude adds at least three distinct variants in the Asset Studio (`art/assets/<category>/<id>/asset.json` with `gameObjectId` or `plannedGameObjectId`), exports them (`npm run studio:export -- <id>`) and records each as `review` in `art/approvals.json`. Every part stays inside the game object's footprint.
3. **Owner review.** In the Studio the owner chooses Approve, Request revision (with a comment), Reject or Preferred, then **Submit review**. A pre-filled GitHub issue labelled `asset-review` is created, and the `asset-review.yml` workflow summarises and validates it, then labels it `agent:claude` and `status:ready`.
4. **Apply the review** (Claude, one PR per review issue):
   - copy the decisions into `art/approvals.json`, with `review: {issue, submissionId}` on every decided record and comments as `comments[]`;
   - CI fails any approval not backed by the owner's issue for exactly that variant, version and hash.
5. **Revise.** For each revision request: change the spec as the comment asks, then run `npm run art:revise -- <variantId>`. The version goes up, the sprites are exported, the record returns to `review` with the old version in `history`, and the old sprites stay. Any number of rounds is fine; an approval never carries over to a new version.
6. **Integrate.** For an approved variant, run `npm run art:integrate -- <variantId>` (buildings). It refuses unless the variant is approved by the owner for this version and hash, the export is current, and the footprint matches. It copies the PNG and its layers to `public/assets/` and writes `APPROVED_BUILDING_ART`. Then follow the normal release rules (CHANGELOG, `release:prepare`, change record) and run the smoke tests.
   - If the art does not fit the object's footprint or anchor, open a technical issue to fix the art. **Never change the mechanics to fit the art.**
7. Unapproved variants never enter the game. Agents never approve their own designs.

# Alpha save policy

Medieval Kingdom is in ALPHA and only its author tests it. Backward compatibility of saved games between versions is not required. These rules override any stage specification, request or older document that asks for save migrations or compatibility with older saves, until the developer explicitly asks for compatibility again.

1. Do not write migrations for older saves when the data model changes. Increase `SAVE_VERSION` instead.
2. Only remove obsolete requirements and tests that verify support for old formats. Keep every test needed for the current Save/Load.
3. Save and load must remain fully functional within the current schema version.
4. A save with another schema version is rejected before the running world changes (`IncompatibleSaveError`). The Load menu shows a clear notice and offers a new game. Never delete or convert saves automatically; deleting needs the player's confirmation.
5. Keep validating the consistency of resources, units, production tasks, reservations, construction and the economy on Save/Load.
6. `SAVE_VERSION` stays independent of the game version in `package.json`.
7. Never change or delete historical archive builds in `public/versions/`; each keeps its own isolated saves.
8. Every Claude chat (`CLAUDE.md` imports this file) follows these same rules; `docs/upgrades/00_ORCHESTRATOR.md` and `docs/UPGRADE_ROADMAP_25_37.md` refer to them.
9. Later stages do not implement compatibility with older saves unless the developer explicitly asks for it again.
10. Never remove tests just to make a build pass. Keep or improve coverage of the current game behaviour.
