# Stone deposits ×2, Iron Mine over its deposit, paths without saplings, building store, steady Marketplace

## What and why
Owner, 12 Nov 2026 (plan 23, 28, 30, 32, 33): stone deposits hold twice the stone; an Iron Mine is built over its
deposit like a Quarry; saplings do not regrow on worn paths; a building window shows its own store; the Marketplace's
automatic trade section flickered.

## Files and systems
- `src/data/minerals.js`: stone deposits 160–320 / 400–640; `MINING_WORK.iron_mine.overlap` true; `minesOver(building)`.
- `src/systems/GameStateSerializer.js`: older stone deposits (max under the new minimum) get max and remaining ×2 in the
  save check (once: a doubled one is in the new range); an older Iron Mine beside its deposit gets
  `miningMode:'adjacent'` (saved, Iron Mines only) and keeps working it; iron deposits may lie under their Iron Mine.
- `src/systems/MineralSystem.js`: `ironMineSite` finds a placement over the deposit (start guarantee); placement message
  for the Iron Mine; `src/systems/MiningWork.js` uses `minesOver`.
- `src/data/naturalResources.js` `FORESTRY.pathBlocksGrowthLevel` 2; `NaturalResourcesSystem.flushGrowth`: on a path of
  that level or paving a stump does not sprout and a young tree withers back to a stump (its clearing mark goes).
- `src/ui/WorkplacePanel.js`: `ownStoreRows` and section `#own-store` (input, output, pile, kit, fuel, market goods with
  amount / capacity, bar, on the way, being taken, Full); the old buffer line hides when it shows. The window no longer
  closes for a building in the grey fog (uses `GameScene.buildingReachable`).
- `src/ui/MarketplacePanel.js`: status, price table, automatic trade and statistics are rebuilt only when what they show
  changed (signatures); the automatic section updates hints and notes in place.
- Texts `ownStore.*`, deposit and Iron Mine descriptions; styles.

## Implementation decisions
- Doubling stone needs no flag: an old deposit's max is below the new minimum, a doubled one is not.
- Older Iron Mines stay where they are (adjacent mode) instead of being removed.
- The generator's start Iron Mine guarantee now looks for a spot over the deposit; a world code may get a different
  extra start deposit than before (rare).

## Save/Load impact
SAVE_VERSION stays 62. Optional `buildings[].miningMode` ('adjacent', Iron Mines). Older saves: stone deposits doubled,
Iron Mines beside their deposit keep working.

## Testing
- `npm test`; smokes `--marketplace`, `--iron-mine-spot` (updated to the new rules), `--material-yard`, `--smelting`,
  `--depleted-mine`, `--storage-window`, `--save-compat` pass. `--minerals` and `--forestry` fail the same way on 0.101.0
  (pre-existing, order-dependent).
- Browser: the Marketplace dialog with automatic trade on adds 1 node in 6 s at ×3 (was 25); the Mill window shows Input
  and Output with "+4 on the way".

## Notes for the next agent
- `--minerals` / `--forestry` smokes fail before this change too (buildingMenuSmoke expectation at line 45); worth a look.
- Tests that need an Iron Mine place it over the deposit now (anchor one tile up-left of a 2×2 deposit).
