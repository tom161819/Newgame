# Combat: garrison soldiers obey, soldiers fight on, red enemy bars (0.142.4)

## What and why
Owner 16 Nov 2026: "test how combat works, what could be clearer and more playable, then try 20 against 20". Test (20 soldiers – soldier/archer/swordsman – against 20 bandits, attack order on one bandit): 19 of 20 soldiers stood still for the whole fight and the army was beaten one by one.

## Files and systems
- `WorkerAI.step`: a soldier with a military unit but no workplace (garrison: starting garrison, scouting party) goes to `MilitarySystem.updateSoldier` instead of "Waiting for workplace" (which returned before any military logic).
- `MilitarySystem.updateSoldier`: when the hunted enemy dies the soldier takes the nearest enemy within `followRadius` 10; a melee soldier whose target has `crowd` 3 attackers takes a free enemy within `spreadRadius` 6; with no target an enemy within `engageRadius` 5 is fought. `nearestEnemy`, `attackers`. `threat` guard centre: Barracks, else the soldier in a zone, else the Castle for a garrison unit.
- `CombatFeedback.refresh`: enemy health bars red, own green; the "is a target" check uses one Set per refresh.
- `MILITARY_RULES`: followRadius, spreadRadius, crowd, engageRadius.

## Implementation decisions
Enemies are wolves and animals with `gameplay.hostile` (bandit, cave rat), the same rule as the attack cursor.

## Save/Load impact
None.

## Testing
Unit tests; browser battle script (`simulationStep`): before 20 v 20 – army idle (1 fighting), after – all engaged, 20 v 20 won with 11–14 left in ~18 game s; 6 v 6 won with 5 left.

## Notes for the next agent
Proposals sent to the owner (unit spacing in melee, stances, enemy outline, battle summary, formations, archer targeting). The headless browser cannot measure real FPS.
