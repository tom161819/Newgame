# prices:sync – building price proposals become the game's defaults (plan task, 7 Nov 2026)

## What and why
The owner sets building prices in the Asset Library (0.9.4) and, later, in the Studio's "Buildings in game" tab. The development chat applies them on the words „převzít ceny“. Tracked on the plan page as `m-prevzeti-cen-ze-studia` (spec there; copy in `zadani-ceny-budov.md`, part 2). The Studio tab (`g-studio-ceny-budov`) is not built yet; the script already accepts its document format and the Asset Library export.

## Files and systems
- `scripts/prices-sync-lib.mjs`: `normalizeProposals` (plain list, `{ proposals }`, or database documents `{ id, data }`), `planPriceSync` (validates building, resources and amounts with the game's own rules, newest proposal per building wins, reports applied / ignored / remove), `rewriteCost` (replaces one building's price literal in a definitions file: `id:'x' … cost:{…}` and the military `workshop('x', 'Name', {…})` helper, keeping the file's spacing style).
- `scripts/prices-sync.mjs` (`npm run prices:sync -- <file> [--dry-run] [--json]`): applies the plan to `src/data/objects/*.js`, verifies the new prices in a fresh process and restores the files if they do not match.
- `AGENTS.md`: the „převzít ceny“ procedure (point 9).
- `tests/prices-sync.test.js`.

## Implementation decisions
- `cost` is the whole new price, so resources missing from it are removed (owner's request).
- `remove` lists proposals that are applied, superseded or already equal to the game's price; invalid ones stay in the Studio for the owner to fix.
- Source rewriting instead of an override file keeps the definitions the single source of truth.

## Save/Load impact
None (a later price change only affects new constructions; standing buildings keep their paid price since 0.9.4).

## Testing
`npm test` passes; the new tests rewrite every buildable building's price (round trip), and run the script on a copy of `src/` and read the prices back from the registry.

## Notes for the next agent
- A building whose price is not a literal in `src/data/objects` is reported as ignored ("price is not a literal"); extend `rewriteCost` if a new definition style appears.
