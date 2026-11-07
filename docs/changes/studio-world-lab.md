# Studio: World Lab

## What and why

World v2, step 1b (brief `zadani-svet-v2.md`, plan `g-world-lab`). The owner wants to try world codes and settings
without starting a new game. The owner also wants to keep favourite worlds and propose the default settings for new
games. The game already has the world code, the settings and generator v2 (Mechaniky). The Studio had no page for them.

## Files and systems

- **New page `studio/world-lab.html`.** Code: `studio/src/world-lab/main.js`, styles: `world-lab.css`. Vite input:
  `world-lab`. Every Studio page has a **World Lab** link in its navigation.
- **`studio/src/world-lab/model.js`** only imports the game's own code: `generateWorld`, `worldStreams`, `mapFromWorld`,
  `fairStartReport`, `reachableTiles` and `worldCode`. For a code it builds exactly the world a new game builds; a unit
  test compares the two. It also provides:
  - **checks:** water %, ford tiles, lakes, tributary, desert %, rock tiles, bushes and reeds, ground reachable from the
    castle, and the fair start (grass, water distance, forest and stony weight near the castle, attempt);
  - **validation** of favourites read from the database;
  - **the default proposal**, in the exact `levels` format `world:sync` accepts.
- **`studio/src/world-lab/render.js`:**
  - the top-down map: ground and grass zones, with overlays for where forests and stones grow;
  - a 28 × 28 isometric window that uses the game's terrain tiles and decorations (rocks, bushes, reeds).
- **The page:**
  - code field (Apply, copy), seed and Random;
  - Water, Desert and Forest presets as in New Game, plus all 12 sliders with their descriptions;
  - Game defaults;
  - Compare with: a second code shows a second map and its checks.
- **Page database:**
  - `worlds/<id>`: favourites `{code, name, note, by, at}`. A code for an old generator is labelled.
  - `worldDefaults/proposal`: `{levels, by, at, note, generator}`. The top bar then says "write ‚převzít svět‘ in the MK
    chat Mechaniky".
  - Without the database, both are kept in the browser.
- **`scripts/studio-smoke.mjs`:**
  - new World Lab section;
  - the phone check now includes the World Lab;
  - the Waiting for my review section first puts three designs back to review in the browser, because every design in
    the repository is now decided.
- **`tests/studio-world-lab.test.js`.**

## Implementation decisions

- **No change in `src/`.** The Lab calls the generator exactly as the game does: `Math.random` plus the code's seeded
  streams.
- **Trees, stones and ore are not drawn.** GameScene places them when a game starts, so the Lab shows where they can
  grow (the forest and stone overlays) and the page says so.
- **The proposal has no seed.** Default settings apply to every new game. Taking it over (`world:sync`) is the
  mechanics chat's step.

## Save/Load impact

None. The Studio does not touch saves or the game.

## Testing

- `npm test`: 926 passing, including the new World Lab test.
- **Studio smoke:**
  - a slider changes the code;
  - a code for another generator is refused;
  - the same code gives identical checks;
  - the isometric window and the map are drawn;
  - a favourite is saved with the reviewer, and an old-generator favourite shows by name;
  - the proposal is saved and the summary asks for „převzít svět“;
  - the page fits a 390 px phone.
- Desktop and phone screenshots checked.

## Notes for the next agent

- On „převzít svět“, Mechaniky reads `worldDefaults/proposal` from the Studio page database (`db_get`) and runs
  `world:sync` with `{levels, by, at, note}`.
- If the generator version changes, old favourites stay listed with the "old generator" label.
