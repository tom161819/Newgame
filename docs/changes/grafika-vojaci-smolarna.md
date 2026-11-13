# Soldiers by rank and the Pitch Kiln in their approved art

## What and why
Owner, 13 Nov 2026 ("jeď dál a i úkoly z grafiky"): plan g-vojaci-grafika and g-smolarna-vzhled. The art was already
approved in the Asset Studio (military-* and pitch-maker on 7–8 Nov, pitch-kiln v2 on 7 Nov) but not in the game.

## Files and systems
- `public/assets/characters/villagers/`: the eight facings and walk sheets of the Pitch Maker (male, female) and of
  the ranks: Soldier (man, kettle hat, woman), Archer (hood, royal, woman), Swordsman (kite, greatsword, woman), Knight
  (blue, red, woman – eight still images, no walk sheet in the export), copied byte for byte from `art/sprites`.
- `src/data/objects/approvedArt.js`: their looks in `APPROVED_VILLAGER_ART`; Pitch Maker look; `MILITARY_LOOKS` and
  `militaryLook(type, sex, id)` (stable pick per soldier); Pitch Kiln in `APPROVED_BUILDING_ART`.
- `src/game/HumanView.js`: a soldier wears his rank's look (`military.unit(worker).type`); Recruits keep the plain
  soldier look.
- `public/assets/buildings/pitch_kiln/pitch-kiln-stone-oven.v2.png`: the stone pitch house with its yard and lights.

## Implementation decisions
- A look with a walk sheet now loads only the sheet (its idle column is the standing pose); the separate facing images
  of such looks are no longer shipped (224 files fewer; the published game may hold at most 512 files). The plain
  villager looks keep their facing images for the Studio labs. Knights (no walk sheet) ship eight facing images.
- The Pitch Kiln export is drawn for 3 × 3 (the owner asked the Studio for a bigger building); the game kiln stays
  2 × 2, so the picture is shown at 2/3 (display size, visual height and lights scaled). Making the kiln 3 × 3 in the
  game would move it in older saves; that is left for a decision.
- Tests allow a scaled building only where the export footprint differs (Pitch Kiln) and Knights without walk sheets.

## Save/Load impact
None.

## Testing
- `npm test` (asset-studio, walk-cycle, world-look-2 updated for the new looks and the scaled kiln).
- Browser: soldiers of rank Soldier and Archer pick military-soldier-* / military-archer-* looks; the kiln draws.

## Notes for the next agent
- Pitch Kiln 3 × 3 in the game needs a save decision; Knights could get a walk sheet in the Studio.
