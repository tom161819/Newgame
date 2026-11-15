# Paving edges: loose kerb stones instead of a straight cut

## What and why
Owner 15 Nov 2026 (with a screenshot): where paving touches grass or the dirt of a path, the edge was cut with a ruler (a dark straight kerb line on the tile diamond). He asked for a slight overlap and an uneven edge.

## Files and systems
- `src/game/cobbles.js` `drawCobbles` – only this function. Callers (`TerrainRenderer` ground chunks, `PavementView` blueprint texture) are unchanged.

## Implementation decisions
- An **open side** (no paving behind it) is pulled in by 2.5 px for the mortar fill and the regular stones, so the grey base no longer ends on the diamond line.
- Along each open side five **kerb stones** are drawn without the clip: position along the side, distance in or out (−2 … +4 px), size, turn and an occasional gap come from a hash of the tile, the side and the index. Each has a soft shadow on the ground. They overlap the neighbour tile by a few pixels.
- The dark straight kerb line is gone.
- A **joined side** (paving behind it) now bleeds 0.8 px outwards. This removed a hairline of ground that showed between paved tiles painted on different ground chunks (visible in the "before" picture as a faint line through the paving).
- Everything is deterministic (hash), so a repaint of a chunk gives the same stones.

## Save/Load impact
None.

## Testing
Full suite. Browser harness /tmp/perfdiag/pav.mjs: an L-shaped paved area, single tiles and a diagonal pair; before/after pictures compared.

## Notes for the next agent
- Stones that reach over a chunk border are cut by the chunk canvas only if the canvas has no margin there; none was seen in the test picture.
- The blueprint preview calls `drawCobbles` without `edges`, so it keeps a clean diamond (with the small bleed).
