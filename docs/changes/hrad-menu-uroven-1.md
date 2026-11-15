# Castle in the building menu: level 1 picture, size and text

## What and why
Left over from m-hrad-urovne: the menu still showed the old stone keep (3 × 3) and the old description ("platform gives 75 % more sight"), although a new Castle is the level 1 timber hall on 4 × 4.

## Files and systems
- `src/systems/AssetManager.js` `previewURL` – a definition with `levels` and an `l1` art sprite uses that picture.
- `src/ui/BuildingBar.js` – the size line uses the level 1 size.
- `src/data/objects/buildings.js`, `src/i18n/objects.cs.js`, `src/i18n/objects.en.js` – new Castle description.

## Implementation decisions
The registry definition of the Castle stays the legacy keep (older saves); only what the menu shows changed.

## Save/Load impact
None.

## Testing
Full suite. Browser: the Castle preview is the level 1 picture (256 × 197).

## Notes for the next agent
Still open from m-hrad-urovne: torches on the castle pictures do not shine; the benefit numbers per level are guesses waiting for the owner.
