# Fog of War: a soft edge between land in sight and remembered land

## What and why
Owner, 9 Nov 2026 (Grafika chat): "přechod mezi unexplored a seen range vypadá super, přechod mezi seen range and unseen range je však stále ostrý přechod, udělej ho taky plynulý".

The ground took its remembered look (grey, Memory brightness) per whole tile, so the edge of sight was a hard tile staircase. FogEdgeLayer's soft veil lay over it but could not hide the jump in colour.

## Files and systems
- src/game/TerrainRenderer.js:
  - **memoryField(cx, cy):** each known tile counts 0 in sight and 1 out of sight. A 3 × 3 blur (weights 1-2-1) runs over known tiles only. Unknown land does not take part, so ground in sight beside the black edge keeps full colour and remembered ground beside it stays grey.
  - **shadeMemory:** replaces greyRemembered. It samples the field bilinearly per pixel and fades between colour and the remembered grey, so the change takes about 2 tiles. It works in place for a full chunk paint, or from the cached ground over a rectangle for fog patches.
  - **Fog patches:**
    - A changed tile re-shades its 5 × 5 neighbourhood, because the fade reaches 2 tiles. Its own chunk is patched, plus the neighbour canvas when the tile is on a chunk edge.
    - The whole rectangle is shaded again from the cached ground, then the black of unknown tiles in it is drawn again exactly as a full paint does. The shading is linear, so the order does not matter.
    - Pavement in the rectangle makes the chunk repaint instead.
- tests/terrain-invalidation.test.js: the patch reach test is updated.

## Implementation decisions
- **Shade the ground pixels instead of adding an overlay.** The remembered look is a desaturation, which an alpha overlay cannot reproduce.
- **Leave unknown tiles out of the blur.** The edge of unknown land keeps its own look, and a chunk with only land in sight and unknown land needs no shading pass, which saves CPU.
- **Keep sprites per tile.** Bushes, rocks and trees still switch to their remembered look per tile, because they are separate objects.

## Save/Load impact
None.

## Testing
- Browser:
  - The king explored and walked back. Every shown chunk's patched picture was compared with a full repaint of the same state: 26 chunks and 16 791 patched tiles, with 23 pixels differing by 1–4 levels (rounding) and none above 12.
  - Screenshots of the edge of sight: ground fades from green to grey over about two tiles.
- Exploration stress (the king exploring all the time, 9 residents, no GPU):
  - FPS was 33–37 against 40 on 0.84.2;
  - shading took about 100 ms per second.
- npm test passes.

## Notes for the next agent
- The fade width comes from the 3 × 3 blur and bilinear sampling (about 2 tiles). A wider fade needs a wider reach in updateFog (now ±2).
