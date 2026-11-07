# Bug: the "no builders" notice is missing (0.29.1)

## What and why
Plan task m-bug-info-stavitele (owner request, 7 Nov). Placing a blueprint without any Builder used to show a notice over the map; it no longer did.

**Cause.** The notice comes from `ProductionDiagnostics.constructionIssues` (C04, commit e04f3c4). It skipped every site whose materials were not delivered yet (`!c.materials.ready(site)`). Since construction materials are delivered physically by Haulers and Builders, a new game with only idle residents never gets the materials to the site, so the site was never "ready" and the notice never fired. The Builder's Workshop (0.14.1) did not change it (checked with `git log -S`). Verified in the browser: a fresh game, Tower blueprint, 30 s – materials not ready, no notice.

## Files and systems
- `src/systems/ProductionDiagnostics.js` – `availableBuilders()` (Builders on their job, not on a Move/Hold order, not striking or leaving; those without a workshop place count). `constructionIssues()`: one kingdom notice (`noBuilder`, keyed on the oldest waiting site, `params.count` = waiting constructions) whenever a construction that nobody (not even the King) is working on waits and no Builder is available. Materials are no longer required. Fields keep their own Farmer check (still only once supplied). Demolitions are not included.
- `src/ui/NoticesPanel.js` – the notice text gets `count`; a click on the no-builder notice opens Employments.
- `src/i18n/en.js`, `cs.js` – `notice.noBuilder` "No builders – assign a villager to the Builder profession ({count} construction(s) waiting)."
- Tests: `tests/production-diagnostics.test.js` (regression: unsupplied site → notice, Builder → gone, all Builders striking → back; two sites → one notice counting 2). Smoke `scripts/notices-smoke.mjs` updated (no faked materials, new text, click opens Employments).

## Implementation decisions
- One notice for the kingdom instead of one per site: the advice is the same for every site, and the box would fill up otherwise.
- The usual C04 timing stays (shown after it lasts 10 s of game time, repeated every 30 s, can be dismissed).
- It is shown in the existing Notices box over the map (bottom right), which is where the construction notices live.

## Save/Load impact
None (diagnostics are not saved).

## Testing
`npm test`, smoke `--notices` (screenshot checked).

## Notes for the next agent
- If the Builder's Workshop "slower without a workshop" notice should merge with this one, keep them separate: different advice.
