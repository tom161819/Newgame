# Scenario templates from the Test map (owner point 86a)

## What and why
Owner, 20 Nov 2026: a game mode Conquest / Defence – start on a map with my army and take the enemy Castle (kill the King unless the template sets another goal). He asked how he, as the author, makes the Castle to be taken and places the soldiers, and how foreign kingdoms could later use the same Castle as a template.
Step 1: the Test map saves what stands on it as a template and loads it again; files can be exported and imported.

## Files and systems
- New `src/game/scenario.js`
  - Format `mk-scenario` v1: world (code, land, map size), goal (`king`, `castle`, `army`, `hold` + days), start (the middle of our army), buildings (type, place, side, gate axis, facing, level, look), units (ours: unit type; enemy / wild: animal type, `wall` for archers on a wall).
  - `captureScenario`, `normalizeScenario` (checks and cleans; refuses broken files), `applyScenario` (places on a fresh Test map of the same world; what cannot be placed is counted), browser storage `newgame.scenarios`, `scenarioFileName`.
- `src/game/sandboxMode.js` — `sandboxSettings(land,{worldCode})`; `setupSandbox` remembers the starting buildings (Castle, first store – left out of a template) and puts down a waiting template; the Test panel gets a "Template" part: name, goal (+ days), Save, Export file, Import file, a list with Load and Delete.
- `src/ui/GameApplication.js` — `startScenarioMap(template)`.
- `src/i18n/en.js`, `cs.js` — `scenario.*`; `src/style.css` — `.sandbox-template`.

## Implementation decisions
- A description, not a saved game: it keeps working across versions while the world code makes the same world.
- Only what was put down on the Test map is saved (units with `sandbox`), not the world's own animals, which come again with the world.
- Our units in the template are the starting army; their middle is the start.

## Save/Load impact
None for saved games. Templates live in the browser (localStorage) and in files.

## Testing
New `tests/scenario.test.js` (checks, storage, file name). Browser: enemy House and Tower, our Well, 5 Swordsmen and 5 enemy soldiers saved and loaded on the same world – all back in place, the enemy buildings still enemy.

## Notes for the next agent
86b (Conquest) reads `scene.scenario` / a stored template: the enemy King unit, the goal check, supplies at the start, the enemy counter-attacks and the end screen.
