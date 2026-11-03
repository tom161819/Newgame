# Archive storage, build and runtime review

Additional request after master03. Implementation source: `a4f51ecd936af7678c0822ead4e15c91c0b3e780`. Final public deployment evidence is recorded in UPGRADE_PROGRESS after its actual success. Game version remains0.1.0, Save8; no premature official M1 MINOR/tag.

## Findings

The complete historical deployments were tracked under public/versions in the source repository. At the start of the audit, public main had62 builds and the verified work branch had65:2,008 tracked files and104,297,152 bytes (about113 MiB allocated on disk), including100.7 MB of old JavaScript. Git's existing objects occupied about40 MiB. Old games were **not** recompiled by each ordinary Vite build; they were unnecessarily discovered/copied into its output. Their code was never imported/executed by the active game. The former menu did embed all snapshot metadata and retain65 technical cards even when closed.

All existing source history and immutable snapshots remain. No deletion, force-push, URL change or save-key migration is used to claim a smaller repository. Existing historical blobs remain part of Git; a separate archive-store migration could reduce future source checkout growth, but deleting/moving those originals is deliberately outside this safe change. Ordinary source searches and generated diffs now exclude them instead.

## Implemented improvements

- Ordinary Vite builds have no public-directory discovery/copy of archives. Only current graphics and small generated index/catalog data are written. Full Pages publication/preview composes frozen files separately. Independent copy-on-write copies (ordinary-copy fallback) preserve bytes without writable inode aliases to originals. A conflicting existing snapshot is rejected.
- Actual original package versions, source dates, subjects and evidence are checked using bounded Git batch queries, replacing hundreds of subprocesses without losing provenance checks.
- The Archive catalog loads only after explicit opening. Technical commit cards are created only when expanded and removed on close. Starting a game cancels a pending archive opening. Changelog uses a smaller generated milestone list and keeps Unreleased hidden.
- Official/reconstructed milestones are separated from expandable development commits. Every item displays a semantic archive identifier; original package versions, dates and canonical hashes/URLs remain intact. Raw headings use actual Git subjects instead of repeated signature labels. All68 current records have distinct real names. Completed master01/02/03 changes have actual source-backed history entries27–29; this creates no fictitious official MINOR release.
- The historical exporter excludes nested archived deployments **before** creating its source tar. Only actual selected milestones/tags/requested commits are built by default; all-commits requires an explicit option. Existing snapshots outside a selected range stay preserved. Both CLI argument forms work; unknown options fail rather than silently selecting HEAD.
- `.rgignore` prevents broad discovery of frozen bundles; generated archive diffs are suppressed while preserving the pre-existing `-text` byte protection. Node discovers tests only under tests/. CI opens historical games only for relevant archive/gameplay/release changes, with current-only smoke for unrelated changes. Milestone gates retain full integration, staged site/HTTP and save checks.
- Full source SHA-256 validation is retained. Measured923/767/686 ms for65 snapshots does not justify a more complex and potentially slower network cache or trusting a failed previous CI run.

## Measurements

Same host, same three-build protocol; raw reports in scratch were captured before/after. These are local measurements, not promises about every device or CI queue.

| Measure | Before | After |
|---|---:|---:|
| Ordinary build mean,3 runs | 3,263 ms | 1,206 ms |
| Individual build times | 2,597 /3,560 /3,632 ms | 1,194 /1,204 /1,220 ms |
| Ordinary output bytes | 106,153,350 | 1,949,321 |
| Ordinary output files | 2,055 | 49 |
| Actual source export at8b79627 | 108,789,760 bytes /670 ms | 1,976,320 bytes /65 ms |
| Technical cards retained after closing | 65 | 0 |
| Historical game requests in current play | 0 | 0 |

The fixed-seed (77123),1440×1000 Chromium scenario used the same actual game model and180-frame samples. Warm performance after archive browsing was58.38 FPS before and60.00 FPS after; p95 was16.8 ms in both. Initial samples were47.79/54.27 FPS and included startup work; scene-ready time was4,014/2,255 ms in this single comparison. These show no active-game archive regression; they do not attribute all timing differences to one change. No archived script/graphic was requested. Ordinary current-only smoke also proves zero catalog requests. No game simulation/renderer/system source changed from the completed master03 implementation.

The final complete Pages artifact still includes every frozen game: Pages replaces the entire site on deployment, so retaining unchanged archive bytes in that upload is necessary. This is separate from current-game compilation. Composition of68 builds copied2,161 files /110,184,334 bytes in762 ms in one run; this remaining transfer/storage is not claimed to vanish.

## Verification so far

- 317 automated tests passed; the full integration browser run also passed, including live seasonal graphics, physical construction and cancellation, IndexedDB and real old-save migrations.
- Ordinary cold game, actual movement/pickup/delivery/XP and exact IndexedDB restoration passed with zero historical/catalog requests.
- Archive/milestone counts, expandable numeric snapshot list, specific names, selected linked Changelog, no Unreleased leakage, mobile width and delayed-request/game-start race passed.
- Actual old schema2 and actualfcdb80f schema7 Winter saves loaded into current schema8 without resetting stocks, XP, position or calendar. Real archived databases/localStorage remained isolated. Earliest actual game launched.
- All68 source snapshots and staged manifests match. **All68 canonical play URLs and2,161 HTTP file requests** passed with exact original SHA-256 and correct MIME, including historical scripts/graphics, through the local production server. Source inputs were not rewritten.
- The optimized builder ran actual5074450 and1d9dd46 sources, their own tests/builds and real browsers. Its prior equals-argument parser also created the real8b79627 documentation checkpoint; it is preserved as a technical snapshot, never called a new release. The parser was fixed and regression-tested. A repeat with the intended exact range created0 extra builds and skipped0 failures. Existing65 remained byte-identical.

Public-domain HTTP access is restricted by the execution environment. The final public confirmation must cite the actual successful Pages run/exact deployment SHA, separately from these local HTTP checks. No direct public-domain HTTP request is claimed.

Detailed operating commands: [ARCHIVE_WORKFLOW.md](../ARCHIVE_WORKFLOW.md). After verified publication, resume master04–15 and then Visual without waiting for confirmation.

## Final local candidate

317/317 tests, production build, metadata validation and immutable snapshots pass. The final site contains69 actual source builds and31 logical history entries (1 preserved official alpha plus30 explicitly reconstructed milestones). The optimization's owna4f51ec snapshot ran its own317 tests/build/real browser successfully; zero skipped source builds. All69 canonical play URLs and2212 HTTP file requests pass originalSHA/MIME checks (112632096 bytes received). The final menu/source/IDB/actualold2/7→8/race/mobile regression passes with31/69 counts. The earlier full source integration also passed physical Granary/Farmhouse/field supply/build and cancellation plus live seasons. No original65 snapshot file changed.

The current site composes2212 independent frozen files (112141341 bytes,1261 ms in the final69-build run). Ordinary source builds retain the measured small-output path. Public artifacts must retain that archival payload. All69 aggregate names are derived from actual subjects; source versions remain0.1.0, with unique semantic archive labels.

The release proof's raw Node fetch did not honor this environment's DNS/proxy route. It now uses curl with the configured proxy/CA settings; reading and validating the actual old successful Pages41694834348/e721a68 was proven. This does not bypass the restricted public Pages domain. No confirmation, new environment publication or browser-password login is required for the authorized GitHub publication.
