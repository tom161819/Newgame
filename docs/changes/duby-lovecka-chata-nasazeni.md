# Approved art deployed: Hunting Lodge 3 × 3 and the oak renders

## What and why
Owner 15 Nov 2026: "všechny nové grafiky jsou approved, nasaď je do hry – u stromů navíc přidej pravidlo že se do hry přidávají v náhodném směru otočení". This is the first part: the Hunting Lodge and the oaks. The Village Green (4 × 4) and the grand oak on 2 × 2 follow.

## Files and systems
- `art/approvals.json` – approval records for the render variants of hunting-lodge, village-green and oak-tree (note: owner in the Mechaniky chat); preferred hunting-lodge = `hunting-lodge-render-0`.
- `src/data/objects/approvedArt.js` – `hunting_lodge` entry (with `legacyVisual`); `oak_tree` looks `young-*`, `broad-*`, `grand-*` (0/90/180/270) and the earlier `winter`.
- `src/data/objects/buildings.js` – Hunting Lodge 3 × 3, `legacyFootprint` 2 × 2.
- `src/render/treeSeasonTexture.js` (new) – `recolourLeaves`, `seasonTextureKey`, `oakLook`, `treeHash`.
- `src/game/TreeView.js` – picks the view by the tile hash, uses the season texture, scales the bare winter oak.
- `public/assets/...` – PNG copies of the exports; five old oak PNGs removed.
- Tests: `tests/oak-renders.test.js` (new), `asset-studio`, `assets`, `workplaces` adjusted.

## Implementation decisions
- **Random view = tile hash**, not `Math.random`: the same tree looks the same after load, in map memory and for every player of a seed. No save field is needed.
- **Seasons.** The renders are summer trees and the owner will send season renders later. Until then spring and autumn are made at run time from the render: only pixels with a green hue change (trunk and shadow stay). Two autumn tones by the same hash. Winter keeps the earlier bare oak, scaled to the render's size (1.05; 1.6 for the grand oak).
- **Grand oak (195 px, 2 × 2)** is loaded and `oakLook` knows it (`natural.grand`), but no tree is grand yet. The 2 × 2 mechanic is the next task.
- Young oak (stage 2) in winter stays procedural as before.

## Save/Load impact
None. Save version stays 62. Lodges without `size` (older saves) keep 2 × 2 and show the new picture scaled down.

## Testing
- Full suite.
- Browser harness (/tmp/perfdiag/oak.mjs): forest in the four seasons and a new 3 × 3 lodge; pictures checked by eye.

## Notes for the next agent
- When the owner's season renders arrive: add looks (`broad-0-autumn`…) and drop `seasonTextureKey` for the seasons that have a render.
- The hunter's dog waits in front of the lodge (`DomesticAnimalSystem.lodge` uses the definition's size, so 3 × 3 works).
