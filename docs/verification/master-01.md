# Master 01 / 29A — verified version history and release foundation

Implementation source: `fcdb80f2ab1ded774a76f3928fd6fdfe9c3bf265`.
Game version remains `0.1.0`; save schema remains `7`. No release number or tag was created for this stage.

## Result

- One generated catalog combines authored CHANGELOG entries, actual Git provenance and verified immutable snapshots. Main-menu Version Archive, collapsible Changelog, generated JSON and static `/versions/` all use it.
- All historical package versions were actually `0.1.0`. Keep that original number. Twenty-six source-verified milestones have explicit reconstructed SemVer build labels `0.1.0+archive.N`; the existing official alpha is unchanged. Technical snapshots use `+git.FULL_SHA`, current development uses `+dev.FULL_SHA`, and neither becomes an invented numbered release.
- Names, dates, descriptions, actual full SHA, archive URL, release type and reconstructed labels are consistent. Missing builds have no Play action. All original archive URLs are preserved. Evidence files for each historical milestone are recorded in [historical-version-evidence.md](historical-version-evidence.md).
- Completed Unreleased changes remain hidden from players. The existing official-version NEW indicator still compares only actual official releases. Archive links open real frozen code, with the pre-existing IndexedDB/local/session storage isolation wrapper.
- Portable Chromium smoke uses locked Playwright Core and an explicitly detected installed browser. Browser absence fails instead of silently skipping. CI has full Git history, validates the catalog and runs the actual browser test after the Pages production build.
- `release:gate` and `release:verify` implement the checks in [RELEASE_CHECKLIST.md](../RELEASE_CHECKLIST.md): actual completed-stage ancestry, clean source, real successful Pages run/full SHA, source equality, clean installation, full regression tests, save migrations, immutable archives, production build and browser smoke; final verification checks the actual remote tag and exact archived source tree. These gates do not themselves bump, commit or publish. M1–M5 are still pending and have not been declared released.

## Actual verification

- `npm ci`: passed (locked dependencies).
- Full regression suite: **282 passed, 0 failed, 0 skipped** (271 prior plus 11 catalog/release-gate scenarios).
- `changelog:validate`: passed, 1 original official entry and 26 reconstructed milestones; no release bump.
- `versions:validate`: passed; archive metadata comes from actual commits, dates and original source files.
- Production build with `/Newgame/`: passed. Existing large Phaser bundle size advisory remains; no build error.
- Actual Chromium: menu archive, milestone/snapshot counts, original Play URLs, selected View Changes, collapsible notes, no Unreleased content, authoritative version labels, mobile width and static archive.
- Actual gameplay: New Game, mouse movement and stone pickup, king cargo before inventory credit, real physical delivery and one reward. IndexedDB save during transport restored **the entire serialized state exactly**, then completed delivery once.
- Actual original official archive (`e8d41eb`, save schema 2): launched its frozen source, saved in a separate real IndexedDB database, and cleared/changed its own localStorage without affecting the current database or settings. The actual old state loaded into current schema 7 with preserved time, royal position, stone stock and XP. Earliest actual prototype also launched.
- Archive builder: **65 playable source snapshots, 3 new, 0 skipped** through the implementation commit. New source exports `e721a68`, `8ba14e1`, `fcdb80f` each ran their own tests, build and browser. The current export proved catalog generation works without `.git` and without nesting other playable builds. The original 62 snapshots were unchanged and all SHA-256 manifests pass.
- Existing regression scenarios include construction completion/cancellation, physical logistics, reservation conservation, multiple NPC, FoW and save migrations. No gameplay model changed in this stage; the previously measured step-24 performance baseline is documented in [step-24.md](step-24.md).

During development, an old-browser wait initially expected a later food system that did not exist in schema 2; it was corrected to wait for the actual old character. The complete browser scenario then passed, including the actual schema-2 migration. Restricted-shell subprocess denial was resolved by running the authorized test command with the execution permissions needed by its CLI tests. Neither case was treated as a skipped success.

The source and archives are backed up to `backup/master-progress`; public main remains the verified step-24 deployment until the M1 release gate. Direct HTTP access to the public Pages domain is restricted by this environment, so no such HTTP check is claimed. Prior public deployment `41694834348` was verified Success for `e721a68`; new milestone deployment evidence will be checked at its gate.

Next: stage 02, building categories and unlock requirements, automatically in the prescribed order.
