# GPT barracks 4 × 5; Marketplace 4 × 4

## What and why
Owner, 13 Nov 2026: barracks sheet, "klidně zvětši půdorys ať sedí proporčně"; then "tržiště můžeš trochu zvětšit ať sedí proporčně, klidně 4x4".

## Files and systems
- `art/assets/buildings/barracks-hall/asset.json` (footprint 4 × 5), `art/sprites/barracks-hall/barracks-hall-gpt-{0,90,180,270}.v1.*`: the sheet's large picture is the 0° view (scale 0.37, gate ≈ 46 px); the small 90°/180°/270° views are scaled ×2.03 to the same size. Two lanterns as game lights.
- `art/assets/buildings/marketplace/asset.json` (footprint 4 × 4), `art/sprites/marketplace/marketplace-gpt-*.v1.*` re-exported at 0.365.
- `src/data/objects/buildings.js` (Barracks 4 × 5) and `src/data/objects/logistics.js` (Marketplace 4 × 4): `legacyFootprint: {3, 3}`; `approvedArt.js` with `legacyVisual` (0.7 and 0.75).
- `art/approvals.json`: barracks 0° approved on the owner's chat request, preferred.
- Tests: military-units (soldier/villager tiles outside the larger barracks), stables, workplaces, trade-marketplace, asset-studio-buildings; `scripts/studio-smoke.mjs`.

## Implementation decisions
- Barracks: the paving is longer along one axis, so 4 × 5 fits better than 5 × 5.
- Green grid backdrop removed as for the builder's workshop sheet.

## Save/Load impact
SAVE_VERSION stays 62; `buildings[].size` also for Barracks and Marketplace.

## Testing
Full `npm test` (1307), `npm run studio:smoke`, screenshot of barracks, market and a house side by side.

## Notes for the next agent
Barracks training/guard tests place soldiers by absolute tiles: check them when a footprint grows.
