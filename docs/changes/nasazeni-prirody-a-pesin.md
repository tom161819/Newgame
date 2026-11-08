# Deploy approved nature art, the owner's paths and the Fisher look; UI Lab comments

## What and why
Owner, 8 Nov 2026 (Grafika chat): "nahraj pesiny v0 a udelej revizi asetu k nasazení do hry", then "pak nasaď schválený assety do hry" and "cesty sem potvrdil". Also "rybáři mají animaci ok, ale při ceste do skladu mají špatnou vizualizaci?" and "ke každé sekci [UI hubu] přidat textové pole kam můžu přidat komentář k požadovaným úpravám".

## Review
- The Studio review was taken over into art/approvals.json (`node scripts/studio-sync.mjs`): 115 decisions, 93 approved and 22 rejected (limestone, slate, veins and dark ore, deep mining stages).
- 69 approved variants have a game counterpart and are deployed.
- Approved but not in the game yet, because no game object of that size exists:
  - 3 × 3 deposits;
  - 2 × 2 rock obstacles;
  - rock ridge;
  - thickets 2×1, 2×2 and 3×2.
  These are a Mechaniky task.

## Files and systems
- scripts/export-nature-art.mjs + scripts/png-lite.mjs: pack the approved nature exports into one atlas, public/assets/nature/nature-atlas.v1.png. The script writes src/data/natureArt.js (frames, origins, art sources). It is one file because the game page is at the 512-file cap of a published page.
- src/game/natureArt.js: loads the atlas and picks the looks.
  - **Deposits:** the medium pile while more than a third is left, then the small pile; stone gets a stage-1 look at half fill; a few stones once empty; a winter look.
  - **Outcrops:** four rock looks, plus a winter look.
  - **Bushes:** meadow becomes hazel or juniper, berry becomes rosehip or bramble, flowering becomes heather. Three summer shapes and a spring, autumn and winter look. The desert scrub is unchanged.
  - **Crops:** wheat sown → sprouts → green → ripe (two wind frames), plus winter. Orchard harvested → blossom → green → fruit, plus winter.
- Views fall back to the previous drawing until the atlas is in:
  - DepositView;
  - TerrainRenderer (paintWall, paintBush);
  - CropPlotView.
- MapMemory: a remembered deposit keeps its look (optional `visual.look`, validated).
- Paths: art/path-lab/pesiny-v3.json (the owner's pathProposal/default) → src/data/pathStyle.js (geometry) and src/data/pathSurface.json (surface).
- Fisher: the approved fisher-male/female walk sheets were never deployed. PROFESSION_LOOKS had no fisher, so walking Fishers fell back to the drawn figure. scripts/export-fisher-walk.mjs writes src/data/fisherWalkArt.js (data URLs, no new file). HumanView uses it for walk-only looks.
- Studio UI Lab: a comment field for every section, stored in the page database as `uiNotes/<scope>`:
  - each Style group;
  - each Layout choice;
  - the window as a whole and each window section;
  - Designs.
  The fields save as you type, and a list of all comments is shown. Claude takes them over when asked ("UI poznámky").

## Save/Load impact
A map-memory deposit may carry `visual.look` (optional). Older saves load unchanged.
