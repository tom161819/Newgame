# Coordination: Claude and Codex

Shared register of active work. Rules are in [AGENTS.md](../AGENTS.md) (section *Collaboration between Claude and Codex*). Update this file in your own task branch: add a row before editing, update it when the pull request opens, move it to *Done* after the merge.

Files held lists the files a task changes. Another task avoids them unless necessary, and then says so here and in its pull request.

## Agreed merge order

None pending. Add entries here when one pull request must wait for another.

## Active

| Task | Owner | Branch | PR | Status | Files held |
|---|---|---|---|---|---|
| N02 (#33): global Hauler logistics, Warehouse delivery fix, no Deliver Materials | Claude | `claude/global-hauler-warehouse` | this PR | Verified | `src/data/jobs.js`, `src/data/workplaces.js`, `src/data/objects/{logistics,foodProduction}.js`, `src/systems/{LogisticsTaskManager,BuilderAI,ConstructionSystem,KingLogisticsSystem,FoodProductionSystem,FoodStateValidation,GameStateSerializer}.js` (SAVE_VERSION 15), `src/ui/{ConstructionUI,StoragePanel}.js`, `src/game/GameScene.js`, `index.html`, logistics/smelting tests, building-menu and smelting smokes, README. |
| Issue #47: finish actual M2 release | Codex | `codex/issue-47-m2-release` from main65b4bf8 | No duplicate PR22; metadata PR not yet created | BLOCKED on API bootstrap/final verification: public v0.3.0 now targets02a; actual full Pages41924183243 and71archive blobs verified. Read-only post-deploy verifier candidate a1a0b33 validated; one gh PR-create attempt returned Forbidden, no PR exists. Issue claim/label changes and MERGE-HELP not fabricated. Final tag-aware Pages/live verification pending; only47 currently ready. | Read-only `.github/workflows/verify-published-release.yml`, release/merge-queue/progress evidence docs and the authorized existing tag; no mechanics, archive or dependency changes. |
| Parked C01 / Issue #48 WIP | Codex | `codex/fow-exploration-blueprints`, pushed dd728a0 | No ready PR | PRESERVED, not complete and not advanced through a blocked dependency: reproduced skipped-visibility repaint bug, fix and12focused tests; evaluate again only after Issue47 is done and48 ready. | Existing two-file fix retained in its own remote WIP branch; do not merge its old coordination/AGENTS overrides into current main. |

## Kept backups (do not delete without the developer)

- `claude/serene-wright-97oy7k` at `0a48e67`: WIP checkpoint of the alpha policy and renderer switch; fully merged through #3 and #4. Delete it when the developer agrees.
- `backup/master-progress`: Codex stage history; source of `claude/merge-stages-07-08`.

## Done

- PR22 actually merged at cfe51fafd0e3a509c7335d6564fa206193165e20; its mechanics/archive work is not an open PR. Final M2 publication is tracked only by live Issue47. No duplicate implementation or MERGE-HELP for merged PR22.

- 2026-11-04 [#45](https://github.com/tom161819/Newgame/pull/45) Approved wall kit in the game; developer's Studio approvals recorded (Claude).
- 2026-11-04 [#42](https://github.com/tom161819/Newgame/pull/42) N01: Castle no longer covers the king; starter stockpile in front (Claude, Issue #32).
- 2026-11-04 [#44](https://github.com/tom161819/Newgame/pull/44) Wall kit concept in the Studio (Claude).
- 2026-11-04 [#41](https://github.com/tom161819/Newgame/pull/41) Approved assets part 7: quarry (Claude). The approved wall segment did not fit the connected wall; a wall kit followed in the Studio.
- 2026-11-04 [#29](https://github.com/tom161819/Newgame/pull/29) Approved assets part 6: seasonal grass textures and a smoother season blend (Claude).
- 2026-11-04 [#28](https://github.com/tom161819/Newgame/pull/28) Approved assets part 5: eight-direction profession/gender villager art and Studio facing export (Claude), main2663942, preserved unchanged.

- 2026-11-04 [#26](https://github.com/tom161819/Newgame/pull/26) Approved assets part 4: scaffold stage art (Claude), main4857ba7, preserved unchanged.

- 2026-11-04 [#25](https://github.com/tom161819/Newgame/pull/25) Approved assets part 3: young/mature/seasonal Oak and Pine studio art (Claude), main2ce3cd7, preserved unchanged.

- 2026-11-04 [#24](https://github.com/tom161819/Newgame/pull/24) Approved assets part 2: eight production buildings’ art and living Smelter flame (Claude), main14071b1. Preserved in the M2 candidate; later art stays Unreleased.

- 2026-11-04 [#23](https://github.com/tom161819/Newgame/pull/23) Approved assets part 1: developer approvals (58 variants), lush grass and moss footpaths in the game (Claude).
- 2026-11-04 [#20](https://github.com/tom161819/Newgame/pull/20) V02/V03 studio concepts: bowyer, swordsmith, armorer, armory, stables, equipment items and four soldier classes with an 8-direction sheet (Claude). Draft/Review on the C06–C08 ids; adjust when Codex fixes them.
- 2026-11-04 [#19](https://github.com/tom161819/Newgame/pull/19) Gradual and uneven seasonal terrain/tree transitions (Claude), merged main630caf1. Started before C01 at the developer's request; preserved by Codex integration.
- 2026-11-04 [#18](https://github.com/tom161819/Newgame/pull/18) Actual M2 source archive f053be1 (72 snapshots) and original follow-up CODEX_MASTER C01–C08 queue (Codex), merged mainb554b4e. Release verification/tag remains active above.
- 2026-11-04 [#15](https://github.com/tom161819/Newgame/pull/15) M2 v0.3.0 release source, final neighbouring-Quarry validation and autonomous milestone publication (Codex), merged main7595b80. Final tag/archive verification remains active above.
- 2026-11-04 [#16](https://github.com/tom161819/Newgame/pull/16) V01 studio part: seasonal ground, oak and pine, uneven transition preview (Claude). Draft only; the in-game transition waits for Codex C01.
- 2026-11-04 [#12](https://github.com/tom161819/Newgame/pull/12) Visual polish: compact HUD, larger map, fonts, construction dust; Asset Studio concepts for terrain, villagers, scaffold and buildings (Claude). Studio concepts stay Draft/Review until the developer approves them.
- 2026-11-04 [#11](https://github.com/tom161819/Newgame/pull/11) Stage 10 Quarry placement and Iron Smelter, Save schema 14 (Codex).
- 2026-11-04 [#10](https://github.com/tom161819/Newgame/pull/10) Approved watchtower and Brazier in the game, runtime flames and light sources (Claude).
- 2026-11-04 [#9](https://github.com/tom161819/Newgame/pull/9) Stage 09 Daily Resource Statistics & Ledger, Save schema 13 (Codex).
- 2026-11-04 [#8](https://github.com/tom161819/Newgame/pull/8) Asset Studio recipes: house, oak, pine, wall, quarry (Claude).
- 2026-11-04 [#7](https://github.com/tom161819/Newgame/pull/7) Asset Studio published on GitHub Pages under `/studio/` (Claude).
- 2026-11-04 [#1](https://github.com/tom161819/Newgame/pull/1) Stages 07 Forestry and 08 Extended Zoom Out (Codex).
- 2026-11-04 [#2](https://github.com/tom161819/Newgame/pull/2) Collaboration rules, `CLAUDE.md` and this register (Claude).
- 2026-11-04 [#3](https://github.com/tom161819/Newgame/pull/3) Alpha save policy: only the current save schema loads (Claude).
- 2026-11-04 [#4](https://github.com/tom161819/Newgame/pull/4) Optional Canvas/WebGL renderer switch (Claude).
- 2026-11-04 [#5](https://github.com/tom161819/Newgame/pull/5) Asset Studio MVP (Claude). Claude keeps `studio/**`, `art/**`, `docs/art/**`, `scripts/studio-*.mjs` and `tests/asset-studio.test.js`; ask before changing them.
