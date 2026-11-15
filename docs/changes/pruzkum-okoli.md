# Scouting the surroundings and the garrison (0.141.0)

## What and why
Owner 15 Nov 2026, concept v1 (plan m-mapa-kraje), step 1: after Castle level 3 and Barracks a party can scout the world around the map. A World icon by the minimap opens a window with the minimap and 8 zones marked "?"; on arrival the party reports what is there (for now iron deposits, dense forest, stone deposits). Travel half a day each way, no limit on the party, but soldiers away lower safety: one soldier per 5 residents for the full bonus.

## Files and systems
- `src/data/scouting.js`: rules, 8 zones named by their side on screen (grid north-west corner = screen top), `zoneType(worldCode, id)` (deterministic), `zoneEdge`.
- `src/systems/ScoutingSystem.js`: one party, phases leaving → away → returning; `updateSoldier` (called from `MilitarySystem.updateSoldier`) walks soldiers to the edge (or after `leaveHours` they leave anyway); `w.away`/`w.scoutZone`; `exportState`/`importState`; `validScouting` in the serializer.
- `src/ui/WorldPanel.js` (dialog `#world-dialog`, in PanelDismiss), 🌍 button in `Minimap` size controls, CSS `.world-*`.
- Garrison: `NEEDS.safety.garrison {bonus:15, perResidents:5}`, `garrisonRatio` in `NeedsSystem.js`, a `garrison` factor in the safety detail.
- `Expedition.escorts` skips scouts; `WorkerAI` shows "Away scouting".

## Implementation decisions
The window is turned 45° like the minimap so a zone lies on the side the party leaves over. Zone content is from the world code, so later steps (a 40 × 40 zone map from the zone seed) get the same result.

## Save/Load impact
New optional top-level field `scouting {zones:{id:{type,day}}, party:null|{zone,ids,phase,since,at?}}`, strictly validated; no SAVE_VERSION change (old saves have no field).

## Testing
tests/scouting.test.js (zone types, unlock, full trip, validation, garrison ratio); panel-dismiss test; browser check of the window and a full trip.

## Notes for the next agent
Steps 2–4: switch to the party and play a 40 × 40 zone map, return home; later mining, caves, dungeons, ruins, bandit camps, other castles.
