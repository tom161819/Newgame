# Studio: Buildings in game with price proposals (#91, plan g-studio-ceny-budov)

## What and why

The owner wants one place where all the game's buildings and their prices are visible and where he (and anyone with
Contributor access to the Studio page) can propose a new price. The game's code stays the only source of truth: a
proposal is a shared database document that the Mechaniky chat applies with `npm run prices:sync` when the owner writes
„převzít ceny“. The Asset Library and `prices:sync` already use the same format (0.9.4).

## Files and systems

- `studio/buildings.html`, `studio/src/buildings/main.js` and `buildings.css`: the new Studio page **Buildings in
  game**. It is linked from the nav of every Studio page and built as a fourth entry in `studio/vite.config.js`.
- `studio/src/lib/buildingPrices.js`: pure logic.
  - The table comes from a fresh `ObjectRegistry` over the game's definitions: construction menu categories and order,
    footprint, default price, sprite and Studio asset link, and the resources a price may use (`costResources()`).
  - Draft editing: change an amount, add a resource, remove a resource (never the last).
  - Untrusted shared documents are validated; the newest proposal per building wins.
  - The hand-over JSON.
- `scripts/studio-game-buildings.mjs` (`npm run studio:game-buildings [out.json]`) prints the same table, for chats
  that want to check the data without a browser.
- `scripts/studio-smoke.mjs`: a new Buildings in game section; the page is added to the phone check.
- `tests/studio-building-prices.test.js`.

## Implementation decisions

- The page imports the game's object definitions at build time, as the rest of the Studio already does. That is why
  it always shows prices from the code it was built from. The spec's `studio/data/game-buildings.json` file would be
  a second copy of the same data, so the script prints the table on demand instead of feeding the page.
- Database: collection `prices`, document id = building id, data `{ buildingId, cost, by, at, note }`, where `cost` is
  the whole new price. The page's existing rule (`read: view`, `write: interact`) covers it, so the page declaration
  is unchanged.
- **Save:**
  - A save equal to the game price removes the proposal instead.
  - Discard deletes the document.
  - A document whose price is already in the game shows nothing.
- **Validation:** amounts are whole numbers from 1 to 9999. Unknown resources and buildings are ignored, as in
  `prices:sync`.
- **Free buildings** (e.g. Wheat Field) show "Free". A price can be added; it cannot be set back to free from the
  Studio.
- **Viewers** get the table read-only.
- **Outside Claude** (no page database) proposals stay in this browser; Copy prices JSON hands them over.

## Save/Load impact

None: Studio only. The game version does not change.

## Testing

- `node --test tests/studio-building-prices.test.js`:
  - the table equals the registry (every buildable building, default prices, cost resources);
  - draft editing rules;
  - untrusted documents;
  - `planPriceSync` accepts the documents;
  - the script output.
- `npm run studio:smoke`, Buildings in game:
  - all buildings are listed;
  - an invalid amount is refused;
  - change, add and save go to the mock database with the reviewer id and note;
  - the summary and hint show;
  - the last resource cannot be removed;
  - another reviewer's proposal appears live with a name, and a forged one is ignored;
  - Discard works;
  - a Viewer cannot edit;
  - the page fits a 390 px phone.
- `npm test`.

## Notes for the next agent

- „Převzít ceny“ is unchanged (AGENTS.md step 9): `db_list` the Studio's `prices` collection, run `prices:sync`, and
  after the release delete the documents listed under remove with `ifVersion`.
- After a price release, republish the Studio, so that Buildings in game shows the new game prices.
