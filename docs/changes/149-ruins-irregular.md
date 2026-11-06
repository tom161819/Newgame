# 149 – Broken wall v2: rough stone wall, and "Send for rework" in the Studio

## What and why
The owner asked for revisions of all four broken wall variants (`ruined-wall-breach`, `-low`, `-crumbling`, `-overgrown`): v1 looked like a stack of identical bricks with a regular staircase top, flat cut ends, a flat plinth, almost no rubble and overgrowth too small to see at 1×. Brief: project doc `rozborene-zdi-zadani.md`; the revision comments came from the shared Studio (taken over with `studio:sync` on 2026-11-07, together with one "Back to review" on `bowyer-worker-male`).
The owner also expected a button that sends the comment after writing it; the old red hint stayed visible after the comment was filled in. Revisions are started by writing „spustit revizi“ in the MK chat (the page cannot start Claude).

## Files and systems
- `studio/src/generators/ruins.js`: new recipe `kind: 'stonewall'` (rubble masonry). The old kinds (`tower`, `wall`, `foundation`, `burnt`, `rubble`) are untouched, so the generator stays version 1 and the other ruins keep their reviewed hashes.
- `art/style-guide.json`: new materials `fieldstone`, `fieldstone_light`, `fieldstone_dark` (stone colours with the noise texture instead of bricks), `rubble_fill` (mortar core), `moss`, `soil`. Palette and style version unchanged.
- `art/assets/decorations/ruined-wall/asset.json`: all four variants are version 2 with stonewall specs. `art/sprites/ruined-wall/*.v2.{png,json}` exported; v1 files kept for comparison.
- `art/approvals.json`: taken over from the Studio, then `nextRevision` for the four variants (v1 records moved into history, v2 in review; Preferred stays on Breach).
- `studio/src/main.js`, `studio/src/styles.css`: "Send for rework" button under the comment (enabled once it has text), the hint clears while typing, a confirmation under the card after a decision ("write „spustit revizi“ in the MK chat"), and the same hint in the summary line.
- Tests: `tests/asset-studio-ruins.test.js` (new), `scripts/studio-smoke.mjs` (new flow).

## Implementation decisions
- Every stone is its own box with random length, course height, per-stone height, depth, twist and tilt; the top follows a `profile` plus seeded noise and a per-stone threshold, so it never drops in equal steps. Missing stones show the dark `rubble_fill` core, which stops 0.26 below the top so knocked-off stones open to the sky.
- Fallen stones are low-poly icosahedra (`sphere`, detail 0) in heaps, some dressed blocks among them; `heaps` entries with `'through'` fill a breach across the wall line. Soil instead of the old plinth; grass tufts are thin three-sided cones.
- Ivy is a column of flat leaf ellipsoids on the +Z (sunlit) face; the lean (`lean`) offsets stones outwards with height. The crumbling window clears every stone that overlaps it.
- New variants were not added: revisions are new versions of the same variants, as the review workflow expects.

## Save/Load impact
None. No game change; SAVE_VERSION stays 36, no release.

## Testing
- `npm test`: 783 pass (5 new ruins tests: footprint, determinism, no brick blocks, irregular stones and top, open breach with heap, overgrowth/window/lean, old ruins unchanged).
- `npm run studio:smoke`: all pass, including Send for rework, the hint clearing, the confirmation and the shared summary hint.
- Looked at the exported v1/v2 sprites at 1×, 2× and 3×.

## Notes for the next agent
- Tune a wall with its spec (profile, ragged, holes, heaps, green, ivy, bushes, lean, window) before touching the recipe; recipe changes affect all four variants.
- The game does not use these sprites yet; wiring them in is a separate task after approval.
