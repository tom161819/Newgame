# Studio: Tripo Tower and Gate v2 (foot fills the tiles)

## What and why
Owner 21 Nov 2026: "věž a bránu klidně vyrenderuj znovu pokud to bude lepší" (after 0.149.11, where the walls reach
into the Tripo bodies because these stand about 0.2 tile inside their 2 × 2 tiles).

## Files and systems
- `scripts/blender/render_glb.py --fill`: the model's foot (lowest 12 % of its height) is stretched across to cover the
  footprint exactly and centred on it; the height stays.
- `scripts/blender-bake.mjs`: `baked.fill` passes `--fill` (and enters the render hash).
- `art/assets/buildings/watchtower/asset.json` (`watchtower-tripo`) and `art/assets/buildings/gate/asset.json`
  (`gate-tripo`, `gate-tripo-axis-x`): version 2 with `baked.fill`. Renders `art/sprites/{watchtower,gate}/*.v2.*`;
  the Tower's front layer `watchtower-tripo.v2.front(.x2).png` (render_glb `--front`).
- Studio (`studio/src/data.js`, `fire-lab/main.js`, `demo/phaser-demo.js`): the superseded v1 Tripo sprites and the
  wall-kit previews v1–v4 stay in the repo but are left out of the Studio build (512-file limit: 519 → 506).

- `tests/asset-studio.test.js`: while a newer version of the game's variant waits for review, the game sprite and
  front layer are compared with the approved version's export (`artSource`) instead of the current spec.

## Implementation decisions
- Measured on the renders: the foot now reaches about ±60 px of the ±64 px footprint corners (was ±50–54).
- Not in the game yet: v2 waits for the owner's review in the Studio (AGENTS: unapproved art never enters the game).
  `art/approvals.json` is unchanged; the owner's review records the decision.
- After approval: integrate the three sprites, the Tower front layer and the turned Tower views (`door-e`, `no-door`,
  rendered with `--fill` at 180° and 270°, kept outside the repo in `/home/claude/work/glb/tv2`), the Gate front
  layers (render again with `--fill --front`), and set `WALL_STUB` to about 0.06.

## Save/Load impact
None.

## Testing
- Renders measured (foot width at the footprint corners); `npm run studio:build` (506 files); the Studio smoke fails
  at "a design opened by link is scrolled into view", the same on the previous commit (not caused by this change).

## Notes for the next agent
- The Studio smoke failure above is older than this change.
