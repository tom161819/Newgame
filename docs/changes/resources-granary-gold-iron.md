# Resources: Granary 1000/1000, gold without a limit, one Iron (m-suroviny-sklady-zlato-zelezo)

## What and why
Owner requests 7 Nov 2026 (points 20, 23, 27).

## Files and systems
- `src/data/granaryCapacity.js` (20): a Granary holds 1000 raw food goods and 1000 finished food (was 200 / 200).
  `src/data/domesticAnimals.js`: one cat covers 600 food of capacity (was 120), so a Granary still needs the same
  number of cats as before.
- `src/data/economy.js`, `src/game/inventory.js` (27): `GOLD_LIMIT` is `Infinity` and gold has no inventory limit;
  the HUD shows the amount only. Trade no longer refuses sales for a full treasury. Starting gold stays 500.
- Iron (23): the Iron Bar became the one finished **Iron** (`iron`, from the Smelter: 3 Iron Ore + 2 Wood); the old
  separate `iron` material is gone. Recipes (Wheelbarrow, Horse Wagon, Sword, Armour), trade prices (Iron 40, the bar
  price), caravan templates, weights and texts (EN/CS) use Iron. Iron Ore stays as the raw material from the mine.
  The icon is the bar's (`/assets/resources/iron_bar/iron_bar.svg`, path kept).
- `SAVE_VERSION` 57 → 58 (alpha policy: older saves are refused; the owner starts a new game).

## Implementation decisions
- The id `iron` was kept (it is the name the owner uses), the bar's definition moved to it.

## Save/Load impact
SAVE_VERSION 58; no migration (alpha policy).

## Testing
Unit tests updated (granary groups derived from `GRANARY_GROUP_CAPACITY`, gold without limit, iron recipes, trade);
browser smokes for smelting, wheelwright and horse wagon renamed to Iron.

## Notes for the next agent
- The Warehouse accepts `stone`, `wood`, `iron` as before (the old `iron` slot now holds smelted iron).
