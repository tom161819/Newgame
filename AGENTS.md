# Project workflow

- Read `docs/TASK_QUEUE.md` and finish one queued step at a time. Follow the user's standing commit, deployment and checkpoint instructions.
- `package.json` is the only authored source of the game version. Do not copy version numbers into UI or HTML. Game versions and `SAVE_VERSION` are separate; increase `SAVE_VERSION` whenever the persistent data model changes (see Alpha save policy).
- After completing and verifying a feature or fix, add a concise, player-facing English entry to `CHANGELOG.md` under `Unreleased`, in Added/Changed/Improved/Fixed/Balance/Removed as appropriate. Describe actual behaviour, not plans, commit counts or unverified work.
- Do not turn every commit into a release. Prepare a numbered release only when the developer asks. `npm run release:prepare -- minor|patch|major` prepares local files; it never commits, tags, pushes or publishes. Publishing ordinary queued work follows the user's explicit standing instructions.
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
