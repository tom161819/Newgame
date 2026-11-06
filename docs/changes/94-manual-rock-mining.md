# 94 – Manual finite rock mining

## What and why
Visible terrain rock outcrops can be marked or unmarked by click or drag for a free Miner, separately from finite Quarry and Iron Mine deposits. Each cell yields ten Stones progressively as physical drops before its terrain obstruction disappears.

## Files and systems
RockMiningWork is a target provider owned by existing MiningWork and called through WorkerAI, sharing navigation, natural slots, DropSystem and FoodProduction transfers. RockMiningTool adds functional selection overlays and narrow GameScene/GameApplication input hooks; it uses no new artwork.

## Implementation decisions
Only an unassigned Miner can accept marked work, and a completed rock's output is carried before the same worker chooses another target. Hold, death, cancellation, reassignment, combat, inaccessible goals and full stores preserve finite progress and physical goods. Ledger and Mining XP are emitted only after each committed unit, and zero-reward drops prevent collection rewards twice.

## Save/Load impact
The new current-only schema stores rock orders, produced units, partial work and mined cargo provenance; other schemas reject before mutation without migrations. Final schema number is allocated after integrating the actual Needs/demolition/gathering predecessors, expected36.

## Testing
Eight focused tests passed, covering exact ten-unit ground/storage/ledger conservation, free/employed/multiple/dead Miners, cancellation, combat/pause, partial capacity, partial Load and Hold/Load/Resume with cargo. A broader736-test run passed before the final cargo test and predecessor integrations; final full checks and real browser Load are still pending.

## Notes for the next agent
Explicit stack183/#130 →185/#124 →94, with actual Pages and next MINOR for each before merging a successor. Native mouse tests already exposed and fixed camera-coordinate and Escape integration issues; investigate the remaining scene-restart timeout without skipping Load checks or increasing timeouts.
