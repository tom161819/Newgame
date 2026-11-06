# 124 – Castle idle gathering and arrival uniforms

## What and why
Unemployed residents and idle global Haulers gather naturally near completed Castles without occupying doors, roads or the same anchor. Functional roles change immediately, while approved profession outfits wait for physical arrival.

## Files and systems
The data/idleGathering policy and WorkerSystem-owned IdleGathering share existing pathfinding, movement and TaskReservationSystem. WorkerAI, BuilderAI, ConstructionSystem and UnitCommands release derived idle ownership before real work or manual control.

## Implementation decisions
Multiple Castles use reachable route selection; no reachable home uses throttled local strolling with a per-frame planning budget. Haulers remain global, Farmer tending and workplace seating stay with their existing owners, and an assigned Builder workshop takes preference for #118. Reassignment resets the pending uniform; Hold keeps an already-worn outfit.

## Save/Load impact
SAVE_VERSION34 stores displayProfession as either idle or the current functional role. Derived idle anchors are rebuilt and never serialized, and foreign schemas reject before mutation without migrations.

## Testing
722 unit tests, changelog validation and build passed before184 integration. Combined native Castle gathering, real workplace UI/uniform arrival, current Load, demolition, stockpile hauling, manual commands and employment passed; approved outfits were checked visually and through actual loaded view state.

## Notes for the next agent
Merge only after183/#130 and actual Pages, then prepare the next one-step MINOR required by174 after Claude's first0.4.0 M3 and183's schema release. Preserve meaningful Hauler failure diagnostics and do not let planning-budget deferrals start an unreserved old idle path.
