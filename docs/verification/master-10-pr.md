Title: Finalize Stage10: save neighbouring Quarries and record M2 verification

Base: main
Head: codex/stage-10-smelter

Stage10's main feature is already merged through PR11. This follow-up fixes a
valid Save14 case: two Quarries mine different primary deposits, while a secondary
rock edge lies under its neighbour. Allow that static overlap and keep all unique
reciprocal binding checks. Add an actual restored mining regression plus a forged
binding rejection. Production, graphics and resource ownership are unchanged.

Record final Stage10/M2 evidence and remove Visual Polish & Art Pass from Codex's
queue, as requested; Claude owns that work. Autonomous routine conflict resolution
was already delivered in PR11's AGENTS rule and is retained.

Validation:
- 438 tests passed,0failed/skipped, including the full physical M2 chain.
- Pages build, changelog/catalog/SHA validation and final current-game native
 movement/pickup/physical transport/exact IndexedDB roundtrip passed.
- Full native combined-build suite passed before the last narrow validation fix;
 that fix is covered by the new two-Quarry regression,438tests and final current
 native roundtrip. No tests were removed.
- 71 unchanged archives:71canonical URLs,2314HTTP files, matching SHA/MIME.
- Standalone 20 NPC/Fog/moving king/0.25zoom profile:59.34–60.00FPS.

Save schema remains14; no old-save migrations, stored incompatible slots retained.
No release/tag/new archive in this PR. M2 formal gate requires successful Pages of
this final source and the developer's explicit release instruction. Studio/art,
renderer, approved tower/brazier and package manifests are unchanged.

Details: docs/verification/master-10.md and docs/verification/master-M2.md.
This is a prepared body; API creation is blocked and no follow-up PR is claimed.
