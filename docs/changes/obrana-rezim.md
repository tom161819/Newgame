# Defence mode (owner point 86c)

## What and why
Owner, 20 Nov 2026: Defence – the enemy comes from places the author marks in the template (a mark by the map edge; with more waves and more marks a random mark is chosen each time, so attacks come from random sides); waves are set in the template and must be clear, intuitive and easy; the Defence is lost when the King falls.

## Files and systems
- `src/game/scenario.js` — the goal `defend` (the old `hold` reads as `defend`); `spawns` (attack points, at most 8), `king` (our King's place) and `waves` (`after` game minutes from the wave before, counts of `WAVE_UNITS`: Recruit, Archer, Swordsman, Knight; at most 20 waves, 200 of a kind).
- New `src/game/scenarioMarks.js` — the marks on the Test map: red flags for attack points, a gold crown for our King; put by the tools, taken away by Remove.
- `src/game/sandboxMode.js` — Test panel: "🚩 Attack point" and "👑 Our King" tools; for the Defence goal a wave table (minutes and four counts per row, × removes, "+ Add a wave" copies the last wave half as big again); a Defence keeps our Castle.
- `src/game/conquest.js` — Defence: our King stands at his mark (else at the army's start), supply wagons by him; each wave at its time from a random attack point (no points: a random place by the edge), marching on the King; the feed says from which side ("from the north-west"); the status shows "Wave 2 of 5 in 3 min"; won when the last wave is beaten, lost when the King falls. `sideOf`, `edgePoint`.
- `src/game/GameScene.js` — in a Defence the fallen King ends it with the Conquest window instead of the game-over window.
- `src/ui/GameApplication.js`, i18n (`scenario.*`, `defence.*`, the menu now "Conquest / Defence"), `src/style.css` (the wave table).

## Implementation decisions
- One menu entry for both modes: the template's goal decides.
- Waves are counted in game minutes, so speeding the game up brings them sooner.
- Enemies already standing in the template (not in a wave) also have to be beaten for the win.

## Save/Load impact
None (Conquest and Defence are not saved; templates are in the browser and files; older templates still load).

## Testing
`tests/conquest.test.js` (waves in order from the chosen point, the win after the last wave, the loss with the King, sides, edge point); `tests/scenario.test.js` (attack points, King, waves, the old "hold"). Browser: a template with a Tower, 5 Archers, the King's mark, two attack points and two waves; Defence from the menu – the King at his place, our Castle there, wave 1 came from the south-west attack point and marched on the King, the status counted down, after both waves Victory.

## Notes for the next agent
Known: the economy HUD and the low-food notice still show in Conquest and Defence.
