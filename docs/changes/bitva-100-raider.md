# War groundwork: attack on an enemy group, Raider, Dev test battle 100 v 100 (0.142.6)

## What and why
Owner 16 Nov 2026: "a battle 100 v 100 – is it realistic?", then "we count on war, attacks of other armies and sieges; go ahead". The 100 v 100 test showed the logic is cheap (3–10 ms per 50 ms step) but only 4–10 soldiers fought at once.

## Files and systems
- `MilitarySystem.enemyGroup` (hostile animals linked within `groupLink` 5) and `orderAttack` (each soldier the nearest enemy with fewer than `crowd` melee fighters; `attackArea` = group middle, `attackRadius` = group size + 6); after a kill the soldier prefers an uncrowded enemy. `UnitSelection` right-click on an enemy uses `orderAttack`.
- New animal `raider` (renderer `raider`, `RaiderView` = `BanditView` with a palette), zone-only like the bandit.
- `src/systems/devBattle.js`: `startDevBattle(scene, 100)` (open area away from the Castle, our mix as group 9, attack order, FPS meter on), `clearDevBattle`. Dev tool actions `battle`, `battleClear`.
- `CombatFeedback`: battle bar side fix; damage numbers on screen only, max 40.
- Retreat no longer writes to the event feed.

## Implementation decisions
Raiders are animals with the guard rule (like bandits) – enough to test armies; a real enemy army with orders, sieges and castles is the next war step.

## Save/Load impact
None (Raiders saved like other animals if a save is made during the test).

## Testing
tests/combat-review.test.js (group, spread); browser: Dev test battle 100 v 100 – up to 26 of ours fighting at once (before 4–10), won with 71–75 left in ~75 game s, battle bar correct, clear removes the rest. The headless browser shows 2 FPS (software rendering) – the real FPS must be read on the owner's computer.

## Notes for the next agent
Next: the owner's test map (sandbox) from the main menu.
