# Coordination: Claude and Codex

Shared register of active work. Rules are in [AGENTS.md](../AGENTS.md) (section *Collaboration between Claude and Codex*). Update this file in your own task branch: add a row before editing, update it when the pull request opens, move it to *Done* after the merge.

Files held lists the files a task changes. Another task avoids them unless necessary, and then says so here and in its pull request.

## Agreed merge order

None pending. Add entries here when one pull request must wait for another.

## Active

| Task | Owner | Branch | PR | Status | Files held |
|---|---|---|---|---|---|
| C03 (#50) Auto Employment and Castle priorities | Claude (taken over from Codex; Codex not running) | `claude/c03-auto-employment` | — | In progress | src/data/employment.js, src/systems/EmploymentSystem.js, src/ui/EmploymentPanel.js, GameScene.js (wiring, Castle click, Settings toggle), WorkplacePanel/UnitPanel (manual holds), WorkerSystem.create, FoodProductionSystem (Smelter delegates), GameSettings, NewGameSetup, GameStateSerializer/Loader (SAVE_VERSION 20), index.html (panel, toggles), i18n employment keys, style.css, smokes (browser, employment, smelting, ledger). |
| C05 (#52) Unit selection, Move/Hold/Resume | Codex | `codex/unit-selection-move-hold` | [#107](https://github.com/tom161819/Newgame/pull/107) | Draft; full local browser gate and PR CI in progress; explicitly ready alongside C04 | UnitCommands/UnitSelection new systems, WorkerAI/WorkerController/JobSystem, GameScene input/selection hunks, UnitPanel command actions, GameApplication Escape priority, save serializer/loader + schema smokes, command.* i18n, appended selection CSS, focused tests/smoke, changelog/progress. Preserve Claude C04 diagnostics/notices and its GameScene wiring; shared files integrated by separate hunks. |

## Kept backups (do not delete without the developer)

- `claude/serene-wright-97oy7k` at `0a48e67`: WIP checkpoint of the alpha policy and renderer switch; fully merged through #3 and #4. Delete it when the developer agrees.
- `backup/master-progress`: Codex stage history; source of `claude/merge-stages-07-08`.

## Done

- 2026-11-05 [#89](https://github.com/tom161819/Newgame/pull/89) C02: Assign Worker in three sorted groups with move confirmation; the Granary reports no false Missing Workers. Issue #49 done and closed (Claude).
- 2026-11-05 [#85](https://github.com/tom161819/Newgame/pull/85), [#86](https://github.com/tom161819/Newgame/pull/86), [#88](https://github.com/tom161819/Newgame/pull/88) C01: no stuck visibility, subjects see 15 tiles, the king explores unknown land, provisional blueprints outside sight (SAVE_VERSION 19). Taken over from Codex; Issue #48 done and closed (Claude).
- 2026-11-05 [#84](https://github.com/tom161819/Newgame/pull/84) N11: trampled paths drawn as the approved narrow Earth track over seasonal grass; Pages 41985687360 and Verify published release passed. Issue #64 done and closed (Claude).
- 2026-11-05 [#82](https://github.com/tom161819/Newgame/pull/82) N10: the Buildings menu is a wide horizontal strip of cards (buttons, wheel, keyboard, phone scrolling); Pages 41981107835 and Verify published release passed. Issue #63 done and closed (Claude).
- 2026-11-05 [#81](https://github.com/tom161819/Newgame/pull/81) N08: unique Archive build numbers for the 73 historical snapshots, explained in the archive UI; Pages 41978659289 and Verify published release passed. Issue #39 done and closed; N10 (#63) unblocked (Claude).
- 2026-11-05 [#79](https://github.com/tom161819/Newgame/pull/79) Issue #47: M2 v0.3.0 RELEASED — Codex release evidence and read-only post-Pages verifier, merged by Claude; Pages 41975989872 and Verify published release 41976289989 succeeded.
- 2026-11-05 [#76](https://github.com/tom161819/Newgame/pull/76) N07 part 4: status, placement and work messages. Issue #38 (Czech/English localization) done and closed (Claude).
- 2026-11-05 [#75](https://github.com/tom161819/Newgame/pull/75) N07 part 3b: Population sidebar and Asset Library (Claude, Issue #38).
- 2026-11-05 [#74](https://github.com/tom161819/Newgame/pull/74) N07 part 3a: in-game panels (Claude, Issue #38).
- 2026-11-05 [#73](https://github.com/tom161819/Newgame/pull/73) N07 part 2: names, seasons, weather and the game HUD (Claude, Issue #38).
- 2026-11-05 [#72](https://github.com/tom161819/Newgame/pull/72) N07 part 1: translation system, language switch, menus and save screens (Claude, Issue #38).
- 2026-11-05 [#71](https://github.com/tom161819/Newgame/pull/71) N06: Autosave (Claude, Issue #37).
- 2026-11-05 [#70](https://github.com/tom161819/Newgame/pull/70) N05: Download Save and Import Save File (Claude, Issue #36).
- 2026-11-05 [#69](https://github.com/tom161819/Newgame/pull/69) N04: starting resources in New Game Setup, SAVE_VERSION 17 (Claude, Issue #35).
- 2026-11-05 [#68](https://github.com/tom161819/Newgame/pull/68) N03 follow-up: idle-stone tests and one physical pickup path (Claude).
- 2026-11-05 [#67](https://github.com/tom161819/Newgame/pull/67) Fix the Pages deploy after N03: smokes expect save version 16 and switch idle stone off in the smelting smoke (Claude).
- 2026-11-05 [#66](https://github.com/tom161819/Newgame/pull/66) N03: idle Haulers collect loose stone near the Castle, per-unit ON/OFF and radius, SAVE_VERSION 16 (Claude, Issue #34). Its own Pages run failed in the smokes; fixed by #67.
- 2026-11-04 [#62](https://github.com/tom161819/Newgame/pull/62) N02: Haulers work kingdom-wide, Builders fetch site materials, no Deliver Materials (Claude, Issue #33).
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
