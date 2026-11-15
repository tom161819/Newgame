# #215 – art:revise, art:integrate and the graphics procedure (AR-5 of #210)

## What and why
Stage 5 of [#210](https://github.com/tom161819/Newgame/issues/210). After a review issue, Claude must revise variants and integrate approved art the same way every time, without hand-editing JSON, inheriting approvals, or changing mechanics to fit the art.

## Files and systems
- `scripts/art-tools-lib.mjs` (pure):
  - `reviseSpec` and `reviseRecord` bump one variant and restart its review with history;
  - `integrationProblems`: approved by the owner's review for this version and hash, export current, footprint matching;
  - `buildingArtEntry` and `setBuildingArt` insert or replace one `APPROVED_BUILDING_ART` line.
- `scripts/art-revise.mjs` (`npm run art:revise -- <variantId>`) bumps the version in `asset.json`, exports the asset (the old version's sprites stay), and writes the record back to `review` with history. It validates the manifest.
- `scripts/art-integrate.mjs` (`npm run art:integrate -- <variantId>`) checks everything first. It then copies the PNG plus front/still/rotor layers to `public/assets/buildings/<id>/` and writes the `approvedArt.js` entry. It refuses non-buildings (manual integration documented) and stops on any problem with a message.
- `package.json` scripts; `AGENTS.md` section *Graphics: designs, owner review and integration (#210)*; a `CLAUDE.md` note.
- Tests: `tests/art-tools.test.js` (3).

## Implementation decisions
- **Integration checks, not trust:** the script re-checks the owner review reference, the exact hash and the footprint even though CI already guards approvals, so a stale or foreign approval can never reach `public/`.
- **The art adapts, never the game:** a footprint mismatch is reported as a technical issue for the art.
- **Buildings first:** villager looks (8 facings) and terrain keep their manual steps until they need automation.

## Save/Load impact
None.

## Testing
- `npm test` passes (3 new tests: revise bump and history validity; integration refusals for not approved, no review, other hash, footprint, stale export; the art entry insert and replace touching exactly one line).

## Notes for the next agent
- AR-6 (#216) runs the whole loop for the Builders' Workshop once Codex's #196 (the placeholder building) is merged.
