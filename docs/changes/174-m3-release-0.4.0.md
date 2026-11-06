# #174 / M3 – Release 0.4.0 (shown v0.04.00), the first release under the version scheme

## What and why
This is milestone M3 (roadmap stages 11 Stone Pavement & Courtyards and 12 Wheelwright, Wagons, Stables & Housing, both DONE in `docs/UPGRADE_PROGRESS.md`), released under the standing M1–M5 authorization (AGENTS.md rule 9). It is also the first release written under #174. SAVE_VERSION rose from 14 at `v0.3.0` to 32, so the release had to be MINOR: `0.3.0 → 0.4.0`. Every completed change listed under Unreleased since `v0.3.0` moves into this release, so nothing deployed stays hidden from players.

## Files and systems
- `package.json`, `package-lock.json` (root versions only) and `CHANGELOG.md`, prepared by `npm run release:prepare -- minor --milestone --title "M3: …" --date 2026-11-06`. The version comment records `"type":"milestone"` and `"saveVersion":32`.
- `docs/verification/M3-release.md`: the release gate evidence.
- The source under release is the gated `main` commit `d5e99313bea035ab2550af83edff833256f29090` plus these release files. Once merged, this branch head is the release source for tag `v0.4.0` and its archive snapshot.

## Implementation decisions
- The release branch starts at the exact commit the M3 gate verified (Pages run 42205526143), not at a newer `main`, so the tagged source is the gated source.
- From this merge on, the #174 version gate blocks: every PR into `main` that changes the game must carry the next version (`0.4.1` patch, or `0.5.0` when SAVE_VERSION changes) and a change record.
- The archive snapshot is built from the tagged release source in a separate PR (`npm run archive:build`), as for M2.

## Save/Load impact
None in this PR. The release ships save format 32, the same as the current game. Saves from `v0.3.0` (format 14) cannot be loaded, as the alpha save policy allows. The changelog entry says so through `saveVersion`.

## Testing
See `docs/verification/M3-release.md`. The gate ran a clean `npm ci`, changelog/catalog validation, `npm test`, `archive:verify`, the production build, `archive:stage`, `archive:verify-site` and the full browser smoke. On the prepared release: `npm test`, `npm run changelog:validate`, `npm run versions:validate`, `npm run version:check`, `npm run build:pages`.

## Notes for the next agent
After the merge:
1. Tag the release source commit (this branch head) `v0.4.0` and push the tag.
2. Build the archive with `npm run archive:build -- --through=<release source SHA> --base=/Newgame/`, verify it, and open the archive PR.
3. When that deploys, `verify-published-release` checks tag, notes, archive and catalog on GitHub's runners.
4. Record RELEASED in `docs/UPGRADE_PROGRESS.md` and continue with M4 (stage 13, #58).
