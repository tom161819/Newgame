# ryby-nepricteny – delivered fish "not added" (owner report 0.85.0)

## What and why

Owner report on 0.85.0: "proč mi rybář donesl ryby do skladu/sýpky ale nic se nepřičetlo" – the Fisher carried his
basket into the store, but the Fish count in the top bar did not rise.

**Cause.** The fish were not lost. Every path was checked in the 0.85.0 build (browser probe on a new game) and in the
unit simulation:

- Granary, Starter Stockpile with room, Warehouse present (does not take fish – the Fisher correctly went to the
  Stockpile instead): in every case the basket arrived (`FoodStorageSystem.put`), the Granary stock rose by 5 and the
  bar showed 5. Capacity reservations, the granary food group, rats (fish are eaten last, 1–6 % a day), the 0.84/0.85
  fish visuals and the `fishingGround` save fix play no part.
- With **hungry residents** (no food in the kingdom), `FoodSystem.recover()` runs every frame and feeds each hungry
  resident as soon as any food reaches a store. The 5 fish were put into the Granary and eaten in the same frame:
  stock 0 → 5 → 0, hungry 10 → 5. The bar showed `0` (the Fish item even appeared for the first time, with 0), and its
  daily delta shows only the last *finished* day, so nothing on screen said where the fish went. That matches the
  report: the owner built a Fisherman's Hut because food had run out.

Eating on arrival is the intended food rule (hungry residents work at −20 % until they eat), so it stays. The bug was
that the game gave no sign of it.

**Changes:**
1. `FoodSystem.recover()` counts what hungry residents ate on arrival and pushes one notice a game day (key
   `hungry-ate:<day>`): "Hungry residents ate food the moment it reached the stores: Fish 5. Stocks rise once everyone
   has eaten." (Czech: "Hladoví obyvatelé hned snědli jídlo, které právě dorazilo do skladu: …").
2. The resource tooltip in the top bar gets a "Today so far (day N)" section with today's ledger entries by source,
   e.g. `+5 Fishing`, `−4 Villager Consumption`, `−1 King Consumption`. The last-finished-day section is unchanged.

## Files and systems

- `src/systems/FoodSystem.js` – `eat()` remembers the kind eaten (`lastMeal`); `recover()` collects kinds and calls the
  new `reportHungryMeals()` (event feed, once a day).
- `src/systems/ResourceTransactionLedger.js` – new read-only `today(resource)` (current day totals or null).
- `src/ui/ResourceEconomyTooltip.js` – the "Today so far" list (part of the tooltip signature, so it refreshes).
- `src/i18n/en.js`, `src/i18n/cs.js` – `economy.today`, `food.hungryAte`.
- `tests/fishing.test.js` – regression test.

Not touched: FishingSystem, FoodStorageSystem, delivery code, balance data, `src/render/**`, `studio/`.

## Implementation decisions

- No change to the food rules: a hungry resident still eats the moment food arrives; storage, cargo and ledger were
  already correct (the ledger books Fishing income at the catch and the meals as consumption).
- The notice is per game day, not per delivery, so a starving kingdom with several food producers is not spammed. It
  lists every kind eaten in that frame (`Fish 5, Bread 2`) with the localized resource name, so no Czech plural forms are
  needed.
- The tooltip shows today's entries only when there are some; the bar's daily delta stays "last finished day" (the
  agreed meaning since the ledger was added).

## Save/Load impact

None. `lastMeal` is a transient field; the notice key lives in the event feed's in-memory `seen` set; `today()` reads the
already-saved `current` ledger day. Save format unchanged (61).

## Testing

- `npm test` – all tests pass, including the new
  `ryby-nepricteny: fish delivered to a Granary while residents are hungry is eaten at once, and the game says so`
  (Granary + Fisher, three hungry residents: the basket is delivered, three fish are eaten at once, the stock is
  delivered − 3, today's ledger has +Fishing and −3 consumption, exactly one `hungry-ate:` notice; the next basket with
  nobody hungry adds fully and gives no new notice).
- Browser (build `--base=/Newgame/`, own probe and `--fishing --ledger` smokes): new game, starved kingdom, Granary;
  the Fisher's basket is eaten on arrival, the Fish tooltip shows "Today so far (day 1) +5 Fishing −4 Villager
  Consumption −1 King Consumption" and the notice appears in the feed.

## Notes for the next agent

- If the owner reports "not added" again, check `scene.foodSystem.hungryCount` first; a non-zero count means deliveries
  are being eaten on arrival.
- Fish are only accepted by the Granary and the Starter Stockpile (and the camp fallback); a Warehouse never takes them,
  `findDestination` already skips it.
- The other agent's balance change (fisherman_hut capacity 2 → 1) does not interact with this fix.
