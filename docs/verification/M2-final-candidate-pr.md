Finalizes M2 v0.3.0 with a frozen playable archive of actual source
02a3a43ace8adc993aea7a392424d7cdf4e7dec9. Preserves Claude’s merged seasonal,
ground and production-building graphics, approved trees and scaffolding through main2663942, including eight-direction villager art, plus the military
Studio concepts. The later ground/building work stays Unreleased; M2 source02a
and its archive remain unchanged. No extra MINOR bump.

Makes the native Smelter check observe physically carried inputs alongside
partial work, and makes blueprint clicks settle the camera and use genuine
exposed canvas points. Permanent regressions cover a late Hauler and an actual
obstructing DOM control. No gameplay or Save14 model was rewritten by Codex.

Final release verification now reads all archived blobs from the actual
successful deployment’s Git commit and compares exact files/SHA-256, including
the manifest and version-index provenance. Newer live development is allowed;
an old deployment plus an archive present only locally fails. The public tag,
source tree, package version, released notes and playable catalog remain checked.
The actual public catalog/manifest must also match, so a pre-tag build cannot
pass using only a local catalog. Preflight still requires matching deployed live
source and all nine checks.

Validation:477/477 tests,0fail/skip after the villager integration; changelog/catalog/archive SHA validation;
Pages production build;73canonical URLs/2456HTTP files/121455383bytes/MIME/SHA;
Studio Canvas/WebGL/export/mobile smoke. Real Git fixtures cover corrupted,
missing/extra/symlink archive files and stale deployment metadata. All71files
of the actual02a archive pass the new Git-blob verifier locally. The frozen
source independently passed459tests/build/Chromium. Full current-game native
integration after approved-ground/building merges exits0, including production,
Fog/zoom,Population200,seasons,physical construction/cancellation,Save14 and
historical-game storage isolation. The later tree-only merge also passes targeted native zoom/Fog/season-transition/
forestry plus current Save14/historical games. The subsequent scaffold-only merge
also passes native Fog/scaffold memory/blueprint/menu/current IndexedDB/historical
games. Production logic stayed unchanged; no archive was recut.

All72previous snapshots/URLs/save namespaces are unchanged. No public tag was
pushed or moved; local v0.3.0 remains prepared at02a. After actual main merge and
Pages/gates, publish only that tag, run a tag-aware Pages build and release:verify,
then mark M2 RELEASED and continue C01–C08 before deferred master11–15. The user reordered the queue to M2 → C01–C08 → master11–15; all future tasks
remain unstarted, with the deferred Stables/Knight dependency recorded.
Autonomous milestone publication is already authorized.

Manual-merge follow-up: the screenshot's COORDINATION conflict after PR28 is
resolved and pushed as8a2fed5. Native Population200/Fog/current Save14/historical
games and updated Studio Canvas/WebGL/export/mobile pass on the combined code.
Wait for green GitHub Checks and use a merge commit; the API remains blocked.
