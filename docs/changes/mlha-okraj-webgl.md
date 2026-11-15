# Fog edge in WebGL (0.138.6)

## What and why
Owner 15 Nov ("zase tam při startu hry vzniklo tohle", screenshot): after WebGL became the default, the start of a game showed a bright jagged strip of ground outside the soft dark fog edge. The WebGL path of FogEdgeLayer drew its mask as a rotated, cropped image inside a scaled container; in WebGL the mask landed in the wrong place or was cut to a rectangle.

## Files and systems
`src/game/FogEdgeLayer.js`: `gpu=false` – the screen-space path (projected cache, texture refreshed after each projection) runs in WebGL too.

## Implementation decisions
The screen-space path is the one tested and right in Canvas; it uploads a screen-sized texture when the camera moves, which is cheap. The rotated GPU code stays in the file for a later look.

## Save/Load impact
None.

## Testing
Full suite; browser in WebGL (SwiftShader): new game start and a panned camera show a soft edge without the strip; before the fix the strip was reproduced.

## Notes for the next agent
If the GPU path is wanted again, check Phaser's crop of a rotated image inside a non-uniformly scaled container first.
