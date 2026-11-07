# Progress overviews updated to 7 Nov 2026 (plan task)

## What and why
`docs/UPGRADE_PROGRESS.md` still opened with the 4 Nov audit of Issue 47 and listed stages 13–14 as not started; `docs/CODEX_PROGRESS.md` listed C01–C08 as pending although all were merged. Tracked on the plan page as `o-uklid-progress`.

## Files and systems
- `docs/UPGRADE_PROGRESS.md`: a current-state section (0.9.4, milestones, stage 13 phases A/B/C1 done with C2 and D left, stage 14 split into F1.1–F1.3, work without GitHub) replaces the Issue 47 audit; rows 13 and 14 of the stage table updated. History below is unchanged.
- `docs/CODEX_PROGRESS.md`: note that Codex no longer works on the game; C01–C08 rows marked DONE with their pull requests.

## Implementation decisions
- The stage table keeps its format because `scripts/release-gate-lib.mjs` reads it (only `DONE` rows with a commit count as complete); stage 13 is `IN PROGRESS`.

## Save/Load impact
None.

## Testing
`npm test` passes; documentation only.

## Notes for the next agent
- The M4 release gate (`npm run release:gate`) still expects GitHub Pages and the version archive; it needs adapting before M4 can be released without GitHub.
