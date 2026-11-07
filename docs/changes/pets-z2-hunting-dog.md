# Domestic animals Z2 – hunting dog (0.27.0)

## What and why
Plan task m-zvirata-z2-lovecky-pes. Hunters get a companion: a dog that follows them, finds game and makes hunting more productive. It is the second step of the domestic animals series after Z1 (rats and cats, 0.26.0).

## Files and systems
- `src/data/domesticAnimals.js` – `DOGS` (HP 60, heals in 1 day, follow distance 1.4, bonus range 3 tiles, tracking radius 8, speed ×1.3, damage ×1.5, taming 20 % + 8 % per hunting level up to 90 %, strays every ~6 days 5–10 tiles from the castle staying 2–3 days, caravan dog chance 1/3, price 120 Gold, names), `tameChance(level)`.
- `src/systems/DomesticAnimalSystem.js` – dogs: `updateDogs`, strays, caravan escort dog (`dogForSale`, `buyDog`), taming (`startTaming` → the dog walks to the Hunter → one `tryTame`), `assignDog`, tracking (`tracks`, `tracked`), `shield` (the dog takes an animal's attack aimed at its Hunter), injury/healing, export/import.
- `src/systems/movement.js` – `actor.speedFactor`; `src/systems/CombatSystem.js` – `attacker.damageFactor` and the optional `shield` hook (set by GameScene).
- `src/systems/WorkerAI.js` – a Hunter's target search also accepts animals his dog tracks.
- `src/game/DomesticViews.js` – `drawDog` (lying down when injured); `src/scenes/GameScene.js` – tracked animals are drawn faintly (alpha .35) under the fog, a click on a dog opens its panel.
- `src/ui/CatPanel.js` – dog modes (`dog`, `buyDog`), Hunter choice with the taming chance; `MarketplacePanel` "Buy a dog"; `UnitPanel` "Hunting dog: …"; i18n `pets.dog.*` (en, cs).
- `src/game/serializer.js` – SAVE_VERSION 53.
- Tests `tests/hunting-dog.test.js`; smoke `scripts/dog-smoke.mjs` (`npm run smoke -- --current-only --dog`, part of `--full`).

## Implementation decisions
- Bonus size: the task asked for "noticeably more meat". With speed ×1.3 and damage ×1.5 a deer (HP 40) or boar (HP 70) falls in roughly a third fewer hits and the walks are shorter; together with tracking under fog this is estimated at about +30 % meat a day. It is an estimate from the stats, not a measured full simulation – worth checking in balance work.
- Taming is simplified: one attempt per dog per Hunter command; the dog walks to the Hunter and the dice are rolled when they meet. A failed attempt leaves the dog stray (it can be tried again). Success gives the Hunter 20 XP in hunting.
- The caravan dog is an escort that the merchant sells; it leaves with the caravan if not bought.
- The shield applies only to attacks by animals (not by enemy soldiers), so the dog is not a combat unit.
- A dog without a Hunter (profession changed, Hunter died) becomes unassigned and stays near the castle until assigned again.

## Save/Load impact
SAVE_VERSION 53. `domestic.dogs`, `nextDogAt`, `caravanDog` are saved; older saves load with no dogs and a stray scheduled normally. The validator checks that a dog's `hunterId` refers to an existing worker (otherwise the dog becomes unassigned).

## Testing
`npm test` (922 tests, including 6 in hunting-dog.test.js: taming chance, taming and XP, follow and bonus, shield and injury/healing, caravan purchase, save/load). Smokes `--dog` and `--pets` pass in the browser.

## Notes for the next agent
- Dog art is provisional (drawn shapes in DomesticViews); it waits for the Grafika task g-domaci-zvirata-grafika.
- The +30 % meat estimate should be verified once there is a balance simulation of hunting.
