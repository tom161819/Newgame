# 71: cloth – flax, weaving, clothing, light armour (0.144.0)

## What and why
Owner 17 Nov 2026 (71): "flax field → flax → weaving workshop (or another building) makes → cloth for clothes → clothing could be another indicator of happiness, better torches, bandages, sacks, tents… another building for light armour → for now required to train the Swordsman, Royal Archer, Crossbowman, Light Cavalry". Owner: "do 71".

## Files and systems
- Flax Field (`flax_field`, crop in `FARMING_RULES.crops`): 2 days, 8 Flax, tended by Farmers; the Farmhouse store keeps Flax. Drawn procedurally (`CropPlotView.flax`), blue flowers when it blooms.
- `data/objects/textiles.js`: the Weaver (2 Weavers, 3 Flax → 2 Cloth, 40 s) and the Tailor (1 Tailor, 3 Cloth → 1 Light Armor, 45 s), professions `weaver` and `tailor` (jobs, wages, employment sectors), the Cloth resource (Warehouse). Both buildings are drawn procedurally (`WorkplaceView`), placeholder menu icons in SVG.
- `ClothingSystem` + `data/clothing.js`: one kingdom level 0–1. Each dawn it falls by 1/20; then Cloth from the stores renews it (one Cloth per resident, up to full). Happiness for everyone −4…+4 (`NeedsSystem.status().clothing`), a resident line, an overview row with explanation, a feed warning below 30 %.
- Light Armor: `MILITARY_ITEMS.light_armor` comes from the Tailor; the Armorer's recipe is `retired` (not offered, a batch saved under it finishes, then Armor). The Swordsman, Royal Archer, Crossbowman and Light Cavalry need it.
- Wiki pages and texts for the new buildings, goods and professions; weights and prices.

## Implementation decisions
Clothing is one kingdom-wide level, not per resident, so no worker data changes. A new game starts fully clothed, so the chain is needed after about 10 days. Better torches, bandages, sacks and tents are left for later steps (plan).

## Save/Load impact
No SAVE_VERSION change. Optional `clothing` (`{level, warned?}`); an older save starts at 1. Older saves have no Flax Field clock and no Weaver/Tailor employment priority: both are accepted and filled in. Units and orders trained before Light Armor joined their kit (`legacyKit`) stay valid; such an order finishes with the items it got.

## Testing
tests/cloth-chain.test.js (data, Weaver → Tailor → Armory with Haulers, Clothing level, Happiness and Save/Load, older units); category, asset, store, farmhouse and military tests updated; save-compat (older saves) passes; npm test. In the browser on the Test map: Flax Field, Weaver and Tailor placed, flax flowers, no errors.

## Notes for the next agent
Studio art is missing for the Flax Field, Weaver, Tailor, Flax, Cloth and the p70 items. Next uses of Cloth: better torches, bandages, sacks, tents.
