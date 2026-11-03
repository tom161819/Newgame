# Upgrade progress

## Aktuální práce

Krok 24: fáze A (`fb5aaf2`) a B jsou dokončené; následuje fáze C. Master zatím NEBYL zahájen. Kroky 22 a 23 jsou publikované, poslední veřejná hra je commit `74628eb` (Pages `41669016548`, Success). Před krokem 24 existuje checkpoint `e2fe98c`. Fáze A ověřena 228/228 testy, buildem a prohlížečem. Fáze B ověřena 242/242 testy (14 nových), buildem, skutečným přiřazením dvou nosičů přes UI, přepravou 38+2 Iron, přesným plným Save/Load přes IndexedDB během cesty a mobilním UI bez JS/HTTP chyb. Skutečný save z Git commitu `fb5aaf2` migruje osm skillů na devět a přidá prázdná pracovní místa bez změny zásob, talentů či králova nákladu. Commit fáze B obsahuje tento záznam. Zásobování staveb a fáze C–D zbývají. Průběžné commity chrání větev `backup/step-24-progress`; publikace celé logistiky na main následuje až po D.

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
