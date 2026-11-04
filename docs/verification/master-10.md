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
