# Approved GPT buildings into the game (second batch)

## What and why
Owner, 13 Nov 2026: "nasaď do hry vše schválené". Studio decisions taken over (48 reviews, 2 preferred). Owner's choices in chat: Fisherman's Hut and Pitch Kiln grow to 3 × 3; the Mill's sails are cut out by Claude so they keep turning.

## Files and systems
- `art/approvals.json`: decisions taken over; preferred = the GPT 0° view for lumber-camp, hunting-lodge, marketplace, pitch-kiln, fisherman-hut, windmill.
- `src/data/objects/approvedArt.js`, `public/assets/buildings/{lumberjack_hut,hunting_lodge,marketplace,pitch_kiln,fisherman_hut,mill}/`: the 0° views.
- `src/data/objects/buildings.js` (Fisherman's Hut) and `src/data/objects/smelting.js` (Pitch Kiln): 3 × 3 with `legacyFootprint: {2, 2}`; art `legacyVisual` at 2/3 for older saves (same mechanism as the Farmhouse, `buildings[].size`).
- Mill: `art/sprites/windmill/windmill-gpt-0.v1.{still,rotor}.png` and `rotor` in its sidecar. `scripts/gpt-mill-sails.py` cuts the upper-left sail arm and repeats it four times around the hub (a symmetric turning cross, the game rotates it in the screen plane); `scripts/gpt-mill-body.py` removes the four arm bands and fills them from the 90° view (aligned by the roof tip, offset −3, −9 px), smoothing the silhouette.
- Tests: fishing (anchors for 3 × 3), torches, approved-art-deploy (fishing hut), world-look-2 (market height), mill-sails, asset-review-manifest.

## Implementation decisions
- The Fisherman's Hut may stand anywhere since 0.32.0 (Fishers walk to the nearest shore), so 3 × 3 needs no shore rule change.
- The rotor image is square with the hub in the centre (`origin 0.5, 0.5`); `pivot` = hub − base.

## Save/Load impact
SAVE_VERSION stays 62; `buildings[].size` now also for Fisherman's Hut and Pitch Kiln.

## Testing
Full `npm test` (1307), `npm run studio:smoke`, screenshots: the four new buildings side by side, the village with the turning mill and the market.

## Notes for the next agent
The Studio DB review documents taken over here were deleted after the release.
