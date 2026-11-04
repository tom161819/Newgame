# Coordination: Claude and Codex

Shared register of active work. Rules are in [AGENTS.md](../AGENTS.md) (section *Collaboration between Claude and Codex*). Update this file in your own task branch: add a row before editing, update it when the pull request opens, move it to *Done* after the merge.

Files held lists the files a task changes. Another task avoids them unless necessary, and then says so here and in its pull request.

## Agreed merge order

None pending. Add entries here when one pull request must wait for another.

## Active

| Task | Owner | Branch | PR | Status | Files held |
|---|---|---|---|---|---|
| M2 final candidate and deployed-archive verification | Codex | `codex/m2-smelting-smoke`, main14071b1 preserved | [#22](https://github.com/tom161819/Newgame/pull/22), actual API merge blocked by CONNECT403 | READY:474models/Studio/Pages/73archive URLs and full current native pass. Frozen02a has own459test archive; final verifier checks actual deployed Git blobs, allowing later live development. Public tag/main/deployment gates pending; master11/C01–C08 unstarted. | Native smoke regressions; release-gate/deployed-archive verifier and tests; release notes,02a archive/catalog, progress/verification docs. Claude art unchanged; no schema rewrite. |

## Kept backups (do not delete without the developer)

- `claude/serene-wright-97oy7k` at `0a48e67`: WIP checkpoint of the alpha policy and renderer switch; fully merged through #3 and #4. Delete it when the developer agrees.
- `backup/master-progress`: Codex stage history; source of `claude/merge-stages-07-08`.

## Done

- 2026-11-04 [#24](https://github.com/tom161819/Newgame/pull/24) Approved assets part 2: production-building art and living Smelter flame (Claude), main14071b1. Preserved in the M2 candidate; later art stays Unreleased.

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
