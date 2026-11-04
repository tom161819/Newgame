Title: Stage 09: daily resource changes and transaction ledger

Base: main
Head: codex/stage-09-ledger
Status: ready for review; PR creation is blocked by the environment's GitHub API policy.

Show each resource's net change for the last completed game day, with bounded,
scrollable income/expense tooltips and a 30-day transaction journal. Record real
production/acquisition and irreversible consumption once; exclude reservations
and physical transfers. Include actual castle income, paid wages, treasure,
meals, processing and construction losses without changing their game rules.

Save schema **13** persists the partial day, history and deduplication IDs, with
strict integrity checks. Current-schema IndexedDB restoration is exact. No older
save migrations: other schemas are rejected without deleting slots or changing
the world. Game version remains 0.2.0; no release/tag/archive snapshot is added.

Validation on integrated main69e5e57:

- `npm test`: **419 passed, 0 failed, 0 skipped**.
- `npm run changelog:validate` and `npm run build:pages`: passed.
- Full browser smoke passed; targeted native ledger smoke also passed after the
  final tooltip scroll-reset fix, including mobile, camera isolation and Save13.
- Archive/catalog verification passed; 71 canonical play URLs and 2,314 files
  passed local production HTTP/MIME/SHA verification. Historical builds unchanged.
- Controlled same-world main/branch comparison: both 59.51 FPS cold and 59.84 FPS
  after closing Archives (Canvas, 0.25 zoom, 20 residents, moving king and Fog).

Touched: central ledger/validation/tests, inventory and existing economic event
owners, clock/serializer/loader/GameScene, Resource Bar/new tooltip/CSS, relevant
smokes/helpers, Unreleased and task tracking. Studio/art/renderer/main entry,
save-menu/application, shared styling and package manifests are unchanged.

All original #1/#3 dependencies are merged. A normal merge of main69e5e57 retained
the other agent's work and `npm ci` installed its updated lockfile. Original WIP
remains separately backed up in `codex/stage-09-ledger-wip` feb19d2.

**HOLD for developer review; no agent self-merge or release.** The explicit uploaded
handoff overrides the later repository self-merge guidance. Stage10 waits for
this merge or an actual PR to stack upon. Details: `docs/verification/master-09.md`.

This is a prepared PR body, not an existing PR. REST/GraphQL creation is denied
because the managed network policy excludes api.github.com; Git transport works.
