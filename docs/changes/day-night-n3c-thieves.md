# Day and night N3c: thieves

## What and why
Third part of plan item `m-noc-n3-hrozby` (brief `zadani-den-noc.md`, N3, "Zloději"). Thieves make dark stores and
an unhappy kingdom a real risk, and give the night watch with torches a job.

## Files and systems
- `src/data/nightThreats.js` `thieves`:
  - max chance 0.3; happy at 60, unhappy at 25;
  - gold 10–30, goods 10–20;
  - spawn 24+ tiles from the target at the edge;
  - catch range 1.5; repath 500 ms; escape within 90 s.
- `src/systems/NightThreatSystem.js`:
  - `thiefTargets()`: stores with goods and the castle with Gold, without a burning light within 6 tiles
    (`dayNight.darkAt`);
  - `thiefChance()`: 0 without a dark target, otherwise `0.3 × (0.25 + 0.75 × unhappiness)`, halved at Happiness 60
    or more;
  - `spawnThief(day)`: one roll per night; the thief is a visitor (`isSubject:false`), not a resident;
  - `updateThieves(delta)`: sneak to the store, `steal` (stores: the most plentiful goods via `withdraw` with ledger
    'Theft'; castle: `inventory.spend('gold', …, 'Theft')`), escape to the edge;
  - `spotter()`: a soldier within his sight (`baseSight/2 × dayNight.sightFactor`, so a third outside light, full in
    light or with a torch);
  - flee and `pursue(worker)`, called from `WorkerAI.update`: the soldier chases;
  - `caught()`: goods dropped (Haulers bring them back), Gold returned with ledger 'Recovered from Thief';
  - `reportMorning()`: one notice per theft that got away.
  - Save: `thiefDay`, `thieves`, `reports` (optional, schema 57).
- `src/game/GameScene.js`: `nightThreats.update(activeDelta)`.
- Texts in both languages. Tests in `tests/night-threats.test.js`. Smoke `scripts/thieves-smoke.mjs` (`--thieves`).

## Implementation decisions
- **The thief is a visitor worker:**
  - it uses the human figure and movement, and its work state stays among the saved states (`Moving to Target`);
  - the AI does not run for visitors, so the threat system leads him;
  - he is removed (not killed) when he escapes or is caught, so he never counts as a death.
- **The loot is kept in the threat state,** not as the thief's cargo, because visitors must not carry cargo in a save.
- **Only soldiers catch him,** as the brief says ("voják/hlídka"). The night sight rule makes light and hand torches
  matter.
- **Not done:** the thief's own art (sneaking, a sack) comes with `g-noc-grafika`. He uses the villager look.

## Save/Load impact
New optional fields in `nightThreats` (`thiefDay`, `thieves`, `reports`). SAVE_VERSION stays 57, and saves from 0.43.0
and 0.44.0 load.

## Testing
- `npm test` (985 pass), new tests:
  - no chance with lit stores; 30 % when unhappy and dark; small when happy;
  - steal from a store; a soldier with a torch sees, chases and catches; the goods are dropped;
  - a thief who escapes is reported in the morning; switched off = none;
  - save in the middle of a theft.
- `npm run smoke -- --current-only --thieves`: a thief steals from a dark store and a soldier with a torch catches him.

## Notes for the next agent
- Fires (N3d) remain in `m-noc-n3-hrozby`. A fire should also call `dayNight.attention()` (e.g. via a
  `nightThreats.fireActive` flag in the GameScene attention function).
