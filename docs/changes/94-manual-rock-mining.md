# 94 – Manual finite rock mining

## What and why
Visible terrain rock outcrops can be marked or unmarked by click or drag for a free Miner, separately from finite Quarry and Iron Mine deposits. Each cell yields ten Stones progressively as physical drops before its terrain obstruction disappears.

## Files and systems
RockMiningWork is a target provider owned by existing MiningWork and called through WorkerAI, sharing navigation, natural slots, DropSystem and FoodProduction transfers. RockMiningTool adds functional selection overlays and narrow GameScene/GameApplication input hooks; it uses no new artwork.

## Implementation decisions
Only an unassigned Miner can accept marked work, and a completed rock's output is carried before the same worker chooses another target. Hold, death, cancellation, reassignment, combat, inaccessible goals and full stores preserve finite progress and physical goods. Ledger and Mining XP are emitted only after each committed unit, and zero-reward drops prevent collection rewards twice.

## Save/Load impact
The new current-only schema stores rock orders, produced units, partial work and mined cargo provenance; other schemas reject before mutation without migrations. SAVE_VERSION36 follows Needs33, demolition34 and gathering35; the required next MINOR is0.8.0.

## Testing
Final750 unit tests, version policy against185, changelog validation and production build passed. Nine focused tests cover exact ten-unit ground/storage/ledger conservation, free/employed/multiple/dead Miners, cancellation, combat/pause, partial capacity, partial Load and Hold/Load/Resume with cargo. Native real-mouse mark/drag/unmark/Escape, actual role UI, ten progressive drops, rock removal, real delivery, exact ledger, partial/completed Load, phone layout, unit commands, Needs and event feed passed; the screenshot was visually inspected.

## Notes for the next agent
Explicit stack183/#130 →185/#124 →94, with actual Pages and next MINOR for each before merging a successor. Native mouse tests exposed and fixed camera-coordinate, Escape integration and shutdown drawing after the camera was destroyed; the final native cycle now passes with all Load checks and original timeouts retained. If a cleared output tile is built over before mining resumes, the next drop uses the new open work side; the physical regression and repeated native cycle pass.
