# Stage10 — Quarry Placement & Iron Smelter — IN PROGRESS

Owner Codex; branch codex/stage-10-smelter, base main97b3381 (Stage09 merged PR9).
Visual Polish & Art Pass is removed from the Codex queue by the latest user
instruction; Claude owns graphics. Preserve his approved-tower-brazier branch.

PhaseA: verify existing finite Quarry overlap, access, binding/depletion and Fog;
change only actual gaps, without reimplementing mining. PhaseB: define Smelter,
Smelting/operator and Iron Bar and extend the existing recipe/logistics pipeline
for 3 Iron Ore +2 Wood ->1 Iron Bar /40s. PhaseC: native physical construction,
logistics, accounting, skills/employment, Fog and current-schema Save/Load.
Use one authoritative stock and the existing production/task/XP systems.

Necessary shared integration: objects/index registry and experience rewards,
preserving Claude's independent graphics/brazier changes. Avoid held Studio/art,
SpriteViews/renderer, tower definition and GameScene graphics. New original
placeholder SVGs only for this stage's new smelter/product, prepared for later
replacement by Claude. No general art pass.

Before implementation: checkpoint this task record on the current main base.
Final gates pending; no feature, tests, release or deployment is claimed complete.
ALPHA: bump SAVE_VERSION for the persistent production/skill/resource changes,
no older-save migrations. After Stage10 prepare M2 gate in branch and STOP for
the explicit developer release instruction required by the uploaded handoff.

## PhaseA — DONE

Existing rock placement, finite stock, unique binding, real reachable external
work slots, strict collision exception and depleted/Fog rules were reused.
Closed actual gaps: one-cell/full overlap is covered; a footprint across several
rocks selects the stable primary by deposit ID and never mines the secondary;
strict Save validation allows that secondary rock overlap while retaining unique
primary ownership. A valid procedural Quarry preview outlines the selected rock.
The menu description now states the actual finite-deposit/access requirement.

421 model tests passed (0 failed/skipped), build:pages and the current native
movement/pickup/physical delivery/IndexedDB/menu smoke passed. One new collision
fixture initially used a2x2 Tower that did not reach the tested3x3 corner; corrected
the fixture to the same-sized Castle. No existing tests were removed. Full mineral
and new furnace native coverage remain pending in PhaseC. Logs:
/workspace/scratch/Newgame-master10-phaseA-{tests,pages,smoke}.log.

## PhaseB — DONE; full PhaseC gate pending

Added the central Smelter recipe3Ore+2Wood->1IronBar/40s,3x3 blueprint12Stone10Wood,
two existing-registry Operator seats, Smelting1–50, ordinary wages, skill speed
and one shared10XP reward. Automatic staffing uses the existing Job/Workplace
assignment and takes only reachable available unemployed subjects, ranked by
actual Smelting skill; it runs at the normal search interval, not every frame.
Auto Production OFF stops new automatic hiring and freezes active work.

The existing production/haul/storage pipeline now handles each input independently
and withdraws a whole delivered batch atomically. No remote consumption and no
second inventory or job system. Whole-batch supply checks apply only to new
multi-input recipes, preserving original food timing; they avoid parking fuel in
a furnace that cannot obtain Ore. Cycles are still reversible until successful
completion. Exact source receipts:3Ore Smelting,2Wood Smelting Fuel,1Bar Smelter
Production. Reservations, transport and Save/Load generate no additional receipts.

Current schema14 restores skills, both inputs, reversible partial work, outputs,
physical cargo and journal IDs. Different schemas are rejected with slots retained;
no migrations. One original placeholder SVG each for Smelter/Bar, no general art
pass and no change to Claude's graphics or rendering files. Legacy generic Iron
is preserved; only iron_bar is produced by smelting. No weight simulation was
introduced into the current unit-based transport; loadUnits5 is future metadata.

434/434 model tests pass (0 failed/skipped), including the actual forest->physical
mine construction->finite Ore->Hauler->Smelter->Warehouse chain and mid-production restoration. Existing Mill/Bakery/farming tests remain in
place and green. Build:pages and changelog validation pass. Targeted native furnace
construction, Hauler management, auto employment, partial-cycle/loaded-Bar
IndexedDB restoration and frozen Fog building checks pass. The first native fixture
incorrectly tried the hidden workplace control inside the Warehouse storage
panel; corrected it to the real Manage Haulers flow. Full gate follows in PhaseC.
Logs: /workspace/scratch/Newgame-master10-{phaseB-final-tests,phaseB-pages,smelting-smoke,chain-regression}.log.

## PhaseC checkpoint — current branch verified; integration with newer main pending

Targeted native furnace passes: real Warehouse and Smelter blueprints and royal
supply/build, existing Manage Haulers flow, two auto-hired Operators, actual input
and output journeys, partial40s cycle/loaded Bar IndexedDB roundtrips,10shared XP,
exact3Ore/2Wood/1Bar receipts, resource tooltip and frozen Fog building. Screenshot
/workspace/scratch/Newgame-master10-smelter.png was visually inspected.

The first full smoke passed the furnace, original mineral extraction/forestry,
zoom and Fog, then correctly failed on Population's old hardcoded9skill assertion.
It now checks all registered10skills and actual Smelting sorting, without removing
coverage. Targeted Population200/mobile/staffing/Fog/current pickup smoke passes.
A fresh complete --full is running; do not claim it passed until its final result.

Archive/catalog checks pass: all71 immutable builds remain unchanged; local
production HTTP verifies71 canonical URLs/2314files/116659963bytes with matching
MIME/SHA. Performance at0.25zoom/20NPC/Fog/moving king:57.30FPS cold and59.34FPS after
closing Archives (360frames each); active simulation and real passages confirmed,
no historical game requests, retained archive rows or per-frame staffing scans.
This is local evidence, not a guarantee for every device. One full smoke process
was also running during this timing sample.

Meanwhile main advanced to03a3de337e8299b0cf24f7e82286f498c55fb99d, containing
Claude's approved watchtower/brazier PR10. A non-applying merge-tree preview found
five shared-file conflicts: docs/COORDINATION.md, src/data/experience.js,
src/data/objects/index.js, tests/assets.test.js and tests/building-categories.test.js.
They are additive registry/XP/test-count/task-register changes, not an alternative
graphics implementation. Prepared review patch: master-10-main-integration.patch;
git apply --check against actual main03a3de3 passes. It preserves all Claude
entries and adds Smelter/Bar; registry49, buildables17 and queued textures51.
The patch has NOT been applied to the branch and is not a completed integration.

The uploaded user handoff explicitly says to stop the affected part on a conflict
with Claude's work. An asynchronous question asks approval to combine these five
files in this Codex branch and retest. Await an actual answer; elapsed time is not
approval. Independent branch tests continue. Do not modify Claude branches, art,
Studio, renderer/tower implementation or push to main while waiting.

Original PR API limitation also remains: no supported GitHub connector; GraphQL
last returned Forbidden because api.github.com is outside the environment policy.
No Stage10 PR, successful deployment, M2 release/tag or new archive is claimed.

## Approved integration — in verification

The user explicitly approved combining both changes, then made autonomous routine
conflict resolution a standing instruction (no future conflict confirmation).
AGENTS.md now records this override; CLAUDE.md imports those shared rules.
Merged actual main03a3de3 into the Codex branch, preserving Claude's complete
watchtower/brazier/Studio/art code. Five additive conflicts use the reviewed
resolution: both registries and XP entries,49objects/17buildables/51queued assets
(including the tower front), both category lists and the shared task register.
No graphics implementation or other agent branch was overwritten. Full integrated
verification follows; older branch-only results are not claimed for this merge.

Combined main03a3de3 verification:437 passed,0failed,0skipped; build:pages passes. Package manifests are unchanged, so no dependency reinstall was required. The superseded old-base full smoke was terminated before rebuilding to avoid mixing artifacts; its partial results are historical only. Now commit this normal merge and run one full smoke on the combined artifact.

## PhaseC native gate and final validation correction

The complete combined-build smoke finished successfully, including new furnace
and all earlier gameplay, full construction chain, alternate-schema rejection
without slot/world mutation and original historical games. Log:
/workspace/scratch/Newgame-master10-merged-full.log.

Final review then added a valid two-Quarry edge scenario: each building mines a
different primary rock while a secondary edge lies beneath its neighbour. The
validator incorrectly rejected that legitimate snapshot. It now permits that
static rock overlap; subsequent unique reciprocal primary-binding checks remain
mandatory and reject a forged association. Exact restored simulation extracts
only one unit from each finite deposit, with total2Stone. No schema bump beyond14
or migration is needed for this bug fix.438/438 model tests now pass,0failed/skipped.
This small validator change follows the full smoke; run the final production
build and current-game native roundtrip on it before finishing. Do not attribute
the earlier full log to a build that did not yet contain this correction.
