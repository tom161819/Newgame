# World window: pick the party by soldier class

## What and why
Owner 19 Nov 2026 (screenshot of the World window): the party was picked from one long row of names. He wants the soldier classes under each other with how many there are, a slider for how many go ("6 of 10"), an arrow per class that opens the soldiers by name with a tick each, and after every name an icon of what he is doing (guard, wall/tower patrol…) whose text shows on hover.

## What changed
- `WorldPanel.classes`: one row per class (Rytíř, Šermíř, Lučištník, Voják, Branec… in the army panel's rank order): ▸/▾ arrow, class name, slider 0…count, "N z M".
- The slider picks the first N of the class – soldiers on patrol first, then guard, walls, wolf hunt – and keeps the ones already ticked by hand where it can (`pickClass`).
- The open class lists the soldiers in two columns: tick, name, state icon 👣 patrol / 🛡️ guard / 🏰 walls and towers / 🐺 wolf hunt; hover text = order · what he is doing now (e.g. "Hlídka · Na stráži").
- Slider and ticks update each other and the Send button without rebuilding the window (the slider can be dragged). "All", the King and the Horse Wagon stay as before.

## Files and systems
`src/ui/WorldPanel.js` (`worldClasses`, `pickClass`, `ORDER_ICONS`), `src/i18n/cs.js`, `src/i18n/en.js`, `src/style.css`; test `tests/world-party-classes.test.js`.

## Implementation decisions
- Rows come from `armyRows` (the army panel), so class names, sorting and the order match the Army tab.
- Which classes are open is remembered while the window is open.

## Save/Load impact
None – UI only. SAVE_VERSION unchanged.

## Testing
- `tests/world-party-classes.test.js`: grouping and order, slider keeps hand-picked soldiers and leaves other classes alone.
- Headless Chrome (cs): 4 classes, slider sets "1 z 1" and enables Send, Lučištník opened shows names with icons and Czech hover texts; no page errors.
- `npm test`.

## Notes for the next agent
- Browser smoke: yes (done by hand for this change).
