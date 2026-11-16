# Combat review: stances, groups, battle bar, damage numbers, spacing, retreat (0.142.5)

## What and why
Owner 16 Nov 2026 agreed to all eight combat proposals from the 20-v-20 test: spacing, stances, enemy marking, battle summary, damage numbers and arrows, archers keep range / swordsmen ahead, retreat when badly hurt, number-key groups.

## Files and systems
- `src/game/combatSpacing.js` (new): `freeAround` (adjacent tiles no other fighter takes), `awayFrom`, `isHostile`.
- `MilitarySystem.updateSoldier`: `STANCES` (aggressive/defensive/hold: engage, follow, leash, hold, retreat), retreat below `retreatBelow` to the nearest healthy comrade until `retreatUntil`, archers pick the nearest enemy in reach and kite when touched, melee approach via `freeAround`, attack order area (`worker.attackArea`, `orderRadius` 12) so the group clears the enemies around it; `threat` centre for garrison units = the soldier himself.
- `AnimalSystem`: guards (bandits, rats) approach via `freeAround`.
- `UnitCommands.move`: archers 2 tiles behind, armoured melee 1 tile ahead (along the move direction).
- `UnitSelection`: stance buttons; Shift+1–9 / 1–9 groups (`setSquad` in `armySquads.js`, the existing saved `worker.squad`), capture listener ahead of the speed keys; the attack order stores `attackArea`.
- `CombatFeedback`: damage numbers (summed, ~2/s), arrows of archers, red enemy rings, battle bar `#battle-panel` and the end-of-battle feed line.
- `BanditView`: charcoal tunic, black hood, green sash.
- Save: optional `worker.stance` ('defensive'|'hold', soldiers only), validated and loaded; zone records carry it.

## Implementation decisions
Groups reuse Army squads (already saved) – a group is squad N. Ctrl+number cannot be used (browser tabs). Battle bar shows from three combatants.

## Save/Load impact
SAVE_VERSION unchanged; optional `stance` on soldiers.

## Testing
tests/combat-review.test.js; full suite; browser 20 v 20 three runs won with 14–19 left and no stalemate (before the attack-area rule one run stalled with 3 bandits untouched), screenshots of the battle bar, numbers and rings; stance + group survive save/load.

## Notes for the next agent
Real FPS with 40 fighters is not measured (headless browser). Formation paths (leader-follow) are still open.
