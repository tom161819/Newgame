# Owner's points 33–36: stumps on paths, closed walls, ruins inside, soldiers on walls

## What and why
Owner's list, 14 Nov 2026: (33) stumps on a trodden path vanish in time; (34) closed walls give a Safety bonus to buildings and residents inside; (35) Burnt Ruins inside the castle lower the Attractiveness; (36) soldiers can be sent onto walls, Towers and Gates. Point 37 (a Tower looks dimmed next to walls) could not be reproduced and waits for a screenshot.

## Files and systems
- 33: src/data/naturalResources.js (`stumpRotDays`, `stumpGone`), NaturalResourcesSystem (optional `natural.rot`), TreeView.
- 34, 35: src/game/enclosure.js (`enclosure`, `ruinsPenalty`, `ENCLOSURE`), NeedsSystem.safetyDetail (factor `walls`), KingdomAttractivenessSystem (`ruins`), KingdomOverview.
- 36: src/systems/WallPatrol.js (`postTiles`, `post`, `wallPatrol.post`), src/ui/UnitSelection.js (right click), serializer and loader.
- tests/owner-14-nov.test.js, tests/forestry-workers.test.js, tests/military-units.test.js.

## Implementation decisions
- A rotted stump is only hidden (`rot` ≥ 3 days at stage 0), not removed: tree objects are never deleted in the game and saves index them. When the path fades below level 2 the stump is back.
- "Inside the walls": ground not reachable from the map edge without crossing a finished Stone Wall, Tower or Gate (flood fill, cached by the set of wall pieces). Other buildings and water do not close a ring.
- Safety +15 when the resident's position, workplace or home is inside.
- Post: a wall piece (several soldiers take the neighbouring pieces), a Tower (first soldier on the platform, the rest on the walls beside it), a Gate (the walls beside it). Reached through the existing wall stops; "Patrol – walls" or any other Army order ends it. A post is saved as `wallPatrol:{post:{x,y,tower?}}`.

## Save/Load impact
Optional `natural.rot` on trees and `wallPatrol.post` on soldiers. SAVE_VERSION stays 62.

## Testing
Unit tests for all four points; full suite. No browser test of the right click.

## Notes for the next agent
Also carries the corrected text of docs/changes/deploy-renders-14-nov.md (the Lumberjack Hut picture stayed graded).
