# 149 – Blender pilot: Breach rendered by Blender

## What and why
The owner asked to try Blender for the art (`blender-pilot-zadani.md`; planned for the Barracks through GitHub Actions, which are gone). The pilot ran on the broken wall instead: a fifth variant `ruined-wall-blender` ("Breach (Blender)") renders exactly the Breach v2 layout with Blender, so the owner can compare the Studio's Three.js render and Blender side by side in the Studio.

## Files and systems
- `scripts/blender/render.py`: generic renderer for any Studio model. Boxes of stone materials become bevelled, subdivided, noise-displaced stones; spheres become icospheres (rocks, leaves); cylinders cones; prisms prisms. Procedural materials from the palette (4D noise per object, per-object colour shift, bump). Cycles CPU with denoising, sun and sky from `art/style-guide.json` light (Three's hemisphere irradiance / π × 0.8 as world radiance), orthographic camera in the game projection, rendered at 4× and box-downsampled to 1× and 2× in premultiplied alpha. The ground shadow comes from a shadow-catcher pass minus an objects-only pass, scaled to the style's 32 % opacity.
- `scripts/blender-model.mjs`: writes a variant's model (generator primitives, palette colours, light, projection) as JSON.
- `scripts/blender-bake.mjs` (`npm run blender:bake -- <asset> [<variant>] [--samples 96]`, Python from `BLENDER_PYTHON`): bakes every variant with `baked.renderer = "blender"`, records `baked.renderHash` (renderer script + model + samples) in asset.json, writes `<variant>.v<n>.png`, `.x2.png` and the usual sidecar JSON (`generator: "blender"`, `x2`, `render` facts) with the Studio's spec hash.
- Studio (`studio/src/main.js`): variants with `baked` are drawn from the committed PNG (2× file for scales ≥ 2) and its sidecar anchor; images preload before `window.assetStudio.ready`. The card states the Blender version, samples and time, and warns when the spec changed after the bake. `exportSprite` hands baked sprites over unchanged; `studio:export` skips them.
- `art/assets/decorations/ruined-wall/asset.json`: variant `ruined-wall-blender` v1, same spec as Breach, `baked: { renderer, twin, renderHash, samples }`. `art/approvals.json`: in review.

## Implementation decisions
- Reuse the recipe's primitives instead of a separate hand-modelled scene: one layout, two renderers, a fair comparison, and the renderer works for every Studio asset (buildings too) without new scene scripts.
- Cycles, not EEVEE: the `bpy` wheel has no GPU/OpenGL context here. 96 samples + OIDN: about 95 s for the 2×1 wall (two passes at 4×).
- The projection matches the Studio to the pixel: same 102 × 99 sprite and anchor 49,73 as the Three.js Breach v2.
- Baked sprites carry daylight only; the Studio's day/dusk/night light map is applied on top as for every sprite, so nothing else is needed for the time-of-day preview.

## Save/Load impact
None. No game change, no release.

## Testing
- `npm test`: 784 pass (new: baked metadata matches the spec hash, anchor/size match the Studio twin, 1×/2× PNG sizes match the sidecar).
- `npm run studio:smoke`: 18 PASS, including the baked card (render facts, size) and export.
- Determinism: a second render of the same model differed by at most 1/255 in one channel (0 pixels over 2/255). Not part of `npm test` because it needs `bpy` and 95 s.

## Notes for the next agent
- Setup: `python3 -m venv ~/blender-venv && ~/blender-venv/bin/pip install bpy pillow` (bpy 5.2.3 LTS wheel, ~400 MB, needs Python 3.13), then `BLENDER_PYTHON=~/blender-venv/bin/python npm run blender:bake -- ruined-wall`.
- After changing the twin's spec, copy it to the baked variant and bake again (the test checks the specs are equal and the hash matches).
- At 1× the gain is modest (softer light, rounder stones); at 2× and in close-ups it is clear. If the owner likes it, the next step is a Blender pass for buildings, or Blender-only details (displaced stone, real ivy) that the primitive recipe cannot express.
