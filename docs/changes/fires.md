# Fires: residents fight them, 10 % loss, ruins say what burnt (m-pozary)

## What and why
Owner request (points 36, 60): residents should fight fires, a fire should destroy the building only with a 10 % chance, and the ruins should say what the building was. Residents already came with buckets (Day and night N3); this adds the fixed odds, a feed line and the ruin name.

## Files and systems
- `src/data/nightThreats.js`: `fires.destroyChance` (0.1) and `fires.savedHealth` (5).
- `src/systems/NightThreatSystem.js`: when the first resident answers a fire, `fire.fate` is rolled once ('lost' or 'saved') and the feed says "Fire at the X! Villagers are putting it out." A saved fire cannot take the building below 5 health, so it can only end by being put out. A lost fire ignores buckets and burns down. `ruinDefinition(registry,fromType)` gives the ruins the name "Burnt X"; the ruin keeps `burntFrom`.
- `src/systems/GameStateSerializer.js` / `GameStateLoader.js`: `burntFrom` saved, validated and restored; `fate` saved with the fire.
- Wiki fire page updated.

## Implementation decisions
- The odds are rolled when help arrives, so a fire nobody answers still always burns down.
- Small (1×1) buildings still leave no ruins.

## Save/Load impact
Optional fields `nightThreats.fires[].fate` and `buildings[].burntFrom`; SAVE_VERSION stays 58. Fixed: saves with burnt ruins were refused (the ruins are not buildable) – they are now valid.

## Testing
Unit tests (1020 pass) incl. the lost/saved roll, the ruin name and Save/Load; fire smoke (pinned to "saved", checks the feed line).

## Notes for the next agent
`NightThreatSystem.random` decides the fate; pin it in tests.
