# Caravans on the minimap (owner point 77)

## What and why
Owner, 19 Nov 2026: on the minimap the caravan gets an icon that moves with it; the own caravan gets a different colour than foreign ones.

## Files and systems
- `src/ui/Minimap.js`
  - `CARAVAN_MARKS` (own blue `#62b6ff`, foreign orange `#ffa13d`).
  - `minimapCaravans(scene)`: the foreign merchant (`scene.caravans.active.position`) and the own caravan's Wagon while the expedition gathers (`trade.expedition.state.phase==='gathering'`, position from `VehicleSystem.position`).
  - `drawCart` draws a small cart in the overlay (redrawn every 100 ms, so it moves); drawn through the inverse of the CSS turn, so it stands upright.

## Implementation decisions
- The foreign caravan shows wherever it is, also in fog: its arrival is announced in the feed anyway.
- The own caravan shows only while it is on the map (gathering). While it is away it is off the map; point 82 adds the march time to other maps.

## Save/Load impact
None.

## Testing
New `tests/minimap-caravans.test.js`. Browser screenshot: an orange and a blue cart on the minimap.

## Notes for the next agent
The marks are canvas drawings, not approved art; a real icon can replace `drawCart` later.
