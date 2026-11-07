# Walk cycle for figures (V03 animation, plan g-vojenske-navrhy)

## What and why

V03 left the soldier classes without animation ("Animations not made yet"). The game shows approved figures as one
still sprite per direction with a bob and sway. Figures now have a real walk cycle in the Studio, and every approved
walking figure is exported with a walk sheet the game can play. Wiring the sheets into the game is a separate
Mechaniky step.

## Files and systems

- `studio/src/generators/figure.js`: new parameter `stride` (−1…1).
  - Feet step along the figure's front axis, by 0.1 for men and 0.06 for women, whose skirt hides the legs.
  - Legs swing about the hip; free arms swing against the leg on their side about the shoulder.
  - Hands that hold something stay still: the right hand with a tool or weapon, the left hand with a bow, basket,
    bucket or shield.
  - Riders do not walk.
  - Stride 0 or no stride gives exactly the old model, so approved sprites and spec hashes are unchanged.
- `studio/src/generators/shapes.js`:
  - box orientation as a matrix (`partMatrix`, `axisMatrix`, `orientation`);
  - `turnParts`, which turns tilted boxes exactly. `rotateParts` only adds to a box's rotation, which is right only
    for upright boxes.
  - Figures use `turnParts` for their direction; nothing else changes.
- `studio/src/main.js`:
  - New **Walk cycle** tab for figure assets: each walking variant walks in all eight directions at 6 frames per
    second, as standing → right foot → standing → left foot.
  - `exportSprite` adds a walk sheet for approved figures: `<variant>.v<N>.walk.png`, 8 rows (facings 0–7) × 3
    columns (idle, stride-a, stride-b). All cells share one anchor at the feet. Metadata goes in `meta.walk`:
    `frameWidth`, `frameHeight`, `anchor`, `origin`, `columns`, `cycle`, `fps`.
  - Direction-sheet variants (with a fixed `facing`) no longer get eight-direction exports.
- `scripts/studio-export.mjs` writes the walk sheet.
- Exported sprites for all approved figures:
  - 42 walk sheets;
  - the eight-direction PNGs of figures approved since the last export (military classes, new workers, merchants).
  - Existing PNGs are unchanged.

## Implementation decisions

- Three poses instead of more frames: at 1× a figure is about 35 px tall, and four steps (standing, right, standing,
  left) read as walking without bloating the repository. The game can keep its bob on top.
- One sheet per variant instead of 16 more files. Phaser loads it as a spritesheet (frame index = facing × 3 +
  column).
- The game's `FACING_INDEX` maps game directions to Studio facings; the sheet rows use Studio facings, like the
  existing `facing-k.png` files.

## Save/Load impact

None: art and Studio only. The game version does not change.

## Testing

- `tests/asset-studio-military.test.js`:
  - stride 0 equals the standing model;
  - swinging tops stay at the hip and shoulder in every direction;
  - busy hands and riders do not swing;
  - every approved walking figure has a sheet with the size its metadata says.
- `npm run studio:smoke`: walk cycle tab and walk sheet export; buildings have no walk tab.
- `npm test`.

## Notes for the next agent

- Game wiring (Mechaniky):
  1. Copy the sheets next to the `facing-k` PNGs in `public/assets/characters/villagers/`.
  2. Load them as spritesheets (`frameWidth`/`frameHeight` from the metadata).
  3. In `HumanView`, while walking, play the `cycle` at `fps` in the row of the current facing, and keep the idle
     frame when standing.
- Soldier classes (archer, swordsman, soldier, knight) are approved but the game still uses one soldier look.
