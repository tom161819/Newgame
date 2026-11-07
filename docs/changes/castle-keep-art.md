# Castle: approved art with a bergfried

## What and why
In the 7 November revision the owner chose `castle-keep` (castle with a bergfried) for the game. Plan item
`m-hrad-nova-grafika` replaces the procedural castle (FortificationView) with this sprite.

## Files and systems
- `public/assets/buildings/castle/castle-keep.v1.png` and `.front.png`, copied from `art/sprites/castle/`.
- `src/data/objects/buildings.js` (castle):
  - `renderMode: 'sprite'` with `frontSprite`, `artSource`;
  - origin and frontOrigin = `baseOrigin`, visualHeight 250, platform `{x:0,y:-199}` (was -168);
  - `lights` = `gameLights` (3 window glows, 2 gate torches).
  - The renderer stays `fortification` as the fallback when the texture is missing.
- `src/systems/ObjectRegistry.js`: a light may have `flameSize: 0` (before, it had to be positive).
- `src/game/LitBuildingView.js`: lights with `flameSize: 0` draw no flame (window glow only).
- `tests/assets.test.js`: asset queue +1 (castle front layer).
- `scripts/castle-art-smoke.mjs` (`--castle-art`).

## Implementation decisions
- Same layout as the watchtower: the main sprite at the building depth, the front battlements at depth +0.3, the King
  between them (depth +0.2), so the battlements are drawn over the King's feet.
- The footprint stays 3×3, so there is no save change. The gate in the art faces the front-left (towards the starter
  stockpile and the gathering place).
- The game has no night lighting yet: the window glows are ready for the light map (`LightSourceSystem.lights()`) and
  only the torches draw flames today.

## Save/Load impact
None (same footprint, same id).

## Testing
- `npm test` (956 pass).
- `npm run smoke -- --current-only --castle-art`:
  - the start castle has the main and front layers and 5 lights;
  - the King climbs up and stands on the keep platform behind the battlements;
  - screenshot `castle-keep.png`.

## Notes for the next agent
- A night snapshot is not possible until the day/night cycle exists. When it is added, check the window glows on the
  keep (gameLights type `window`).
- FortificationView is still used by the Stone Wall and as the castle fallback.
