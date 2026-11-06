# Coordination: Claude and Codex

Shared register of active work. Rules are in [AGENTS.md](../AGENTS.md) (section *Collaboration between Claude and Codex*). Update this file in your own task branch: add a row before editing, update it when the pull request opens, move it to *Done* after the merge.

Files held lists the files a task changes. Another task avoids them unless necessary, and then says so here and in its pull request.

## Agreed merge order

**#174 version gate is enforced from release 0.4.0 (M3, Claude PR from `claude/m3-release`).** From then on, every PR into `main` that changes the game (`src/`, `index.html`, `public/` except `public/versions/`, `vite.config.js`) must run `npm run release:prepare -- patch` (or `-- minor` when SAVE_VERSION changes) so it carries the next version and an empty Unreleased. Every PR touching anything outside `docs/` adds `docs/changes/<issue>-<slug>.md` from `docs/changes/TEMPLATE.md`. Check with `npm run version:check`. If two PRs take the same number, the later one merges `main` and prepares the next number. Rules: AGENTS.md *Versions, releases and change records*.

Urgent current Pages repair: Codex right-click smoke isolation first (main9703b37 Pages42190334050 failed in pave-under after real Move fixture leaked), 179/#96 and180/#128 are merged and deployed;183/#130 is next, then124. Restore the smoke snapshot, preserve game commands and all assertions.

PR138/151 and PR142 (#122) have successful actual Pages. PR164 (#123) merged da21f0c and its Pages42159725044 retry completed build/deploy SUCCESS. PR165 (#143) merged90eb356 after exact-head CI42160766881 and Pages42163373128 build/deploy SUCCESS. PR166 and167 have merged and actual successful Pages; see verified Done entries.

Merge order for Codex #96: Claude integration PR178 (d7e7c94), then Codex repeated placement. Necessary overlap: GameScene placement and the shared one-blueprint smoke helper; preserve all Claude panel/minimap/input changes and fresh-site retries.

## Active

Necessary shared-test overlap with Claude197: Codex194 keeps the Needs smoke paused across snapshot/Load and releases pause only after exact Food assertion. A real resumed frame changed15 to15.90275 before the assertion; no Needs gameplay or tooltip logic changes. Preserve197 tooltip checks when integrating.


| Task | Owner | Branch | PR | Status | Files held |
|---|---|---|---|---|---|
| #210 asset review workflow, AR-1 #211 manifest statuses/comments/history | Claude | `claude/asset-review-manifest` | — | In review | studio/src/lib/approvals.js, studio/src/main.js (one constant), tests/asset-review-manifest.test.js, tests/asset-studio.test.js |
| AUD65 #94 Manual rock mining | Codex | `codex/manual-rock-mining` (stacked on124) | [#194](https://github.com/tom161819/Newgame/pull/194) | Implemented; schema36/release0.8.0 after185 actual Pages;750 tests/version/changelog/build + native real-mouse10Stones/ledger/Load/phone/commands/Needs/eventfeed PASS | own rock marking tool/UI, GameScene/GameApplication narrow input/Escape hooks, MiningWork/WorkerAI/WorkplaceSystem/free Miner selection, current schema serializer/loader/terrain validation, XP/SkillSystem, physical Drop/FoodProduction reuse and cargo provenance, i18n, own tests/browser/docs |
| #99 Mill sails turn while grinding (still body + rotor layer from the approved export) | Claude | `claude/mill-sails` | — | In review | studio generator/renderer/export rotor layer, art/sprites/windmill, public/assets/buildings/mill, approvedArt, AssetManager, SpriteViews, MapMemoryRenderer, new game/MillSails.js, GameScene hook, tests, smoke |

## Codex queue (developer: Codex always has several issues queued)

In this order; one `status:ready` at a time. When an issue is merged, verified on Pages and closed, the next one becomes `status:ready`. Whoever sees fewer than three queued Codex issues adds more from the backlog. Claude does this at every check.

1. Done: [#96](https://github.com/tom161819/Newgame/issues/96), [#128](https://github.com/tom161819/Newgame/issues/128), [#130](https://github.com/tom161819/Newgame/issues/130) (0.6.0), [#124](https://github.com/tom161819/Newgame/issues/124) (0.7.0)
2. [#94](https://github.com/tom161819/Newgame/issues/94) AUD65 manual marking of rocks for Miners
3. [#118](https://github.com/tom161819/Newgame/issues/118) NEW01-A Builders' workshop (mechanics; the art stays with Claude in #119)
4. [#98](https://github.com/tom161819/Newgame/issues/98) AUD71-A idle residents sit on a placeholder porch at their workplace (follows #124's central idle rule; porch art stays with Claude in #114)
5. [#132](https://github.com/tom161819/Newgame/issues/132) NEW08-A food building menu order and hut unlocking (moved from Claude's backlog)
6. [#97](https://github.com/tom161819/Newgame/issues/97) AUD69-70 working castle gate; walls reached only through a tower or the gate (mechanics; new gate art via Claude's Asset Studio)
7. [#100](https://github.com/tom161819/Newgame/issues/100) AUD75 world generation: rivers, beaches, desert, bushes (new terrain art via Claude's Asset Studio)
8. [#91](https://github.com/tom161819/Newgame/issues/91) AUD41 Asset Library developer edit mode and balance tools

## Kept backups (do not delete without the developer)

- `claude/serene-wright-97oy7k` at `0a48e67`: WIP checkpoint of the alpha policy and renderer switch; fully merged through #3 and #4. Delete it when the developer agrees.
- `backup/master-progress`: Codex stage history; source of `claude/merge-stages-07-08`.

## Done

- 2026-11-06 Claude: #116 Path renderer V2 in the Path Lab ([#205](https://github.com/tom161819/Newgame/pull/205)), awaiting the owner's preset choice; Pages deploy retries ([#206](https://github.com/tom161819/Newgame/pull/206)).
- 2026-11-06 Claude: #115 Path Lab in the Asset Studio ([#204](https://github.com/tom161819/Newgame/pull/204)).
- 2026-11-06 Claude: #119 Builders' Workshop concepts ([#199](https://github.com/tom161819/Newgame/pull/199)) and #114 porch concepts ([#201](https://github.com/tom161819/Newgame/pull/201)) in the Studio, awaiting the owner's choice; Pages deploy timeout ([#203](https://github.com/tom161819/Newgame/pull/203), ineffective: replaced by deploy retries).
- 2026-11-06 Claude PR197 Needs tooltips and100-resident performance coverage mergedb53b8da731f5e5ad75574fc0e73edfd43e472f07, release0.7.2/schema35. Integrated tooltip assertions while retaining exact snapshot/Load pause guard.

- 2026-11-06 PR185 / Issue124: release0.7.0/schema35 merged03062705c47199386af24d55dfce8ec38a1e4755;743 tests/version/changelog/build and native gathering/Needs/morale/feed/commands/current Load PASS, CI42233028928 SUCCESS. Tag v0.7.0 resolves to exact merge. Actual Pages42233665135 build127965062613 and deploy127965013083 SUCCESS after one backend-only failed-deploy retry; issue124 closed/done. PR194 is the existing next task.
- 2026-11-06 Claude PR195 / Issue101: HUD cargo layout fix mergedc697fd442a4d44a4097cc16561561b65e213fdda, release0.7.1/schema35; source integrated into194, actual Pages remains separately verified live.

- 2026-11-06 Claude: S13 #58 phase C part 1, mood work speed and Happiness in attractiveness ([#193](https://github.com/tom161819/Newgame/pull/193), release 0.6.1).
- 2026-11-06 PR183 / Issue130: release0.6.0/schema34, mergedabc12a11534967e7d0e393c0356c52a668758716 after CI42227943052 SUCCESS.733 tests/version/changelog/build and integrated native demolition/Needs/feed/stockpile/rightclick PASS. Actual Pages42228504161 build127928224031/deploy127941021369 SUCCESS; annotated tagv0.6.0 resolves to exactabc12a1. Issue130 closed/done;124 already in review185.
- 2026-11-06 Claude: #105 event feed and bottom-right corner column ([#192](https://github.com/tom161819/Newgame/pull/192), release 0.5.1).
- 2026-11-06 PR180 / Issue128: merged6ddc7f18484e5b669655b10135b6e10bc0b52996 after exact-head CI42199613796 SUCCESS.701 tests/changelog/build and native stockpile hauling/removal/confirmation/SaveLoad/wear/repeat PASS. Actual Pages42200431522 build127834071595 and deploy127844758887 SUCCESS. Issue128 closed/done;130 already in review183, preserve its claim.
- 2026-11-06 Claude: S13 #58 phase A needs and Happiness ([#191](https://github.com/tom161819/Newgame/pull/191), release 0.5.0, SAVE_VERSION 33). Phases B–D remain; B waits for Codex #124.
- 2026-11-06 Claude: #121 ([#169](https://github.com/tom161819/Newgame/pull/169)), batch [#178](https://github.com/tom161819/Newgame/pull/178) = #129/#126/#120/#104 + smoke fix #176, #174 versions ([#184](https://github.com/tom161819/Newgame/pull/184), [#186](https://github.com/tom161819/Newgame/pull/186), [#188](https://github.com/tom161819/Newgame/pull/188)), **M3 RELEASED 0.4.0** ([#187](https://github.com/tom161819/Newgame/pull/187), archive [#189](https://github.com/tom161819/Newgame/pull/189); tag `v0.4.0` → `375f1aa`; Pages 42214708789 + Verify 42215177100 Success). Codex #128 ([#180](https://github.com/tom161819/Newgame/pull/180)) merged.

- 2026-11-06 PR179 / Issue96: merged1ede1ed210f80dfbe8e50154af62cbc2dc118a22 after exact final CI42195939745 SUCCESS;697 tests/changelog/build and relevant native repeated farm/orchard/Fog/Load/rightclick/pave-under/walls/ownership PASS. Actual Pages42196320133 build127820327813 AND deploy127830563932 SUCCESS for the exact merge, including full simulation/save/archive/Studio gates. Issue96 closed/done.128 already claimed/review in180, never relabel an active task ready.
- 2026-11-06 PR181 Pages repair: merged84f23d5 after final CI42192615092;696 tests/changelog/build and reproduced rightclick→pave-under+current Load PASS. Actual Pages42193129545 build127809725953/deploy127810899847 SUCCESS. Restored fixture world instead of leaking a real Move command; no production command changes or skipped assertions.


- 2026-11-06 PR167 / Issue145: merged0f0b9fa after exact-head CI42168372971 SUCCESS;678 tests/changelog/build and native Farmer establishment/ownership/tending/staffing PASS. Successful descendant df27e0083893ac225716ea4f6f38298398a2bed0 contains the merge; actual Pages42180539823 build+deploy SUCCESS. Original42168689667 Stables failure was repaired by Claude170/173. Issue145 closed/done. Later main35a816d Pages42181480904 failed separately in horse-wagon placement; repair remains Claude176/178.
- 2026-11-06 PR166 / Issue146: merged4e29fe3 after exact-head CI42165693609;670 tests/changelog/build and native ownership/tending desktop+phone+Escape PASS. Actual Pages42166266800 build+deploy SUCCESS, including full browser/save/archive/Studio. Issue146 closed/done. These records also preserve the verified completion work from codex/farming-completion-records; that checkpoint branch stays intact.


- 2026-11-06 Smoke fixture: `placeBlueprint` retries with a fresh free site when a unit steps onto the chosen footprint before the click (Pages run 42181480904 for PR169 timed out in horse-wagon after stables; game refused the occupied site correctly).

- 2026-11-06 [#161](https://github.com/tom161819/Newgame/pull/161) #149 (Claude): Studio ruins designs (soot/charred wood palette) for review.

- 2026-11-06 [#168](https://github.com/tom161819/Newgame/pull/168) #127 (Claude): Asset Studio "Needs review" filter. Merged df27e00.

- 2026-11-06 PR173: Builder gives up a goal tile occupied by a standing unit; fixes the pavement smoke timeout on main's Pages (merge aaa11ab, whose failed-job retry then deployed SUCCESS). 10/10 local pavement smokes PASS (main failed 1 in 3). Merged 733af7d.

- 2026-11-06 [#170](https://github.com/tom161819/Newgame/pull/170) #163 (Claude): Stablehands keep a tamed horse; villagers are never trapped on a shared tile. Merge aaa11ab; stables smoke 15/15.
- 2026-11-06 PR165 / Issue143: merged90eb356 after exact-head CI42160766881;662 tests + changelog/build, native staffing/editor/employment/military/wheelwright/stables and final editor browser PASS. Pages42163373128 build AND deploy SUCCESS for the exact merge, full browser/save/archive/Studio included. Issue143 closed/done.

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
