# Fog of War: no dark line at the edge of sight

## What and why
Owner, 9 Nov 2026 (Grafika chat, screenshot): "furt je tam ta linka - kde končí stmívání dostupného pohledu a za ním je zase světlá oblast, odprav to".

Since 0.85.1 the continuous ground fades from colour to the remembered grey by itself. FogEdgeLayer still darkened the visible side of the border toward remembered land, to a fixed grey. The two fades were stacked: the edge became darker than the remembered land behind it, so it looked like a dark line.

## Files and systems
- src/game/FogEdgeLayer.js: with `terrain.groundStyle === 'continuous'`, the mask target of remembered tiles is 0, so the layer only fades toward unknown land and the map edge. The tile ground style (dev switch) keeps the old fade toward remembered land. The ground style is part of the mask cache key.

## Implementation decisions
- **Keep the edge toward unknown land.** The owner said that transition looks good, so it stays unchanged.
- **Leave the terrain fade as the only fade toward remembered land.** It is drawn into the ground, so it matches the remembered look exactly.

## Save/Load impact
None.

## Testing
- Browser screenshot of the edge of sight after exploring and walking back: green fades smoothly to the remembered grey with no darker band. Before the fix the same scene showed the band.
- npm test.

## Notes for the next agent
- If the tile ground style becomes the default again, FogEdgeLayer fades toward remembered land again by itself (memoryFade).
- Trees, bushes and rocks still switch to their remembered look per tile; only the ground fades.
