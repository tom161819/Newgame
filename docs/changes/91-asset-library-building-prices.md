# Asset Library: building prices (#91 part 1, owner task, 7 Nov 2026)

## What and why
The owner wants to try building prices while playing: change an amount, add a resource or remove one, and send the result to the development chat as new defaults. Tracked on the plan page as `m-asset-library-ceny-budov` (spec there; copy in the project document `zadani-ceny-budov.md`, part 3). Permanent price changes go through the Studio and `prices:sync` (separate tasks).

## Files and systems
- `src/data/buildingCostAuthoring.js`: price rules (`validateCost`: at least one known resource, whole numbers 1–9999), override list validation, `costDiff`, localStorage read/write (`newgame.building-costs.v1`, wrapped in try/catch), `priceProposals` in the shared format `{ buildingId, cost, by, at, note }` where `cost` is the whole new price.
- `src/systems/ObjectRegistry.js`: `costDefaults`, `costOverrides`, `costResources()` (collectible resources without vehicles and equipment) and `configureCosts()`, applied at start from localStorage like the workplace authoring.
- `src/ui/BuildingCostEditor.js` + `AssetGallery.js`: the price section in the building detail; changed price highlighted on the card. `GameScene` refreshes the selected building and the menu after a change.
- `src/data/demolition.js`: `paidCost(building, definition)` = the site's `construction.investedMaterials` (booked at placement) or the definition price for buildings without a construction record; `buildingDemolitionRefund` halves the paid price. Used by `DemolitionSystem`, `buildingRemoval`, `DemolitionUI` and the serializer.
- `ConstructionMaterialsSystem.required`, `FoodStateValidation`, `LogisticsTaskManager` (stone collection areas) read a site's booked price instead of today's definition.
- `GameStateSerializer`: `investedMaterials` must be a valid price; a site's price must equal today's or the default price, or match the materials its supply booked; a finished building keeps any valid price.
- Texts `costEditor.*`, Asset Library intro (en, cs); Starter Stockpile description says 160 (missed in 0.9.2). Styles in `src/style.css`.
- Tests `tests/building-costs.test.js`; smoke `scripts/building-costs-smoke.mjs` (`--building-costs`, in `--full`).

## Implementation decisions
- Before this change the game read the price from the definition for running sites, refunds and Save/Load checks; with editable prices that would revalue standing buildings, so the price booked at placement (already saved as `investedMaterials`) became the source. Demolition still returns half, now of what was paid (unchanged for buildings placed at default prices).
- Every edit applies immediately (no Save button); amount fields apply on change (Enter or leaving the field) so typing is not interrupted by the re-render.
- Removed default resources stay listed, struck through, with Restore. The Wheat Field and Orchard are free by default and can be given a price; reset makes them free again.
- No save format change: overrides are never written into a save.

## Save/Load impact
No new format. Saves keep loading; the site price check is now "today's price, the default price, or the booked supply" instead of "today's price", so a site placed at a changed price still loads after the prices are reset.

## Testing
`npm test` passes (812). `npm run smoke -- --current-only --building-costs` passes, as do `--demolition`, `--getting-started`, `--pavement` and `--housing`.

## Notes for the next agent
- "Převzít ceny" (`m-prevzeti-cen-ze-studia`): the JSON from Copy prices JSON is a list of proposals; apply each `cost` as the building's new default in `src/data/objects/*.js`.
- A new place that needs a building's price for an existing building must use `paidCost(building, definition)`, not `definition.cost`.
