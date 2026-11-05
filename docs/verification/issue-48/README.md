# Issue48 — C01 stacked preparation

STARTED (API read-only), Codex, 2026-11-05.

- Task: https://github.com/tom161819/Newgame/issues/48
- Branch: `codex/issue-48-fow-blueprints`.
- Exact predecessor branch head: `95cea7883d81395460dce478ab994167ab9bd14a` on
  `codex/issue-47-m2-release`, including actual main
  `1b73c2c62d9f5c0dd7cbcc43cfc4398efa8b996e`.
- Current AGENTS allows clearly marked stacked work when an actual predecessor
  is incomplete. M2 gameplay is already merged, so implementation against its
  current source does not require pretending public release verification passed.
- Dependency: Issue47 must actually pass its tag/archive/published Pages gate
  before this branch may merge, deploy or be called done. No PR exists and no
  Issue labels/comments were changed; public48 remains blocked.
- Current public open PR check returned only draft/HOLD31. Claude main PR77
  records N07 done; N08 holds no files and concerns archive labels, not this task.
- Files held: Fog/MapMemory/navigation, king/worker visibility integration,
  provisional construction/serialization, focused tests/smokes/i18n and evidence.
  Preserve Claude art, N02 logistics, N03 idle collection, N04 setup, N05 import,
  N06 autosaves and N07 localization. No new graphics or archive changes.

## Authoritative scope

Read the actual Issue48 as well as `docs/requests/CODEX_MASTER.md` C01. The live
Issue additionally requires subject vision diameter15 (radius7.5), every living
owned subject regardless of job, lifecycle/Save/Load/Fog switches and an
efficient100–200-unit regression. Keep the king's normal radius10 and existing
mounted/building bonuses. Do not accidentally omit this live Issue addition.

The remaining C01 scope is the lost-render-invalidation Fog regression, safe
unknown-ground navigation, non-revealing provisional blueprint preview and
physical site inspection with atomic refund/task release and one cancellation
activity event. No minimap, new art or season rework.

## Recovery

Earlier remote WIP `codex/fow-exploration-blueprints` / `dd728a0` contains a
reproduced two-file renderer regression fix; recover only the relevant code and
tests, never its superseded AGENTS/queue overrides. Verify against current main.
Do not claim this complete or use it to unlock49. Save checkpoints on this
branch while API access remains unavailable; create a real stacked PR only when
an authorized integration is available, documenting predecessor and merge order.
