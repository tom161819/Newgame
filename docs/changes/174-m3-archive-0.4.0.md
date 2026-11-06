# M3 – Immutable playable archive of release 0.4.0

## What and why
Milestone releases carry an immutable playable snapshot (AGENTS.md rule 9; `docs/RELEASE_CHECKLIST.md`). Release `0.4.0` (M3, shown `v0.04.00`) was tagged `v0.4.0` on `375f1aa83b97e6ab8661a14b1a4c7fa1fa365011` by the tag-release workflow, so the snapshot is built from that exact commit.

## Files and systems
- `public/versions/375f1aa83b97e6ab8661a14b1a4c7fa1fa365011/` (new, 4.4 MB, built by `npm run archive:build -- --through=375f1aa… --base=/Newgame/`).
- Generated catalog files `public/versions/{versions.json,catalog.json,index.html}`.
- `scripts/build-archive.mjs`: the builder's browser check now selects the game canvas (`canvas:not(.minimap-canvas)`). Since the minimap (#104) a build has two canvases, and the plain `canvas` locator failed in strict mode on the first attempt.

## Implementation decisions
- No existing snapshot was touched; the builder reported 73 existing archives verified unchanged and 1 new.
- The selector change keeps older builds working (they have a single canvas, which the selector still matches).

## Save/Load impact
None for the current game. The archived 0.4.0 build keeps its own isolated saves (format 32), like every snapshot.

## Testing
- `npm run archive:build`: the new build passed build, tests and a real browser check.
- `npm run archive:verify`: 74 immutable versions match their SHA-256 manifests.
- `npm run versions:validate`: 34 milestones and 74 snapshots. The catalog lists `0.4.0` as available, with commit `375f1aa`, tag `v0.4.0` and its archive URL.
- `npm test`, `npm run version:check`.

## Notes for the next agent
- After this deploys, the *Verify published release* workflow checks the tag, frozen notes, archive blobs and the live catalog on GitHub's runners.
- Then mark M3 RELEASED in `docs/UPGRADE_PROGRESS.md` and continue with M4 (stage 13, #58).
