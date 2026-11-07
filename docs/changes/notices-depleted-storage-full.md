# Notices: used-up source and full stores (0.31.0)

## What and why
Plan task m-upozorneni-dul-sklad (owner points 14 and 15, 7 Nov). The player should learn when a quarry or mine has nothing left to work, and when goods pile up because there is no store with room for them.

## Files and systems
- `src/data/diagnostics.js` – `GATHER_OUTPUTS` (quarry stone, iron mine iron ore, lumberjack hut wood, hunting lodge meat, fisherman's hut fish), `DEPLETION_SOURCES`, `STORAGE_WAIT_MESSAGES` (the existing "waiting for storage" work messages).
- `src/systems/ProductionDiagnostics.js`:
  - `depletionIssues()`: a finite Quarry/Iron Mine whose bound deposit has 0 left; a Lumberjack Hut with no tree of any stage in its working radius.
  - `storageIssues()`: goods in production output buffers or held by residents waiting for storage. When no stock location that takes a resource has room, it raises one `storageFull` kingdom notice. The notice groups the resources by the store that would help, taken from the buildable storage definitions (Warehouse, Granary, Armory). It also raises `outputFull` for each building that is stuck.
  - `buildingIssue(id)`. Issues with `feed:true` push one EventFeed line when first reported (not on reminders).
- `src/ui/noticeText.js` – shared notice text (Notices box, EventFeed, panels) + `buildingIssueLine` with advice. `NoticesPanel` uses it.
- `src/game/IssueIcons.js` – warning triangle over a building with `depleted` (amber) or `outputFull` (orange), redrawn only when the diagnostics change, hidden under fog.
- `src/ui/WorkplacePanel.js` – `#workplace-issue` line ("No Stone left in range – build a new Quarry near rocks.", "Output full – no storage space.").
- i18n en/cs: `notice.depleted`, `notice.depletedLine`, `notice.source.*`, `notice.storageFull`, `notice.storageFullGroup`, `notice.outputFull`, `notice.outputFullLine`.
- Tests: 2 new in `tests/production-diagnostics.test.js`. Smoke `scripts/storage-notices-smoke.mjs` (`--storage-notices`, part of `--full`): a real Quarry on a Stone Deposit emptied for the test; all wood stores filled so the real Woodcutters wait; room again clears it.

## Implementation decisions
- **Depleted lumberjack hut** only when no tree at all (young ones included) is in range: with saplings the wood will come back, so "nothing to chop right now" is not a warning.
- **Legacy and unbound quarries** are skipped (no finite deposit to run out).
- **One storage notice for the kingdom** that lists every stuck resource, plus a per-building line/sign for the buildings that actually stand, instead of one notice per building.
- No existing "storage full" notice was found to merge with; the per-resource advice comes from data, not a hand-written list.
- The C04 timing (10 s to show, 30 s reminders in the Notices box) is unchanged; the EventFeed gets the line only once per occurrence.

## Save/Load impact
None.

## Testing
`npm test` (944). Smokes `--storage-notices --notices --staffing`; screenshots checked (notice box, event feed, sign over the Quarry).

## Notes for the next agent
- Ground drops waiting for a store are not counted yet (only buffers and waiting residents); add them if a case appears where goods lie on the ground silently.
