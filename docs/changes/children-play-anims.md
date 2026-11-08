# Children's game animations in the game (g-deti-naves-grafika)

## What and why
The owner approved the eight children's game loops in the Studio on 8 Nov 2026 (art/approvals.json, `child-play-*`,
status `approved`, version 1). They are now deployed like the 0.67.0 art: a child who plays a game plays the matching
two-frame loop (4 fps) in its facing, in place of the single key frame. Deployed: tag, tag-girl, hoop, ball, swing,
snowball, snowman, hay. Nothing was skipped.

## Files and systems
- scripts/export-approved-art.mjs: copies `art/sprites/child/child-play-<name>.v1.anim.png` byte for byte into
  public/assets/characters/children and adds `children.looks[<look>].play[<game>]` (sheet, artSource, frame size,
  origin, fps, column count and clip frames from `meta.anim`) to the generated src/data/objects/approvedDeployArt.js.
  The rest of the generated file is unchanged.
- src/game/deployArt.js: `childPlay(child, look)` (game → loop of the look, or null) and
  `childPlayFrame(play, row, playedMs)`.
- src/game/ChildViews.js: `drawChildArt` plays the loop when it is loaded. Otherwise it falls back to the key frame,
  then to the walk sheet, then to the drawing.
- tests/approved-art-deploy.test.js: play sheets added to the deployed list, which checks that each file exists, is
  approved, matches by sha256, has the meta.anim fps, columns, frame size and origin, and that only listed files are in
  the folder. A new test covers the game → sheet mapping per look and the frame indexing.
- scripts/approved-art-smoke.mjs: three children play tag (boy and girl) and hoop. The smoke checks the loop texture
  keys and that the frames change, with no 404s. Screenshot: /tmp/shots/children-play.png.

## Implementation decisions
- **Each loop is one of the six looks.** The meta has no sex field, but the Studio spec in
  art/assets/units/child/asset.json shows that each loop is drawn on one existing look. The exporter matches them by
  sex, clothes, headgear and hair:
  - tag → child-boy-tunic (chasing);
  - tag-girl → child-girl-braid (catching);
  - hoop → child-boy-cap;
  - ball → child-boy-ball;
  - swing → child-girl-kerchief;
  - snowball → child-boy-tunic;
  - snowman → child-girl-braid;
  - hay → child-boy-cap.

  These are the same looks that had the key frames. So a loop plays only for children of its look, and other looks keep
  today's appearance (walk sheet), as with the key frames. This keeps a child from changing clothes or sex when it
  starts a game. `tag` and `tag-girl` are both for the game `tag`: the boy look gets the chasing loop and the braid
  girl gets the catching loop.
- **Rows and frames.** Rows are facings 0–7, as in the walk sheets (FACING_INDEX), with no mirroring. Frame =
  row × columns + clip[i]. The play time restarts when the game changes and advances only while the child is drawn,
  so hidden children (off screen, in fog or inside) do not animate. The loop also plays while the child runs during
  tag or hoop.
- **Fallbacks.** A fleeing child keeps the `run` key frame, because fleeing is not a game. The shore has no loop. A
  missing or failed sheet uses today's look.
- **Origin.** The origin is `meta.anim.origin`.

## Save/Load impact
None. Nothing new is saved; SAVE_VERSION stays at 59.

## Testing
- `npm test`: 1096/1096 pass (1095 plus the new mapping test).
- `npm run build -- --base=/Newgame/`: OK.
- `node scripts/browser-smoke.mjs --approved-art`: PASS (children loops, frames change, no 404s).
- `node scripts/browser-smoke.mjs --children`: PASS.

## Notes for the next agent
- After a Studio revision of a loop, re-run `node scripts/export-approved-art.mjs`.
- If the owner wants every child who plays a game to animate (not only its own look), the loop would have to be drawn
  per look (six variants per game) in the Studio. Reusing one figure for every child would change the child's
  appearance.
- docs/changes/approved-art-deploy.md still says that the child-play-* sprites were not approved. That was true for
  0.67.0.
