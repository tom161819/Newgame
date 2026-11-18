# Battle-test proposals, part A: retreat, chase, alarm, Catapult supply, no razing, Test-map food (0.146.4)

## What and why
Owner 18 Nov 2026: "ok udělej všechny návrhy oprav z testu" (project document `claude/test-bitev-0.146.md`). This is the first of four parts: points 1, 4, 6, 7 and 11.

- **Point 1 – retreat and chase.** A wounded soldier (under 25 % HP) used to run straight away from the enemy to the edge of the map with the enemy behind him. He now falls back behind a healthy comrade as before, else to his refuge – his Barracks or the Castle (`MilitarySystem.refuge`) – and within `refugeRadius` of it, or with no refuge after `retreatMax` tiles, he stands and fights again. Enemy guards (animals with `guardRadius`) remember their `post`; a chase ends `chaseRadius` (default twice the guard radius) from it unless somebody is hitting them, and with nobody left to fight they walk back (`returning`), taking on only people inside their chase radius on the way.
- **Point 4 – Catapult.** Damage 60 → 100 a Stone (two Stones a wall piece). The Stones left show over the Catapult (red when empty). An empty Catapult tells the player once (status and event feed with the place). A free Military Wagon with no Stones drives to the nearest store holding Stone when a Catapult near it is short, loads there and comes back.
- **Point 6 – no razing.** Soldiers no longer attack enemy buildings by themselves and a Catapult bombards by itself only while the fight is on (`SiegeSystem.contested`: a living enemy unit within 25 tiles of the building). A building is hit on the player's order or broken through to an enemy behind it (0.146.2). This replaces the automatic wall attack of 0.145.0.
- **Point 7 – alarm.** `AlarmSystem` (new): a resident who is not a soldier with a hostile unit in sight within 9 tiles drops his work, runs into his House or the Castle and hides (`sleepingIn`, as in sleep) until no enemy has been near for 6 s; with no shelter he runs away. Enemies do not target people inside. One event-feed line a minute.
- **Point 11.** On the Test map `FoodSystem.eat` always succeeds, so nobody is hungry.

## Files and systems
`src/systems/AlarmSystem.js` (new), `AnimalSystem` (post, leash, returning, sheltered people), `MilitarySystem` (retreat, `refuge`, `onDuty`, `holding`), `SiegeSystem` (`contested`, no automatic siege), `SiegeEngines` (label, empty notice, Wagon fetching), `WorkerAI`/`WorkerSystem` (alarm hook, hidden while the alarm lasts), `FoodSystem` (sandbox), `GameScene` (creates the alarm), data and i18n.

## Implementation decisions
Runtime fields only (`worker.alarm`, `retreatFrom`, `emptyTold`, `wagonFetch`; `animal.post`, `returning`). `animal.marching` is reserved for the enemy army of part D (no leash while marching).

## Save/Load impact
None. A game saved while people hide loads with them outside; the alarm sends them back in if the enemy is still there.

## Testing
`tests/battle-fixes.test.js` (retreat to the Castle and the enemy walking back; retreat without a refuge; alarm; empty Catapult and the Wagon fetching Stones; Test-map food). `tests/siege*.test.js` updated to the new rule (no automatic attack on buildings). Headless scenarios: ten Swordsmen against fourteen enemy Knights with a Castle 20 tiles away – the survivors stand by the Castle and heal, the enemy returns; six residents and three enemy Recruits – all six hide and live (before: all dead in 30 s). Browser: siege on the Test map, the fort stays standing after the defenders fall.

## Notes for the next agent
Enemies that lose their targets hover at their post; if it is near the village, people run in and out. The remaining proposals (attack-move, guard shifts, night, enemy Gate; archers in sieges and balance; the enemy army) follow in parts B–D.
