# Children and the Village Green D1 (0.29.0)

## What and why
Plan task m-deti-d1-naves (brief `zadani-deti-naves.md`, approved by the owner on 7 Nov in the Koncepty chat). Children only liven up the village and add to happiness through the new Village Green. They do not grow into residents.

## Files and systems
- `src/data/children.js` – `CHILDREN` (counts per residents, cap 40, distances, speeds, activity times, winter/summer rules, danger radius 10 and hide time ¼ day, snowmen, names, ages), `VILLAGE_GREEN` (range 10, +4, family +2, 4 evening seats in the first 45 % of rest time), `childCount`, `allocateChildren` (cap spread evenly), small seeded hash/RNG.
- `src/systems/ChildrenSystem.js` – families from the stored homes (#58 B), children (deterministic id `child-<house>-<i>`, name, sex, age, look), daily cycle (out by day, in at rest time with a staggered morning start), activities (near the house within 6 tiles, a green within 15, the shore within 12 in summer, snow in winter), danger from wild boars, snowmen (max 6, melt when winter ends), `greenBonus`, `housesInRange`, `playingAt`, `eveningSeat` (DailyRest), click hit-test, save/validate.
- `src/data/objects/housing.js` – `village_green` (3×3, Housing, 10 Wood + 6 Stone, requires a completed House, walkable, renderer `village_green`); `public/assets/buildings/village_green/village_green.svg` for the menu.
- `src/game/VillageGreenView.js` – provisional green (grass, worn play patch, linden with a swing, bench; seasonal), reach ellipse with the houses in reach outlined in the placement preview and while the panel is open.
- `src/game/ChildViews.js` – provisional children (smaller figures, six colour sets, girls with plaits; hoop, ball, swing, snowball props) and snowmen; only those on screen and in sight are drawn.
- `src/ui/VillagePanel.js` + `#village-dialog` – House (residents, children, green bonus), Village Green (help, houses and families in reach, children playing now), child (name, age, home).
- `src/systems/NeedsSystem.js` / `src/ui/NeedsDisplay.js` – `green` (+4) and `greenFamily` (+2) in Happiness with tooltip lines.
- `src/systems/DailyRest.js` – evening seats on the green (`greenSeat`), then home.
- `src/game/GameScene.js` – wiring (system, views, panel, renderer, clicks, season repaint); `GameApplication` `mkDev.fillChildren(n)` for performance checks.
- Save: `children` (SAVE_VERSION 54), loader after the residents.
- Tests `tests/children.test.js` (9); count tests updated for the new building. Smoke `scripts/children-smoke.mjs` (`--children`, part of `--full`).

## Implementation decisions
- **Children are not workers.** They live in their own system, so they are automatically outside the population, food, wages, employment, commands and animal targeting.
- **Which children exist is recomputed** from the homes (house id + number of residents → count, cap 40 spread round-robin). The save keeps only what cannot be recomputed: positions and in/out state, houses hidden after a boar, snowmen, the day of the last boar notice.
- **Path wear: none.** Children wander off the roads on purpose; letting them wear paths would trample the whole village into dirt.
- **Movement:** a path is searched once per trip (going to an activity, home); play itself is short straight hops around the activity spot, only onto walkable tiles.
- **Village Green walkable** like fields (nothing can be built on it, people walk across). The tree and bench are decoration; the swing hangs from the tree.
- **Evening on the green:** in the first 45 % of rest time up to 4 residents living in reach of a green (lowest ids) rest on the green tiles, then walk home. Their rest recovery is the same as at home (purely cosmetic). During a Feast everyone with a home gathers on the nearest green, and children stay out there in that part of the evening. Today the Feast gathers nobody without a green (it never did).
- **Danger:** any living wild boar within 10 tiles of a child sends the children around home and keeps their houses' children inside for ¼ day; one feed notice per day.
- **Off-screen and fog:** the logic is cheap and always runs; drawing is skipped. 40 children measured at about 51 FPS in the headless smoke browser.

## Save/Load impact
SAVE_VERSION 54: new optional `children` block (validated: ids, positions, states, hidden houses must exist, at most 6 snowmen). Older saves load with no saved positions, so children start inside and come out.

## Testing
`npm test` (935). Smokes: `--children`, plus `--needs --housing --policy --background --pets --dog --walk`.

## Notes for the next agent
- Art is provisional (VillageGreenView, ChildViews); replace with the approved Studio art from g-deti-naves-grafika (children walk/run cycles, play animations, green variants, snowmen).
- D2 (m-deti-d2-ozdoby: swing tree, haystack, well, +8 cap on all house-surroundings bonuses) can reuse `greenBonus` and the activity system (`CHILDREN.activities`).
