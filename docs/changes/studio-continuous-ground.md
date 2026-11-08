# World Lab – souvislá zem (prototyp, g-souvisla-zeme)

## What and why
Owner's concept 8 Nov: grass repeats per tile and the diamond grid shows. Prototype of ground painted as one surface.

## Files and systems
studio/src/world-lab/ground.js (new), render.js (drawIso `ground` option), main.js (A/B switch, sliders, proposal to `groundProposal/default`), world-lab.html, world-lab.css.

## Implementation decisions
World-space grass detail (197 × 151 px field, not a divisor of the tile size), fbm patches (size and strength sliders), zone weights blended bilinearly at a noise-warped position (transition width slider), zone speckles (flowers, straws, pebbles, leaves). Only grass tiles are painted; other grounds keep their tiles. No baked shading.

## Save/Load impact
None.

## Testing
studio build, World Lab screenshots A/B, studio smoke.

## Notes for the next agent
After approval the game part is m-souvisla-zeme: same maths per 16 × 16 chunk into a cached canvas in TerrainRenderer; settings from `groundProposal/default` („převzít zemi“).

### Round 2 (owner 8 Nov)
- Colour picker per grass zone (6 shades), slider "Shades flowing into each other" (ring-averaged zone weights).
- Plants drawn on top, each with its own slider: small and large flowers, thistles, small shrubs, three tall grass tufts (green, dry, dark sedge), plus plant size; they prefer suitable zones and zone borders.
- Time of day (dawn, day, dusk, night), season (spring – winter with snow cover) and weather (clear, overcast, rain, fog, snow) for the view.
