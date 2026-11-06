# #119 – Builders' Workshop concepts in the Asset Studio

## What and why
[#119](https://github.com/tom161819/Newgame/issues/119) asks for at least three consistent concepts of the Builders' Workshop. It should be a small low building with an open work shelter, where benches, logs and tools are visible from the isometric camera. The concepts are for approval in the existing Asset Studio and must not enter the game unapproved. The mechanics are Codex's #118 (PR #196, `builder_workshop`, 2×2, temporary warehouse placeholder).

## Files and systems
- `studio/src/generators/workshop.js`: new body kind `shed`, an open lean-to:
  - posts carry a sloping shingle roof down to a low plank back wall (optional side wall and torch);
  - the front faces the camera (+x/+z), so the work underneath stays visible.
  Existing kinds are unchanged, so the generator version stays 1 and earlier approvals stay valid.
- `art/assets/buildings/builders-workshop/asset.json` (`plannedGameObjectId: builder_workshop`) with three variants:
  - **open lean-to shed**: two benches, a tool rack, logs, stone and crates;
  - **low workshop with awning**: a timber workshop with the bench and tools under its awning, plus logs, a cart and firewood;
  - **shed with material yard**: a shed with a side wall and a fenced yard of logs, stone and crates.
- `art/sprites/builders-workshop/*.v1.{png,json}`, exported by `npm run studio:export -- builders-workshop`.
- `art/approvals.json`: all three are `review`; the preferred proposal is the open shed.

## Implementation decisions
- Built from the existing workshop recipe and prop catalogue, so the concepts share the approved 2.5D style, materials and lighting of the other production buildings.
- All parts stay inside the 2×2 footprint, which the studio tests check. The work area sits on the camera-facing side, so the shelter does not hide Builders.
- Nothing in the game changes. After approval, a separate integration step swaps the #118 placeholder sprite for the approved export.

## Save/Load impact
None.

## Testing
- `npm test` passes; the asset studio tests validate the spec, the footprint, at least three prop kinds per variant and the committed sprites.
- `npm run studio:smoke` passes: no console errors, the Phaser demo places the sprites in Canvas and WebGL, and the 390 px phone layout works.
- The exported sprites were inspected visually.

## Notes for the next agent
- Approval happens in the Studio (`/Newgame/studio/#builders-workshop`, Review → Approved and an approvals export). Then integrate the approved PNG for `builder_workshop` once #118 (PR #196) is merged.
- Footprint, entrance and idle anchors are defined by #118. If Codex changes the footprint, re-export the concepts.
