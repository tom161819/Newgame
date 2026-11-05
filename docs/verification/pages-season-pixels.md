# Paused season repaint regression

Inherited failure: Pages42104657917 on maina6442d5 passed the earlier full scenarios, then seasonsMenuSmoke line19 failed the exact winter chunk pixel hash after Load/resume (3218124183 vs707580948). Reproduced independently with `--current-only --seasons-menu` on main99ee504; the assertion was unchanged.

Root cause: SeasonTransition.flush(Infinity) emptied its own queue while TerrainRenderer's optimized repaintDirty still painted only two already visible dirty chunks. Paused scenes do not receive later simulation frames to complete that queue. The pre-Load picture could therefore remain at an earlier transition step while a fresh draw used the correct blend.

Fix: explicitly propagate `immediate:true` from an infinite flush to invalidateChunksOf. The renderer drains the visible queue for that explicit request. Normal finite batches keep the original two-chunk budget. No map memory, discovery, data or schema behavior changes; no relaxed pixel tolerance.

Evidence: explicit complete-draw regression failed before the change (four dirty visible chunks remained), passes afterward and still asserts the normal budget of2. The exact native seasons-menu pixel/IndexedDB test fails before and passes after. Existing transition tests pass. A small `--seasons-menu` selection enables targeted reproduction with the same actual browser assertions as the full suite.

Validation: 618/618 tests, changelog:validate, build:pages and --current-only --seasons-menu --season-transition --fog PASS. The native test assertions are unchanged. A concurrent Claude branch fow-performance-pixels adds test wait guards; those can coexist, while this change restores the explicit complete-draw contract during a paused simulation. No edits to that branch or its fog/seasons test files.
