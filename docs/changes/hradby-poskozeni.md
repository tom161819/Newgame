# Walls, Towers and Gates show their damage (0.146.3)

## What and why
Owner 18 Nov 2026: "udělej vizualizaci pro hradby, jak se postupně bourají, když mají míň HP". Until now a wall looked whole until it vanished at zero hit points; only the bar told how it stood.

## Files and systems
- `src/game/buildingDamage.js` (new): `damageStage` (0 whole, 1 under 75 %, 2 under 50 %, 3 under 25 % of the hit points), `damagePixels` (works on RGBA pixels: lowers the wall in stone-wide steps – the top slides down over the face, so every step stays a solid piece – one or two steps breached deep, cracks from the top, bricks fallen out; `chip:false` keeps the outline), `damagedTexture` (a canvas texture per picture, stage and one of three variants, made once), `rubble` (stones around the foot).
- `FortificationView` (wall kit): the block and its parapets take the damaged texture; from stage 2 the parapets are gone; fallen stones are drawn at the foot; `syncDamage` repaints only when the stage changed.
- `GameScene.damageLook(building)`: walls through `syncDamage`; a Tower (`faceTowerView`) and a Gate (`flipGateView`) get cracks and fallen bricks with the outline kept (their front layers must still fit).
- Called where hit points change: `SiegeSystem.drawBar` (soldiers and the Catapult), `RepairSystem.applyHP` (a repaired wall grows whole again), `NightThreatSystem` (fire).
- `SiegeSystem.destroy`: a fallen building leaves a heap of stones on its ground for 90 s (a drawing only; the ground is free).

## Implementation decisions
The look is made from the building's own approved pictures by code, so there is no new art to approve; the Studio has approved ruined walls, but they are 2 × 1 pieces in another stone and do not fit the 1 × 1 wall kit. It is a provisional look until the Studio draws damage stages for the kit. Which way a wall breaks depends on its id, so it does not flicker between repaints.

## Save/Load impact
None. The look comes from the saved `hp`.

## Testing
`tests/building-damage.test.js`: stages by hit points; the approved wall block loses more with every stage, deterministically, never gains pixels outside its outline and keeps its foot; the Tower keeps every pixel and gets darker; rubble counts. Browser, Test map: twelve walls at 100 / 70 / 45 / 20 / 5 %, a Tower and a Gate; a real siege by eight Swordsmen and a Catapult (stages change while they hit, a heap stays where a wall fell).

## Notes for the next agent
Men standing on a wall broken to stage 3 still stand at the full wall height. Remembered (fogged) copies of walls show the look they had when last seen only if the memory layer copies the texture key; not checked.
