# #98 Idle workers sit on a porch in front of their workplace

## What and why
The owner wants idle workers to sit on a themed porch in front of their workplace and pick their nose. Decided on 7 Nov:
- option (a): the porch is a separate object on free tiles in front of the building, and the building keeps its
  footprint;
- the Studio porches from #114 are approved (all variants; preferred: workplace-porch-veranda, trade-porch-mill,
  profession-porch-smith).

## Files and systems
- `src/data/porches.js`:
  - `PORCH_ART`: 9 approved variants with sprite, artSource, origin (footprint centre), visualHeight and the `seats`
    from the Studio specs;
  - `BUILDING_PORCHES`: which workplace gets which porch;
  - `PORCH_DEFAULT` (veranda) and `PORCH_RULES` (Barracks excluded, refresh every 2 s);
  - `porchVariant`, `porchId`.
- `src/data/objects/decorations.js`: one walkable `decoration` object per porch (`porch_<variant>`), so the sprites
  load with the other assets. Names are in both languages.
- `public/assets/decorations/porches/*.v1.png`, copied from `art/sprites/{workplace,trade,profession}-porch/`.
- `src/systems/PorchSystem.js`:
  - placement: a 2×1 strip on free tiles, first the row in front-left, then mirrored along the front-right, then the
    back sides;
  - `refresh` keeps or moves the porches;
  - views: an image, mirrored with `flipX` for the side strip;
  - seats: one worker per seat;
  - `check(worker)`: sit or get up.
- `src/systems/WorkerAI.js`: `update` = `step` + `porches.check`.
- `src/game/WorkerController.js` and `src/game/HumanView.js`: `setSeated` (provisional pose).
- `src/game/GameScene.js`: creates, updates and destroys `PorchSystem`.
- Tests: `tests/porches.test.js`. Asset counts +9 in `tests/assets.test.js`.
- `scripts/porch-smoke.mjs` (`--porch`).

## Implementation decisions
- **When a worker sits:**
  - he is `Waiting` with his workplace reached, and has no task, cargo, rest, order or route;
  - soldiers never sit.
- Any change gets the worker up, and his seat is freed.
- Two seats of one porch can share a tile. The worker therefore stands on the seat's tile or next to it (preferably a
  tile next to the building, so he still counts as at his workplace). The figure is then drawn exactly on the seat.
- **Mirroring:** the art only exists as a strip along x. Mirroring it (`flipX`) gives the strip along y, and the seat
  coordinates swap [x, z] → [z, x].
- **No save change:** the porches follow from the completed workplaces, and seated workers stand up and sit down
  again after loading.
- **Sitting pose is provisional:** the figure is squashed to 80 % height, and a small hand at the face appears now and
  then (picking his nose). There are no seated sprites yet.
- More idle workers than seats keep standing by the workplace as before.

## Save/Load impact
None (SAVE_VERSION stays 55).

## Testing
- `npm test` (962 pass), including the porch tests:
  - art and mapping;
  - placement in front and moving when the tiles are built on;
  - one worker per seat, the exact seat point;
  - work or rest gets the worker up.
- `npm run smoke -- --current-only --porch`:
  - a finished Mill gets the trade porch;
  - a miller without grain sits on it;
  - screenshot `porch.png`.

## Notes for the next agent
- Seated villager sprites (and a nose-picking clip) would replace the provisional pose in `HumanView.setSeated`.
- A future workplace gets the shared veranda unless it is added to `BUILDING_PORCHES`.
- The awning, bench and baker porches are approved but not used; the awning (3 seats) fits a larger workplace.
