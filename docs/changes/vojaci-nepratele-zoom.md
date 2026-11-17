# Test map Knights and enemy soldiers, sharper soldiers, closer zoom (0.143.10)

## What and why
Owner 17 Nov 2026: (1) why only three of the four units on the Test map; (2) the same units should be addable as enemies; (3) the models in the game are not as detailed as they should be (blurred); (4) allow a bigger zoom. (1) The Knight was missing because in the game a Knight needs a horse from the Stables; (3) the sheets were 1× (30 px/m) and the camera zooms in, so they were upscaled.

## Files and systems
- `MilitarySystem.enlist(worker, type, {withoutHorse})`; the Test map enlists with it, so its Knights stand on foot (the owner's figure). In the game a Knight still needs a horse.
- `render-soldier.py --hue` sets the "Army cloth" Hue; the enemy sheets are rendered at 0.15 (steel blue).
- `pack-soldier-sheets.py`: 2× sheets (`*.v2.walk.png`, `walk.scale: 0.5`), frames 12 to a row (`anim.perRow`, sheets under 4096 px), enemy looks `enemy-*`, `ENEMY_ANIM_LOOKS`. The v1 sheets are removed.
- `HumanView`: art drawn at `walk.scale`; an animal definition with a fixed `look` wears it (enemy soldiers); `UnitSelection.kindPicture` reads the 2× frame.
- `animals.js`: `enemy_soldier`, `enemy_archer` (range 6), `enemy_swordsman`, `enemy_knight` – hostile, zone-only, renderer `enemy-soldier` (HumanView). `CombatFeedback` plays their attack frames; `GameScene` plays their fall on death.
- `camera.js`: `MAX_ZOOM` 1.8 → 3.2 (saves validate the camera zoom against it).

## Implementation decisions
Enemy soldiers are animals like the Raider (the war AI comes later); they guard where they stand (guardRadius 9).

## Save/Load impact
None (no schema change; a zoom up to 3.2 is now valid in a save).

## Testing
soldier-anim, sandbox, assets (objects 111, asset calls 169), camera-zoom tests; npm test; browser: Test map with four ours vs four enemies at zoom 3.2 – both sides fight, enemies fall in blue.

## Notes for the next agent
Another army colour: `--hue <h>` and a new look prefix in the pack script.
