# 68: always night in the mine, torches for one in ten (0.143.14)

## What and why
Owner 17 Nov 2026 (68): inside the mine it should always be night (day and night alternated there); soldiers can get a torch – not all lit, every 10th soldier of a group lights one automatically; one torch a day, so an expedition must take torches on the Horse Wagon with the food; a Test map button to give a soldier or a group a torch.

## Files and systems
- `DayNightSystem.underground()` (land.dungeon): `part` night, `darkness` 1, `moon` 0, no night speed-up, no Skip to dawn (`NightControls` hides it).
- `LightFuelSystem`: `groups()` (soldiers on watch linked within `groupLink` 6 tiles), `assignTorches` every `regroupMs` 5 s while dark – `ceil(n / perGroup 10)` bearers per group, the existing keep theirs, new ones nearest the middle; `takeTorch` from the nearest store or `scene.zone.cargo.torch`; a torch taken on an earlier day must be replaced (underground the night never ends) or the bearer goes dark; `handDay` (not saved; loaded hands count as today's); `giveFree` (Test map) – free bearers that never pay. `update(delta)` now gets the simulation delta.
- `zoneMode.homeAfterZone`: the wagon's remaining load goes back into the party (comes home).
- `TorchFlames`: a small flickering flame over each bearer's hand.
- `sandboxMode`: "Torch for the chosen" button.

## Implementation decisions
The rule applies at home too (owner: "not all of them lit"): the night watch now uses a tenth of the torches. Torch light radius unchanged (3 tiles).

## Save/Load impact
None (hands were saved before; their day is assumed today on load).

## Testing
tests/torch-groups.test.js (1 per 10 in two groups, underground night/darkness/speed, daily replacement from the wagon, free torches), tests/torches.test.js; npm test; browser: Test map → Inside the mine, 11 soldiers with torches in the dark cave.

## Notes for the next agent
Food on expeditions is still not eaten; when it is, use the same `zone.cargo`.
