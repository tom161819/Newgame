# Test map: a sandbox from the main menu (0.143.0)

## What and why
Owner 16 Nov 2026: "add a Test map under the World Editor in the main menu – add soldiers, build every building without materials (without residents), add enemy soldiers, bandits, animals – to test battles: put soldiers and enemy soldiers there and send them against each other."

## Files and systems
- `src/game/sandboxMode.js` (new): `sandboxSettings` (fog off, night threats off, Castle, no garrison), `setupSandbox` (King away, free `canAfford`, guides off, feed without join/royal lines), `placeSandboxBuilding` (free, finished at once – no `construction`, like the starting Castle), `SANDBOX_UNITS` / `SANDBOX_COUNTS`, `tilesAround`, `spawnSandboxUnits`, `removeSandboxUnit`, `clearSandboxUnits`, the Test panel (`#sandbox-panel`) with the map tool on left click.
- `GameScene.init({sandbox})`; no initial residents or garrison; autosave off; pointerdown goes to the Test panel first; placement goes to `placeSandboxBuilding`.
- `GameApplication.startTestMap`, `start(state, settings, zone, sandbox)`; `snapshot()` refuses on the test map. `index.html`: `#main-test-map`.
- `BuildingUnlockManager.status`: everything unlocked on the test map (except the one-Castle limit). `NeedsSystem.closeDay` and `WorkerSystem.onNewDay` off on the test map.
- CSS `.sandbox-panel`, `body.in-sandbox`.

## Implementation decisions
A minor version because a new game mode is added (no save change: the test map is never saved). Buildings without a construction record count as finished everywhere (like the starting Castle).

## Save/Load impact
None; the test map cannot be saved and the real game's autosave is not touched.

## Testing
tests/sandbox.test.js; full suite; browser: Test map from the menu, 10 Soldiers + 10 Archers + 10 Raiders + 10 Bandits by clicks, a free finished Barracks, "Ours attack" – battle bar, won 16 v 1 left; save refused; no errors.

## Notes for the next agent
Enemy armies with their own orders (marching on the Castle, sieges) are the next war step; the test map is where to try them.
