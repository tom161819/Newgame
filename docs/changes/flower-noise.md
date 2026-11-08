# Flower density by area (plan m-kvety-sum)

## What and why

Owner request (8 Nov): flowers should not be spread evenly over the map. Some areas are rich in flowers, some
normal, some almost bare (grass only). A large, smooth noise map of flower density now multiplies the flower
density everywhere; at the defaults about 30 % of the land is almost bare (×0.05), 45 % normal (×1) and 25 %
rich (×1.8), with soft borders over a few tiles. Visual only.

## Files and systems

- `src/render/continuousGround.js` (Grafika's file, minimal change): new `flowerDensity(x, y, settings, seed)`,
  `plantsFor` takes an optional `seed` (default 0) and multiplies `want` of `flowersSmall` / `flowersLarge` by it.
  Two new defaults `flowerAreaScale: 24`, `flowerContrast: 6` and two `GROUND_SETTINGS` entries (group `plants`).
- `src/data/groundStyle.json`: the two keys with the default values.
- `src/data/groundLook.js`: both keys must be whole numbers (like `duckFamilies`); ranges come from `GROUND_SETTINGS`
  (area scale 6–60 tiles, contrast 0–9).
- `src/ui/WorldEditor.js`: the Plants tab shows both sliders automatically (group `plants`); the iso preview passes
  the editor's seed. `src/i18n/en.js`, `cs.js`: labels "Flowers – area scale (tiles)" / "Flowers – contrast",
  "Květiny – velikost oblastí (dlaždice)" / "Květiny – kontrast".
- `src/game/GameScene.js`: `this.worldSeed` (seed of the world code, 0 without one); `src/game/TerrainRenderer.js`
  passes it to `plantsFor`.
- Tests `tests/flower-noise.test.js`; smoke `scripts/flower-noise-smoke.mjs` (`--flower-noise`, registered in
  `scripts/browser-smoke.mjs`).

## Implementation decisions

- Flowers are placed by the ground renderer (`plantsFor`), not by the world generator, so the noise and its two
  settings live in the ground style, not in the world code.
- Seeding follows the file's other noises (positional value noise with a salt); the salt is derived from the world
  seed by hashing it (`flowerSalt`), so it is an own stream and the same seed gives the same layout.
- Noise: two smooth octaves of the existing value noise (no fine octave), so a border never jumps more than about
  half the step per tile. The value is mapped by two smoothstep ramps (thresholds 0.46 / 0.61, half-width 0.09)
  measured to give the 30 / 45 / 25 % split; contrast scales the deviation from ×1 (`1 + (m − 1) · c / 6`, clamped
  at 0), so 0 = exactly ×1 (the look before), 6 = the split above, 9 = ×0 … ×2.1.
- Only `flowersSmall` and `flowersLarge` follow the noise; thistles, shrubs, tufts and stones keep their spots. The
  flowery-meadow zone (LIKES ×2.2 / ×2.4) stays and multiplies with the noise. Seasons unchanged (growth curves =
  no flowers in winter). The painted speckles (tiny flowers & pebbles in the ground texture) are not affected.
- The candidate spots and hashes are unchanged; only the keep threshold changes, so the same tile keeps the same
  flowers and the cost is one noise lookup per tile per chunk paint (chunks are cached since 0.74.0).

## Save/Load impact

None new. Saves already carry the world code (seed) in the game settings and the ground-look override (the two
keys are stored there when changed in the World Editor and validated on load). Old saves without a world code use
seed 0; an override from an older build simply lacks the keys and gets the defaults.

## Testing

- `npm test`: 1118 pass (1111 + 7 new in `tests/flower-noise.test.js`: same seed = same layout, contrast 0 = old
  density exactly, non-flowers unchanged, default split and smooth borders, flowery zone and winter, contrast 9 and
  area scale, World Editor / groundLook keys and validation, en/cs labels).
- `npm run build -- --base=/Newgame/`; smoke `--flower-noise`: both sliders on the Plants tab with defaults and
  ranges, moving contrast redraws the preview; a game with `MKW2-155515555555-1` in summer, zoomed out over tiles
  around (62, 18); screenshot `/tmp/shots/flower-noise.png` shows rich flower meadow top-left and bare grass in the
  middle and right. Re-run alone: `--world-editor`, `--world-look-2`, `--approved-art` pass.

## Notes for the next agent

- Grafika: the World Lab builds its sliders from `GROUND_SETTINGS`, so the two sliders may already show there in
  the plants group; please check their placement/labels and pass a seed to `plantsFor` (the Lab uses seed 0 now).
  The Studio was not edited.
- The smoke forces the ground season to Summer only (`terrain.setSeason`); the HUD still shows the game's season.
- If the owner wants the speckles in the flowery zone to follow the noise too, multiply `sp` in
  `paintContinuousGround` by `flowerDensity` for the flower speckle colours only.
