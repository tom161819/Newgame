# 97 – Gate passage and access to wall walks

## What and why
A gate allows two-way ground passage along its opening axis, between solid pillars. The King reaches and leaves a joined wall walk through a completed reachable tower or gate; a plain wall has no independent ladder.

## Files and systems
Two explicit gate orientations use the central object registry and ordinary construction, footprint reservation and demolition. Shared buildingGroundOpen keeps placement, completion, current Load and saved solid-tile validation aligned; roof routing reuses the existing grid/path movement and PlayerController.

## Implementation decisions
A3×1 or1×3 footprint leaves only its middle cell open after completion, so ordinary corner rules prevent crossing pillars sideways. Six Stone and20s base work price the gate between a1-Stone wall and10-Stone Tower; no open/close state or one-way trap is added. Roof cells connect through shared edges, including tower platforms; height offsets blend during ordinary movement. GateView composes the existing approved wall kit, cropping only the lintel instance at runtime; no new final gate sprite is introduced.

## Save/Load impact
SAVE_VERSION38 admits new gate types and a saved deferred roof order during ground approach/climb; there are no migrations. Current Load must preserve gate collision, the real pending access/target and partial ascent/descent without teleporting or allowing ground traffic to collide with a roof actor.

## Testing
WIP:13 focused gates/walls tests pass, covering actual physical gate construction, both passage directions, solid pillars, completed/reachable access, disconnected roofs, corners/T branches, tower bridging and partial-climb Load. Broader regression fixes, validation hardening, native screenshots, release0.10.0 and mandatory full checks remain pending; this is not ready to merge.

## Notes for the next agent
Explicit stack194→196→198→200→97, actual Pages before each successor merge. Preserve existing Castle/Tower behavior and approved art. Final new gate artwork belongs to Claude’s Asset Studio workflow; no environment configuration or Publish is used.
