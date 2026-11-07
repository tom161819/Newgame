# Studio: designs for the temporary store, fisherman's hut, pitch kiln, campfire, village green and ornaments

## What and why

The owner asked the Grafika chat to work through every open Grafika task, with as much detail as possible. Each
building must tell its trade, look different from the others and keep the game's style. This first batch covers the
buildings and ornaments from four plan items:

- `g-docasny-sklad`;
- `g-rybarstvi-grafika`, the hut;
- `g-noc-grafika`, the pitch kiln and the campfire;
- `g-deti-naves-grafika`, the green, swing tree, haystack, well and snowman.

Everything goes to the Studio as Draft for review.

## Files and systems

- **New props in `studio/src/generators/props-village.js`**, registered by the workshop recipe:

  | Theme | Props |
  |---|---|
  | Stockpile | canvas shelter, staked logs, stone pile, tally post, lantern pole, wheelbarrow, ground patch, scattered stones, fence line |
  | Fishing | boat (upturned on trestles or upright with oars), net rack with floats, fish drying rack, fish, fish basket, eel trap, oars, fish smoke hut (glowing), fish sign, landing stage |
  | Pitch | turf tar kiln with run-off trough (glowing), pitch cauldron on a tripod fire, tarred barrels, resinous stump pile, torch bundle, billets |
  | Campfire | burning or cold fire ring, log seat, bedroll |
  | Green | linden or oak tree (summer, autumn, winter), rope swing, swing frame, dome haystack (with snow), roofed stone well (with snow), sweep well, wayside cross, maypole, flower bed, ball, hoop, snowman |

- **New assets** (generator `workshop`):

  | Asset | Size | Variants |
  |---|---|---|
  | `starter-stockpile` | 2×2 | tarp camp store, pole shed with fence, wagon camp |
  | `fisherman-hut` | 2×2 | thatched shore cottage, plank hut with smokehouse, hut on stilts with landing stage |
  | `pitch-kiln` | 2×2 | turf-covered tar kiln, stone pitch oven |
  | `campfire` | 1×1 | burning, burnt-out |
  | `village-green` | 3×3 | linden with swing and well, maypole green, old oak with stone cross |
  | `swing-tree` | 1×1 | summer, autumn, winter |
  | `haystack` | 1×1 | dome, haycocks, winter |
  | `well` | 1×1 | roofed, sweep, roofed in winter |
  | `snowman` | 1×1 | bucket hat, scarf and cap |

  - `pitch-kiln`, `campfire`, `swing-tree`, `haystack`, `well` and `snowman` are not in the game yet; they use
    `plannedGameObjectId`.
  - The swing tree, haystack, well and snowman are under `art/assets/decorations/`.
- Sprites are exported to `art/sprites/<asset>/`.

## Implementation decisions

- **Same footprints as the game.** The starter stockpile and fisherman's hut stay 2×2 and the village green stays 3×3.
  The pitch kiln is 2×2 and the campfire, swing tree, haystack, well and snowman are 1×1, as in the briefs.
- **Seasons as variants.** The briefs ask for autumn and winter looks of the tree, haystack and well, so each season is
  its own variant.
- **Lights.** The smokehouse, the tar kiln mouth, the cauldron fire and the burning campfire use `brazier` lights. The
  stockpile lantern uses a `torch` light.
- **Bug fixed in `PROPS.logs`:** it looped forever when given more than six logs, so all specs now use at most six.

## Save/Load impact

None. These are Studio drafts only.

## Testing

- `npm test` passes.
- `studio:smoke` passes.
- Contact sheets of every new sprite checked at 2×.

## Notes for the next agent

- Characters, animals, the fishing animation and the terrain textures from the same plan items follow in later
  batches.
- After the owner chooses, each chosen design needs a small task for Mechaniky to take it into the game.
