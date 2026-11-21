# Defence and attack 7: hit reaction, parry, dodge

## What and why
Owner 20 Nov 2026: "zpracuj postupně všechny ty návrhy na obranu / útok". Point 7 (last) of `claude/obrana-utok-plan.md`.

## Files and systems
- `src/data/military.js` `DEFENSE_MOVES`: parry for Knights and Swordsmen (ours and the enemy's) 15 % of melee damage,
  dodge for Archers, Royal Archers, Crossbowmen, Light Cavalry and enemy Archers 12 %; pictures at most every 1.6 s,
  a flinch at most every 0.6 s.
- `src/systems/MilitarySystem.js`: `defenseMove(unit)`; `orderFactor` takes the parry or dodge share off melee damage.
- `src/ui/CombatFeedback.js` `react`: on a hit the figure's picture flinches 3 px away from the blow; a parry draws a
  yellow spark at the shield side, a dodge a quick 6 px sidestep. Only the picture moves (tweens on `view.art`).
  `GameScene` passes the attacker to `combatFeedback.hit`.
- Tests: `tests/battle-orders.test.js` (new test, two adjusted for the parry and dodge shares).

## Implementation decisions
- Combat is continuous damage per second, so parry and dodge are damage shares; the spark and sidestep show them now
  and then. No new rendered frames: the existing block frames of the Knight stay as they are; proper hit-reaction
  frames can come with the owner's models.

## Save/Load impact
None.

## Testing
- `npm test`.
- Browser, Test map: 6 Swordsmen against 10 enemy Recruits, no errors; the morale and routing still work.

## Notes for the next agent
- Rendered hit-reaction and dodge frames (render-soldier.py) would replace the code tweens.
