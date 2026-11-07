# Studio: three new castle designs for review

## What and why

Plan `g-hrad-nova-grafika`. The owner asked for a new look for the castle without giving a direction, so the Studio
offers three different approaches. The owner chooses one, and the game keeps its current procedural castle until then.

The three approaches:

1. **Stone castle with corner towers (`castle-curtain`):**
   - curtain walls with battlements and four round towers with cone roofs;
   - the front tower is crenellated and holds the king's platform;
   - a gatehouse with a portcullis;
   - a palace with a tiled roof and the banner.
2. **Castle with a bergfried (`castle-keep`):**
   - a tall square keep with the platform on top and a high timber stair;
   - low walls with a gate between two towers;
   - a timber hall and a stable in the bailey.
3. **Early stronghold on a mound (`castle-motte`):**
   - an earth mound with a palisade;
   - a stone hall and a timber tower that holds the platform;
   - a gate with a ramp.

   This one is closer to the start of the game.

Every design has:
- the kingdom banner;
- the gate on the +Z side, where people gather in front of the castle;
- two gate torches;
- windows that glow at night.

## Files and systems

- **New generator `studio/src/generators/castle.js`** (v1). It reuses the `house` recipe for the palace and the halls.
- **New asset `art/assets/buildings/castle/asset.json`:**
  - `gameObjectId: castle`;
  - footprint 3 × 3, the same as the game.
- **New light type `window` in `art/style-guide.json`:**
  - a warm glow with `flameSize: 0`, so there is no flame;
  - the game's light system already draws lights from the sprite metadata, and a flame size of 0 draws nothing;
  - the style guide's version is unchanged.
- **Exported sprites in `art/sprites/castle/`:**

  | Design | Size (px) | Height above ground |
  |---|---|---|
  | curtain | 212 × 222 | 159 px |
  | keep | 198 × 252 | 180 px |
  | motte | 195 × 233 | 166 px |

  The game's castle has a `visualHeight` of 235 px, so the limit is +20 % = 282 px. Each export also has a `.front.png`
  with the merlons and stakes in front of the platform.
- **`tests/asset-studio-castle.test.js`:**
  - footprint the same as the game;
  - height limit;
  - platform;
  - banner;
  - two gate torches on +Z;
  - lit windows.

## Implementation decisions

- **Footprint and gate side unchanged:** saved games, the gathering ring and the stockpile next to the castle stay valid.
- **Lit windows as a light without a flame:** they need no game code. Their light pools are kept small (0.9 tile).
- **No Blender bake.** The rendered recipes already match the approved stone buildings: the barracks, the watchtower
  and the walls.

## Save/Load impact

None. The game is unchanged until one design is approved and taken over.

## Testing

- `npm test` passes, including the new castle test.
- `studio:smoke` passes.
- Checked by eye:
  - the Studio cards at day and night;
  - the scene tab with all three designs, torch posts and figures;
  - a comparison of today's castle and the three designs next to the wall gate.

## Notes for the next agent

- **After the owner chooses:** run the export, then add a task for Mechaniky. It covers:
  - the sprite and `origin` from the json;
  - `visualHeight`;
  - `platform` from the json's `platform`, replacing today's `{x:0,y:-168}`;
  - the front layer for the king on the platform;
  - the lights (`window` and `torch`);
  - `renderMode: 'sprite'` instead of the procedural `fortification`.
