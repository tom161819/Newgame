# King skill points from Royal tasks (m-kral-odmeny-xp)

## What and why

Owner request 39: rewards from the Royal tasks should also grow the King. Every finished Royal task now gives the King
skill points (1–3 by difficulty, stored in the goal data). The feed says "The King earned 2 skill points." (en + cs).
The King panel (Unit panel opened on the King) has a new Skills part: free points, two new royal skills and a + button
on every skill row.

- Ordinary King skills (all SkillSystem skills, Combat included): 1 point = 1 level, up to the skill's max level.
- Leadership (0–5): residents within the King's current sight work +3 % faster per level.
- Stewardship (0–5): tax yield +4 % per level; Happiness of the tax rate is unchanged.
- Each + button's tooltip (title / aria-label) states the exact bonus. The Royal tasks card lists the points with the
  resource reward.

## Files and systems

- `src/data/kingSkills.js` (new): `KING_SKILLS` (max levels, +3 % / +4 % per level), point cost.
- `src/data/royalGoals.js`: `skillPoints` per goal (houses3 1, pop10 1, bread 1, pop20 2, wall 2, gold100 2,
  warehouse 2, barracks 3; 14 in total).
- `src/systems/KingSkills.js` (new): points, royal levels, `spend(id)`, `workModifier(actor)`, `taxMultiplier()`,
  export/import, `validKingSkillState`. Subscribes to RoyalGoals `completed` events.
- `src/systems/SkillSystem.js`: `workEfficiency` multiplies by `scene.kingSkills?.workModifier(actor)`.
- `src/systems/PolicySystem.js`: `dailyTaxes` multiplies by `scene.kingSkills?.taxMultiplier()`.
- `src/systems/GameStateSerializer.js` / `GameStateLoader.js`: optional `kingSkills` save field, export, validation, import.
- `src/game/GameScene.js`: creates and destroys `KingSkills` next to `RoyalGoals` (one-line edits).
- `src/ui/KingSkillsSection.js` (new) and `src/ui/UnitPanel.js` (3 small hooks); `src/ui/RoyalGoalsPanel.js` (reward text).
- `src/i18n/en.js`, `cs.js`: one block of `kingSkills.*` keys and `goals.res.points` at the end of each file.
- `src/style.css`: a few lines at the end for the extra + column.
- `tests/king-xp.test.js`, `scripts/king-xp-smoke.mjs` (registered as `--king-xp` in `scripts/browser-smoke.mjs`).

## Implementation decisions

- One point = one level of an ordinary skill (SkillSystem counts levels with a growing XP curve, so a fixed XP amount
  would be worth less and less). XP already gathered towards the next level is kept; `xpToNextLevel` and `totalXP` are
  recomputed so the saved skill stays valid. Max level is respected; Combat's attack modifier refreshes at once.
- Points come only from the `completed` event of RoyalGoals, so a pre-E4 save that marks met tasks silently gives none.
- Leadership uses the same circle as the fog of war (`visibilityProfile`, tower/wall/horse included, night shrink via
  `fog.sightScale`), cached per game-time stamp so the per-worker check is cheap. It applies to residents in
  `workerSystem.workers` only, never to the King, and not when the King is dead. Because it sits in
  `workEfficiency`, it covers every work that uses it (mining, forestry, farming, fishing, production, construction,
  stables); Barracks training (workFactor only) is not affected.
- Stewardship multiplies the tax amount in `dailyTaxes`, so the economy preview and the collected Gold agree.
- Spending is allowed while paused.

## Save/Load impact

SAVE_VERSION stays 58. New optional top-level field `kingSkills: {points, leadership, stewardship}`. Strict validation:
exactly these keys, safe non-negative integers, royal levels ≤ 5, and `points + leadership + stewardship` ≤ the points
of the finished tasks in `royalGoals.done` (missing `royalGoals` counts as none). A save without the field loads with
0 points / 0 levels. Bought ordinary levels live in the King's own `player.skills` (already saved and validated).

## Testing

- `node --test tests/king-xp.test.js`: 6 tests (data and texts, points from a finished task and feed line incl.
  Czech plural, spending and refusals, Leadership only in sight and not for the King, Stewardship +20 % at level 5
  incl. collected Gold, Save/Load round-trip and 8 corrupted variants rejected).
- `npm test`: all pass (1053 tests).
- `npm run build -- --base=/Newgame/`: OK.
- Browser smoke `npm run smoke -- --king-xp` is written but was NOT run (another agent's smokes were running).

## Notes for the next agent

- Run `npm run smoke -- --king-xp` once (not run yet); it opens the King panel, checks the tooltips (+3 % / +4 %),
  spends a Leadership and a Combat point and checks the snapshot.
- Ordinary skill points are not tracked separately, so the save check bounds only unspent + royal points by what
  the tasks gave.
- The tax policy text (`policy.taxEffect`) still shows the base Gold per resident; the total already includes
  Stewardship. If the owner wants it explicit, add the bonus to that line.
