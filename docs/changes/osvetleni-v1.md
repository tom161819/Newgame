# Lighting v1 from the Light Lab

## What and why
Owner, 9 Nov 2026 (Grafika chat): "implementuj do hry lighting v1 z lighting labu". The owner pasted the Light Lab export `note: lighting v1` (author u_j1ZMpkyV91EhU6dsT7h4Ow, 2026-11-09T19:28:57Z).

## Files and systems
- **src/data/lighting-v1.json:** the export, verbatim.
- **src/game/NightOverlay.js:** rewritten. It is now the Lab's own light map (src/render/lightLab.js, moved from the Studio; the Lab re-exports it):
  - `readLightSettings` normalises the settings;
  - `resolveLights` handles switch-on per light, flicker and per-type colour, radius, strength and wall reach;
  - `LightMap.render` fills the ambient colour and adds coloured ellipses ('lighter').
  - The screen-sized canvas (at `resolution` 0.5) is one Phaser image multiplied over the world.
- **Light sources:**
  - building lights (LightSourceSystem): forge-type buildings (smelter, swordsmith, armorer, bakery) become `forge`, burning buildings become `campfire`, and unknown types become `torch`;
  - house windows become `window`;
  - soldiers' hand torches become `torch`;
  - fires become `campfire`.
- **src/game/GameScene.js:** passes the frame delta for flicker time.

## Implementation decisions
- **Share one module (moved into the game, the Lab re-exports it; the game never imports Studio code).** The game and the Lab do not drift apart.
- **Patch the Canvas renderer's blend table.** Phaser's start-up probe of the new canvas blend modes can fail, and then MULTIPLY draws as normal and covers the map. Every current browser supports 'multiply'.
- **Leave out directional shading and people's shadows.** They are in the Lab (`directional`, `shadows`) but not yet in the game, so this v1 is the light map only.

## Save/Load impact
None.

## Testing
- npm test.
- Canvas screenshots at dusk and at night: a bluish night with warm light pools around the castle torches.

## Notes for the next agent
- Next steps: `directionalShade`/`cornerTints` on sprites (WebGL setTint corners) and `shadowFor` shadows of people.
- Night sight still uses the game's own light radii (data/torches.js), not the Lab radii.
