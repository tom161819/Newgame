# Owner 18 Nov 2026 – Catapult, Military Wagon, automatic wall attacks, workshop stock limit

## What and why
The owner asked (18 Nov 2026): melee units nearby attack walls when no enemy is there, otherwise soldiers first; a Catapult made in the Builder's Workshop; a Military Wagon unit (one Horse Wagon and a Recruit) carrying food, Torches for the army and Stones for the Catapult; and in the craftsmen's building menu "make up to X in storage".

## Files and systems
- `src/systems/SiegeEngines.js` (new, `military.engines`): Catapult site order, finished site → `catapult` vehicle (`convertFinished`, called by `VehicleSystem.update`), crew behaviour (fetch the vehicle, bombard, approach an ordered target), Wagon loading/supply, `meal` (hooked into `FoodSystem.eat`) and `torch` (hooked into `LightFuelSystem.takeTorch`).
- `src/data/military.js`: unit types `catapult` and `military_wagon` (`vehicle`, `speedFactor`, no kit), `CATAPULT`, `WAGON_SUPPLY`. `src/data/objects/vehicles.js`: `catapult_site` (buildable false, placed with a buildable copy) and `catapult`.
- `MilitarySystem`: vehicle blocker (`vehicle_<type>`), reservation at `train`, release at cancel/discharge/death, an empty kit trains at once, crews never fight (`engines.update`), `holding()` for soldiers standing on a move order (called from `UnitCommands.update`).
- `SiegeSystem`: `near()` and automatic sieges (`autoRadius` 4) when the caller found no enemy unit; `canSiege` excludes crews; `order` also gives Catapult crews the target.
- `VehicleSystem`: `crew` vehicles follow their soldier and are never parked by the Hauler rules. Save check accepts `crew`, `ammo` (Catapult), `supplies` (Wagon) and a soldier operator of the matching unit type.
- `FoodProductionSystem`: `stockLimit` per record, `atStockLimit` blocks new cycles (also in `update` before a cycle starts); `WorkplacePanel` row `#stock-limit-row`. Validation in `FoodStateValidation`.
- UI: Builder's Workshop panel section `#builder-workshop-engines`, Barracks cards show free vehicles, Test panel offers both new units (spawned with a full vehicle), Catapult texture in `VehicleViews`.

## Implementation decisions
The Catapult is built through the normal construction pipeline (a 2×2 site) instead of a workshop recipe, because Builders are not workplace workers. Vehicles keep their state (Stones, load) on the vehicle object so a crew change keeps them. Food from the Wagon is eaten before the kingdom's stores; the stores stay the fallback. The Catapult also refills from a store it stands beside.

## Save/Load impact
SAVE_VERSION 64 → 65 (vehicle fields `crew`, `ammo`, `supplies`; production record `stockLimit`). MINOR release. The test fixture's schema number was bumped as in earlier bumps.

## Testing
`tests/siege-engines.test.js` (auto siege with enemy priority; site → Catapult → crew training → bombarding, Save/Load round trip; Wagon supply, meal and torch; stock limit; workshop order and Test map). A manual simulation confirmed Builders and Haulers build an ordered Catapult in ~34 s. Full `npm test` passes.

## Notes for the next agent
Enemy soldiers still do not attack our buildings and there are no enemy Catapults. The Catapult and Wagon look is procedural / the Horse Wagon art; owner art can replace it in `VehicleViews`. Crew units show the plain soldier look (STAND_IN_LOOKS).
