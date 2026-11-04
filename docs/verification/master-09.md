# Stage09 — Daily Resource Statistics and Ledger — IN PROGRESS

Owner: Codex. Branch: `codex/stage-09-ledger`.
Base: `origin/claude/alpha-save-policy` at
`cf4c542db021eb09e6cf32a2b75634061cae0cf2`, explicitly permitted by the
developer's latest collaboration instructions. PR dependencies: #1 and #3;
developer merges #1 → #2 → #3 before this task. Never merge or publish main here.

Recovered original WIP is preserved separately at `codex/stage-09-ledger-wip`,
`feb19d250da20a60826798d106e6f3ba6028b0d6`, based exactly on c106cc4. It passed399
tests and a build but is not a completed feature. Useful foundation files were
reviewed and ported individually; the two existing files were byte-checked against
their original base before applying those reviewed changes. No WIP merge or
cherry-pick was used. The ALPHA base passes383 tests and build:pages, composing all71
immutable historical snapshots. Dependency manifests match the prior environment;
no dependency installation/change is needed for this task.

No `docs/COORDINATION.md` exists on this base (#2 is still open), so the developer
explicitly requires held files here/in the PR instead of inventing that register.
Held: ledger data/system/validator and its tests; `src/game/inventory.js`,
`src/systems/GameTimeSystem.js`, `src/game/GameScene.js`,
`src/systems/GameStateSerializer.js`, `src/systems/GameStateLoader.js`,
`src/systems/{ProductionSystem,WageSystem,FoodSystem,FarmingSystem,FoodProductionSystem,FoodStorageSystem,TreasureSystem,ConstructionMaterialsSystem,ConstructionSystem,DropSystem,WorkplaceSystem}.js`, `src/game/buildings.js`,
`src/ui/InventoryBar.js`, new resource-tooltip UI/CSS, relevant smoke/helpers,
`CHANGELOG.md` Unreleased and `docs/UPGRADE_PROGRESS.md`.

Necessary overlap with #3: serializer and browser smoke, edited only above its
actual ALPHA implementation. Shared changelog/progress only describe this task.
Do not touch Claude's Studio/art paths, renderer/main entry, save menu or game
application. Keep current-schema Save/Load validation and reject different schemas;
add no migrations. The persisted journal will require SAVE_VERSION13.

Delivery constraint: both GitHub GraphQL and REST requests return Forbidden.
Runtime policy allows github.com but excludes api.github.com. Public GitHub HTML
verified PRs1–5 OPEN, with main still27bb4f1. Git fetch/push work. Automatic draft
PR creation needs supported GitHub API access; prepare a reviewable branch and
exact PR description meanwhile, without claiming a PR exists or bypassing policy.

Remaining: finish live sources/sinks, journal consistency validation/Save13,
last-completed-day resource bar and bounded accessible tooltip, full tests,
build:pages/browser --full/archive verification and final review record.


## Implementation checkpoint — PARTIAL, full gate pending

Foundation commit: fdbdaa00b3f15b794f8d98c13f372e8b782ce482, backed up on this
codex task branch. The live journal, explicit economic source/sink integration,
Save13 DTO/strict validation and Resource Bar/tooltips are implemented. Inputs of
an unfinished reversible recipe remain owned buffer material; their expense is
recorded on successful processing. Cancelled batches return those inputs without
fictional income/expense. Construction reservations/delivery are transfers;
completed consumption or actual cancellation losses are recorded. Gold tracks
actual castle payouts, paid arrears/wages and treasure; unpaid debts are not cash
expenses. No new trade, building or background simulation was introduced.

398 current-policy model tests passed; production build and targeted native ledger
smoke passed. Economic tests cover real1/3 worker scenarios, finite mining, ground
wood and loaded-cargo restoration, raw collection/deposit/withdraw/drop/collect,
all food processing, reversible inputs, construction/cancellation, debt settlement,
Gold/meals/day lengths, corrupted journals and incompatible schema rejection.
Native controls verify prior-day-only coloured amounts, genuine castle/wage/meal
and treasure events, unchanged imported journal/receipt IDs in IndexedDB, mobile
all-resource bounds, scrolling with no camera zoom/pan/stuck keys, and continued
Settings/Population/Buildings access. Screenshot Newgame-master09-ledger.png was
visually inspected. Full stage gate is still pending and is not claimed complete.
Logs: /workspace/scratch/Newgame-master09-{tests,ledger-tests,ledger-smoke,build}.log.
No main/Claude/backup branch, renderer, Studio, save-menu/application, historical
snapshot, release version or Git tag was changed. New tooltip CSS is isolated
from Claude's held src/style.css and main entry. Later updates will record the
full browser/Pages/archive gate and actual PR delivery status.
