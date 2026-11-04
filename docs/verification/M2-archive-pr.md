Adds the playable M2 v0.3.0 archive from the actual merged source f053be1,
with a matching source-tree manifest and isolated historical saves. All71previous
builds, public paths and save namespaces stay unchanged. Also preserves the
user's original CODEX_MASTER.md and queues C01–C08 after M2 and before deferred master11–15
per the latest user reorder; no follow-up mechanics or unapproved graphics are implemented here.

Validation:455/455 tests on the exact archived source, production build and real
Chromium startup; SHA integrity and changelog/catalog validation; full native
suite on the merged game; final Pages build and archive browser smoke with
33milestones/72snapshots;72canonical HTTP paths/2385files/119054931bytes with
correct hashes/MIME; Studio smoke including Canvas/WebGL and mobile. Save14
gameplay/schema is unchanged; snapshots retain isolated storage.

Publication prerequisite: Pages run41877748443 for main7595b80 is still Queued;
the formal M2 gate correctly refuses missing Success. The v0.3.0 tag is prepared
locally at f053be1, not yet published. Keep this PR draft until the actual gate
passes and that exact tag is pushed, then mark ready and merge normally. Verify
its actual Pages deployment and release:verify before claiming M2 RELEASED or
starting C01–C08, then deferred master11–15. No new release approval is required.
