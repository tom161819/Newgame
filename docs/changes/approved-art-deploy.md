# Deploy the approved Studio art (m-nasadit-schvalenou-grafiku) and the Fisher's loop (m-animace-rybar)

## What and why
Owner request, 8 Nov 2026: the next update deploys everything approved in the Studio. This change wires the approved
art into every game entity that already exists.
- Wild animals: horses (Blender sculpt colours, the saddled bay for the King's mount, the grey in harness for tamed
  horses), deer, wild boars (with the charge pose) and hares (for the game's rabbit, with the sit pose).
- Vehicles: the Horse Wagon by cargo, the Wheelbarrow (plank barrow) by load, and four merchant caravan styles with
  their unloading looks.
- Children: six looks with walk sheets, plus the play key frames.
- Night badges in the event feed and over unlit lights.
- World v2 ground: grass zones, the shore grounds and the shore transitions.
- The Fire Lab building fire.
- m-animace-rybar: a Fisher at his spot plays the approved fishing loop (cast, sit-idle with twitches, and
  bite → reel → store on each catch), facing the water.

Not deployed (no matching entity or mechanic; nothing was invented):
- Fox, roe deer and bear: the game has no such animals.
- Deer calf and piglet: the game has no young wild animals.
- The horse gallop (chestnut-run): no wild horse runs.
- The fur horses: superseded by the sculpts the owner listed.
- The two-horse wagons (pair-barrels, pair-draught): the wagon has one horse.
- The tub, handcart and sack barrows: each comes with only one or two loads and has no empty look, so the barrow would
  change shape with its load.
- Torch brackets: these are concept sprites drawn on their own wall or round tower, and the game has no wall torch;
  the watchtower's holder is painted into its approved sprite.
- Torch flames: the Fire Lab torch values (`fireProposal/torch`) are not approved yet.
- The water edge with foam (shore-ground-water-edge): no ground type uses it.
- The torch and pitch night badges: the game has no place to show them yet.
- child-play-* scene sprites: not in the approvals.

## Files and systems
- scripts/export-approved-art.mjs (new): reads art/approvals.json and copies each approved variant byte for byte into
  public/assets. It writes src/data/objects/approvedDeployArt.js (generated) with the paths, the art sources and the
  origins from the metadata. Re-run it after a Studio revision.
- Deployed folders:
  - public/assets/characters/{wildlife,children,fishing}
  - public/assets/vehicles/{horse_wagon,wheelbarrow,caravan}
  - public/assets/ui/night-icons
  - public/assets/terrain/{grass/zones,shore,transitions}
- Removed: the provisional ford, mud and pebble tiles, and the old v1 caravan files. APPROVED_CARAVAN_ART is removed
  from approvedArt.js.
- src/game/deployArt.js (new): loading on first use (`requestTexture`) and the seeded picks: wild look and pose,
  wagon and barrow variant, caravan style, child look and pose, feed badge.
- Views:
  - AnimalView: `drawWildArt`.
  - KingView: the mount is `ridden`.
  - VehicleViews, CaravanViews, ChildViews.
  - FuelIcons: the no-torch badge.
  - EventFeed: a badge on night lines; CSS in style.css.
- FireViews plus src/game/fireModel.js: a copy of the Fire Lab particle model. Game code never imports Studio code.
  It uses the params of art/effects/fire.json.
- TerrainRenderer:
  - Zone strips per season, blended between zones by bilinear corner masks.
  - Transition tiles for water/grass, water/sand, water/mud, water/rocks and sand/grass.
  - `frameOf` handles "key#frame" refs.
- terrain.js: ford_shallows, mud_bank and shore_rocks use the approved shore-ground tiles.
- src/game/fishingAnim.js (new): FishingAnimator, fishingInfo, waterFacing, fishingSheet.
- HumanView.setFishing; WorkerController calls it for Fishers.
- Tests: tests/approved-art-deploy.test.js, tests/fishing-animation.test.js and the updated caravan test in
  tests/asset-studio.test.js.
- Smoke: scripts/approved-art-smoke.mjs, `--approved-art` in scripts/browser-smoke.mjs.

## Implementation decisions
- **Picks and origins.** Looks and styles are picked by a hash of the entity id, as the walk-sheet animals are, so
  nothing new is saved. Single images face the viewer's right and are mirrored for left facings. Origins are the
  studio anchors.
- **Wagons and caravans.** They are drawn at scale 1 like the standalone horse, which keeps the horse the same size.
- **Wagon cargo.**
  - stone → tumbril;
  - iron ore and iron → ore;
  - wheat → hay;
  - flour and apples → sacks;
  - wood → timber or firewood (by vehicle id);
  - other goods → covered;
  - empty → farm-empty.
- **Barrow loads.** stone, wood, ore, iron bars, fish, meat and bread have their own load; the rest use the mixed
  load.
- **Caravans.** Each caravan picks one style: plain, striped, house or pair. While trading it shows the unloading look
  where the style has one. With no goods it shows the empty look, and a style without one uses its full look.
- **Children.** The look is `look % 3` within the child's sex. An activity shows the look's own key frame only:
  another look's frame would change the child's clothes. Without a key frame the child plays the walk sheet.
- **Grass zones.** Zone textures replace the zone tint washes. Zones fade into each other through corner-share
  bilinear masks, so there are no diamond edges.
- **Shore transitions.** Spring and summer only. Each transition tile is split into pure outer pixels (equal to tile
  0), pure inner pixels (equal to tile 15) and the band. The pure pixels are redrawn with this map's own textures, so
  only the band (foam, rim, dry grass) comes from the tile and nothing seams. The shore is drawn before the bank
  rounding.
- **Fire.**
  - The game intensity scales the flame birth rate.
  - Spots are spread along the roof.
  - The simulation only runs in sight and on screen.
  - Without a canvas (tests) the old drawing stays.
  - Charring is not applied to the building sprite.
- **Fishing.**
  - Clips play at 5 fps from meta.anim.
  - The twitch comes every 4–10 s, from a mulberry seeded by the resident.
  - A catch (`task.caught` rises) starts bite → reel×3 (as in the approved loop) → store → cast.
  - The Fisher faces the water: the sum of the water neighbours.
  - Frames only change while he is visible and on screen.
  - FishingSystem is untouched, so the catch rate is unchanged.
  - The last fish of a basket ends the trip at once, so its sequence is cut short; holding him there would slow
    fishing.
- **Fallbacks.** Every view keeps its procedural drawing while the art loads or if it fails.

## Save/Load impact
None. SAVE_VERSION stays 59: every choice is derived from ids and seeds.

## Testing
- `npm test`: all tests pass, including the new art-deploy and fishing-animation tests:
  - sha256 equality with art/ and origins from the metadata;
  - nothing unapproved in the deployed folders;
  - clips by state and the catch sequence;
  - fish per day are the same with and without the animation;
  - the fallback without the sheet.
- `npm run build -- --base=/Newgame/`, then `node scripts/browser-smoke.mjs --current-only --approved-art`. It checks
  no 404s, the Fisher loop through a catch, Studio looks on all horses, deer, boars and hares, the wagon and barrow
  art, the zone and transition strips, the feed badge and the Fire Lab fire.
- Screenshots: /tmp/shots/approved-art-*.png. Related smokes were run alone.

## Notes for the next agent
- After a Studio revision of these assets, run `node scripts/export-approved-art.mjs` and then the tests.
- The deep/shallow water edge (roundDeep) is still procedural.
- Possible follow-ups: young wild animals, fox/roe/bear entities, wall torches, the torch fire once
  `fireProposal/torch` is approved, and building charring from `char`.
