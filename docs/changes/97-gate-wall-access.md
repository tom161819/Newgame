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
778 full tests and35 focused gate/wall/current Save/registry/category checks pass, including physical construction in both orientations, solid pillars, reachable access, disconnected roofs, corners/T branches, tower bridging, height continuity, partial-climb Load and atomic rejection of forged access/path data. Version policy0.9.2→0.10.0, changelog validation and production build pass. Complete native real-menu/mouse placement and actual supply/build, two-way ground passage, partial climb/descent Load, tower roof bridge, disconnected rejection, frozen Fog memory and desktop/phone screenshots pass; screenshots were visually inspected. Native testing exposed stale roof-cache preference, now corrected with a regression, and valid Gate redraw uses the original whole building rather than a virtual roof cell.

## Notes for the next agent
Explicit stack194→196→198→200→97, actual Pages before each successor merge. Preserve existing Castle/Tower behavior and approved art. Final new gate artwork belongs to Claude’s Asset Studio workflow; no environment configuration or Publish is used.
