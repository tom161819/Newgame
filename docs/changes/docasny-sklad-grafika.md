# Starter stockpile: the approved Studio art in the game

## What and why
Owner, 9 Nov 2026 (Grafika chat): "proč není ve hře úprava dočasného skladiště?"

The Studio design "Tarp camp store" (plan g-docasny-sklad, asset `starter-stockpile`) was approved on 7 Nov 16:26. It was never wired into the game:
- Approved buildings come in through `APPROVED_BUILDING_ART`, which is edited by hand.
- The 8 Nov deployment (export-approved-art.mjs) covered animals, vehicles, children and ground, not buildings.

The game kept drawing four procedural crates.

## Files and systems
- public/assets/buildings/starter_stockpile/starter-stockpile-tarp-camp.v1.png: a byte-for-byte copy of the export.
- src/data/objects/approvedArt.js: a `starter_stockpile` entry with the export's baseOrigin, visualHeight 80 and gameLights (lantern). `withApprovedArt` turns the definition into a sprite building.
- Removed three unused old building versions to stay under the 512-file cap of the game page:
  - house-timber.v1.png (the game uses v3);
  - farmstead-thatched.v1.png (the game uses v2);
  - bakery-house-yard-oven.v1.png (the game uses v3).
  The page now has 510 files.

## Implementation decisions
- **Use the normal building sprite path.** It is the same route as the other approved buildings, so tests/asset-studio.test.js checks file, origin, height and lights against the export.
- **Free old versions instead of inlining.** These files are no longer referenced by any code, test or script.

## Save/Load impact
None (look only).

## Testing
- tests/asset-studio.test.js covers the new entry. npm test passes.
- Browser: a new game shows the tarp camp store with its lantern by the castle. No 404s.

## Notes for the next agent
- Other approved designs may also still be missing from the game. Check them against src/data/objects/approvedArt.js and approvedDeployArt.js before a "deploy everything approved" round.
