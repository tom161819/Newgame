# Studio revision: Blender-rendered horses and bear in three styles; boar head level

## What and why
The owner's review: horses (after v3) and the bear still looked simple and low-poly. The owner wants:
- a big visual leap: semi-realistic, detailed 2.5D, like the hand-painted sprites of a quality medieval strategy game;
- internal resolution of 2× to 4×, at the same in-game size and footprint;
- three clearly different style proposals to compare;
- nothing deployed yet.

**What was done**
- **Blender is now available in the session** (`pip install bpy`, Blender 5.2.3 LTS). The pilot pipeline, `npm run blender:bake`, renders with Cycles at 4× supersampling and downsamples to 1× and 2×.
- **New skeleton mode in the animal recipe (`spec.skin`):**
  - Realistic horse (`horseSkin`), with real proportions: a deep chest, long slim legs with knees, hocks and fetlocks, an arched neck rising to the poll and a long head angled down.
  - Brown bear (`bearSkin`): a shoulder hump, a heavy body, thick legs on wide paws with claws, and a broad head carried low.
  - The renderer builds one smooth skinned body from the joints and radii (Skin modifier, subdivision, smoothing) and gives the lower legs the stocking colour. Hooves, ears, eyes, nostrils, mane, forelock, tail, saddle and harness are added as detail parts.
- **Three looks** (`variant.baked.look`, rendered by scripts/blender/render.py):
  - **A · sculpt**: a smooth, realistic body with a fine fur-grain bump and sheen.
  - **B · fur**: the sculpted body plus rendered hair strands (particle hair).
  - **C · painted**: the sculpted render with a painterly post-process on the 4× image: brush-sized colour patches, directional stroke texture, lifted colour and contrast, inked edges and a warm rim light.
- **Proposals:**
  - horse-{bay,grey}-{sculpt,fur,painted};
  - bear-brown-{sculpt,fur,painted}.
  - The old variants stay in place until a style is chosen.
- **Boar, revision 5.**
  - Found a bug: the per-species neck height (`neckUp`) was never used, so every head sat at the default height.
  - Boars now use a new `headLevel`, which carries the head almost level with the back.
  - The other species are unchanged on purpose, because they are already approved.
- **Horse wagons** wait until a horse is approved. The roof-fire sprites are replaced by the Fire Lab.

## Files and systems
- studio/src/generators/animal.js: `horseSkin`, `bearSkin`, skin marks and `headLevel`.
- scripts/blender/render.py: the organic looks, `build_skin`, fur and `painterly`.
- scripts/blender-model.mjs: passes `look` and `skeleton` to the renderer.
- The horse, bear and boar assets and their sprites.
- art/approvals.json.

## Implementation decisions
- Render time per sprite: sculpt about 65 s, painted about 85 s, fur several minutes. Fur is baked with fewer samples.
- The baked sprites are images. The Studio shows them instead of the live 3D preview.

## Save/Load impact
None.

## Testing
- npm test passes.
- Side-view test renders were checked for anatomy.
- The final sprites were checked at 2×.

## Notes for the next agent
- After the owner picks a style, bake the remaining colours and poses in that look.
- Then bake the horses for the wagons and caravans.
- Walk cycles in a baked look need one render per frame and direction (8 × stride frames). Plan the render time for that.
