# Coordination: Claude and Codex

Shared register of active work. Rules are in [AGENTS.md](../AGENTS.md) (section *Collaboration between Claude and Codex*). Update this file in your own task branch: add a row before editing, update it when the pull request opens, move it to *Done* after the merge.

Files held lists the files a task changes. Another task avoids them unless necessary, and then says so here and in its pull request.

## Agreed merge order

PR138/151 and PR142 (#122) have successful actual Pages. PR164 (#123) merged da21f0c and its Pages42159725044 retry completed build/deploy SUCCESS. PR165 (#143) merged90eb356 after exact-head CI42160766881; await its own Pages before166 merges. Then166 precedes145.

## Active


| Task | Owner | Branch | PR | Status | Files held |
|---|---|---|---|---|---|
| NEW17 (#145) Farmer plot establishment | Codex | `codex/farmer-plot-establishment` | — | Implemented: 677 tests/changelog/build and native establishment/ownership/tending browser PASS; schema32; full browser gate next; merge only after actual166 Pages | crop costs, shared ConstructionSystem/BuilderAI/ConstructionUI + ConstructionMaterials contracts, FarmingSystem, Workplaces presence hook, XP rules, diagnostics, schema32 validation, own i18n/tests/browser/docs. Reuse sites/progress/tasks; preserve166 ownership. |
| NEW18 (#146) Farm plot ownership | Codex | `codex/farm-plot-ownership` | [#166](https://github.com/tom161819/Newgame/pull/166) | Implemented: 670 tests + changelog/build and native ownership/tending browser PASS; schema31; foundation before145; actual165 merge90eb356 integrated; fresh670 tests/changelog/build/browser PASS; await exact-head CI and predecessor Pages42163373128 | data/farmPlots.js, buildings placement, FarmingSystem, GameStateSerializer/Loader schema31, FarmConnections overlay, WorkplacePanel/FarmingPanel, own i18n/tests/browser/docs. Prices and farmer construction stay in145. |
| NEW15 (#143) Workplace staffing output | Codex | `codex/workplace-staffing-output` | [#165](https://github.com/tom161819/Newgame/pull/165) | Merged90eb356 after final-head CI42160766881 and verified predecessor deployment; 662 tests + build/changelog/combined native browser PASS; await own Pages | data/workplaces.js, ObjectRegistry validation, WorkplaceSystem, existing work providers, dev AssetGallery editor, WorkplacePanel, authored data/registry, StableSystem and MilitarySystem speed hooks only, own i18n/tests/browser/docs. Preserve Claude163 Stables smoke. |
| NEW21 (#149) Studio ruins designs | Claude | `claude/studio-ruins` | [#161](https://github.com/tom161819/Newgame/pull/161) | PR open; review only | studio/src/generators/ruins.js (new), art/assets/decorations/ruin*, art/sprites/ruin*, art/approvals.json, art/style-guide.json (soot, charcoal) |

## Kept backups (do not delete without the developer)

- `claude/serene-wright-97oy7k` at `0a48e67`: WIP checkpoint of the alpha policy and renderer switch; fully merged through #3 and #4. Delete it when the developer agrees.
- `backup/master-progress`: Codex stage history; source of `claude/merge-stages-07-08`.

## Done

- 2026-11-06 PR164 / Issue123: merged da21f0c after exact-head CI42158316333;655 tests, changelog/build and Granary/tending browser PASS. Pages42159725044 build+deploy completed SUCCESS in normal failed-job retry (original deployment timed out in GitHub syncing_files, no source failure). Issue123 closed/done. Direct public URL read is blocked by session proxy CONNECT403; no network rule changes or bypass.

- 2026-11-06 PR142 / Issue122: merged232908750f063b17cfabe6ed9121d4278c0bdb22 after exact-head CI42157067169. 646 tests + changelog/build and combined farmer/employment/staffing/seasons browser PASS. Pages42157299626 build AND deploy succeeded for the exact merge, including full browser/save/archive/Studio. Issue122 closed/done.

- 2026-11-06 PR138 / Issue131: employment exclusions merged99ee504, repaired descendant PR151/09df170. Pages42109315944 build and deploy succeeded for09df170 containing both, including the full browser/save/archive/Studio gate. Issue131 closed/done. The exact seasonal pixel failure was reproduced and fixed while keeping the live redraw budget.

- 2026-11-06 [#162](https://github.com/tom161819/Newgame/pull/162) Pages fix (Claude): the fog seam sample searches further out. Merge 65d5202; Pages 42152292448 succeeded.
- 2026-11-06 [#159](https://github.com/tom161819/Newgame/pull/159) NEW22 #150 (Claude): Stone Pavement under finished buildings. Merge faff426; 638 tests, 63 full smokes; deployed by the #162 Pages run.
- 2026-11-06 [#160](https://github.com/tom161819/Newgame/pull/160) Pages fix (Claude): the Stables smoke tames its own wild horse only (Pages for #158 had timed out). Merge a16863b.
- 2026-11-06 [#158](https://github.com/tom161819/Newgame/pull/158) S12 phase D (#57, Claude): Horse Wagon, schema 29. Merge a9aa16f; 635 tests, 62 full smokes, CI succeeded.
- 2026-11-06 [#157](https://github.com/tom161819/Newgame/pull/157) NEW19 #147 (Claude): wall kit shadows on the ground layer. Merge 824c99e; 631 tests, walls/fog smokes, CI succeeded.
- 2026-11-06 [#156](https://github.com/tom161819/Newgame/pull/156) NEW16 #144 (Claude): Developer settings with an FPS overlay (F3). Merge 2e9bbb5; 629 tests, dev-fps smoke, CI succeeded.
- 2026-11-05 [#155](https://github.com/tom161819/Newgame/pull/155) NEW20 #148 (Claude): walls keep their kit pieces after culling. Merge d50c7a8; 626 tests, walls smoke fails without the fix, CI succeeded.
- 2026-11-05 [#154](https://github.com/tom161819/Newgame/pull/154) S12 phase C (#57, Claude): Stables, Stablehands tame horses, Knight on horseback, schema 28. Merge 3126010; 626 tests, 57 full smokes, CI succeeded.
- 2026-11-05 [#153](https://github.com/tom161819/Newgame/pull/153) S12 phase B (#57, Claude): Wheelwright's Workshop and Wheelbarrow, schema 27. Merge 72b751b; 621 tests, 55 full smokes, CI succeeded.
- 2026-11-05 [#139](https://github.com/tom161819/Newgame/pull/139) S12 phase A (#57, Claude): carry by weight, 40 load units per person, schema 25. Merge 3b26275; 611 tests, 52 full smokes, CI succeeded; Pages pending.
- 2026-11-05 [#137](https://github.com/tom161819/Newgame/pull/137) NEW08-B #125: food-chain completion advice via existing diagnostics/bus/panel, merge8871f60. Integrated C08/S11 schema24; 609 tests, changelog/build and chain-notices/C04/pavement browser checks passed. CI42072991047 success for e5d0996; [Pages42073363443](https://github.com/tom161819/Newgame/actions/runs/42073363443) build+deploy succeeded for exact merge, including full browser/save/archive/Studio. Issue125 closed/done. Original commit_refs_rules blockage resolved with ordinary push.
- 2026-11-05 [#133](https://github.com/tom161819/Newgame/pull/133) House (#57 part, Claude): +5 residents per completed House. Merge 8e604c0; Pages 42058257302 succeeded.
- 2026-11-05 [#136](https://github.com/tom161819/Newgame/pull/136) S11 #56 (Claude): Stone Pavement, schema 24. Merge 3c08916; 606 tests, 51 full smokes, CI and [Pages 42073363443](https://github.com/tom161819/Newgame/actions/runs/42073363443) (descendant 8871f60) succeeded. Issue 56 closed.
- 2026-11-05 [#134](https://github.com/tom161819/Newgame/pull/134) AUD78 #102: manual king stone delivery, merge2d9a357. 592 tests, changelog, build:pages, real HUD click/standing/cargo Save/Load and Hauler smoke PASS. CI42057853531 success for09eabd0; [Pages42058257302](https://github.com/tom161819/Newgame/actions/runs/42058257302) build+deploy succeeded for exact merge with full browser/save/archive/Studio gates. Issue102 closed/done. C07/schema22 and House preserved.

- 2026-11-05 [#135](https://github.com/tom161819/Newgame/pull/135) C08 #55 (Claude): Barracks training (Soldier, Swordsman, Archer; Knight locked), Armory kit logistics, line of sight, defence, schema 23. Merge 5737395; 599 tests, 50 full smokes, CI and [Pages 42061820180](https://github.com/tom161819/Newgame/actions/runs/42061820180) succeeded. Issue 55 closed; S11 #56 in progress.
- 2026-11-05 [#117](https://github.com/tom161819/Newgame/pull/117) C07 #54 (Claude): Bowyer, Swordsmith, Armorer and Armory with physical equipment logistics, schema 22. Merge 6284504; 586 tests, 45 full smokes, CI and [Pages 42053330151](https://github.com/tom161819/Newgame/actions/runs/42053330151) succeeded. Issue 54 closed; C08 #55 in progress (Claude).
Completion record: Codex `codex/completion-aud63` updated only docs/COORDINATION.md and docs/CODEX_PROGRESS.md records the successful post-merge deployment; 584 tests, changelog, build:pages and current-only browser smoke PASS. No gameplay or environment configuration changes.

- 2026-11-05 [#112](https://github.com/tom161819/Newgame/pull/112) AUD63 #93: existing idle Hauler collection extended to reachable storage/sites, merge afd5f88fe7eb316b2d1e1f72238eaceee002c304. 584 tests (12 focused), changelog, build:pages and actual browser panel/cargo Save/Load passed; [CI42028197212](https://github.com/tom161819/Newgame/actions/runs/42028197212) success for exact head f2fcc7e. [Pages42028606962](https://github.com/tom161819/Newgame/actions/runs/42028606962) build AND deploy succeeded for afd5f88, including full browser/save/archive/Studio checks. Issue93 closed/done; no other ready Codex Issue found. C07 #54 remains Claude-owned. Schema21 unchanged.

- 2026-11-05 [#111](https://github.com/tom161819/Newgame/pull/111) C06 #53 (Claude): audit and data-only military equipment contract, merged868a2d3 and closed/done by owner. Descendant Pages42025802576 succeeded; C07 #54 is ready and remains agent:claude.

- 2026-11-05 [#109](https://github.com/tom161819/Newgame/pull/109) AUD66 #95: wildlife clearance, merge6181d50; follow-up [#110](https://github.com/tom161819/Newgame/pull/110) c25fc7d repaired the logically invalid fixed fog-smoke sample without changing gameplay. 579 tests and exact-black fog checks passed. [Pages42025802576](https://github.com/tom161819/Newgame/actions/runs/42025802576) completed build, full browser/save/archive/Studio checks and deploy successfully for c25fc7d containing both PRs. Issue95 closed/done.

- 2026-11-05 [#106](https://github.com/tom161819/Newgame/pull/106) C04 #51: production diagnostics and notices (Claude). Issue51 is done/closed; [Pages42016024471](https://github.com/tom161819/Newgame/actions/runs/42016024471) succeeded for df4cac5.

- 2026-11-05 [#108](https://github.com/tom161819/Newgame/pull/108) N12: organic Earth track paths, connected trodden areas, two-pass chunk paint without tile-grid seams. Issue #87 (Claude).
- 2026-11-05 [#107](https://github.com/tom161819/Newgame/pull/107) C05 #52: visible own subject selection, Move/Hold/Resume, schema21 and C04 availability integration. Merge 0b6b163; 561 tests, 43 full smokes and current-head CI passed; [Pages 42019289576](https://github.com/tom161819/Newgame/actions/runs/42019289576) build+deploy succeeded for that exact commit. Issue52 done/closed; only C06 #53 unblocked, keeping agent:claude.

- 2026-11-05 [#90](https://github.com/tom161819/Newgame/pull/90) C03: Auto Employment with Castle Employment Priorities (SAVE_VERSION 20). Issue #50 done and closed (Claude).
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
