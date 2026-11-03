# Upgrade progress

## Aktuální práce

Krok 24: fáze A (`fb5aaf2`), B (`f4e621b`), C (`a454fe9`) a D jsou dokončené. Zbývá archiv a publikace s ověřením Pages; poté začne master. Poslední veřejná hra je zatím krok 23, commit `74628eb` (Pages `41669016548`, Success). Checkpoint před 24: `e2fe98c`. A: 228/228 testů; B: 242/242; C: 259/259 a skutečný schema6 save; D: 271/271 (12 nových integračních scénářů), build, skutečná hra/UI/IndexedDB/mobil, viditelné náklady a šest disjunktních kategorií, plný potravinový řetězec 8 Wheat → 12 Bread, bezpečná obnova přerušených pokynů, ruční královo vyzvednutí/odložení. Skutečný publikovaný schema5 save z `74628eb` zachoval 85 Stone, 30 Apple, 77 Gold, talent i XP, bez dalšího Starter Stockpile; neplatný úkol s 10 nesenými Stone se v prohlížeči obnovil a doručil bez odměny za zrušenou cestu. Zimní mapa 100×100 s 20 NPC / 6 Hauler / 3 Granary / 2 Warehouse / 4 staveništi / 4 výrobami / 22 pozemky: průměr 17,61 ms (~57 FPS), p95 33,3 ms, bez JS chyb, validní snapshot. Commit D obsahuje tento záznam. Průběžné commity chrání `backup/step-24-progress`; na main se nyní připraví ověřený archiv a celé nasazení. Master dosud NEBYL zahájen.

## Master: 15 etap, 5 milníků

Všechny etapy jsou PENDING za krokem 24. U dokončené etapy doplnit konkrétní chování, testy (passed/failed/skipped), commit, stav milníku a další etapu. DONE lze zapsat pouze po implementaci a skutečné kontrole.

| Etapa | Krok | Milník | Stav | Commit / ověření |
|---|---|---|---|---|
| 01 | 29A: Version Archive, Changelog & Release Foundation | M1 | PENDING | Nezahájeno |
| 02 | 36: Building Categories & Unlock Requirements | M1 | PENDING | Nezahájeno |
| 03 | 33: Seasons ON/OFF | M1 | PENDING | Nezahájeno |
| 04 | 28: Circular Fog of War & Map Memory | M1 | PENDING | Nezahájeno |
| 05 | 30: Population Sidebar & Skill Sorting | M1 | PENDING | Nezahájeno |
| 06 | 32: Missing Workers Indicator | M1 | PENDING | Nezahájeno |
| 07 | 25: Forestry & Natural Resources | M2 | PENDING | Nezahájeno |
| 08 | 31A: Extended Zoom Out | M2 | PENDING | Nezahájeno |
| 09 | 31B: Daily Resource Statistics & Ledger | M2 | PENDING | Nezahájeno |
| 10 | 35: Quarry Placement & Iron Smelter | M2 | PENDING | Nezahájeno |
| 11 | 37: Stone Pavement & Courtyards | M3 | PENDING | Nezahájeno |
| 12 | 34: Wheelwright, Wagons, Stables & Housing | M3 | PENDING | Nezahájeno |
| 13 | 26: Villager Needs & Happiness | M4 | PENDING | Nezahájeno |
| 14 | 27: Merchants, Caravans & Trade | M4 | PENDING | Nezahájeno |
| 15 | 29B: Background Simulation & Catch-up | M5 | PENDING | Nezahájeno |

## Release gates

M1 (01–06), M2 (07–10), M3 (11–12), M4 (13–14), M5 (15): PENDING. Žádné nové číslo ani tag zatím nevydáno. Současná hra má `0.1.0`; budoucí číslo určit z aktuálního package.json a existujících tagů až při úspěšném gate.

## Následující vizuální upgrade

Visual Polish & Art Pass, fáze A–E: PENDING až po celém masteru. Úplné zadání je v `docs/requests/visual-polish-art-pass.md`.
