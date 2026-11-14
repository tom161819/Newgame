# Castle: the click opens the card with the upgrade

## What and why
Owner, 15 Nov 2026 (screenshot): after a click on the Castle only the building detail showed (old description, hit points, demolition), no upgrade. Since 0.126.0 every building without its own window opens the detail; it covered the Castle's card.

## Files and systems
- `src/game/GameScene.js` `handleClick`: a Castle with a level opens its card and nothing else.
- `src/ui/DemolitionUI.js`: the Castle's detail shows the level and points to the card.
- `src/systems/WorkerAI.js`: `steppingAside` gives up after 6 s.

## Implementation decisions
- An old Castle (no level) still opens the detail too (it has the demolition text); its card opens beside it.

## Save/Load impact
None.

## Testing
- Browser (headless Chrome): a click on a level 1 Castle opens the card with "Upgrade to level 2", the detail stays closed. Full suite.

## Notes for the next agent
- The level definitions still carry the old keep's description.
