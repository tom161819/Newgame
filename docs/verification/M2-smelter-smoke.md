# M2 native fixture corrections — VERIFIED

Starting point: mainb554b4e, which merged archive PR18. Source PR15's actual
Pages run41877748443 now reports Success for7595b80. The subsequent formal M2
gate passed its first8commands (ci, both validators,455model tests, archive SHA,
build, archive composition,72URL/2385file HTTP verification) but its full native
run timed out at smelting-smoke's second sequential wait.

The original test waited for any Hauler cargo, then for a partially worked
Smelter cycle. That ordering is not guaranteed by the real AI: Operators supply
their own inputs if a carrier is not ready, and a Hauler's first cargo can be
the already finished Iron Bar. Looking for that completed cycle afterwards can
never succeed. An isolated original native scenario passed; a diagnostic rerun
of the unchanged full scenario also passed the Smelter stage with Ore as the
first Hauler cargo. Those results establish timing sensitivity; no failure
snapshot from the initial timeout exists, so do not invent its exact state.

Deterministic model reproduction uses two Operators at a Smelter and a Hauler
physically arriving from70,65. Real AI starts the batch before that arrival;
the carrier first carries iron_bar after completion, with exactly one product,
three material receipts and10shared Operator XP. The regression also roundtrips
current Save14 with that loaded carrier and confirms delivery without copied
materials or repeated XP/receipts.

Fix: let the assigned Hauler physically reach its Warehouse before making
inputs available, then observe actual carried Ore/Wood and partial work in a
single polling window. Assert both physical input types. Keep the former total
45s+60s travel budget and all existing price,40s work,AutoOFF,IndexDB,XP,receipt,
Hauler-output and Fog checks. No production logic or game state is changed.

The diagnostic old full suite subsequently passed every scenario through the
food/unlock construction chain, then failed creating the cancellation-test Tower.
The captured actual snapshot has10Stone, no stuck cargo/reservations and a valid
completed Granary/Field; its screenshot shows the Granary's staffing dialog open
instead of a Tower blueprint. The helper clicked a real Missing Workers DOM
overlay after centering the camera. Fix the helper to settle the new camera and
probe document.elementFromPoint, selecting only an exposed canvas point within
the same anchor diamond. Use ordinary mouse input and never click through or
disable the real staffing controls. Replay the captured state for verification.

The real captured failure state now replays successfully with the helper:
ordinary input hits CANVAS, creates a planned2x2Tower, normal cancellation
restores exactly10Stone, and the Granary staffing button remains interactive.
The full native construction scenario also gets a permanent30px test-only DOM
control covering the centre of the anchor; placement must use exposed canvas
without activating or disabling that control. The fixture is removed before
normal Tower inspection/cancellation and is never shipped in the game.

Results so far: dedicated Smelting models and all456model tests pass,0fail/skip;
changelog/catalog validation and diff checks pass. The revised native
`--smelting` suite exits0, including both carried inputs, partial cycle/Bar-cargo
Save14,AutoOFF,10sharedXP,exact receipts,Fog,current movement,old-schema refusal
and isolated historical saves. The actual captured blueprint failure replay
also exits0. The complete revised `--full` run is next. No player Changelog entry
is added for test-only work. No source asset, graphic, Save schema or existing
archive changed.

Completed verification: source9d0a6d4 passed the full corrected native suite,
including the permanent obstructing UI control. After Claude's PR19 landed,
main630caf1 was merged normally as8b118e4; only COORDINATION conflicted, resolved
by retaining both authors' active/done work. Game/Studio/art files are byte-for-byte
the merged main versions. The combined source passes459/459models,0fail/skip,
changelog/catalog checks, build:pages, all72canonical archive URLs/2385HTTP files/
119054931bytes/SHA/MIME, the complete native suite including gradual seasons,
exact mid-transition Load, both fixture corrections, and Studio smoke in
Canvas/WebGL/mobile. Each actual command exits0. No failed run is relabelled.

Finalization now moves Claude's already merged/verified V01 note from Unreleased
to the existing0.3.0 candidate; there is no second MINOR bump and no player entry
for test-only corrections. Cut an actual source commit after this metadata change,
preserve the old unpublished f053 tag reference, prepare the final local tag and
add its real immutable archive. Preserve all72prior snapshots and publish no tag
before the final source is merged and actual release/deployment gates permit it.

The v0.3.0 tag remains local at f053be1 and is absent remotely. Do not push that
provisional tag while the final source includes this unmerged script correction.
After the correction is merged and passes the real deployed-source gate, cut
the final release source. Preserve the unpublished candidate reference before
refining the local final tag; never move or force-push any published tag. Keep
all72existing snapshots immutable, including candidate f053be1. If a new final
source archive is needed, add it from that real commit and verify it normally.
Do not weaken the source comparison or mark M2 RELEASED early. Master11 and
C01–C08 have not started; the new queue remains after the original master15.
