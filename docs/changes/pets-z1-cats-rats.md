# Domestic animals Z1: rats and cats (plan m-zvirata-z1-kocky-krysy, 7 Nov 2026)

## What and why
Brief `zadani-domaci-zvirata.md`, Z1, approved by the owner on 7 Nov. Rats breed in every store that holds food and eat part of it. Cats keep them down, but the player has to get them: a stray cat to take in, a cat bought from a caravan (30 Gold), or a kitten. A cat living in a house gives its residents +3 happiness.

## Files and systems
- `src/data/domesticAnimals.js`: `RATS` (growth, decay, levels, daily losses 1/3/6 %, which goods go first, the ledger source "Rats") and `CATS` (catch 25 rats a day, 120 food per cat, +3 at home, strays, price 30, which merchants sell cats, kittens, names). `ratLevel()`.
- `src/systems/DomesticAnimalSystem.js` (new):
  - rats per food location: growth, losses through `FoodStorageSystem.withdraw` (free stock only) and the ledger;
  - event-feed messages for Many and Infestation;
  - cats: wandering around home, walking to a new home;
  - strays: spawning and leaving; `assign` (Take in / Reassign); kittens and the cap;
  - caravan cats with `buyCat`;
  - `status()` for panels, `catAtHome()`, save export and import, `validateDomesticState()`.
- `src/game/DomesticViews.js` (new): provisional drawings of cats (5 coat colours, facing, walk, smaller kittens) and of 1–5 rats around a store, hidden outside sight.
- `src/ui/CatPanel.js`, `index.html`, `src/style.css`: the cat panel and the home chooser for a bought cat.
  - The cat panel shows the name and where it lives, or the stray's days left. It lists the homes (worst rats first), each with its rat level or "house (+3 happiness)" and the number of cats there.
- `src/game/GameScene.js`:
  - the system updates in `simulationStep` (so it runs during the background catch-up);
  - views refresh in `refreshVisibility`;
  - clicking a cat opens its panel.
- `src/ui/StoragePanel.js`: a rats line in food stores (level, food lost a day, cats / needed).
- `src/ui/MarketplacePanel.js`: "Buy a cat (30 Gold, N left)" in the trade window when the caravan has one.
- `src/systems/NeedsSystem.js`, `src/ui/NeedsDisplay.js`: "Cat at home: +3".
- `src/systems/GameStateSerializer.js` / `GameStateLoader.js`: `SAVE_VERSION` 52, `domestic` saved and validated.
- i18n en/cs (`pets.*`, `needs.catLine`).
- Tests:
  - `tests/domestic-animals.test.js` (6);
  - `scripts/pets-smoke.mjs` (`--pets`): Many rats, a stray clicked and taken in, rats fall, storage line.

## Implementation decisions
- **Where rats live.** In every location that can hold food:
  - the Granary and the Starter Stockpile (stock);
  - food buildings' input and output buffers.
  - Not in a Warehouse with only materials, nor the Marketplace (goods space for trade).
- **Growth.** `1.5 + 5.3 × fill` per day without a cat (fill = food stored / capacity). A full Granary reaches Many on day 6 and an Infestation on day 11 (tested). A store without food loses 6 a day.
- **Losses.** Food stored × the level's daily share (1 %, 3 % or 6 %), added up continuously; whole units leave when a share adds up to one.
  - Order: wheat, flour, apple, bread, meat, fish.
  - Only free stock is eaten: reservations (orders, hauling, recipes) are never touched, so stock cannot go negative.
  - Each lost unit is a ledger expense with source "Rats". Happiness changes only through less food, as the brief says.
- **Cats.**
  - One cat clears 25 rats a day while it is at home (not while walking there).
  - A store needs one cat per 120 food of capacity. With fewer cats than needed, growth is halved and nothing is cleared.
  - The Starter Stockpile mixes food with materials, so there only the food stored counts. Otherwise a stockpile with 40 bread would need two cats.
  - Cats walk straight lines (they can hop over things), about 3 tiles around their home, and never use the pathfinder.
- **Strays.**
  - The interval is 4 days on average (2 when a store has Many rats), drawn between 0.6× and 1.4×.
  - A stray appears 15–25 tiles from the castle on walkable ground, at most one at a time, and leaves after 2 days towards the map edge.
- **Take in.** It always works and the cat walks to its new home. Any cat can be reassigned from its panel, and a house takes one cat.
- **Caravan cats.**
  - Food merchants carry 0–2 cats and General merchants 0–1, each with a 50 % chance per visit.
  - A cat costs 30 Gold, paid at once (ledger "Trade Purchase") and added to the merchant's Gold. It is bought right away rather than through a trade order: there is nothing to haul, the cat walks from the Marketplace to the home the player picks, and cats are never sold back.
- **Kittens.** Every 10 days a cat living within 8 tiles of a house has a 50 % chance of a kitten, up to the cap of 1 + stores with food + houses. A kitten stays with its mother until the player gives it a home, and does not leave.
- **Provisional art.** Cats and rats are drawn in code until `g-domaci-zvirata-grafika` is approved; `DomesticViews` is the only place to change then.

## Save/Load impact
`SAVE_VERSION` goes from 51 to 52. The new `domestic` state holds rats and loss shares per location, the last notice per location, the cats, the next stray time and the caravan's cats. Validation covers:
- known locations and buildings;
- rats within 0–100;
- cat ids and states (home ⇔ has a building);
- coordinates and times.

## Testing
- `npm test` passes (916).
- `npm run smoke -- --current-only` passes with `--pets --marketplace --fishing --policy --world`.
- Stray cat panel screenshot checked.

## Notes for the next agent
- Z2 (`m-zvirata-z2-lovecky-pes`): a dog can follow the cat's pattern: a domestic-animal entity in this system, a view in `DomesticViews` and a panel. The caravan escort and the buy flow can reuse `caravanCats` / `buyCat`.
- New time-based animal logic must stay inside `DomesticAnimalSystem.update` (called from `simulationStep`).
