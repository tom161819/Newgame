# Kingdom rank: conditions for levels 3 and 4

## What and why
Owner, 21 Nov 2026: "přidej zatím tyhle podmínky pro přechod na další lvl hradu".

His list:
- Level 2 → 3: 2 Farmhouses, 8 fields, food for 10 days, 20 buildings built, Village Green, Marketplace, 20 soldiers.
- Level 3 → 4: closed walls (a Tower and a Gate count too) around at least 50 % of your buildings, 40 soldiers.

Two points were decided with the owner:
- **Soldiers only for level 4.** The Barracks unlock at Castle level 3, so 20 soldiers could not be met at level 2. The owner chose to drop that condition from level 3.
- **Fields** are wheat fields, flax fields and orchards together.

The resident conditions from before stay (50 for level 3, 80 for level 4).

## Files and systems
- `src/data/kingdomRank.js`
  - `RANK_REQUIREMENTS` for levels 3 and 4.
  - New condition kinds:
    - `count`: complete buildings of one type;
    - `fields`: complete buildings of several types together;
    - `soldiers`;
    - `walled`.
- `src/game/kingdomRankState.js`: `kingdomRankStats` also returns
  - `soldiers`: living residents with the soldier profession, recruits included;
  - `walled`: the share of counted buildings inside closed walls, from `game/enclosure.js`.
- `src/i18n/en.js`, `cs.js`: `kingdom.req.count`, `fields`, `soldiers`, `walled`.
- `tests/kingdom-rank.test.js`.

## Implementation decisions
- "Your buildings" for the wall share are the buildings the rank counts: no Castle, paving, walls, field defences, lights or ruins. Towers and Gates are also left out, because they are part of the ring.
- The share is rounded down, so 49.9 % is not enough.
- A building is inside when its middle is, as in the Safety bonus.

## Save/Load impact
None. The conditions are computed from the world.

## Testing
- `npm test`.

## Notes for the next agent
The Castle upgrade and the HUD read the same list, so a new condition kind needs a line in `rankRequirements` and an i18n key `kingdom.req.<kind>`.
