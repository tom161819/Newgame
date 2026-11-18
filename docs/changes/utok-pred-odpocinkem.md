# Attack orders before the soldiers' morning rest (0.146.1)

## What and why
Owner 18 Nov 2026: "s vojáky nejde zaútočit na hradby, katapult když kliknu na útok na hradby a jsem dál, tak místo toho aby se přiblížil a začal střílet, tak začne odjíždět." Reproduced on the Test map on day 2: from day 2 soldiers sleep in the first third of the day (after the night watch, `isSoldierRestTime`). `WorkerAI` ran that rest before the soldier's military behaviour, and an attack or siege order calls `commands.resume`, which makes the soldier eligible for rest again. So in the morning the ordered men – and the Catapult crew with the Catapult – walked to the Castle and slept. A Barracks soldier also walked to his Barracks first after every order (`workplaceReached` is cleared by `resume`).

## Files and systems
- `MilitarySystem.hasOrder` / `onDuty` (new): a soldier is on duty with an order (siege target, hunted enemy, attack area, scouting, caravan escort, a running attack), when he is attacked, when an enemy in sight is within `guardRadius`, when a Catapult crew has an enemy building in range or a melee soldier one within `SIEGE_RULES.autoRadius`. Test-map units (`worker.sandbox`) are always on duty. The look-around part is cached for `MILITARY_RULES.dutyCheck` (500 ms) in the runtime field `worker.dutyCheck`.
- `DailyRest.eligible`: a soldier on duty is not eligible (a resting one is woken by `update`).
- `WorkerAI.update`: a soldier on duty runs `military.updateSoldier` right after manual orders and wall posts – before transport, rest and the walk to the workplace.
- `UnitCommands.selectable`: a sleeping soldier can be selected (Army panel, group keys); an order wakes him.

## Implementation decisions
The rest rule itself stays (soldiers still sleep in the morning when nothing happens). An enemy near a sleeping soldier wakes him now – before, the garrison slept through a morning attack unless it was hit.

## Save/Load impact
None (`dutyCheck` is a runtime field and is not saved).

## Testing
`tests/siege.test.js`: three new tests (order to a sleeping soldier in the morning of day 2; attack order and an enemy near a sleeper; Barracks soldier goes straight at the wall, a Catapult 30 tiles away rolls into range and bombards). They fail without the fix. Browser, Test map, day 2 morning: nine melee soldiers and a Catapult ordered at an enemy wall attack it (before: all walked into the Castle).

## Notes for the next agent
`onDuty` is the place to add new kinds of orders; anything that should keep a soldier awake and off the walk to his Barracks goes there.
