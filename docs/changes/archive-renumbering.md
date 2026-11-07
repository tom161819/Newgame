# Archive versions renumbered in time order (owner request, plan m-verzovani-archivu, 7 Nov 2026)

## What and why
The owner asked for archived versions to be renumbered "so that they make sense and follow each other". Before this change:
- the "Older versions" archive listed 74 development snapshots as "Archive build N · v0.3.0 · abc1234", where many snapshots shared one version;
- 30 reconstructed milestones were shown as "0.1.0+archive.N".

Now every snapshot and milestone has its own number, which grows with time and fits between the released versions.

## Files and systems
- `src/data/archiveNumbers.js`: `archiveNumbers({releases, snapshots})` (the rule), `displayArchiveNumber()` (#174 two-digit places, e.g. `0.03.00.01`), `compareArchiveNumbers()`.
- `scripts/version-catalog.mjs`:
  - The catalog adds `number` and `legacyLabel` to every snapshot (`builds`) and reconstructed milestone. Official releases keep `number` = their version.
  - Release commits resolved from tags now get their real commit time from git, so ordering does not depend on day-only dates.
  - The static archive page shows the new numbers, with the former label as a tooltip.
- `scripts/renumber-versions.mjs` (`npm run versions:renumber`): prints the table old label → new number → date → commit. `--write` records `number` and `legacyLabel` in `public/versions/versions.json` (done: 74 records).
- `scripts/validate-version-catalog.mjs`: fails when a recorded number no longer matches the rule.
- `src/ui/VersionArchivePanel.js`, `index.html`, i18n en/cs:
  - Headings show `v<number> — title`; the tooltip shows "Formerly: <old label>".
  - The snapshot line reads "Development snapshot · not a release", and the explanatory note is rewritten.
- Tests:
  - `tests/archive-numbers.test.js` (3);
  - `tests/version-catalog.test.js` (static page);
  - `scripts/browser-smoke.mjs` checks the archive panel headings and that the numbers are unique.

## Implementation decisions
- **The rule.**
  1. Official releases keep their numbers. A snapshot of exactly a release commit shows that release's number.
  2. Snapshots between release X.Y.Z and the next release become X.Y.(Z+1), X.Y.(Z+2)… by commit time, with the build sequence as the tie-break.
  3. If any number in such an interval would equal or pass a released version, the whole interval uses a fourth place: X.Y.Z.1, X.Y.Z.2… One style per interval keeps it readable.
  4. **Snapshots before the first release become 0.0.1, 0.0.2…** The spec suggested 0.1.1, 0.1.2…, assuming M1 0.2.0 was the first release. However, the changelog has an official 0.1.0 (3 Nov, `e8d41eb`) with 45 snapshots before it, and 0.1.x numbers would then run backwards in time. If the owner prefers another scheme for these, only the base for "before the first release" in `archiveNumbers()` changes.
- **One number per commit.** A reconstructed milestone and a snapshot of the same commit (for example archive.1 and build 1, `7291dc3`) show the same number.
- **Nothing moves.** Archive folders, URLs and the `version` / `+git.<sha>` identifiers stay as they were, so links keep working. Only the shown number changes, and the former label stays in `legacyLabel` and the tooltip.
- **Computed, not hand-kept.** The catalog always computes numbers from git times. The numbers written to `versions.json` are a record that the validator compares against the rule, so a future snapshot added to an old interval cannot silently change shown numbers.
- **Archive in git.** The archive folders `public/versions/<commit>/` are tracked in git and were only missing from the working copy unpacked from the backup zip. `git checkout HEAD -- public/versions` restores them, so no separate archive zip from the owner was needed.
- **Out of scope.** The in-game changelog still names reconstructed milestones by their changelog headings (`0.01.00+archive.N`). Since 0.5.0 every change is a release, so no new snapshots are created.

## Save/Load impact
None.

## Testing
- `npm test` passes (897).
- `npm run versions:validate` passes.
- The default `npm run smoke` (with the archive) passes.

## Notes for the next agent
- When a snapshot is added to `public/versions/versions.json`, run `npm run versions:renumber -- --write`; `versions:validate` will remind you.
- Staging: `public/versions/versions.json` is a normal tracked file. The working copy from the zip may lack the archive folders; restore them with `git checkout HEAD -- public/versions`, not by committing deletions.
