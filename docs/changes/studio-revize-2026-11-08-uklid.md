# Studio – revize 8. 11. a úklid zamítnutých objektů

- Revize převzata: koně (Blender sculpt, 11 variant), koňské vozy (10), karavany (8), kanec (útok, sele) schváleno.
- Zamítnuté varianty smazány ze studia včetně spritů (70 variant, ~190 souborů), smazány i staré verze spritů
  schválených variant. Výjimky: sprity, na které odkazuje hra (src/), zůstávají.
- Celé assety smazány: `fisherman-hut-large` (vše zamítnuto), `roof-fire` (nahrazeno ohněm z Fire Labu).
- Ponechány přes zamítnutí: `military-directions` 0–3 a `soldier-female` – směrový list potřebuje všech 8 směrů
  a profese muže i ženu.
- Medvěd `bear-brown-sculpt` v3: mohutnější stavba, přirozené břicho, níž nesená hlava a vyceněné zuby; preferovaný.
- Testy počtu variant upraveny: po revizi zůstává jen zvolená varianta.

## What and why
Owner review 8 Nov: approved horses, wagons, caravans, boar; rejected variants deleted from the Studio as asked; heavier bear sculpt v3.

## Files and systems
art/approvals.json, art/assets/**/asset.json, art/sprites/**, studio/src/generators/animal.js (bearSkin), tests/asset-studio*.test.js, scripts/studio-smoke.mjs.

## Implementation decisions
Sprites referenced by src/ kept; military-directions 0–3 and soldier-female kept (needed by direction sheet / professions). Variant-count tests relaxed to >= 1.

## Save/Load impact
None (Studio only; game files unchanged).

## Testing
node --test tests/asset-studio*.test.js, npm run studio:smoke, npm test.

## Notes for the next agent
Deployment of all approved art is plan item m-nasadit-schvalenou-grafiku.
