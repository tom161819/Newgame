# UI Lab: the game's real interface, restyled and rearranged in the Studio

## What and why

The owner asked for a Studio feature to set up every window, sidebar and bar of the game: move them and their contents,
change text size and font, and pick from several visual styles (look, type and layout). Owner's choices:
- what is set in the Lab must reach the game, not stay a mockup;
- windows dock to fixed positions, and sections inside windows are reordered and hidden;
- four styles: current olive, dark wood and iron, parchment and ink, stone castle;
- texts change position, size and font, not wording.

## Files and systems

- `scripts/ui-lab-capture.mjs` (`npm run ui:capture`) builds the game and starts a new game headless. It saves to
  `art/ui/snapshots/`:
  - `screen.html`: the in-game page, with the map left out and the minimap and icons turned into pictures;
  - `background.png`: the map alone;
  - `panels.json`: 12 windows opened and filled with live data;
  - `img/`: inline pictures, de-duplicated.
- `art/ui/uiConfig.js` is shared by the Lab and the game:
  - **Config format:**
    - tokens: 14 colours, text and heading font, text size, radius, frame line, texture, frame, shadow, headings,
      light;
    - layout: resource bar, buildings bar, settings tab, population tab, notices/events/minimap corner, windows, unit
      panel, camera chips, game title, density;
    - per window: section order, hidden sections, text size (CSS `zoom`) and font.
  - `normalizeUiConfig` cleans untrusted input.
  - `cssVariables` and `rootAttributes` turn a config into `--ui-*` variables and `data-ui-*` attributes.
  - Section keys come from `contentRoot` and `sectionKey`: `#id`, or `tag.class` with a running number.
  - `applyUiConfig(document, config)` applies everything and keeps windows the game fills later in shape with a
    MutationObserver. It returns an undo function.
- `art/ui/ui-theme.css` is the theme layer, loaded after `style.css`. Everything is scoped under `html[data-ui-*]`,
  so without a config the game is unchanged. It holds:
  - token mapping to the game's variables;
  - CSS-only textures (wood, parchment, stone) and frames (rivets, inked double line, carved bevel);
  - controls;
  - light-style text;
  - every dock position.
- `art/ui/presets/*.json` and `presets.js`: the four styles. Three of them change the layout as well:
  - wood: resource bar at the bottom, notices top right, camera top left;
  - parchment: windows on the right, unit panel on the left;
  - stone: buildings bar on top, no title, compact.
- `art/ui/ui-config.json` is the config the game will use, for now the current olive look.
- `art/ui/ui-fonts.js` and new font packages (Cinzel, EB Garamond, IM Fell English), pinned like the existing fonts.
- `studio/ui-lab.html` and `studio/src/ui-lab/*`: the page.
  - The preview is the snapshot in an iframe with the game's CSS, the theme layer and `applyUiConfig`, at 1440 × 900
    and scaled to fit.
  - Drag handles dock parts of the screen.
  - **Tabs:**
    - Style: the four styles plus every token;
    - Layout: the same positions as selects;
    - Windows: sections reordered by drag or arrows and hidden, text size, font;
    - Designs: saved designs, one marked for the game, JSON copy and import.
  - Designs live in the page database `ui/<id>` (`{ config, by, at, forGame }`). The page is linked from every
    Studio page.
- `AGENTS.md` step 10: „převzít UI“ for the Mechaniky chat.

## Implementation decisions

- **Snapshots instead of running the game in the Studio.** The panels need a whole Phaser scene. Snapshots show the
  real markup and content, and `npm run ui:capture` refreshes them when the interface changes.
- **One module in both places.** The Lab and the game share `applyUiConfig`, so the preview is what the game will
  show.
- **Section keys come from the markup** (ids, or classes with running numbers). The game needs no changes to its
  windows, and a key whose element disappears is simply skipped.
- **Docking uses fixed positions** (the owner's choice), so no setting can push a bar off screen at another
  resolution.
- **Light styles** recolour all text in panels to the ink token, and keep good/warning tones through
  `data-tone` and warning/danger classes.

## Save/Load impact

None. The config is a build-time file, not part of a save.

## Testing

- `tests/ui-lab-config.test.js`:
  - the styles are valid and different;
  - the game config is the current look;
  - untrusted input is cleaned;
  - variables and attributes are right, and every switch has CSS rules scoped under `html[data-ui-*]`;
  - the snapshots and their pictures exist.
- `npm run studio:smoke`, UI Lab:
  - the HUD is in the preview;
  - the parchment style applies;
  - dragging the resource bar handle onto the bottom spot docks it at the bottom;
  - in the storage window one section is hidden and one moved;
  - a design is saved locally, and to the page database marked for the game;
  - the page fits a 390 px phone.
- `npm test`.

## Notes for the next agent

- Game wiring (plan `m-ui-lab-do-hry`, Mechaniky):
  1. Import `art/ui/ui-fonts.js` and `art/ui/ui-theme.css` after `style.css`.
  2. Call `applyUiConfig(document, uiConfig)` with `art/ui/ui-config.json` at start-up.
- Windows that only exist after an action (marketplace, construction, farming) are not in the snapshots yet. Add
  them to `PANELS` in `scripts/ui-lab-capture.mjs` with a fixture when needed.
