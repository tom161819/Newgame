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
