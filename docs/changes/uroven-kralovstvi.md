# Kingdom rank and buildings unlocked by the Castle level

## What and why
Owner 21 Nov 2026: the HUD's second row (the free middle) shows "Kingdom: Settlement · 2/5" – the kingdom's rank by
the Castle level (Settlement → Village → Small town → Town) and how many conditions for the next rank are met. For
Settlement → Village: a Granary, a Material Yard, Happiness at least 70 %, food for 10 days and 8 built buildings.
Conditions for the later ranks come later. The owner's table gives the Castle level at which each building unlocks.

## Files and systems
- `src/data/kingdomRank.js` (new): `KINGDOM_RANKS`, `BUILDING_UNLOCK_LEVEL` (owner's table; buildings missing in it
  got a provisional level: stakes 1, flax field 2, fountain 3, moat 3, old 1 × 1 gate 3, catapult and ram sites 3,
  weaver 3, tailor 3), `RANK_REQUIREMENTS`, `kingdomLevel`, `rankRequirements`, `kingdomRank`.
- `src/game/kingdomRankState.js` (new): the live numbers (average Happiness as in the overview, food days) and the
  condition lines.
- `BuildingUnlockManager`: a building above the kingdom level is locked ("Needs Castle level 2 (Village)") when the
  scene has `kingdomRanks` (set in `GameScene`); sandbox stays free. The pure `buildingUnlockStatus` gates only with
  `{ranks:true}`.
- `castleUpgrade.js`: the upgrade to the next level is refused until all conditions of the next rank are met (the
  Castle window shows which are missing).
- `walls.js`: `wallLinePlan` passes the unlock manager (walls are level 3).
- `src/ui/KingdomRankDisplay.js` (new), `#kingdom-rank` in `index.html`, CSS, en/cs texts.

## Implementation decisions
- The kingdom level is the highest complete Castle's level; without a Castle level 1. A Castle being upgraded keeps
  its old level until the work is done.
- "Buildings" counts complete buildings without paving, walls, stakes, moat, lights, campfires and ruins.
- Existing buildings above the level stay; only new placement is locked.

## Save/Load impact
None (everything is derived from the buildings).

## Testing
- `tests/kingdom-rank.test.js` (table, level, conditions, locking, blocked upgrade, labels); `npm test`.
- Browser: new game – "Kingdom: Settlement · 2/5" in the middle of the second HUD row, the hover panel lists the five
  conditions, the building menu shows level-2+ buildings locked with "Needs Castle level 2 (Village)".

## Notes for the next agent
- The owner will add conditions for Village → Small town → Town: fill `RANK_REQUIREMENTS[3]` and `[4]`.
- The provisional unlock levels (see above) wait for the owner's confirmation.
- Royal Goals still include the Wall and Barracks (level 3); they become reachable with the Castle level.
