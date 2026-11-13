# Topení hradu a kasáren, tavírna 3 dřeva (navazuje na 37 a 38)

## What and why
Odpovědi vlastníka 13. 11. k úkolům 37 a 38: bonus +6 / −12 ano, spotřeba podle počtu lidí ne, topit i hrad
a kasárna ano, tavírna +1 dřevo ano, udírna a uhlíř zatím ne.

## Files and systems
- `src/data/heating.js`: `HEATED` (dům ×1 obyvatelé, hrad ×2 lidé v osadě, kasárna ×1 vojáci), `coldCombat` 0,9.
- `src/systems/HeatingSystem.js`: `occupied` (hrad vždy, kasárna když mají vojáky), `dayNeed`, `castle`,
  `combatFactor`; odhad na zimu počítá s násobky.
- `src/systems/NeedsSystem.js`: obyvatel s domovem „osada“ cítí teplo hradu.
- `src/systems/CombatSystem.js`: volba `damageScale`; `GameScene` ji napojí na `heating.combatFactor`.
- `src/systems/GameStateSerializer.js`: stav topení platí pro všechny vytápěné budovy.
- `src/ui/buildingTooltipContent.js`: řádek dřeva u hradu a kasáren.
- Tavírna: `production.js` (`input {iron_ore:3,wood:3}`, `fuel {wood:3}`, RECIPE_HISTORY s 2 dřevy), popisy
  a texty Wiki (cs/en, objects).
- Testy: `tests/heating.test.js` (+1), upravené `tests/smelting.test.js`, `smelting-integration.test.js`,
  `production-fuel.test.js`.

## Implementation decisions
- Hrad topí vždy (sídlo krále); jeho teplo cítí jen obyvatelé bez domu (spí v osadě), lidé v domech mají svůj dům.
- Kasárna topí, jen když k nim patří aspoň jeden voják; postih se uplatní jako násobek poškození v boji.
- Rozpracovaná várka tavírny ze staré hry se dodělá se 2 dřevy (RECIPE_HISTORY).

## Save/Load impact
SAVE_VERSION zůstává 62. Dřevníky `heat-<id>` u hradu a kasáren jsou nepovinné.

## Testing
- `npm test`: 1301 testů prošlo; `save-compat-smoke`, `heating-smoke` prošly.

## Notes for the next agent
- Udírna a uhlíř: vlastník zatím nechce.
