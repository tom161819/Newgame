# Studio: Light Lab (night as a light map, m-osvetleni-noc step 1)

## What and why
Plan task `m-osvetleni-noc`, step 1 (Studio). The owner approved a new look for the night, built as a **light map**:
- the screen darkens to a bluish tone, and every light makes a lit area by multiplying;
- in a lit area, ground, buildings, people and objects keep their own colours, warmly tinted;
- there is no yellow layer over everything.

The owner also asked for:
- per-source colour, radius, strength, flicker and height;
- directional lighting on sprites, and faint shadows of people;
- smooth dusk and dawn, with lights switching on one by one;
- house windows that glow only while someone is home and awake.

The new page `studio/light-lab.html` is where the owner tunes all of this and proposes it for the game.

**What the Studio already had for lights:**
- `art/style-guide.json`:
  - `timeOfDay`: day, dusk and night, each with an ambient colour and `lightScale`;
  - `lightSources`: torch, brazier and window, each with colour, `radiusTiles`, intensity, flicker and `flameSize`;
  - `lightingModel`, which already describes a multiply light map.
- `studio/src/lib/lighting.js`: `timePreset`, `flicker` (the same formula as the game), `resolveLight` and `lightStrength`.
- `studio/src/render/compositor.js` `applyTimeOfDay`: a full-resolution light map for the asset preview (ambient fill, `lighter` radial gradients, multiply) and `drawFlames`.
- The Phaser demo: the same idea with a RenderTexture in MULTIPLY.
- Generators:
  - `torch-post.js` (torch or brazier light at the flame);
  - `props-night.js` (`wallTorch`, `towerTorch` and `roofFire`, with brazier and window lights);
  - exported sprites carry `gameLights`.
- The Fire Lab's Day/Dusk/Night scenes: a flat dark rectangle plus an additive glow.

None of these had height, directional shading, shadows, switch-on or occupancy.

**How night works in the game today (0.84.0, read only):**
- `src/data/dayNight.js` (`DAY_NIGHT`):
  - ambient `0x0b1433` at alpha 0.66 at night, with a full moon taking off up to 0.12;
  - darkness rises linearly through dusk (10 % of the day) and falls through dawn (5 %);
  - house windows have radius 30 and colour `#ffcf7a`.
- `src/game/NightOverlay.js`:
  - a screen-sized `dark` RenderTexture is filled with the ambient colour at that alpha;
  - every light **erases** a soft hole into it, so inside a light the world shows in plain daylight colours;
  - a second `glow` texture in ADD stamps a warm yellow-orange brush (`rgba(255,190,110,.55)`) over each light. This is the yellow flicker overlay that washes everything out.
  - Only lights in the camera view are drawn, and the glow is cropped to the lights' box.
- The lights come from:
  - `LightSourceSystem.lights()`: `definition.lights` of completed buildings, flicker × intensity, and fuelled places only when lit;
  - `DayNightSystem.houseWindows()`: windows of lived-in houses from dusk until each family's bedtime;
  - soldiers' hand torches (`lightFuel.handLights`);
  - `FireViews.lights()`.
- `LitBuildingView` draws the flames.
- `DayNightSystem.lights()` (in tiles) also drives night sight.
- What is missing: tinting, height, directional light, shadows and gradual switching on. All lights appear together as the darkness grows.

## Files and systems
- **`studio/src/light-lab/lightmap.js`**: the reusable algorithm. No DOM, Studio or Phaser imports, so the game and Node can import it.
  - `defaultLightSettings`, `readLightSettings` and `normalizeLightSettings` (validate untrusted data).
  - `ambientColor` (white → dusk colour → night colour × night strength), `switchOn` (per-seed staggered fade-in) and `flicker` (the game's formula).
  - `resolveLights`: sources → ground ellipse `rx × ry` (one tile = 45 × 23 px), `up` (height) and strength.
  - `lightAt` and `visibleLights`.
  - `LightMap`: an offscreen canvas at `global.resolution` (0.5 by default). It draws only lights in view, each as two half-ellipse gradients (ground, and stretched up the walls), then `drawTo` multiplies it over the scene.
  - `directionalShade`, plus `cornerTints` for Phaser's four-corner `setTint`, and `shadowFor`.
  - Canvas helpers `drawShadedImage` and `drawShadow`, and `lightingFile`.
- **`studio/src/light-lab/model.js`**:
  - the 12 × 12 scene: 2 houses, a smelter, a bakery, a well, a torch post, a brazier and a campfire, all from `src/data/objects` definitions and sprites, plus 6 approved villager looks;
  - `buildingSources` (the game's `definition.lights`, plus one window per house as `houseWindows` places it);
  - time helpers on the game's `darknessAt`/`dayPart`, eased with a smoothstep;
  - `windowGlow` (someone home and before bedtime) and `proposalDoc`.
- **`studio/src/light-lab/main.js`** and **`light-lab.css`**:
  - the page: time slider, Play, seasons, and a Simple/Full toggle;
  - six source types: torch, lantern, campfire, brazier, forge and house window;
  - mouse editing: click adds, drag moves (sources and people), right-click or Delete removes, Shift-drag pans;
  - per-type and global sliders, houses (someone home, bedtime), and a 1×/2× zoom;
  - the FPS meter, with frame time, light-map time and lights in view.
- **Page database:** `lightingProposal/default` = `{schema, settings, by, note, at}`. The top bar then asks for „revize“ in chat Grafika. Without the database the proposal stays in the browser.
- **Files:**
  - **`art/lighting/light-lab-default.json`**: the current defaults, `{kind: 'light-lab', schema, by, at, note, types, global}`.
  - **`scripts/studio-lighting.mjs`** (`npm run studio:lighting -- <proposal.json> | --defaults [--dry-run]`) writes that file from a proposal and prints what it fixed.
  - Export JSON downloads the same format.
- **Wiring:** Light Lab links on every Studio page, the Vite input `light-lab`, a Light Lab section in `scripts/studio-smoke.mjs` (and the phone check), and `tests/studio-light-lab.test.js`.

## Implementation decisions
- **Multiply light map with additive lights**, not erase plus glow. The ambient colour multiplies everything, and a light adds its colour to the ambient, so lit areas keep the sprites' colours tinted warm, and flames are drawn afterwards so they stay bright.
- **Height** is a vertical stretch of the upper half of the light's ellipse (`ry + height`). One light is two clipped gradient fills, which costs almost nothing and reaches walls and roofs near a source.
- **Directional lighting** sums, per sprite, the pull of the lights that reach it, so lights on both sides cancel out.
  - In the Lab it is a source-atop gradient: warm towards the light, dark-blue away from it.
  - For the game, `cornerTints` gives the same result as four vertex tints. This is the cheap path in Phaser.
  - Simple quality switches it off.
- **The lamp position and the light's height are separate.** `lamp` is where the flame is drawn, taken from the game's light offsets. `height` is how far the light reaches up the walls, and is what the owner tunes.
- **Positions:**
  - A light on a larger building stands on the foot of its front wall.
  - A one-tile place's light stands in the middle of its tile.
  - A house window stands at the front corner of the house, so its light falls in front of the house.
- **Smooth dusk and dawn:** the smoothstep of the game's linear darkness. `switchFrom`, `switchSpread` and `switchRamp` stagger the switch-on by each source's seed.
- **No change in `src/`.** The Lab only imports the game's definitions, villager art and day-part functions.

## Save/Load impact
None. Studio only; the game, its saves and `SAVE_VERSION` are untouched. No game release, so there is no `CHANGELOG.md` entry (Studio-only changes are recorded here, as for the World, Fire and UI Labs).

## Testing
- `npm run studio:build` passes.
- `npm test` passes (1219 tests, including 9 new Light Lab tests):
  - settings validation and round trip;
  - the committed file is valid;
  - ambient by day and at night;
  - smooth darkness and staggered switch-on;
  - radius and height reach;
  - culling and half-resolution map size (mock canvas);
  - directional shade, corner tints, the Simple toggle and shadows;
  - scene sources from the game definitions;
  - windows by home and bedtime.
- **Not run:** the browser smoke (`npm run studio:smoke`), because another agent was using the browser. The new Light Lab section and the phone check entry are written but unverified. No screenshots were taken, and the look and FPS have not been seen in a browser.

## Notes for the next agent
- **Verify first in a browser** (`npm run studio:smoke`, then look at `light-lab.html`):
  - the warm tint and the strength of the darkness;
  - the gradient direction on buildings;
  - the shadow angle;
  - FPS at 1× and 2×;
  - right-click removing a source;
  - the phone layout.
- **On „revize“:** `db_get lightingProposal/default` on the Studio page, save it to a file, run `npm run studio:lighting -- <file>`, commit `art/lighting/light-lab-default.json`, then delete the document with `ifVersion`.
- **Step 2 (Mechaniky):**
  - Take the file into `src/data/lighting.js`.
  - Replace `NightOverlay`'s erase-and-glow with a MULTIPLY RenderTexture that follows `LightMap.render` (ambient fill, then ADD gradient stamps for the ground half and the upper half, at half resolution, lights in view only).
  - Use `cornerTints` on building and villager images in Full quality, and `windowGlow`/`switchOn` for windows and the gradual switch-on.
  - Keep `DayNightSystem.lights()` for sight.
  - A full moon could lower `nightStrength`.
