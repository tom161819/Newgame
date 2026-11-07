# Studio revision 7 Nov 2026: decisions taken over, Wheelwright Workshop revision 2

## What and why

Grafika chat, "spustit revizi": take over the owner's Studio decisions and handle the one revision request. No game change; the game version stays as it is.

## Files and systems

- `art/approvals.json`: the decisions taken over, and wheelwright-yard-shed moved to v2 in review.
- `studio/src/generators/props.js`: new props.
- `art/assets/buildings/wheelwright-yard/asset.json` and `art/sprites/wheelwright-yard/wheelwright-yard-shed.v2.*`.
- `tests/asset-studio-buildings.test.js`.

## Implementation decisions

### Decisions taken over (npm run studio:sync)

- 55 approvals and 7 preferred picks from the shared Studio go into `art/approvals.json`.
- Approved: barracks-hall-stone, builders-workshop-material-yard (v2), all four ruined-wall v2 variants, the burnt
  buildings, ruin foundations, ruined towers and scattered stones, bushes, wild ground, marketplace-square,
  merchant-caravan-empty, both merchants, five profession porches, workplace and trade porches, wall-gate-portcullis
  and the worker figures (armorer, bowyer, smelter operator, stablehand, swordsmith, wheelwright).
- Preferred: bush-meadow, marketplace-square, merchant-male, merchant-caravan-empty, profession-porch-smith,
  wall-gate-portcullis, wild-ground-beach.

### Revision: wheelwright-yard-shed v2 (#92)

Owner's comment: make it clear what the building is for; it can be half open so the work shows inside; a half-built
wheel; bigger wheels; a stall for one horse.

- The body is now a half-open lean-to shed (plank back and side wall, front 1.2 high) with a lantern.
- New props in `studio/src/generators/props.js`:
  - `spokedWheel`: a real spoked wheel from boxes, upright facing +z or +x, or flat, with a partly built rim
    (`done`) and an iron tire;
  - `wheelStand`: a post with a half-built wheel lying on it;
  - `spokesBundle`: spokes and felloe blanks;
  - `horseStall`: a stall for one horse with low side boards, hay rack and straw.
- The wheels are bigger (radius 0.22–0.24 instead of 0.15) and stand in a rack, beside the shed and on the stand.
  There is a cart in the yard and a grey horse in the stall.
- Sprite `art/sprites/wheelwright-yard/wheelwright-yard-shed.v2.png`. The approval record moved to v2 in review, and
  v1 (revision-requested) is in the history.
- Test: `tests/asset-studio-buildings.test.js`, wheelwright revision 2.

## Save/Load impact

None: art and Studio only.

## Testing

- `npm test`: 839 pass.
- `npm run studio:export -- wheelwright-yard`, then the sprite was checked by eye: the horse shows, the half-built
  wheel is visible under the roof, and the wheels read as wheels.

## Notes for the next agent

- The Studio DB documents that were taken over are deleted at the versions read once the Studio with the new manifest
  is published.
- Wiring the approved sprites into the game is a Mechaniky job: see the plan notes (#119 builders-workshop-material-yard,
  #97 wall-gate-portcullis, the marketplace-square sprite and the merchant caravan).
