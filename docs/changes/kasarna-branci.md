# kasarna-branci: Recruits in the Barracks

## What and why
Owner, 9 Nov 2026: "pokud vojáci jsou jakoby zaměstnanci kasárny, tak to udělat tak, že základní zaměstnanec je
Branec, má basic staty pro boj a může dělat hlídky, když jsou zbraně tak může být vycvičen na lepšího vojáka
(lukostřelec atd.). Kapacitu upravit na 12."

Everyone employed in a Barracks is now a Recruit until trained: basic combat stats, patrols, defends, wage 1. With
items in an Armory a Recruit trains into one of the four unit types and keeps the seat. The Barracks holds 12.

## Files and systems
- `src/data/military.js`: `RECRUIT` (modifiers: +10 max HP). `src/data/economy.js`: `BASE_DAILY_WAGES.recruit` = 1.
- `src/data/workplaces.js`: Barracks capacity 12. Descriptions in `src/data/objects/buildings.js`,
  `src/i18n/objects.cs.js`, `src/i18n/objects.en.js`.
- `src/systems/MilitarySystem.js`: `isRecruit`, `wageProfession`, `syncRecruits` (stats follow the job every update),
  `apply` gives a Recruit the `RECRUIT` modifiers, `updateSoldier` lets Recruits defend, `blocker` accepts Recruits.
- `src/systems/WageSystem.js`: the wage table entry comes from `military.wageProfession`.
- `src/ui/militaryPanel.js`: `militaryRank`, places line, two lists (Recruits, trained units).
  `src/ui/PopulationSidebar.js`: rank in rows and in the Soldiers group. Texts in `src/i18n/cs.js`, `en.js`.
- `scripts/soldiers-smoke.mjs`: `recruitsSmoke` (`--recruits`); `tests/military-units.test.js`,
  `tests/workplaces.test.js`.

## Implementation decisions
- A Recruit is not a saved thing: any living resident with the `soldier` profession who is not a trained unit.
  Stats are worked out from that on every update, so old saves need nothing.
- Patrolling already belonged to the `soldier` profession (WorkerAI); Recruits get it for free.
- A trained unit wears its type's modifiers instead of the Recruit's, not on top.
- Started on 0.85.0 by an agent that was stopped; ported onto 0.92.0 from the stash, the balance part of that stash
  had already shipped in 0.91.0.

## Save/Load impact
None. SAVE_VERSION stays 62. Soldiers without a unit type in an old save are Recruits after the load.

## Testing
- `npm test`: 1251 pass (new: Recruits test; capacity 12 in the workplace test).
- Browser: `--recruits` and `--soldiers` pass.

## Notes for the next agent
- Auto Employment fills free Barracks places like any other workplace (sector Defense). With 12 places it can draft
  up to 12 unemployed residents, each for 1 Gold a day. If the owner minds, give the Barracks a staffing limit or a
  lower default priority.
- Recruit stats are one number (`RECRUIT.modifiers.maxHP`); attack is the resident's own 6 DPS.
