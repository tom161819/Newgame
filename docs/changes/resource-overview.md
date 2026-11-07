# Resource overview: groups in the top bar, store preview on hover, icons at the Marketplace (m-ui-prehled-surovin)

## What and why
Owner requests 7 Nov 2026 (points 22, 24, 26).

## Files and systems
- `src/data/resourceGroups.js`: one definition of the groups for the whole UI – gold, materials, food raw materials
  (what a Granary takes that is not edible), food (edible), equipment (equipment and vehicles) – from registry data;
  `groupedResources` sorts by group, then inventory order; `STORE_PREVIEW_DELAY_MS` 600.
- `src/ui/InventoryBar.js` (22): the top bar is built from group capsules (`.inventory-group`, tinted, hidden when
  every resource in it is hidden); the gauge shows the store preview on hover.
- `src/ui/StorePreview.js` (24): after 0.6 s on a store on the map (Starter Stockpile, Warehouse, Granary – any
  building with a store location) or on the gauge in the top bar: "used / capacity" and icon + count per good, sorted
  and tinted by group; hidden at once when the pointer leaves, a quick pass shows nothing. Hooked into
  `GameScene.updateHover` (not while building or a dialog is open).
- `src/ui/MarketplacePanel.js` (26): price list, automatic trade rules and the trade table are sorted by group and
  each row has the good's icon and the group tint.
- Tints are CSS variables (`--group-*`), light enough for all four UI Lab styles.
- New Game setting **Starting garrison** (`startingGarrison`, on in the New Game proposal, off in scenarios and older
  settings) for m-start-v2, so the garrison can be switched off like the starting Castle.

## Implementation decisions
- Groups come from data (`edible`, `resourceCategory`, the Granary's accepted goods), so new resources fall into a
  group without UI changes.

## Save/Load impact
`gameSettings.startingGarrison` (boolean, default false for older settings).

## Testing
`tests/resource-groups.test.js`; browser smoke `--resource-groups` (capsules, preview after the delay on the map and
the gauge, hide on leave) and `--marketplace` (icons and tint).

## Notes for the next agent
- Smokes that start a New Game from the setup and count residents should switch the garrison off (`#setup-garrison`).
